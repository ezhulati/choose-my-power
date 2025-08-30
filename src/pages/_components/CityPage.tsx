import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { MapPin, TrendingDown, Users, Zap, Building, ArrowRight, Search, Star } from 'lucide-react';

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
                  We're working to add more cities in {stateData.name}. Meanwhile, you can view quality providers 
                  available statewide or search by ZIP code to find options in your area.
                </p>
                
                <div className="max-w-md mx-auto mb-8">
                  <ZipCodeSearch 
                    onSearch={(zipCode) => navigate(`/${state}/electricity-providers`)} 
                    placeholder="Enter zip code"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate(`/${state}/electricity-providers`)}
                    className="bg-texas-navy text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium inline-flex items-center justify-center"
                  >
                    View All {stateData.name} Providers
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                  <button
                    onClick={() => navigate(`/${state}/electricity-rates`)}
                    className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    See {stateData.name} Rates
                  </button>
                </div>
                
                {/* Available Cities */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Available {stateData.name} Cities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {stateData.topCities.map((availableCity) => (
                      <button
                        key={availableCity.id}
                        onClick={() => navigate(`/${state}/${availableCity.slug}/electricity-providers`)}
                        className="p-3 text-sm text-texas-navy hover:text-texas-navy hover:bg-texas-cream-200 rounded-lg transition-colors border border-gray-200"
                      >
                        {availableCity.name}
                      </button>
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
                
                <button
                  onClick={() => navigate('/')}
                  className="bg-texas-navy text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium inline-flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Start Your Search
                </button>
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
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate(`/${state}/electricity-providers`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Finally. {cityData.name} Electricity That Makes Sense
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Moving to {cityData.name}? Here's why transferring your old plan usually backfires: Your old rate was based on your OLD home's size. "Fixed" rates aren't fixed—they change with usage. A plan for a 2-bedroom apartment costs way more in a 4-bedroom house. We found {cityProviders.length} quality providers that actually work for your new {cityData.name} home.
              </p>

              {/* City Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-texas-cream-200 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="h-5 w-5 text-texas-navy mr-2" />
                    <span className="text-sm font-medium text-texas-navy">Avg Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{cityData.averageRate}¢</div>
                  <div className="text-sm text-texas-navy">per kWh</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Providers</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{cityProviders.length}</div>
                  <div className="text-sm text-green-700">available</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Building className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">Population</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(cityData.population / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-purple-700">residents</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Market</span>
                  </div>
                  <div className="text-lg font-bold text-orange-900">
                    {stateData.isDeregulated ? 'Choice' : 'Regulated'}
                  </div>
                  <div className="text-sm text-orange-700">market type</div>
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
                    <button
                      key={zip}
                      onClick={() => handleZipSearch(zip)}
                      className="text-texas-navy hover:text-texas-navy hover:underline"
                    >
                      {zip}
                    </button>
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
              <button
                key={usage}
                onClick={() => setSelectedUsage(usage as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedUsage === usage
                    ? 'bg-texas-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {usage} kWh/month
              </button>
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
            <button
              onClick={() => navigate(`/compare/providers`)}
              className="bg-texas-navy text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Find Plans That Fit
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={provider.logo}
                      alt={`${provider.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-600">{provider.rating} ({provider.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{provider.description}</p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/providers/${provider.slug}`)}
                      className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      See Plans & Rates
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            About Electricity Service in {cityData.name}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Market Overview</h4>
              <p className="text-gray-600 text-sm mb-4">
                {cityData.name} residents can choose from {cityProviders.length} electricity providers 
                in {stateData.name}'s {stateData.isDeregulated ? 'deregulated' : 'regulated'} market. 
                The average electricity rate is {cityData.averageRate}¢ per kWh.
              </p>
              
              <h4 className="font-medium text-gray-900 mb-2">How to Switch</h4>
              <p className="text-gray-600 text-sm">
                Switching electricity providers in {cityData.name} is simple and free. Compare plans above, 
                choose your provider, and they'll handle the switch for you. There's no interruption to your service.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Utility Information</h4>
              <p className="text-gray-600 text-sm mb-4">
                Your electricity is delivered through the local utility grid, regardless of which provider you choose. 
                The utility company maintains the power lines and handles outages.
              </p>
              
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
      </div>
    </div>
  );
}