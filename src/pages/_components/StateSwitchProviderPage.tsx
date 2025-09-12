import React, { useState, useEffect } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { getProviders, getCities, type RealProvider, type RealCity } from '../../lib/services/provider-service';
import { CheckCircle, Phone, AlertCircle, ArrowRight } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StateSwitchProviderPageProps {
  state: string;
}

export function StateSwitchProviderPage({ state }: StateSwitchProviderPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [currentStep, setCurrentStep] = useState(1);
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
        console.error('[StateSwitchProviderPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [state]);

  const stateData = {
    slug: state,
    name: state.charAt(0).toUpperCase() + state.slice(1),
    averageRate: providers.length > 0 ? (providers.reduce((sum, p) => sum + (p.averageRate || 12.5), 0) / providers.length).toFixed(1) : '12.5',
    isDeregulated: state === 'texas',
    topCities: cities
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-texas-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {state} provider switching info...</p>
        </div>
      </div>
    );
  }
  
  if (providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const handleZipSearch = (zipCode: string) => {
    const city = stateData.topCities.find(c => c.zipCodes?.includes(zipCode));
    if (city) {
      navigate(`/${state}/${city.slug}/electricity-providers`);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Compare Providers',
      description: 'Research and compare electricity providers in your area',
      details: [
        'Compare rates from multiple providers',
        'Read customer reviews and ratings',
        'Check service area coverage',
        'Review plan types and contract terms'
      ]
    },
    {
      number: 2,
      title: 'Choose Your Plan',
      description: 'Select the electricity plan that best fits your needs',
      details: [
        'Consider your average monthly usage',
        'Decide between fixed or variable rates',
        'Choose contract length',
        'Review fees and cancellation terms'
      ]
    },
    {
      number: 3,
      title: 'Sign Up Online',
      description: 'Complete enrollment with your new provider',
      details: [
        'Provide basic contact information',
        'Supply current utility account details',
        'Choose start date for service',
        'Set up payment method'
      ]
    },
    {
      number: 4,
      title: 'Automatic Switch',
      description: 'Your new provider handles the switch process',
      details: [
        'Provider contacts your current supplier',
        'Switch is scheduled automatically',
        'No service interruption',
        'Receive confirmation notification'
      ]
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: 'Free to Switch',
      description: 'Switching electricity providers is completely free in ' + stateData.name
    },
    {
      icon: Clock,
      title: 'Quick Process',
      description: 'The entire switch process takes 1-2 billing cycles to complete'
    },
    {
      icon: Shield,
      title: 'No Service Interruption',
      description: 'Your electricity service continues uninterrupted during the switch'
    },
    {
      icon: Users,
      title: 'Provider Handles Everything',
      description: 'Your new provider manages the entire switching process for you'
    }
  ];

  const faqs = [
    {
      question: 'How long does it take to switch electricity providers?',
      answer: 'The switching process typically takes 1-2 billing cycles (30-60 days) to complete. However, you can sign up with a new provider immediately.'
    },
    {
      question: 'Will my electricity be shut off during the switch?',
      answer: 'No, your electricity service will not be interrupted during the switching process. The transition happens smoothly behind the scenes.'
    },
    {
      question: 'Can I switch if I have an outstanding balance?',
      answer: 'You may need to resolve any outstanding balances with your current provider before switching. Check with your new provider about their requirements.'
    },
    {
      question: 'What information do I need to switch providers?',
      answer: 'You\'ll need your current electric bill, contact information, and account details. Some providers may also require a credit check.'
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
            <button onClick={() => navigate(`/${state}/electricity-providers`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>Switch Provider</span>
          </nav>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Switch Electricity Providers in {stateData.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Switching electricity providers in {stateData.name} is free, easy, and can save you money. 
              Follow our step-by-step guide to find a better rate and switch providers.
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
            Benefits of Switching in {stateData.name}
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

        {/* Step-by-Step Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            4 Easy Steps to Switch
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
                            onClick={() => navigate(`/${state}/electricity-providers`)}
                            className="bg-texas-navy text-white px-4 py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium inline-flex items-center"
                          >
                            Compare {stateData.name} Providers
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

        {/* Important Information */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Important Things to Know</h3>
            </div>
            
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>You can switch providers even if you're in a contract (may incur cancellation fees)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Your utility company will still deliver electricity and handle outages</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>You'll receive separate bills from your new provider and utility company</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Read the contract carefully before signing up</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-texas-navy mr-3" />
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
                <h4 className="font-medium text-gray-900 mb-2">ChooseMyPower Support</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Our team can help you compare providers and understand your options.
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

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/resources/faqs')}
              className="text-texas-navy hover:text-texas-navy font-medium"
            >
              View All FAQs →
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-texas-navy text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Switch?</h2>
          <p className="text-white/90 mb-6">
            Compare electricity providers in {stateData.name} and start saving today.
          </p>
          <button
            onClick={() => navigate(`/${state}/electricity-providers`)}
            className="bg-white text-texas-navy px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Compare {stateData.name} Providers
          </button>
        </div>
      </div>
    </div>
  );
}