import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Zap, Calendar, Leaf, DollarSign, Shield, TrendingDown, Users, Calculator, Star, MapPin, ArrowRight, CheckCircle, Filter, BarChart, Target, Award, Home } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ElectricityPlansPageProps {
}

export function ElectricityPlansPage({}: ElectricityPlansPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fixed' | 'variable' | 'green' | 'prepaid' | 'free-nights'>('all');
  const [selectedState, setSelectedState] = useState('texas');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-plans`);
  };

  const planCategories = [
    {
      id: 'fixed',
      title: 'Fixed Rate Plans',
      description: 'Stable rates that never change during your contract',
      icon: Shield,
      color: 'blue',
      count: 150,
      avgRate: '10.2¢',
      benefits: ['Predictable bills', 'Budget-friendly', 'Rate protection', 'No surprise increases'],
      bestFor: ['Budget planners', 'Risk-averse consumers', 'Families', 'First-time switchers'],
      contractLengths: ['6 months', '12 months', '24 months', '36 months'],
      rateRange: '9.7¢ - 15.8¢'
    },
    {
      id: 'variable',
      title: 'Variable Rate Plans', 
      description: 'Rates that can change monthly with market conditions',
      icon: TrendingDown,
      color: 'orange',
      count: 85,
      avgRate: '9.8¢',
      benefits: ['Lower starting rates', 'Market flexibility', 'No long-term commitment', 'Potential savings'],
      bestFor: ['Market watchers', 'Short-term residents', 'Rate switchers', 'Market optimizers'],
      contractLengths: ['Month-to-month', '3 months', '6 months'],
      rateRange: '9.1¢ - 12.9¢'
    },
    {
      id: 'green',
      title: 'Green Energy Plans',
      description: '100% renewable energy from wind and solar',
      icon: Leaf,
      color: 'green',
      count: 95,
      avgRate: '11.1¢',
      benefits: ['100% renewable', 'Environmental impact', 'Wind & solar power', 'Carbon neutral'],
      bestFor: ['Eco-conscious consumers', 'Sustainability advocates', 'Environmental leaders', 'Green businesses'],
      contractLengths: ['12 months', '24 months', '36 months'],
      rateRange: '9.8¢ - 17.5¢'
    },
    {
      id: 'prepaid',
      title: 'Prepaid Plans',
      description: 'Pay for electricity before you use it',
      icon: DollarSign,
      color: 'purple',
      count: 45,
      avgRate: '12.8¢',
      benefits: ['No credit check', 'No deposit', 'Usage control', 'No monthly bills'],
      bestFor: ['Credit challenged', 'Renters', 'Students', 'Budget controllers'],
      contractLengths: ['No contract', '6 months', '12 months'],
      rateRange: '11.5¢ - 19.2¢'
    },
    {
      id: 'free-nights',
      title: 'Free Nights & Weekends',
      description: 'Free electricity during specific hours',
      icon: Calendar,
      color: 'indigo',
      count: 35,
      avgRate: '14.5¢',
      benefits: ['Free evening hours', 'Weekend savings', 'High usage homes', 'Time-based savings'],
      bestFor: ['High usage homes', 'Night workers', 'Large families', 'Pool owners'],
      contractLengths: ['12 months', '24 months'],
      rateRange: '11.8¢ - 22.6¢'
    }
  ];

  const stateHubs = [
    {
      state: 'Texas',
      slug: 'texas',
      cities: ['Houston', 'Dallas', 'Austin', 'Fort Worth'],
      providers: 15,
      plans: 180,
      avgRate: '11.2¢',
      marketType: 'Deregulated',
      specialties: ['Green Energy', 'Free Nights', 'No Deposit', 'Smart Home']
    },
    {
      state: 'Pennsylvania', 
      slug: 'pennsylvania',
      cities: ['Philadelphia', 'Pittsburgh', 'Allentown'],
      providers: 8,
      plans: 95,
      avgRate: '13.4¢',
      marketType: 'Deregulated',
      specialties: ['Fixed Rate', 'Green Energy', 'Business Plans', 'Home Protection']
    }
  ];

  const planSelectionGuide = [
    {
      step: 1,
      title: 'Assess Your Usage Pattern',
      icon: BarChart,
      description: 'Review your last 12 months of electricity bills to understand your average monthly usage.',
      tips: [
        'Look for seasonal variations in usage',
        'Identify your highest and lowest usage months',
        'Calculate your average kWh per month',
        'Consider future changes (new appliances, electric car)'
      ],
      tools: ['Usage calculator', 'Bill analyzer', 'Seasonal planner']
    },
    {
      step: 2,
      title: 'Define Your Priorities',
      icon: Target,
      description: 'Determine what matters most: lowest cost, green energy, budget predictability, or special features.',
      tips: [
        'Rank importance: price vs features vs service',
        'Consider environmental values and goals',
        'Evaluate budget flexibility and risk tolerance',
        'Think about contract commitment preferences'
      ],
      tools: ['Priority assessor', 'Value calculator', 'Risk analyzer']
    },
    {
      step: 3,
      title: 'Compare Total Costs',
      icon: Calculator,
      description: 'Calculate real monthly costs including rates, fees, and your actual usage patterns.',
      tips: [
        'Include all fees in cost calculations',
        'Factor in promotional vs ongoing rates',
        'Consider early termination fees',
        'Account for seasonal usage variations'
      ],
      tools: ['Cost calculator', 'Fee analyzer', 'Savings projector']
    },
    {
      step: 4,
      title: 'Read Contract Terms',
      icon: CheckCircle,
      description: 'Carefully review contract length, renewal terms, and cancellation policies.',
      tips: [
        'Understand auto-renewal policies',
        'Know your cancellation rights and fees',
        'Check rate change notifications',
        'Review dispute resolution procedures'
      ],
      tools: ['Contract analyzer', 'Terms decoder', 'Rights checker']
    }
  ];

  const planComparison = [
    {
      category: 'Rate Stability',
      fixed: 'Fixed rate for entire term',
      variable: 'Rates change with market conditions',
      green: 'Usually fixed but may include premium',
      prepaid: 'Typically fixed daily/weekly rates',
      freeTime: 'Fixed rate + free periods'
    },
    {
      category: 'Budget Predictability', 
      fixed: 'Highly predictable monthly bills',
      variable: 'Unpredictable - can increase',
      green: 'Predictable if fixed rate structure',
      prepaid: 'Total control - pay what you use',
      freeTime: 'Predictable with usage shifting'
    },
    {
      category: 'Contract Commitment',
      fixed: '6-36 month contracts typical',
      variable: 'Month-to-month available',
      green: '12-24 month contracts common',
      prepaid: 'No contract or short terms',
      freeTime: '12-24 month contracts'
    },
    {
      category: 'Best For Savings',
      fixed: 'Long-term rate protection',
      variable: 'Market timing opportunities',
      green: 'Environmental value + savings',
      prepaid: 'Usage awareness and control',
      freeTime: 'High usage during free periods'
    }
  ];

  const currentPlans = selectedCategory === 'all' 
    ? planCategories 
    : planCategories.filter(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Zap className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Electricity Plans - Complete Guide & Analysis Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Master guide to electricity plan types, selection strategy, and decision-making. 
              Compare Texas electricity plans across 5 categories with expert analysis and selection tools.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">180+</div>
                <div className="text-blue-200 text-sm">Total Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-blue-200 text-sm">Plan Types</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-200 text-sm">Expert Guides</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-blue-200 text-sm">Plan Tools</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized plan recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Plan Types Mastery Hub */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Master Every Type of Electricity Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deep-dive analysis of each plan type with selection strategy, pros/cons, and expert recommendations
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Plan Types
            </button>
            {planCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-texas-navy text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPlans.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border p-8 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${category.color}-100 text-${category.color}-600 rounded-lg mb-6`}>
                  <category.icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-gray-600 mb-6">{category.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">{category.count}</div>
                    <div className="text-sm text-gray-600">Available Plans</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{category.avgRate}</div>
                    <div className="text-sm text-gray-600">Avg Rate</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Key Benefits:</h4>
                  <ul className="space-y-2">
                    {category.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Best For:</h4>
                  <ul className="space-y-1">
                    {category.bestFor.map((user, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Target className="h-3 w-3 text-texas-navy mr-2 flex-shrink-0" />
                        {user}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Rate Range:</h4>
                  <div className="text-sm text-gray-600 mb-2">{category.rateRange}</div>
                  <h4 className="font-medium text-gray-900 mb-2">Contract Options:</h4>
                  <div className="text-sm text-gray-600">{category.contractLengths.join(', ')}</div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/plans/${category.id}`)}
                    className="w-full bg-texas-navy text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    Master {category.title}
                  </button>
                  <button
                    onClick={() => navigate(`/compare/plans?type=${category.id}`)}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Compare {category.title}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Selection Strategy Guide */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Expert Plan Selection Strategy
          </h2>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {planSelectionGuide.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                  {step.step}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-600 rounded-lg mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 mb-6">{step.description}</p>
                
                <div className="text-left mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Expert Tips:</h4>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Available Tools:</h4>
                  <div className="space-y-1">
                    {step.tools.map((tool, index) => (
                      <div key={index} className="text-sm text-texas-navy">{tool}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Comparison Matrix */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Plan Type Comparison Matrix
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">Comparison Factor</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-900">Fixed Rate</th>
                  <th className="text-center py-4 px-4 font-semibold text-orange-900">Variable Rate</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-900">Green Energy</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-900">Prepaid</th>
                  <th className="text-center py-4 px-4 font-semibold text-indigo-900">Free Time</th>
                </tr>
              </thead>
              <tbody>
                {planComparison.map((row) => (
                  <tr key={row.category} className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium text-gray-900">{row.category}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{row.fixed}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{row.variable}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{row.green}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{row.prepaid}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{row.freeTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State & City Plan Hubs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Plans & Rates by Location
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {stateHubs.map((hub) => (
              <div key={hub.slug} className="bg-white rounded-lg shadow-sm border p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{hub.state} Plans & Analysis</h3>
                    <p className="text-gray-600">{hub.marketType} market with complete plan options</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{hub.avgRate}</div>
                    <div className="text-sm text-gray-500">avg rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-texas-navy">{hub.providers}</div>
                    <div className="text-sm text-gray-600">Providers</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{hub.plans}</div>
                    <div className="text-sm text-gray-600">Plans</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{hub.cities.length}</div>
                    <div className="text-sm text-gray-600">Major Cities</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Plan Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {hub.specialties.map((specialty) => (
                      <span key={specialty} className="px-2 py-1 bg-texas-navy/10 text-texas-navy text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Major Cities:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {hub.cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => navigate(`/${hub.slug}/${city.toLowerCase().replace(' ', '-')}/electricity-plans`)}
                        className="text-sm text-texas-navy hover:text-texas-navy text-left p-2 hover:bg-texas-cream-200 rounded"
                      >
                        {city} Plans →
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/${hub.slug}/electricity-plans`)}
                    className="bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    All {hub.state} Plans
                  </button>
                  <button
                    onClick={() => navigate(`/${hub.slug}/electricity-rates`)}
                    className="border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {hub.state} Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Electricity Companies</h3>
            <p className="text-gray-600 text-sm mb-4">Browse providers by specialization and expertise</p>
            <button
              onClick={() => navigate('/electricity-companies')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              View All Companies →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Rates</h3>
            <p className="text-gray-600 text-sm mb-4">Real-time rate comparison and cost analysis</p>
            <button
              onClick={() => navigate('/compare/rates')}
              className="text-texas-navy hover:text-texas-navy font-medium text-sm"
            >
              Compare Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Find by Location</h3>
            <p className="text-gray-600 text-sm mb-4">State and city-specific plan availability</p>
            <button
              onClick={() => navigate('/locations')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Browse Locations →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Plans</h3>
            <p className="text-gray-600 text-sm mb-4">Expert rankings and top picks by category</p>
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