/**
 * Canonical URL Logic for Faceted Navigation
 * Implements smart canonicalization rules to prevent duplicate content issues
 * while maximizing SEO value from high-value filter combinations
 */

import { isHighValuePage } from '../faceted/url-parser';

export interface CanonicalRule {
  pattern: RegExp;
  canonicalPath: (match: RegExpMatchArray) => string;
  reason: string;
}

/**
 * Determine canonical URL for a given faceted page path
 * @param currentPath - The current URL path
 * @param filters - Array of active filters
 * @returns Canonical URL for the page
 */
export function determineCanonicalUrl(currentPath: string, filters: string[]): string {
  const baseUrl = 'https://choosemypower.org';
  const normalizedPath = currentPath.replace(/\/+$/, ''); // Remove trailing slashes
  
  // High-value combinations that should self-canonicalize
  const selfCanonicalCombos = [
    // Single high-value filters
    ['12-month'],
    ['fixed-rate'], 
    ['green-energy'],
    ['prepaid'],
    ['24-month'],
    ['variable-rate'],
    ['partial-green'],
    ['autopay-discount'],
    ['no-deposit'],
    
    // High-value two-filter combinations
    ['12-month', 'fixed-rate'],
    ['24-month', 'fixed-rate'], 
    ['prepaid', 'no-deposit'],
    ['green-energy', '12-month'],
    ['green-energy', 'fixed-rate'],
    ['12-month', 'autopay-discount'],
    ['fixed-rate', 'autopay-discount'],
  ];

  // Check if current combination should self-canonicalize
  const isHighValue = selfCanonicalCombos.some(combo => 
    combo.length === filters.length && 
    combo.every(f => filters.includes(f)) &&
    combo.every(f => filters.includes(f)) // Exact match required
  );

  // Self-canonical for high-value combinations
  if (isHighValue) {
    return `${baseUrl}${normalizedPath}/`;
  }

  // Apply canonicalization rules based on URL patterns
  const canonicalRules: CanonicalRule[] = [
    // Rule 1: Deep filter combinations (3+ filters) canonical to 2-filter parent
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/${match[2]}/${match[3]}/`,
      reason: 'Deep combinations canonical to simpler version'
    },

    // Rule 2: Three filters canonical to two most important filters
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)$/,
      canonicalPath: (match) => {
        // Prioritize: term > rate_type > green_energy > features
        const city = match[1];
        const filters = [match[2], match[3], match[4]];
        const priorityOrder = ['12-month', '24-month', '6-month', '36-month', 'fixed-rate', 'variable-rate', 'green-energy', 'prepaid'];
        
        const sortedFilters = filters.sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a);
          const bIndex = priorityOrder.indexOf(b);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

        return `/electricity-plans/${city}/${sortedFilters[0]}/${sortedFilters[1]}/`;
      },
      reason: 'Three filters canonical to top two priority filters'
    },

    // Rule 3: Low-value filters canonical to city page
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/(time-of-use|business|spanish-plans|weekend-free)\/$/,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/`,
      reason: 'Low-value filters canonical to city page'
    },

    // Rule 4: Usage-based filters canonical to base filter (usage is not valuable for SEO)
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]+)\/(500-kwh|1000-kwh|2000-kwh)\/$/,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/${match[2]}/`,
      reason: 'Usage-based filters not valuable for SEO'
    },

    // Rule 5: Sorting and pagination parameters canonical to base
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]*)\?(sort|page|limit)=/,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/${match[2] || ''}`,
      reason: 'Sorting and pagination canonical to base'
    },

    // Rule 6: Complex rate type combinations canonical to simpler version
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]+)\/variable-rate\/indexed-rate\/$/,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/${match[2]}/variable-rate/`,
      reason: 'Multiple rate types canonical to primary rate type'
    },

    // Rule 7: Duplicate filter types canonical to first occurrence
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/12-month\/24-month\//,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/12-month/`,
      reason: 'Duplicate filter types canonical to first occurrence'
    },

    // Rule 8: Invalid combinations canonical to city page
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/.*\/(invalid|test|debug)\//,
      canonicalPath: (match) => `/electricity-plans/${match[1]}/`,
      reason: 'Invalid filter combinations canonical to city page'
    },
  ];

  // Apply canonicalization rules
  for (const rule of canonicalRules) {
    const match = normalizedPath.match(rule.pattern);
    if (match) {
      const canonicalPath = rule.canonicalPath(match);
      return `${baseUrl}${canonicalPath}`;
    }
  }

  // Default: self-canonical for city pages and unmatched patterns
  return `${baseUrl}${normalizedPath}/`;
}

/**
 * Check if a URL should be noindexed
 * @param currentPath - The current URL path
 * @param filters - Array of active filters
 * @returns Boolean indicating if page should be noindexed
 */
export function shouldNoIndex(currentPath: string, filters: string[]): boolean {
  // NoIndex rules
  const noIndexConditions = [
    // Too many filters (3+ filters)
    filters.length > 2,
    
    // Low-value filter combinations
    filters.some(filter => ['time-of-use', 'business', 'spanish-plans'].includes(filter)),
    
    // Usage-specific pages (not valuable for users)
    filters.some(filter => ['500-kwh', '1000-kwh', '2000-kwh'].includes(filter)),
    
    // Test or invalid filters
    filters.some(filter => ['test', 'debug', 'invalid'].includes(filter)),
    
    // Very specific combinations unlikely to have search volume
    filters.length === 2 && !isHighValuePage(currentPath),
  ];

  return noIndexConditions.some(condition => condition);
}

/**
 * Generate robots meta tag content
 * @param currentPath - The current URL path
 * @param filters - Array of active filters
 * @returns Robots meta tag content
 */
export function generateRobotsMetaTag(currentPath: string, filters: string[]): string {
  const noIndex = shouldNoIndex(currentPath, filters);
  
  if (noIndex) {
    return 'noindex, follow';
  }
  
  // High-value pages get enhanced crawling
  if (isHighValuePage(currentPath)) {
    return 'index, follow, max-snippet:160, max-image-preview:large';
  }
  
  // Default indexing
  return 'index, follow';
}

/**
 * Check if two URLs are considered duplicates for canonicalization
 * @param url1 - First URL path
 * @param url2 - Second URL path  
 * @returns Boolean indicating if URLs are duplicates
 */
export function areUrlsDuplicate(url1: string, url2: string): boolean {
  const canonical1 = determineCanonicalUrl(url1, []);
  const canonical2 = determineCanonicalUrl(url2, []);
  
  return canonical1 === canonical2;
}

/**
 * Get canonical priority for sitemap generation
 * @param currentPath - The current URL path
 * @param filters - Array of active filters
 * @returns Priority value between 0.0 and 1.0
 */
export function getCanonicalPriority(currentPath: string, filters: string[]): number {
  // City pages get highest priority
  if (filters.length === 0) {
    return 1.0;
  }
  
  // High-value single filters
  if (filters.length === 1 && isHighValuePage(currentPath)) {
    return 0.8;
  }
  
  // High-value combinations  
  if (filters.length === 2 && isHighValuePage(currentPath)) {
    return 0.6;
  }
  
  // Self-canonical pages get their natural priority
  const canonicalUrl = determineCanonicalUrl(currentPath, filters);
  const baseUrl = 'https://choosemypower.org';
  if (canonicalUrl === `${baseUrl}${currentPath}`) {
    return Math.max(0.4, 0.8 - (filters.length * 0.2));
  }
  
  // Non-canonical pages get low priority
  return 0.1;
}

/**
 * Generate change frequency for sitemap
 * @param currentPath - The current URL path
 * @param filters - Array of active filters
 * @returns Change frequency string
 */
export function getChangeFrequency(currentPath: string, filters: string[]): string {
  // City pages change most frequently (new plans added/removed daily)
  if (filters.length === 0) {
    return 'daily';
  }
  
  // Single filter pages change frequently
  if (filters.length === 1) {
    return 'daily';
  }
  
  // Multi-filter combinations change less frequently
  if (filters.length === 2) {
    return 'weekly';
  }
  
  // Deep combinations rarely change
  return 'monthly';
}

/**
 * Generate hreflang alternate URLs (if multi-language support is added)
 * @param currentPath - The current URL path
 * @returns Array of hreflang alternate URLs
 */
export function generateHreflangAlternates(currentPath: string): Array<{lang: string, url: string}> {
  const baseUrl = 'https://choosemypower.org';
  
  // Currently only English, but structure for future Spanish support
  return [
    {
      lang: 'en',
      url: `${baseUrl}${currentPath}`
    },
    // Future: Spanish support
    // {
    //   lang: 'es',
    //   url: `${baseUrl}/es${currentPath}`
    // }
  ];
}

// Export utility function for testing canonicalization rules
export function getCanonicalReason(currentPath: string, filters: string[]): string {
  const canonicalUrl = determineCanonicalUrl(currentPath, filters);
  const baseUrl = 'https://choosemypower.org';
  
  if (canonicalUrl === `${baseUrl}${currentPath}/`) {
    return 'Self-canonical (high-value or city page)';
  }
  
  // Try to match against rules to get reason
  const rules: CanonicalRule[] = [
    {
      pattern: /^\/electricity-plans\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/,
      canonicalPath: () => '',
      reason: 'Deep combinations canonical to simpler version'
    }
    // Add other rules as needed for debugging
  ];
  
  for (const rule of rules) {
    if (currentPath.match(rule.pattern)) {
      return rule.reason;
    }
  }
  
  return 'Canonical rule applied';
}