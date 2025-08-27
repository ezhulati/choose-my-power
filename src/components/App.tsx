import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { Header } from './Header';
import { Footer } from './Footer';
import { Homepage } from './Homepage';

// Import all page components
import { StatePage } from '../pages/StatePage';
import { CityPage } from '../pages/CityPage';
import { ProviderPage } from '../pages/ProviderPage';
import { ShopPage } from '../pages/ShopPage';
// ... import other pages as needed

function App() {
  const { route, navigate } = useRouter();

  const renderPage = () => {
    const { path, params } = route;

    // Homepage
    if (path === '/') {
      return <Homepage onNavigate={navigate} />;
    }

    // For now, just render homepage - we'll migrate other pages later
    return <Homepage onNavigate={navigate} />;
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