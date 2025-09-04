/**
 * ZipCodeSearchAPI Component - Production Integration
 * 
 * Enhanced ZIP code search component that integrates with the production-ready
 * Netlify Functions and API hooks. Designed to work alongside the existing
 * ZipCodeSearch component while providing direct API integration.
 * 
 * Features:
 * - Direct integration with /search-plans and /lookup-esiid Netlify Functions
 * - Progressive address input for split ZIP codes
 * - Real-time validation with Texas design system
 * - WCAG AA accessibility compliance
 * - Mobile-first responsive design
 * - Smart caching and error handling
 * 
 * @module ZipCodeSearchAPI
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useElectricityPlansAPI } from '../hooks/useElectricityPlansAPI';
import { useESIIDLookup } from '../hooks/useESIIDLookup';
import type { Plan, PlanFilters } from '../hooks/useElectricityPlansAPI';

// Component interfaces
export interface ZipCodeSearchAPIProps {
  /** Callback when search results are found */
  onResults?: (results: {
    plans: Plan[];
    zipCode: string;
    address?: string;
    meta: {
      totalPlans: number;
      method: string;
      responseTime: number;
      confidence: string;
    };
  }) => void;
  
  /** Callback for errors */
  onError?: (error: string) => void;
  
  /** Initial values */
  initialZipCode?: string;
  initialAddress?: string;
  
  /** Search configuration */
  defaultUsage?: number;
  filters?: PlanFilters;
  
  /** UI configuration */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'texas' | 'hero';
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  
  /** Placeholders */
  zipPlaceholder?: string;
  addressPlaceholder?: string;
  
  /** Feature flags */
  showUsageSelector?: boolean;
  showAdvancedFilters?: boolean;
}

interface SearchState {
  zipCode: string;
  address: string;
  usage: number;
  isZipValid: boolean;
  isAddressValid: boolean;
  showAddressInput: boolean;
  hasInteracted: boolean;
  searchAttempted: boolean;
}

/**
 * Enhanced ZIP code search component with API integration
 */
export const ZipCodeSearchAPI: React.FC<ZipCodeSearchAPIProps> = ({
  onResults,
  onError,
  initialZipCode = '',
  initialAddress = '',
  defaultUsage = 1000,
  filters = {},
  size = 'lg',
  variant = 'texas',
  className = '',
  autoFocus = true,
  disabled = false,
  zipPlaceholder = 'Enter Texas ZIP code (e.g., 75201)',
  addressPlaceholder = 'Enter your full address',
  showUsageSelector = true,
  showAdvancedFilters = false
}) => {
  // Component state
  const [state, setState] = useState<SearchState>({
    zipCode: initialZipCode,
    address: initialAddress,
    usage: defaultUsage,
    isZipValid: initialZipCode.length === 5 && /^\d{5}$/.test(initialZipCode),
    isAddressValid: initialAddress.length >= 5,
    showAddressInput: false,
    hasInteracted: false,
    searchAttempted: false
  });

  // Refs
  const zipInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // API Hooks - controlled manually
  const planSearch = useElectricityPlansAPI({
    zipCode: state.zipCode,
    address: state.address,
    usage: state.usage,
    filters,
    enabled: false // Manual control
  });

  const esiidLookup = useESIIDLookup({
    address: state.address,
    zipCode: state.zipCode,
    usage: state.usage,
    enabled: false // Manual control
  });

  // Validation functions
  const validateZipCode = useCallback((zip: string): boolean => {
    if (!/^\d{5}$/.test(zip)) return false;
    // Texas ZIP codes start with 7
    return zip.startsWith('7');
  }, []);

  const validateAddress = useCallback((address: string): boolean => {
    if (!address || address.trim().length < 5) return false;
    // Basic pattern: number followed by street name
    return /^\d+\s+.{3,}/.test(address.trim());
  }, []);

  // Handle ZIP code changes
  const handleZipCodeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 5);
    const isValid = value.length === 5 && validateZipCode(value);
    
    setState(prev => ({
      ...prev,
      zipCode: value,
      isZipValid: isValid,
      hasInteracted: true,
      // Reset dependent state when ZIP changes
      address: prev.zipCode !== value ? '' : prev.address,
      isAddressValid: prev.zipCode !== value ? false : prev.isAddressValid,
      showAddressInput: false,
      searchAttempted: false
    }));
  }, [validateZipCode]);

  // Handle address changes
  const handleAddressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const isValid = validateAddress(value);
    
    setState(prev => ({
      ...prev,
      address: value,
      isAddressValid: isValid
    }));
  }, [validateAddress]);

  // Handle usage changes
  const handleUsageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const usage = parseInt(event.target.value, 10);
    setState(prev => ({ ...prev, usage }));
  }, []);

  // Main search function
  const performSearch = useCallback(async () => {
    if (!state.isZipValid) {
      onError?.('Please enter a valid Texas ZIP code');
      zipInputRef.current?.focus();
      return;
    }

    setState(prev => ({ ...prev, searchAttempted: true }));

    try {
      // Start with a plan search to check if this is a split ZIP
      await planSearch.search({
        zipCode: state.zipCode,
        address: state.address || undefined,
        usage: state.usage
      });

      // If it's a split ZIP and we don't have address, show address input
      if (planSearch.splitZipInfo?.isMultiTdsp && !state.isAddressValid) {
        setState(prev => ({ ...prev, showAddressInput: true }));
        setTimeout(() => addressInputRef.current?.focus(), 100);
        return;
      }

      // If we have address for split ZIP, do ESIID lookup first
      if (planSearch.splitZipInfo?.isMultiTdsp && state.isAddressValid) {
        await esiidLookup.lookup();
        
        // Then search with resolved TDSP
        if (esiidLookup.resolution) {
          await planSearch.refetch();
        }
      }

    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [state, planSearch, esiidLookup, onError]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    await performSearch();
  }, [performSearch]);

  // Handle Enter key in address input
  const handleAddressKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && state.isAddressValid) {
      event.preventDefault();
      performSearch();
    }
  }, [performSearch, state.isAddressValid]);

  // Effect to handle successful results
  useEffect(() => {
    if (planSearch.plans.length > 0 && planSearch.searchMeta && planSearch.tdspInfo) {
      onResults?({
        plans: planSearch.plans,
        zipCode: state.zipCode,
        address: state.address || undefined,
        meta: {
          totalPlans: planSearch.searchMeta.totalPlans,
          method: planSearch.searchMeta.method,
          responseTime: planSearch.searchMeta.responseTime,
          confidence: planSearch.tdspInfo?.confidence || 'unknown'
        }
      });
    }
  }, [planSearch.plans, planSearch.searchMeta, planSearch.tdspInfo, state, onResults]);

  // Effect to handle errors
  useEffect(() => {
    if (planSearch.error) {
      onError?.(planSearch.error);
    }
    if (esiidLookup.error) {
      onError?.(esiidLookup.error);
    }
  }, [planSearch.error, esiidLookup.error, onError]);

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && zipInputRef.current) {
      zipInputRef.current.focus();
    }
  }, [autoFocus]);

  // Size and variant configurations
  const sizeConfig = {
    sm: { input: 'h-10 text-sm px-4', icon: 'h-4 w-4', button: 'h-10 px-4 text-sm' },
    md: { input: 'h-12 text-base px-4', icon: 'h-5 w-5', button: 'h-12 px-6 text-base' },
    lg: { input: 'h-14 text-lg px-5', icon: 'h-6 w-6', button: 'h-14 px-8 text-lg' },
    xl: { input: 'h-16 text-xl px-6', icon: 'h-7 w-7', button: 'h-16 px-10 text-xl' }
  };

  const variantConfig = {
    default: {
      container: 'bg-white border-2 border-gray-200 rounded-lg',
      input: 'bg-transparent border-0 focus:ring-2 focus:ring-texas-navy',
      button: 'bg-texas-navy text-white hover:bg-texas-navy/90'
    },
    texas: {
      container: 'bg-white border-2 border-texas-navy/20 rounded-xl shadow-lg hover:shadow-xl hover:border-texas-navy/40 transition-all duration-300',
      input: 'bg-transparent border-0 focus:ring-0 text-texas-navy placeholder:text-texas-navy/50',
      button: 'bg-gradient-to-r from-texas-red-500 to-texas-red-600 text-white hover:from-texas-red-600 hover:to-texas-red-700 shadow-lg'
    },
    hero: {
      container: 'bg-gradient-to-r from-white to-texas-cream-100 border-2 border-texas-gold/30 rounded-2xl shadow-2xl',
      input: 'bg-transparent border-0 focus:ring-0 text-texas-navy placeholder:text-texas-navy/60 font-medium',
      button: 'bg-gradient-to-r from-texas-navy to-blue-800 text-white hover:from-texas-navy/90 hover:to-blue-800/90 shadow-xl'
    }
  };

  const config = sizeConfig[size];
  const style = variantConfig[variant];
  const isLoading = planSearch.isLoading || esiidLookup.isLookingUp;
  const isSearching = planSearch.isSearching;

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* ZIP Code Input */}
        <div className="space-y-2">
          <label htmlFor="zip-input-api" className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          
          <div className={cn('relative flex items-center', style.container)}>
            <div className="absolute left-4 flex items-center pointer-events-none z-10">
              <MapPin className={cn(config.icon, 'text-texas-navy/60')} />
            </div>
            
            <input
              ref={zipInputRef}
              id="zip-input-api"
              type="tel"
              inputMode="numeric"
              value={state.zipCode}
              onChange={handleZipCodeChange}
              placeholder={zipPlaceholder}
              className={cn(
                'flex-1 pl-12 pr-12',
                config.input,
                style.input,
                'focus:outline-none transition-all duration-200'
              )}
              maxLength={5}
              disabled={disabled}
              autoComplete="postal-code"
              aria-invalid={state.hasInteracted && !state.isZipValid}
            />
            
            {/* Status Icon */}
            <div className="absolute right-4 flex items-center">
              {state.zipCode && (
                state.isZipValid ? (
                  <CheckCircle className={cn(config.icon, 'text-green-500')} />
                ) : state.hasInteracted ? (
                  <AlertCircle className={cn(config.icon, 'text-red-500')} />
                ) : null
              )}
            </div>
          </div>

          {state.hasInteracted && !state.isZipValid && state.zipCode && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Please enter a valid Texas ZIP code (starts with 7)
            </p>
          )}
        </div>

        {/* Address Input - Progressive Enhancement */}
        {state.showAddressInput && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <label htmlFor="address-input-api" className="block text-sm font-medium text-gray-700">
              Address <span className="text-red-500">*</span>
            </label>
            
            <div className={cn('relative flex items-center', style.container)}>
              <div className="absolute left-4 flex items-center pointer-events-none z-10">
                <MapPin className={cn(config.icon, 'text-texas-navy/60')} />
              </div>
              
              <input
                ref={addressInputRef}
                id="address-input-api"
                type="text"
                value={state.address}
                onChange={handleAddressChange}
                onKeyDown={handleAddressKeyDown}
                placeholder={addressPlaceholder}
                className={cn(
                  'flex-1 pl-12 pr-12',
                  config.input,
                  style.input,
                  'focus:outline-none transition-all duration-200'
                )}
                disabled={disabled}
                autoComplete="street-address"
              />
              
              {state.address && (
                <div className="absolute right-4 flex items-center">
                  {state.isAddressValid ? (
                    <CheckCircle className={cn(config.icon, 'text-green-500')} />
                  ) : (
                    <AlertCircle className={cn(config.icon, 'text-yellow-500')} />
                  )}
                </div>
              )}
            </div>

            {!state.isAddressValid && state.address && (
              <p className="text-sm text-yellow-600 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Please enter a complete address (e.g., 123 Main Street)
              </p>
            )}
          </div>
        )}

        {/* Usage Selector */}
        {showUsageSelector && (
          <div className="space-y-2">
            <label htmlFor="usage-select-api" className="block text-sm font-medium text-gray-700">
              Monthly Usage (kWh)
            </label>
            <select
              id="usage-select-api"
              value={state.usage}
              onChange={handleUsageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red-200 focus:border-texas-red"
            >
              <option value={500}>500 kWh - Small home or apartment</option>
              <option value={1000}>1,000 kWh - Average home</option>
              <option value={1500}>1,500 kWh - Large home</option>
              <option value={2000}>2,000 kWh - Very large home</option>
            </select>
          </div>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={!state.isZipValid || (state.showAddressInput && !state.isAddressValid) || disabled || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-3 transition-all duration-200',
            config.button,
            style.button,
            'rounded-xl font-semibold',
            (!state.isZipValid || (state.showAddressInput && !state.isAddressValid) || disabled || isLoading) && 
            'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <div className="animate-spin">
                <Zap className={config.icon} />
              </div>
              {isSearching ? 'Searching Plans...' : 'Resolving Address...'}
            </>
          ) : (
            <>
              <Search className={config.icon} />
              Find My Best Rates
              <ChevronRight className={config.icon} />
            </>
          )}
        </button>
      </form>

      {/* Split ZIP Information */}
      {planSearch.splitZipInfo?.isMultiTdsp && (
        <div className="mt-4 p-4 bg-texas-gold-50 border border-texas-gold-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-texas-gold-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-texas-gold-800">Multiple Utility Areas</h3>
              <p className="mt-1 text-sm text-texas-gold-700">
                ZIP code {state.zipCode} is served by multiple utility companies. 
                Your address helps us find the exact plans available to you.
              </p>
              {planSearch.splitZipInfo.alternativeTdsps && (
                <p className="mt-2 text-xs text-texas-gold-600">
                  Available utilities: {planSearch.splitZipInfo.alternativeTdsps.map(t => t.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESIID Resolution Success */}
      {esiidLookup.resolution && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800">Address Verified</h3>
              <p className="text-sm text-green-700">
                Your address is served by <strong>{esiidLookup.resolution.tdsp.name}</strong>
                {esiidLookup.resolution.confidence !== 'high' && 
                  <span className="ml-1">({esiidLookup.resolution.confidence} confidence)</span>
                }
              </p>
              <p className="mt-1 text-xs text-green-600">
                Matched: {esiidLookup.resolution.address.matched}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {planSearch.plans.length > 0 && planSearch.searchMeta && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800">Search Complete</h3>
              <p className="text-sm text-blue-700">
                Found <strong>{planSearch.searchMeta.totalPlans} plans</strong> for ZIP {state.zipCode}
                {state.address && <span> at {state.address}</span>}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Search method: {planSearch.searchMeta.method} • 
                Response time: {planSearch.searchMeta.responseTime}ms • 
                Usage: {state.usage} kWh
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZipCodeSearchAPI;