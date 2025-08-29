/**
 * Enterprise ZIP Code Search Component
 * 
 * Professional search component with comprehensive functionality including:
 * - Advanced validation and error handling
 * - Search suggestions and autocomplete
 * - Recent searches and favorites
 * - Texas branding and responsive design
 * - Analytics tracking and accessibility
 * 
 * @component ZipCodeSearch
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  X, 
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElectricityPlans } from '@/hooks/useElectricityPlans';

interface SearchSuggestion {
  id: string;
  type: 'recent' | 'popular' | 'suggestion';
  zipCode: string;
  city?: string;
  planCount?: number;
  label: string;
  metadata?: {
    tdspName?: string;
    averageRate?: number;
    lastSearched?: number;
  };
}

export interface ZipCodeSearchProps {
  /** Custom search handler - if not provided, uses default navigation */
  onSearch?: (zipCode: string) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual style variant */
  variant?: 'default' | 'texas' | 'hero' | 'minimal';
  /** Show search suggestions dropdown */
  showSuggestions?: boolean;
  /** Show recent searches */
  showRecents?: boolean;
  /** Show popular ZIP codes */
  showPopular?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Success callback */
  onSuccess?: (response: any) => void;
  /** Error callback */
  onError?: (error: any) => void;
}

export function ZipCodeSearch({
  onSearch,
  placeholder = "Enter your Texas ZIP code",
  size = 'md',
  variant = 'texas',
  showSuggestions = true,
  showRecents = true,
  showPopular = true,
  className,
  autoFocus = false,
  disabled = false,
  loading: externalLoading = false,
  onSuccess,
  onError
}: ZipCodeSearchProps) {
  // Hooks
  const {
    zipCode,
    isZipValid,
    isLoading,
    error,
    searchHistory,
    favorites,
    setZipCode,
    searchPlans,
    clearError,
    trackEvent
  } = useElectricityPlans({
    autoSearch: false,
    enableAnalytics: true,
    onSearchComplete: onSuccess,
    onError
  });

  // Local state
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Generate suggestions
  const generateSuggestions = useCallback(() => {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    if (showRecents && searchHistory.length > 0) {
      searchHistory.slice(0, 3).forEach(history => {
        suggestions.push({
          id: `recent_${history.id}`,
          type: 'recent',
          zipCode: history.zipCode,
          city: history.city,
          planCount: history.planCount,
          label: history.city 
            ? `${history.zipCode} - ${history.city}` 
            : history.zipCode,
          metadata: {
            tdspName: history.tdspName,
            lastSearched: history.timestamp
          }
        });
      });
    }

    // Popular ZIP codes (mock data - in production, fetch from API)
    if (showPopular && suggestions.length < 5) {
      const popularZips = [
        { zip: '77001', city: 'Houston', plans: 45, rate: 12.5 },
        { zip: '75201', city: 'Dallas', plans: 52, rate: 11.8 },
        { zip: '78701', city: 'Austin', plans: 38, rate: 10.9 },
        { zip: '78401', city: 'Corpus Christi', plans: 28, rate: 13.2 },
        { zip: '76101', city: 'Fort Worth', plans: 41, rate: 12.1 }
      ];

      popularZips
        .filter(pop => !suggestions.some(s => s.zipCode === pop.zip))
        .slice(0, 5 - suggestions.length)
        .forEach(pop => {
          suggestions.push({
            id: `popular_${pop.zip}`,
            type: 'popular',
            zipCode: pop.zip,
            city: pop.city,
            planCount: pop.plans,
            label: `${pop.zip} - ${pop.city}`,
            metadata: {
              averageRate: pop.rate
            }
          });
        });
    }

    setSuggestions(suggestions);
  }, [searchHistory, showRecents, showPopular]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!hasBeenFocused) {
      setHasBeenFocused(true);
      trackEvent('search_input_focus', { variant, size });
    }
    
    if (showSuggestions) {
      generateSuggestions();
      setShowDropdown(true);
    }
    clearError();
  }, [hasBeenFocused, showSuggestions, generateSuggestions, trackEvent, variant, size, clearError]);

  // Handle input blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
    
    if (value.length > 0 && showSuggestions) {
      // Filter suggestions based on input
      const filtered = suggestions.filter(s => 
        s.zipCode.startsWith(value) || 
        s.city?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowDropdown(true);
    } else if (showSuggestions) {
      generateSuggestions();
      setShowDropdown(true);
    }
  }, [setZipCode, showSuggestions, suggestions, generateSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e as any);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > -1 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSubmit(e as any);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, suggestions, highlightedIndex]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setZipCode(suggestion.zipCode);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    trackEvent('suggestion_selected', {
      type: suggestion.type,
      zipCode: suggestion.zipCode,
      city: suggestion.city
    });

    // Trigger search
    setTimeout(() => {
      if (onSearch) {
        onSearch(suggestion.zipCode);
      } else {
        searchPlans({ zipCode: suggestion.zipCode });
      }
    }, 100);
  }, [setZipCode, trackEvent, onSearch, searchPlans]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isZipValid || disabled) {
      return;
    }

    trackEvent('search_submitted', {
      zipCode,
      variant,
      method: 'form_submit'
    });

    setShowDropdown(false);

    if (onSearch) {
      onSearch(zipCode);
    } else {
      await searchPlans({ zipCode });
    }
  }, [zipCode, isZipValid, disabled, onSearch, searchPlans, trackEvent, variant]);

  // Size configurations
  const sizeConfig = {
    sm: {
      input: 'h-9 text-sm px-3',
      icon: 'h-4 w-4',
      button: 'h-9 px-3 text-sm',
      dropdown: 'text-sm'
    },
    md: {
      input: 'h-11 text-base px-4',
      icon: 'h-5 w-5',
      button: 'h-11 px-4 text-base',
      dropdown: 'text-base'
    },
    lg: {
      input: 'h-14 text-lg px-5',
      icon: 'h-6 w-6',
      button: 'h-14 px-6 text-lg',
      dropdown: 'text-base'
    },
    xl: {
      input: 'h-16 text-xl px-6',
      icon: 'h-7 w-7',
      button: 'h-16 px-8 text-xl',
      dropdown: 'text-lg'
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      container: 'bg-background border border-input rounded-lg',
      input: 'bg-transparent border-0 focus:ring-2 focus:ring-ring',
      button: 'bg-primary text-primary-foreground hover:bg-primary/90',
      dropdown: 'bg-background border border-input'
    },
    texas: {
      container: 'bg-white border-2 border-texas-navy/20 rounded-xl shadow-lg hover:shadow-xl hover:border-texas-navy/40 transition-all duration-300',
      input: 'bg-transparent border-0 focus:ring-0 text-texas-navy placeholder:text-texas-navy/50',
      button: 'bg-gradient-to-r from-texas-red-500 to-texas-red-600 text-white hover:from-texas-red-600 hover:to-texas-red-700 shadow-lg',
      dropdown: 'bg-white border-2 border-texas-navy/20 shadow-xl'
    },
    hero: {
      container: 'bg-gradient-to-r from-white to-texas-cream-100 border-2 border-texas-gold/30 rounded-2xl shadow-2xl',
      input: 'bg-transparent border-0 focus:ring-0 text-texas-navy placeholder:text-texas-navy/60 font-medium',
      button: 'bg-gradient-to-r from-texas-navy to-blue-800 text-white hover:from-texas-navy/90 hover:to-blue-800/90 shadow-xl',
      dropdown: 'bg-white border-2 border-texas-gold/30 shadow-2xl'
    },
    minimal: {
      container: 'bg-gray-50 border border-gray-200 rounded-lg',
      input: 'bg-transparent border-0 focus:ring-1 focus:ring-gray-400',
      button: 'bg-gray-600 text-white hover:bg-gray-700',
      dropdown: 'bg-white border border-gray-200'
    }
  };

  const config = sizeConfig[size];
  const style = variantConfig[variant];
  const isLoadingState = isLoading || externalLoading;

  return (
    <div className={cn('relative w-full max-w-lg', className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Main Input Container */}
        <div className={cn(
          'relative flex items-center transition-all duration-300',
          style.container,
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          {/* Location Icon */}
          <div className="absolute left-0 pl-4 flex items-center pointer-events-none z-10">
            <MapPin className={cn(
              config.icon,
              variant === 'texas' ? 'text-texas-navy/60' : 'text-muted-foreground'
            )} />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={zipCode}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={5}
            className={cn(
              'flex-1 pl-12 pr-20',
              config.input,
              style.input,
              'focus:outline-none transition-all duration-200',
              disabled && 'cursor-not-allowed'
            )}
            aria-label="ZIP code search"
            aria-describedby={error ? 'zip-error' : undefined}
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            role="combobox"
          />

          {/* Status Indicator */}
          <div className="absolute right-14 flex items-center pointer-events-none">
            {isLoadingState ? (
              <div className="animate-spin">
                <Zap className={cn(config.icon, 'text-texas-gold')} />
              </div>
            ) : zipCode.length === 5 ? (
              isZipValid ? (
                <CheckCircle className={cn(config.icon, 'text-green-500')} />
              ) : (
                <AlertCircle className={cn(config.icon, 'text-red-500')} />
              )
            ) : null}
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            size={size === 'xl' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
            disabled={!isZipValid || disabled || isLoadingState}
            className={cn(
              'absolute right-0 m-1 rounded-lg',
              config.button,
              style.button,
              'transition-all duration-200 flex items-center justify-center gap-2'
            )}
            aria-label="Search electricity plans"
          >
            {isLoadingState ? (
              <div className="animate-spin">
                <Search className={config.icon} />
              </div>
            ) : (
              <>
                <Search className={config.icon} />
                {size === 'xl' && <span>Search</span>}
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div id="zip-error" className="mt-2 flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error.userMessage}</span>
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={dropdownRef}
          className={cn(
            'absolute top-full left-0 right-0 z-50 mt-2',
            style.dropdown,
            'rounded-xl overflow-hidden'
          )}
        >
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                    config.dropdown,
                    index === highlightedIndex 
                      ? 'bg-texas-gold/10 text-texas-navy' 
                      : 'hover:bg-gray-50',
                    index > 0 && 'border-t border-gray-100'
                  )}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full',
                      suggestion.type === 'recent' 
                        ? 'bg-blue-100 text-blue-600'
                        : suggestion.type === 'popular'
                        ? 'bg-texas-gold/20 text-texas-gold-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {suggestion.type === 'recent' ? (
                        <Clock className="w-4 h-4" />
                      ) : suggestion.type === 'popular' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {suggestion.label}
                      </div>
                      {suggestion.planCount && (
                        <div className="text-sm text-gray-500">
                          {suggestion.planCount} plans available
                          {suggestion.metadata?.averageRate && (
                            <span className="ml-2">• avg {suggestion.metadata.averageRate.toFixed(1)}¢/kWh</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {suggestion.type === 'recent' && (
                      <Badge variant="secondary" className="text-xs">Recent</Badge>
                    )}
                    {suggestion.type === 'popular' && (
                      <Badge variant="outline" className="text-xs border-texas-gold text-texas-gold-700">
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export component with enhanced display name for debugging
ZipCodeSearch.displayName = 'ZipCodeSearch';