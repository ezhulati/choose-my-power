import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { 
  TrendingDown, Leaf, Shield, Clock, Zap, Calculator, Users, Award, 
  DollarSign, Star, CheckCircle, Target, ArrowRight, Filter,
  Heart, Battery, Building, Globe, Home, Headphones
} from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ShopPageProps {
  category?: string;
}

export function ShopPage({ category }: ShopPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedUsage, setSelectedUsage] = useState<'low' | 'average' | 'high'>('average');
  const [selectedPriority, setSelectedPriority] = useState<'price' | 'service' | 'green' | 'features'>('price');

  const shopCategories = {
    'cheapest-electricity': {
      title: 'Find the Cheapest Electricity Rates',
      subtitle: 'Lowest Cost Options',
      description: 'Compare the absolute lowest electricity rates from trusted providers. Save hundreds per year.',
      icon: TrendingDown,
      color: 'green',
      features: [
        'Lowest rates starting at 9.7¢/kWh',
        'Total cost analysis including all fees',
        'Bill credit opportunities',
        'No hidden charges guarantee'
      ]
    },
    'best-electricity-providers': {
      title: 'Best Electricity Providers by Category',
      subtitle: 'Expert-Ranked Companies',
      description: 'Top-rated electricity companies ranked by specialization. Find providers that excel in what matters to you.',
      icon: Award,
      color: 'blue',
      features: [
        'Expert rankings by category',
        'Customer service champions',
        'Green energy specialists',
        'Technology innovation leaders'
      ]
    },
    'green-energy': {
      title: 'Green Energy Plans - 100% Renewable',
      subtitle: 'Environmental Champions',
      description: 'Find 100% renewable electricity plans powered by Texas wind and solar energy.',
      icon: Leaf,
      color: 'green',
      features: [
        '100% wind and solar power',
        'Competitive green energy rates',
        'Environmental impact tracking',
        'Green energy certificates included'
      ]
    },
    'no-deposit-electricity': {
      title: 'No Deposit Electricity Plans',
      subtitle: 'Start Service Without Deposits',
      description: 'Get electricity service without paying security deposits. Perfect for renters and new residents.',
      icon: Shield,
      color: 'purple',
      features: [
        'No security deposit required',
        'Same-day service available',
        'Credit-friendly options',
        'Flexible contract terms'
      ]
    }
  };

  const currentCategory = category ? shopCategories[category as keyof typeof shopCategories] : null;

  const shoppingByPriority = [
    {
      id: 'price',
      title: 'Shop by Lowest Price',
      icon: TrendingDown,
      color: 'green',
      description: 'Find the absolute cheapest electricity rates and plans',
      options: [
        { name: 'Cheapest Overall Rates', href: '/shop/cheapest-electricity', price: '9.7¢/kWh' },
        { name: 'Best Value Fixed Plans', href: '/shop/cheapest-fixed-rates', price: '10.1¢/kWh' },
        { name: 'Low-Cost Green Energy', href: '/shop/cheapest-green-energy', price: '9.8¢/kWh' },
        { name: 'Budget Prepaid Plans', href: '/shop/cheapest-prepaid', price: '12.5¢/kWh' }
      ]
    },
    {
      id: 'service',
      title: 'Shop by Service Quality',
      icon: Headphones,
      color: 'blue',
      description: 'Find providers with exceptional customer service and support',
      options: [
        { name: 'Top Customer Service', href: '/shop/best-customer-service', rating: '4.6★ Champion Energy' },
        { name: 'Local Texas Support', href: '/shop/local-support', rating: '4.4★ Reliant Energy' },
        { name: 'Satisfaction Guarantees', href: '/shop/satisfaction-guarantee', rating: '60-Day TXU Energy' },
        { name: '24/7 Support Available', href: '/shop/24-7-support', rating: '4.2★ Multiple Providers' }
      ]
    },
    {
      id: 'green',
      title: 'Shop by Environmental Impact',
      icon: Leaf,
      color: 'green',
      description: 'Find 100% renewable and environmentally friendly options',
      options: [
        { name: '100% Wind & Solar Plans', href: '/shop/green-energy', green: '100% Renewable' },
        { name: 'Solar Buyback Programs', href: '/shop/solar-buyback', green: 'Sell Back to Grid' },
        { name: 'Carbon Neutral Options', href: '/shop/carbon-neutral', green: 'Net Zero Impact' },
        { name: 'Green Energy Champions', href: '/shop/green-companies', green: 'Environmental Leaders' }
      ]
    },
    {
      id: 'features',
      title: 'Shop by Special Features',
      icon: Star,
      color: 'purple',
      description: 'Find plans with unique features and benefits',
      options: [
        { name: 'Free Nights & Weekends', href: '/shop/free-nights', feature: 'Free 9PM-6AM' },
        { name: 'Smart Home Integration', href: '/shop/smart-home', feature: 'Nest, Ring Compatible' },
        { name: 'Bill Credit Rewards', href: '/shop/bill-credits', feature: 'Up to $125/month' },
        { name: 'No Contract Plans', href: '/shop/no-contract', feature: 'Month-to-Month' }
      ]
    }
  ];

  const usageProfiles = {
    low: { kwh: 500, description: 'Small apartments, minimal usage', bill: '$65' },
    average: { kwh: 1000, description: 'Typical homes, moderate usage', bill: '$120' },
    high: { kwh: 2000, description: 'Large homes, high usage', bill: '$240' }
  };

  const handleZipSearch = (zipCode: string) => {
    if (category) {
      navigate(`/texas/houston/electricity-providers?category=${category}`);
    } else {
      navigate(`/texas/houston/electricity-providers`);
    }
  };

  if (currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Category-Specific Header */}
        <div className={`bg-gradient-to-br from-${currentCategory.color}-600 via-${currentCategory.color}-700 to-${currentCategory.color}-800 text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <nav className="text-sm text-white/80 mb-6">
              <button onClick={() => navigate('/')} className="hover:text-white">Home</button>
              <span className="mx-2">/</span>
              <button onClick={() => navigate('/shop')} className="hover:text-white">Shop</button>
              <span className="mx-2">/</span>
              <span>{currentCategory.title}</span>
            </nav>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-6">
                <currentCategory.icon className="h-8 w-8" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {currentCategory.title}
              </h1>
              <h2 className="text-xl text-white/90 mb-4">{currentCategory.subtitle}</h2>
              
              <p className="text-lg mb-8 text-white/80 max-w-3xl mx-auto">
                {currentCategory.description}
              </p>

              <div className="max-w-md mx-auto mb-8">
                <ZipCodeSearch 
                  onSearch={handleZipSearch} 
                  placeholder="Enter ZIP code to see options"
                  size="lg"
                />
              </div>

              {/* Category Features */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {currentCategory.features.map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg">
                    <div className="text-sm font-medium">{feature}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category-Specific Tools */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Find Your Perfect {currentCategory.title.split(' ')[0]} Option
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Usage Profile */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Usage Profile</h3>
                <div className="space-y-3">
                  {Object.entries(usageProfiles).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedUsage(key as any)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        selectedUsage === key
                          ? `border-${currentCategory.color}-600 bg-${currentCategory.color}-50`
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{profile.kwh} kWh/month</div>
                          <div className="text-sm text-gray-600">{profile.description}</div>
                        </div>
                        <div className="text-lg font-bold text-green-600">{profile.bill}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalized Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommendations for {usageProfiles[selectedUsage].description}
                </h3>
                <div className="space-y-4">
                  {category === 'cheapest-electricity' && (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-900">APGE SimpleSaver 11</div>
                        <div className="text-green-700 text-sm">9.7¢/kWh • No hidden fees • $100 bill credit</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900">Gexa Eco Saver Plus</div>
                        <div className="text-blue-700 text-sm">9.8¢/kWh • 100% green • $125 usage credit</div>
                      </div>
                    </>
                  )}
                  
                  {category === 'green-energy' && (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-900">Rhythm Energy Plans</div>
                        <div className="text-green-700 text-sm">100% renewable • Flexible billing • Smart alerts</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900">Green Mountain Energy</div>
                        <div className="text-blue-700 text-sm">Pollution-free plans • Wind power • Conserve & save</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => handleZipSearch('77001')}
                className={`bg-${currentCategory.color}-600 text-white px-8 py-3 rounded-lg hover:bg-${currentCategory.color}-700 transition-colors font-medium`}
              >
                Find My {currentCategory.title.split(' ')[0]} Options
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main shop directory
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Zap className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Shop Electricity - Find Your Perfect Match
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Shop electricity by what matters most to you. Whether you want the cheapest rates, 
              best service, green energy, or special features - find exactly what you need.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">9.7¢</div>
                <div className="text-blue-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-200 text-sm">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">300+</div>
                <div className="text-blue-200 text-sm">Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-blue-200 text-sm">To Shop</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code to start shopping"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Get personalized shopping results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Shopping by Priority */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shop by What Matters Most to You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Different priorities require different approaches. Choose your main focus to see the best options.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {shoppingByPriority.map(priority => (
              <button
                key={priority.id}
                onClick={() => setSelectedPriority(priority.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPriority === priority.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {priority.title.replace('Shop by ', '')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {shoppingByPriority.map((priority) => (
              <div key={priority.id} className={`bg-white rounded-lg shadow-sm border p-6 ${
                selectedPriority === priority.id ? 'ring-2 ring-blue-500' : ''
              }`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${priority.color}-100 text-${priority.color}-600 rounded-lg mb-6`}>
                  <priority.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{priority.title}</h3>
                <p className="text-gray-600 mb-6">{priority.description}</p>
                
                <div className="space-y-3">
                  {priority.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(option.href)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-900">{option.name}</div>
                        <div className={`text-sm font-semibold text-${priority.color}-600`}>
                          {option.price || option.rating || option.green || option.feature}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Shopping Categories
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(shopCategories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => navigate(`/shop/${key}`)}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-lg mb-4`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cat.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{cat.description}</p>
                <div className="text-blue-600 font-medium text-sm flex items-center">
                  Shop Now <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Guide */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Smart Shopping Guide
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Define Your Priorities</h3>
              <p className="text-gray-600">
                Decide what matters most: lowest price, green energy, customer service, 
                or special features. This will guide your search.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Calculate Total Costs</h3>
              <p className="text-gray-600">
                Don't just compare rates per kWh. Include monthly fees, contract terms, 
                and your actual usage for true cost comparison.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Read the Fine Print</h3>
              <p className="text-gray-600">
                Check contract length, cancellation fees, and rate change policies. 
                Understand what you're agreeing to before signing up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}