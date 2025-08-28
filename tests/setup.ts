import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia which is not implemented in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn().mockImplementation(async (url, options) => {
  // Return properly structured mock responses
  const mockApiResponse = {
    plans: [
      {
        id: 'mock-api-plan-1',
        provider: 'TXU Energy',
        plan_name: 'Mock API Fixed 12',
        rate_type: 'fixed',
        price_per_kwh: 0.115,
        term_months: 12,
        early_termination_fee: 150,
        deposit_required: false,
        renewable_percentage: 0,
        details_url: 'https://example.com/plan/1',
        enrollment_url: 'https://example.com/enroll/1'
      },
      {
        id: 'mock-api-plan-2',
        provider: 'Reliant Energy', 
        plan_name: 'Mock API Green 24',
        rate_type: 'fixed',
        price_per_kwh: 0.135,
        term_months: 24,
        early_termination_fee: 200,
        deposit_required: true,
        renewable_percentage: 100,
        details_url: 'https://example.com/plan/2',
        enrollment_url: 'https://example.com/enroll/2'
      }
    ],
    total: 2,
    page: 1,
    per_page: 50
  };

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => mockApiResponse,
    text: async () => JSON.stringify(mockApiResponse),
    headers: new Headers({
      'content-type': 'application/json'
    })
  };
});

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.COMPAREPOWER_API_URL = 'https://pricing.api.comparepower.com';

// Database configuration for testing (mock values)
process.env.NETLIFY_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NETLIFY_DATABASE_URL_UNPOOLED = 'postgresql://test:test@localhost:5432/test_db_unpooled';

// Redis configuration for testing
process.env.REDIS_URL = 'redis://localhost:6379';

// API keys for testing (mock values)
process.env.IDEOGRAM_API_KEY = 'test-ideogram-key';
process.env.FAL_KEY = 'test-fal-key';

// Mock Google Analytics (gtag)
global.gtag = vi.fn();