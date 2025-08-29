import React, { useState } from 'react';
import { mockStates, utilityCompanies } from '../../data/mockData';
import { BarChart, TrendingUp, Users, Zap, Building, Scale, Info, Calendar } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface StateMarketInfoPageProps {
  state: string;
}

export function StateMarketInfoPage({ state }: StateMarketInfoPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'deregulation' | 'usage' | 'regulations'>('overview');

  const stateData = mockStates.find(s => s.slug === state);
  
  if (!stateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const stateUtilities = utilityCompanies[state as keyof typeof utilityCompanies] || [];

  const tabs = [
    { id: 'overview', name: 'Market Overview', icon: BarChart },
    { id: 'deregulation', name: 'Deregulation Info', icon: Scale },
    { id: 'usage', name: 'Usage Data', icon: TrendingUp },
    { id: 'regulations', name: 'Regulations', icon: Building }
  ];

  const marketStats = {
    averageMonthlyUsage: state === 'texas' ? 1176 : 878,
    averageMonthlyBill: state === 'texas' ? 142 : 118,
    residentialCustomers: state === 'texas' ? '10.2M' : '5.4M',
    deregulationYear: state === 'texas' ? 2002 : 1999
  };

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
            <span>Market Information</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {stateData.name} Electricity Market Information
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Complete overview of the electricity market in {stateData.name}, including deregulation status, 
            usage statistics, and regulatory information.
          </p>

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-texas-cream-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-texas-navy mr-2" />
                <span className="text-sm font-medium text-texas-navy">Customers</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{marketStats.residentialCustomers}</div>
              <div className="text-sm text-texas-navy">residential</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Avg Usage</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{marketStats.averageMonthlyUsage}</div>
              <div className="text-sm text-green-700">kWh/month</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">Avg Bill</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">${marketStats.averageMonthlyBill}</div>
              <div className="text-sm text-purple-700">per month</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">Deregulated</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{marketStats.deregulationYear}</div>
              <div className="text-sm text-orange-700">since</div>
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Structure</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Market Type</h3>
                    <p className="text-gray-600">
                      {stateData.isDeregulated 
                        ? `${stateData.name} operates a deregulated electricity market, allowing consumers to choose their retail electric provider.`
                        : `${stateData.name} operates a regulated electricity market where utilities provide both delivery and supply.`
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Consumer Choice</h3>
                    <p className="text-gray-600">
                      {stateData.isDeregulated 
                        ? 'Customers can choose from multiple retail electric providers and switch freely between them.'
                        : 'Customers receive electricity service from their local utility company with regulated rates.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Companies</h2>
                <div className="space-y-3">
                  {stateUtilities.map((utility) => (
                    <div key={utility.id} className="border-l-4 border-texas-navy pl-4">
                      <h3 className="font-medium text-gray-900">{utility.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{utility.description}</p>
                      <p className="text-xs text-gray-500">Service Area: {utility.serviceArea.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Market Facts</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Average Electricity Rate</h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">{stateData.averageRate}¢</div>
                  <p className="text-sm text-gray-600">per kilowatt-hour (kWh)</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Major Cities Served</h3>
                  <div className="text-2xl font-bold text-texas-navy mb-1">{stateData.topCities.length}</div>
                  <p className="text-sm text-gray-600">metropolitan areas</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Transmission Grid</h3>
                  <div className="text-lg font-bold text-purple-600 mb-1">
                    {state === 'texas' ? 'ERCOT' : 'PJM'}
                  </div>
                  <p className="text-sm text-gray-600">regional grid operator</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deregulation' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {stateData.name} Electricity Deregulation
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-4">
                  {state === 'texas' 
                    ? 'Texas deregulated its electricity market in 2002, becoming one of the largest deregulated electricity markets in the United States. This change allowed Texas residents to choose their retail electric provider (REP) while maintaining regulated transmission and distribution through utilities.'
                    : 'Pennsylvania deregulated its electricity market in 1999 as part of the Electric Generation Customer Choice and Competition Act. This legislation opened the market to competition, allowing customers to choose their electricity supplier while maintaining regulated delivery services.'
                  }
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How Deregulation Works</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What You Can Choose</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Retail Electric Provider (REP)</li>
                      <li>• Rate plan type (fixed, variable, indexed)</li>
                      <li>• Contract length (month-to-month to 36 months)</li>
                      <li>• Green energy percentage</li>
                      <li>• Additional services and features</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What Stays the Same</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Utility company delivers electricity</li>
                      <li>• Same power lines and meters</li>
                      <li>• Utility handles outages and repairs</li>
                      <li>• Service reliability standards</li>
                      <li>• Safety and infrastructure maintenance</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits of Deregulation</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Competition</h4>
                    <p className="text-sm text-green-700">Multiple providers compete for customers, driving innovation and better rates.</p>
                  </div>
                  <div className="bg-texas-cream-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Choice</h4>
                    <p className="text-sm text-texas-navy">Customers can choose plans that match their specific needs and preferences.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Innovation</h4>
                    <p className="text-sm text-purple-700">Providers offer new services like smart home integration and renewable energy options.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline of Deregulation</h2>
              
              {state === 'texas' ? (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">1999</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Senate Bill 7 Passed</h3>
                      <p className="text-gray-600 text-sm">Texas Legislature passes comprehensive electricity deregulation bill</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">2002</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Market Opens</h3>
                      <p className="text-gray-600 text-sm">Residential customers can choose their electricity provider</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">2005</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Full Competition</h3>
                      <p className="text-gray-600 text-sm">Rate caps removed, full market competition begins</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">1996</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Electricity Generation Customer Choice Act</h3>
                      <p className="text-gray-600 text-sm">Pennsylvania passes deregulation legislation</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">1999</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Market Opens</h3>
                      <p className="text-gray-600 text-sm">Large commercial customers can choose suppliers</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-16 text-sm font-medium text-gray-600">2000</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Residential Choice</h3>
                      <p className="text-gray-600 text-sm">All residential customers can choose their electricity supplier</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Usage Patterns</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Monthly Usage by Home Size</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{"Apartment (< 900 sq ft)"}</span>
                        <span className="text-sm font-bold">650 kWh</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Small Home (900-1,500 sq ft)</span>
                        <span className="text-sm font-bold">950 kWh</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Medium Home (1,500-2,500 sq ft)</span>
                        <span className="text-sm font-bold">{marketStats.averageMonthlyUsage} kWh</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{"Large Home (> 2,500 sq ft)"}</span>
                        <span className="text-sm font-bold">1,850 kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Seasonal Usage Trends</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Peak Usage Months</h3>
                    {state === 'texas' ? (
                      <div className="text-gray-600 text-sm">
                        <p className="mb-3">Texas experiences highest usage during summer months due to air conditioning:</p>
                        <ul className="space-y-1">
                          <li>• <strong>July-August:</strong> Peak usage (140-160% of average)</li>
                          <li>• <strong>June, September:</strong> High usage (120-130% of average)</li>
                          <li>• <strong>October-May:</strong> Moderate usage (80-100% of average)</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm">
                        <p className="mb-3">Pennsylvania usage varies with heating and cooling needs:</p>
                        <ul className="space-y-1">
                          <li>• <strong>July-August:</strong> Summer peak (120-130% of average)</li>
                          <li>• <strong>December-February:</strong> Winter peak (110-120% of average)</li>
                          <li>• <strong>Spring/Fall:</strong> Lower usage (80-90% of average)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage by City</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateData.topCities.map((city) => (
                  <div key={city.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{city.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Rate:</span>
                        <span className="font-medium">{city.averageRate}¢/kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Usage:</span>
                        <span className="font-medium">
                          {Math.round(marketStats.averageMonthlyUsage * (city.averageRate / stateData.averageRate))} kWh
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/${state}/${city.slug}/electricity-providers`)}
                        className="w-full mt-2 text-texas-navy hover:text-texas-navy text-xs font-medium"
                      >
                        View {city.name} Providers →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regulations' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Regulatory Framework</h2>
              
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">State Regulator</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {state === 'texas' 
                        ? 'Public Utility Commission of Texas (PUCT)'
                        : 'Pennsylvania Public Utility Commission (PUC)'
                      }
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {state === 'texas'
                        ? 'The PUCT regulates the state\'s electric and telecommunication utilities and implements legislation.'
                        : 'The Pennsylvania PUC regulates public utilities and oversees the competitive electricity market.'
                      }
                    </p>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Key Responsibilities:</div>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• Setting market rules and standards</li>
                        <li>• Licensing retail electric providers</li>
                        <li>• Consumer protection and complaint resolution</li>
                        <li>• Monitoring market competition</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Consumer Protections</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-texas-navy pl-4">
                      <h4 className="font-medium text-gray-900">Disclosure Requirements</h4>
                      <p className="text-gray-600 text-sm">Providers must clearly disclose rates, fees, and contract terms</p>
                    </div>
                    <div className="border-l-4 border-green-600 pl-4">
                      <h4 className="font-medium text-gray-900">Cooling-off Period</h4>
                      <p className="text-gray-600 text-sm">3-day right to cancel new contracts without penalty</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium text-gray-900">Bill Format Standards</h4>
                      <p className="text-gray-600 text-sm">Standardized billing information for easy comparison</p>
                    </div>
                    <div className="border-l-4 border-orange-600 pl-4">
                      <h4 className="font-medium text-gray-900">Complaint Process</h4>
                      <p className="text-gray-600 text-sm">Formal process for resolving disputes with providers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Rules & Standards</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Provider Requirements</h3>
                  <ul className="text-gray-600 text-sm space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Must be licensed by state regulator</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Financial qualifications and bonding requirements</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Customer service standards</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Marketing and sales practice rules</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contract Standards</h3>
                  <ul className="text-gray-600 text-sm space-y-2">
                    <li className="flex items-start">
                      <Info className="h-4 w-4 text-texas-navy mr-2 mt-0.5 flex-shrink-0" />
                      <span>Clear rate and fee disclosure requirements</span>
                    </li>
                    <li className="flex items-start">
                      <Info className="h-4 w-4 text-texas-navy mr-2 mt-0.5 flex-shrink-0" />
                      <span>Standardized contract terms and conditions</span>
                    </li>
                    <li className="flex items-start">
                      <Info className="h-4 w-4 text-texas-navy mr-2 mt-0.5 flex-shrink-0" />
                      <span>Automatic renewal notification requirements</span>
                    </li>
                    <li className="flex items-start">
                      <Info className="h-4 w-4 text-texas-navy mr-2 mt-0.5 flex-shrink-0" />
                      <span>Cancellation and switching procedures</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resources & Contact Information</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-3">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">State Regulator</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    File complaints, get market information, and understand your rights
                  </p>
                  <button
                    onClick={() => navigate('/resources/support/regulatory-contacts')}
                    className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                  >
                    Contact Information →
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-3">
                    <Scale className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Consumer Guides</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Educational materials about your rights and how to choose providers
                  </p>
                  <button
                    onClick={() => navigate(`/${state}/guides`)}
                    className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                  >
                    View Guides →
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Market Data</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Current market statistics, rate trends, and usage data
                  </p>
                  <button
                    onClick={() => navigate('/rates/tracker')}
                    className="text-texas-navy hover:text-texas-navy text-sm font-medium"
                  >
                    View Market Data →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}