/**
 * Contract Tests: ZIP Code to City Plans Navigation API
 * 
 * These tests validate the API contract defined in zip-navigation-api.yaml
 * Tests MUST FAIL initially (RED phase) before implementation exists
 * 
 * Functional Requirements Coverage:
 * - FR-001: ZIP code input validation (5-digit US ZIP codes only)
 * - FR-002: ZIP to Texas city mapping using real geographic data
 * - FR-003: Direct redirect to city-specific plans URL (no intermediate pages)
 * - FR-004: Real electricity plans with current rates from correct TDSP territory
 * - FR-006: Invalid ZIP error handling without navigation trigger
 * - FR-007: Smooth UX with no broken redirects or 404 errors
 * - FR-008: Button inactive until valid ZIP entered
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:4324';

describe('ZIP Navigation API Contract', () => {
  
  describe('POST /api/zip/navigate - Valid ZIP Code Navigation', () => {
    
    test('should validate Dallas ZIP 75201 and return correct redirect URL', async () => {
      // ARRANGE - Valid Dallas ZIP code
      const requestBody = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      // ACT - Call ZIP navigation endpoint
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Contract compliance (FR-003: Direct redirect URL)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redirectUrl).toMatch(/^\/electricity-plans\/[a-z0-9-]+-tx\/?$/);
      expect(data.redirectUrl).toBe('/electricity-plans/dallas-tx/');
      expect(data.cityName).toBe('Dallas');
      expect(data.citySlug).toMatch(/^[a-z0-9-]+-tx$/);
      expect(data.citySlug).toBe('dallas-tx');
      expect(data.tdspTerritory).toBeTruthy();
      expect(typeof data.planCount).toBe('number');
      expect(data.planCount).toBeGreaterThan(0);
      
      // ASSERT - Performance requirement (FR: <200ms validation)
      expect(typeof data.validationTime).toBe('number');
      expect(data.validationTime).toBeLessThan(200);
    });
    
    test('should validate Houston ZIP 77001 and return correct redirect URL', async () => {
      // ARRANGE - Valid Houston ZIP code
      const requestBody = {
        zipCode: '77001',
        validatePlansAvailable: true
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redirectUrl).toBe('/electricity-plans/houston-tx/');
      expect(data.cityName).toBe('Houston');
      expect(data.citySlug).toBe('houston-tx');
      expect(data.tdspTerritory).toBeTruthy();
      expect(data.planCount).toBeGreaterThan(0);
    });
    
    test('should handle ZIP codes with plans pre-validation disabled', async () => {
      // ARRANGE - Valid ZIP with plan validation disabled
      const requestBody = {
        zipCode: '75201',
        validatePlansAvailable: false
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Should still return valid redirect URL
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redirectUrl).toBeTruthy();
      expect(data.citySlug).toBeTruthy();
    });
  });
  
  describe('POST /api/zip/navigate - Invalid ZIP Code Handling', () => {
    
    test('should reject invalid ZIP code format (FR-001, FR-006)', async () => {
      // ARRANGE - Invalid ZIP code format
      const requestBody = {
        zipCode: '1234' // Only 4 digits
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Contract compliance (FR-006: Error without navigation)
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
      expect(data.errorCode).toBe('INVALID_FORMAT');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
    });
    
    test('should reject non-Texas ZIP codes (FR-002)', async () => {
      // ARRANGE - Valid format but not Texas (Texas ZIP codes start with 7)
      const requestBody = {
        zipCode: '10001' // New York ZIP
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('NOT_TEXAS');
      expect(data.suggestions).toContain('Texas ZIP codes start with 7');
    });
    
    test('should reject ZIP codes in regulated markets', async () => {
      // ARRANGE - Texas ZIP but in regulated market area
      const requestBody = {
        zipCode: '79901' // El Paso - regulated market
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('NOT_DEREGULATED');
    });
    
    test('should handle ZIP codes with no available plans', async () => {
      // ARRANGE - Valid deregulated ZIP but no plans available
      const requestBody = {
        zipCode: '75999', // Hypothetical ZIP with no plans
        validatePlansAvailable: true
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Should return error without navigation (FR-006)
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('NO_PLANS_AVAILABLE');
    });
    
    test('should reject malformed request body', async () => {
      // ARRANGE - Missing required zipCode field
      const requestBody = {
        validatePlansAvailable: true
        // zipCode missing
      };
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // ASSERT - Should return validation error
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('zipCode');
    });
  });
  
  describe('GET /api/zip/validate-city-plans - Plan Availability Pre-validation', () => {
    
    test('should validate Dallas plans availability', async () => {
      // ARRANGE - Dallas city slug
      const citySlug = 'dallas-tx';
      const tdspTerritory = 'Oncor';
      
      // ACT
      const response = await fetch(
        `${API_BASE_URL}/api/zip/validate-city-plans?citySlug=${citySlug}&tdspTerritory=${tdspTerritory}`
      );
      
      const data = await response.json();
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(200);
      expect(data.plansAvailable).toBe(true);
      expect(data.planCount).toBeGreaterThan(0);
      expect(data.citySlug).toBe(citySlug);
      expect(typeof data.lastUpdated).toBe('string');
      
      // Validate ISO date format
      expect(() => new Date(data.lastUpdated)).not.toThrow();
    });
    
    test('should handle city not found', async () => {
      // ARRANGE - Non-existent city slug
      const citySlug = 'nonexistent-city-tx';
      
      // ACT
      const response = await fetch(
        `${API_BASE_URL}/api/zip/validate-city-plans?citySlug=${citySlug}`
      );
      
      const data = await response.json();
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(404);
      expect(data.plansAvailable).toBe(false);
      expect(data.reason).toBe('CITY_NOT_FOUND');
    });
    
    test('should handle missing citySlug parameter', async () => {
      // ARRANGE - Request without required citySlug parameter
      
      // ACT
      const response = await fetch(
        `${API_BASE_URL}/api/zip/validate-city-plans`
      );
      
      // ASSERT - Should return validation error
      expect(response.status).toBe(400);
    });
  });
  
  describe('API Performance Requirements', () => {
    
    test('should meet performance requirements for ZIP validation (<200ms)', async () => {
      // ARRANGE - Valid ZIP code
      const requestBody = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      // ACT - Measure response time
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const endTime = Date.now();
      
      const data = await response.json();
      const responseTime = endTime - startTime;
      
      // ASSERT - Performance requirement (FR: <200ms)
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
      expect(data.validationTime).toBeLessThan(200);
    });
    
    test('should meet performance requirements for plan availability check (<300ms)', async () => {
      // ARRANGE - Valid city slug
      const citySlug = 'dallas-tx';
      
      // ACT - Measure response time
      const startTime = Date.now();
      const response = await fetch(
        `${API_BASE_URL}/api/zip/validate-city-plans?citySlug=${citySlug}`
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // ASSERT - Performance requirement (<300ms for plan validation)
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300);
    });
  });
  
  describe('Error Handling and Service Reliability', () => {
    
    test('should handle service unavailable gracefully', async () => {
      // This test may need to be skipped in development
      // but validates graceful degradation behavior
      
      // ARRANGE - Valid request
      const requestBody = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      // ACT - This assumes service might be temporarily unavailable
      // In real scenarios, this would test timeout or service failure
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      // ASSERT - Should either succeed or fail gracefully
      if (response.status === 500) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeTruthy();
        expect(typeof data.retryAfter).toBe('number');
      } else {
        expect(response.status).toBe(200);
      }
    });
  });
});

/**
 * Integration Tests: End-to-End Navigation Flow
 * 
 * These tests validate the complete user journey from ZIP entry to city plans page
 */
describe('ZIP Navigation Integration Flow', () => {
  
  test('should complete full navigation flow: ZIP entry → plans page', async () => {
    // ARRANGE - Simulate user ZIP entry
    const zipCode = '75201';
    
    // ACT - Step 1: Get navigation URL
    const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode, validatePlansAvailable: true })
    });
    
    const navData = await navResponse.json();
    
    // Step 2: Validate redirect URL is accessible
    const plansPageResponse = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
    
    // ASSERT - Complete flow validation (FR-003, FR-005, FR-007)
    expect(navResponse.status).toBe(200);
    expect(navData.success).toBe(true);
    expect(navData.redirectUrl).toBeTruthy();
    
    // Verify plans page is accessible (no 404 errors - FR-007)
    expect(plansPageResponse.status).toBe(200);
    
    // Verify no intermediate redirects (direct navigation - FR-003)
    expect(plansPageResponse.url).toContain(navData.redirectUrl);
  });
  
  test('should prevent navigation for invalid ZIP codes', async () => {
    // ARRANGE - Invalid ZIP code
    const zipCode = '00000';
    
    // ACT
    const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode })
    });
    
    const data = await response.json();
    
    // ASSERT - No navigation should occur (FR-006)
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.redirectUrl).toBeUndefined();
  });
});

/**
 * NOTE: These tests are designed to FAIL initially (RED phase of TDD)
 * Implementation should be created to make these tests pass (GREEN phase)
 * Then refactor for optimization while keeping tests passing (REFACTOR phase)
 */