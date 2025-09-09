// T027: PlansFilter component implementation
// Advanced filtering interface with real-time updates (FR-003, FR-004, FR-011)

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import type { PlanFilter } from '../../lib/types/plan-filter';
import type { ElectricityPlan } from '../../lib/types/electricity-plan';
import { FilterEngine } from '../../lib/plan-filtering/filter-engine';

interface PlansFilterProps {
  filters: PlanFilter;
  onFiltersChange: (filters: PlanFilter) => void;
  availablePlans: ElectricityPlan[];
  filterCounts?: { [key: string]: number };
  isLoading?: boolean;
  className?: string;
  showMobileToggle?: boolean;
}

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number;
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  badge 
}) => (
  <div className="border-b border-gray-200 pb-4">
    <button
      className="flex items-center justify-between w-full text-left py-2 focus:outline-none focus:ring-2 focus:ring-texas-red-200 rounded"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {badge !== undefined && badge > 0 && (
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-texas-red text-white rounded-full">
            {badge}
          </span>
        )}
      </div>
      <svg 
        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isExpanded && (
      <div className="mt-4 space-y-3">
        {children}
      </div>
    )}
  </div>
);

const PlansFilter: React.FC<PlansFilterProps> = memo(({
  filters,
  onFiltersChange,
  availablePlans,
  filterCounts = {},
  isLoading = false,
  className = '',
  showMobileToggle = true
}) => {
  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    contract: true,
    features: false,
    providers: false,
    green: false,
    advanced: false
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [filterEngine] = useState(() => new FilterEngine(availablePlans));

  // Update filter engine when plans change
  useEffect(() => {
    filterEngine.updatePlans(availablePlans);
  }, [availablePlans, filterEngine]);

  // Sync temp filters with prop changes
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Debounced filter update
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newFilters: PlanFilter) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onFiltersChange(newFilters);
        }, 300);
      };
    })(),
    [onFiltersChange]
  );

  // Update filters helper
  const updateFilters = useCallback((updates: Partial<PlanFilter>) => {
    const newFilters = { ...tempFilters, ...updates };
    setTempFilters(newFilters);
    debouncedUpdate(newFilters);
  }, [tempFilters, debouncedUpdate]);

  // Get unique providers from available plans
  const availableProviders = useMemo(() => {
    const providers = new Set(availablePlans.map(plan => plan.providerName));
    return Array.from(providers).sort();
  }, [availablePlans]);

  // Get unique contract lengths
  const availableContractLengths = useMemo(() => {
    const lengths = new Set(availablePlans.map(plan => plan.contractLength));
    return Array.from(lengths).sort((a, b) => a - b);
  }, [availablePlans]);

  // Get unique rate types
  const availableRateTypes = useMemo(() => {
    const types = new Set(availablePlans.map(plan => plan.rateType));
    return Array.from(types).sort();
  }, [availablePlans]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: PlanFilter = {
      city: tempFilters.city,
      state: tempFilters.state,
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
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (tempFilters.contractLengths.length > 0) count++;
    if (tempFilters.rateTypes.length > 0) count++;
    if (tempFilters.minRate || tempFilters.maxRate) count++;
    if (tempFilters.maxMonthlyFee) count++;
    if (tempFilters.minGreenEnergy) count++;
    if (tempFilters.selectedProviders.length > 0) count++;
    if (tempFilters.minProviderRating) count++;
    if (tempFilters.requiredFeatures.length > 0) count++;
    if (tempFilters.includePromotions) count++;
    if (tempFilters.excludeEarlyTerminationFee) count++;
    return count;
  }, [tempFilters]);

  const filterClasses = `
    bg-white border border-gray-200 rounded-lg shadow-sm
    ${className}
  `.trim();

  return (
    <>
      {/* Mobile Filter Toggle */}
      {showMobileToggle && (
        <div className="lg:hidden mb-4">
          <button
            className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-filters"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="font-medium text-gray-900">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 text-sm text-texas-red">
                    ({activeFilterCount})
                  </span>
                )}
              </span>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isMobileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter Panel */}
      <div 
        id="mobile-filters"
        className={`${filterClasses} ${showMobileToggle ? `lg:block ${isMobileOpen ? 'block' : 'hidden'}` : 'block'}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filter Plans</h2>
            {activeFilterCount > 0 && (
              <button
                className="text-sm text-texas-red hover:text-texas-red-600 font-medium"
                onClick={clearAllFilters}
              >
                Clear All ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Pricing Filters */}
            <FilterSection
              title="Pricing"
              isExpanded={expandedSections.pricing}
              onToggle={() => toggleSection('pricing')}
              badge={tempFilters.minRate || tempFilters.maxRate || tempFilters.maxMonthlyFee ? 1 : 0}
            >
              {/* Rate Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Electricity Rate (¢/kWh)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempFilters.minRate || ''}
                      onChange={(e) => updateFilters({ 
                        minRate: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                      min="0"
                      max="50"
                      step="0.1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempFilters.maxRate || ''}
                      onChange={(e) => updateFilters({ 
                        maxRate: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                      min="0"
                      max="50"
                      step="0.1"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Monthly Fee
                </label>
                <input
                  type="number"
                  placeholder="$0 (no fee)"
                  value={tempFilters.maxMonthlyFee || ''}
                  onChange={(e) => updateFilters({ 
                    maxMonthlyFee: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                  min="0"
                  max="50"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>

              {/* Rate Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rate Type
                </label>
                <div className="space-y-2">
                  {availableRateTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempFilters.rateTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...tempFilters.rateTypes, type]
                            : tempFilters.rateTypes.filter(t => t !== type);
                          updateFilters({ rateTypes: newTypes });
                        }}
                        className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {type} rate
                        {filterCounts[`${type}-rate`] && (
                          <span className="text-gray-500 ml-1">
                            ({filterCounts[`${type}-rate`]})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </FilterSection>

            {/* Contract Terms */}
            <FilterSection
              title="Contract Terms"
              isExpanded={expandedSections.contract}
              onToggle={() => toggleSection('contract')}
              badge={tempFilters.contractLengths.length + (tempFilters.excludeEarlyTerminationFee ? 1 : 0)}
            >
              {/* Contract Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Contract Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableContractLengths.map(length => (
                    <label key={length} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={tempFilters.contractLengths.includes(length)}
                        onChange={(e) => {
                          const newLengths = e.target.checked
                            ? [...tempFilters.contractLengths, length]
                            : tempFilters.contractLengths.filter(l => l !== length);
                          updateFilters({ contractLengths: newLengths });
                        }}
                        className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {length}mo
                        {filterCounts[`${length}-month`] && (
                          <span className="text-gray-500 text-xs block">
                            ({filterCounts[`${length}-month`]})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Early Termination Fee */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.excludeEarlyTerminationFee}
                    onChange={(e) => updateFilters({ excludeEarlyTerminationFee: e.target.checked })}
                    className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    No early termination fee
                    {filterCounts['no-etf'] && (
                      <span className="text-gray-500 ml-1">
                        ({filterCounts['no-etf']} plans)
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </FilterSection>

            {/* Green Energy */}
            <FilterSection
              title="Green Energy"
              isExpanded={expandedSections.green}
              onToggle={() => toggleSection('green')}
              badge={tempFilters.minGreenEnergy ? 1 : 0}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Renewable Energy (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={tempFilters.minGreenEnergy || 0}
                  onChange={(e) => updateFilters({ 
                    minGreenEnergy: parseInt(e.target.value) || undefined 
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-medium">
                    {tempFilters.minGreenEnergy || 0}%
                  </span>
                  <span>100%</span>
                </div>
                {filterCounts['green-energy'] && (
                  <p className="text-xs text-gray-500 mt-2">
                    {filterCounts['green-energy']} plans offer renewable energy
                  </p>
                )}
              </div>
            </FilterSection>

            {/* Providers */}
            <FilterSection
              title="Electricity Providers"
              isExpanded={expandedSections.providers}
              onToggle={() => toggleSection('providers')}
              badge={tempFilters.selectedProviders.length + (tempFilters.minProviderRating ? 1 : 0)}
            >
              {/* Provider Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Provider Rating
                </label>
                <select
                  value={tempFilters.minProviderRating || ''}
                  onChange={(e) => updateFilters({ 
                    minProviderRating: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                  disabled={isLoading}
                >
                  <option value="">Any rating</option>
                  <option value="3.0">3.0+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                  <option value="4.0">4.0+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Providers
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
                  {availableProviders.map(provider => (
                    <label key={provider} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempFilters.selectedProviders.includes(provider)}
                        onChange={(e) => {
                          const newProviders = e.target.checked
                            ? [...tempFilters.selectedProviders, provider]
                            : tempFilters.selectedProviders.filter(p => p !== provider);
                          updateFilters({ selectedProviders: newProviders });
                        }}
                        className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {provider}
                        {filterCounts[provider.toLowerCase().replace(/\s+/g, '-')] && (
                          <span className="text-gray-500 ml-1">
                            ({filterCounts[provider.toLowerCase().replace(/\s+/g, '-')]})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </FilterSection>

            {/* Features */}
            <FilterSection
              title="Plan Features"
              isExpanded={expandedSections.features}
              onToggle={() => toggleSection('features')}
              badge={tempFilters.requiredFeatures.length + (tempFilters.includePromotions ? 1 : 0)}
            >
              {/* Common Features */}
              <div className="space-y-2">
                {[
                  'No deposit required',
                  'AutoPay discount',
                  'Online account management',
                  'Fixed rate guarantee',
                  'Free nights',
                  'Free weekends'
                ].map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tempFilters.requiredFeatures.includes(feature)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked
                          ? [...tempFilters.requiredFeatures, feature]
                          : tempFilters.requiredFeatures.filter(f => f !== feature);
                        updateFilters({ requiredFeatures: newFeatures });
                      }}
                      className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {feature}
                    </span>
                  </label>
                ))}
              </div>

              {/* Promotions */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tempFilters.includePromotions}
                    onChange={(e) => updateFilters({ includePromotions: e.target.checked })}
                    className="h-4 w-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Only show plans with promotions
                  </span>
                </label>
              </div>
            </FilterSection>

            {/* Sorting */}
            <FilterSection
              title="Sort Results"
              isExpanded={expandedSections.advanced}
              onToggle={() => toggleSection('advanced')}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    value={tempFilters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                    disabled={isLoading}
                  >
                    <option value="price">Price</option>
                    <option value="rating">Provider Rating</option>
                    <option value="contract">Contract Length</option>
                    <option value="provider">Provider Name</option>
                    <option value="green">Green Energy %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    value={tempFilters.sortOrder}
                    onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red text-sm"
                    disabled={isLoading}
                  >
                    <option value="asc">Low to High</option>
                    <option value="desc">High to Low</option>
                  </select>
                </div>
              </div>
            </FilterSection>
          </div>

          {/* Filter Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Active Filters</h4>
                  <p className="text-sm text-blue-700">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                  </p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

PlansFilter.displayName = 'PlansFilter';

export default PlansFilter;