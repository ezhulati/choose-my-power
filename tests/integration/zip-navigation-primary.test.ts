/**
 * Integration Test: Primary ZIP Navigation User Story
 * 
 * Tests Scenario 1 from quickstart.md:
 * "A potential electricity customer enters their ZIP code and is immediately taken 
 * to a comprehensive list of real electricity plans for their city."
 * 
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 */

import { describe, test, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:4324';

describe('Integration Test: Primary ZIP Navigation Flow', () => {
  
  describe('Scenario 1: Successful ZIP Code Navigation (Primary User Story)', () => {
    
    test('should complete full ZIP entry → plans page navigation flow', async () => {
      // STEP 1: Enter valid Texas ZIP code (75201 for Dallas)
      const zipCode = '75201';
      
      // STEP 2: Call navigation API (simulating button click)
      const navigationResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, validatePlansAvailable: true })
      });
      
      const navigationData = await navigationResponse.json();
      
      // STEP 3: Verify direct redirect to /electricity-plans/dallas-tx/
      expect(navigationResponse.status).toBe(200);
      expect(navigationData.success).toBe(true);
      expect(navigationData.redirectUrl).toBe('/electricity-plans/dallas-tx/');
      expect(navigationData.cityName).toBe('Dallas');
      expect(navigationData.citySlug).toBe('dallas-tx');
      
      // STEP 4: Verify redirect URL is accessible (no 404 errors)
      const plansPageResponse = await fetch(`${API_BASE_URL}${navigationData.redirectUrl}`);
      expect(plansPageResponse.status).toBe(200);
      
      // STEP 5: Verify page loads fully with real plan data
      const plansPageContent = await plansPageResponse.text();
      expect(plansPageContent).toContain('Dallas'); // City name in content
      expect(plansPageContent).toContain('kWh'); // Electricity plan content
      expect(plansPageContent).not.toContain('Loading'); // No loading states visible
      expect(plansPageContent).not.toContain('Error'); // No error states visible
      
      // STEP 6: Validate no intermediate pages or loading states
      expect(plansPageResponse.url).toContain('/electricity-plans/dallas-tx');
      expect(plansPageResponse.redirected).toBe(false); // Direct access, no redirects
    });
    
    test('should validate button becomes active after ZIP entry', async () => {
      // This test would typically use a browser automation tool
      // For now, we'll test the API behavior that would drive button state
      
      const testCases = [
        { zipCode: '', expectedActive: false },
        { zipCode: '1234', expectedActive: false }, // Too short
        { zipCode: '12345', expectedActive: true }, // 5 digits, will validate server-side
        { zipCode: '75201', expectedActive: true }, // Valid Texas ZIP
      ];
      
      for (const { zipCode, expectedActive } of testCases) {
        if (zipCode.length === 5) {
          // Test server-side validation for 5-digit codes
          const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode })
          });
          
          if (expectedActive) {
            expect([200, 400]).toContain(response.status); // Either valid or validation error
          }
        }
        // Client-side validation would handle length < 5
      }
    });
    
    test('should display real electricity plans with current rates', async () => {
      // ARRANGE
      const zipCode = '75201';
      
      // ACT - Get navigation URL
      const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, validatePlansAvailable: true })
      });
      
      const navData = await navResponse.json();
      expect(navResponse.status).toBe(200);
      expect(navData.success).toBe(true);
      
      // ACT - Check plans page content
      const plansResponse = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
      expect(plansResponse.status).toBe(200);
      
      const plansContent = await plansResponse.text();
      
      // ASSERT - Real plan data validation
      expect(plansContent).toContain('¢/kWh'); // Rate display format
      expect(plansContent).toContain('month'); // Contract terms
      expect(plansContent).not.toContain('mock'); // No mock data
      expect(plansContent).not.toContain('placeholder'); // No placeholder data
      expect(plansContent).not.toContain('sample'); // No sample data
      
      // Verify TDSP territory accuracy
      expect(plansContent).toContain('Oncor'); // Dallas TDSP
    });
    
    test('should match correct TDSP territory for ZIP code', async () => {
      const testCases = [
        { zipCode: '75201', expectedCity: 'Dallas', expectedTdsp: 'Oncor' },
        { zipCode: '77001', expectedCity: 'Houston', expectedTdsp: 'Centerpoint' },
      ];
      
      for (const { zipCode, expectedCity, expectedTdsp } of testCases) {
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
        expect(data.tdspTerritory).toBe(expectedTdsp);
        expect(data.planCount).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Performance Targets Validation', () => {
    
    test('should meet ZIP validation performance target (<200ms)', async () => {
      // ARRANGE
      const zipCode = '75201';
      
      // ACT
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, validatePlansAvailable: true })
      });
      const endTime = Date.now();
      
      const data = await response.json();
      const totalTime = endTime - startTime;
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.validationTime).toBeLessThan(200); // API-reported validation time
      expect(totalTime).toBeLessThan(500); // Total navigation time
    });
    
    test('should meet total navigation performance target (<500ms)', async () => {
      // ARRANGE
      const zipCode = '75201';
      
      // ACT - Measure complete flow time
      const startTime = Date.now();
      
      // Step 1: ZIP validation
      const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, validatePlansAvailable: true })
      });
      const navData = await navResponse.json();
      
      // Step 2: Plans page access
      const plansResponse = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
      
      const endTime = Date.now();
      const totalNavigationTime = endTime - startTime;
      
      // ASSERT
      expect(navResponse.status).toBe(200);
      expect(plansResponse.status).toBe(200);
      expect(totalNavigationTime).toBeLessThan(500); // <500ms total flow requirement
    });
  });
  
  describe('URL Format Validation', () => {
    
    test('should generate correct URL format /electricity-plans/{city-slug}-tx/', async () => {
      const testCases = [
        { zipCode: '75201', expectedUrl: '/electricity-plans/dallas-tx/' },
        { zipCode: '77001', expectedUrl: '/electricity-plans/houston-tx/' },
        { zipCode: '78701', expectedUrl: '/electricity-plans/austin-tx/' },
        { zipCode: '76101', expectedUrl: '/electricity-plans/fort-worth-tx/' },
      ];
      
      for (const { zipCode, expectedUrl } of testCases) {
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
        expect(data.redirectUrl).toBe(expectedUrl);
        expect(data.redirectUrl).toMatch(/^\/electricity-plans\/[a-z0-9-]+-tx\/$/);
      }
    });
    
    test('should ensure city slug includes -tx suffix', async () => {
      // ARRANGE
      const zipCode = '75201';
      
      // ACT
      const response = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      const data = await response.json();
      
      // ASSERT
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.citySlug).toMatch(/^[a-z0-9-]+-tx$/);
      expect(data.citySlug).toEndWith('-tx');
    });
  });
  
  describe('Full Page Rendering Validation', () => {
    
    test('should ensure complete rendering without partial loading states', async () => {
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
      
      // ASSERT - No loading states visible
      expect(plansContent).not.toContain('Loading...'); 
      expect(plansContent).not.toContain('Spinner');
      expect(plansContent).not.toContain('Please wait');
      expect(plansContent).not.toContain('loading');
      expect(plansContent).not.toContain('Loading plans');
      expect(plansContent).not.toContain('Fetching data');
      
      // ASSERT - No error states visible
      expect(plansContent).not.toContain('Error loading plans');
      expect(plansContent).not.toContain('Failed to load');
      expect(plansContent).not.toContain('Try again');
      
      // ASSERT - Complete content present
      expect(plansResponse.status).toBe(200);
      expect(plansContent.length).toBeGreaterThan(1000); // Reasonable content size
    });
    
    test('should provide no intermediate pages during navigation', async () => {
      // This test validates that navigation is direct without stops
      
      // ARRANGE
      const zipCode = '75201';
      
      // ACT - Get navigation URL
      const navResponse = await fetch(`${API_BASE_URL}/api/zip/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, validatePlansAvailable: true })
      });
      
      const navData = await navResponse.json();
      
      // ASSERT - Direct URL provided (no intermediate processing pages)
      expect(navResponse.status).toBe(200);
      expect(navData.success).toBe(true);
      expect(navData.redirectUrl).not.toContain('/texas/'); // Old wrong pattern
      expect(navData.redirectUrl).not.toContain('/loading/'); // No loading pages
      expect(navData.redirectUrl).not.toContain('/processing/'); // No processing pages
      expect(navData.redirectUrl).toMatch(/^\/electricity-plans\/[a-z0-9-]+-tx\/$/);
      
      // ACT - Verify direct access works
      const directAccess = await fetch(`${API_BASE_URL}${navData.redirectUrl}`);
      
      // ASSERT - Direct access succeeds (no redirects needed)
      expect(directAccess.status).toBe(200);
      expect(directAccess.redirected).toBe(false); // No server-side redirects
    });
  });
});

/**
 * NOTE: This test is designed to FAIL initially (RED phase of TDD)
 * Tests cover the complete user story flow from ZIP entry to plans display
 * Implementation should be created to make these tests pass (GREEN phase)
 */