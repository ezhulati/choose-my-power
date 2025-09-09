/**
 * Contract Test: POST /api/zip/validate endpoint
 * Feature: 010-expand-zip-code
 * TDD Phase: MUST FAIL before implementation (constitutional requirement)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ZIPValidationResult, ZIPErrorCode } from '../../src/lib/types/zip-navigation';

describe('POST /api/zip/validate Contract', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4326/api';

  // For contract tests, we need real API calls, not mocks
  beforeAll(async () => {
    // Restore real fetch for contract tests
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch as any;
    console.log('🔧 Contract tests: Real fetch restored for API integration testing');
  });

  const validateZipCode = async (zipCode: string, zipPlus4?: string): Promise<Response> => {
    const payload: { zipCode: string; zipPlus4?: string } = { zipCode };
    if (zipPlus4) payload.zipPlus4 = zipPlus4;

    return fetch(`${API_BASE_URL}/zip/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  };

  describe('Valid ZIP Code Requests', () => {
    it('should validate Tyler ZIP 75701 and return correct city routing', async () => {
      const response = await validateZipCode('75701');
      
      expect(response.status).toBe(200);
      
      const data: ZIPValidationResult = await response.json();
      
      // Contract validation: Response structure
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('zipCode', '75701');
      expect(data.data).toHaveProperty('city');
      expect(data.data).toHaveProperty('tdspTerritory');
      expect(data.data).toHaveProperty('routingUrl');
      expect(data.data).toHaveProperty('confidence');
      
      // Contract validation: City data structure
      expect(data.data.city).toHaveProperty('name', 'Tyler');
      expect(data.data.city).toHaveProperty('slug', 'tyler-tx');
      expect(data.data.city).toHaveProperty('state', 'texas');
      expect(data.data.city).toHaveProperty('isDeregulated', true);
      expect(data.data.city).toHaveProperty('planCount');
      expect(typeof data.data.city.planCount).toBe('number');
      
      // Contract validation: TDU territory data
      expect(data.data.tdspTerritory).toHaveProperty('name', 'Oncor');
      expect(data.data.tdspTerritory).toHaveProperty('code', 'ONCOR');
      
      // Contract validation: Critical business requirement
      expect(data.data.routingUrl).toBe('/electricity-plans/tyler-tx/');
      expect(data.data.routingUrl).not.toBe('/electricity-plans/dallas-tx/'); // Must not route to Dallas
      
      // Contract validation: Performance and confidence
      expect(data.data.confidence).toBeGreaterThanOrEqual(1);
      expect(data.data.confidence).toBeLessThanOrEqual(5);
    });

    it('should validate Corpus Christi ZIP 78401 and return correct routing (no more NOT_FOUND)', async () => {
      const response = await validateZipCode('78401');
      
      expect(response.status).toBe(200);
      
      const data: ZIPValidationResult = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('78401');
      expect(data.data.city.name).toBe('Corpus Christi');
      expect(data.data.city.slug).toBe('corpus-christi-tx');
      expect(data.data.city.isDeregulated).toBe(true);
      expect(data.data.routingUrl).toBe('/electricity-plans/corpus-christi-tx/');
      expect(data.data.tdspTerritory.name).toBe('AEP Texas Central');
    });

    it('should validate Waco ZIP 76701 and route to Waco (not Fort Worth)', async () => {
      const response = await validateZipCode('76701');
      
      expect(response.status).toBe(200);
      
      const data: ZIPValidationResult = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('76701');
      expect(data.data.city.name).toBe('Waco');
      expect(data.data.city.slug).toBe('waco-tx');
      expect(data.data.routingUrl).toBe('/electricity-plans/waco-tx/');
      expect(data.data.routingUrl).not.toBe('/electricity-plans/fort-worth-tx/'); // Previous incorrect behavior
    });

    it('should validate College Station ZIP 77840 and route locally (not Houston)', async () => {
      const response = await validateZipCode('77840');
      
      expect(response.status).toBe(200);
      
      const data: ZIPValidationResult = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('77840');
      expect(data.data.city.name).toBe('College Station');
      expect(data.data.city.slug).toBe('college-station-tx');
      expect(data.data.routingUrl).toBe('/electricity-plans/college-station-tx/');
      expect(data.data.routingUrl).not.toBe('/electricity-plans/houston-tx/'); // Previous incorrect behavior
    });

    it('should validate West Texas ZIP codes (Lubbock 79401, Abilene 79601)', async () => {
      // Test Lubbock
      const lubbockResponse = await validateZipCode('79401');
      expect(lubbockResponse.status).toBe(200);
      
      const lubbockData: ZIPValidationResult = await lubbockResponse.json();
      expect(lubbockData.success).toBe(true);
      expect(lubbockData.data.city.name).toBe('Lubbock');
      expect(lubbockData.data.routingUrl).toBe('/electricity-plans/lubbock-tx/');
      
      // Test Abilene
      const abileneResponse = await validateZipCode('79601');
      expect(abileneResponse.status).toBe(200);
      
      const abileneData: ZIPValidationResult = await abileneResponse.json();
      expect(abileneData.success).toBe(true);
      expect(abileneData.data.city.name).toBe('Abilene');
      expect(abileneData.data.routingUrl).toBe('/electricity-plans/abilene-tx/');
      expect(abileneData.data.tdspTerritory.name).toBe('AEP Texas North');
    });

    it('should support ZIP+4 format for more precise mapping', async () => {
      const response = await validateZipCode('75701', '1234');
      
      expect(response.status).toBe(200);
      
      const data: ZIPValidationResult = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.zipCode).toBe('75701');
      expect(data.data.city.name).toBe('Tyler');
    });
  });

  describe('Error Handling - Electric Cooperatives', () => {
    it('should return 404 with cooperative info for non-deregulated areas', async () => {
      // Using a known cooperative ZIP code
      const response = await validateZipCode('75932'); // Cherokee County Electric Cooperative
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'ZIP_NOT_DEREGULATED');
      expect(data.error).toHaveProperty('message', 'This area is served by an electric cooperative');
      expect(data.error).toHaveProperty('suggestedAction', 'Contact your local electric cooperative');
      expect(data.error).toHaveProperty('cooperativeInfo');
      expect(data.error.cooperativeInfo).toHaveProperty('name');
      expect(data.error.cooperativeInfo).toHaveProperty('phone');
      expect(data.error.cooperativeInfo).toHaveProperty('website');
    });
  });

  describe('Error Handling - Invalid ZIP Codes', () => {
    it('should return 400 for invalid ZIP format (too short)', async () => {
      const response = await validateZipCode('123');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'INVALID_ZIP_FORMAT');
      expect(data.error).toHaveProperty('message', 'ZIP code must be 5 digits');
      expect(data.error).toHaveProperty('field', 'zipCode');
    });

    it('should return 400 for invalid ZIP format (contains letters)', async () => {
      const response = await validateZipCode('ABC12');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ZIP_FORMAT');
    });

    it('should return 400 for invalid ZIP format (too long)', async () => {
      const response = await validateZipCode('123456');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ZIP_FORMAT');
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 500ms performance target', async () => {
      const startTime = Date.now();
      const response = await validateZipCode('75701');
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Constitutional performance requirement
    });
  });

  describe('Request Body Validation', () => {
    it('should require zipCode field in request body', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing zipCode
      });
      
      expect(response.status).toBe(400);
    });

    it('should accept valid request with proper Content-Type', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zipCode: '75701' }),
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Constitutional Compliance Validation', () => {
    it('should never return hardcoded plan IDs or routing', async () => {
      const response = await validateZipCode('75701');
      const data: ZIPValidationResult = await response.json();
      
      // Validate no hardcoded MongoDB ObjectIds in responses
      const responseStr = JSON.stringify(data);
      expect(responseStr).not.toMatch(/68b[0-9a-f]{21}/); // Pattern for hardcoded plan IDs
      
      // Validate routing URL is dynamic based on city
      expect(data.data.routingUrl).toContain(data.data.city.slug);
    });

    it('should use real data sources (no mock data)', async () => {
      const response = await validateZipCode('75701');
      const data: ZIPValidationResult = await response.json();
      
      // Validate TDU territory is real (not mock)
      expect(['Oncor', 'AEP Texas Central', 'AEP Texas North', 'AEP Texas South']).toContain(
        data.data.tdspTerritory.name
      );
      
      // Validate plan count is reasonable for real data
      expect(data.data.city.planCount).toBeGreaterThan(0);
      expect(data.data.city.planCount).toBeLessThan(200); // Reasonable upper bound
    });
  });
});