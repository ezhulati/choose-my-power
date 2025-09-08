/**
 * Integration Test: Multi-City ZIP Validation 
 * Tests Scenario 2 from quickstart.md
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

describe('Integration Test: Multi-City ZIP Validation', () => {
  
  const testCases = [
    { zipCode: '75201', expectedCity: 'Dallas', expectedUrl: '/electricity-plans/dallas-tx/', expectedTdsp: 'Oncor' },
    { zipCode: '77001', expectedCity: 'Houston', expectedUrl: '/electricity-plans/houston-tx/', expectedTdsp: 'Centerpoint' },
    { zipCode: '78701', expectedCity: 'Austin', expectedUrl: '/electricity-plans/austin-tx/', expectedTdsp: 'Austin Energy' },
    { zipCode: '76101', expectedCity: 'Fort Worth', expectedUrl: '/electricity-plans/fort-worth-tx/', expectedTdsp: 'Oncor' },
  ];
  
  test.each(testCases)('should correctly map ZIP $zipCode to $expectedCity with TDSP $expectedTdsp', async ({ zipCode, expectedCity, expectedUrl, expectedTdsp }) => {
    // ACT
    const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode, validatePlansAvailable: true })
    });
    
    const data = await response.json();
    
    // ASSERT
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cityName).toBe(expectedCity);
    expect(data.redirectUrl).toBe(expectedUrl);
    expect(data.tdspTerritory).toBe(expectedTdsp);
    expect(data.planCount).toBeGreaterThan(0);
  });
  
  test('should verify city slug format consistency', async () => {
    for (const { zipCode, expectedCity } of testCases) {
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.citySlug).toMatch(/^[a-z0-9-]+-tx$/);
      expect(data.citySlug).toEndWith('-tx');
    }
  });
});