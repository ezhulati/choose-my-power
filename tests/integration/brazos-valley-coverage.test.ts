/**
 * Integration Test: Brazos Valley Coverage (College Station 77840)
 * Task: T012 - Integration test Brazos Valley coverage
 * 
 * CRITICAL: This test MUST FAIL initially (RED phase of TDD)
 * Validates correct routing for College Station instead of Houston
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { ZIPValidationResult } from '../../src/lib/types/zip-navigation';

describe('Brazos Valley Coverage Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4326/api';

  beforeAll(async () => {
    // Restore real fetch for integration tests
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch as any;
    console.log('🔧 Integration tests: Real fetch restored');
    console.log('🟢 TDD Phase: GREEN - Tests now validate working implementation');
  });

  describe('College Station ZIP 77840 Integration', () => {
    it('should route College Station ZIP 77840 to local plans (not Houston)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      expect(response.status).toBe(200);
      const result: ZIPValidationResult = await response.json();

      // Critical business requirement: College Station users get local plans
      expect(result.success).toBe(true);
      expect(result.data.zipCode).toBe('77840');
      expect(result.data.city.name).toBe('College Station');
      expect(result.data.city.slug).toBe('college-station-tx');
      expect(result.data.routingUrl).toBe('/electricity-plans/college-station-tx/');
      
      // Previous incorrect behavior (must be fixed)
      expect(result.data.routingUrl).not.toBe('/electricity-plans/houston-tx/');
      expect(result.data.city.name).not.toBe('Houston');
    });

    it('should validate College Station has deregulated market status', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      expect(result.data.city.isDeregulated).toBe(true);
      expect(result.data.city.planCount).toBeGreaterThan(0);
    });

    it('should identify correct TDU territory for College Station', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      // College Station should be served by specific TDU (not Houston TDU)
      expect(result.data.tdspTerritory.name).toBeDefined();
      expect(result.data.tdspTerritory.code).toBeDefined();
      
      // Should not be CenterPoint (Houston's TDU)
      expect(result.data.tdspTerritory.name).not.toBe('CenterPoint Energy');
    });

    it('should provide confident ZIP validation for College Station', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      expect(result.data.confidence).toBeGreaterThanOrEqual(1);
      expect(result.data.confidence).toBeLessThanOrEqual(5);
    });
  });

  describe('Brazos Valley Regional Coverage', () => {
    it('should handle other Brazos Valley ZIP codes correctly', async () => {
      // Test Bryan ZIP code (College Station's twin city)
      const bryanResponse = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77801' }) // Bryan ZIP
      });

      if (bryanResponse.status === 200) {
        const bryanResult: ZIPValidationResult = await bryanResponse.json();
        
        // Should route to Bryan, not Houston
        expect(bryanResult.data.routingUrl).not.toBe('/electricity-plans/houston-tx/');
        expect(bryanResult.data.city.name).not.toBe('Houston');
      }
    });

    it('should maintain regional consistency in TDU territory assignments', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      // Brazos Valley should have consistent TDU territory
      expect(result.data.tdspTerritory).toBeDefined();
    });
  });

  describe('Performance and Integration Requirements', () => {
    it('should complete College Station validation within performance target', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // Constitutional performance requirement
      expect(response.status).toBe(200);
    });

    it('should integrate College Station with deregulated areas endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/deregulated-areas`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const cityNames = data.data.cities.map((city: any) => city.name);
      expect(cityNames).toContain('College Station');
      
      const collegeStationCity = data.data.cities.find((city: any) => city.name === 'College Station');
      if (collegeStationCity) {
        expect(collegeStationCity.region).toBe('Central Texas');
        expect(collegeStationCity.zipCodeCount).toBeGreaterThan(0);
        expect(collegeStationCity.planCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Prevention', () => {
    it('should prevent College Station from routing to Houston (regression test)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/lookup/77840`);
      
      if (response.status === 200) {
        const data = await response.json();
        
        // Critical: Must not route to Houston
        expect(data.data.redirectUrl).not.toBe('/electricity-plans/houston-tx/');
        expect(data.data.cityName).not.toBe('Houston');
      }
    });

    it('should handle ZIP+4 format for College Station correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zipCode: '77840',
          zipPlus4: '1234'
        })
      });

      if (response.status === 200) {
        const result: ZIPValidationResult = await response.json();
        
        expect(result.data.city.name).toBe('College Station');
        expect(result.data.routingUrl).toBe('/electricity-plans/college-station-tx/');
      }
    });
  });

  describe('Constitutional Compliance', () => {
    it('should use real College Station data (no mock data)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      // Should not use mock data
      expect(result.data.city.name).toBe('College Station'); // Real city name
      expect(result.data.city.name).not.toBe('Test City');
      expect(result.data.city.name).not.toBe('Mock City');
      
      // Plan count should be reasonable for real data
      if (result.data.city.planCount) {
        expect(result.data.city.planCount).toBeGreaterThan(5);
        expect(result.data.city.planCount).toBeLessThan(200);
      }
    });

    it('should generate dynamic routing URLs (no hardcoded values)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });

      const result: ZIPValidationResult = await response.json();
      
      // URL should be generated dynamically from city slug
      expect(result.data.routingUrl).toContain(result.data.city.slug);
      expect(result.data.routingUrl).toMatch(/^\/electricity-plans\/[a-z-]+\/$/);
      
      // Should not contain hardcoded plan IDs
      const responseStr = JSON.stringify(result);
      expect(responseStr).not.toMatch(/68b[0-9a-f]{21}/);
    });
  });
});