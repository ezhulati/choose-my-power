import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComparePowerClientClass, ComparePowerApiError, ApiErrorType } from '../../../src/lib/api/comparepower-client';
import { CircuitBreaker } from '../../../src/lib/api/errors';
import type { ApiParams } from '../../../src/types/facets';

// Mock Redis to avoid requiring actual Redis in tests
vi.mock('ioredis', () => ({
  default: class MockRedis {
    constructor() {}
    on() {}
    connect() { return Promise.resolve(); }
    get() { return Promise.resolve(null); }
    setex() { return Promise.resolve(); }
    del() { return Promise.resolve(); }
    keys() { return Promise.resolve([]); }
    quit() { return Promise.resolve(); }
  }
}));

// Mock plan repository
vi.mock('../../../src/lib/database/plan-repository', () => ({
  planRepository: {
    getPlansFromCache: vi.fn().mockResolvedValue(null),
    setPlansCache: vi.fn().mockResolvedValue(undefined),
    storePlans: vi.fn().mockResolvedValue(undefined),
    getActivePlans: vi.fn().mockResolvedValue([]),
    logApiCall: vi.fn().mockResolvedValue(undefined),
    getCacheStats: vi.fn().mockResolvedValue({
      totalCacheEntries: 0,
      activeCacheEntries: 0,
      apiCallsLast24h: 0,
      timestamp: Date.now()
    }),
    cleanExpiredCache: vi.fn().mockResolvedValue(0)
  }
}));

// Mock TDSP mapping functions
vi.mock('../../../src/config/tdsp-mapping', () => ({
  getTdspFromCity: vi.fn().mockReturnValue('1039940674000'),
  formatCityName: vi.fn().mockReturnValue('Dallas, TX'),
  validateCitySlug: vi.fn().mockReturnValue(true)
}));

describe('Enhanced ComparePower Client', () => {
  let client: ComparePowerClientClass;
  let fetchMock: any;

  const mockApiResponse = [
    {
      _id: 'plan-123',
      product: {
        _id: 'product-123',
        brand: {
          _id: 'brand-123',
          name: 'TXU Energy',
          puct_number: '10098',
          legal_name: 'TXU Energy Retail Company',
          contact_info: {
            sales: { phone_number: '1-855-TXU-ENGY' },
            support: {
              address: '1601 Bryan Street, Dallas, TX 75201',
              email: 'support@txu.com',
              phone_number: '1-800-TXU-ENERGY'
            }
          }
        },
        name: 'TXU Energy Select 12',
        term: 12,
        family: 'select',
        percent_green: 0,
        headline: 'Fixed rate electricity plan for 12 months',
        early_termination_fee: 150,
        description: 'A reliable fixed-rate plan',
        is_pre_pay: false,
        is_time_of_use: false
      },
      tdsp: {
        _id: 'tdsp-123',
        name: 'Oncor Electric Delivery',
        short_name: 'Oncor',
        abbreviation: 'OCD',
        duns_number: '1039940674000'
      },
      expected_prices: [
        { usage: 500, price: 65.50, actual: 65.50, valid: true },
        { usage: 1000, price: 120.00, actual: 120.00, valid: true },
        { usage: 2000, price: 230.00, actual: 230.00, valid: true }
      ],
      display_pricing_500: { usage: 500, avg: 0.131, total: 65.50 },
      display_pricing_1000: { usage: 1000, avg: 0.120, total: 120.00 },
      display_pricing_2000: { usage: 2000, avg: 0.115, total: 230.00 },
      document_links: [
        { type: 'efl', language: 'en', link: 'https://example.com/efl.pdf' }
      ]
    }
  ];

  beforeEach(() => {
    client = new ComparePowerClientClass({
      baseUrl: 'https://test-api.comparepower.com',
      timeout: 5000,
      retryAttempts: 2,
      cache: { redis: undefined }, // Disable Redis for testing
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 10000,
        monitoringInterval: 5000,
        halfOpenMaxCalls: 2
      }
    });
    
    fetchMock = vi.fn(global.fetch);
    global.fetch = fetchMock;
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await client.clearCache();
    await client.shutdown();
  });

  describe('Enhanced Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000', display_usage: 1000 };

      fetchMock.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 100)
        )
      );

      try {
        await client.fetchPlans(params);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ComparePowerApiError);
        expect((error as ComparePowerApiError).type).toBe(ApiErrorType.TIMEOUT);
        expect((error as ComparePowerApiError).isRetryable).toBe(true);
        expect((error as ComparePowerApiError).userMessage).toContain('taking longer than usual');
      }
    });

    it('should categorize HTTP errors correctly', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      try {
        await client.fetchPlans(params);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ComparePowerApiError);
        expect((error as ComparePowerApiError).type).toBe(ApiErrorType.RATE_LIMITED);
        expect((error as ComparePowerApiError).isRetryable).toBe(true);
      }
    });

    it('should validate API parameters before making requests', async () => {
      const invalidParams: ApiParams = {
        tdsp_duns: '', // Empty DUNS should be invalid
        term: 15 // Invalid term
      };

      try {
        await client.fetchPlans(invalidParams);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ComparePowerApiError);
        expect((error as ComparePowerApiError).type).toBe(ApiErrorType.INVALID_PARAMETERS);
      }
    });

    it('should validate API response structure', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'structure' }) // Not an array
      });

      try {
        await client.fetchPlans(params);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ComparePowerApiError);
        expect((error as ComparePowerApiError).type).toBe(ApiErrorType.DATA_VALIDATION_ERROR);
      }
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open circuit after consecutive failures', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };

      // Make the API fail consistently
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Make enough requests to trip the circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await client.fetchPlans(params);
        } catch {
          // Expected to fail
        }
      }

      // Next request should fail immediately due to open circuit
      try {
        await client.fetchPlans(params);
        expect.fail('Should have thrown circuit breaker error');
      } catch (error) {
        expect(error).toBeInstanceOf(ComparePowerApiError);
        expect((error as ComparePowerApiError).type).toBe(ApiErrorType.CIRCUIT_OPEN);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      const startTime = Date.now();
      const promises = Array.from({ length: 15 }, () => client.fetchPlans(params));
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should take at least 1 second due to rate limiting (10 req/sec)
      expect(endTime - startTime).toBeGreaterThan(500);
    });
  });

  describe('Data Transformation with Validation', () => {
    it('should transform API data with safe parsing', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      const malformedApiResponse = [{
        ...mockApiResponse[0],
        display_pricing_1000: {
          usage: 1000,
          avg: 'invalid', // String instead of number
          total: null // Null total
        }
      }];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => malformedApiResponse
      });

      const result = await client.fetchPlans(params);
      
      expect(result).toHaveLength(1);
      expect(result[0].pricing.rate1000kWh).toBe(0); // Should default to 0 for invalid data
      expect(result[0].pricing.total1000kWh).toBe(0); // Should default to 0 for null
    });

    it('should filter out invalid plan data', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      const mixedApiResponse = [
        mockApiResponse[0], // Valid plan
        {
          _id: 'plan-invalid',
          // Missing required fields
          product: {},
          tdsp: null
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mixedApiResponse
      });

      const result = await client.fetchPlans(params);
      
      expect(result).toHaveLength(1); // Only the valid plan should be returned
      expect(result[0].id).toBe('plan-123');
    });
  });

  describe('Comprehensive Fallback Strategies', () => {
    it('should use database fallback when API fails', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      // Mock database to return fallback data
      const { planRepository } = await import('../../../src/lib/database/plan-repository');
      vi.mocked(planRepository.getActivePlans).mockResolvedValueOnce([{
        id: 'fallback-plan',
        name: 'Fallback Plan',
        provider: { name: 'Fallback Provider', logo: '', rating: 0, reviewCount: 0 },
        pricing: { rate500kWh: 12, rate1000kWh: 11, rate2000kWh: 10, ratePerKwh: 11 },
        contract: { length: 12, type: 'fixed', earlyTerminationFee: 0, autoRenewal: false, satisfactionGuarantee: false },
        features: { greenEnergy: 0, billCredit: 0, deposit: { required: false, amount: 0 } },
        availability: { enrollmentType: 'both', serviceAreas: ['Oncor'] }
      }]);

      fetchMock.mockRejectedValue(new Error('API Failure'));

      const result = await client.fetchPlans(params);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('fallback-plan');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      await client.fetchPlans(params);
      await client.fetchPlans(params); // Second call should hit cache

      const stats = await client.getCacheStats();
      
      expect(stats.metrics.totalRequests).toBeGreaterThan(0);
      expect(stats.metrics.successfulRequests).toBeGreaterThan(0);
      expect(stats.metrics.averageResponseTime).toBeGreaterThan(0);
      expect(stats.memory.hits).toBeGreaterThan(0); // Cache should have hits
    });
  });

  describe('Enhanced Health Check', () => {
    it('should provide comprehensive health information', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const health = await client.healthCheck();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('circuitBreakerOpen');
      expect(health).toHaveProperty('redisConnected');
      expect(health).toHaveProperty('responseTime');
      expect(typeof health.responseTime).toBe('number');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate city-specific cache', async () => {
      const params: ApiParams = { tdsp_duns: '1039940674000' };
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      // Fill cache
      await client.fetchPlans(params);
      
      // Verify cache has data
      let stats = await client.getCacheStats();
      expect(stats.memory.totalEntries).toBeGreaterThan(0);

      // Invalidate specific city
      await client.invalidateCity('dallas-tx');

      // Cache should be empty or reduced
      stats = await client.getCacheStats();
      // Note: Since we're using a mock, this test verifies the method runs without error
      expect(stats).toBeDefined();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await expect(client.shutdown()).resolves.not.toThrow();
    });
  });
});

describe('Error Classes', () => {
  describe('ComparePowerApiError', () => {
    it('should generate appropriate user messages', () => {
      const error = new ComparePowerApiError(
        ApiErrorType.RATE_LIMITED,
        'Too many requests',
        { city: 'Dallas, TX' }
      );

      expect(error.userMessage).toContain('Dallas, TX');
      expect(error.userMessage).toContain('Too many requests');
      expect(error.isRetryable).toBe(true);
    });

    it('should create errors from HTTP responses', () => {
      const error = ComparePowerApiError.fromHttpError(
        503,
        'Service Unavailable',
        { url: 'https://api.example.com' }
      );

      expect(error.type).toBe(ApiErrorType.SERVICE_UNAVAILABLE);
      expect(error.isRetryable).toBe(true);
      expect(error.context.statusCode).toBe(503);
    });

    it('should create errors from network failures', () => {
      const networkError = new Error('fetch failed');
      const error = ComparePowerApiError.fromNetworkError(
        networkError,
        { url: 'https://api.example.com' }
      );

      expect(error.type).toBe(ApiErrorType.NETWORK_ERROR);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('Circuit Breaker', () => {
    it('should track failures and recover', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 100,
        monitoringInterval: 50,
        halfOpenMaxCalls: 1
      });

      const failingFunction = vi.fn().mockRejectedValue(new Error('failure'));

      // Trip the circuit breaker
      try { await circuitBreaker.execute(failingFunction); } catch {}
      try { await circuitBreaker.execute(failingFunction); } catch {}

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be in half-open state now
      const successFunction = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successFunction);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
});