/**
 * EnhancedFacetedSidebar Component
 * Advanced filtering sidebar with real-time counts and API integration
 * Supports mobile optimization and accessibility
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FacetedSidebarProps, FacetValue } from '../../types/facets';

const EnhancedFacetedSidebar: React.FC<FacetedSidebarProps> = ({
  currentFilters,
  availableFacets,
  facetCounts,
  onFilterChange,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['contractLengths', 'rateTypes'])
  );
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Toggle group expansion
  const toggleGroup = useCallback((groupType: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupType)) {
        newSet.delete(groupType);
      } else {
        newSet.add(groupType);
      }
      return newSet;
    });
  }, []);

  // Filter facets based on search term
  const filterFacets = useCallback((facets: FacetValue[], searchTerm: string) => {
    if (!searchTerm) return facets;
    return facets.filter(facet => 
      facet.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facet.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((groupType: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [groupType]: value }));
  }, []);

  // Clear all active filters
  const clearAllFilters = useCallback(() => {
    // Clear each filter type
    Object.keys(currentFilters).forEach(filterType => {
      if (Array.isArray(currentFilters[filterType as keyof typeof currentFilters])) {
        const arrayValue = currentFilters[filterType as keyof typeof currentFilters] as any[];
        arrayValue.forEach(value => {
          onFilterChange(filterType, value, false);
        });
      } else {
        onFilterChange(filterType, currentFilters[filterType as keyof typeof currentFilters], false);
      }
    });
  }, [currentFilters, onFilterChange]);

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

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeFilterCount = getActiveFilterCount();

  // Facet groups configuration
  const facetGroups = [
    {
      key: 'contractLengths',
      label: 'Contract Length',
      icon: '📅',
      facets: availableFacets?.contractLengths || [],
      searchable: false,
      renderFacet: (facet: FacetValue) => (
        <label key={facet.value} className="facet-option">
          <input
            type="checkbox"
            checked={currentFilters.contractLength?.includes(parseInt(facet.value)) || false}
            onChange={(e) => onFilterChange('contractLength', parseInt(facet.value), e.target.checked)}
            className="facet-checkbox"
            disabled={loading}
          />
          <span className="facet-label">
            {facet.label}
            <span className="facet-count">({facetCounts.contractLengths?.[facet.value] || facet.count})</span>
          </span>
        </label>
      )
    },
    {
      key: 'rateTypes',
      label: 'Rate Type',
      icon: '📊',
      facets: availableFacets?.rateTypes || [],
      searchable: false,
      renderFacet: (facet: FacetValue) => (
        <label key={facet.value} className="facet-option">
          <input
            type="radio"
            name="rateType"
            checked={currentFilters.rateType === facet.value}
            onChange={(e) => onFilterChange('rateType', facet.value, e.target.checked)}
            className="facet-checkbox"
            disabled={loading}
          />
          <span className="facet-label">
            {facet.label}
            <span className="facet-count">({facetCounts.rateTypes?.[facet.value] || facet.count})</span>
          </span>
          {facet.description && (
            <span className="facet-description">{facet.description}</span>
          )}
        </label>
      )
    },
    {
      key: 'greenEnergyLevels',
      label: 'Green Energy',
      icon: '🌱',
      facets: availableFacets?.greenEnergyLevels || [],
      searchable: false,
      renderFacet: (facet: FacetValue) => (
        <label key={facet.value} className="facet-option">
          <input
            type="checkbox"
            checked={currentFilters.greenEnergy === (facet.value === '100')}
            onChange={(e) => onFilterChange('greenEnergy', facet.value === '100', e.target.checked)}
            className="facet-checkbox"
            disabled={loading}
          />
          <span className="facet-label">
            {facet.label}
            <span className="facet-count">({facetCounts.greenEnergyLevels?.[facet.value] || facet.count})</span>
          </span>
        </label>
      )
    },
    {
      key: 'providers',
      label: 'Providers',
      icon: '⚡',
      facets: availableFacets?.providers || [],
      searchable: true,
      renderFacet: (facet: FacetValue) => (
        <label key={facet.value} className="facet-option">
          <input
            type="checkbox"
            checked={currentFilters.providers?.includes(facet.value) || false}
            onChange={(e) => onFilterChange('providers', facet.value, e.target.checked)}
            className="facet-checkbox"
            disabled={loading}
          />
          <span className="facet-label">
            {facet.label}
            <span className="facet-count">({facetCounts.providers?.[facet.value] || facet.count})</span>
          </span>
        </label>
      )
    },
    {
      key: 'features',
      label: 'Plan Features',
      icon: '✨',
      facets: [
        ...availableFacets?.features || [],
        // Add standard feature filters
        { value: 'prepaid', label: 'Prepaid Plans', count: 0, selected: false },
        { value: 'no-deposit', label: 'No Deposit Required', count: 0, selected: false }
      ],
      searchable: false,
      renderFacet: (facet: FacetValue) => {
        let checked = false;
        let onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

        if (facet.value === 'prepaid') {
          checked = currentFilters.prePaid || false;
          onChange = (e) => onFilterChange('prePaid', true, e.target.checked);
        } else if (facet.value === 'no-deposit') {
          checked = currentFilters.noDeposit || false;
          onChange = (e) => onFilterChange('noDeposit', true, e.target.checked);
        } else {
          checked = currentFilters.features?.includes(facet.value) || false;
          onChange = (e) => onFilterChange('features', facet.value, e.target.checked);
        }

        return (
          <label key={facet.value} className="facet-option">
            <input
              type="checkbox"
              checked={checked}
              onChange={onChange}
              className="facet-checkbox"
              disabled={loading}
            />
            <span className="facet-label">
              {facet.label}
              <span className="facet-count">
                ({facetCounts.features?.[facet.value] || facet.count})
              </span>
            </span>
            {facet.description && (
              <span className="facet-description">{facet.description}</span>
            )}
          </label>
        );
      }
    },
    {
      key: 'priceRanges',
      label: 'Price Range',
      icon: '💰',
      facets: availableFacets?.priceRanges || [],
      searchable: false,
      renderFacet: (facet: FacetValue) => (
        <label key={facet.value} className="facet-option">
          <input
            type="radio"
            name="priceRange"
            checked={currentFilters.priceRange === facet.value}
            onChange={(e) => onFilterChange('priceRange', facet.value, e.target.checked)}
            className="facet-checkbox"
            disabled={loading}
          />
          <span className="facet-label">
            {facet.label}
            <span className="facet-count">({facetCounts.priceRanges?.[facet.value] || facet.count})</span>
          </span>
        </label>
      )
    }
  ].filter(group => group.facets.length > 0);

  return (
    <div className="enhanced-faceted-sidebar">
      {/* Mobile Toggle */}
      <button 
        className="mobile-toggle lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle filters"
      >
        <span className="toggle-icon">🔍</span>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
      </button>

      {/* Sidebar Content */}
      <div className={`sidebar-content ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <span>Filter Plans</span>
            {loading && <div className="loading-indicator"></div>}
          </h3>
          {activeFilterCount > 0 && (
            <button 
              className="clear-all-btn"
              onClick={clearAllFilters}
              disabled={loading}
            >
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <h4 className="quick-filters-title">Quick Filters</h4>
          <div className="quick-filter-buttons">
            <button 
              className={`quick-filter-btn ${currentFilters.greenEnergy ? 'active' : ''}`}
              onClick={() => onFilterChange('greenEnergy', true, !currentFilters.greenEnergy)}
              disabled={loading}
            >
              🌱 100% Green
            </button>
            <button 
              className={`quick-filter-btn ${currentFilters.noDeposit ? 'active' : ''}`}
              onClick={() => onFilterChange('noDeposit', true, !currentFilters.noDeposit)}
              disabled={loading}
            >
              ✅ No Deposit
            </button>
            <button 
              className={`quick-filter-btn ${currentFilters.rateType === 'fixed' ? 'active' : ''}`}
              onClick={() => onFilterChange('rateType', 'fixed', currentFilters.rateType !== 'fixed')}
              disabled={loading}
            >
              📌 Fixed Rate
            </button>
          </div>
        </div>

        {/* Facet Groups */}
        <div className="facet-groups">
          {facetGroups.map(group => {
            const filteredFacets = filterFacets(group.facets, searchTerms[group.key] || '');
            
            return (
              <div key={group.key} className="facet-group">
                <button
                  className="group-header"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={expandedGroups.has(group.key)}
                >
                  <div className="group-header-content">
                    <span className="group-icon">{group.icon}</span>
                    <h4 className="group-title">{group.label}</h4>
                  </div>
                  <span className={`expand-icon ${expandedGroups.has(group.key) ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>

                {expandedGroups.has(group.key) && (
                  <div className="facet-list">
                    {group.searchable && group.facets.length > 5 && (
                      <div className="facet-search">
                        <input
                          type="text"
                          placeholder={`Search ${group.label.toLowerCase()}...`}
                          value={searchTerms[group.key] || ''}
                          onChange={(e) => handleSearchChange(group.key, e.target.value)}
                          className="search-input"
                          disabled={loading}
                        />
                      </div>
                    )}
                    
                    <div className="facets-container">
                      {filteredFacets.map(facet => group.renderFacet(facet))}
                    </div>

                    {filteredFacets.length === 0 && searchTerms[group.key] && (
                      <div className="no-facets-message">
                        No {group.label.toLowerCase()} found matching "{searchTerms[group.key]}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="help-text">
            Select multiple filters to narrow down your search. 
            All prices shown include delivery charges.
          </p>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="mobile-overlay lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default EnhancedFacetedSidebar;

// Enhanced styles
const styles = `
.enhanced-faceted-sidebar {
  position: relative;
}

.mobile-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.mobile-toggle:hover {
  border-color: #002768;
  background: #f8fafc;
}

.toggle-icon {
  font-size: 1.25rem;
}

.filter-badge {
  background: #002768;
  color: white;
  border-radius: 50%;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
  min-width: 1.5rem;
  text-align: center;
}

.sidebar-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile styles */
@media (max-width: 1023px) {
  .sidebar-content {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 360px;
    max-width: 90vw;
    z-index: 50;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
    border-radius: 0;
    border-right: none;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
  }

  .sidebar-content.open {
    transform: translateX(0);
  }
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 40;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.loading-indicator {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top-color: #002768;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.clear-all-btn {
  background: #be0b31;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-all-btn:hover:not(:disabled) {
  background: #a00922;
}

.clear-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-filters {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
}

.quick-filters-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.quick-filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-filter-btn {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-filter-btn:hover:not(:disabled) {
  border-color: #002768;
  background: #f0f7ff;
}

.quick-filter-btn.active {
  background: #002768;
  border-color: #002768;
  color: white;
}

.quick-filter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.facet-groups {
  max-height: 65vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.facet-groups::-webkit-scrollbar {
  width: 6px;
}

.facet-groups::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.facet-groups::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.facet-groups::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.facet-group {
  border-bottom: 1px solid #e5e7eb;
}

.facet-group:last-child {
  border-bottom: none;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 1.25rem;
  background: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background: #f9fafb;
}

.group-header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-icon {
  font-size: 1.125rem;
}

.group-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.expand-icon {
  color: #6b7280;
  transition: transform 0.2s;
  font-size: 0.75rem;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.facet-list {
  background: #fafbfc;
}

.facet-search {
  padding: 1rem 1.25rem 0.5rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #002768;
  box-shadow: 0 0 0 3px rgba(0, 39, 104, 0.1);
}

.search-input:disabled {
  background: #f3f4f6;
  opacity: 0.6;
}

.facets-container {
  padding: 0.5rem 1.25rem 1rem;
  max-height: 250px;
  overflow-y: auto;
}

.facet-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0;
  cursor: pointer;
  transition: color 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.facet-option:last-child {
  border-bottom: none;
}

.facet-option:hover {
  color: #002768;
}

.facet-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #002768;
  margin-right: 0.75rem;
}

.facet-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.facet-count {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: normal;
}

.facet-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 1.75rem;
  line-height: 1.4;
}

.no-facets-message {
  padding: 1rem 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* Accessibility improvements */
.group-header:focus,
.quick-filter-btn:focus,
.clear-all-btn:focus,
.mobile-toggle:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}

.facet-option:focus-within {
  background: rgba(0, 39, 104, 0.05);
  border-radius: 0.375rem;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .sidebar-content {
    border-width: 2px;
  }
  
  .facet-option:hover {
    background: #000;
    color: #fff;
  }
  
  .facet-checkbox {
    border: 2px solid #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .enhanced-faceted-sidebar {
    display: none;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('enhanced-faceted-sidebar-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'enhanced-faceted-sidebar-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}