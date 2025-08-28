import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Icon } from '../../components/ui/Icon';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CompareProvidersPageProps {
}

export function CompareProvidersPage({}: CompareProvidersPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews' | 'plans'>('rating');
  const [filterCategory, setFilterCategory] = useState<'all' | 'green' | 'service' | 'value' | 'tech' | 'local'>('all');
  const [showComparison, setShowComparison] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-providers`);
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
              <Icon icon="users" size={40} className="text-white" />
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
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison Table
                </Button>
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
          <Card className="mb-8">
            <CardContent className="p-6">
            <CardTitle className="text-2xl mb-6">
              Side-by-Side Provider Comparison
            </CardTitle>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left font-medium">Company Details</TableHead>
                    {selectedProviderData.map((provider) => (
                      <TableHead key={provider?.id} className="text-center min-w-48">
                        <div className="flex flex-col items-center">
                          <img
                            src={provider?.logo}
                            alt={`${provider?.name} logo`}
                            className="w-12 h-12 rounded-lg object-cover mb-2"
                          />
                          <div className="font-semibold">{provider?.name}</div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonMetrics.map((metric) => (
                    <TableRow key={metric.name}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      {selectedProviderData.map((provider) => (
                        <TableCell key={provider?.id} className="text-center">
                          <div className="font-semibold">
                            {metric.key === 'lowestRate' || metric.key === 'greenPlans' 
                              ? metric.format(provider)
                              : metric.format((provider as any)?.[metric.key] || 0)
                            }
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Contact</TableCell>
                    {selectedProviderData.map((provider) => (
                      <TableCell key={provider?.id} className="text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center text-sm">
                            <Icon icon="phone" size={16} className="mr-1" />
                            {provider?.contactPhone}
                          </div>
                          <div className="flex items-center justify-center text-sm">
                            <Icon icon="tabler:world" size={16} className="mr-1" />
                            <a href={provider?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              Website
                            </a>
                          </div>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Actions</TableCell>
                    {selectedProviderData.map((provider) => (
                      <TableCell key={provider?.id} className="text-center">
                        <div className="space-y-2">
                          <Button
                            onClick={() => navigate(`/providers/${provider?.slug}`)}
                            size="sm"
                            className="w-full"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => navigate(`/texas/houston/electricity-providers`)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            See Plans & Rates
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Compare Providers by Specialization
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {providerCategories.map((category) => (
              <Card
                key={category.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                  filterCategory === category.id
                    ? 'border-blue-600 bg-blue-50'
                    : ''
                }`}
                onClick={() => setFilterCategory(category.id as any)}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  filterCategory === category.id
                    ? `bg-${category.color}-100 text-${category.color}-600`
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon icon={category.id === 'green' ? 'leaf' : category.id === 'service' ? 'headphones' : category.id === 'value' ? 'dollar' : 'battery'} size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <div className="text-sm text-muted-foreground">{category.providers.length} top providers</div>
              </Card>
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
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price">Lowest Rates</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="plans">Most Plans</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => setFilterCategory('all')}
                variant="ghost"
                size="sm"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProviders.slice(0, 12).map((provider) => {
              const isSelected = selectedProviders.includes(provider.id);
              const lowestRate = Math.min(...provider.plans.map(p => p.rate));
              
              return (
                <Card key={provider.id} className="hover:shadow-md transition-shadow relative">
                  {/* Selection Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <Button
                      onClick={() => toggleProvider(provider.id)}
                      disabled={!isSelected && selectedProviders.length >= 4}
                      size="icon"
                      variant={isSelected ? "default" : "outline"}
                      className={`w-8 h-8 rounded-full ${
                        selectedProviders.length >= 4 && !isSelected
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isSelected ? (
                        <Icon icon="success" size={16} />
                      ) : (
                        <Icon icon="tabler:plus" size={16} />
                      )}
                    </Button>
                  </div>

                  <CardContent className="p-6">
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
                          <Icon icon="star" size={16} className="text-yellow-400 mr-1" />
                          <span className="font-medium">{provider.rating}</span>
                          <span className="text-muted-foreground ml-1">({provider.reviewCount.toLocaleString()})</span>
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
                          <div key={index} className="flex items-center text-xs text-muted-foreground">
                            <Icon icon="success" size={12} className="text-green-600 mr-1 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(`/providers/${provider.slug}`)}
                        className="w-full"
                        size="sm"
                      >
                        View Company Profile
                      </Button>
                      <Button
                        onClick={() => navigate(`/texas/houston/electricity-providers`)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        See Plans & Rates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comparison Methodology */}
        <Card className="p-8 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-6">
              How We Compare Electricity Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
                <Icon icon="star" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-4">Customer Satisfaction</h3>
              <p className="text-gray-600 text-sm">
                Customer ratings, review sentiment, and satisfaction scores from verified customers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <Icon icon="trending" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-4">Competitive Pricing</h3>
              <p className="text-gray-600 text-sm">
                Rate competitiveness, fee structures, and overall value proposition analysis.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Icon icon="tabler:headphones" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-4">Service Quality</h3>
              <p className="text-gray-600 text-sm">
                Customer service responsiveness, billing accuracy, and support channel quality.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-lg mb-6">
                <Icon icon="tabler:award" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-4">Plan Portfolio</h3>
              <p className="text-muted-foreground text-sm">
                Plan variety, innovative features, and coverage of different customer needs.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                <Icon icon="star" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Compare Plans</CardTitle>
              <CardDescription className="text-sm mb-4">
                Compare specific electricity plans by features, rates, and contract terms.
              </CardDescription>
              <Button
                onClick={() => navigate('/compare/plans')}
                variant="ghost"
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Compare Plans →
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
                <Icon icon="trending" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Compare Rates</CardTitle>
              <CardDescription className="text-sm mb-4">
                Real-time rate comparison with cost calculators and usage analysis.
              </CardDescription>
              <Button
                onClick={() => navigate('/compare/rates')}
                variant="ghost"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                Compare Rates →
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                <Icon icon="tabler:award" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Best Rankings</CardTitle>
              <CardDescription className="text-sm mb-4">
                Expert rankings of top providers by category and specialization.
              </CardDescription>
              <Button
                onClick={() => navigate('/best')}
                variant="ghost"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View Rankings →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}