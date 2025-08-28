import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComparePowerClientClass } from '../../../src/lib/api/comparepower-client';
import type { ApiParams } from '../../../src/types/facets';

// Mock dependencies
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

vi.mock('../../../src/config/tdsp-mapping', () => ({
  getTdspFromCity: vi.fn().mockImplementation((city: string) => {
    // Map different cities to different TDSP values for testing
    const mapping = {
      'dallas-tx': '1039940674000',
      'houston-tx': '1039940674001', 
      'austin-tx': '1039940674002',
      'san-antonio-tx': '1039940674003',
      'fort-worth-tx': '1039940674004'
    };
    return mapping[city as keyof typeof mapping] || '1039940674000';
  }),
  formatCityName: vi.fn().mockImplementation((city: string) => {
    const mapping = {
      'dallas-tx': 'Dallas, TX',
      'houston-tx': 'Houston, TX',
      'austin-tx': 'Austin, TX',
      'san-antonio-tx': 'San Antonio, TX',
      'fort-worth-tx': 'Fort Worth, TX'
    };
    return mapping[city as keyof typeof mapping] || 'Unknown City, TX';
  }),
  validateCitySlug: vi.fn().mockReturnValue(true)
}));

describe('Comprehensive Batch Processing Tests', () => {
  let client: ComparePowerClientClass;
  let fetchMock: any;

  const mockPlanResponse = {
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
    document_links: []
  };

  beforeEach(() => {
    client = new ComparePowerClientClass({
      baseUrl: 'https://test-api.comparepower.com',
      timeout: 5000,
      retryAttempts: 1,
      cache: { redis: undefined },
      batchProcessing: {
        enabled: true,
        maxBatchSize: 10,
        batchTimeoutMs: 100,
        tdspGrouping: true
      },
      rateLimit: {
        requestsPerSecond: 10,
        burstLimit: 20,
        concurrentRequests: 5
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

  describe('Batch Processing for 881 Cities', () => {
    it('should process multiple cities efficiently with TDSP grouping', async () => {
      await client.clearCache();
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockPlanResponse]
      });

      const cities = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
      const requests = cities.map(city => ({
        city,
        params: { tdsp_duns: city.includes('dallas') ? '1039940674000' : 
                              city.includes('houston') ? '1039940674001' :
                              city.includes('austin') ? '1039940674002' :
                              city.includes('san-antonio') ? '1039940674003' :
                              '1039940674004' }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => client.fetchPlans(req.params))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      // Batch processing should be faster than individual requests
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle batch processing errors gracefully', async () => {
      await client.clearCache();
      
      // Mock some failures
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [mockPlanResponse]
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [mockPlanResponse]
        });

      const requests = [
        { tdsp_duns: '1039940674001' }, // Should succeed
        { tdsp_duns: '1039940674002' }, // Should fail
        { tdsp_duns: '1039940674003' }  // Should succeed
      ];

      const results = await Promise.allSettled(
        requests.map(params => client.fetchPlans(params))
      );

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should respect batch size limits', async () => {
      await client.clearCache();
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockPlanResponse]
      });

      // Test with more requests than batch size
      const requests = Array.from({ length: 25 }, (_, i) => ({
        tdsp_duns: `103994067400${i}`
      }));

      const results = await Promise.all(
        requests.map(params => client.fetchPlans(params))
      );

      expect(results).toHaveLength(25);
      expect(fetchMock).toHaveBeenCalled();
      
      // Should have batched requests (less than 25 individual calls)
      expect(fetchMock.mock.calls.length).toBeLessThan(25);
    });

    it('should group requests by TDSP when enabled', async () => {
      await client.clearCache();
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockPlanResponse]
      });

      // Multiple requests with same TDSP
      const sameTdspRequests = Array.from({ length: 5 }, () => ({
        tdsp_duns: '1039940674000'
      }));

      const results = await Promise.all(
        sameTdspRequests.map(params => client.fetchPlans(params))
      );

      expect(results).toHaveLength(5);
      
      // All requests should get the same cached result after first API call
      results.forEach((result, index) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBeDefined();
      });
    });
  });

  describe('Mass Deployment Stress Testing', () => {
    it('should handle large batches of city requests without crashing', async () => {
      await client.clearCache();
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockPlanResponse]
      });

      // Simulate a smaller but representative batch (100 cities)
      const cityRequests = Array.from({ length: 100 }, (_, i) => ({
        tdsp_duns: `103994067400${i % 10}`, // Distribute across 10 different TDSPs
        display_usage: 1000
      }));

      const startTime = Date.now();
      
      // Process in chunks to avoid overwhelming the system
      const chunkSize = 20;
      const chunks = [];
      for (let i = 0; i < cityRequests.length; i += chunkSize) {
        chunks.push(cityRequests.slice(i, i + chunkSize));
      }

      const allResults = [];
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(params => client.fetchPlans(params))
        );
        allResults.push(...chunkResults);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(allResults).toHaveLength(100);
      expect(processingTime).toBeLessThan(10000); // Should complete in under 10 seconds
      
      // Verify no memory leaks or crashes
      const healthCheck = await client.healthCheck();
      expect(healthCheck.healthy).toBe(true);
    }, 15000); // 15 second timeout

    it('should maintain performance under moderate load', async () => {
      await client.clearCache();
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockPlanResponse]
      });

      const iterations = 20;
      const requestsPerIteration = 5;
      
      const performanceData = [];

      for (let i = 0; i < iterations; i++) {
        const iterationRequests = Array.from({ length: requestsPerIteration }, (_, j) => ({
          tdsp_duns: `103994067400${i * requestsPerIteration + j}`
        }));

        const startTime = Date.now();
        await Promise.all(
          iterationRequests.map(params => client.fetchPlans(params))
        );
        const endTime = Date.now();

        performanceData.push(endTime - startTime);
      }

      // Calculate performance metrics
      const avgResponseTime = performanceData.reduce((a, b) => a + b, 0) / performanceData.length;
      const maxResponseTime = Math.max(...performanceData);
      
      expect(avgResponseTime).toBeLessThan(1000); // Average under 1 second
      expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds
      expect(performanceData.length).toBe(iterations);
      
      // Performance should be reasonably consistent
      const firstHalf = performanceData.slice(0, Math.floor(iterations / 2));
      const secondHalf = performanceData.slice(Math.floor(iterations / 2));
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 2); // No more than 2x performance degradation
    }, 10000); // 10 second timeout
  });

  describe('Circuit Breaker Integration with Batch Processing', () => {
    it('should open circuit breaker during batch processing failures', async () => {
      const circuitBreakerClient = new ComparePowerClientClass({
        baseUrl: 'https://test-api.comparepower.com',
        retryAttempts: 0,
        cache: { redis: undefined },
        circuitBreaker: {
          failureThreshold: 3,
          recoveryTimeout: 5000,
          monitoringInterval: 1000,
          halfOpenMaxCalls: 2
        }
      });

      fetchMock.mockRejectedValue(new Error('Service unavailable'));

      // Make enough failed requests to trigger circuit breaker
      const failedRequests = Array.from({ length: 5 }, (_, i) => ({
        tdsp_duns: `103994067400${i}`
      }));

      const results = await Promise.allSettled(
        failedRequests.map(params => circuitBreakerClient.fetchPlans(params))
      );

      expect(results.every(result => result.status === 'rejected')).toBe(true);
      
      // Circuit breaker should be open
      const healthCheck = await circuitBreakerClient.healthCheck();
      expect(healthCheck.circuitBreakerOpen).toBe(true);

      await circuitBreakerClient.shutdown();
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('should provide meaningful errors for batch processing failures', async () => {
      await client.clearCache();
      
      fetchMock.mockRejectedValue(new Error('Batch processing timeout'));

      try {
        await client.fetchPlans({ tdsp_duns: '1039940674000' });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Batch processing');
        expect(error.type).toBeDefined();
        expect(error.userMessage).toBeDefined();
      }
    });

    it('should handle partial batch failures gracefully', async () => {
      await client.clearCache();
      
      // Mock mixed success/failure responses
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [mockPlanResponse]
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [mockPlanResponse]
        });

      const requests = [
        { tdsp_duns: '1039940674001' },
        { tdsp_duns: '1039940674002' },
        { tdsp_duns: '1039940674003' }
      ];

      const results = await Promise.allSettled(
        requests.map(params => client.fetchPlans(params))
      );

      expect(results).toHaveLength(3);
      
      // Should have mix of successful and failed results
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
    });
  });
});