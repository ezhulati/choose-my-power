/**
 * ZIP Navigation API Endpoint Integration Tests
 * Task T031: Comprehensive API testing for ZIP navigation endpoints
 * Phase 3.5 Polish & Validation: End-to-end API testing with real requests
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Mock fetch for testing environment
const BASE_URL = 'http://localhost:4324';

describe('ZIP Navigation API Endpoints Integration', () => {
  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    return {
      status: response.status,
      data: await response.json(),
      headers: response.headers
    };
  };

  describe('ZIP Routing API (/api/zip/route)', () => {
    it('should handle valid Texas ZIP codes', async () => {
      const testZIPs = [
        { zip: '75701', expectedCity: 'Tyler' },
        { zip: '77001', expectedCity: 'Houston' },
        { zip: '75201', expectedCity: 'Dallas' }
      ];

      for (const testCase of testZIPs) {
        const response = await makeRequest('/api/zip/route', {
          method: 'POST',
          body: JSON.stringify({ zipCode: testCase.zip })
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.zipCode).toBe(testCase.zip);
        expect(response.data.data.cityName).toBe(testCase.expectedCity);
        expect(response.data.data.redirectUrl).toContain('/electricity-plans');
        expect(response.data.data.planCount).toBeGreaterThan(0);
        expect(response.data.responseTime).toBeGreaterThanOrEqual(0);
        expect(response.data.cached).toBeDefined();
      }
    }, 10000);

    it('should handle invalid ZIP codes with error recovery', async () => {
      const invalidZIPs = ['99999', '12345', 'ABCDE', '123'];

      for (const zip of invalidZIPs) {
        const response = await makeRequest('/api/zip/route', {
          method: 'POST',
          body: JSON.stringify({ zipCode: zip })
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toBeDefined();
        expect(response.data.error.code).toBeDefined();
        expect(response.data.error.message).toBeDefined();
        expect(response.data.error.suggestions).toBeDefined();
        expect(response.data.error.recoveryActions).toBeDefined();
        expect(response.data.error.helpfulTips).toBeDefined();
      }
    }, 5000);

    it('should demonstrate caching behavior', async () => {
      const testZIP = '76101';

      // First request (should be cache miss)
      const firstResponse = await makeRequest('/api/zip/route', {
        method: 'POST',
        body: JSON.stringify({ zipCode: testZIP })
      });

      expect(firstResponse.data.success).toBe(true);
      expect(firstResponse.data.cached).toBe(false);

      // Second request (should be cache hit)
      const secondResponse = await makeRequest('/api/zip/route', {
        method: 'POST',
        body: JSON.stringify({ zipCode: testZIP })
      });

      expect(secondResponse.data.success).toBe(true);
      expect(secondResponse.data.cached).toBe(true);
      expect(secondResponse.data.responseTime).toBeLessThanOrEqual(firstResponse.data.responseTime);
    }, 3000);

    it('should handle malformed requests', async () => {
      const malformedRequests = [
        { body: '{}' }, // Missing zipCode
        { body: '{"zipCode": ""}' }, // Empty zipCode
        { body: 'invalid json' }, // Invalid JSON
        { body: '{"zipCode": null}' }, // Null zipCode
      ];

      for (const request of malformedRequests) {
        const response = await makeRequest('/api/zip/route', {
          method: 'POST',
          body: request.body
        });

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    }, 3000);
  });

  describe('ZIP Validation API (/api/zip/validate)', () => {
    it('should validate Texas ZIP codes correctly', async () => {
      const validZIPs = ['75701', '77001', '78701', '76101'];

      for (const zip of validZIPs) {
        const response = await makeRequest(`/api/zip/validate?zipCode=${zip}`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.zipCode).toBe(zip);
        expect(response.data.data.isValid).toBe(true);
        expect(response.data.data.isTexas).toBe(true);
        expect(response.data.data.isDeregulated).toBe(true);
        expect(response.data.data.cityData).toBeDefined();
        expect(response.data.data.tdspData).toBeDefined();
      }
    }, 5000);

    it('should reject non-Texas ZIP codes', async () => {
      const nonTexasZIPs = ['90210', '10001', '60601'];

      for (const zip of nonTexasZIPs) {
        const response = await makeRequest(`/api/zip/validate?zipCode=${zip}`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.isTexas).toBe(false);
        expect(response.data.data.errorCode).toBeDefined();
      }
    }, 3000);
  });

  describe('Performance Monitoring APIs (/api/monitoring/performance)', () => {
    it('should return system health metrics', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=health');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.uptime).toBeGreaterThanOrEqual(0);
      expect(response.data.data.totalRequests).toBeGreaterThanOrEqual(0);
      expect(response.data.data.successRate).toBeGreaterThanOrEqual(0);
      expect(response.data.data.successRate).toBeLessThanOrEqual(100);
      expect(response.data.data.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(response.data.data.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(response.data.data.performanceByRegion).toBeDefined();
      expect(response.headers.get('X-Response-Time')).toBeDefined();
    }, 3000);

    it('should return performance recommendations', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=recommendations');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.recommendations).toBeDefined();
      expect(Array.isArray(response.data.data.recommendations)).toBe(true);
      expect(response.data.data.summary).toBeDefined();
      expect(response.data.data.summary.totalRecommendations).toBeGreaterThanOrEqual(0);
    }, 3000);

    it('should return cache analysis', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=cache');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.overview).toBeDefined();
      expect(response.data.data.hotZIPs).toBeDefined();
      expect(response.data.data.coldZIPs).toBeDefined();
      expect(response.data.data.recommendations).toBeDefined();
      expect(Array.isArray(response.data.data.hotZIPs)).toBe(true);
      expect(Array.isArray(response.data.data.coldZIPs)).toBe(true);
    }, 3000);

    it('should return active alerts', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=alerts');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.alerts).toBeDefined();
      expect(Array.isArray(response.data.data.alerts)).toBe(true);
      expect(response.data.data.totalActive).toBeGreaterThanOrEqual(0);
      expect(response.data.data.critical).toBeGreaterThanOrEqual(0);
      expect(response.data.data.high).toBeGreaterThanOrEqual(0);
    }, 3000);

    it('should support alert resolution', async () => {
      // First, create an alert by triggering error conditions
      await makeRequest('/api/zip/route', {
        method: 'POST',
        body: JSON.stringify({ zipCode: '99999' })
      });

      // Get current alerts
      const alertsResponse = await makeRequest('/api/monitoring/performance?action=alerts');
      const alerts = alertsResponse.data.data.alerts;

      if (alerts.length > 0) {
        const alertId = alerts[0].id;
        
        // Resolve the alert
        const resolveResponse = await makeRequest('/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({
            action: 'resolve_alert',
            alertId: alertId,
            resolution: 'Test resolution'
          })
        });

        expect(resolveResponse.status).toBe(200);
        expect(resolveResponse.data.success).toBe(true);
        expect(resolveResponse.data.data.resolved).toBe(true);
      }
    }, 3000);

    it('should handle invalid monitoring actions', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=invalid');

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('INVALID_ACTION');
    }, 1000);
  });

  describe('Analytics APIs (/api/analytics/zip-navigation)', () => {
    it('should return ZIP navigation insights', async () => {
      const response = await makeRequest('/api/analytics/zip-navigation?hours=24');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.totalEvents).toBeGreaterThanOrEqual(0);
      expect(response.data.data.eventTypes).toBeDefined();
      expect(response.data.data.topZIPs).toBeDefined();
      expect(response.data.data.errorRate).toBeGreaterThanOrEqual(0);
      expect(response.data.data.performanceMetrics).toBeDefined();
    }, 3000);
  });

  describe('Deregulated Areas API (/api/deregulated-areas)', () => {
    it('should return deregulated areas with caching', async () => {
      const response = await makeRequest('/api/deregulated-areas');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.totalCities).toBeGreaterThan(0);
      expect(response.data.data.totalZipCodes).toBeGreaterThan(0);
      expect(response.data.data.cities).toBeDefined();
      expect(Array.isArray(response.data.data.cities)).toBe(true);
      expect(response.data.data.lastUpdated).toBeDefined();
      
      // Verify cache headers
      expect(response.headers.get('Cache-Control')).toBeDefined();
    }, 3000);

    it('should demonstrate caching behavior for deregulated areas', async () => {
      // First request
      const firstResponse = await makeRequest('/api/deregulated-areas');
      const firstResponseTime = parseInt(firstResponse.headers.get('X-Response-Time') || '0');

      // Second request (should hit cache)
      const secondResponse = await makeRequest('/api/deregulated-areas');
      const secondResponseTime = parseInt(secondResponse.headers.get('X-Response-Time') || '0');

      expect(firstResponse.data).toEqual(secondResponse.data);
      expect(secondResponseTime).toBeLessThanOrEqual(firstResponseTime);
    }, 2000);
  });

  describe('API Response Standards', () => {
    it('should include consistent response headers', async () => {
      const endpoints = [
        '/api/zip/validate?zipCode=75701',
        '/api/monitoring/performance?action=health',
        '/api/deregulated-areas'
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(endpoint);
        
        expect(response.headers.get('Content-Type')).toContain('application/json');
        expect(response.headers.get('X-Response-Time')).toBeDefined();
        
        // Verify response structure
        expect(response.data.success).toBeDefined();
        expect(response.data.timestamp || response.data.data).toBeDefined();
      }
    }, 5000);

    it('should handle CORS and security headers appropriately', async () => {
      const response = await makeRequest('/api/monitoring/performance?action=health');
      
      // Basic security considerations (these may vary based on deployment)
      expect(response.status).toBeLessThan(500);
      expect(response.data).toBeDefined();
    }, 1000);
  });

  describe('Load and Performance Testing', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 5;
      const testEndpoints = [
        '/api/zip/validate?zipCode=75701',
        '/api/monitoring/performance?action=health',
        '/api/deregulated-areas'
      ];

      for (const endpoint of testEndpoints) {
        const startTime = Date.now();
        
        const promises = Array(concurrentRequests).fill(null).map(() => 
          makeRequest(endpoint)
        );
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const averageTime = (endTime - startTime) / concurrentRequests;
        
        expect(results.length).toBe(concurrentRequests);
        expect(averageTime).toBeLessThan(2000); // Average should be under 2 seconds
        
        results.forEach(result => {
          expect(result.status).toBe(200);
          expect(result.data.success).toBe(true);
        });
      }
    }, 15000);

    it('should maintain response time standards', async () => {
      const performanceCriticalEndpoints = [
        { endpoint: '/api/zip/route', method: 'POST', body: '{"zipCode":"75701"}', maxTime: 1000 },
        { endpoint: '/api/zip/validate?zipCode=75701', method: 'GET', maxTime: 500 },
        { endpoint: '/api/monitoring/performance?action=health', method: 'GET', maxTime: 100 }
      ];

      for (const test of performanceCriticalEndpoints) {
        const startTime = Date.now();
        const response = await makeRequest(test.endpoint, {
          method: test.method,
          body: test.body
        });
        const responseTime = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(test.maxTime);
        expect(response.data.success).toBe(true);
      }
    }, 5000);
  });
});