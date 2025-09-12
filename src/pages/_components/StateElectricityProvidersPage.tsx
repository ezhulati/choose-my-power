import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { getProviders, type RealProvider } from '../../lib/services/provider-service';
import { getCities, type RealCity } from '../../lib/services/city-service';
import { MapPin, TrendingDown, Users, Zap, Filter, Calculator, Leaf } from 'lucide-react';
import EnhancedSectionReact from '../../components/ui/EnhancedSectionReact';
import EnhancedCardReact from '../../components/ui/EnhancedCardReact';
import AccentBoxReact from '../../components/ui/AccentBoxReact';

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
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [cities, setCities] = useState<RealCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [providersData, citiesData] = await Promise.all([
          getProviders(state),
          getCities(state)
        ]);
        
        setProviders(providersData);
        setCities(citiesData);
      } catch (err) {
        console.error('Error loading state data:', err);
        setError('Failed to load state information. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [state]);

  if (loading) {
    return (
      <EnhancedSectionReact background="gray" padding="xl">
        <EnhancedCardReact variant="elevated" padding="lg" className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-texas-navy mb-4">Loading...</h1>
          <p className="text-gray-600">Getting the latest provider information...</p>
        </EnhancedCardReact>
      </EnhancedSectionReact>
    );
  }

  if (error) {
    return (
      <EnhancedSectionReact background="gray" padding="xl">
        <EnhancedCardReact variant="elevated" padding="lg" className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-texas-navy mb-4">Error Loading Data</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            Return Home
          </button>
        </EnhancedCardReact>
      </EnhancedSectionReact>
    );
  }

  // Check if we have providers for this state
  if (providers.length === 0) {
    return (
      <EnhancedSectionReact background="gray" padding="xl">
        <EnhancedCardReact variant="elevated" padding="lg" className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-texas-navy mb-4">State Not Available</h1>
          <p className="text-gray-600 mb-8">No providers found for this state. We currently serve Texas markets.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            Return Home
          </button>
        </EnhancedCardReact>
      </EnhancedSectionReact>
    );
  }

  // Calculate state statistics from real data
  const totalProviders = providers.length;
  const averageRate = providers.length > 0 
    ? providers.reduce((sum, p) => sum + (p.average_rate || 0), 0) / providers.length 
    : 0;
  const majorCities = cities.filter(c => c.is_major_city).slice(0, 10);
  const isDeregulated = state === 'texas'; // Texas is deregulated
  const stateName = state.charAt(0).toUpperCase() + state.slice(1);

  const handleZipSearch = (zipCode: string) => {
    // Find city for ZIP code from real cities data
    const city = cities.find(c => c.zip_codes?.includes(zipCode));
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
    <div className="min-h-screen bg-texas-cream/20">
      {/* Header */}
      <EnhancedSectionReact background="white" padding="lg" className="border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <nav className="text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
                <span className="mx-2">/</span>
                <span>{stateName}</span>
                <span className="mx-2">/</span>
                <span>Electricity Providers</span>
              </nav>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {stateName} Electricity Providers
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare electricity providers and plans in {stateName}. Find the cheapest rates from {totalProviders} licensed electricity companies serving {isDeregulated ? 'deregulated' : 'regulated'} markets.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-gray-600">Avg Rate: <strong>{averageRate.toFixed(1)}¢/kWh</strong></span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-texas-navy mr-2" />
                  <span className="text-gray-600"><strong>{totalProviders}</strong> Providers</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-gray-600">Market: <strong>{isDeregulated ? 'Deregulated' : 'Regulated'}</strong></span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-gray-600"><strong>{majorCities.length}</strong> Major Cities</span>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
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
      </EnhancedSectionReact>

      <EnhancedSectionReact background="cream" padding="lg">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <EnhancedCardReact title="Filters" variant="elevated" className="mb-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as unknown)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Plan Types</option>
                    <option value="cheapest">Cheapest Rates</option>
                    <option value="green">Green Energy</option>
                    <option value="no-deposit">No Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as unknown)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="price">Lowest Price</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              </div>
            </EnhancedCardReact>

            {/* Top Cities */}
            <EnhancedCardReact title="Major Cities" variant="elevated" className="mb-6">
              <div className="space-y-2">
                {majorCities.map((city) => (
                  <button
                    key={city.slug}
                    onClick={() => navigate(`/${state}/${city.slug}/electricity-providers`)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{city.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{city.average_rate?.toFixed(1) || '0.0'}¢</span>
                    </div>
                  </button>
                ))}
              </div>
            </EnhancedCardReact>

            {/* Utility Info */}
            <EnhancedCardReact title="Utility Companies" variant="elevated">
              <div className="space-y-2">
                {/* Get unique TDSPs from cities */}
                {Array.from(new Set(cities.map(c => c.tdsp?.name).filter(Boolean))).slice(0, 8).map((utility, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/${state}/utilities/${utility!.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    {utility}
                  </button>
                ))}
              </div>
            </EnhancedCardReact>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {providers.length} Providers Available in {stateName}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                <span>Showing {filterType === 'all' ? 'all' : filterType} plans</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={{
                    id: provider.id.toString(),
                    name: provider.name,
                    slug: provider.name.toLowerCase().replace(/\s+/g, '-'),
                    rating: provider.rating || 4.5,
                    reviewCount: provider.review_count || 100,
                    logo: provider.logo_filename || '',
                    plans: [{
                      id: `${provider.id}-basic`,
                      name: 'Basic Plan',
                      rate: provider.average_rate || 12.0,
                      term: 12
                    }],
                    serviceStates: [state]
                  }}
                  onViewDetails={() => navigate(`/providers/${provider.name.toLowerCase().replace(/\s+/g, '-')}`)}
                  onCompare={() => navigate(`/compare/providers`)}
                  showPlans
                />
              ))}
            </div>

            {/* State Market Information */}
            <EnhancedCardReact 
              title={`${stateName} Electricity Market Overview`}
              variant="elevated"
              className="mb-8"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Market Deregulation</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {isDeregulated 
                      ? `${stateName} deregulated its electricity market, allowing residents to choose their electricity provider. This competition has led to better rates and service options.`
                      : `${stateName} has a regulated electricity market where your utility company provides electricity service.`
                    }
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/${state}/market-info/deregulation`)}
                      className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                    >
                      Learn about {stateName} deregulation →
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">How to Switch</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Switching electricity providers in {stateName} is free and easy. Your new provider handles the entire process, and there's no interruption to your service.
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
            </EnhancedCardReact>

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
                className="p-4 bg-texas-cream-200 border border-texas-navy/30 rounded-lg hover:bg-texas-cream transition-colors text-center"
              >
                <Users className="h-6 w-6 text-texas-navy mx-auto mb-2" />
                <div className="font-medium text-texas-navy-900">Best Customer Service</div>
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
            <EnhancedCardReact 
              title={`Category Leaders in ${stateName}`}
              variant="elevated"
            >
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
                  <div className="text-[10px] text-gray-500">9.7¢/kWh</div>
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
            </EnhancedCardReact>
          </div>
        </div>
      </EnhancedSectionReact>
    </div>
  );
}