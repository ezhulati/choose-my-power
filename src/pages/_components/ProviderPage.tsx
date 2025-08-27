import React, { useState } from 'react';
import { mockProviders, mockStates } from '../../data/mockData';
import { Star, Phone, Globe, MapPin, Zap, DollarSign, Calendar, Leaf } from 'lucide-react';

interface ProviderPageProps {
  providerId: string;
  onNavigate: (path: string) => void;
}

export function ProviderPage({ providerId, onNavigate }: ProviderPageProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'plans' | 'reviews' | 'service-areas'>('overview');
  
  const provider = mockProviders.find(p => p.slug === providerId);
  
  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-8">The provider you're looking for doesn't exist in our database.</p>
          <button
            onClick={() => onNavigate('/providers')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Providers
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
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('/providers')} className="hover:text-blue-600">Providers</button>
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.name}</h1>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-semibold text-gray-900 ml-1">{provider.rating}</span>
                      <span className="text-gray-500 ml-1">({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <p className="text-gray-600 max-w-2xl">{provider.description}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => onNavigate('/compare/providers')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Compare Plans
                </button>
                <button
                  onClick={() => onNavigate(`/providers/${provider.slug}/vs`)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Compare vs Others
                </button>
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
                    <a href={provider.website} className="font-medium text-blue-600 hover:text-blue-800">
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
                    ? 'border-blue-600 text-blue-600'
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
              {/* Features */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {provider.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Zap className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About {provider.name}</h3>
                <p className="text-gray-600 mb-4">{provider.description}</p>
                <p className="text-gray-600">
                  {provider.name} serves customers across {provider.serviceStates.length} state{provider.serviceStates.length > 1 ? 's' : ''} 
                  and offers a variety of electricity plans to meet different needs and budgets.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h3>
              <p className="text-gray-600 mb-6">
                View current rates by selecting your location. Rates may vary by service area.
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
                      onClick={() => onNavigate('/texas/houston/electricity-providers')}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      See Rates in Your Area
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
                      onClick={() => onNavigate(`/${state.slug}/electricity-providers`)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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