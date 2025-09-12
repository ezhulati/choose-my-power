// T030: GET /api/plans/list endpoint
// Filtered electricity plans listing with performance optimization (FR-001, FR-003, NFR-005)

import type { APIRoute } from 'astro';
import type { ElectricityPlan } from '../../../lib/types/electricity-plan';
import type { PlanFilter } from '../../../lib/types/plan-filter';
import type { PlansListResponse } from '../../../lib/types/api-types';
import { FilterEngine } from '../../../lib/plan-filtering/filter-engine';
import { urlStateManager } from '../../../lib/plan-filtering/url-state';

// Import real data services (constitutional compliance)
import { getPlansForCity, getCityBySlug, type RealPlan } from '../../../lib/services/provider-service';

// Rate limiting and caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_MINUTE = 60;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface CacheEntry {
  data: PlansListResponse;
  timestamp: number;
  key: string;
}

const cache = new Map<string, CacheEntry>();

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = performance.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const city = searchParams.get('city') || 'houston';
    const state = searchParams.get('state') || 'texas';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Parse filters from URL parameters
    const filters = urlStateManager.parseFiltersFromURL(searchParams, city);
    
    // Validate city parameter (constitutional requirement)
    if (!city || typeof city !== 'string' || city.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid city parameter',
          details: 'City must be a valid string with at least 2 characters'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey(filters, limit, offset);
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      // Add cache headers
      const response = cachedResult.data;
      response.cached = true;
      response.responseTime = Math.round(performance.now() - startTime);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Cache': 'HIT',
          'X-Response-Time': `${response.responseTime}ms`
        }
      });
    }

    // Load plans data using real data services (constitutional compliance)
    let allPlans: ElectricityPlan[];
    let cityData;
    
    try {
      // Validate city exists in our database
      cityData = await getCityBySlug(city, state);
      if (!cityData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `City '${city}' not found in ${state}`,
            availableCities: ['houston', 'dallas', 'austin', 'san-antonio', 'fort-worth'] // Could be dynamic
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Load plans for the city
      const realPlans = await getPlansForCity(city, state);
      allPlans = realPlans.map(transformRealPlanToElectricityPlan);
      
      if (!allPlans || allPlans.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            plans: [],
            totalCount: 0,
            filteredCount: 0,
            filters: filters,
            pagination: {
              limit,
              offset,
              hasMore: false
            },
            responseTime: Math.round(performance.now() - startTime),
            city: cityData,
            message: `No electricity plans available for ${city}, ${state}`
          }),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'X-Response-Time': `${Math.round(performance.now() - startTime)}ms`
            }
          }
        );
      }

    } catch (error) {
      console.error('[/api/plans/list] Data loading error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to load plans data',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          retryable: true
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Apply filters using FilterEngine
    const filterEngine = new FilterEngine(allPlans);
    const filterStartTime = performance.now();
    
    let filteredResult;
    try {
      filteredResult = filterEngine.applyFilters(filters);
      
      // Check if filter performance meets requirement (NFR-005: <300ms)
      if (filteredResult.responseTime > 300) {
        console.warn(`[/api/plans/list] Filter performance warning: ${filteredResult.responseTime}ms > 300ms target`);
      }
      
    } catch (error) {
      console.error('[/api/plans/list] Filter error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Filter processing failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Apply pagination
    const totalCount = allPlans.length;
    const filteredCount = filteredResult.filteredPlans.length;
    const paginatedPlans = filteredResult.filteredPlans.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredCount;

    // Generate suggestions for zero results (FR-011)
    let suggestions: unknown[] = [];
    if (filteredCount === 0) {
      try {
        suggestions = filterEngine.generateSuggestions(filters);
      } catch (error) {
        console.warn('[/api/plans/list] Suggestions generation error:', error);
        suggestions = [];
      }
    }

    // Build response (contract-compliant structure)
    const response: PlansListResponse = {
      plans: paginatedPlans,
      totalCount,
      filterCounts: filteredResult.filterCounts,
      appliedFilters: filters,
      responseTime: Math.round(performance.now() - startTime)
    };

    // Store in cache
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      key: cacheKey
    });

    // Clean old cache entries (prevent memory leak)
    cleanCache();

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'X-Cache': 'MISS',
      'X-Response-Time': `${response.performance.responseTime}ms`,
      'X-Filter-Time': `${response.performance.filterTime}ms`,
      'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
      'X-RateLimit-Remaining': (MAX_REQUESTS_PER_MINUTE - rateLimitResult.currentCount).toString()
    };

    // Add performance warning header if applicable
    if (response.performance.responseTime > 2000) { // NFR-001: <2s page load
      headers['X-Performance-Warning'] = 'Response time exceeded 2s target';
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[/api/plans/list] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        requestId: generateRequestId(),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Response-Time': `${Math.round(performance.now() - startTime)}ms`
        }
      }
    );
  }
};

/**
 * Check rate limiting for client IP
 */
function checkRateLimit(clientIP: string): {
  allowed: boolean;
  currentCount: number;
  retryAfter: number;
} {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // 1-minute windows
  
  const current = requestCounts.get(clientIP);
  
  if (!current || current.resetTime <= now) {
    // New window or expired entry
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: windowStart + 60000
    });
    
    return {
      allowed: true,
      currentCount: 1,
      retryAfter: 0
    };
  }
  
  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      currentCount: current.count,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  current.count++;
  requestCounts.set(clientIP, current);
  
  return {
    allowed: true,
    currentCount: current.count,
    retryAfter: 0
  };
}

/**
 * Generate cache key from filters and pagination
 */
function generateCacheKey(filters: PlanFilter, limit: number, offset: number): string {
  const filterString = JSON.stringify({
    city: filters.city,
    state: filters.state,
    contractLengths: filters.contractLengths,
    rateTypes: filters.rateTypes,
    minRate: filters.minRate,
    maxRate: filters.maxRate,
    maxMonthlyFee: filters.maxMonthlyFee,
    minGreenEnergy: filters.minGreenEnergy,
    selectedProviders: filters.selectedProviders,
    minProviderRating: filters.minProviderRating,
    requiredFeatures: filters.requiredFeatures,
    includePromotions: filters.includePromotions,
    excludeEarlyTerminationFee: filters.excludeEarlyTerminationFee,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  });
  
  return `list_${Buffer.from(filterString).toString('base64')}_${limit}_${offset}`;
}

/**
 * Clean old cache entries
 */
function cleanCache(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      toDelete.push(key);
    }
  }
  
  toDelete.forEach(key => cache.delete(key));
  
  // Limit cache size
  if (cache.size > 1000) {
    const entries = Array.from(cache.entries());
    entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Transform RealPlan data structure to ElectricityPlan interface
 */
function transformRealPlanToElectricityPlan(realPlan: RealPlan): ElectricityPlan {
  return {
    id: realPlan.id,
    planName: realPlan.name,
    providerName: realPlan.provider.name,
    providerLogo: realPlan.provider.logo || '',
    providerRating: realPlan.provider.rating || 3,
    baseRate: realPlan.pricing?.ratePerKwh || 0,
    rateType: (realPlan.contract?.type as 'fixed' | 'variable' | 'indexed') || 'fixed',
    contractLength: realPlan.contract?.length || 12,
    monthlyFee: 0, // Not in real data structure
    estimatedMonthlyCost: (realPlan.pricing?.ratePerKwh || 0) * 1000, // Estimate based on 1000 kWh
    greenEnergyPercentage: realPlan.features?.greenEnergy || 0,
    weekendFreeHours: 0, // Could be extracted from freeTime
    nightFreeHours: 0, // Could be extracted from freeTime
    planFeatures: [], // Would need to parse from features
    earlyTerminationFee: realPlan.contract?.earlyTerminationFee || 0,
    hasSmartThermostatCredit: false,
    hasPaperlessBilling: true, // Default assumption
    hasAutoPayDiscount: false,
    hasOnlineAccountManagement: true, // Default assumption
    hasMobileApp: true, // Default assumption
    has24x7CustomerSupport: true, // Default assumption
    availability: 'active',
    promotionalOffers: [], // Not in real data structure
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Clean up rate limiting entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const toDelete: string[] = [];
  
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetTime <= now) {
      toDelete.push(ip);
    }
  }
  
  toDelete.forEach(ip => requestCounts.delete(ip));
}, 60000); // Clean every minute