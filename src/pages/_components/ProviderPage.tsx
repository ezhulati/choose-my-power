import React, { useState } from 'react';
import { mockProviders, mockStates } from '../../data/mockData';
import { Star, Phone, Globe, MapPin, Zap, DollarSign, Calendar, Leaf, CheckCircle, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, Users } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ProviderPageProps {
  providerId: string;
}

export function ProviderPage({ providerId }: ProviderPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedTab, setSelectedTab] = useState<'overview' | 'plans' | 'reviews' | 'service-areas'>('overview');
  
  const provider = mockProviders.find(p => p.slug === providerId);
  
  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-8">The provider you're looking for doesn't exist in our database.</p>
          <button
            onClick={() => navigate('/providers')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors"
          >
            View Licensed Companies
          </button>
        </div>
      </div>
    );
  }

  const mockReviews = [
    {
      id: '1',
      rating: 5,
      title: 'Great service and competitive rates',
      content: 'Switched to this provider 6 months ago and have been very happy. Rates are competitive and customer service is responsive.',
      author: 'Sarah M.',
      date: '2024-01-15',
      verified: true
    },
    {
      id: '2',
      rating: 4,
      title: 'Good value for money',
      content: 'Overall satisfied with the service. Bills are clear and the online portal is easy to use.',
      author: 'Mike R.',
      date: '2024-01-10',
      verified: true
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Zap },
    { id: 'plans', name: 'Plans & Rates', icon: DollarSign },
    { id: 'reviews', name: 'Reviews', icon: Star },
    { id: 'service-areas', name: 'Service Areas', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/providers')} className="hover:text-texas-navy">Providers</button>
            <span className="mx-2">/</span>
            <span>{provider.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-start space-x-4 mb-6">
                <img
                  src={provider.logo}
                  alt={`${provider.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  {/* Hero's Journey Honest Header */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-texas-navy mb-2">
                    {provider.heroJourney?.honestHeader || `Here's What Real Customers Say About ${provider.name}`}
                  </h1>
                  
                  {/* Assessment Badge */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      {provider.assessment === 'good' && (
                        <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Recommended
                        </div>
                      )}
                      {provider.assessment === 'mixed' && (
                        <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Proceed with Caution
                        </div>
                      )}
                      {provider.assessment === 'bad' && (
                        <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          <XCircle className="h-4 w-4 mr-1" />
                          Not Recommended
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="ml-1">({provider.reviewCount.toLocaleString()} reviews)</span>
                    </div>
                  </div>
                  
                  {/* Simplified Trust Signal */}
                  <div className="bg-texas-cream-50 border border-texas-gold-200 p-3 mb-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Based on {provider.reviewCount.toLocaleString()} real customer reviews • Updated monthly
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero's Journey CTAs */}
              <div className="flex flex-wrap gap-4 mb-6">
                {provider.heroJourney?.recommendedAction === 'choose' && (
                  <button
                    onClick={() => navigate(`/electricity-plans/texas/?provider=${provider.slug}`)}
                    className="bg-texas-red text-white px-6 py-3 rounded-lg hover:bg-texas-red-600 transition-colors font-medium inline-flex items-center"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    See What {provider.name} Offers
                  </button>
                )}
                {provider.heroJourney?.recommendedAction === 'compare' && (
                  <button
                    onClick={() => navigate('/compare/providers')}
                    className="bg-texas-gold text-white px-6 py-3 rounded-lg hover:bg-texas-gold-600 transition-colors font-medium inline-flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Compare With Better Options
                  </button>
                )}
                {provider.heroJourney?.recommendedAction === 'avoid' && (
                  <button
                    onClick={() => navigate('/providers')}
                    className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium inline-flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Find Better Alternatives
                  </button>
                )}
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium inline-flex items-center"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-6 rounded-lg lg:w-80">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{provider.contactPhone}</div>
                    <div className="text-sm text-gray-600">Customer Service</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <a href={provider.website} className="font-medium text-texas-navy hover:text-texas-navy">
                      Official Website
                    </a>
                    <div className="text-sm text-gray-600">Online Account & Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-texas-navy text-texas-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* What They're Good For */}
              {provider.heroJourney?.whatTheyreGoodAt && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <ThumbsUp className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold text-texas-navy">Good For...</h3>
                  </div>
                  <div className="space-y-3">
                    {provider.heroJourney.whatTheyreGoodAt.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Great If */}
              {provider.heroJourney?.whereTheyFallShort && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <ThumbsDown className="h-6 w-6 text-red-600 mr-3" />
                    <h3 className="text-xl font-semibold text-texas-navy">Not Great If...</h3>
                  </div>
                  <div className="space-y-3">
                    {provider.heroJourney.whereTheyFallShort.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What Real Customers Say */}
              {provider.heroJourney?.realCustomerThemes && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-texas-navy mr-3" />
                    <h3 className="text-xl font-semibold text-texas-navy">What People Actually Experience</h3>
                  </div>
                  <div className="space-y-4">
                    {provider.heroJourney.realCustomerThemes.map((theme, index) => (
                      <blockquote key={index} className="bg-gray-50 border-l-4 border-texas-gold p-4 italic text-gray-700">
                        {theme}
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketing vs Reality */}
              {provider.marketingVsReality && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                    <h3 className="text-xl font-semibold text-texas-navy">Marketing vs Reality</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">What They Claim</h4>
                      <ul className="space-y-2">
                        {provider.marketingVsReality.marketingClaims.map((claim, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {claim}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">What Actually Happens</h4>
                      <ul className="space-y-2">
                        {provider.marketingVsReality.actualPerformance.map((performance, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-texas-navy rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {performance}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Line */}
              {provider.heroJourney?.bottomLine && (
                <div className="bg-gradient-to-r from-texas-cream to-gray-50 rounded-lg border-2 border-texas-gold p-6">
                  <div className="flex items-start">
                    <div className="bg-texas-gold text-white p-2 rounded-lg mr-4">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-texas-navy mb-2">Our Honest Take</h3>
                      <p className="text-gray-800">{provider.heroJourney.bottomLine}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">At A Glance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold">{provider.rating}/5</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{provider.reviewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service States</span>
                    <span className="font-semibold">{provider.serviceStates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Plans</span>
                    <span className="font-semibold">{provider.plans.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'plans' && (
          <div className="space-y-6">
            {/* Best Plans Callout */}
            {provider.heroJourney?.bestPlans && provider.heroJourney.bestPlans.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Star className="h-6 w-6 text-texas-gold mr-2" />
                  <h3 className="text-lg font-semibold text-texas-navy">Their Best Plans (If Any)</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {provider.heroJourney.bestPlans.map((planName, index) => (
                    <span key={index} className="bg-texas-gold text-white px-3 py-1 rounded-full text-sm font-medium">
                      {planName}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-700">
                  These are their standout plans based on our analysis, but definitely shop around - other companies might beat these.
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-texas-navy mb-4">
                {provider.assessment === 'good' ? 'Their Current Plans' : 
                 provider.assessment === 'mixed' ? 'Available Plans (Watch The Fine Print)' : 
                 'Their Plans (But Consider These Alternatives First)'}
              </h3>
              <p className="text-gray-600 mb-6">
                {provider.assessment === 'good' ? 'Here\'s what they\'re offering right now. Remember to compare with other providers too.' : 
                 provider.assessment === 'mixed' ? 'These plans might work for you, but read the terms carefully and compare with others.' : 
                 'We\'d honestly recommend checking out other providers first, but here\'s what they offer.'}
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provider.plans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{plan.rate}¢</div>
                        <div className="text-sm text-gray-500">per kWh</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plan Type:</span>
                        <span className="font-medium capitalize">{plan.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Contract Length:</span>
                        <span className="font-medium">{plan.termLength} months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Renewable:</span>
                        <span className="font-medium">{plan.renewablePercent}%</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Features:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => navigate('/texas/houston/electricity-providers')}
                      className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
                    >
                      Check Your Area's Rates
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">{provider.rating}</span>
                  <span className="text-gray-500">({provider.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <div className="flex items-center mr-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-gray-900">{review.title}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{review.author}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(review.date).toLocaleDateString()}</span>
                          {review.verified && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-green-600 font-medium">Verified Customer</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'service-areas' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
            <p className="text-gray-600 mb-6">
              {provider.name} provides electricity service in the following states:
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {provider.serviceStates.map((stateSlug) => {
                const state = mockStates.find(s => s.slug === stateSlug);
                if (!state) return null;
                
                return (
                  <div key={stateSlug} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{state.name}</h4>
                      <span className="text-sm text-gray-500">{state.abbreviation}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div>Market: {state.isDeregulated ? 'Deregulated' : 'Regulated'}</div>
                      <div>Avg Rate: {state.averageRate}¢/kWh</div>
                      <div>Top Cities: {state.topCities.length}</div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/${state.slug}/electricity-providers`)}
                      className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-texas-navy/90 transition-colors text-sm font-medium"
                    >
                      View {state.name} Plans
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}