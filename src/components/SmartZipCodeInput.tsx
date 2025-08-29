/**
 * Smart ZIP Code Input Component
 * Automatically detects multi-TDSP scenarios and prompts for address when needed
 * Implements the rule: "When two TDUs could return from API, ask user to enter address"
 */

import React, { useState, useCallback } from 'react';
import { multiTDSPDetector, type TDSPResolutionResult } from '../lib/api/multi-tdsp-detector';

interface SmartZipCodeInputProps {
  onTDSPResolved: (result: TDSPResolutionResult) => void;
  onError?: (error: Error) => void;
  placeholder?: string;
  className?: string;
  showProgress?: boolean;
  displayUsage?: number;
}

interface ComponentState {
  step: 'zip_input' | 'address_input' | 'tdsp_selection' | 'resolved';
  zipCode: string;
  address: string;
  isLoading: boolean;
  error: string | null;
  tdspResult: TDSPResolutionResult | null;
  showAddressForm: boolean;
  addressSuggestions: Array<{
    address: string;
    esiid: string;
    tdsp_name: string;
  }>;
}

export const SmartZipCodeInput: React.FC<SmartZipCodeInputProps> = ({
  onTDSPResolved,
  onError,
  placeholder = "Enter ZIP code",
  className = "",
  showProgress = true,
  displayUsage = 1000
}) => {
  const [state, setState] = useState<ComponentState>({
    step: 'zip_input',
    zipCode: '',
    address: '',
    isLoading: false,
    error: null,
    tdspResult: null,
    showAddressForm: false,
    addressSuggestions: []
  });

  /**
   * Enhanced ZIP code validation with security measures
   */
  const validateZipCode = (zipCode: string): string | null => {
    const trimmed = zipCode.trim();
    
    // Basic format validation
    if (!trimmed || trimmed.length !== 5) {
      return 'ZIP code must be exactly 5 digits';
    }
    
    // Numeric validation with stricter security check
    if (!/^\d{5}$/.test(trimmed)) {
      return 'ZIP code must contain only numbers';
    }
    
    // Range validation for US ZIP codes
    const zipNum = parseInt(trimmed, 10);
    if (zipNum < 1000 || zipNum > 99999) {
      return 'Please enter a valid US ZIP code';
    }
    
    return null; // Valid
  };

  /**
   * Enhanced address validation with security measures
   */
  const validateAddress = (address: string): string | null => {
    const trimmed = address.trim();
    
    // Length validation
    if (!trimmed || trimmed.length < 5) {
      return 'Address must be at least 5 characters';
    }
    
    if (trimmed.length > 200) {
      return 'Address must be less than 200 characters';
    }
    
    // Security: Check for potentially malicious patterns
    const dangerousPatterns = [
      /<script/i, // Script injection
      /javascript:/i, // JavaScript protocol
      /data:\s*text\/html/i, // Data URL HTML
      /vbscript:/i, // VBScript protocol
      /on\w+\s*=/i, // Event handlers
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return 'Address contains invalid characters';
      }
    }
    
    // Basic format validation - should contain numbers and letters
    if (!/\d/.test(trimmed) || !/[a-zA-Z]/.test(trimmed)) {
      return 'Address should contain both numbers and letters';
    }
    
    return null; // Valid
  };

  /**
   * Sanitize user input to prevent XSS and other attacks
   */
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 500); // Enforce maximum length
  };

  /**
   * Handle ZIP code submission with enhanced API and security
   */
  const handleZipCodeSubmit = useCallback(async () => {
    const sanitizedZipCode = sanitizeInput(state.zipCode);
    const validationError = validateZipCode(sanitizedZipCode);
    
    if (validationError) {
      setState(prev => ({ 
        ...prev, 
        error: validationError
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      console.log(`🔍 Looking up ZIP code: ${sanitizedZipCode}`);
      
      // Step 1: Use our new ZIP lookup API first
      const response = await fetch(`/api/zip-lookup?zip=${encodeURIComponent(sanitizedZipCode)}`);
      const zipResult = await response.json();

      if (zipResult.success) {
        // ZIP code resolved to a single city - now check if we need multi-TDSP detection
        console.log(`✅ ZIP resolved to city: ${zipResult.city}`);
        
        // Step 2: Check if this city might have multi-TDSP scenarios
        try {
          const analysis = await multiTDSPDetector.analyzeZipCode(sanitizedZipCode, displayUsage);
          
          if (analysis.addressRequired) {
            console.log(`⚠️  Address required for ZIP ${sanitizedZipCode} due to multi-TDSP`);
            
            setState(prev => ({
              ...prev,
              step: 'address_input',
              isLoading: false,
              tdspResult: analysis,
              showAddressForm: true,
              error: null
            }));
            
            return;
          }

          // Direct resolution successful
          console.log(`✅ Direct ZIP resolution: ${analysis.tdsp_name}`);
          
          setState(prev => ({
            ...prev,
            step: 'resolved',
            isLoading: false,
            tdspResult: analysis,
            showAddressForm: false,
            error: null
          }));

          onTDSPResolved(analysis);

        } catch (multiTDSPError) {
          // Fallback to basic city resolution if multi-TDSP detection fails
          console.log(`⚠️ Multi-TDSP detection failed, using basic city resolution`);
          
          // Create a basic TDSP result from our ZIP lookup
          const basicResult: TDSPResolutionResult = {
            method: 'zip_lookup',
            zipCode: sanitizedZipCode,
            city: zipResult.city,
            tdsp_duns: '', // Will be filled by the consuming component
            tdsp_name: '', // Will be filled by the consuming component
            confidence: 'medium',
            addressRequired: false,
            requiresUserInput: false,
            apiParams: {
              display_usage: displayUsage
            },
            resolvedAddress: zipResult.cityDisplayName
          };

          setState(prev => ({
            ...prev,
            step: 'resolved',
            isLoading: false,
            tdspResult: basicResult,
            showAddressForm: false,
            error: null
          }));

          onTDSPResolved(basicResult);
        }

      } else {
        // Handle different error types from ZIP lookup API
        console.log(`⚠️ ZIP lookup failed:`, zipResult);
        
        if (zipResult.errorType === 'non_deregulated') {
          // Municipal utility area - show special error
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: `${zipResult.error} You cannot choose your electricity provider in this area.` 
          }));
        } else if (zipResult.errorType === 'not_found') {
          // ZIP not found in our database, try multi-TDSP detector as fallback
          console.log(`🔄 ZIP not in our database, trying multi-TDSP detection...`);
          
          try {
            const analysis = await multiTDSPDetector.analyzeZipCode(sanitizedZipCode, displayUsage);
            
            if (analysis.addressRequired) {
              setState(prev => ({
                ...prev,
                step: 'address_input',
                isLoading: false,
                tdspResult: analysis,
                showAddressForm: true,
                error: null
              }));
              return;
            }

            setState(prev => ({
              ...prev,
              step: 'resolved',
              isLoading: false,
              tdspResult: analysis,
              showAddressForm: false,
              error: null
            }));

            onTDSPResolved(analysis);

          } catch (fallbackError) {
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: 'This ZIP code is not in our service area. We currently serve deregulated electricity markets in Texas.' 
            }));
          }
        } else {
          // Other errors
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: zipResult.error || 'Unable to process this ZIP code. Please try again.' 
          }));
        }
      }

    } catch (error) {
      console.error('ZIP code lookup failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unable to process ZIP code. Please check your connection and try again.';
        
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.zipCode, displayUsage, onTDSPResolved, onError]);

  /**
   * Handle address submission for ESIID lookup with enhanced security
   */
  const handleAddressSubmit = useCallback(async () => {
    const sanitizedAddress = sanitizeInput(state.address);
    const sanitizedZipCode = sanitizeInput(state.zipCode);
    
    // Validate address
    const addressError = validateAddress(sanitizedAddress);
    if (addressError) {
      setState(prev => ({ 
        ...prev, 
        error: addressError 
      }));
      return;
    }
    
    // Re-validate ZIP code
    const zipError = validateZipCode(sanitizedZipCode);
    if (zipError) {
      setState(prev => ({ 
        ...prev, 
        error: zipError 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      console.log(`📍 Resolving address: ${sanitizedAddress}, ${sanitizedZipCode}`);
      
      // Step 2: Resolve address to specific TDSP using ESIID
      const resolution = await multiTDSPDetector.resolveAddressToTDSP(
        sanitizedAddress, 
        sanitizedZipCode, 
        displayUsage
      );

      if (resolution.requiresUserInput && resolution.alternatives) {
        console.log(`🤔 Multiple TDSPs found, requiring user selection`);
        
        setState(prev => ({
          ...prev,
          step: 'tdsp_selection',
          isLoading: false,
          tdspResult: resolution,
          error: null
        }));
        
        return;
      }

      // Address resolution successful
      console.log(`✅ Address resolved to: ${resolution.tdsp_name}`);
      
      setState(prev => ({
        ...prev,
        step: 'resolved',
        isLoading: false,
        tdspResult: resolution,
        showAddressForm: false,
        error: null
      }));

      onTDSPResolved(resolution);

    } catch (error) {
      console.error('Address resolution failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unable to resolve address. Please check your address and try again.';
        
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.address, state.zipCode, displayUsage, onTDSPResolved, onError]);

  /**
   * Handle manual TDSP selection
   */
  const handleTDSPSelection = useCallback((selectedDuns: string) => {
    if (!state.tdspResult || !state.tdspResult.alternatives) return;

    const selectedTDSP = state.tdspResult.alternatives.find(alt => alt.duns === selectedDuns);
    if (!selectedTDSP) return;

    const finalResult: TDSPResolutionResult = {
      ...state.tdspResult,
      method: 'user_selected',
      tdsp_duns: selectedTDSP.duns,
      tdsp_name: selectedTDSP.name,
      confidence: 'high',
      requiresUserInput: false,
      alternatives: undefined,
      apiParams: {
        ...state.tdspResult.apiParams,
        tdsp_duns: selectedTDSP.duns
      }
    };

    console.log(`👤 User selected TDSP: ${selectedTDSP.name}`);

    setState(prev => ({
      ...prev,
      step: 'resolved',
      tdspResult: finalResult
    }));

    onTDSPResolved(finalResult);
  }, [state.tdspResult, onTDSPResolved]);

  /**
   * Reset component to initial state
   */
  const handleReset = useCallback(() => {
    setState({
      step: 'zip_input',
      zipCode: '',
      address: '',
      isLoading: false,
      error: null,
      tdspResult: null,
      showAddressForm: false,
      addressSuggestions: []
    });
  }, []);

  /**
   * Handle Enter key press
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (state.step === 'zip_input') {
        handleZipCodeSubmit();
      } else if (state.step === 'address_input') {
        handleAddressSubmit();
      }
    }
  }, [state.step, handleZipCodeSubmit, handleAddressSubmit]);

  return (
    <div className={`smart-zip-input ${className}`}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="progress-steps mb-4">
          <div className={`step ${state.step === 'zip_input' ? 'active' : ''} ${state.step !== 'zip_input' ? 'completed' : ''}`}>
            1. ZIP Code
          </div>
          {state.showAddressForm && (
            <div className={`step ${state.step === 'address_input' ? 'active' : ''} ${['tdsp_selection', 'resolved'].includes(state.step) ? 'completed' : ''}`}>
              2. Address
            </div>
          )}
          {state.tdspResult?.alternatives && (
            <div className={`step ${state.step === 'tdsp_selection' ? 'active' : ''} ${state.step === 'resolved' ? 'completed' : ''}`}>
              3. Select Utility
            </div>
          )}
        </div>
      )}

      {/* ZIP Code Input */}
      {state.step === 'zip_input' && (
        <div className="zip-input-section">
          <div className="input-group">
            <input
              type="text"
              value={state.zipCode}
              onChange={(e) => setState(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="zip-input"
              disabled={state.isLoading}
              maxLength={5}
            />
            <button 
              onClick={handleZipCodeSubmit}
              disabled={state.isLoading || state.zipCode.length !== 5}
              className="submit-button"
            >
              {state.isLoading ? 'Checking...' : 'Check Rates'}
            </button>
          </div>
        </div>
      )}

      {/* Address Input */}
      {state.step === 'address_input' && (
        <div className="address-input-section">
          <div className="section-header">
            <h3>Address Required</h3>
            <p>Your ZIP code ({state.zipCode}) spans multiple utility service areas. Please enter your street address for accurate rates.</p>
          </div>
          
          <div className="input-group">
            <input
              type="text"
              value={state.address}
              onChange={(e) => setState(prev => ({ ...prev, address: e.target.value }))}
              onKeyPress={handleKeyPress}
              placeholder="Enter street address (e.g., 1234 Main St)"
              className="address-input"
              disabled={state.isLoading}
            />
            <button 
              onClick={handleAddressSubmit}
              disabled={state.isLoading || !state.address.trim()}
              className="submit-button"
            >
              {state.isLoading ? 'Looking up...' : 'Find Utility'}
            </button>
          </div>

          <div className="utility-info">
            <p><strong>Why do we need your address?</strong></p>
            <p>Multiple electricity providers serve your ZIP code area. Your exact address helps us identify your utility company and show you the correct rates.</p>
          </div>
        </div>
      )}

      {/* TDSP Selection */}
      {state.step === 'tdsp_selection' && state.tdspResult?.alternatives && (
        <div className="tdsp-selection-section">
          <div className="section-header">
            <h3>Select Your Utility Company</h3>
            <p>We found multiple utilities that may serve your address. Please select your current or preferred utility:</p>
          </div>
          
          <div className="tdsp-options">
            {[
              { duns: state.tdspResult.tdsp_duns, name: state.tdspResult.tdsp_name, description: 'Primary option' },
              ...state.tdspResult.alternatives
            ].map((tdsp) => (
              <button
                key={tdsp.duns}
                onClick={() => handleTDSPSelection(tdsp.duns)}
                className="tdsp-option"
              >
                <div className="tdsp-name">{tdsp.name}</div>
                <div className="tdsp-description">{tdsp.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {state.step === 'resolved' && state.tdspResult && (
        <div className="success-section">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <div className="success-text">
              <strong>Service Area Confirmed</strong>
              <p>Your utility company: {state.tdspResult.tdsp_name}</p>
              {state.tdspResult.resolvedAddress && (
                <p className="resolved-address">Address: {state.tdspResult.resolvedAddress}</p>
              )}
            </div>
          </div>
          
          <button onClick={handleReset} className="reset-button">
            Change Location
          </button>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{state.error}</div>
          <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="dismiss-error">
            ✕
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {state.isLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            {state.step === 'zip_input' ? 'Checking service area...' : 'Resolving utility company...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartZipCodeInput;