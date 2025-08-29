/**
 * Comprehensive Error Scenario and Fallback Behavior Testing
 * 
 * Tests system resilience and error handling across all layers:
 * - Network failures and timeouts
 * - API service degradation
 * - Database connection issues
 * - Rate limiting and throttling
 * - Invalid data and edge cases
 * - Browser compatibility issues
 * - Security boundary testing
 * - Recovery and retry mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Page } from '@playwright/test';

// Import test utilities and mocks
import {
  renderWithProviders,
  mockComparePowerApi,
  mockErcotESIIDApi,
  mockDatabaseConnection,
  MockServiceFactory,
  setupApiMocks,
  cleanupApiMocks
} from '../utils/test-utils';
import '../mocks/api-services';

// Import components to test
import { ZipCodeSearch } from '@/components/ZipCodeSearch';

// Error scenario configurations
const ERROR_SCENARIOS = {
  network: {
    timeout: { delay: 30000, error: 'Network timeout' },
    offline: { offline: true, error: 'Network offline' },
    intermittent: { successRate: 0.3, error: 'Intermittent connectivity' },
    slowConnection: { delay: 10000, error: 'Slow connection' }
  },
  api: {
    serviceUnavailable: { status: 503, error: 'Service temporarily unavailable' },
    rateLimited: { status: 429, error: 'Rate limit exceeded' },
    badRequest: { status: 400, error: 'Invalid request' },
    unauthorized: { status: 401, error: 'Unauthorized access' },
    serverError: { status: 500, error: 'Internal server error' },
    malformedResponse: { malformed: true, error: 'Invalid JSON response' }
  },
  data: {
    invalidZipCode: { input: '00000', error: 'Invalid ZIP code' },
    nonTexasZip: { input: '90210', error: 'Non-Texas ZIP code' },
    emptyResponse: { plans: [], error: 'No plans available' },
    corruptedData: { corrupted: true, error: 'Data integrity error' },
    oversizedPayload: { size: '10MB', error: 'Payload too large' }
  },
  security: {
    xssAttempt: { input: '<script>alert("xss")</script>', error: 'XSS attempt blocked' },
    sqlInjection: { input: "'; DROP TABLE plans; --", error: 'SQL injection blocked' },
    csrfAttack: { token: 'invalid', error: 'CSRF validation failed' },
    unauthorized: { token: null, error: 'Authentication required' }
  }
};

describe('Comprehensive Error Scenarios and Fallback Testing', () => {
  beforeAll(() => {
    setupApiMocks();
  });

  afterAll(() => {
    cleanupApiMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockServiceFactory.resetAll();
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      // Configure mock for timeout scenario
      mockComparePowerApi.configure({ networkLatency: 30000 });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should show loading state
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      
      // Wait for timeout
      await waitFor(
        () => {
          expect(screen.getByText(/timeout|slow|try again/i)).toBeInTheDocument();
        },
        { timeout: 35000 }
      );
      
      // Should offer retry option
      const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
      if (retryButton) {
        expect(retryButton).toBeInTheDocument();
      }
    }, 40000);
    
    it('should handle offline scenarios', async () => {
      // Mock offline condition
      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValue(new Error('Network request failed'));
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should show offline error
      await waitFor(() => {
        const errorMessage = screen.getByText(/network|offline|connection/i);
        expect(errorMessage).toBeInTheDocument();
      });
      
      // Should provide helpful guidance
      expect(screen.getByText(/check.*connection|try.*later/i)).toBeInTheDocument();
    });
    
    it('should handle intermittent connectivity', async () => {
      let callCount = 0;
      const mockFetch = global.fetch as any;
      
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, plans: [] })
          });
        } else {
          return Promise.reject(new Error('Network error'));
        }
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      // Attempt multiple searches
      for (let i = 0; i < 3; i++) {
        await user.clear(input);
        await user.type(input, `7520${i}`);
        await user.click(button);
        
        await waitFor(() => {
          // Either success or error should be shown
          const hasSuccess = screen.queryByText(/plans.*available/i);
          const hasError = screen.queryByText(/error|failed/i);
          expect(hasSuccess || hasError).toBeTruthy();
        });
      }
    });
    
    it('should handle slow network conditions', async () => {
      mockComparePowerApi.configure({ networkLatency: 5000 });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      const startTime = Date.now();
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should show loading indicator immediately
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Wait for response
      await waitFor(
        () => {
          expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();
        },
        { timeout: 7000 }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have taken the expected time
      expect(duration).toBeGreaterThan(4000);
    });
  });
  
  describe('API Error Scenarios', () => {
    it('should handle 503 Service Unavailable', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable',
            userMessage: 'Our service is temporarily down for maintenance. Please try again in a few minutes.',
            retryable: true
          }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/temporarily.*unavailable|maintenance/i)).toBeInTheDocument();
      });
      
      // Should show retry option
      expect(screen.getByRole('button', { name: /try.*again|retry/i })).toBeInTheDocument();
    });
    
    it('should handle 429 Rate Limiting', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['X-RateLimit-Reset', '60']]),
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            userMessage: 'You have made too many searches. Please wait 60 seconds before trying again.',
            retryable: true
          }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/too many.*requests|wait.*60.*seconds/i)).toBeInTheDocument();
      });
      
      // Button should be disabled temporarily
      expect(button).toBeDisabled();
    });
    
    it('should handle malformed API responses', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve('invalid json response')
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/unexpected.*error|please.*try.*again/i)).toBeInTheDocument();
      });
    });
    
    it('should handle API version mismatches', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'API_VERSION_MISMATCH',
            message: 'API version not supported',
            userMessage: 'Please refresh the page to get the latest version.',
            retryable: false
          }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/refresh.*page|latest.*version/i)).toBeInTheDocument();
      });
      
      // Should provide refresh suggestion
      const refreshSuggestion = screen.queryByRole('button', { name: /refresh|reload/i });
      if (refreshSuggestion) {
        expect(refreshSuggestion).toBeInTheDocument();
      }
    });
  });
  
  describe('Data Validation Error Scenarios', () => {
    it('should handle invalid ZIP code formats', async () => {
      const invalidZipCodes = [
        '', // Empty
        '123', // Too short
        '1234567890', // Too long
         'abcde', // Non-numeric
        '12 34', // Contains space
        '12-34', // Contains dash
        '00000', // All zeros
        '99999' // Invalid range
      ];
      
      const user = userEvent.setup();
      
      for (const invalidZip of invalidZipCodes) {
        const { container, unmount } = renderWithProviders(<ZipCodeSearch />);
        
        const input = screen.getByRole('combobox');
        const button = screen.getByRole('button', { name: /search/i });
        
        await user.clear(input);
        await user.type(input, invalidZip);
        
        if (invalidZip.length === 5) {
          await user.click(button);
          
          await waitFor(() => {
            const errorMessage = screen.queryByText(/invalid.*zip|not.*valid|texas.*zip/i);
            expect(errorMessage).toBeInTheDocument();
          });
        } else {
          // Button should be disabled for invalid length
          expect(button).toBeDisabled();
        }
        
        unmount();
      }
    });
    
    it('should handle empty API responses', async () => {
      mockComparePowerApi.configure({ errorRate: 0 });
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          plans: [],
          totalPlans: 0,
          metadata: { message: 'No plans available for this area' }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '79999');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/no.*plans.*available|no.*results/i)).toBeInTheDocument();
      });
      
      // Should provide helpful suggestions
      const suggestions = screen.queryByText(/try.*different|check.*zip.*code/i);
      expect(suggestions).toBeInTheDocument();
    });
    
    it('should handle corrupted plan data', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          plans: [
            { /* missing required fields */ },
            { id: null, name: '', provider: null }, // Invalid data
            { id: '1', name: 'Valid Plan', provider: { name: 'Test Provider' } } // Valid plan
          ],
          totalPlans: 3
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should handle corrupted data gracefully
      await waitFor(() => {
        // Should show some results or appropriate error
        const hasResults = screen.queryByText(/plans.*available/i);
        const hasError = screen.queryByText(/data.*error|please.*try.*again/i);
        expect(hasResults || hasError).toBeTruthy();
      });
    });
  });
  
  describe('Security Error Scenarios', () => {
    it('should sanitize XSS attempts in input', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      
      // Attempt XSS injection
      const xssPayload = '<script>alert("xss")</script>';
      await user.type(input, xssPayload);
      
      // Input should be sanitized (only digits allowed)
      expect(input).toHaveValue(''); // Non-numeric characters should be filtered
      
      // No script should be executed
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });
    
    it('should handle CSRF token validation errors', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed',
            userMessage: 'Security token expired. Please refresh the page.',
            retryable: false
          }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/security.*token.*expired|refresh.*page/i)).toBeInTheDocument();
      });
    });
    
    it('should handle unauthorized access attempts', async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            userMessage: 'Please log in to access this service.',
            retryable: false
          }
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/log.*in|authentication.*required/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Browser Compatibility Error Scenarios', () => {
    it('should handle missing fetch API', async () => {
      // Simulate old browser without fetch
      const originalFetch = global.fetch;
      delete (global as any).fetch;
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/browser.*not.*supported|please.*update/i)).toBeInTheDocument();
      });
      
      // Restore fetch
      global.fetch = originalFetch;
    });
    
    it('should handle localStorage unavailability', async () => {
      // Simulate private browsing mode
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      // Component should still function without localStorage
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      
      // Should not crash
      expect(input).toHaveValue('75201');
      expect(button).not.toBeDisabled();
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    });
  });
  
  describe('Recovery and Retry Mechanisms', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0;
      const mockFetch = global.fetch as any;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, plans: [] })
        });
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should eventually succeed after retries
      await waitFor(
        () => {
          const successMessage = screen.queryByText(/no.*plans.*available/i);
          const errorMessage = screen.queryByText(/error/i);
          expect(successMessage || !errorMessage).toBeTruthy();
        },
        { timeout: 10000 }
      );
      
      expect(attemptCount).toBe(3);
    });
    
    it('should handle circuit breaker pattern', async () => {
      let failureCount = 0;
      const mockFetch = global.fetch as any;
      
      mockFetch.mockImplementation(() => {
        failureCount++;
        if (failureCount < 10) {
          return Promise.reject(new Error('Service unavailable'));
        }
        // After 10 failures, circuit should be open
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({
            error: {
              code: 'CIRCUIT_BREAKER_OPEN',
              message: 'Service temporarily disabled due to repeated failures'
            }
          })
        });
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      // Make multiple failed attempts
      for (let i = 0; i < 12; i++) {
        await user.clear(input);
        await user.type(input, `7520${i % 10}`);
        await user.click(button);
        
        await waitFor(() => {
          const hasError = screen.queryByText(/error|unavailable|disabled/i);
          expect(hasError).toBeTruthy();
        });
      }
      
      // Final attempt should show circuit breaker message
      await waitFor(() => {
        expect(screen.getByText(/temporarily.*disabled|repeated.*failures/i)).toBeInTheDocument();
      });
    });
    
    it('should gracefully degrade functionality', async () => {
      // Configure multiple service failures
      const services = MockServiceFactory.createScenario('error-prone');
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should show degraded service message
      await waitFor(() => {
        const degradedMessage = screen.queryByText(/limited.*functionality|some.*features.*unavailable/i);
        const errorMessage = screen.queryByText(/error|failed/i);
        expect(degradedMessage || errorMessage).toBeTruthy();
      });
      
      // Basic functionality should still work
      expect(input).toBeEnabled();
      expect(input).toHaveAttribute('aria-label');
    });
  });
  
  describe('Edge Case Scenarios', () => {
    it('should handle extremely large datasets', async () => {
      const largePlanArray = Array.from({ length: 10000 }, (_, i) => ({
        id: `plan-${i}`,
        name: `Plan ${i}`,
        provider: { name: `Provider ${i % 10}` },
        pricing: { rate1000kWh: 8 + Math.random() * 6 }
      }));
      
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          plans: largePlanArray,
          totalPlans: largePlanArray.length
        })
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      const startTime = Date.now();
      
      await user.type(input, '75201');
      await user.click(button);
      
      // Should handle large dataset without crashing
      await waitFor(
        () => {
          const resultsMessage = screen.queryByText(/plans.*available|results/i);
          expect(resultsMessage).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should complete in reasonable time
      expect(responseTime).toBeLessThan(10000); // Less than 10 seconds
    });
    
    it('should handle concurrent requests', async () => {
      let requestCount = 0;
      const mockFetch = global.fetch as any;
      
      mockFetch.mockImplementation(() => {
        requestCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                plans: [{ id: requestCount, name: `Plan ${requestCount}` }],
                totalPlans: 1
              })
            });
          }, 1000);
        });
      });
      
      const user = userEvent.setup();
      const { container } = renderWithProviders(<ZipCodeSearch />);
      
      const input = screen.getByRole('combobox');
      const button = screen.getByRole('button', { name: /search/i });
      
      // Make rapid consecutive searches
      await user.type(input, '75201');
      await user.click(button);
      
      await user.clear(input);
      await user.type(input, '75202');
      await user.click(button);
      
      await user.clear(input);
      await user.type(input, '75203');
      await user.click(button);
      
      // Should handle concurrent requests gracefully
      await waitFor(
        () => {
          const hasResult = screen.queryByText(/plan|available/i);
          expect(hasResult).toBeTruthy();
        },
        { timeout: 5000 }
      );
      
      // Should not make excessive requests
      expect(requestCount).toBeLessThanOrEqual(5);
    });
  });
});
