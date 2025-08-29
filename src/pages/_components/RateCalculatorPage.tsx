import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Calculator, TrendingDown, DollarSign, Zap, Star } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface RateCalculatorPageProps {
}

export function RateCalculatorPage({}: RateCalculatorPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedState, setSelectedState] = useState('texas');
  const [monthlyUsage, setMonthlyUsage] = useState('1000');
  const [homeType, setHomeType] = useState('average');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/${selectedState}/houston/electricity-providers`);
  };

  const stateData = mockStates.find(s => s.slug === selectedState);
  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(selectedState));
  const allPlans = stateProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const calculateAnnualCost = (monthlyCost: number) => {
    return monthlyCost * 12;
  };

  const sortedPlans = allPlans
    .map(plan => ({
      ...plan,
      monthlyCost: calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee),
      annualCost: calculateAnnualCost(calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee))
    }))
    .sort((a, b) => a.monthlyCost - b.monthlyCost);

  const homeTypeUsage = {
    small: '650',
    average: '1000', 
    large: '1500',
    xlarge: '2200'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/rates')} className="hover:text-texas-navy">Rates</button>
            <span className="mx-2">/</span>
            <span>Calculator</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
              <Calculator className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Electricity Rate Calculator
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Calculate your exact monthly electricity costs with different providers and plans. 
              Compare real costs based on your usage to find the best deal.
            </p>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP for personalized rates"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculator Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {mockStates.map(state => (
                      <option key={state.id} value={state.slug}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Home Type</label>
                  <select
                    value={homeType}
                    onChange={(e) => {
                      setHomeType(e.target.value);
                      setMonthlyUsage(homeTypeUsage[e.target.value as keyof typeof homeTypeUsage]);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="small">Small Apartment (650 kWh)</option>
                    <option value="average">Average Home (1,000 kWh)</option>
                    <option value="large">Large Home (1,500 kWh)</option>
                    <option value="xlarge">Very Large Home (2,200 kWh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Usage (kWh)
                  </label>
                  <input
                    type="number"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this number on your electricity bill
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Quick Results</h4>
                {sortedPlans.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cheapest:</span>
                      <span className="font-bold text-green-600">
                        ${sortedPlans[0].monthlyCost.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most Expensive:</span>
                      <span className="font-bold text-texas-red">
                        ${sortedPlans[sortedPlans.length - 1].monthlyCost.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potential Savings:</span>
                      <span className="font-bold text-texas-navy">
                        ${(sortedPlans[sortedPlans.length - 1].monthlyCost - sortedPlans[0].monthlyCost).toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Calculated Costs for {monthlyUsage} kWh/month
                </h2>
                <div className="text-sm text-gray-500">
                  {sortedPlans.length} plans compared
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3">Provider</th>
                      <th className="text-left py-3">Plan</th>
                      <th className="text-right py-3">Rate</th>
                      <th className="text-right py-3">Monthly Fee</th>
                      <th className="text-right py-3">Monthly Cost</th>
                      <th className="text-right py-3">Annual Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlans.map((plan, index) => (
                      <tr key={plan.id} className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index === 0 ? 'bg-green-50' : ''
                      }`}>
                        <td className="py-4">
                          <div className="flex items-center">
                            <img
                              src={plan.providerLogo}
                              alt={`${plan.providerName} logo`}
                              className="w-8 h-8 rounded object-cover mr-2"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{plan.providerName}</div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                {plan.providerRating}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium text-gray-900">{plan.name}</div>
                          <div className="text-xs text-gray-500">
                            {plan.termLength} mo • {plan.type} rate
                          </div>
                        </td>
                        <td className="py-4 text-right font-semibold">{plan.rate}¢/kWh</td>
                        <td className="py-4 text-right">${plan.fees.monthlyFee}</td>
                        <td className="py-4 text-right">
                          <div className={`font-bold text-lg ${
                            index === 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            ${plan.monthlyCost.toFixed(2)}
                          </div>
                          {index === 0 && (
                            <div className="text-xs text-green-600 font-medium">CHEAPEST</div>
                          )}
                        </td>
                        <td className="py-4 text-right font-semibold">
                          ${plan.annualCost.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  *Costs include electricity usage + monthly fees. Excludes taxes and utility delivery charges.
                </p>
                <button
                  onClick={() => navigate(`/${selectedState}/electricity-providers`)}
                  className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  View All {stateData?.name} Providers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Tips */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tips for Accurate Calculations
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Use Your Actual Usage</h3>
              <p className="text-gray-600 text-sm">
                Look at your last 12 months of electricity bills to find your average monthly kWh usage. 
                This gives you the most accurate cost comparison.
              </p>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Include All Fees</h3>
              <p className="text-gray-600 text-sm">
                Our calculator includes monthly service fees, but remember to also consider connection fees 
                and early termination fees when choosing a plan.
              </p>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
                <TrendingDown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Consider Seasonal Changes</h3>
              <p className="text-gray-600 text-sm">
                Your usage may vary seasonally due to heating and cooling. Consider calculating 
                costs for both high and low usage months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}