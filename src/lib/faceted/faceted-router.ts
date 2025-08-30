/**
 * Faceted Navigation Router
 * Handles URL routing, validation, and API parameter generation
 * Integrates with the filter-mapper system for comprehensive parameter mapping
 */

import type { ApiParams, Plan } from '../../types/facets';
import { filterMapper, type FilterValidationResult, type AppliedFilter } from '../api/filter-mapper';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../config/tdsp-mapping';
import { comparePowerClient } from '../api/comparepower-client';
import { facetedMessaging, type FacetedMessage, type MessageContext } from './messaging-service';

export interface FacetedRouteResult {
  isValid: boolean;
  citySlug: string;
  cityName: string;
  tdspDuns: string | null;
  filterSegments: string[];
  filterResult: FilterValidationResult | null;
  plans: Plan[];
  error: string | null;
  redirectUrl: string | null;
  shouldIndex: boolean;
  canonicalUrl: string;
  messaging: FacetedMessage;
}

export interface RouteValidationOptions {
  maxFilterDepth?: number;
  allowInvalidFilters?: boolean;
  enableRedirects?: boolean;
  requirePlans?: boolean;
}

export class FacetedRouter {
  private readonly defaultOptions: RouteValidationOptions = {
    maxFilterDepth: 3,
    allowInvalidFilters: false,
    enableRedirects: true,
    requirePlans: false
  };

  // Enterprise-grade caching for 881-city scale
  private readonly MAX_CACHE_SIZE = 2000;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly cityValidationCache: Map<string, boolean> = new Map();
  private readonly tdspMappingCache: Map<string, string | null> = new Map();
  private readonly routeCache: Map<string, FacetedRouteResult> = new Map();

  /**
   * Parse and validate a faceted navigation URL
   * @param path URL path like 'dallas-tx/12-month/fixed-rate'
   * @param options Validation options
   * @returns Complete route validation result
   */
  async validateRoute(path: string, options: RouteValidationOptions = {}): Promise<FacetedRouteResult> {
    const opts = { ...this.defaultOptions, ...options };
    const pathSegments = path ? path.split('/').filter(Boolean) : [];

    // Initialize result object
    const result: FacetedRouteResult = {
      isValid: false,
      citySlug: '',
      cityName: '',
      tdspDuns: null,
      filterSegments: [],
      filterResult: null,
      plans: [],
      error: null,
      redirectUrl: null,
      shouldIndex: false,
      canonicalUrl: '',
      messaging: {
        headline: '',
        subheadline: '',
        cta: '',
        breadcrumbText: ''
      }
    };

    try {
      // 1. Validate basic URL structure
      if (pathSegments.length === 0) {
        result.error = 'Invalid URL: No city specified';
        result.redirectUrl = '/electricity-plans/';
        return result;
      }

      // 2. Extract city and filter segments
      const citySlug = pathSegments[0];
      const filterSegments = pathSegments.slice(1);

      result.citySlug = citySlug;
      result.filterSegments = filterSegments;

      // 3. Validate city exists
      if (!validateCitySlug(citySlug)) {
        result.error = `Invalid city: ${citySlug}`;
        result.redirectUrl = '/404';
        return result;
      }

      const tdspDuns = getTdspFromCity(citySlug);
      const cityName = formatCityName(citySlug);

      if (!tdspDuns) {
        result.error = `No TDSP mapping found for city: ${citySlug}`;
        result.redirectUrl = '/404';
        return result;
      }

      result.cityName = cityName;
      result.tdspDuns = tdspDuns;

      // 4. Validate filter depth
      if (filterSegments.length > opts.maxFilterDepth) {
        result.error = `Too many filters (max ${opts.maxFilterDepth})`;
        if (opts.enableRedirects) {
          const truncatedFilters = filterSegments.slice(0, opts.maxFilterDepth);
          result.redirectUrl = this.buildUrl(citySlug, truncatedFilters);
        }
        return result;
      }

      // 5. Parse and validate filters using filter-mapper
      const filterResult = filterMapper.mapFiltersToApiParams(citySlug, filterSegments, tdspDuns);
      result.filterResult = filterResult;

      // 6. Handle filter validation errors
      if (!filterResult.isValid && !opts.allowInvalidFilters) {
        result.error = `Invalid filter combination: ${filterResult.errors.join(', ')}`;
        
        if (opts.enableRedirects) {
          // Try to find a valid fallback URL
          result.redirectUrl = await this.findFallbackUrl(citySlug, filterSegments);
        }
        return result;
      }

      // 7. Generate canonical URL
      result.canonicalUrl = this.generateCanonicalUrl(citySlug, filterSegments, filterResult);

      // 8. Determine if page should be indexed
      result.shouldIndex = this.shouldIndexRoute(citySlug, filterSegments);

      // 9. Fetch plans if required
      if (opts.requirePlans && filterResult.isValid) {
        try {
          result.plans = await comparePowerClient.fetchPlans(filterResult.apiParams);
        } catch (error) {
          result.error = `Failed to fetch plans: ${error instanceof Error ? error.message : 'Unknown error'}`;
          // Don't return early - page can still render with error state
        }
      }

      // 10. Generate messaging for this route
      const messageContext: MessageContext = {
        cityName,
        citySlug,
        planCount: result.plans.length,
        lowestRate: result.plans.length > 0 ? Math.min(...result.plans.map(p => parseFloat(p.rate) || 999)) : 0,
        appliedFilters: filterResult.appliedFilters
      };

      result.messaging = facetedMessaging.generateMessage(messageContext);

      // 11. Mark as valid if we got this far
      result.isValid = filterResult.isValid || opts.allowInvalidFilters;

      return result;

    } catch (error) {
      result.error = `Route validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.redirectUrl = opts.enableRedirects ? `/electricity-plans/${result.citySlug || 'dallas-tx'}/` : null;
      return result;
    }
  }

  /**
   * Find the best fallback URL for invalid filter combinations
   */
  private async findFallbackUrl(citySlug: string, filterSegments: string[]): Promise<string> {
    // Try removing filters one by one from the end until we find a valid combination
    for (let i = filterSegments.length - 1; i >= 0; i--) {
      const testSegments = filterSegments.slice(0, i);
      const tdspDuns = getTdspFromCity(citySlug);
      
      if (tdspDuns) {
        const testResult = filterMapper.mapFiltersToApiParams(citySlug, testSegments, tdspDuns);
        if (testResult.isValid) {
          return this.buildUrl(citySlug, testSegments);
        }
      }
    }

    // Fallback to city page
    return `/electricity-plans/${citySlug}/`;
  }

  /**
   * Generate canonical URL for SEO
   */
  private generateCanonicalUrl(citySlug: string, filterSegments: string[], filterResult: FilterValidationResult): string {
    // Use the API params to generate the canonical filter order
    if (filterResult.isValid && filterResult.apiParams) {
      const canonicalSegments = this.generateCanonicalFilterOrder(filterResult.appliedFilters);
      return this.buildUrl(citySlug, canonicalSegments);
    }

    return this.buildUrl(citySlug, filterSegments);
  }

  /**
   * Generate canonical filter order for consistent URLs
   */
  private generateCanonicalFilterOrder(appliedFilters: AppliedFilter[]): string[] {
    // Define canonical order of filter types
    const typeOrder = ['term', 'rate_type', 'green_energy', 'plan_features', 'usage', 'provider'];
    
    // Sort applied filters by this canonical order
    const sortedFilters = appliedFilters.sort((a, b) => {
      const aIndex = typeOrder.indexOf(a.type);
      const bIndex = typeOrder.indexOf(b.type);
      return aIndex - bIndex;
    });

    return sortedFilters.map(filter => filter.urlSegment);
  }

  /**
   * Determine if a route should be indexed by search engines
   */
  private shouldIndexRoute(citySlug: string, filterSegments: string[]): boolean {
    // Don't index more than 2 filters deep
    if (filterSegments.length > 2) {
      return false;
    }

    // Get city tier from TDSP mapping
    const tdspDuns = getTdspFromCity(citySlug);
    if (!tdspDuns) return false;

    // For now, index all valid routes with <= 2 filters
    // This can be enhanced based on city tier and filter combinations
    return true;
  }

  /**
   * Build URL from city and filter segments
   */
  private buildUrl(citySlug: string, filterSegments: string[]): string {
    const baseUrl = `/electricity-plans/${citySlug}`;
    if (filterSegments.length === 0) {
      return `${baseUrl}/`;
    }
    return `${baseUrl}/${filterSegments.join('/')}/`;
  }

  /**
   * Get suggested filters for a given city and current filters
   */
  getSuggestedFilters(citySlug: string, currentFilters: string[], limit = 6): string[] {
    // Get applied filter types to exclude from suggestions
    const tdspDuns = getTdspFromCity(citySlug);
    if (!tdspDuns) return [];

    const filterResult = filterMapper.mapFiltersToApiParams(citySlug, currentFilters, tdspDuns);
    const appliedTypes = filterResult.appliedFilters.map(f => f.type);

    // Get available filters not already applied
    const availableFilters = filterMapper.getAvailableFilters(appliedTypes);
    
    // Convert to URL patterns and limit
    const suggestions: string[] = [];
    for (const filterDef of availableFilters) {
      if (suggestions.length >= limit) break;
      
      // Take the first pattern from each filter type
      if (filterDef.urlPatterns.length > 0) {
        suggestions.push(filterDef.urlPatterns[0]);
      }
    }

    return suggestions;
  }

  /**
   * Generate all valid URL combinations for a city (used for sitemap)
   */
  generateValidCombinations(citySlug: string, maxDepth = 2): string[] {
    const urls: string[] = [];
    const tdspDuns = getTdspFromCity(citySlug);
    
    if (!tdspDuns) return [];

    // Start with city page
    urls.push(`/electricity-plans/${citySlug}/`);

    // Get all available filters
    const availableFilters = filterMapper.getAvailableFilters();
    
    // Generate single filter combinations
    for (const filterDef of availableFilters) {
      for (const pattern of filterDef.urlPatterns.slice(0, 2)) { // Limit patterns per type
        const testResult = filterMapper.mapFiltersToApiParams(citySlug, [pattern], tdspDuns);
        if (testResult.isValid) {
          urls.push(`/electricity-plans/${citySlug}/${pattern}/`);
        }
      }
    }

    // Generate two-filter combinations for high-value cities (if maxDepth >= 2)
    if (maxDepth >= 2) {
      const highValueCombinations = [
        ['12-month', 'fixed-rate'],
        ['12-month', 'green-energy'],
        ['24-month', 'fixed-rate'],
        ['fixed-rate', 'green-energy'],
        ['prepaid', 'no-deposit']
      ];

      for (const combo of highValueCombinations) {
        const testResult = filterMapper.mapFiltersToApiParams(citySlug, combo, tdspDuns);
        if (testResult.isValid) {
          urls.push(`/electricity-plans/${citySlug}/${combo.join('/')}/`);
        }
      }
    }

    return urls;
  }

  /**
   * Validate a single filter segment
   */
  validateFilterSegment(segment: string): boolean {
    return filterMapper.validateFilterSegment(segment).isValid;
  }

  /**
   * Get human-readable description of a filter combination using messaging service
   */
  getFilterDescription(cityName: string, appliedFilters: AppliedFilter[]): string {
    const messageContext: MessageContext = {
      cityName,
      citySlug: cityName.toLowerCase().replace(/\s+/g, '-'),
      planCount: 0,
      lowestRate: 0,
      appliedFilters
    };

    const messaging = facetedMessaging.generateMessage(messageContext);
    return messaging.subheadline;
  }

  /**
   * Generate page title for SEO using messaging service
   */
  generatePageTitle(cityName: string, appliedFilters: AppliedFilter[]): string {
    const messageContext: MessageContext = {
      cityName,
      citySlug: cityName.toLowerCase().replace(/\s+/g, '-'),
      planCount: 0,
      lowestRate: 0,
      appliedFilters
    };

    const messaging = facetedMessaging.generateMessage(messageContext);
    
    if (appliedFilters.length === 0) {
      return `${messaging.headline} | ChooseMyPower`;
    }

    const filterLabels = appliedFilters.map(f => f.displayName).join(' + ');
    return `${filterLabels} Plans in ${cityName}, TX | Real Rates, No Tricks`;
  }

  /**
   * Get breadcrumb structure for navigation
   */
  getBreadcrumbs(citySlug: string, cityName: string, appliedFilters: AppliedFilter[]): Array<{ name: string; url: string }> {
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Texas Electricity', url: '/texas/' },
      { name: `${cityName} Plans`, url: `/electricity-plans/${citySlug}/` }
    ];

    // Add filter-specific breadcrumbs
    let currentPath = `/electricity-plans/${citySlug}`;
    for (const filter of appliedFilters) {
      currentPath += `/${filter.urlSegment}`;
      breadcrumbs.push({
        name: filter.displayName,
        url: `${currentPath}/`
      });
    }

    return breadcrumbs;
  }

  /**
   * Performance optimization methods for 881-city scale
   */
  private validateCityWithCache(citySlug: string): boolean {
    if (this.cityValidationCache.has(citySlug)) {
      return this.cityValidationCache.get(citySlug)!;
    }
    
    const isValid = validateCitySlug(citySlug);
    this.cityValidationCache.set(citySlug, isValid);
    
    // Prevent cache from growing too large
    if (this.cityValidationCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.cityValidationCache.keys().next().value;
      this.cityValidationCache.delete(oldestKey);
    }
    
    return isValid;
  }
  
  private getTdspWithCache(citySlug: string): string | null {
    if (this.tdspMappingCache.has(citySlug)) {
      return this.tdspMappingCache.get(citySlug)!;
    }
    
    const tdspDuns = getTdspFromCity(citySlug);
    this.tdspMappingCache.set(citySlug, tdspDuns);
    
    // Prevent cache from growing too large
    if (this.tdspMappingCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.tdspMappingCache.keys().next().value;
      this.tdspMappingCache.delete(oldestKey);
    }
    
    return tdspDuns;
  }
  
  private getFromRouteCache(cacheKey: string): FacetedRouteResult | null {
    const cached = this.routeCache.get(cacheKey);
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - (cached as any).cacheTimestamp > this.CACHE_TTL) {
      this.routeCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }
  
  private setRouteCache(cacheKey: string, result: FacetedRouteResult, ttl?: number): void {
    // Add cache timestamp
    (result as any).cacheTimestamp = Date.now();
    (result as any).cacheTTL = ttl || this.CACHE_TTL;
    
    this.routeCache.set(cacheKey, result);
    
    // Prevent cache from growing too large
    if (this.routeCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.routeCache.keys().next().value;
      this.routeCache.delete(oldestKey);
    }
  }
  
  /**
   * Clear all caches for memory management
   */
  clearCaches(): void {
    this.cityValidationCache.clear();
    this.tdspMappingCache.clear();
    this.routeCache.clear();
    console.log('🗑️  FacetedRouter caches cleared');
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      cityValidationCache: this.cityValidationCache.size,
      tdspMappingCache: this.tdspMappingCache.size,
      routeCache: this.routeCache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheTTL: this.CACHE_TTL
    };
  }
}

// Export singleton instance with performance enhancements
export const facetedRouter = new FacetedRouter();

// Export utility functions with enhanced error handling
export function validateFacetedUrl(path: string): Promise<FacetedRouteResult> {
  return facetedRouter.validateRoute(path, { requirePlans: false });
}

export function validateAndFetchPlans(path: string): Promise<FacetedRouteResult> {
  return facetedRouter.validateRoute(path, { requirePlans: true });
}

export function generateSitemapUrls(citySlug: string): string[] {
  return facetedRouter.generateValidCombinations(citySlug);
}

// Export cache management functions for 881-city optimization
export function clearRouterCaches(): void {
  facetedRouter.clearCaches();
}

export function getRouterCacheStats() {
  return facetedRouter.getCacheStats();
}