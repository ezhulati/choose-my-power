/**
 * Advanced Address Input Component for TDSP Resolution
 * 
 * Provides split ZIP code and address collection with comprehensive validation,
 * autocomplete suggestions, and progressive enhancement for precise TDSP determination.
 * 
 * Features:
 * - Split ZIP and street address inputs
 * - Real-time address validation and formatting
 * - Google Places API integration for autocomplete
 * - ESIID lookup for boundary ZIP codes
 * - Progressive enhancement (works without JS)
 * - Mobile-optimized touch targets
 * - Texas branding and accessibility
 * 
 * @component AddressInput
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin,
  Home,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Navigation,
  Building,
  Loader2,
  ArrowRight,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElectricityPlans } from '@/hooks/useElectricityPlans';

interface AddressSuggestion {
  id: string;
  fullAddress: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'google' | 'usps' | 'manual';
  placeId?: string;
}

interface ValidationState {
  zipCode: {
    isValid: boolean;
    message: string;
    isDeregulated: boolean;
    tdspName?: string;
  };
  address: {
    isValid: boolean;
    message: string;
    isFormatted: boolean;
  };
  overall: {
    isComplete: boolean;
    requiresAddress: boolean;
    confidence: 'high' | 'medium' | 'low';
  };
}

export interface AddressInputProps {
  /** Initial ZIP code value */
  initialZipCode?: string;
  /** Initial address value */
  initialAddress?: string;
  /** Callback when valid address is collected */
  onAddressComplete?: (data: {
    zipCode: string;
    address: string;
    city?: string;
    formattedAddress?: string;
    confidence: 'high' | 'medium' | 'low';
  }) => void;
  /** Callback for ZIP code changes */
  onZipCodeChange?: (zipCode: string, isValid: boolean) => void;
  /** Show address field initially or only after ZIP validation */
  showAddressField?: 'always' | 'after-zip' | 'boundary-only';
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual style variant */
  variant?: 'default' | 'texas' | 'compact';
  /** Enable Google Places autocomplete */
  enableAutocomplete?: boolean;
  /** Show validation messages */
  showValidation?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Disable input fields */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Success callback */
  onSuccess?: (data: any) => void;
  /** Error callback */
  onError?: (error: any) => void;
}

export function AddressInput({
  initialZipCode = '',
  initialAddress = '',
  onAddressComplete,
  onZipCodeChange,
  showAddressField = 'after-zip',
  size = 'md',
  variant = 'texas',
  enableAutocomplete = true,
  showValidation = true,
  className,
  disabled = false,
  loading: externalLoading = false,
  error: externalError,
  onSuccess,
  onError
}: AddressInputProps) {
  
  // Hook for electricity plans integration
  const {
    zipCode,
    address,
    isZipValid,
    isAddressValid,
    isLoading,
    error: hookError,
    setZipCode,
    setAddress,
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
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [isAddressExpanded, setIsAddressExpanded] = useState(showAddressField === 'always');
  const [validationState, setValidationState] = useState<ValidationState>({
    zipCode: { isValid: false, message: '', isDeregulated: false },
    address: { isValid: false, message: '', isFormatted: false },
    overall: { isComplete: false, requiresAddress: false, confidence: 'low' }
  });
  const [hasUserInteraction, setHasUserInteraction] = useState(false);

  // Refs
  const zipInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  // Initialize Google Places API
  useEffect(() => {
    if (!enableAutocomplete || typeof window === 'undefined') return;

    const initializeGooglePlaces = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      }
    };

    if (window.google?.maps?.places) {
      initializeGooglePlaces();
    } else {
      // Load Google Places API if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`;\n      script.onload = initializeGooglePlaces;
      document.head.appendChild(script);
    }
  }, [enableAutocomplete]);

  // Initialize with props
  useEffect(() => {
    if (initialZipCode && initialZipCode !== zipCode) {
      setZipCode(initialZipCode);
    }
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialZipCode, initialAddress, setZipCode, setAddress]);

  // Validate ZIP code
  const validateZipCode = useCallback((zip: string) => {
    const cleanZip = zip.replace(/\D/g, '').slice(0, 5);
    
    if (cleanZip.length !== 5) {
      return {
        isValid: false,
        message: 'ZIP code must be 5 digits',
        isDeregulated: false
      };
    }

    if (!cleanZip.startsWith('7')) {
      return {
        isValid: false,
        message: 'Please enter a Texas ZIP code',
        isDeregulated: false
      };
    }

    // Check if ZIP is in deregulated market (simplified check)
    const isDeregulated = ['770', '771', '772', '773', '774', '775', '776', '777', '778', '779',
                          '750', '751', '752', '753', '754', '755', '756', '757', '758', '759',
                          '787', '786', '784', '783', '782', '781', '780'].some(prefix => 
                            cleanZip.startsWith(prefix));

    if (!isDeregulated) {
      return {
        isValid: false,
        message: 'This ZIP code is served by a municipal utility',
        isDeregulated: false
      };
    }

    // Mock TDSP detection (in production, use actual service)
    const tdspMap: Record<string, string> = {
      '770': 'CenterPoint Energy',
      '771': 'CenterPoint Energy',
      '750': 'Oncor Electric Delivery',
      '751': 'Oncor Electric Delivery',
      '787': 'AEP Texas Central',
      '786': 'AEP Texas Central'
    };

    const tdspName = tdspMap[cleanZip.substring(0, 3)] || 'Texas Utility';

    return {
      isValid: true,
      message: `Served by ${tdspName}`,
      isDeregulated: true,
      tdspName
    };
  }, []);

  // Validate address
  const validateAddress = useCallback((addr: string, zip: string) => {
    if (!addr || addr.trim().length < 5) {
      return {
        isValid: false,
        message: 'Please enter a complete street address',
        isFormatted: false
      };
    }

    // Basic address format validation
    const hasNumber = /^\\d+/.test(addr.trim());
    if (!hasNumber) {
      return {
        isValid: false,
        message: 'Address must start with a house number',
        isFormatted: false
      };
    }

    const words = addr.trim().split(/\\s+/);
    if (words.length < 3) {
      return {
        isValid: false,
        message: 'Please provide a complete address',
        isFormatted: false
      };
    }

    return {
      isValid: true,
      message: 'Address format looks good',
      isFormatted: true
    };
  }, []);

  // Update validation state
  useEffect(() => {
    const zipValidation = validateZipCode(zipCode);
    const addressValidation = validateAddress(address, zipCode);

    // Determine if address is required
    const requiresAddress = zipValidation.isValid && (
      showAddressField === 'always' ||
      (showAddressField === 'boundary-only' && isBoundaryZip(zipCode))
    );

    const isComplete = zipValidation.isValid && (!requiresAddress || addressValidation.isValid);
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (isComplete) {
      confidence = requiresAddress && addressValidation.isValid ? 'high' : 'medium';
    }

    const newValidationState = {
      zipCode: zipValidation,
      address: addressValidation,
      overall: {
        isComplete,
        requiresAddress,
        confidence
      }
    };

    setValidationState(newValidationState);

    // Trigger callbacks
    if (zipValidation.isValid !== isZipValid) {
      onZipCodeChange?.(zipCode, zipValidation.isValid);
    }

    if (isComplete && onAddressComplete) {
      onAddressComplete({
        zipCode,
        address: requiresAddress ? address : '',
        formattedAddress: selectedSuggestion?.formattedAddress,
        confidence
      });
    }
  }, [zipCode, address, selectedSuggestion, showAddressField, validateZipCode, validateAddress, onZipCodeChange, onAddressComplete, isZipValid]);

  // Check if ZIP is boundary ZIP (requires address for TDSP resolution)
  const isBoundaryZip = useCallback((zip: string): boolean => {
    // Mock boundary ZIP detection
    const boundaryZips = ['75001', '77001', '78701']; // Example boundary ZIPs
    return boundaryZips.includes(zip);
  }, []);

  // Handle ZIP code input
  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\\D/g, '').slice(0, 5);
    setZipCode(value);
    setHasUserInteraction(true);

    // Show address field if needed
    if (value.length === 5 && validateZipCode(value).isValid) {
      if (showAddressField === 'after-zip' || 
          (showAddressField === 'boundary-only' && isBoundaryZip(value))) {
        setIsAddressExpanded(true);
        // Focus address field after a short delay
        setTimeout(() => addressInputRef.current?.focus(), 300);
      }
    }

    clearError();
    trackEvent('zip_input_change', { zipCode: value, length: value.length });
  }, [setZipCode, validateZipCode, showAddressField, isBoundaryZip, clearError, trackEvent]);

  // Handle address input with autocomplete
  const handleAddressChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setHasUserInteraction(true);

    if (!value || value.length < 3 || !enableAutocomplete || !autocompleteService.current) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const request = {
        input: `${value}, Texas, USA`,
        componentRestrictions: { country: 'US', administrativeArea: 'TX' },
        types: ['address']
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: string) => {
        if (status === 'OK' && predictions) {
          const suggestions: AddressSuggestion[] = predictions.slice(0, 5).map((prediction, index) => ({
            id: `suggestion_${index}`,
            fullAddress: prediction.description,
            streetNumber: '',
            streetName: '',
            city: '',
            state: 'TX',
            zipCode: zipCode,
            formattedAddress: prediction.description,
            confidence: 'medium' as const,
            source: 'google' as const,
            placeId: prediction.place_id
          }));
          
          setAddressSuggestions(suggestions);
          setShowSuggestions(true);
        }
      });
    } catch (error) {
      console.warn('Address autocomplete error:', error);
    }

    trackEvent('address_input_change', { addressLength: value.length });
  }, [setAddress, enableAutocomplete, zipCode, trackEvent]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddress(suggestion.formattedAddress);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setAddressSuggestions([]);

    trackEvent('address_suggestion_selected', {
      source: suggestion.source,
      confidence: suggestion.confidence
    });
  }, [setAddress, trackEvent]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationState.overall.isComplete || disabled) {
      return;
    }

    trackEvent('address_form_submitted', {
      zipCode,
      hasAddress: !!address,
      confidence: validationState.overall.confidence
    });

    await searchPlans({
      zipCode,
      address: validationState.overall.requiresAddress ? address : undefined
    });
  }, [validationState, disabled, zipCode, address, searchPlans, trackEvent]);

  // Size configurations
  const sizeConfig = useMemo(() => ({
    sm: {
      input: 'h-9 text-sm',
      button: 'h-9 px-3 text-sm',
      icon: 'h-4 w-4'
    },
    md: {
      input: 'h-11 text-base',
      button: 'h-11 px-4 text-base',
      icon: 'h-5 w-5'
    },
    lg: {
      input: 'h-14 text-lg',
      button: 'h-14 px-6 text-lg',
      icon: 'h-6 w-6'
    }
  }), []);

  // Variant configurations
  const variantConfig = useMemo(() => ({
    default: {
      container: 'bg-background border border-input rounded-lg',
      input: 'border border-input',
      card: 'border'
    },
    texas: {
      container: 'bg-gradient-to-br from-texas-cream-50 to-white border-2 border-texas-navy/20 rounded-xl',
      input: 'border-2 border-texas-navy/20 focus:border-texas-navy/40',
      card: 'border-2 border-texas-navy/20 shadow-lg'
    },
    compact: {
      container: 'bg-gray-50 border border-gray-200 rounded-lg',
      input: 'border border-gray-200',
      card: 'border border-gray-200'
    }
  }), []);

  const config = sizeConfig[size];
  const style = variantConfig[variant];
  const isLoading = isLoading || externalLoading;
  const error = hookError || externalError;

  return (
    <Card className={cn(style.card, 'w-full max-w-2xl', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-texas-navy">
          <MapPin className={config.icon} />
          Find Your Electricity Plans
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your location to compare available electricity plans
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ZIP Code Section */}
          <div className="space-y-2">
            <label htmlFor="zipcode" className="text-sm font-medium text-texas-navy">
              ZIP Code <span className="text-texas-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
                config.icon,
                'text-texas-navy/60'
              )} />
              <Input
                ref={zipInputRef}
                id="zipcode"
                type="text"
                value={zipCode}
                onChange={handleZipChange}
                placeholder="Enter Texas ZIP code"
                maxLength={5}
                disabled={disabled || isLoading}
                className={cn(
                  config.input,
                  style.input,
                  'pl-10 pr-12',
                  validationState.zipCode.isValid && 'border-green-500',
                  hasUserInteraction && !validationState.zipCode.isValid && zipCode.length > 0 && 'border-red-500'
                )}
                aria-describedby="zip-validation"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {zipCode.length === 5 && (
                  validationState.zipCode.isValid ? (
                    <CheckCircle className={cn(config.icon, 'text-green-500')} />
                  ) : (
                    <AlertCircle className={cn(config.icon, 'text-red-500')} />
                  )
                )}
              </div>
            </div>
            
            {/* ZIP Validation Message */}
            {showValidation && hasUserInteraction && zipCode && (
              <div 
                id="zip-validation" 
                className={cn(
                  'flex items-center gap-2 text-sm',
                  validationState.zipCode.isValid ? 'text-green-600' : 'text-red-600'
                )}
              >
                {validationState.zipCode.isValid ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{validationState.zipCode.message}</span>
              </div>
            )}
          </div>

          {/* Address Section - Conditionally Rendered */}
          {isAddressExpanded && (
            <div className="space-y-2 animate-in slide-in-from-top-5 duration-300">
              <div className="flex items-center justify-between">
                <label htmlFor="address" className="text-sm font-medium text-texas-navy">
                  Street Address
                  {validationState.overall.requiresAddress && (
                    <span className="text-texas-red-500"> *</span>
                  )}
                </label>
                {validationState.overall.requiresAddress && (
                  <Badge variant="outline" className="text-xs border-texas-gold text-texas-gold-700">
                    Required for boundary ZIP
                  </Badge>
                )}
              </div>
              
              <div className="relative">
                <Home className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
                  config.icon,
                  'text-texas-navy/60'
                )} />
                <Input
                  ref={addressInputRef}
                  id="address"
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="123 Main Street"
                  disabled={disabled || isLoading}
                  className={cn(
                    config.input,
                    style.input,
                    'pl-10',
                    validationState.address.isValid && 'border-green-500',
                    hasUserInteraction && 
                    validationState.overall.requiresAddress && 
                    !validationState.address.isValid && 
                    address.length > 0 && 'border-red-500'
                  )}
                  aria-describedby="address-validation"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className={cn(config.icon, 'animate-spin text-texas-gold')} />
                  </div>
                )}
              </div>

              {/* Address Suggestions */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <Card 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 border-2 border-texas-navy/20 shadow-xl"
                >
                  <CardContent className="p-0">
                    <div className="max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.id}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-texas-gold/10 transition-colors"
                        >
                          <Building className="h-4 w-4 text-texas-navy/60 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {suggestion.formattedAddress}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address Validation Message */}
              {showValidation && hasUserInteraction && validationState.overall.requiresAddress && address && (
                <div 
                  id="address-validation" 
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    validationState.address.isValid ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {validationState.address.isValid ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{validationState.address.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error.userMessage || error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!validationState.overall.isComplete || disabled || isLoading}
              className={cn(
                'flex-1',
                config.button,
                'bg-gradient-to-r from-texas-navy to-blue-800 hover:from-texas-navy/90 hover:to-blue-800/90 text-white shadow-lg'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className={cn(config.icon, 'animate-spin mr-2')} />
                  Searching...
                </>
              ) : (
                <>
                  <Search className={cn(config.icon, 'mr-2')} />
                  Find Electricity Plans
                </>
              )}
            </Button>

            {!isAddressExpanded && validationState.zipCode.isValid && showAddressField !== 'always' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressExpanded(true)}
                className={cn(
                  config.button,
                  'border-texas-navy/30 text-texas-navy hover:bg-texas-navy hover:text-white'
                )}
              >
                <Home className={cn(config.icon, 'mr-2')} />
                Add Address
              </Button>
            )}
          </div>

          {/* Confidence Indicator */}
          {validationState.overall.isComplete && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Search confidence: <strong className="capitalize">{validationState.overall.confidence}</strong>
                {validationState.overall.confidence === 'high' && ' - Precise TDSP detection'}
                {validationState.overall.confidence === 'medium' && ' - Good ZIP coverage'}
                {validationState.overall.confidence === 'low' && ' - Basic search available'}
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Export with display name
AddressInput.displayName = 'AddressInput';