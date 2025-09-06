import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { getProviders, getCities, type RealProvider, type RealCity } from '../../lib/services/provider-service';
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
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const providersData = await getProviders('texas');
        setProviders(providersData);
      } catch (error) {
        console.error('[RateCalculatorPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleZipSearch = (zipCode: string) => {
    // For Texas ZIP codes, navigate to electricity plans with rate calculator context
    if (zipCode.match(/^7[0-9]{4}$/)) {
      navigate(`/electricity-plans/texas/${zipCode}?calculator=true`);
    } else {
      // For other states, go to general electricity plans
      navigate(`/electricity-plans`);
    }
  };

  const stateData = { slug: 'texas', name: 'Texas', averageRate: '12.5', isDeregulated: true };
  const stateProviders = providers;
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
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <nav className="text-sm text-blue-200 mb-8">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/rates')} className="hover:text-white transition-colors">Rates</button>
            <span className="mx-2">/</span>
            <span className="text-white">Calculator</span>
          </nav>

          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <Calculator className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Real Bill Calculator</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-12 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                See What You'll
                <span className="block text-texas-gold mt-2">Actually Pay</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">No more surprises.</span> 
                <span className="text-white font-semibold">Calculate your real monthly bill</span> 
                <span className="text-white/80">with any Texas electricity plan.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg mb-16">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">Exact calculations</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">Real rates</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">No hidden fees</span>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto mt-12">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8 sticky top-6">
              <h3 className="text-2xl font-bold text-texas-navy mb-6">Tell Us About Your Home</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Where do you live?</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="texas">Texas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What best describes your home?</label>
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
                    How much electricity did you use last month?
                  </label>
                  <input
                    type="number"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Like 1,200 kWh (check your bill)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Look for 'kWh used' on page 1 of your bill
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Your Savings Snapshot</h4>
                {sortedPlans.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Value:</span>
                      <span className="font-bold text-green-600">
                        ${sortedPlans[0].monthlyCost.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Highest Cost:</span>
                      <span className="font-bold text-texas-red">
                        ${sortedPlans[sortedPlans.length - 1].monthlyCost.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">You Could Save:</span>
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
            <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-texas-navy">
                  Here's What You'd Pay Each Month
                </h2>
                <div className="text-sm text-gray-500">
                  Comparing {sortedPlans.length} plans for you
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3">Company</th>
                      <th className="text-left py-3">Plan Name</th>
                      <th className="text-right py-3">Price per kWh</th>
                      <th className="text-right py-3">Service Fee</th>
                      <th className="text-right py-3">Your Monthly Bill</th>
                      <th className="text-right py-3">Yearly Total</th>
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
                            <div className="text-xs text-green-600 font-medium">BEST DEAL</div>
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
                  * Your actual bill will include taxes and delivery charges (usually $25-40 more)
                </p>
                <button
                  onClick={() => navigate(`/${selectedState}/electricity-providers`)}
                  className="bg-texas-red text-white px-8 py-4 rounded-xl hover:bg-texas-red-600 transition-all duration-300 font-semibold text-lg shadow-md hover:shadow-xl"
                >
                  See More {stateData?.name} Plans
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Tips */}
        <div className="mt-16">
          <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-12 text-center">
            How to Get the Most Accurate Results
          </h2>
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-12">
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-texas-navy mb-4">Check Your Past Bills</h3>
              <p className="text-gray-600 leading-relaxed">
                Find your average monthly kWh by looking at your last few bills. 
                This helps you see what you'd really pay with each plan.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-texas-navy mb-4">Watch for Hidden Costs</h3>
              <p className="text-gray-600 leading-relaxed">
                We show you monthly fees, but check for signup fees 
                and cancellation penalties before you commit.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-texas-navy mb-4">Summer vs Winter Bills</h3>
              <p className="text-gray-600 leading-relaxed">
                Your AC and heating change your usage dramatically. Try calculating 
                both your highest summer bill and lowest spring bill.
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}