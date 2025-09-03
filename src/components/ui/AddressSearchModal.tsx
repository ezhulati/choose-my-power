import React, { useState, useEffect } from 'react';
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
  const [searchResults, setSearchResults] = useState<ESIIDLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ESIIDLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'results' | 'success'>('search');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAddress('');
      setZipCode('');
      setSearchResults([]);
      setSelectedLocation(null);
      setSearchError(null);
      setStep('search');
    }
  }, [isOpen]);

  // Auto-search as user types (with debouncing)
  useEffect(() => {
    if (address.length >= 3 && zipCode.length === 5) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [address, zipCode]);

  const handleSearch = async () => {
    if (!address.trim() || zipCode.length !== 5) {
      setSearchError('Please enter a valid address and 5-digit ZIP code');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Call our API proxy to search for ESIIDs
      const response = await fetch('/api/ercot/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          zipCode: zipCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to search for service locations');
      }

      const locations: ESIIDLocation[] = await response.json();
      
      if (locations.length === 0) {
        setSearchError('No service locations found for this address. Please check your address and try again.');
        setSearchResults([]);
      } else {
        setSearchResults(locations);
        setStep('results');
      }
    } catch (error) {
      console.error('ERCOT API search error:', error);
      setSearchError('Unable to search for service locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = async (location: ESIIDLocation) => {
    setIsValidating(true);
    setSearchError(null);

    try {
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
    }
  };

  const handleProceedToOrder = () => {
    if (selectedLocation) {
      onSuccess(selectedLocation.esiid, selectedLocation.address);
      // Redirect to ComparePower order flow
      const orderUrl = `https://orders.comparepower.com/order/service_location?esiid=${selectedLocation.esiid}&plan_id=${planData.id}`;
      window.open(orderUrl, '_blank');
    }
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
            className="w-full"
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
            className="w-full"
          />
        </div>

        {searchError && (
          <div className="flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            {searchError}
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={!address.trim() || zipCode.length !== 5 || isSearching}
          className="w-full bg-texas-navy hover:bg-texas-navy/90 text-white"
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
              "cursor-pointer border-2 transition-all duration-200 hover:border-texas-navy",
              isValidating && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isValidating && handleSelectLocation(location)}
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
                  </div>
                </div>
                {isValidating ? (
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin flex-shrink-0 ml-2" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchError && (
        <div className="flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-texas-navy" />
            Check Service Availability
          </DialogTitle>
          <DialogDescription>
            Verify that this electricity plan is available at your service address.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AddressSearchModal;