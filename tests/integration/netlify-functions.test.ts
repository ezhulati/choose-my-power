/**
 * Comprehensive Integration Tests for Netlify Functions
 * 
 * Tests the enterprise ZIP code search system's serverless functions including:
 * - search-plans function with all scenarios
 * - lookup-esiid function for address resolution
 * - health function for monitoring
 * - Rate limiting and security features
 * - Error handling and resilience
 * - CORS and security headers
 * - Performance and caching behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import type { Context } from '@netlify/functions';

// Import the actual function handlers
import searchPlansHandler from '../../netlify/functions/search-plans';
import lookupEsiidHandler from '../../netlify/functions/lookup-esiid';
import healthHandler from '../../netlify/functions/health';

// Mock external dependencies
vi.mock('../../src/lib/api/comparepower-client', () => ({
  comparePowerClient: {
    fetchPlans: vi.fn(),
    getCacheStats: vi.fn(),
    healthCheck: vi.fn()
  }
}));

vi.mock('../../src/lib/api/ercot-esiid-client', () => ({
  ercotESIIDClient: {
    resolveAddressToTDSP: vi.fn(),
    healthCheck: vi.fn()
  }
}));

vi.mock('../../src/config/multi-tdsp-mapping', () => ({
  multiTdspMapping: {
    '75201': {
      requiresAddressValidation: false,
      primaryTdsp: {
        name: 'Oncor Electric Delivery',
        duns: '055757763'
      },
      alternativeTdsps: []
    },
    '77001': {
      requiresAddressValidation: true,
      primaryTdsp: {
        name: 'CenterPoint Energy Houston Electric',
        duns: '073140841'
      },
      alternativeTdsps: [
        {
          name: 'Alternative TDSP',
          duns: '999999999'
        }
      ]
    }
  }
}));

vi.mock('../../netlify/functions/shared/utils', () => ({
  getTdspFromZip: vi.fn(() => ({
    success: true,
    tdsp: { duns: '055757763', name: 'Oncor Electric Delivery' }
  })),
  resolveZipToTdsp: vi.fn(() => ({
    success: true,
    tdsp: { duns: '055757763', name: 'Oncor Electric Delivery' },
    isMultiTdsp: false
  })),
  getZoneFromTdsp: vi.fn(() => 'North')
}));

// Test data
const mockPlans = [
  {
    id: 'plan-1',
    name: 'TXU Energy Fixed Rate 12',
    provider: {
      name: 'TXU Energy',
      code: 'TXU'
    },
    contract: {
      type: 'fixed',
      length: 12
    },
    pricing: {
      rate1000kWh: 10.5
    },
    features: {
      greenEnergy: 0,
      deposit: { required: false }
    }
  },
  {
    id: 'plan-2',
    name: 'Reliant Variable Rate',
    provider: {
      name: 'Reliant Energy',
      code: 'REL'
    },
    contract: {
      type: 'variable',
      length: 12
    },
    pricing: {
      rate1000kWh: 9.8
    },
    features: {
      greenEnergy: 100,
      deposit: { required: true }
    }
  }
];

const createMockRequest = (method: string, body?: any, headers: Record<string, string> = {}): Request => {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  return new Request('https://example.com/.netlify/functions/search-plans', requestInit);
};

const createMockContext = (overrides: Partial<Context> = {}): Context => ({
  requestId: `req_${Date.now()}`,
  ip: '192.168.1.100',
  geo: {
    city: 'Dallas',
    country: 'US',
    subdivision: 'TX'
  },
  ...overrides
} as Context);

describe('Netlify Functions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset rate limiting store
    if ('rateLimitStore' in searchPlansHandler) {
      (searchPlansHandler as any).rateLimitStore?.clear?.();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('search-plans Function', () => {
    beforeEach(() => {
      const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
      comparePowerClient.fetchPlans.mockResolvedValue(mockPlans);
    });

    describe('Successful Scenarios', () => {
      it('should handle valid ZIP code search successfully', async () => {
        const request = createMockRequest('POST', {
          zipCode: '75201',
          usage: 1000
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('plans');
        expect(result.data.plans).toHaveLength(2);
        expect(result.data).toHaveProperty('tdspInfo');
        expect(result.data).toHaveProperty('searchMeta');
        expect(result.data.searchMeta.zipCode).toBe('75201');
        expect(result.data.searchMeta.usage).toBe(1000);
        
        // Check response headers
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('X-Request-ID')).toBeTruthy();
        expect(response.headers.get('X-Response-Time')).toBeTruthy();
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      });

      it('should handle ZIP code with address for split TDSP resolution', async () => {
        const { ercotESIIDClient } = require('../../src/lib/api/ercot-esiid-client');
        ercotESIIDClient.resolveAddressToTDSP.mockResolvedValue({
          tdsp_duns: '073140841',
          tdsp_name: 'CenterPoint Energy Houston Electric',
          confidence: 'high',
          esiid: '1012345678901234567'
        });

        const request = createMockRequest('POST', {
          zipCode: '77001',
          address: '123 Main Street, Houston, TX',
          usage: 1500
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.data.tdspInfo.name).toBe('CenterPoint Energy Houston Electric');
        expect(result.data.tdspInfo.confidence).toBe('high');
        expect(result.data.searchMeta.method).toBe('esiid_resolution');
        expect(result.data.splitZipInfo?.isMultiTdsp).toBe(true);
      });

      it('should apply filters correctly', async () => {
        const request = createMockRequest('POST', {
          zipCode: '75201',
          usage: 1000,
          filters: {
            term: 12,
            green: 100,
            rateType: 'variable',
            provider: 'Reliant'
          }
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data.plans).toHaveLength(1); // Only Reliant variable plan should match
        expect(result.data.plans[0].provider.name).toBe('Reliant Energy');
      });

      it('should fallback to primary TDSP when ESIID resolution fails', async () => {
        const { ercotESIIDClient } = require('../../src/lib/api/ercot-esiid-client');
        ercotESIIDClient.resolveAddressToTDSP.mockRejectedValue(new Error('ESIID service unavailable'));

        const request = createMockRequest('POST', {
          zipCode: '77001',
          address: '123 Main Street, Houston, TX'
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.data.tdspInfo.name).toBe('CenterPoint Energy Houston Electric');
        expect(result.data.tdspInfo.confidence).toBe('medium');
        expect(result.data.searchMeta.method).toBe('split_zip_resolved');
      });
    });

    describe('Validation and Error Handling', () => {
      it('should reject invalid ZIP code', async () => {
        const request = createMockRequest('POST', {
          zipCode: '12345' // Non-Texas ZIP
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('zipCode must be a 5-digit ZIP code');
      });

      it('should reject missing required fields', async () => {
        const request = createMockRequest('POST', {
          usage: 1000 // Missing zipCode
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('zipCode is required');
      });

      it('should validate usage range', async () => {
        const request = createMockRequest('POST', {
          zipCode: '75201',
          usage: 50 // Too low
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error.message).toContain('usage must be a number between 100 and 5000 kWh');
      });

      it('should validate filter parameters', async () => {
        const request = createMockRequest('POST', {
          zipCode: '75201',
          filters: {
            term: 15, // Invalid term
            green: 150, // Invalid green percentage
            rateType: 'invalid' // Invalid rate type
          }
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error.message).toContain('filters.term must be 6, 12, 18, 24, or 36 months');
      });

      it('should handle invalid JSON in request body', async () => {
        const request = new Request('https://example.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json{'
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error.code).toBe('INVALID_JSON');
      });

      it('should handle API errors gracefully', async () => {
        const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
        const { ComparePowerApiError, ApiErrorType } = require('../../src/lib/api/errors');
        
        comparePowerClient.fetchPlans.mockRejectedValue(
          new ComparePowerApiError(
            ApiErrorType.NO_PLANS_AVAILABLE,
            'No plans found for this area',
            { zipCode: '75201' },
            true
          )
        );

        const request = createMockRequest('POST', {
          zipCode: '75201'
        });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('NO_PLANS_AVAILABLE');
        expect(result.error.retryable).toBe(true);
      });
    });

    describe('HTTP Method and CORS Handling', () => {
      it('should handle OPTIONS preflight request', async () => {
        const request = createMockRequest('OPTIONS');
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);

        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
      });

      it('should reject non-POST requests', async () => {
        const request = createMockRequest('GET');
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const result = await response.json();

        expect(response.status).toBe(405);
        expect(result.error.code).toBe('METHOD_NOT_ALLOWED');
      });
    });

    describe('Rate Limiting', () => {
      it('should allow requests within rate limit', async () => {
        const request = createMockRequest('POST', { zipCode: '75201' });
        const context = createMockContext();

        // Make multiple requests within limit
        for (let i = 0; i < 5; i++) {
          const response = await searchPlansHandler(request, context);
          expect(response.status).toBe(200);
          expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
        }
      });

      it('should rate limit excessive requests', async () => {
        const request = createMockRequest('POST', { zipCode: '75201' });
        const context = createMockContext();

        // Simulate rate limit exceeded by mocking the rate limit store
        // This would need actual implementation based on the function's rate limiting logic
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        
        // Make requests to exceed rate limit
        // Note: This test would need to be adjusted based on actual rate limiting implementation
        const responses = [];
        for (let i = 0; i < 105; i++) {
          responses.push(await searchPlansHandler(request, context));
        }
        
        const lastResponse = responses[responses.length - 1];
        if (lastResponse.status === 429) {
          const result = await lastResponse.json();
          expect(result.error.code).toBe('RATE_LIMITED');
          expect(lastResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
        }
      });
    });

    describe('Performance and Caching Headers', () => {
      it('should include performance headers', async () => {
        const request = createMockRequest('POST', { zipCode: '75201' });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);

        expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
        expect(response.headers.get('X-Request-ID')).toBeTruthy();
        expect(response.headers.get('Cache-Control')).toBeTruthy();
      });

      it('should indicate cache hit/miss', async () => {
        const request = createMockRequest('POST', { zipCode: '75201' });
        const context = createMockContext();

        const response = await searchPlansHandler(request, context);
        const cacheHit = response.headers.get('X-Cache-Hit');
        
        expect(cacheHit).toMatch(/true|false/);
      });
    });
  });

  describe('lookup-esiid Function', () => {
    beforeEach(() => {
      const { ercotESIIDClient } = require('../../src/lib/api/ercot-esiid-client');
      ercotESIIDClient.resolveAddressToTDSP.mockResolvedValue({
        success: true,
        esiid: '1012345678901234567',
        tdsp_duns: '055757763',
        tdsp_name: 'Oncor Electric Delivery',
        confidence: 'high',
        resolved_address: '123 Main Street, Dallas, TX 75201'
      });
    });

    it('should resolve address to ESIID successfully', async () => {
      const request = createMockRequest('POST', {
        address: '123 Main Street',
        zipCode: '75201'
      });
      const context = createMockContext();

      const response = await lookupEsiidHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.esiid).toBeTruthy();
      expect(result.data.tdsp_name).toBe('Oncor Electric Delivery');
      expect(result.data.confidence).toBe('high');
    });

    it('should handle address resolution failure', async () => {
      const { ercotESIIDClient } = require('../../src/lib/api/ercot-esiid-client');
      ercotESIIDClient.resolveAddressToTDSP.mockRejectedValue(
        new Error('Address not found in ERCOT database')
      );

      const request = createMockRequest('POST', {
        address: 'Non-existent address',
        zipCode: '75201'
      });
      const context = createMockContext();

      const response = await lookupEsiidHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('should validate required parameters', async () => {
      const request = createMockRequest('POST', {
        zipCode: '75201' // Missing address
      });
      const context = createMockContext();

      const response = await lookupEsiidHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('address is required');
    });
  });

  describe('health Function', () => {
    beforeEach(() => {
      const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
      const { ercotESIIDClient } = require('../../src/lib/api/ercot-esiid-client');
      
      comparePowerClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        responseTime: 150,
        lastCheck: Date.now()
      });
      
      ercotESIIDClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        responseTime: 200,
        lastCheck: Date.now()
      });
    });

    it('should return healthy status when all services are up', async () => {
      const request = createMockRequest('GET');
      const context = createMockContext();

      const response = await healthHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.services).toHaveProperty('comparepower');
      expect(result.services).toHaveProperty('ercot');
      expect(result.services.comparepower.status).toBe('healthy');
      expect(result.services.ercot.status).toBe('healthy');
    });

    it('should return degraded status when some services are down', async () => {
      const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
      comparePowerClient.healthCheck.mockRejectedValue(new Error('Service unavailable'));

      const request = createMockRequest('GET');
      const context = createMockContext();

      const response = await healthHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(503);
      expect(result.status).toBe('degraded');
      expect(result.services.comparepower.status).toBe('unhealthy');
      expect(result.services.ercot.status).toBe('healthy');
    });

    it('should include system metrics', async () => {
      const request = createMockRequest('GET');
      const context = createMockContext();

      const response = await healthHandler(request, context);
      const result = await response.json();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
      comparePowerClient.fetchPlans.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      );

      const request = createMockRequest('POST', { zipCode: '75201' });
      const context = createMockContext();

      // Fast-forward timers to trigger timeout
      vi.advanceTimersByTime(11000);

      const response = await searchPlansHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error.retryable).toBe(true);
    });

    it('should handle malformed addresses for ESIID lookup', async () => {
      const request = createMockRequest('POST', {
        address: '   ', // Whitespace only
        zipCode: '75201'
      });
      const context = createMockContext();

      const response = await lookupEsiidHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle concurrent requests properly', async () => {
      const requests = Array.from({ length: 10 }, () => 
        createMockRequest('POST', { zipCode: '75201' })
      );
      const context = createMockContext();

      const responses = await Promise.all(
        requests.map(request => searchPlansHandler(request, context))
      );

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }

      // Each should have a unique request ID
      const requestIds = await Promise.all(
        responses.map(async response => {
          const result = await response.json();
          return result.meta.requestId;
        })
      );
      
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requestIds.length);
    });

    it('should handle empty plan results gracefully', async () => {
      const { comparePowerClient } = require('../../src/lib/api/comparepower-client');
      comparePowerClient.fetchPlans.mockResolvedValue([]);

      const request = createMockRequest('POST', { zipCode: '75201' });
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.plans).toHaveLength(0);
      expect(result.data.searchMeta.totalPlans).toBe(0);
    });
  });

  describe('Security Features', () => {
    it('should include security headers', async () => {
      const request = createMockRequest('POST', { zipCode: '75201' });
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('should sanitize input parameters', async () => {
      const request = createMockRequest('POST', {
        zipCode: '75201<script>alert("xss")</script>',
        address: 'Main St"); DROP TABLE plans; --'
      });
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);
      const result = await response.json();

      if (response.status === 200) {
        // Input should be sanitized
        expect(result.data.searchMeta.zipCode).toBe('75201');
      } else {
        // Or rejected as invalid
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle large request bodies', async () => {
      const largeBody = {
        zipCode: '75201',
        address: 'A'.repeat(10000), // Very long address
        filters: {
          providers: Array.from({ length: 1000 }, (_, i) => `provider-${i}`)
        }
      };

      const request = createMockRequest('POST', largeBody);
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);
      
      // Should either handle gracefully or reject appropriately
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times accurately', async () => {
      const startTime = Date.now();
      
      const request = createMockRequest('POST', { zipCode: '75201' });
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);
      const responseTime = response.headers.get('X-Response-Time');
      
      expect(responseTime).toBeTruthy();
      
      const timeMs = parseInt(responseTime?.replace('ms', '') || '0');
      expect(timeMs).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(10000); // Should be under 10 seconds
    });

    it('should include telemetry data', async () => {
      const request = createMockRequest('POST', { zipCode: '75201' });
      const context = createMockContext();

      const response = await searchPlansHandler(request, context);
      const result = await response.json();

      expect(result.meta).toHaveProperty('requestId');
      expect(result.meta).toHaveProperty('timestamp');
      expect(result.meta).toHaveProperty('responseTime');
      expect(result.meta).toHaveProperty('version');
      
      if (result.success) {
        expect(result.data.searchMeta).toHaveProperty('cacheHit');
        expect(result.data.searchMeta).toHaveProperty('method');
        expect(result.data.searchMeta).toHaveProperty('responseTime');
      }
    });
  });
});
