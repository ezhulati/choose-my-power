/**
 * Contract Test: POST /api/zip/navigate endpoint
 * 
 * Tests the ZIP code validation and navigation API contract
 * Validates response schema matches contracts/zip-navigation-api.yaml
 * 
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 * Implementation should be created to make this test pass (GREEN phase)
 */

import { describe, test, expect, beforeAll } from 'vitest';
import type { APIRoute } from 'astro';

const API_BASE_URL = 'http://localhost:4324';

// Types based on contract specification
interface ZipNavigationRequest {
  zipCode: string;
  validatePlansAvailable?: boolean;
}

interface ZipNavigationSuccessResponse {
  success: true;
  redirectUrl: string;
  cityName: string;
  citySlug: string;
  tdspTerritory: string;
  planCount: number;
  validationTime: number;
}

interface ZipNavigationErrorResponse {
  success: false;
  error: string;
  errorCode: 'INVALID_FORMAT' | 'NOT_TEXAS' | 'NOT_DEREGULATED' | 'NO_PLANS_AVAILABLE' | 'VALIDATION_TIMEOUT' | 'SERVICE_UNAVAILABLE';
  suggestions?: string[];
}

type ZipNavigationResponse = ZipNavigationSuccessResponse | ZipNavigationErrorResponse;

describe('Contract Test: POST /api/zip/navigate', () => {
  
  // Helper function to make API calls
  async function callZipNavigateAPI(requestBody: ZipNavigationRequest): Promise<{
    response: Response;
    data: ZipNavigationResponse;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json() as ZipNavigationResponse;
    return { response, data };
  }
  
  describe('Valid ZIP Code Navigation', () => {
    
    test('should validate Dallas ZIP 75201 and return correct redirect URL', async () => {
      // ARRANGE
      const requestBody: ZipNavigationRequest = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT - Contract compliance
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.success) {
        // Validate redirect URL format from contract
        expect(data.redirectUrl).toMatch(/^\/electricity-plans\/[a-z0-9-]+-tx\/?$/);
        expect(data.redirectUrl).toBe('/electricity-plans/dallas-tx/');
        
        // Validate required fields
        expect(data.cityName).toBe('Dallas');
        expect(data.citySlug).toMatch(/^[a-z0-9-]+-tx$/);
        expect(data.citySlug).toBe('dallas-tx');
        expect(typeof data.tdspTerritory).toBe('string');
        expect(data.tdspTerritory.length).toBeGreaterThan(0);
        expect(typeof data.planCount).toBe('number');
        expect(data.planCount).toBeGreaterThan(0);
        
        // Performance requirement: <200ms validation time
        expect(typeof data.validationTime).toBe('number');
        expect(data.validationTime).toBeLessThan(200);
      }
    });
    
    test('should validate Houston ZIP 77001 and return correct redirect URL', async () => {
      // ARRANGE
      const requestBody: ZipNavigationRequest = {
        zipCode: '77001',
        validatePlansAvailable: true
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.success) {
        expect(data.redirectUrl).toBe('/electricity-plans/houston-tx/');
        expect(data.cityName).toBe('Houston');
        expect(data.citySlug).toBe('houston-tx');
        expect(data.planCount).toBeGreaterThan(0);
        expect(data.validationTime).toBeLessThan(200);
      }
    });
    
    test('should handle ZIP codes with plans pre-validation disabled', async () => {
      // ARRANGE
      const requestBody: ZipNavigationRequest = {
        zipCode: '75201',
        validatePlansAvailable: false
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.success) {
        expect(data.redirectUrl).toBeTruthy();
        expect(data.citySlug).toBeTruthy();
        // Should still return plan count even if validation is disabled
        expect(typeof data.planCount).toBe('number');
      }
    });
  });
  
  describe('Invalid ZIP Code Handling', () => {
    
    test('should reject invalid ZIP code format', async () => {
      // ARRANGE - 4 digits instead of 5
      const requestBody: ZipNavigationRequest = {
        zipCode: '1234'
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      
      if (!data.success) {
        expect(data.error).toBeTruthy();
        expect(data.errorCode).toBe('INVALID_FORMAT');
        expect(Array.isArray(data.suggestions)).toBe(true);
        expect(data.suggestions!.length).toBeGreaterThan(0);
        expect(data.suggestions!.some(s => s.includes('5-digit'))).toBe(true);
      }
    });
    
    test('should reject non-Texas ZIP codes', async () => {
      // ARRANGE - New York ZIP (doesn't start with 7)
      const requestBody: ZipNavigationRequest = {
        zipCode: '10001'
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      
      if (!data.success) {
        expect(data.errorCode).toBe('NOT_TEXAS');
        expect(data.suggestions!.some(s => s.includes('Texas ZIP codes start with 7'))).toBe(true);
      }
    });
    
    test('should reject ZIP codes in regulated markets', async () => {
      // ARRANGE - El Paso ZIP (regulated market)
      const requestBody: ZipNavigationRequest = {
        zipCode: '79901'
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      
      if (!data.success) {
        expect(data.errorCode).toBe('NOT_DEREGULATED');
        expect(data.error).toContain('regulated');
      }
    });
    
    test('should handle malformed request body', async () => {
      // ARRANGE - Missing zipCode field
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validatePlansAvailable: true }) // zipCode missing
      });
      
      const data = await response.json();
      
      // ASSERT
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('zipCode');
    });
    
    test('should handle empty ZIP code', async () => {
      // ARRANGE
      const requestBody: ZipNavigationRequest = {
        zipCode: ''
      };
      
      // ACT
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // ASSERT
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      
      if (!data.success) {
        expect(data.errorCode).toBe('INVALID_FORMAT');
      }
    });
  });
  
  describe('Performance Requirements', () => {
    
    test('should meet performance requirements for ZIP validation (<200ms)', async () => {
      // ARRANGE
      const requestBody: ZipNavigationRequest = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      // ACT - Measure total response time
      const startTime = Date.now();
      const { response, data } = await callZipNavigateAPI(requestBody);
      const endTime = Date.now();
      const totalResponseTime = endTime - startTime;
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.success) {
        // Total response time should be reasonable
        expect(totalResponseTime).toBeLessThan(1000); // 1 second max
        
        // API-reported validation time must be <200ms
        expect(data.validationTime).toBeLessThan(200);
      }
    });
    
    test('should handle concurrent ZIP validation requests', async () => {
      // ARRANGE - Multiple ZIP codes to test concurrency
      const zipCodes = ['75201', '77001', '78701', '76101'];
      const requests = zipCodes.map(zipCode => 
        callZipNavigateAPI({ zipCode, validatePlansAvailable: true })
      );
      
      // ACT
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // ASSERT
      expect(results).toHaveLength(4);
      results.forEach(({ response, data }) => {
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        if (data.success) {
          expect(data.validationTime).toBeLessThan(200);
        }
      });
      
      // Concurrent requests shouldn't take significantly longer than sequential
      expect(totalTime).toBeLessThan(800); // Allow some overhead for concurrency
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    
    test('should handle service unavailable gracefully', async () => {
      // This test will need to be mocked or skipped in development
      // but validates that the endpoint can handle service failures
      
      // For now, just validate that a proper request works
      // In a real scenario, this would test timeout or service failure
      const requestBody: ZipNavigationRequest = {
        zipCode: '75201',
        validatePlansAvailable: true
      };
      
      const { response, data } = await callZipNavigateAPI(requestBody);
      
      // Either succeeds normally or fails gracefully
      if (response.status === 500) {
        expect(data.success).toBe(false);
        if (!data.success) {
          expect(data.error).toBeTruthy();
          expect(data.errorCode).toBe('SERVICE_UNAVAILABLE');
        }
      } else {
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });
  });
});

/**
 * NOTE: This test is designed to FAIL initially (RED phase of TDD)
 * The /api/zip/navigate endpoint does not exist yet and should be implemented
 * to make these tests pass (GREEN phase), then optimized (REFACTOR phase)
 */