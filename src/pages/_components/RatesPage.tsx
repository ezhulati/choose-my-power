import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Calculator, TrendingDown, BarChart, MapPin, Zap, DollarSign, Calendar, Leaf, CheckCircle } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface RatesPageProps {
}

export function RatesPage({}: RatesPageProps) {
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

  const handleZipSearch = (zipCode: string) => {
    // Enhanced ZIP routing
    if (zipCode.startsWith('77') || zipCode.startsWith('75') || zipCode.startsWith('78')) {
      navigate('/texas/houston/electricity-rates');
    } else if (zipCode.startsWith('19') || zipCode.startsWith('15')) {
      navigate('/pennsylvania/philadelphia/electricity-rates');
    } else {
      navigate('/texas/houston/electricity-rates');
    }
  };

  const stateData = mockStates.find(s => s.slug === selectedState);
  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(selectedState));
  const allPlans = stateProviders.flatMap(provider => 
    provider.plans.map(plan => ({ ...plan, providerName: provider.name }))
  );

  const lowestRate = Math.min(...allPlans.map(p => p.rate));
  const averageRate = allPlans.reduce((sum, p) => sum + p.rate, 0) / allPlans.length;
  const highestRate = Math.max(...allPlans.map(p => p.rate));

  const rateTools = [
    {
      title: 'Electricity Rate Calculator',
      description: 'Calculate your monthly electricity costs based on usage and compare different plans',
      href: '/rates/calculator',
      icon: Calculator,
      color: 'blue'
    },
    {
      title: 'Compare Rates by State',
      description: 'Side-by-side rate comparison from all providers in your area',
      href: '/compare/rates',
      icon: BarChart,
      color: 'green'
    },
    {
      title: 'Rate Trends & Analysis',
      description: 'Track electricity rate trends and get alerts when rates change',
      href: '/rates/tracker',
      icon: TrendingDown,
      color: 'purple'
    }
  ];

  const rateEducation = [
    {
      icon: DollarSign,
      title: 'Rate vs Total Cost',
      description: 'The lowest rate per kWh isn\'t always the cheapest option. Monthly fees can make a "higher" rate actually cost less overall.',
      example: 'Plan A: 9¢/kWh + $10/month = $100/month vs Plan B: 11¢/kWh + $0/month = $110/month'
    },
    {
      icon: Calendar,
      title: 'Fixed vs Variable Rates',
      description: 'Fixed rates stay the same for your entire contract. Variable rates can change monthly based on market conditions.',
      example: 'Fixed: Predictable bills, budget-friendly vs Variable: May start lower, can increase'
    },
    {
      icon: Zap,
      title: 'Usage Matters',
      description: 'Your monthly usage affects which plans offer the best value. High and low usage customers benefit from different rate structures.',
      example: 'High usage: Lower rates matter more vs Low usage: Monthly fees matter more'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Calculator className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Electricity Rates & Comparison Tools
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-4xl mx-auto">
              Compare current electricity rates, calculate costs, and understand pricing. 
              Find the tools you need to make informed decisions about your electricity plan.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{lowestRate.toFixed(1)}¢</div>
                <div className="text-blue-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{averageRate.toFixed(1)}¢</div>
                <div className="text-blue-200 text-sm">Average Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{stateProviders.length}</div>
                <div className="text-blue-200 text-sm">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{allPlans.length}</div>
                <div className="text-blue-200 text-sm">Total Plans</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code for local rates"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized rates for your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Rate Tools */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Electricity Rate Comparison Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Use our comprehensive tools to compare rates, calculate costs, and find the best electricity deals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {rateTools.map((tool, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6`}>
                    <tool.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{tool.title}</h3>
                  <p className="text-gray-600 mb-6">{tool.description}</p>
                  <button
                    onClick={() => navigate(tool.href)}
                    className={`bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium w-full`}
                  >
                    Open Tool
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Rate Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Current Rate Overview
          </h2>

          <div className="mb-6 text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select State:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {mockStates.map(state => (
                <option key={state.id} value={state.slug}>{state.name}</option>
              ))}
            </select>
          </div>

          {stateData && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-900">{lowestRate.toFixed(1)}¢</div>
                <div className="text-sm text-green-700">Lowest Rate</div>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-900">{averageRate.toFixed(1)}¢</div>
                <div className="text-sm text-blue-700">Average Rate</div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-900">{highestRate.toFixed(1)}¢</div>
                <div className="text-sm text-orange-700">Highest Rate</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-900">{allPlans.length}</div>
                <div className="text-sm text-purple-700">Available Plans</div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => navigate(`/${selectedState}/electricity-rates`)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              View All {stateData?.name} Rates
            </button>
          </div>
        </div>

        {/* Rate Education */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Understanding Electricity Rates
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn how electricity pricing works and what factors affect your monthly bill.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {rateEducation.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-6">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-1">Example:</div>
                  <div className="text-sm text-gray-600">{item.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Rate Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Rate Comparison for {stateData?.name}
          </h2>
          
          <div className="mb-6 text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Usage (kWh):</label>
            <input
              type="number"
              value={monthlyUsage}
              onChange={(e) => setMonthlyUsage(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="1000"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3">Provider</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-right py-3">Rate</th>
                  <th className="text-right py-3">Est. Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                {allPlans.slice(0, 8).map((plan) => {
                  const monthlyCost = (plan.rate * parseInt(monthlyUsage) / 100) + plan.fees.monthlyFee;
                  
                  return (
                    <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{plan.providerName}</td>
                      <td className="py-3">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-gray-500">{plan.termLength} mo • {plan.type}</div>
                      </td>
                      <td className="py-3 text-right font-semibold">{plan.rate}¢/kWh</td>
                      <td className="py-3 text-right font-bold text-green-600">
                        ${monthlyCost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/rates/calculator')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Use Advanced Calculator
            </button>
          </div>
        </div>

        {/* Location-Based Rates */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Rates by Location
            </h3>
            
            <p className="text-gray-600 mb-6">
              Electricity rates vary by location due to different utility service areas and local market competition.
            </p>

            <div className="space-y-4">
              {mockStates.map((state) => (
                <button
                  key={state.id}
                  onClick={() => navigate(`/${state.slug}/electricity-rates`)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{state.name}</div>
                      <div className="text-sm text-gray-600">
                        {state.isDeregulated ? 'Deregulated Market' : 'Regulated Market'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{state.averageRate}¢/kWh</div>
                      <div className="text-sm text-gray-500">avg rate</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Rate Resources
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/resources/guides/understanding-electricity-rates')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Understanding Your Bill</div>
                <div className="text-sm text-gray-600">Learn to read and understand all charges on your electric bill</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/guides/fixed-vs-variable')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Fixed vs Variable Rates</div>
                <div className="text-sm text-gray-600">Compare different rate structures and find what works for you</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/guides/rate-comparison')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">How to Compare Rates</div>
                <div className="text-sm text-gray-600">Step-by-step guide to effective rate comparison</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/faqs')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Rate FAQs</div>
                <div className="text-sm text-gray-600">Common questions about electricity rates and pricing</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}