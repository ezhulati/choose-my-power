/**
 * Contract Test: GET /api/deregulated-areas endpoint
 * Feature: 010-expand-zip-code
 * TDD Phase: MUST FAIL before implementation (constitutional requirement)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { DeregulatedAreasResponse, MarketStatus } from '../../src/lib/types/zip-navigation';

describe('GET /api/deregulated-areas Contract', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4326/api';

  // For contract tests, we need real API calls, not mocks
  beforeAll(async () => {
    // Restore real fetch for contract tests
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch as any;
    console.log('🔧 Deregulated areas contract tests: Real fetch restored');
  });

  const getDeregulatedAreas = async (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/deregulated-areas`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  };

  describe('Successful Response', () => {
    it('should return complete list of deregulated Texas cities', async () => {
      const response = await getDeregulatedAreas();
      
      expect(response.status).toBe(200);
      
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Response structure
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('totalCities');
      expect(data.data).toHaveProperty('totalZipCodes');
      expect(data.data).toHaveProperty('lastUpdated');
      expect(data.data).toHaveProperty('cities');
      
      // Contract validation: Data completeness
      expect(data.data.totalCities).toBeGreaterThanOrEqual(25); // At least our expanded coverage
      expect(data.data.totalZipCodes).toBeGreaterThanOrEqual(500); // Reasonable number of ZIP codes
      expect(Array.isArray(data.data.cities)).toBe(true);
      expect(data.data.cities.length).toBeGreaterThanOrEqual(8); // Our test cities minimum
    });

    it('should include all critical expanded cities in response', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      const cityNames = data.data.cities.map(city => city.name);
      const citySlugs = data.data.cities.map(city => city.slug);
      
      // Contract validation: Critical cities must be present
      const requiredCities = [
        'Tyler', 'Longview', 'Corpus Christi', 'Laredo', 
        'Waco', 'College Station', 'Lubbock', 'Abilene'
      ];
      
      requiredCities.forEach(cityName => {
        expect(cityNames).toContain(cityName);
      });
      
      // Contract validation: Slug format
      const requiredSlugs = [
        'tyler-tx', 'longview-tx', 'corpus-christi-tx', 'laredo-tx',
        'waco-tx', 'college-station-tx', 'lubbock-tx', 'abilene-tx'
      ];
      
      requiredSlugs.forEach(slug => {
        expect(citySlugs).toContain(slug);
      });
    });

    it('should return proper city data structure for each city', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Each city has required fields
      data.data.cities.forEach(city => {
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('slug');
        expect(city).toHaveProperty('region');
        expect(city).toHaveProperty('zipCodeCount');
        expect(city).toHaveProperty('planCount');
        expect(city).toHaveProperty('tdspTerritory');
        expect(city).toHaveProperty('marketStatus');
        
        // Contract validation: Field types
        expect(typeof city.name).toBe('string');
        expect(typeof city.slug).toBe('string');
        expect(typeof city.region).toBe('string');
        expect(typeof city.zipCodeCount).toBe('number');
        expect(typeof city.planCount).toBe('number');
        expect(typeof city.tdspTerritory).toBe('string');
        expect(typeof city.marketStatus).toBe('string');
        
        // Contract validation: Field values
        expect(city.zipCodeCount).toBeGreaterThan(0);
        expect(city.planCount).toBeGreaterThan(0);
        expect(['active', 'limited', 'transitioning']).toContain(city.marketStatus);
      });
    });

    it('should organize cities by proper Texas market regions', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      const regions = data.data.cities.map(city => city.region);
      const uniqueRegions = [...new Set(regions)];
      
      // Contract validation: Texas market regions
      const expectedRegions = ['East Texas', 'South Texas', 'Central Texas', 'West Texas', 'Coast'];
      
      uniqueRegions.forEach(region => {
        expect(expectedRegions).toContain(region);
      });
      
      // Contract validation: Specific city regions
      const tylerCity = data.data.cities.find(city => city.name === 'Tyler');
      const corpusCity = data.data.cities.find(city => city.name === 'Corpus Christi');
      const wacoCity = data.data.cities.find(city => city.name === 'Waco');
      const lubbockCity = data.data.cities.find(city => city.name === 'Lubbock');
      
      if (tylerCity) expect(tylerCity.region).toBe('East Texas');
      if (corpusCity) expect(corpusCity.region).toBe('Coast');
      if (wacoCity) expect(wacoCity.region).toBe('Central Texas');
      if (lubbockCity) expect(lubbockCity.region).toBe('West Texas');
    });

    it('should include proper TDU territory mappings', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      const tdspTerritories = data.data.cities.map(city => city.tdspTerritory);
      const uniqueTdsps = [...new Set(tdspTerritories)];
      
      // Contract validation: Real TDU territories
      const expectedTdsps = ['Oncor', 'AEP Texas Central', 'AEP Texas North', 'AEP Texas South'];
      
      uniqueTdsps.forEach(tdsp => {
        expect(expectedTdsps).toContain(tdsp);
      });
      
      // Contract validation: Specific city TDU mappings
      const tylerCity = data.data.cities.find(city => city.name === 'Tyler');
      const corpusCity = data.data.cities.find(city => city.name === 'Corpus Christi');
      const abileneCity = data.data.cities.find(city => city.name === 'Abilene');
      
      if (tylerCity) expect(tylerCity.tdspTerritory).toBe('Oncor');
      if (corpusCity) expect(corpusCity.tdspTerritory).toBe('AEP Texas Central');
      if (abileneCity) expect(abileneCity.tdspTerritory).toBe('AEP Texas North');
    });

    it('should include metadata with proper timestamps and totals', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Timestamp format
      expect(data.data.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO 8601
      
      // Contract validation: Totals consistency
      expect(data.data.totalCities).toBe(data.data.cities.length);
      
      const totalZipCodes = data.data.cities.reduce((sum, city) => sum + city.zipCodeCount, 0);
      expect(data.data.totalZipCodes).toBe(totalZipCodes);
    });
  });

  describe('Response Headers and Format', () => {
    it('should return proper content-type header', async () => {
      const response = await getDeregulatedAreas();
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include CORS headers for frontend integration', async () => {
      const response = await getDeregulatedAreas();
      
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });

    it('should include cache headers for performance', async () => {
      const response = await getDeregulatedAreas();
      
      // Should have caching headers since city data changes infrequently
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms for coverage data', async () => {
      const startTime = Date.now();
      const response = await getDeregulatedAreas();
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Fast coverage lookup requirement
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array(5).fill(null).map(() => getDeregulatedAreas());
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(totalTime).toBeLessThan(1000); // 5 concurrent requests under 1 second
    });
  });

  describe('Data Quality and Constitutional Compliance', () => {
    it('should use real city names and data (no mock data)', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Real Texas cities only
      const cityNames = data.data.cities.map(city => city.name);
      
      // Should not contain mock city names
      expect(cityNames).not.toContain('Test City');
      expect(cityNames).not.toContain('Mock City');
      expect(cityNames).not.toContain('Example City');
      
      // Should contain real Texas cities
      const realTexasCities = ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Tyler', 'Corpus Christi'];
      const hasRealCities = cityNames.some(name => realTexasCities.includes(name));
      expect(hasRealCities).toBe(true);
    });

    it('should have reasonable plan counts for each city', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Realistic plan counts
      data.data.cities.forEach(city => {
        expect(city.planCount).toBeGreaterThan(5); // Minimum competitive options
        expect(city.planCount).toBeLessThan(500); // Reasonable maximum
      });
    });

    it('should maintain city slug format consistency', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Slug format
      data.data.cities.forEach(city => {
        expect(city.slug).toMatch(/^[a-z-]+$/); // Lowercase letters and hyphens only
        expect(city.slug).toContain('-tx'); // Texas suffix
        expect(city.slug).not.toContain(' '); // No spaces
        expect(city.slug).not.toContain('_'); // No underscores
      });
    });

    it('should provide complete market coverage data', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      // Contract validation: Market coverage completeness
      const regions = data.data.cities.map(city => city.region);
      const uniqueRegions = [...new Set(regions)];
      
      // Should cover all major Texas deregulated regions
      expect(uniqueRegions.length).toBeGreaterThanOrEqual(4); // At least 4 regions
      
      const tdspTerritories = data.data.cities.map(city => city.tdspTerritory);
      const uniqueTdsps = [...new Set(tdspTerritories)];
      
      // Should cover multiple TDU territories
      expect(uniqueTdsps.length).toBeGreaterThanOrEqual(2); // At least 2 TDUs
    });

    it('should exclude municipal and cooperative areas', async () => {
      const response = await getDeregulatedAreas();
      const data: DeregulatedAreasResponse = await response.json();
      
      const cityNames = data.data.cities.map(city => city.name);
      
      // Contract validation: No municipal utilities included
      const municipalCities = ['San Antonio', 'Austin Energy Service Area']; // Examples
      municipalCities.forEach(municipalCity => {
        if (cityNames.includes(municipalCity)) {
          const city = data.data.cities.find(c => c.name === municipalCity);
          // If included, should be marked as limited/transitioning
          expect(['limited', 'transitioning']).toContain(city?.marketStatus);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/deregulated-areas?invalid=param`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Should still return 200 but ignore invalid parameters
      expect(response.status).toBe(200);
    });

    it('should handle missing Accept header gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/deregulated-areas`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
    });
  });
});