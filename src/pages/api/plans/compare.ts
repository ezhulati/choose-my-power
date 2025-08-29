/**
 * Plan Comparison API Endpoint
 * POST /api/plans/compare
 * Compare multiple electricity plans side-by-side
 */

import type { APIRoute } from 'astro';
import { comparePowerClient } from '../../../lib/api/comparepower-client';
import { analyticsService } from '../../../lib/api/analytics-service';
import { planRepository } from '../../../lib/database/plan-repository';
import type { Plan } from '../../../types';

interface ComparisonRequest {
  planIds: string[];
  usage?: number; // kWh per month for comparison
  sessionId?: string;
  citySlug?: string;
}

interface ComparisonResponse {
  success: boolean;
  plans: PlanComparisonData[];
  comparisonId?: string;
  metadata: {
    usage: number;
    comparisonDate: string;
    totalPlans: number;
    bestValuePlan?: string;
    lowestRatePlan?: string;
    greenestPlan?: string;
  };
  error?: string;
}

interface PlanComparisonData {
  id: string;
  name: string;
  provider: {
    name: string;
    logo: string;
    rating?: number;
  };
  pricing: {
    ratePerKwh: number;
    monthlyTotal: number;
    annualTotal: number;
    breakdownByUsage: {
      usage500: { rate: number; total: number };
      usage1000: { rate: number; total: number };
      usage2000: { rate: number; total: number };
    };
  };
  contract: {
    length: number;
    type: 'fixed' | 'variable' | 'indexed';
    earlyTerminationFee: number;
    autoRenewal: boolean;
  };
  features: {
    greenEnergy: number;
    billCredit: number;
    freeTime?: {
      hours: string;
      days: string[];
    };
    deposit: {
      required: boolean;
      amount?: number;
    };
  };
  pros: string[];
  cons: string[];
  bestFor: string[];
  documents: {
    efl?: string;
    tos?: string;
    yrac?: string;
  };
  comparisonScore: number; // 0-100 score for this comparison context
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  const startTime = Date.now();
  
  try {
    // Validate content type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData: ComparisonRequest;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request
    const validation = validateComparisonRequest(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.message,
        details: validation.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get plan details for comparison
    const planDetails = await Promise.all(
      requestData.planIds.map(async (planId) => {
        return await planRepository.getPlanById(planId);
      })
    );

    // Filter out any null results (plans not found)
    const validPlans = planDetails.filter((plan): plan is Plan => plan !== null);
    
    if (validPlans.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid plans found for comparison'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate comparison data
    const usage = requestData.usage || 1000; // Default to 1000 kWh
    const comparisonData = validPlans.map(plan => createComparisonData(plan, usage));

    // Analyze and add metadata
    const metadata = analyzeComparison(comparisonData, usage);

    // Store comparison for analytics
    let comparisonId: string | undefined;
    if (requestData.sessionId) {
      comparisonId = await storeComparison({
        sessionId: requestData.sessionId,
        planIds: validPlans.map(p => p.id),
        citySlug: requestData.citySlug,
        usage,
      });

      // Track analytics event
      await analyticsService.trackPlanComparison(
        requestData.sessionId,
        validPlans.map(p => p.id),
        0, // Duration will be tracked separately
        {
          usage,
          planCount: validPlans.length,
          citySlug: requestData.citySlug,
        }
      );
    }

    // Log API metrics
    await logApiMetrics({
      endpoint: '/api/plans/compare',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: clientAddress || 'unknown',
    });

    const response: ComparisonResponse = {
      success: true,
      plans: comparisonData,
      comparisonId,
      metadata: {
        ...metadata,
        comparisonDate: new Date().toISOString(),
        totalPlans: validPlans.length,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Plans-Compared': validPlans.length.toString(),
      }
    });

  } catch (error) {
    console.error('Plan comparison failed:', error);

    // Log error metrics
    await logApiMetrics({
      endpoint: '/api/plans/compare',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Plan comparison service temporarily unavailable',
      plans: [],
      metadata: {
        usage: 0,
        comparisonDate: new Date().toISOString(),
        totalPlans: 0,
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Validate comparison request
 */
function validateComparisonRequest(data: ComparisonRequest): {
  valid: boolean;
  message?: string;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(data.planIds) || data.planIds.length === 0) {
    errors.push('planIds array is required and must not be empty');
  } else if (data.planIds.length > 10) {
    errors.push('Maximum 10 plans can be compared at once');
  } else if (data.planIds.some(id => typeof id !== 'string' || !id.trim())) {
    errors.push('All planIds must be non-empty strings');
  }

  if (data.usage !== undefined) {
    if (typeof data.usage !== 'number' || data.usage < 100 || data.usage > 10000) {
      errors.push('Usage must be a number between 100 and 10000 kWh');
    }
  }

  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? 'Validation failed' : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Create comparison data for a plan
 */
function createComparisonData(plan: Plan, usage: number): PlanComparisonData {
  const monthlyTotal = calculateMonthlyTotal(plan, usage);
  
  return {
    id: plan.id,
    name: plan.name,
    provider: {
      name: plan.provider.name,
      logo: plan.provider.logo || '',
      rating: plan.provider.rating,
    },
    pricing: {
      ratePerKwh: plan.pricing.ratePerKwh,
      monthlyTotal,
      annualTotal: monthlyTotal * 12,
      breakdownByUsage: {
        usage500: {
          rate: plan.pricing.rate500kWh,
          total: plan.pricing.total500kWh,
        },
        usage1000: {
          rate: plan.pricing.rate1000kWh,
          total: plan.pricing.total1000kWh,
        },
        usage2000: {
          rate: plan.pricing.rate2000kWh,
          total: plan.pricing.total2000kWh,
        },
      },
    },
    contract: {
      length: plan.contract.length,
      type: plan.contract.type,
      earlyTerminationFee: plan.contract.earlyTerminationFee,
      autoRenewal: plan.contract.autoRenewal,
    },
    features: {
      greenEnergy: plan.features.greenEnergy,
      billCredit: plan.features.billCredit,
      freeTime: plan.features.freeTime,
      deposit: plan.features.deposit,
    },
    pros: generatePlanPros(plan),
    cons: generatePlanCons(plan),
    bestFor: generateBestForRecommendations(plan),
    documents: {
      // These would be populated from plan data if available
    },
    comparisonScore: calculateComparisonScore(plan, usage),
  };
}

/**
 * Calculate monthly total for specific usage
 */
function calculateMonthlyTotal(plan: Plan, usage: number): number {
  // Use interpolation based on available pricing tiers
  if (usage <= 500) {
    return plan.pricing.total500kWh;
  } else if (usage <= 1000) {
    if (usage === 1000) {
      return plan.pricing.total1000kWh;
    }
    // Interpolate between 500 and 1000
    const ratio = (usage - 500) / 500;
    return plan.pricing.total500kWh + (plan.pricing.total1000kWh - plan.pricing.total500kWh) * ratio;
  } else if (usage <= 2000) {
    if (usage === 2000) {
      return plan.pricing.total2000kWh;
    }
    // Interpolate between 1000 and 2000
    const ratio = (usage - 1000) / 1000;
    return plan.pricing.total1000kWh + (plan.pricing.total2000kWh - plan.pricing.total1000kWh) * ratio;
  } else {
    // Extrapolate beyond 2000 kWh
    return (plan.pricing.ratePerKwh * usage) / 100;
  }
}

/**
 * Generate plan pros
 */
function generatePlanPros(plan: Plan): string[] {
  const pros: string[] = [];

  if (plan.contract.type === 'fixed') {
    pros.push('Rate locked for entire contract term');
  }

  if (plan.features.greenEnergy > 50) {
    pros.push(`${plan.features.greenEnergy}% renewable energy`);
  }

  if (!plan.features.deposit.required) {
    pros.push('No deposit required');
  }

  if (plan.contract.earlyTerminationFee === 0) {
    pros.push('No early termination fee');
  }

  if (plan.features.billCredit > 0) {
    pros.push(`$${plan.features.billCredit} monthly bill credit`);
  }

  if (plan.features.freeTime) {
    pros.push('Free electricity hours included');
  }

  return pros;
}

/**
 * Generate plan cons
 */
function generatePlanCons(plan: Plan): string[] {
  const cons: string[] = [];

  if (plan.contract.type === 'variable') {
    cons.push('Rate can change monthly');
  }

  if (plan.features.deposit.required) {
    cons.push(`Deposit required: $${plan.features.deposit.amount || 'TBD'}`);
  }

  if (plan.contract.earlyTerminationFee > 0) {
    cons.push(`Early termination fee: $${plan.contract.earlyTerminationFee}`);
  }

  if (plan.contract.autoRenewal) {
    cons.push('Automatically renews unless cancelled');
  }

  return cons;
}

/**
 * Generate best-for recommendations
 */
function generateBestForRecommendations(plan: Plan): string[] {
  const recommendations: string[] = [];

  if (plan.features.greenEnergy > 80) {
    recommendations.push('Environmentally conscious customers');
  }

  if (plan.contract.length <= 12) {
    recommendations.push('Customers wanting flexibility');
  }

  if (plan.contract.length >= 24) {
    recommendations.push('Long-term price stability seekers');
  }

  if (!plan.features.deposit.required) {
    recommendations.push('New residents or customers with credit concerns');
  }

  if (plan.features.freeTime) {
    recommendations.push('Customers with flexible usage patterns');
  }

  return recommendations;
}

/**
 * Calculate comparison score for ranking
 */
function calculateComparisonScore(plan: Plan, usage: number): number {
  let score = 50; // Base score

  // Rate competitiveness (compared to average)
  const avgRate = 12; // cents per kWh - would be calculated from market data
  const rateScore = Math.max(0, Math.min(30, (avgRate - plan.pricing.ratePerKwh) * 2));
  score += rateScore;

  // Contract flexibility
  if (plan.contract.type === 'fixed') score += 10;
  if (plan.contract.length <= 12) score += 5;
  if (plan.contract.earlyTerminationFee === 0) score += 5;

  // Features
  if (!plan.features.deposit.required) score += 5;
  if (plan.features.greenEnergy > 0) score += plan.features.greenEnergy * 0.1;
  if (plan.features.billCredit > 0) score += Math.min(10, plan.features.billCredit * 0.5);

  return Math.min(100, Math.max(0, score));
}

/**
 * Analyze comparison and provide metadata
 */
function analyzeComparison(plans: PlanComparisonData[], usage: number): {
  usage: number;
  bestValuePlan?: string;
  lowestRatePlan?: string;
  greenestPlan?: string;
} {
  const sortedByValue = [...plans].sort((a, b) => b.comparisonScore - a.comparisonScore);
  const sortedByRate = [...plans].sort((a, b) => a.pricing.ratePerKwh - b.pricing.ratePerKwh);
  const sortedByGreen = [...plans].sort((a, b) => b.features.greenEnergy - a.features.greenEnergy);

  return {
    usage,
    bestValuePlan: sortedByValue[0]?.id,
    lowestRatePlan: sortedByRate[0]?.id,
    greenestPlan: sortedByGreen[0]?.id,
  };
}

/**
 * Store comparison for analytics
 */
async function storeComparison(data: {
  sessionId: string;
  planIds: string[];
  citySlug?: string;
  usage: number;
}): Promise<string> {
  const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in database
  await planRepository.storePlanComparison({
    session_id: data.sessionId,
    plan_ids: data.planIds,
    city_slug: data.citySlug,
    filters_applied: { usage: data.usage },
    created_at: new Date(),
  });

  return comparisonId;
}

/**
 * Log API metrics
 */
async function logApiMetrics(metrics: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  cacheHit: boolean;
  errorType?: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    console.log('API Metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
  } catch (error) {
    console.error('Failed to log API metrics:', error);
  }
}