import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Zap, Info, CheckCircle, BarChart } from 'lucide-react';
import { getProviders, getCities, getPlansForCity, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import EnhancedSectionReact from '../../components/ui/EnhancedSectionReact';
import EnhancedCardReact from '../../components/ui/EnhancedCardReact';
import AccentBoxReact from '../../components/ui/AccentBoxReact';

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
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[CalculatorPage] Loading providers and plans...');
        
        const [providersData] = await Promise.all([
          getProviders('texas')
        ]);
        
        // Load sample plans from Houston for calculator
        const houstonPlans = await getPlansForCity('houston', 'texas');
        
        setProviders(providersData);
        setPlans(houstonPlans);
        
        console.log(`[CalculatorPage] Loaded ${providersData.length} providers and ${houstonPlans.length} plans`);
      } catch (error) {
        console.error('[CalculatorPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Create all plans array from real data
  const allPlans = plans.map(plan => ({
    ...plan,
    id: plan.id || Math.random().toString(),
    name: plan.name || 'Plan',
    rate: plan.rate || 12.5,
    providerName: plan.provider || 'Provider',
    providerRating: plan.rating || 4.0,
    type: plan.type || 'Fixed',
    termLength: plan.termLength || 12,
    fees: {
      monthlyFee: plan.monthlyFee || 0,
      connectionFee: plan.connectionFee || 0
    }
  }));

  useEffect(() => {
    if (!loading && allPlans.length > 0) {
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
    } else if (loading && allPlans.length === 0) {
      // Create sample data for loading state
      const samplePlans = [
        { id: '1', name: 'SimpleSaver 12', rate: 9.7, providerName: 'APGE', providerRating: 4.1, type: 'Fixed', termLength: 12, fees: { monthlyFee: 0, connectionFee: 0 } },
        { id: '2', name: 'Eco Saver Plus', rate: 9.8, providerName: 'Gexa Energy', providerRating: 4.3, type: 'Fixed', termLength: 12, fees: { monthlyFee: 0, connectionFee: 0 } },
        { id: '3', name: 'Fixed 12', rate: 10.1, providerName: 'Discount Power', providerRating: 3.8, type: 'Fixed', termLength: 12, fees: { monthlyFee: 0, connectionFee: 0 } }
      ];
      
      const results = samplePlans.map(plan => {
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
    }
  }, [monthlyUsage, selectedState, allPlans, loading]);

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
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <Calculator className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Bill Calculator</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-12 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                What Would You
                <span className="block text-texas-gold mt-2">Really Pay?</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">Stop guessing.</span> 
                <span className="text-white font-semibold">See your actual monthly bill</span> 
                <span className="text-white/80">with any Texas electricity plan.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg mb-16">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">All fees included</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">Real-time rates</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">Instant results</span>
                </div>
              </div>
            </div>

            {topPlan && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-6 mt-12 max-w-2xl mx-auto">
                <div className="text-xl mb-3 text-texas-gold font-semibold">✓ Your Best Deal Found:</div>
                <div className="text-3xl font-bold mb-3 text-white">
                  {topPlan.providerName} - {topPlan.name}
                </div>
                <div className="text-2xl text-white font-semibold">
                  ${topPlan.totalMonthlyCost.toFixed(2)}/month
                  {potentialSavings > 0 && (
                    <div className="text-lg text-texas-gold mt-2">
                      You'd save ${potentialSavings.toFixed(2)}/month vs average
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EnhancedSectionReact 
        background="white" 
        padding="lg"
        title="Tell Us About Your Usage"
        titleSize="md"
      >
        <EnhancedCardReact variant="default" padding="lg">
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
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-texas-navy focus:border-texas-navy"
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
                        ? 'border-texas-navy bg-texas-navy/5 text-texas-navy'
                        : 'border-gray-200 hover:border-texas-navy/30 hover:bg-texas-navy/5'
                    }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-2xl font-bold text-texas-gold my-1">{preset.value} kWh</div>
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
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-texas-navy focus:border-texas-navy mb-6"
              >
                <option value="texas">Texas</option>
                <option value="pennsylvania">Pennsylvania</option>
                <option value="ohio">Ohio</option>
                <option value="illinois">Illinois</option>
              </select>

              {calculationResults.length > 0 && (
                <AccentBoxReact accentColor="navy" padding="lg">
                  <h3 className="font-medium text-gray-900 mb-4">What We Found</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plans Compared:</span>
                      <span className="font-medium">{calculationResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lowest Bill:</span>
                      <span className="font-medium text-texas-gold">
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
                        <span className="font-bold text-texas-gold">
                          ${potentialSavings.toFixed(2)}/month
                        </span>
                      </div>
                    )}
                  </div>
                </AccentBoxReact>
              )}
            </div>
          </div>
        </EnhancedCardReact>

        {/* Results */}
        {calculationResults.length > 0 && (
          <EnhancedCardReact variant="default" padding="sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-texas-navy">
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
                        index === 0 ? 'bg-texas-gold/5' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className={`font-bold text-lg ${
                            index === 0 ? 'text-texas-gold' : 'text-gray-900'
                          }`}>
                            #{index + 1}
                          </span>
                          {index === 0 && (
                            <CheckCircle className="h-5 w-5 text-texas-gold ml-2" />
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
                          index === 0 ? 'text-texas-gold' : 'text-gray-900'
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
                className="bg-texas-red text-white px-8 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium mr-4"
              >
                See More Options
              </button>
              <button
                onClick={() => navigate('/rates')}
                className="bg-texas-navy text-white px-8 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
              >
                Browse Quality Plans
              </button>
            </div>
          </EnhancedCardReact>
        )}

        {/* Calculator Info */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <EnhancedCardReact 
            variant="default" 
            padding="lg"
            icon={<Info />}
            iconColor="navy"
            title="How We Calculate Your Costs"
          >
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
          </EnhancedCardReact>

          <EnhancedCardReact 
            variant="default" 
            padding="lg"
            icon={<TrendingUp />}
            iconColor="gold"
            title="How to Save More"
          >
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-texas-gold mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Look at the total bill, not just the rate.</strong> Sometimes a higher rate saves you money if there's no monthly fee.
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-texas-gold mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Use your real usage.</strong> Check your last few bills to find your average kWh.
                </div>
              </div>
              <div className="flex items-start">
                <BarChart className="h-5 w-5 text-texas-gold mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Think about commitment.</strong> Longer plans often cost less but lock you in.
                </div>
              </div>
            </div>
          </EnhancedCardReact>
        </div>
      </EnhancedSectionReact>
    </div>
  );
}