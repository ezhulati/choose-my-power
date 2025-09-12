/**
 * Smart Address Input Component
 * 
 * A drop-in replacement for existing ZIP code inputs that adds
 * intelligent multi-TDSP handling and address collection when needed.
 * 
 * Features:
 * - Drop-in replacement for existing ZIP inputs
 * - Automatic detection of multi-TDSP ZIP codes
 * - Progressive enhancement with address collection
 * - Clear messaging about boundary areas
 * - Maintains existing form patterns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { addressTdspResolver } from '../../lib/address/address-tdsp-resolver';
import type { AddressInfo, TdspInfo } from '../../types/facets';

interface SmartAddressInputProps {
  onZipCodeChange?: (zipCode: string) => void;
  onAddressResolved?: (result: {
    address: AddressInfo;
    tdsp: TdspInfo;
    apiParams: unknown;
    confidence: string;
    method: string;
  }) => void;
  onError?: (error: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  initialValue?: string;
}

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const SmartAddressInput: React.FC<SmartAddressInputProps> = ({
  onZipCodeChange,
  onAddressResolved,
  onError,
  className = '',
  placeholder = '75201',
  autoFocus = false,
  disabled = false,
  required = false,
  initialValue = ''
}) => {
  const [zipCode, setZipCode] = useState(initialValue);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    unitNumber: '',
    zip4: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [zipAnalysis, setZipAnalysis] = useState<unknown>(null);

  // Handle ZIP code input with debounced analysis
  const analyzeZipCode = useCallback(async (zip: string) => {
    if (!/^\d{5}$/.test(zip)) {
      setValidation(null);
      setZipAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await addressTdspResolver.analyzeZipCode(zip);
      setZipAnalysis(analysis);

      if (analysis.isMultiTdsp && analysis.requiresAddressValidation) {
        setValidation({
          isValid: false,
          message: `ZIP ${zip} is on the border. Need your street to show the right prices.`,
          type: 'warning'
        });
        setShowAddressForm(true);
      } else if (analysis.isMultiTdsp) {
        setValidation({
          isValid: true,
          message: `A couple utilities serve here. Main one: ${analysis.primaryTdsp?.name}`,
          type: 'info'
        });
      } else if (analysis.primaryTdsp) {
        setValidation({
          isValid: true,
          message: `You get ${analysis.primaryTdsp.name}`,
          type: 'success'
        });
        
        // Auto-resolve with primary TDSP
        if (onAddressResolved) {
          const addressInfo: AddressInfo = {
            street: 'Unknown',
            city: 'Unknown',
            state: 'TX',
            zipCode: zip
          };
          
          onAddressResolved({
            address: addressInfo,
            tdsp: analysis.primaryTdsp,
            apiParams: addressTdspResolver.createApiParams(analysis.primaryTdsp),
            confidence: 'medium',
            method: 'zip-analysis'
          });
        }
      } else {
        setValidation({
          isValid: false,
          message: 'Unable to determine utility provider. Please verify ZIP code.',
          type: 'error'
        });
      }
    } catch (error) {
      setValidation({
        isValid: false,
        message: 'Error analyzing ZIP code. Please try again.',
        type: 'error'
      });
      onError?.(error instanceof Error ? error.message : 'ZIP code analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAddressResolved, onError]);

  // Debounced ZIP code analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (zipCode.length === 5) {
        analyzeZipCode(zipCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [zipCode, analyzeZipCode]);

  // Handle ZIP code input
  const handleZipCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(numericValue);
    onZipCodeChange?.(numericValue);

    // Reset form state when ZIP changes
    if (numericValue !== zipCode) {
      setShowAddressForm(false);
      setValidation(null);
      setZipAnalysis(null);
      setAddressForm({
        street: '',
        city: '',
        unitNumber: '',
        zip4: ''
      });
    }
  };

  // Handle address form submission
  const handleAddressSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressForm.street.trim() || addressForm.street.length < 5) {
      setValidation({
        isValid: false,
        message: 'Please enter a complete street address',
        type: 'error'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const addressInfo: AddressInfo = {
        street: addressForm.street.trim(),
        city: addressForm.city.trim() || 'Unknown',
        state: 'TX',
        zipCode,
        zip4: addressForm.zip4 || undefined,
        unitNumber: addressForm.unitNumber || undefined
      };

      const result = await addressTdspResolver.resolveTdspFromAddress(addressInfo);
      
      if (!result.success) {
        throw new Error(result.warnings.join('. ') || 'Address resolution failed');
      }

      setValidation({
        isValid: true,
        message: `Address resolved. Utility provider: ${result.tdsp?.name}`,
        type: 'success'
      });

      onAddressResolved?.({
        address: addressInfo,
        tdsp: result.tdsp!,
        apiParams: result.apiParams!,
        confidence: result.confidence,
        method: result.method
      });
    } catch (error) {
      setValidation({
        isValid: false,
        message: 'Unable to resolve address. Please verify and try again.',
        type: 'error'
      });
      onError?.(error instanceof Error ? error.message : 'Address resolution failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [zipCode, addressForm, onAddressResolved, onError]);

  return (
    <div className={`smart-address-input ${className}`}>
      {/* ZIP Code Input */}
      <div className="relative">
        <input
          type="text"
          value={zipCode}
          onChange={(e) => handleZipCodeChange(e.target.value)}
          placeholder={placeholder || "Enter zip code"}
          className={`
            w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-texas-navy focus:border-texas-navy
            ${validation?.type === 'error' ? 'border-red-500' : 
              validation?.type === 'warning' ? 'border-yellow-500' :
              validation?.type === 'success' ? 'border-green-500' :
              'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          autoFocus={autoFocus}
          disabled={disabled || isAnalyzing}
          required={required}
          maxLength={5}
          inputMode="numeric"
        />
        
        {isAnalyzing && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Validation Message */}
      {validation && (
        <div className={`
          mt-2 p-3 rounded-lg text-sm
          ${validation.type === 'error' ? 'bg-texas-red/10 text-texas-red-800' :
            validation.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
            validation.type === 'success' ? 'bg-green-50 text-green-800' :
            'bg-texas-cream-200 text-texas-navy'}
        `}>
          <div className="flex items-start">
            <span className="mr-2">
              {validation.type === 'error' ? '⚠️' :
               validation.type === 'warning' ? '⚠️' :
               validation.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            {validation.message}
          </div>
        </div>
      )}

      {/* Address Form (shown when needed) */}
      {showAddressForm && (
        <form onSubmit={handleAddressSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">We need a bit more info</h4>
            <p className="text-sm text-gray-600 mb-4">
              Your ZIP has multiple utilities - your street helps us show the right prices for you.
            </p>
          </div>

          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              What street are you on?
            </label>
            <input
              id="street"
              type="text"
              placeholder="Your street address"
              value={addressForm.street}
              onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-texas-navy focus:border-texas-navy"
              disabled={isAnalyzing}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Which city?
              </label>
              <input
                id="city"
                type="text"
                placeholder="City name"
                value={addressForm.city}
                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-texas-navy focus:border-texas-navy"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label htmlFor="zip4" className="block text-sm font-medium text-gray-700 mb-1">
                Extra ZIP digits (if you know them)
              </label>
              <input
                id="zip4"
                type="text"
                placeholder="1234"
                value={addressForm.zip4}
                onChange={(e) => setAddressForm(prev => ({ ...prev, zip4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-texas-navy focus:border-texas-navy"
                disabled={isAnalyzing}
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Unit/Apartment (Optional)
            </label>
            <input
              id="unitNumber"
              type="text"
              placeholder="Apt 101"
              value={addressForm.unitNumber}
              onChange={(e) => setAddressForm(prev => ({ ...prev, unitNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-texas-navy focus:border-texas-navy"
              disabled={isAnalyzing}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddressForm(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              disabled={isAnalyzing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 bg-texas-navy text-white px-6 py-2 rounded-md hover:bg-texas-navy/90 disabled:opacity-50"
              disabled={isAnalyzing || !addressForm.street.trim()}
            >
              {isAnalyzing ? 'Resolving...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {/* TDSP Information (when available) */}
      {zipAnalysis?.primaryTdsp && !showAddressForm && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <strong>Utility Provider:</strong> {zipAnalysis.primaryTdsp.name}
            <br />
            <strong>Service Zone:</strong> {zipAnalysis.primaryTdsp.zone}
            {zipAnalysis.alternatives.length > 0 && (
              <>
                <br />
                <strong>Alternative Providers:</strong> {zipAnalysis.alternatives.map((tdsp: TdspInfo) => tdsp.name).join(', ')}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAddressInput;