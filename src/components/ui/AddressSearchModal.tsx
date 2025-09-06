"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { 
  MapPin, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Home
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ESIIDLocation {
  esiid: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  tdsp: string;
  meter_type: string;
}

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: {
    id: string;
    name: string;
    provider: {
      name: string;
    };
    apiPlanId?: string; // Real MongoDB ObjectId from API
  };
  onSuccess: (esiid: string, address: string) => void;
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  isOpen,
  onClose,
  planData,
  onSuccess
}) => {
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [usage, setUsage] = useState(1000);
  const [searchResults, setSearchResults] = useState<ESIIDLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ESIIDLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validatingEsiid, setValidatingEsiid] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'results' | 'success'>('search');
  
  // Use refs to prevent stale closures and manage cleanup
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<{ address: string; zipCode: string } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up any pending operations
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset state
      setAddress('');
      setZipCode('');
      setUsage(1000);
      setSearchResults([]);
      setSelectedLocation(null);
      setSearchError(null);
      setPlanError(null);
      setValidatingEsiid(null);
      setStep('search');
      setIsSearching(false);
      lastSearchRef.current = null;
    } else {
      // Focus first input when modal opens
      setTimeout(() => {
        document.getElementById('address')?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Memoized search function to prevent recreation
  const performSearch = useCallback(async (searchAddress: string, searchZip: string) => {
    // Prevent duplicate searches for same values
    if (lastSearchRef.current && 
        lastSearchRef.current.address === searchAddress && 
        lastSearchRef.current.zipCode === searchZip) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsSearching(true);
    setSearchError(null);
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Store the search parameters to prevent duplicates
    lastSearchRef.current = { address: searchAddress, zipCode: searchZip };

    try {
      const response = await fetch('/api/ercot/search-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: searchAddress,
          zipCode: searchZip
        }),
        signal: abortController.signal
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to search for service locations');
      }

      const locations: ESIIDLocation[] = await response.json();
      
      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        if (locations.length === 0) {
          setSearchError('No service locations found for this address. Please check your address and try again.');
          setSearchResults([]);
        } else {
          setSearchResults(locations);
          setStep('results');
        }
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('ERCOT API search error:', error);
      setSearchError('Unable to search for service locations. Please try again.');
    } finally {
      // Only update searching state if this was the current request
      if (abortControllerRef.current === abortController) {
        setIsSearching(false);
        abortControllerRef.current = null;
      }
    }
  }, []);

  // Auto-search with proper debouncing (no dependency on isSearching!)
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Check if we should search
    if (address.length >= 3 && zipCode.length === 5) {
      // Set up new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performSearch(address, zipCode);
      }, 1200); // Increased debounce time for better UX
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [address, zipCode, performSearch]); // Removed isSearching dependency!

  // Manual search handler
  const handleSearch = async () => {
    if (!address.trim() || zipCode.length !== 5) {
      setSearchError('Please enter a valid address and 5-digit ZIP code');
      return;
    }

    // Clear any pending auto-search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await performSearch(address, zipCode);
  };

  const handleSelectLocation = async (location: ESIIDLocation) => {
    // Prevent multiple rapid clicks
    if (isValidating) return;
    
    setIsValidating(true);
    setValidatingEsiid(location.esiid);
    setSearchError(null);

    try {
      // Add a small delay to prevent fidgety behavior
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get detailed ESIID information via our API proxy
      const response = await fetch('/api/ercot/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          esiid: location.esiid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to validate service location');
      }

      const esiidDetails = await response.json();
      
      // Validate that the plan is available for this ESIID
      setSelectedLocation(location);
      setStep('success');
      
      // Track the selection for analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'address_validation_success', {
          plan_id: planData.id,
          provider: planData.provider.name,
          esiid: location.esiid,
          zip_code: zipCode
        });
      }
    } catch (error) {
      console.error('ERCOT API validation error:', error);
      setSearchError('Unable to validate this service location. Please try another address.');
    } finally {
      setIsValidating(false);
      setValidatingEsiid(null);
    }
  };

  // Get the MongoDB ObjectId for the plan
  const getPlanObjectId = (planData: any): string | null => {
    // First priority: Use API-fetched MongoDB ObjectId
    if (planData.apiPlanId) {
      console.log('[AddressModal] Using apiPlanId:', planData.apiPlanId);
      return planData.apiPlanId;
    }
    
    // Second priority: Use plan's own ID if it's a valid MongoDB ObjectId (24 hex chars)
    if (planData.id && /^[a-f0-9]{24}$/i.test(planData.id)) {
      console.log('[AddressModal] Using plan.id:', planData.id);
      return planData.id;
    }
    
    // No valid plan ID found - this is an error condition
    console.error('[AddressModal] No valid plan ID found for:', {
      planName: planData.name,
      provider: planData.provider?.name,
      planId: planData.id,
      apiPlanId: planData.apiPlanId
    });
    
    return null;
  };

  const handleProceedToOrder = () => {
    if (!selectedLocation) {
      console.error('[AddressModal] No location selected');
      return;
    }
    
    // Get the actual MongoDB ObjectId for the plan
    const actualPlanId = getPlanObjectId(planData);
    
    // Check if we have a valid plan ID
    if (!actualPlanId) {
      setPlanError('Unable to process order. Plan information is missing or invalid. Please contact support.');
      console.error('[AddressModal] Cannot proceed with order - no valid plan ID', {
        planName: planData.name,
        provider: planData.provider?.name,
        planDataId: planData.id,
        apiPlanId: planData.apiPlanId
      });
      return;
    }
    
    // Clear any previous errors
    setPlanError(null);
    
    // Notify parent component of success
    onSuccess(selectedLocation.esiid, selectedLocation.address);
    
    // Build the order URL with user's selected ESIID, plan ID, and usage
    const orderUrl = `https://orders.comparepower.com/order/service_location?esiid=${selectedLocation.esiid}&plan_id=${actualPlanId}&usage=${usage}&zip_code=${zipCode}`;
    
    console.log('[AddressModal] Opening ComparePower order page:', {
      esiid: selectedLocation.esiid,
      planId: actualPlanId,
      planName: planData.name,
      provider: planData.provider.name,
      address: selectedLocation.address,
      zipCode: zipCode,
      usage: usage,
      originalPlanId: planData.id,
      apiPlanIdAvailable: !!planData.apiPlanId,
      planIdSource: planData.apiPlanId ? 'API' : (planData.id ? 'plan.id' : 'none')
    });
    
    // Open the order page in a new tab
    window.open(orderUrl, '_blank');
  };

  const renderSearchStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="mx-auto h-12 w-12 text-texas-navy mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Availability for {planData.name}
        </h3>
        <p className="text-gray-600">
          Enter your service address to verify this plan is available at your location.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full focus-visible:ring-2 focus-visible:ring-texas-navy/50 focus-visible:border-texas-navy"
            autoComplete="street-address"
            disabled={isSearching}
            required
          />
        </div>

        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <Input
            id="zipcode"
            type="text"
            placeholder="75201"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            maxLength={5}
            className="w-full focus-visible:ring-2 focus-visible:ring-texas-navy/50 focus-visible:border-texas-navy"
            autoComplete="postal-code"
            inputMode="numeric"
            disabled={isSearching}
            required
          />
        </div>

        <div>
          <label htmlFor="usage" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Usage (kWh)
          </label>
          <div className="relative">
            <Input
              id="usage"
              type="number"
              placeholder="1000"
              value={usage}
              onChange={(e) => setUsage(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1000)))}
              min="1"
              max="10000"
              step="50"
              className="w-full focus-visible:ring-2 focus-visible:ring-texas-navy/50 focus-visible:border-texas-navy pr-12"
              disabled={isSearching}
              required
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              kWh
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {[500, 1000, 1500, 2000].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setUsage(preset)}
                className={cn(
                  "px-2 py-1 text-xs rounded border transition-colors",
                  usage === preset 
                    ? "bg-texas-navy text-white border-texas-navy" 
                    : "bg-white text-gray-600 border-gray-300 hover:border-texas-navy hover:text-texas-navy"
                )}
                disabled={isSearching}
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Check your recent electricity bill. Most homes use 500-2000 kWh per month.
          </p>
        </div>

        {/* Show searching indicator */}
        {isSearching && address.length >= 3 && zipCode.length === 5 && (
          <div className="flex items-center text-sm text-gray-600">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching for service locations...
          </div>
        )}

        {searchError && (
          <div 
            className="flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
            {searchError}
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={!address.trim() || zipCode.length !== 5 || isSearching}
          className="w-full bg-texas-navy hover:bg-texas-navy/90 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200"
          type="button"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Check Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Service Locations Found
        </h3>
        <p className="text-gray-600">
          Select your exact service location to continue.
        </p>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {searchResults.map((location, index) => (
          <Card 
            key={location.esiid}
            className={cn(
              "cursor-pointer border-2 transition-all duration-200 hover:border-texas-navy hover:shadow-md active:scale-[0.98]",
              validatingEsiid === location.esiid && "border-texas-red bg-red-50",
              isValidating && validatingEsiid !== location.esiid && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isValidating) {
                handleSelectLocation(location);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select service location: ${location.address}, ${location.city}, ${location.state} ${location.zip}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{location.address}</p>
                  <p className="text-sm text-gray-600">
                    {location.city}, {location.state} {location.zip}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {location.tdsp}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {location.meter_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-texas-cream border-texas-gold/30 text-texas-navy font-mono">
                      ESIID: {location.esiid}
                    </Badge>
                  </div>
                </div>
                {validatingEsiid === location.esiid ? (
                  <Loader2 className="h-5 w-5 text-texas-red animate-spin flex-shrink-0 ml-2" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchError && (
        <div 
          className="flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
          {searchError}
        </div>
      )}

      <Button
        onClick={() => setStep('search')}
        variant="outline"
        className="w-full"
      >
        Search Different Address
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Plan Available!
        </h3>
        <p className="text-gray-600">
          <strong>{planData.name}</strong> by <strong>{planData.provider.name}</strong> is available for your home.
        </p>
      </div>

      {selectedLocation && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{selectedLocation.address}</p>
                <p className="text-sm text-gray-600">
                  {selectedLocation.city}, {selectedLocation.state} {selectedLocation.zip}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Service Provider: {selectedLocation.tdsp}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {planError && (
        <div 
          className="flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
          {planError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => setStep('search')}
          variant="outline"
          className="flex-1"
        >
          Check Another Address
        </Button>
        <Button
          onClick={handleProceedToOrder}
          className="flex-1 bg-texas-red hover:bg-texas-red-600 text-white"
        >
          Order This Plan
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'search':
        return renderSearchStep();
      case 'results':
        return renderResultsStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderSearchStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="address-search-description"
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2"
            id="address-search-title"
          >
            <MapPin className="h-5 w-5 text-texas-navy" aria-hidden="true" />
            Check Service Availability
          </DialogTitle>
          <DialogDescription id="address-search-description">
            Verify that this electricity plan is available at your service address.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AddressSearchModal;