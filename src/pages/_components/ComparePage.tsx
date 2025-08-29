import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders } from '../../data/mockData';
import { 
  BarChart, Users, Calculator, Award, TrendingDown, Shield, Star, Zap, 
  ArrowRight, CheckCircle, Target, Eye, ThumbsUp, Filter, Building,
  Leaf, DollarSign, Calendar, Clock, Battery, Phone, Globe
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

export function ComparePage() {
  const [selectedComparison, setSelectedComparison] = useState<'providers' | 'plans' | 'rates' | null>(null);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-providers`);
  };

  const comparisonTypes = [
    {
      id: 'providers',
      title: 'Compare Electricity Companies',
      subtitle: 'Company-Level Analysis',
      description: 'Compare electricity companies by specialization, service quality, coverage areas, and customer satisfaction. Focus on the company behind the service.',
      icon: Users,
      color: 'blue',
      features: [
        'Company specializations (Green, Service, Value, Tech)',
        'Customer service quality and satisfaction ratings',
        'Service areas and geographic coverage',
        'Company background and expertise analysis',
        'Contact information and support channels',
        'Expert company rankings and categories'
      ],
      tools: [
        'Side-by-side company comparison',
        'Provider category filtering',
        'Service quality assessment',
        'Company selection interface'
      ],
      bestFor: [
        'Choosing a reliable electricity company',
        'Finding companies that excel in your priorities',
        'Understanding company specializations',
        'Evaluating service quality before signing up'
      ]
    },
    {
      id: 'plans',
      title: 'Compare Electricity Plans',
      subtitle: 'Specific Plan Analysis',
      description: 'Compare specific electricity plans by features, contract terms, rates, and benefits. Deep dive into plan details and costs.',
      icon: Zap,
      color: 'green',
      features: [
        'Plan types (Fixed, Variable, Green, Prepaid, Free Time)',
        'Contract terms and length options',
        'Plan features and special benefits',
        'Monthly fees and cancellation charges',
        'Renewable energy percentages',
        'Usage-based cost calculations'
      ],
      tools: [
        'Plan-by-plan comparison tables',
        'Cost calculator for your usage',
        'Plan feature analysis',
        'Contract terms breakdown'
      ],
      bestFor: [
        'Finding the right plan type for your needs',
        'Understanding contract terms and fees',
        'Calculating exact costs for your usage',
        'Comparing specific plan features and benefits'
      ]
    },
    {
      id: 'rates',
      title: 'Compare Electricity Rates',
      subtitle: 'Pure Pricing Analysis',
      description: 'Compare current electricity rates with live market data, cost calculations, and savings analysis. Focus purely on pricing and costs.',
      icon: Calculator,
      color: 'purple',
      features: [
        'Live rate data and market pricing',
        'Usage-based cost calculations',
        'Rate trends and market analysis',
        'Savings potential vs average rates',
        'Rate type comparison (Fixed vs Variable)',
        'Market insights and pricing factors'
      ],
      tools: [
        'Live rate comparison dashboard',
        'Interactive cost calculator',
        'Savings analysis tools',
        'Market trend analysis'
      ],
      bestFor: [
        'Finding the absolute lowest rates',
        'Calculating exact monthly costs',
        'Understanding market pricing trends',
        'Maximizing savings on electricity bills'
      ]
    }
  ];

  const whyCompare = [
    {
      icon: TrendingDown,
      title: 'Save Money',
      description: 'The difference between cheapest and most expensive options can be $500+ per year for average homes.',
      stat: '$500+ Annual Savings'
    },
    {
      icon: Shield,
      title: 'Avoid Hidden Fees',
      description: 'Some providers advertise low rates but charge high monthly fees. Compare total costs, not just rates.',
      stat: 'Total Cost Analysis'
    },
    {
      icon: Star,
      title: 'Better Service',
      description: 'Customer service quality varies dramatically. Choose companies with proven track records.',
      stat: '4.2★ Avg Rating'
    },
    {
      icon: Target,
      title: 'Perfect Match',
      description: 'Find options that match your specific needs: green energy, tech features, local support.',
      stat: '6 Specializations'
    }
  ];

  const quickStats = [
    { number: '50+', label: 'Licensed Companies', icon: Building },
    { number: '300+', label: 'Available Plans', icon: Zap },
    { number: '9.7¢', label: 'Lowest Rate', icon: TrendingDown },
    { number: 'Free', label: 'Comparison Tools', icon: Calculator }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <BarChart className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Compare Electricity Options & Make Smart Decisions
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Three powerful comparison tools to analyze companies, plans, and rates. 
              Expert analysis helps you find the perfect electricity option and save hundreds per year.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              {quickStats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-6 w-6 mr-2" />
                    <div className="text-3xl font-bold">{stat.number}</div>
                  </div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code to start comparing"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized comparison results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Compare Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Smart Comparison Matters
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              With 100+ choices in Texas, the right comparison saves you hundreds of dollars and ensures better service.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyCompare.map((reason, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                  <reason.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{reason.title}</h3>
                <p className="text-gray-600 mb-4">{reason.description}</p>
                <div className="font-bold text-texas-navy">{reason.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Comparison Tools */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Comparison Method
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three specialized comparison tools, each designed for different decision-making needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {comparisonTypes.map((type, index) => (
              <div 
                key={type.id} 
                className={`bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  selectedComparison === type.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                {/* Card Header */}
                <div className={`bg-${type.color}-50 border-b border-${type.color}-100 p-6`}>
                  <div className="flex items-center mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-${type.color}-100 text-${type.color}-600 rounded-lg mr-4`}>
                      <type.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{type.title}</h3>
                      <p className={`text-${type.color}-700 font-medium`}>{type.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600">{type.description}</p>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">What You Can Compare:</h4>
                    <ul className="space-y-2">
                      {type.features.slice(0, 4).map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Available Tools:</h4>
                    <div className="flex flex-wrap gap-2">
                      {type.tools.map((tool, tIndex) => (
                        <span key={tIndex} className={`px-2 py-1 bg-${type.color}-100 text-${type.color}-800 text-xs rounded-full`}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Best For:</h4>
                    <ul className="space-y-1">
                      {type.bestFor.slice(0, 3).map((use, uIndex) => (
                        <li key={uIndex} className="flex items-center text-sm text-gray-600">
                          <Target className="h-3 w-3 text-texas-navy mr-2 flex-shrink-0" />
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(`/compare/${type.id}`)}
                    className={`w-full bg-${type.color}-600 text-white py-3 rounded-lg hover:bg-${type.color}-700 transition-colors font-medium flex items-center justify-center`}
                  >
                    Start Comparing {type.id === 'providers' ? 'Companies' : type.id === 'plans' ? 'Plans' : 'Rates'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Matrix */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Comparison Tool Matrix
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">Comparison Aspect</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-900">Compare Providers</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-900">Compare Plans</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-900">Compare Rates</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-2 font-medium text-gray-900">Primary Focus</td>
                  <td className="py-4 px-4 text-center text-texas-navy">Company Quality & Specialization</td>
                  <td className="py-4 px-4 text-center text-green-700">Plan Features & Terms</td>
                  <td className="py-4 px-4 text-center text-purple-700">Pricing & Cost Analysis</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-2 font-medium text-gray-900">Best Decision Stage</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Choosing which company to trust</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Selecting specific plan features</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Finding lowest cost options</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-2 font-medium text-gray-900">Key Metrics</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Ratings, Service, Specialization</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Features, Terms, Benefits</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Rates, Fees, Total Costs</td>
                </tr>
                <tr>
                  <td className="py-4 px-2 font-medium text-gray-900">Comparison Depth</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Company-wide analysis</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Plan-specific details</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600">Rate & cost focus</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-6">
              Each tool serves a different purpose in your decision-making process. Use them together for comprehensive analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/compare/providers')}
                className="bg-texas-navy text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Start with Companies
              </button>
              <button
                onClick={() => navigate('/compare/plans')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Compare Plans
              </button>
              <button
                onClick={() => navigate('/compare/rates')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Analyze Rates
              </button>
            </div>
          </div>
        </div>

        {/* Expert Methodology */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Our Expert Comparison Methodology
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection</h3>
              <p className="text-gray-600 text-sm">
                We analyze rates, plans, and company data from all licensed providers daily to ensure accuracy.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <ThumbsUp className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h3>
              <p className="text-gray-600 text-sm">
                Real customer reviews and satisfaction scores inform our provider and plan recommendations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
              <p className="text-gray-600 text-sm">
                Total cost calculations include all fees and charges to show true monthly expenses.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-lg mb-6">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expert Review</h3>
              <p className="text-gray-600 text-sm">
                Industry experts evaluate service quality, plan features, and overall value regularly.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Decision Guide */}
        <div className="bg-texas-cream-200 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Decision Guide
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-navy text-white rounded-lg mb-4 mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Start Here: Companies</h3>
              <p className="text-gray-600 text-sm mb-4">
                If you want to choose a reliable company first, then look at their plans.
              </p>
              <button
                onClick={() => navigate('/compare/providers')}
                className="bg-texas-navy text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                Compare Companies
              </button>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-lg mb-4 mx-auto">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Know What You Want: Plans</h3>
              <p className="text-gray-600 text-sm mb-4">
                If you know you want green energy, fixed rates, or specific features.
              </p>
              <button
                onClick={() => navigate('/compare/plans')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Compare Plans
              </button>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-lg mb-4 mx-auto">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Want Cheapest: Rates</h3>
              <p className="text-gray-600 text-sm mb-4">
                If your main priority is finding the absolute lowest cost for your usage.
              </p>
              <button
                onClick={() => navigate('/compare/rates')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Compare Rates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}