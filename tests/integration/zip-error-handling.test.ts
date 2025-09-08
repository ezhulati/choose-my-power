/**
 * Integration Test: Invalid ZIP Code Handling
 * Tests Scenario 3 from quickstart.md  
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

describe('Integration Test: Invalid ZIP Code Handling', () => {
  
  test('should handle invalid format without navigation', async () => {
    const invalidFormats = ['1234', '123456', 'abcde', '12-34', '12 34'];
    
    for (const zipCode of invalidFormats) {
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('INVALID_FORMAT');
      expect(data.redirectUrl).toBeUndefined(); // No navigation
    }
  });
  
  test('should handle non-Texas ZIP without navigation', async () => {
    const nonTexasZips = ['10001', '90210', '60601', '30301']; // NY, CA, IL, GA
    
    for (const zipCode of nonTexasZips) {
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('NOT_TEXAS');
      expect(data.suggestions).toContain('Texas ZIP codes start with 7');
      expect(data.redirectUrl).toBeUndefined(); // No navigation
    }
  });
  
  test('should handle regulated market ZIP without navigation', async () => {
    const regulatedZips = ['79901']; // El Paso - regulated market
    
    for (const zipCode of regulatedZips) {
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('NOT_DEREGULATED');
      expect(data.redirectUrl).toBeUndefined(); // No navigation
    }
  });
});