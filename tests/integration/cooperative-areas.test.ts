/**
 * Integration Test: Electric cooperative area error handling
 * Feature: 010-expand-zip-code - Proper cooperative area messaging
 * TDD Phase: MUST FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

describe('Electric Cooperative Areas Integration', () => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://choosemypower.netlify.app/api'
    : 'http://localhost:4325/api';

  describe('Cooperative Area Error Handling', () => {
    it('should return proper error response for Cherokee County Electric Cooperative', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '75932' }) // Cherokee County Electric Cooperative
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ZIP_NOT_DEREGULATED');
      expect(data.error.message).toContain('electric cooperative');
      expect(data.error.suggestedAction).toContain('Contact your local electric cooperative');
      expect(data.error.cooperativeInfo).toHaveProperty('name');
      expect(data.error.cooperativeInfo).toHaveProperty('phone');
    });

    it('should not appear in deregulated areas list', async () => {
      const response = await fetch(`${API_BASE_URL}/deregulated-areas`);
      const data = await response.json();
      
      const cityNames = data.data.cities.map(city => city.name);
      
      // Common cooperative service areas should NOT appear
      const cooperativeAreas = ['Cherokee County', 'Rural Electric'];
      cooperativeAreas.forEach(area => {
        expect(cityNames).not.toContain(area);
      });
    });

    it('should provide helpful guidance for cooperative areas', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: '75932' })
      });
      
      const data = await response.json();
      
      expect(data.error.cooperativeInfo.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/); // Phone format
      expect(data.error.cooperativeInfo.website).toMatch(/^https?:\/\//); // URL format
    });
  });
});