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
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <Zap className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Electricity Market Guide</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-8 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Navigate Texas
                <span className="block text-texas-gold mt-2">Electricity Like a Pro</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">880+ cities.</span> 
                <span className="text-white font-semibold">150+ providers.</span> 
                <span className="text-white/80">One guide that actually helps.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">Complete market coverage</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 font-medium">Honest provider reviews</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">Real rate comparisons</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">880+</div>
                <div className="text-blue-200 text-sm">Texas Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">150+</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">29M</div>
                <div className="text-blue-200 text-sm">Texans Served</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">85%</div>
                <div className="text-blue-200 text-sm">Market Coverage</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/shop')}
                className="bg-texas-red text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-texas-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Shop Texas Plans
              </button>
              <button
                onClick={() => navigate('/compare/plans')}
                className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
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
            <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-4">
              Major Texas Cities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Electricity plans and rates for Texas's largest metropolitan areas
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Houston', population: '2.3M', avgRate: '12.5¢' },
              { name: 'Dallas', population: '1.3M', avgRate: '11.8¢' },
              { name: 'Austin', population: '965K', avgRate: '13.2¢' },
              { name: 'San Antonio', population: '1.5M', avgRate: '12.1¢' },
              { name: 'Fort Worth', population: '918K', avgRate: '11.9¢' },
              { name: 'El Paso', population: '679K', avgRate: '10.8¢' }
            ].map((city) => (
              <div key={city.name} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-texas-cream rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-texas-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-texas-navy">{city.name}</h3>
                </div>
                <div className="space-y-3 mb-6 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Population:</span>
                    <span className="font-bold text-texas-navy">{city.population}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Avg Rate:</span>
                    <span className="font-bold text-texas-red">{city.avgRate}/kWh</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/texas/${city.name.toLowerCase()}-tx`)}
                  className="w-full bg-texas-red text-white py-3 px-6 rounded-xl font-semibold hover:bg-texas-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
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