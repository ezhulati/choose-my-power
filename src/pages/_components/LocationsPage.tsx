import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockStates, mockProviders, utilityCompanies } from '../../data/mockData';
import { 
  MapPin, Search, TrendingDown, Users, Zap, Building, ArrowRight, Star, 
  Globe, Phone, CheckCircle, AlertCircle, Calculator, Shield, Leaf, Award, 
  Clock, Eye, Target, Home, Filter, BarChart, DollarSign, Activity
} from 'lucide-react';

interface LocationsPageProps {
  onNavigate: (path: string) => void;
}

function LocationsPage({ onNavigate }: LocationsPageProps) {
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'texas' | 'pennsylvania'>('all');
  const [selectedMetric, setSelectedMetric] = useState<'providers' | 'rates' | 'population' | 'savings'>('providers');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    // Comprehensive ZIP code routing logic
    const zipToLocation: { [key: string]: { state: string; city: string } } = {
      // Texas ZIP codes
      '77001': { state: 'texas', city: 'houston' }, '77002': { state: 'texas', city: 'houston' },
      '75201': { state: 'texas', city: 'dallas' }, '75202': { state: 'texas', city: 'dallas' },
      '78701': { state: 'texas', city: 'austin' }, '78702': { state: 'texas', city: 'austin' },
      '78201': { state: 'texas', city: 'san-antonio' }, '78202': { state: 'texas', city: 'san-antonio' },
      '76101': { state: 'texas', city: 'fort-worth' }, '76102': { state: 'texas', city: 'fort-worth' },
      // Pennsylvania ZIP codes
      '19101': { state: 'pennsylvania', city: 'philadelphia' }, '19102': { state: 'pennsylvania', city: 'philadelphia' },
      '15201': { state: 'pennsylvania', city: 'pittsburgh' }, '15202': { state: 'pennsylvania', city: 'pittsburgh' },
    };

    const location = zipToLocation[zipCode];
    if (location) {
      onNavigate(`/${location.state}/${location.city}/electricity-providers`);
    } else {
      // Determine state by ZIP code pattern for fallback
      if (zipCode.startsWith('7')) {
        onNavigate('/texas/electricity-providers');
      } else if (zipCode.startsWith('1')) {
        onNavigate('/pennsylvania/electricity-providers');
      } else {
        onNavigate('/texas/electricity-providers');
      }
    }
  };

  const filteredStates = selectedRegion === 'all' 
    ? mockStates 
    : mockStates.filter(state => state.slug === selectedRegion);

  const totalCities = mockStates.reduce((sum, state) => sum + state.topCities.length, 0);
  const totalProviders = mockProviders.length;
  const totalZipCodes = mockStates.reduce((sum, state) => 
    sum + state.topCities.reduce((citySum, city) => citySum + city.zipCodes.length, 0), 0
  );

  const locationTypes = [
    {
      icon: Building,
      title: 'States & Markets',
      count: mockStates.length,
      description: 'Deregulated electricity markets with provider choice',
      action: () => onNavigate('/states')
    },
    {
      icon: Home,
      title: 'Major Cities',
      count: totalCities,
      description: 'Metropolitan areas with multiple provider options',
      action: () => onNavigate('/cities')
    },
    {
      icon: MapPin,
      title: 'ZIP Codes',
      count: `${totalZipCodes}+`,
      description: 'Service areas with specific provider coverage',
      action: () => setShowAdvancedSearch(true)
    },
    {
      icon: Zap,
      title: 'Utility Areas',
      count: `${Object.values(utilityCompanies).flat().length}`,
      description: 'Transmission and distribution service territories',
      action: () => onNavigate('/utilities')
    }
  ];

  const metrics = [
    { id: 'providers', label: 'Provider Count', icon: Users },
    { id: 'rates', label: 'Average Rate', icon: TrendingDown },
    { id: 'population', label: 'Population', icon: Building },
    { id: 'savings', label: 'Savings Potential', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <MapPin className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Location Intelligence - Electricity Market Analysis by Geography
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Comprehensive geographic analysis of electricity markets, providers, and opportunities. 
              Master location-specific intelligence for states, cities, ZIP codes, and utility territories.
            </p>

            {/* Main ZIP Search */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-white mb-6">Find Everything in Your Area</h2>
                <ZipCodeSearch onSearch={handleZipSearch} size="lg" placeholder="Enter your ZIP code for location details" />
                <p className="text-blue-200 text-sm mt-3">Get providers, plans, rates, utility info, and more</p>
              </div>
            </div>

            {/* Location Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{mockStates.length}</div>
                <div className="text-blue-200 text-sm">States Covered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{totalCities}</div>
                <div className="text-blue-200 text-sm">Major Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{totalProviders}</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{totalZipCodes}+</div>
                <div className="text-blue-200 text-sm">ZIP Codes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Types */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by Location Type
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find electricity information organized by states, cities, ZIP codes, and utility service areas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {locationTypes.map((type, index) => (
              <button
                key={index}
                onClick={type.action}
                className="bg-white p-8 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <type.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{type.count}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{type.title}</h3>
                <p className="text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Regional Filter & Metrics */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Location Overview</h2>
              <p className="text-lg text-gray-600">Compare electricity markets across different regions</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Regions</option>
                <option value="texas">Texas</option>
                <option value="pennsylvania">Pennsylvania</option>
              </select>

              {/* Metric Selector */}
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="providers">Show Provider Count</option>
                <option value="rates">Show Average Rates</option>
                <option value="population">Show Population</option>
                <option value="savings">Show Savings Potential</option>
              </select>
            </div>
          </div>
        </div>

        {/* State & City Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* States Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Building className="h-6 w-6 mr-3 text-blue-600" />
              States & Markets
            </h3>
            
            <div className="space-y-4">
              {filteredStates.map((state) => {
                const stateProviders = mockProviders.filter(p => p.serviceStates.includes(state.slug));
                const potentialSavings = Math.round((state.averageRate - 9.7) * 1000 / 100 * 12);
                
                return (
                  <div key={state.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <button
                          onClick={() => onNavigate(`/${state.slug}/electricity-providers`)}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {state.name}
                        </button>
                        <div className="text-sm text-gray-600">
                          {state.isDeregulated ? 'Deregulated Market' : 'Regulated Market'} • {state.abbreviation}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {selectedMetric === 'providers' && (
                          <>
                            <div className="text-2xl font-bold text-blue-600">{stateProviders.length}</div>
                            <div className="text-sm text-gray-500">providers</div>
                          </>
                        )}
                        {selectedMetric === 'rates' && (
                          <>
                            <div className="text-2xl font-bold text-green-600">{state.averageRate}¢</div>
                            <div className="text-sm text-gray-500">avg/kWh</div>
                          </>
                        )}
                        {selectedMetric === 'population' && (
                          <>
                            <div className="text-2xl font-bold text-purple-600">
                              {(state.topCities.reduce((sum, city) => sum + city.population, 0) / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-sm text-gray-500">residents</div>
                          </>
                        )}
                        {selectedMetric === 'savings' && (
                          <>
                            <div className="text-2xl font-bold text-orange-600">${potentialSavings}</div>
                            <div className="text-sm text-gray-500">potential/year</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Major Cities:</span>
                        <span className="font-medium ml-1">{state.topCities.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Utilities:</span>
                        <span className="font-medium ml-1">{state.utilityCompanies.length}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onNavigate(`/${state.slug}/electricity-providers`)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                      >
                        Providers
                      </button>
                      <button
                        onClick={() => onNavigate(`/${state.slug}/electricity-rates`)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                      >
                        Rates
                      </button>
                      <button
                        onClick={() => onNavigate(`/${state.slug}/electricity-plans`)}
                        className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100"
                      >
                        Plans
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Major Cities */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Home className="h-6 w-6 mr-3 text-green-600" />
              Major Cities
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredStates.flatMap(state => 
                state.topCities.map(city => ({
                  ...city,
                  stateName: state.name,
                  stateSlug: state.slug,
                  providerCount: city.topProviders.length
                }))
              ).sort((a, b) => b.population - a.population).slice(0, 12).map((city) => (
                <div key={city.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <button
                        onClick={() => onNavigate(`/${city.stateSlug}/${city.slug}/electricity-providers`)}
                        className="text-lg font-semibold text-green-600 hover:text-green-800"
                      >
                        {city.name}
                      </button>
                      <div className="text-sm text-gray-600">{city.stateName}</div>
                    </div>
                    
                    <div className="text-right">
                      {selectedMetric === 'providers' && (
                        <>
                          <div className="text-xl font-bold text-blue-600">{city.providerCount}</div>
                          <div className="text-xs text-gray-500">providers</div>
                        </>
                      )}
                      {selectedMetric === 'rates' && (
                        <>
                          <div className="text-xl font-bold text-green-600">{city.averageRate}¢</div>
                          <div className="text-xs text-gray-500">avg/kWh</div>
                        </>
                      )}
                      {selectedMetric === 'population' && (
                        <>
                          <div className="text-xl font-bold text-purple-600">
                            {(city.population / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-xs text-gray-500">residents</div>
                        </>
                      )}
                      {selectedMetric === 'savings' && (
                        <>
                          <div className="text-xl font-bold text-orange-600">
                            ${Math.round((city.averageRate - 9.7) * 1000 / 100 * 12)}
                          </div>
                          <div className="text-xs text-gray-500">potential/year</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    ZIP Codes: {city.zipCodes.slice(0, 3).join(', ')}
                    {city.zipCodes.length > 3 && ` +${city.zipCodes.length - 3} more`}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate(`/${city.stateSlug}/${city.slug}/electricity-providers`)}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      Providers
                    </button>
                    <button
                      onClick={() => onNavigate(`/${city.stateSlug}/${city.slug}/electricity-rates`)}
                      className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                    >
                      Rates
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Utility Service Areas */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-orange-600" />
            Utility Service Areas
          </h3>
          
          <p className="text-gray-600 mb-8">
            Understanding your utility company is important because they deliver electricity regardless of which provider you choose. 
            They handle outages, maintain power lines, and appear on your bill for delivery charges.
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {Object.entries(utilityCompanies).map(([state, utilities]) => (
              <div key={state}>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {state} Utilities
                </h4>
                <div className="space-y-3">
                  {utilities.map((utility) => (
                    <div key={utility.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{utility.name}</h5>
                        <a 
                          href={utility.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{utility.description}</p>
                      <div className="text-xs text-gray-500">
                        Service Area: {utility.serviceArea.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZIP Code Examples */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Try Sample ZIP Codes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Click any ZIP code below to see comprehensive location information including providers, 
              rates, utility service areas, and local market details.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { zip: '77001', city: 'Houston', state: 'TX', rate: '11.8¢', providers: 5 },
              { zip: '75201', city: 'Dallas', state: 'TX', rate: '12.2¢', providers: 4 },
              { zip: '78701', city: 'Austin', state: 'TX', rate: '11.9¢', providers: 4 },
              { zip: '19101', city: 'Philadelphia', state: 'PA', rate: '13.1¢', providers: 3 },
              { zip: '78201', city: 'San Antonio', state: 'TX', rate: '12.0¢', providers: 4 },
              { zip: '15201', city: 'Pittsburgh', state: 'PA', rate: '13.8¢', providers: 3 },
              { zip: '76101', city: 'Fort Worth', state: 'TX', rate: '12.1¢', providers: 4 },
              { zip: '18101', city: 'Allentown', state: 'PA', rate: '13.2¢', providers: 3 }
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => handleZipSearch(example.zip)}
                className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
              >
                <div className="font-bold text-blue-600 text-lg">{example.zip}</div>
                <div className="text-gray-900 font-medium">{example.city}, {example.state}</div>
                <div className="text-sm text-gray-600">
                  {example.providers} providers • {example.rate}/kWh
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cheapest Rates</h3>
            <p className="text-gray-600 text-sm mb-4">Find the lowest electricity rates in your area</p>
            <button
              onClick={() => onNavigate('/shop/cheapest-electricity')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Find Cheapest Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">Calculate exact costs based on your usage</p>
            <button
              onClick={() => onNavigate('/rates/calculator')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Calculate Costs →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Providers</h3>
            <p className="text-gray-600 text-sm mb-4">Side-by-side provider comparison</p>
            <button
              onClick={() => onNavigate('/compare/providers')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Compare Providers →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Leaf className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Green Energy</h3>
            <p className="text-gray-600 text-sm mb-4">100% renewable electricity options</p>
            <button
              onClick={() => onNavigate('/shop/green-energy')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              Go Green →
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Find Everything About Electricity in Your Area</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Get comprehensive information about providers, plans, rates, utility companies, 
            and service areas for your specific location.
          </p>
          
          <div className="max-w-md mx-auto mb-6">
            <ZipCodeSearch onSearch={handleZipSearch} placeholder="Enter your ZIP code to explore" />
          </div>
          
          <p className="text-blue-200 text-sm">
            Complete location-based electricity information and comparison tools
          </p>
        </div>
      </div>
    </div>
  );
}

export default LocationsPage;