import React from 'react';
import { Zap, Calculator, Leaf, Users, TrendingDown, Battery, Award, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ZipCodeSearch } from './ZipCodeSearch';
import { getCityFromZip } from '../config/tdsp-mapping';
import { getCredibleMarketingText, DEFAULT_COUNTS } from '../lib/utils/dynamic-counts';

interface HomepageProps {
  onNavigate: (path: string) => void;
}

export function Homepage({ onNavigate }: HomepageProps) {
  const handleZipSearch = (zipCode: string) => {
    console.log('Homepage handleZipSearch called with ZIP:', zipCode);
    
    // Try to find the city for this ZIP code
    const city = getCityFromZip(zipCode);
    console.log('City lookup result:', city);
    
    if (city) {
      console.log('Navigating to city page:', `/texas/${city}`);
      // Use native browser navigation to go from React page to Astro page
      window.location.href = `/texas/${city}`;
    } else {
      console.log('ZIP code not found in mapping, checking pattern...');
      // ZIP code not found, try to determine state by ZIP code pattern
      if (zipCode.startsWith('7')) {
        console.log('Texas ZIP code detected, going to Texas providers page');
        // Texas ZIP code, but city not in our mapping - go to Texas page
        onNavigate('/texas/electricity-providers');
      } else {
        console.log('Unknown ZIP code, going to locations page');
        // Not a Texas ZIP code or unknown - go to locations page
        onNavigate('/locations');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Compare & Choose Texas Electricity
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {getCredibleMarketingText(DEFAULT_COUNTS.providers, DEFAULT_COUNTS.plans).heroText}
            </p>
            
            <div className="max-w-md mx-auto mb-8">
              <ZipCodeSearch 
                onSearch={handleZipSearch}
                placeholder="Enter your ZIP code"
                size="lg"
              />
            </div>

            <div className="text-blue-200">
              <p className="text-lg">{DEFAULT_COUNTS.providers} Expert-Ranked Providers • 6 Specializations • Free Comparison Tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Expert Analysis & Category Rankings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We analyze providers by specialization to help you find exactly what you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Green Energy Leaders</h3>
              <p className="text-gray-600">100% renewable specialists with competitive green rates</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-texas-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-texas-navy" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Champions</h3>
              <p className="text-gray-600">Top-rated customer service and satisfaction leaders</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Value</h3>
              <p className="text-gray-600">Lowest total costs with competitive rates and minimal fees</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Battery className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tech Innovation</h3>
              <p className="text-gray-600">Smart home integration and advanced technology features</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find What You're Looking For
            </h2>
            <p className="text-xl text-gray-600">
              Start with the right tool for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/electricity-companies')}
            >
              <CardContent className="p-6">
                <Award className="w-8 h-8 text-texas-navy mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Companies</h3>
                <p className="text-gray-600">Expert-ranked electricity companies by specialization</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/compare')}
            >
              <CardContent className="p-6">
                <BarChart className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Options</h3>
                <p className="text-gray-600">Side-by-side comparison of companies, plans, and rates</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/shop')}
            >
              <CardContent className="p-6">
                <Zap className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop by Priority</h3>
                <p className="text-gray-600">Find options based on price, service, green energy, or features</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/rates/calculator')}
            >
              <CardContent className="p-6">
                <Calculator className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculate Costs</h3>
                <p className="text-gray-600">See exact costs and savings based on your usage</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Market Coverage & Expert Analysis
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive coverage of deregulated electricity markets
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card variant="elevated" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-texas-navy mb-2">{DEFAULT_COUNTS.providers}</div>
                <div className="text-gray-600">Licensed Providers</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">6</div>
                <div className="text-gray-600">Expert Categories</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">{DEFAULT_COUNTS.plans}+</div>
                <div className="text-gray-600">Available Plans</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">25+</div>
                <div className="text-gray-600">Major Cities</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Perfect Provider?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join millions who have found the right electricity provider using our expert analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="texas-outline"
              size="lg"
              onClick={() => onNavigate('/electricity-companies')}
              className="inline-flex items-center gap-2 bg-white text-texas-navy hover:bg-texas-navy hover:text-white"
            >
              <Award className="w-5 h-5" />
              Find Best Companies
            </Button>
            <Button
              variant="texas-secondary"
              size="lg"
              onClick={() => onNavigate('/compare')}
              className="inline-flex items-center gap-2"
            >
              <BarChart className="w-5 h-5" />
              Compare Options
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}