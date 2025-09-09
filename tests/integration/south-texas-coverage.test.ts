/**
 * Integration Test: South Texas coverage (Corpus Christi 78401, Laredo 78040)
 * Feature: 010-expand-zip-code - Critical fix for NOT_FOUND errors
 * TDD Phase: MUST FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

describe('South Texas Coverage Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  describe('Corpus Christi Coverage - CRITICAL FIX', () => {
    it('should resolve Corpus Christi 78401 (no more NOT_FOUND errors)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '78401' })
      });
      
      expect(response.status).toBe(200); // NOT 404 anymore!
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.city.name).toBe('Corpus Christi');
      expect(data.data.routingUrl).toBe('/electricity-plans/corpus-christi-tx/');
      expect(data.data.tdspTerritory.name).toBe('AEP Texas Central');
    });

    it('should handle all Corpus Christi ZIP codes', async () => {
      const corpusZips = ['78401', '78402', '78403'];
      
      for (const zipCode of corpusZips) {
        const response = await fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode })
        });
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.city.name).toBe('Corpus Christi');
        expect(data.data.marketZone).toBe('Coast');
      }
    });
  });

  describe('Laredo Coverage', () => {
    it('should resolve Laredo 78040 to local plans page', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '78040' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.data.city.name).toBe('Laredo');
      expect(data.data.routingUrl).toBe('/electricity-plans/laredo-tx/');
      expect(data.data.tdspTerritory.name).toBe('AEP Texas South');
      expect(data.data.marketZone).toBe('South');
    });
  });
});