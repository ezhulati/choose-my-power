/**
 * URL State Manager for Faceted Navigation
 * Handles encoding/decoding filter state to/from URL segments
 * Provides browser history integration and canonical URL generation
 */

import type { FilterState } from '../../types/facets';

export interface UrlStateOptions {
  baseUrl?: string;
  preserveQuery?: boolean;
  historyMethod?: 'push' | 'replace';
}

export interface UrlParseResult {
  citySlug: string;
  filterState: FilterState;
  segments: string[];
  isValid: boolean;
  errors: string[];
}

export class UrlStateManager {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/electricity-plans') {
    this.baseUrl = baseUrl;
  }

  /**
   * Parse URL path into filter state
   */
  parseUrl(path: string): UrlParseResult {
    const result: UrlParseResult = {
      citySlug: '',
      filterState: {},
      segments: [],
      isValid: false,
      errors: []
    };

    try {
      // Extract path segments
      const cleanPath = path.replace(this.baseUrl, '').replace(/^\/|\/$/g, '');
      const segments = cleanPath ? cleanPath.split('/').filter(Boolean) : [];

      if (segments.length === 0) {
        result.errors.push('No city specified');
        return result;
      }

      // First segment should be city
      const citySlug = segments[0];
      const filterSegments = segments.slice(1);

      result.citySlug = citySlug;
      result.segments = filterSegments;

      // Parse filter segments into filter state
      result.filterState = this.parseFilterSegments(filterSegments);
      result.isValid = true;

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown parsing error');
      return result;
    }
  }

  /**
   * Convert filter state to URL path
   */
  buildUrl(citySlug: string, filterState: FilterState, options: UrlStateOptions = {}): string {
    const segments = this.buildFilterSegments(filterState);
    
    let url = `${options.baseUrl || this.baseUrl}/${citySlug}`;
    if (segments.length > 0) {
      url += `/${segments.join('/')}`;
    }
    
    // Ensure trailing slash for SEO consistency
    if (!url.endsWith('/')) {
      url += '/';
    }

    return url;
  }

  /**
   * Update browser URL without page reload
   */
  updateUrl(citySlug: string, filterState: FilterState, options: UrlStateOptions = {}): void {
    const url = this.buildUrl(citySlug, filterState, options);
    const method = options.historyMethod || 'replace';
    
    // Only update if URL has actually changed to prevent unnecessary operations
    if (window.location.pathname === url) {
      return;
    }
    
    if (method === 'push') {
      window.history.pushState({}, '', url);
    } else {
      window.history.replaceState({}, '', url);
    }

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('urlStateChange', {
      detail: { url, citySlug, filterState }
    }));
  }

  /**
   * Generate canonical URL for SEO
   */
  getCanonicalUrl(citySlug: string, filterState: FilterState): string {
    // Sort filters in canonical order for consistent URLs
    const canonicalState = this.canonicalizeFilterState(filterState);
    return this.buildUrl(citySlug, canonicalState);
  }

  /**
   * Add filter to current URL
   */
  addFilter(currentPath: string, filterType: keyof FilterState, value: any): string {
    const parsed = this.parseUrl(currentPath);
    if (!parsed.isValid) return currentPath;

    const newState = { ...parsed.filterState };
    
    switch (filterType) {
      case 'contractLength':
        newState.contractLength = [...(newState.contractLength || []), value];
        break;
      case 'providers':
        newState.providers = [...(newState.providers || []), value];
        break;
      case 'features':
        newState.features = [...(newState.features || []), value];
        break;
      default:
        (newState as any)[filterType] = value;
    }

    return this.buildUrl(parsed.citySlug, newState);
  }

  /**
   * Remove filter from current URL
   */
  removeFilter(currentPath: string, filterType: keyof FilterState, value?: any): string {
    const parsed = this.parseUrl(currentPath);
    if (!parsed.isValid) return currentPath;

    const newState = { ...parsed.filterState };

    switch (filterType) {
      case 'contractLength':
        newState.contractLength = (newState.contractLength || []).filter(v => v !== value);
        if (newState.contractLength.length === 0) {
          delete newState.contractLength;
        }
        break;
      case 'providers':
        newState.providers = (newState.providers || []).filter(v => v !== value);
        if (newState.providers.length === 0) {
          delete newState.providers;
        }
        break;
      case 'features':
        newState.features = (newState.features || []).filter(v => v !== value);
        if (newState.features.length === 0) {
          delete newState.features;
        }
        break;
      default:
        delete (newState as any)[filterType];
    }

    return this.buildUrl(parsed.citySlug, newState);
  }

  /**
   * Clear all filters
   */
  clearAllFilters(currentPath: string): string {
    const parsed = this.parseUrl(currentPath);
    if (!parsed.isValid) return currentPath;

    return this.buildUrl(parsed.citySlug, {});
  }

  /**
   * Parse filter segments into filter state
   */
  private parseFilterSegments(segments: string[]): FilterState {
    const filterState: FilterState = {};

    for (const segment of segments) {
      // Contract length (e.g., "12-month", "24-month")
      const contractMatch = segment.match(/^(\d+)-month$/);
      if (contractMatch) {
        const months = parseInt(contractMatch[1]);
        filterState.contractLength = [...(filterState.contractLength || []), months];
        continue;
      }

      // Rate type
      if (segment === 'fixed-rate') {
        filterState.rateType = 'fixed';
        continue;
      }
      if (segment === 'variable-rate') {
        filterState.rateType = 'variable';
        continue;
      }

      // Green energy
      if (segment === 'green-energy') {
        filterState.greenEnergy = true;
        continue;
      }

      // Plan features
      if (segment === 'prepaid') {
        filterState.prePaid = true;
        continue;
      }
      if (segment === 'no-deposit') {
        filterState.noDeposit = true;
        continue;
      }

      // Price ranges
      if (segment.match(/^\d+-\d+$/)) {
        filterState.priceRange = segment;
        continue;
      }

      // Providers (convert kebab-case back to provider names)
      if (this.isProviderSegment(segment)) {
        const provider = this.segmentToProvider(segment);
        filterState.providers = [...(filterState.providers || []), provider];
        continue;
      }

      // Features
      if (this.isFeatureSegment(segment)) {
        filterState.features = [...(filterState.features || []), segment];
        continue;
      }
    }

    return filterState;
  }

  /**
   * Convert filter state to URL segments
   */
  private buildFilterSegments(filterState: FilterState): string[] {
    const segments: string[] = [];

    // Contract lengths (sorted for consistency)
    if (filterState.contractLength?.length) {
      const sortedLengths = [...filterState.contractLength].sort((a, b) => a - b);
      segments.push(...sortedLengths.map(length => `${length}-month`));
    }

    // Rate type
    if (filterState.rateType === 'fixed') {
      segments.push('fixed-rate');
    } else if (filterState.rateType === 'variable') {
      segments.push('variable-rate');
    }

    // Green energy
    if (filterState.greenEnergy) {
      segments.push('green-energy');
    }

    // Prepaid
    if (filterState.prePaid) {
      segments.push('prepaid');
    }

    // No deposit
    if (filterState.noDeposit) {
      segments.push('no-deposit');
    }

    // Providers (sorted for consistency)
    if (filterState.providers?.length) {
      const providerSegments = filterState.providers
        .map(provider => this.providerToSegment(provider))
        .sort();
      segments.push(...providerSegments);
    }

    // Features (sorted for consistency)
    if (filterState.features?.length) {
      segments.push(...[...filterState.features].sort());
    }

    // Price range
    if (filterState.priceRange) {
      segments.push(filterState.priceRange.toString());
    }

    return segments;
  }

  /**
   * Canonicalize filter state for consistent URLs
   */
  private canonicalizeFilterState(filterState: FilterState): FilterState {
    const canonical: FilterState = {};

    // Sort arrays for consistency
    if (filterState.contractLength?.length) {
      canonical.contractLength = [...filterState.contractLength].sort((a, b) => a - b);
    }

    if (filterState.providers?.length) {
      canonical.providers = [...filterState.providers].sort();
    }

    if (filterState.features?.length) {
      canonical.features = [...filterState.features].sort();
    }

    // Copy other fields as-is
    if (filterState.rateType) canonical.rateType = filterState.rateType;
    if (filterState.greenEnergy) canonical.greenEnergy = filterState.greenEnergy;
    if (filterState.prePaid) canonical.prePaid = filterState.prePaid;
    if (filterState.noDeposit) canonical.noDeposit = filterState.noDeposit;
    if (filterState.priceRange) canonical.priceRange = filterState.priceRange;

    return canonical;
  }

  /**
   * Check if segment is a provider
   */
  private isProviderSegment(segment: string): boolean {
    const commonProviders = [
      'reliant', 'txu', 'direct-energy', 'nrg', 'constellation',
      'green-mountain', 'cirro', 'gexa', 'express', 'champion',
      'ambit', 'trieagle', 'pulse', 'discount-power', 'energy-texas'
    ];
    return commonProviders.includes(segment);
  }

  /**
   * Check if segment is a feature
   */
  private isFeatureSegment(segment: string): boolean {
    const commonFeatures = [
      'bill-credit', 'free-nights', 'auto-pay', 'satisfaction-guarantee',
      'time-of-use', 'budget-billing', 'renewable'
    ];
    return commonFeatures.includes(segment);
  }

  /**
   * Convert provider name to URL segment
   */
  private providerToSegment(provider: string): string {
    return provider
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert URL segment back to provider name
   */
  private segmentToProvider(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get filter state from current URL
   */
  getCurrentFilterState(): FilterState {
    const currentPath = window.location.pathname;
    const parsed = this.parseUrl(currentPath);
    return parsed.filterState;
  }

  /**
   * Get city slug from current URL
   */
  getCurrentCitySlug(): string {
    const currentPath = window.location.pathname;
    const parsed = this.parseUrl(currentPath);
    return parsed.citySlug;
  }

  /**
   * Generate breadcrumb structure from current state
   */
  getBreadcrumbs(citySlug: string, filterState: FilterState): Array<{ name: string; url: string; active: boolean }> {
    const breadcrumbs = [
      { name: 'Home', url: '/', active: false },
      { name: 'Texas Electricity', url: '/texas', active: false },
      { name: `${this.formatCityName(citySlug)} Plans`, url: this.buildUrl(citySlug, {}), active: !this.hasAnyFilters(filterState) }
    ];

    // Add filter breadcrumbs
    const segments = this.buildFilterSegments(filterState);
    let currentState: FilterState = {};
    
    for (const segment of segments) {
      const segmentState = this.parseFilterSegments([segment]);
      currentState = { ...currentState, ...segmentState };
      
      breadcrumbs.push({
        name: this.segmentToDisplayName(segment),
        url: this.buildUrl(citySlug, currentState),
        active: this.areFilterStatesEqual(currentState, filterState)
      });
    }

    return breadcrumbs;
  }

  /**
   * Format city name for display
   */
  private formatCityName(citySlug: string): string {
    return citySlug
      .replace('-tx', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert segment to display name
   */
  private segmentToDisplayName(segment: string): string {
    const displayNames: Record<string, string> = {
      'fixed-rate': 'Fixed Rate',
      'variable-rate': 'Variable Rate',
      'green-energy': 'Green Energy',
      'prepaid': 'Prepaid',
      'no-deposit': 'No Deposit',
      'bill-credit': 'Bill Credit',
      'free-nights': 'Free Nights'
    };

    if (displayNames[segment]) {
      return displayNames[segment];
    }

    // Contract length
    const contractMatch = segment.match(/^(\d+)-month$/);
    if (contractMatch) {
      return `${contractMatch[1]} Month`;
    }

    // Default formatting
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Check if filter state has any active filters
   */
  private hasAnyFilters(filterState: FilterState): boolean {
    return Object.keys(filterState).length > 0;
  }

  /**
   * Compare two filter states for equality
   */
  private areFilterStatesEqual(state1: FilterState, state2: FilterState): boolean {
    return JSON.stringify(this.canonicalizeFilterState(state1)) === 
           JSON.stringify(this.canonicalizeFilterState(state2));
  }
}

// Export singleton instance
export const urlStateManager = new UrlStateManager();

// Export utility functions
export function addFilterToUrl(currentPath: string, filterType: keyof FilterState, value: any): string {
  return urlStateManager.addFilter(currentPath, filterType, value);
}

export function removeFilterFromUrl(currentPath: string, filterType: keyof FilterState, value?: any): string {
  return urlStateManager.removeFilter(currentPath, filterType, value);
}

export function updateBrowserUrl(citySlug: string, filterState: FilterState, options?: UrlStateOptions): void {
  urlStateManager.updateUrl(citySlug, filterState, options);
}

export function parseCurrentUrl(): UrlParseResult {
  return urlStateManager.parseUrl(window.location.pathname);
}