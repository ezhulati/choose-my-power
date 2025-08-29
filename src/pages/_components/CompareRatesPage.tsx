import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Icon } from '../../components/ui/Icon';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CompareRatesPageProps {
}

export function CompareRatesPage({}: CompareRatesPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [monthlyUsage, setMonthlyUsage] = useState('1000');
  const [selectedState, setSelectedState] = useState('texas');
  const [rateType, setRateType] = useState<'all' | 'fixed' | 'variable'>('all');
  const [contractLength, setContractLength] = useState<'all' | '12' | '24' | '36'>('all');
  const [sortBy, setSortBy] = useState<'rate' | 'total-cost' | 'savings'>('total-cost');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-rates`);
  };

  const stateData = mockStates.find(s => s.slug === selectedState);
  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(selectedState));
  
  // Get all plans with provider info
  const allPlans = stateProviders.flatMap(provider => 
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
    if (rateType !== 'all' && plan.type !== rateType) return false;
    if (contractLength !== 'all' && plan.termLength !== parseInt(contractLength)) return false;
    return true;
  });

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const calculateAnnualSavings = (currentRate: number, bestRate: number, usage: number) => {
    return ((currentRate - bestRate) * usage / 100) * 12;
  };

  // Sort plans based on selected criteria
  const sortedPlans = filteredPlans
    .map(plan => ({
      ...plan,
      monthlyCost: calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee),
      annualCost: calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee) * 12
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return a.rate - b.rate;
        case 'total-cost':
          return a.monthlyCost - b.monthlyCost;
        case 'savings':
          return a.annualCost - b.annualCost;
        default:
          return a.monthlyCost - b.monthlyCost;
      }
    });

  const lowestRate = Math.min(...filteredPlans.map(p => p.rate));
  const averageRate = filteredPlans.reduce((sum, p) => sum + p.rate, 0) / filteredPlans.length;
  const lowestMonthlyCost = Math.min(...sortedPlans.map(p => p.monthlyCost));
  const averageMonthlyCost = sortedPlans.reduce((sum, p) => sum + p.monthlyCost, 0) / sortedPlans.length;

  const rateInsights = [
    {
      icon: TrendingDown,
      title: 'Market Low',
      value: `${lowestRate.toFixed(1)}¢/kWh`,
      description: `Lowest rate available in ${stateData?.name}`,
      color: 'green'
    },
    {
      icon: BarChart,
      title: 'Market Average',
      value: `${averageRate.toFixed(1)}¢/kWh`,
      description: `Average across all ${filteredPlans.length} plans`,
      color: 'blue'
    },
    {
      icon: DollarSign,
      title: 'Lowest Monthly Bill',
      value: `$${lowestMonthlyCost.toFixed(2)}`,
      description: `For ${monthlyUsage} kWh usage`,
      color: 'purple'
    },
    {
      icon: Calculator,
      title: 'Potential Savings',
      value: `$${Math.round(calculateAnnualSavings(averageRate, lowestRate, parseInt(monthlyUsage)))}`,
      description: 'Annual savings vs average',
      color: 'orange'
    }
  ];

  const usageProfiles = [
    { value: '500', label: '500 kWh', description: 'Small apartment', avgBill: '$65' },
    { value: '1000', label: '1,000 kWh', description: 'Average home', avgBill: '$120' },
    { value: '1500', label: '1,500 kWh', description: 'Large home', avgBill: '$180' },
    { value: '2000', label: '2,000 kWh', description: 'Very large home', avgBill: '$240' }
  ];

  const rateFactors = [
    {
      icon: Activity,
      title: 'Market Conditions',
      description: 'Wholesale electricity prices, fuel costs, and supply/demand balance affect rates.',
      impact: 'Variable'
    },
    {
      icon: Calendar,
      title: 'Contract Terms',
      description: 'Longer contracts often offer better rates but less flexibility.',
      impact: 'Controllable'
    },
    {
      icon: Zap,
      title: 'Usage Patterns',
      description: 'Your monthly usage affects which rate structures offer the best value.',
      impact: 'Personal'
    },
    {
      icon: Shield,
      title: 'Plan Features',
      description: 'Green energy, bill credits, and special features can affect pricing.',
      impact: 'Choice-based'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Icon icon="calculator" size={40} className="text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Compare Electricity Rates - Real-Time Rate Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-4xl mx-auto">
              Compare current electricity rates with advanced calculators and cost analysis. 
              Find the lowest rates and calculate exact savings based on your usage patterns.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{lowestRate.toFixed(1)}¢</div>
                <div className="text-purple-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{filteredPlans.length}</div>
                <div className="text-purple-200 text-sm">Rate Options</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">${lowestMonthlyCost.toFixed(0)}</div>
                <div className="text-purple-200 text-sm">Lowest Bill</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Live</div>
                <div className="text-purple-200 text-sm">Rate Data</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code for exact rates"
                size="lg"
              />
              <p className="text-purple-200 text-sm mt-2">Get precise rates for your location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Rate Insights Dashboard */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Live Rate Analysis for {stateData?.name}
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {rateInsights.map((insight, index) => (
              <Card key={index} className="p-6 text-center">
                <CardContent className="p-0">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-${insight.color}-100 text-${insight.color}-600 rounded-lg mb-4`}>
                    <Icon icon={insight.title === 'Market Low' ? 'trending' : insight.title === 'Market Average' ? 'tabler:chart-bar' : insight.title === 'Lowest Monthly Bill' ? 'dollar' : 'calculator'} size={24} />
                  </div>
                  <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                  <div className="text-3xl font-bold mb-2">{insight.value}</div>
                  <CardDescription className="text-sm">{insight.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Rate Calculator */}
        <Card className="p-8 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-6">
              Interactive Rate Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calculator Controls */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStates.map(state => (
                        <SelectItem key={state.id} value={state.slug}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Monthly Usage Profile</label>
                  <div className="space-y-2">
                    {usageProfiles.map((profile) => (
                      <button
                        key={profile.value}
                        onClick={() => setMonthlyUsage(profile.value)}
                        className={`w-full p-3 text-left border rounded-lg transition-colors ${
                          monthlyUsage === profile.value
                            ? 'border-purple-600 bg-purple-50 text-purple-900'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{profile.label}</div>
                            <div className="text-sm text-gray-600">{profile.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">{profile.avgBill}</div>
                            <div className="text-xs text-gray-500">avg bill</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rate Type</label>
                    <Select value={rateType} onValueChange={(value) => setRateType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fixed">Fixed Only</SelectItem>
                        <SelectItem value="variable">Variable Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contract</label>
                    <Select value={contractLength} onValueChange={(value) => setContractLength(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Length</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                        <SelectItem value="36">36 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Comparison Table */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Live Rate Comparison
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="total-cost">Sort by Total Cost</option>
                  <option value="rate">Sort by Rate</option>
                  <option value="savings">Sort by Savings</option>
                </select>
              </div>

              <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Provider</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Rate</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Monthly Cost</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Annual Cost</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlans.slice(0, 15).map((plan, index) => {
                      const savings = calculateAnnualSavings(averageMonthlyCost, plan.monthlyCost, 12);
                      
                      return (
                        <tr key={plan.id} className={`border-b border-gray-100 hover:bg-gray-50 ${
                          index === 0 ? 'bg-green-50 border-green-200' : ''
                        }`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <img
                                src={plan.providerLogo}
                                alt={`${plan.providerName} logo`}
                                className="w-6 h-6 rounded object-cover mr-2"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{plan.providerName}</div>
                                <div className="text-xs text-gray-500">{plan.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-semibold">{plan.rate}¢/kWh</div>
                            <div className="text-xs text-gray-500">${plan.fees.monthlyFee}/mo fee</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={`font-bold ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              ${plan.monthlyCost.toFixed(2)}
                            </div>
                            {index === 0 && (
                              <div className="text-xs text-green-600 font-medium">LOWEST</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${plan.annualCost.toFixed(0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={`font-semibold ${savings > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {savings > 0 ? `$${Math.round(savings)}` : '-'}
                            </div>
                            {savings > 0 && (
                              <div className="text-xs text-green-600">vs avg</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                *Costs include electricity usage + monthly fees. Excludes taxes and utility delivery charges.
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Rate Factors Analysis */}
        <Card className="p-8 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-8">
              What Affects Electricity Rates?
            </CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {rateFactors.map((factor, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                  <factor.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{factor.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{factor.description}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  factor.impact === 'Variable' ? 'bg-orange-100 text-orange-800' :
                  factor.impact === 'Controllable' ? 'bg-texas-navy/10 text-texas-navy' :
                  factor.impact === 'Personal' ? 'bg-texas-gold-100 text-texas-navy' :
                  'bg-texas-cream-100 text-texas-navy'
                }`}>
                  {factor.impact}
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        {/* Rate Trends */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {stateData?.name} Rate Trends & Market Analysis
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Market Conditions</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <TrendingDown className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Competitive Market</div>
                    <div className="text-gray-600 text-sm">
                      {stateProviders.length} providers competing drives rates down
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <TrendingUp className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Rate Range</div>
                    <div className="text-gray-600 text-sm">
                      Rates vary from {lowestRate.toFixed(1)}¢ to {Math.max(...filteredPlans.map(p => p.rate)).toFixed(1)}¢ per kWh
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Activity className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Market Volatility</div>
                    <div className="text-gray-600 text-sm">
                      Fixed rates provide protection against market fluctuations
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Selection Tips</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-medium text-blue-900 mb-2">Compare Total Costs</div>
                  <div className="text-blue-800 text-sm">
                    Look beyond the rate per kWh. Include monthly fees and your actual usage.
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-medium text-green-900 mb-2">Consider Your Usage</div>
                  <div className="text-green-800 text-sm">
                    High usage customers benefit more from lower rates, low usage customers should watch fees.
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="font-medium text-purple-900 mb-2">Fixed vs Variable</div>
                  <div className="text-purple-800 text-sm">
                    Fixed rates for budget certainty, variable for potential market savings.
                  </div>
                </div>
              </div>
            </div>
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
              Compare electricity companies by service quality and specialization.
            </p>
            <button
              onClick={() => navigate('/compare/providers')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Compare Providers →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Plans</h3>
            <p className="text-gray-600 text-sm mb-4">
              Detailed plan comparison with features and contract terms.
            </p>
            <button
              onClick={() => navigate('/compare/plans')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Compare Plans →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Rates</h3>
            <p className="text-gray-600 text-sm mb-4">
              Expert rankings of providers with the best rates and value.
            </p>
            <button
              onClick={() => navigate('/best')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              View Best Rates →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}