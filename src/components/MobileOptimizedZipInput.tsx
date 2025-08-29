/**
 * Mobile-Optimized ZIP Code Input Component
 * Lightning-fast ZIP code input with location detection, progressive enhancement,
 * and mobile-first UX for Texas electricity customer conversions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { multiTDSPDetector, type TDSPResolutionResult } from '../lib/api/multi-tdsp-detector';
import { mobilePerformanceOptimizer } from '../lib/mobile/performance-optimizer';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  zipCode?: string;
  city?: string;
  state?: string;
}

interface MobileOptimizedZipInputProps {
  onLocationResolved: (result: TDSPResolutionResult & { location?: LocationData }) => void;
  onError?: (error: Error) => void;
  placeholder?: string;
  className?: string;
  enableLocationDetection?: boolean;
  showProgress?: boolean;
  displayUsage?: number;
  autoFocus?: boolean;
  theme?: 'light' | 'dark';
}

interface ComponentState {
  step: 'input' | 'location' | 'address' | 'loading' | 'resolved';
  zipCode: string;
  address: string;
  isLoading: boolean;
  error: string | null;
  locationData: LocationData | null;
  tdspResult: TDSPResolutionResult | null;
  showLocationPrompt: boolean;
  isUsingLocation: boolean;
  inputMethod: 'manual' | 'location' | 'recent';
  recentZipCodes: string[];
}

export const MobileOptimizedZipInput: React.FC<MobileOptimizedZipInputProps> = ({
  onLocationResolved,
  onError,
  placeholder = "Enter your ZIP code",
  className = "",
  enableLocationDetection = true,
  showProgress = true,
  displayUsage = 1000,
  autoFocus = true,
  theme = 'light'
}) => {
  const [state, setState] = useState<ComponentState>({
    step: 'input',
    zipCode: '',
    address: '',
    isLoading: false,
    error: null,
    locationData: null,
    tdspResult: null,
    showLocationPrompt: enableLocationDetection,
    isUsingLocation: false,
    inputMethod: 'manual',
    recentZipCodes: []
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartTime = useRef<number>(0);
  const vibrationSupported = useRef<boolean>('vibrate' in navigator);

  /**
   * Initialize component with mobile optimizations
   */
  useEffect(() => {
    // Load recent ZIP codes from storage
    const recent = JSON.parse(localStorage.getItem('recent_zip_codes') || '[]').slice(0, 3);
    setState(prev => ({ ...prev, recentZipCodes: recent }));

    // Auto-focus input on mobile (if enabled)
    if (autoFocus && inputRef.current && window.innerWidth <= 768) {
      // Delay auto-focus to prevent mobile viewport jumping
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }

    // Setup intersection observer for performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Component is visible, enable full functionality
            entry.target.classList.add('component-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [autoFocus]);

  /**
   * Enhanced ZIP code validation with comprehensive checks
   */
  const validateZipCode = useCallback((zipCode: string): string | null => {
    const trimmed = zipCode.trim().replace(/\D/g, '');
    
    if (!trimmed) {
      return 'ZIP code is required';
    }
    
    if (trimmed.length !== 5) {
      return 'ZIP code must be exactly 5 digits';
    }
    
    // Texas ZIP code range validation
    const zipNum = parseInt(trimmed, 10);
    if (zipNum < 73301 || zipNum > 79999) {
      if (zipNum < 75000 || zipNum > 79999) {
        return 'Please enter a Texas ZIP code';
      }
    }
    
    return null;
  }, []);

  /**
   * Request location with enhanced mobile UX
   */
  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!enableLocationDetection || !('geolocation' in navigator)) {
      return null;
    }

    // Show loading state immediately
    setState(prev => ({ ...prev, isLoading: true, error: null, step: 'location' }));

    // Haptic feedback for location request
    if (vibrationSupported.current) {
      navigator.vibrate(50);
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: false, // Faster, less battery drain
          timeout: 10000, // 10 second timeout
          maximumAge: 300000 // Use cached location up to 5 minutes
        };

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Reverse geocode to get ZIP code
      const zipCode = await reverseGeocodeToZip(locationData);
      if (zipCode) {
        locationData.zipCode = zipCode;
      }

      setState(prev => ({ 
        ...prev, 
        locationData,
        zipCode: zipCode || '',
        isUsingLocation: true,
        inputMethod: 'location',
        step: zipCode ? 'loading' : 'input',
        isLoading: !!zipCode
      }));

      // If we got a ZIP code, process it immediately
      if (zipCode) {
        await processTDSPResolution(zipCode, locationData);
      }

      return locationData;

    } catch (error) {
      console.warn('Location detection failed:', error);
      
      let errorMessage = 'Location access denied';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enter ZIP code manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please enter ZIP code manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please enter ZIP code manually.';
            break;
        }
      }

      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false,
        showLocationPrompt: false,
        step: 'input'
      }));

      return null;
    }
  }, [enableLocationDetection, displayUsage]);

  /**
   * Reverse geocode coordinates to ZIP code
   */
  const reverseGeocodeToZip = async (location: LocationData): Promise<string | null> => {
    try {
      // Use a geocoding service (implement based on your preferred provider)
      const response = await fetch(
        `https://api.geocoding.service.com/reverse?lat=${location.latitude}&lng=${location.longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.zipCode || null;
      }
      
      return null;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  };

  /**
   * Process TDSP resolution with enhanced error handling
   */
  const processTDSPResolution = async (zipCode: string, location?: LocationData): Promise<void> => {
    try {
      console.log(`📱 Mobile ZIP lookup: ${zipCode}`);
      
      // Step 1: Use our comprehensive ZIP lookup API first
      const response = await fetch(`/api/zip-lookup?zip=${encodeURIComponent(zipCode)}`);
      const zipResult = await response.json();

      if (zipResult.success) {
        console.log(`✅ Mobile ZIP resolved to city: ${zipResult.city}`);
        
        try {
          // Step 2: Check for multi-TDSP scenarios
          const analysis = await multiTDSPDetector.analyzeZipCode(zipCode, displayUsage);
          
          const result = {
            ...analysis,
            location
          };

          if (analysis.addressRequired) {
            setState(prev => ({
              ...prev,
              step: 'address',
              isLoading: false,
              tdspResult: analysis
            }));
            return;
          }

          // Success - save to recent and resolve
          saveRecentZipCode(zipCode);
          setState(prev => ({
            ...prev,
            step: 'resolved',
            isLoading: false,
            tdspResult: analysis
          }));

          onLocationResolved(result);

          // Success haptic feedback
          if (vibrationSupported.current) {
            navigator.vibrate([50, 50, 100]);
          }

        } catch (multiTDSPError) {
          // Fallback to basic resolution if multi-TDSP fails
          console.log(`⚠️ Multi-TDSP detection failed, using basic mobile resolution`);
          
          const basicResult: TDSPResolutionResult & { location?: LocationData } = {
            method: 'zip_lookup_mobile',
            zipCode,
            city: zipResult.city,
            tdsp_duns: '', // Will be filled by consuming component
            tdsp_name: '', // Will be filled by consuming component
            confidence: 'medium',
            addressRequired: false,
            requiresUserInput: false,
            apiParams: {
              display_usage: displayUsage
            },
            resolvedAddress: zipResult.cityDisplayName,
            location
          };

          // Success - save to recent and resolve
          saveRecentZipCode(zipCode);
          setState(prev => ({
            ...prev,
            step: 'resolved',
            isLoading: false,
            tdspResult: basicResult
          }));

          onLocationResolved(basicResult);

          // Success haptic feedback
          if (vibrationSupported.current) {
            navigator.vibrate([50, 50, 100]);
          }
        }

      } else {
        // Handle ZIP lookup errors
        console.log(`⚠️ Mobile ZIP lookup failed:`, zipResult);
        
        if (zipResult.errorType === 'non_deregulated') {
          // Municipal utility - show special error with haptic feedback
          if (vibrationSupported.current) {
            navigator.vibrate([100, 100, 100]); // Error vibration pattern
          }
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: `${zipResult.error} This area doesn't have electricity choice.`,
            step: 'input'
          }));
          
        } else if (zipResult.errorType === 'not_found') {
          // Try fallback to multi-TDSP detector
          console.log(`🔄 Mobile ZIP not found, trying fallback...`);
          
          try {
            const analysis = await multiTDSPDetector.analyzeZipCode(zipCode, displayUsage);
            const result = { ...analysis, location };

            if (analysis.addressRequired) {
              setState(prev => ({
                ...prev,
                step: 'address',
                isLoading: false,
                tdspResult: analysis
              }));
              return;
            }

            saveRecentZipCode(zipCode);
            setState(prev => ({
              ...prev,
              step: 'resolved',
              isLoading: false,
              tdspResult: analysis
            }));

            onLocationResolved(result);

            if (vibrationSupported.current) {
              navigator.vibrate([50, 50, 100]);
            }

          } catch (fallbackError) {
            if (vibrationSupported.current) {
              navigator.vibrate([100, 100, 100]);
            }
            
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: 'This ZIP code is not in our Texas service area.',
              step: 'input'
            }));
          }
          
        } else {
          // Other errors
          if (vibrationSupported.current) {
            navigator.vibrate([100, 100, 100]);
          }
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: zipResult.error || 'Unable to process this ZIP code.',
            step: 'input'
          }));
        }
      }

    } catch (error) {
      console.error('Mobile TDSP resolution failed:', error);
      
      // Error haptic feedback
      if (vibrationSupported.current) {
        navigator.vibrate([100, 100, 100]);
      }
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unable to process location. Please check your connection and try again.';
        
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage,
        step: 'input'
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  /**
   * Handle ZIP code input with mobile optimizations
   */
  const handleZipCodeSubmit = useCallback(async () => {
    const validationError = validateZipCode(state.zipCode);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      
      // Error haptic feedback
      if (vibrationSupported.current) {
        navigator.vibrate(200);
      }
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      step: 'loading',
      inputMethod: 'manual'
    }));

    await processTDSPResolution(state.zipCode);
  }, [state.zipCode, validateZipCode, displayUsage]);

  /**
   * Handle address submission for multi-TDSP scenarios
   */
  const handleAddressSubmit = useCallback(async () => {
    if (!state.address.trim() || !state.tdspResult) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const resolution = await multiTDSPDetector.resolveAddressToTDSP(
        state.address,
        state.zipCode,
        displayUsage
      );

      const result = {
        ...resolution,
        location: state.locationData
      };

      saveRecentZipCode(state.zipCode);
      setState(prev => ({
        ...prev,
        step: 'resolved',
        isLoading: false,
        tdspResult: resolution
      }));

      onLocationResolved(result);

    } catch (error) {
      console.error('Address resolution failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unable to resolve address. Please check and try again.';
        
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.address, state.zipCode, state.tdspResult, state.locationData, displayUsage, onLocationResolved, onError]);

  /**
   * Save ZIP code to recent list
   */
  const saveRecentZipCode = (zipCode: string): void => {
    const recent = JSON.parse(localStorage.getItem('recent_zip_codes') || '[]');
    const updated = [zipCode, ...recent.filter((z: string) => z !== zipCode)].slice(0, 5);
    localStorage.setItem('recent_zip_codes', JSON.stringify(updated));
  };

  /**
   * Handle recent ZIP code selection
   */
  const selectRecentZipCode = (zipCode: string): void => {
    setState(prev => ({
      ...prev,
      zipCode,
      inputMethod: 'recent',
      error: null
    }));
    
    // Haptic feedback
    if (vibrationSupported.current) {
      navigator.vibrate(30);
    }
  };

  /**
   * Handle input focus with mobile optimizations
   */
  const handleInputFocus = (): void => {
    // Prevent viewport zoom on iOS
    if (/iPhone|iPad/.test(navigator.userAgent)) {
      if (inputRef.current) {
        inputRef.current.style.fontSize = '16px';
      }
    }
  };

  /**
   * Handle touch interactions
   */
  const handleTouchStart = (): void => {
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (): void => {
    const touchDuration = Date.now() - touchStartTime.current;
    if (touchDuration < 200 && vibrationSupported.current) {
      // Quick tap haptic feedback
      navigator.vibrate(10);
    }
  };

  /**
   * Reset component to initial state
   */
  const handleReset = (): void => {
    setState({
      step: 'input',
      zipCode: '',
      address: '',
      isLoading: false,
      error: null,
      locationData: null,
      tdspResult: null,
      showLocationPrompt: enableLocationDetection,
      isUsingLocation: false,
      inputMethod: 'manual',
      recentZipCodes: state.recentZipCodes
    });
    
    inputRef.current?.focus();
  };

  return (
    <div 
      ref={containerRef}
      className={`mobile-zip-input ${className} ${theme === 'dark' ? 'dark-theme' : ''}`}
      data-step={state.step}
    >
      {/* Progress Indicator */}
      {showProgress && state.step !== 'input' && (
        <div className="mobile-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: state.step === 'loading' ? '60%' : 
                       state.step === 'address' ? '80%' : '100%' 
              }}
            />
          </div>
          <div className="progress-text">
            {state.step === 'location' && 'Detecting location...'}
            {state.step === 'loading' && 'Finding your utility...'}
            {state.step === 'address' && 'Need your address...'}
            {state.step === 'resolved' && 'Location confirmed!'}
          </div>
        </div>
      )}

      {/* Location Prompt */}
      {state.showLocationPrompt && state.step === 'input' && !state.isLoading && (
        <div className="location-prompt">
          <div className="prompt-content">
            <div className="prompt-icon">📍</div>
            <div className="prompt-text">
              <strong>Find electricity rates near you</strong>
              <p>Use your location for faster, more accurate results</p>
            </div>
            <div className="prompt-actions">
              <button 
                className="location-btn primary"
                onClick={requestLocation}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                Use Location
              </button>
              <button 
                className="location-btn secondary"
                onClick={() => setState(prev => ({ ...prev, showLocationPrompt: false }))}
              >
                Enter ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent ZIP Codes */}
      {state.recentZipCodes.length > 0 && state.step === 'input' && !state.showLocationPrompt && (
        <div className="recent-zips">
          <div className="recent-label">Recent locations:</div>
          <div className="recent-chips">
            {state.recentZipCodes.map((zip) => (
              <button
                key={zip}
                className="recent-chip"
                onClick={() => selectRecentZipCode(zip)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {zip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ZIP Code Input */}
      {(state.step === 'input' || state.step === 'loading') && !state.showLocationPrompt && (
        <div className="input-section">
          <div className="input-group">
            <div className="input-container">
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                value={state.zipCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setState(prev => ({ ...prev, zipCode: value, error: null }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && state.zipCode.length === 5) {
                    e.preventDefault();
                    handleZipCodeSubmit();
                  }
                }}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                className="zip-input-mobile"
                disabled={state.isLoading}
                maxLength={5}
                autoComplete="postal-code"
                autoCorrect="off"
                spellCheck="false"
              />
              {state.zipCode.length > 0 && (
                <button
                  className="clear-btn"
                  onClick={() => setState(prev => ({ ...prev, zipCode: '', error: null }))}
                  type="button"
                  aria-label="Clear ZIP code"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              className="submit-btn-mobile"
              onClick={handleZipCodeSubmit}
              disabled={state.isLoading || state.zipCode.length !== 5}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {state.isLoading ? (
                <div className="loading-spinner-small" />
              ) : (
                <span>Find Rates</span>
              )}
            </button>
          </div>
          
          {state.isUsingLocation && state.locationData && (
            <div className="location-indicator">
              <span className="location-icon">🎯</span>
              <span>Using your current location</span>
            </div>
          )}
        </div>
      )}

      {/* Address Input for Multi-TDSP */}
      {state.step === 'address' && (
        <div className="address-section">
          <div className="address-header">
            <h3>We need your street address</h3>
            <p>ZIP code {state.zipCode} has multiple utility companies. Your address helps us show the correct rates.</p>
          </div>
          
          <div className="input-group">
            <div className="input-container">
              <input
                type="text"
                value={state.address}
                onChange={(e) => setState(prev => ({ ...prev, address: e.target.value, error: null }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && state.address.trim()) {
                    e.preventDefault();
                    handleAddressSubmit();
                  }
                }}
                placeholder="1234 Main Street"
                className="address-input-mobile"
                disabled={state.isLoading}
                autoComplete="street-address"
                autoCapitalize="words"
              />
            </div>
            <button 
              className="submit-btn-mobile"
              onClick={handleAddressSubmit}
              disabled={state.isLoading || !state.address.trim()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {state.isLoading ? (
                <div className="loading-spinner-small" />
              ) : (
                <span>Find Utility</span>
              )}
            </button>
          </div>

          <div className="address-help">
            <details>
              <summary>Why do you need my address? 🤔</summary>
              <p>Multiple electricity providers serve ZIP code {state.zipCode}. Your street address helps us identify your specific utility company and show you the most accurate rates and plans.</p>
            </details>
          </div>
        </div>
      )}

      {/* Success State */}
      {state.step === 'resolved' && state.tdspResult && (
        <div className="success-section">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <div className="success-text">
              <strong>Perfect! We found your utility company</strong>
              <p>{state.tdspResult.tdsp_name}</p>
              {state.locationData && (
                <div className="location-info">
                  📍 {state.isUsingLocation ? 'Current location' : `ZIP ${state.zipCode}`}
                </div>
              )}
            </div>
          </div>
          
          <button 
            className="change-location-btn"
            onClick={handleReset}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            Change Location
          </button>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="error-mobile">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{state.error}</span>
            <button 
              className="error-dismiss"
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {state.isLoading && state.step === 'location' && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-large" />
            <div className="loading-message">
              <strong>Detecting your location...</strong>
              <p>This helps us find the best electricity rates for you</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedZipInput;