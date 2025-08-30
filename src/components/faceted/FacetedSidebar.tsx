/**
 * FacetedSidebar React Component
 * Interactive filter sidebar for faceted navigation pages
 * Handles client-side filtering and URL updates
 */

import { useState, useEffect } from 'react';
import type { FacetedSidebarProps, AvailableFilter } from '../../types/facets';
import { addFilterToUrl, removeFilterFromUrl } from '../../lib/faceted/url-parser';

interface FilterGroup {
  type: string;
  label: string;
  filters: AvailableFilter[];
}

const FacetedSidebar: React.FC<FacetedSidebarProps> = ({
  currentFilters,
  availableFilters,
  planCounts
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['term', 'plan_features']));

  // Group filters by category
  const filterGroups: FilterGroup[] = [
    {
      type: 'term',
      label: 'How long do you want to commit?',
      filters: availableFilters.filter(f => f.type === 'term')
    },
    {
      type: 'rate_type', 
      label: 'How should your rate work?',
      filters: availableFilters.filter(f => f.type === 'rate_type')
    },
    {
      type: 'green_energy',
      label: 'Want clean energy?',
      filters: availableFilters.filter(f => f.type === 'green_energy')
    },
    {
      type: 'plan_features',
      label: 'Any special features?',
      filters: availableFilters.filter(f => f.type === 'plan_features')
    }
  ].filter(group => group.filters.length > 0);

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterChange = (filter: AvailableFilter, isChecked: boolean) => {
    const currentPath = window.location.pathname;
    let newUrl: string;

    if (isChecked) {
      newUrl = addFilterToUrl(currentPath, filter.value);
    } else {
      newUrl = removeFilterFromUrl(currentPath, filter.value);
    }

    // Track filter interaction
    if (typeof gtag !== 'undefined') {
      gtag('event', 'filter_interaction', {
        action: isChecked ? 'add' : 'remove',
        filter_type: filter.value,
        result_count: filter.count,
        page_url: currentPath,
      });
    }

    // Navigate to new URL
    window.history.pushState({}, '', newUrl);
    window.location.reload(); // Force reload to update server-rendered content
  };

  const clearAllFilters = () => {
    const pathParts = window.location.pathname.split('/');
    const cityIndex = pathParts.findIndex(part => part === 'electricity-plans') - 1;
    if (cityIndex >= 0) {
      const city = pathParts[cityIndex];
      const cityUrl = `/texas/${city}/electricity-plans`;
      window.history.pushState({}, '', cityUrl);
      window.location.reload();
    }
  };

  // Mobile responsive behavior
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

  return (
    <div className="faceted-sidebar">
      {/* Mobile toggle button */}
      <button 
        className="mobile-toggle lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Show filter options"
      >
        <span className="icon">⚙️</span>
        <span>Find What Fits</span>
        {currentFilters.length > 0 && (
          <span className="filter-count">{currentFilters.length}</span>
        )}
      </button>

      {/* Sidebar content */}
      <div className={`sidebar-content ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <h3 className="sidebar-title">What Matters to You?</h3>
          {currentFilters.length > 0 && (
            <button 
              className="clear-all-btn"
              onClick={clearAllFilters}
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Active filters */}
        {currentFilters.length > 0 && (
          <div className="active-filters">
            <h4 className="active-filters-title">You're looking for:</h4>
            <div className="active-filter-tags">
              {currentFilters.map(filter => {
                const filterObj = availableFilters.find(f => f.value === filter);
                return (
                  <button
                    key={filter}
                    className="filter-tag"
                    onClick={() => filterObj && handleFilterChange(filterObj, false)}
                    aria-label={`Stop filtering by ${filterObj?.label}`}
                  >
                    <span>{filterObj?.label || filter}</span>
                    <span className="remove-icon">×</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter groups */}
        <div className="filter-groups">
          {filterGroups.map(group => (
            <div key={group.type} className="filter-group">
              <button
                className="group-header"
                onClick={() => toggleGroup(group.type)}
                aria-expanded={expandedGroups.has(group.type)}
              >
                <h4 className="group-title">{group.label}</h4>
                <span className={`expand-icon ${expandedGroups.has(group.type) ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>

              {expandedGroups.has(group.type) && (
                <div className="filter-list">
                  {group.filters.map(filter => {
                    const isActive = currentFilters.includes(filter.value);
                    return (
                      <label
                        key={filter.value}
                        className={`filter-option ${isActive ? 'active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => handleFilterChange(filter, e.target.checked)}
                          className="filter-checkbox"
                        />
                        <span className="filter-label">
                          {filter.label}
                          <span className="filter-count">({filter.count})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help text */}
        <div className="sidebar-footer">
          <p className="help-text">
            Pick what's important to you. All prices include delivery and taxes—no surprises. We only show plans that actually work in your area.
          </p>
        </div>
      </div>

      {/* Mobile overlay */}
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

export default FacetedSidebar;

// Styles (using CSS modules approach or add to global CSS)
const styles = `
.faceted-sidebar {
  position: relative;
}

.mobile-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.mobile-toggle:hover {
  background: #f9fafb;
}

.filter-count {
  background: #002768;
  color: white;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

.sidebar-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Mobile styles */
@media (max-width: 1023px) {
  .sidebar-content {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    max-width: 85vw;
    z-index: 50;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    border-radius: 0;
    border-right: none;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar-content.open {
    transform: translateX(0);
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .sidebar-content {
    position: sticky;
    top: 2rem;
  }
}

.sidebar-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.clear-all-btn {
  color: #002768;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: underline;
}

.clear-all-btn:hover {
  color: #be0b31;
}

.active-filters {
  padding: 1rem;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.active-filters-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.active-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #be0b31;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.filter-tag:hover {
  background: #a00922;
}

.remove-icon {
  font-weight: bold;
  margin-left: 0.25rem;
}

.filter-groups {
  max-height: 60vh;
  overflow-y: auto;
}

.filter-group {
  border-bottom: 1px solid #e5e7eb;
}

.group-header {
  display: flex;
  justify-content: between;
  align-items: center;
  width: 100%;
  padding: 1rem;
  text-align: left;
  background: white;
  transition: background-color 0.2s;
}

.group-header:hover {
  background: #f9fafb;
}

.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.expand-icon {
  color: #6b7280;
  transition: transform 0.2s;
  font-size: 0.75rem;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.filter-list {
  padding: 0 1rem 1rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s;
}

.filter-option:hover {
  color: #002768;
}

.filter-option.active {
  color: #002768;
  font-weight: 500;
}

.filter-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #002768;
}

.filter-label {
  flex: 1;
  display: flex;
  justify-content: between;
  align-items: center;
  font-size: 0.875rem;
}

.filter-count {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: normal;
}

.sidebar-footer {
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .sidebar-content {
    border-width: 3px;
  }
  
  .filter-option:hover {
    background: #000;
    color: #fff;
  }
  
  .checkbox-custom {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .sidebar-content {
    transition: none;
  }
  
  .filter-list-container {
    transition: none;
  }
}

/* Focus styles for accessibility */
.filter-option:focus-within,
.group-header:focus,
.preset-btn:focus,
.mobile-toggle:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}

/* Dark mode support (if enabled) */
@media (prefers-color-scheme: dark) {
  .sidebar-content {
    background: #1e293b;
    color: #f1f5f9;
    border-color: #374151;
  }
  
  .group-header {
    background: #1e293b;
    color: #f1f5f9;
  }
  
  .group-header:hover {
    background: #334155;
  }
  
  .filter-option {
    color: #e2e8f0;
  }
  
  .checkbox-custom {
    background: #374151;
    border-color: #64748b;
  }
  
  .search-input {
    background: #374151;
    border-color: #64748b;
    color: #f1f5f9;
  }
}
`;

// Inject enhanced styles with better performance
if (typeof document !== 'undefined') {
  // Check if styles are already injected to avoid duplicates
  const existingStyle = document.getElementById('faceted-sidebar-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'faceted-sidebar-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}