import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Zap, Info, CheckCircle, BarChart } from 'lucide-react';
import { mockProviders } from '../../data/mockData';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

export function CalculatorPage() {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      window.location.href = path;
    }
  };

  const [monthlyUsage, setMonthlyUsage] = useState(1000);
  const [selectedState, setSelectedState] = useState('texas');
  const [calculationResults, setCalculationResults] = useState<any[]>([]);

  // Get all plans from providers serving the selected state
  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(selectedState));
  const allPlans = stateProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name,
      providerRating: provider.rating 
    }))
  );

  useEffect(() => {
    // Calculate costs for all plans
    const results = allPlans.map(plan => {
      const energyCost = (plan.rate * monthlyUsage) / 100;
      const monthlyFee = plan.fees.monthlyFee || 0;
      const connectionFee = plan.fees.connectionFee || 0;
      const totalMonthlyCost = energyCost + monthlyFee;
      const annualCost = (totalMonthlyCost * 12) + connectionFee;

      return {
        ...plan,
        energyCost,
        monthlyFee,
        connectionFee,
        totalMonthlyCost,
        annualCost
      };
    }).sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);

    setCalculationResults(results);
  }, [monthlyUsage, selectedState]);

  const usagePresets = [
    { label: 'Small Apartment', value: 500, description: '1-2 bedrooms' },
    { label: 'Average Home', value: 1000, description: '2-3 bedrooms' },
    { label: 'Large House', value: 2000, description: '4+ bedrooms' },
    { label: 'Extra Large', value: 3000, description: 'Big home with pool' }
  ];

  const topPlan = calculationResults[0];
  const averageCost = calculationResults.length > 0 
    ? calculationResults.reduce((sum, plan) => sum + plan.totalMonthlyCost, 0) / calculationResults.length
    : 0;
  const potentialSavings = topPlan && averageCost > topPlan.totalMonthlyCost 
    ? averageCost - topPlan.totalMonthlyCost
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Calculator className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Out What You'd Really Pay
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-4xl mx-auto">
              See your actual monthly bills with every plan available. 
              Know exactly what you'd pay before you switch.
            </p>

            {topPlan && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg max-w-2xl mx-auto">
                <div className="text-lg mb-2">We found your best deal:</div>
                <div className="text-3xl font-bold mb-2">
                  {topPlan.providerName} - {topPlan.name}
                </div>
                <div className="text-xl">
                  ${topPlan.totalMonthlyCost.toFixed(2)}/month
                  {potentialSavings > 0 && (
                    <span className="ml-2 text-green-200">
                      (You'd save ${potentialSavings.toFixed(2)}/month)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Calculator Input */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tell Us About Your Usage
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How much electricity do you use each month?
              </label>
              <div className="mb-4">
                <input
                  type="number"
                  value={monthlyUsage}
                  onChange={(e) => setMonthlyUsage(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Type number from your bill (like 1,200)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {usagePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setMonthlyUsage(preset.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      monthlyUsage === preset.value
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-2xl font-bold text-green-600 my-1">{preset.value} kWh</div>
                    <div className="text-sm text-gray-600">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Where do you live?
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-6"
              >
                <option value="texas">Texas</option>
                <option value="pennsylvania">Pennsylvania</option>
                <option value="ohio">Ohio</option>
                <option value="illinois">Illinois</option>
              </select>

              {calculationResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">What We Found</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plans Compared:</span>
                      <span className="font-medium">{calculationResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lowest Bill:</span>
                      <span className="font-medium text-green-600">
                        ${topPlan?.totalMonthlyCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Bill:</span>
                      <span className="font-medium">${averageCost.toFixed(2)}</span>
                    </div>
                    {potentialSavings > 0 && (
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">You Could Save:</span>
                        <span className="font-bold text-green-600">
                          ${potentialSavings.toFixed(2)}/month
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {calculationResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Here's What You'd Pay With Each Plan
              </h2>
              <p className="text-gray-600 mt-2">
                Sorted from cheapest to most expensive (all fees included)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Best Deal</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Company & Plan</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-900">Price per kWh</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-900">Usage Cost</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-900">Service Fee</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-900">Your Monthly Bill</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-900">Yearly Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calculationResults.slice(0, 15).map((plan, index) => (
                    <tr 
                      key={plan.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index === 0 ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className={`font-bold text-lg ${
                            index === 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            #{index + 1}
                          </span>
                          {index === 0 && (
                            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{plan.providerName}</div>
                        <div className="text-sm text-gray-600">{plan.name}</div>
                        <div className="text-xs text-gray-500">
                          {plan.termLength} months • {plan.type}
                          {plan.providerRating && (
                            <span className="ml-1">• {plan.providerRating}★</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {plan.rate}¢/kWh
                      </td>
                      <td className="py-4 px-6 text-right">
                        ${plan.energyCost.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        ${plan.monthlyFee.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className={`font-bold text-lg ${
                          index === 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          ${plan.totalMonthlyCost.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        ${plan.annualCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-gray-50 text-center">
              <button
                onClick={() => navigate('/compare')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium mr-4"
              >
                See More Options
              </button>
              <button
                onClick={() => navigate('/rates')}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Browse All Plans
              </button>
            </div>
          </div>
        )}

        {/* Calculator Info */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-texas-navy mr-3" />
              <h3 className="text-xl font-bold text-gray-900">How We Calculate Your Costs</h3>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>
                We take your monthly usage and calculate what you'd pay with every available plan in your area.
              </p>
              <p>
                <strong>Your monthly bill</strong> includes:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Energy charges (kWh usage × rate per kWh)</li>
                <li>Monthly service fees</li>
                <li>Base charges and connection fees</li>
              </ul>
              <p>
                We sort plans from cheapest to most expensive so you can quickly find your best deal.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">How to Save More</h3>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Look at the total bill, not just the rate.</strong> Sometimes a higher rate saves you money if there's no monthly fee.
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Use your real usage.</strong> Check your last few bills to find your average kWh.
                </div>
              </div>
              <div className="flex items-start">
                <BarChart className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Think about commitment.</strong> Longer plans often cost less but lock you in.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}