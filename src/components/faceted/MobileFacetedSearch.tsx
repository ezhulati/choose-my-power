/**
 * MobileFacetedSearch Component
 * Touch-optimized faceted search for mobile devices
 * Implements swipe gestures, modal interfaces, and progressive enhancement
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FilterState, Plan, FacetValue } from '../../types/facets';

interface MobileFacetedSearchProps {
  plans: Plan[];
  citySlug: string;
  cityName: string;
  currentFilters: FilterState;
  availableFacets?: {
    rateTypes: FacetValue[];
    contractLengths: FacetValue[];
    greenEnergyLevels: FacetValue[];
    providers: FacetValue[];
    features: FacetValue[];
    priceRanges: FacetValue[];
  };
  onFilterChange: (filterType: string, value: any, checked: boolean) => void;
  onClearAll: () => void;
  loading?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

const MobileFacetedSearch: React.FC<MobileFacetedSearchProps> = ({
  plans,
  citySlug,
  cityName,
  currentFilters,
  availableFacets,
  onFilterChange,
  onClearAll,
  loading = false
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false
  });
  const [sortBy, setSortBy] = useState<'rate' | 'green_energy' | 'contract_length'>('rate');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

  const filterModalRef = useRef<HTMLDivElement>(null);
  const planListRef = useRef<HTMLDivElement>(null);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (currentFilters.rateType) count++;
    if (currentFilters.contractLength?.length) count += currentFilters.contractLength.length;
    if (currentFilters.greenEnergy) count++;
    if (currentFilters.prePaid) count++;
    if (currentFilters.noDeposit) count++;
    if (currentFilters.providers?.length) count += currentFilters.providers.length;
    if (currentFilters.features?.length) count += currentFilters.features.length;
    if (currentFilters.priceRange) count++;
    return count;
  }, [currentFilters]);

  // Handle touch events for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isDragging) return;
    
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  }, [swipeState.isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = Math.abs(swipeState.currentY - swipeState.startY);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && showFilters) {
        // Swipe right to close filters
        setShowFilters(false);
      } else if (deltaX < 0 && !showFilters) {
        // Swipe left to open filters
        setShowFilters(true);
      }
    }

    setSwipeState(prev => ({ ...prev, isDragging: false }));
  }, [swipeState, showFilters]);

  // Close filter modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
        setShowFilters(false);
        setActiveSection(null);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  // Sort plans based on selection
  const sortedPlans = React.useMemo(() => {
    return [...plans].sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return parseFloat(a.rate) - parseFloat(b.rate);
        case 'green_energy':
          return b.percent_green - a.percent_green;
        case 'contract_length':
          return a.term_months - b.term_months;
        default:
          return 0;
      }
    });
  }, [plans, sortBy]);

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="mobile-faceted-search">
      {/* Header with Search Controls */}
      <div className="search-header">
        <div className="header-top">
          <h2 className="search-title">
            {plans.length} Plans in {cityName}
          </h2>
          <button
            className="view-toggle"
            onClick={() => setViewMode(viewMode === 'card' ? 'compact' : 'card')}
            aria-label={`Switch to ${viewMode === 'card' ? 'compact' : 'card'} view`}
          >
            {viewMode === 'card' ? 'List' : 'Grid'}
          </button>
        </div>

        <div className="header-controls">
          {/* Filter Button */}
          <button
            className="filter-button"
            onClick={() => setShowFilters(true)}
            aria-label="Open filters"
          >
            <span className="filter-icon">Filter</span>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="rate">Price: Low to High</option>
            <option value="green_energy">Most Green Energy</option>
            <option value="contract_length">Shortest Contract</option>
          </select>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="active-filters-bar">
            <div className="active-filters-scroll">
              {currentFilters.contractLength?.map(length => (
                <button
                  key={`contract-${length}`}
                  className="filter-chip"
                  onClick={() => onFilterChange('contractLength', length, false)}
                >
                  {length} Month ×
                </button>
              ))}
              {currentFilters.rateType && (
                <button
                  className="filter-chip"
                  onClick={() => onFilterChange('rateType', currentFilters.rateType, false)}
                >
                  {currentFilters.rateType === 'fixed' ? 'Fixed Rate' : 'Variable Rate'} ×
                </button>
              )}
              {currentFilters.greenEnergy && (
                <button
                  className="filter-chip"
                  onClick={() => onFilterChange('greenEnergy', true, false)}
                >
                  Green Energy ×
                </button>
              )}
              {currentFilters.prePaid && (
                <button
                  className="filter-chip"
                  onClick={() => onFilterChange('prePaid', true, false)}
                >
                  Prepaid ×
                </button>
              )}
              {currentFilters.noDeposit && (
                <button
                  className="filter-chip"
                  onClick={() => onFilterChange('noDeposit', true, false)}
                >
                  No Deposit ×
                </button>
              )}
            </div>
            <button className="clear-all-mobile" onClick={onClearAll}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Plan List */}
      <div 
        ref={planListRef}
        className={`plan-list ${viewMode}-view`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Finding best plans...</p>
          </div>
        ) : sortedPlans.length > 0 ? (
          sortedPlans.map((plan) => (
            <div key={plan.id} className="mobile-plan-card">
              {/* Plan Header */}
              <div className="plan-header">
                <div className="provider-info">
                  {plan.provider_logo ? (
                    <img src={plan.provider_logo} alt={plan.provider} className="provider-logo" />
                  ) : (
                    <div className="provider-initial">{plan.provider.charAt(0)}</div>
                  )}
                  <div className="provider-details">
                    <h3 className="provider-name">{plan.provider}</h3>
                    <p className="plan-name">{plan.name}</p>
                  </div>
                </div>
                <div className="plan-rate">
                  <span className="rate-value">{parseFloat(plan.rate).toFixed(2)}¢</span>
                  <span className="rate-unit">per kWh</span>
                </div>
              </div>

              {/* Plan Details */}
              <div className="plan-details">
                <div className="detail-row">
                  <span className="detail-label">Contract:</span>
                  <span className="detail-value">{plan.term_months} months, {plan.rate_type} rate</span>
                </div>
                
                {plan.percent_green > 0 && (
                  <div className="detail-row green">
                    <span className="detail-label">Green Energy:</span>
                    <span className="detail-value">{plan.percent_green}%</span>
                  </div>
                )}

                {viewMode === 'card' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Monthly (1000 kWh):</span>
                      <span className="detail-value">${plan.total_1000kwh || 'N/A'}</span>
                    </div>
                    
                    {plan.bill_credit && plan.bill_credit > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Bill Credit:</span>
                        <span className="detail-value">${plan.bill_credit}/month</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Plan Badges */}
              <div className="plan-badges">
                {plan.is_pre_pay && <span className="badge prepaid">Prepaid</span>}
                {!plan.deposit_required && <span className="badge no-deposit">No Deposit</span>}
                {plan.satisfaction_guarantee && <span className="badge guarantee">Satisfaction Guarantee</span>}
              </div>

              {/* Action Button */}
              <button className="enroll-button">
                View Details & Enroll
              </button>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">No Results</div>
            <h3>No Plans Found</h3>
            <p>Try adjusting your filters to see more options.</p>
            <button onClick={onClearAll} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="filter-modal-overlay">
          <div ref={filterModalRef} className="filter-modal">
            {/* Modal Header */}
            <div className="modal-header">
              <h3>Filter Plans</h3>
              <button
                className="close-button"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            {/* Filter Sections */}
            <div className="filter-sections">
              {/* Quick Filters */}
              <div className="filter-section">
                <h4>Quick Filters</h4>
                <div className="quick-filter-grid">
                  <button
                    className={`quick-filter ${currentFilters.greenEnergy ? 'active' : ''}`}
                    onClick={() => onFilterChange('greenEnergy', true, !currentFilters.greenEnergy)}
                  >
                    100% Green
                  </button>
                  <button
                    className={`quick-filter ${currentFilters.noDeposit ? 'active' : ''}`}
                    onClick={() => onFilterChange('noDeposit', true, !currentFilters.noDeposit)}
                  >
                    No Deposit
                  </button>
                  <button
                    className={`quick-filter ${currentFilters.rateType === 'fixed' ? 'active' : ''}`}
                    onClick={() => onFilterChange('rateType', 'fixed', currentFilters.rateType !== 'fixed')}
                  >
                    Fixed Rate
                  </button>
                  <button
                    className={`quick-filter ${currentFilters.prePaid ? 'active' : ''}`}
                    onClick={() => onFilterChange('prePaid', true, !currentFilters.prePaid)}
                  >
                    Prepaid
                  </button>
                </div>
              </div>

              {/* Contract Length */}
              <div className="filter-section">
                <button
                  className="section-header"
                  onClick={() => setActiveSection(activeSection === 'contract' ? null : 'contract')}
                >
                  <span>Contract Length</span>
                  <span className={`arrow ${activeSection === 'contract' ? 'up' : 'down'}`}>▼</span>
                </button>
                {activeSection === 'contract' && (
                  <div className="section-content">
                    {availableFacets?.contractLengths.map(facet => (
                      <label key={facet.value} className="filter-option">
                        <input
                          type="checkbox"
                          checked={currentFilters.contractLength?.includes(parseInt(facet.value)) || false}
                          onChange={(e) => onFilterChange('contractLength', parseInt(facet.value), e.target.checked)}
                        />
                        <span>{facet.label} ({facet.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Rate Type */}
              <div className="filter-section">
                <button
                  className="section-header"
                  onClick={() => setActiveSection(activeSection === 'rateType' ? null : 'rateType')}
                >
                  <span>Rate Type</span>
                  <span className={`arrow ${activeSection === 'rateType' ? 'up' : 'down'}`}>▼</span>
                </button>
                {activeSection === 'rateType' && (
                  <div className="section-content">
                    {availableFacets?.rateTypes.map(facet => (
                      <label key={facet.value} className="filter-option">
                        <input
                          type="radio"
                          name="rateType"
                          checked={currentFilters.rateType === facet.value}
                          onChange={(e) => onFilterChange('rateType', facet.value, e.target.checked)}
                        />
                        <span>{facet.label} ({facet.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Providers */}
              {availableFacets?.providers && availableFacets.providers.length > 0 && (
                <div className="filter-section">
                  <button
                    className="section-header"
                    onClick={() => setActiveSection(activeSection === 'providers' ? null : 'providers')}
                  >
                    <span>Providers</span>
                    <span className={`arrow ${activeSection === 'providers' ? 'up' : 'down'}`}>▼</span>
                  </button>
                  {activeSection === 'providers' && (
                    <div className="section-content">
                      {availableFacets.providers.slice(0, 8).map(facet => (
                        <label key={facet.value} className="filter-option">
                          <input
                            type="checkbox"
                            checked={currentFilters.providers?.includes(facet.value) || false}
                            onChange={(e) => onFilterChange('providers', facet.value, e.target.checked)}
                          />
                          <span>{facet.label} ({facet.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                className="clear-button"
                onClick={() => {
                  onClearAll();
                  setShowFilters(false);
                }}
              >
                Clear All
              </button>
              <button
                className="apply-button"
                onClick={() => setShowFilters(false)}
              >
                Show {plans.length} Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFacetedSearch;

// Mobile-optimized styles
const styles = `
.mobile-faceted-search {
  width: 100%;
  padding: 0;
}

.search-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.view-toggle {
  background: #f3f4f6;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 1.125rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-toggle:hover {
  background: #e5e7eb;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #002768;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  min-height: 44px; /* Touch target */
}

.filter-button:hover {
  background: #1e40af;
}

.filter-icon {
  font-size: 1rem;
}

.filter-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #be0b31;
  color: white;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.sort-select {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  min-width: 120px;
  min-height: 44px;
}

.active-filters-bar {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.active-filters-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 0.25rem;
}

.filter-chip {
  background: #002768;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filter-chip:hover {
  background: #1e40af;
}

.clear-all-mobile {
  background: #be0b31;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  min-height: 44px;
}

.plan-list {
  padding: 1rem;
}

.plan-list.card-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-list.compact-view .mobile-plan-card {
  padding: 0.75rem;
}

.mobile-plan-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.mobile-plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.provider-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.provider-initial {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #6b7280;
}

.provider-details {
  flex: 1;
  min-width: 0;
}

.provider-name {
  font-weight: 600;
  color: #111827;
  margin: 0;
  font-size: 1rem;
}

.plan-name {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-rate {
  text-align: right;
}

.rate-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #002768;
  display: block;
}

.rate-unit {
  font-size: 0.75rem;
  color: #6b7280;
}

.plan-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.detail-row.green {
  color: #059669;
  font-weight: 500;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  color: #111827;
  font-weight: 500;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.prepaid {
  background: #dbeafe;
  color: #1e40af;
}

.badge.no-deposit {
  background: #dcfce7;
  color: #166534;
}

.badge.guarantee {
  background: #fef3c7;
  color: #92400e;
}

.enroll-button {
  width: 100%;
  background: #be0b31;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;
}

.enroll-button:hover {
  background: #a00922;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #002768;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-results h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.no-results p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.clear-filters-btn {
  background: #002768;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  display: flex;
  align-items: flex-end;
}

.filter-modal {
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 1rem 1rem 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem;
  min-height: 44px;
  min-width: 44px;
}

.filter-sections {
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem 0;
}

.filter-section {
  border-bottom: 1px solid #f3f4f6;
}

.filter-section:first-child {
  border-top: none;
}

.filter-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
  padding: 0 1.5rem;
}

.quick-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
}

.quick-filter {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.quick-filter:hover {
  border-color: #002768;
  background: #f0f7ff;
}

.quick-filter.active {
  background: #002768;
  border-color: #002768;
  color: white;
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;
}

.section-header:hover {
  background: #f9fafb;
}

.arrow {
  color: #6b7280;
  transition: transform 0.2s;
}

.arrow.up {
  transform: rotate(180deg);
}

.section-content {
  padding: 0 1.5rem 1rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  cursor: pointer;
  font-size: 0.875rem;
  color: #111827;
  transition: color 0.2s;
  min-height: 44px;
}

.filter-option:hover {
  color: #002768;
}

.filter-option input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: #002768;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.clear-button {
  flex: 1;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.apply-button {
  flex: 2;
  background: #002768;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .filter-modal {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .mobile-plan-card {
    border-width: 2px;
  }
  
  .filter-button {
    border: 2px solid white;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('mobile-faceted-search-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mobile-faceted-search-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}