/**
 * Scalable Canonical URL System
 * Handles canonical logic for thousands of city/filter combinations
 * Prevents duplicate content penalties and manages crawl budget
 * 
 * SEO Strategist Agent - Phase 2 Implementation
 */

import { tdspMapping } from '../../config/tdsp-mapping';

/**
 * Determine canonical URL for city/filter combinations at scale
 * Implements hierarchical canonicalization strategy
 */
export function determineCanonicalUrl(currentPath: string, filters: string[], cityPriority: number = 0.5): string {
  const baseUrl = 'https://choosemypower.org';
  
  // Extract city from path
  const pathParts = currentPath.split('/').filter(Boolean);
  if (pathParts.length < 2 || pathParts[0] !== 'texas') {
    return `${baseUrl}${currentPath}`;
  }
  
  const city = pathParts[1];
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // Self-canonicalizing high-value combinations
  const selfCanonicalCombos = getSelfCanonicalCombinations(cityTier);
  
  // Check if current combination should self-canonicalize
  if (shouldSelfCanonicalize(filters, selfCanonicalCombos, cityTier)) {
    return `${baseUrl}${currentPath}`;
  }
  
  // Complex combinations canonical to simpler versions
  if (filters.length > 2) {
    // Canonical to two-filter combination
    const canonicalFilters = filters.slice(0, 2);
    return `${baseUrl}/texas/${city}/${canonicalFilters.join('/')}/`;
  }
  
  // Two-filter combinations for Tier 3 cities canonical to single filter
  if (filters.length === 2 && cityTier === 3) {
    const primaryFilter = getPrimaryFilter(filters);
    return `${baseUrl}/texas/${city}/${primaryFilter}/`;
  }
  
  // Low-value single filters canonical to city page for Tier 3 cities
  if (filters.length === 1 && cityTier === 3) {
    const lowValueFilters = ['variable-rate', 'indexed-rate', 'some-green', 'time-of-use'];
    if (lowValueFilters.includes(filters[0])) {
      return `${baseUrl}/texas/${city}/`;
    }
  }
  
  // Default to self-canonical
  return `${baseUrl}${currentPath}`;
}

/**
 * Get self-canonical combinations based on city tier
 */
function getSelfCanonicalCombinations(cityTier: number): string[][] {
  // Base high-value combinations for all cities
  const baseCombos = [
    [], // City pages always self-canonical
    ['12-month'],
    ['fixed-rate'],
    ['green-energy'],
    ['prepaid']
  ];
  
  // Additional combinations for Tier 2 cities
  if (cityTier <= 2) {
    baseCombos.push(
      ['24-month'],
      ['no-deposit'],
      ['12-month', 'fixed-rate'],
      ['12-month', 'green-energy']
    );
  }
  
  // Additional combinations for Tier 1 cities (major metros)
  if (cityTier === 1) {
    baseCombos.push(
      ['fixed-rate', 'green-energy'],
      ['prepaid', 'no-deposit'],
      ['24-month', 'fixed-rate'],
      ['variable-rate'] // Only Tier 1 cities get variable rate self-canonical
    );
  }
  
  return baseCombos;
}

/**
 * Check if a combination should self-canonicalize
 */
function shouldSelfCanonicalize(filters: string[], selfCanonicalCombos: string[][], cityTier: number): boolean {
  return selfCanonicalCombos.some(combo => 
    combo.length === filters.length && 
    combo.every(f => filters.includes(f))
  );
}

/**
 * Get primary filter from a combination for canonical purposes
 */
function getPrimaryFilter(filters: string[]): string {
  // Priority order for filters
  const filterPriority = [
    '12-month',
    '24-month',
    'fixed-rate', 
    'green-energy',
    'prepaid',
    'no-deposit',
    'variable-rate',
    'autopay-discount',
    'time-of-use'
  ];
  
  for (const priority of filterPriority) {
    if (filters.includes(priority)) {
      return priority;
    }
  }
  
  return filters[0]; // Fallback to first filter
}

/**
 * Generate canonical link tag HTML
 */
export function generateCanonicalTag(currentPath: string, filters: string[], cityPriority: number = 0.5): string {
  const canonicalUrl = determineCanonicalUrl(currentPath, filters, cityPriority);
  return `<link rel="canonical" href="${canonicalUrl}">`;
}

/**
 * Check if current page is its own canonical
 */
export function isSelfCanonical(currentPath: string, filters: string[], cityPriority: number = 0.5): boolean {
  const canonicalUrl = determineCanonicalUrl(currentPath, filters, cityPriority);
  const currentUrl = `https://choosemypower.org${currentPath}`;
  return canonicalUrl === currentUrl;
}

/**
 * Get all canonical URLs for a city (for sitemap generation)
 */
export function getCityCanonicalUrls(city: string): string[] {
  const cityTier = tdspMapping[city]?.tier || 3;
  const selfCanonicalCombos = getSelfCanonicalCombinations(cityTier);
  const baseUrl = 'https://choosemypower.org';
  
  return selfCanonicalCombos.map(filters => {
    if (filters.length === 0) {
      return `${baseUrl}/texas/${city}/`;
    }
    return `${baseUrl}/texas/${city}/${filters.join('/')}/`;
  });
}

/**
 * Validate canonical URL strategy for a city
 * Returns potential issues for review
 */
export function validateCanonicalStrategy(city: string): string[] {
  const issues: string[] = [];
  const cityTier = tdspMapping[city]?.tier || 3;
  const canonicalUrls = getCityCanonicalUrls(city);
  
  // Check for minimum canonical pages
  if (canonicalUrls.length < 3 && cityTier <= 2) {
    issues.push(`Tier ${cityTier} city ${city} has only ${canonicalUrls.length} canonical URLs - should have at least 3`);
  }
  
  // Check for too many canonical pages for small cities
  if (canonicalUrls.length > 5 && cityTier === 3) {
    issues.push(`Tier 3 city ${city} has ${canonicalUrls.length} canonical URLs - consider reducing for crawl budget`);
  }
  
  return issues;
}

/**
 * Generate robots meta tag based on canonical status
 */
export function generateRobotsMetaTag(currentPath: string, filters: string[], cityPriority: number = 0.5): string {
  const isCanonical = isSelfCanonical(currentPath, filters, cityPriority);
  const city = extractCityFromPath(currentPath);
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // Always index canonical pages
  if (isCanonical) {
    return 'index,follow';
  }
  
  // Noindex non-canonical pages to prevent duplicate content
  return 'noindex,follow';
}

/**
 * Extract city from path
 */
function extractCityFromPath(path: string): string {
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length >= 2 && pathParts[0] === 'texas') {
    return pathParts[1];
  }
  return '';
}

/**
 * Get canonical URL patterns for all cities (for comprehensive sitemap)
 */
export function getAllCanonicalPatterns(): Map<string, string[]> {
  const canonicalMap = new Map<string, string[]>();
  
  Object.keys(tdspMapping).forEach(city => {
    const canonicalUrls = getCityCanonicalUrls(city);
    canonicalMap.set(city, canonicalUrls);
  });
  
  return canonicalMap;
}

/**
 * Calculate canonical coverage statistics
 */
export interface CanonicalStats {
  totalCities: number;
  totalCanonicalUrls: number;
  avgCanonicalPerCity: number;
  tier1Cities: number;
  tier2Cities: number;
  tier3Cities: number;
  tier1CanonicalUrls: number;
  tier2CanonicalUrls: number;
  tier3CanonicalUrls: number;
}

export function getCanonicalStats(): CanonicalStats {
  const canonicalMap = getAllCanonicalPatterns();
  let totalCanonicalUrls = 0;
  let tier1Cities = 0, tier2Cities = 0, tier3Cities = 0;
  let tier1CanonicalUrls = 0, tier2CanonicalUrls = 0, tier3CanonicalUrls = 0;
  
  canonicalMap.forEach((urls, city) => {
    const cityTier = tdspMapping[city]?.tier || 3;
    totalCanonicalUrls += urls.length;
    
    if (cityTier === 1) {
      tier1Cities++;
      tier1CanonicalUrls += urls.length;
    } else if (cityTier === 2) {
      tier2Cities++;
      tier2CanonicalUrls += urls.length;
    } else {
      tier3Cities++;
      tier3CanonicalUrls += urls.length;
    }
  });
  
  return {
    totalCities: canonicalMap.size,
    totalCanonicalUrls,
    avgCanonicalPerCity: totalCanonicalUrls / canonicalMap.size,
    tier1Cities,
    tier2Cities,
    tier3Cities,
    tier1CanonicalUrls,
    tier2CanonicalUrls,
    tier3CanonicalUrls
  };
}