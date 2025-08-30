/**
 * Advanced Plan Results Component with Comprehensive Filtering
 * 
 * Professional results display component featuring:
 * - Advanced filtering and sorting with faceted navigation
 * - Mobile-optimized responsive design with touch interactions
 * - Plan comparison functionality with side-by-side analysis
 * - Real-time filtering with URL state management
 * - Accessibility-compliant design with keyboard navigation
 * - Texas branding with professional styling
 * - Analytics tracking for user interactions
 * 
 * @component PlanResults
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Filter,
  Grid,
  List,
  Compare,
  Leaf,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Building,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProfessionalPlanCard } from '@/components/ui/ProfessionalPlanCard';
import { useElectricityPlans, type UseElectricityPlansReturn } from '@/hooks/useElectricityPlans';
import type { ElectricityPlan } from '@/types/electricity-plans';

interface FilterConfig {
  rateType: Array<{ value: string; label: string; count?: number }>;
  contractLength: Array<{ value: number; label: string; count?: number }>;
  greenEnergy: Array<{ value: boolean; label: string; count?: number }>;
  priceRange: { min: number; max: number; step: number };
  providers: Array<{ value: string; label: string; count?: number }>;
  features: Array<{ value: string; label: string; count?: number }>;
}

interface SortOption {
  value: string;
  label: string;
  field: keyof ElectricityPlan | 'rate' | 'green_energy' | 'contract_length' | 'provider';
  order: 'asc' | 'desc';
  icon: React.ReactNode;
}

export interface PlanResultsProps {
  /** Custom plans data - if not provided, uses hook data */
  plans?: ElectricityPlan[];
  /** Show search filters sidebar */
  showFilters?: boolean;
  /** Initial view mode */
  viewMode?: 'grid' | 'list' | 'comparison';
  /** Enable plan comparison functionality */
  enableComparison?: boolean;
  /** Maximum plans allowed in comparison */
  maxComparison?: number;
  /** Show provider information */
  showProviderInfo?: boolean;
  /** Show plan details expanded by default */
  expandedByDefault?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Callback for plan selection */
  onPlanSelect?: (plan: ElectricityPlan) => void;
  /** Callback for comparison changes */
  onComparisonChange?: (planIds: string[]) => void;
  /** Analytics event callback */
  onTrackEvent?: (event: string, properties: Record<string, any>) => void;
}

export function PlanResults({
  plans: externalPlans,
  showFilters = true,
  viewMode: initialViewMode = 'grid',
  enableComparison = true,
  maxComparison = 3,
  showProviderInfo = true,
  expandedByDefault = false,
  className,
  loading: externalLoading = false,
  error: externalError,
  emptyMessage = 'No electricity plans found for your area.',
  onPlanSelect,
  onComparisonChange,
  onTrackEvent
}: PlanResultsProps) {
  
  // Hook for electricity plans state management
  const hookData = useElectricityPlans({
    enableAnalytics: true
  }) as UseElectricityPlansReturn;

  const {
    plans: hookPlans,
    filteredPlans,
    totalPlans,
    isLoading: hookLoading,
    error: hookError,
    filters,
    sortBy,
    sortOrder,
    comparisonPlans,
    selectedPlan,
    showFilters: hookShowFilters,
    updateFilters,
    updateSorting,
    addToComparison,
    removeFromComparison,
    setSelectedPlan,
    toggleFilters,
    trackEvent: hookTrackEvent
  } = hookData;

  // Use external data or hook data
  const plans = externalPlans || hookPlans;
  const displayPlans = externalPlans || filteredPlans;
  const isLoading = externalLoading || hookLoading;
  const error = externalError || hookError?.userMessage;
  const trackEvent = onTrackEvent || hookTrackEvent;

  // Local state
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(filters);
  const [currentSort, setCurrentSort] = useState({ field: sortBy, order: sortOrder });

  // Refs for intersection observer
  const filtersRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sort options configuration
  const sortOptions: SortOption[] = [
    {
      value: 'rate-asc',
      label: 'Price: Low to High',
      field: 'rate',
      order: 'asc',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      value: 'rate-desc',
      label: 'Price: High to Low',
      field: 'rate',
      order: 'desc',
      icon: <TrendingDown className="h-4 w-4" />
    },
    {
      value: 'green-desc',
      label: 'Most Green Energy',
      field: 'green_energy',
      order: 'desc',
      icon: <Leaf className="h-4 w-4" />
    },
    {
      value: 'contract-asc',
      label: 'Shortest Contract',
      field: 'contract_length',
      order: 'asc',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      value: 'provider-asc',
      label: 'Provider A-Z',
      field: 'provider',
      order: 'asc',
      icon: <Building className="h-4 w-4" />
    }
  ];

  // Generate filter configuration from plans data
  const filterConfig: FilterConfig = useMemo(() => {
    if (!plans.length) return {
      rateType: [],
      contractLength: [],
      greenEnergy: [],
      priceRange: { min: 0, max: 30, step: 0.5 },
      providers: [],
      features: []
    };

    // Aggregate filter options with counts
    const rateTypes = new Map<string, number>();
    const contractLengths = new Map<number, number>();
    const providers = new Map<string, number>();
    let minRate = Infinity;
    let maxRate = 0;

    plans.forEach(plan => {
      // Rate types
      const rateType = plan.contract.type;
      rateTypes.set(rateType, (rateTypes.get(rateType) || 0) + 1);

      // Contract lengths
      const contractLength = plan.contract.length;
      contractLengths.set(contractLength, (contractLengths.get(contractLength) || 0) + 1);

      // Providers
      const providerName = plan.provider.name;
      providers.set(providerName, (providers.get(providerName) || 0) + 1);

      // Price range
      const rate = plan.pricing.rate1000kWh;
      minRate = Math.min(minRate, rate);
      maxRate = Math.max(maxRate, rate);
    });

    return {
      rateType: Array.from(rateTypes.entries()).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count
      })).sort((a, b) => a.label.localeCompare(b.label)),
      
      contractLength: Array.from(contractLengths.entries()).map(([value, count]) => ({
        value,
        label: `${value} month${value !== 1 ? 's' : ''}`,
        count
      })).sort((a, b) => a.value - b.value),
      
      greenEnergy: [
        { value: true, label: 'Green Energy', count: plans.filter(p => p.features.greenEnergy > 0).length },
        { value: false, label: 'Traditional Energy', count: plans.filter(p => p.features.greenEnergy === 0).length }
      ],
      
      priceRange: {
        min: Math.floor(minRate * 0.9),
        max: Math.ceil(maxRate * 1.1),
        step: 0.1
      },
      
      providers: Array.from(providers.entries()).map(([value, count]) => ({
        value: value.toLowerCase(),
        label: value,
        count
      })).sort((a, b) => b.count - a.count),
      
      features: [
        { value: 'no_deposit', label: 'No Deposit', count: plans.filter(p => !p.features.deposit.required).length },
        { value: 'prepaid', label: 'Prepaid Plans', count: plans.filter(p => p.name.toLowerCase().includes('prepaid')).length },
        { value: 'free_time', label: 'Free Time Plans', count: plans.filter(p => p.features.freeTime).length },
        { value: 'bill_credit', label: 'Bill Credit', count: plans.filter(p => p.features.billCredit > 0).length }
      ].filter(feature => feature.count > 0)
    };
  }, [plans]);

  // Apply search filtering
  const searchFilteredPlans = useMemo(() => {
    if (!searchQuery) return displayPlans;
    
    const query = searchQuery.toLowerCase();
    return displayPlans.filter(plan => 
      plan.name.toLowerCase().includes(query) ||
      plan.provider.name.toLowerCase().includes(query) ||
      plan.contract.type.toLowerCase().includes(query)
    );
  }, [displayPlans, searchQuery]);

  // Convert ElectricityPlan to ProfessionalPlanCard format
  const convertedPlans = useMemo(() => {
    return searchFilteredPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      provider: plan.provider.name,
      rate: plan.pricing.rate1000kWh,
      contractTerm: `${plan.contract.length} months`,
      planType: plan.contract.type as 'fixed' | 'variable' | 'indexed',
      greenEnergy: plan.features.greenEnergy > 0,
      noDeposit: !plan.features.deposit.required,
      topRated: (plan.provider as any)?.rating >= 4.5 || false,
      features: [
        plan.contract.type === 'fixed' ? 'Fixed Rate' : 'Variable Rate',
        ...(plan.features.greenEnergy > 0 ? [`${plan.features.greenEnergy}% Green Energy`] : []),
        ...(!plan.features.deposit.required ? ['No Deposit'] : []),
        ...(plan.features.freeTime ? ['Free Time'] : []),
        ...(plan.features.billCredit > 0 ? ['Bill Credit'] : [])
      ].filter(Boolean),
      slug: plan.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }));
  }, [searchFilteredPlans]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: any) => {
    const newFilters = { ...selectedFilters, [filterType]: value };
    setSelectedFilters(newFilters);
    updateFilters(newFilters);
    
    trackEvent('filter_applied', {
      filterType,
      value,
      resultCount: convertedPlans.length
    });
  }, [selectedFilters, updateFilters, trackEvent, convertedPlans.length]);

  // Handle sort changes
  const handleSortChange = useCallback((sortValue: string) => {
    const option = sortOptions.find(opt => opt.value === sortValue);
    if (!option) return;

    setCurrentSort({ field: option.field as any, order: option.order });
    updateSorting(option.field as any, option.order);
    
    trackEvent('sort_changed', {
      sortField: option.field,
      sortOrder: option.order,
      resultCount: convertedPlans.length
    });
  }, [sortOptions, updateSorting, trackEvent, convertedPlans.length]);

  // Handle plan expansion
  const handlePlanExpand = useCallback((planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
    
    trackEvent('plan_expanded', {
      planId,
      expanded: !expandedPlans.has(planId)
    });
  }, [expandedPlans, trackEvent]);

  // Handle comparison toggle
  const handleComparisonToggle = useCallback((plan: ElectricityPlan) => {
    const isInComparison = comparisonPlans.includes(plan.id);
    
    if (isInComparison) {
      removeFromComparison(plan.id);
    } else if (comparisonPlans.length < maxComparison) {
      addToComparison(plan.id);
    }
    
    const newComparisonPlans = isInComparison 
      ? comparisonPlans.filter(id => id !== plan.id)
      : comparisonPlans.length < maxComparison 
        ? [...comparisonPlans, plan.id]
        : comparisonPlans;
    
    onComparisonChange?.(newComparisonPlans);
    
    trackEvent('comparison_toggled', {
      planId: plan.id,
      planName: plan.name,
      provider: plan.provider.name,
      added: !isInComparison,
      comparisonSize: newComparisonPlans.length
    });
  }, [comparisonPlans, maxComparison, addToComparison, removeFromComparison, onComparisonChange, trackEvent]);

  // Handle plan selection
  const handlePlanSelect = useCallback((plan: ElectricityPlan) => {
    setSelectedPlan(plan.id);
    onPlanSelect?.(plan);
    
    trackEvent('plan_selected', {
      planId: plan.id,
      planName: plan.name,
      provider: plan.provider.name,
      rate: plan.pricing.rate1000kWh,
      contractLength: plan.contract.length
    });
  }, [setSelectedPlan, onPlanSelect, trackEvent]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <PlanResultsSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-texas-red mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load plans
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!convertedPlans.length) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No plans found
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-4">
            {emptyMessage}
          </p>
          {selectedFilters && Object.keys(selectedFilters).length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedFilters({});
                updateFilters({});
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-texas-navy">
            Electricity Plans
          </h2>
          <p className="text-gray-600">
            {convertedPlans.length} plan{convertedPlans.length !== 1 ? 's' : ''} available
            {searchQuery && <span> for "{searchQuery}"</span>}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Find a specific plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Sort Dropdown */}
          <Select 
            value={`${currentSort.field}-${currentSort.order}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="How should we sort these?" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
            {enableComparison && (
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className="rounded-l-none"
              >
                <Compare className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Filters Toggle */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Bar */}
      {enableComparison && comparisonPlans.length > 0 && (
        <Card className="border-texas-gold bg-texas-gold/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Compare className="h-5 w-5 text-texas-gold-700" />
                <span className="font-medium text-texas-gold-700">
                  {comparisonPlans.length} plan{comparisonPlans.length !== 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('comparison')}
                  className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white"
                >
                  Compare Plans
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    comparisonPlans.forEach(removeFromComparison);
                    onComparisonChange?.([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className={cn(
            'lg:col-span-1',
            showMobileFilters ? 'block' : 'hidden lg:block'
          )}>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileFilters(false)}
                    className="lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlanFilters
                  config={filterConfig}
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Grid */}
        <div className={cn(
          showFilters ? 'lg:col-span-3' : 'lg:col-span-4'
        )}>
          {viewMode === 'comparison' ? (
            <PlanComparison
              plans={searchFilteredPlans.filter(plan => comparisonPlans.includes(plan.id))}
              onPlanSelect={handlePlanSelect}
              onRemoveFromComparison={(planId) => {
                removeFromComparison(planId);
                onComparisonChange?.(comparisonPlans.filter(id => id !== planId));
              }}
            />
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            )}>
              {convertedPlans.map((plan) => (
                <ProfessionalPlanCard
                  key={plan.id}
                  plan={plan}
                  onViewDetails={() => handlePlanSelect(searchFilteredPlans.find(p => p.id === plan.id)!)}
                  className="h-full"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Plan Filters Component
interface PlanFiltersProps {
  config: FilterConfig;
  selectedFilters: any;
  onFilterChange: (filterType: string, value: any) => void;
}

function PlanFilters({ config, selectedFilters, onFilterChange }: PlanFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Rate Type Filter */}
      {config.rateType.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Rate Type</h4>
          <div className="space-y-2">
            {config.rateType.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFilters.rateType?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = selectedFilters.rateType || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value);
                    onFilterChange('rateType', updated);
                  }}
                  className="rounded border-gray-300 text-texas-navy focus:ring-texas-navy"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Contract Length Filter */}
      {config.contractLength.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Contract Length</h4>
          <div className="space-y-2">
            {config.contractLength.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFilters.contractLength?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = selectedFilters.contractLength || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: number) => v !== option.value);
                    onFilterChange('contractLength', updated);
                  }}
                  className="rounded border-gray-300 text-texas-navy focus:ring-texas-navy"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Providers Filter */}
      {config.providers.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Providers</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {config.providers.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFilters.providers?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = selectedFilters.providers || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value);
                    onFilterChange('providers', updated);
                  }}
                  className="rounded border-gray-300 text-texas-navy focus:ring-texas-navy"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Features Filter */}
      {config.features.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
          <div className="space-y-2">
            {config.features.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFilters.features?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = selectedFilters.features || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value);
                    onFilterChange('features', updated);
                  }}
                  className="rounded border-gray-300 text-texas-navy focus:ring-texas-navy"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Plan Comparison Component
interface PlanComparisonProps {
  plans: ElectricityPlan[];
  onPlanSelect: (plan: ElectricityPlan) => void;
  onRemoveFromComparison: (planId: string) => void;
}

function PlanComparison({ plans, onPlanSelect, onRemoveFromComparison }: PlanComparisonProps) {
  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Compare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans to compare</h3>
          <p className="text-gray-600">Add plans to comparison to see them side by side.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compare className="h-5 w-5" />
          Plan Comparison ({plans.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-full">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-2 border-texas-gold/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-texas-navy">
                      {plan.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromComparison(plan.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">{plan.provider.name}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Comparison */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-texas-navy">
                      {plan.pricing.rate1000kWh.toFixed(1)}¢
                    </div>
                    <div className="text-sm text-gray-500">per kWh</div>
                  </div>

                  {/* Feature Comparison */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Contract:</span>
                      <span className="font-medium">{plan.contract.length}mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Type:</span>
                      <span className="font-medium capitalize">{plan.contract.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Green Energy:</span>
                      <span className="font-medium">{plan.features.greenEnergy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Early Term Fee:</span>
                      <span className="font-medium">${plan.contract.earlyTerminationFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit:</span>
                      <span className="font-medium">
                        {plan.features.deposit.required ? `$${plan.features.deposit.amount}` : 'None'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => onPlanSelect(plan)}
                    className="w-full bg-gradient-to-r from-texas-navy to-blue-800"
                  >
                    Select This Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Loading Component
function PlanResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with display name
PlanResults.displayName = 'PlanResults';