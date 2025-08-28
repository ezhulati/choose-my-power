import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  Zap, Calendar, Leaf, DollarSign, Shield, TrendingDown, Filter, 
  CheckCircle, Star, Calculator, BarChart, Award, ArrowRight,
  Battery, Clock, Users, Target, Eye, Search
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ComparePlansPageProps {
}

export function ComparePlansPage({}: ComparePlansPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'fixed' | 'variable' | 'green' | 'prepaid' | 'free-time'>('all');
  const [termFilter, setTermFilter] = useState<'all' | '12' | '24' | '36'>('all');
  const [monthlyUsage, setMonthlyUsage] = useState('1000');
  const [showComparison, setShowComparison] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-plans`);
  };

  const planTypes = [
    {
      id: 'fixed',
      name: 'Fixed Rate Plans',
      icon: Shield,
      color: 'blue',
      description: 'Rates locked for entire contract term',
      benefits: ['Predictable bills', 'Budget protection', 'Rate stability', 'No surprise increases'],
      count: 150
    },
    {
      id: 'variable',
      name: 'Variable Rate Plans', 
      icon: TrendingDown,
      color: 'orange',
      description: 'Rates can change monthly with market',
      benefits: ['Market flexibility', 'Potential savings', 'No long commitment', 'Lower starting rates'],
      count: 85
    },
    {
      id: 'green',
      name: 'Green Energy Plans',
      icon: Leaf,
      color: 'green',
      description: '100% renewable energy sources',
      benefits: ['Environmental impact', 'Wind & solar power', 'Carbon neutral', 'Green certificates'],
      count: 95
    },
    {
      id: 'prepaid',
      name: 'Prepaid Plans',
      icon: DollarSign,
      color: 'purple',
      description: 'Pay before you use electricity',
      benefits: ['No credit check', 'Usage control', 'No deposits', 'Flexible terms'],
      count: 45
    },
    {
      id: 'free-time',
      name: 'Free Time Plans',
      icon: Clock,
      color: 'indigo',
      description: 'Free electricity during specific hours',
      benefits: ['Free nights/weekends', 'High usage savings', 'Time-based value', 'Peak shifting'],
      count: 35
    }
  ];

  // Get all plans with provider info
  const allPlans = mockProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  // Apply filters
  const filteredPlans = allPlans.filter(plan => {
    if (planTypeFilter !== 'all') {
      if (planTypeFilter === 'green' && plan.renewablePercent < 100) return false;
      if (planTypeFilter === 'prepaid' && !plan.name.toLowerCase().includes('prepaid')) return false;
      if (planTypeFilter === 'free-time' && !plan.name.toLowerCase().includes('free')) return false;
      if (planTypeFilter === 'fixed' && plan.type !== 'fixed') return false;
      if (planTypeFilter === 'variable' && plan.type !== 'variable') return false;
    }
    if (termFilter !== 'all' && plan.termLength !== parseInt(termFilter)) return false;
    return true;
  });

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      } else if (prev.length < 4) {
        return [...prev, planId];
      }
      return prev;
    });
  };

  const selectedPlanData = selectedPlans.map(id => 
    allPlans.find(p => p.id === id)
  ).filter(Boolean);

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const planComparisonMetrics = [
    { name: 'Rate per kWh', key: 'rate', format: (val: number) => `${val}¢` },
    { name: 'Contract Length', key: 'termLength', format: (val: number) => `${val} months` },
    { name: 'Plan Type', key: 'type', format: (val: string) => val.charAt(0).toUpperCase() + val.slice(1) },
    { name: 'Monthly Fee', key: 'monthlyFee', format: (plan: any) => `$${plan.fees.monthlyFee}` },
    { name: 'Cancellation Fee', key: 'cancellationFee', format: (plan: any) => `$${plan.fees.cancellationFee}` },
    { name: 'Renewable %', key: 'renewablePercent', format: (val: number) => `${val}%` },
    { name: 'Monthly Cost*', key: 'monthlyCost', format: (plan: any) => `$${calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee).toFixed(2)}` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Zap className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Compare Electricity Plans - Detailed Plan Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-4xl mx-auto">
              Compare specific electricity plans side-by-side. Analyze rates, contract terms, features, 
              and costs to find the perfect plan for your usage and preferences.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{allPlans.length}</div>
                <div className="text-green-200 text-sm">Total Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-green-200 text-sm">Plan Types</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{Math.min(...allPlans.map(p => p.rate))}¢</div>
                <div className="text-green-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-green-200 text-sm">Comparison</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code for local plans"
                size="lg"
              />
              <p className="text-green-200 text-sm mt-2">Find plans available in your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Comparison Bar */}
        {selectedPlans.length > 0 && (
          <div className="bg-green-600 text-white rounded-lg p-4 mb-8 sticky top-4 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Comparing {selectedPlans.length} Plans:</span>
                <div className="flex items-center space-x-2">
                  {selectedPlans.slice(0, 2).map((id) => {
                    const plan = allPlans.find(p => p.id === id);
                    return plan ? (
                      <div key={id} className="flex items-center bg-white/20 rounded-full px-3 py-1">
                        <span className="text-sm mr-2">{plan.name}</span>
                        <button
                          onClick={() => togglePlan(id)}
                          className="text-white hover:text-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                  {selectedPlans.length > 2 && (
                    <span className="text-sm">+{selectedPlans.length - 2} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  {showComparison ? 'Hide' : 'Show'} Plan Comparison
                </button>
                <button
                  onClick={() => setSelectedPlans([])}
                  className="text-white hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Plan Comparison */}
        {showComparison && selectedPlanData.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detailed Plan Comparison for {monthlyUsage} kWh/month
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-2 font-medium text-gray-900">Plan Details</th>
                    {selectedPlanData.map((plan) => (
                      <th key={plan?.id} className="text-center py-4 px-4 min-w-48">
                        <div className="flex flex-col items-center">
                          <img
                            src={plan?.providerLogo}
                            alt={`${plan?.providerName} logo`}
                            className="w-10 h-10 rounded-lg object-cover mb-2"
                          />
                          <div className="font-semibold text-gray-900">{plan?.name}</div>
                          <div className="text-sm text-gray-600">{plan?.providerName}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planComparisonMetrics.map((metric) => (
                    <tr key={metric.name} className="border-b border-gray-100">
                      <td className="py-4 px-2 font-medium text-gray-900">{metric.name}</td>
                      {selectedPlanData.map((plan) => (
                        <td key={plan?.id} className="py-4 px-4 text-center">
                          <div className={`font-semibold ${metric.name === 'Monthly Cost*' ? 'text-green-600 text-lg' : ''}`}>
                            {metric.key === 'monthlyFee' || metric.key === 'cancellationFee' || metric.key === 'monthlyCost'
                              ? metric.format(plan)
                              : metric.format((plan as any)?.[metric.key] || 0)
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium text-gray-900">Key Features</td>
                    {selectedPlanData.map((plan) => (
                      <td key={plan?.id} className="py-4 px-4">
                        <div className="space-y-1">
                          {plan?.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-600">
                              <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-2 font-medium text-gray-900">Actions</td>
                    {selectedPlanData.map((plan) => (
                      <td key={plan?.id} className="py-4 px-4 text-center">
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate(`/plans/${plan?.providerSlug}/${plan?.id}`)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            View Plan Details
                          </button>
                          <button
                            onClick={() => navigate(`/texas/houston/electricity-plans`)}
                            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Get This Plan
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              *Monthly cost calculated for {monthlyUsage} kWh usage including base charges
            </div>
          </div>
        )}

        {/* Plan Type Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse Plans by Type
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setPlanTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                planTypeFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Plan Types
            </button>
            {planTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setPlanTypeFilter(type.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  planTypeFilter === type.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {planTypes.map((type) => (
              <div key={type.id} className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${type.color}-100 text-${type.color}-600 rounded-lg mb-4`}>
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                <div className="text-2xl font-bold text-gray-900 mb-2">{type.count}</div>
                <div className="text-sm text-gray-600">plans available</div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Calculator */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Plan Cost Calculator
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Usage (kWh)</label>
                <input
                  type="number"
                  value={monthlyUsage}
                  onChange={(e) => setMonthlyUsage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                <select
                  value={planTypeFilter}
                  onChange={(e) => setPlanTypeFilter(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Plan Types</option>
                  <option value="fixed">Fixed Rate</option>
                  <option value="variable">Variable Rate</option>
                  <option value="green">Green Energy</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="free-time">Free Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contract Length</label>
                <select
                  value={termFilter}
                  onChange={(e) => setTermFilter(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Any Length</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                  <option value="36">36 Months</option>
                </select>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg text-gray-600 mb-2">
                Showing {filteredPlans.length} plans matching your criteria
              </div>
              <div className="text-sm text-gray-500">
                Costs calculated for {monthlyUsage} kWh monthly usage
              </div>
            </div>
          </div>
        </div>

        {/* Plan Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredPlans.length} Plans Match Your Criteria
            </h2>
            <div className="text-sm text-gray-500">
              Select up to 4 plans to compare
            </div>
          </div>

          <div className="space-y-4">
            {filteredPlans.slice(0, 20).map((plan) => {
              const isSelected = selectedPlans.includes(plan.id);
              const monthlyCost = calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee);
              
              return (
                <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
                  {/* Selection Button */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => togglePlan(plan.id)}
                      disabled={!isSelected && selectedPlans.length >= 4}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-green-600 border-green-600 text-white'
                          : selectedPlans.length >= 4
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-600'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pr-12">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <img
                          src={plan.providerLogo}
                          alt={`${plan.providerName} logo`}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <div className="text-blue-600 font-medium">{plan.providerName}</div>
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            plan.type === 'fixed' ? 'bg-blue-100 text-blue-800' :
                            plan.type === 'variable' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {plan.type} rate
                          </span>
                          {plan.renewablePercent === 100 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center">
                              <Leaf className="h-3 w-3 mr-1" />
                              100% Green
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{plan.termLength} month term</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <span>${plan.fees.monthlyFee}/month fee</span>
                        </div>
                        <div className="flex items-center">
                          <Leaf className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{plan.renewablePercent}% renewable</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-gray-400 mr-2" />
                          <span>${plan.fees.cancellationFee} ETF</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span>{plan.providerRating} provider rating</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-2">Plan Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className="text-3xl font-bold text-green-600 mb-1">{plan.rate}¢</div>
                      <div className="text-sm text-gray-500 mb-3">per kWh</div>
                      
                      <div className="mb-4">
                        <div className="text-lg font-bold text-blue-600">${monthlyCost.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">monthly cost*</div>
                        <div className="text-sm text-gray-500">${(monthlyCost * 12).toFixed(0)}/year</div>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/plans/${plan.providerSlug}/${plan.id}`)}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Plan Details
                        </button>
                        <button
                          onClick={() => navigate(`/texas/houston/electricity-plans`)}
                          className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Get This Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Providers</h3>
            <p className="text-gray-600 text-sm mb-4">
              Compare electricity companies by specialization and service quality.
            </p>
            <button
              onClick={() => navigate('/compare/providers')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Compare Providers →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Rates</h3>
            <p className="text-gray-600 text-sm mb-4">
              Real-time rate comparison with detailed cost analysis and calculators.
            </p>
            <button
              onClick={() => navigate('/compare/rates')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Compare Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Plans</h3>
            <p className="text-gray-600 text-sm mb-4">
              Expert rankings of top plans by category and features.
            </p>
            <button
              onClick={() => navigate('/best')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              View Best Plans →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}