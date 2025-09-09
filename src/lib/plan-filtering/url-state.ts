// T021: Filter URL state management
// SEO-friendly URL parameter handling with React state sync (FR-003)

import type { PlanFilter } from '../types/plan-filter';

export class URLStateManager {
  private readonly paramMapping = {
    city: 'city',
    state: 'state',
    contractLengths: 'contract',
    rateTypes: 'type',
    minRate: 'min',
    maxRate: 'max',
    maxMonthlyFee: 'fee',
    minGreenEnergy: 'green',
    selectedProviders: 'providers',
    minProviderRating: 'rating',
    requiredFeatures: 'features',
    includePromotions: 'promo',
    excludeEarlyTerminationFee: 'no-etf',
    sortBy: 'sort',
    sortOrder: 'order',
    planTypes: 'plan-type',
    tdspTerritories: 'tdsp'
  };

  /**
   * Serialize filters to URL-safe string with optimization
   */
  serializeFiltersToURL(filters: PlanFilter): string {
    const params = new URLSearchParams();

    // Essential location parameters (always include)
    params.set('city', filters.city);
    if (filters.state !== 'texas') {
      params.set('state', filters.state);
    }

    // Contract lengths - compact representation
    if (filters.contractLengths.length > 0) {
      params.set('contract', filters.contractLengths.sort((a, b) => a - b).join(','));
    }

    // Rate types - abbreviated format
    if (filters.rateTypes.length > 0) {
      const shortTypes = filters.rateTypes.map(type => {
        switch (type) {
          case 'fixed': return 'f';
          case 'variable': return 'v';
          case 'indexed': return 'i';
          default: return type;
        }
      });
      params.set('type', shortTypes.join(','));
    }

    // Price range with decimal precision
    if (filters.minRate !== undefined) {
      params.set('min', filters.minRate.toFixed(1));
    }
    if (filters.maxRate !== undefined) {
      params.set('max', filters.maxRate.toFixed(1));
    }

    // Monthly fee limit
    if (filters.maxMonthlyFee !== undefined) {
      params.set('fee', filters.maxMonthlyFee.toString());
    }

    // Green energy minimum
    if (filters.minGreenEnergy !== undefined) {
      params.set('green', filters.minGreenEnergy.toString());
    }

    // Provider selection - URL-safe slugs
    if (filters.selectedProviders.length > 0) {
      const providerSlugs = filters.selectedProviders.map(provider => 
        provider.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      );
      params.set('providers', providerSlugs.join(','));
    }

    // Provider rating minimum
    if (filters.minProviderRating !== undefined) {
      params.set('rating', filters.minProviderRating.toString());
    }

    // Required features - abbreviated
    if (filters.requiredFeatures.length > 0) {
      const featureCodes = filters.requiredFeatures.map(feature => {
        switch (feature.toLowerCase()) {
          case 'no deposit': return 'nd';
          case 'autopay discount': return 'ap';
          case 'renewable energy': return 're';
          case 'fixed rate': return 'fr';
          case 'no contract': return 'nc';
          case 'free nights': return 'fn';
          case 'free weekends': return 'fw';
          default: return feature.replace(/\s+/g, '-').toLowerCase();
        }
      });
      params.set('features', featureCodes.join(','));
    }

    // Boolean flags - only include if true
    if (filters.includePromotions) {
      params.set('promo', '1');
    }
    if (filters.excludeEarlyTerminationFee) {
      params.set('no-etf', '1');
    }

    // Sorting parameters
    if (filters.sortBy !== 'price') {
      params.set('sort', filters.sortBy);
    }
    if (filters.sortOrder !== 'asc') {
      params.set('order', filters.sortOrder);
    }

    // Plan types
    if (filters.planTypes.length > 0) {
      params.set('plan-type', filters.planTypes.join(','));
    }

    // TDSP territories
    if (filters.tdspTerritories.length > 0) {
      params.set('tdsp', filters.tdspTerritories.join(','));
    }

    return params.toString();
  }

  /**
   * Parse URL parameters back to PlanFilter object
   */
  parseFiltersFromURL(urlParams: URLSearchParams, defaultCity: string = 'houston'): PlanFilter {
    const filters: PlanFilter = {
      // Default values
      city: urlParams.get('city') || defaultCity,
      state: urlParams.get('state') || 'texas',
      contractLengths: [],
      rateTypes: [],
      minRate: undefined,
      maxRate: undefined,
      maxMonthlyFee: undefined,
      minGreenEnergy: undefined,
      selectedProviders: [],
      minProviderRating: undefined,
      requiredFeatures: [],
      includePromotions: false,
      excludeEarlyTerminationFee: false,
      sortBy: 'price',
      sortOrder: 'asc',
      planTypes: [],
      tdspTerritories: []
    };

    // Parse contract lengths
    const contractParam = urlParams.get('contract');
    if (contractParam) {
      filters.contractLengths = contractParam.split(',')
        .map(length => parseInt(length, 10))
        .filter(length => !isNaN(length) && length > 0);
    }

    // Parse rate types with expansion
    const typeParam = urlParams.get('type');
    if (typeParam) {
      filters.rateTypes = typeParam.split(',').map(type => {
        switch (type) {
          case 'f': return 'fixed';
          case 'v': return 'variable';
          case 'i': return 'indexed';
          default: return type;
        }
      }).filter(type => ['fixed', 'variable', 'indexed'].includes(type));
    }

    // Parse price range
    const minRateParam = urlParams.get('min');
    if (minRateParam) {
      const minRate = parseFloat(minRateParam);
      if (!isNaN(minRate) && minRate >= 0) {
        filters.minRate = minRate;
      }
    }

    const maxRateParam = urlParams.get('max');
    if (maxRateParam) {
      const maxRate = parseFloat(maxRateParam);
      if (!isNaN(maxRate) && maxRate > 0) {
        filters.maxRate = maxRate;
      }
    }

    // Parse monthly fee limit
    const feeParam = urlParams.get('fee');
    if (feeParam) {
      const maxFee = parseFloat(feeParam);
      if (!isNaN(maxFee) && maxFee >= 0) {
        filters.maxMonthlyFee = maxFee;
      }
    }

    // Parse green energy minimum
    const greenParam = urlParams.get('green');
    if (greenParam) {
      const minGreen = parseInt(greenParam, 10);
      if (!isNaN(minGreen) && minGreen >= 0 && minGreen <= 100) {
        filters.minGreenEnergy = minGreen;
      }
    }

    // Parse provider selection
    const providersParam = urlParams.get('providers');
    if (providersParam) {
      filters.selectedProviders = providersParam.split(',')
        .map(slug => this.expandProviderSlug(slug))
        .filter(provider => provider.length > 0);
    }

    // Parse provider rating
    const ratingParam = urlParams.get('rating');
    if (ratingParam) {
      const minRating = parseFloat(ratingParam);
      if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
        filters.minProviderRating = minRating;
      }
    }

    // Parse required features
    const featuresParam = urlParams.get('features');
    if (featuresParam) {
      filters.requiredFeatures = featuresParam.split(',')
        .map(code => this.expandFeatureCode(code))
        .filter(feature => feature.length > 0);
    }

    // Parse boolean flags
    filters.includePromotions = urlParams.get('promo') === '1';
    filters.excludeEarlyTerminationFee = urlParams.get('no-etf') === '1';

    // Parse sorting
    const sortParam = urlParams.get('sort');
    if (sortParam && ['price', 'rating', 'contract', 'provider', 'green'].includes(sortParam)) {
      filters.sortBy = sortParam;
    }

    const orderParam = urlParams.get('order');
    if (orderParam && ['asc', 'desc'].includes(orderParam)) {
      filters.sortOrder = orderParam as 'asc' | 'desc';
    }

    // Parse plan types
    const planTypeParam = urlParams.get('plan-type');
    if (planTypeParam) {
      filters.planTypes = planTypeParam.split(',')
        .filter(type => type.length > 0);
    }

    // Parse TDSP territories
    const tdspParam = urlParams.get('tdsp');
    if (tdspParam) {
      filters.tdspTerritories = tdspParam.split(',')
        .filter(tdsp => tdsp.length > 0);
    }

    return filters;
  }

  /**
   * Generate SEO-friendly path from filters
   */
  generateSEOPath(filters: PlanFilter): string {
    let path = `/electricity-plans/${filters.city}-${filters.state === 'texas' ? 'tx' : filters.state}/`;

    // Add contract length to path for common filters
    if (filters.contractLengths.length === 1) {
      path += `${filters.contractLengths[0]}-month/`;
    }

    // Add rate type for specificity
    if (filters.rateTypes.length === 1) {
      path += `${filters.rateTypes[0]}-rate/`;
    }

    // Add green energy for renewable plans
    if (filters.minGreenEnergy && filters.minGreenEnergy >= 50) {
      path += 'green-energy/';
    }

    return path;
  }

  /**
   * Create shareable URL with filters
   */
  createShareableURL(filters: PlanFilter, baseURL: string = ''): string {
    const path = this.generateSEOPath(filters);
    const queryString = this.serializeFiltersToURL(filters);
    
    return queryString.length > 0 
      ? `${baseURL}${path}?${queryString}`
      : `${baseURL}${path}`;
  }

  /**
   * Detect filter changes for analytics
   */
  detectFilterChanges(oldFilters: PlanFilter, newFilters: PlanFilter): {
    changedFilters: string[];
    addedFilters: string[];
    removedFilters: string[];
  } {
    const changedFilters: string[] = [];
    const addedFilters: string[] = [];
    const removedFilters: string[] = [];

    // Compare each filter property
    Object.keys(this.paramMapping).forEach(key => {
      const oldValue = oldFilters[key as keyof PlanFilter];
      const newValue = newFilters[key as keyof PlanFilter];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFilters.push(key);

        // Determine if filter was added or removed
        if (!oldValue || (Array.isArray(oldValue) && oldValue.length === 0)) {
          addedFilters.push(key);
        } else if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
          removedFilters.push(key);
        }
      }
    });

    return { changedFilters, addedFilters, removedFilters };
  }

  /**
   * Validate filter combinations for UX warnings
   */
  validateFilterCombination(filters: PlanFilter): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Price range validation
    if (filters.minRate && filters.maxRate && filters.minRate >= filters.maxRate) {
      warnings.push('Minimum rate cannot be higher than maximum rate');
      suggestions.push('Adjust your price range settings');
    }

    // Extremely restrictive filtering
    if (filters.contractLengths.length === 1 && 
        filters.rateTypes.length === 1 && 
        filters.selectedProviders.length === 1 &&
        filters.requiredFeatures.length > 2) {
      warnings.push('Your filters may be too restrictive');
      suggestions.push('Consider removing some filters to see more options');
    }

    // Green energy with low-cost conflict
    if (filters.minGreenEnergy && filters.minGreenEnergy >= 75 && 
        filters.maxRate && filters.maxRate < 10) {
      warnings.push('High green energy percentage may not be available at very low rates');
      suggestions.push('Consider increasing your maximum rate for more green energy options');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  /**
   * Expand provider slug back to full name
   */
  private expandProviderSlug(slug: string): string {
    const providerMap: { [key: string]: string } = {
      'txu': 'TXU Energy',
      'reliant': 'Reliant Energy',
      'direct': 'Direct Energy',
      'green-mountain': 'Green Mountain Energy',
      '4change': '4Change Energy',
      'ambit': 'Ambit Energy',
      'champion': 'Champion Energy',
      'cirro': 'Cirro Energy',
      'express': 'Express Energy',
      'frontier': 'Frontier Utilities'
    };

    return providerMap[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Expand feature code back to full feature name
   */
  private expandFeatureCode(code: string): string {
    const featureMap: { [key: string]: string } = {
      'nd': 'No deposit',
      'ap': 'AutoPay discount', 
      're': 'Renewable energy',
      'fr': 'Fixed rate',
      'nc': 'No contract',
      'fn': 'Free nights',
      'fw': 'Free weekends'
    };

    return featureMap[code] || code.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get URL fragment for browser history
   */
  getHistoryState(filters: PlanFilter): { 
    filters: PlanFilter; 
    timestamp: number; 
    path: string;
  } {
    return {
      filters: { ...filters },
      timestamp: Date.now(),
      path: this.generateSEOPath(filters)
    };
  }

  /**
   * Performance optimization: minimal URL for common scenarios
   */
  createMinimalURL(filters: PlanFilter): string {
    // If only city/state filters are active, use clean path
    const hasOnlyLocationFilters = 
      filters.contractLengths.length === 0 &&
      filters.rateTypes.length === 0 &&
      !filters.minRate &&
      !filters.maxRate &&
      !filters.maxMonthlyFee &&
      !filters.minGreenEnergy &&
      filters.selectedProviders.length === 0 &&
      !filters.minProviderRating &&
      filters.requiredFeatures.length === 0 &&
      !filters.includePromotions &&
      !filters.excludeEarlyTerminationFee &&
      filters.sortBy === 'price' &&
      filters.sortOrder === 'asc';

    if (hasOnlyLocationFilters) {
      return `/electricity-plans/${filters.city}-tx/`;
    }

    return this.createShareableURL(filters);
  }
}

// Export singleton instance for consistent usage
export const urlStateManager = new URLStateManager();

// React hook for URL state integration
export interface UseURLStateResult {
  filters: PlanFilter;
  updateFilters: (newFilters: PlanFilter, pushState?: boolean) => void;
  resetFilters: () => void;
  shareableURL: string;
  isLoading: boolean;
}

/**
 * React hook factory for URL state management
 * Usage in components: const { filters, updateFilters } = useURLState(defaultCity);
 */
export const createURLStateHook = () => {
  return (defaultCity: string = 'houston'): UseURLStateResult => {
    // This will be implemented when React components are created
    // Placeholder structure for type safety
    return {
      filters: urlStateManager.parseFiltersFromURL(new URLSearchParams(), defaultCity),
      updateFilters: () => {},
      resetFilters: () => {},
      shareableURL: '',
      isLoading: false
    };
  };
};