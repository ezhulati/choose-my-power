/**
 * Test Utilities for Enterprise ZIP Code Search System
 * 
 * Provides comprehensive testing utilities including:
 * - React Testing Library setup with custom providers
 * - Mock data generators for plans, providers, and TDSP info
 * - API response mocks for ComparePower and ERCOT services
 * - Custom render functions with providers
 * - Testing helpers for async operations and user interactions
 * - Performance and accessibility testing utilities
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi, MockedFunction } from 'vitest';
import userEvent from '@testing-library/user-event';
import type {
  ElectricityPlan,
  Provider,
  TdspInfo,
  ZipSearchResponse,
  ApiErrorResponse,
  SearchHistory,
  FavoriteAddress
} from '@/types/electricity-plans';

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate realistic electricity plan data for testing
 */
export function generateMockPlan(overrides: Partial<ElectricityPlan> = {}): ElectricityPlan {
  const baseRate = 8.5 + Math.random() * 6; // 8.5-14.5 cents/kWh
  const planId = `plan_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: planId,
    name: `${['TXU', 'Reliant', 'Direct Energy', 'Green Mountain'][Math.floor(Math.random() * 4)]} ${['Fixed', 'Variable', 'Indexed'][Math.floor(Math.random() * 3)]} Rate Plan`,
    provider: generateMockProvider(),
    contract: {
      type: ['fixed', 'variable', 'indexed'][Math.floor(Math.random() * 3)] as 'fixed' | 'variable' | 'indexed',
      length: [6, 12, 18, 24, 36][Math.floor(Math.random() * 5)],
      cancellationFee: Math.random() > 0.3 ? Math.floor(Math.random() * 200) + 50 : 0
    },
    pricing: {
      rate500kWh: baseRate + 0.5,
      rate1000kWh: baseRate,
      rate2000kWh: baseRate - 0.2,
      introductoryRate: Math.random() > 0.7 ? baseRate - 2 : null,
      introductoryPeriod: Math.random() > 0.7 ? 3 : null
    },
    features: {
      greenEnergy: Math.random() > 0.6 ? Math.floor(Math.random() * 100) + 1 : 0,
      timeOfUse: Math.random() > 0.8,
      smartThermostat: Math.random() > 0.7,
      deposit: {
        required: Math.random() > 0.6,
        amount: Math.random() > 0.6 ? Math.floor(Math.random() * 200) + 50 : 0,
        waivable: Math.random() > 0.5
      },
      autopay: {
        available: Math.random() > 0.3,
        discount: Math.random() > 0.3 ? Math.random() * 2 + 0.5 : 0
      }
    },
    fees: {
      monthly: Math.random() > 0.4 ? Math.floor(Math.random() * 20) + 5 : 0,
      connection: Math.floor(Math.random() * 50) + 25,
      lateFee: Math.floor(Math.random() * 30) + 10
    },
    factLabel: {
      url: `https://example.com/fact-labels/${planId}.pdf`,
      averageRate: baseRate,
      estimatedBill: {
        usage500: Math.floor(baseRate * 5),
        usage1000: Math.floor(baseRate * 10),
        usage2000: Math.floor(baseRate * 20)
      }
    },
    enrollmentUrl: `https://example.com/enroll/${planId}`,
    ...overrides
  };
}

/**
 * Generate realistic provider data for testing
 */
export function generateMockProvider(overrides: Partial<Provider> = {}): Provider {
  const providers = [
    { name: 'TXU Energy', code: 'TXU', rating: 4.2 },
    { name: 'Reliant Energy', code: 'REL', rating: 3.8 },
    { name: 'Direct Energy', code: 'DIR', rating: 3.5 },
    { name: 'Green Mountain Energy', code: 'GME', rating: 4.5 },
    { name: 'Gexa Energy', code: 'GEX', rating: 3.7 },
    { name: 'Discount Power', code: 'DIS', rating: 3.3 }
  ];
  
  const provider = providers[Math.floor(Math.random() * providers.length)];
  
  return {
    id: provider.code.toLowerCase(),
    name: provider.name,
    code: provider.code,
    logo: `/logos/${provider.code.toLowerCase()}.svg`,
    website: `https://${provider.code.toLowerCase()}.com`,
    phone: `1-800-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    rating: provider.rating,
    reviewCount: Math.floor(Math.random() * 5000) + 100,
    isGreen: Math.random() > 0.7,
    ...overrides
  };
}

/**
 * Generate realistic TDSP information for testing
 */
export function generateMockTdspInfo(overrides: Partial<TdspInfo> = {}): TdspInfo {
  const tdsps = [
    { name: 'Oncor Electric Delivery', duns: '055757763', zone: 'North' },
    { name: 'CenterPoint Energy Houston Electric', duns: '073140841', zone: 'Coast' },
    { name: 'AEP Texas Central Company', duns: '098807071', zone: 'South' },
    { name: 'Texas-New Mexico Power Company', duns: '080816643', zone: 'West' }
  ];
  
  const tdsp = tdsps[Math.floor(Math.random() * tdsps.length)];
  
  return {
    id: tdsp.duns,
    name: tdsp.name,
    duns: tdsp.duns,
    zone: tdsp.zone,
    serviceTerritory: [`${tdsp.zone} Texas`, 'Metropolitan Areas'],
    connectionFee: Math.floor(Math.random() * 50) + 25,
    reconnectionFee: Math.floor(Math.random() * 75) + 50,
    ...overrides
  };
}

/**
 * Generate complete search response for testing
 */
export function generateMockSearchResponse(overrides: Partial<ZipSearchResponse> = {}): ZipSearchResponse {
  const planCount = Math.floor(Math.random() * 20) + 5;
  const plans = Array.from({ length: planCount }, () => generateMockPlan());
  const tdsp = generateMockTdspInfo();
  
  return {
    success: true,
    plans,
    totalPlans: planCount,
    filteredPlans: planCount,
    tdsp,
    addressResolution: {
      resolvedAddress: '123 Main Street, Dallas, TX 75201',
      confidence: 'high',
      esiid: '10' + Math.floor(Math.random() * 9000000000) + 1000000000,
      premise: {
        streetNumber: '123',
        streetName: 'Main Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201'
      }
    },
    metadata: {
      city: 'Dallas',
      county: 'Dallas County',
      region: 'North Texas',
      searchTime: Math.floor(Math.random() * 2000) + 200,
      cacheHit: Math.random() > 0.5,
      apiVersion: '2.1.0'
    },
    filters: {
      applied: [],
      available: ['fixed', 'variable', '12-month', '24-month', 'green-energy', 'no-deposit']
    },
    ...overrides
  };
}

/**
 * Generate API error response for testing
 */
export function generateMockApiError(overrides: Partial<ApiErrorResponse> = {}): ApiErrorResponse {
  const errorTypes = ['INVALID_PARAMETERS', 'NO_PLANS_AVAILABLE', 'API_REQUEST_ERROR', 'RATE_LIMITED', 'INVALID_TDSP'];
  const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  
  return {
    type: errorType,
    message: `Mock error: ${errorType}`,
    userMessage: 'A test error occurred. Please try again.',
    context: { zipCode: '75201' },
    isRetryable: Math.random() > 0.5,
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate search history entries for testing
 */
export function generateMockSearchHistory(count: number = 3): SearchHistory[] {
  return Array.from({ length: count }, (_, index) => {
    const zipCodes = ['75201', '77001', '78701', '76101', '78401'];
    const cities = ['Dallas', 'Houston', 'Austin', 'Fort Worth', 'Corpus Christi'];
    const zipCode = zipCodes[index % zipCodes.length];
    const city = cities[index % cities.length];
    
    return {
      id: `history_${Date.now()}_${index}`,
      zipCode,
      city,
      timestamp: Date.now() - (index * 86400000), // Each entry 1 day older
      planCount: Math.floor(Math.random() * 25) + 5,
      searchTime: Math.floor(Math.random() * 2000) + 300,
      tdspName: ['Oncor', 'CenterPoint', 'AEP Texas'][index % 3]
    };
  });
}

/**
 * Generate favorite addresses for testing
 */
export function generateMockFavorites(count: number = 2): FavoriteAddress[] {
  return Array.from({ length: count }, (_, index) => {
    const locations = [
      { zip: '75201', address: '123 Main St', label: 'Home', city: 'Dallas' },
      { zip: '77001', address: '456 Oak Ave', label: 'Work', city: 'Houston' },
      { zip: '78701', address: '789 Pine Dr', label: 'Office', city: 'Austin' }
    ];
    
    const location = locations[index % locations.length];
    
    return {
      id: `favorite_${Date.now()}_${index}`,
      label: location.label,
      zipCode: location.zip,
      address: location.address,
      city: location.city,
      tdspInfo: generateMockTdspInfo(),
      savedAt: Date.now() - (index * 172800000) // Each entry 2 days older
    };
  });
}

// ============================================================================
// API Mocks
// ============================================================================

/**
 * Mock ComparePower API responses
 */
export const mockComparePowerApi = {
  /**
   * Mock successful plan search
   */
  mockSuccessfulSearch: (planCount: number = 10) => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    const response = generateMockSearchResponse({
      plans: Array.from({ length: planCount }, () => generateMockPlan()),
      totalPlans: planCount
    });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => response,
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-Response-Time': '245ms',
        'X-Cache-Hit': 'false'
      })
    } as Response);
    
    return response;
  },

  /**
   * Mock API error response
   */
  mockApiError: (errorType: string = 'API_REQUEST_ERROR', status: number = 500) => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    const error = generateMockApiError({ type: errorType });
    
    if (status >= 400) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
        json: async () => ({ success: false, errors: [error] }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      } as Response);
    } else {
      mockFetch.mockRejectedValueOnce(new Error(error.message));
    }
    
    return error;
  },

  /**
   * Mock network timeout
   */
  mockNetworkTimeout: (timeout: number = 5000) => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    );
  },

  /**
   * Mock rate limiting response
   */
  mockRateLimited: () => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          userMessage: 'Please wait a moment before searching again.',
          retryable: true
        }
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil((Date.now() + 60000) / 1000).toString()
      })
    } as Response);
  }
};

/**
 * Mock ERCOT ESIID API responses
 */
export const mockErcotApi = {
  /**
   * Mock successful ESIID resolution
   */
  mockSuccessfulResolution: (address: string, zipCode: string) => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    const esiid = '10' + Math.floor(Math.random() * 9000000000) + 1000000000;
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        esiid,
        tdsp_duns: '055757763',
        tdsp_name: 'Oncor Electric Delivery',
        confidence: 'high',
        resolved_address: address
      }),
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response);
  },

  /**
   * Mock ESIID resolution failure
   */
  mockResolutionFailure: () => {
    const mockFetch = global.fetch as MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Could not resolve address to ESIID',
          userMessage: 'Please verify your address and try again.'
        }
      }),
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response);
  }
};

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route for React Router testing
   */
  initialRoute?: string;
  /**
   * Mock user preferences
   */
  userPreferences?: {
    theme?: 'light' | 'dark';
    region?: string;
    favoriteProviders?: string[];
  };
}

/**
 * Custom render function with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    ...renderOptions
  } = options;

  // Create a wrapper component with all necessary providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Setup userEvent with custom options
 */
export function setupUserEvent(options?: Parameters<typeof userEvent.setup>[0]) {
  return userEvent.setup({
    delay: null, // Make tests run faster
    ...options
  });
}

// ============================================================================
// Testing Helpers
// ============================================================================

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingToComplete() {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();
  }, { timeout: 5000 });
}

/**
 * Wait for API calls to complete
 */
export async function waitForApiCall(mockFetch: MockedFunction<typeof fetch>) {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  }, { timeout: 3000 });
}

/**
 * Simulate typing with realistic delays
 */
export async function typeWithDelay(
  element: HTMLElement,
  text: string,
  delay: number = 50
) {
  const user = setupUserEvent({ delay });
  await user.type(element, text);
}

/**
 * Simulate form submission
 */
export async function submitForm(form: HTMLFormElement | HTMLElement) {
  const user = setupUserEvent();
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitButton) {
    await user.click(submitButton);
  } else {
    await user.type(form, '{enter}');
  }
}

/**
 * Get all visible elements by role
 */
export function getAllVisibleByRole(role: string) {
  const { screen } = await import('@testing-library/react');
  return screen.getAllByRole(role).filter((element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Check if element has focus within timeout
 */
export async function waitForFocus(element: HTMLElement, timeout: number = 1000) {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(element).toHaveFocus();
  }, { timeout });
}

/**
 * Mock window.matchMedia for responsive testing
 */
export function mockMatchMedia(query: string, matches: boolean = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock IntersectionObserver for visibility testing
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
}

/**
 * Performance testing helper
 */
export function measureRenderTime<T extends unknown[]>(
  renderFunction: (...args: T) => RenderResult,
  ...args: T
): { result: RenderResult; renderTime: number } {
  const startTime = performance.now();
  const result = renderFunction(...args);
  const endTime = performance.now();
  
  return {
    result,
    renderTime: endTime - startTime
  };
}

/**
 * Accessibility testing helper
 */
export async function checkAccessibility(container: HTMLElement) {
  // This would typically use @axe-core/react or similar
  // For now, we'll check basic accessibility features
  const forms = container.querySelectorAll('form');
  const inputs = container.querySelectorAll('input, textarea, select');
  const buttons = container.querySelectorAll('button');
  const links = container.querySelectorAll('a');
  
  // Check for required accessibility attributes
  inputs.forEach(input => {
    if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      console.warn('Input missing aria-label or aria-labelledby:', input);
    }
  });
  
  buttons.forEach(button => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      console.warn('Button missing accessible name:', button);
    }
  });
  
  links.forEach(link => {
    if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
      console.warn('Link missing accessible name:', link);
    }
  });
  
  return {
    formsCount: forms.length,
    inputsCount: inputs.length,
    buttonsCount: buttons.length,
    linksCount: links.length
  };
}

/**
 * Cleanup helper for tests
 */
export function cleanupTest() {
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as MockedFunction<typeof fetch>).mockReset();
  }
  
  // Clear localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
  
  // Clear sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.clear();
  }
}

// Re-export commonly used testing utilities
export { screen, waitFor, within, fireEvent } from '@testing-library/react';
export { userEvent };
