import React from 'react';
import { useRouter } from './hooks/useRouter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Homepage } from './pages/Homepage';
import { StatePage } from './pages/StatePage';
import { CityPage } from './pages/CityPage';
import { ProviderPage } from './pages/ProviderPage';
import { ShopPage } from './pages/ShopPage';
import { StateElectricityProvidersPage } from './pages/StateElectricityProvidersPage';
import { StateElectricityPlansPage } from './pages/StateElectricityPlansPage';
import { StateElectricityRatesPage } from './pages/StateElectricityRatesPage';
import { StateSwitchProviderPage } from './pages/StateSwitchProviderPage';
import { StateNoDepositPage } from './pages/StateNoDepositPage';
import { StateMarketInfoPage } from './pages/StateMarketInfoPage';
import { TexasMarketForecastPage } from './pages/TexasMarketForecastPage';
import { TexasPage } from './pages/TexasPage';
import { TexasCityPage } from './pages/TexasCityPage';
import { TexasElectricityPage } from './pages/TexasElectricityPage';
import { TexasCompaniesPage } from './pages/TexasCompaniesPage';
import { TexasPlansPage } from './pages/TexasPlansPage';
import { ElectricityPlansPage } from './pages/ElectricityPlansPage';
import { ElectricityCompaniesPage } from './pages/ElectricityCompaniesPage';
import { BestPage } from './pages/BestPage';
import { MapPin, Search, Star } from 'lucide-react';
import { ZipCodeSearch } from './components/ZipCodeSearch';
import { CityElectricityProvidersPage } from './pages/CityElectricityProvidersPage';
import { CityElectricityRatesPage } from './pages/CityElectricityRatesPage';
import { CityElectricityPlansPage } from './pages/CityElectricityPlansPage';
import { CitySwitchProviderPage } from './pages/CitySwitchProviderPage';
import { CityNoDepositPage } from './pages/CityNoDepositPage';
import { ProviderComparisonPage } from './pages/ProviderComparisonPage';
import { CheapestElectricityLandingPage } from './pages/CheapestElectricityLandingPage';
import { ComparePage } from './pages/ComparePage';
import { CompareProvidersPage } from './pages/CompareProvidersPage';
import { ComparePlansPage } from './pages/ComparePlansPage';
import { CompareRatesPage } from './pages/CompareRatesPage';
import { Top5ProvidersPage } from './pages/Top5ProvidersPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { RatesPage } from './pages/RatesPage';
import { LocationsPage } from './pages/LocationsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { RateCalculatorPage } from './pages/RateCalculatorPage';
import { ResourcesGuidesPage } from './pages/ResourcesGuidesPage';
import { ResourcesFAQsPage } from './pages/ResourcesFAQsPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { LocationFinderPage } from './pages/LocationFinderPage';
import { mockStates } from './data/mockData';

function App() {
  const { route, navigate } = useRouter();

  const renderPage = () => {
    const { path, params } = route;

    // Homepage
    if (path === '/') {
      return <Homepage onNavigate={navigate} />;
    }

    // Handle any unmatched city/state combinations by redirecting to state page
    if (params.state && params.city && !params.provider && !params.providerA) {
      const stateData = mockStates.find(s => s.slug === params.state);
      if (!stateData) {
        // State doesn't exist, show location finder
        return <LocationFinderPage onNavigate={navigate} />;
      } else {
        const cityData = stateData.topCities.find(c => c.slug === params.city);
        if (!cityData) {
          // City doesn't exist, redirect to state providers page
          window.history.replaceState({}, '', `/${params.state}/electricity-providers`);
          return <StateElectricityProvidersPage state={params.state} onNavigate={navigate} />;
        }
      }
    }

    // Shop section
    if (path.startsWith('/shop')) {
      const category = path.split('/')[2];
      return <ShopPage category={category} onNavigate={navigate} />;
    }

    // Provider pages
    if (path.startsWith('/providers/') && params.provider) {
      return <ProviderPage providerId={params.provider} onNavigate={navigate} />;
    }

    // Provider comparison pages
    if (path.startsWith('/compare/providers/') && params.providerA && params.providerB) {
      return <ProviderComparisonPage 
        providerA={params.providerA} 
        providerB={params.providerB}
        state={params.state}
        onNavigate={navigate} 
      />;
    }

    // Special Texas state page
    if (path === '/texas') {
      return <TexasPage onNavigate={navigate} />;
    }

    // Texas-specific hub pages
    if (path === '/texas/electricity') {
      return <TexasElectricityPage onNavigate={navigate} />;
    }
    
    if (path === '/texas/electricity-companies') {
      return <TexasCompaniesPage onNavigate={navigate} />;
    }
    
    if (path === '/texas/electricity-plans') {
      return <TexasPlansPage onNavigate={navigate} />;
    }
    // Special Texas city pages (fallback for cities that don't have specific electricity-providers suffix)
    if (params.state === 'texas' && params.city && !path.includes('electricity-') && !path.includes('switch-') && !path.includes('no-deposit') && !path.includes('market-')) {
      return <TexasCityPage city={params.city} onNavigate={navigate} />;
    }

    // Cheapest electricity landing pages
    if (path.startsWith('/cheapest-electricity-')) {
      const location = path.replace('/cheapest-electricity-', '');
      // Parse city-state or just state
      const parts = location.split('-');
      if (parts.length >= 2) {
        // Assume last part is state abbreviation or state name
        const possibleState = parts[parts.length - 1];
        const possibleCity = parts.slice(0, -1).join('-');
        
        // Try to find matching state and city
        const foundState = mockStates.find(s => 
          s.slug === possibleState || s.abbreviation.toLowerCase() === possibleState
        );
        
        if (foundState) {
          const foundCity = foundState.topCities.find(c => c.slug === possibleCity);
          if (foundCity) {
            return <CheapestElectricityLandingPage 
              city={foundCity.slug} 
              state={foundState.slug} 
              onNavigate={navigate} 
            />;
          }
          return <CheapestElectricityLandingPage 
            state={foundState.slug} 
            onNavigate={navigate} 
          />;
        }
      }
      // Fallback to just location name
      return <CheapestElectricityLandingPage 
        city={location} 
        onNavigate={navigate} 
      />;
    }

    // State-specific pages
    if (params.state && path.endsWith('/electricity-providers')) {
      return <StateElectricityProvidersPage state={params.state} onNavigate={navigate} />;
    }
    
    if (params.state && path.endsWith('/electricity-plans')) {
      return <StateElectricityPlansPage state={params.state} onNavigate={navigate} />;
    }
    
    if (params.state && path.endsWith('/electricity-rates')) {
      return <StateElectricityRatesPage state={params.state} onNavigate={navigate} />;
    }
    
    if (params.state && path.endsWith('/switch-provider')) {
      return <StateSwitchProviderPage state={params.state} onNavigate={navigate} />;
    }
    
    if (params.state && path.endsWith('/no-deposit-electricity')) {
      return <StateNoDepositPage state={params.state} onNavigate={navigate} />;
    }
    
    if (params.state && path.endsWith('/market-info')) {
      return <StateMarketInfoPage state={params.state} onNavigate={navigate} />;
    }
    
    // State + City pages
    if (params.state && params.city && path.endsWith('/electricity-providers')) {
      return <CityElectricityProvidersPage state={params.state} city={params.city} onNavigate={navigate} />;
    }
    
    if (params.state && params.city && path.endsWith('/electricity-rates')) {
      return <CityElectricityRatesPage state={params.state} city={params.city} onNavigate={navigate} />;
    }
    
    if (params.state && params.city && path.endsWith('/electricity-plans')) {
      return <CityElectricityPlansPage state={params.state} city={params.city} onNavigate={navigate} />;
    }
    
    if (params.state && params.city && path.endsWith('/switch-provider')) {
      return <CitySwitchProviderPage state={params.state} city={params.city} onNavigate={navigate} />;
    }
    
    if (params.state && params.city && path.endsWith('/no-deposit-electricity')) {
      return <CityNoDepositPage state={params.state} city={params.city} onNavigate={navigate} />;
    }
    
    // Generic city pages (fallback for cities not in specific routes)
    if (params.state && params.city) {
      return <CityPage state={params.state} city={params.city} onNavigate={navigate} />;
    }

    // State pages
    if (params.state) {
      return <StatePage state={params.state} onNavigate={navigate} />;
    }

    // Compare section
    if (path.startsWith('/compare')) {
      // Top 5 providers page
      if (path === '/compare/providers/top-5') {
        return <Top5ProvidersPage onNavigate={navigate} />;
      }
      
      // Compare providers page
      if (path === '/compare/providers') {
        return <CompareProvidersPage onNavigate={navigate} />;
      }
      
      // Compare plans page
      if (path === '/compare/plans') {
        return <ComparePlansPage onNavigate={navigate} />;
      }
      
      // Compare rates page
      if (path === '/compare/rates') {
        return <CompareRatesPage onNavigate={navigate} />;
      }
      
      // Main compare page
      if (path === '/compare') {
        return <ComparePage onNavigate={navigate} />;
      }
    }

    // Providers directory
    if (path === '/providers') {
      return <ProvidersPage onNavigate={navigate} />;
    }

    // Electricity Plans hub
    if (path === '/electricity-plans') {
      return <ElectricityPlansPage onNavigate={navigate} />;
    }

    // Electricity Companies hub
    if (path === '/electricity-companies') {
      return <ElectricityCompaniesPage onNavigate={navigate} />;
    }

    // Best/Rankings hub
    if (path === '/best') {
      return <BestPage onNavigate={navigate} />;
    }

    // Rates section
    if (path.startsWith('/rates')) {
      if (path === '/rates/calculator') {
        return <RateCalculatorPage onNavigate={navigate} />;
      }
      return <RatesPage onNavigate={navigate} />;
    }

    // Locations directory
    if (path === '/locations') {
      return <LocationsPage onNavigate={navigate} />;
    }

    // Resources section
    if (path.startsWith('/resources')) {
      if (path === '/resources/guides') {
        return <ResourcesGuidesPage onNavigate={navigate} />;
      }
      if (path === '/resources/faqs') {
        return <ResourcesFAQsPage onNavigate={navigate} />;
      }
      if (path === '/resources/support/contact') {
        return <ContactPage onNavigate={navigate} />;
      }
      return <ResourcesPage onNavigate={navigate} />;
    }

    // Legal pages
    if (path === '/privacy-policy') {
      return <PrivacyPolicyPage onNavigate={navigate} />;
    }
    
    if (path === '/terms-of-service') {
      return <TermsOfServicePage onNavigate={navigate} />;
    }

    // Location finder fallback
    if (path === '/find-providers' || path === '/location-finder') {
      return <LocationFinderPage onNavigate={navigate} />;
    }

    // Texas market forecast page
    if (path === '/texas/electricity-prices' || path === '/texas/market-forecast' || path === '/texas/75205' || path === '/texas-electricity-prices-75205') {
      return <TexasMarketForecastPage onNavigate={navigate} />;
    }

    // 404 Not Found
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 text-blue-600 rounded-lg mb-8">
              <MapPin className="h-10 w-10" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Find Electricity Providers in Your Area
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Let us help you find electricity providers and rates available at your specific address.
            </p>
            
            <div className="max-w-md mx-auto mb-8">
              <ZipCodeSearch 
                onSearch={(zipCode) => {
                  // Enhanced ZIP routing
                  if (zipCode.startsWith('77') || zipCode.startsWith('75') || zipCode.startsWith('78') || zipCode.startsWith('76') || zipCode.startsWith('79')) {
                    navigate('/texas/houston/electricity-providers');
                  } else if (zipCode.startsWith('19') || zipCode.startsWith('15') || zipCode.startsWith('18') || zipCode.startsWith('16')) {
                    navigate('/pennsylvania/electricity-providers');
                  } else {
                    navigate('/find-providers');
                  }
                }} 
                placeholder="Enter your ZIP code to find providers"
              />
            </div>
            
            <button
              onClick={() => navigate('/find-providers')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
            >
              <Search className="h-4 w-4 mr-2" />
              Find Your Providers
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={navigate} />
      <main>
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;