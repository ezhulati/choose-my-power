import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { ProviderCard } from '../../components/ProviderCard';
import { mockProviders, mockStates } from '../../data/mockData';
import { Shield, CreditCard, Clock, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StateNoDepositPageProps {
  state: string;
}

export function StateNoDepositPage({ state }: StateNoDepositPageProps) {
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
  
  if (!stateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Return to homepage"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const stateProviders = mockProviders.filter(p => p.serviceStates.includes(stateData.slug));
  
  // Mock no-deposit options - in real app, this would be filtered from actual data
  const noDepositOptions = stateProviders.map(provider => ({
    ...provider,
    noDepositAvailable: true,
    requirements: creditScore === 'excellent' ? 'No requirements' : 
                  creditScore === 'good' ? 'Credit check required' :
                  creditScore === 'fair' ? 'Higher rate or co-signer may be required' :
                  'Prepaid plan recommended'
  }));

  const handleZipSearch = (zipCode: string) => {
    const city = stateData.topCities.find(c => c.zipCodes.includes(zipCode));
    if (city) {
      navigate(`/${state}/${city.slug}/no-deposit-electricity`);
    }
  };

  const creditScoreOptions = [
    { value: 'excellent', label: 'Excellent (750+)', color: 'green' },
    { value: 'good', label: 'Good (650-749)', color: 'blue' },
    { value: 'fair', label: 'Fair (550-649)', color: 'yellow' },
    { value: 'poor', label: 'Poor (Below 550)', color: 'red' }
  ];

  const noDepositBenefits = [
    {
      icon: Shield,
      title: 'No Security Deposit',
      description: 'Start electricity service without paying hundreds in deposits'
    },
    {
      icon: Clock,
      title: 'Same-Day Service',
      description: 'Get electricity turned on quickly without waiting for deposit processing'
    },
    {
      icon: CreditCard,
      title: 'Preserve Cash Flow',
      description: 'Keep your money for other expenses instead of utility deposits'
    },
    {
      icon: CheckCircle,
      title: 'Build Credit History',
      description: 'Some providers report payment history to credit bureaus'
    }
  ];

  const alternatives = [
    {
      title: 'Prepaid Electricity',
      description: 'Pay for electricity before you use it - no deposit or credit check required',
      pros: ['No credit check', 'No deposit', 'Control usage'],
      cons: ['Higher rates', 'Must monitor balance'],
      link: '/shop/prepaid-electricity'
    },
    {
      title: 'Co-signer Plans',
      description: 'Have someone with good credit co-sign your electricity contract',
      pros: ['Access to better rates', 'Build your credit'],
      cons: ['Need qualified co-signer', 'Co-signer liability'],
      link: '/shop/special-circumstances'
    },
    {
      title: 'Letter of Credit',
      description: 'Some providers accept letters of credit from banks instead of cash deposits',
      pros: ['Keep cash in bank', 'Earn interest'],
      cons: ['Bank fees', 'Credit requirements'],
      link: '/resources/guides/letters-of-credit'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate(`/${state}/electricity-providers`)} className="hover:text-blue-600">
              {stateData.name}
            </button>
            <span className="mx-2">/</span>
            <span>No Deposit Electricity</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
              <Shield className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              No Deposit Electricity in {stateData.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Get electricity service without paying a security deposit. Compare no-deposit plans 
              from {stateProviders.length} providers and start service today.
            </p>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder={`Enter ${stateData.abbreviation} ZIP for no-deposit options`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Benefits of No Deposit Electricity
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {noDepositBenefits.map((benefit, index) => (
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

        {/* Credit Score Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Find Options Based on Your Credit
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
              Recommendations for {creditScoreOptions.find(o => o.value === creditScore)?.label} Credit
            </h3>
            
            {creditScore === 'excellent' && (
              <div className="text-green-700">
                <p className="mb-3">✅ You qualify for the best no-deposit options with competitive rates!</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Most providers will waive deposits</li>
                  <li>Access to promotional rates</li>
                  <li>Flexible contract terms available</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'good' && (
              <div className="text-blue-700">
                <p className="mb-3">✅ Many no-deposit options available with credit approval</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Most providers will approve without deposit</li>
                  <li>Standard rates apply</li>
                  <li>May require soft credit check</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'fair' && (
              <div className="text-yellow-700">
                <p className="mb-3">⚠️ Limited no-deposit options - may need alternative plans</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Some providers offer no-deposit with higher rates</li>
                  <li>Consider prepaid or co-signer options</li>
                  <li>May require additional documentation</li>
                </ul>
              </div>
            )}
            
            {creditScore === 'poor' && (
              <div className="text-red-700">
                <p className="mb-3">❌ Prepaid electricity may be your best option</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Traditional no-deposit plans unlikely</li>
                  <li>Prepaid plans require no credit check</li>
                  <li>Consider improving credit for future options</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Provider Options */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            No Deposit Providers in {stateData.name}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noDepositOptions.map((provider) => (
              <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <div className="text-sm text-gray-600">No deposit available</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Requirements:</div>
                  <div className="text-sm text-gray-600">{provider.requirements}</div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/providers/${provider.slug}`)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Provider Details
                  </button>
                  <button
                    onClick={() => navigate(`/${state}/electricity-providers`)}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    See Plans & Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternatives */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Alternative Options if No Deposit Plans Aren't Available
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {alternatives.map((alt, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{alt.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{alt.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-sm font-medium text-green-700 mb-1">Pros:</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alt.pros.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-1">Cons:</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alt.cons.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-center">
                          <AlertTriangle className="h-3 w-3 text-red-600 mr-1 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(alt.link)}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}