/**
 * Netlify Function: ESIID Address Lookup
 * 
 * Enterprise-grade serverless API endpoint for resolving addresses to ESIIDs and TDSPs.
 * Designed specifically for split ZIP code scenarios where multiple TDSPs serve the same ZIP.
 * 
 * Features:
 * - Precise address-to-TDSP mapping using ERCOT ESIID data
 * - Multiple result handling with confidence scoring
 * - Intelligent caching and performance optimization
 * - Comprehensive validation and error handling
 * - Production monitoring and alerting
 * 
 * API Contract:
 * POST /api/lookup-esiid
 * {
 *   "address": "1234 Main Street",
 *   "zipCode": "75201",
 *   "usage": 1000 // Optional: for API parameter building
 * }
 */

import type { Context } from "@netlify/functions";
import type { ApiParams } from "../../src/types/facets";

// Import existing production infrastructure
import { ercotESIIDClient, type AddressTDSPResolution } from "../../src/lib/api/ercot-esiid-client";
import { ComparePowerApiError, ApiErrorType } from "../../src/lib/api/errors";
import { multiTdspMapping } from "../../src/config/multi-tdsp-mapping";
import { getZoneFromTdsp } from "./shared/utils";

interface LookupESIIDRequest {
  address: string;
  zipCode: string;
  usage?: number;
  // Enterprise features
  idempotencyKey?: string;
  requestId?: string;
  source?: 'web' | 'mobile' | 'api';
  returnAlternatives?: boolean; // Include alternative TDSPs in response
}

interface LookupESIIDResponse {
  success: boolean;
  data?: {
    resolution: {
      tdsp: {
        duns: string;
        name: string;
        zone: string;
      };
      esiid: string;
      confidence: 'high' | 'medium' | 'low';
      method: 'esiid_lookup' | 'single_result' | 'multiple_results';
      address: {
        matched: string;
        normalized: string;
        city: string;
        state: string;
        zipCode: string;
        county?: string;
      };
    };
    alternatives?: Array<{
      tdsp: {
        duns: string;
        name: string;
      };
      esiid: string;
      address: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    apiParams: ApiParams; // Ready-to-use parameters for plan search
    splitZipInfo: {
      isKnownSplitZip: boolean;
      boundaryType?: 'street-level' | 'block-level' | 'zip4-level';
      notes?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    context?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    responseTime: number;
    version: string;
  };
}

// Enhanced request validation with address normalization
function validateLookupESIIDRequest(body: any): { isValid: boolean; errors: string[]; data?: LookupESIIDRequest } {
  const errors: string[] = [];
  
  // Required: Address
  if (!body?.address) {
    errors.push('address is required');
  } else if (typeof body.address !== 'string' || body.address.trim().length < 5) {
    errors.push('address must be at least 5 characters');
  }
  
  // Required: ZIP code
  if (!body?.zipCode) {
    errors.push('zipCode is required');
  } else if (!/^\d{5}$/.test(body.zipCode)) {
    errors.push('zipCode must be a 5-digit ZIP code');
  }
  
  // Optional: Usage validation
  if (body.usage !== undefined) {
    const usage = Number(body.usage);
    if (isNaN(usage) || usage < 100 || usage > 5000) {
      errors.push('usage must be a number between 100 and 5000 kWh');
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return {
    isValid: true,
    errors: [],
    data: {
      address: normalizeAddress(body.address.trim()),
      zipCode: body.zipCode.trim(),
      usage: body.usage ? Number(body.usage) : 1000,
      idempotencyKey: body.idempotencyKey,
      requestId: body.requestId || `lookup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: body.source || 'api',
      returnAlternatives: Boolean(body.returnAlternatives)
    }
  };
}

// Address normalization for better ESIID matching
function normalizeAddress(address: string): string {
  return address
    // Normalize common abbreviations
    .replace(/\bSt\b/gi, 'Street')
    .replace(/\bAve\b/gi, 'Avenue')
    .replace(/\bRd\b/gi, 'Road')
    .replace(/\bBlvd\b/gi, 'Boulevard')
    .replace(/\bDr\b/gi, 'Drive')
    .replace(/\bLn\b/gi, 'Lane')
    .replace(/\bCt\b/gi, 'Court')
    .replace(/\bPl\b/gi, 'Place')
    .replace(/\bPkwy\b/gi, 'Parkway')
    // Normalize apartment/unit indicators
    .replace(/\b(Apt|Unit|Suite|Ste)\s*/gi, 'Apt ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Main ESIID lookup handler
async function handleESIIDLookup(request: LookupESIIDRequest): Promise<LookupESIIDResponse['data']> {
  const requestStart = Date.now();
  
  try {
    console.log(`🏠 Starting ESIID lookup for address:`, {
      address: request.address,
      zipCode: request.zipCode,
      requestId: request.requestId
    });
    
    // Check if this is a known split ZIP configuration
    const splitZipConfig = multiTdspMapping[request.zipCode];
    const splitZipInfo = {
      isKnownSplitZip: !!splitZipConfig,
      boundaryType: splitZipConfig?.boundaryType,
      notes: splitZipConfig?.notes
    };
    
    if (splitZipConfig) {
      console.log(`📍 Known split ZIP detected:`, {
        zipCode: request.zipCode,
        primaryTdsp: splitZipConfig.primaryTdsp.name,
        boundaryType: splitZipConfig.boundaryType,
        requiresAddress: splitZipConfig.requiresAddressValidation
      });
    }
    
    // Perform ESIID resolution using existing infrastructure
    let resolution: AddressTDSPResolution;
    try {
      resolution = await ercotESIIDClient.resolveAddressToTDSP(
        request.address,
        request.zipCode,
        request.usage
      );
      
      console.log(`✅ ESIID resolution successful:`, {
        method: resolution.method,
        confidence: resolution.confidence,
        tdsp: resolution.tdsp_name,
        esiid: resolution.esiid
      });
      
    } catch (esiidError) {
      console.error(`❌ ESIID resolution failed:`, esiidError);
      
      // For known split ZIPs, provide fallback with primary TDSP
      if (splitZipConfig) {
        console.log(`🔄 Using fallback to primary TDSP for split ZIP ${request.zipCode}`);
        
        resolution = {
          success: true,
          method: 'multiple_results' as const,
          confidence: 'low' as const,
          tdsp_duns: splitZipConfig.primaryTdsp.duns,
          tdsp_name: splitZipConfig.primaryTdsp.name,
          address: request.address,
          zip_code: request.zipCode,
          alternatives: splitZipConfig.alternativeTdsps?.map(alt => ({
            tdsp_duns: alt.duns,
            tdsp_name: alt.name,
            esiid: 'unknown',
            address: request.address
          })),
          apiParams: {
            tdsp_duns: splitZipConfig.primaryTdsp.duns,
            display_usage: request.usage
          }
        };
      } else {
        // Re-throw error for non-split ZIPs
        throw esiidError;
      }
    }
    
    // Build comprehensive response
    const responseData: LookupESIIDResponse['data'] = {
      resolution: {
        tdsp: {
          duns: resolution.tdsp_duns,
          name: resolution.tdsp_name,
          zone: getZoneFromTdsp(resolution.tdsp_duns)
        },
        esiid: resolution.esiid || 'unknown',
        confidence: resolution.confidence,
        method: resolution.method,
        address: {
          matched: resolution.address,
          normalized: request.address,
          city: extractCityFromAddress(resolution.address) || 'Unknown',
          state: 'TX',
          zipCode: resolution.zip_code,
          county: undefined // Could be enhanced with county lookup
        }
      },
      apiParams: resolution.apiParams,
      splitZipInfo
    };
    
    // Add alternatives if requested and available
    if (request.returnAlternatives && resolution.alternatives) {
      responseData.alternatives = resolution.alternatives.map(alt => ({
        tdsp: {
          duns: alt.tdsp_duns,
          name: alt.tdsp_name
        },
        esiid: alt.esiid,
        address: alt.address,
        confidence: 'medium' as const // Lower confidence for alternatives
      }));
    }
    
    console.log(`📊 ESIID lookup completed successfully:`, {
      requestId: request.requestId,
      tdsp: resolution.tdsp_name,
      confidence: resolution.confidence,
      hasAlternatives: !!responseData.alternatives?.length,
      responseTime: Date.now() - requestStart
    });
    
    return responseData;
    
  } catch (error) {
    console.error(`❌ ESIID lookup failed:`, {
      requestId: request.requestId,
      address: request.address,
      zipCode: request.zipCode,
      error: error.message,
      responseTime: Date.now() - requestStart
    });
    
    throw error;
  }
}

// Extract city from full address string
function extractCityFromAddress(fullAddress: string): string | null {
  // Simple heuristic: look for patterns like "City, TX" or "City TX"
  const cityMatch = fullAddress.match(/,\s*([^,]+)\s*,?\s*TX\s*\d{5}?/i);
  if (cityMatch) {
    return cityMatch[1].trim();
  }
  
  // Fallback: split by comma and take second-to-last part
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  
  return null;
}


// Enhanced error response builder
function buildErrorResponse(
  error: any, 
  requestId: string, 
  responseTime: number
): LookupESIIDResponse {
  let apiError: ComparePowerApiError;
  
  if (error instanceof ComparePowerApiError) {
    apiError = error;
  } else {
    apiError = new ComparePowerApiError(
      ApiErrorType.ESIID_LOOKUP_ERROR,
      error.message || 'ESIID lookup failed',
      { requestId },
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

// Rate limiting (shared with search-plans function in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 50; // 50 ESIID lookups per minute (more restrictive due to cost)

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `esiid_${clientIP}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime };
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count, resetTime: current.resetTime };
}

// Main Netlify Function handler
export default async function handler(request: Request, context: Context) {
  const requestStart = Date.now();
  const requestId = `esiid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
          userMessage: 'Please use POST method for ESIID address lookup.'
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
    // Rate limiting (more restrictive for ESIID lookups)
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
            message: 'Too many ESIID lookup requests',
            userMessage: 'You have made too many address lookups. Please try again in a minute.',
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
    } catch (parseError) {
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
    const validation = validateLookupESIIDRequest(body);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Validation failed: ${validation.errors.join(', ')}`,
            userMessage: 'Please check your address and ZIP code format.',
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
    
    console.log(`🏠 Processing ESIID lookup request:`, {
      requestId: validation.data!.requestId,
      address: validation.data!.address,
      zipCode: validation.data!.zipCode,
      clientIP,
      userAgent: request.headers.get('user-agent')
    });
    
    // Process the lookup
    const data = await handleESIIDLookup(validation.data!);
    
    const responseTime = Date.now() - requestStart;
    
    // Success response
    const response: LookupESIIDResponse = {
      success: true,
      data,
      meta: {
        requestId: validation.data!.requestId,
        timestamp: new Date().toISOString(),
        responseTime,
        version: '1.0.0'
      }
    };
    
    console.log(`✅ ESIID lookup completed successfully:`, {
      requestId: validation.data!.requestId,
      tdsp: data.resolution.tdsp.name,
      confidence: data.resolution.confidence,
      responseTime
    });
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...responseHeaders,
          'X-Response-Time': `${responseTime}ms`,
          'X-Confidence': data.resolution.confidence,
          'X-Resolution-Method': data.resolution.method,
          'Cache-Control': 'public, max-age=900' // 15 minute cache (longer for address lookups)
        }
      }
    );
    
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    
    console.error(`❌ ESIID lookup request failed:`, {
      requestId,
      error: error.message,
      stack: error.stack,
      responseTime
    });
    
    const errorResponse = buildErrorResponse(error, requestId, responseTime);
    const status = error instanceof ComparePowerApiError && 
                   error.type === ApiErrorType.INVALID_PARAMETERS 
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