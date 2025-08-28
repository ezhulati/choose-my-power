/**
 * Advanced Scalable Canonical URL System - Production Enhanced
 * Handles canonical logic for 10,000+ city/filter combinations with intelligent hierarchies
 * Prevents duplicate content penalties and optimizes crawl budget distribution
 * 
 * FEATURES:
 * - Multi-tier canonical hierarchies based on search volume and city importance
 * - Advanced conflicting filter resolution (e.g., multiple term lengths)
 * - Seasonal canonical switching for time-sensitive content
 * - Automatic canonical testing and validation
 * - Performance-optimized lookup tables for O(1) canonical resolution
 * 
 * STRATEGY:
 * - Hub pages: City pages (highest authority)
 * - Spoke pages: High-value single filters (distribute authority)
 * - Leaf pages: Multi-filter combinations (canonical to spokes)
 * - Pruning: Low-value combinations (canonical to higher levels)
 */

import { tdspMapping } from '../../config/tdsp-mapping';

/**
 * Enhanced canonical URL determination with advanced hierarchical logic
 * Handles 10,000+ combinations with intelligent canonicalization rules
 */
export function determineCanonicalUrl(
  currentPath: string, 
  filters: string[], 
  cityPriority: number = 0.5,
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall',
  marketData?: { searchVolume: number; competition: number; }
): string {
  const baseUrl = 'https://choosemypower.org';
  
  // Extract and validate path components
  const pathParts = currentPath.split('/').filter(Boolean);
  if (pathParts.length < 2 || pathParts[0] !== 'texas') {
    return `${baseUrl}${currentPath}`;
  }
  
  const city = pathParts[1];
  const cityData = tdspMapping[city];
  if (!cityData) {
    return `${baseUrl}${currentPath}`;
  }
  
  const cityTier = cityData.tier || 3;
  const cityPop = getCityPopulation(city);
  
  // Advanced canonicalization decision tree
  const canonicalDecision = getCanonicalDecision({
    city,
    filters,
    cityTier,
    cityPop,
    seasonalContext,
    marketData,
    currentPath
  });
  
  return `${baseUrl}${canonicalDecision.canonicalPath}`;
}

/**
 * Advanced canonical decision engine
 */
interface CanonicalContext {
  city: string;
  filters: string[];
  cityTier: number;
  cityPop: number;
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
  marketData?: { searchVolume: number; competition: number; };
  currentPath: string;
}

interface CanonicalDecision {
  canonicalPath: string;
  reason: string;
  priority: number;
  shouldIndex: boolean;
}

function getCanonicalDecision(context: CanonicalContext): CanonicalDecision {
  const { city, filters, cityTier, cityPop, seasonalContext, marketData, currentPath } = context;
  
  // Rule 1: City pages always self-canonical (highest authority hubs)
  if (filters.length === 0) {
    return {
      canonicalPath: `/texas/${city}/`,
      reason: 'City hub page - highest authority',
      priority: 1.0,
      shouldIndex: true
    };
  }
  
  // Rule 2: Conflicting filters canonical to primary filter
  const conflictingFilters = detectConflictingFilters(filters);
  if (conflictingFilters.length > 0) {
    const primaryFilter = resolveConflictingFilters(conflictingFilters);
    return {
      canonicalPath: `/texas/${city}/${primaryFilter}/`,
      reason: 'Conflicting filters resolved to primary',
      priority: 0.7,
      shouldIndex: false
    };
  }
  
  // Rule 3: High-value combinations self-canonical based on market data
  const isHighValue = isHighValueCombination(filters, cityTier, marketData);
  if (isHighValue) {
    return {
      canonicalPath: currentPath,
      reason: 'High-value combination with search demand',
      priority: getHighValuePriority(filters, cityTier, marketData),
      shouldIndex: true
    };
  }
  
  // Rule 4: Seasonal canonicalization for time-sensitive filters
  const seasonalCanonical = getSeasonalCanonical(filters, seasonalContext);
  if (seasonalCanonical) {
    return {
      canonicalPath: `/texas/${city}/${seasonalCanonical}/`,
      reason: 'Seasonal canonical optimization',
      priority: 0.6,
      shouldIndex: true
    };
  }
  
  // Rule 5: Deep combinations canonical to parent combinations
  if (filters.length > 2) {
    const parentFilters = getOptimalParentCombination(filters, cityTier);
    return {
      canonicalPath: `/texas/${city}/${parentFilters.join('/')}/`,
      reason: 'Deep combination canonical to optimal parent',
      priority: 0.3,
      shouldIndex: false
    };
  }
  
  // Rule 6: Two-filter combinations for smaller cities
  if (filters.length === 2 && cityTier === 3 && cityPop < 50000) {
    const primaryFilter = getPrimaryFilter(filters);
    return {
      canonicalPath: `/texas/${city}/${primaryFilter}/`,
      reason: 'Small city - reduce combination complexity',
      priority: 0.4,
      shouldIndex: false
    };
  }
  
  // Rule 7: Low-search-volume filters canonical to city
  if (filters.length === 1 && isLowSearchVolumeFilter(filters[0], marketData)) {
    return {
      canonicalPath: `/texas/${city}/`,
      reason: 'Low search volume filter canonical to city',
      priority: 0.2,
      shouldIndex: false
    };
  }
  
  // Rule 8: Default self-canonical for remaining valid combinations
  return {
    canonicalPath: currentPath,
    reason: 'Valid combination - self canonical',
    priority: Math.max(0.3, 0.8 - (filters.length * 0.2)),
    shouldIndex: filters.length <= 2 && cityTier <= 2
  };
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
export function getCanonicalIssues(city: string): string[] {
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

/**
 * Advanced helper functions for enhanced canonical system
 */

// Get city population for canonicalization decisions
function getCityPopulation(city: string): number {
  const populationMap: Record<string, number> = {
    'houston-tx': 2304580,
    'dallas-tx': 1343573,
    'austin-tx': 978908,
    'fort-worth-tx': 918915,
    'san-antonio-tx': 1547253,
    'arlington-tx': 398854,
    'corpus-christi-tx': 326586,
    'plano-tx': 288061,
    'lubbock-tx': 258862,
    'laredo-tx': 261639,
    'garland-tx': 246018,
    'irving-tx': 239798,
    'amarillo-tx': 200393,
    'grand-prairie-tx': 196100,
    'brownsville-tx': 186738,
    'mcallen-tx': 142696,
    'mesquite-tx': 150108,
    'waco-tx': 138486,
    'richardson-tx': 121323,
    'lewisville-tx': 111822
    // Add more cities as needed
  };
  
  return populationMap[city] || 25000; // Default small city population
}

// Detect conflicting filter combinations
function detectConflictingFilters(filters: string[]): string[] {
  const conflicts: string[] = [];
  
  // Term length conflicts
  const termFilters = filters.filter(f => f.endsWith('-month'));
  if (termFilters.length > 1) {
    conflicts.push(...termFilters);
  }
  
  // Rate type conflicts
  const rateFilters = filters.filter(f => f.includes('-rate'));
  if (rateFilters.length > 1) {
    conflicts.push(...rateFilters);
  }
  
  // Green energy conflicts
  const greenFilters = filters.filter(f => f.includes('green'));
  if (greenFilters.length > 1) {
    conflicts.push(...greenFilters);
  }
  
  return conflicts;
}

// Resolve conflicting filters to primary filter
function resolveConflictingFilters(conflictingFilters: string[]): string {
  const filterPriority = {
    '12-month': 10,
    '24-month': 9,
    '6-month': 8,
    '36-month': 7,
    'fixed-rate': 9,
    'variable-rate': 6,
    'indexed-rate': 5,
    'green-energy': 8,
    'partial-green': 6,
    'some-green': 4
  };
  
  return conflictingFilters.sort((a, b) => 
    (filterPriority[b] || 0) - (filterPriority[a] || 0)
  )[0];
}

// Determine if combination is high-value with market data
function isHighValueCombination(
  filters: string[], 
  cityTier: number, 
  marketData?: { searchVolume: number; competition: number; }
): boolean {
  // Base high-value filters
  const baseHighValue = ['12-month', '24-month', 'fixed-rate', 'green-energy', 'prepaid'];
  
  // Single filters
  if (filters.length === 1) {
    const isBaseHighValue = baseHighValue.includes(filters[0]);
    const hasSearchVolume = marketData ? marketData.searchVolume > 100 : true;
    return isBaseHighValue && hasSearchVolume && cityTier <= 2;
  }
  
  // Two-filter combinations
  if (filters.length === 2 && cityTier === 1) {
    const highValueCombos = [
      ['12-month', 'fixed-rate'],
      ['24-month', 'fixed-rate'],
      ['green-energy', '12-month'],
      ['green-energy', 'fixed-rate'],
      ['prepaid', 'no-deposit']
    ];
    
    const isHighValueCombo = highValueCombos.some(combo =>
      combo.every(f => filters.includes(f)) && combo.length === filters.length
    );
    
    const hasSearchVolume = marketData ? marketData.searchVolume > 50 : true;
    return isHighValueCombo && hasSearchVolume;
  }
  
  return false;
}

// Get priority for high-value combinations
function getHighValuePriority(
  filters: string[], 
  cityTier: number, 
  marketData?: { searchVolume: number; competition: number; }
): number {
  let basePriority = 0.8;
  
  // Adjust for city tier
  if (cityTier === 1) basePriority = 0.9;
  else if (cityTier === 2) basePriority = 0.7;
  else basePriority = 0.5;
  
  // Adjust for filter depth
  basePriority -= (filters.length - 1) * 0.1;
  
  // Adjust for market data
  if (marketData) {
    if (marketData.searchVolume > 500) basePriority += 0.1;
    if (marketData.competition < 0.3) basePriority += 0.05;
  }
  
  return Math.max(0.1, Math.min(1.0, basePriority));
}

// Get seasonal canonical for time-sensitive content
function getSeasonalCanonical(
  filters: string[], 
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall'
): string | null {
  if (!seasonalContext) return null;
  
  // Summer: Promote variable rate plans (market typically lower)
  if (seasonalContext === 'summer' && filters.includes('fixed-rate')) {
    return 'variable-rate';
  }
  
  // Winter: Promote fixed rate plans (market typically higher)
  if (seasonalContext === 'winter' && filters.includes('variable-rate')) {
    return 'fixed-rate';
  }
  
  return null;
}

// Get optimal parent combination for deep filters
function getOptimalParentCombination(filters: string[], cityTier: number): string[] {
  // Priority order for keeping filters in parent combination
  const keepPriority = [
    '12-month', '24-month', 'fixed-rate', 'green-energy', 
    'prepaid', 'no-deposit', 'variable-rate', 'autopay-discount'
  ];
  
  // For Tier 1 cities, keep top 2 filters
  if (cityTier === 1) {
    return filters
      .sort((a, b) => {
        const aIndex = keepPriority.indexOf(a);
        const bIndex = keepPriority.indexOf(b);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      })
      .slice(0, 2);
  }
  
  // For Tier 2 and 3 cities, keep top 1 filter
  return filters
    .sort((a, b) => {
      const aIndex = keepPriority.indexOf(a);
      const bIndex = keepPriority.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    })
    .slice(0, 1);
}

// Check if filter has low search volume
function isLowSearchVolumeFilter(
  filter: string, 
  marketData?: { searchVolume: number; competition: number; }
): boolean {
  const lowVolumeFilters = [
    'indexed-rate', 'some-green', 'time-of-use', 'free-weekends', 'bill-credit'
  ];
  
  const isInLowVolumeList = lowVolumeFilters.includes(filter);
  const hasLowSearchVolume = marketData ? marketData.searchVolume < 10 : false;
  
  return isInLowVolumeList || hasLowSearchVolume;
}

/**
 * Enhanced canonical testing and validation
 */
export function validateCanonicalStrategy(city: string): CanonicalValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const cityTier = tdspMapping[city]?.tier || 3;
  const canonicalUrls = getCityCanonicalUrls(city);
  
  // Validate minimum canonical pages
  if (canonicalUrls.length < 2 && cityTier <= 2) {
    issues.push(`Tier ${cityTier} city ${city} has only ${canonicalUrls.length} canonical URLs - needs at least 2`);
  }
  
  // Validate maximum canonical pages for crawl budget
  const maxCanonical = cityTier === 1 ? 15 : cityTier === 2 ? 8 : 4;
  if (canonicalUrls.length > maxCanonical) {
    warnings.push(`City ${city} has ${canonicalUrls.length} canonical URLs - consider reducing to ${maxCanonical} for crawl budget`);
  }
  
  // Recommend high-value additions
  if (cityTier === 1 && canonicalUrls.length < 10) {
    recommendations.push(`Tier 1 city ${city} could benefit from additional high-value filter combinations`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    recommendations
  };
}

export interface CanonicalValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Performance-optimized canonical lookup
 */
const canonicalCache = new Map<string, string>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function getCachedCanonicalUrl(
  currentPath: string, 
  filters: string[]
): string {
  const cacheKey = `${currentPath}|${filters.join(',')}`;
  
  if (canonicalCache.has(cacheKey)) {
    return canonicalCache.get(cacheKey)!;
  }
  
  const canonicalUrl = determineCanonicalUrl(currentPath, filters);
  canonicalCache.set(cacheKey, canonicalUrl);
  
  // Clean cache periodically
  if (canonicalCache.size > 10000) {
    const keysToDelete = Array.from(canonicalCache.keys()).slice(0, 1000);
    keysToDelete.forEach(key => canonicalCache.delete(key));
  }
  
  return canonicalUrl;
}

/**
 * Batch canonical URL generation for sitemap creation
 */
export async function generateBatchCanonicalUrls(cities: string[]): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  
  for (const city of cities) {
    const canonicalUrls = getCityCanonicalUrls(city);
    results.set(city, canonicalUrls);
  }
  
  return results;
}