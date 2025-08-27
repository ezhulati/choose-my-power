import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { MapPin, TrendingDown, Users, Zap, Calculator, Star, Award, Clock, Filter } from 'lucide-react';

interface CityElectricityProvidersPageProps {
  state: string;
  city: string;
  onNavigate: (path: string) => void;
}

export function CityElectricityProvidersPage({ state, city, onNavigate }: CityElectricityProvidersPageProps) {
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popularity'>('rating');
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'fixed' | 'variable' | 'green'>('all');
  const [showCalculator, setShowCalculator] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState('1000');

  const stateData = mockStates.find(s => s.slug === state);
  const cityData = stateData?.topCities.find(c => c.slug === city);
  
  if (!stateData || !cityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">City Not Found</h1>
          <button
            onClick={() => onNavigate(`/${state}/electricity-providers`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View {stateData?.name || 'State'} Providers
          </button>
        </div>
      </div>
    );
  }

  const cityProviders = mockProviders.filter(p => 
    cityData.topProviders.includes(p.id)
  );

  const handleZipSearch = (zipCode: string) => {
    onNavigate(`/${state}/${city}/${zipCode}`);
  };

  const lowestRate = Math.min(...cityProviders.flatMap(p => p.plans.map(plan => plan.rate)));
  const avgRate = cityData.averageRate;
  const potentialSavings = Math.round((avgRate - lowestRate) * parseInt(monthlyUsage) / 100 * 12);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO-Optimized Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate(`/${state}/electricity-providers`)} className="hover:text-blue-600">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name} Electricity Providers</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {cityData.name} Electricity Providers - Compare Plans & Save
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare electricity providers in {cityData.name}, {stateData.name}. Find the cheapest rates from {cityProviders.length} trusted companies serving {cityData.name} residents. Switch today and save up to ${potentialSavings}/year on your electric bill.
              </p>

              {/* Enhanced Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{lowestRate}¢</div>
                  <div className="text-sm text-green-700">Lowest Rate</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{cityProviders.length}</div>
                  <div className="text-sm text-blue-700">Providers</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">${potentialSavings}</div>
                  <div className="text-sm text-purple-700">Avg Savings/Year</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">
                    {Math.round((avgRate - lowestRate) * parseInt(monthlyUsage) / 100)}
                  </div>
                  <div className="text-sm text-orange-700">Monthly Savings</div>
                </div>
              </div>

              {/* Enhanced Benefits */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Trusted Providers</div>
                    <div className="text-sm text-gray-600">PUCT licensed & regulated</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Fast Connection</div>
                    <div className="text-sm text-gray-600">Same day available</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Rate Protection</div>
                    <div className="text-sm text-gray-600">Fixed rate plans</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ZIP Search Sidebar */}
            <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Exact Rates for Your Address</h3>
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder={`Enter ${cityData.name} ZIP`}
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="font-medium mb-2">Popular {cityData.name} ZIP Codes:</div>
                <div className="grid grid-cols-2 gap-2">
                  {cityData.zipCodes.slice(0, 4).map((zip) => (
                    <button
                      key={zip}
                      onClick={() => handleZipSearch(zip)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
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

      {/* Filters & Providers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {/* Category Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Browse by Category
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('/providers#green')}
                  className="w-full text-left p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Leaf className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Green Energy Leaders</div>
                      <div className="text-sm text-gray-600">100% renewable specialists</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => onNavigate('/providers#service')}
                  className="w-full text-left p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Customer Service Champions</div>
                      <div className="text-sm text-gray-600">Top-rated support</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => onNavigate('/providers#value')}
                  className="w-full text-left p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Best Value Providers</div>
                      <div className="text-sm text-gray-600">Lowest total costs</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Sort
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="price">Lowest Price</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                  <select
                    value={planTypeFilter}
                    onChange={(e) => setPlanTypeFilter(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Plan Types</option>
                    <option value="fixed">Fixed Rate</option>
                    <option value="variable">Variable Rate</option>
                    <option value="green">Green Energy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Savings Calculator */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Savings Calculator
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Usage (kWh)</label>
                  <input
                    type="number"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-700 mb-1">Potential Savings vs City Average:</div>
                  <div className="text-lg font-bold text-green-900">
                    ${Math.round((avgRate - lowestRate) * parseInt(monthlyUsage || '1000') / 100)}/month
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    ${Math.round((avgRate - lowestRate) * parseInt(monthlyUsage || '1000') / 100 * 12)}/year
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Providers Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {cityProviders.length} Electricity Companies in {cityData.name}
              </h2>
              <button
                onClick={() => onNavigate(`/compare/providers?city=${city}&state=${state}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Compare All Plans
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {cityProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onViewDetails={() => onNavigate(`/providers/${provider.slug}`)}
                  onCompare={() => onNavigate(`/compare/providers`)}
                  showPlans
                />
              ))}
            </div>

            {/* SEO Content Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose an Electricity Provider in {cityData.name}?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About {cityData.name} Electricity Market
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {cityData.name} residents benefit from {stateData.name}'s deregulated electricity market, 
                    which allows you to choose from {cityProviders.length} competitive electricity providers. 
                    With an average rate of {avgRate}¢ per kWh and a population of {cityData.population.toLocaleString()}, 
                    {cityData.name} offers numerous options for residential and business electricity service.
                  </p>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Popular {cityData.name} Neighborhoods:</h4>
                  <div className="text-sm text-gray-600">
                    Residents in ZIP codes {cityData.zipCodes.slice(0, 3).join(', ')} and surrounding areas 
                    can choose from all available providers listed above.
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How to Switch Electricity Providers in {cityData.name}
                  </h3>
                  <ol className="text-gray-600 space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                      Compare rates from {cityData.name} electricity providers above
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                      Enter your ZIP code to see exact rates for your address
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                      Choose a plan and sign up online - it takes less than 5 minutes
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                      Your new provider handles the switch - no service interruption
                    </li>
                  </ol>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => onNavigate(`/${state}/${city}/switch-provider`)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Complete {cityData.name} switching guide →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}