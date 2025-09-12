import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { getProviders, getCities, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import { 
  Building, Users, Star, TrendingDown, Leaf, Shield, Award, 
  DollarSign, Headphones, Heart, Battery, Crown, Medal, Trophy,
  CheckCircle, ArrowRight, Filter, Eye, ThumbsUp, Target,
  Phone, Globe, MapPin, Calendar, Zap, Calculator
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TexasCompaniesPageProps {
}

export function TexasCompaniesPage({}: TexasCompaniesPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'green' | 'service' | 'value' | 'tech' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popularity'>('rating');
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [cities, setCities] = useState<RealCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        
        const [providersData, citiesData] = await Promise.all([
          getProviders('texas'),
          getCities('texas')
        ]);
        
        setProviders(providersData);
        setCities(citiesData);
      } catch (error) {
        console.error('[TexasCompaniesPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const texasProviders = providers;

  const handleZipSearch = (zipCode: string) => {
    const city = cities.find(c => c.zipCodes?.includes(zipCode));
    if (city) {
      navigate(`/texas/${city.slug}/electricity-companies`);
    } else {
      navigate('/texas/houston/electricity-companies');
    }
  };

  const companyCategories = [
    {
      id: 'green',
      title: 'Green Energy Champions',
      subtitle: '100% Renewable Specialists',
      icon: Leaf,
      color: 'green',
      description: 'Texas companies leading the renewable energy revolution',
      companies: [
        {
          name: 'Rhythm Energy',
          highlight: 'All plans 100% renewable + smart billing',
          rating: 4.4,
          specialization: 'Smart renewable energy with flexible features',
          strengths: ['100% Wind/Solar', 'Pick Your Due Date', 'Smart Alerts', 'Modern App'],
          serviceAreas: ['Statewide Texas'],
          slug: 'rhythm-energy'
        },
        {
          name: 'Gexa Energy', 
          highlight: '100% green energy since 2019',
          rating: 4.3,
          specialization: 'Competitive green pricing with usage credits',
          strengths: ['Eco Saver Plus', '$125 Bill Credits', '100% Renewable', '60-Day Guarantee'],
          serviceAreas: ['Statewide Texas'],
          slug: 'gexa-energy'
        },
        {
          name: 'Green Mountain Energy',
          highlight: 'Pioneer in renewable electricity',
          rating: 4.2,
          specialization: 'Longest-running green provider in Texas',
          strengths: ['Carbon-Free Power', 'Pollution-Free Plans', 'Environmental Leadership', 'Solar Programs'],
          serviceAreas: ['Statewide Texas'],
          slug: 'green-mountain-energy'
        }
      ]
    },
    {
      id: 'service',
      title: 'Customer Service Excellence',
      subtitle: 'Top-Rated Support & Satisfaction',
      icon: Headphones,
      color: 'blue',
      description: 'Texas companies with exceptional customer service',
      companies: [
        {
          name: 'Champion Energy',
          highlight: 'Highest customer satisfaction in Texas',
          rating: 4.6,
          specialization: 'Premium service with local Texas support',
          strengths: ['Local Call Centers', 'Same-Day Service', 'High Satisfaction', 'Transparent Billing'],
          serviceAreas: ['Texas Markets'],
          slug: 'champion-energy'
        },
        {
          name: 'Reliant Energy',
          highlight: 'Houston-based with complete support',
          rating: 4.1,
          specialization: 'Large provider with local Texas presence',
          strengths: ['Houston Headquarters', 'Online Tools', 'Smart Home Bundles', 'Local Support'],
          serviceAreas: ['Statewide Texas'],
          slug: 'reliant-energy'
        },
        {
          name: 'TXU Energy',
          highlight: 'Largest Texas provider with guarantees',
          rating: 4.0,
          specialization: '60-day satisfaction guarantee and flexible plans',
          strengths: ['60-Day Guarantee', 'Largest Provider', 'Flexible Plans', 'Strong Support'],
          serviceAreas: ['Statewide Texas'],
          slug: 'txu-energy'
        }
      ]
    },
    {
      id: 'value',
      title: 'Best Value Champions',
      subtitle: 'Lowest Costs & Best Deals',
      icon: DollarSign,
      color: 'purple',
      description: 'Texas companies offering exceptional value',
      companies: [
        {
          name: 'APGE (American Powernet)',
          highlight: 'SimpleSaver plans with lowest Texas rates',
          rating: 4.1,
          specialization: 'No-gimmick plans with transparent pricing',
          strengths: ['9.7¢/kWh Rates', '$100 Bill Credit', 'No Hidden Fees', 'Simple Plans'],
          serviceAreas: ['Texas Deregulated Areas'],
          slug: 'apge'
        },
        {
          name: 'Frontier Utilities',
          highlight: 'Usage-based bill credits for larger homes',
          rating: 4.2,
          specialization: 'Value plans with usage incentives',
          strengths: ['$125 Usage Credit', '60 Day Guarantee', 'Medium+ Homes', 'Value Focus'],
          serviceAreas: ['Texas Markets'],
          slug: 'frontier-utilities'
        },
        {
          name: 'Discount Power',
          highlight: 'Affordable plans with satisfaction guarantees',
          rating: 3.8,
          specialization: 'Budget-friendly options with credits',
          strengths: ['Bill Credit Bundle', '90 Day Guarantee', 'Small-Medium Homes', 'Affordable'],
          serviceAreas: ['Texas Deregulated Markets'],
          slug: 'discount-power'
        }
      ]
    },
    {
      id: 'tech',
      title: 'Technology & Innovation',
      subtitle: 'Smart Home Integration Leaders',
      icon: Battery,
      color: 'indigo',
      description: 'Texas companies with advanced technology features',
      companies: [
        {
          name: 'Rhythm Energy',
          highlight: 'Smart alerts and flexible billing technology',
          rating: 4.4,
          specialization: 'Modern app with smart home features',
          strengths: ['Smart Alerts', 'Flexible Billing', 'Modern App', 'Usage Analytics'],
          serviceAreas: ['Texas Technology Markets'],
          slug: 'rhythm-energy'
        },
        {
          name: 'Reliant Energy',
          highlight: 'Google Nest and smart device partnerships',
          rating: 4.1,
          specialization: 'Smart home bundles and device integration',
          strengths: ['Smart Device Bundles', 'Nest Integration', 'Connected Home', 'Energy Monitoring'],
          serviceAreas: ['Statewide Texas'],
          slug: 'reliant-energy'
        },
        {
          name: 'TXU Energy',
          highlight: 'Digital tools and online account management',
          rating: 4.0,
          specialization: 'Complete digital platform',
          strengths: ['Digital Tools', 'Online Management', 'Mobile App', 'Account Control'],
          serviceAreas: ['Statewide Texas'],
          slug: 'txu-energy'
        }
      ]
    },
    {
      id: 'local',
      title: 'Texas-Based Companies',
      subtitle: 'Local Support & Community Focus',
      icon: Heart,
      color: 'red',
      description: 'Proud Texas companies with local roots',
      companies: [
        {
          name: 'Reliant Energy',
          highlight: 'Houston headquarters with Texas offices',
          rating: 4.1,
          specialization: 'Local Texas company with community investment',
          strengths: ['Houston HQ', 'Texas Offices', 'Local Jobs', 'Community Investment'],
          serviceAreas: ['Statewide Texas'],
          slug: 'reliant-energy'
        },
        {
          name: '4Change Energy',
          highlight: 'Dallas-based with local charity support',
          rating: 3.9,
          specialization: 'Texas-focused with community giving',
          strengths: ['Dallas-Based', 'Local Charities', 'Community Focus', 'Texas-Focused'],
          serviceAreas: ['Texas Markets'],
          slug: '4change-energy'
        },
        {
          name: 'Champion Energy',
          highlight: 'Texas-focused with local call centers',
          rating: 4.6,
          specialization: 'Premium Texas service provider',
          strengths: ['Local Centers', 'Texas Focus', 'Community Engagement', 'Local Support'],
          serviceAreas: ['Texas Markets'],
          slug: 'champion-energy'
        }
      ]
    }
  ];

  const filteredCategories = selectedCategory === 'all' 
    ? companyCategories 
    : companyCategories.filter(cat => cat.id === selectedCategory);

  const texasMarketFacts = [
    {
      title: 'Largest Deregulated Market',
      description: 'Texas has the largest competitive electricity market in the United States',
      stat: '#1 in USA'
    },
    {
      title: 'Customer Choice',
      description: '85% of Texas electricity customers can choose their provider',
      stat: '24M+ Customers'
    },
    {
      title: 'Competitive Rates',
      description: 'Competition has driven down electricity rates for consumers',
      stat: '30%+ Savings'
    },
    {
      title: 'Renewable Leadership',
      description: 'Texas leads the nation in wind energy production',
      stat: '#1 Wind State'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <nav className="text-sm text-white/80 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-white">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/texas')} className="hover:text-white">Texas</button>
            <span className="mx-2">/</span>
            <span>Electricity Companies</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Building className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Texas Electricity Companies - Expert Analysis & Rankings
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-4xl mx-auto">
              Complete directory of {loading ? '100+' : texasProviders.length} electricity companies serving Texas. 
              Expert rankings by specialization help you find the right company for your needs.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{loading ? '100+' : texasProviders.length}</div>
                <div className="text-red-200 text-sm">Licensed Companies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-red-200 text-sm">Categories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">4.2★</div>
                <div className="text-red-200 text-sm">Avg Rating</div>
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
              <p className="text-red-200 text-sm mt-2">Find companies serving your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Texas Companies by Specialization
            </h2>
            <p className="text-lg text-gray-600">
              Find electricity companies that excel in what matters most to you
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-texas-red text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Categories
            </button>
            {companyCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as unknown)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-texas-red text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Company Categories */}
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
                {category.companies.map((company, index) => (
                  <div key={company.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
                    {/* Ranking Badge */}
                    <div className="absolute -top-3 -right-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{company.name}</h4>
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{company.rating}</span>
                        <span className="text-gray-500 text-sm ml-1">rating</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">{company.highlight}</p>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Specialization:</h5>
                      <p className="text-gray-600 text-sm">{company.specialization}</p>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Key Strengths:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {company.strengths.map((strength, sIndex) => (
                          <div key={sIndex} className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Service Areas:</h5>
                      <div className="text-sm text-gray-600">
                        {company.serviceAreas.join(', ')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/providers/${company.slug}`)}
                        className="w-full bg-texas-red text-white py-2 rounded-lg hover:bg-texas-red-600 transition-colors text-sm font-medium"
                      >
                        View Company Profile
                      </button>
                      <button
                        onClick={() => navigate(`/texas/houston/electricity-providers`)}
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
                  onClick={() => navigate(`/texas/companies/category/${category.id}`)}
                  className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
                >
                  View All {category.title} in Texas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Texas Market Facts */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why Texas Has the Best Electricity Market
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {texasMarketFacts.map((fact, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-texas-red mb-3">{fact.stat}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{fact.title}</h3>
                <p className="text-gray-600 text-sm">{fact.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/texas/market-info')}
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
            >
              Learn About Texas Electricity Market
            </button>
          </div>
        </div>

        {/* Complete Company Directory */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Complete Texas Company Directory
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading Texas companies...</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {texasProviders.slice(0, 12).map((provider) => (
                <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{provider.name}</h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {provider.averageRate ? `Avg ${provider.averageRate}¢/kWh` : 'Competitive Rates'}
                    </div>
                    {provider.rating && (
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{provider.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Plan Count:</div>
                    <div className="font-medium">{provider.planCount || 'Multiple'} plans available</div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/providers/${provider.slug}`)}
                      className="w-full bg-texas-red text-white py-2 rounded-lg hover:bg-texas-red-600 transition-colors text-sm font-medium"
                    >
                      View Company Profile
                    </button>
                    <button
                      onClick={() => navigate(`/texas/houston/electricity-providers`)}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      See Plans & Rates
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/texas/electricity-providers')}
              className="bg-texas-navy text-white px-8 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
            >
              View All Texas Providers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}