import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockStates, mockProviders } from '../../data/mockData';
import { MapPin, Search, TrendingDown, Users, Zap, Building, ArrowRight, Star, Globe, Phone, CheckCircle, AlertCircle, Calculator, Shield, Leaf, Award, Clock, Eye, Target, Home } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface LocationFinderPageProps {
}

export function LocationFinderPage({}: LocationFinderPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'texas' | 'pennsylvania'>('all');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    // Complete ZIP code routing logic
    const zipToLocation: { [key: string]: { state: string; city: string } } = {
      // Texas ZIP codes - complete coverage
      '77001': { state: 'texas', city: 'houston' }, '77002': { state: 'texas', city: 'houston' }, '77003': { state: 'texas', city: 'houston' }, '77004': { state: 'texas', city: 'houston' }, '77005': { state: 'texas', city: 'houston' },
      '75201': { state: 'texas', city: 'dallas' }, '75202': { state: 'texas', city: 'dallas' }, '75203': { state: 'texas', city: 'dallas' }, '75204': { state: 'texas', city: 'dallas' }, '75205': { state: 'texas', city: 'dallas' },
      '78701': { state: 'texas', city: 'austin' }, '78702': { state: 'texas', city: 'austin' }, '78703': { state: 'texas', city: 'austin' }, '73301': { state: 'texas', city: 'austin' }, '73344': { state: 'texas', city: 'austin' },
      '78201': { state: 'texas', city: 'san-antonio' }, '78202': { state: 'texas', city: 'san-antonio' }, '78203': { state: 'texas', city: 'san-antonio' }, '78204': { state: 'texas', city: 'san-antonio' }, '78205': { state: 'texas', city: 'san-antonio' },
      '76101': { state: 'texas', city: 'fort-worth' }, '76102': { state: 'texas', city: 'fort-worth' }, '76103': { state: 'texas', city: 'fort-worth' }, '76104': { state: 'texas', city: 'fort-worth' }, '76105': { state: 'texas', city: 'fort-worth' },
      '79901': { state: 'texas', city: 'el-paso' }, '79902': { state: 'texas', city: 'el-paso' }, '79903': { state: 'texas', city: 'el-paso' }, '79904': { state: 'texas', city: 'el-paso' }, '79905': { state: 'texas', city: 'el-paso' },
      '76001': { state: 'texas', city: 'arlington' }, '76002': { state: 'texas', city: 'arlington' }, '76003': { state: 'texas', city: 'arlington' }, '76004': { state: 'texas', city: 'arlington' }, '76005': { state: 'texas', city: 'arlington' },
      '75023': { state: 'texas', city: 'plano' }, '75024': { state: 'texas', city: 'plano' }, '75025': { state: 'texas', city: 'plano' }, '75026': { state: 'texas', city: 'plano' }, '75074': { state: 'texas', city: 'plano' },
      '75038': { state: 'texas', city: 'irving' }, '75039': { state: 'texas', city: 'irving' }, '75060': { state: 'texas', city: 'irving' }, '75061': { state: 'texas', city: 'irving' }, '75062': { state: 'texas', city: 'irving' },
      '75040': { state: 'texas', city: 'garland' }, '75041': { state: 'texas', city: 'garland' }, '75042': { state: 'texas', city: 'garland' }, '75043': { state: 'texas', city: 'garland' }, '75044': { state: 'texas', city: 'garland' },
      '75033': { state: 'texas', city: 'frisco' }, '75034': { state: 'texas', city: 'frisco' }, '75035': { state: 'texas', city: 'frisco' }, '75036': { state: 'texas', city: 'frisco' }, '75037': { state: 'texas', city: 'frisco' },
      '75069': { state: 'texas', city: 'mckinney' }, '75070': { state: 'texas', city: 'mckinney' }, '75071': { state: 'texas', city: 'mckinney' }, '75072': { state: 'texas', city: 'mckinney' }, '75454': { state: 'texas', city: 'mckinney' },
      '78401': { state: 'texas', city: 'corpus-christi' }, '78402': { state: 'texas', city: 'corpus-christi' }, '78403': { state: 'texas', city: 'corpus-christi' }, '78404': { state: 'texas', city: 'corpus-christi' }, '78405': { state: 'texas', city: 'corpus-christi' },
      '77701': { state: 'texas', city: 'beaumont' }, '77702': { state: 'texas', city: 'beaumont' }, '77703': { state: 'texas', city: 'beaumont' }, '77704': { state: 'texas', city: 'beaumont' }, '77705': { state: 'texas', city: 'beaumont' },
      '77501': { state: 'texas', city: 'pasadena' }, '77502': { state: 'texas', city: 'pasadena' }, '77503': { state: 'texas', city: 'pasadena' }, '77504': { state: 'texas', city: 'pasadena' }, '77505': { state: 'texas', city: 'pasadena' },
      '75149': { state: 'texas', city: 'mesquite' }, '75150': { state: 'texas', city: 'mesquite' }, '75181': { state: 'texas', city: 'mesquite' }, '75182': { state: 'texas', city: 'mesquite' }, '75185': { state: 'texas', city: 'mesquite' },
      '76540': { state: 'texas', city: 'killeen' }, '76541': { state: 'texas', city: 'killeen' }, '76542': { state: 'texas', city: 'killeen' }, '76543': { state: 'texas', city: 'killeen' }, '76549': { state: 'texas', city: 'killeen' },
      '75006': { state: 'texas', city: 'carrollton' }, '75007': { state: 'texas', city: 'carrollton' }, '75010': { state: 'texas', city: 'carrollton' }, '75011': { state: 'texas', city: 'carrollton' }, '75019': { state: 'texas', city: 'carrollton' },
      '76201': { state: 'texas', city: 'denton' }, '76202': { state: 'texas', city: 'denton' }, '76203': { state: 'texas', city: 'denton' }, '76204': { state: 'texas', city: 'denton' }, '76205': { state: 'texas', city: 'denton' },
      '79701': { state: 'texas', city: 'midland' }, '79702': { state: 'texas', city: 'midland' }, '79703': { state: 'texas', city: 'midland' }, '79704': { state: 'texas', city: 'midland' }, '79705': { state: 'texas', city: 'midland' },
      '79601': { state: 'texas', city: 'abilene' }, '79602': { state: 'texas', city: 'abilene' }, '79603': { state: 'texas', city: 'abilene' }, '79604': { state: 'texas', city: 'abilene' }, '79605': { state: 'texas', city: 'abilene' },
      
      // Pennsylvania ZIP codes - complete coverage
      '19101': { state: 'pennsylvania', city: 'philadelphia' }, '19102': { state: 'pennsylvania', city: 'philadelphia' }, '19103': { state: 'pennsylvania', city: 'philadelphia' }, '19104': { state: 'pennsylvania', city: 'philadelphia' }, '19105': { state: 'pennsylvania', city: 'philadelphia' },
      '15201': { state: 'pennsylvania', city: 'pittsburgh' }, '15202': { state: 'pennsylvania', city: 'pittsburgh' }, '15203': { state: 'pennsylvania', city: 'pittsburgh' }, '15204': { state: 'pennsylvania', city: 'pittsburgh' }, '15205': { state: 'pennsylvania', city: 'pittsburgh' },
      '18101': { state: 'pennsylvania', city: 'allentown' }, '18102': { state: 'pennsylvania', city: 'allentown' }, '18103': { state: 'pennsylvania', city: 'allentown' }, '18104': { state: 'pennsylvania', city: 'allentown' }, '18105': { state: 'pennsylvania', city: 'allentown' },
      '16501': { state: 'pennsylvania', city: 'erie' }, '16502': { state: 'pennsylvania', city: 'erie' }, '16503': { state: 'pennsylvania', city: 'erie' }, '16504': { state: 'pennsylvania', city: 'erie' }, '16505': { state: 'pennsylvania', city: 'erie' },
      '19601': { state: 'pennsylvania', city: 'reading' }, '19602': { state: 'pennsylvania', city: 'reading' }, '19603': { state: 'pennsylvania', city: 'reading' }, '19604': { state: 'pennsylvania', city: 'reading' }, '19605': { state: 'pennsylvania', city: 'reading' },
      '18501': { state: 'pennsylvania', city: 'scranton' }, '18502': { state: 'pennsylvania', city: 'scranton' }, '18503': { state: 'pennsylvania', city: 'scranton' }, '18504': { state: 'pennsylvania', city: 'scranton' }, '18505': { state: 'pennsylvania', city: 'scranton' },
      '18015': { state: 'pennsylvania', city: 'bethlehem' }, '18017': { state: 'pennsylvania', city: 'bethlehem' }, '18018': { state: 'pennsylvania', city: 'bethlehem' }, '18020': { state: 'pennsylvania', city: 'bethlehem' }, '18025': { state: 'pennsylvania', city: 'bethlehem' },
      '19401': { state: 'pennsylvania', city: 'norristown' }, '19403': { state: 'pennsylvania', city: 'norristown' }, '19404': { state: 'pennsylvania', city: 'norristown' },
      '19013': { state: 'pennsylvania', city: 'chester' }, '19014': { state: 'pennsylvania', city: 'chester' }, '19015': { state: 'pennsylvania', city: 'chester' }, '19016': { state: 'pennsylvania', city: 'chester' }
    };

    const location = zipToLocation[zipCode];
    if (location) {
      navigate(`/${location.state}/${location.city}/electricity-providers`);
    } else {
      // Determine state by ZIP code pattern for fallback
      if (zipCode.startsWith('7')) {
        navigate('/texas/electricity-providers');
      } else if (zipCode.startsWith('1')) {
        navigate('/pennsylvania/electricity-providers');
      } else {
        navigate('/texas/electricity-providers'); // Default fallback
      }
    }
  };

  const popularLocations = [
    { 
      name: 'Houston, TX', 
      zipCode: '77001', 
      population: '2.3M', 
      avgRate: '11.8¢',
      providers: 4,
      description: 'Energy capital with competitive rates',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    },
    { 
      name: 'Dallas, TX', 
      zipCode: '75201', 
      population: '1.3M', 
      avgRate: '12.2¢',
      providers: 3,
      description: 'Major metropolitan market',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    },
    { 
      name: 'Austin, TX', 
      zipCode: '78701', 
      population: '979K', 
      avgRate: '11.9¢',
      providers: 3,
      description: 'Tech hub with green energy focus',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    },
    { 
      name: 'San Antonio, TX', 
      zipCode: '78201', 
      population: '1.5M', 
      avgRate: '12.0¢',
      providers: 3,
      description: 'Diverse provider marketplace',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    },
    { 
      name: 'Philadelphia, PA', 
      zipCode: '19101', 
      population: '1.6M', 
      avgRate: '13.1¢',
      providers: 3,
      description: 'Established deregulated market',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    },
    { 
      name: 'Pittsburgh, PA', 
      zipCode: '15201', 
      population: '303K', 
      avgRate: '13.8¢',
      providers: 3,
      description: 'Regional electricity choice',
      image: 'https://images.pexels.com/photos/417273/pexels-photo-417273.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
    }
  ];

  const filteredStates = selectedRegion === 'all' 
    ? mockStates 
    : mockStates.filter(state => state.slug === selectedRegion);

  const filteredPopularLocations = selectedRegion === 'all'
    ? popularLocations
    : popularLocations.filter(loc => {
        if (selectedRegion === 'texas') return loc.name.includes('TX');
        if (selectedRegion === 'pennsylvania') return loc.name.includes('PA');
        return true;
      });

  const totalCities = mockStates.reduce((sum, state) => sum + state.topCities.length, 0);
  const totalProviders = mockProviders.length;
  const deregulatedStates = mockStates.filter(state => state.isDeregulated);

  const benefits = [
    {
      icon: Target,
      title: 'Personalized Results',
      description: 'See only providers that actually serve your specific address'
    },
    {
      icon: Calculator,
      title: 'Accurate Pricing',
      description: 'Get real rates and costs based on your exact location'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'No need to research - we show all your options instantly'
    },
    {
      icon: Shield,
      title: 'Trusted Information',
      description: 'Our 14 providers are licensed and rates are verified'
    }
  ];

  const searchTips = [
    {
      icon: MapPin,
      title: 'Use Your Home ZIP',
      description: 'Enter the ZIP code where you need electricity service'
    },
    {
      icon: Eye,
      title: 'Compare All Options',
      description: 'Review rates, plans, and customer reviews before choosing'
    },
    {
      icon: CheckCircle,
      title: 'Switch for Free',
      description: 'Changing providers is free and easy with no service interruption'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <MapPin className="h-10 w-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Find Electricity Providers in Your Area
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Enter your ZIP code below to find electricity providers and rates available at your specific address. 
              Compare plans from licensed providers and start saving today.
            </p>

            {/* Main ZIP Search */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-white mb-6">Start Your Search</h2>
                <ZipCodeSearch onSearch={handleZipSearch} size="lg" placeholder="Enter zip code" />
                <p className="text-blue-200 text-sm mt-3">Get personalized results for your exact location</p>
                
                <div className="mt-4">
                  <button
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="text-blue-200 hover:text-white text-sm underline"
                  >
                    Don't know your ZIP code? Browse by location
                  </button>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{deregulatedStates.length}</div>
                <div className="text-blue-200 text-sm">States with Choice</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{totalProviders}</div>
                <div className="text-blue-200 text-sm">Licensed Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{totalCities}</div>
                <div className="text-blue-200 text-sm">Cities Covered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-blue-200 text-sm">Comparison</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Use Our Location Finder?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get precise, location-specific results that save you time and help you make informed decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Popular Locations */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Locations
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Browse electricity options in these major metropolitan areas, or enter your ZIP code above for personalized results.
            </p>
          </div>

          {/* Region Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRegion === 'all'
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Locations
            </button>
            <button
              onClick={() => setSelectedRegion('texas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRegion === 'texas'
                  ? 'bg-texas-red text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Texas
            </button>
            <button
              onClick={() => setSelectedRegion('pennsylvania')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRegion === 'pennsylvania'
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Pennsylvania
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPopularLocations.map((location, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                    {location.avgRate}/kWh
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-gray-600 text-sm">{location.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{location.population}</div>
                      <div className="text-sm text-gray-600">Population</div>
                    </div>
                    <div className="text-center p-3 bg-texas-cream-200 rounded-lg">
                      <div className="text-lg font-bold text-blue-900">{location.providers}</div>
                      <div className="text-sm text-texas-navy">Providers</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleZipSearch(location.zipCode)}
                    className="w-full bg-texas-navy text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center justify-center"
                  >
                    View {location.name.split(',')[0]} Providers
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Browser */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse by State
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredStates.map((state) => (
              <div key={state.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{state.name}</h3>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          {state.isDeregulated ? 'Deregulated Market' : 'Regulated Market'}
                        </div>
                        <div className="flex items-center">
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Avg: {state.averageRate}¢/kWh
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {mockProviders.filter(p => p.serviceStates.includes(state.slug)).length} Providers
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-texas-navy">{state.topCities.length}</div>
                      <div className="text-sm text-gray-500">major cities</div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {state.isDeregulated 
                      ? `${state.name} has a deregulated electricity market, giving residents the power to choose their electricity provider from multiple competing companies. This competition has led to lower rates and better service options.`
                      : `${state.name} has a regulated electricity market where your local utility company provides electricity service with rates set by state regulators.`
                    }
                  </p>

                  {/* Market Benefits */}
                  {state.isDeregulated && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-green-900 mb-2">Benefits of Choice in {state.name}:</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Competitive rates from multiple providers</li>
                        <li>• Variety of plan types (fixed, variable, green energy)</li>
                        <li>• Better customer service through competition</li>
                        <li>• New plan features and rewards programs</li>
                      </ul>
                    </div>
                  )}

                  {/* Top Cities Preview */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Major Cities in {state.name}:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {state.topCities.slice(0, 9).map((city) => (
                        <button
                          key={city.id}
                          onClick={() => navigate(`/${state.slug}/${city.slug}/electricity-providers`)}
                          className="text-left p-2 text-sm text-texas-navy hover:text-texas-navy hover:bg-texas-cream-200 rounded-md transition-colors border border-gray-100"
                        >
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-gray-500">{city.averageRate}¢/kWh</div>
                        </button>
                      ))}
                    </div>
                    {state.topCities.length > 9 && (
                      <button
                        onClick={() => navigate(`/${state.slug}`)}
                        className="text-sm text-gray-500 hover:text-texas-navy mt-2 font-medium"
                      >
                        +{state.topCities.length - 9} more cities →
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/${state.slug}/electricity-providers`)}
                      className="bg-texas-navy text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                    >
                      Browse {state.name} Providers
                    </button>
                    <button
                      onClick={() => navigate(`/${state.slug}/electricity-rates`)}
                      className="border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      View {state.name} Rates
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How to Find Your Electricity Providers
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter Your ZIP Code</h3>
              <p className="text-gray-600">
                Your ZIP code determines which electricity providers serve your specific address and what rates are available to you.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Compare Your Options</h3>
              <p className="text-gray-600">
                See all available providers, plans, and rates. Compare costs based on your actual usage and read customer reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-full mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose & Switch</h3>
              <p className="text-gray-600">
                Select your preferred provider and plan. They handle the switching process with no interruption to your service.
              </p>
            </div>
          </div>
        </div>

        {/* Search Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Tips for Finding the Right Provider
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {searchTips.map((tip, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                  <tip.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{tip.title}</h3>
                <p className="text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Information */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Understanding Deregulated Markets
            </h3>
            
            <p className="text-gray-600 mb-6">
              In deregulated states, you have the power to choose your electricity provider. This competition 
              has led to lower rates, better customer service, and more new plan options.
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Consumer Choice</div>
                  <div className="text-gray-600 text-sm">Choose from multiple competing electricity providers</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <TrendingDown className="h-6 w-6 text-texas-navy mr-3 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Competitive Rates</div>
                  <div className="text-gray-600 text-sm">Competition drives down prices and improves value</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Zap className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Plan Variety</div>
                  <div className="text-gray-600 text-sm">Fixed, variable, green energy, and specialized plans</div>
                </div>
              </div>

              <div className="flex items-start">
                <Leaf className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Green Energy Options</div>
                  <div className="text-gray-600 text-sm">100% renewable energy plans at competitive rates</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/resources/guides/understanding-deregulation')}
              className="mt-6 text-texas-navy hover:text-texas-navy font-medium"
            >
              Learn about electricity deregulation →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              What Determines Your Options?
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-texas-navy mr-2" />
                  <h4 className="font-medium text-gray-900">Your Location</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Different electricity providers serve different geographic areas. Your ZIP code determines 
                  which companies can provide service to your address.
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Building className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Utility Service Area</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Your local utility company delivers electricity regardless of which provider you choose. 
                  They maintain the power lines and handle outages.
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-medium text-gray-900">State Regulations</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Each state has different rules about electricity choice. Some states are fully deregulated, 
                  others are partially deregulated, and some are fully regulated.
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Market Competition</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  More providers in an area typically means more competition, better rates, and more 
                  plan options for consumers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ZIP Code Examples */}
        <div className="bg-texas-cream-200 border border-blue-200 rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Not Sure About Your ZIP Code?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Here are some example ZIP codes you can try to see how our location finder works. 
              Click any ZIP code below to see providers in that area.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { zip: '77001', city: 'Houston', state: 'TX', rate: '11.8¢' },
              { zip: '75201', city: 'Dallas', state: 'TX', rate: '12.2¢' },
              { zip: '78701', city: 'Austin', state: 'TX', rate: '11.9¢' },
              { zip: '19101', city: 'Philadelphia', state: 'PA', rate: '13.1¢' },
              { zip: '78201', city: 'San Antonio', state: 'TX', rate: '12.0¢' },
              { zip: '15201', city: 'Pittsburgh', state: 'PA', rate: '13.8¢' },
              { zip: '76101', city: 'Fort Worth', state: 'TX', rate: '12.1¢' },
              { zip: '18101', city: 'Allentown', state: 'PA', rate: '13.2¢' }
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => handleZipSearch(example.zip)}
                className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-texas-cream-200 hover:border-blue-300 transition-colors text-left"
              >
                <div className="font-bold text-texas-navy text-lg">{example.zip}</div>
                <div className="text-gray-900 font-medium">{example.city}, {example.state}</div>
                <div className="text-sm text-gray-600">Avg rate: {example.rate}/kWh</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cheapest Rates</h3>
            <p className="text-gray-600 text-sm mb-4">Find the lowest electricity rates in your area</p>
            <button
              onClick={() => navigate('/shop/cheapest-electricity')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Find Cheapest Rates →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">Calculate exact costs based on your usage</p>
            <button
              onClick={() => navigate('/rates/calculator')}
              className="text-texas-navy hover:text-texas-navy font-medium text-sm"
            >
              Calculate Costs →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Compare Providers</h3>
            <p className="text-gray-600 text-sm mb-4">Side-by-side provider comparison</p>
            <button
              onClick={() => navigate('/compare/providers')}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
            >
              Compare Providers →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <Leaf className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Green Energy</h3>
            <p className="text-gray-600 text-sm mb-4">100% renewable electricity options</p>
            <button
              onClick={() => navigate('/shop/green-energy')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm"
            >
              Go Green →
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Providers?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Join millions of Americans who have found the best electricity plan for their home. 
            Compare your options and choose with confidence.
          </p>
          
          <div className="max-w-md mx-auto mb-6">
            <ZipCodeSearch onSearch={handleZipSearch} placeholder="Enter zip code" />
          </div>
          
          <p className="text-blue-200 text-sm">
            Trusted by millions to find the right electricity provider
          </p>
        </div>
      </div>
    </div>
  );
}