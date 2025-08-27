import React, { useState } from 'react';
import { ZipCodeSearch } from '../components/ZipCodeSearch';
import { ProviderCard } from '../components/ProviderCard';
import { mockProviders, mockStates } from '../data/mockData';
import { 
  Users, Star, TrendingDown, MapPin, Filter, Search, Building, Zap, 
  Award, Shield, Leaf, Clock, CheckCircle, Phone, Globe, ArrowRight,
  Calculator, Eye, Target, ThumbsUp, AlertCircle, Crown, Medal, Trophy,
  Headphones, DollarSign, Wifi, Heart, Battery
} from 'lucide-react';

interface ProvidersPageProps {
  onNavigate: (path: string) => void;
}

export function ProvidersPage({ onNavigate }: ProvidersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'green' | 'service' | 'rewards' | 'tech' | 'local' | 'budget'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'popularity'>('rating');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const handleZipSearch = (zipCode: string) => {
    // Enhanced ZIP routing
    if (zipCode.startsWith('77') || zipCode.startsWith('75') || zipCode.startsWith('78')) {
      onNavigate(`/texas/houston/electricity-providers`);
    } else if (zipCode.startsWith('19') || zipCode.startsWith('15')) {
      onNavigate(`/pennsylvania/philadelphia/electricity-providers`);
    } else {
      onNavigate(`/texas/houston/electricity-providers`);
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
      title: 'Best for Green Energy',
      subtitle: '100% Renewable Power',
      icon: Leaf,
      color: 'green',
      description: 'Providers specializing in 100% renewable energy plans powered by wind and solar',
      providers: [
        {
          name: 'Rhythm Energy',
          highlight: 'All plans 100% renewable + flexible billing',
          rating: 4.4,
          features: ['100% Wind/Solar', 'Pick Your Due Date', 'No Hidden Fees', 'Bill Alerts'],
          slug: 'rhythm-energy',
          id: 'rhythm-energy'
        },
        {
          name: 'Gexa Energy',
          highlight: '100% green since 2019 + low-cost green plans',
          rating: 4.3,
          features: ['Eco Saver Plus', '$100+ Bill Credits', '60-Day Guarantee', 'Green Certified'],
          slug: 'gexa-energy',
          id: 'gexa-energy'
        },
        {
          name: 'Green Mountain Energy',
          highlight: 'Longest-running green provider in Texas',
          rating: 4.2,
          features: ['Carbon-Free Power', 'Environmental Leadership', 'Pollution-Free Plans', 'Solar Programs'],
          slug: 'green-mountain-energy',
          id: 'green-mountain-energy'
        }
      ]
    },
    {
      id: 'service',
      title: 'Best for Customer Service',
      subtitle: 'Top-Rated Support',
      icon: Headphones,
      color: 'blue',
      description: 'Providers with exceptional customer support, local call centers, and high satisfaction ratings',
      providers: [
        {
          name: 'APGE (American Powernet)',
          highlight: 'Highest-rated for transparency & no gimmicks',
          rating: 4.1,
          features: ['Simple Plans', 'No Hidden Fees', 'Straightforward', 'Texas-Based'],
          slug: 'apge',
          id: 'apge'
        },
        {
          name: 'Reliant Energy',
          highlight: 'Local TX call centers + helpful tools & support',
          rating: 4.1,
          features: ['Houston-Based', 'Same-Day Service', 'Online Tools', 'Smart Home Bundles'],
          slug: 'reliant-energy',
          id: 'reliant-energy'
        },
        {
          name: 'Constellation Energy',
          highlight: 'National provider with local support & home protection',
          rating: 3.9,
          features: ['Home Protection Plans', 'HVAC Monitoring', 'Usage Bill Credits', 'Multi-State'],
          slug: 'constellation-energy',
          id: 'constellation-energy'
        }
      ]
    },
    {
      id: 'rewards',
      title: 'Best for Bill Credits & Rewards',
      subtitle: 'Save More with Credits',
      icon: DollarSign,
      color: 'purple',
      description: 'Providers offering significant bill credits, usage rewards, and loyalty programs',
      providers: [
        {
          name: 'Frontier Utilities',
          highlight: 'Usage-based bill credits + medium to large home focus',
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
          highlight: 'Simple rewards + satisfaction guarantee',
          rating: 3.9,
          features: ['$125 Bill Credit', '60 Day Guarantee', 'Simple Structure', 'Fixed Rates'],
          slug: '4change-energy',
          id: '4change-energy'
        }
      ]
    },
    {
      id: 'tech',
      title: 'Best for Tech & Smart Homes',
      subtitle: 'Smart Integration',
      icon: Wifi,
      color: 'indigo',
      description: 'Providers with smart home integration, dynamic pricing, and advanced technology features',
      providers: [
        {
          name: 'Rhythm Energy',
          highlight: 'Smart alerts + pick-your-due-date + modern app',
          rating: 4.4,
          features: ['Smart Alerts', 'Flexible Billing', 'Usage Analytics', 'Modern App'],
          slug: 'rhythm-energy',
          id: 'rhythm-energy'
        },
        {
          name: 'Reliant Energy',
          highlight: 'Google Nest, Ring & smart thermostat bundles',
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
      title: 'Best for Local Texas Support',
      subtitle: 'Texas-Based Companies',
      icon: Heart,
      color: 'red',
      description: 'Texas-owned and operated providers with local offices and community focus',
      providers: [
        {
          name: 'Reliant Energy',
          highlight: 'HQ in Houston + offices across Texas',
          rating: 4.1,
          features: ['Houston Headquarters', 'Texas Offices', 'Local Jobs', 'Community Investment'],
          slug: 'reliant-energy',
          id: 'reliant-energy'
        },
        {
          name: '4Change Energy',
          highlight: 'Dallas-based + local charities & Texas-focused',
          rating: 3.9,
          features: ['Dallas-Based', 'Local Charities', 'Texas-Focused', 'Community Giving'],
          slug: '4change-energy',
          id: '4change-energy'
        },
        {
          name: 'APGE (American Powernet)',
          highlight: 'Texas electricity provider with no gimmicks',
          rating: 4.1,
          features: ['Texas Provider', 'Simple Plans', 'No Hidden Fees', 'Straightforward Service'],
          slug: 'apge',
          id: 'apge'
        }
      ]
    },
    {
      id: 'budget',
      title: 'Best for Budget-Conscious',
      subtitle: 'Lowest Rates & Fees',
      icon: TrendingDown,
      color: 'green',
      description: 'Providers offering the most competitive rates and minimal fees for budget-minded customers',
      providers: [
        {
          name: 'APGE (American Powernet)',
          highlight: 'SimpleSaver plans with rates starting at 9.7¢/kWh',
          rating: 4.1,
          features: ['9.7¢/kWh Rate', '$100 Bill Credit', 'No Monthly Fee', 'No Hidden Fees'],
          slug: 'apge',
          id: 'apge'
        },
        {
          name: 'Gexa Energy',
          highlight: 'Eco Saver Plus at 9.8¢/kWh + 100% green energy',
          rating: 4.3,
          features: ['9.8¢/kWh Rate', '100% Green', '$125 Usage Credit', 'No Monthly Fee'],
          slug: 'gexa-energy',
          id: 'gexa-energy'
        },
        {
          name: 'Discount Power',
          highlight: 'Bill Credit Bundle with competitive 10.1¢/kWh rate',
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

  // Get all providers for general listing
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
      title: 'Expert Categorization',
      description: 'Providers organized by what they do best - green energy, service, savings, and more'
    },
    {
      icon: Eye,
      title: 'Real Customer Data',
      description: 'Rankings based on actual customer reviews, ratings, and satisfaction scores'
    },
    {
      icon: ThumbsUp,
      title: 'Category Leaders',
      description: 'Find the #1 provider in each category based on performance and specialization'
    },
    {
      icon: Target,
      title: 'Match Your Needs',
      description: 'Choose providers that excel in what matters most to you personally'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Award className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Best Electricity Providers by Category
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-blue-100">
              Find Top-Rated Companies That Excel in What Matters to You
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Don't settle for average. Find electricity providers that are #1 in green energy, customer service, 
              savings, smart home tech, and more. Expert recommendations based on real customer data.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{mockProviders.length}</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{lowestRate}¢</div>
                <div className="text-blue-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{avgRating}</div>
                <div className="text-blue-200 text-sm">Avg Rating</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">6</div>
                <div className="text-blue-200 text-sm">Categories</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code to see local providers"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized results for your area</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose by Category?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Not all electricity providers are the same. Find companies that excel in what matters most to you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Best Providers by Category
            </h2>
            <p className="text-lg text-gray-600">
              Find providers that excel in what matters most to you
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category.title.replace('Best for ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Categories */}
        <div className="space-y-12 mb-16">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${category.color}-100 text-${category.color}-600 rounded-lg mb-4`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
                <h3 className="text-lg text-gray-600 mb-3">{category.subtitle}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">{category.description}</p>
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
                        onClick={() => onNavigate(`/providers/${provider.slug}`)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View {provider.name} Details
                      </button>
                      <button
                        onClick={() => onNavigate(`/texas/houston/electricity-providers`)}
                        className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        See Plans & Rates
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => onNavigate(`/compare/providers?category=${category.id}`)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Compare All {category.title.replace('Best for ', '')} Providers
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* All Providers Directory */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Provider Directory</h2>
              <p className="text-gray-600">Browse all {mockProviders.length} licensed electricity providers</p>
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
                onViewDetails={() => onNavigate(`/providers/${provider.slug}`)}
                onCompare={() => toggleProviderSelection(provider.id)}
                showPlans
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('/compare/providers')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View All Providers & Compare
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Find Cheapest Rates</h3>
            <p className="text-gray-600 text-sm mb-4">
              Compare providers offering the lowest electricity rates in your area.
            </p>
            <button
              onClick={() => onNavigate('/shop/cheapest-electricity')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Find Lowest Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Side-by-Side</h3>
            <p className="text-gray-600 text-sm mb-4">
              Select multiple providers and compare them head-to-head.
            </p>
            <button
              onClick={() => onNavigate('/compare/providers')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Start Comparing →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top 5 Rankings</h3>
            <p className="text-gray-600 text-sm mb-4">
              See our expert rankings of the best electricity providers.
            </p>
            <button
              onClick={() => onNavigate('/compare/providers/top-5')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              View Rankings →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Find by Location</h3>
            <p className="text-gray-600 text-sm mb-4">
              See providers, rates, and service areas by specific locations.
            </p>
            <button
              onClick={() => onNavigate('/locations')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              Browse Locations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}