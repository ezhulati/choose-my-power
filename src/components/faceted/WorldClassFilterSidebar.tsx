/**
 * World-Class Filter Sidebar Component
 * Based on industry leader analysis (Amazon, Booking.com, Airbnb, Zillow)
 * Professional hierarchical filtering with proper UX patterns
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ChevronDown as ChevronDownIcon, 
  ChevronRight as ChevronRightIcon, 
  X as XIcon,
  Calendar as CalendarIcon,
  Zap as ZapIcon,
  Leaf as LeafIcon,
  Sparkles as SparklesIcon,
  Users as UsersIcon,
  Clock as ClockIcon
} from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  description?: string;
  popular?: boolean;
  recommended?: boolean;
  disabled?: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'checkbox' | 'radio';
  expanded: boolean;
  priority: number;
  options: FilterOption[];
}

interface WorldClassFilterSidebarProps {
  currentFilters: Record<string, unknown>;
  onFilterChange: (filterId: string, value: string, checked: boolean) => void;
  totalResults: number;
  loading?: boolean;
}

const WorldClassFilterSidebar: React.FC<WorldClassFilterSidebarProps> = ({
  currentFilters,
  onFilterChange,
  totalResults,
  loading = false
}) => {
  // Smart defaults - expand high-priority sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['contract-length', 'rate-type', 'green-energy'])
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Industry-standard filter sections with proper hierarchy
  const filterSections: FilterSection[] = [
    {
      id: 'contract-length',
      title: 'Contract Length',
      description: 'Choose your commitment level',
      icon: <CalendarIcon className="h-4 w-4" />,
      type: 'checkbox',
      expanded: expandedSections.has('contract-length'),
      priority: 1,
      options: [
        { 
          value: '12', 
          label: '12-Month Contract', 
          description: 'Most popular choice',
          popular: true,
          count: 89 
        },
        { 
          value: '24', 
          label: '24-Month Contract', 
          description: 'Better rates',
          recommended: true,
          count: 67 
        },
        { 
          value: '6', 
          label: '6-Month Contract', 
          description: 'Short-term flexibility',
          count: 34 
        },
        { 
          value: '36', 
          label: '36-Month Contract', 
          description: 'Lowest rates',
          count: 23 
        },
        { 
          value: 'month-to-month', 
          label: 'Month-to-Month', 
          description: 'Maximum flexibility',
          count: 12 
        }
      ]
    },
    {
      id: 'rate-type',
      title: 'Rate Structure',
      description: 'How your rate is determined',
      icon: <ZapIcon className="h-4 w-4" />,
      type: 'radio',
      expanded: expandedSections.has('rate-type'),
      priority: 2,
      options: [
        { 
          value: 'fixed', 
          label: 'Fixed Rate', 
          description: 'Same rate all year',
          popular: true,
          count: 156 
        },
        { 
          value: 'variable', 
          label: 'Variable Rate', 
          description: 'Rate can change monthly',
          count: 67 
        },
        { 
          value: 'indexed', 
          label: 'Market Rate', 
          description: 'Follows wholesale prices',
          count: 23 
        }
      ]
    },
    {
      id: 'green-energy',
      title: 'Clean Energy',
      description: 'Environmental impact level',
      icon: <LeafIcon className="h-4 w-4" />,
      type: 'checkbox',
      expanded: expandedSections.has('green-energy'),
      priority: 3,
      options: [
        { 
          value: '100', 
          label: '100% Clean Energy', 
          description: 'Wind & solar power',
          recommended: true,
          count: 89 
        },
        { 
          value: '50', 
          label: '50% Clean Energy', 
          description: 'Mixed sources',
          count: 34 
        },
        { 
          value: '25', 
          label: '25% Clean Energy', 
          description: 'Partial renewable',
          count: 28 
        }
      ]
    },
    {
      id: 'special-features',
      title: 'Plan Features',
      description: 'Benefits and requirements',
      icon: <SparklesIcon className="h-4 w-4" />,
      type: 'checkbox',
      expanded: expandedSections.has('special-features'),
      priority: 4,
      options: [
        { 
          value: 'no-deposit', 
          label: 'No Deposit Required', 
          description: 'Skip security deposit',
          count: 45 
        },
        { 
          value: 'prepaid', 
          label: 'Prepaid Plans', 
          description: 'Pay as you go',
          count: 23 
        },
        { 
          value: 'autopay-discount', 
          label: 'AutoPay Discount', 
          description: 'Save with automatic payments',
          count: 67 
        },
        { 
          value: 'free-weekends', 
          label: 'Free Weekend Power', 
          description: 'No charges Saturday-Sunday',
          count: 18 
        },
        { 
          value: 'bill-credit', 
          label: 'Monthly Bill Credit', 
          description: 'Account credit every month',
          count: 34 
        }
      ]
    },
    {
      id: 'providers',
      title: 'Electricity Company',
      description: 'Filter by provider',
      icon: <UsersIcon className="h-4 w-4" />,
      type: 'checkbox',
      expanded: expandedSections.has('providers'),
      priority: 5,
      options: [
        { value: 'txu-energy', label: 'TXU Energy', count: 45 },
        { value: 'reliant', label: 'Reliant Energy', count: 38 },
        { value: 'green-mountain', label: 'Green Mountain Energy', count: 29 },
        { value: 'discount-power', label: 'Discount Power', count: 31 },
        { value: '4change-energy', label: '4Change Energy', count: 22 },
        { value: 'gexa-energy', label: 'Gexa Energy', count: 18 },
        { value: 'frontier-utilities', label: 'Frontier Utilities', count: 15 }
      ]
    },
    {
      id: 'usage-level',
      title: 'Monthly Usage',
      description: 'Optimize for your consumption',
      icon: <ClockIcon className="h-4 w-4" />,
      type: 'radio',
      expanded: expandedSections.has('usage-level'),
      priority: 6,
      options: [
        { 
          value: '1000', 
          label: 'Average Usage (1000 kWh)', 
          description: 'Typical home',
          popular: true 
        },
        { 
          value: '500', 
          label: 'Low Usage (500 kWh)', 
          description: 'Small apartment/condo' 
        },
        { 
          value: '2000', 
          label: 'High Usage (2000+ kWh)', 
          description: 'Large home' 
        }
      ]
    }
  ];

  // Calculate active filters count
  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(currentFilters).forEach(key => {
      const value = currentFilters[key];
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value) {
        count += 1;
      }
    });
    return count;
  };

  const clearAllFilters = () => {
    Object.keys(currentFilters).forEach(filterId => {
      const value = currentFilters[filterId];
      if (Array.isArray(value)) {
        value.forEach(v => onFilterChange(filterId, v, false));
      } else if (value) {
        onFilterChange(filterId, value, false);
      }
    });
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="world-class-filter-sidebar">
      {/* Premium Header */}
      <div className="filter-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="header-title">Refine Your Search</h2>
            <p className="header-subtitle">Find plans that match your needs perfectly</p>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="clear-all-btn"
              disabled={loading}
            >
              <XIcon className="h-3 w-3 mr-1" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
        
        {/* Results Counter */}
        <div className="results-counter">
          <div className="results-number">{totalResults.toLocaleString()}</div>
          <div className="results-label">plans match your criteria</div>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFilterCount > 0 && (
        <div className="active-filters-section">
          <h3 className="active-filters-title">Applied Filters</h3>
          <div className="active-filters-pills">
            {Object.entries(currentFilters).map(([filterId, value]) => {
              if (!value) return null;
              
              const values = Array.isArray(value) ? value : [value];
              return values.map(v => {
                const section = filterSections.find(s => s.id === filterId);
                const option = section?.options.find(o => o.value === v);
                if (!option) return null;
                
                return (
                  <Badge
                    key={`${filterId}-${v}`}
                    className="active-filter-pill"
                  >
                    {option.label}
                    <button
                      onClick={() => onFilterChange(filterId, v, false)}
                      className="pill-remove-btn"
                      aria-label={`Remove ${option.label} filter`}
                    >
                      ×
                    </button>
                  </Badge>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="filter-sections">
        {filterSections
          .sort((a, b) => a.priority - b.priority)
          .map((section) => (
            <div key={section.id} className="filter-section">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="section-header group"
                aria-expanded={section.expanded}
              >
                <div className="section-header-left">
                  <div className="section-icon">{section.icon}</div>
                  <div className="section-text">
                    <h3 className="section-title">{section.title}</h3>
                    <p className="section-description">{section.description}</p>
                  </div>
                </div>
                <div className="section-toggle">
                  {section.expanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {section.expanded && (
                <div className="section-content">
                  <div className="filter-options">
                    {section.options.map((option) => {
                      const isChecked = section.type === 'radio' 
                        ? currentFilters[section.id] === option.value
                        : Array.isArray(currentFilters[section.id]) 
                          ? currentFilters[section.id]?.includes(option.value)
                          : false;

                      return (
                        <label
                          key={option.value}
                          className={`filter-option group ${option.disabled ? 'disabled' : ''}`}
                        >
                          <div className="option-input">
                            <input
                              type={section.type}
                              name={section.id}
                              value={option.value}
                              checked={isChecked}
                              disabled={option.disabled || loading}
                              onChange={(e) => {
                                onFilterChange(section.id, option.value, e.target.checked);
                              }}
                              className="filter-checkbox"
                            />
                          </div>
                          
                          <div className="option-content">
                            <div className="option-main">
                              <div className="option-label-row">
                                <span className="option-label">{option.label}</span>
                                <div className="option-badges">
                                  {option.popular && (
                                    <Badge className="popular-badge">Popular</Badge>
                                  )}
                                  {option.recommended && (
                                    <Badge className="recommended-badge">Best Value</Badge>
                                  )}
                                  {option.count && (
                                    <span className="option-count">({option.count})</span>
                                  )}
                                </div>
                              </div>
                              {option.description && (
                                <p className="option-description">{option.description}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Help Section */}
      <div className="help-section">
        <div className="help-content">
          <h4 className="help-title">Need Help Choosing?</h4>
          <p className="help-text">
            Not sure which options are right for you? Our Texas electricity experts are here to help.
          </p>
          <Button className="help-btn" size="sm">
            Get Expert Advice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorldClassFilterSidebar;