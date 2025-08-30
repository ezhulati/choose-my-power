import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  Building, Users, Star, TrendingDown, MapPin, Search, Zap, 
  Award, Shield, Leaf, Phone, Globe, ArrowRight, CheckCircle,
  Headphones, DollarSign, Heart, Battery, Crown, Medal, Trophy,
  Target, Eye, ThumbsUp, Filter, Calculator, Home
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ElectricityCompaniesPageProps {
}

export function ElectricityCompaniesPage({}: ElectricityCompaniesPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'green' | 'service' | 'value' | 'tech' | 'local'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'plans' | 'alphabetical'>('rating');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-companies`);
  };

  // Company categories with expert analysis
  const companyCategories = [
    {
      id: 'green',
      title: 'Green Energy Champions',
      subtitle: '100% Renewable Specialists',
      icon: Leaf,
      color: 'green',
      description: 'Electricity companies committed to 100% renewable energy and environmental sustainability',
      marketShare: '35%',
      avgRating: '4.3',
      topCompanies: ['Rhythm Energy', 'Gexa Energy', 'Green Mountain Energy'],
      expertise: ['Wind Power Integration', 'Solar Energy Programs', 'Carbon Offset Programs', 'Renewable Certificates'],
      companies: [
        {
          name: 'Rhythm Energy',
          slug: 'rhythm-energy',
          rating: 4.4,
          plans: 12,
          specialization: 'All plans 100% renewable + flexible billing options',
          strengths: ['100% Wind/Solar', 'Pick Your Due Date', 'Smart Alerts', 'No Hidden Fees'],
          serviceStates: ['Texas'],
          greenCredentials: 'RECs for all energy sold',
          companySize: 'Mid-size specialist'
        },
        {
          name: 'Gexa Energy', 
          slug: 'gexa-energy',
          rating: 4.3,
          plans: 8,
          specialization: '100% green since 2019 + competitive green pricing',
          strengths: ['Eco Saver Plus', '$125 Bill Credits', '100% Renewable', '60-Day Guarantee'],
          serviceStates: ['Texas'],
          greenCredentials: 'Green-e certified renewable energy',
          companySize: 'Regional green leader'
        },
        {
          name: 'Green Mountain Energy',
          slug: 'green-mountain-energy', 
          rating: 4.2,
          plans: 6,
          specialization: 'Longest-running green provider in Texas market',
          strengths: ['Carbon-Free Power', 'Environmental Leadership', 'Pollution-Free Plans', 'Clean Energy'],
          serviceStates: ['Texas'],
          greenCredentials: 'Pioneer in renewable electricity',
          companySize: 'National green energy company'
        }
      ]
    },
    {
      id: 'service',
      title: 'Customer Service Excellence',
      subtitle: 'Top-Rated Support & Satisfaction',
      icon: Headphones,
      color: 'blue',
      description: 'Companies with local call centers and highest satisfaction ratings',
      marketShare: '42%',
      avgRating: '4.4',
      topCompanies: ['Champion Energy', 'Reliant Energy', 'TXU Energy'],
      expertise: ['Local Call Centers', '24/7 Support', 'Omnichannel Service', 'Proactive Communication'],
      companies: [
        {
          name: 'Champion Energy',
          slug: 'champion-energy',
          rating: 4.6,
          plans: 10,
          specialization: 'Highest customer satisfaction with local Texas support',
          strengths: ['Local Call Centers', 'Same-Day Service', 'Transparent Billing', 'High Satisfaction'],
          serviceStates: ['Texas'],
          serviceHighlights: 'Texas-based customer service',
          companySize: 'Premium service provider'
        },
        {
          name: 'Reliant Energy',
          slug: 'reliant-energy',
          rating: 4.1,
          plans: 15,
          specialization: 'Houston-based with comprehensive support tools',
          strengths: ['Texas Headquarters', 'Online Tools', 'Smart Home Bundles', 'Local Support'],
          serviceStates: ['Texas'],
          serviceHighlights: 'Houston headquarters with state presence',
          companySize: 'Large regional provider'
        },
        {
          name: 'TXU Energy',
          slug: 'txu-energy',
          rating: 4.0,
          plans: 18,
          specialization: 'Largest provider with 60-day satisfaction guarantee',
          strengths: ['60-Day Guarantee', 'Largest Provider', 'Flexible Plans', 'Strong Support'],
          serviceStates: ['Texas'],
          serviceHighlights: '60-day happiness guarantee',
          companySize: 'Largest Texas provider'
        }
      ]
    },
    {
      id: 'value',
      title: 'Best Value Leaders',
      subtitle: 'Lowest Costs & Best Deals',
      icon: DollarSign,
      color: 'purple',
      description: 'Companies offering the most competitive rates, bill credits, and overall value for customers',
      marketShare: '28%',
      avgRating: '4.0',
      topCompanies: ['APGE', 'Frontier Utilities', 'Discount Power'],
      expertise: ['Rate Optimization', 'Fee Transparency', 'Bill Credit Programs', 'Value Engineering'],
      companies: [
        {
          name: 'APGE (American Powernet)',
          slug: 'apge',
          rating: 4.1,
          plans: 8,
          specialization: 'SimpleSaver plans with lowest rates and no gimmicks',
          strengths: ['9.7¢/kWh Rates', '$100 Bill Credit', 'No Hidden Fees', 'Simple Plans'],
          serviceStates: ['Texas'],
          valueProposition: 'Transparent low-rate leader',
          companySize: 'Value-focused specialist'
        },
        {
          name: 'Frontier Utilities',
          slug: 'frontier-utilities',
          rating: 4.2,
          plans: 6,
          specialization: 'Usage-based bill credits for medium to large homes',
          strengths: ['$125 Usage Credit', '60 Day Guarantee', 'Medium+ Homes', 'Value Focus'],
          serviceStates: ['Texas'],
          valueProposition: 'High-usage home specialists',
          companySize: 'Mid-size value provider'
        },
        {
          name: 'Discount Power',
          slug: 'discount-power',
          rating: 3.8,
          plans: 10,
          specialization: 'Affordable plans with bill credit options',
          strengths: ['Bill Credit Bundle', '90 Day Guarantee', 'Small-Medium Homes', 'Affordable'],
          serviceStates: ['Texas'],
          valueProposition: 'Budget-conscious options',
          companySize: 'Value-oriented provider'
        }
      ]
    },
    {
      id: 'tech',
      title: 'Technology & Innovation',
      subtitle: 'Smart Home Integration',
      icon: Battery,
      color: 'indigo',
      description: 'Forward-thinking companies with smart home features, apps, and technology integration',
      marketShare: '18%',
      avgRating: '4.2',
      topCompanies: ['Rhythm Energy', 'Reliant Energy', 'TXU Energy'],
      expertise: ['Smart Home Integration', 'Mobile Apps', 'Usage Analytics', 'IoT Connectivity'],
      companies: [
        {
          name: 'Rhythm Energy',
          slug: 'rhythm-energy',
          rating: 4.4,
          plans: 12,
          specialization: 'Smart alerts, flexible billing, and modern technology',
          strengths: ['Smart Alerts', 'Flexible Billing', 'Modern App', 'Usage Analytics'],
          serviceStates: ['Texas'],
          techFeatures: 'Top app and smart features',
          companySize: 'Tech-focused innovator'
        },
        {
          name: 'Reliant Energy',
          slug: 'reliant-energy', 
          rating: 4.1,
          plans: 15,
          specialization: 'Google Nest, Ring & smart device bundles',
          strengths: ['Smart Device Bundles', 'Nest Integration', 'Connected Home', 'Energy Monitoring'],
          serviceStates: ['Texas'],
          techFeatures: 'Smart home device partnerships',
          companySize: 'Large provider with tech focus'
        },
        {
          name: 'TXU Energy',
          slug: 'txu-energy',
          rating: 4.0,
          plans: 18,
          specialization: 'Online tools and digital account management',
          strengths: ['Digital Tools', 'Online Management', 'Mobile App', 'Account Control'],
          serviceStates: ['Texas'],
          techFeatures: 'Comprehensive digital platform',
          companySize: 'Large tech-enabled provider'
        }
      ]
    },
    {
      id: 'local',
      title: 'Texas-Based Companies',
      subtitle: 'Local Support & Community Focus',
      icon: Heart,
      color: 'red',
      description: 'Texas-owned and operated companies with local offices and community investment',
      marketShare: '25%',
      avgRating: '4.2',
      topCompanies: ['Reliant Energy', '4Change Energy', 'Champion Energy'],
      expertise: ['Local Knowledge', 'Community Investment', 'Regional Expertise', 'Texas Focus'],
      companies: [
        {
          name: 'Reliant Energy',
          slug: 'reliant-energy',
          rating: 4.1,
          plans: 15,
          specialization: 'Houston headquarters with Texas offices statewide',
          strengths: ['Houston HQ', 'Texas Offices', 'Local Jobs', 'Community Investment'],
          serviceStates: ['Texas'],
          localPresence: 'Houston headquarters, multiple TX offices',
          companySize: 'Major Texas employer'
        },
        {
          name: '4Change Energy',
          slug: '4change-energy',
          rating: 3.9,
          plans: 8,
          specialization: 'Dallas-based with local charity support',
          strengths: ['Dallas-Based', 'Local Charities', 'Community Focus', 'Texas-Focused'],
          serviceStates: ['Texas'],
          localPresence: 'Dallas-based with community programs',
          companySize: 'Local Texas company'
        },
        {
          name: 'Champion Energy',
          slug: 'champion-energy',
          rating: 4.6,
          plans: 10,
          specialization: 'Texas-focused with local call centers',
          strengths: ['Local Centers', 'Texas Focus', 'Community Engagement', 'Local Support'],
          serviceStates: ['Texas'],
          localPresence: 'Texas call centers and support',
          companySize: 'Regional service leader'
        }
      ]
    }
  ];

  const filteredCategories = selectedCategory === 'all' 
    ? companyCategories 
    : companyCategories.filter(cat => cat.id === selectedCategory);

  const allCompanies = mockProviders.filter(provider => {
    if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stateHubs = [
    {
      state: 'Texas',
      slug: 'texas', 
      companies: 15,
      topCities: ['Houston', 'Dallas', 'Austin', 'Fort Worth'],
      avgRating: 4.1,
      marketType: 'Deregulated',
      specialties: ['Green Energy', 'Customer Service', 'Value', 'Technology']
    },
    {
      state: 'Pennsylvania',
      slug: 'pennsylvania',
      companies: 8, 
      topCities: ['Philadelphia', 'Pittsburgh', 'Allentown'],
      avgRating: 4.0,
      marketType: 'Deregulated',
      specialties: ['Service Quality', 'Fixed Rates', 'Home Protection', 'Business Plans']
    }
  ];

  const companyAnalysis = [
    {
      metric: 'Company Specialization',
      importance: 'Critical',
      description: 'Different companies excel in different areas. Choose based on your priorities.',
      factors: ['Green energy expertise', 'Customer service quality', 'Rate competitiveness', 'Technology features']
    },
    {
      metric: 'Service Area Coverage',
      importance: 'Essential', 
      description: 'Ensure the company serves your specific address and offers full plan portfolio.',
      factors: ['Geographic coverage', 'Utility territory service', 'Plan availability', 'Local support']
    },
    {
      metric: 'Customer Satisfaction',
      importance: 'High',
      description: 'Real customer reviews and satisfaction scores indicate service quality.',
      factors: ['Customer ratings', 'Review volume', 'Complaint resolution', 'Satisfaction trends']
    },
    {
      metric: 'Financial Stability',
      importance: 'Important',
      description: 'Choose established companies with strong financial backing and track records.',
      factors: ['Company history', 'Financial strength', 'Regulatory compliance', 'Market presence']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Building className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Electricity Companies
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Comprehensive analysis of electricity companies by specialization, market position, and expertise. 
              Find the right company for your needs with our expert categorization and intelligence.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{mockProviders.length}</div>
                <div className="text-blue-200 text-sm">Licensed Companies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-blue-200 text-sm">Specializations</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">4.2★</div>
                <div className="text-blue-200 text-sm">Avg Rating</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Expert</div>
                <div className="text-blue-200 text-sm">Analysis</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Find companies serving your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Company Intelligence Categories */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Company Intelligence by Specialization
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert analysis of electricity companies organized by their core competencies and market specializations
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
              All Specializations
            </button>
            {companyCategories.map(category => (
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
        </div>

        {/* Company Specialization Analysis */}
        <div className="space-y-12 mb-16">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${category.color}-100 text-${category.color}-600 rounded-lg mb-4`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
                <h3 className="text-lg text-gray-600 mb-3">{category.subtitle}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto mb-6">{category.description}</p>
                
                {/* Category Analytics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{category.marketShare}</div>
                    <div className="text-sm text-gray-600">Market Share</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{category.avgRating}★</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-texas-navy">{category.companies.length}</div>
                    <div className="text-sm text-gray-600">Top Companies</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{category.expertise.length}</div>
                    <div className="text-sm text-gray-600">Expertise Areas</div>
                  </div>
                </div>
              </div>

              {/* Expertise Areas */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Core Expertise Areas</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  {category.expertise.map((area, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{area}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Analysis */}
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
                        <span className="text-gray-500 text-sm ml-1">• {company.plans} plans</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">{company.specialization}</p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Company Intelligence:</h5>
                        <div className="text-sm text-gray-600">
                          <div>Size: {company.companySize || company.serviceHighlights || company.valueProposition || company.techFeatures || company.localPresence}</div>
                          <div>Service: {company.serviceStates.join(', ')}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Core Strengths:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {company.strengths.map((strength, sIndex) => (
                            <div key={sIndex} className="flex items-center text-xs text-gray-600">
                              <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                              {strength}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/providers/${company.slug}`)}
                        className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
                      >
                        Company Intelligence Report
                      </button>
                      <button
                        onClick={() => navigate(`/compare/companies/${company.slug}`)}
                        className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Compare vs Competitors
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => navigate(`/companies/category/${category.id}`)}
                  className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
                >
                  View All {category.title} Companies
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Company Analysis Framework */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Our Company Analysis Framework
          </h2>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {companyAnalysis.map((factor, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg mb-6 ${
                  factor.importance === 'Critical' ? 'bg-red-100 text-texas-red' :
                  factor.importance === 'Essential' ? 'bg-orange-100 text-orange-600' :
                  factor.importance === 'High' ? 'bg-texas-cream text-texas-navy' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <Eye className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{factor.metric}</h3>
                <div className={`text-sm font-medium mb-3 ${
                  factor.importance === 'Critical' ? 'text-texas-red' :
                  factor.importance === 'Essential' ? 'text-orange-600' :
                  factor.importance === 'High' ? 'text-texas-navy' :
                  'text-purple-600'
                }`}>
                  {factor.importance} Factor
                </div>
                <p className="text-gray-600 text-sm mb-4">{factor.description}</p>
                
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 mb-2">Analysis Factors:</div>
                  <ul className="space-y-1">
                    {factor.factors.map((item, fIndex) => (
                      <li key={fIndex} className="text-xs text-gray-600">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State & City Company Hubs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Companies by Market & Location
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {stateHubs.map((hub) => (
              <div key={hub.slug} className="bg-white rounded-lg shadow-sm border p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{hub.state} Company Analysis</h3>
                    <p className="text-gray-600">{hub.marketType} market with {hub.companies} licensed companies</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-texas-navy">{hub.avgRating}★</div>
                    <div className="text-sm text-gray-500">avg rating</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{hub.companies}</div>
                    <div className="text-sm text-gray-600">Licensed Companies</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{hub.topCities.length}</div>
                    <div className="text-sm text-gray-600">Major Markets</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Market Specializations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {hub.specialties.map((specialty) => (
                      <span key={specialty} className="px-2 py-1 bg-texas-navy/10 text-texas-navy text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Key Markets:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {hub.topCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => navigate(`/${hub.slug}/${city.toLowerCase().replace(' ', '-')}/electricity-companies`)}
                        className="text-sm text-texas-navy hover:text-texas-navy text-left p-2 hover:bg-texas-cream-200 rounded"
                      >
                        {city} Companies →
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/${hub.slug}/electricity-companies`)}
                    className="bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
                  >
                    {hub.state} Companies
                  </button>
                  <button
                    onClick={() => navigate(`/compare/companies?state=${hub.slug}`)}
                    className="border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Compare Companies
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Company Directory */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Company Directory</h2>
              <p className="text-gray-600">Browse all {mockProviders.length} licensed electricity companies</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="plans">Most Plans</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCompanies.slice(0, 9).map((company) => (
              <ProviderCard
                key={company.id}
                provider={company}
                onViewDetails={() => navigate(`/providers/${company.slug}`)}
                onCompare={() => navigate(`/compare/companies`)}
                showPlans
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/providers')}
              className="bg-texas-navy text-white px-8 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium"
            >
              View Complete Directory & Analysis
            </button>
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Electricity Plans</h3>
            <p className="text-gray-600 text-sm mb-4">Master guide to plan types and selection strategy</p>
            <button
              onClick={() => navigate('/electricity-plans')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Master Plan Selection →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Rates</h3>
            <p className="text-gray-600 text-sm mb-4">Live market analysis and rate intelligence</p>
            <button
              onClick={() => navigate('/compare/rates')}
              className="text-texas-navy hover:text-texas-navy font-medium text-sm"
            >
              Analyze Market Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Rankings</h3>
            <p className="text-gray-600 text-sm mb-4">Expert rankings and category winners</p>
            <button
              onClick={() => navigate('/best')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              View Expert Rankings →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Find by Location</h3>
            <p className="text-gray-600 text-sm mb-4">Location-specific company analysis</p>
            <button
              onClick={() => navigate('/locations')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              Browse by Location →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElectricityCompaniesPage;