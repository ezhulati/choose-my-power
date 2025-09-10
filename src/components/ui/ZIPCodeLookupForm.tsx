/**
 * ZIPCodeLookupForm React Component - Enhanced for ZIP Navigation
 * Phase 3.4 Enhancement: Integrated with ZIP routing service and caching
 * Task T028: ZIP lookup modal integration with enhanced routing
 * Constitutional compliance: Texas design system with responsive mobile-first design
 */

import React, { useState, useCallback } from 'react';
import type { 
  ZIPNavigationRequest,
  ZIPNavigationResponse,
  ZIPErrorCode,
  ZIPRoutingResult
} from '../../types/zip-navigation';

interface ZIPCodeLookupFormProps {
  cityName?: string;
  placeholder?: string;
  className?: string;
  onSuccess?: (response: ZIPRoutingResult) => void;
  onError?: (error: string) => void;
  showPerformanceMetrics?: boolean; // Show cache performance for development
}

export const ZIPCodeLookupForm: React.FC<ZIPCodeLookupFormProps> = ({
  cityName = 'your area',
  placeholder = 'Enter 5-digit ZIP code',
  className = '',
  onSuccess,
  onError,
  showPerformanceMetrics = false
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

  // Validate ZIP code format (client-side)
  const isZipValid = zipCode.length === 5 && /^\d{5}$/.test(zipCode);

  // Handle ZIP code input
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

      // Use the working ZIP lookup service
      const response = await fetch(`/api/zip-lookup?zip=${encodeURIComponent(zipCode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const clientResponseTime = Date.now() - startTime;

      // Store performance data for display
      setPerformanceData({
        responseTime: data.validationTime || clientResponseTime,
        cached: false, // No cache in new API yet
        cacheSource: undefined
      });

      if (data.success) {
        // Success - redirect to plans page
        if (onSuccess) {
          onSuccess({
            success: true,
            data: {
              zipCode: zipCode,
              redirectUrl: data.redirectUrl,
              cityName: data.cityDisplayName,
              marketStatus: 'active'
            }
          });
        } else {
          window.location.href = data.redirectUrl;
        }
      } else {
        // Handle error response with enhanced recovery information
        const errorMsg = data.error || 'Unable to process your ZIP code right now. Please try again or browse all electricity plans →';
        setError(errorMsg);
        
        // Handle municipal utility case
        if (data.municipalUtility) {
          setHelpfulTips([
            `${data.cityDisplayName} is served by ${data.utilityName}`,
            'Municipal utility customers cannot choose their electricity provider',
            'Browse our educational resources to learn more about electricity markets'
          ]);
        } else {
          setHelpfulTips([
            'Try entering a different ZIP code',
            'Browse all electricity plans by city',
            'Contact us if you believe this ZIP code should be supported'
          ]);
        }
        
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[ZIPCodeLookupForm] Routing error:', err);
      const errorMsg = 'Service temporarily unavailable. Please try again.';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, isZipValid, isLoading, onSuccess, onError]);

  // Handle suggestion click
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
      const form = document.querySelector('[data-testid="zip-form"]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Form Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-texas-navy mb-2">
          Find Plans for {cityName}
        </h3>
        <p className="text-gray-600 text-sm">
          Enter your ZIP code to see electricity plans available in your area
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="zip-form">
        <div>
          <label 
            htmlFor="zipCode" 
            className="block text-sm font-semibold text-texas-navy mb-2"
          >
            ZIP Code
          </label>
          
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={zipCode}
            onChange={handleZipChange}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 text-lg font-medium
              border-2 rounded-lg
              focus:ring-4 focus:outline-none
              transition-all duration-200
              ${error 
                ? 'border-texas-red focus:border-texas-red focus:ring-red-200' 
                : 'border-gray-300 focus:border-texas-red focus:ring-red-200'
              }
            `}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="postal-code"
            data-testid="zip-input"
            disabled={isLoading}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isZipValid || isLoading}
          className={`
            w-full px-6 py-3 font-semibold rounded-lg text-lg
            transition-all duration-200
            focus:ring-4 focus:ring-red-200 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isLoading 
              ? 'bg-gray-400 text-white cursor-wait' 
              : isZipValid
                ? 'bg-texas-red text-white hover:bg-red-700 active:scale-95'
                : 'bg-gray-300 text-gray-500'
            }
          `}
          data-testid="zip-submit"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validating ZIP Code...
            </span>
          ) : (
            'Find Plans'
          )}
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="zip-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-red-800">
                ZIP Code Error
              </h4>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
              
              {/* Recovery Actions */}
              {recoveryActions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800">What you can do:</p>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {recoveryActions.map((action, index) => (
                      <li key={index}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800">
                    Try these suggested ZIP codes:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 text-sm bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpful Tips */}
              {helpfulTips.length > 0 && (
                <div className="mt-3">
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

      {/* Performance metrics (development mode) */}
      {showPerformanceMetrics && performanceData && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-semibold text-blue-800 mb-2">Performance Metrics</h5>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-blue-600 font-medium">Response Time:</span>
              <br />
              <span className="text-blue-800">{performanceData.responseTime}ms</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Cache Status:</span>
              <br />
              <span className={`${performanceData.cached ? 'text-green-600' : 'text-orange-600'}`}>
                {performanceData.cached ? 'HIT' : 'MISS'}
              </span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Cache Source:</span>
              <br />
              <span className="text-blue-800">
                {performanceData.cacheSource || 'fresh'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          This tool helps you find electricity plans available in your specific ZIP code area.
        </p>
      </div>
    </div>
  );
};

export default ZIPCodeLookupForm;