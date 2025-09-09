/**
 * Integration Test: West Texas coverage (Lubbock 79401, Abilene 79601)  
 * Feature: 010-expand-zip-code
 * TDD Phase: MUST FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

describe('West Texas Coverage Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  describe('Lubbock Coverage', () => {
    it('should resolve Lubbock 79401 to Lubbock plans page', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '79401' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.data.city.name).toBe('Lubbock');
      expect(data.data.routingUrl).toBe('/electricity-plans/lubbock-tx/');
      expect(data.data.marketZone).toBe('West');
      expect(data.data.tdspTerritory.name).toBe('Oncor');
    });
  });

  describe('Abilene Coverage', () => {
    it('should resolve Abilene 79601 with correct TDU territory', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '79601' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.data.city.name).toBe('Abilene');
      expect(data.data.routingUrl).toBe('/electricity-plans/abilene-tx/');
      expect(data.data.marketZone).toBe('West');
      expect(data.data.tdspTerritory.name).toBe('AEP Texas North');
    });
  });
});