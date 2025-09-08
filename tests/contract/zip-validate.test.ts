// Contract test for POST /api/zip/validate
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages
// This test MUST FAIL until the API endpoint is implemented

import { describe, it, expect, beforeAll } from 'vitest';
import { VALID_ZIP_RESULTS, INVALID_ZIP_RESULTS } from '../fixtures/zip-data';

const API_BASE_URL = 'http://localhost:4324/api';

describe('POST /api/zip/validate - Contract Test', () => {
  beforeAll(() => {
    // This test is designed to FAIL until implementation exists
    console.log('🔴 Contract test running - should FAIL until endpoint implemented');
  });

  describe('Valid ZIP code validation', () => {
    it('should validate Dallas ZIP code 75201', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      
      // Contract: Response must match ZIPValidationResult interface
      expect(data).toEqual({
        zipCode: '75201',
        isValid: true,
        tdsp: 'oncor',
        citySlug: 'dallas-tx',
        redirectUrl: '/electricity-plans/dallas-tx?zip=75201',
        availablePlans: expect.any(Number),
        errorMessage: null,
        suggestions: expect.any(Array)
      });

      expect(data.availablePlans).toBeGreaterThan(0);
      expect(data.suggestions).toHaveLength(0);
    });

    it('should validate Houston ZIP code 77001', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '77001',
          citySlug: 'houston-tx'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toEqual({
        zipCode: '77001',
        isValid: true,
        tdsp: 'centerpoint',
        citySlug: 'houston-tx',
        redirectUrl: '/electricity-plans/houston-tx?zip=77001',
        availablePlans: expect.any(Number),
        errorMessage: null,
        suggestions: expect.any(Array)
      });
    });

    it('should handle cross-city ZIP redirection', async () => {
      // Submit Houston ZIP from Dallas page
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '77001',
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.isValid).toBe(true);
      expect(data.citySlug).toBe('houston-tx');
      expect(data.redirectUrl).toContain('/houston-tx');
    });
  });

  describe('Invalid ZIP code validation', () => {
    it('should reject non-Texas ZIP code 12345', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '12345',
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(422); // Unprocessable Entity
      const data = await response.json();
      
      expect(data).toEqual({
        zipCode: '12345',
        isValid: false,
        tdsp: null,
        citySlug: null,
        redirectUrl: null,
        availablePlans: 0,
        errorMessage: expect.stringContaining('not in Texas'),
        suggestions: expect.any(Array)
      });

      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('should reject invalid format ZIP code', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: 'ABCDE',
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(400); // Bad Request
      const data = await response.json();
      
      expect(data.error).toBeDefined();
      expect(data.message).toContain('5 digits');
    });
  });

  describe('Request validation', () => {
    it('should require zipCode field', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should require citySlug field', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle optional sessionId field', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          citySlug: 'dallas-tx',
          sessionId: '550e8400-e29b-41d4-a716-446655440000'
        })
      });

      // Should still process request normally
      expect(response.status).toBe(200);
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits after 10 requests per minute', async () => {
      // Make 11 rapid requests
      const promises = Array.from({ length: 11 }, () => 
        fetch(`${API_BASE_URL}/zip/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            zipCode: '75201',
            citySlug: 'dallas-tx'
          })
        })
      );

      const responses = await Promise.all(promises);
      const statusCodes = responses.map(r => r.status);
      
      // At least one request should be rate limited
      expect(statusCodes).toContain(429);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type', async () => {
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        body: JSON.stringify({
          zipCode: '75201',
          citySlug: 'dallas-tx'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Performance requirements', () => {
    it('should respond within 200ms', async () => {
      const start = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/zip/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          citySlug: 'dallas-tx'
        })
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
      expect(response.status).toBe(200);
    });
  });
});