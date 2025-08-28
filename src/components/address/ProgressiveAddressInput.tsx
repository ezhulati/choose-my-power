/**
 * Progressive Address Input Component
 * 
 * Guides users through the ZIP → Address → TDSP resolution flow
 * with smart validation and clear messaging about why full addresses
 * are needed in boundary areas.
 * 
 * Features:
 * - Progressive enhancement (ZIP first, then address details)
 * - Smart validation with real-time feedback
 * - Clear messaging about multi-TDSP areas
 * - Autocomplete for better user experience
 * - Mobile-optimized design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { addressTdspResolver, type ProgressiveResolutionStep } from '../../lib/address/address-tdsp-resolver';
import type { AddressInfo, TdspInfo } from '../../types/facets';

interface ProgressiveAddressInputProps {
  onAddressResolved: (result: {
    address: AddressInfo;
    tdsp: TdspInfo;
    apiParams: any;
    confidence: string;
  }) => void;
  onError: (error: string) => void;
  className?: string;
  autoFocus?: boolean;
  showProgressSteps?: boolean;
}

interface FormData {
  zipCode: string;
  street: string;
  city: string;
  state: string;
  zip4: string;
  unitNumber: string;
}

const ProgressiveAddressInput: React.FC<ProgressiveAddressInputProps> = ({
  onAddressResolved,
  onError,
  className = '',
  autoFocus = false,
  showProgressSteps = true
}) => {
  const [currentStep, setCurrentStep] = useState<'zip' | 'address' | 'verification' | 'selection'>('zip');
  const [formData, setFormData] = useState<FormData>({
    zipCode: '',
    street: '',
    city: '',
    state: 'TX',
    zip4: '',
    unitNumber: ''
  });
  
  const [zipAnalysis, setZipAnalysis] = useState<any>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressiveResolutionStep[]>([]);
  const [tdspOptions, setTdspOptions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Memoized validation functions
  const isValidZipCode = useMemo(() => {
    return (zip: string) => /^\d{5}$/.test(zip.trim());
  }, []);

  const isValidStreetAddress = useMemo(() => {
    return (street: string) => street.trim().length >= 5;
  }, []);

  // Handle ZIP code input and analysis
  const handleZipCodeChange = useCallback(async (zipCode: string) => {
    setFormData(prev => ({ ...prev, zipCode }));
    setErrors(prev => ({ ...prev, zipCode: '' }));

    if (isValidZipCode(zipCode)) {
      setIsLoading(true);
      try {
        const analysis = await addressTdspResolver.analyzeZipCode(zipCode);
        setZipAnalysis(analysis);
        
        if (analysis.requiresAddressValidation) {
          setCurrentStep('address');
          setSuggestions([
            'Your ZIP code spans multiple utility service areas',
            'Complete address required for accurate rate comparison'
          ]);
        } else {
          setSuggestions([
            analysis.explanation,
            'You can proceed or provide your full address for enhanced accuracy'
          ]);
        }
      } catch (error) {
        setErrors(prev => ({ 
          ...prev, 
          zipCode: 'Unable to analyze ZIP code. Please verify and try again.' 
        }));
      } finally {
        setIsLoading(false);
      }
    } else if (zipCode.length >= 5) {
      setErrors(prev => ({ ...prev, zipCode: 'Please enter a valid 5-digit ZIP code' }));
    }
  }, [isValidZipCode]);

  // Handle address form submission
  const handleAddressSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    
    if (!isValidZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Valid ZIP code is required';
    }
    
    if (!isValidStreetAddress(formData.street)) {
      newErrors.street = 'Street address is required (minimum 5 characters)';
    }
    
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City is required (minimum 2 characters)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setCurrentStep('verification');
    
    try {
      const addressInfo: AddressInfo = {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: 'TX',
        zipCode: formData.zipCode,
        zip4: formData.zip4 || undefined,
        unitNumber: formData.unitNumber || undefined
      };

      const result = await addressTdspResolver.resolveTdspFromAddress(addressInfo);
      
      if (!result.success) {
        throw new Error(result.warnings.join('. ') || 'Address resolution failed');
      }

      if (result.requiresManualSelection && result.alternatives.length > 0) {
        // Show TDSP selection step
        const options = await addressTdspResolver.getTdspOptions(addressInfo);
        setTdspOptions(options);
        setCurrentStep('selection');
      } else {
        // Proceed with resolved TDSP
        onAddressResolved({
          address: addressInfo,
          tdsp: result.tdsp!,
          apiParams: result.apiParams!,
          confidence: result.confidence
        });
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Address resolution failed');
      setCurrentStep('address'); // Go back to address input
    } finally {
      setIsLoading(false);
    }
  }, [formData, isValidZipCode, isValidStreetAddress, onAddressResolved, onError]);

  // Handle TDSP selection
  const handleTdspSelection = useCallback((selectedTdsp: TdspInfo) => {
    const addressInfo: AddressInfo = {
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: 'TX',
      zipCode: formData.zipCode,
      zip4: formData.zip4 || undefined,
      unitNumber: formData.unitNumber || undefined
    };

    const apiParams = addressTdspResolver.createApiParams(selectedTdsp);

    onAddressResolved({
      address: addressInfo,
      tdsp: selectedTdsp,
      apiParams,
      confidence: 'medium' // Manual selection gets medium confidence
    });
  }, [formData, onAddressResolved]);

  // Update progress steps
  useEffect(() => {
    if (formData.zipCode) {
      const addressInfo = formData.street ? {
        street: formData.street,
        city: formData.city,
        state: 'TX' as const,
        zipCode: formData.zipCode,
        zip4: formData.zip4 || undefined,
        unitNumber: formData.unitNumber || undefined
      } : undefined;

      addressTdspResolver.getProgressiveResolutionSteps(formData.zipCode, addressInfo)
        .then(setProgressSteps)
        .catch(console.error);
    }
  }, [formData]);

  return (
    <div className={`progressive-address-input ${className}`}>
      {/* Progress Steps */}
      {showProgressSteps && progressSteps.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            {progressSteps.map((step, index) => (
              <div 
                key={step.step}
                className={`flex items-center ${index < progressSteps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.step === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${step.completed ? 'text-green-600' : 'text-gray-600'}`}>
                  {step.title}
                </span>
                {index < progressSteps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step.completed ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZIP Code Input */}
      {currentStep === 'zip' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              id="zipCode"
              type="text"
              placeholder="Enter your ZIP code (e.g., 75201)"
              value={formData.zipCode}
              onChange={(e) => handleZipCodeChange(e.target.value)}
              maxLength={5}
              className={`
                w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}
              `}
              autoFocus={autoFocus}
              disabled={isLoading}
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Analyzing service area...</span>
            </div>
          )}

          {zipAnalysis && !isLoading && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Service Area Analysis</h4>
              <p className="text-blue-800 text-sm mb-3">{zipAnalysis.explanation}</p>
              
              {zipAnalysis.primaryTdsp && (
                <div className="text-sm">
                  <strong>Primary Utility:</strong> {zipAnalysis.primaryTdsp.name}
                </div>
              )}

              {zipAnalysis.alternatives.length > 0 && (
                <div className="text-sm mt-2">
                  <strong>Alternative Utilities:</strong>{' '}
                  {zipAnalysis.alternatives.map((tdsp: TdspInfo) => tdsp.name).join(', ')}
                </div>
              )}

              {!zipAnalysis.requiresAddressValidation && (
                <button
                  onClick={() => {
                    const addressInfo: AddressInfo = {
                      street: 'Unknown',
                      city: 'Unknown',
                      state: 'TX',
                      zipCode: formData.zipCode
                    };
                    
                    onAddressResolved({
                      address: addressInfo,
                      tdsp: zipAnalysis.primaryTdsp,
                      apiParams: addressTdspResolver.createApiParams(zipAnalysis.primaryTdsp),
                      confidence: 'medium'
                    });
                  }}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Continue with {zipAnalysis.primaryTdsp?.name}
                </button>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-yellow-800 text-sm flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Address Input Form */}
      {currentStep === 'address' && (
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              id="street"
              type="text"
              placeholder="123 Main Street"
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              className={`
                w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.street ? 'border-red-500' : 'border-gray-300'}
              `}
              autoFocus
              disabled={isLoading}
            />
            {errors.street && (
              <p className="mt-1 text-sm text-red-600">{errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                id="city"
                type="text"
                placeholder="Dallas"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className={`
                  w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.city ? 'border-red-500' : 'border-gray-300'}
                `}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="TX">Texas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                id="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                readOnly
              />
            </div>

            <div>
              <label htmlFor="zip4" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP+4 (Optional)
              </label>
              <input
                id="zip4"
                type="text"
                placeholder="1234"
                value={formData.zip4}
                onChange={(e) => setFormData(prev => ({ ...prev, zip4: e.target.value }))}
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Unit/Apartment Number (Optional)
            </label>
            <input
              id="unitNumber"
              type="text"
              placeholder="Apt 101, Suite 200, etc."
              value={formData.unitNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, unitNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('zip')}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 font-medium"
              disabled={isLoading}
            >
              Back to ZIP
            </button>
            <button
              type="submit"
              className="flex-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Resolving...' : 'Find My Utility Provider'}
            </button>
          </div>
        </form>
      )}

      {/* Verification Step */}
      {currentStep === 'verification' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">Determining Your Utility Provider</h3>
          <p className="text-gray-600 mt-2">Please wait while we analyze your service area...</p>
        </div>
      )}

      {/* TDSP Selection */}
      {currentStep === 'selection' && tdspOptions && (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Multiple Utility Providers Found</h4>
            <p className="text-yellow-800 text-sm">{tdspOptions.helpText}</p>
          </div>

          <div className="space-y-3">
            {tdspOptions.options.map((option: any, index: number) => (
              <button
                key={option.tdsp.duns}
                onClick={() => handleTdspSelection(option.tdsp)}
                className={`
                  w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors
                  ${option.recommended ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {option.tdsp.name}
                      {option.recommended && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">{option.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(option.confidence * 100)}% | Zone: {option.tdsp.zone}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentStep('address')}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200"
          >
            Back to Address Form
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressiveAddressInput;