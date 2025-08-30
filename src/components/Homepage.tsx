import React from 'react';
import { Zap, Calculator, Leaf, Users, TrendingDown, Battery, Award, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ZipCodeSearch } from './ZipCodeSearch';
import { getCityFromZip } from '../config/tdsp-mapping';
import { getCredibleMarketingText, DEFAULT_COUNTS } from '../lib/utils/dynamic-counts';
import { DynamicHeroMessaging } from './DynamicHeroMessaging';

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
      {/* Hero Section - Mobile-First Responsive */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <DynamicHeroMessaging />
            
            <div className="max-w-md mx-auto mb-6 sm:mb-8">
              <ZipCodeSearch 
                onSearch={handleZipSearch}
                placeholder="Enter zip code"
                size="lg"
              />
            </div>

            <div className="text-blue-200">
              <p className="text-sm sm:text-base md:text-lg">{DEFAULT_COUNTS.providers} providers we actually tested • All the real prices • No nonsense, just facts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits - Mobile-First Grid */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Which Companies Are Actually Good?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We tested {DEFAULT_COUNTS.providers} quality providers. Called support at 2am. Here's who's good, who's cheap, and who will ghost you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Actually Green (Not Greenwashed)</h3>
              <p className="text-sm sm:text-base text-gray-600">We checked - these are really 100% renewable, not just pretending</p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-texas-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-texas-navy" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">They Actually Answer the Phone</h3>
              <p className="text-sm sm:text-base text-gray-600">We called them all. These ones actually pick up and help</p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Cheapest Without the Games</h3>
              <p className="text-sm sm:text-base text-gray-600">Real total cost, all fees included. No teaser rates.</p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Battery className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Smart Home Ready</h3>
              <p className="text-sm sm:text-base text-gray-600">Plans that work with your Nest, smart thermostat, and EV charger</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Responsive Card Grid */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Find What You're Looking For
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Start with the right tool for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/electricity-companies')}
            >
              <CardContent className="p-4 sm:p-6">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-texas-navy mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Who's Actually Good?</h3>
                <p className="text-sm sm:text-base text-gray-600">Honest rankings of which companies won't screw you over</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/compare')}
            >
              <CardContent className="p-4 sm:p-6">
                <BarChart className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">See Side-by-Side</h3>
                <p className="text-sm sm:text-base text-gray-600">Compare real prices without the marketing nonsense</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/shop')}
            >
              <CardContent className="p-4 sm:p-6">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">What Matters Most?</h3>
                <p className="text-sm sm:text-base text-gray-600">Cheapest rate, best service, green energy, or smart home features?</p>
              </CardContent>
            </Card>

            <Card 
              variant="plan-card" 
              className="cursor-pointer"
              onClick={() => onNavigate('/rates/calculator')}
            >
              <CardContent className="p-4 sm:p-6">
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">What Will I Actually Pay?</h3>
                <p className="text-sm sm:text-base text-gray-600">Get real monthly costs based on your actual usage</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Market Stats - Mobile-Optimized Stats Grid */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Market Coverage & Expert Analysis
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Complete coverage of deregulated electricity markets
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card variant="elevated" className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-texas-navy mb-2">{DEFAULT_COUNTS.providers}</div>
                <div className="text-sm sm:text-base text-gray-600">Licensed Providers</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">6</div>
                <div className="text-sm sm:text-base text-gray-600">Expert Categories</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{DEFAULT_COUNTS.plans}+</div>
                <div className="text-sm sm:text-base text-gray-600">Available Plans</div>
              </CardContent>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">25+</div>
                <div className="text-sm sm:text-base text-gray-600">Major Cities</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile-Optimized */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Find Your Best Provider?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">
            Join millions who have found the right electricity provider using our expert analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
            <Button
              variant="texas-outline"
              size="lg"
              onClick={() => onNavigate('/electricity-companies')}
              className="inline-flex items-center justify-center gap-2 bg-white text-texas-navy hover:bg-texas-navy hover:text-white w-full sm:w-auto px-6 py-3"
            >
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Find Best Companies</span>
            </Button>
            <Button
              variant="texas-secondary"
              size="lg"
              onClick={() => onNavigate('/compare')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3"
            >
              <BarChart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Compare Options</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}