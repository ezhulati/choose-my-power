/**
 * Comprehensive Integration Tests for Netlify Functions
 * 
 * Tests the complete ComparePower API integration including:
 * - Search Plans function with all edge cases
 * - ESIID Lookup function with address validation
 * - Error handling and resilience patterns
 * - Rate limiting and performance
 * - Multi-TDSP ZIP code handling
 * - Cache behavior and optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handler as searchPlansHandler } from '../../netlify/functions/search-plans';
import { handler as lookupESIIDHandler } from '../../netlify/functions/lookup-esiid';
import type { Context } from '@netlify/functions';

// Mock external dependencies
vi.mock('../../src/lib/api/comparepower-client', () => ({
  comparePowerClient: {
    fetchPlans: vi.fn()
  }
}));

vi.mock('../../src/lib/api/ercot-esiid-client', () => ({
  ercotESIIDClient: {
    resolveAddressToTDSP: vi.fn()
  }
}));

describe('Netlify Functions Integration Tests', () => {
  let mockContext: Context;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      ip: '192.168.1.1',
      requestId: 'test-request-id',
      site: { id: 'test-site-id', name: 'test-site' },
      deploy: { id: 'test-deploy-id', context: 'production' },
      account: { id: 'test-account-id' }
    };
  });

  describe('search-plans function', () => {
    describe('Single TDSP ZIP codes', () => {
      it('should return plans for Dallas ZIP 75205', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75205',
            displayUsage: 1000
          })
        });

        const mockPlans = [
          {
            _id: 'plan1',
            product: {
              brand: { name: 'TXU Energy', puct_number: '10001' },
              name: 'Simply Fixed 12',
              term: 12,
              percent_green: 0,
              is_pre_pay: false,
              is_time_of_use: false
            },
            display_pricing_1000: { usage: 1000, avg: 0.12, total: 120 }
          }
        ];

        // Mock the ComparePower API response
        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue(mockPlans);

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.tdspInfo.name).toBe('Oncor Electric Delivery');
        expect(data.data.tdspInfo.duns).toBe('1039940674000');
        expect(data.data.plans).toHaveLength(1);
        expect(data.data.searchMeta.totalPlans).toBe(1);
        expect(data.data.searchMeta.method).toBe('direct_mapping');
      });

      it('should apply filters correctly', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '77001',
            displayUsage: 1000,
            filters: {
              term: 12,
              green: 100,
              prepaid: false
            }
          })
        });

        const mockPlans = [
          {
            _id: 'plan1',
            product: {
              brand: { name: 'Green Mountain Energy', puct_number: '10002' },
              name: '100% Clean Energy 12',
              term: 12,
              percent_green: 100,
              is_pre_pay: false,
              is_time_of_use: false
            },
            display_pricing_1000: { usage: 1000, avg: 0.14, total: 140 }
          }
        ];

        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue(mockPlans);

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.tdspInfo.name).toBe('CenterPoint Energy Houston Electric');
        expect(data.data.plans[0].product.percent_green).toBe(100);
      });
    });

    describe('Multi-TDSP ZIP codes', () => {
      it('should handle split ZIP without address by providing alternatives', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75001' // Multi-TDSP ZIP in mapping
          })
        });

        const mockPlans = [
          {
            _id: 'plan1',
            product: {
              brand: { name: 'TXU Energy', puct_number: '10001' },
              name: 'Fixed Rate Plan',
              term: 12,
              percent_green: 0,
              is_pre_pay: false,
              is_time_of_use: false
            },
            display_pricing_1000: { usage: 1000, avg: 0.11, total: 110 }
          }
        ];

        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue(mockPlans);

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.splitZipInfo.isMultiTdsp).toBe(true);
        expect(data.data.splitZipInfo.alternativeTdsps).toBeDefined();
        expect(data.data.searchMeta.method).toBe('split_zip_resolved');
      });

      it('should resolve TDSP with address for split ZIP', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75001',
            address: '123 Main Street'
          })
        });

        // Mock ESIID resolution
        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockResolvedValue({
          success: true,
          method: 'esiid_lookup',
          confidence: 'high',
          tdsp_duns: '1039940674000',
          tdsp_name: 'Oncor Electric Delivery',
          esiid: '10443720000000000',
          address: '123 Main Street, Dallas, TX 75001',
          zip_code: '75001',
          apiParams: {
            tdsp_duns: '1039940674000',
            display_usage: 1000
          }
        });

        const mockPlans = [
          {
            _id: 'plan1',
            product: {
              brand: { name: 'TXU Energy', puct_number: '10001' },
              name: 'Address-Resolved Plan',
              term: 12,
              percent_green: 0,
              is_pre_pay: false,
              is_time_of_use: false
            },
            display_pricing_1000: { usage: 1000, avg: 0.10, total: 100 }
          }
        ];

        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue(mockPlans);

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.searchMeta.method).toBe('esiid_resolution');
        expect(data.data.tdspInfo.confidence).toBe('high');
      });
    });

    describe('Error handling', () => {
      it('should handle invalid ZIP codes', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '12345' // Non-Texas ZIP
          })
        });

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle API failures gracefully', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75205'
          })
        });

        // Mock API failure
        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockRejectedValue(new Error('API timeout'));

        const response = await searchPlansHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.retryable).toBe(false);
      });

      it('should handle rate limiting', async () => {
        // Make multiple requests rapidly to trigger rate limiting
        const requests = Array.from({ length: 102 }, (_, i) => 
          new Request('https://test.com/.netlify/functions/search-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode: '75205' })
          })
        );

        // Mock successful API responses
        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue([]);

        // Execute requests sequentially to test rate limiting
        const responses = [];
        for (const request of requests) {
          responses.push(await searchPlansHandler(request, mockContext));
        }

        // Last few requests should be rate limited
        const lastResponse = responses[responses.length - 1];
        const lastData = await lastResponse.json();
        
        expect(lastResponse.status).toBe(429);
        expect(lastData.error.code).toBe('RATE_LIMITED');
      });
    });

    describe('Performance and caching', () => {
      it('should include cache performance headers', async () => {
        const request = new Request('https://test.com/.netlify/functions/search-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75205',
            displayUsage: 1000
          })
        });

        const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
        vi.mocked(comparePowerClient.fetchPlans).mockResolvedValue([]);

        const response = await searchPlansHandler(request, mockContext);

        expect(response.headers.get('X-Response-Time')).toBeDefined();
        expect(response.headers.get('X-Cache-Hit')).toBeDefined();
        expect(response.headers.get('X-TDSP-Method')).toBeDefined();
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      });
    });
  });

  describe('lookup-esiid function', () => {
    describe('Address resolution', () => {
      it('should resolve address to ESIID successfully', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '123 Main Street',
            zipCode: '75201'
          })
        });

        // Mock ESIID resolution
        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockResolvedValue({
          success: true,
          method: 'esiid_lookup',
          confidence: 'high',
          tdsp_duns: '1039940674000',
          tdsp_name: 'Oncor Electric Delivery',
          esiid: '10443720000000000',
          address: '123 Main Street, Dallas, TX 75201',
          zip_code: '75201',
          apiParams: {
            tdsp_duns: '1039940674000',
            display_usage: 1000
          }
        });

        const response = await lookupESIIDHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.resolution.tdsp.name).toBe('Oncor Electric Delivery');
        expect(data.data.resolution.confidence).toBe('high');
        expect(data.data.resolution.method).toBe('esiid_lookup');
        expect(data.data.apiParams.tdsp_duns).toBe('1039940674000');
      });

      it('should handle address normalization', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '123 Main St Apt 4B',
            zipCode: '75201'
          })
        });

        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockResolvedValue({
          success: true,
          method: 'esiid_lookup',
          confidence: 'high',
          tdsp_duns: '1039940674000',
          tdsp_name: 'Oncor Electric Delivery',
          esiid: '10443720000000000',
          address: '123 Main Street Apt 4B, Dallas, TX 75201',
          zip_code: '75201',
          apiParams: {
            tdsp_duns: '1039940674000',
            display_usage: 1000
          }
        });

        const response = await lookupESIIDHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Address should be normalized (St -> Street)
        expect(data.data.resolution.address.normalized).toBe('123 Main Street Apt 4B');
      });

      it('should provide fallback for failed ESIID lookup in split ZIP', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '999 Nonexistent Street',
            zipCode: '75001' // Multi-TDSP ZIP
          })
        });

        // Mock ESIID lookup failure
        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockRejectedValue(
          new Error('Address not found')
        );

        const response = await lookupESIIDHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.resolution.confidence).toBe('low');
        expect(data.data.resolution.method).toBe('multiple_results');
        expect(data.data.splitZipInfo.isKnownSplitZip).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should validate address format', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '123', // Too short
            zipCode: '75201'
          })
        });

        const response = await lookupESIIDHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle non-Texas ZIP codes', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '123 Main Street',
            zipCode: '90210' // California ZIP
          })
        });

        const response = await lookupESIIDHandler(request, mockContext);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Rate limiting', () => {
      it('should enforce stricter rate limits than search-plans', async () => {
        // ESIID lookups have lower rate limits (50 vs 100)
        const requests = Array.from({ length: 52 }, (_, i) => 
          new Request('https://test.com/.netlify/functions/lookup-esiid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: `${i} Test Street`,
              zipCode: '75201'
            })
          })
        );

        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockResolvedValue({
          success: true,
          method: 'esiid_lookup',
          confidence: 'high',
          tdsp_duns: '1039940674000',
          tdsp_name: 'Oncor Electric Delivery',
          esiid: '10443720000000000',
          address: 'Test Address',
          zip_code: '75201',
          apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 }
        });

        // Execute requests to trigger rate limiting
        const responses = [];
        for (const request of requests) {
          responses.push(await lookupESIIDHandler(request, mockContext));
        }

        const lastResponse = responses[responses.length - 1];
        const lastData = await lastResponse.json();
        
        expect(lastResponse.status).toBe(429);
        expect(lastData.error.code).toBe('RATE_LIMITED');
      });
    });

    describe('Performance and caching', () => {
      it('should include appropriate headers and longer cache TTL', async () => {
        const request = new Request('https://test.com/.netlify/functions/lookup-esiid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '123 Main Street',
            zipCode: '75201'
          })
        });

        const { ercotESIIDClient } = await import('../../src/lib/api/ercot-esiid-client');
        vi.mocked(ercotESIIDClient.resolveAddressToTDSP).mockResolvedValue({
          success: true,
          method: 'esiid_lookup',
          confidence: 'high',
          tdsp_duns: '1039940674000',
          tdsp_name: 'Oncor Electric Delivery',
          esiid: '10443720000000000',
          address: '123 Main Street, Dallas, TX 75201',
          zip_code: '75201',
          apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 }
        });

        const response = await lookupESIIDHandler(request, mockContext);

        expect(response.headers.get('X-Response-Time')).toBeDefined();
        expect(response.headers.get('X-Confidence')).toBe('high');
        expect(response.headers.get('X-Resolution-Method')).toBe('esiid_lookup');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=900');
      });
    });
  });

  describe('CORS handling', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const request = new Request('https://test.com/.netlify/functions/search-plans', {
        method: 'OPTIONS'
      });

      const response = await searchPlansHandler(request, mockContext);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should include CORS headers in error responses', async () => {
      const request = new Request('https://test.com/.netlify/functions/search-plans', {
        method: 'GET' // Invalid method
      });

      const response = await searchPlansHandler(request, mockContext);

      expect(response.status).toBe(405);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Request validation', () => {
    it('should validate JSON body format', async () => {
      const request = new Request('https://test.com/.netlify/functions/search-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });

      const response = await searchPlansHandler(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should validate required fields', async () => {
      const request = new Request('https://test.com/.netlify/functions/search-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Missing zipCode
      });

      const response = await searchPlansHandler(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});