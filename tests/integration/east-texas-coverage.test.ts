/**
 * Integration Test: East Texas coverage (Tyler 75701, Longview 75601)
 * Feature: 010-expand-zip-code
 * TDD Phase: MUST FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

describe('East Texas Coverage Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  describe('Tyler ZIP Code Coverage', () => {
    it('should route Tyler 75701 to Tyler plans page (not Dallas)', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '75701' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.city.name).toBe('Tyler');
      expect(data.data.routingUrl).toBe('/electricity-plans/tyler-tx/');
      expect(data.data.routingUrl).not.toBe('/electricity-plans/dallas-tx/');
    });

    it('should handle multiple Tyler ZIP codes consistently', async () => {
      const tylerZips = ['75701', '75702', '75703'];
      
      for (const zipCode of tylerZips) {
        const response = await fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode })
        });
        
        const data = await response.json();
        expect(data.data.city.name).toBe('Tyler');
        expect(data.data.city.slug).toBe('tyler-tx');
        expect(data.data.tdspTerritory.name).toBe('Oncor');
      }
    });
  });

  describe('Longview ZIP Code Coverage', () => {
    it('should route Longview 75601 to Longview plans page', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '75601' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.city.name).toBe('Longview');
      expect(data.data.routingUrl).toBe('/electricity-plans/longview-tx/');
    });

    it('should handle multiple Longview ZIP codes consistently', async () => {
      const longviewZips = ['75601', '75602'];
      
      for (const zipCode of longviewZips) {
        const response = await fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode })
        });
        
        const data = await response.json();
        expect(data.data.city.name).toBe('Longview');
        expect(data.data.city.slug).toBe('longview-tx');
        expect(data.data.tdspTerritory.name).toBe('Oncor');
      }
    });
  });

  describe('East Texas Regional Validation', () => {
    it('should classify Tyler and Longview as North/East Texas market zone', async () => {
      const eastTexasZips = ['75701', '75601'];
      
      for (const zipCode of eastTexasZips) {
        const response = await fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode })
        });
        
        const data = await response.json();
        expect(data.data.marketZone).toBe('North'); // East Texas in North zone
        expect(data.data.tdspTerritory.name).toBe('Oncor');
      }
    });

    it('should ensure East Texas cities appear in deregulated areas list', async () => {
      const response = await fetch(`${API_BASE_URL}/deregulated-areas`);
      const data = await response.json();
      
      const cityNames = data.data.cities.map(city => city.name);
      expect(cityNames).toContain('Tyler');
      expect(cityNames).toContain('Longview');
      
      const tylerCity = data.data.cities.find(city => city.name === 'Tyler');
      const longviewCity = data.data.cities.find(city => city.name === 'Longview');
      
      expect(tylerCity?.region).toBe('East Texas');
      expect(longviewCity?.region).toBe('East Texas');
    });
  });
});