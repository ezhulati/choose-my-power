import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { MapPin, TrendingDown, Users, Zap, Building, ArrowRight, Search, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/card';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CityPageProps {
  state: string;
  city: string;
}

export function CityPage({ state, city }: CityPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedUsage, setSelectedUsage] = useState<'500' | '1000' | '2000'>('1000');

  const stateData = mockStates.find(s => s.slug === state);
  const cityData = stateData?.topCities.find(c => c.slug === city);
  
  if (!stateData || !cityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-texas-cream text-texas-navy rounded-lg mb-8">
              <MapPin className="h-10 w-10" />
            </div>
            
            {stateData ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Expanding Coverage in {stateData.name}
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  We're working to add more cities in {stateData.name}. Meanwhile, you can view licensed electricity companies 
                  available statewide or search by ZIP code to find options in your area.
                </p>
                
                <div className="max-w-md mx-auto mb-8">
                  <ZipCodeSearch 
                    onSearch={(zipCode) => navigate(`/${state}/electricity-providers`)} 
                    placeholder="Enter zip code"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="texas-primary"
                    size="lg"
                    onClick={() => navigate(`/${state}/electricity-providers`)}
                    className="inline-flex items-center justify-center"
                  >
                    View All {stateData.name} Providers
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/${state}/electricity-rates`)}
                  >
                    See {stateData.name} Rates
                  </Button>
                </div>
                
                {/* Available Cities */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Available {stateData.name} Cities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {stateData.topCities.map((availableCity) => (
                      <Button
                        key={availableCity.id}
                        variant="texas-ghost"
                        size="sm"
                        onClick={() => navigate(`/${state}/${availableCity.slug}/electricity-providers`)}
                        className="p-3 text-sm border border-gray-200"
                      >
                        {availableCity.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Find Electricity Providers in Your Area
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Enter your ZIP code below to find electricity providers and rates available at your specific address.
                </p>
                
                <div className="max-w-md mx-auto mb-8">
                  <ZipCodeSearch 
                    onSearch={(zipCode) => navigate('/texas/electricity-providers')} 
                    placeholder="Enter zip code"
                  />
                </div>
                
                <Button
                  variant="texas-primary"
                  size="lg"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Start Your Search
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const cityProviders = mockProviders.filter(p => 
    cityData.topProviders.includes(p.id)
  );

  const handleZipSearch = (zipCode: string) => {
    navigate(`/${state}/${city}/${zipCode}`);
  };

  const usageRates = {
    '500': { monthly: 65, yearly: 780 },
    '1000': { monthly: 120, yearly: 1440 },
    '2000': { monthly: 230, yearly: 2760 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Button variant="link" onClick={() => navigate('/')} className="p-0 h-auto text-sm text-gray-500 hover:text-texas-navy">Home</Button>
            <span className="mx-2">/</span>
            <Button variant="link" onClick={() => navigate(`/${state}/electricity-providers`)} className="p-0 h-auto text-sm text-gray-500 hover:text-texas-navy">
              {stateData.name}
            </Button>
            <span className="mx-2">/</span>
            <span>{cityData.name}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                {cityData.name} Electricity Options
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Moving to {cityData.name}? Here's why transferring your old plan usually backfires: Your old rate was based on your OLD home's size. "Fixed" rates aren't fixed—they change with usage. A plan for a 2-bedroom apartment costs way more in a 4-bedroom house. We found {cityProviders.length} licensed electricity companies that actually work for your new {cityData.name} home.
              </p>

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-4 bg-texas-cream-200 px-6 py-3 rounded-lg">
                  <span className="text-texas-navy font-medium">{cityProviders.length} providers available</span>
                </div>
              </div>
            </div>

            {/* ZIP Search Sidebar */}
            <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Your ZIP Code</h3>
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="font-medium mb-2">Popular ZIP Codes:</div>
                <div className="flex flex-wrap gap-2">
                  {cityData.zipCodes.map((zip) => (
                    <Button
                      key={zip}
                      variant="link"
                      onClick={() => handleZipSearch(zip)}
                      className="p-0 h-auto text-sm text-texas-navy hover:text-texas-navy hover:underline"
                    >
                      {zip}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Calculator */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Estimated Monthly Costs in {cityData.name}
          </h3>
          
          <div className="flex space-x-4 mb-4">
            {Object.keys(usageRates).map((usage) => (
              <Button
                key={usage}
                onClick={() => setSelectedUsage(usage as any)}
                variant={selectedUsage === usage ? 'texas-primary' : 'secondary'}
                size="sm"
              >
                {usage} kWh/month
              </Button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Usage</div>
              <div className="text-2xl font-bold text-gray-900">{selectedUsage}</div>
              <div className="text-sm text-gray-600">kWh/month</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Est. Monthly Bill</div>
              <div className="text-2xl font-bold text-green-900">
                ${usageRates[selectedUsage].monthly}
              </div>
              <div className="text-sm text-green-600">at {cityData.averageRate}¢/kWh</div>
            </div>
            <div className="text-center p-4 bg-texas-cream-200 rounded-lg">
              <div className="text-sm text-texas-navy mb-1">Est. Yearly Cost</div>
              <div className="text-2xl font-bold text-blue-900">
                ${usageRates[selectedUsage].yearly}
              </div>
              <div className="text-sm text-texas-navy">annual estimate</div>
            </div>
          </div>
        </div>

        {/* Providers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Quality Electricity Providers in {cityData.name}
            </h2>
            <Button
              variant="texas-primary"
              onClick={() => navigate(`/compare/providers`)}
            >
              Find Plans That Fit
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityProviders.map((provider) => (
              <Card key={provider.id} variant="provider-card" className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={provider.logo}
                      alt={`${provider.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{provider.rating} ({provider.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <p className="text-gray-600 text-sm">{provider.description}</p>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="texas-primary"
                    size="sm"
                    onClick={() => navigate(`/providers/${provider.slug}`)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    See Plans & Rates
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Local Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">
              About Electricity Service in {cityData.name}
            </h3>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Market Overview</h4>
                  <p className="text-gray-600 text-sm">
                    {cityData.name} residents can choose from {cityProviders.length} electricity providers 
                    in {stateData.name}'s {stateData.isDeregulated ? 'deregulated' : 'regulated'} market. 
                    The average electricity rate is {cityData.averageRate}¢ per kWh.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How to Switch</h4>
                  <p className="text-gray-600 text-sm">
                    Switching electricity providers in {cityData.name} is simple and free. Compare plans above, 
                    choose your provider, and they'll handle the switch for you. There's no interruption to your service.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Utility Information</h4>
                  <p className="text-gray-600 text-sm">
                    Your electricity is delivered through the local utility grid, regardless of which provider you choose. 
                    The utility company maintains the power lines and handles outages.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tips for {cityData.name} Residents</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Compare rates based on your actual usage</li>
                    <li>• Consider contract length and cancellation fees</li>
                    <li>• Look for green energy options if important to you</li>
                    <li>• Read customer reviews before switching</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}