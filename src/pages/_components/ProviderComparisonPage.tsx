import React, { useState } from 'react';
import { mockProviders, mockStates } from '../../data/mockData';
import { Star, TrendingDown, Calendar, Leaf, DollarSign, Users, Shield, Phone, CheckCircle, X } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ProviderComparisonPageProps {
  providerA: string;
  providerB: string;
  state?: string;
}

export function ProviderComparisonPage({ providerA, providerB, state }: ProviderComparisonPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedUsage, setSelectedUsage] = useState('1000');
  const [comparisonMetric, setComparisonMetric] = useState<'rate' | 'total-cost' | 'features'>('rate');

  const provider1 = mockProviders.find(p => p.slug === providerA);
  const provider2 = mockProviders.find(p => p.slug === providerB);
  const stateData = state ? mockStates.find(s => s.slug === state) : null;
  
  if (!provider1 || !provider2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Providers Not Found</h1>
          <button
            onClick={() => navigate('/compare/providers')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Compare Other Providers
          </button>
        </div>
      </div>
    );
  }

  // Get best plans from each provider
  const provider1BestPlan = provider1.plans.sort((a, b) => a.rate - b.rate)[0];
  const provider2BestPlan = provider2.plans.sort((a, b) => a.rate - b.rate)[0];

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const provider1Cost = calculateMonthlyCost(provider1BestPlan.rate, parseInt(selectedUsage), provider1BestPlan.fees.monthlyFee);
  const provider2Cost = calculateMonthlyCost(provider2BestPlan.rate, parseInt(selectedUsage), provider2BestPlan.fees.monthlyFee);
  const annualSavings = Math.abs(provider1Cost - provider2Cost) * 12;

  const comparisonData = [
    {
      category: 'Customer Rating',
      provider1: provider1.rating.toString(),
      provider2: provider2.rating.toString(),
      winner: provider1.rating > provider2.rating ? 'provider1' : provider2.rating > provider1.rating ? 'provider2' : 'tie'
    },
    {
      category: 'Review Count',
      provider1: provider1.reviewCount.toLocaleString(),
      provider2: provider2.reviewCount.toLocaleString(),
      winner: provider1.reviewCount > provider2.reviewCount ? 'provider1' : provider2.reviewCount > provider1.reviewCount ? 'provider2' : 'tie'
    },
    {
      category: 'Lowest Rate',
      provider1: `${provider1BestPlan.rate}¢/kWh`,
      provider2: `${provider2BestPlan.rate}¢/kWh`,
      winner: provider1BestPlan.rate < provider2BestPlan.rate ? 'provider1' : provider2BestPlan.rate < provider1BestPlan.rate ? 'provider2' : 'tie'
    },
    {
      category: 'Monthly Fee',
      provider1: `$${provider1BestPlan.fees.monthlyFee}`,
      provider2: `$${provider2BestPlan.fees.monthlyFee}`,
      winner: provider1BestPlan.fees.monthlyFee < provider2BestPlan.fees.monthlyFee ? 'provider1' : provider2BestPlan.fees.monthlyFee < provider1BestPlan.fees.monthlyFee ? 'provider2' : 'tie'
    },
    {
      category: 'Available Plans',
      provider1: provider1.plans.length.toString(),
      provider2: provider2.plans.length.toString(),
      winner: provider1.plans.length > provider2.plans.length ? 'provider1' : provider2.plans.length > provider1.plans.length ? 'provider2' : 'tie'
    }
  ];

  const usageOptions = ['500', '1000', '1500', '2000'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/compare/providers')} className="hover:text-blue-600">Compare Providers</button>
            <span className="mx-2">/</span>
            <span>{provider1.name} vs {provider2.name}</span>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {provider1.name} vs {provider2.name}{state ? ` in ${stateData?.name}` : ''} - 2024 Comparison
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Compare electricity rates, plans, and customer reviews between {provider1.name} and {provider2.name}. 
              See which provider offers better rates{state ? ` for ${stateData?.name} residents` : ''} and find the best electricity plan for your home.
            </p>

            {/* Quick Winner Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <div className="text-sm text-blue-800 mb-1">Quick Comparison Winner:</div>
              <div className="text-lg font-bold text-blue-900">
                {provider1Cost < provider2Cost ? provider1.name : provider2.name} 
                <span className="text-green-600 ml-2">saves ${annualSavings.toFixed(0)}/year</span>
              </div>
            </div>
          </div>

          {/* Provider Headers */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <img
                  src={provider1.logo}
                  alt={`${provider1.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover mr-4"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{provider1.name}</h2>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{provider1.rating}</span>
                    <span className="text-gray-500 ml-1">({provider1.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Best Rate</div>
                  <div className="font-bold text-green-600">{provider1BestPlan.rate}¢/kWh</div>
                </div>
                <div>
                  <div className="text-gray-600">Plans Available</div>
                  <div className="font-bold">{provider1.plans.length}</div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/providers/${provider1.slug}`)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View {provider1.name} Details
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <img
                  src={provider2.logo}
                  alt={`${provider2.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover mr-4"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{provider2.name}</h2>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{provider2.rating}</span>
                    <span className="text-gray-500 ml-1">({provider2.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Best Rate</div>
                  <div className="font-bold text-green-600">{provider2BestPlan.rate}¢/kWh</div>
                </div>
                <div>
                  <div className="text-gray-600">Plans Available</div>
                  <div className="font-bold">{provider2.plans.length}</div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/providers/${provider2.slug}`)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View {provider2.name} Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cost Comparison Calculator */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cost Comparison Calculator
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your monthly usage:
            </label>
            <div className="grid grid-cols-4 gap-3">
              {usageOptions.map((usage) => (
                <button
                  key={usage}
                  onClick={() => setSelectedUsage(usage)}
                  className={`p-3 text-center border rounded-lg transition-colors ${
                    selectedUsage === usage
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{usage} kWh</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider1.name} Cost</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Best Plan:</span>
                  <span className="font-medium">{provider1BestPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">{provider1BestPlan.rate}¢/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Fee:</span>
                  <span className="font-medium">${provider1BestPlan.fees.monthlyFee}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold">Total Monthly Cost:</span>
                  <span className="font-bold text-lg">${provider1Cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Annual Cost:</span>
                  <span className="font-bold text-lg">${(provider1Cost * 12).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider2.name} Cost</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Best Plan:</span>
                  <span className="font-medium">{provider2BestPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">{provider2BestPlan.rate}¢/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Fee:</span>
                  <span className="font-medium">${provider2BestPlan.fees.monthlyFee}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold">Total Monthly Cost:</span>
                  <span className="font-bold text-lg">${provider2Cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Annual Cost:</span>
                  <span className="font-bold text-lg">${(provider2Cost * 12).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Announcement */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-900">
                  {provider1Cost < provider2Cost ? provider1.name : provider2.name} is cheaper
                </div>
                <div className="text-green-700">
                  Saves ${Math.abs(provider1Cost - provider2Cost).toFixed(2)}/month or ${annualSavings.toFixed(0)}/year
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3">Category</th>
                  <th className="text-center py-3">{provider1.name}</th>
                  <th className="text-center py-3">{provider2.name}</th>
                  <th className="text-center py-3">Winner</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">{row.category}</td>
                    <td className={`py-4 text-center ${row.winner === 'provider1' ? 'bg-green-50 text-green-900 font-semibold' : ''}`}>
                      {row.provider1}
                    </td>
                    <td className={`py-4 text-center ${row.winner === 'provider2' ? 'bg-green-50 text-green-900 font-semibold' : ''}`}>
                      {row.provider2}
                    </td>
                    <td className="py-4 text-center">
                      {row.winner === 'provider1' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : row.winner === 'provider2' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-500">Tie</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider1.name} Features</h3>
            <ul className="space-y-2">
              {provider1.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider2.name} Features</h3>
            <ul className="space-y-2">
              {provider2.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Switch?</h2>
          <p className="text-blue-100 mb-6">
            Based on our comparison, {provider1Cost < provider2Cost ? provider1.name : provider2.name} offers better value. 
            Get started today and begin saving on your electricity bill.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/providers/${provider1Cost < provider2Cost ? provider1.slug : provider2.slug}`)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Choose {provider1Cost < provider2Cost ? provider1.name : provider2.name}
            </button>
            <button
              onClick={() => navigate('/compare/providers')}
              className="border border-blue-300 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Compare Other Providers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}