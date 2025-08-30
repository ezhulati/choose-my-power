import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { TrendingDown, Calculator, Award, Clock, Shield, Star, DollarSign } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CheapestElectricityLandingPageProps {
  city?: string;
  state?: string;
}

export function CheapestElectricityLandingPage({ city, state }: CheapestElectricityLandingPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [monthlyUsage, setMonthlyUsage] = useState('1000');

  const stateData = state ? mockStates.find(s => s.slug === state) : null;
  const cityData = stateData?.topCities.find(c => c.slug === city);
  
  // Get relevant providers
  const relevantProviders = state 
    ? mockProviders.filter(p => p.serviceStates.includes(state))
    : mockProviders;

  // Filter by city if specified
  const finalProviders = city && cityData 
    ? relevantProviders.filter(p => cityData.topProviders.includes(p.id))
    : relevantProviders;

  // Get all plans and sort by rate
  const allPlans = finalProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  const cheapestPlans = allPlans.sort((a, b) => a.rate - b.rate).slice(0, 6);
  const lowestRate = cheapestPlans[0]?.rate || 0;
  const averageRate = stateData?.averageRate || cityData?.averageRate || 12.5;
  const potentialSavings = Math.round((averageRate - lowestRate) * parseInt(monthlyUsage) / 100 * 12);

  const locationText = city && stateData 
    ? `${cityData?.name}, ${stateData.name}`
    : stateData?.name || 'Your Area';

  const pageTitle = city && stateData
    ? `Cheapest Electricity in ${cityData?.name} - Compare Lowest Rates`
    : stateData
    ? `Cheapest Electricity in ${stateData.name} - Find Lowest Rates`
    : 'Cheapest Electricity Rates - Compare & Save';

  const handleZipSearch = (zipCode: string) => {
    if (state && city) {
      navigate(`/${state}/${city}/${zipCode}`);
    } else if (state) {
      // Find city by ZIP
      const foundCity = stateData?.topCities.find(c => c.zipCodes.includes(zipCode));
      if (foundCity) {
        navigate(`/${state}/${foundCity.slug}/${zipCode}`);
      } else {
        navigate(`/${state}/electricity-providers`);
      }
    } else {
      navigate('/texas/houston/electricity-providers');
    }
  };

  const benefits = [
    {
      icon: TrendingDown,
      title: 'Competitive Rates',
      description: `Find rates starting at ${lowestRate}¢/kWh in ${locationText}`
    },
    {
      icon: Clock,
      title: 'Quick 5-Minute Switch',
      description: 'Sign up online and your new provider handles everything'
    },
    {
      icon: Shield,
      title: 'No Service Interruption',
      description: 'Switch providers without any disruption to your electricity'
    },
    {
      icon: Award,
      title: 'Trusted Providers Only',
      description: 'Our 14 providers are licensed and regulated'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {pageTitle}
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-4xl mx-auto">
              Compare the cheapest electricity rates in {locationText}. Find plans starting at {lowestRate}¢/kWh 
              and save up to ${potentialSavings}/year. Switch in 5 minutes with no service interruption.
            </p>

            {/* Savings Highlight */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 max-w-md mx-auto mb-8">
              <div className="text-green-200 text-sm mb-2">Potential Annual Savings:</div>
              <div className="text-4xl font-bold text-white mb-2">${potentialSavings}</div>
              <div className="text-green-200 text-sm">vs average {locationText} rate</div>
            </div>
            
            {/* ZIP Search */}
            <div className="mb-6">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                size="lg" 
                placeholder="Enter zip code"
              />
              <p className="text-green-200 text-sm mt-2">Get personalized rates for your exact address</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose the Cheapest Electricity Rates?
            </h2>
            <p className="text-xl text-gray-600">
              Save hundreds per year without sacrificing service quality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cheapest Plans Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cheapest Electricity Plans in {locationText}
            </h2>
            <p className="text-xl text-gray-600">
              Compare the lowest rates from {finalProviders.length} trusted providers
            </p>
          </div>

          {/* Usage Selector */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Calculate Your Savings - Select Monthly Usage:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {['500', '1000', '1500', '2000'].map((usage) => (
                  <button
                    key={usage}
                    onClick={() => setMonthlyUsage(usage)}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      monthlyUsage === usage
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{usage} kWh</div>
                    <div className="text-xs text-gray-600">
                      {usage === '500' ? 'Small' : usage === '1000' ? 'Average' : usage === '1500' ? 'Large' : 'Very Large'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cheapest Plans Grid */}
          <div className="space-y-4">
            {cheapestPlans.map((plan, index) => (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-texas-cream-2000'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Provider Info */}
                    <div className="flex items-center mr-6">
                      <img
                        src={plan.providerLogo}
                        alt={`${plan.providerName} logo`}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{plan.providerName}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm text-gray-600">{plan.providerRating} rating</span>
                        </div>
                      </div>
                    </div>

                    {/* Plan Details */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{plan.name}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        {plan.termLength} months • {plan.type} rate • {plan.renewablePercent}% renewable
                      </div>
                      
                      {/* Cost Breakdown */}
                      <div className="text-sm text-gray-600">
                        Monthly cost for {monthlyUsage} kWh: 
                        <span className="font-medium text-gray-900 ml-1">
                          ${((plan.rate * parseInt(monthlyUsage) / 100) + plan.fees.monthlyFee).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rate & CTA */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 mb-1">{plan.rate}¢</div>
                    <div className="text-sm text-gray-500 mb-3">per kWh</div>
                    
                    {index === 0 && (
                      <div className="bg-texas-gold-100 text-texas-navy text-xs font-medium px-2 py-1 rounded-full mb-3">
                        CHEAPEST
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate(`/providers/${plan.providerSlug}`)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Get This Rate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate(state ? `/${state}/electricity-providers` : '/providers')}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              View All {locationText} Providers →
            </button>
          </div>
        </div>
      </div>

      {/* How to Get Cheapest Rates */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Get the Cheapest Electricity Rates in {locationText}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Compare All Rates</h3>
              <p className="text-gray-600">
                Use our comparison tool to see all available rates in {locationText}. 
                Don't just look at the advertised rate - compare total monthly costs including fees.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Check Contract Terms</h3>
              <p className="text-gray-600">
                Read the fine print on contract length, cancellation fees, and rate changes. 
                The cheapest introductory rate isn't always the best long-term value.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Switch & Save</h3>
              <p className="text-gray-600">
                Sign up online with your chosen provider. They handle the entire switching process 
                and you start saving immediately with no interruption to your service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions About Cheap Electricity
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What's the cheapest electricity rate in {locationText}?
              </h3>
              <p className="text-gray-600">
                The lowest electricity rate currently available in {locationText} is {lowestRate}¢ per kWh. 
                However, you should compare total monthly costs including fees, not just the per-kWh rate.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Are cheap electricity rates reliable?
              </h3>
              <p className="text-gray-600">
                Yes, all electricity providers {stateData?.isDeregulated ? `in ${stateData.name} are licensed and regulated by the state` : 'are subject to strict regulations'}. 
                The electricity you receive is the same regardless of provider - only the rate and customer service differ.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How much can I save with the cheapest electricity rate?
              </h3>
              <p className="text-gray-600">
                Based on average usage in {locationText}, switching to the cheapest available rate could save you 
                approximately ${potentialSavings} per year compared to the area average rate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Saving Today</h2>
          <p className="text-xl mb-8 text-green-100">
            Join thousands of {locationText} residents who have switched to cheaper electricity rates.
          </p>
          <div className="max-w-md mx-auto">
            <ZipCodeSearch 
              onSearch={handleZipSearch} 
              placeholder="Enter zip code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}