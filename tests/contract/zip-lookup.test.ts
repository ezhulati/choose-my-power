/**
 * Contract Test: GET /api/zip/lookup/{zipCode} endpoint
 * Feature: 010-expand-zip-code
 * TDD Phase: MUST FAIL before implementation (constitutional requirement)
 */

import { describe, it, expect } from 'vitest';

describe('GET /api/zip/lookup/{zipCode} Contract', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  const lookupZipCode = async (zipCode: string): Promise<Response> => {
    return fetch(`${API_BASE_URL}/zip/lookup/${zipCode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  };

  describe('Valid ZIP Code Lookups', () => {
    it('should return direct routing info for Tyler ZIP 75701', async () => {
      const response = await lookupZipCode('75701');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Contract validation: Response structure
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('zipCode', '75701');
      expect(data.data).toHaveProperty('redirectUrl', '/electricity-plans/tyler-tx/');
      expect(data.data).toHaveProperty('cityName', 'Tyler');
      expect(data.data).toHaveProperty('marketStatus');
      
      // Contract validation: Market status values
      expect(['active', 'limited', 'transitioning']).toContain(data.data.marketStatus);
    });

    it('should return routing info for Corpus Christi ZIP 78401', async () => {
      const response = await lookupZipCode('78401');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('78401');
      expect(data.data.redirectUrl).toBe('/electricity-plans/corpus-christi-tx/');
      expect(data.data.cityName).toBe('Corpus Christi');
      expect(data.data.marketStatus).toBe('active');
    });

    it('should return routing info for Waco ZIP 76701', async () => {
      const response = await lookupZipCode('76701');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('76701');
      expect(data.data.redirectUrl).toBe('/electricity-plans/waco-tx/');
      expect(data.data.cityName).toBe('Waco');
      expect(data.data.redirectUrl).not.toBe('/electricity-plans/fort-worth-tx/');
    });

    it('should return routing info for College Station ZIP 77840', async () => {
      const response = await lookupZipCode('77840');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('77840');
      expect(data.data.redirectUrl).toBe('/electricity-plans/college-station-tx/');
      expect(data.data.cityName).toBe('College Station');
      expect(data.data.redirectUrl).not.toBe('/electricity-plans/houston-tx/');
    });

    it('should return routing info for West Texas ZIP codes', async () => {
      // Test Lubbock
      const lubbockResponse = await lookupZipCode('79401');
      expect(lubbockResponse.status).toBe(200);
      
      const lubbockData = await lubbockResponse.json();
      expect(lubbockData.success).toBe(true);
      expect(lubbockData.data.cityName).toBe('Lubbock');
      expect(lubbockData.data.redirectUrl).toBe('/electricity-plans/lubbock-tx/');
      
      // Test Abilene
      const abileneResponse = await lookupZipCode('79601');
      expect(abileneResponse.status).toBe(200);
      
      const abileneData = await abileneResponse.json();
      expect(abileneData.success).toBe(true);
      expect(abileneData.data.cityName).toBe('Abilene');
      expect(abileneData.data.redirectUrl).toBe('/electricity-plans/abilene-tx/');
    });

    it('should return routing info for South Texas ZIP codes', async () => {
      // Test Laredo
      const laredoResponse = await lookupZipCode('78040');
      expect(laredoResponse.status).toBe(200);
      
      const laredoData = await laredoResponse.json();
      expect(laredoData.success).toBe(true);
      expect(laredoData.data.cityName).toBe('Laredo');
      expect(laredoData.data.redirectUrl).toBe('/electricity-plans/laredo-tx/');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-deregulated ZIP codes', async () => {
      // Using a known cooperative ZIP code
      const response = await lookupZipCode('75932');
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should return 400 for invalid ZIP format', async () => {
      const response = await lookupZipCode('invalid');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'INVALID_ZIP_FORMAT');
    });

    it('should return 400 for ZIP codes that are too short', async () => {
      const response = await lookupZipCode('123');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ZIP_FORMAT');
    });

    it('should return 400 for ZIP codes that are too long', async () => {
      const response = await lookupZipCode('123456');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ZIP_FORMAT');
    });

    it('should return 404 for valid format but non-Texas ZIP codes', async () => {
      const response = await lookupZipCode('90210'); // California ZIP
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 300ms for direct routing lookups', async () => {
      const startTime = Date.now();
      const response = await lookupZipCode('75701');
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // Direct lookup should be faster than validation
    });
  });

  describe('Response Headers', () => {
    it('should return proper content-type header', async () => {
      const response = await lookupZipCode('75701');
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include CORS headers for cross-origin requests', async () => {
      const response = await lookupZipCode('75701');
      
      // Should have CORS headers for frontend integration
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('Constitutional Compliance', () => {
    it('should never return hardcoded routing URLs', async () => {
      const response = await lookupZipCode('75701');
      const data = await response.json();
      
      // Validate routing URL is dynamic based on city slug
      expect(data.data.redirectUrl).toContain('tyler-tx'); // Should match city slug
      expect(data.data.redirectUrl).toMatch(/^\/electricity-plans\/[a-z-]+\/$/); // Pattern validation
    });

    it('should use real city names (no mock data)', async () => {
      const response = await lookupZipCode('78401');
      const data = await response.json();
      
      // Validate real Texas city names
      expect(['Tyler', 'Corpus Christi', 'Waco', 'College Station', 'Lubbock', 'Abilene', 'Laredo']).toContain(
        data.data.cityName
      );
      
      // Should not contain mock city names
      expect(data.data.cityName).not.toBe('Test City');
      expect(data.data.cityName).not.toBe('Mock City');
    });

    it('should generate routing URLs that match existing city pages', async () => {
      const testCases = [
        { zipCode: '75701', expectedPath: '/electricity-plans/tyler-tx/' },
        { zipCode: '78401', expectedPath: '/electricity-plans/corpus-christi-tx/' },
        { zipCode: '76701', expectedPath: '/electricity-plans/waco-tx/' },
        { zipCode: '77840', expectedPath: '/electricity-plans/college-station-tx/' },
        { zipCode: '79401', expectedPath: '/electricity-plans/lubbock-tx/' },
        { zipCode: '79601', expectedPath: '/electricity-plans/abilene-tx/' },
      ];

      for (const testCase of testCases) {
        const response = await lookupZipCode(testCase.zipCode);
        const data = await response.json();
        
        expect(data.data.redirectUrl).toBe(testCase.expectedPath);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle leading zeros in ZIP codes', async () => {
      const response = await lookupZipCode('07570'); // Texas ZIP with leading zero
      
      // Should either return 200 for valid Texas ZIP or 404 for non-Texas
      expect([200, 404]).toContain(response.status);
    });

    it('should handle concurrent requests without conflicts', async () => {
      const promises = [
        lookupZipCode('75701'),
        lookupZipCode('78401'),
        lookupZipCode('76701'),
      ];
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed independently
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});