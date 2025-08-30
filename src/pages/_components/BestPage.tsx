import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders } from '../../data/mockData';
import { 
  Award, Star, TrendingDown, Leaf, Shield, Users, DollarSign, 
  Calendar, Zap, Trophy, Crown, Medal, Target, CheckCircle,
  ArrowRight, Filter, Eye, ThumbsUp, Calculator, Home, BarChart,
  Building, Clock, Battery, Heart, Globe, Phone, Activity
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface BestPageProps {
}

export function BestPage({}: BestPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'companies' | 'plans' | 'rates' | 'features' | 'markets'>('companies');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/best`);
  };

  const bestCategories = {
    companies: [
      {
        id: 'green-energy-leader',
        title: 'Actually Green (Not Greenwashing)',
        description: 'Who\'s really 100% renewable vs. just marketing BS',
        icon: Leaf,
        color: 'green',
        winner: 'Rhythm Energy',
        winnerRating: 4.4,
        winnerScore: '95/100',
        analysis: 'Leads in renewable energy commitment with all plans 100% wind/solar powered',
        strengths: ['100% Renewable Portfolio', 'Smart Technology Integration', 'Flexible Billing Options', 'Environmental Leadership'],
        metrics: {
          'Green Energy %': '100%',
          'Customer Rating': '4.4★',
          'Green Plans': '12 plans',
          'Environmental Score': '95/100'
        }
      },
      {
        id: 'customer-service-champion', 
        title: 'They Actually Answer the Phone',
        description: 'Companies that fix problems instead of creating them',
        icon: Users,
        color: 'blue',
        winner: 'Champion Energy',
        winnerRating: 4.6,
        winnerScore: '98/100',
        analysis: 'Sets the standard for customer service with local Texas support and satisfaction guarantees',
        strengths: ['Local Call Centers', 'Same-Day Service', 'Highest Satisfaction', 'Transparent Communication'],
        metrics: {
          'Satisfaction Score': '4.6★',
          'Response Time': '< 2 min',
          'Resolution Rate': '94%',
          'Service Score': '98/100'
        }
      },
      {
        id: 'best-value-leader',
        title: 'Cheapest Without the Gotchas',
        description: 'Low rates that stay low, no surprise fees',
        icon: DollarSign,
        color: 'purple', 
        winner: 'APGE (American Powernet)',
        winnerRating: 4.1,
        winnerScore: '92/100',
        analysis: 'Delivers exceptional value with transparent pricing and no hidden fees',
        strengths: ['Lowest Rates Available', 'No Hidden Fees', 'Simple Plan Structure', 'Bill Credits'],
        metrics: {
          'Lowest Rate': '9.7¢/kWh',
          'Hidden Fees': '0',
          'Value Score': '92/100',
          'Customer Rating': '4.1★'
        }
      },
      {
        id: 'technology-innovator',
        title: 'Apps That Don\'t Suck',
        description: 'Working tech, not broken promises',
        icon: Battery,
        color: 'indigo',
        winner: 'Rhythm Energy',
        winnerRating: 4.4,
        winnerScore: '94/100',
        analysis: 'Leading smart electricity with new app features and home integration',
        strengths: ['Smart Home Features', 'Modern App Interface', 'Usage Analytics', 'Innovation Leadership'],
        metrics: {
          'App Rating': '4.7★',
          'Smart Features': '15+',
          'Innovation Score': '94/100',
          'Tech Adoption': '89%'
        }
      }
    ],
    plans: [
      {
        id: 'best-fixed-rate',
        title: 'Best Fixed Rate Plan',
        description: 'Optimal rate stability and value',
        icon: Shield,
        color: 'blue',
        winner: 'APGE SimpleSaver 11',
        winnerRate: '9.7¢/kWh',
        winnerScore: '96/100',
        analysis: 'Combines the lowest fixed rate with transparent terms and no hidden fees',
        strengths: ['Lowest Fixed Rate', 'No Hidden Fees', '$100 Bill Credit', 'Simple Terms'],
        metrics: {
          'Rate': '9.7¢/kWh',
          'Monthly Fee': '$0',
          'Contract': '11 months',
          'Value Score': '96/100'
        }
      },
      {
        id: 'best-green-plan',
        title: 'Best Green Energy Plan', 
        description: 'Top 100% renewable electricity plan',
        icon: Leaf,
        color: 'green',
        winner: 'Gexa Eco Saver Plus 12',
        winnerRate: '9.8¢/kWh',
        winnerScore: '94/100',
        analysis: 'Exceptional green energy value with competitive rates and usage credits',
        strengths: ['100% Renewable Energy', '$125 Usage Credit', 'Competitive Green Rate', '60-Day Guarantee'],
        metrics: {
          'Green Rate': '9.8¢/kWh',
          'Renewable %': '100%',
          'Bill Credit': '$125',
          'Green Score': '94/100'
        }
      },
      {
        id: 'best-free-time',
        title: 'Best Free Time Plan',
        description: 'Maximum savings during free periods',
        icon: Clock,
        color: 'purple',
        winner: 'TXU Free Nights & Weekends',
        winnerRate: '11.8¢/kWh',
        winnerScore: '89/100',
        analysis: 'Delivers significant savings for high-usage homes with strategic time shifting',
        strengths: ['Free 9PM-6AM', 'Free Weekends', 'High Usage Optimization', 'Flexible Usage'],
        metrics: {
          'Standard Rate': '11.8¢/kWh',
          'Free Hours': '84 hrs/week',
          'Savings Potential': '40%+',
          'Usage Score': '89/100'
        }
      },
      {
        id: 'best-smart-plan',
        title: 'Best Smart Home Plan',
        description: 'Technology integration and smart features',
        icon: Battery,
        color: 'indigo',
        winner: 'Rhythm Smart Saver',
        winnerRate: '10.1¢/kWh',
        winnerScore: '91/100',
        analysis: 'Leading smart home integration with renewable energy and flexible features',
        strengths: ['Smart Integration', '100% Renewable', 'Flexible Billing', 'Usage Analytics'],
        metrics: {
          'Smart Rate': '10.1¢/kWh',
          'Smart Features': '12+',
          'App Rating': '4.7★',
          'Tech Score': '91/100'
        }
      }
    ],
    rates: [
      {
        id: 'lowest-overall',
        title: 'Lowest Overall Rates',
        description: 'Absolute cheapest electricity rates',
        icon: TrendingDown,
        color: 'green',
        winner: '9.7¢/kWh',
        provider: 'APGE SimpleSaver 11',
        winnerScore: '100/100',
        analysis: 'Market-leading low rate with transparent pricing and no hidden fees',
        strengths: ['Market Low Rate', 'No Hidden Fees', 'Transparent Pricing', 'Bill Credits Available'],
        metrics: {
          'Rate': '9.7¢/kWh',
          'Monthly Fee': '$0',
          'Total Cost Rank': '#1',
          'Rate Score': '100/100'
        }
      },
      {
        id: 'best-green-rates',
        title: 'Best Green Energy Rates',
        description: 'Competitive pricing for 100% renewable',
        icon: Leaf,
        color: 'green',
        winner: '9.8¢/kWh',
        provider: 'Gexa Eco Saver Plus',
        winnerScore: '98/100',
        analysis: 'Proves green energy doesn\'t cost more with market-competitive renewable rates',
        strengths: ['Competitive Green Rate', '100% Renewable', 'Bill Credits', 'No Green Premium'],
        metrics: {
          'Green Rate': '9.8¢/kWh',
          'Renewable %': '100%',
          'Green Premium': '$0',
          'Green Value': '98/100'
        }
      },
      {
        id: 'best-value-rates',
        title: 'Best Value Rates',
        description: 'Optimal rate and feature combination',
        icon: DollarSign,
        color: 'purple',
        winner: '10.1¢/kWh',
        provider: 'Multiple Plans',
        winnerScore: '95/100',
        analysis: 'Sweet spot of competitive rates with valuable features and credits',
        strengths: ['Rate + Features Balance', 'Bill Credits Included', 'Contract Flexibility', 'Value Optimization'],
        metrics: {
          'Value Rate': '10.1¢/kWh',
          'Feature Count': '8+',
          'Credit Value': '$100+',
          'Value Score': '95/100'
        }
      }
    ],
    features: [
      {
        id: 'best-bill-credits',
        title: 'Best Bill Credit Programs',
        description: 'Maximum bill credits and rewards',
        icon: DollarSign,
        color: 'purple',
        winner: '$125 Usage Credits',
        provider: 'Frontier Utilities & Gexa Energy',
        winnerScore: '92/100',
        analysis: 'Highest bill credits available with usage-based qualification requirements',
        strengths: ['$125 Monthly Credits', 'Usage-Based Rewards', 'Multiple Qualifying Plans', 'Fixed Credits'],
        metrics: {
          'Max Credit': '$125/month',
          'Qualifying Plans': '6 plans',
          'Credit Type': 'Usage-based',
          'Reward Score': '92/100'
        }
      },
      {
        id: 'best-guarantees',
        title: 'Best Satisfaction Guarantees',
        description: 'Strongest customer protection policies',
        icon: Shield,
        color: 'blue',
        winner: '60-Day Guarantee',
        provider: 'TXU Energy & Multiple Providers',
        winnerScore: '90/100',
        analysis: 'Top satisfaction guarantees with money-back protection',
        strengths: ['60-Day Protection', 'Money-Back Guarantee', 'Risk-Free Trial', 'Customer Protection'],
        metrics: {
          'Guarantee Period': '60 days',
          'Protection Type': 'Full refund',
          'Qualifying Plans': '10+ plans',
          'Protection Score': '90/100'
        }
      },
      {
        id: 'best-smart-features',
        title: 'Best Smart Home Features',
        description: 'Advanced technology and integration',
        icon: Battery,
        color: 'indigo',
        winner: 'Smart Alerts & Controls',
        provider: 'Rhythm Energy & Reliant',
        winnerScore: '94/100',
        analysis: 'Complete smart home integration with usage analytics and device compatibility',
        strengths: ['Smart Device Integration', 'Usage Analytics', 'Automated Controls', 'Mobile App Excellence'],
        metrics: {
          'Smart Features': '15+',
          'Device Compatibility': '50+ devices',
          'App Rating': '4.7★',
          'Tech Score': '94/100'
        }
      }
    ],
    markets: [
      {
        id: 'best-deregulated-market',
        title: 'Best Deregulated Market',
        description: 'Most competitive and consumer-friendly',
        icon: Building,
        color: 'blue',
        winner: 'Texas (ERCOT)',
        winnerScore: '96/100',
        analysis: 'Leading deregulated market with most choice, competition, and innovation',
        strengths: ['100+ Provider Options', 'New Plan Types', 'Competitive Rates', 'Strong Consumer Protection'],
        metrics: {
          'Providers': '100+',
          'Market Age': '22 years',
          'Customer Choice': '85%',
          'Competition Score': '96/100'
        }
      },
      {
        id: 'best-city-market',
        title: 'Best City Market',
        description: 'Most provider options and competition',
        icon: Home,
        color: 'green',
        winner: 'Houston, Texas',
        winnerScore: '94/100',
        analysis: 'Energy capital with maximum provider choice and competitive innovation',
        strengths: ['15+ Provider Options', 'Energy Industry Hub', 'Competitive Rates', 'Local Support'],
        metrics: {
          'Local Providers': '15+',
          'Avg Rate': '11.8¢/kWh',
          'Population': '2.3M',
          'Market Score': '94/100'
        }
      },
      {
        id: 'best-green-market',
        title: 'Best Green Energy Market',
        description: 'Leading renewable energy options',
        icon: Leaf,
        color: 'green',
        winner: 'Texas Wind Corridor',
        winnerScore: '98/100',
        analysis: 'Global leader in wind energy with abundant renewable electricity options',
        strengths: ['#1 Wind Energy State', '100% Green Options', 'Renewable Innovation', 'Grid Integration'],
        metrics: {
          'Wind Capacity': '30+ GW',
          'Green Options': '50+ plans',
          'Renewable %': '25%+ grid',
          'Green Score': '98/100'
        }
      }
    ]
  };

  const currentCategories = bestCategories[selectedCategory];

  const categories = [
    { id: 'companies', name: 'Best Companies', icon: Users, description: 'Top-rated companies by specialization' },
    { id: 'plans', name: 'Best Plans', icon: Zap, description: 'Highest-rated plans by type' },
    { id: 'rates', name: 'Best Rates', icon: TrendingDown, description: 'Most competitive pricing' },
    { id: 'features', name: 'Best Features', icon: Star, description: 'Top plan features and benefits' },
    { id: 'markets', name: 'Best Markets', icon: Building, description: 'Leading electricity markets' }
  ];

  const expertMethodology = [
    {
      icon: BarChart,
      title: 'We Do the Math',
      description: 'Real rates, all fees included, actual customer counts - not marketing numbers.',
      factors: ['Rate competitiveness', 'Fee structures', 'Market penetration', 'Growth metrics']
    },
    {
      icon: Users,
      title: 'We Listen to You',
      description: 'Real reviews from real people - the good, bad, and ugly.',
      factors: ['Customer ratings', 'Review sentiment', 'Complaint ratios', 'Retention rates']
    },
    {
      icon: Eye,
      title: 'We Test Everything',
      description: 'We sign up, call support, read contracts - the stuff they hope you won\'t do.',
      factors: ['Industry expertise', 'Innovation tracking', 'Service assessment', 'Market analysis']
    },
    {
      icon: Activity,
      title: 'We Keep Checking',
      description: 'Monthly updates because companies change (usually for the worse).',
      factors: ['Performance trends', 'Market changes', 'Competitive position', 'Quality monitoring']
    }
  ];

  const winnerSpotlight = currentCategories[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Trophy className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Stop Guessing Who's Actually Good (We Did the Work)
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-4xl mx-auto">
              We tested them all. Called their support. Read the contracts. Tracked the complaints. 
              Here's who actually delivers vs. who's just good at marketing.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Real</div>
                <div className="text-orange-200 text-sm">Testing Done</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Zero</div>
                <div className="text-orange-200 text-sm">Paid Rankings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-orange-200 text-sm">Honest Truth</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Fresh</div>
                <div className="text-orange-200 text-sm">Monthly Checks</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-orange-200 text-sm mt-2">See who's actually best in YOUR area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Selector */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Winners (And Losers) in Each Category
            </h2>
            <p className="text-lg text-gray-600">
              We tested everything so you don't have to. Here's who won and who to avoid.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  selectedCategory === category.id
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  selectedCategory === category.id
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Winner Spotlight */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8 mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 text-white rounded-full mb-6">
              <Crown className="h-8 w-8" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🏆 Category Winner: {winnerSpotlight.winner}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{winnerSpotlight.winnerScore}</div>
                <div className="text-gray-600">Expert Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {winnerSpotlight.winnerRating ? `${winnerSpotlight.winnerRating}★` : 'Winner'}
                </div>
                <div className="text-gray-600">Rating/Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-texas-navy">{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</div>
                <div className="text-gray-600">Category</div>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
              {winnerSpotlight.analysis}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(`/providers/${winnerSpotlight.winner?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Show Me Why They Won
              </button>
              <button
                onClick={() => navigate(`/best/${winnerSpotlight.id}`)}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                See All Winners & Losers
              </button>
            </div>
          </div>
        </div>

        {/* Category Rankings */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {categories.find(c => c.id === selectedCategory)?.name} Rankings & Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentCategories.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative">
                {/* Award Badge */}
                {index === 0 && (
                  <div className="absolute -top-3 -right-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-white">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-${item.color}-100 text-${item.color}-600 rounded-lg mb-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {index === 0 ? '🏆 WINNER:' : `#${index + 1}:`}
                    </div>
                    <div className="font-bold text-gray-900 mb-2">
                      {item.winner}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(item.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-gray-500">{key}:</div>
                          <div className="font-medium">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Key Strengths:</div>
                    <div className="space-y-1">
                      {item.strengths.slice(0, 3).map((strength, sIndex) => (
                        <div key={sIndex} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/best/${item.id}`)}
                    className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    View Full Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expert Methodology */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How We Actually Test This Stuff
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {expertMethodology.map((method, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                  <method.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{method.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{method.description}</p>
                
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 mb-2">Analysis Factors:</div>
                  <ul className="space-y-1">
                    {method.factors.map((factor, fIndex) => (
                      <li key={fIndex} className="text-xs text-gray-600">• {factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Rankings updated monthly based on current market data, customer feedback, and expert analysis.
            </p>
            <div className="inline-flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-texas-navy" />
                <span>Updated Monthly</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1 text-green-600" />
                <span>Expert Reviewed</span>
              </div>
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1 text-purple-600" />
                <span>Customer Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Intelligence</h3>
            <p className="text-gray-600 text-sm mb-4">Deep analysis of electricity companies by specialization</p>
            <button
              onClick={() => navigate('/electricity-companies')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Company Analysis →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan Mastery</h3>
            <p className="text-gray-600 text-sm mb-4">Master guide to electricity plan types and selection</p>
            <button
              onClick={() => navigate('/electricity-plans')}
              className="text-texas-navy hover:text-texas-navy font-medium text-sm"
            >
              Master Plans →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <BarChart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Intelligence</h3>
            <p className="text-gray-600 text-sm mb-4">Compare providers, plans, and rates with expert tools</p>
            <button
              onClick={() => navigate('/compare')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Compare Options →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Intelligence</h3>
            <p className="text-gray-600 text-sm mb-4">Location-specific rankings and market analysis</p>
            <button
              onClick={() => navigate('/locations')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              Location Analysis →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}