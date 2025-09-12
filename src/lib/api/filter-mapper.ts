/**
 * Filter Parameter Mapping System
 * Handles URL filter segments to API parameter conversion with validation
 * Supports complex multi-filter scenarios and error handling
 */

import type { ApiParams } from '../../types/facets';
import { ComparePowerApiError, ApiErrorType } from './errors';

export interface FilterValidationResult {
  isValid: boolean;
  apiParams: ApiParams;
  warnings: string[];
  errors: string[];
  appliedFilters: AppliedFilter[];
}

export type FilterValue = string | number | boolean | { param: string; value: boolean };

export interface AppliedFilter {
  type: FilterType;
  urlSegment: string;
  apiParam: string;
  value: FilterValue;
  displayName: string;
}

export type FilterType = 'term' | 'rate_type' | 'green_energy' | 'plan_features' | 'provider' | 'usage';

export interface FilterDefinition {
  type: FilterType;
  urlPatterns: string[];
  apiParam: string;
  valueTransform: (segment: string) => FilterValue;
  displayName: (segment: string) => string;
  isValid: (value: FilterValue) => boolean;
  conflictsWith?: FilterType[];
  description: string;
}

/**
 * Comprehensive filter definitions with validation rules
 */
export const filterDefinitions: FilterDefinition[] = [
  // Contract Term Filters
  {
    type: 'term',
    urlPatterns: ['6-month', '12-month', '24-month', '36-month', 'month-to-month'],
    apiParam: 'term',
    valueTransform: (segment: string) => {
      const match = segment.match(/(\d+)-month/);
      if (match) return parseInt(match[1]);
      if (segment === 'month-to-month') return 1;
      return null;
    },
    displayName: (segment: string) => {
      if (segment === 'month-to-month') return 'Month-to-Month';
      const match = segment.match(/(\d+)-month/);
      if (match) {
        const months = match[1];
        return `${months}-Month`;
      }
      return segment;
    },
    isValid: (value: number) => [1, 6, 12, 18, 24, 36].includes(value),
    description: 'Contract length in months'
  },

  // Rate Type Filters
  {
    type: 'rate_type',
    urlPatterns: ['fixed-rate', 'variable-rate', 'indexed-rate'],
    apiParam: 'rate_type',
    valueTransform: (segment: string) => {
      switch (segment) {
        case 'fixed-rate': return 'fixed';
        case 'variable-rate': return 'variable';
        case 'indexed-rate': return 'indexed';
        default: return null;
      }
    },
    displayName: (segment: string) => {
      switch (segment) {
        case 'fixed-rate': return 'Fixed Rate';
        case 'variable-rate': return 'Variable Rate';
        case 'indexed-rate': return 'Market Rate';
        default: return segment;
      }
    },
    isValid: (value: string) => ['fixed', 'variable', 'indexed'].includes(value),
    conflictsWith: ['rate_type'],
    description: 'Electricity rate structure type'
  },

  // Green Energy Filters
  {
    type: 'green_energy',
    urlPatterns: ['100-green', '50-green', '25-green', 'green-energy', 'renewable'],
    apiParam: 'percent_green',
    valueTransform: (segment: string) => {
      if (segment === 'green-energy' || segment === 'renewable') return 100;
      const match = segment.match(/(\d+)-green/);
      return match ? parseInt(match[1]) : null;
    },
    displayName: (segment: string) => {
      if (segment === 'green-energy' || segment === 'renewable') return '100% Clean Energy';
      const match = segment.match(/(\d+)-green/);
      return match ? `${match[1]}% Clean Energy` : segment;
    },
    isValid: (value: number) => value >= 0 && value <= 100,
    conflictsWith: ['green_energy'],
    description: 'Percentage of renewable energy'
  },

  // Plan Features
  {
    type: 'plan_features',
    urlPatterns: [
      'no-deposit', 'prepaid', 'autopay-discount', 'time-of-use', 
      'free-weekends', 'bill-credit', 'no-contract', 'smart-meter'
    ],
    apiParam: 'feature',
    valueTransform: (segment: string) => {
      const featureMap: Record<string, { param: string; value: unknown}> = {
        'no-deposit': { param: 'deposit_required', value: false },
        'prepaid': { param: 'is_pre_pay', value: true },
        'autopay-discount': { param: 'requires_auto_pay', value: true },
        'time-of-use': { param: 'is_time_of_use', value: true },
        'free-weekends': { param: 'free_weekends', value: true },
        'bill-credit': { param: 'bill_credit', value: true },
        'no-contract': { param: 'term', value: 1 },
        'smart-meter': { param: 'smart_meter', value: true }
      };
      return featureMap[segment] || null;
    },
    displayName: (segment: string) => {
      const displayMap: Record<string, string> = {
        'no-deposit': 'No Deposit Required',
        'prepaid': 'Prepaid',
        'autopay-discount': 'AutoPay Discount',
        'time-of-use': 'Time-of-Use',
        'free-weekends': 'Free Weekends',
        'bill-credit': 'Bill Credit',
        'no-contract': 'No Contract',
        'smart-meter': 'Smart Meter Required'
      };
      return displayMap[segment] || segment;
    },
    isValid: (value: unknown) => value !== null,
    description: 'Special plan features and requirements'
  },

  // Provider Filters - Deduplicated and Expanded
  {
    type: 'provider',
    urlPatterns: [
      'txu-energy', 'reliant', 'green-mountain-energy', 'gexa-energy', 
      'direct-energy', 'discount-power', 'champion-energy', 'cirro-energy',
      'frontier-utilities', '4change-energy', 'ambit-energy', 'amigo-energy',
      'bounce-energy', 'chariot-energy', 'express-energy', 'infuse-energy',
      'just-energy', 'pulse-power', 'rhythm-energy', 'veteran-energy'
    ],
    apiParam: 'brand_id',
    valueTransform: (segment: string) => {
      // Unified mapping with no duplicates - prefer canonical brand names
      const providerMap: Record<string, string> = {
        'txu-energy': 'txu_energy',
        'reliant': 'reliant',
        'green-mountain-energy': 'green_mountain',
        'gexa-energy': 'gexa_energy',
        'direct-energy': 'direct_energy',
        'discount-power': 'discount_power',
        'champion-energy': 'champion_energy',
        'cirro-energy': 'cirro_energy',
        'frontier-utilities': 'frontier_utilities',
        '4change-energy': '4change_energy',
        'ambit-energy': 'ambit_energy',
        'amigo-energy': 'amigo_energy',
        'bounce-energy': 'bounce_energy',
        'chariot-energy': 'chariot_energy',
        'express-energy': 'express_energy',
        'infuse-energy': 'infuse_energy',
        'just-energy': 'just_energy',
        'pulse-power': 'pulse_power',
        'rhythm-energy': 'rhythm_energy',
        'veteran-energy': 'veteran_energy'
      };
      return providerMap[segment] || segment.replace('-', '_');
    },
    displayName: (segment: string) => {
      // Canonical display names - no duplicates
      const providerNames: Record<string, string> = {
        'txu-energy': 'TXU Energy',
        'reliant': 'Reliant',
        'green-mountain-energy': 'Green Mountain Energy',
        'gexa-energy': 'Gexa Energy',
        'direct-energy': 'Direct Energy',
        'discount-power': 'Discount Power',
        'champion-energy': 'Champion Energy',
        'cirro-energy': 'Cirro Energy',
        'frontier-utilities': 'Frontier Utilities',
        '4change-energy': '4Change Energy',
        'ambit-energy': 'Ambit Energy',
        'amigo-energy': 'Amigo Energy',
        'bounce-energy': 'Bounce Energy',
        'chariot-energy': 'Chariot Energy',
        'express-energy': 'Express Energy',
        'infuse-energy': 'Infuse Energy',
        'just-energy': 'Just Energy',
        'pulse-power': 'Pulse Power',
        'rhythm-energy': 'Rhythm Energy',
        'veteran-energy': 'Veteran Energy'
      };
      return providerNames[segment] || segment.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    isValid: (value: string) => typeof value === 'string' && value.length > 0,
    description: 'Filter by electricity provider'
  },

  // Usage Level Filters
  {
    type: 'usage',
    urlPatterns: ['500-kwh', '1000-kwh', '2000-kwh', 'low-usage', 'high-usage'],
    apiParam: 'display_usage',
    valueTransform: (segment: string) => {
      if (segment === 'low-usage') return 500;
      if (segment === 'high-usage') return 2000;
      const match = segment.match(/(\d+)-kwh/);
      return match ? parseInt(match[1]) : null;
    },
    displayName: (segment: string) => {
      if (segment === 'low-usage') return 'Low Usage (500 kWh)';
      if (segment === 'high-usage') return 'High Usage (2000 kWh)';
      const match = segment.match(/(\d+)-kwh/);
      return match ? `${match[1]} kWh Usage` : segment;
    },
    isValid: (value: number) => [500, 1000, 2000].includes(value),
    conflictsWith: ['usage'],
    description: 'Monthly electricity usage level'
  }
];

export class FilterMapper {
  private definitions = new Map<string, FilterDefinition>();
  public readonly filterDefinitions = filterDefinitions; // Make definitions accessible

  constructor() {
    this.initializeDefinitions();
  }

  private initializeDefinitions(): void {
    for (const def of filterDefinitions) {
      for (const pattern of def.urlPatterns) {
        this.definitions.set(pattern, def);
      }
    }
  }

  /**
   * Convert URL filter segments to API parameters with comprehensive validation
   */
  mapFiltersToApiParams(
    citySlug: string,
    filterSegments: string[],
    baseTdspDuns: string
  ): FilterValidationResult {
    const result: FilterValidationResult = {
      isValid: true,
      apiParams: {
        tdsp_duns: baseTdspDuns,
        display_usage: 1000 // Default usage level
      },
      warnings: [],
      errors: [],
      appliedFilters: []
    };

    // Track applied filter types to detect conflicts
    const appliedTypes = new Set<FilterType>();

    // Process each filter segment
    for (const segment of filterSegments) {
      try {
        const processResult = this.processFilterSegment(segment, appliedTypes);
        
        if (processResult.error) {
          result.errors.push(processResult.error);
          result.isValid = false;
          continue;
        }

        if (processResult.warning) {
          result.warnings.push(processResult.warning);
        }

        if (processResult.appliedFilter && processResult.apiParam) {
          // Apply the filter to API parameters
          this.applyFilterToParams(result.apiParams, processResult.apiParam);
          result.appliedFilters.push(processResult.appliedFilter);
          appliedTypes.add(processResult.appliedFilter.type);
        }

      } catch (error) {
        result.errors.push(`Failed to process filter '${segment}': ${error}`);
        result.isValid = false;
      }
    }

    // Validate parameter combinations
    this.validateParameterCombinations(result);

    // Add meta information
    this.addMetaInformation(result, citySlug);

    return result;
  }

  /**
   * Process a single filter segment
   */
  private processFilterSegment(
    segment: string,
    appliedTypes: Set<FilterType>
  ): {
    appliedFilter?: AppliedFilter;
    apiParam?: { param: string; value: unknown};
    error?: string;
    warning?: string;
  } {
    const definition = this.definitions.get(segment);
    
    if (!definition) {
      return { error: `Unknown filter: '${segment}'` };
    }

    // Check for conflicts
    if (definition.conflictsWith) {
      for (const conflictType of definition.conflictsWith) {
        if (appliedTypes.has(conflictType)) {
          return { 
            warning: `Filter '${segment}' conflicts with previously applied ${conflictType} filter` 
          };
        }
      }
    }

    // Check if this type is already applied
    if (appliedTypes.has(definition.type)) {
      return { 
        warning: `Multiple ${definition.type} filters detected, '${segment}' may override previous filters` 
      };
    }

    // Transform the value
    const transformedValue = definition.valueTransform(segment);
    
    if (transformedValue === null || transformedValue === undefined) {
      return { error: `Invalid value for filter: '${segment}'` };
    }

    // Validate the transformed value
    if (!definition.isValid(transformedValue)) {
      return { error: `Invalid ${definition.type} value: '${transformedValue}'` };
    }

    const appliedFilter: AppliedFilter = {
      type: definition.type,
      urlSegment: segment,
      apiParam: definition.apiParam,
      value: transformedValue,
      displayName: definition.displayName(segment)
    };

    // Handle special case for plan features (multiple parameters)
    if (definition.type === 'plan_features' && typeof transformedValue === 'object') {
      const featureParam = transformedValue as { param: string; value: unknown};
      return {
        appliedFilter,
        apiParam: { param: featureParam.param, value: featureParam.value }
      };
    }

    return {
      appliedFilter,
      apiParam: { param: definition.apiParam, value: transformedValue }
    };
  }

  /**
   * Apply filter parameter to API params object
   */
  private applyFilterToParams(
    apiParams: ApiParams,
    paramInfo: { param: string; value: unknown}
  ): void {
    switch (paramInfo.param) {
      case 'term':
        apiParams.term = paramInfo.value;
        break;
      case 'percent_green':
        apiParams.percent_green = paramInfo.value;
        break;
      case 'is_pre_pay':
        apiParams.is_pre_pay = paramInfo.value;
        break;
      case 'is_time_of_use':
        apiParams.is_time_of_use = paramInfo.value;
        break;
      case 'requires_auto_pay':
        apiParams.requires_auto_pay = paramInfo.value;
        break;
      case 'brand_id':
        apiParams.brand_id = paramInfo.value;
        break;
      case 'display_usage':
        apiParams.display_usage = paramInfo.value;
        break;
      default:
        // Handle any additional parameters
        (apiParams as unknown)[paramInfo.param] = paramInfo.value;
    }
  }

  /**
   * Validate parameter combinations for logical consistency
   */
  private validateParameterCombinations(result: FilterValidationResult): void {
    const params = result.apiParams;

    // Check for logical conflicts
    if (params.is_pre_pay && params.term && params.term > 12) {
      result.warnings.push('Prepaid plans typically have shorter contract terms');
    }

    if (params.percent_green === 100 && params.is_pre_pay) {
      result.warnings.push('100% green energy with prepaid plans may have limited availability');
    }

    if (params.term === 1 && params.requires_auto_pay) {
      result.warnings.push('Month-to-month plans rarely require autopay');
    }

    // Validate usage level makes sense
    if (params.display_usage && ![500, 1000, 2000].includes(params.display_usage)) {
      result.errors.push(`Invalid usage level: ${params.display_usage}`);
      result.isValid = false;
    }
  }

  /**
   * Add helpful meta information
   */
  private addMetaInformation(result: FilterValidationResult, citySlug: string): void {
    // Add city-specific validation if needed
    if (citySlug.includes('houston') && result.apiParams.percent_green === 100) {
      result.warnings.push('Houston area has excellent green energy options');
    }

    // Add filter count warning
    if (result.appliedFilters.length > 3) {
      result.warnings.push('Many filters applied - this may significantly limit available plans');
    }

    // Add no-filters note
    if (result.appliedFilters.length === 0) {
      result.warnings.push('No filters applied - showing all available plans');
    }
  }

  /**
   * Generate URL segments from API parameters (reverse mapping)
   */
  generateUrlFromParams(apiParams: ApiParams): string[] {
    const segments: string[] = [];

    // Term mapping
    if (apiParams.term) {
      if (apiParams.term === 1) {
        segments.push('month-to-month');
      } else {
        segments.push(`${apiParams.term}-month`);
      }
    }

    // Green energy mapping
    if (apiParams.percent_green !== undefined) {
      if (apiParams.percent_green === 100) {
        segments.push('green-energy');
      } else if (apiParams.percent_green > 0) {
        segments.push(`${apiParams.percent_green}-green`);
      }
    }

    // Plan features
    if (apiParams.is_pre_pay) segments.push('prepaid');
    if (apiParams.is_time_of_use) segments.push('time-of-use');
    if (apiParams.requires_auto_pay) segments.push('autopay-discount');

    // Usage level
    if (apiParams.display_usage && apiParams.display_usage !== 1000) {
      if (apiParams.display_usage === 500) {
        segments.push('low-usage');
      } else if (apiParams.display_usage === 2000) {
        segments.push('high-usage');
      } else {
        segments.push(`${apiParams.display_usage}-kwh`);
      }
    }

    return segments;
  }

  /**
   * Get available filters for a given context
   */
  getAvailableFilters(excludeTypes: FilterType[] = []): FilterDefinition[] {
    const seen = new Set<FilterType>();
    const available: FilterDefinition[] = [];

    for (const def of filterDefinitions) {
      if (!seen.has(def.type) && !excludeTypes.includes(def.type)) {
        available.push(def);
        seen.add(def.type);
      }
    }

    return available;
  }

  /**
   * Validate a single filter segment
   */
  validateFilterSegment(segment: string): {
    isValid: boolean;
    definition?: FilterDefinition;
    error?: string;
  } {
    const definition = this.definitions.get(segment);
    
    if (!definition) {
      return {
        isValid: false,
        error: `Unknown filter segment: '${segment}'`
      };
    }

    const transformedValue = definition.valueTransform(segment);
    
    if (transformedValue === null || !definition.isValid(transformedValue)) {
      return {
        isValid: false,
        definition,
        error: `Invalid value for ${definition.type} filter: '${segment}'`
      };
    }

    return {
      isValid: true,
      definition
    };
  }

  /**
   * Get filter definition by pattern with dynamic provider support
   */
  getDefinitionByPattern(pattern: string): FilterDefinition | undefined {
    // First check if it's a static definition
    const staticDef = this.definitions.get(pattern);
    if (staticDef) return staticDef;
    
    // If not found but looks like a provider slug, create a dynamic definition
    if (this.isProviderSlug(pattern)) {
      return this.createDynamicProviderDefinition(pattern);
    }
    
    return undefined;
  }

  /**
   * Check if a pattern looks like a provider slug
   */
  private isProviderSlug(pattern: string): boolean {
    // Basic heuristics for provider slug detection
    // - Contains letters and hyphens
    // - Not in other filter categories
    const isValidSlug = /^[a-z0-9-]+$/.test(pattern) && pattern.length > 2;
    const isNotOtherFilterType = !pattern.match(/^(\d+)-(month|kwh|green)$/) && 
                                !['fixed-rate', 'variable-rate', 'indexed-rate', 'prepaid', 'no-deposit', 'autopay-discount'].includes(pattern);
    
    return isValidSlug && isNotOtherFilterType;
  }

  /**
   * Create a dynamic provider definition for unknown providers
   */
  private createDynamicProviderDefinition(pattern: string): FilterDefinition {
    return {
      type: 'provider',
      urlPatterns: [pattern],
      apiParam: 'brand_id',
      valueTransform: (segment: string) => segment.replace('-', '_'),
      displayName: (segment: string) => {
        // Convert slug to display name (e.g., "txu-energy" -> "TXU Energy")
        return segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      },
      isValid: (value: string) => typeof value === 'string' && value.length > 0,
      description: 'Filter by electricity provider'
    };
  }

  /**
   * Get filter suggestions for partial matches
   */
  getFilterSuggestions(partial: string, limit = 5): string[] {
    const suggestions: string[] = [];
    const lowerPartial = partial.toLowerCase();

    for (const [pattern, definition] of this.definitions.entries()) {
      if (pattern.toLowerCase().includes(lowerPartial) && suggestions.length < limit) {
        suggestions.push(pattern);
      }
    }

    return suggestions.sort((a, b) => {
      // Prioritize exact prefix matches
      const aStartsWith = a.toLowerCase().startsWith(lowerPartial);
      const bStartsWith = b.toLowerCase().startsWith(lowerPartial);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.length - b.length; // Prefer shorter matches
    });
  }

  /**
   * Extract unique providers from plan data and create dynamic filter options
   */
  extractProvidersFromPlans(plans: Array<{ provider: { name: string } }>): string[] {
    const uniqueProviders = new Set<string>();
    const providerMap = new Map<string, string>(); // Display name -> URL slug

    for (const plan of plans) {
      const providerName = plan.provider.name;
      if (providerName && providerName !== 'Unknown Provider') {
        // Create URL-friendly slug
        const urlSlug = this.createProviderSlug(providerName);
        
        // Avoid duplicates by checking if we already have this provider
        // (handles cases like "TXU Energy" and "TXU" being the same provider)
        const normalizedName = providerName.toLowerCase().replace(/\s+/g, '').replace(/energy|power|electric|company|corp|inc/g, '');
        
        let isDuplicate = false;
        for (const [existingDisplay, existingSlug] of providerMap.entries()) {
          const existingNormalized = existingDisplay.toLowerCase().replace(/\s+/g, '').replace(/energy|power|electric|company|corp|inc/g, '');
          if (normalizedName === existingNormalized) {
            isDuplicate = true;
            break;
          }
        }
        
        if (!isDuplicate) {
          providerMap.set(providerName, urlSlug);
          uniqueProviders.add(urlSlug);
        }
      }
    }

    return Array.from(uniqueProviders).sort();
  }

  /**
   * Create a URL-friendly slug from provider name
   */
  private createProviderSlug(providerName: string): string {
    return providerName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Get available providers for a specific filter type context
   * This method can be enhanced to return only providers that have plans 
   * available for the current filter context
   */
  getAvailableProvidersForContext(
    excludeTypes: FilterType[] = [],
    dynamicProviders: string[] = []
  ): { staticProviders: string[], dynamicProviders: string[] } {
    // Get static providers from filter definition
    const providerDef = this.filterDefinitions.find(def => def.type === 'provider');
    const staticProviders = providerDef?.urlPatterns || [];
    
    // Return both static and dynamic providers
    return {
      staticProviders,
      dynamicProviders: dynamicProviders.filter(provider => !staticProviders.includes(provider))
    };
  }
}

// Export a default instance
export const filterMapper = new FilterMapper();

// Utility functions for common operations
export function parseFilterUrl(
  citySlug: string,
  filterSegments: string[],
  tdspDuns: string
): FilterValidationResult {
  return filterMapper.mapFiltersToApiParams(citySlug, filterSegments, tdspDuns);
}

export function buildFilterUrl(apiParams: ApiParams): string[] {
  return filterMapper.generateUrlFromParams(apiParams);
}

export function validateFilter(segment: string): boolean {
  return filterMapper.validateFilterSegment(segment).isValid;
}

export function suggestFilters(partial: string): string[] {
  return filterMapper.getFilterSuggestions(partial);
}