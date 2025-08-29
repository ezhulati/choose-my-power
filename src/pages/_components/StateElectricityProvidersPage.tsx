import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { MapPin, TrendingDown, Users, Zap, Filter, Calculator, Leaf, Shield } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StateElectricityProvidersPageProps {
  state: string;
}

export function StateElectricityProvidersPage({ state }: StateElectricityProvidersPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popularity'>('rating');
  const [filterType, setFilterType] = useState<'all' | 'cheapest' | 'green' | 'no-deposit'>('all');

  const stateData = mockStates.find(s => s.slug === state);
  
  if (!stateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <p className="text-gray-600 mb-8">The state you're looking for doesn't exist in our database.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const stateProviders = mockProviders.filter(p => 
    p.serviceStates.includes(stateData.slug)
  );

  const handleZipSearch = (zipCode: string) => {
    // Find city for ZIP code
    const city = stateData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      navigate(`/${state}/${city.slug}/electricity-providers`);
    } else {
      navigate(`/${state}/electricity-providers`);
    }
  };

  const quickLinks = [
    { name: 'Electricity Plans', href: `/${state}/electricity-plans`, icon: Zap },
    { name: 'Electricity Rates', href: `/${state}/electricity-rates`, icon: TrendingDown },
    { name: 'Switch Provider', href: `/${state}/switch-provider`, icon: Users },
    { name: 'No Deposit Plans', href: `/${state}/no-deposit-electricity`, icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <nav className="text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
                <span className="mx-2">/</span>
                <span>{stateData.name}</span>
                <span className="mx-2">/</span>
                <span>Electricity Providers</span>
              </nav>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {stateData.name} Electricity Providers
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare electricity providers and plans in {stateData.name}. Find the cheapest rates from {stateProviders.length} trusted providers serving {stateData.isDeregulated ? 'deregulated' : 'regulated'} markets.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-gray-600">Avg Rate: <strong>{stateData.averageRate}¢/kWh</strong></span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-texas-navy mr-2" />
                  <span className="text-gray-600"><strong>{stateProviders.length}</strong> Providers</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-gray-600">Market: <strong>{stateData.isDeregulated ? 'Deregulated' : 'Regulated'}</strong></span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-gray-600"><strong>{stateData.topCities.length}</strong> Major Cities</span>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder={`Enter ${stateData.abbreviation} ZIP code`}
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Get personalized rates for your exact location
              </p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.href)}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-texas-cream-200 hover:text-texas-navy transition-colors group"
              >
                <link.icon className="h-5 w-5 mr-2 text-gray-400 group-hover:text-texas-navy" />
                <span className="text-sm font-medium">{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Plans</option>
                    <option value="cheapest">Cheapest Rates</option>
                    <option value="green">Green Energy</option>
                    <option value="no-deposit">No Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="price">Lowest Price</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Major Cities</h3>
              <div className="space-y-2">
                {stateData.topCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => navigate(`/${stateData.slug}/${city.slug}/electricity-providers`)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{city.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{city.averageRate}¢</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Utility Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Utility Companies</h3>
              <div className="space-y-2">
                {stateData.utilityCompanies.map((utility, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/${state}/utilities/${utility.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    {utility}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {stateProviders.length} Providers Available in {stateData.name}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                <span>Showing {filterType === 'all' ? 'all' : filterType} plans</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {stateProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onViewDetails={() => navigate(`/providers/${provider.slug}`)}
                  onCompare={() => navigate(`/compare/providers`)}
                  showPlans
                />
              ))}
            </div>

            {/* State Market Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {stateData.name} Electricity Market Overview
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Market Deregulation</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {stateData.isDeregulated 
                      ? `${stateData.name} deregulated its electricity market, allowing residents to choose their electricity provider. This competition has led to better rates and service options.`
                      : `${stateData.name} has a regulated electricity market where your utility company provides electricity service.`
                    }
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/${state}/market-info/deregulation`)}
                      className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                    >
                      Learn about {stateData.name} deregulation →
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">How to Switch</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Switching electricity providers in {stateData.name} is free and easy. Your new provider handles the entire process, and there's no interruption to your service.
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/${state}/switch-provider`)}
                      className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                    >
                      Step-by-step switching guide →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => navigate(`/providers#green`)}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <Leaf className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="font-medium text-green-900">Green Energy Leaders</div>
                <div className="text-sm text-green-700">100% renewable providers</div>
              </button>
              
              <button
                onClick={() => navigate(`/providers#service`)}
                className="p-4 bg-texas-cream-200 border border-blue-200 rounded-lg hover:bg-texas-cream transition-colors text-center"
              >
                <Users className="h-6 w-6 text-texas-navy mx-auto mb-2" />
                <div className="font-medium text-blue-900">Best Customer Service</div>
                <div className="text-sm text-texas-navy">Top-rated support</div>
              </button>
              
              <button
                onClick={() => navigate(`/shop/cheapest-electricity?state=${state}`)}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <Calculator className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-purple-900">Cheapest Rates</div>
                <div className="text-sm text-purple-700">Lowest price leaders</div>
              </button>
              
              <button
                onClick={() => navigate(`/providers#tech`)}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center"
              >
                <Zap className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <div className="font-medium text-indigo-900">Smart Home Tech</div>
                <div className="text-sm text-indigo-700">Tech integration leaders</div>
              </button>
            </div>

            {/* Category Leaders Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Category Leaders in {stateData.name}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Green Energy</div>
                  <div className="text-sm text-green-600">#1 Rhythm Energy</div>
                  <div className="text-xs text-gray-500">100% renewable</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <Users className="h-8 w-8 text-texas-navy mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Customer Service</div>
                  <div className="text-sm text-texas-navy">#1 Champion Energy</div>
                  <div className="text-xs text-gray-500">4.8★ rating</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Best Value</div>
                  <div className="text-sm text-purple-600">#1 APGE</div>
                  <div className="text-xs text-gray-500">9.7¢/kWh</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Smart Tech</div>
                  <div className="text-sm text-indigo-600">#1 Rhythm Energy</div>
                  <div className="text-xs text-gray-500">Smart features</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/providers')}
                  className="text-texas-navy hover:text-texas-navy font-medium"
                >
                  View all provider categories & expert rankings →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}