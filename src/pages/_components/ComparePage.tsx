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
      title: 'Which Companies Actually Don\'t Suck?',
      subtitle: 'The Real Story on Each Company',
      description: 'See who\'s actually good at customer service, who has the fewest complaints, and who\'s just marketing hype.',
      icon: Users,
      color: 'blue',
      features: [
        'Who actually answers the phone',
        'Real customer horror stories (and wins)',
        'Where they actually serve',
        'How they handle problems',
        'Will they survive or go bust',
        'Do they really do green or just say it'
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
      title: 'Find Plans That Won\'t Screw You',
      subtitle: 'Decode the Fine Print BS',
      description: 'We read all the fine print so you don\'t have to. See what each plan REALLY costs, not just the teaser rate.',
      icon: Zap,
      color: 'green',
      features: [
        'Fixed vs variable (which won\'t bite you)',
        'Contract traps to avoid',
        'Free nights (is it worth it?)',
        'Those annoying monthly fees',
        'Real green vs greenwashing',
        'What you\'ll pay with YOUR usage'
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
      title: 'What Am I Actually Going to Pay?',
      subtitle: 'Your Real Monthly Bill',
      description: 'Forget the advertised rate. We calculate what you\'ll actually pay each month with YOUR usage.',
      icon: Calculator,
      color: 'purple',
      features: [
        'What you\'ll really pay per kWh',
        'Your actual monthly cost',
        'When rates go up (they always do)',
        'How much you\'re overpaying now',
        'Which rates actually stay fixed',
        'Why your bill keeps going up'
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
      title: 'Stop Overpaying',
      description: 'Most Texans overpay by $35-50 per month. That's your car insurance payment right there.',
      stat: '$420/year back in your pocket'
    },
    {
      icon: Shield,
      title: 'Dodge the Traps',
      description: 'That 9.9¢ rate? It jumps to 15¢ if you use 999 kWh instead of 1000. We catch this BS for you.',
      stat: 'No more gotchas'
    },
    {
      icon: Star,
      title: 'Get Actual Service',
      description: 'Some companies never answer the phone. Others fix problems same-day. Know the difference.',
      stat: 'Real humans who help'
    },
    {
      icon: Target,
      title: 'Find Your Fit',
      description: 'Want real green energy? Hate contracts? Need to escape fast? We match you right.',
      stat: 'Exactly what you need'
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
              Tired of Confusing Electricity Comparisons? We Get It.
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              PowerToChoose makes it confusing on purpose. We don't play games. 
              Here's the truth about Texas electricity - organized so you can actually understand it and stop overpaying.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">$420</div>
                <div className="text-blue-200 text-sm">Your neighbor saves</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">10 min</div>
                <div className="text-blue-200 text-sm">To find savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Zero</div>
                <div className="text-blue-200 text-sm">Sales BS</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-blue-200 text-sm">Honest Truth</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code to start comparing"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">See what you're actually paying vs. what you could pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Compare Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Neighbor Pays Less. Here's Why.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              They didn't fall for the marketing tricks. They know what to look for. Now you will too.
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
              Stop Guessing. Start Knowing.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We built three simple tools that actually show you the truth. No marketing tricks, no hidden fees in the fine print.
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
                    {type.id === 'providers' ? 'Show Me Who\'s Good' : type.id === 'plans' ? 'Find My Best Plan' : 'Calculate My Real Bill'}
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
            Which Tool Do You Need? (10-Second Guide)
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
            Here's How We Cut Through the BS
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">We Do the Digging</h3>
              <p className="text-gray-600 text-sm">
                We check everything daily - rates, fees, fine print. The stuff they hope you won't notice.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <ThumbsUp className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Real People's Stories</h3>
              <p className="text-gray-600 text-sm">
                We listen to actual customers - who got screwed, who's happy, and why.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">The Real Math</h3>
              <p className="text-gray-600 text-sm">
                We add up EVERYTHING - not just the rate. All the fees, charges, and gotchas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-lg mb-6">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Honest Take</h3>
              <p className="text-gray-600 text-sm">
                We've been through this maze ourselves. We know the tricks and we call them out.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Decision Guide */}
        <div className="bg-texas-cream-200 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Where Should You Start? (Real Talk)
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-navy text-white rounded-lg mb-4 mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Care About Service?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Start here if you're sick of companies that never answer the phone.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Know What You Need?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Start here if you want green energy, no contracts, or other specific stuff.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Just Want Cheap?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Start here if you just want the lowest bill. Period. We get it.
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