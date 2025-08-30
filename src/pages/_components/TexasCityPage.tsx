import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { MapPin, TrendingDown, Users, Zap, Calculator, Star, Award, Clock, Filter, Phone, Globe, Building, Calendar, Shield, Leaf } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TexasCityPageProps {
  city: string;
}

export function TexasCityPage({ city }: TexasCityPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popularity'>('rating');
  const [showCalculator, setShowCalculator] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState('1000');

  const texasData = mockStates.find(s => s.slug === 'texas')!;
  const cityData = texasData.topCities.find(c => c.slug === city);
  
  if (!cityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Texas City Not Found</h1>
          <p className="text-gray-600 mb-8">
            We're working to add more Texas cities. Meanwhile, explore all Texas providers and rates.
          </p>
          <button
            onClick={() => navigate('/texas/electricity-providers')}
            className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors"
          >
            View All Texas Providers
          </button>
        </div>
      </div>
    );
  }

  const cityProviders = mockProviders.filter(p => 
    cityData.topProviders.includes(p.id)
  );

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/${city}/${zipCode}/electricity-providers`);
  };

  const lowestRate = Math.min(...cityProviders.flatMap(p => p.plans.map(plan => plan.rate)));
  const avgRate = cityData.averageRate;
  const potentialSavings = Math.round((avgRate - lowestRate) * parseInt(monthlyUsage) / 100 * 12);

  const cityQuickLinks = [
    { name: `${cityData.name} Electricity Providers`, href: `/texas/${city}/electricity-providers`, icon: Users },
    { name: `${cityData.name} Electricity Rates`, href: `/texas/${city}/electricity-rates`, icon: TrendingDown },
    { name: `${cityData.name} Electricity Plans`, href: `/texas/${city}/electricity-plans`, icon: Zap },
    { name: `Switch Providers in ${cityData.name}`, href: `/texas/${city}/switch-provider`, icon: Calendar },
    { name: `No Deposit Plans ${cityData.name}`, href: `/texas/${city}/no-deposit-electricity`, icon: Shield },
    { name: `${cityData.name} Rate Calculator`, href: `/rates/calculator?city=${city}`, icon: Calculator }
  ];

  const neighboringCities = texasData.topCities
    .filter(c => c.id !== cityData.id)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO-Optimized Header */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="text-sm text-red-200 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-white">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/texas')} className="hover:text-white">Texas</button>
            <span className="mx-2">/</span>
            <span>{cityData.name}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {cityData.name} Electricity Options
              </h1>
              
              <p className="text-lg text-red-100 mb-6">
                Moving to {cityData.name}? Here's why transferring your old plan usually backfires: Your old rate was based on your OLD home's size. "Fixed" rates aren't fixed—they change with usage. A plan for a 2-bedroom apartment costs way more in a 4-bedroom house. We found {cityProviders.length} licensed electricity companies that actually work for your new {cityData.name} home.
              </p>

              {/* Enhanced Key Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold">{lowestRate}¢</div>
                  <div className="text-red-200 text-sm">Lowest Rate</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold">{cityProviders.length}</div>
                  <div className="text-red-200 text-sm">Providers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold">${potentialSavings}</div>
                  <div className="text-red-200 text-sm">Avg Savings/Year</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold">
                    {((avgRate - lowestRate) / avgRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-red-200 text-sm">Potential Savings</div>
                </div>
              </div>
            </div>

            {/* ZIP Search Sidebar */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg h-fit">
              <h3 className="text-lg font-semibold mb-4">Get Exact Rates for Your Address</h3>
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
              />
              <div className="mt-4 text-sm text-red-200">
                <div className="font-medium mb-2">Popular {cityData.name} ZIP Codes:</div>
                <div className="grid grid-cols-2 gap-2">
                  {cityData.zipCodes.slice(0, 4).map((zip) => (
                    <button
                      key={zip}
                      onClick={() => handleZipSearch(zip)}
                      className="text-white hover:text-red-200 hover:underline text-sm"
                    >
                      {zip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {cityData.name} Electricity Resources
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cityQuickLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.href)}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 hover:text-texas-red transition-colors group"
              >
                <link.icon className="h-5 w-5 mb-2 text-gray-400 group-hover:text-texas-red" />
                <span className="text-xs font-medium text-center">{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Providers Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {cityProviders.length} Electricity Companies in {cityData.name}
            </h2>
            <button
              onClick={() => navigate(`/compare/providers?city=${city}&state=texas`)}
              className="bg-texas-red text-white px-4 py-2 rounded-lg hover:bg-texas-red-600 transition-colors"
            >
              Compare Licensed Companies
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onViewDetails={() => navigate(`/providers/${provider.slug}`)}
                onCompare={() => navigate(`/compare/providers`)}
                showPlans
              />
            ))}
          </div>
        </div>

        {/* City Information & SEO Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              About {cityData.name} Electricity Market
            </h3>
            
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>{cityData.name} electricity customers have choice.</strong> As part of Texas's deregulated market, 
                {cityData.name}'s {cityData.population.toLocaleString()} residents can choose from {cityProviders.length} 
                competitive electricity providers.
              </p>
              
              <p>
                The average electricity rate in {cityData.name} is {avgRate}¢ per kWh, with rates ranging from {lowestRate}¢ 
                to {Math.max(...cityProviders.flatMap(p => p.plans.map(plan => plan.rate)))}¢ per kWh depending on the 
                provider and plan you choose.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{cityData.name} ZIP Codes Served:</h4>
                <div className="flex flex-wrap gap-2">
                  {cityData.zipCodes.map((zip) => (
                    <span key={zip} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                      {zip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate(`/texas/${city}/electricity-providers`)}
                  className="text-texas-red hover:text-red-800 font-medium"
                >
                  View all {cityData.name} providers →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              How to Choose Electricity in {cityData.name}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="bg-texas-red text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
                <div>
                  <div className="font-medium text-gray-900">Compare {cityData.name} Providers</div>
                  <div className="text-gray-600 text-sm">Review rates, plans, and customer reviews from all available providers</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="bg-texas-red text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
                <div>
                  <div className="font-medium text-gray-900">Calculate Your Costs</div>
                  <div className="text-gray-600 text-sm">Use your actual monthly usage to see real costs, not just advertised rates</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="bg-texas-red text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
                <div>
                  <div className="font-medium text-gray-900">Choose Your Plan</div>
                  <div className="text-gray-600 text-sm">Select based on rate type, contract length, and green energy preferences</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="bg-texas-red text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
                <div>
                  <div className="font-medium text-gray-900">Sign Up & Switch</div>
                  <div className="text-gray-600 text-sm">Your new provider handles the switch - no service interruption</div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => navigate(`/texas/${city}/switch-provider`)}
                className="w-full bg-texas-red text-white py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium"
              >
                Complete {cityData.name} Switching Guide
              </button>
            </div>
          </div>
        </div>

        {/* Popular Plans in City */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Electricity Plans in {cityData.name}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors">
              <div className="flex items-center mb-4">
                <TrendingDown className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">Cheapest Plans</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Find the lowest electricity rates available in {cityData.name}. Ideal for budget-conscious customers.
              </p>
              <button
                onClick={() => navigate(`/cheapest-electricity-${city}`)}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Find Cheapest Rates
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors">
              <div className="flex items-center mb-4">
                <Leaf className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">Green Energy</h4>
              </div>
              <p className="text-gray-600 mb-4">
                100% renewable electricity plans powered by Texas wind and solar energy.
              </p>
              <button
                onClick={() => navigate(`/shop/green-energy?city=${city}`)}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                View Green Plans
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-texas-navy mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">No Deposit</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Start electricity service in {cityData.name} without paying a security deposit.
              </p>
              <button
                onClick={() => navigate(`/texas/${city}/no-deposit-electricity`)}
                className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
              >
                No Deposit Options
              </button>
            </div>
          </div>
        </div>

        {/* Nearby Cities */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Other Texas Cities Near {cityData.name}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {neighboringCities.map((nearbyCity) => (
              <button
                key={nearbyCity.id}
                onClick={() => navigate(`/texas/${nearbyCity.slug}`)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-texas-red mr-2" />
                    <span className="font-medium text-gray-900">{nearbyCity.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{nearbyCity.averageRate}¢/kWh</span>
                </div>
                <div className="text-sm text-gray-600">
                  {nearbyCity.population.toLocaleString()} residents • {nearbyCity.topProviders.length} providers
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/texas')}
              className="text-texas-red hover:text-red-800 font-medium"
            >
              View All Texas Cities →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}