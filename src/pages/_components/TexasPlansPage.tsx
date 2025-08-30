import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  Zap, Calendar, Leaf, DollarSign, Shield, TrendingDown, Clock,
  Battery, Star, Calculator, CheckCircle, ArrowRight, Filter,
  Award, Target, Eye, BarChart, Users, MapPin, Home
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TexasPlansPageProps {
}

export function TexasPlansPage({}: TexasPlansPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedPlanType, setSelectedPlanType] = useState<'all' | 'fixed' | 'variable' | 'green' | 'prepaid' | 'free-time'>('all');
  const [monthlyUsage, setMonthlyUsage] = useState('1000');

  const texasData = mockStates.find(s => s.slug === 'texas')!;
  const texasProviders = mockProviders.filter(p => p.serviceStates.includes('texas'));
  
  const allTexasPlans = texasProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  const handleZipSearch = (zipCode: string) => {
    const city = texasData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      navigate(`/texas/${city.slug}/electricity-plans`);
    } else {
      navigate('/texas/houston/electricity-plans');
    }
  };

  const planTypes = [
    {
      id: 'fixed',
      title: 'Fixed Rate Plans',
      subtitle: 'Rate Protection & Stability',
      description: 'Stable rates locked for your entire contract term',
      icon: Shield,
      color: 'blue',
      count: allTexasPlans.filter(p => p.type === 'fixed').length,
      avgRate: (allTexasPlans.filter(p => p.type === 'fixed').reduce((sum, p) => sum + p.rate, 0) / allTexasPlans.filter(p => p.type === 'fixed').length).toFixed(1),
      benefits: [
        'Predictable monthly bills',
        'Protection from rate increases', 
        'Budget-friendly planning',
        'Contract rate guarantee'
      ],
      bestFor: [
        'Budget-conscious consumers',
        'Those wanting bill predictability',
        'Long-term planning',
        'Rate protection seekers'
      ]
    },
    {
      id: 'variable',
      title: 'Variable Rate Plans',
      subtitle: 'Market Flexibility',
      description: 'Rates that adjust with market conditions',
      icon: TrendingDown,
      color: 'orange',
      count: allTexasPlans.filter(p => p.type === 'variable').length,
      avgRate: (allTexasPlans.filter(p => p.type === 'variable').reduce((sum, p) => sum + p.rate, 0) / allTexasPlans.filter(p => p.type === 'variable').length).toFixed(1),
      benefits: [
        'Potential for lower rates',
        'Market rate flexibility',
        'No long-term commitment',
        'Rate change opportunities'
      ],
      bestFor: [
        'Market-savvy consumers',
        'Short-term needs',
        'Those monitoring rates',
        'Flexible preferences'
      ]
    },
    {
      id: 'green',
      title: 'Green Energy Plans',
      subtitle: '100% Renewable Power',
      description: 'Plans powered by Texas wind and solar energy',
      icon: Leaf,
      color: 'green',
      count: allTexasPlans.filter(p => p.renewablePercent === 100).length,
      avgRate: (allTexasPlans.filter(p => p.renewablePercent === 100).reduce((sum, p) => sum + p.rate, 0) / allTexasPlans.filter(p => p.renewablePercent === 100).length).toFixed(1),
      benefits: [
        '100% renewable energy',
        'Environmental impact reduction',
        'Texas wind & solar power',
        'Green energy certificates'
      ],
      bestFor: [
        'Environmentally conscious consumers',
        'Sustainability advocates',
        'Carbon footprint reducers',
        'Green energy supporters'
      ]
    },
    {
      id: 'prepaid',
      title: 'Prepaid Plans',
      subtitle: 'Pay-As-You-Go',
      description: 'Pay for electricity before you use it',
      icon: DollarSign,
      color: 'purple',
      count: allTexasPlans.filter(p => p.name.toLowerCase().includes('prepaid')).length || 25,
      avgRate: '12.5',
      benefits: [
        'No credit check required',
        'No security deposit',
        'Usage control & monitoring',
        'Flexible payment options'
      ],
      bestFor: [
        'Credit-challenged customers',
        'Renters and students',
        'Usage monitoring needs',
        'Deposit-free service'
      ]
    },
    {
      id: 'free-time',
      title: 'Free Time Plans',
      subtitle: 'Free Nights & Weekends',
      description: 'Free electricity during specific hours',
      icon: Clock,
      color: 'indigo',
      count: allTexasPlans.filter(p => p.name.toLowerCase().includes('free')).length || 15,
      avgRate: '14.5',
      benefits: [
        'Free electricity periods',
        'High usage savings',
        'Time-shifting rewards',
        'Weekend benefits'
      ],
      bestFor: [
        'High electricity users',
        'Flexible usage patterns',
        'Night/weekend users',
        'Large families'
      ]
    }
  ];

  const featuredPlans = [
    {
      provider: 'APGE',
      plan: 'SimpleSaver 11',
      rate: '9.7¢',
      type: 'Fixed Rate',
      term: '11 months',
      features: ['Lowest Rate', '$100 Bill Credit', 'No Hidden Fees', 'Simple Terms'],
      highlight: 'LOWEST RATE'
    },
    {
      provider: 'Gexa Energy',
      plan: 'Eco Saver Plus 12',
      rate: '9.8¢',
      type: 'Green Energy',
      term: '12 months',
      features: ['100% Renewable', '$125 Bill Credit', '60 Day Guarantee', 'Green Certified'],
      highlight: 'BEST GREEN'
    },
    {
      provider: 'Rhythm Energy',
      plan: 'Rhythm Saver 12',
      rate: '10.1¢',
      type: 'Smart Features',
      term: '12 months',
      features: ['100% Renewable', 'Smart Alerts', 'Pick Due Date', 'Modern App'],
      highlight: 'BEST TECH'
    },
    {
      provider: 'Frontier Utilities',
      plan: 'Saver Plus 12',
      rate: '9.8¢',
      type: 'Bill Credits',
      term: '12 months',
      features: ['$125 Usage Credit', '60 Day Guarantee', 'Medium+ Homes', 'Value Focus'],
      highlight: 'BEST CREDITS'
    }
  ];

  const filteredPlans = selectedPlanType === 'all' 
    ? allTexasPlans 
    : selectedPlanType === 'green' 
    ? allTexasPlans.filter(p => p.renewablePercent === 100)
    : selectedPlanType === 'prepaid'
    ? allTexasPlans.filter(p => p.name.toLowerCase().includes('prepaid'))
    : selectedPlanType === 'free-time'
    ? allTexasPlans.filter(p => p.name.toLowerCase().includes('free'))
    : allTexasPlans.filter(p => p.type === selectedPlanType);

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const usageProfiles = [
    { value: '500', label: '500 kWh', description: 'Small apartment' },
    { value: '1000', label: '1,000 kWh', description: 'Average home' },
    { value: '1500', label: '1,500 kWh', description: 'Large home' },
    { value: '2000', label: '2,000 kWh', description: 'Very large home' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-green-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <nav className="text-sm text-white/80 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-white">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/texas')} className="hover:text-white">Texas</button>
            <span className="mx-2">/</span>
            <span>Electricity Plans</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Zap className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Texas Electricity Plans - Complete Guide & Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Complete analysis of {allTexasPlans.length} electricity plans from {texasProviders.length} providers. 
              Find fixed rate, green energy, prepaid, and specialty plans across all Texas markets.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{allTexasPlans.length}</div>
                <div className="text-blue-200 text-sm">Available Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-blue-200 text-sm">Plan Types</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{Math.min(...allTexasPlans.map(p => p.rate))}¢</div>
                <div className="text-blue-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{allTexasPlans.filter(p => p.renewablePercent === 100).length}</div>
                <div className="text-blue-200 text-sm">Green Plans</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Find plans available in your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Texas Electricity Plans
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredPlans.map((plan, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow relative">
                {/* Highlight Badge */}
                <div className="absolute -top-3 -left-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    plan.highlight === 'LOWEST RATE' ? 'bg-green-600' :
                    plan.highlight === 'BEST GREEN' ? 'bg-green-600' :
                    plan.highlight === 'BEST TECH' ? 'bg-texas-navy' :
                    'bg-purple-600'
                  }`}>
                    {plan.highlight}
                  </div>
                </div>

                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-2">{plan.rate}</div>
                  <div className="text-sm text-gray-500 mb-3">per kWh</div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.plan}</h3>
                  <div className="text-texas-navy font-medium">{plan.provider}</div>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <div className="font-medium">{plan.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Term:</span>
                      <div className="font-medium">{plan.term}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">Features:</div>
                  <div className="space-y-1">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/texas/houston/electricity-plans`)}
                  className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  Get This Plan
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Types Hub */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Texas Plan Types - Find Your Best Match
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each plan type serves different needs. Explore categories to find what works for your situation.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedPlanType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlanType === 'all'
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Plan Types
            </button>
            {planTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedPlanType(type.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPlanType === type.id
                    ? 'bg-texas-navy text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {type.title}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {planTypes.map((type) => (
              <div key={type.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${type.color}-100 text-${type.color}-600 rounded-lg mb-6`}>
                  <type.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-gray-900">{type.count}</div>
                    <div className="text-xs text-gray-600">plans</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-green-600">{type.avgRate}¢</div>
                    <div className="text-xs text-gray-600">avg rate</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Benefits:</div>
                  <div className="space-y-1">
                    {type.benefits.slice(0, 3).map((benefit, bIndex) => (
                      <div key={bIndex} className="flex items-center text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/texas/plans/${type.id}`)}
                  className={`w-full bg-${type.color}-600 text-white py-2 rounded-lg hover:bg-${type.color}-700 transition-colors text-sm font-medium`}
                >
                  View {type.title}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Calculator */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Texas Plan Cost Calculator
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
                Select your monthly usage to see plan costs:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {usageProfiles.map((profile) => (
                  <button
                    key={profile.value}
                    onClick={() => setMonthlyUsage(profile.value)}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      monthlyUsage === profile.value
                        ? 'border-texas-navy bg-texas-cream-200 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{profile.label}</div>
                    <div className="text-xs text-gray-600">{profile.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-lg text-gray-600">
                Showing costs for <strong>{monthlyUsage} kWh/month</strong> usage
              </div>
              <div className="text-sm text-gray-500">
                {filteredPlans.length} plans match your criteria
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3">Provider</th>
                    <th className="text-left py-3">Plan</th>
                    <th className="text-right py-3">Rate</th>
                    <th className="text-right py-3">Monthly Cost</th>
                    <th className="text-right py-3">Annual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.slice(0, 10).map((plan) => {
                    const monthlyCost = calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee);
                    const annualCost = monthlyCost * 12;
                    
                    return (
                      <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium text-texas-navy">{plan.providerName}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-xs text-gray-500">{plan.termLength} mo • {plan.type}</div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-semibold">{plan.rate}¢/kWh</div>
                          <div className="text-xs text-gray-500">${plan.fees.monthlyFee}/mo fee</div>
                        </td>
                        <td className="py-3 text-right font-bold text-green-600">
                          ${monthlyCost.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-bold">
                          ${annualCost.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Texas Companies</h3>
            <p className="text-gray-600 text-sm mb-4">Browse electricity companies by specialization</p>
            <button
              onClick={() => navigate('/texas/electricity-companies')}
              className="text-texas-navy hover:text-texas-navy font-medium text-sm"
            >
              View TX Companies →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Texas Rates</h3>
            <p className="text-gray-600 text-sm mb-4">Compare current rates and calculate costs</p>
            <button
              onClick={() => navigate('/texas/electricity-rates')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              View TX Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Texas Cities</h3>
            <p className="text-gray-600 text-sm mb-4">City-specific plans and provider information</p>
            <button
              onClick={() => navigate('/texas/cities')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Browse TX Cities →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Plans</h3>
            <p className="text-gray-600 text-sm mb-4">Expert rankings of top Texas plans</p>
            <button
              onClick={() => navigate('/texas/best-plans')}
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