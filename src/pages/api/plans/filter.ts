/**
 * Real-time Plan Filtering API
 * POST /api/plans/filter
 * Fast real-time filtering for faceted navigation with debounced updates
 */

import type { APIRoute } from 'astro';
import { comparePowerClient } from '../../../lib/api/comparepower-client';
import { filterMapper } from '../../../lib/api/filter-mapper';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../../config/tdsp-mapping';
import type { Plan } from '../../../types/facets';

interface FilterRequest {
  citySlug: string;
  filters: {
    rateType?: 'fixed' | 'variable';
    contractLength?: number[];
    greenEnergy?: boolean;
    prePaid?: boolean;
    noDeposit?: boolean;
    priceRange?: { min?: number; max?: number };
    providers?: string[];
    features?: string[];
  };
  sortBy?: 'rate' | 'green_energy' | 'contract_length' | 'provider';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  sessionId?: string;
}

interface FilterResponse {
  success: boolean;
  plans: Plan[];
  totalCount: number;
  filteredCount: number;
  facetCounts: {
    rateTypes: Record<string, number>;
    contractLengths: Record<string, number>;
    greenEnergyLevels: Record<string, number>;
    providers: Record<string, number>;
    priceRanges: Record<string, number>;
  };
  lowestRate: number;
  averageRate: number;
  responseTime: number;
  cityInfo: {
    name: string;
    slug: string;
    tdspDuns: string;
  };
  error?: string;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json() as FilterRequest;
    
    // Validate required fields
    if (!body.citySlug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'citySlug is required',
        plans: [],
        totalCount: 0,
        filteredCount: 0,
        facetCounts: getEmptyFacetCounts(),
        lowestRate: 0,
        averageRate: 0,
        responseTime: Date.now() - startTime,
        cityInfo: { name: '', slug: '', tdspDuns: '' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate city exists
    if (!validateCitySlug(body.citySlug)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid city: ${body.citySlug}`,
        plans: [],
        totalCount: 0,
        filteredCount: 0,
        facetCounts: getEmptyFacetCounts(),
        lowestRate: 0,
        averageRate: 0,
        responseTime: Date.now() - startTime,
        cityInfo: { name: '', slug: body.citySlug, tdspDuns: '' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tdspDuns = getTdspFromCity(body.citySlug);
    const cityName = formatCityName(body.citySlug);

    if (!tdspDuns) {
      return new Response(JSON.stringify({
        success: false,
        error: `No TDSP mapping found for city: ${body.citySlug}`,
        plans: [],
        totalCount: 0,
        filteredCount: 0,
        facetCounts: getEmptyFacetCounts(),
        lowestRate: 0,
        averageRate: 0,
        responseTime: Date.now() - startTime,
        cityInfo: { name: cityName, slug: body.citySlug, tdspDuns: '' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert filters to API parameters
    const apiParams = await buildApiParams(body, tdspDuns);
    
    // Set limit with reasonable max
    const limit = Math.min(100, body.limit || 50);
    
    // Fetch and filter plans
    const plans = await comparePowerClient.fetchPlans({
      ...apiParams,
      limit,
      sortBy: body.sortBy || 'rate',
      sortOrder: body.sortOrder || 'asc'
    });

    // Apply client-side filtering for features not handled by API
    const filteredPlans = applyClientSideFilters(plans, body.filters);

    // Calculate statistics
    const lowestRate = filteredPlans.length > 0 
      ? Math.min(...filteredPlans.map(p => parseFloat(p.rate) || 999)) 
      : 0;
    
    const averageRate = filteredPlans.length > 0
      ? filteredPlans.reduce((sum, p) => sum + (parseFloat(p.rate) || 0), 0) / filteredPlans.length
      : 0;

    // Generate facet counts for remaining filters
    const facetCounts = generateFacetCounts(filteredPlans);

    const response: FilterResponse = {
      success: true,
      plans: filteredPlans,
      totalCount: plans.length, // Original count before filtering
      filteredCount: filteredPlans.length,
      facetCounts,
      lowestRate: Math.round(lowestRate * 100) / 100,
      averageRate: Math.round(averageRate * 100) / 100,
      responseTime: Date.now() - startTime,
      cityInfo: {
        name: cityName,
        slug: body.citySlug,
        tdspDuns
      }
    };

    // Track real-time filtering analytics
    if (body.sessionId) {
      await trackFilteringAnalytics(body.sessionId, body.citySlug, body.filters, filteredPlans.length);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60', // Short cache for real-time updates
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Filtered-Count': filteredPlans.length.toString(),
        'X-City': cityName,
      }
    });

  } catch (error) {
    console.error('Plan filtering API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Plan filtering service temporarily unavailable',
      plans: [],
      totalCount: 0,
      filteredCount: 0,
      facetCounts: getEmptyFacetCounts(),
      lowestRate: 0,
      averageRate: 0,
      responseTime: Date.now() - startTime,
      cityInfo: { name: '', slug: '', tdspDuns: '' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Build API parameters from filter request
 */
async function buildApiParams(request: FilterRequest, tdspDuns: string): Promise<any> {
  const params: any = {
    tdsp_duns: tdspDuns
  };

  // Rate type filter
  if (request.filters.rateType) {
    params.rate_type = request.filters.rateType;
  }

  // Contract length filter
  if (request.filters.contractLength && request.filters.contractLength.length > 0) {
    params.term_months = request.filters.contractLength;
  }

  // Green energy filter
  if (request.filters.greenEnergy === true) {
    params.percent_green = 100;
  }

  // Prepaid filter
  if (request.filters.prePaid === true) {
    params.is_pre_pay = true;
  }

  // Price range filter
  if (request.filters.priceRange) {
    if (request.filters.priceRange.min !== undefined) {
      params.min_rate = request.filters.priceRange.min;
    }
    if (request.filters.priceRange.max !== undefined) {
      params.max_rate = request.filters.priceRange.max;
    }
  }

  return params;
}

/**
 * Apply client-side filtering for features not handled by the main API
 */
function applyClientSideFilters(plans: Plan[], filters: FilterRequest['filters']): Plan[] {
  let filteredPlans = [...plans];

  // No deposit filter
  if (filters.noDeposit === true) {
    filteredPlans = filteredPlans.filter(plan => !plan.deposit_required);
  }

  // Provider filter
  if (filters.providers && filters.providers.length > 0) {
    const providerNames = filters.providers.map(p => p.toLowerCase());
    filteredPlans = filteredPlans.filter(plan => 
      providerNames.some(name => plan.provider.toLowerCase().includes(name))
    );
  }

  // Features filter (bill credit, free nights, etc.)
  if (filters.features && filters.features.length > 0) {
    filteredPlans = filteredPlans.filter(plan => {
      return filters.features!.every(feature => {
        switch (feature) {
          case 'bill-credit':
            return plan.bill_credit && plan.bill_credit > 0;
          case 'free-nights':
            return plan.free_nights_weekends === true;
          case 'auto-pay':
            return plan.requires_auto_pay === true;
          case 'satisfaction-guarantee':
            return plan.satisfaction_guarantee === true;
          default:
            return true;
        }
      });
    });
  }

  return filteredPlans;
}

/**
 * Generate facet counts from filtered plans
 */
function generateFacetCounts(plans: Plan[]): FilterResponse['facetCounts'] {
  const counts = {
    rateTypes: {} as Record<string, number>,
    contractLengths: {} as Record<string, number>,
    greenEnergyLevels: {} as Record<string, number>,
    providers: {} as Record<string, number>,
    priceRanges: {} as Record<string, number>
  };

  plans.forEach(plan => {
    // Count rate types
    const rateType = plan.rate_type || 'unknown';
    counts.rateTypes[rateType] = (counts.rateTypes[rateType] || 0) + 1;

    // Count contract lengths
    const contractLength = `${plan.term_months}`;
    counts.contractLengths[contractLength] = (counts.contractLengths[contractLength] || 0) + 1;

    // Count green energy levels
    const greenLevel = plan.percent_green >= 100 ? '100' : '0';
    counts.greenEnergyLevels[greenLevel] = (counts.greenEnergyLevels[greenLevel] || 0) + 1;

    // Count providers
    const provider = plan.provider || 'unknown';
    counts.providers[provider] = (counts.providers[provider] || 0) + 1;

    // Count price ranges
    const rate = parseFloat(plan.rate) || 0;
    let priceRange = '20+';
    if (rate < 10) priceRange = '0-10';
    else if (rate < 15) priceRange = '10-15';
    else if (rate < 20) priceRange = '15-20';
    
    counts.priceRanges[priceRange] = (counts.priceRanges[priceRange] || 0) + 1;
  });

  return counts;
}

/**
 * Get empty facet counts structure
 */
function getEmptyFacetCounts(): FilterResponse['facetCounts'] {
  return {
    rateTypes: {},
    contractLengths: {},
    greenEnergyLevels: {},
    providers: {},
    priceRanges: {}
  };
}

/**
 * Track real-time filtering analytics
 */
async function trackFilteringAnalytics(
  sessionId: string,
  citySlug: string,
  filters: FilterRequest['filters'],
  resultCount: number
): Promise<void> {
  try {
    console.log('Real-time filtering analytics:', {
      sessionId,
      citySlug,
      filters,
      resultCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track filtering analytics:', error);
  }
}