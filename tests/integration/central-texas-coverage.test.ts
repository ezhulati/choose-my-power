/**
 * Integration Test: Central Texas coverage - Waco 76701 routing fix
 * Feature: 010-expand-zip-code - Fix Waco → Fort Worth incorrect routing
 * TDD Phase: MUST FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

describe('Central Texas Coverage Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  describe('Waco Coverage - CRITICAL ROUTING FIX', () => {
    it('should route Waco 76701 to Waco (NOT Fort Worth)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '76701' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.city.name).toBe('Waco');
      expect(data.data.routingUrl).toBe('/electricity-plans/waco-tx/');
      
      // CRITICAL: Must NOT route to Fort Worth anymore
      expect(data.data.routingUrl).not.toBe('/electricity-plans/fort-worth-tx/');
      expect(data.data.city.name).not.toBe('Fort Worth');
    });

    it('should handle all Waco ZIP codes consistently', async () => {
      const wacoZips = ['76701', '76702', '76703'];
      
      for (const zipCode of wacoZips) {
        const response = await fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode })
        });
        
        const data = await response.json();
        expect(data.data.city.name).toBe('Waco');
        expect(data.data.city.slug).toBe('waco-tx');
        expect(data.data.marketZone).toBe('Central');
        expect(data.data.tdspTerritory.name).toBe('Oncor');
      }
    });
  });

  describe('College Station Coverage - CRITICAL ROUTING FIX', () => {
    it('should route College Station 77840 locally (NOT Houston)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '77840' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.data.city.name).toBe('College Station');
      expect(data.data.routingUrl).toBe('/electricity-plans/college-station-tx/');
      
      // CRITICAL: Must NOT route to Houston anymore
      expect(data.data.routingUrl).not.toBe('/electricity-plans/houston-tx/');
      expect(data.data.city.name).not.toBe('Houston');
    });
  });
});