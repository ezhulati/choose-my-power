import { useState, useEffect } from 'react';

interface RouteParams {
  [key: string]: string;
}

export interface Route {
  path: string;
  params: RouteParams;
  query: URLSearchParams;
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseCurrentRoute());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, params?: RouteParams) => {
    if (typeof window === 'undefined') return;
    
    let finalPath = path;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalPath = finalPath.replace(`[${key}]`, value);
      });
    }

    window.history.pushState({}, '', finalPath);
    setRoute(parseCurrentRoute());
  };

  return { route, navigate };
}

function parseCurrentRoute(): Route {
  // Handle SSR - default to homepage
  if (typeof window === 'undefined') {
    return {
      path: '/',
      params: {},
      query: new URLSearchParams()
    };
  }

  const path = window.location.pathname;
  const query = new URLSearchParams(window.location.search);
  
  // Parse dynamic segments
  const params: RouteParams = {};
  
  // Match state pages: /texas/
  const stateMatch = path.match(/^\/([a-z-]+)\/?$/);
  if (stateMatch && !['providers', 'rates', 'compare', 'shop', 'locations', 'resources', 'privacy-policy', 'terms-of-service', 'electricity-companies', 'electricity-plans', 'best'].includes(stateMatch[1])) {
    params.state = stateMatch[1];
  }
  
  // Match state-specific pages: /texas/electricity-providers/
  const statePageMatch = path.match(/^\/([a-z-]+)\/(electricity-providers|electricity-plans|electricity-rates|switch-provider|no-deposit-electricity|market-info)\/?$/);
  if (statePageMatch) {
    params.state = statePageMatch[1];
  }
  
  // Match city pages: /texas/houston/ and /texas/houston/electricity-providers/
  const cityMatch = path.match(/^\/([a-z-]+)\/([a-z-]+)(?:\/(electricity-providers|electricity-rates|electricity-plans|switch-provider|no-deposit-electricity))?\/?$/);
  if (cityMatch) {
    params.state = cityMatch[1];
    params.city = cityMatch[2];
    if (cityMatch[3]) {
      params.page = cityMatch[3];
    }
  }
  
  // Match provider pages: /providers/txu-energy/
  const providerMatch = path.match(/^\/providers\/([a-z0-9-]+)\/?$/);
  if (providerMatch) {
    params.provider = providerMatch[1];
  }
  
  // Match comparison pages: /compare/providers/txu-energy-vs-reliant-energy/
  const comparisonMatch = path.match(/^\/compare\/providers\/([a-z0-9-]+)-vs-([a-z0-9-]+)(?:\/([a-z-]+))?\/?$/);
  if (comparisonMatch) {
    params.providerA = comparisonMatch[1];
    params.providerB = comparisonMatch[2];
    if (comparisonMatch[3]) {
      params.state = comparisonMatch[3];
    }
  }

  return { path, params, query };
}