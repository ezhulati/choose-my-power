/**
 * City Facets API Endpoint
 * GET /api/facets/[city]
 * Returns available facets and their counts for a specific city
 */

import type { APIRoute } from 'astro';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../../config/tdsp-mapping';
import { filterMapper } from '../../../lib/api/filter-mapper';
import type { FacetValue } from '../../../types/facets';

interface FacetsResponse {
  success: boolean;
  cityInfo: {
    name: string;
    slug: string;
    tdspDuns: string;
  };
  facets: {
    rateTypes: FacetValue[];
    contractLengths: FacetValue[];
    greenEnergyLevels: FacetValue[];
    providers: FacetValue[];
    features: FacetValue[];
    priceRanges: FacetValue[];
  };
  totalPlans: number;
  lastUpdated: string;
  error?: string;
}

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    const { city } = params;
    
    if (!city) {
      return new Response(JSON.stringify({
        success: false,
        error: 'City parameter is required',
        cityInfo: { name: '', slug: '', tdspDuns: '' },
        facets: getEmptyFacets(),
        totalPlans: 0,
        lastUpdated: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate city exists
    if (!validateCitySlug(city)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid city: ${city}`,
        cityInfo: { name: '', slug: city, tdspDuns: '' },
        facets: getEmptyFacets(),
        totalPlans: 0,
        lastUpdated: new Date().toISOString()
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tdspDuns = getTdspFromCity(city);
    const cityName = formatCityName(city);

    if (!tdspDuns) {
      return new Response(JSON.stringify({
        success: false,
        error: `No TDSP mapping found for city: ${city}`,
        cityInfo: { name: cityName, slug: city, tdspDuns: '' },
        facets: getEmptyFacets(),
        totalPlans: 0,
        lastUpdated: new Date().toISOString()
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate facet data
    const facets = await generateCityFacets(city, tdspDuns);
    const totalPlans = calculateTotalPlans(facets);

    const response: FacetsResponse = {
      success: true,
      cityInfo: {
        name: cityName,
        slug: city,
        tdspDuns
      },
      facets,
      totalPlans,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour - facets change less frequently
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-City': cityName,
        'X-Total-Plans': totalPlans.toString(),
      }
    });

  } catch (error) {
    console.error('City facets API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Facets service temporarily unavailable',
      cityInfo: { name: '', slug: '', tdspDuns: '' },
      facets: getEmptyFacets(),
      totalPlans: 0,
      lastUpdated: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Generate facet data for a specific city
 */
async function generateCityFacets(citySlug: string, tdspDuns: string): Promise<any> {
  // In production, this would query the database to get actual counts
  // For now, using mock data that represents realistic distributions
  
  // Get base plan count estimate based on city tier
  const basePlanCount = getCityBasePlanCount(citySlug);
  
  return {
    rateTypes: [
      { 
        value: 'fixed', 
        label: 'Fixed Rate', 
        count: Math.floor(basePlanCount * 0.75), 
        selected: false,
        description: 'Rate stays the same throughout your contract'
      },
      { 
        value: 'variable', 
        label: 'Variable Rate', 
        count: Math.floor(basePlanCount * 0.25), 
        selected: false,
        description: 'Rate can change monthly based on market conditions'
      }
    ],
    contractLengths: [
      { 
        value: '12', 
        label: '12 Month', 
        count: Math.floor(basePlanCount * 0.50), 
        selected: false,
        description: '12-month contract term'
      },
      { 
        value: '24', 
        label: '24 Month', 
        count: Math.floor(basePlanCount * 0.30), 
        selected: false,
        description: '24-month contract term'
      },
      { 
        value: '36', 
        label: '36 Month', 
        count: Math.floor(basePlanCount * 0.20), 
        selected: false,
        description: '36-month contract term'
      }
    ],
    greenEnergyLevels: [
      { 
        value: '0', 
        label: 'Traditional Energy', 
        count: Math.floor(basePlanCount * 0.60), 
        selected: false,
        description: 'Standard electricity from mixed sources'
      },
      { 
        value: '100', 
        label: '100% Green Energy', 
        count: Math.floor(basePlanCount * 0.40), 
        selected: false,
        description: 'Electricity from 100% renewable sources'
      }
    ],
    providers: getTopProviders(citySlug, basePlanCount),
    features: [
      { 
        value: 'prepaid', 
        label: 'Prepaid Plans', 
        count: Math.floor(basePlanCount * 0.15), 
        selected: false,
        description: 'Pay for electricity before you use it'
      },
      { 
        value: 'no-deposit', 
        label: 'No Deposit Required', 
        count: Math.floor(basePlanCount * 0.85), 
        selected: false,
        description: 'No security deposit needed to start service'
      },
      { 
        value: 'free-nights', 
        label: 'Free Nights & Weekends', 
        count: Math.floor(basePlanCount * 0.20), 
        selected: false,
        description: 'Free electricity during specific hours'
      },
      { 
        value: 'bill-credit', 
        label: 'Bill Credit Plans', 
        count: Math.floor(basePlanCount * 0.30), 
        selected: false,
        description: 'Monthly bill credits for usage tiers'
      }
    ],
    priceRanges: [
      { 
        value: '0-10', 
        label: 'Under 10¢/kWh', 
        count: Math.floor(basePlanCount * 0.20), 
        selected: false,
        description: 'Low-cost electricity plans'
      },
      { 
        value: '10-15', 
        label: '10¢ - 15¢/kWh', 
        count: Math.floor(basePlanCount * 0.50), 
        selected: false,
        description: 'Mid-range electricity rates'
      },
      { 
        value: '15-20', 
        label: '15¢ - 20¢/kWh', 
        count: Math.floor(basePlanCount * 0.25), 
        selected: false,
        description: 'Premium electricity plans'
      },
      { 
        value: '20+', 
        label: 'Over 20¢/kWh', 
        count: Math.floor(basePlanCount * 0.05), 
        selected: false,
        description: 'Specialty or premium service plans'
      }
    ]
  };
}

/**
 * Get base plan count estimate for a city based on its tier
 */
function getCityBasePlanCount(citySlug: string): number {
  // Major cities typically have more plan options
  const majorCities = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
  const largeCities = ['plano-tx', 'garland-tx', 'irving-tx', 'arlington-tx', 'corpus-christi-tx'];
  
  if (majorCities.includes(citySlug)) {
    return 180; // Major cities have ~180 plans (realistic count)
  } else if (largeCities.includes(citySlug)) {
    return 120; // Large cities have ~120 plans (realistic count)
  } else {
    return 80; // Other cities have ~80 plans (realistic count)
  }
}

/**
 * Get top providers for a city
 */
function getTopProviders(citySlug: string, basePlanCount: number): FacetValue[] {
  const providers = [
    { key: 'reliant', name: 'Reliant Energy', share: 0.15 },
    { key: 'txu', name: 'TXU Energy', share: 0.12 },
    { key: 'direct-energy', name: 'Direct Energy', share: 0.10 },
    { key: 'nrg', name: 'NRG Energy', share: 0.08 },
    { key: 'constellation', name: 'Constellation', share: 0.08 },
    { key: 'green-mountain', name: 'Green Mountain Energy', share: 0.07 },
    { key: 'cirro', name: 'Cirro Energy', share: 0.06 },
    { key: 'gexa', name: 'Gexa Energy', share: 0.06 },
  ];

  return providers.map(provider => ({
    value: provider.key,
    label: provider.name,
    count: Math.floor(basePlanCount * provider.share),
    selected: false,
    description: `Plans from ${provider.name}`
  }));
}

/**
 * Get empty facets structure
 */
function getEmptyFacets() {
  return {
    rateTypes: [],
    contractLengths: [],
    greenEnergyLevels: [],
    providers: [],
    features: [],
    priceRanges: []
  };
}

/**
 * Calculate total plans from facet data
 */
function calculateTotalPlans(facets: any): number {
  // Use rate types as the base count since all plans have a rate type
  return facets.rateTypes.reduce((sum: number, facet: FacetValue) => sum + facet.count, 0);
}