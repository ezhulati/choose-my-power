import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { getProviders, getCities, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import { CheckCircle, Clock, Shield, Phone, ArrowRight, Users, AlertCircle } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CitySwitchProviderPageProps {
  state: string;
  city: string;
}

export function CitySwitchProviderPage({ state, city }: CitySwitchProviderPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [cities, setCities] = useState<RealCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [providersData, citiesData] = await Promise.all([
          getProviders(state),
          getCities(state)
        ]);
        setProviders(providersData);
        setCities(citiesData);
      } catch (error) {
        console.error('[CitySwitchProviderPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [state, city]);

  const stateData = {
    slug: state,
    name: state.charAt(0).toUpperCase() + state.slice(1),
    averageRate: providers.length > 0 ? (providers.reduce((sum, p) => sum + (p.averageRate || 12.5), 0) / providers.length).toFixed(1) : '12.5',
    isDeregulated: state === 'texas'
  };
  const cityData = cities.find(c => c.slug === city);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-texas-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider switching info for {city}...</p>
        </div>
      </div>
    );
  }
  
  if (!cityData || providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <button
            onClick={() => navigate(`/${state}/switch-provider`)}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            View {stateData?.name || 'State'} Switching Guide
          </button>
        </div>
      </div>
    );
  }

  const handleZipSearch = (zipCode: string) => {
    navigate(`/${state}/${city}/${zipCode}/electricity-providers`);
  };

  const steps = [
    {
      number: 1,
      title: 'Compare Your Options',
      description: `Research electricity providers available in ${cityData.name}`,
      details: [
        'Compare rates from all available providers',
        'Read customer reviews and ratings',
        'Check contract terms and fees',
        'Consider green energy options'
      ]
    },
    {
      number: 2,
      title: 'Choose Your New Plan',
      description: 'Select the provider and plan that best fits your needs',
      details: [
        'Consider your monthly usage patterns',
        'Decide on contract length',
        'Review all fees and charges',
        'Understand cancellation terms'
      ]
    },
    {
      number: 3,
      title: 'Sign Up Online',
      description: 'Complete enrollment with your chosen provider',
      details: [
        'Provide contact and account information',
        'Schedule your service start date',
        'Set up automatic payments',
        'Receive confirmation details'
      ]
    },
    {
      number: 4,
      title: 'Automatic Switch',
      description: 'Your new provider handles the entire process',
      details: [
        'Provider contacts your current company',
        'Switch is scheduled automatically',
        'No interruption to your service',
        'Receive final bill from old provider'
      ]
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: 'Free to Switch',
      description: `Switching electricity providers in ${cityData.name} is completely free`
    },
    {
      icon: Clock,
      title: 'Quick Process',
      description: 'Complete switch in 1-2 billing cycles with no service interruption'
    },
    {
      icon: Shield,
      title: 'Protected Process',
      description: 'Regulated switching process ensures your rights are protected'
    },
    {
      icon: Users,
      title: 'No Hassle',
      description: 'Your new provider manages the entire switching process'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate(`/${state}/switch-provider`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name} Switch Provider</span>
          </nav>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Switch Electricity Providers in {cityData.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Switching electricity providers in {cityData.name}, {stateData.name} is free and easy. 
              Follow our step-by-step guide to find a better rate and change providers without any service interruption.
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Benefits of Switching in {cityData.name}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            4 Simple Steps to Switch in {cityData.name}
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-texas-navy text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {step.number}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>

                      {step.number === 1 && (
                        <div className="mt-4">
                          <button
                            onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
                            className="bg-texas-navy text-white px-4 py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium inline-flex items-center"
                          >
                            Compare {cityData.name} Providers
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Information */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-texas-navy mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">{cityData.name} Specific Information</h3>
            </div>
            
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Population:</strong> {cityData.population.toLocaleString()} residents can choose their electricity provider
              </p>
              <p>
                <strong>Average Rate:</strong> Current average rate in {cityData.name} is {cityData.averageRate}¢ per kWh
              </p>
              <p>
                <strong>Available Providers:</strong> {cityData.topProviders.length} licensed providers serve {cityData.name}
              </p>
              <p>
                <strong>Service Areas:</strong> All {cityData.name} ZIP codes are served by multiple providers
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Need Help?</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{stateData.name} Public Utilities Commission</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Contact the state regulator for questions about switching or filing complaints.
                </p>
                <button
                  onClick={() => navigate('/resources/support/regulatory-contacts')}
                  className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                >
                  Get Contact Information →
                </button>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Local Support</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Get help choosing the right provider for your {cityData.name} home or business.
                </p>
                <button
                  onClick={() => navigate('/resources/support/contact')}
                  className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                >
                  Contact Our Team →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-texas-navy text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Switch in {cityData.name}?</h2>
          <p className="text-blue-100 mb-6">
            Compare electricity providers serving {cityData.name} and start saving today.
          </p>
          <button
            onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
            className="bg-white text-texas-navy px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Compare {cityData.name} Providers
          </button>
        </div>
      </div>
    </div>
  );
}