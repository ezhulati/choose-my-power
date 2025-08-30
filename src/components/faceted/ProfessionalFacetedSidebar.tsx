/**
 * Professional Faceted Sidebar Component
 * Clean, hierarchical filtering with proper UI structure
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDownIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import type { FacetedSidebarProps } from '../../types/facets';

interface FilterSection {
  id: string;
  title: string;
  description?: string;
  options: FilterOption[];
  expanded: boolean;
  type: 'checkbox' | 'radio';
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  description?: string;
  popular?: boolean;
  recommended?: boolean;
}

const ProfessionalFacetedSidebar: React.FC<FacetedSidebarProps> = ({
  currentFilters,
  availableFacets,
  facetCounts,
  onFilterChange,
  loading = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['contract', 'rate-type', 'green-energy'])
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

  // Define filter sections with proper hierarchy
  const filterSections: FilterSection[] = [
    {
      id: 'contract',
      title: 'Contract Length',
      description: 'Choose your commitment level',
      type: 'checkbox',
      expanded: expandedSections.has('contract'),
      options: [
        { value: '6', label: '6-Month Contract', description: 'Short-term flexibility' },
        { value: '12', label: '12-Month Contract', description: 'Most popular choice', popular: true },
        { value: '24', label: '24-Month Contract', description: 'Better rates', recommended: true },
        { value: '36', label: '36-Month Contract', description: 'Lowest rates' },
        { value: 'month-to-month', label: 'Month-to-Month', description: 'Most flexible' }
      ]
    },
    {
      id: 'rate-type',
      title: 'Rate Structure',
      description: 'How your rate is determined',
      type: 'radio',
      expanded: expandedSections.has('rate-type'),
      options: [
        { value: 'fixed', label: 'Fixed Rate', description: 'Same rate all year', popular: true },
        { value: 'variable', label: 'Variable Rate', description: 'Rate can change monthly' },
        { value: 'indexed', label: 'Market Rate', description: 'Follows wholesale prices' }
      ]
    },
    {
      id: 'green-energy',
      title: 'Renewable Energy',
      description: 'Environmental impact level',
      type: 'checkbox',
      expanded: expandedSections.has('green-energy'),
      options: [
        { value: '100', label: '100% Clean Energy', description: 'Wind & solar', recommended: true },
        { value: '50', label: '50% Clean Energy', description: 'Mixed sources' },
        { value: '25', label: '25% Clean Energy', description: 'Partial renewable' }
      ]
    },
    {
      id: 'features',
      title: 'Special Features',
      description: 'Plan benefits and requirements',
      type: 'checkbox',
      expanded: expandedSections.has('features'),
      options: [
        { value: 'no-deposit', label: 'No Deposit Required', description: 'Skip security deposit' },
        { value: 'prepaid', label: 'Prepaid Plans', description: 'Pay as you go' },
        { value: 'autopay', label: 'AutoPay Discount', description: 'Save with automatic payments' },
        { value: 'time-of-use', label: 'Time-of-Use', description: 'Cheaper rates at night' },
        { value: 'free-weekends', label: 'Free Weekends', description: 'No charges on weekends' },
        { value: 'bill-credit', label: 'Bill Credit', description: 'Monthly account credit' }
      ]
    },
    {
      id: 'providers',
      title: 'Electricity Provider',
      description: 'Filter by company',
      type: 'checkbox',
      expanded: expandedSections.has('providers'),
      options: [
        { value: 'txu', label: 'TXU Energy', count: 45 },
        { value: 'reliant', label: 'Reliant', count: 38 },
        { value: 'green-mountain', label: 'Green Mountain Energy', count: 22 },
        { value: 'discount-power', label: 'Discount Power', count: 31 },
        { value: '4change', label: '4Change Energy', count: 18 }
      ]
    },
    {
      id: 'usage',
      title: 'Monthly Usage Level',
      description: 'Optimize for your consumption',
      type: 'radio',
      expanded: expandedSections.has('usage'),
      options: [
        { value: '500', label: 'Low Usage (500 kWh)', description: 'Small apartment/condo' },
        { value: '1000', label: 'Average Usage (1000 kWh)', description: 'Typical home', popular: true },
        { value: '2000', label: 'High Usage (2000 kWh)', description: 'Large home' }
      ]
    }
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (currentFilters.rateType) count++;
    if (currentFilters.contractLength?.length) count += currentFilters.contractLength.length;
    if (currentFilters.greenEnergy) count++;
    if (currentFilters.providers?.length) count += currentFilters.providers.length;
    if (currentFilters.features?.length) count += currentFilters.features.length;
    return count;
  };

  const clearAllFilters = () => {
    // Implementation for clearing filters
    Object.keys(currentFilters).forEach(filterType => {
      if (Array.isArray(currentFilters[filterType as keyof typeof currentFilters])) {
        const arrayValue = currentFilters[filterType as keyof typeof currentFilters] as any[];
        arrayValue.forEach((value: any) => {
          onFilterChange(filterType, value, false);
        });
      } else if (currentFilters[filterType as keyof typeof currentFilters]) {
        onFilterChange(filterType, currentFilters[filterType as keyof typeof currentFilters], false);
      }
    });
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Refine Your Search</h2>
          <p className="text-sm text-gray-600 mt-1">Find plans that match your needs</p>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-texas-red hover:bg-texas-red hover:text-white"
          >
            <XIcon className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {/* Render active filter badges */}
            {currentFilters.rateType && (
              <Badge className="bg-texas-navy text-white text-xs">
                {currentFilters.rateType}
                <button
                  onClick={() => onFilterChange('rateType', currentFilters.rateType, false)}
                  className="ml-2 hover:text-texas-red"
                >
                  ×
                </button>
              </Badge>
            )}
            {/* Add more active filter badges as needed */}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-6">
        {filterSections.map((section) => (
          <div key={section.id} className="border-b border-gray-100 pb-6 last:border-b-0">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-texas-navy">
                  {section.title}
                </h3>
                {section.description && (
                  <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
              {section.expanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500 group-hover:text-texas-navy" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500 group-hover:text-texas-navy" />
              )}
            </button>

            {/* Section Content */}
            {section.expanded && (
              <div className="mt-4 space-y-3">
                {section.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start space-x-3 cursor-pointer group"
                  >
                    <input
                      type={section.type}
                      name={section.id}
                      value={option.value}
                      checked={
                        section.type === 'radio'
                          ? currentFilters[section.id as keyof typeof currentFilters] === option.value
                          : Array.isArray(currentFilters[section.id as keyof typeof currentFilters])
                          ? (currentFilters[section.id as keyof typeof currentFilters] as any[])?.includes(option.value)
                          : false
                      }
                      onChange={(e) => {
                        onFilterChange(section.id, option.value, e.target.checked);
                      }}
                      className="mt-1 h-4 w-4 text-texas-navy focus:ring-texas-navy focus:ring-2 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 group-hover:text-texas-navy font-medium">
                          {option.label}
                          {option.popular && (
                            <Badge className="ml-2 bg-texas-gold text-white text-[10px] px-1.5 py-0.5">
                              Popular
                            </Badge>
                          )}
                          {option.recommended && (
                            <Badge className="ml-2 bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5">
                              Best Value
                            </Badge>
                          )}
                        </span>
                        {option.count && (
                          <span className="text-xs text-gray-500">({option.count})</span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-texas-cream rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help Choosing?</h4>
        <p className="text-xs text-gray-600 mb-3">
          Not sure which options are right for you? Our experts can help.
        </p>
        <Button size="sm" className="w-full text-xs">
          Get Expert Advice
        </Button>
      </div>
    </div>
  );
};

export default ProfessionalFacetedSidebar;