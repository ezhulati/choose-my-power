// T007: PlanFilter interface
// URL-persistent filter state for real-time filtering (FR-002)

import type { RateType } from './electricity-plan';

export interface PlanFilter {
  // Location Context (Service area determination)
  city: string;                // Current city context
  zipCode?: string;           // Optional ZIP for precise filtering
  tdspTerritory?: string;     // Utility territory filter
  
  // Plan Characteristics (Real-time filtering FR-002)
  contractLengths: number[];  // [1, 6, 12, 24, 36] months
  rateTypes: RateType[];     // fixed, variable, indexed
  
  // Pricing Filters
  minRate?: number;          // Minimum rate per kWh
  maxRate?: number;          // Maximum rate per kWh
  maxMonthlyFee?: number;    // Monthly fee ceiling
  includePromotions: boolean; // Include promotional offers
  
  // Feature Filters
  minGreenEnergy?: number;    // Minimum renewable percentage
  requiredFeatures: string[]; // Must-have plan features
  excludeEarlyTerminationFee: boolean;
  
  // Provider Filters
  selectedProviders: string[]; // Provider name array
  minProviderRating?: number;  // Minimum customer rating
  
  // Sort Options (FR-006)
  sortBy: 'price' | 'rating' | 'contract' | 'provider' | 'green';
  sortOrder: 'asc' | 'desc';
  
  // UI State
  activeFiltersCount: number;  // Count display (FR-004)
  lastApplied: Date;          // Filter application timestamp
}

export type SortOption = PlanFilter['sortBy'];
export type SortDirection = PlanFilter['sortOrder'];

export const VALID_CONTRACT_LENGTHS = [1, 6, 12, 24, 36] as const;
export const VALID_RATE_TYPES: RateType[] = ['fixed', 'variable', 'indexed'];
export const VALID_SORT_OPTIONS: SortOption[] = ['price', 'rating', 'contract', 'provider', 'green'];

// Default filter state
export const createDefaultFilter = (city: string): PlanFilter => ({
  city,
  contractLengths: [],
  rateTypes: [],
  includePromotions: true,
  requiredFeatures: [],
  excludeEarlyTerminationFee: false,
  selectedProviders: [],
  sortBy: 'price',
  sortOrder: 'asc',
  activeFiltersCount: 0,
  lastApplied: new Date(),
});

// URL serialization helpers
export const serializeFiltersToURL = (filters: PlanFilter): string => {
  const params = new URLSearchParams();
  
  params.set('city', filters.city);
  
  if (filters.zipCode) params.set('zip', filters.zipCode);
  if (filters.tdspTerritory) params.set('tdsp', filters.tdspTerritory);
  
  if (filters.contractLengths.length > 0) {
    params.set('contract', filters.contractLengths.join(','));
  }
  
  if (filters.rateTypes.length > 0) {
    params.set('rate', filters.rateTypes.join(','));
  }
  
  if (filters.minRate !== undefined) params.set('minRate', filters.minRate.toString());
  if (filters.maxRate !== undefined) params.set('maxRate', filters.maxRate.toString());
  if (filters.maxMonthlyFee !== undefined) params.set('maxFee', filters.maxMonthlyFee.toString());
  
  if (!filters.includePromotions) params.set('noPromo', 'true');
  
  if (filters.minGreenEnergy !== undefined) {
    params.set('greenMin', filters.minGreenEnergy.toString());
  }
  
  if (filters.requiredFeatures.length > 0) {
    params.set('features', filters.requiredFeatures.join(','));
  }
  
  if (filters.excludeEarlyTerminationFee) params.set('noETF', 'true');
  
  if (filters.selectedProviders.length > 0) {
    params.set('providers', filters.selectedProviders.join(','));
  }
  
  if (filters.minProviderRating !== undefined) {
    params.set('rating', filters.minProviderRating.toString());
  }
  
  if (filters.sortBy !== 'price') params.set('sort', filters.sortBy);
  if (filters.sortOrder !== 'asc') params.set('order', filters.sortOrder);
  
  return params.toString();
};

export const parseFiltersFromURL = (searchParams: URLSearchParams, defaultCity: string): PlanFilter => {
  const filters = createDefaultFilter(searchParams.get('city') || defaultCity);
  
  // Parse optional parameters
  if (searchParams.has('zip')) filters.zipCode = searchParams.get('zip')!;
  if (searchParams.has('tdsp')) filters.tdspTerritory = searchParams.get('tdsp')!;
  
  // Parse contract lengths
  if (searchParams.has('contract')) {
    const contractStr = searchParams.get('contract')!;
    filters.contractLengths = contractStr
      .split(',')
      .map(Number)
      .filter(n => VALID_CONTRACT_LENGTHS.includes(n as unknown));
  }
  
  // Parse rate types
  if (searchParams.has('rate')) {
    const rateStr = searchParams.get('rate')!;
    filters.rateTypes = rateStr
      .split(',')
      .filter((r): r is RateType => VALID_RATE_TYPES.includes(r as RateType));
  }
  
  // Parse numeric filters
  if (searchParams.has('minRate')) {
    const minRate = parseFloat(searchParams.get('minRate')!);
    if (!isNaN(minRate) && minRate >= 0) filters.minRate = minRate;
  }
  
  if (searchParams.has('maxRate')) {
    const maxRate = parseFloat(searchParams.get('maxRate')!);
    if (!isNaN(maxRate) && maxRate >= 0) filters.maxRate = maxRate;
  }
  
  if (searchParams.has('maxFee')) {
    const maxFee = parseFloat(searchParams.get('maxFee')!);
    if (!isNaN(maxFee) && maxFee >= 0) filters.maxMonthlyFee = maxFee;
  }
  
  if (searchParams.has('greenMin')) {
    const greenMin = parseInt(searchParams.get('greenMin')!);
    if (!isNaN(greenMin) && greenMin >= 0 && greenMin <= 100) {
      filters.minGreenEnergy = greenMin;
    }
  }
  
  if (searchParams.has('rating')) {
    const rating = parseFloat(searchParams.get('rating')!);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      filters.minProviderRating = rating;
    }
  }
  
  // Parse boolean flags
  if (searchParams.has('noPromo')) filters.includePromotions = false;
  if (searchParams.has('noETF')) filters.excludeEarlyTerminationFee = true;
  
  // Parse arrays
  if (searchParams.has('features')) {
    filters.requiredFeatures = searchParams.get('features')!.split(',');
  }
  
  if (searchParams.has('providers')) {
    filters.selectedProviders = searchParams.get('providers')!.split(',');
  }
  
  // Parse sort options
  if (searchParams.has('sort')) {
    const sort = searchParams.get('sort')!;
    if (VALID_SORT_OPTIONS.includes(sort as SortOption)) {
      filters.sortBy = sort as SortOption;
    }
  }
  
  if (searchParams.has('order')) {
    const order = searchParams.get('order')!;
    if (order === 'desc') filters.sortOrder = 'desc';
  }
  
  // Calculate active filters count
  filters.activeFiltersCount = calculateActiveFiltersCount(filters);
  
  return filters;
};

export const calculateActiveFiltersCount = (filters: PlanFilter): number => {
  let count = 0;
  
  if (filters.contractLengths.length > 0) count++;
  if (filters.rateTypes.length > 0) count++;
  if (filters.minRate !== undefined) count++;
  if (filters.maxRate !== undefined) count++;
  if (filters.maxMonthlyFee !== undefined) count++;
  if (!filters.includePromotions) count++;
  if (filters.minGreenEnergy !== undefined) count++;
  if (filters.requiredFeatures.length > 0) count++;
  if (filters.excludeEarlyTerminationFee) count++;
  if (filters.selectedProviders.length > 0) count++;
  if (filters.minProviderRating !== undefined) count++;
  
  return count;
};