import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { getProviders, getCities, getPlansForCity, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import { TrendingDown, Calculator, BarChart, DollarSign, Zap } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CityElectricityRatesPageProps {
  state: string;
  city: string;
}

export function CityElectricityRatesPage({ state, city }: CityElectricityRatesPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedUsage, setSelectedUsage] = useState('1000');
  const [showComparison, setShowComparison] = useState(true);
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [cities, setCities] = useState<RealCity[]>([]);
  const [plans, setPlans] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [providersData, citiesData, cityPlans] = await Promise.all([
          getProviders(state),
          getCities(state),
          getPlansForCity(city, state)
        ]);
        setProviders(providersData);
        setCities(citiesData);
        setPlans(cityPlans);
      } catch (error) {
        console.error('[CityElectricityRatesPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [state, city]);

  const stateData = {
    slug: state,
    name: state.charAt(0).toUpperCase() + state.slice(1),
    averageRate: providers.length > 0 ? (providers.reduce((sum, p) => sum + (p.averageRate || 12.5), 0) / providers.length).toFixed(1) : '12.5',
    isDeregulated: state === 'texas'
  };
  const cityData = cities.find(c => c.slug === city);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-texas-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {city} electricity rates...</p>
        </div>
      </div>
    );
  }
  
  if (!cityData || providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">City Not Found</h1>
          <button
            onClick={() => navigate(`/${state}/electricity-rates`)}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            View {stateData?.name || 'State'} Rates
          </button>
        </div>
      </div>
    );
  }

  const cityProviders = providers.slice(0, 10); // Show top providers

  const allPlans = cityProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating 
    }))
  );

  const sortedPlans = allPlans.sort((a, b) => a.rate - b.rate);
  const lowestRate = sortedPlans[0]?.rate || 0;
  const averageRate = cityData.averageRate;
  const highestRate = Math.max(...allPlans.map(p => p.rate));

  const handleZipSearch = (zipCode: string) => {
    navigate(`/${state}/${city}/${zipCode}/electricity-rates`);
  };

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const usageOptions = [
    { value: '500', label: '500 kWh', description: 'Small apartment' },
    { value: '1000', label: '1,000 kWh', description: 'Average home' },
    { value: '1500', label: '1,500 kWh', description: 'Large home' },
    { value: '2000', label: '2,000 kWh', description: 'Very large home' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate(`/${state}/electricity-rates`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name} Electricity Rates</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {cityData.name} Electricity Rates
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Current electricity rates in {cityData.name}, {stateData.name} range from {lowestRate}¢ to {highestRate}¢ per kWh. 
                Compare rates from {cityProviders.length} electricity providers and calculate your potential savings. 
                The average {cityData.name} electric rate is {averageRate}¢/kWh.
              </p>

              {/* Rate Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Lowest Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{lowestRate}¢</div>
                  <div className="text-sm text-green-700">per kWh</div>
                </div>

                <div className="bg-texas-cream-200 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <BarChart className="h-5 w-5 text-texas-navy mr-2" />
                    <span className="text-sm font-medium text-texas-navy">City Average</span>
                  </div>
                  <div className="text-2xl font-bold text-texas-navy-900">{averageRate}¢</div>
                  <div className="text-sm text-texas-navy">per kWh</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">Avg Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ${Math.round((averageRate - lowestRate) * 10)}
                  </div>
                  <div className="text-sm text-purple-700">per 1000 kWh</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Plans Available</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{allPlans.length}</div>
                  <div className="text-sm text-orange-700">total options</div>
                </div>
              </div>
            </div>

            {/* ZIP Search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Exact Rates for Your ZIP Code</h3>
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="font-medium mb-2">{cityData.name} ZIP Codes:</div>
                <div className="grid grid-cols-2 gap-1">
                  {cityData.zipCodes.map((zip) => (
                    <button
                      key={zip}
                      onClick={() => handleZipSearch(zip)}
                      className="text-texas-navy hover:text-texas-navy hover:underline text-xs"
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

      {/* Rate Calculator & Comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Usage Calculator */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                {cityData.name} Electricity Rate Calculator
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your monthly usage to see exact costs:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {usageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedUsage(option.value)}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        selectedUsage === option.value
                          ? 'border-texas-navy bg-texas-cream-200 text-texas-navy-900'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3">Provider</th>
                      <th className="text-left py-3">Plan</th>
                      <th className="text-right py-3">Rate</th>
                      <th className="text-right py-3">Monthly Cost*</th>
                      <th className="text-right py-3">Annual Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlans.slice(0, 8).map((plan) => {
                      const monthlyCost = calculateMonthlyCost(plan.rate, parseInt(selectedUsage), plan.fees.monthlyFee);
                      const annualCost = monthlyCost * 12;
                      
                      return (
                        <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center">
                              <div>
                                <button
                                  onClick={() => navigate(`/providers/${plan.providerSlug}`)}
                                  className="text-texas-navy hover:text-texas-navy font-medium"
                                >
                                  {plan.providerName}
                                </button>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                  {plan.providerRating}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-xs text-gray-500">{plan.termLength} mo • {plan.type}</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-semibold">{plan.rate}¢/kWh</div>
                            <div className="text-xs text-gray-500">${plan.fees.monthlyFee}/mo fee</div>
                          </td>
                          <td className="py-3 text-right font-bold text-green-600">
                            ${monthlyCost.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-bold">
                            ${annualCost.toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                *Monthly cost includes electricity usage + provider fees. Excludes taxes and utility delivery charges.
              </div>
            </div>

            {/* Local Market Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {cityData.name} Electricity Market Overview
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Market Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <span className="font-medium">{cityData.population.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Rate:</span>
                      <span className="font-medium">{cityData.averageRate}¢/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lowest Rate:</span>
                      <span className="font-medium text-green-600">{lowestRate}¢/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Providers:</span>
                      <span className="font-medium">{cityProviders.length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Rate Factors</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Contract length affects pricing</li>
                    <li>• Fixed vs variable rate options</li>
                    <li>• Monthly usage tiers and fees</li>
                    <li>• Green energy percentage premiums</li>
                    <li>• Promotional vs standard rates</li>
                  </ul>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
                      className="text-texas-navy hover:text-texas-navy font-medium text-sm"
                    >
                      View all {cityData.name} providers →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Tools</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/rates/calculator')}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Advanced Calculator</div>
                  <div className="text-sm text-gray-600">Compare multiple providers</div>
                </button>
                
                <button
                  onClick={() => navigate(`/${state}/${city}/switch-provider`)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Switch Guide</div>
                  <div className="text-sm text-gray-600">How to change providers</div>
                </button>
                
                <button
                  onClick={() => navigate(`/cheapest-electricity-${city}`)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Cheapest Options</div>
                  <div className="text-sm text-gray-600">Find lowest rates</div>
                </button>
              </div>
            </div>

            {/* Trending Searches */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Searches</h3>
              <div className="space-y-2">
                {[
                  `cheapest electricity ${city}`,
                  `${city} electricity providers`,
                  `no deposit electricity ${city}`,
                  `green energy ${city}`,
                  `switch electricity ${city}`
                ].map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (search.includes('cheapest')) navigate(`/cheapest-electricity-${city}`);
                      else if (search.includes('providers')) navigate(`/${state}/${city}/electricity-providers`);
                      else if (search.includes('no deposit')) navigate(`/${state}/${city}/no-deposit-electricity`);
                      else if (search.includes('green energy')) navigate(`/shop/green-energy?city=${city}`);
                      else if (search.includes('switch')) navigate(`/${state}/${city}/switch-provider`);
                    }}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-texas-navy rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}