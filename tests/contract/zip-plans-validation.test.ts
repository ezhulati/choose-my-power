/**
 * Contract Test: GET /api/zip/validate-city-plans endpoint
 * 
 * Tests the city plans availability validation API contract
 * Validates response schema matches contracts/zip-navigation-api.yaml
 * 
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 * Implementation should be created to make this test pass (GREEN phase)
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

// Types based on contract specification
interface CityPlansValidationResponse {
  plansAvailable: boolean;
  planCount?: number;
  citySlug?: string;
  lastUpdated?: string;
  reason?: 'CITY_NOT_FOUND' | 'NO_PLANS_AVAILABLE' | 'TDSP_NOT_SUPPORTED';
}

describe('Contract Test: GET /api/zip/validate-city-plans', () => {
  
  // Helper function to make API calls
  async function callCityPlansValidationAPI(citySlug: string, tdspTerritory?: string): Promise<{
    response: Response;
    data: CityPlansValidationResponse;
  }> {
    let url = `${API_BASE_URL}/api/zip/validate-city-plans?citySlug=${encodeURIComponent(citySlug)}`;
    if (tdspTerritory) {
      url += `&tdspTerritory=${encodeURIComponent(tdspTerritory)}`;
    }
    
    const response = await fetch(url);
    const data = await response.json() as CityPlansValidationResponse;
    return { response, data };
  }
  
  describe('Valid City Plans Validation', () => {
    
    test('should validate Dallas plans availability', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      const tdspTerritory = 'Oncor';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug, tdspTerritory);
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(200);
      expect(typeof data.plansAvailable).toBe('boolean');
      expect(data.plansAvailable).toBe(true);
      expect(typeof data.planCount).toBe('number');
      expect(data.planCount!).toBeGreaterThan(0);
      expect(data.citySlug).toBe(citySlug);
      expect(typeof data.lastUpdated).toBe('string');
      
      // Validate ISO date format
      expect(() => new Date(data.lastUpdated!)).not.toThrow();
      const lastUpdatedDate = new Date(data.lastUpdated!);
      expect(lastUpdatedDate.getTime()).not.toBeNaN();
    });
    
    test('should validate Houston plans availability', async () => {
      // ARRANGE
      const citySlug = 'houston-tx';
      const tdspTerritory = 'Centerpoint';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug, tdspTerritory);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(data.planCount!).toBeGreaterThan(0);
      expect(data.citySlug).toBe(citySlug);
      expect(typeof data.lastUpdated).toBe('string');
    });
    
    test('should validate Austin plans availability', async () => {
      // ARRANGE
      const citySlug = 'austin-tx';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(data.planCount!).toBeGreaterThan(0);
      expect(data.citySlug).toBe(citySlug);
    });
    
    test('should work without TDSP territory parameter', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      
      // ACT - Call without tdspTerritory parameter
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(typeof data.plansAvailable).toBe('boolean');
      expect(data.citySlug).toBe(citySlug);
      
      if (data.plansAvailable) {
        expect(data.planCount!).toBeGreaterThan(0);
        expect(typeof data.lastUpdated).toBe('string');
      }
    });
  });
  
  describe('Invalid City Handling', () => {
    
    test('should handle city not found', async () => {
      // ARRANGE
      const citySlug = 'nonexistent-city-tx';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(404);
      expect(data.plansAvailable).toBe(false);
      expect(data.reason).toBe('CITY_NOT_FOUND');
      expect(data.planCount).toBeUndefined();
      expect(data.lastUpdated).toBeUndefined();
    });
    
    test('should handle invalid city slug format', async () => {
      // ARRANGE - City slug without -tx suffix
      const citySlug = 'dallas';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(404);
      expect(data.plansAvailable).toBe(false);
      expect(data.reason).toBe('CITY_NOT_FOUND');
    });
    
    test('should handle empty city slug', async () => {
      // ARRANGE
      const citySlug = '';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(400);
    });
    
    test('should handle missing citySlug parameter', async () => {
      // ARRANGE - Request without citySlug parameter
      const response = await fetch(`${API_BASE_URL}/api/zip/validate-city-plans`);
      
      // ASSERT
      expect(response.status).toBe(400);
    });
  });
  
  describe('TDSP Territory Validation', () => {
    
    test('should validate plans for correct TDSP territory', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      const correctTdsp = 'Oncor';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug, correctTdsp);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(data.planCount!).toBeGreaterThan(0);
    });
    
    test('should handle unsupported TDSP territory', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      const unsupportedTdsp = 'NonexistentTDSP';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug, unsupportedTdsp);
      
      // ASSERT
      // Could be 200 with plansAvailable: false or 404, depending on implementation
      if (response.status === 404) {
        expect(data.plansAvailable).toBe(false);
        expect(data.reason).toBe('TDSP_NOT_SUPPORTED');
      } else if (response.status === 200) {
        expect(data.plansAvailable).toBe(false);
        expect(data.reason).toBe('TDSP_NOT_SUPPORTED');
      }
    });
  });
  
  describe('Performance Requirements', () => {
    
    test('should meet performance requirements (<300ms)', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      
      // ACT - Measure response time
      const startTime = Date.now();
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // <300ms requirement
      expect(data.plansAvailable).toBe(true);
    });
    
    test('should handle concurrent validation requests efficiently', async () => {
      // ARRANGE - Multiple cities to test concurrency
      const cities = ['dallas-tx', 'houston-tx', 'austin-tx', 'fort-worth-tx'];
      const requests = cities.map(citySlug => 
        callCityPlansValidationAPI(citySlug)
      );
      
      // ACT
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // ASSERT
      expect(results).toHaveLength(4);
      results.forEach(({ response, data }) => {
        expect(response.status).toBe(200);
        expect(data.plansAvailable).toBe(true);
        expect(data.planCount!).toBeGreaterThan(0);
      });
      
      // Concurrent requests shouldn't take significantly longer
      expect(totalTime).toBeLessThan(600); // Allow some overhead
    });
  });
  
  describe('Data Freshness and Caching', () => {
    
    test('should return recent lastUpdated timestamp', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(typeof data.lastUpdated).toBe('string');
      
      // lastUpdated should be within reasonable time (not older than 7 days)
      const lastUpdated = new Date(data.lastUpdated!);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      expect(lastUpdated.getTime()).toBeGreaterThan(sevenDaysAgo.getTime());
    });
    
    test('should provide consistent data across multiple calls', async () => {
      // ARRANGE
      const citySlug = 'dallas-tx';
      
      // ACT - Make multiple calls
      const [call1, call2, call3] = await Promise.all([
        callCityPlansValidationAPI(citySlug),
        callCityPlansValidationAPI(citySlug),
        callCityPlansValidationAPI(citySlug)
      ]);
      
      // ASSERT - All calls should return consistent data
      expect(call1.response.status).toBe(200);
      expect(call2.response.status).toBe(200);
      expect(call3.response.status).toBe(200);
      
      expect(call1.data.plansAvailable).toBe(call2.data.plansAvailable);
      expect(call2.data.plansAvailable).toBe(call3.data.plansAvailable);
      
      expect(call1.data.planCount).toBe(call2.data.planCount);
      expect(call2.data.planCount).toBe(call3.data.planCount);
      
      // lastUpdated might differ due to caching, but should be close
      const time1 = new Date(call1.data.lastUpdated!).getTime();
      const time2 = new Date(call2.data.lastUpdated!).getTime();
      const time3 = new Date(call3.data.lastUpdated!).getTime();
      
      // Times should be within 1 second of each other (allowing for cache refresh)
      expect(Math.abs(time1 - time2)).toBeLessThan(1000);
      expect(Math.abs(time2 - time3)).toBeLessThan(1000);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    
    test('should handle special characters in city slug', async () => {
      // ARRANGE
      const citySlug = 'fort-worth-tx'; // City with hyphen
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(data.citySlug).toBe(citySlug);
    });
    
    test('should handle URL encoding properly', async () => {
      // ARRANGE - City slug with special characters that need encoding
      const citySlug = 'sugar-land-tx';
      
      // ACT
      const { response, data } = await callCityPlansValidationAPI(citySlug);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.citySlug).toBe(citySlug);
    });
    
    test('should validate city slug pattern', async () => {
      // ARRANGE - Test various invalid patterns
      const invalidSlugs = [
        'dallas',           // Missing -tx
        'dallas-texas',     // Wrong suffix  
        'Dallas-TX',        // Wrong case
        'dallas-tx-extra',  // Extra parts
        'dallas_tx',        // Underscore instead of hyphen
      ];
      
      // ACT & ASSERT
      for (const invalidSlug of invalidSlugs) {
        const { response, data } = await callCityPlansValidationAPI(invalidSlug);
        expect(response.status).toBe(404);
        expect(data.plansAvailable).toBe(false);
        expect(data.reason).toBe('CITY_NOT_FOUND');
      }
    });
  });
});

/**
 * NOTE: This test is designed to FAIL initially (RED phase of TDD)
 * The /api/zip/validate-city-plans endpoint does not exist yet and should be implemented
 * to make these tests pass (GREEN phase), then optimized (REFACTOR phase)
 */