/**
 * WCAG 2.1 Compliant ZIP Code Form
 * Task T034: Accessible ZIP lookup form with full WCAG compliance
 * Phase 3.5 Polish & Validation: Accessibility-first implementation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ZIPRoutingResult } from '../../types/zip-navigation';

interface AccessibleZIPFormProps {
  onSuccess?: (response: ZIPRoutingResult) => void;
  onError?: (error: string) => void;
  className?: string;
  autoFocus?: boolean;
  variant?: 'compact' | 'hero' | 'inline';
  ariaLabel?: string;
  describedBy?: string;
}

export const AccessibleZIPForm: React.FC<AccessibleZIPFormProps> = ({
  onSuccess,
  onError,
  className = '',
  autoFocus = false,
  variant = 'compact',
  ariaLabel = 'Find electricity plans by ZIP code',
  describedBy
}) => {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fieldId] = useState(() => `zip-input-${Math.random().toString(36).substr(2, 9)}`);
  const [errorId] = useState(() => `zip-error-${Math.random().toString(36).substr(2, 9)}`);
  const [statusId] = useState(() => `zip-status-${Math.random().toString(36).substr(2, 9)}`);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Delay focus to ensure component is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Announce status changes to screen readers
  const announceStatus = useCallback((message: string) => {
    const statusElement = document.getElementById(statusId);
    if (statusElement) {
      statusElement.textContent = message;
    }
  }, [statusId]);

  // Validate ZIP code format
  const isZipValid = zipCode.length === 5 && /^\d{5}$/.test(zipCode);

  // Handle ZIP code input with accessibility features
  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
    
    // Clear previous errors when user starts typing
    if (error) {
      setError('');
      setSuggestions([]);
      announceStatus('Error cleared');
    }
    
    // Announce character count for screen readers
    if (value.length > 0) {
      const remaining = 5 - value.length;
      if (remaining > 0) {
        announceStatus(`${value.length} of 5 digits entered, ${remaining} remaining`);
      } else {
        announceStatus('ZIP code complete, ready to search');
      }
    }
  }, [error, announceStatus]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter if valid
    if (e.key === 'Enter' && isZipValid && !isLoading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    
    // Escape clears the field
    if (e.key === 'Escape') {
      setZipCode('');
      setError('');
      setSuggestions([]);
      announceStatus('ZIP code field cleared');
    }
  }, [isZipValid, isLoading]);

  // Handle form submission with accessibility announcements
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isZipValid || isLoading) {
      // Focus back to input if invalid
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestions([]);
    
    // Announce search start
    announceStatus('Searching for electricity plans...');

    try {
      const response = await fetch('/api/zip/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });

      const data: ZIPRoutingResult = await response.json();

      if (data.success && data.data) {
        announceStatus(`Found ${data.data.planCount || 'multiple'} electricity plans for ZIP ${zipCode}`);
        
        if (onSuccess) {
          onSuccess(data);
        } else {
          // Announce navigation
          announceStatus('Navigating to electricity plans page');
          window.location.href = data.data.redirectUrl;
        }
      } else {
        const errorMsg = data.error?.message || 'ZIP code validation failed';
        setError(errorMsg);
        setSuggestions(data.error?.suggestions || []);
        
        // Focus error for screen reader announcement
        setTimeout(() => {
          errorRef.current?.focus();
        }, 100);
        
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[AccessibleZIPForm] Error:', err);
      const errorMsg = 'Service temporarily unavailable. Please try again.';
      setError(errorMsg);
      
      // Focus error for screen reader announcement
      setTimeout(() => {
        errorRef.current?.focus();
      }, 100);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, isZipValid, isLoading, onSuccess, onError, announceStatus]);

  // Handle suggestion selection with keyboard support
  const handleSuggestionClick = useCallback((suggestion: string) => {
    const cleanZip = suggestion.split(' ')[0];
    setZipCode(cleanZip);
    setError('');
    setSuggestions([]);
    
    announceStatus(`Selected ZIP code ${cleanZip}`);
    
    // Focus back to submit button
    setTimeout(() => {
      submitButtonRef.current?.focus();
    }, 100);
  }, [announceStatus]);

  // Handle suggestion keyboard navigation
  const handleSuggestionKeyDown = useCallback((e: React.KeyboardEvent, suggestion: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSuggestionClick(suggestion);
    }
  }, [handleSuggestionClick]);

  // Generate ARIA attributes
  const inputAriaAttributes = {
    'aria-label': ariaLabel,
    'aria-describedby': [
      describedBy,
      error ? errorId : null,
      statusId
    ].filter(Boolean).join(' '),
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': 'true'
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return 'bg-white rounded-2xl shadow-xl border border-gray-200 p-8';
      case 'inline':
        return 'bg-gray-50 rounded-xl border border-gray-300 p-4';
      case 'compact':
      default:
        return 'bg-white rounded-xl shadow-md border border-gray-200 p-6';
    }
  };

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      {/* Screen reader live region for status announcements */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Form header */}
      <div className="mb-6">
        <h2 className={`font-bold text-texas-navy mb-3 ${
          variant === 'hero' ? 'text-2xl' : 
          variant === 'inline' ? 'text-lg' : 'text-xl'
        }`}>
          Find Electricity Plans
        </h2>
        <p className="text-gray-600">
          Enter your 5-digit ZIP code to see available electricity plans in your area
        </p>
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label 
            htmlFor={fieldId}
            className="block text-sm font-semibold text-texas-navy mb-2"
          >
            ZIP Code <span className="text-texas-red" aria-label="required">*</span>
          </label>
          
          <input
            ref={inputRef}
            type="tel"
            id={fieldId}
            name="zipCode"
            value={zipCode}
            onChange={handleZipChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter ZIP code"
            className={`
              w-full px-4 py-3 text-lg font-medium border-2 rounded-xl
              focus:ring-4 focus:ring-texas-red-200 focus:border-texas-red focus:outline-none
              transition-all duration-200
              ${error ? 'border-texas-red bg-red-50' : 'border-gray-300 bg-white'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="postal-code"
            disabled={isLoading}
            {...inputAriaAttributes}
          />
        </div>

        {/* Submit button */}
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={!isZipValid || isLoading}
          className={`
            w-full px-6 py-4 font-semibold rounded-xl text-lg
            transition-all duration-200
            focus:ring-4 focus:ring-texas-red-200 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[44px] min-w-[44px]
            ${isLoading ? 
              'bg-gray-400 text-white cursor-wait' : 
              isZipValid ? 
                'bg-texas-red text-white hover:bg-texas-red-600 active:bg-texas-red-700' :
                'bg-gray-300 text-gray-500'
            }
          `}
          aria-describedby={isLoading ? statusId : undefined}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="sr-only">Searching for electricity plans</span>
              Searching Plans...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg 
                className="w-5 h-5 mr-2" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Find Plans
            </span>
          )}
        </button>
      </form>

      {/* Error display with WCAG compliance */}
      {error && (
        <div 
          ref={errorRef}
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200"
          tabIndex={-1}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                ZIP Code Error
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
              
              {/* Accessible suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Try these ZIP codes:
                  </h4>
                  <div className="space-y-2" role="list">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
                        className="
                          block w-full px-4 py-3 text-sm bg-white border-2 border-red-300 rounded-xl 
                          hover:bg-red-50 active:bg-red-100 
                          focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-red-500
                          transition-colors text-left
                          min-h-[44px]
                        "
                        role="listitem"
                        aria-describedby={`suggestion-${index}-desc`}
                      >
                        <span className="font-medium">{suggestion}</span>
                        <span 
                          id={`suggestion-${index}-desc`}
                          className="sr-only"
                        >
                          Click to use this ZIP code
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Find electricity plans available in your ZIP code area. 
          <span className="sr-only">
            This form is accessible to screen readers and keyboard navigation.
          </span>
        </p>
      </div>
    </div>
  );
};

export default AccessibleZIPForm;