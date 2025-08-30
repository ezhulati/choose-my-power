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
      title: 'Just Want It Cheap? We Get It.',
      subtitle: 'The Actually Cheapest Plans',
      description: 'No games. These are the lowest rates we found today. Not teaser rates. Not "if you use exactly 1000 kWh." Actually cheap.',
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
      title: 'Companies That Won\'t Make You Rage-Quit',
      subtitle: 'The Ones People Actually Like',
      description: 'These companies answer the phone. Fix problems. Don\'t surprise you with weird fees. Novel concept, right?',
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
      title: 'Green Energy Plans',
      subtitle: 'Actually From Wind & Solar',
      description: 'These plans buy real renewable energy credits from Texas wind and solar farms. Not just marketing fluff.',
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
      title: 'No $400 Deposit Required',
      subtitle: 'Keep Your Money',
      description: 'Why give them hundreds upfront? These plans let you start service without the deposit shakedown.',
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
      title: 'Just Want It Cheap',
      icon: TrendingDown,
      color: 'green',
      description: 'The actual lowest rates, not marketing tricks',
      options: [
        { name: 'Cheapest Overall Rates', href: '/shop/cheapest-electricity', price: '9.7¢/kWh' },
        { name: 'Best Value Fixed Plans', href: '/shop/cheapest-fixed-rates', price: '10.1¢/kWh' },
        { name: 'Low-Cost Green Energy', href: '/shop/cheapest-green-energy', price: '9.8¢/kWh' },
        { name: 'Budget Prepaid Plans', href: '/shop/cheapest-prepaid', price: '12.5¢/kWh' }
      ]
    },
    {
      id: 'service',
      title: 'Want Actual Service',
      icon: Headphones,
      color: 'blue',
      description: 'Companies that answer the phone and fix problems',
      options: [
        { name: 'Top Customer Service', href: '/shop/best-customer-service', rating: '4.6★ Champion Energy' },
        { name: 'Local Texas Support', href: '/shop/local-support', rating: '4.4★ Reliant Energy' },
        { name: 'Satisfaction Guarantees', href: '/shop/satisfaction-guarantee', rating: '60-Day TXU Energy' },
        { name: '24/7 Support Available', href: '/shop/24-7-support', rating: '4.2★ Multiple Providers' }
      ]
    },
    {
      id: 'green',
      title: 'Actually Want Green',
      icon: Leaf,
      color: 'green',
      description: 'Real renewable energy, not just marketing',
      options: [
        { name: '100% Wind & Solar Plans', href: '/shop/green-energy', green: '100% Renewable' },
        { name: 'Solar Buyback Programs', href: '/shop/solar-buyback', green: 'Sell Back to Grid' },
        { name: 'Carbon Neutral Options', href: '/shop/carbon-neutral', green: 'Net Zero Impact' },
        { name: 'Green Energy Champions', href: '/shop/green-companies', green: 'Environmental Leaders' }
      ]
    },
    {
      id: 'features',
      title: 'Want Something Specific',
      icon: Star,
      color: 'purple',
      description: 'Free nights, no contracts, other special stuff',
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
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {currentCategory.title}
              </h1>
              <h2 className="text-xl text-white/90 mb-4">{currentCategory.subtitle}</h2>
              
              <p className="text-lg mb-8 text-white/80 max-w-3xl mx-auto">
                {currentCategory.description}
              </p>

              <div className="max-w-md mx-auto mb-8">
                <ZipCodeSearch 
                  onSearch={handleZipSearch} 
                  placeholder="Enter zip code"
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
              Find Your Best {currentCategory.title.split(' ')[0]} Option
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
                      <div className="p-4 bg-texas-cream-200 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900">Gexa Eco Saver Plus</div>
                        <div className="text-texas-navy text-sm">9.8¢/kWh • 100% green • $125 usage credit</div>
                      </div>
                    </>
                  )}
                  
                  {category === 'green-energy' && (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-900">Rhythm Energy Plans</div>
                        <div className="text-green-700 text-sm">100% renewable • Flexible billing • Smart alerts</div>
                      </div>
                      <div className="p-4 bg-texas-cream-200 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900">Green Mountain Energy</div>
                        <div className="text-texas-navy text-sm">Pollution-free plans • Wind power • Conserve & save</div>
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
              Let's Find a Plan That Doesn't Suck
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              300+ plans is stupid. Tell us what you actually care about - cheap? green? not getting screwed? 
              We'll show you the 3-5 that make sense. Takes 2 minutes.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">9.7¢</div>
                <div className="text-blue-200 text-sm">Actually Cheapest</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">12-15</div>
                <div className="text-blue-200 text-sm">Good Companies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-blue-200 text-sm">Real Options</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">$0</div>
                <div className="text-blue-200 text-sm">No Sales Pitch</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-blue-200 text-sm mt-2">Shows what's actually available at your address</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Shopping by Priority */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Do You Actually Care About?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pick your top priority. We'll cut through the nonsense and show you what actually delivers.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {shoppingByPriority.map(priority => (
              <button
                key={priority.id}
                onClick={() => setSelectedPriority(priority.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPriority === priority.id
                    ? 'bg-texas-navy text-white'
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
            Or Browse by Category (If You Know What You Want)
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
                <div className="text-texas-navy font-medium text-sm flex items-center">
                  See Plans <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Guide */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Not Get Screwed (3 Simple Rules)
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Know Your One Thing</h3>
              <p className="text-gray-600">
                Pick what matters most. Cheapest? Green? Won't screw you? 
                Can't have everything, so pick your battle.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Do the Real Math</h3>
              <p className="text-gray-600">
                That 9.9¢ rate? Add the $9.95 monthly fee. The delivery charges. 
                Suddenly it's 14¢. We do this math for you.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Watch for Traps</h3>
              <p className="text-gray-600">
                Cancellation fee? Rate jumps after 3 months? Usage windows? 
                We flag this stuff so you don't get surprised.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}