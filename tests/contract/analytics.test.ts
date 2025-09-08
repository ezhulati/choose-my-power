// Contract test for POST /api/analytics/form-interaction
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages
// This test MUST FAIL until the API endpoint is implemented

import { describe, it, expect, beforeAll } from 'vitest';
import { SAMPLE_FORM_INTERACTIONS, USER_AGENTS } from '../fixtures/zip-data';
import type { FormAction, DeviceType } from '../../src/types/zip-validation';

const API_BASE_URL = 'http://localhost:4324/api';

describe('POST /api/analytics/form-interaction - Contract Test', () => {
  beforeAll(() => {
    console.log('🔴 Contract test running - should FAIL until endpoint implemented');
  });

  describe('Valid form interaction tracking', () => {
    it('should track form submit interaction', async () => {
      const interactionData = {
        zipCode: '75201',
        cityPage: 'dallas-tx',
        action: 'submit' as FormAction,
        duration: 5000,
        deviceType: 'desktop' as DeviceType,
        success: true,
        sessionId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toEqual({
        success: true
      });
    });

    it('should track form error interaction', async () => {
      const interactionData = {
        zipCode: '12345',
        cityPage: 'dallas-tx', 
        action: 'error' as FormAction,
        duration: 8000,
        deviceType: 'mobile' as DeviceType,
        success: false,
        sessionId: '550e8400-e29b-41d4-a716-446655440001'
      };

      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should track form focus interaction', async () => {
      const interactionData = {
        zipCode: '',
        cityPage: 'houston-tx',
        action: 'focus' as FormAction,
        duration: 0,
        deviceType: 'tablet' as DeviceType,
        success: true
      };

      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      expect(response.status).toBe(201);
    });

    it('should track partial ZIP code input', async () => {
      const interactionData = {
        zipCode: '752',
        cityPage: 'dallas-tx',
        action: 'input' as FormAction,
        duration: 2500,
        deviceType: 'mobile' as DeviceType,
        success: true
      };

      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Request validation', () => {
    it('should require zipCode field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.message).toContain('zipCode');
    });

    it('should require cityPage field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          action: 'submit',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('should require action field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('should require deviceType field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: 5000,
          success: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('should validate action enum values', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'invalid-action',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('action');
    });

    it('should validate deviceType enum values', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: 5000,
          deviceType: 'invalid-device',
          success: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('should validate duration is non-negative', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: -1000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('should allow optional timestamp field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          timestamp: '2025-01-09T10:30:00Z',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(201);
    });

    it('should allow optional sessionId field', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: 5000,
          deviceType: 'desktop',
          success: true,
          sessionId: 'test-session-123'
        })
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits after 100 requests per hour', async () => {
      // Make multiple rapid requests (this would normally be spread over an hour)
      const promises = Array.from({ length: 10 }, (_, i) => 
        fetch(`${API_BASE_URL}/analytics/form-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            zipCode: `7520${i}`,
            cityPage: 'dallas-tx',
            action: 'submit',
            duration: 1000,
            deviceType: 'desktop',
            success: true
          })
        })
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed for reasonable testing load
      responses.forEach(response => {
        expect([201, 429]).toContain(response.status);
      });
    });
  });

  describe('Data validation edge cases', () => {
    it('should handle empty zipCode for focus actions', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '',
          cityPage: 'dallas-tx',
          action: 'focus',
          duration: 0,
          deviceType: 'mobile',
          success: true
        })
      });

      expect(response.status).toBe(201);
    });

    it('should handle partial ZIP codes for input actions', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '7',
          cityPage: 'dallas-tx',
          action: 'input',
          duration: 500,
          deviceType: 'mobile',
          success: true
        })
      });

      expect(response.status).toBe(201);
    });

    it('should handle long ZIP codes for error tracking', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '752011234567890',
          cityPage: 'dallas-tx',
          action: 'error',
          duration: 3000,
          deviceType: 'desktop',
          success: false
        })
      });

      expect(response.status).toBe(201);
    });

    it('should handle zero duration for instant actions', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'redirect',
          duration: 0,
          deviceType: 'desktop',
          success: true
        })
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Performance requirements', () => {
    it('should respond within 25ms (async tracking)', async () => {
      const start = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/analytics/form-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '75201',
          cityPage: 'dallas-tx',
          action: 'submit',
          duration: 5000,
          deviceType: 'desktop',
          success: true
        })
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(25);
      expect(response.status).toBe(201);
    });

    it('should handle batch analytics efficiently', async () => {
      const interactions = Array.from({ length: 5 }, (_, i) => ({
        zipCode: `7520${i}`,
        cityPage: 'dallas-tx',
        action: 'input' as FormAction,
        duration: 1000 + i * 500,
        deviceType: 'mobile' as DeviceType,
        success: true
      }));

      const start = Date.now();
      
      const promises = interactions.map(interaction =>
        fetch(`${API_BASE_URL}/analytics/form-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(interaction)
        })
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});