import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders } from '../../data/mockData';
import { Award, Star, TrendingDown, Users, Shield, Trophy, Medal, Crown, CheckCircle, Target } from 'lucide-react';

interface Top5ProvidersPageProps {
  onNavigate: (path: string) => void;
}

export function Top5ProvidersPage({ onNavigate }: Top5ProvidersPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'value' | 'service' | 'green'>('overall');

  const handleZipSearch = (zipCode: string) => {
    onNavigate(`/texas/houston/electricity-providers`);
  };

  // Create rankings based on different criteria
  const rankings = {
    overall: mockProviders
      .map(p => ({
        ...p,
        score: (p.rating * 20) + (p.reviewCount / 100) + (50 - Math.min(...p.plans.map(plan => plan.rate)))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    
    value: mockProviders
      .map(p => ({
        ...p,
        score: 50 - Math.min(...p.plans.map(plan => plan.rate)) + (p.rating * 5)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    
    service: mockProviders
      .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
      .slice(0, 5),
    
    green: mockProviders
      .filter(p => p.plans.some(plan => plan.renewablePercent === 100))
      .sort((a, b) => {
        const aGreenPlans = a.plans.filter(plan => plan.renewablePercent === 100).length;
        const bGreenPlans = b.plans.filter(plan => plan.renewablePercent === 100).length;
        return (bGreenPlans * b.rating) - (aGreenPlans * a.rating);
      })
      .slice(0, 5)
  };

  const currentRanking = rankings[selectedCategory];

  const categories = [
    { 
      id: 'overall',
      name: 'Overall Champions',
      description: 'Best combination of rates, service, and specialization',
      icon: Award,
      color: 'blue'
    },
    { 
      id: 'green',
      name: 'Green Energy Leaders',
      description: '100% renewable energy champions',
      icon: Leaf,
      color: 'green'
    },
    {
      id: 'service',
      name: 'Customer Service Excellence',
      description: 'Highest satisfaction and support quality',
      icon: Users,
      color: 'blue'
    },
    { 
      id: 'value',
      name: 'Best Value Champions', 
      description: 'Lowest total costs with quality service',
      icon: TrendingDown,
      color: 'green'
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-orange-500" />;
      default: return <Target className="h-8 w-8 text-blue-500" />;
    }
  };

  const rankingCriteria = {
    overall: [
      'Customer satisfaction ratings',
      'Competitive rates and fees',
      'Plan variety and options',
      'Service area coverage',
      'Customer review volume'
    ],
    value: [
      'Lowest rates per kWh',
      'Minimal monthly fees',
      'No hidden charges',
      'Contract value',
      'Long-term savings potential'
    ],
    service: [
      'Customer satisfaction scores',
      'Response time to issues',
      'Bill clarity and accuracy',
      'Online account features',
      'Customer review sentiment'
    ],
    green: [
      '100% renewable energy plans',
      'Environmental certifications',
      'Green energy variety',
      'Sustainability programs',
      'Carbon offset options'
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('/compare')} className="hover:text-blue-600">Compare</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('/compare/providers')} className="hover:text-blue-600">Providers</button>
            <span className="mx-2">/</span>
            <span>Top 5</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-lg mb-6">
              <Trophy className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Top 5 Electricity Providers - 2024 Rankings
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-4xl mx-auto">
              Our expert rankings of the best electricity providers based on customer satisfaction, rates, 
              and service quality. Updated monthly based on real customer data and market analysis.
            </p>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter ZIP code to see local rankings"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Selector */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Ranking Category</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Rankings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Top 5 {categories.find(c => c.id === selectedCategory)?.name} Providers
              </h2>
              
              <div className="space-y-6">
                {currentRanking.map((provider, index) => {
                  const rank = index + 1;
                  const lowestRate = Math.min(...provider.plans.map(p => p.rate));
                  
                  return (
                    <div key={provider.id} className={`border-2 rounded-lg p-6 ${
                      rank === 1 ? 'border-yellow-300 bg-yellow-50' :
                      rank === 2 ? 'border-gray-300 bg-gray-50' :
                      rank === 3 ? 'border-orange-300 bg-orange-50' :
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {/* Rank Badge */}
                          <div className={`flex items-center justify-center w-16 h-16 rounded-lg ${
                            rank === 1 ? 'bg-yellow-100' :
                            rank === 2 ? 'bg-gray-100' :
                            rank === 3 ? 'bg-orange-100' :
                            'bg-blue-100'
                          }`}>
                            {getRankIcon(rank)}
                          </div>

                          {/* Provider Info */}
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <img
                                src={provider.logo}
                                alt={`${provider.name} logo`}
                                className="w-12 h-12 rounded-lg object-cover mr-3"
                              />
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  #{rank} {provider.name}
                                </h3>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                  <span className="font-medium">{provider.rating}</span>
                                  <span className="text-gray-500 ml-1">({provider.reviewCount.toLocaleString()} reviews)</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-4">{provider.description}</p>

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Lowest Rate</div>
                                <div className="font-bold text-green-600">{lowestRate}¢/kWh</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Plans Available</div>
                                <div className="font-bold">{provider.plans.length}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Service States</div>
                                <div className="font-bold">{provider.serviceStates.length}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Green Options</div>
                                <div className="font-bold">
                                  {provider.plans.filter(p => p.renewablePercent === 100).length > 0 ? 'Yes' : 'No'}
                                </div>
                              </div>
                            </div>

                            {/* Why It's Ranked */}
                            {rank <= 3 && (
                              <div className="mt-4 p-3 bg-white rounded border">
                                <div className="font-medium text-gray-900 mb-2">
                                  Why #{rank} for {categories.find(c => c.id === selectedCategory)?.name}:
                                </div>
                                <div className="text-sm text-gray-600">
                                  {selectedCategory === 'overall' && rank === 1 && "Excellent balance of competitive rates, high customer satisfaction, and comprehensive plan options."}
                                  {selectedCategory === 'overall' && rank === 2 && "Strong customer ratings with competitive pricing and reliable service across multiple states."}
                                  {selectedCategory === 'overall' && rank === 3 && "Good value proposition with decent rates and satisfactory customer service."}
                                  {selectedCategory === 'value' && rank === 1 && "Offers the most competitive rates with minimal fees and transparent pricing."}
                                  {selectedCategory === 'value' && rank === 2 && "Strong rate competitiveness with good contract terms and value."}
                                  {selectedCategory === 'value' && rank === 3 && "Solid rates with reasonable fees and good long-term value."}
                                  {selectedCategory === 'service' && rank === 1 && "Highest customer satisfaction ratings with excellent support and billing practices."}
                                  {selectedCategory === 'service' && rank === 2 && "Very good customer service with responsive support and clear communication."}
                                  {selectedCategory === 'service' && rank === 3 && "Good customer service record with satisfactory support quality."}
                                  {selectedCategory === 'green' && rank === 1 && "Leading green energy provider with 100% renewable options and environmental leadership."}
                                  {selectedCategory === 'green' && rank === 2 && "Strong renewable energy commitment with multiple green plan options."}
                                  {selectedCategory === 'green' && rank === 3 && "Good green energy options with solid environmental credentials."}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="text-right space-y-2">
                          <button
                            onClick={() => onNavigate(`/providers/${provider.slug}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => onNavigate(`/compare/providers`)}
                            className="block border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Compare
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ranking Methodology */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Criteria</h3>
              <p className="text-gray-600 text-sm mb-4">
                Our {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()} rankings are based on:
              </p>
              
              <ul className="space-y-2">
                {rankingCriteria[selectedCategory].map((criterion, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Updated Monthly</h3>
              <p className="text-gray-600 text-sm mb-4">
                These rankings are updated every month based on:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Current rate data</li>
                <li>• New customer reviews</li>
                <li>• Service quality reports</li>
                <li>• Market changes</li>
                <li>• Plan availability</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help Choosing?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Rankings help narrow your choices, but the best provider depends on your specific needs and location.
              </p>
              <button
                onClick={() => onNavigate('/resources/guides/choosing-a-provider')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Read our choosing guide →
              </button>
            </div>
          </div>
        </div>

        {/* Winner Spotlight */}
        {currentRanking[0] && (
          <div className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-lg mb-6">
                <Crown className="h-8 w-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🏆 {categories.find(c => c.id === selectedCategory)?.name} Winner: {currentRanking[0].name}
              </h2>
              
              <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
                {currentRanking[0].name} takes the top spot for {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()} 
                with a {currentRanking[0].rating} star rating from {currentRanking[0].reviewCount.toLocaleString()} customers 
                and rates starting at {Math.min(...currentRanking[0].plans.map(p => p.rate))}¢ per kWh.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onNavigate(`/providers/${currentRanking[0].slug}`)}
                  className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  View {currentRanking[0].name} Details
                </button>
                <button
                  onClick={() => onNavigate('/compare/providers')}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Compare All Providers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}