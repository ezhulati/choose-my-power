/**
 * FilterBreadcrumb Component
 * Shows applied filters with breadcrumb navigation and removal options
 * Provides clear visual indication of the current filter state
 */

import React from 'react';
import type { FilterState } from '../../types/facets';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface FilterBreadcrumbProps {
  filters: FilterState;
  citySlug: string;
  cityName: string;
  onRemoveFilter: (filterType: string, value: unknown, checked: boolean) => void;
  onClearAll: () => void;
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  type: string;
  value: unknown;
  url: string;
  removable: boolean;
}

const FilterBreadcrumb: React.FC<FilterBreadcrumbProps> = ({
  filters,
  citySlug,
  cityName,
  onRemoveFilter,
  onClearAll,
  className = ''
}) => {
  // Build breadcrumb items from current filters
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      type: 'navigation',
      value: null,
      url: '/',
      removable: false
    },
    {
      label: 'Texas Electricity',
      type: 'navigation',
      value: null,
      url: '/texas',
      removable: false
    },
    {
      label: `${cityName} Plans`,
      type: 'navigation',
      value: null,
      url: `/electricity-plans/${citySlug}`,
      removable: false
    }
  ];

  // Add filter breadcrumbs
  if (filters.contractLength?.length) {
    filters.contractLength.forEach(length => {
      breadcrumbItems.push({
        label: `${length} Month`,
        type: 'contractLength',
        value: length,
        url: buildRemoveFilterUrl(citySlug, 'contractLength', length, filters),
        removable: true
      });
    });
  }

  if (filters.rateType) {
    breadcrumbItems.push({
      label: filters.rateType === 'fixed' ? 'Fixed Rate' : 'Variable Rate',
      type: 'rateType',
      value: filters.rateType,
      url: buildRemoveFilterUrl(citySlug, 'rateType', filters.rateType, filters),
      removable: true
    });
  }

  if (filters.greenEnergy) {
    breadcrumbItems.push({
      label: 'Green Energy',
      type: 'greenEnergy',
      value: true,
      url: buildRemoveFilterUrl(citySlug, 'greenEnergy', true, filters),
      removable: true
    });
  }

  if (filters.prePaid) {
    breadcrumbItems.push({
      label: 'Prepaid',
      type: 'prePaid',
      value: true,
      url: buildRemoveFilterUrl(citySlug, 'prePaid', true, filters),
      removable: true
    });
  }

  if (filters.noDeposit) {
    breadcrumbItems.push({
      label: 'No Deposit',
      type: 'noDeposit',
      value: true,
      url: buildRemoveFilterUrl(citySlug, 'noDeposit', true, filters),
      removable: true
    });
  }

  if (filters.providers?.length) {
    filters.providers.forEach(provider => {
      breadcrumbItems.push({
        label: formatProviderName(provider),
        type: 'providers',
        value: provider,
        url: buildRemoveFilterUrl(citySlug, 'providers', provider, filters),
        removable: true
      });
    });
  }

  if (filters.features?.length) {
    filters.features.forEach(feature => {
      breadcrumbItems.push({
        label: formatFeatureName(feature),
        type: 'features',
        value: feature,
        url: buildRemoveFilterUrl(citySlug, 'features', feature, filters),
        removable: true
      });
    });
  }

  if (filters.priceRange) {
    breadcrumbItems.push({
      label: formatPriceRange(filters.priceRange),
      type: 'priceRange',
      value: filters.priceRange,
      url: buildRemoveFilterUrl(citySlug, 'priceRange', filters.priceRange, filters),
      removable: true
    });
  }

  const hasActiveFilters = breadcrumbItems.some(item => item.removable);

  if (breadcrumbItems.length <= 3) {
    // No filters applied, don't render breadcrumbs
    return null;
  }

  return (
    <nav className={`filter-breadcrumb ${className}`} aria-label="Filter breadcrumb">
      <div className="breadcrumb-container">
        {/* Breadcrumb Path */}
        <ol className="breadcrumb-list">
          {breadcrumbItems.map((item, index) => (
            <li key={`${item.type}-${item.value || index}`} className="breadcrumb-item">
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              )}
              
              {item.removable ? (
                <Badge
                  variant="texas-primary"
                  className="cursor-pointer hover:opacity-80 pr-1 min-h-[48px] px-4 py-3 touch-manipulation inline-flex items-center"
                  onClick={() => onRemoveFilter(item.type, item.value, false)}
                  aria-label={`Remove ${item.label} filter`}
                  title={`Remove ${item.label} filter`}
                >
                  <span className="mr-2">{item.label}</span>
                  <span className="hover:bg-white/20 rounded-full px-1" aria-hidden="true">×</span>
                </Badge>
              ) : (
                <a
                  href={item.url}
                  className="breadcrumb-link"
                  aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ol>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="destructive"
            size="default"
            onClick={onClearAll}
            className="min-h-[48px] touch-manipulation"
            aria-label="Clear all filters"
            title="Clear all filters"
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="filters-summary" aria-live="polite">
          <span className="filters-count">
            {breadcrumbItems.filter(item => item.removable).length} filter
            {breadcrumbItems.filter(item => item.removable).length > 1 ? 's' : ''} applied
          </span>
        </div>
      )}
    </nav>
  );
};

/**
 * Build URL for removing a specific filter
 */
function buildRemoveFilterUrl(citySlug: string, filterType: string, value: unknown, currentFilters: FilterState): string {
  const newFilters = { ...currentFilters };
  
  // Remove the specific filter
  switch (filterType) {
    case 'contractLength':
      newFilters.contractLength = (newFilters.contractLength || []).filter(v => v !== value);
      if (newFilters.contractLength.length === 0) {
        delete newFilters.contractLength;
      }
      break;
    case 'rateType':
      delete newFilters.rateType;
      break;
    case 'greenEnergy':
      delete newFilters.greenEnergy;
      break;
    case 'prePaid':
      delete newFilters.prePaid;
      break;
    case 'noDeposit':
      delete newFilters.noDeposit;
      break;
    case 'providers':
      newFilters.providers = (newFilters.providers || []).filter(v => v !== value);
      if (newFilters.providers.length === 0) {
        delete newFilters.providers;
      }
      break;
    case 'features':
      newFilters.features = (newFilters.features || []).filter(v => v !== value);
      if (newFilters.features.length === 0) {
        delete newFilters.features;
      }
      break;
    case 'priceRange':
      delete newFilters.priceRange;
      break;
  }

  // Build URL segments
  const segments: string[] = [];
  
  if (newFilters.contractLength?.length) {
    segments.push(...newFilters.contractLength.map(length => `${length}-month`));
  }
  if (newFilters.rateType === 'fixed') segments.push('fixed-rate');
  if (newFilters.rateType === 'variable') segments.push('variable-rate');
  if (newFilters.greenEnergy) segments.push('green-energy');
  if (newFilters.prePaid) segments.push('prepaid');
  if (newFilters.noDeposit) segments.push('no-deposit');
  if (newFilters.providers?.length) {
    segments.push(...newFilters.providers.map(p => p.toLowerCase().replace(/\s+/g, '-')));
  }

  return segments.length > 0 
    ? `/electricity-plans/${citySlug}/${segments.join('/')}`
    : `/electricity-plans/${citySlug}`;
}

/**
 * Format provider name for display
 */
function formatProviderName(provider: string): string {
  return provider.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Format feature name for display
 */
function formatFeatureName(feature: string): string {
  const featureNames: Record<string, string> = {
    'bill-credit': 'Bill Credit',
    'free-nights': 'Free Nights',
    'auto-pay': 'Auto Pay Required',
    'satisfaction-guarantee': 'Satisfaction Guarantee'
  };
  
  return featureNames[feature] || feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format price range for display
 */
function formatPriceRange(range: { min?: number; max?: number } | string): string {
  if (typeof range === 'string') {
    return range === '20+' ? 'Over 20¢/kWh' : range.replace('-', ' - ') + '¢/kWh';
  }
  
  if (range.min && range.max) {
    return `${range.min}¢ - ${range.max}¢/kWh`;
  } else if (range.min) {
    return `Over ${range.min}¢/kWh`;
  } else if (range.max) {
    return `Under ${range.max}¢/kWh`;
  }
  
  return 'Custom Price Range';
}

export default FilterBreadcrumb;

// Component-specific styles
const styles = `
.filter-breadcrumb {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.breadcrumb-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-separator {
  color: #6b7280;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: #002768;
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.breadcrumb-link:hover {
  background: rgba(0, 39, 104, 0.1);
  text-decoration: underline;
}

.breadcrumb-link[aria-current="page"] {
  color: #6b7280;
  pointer-events: none;
}

.breadcrumb-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: #002768;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.breadcrumb-filter:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

.breadcrumb-filter:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}

.filter-label {
  white-space: nowrap;
}

.remove-icon {
  font-size: 1.125rem;
  font-weight: bold;
  margin-left: 0.125rem;
}

.clear-all-filters {
  background: #be0b31;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.clear-all-filters:hover {
  background: #a00922;
}

.clear-all-filters:focus {
  outline: 2px solid #be0b31;
  outline-offset: 2px;
}

.filters-summary {
  margin-top: 0.5rem;
  text-align: center;
}

.filters-count {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .filter-breadcrumb {
    padding: 0.75rem;
  }
  
  .breadcrumb-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .breadcrumb-list {
    gap: 0.375rem;
  }
  
  .breadcrumb-filter {
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .clear-all-filters {
    align-self: center;
    padding: 0.625rem 1.25rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .breadcrumb-filter {
    border: 2px solid white;
  }
  
  .breadcrumb-link {
    border: 1px solid transparent;
  }
  
  .breadcrumb-link:focus {
    border-color: #002768;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-filter,
  .breadcrumb-link,
  .clear-all-filters {
    transition: none;
  }
  
  .breadcrumb-filter:hover {
    transform: none;
  }
}

/* Screen reader improvements */
.breadcrumb-filter .remove-icon {
  speak: none;
}

.filters-summary[aria-live="polite"] {
  position: relative;
}

/* Print styles */
@media print {
  .filter-breadcrumb {
    background: none;
    border: 1px solid #000;
    page-break-inside: avoid;
  }
  
  .breadcrumb-filter,
  .clear-all-filters {
    background: none;
    color: #000;
    border: 1px solid #000;
  }
  
  .remove-icon {
    display: none;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('filter-breadcrumb-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'filter-breadcrumb-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}