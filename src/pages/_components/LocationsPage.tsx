import React, { useState } from 'react';
import StandardZipInputReact from '../../components/StandardZipInputReact';
import { mockStates, mockProviders, utilityCompanies } from '../../data/mockData';
import { 
  MapPin, Search, TrendingDown, Users, Zap, Building, ArrowRight, Star, 
  Globe, Phone, CheckCircle, AlertCircle, Calculator, Shield, Leaf, Award, 
  Clock, Eye, Target, Home, Filter, BarChart, DollarSign, Activity
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface LocationsPageProps {
}

function LocationsPage({}: LocationsPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
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
      navigate(`/${location.state}/${location.city}/electricity-providers`);
    } else {
      // Determine state by ZIP code pattern for fallback
      if (zipCode.startsWith('7')) {
        navigate('/texas/electricity-providers');
      } else if (zipCode.startsWith('1')) {
        navigate('/pennsylvania/electricity-providers');
      } else {
        navigate('/texas/electricity-providers');
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
      title: 'By State',
      count: mockStates.length,
      description: 'See which states let you pick your provider',
      action: () => navigate('/states')
    },
    {
      icon: Home,
      title: 'By City',
      count: totalCities,
      description: 'Your city probably has 10+ options you never knew about',
      action: () => navigate('/cities')
    },
    {
      icon: MapPin,
      title: 'By ZIP Code',
      count: `${totalZipCodes}+`,
      description: 'Most accurate - shows exactly who serves your street',
      action: () => setShowAdvancedSearch(true)
    },
    {
      icon: Zap,
      title: 'By Utility',
      count: `${Object.values(utilityCompanies).flat().length}`,
      description: 'The company that owns the wires (you can\'t change this one)',
      action: () => navigate('/utilities')
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
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-900 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <MapPin className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Locations & Coverage</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-12 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Does Your Street
                <span className="block text-texas-gold mt-2">Even Have Options?</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">Some ZIP codes have 12 providers.</span> 
                <span className="text-white font-semibold">Others have 2.</span> 
                <span className="text-white/80">Find out who actually serves your address.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">Street-level accuracy</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">880+ Texas cities</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">Real-time rates</span>
                </div>
              </div>
            </div>

            {/* Main ZIP Search */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-10 max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-white mb-6">What's Available at Your Address?</h2>
                <StandardZipInputReact onSearch={handleZipSearch} size="lg" />
                <p className="text-blue-200 text-sm mt-3">See who actually serves your street (not just your city)</p>
              </div>
            </div>

            {/* Location Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{mockStates.length}</div>
                <div className="text-blue-200 text-sm">States Where You Can Switch</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{totalCities}</div>
                <div className="text-blue-200 text-sm">Cities We Cover</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{totalProviders}</div>
                <div className="text-blue-200 text-sm">Companies to Choose From</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{totalZipCodes}+</div>
                <div className="text-blue-200 text-sm">ZIP Codes Checked Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Types */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-4">
              Not Sure Where to Start? Pick Your View.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you know your ZIP code or just your city, we'll show you what's actually available.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {locationTypes.map((type, index) => (
              <button
                key={index}
                onClick={type.action}
                className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-texas-cream text-texas-navy rounded-3xl mb-6 group-hover:bg-texas-navy group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <type.icon className="h-10 w-10" />
                </div>
                <div className="text-4xl font-bold text-texas-navy mb-2">{type.count}</div>
                <h3 className="text-xl font-bold text-texas-navy mb-4">{type.title}</h3>
                <p className="text-gray-600 leading-relaxed">{type.description}</p>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Where Are You Shopping?</h2>
              <p className="text-lg text-gray-600">Different areas have wildly different options and prices</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Show Everything</option>
                <option value="texas">Just Texas</option>
                <option value="pennsylvania">Just Pennsylvania</option>
              </select>

              {/* Metric Selector */}
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="providers">How Many Companies</option>
                <option value="rates">What It Costs</option>
                <option value="population">How Many People</option>
                <option value="savings">How Much You Save</option>
              </select>
            </div>
          </div>
        </div>

        {/* State & City Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* States Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Building className="h-6 w-6 mr-3 text-texas-navy" />
              States Where You Can Actually Switch
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
                          onClick={() => navigate(`/${state.slug}/electricity-providers`)}
                          className="text-lg font-semibold text-texas-navy hover:text-texas-navy"
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
                            <div className="text-2xl font-bold text-texas-navy">{stateProviders.length}</div>
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
                        onClick={() => navigate(`/${state.slug}/electricity-providers`)}
                        className="text-xs bg-texas-cream-200 text-texas-navy px-2 py-1 rounded hover:bg-texas-cream"
                      >
                        Providers
                      </button>
                      <button
                        onClick={() => navigate(`/${state.slug}/electricity-rates`)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                      >
                        Rates
                      </button>
                      <button
                        onClick={() => navigate(`/${state.slug}/electricity-plans`)}
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
              Cities With the Most Options
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
                        onClick={() => navigate(`/${city.stateSlug}/${city.slug}/electricity-providers`)}
                        className="text-lg font-semibold text-green-600 hover:text-green-800"
                      >
                        {city.name}
                      </button>
                      <div className="text-sm text-gray-600">{city.stateName}</div>
                    </div>
                    
                    <div className="text-right">
                      {selectedMetric === 'providers' && (
                        <>
                          <div className="text-xl font-bold text-texas-navy">{city.providerCount}</div>
                          <div className="text-xs text-gray-500">providers</div>
                        </>
                      )}
                      {selectedMetric === 'rates' && (
                        <>
                          <div className="text-xl font-bold text-green-600">{city.averageRate}¢</div>
                          <div className="text-[10px] text-gray-500">avg/kWh</div>
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
                      onClick={() => navigate(`/${city.stateSlug}/${city.slug}/electricity-providers`)}
                      className="text-xs bg-texas-cream-200 text-texas-navy px-2 py-1 rounded hover:bg-texas-cream"
                    >
                      Providers
                    </button>
                    <button
                      onClick={() => navigate(`/${city.stateSlug}/${city.slug}/electricity-rates`)}
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
            Who Owns the Wires? (Utility Companies)
          </h3>
          
          <p className="text-gray-600 mb-8">
            Quick lesson: You pick who sells you electricity, but the utility company still owns the poles and wires. 
            They fix outages, read your meter, and charge about half your bill for "delivery." Can't change them, but good to know who they are.
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
                          className="text-texas-navy hover:text-texas-navy"
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
        <div className="bg-texas-cream-200 border border-blue-200 rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Don't Know Your ZIP? Try These
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Click any ZIP below to see exactly what's available there - who serves it, 
              what they charge, and how much people save.
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
                className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-texas-cream-200 hover:border-blue-300 transition-colors text-left"
              >
                <div className="font-bold text-texas-navy text-lg">{example.zip}</div>
                <div className="text-gray-900 font-medium">{example.city}, {example.state}</div>
                <div className="text-sm text-gray-600">
                  {example.providers} providers • {example.rate}/kWh
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Want the Cheapest?</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">See who's actually cheapest right now</p>
            <button
              onClick={() => navigate('/shop/cheapest-electricity')}
              className="text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Show Me the Lowest →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">What Will I Pay?</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">Calculate your actual monthly bill</p>
            <button
              onClick={() => navigate('/rates/calculator')}
              className="text-texas-navy hover:text-texas-red font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Calculate My Bill →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Who's Actually Good?</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">Compare companies that won't suck</p>
            <button
              onClick={() => navigate('/compare/providers')}
              className="text-purple-600 hover:text-purple-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Compare Companies →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Leaf className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Want Real Green?</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">Not just marketing - actual renewable</p>
            <button
              onClick={() => navigate('/shop/green-energy')}
              className="text-orange-600 hover:text-orange-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Show Green Options →
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-texas-navy via-blue-900 to-texas-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to See What's Available Where You Live?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Enter your ZIP and we'll show you licensed electricity companies, 100+ plans, and exactly what 
            your neighbors are paying. Takes 30 seconds.
          </p>
          
          <div className="max-w-md mx-auto mb-6">
            <StandardZipInputReact onSearch={handleZipSearch} size="lg" />
          </div>
          
          <p className="text-blue-200 text-sm">
            No games. Just facts about your exact location.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LocationsPage;