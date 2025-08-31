import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockStates } from '../../data/mockData';
import { TrendingDown, TrendingUp, BarChart, Zap, DollarSign, AlertTriangle, CheckCircle, Calendar, Activity, Globe, Calculator, Info, ArrowRight, ExternalLink } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TexasMarketForecastPageProps {
}

export function TexasMarketForecastPage({}: TexasMarketForecastPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedMetric, setSelectedMetric] = useState<'wholesale' | 'retail' | 'gas'>('wholesale');

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/dallas/electricity-providers`);
  };

  const forecastData = {
    wholesale: {
      current: '$35/MWh',
      forecast: '$27–34/MWh',
      change: 'decrease',
      source: 'EIA 2025 Forecast'
    },
    forward: {
      average: '$50+/MWh',
      summer: '$110–165/MWh',
      risk: 'High volatility premium'
    },
    gas: {
      current: '$2.72/MMBtu',
      forecast: '$3.37/MMBtu',
      change: '+24%',
      impact: 'Upward pressure on rates'
    }
  };

  const keyFactors = [
    {
      icon: Zap,
      title: 'Natural Gas Price Volatility',
      impact: 'Upward Pressure',
      description: 'Higher Henry Hub projections could raise wholesale and retail power costs as gas-fired generation often sets marginal price.',
      color: 'red'
    },
    {
      icon: TrendingDown,
      title: 'Renewable Energy Expansion',
      impact: 'Downward Pressure',
      description: 'Significant solar and battery capacity expected to suppress wholesale prices, especially midday hours.',
      color: 'green'
    },
    {
      icon: Activity,
      title: 'Data Center Demand Growth',
      impact: 'Upward Pressure',
      description: 'Texas added ~13 TWh of data center demand (2019-2023). Continued expansion may strain grid capacity.',
      color: 'orange'
    },
    {
      icon: AlertTriangle,
      title: 'Extreme Weather Risk',
      impact: 'Price Volatility',
      description: 'Summer heat waves and extreme weather events can trigger short-term price spikes and market uncertainty.',
      color: 'yellow'
    }
  ];

  const consumerTips = [
    {
      icon: CheckCircle,
      title: 'Compare Plans Frequently',
      description: 'Use comparison tools to identify the best fixed-rate plans in your area regularly.'
    },
    {
      icon: Calendar,
      title: 'Consider Longer Contracts',
      description: 'Lock rates in spring or fall when forward prices may dip slightly.'
    },
    {
      icon: Zap,
      title: 'Shift Usage to Off-Peak',
      description: 'Reduce charges by using high-use appliances during less expensive off-peak periods.'
    },
    {
      icon: Globe,
      title: 'Explore Green Energy Options',
      description: 'Solar/wind plans may provide savings and reduce exposure to gas price volatility.'
    }
  ];

  const faqs = [
    {
      question: 'What is a good electricity rate in Texas now?',
      answer: 'Competitive residential fixed rates generally range from 14¢ to 18¢/kWh, depending on location and usage patterns.'
    },
    {
      question: 'Why are forward strip prices so much higher than forecasts?',
      answer: 'They incorporate risk premiums covering unexpected heat waves, fuel spikes, or delays in generation growth.'
    },
    {
      question: 'What\'s the difference between wholesale and retail prices?',
      answer: 'Wholesale prices reflect generation cost; retail includes transmission, utility fees, taxes, and provider margins.'
    },
    {
      question: 'Will electricity rates rise or fall in 2025?',
      answer: 'Retail rates will likely remain steady or increase modestly. Supply-side risks and grid upgrades could push rates higher during peak periods.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-texas-navy via-blue-900 to-texas-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <BarChart className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Texas Electricity Prices | 75205
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-blue-100">
              Forecast & Market Outlook — 2025
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Complete analysis of Texas electricity market trends, wholesale price forecasts, 
              and what Dallas residents can expect in 2025.
            </p>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Market Forecast Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            2025 Price Forecast Overview
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingDown className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-green-900">Wholesale Price Forecast</h3>
              </div>
              <p className="text-green-800 mb-4">
                The U.S. Energy Information Administration (EIA) expects average wholesale electricity prices 
                in Texas (ERCOT North Hub) to <strong>decrease to about $27–34/MWh in 2025</strong>, 
                down from around $35/MWh in 2024.
              </p>
              <div className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">2024 Average</div>
                    <div className="font-bold text-gray-900">~$35/MWh</div>
                  </div>
                  <div>
                    <div className="text-gray-600">2025 Forecast</div>
                    <div className="font-bold text-green-600">$27–34/MWh</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-orange-900">Forward Strip Prices Are Much Higher</h3>
              </div>
              <p className="text-orange-800 mb-4">
                Forward contracts for 2025–2028 sit above <strong>$50/MWh</strong>, with summer on-peak months 
                like July and August trading near <strong>$110–$165/MWh</strong> in some hubs.
              </p>
              <div className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Annual Average</div>
                    <div className="font-bold text-orange-600">$50+/MWh</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Summer Peak</div>
                    <div className="font-bold text-texas-red">$110–165/MWh</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Comparison: Forecast vs. Forward Prices</h3>
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Metric</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Forecast (EIA)</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Market Forward Curve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Average Wholesale Price</td>
                  <td className="px-6 py-4 text-sm text-green-600 font-semibold">$27–34/MWh</td>
                  <td className="px-6 py-4 text-sm text-orange-600 font-semibold">Often $50+; summer peaks $110–165/MWh</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Basis</td>
                  <td className="px-6 py-4 text-sm text-gray-600">"Normal" demand, renewables ramp-up</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Risk premium for volatility, demand spikes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Purpose</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Model average outcome</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Price hedging or utilities' offer prices</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Takeaways for 2025</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <TrendingDown className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Wholesale Prices Could Drop</h3>
                  <p className="text-gray-600 text-sm">EIA's forecast assumes solar output increases and favorable gas prices.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Market Pricing Is Risk-Loaded</h3>
                  <p className="text-gray-600 text-sm">Forward strip pricing above $50/MWh reflects hedging against volatility and extreme events.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <TrendingUp className="h-6 w-6 text-texas-red mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Natural Gas Prices Expected to Rise</h3>
                  <p className="text-gray-600 text-sm">Fuel costs forecast to average $3.37/MMBtu, up ~24% from 2024.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Activity className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Rapid Demand Growth from Data Centers</h3>
                  <p className="text-gray-600 text-sm">Texas added about 13 TWh of data center demand between 2019–2023.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Zap className="h-6 w-6 text-texas-navy mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Massive Solar & Storage Build-Out</h3>
                  <p className="text-gray-600 text-sm">Plans to add tens of gigawatts, but project delays may limit near-term price relief.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <DollarSign className="h-6 w-6 text-gray-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Retail Rates Likely Steady</h3>
                  <p className="text-gray-600 text-sm">Will likely remain steady or increase modestly despite wholesale forecasts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Factors */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            What Influences Texas Electricity Prices in 2025?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyFactors.map((factor, index) => (
              <div key={index} className={`bg-${factor.color}-50 border border-${factor.color}-200 rounded-lg p-6`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${factor.color}-100 text-${factor.color}-600 rounded-lg mb-4`}>
                  <factor.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{factor.title}</h3>
                <div className={`text-sm font-medium text-${factor.color}-700 mb-3`}>{factor.impact}</div>
                <p className="text-gray-600 text-sm">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Consumer Advice */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Texans Can Manage Costs in 2025</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {consumerTips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-texas-cream text-texas-navy rounded-lg mr-4 mt-1 flex-shrink-0">
                  <tip.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-texas-cream-200 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info className="h-6 w-6 text-texas-navy mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Stay Informed on Transmission Costs</h3>
                <p className="text-texas-navy text-sm">
                  New grid investments could shift cost burdens—especially through rate structure changes—
                  facing residential customers unless broader reforms are approved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sources & References */}
        <div className="bg-gray-100 rounded-lg p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sources & References</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Government & Industry Sources:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>U.S. Energy Information Administration (EIA)</span>
                </li>
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Electric Reliability Council of Texas (ERCOT)</span>
                </li>
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>S&P Global Commodity Insights</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">News & Analysis:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Reuters Energy Market Reports</span>
                </li>
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Houston Chronicle Energy Coverage</span>
                </li>
                <li className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>EnergyBy5 Market Analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
              <Calculator className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Compare Current Rates</h3>
            <p className="text-gray-600 mb-6">
              Find the best electricity rates in Dallas area (75205) and lock in favorable pricing before market changes.
            </p>
            <button
              onClick={() => navigate('/texas/dallas/electricity-providers')}
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-texas-navy/90 transition-colors font-medium inline-flex items-center"
            >
              Compare Dallas Providers
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Explore Green Energy</h3>
            <p className="text-gray-600 mb-6">
              Reduce exposure to natural gas price volatility with 100% renewable energy plans from Texas wind and solar.
            </p>
            <button
              onClick={() => navigate('/shop/green-energy?state=texas')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center"
            >
              View Green Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Final Analysis */}
        <div className="mt-12 bg-texas-navy text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Final Analysis</h2>
          <p className="text-blue-100 text-lg leading-relaxed text-center max-w-4xl mx-auto">
            The forecast isn't wrong in quoting EIA's ~$30/MWh wholesale projection. However, 
            <strong className="text-white"> real-world market pricing and retail rates reflect a more cautious outlook</strong>, 
            placing 2025 strip prices firmly above $50/MWh. Consumers should monitor both forecasts <em>and</em> forward market trends—
            and choose fixed-rate plans wisely to lock in stability where possible.
          </p>
        </div>
      </div>
    </div>
  );
}