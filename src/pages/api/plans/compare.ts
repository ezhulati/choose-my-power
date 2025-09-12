// T031: GET /api/plans/compare endpoint
// Side-by-side plan comparison with cost analysis (FR-006, FR-009)

import type { APIRoute } from 'astro';
import type { ElectricityPlan } from '../../../lib/types/electricity-plan';
import type { PlansCompareResponse, PlanRecommendation } from '../../../lib/types/api-types';
import { costAnalysisEngine } from '../../../lib/plan-comparison/cost-analysis';
import { featureMatrixBuilder } from '../../../lib/plan-comparison/feature-matrix';
import { isValidPlanId } from '../../../lib/types/electricity-plan';

// Import real data services (constitutional compliance)
import { getPlansForCity } from '../../../lib/services/provider-service';

// Rate limiting and caching
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer for comparison results)
const MAX_REQUESTS_PER_MINUTE = 30;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface CacheEntry {
  data: PlansCompareResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = performance.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const planIds = searchParams.get('plans')?.split(',') || [];
    const monthlyUsage = parseInt(searchParams.get('usage') || '1000', 10);
    const analysisMonths = parseInt(searchParams.get('months') || '12', 10);
    const includeFeatures = searchParams.get('features') !== 'false';
    const includeCosts = searchParams.get('costs') !== 'false';

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
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }

    // Validate request parameters
    if (!planIds || planIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing plan IDs',
          details: 'Provide plan IDs as comma-separated values in "plans" parameter'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (planIds.length > 4) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many plans for comparison',
          details: 'Maximum 4 plans can be compared at once',
          maxPlans: 4
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate plan IDs format (constitutional compliance)
    const invalidIds = planIds.filter(id => !isValidPlanId(id));
    if (invalidIds.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid plan ID format',
          details: 'Plan IDs must be valid MongoDB ObjectIds',
          invalidIds
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate usage parameters
    if (monthlyUsage < 100 || monthlyUsage > 10000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid monthly usage',
          details: 'Monthly usage must be between 100 and 10,000 kWh',
          validRange: { min: 100, max: 10000 }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (analysisMonths < 1 || analysisMonths > 60) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid analysis period',
          details: 'Analysis period must be between 1 and 60 months',
          validRange: { min: 1, max: 60 }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey(planIds, monthlyUsage, analysisMonths, includeFeatures, includeCosts);
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      const response = cachedResult.data;
      response.cached = true;
      response.responseTime = Math.round(performance.now() - startTime);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600', // 10 minutes
          'X-Cache': 'HIT'
        }
      });
    }

    // Load plans data using real data services (constitutional compliance)
    let plans: ElectricityPlan[];
    const planLoadErrors: string[] = [];
    
    try {
      // Load each plan by ID
      const planPromises = planIds.map(async (planId) => {
        try {
          const plan = await getPlanById(planId);
          return plan;
        } catch (error) {
          planLoadErrors.push(`Failed to load plan ${planId}: ${error.message}`);
          return null;
        }
      });

      const planResults = await Promise.all(planPromises);
      plans = planResults.filter((plan): plan is ElectricityPlan => plan !== null);

      if (plans.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No plans found',
            details: 'None of the provided plan IDs could be loaded',
            errors: planLoadErrors,
            requestedIds: planIds
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Warn if some plans failed to load
      if (planLoadErrors.length > 0) {
        console.warn('[/api/plans/compare] Some plans failed to load:', planLoadErrors);
      }

    } catch (error) {
      console.error('[/api/plans/compare] Plan loading error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to load plan data',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          retryable: true
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate cost analysis
    let costAnalysis;
    let costAnalysisError;
    
    if (includeCosts) {
      try {
        const analysisStartTime = performance.now();
        
        costAnalysis = costAnalysisEngine.comparePlans(plans, {
          monthlyUsageKwh: monthlyUsage,
          analysisMonths: analysisMonths,
          includePromotions: true,
          includeConnectFees: true,
          taxRate: 0 // Texas residential electricity tax rate
        });

        const analysisTime = performance.now() - analysisStartTime;
        
        // Log performance warning if analysis takes too long
        if (analysisTime > 1000) {
          console.warn(`[/api/plans/compare] Cost analysis performance warning: ${analysisTime.toFixed(2)}ms`);
        }

      } catch (error) {
        console.error('[/api/plans/compare] Cost analysis error:', error);
        costAnalysisError = error.message;
        costAnalysis = null;
      }
    }

    // Generate feature matrix
    let featureMatrix;
    let featureMatrixError;
    
    if (includeFeatures) {
      try {
        const matrixStartTime = performance.now();
        
        featureMatrix = featureMatrixBuilder.buildMatrix(plans, {
          showOnlyDifferences: true,
          highlightBestValues: true,
          includeAllFeatures: false,
          priorityFilter: 'high-medium'
        });

        const matrixTime = performance.now() - matrixStartTime;
        
        if (matrixTime > 500) {
          console.warn(`[/api/plans/compare] Feature matrix performance warning: ${matrixTime.toFixed(2)}ms`);
        }

      } catch (error) {
        console.error('[/api/plans/compare] Feature matrix error:', error);
        featureMatrixError = error.message;
        featureMatrix = null;
      }
    }

    // Generate comparison insights
    const insights = generateComparisonInsights(plans, costAnalysis, featureMatrix);

    // Generate recommendation
    const recommendation = generatePlanRecommendation(plans, costAnalysis, featureMatrix);

    // Build response (contract-compliant structure)
    const response: PlansCompareResponse = {
      comparisonData: plans,
      costAnalysis: costAnalysis || {
        totalCostBreakdown: {},
        monthlyCostProjection: [],
        savingsAnalysis: { potentialSavings: 0, percentageSavings: 0 },
        usageScenarios: []
      },
      featureMatrix: featureMatrix || [],
      recommendation,
      responseTime: Math.round(performance.now() - startTime)
    };

    // Store in cache if successful
    if (!costAnalysisError && !featureMatrixError) {
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      // Clean old cache entries
      cleanCache();
    }

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600', // 10 minutes
      'X-Cache': 'MISS',
      'X-Response-Time': `${response.responseTime}ms`,
      'X-Plans-Compared': plans.length.toString()
    };

    // Add warnings if there were errors
    if (planLoadErrors.length > 0) {
      headers['X-Warning'] = `${planLoadErrors.length} plans failed to load`;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[/api/plans/compare] Unexpected error:', error);
    
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
 * Generate plan recommendation from comparison data
 */
function generatePlanRecommendation(
  plans: ElectricityPlan[],
  costAnalysis: unknown,
  featureMatrix: unknown): PlanRecommendation | undefined {
  if (plans.length === 0) return undefined;

  // Simple recommendation: lowest cost plan
  let recommendedPlan = plans[0];
  let bestScore = 0;

  plans.forEach(plan => {
    // Score based on rate, features, and provider rating
    const rateScore = Math.max(0, 50 - plan.baseRate); // Lower rate = higher score
    const featureScore = countPlanFeatures(plan);
    const ratingScore = plan.providerRating || 3;
    
    const totalScore = rateScore * 0.5 + featureScore * 0.3 + ratingScore * 0.2;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      recommendedPlan = plan;
    }
  });

  return {
    recommendedPlanId: recommendedPlan.id,
    reasons: [
      `Best combination of rate (${recommendedPlan.baseRate}¢/kWh) and features`,
      `Provider rating: ${recommendedPlan.providerRating}/5`,
      recommendedPlan.greenEnergyPercentage > 50 ? 'Includes renewable energy' : ''
    ].filter(reason => reason.length > 0),
    confidenceScore: Math.min(bestScore / 30, 1), // Normalize to 0-1
    savingsHighlight: costAnalysis && {
      annualSavings: 0, // Would be calculated from cost analysis
      percentageSavings: 0
    }
  };
}

/**
 * Count plan features for scoring
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
  
  return features;
}

/**
 * Generate comparison insights from analysis data
 */
function generateComparisonInsights(
  plans: ElectricityPlan[],
  costAnalysis: unknown,
  featureMatrix: unknown): unknown {
  const insights: unknown = {
    summary: {
      planCount: plans.length,
      averageRate: plans.reduce((sum, plan) => sum + plan.baseRate, 0) / plans.length,
      rateSpread: Math.max(...plans.map(p => p.baseRate)) - Math.min(...plans.map(p => p.baseRate)),
      contractLengthRange: {
        min: Math.min(...plans.map(p => p.contractLength)),
        max: Math.max(...plans.map(p => p.contractLength))
      }
    },
    recommendations: []
  };

  // Cost-based recommendations
  if (costAnalysis) {
    const lowestCost = costAnalysis.summary.lowestCost;
    const highestCost = costAnalysis.summary.highestCost;
    
    insights.recommendations.push({
      type: 'cost',
      title: 'Best Overall Value',
      planId: lowestCost.planId,
      planName: lowestCost.planName,
      reason: `Saves ${((highestCost.totalCost - lowestCost.totalCost) / 100).toFixed(0)}% compared to most expensive option`,
      priority: 'high'
    });

    // Short-term vs long-term recommendations
    if (costAnalysis.insights) {
      if (costAnalysis.insights.shortTermBest.planId !== costAnalysis.insights.longTermBest.planId) {
        insights.recommendations.push({
          type: 'timing',
          title: 'Consider Your Timeline',
          shortTermPlan: costAnalysis.insights.shortTermBest.planName,
          longTermPlan: costAnalysis.insights.longTermBest.planName,
          reason: 'Different plans are better for short-term vs long-term savings',
          priority: 'medium'
        });
      }
    }
  }

  // Feature-based recommendations
  if (featureMatrix) {
    const highlights = featureMatrix.summary;
    
    if (highlights.bestOverall) {
      const bestPlan = plans.find(p => p.id === highlights.bestOverall);
      if (bestPlan) {
        insights.recommendations.push({
          type: 'features',
          title: 'Most Complete Package',
          planId: bestPlan.id,
          planName: bestPlan.planName,
          reason: 'Offers the best combination of features and value',
          priority: 'medium'
        });
      }
    }
  }

  // Green energy recommendations
  const greenPlans = plans.filter(p => p.greenEnergyPercentage > 50);
  if (greenPlans.length > 0) {
    const mostGreen = greenPlans.reduce((prev, current) => 
      prev.greenEnergyPercentage > current.greenEnergyPercentage ? prev : current
    );
    
    insights.recommendations.push({
      type: 'environmental',
      title: 'Most Environmentally Friendly',
      planId: mostGreen.id,
      planName: mostGreen.planName,
      reason: `${mostGreen.greenEnergyPercentage}% renewable energy content`,
      priority: 'low'
    });
  }

  // Provider diversity insights
  const providers = new Set(plans.map(p => p.providerName));
  insights.providerDiversity = {
    uniqueProviders: providers.size,
    providers: Array.from(providers),
    hasDiverseOptions: providers.size > 1
  };

  return insights;
}

/**
 * Check rate limiting for client IP
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
 * Generate cache key for comparison request
 */
function generateCacheKey(
  planIds: string[],
  monthlyUsage: number,
  analysisMonths: number,
  includeFeatures: boolean,
  includeCosts: boolean
): string {
  const sortedIds = [...planIds].sort();
  const keyData = {
    planIds: sortedIds,
    monthlyUsage,
    analysisMonths,
    includeFeatures,
    includeCosts
  };
  
  return `compare_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
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
  if (cache.size > 500) {
    const entries = Array.from(cache.entries());
    entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
    
    const toRemove = Math.floor(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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