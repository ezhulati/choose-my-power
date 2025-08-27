import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Calendar, Zap, TrendingDown, Leaf, Shield, Filter } from 'lucide-react';

interface CityElectricityPlansPageProps {
  state: string;
  city: string;
  onNavigate: (path: string) => void;
}

export function CityElectricityPlansPage({ state, city, onNavigate }: CityElectricityPlansPageProps) {
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'fixed' | 'variable' | 'indexed'>('all');
  const [termFilter, setTermFilter] = useState<'all' | '12' | '24' | '36'>('all');
  const [greenFilter, setGreenFilter] = useState<boolean>(false);

  const stateData = mockStates.find(s => s.slug === state);
  const cityData = stateData?.topCities.find(c => c.slug === city);
  
  if (!stateData || !cityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">City Not Found</h1>
          <button
            onClick={() => onNavigate(`/${state}/electricity-plans`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View {stateData?.name || 'State'} Plans
          </button>
        </div>
      </div>
    );
  }

  const cityProviders = mockProviders.filter(p => 
    cityData.topProviders.includes(p.id)
  );

  const allPlans = cityProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  const filteredPlans = allPlans.filter(plan => {
    if (planTypeFilter !== 'all' && plan.type !== planTypeFilter) return false;
    if (termFilter !== 'all' && plan.termLength !== parseInt(termFilter)) return false;
    if (greenFilter && plan.renewablePercent < 100) return false;
    return true;
  });

  const handleZipSearch = (zipCode: string) => {
    onNavigate(`/${state}/${city}/${zipCode}/electricity-plans`);
  };

  const planTypeStats = {
    fixed: allPlans.filter(p => p.type === 'fixed').length,
    variable: allPlans.filter(p => p.type === 'variable').length,
    indexed: allPlans.filter(p => p.type === 'indexed').length,
    green: allPlans.filter(p => p.renewablePercent === 100).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate(`/${state}/electricity-plans`)} className="hover:text-blue-600">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name} Plans</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {cityData.name} Electricity Plans - Compare All Available Options
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare {allPlans.length} electricity plans available in {cityData.name}, {stateData.name}. 
                Find fixed-rate, variable-rate, and green energy plans from {cityProviders.length} trusted providers.
              </p>

              {/* Plan Type Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{planTypeStats.fixed}</div>
                  <div className="text-sm text-blue-700">Fixed Rate Plans</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{planTypeStats.variable}</div>
                  <div className="text-sm text-orange-700">Variable Rate Plans</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{planTypeStats.green}</div>
                  <div className="text-sm text-green-700">Green Energy Plans</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{allPlans.length}</div>
                  <div className="text-sm text-purple-700">Total Plans</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Exact Plans for Your Address</h3>
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder={`Enter ${cityData.name} ZIP`}
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="font-medium mb-2">{cityData.name} ZIP Codes:</div>
                <div className="grid grid-cols-2 gap-1">
                  {cityData.zipCodes.slice(0, 4).map((zip) => (
                    <button
                      key={zip}
                      onClick={() => handleZipSearch(zip)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
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
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter Plans
              </h3>
              
              <div className="space-y-4">
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
                    <option value="indexed">Indexed Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract Length</label>
                  <select
                    value={termFilter}
                    onChange={(e) => setTermFilter(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Contract Lengths</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={greenFilter}
                      onChange={(e) => setGreenFilter(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Green Energy Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Plan Type Guide */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Types</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-blue-900">Fixed Rate</div>
                  <div className="text-gray-600">Same rate for entire contract</div>
                </div>
                <div>
                  <div className="font-medium text-orange-900">Variable Rate</div>
                  <div className="text-gray-600">Rate can change monthly</div>
                </div>
                <div>
                  <div className="font-medium text-green-900">Green Energy</div>
                  <div className="text-gray-600">100% renewable sources</div>
                </div>
              </div>
            </div>
          </div>

          {/* Plans List */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredPlans.length} Plans Available in {cityData.name}
              </h2>
              <button
                onClick={() => onNavigate(`/compare/plans?city=${city}&state=${state}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Compare Selected Plans
              </button>
            </div>

            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <img
                          src={plan.providerLogo}
                          alt={`${plan.providerName} logo`}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <button
                            onClick={() => onNavigate(`/providers/${plan.providerSlug}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {plan.providerName}
                          </button>
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            plan.type === 'fixed' ? 'bg-blue-100 text-blue-800' :
                            plan.type === 'variable' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {plan.type}
                          </span>
                          {plan.renewablePercent === 100 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center">
                              <Leaf className="h-3 w-3 mr-1" />
                              100% Green
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{plan.termLength} months</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-gray-400 mr-2" />
                          <span>${plan.fees.monthlyFee}/month fee</span>
                        </div>
                        <div className="flex items-center">
                          <Leaf className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{plan.renewablePercent}% renewable</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingDown className="h-4 w-4 text-gray-400 mr-2" />
                          <span>${plan.fees.cancellationFee} ETF</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-2">Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right md:ml-6">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{plan.rate}¢</div>
                      <div className="text-sm text-gray-500 mb-3">per kWh</div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => onNavigate(`/${state}/${city}/electricity-providers`)}
                          className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Get This Plan
                        </button>
                        <button
                          onClick={() => onNavigate(`/compare/plans/${plan.id}`)}
                          className="w-full md:w-auto border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Compare Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SEO Content */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Electricity Plans in {cityData.name}, {stateData.name}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Available Plan Types</h4>
                  <p className="text-gray-600 mb-4">
                    {cityData.name} residents can choose from {allPlans.length} electricity plans including 
                    fixed-rate, variable-rate, and green energy options from {cityProviders.length} providers.
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Fixed-rate plans for budget predictability</li>
                    <li>• Variable-rate plans with market flexibility</li>
                    <li>• Green energy plans with renewable sources</li>
                    <li>• Contract terms from 12 to 36 months</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">How to Choose</h4>
                  <p className="text-gray-600 mb-4">
                    Consider your budget preferences, risk tolerance, and environmental values when 
                    selecting an electricity plan in {cityData.name}.
                  </p>
                  <button
                    onClick={() => onNavigate(`/${state}/${city}/electricity-providers`)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    See all {cityData.name} providers →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}