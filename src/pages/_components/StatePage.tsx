import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { getProviders, getCities, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import { MapPin, TrendingDown, Users, Zap, Filter } from 'lucide-react';
import EnhancedSectionReact from '../../components/ui/EnhancedSectionReact';
import EnhancedCardReact from '../../components/ui/EnhancedCardReact';
import AccentBoxReact from '../../components/ui/AccentBoxReact';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StatePageProps {
  state: string;
}

export function StatePage({ state }: StatePageProps) {
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

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`[StatePage] Loading data for state: ${state}`);
        
        const [providersData, citiesData] = await Promise.all([
          getProviders(state),
          getCities(state)
        ]);
        
        setProviders(providersData);
        setCities(citiesData);
        console.log(`[StatePage] Loaded ${providersData.length} providers and ${citiesData.length} cities`);
      } catch (error) {
        console.error(`[StatePage] Error loading data for ${state}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [state]);

  const stateData = {
    slug: state,
    name: state === 'texas' ? 'Texas' : state.charAt(0).toUpperCase() + state.slice(1),
    averageRate: providers.length > 0 ? (providers.reduce((sum, p) => sum + (p.averageRate || 12.5), 0) / providers.length).toFixed(1) : '12.5',
    isDeregulated: state === 'texas',
    topCities: cities.slice(0, 10),
    utilityCompanies: state === 'texas' ? [
      'Oncor Electric Delivery',
      'CenterPoint Energy',
      'AEP Texas',
      'TNMP (Texas New Mexico Power)'
    ] : [
      'Local Utility Company'
    ]
  };
  
  const stateProviders = providers;

  const handleZipSearch = (zipCode: string) => {
    const city = cities.find(c => c.zipCodes?.includes(zipCode));
    if (city) {
      navigate(`/${state}/${city.slug}/electricity-providers`);
    } else {
      // Default to the state page
      navigate(`/${state}/electricity-providers`);
    }
  };

  return (
    <div className="min-h-screen bg-texas-cream/20">
      {/* Header */}
      <EnhancedSectionReact background="white" padding="lg" className="border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <nav className="text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
                <span className="mx-2">/</span>
                <span>{stateData.name}</span>
              </nav>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {stateData.name} Electricity Providers
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare electricity providers and plans in {stateData.name}. Find the cheapest rates from {loading ? '100+' : stateProviders.length} licensed electricity companies.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-gray-600">Avg Rate: <strong>{stateData.averageRate}¢/kWh</strong></span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-texas-navy mr-2" />
                  <span className="text-gray-600"><strong>{loading ? '100+' : stateProviders.length}</strong> Providers</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-gray-600">Market: <strong>{stateData.isDeregulated ? 'Deregulated' : 'Regulated'}</strong></span>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
              />
            </div>
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
                    onChange={(e) => setFilterType(e.target.value as any)}
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
                    onChange={(e) => setSortBy(e.target.value as any)}
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
            <EnhancedCardReact title="Popular Cities" variant="elevated">
              <div className="space-y-2">
                {stateData.topCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => navigate(`/${stateData.slug}/${city.slug}/electricity-providers`)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{city.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      Avg: {city.averageRate}¢/kWh
                    </div>
                  </button>
                ))}
              </div>
            </EnhancedCardReact>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {stateProviders.length} Providers Available
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                <span>Showing {filterType === 'all' ? 'all' : filterType} plans</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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

            {/* Market Information */}
            <div className="mt-12">
            <EnhancedCardReact 
              title={`${stateData.name} Electricity Market Information`}
              variant="elevated"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Market Status</h4>
                  <p className="text-gray-600 text-sm">
                    {stateData.isDeregulated 
                      ? `${stateData.name} has a deregulated electricity market, giving you the power to choose your electricity provider and plan.`
                      : `${stateData.name} has a regulated electricity market where your utility company provides your electricity service.`
                    }
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Utility Companies</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {stateData.utilityCompanies.map((utility, index) => (
                      <li key={index}>• {utility}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </EnhancedCardReact>
            </div>
          </div>
        </div>
      </EnhancedSectionReact>
    </div>
  );
}