import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { Header } from './Header.tsx';
import { Footer } from './Footer';
import { Homepage } from './Homepage';

// Import all page components
// Note: Page imports removed as they are not currently used in this component

function App() {
  const { route, navigate } = useRouter();

  const renderPage = () => {
    const { path } = route;

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