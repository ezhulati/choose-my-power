import React, { useState } from 'react';
import { ZipCodeSearch } from '../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../data/mockData';
import { TrendingDown, Calculator, BarChart, Info, MapPin, Zap } from 'lucide-react';

interface StateElectricityRatesPageProps {
  state: string;
  onNavigate: (path: string) => void;
}

export function StateElectricityRatesPage({ state, onNavigate }: StateElectricityRatesPageProps) {
  const [selectedUsage, setSelectedUsage] = useState<'500' | '1000' | '1500' | '2000'>('1000');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const stateData = mockStates.find(s => s.slug === state);
  
  if (!stateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <button
            onClick={() => onNavigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(stateData.slug));
  const allPlans = stateProviders.flatMap(provider => 
    provider.plans.map(plan => ({ ...plan, providerName: provider.name, providerSlug: provider.slug }))
  );

  // Sort plans by rate
  const sortedPlans = allPlans.sort((a, b) => a.rate - b.rate);
  const cheapestPlan = sortedPlans[0];
  const averageRate = allPlans.reduce((sum, plan) => sum + plan.rate, 0) / allPlans.length;

  const handleZipSearch = (zipCode: string) => {
    const city = stateData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      onNavigate(`/${state}/${city.slug}/electricity-rates`);
    }
  };

  const usageOptions = [
    { value: '500', label: '500 kWh', description: 'Small apartment' },
    { value: '1000', label: '1,000 kWh', description: 'Average home' },
    { value: '1500', label: '1,500 kWh', description: 'Large home' },
    { value: '2000', label: '2,000 kWh', description: 'Very large home' }
  ];

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate(`/${state}/electricity-providers`)} className="hover:text-blue-600">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>Electricity Rates</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {stateData.name} Electricity Rates
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Current electricity rates in {stateData.name} from {stateProviders.length} providers. 
                Compare rates, calculate costs, and find the best deal for your usage.
              </p>

              {/* Rate Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Lowest Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{cheapestPlan?.rate}¢</div>
                  <div className="text-sm text-green-700">per kWh</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <BarChart className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Average Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{averageRate.toFixed(1)}¢</div>
                  <div className="text-sm text-blue-700">per kWh</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">Total Plans</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{allPlans.length}</div>
                  <div className="text-sm text-purple-700">available</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Cities</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{stateData.topCities.length}</div>
                  <div className="text-sm text-orange-700">major areas</div>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder={`Enter ${stateData.abbreviation} ZIP for exact rates`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Rate Calculator */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Electricity Rate Calculator
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your monthly usage:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {usageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedUsage(option.value as any)}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        selectedUsage === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
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
                      <th className="text-right py-3">Rate (¢/kWh)</th>
                      <th className="text-right py-3">Monthly Fee</th>
                      <th className="text-right py-3">Est. Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlans.slice(0, 10).map((plan) => (
                      <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3">
                          <button
                            onClick={() => onNavigate(`/providers/${plan.providerSlug}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {plan.providerName}
                          </button>
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-xs text-gray-500">{plan.termLength} months</div>
                        </td>
                        <td className="py-3 text-right font-semibold">{plan.rate}¢</td>
                        <td className="py-3 text-right">${plan.fees.monthlyFee}</td>
                        <td className="py-3 text-right font-bold text-green-600">
                          ${calculateMonthlyCost(plan.rate, parseInt(selectedUsage), plan.fees.monthlyFee).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => onNavigate(`/${state}/electricity-providers`)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View all {stateProviders.length} providers →
                </button>
              </div>
            </div>

            {/* Rate Trends */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {stateData.name} Rate Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Rate Structure</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Electricity rates in {stateData.name} include the energy charge (per kWh), 
                    monthly service fees, and applicable taxes. Understanding these components 
                    helps you compare total costs accurately.
                  </p>
                  
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Show rate breakdown
                  </button>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Rate Factors</h4>
                  <ul className="text-gray-600 text-sm space-y-2">
                    <li>• Contract length (12, 24, or 36 months)</li>
                    <li>• Plan type (fixed, variable, or indexed)</li>
                    <li>• Monthly usage amount</li>
                    <li>• Green energy percentage</li>
                    <li>• Provider service fees</li>
                  </ul>
                </div>
              </div>

              {showBreakdown && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Sample Bill Breakdown (1,000 kWh)</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Energy Charge ({cheapestPlan?.rate}¢/kWh):</span>
                      <span>${(cheapestPlan?.rate * 10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Service Fee:</span>
                      <span>${cheapestPlan?.fees.monthlyFee}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Monthly Cost:</span>
                      <span>${((cheapestPlan?.rate * 10) + cheapestPlan?.fees.monthlyFee).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Rate Tools */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Tools</h3>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('/rates/calculator')}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Rate Calculator</div>
                  <div className="text-sm text-gray-600">Compare total costs</div>
                </button>
                
                <button
                  onClick={() => onNavigate('/resources/tools/savings-calculator')}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Savings Calculator</div>
                  <div className="text-sm text-gray-600">Estimate potential savings</div>
                </button>
                
                <button
                  onClick={() => onNavigate('/rates/alerts')}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Rate Alerts</div>
                  <div className="text-sm text-gray-600">Get notified of rate changes</div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate(`/shop/cheapest-electricity?state=${state}`)}
                  className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  Find Cheapest Rates
                </button>
                <button
                  onClick={() => onNavigate(`/${state}/electricity-plans`)}
                  className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  Browse All Plans
                </button>
                <button
                  onClick={() => onNavigate(`/compare/rates/by-state`)}
                  className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  Compare State Rates
                </button>
                <button
                  onClick={() => onNavigate(`/${state}/market-info`)}
                  className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  Market Information
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}