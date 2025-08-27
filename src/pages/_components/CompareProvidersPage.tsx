import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  Users, Star, Phone, Globe, Shield, Award, CheckCircle, X, Plus, 
  Headphones, Heart, Leaf, DollarSign, Battery, TrendingDown,
  Building, MapPin, Filter, Eye, ThumbsUp, Target, Search
} from 'lucide-react';

interface CompareProvidersPageProps {
  onNavigate: (path: string) => void;
}

export function CompareProvidersPage({ onNavigate }: CompareProvidersPageProps) {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews' | 'plans'>('rating');
  const [filterCategory, setFilterCategory] = useState<'all' | 'green' | 'service' | 'value' | 'tech' | 'local'>('all');
  const [showComparison, setShowComparison] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    onNavigate(`/texas/houston/electricity-providers`);
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else if (prev.length < 4) {
        return [...prev, providerId];
      }
      return prev;
    });
  };

  const providerCategories = [
    {
      id: 'green',
      name: 'Green Energy Leaders',
      icon: Leaf,
      color: 'green',
      providers: mockProviders.filter(p => p.plans.some(plan => plan.renewablePercent === 100)).slice(0, 3)
    },
    {
      id: 'service', 
      name: 'Customer Service Champions',
      icon: Headphones,
      color: 'blue',
      providers: mockProviders.sort((a, b) => b.rating - a.rating).slice(0, 3)
    },
    {
      id: 'value',
      name: 'Best Value Providers',
      icon: DollarSign,
      color: 'purple',
      providers: mockProviders.sort((a, b) => {
        const aLowestRate = Math.min(...a.plans.map(p => p.rate));
        const bLowestRate = Math.min(...b.plans.map(p => p.rate));
        return aLowestRate - bLowestRate;
      }).slice(0, 3)
    },
    {
      id: 'tech',
      name: 'Technology Leaders',
      icon: Battery,
      color: 'indigo',
      providers: mockProviders.filter(p => p.features.some(f => f.toLowerCase().includes('smart') || f.toLowerCase().includes('app'))).slice(0, 3)
    }
  ];

  const filteredProviders = mockProviders.filter(provider => {
    if (filterCategory === 'all') return true;
    
    const category = providerCategories.find(cat => cat.id === filterCategory);
    return category?.providers.some(p => p.id === provider.id);
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        const aLowestRate = Math.min(...a.plans.map(p => p.rate));
        const bLowestRate = Math.min(...b.plans.map(p => p.rate));
        return aLowestRate - bLowestRate;
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      case 'plans':
        return b.plans.length - a.plans.length;
      default:
        return 0;
    }
  });

  const selectedProviderData = selectedProviders.map(id => 
    mockProviders.find(p => p.id === id)
  ).filter(Boolean);

  const comparisonMetrics = [
    { name: 'Customer Rating', key: 'rating', format: (val: number) => `${val}★` },
    { name: 'Total Reviews', key: 'reviewCount', format: (val: number) => val.toLocaleString() },
    { name: 'Available Plans', key: 'plans', format: (val: any[]) => val.length.toString() },
    { name: 'Service States', key: 'serviceStates', format: (val: string[]) => val.length.toString() },
    { name: 'Lowest Rate', key: 'lowestRate', format: (provider: any) => `${Math.min(...provider.plans.map((p: any) => p.rate))}¢/kWh` },
    { name: 'Green Plans', key: 'greenPlans', format: (provider: any) => provider.plans.filter((p: any) => p.renewablePercent === 100).length > 0 ? 'Yes' : 'No' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Users className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Compare Electricity Providers - Expert Company Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Compare electricity companies side-by-side. Analyze customer service, coverage areas, 
              specializations, and company performance to find the right provider for your needs.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{mockProviders.length}</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">4.2★</div>
                <div className="text-blue-200 text-sm">Avg Rating</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">6</div>
                <div className="text-blue-200 text-sm">Categories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-blue-200 text-sm">Comparison</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code for local providers"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Find providers serving your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Comparison Bar */}
        {selectedProviders.length > 0 && (
          <div className="bg-blue-600 text-white rounded-lg p-4 mb-8 sticky top-4 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Comparing {selectedProviders.length} Providers:</span>
                <div className="flex items-center space-x-2">
                  {selectedProviders.slice(0, 3).map((id) => {
                    const provider = mockProviders.find(p => p.id === id);
                    return provider ? (
                      <div key={id} className="flex items-center bg-white/20 rounded-full px-3 py-1">
                        <span className="text-sm mr-2">{provider.name}</span>
                        <button
                          onClick={() => toggleProvider(id)}
                          className="text-white hover:text-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                  {selectedProviders.length > 3 && (
                    <span className="text-sm">+{selectedProviders.length - 3} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison Table
                </button>
                <button
                  onClick={() => setSelectedProviders([])}
                  className="text-white hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Comparison Table */}
        {showComparison && selectedProviderData.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Side-by-Side Provider Comparison
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-2 font-medium text-gray-900">Company Details</th>
                    {selectedProviderData.map((provider) => (
                      <th key={provider?.id} className="text-center py-4 px-4 min-w-48">
                        <div className="flex flex-col items-center">
                          <img
                            src={provider?.logo}
                            alt={`${provider?.name} logo`}
                            className="w-12 h-12 rounded-lg object-cover mb-2"
                          />
                          <div className="font-semibold text-gray-900">{provider?.name}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetrics.map((metric) => (
                    <tr key={metric.name} className="border-b border-gray-100">
                      <td className="py-4 px-2 font-medium text-gray-900">{metric.name}</td>
                      {selectedProviderData.map((provider) => (
                        <td key={provider?.id} className="py-4 px-4 text-center">
                          <div className="font-semibold">
                            {metric.key === 'lowestRate' || metric.key === 'greenPlans' 
                              ? metric.format(provider)
                              : metric.format((provider as any)?.[metric.key] || 0)
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium text-gray-900">Contact</td>
                    {selectedProviderData.map((provider) => (
                      <td key={provider?.id} className="py-4 px-4 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center text-sm">
                            <Phone className="h-4 w-4 mr-1" />
                            {provider?.contactPhone}
                          </div>
                          <div className="flex items-center justify-center text-sm">
                            <Globe className="h-4 w-4 mr-1" />
                            <a href={provider?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              Website
                            </a>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-2 font-medium text-gray-900">Actions</td>
                    {selectedProviderData.map((provider) => (
                      <td key={provider?.id} className="py-4 px-4 text-center">
                        <div className="space-y-2">
                          <button
                            onClick={() => onNavigate(`/providers/${provider?.slug}`)}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => onNavigate(`/texas/houston/electricity-providers`)}
                            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            See Plans & Rates
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Provider Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Compare Providers by Specialization
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {providerCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id as any)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  filterCategory === category.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  filterCategory === category.id
                    ? `bg-${category.color}-100 text-${category.color}-600`
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <div className="text-sm text-gray-600">{category.providers.length} top providers</div>
              </button>
            ))}
          </div>
        </div>

        {/* Provider Grid with Selection */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {filterCategory === 'all' ? 'All' : providerCategories.find(c => c.id === filterCategory)?.name} Providers
              </h2>
              <p className="text-gray-600">Select up to 4 providers to compare side-by-side</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Rates</option>
                <option value="reviews">Most Reviews</option>
                <option value="plans">Most Plans</option>
              </select>
              
              <button
                onClick={() => setFilterCategory('all')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProviders.slice(0, 12).map((provider) => {
              const isSelected = selectedProviders.includes(provider.id);
              const lowestRate = Math.min(...provider.plans.map(p => p.rate));
              
              return (
                <div key={provider.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative">
                  {/* Selection Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      disabled={!isSelected && selectedProviders.length >= 4}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : selectedProviders.length >= 4
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Provider Header */}
                    <div className="flex items-center mb-4">
                      <img
                        src={provider.logo}
                        alt={`${provider.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{provider.rating}</span>
                          <span className="text-gray-500 ml-1">({provider.reviewCount.toLocaleString()})</span>
                        </div>
                      </div>
                    </div>

                    {/* Provider Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{lowestRate}¢</div>
                        <div className="text-xs text-gray-600">Lowest Rate</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{provider.plans.length}</div>
                        <div className="text-xs text-gray-600">Plans Available</div>
                      </div>
                    </div>

                    {/* Provider Features */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Key Strengths:</div>
                      <div className="space-y-1">
                        {provider.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => onNavigate(`/providers/${provider.slug}`)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Company Profile
                      </button>
                      <button
                        onClick={() => onNavigate(`/texas/houston/electricity-providers`)}
                        className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        See Plans & Rates
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Methodology */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How We Compare Electricity Providers
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h3>
              <p className="text-gray-600 text-sm">
                Customer ratings, review sentiment, and satisfaction scores from verified customers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <TrendingDown className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Pricing</h3>
              <p className="text-gray-600 text-sm">
                Rate competitiveness, fee structures, and overall value proposition analysis.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Headphones className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Quality</h3>
              <p className="text-gray-600 text-sm">
                Customer service responsiveness, billing accuracy, and support channel quality.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-lg mb-6">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Portfolio</h3>
              <p className="text-gray-600 text-sm">
                Plan variety, innovative features, and coverage of different customer needs.
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Plans</h3>
            <p className="text-gray-600 text-sm mb-4">
              Compare specific electricity plans by features, rates, and contract terms.
            </p>
            <button
              onClick={() => onNavigate('/compare/plans')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Compare Plans →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Rates</h3>
            <p className="text-gray-600 text-sm mb-4">
              Real-time rate comparison with cost calculators and usage analysis.
            </p>
            <button
              onClick={() => onNavigate('/compare/rates')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Compare Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Rankings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Expert rankings of top providers by category and specialization.
            </p>
            <button
              onClick={() => onNavigate('/best')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View Rankings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}