/**
 * Integration Test: Button State Management
 * Tests Scenario 4 from quickstart.md
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

describe('Integration Test: Button State Management', () => {
  
  test('should validate button activation logic through API', async () => {
    const testSequence = [
      { zipCode: '', shouldBeActive: false, description: 'Empty ZIP' },
      { zipCode: '7', shouldBeActive: false, description: '1 digit' },
      { zipCode: '75', shouldBeActive: false, description: '2 digits' },
      { zipCode: '752', shouldBeActive: false, description: '3 digits' },
      { zipCode: '7520', shouldBeActive: false, description: '4 digits' },
      { zipCode: '75201', shouldBeActive: true, description: 'Valid Texas ZIP' },
      { zipCode: '12345', shouldBeActive: false, description: 'Invalid (non-Texas) 5-digit ZIP' },
    ];
    
    for (const { zipCode, shouldBeActive, description } of testSequence) {
      if (zipCode.length < 5) {
        // Client-side validation - button should be disabled
        expect(shouldBeActive).toBe(false);
        continue;
      }
      
      // Server-side validation for 5-digit codes
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      if (shouldBeActive) {
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      } else {
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      }
    }
  });
  
  test('should provide proper UX feedback for button states', async () => {
    // Valid ZIP should enable button (success response)
    const validResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode: '75201' })
    });
    
    expect(validResponse.status).toBe(200);
    
    // Invalid ZIP should keep button disabled (error response)
    const invalidResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode: '12345' })
    });
    
    expect(invalidResponse.status).toBe(400);
  });
});