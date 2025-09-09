/**
 * Mobile-Responsive ZIP Code Lookup Form
 * Task T032: Mobile-optimized ZIP lookup with touch-friendly interactions
 * Phase 3.5 Polish & Validation: Responsive design with mobile-first approach
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { 
  ZIPRoutingResult
} from '../../types/zip-navigation';

interface MobileZIPLookupFormProps {
  cityName?: string;
  placeholder?: string;
  className?: string;
  onSuccess?: (response: ZIPRoutingResult) => void;
  onError?: (error: string) => void;
  showPerformanceMetrics?: boolean;
  variant?: 'compact' | 'hero' | 'inline';
}

export const MobileZIPLookupForm: React.FC<MobileZIPLookupFormProps> = ({
  cityName = 'your area',
  placeholder = 'Enter ZIP code',
  className = '',
  onSuccess,
  onError,
  showPerformanceMetrics = false,
  variant = 'compact'
}) => {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<string[]>([]);
  const [helpfulTips, setHelpfulTips] = useState<string[]>([]);
  const [performanceData, setPerformanceData] = useState<{
    responseTime: number;
    cached: boolean;
    cacheSource?: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate ZIP code format (client-side)
  const isZipValid = zipCode.length === 5 && /^\d{5}$/.test(zipCode);

  // Handle ZIP code input with mobile optimizations
  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
    setError('');
    setSuggestions([]);
    setRecoveryActions([]);
    setHelpfulTips([]);
  }, []);

  // Handle form submission with enhanced ZIP routing service
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isZipValid || isLoading) return;

    setIsLoading(true);
    setError('');
    setSuggestions([]);
    setRecoveryActions([]);
    setHelpfulTips([]);
    setPerformanceData(null);

    try {
      const startTime = Date.now();

      const response = await fetch('/api/zip/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ zipCode })
      });

      const data: ZIPRoutingResult = await response.json();
      const clientResponseTime = Date.now() - startTime;

      // Store performance data for display
      setPerformanceData({
        responseTime: data.responseTime,
        cached: data.cached,
        cacheSource: response.headers.get('X-Cache-Source') || undefined
      });

      if (data.success && data.data) {
        // Success - redirect to plans page
        if (onSuccess) {
          onSuccess(data);
        } else {
          window.location.href = data.data.redirectUrl;
        }
      } else {
        // Handle error response with enhanced recovery information
        const errorMsg = data.error?.message || 'ZIP code validation failed';
        setError(errorMsg);
        setSuggestions(data.error?.suggestions || []);
        setRecoveryActions(data.error?.recoveryActions || []);
        setHelpfulTips(data.error?.helpfulTips || []);
        setIsExpanded(true); // Auto-expand on mobile for better visibility
        
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[MobileZIPLookupForm] Routing error:', err);
      const errorMsg = 'Service temporarily unavailable. Please try again.';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, isZipValid, isLoading, onSuccess, onError]);

  // Handle suggestion click with haptic feedback simulation
  const handleSuggestionClick = useCallback((suggestedZip: string) => {
    // Extract just the ZIP code part (remove description)
    const cleanZip = suggestedZip.split(' ')[0];
    setZipCode(cleanZip);
    setError('');
    setSuggestions([]);
    setRecoveryActions([]);
    setHelpfulTips([]);
    
    // Auto-submit with suggested ZIP
    setTimeout(() => {
      const form = document.querySelector('[data-testid="mobile-zip-form"]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  }, []);

  // Handle focus and blur events for mobile optimization
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // On mobile, scroll the form into view
    setTimeout(() => {
      const element = document.querySelector('[data-testid="mobile-zip-form"]');
      if (element && window.innerWidth < 768) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Render variant-specific styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'hero':
        return 'bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mx-4';
      case 'inline':
        return 'bg-gray-50 rounded-xl border border-gray-300 p-4';
      case 'compact':
      default:
        return 'bg-white rounded-xl shadow-md border border-gray-200 p-4';
    }
  };

  const getInputClasses = () => {
    const baseClasses = `
      w-full px-4 py-4 text-lg font-medium
      border-2 rounded-xl
      focus:ring-4 focus:outline-none
      transition-all duration-200
      touch-manipulation
      ${isFocused ? 'transform scale-[1.02]' : ''}
    `;
    
    if (error) {
      return `${baseClasses} border-texas-red focus:border-texas-red focus:ring-red-200`;
    }
    return `${baseClasses} border-gray-300 focus:border-texas-red focus:ring-red-200`;
  };

  const getButtonClasses = () => {
    const baseClasses = `
      w-full px-6 py-4 font-semibold rounded-xl text-lg
      transition-all duration-200 touch-manipulation
      focus:ring-4 focus:ring-red-200 focus:outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isLoading ? 'active:scale-95' : ''}
    `;
    
    if (isLoading) {
      return `${baseClasses} bg-gray-400 text-white cursor-wait`;
    } else if (isZipValid) {
      return `${baseClasses} bg-texas-red text-white hover:bg-red-700 active:scale-95 active:bg-red-800`;
    } else {
      return `${baseClasses} bg-gray-300 text-gray-500`;
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {/* Form Header */}
      <div className={`mb-4 ${variant === 'compact' ? 'text-center' : ''}`}>
        <h3 className={`font-bold text-texas-navy mb-2 ${
          variant === 'hero' ? 'text-2xl' : 
          variant === 'inline' ? 'text-lg' : 'text-xl'
        }`}>
          {variant === 'hero' ? `Find Electricity Plans` : `Plans for ${cityName}`}
        </h3>
        {variant !== 'compact' && (
          <p className="text-gray-600 text-sm">
            Enter your ZIP code to see electricity plans available in your area
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="mobile-zip-form">
        <div>
          <label 
            htmlFor="mobileZipCode" 
            className="block text-sm font-semibold text-texas-navy mb-2"
          >
            ZIP Code
          </label>
          
          <input
            type="tel"
            id="mobileZipCode"
            name="zipCode"
            value={zipCode}
            onChange={handleZipChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={getInputClasses()}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="postal-code"
            data-testid="mobile-zip-input"
            disabled={isLoading}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isZipValid || isLoading}
          className={getButtonClasses()}
          data-testid="mobile-zip-submit"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching Plans...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Find Plans
            </span>
          )}
        </button>
      </form>

      {/* Error display with mobile optimizations */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl" data-testid="mobile-zip-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-red-800">
                ZIP Code Error
              </h4>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
              
              {/* Recovery Actions */}
              {recoveryActions.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center text-sm font-medium text-red-800 hover:text-red-900 touch-manipulation"
                  >
                    What you can do
                    <svg 
                      className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {isExpanded && (
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {recoveryActions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Suggestions - Always visible on mobile for quick access */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-800 mb-3">
                    Try these ZIP codes:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 text-sm bg-white border border-red-300 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpful Tips - Expandable on mobile to save space */}
              {helpfulTips.length > 0 && isExpanded && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-800">💡 Helpful Tips:</p>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {helpfulTips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance metrics (development mode) - Minimal on mobile */}
      {showPerformanceMetrics && performanceData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="text-blue-600 font-medium">
              {performanceData.responseTime}ms
            </span>
            <span className={`font-medium ${performanceData.cached ? 'text-green-600' : 'text-orange-600'}`}>
              {performanceData.cached ? 'Cached' : 'Fresh'}
            </span>
          </div>
        </div>
      )}

      {/* Mobile-optimized help text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Find electricity plans available in your ZIP code area
        </p>
      </div>
    </div>
  );
};

export default MobileZIPLookupForm;