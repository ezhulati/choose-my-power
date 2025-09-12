/**
 * FacetedPlanSearch - Main Faceted Search Container
 * Orchestrates real-time filtering, URL state management, and plan results
 * Provides enterprise-grade faceted search experience
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';
import FacetedSidebar from './FacetedSidebar';
import PlanResultsGrid from './PlanResultsGrid';
import FilterBreadcrumb from './FilterBreadcrumb';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';
import type { Plan, FacetValue, FilterState } from '../../types/facets';

interface FacetedPlanSearchProps {
  initialPlans: Plan[];
  citySlug: string;
  cityName: string;
  initialFilters: FilterState;
  availableFacets?: {
    rateTypes: FacetValue[];
    contractLengths: FacetValue[];
    greenEnergyLevels: FacetValue[];
    providers: FacetValue[];
    features: FacetValue[];
    priceRanges: FacetValue[];
  };
  sessionId?: string;
}

interface SearchState {
  plans: Plan[];
  totalCount: number;
  filteredCount: number;
  facetCounts: Record<string, Record<string, number>>;
  lowestRate: number;
  averageRate: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const FacetedPlanSearch: React.FC<FacetedPlanSearchProps> = ({
  initialPlans,
  citySlug,
  cityName,
  initialFilters,
  availableFacets,
  sessionId
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    plans: initialPlans,
    totalCount: initialPlans.length,
    filteredCount: initialPlans.length,
    facetCounts: {},
    lowestRate: 0,
    averageRate: 0,
    loading: false,
    error: null,
    lastUpdated: new Date()
  });

  const [currentFilters, setCurrentFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<'rate' | 'green_energy' | 'contract_length' | 'provider'>('rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

  // Debounced search function for real-time filtering
  const debouncedSearch = useCallback(
    debounce(async (filters: FilterState, sort: string, order: string) => {
      setSearchState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/plans/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            citySlug,
            filters,
            sortBy: sort,
            sortOrder: order,
            limit: 100,
            sessionId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered plans');
        }

        const data = await response.json();

        if (data.success) {
          setSearchState(prev => ({
            ...prev,
            plans: data.plans,
            totalCount: data.totalCount,
            filteredCount: data.filteredCount,
            facetCounts: data.facetCounts,
            lowestRate: data.lowestRate,
            averageRate: data.averageRate,
            loading: false,
            lastUpdated: new Date()
          }));

          // Update URL without page reload
          updateUrlState(filters);
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (error) {
        console.error('Faceted search error:', error);
        setSearchState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Search failed'
        }));
      }
    }, 300),
    [citySlug, sessionId]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: unknown, checked: boolean) => {
    setCurrentFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'rateType':
          newFilters.rateType = checked ? value : undefined;
          break;
        case 'contractLength':
          if (checked) {
            newFilters.contractLength = [...(newFilters.contractLength || []), value];
          } else {
            newFilters.contractLength = (newFilters.contractLength || []).filter(v => v !== value);
          }
          break;
        case 'greenEnergy':
          newFilters.greenEnergy = checked ? value : false;
          break;
        case 'prePaid':
          newFilters.prePaid = checked;
          break;
        case 'noDeposit':
          newFilters.noDeposit = checked;
          break;
        case 'providers':
          if (checked) {
            newFilters.providers = [...(newFilters.providers || []), value];
          } else {
            newFilters.providers = (newFilters.providers || []).filter(v => v !== value);
          }
          break;
        case 'priceRange':
          newFilters.priceRange = checked ? value : undefined;
          break;
        case 'features':
          if (checked) {
            newFilters.features = [...(newFilters.features || []), value];
          } else {
            newFilters.features = (newFilters.features || []).filter(v => v !== value);
          }
          break;
      }
      
      return newFilters;
    });
  }, []);

  // Handle sorting changes
  const handleSortChange = useCallback((newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // Handle plan selection for comparison
  const handlePlanSelect = useCallback((planId: string, selected: boolean) => {
    setSelectedPlans(prev => {
      if (selected && prev.length < 3) { // Max 3 plans for comparison
        return [...prev, planId];
      } else if (!selected) {
        return prev.filter(id => id !== planId);
      }
      return prev;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters: FilterState = {};
    setCurrentFilters(emptyFilters);
    
    // Update URL to base city page
    const newUrl = `/electricity-plans/${citySlug}`;
    window.history.pushState({}, '', newUrl);
  }, [citySlug]);

  // Update URL state without page reload
  const updateUrlState = useCallback((filters: FilterState) => {
    const filterSegments: string[] = [];
    
    // Build URL segments from filter state
    if (filters.contractLength?.length) {
      filterSegments.push(...filters.contractLength.map(length => `${length}-month`));
    }
    if (filters.rateType === 'fixed') filterSegments.push('fixed-rate');
    if (filters.rateType === 'variable') filterSegments.push('variable-rate');
    if (filters.greenEnergy) filterSegments.push('green-energy');
    if (filters.prePaid) filterSegments.push('prepaid');
    if (filters.noDeposit) filterSegments.push('no-deposit');
    if (filters.providers?.length) {
      filterSegments.push(...filters.providers.map(p => p.toLowerCase().replace(/\s+/g, '-')));
    }
    
    const newUrl = filterSegments.length > 0 
      ? `/electricity-plans/${citySlug}/${filterSegments.join('/')}`
      : `/electricity-plans/${citySlug}`;
    
    window.history.replaceState({}, '', newUrl);
  }, [citySlug]);

  // Effect to trigger search when filters change
  useEffect(() => {
    debouncedSearch(currentFilters, sortBy, sortOrder);
  }, [currentFilters, sortBy, sortOrder, debouncedSearch]);

  // Calculate statistics
  const statistics = useMemo(() => ({
    totalPlans: searchState.totalCount,
    filteredPlans: searchState.filteredCount,
    lowestRate: searchState.lowestRate,
    averageRate: searchState.averageRate,
    savings: searchState.lowestRate > 0 && searchState.averageRate > 0 
      ? Math.round((searchState.averageRate - searchState.lowestRate) * 12) 
      : 0
  }), [searchState]);

  return (
    <ErrorBoundary>
      <div className="faceted-plan-search">
        {/* Search Header */}
        <div className="search-header">
          <div className="search-stats">
            <h2 className="search-title">
              {statistics.filteredPlans} Electricity Plans in {cityName}
            </h2>
            <div className="search-metrics">
              <span className="stat-item">
                Starting at <strong>{statistics.lowestRate.toFixed(2)}¢/kWh</strong>
              </span>
              <span className="stat-item">
                Average Rate: <strong>{statistics.averageRate.toFixed(2)}¢/kWh</strong>
              </span>
              {statistics.savings > 0 && (
                <span className="stat-item highlight">
                  Save up to <strong>${statistics.savings}</strong> per year
                </span>
              )}
            </div>
          </div>

          {/* View Controls */}
          <div className="view-controls">
            <div className="sort-controls">
              <select 
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  handleSortChange(newSortBy, newSortOrder);
                }}
                className="sort-select"
              >
                <option value="rate-asc">Price: Low to High</option>
                <option value="rate-desc">Price: High to Low</option>
                <option value="green_energy-desc">Most Green Energy</option>
                <option value="contract_length-asc">Shortest Contract</option>
                <option value="provider-asc">Provider: A-Z</option>
              </select>
            </div>

            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Filter Breadcrumbs */}
        <FilterBreadcrumb
          filters={currentFilters}
          citySlug={citySlug}
          cityName={cityName}
          onRemoveFilter={handleFilterChange}
          onClearAll={clearAllFilters}
        />

        {/* Main Content */}
        <div className="search-content">
          {/* Sidebar */}
          <div className="search-sidebar">
            <FacetedSidebar
              currentFilters={currentFilters}
              availableFacets={availableFacets}
              facetCounts={searchState.facetCounts}
              onFilterChange={handleFilterChange}
              loading={searchState.loading}
            />
          </div>

          {/* Results */}
          <div className="search-results">
            {searchState.loading && (
              <div className="loading-overlay">
                <LoadingSpinner size="large" message="Updating results..." />
              </div>
            )}
            
            {searchState.error && (
              <div className="error-message">
                <div className="error-content">
                  <h3>Search Error</h3>
                  <p>{searchState.error}</p>
                  <button onClick={() => debouncedSearch(currentFilters, sortBy, sortOrder)}>
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!searchState.loading && !searchState.error && (
              <PlanResultsGrid
                plans={searchState.plans}
                viewMode={viewMode}
                selectedPlans={selectedPlans}
                onPlanSelect={handlePlanSelect}
                citySlug={citySlug}
                sessionId={sessionId}
              />
            )}
          </div>
        </div>

        {/* Comparison Bar */}
        {selectedPlans.length > 0 && (
          <div className="comparison-bar">
            <div className="comparison-content">
              <span className="comparison-label">
                {selectedPlans.length} plan{selectedPlans.length > 1 ? 's' : ''} selected
              </span>
              <button 
                className="compare-btn"
                onClick={() => {
                  const compareUrl = `/compare/plans?ids=${selectedPlans.join(',')}`;
                  window.open(compareUrl, '_blank');
                }}
                disabled={selectedPlans.length < 2}
              >
                Compare Plans
              </button>
              <button
                className="clear-selection-btn"
                onClick={() => setSelectedPlans([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        {searchState.lastUpdated && (
          <div className="performance-indicator">
            <small>
              Last updated: {searchState.lastUpdated.toLocaleTimeString()} 
              ({searchState.filteredCount} of {searchState.totalCount} plans shown)
            </small>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default FacetedPlanSearch;

// Component-specific styles
const styles = `
.faceted-plan-search {
  position: relative;
  width: 100%;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.search-stats {
  flex: 1;
}

.search-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.search-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-item strong {
  color: #002768;
  font-weight: 600;
}

.stat-item.highlight {
  background: #ecfdf5;
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #d1fae5;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
}

.view-mode-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.25rem;
}

.view-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background: #e5e7eb;
}

.view-btn.active {
  background: #002768;
  color: white;
}

.search-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .search-content {
    grid-template-columns: 1fr;
  }
  
  .search-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .view-controls {
    justify-content: space-between;
  }
}

.search-sidebar {
  position: sticky;
  top: 2rem;
}

.search-results {
  position: relative;
  min-height: 400px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.error-message {
  padding: 2rem;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
}

.error-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-content button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.comparison-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #002768;
  color: white;
  padding: 1rem;
  z-index: 40;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.comparison-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.comparison-label {
  font-weight: 500;
}

.compare-btn {
  background: #be0b31;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.compare-btn:hover:not(:disabled) {
  background: #a00922;
}

.compare-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-selection-btn {
  background: transparent;
  color: white;
  border: 1px solid white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-selection-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.performance-indicator {
  margin-top: 1rem;
  text-align: center;
  color: #6b7280;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}

.view-btn:focus,
.sort-select:focus,
.compare-btn:focus,
.clear-selection-btn:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('faceted-plan-search-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'faceted-plan-search-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}