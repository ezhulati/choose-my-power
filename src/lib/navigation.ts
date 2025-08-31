/**
 * Navigation utilities for Astro-React integration
 * Provides consistent routing patterns across the application
 */

export interface NavigationOptions {
  replace?: boolean;
  target?: '_blank' | '_self';
}

/**
 * Client-side navigation function for use in React components
 * Handles both internal and external links appropriately
 */
export const navigate = (path: string, options: NavigationOptions = {}): void => {
  const { replace = false, target = '_self' } = options;
  
  // Handle external links
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (target === '_blank') {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = path;
    }
    return;
  }
  
  // Handle internal navigation
  if (replace) {
    window.location.replace(path);
  } else {
    window.location.href = path;
  }
};

/**
 * Programmatic navigation that can be passed as props to React components
 * This function is designed to be serializable and work with Astro's client directives
 */
export const createNavigateFunction = () => {
  return (path: string, options: NavigationOptions = {}) => {
    navigate(path, options);
  };
};

/**
 * Common route paths used throughout the application
 */
export const ROUTES = {
  HOME: '/',
  TEXAS: '/texas',
  COMPARE: '/compare',
  PROVIDERS: '/providers',
  RATES: '/rates',
  CALCULATOR: '/rates/calculator',
  SHOP: '/shop',
  
  // City-specific routes
  HOUSTON: '/texas/houston',
  DALLAS: '/texas/dallas',
  AUSTIN: '/texas/austin',
  SAN_ANTONIO: '/texas/san-antonio',
  FORT_WORTH: '/texas/fort-worth-tx',
  EL_PASO: '/texas/el-paso-tx',
  
  // Provider routes
  PROVIDER_DETAILS: (slug: string) => `/providers/${slug}`,
  CITY_PLANS: (city: string) => `/texas/${city.toLowerCase().replace(' ', '-')}-tx`,
  PLAN_DETAILS: (id: string) => `/plans/${id}`,
} as const;

/**
 * Route validation helper
 */
export const isValidRoute = (path: string): boolean => {
  // Basic validation - ensure path starts with / and doesn't contain dangerous patterns
  if (!path.startsWith('/')) return false;
  if (path.includes('..')) return false;
  if (path.includes('<script>')) return false;
  return true;
};

/**
 * Create a safe navigation function that validates routes
 */
export const createSafeNavigateFunction = () => {
  return (path: string, options: NavigationOptions = {}) => {
    if (!isValidRoute(path)) {
      console.error('Invalid route detected:', path);
      return;
    }
    navigate(path, options);
  };
};