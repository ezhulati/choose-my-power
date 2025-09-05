import React, { useState } from 'react';
import StandardZipInputReact from '../../components/StandardZipInputReact';
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
      title: 'What Will I Actually Pay?',
      description: 'Enter your usage, we add ALL the fees, show you the real monthly cost',
      href: '/rates/calculator',
      icon: Calculator,
      color: 'blue'
    },
    {
      title: 'Who\'s Actually Cheapest?',
      description: 'Real cost comparison - not just the teaser rates they advertise',
      href: '/compare/rates',
      icon: BarChart,
      color: 'green'
    },
    {
      title: 'Are Rates Going Up or Down?',
      description: 'See if you should switch now or wait for better deals',
      href: '/rates/tracker',
      icon: TrendingDown,
      color: 'purple'
    }
  ];

  const rateEducation = [
    {
      icon: DollarSign,
      title: 'The Monthly Fee Trick',
      description: 'That "low" 9¢ rate? They add a $9.95 fee. Suddenly the 11¢ plan with no fee is cheaper. We catch this for you.',
      example: '9¢ + $10 fee = $100/mo. But 11¢ + no fee = $110/mo. Math matters.'
    },
    {
      icon: Calendar,
      title: 'Fixed vs Variable (The Real Deal)',
      description: 'Fixed = same price all year. Variable = they can jack it up anytime. Guess which one surprises people?',
      example: 'Fixed: Sleep easy. Variable: Check your bill for surprises.'
    },
    {
      icon: Zap,
      title: 'The Usage Window Scam',
      description: 'Some plans only give you the good rate if you use EXACTLY 1000 kWh. Use 999? Price jumps. Use 1001? Price jumps. Sneaky.',
      example: 'Use 999 kWh = 15¢. Use 1000 kWh = 9¢. Use 1001 kWh = 15¢. See the problem?'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <Calculator className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Electricity Rates</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-12 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                What's Electricity
                <span className="block text-texas-gold mt-2">Actually Cost?</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">That 9.9¢ rate?</span> 
                <span className="text-white font-semibold">Add fees, it's 14¢.</span> 
                <span className="text-white/80">We do the real math.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">Real math, no surprises</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">All fees included</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">Updated daily</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
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
              <StandardZipInputReact 
                onSearch={handleZipSearch} 
                size="lg"
              />
              <p className="text-blue-200 text-lg mt-3 font-medium">See your actual costs, not marketing rates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Rate Tools */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-4">
              Tools That Show You the Truth
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We built these because we got tired of surprise bills. Now you can see exactly what you'll pay before signing up.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {rateTools.map((tool, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-texas-cream text-texas-navy rounded-3xl mb-8 group-hover:scale-110 transition-transform duration-300">
                    <tool.icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-texas-navy mb-6">{tool.title}</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">{tool.description}</p>
                  <button
                    onClick={() => navigate(tool.href)}
                    className="bg-texas-red text-white px-8 py-4 rounded-xl hover:bg-texas-red-600 transition-all duration-300 font-semibold w-full shadow-lg hover:shadow-xl"
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
            What People Are Actually Paying Today
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
              <div className="text-center p-6 bg-texas-cream-200 rounded-lg">
                <div className="text-3xl font-bold text-blue-900">{averageRate.toFixed(1)}¢</div>
                <div className="text-sm text-texas-navy">Average Rate</div>
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
              className="bg-texas-red text-white px-8 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
            >
              View All {stateData?.name} Rates
            </button>
          </div>
        </div>

        {/* Rate Education */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Lesson: How They Try to Trick You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The advertised rate is never what you pay. Here's what they hope you won't notice.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {rateEducation.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-6">
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
            Your Real Bill With Each Plan ({stateData?.name})
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
              className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
            >
              Use Advanced Calculator
            </button>
          </div>
        </div>

        {/* Location-Based Rates */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Different ZIP Code? Different Price.
            </h3>
            
            <p className="text-gray-600 mb-6">
              Yeah, it's weird. Your neighbor 2 miles away might have totally different options. Pick your exact spot.
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
              Learn the Tricks They Use
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/resources/guides/understanding-electricity-rates')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Decode Your Confusing Bill</div>
                <div className="text-sm text-gray-600">What all those random charges actually mean (spoiler: half are nonsense)</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/guides/fixed-vs-variable')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Fixed vs Variable (Which Won't Bite You?)</div>
                <div className="text-sm text-gray-600">One protects you, one can screw you. Guess which is which.</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/guides/rate-comparison')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Compare Like a Pro (Not a Sucker)</div>
                <div className="text-sm text-gray-600">The 3-step method to see through their pricing games</div>
              </button>
              
              <button
                onClick={() => navigate('/resources/faqs')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">Questions Everyone Asks</div>
                <div className="text-sm text-gray-600">Why is my bill so high? Can they really do that? (Answers inside)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}