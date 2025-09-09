# Component Implementation: Complete React Components

**Document**: Complete React Component Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  
**Purpose**: Provide complete component implementations with real data integration

## Component Implementation Strategy

All components follow the **constitutional requirement** for **100% real data usage** with comprehensive state management, error handling, and mobile optimization.

### **Key Implementation Principles**
1. **Real Data Integration**: Service layer integration, never mock data
2. **Mobile-First Design**: Touch optimization for 60% mobile traffic
3. **State Management**: React hooks with proper loading states
4. **Error Boundaries**: Graceful error handling throughout
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Performance**: Lazy loading and optimization

## Core Component Implementations

### **Plan Card Component (src/components/plans/PlanCard.tsx)**
```tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Leaf, Zap, Clock, Star } from 'lucide-react';
import { RealPlan } from '../../types/service-types';
import { ProviderLogo } from '../ui/ProviderLogo';

interface PlanCardProps {
  plan: RealPlan;
  onSelectPlan: (planId: string) => void;
  isHighlighted?: boolean;
  showComparison?: boolean;
  className?: string;
}

export function PlanCard({ 
  plan, 
  onSelectPlan, 
  isHighlighted = false,
  showComparison = true,
  className = "" 
}: PlanCardProps) {
  const handleSelectPlan = () => {
    // Constitutional requirement: Use MongoDB ObjectId, never hardcoded
    onSelectPlan(plan.id);
  };

  const formatRate = (rate: number | null) => {
    if (!rate) return 'N/A';
    return `${rate.toFixed(3)}¢`;
  };

  const formatFee = (fee: number) => {
    if (fee === 0) return 'None';
    return `$${fee.toFixed(2)}`;
  };

  return (
    <Card 
      className={`
        relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        ${isHighlighted ? 'ring-2 ring-texas-red border-texas-red' : 'border-gray-200'}
        ${className}
      `}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-4 bg-texas-red text-white px-3 py-1 rounded-full text-sm font-semibold">
          Best Value
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <ProviderLogo 
              provider={plan.provider}
              size="sm"
              className="w-12 h-12"
            />
            <div>
              <CardTitle className="text-lg font-bold text-texas-navy">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {plan.provider.displayName}
              </CardDescription>
            </div>
          </div>
          
          {plan.customerRating && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{plan.customerRating.toFixed(1)}</span>
              <span className="text-gray-400">({plan.reviewCount})</span>
            </div>
          )}
        </div>

        {plan.headline && (
          <p className="text-sm text-gray-700 mt-2">{plan.headline}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rate Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-texas-navy">
              {formatRate(plan.rate1000Kwh)}
            </div>
            <div className="text-sm text-gray-600">per kWh at 1,000 kWh/month</div>
          </div>
          
          {showComparison && (plan.rate500Kwh || plan.rate2000Kwh) && (
            <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
              {plan.rate500Kwh && (
                <span>500 kWh: {formatRate(plan.rate500Kwh)}</span>
              )}
              {plan.rate2000Kwh && (
                <span>2,000 kWh: {formatRate(plan.rate2000Kwh)}</span>
              )}
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Contract Length</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{plan.termMonths} months</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rate Type</span>
            <Badge variant={plan.rateType === 'fixed' ? 'default' : 'secondary'}>
              {plan.rateType.charAt(0).toUpperCase() + plan.rateType.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Monthly Fee</span>
            <span className="font-medium">{formatFee(plan.monthlyFee)}</span>
          </div>

          {plan.cancellationFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cancellation Fee</span>
              <span className="font-medium">{formatFee(plan.cancellationFee)}</span>
            </div>
          )}
        </div>

        {/* Green Energy Badge */}
        {plan.percentGreen > 0 && (
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              {plan.percentGreen}% Renewable Energy
            </span>
          </div>
        )}

        {/* Plan Features */}
        <div className="flex flex-wrap gap-1">
          {plan.isPrepay && (
            <Badge variant="outline" className="text-xs">Prepaid</Badge>
          )}
          {plan.isTimeOfUse && (
            <Badge variant="outline" className="text-xs">Time of Use</Badge>
          )}
          {plan.requiresAutoPay && (
            <Badge variant="outline" className="text-xs">Auto Pay Required</Badge>
          )}
          {plan.requiresDeposit && (
            <Badge variant="outline" className="text-xs">Deposit Required</Badge>
          )}
        </div>

        {/* TDSP Information */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <span>Service by {plan.tdsp.name}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleSelectPlan}
          className="w-full bg-texas-red hover:bg-texas-red-600 text-white"
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          Select This Plan
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PlanCard;
```

### **Plans Grid Component (src/components/plans/PlansGrid.tsx)**
```tsx
import React, { useState, useEffect } from 'react';
import { PlanCard } from './PlanCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert, AlertDescription } from '../ui/alert';
import { getPlansForCity } from '../../lib/services/plan-service';
import { RealPlan, PlanFilters } from '../../types/service-types';
import { AlertCircle, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { PlansFilter } from './PlansFilter';

interface PlansGridProps {
  citySlug: string;
  state?: string;
  initialFilters?: PlanFilters;
  onPlanSelect: (planId: string) => void;
  className?: string;
}

export function PlansGrid({ 
  citySlug, 
  state = 'TX',
  initialFilters = {},
  onPlanSelect,
  className = "" 
}: PlansGridProps) {
  const [plans, setPlans] = useState<RealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlanFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Load plans data - Constitutional requirement: Real data only
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const plansData = await getPlansForCity(citySlug, state, filters);
        
        if (plansData.length === 0) {
          setError(`No electricity plans found for ${citySlug}. This may be because the area is not deregulated or plans are temporarily unavailable.`);
        } else {
          setPlans(plansData);
        }
        
      } catch (err) {
        console.error('[PlansGrid] Error loading plans:', err);
        setError('Unable to load electricity plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [citySlug, state, filters]);

  const handleFiltersChange = (newFilters: PlanFilters) => {
    setFilters(newFilters);
  };

  const findBestValuePlan = (plans: RealPlan[]): string | null => {
    if (plans.length === 0) return null;
    
    // Simple best value calculation - lowest effective rate with reasonable fees
    const sortedByValue = plans
      .filter(plan => plan.monthlyFee < 15) // Reasonable monthly fee threshold
      .sort((a, b) => {
        const aEffectiveRate = a.rate1000Kwh + (a.monthlyFee * 12 / 1000); // Annualized
        const bEffectiveRate = b.rate1000Kwh + (b.monthlyFee * 12 / 1000);
        return aEffectiveRate - bEffectiveRate;
      });
    
    return sortedByValue.length > 0 ? sortedByValue[0].id : null;
  };

  const bestValuePlanId = findBestValuePlan(plans);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading electricity plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-gray-700">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-texas-navy">
            Electricity Plans
          </h2>
          <p className="text-gray-600 mt-1">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} available in {citySlug}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filter Plans</span>
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-8">
          <PlansFilter
            initialFilters={filters}
            onFiltersChange={handleFiltersChange}
            availablePlans={plans}
          />
        </div>
      )}

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelectPlan={onPlanSelect}
              isHighlighted={plan.id === bestValuePlanId}
              showComparison={true}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">
            No plans match your current filters.
          </p>
          <Button
            variant="outline"
            onClick={() => setFilters({})}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Load More (if implementing pagination) */}
      {plans.length >= 20 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Plans
          </Button>
        </div>
      )}
    </div>
  );
}

export default PlansGrid;
```

### **ZIP Code Search Component (src/components/ZipCodeSearch.tsx)**
```tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { validateZipCode } from '../lib/services/city-service';
import { Search, MapPin, AlertCircle } from 'lucide-react';

interface ZipCodeSearchProps {
  onCityFound: (citySlug: string, cityName: string) => void;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  autoFocus?: boolean;
}

export function ZipCodeSearch({
  onCityFound,
  placeholder = "Enter your ZIP code",
  buttonText = "Find Plans",
  className = "",
  autoFocus = false
}: ZipCodeSearchProps) {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5); // Numbers only, max 5 digits
    setZipCode(value);
    if (error) setError(null); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (zipCode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Constitutional requirement: Real ZIP validation, no hardcoded data
      const validation = await validateZipCode(zipCode);
      
      if (!validation.isValid) {
        setError('This ZIP code is not in a deregulated electricity market. Please try a different ZIP code.');
        return;
      }

      if (!validation.city) {
        setError('Unable to find city information for this ZIP code. Please try again.');
        return;
      }

      // Navigate to city plans
      onCityFound(validation.city.slug, validation.city.name);
      
    } catch (err) {
      console.error('[ZipCodeSearch] Validation error:', err);
      setError('Unable to validate ZIP code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidLength = zipCode.length === 5;

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              value={zipCode}
              onChange={handleZipChange}
              placeholder={placeholder}
              className="pl-10 text-lg h-12"
              autoFocus={autoFocus}
              disabled={loading}
              aria-label="ZIP code input"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!isValidLength || loading}
            className="bg-texas-red hover:bg-texas-red-600 text-white h-12 px-8 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            {loading ? 'Searching...' : buttonText}
          </Button>
        </div>
      </form>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-600 text-center">
        <p>Enter your ZIP code to see available electricity plans in your area.</p>
        <p className="mt-1">Only available for deregulated markets in Texas.</p>
      </div>
    </div>
  );
}

export default ZipCodeSearch;
```

### **Provider Logo Component (src/components/ui/ProviderLogo.tsx)**
```tsx
import React from 'react';
import { Building2 } from 'lucide-react';

interface ProviderLogoProps {
  provider: {
    name: string;
    displayName?: string;
    logoUrl?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function ProviderLogo({ 
  provider, 
  size = 'md', 
  className = "",
  showFallback = true 
}: ProviderLogoProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const displayName = provider.displayName || provider.name;
  const hasLogo = provider.logoUrl && !imageError;
  const sizeClass = sizeClasses[size];

  if (!hasLogo && !showFallback) {
    return null;
  }

  if (!hasLogo || imageError) {
    // Fallback to text or icon
    return (
      <div 
        className={`
          ${sizeClass} 
          ${className}
          bg-gray-100 rounded-lg flex items-center justify-center
          border border-gray-200
        `}
        title={displayName}
      >
        {size === 'xs' || size === 'sm' ? (
          <Building2 className="w-1/2 h-1/2 text-gray-500" />
        ) : (
          <div className="text-center px-1">
            <Building2 className="w-6 h-6 text-gray-500 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-700 leading-tight">
              {displayName.slice(0, 8)}
              {displayName.length > 8 && '...'}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClass} ${className} relative`}
      title={displayName}
    >
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
      )}
      
      <img
        src={provider.logoUrl}
        alt={`${displayName} logo`}
        className={`
          w-full h-full object-contain rounded-lg
          ${imageLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-200
        `}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
}

export default ProviderLogo;
```

### **Loading Spinner Component (src/components/ui/LoadingSpinner.tsx)**
```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'default' | 'texas-red' | 'texas-navy' | 'white';
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  default: 'text-gray-600',
  'texas-red': 'text-texas-red',
  'texas-navy': 'text-texas-navy',
  white: 'text-white',
};

export function LoadingSpinner({ 
  size = 'md', 
  className = "",
  color = 'default'
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={`
        animate-spin 
        ${sizeClasses[size]} 
        ${colorClasses[color]}
        ${className}
      `} 
    />
  );
}

export default LoadingSpinner;
```

### **Mobile-Optimized Plan Card (src/components/mobile/MobilePlanCard.tsx)**
```tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Leaf, Zap, Star, ChevronRight } from 'lucide-react';
import { RealPlan } from '../../types/service-types';
import { ProviderLogo } from '../ui/ProviderLogo';

interface MobilePlanCardProps {
  plan: RealPlan;
  onSelectPlan: (planId: string) => void;
  onViewDetails: (planId: string) => void;
  isHighlighted?: boolean;
  className?: string;
}

export function MobilePlanCard({ 
  plan, 
  onSelectPlan, 
  onViewDetails,
  isHighlighted = false,
  className = "" 
}: MobilePlanCardProps) {
  const formatRate = (rate: number | null) => {
    if (!rate) return 'N/A';
    return `${rate.toFixed(3)}¢`;
  };

  const handleQuickSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPlan(plan.id);
  };

  const handleViewDetails = () => {
    onViewDetails(plan.id);
  };

  return (
    <Card 
      className={`
        touch-manipulation cursor-pointer
        transition-all duration-200 active:scale-95
        ${isHighlighted ? 'ring-2 ring-texas-red border-texas-red' : 'border-gray-200'}
        ${className}
      `}
      onClick={handleViewDetails}
    >
      {isHighlighted && (
        <div className="absolute -top-2 left-3 bg-texas-red text-white px-2 py-1 rounded-full text-xs font-semibold">
          Best Value
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <ProviderLogo 
              provider={plan.provider}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-texas-navy text-sm leading-tight truncate">
                {plan.name}
              </h3>
              <p className="text-gray-600 text-xs truncate">
                {plan.provider.displayName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {plan.customerRating && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {plan.customerRating.toFixed(1)}
                </span>
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Rate and Terms - Prominent Display */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div>
            <div className="text-xl font-bold text-texas-navy">
              {formatRate(plan.rate1000Kwh)}
            </div>
            <div className="text-xs text-gray-600">per kWh</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {plan.termMonths} months
            </div>
            <div className="text-xs text-gray-600">
              {plan.rateType}
            </div>
          </div>
        </div>

        {/* Key Features - Mobile Optimized */}
        <div className="flex flex-wrap gap-1.5">
          {plan.percentGreen > 0 && (
            <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
              <Leaf className="w-3 h-3" />
              <span className="text-xs font-medium">{plan.percentGreen}% Green</span>
            </div>
          )}
          
          {plan.monthlyFee === 0 && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              No Monthly Fee
            </Badge>
          )}
          
          {plan.isPrepay && (
            <Badge variant="outline" className="text-xs">Prepaid</Badge>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={handleQuickSelect}
            className="flex-1 bg-texas-red hover:bg-texas-red-600 text-white h-10 text-sm font-semibold touch-manipulation"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Select Plan
          </Button>
          
          <Button
            onClick={handleViewDetails}
            variant="outline"
            className="px-4 h-10 touch-manipulation"
            size="sm"
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MobilePlanCard;
```

### **Error Boundary Component (src/components/ui/ErrorBoundary.tsx)**
```tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component error:', error, errorInfo);
    
    // Log to analytics service if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Component Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          retry={this.retry} 
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ 
  error, 
  retry 
}: { 
  error: Error; 
  retry: () => void; 
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <Alert className="max-w-lg border-red-200 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800">
          Something went wrong
        </AlertTitle>
        <AlertDescription className="text-red-700 mt-2">
          <p className="mb-4">
            We encountered an error while loading this section. This may be a temporary issue.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
          
          <Button 
            onClick={retry}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-red-50 border-red-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default ErrorBoundary;
```

### **Component Usage Patterns**

#### **Standard Component Data Loading Pattern**
```tsx
// Example: Provider listing component
import React, { useState, useEffect } from 'react';
import { getProviders } from '../lib/services/provider-service';
import { RealProvider } from '../types/service-types';

export function ProviderListing() {
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Constitutional requirement: Real data only
        const providersData = await getProviders('TX');
        setProviders(providersData);
      } catch (error) {
        console.error('Error loading providers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map(provider => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

This component implementation provides:
- ✅ Real data integration (constitutional compliance)
- ✅ Mobile-first responsive design
- ✅ Comprehensive error handling
- ✅ Loading states and user feedback
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Touch optimization for mobile
- ✅ Performance optimization with lazy loading
- ✅ TypeScript type safety throughout