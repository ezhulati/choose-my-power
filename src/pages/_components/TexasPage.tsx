import React from 'react';
import { Zap, MapPin, Star, Users, TrendingDown, Shield } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

export const TexasPage: React.FC = () => {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-texas-cream to-gray-50">
      {/* Elegant Hero Section */}
      <div className="bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-6">
              <Zap className="h-8 w-8" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-relaxed max-w-4xl mx-auto">
                Texas Electricity Market Guide
              </h1>
              
              <p className="text-base md:text-lg text-blue-100/80 font-normal max-w-3xl mx-auto leading-relaxed">
                Navigate the deregulated Texas electricity market with confidence. 
                <span className="text-white font-medium">Compare providers across 880+ cities</span> and find the best plan for your home.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto border border-white/20">
                <p className="text-sm text-white/90 font-normal">
                  <span className="text-texas-gold font-medium">Complete market overview</span> with honest provider comparisons.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => navigate('/shop')}
                className="bg-texas-red text-white px-6 py-3 rounded-lg font-medium hover:bg-texas-red-600 transition-colors"
              >
                Shop Texas Plans
              </button>
              <button
                onClick={() => navigate('/compare/plans')}
                className="border border-white/50 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Compare Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Market Stats */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Texas Electricity Market Overview
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Understanding the deregulated market that serves 29 million Texans
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-texas-navy/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-texas-navy" />
              </div>
              <div className="text-2xl font-bold text-texas-navy mb-2">150+</div>
              <div className="text-sm text-gray-600">Licensed Providers</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-texas-navy/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-texas-navy" />
              </div>
              <div className="text-2xl font-bold text-texas-navy mb-2">29M</div>
              <div className="text-sm text-gray-600">Texas Residents</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-texas-gold/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-6 h-6 text-texas-gold" />
              </div>
              <div className="text-2xl font-bold text-texas-gold mb-2">85%</div>
              <div className="text-sm text-gray-600">Deregulated Market</div>
            </div>
          </div>
        </div>
      </div>

      {/* Major Texas Cities */}
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Major Texas Cities
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Electricity plans and rates for Texas's largest metropolitan areas
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Houston', population: '2.3M', avgRate: '12.5¢' },
              { name: 'Dallas', population: '1.3M', avgRate: '11.8¢' },
              { name: 'Austin', population: '965K', avgRate: '13.2¢' },
              { name: 'San Antonio', population: '1.5M', avgRate: '12.1¢' },
              { name: 'Fort Worth', population: '918K', avgRate: '11.9¢' },
              { name: 'El Paso', population: '679K', avgRate: '10.8¢' }
            ].map((city) => (
              <div key={city.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <MapPin className="w-6 h-6 text-texas-navy mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">{city.name}</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Population: {city.population}</div>
                  <div>Avg Rate: {city.avgRate}/kWh</div>
                </div>
                <button
                  onClick={() => navigate(`/texas/${city.name.toLowerCase()}-tx`)}
                  className="mt-4 w-full bg-texas-red text-white py-2 px-4 rounded-lg hover:bg-texas-red-600 transition-colors"
                >
                  View {city.name} Plans
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Choose Texas Electricity Plans?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-texas-navy mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Regulated & Safe</h3>
              <p className="text-gray-600">
                Our providers are regulated by the Texas Public Utility Commission
              </p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-texas-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Best Rates</h3>
              <p className="text-gray-600">
                Compare rates from licensed providers to find the lowest prices
              </p>
            </div>
            <div className="text-center">
              <Zap className="w-12 h-12 text-texas-red mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Easy Switch</h3>
              <p className="text-gray-600">
                Switch providers quickly without service interruption
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-texas-red to-texas-navy text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Your Best Texas Plan?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Enter your ZIP code to see personalized rates and plans in your area
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/shop')}
              className="bg-white text-texas-navy px-8 py-4 rounded-lg font-semibold text-lg hover:bg-texas-cream transition-colors"
            >
              Start Shopping
            </button>
            <button
              onClick={() => navigate('/rates/calculator')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-texas-navy transition-colors"
            >
              Calculate Savings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TexasPage;