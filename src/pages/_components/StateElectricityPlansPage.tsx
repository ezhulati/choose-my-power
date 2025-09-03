import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Calendar, Zap, TrendingDown, Leaf, Shield, Filter } from 'lucide-react';
import EnhancedSectionReact from '../../components/ui/EnhancedSectionReact';
import EnhancedCardReact from '../../components/ui/EnhancedCardReact';
import AccentBoxReact from '../../components/ui/AccentBoxReact';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StateElectricityPlansPageProps {
  state: string;
}

export function StateElectricityPlansPage({ state }: StateElectricityPlansPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'fixed' | 'variable' | 'indexed'>('all');
  const [termFilter, setTermFilter] = useState<'all' | '12' | '24' | '36'>('all');
  const [greenFilter, setGreenFilter] = useState<boolean>(false);

  const stateData = mockStates.find(s => s.slug === state);
  
  if (!stateData) {
    return (
      <EnhancedSectionReact background="gray" padding="xl">
        <EnhancedCardReact variant="elevated" padding="lg" className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-texas-navy mb-4">State Not Found</h1>
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

  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(stateData.slug));
  const allPlans = stateProviders.flatMap(provider => 
    provider.plans.map(plan => ({ ...plan, providerName: provider.name, providerSlug: provider.slug }))
  );

  const filteredPlans = allPlans.filter(plan => {
    if (planTypeFilter !== 'all' && plan.type !== planTypeFilter) return false;
    if (termFilter !== 'all' && plan.termLength !== parseInt(termFilter)) return false;
    if (greenFilter && plan.renewablePercent < 100) return false;
    return true;
  });

  const handleZipSearch = (zipCode: string) => {
    const city = stateData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      navigate(`/${state}/${city.slug}/electricity-plans`);
    }
  };

  const planTypeStats = {
    fixed: allPlans.filter(p => p.type === 'fixed').length,
    variable: allPlans.filter(p => p.type === 'variable').length,
    indexed: allPlans.filter(p => p.type === 'indexed').length,
    green: allPlans.filter(p => p.renewablePercent === 100).length
  };

  return (
    <div className="min-h-screen bg-texas-cream/20">
      {/* Header */}
      <EnhancedSectionReact background="white" padding="lg" className="border-b border-gray-200">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate(`/${state}/electricity-providers`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>Electricity Plans</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {stateData.name} Electricity Plans
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Compare {allPlans.length} electricity plans from {stateProviders.length} providers in {stateData.name}. 
                Find fixed-rate, variable-rate, and green energy plans that fit your needs.
              </p>

              {/* Plan Type Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AccentBoxReact accentColor="navy" padding="sm" className="bg-texas-cream/30">
                  <div className="text-2xl font-bold text-texas-navy">{planTypeStats.fixed}</div>
                  <div className="text-sm text-texas-navy">Fixed Rate Plans</div>
                </AccentBoxReact>
                <AccentBoxReact accentColor="gold" padding="sm" className="bg-texas-gold/10">
                  <div className="text-2xl font-bold text-texas-gold-700">{planTypeStats.variable}</div>
                  <div className="text-sm text-texas-gold-700">Variable Rate Plans</div>
                </AccentBoxReact>
                <AccentBoxReact accentColor="green" padding="sm" className="bg-green-50">
                  <div className="text-2xl font-bold text-green-900">{planTypeStats.green}</div>
                  <div className="text-sm text-green-700">Green Energy Plans</div>
                </AccentBoxReact>
                <AccentBoxReact accentColor="red" padding="sm" className="bg-texas-red/10">
                  <div className="text-2xl font-bold text-texas-red-700">{allPlans.length}</div>
                  <div className="text-sm text-texas-red-700">Total Plans</div>
                </AccentBoxReact>
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
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <EnhancedCardReact 
              title="Filter Plans"
              icon={<Filter className="h-5 w-5" />}
              iconColor="navy"
              variant="elevated"
              className="mb-6"
            >
              
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
                      className="rounded border-gray-300 text-texas-navy focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Green Energy Only</span>
                  </label>
                </div>
              </div>
            </EnhancedCardReact>

            {/* Plan Type Guide */}
            <EnhancedCardReact title="Plan Types Explained" variant="elevated">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-blue-900">Fixed Rate</div>
                  <div className="text-gray-600">Rate stays the same for the entire contract</div>
                </div>
                <div>
                  <div className="font-medium text-orange-900">Variable Rate</div>
                  <div className="text-gray-600">Rate can change monthly</div>
                </div>
                <div>
                  <div className="font-medium text-green-900">Green Energy</div>
                  <div className="text-gray-600">100% renewable energy sources</div>
                </div>
              </div>
            </EnhancedCardReact>
          </div>

          {/* Plans List */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredPlans.length} Plans Available
              </h2>
              <button
                onClick={() => navigate(`/compare/plans?state=${state}`)}
                className="bg-texas-navy text-white px-4 py-2 rounded-lg hover:bg-texas-navy/90 transition-colors"
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
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">{plan.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                          {plan.type}
                        </span>
                        {plan.renewablePercent === 100 && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                            <Leaf className="h-3 w-3 mr-1" />
                            100% Green
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <button
                          onClick={() => navigate(`/providers/${plan.providerSlug}`)}
                          className="text-texas-navy hover:text-texas-navy font-medium"
                        >
                          {plan.providerName}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                          <span>${plan.fees.cancellationFee} early termination</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-2">Key Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-texas-cream-200 text-texas-navy text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right md:ml-6">
                      <div className="text-3xl font-bold text-green-600 mb-1">{plan.rate}¢</div>
                      <div className="text-sm text-gray-500 mb-3">per kWh</div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/${state}/houston/electricity-providers`)}
                          className="w-full md:w-auto bg-texas-navy text-white px-4 py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
                        >
                          See Rates in Your Area
                        </button>
                        <button
                          onClick={() => navigate(`/compare/plans/${plan.id}`)}
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

            {/* Educational Content */}
            <div className="mt-12">
            <EnhancedCardReact 
              title={`Choosing the Right Electricity Plan in ${stateData.name}`}
              variant="elevated"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Fixed vs Variable Rate Plans</h4>
                  <p className="text-gray-600 mb-4">
                    Fixed-rate plans offer price stability with the same rate throughout your contract. 
                    Variable-rate plans can change monthly but may offer lower introductory rates.
                  </p>
                  
                  <button
                    onClick={() => navigate('/compare/plans/fixed-vs-variable')}
                    className="text-texas-navy hover:text-texas-navy font-medium text-sm"
                  >
                    Compare Fixed vs Variable Plans →
                  </button>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Contract Length Considerations</h4>
                  <p className="text-gray-600 mb-4">
                    Longer contracts often offer better rates but less flexibility. Shorter contracts 
                    give you more options to switch if better deals become available.
                  </p>
                  
                  <button
                    onClick={() => navigate('/compare/plans/12-month-vs-24-month')}
                    className="text-texas-navy hover:text-texas-navy font-medium text-sm"
                  >
                    Compare Contract Lengths →
                  </button>
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