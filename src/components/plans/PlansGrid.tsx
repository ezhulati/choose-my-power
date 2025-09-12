// T026: PlansGrid component implementation
// Responsive grid layout with pagination and sorting (FR-005, FR-003)

import React, { memo, useState, useEffect, useMemo } from 'react';
import type { ElectricityPlan } from '../../lib/types/electricity-plan';
import PlanCard from './PlanCard';
import { FilterEngine } from '../../lib/plan-filtering/filter-engine';
import type { PlanFilter } from '../../lib/types/plan-filter';

interface PlansGridProps {
  plans: ElectricityPlan[];
  filters: PlanFilter;
  onPlanSelect: (plan: ElectricityPlan) => void;
  onPlanCompare: (plan: ElectricityPlan) => void;
  selectedPlanIds: string[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  showComparison?: boolean;
  pageSize?: number;
  showPagination?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPlans: number;
  startIndex: number;
  endIndex: number;
}

const PlansGrid: React.FC<PlansGridProps> = memo(({
  plans,
  filters,
  onPlanSelect,
  onPlanCompare,
  selectedPlanIds,
  isLoading = false,
  error,
  className = '',
  showComparison = true,
  pageSize = 12,
  showPagination = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterEngine] = useState(() => new FilterEngine(plans));
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update filter engine when plans change
  useEffect(() => {
    filterEngine.updatePlans(plans);
  }, [plans, filterEngine]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply filters and get filtered plans
  const filteredResult = useMemo(() => {
    if (!isClient || plans.length === 0) {
      return {
        filteredPlans: [],
        totalCount: 0,
        filterCounts: {},
        responseTime: 0
      };
    }

    try {
      return filterEngine.applyFilters(filters);
    } catch (error) {
      console.error('[PlansGrid] Filter error:', error);
      return {
        filteredPlans: plans,
        totalCount: plans.length,
        filterCounts: {},
        responseTime: 0
      };
    }
  }, [filterEngine, filters, plans, isClient]);

  // Calculate pagination
  const paginationInfo = useMemo((): PaginationInfo => {
    const totalPlans = filteredResult.totalCount;
    const totalPages = Math.ceil(totalPlans / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalPlans);

    return {
      currentPage,
      totalPages,
      totalPlans,
      startIndex,
      endIndex
    };
  }, [filteredResult.totalCount, pageSize, currentPage]);

  // Get plans for current page
  const paginatedPlans = useMemo(() => {
    return filteredResult.filteredPlans.slice(
      paginationInfo.startIndex,
      paginationInfo.endIndex
    );
  }, [filteredResult.filteredPlans, paginationInfo.startIndex, paginationInfo.endIndex]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    const gridElement = document.getElementById('plans-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle plan selection
  const handlePlanSelect = (plan: ElectricityPlan) => {
    onPlanSelect(plan);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'plan_select', {
        event_category: 'engagement',
        event_label: plan.planName,
        provider: plan.providerName,
        rate: plan.baseRate,
        contract_length: plan.contractLength
      });
    }
  };

  // Handle plan comparison
  const handlePlanCompare = (plan: ElectricityPlan) => {
    onPlanCompare(plan);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'plan_compare_add', {
        event_category: 'engagement',
        event_label: plan.planName,
        provider: plan.providerName
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: pageSize }).map((_, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-texas-red/10 border border-texas-red/30 rounded-lg p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-texas-red mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-texas-red-900 mb-2">
            Unable to Load Plans
          </h3>
          <p className="text-sm text-texas-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // No results state
  if (filteredResult.filteredPlans.length === 0 && isClient) {
    const suggestions = filterEngine.generateSuggestions(filters);
    const nearbyPlans = filterEngine.findNearbyPlans(filters, 3);

    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-lg mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29.82-5.877 2.172M15 19.128A9.38 9.38 0 0112 18c-2.508 0-4.77.684-6.283 1.872M12 22a10 10 0 110-20 10 10 0 010 20z" />
          </svg>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No plans match your criteria
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters to see more options
          </p>

          {/* Filter Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-texas-navy/10 border border-texas-navy/30 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-texas-navy-900 mb-3">
                Suggested filter changes:
              </h4>
              <ul className="space-y-2 text-sm text-texas-navy-800">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 text-texas-navy mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{suggestion.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nearby Plans */}
          {nearbyPlans.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Similar plans you might like:
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {nearbyPlans.map((plan) => (
                  <div key={plan.id} className="text-left">
                    <PlanCard
                      plan={plan}
                      onSelect={handlePlanSelect}
                      onCompare={showComparison ? handlePlanCompare : undefined}
                      isSelected={selectedPlanIds.includes(plan.id)}
                      isCompareMode={selectedPlanIds.includes(plan.id)}
                      showComparison={showComparison}
                      className="max-w-sm mx-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className} id="plans-grid">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900">
            {paginationInfo.totalPlans.toLocaleString()} 
            {paginationInfo.totalPlans === 1 ? ' plan' : ' plans'} found
          </h2>
          {filteredResult.responseTime > 0 && (
            <span className="text-sm text-gray-500">
              ({filteredResult.responseTime}ms)
            </span>
          )}
        </div>
        
        {showPagination && paginationInfo.totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Showing {paginationInfo.startIndex + 1}-{paginationInfo.endIndex} of {paginationInfo.totalPlans}
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {paginatedPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handlePlanSelect}
            onCompare={showComparison ? handlePlanCompare : undefined}
            isSelected={selectedPlanIds.includes(plan.id)}
            isCompareMode={selectedPlanIds.includes(plan.id)}
            showComparison={showComparison}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {/* Previous Button */}
          <button
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          {(() => {
            const visiblePages = [];
            const totalPages = paginationInfo.totalPages;
            const current = currentPage;
            
            // Always show first page
            if (current > 3) {
              visiblePages.push(1);
              if (current > 4) visiblePages.push('...');
            }
            
            // Show pages around current
            for (let i = Math.max(1, current - 1); i <= Math.min(totalPages, current + 1); i++) {
              visiblePages.push(i);
            }
            
            // Always show last page
            if (current < totalPages - 2) {
              if (current < totalPages - 3) visiblePages.push('...');
              visiblePages.push(totalPages);
            }
            
            return visiblePages.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                );
              }
              
              const isActive = page === current;
              return (
                <button
                  key={page}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-texas-red text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePageChange(page as number)}
                  aria-label={`Go to page ${page}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            });
          })()}

          {/* Next Button */}
          <button
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === paginationInfo.totalPages}
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Performance Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          <p>
            <strong>Performance:</strong> Filter time: {filteredResult.responseTime}ms
            {filteredResult.responseTime > 300 && (
              <span className="text-texas-red ml-2">⚠️ Exceeds 300ms target</span>
            )}
          </p>
          <p>
            <strong>Results:</strong> {filteredResult.totalCount} of {plans.length} plans match filters
          </p>
          <p>
            <strong>Pagination:</strong> Page {currentPage} of {paginationInfo.totalPages} 
            ({pageSize} per page)
          </p>
        </div>
      )}
    </div>
  );
});

PlansGrid.displayName = 'PlansGrid';

export default PlansGrid;