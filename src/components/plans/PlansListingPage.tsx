// T029: PlansListingPage main component
// Complete electricity plans listing page with filtering and comparison (FR-001 through FR-015)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ElectricityPlan } from '../../lib/types/electricity-plan';
import type { PlanFilter } from '../../lib/types/plan-filter';
import PlansFilter from './PlansFilter';
import PlansGrid from './PlansGrid';
import PlansComparison from './PlansComparison';
import { urlStateManager } from '../../lib/plan-filtering/url-state';
import { comparisonStateManager } from '../../lib/plan-comparison/comparison-state';

interface PlansListingPageProps {
  // Required props
  city: string;
  state?: string;
  initialPlans?: ElectricityPlan[];
  
  // Optional configuration
  showComparison?: boolean;
  showFilters?: boolean;
  pageSize?: number;
  defaultMonthlyUsage?: number;
  
  // Event handlers
  onPlanSelect?: (plan: ElectricityPlan) => void;
  onFiltersChange?: (filters: PlanFilter, planCount: number) => void;
  
  // API endpoints
  plansEndpoint?: string;
  analyticsEndpoint?: string;
  
  className?: string;
}

interface PageState {
  plans: ElectricityPlan[];
  filters: PlanFilter;
  selectedPlanIds: string[];
  isLoading: boolean;
  error: string | null;
  showComparisonPanel: boolean;
  monthlyUsage: number;
}

const PlansListingPage: React.FC<PlansListingPageProps> = ({
  city,
  state = 'texas',
  initialPlans = [],
  showComparison = true,
  showFilters = true,
  pageSize = 12,
  defaultMonthlyUsage = 1000,
  onPlanSelect,
  onFiltersChange,
  plansEndpoint = '/api/plans/list',
  analyticsEndpoint = '/api/analytics/filter-interaction',
  className = ''
}) => {
  // Main page state
  const [pageState, setPageState] = useState<PageState>({
    plans: initialPlans,
    filters: {
      city,
      state,
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
    },
    selectedPlanIds: [],
    isLoading: initialPlans.length === 0,
    error: null,
    showComparisonPanel: false,
    monthlyUsage: defaultMonthlyUsage
  });

  // Initialize URL state and comparison state on mount
  useEffect(() => {
    // Parse filters from URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFilters = urlStateManager.parseFiltersFromURL(urlParams, city);
      
      // Update filters if different from initial
      if (JSON.stringify(urlFilters) !== JSON.stringify(pageState.filters)) {
        setPageState(prev => ({
          ...prev,
          filters: { ...urlFilters, city, state }
        }));
      }

      // Initialize comparison state
      const comparisonState = comparisonStateManager.getState();
      setPageState(prev => ({
        ...prev,
        selectedPlanIds: comparisonState.selectedPlans.map(p => p.id),
        showComparisonPanel: comparisonState.selectedPlans.length > 0
      }));
    }
  }, [city, state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load plans data
  const loadPlans = useCallback(async (filters: PlanFilter) => {
    if (initialPlans.length > 0 && filters.city === city) {
      return; // Use initial plans if provided and city matches
    }

    setPageState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryParams = new URLSearchParams({
        city: filters.city,
        state: filters.state,
        limit: '100', // Load more plans for better filtering
        ...urlStateManager.serializeFiltersToURL(filters).split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          if (key && value) acc[key] = decodeURIComponent(value);
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`${plansEndpoint}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load plans: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load plans');
      }

      setPageState(prev => ({
        ...prev,
        plans: data.plans || [],
        isLoading: false,
        error: null
      }));

    } catch (error) {
      console.error('[PlansListingPage] Load plans error:', error);
      setPageState(prev => ({
        ...prev,
        plans: initialPlans,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load plans'
      }));
    }
  }, [initialPlans, city, plansEndpoint]);

  // Load plans when filters change
  useEffect(() => {
    loadPlans(pageState.filters);
  }, [pageState.filters, loadPlans]);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: PlanFilter) => {
    setPageState(prev => ({
      ...prev,
      filters: newFilters
    }));

    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const newURL = urlStateManager.createShareableURL(newFilters, window.location.origin);
      const currentURL = window.location.href;
      
      if (newURL !== currentURL) {
        window.history.pushState(
          urlStateManager.getHistoryState(newFilters),
          '',
          newURL
        );
      }
    }

    // Track analytics
    trackFilterInteraction(newFilters);

    // Call parent callback
    onFiltersChange?.(newFilters, pageState.plans.length);
  }, [pageState.plans.length, onFiltersChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle plan selection
  const handlePlanSelect = useCallback((plan: ElectricityPlan) => {
    // Call parent callback first
    onPlanSelect?.(plan);

    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'plan_select', {
        event_category: 'engagement',
        event_label: plan.planName,
        provider: plan.providerName,
        city: pageState.filters.city,
        rate: plan.baseRate
      });
    }

    // Navigate to plan details or order flow
  }, [onPlanSelect, pageState.filters.city]);

  // Handle plan comparison
  const handlePlanCompare = useCallback((plan: ElectricityPlan) => {
    const result = comparisonStateManager.togglePlan(plan);
    
    // Update selected plan IDs
    const newSelectedIds = comparisonStateManager.getSelectedPlans().map(p => p.id);
    setPageState(prev => ({
      ...prev,
      selectedPlanIds: newSelectedIds,
      showComparisonPanel: newSelectedIds.length > 0
    }));

    // Show feedback
    if (result.success) {
      const message = result.action === 'added' 
        ? `${plan.planName} added to comparison` 
        : `${plan.planName} removed from comparison`;
      
      // Could implement toast notification here
    } else {
      console.warn('[PlansListingPage] Comparison error:', result.message);
    }
  }, []);

  // Handle comparison plan removal
  const handleComparisonRemove = useCallback((planId: string) => {
    const result = comparisonStateManager.removePlan(planId);
    
    // Update selected plan IDs
    const newSelectedIds = comparisonStateManager.getSelectedPlans().map(p => p.id);
    setPageState(prev => ({
      ...prev,
      selectedPlanIds: newSelectedIds,
      showComparisonPanel: newSelectedIds.length > 0
    }));

    if (result.success) {
    }
  }, []);

  // Handle monthly usage change
  const handleUsageChange = useCallback((newUsage: number) => {
    setPageState(prev => ({
      ...prev,
      monthlyUsage: newUsage
    }));
  }, []);

  // Track filter interactions for analytics
  const trackFilterInteraction = useCallback(async (filters: PlanFilter) => {
    if (typeof window === 'undefined') return;

    try {
      const analyticsData = {
        event: 'filter_change',
        filters: {
          city: filters.city,
          state: filters.state,
          contractLengths: filters.contractLengths,
          rateTypes: filters.rateTypes,
          hasRateRange: !!(filters.minRate || filters.maxRate),
          hasMonthlyFeeLimit: !!filters.maxMonthlyFee,
          hasGreenEnergyFilter: !!filters.minGreenEnergy,
          providerCount: filters.selectedProviders.length,
          hasRatingFilter: !!filters.minProviderRating,
          featureCount: filters.requiredFeatures.length,
          includePromotions: filters.includePromotions,
          excludeEarlyTerminationFee: filters.excludeEarlyTerminationFee,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Send analytics (non-blocking)
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsData)
      }).catch(error => {
        console.warn('[PlansListingPage] Analytics error:', error);
      });

    } catch (error) {
      console.warn('[PlansListingPage] Analytics tracking error:', error);
    }
  }, [analyticsEndpoint]);

  // Get comparison plans
  const comparisonPlans = useMemo(() => {
    return comparisonStateManager.getSelectedPlans();
  }, [pageState.selectedPlanIds]);

  // Error boundary
  if (pageState.error && pageState.plans.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className="text-center py-12">
          <div className="bg-texas-red/10 border border-texas-red/30 rounded-lg p-6 max-w-md mx-auto">
            <svg className="w-12 h-12 text-texas-red mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Unable to Load Plans
            </h3>
            <p className="text-sm text-texas-red-700 mb-4">
              {pageState.error}
            </p>
            <button
              onClick={() => loadPlans(pageState.filters)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-texas-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Electricity Plans in {city.charAt(0).toUpperCase() + city.slice(1)}, {state.toUpperCase()}
            </h1>
            <p className="text-lg text-gray-600">
              Compare electricity rates and find the best plan for your home
            </p>
          </div>

          {/* Usage Selector */}
          <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Usage (kWh)
            </label>
            <select
              value={pageState.monthlyUsage}
              onChange={(e) => handleUsageChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red"
            >
              <option value={500}>500 kWh (Small home)</option>
              <option value={1000}>1,000 kWh (Average home)</option>
              <option value={1500}>1,500 kWh (Large home)</option>
              <option value={2000}>2,000 kWh (Very large home)</option>
            </select>
          </div>
        </div>

        {/* Mobile Usage Selector */}
        <div className="md:hidden mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Usage (kWh)
          </label>
          <select
            value={pageState.monthlyUsage}
            onChange={(e) => handleUsageChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-texas-red focus:border-texas-red"
          >
            <option value={500}>500 kWh (Small home)</option>
            <option value={1000}>1,000 kWh (Average home)</option>
            <option value={1500}>1,500 kWh (Large home)</option>
            <option value={2000}>2,000 kWh (Very large home)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4">
              <PlansFilter
                filters={pageState.filters}
                onFiltersChange={updateFilters}
                availablePlans={pageState.plans}
                isLoading={pageState.isLoading}
                showMobileToggle={true}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Comparison Panel */}
          {showComparison && pageState.showComparisonPanel && comparisonPlans.length > 0 && (
            <div className="mb-8">
              <PlansComparison
                plans={comparisonPlans}
                onRemovePlan={handleComparisonRemove}
                onSelectPlan={handlePlanSelect}
                onClose={() => setPageState(prev => ({ ...prev, showComparisonPanel: false }))}
                monthlyUsage={pageState.monthlyUsage}
                analysisMonths={12}
              />
            </div>
          )}

          {/* Comparison Toggle Button */}
          {showComparison && !pageState.showComparisonPanel && pageState.selectedPlanIds.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setPageState(prev => ({ ...prev, showComparisonPanel: true }))}
                className="flex items-center px-4 py-2 bg-texas-red text-white font-medium rounded-md hover:bg-texas-red-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare {pageState.selectedPlanIds.length} Plan{pageState.selectedPlanIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Plans Grid */}
          <PlansGrid
            plans={pageState.plans}
            filters={pageState.filters}
            onPlanSelect={handlePlanSelect}
            onPlanCompare={showComparison ? handlePlanCompare : () => {}}
            selectedPlanIds={pageState.selectedPlanIds}
            isLoading={pageState.isLoading}
            error={pageState.error}
            showComparison={showComparison}
            pageSize={pageSize}
            showPagination={true}
          />
        </div>
      </div>

      {/* Performance Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          <h3 className="font-semibold text-gray-900 mb-2">Development Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Plans:</strong> {pageState.plans.length} loaded
              <br />
              <strong>City:</strong> {pageState.filters.city}, {pageState.filters.state}
              <br />
              <strong>Usage:</strong> {pageState.monthlyUsage.toLocaleString()} kWh/month
            </div>
            <div>
              <strong>Active Filters:</strong>
              <ul className="mt-1 text-xs">
                {pageState.filters.contractLengths.length > 0 && <li>Contract: {pageState.filters.contractLengths.join(', ')} months</li>}
                {pageState.filters.rateTypes.length > 0 && <li>Rate Type: {pageState.filters.rateTypes.join(', ')}</li>}
                {(pageState.filters.minRate || pageState.filters.maxRate) && <li>Rate Range: {pageState.filters.minRate || 0}¢ - {pageState.filters.maxRate || '∞'}¢</li>}
                {pageState.filters.selectedProviders.length > 0 && <li>Providers: {pageState.filters.selectedProviders.length}</li>}
              </ul>
            </div>
            <div>
              <strong>Comparison:</strong> {pageState.selectedPlanIds.length}/4 plans selected
              <br />
              <strong>Panel:</strong> {pageState.showComparisonPanel ? 'Open' : 'Closed'}
              <br />
              <strong>Loading:</strong> {pageState.isLoading ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansListingPage;