import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  MapPin, TrendingDown, Users, Zap, Building, ArrowRight, Star, 
  Calculator, Leaf, Shield, Award, Clock, DollarSign, Filter,
  Phone, Globe, CheckCircle, AlertCircle, Target, Home, Heart,
  Battery, Eye, ThumbsUp, BarChart, Activity, Calendar
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TexasElectricityPageProps {
}

export function TexasElectricityPage({}: TexasElectricityPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'providers' | 'plans' | 'rates' | 'cities'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price'>('popularity');

  const texasData = mockStates.find(s => s.slug === 'texas')!;
  const texasProviders = mockProviders.filter(p => p.serviceStates.includes('texas'));

  const handleZipSearch = (zipCode: string) => {
    const city = texasData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      navigate(`/texas/${city.slug}/electricity-providers`);
    } else {
      navigate('/texas/houston/electricity-providers');
    }
  };

  const contentCategories = [
    {
      id: 'providers',
      title: 'Texas Electricity Companies',
      subtitle: `${texasProviders.length} Licensed Providers`,
      description: 'Complete directory of electricity companies serving Texas',
      icon: Building,
      color: 'blue',
      count: texasProviders.length,
      links: [
        { name: 'All Texas Providers', href: '/texas/electricity-providers' },
        { name: 'Best Rated Companies', href: '/texas/best-electricity-companies' },
        { name: 'Green Energy Leaders', href: '/texas/green-energy-companies' },
        { name: 'Customer Service Champions', href: '/texas/customer-service-companies' }
      ]
    },
    {
      id: 'plans',
      title: 'Texas Electricity Plans',
      subtitle: '300+ Available Plans',
      description: 'Every plan type from fixed rates to green energy',
      icon: Zap,
      color: 'green',
      count: texasProviders.reduce((sum, p) => sum + p.plans.length, 0),
      links: [
        { name: 'All Texas Plans', href: '/texas/electricity-plans' },
        { name: 'Fixed Rate Plans', href: '/texas/fixed-rate-plans' },
        { name: 'Green Energy Plans', href: '/texas/green-energy-plans' },
        { name: 'Free Nights Plans', href: '/texas/free-nights-plans' }
      ]
    },
    {
      id: 'rates',
      title: 'Texas Electricity Rates',
      subtitle: `Starting at ${Math.min(...texasProviders.flatMap(p => p.plans.map(plan => plan.rate)))}¢/kWh`,
      description: 'Live rate data and cost comparison tools',
      icon: TrendingDown,
      color: 'purple',
      count: Math.min(...texasProviders.flatMap(p => p.plans.map(plan => plan.rate))),
      links: [
        { name: 'Current Texas Rates', href: '/texas/electricity-rates' },
        { name: 'Rate Calculator', href: '/texas/rate-calculator' },
        { name: 'Cheapest Rates', href: '/texas/cheapest-electricity' },
        { name: 'Rate Trends', href: '/texas/rate-trends' }
      ]
    },
    {
      id: 'cities',
      title: 'Texas Cities',
      subtitle: `${texasData.topCities.length} Major Cities`,
      description: 'City-specific providers, plans, and rates',
      icon: Home,
      color: 'red',
      count: texasData.topCities.length,
      links: [
        { name: 'Houston Electricity', href: '/texas/houston' },
        { name: 'Dallas Electricity', href: '/texas/dallas' },
        { name: 'Austin Electricity', href: '/texas/austin' },
        { name: 'All Texas Cities', href: '/texas/cities' }
      ]
    }
  ];

  const texasGuides = [
    {
      title: 'Complete Guide to Texas Electricity',
      description: 'Everything you need to know about choosing electricity in Texas',
      href: '/guides/texas-electricity-complete-guide',
      readTime: '15 min read',
      topics: ['Deregulation', 'Provider Selection', 'Plan Types', 'Switching Process']
    },
    {
      title: 'Moving to Texas Electricity Guide',
      description: 'Step-by-step guide for new Texas residents',
      href: '/guides/moving-to-texas-electricity',
      readTime: '10 min read',
      topics: ['New Service Setup', 'Provider Research', 'First Bill', 'Account Management']
    },
    {
      title: 'How to Switch Electricity in Texas',
      description: 'The complete switching process explained',
      href: '/guides/texas-electricity-switching',
      readTime: '8 min read',
      topics: ['When to Switch', 'Comparison Process', 'Contract Terms', 'Switch Timeline']
    },
    {
      title: 'Understanding Texas Electricity Bills',
      description: 'Decode your Texas electricity bill and charges',
      href: '/guides/texas-electricity-bill-explained',
      readTime: '6 min read',
      topics: ['Rate Charges', 'TDU Fees', 'Taxes', 'Bill Credits']
    }
  ];

  const texasTools = [
    {
      title: 'Texas Rate Calculator',
      description: 'Calculate exact costs for your Texas usage',
      href: '/texas/rate-calculator',
      icon: Calculator,
      features: ['Real Usage Data', 'All Provider Rates', 'Savings Analysis', 'Plan Comparison']
    },
    {
      title: 'Texas Provider Finder',
      description: 'Find providers serving your exact address',
      href: '/texas/provider-finder',
      icon: MapPin,
      features: ['ZIP Code Search', 'Service Area Maps', 'Local Rates', 'Instant Results']
    },
    {
      title: 'Texas Switching Assistant',
      description: 'Step-by-step switching guidance',
      href: '/texas/switching-assistant',
      icon: ArrowRight,
      features: ['Contract Analysis', 'Best Time to Switch', 'Process Timeline', 'Pitfall Avoidance']
    },
    {
      title: 'Texas Bill Analyzer',
      description: 'Analyze your current Texas electricity bill',
      href: '/texas/bill-analyzer',
      icon: BarChart,
      features: ['Bill Upload', 'Cost Breakdown', 'Savings Opportunities', 'Provider Alternatives']
    }
  ];

  const marketInsights = [
    {
      icon: Activity,
      title: 'Deregulated Since 2002',
      description: 'Texas has the largest deregulated electricity market in the US',
      stat: '23 Years'
    },
    {
      icon: Users,
      title: 'Customer Choice',
      description: '85% of Texas residents can choose their electricity provider',
      stat: '29M People'
    },
    {
      icon: Building,
      title: 'Competitive Market',
      description: 'Over 100 retail electric providers compete for customers',
      stat: '100+ REPs'
    },
    {
      icon: Zap,
      title: 'Grid Reliability',
      description: 'ERCOT manages the Texas electric grid independently',
      stat: '90%+ Uptime'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Star className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Texas Electricity - Complete Hub & Resource Center
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-red-100 max-w-4xl mx-auto leading-relaxed">
              Your complete resource for Texas electricity. Compare {texasProviders.length} providers, 
              {texasProviders.reduce((sum, p) => sum + p.plans.length, 0)}+ plans, and rates across {texasData.topCities.length} major Texas cities. 
              Expert analysis, tools, and guides for every Texas electricity decision.
            </p>

            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{texasProviders.length}</div>
                <div className="text-red-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{texasData.topCities.length}</div>
                <div className="text-red-200 text-sm">Major Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{Math.min(...texasProviders.flatMap(p => p.plans.map(plan => plan.rate)))}¢</div>
                <div className="text-red-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">2002</div>
                <div className="text-red-200 text-sm">Deregulated</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-red-200 text-sm mt-2">Find providers and rates for your exact address</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Content Categories */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Texas Electricity Resource Hub
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to make informed electricity decisions in Texas
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 mb-12">
            {contentCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border p-8 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${category.color}-100 text-${category.color}-600 rounded-lg mb-6`}>
                  <category.icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-lg text-gray-600 font-medium mb-3">{category.subtitle}</p>
                <p className="text-gray-600 mb-6">{category.description}</p>
                
                <div className="space-y-3 mb-6">
                  {category.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(link.href)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{link.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate(category.links[0].href)}
                  className={`w-full bg-${category.color}-600 text-white py-3 rounded-lg hover:bg-${category.color}-700 transition-colors font-medium`}
                >
                  Explore {category.title}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Texas Electricity Market Insights
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {marketInsights.map((insight, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-texas-red rounded-lg mb-6">
                  <insight.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-texas-red mb-2">{insight.stat}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{insight.title}</h3>
                <p className="text-gray-600 text-sm">{insight.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/texas/market-info')}
              className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
            >
              Learn About Texas Electricity Market
            </button>
          </div>
        </div>

        {/* Texas Cities Hub */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Texas Cities Electricity Information
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {texasData.topCities.slice(0, 12).map((city) => (
              <button
                key={city.id}
                onClick={() => navigate(`/texas/${city.slug}`)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{city.name}</h3>
                    <div className="text-sm text-gray-600">
                      {city.population.toLocaleString()} residents
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{city.averageRate}¢</div>
                    <div className="text-sm text-gray-500">avg rate</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  {city.topProviders.length} providers serving area
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-texas-navy font-medium text-sm">View City Hub</span>
                  <ArrowRight className="h-4 w-4 text-texas-navy" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/texas/cities')}
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              View All Texas Cities
            </button>
          </div>
        </div>

        {/* Texas Tools */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Texas Electricity Tools
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {texasTools.map((tool, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-6">
                  <tool.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{tool.title}</h3>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">Features:</div>
                  <div className="space-y-1">
                    {tool.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(tool.href)}
                  className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  Use Tool
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Texas Guides */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Texas Electricity Guides & Resources
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {texasGuides.map((guide, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{guide.title}</h3>
                    <p className="text-gray-600 mb-4">{guide.description}</p>
                  </div>
                  <div className="text-sm text-texas-navy font-medium ml-4">
                    {guide.readTime}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Topics Covered:</div>
                  <div className="flex flex-wrap gap-2">
                    {guide.topics.map((topic, tIndex) => (
                      <span key={tIndex} className="px-2 py-1 bg-texas-navy/10 text-texas-navy text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(guide.href)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Read Guide
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/texas/guides')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View All Texas Guides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}