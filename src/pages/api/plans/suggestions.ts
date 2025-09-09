// T032: GET /api/plans/suggestions endpoint
// Intelligent filter suggestions and nearby plan recommendations (FR-011, FR-013)

import type { APIRoute } from 'astro';
import type { ElectricityPlan } from '../../../lib/types/electricity-plan';
import type { PlanFilter } from '../../../lib/types/plan-filter';
import type { PlansSuggestionsResponse, FilterSuggestion } from '../../../lib/types/api-types';
import { FilterEngine } from '../../../lib/plan-filtering/filter-engine';

// Import real data services (constitutional compliance)
import { getPlansForCity, getCityBySlug, getProviders } from '../../../lib/services/provider-service';

// Rate limiting and caching
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (longer for suggestions)
const MAX_REQUESTS_PER_MINUTE = 40;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface CacheEntry {
  data: PlansSuggestionsResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = performance.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const city = searchParams.get('city') || 'houston';
    const state = searchParams.get('state') || 'texas';
    const currentFilters = searchParams.get('currentFilters');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

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

    // Parse current filters from request parameter
    let parsedFilters: Partial<PlanFilter> = { city, state };
    
    if (currentFilters) {
      try {
        parsedFilters = { ...parsedFilters, ...JSON.parse(currentFilters) };
      } catch (error) {
        console.warn('[/api/plans/suggestions] Invalid currentFilters JSON:', error);
      }
    }

    // Validate parameters
    if (limit < 1 || limit > 10) {
      return new Response(
        JSON.stringify({
          error: 'Invalid limit parameter',
          details: 'Limit must be between 1 and 10',
          validRange: { min: 1, max: 10 }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey(parsedFilters, limit);
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      return new Response(JSON.stringify(cachedResult.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900', // 15 minutes
          'X-Cache': 'HIT'
        }
      });
    }

    // Load base data using real data services (constitutional compliance)
    let allPlans: ElectricityPlan[];
    let cityData;
    
    try {
      // Validate city exists
      cityData = await getCityBySlug(city, state);
      if (!cityData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `City '${city}' not found in ${state}`,
            availableCities: ['houston', 'dallas', 'austin', 'san-antonio', 'fort-worth']
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Load plans for the city
      allPlans = await getPlansForCity(city, state);
      
      if (!allPlans || allPlans.length === 0) {
        return new Response(
          JSON.stringify({
            suggestions: [],
            alternativeFilters: {},
            nearbyOptions: []
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

    } catch (error) {
      console.error('[/api/plans/suggestions] Data loading error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to load suggestions data',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          retryable: true
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate filter suggestions, alternative filters, and nearby options
    try {
      const filterEngine = new FilterEngine(allPlans);
      
      // Generate filter suggestions
      const suggestions = generateFilterSuggestions(parsedFilters, allPlans);
      
      // Generate alternative filters
      const alternativeFilters = generateAlternativeFilters(parsedFilters, allPlans);
      
      // Find nearby options (best matching plans)
      const nearbyOptions = findNearbyOptions(parsedFilters, allPlans, limit);

      // Build response
      const response: PlansSuggestionsResponse = {
        suggestions,
        alternativeFilters,
        nearbyOptions
      };

      // Store in cache
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      // Clean old cache entries
      cleanCache();

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900', // 15 minutes
          'X-Cache': 'MISS'
        }
      });

    } catch (error) {
      console.error('[/api/plans/suggestions] Suggestion generation error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Failed to generate suggestions',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }


  } catch (error) {
    console.error('[/api/plans/suggestions] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        requestId: generateRequestId(),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

/**
 * Generate filter suggestions for restrictive filters
 */
function generateFilterSuggestions(
  currentFilters: Partial<PlanFilter>,
  allPlans: ElectricityPlan[]
): FilterSuggestion[] {
  const suggestions: FilterSuggestion[] = [];
  
  // Analyze current filters and suggest relaxations
  if (currentFilters.maxRate && currentFilters.maxRate < 12) {
    suggestions.push({
      filterCategory: 'maxRate',
      suggestion: 'Consider increasing max rate to 12¢/kWh',
      expectedResults: allPlans.filter(p => p.baseRate <= 12).length,
      priority: 'high',
      action: 'increase'
    });
  }
  
  if (currentFilters.contractLengths && currentFilters.contractLengths.length === 1) {
    suggestions.push({
      filterCategory: 'contractLengths',
      suggestion: 'Try including 12 or 24 month contracts',
      expectedResults: allPlans.filter(p => [12, 24].includes(p.contractLength)).length,
      priority: 'medium',
      action: 'add'
    });
  }
  
  if (currentFilters.minGreenEnergy && currentFilters.minGreenEnergy >= 100) {
    suggestions.push({
      filterCategory: 'minGreenEnergy',
      suggestion: 'Consider 50% green energy for more options',
      expectedResults: allPlans.filter(p => p.greenEnergyPercentage >= 50).length,
      priority: 'medium',
      action: 'decrease'
    });
  }
  
  return suggestions.slice(0, 5);
}

/**
 * Generate alternative filter combinations
 */
function generateAlternativeFilters(
  currentFilters: Partial<PlanFilter>,
  allPlans: ElectricityPlan[]
): Partial<PlanFilter> {
  const alternatives: Partial<PlanFilter> = {};
  
  // If rate filter is too restrictive, suggest broader range
  if (currentFilters.maxRate && currentFilters.maxRate < 15) {
    alternatives.maxRate = 15;
  }
  
  // If contract length is very specific, suggest popular options
  if (currentFilters.contractLengths && currentFilters.contractLengths.length === 1) {
    alternatives.contractLengths = ['12', '24'];
  }
  
  // If requiring 100% green energy, suggest 50%
  if (currentFilters.minGreenEnergy && currentFilters.minGreenEnergy >= 100) {
    alternatives.minGreenEnergy = 50;
  }
  
  return alternatives;
}

/**
 * Find nearby matching plans (best alternatives)
 */
function findNearbyOptions(
  currentFilters: Partial<PlanFilter>,
  allPlans: ElectricityPlan[],
  limit: number
): ElectricityPlan[] {
  // Find plans that are close to matching criteria
  return allPlans
    .filter(plan => {
      // Loose matching - at least some criteria should match
      return plan.baseRate <= (currentFilters.maxRate || 50) * 1.2; // 20% tolerance
    })
    .sort((a, b) => {
      // Score by how well they match relaxed criteria
      const aScore = calculateMatchScore(a, currentFilters);
      const bScore = calculateMatchScore(b, currentFilters);
      return bScore - aScore;
    })
    .slice(0, limit);
}

/**
 * Calculate match score for plan against filters
 */
function calculateMatchScore(plan: ElectricityPlan, filters: Partial<PlanFilter>): number {
  let score = 0;
  let factors = 0;

  // Rate score
  if (filters.maxRate) {
    const rateScore = Math.max(0, filters.maxRate - plan.baseRate);
    score += rateScore;
    factors += filters.maxRate;
  }

  // Contract length match
  if (filters.contractLengths && filters.contractLengths.includes(plan.contractLength.toString())) {
    score += 10;
  }
  factors += 10;

  // Provider rating
  score += plan.providerRating || 3;
  factors += 5;

  // Green energy bonus
  if (filters.minGreenEnergy && plan.greenEnergyPercentage >= (filters.minGreenEnergy || 0)) {
    score += 5;
  }
  factors += 5;

  return factors > 0 ? score / factors : 0;
}

/**
 * Generate insights about suggestions
 */
function generateSuggestionInsights(
  suggestions: ElectricityPlan[],
  allPlans: ElectricityPlan[],
  type: string
): any {
  if (suggestions.length === 0) {
    return {
      summary: 'No suggestions found',
      recommendations: []
    };
  }

  const avgRate = suggestions.reduce((sum, plan) => sum + plan.baseRate, 0) / suggestions.length;
  const avgMarketRate = allPlans.reduce((sum, plan) => sum + plan.baseRate, 0) / allPlans.length;

  const insights = {
    summary: {
      suggestionCount: suggestions.length,
      averageRate: parseFloat(avgRate.toFixed(3)),
      marketComparison: avgRate < avgMarketRate ? 'below-market' : 'above-market',
      potentialSavings: Math.max(0, (avgMarketRate - avgRate) * 1000) // Per 1000 kWh
    },
    recommendations: []
  };

  // Add type-specific insights
  switch (type) {
    case 'similar':
      insights.recommendations.push({
        type: 'flexibility',
        title: 'Consider Slightly Different Options',
        description: 'These plans are very similar to your search with minor adjustments'
      });
      break;
    
    case 'alternative':
      insights.recommendations.push({
        type: 'strategy',
        title: 'Different Approach, Same Goal',
        description: 'These plans use different strategies but may better meet your needs'
      });
      break;
    
    case 'popular':
      insights.recommendations.push({
        type: 'social-proof',
        title: 'Customer Favorites',
        description: 'These plans are chosen most often by customers in your area'
      });
      break;
    
    case 'nearby':
      insights.recommendations.push({
        type: 'geographic',
        title: 'Expand Your Search',
        description: 'Consider these options from nearby areas with similar pricing'
      });
      break;
  }

  return insights;
}

/**
 * Check if plan matches filter criteria
 */
function matchesPlanCriteria(plan: ElectricityPlan, filters: Partial<PlanFilter>): boolean {
  // Rate range
  if (filters.minRate && plan.baseRate < filters.minRate) return false;
  if (filters.maxRate && plan.baseRate > filters.maxRate) return false;
  
  // Contract length
  if (filters.contractLengths && filters.contractLengths.length > 0) {
    if (!filters.contractLengths.includes(plan.contractLength.toString())) return false;
  }
  
  // Rate type
  if (filters.rateTypes && filters.rateTypes.length > 0) {
    if (!filters.rateTypes.includes(plan.rateType)) return false;
  }
  
  // Monthly fee
  if (filters.maxMonthlyFee && plan.monthlyFee > filters.maxMonthlyFee) return false;
  
  // Green energy
  if (filters.minGreenEnergy && plan.greenEnergyPercentage < filters.minGreenEnergy) return false;
  
  // Provider
  if (filters.selectedProviders && filters.selectedProviders.length > 0) {
    if (!filters.selectedProviders.includes(plan.providerName)) return false;
  }
  
  // Provider rating
  if (filters.minProviderRating && plan.providerRating < filters.minProviderRating) return false;
  
  return true;
}

/**
 * Calculate similarity score between plan and filters
 */
function calculatePlanSimilarity(plan: ElectricityPlan, filters: Partial<PlanFilter>): number {
  let score = 0;
  let factors = 0;

  // Rate similarity (higher weight)
  if (filters.minRate || filters.maxRate) {
    const targetRate = ((filters.minRate || 0) + (filters.maxRate || 50)) / 2;
    const rateDiff = Math.abs(plan.baseRate - targetRate);
    score += Math.max(0, 10 - rateDiff); // 0-10 points
    factors += 10;
  }

  // Contract length match
  if (filters.contractLengths && filters.contractLengths.length > 0) {
    if (filters.contractLengths.includes(plan.contractLength.toString())) {
      score += 5;
    }
    factors += 5;
  }

  // Provider rating
  score += plan.providerRating;
  factors += 5;

  // Green energy bonus
  if (plan.greenEnergyPercentage > 50) {
    score += 2;
  }
  factors += 2;

  return factors > 0 ? score / factors : 0;
}

/**
 * Calculate plan value score
 */
function calculatePlanValueScore(plan: ElectricityPlan): number {
  // Lower rate = higher score, plus feature bonus
  const rateScore = Math.max(0, 50 - plan.baseRate); // 0-50 points
  const featureScore = countPlanFeatures(plan); // 0-10 points
  const ratingScore = plan.providerRating; // 0-5 points
  const greenBonus = plan.greenEnergyPercentage > 50 ? 5 : 0; // 0-5 bonus
  
  return rateScore + featureScore + ratingScore + greenBonus;
}

/**
 * Count plan features
 */
function countPlanFeatures(plan: ElectricityPlan): number {
  let features = 0;
  
  if (plan.weekendFreeHours && plan.weekendFreeHours > 0) features++;
  if (plan.nightFreeHours && plan.nightFreeHours > 0) features++;
  if (plan.hasSmartThermostatCredit) features++;
  if (plan.hasPaperlessBilling) features++;
  if (plan.hasAutoPayDiscount) features++;
  if (plan.hasOnlineAccountManagement) features++;
  if (plan.hasMobileApp) features++;
  if (plan.has24x7CustomerSupport) features++;
  if (plan.greenEnergyPercentage > 0) features++;
  if (plan.contractLength >= 12) features++; // Stability feature
  
  return Math.min(features, 10); // Cap at 10 features
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientIP: string): {
  allowed: boolean;
  currentCount: number;
  retryAfter: number;
} {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000;
  
  const current = requestCounts.get(clientIP);
  
  if (!current || current.resetTime <= now) {
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: windowStart + 60000
    });
    
    return { allowed: true, currentCount: 1, retryAfter: 0 };
  }
  
  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      currentCount: current.count,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  current.count++;
  requestCounts.set(clientIP, current);
  
  return { allowed: true, currentCount: current.count, retryAfter: 0 };
}

/**
 * Generate cache key
 */
function generateCacheKey(
  filters: Partial<PlanFilter>,
  limit: number
): string {
  const keyData = {
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
    limit
  };
  
  return `suggestions_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
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
  
  // Limit cache size to prevent memory issues
  if (cache.size > 300) {
    const entries = Array.from(cache.entries());
    entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
    
    const toRemove = Math.floor(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Clean up rate limiting entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetTime <= now) {
      requestCounts.delete(ip);
    }
  }
}, 60000);