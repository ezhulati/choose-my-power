/**
 * Faceted Search API Endpoint
 * POST /api/search/faceted
 * Advanced faceted search with real-time filtering and aggregations
 */

import type { APIRoute } from 'astro';
import { comparePowerClient } from '../../../lib/api/comparepower-client';
import { filterMapper } from '../../../lib/api/filter-mapper';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../../config/tdsp-mapping';
import type { Plan, FacetValue } from '../../../types/facets';

interface FacetedSearchRequest {
  citySlug: string;
  filters: Record<string, string | string[] | number | boolean>;
  page?: number;
  limit?: number;
  sortBy?: 'rate' | 'green_energy' | 'contract_length' | 'provider';
  sortOrder?: 'asc' | 'desc';
  includeFacets?: boolean;
  sessionId?: string;
}

interface FacetedSearchResponse {
  success: boolean;
  plans: Plan[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets?: {
    rateTypes: FacetValue[];
    contractLengths: FacetValue[];
    greenEnergyLevels: FacetValue[];
    providers: FacetValue[];
    features: FacetValue[];
    priceRanges: FacetValue[];
  };
  appliedFilters: Array<{
    key: string;
    value: any;
    displayName: string;
    removeUrl: string;
  }>;
  canonicalUrl: string;
  searchTime: number;
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
    const body = await request.json() as FacetedSearchRequest;
    
    // Validate required fields
    if (!body.citySlug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'citySlug is required',
        plans: [],
        totalCount: 0,
        page: 1,
        limit: 20,
        hasMore: false,
        appliedFilters: [],
        canonicalUrl: '',
        searchTime: Date.now() - startTime,
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
        page: 1,
        limit: 20,
        hasMore: false,
        appliedFilters: [],
        canonicalUrl: '',
        searchTime: Date.now() - startTime,
        cityInfo: { name: '', slug: '', tdspDuns: '' }
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
        page: 1,
        limit: 20,
        hasMore: false,
        appliedFilters: [],
        canonicalUrl: '',
        searchTime: Date.now() - startTime,
        cityInfo: { name: cityName, slug: body.citySlug, tdspDuns: '' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set defaults
    const page = Math.max(1, body.page || 1);
    const limit = Math.min(50, Math.max(1, body.limit || 20));
    const includeFacets = body.includeFacets !== false; // Default to true

    // Convert filters to URL segments for filter mapper
    const filterSegments = buildFilterSegments(body.filters);
    
    // Map filters to API parameters using filter mapper
    const filterResult = filterMapper.mapFiltersToApiParams(body.citySlug, filterSegments, tdspDuns);
    
    if (!filterResult.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid filter combination: ${filterResult.errors.join(', ')}`,
        plans: [],
        totalCount: 0,
        page,
        limit,
        hasMore: false,
        appliedFilters: [],
        canonicalUrl: '',
        searchTime: Date.now() - startTime,
        cityInfo: { name: cityName, slug: body.citySlug, tdspDuns }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enhance API params with pagination and sorting
    const enhancedParams = {
      ...filterResult.apiParams,
      page,
      limit,
      sortBy: body.sortBy || 'rate',
      sortOrder: body.sortOrder || 'asc'
    };

    // Fetch plans
    const plans = await comparePowerClient.fetchPlans(enhancedParams);
    
    // Build applied filters for UI
    const appliedFilters = filterResult.appliedFilters.map(filter => ({
      key: filter.type,
      value: filter.value,
      displayName: filter.displayName,
      removeUrl: buildRemoveFilterUrl(body.citySlug, filterSegments, filter.urlSegment)
    }));

    // Build canonical URL
    const canonicalUrl = `/electricity-plans/${body.citySlug}/${filterSegments.join('/')}`;

    // Generate facets if requested
    let facets;
    if (includeFacets) {
      facets = await generateFacets(body.citySlug, tdspDuns, filterResult.appliedFilters);
    }

    const response: FacetedSearchResponse = {
      success: true,
      plans,
      totalCount: plans.length, // This could be enhanced with actual total count from API
      page,
      limit,
      hasMore: plans.length === limit, // Simple heuristic - could be enhanced
      facets,
      appliedFilters,
      canonicalUrl,
      searchTime: Date.now() - startTime,
      cityInfo: {
        name: cityName,
        slug: body.citySlug,
        tdspDuns
      }
    };

    // Track analytics if session provided
    if (body.sessionId) {
      await trackFacetedSearch(body.sessionId, body.citySlug, filterSegments, plans.length);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Search-Time': `${Date.now() - startTime}ms`,
        'X-Total-Results': plans.length.toString(),
        'X-City': cityName,
      }
    });

  } catch (error) {
    console.error('Faceted search API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Faceted search service temporarily unavailable',
      plans: [],
      totalCount: 0,
      page: 1,
      limit: 20,
      hasMore: false,
      appliedFilters: [],
      canonicalUrl: '',
      searchTime: Date.now() - startTime,
      cityInfo: { name: '', slug: '', tdspDuns: '' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Convert filter object to URL segments
 */
function buildFilterSegments(filters: Record<string, any>): string[] {
  const segments: string[] = [];
  
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    
    switch (key) {
      case 'contractLength':
        if (typeof value === 'number') {
          segments.push(`${value}-month`);
        }
        break;
      case 'rateType':
        if (value === 'fixed') segments.push('fixed-rate');
        else if (value === 'variable') segments.push('variable-rate');
        break;
      case 'greenEnergy':
        if (value === true || value === 'true') {
          segments.push('green-energy');
        }
        break;
      case 'prePaid':
        if (value === true || value === 'true') {
          segments.push('prepaid');
        }
        break;
      case 'noDeposit':
        if (value === true || value === 'true') {
          segments.push('no-deposit');
        }
        break;
      case 'provider':
        if (typeof value === 'string') {
          segments.push(value.toLowerCase().replace(/\s+/g, '-'));
        }
        break;
    }
  }
  
  return segments;
}

/**
 * Build URL for removing a specific filter
 */
function buildRemoveFilterUrl(citySlug: string, currentSegments: string[], segmentToRemove: string): string {
  const newSegments = currentSegments.filter(segment => segment !== segmentToRemove);
  return `/electricity-plans/${citySlug}/${newSegments.join('/')}`;
}

/**
 * Generate facet counts for the current search
 */
async function generateFacets(citySlug: string, tdspDuns: string, appliedFilters: any[]): Promise<any> {
  // This is a simplified implementation - in production, you'd query the database
  // to get actual counts for each facet value
  return {
    rateTypes: [
      { value: 'fixed', label: 'Fixed Rate', count: 150, selected: false },
      { value: 'variable', label: 'Variable Rate', count: 75, selected: false }
    ],
    contractLengths: [
      { value: '12', label: '12 Month', count: 200, selected: false },
      { value: '24', label: '24 Month', count: 120, selected: false },
      { value: '36', label: '36 Month', count: 80, selected: false }
    ],
    greenEnergyLevels: [
      { value: '0', label: 'Traditional Energy', count: 250, selected: false },
      { value: '100', label: '100% Green Energy', count: 150, selected: false }
    ],
    providers: [
      { value: 'reliant', label: 'Reliant Energy', count: 45, selected: false },
      { value: 'txu', label: 'TXU Energy', count: 40, selected: false },
      { value: 'direct-energy', label: 'Direct Energy', count: 35, selected: false }
    ],
    features: [
      { value: 'prepaid', label: 'Prepaid Plans', count: 25, selected: false },
      { value: 'no-deposit', label: 'No Deposit Required', count: 180, selected: false },
      { value: 'free-nights', label: 'Free Nights & Weekends', count: 60, selected: false }
    ],
    priceRanges: [
      { value: '0-10', label: 'Under 10¢/kWh', count: 50, selected: false },
      { value: '10-15', label: '10¢ - 15¢/kWh', count: 200, selected: false },
      { value: '15-20', label: '15¢ - 20¢/kWh', count: 100, selected: false },
      { value: '20+', label: 'Over 20¢/kWh', count: 50, selected: false }
    ]
  };
}

/**
 * Track faceted search analytics
 */
async function trackFacetedSearch(
  sessionId: string,
  citySlug: string,
  filterSegments: string[],
  resultCount: number
): Promise<void> {
  try {
    console.log('Faceted search analytics:', {
      sessionId,
      citySlug,
      filters: filterSegments,
      resultCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track faceted search:', error);
  }
}