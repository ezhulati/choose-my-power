/**
 * Integration Test: Full Page Rendering Validation
 * Tests Scenario 5 from quickstart.md
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD) 
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

describe('Integration Test: Full Page Rendering Validation', () => {
  
  test('should ensure no partial loading states visible', async () => {
    // ARRANGE
    const zipCode = '75201';
    
    // ACT - Complete navigation flow
    const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode, validatePlansAvailable: true })
    });
    
    const navData = await navResponse.json();
    expect(navResponse.status).toBe(200);
    expect(navData.success).toBe(true);
    
    const plansResponse = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
    const plansContent = await plansResponse.text();
    
    // ASSERT - No loading indicators visible
    const loadingIndicators = [
      'Loading...', 'Spinner', 'Please wait', 'loading', 
      'Loading plans', 'Fetching data', 'skeleton', 'shimmer'
    ];
    
    loadingIndicators.forEach(indicator => {
      expect(plansContent.toLowerCase()).not.toContain(indicator.toLowerCase());
    });
    
    // ASSERT - Complete content present
    expect(plansResponse.status).toBe(200);
    expect(plansContent.length).toBeGreaterThan(1000);
  });
  
  test('should provide direct navigation without intermediate pages', async () => {
    const zipCode = '75201';
    
    const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode })
    });
    
    const navData = await navResponse.json();
    
    expect(navResponse.status).toBe(200);
    expect(navData.success).toBe(true);
    expect(navData.redirectUrl).not.toContain('/texas/'); // No old wrong patterns
    expect(navData.redirectUrl).not.toContain('/loading/'); // No intermediate pages
    
    // Verify direct access works
    const directAccess = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
    expect(directAccess.status).toBe(200);
    expect(directAccess.redirected).toBe(false);
  });
  
  test('should validate layout stability and content completion', async () => {
    const zipCode = '77001'; // Houston
    
    const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode, validatePlansAvailable: true })
    });
    
    const navData = await navResponse.json();
    const plansResponse = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
    const content = await plansResponse.text();
    
    // ASSERT - No error states
    expect(content).not.toContain('Error loading');
    expect(content).not.toContain('Failed to load');
    expect(content).not.toContain('Try again');
    
    // ASSERT - Real content indicators
    expect(content).toContain('kWh');
    expect(content).toContain('Houston');
    expect(content).toContain('Centerpoint');
  });
});