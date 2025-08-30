import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Shield, CreditCard, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface CityNoDepositPageProps {
  state: string;
  city: string;
}

export function CityNoDepositPage({ state, city }: CityNoDepositPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [creditScore, setCreditScore] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  const stateData = mockStates.find(s => s.slug === state);
  const cityData = stateData?.topCities.find(c => c.slug === city);
  
  if (!stateData || !cityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <button
            onClick={() => navigate(`/${state}/no-deposit-electricity`)}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            View {stateData?.name || 'State'} No Deposit Options
          </button>
        </div>
      </div>
    );
  }

  const cityProviders = mockProviders.filter(p => 
    cityData.topProviders.includes(p.id)
  );

  const handleZipSearch = (zipCode: string) => {
    navigate(`/${state}/${city}/${zipCode}/no-deposit-electricity`);
  };

  const creditScoreOptions = [
    { value: 'excellent', label: 'Excellent (750+)', color: 'green' },
    { value: 'good', label: 'Good (650-749)', color: 'blue' },
    { value: 'fair', label: 'Fair (550-649)', color: 'yellow' },
    { value: 'poor', label: 'Poor (Below 550)', color: 'red' }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'No Security Deposit',
      description: `Start electricity service in ${cityData.name} without paying a deposit`
    },
    {
      icon: Clock,
      title: 'Same-Day Service',
      description: 'Get electricity connected quickly without deposit processing delays'
    },
    {
      icon: CreditCard,
      title: 'Preserve Cash Flow',
      description: 'Keep your money for moving expenses and other needs'
    },
    {
      icon: CheckCircle,
      title: 'Build Credit History',
      description: 'Some providers report payment history to help build credit'
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
            <button onClick={() => navigate(`/${state}/no-deposit-electricity`)} className="hover:text-texas-navy">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>{cityData.name} No Deposit</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
              <Shield className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              No Deposit Electricity in {cityData.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Get electricity service in {cityData.name}, {stateData.name} without paying a security deposit. 
              Compare no-deposit plans from {cityProviders.length} providers and start service today.
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
            Benefits of No Deposit Electricity in {cityData.name}
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

        {/* Credit Score Assessment */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Find Options Based on Your Credit Score
          </h2>
          
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
              What's your credit score range?
            </label>
            <div className="grid md:grid-cols-4 gap-4">
              {creditScoreOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCreditScore(option.value as any)}
                  className={`p-4 text-center border-2 rounded-lg transition-colors ${
                    creditScore === option.value
                      ? `border-${option.color}-600 bg-${option.color}-50 text-${option.color}-900`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Credit-based recommendations */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Options for {creditScoreOptions.find(o => o.value === creditScore)?.label} Credit in {cityData.name}
            </h3>
            
            {creditScore === 'excellent' && (
              <div className="text-green-700">
                <p className="mb-3">✅ You qualify for the best no-deposit options with competitive rates!</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Most {cityData.name} providers will waive deposits</li>
                  <li>Access to promotional rates and special offers</li>
                  <li>Flexible contract terms available</li>
                  <li>Priority customer service</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'good' && (
              <div className="text-texas-navy">
                <p className="mb-3">✅ Many no-deposit options available in {cityData.name}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Most providers will approve without deposit</li>
                  <li>Standard rates with good contract options</li>
                  <li>May require soft credit check</li>
                  <li>Good selection of plan types</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'fair' && (
              <div className="text-yellow-700">
                <p className="mb-3">⚠️ Limited no-deposit options in {cityData.name}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Some providers offer no-deposit with higher rates</li>
                  <li>Consider prepaid or co-signer options</li>
                  <li>May require additional documentation</li>
                  <li>Focus on building credit for better future options</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'poor' && (
              <div className="text-red-700">
                <p className="mb-3">❌ Prepaid electricity may be your best option in {cityData.name}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Traditional no-deposit plans unlikely to be approved</li>
                  <li>Prepaid plans require no credit check</li>
                  <li>Consider working on credit improvement</li>
                  <li>Some specialty providers may have options</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Provider Options */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            No Deposit Providers Serving {cityData.name}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityProviders.map((provider) => (
              <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <div className="text-sm text-gray-600">Serves {cityData.name}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Requirements:</div>
                  <div className="text-sm text-gray-600">
                    {creditScore === 'excellent' ? 'No requirements - instant approval' : 
                     creditScore === 'good' ? 'Credit check required' :
                     creditScore === 'fair' ? 'Higher rate or co-signer may be required' :
                     'Prepaid plan recommended'
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/providers/${provider.slug}`)}
                    className="w-full bg-texas-navy text-white py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    View Provider Details
                  </button>
                  <button
                    onClick={() => navigate(`/${state}/${city}/electricity-providers`)}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    See Plans & Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Tips */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            No Deposit Electricity Tips for {cityData.name} Residents
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Before You Apply</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Check your credit score beforehand to know your options</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Gather necessary documents (ID, previous bills, income proof)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Compare total monthly costs, not just rates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Read contract terms carefully</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Options</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Prepaid Electricity</h4>
                  <p className="text-gray-600 text-sm">
                    Pay for electricity before you use it - no credit check or deposit required.
                  </p>
                  <button
                    onClick={() => navigate('/shop/prepaid-electricity')}
                    className="text-texas-navy hover:text-texas-navy text-sm font-medium mt-2"
                  >
                    Learn about prepaid →
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Co-signer Options</h4>
                  <p className="text-gray-600 text-sm">
                    Have someone with good credit co-sign your electricity contract.
                  </p>
                  <button
                    onClick={() => navigate('/shop/special-circumstances')}
                    className="text-texas-navy hover:text-texas-navy text-sm font-medium mt-2"
                  >
                    Co-signer guide →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}