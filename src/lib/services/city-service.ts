/**
 * City Service - Real Data Integration
 * 
 * Provides city and location information from real data sources
 * Replaces mock data usage throughout the application
 */

import { db } from '../../config/database.js';
import { loadCityData } from '../api/plan-data-service.js';
import { zipToCity, tdspMapping } from '../../config/tdsp-mapping.js';

export interface RealCity {
  id?: number;
  name: string;
  slug: string;
  state: string;
  state_code: string;
  population?: number;
  zip_codes?: string[];
  tdsp?: {
    name: string;
    short_name: string;
    zone: string;
  };
  plan_count?: number;
  lowest_rate?: number;
  average_rate?: number;
  provider_count?: number;
  is_major_city?: boolean;
  deregulated?: boolean;
  municipal_utility?: boolean;
}

export interface CityStats {
  total_plans: number;
  lowest_rate: number;
  average_rate: number;
  provider_count: number;
  green_plans: number;
  no_deposit_plans: number;
}

/**
 * Get all Texas cities with electricity data
 */
export async function getCities(state: string = 'texas'): Promise<RealCity[]> {
  try {
    console.log(`[CityService] Getting cities for state: ${state}`);
    
    // Try database first
    if (await hasDatabaseConnection()) {
      const cities = await getCitiesFromDatabase(state);
      if (cities.length > 0) {
        console.log(`[CityService] Found ${cities.length} cities from database`);
        return cities;
      }
    }
    
    // Fallback to TDSP mapping and generated data
    const cities = await getCitiesFromTDSPMapping();
    console.log(`[CityService] Found ${cities.length} cities from TDSP mapping`);
    return cities;
    
  } catch (error) {
    console.error('[CityService] Error getting cities:', error);
    return [];
  }
}

/**
 * Get a specific city by slug
 */
export async function getCityBySlug(citySlug: string): Promise<RealCity | null> {
  try {
    console.log(`[CityService] Getting city: ${citySlug}`);
    
    // Try database first
    if (await hasDatabaseConnection()) {
      const city = await getCityFromDatabase(citySlug);
      if (city) {
        console.log(`[CityService] Found city ${citySlug} from database`);
        return city;
      }
    }
    
    // Fallback to TDSP mapping and generated data
    const city = await getCityFromTDSPMapping(citySlug);
    if (city) {
      console.log(`[CityService] Found city ${citySlug} from TDSP mapping`);
      return city;
    }
    
    console.warn(`[CityService] City ${citySlug} not found`);
    return null;
    
  } catch (error) {
    console.error(`[CityService] Error getting city ${citySlug}:`, error);
    return null;
  }
}

/**
 * Get city statistics (plan counts, rates, etc.)
 */
export async function getCityStats(citySlug: string): Promise<CityStats | null> {
  try {
    console.log(`[CityService] Getting stats for city: ${citySlug}`);
    
    // Load city data to calculate statistics
    const cityData = await loadCityData(citySlug);
    if (!cityData) {
      console.warn(`[CityService] No city data found for ${citySlug}`);
      return null;
    }
    
    const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
    
    if (plans.length === 0) {
      return {
        total_plans: 0,
        lowest_rate: 0,
        average_rate: 0,
        provider_count: 0,
        green_plans: 0,
        no_deposit_plans: 0
      };
    }
    
    // Calculate statistics from real plan data
    const rates = plans.map(p => p.pricing?.rate1000kWh || 0).filter(r => r > 0);
    const uniqueProviders = new Set(plans.map(p => p.provider?.name).filter(Boolean));
    
    const stats: CityStats = {
      total_plans: plans.length,
      lowest_rate: rates.length > 0 ? Math.min(...rates) : 0,
      average_rate: rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0,
      provider_count: uniqueProviders.size,
      green_plans: plans.filter(p => (p.features?.greenEnergy || 0) > 0).length,
      no_deposit_plans: plans.filter(p => !p.features?.deposit?.required).length
    };
    
    console.log(`[CityService] Stats for ${citySlug}:`, stats);
    return stats;
    
  } catch (error) {
    console.error(`[CityService] Error getting city stats for ${citySlug}:`, error);
    return null;
  }
}

/**
 * Get major Texas cities (cities with the most plans/providers)
 */
export async function getMajorCities(limit: number = 20): Promise<RealCity[]> {
  try {
    const cities = await getCities('texas');
    
    // Sort by plan count and provider count
    const majors = cities
      .filter(city => city.plan_count && city.plan_count > 0)
      .sort((a, b) => {
        const scoreA = (a.plan_count || 0) + (a.provider_count || 0) * 10;
        const scoreB = (b.plan_count || 0) + (b.provider_count || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit);
    
    console.log(`[CityService] Found ${majors.length} major cities`);
    return majors;
    
  } catch (error) {
    console.error('[CityService] Error getting major cities:', error);
    return [];
  }
}

/**
 * Search cities by name or ZIP code
 */
export async function searchCities(query: string): Promise<RealCity[]> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    
    // If query looks like a ZIP code, try ZIP lookup first
    if (/^\d{5}$/.test(normalizedQuery)) {
      const citySlug = zipToCity[normalizedQuery];
      if (citySlug) {
        const city = await getCityBySlug(citySlug);
        return city ? [city] : [];
      }
    }
    
    // Search by city name
    const cities = await getCities('texas');
    const matches = cities.filter(city => 
      city.name.toLowerCase().includes(normalizedQuery) ||
      city.slug.toLowerCase().includes(normalizedQuery)
    );
    
    console.log(`[CityService] Found ${matches.length} cities matching "${query}"`);
    return matches.slice(0, 10); // Limit results
    
  } catch (error) {
    console.error(`[CityService] Error searching cities with query "${query}":`, error);
    return [];
  }
}

/**
 * Database city queries
 */
async function getCitiesFromDatabase(state: string): Promise<RealCity[]> {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.population,
        c.zip_codes,
        c.is_major_city,
        t.name as tdsp_name,
        t.short_name as tdsp_short_name,
        t.zone as tdsp_zone,
        COUNT(ep.id) as plan_count,
        COUNT(DISTINCT ep.provider_id) as provider_count,
        MIN(ep.rate_1000kwh) as lowest_rate,
        AVG(ep.rate_1000kwh) as average_rate
      FROM cities c
      LEFT JOIN tdsp t ON c.tdsp_duns = t.duns_number
      LEFT JOIN electricity_plans ep ON c.id = ep.city_id
      GROUP BY c.id, c.name, c.slug, c.population, c.zip_codes, c.is_major_city, 
               t.name, t.short_name, t.zone
      ORDER BY plan_count DESC, c.name
    `;
    
    const results = await db.query(query);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      state: 'Texas',
      state_code: 'TX',
      population: row.population,
      zip_codes: row.zip_codes ? JSON.parse(row.zip_codes) : [],
      is_major_city: row.is_major_city,
      deregulated: true, // All database cities are in deregulated areas
      municipal_utility: false,
      tdsp: row.tdsp_name ? {
        name: row.tdsp_name,
        short_name: row.tdsp_short_name,
        zone: row.tdsp_zone
      } : undefined,
      plan_count: parseInt(row.plan_count) || 0,
      provider_count: parseInt(row.provider_count) || 0,
      lowest_rate: parseFloat(row.lowest_rate) || 0,
      average_rate: parseFloat(row.average_rate) || 0
    }));
    
  } catch (error) {
    console.error('[CityService] Database query error:', error);
    return [];
  }
}

async function getCityFromDatabase(citySlug: string): Promise<RealCity | null> {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.population,
        c.zip_codes,
        c.is_major_city,
        t.name as tdsp_name,
        t.short_name as tdsp_short_name,
        t.zone as tdsp_zone,
        COUNT(ep.id) as plan_count,
        COUNT(DISTINCT ep.provider_id) as provider_count,
        MIN(ep.rate_1000kwh) as lowest_rate,
        AVG(ep.rate_1000kwh) as average_rate
      FROM cities c
      LEFT JOIN tdsp t ON c.tdsp_duns = t.duns_number
      LEFT JOIN electricity_plans ep ON c.id = ep.city_id
      WHERE c.slug = $1
      GROUP BY c.id, c.name, c.slug, c.population, c.zip_codes, c.is_major_city,
               t.name, t.short_name, t.zone
    `;
    
    const results = await db.query(query, [citySlug]);
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      state: 'Texas',
      state_code: 'TX',
      population: row.population,
      zip_codes: row.zip_codes ? JSON.parse(row.zip_codes) : [],
      is_major_city: row.is_major_city,
      deregulated: true,
      municipal_utility: false,
      tdsp: row.tdsp_name ? {
        name: row.tdsp_name,
        short_name: row.tdsp_short_name,
        zone: row.tdsp_zone
      } : undefined,
      plan_count: parseInt(row.plan_count) || 0,
      provider_count: parseInt(row.provider_count) || 0,
      lowest_rate: parseFloat(row.lowest_rate) || 0,
      average_rate: parseFloat(row.average_rate) || 0
    };
    
  } catch (error) {
    console.error(`[CityService] Database query error for ${citySlug}:`, error);
    return null;
  }
}

/**
 * TDSP mapping fallback methods
 */
async function getCitiesFromTDSPMapping(): Promise<RealCity[]> {
  try {
    const cities: RealCity[] = [];
    
    // Get all cities from TDSP mapping
    for (const [citySlug, tdspInfo] of Object.entries(tdspMapping)) {
      try {
        const city = await getCityFromTDSPMapping(citySlug);
        if (city) {
          cities.push(city);
        }
      } catch (cityError) {
        console.warn(`[CityService] Error processing city ${citySlug}:`, cityError.message);
      }
    }
    
    return cities.sort((a, b) => (b.plan_count || 0) - (a.plan_count || 0));
    
  } catch (error) {
    console.error('[CityService] Error getting cities from TDSP mapping:', error);
    return [];
  }
}

async function getCityFromTDSPMapping(citySlug: string): Promise<RealCity | null> {
  try {
    const tdspInfo = tdspMapping[citySlug];
    if (!tdspInfo) {
      return null;
    }
    
    // Format city name from slug
    const cityName = citySlug
      .split('-')
      .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Tx', ', TX');
    
    // Try to load city data to get plan statistics
    let planCount = 0;
    let providerCount = 0;
    let lowestRate = 0;
    let averageRate = 0;
    
    try {
      const cityData = await loadCityData(citySlug);
      if (cityData) {
        const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
        const rates = plans.map(p => p.pricing?.rate1000kWh || 0).filter(r => r > 0);
        const uniqueProviders = new Set(plans.map(p => p.provider?.name).filter(Boolean));
        
        planCount = plans.length;
        providerCount = uniqueProviders.size;
        lowestRate = rates.length > 0 ? Math.min(...rates) : 0;
        averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
      }
    } catch (dataError) {
      // City data not available, that's okay
    }
    
    return {
      name: cityName,
      slug: citySlug,
      state: 'Texas',
      state_code: 'TX',
      deregulated: true,
      municipal_utility: false,
      is_major_city: planCount > 50, // Cities with 50+ plans are considered major
      tdsp: {
        name: tdspInfo.name,
        short_name: tdspInfo.name,
        zone: tdspInfo.zone || 'Unknown'
      },
      plan_count: planCount,
      provider_count: providerCount,
      lowest_rate: lowestRate,
      average_rate: averageRate
    };
    
  } catch (error) {
    console.error(`[CityService] Error getting city ${citySlug} from TDSP mapping:`, error);
    return null;
  }
}

/**
 * Utility functions
 */
async function hasDatabaseConnection(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}