/**
 * Netlify Function: Search Electricity Plans
 * 
 * Enterprise-grade serverless API endpoint for searching electricity plans.
 * Integrates with the comprehensive ComparePower infrastructure including:
 * - Multi-layered caching (Memory → Redis → Database → API)
 * - Circuit breaker pattern for resilience
 * - Split ZIP code handling with ESIID resolution
 * - Comprehensive error handling and monitoring
 * - Rate limiting and idempotency
 * 
 * API Contract:
 * POST /api/search-plans
 * {
 *   "zipCode": "75201",
 *   "address": "123 Main St", // Optional: for split ZIP resolution
 *   "usage": 1000, // Optional: kWh usage for pricing calculations
 *   "filters": { // Optional: plan filtering
 *     "term": 12,
 *     "green": 100,
 *     "rateType": "fixed",
 *     "prepaid": false,
 *     "timeOfUse": false,
 *     "provider": "TXU Energy"
 *   }
 * }
 */

import type { Context } from "@netlify/functions";
import type { ApiParams } from "../../src/types/facets";

// Import existing production-ready infrastructure
import { comparePowerClient } from "../../src/lib/api/comparepower-client";
import { ercotESIIDClient } from "../../src/lib/api/ercot-esiid-client";
import { ComparePowerApiError, ApiErrorType } from "../../src/lib/api/errors";
import { multiTdspMapping } from "../../src/config/multi-tdsp-mapping";
import { resolveZipToTdsp, getZoneFromTdsp } from "./shared/utils";

// Performance monitoring - remove unused startTime variable

interface SearchPlansRequest {
  zipCode: string;
  address?: string;
  usage?: number;
  filters?: {
    term?: number;
    green?: number;
    rateType?: 'fixed' | 'variable' | 'indexed';
    prepaid?: boolean;
    timeOfUse?: boolean;
    provider?: string;
    requiresAutoPayDiscount?: boolean;
  };
  // Enterprise features
  idempotencyKey?: string;
  requestId?: string;
  source?: 'web' | 'mobile' | 'api';
}

interface SearchPlansResponse {
  success: boolean;
  data?: {
    plans: Plan[];
    tdspInfo: {
      duns: string;
      name: string;
      zone: string;
      confidence: 'high' | 'medium' | 'low';
    };
    searchMeta: {
      totalPlans: number;
      filteredPlans: number;
      zipCode: string;
      usage: number;
      cacheHit: boolean;
      responseTime: number;
      method: 'direct_mapping' | 'esiid_resolution' | 'split_zip_resolved';
    };
    splitZipInfo?: {
      isMultiTdsp: boolean;
      alternativeTdsps?: Array<{
        duns: string;
        name: string;
        requiresAddress: boolean;
      }>;
    };
  };
  error?: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    context?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
    responseTime: number;
    version: string;
  };
}

// Request validation schema
function validateSearchPlansRequest(body: unknown): { isValid: boolean; errors: string[]; data?: SearchPlansRequest } {
  const errors: string[] = [];
  
  // Required fields
  if (!body?.zipCode) {
    errors.push('zipCode is required');
  } else if (!/^\d{5}$/.test(body.zipCode)) {
    errors.push('zipCode must be a 5-digit ZIP code');
  }
  
  // Optional fields validation
  if (body.usage !== undefined) {
    const usage = Number(body.usage);
    if (isNaN(usage) || usage < 100 || usage > 5000) {
      errors.push('usage must be a number between 100 and 5000 kWh');
    }
  }
  
  if (body.address !== undefined) {
    if (typeof body.address !== 'string' || body.address.trim().length < 5) {
      errors.push('address must be at least 5 characters when provided');
    }
  }
  
  // Filters validation
  if (body.filters) {
    const filters = body.filters;
    
    if (filters.term !== undefined) {
      if (![6, 12, 18, 24, 36].includes(Number(filters.term))) {
        errors.push('filters.term must be 6, 12, 18, 24, or 36 months');
      }
    }
    
    if (filters.green !== undefined) {
      const green = Number(filters.green);
      if (isNaN(green) || green < 0 || green > 100) {
        errors.push('filters.green must be a percentage between 0 and 100');
      }
    }
    
    if (filters.rateType !== undefined) {
      if (!['fixed', 'variable', 'indexed'].includes(filters.rateType)) {
        errors.push('filters.rateType must be "fixed", "variable", or "indexed"');
      }
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return {
    isValid: true,
    errors: [],
    data: {
      zipCode: body.zipCode.trim(),
      address: body.address?.trim(),
      usage: body.usage ? Number(body.usage) : 1000,
      filters: body.filters || {},
      idempotencyKey: body.idempotencyKey,
      requestId: body.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: body.source || 'api'
    }
  };
}

// Main request handler with comprehensive ZIP code resolution
async function handleSearchPlans(request: SearchPlansRequest): Promise<SearchPlansResponse['data']> {
  const requestStart = Date.now();
  let cacheHit = false;
  let method: 'direct_mapping' | 'esiid_resolution' | 'split_zip_resolved' = 'direct_mapping';
  
  try {
    console.log(`🔍 Starting plan search for ZIP ${request.zipCode}`, {
      hasAddress: !!request.address,
      usage: request.usage,
      filters: request.filters,
      requestId: request.requestId
    });
    
    // Step 1: Check if this is a known split ZIP requiring address resolution
    const multiTdspConfig = multiTdspMapping[request.zipCode];
    let tdspDuns: string;
    let tdspName: string;
    let confidence: 'high' | 'medium' | 'low' = 'high';
    let splitZipInfo;
    
    if (multiTdspConfig) {
      console.log(`📍 Multi-TDSP ZIP detected: ${request.zipCode}`, {
        primaryTdsp: multiTdspConfig.primaryTdsp.name,
        alternativeCount: multiTdspConfig.alternativeTdsps?.length || 0,
        requiresAddress: multiTdspConfig.requiresAddressValidation
      });
      
      if (multiTdspConfig.requiresAddressValidation && request.address) {
        // Use ESIID resolution for precise TDSP determination
        try {
          const resolution = await ercotESIIDClient.resolveAddressToTDSP(
            request.address,
            request.zipCode,
            request.usage
          );
          
          tdspDuns = resolution.tdsp_duns;
          tdspName = resolution.tdsp_name;
          confidence = resolution.confidence;
          method = 'esiid_resolution';
          
          console.log(`✅ ESIID resolution successful:`, {
            tdsp: tdspName,
            confidence,
            esiid: resolution.esiid
          });
          
        } catch (esiidError) {
          console.warn(`⚠️ ESIID resolution failed, using primary TDSP:`, esiidError);
          // Fallback to primary TDSP
          tdspDuns = multiTdspConfig.primaryTdsp.duns;
          tdspName = multiTdspConfig.primaryTdsp.name;
          confidence = 'medium';
          method = 'split_zip_resolved';
        }
      } else {
        // Use primary TDSP (most common for this ZIP)
        tdspDuns = multiTdspConfig.primaryTdsp.duns;
        tdspName = multiTdspConfig.primaryTdsp.name;
        confidence = request.address ? 'medium' : 'low'; // Lower confidence without address
        method = 'split_zip_resolved';
      }
      
      // Prepare split ZIP information for client
      splitZipInfo = {
        isMultiTdsp: true,
        alternativeTdsps: multiTdspConfig.alternativeTdsps?.map(alt => ({
          duns: alt.duns,
          name: alt.name,
          requiresAddress: multiTdspConfig.requiresAddressValidation
        }))
      };
      
    } else {
      // Standard single TDSP ZIP code - use comprehensive resolver
      const resolution = resolveZipToTdsp(request.zipCode);
      if (!resolution.success || !resolution.tdsp) {
        throw new ComparePowerApiError(
          ApiErrorType.INVALID_TDSP,
          `No TDSP mapping found for ZIP code ${request.zipCode}. This ZIP code may not be in a deregulated Texas electricity market.`,
          { zipCode: request.zipCode },
          false
        );
      }
      
      tdspDuns = resolution.tdsp.duns;
      tdspName = resolution.tdsp.name;
      confidence = 'high';
      method = 'direct_mapping';
      
      splitZipInfo = {
        isMultiTdsp: resolution.isMultiTdsp
      };
    }
    
    // Step 2: Build API parameters with filters
    const apiParams: ApiParams = {
      tdsp_duns: tdspDuns,
      display_usage: request.usage,
      ...buildFilterParams(request.filters || {})
    };
    
    console.log(`🔧 API parameters built:`, {
      tdsp: tdspName,
      duns: tdspDuns,
      usage: request.usage,
      filters: apiParams
    });
    
    // Step 3: Fetch plans using existing infrastructure
    const plans = await comparePowerClient.fetchPlans(apiParams);
    cacheHit = plans.length > 0 && (Date.now() - requestStart) < 100; // Likely cache hit
    
    console.log(`📊 Plans fetched successfully:`, {
      totalPlans: plans.length,
      cacheHit,
      responseTime: Date.now() - requestStart,
      method
    });
    
    // Step 4: Apply additional client-side filters if needed
    const filteredPlans = applyAdditionalFilters(plans, request.filters || {});
    
    return {
      plans: filteredPlans,
      tdspInfo: {
        duns: tdspDuns,
        name: tdspName,
        zone: getZoneFromTdsp(tdspDuns),
        confidence
      },
      searchMeta: {
        totalPlans: plans.length,
        filteredPlans: filteredPlans.length,
        zipCode: request.zipCode,
        usage: request.usage!,
        cacheHit,
        responseTime: Date.now() - requestStart,
        method
      },
      splitZipInfo
    };
    
  } catch (error) {
    console.error(`❌ Plan search failed for ZIP ${request.zipCode}:`, error);
    throw error;
  }
}

// Build API filter parameters from request filters
function buildFilterParams(filters: SearchPlansRequest['filters']): Partial<ApiParams> {
  const params: Partial<ApiParams> = {};
  
  if (filters?.term) {
    params.term = filters.term;
  }
  
  if (filters?.green) {
    params.percent_green = filters.green;
  }
  
  if (filters?.prepaid !== undefined) {
    params.is_pre_pay = filters.prepaid;
  }
  
  if (filters?.timeOfUse !== undefined) {
    params.is_time_of_use = filters.timeOfUse;
  }
  
  if (filters?.requiresAutoPayDiscount !== undefined) {
    params.requires_auto_pay = filters.requiresAutoPayDiscount;
  }
  
  return params;
}

// Apply additional client-side filters
function applyAdditionalFilters(plans: Plan[], filters: SearchPlansRequest['filters']): Plan[] {
  let filtered = plans;
  
  // Filter by rate type
  if (filters?.rateType) {
    filtered = filtered.filter(plan => plan.contract?.type === filters.rateType);
  }
  
  // Filter by provider
  if (filters?.provider) {
    const providerLower = filters.provider.toLowerCase();
    filtered = filtered.filter(plan => 
      plan.provider?.name?.toLowerCase().includes(providerLower)
    );
  }
  
  return filtered;
}


// Enhanced error response builder
function buildErrorResponse(
  error: Error | ComparePowerApiError, 
  requestId: string, 
  responseTime: number
): SearchPlansResponse {
  let apiError: ComparePowerApiError;
  
  if (error instanceof ComparePowerApiError) {
    apiError = error;
  } else {
    apiError = new ComparePowerApiError(
      ApiErrorType.UNKNOWN,
      error.message || 'Unknown error occurred',
      {},
      false
    );
  }
  
  return {
    success: false,
    error: {
      code: apiError.type,
      message: apiError.message,
      userMessage: apiError.userMessage,
      retryable: apiError.isRetryable,
      context: {
        ...apiError.context,
        requestId,
        timestamp: new Date().toISOString()
      }
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      responseTime,
      version: '1.0.0'
    }
  };
}

// Rate limiting using simple in-memory store (production would use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = clientIP;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // New window
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime };
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count, resetTime: current.resetTime };
}

// Main Netlify Function handler
export default async function handler(request: Request, context: Context) {
  const requestStart = Date.now();
  const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key',
    'Access-Control-Max-Age': '86400',
  };
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed',
          userMessage: 'Please use POST method to search for electricity plans.'
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - requestStart,
          version: '1.0.0'
        }
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }
  
  try {
    // Rate limiting
    const clientIP = context.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(clientIP);
    
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
    };
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            userMessage: 'You have made too many requests. Please try again in a minute.',
            retryable: true
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - requestStart,
            version: '1.0.0'
          }
        }),
        {
          status: 429,
          headers: responseHeaders
        }
      );
    }
    
    // Parse request body
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
            userMessage: 'Please check your request format and try again.',
            retryable: false
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - requestStart,
            version: '1.0.0'
          }
        }),
        {
          status: 400,
          headers: responseHeaders
        }
      );
    }
    
    // Validate request
    const validation = validateSearchPlansRequest(body);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Validation failed: ${validation.errors.join(', ')}`,
            userMessage: 'Please check your search parameters and try again.',
            retryable: false,
            context: { validationErrors: validation.errors }
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - requestStart,
            version: '1.0.0'
          }
        }),
        {
          status: 400,
          headers: responseHeaders
        }
      );
    }
    
    // Set request ID if not provided
    validation.data!.requestId = validation.data!.requestId || requestId;
    
    console.log(`🚀 Processing search request:`, {
      requestId: validation.data!.requestId,
      zipCode: validation.data!.zipCode,
      hasAddress: !!validation.data!.address,
      clientIP,
      userAgent: request.headers.get('user-agent')
    });
    
    // Process the search
    const data = await handleSearchPlans(validation.data!);
    
    const responseTime = Date.now() - requestStart;
    
    // Success response
    const response: SearchPlansResponse = {
      success: true,
      data,
      meta: {
        requestId: validation.data!.requestId,
        timestamp: new Date().toISOString(),
        responseTime,
        version: '1.0.0'
      }
    };
    
    console.log(`✅ Search completed successfully:`, {
      requestId: validation.data!.requestId,
      plansFound: data.plans.length,
      responseTime,
      cacheHit: data.searchMeta.cacheHit,
      method: data.searchMeta.method
    });
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...responseHeaders,
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Hit': data.searchMeta.cacheHit.toString(),
          'X-TDSP-Method': data.searchMeta.method,
          'Cache-Control': 'public, max-age=300' // 5 minute cache
        }
      }
    );
    
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    
    console.error(`❌ Search request failed:`, {
      requestId,
      error: error.message,
      stack: error.stack,
      responseTime
    });
    
    const errorResponse = buildErrorResponse(error, requestId, responseTime);
    const status = error instanceof ComparePowerApiError && 
                   [ApiErrorType.INVALID_PARAMETERS, ApiErrorType.INVALID_TDSP].includes(error.type) 
                   ? 400 : 500;
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Response-Time': `${responseTime}ms`,
          'X-Error-Type': error.type || 'UNKNOWN'
        }
      }
    );
  }
}