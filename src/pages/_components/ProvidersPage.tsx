import React, { useState } from 'react';
import StandardZipInputReact from '../../components/StandardZipInputReact';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import EnhancedSectionReact from '../../components/ui/EnhancedSectionReact';
import EnhancedCardReact from '../../components/ui/EnhancedCardReact';
import AccentBoxReact from '../../components/ui/AccentBoxReact';
import { 
  Users, Star, TrendingDown, MapPin, Filter, Search, Building, Zap, 
  Award, Shield, Leaf, Clock, CheckCircle, Phone, Globe, ArrowRight,
  Calculator, Eye, Target, ThumbsUp, AlertCircle, Crown, Medal, Trophy,
  Headphones, DollarSign, Wifi, Heart, Battery
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

export function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'green' | 'service' | 'rewards' | 'tech' | 'local' | 'budget'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'popularity'>('rating');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };

  const handleZipSearch = (zipCode: string) => {
    // Enhanced ZIP routing
    if (zipCode.startsWith('77') || zipCode.startsWith('75') || zipCode.startsWith('78')) {
      navigate(`/texas/houston/electricity-providers`);
    } else if (zipCode.startsWith('19') || zipCode.startsWith('15')) {
      navigate(`/pennsylvania/philadelphia/electricity-providers`);
    } else {
      navigate(`/texas/houston/electricity-providers`);
    }
  };

  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : prev.length < 4 ? [...prev, providerId] : prev
    );
  };

  // Provider categories with expert recommendations
  const providerCategories = [
    {
      id: 'green',
      title: 'Actually Good for Green Energy',
      subtitle: 'Real 100% Renewable Power',
      icon: Leaf,
      color: 'green',
      description: 'These providers don\'t just claim to be green - they actually deliver 100% renewable energy from Texas wind and solar',
      providers: [
        {
          name: 'Rhythm Energy',
          highlight: 'Every plan is actually 100% renewable, plus they let you pick your due date',
          rating: 4.4,
          features: ['100% Wind/Solar', 'Pick Your Due Date', 'No Hidden Fees', 'Bill Alerts'],
          slug: 'rhythm-energy',
          id: 'rhythm-energy'
        },
        {
          name: 'Gexa Energy',
          highlight: 'Been doing 100% green energy since 2019, with some of the best green rates around',
          rating: 4.3,
          features: ['Eco Saver Plus', '$100+ Bill Credits', '60-Day Guarantee', 'Green Certified'],
          slug: 'gexa-energy',
          id: 'gexa-energy'
        },
        {
          name: 'Green Mountain Energy',
          highlight: 'The original green provider in Texas - they\'ve been at this the longest',
          rating: 4.2,
          features: ['Carbon-Free Power', 'Environmental Leadership', 'Pollution-Free Plans', 'Solar Programs'],
          slug: 'green-mountain-energy',
          id: 'green-mountain-energy'
        }
      ]
    },
    {
      id: 'service',
      title: 'Won\'t Leave You Hanging',
      subtitle: 'Customer Service That Works',
      icon: Headphones,
      color: 'blue',
      description: 'When you call these providers, you\'ll actually get help instead of runaround. Local call centers and real problem-solving',
      providers: [
        {
          name: 'APGE (American Powernet)',
          highlight: 'What you see is what you get - no surprise fees or confusing terms',
          rating: 4.1,
          features: ['Simple Plans', 'No Hidden Fees', 'Straightforward', 'Texas-Based'],
          slug: 'apge',
          id: 'apge'
        },
        {
          name: 'Reliant Energy',
          highlight: 'When you call, you talk to someone in Texas who can actually help',
          rating: 4.1,
          features: ['Houston-Based', 'Same-Day Service', 'Online Tools', 'Smart Home Bundles'],
          slug: 'reliant-energy',
          id: 'reliant-energy'
        },
        {
          name: 'Constellation Energy',
          highlight: 'Big company resources but they still answer the phone and solve problems',
          rating: 3.9,
          features: ['Home Protection Plans', 'HVAC Monitoring', 'Usage Bill Credits', 'Multi-State'],
          slug: 'constellation-energy',
          id: 'constellation-energy'
        }
      ]
    },
    {
      id: 'rewards',
      title: 'Credits You Can Actually Get',
      subtitle: 'Bill Credits That Aren\'t Gimmicks',
      icon: DollarSign,
      color: 'purple',
      description: 'These providers offer bill credits and rewards you can actually earn without jumping through impossible hoops',
      providers: [
        {
          name: 'Frontier Utilities',
          highlight: 'Great if you use a lot of electricity - the more you use, the more you save',
          rating: 4.2,
          features: ['$125 Usage Credit', '60 Day Guarantee', 'Medium to Large Homes', 'Fixed Monthly Bills'],
          slug: 'frontier-utilities',
          id: 'frontier-utilities'
        },
        {
          name: 'Gexa Energy',
          highlight: 'Eco Saver Plus offers up to $125 credit + green energy',
          rating: 4.3,
          features: ['Monthly Credits', 'Usage Thresholds', 'Green + Rewards', '100% Renewable'],
          slug: 'gexa-energy',
          id: 'gexa-energy'
        },
        {
          name: '4Change Energy',
          highlight: 'Straightforward rewards without tricks, plus they guarantee you\'ll be happy',
          rating: 3.9,
          features: ['$125 Bill Credit', '60 Day Guarantee', 'Simple Structure', 'Fixed Rates'],
          slug: '4change-energy',
          id: '4change-energy'
        }
      ]
    },
    {
      id: 'tech',
      title: 'For Tech That Actually Works',
      subtitle: 'Smart Home Integration Done Right',
      icon: Wifi,
      color: 'indigo',
      description: 'Smart home features that aren\'t just marketing buzz - real integration with devices you actually use',
      providers: [
        {
          name: 'Rhythm Energy',
          highlight: 'Actually useful smart features and an app that works like it should',
          rating: 4.4,
          features: ['Smart Alerts', 'Flexible Billing', 'Usage Analytics', 'Modern App'],
          slug: 'rhythm-energy',
          id: 'rhythm-energy'
        },
        {
          name: 'Reliant Energy',
          highlight: 'They bundle real smart home devices (Nest, Ring) that you actually want',
          rating: 4.1,
          features: ['Smart Device Bundles', 'Nest Integration', 'Energy Monitoring', 'Connected Home'],
          slug: 'reliant-energy',
          id: 'reliant-energy'
        },
        {
          name: 'Direct Energy',
          highlight: 'Smart plans + connected home solutions',
          rating: 3.7,
          features: ['Smart Plans', 'Energy Insights', 'Connected Devices', 'Price Stability'],
          slug: 'direct-energy',
          id: 'direct-energy'
        }
      ]
    },
    {
      id: 'local',
      title: 'Texas Companies That Care',
      subtitle: 'Local Support, Local Jobs',
      icon: Heart,
      color: 'red',
      description: 'Texas-owned companies with real Texas offices and people who understand our market and weather',
      providers: [
        {
          name: 'Reliant Energy',
          highlight: 'Houston headquarters with real Texas offices and local customer service',
          rating: 4.1,
          features: ['Houston Headquarters', 'Texas Offices', 'Local Jobs', 'Community Investment'],
          slug: 'reliant-energy',
          id: 'reliant-energy'
        },
        {
          name: '4Change Energy',
          highlight: 'Dallas company that supports local charities and knows Texas markets',
          rating: 3.9,
          features: ['Dallas-Based', 'Local Charities', 'Texas-Focused', 'Community Giving'],
          slug: '4change-energy',
          id: '4change-energy'
        },
        {
          name: 'APGE (American Powernet)',
          highlight: 'Texas provider that keeps things simple and honest - no confusing marketing',
          rating: 4.1,
          features: ['Texas Provider', 'Simple Plans', 'No Hidden Fees', 'Straightforward Service'],
          slug: 'apge',
          id: 'apge'
        }
      ]
    },
    {
      id: 'budget',
      title: 'Actually Cheap (No Hidden Fees)',
      subtitle: 'Low Rates You Can Trust',
      icon: TrendingDown,
      color: 'green',
      description: 'These providers keep rates low without sneaky fees that show up later on your bill',
      providers: [
        {
          name: 'APGE (American Powernet)',
          highlight: 'Their SimpleSaver plans start at 9.7¢/kWh with no monthly fees',
          rating: 4.1,
          features: ['9.7¢/kWh Rate', '$100 Bill Credit', 'No Monthly Fee', 'No Hidden Fees'],
          slug: 'apge',
          id: 'apge'
        },
        {
          name: 'Gexa Energy',
          highlight: '100% green energy at just 9.8¢/kWh - best rate for renewable power',
          rating: 4.3,
          features: ['9.8¢/kWh Rate', '100% Green', '$125 Usage Credit', 'No Monthly Fee'],
          slug: 'gexa-energy',
          id: 'gexa-energy'
        },
        {
          name: 'Discount Power',
          highlight: 'Good rates at 10.1¢/kWh plus bill credits you can actually get',
          rating: 3.8,
          features: ['10.1¢/kWh Rate', '$125 Bill Credit', '90 Day Guarantee', 'Small to Medium Homes'],
          slug: 'discount-power',
          id: 'discount-power'
        }
      ]
    }
  ];

  const filteredCategories = selectedCategory === 'all' 
    ? providerCategories 
    : providerCategories.filter(cat => cat.id === selectedCategory);

  // Get quality providers for general listing
  const filteredProviders = mockProviders.filter(provider => {
    if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        const aLowestRate = Math.min(...a.plans.map(p => p.rate));
        const bLowestRate = Math.min(...b.plans.map(p => p.rate));
        return aLowestRate - bLowestRate;
      case 'popularity':
        return b.reviewCount - a.reviewCount;
      default:
        return 0;
    }
  });

  const lowestRate = Math.min(...mockProviders.flatMap(p => p.plans.map(plan => plan.rate)));
  const avgRating = (mockProviders.reduce((sum, p) => sum + p.rating, 0) / mockProviders.length).toFixed(1);
  const totalPlans = mockProviders.reduce((sum, p) => sum + p.plans.length, 0);

  const benefits = [
    {
      icon: Shield,
      title: 'Real Categories That Matter',
      description: 'We group providers by what they\'re actually good at, not their marketing claims'
    },
    {
      icon: Eye,
      title: 'Based on Real Experiences',
      description: 'Our assessments come from thousands of actual customer experiences, not press releases'
    },
    {
      icon: ThumbsUp,
      title: 'No Fake Winners',
      description: 'We don\'t crown providers \'best overall\' when they\'re not - we show you who\'s actually good at what'
    },
    {
      icon: Target,
      title: 'Find Your Match',
      description: 'Skip the ones that are wrong for your situation and focus on providers that actually fit'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <Award className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Provider Rankings</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-12 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Who's Actually
                <span className="block text-texas-gold mt-2">Good at What?</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">Every provider has strengths.</span> 
                <span className="text-white font-semibold">Some hide their weaknesses.</span> 
                <span className="text-white/80">We'll tell you who's actually good at what you need.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg mb-16">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">Real customer reviews</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">6 honest categories</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">No marketing BS</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16 mt-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{mockProviders.length}</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{lowestRate}¢</div>
                <div className="text-blue-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">{avgRating}</div>
                <div className="text-blue-200 text-sm">Avg Rating</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold">6</div>
                <div className="text-blue-200 text-sm">Categories</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <StandardZipInputReact 
                onSearch={handleZipSearch} 
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized provider results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-4">
              Why We Sort Them This Way
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every provider has their strengths and weaknesses. We'll help you find the ones that are actually good at what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-texas-cream text-texas-navy rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-texas-navy mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EnhancedSectionReact 
        background="gray" 
        padding="lg"
        title="What Each Provider Is Actually Good At"
        subtitle="We've sorted them by what they do well, so you can focus on what matters to you"
        titleSize="md"
      >
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-texas-navy text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Categories
          </button>
          {providerCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category.title.replace('Best for ', '')}
            </button>
          ))}
        </div>

        {/* Provider Categories */}
        <div className="space-y-12 mb-16">
          {filteredCategories.map((category) => (
            <EnhancedCardReact 
              key={category.id} 
              variant="default"
              padding="lg"
              hoverEffect={false}
            >
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${category.color}-100 text-${category.color}-600 rounded-lg mb-4`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{category.title}</h2>
                <h3 className="text-base text-gray-600 mb-3">{category.subtitle}</h3>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">{category.description}</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {category.providers.map((provider, index) => (
                  <div key={provider.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
                    {/* Ranking Badge */}
                    <div className="absolute -top-3 -right-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{provider.name}</h4>
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{provider.rating}</span>
                        <span className="text-gray-500 text-sm ml-1">rating</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">{provider.highlight}</p>
                    </div>

                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Key Features:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {provider.features.map((feature, fIndex) => (
                          <div key={fIndex} className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/providers/${provider.slug}`)}
                        className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
                      >
                        See What We Think About {provider.name}
                      </button>
                      <button
                        onClick={() => navigate(`/texas/houston/electricity-providers`)}
                        className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Check Their Current Rates
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => navigate(`/compare/providers?category=${category.id}`)}
                  className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
                >
                  Compare All {category.title.replace('Actually Good for ', '').replace('Won\'t Leave You Hanging', 'Customer Service').replace('Credits You Can Actually Get', 'Bill Credit').replace('For Tech That Actually Works', 'Smart Home').replace('Texas Companies That Care', 'Local Texas').replace('Actually Cheap (No Hidden Fees)', 'Budget')} Options
                </button>
              </div>
            </EnhancedCardReact>
          ))}
        </div>

        {/* Provider Directory */}
        <EnhancedCardReact 
          variant="default"
          padding="lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Every Licensed Provider in Texas</h2>
              <p className="text-sm text-gray-600">All {mockProviders.length} licensed providers, with our honest take on each one</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="popularity">Most Reviews</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProviders.slice(0, 12).map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onViewDetails={() => navigate(`/providers/${provider.slug}`)}
                onCompare={() => toggleProviderSelection(provider.id)}
                showPlans
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/compare/providers')}
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
            >
              See All Provider Reviews
            </button>
          </div>
        </EnhancedCardReact>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Find Actually Cheap Rates</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The real lowest rates (without hidden fees that jack up your bill later).
            </p>
            <button
              onClick={() => navigate('/shop/cheapest-electricity')}
              className="text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Find Real Low Rates →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Compare What Actually Matters</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Real side-by-side comparison of what you actually care about.
            </p>
            <button
              onClick={() => navigate('/compare/providers')}
              className="text-texas-navy hover:text-texas-red font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Compare What Matters →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">Our Honest Rankings</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The providers that are actually worth considering, ranked by category.
            </p>
            <button
              onClick={() => navigate('/compare/providers/top-5')}
              className="text-purple-600 hover:text-purple-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              See Our Top Picks →
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-texas-navy mb-3">What's Available Near You</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              See which providers actually serve your area and what they're charging.
            </p>
            <button
              onClick={() => navigate('/locations')}
              className="text-orange-600 hover:text-orange-800 font-semibold group-hover:translate-x-2 transition-transform duration-200"
            >
              Check Your Area →
            </button>
          </div>
        </div>
      </EnhancedSectionReact>
    </div>
  );
}

export default ProvidersPage;