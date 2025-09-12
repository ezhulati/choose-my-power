/**
 * Enhanced URL Parser for Scalable Faceted Navigation
 * Handles thousands of city/filter combinations with optimized routing
 * Updated for new /texas/[city]/[...filters]/ URL structure
 */

import type { ApiParams, FacetedUrl } from '../../types/facets';
import { tdspMapping, formatCityName } from '../../config/tdsp-mapping';
import { comparePowerClient } from '../api/comparepower-client';

/**
 * Parse faceted URL into city and filter components
 * Enhanced to handle thousands of city/filter combinations
 * @param path - URL path like 'dallas-tx/12-month/fixed-rate'
 * @returns Parsed components for API and rendering
 */
export function parseFacetedUrl(path: string): FacetedUrl {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    throw new Error('Invalid URL path: empty');
  }
  
  const city = segments[0];
  const filters = segments.slice(1);
  
  // Validate city exists in our comprehensive mapping
  if (!tdspMapping[city]) {
    throw new Error(`Invalid city: ${city}. City not found in TDSP mapping.`);
  }
  
  // Validate filter combination
  if (!validateFilterCombination(filters)) {
    throw new Error(`Invalid filter combination: ${filters.join('/')}`);
  }
  
  // Convert filters to API parameters
  const apiParams = buildApiParams(city, filters);
  
  return {
    city,
    filters,
    apiParams
  };
}

/**
 * Validate filter combinations to prevent invalid URLs
 * Enhanced for thousands of combinations
 */
export function validateFilterCombination(filters: string[]): boolean {
  // Maximum filter depth (prevent infinite combinations)
  if (filters.length > 3) {
    return false;
  }
  
  // Valid filter types
  const validFilters = new Set([
    // Term filters
    '6-month', '12-month', '24-month', '36-month',
    // Rate type filters  
    'fixed-rate', 'variable-rate', 'indexed-rate',
    // Green energy filters
    'green-energy', 'partial-green', 'some-green',
    // Feature filters
    'prepaid', 'no-deposit', 'autopay-discount', 'time-of-use',
    'free-weekends', 'bill-credit', 'month-to-month'
  ]);
  
  // Check if all filters are valid
  for (const filter of filters) {
    if (!validFilters.has(filter)) {
      console.warn(`Invalid filter detected: ${filter}`);
      return false;
    }
  }
  
  // Prevent conflicting filters
  const termFilters = filters.filter(f => f.endsWith('-month'));
  if (termFilters.length > 1) {
    return false; // Only one term filter allowed
  }
  
  const rateFilters = filters.filter(f => f.includes('-rate'));
  if (rateFilters.length > 1) {
    return false; // Only one rate type allowed
  }
  
  const greenFilters = filters.filter(f => f.includes('green'));
  if (greenFilters.length > 1) {
    return false; // Only one green energy level allowed
  }
  
  return true;
}

/**
 * Build API parameters from city and filters
 * Enhanced to handle comprehensive filter mapping
 */
function buildApiParams(city: string, filters: string[]): ApiParams {
  const tdspData = tdspMapping[city];
  const params: ApiParams = {
    tdsp_duns: tdspData.duns,
    display_usage: 1000 // Standard usage for comparison
  };
  
  // Process each filter with enhanced mapping
  for (const filter of filters) {
    switch (filter) {
      // Term filters
      case '6-month':
        params.term = 6;
        break;
      case '12-month':
        params.term = 12;
        break;
      case '24-month':
        params.term = 24;
        break;
      case '36-month':
        params.term = 36;
        break;
        
      // Green energy filters
      case 'green-energy':
        params.percent_green = 100;
        break;
      case 'partial-green':
        params.percent_green = 50;
        break;
      case 'some-green':
        params.percent_green = 10;
        break;
        
      // Feature filters
      case 'prepaid':
        params.is_pre_pay = true;
        break;
      case 'time-of-use':
        params.is_time_of_use = true;
        break;
      case 'autopay-discount':
        params.requires_auto_pay = true;
        break;
        
      // Rate type filters handled by API filtering
      case 'fixed-rate':
      case 'variable-rate':
      case 'indexed-rate':
        // These will be filtered post-API based on plan data
        break;
        
      default:
        console.warn(`Unhandled filter in API params: ${filter}`);
    }
  }
  
  return params;
}

/**
 * Fetch plans from API with enhanced caching and error handling
 * Optimized for thousands of concurrent requests
 */
export async function fetchPlansFromAPI(params: ApiParams): Promise<unknown[]> {
  try {
    const plans = await comparePowerClient.fetchPlans(params);
    
    if (!plans || plans.length === 0) {
      console.warn('No plans returned from API for params:', params);
      return [];
    }
    
    return plans;
  } catch (error) {
    console.error('Error fetching plans from API:', error);
    
    // Return empty array instead of throwing to prevent page errors
    // Consider implementing fallback data or cached responses here
    return [];
  }
}

export function addFilterToUrl(currentPath: string, filterValue: string): string {
  const pathParts = currentPath.split('/').filter(Boolean);
  
  // New URL structure: /texas/[city]/[...filters]/
  if (pathParts.length < 2 || pathParts[0] !== 'texas') {
    return currentPath;
  }
  
  const city = pathParts[1];
  const currentFilters = pathParts.slice(2);
  
  // Add new filter if not already present
  if (!currentFilters.includes(filterValue)) {
    currentFilters.push(filterValue);
  }
  
  // Generate new path
  return `/texas/${city}/${currentFilters.join('/')}`;
}

export function removeFilterFromUrl(currentPath: string, filterValue: string): string {
  const pathParts = currentPath.split('/').filter(Boolean);
  
  // New URL structure: /texas/[city]/[...filters]/
  if (pathParts.length < 2 || pathParts[0] !== 'texas') {
    return currentPath;
  }
  
  const city = pathParts[1];
  const currentFilters = pathParts.slice(2);
  
  // Remove the filter
  const newFilters = currentFilters.filter(f => f !== filterValue);
  
  // Generate new path
  if (newFilters.length === 0) {
    return `/texas/${city}`;
  }
  
  return `/texas/${city}/${newFilters.join('/')}`;
}

export function extractFiltersFromPath(path: string): string[] {
  const pathParts = path.split('/').filter(Boolean);
  
  // New URL structure: /texas/[city]/[...filters]/
  if (pathParts.length < 2 || pathParts[0] !== 'texas') {
    return [];
  }
  
  // Return everything after city as filters
  return pathParts.slice(2);
}

export function parseUrlFilters(url: string): {
  city: string;
  filters: string[];
} {
  const pathParts = url.split('/');
  const cityIndex = pathParts.findIndex(part => part === 'electricity-plans') - 1;
  
  return {
    city: cityIndex >= 0 ? pathParts[cityIndex] : '',
    filters: extractFiltersFromPath(url)
  };
}

/**
 * Generate URL from city and filters
 * Used for navigation and canonical URLs
 */
export function generateFacetedUrl(city: string, filters: string[] = []): string {
  const baseUrl = `/texas/${city}`;
  if (filters.length === 0) {
    return `${baseUrl}/`;
  }
  return `${baseUrl}/${filters.join('/')}/`;
}

/**
 * Get all possible filter combinations for a city
 * Used for sitemap generation and internal linking
 */
export function getFilterCombinations(city: string, maxDepth: number = 2): string[][] {
  if (!tdspMapping[city]) {
    return [];
  }
  
  const baseFilters = [
    ['12-month'],
    ['24-month'], 
    ['fixed-rate'],
    ['variable-rate'],
    ['green-energy'],
    ['prepaid'],
    ['no-deposit'],
    ['time-of-use']
  ];
  
  const combinations: string[][] = [[]]; // Start with empty (city page)
  combinations.push(...baseFilters); // Add single filters
  
  // Add two-filter combinations for high-value cities
  const cityTier = tdspMapping[city].tier || 3;
  if (cityTier <= 2 && maxDepth >= 2) {
    const highValuePairs = [
      ['12-month', 'fixed-rate'],
      ['12-month', 'green-energy'], 
      ['fixed-rate', 'green-energy'],
      ['prepaid', 'no-deposit'],
      ['24-month', 'fixed-rate']
    ];
    
    combinations.push(...highValuePairs);
  }
  
  return combinations;
}

/**
 * Check if a filter combination should be indexed by search engines
 * Used for robots meta tags and sitemap generation
 */
export function shouldIndexCombination(city: string, filters: string[]): boolean {
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // Always index city pages
  if (filters.length === 0) {
    return true;
  }
  
  // Index single filters for Tier 1 and 2 cities
  if (filters.length === 1 && cityTier <= 2) {
    return true;
  }
  
  // Index specific high-value combinations for Tier 1 cities only
  if (filters.length === 2 && cityTier === 1) {
    const highValueCombos = [
      ['12-month', 'fixed-rate'],
      ['12-month', 'green-energy'],
      ['prepaid', 'no-deposit']
    ];
    
    return highValueCombos.some(combo => 
      combo.every(filter => filters.includes(filter)) &&
      combo.length === filters.length
    );
  }
  
  // Don't index deep combinations
  return false;
}

/**
 * Get sitemap priority for a city/filter combination
 * Used for XML sitemap generation
 */
export function getSitemapPriority(city: string, filters: string[]): number {
  const cityTier = tdspMapping[city]?.tier || 3;
  const basePriority = tdspMapping[city]?.priority || 0.5;
  
  // City pages get full priority
  if (filters.length === 0) {
    return basePriority;
  }
  
  // Reduce priority based on filter depth
  const depthPenalty = filters.length * 0.1;
  const tierBonus = cityTier === 1 ? 0.1 : cityTier === 2 ? 0.05 : 0;
  
  return Math.max(0.1, basePriority - depthPenalty + tierBonus);
}

/**
 * Get change frequency for sitemap
 * Based on city tier and filter combination
 */
export function getChangeFrequency(city: string, filters: string[]): string {
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // High-traffic city pages change more frequently
  if (filters.length === 0) {
    return cityTier === 1 ? 'daily' : cityTier === 2 ? 'weekly' : 'monthly';
  }
  
  // Filter pages change less frequently
  return cityTier === 1 ? 'weekly' : 'monthly';
}

/**
 * Determine if a page represents a high-value SEO combination
 * Used by canonical and sitemap logic
 */
export function isHighValuePage(city: string, filters: string[]): boolean {
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // High-value single filters
  const highValueSingleFilters = [
    '12-month', '24-month', 'fixed-rate', 'variable-rate', 
    'green-energy', 'prepaid', 'no-deposit'
  ];
  
  // High-value two-filter combinations
  const highValueCombinations = [
    ['12-month', 'fixed-rate'],
    ['24-month', 'fixed-rate'],
    ['green-energy', '12-month'],
    ['green-energy', 'fixed-rate'],
    ['prepaid', 'no-deposit'],
    ['12-month', 'autopay-discount'],
    ['fixed-rate', 'autopay-discount']
  ];
  
  // No filters (city page) is always high value for Tier 1 and 2 cities
  if (filters.length === 0) {
    return cityTier <= 2;
  }
  
  // Single high-value filters for Tier 1 and 2 cities
  if (filters.length === 1 && cityTier <= 2) {
    return highValueSingleFilters.includes(filters[0]);
  }
  
  // Two-filter high-value combinations for Tier 1 cities only
  if (filters.length === 2 && cityTier === 1) {
    return highValueCombinations.some(combo =>
      combo.length === filters.length &&
      combo.every(f => filters.includes(f))
    );
  }
  
  // Three or more filters are typically not high-value for SEO
  return false;
}