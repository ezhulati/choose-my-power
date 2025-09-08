/**
 * E2E Test: Complete ZIP Navigation Flow (Quickstart Scenarios)
 * Tests T011 from tasks.md  
 * IMPORTANT: This test MUST FAIL initially (RED phase of TDD)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4324';

test.describe('E2E: Complete ZIP Navigation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage where ZIP forms should be available
    await page.goto(BASE_URL);
  });

  test('should complete full ZIP entry to plans page user journey', async ({ page }) => {
    // STEP 1: Find ZIP code input form on homepage
    const zipInput = page.locator('[data-testid="zip-input"]').first();
    const zipButton = page.locator('[data-testid="zip-submit"]').first();
    
    // STEP 2: Enter valid Dallas ZIP code
    await zipInput.fill('75201');
    
    // STEP 3: Wait for button to become active (client-side validation)
    await expect(zipButton).toBeEnabled({ timeout: 2000 });
    
    // STEP 4: Click search button
    await zipButton.click();
    
    // STEP 5: Should navigate directly to correct plans page (no intermediate pages)
    await page.waitForURL('**/electricity-plans/dallas-tx/**', { timeout: 10000 });
    
    // STEP 6: Verify correct URL format
    const currentUrl = page.url();
    expect(currentUrl).toContain('/electricity-plans/dallas-tx/');
    expect(currentUrl).not.toContain('/texas/'); // No legacy wrong pattern
    
    // STEP 7: Verify page loads completely without loading states
    await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Please wait')).not.toBeVisible();
    
    // STEP 8: Verify real plan content is displayed
    await expect(page.locator('text=Dallas')).toBeVisible();
    await expect(page.locator('text=kWh')).toBeVisible();
    await expect(page.locator('text=Oncor')).toBeVisible(); // Dallas TDSP
    
    // STEP 9: Verify no error states visible
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=Failed to load')).not.toBeVisible();
  });

  test('should handle invalid ZIP codes with proper error feedback', async ({ page }) => {
    // STEP 1: Find ZIP input form
    const zipInput = page.locator('[data-testid="zip-input"]').first();
    const zipButton = page.locator('[data-testid="zip-submit"]').first();
    
    // STEP 2: Test invalid formats
    const invalidZips = ['1234', '123456', 'abcde', '12345']; // Last one is non-Texas
    
    for (const invalidZip of invalidZips) {
      await zipInput.fill(invalidZip);
      
      if (invalidZip.length !== 5) {
        // Client-side validation should disable button
        await expect(zipButton).toBeDisabled({ timeout: 1000 });
      } else {
        // 5-digit invalid ZIP - button enabled but should show error after click
        await expect(zipButton).toBeEnabled();
        await zipButton.click();
        
        // Should show error message, not navigate
        await expect(page.locator('[data-testid="zip-error"]')).toBeVisible({ timeout: 5000 });
        await expect(page.url()).toBe(BASE_URL + '/'); // Should stay on homepage
      }
      
      // Clear for next test
      await zipInput.clear();
    }
  });

  test('should handle multi-city ZIP validation correctly', async ({ page }) => {
    const testCases = [
      { zipCode: '75201', expectedCity: 'Dallas', expectedTdsp: 'Oncor' },
      { zipCode: '77001', expectedCity: 'Houston', expectedTdsp: 'Centerpoint' },
      { zipCode: '78701', expectedCity: 'Austin', expectedTdsp: 'Austin Energy' },
    ];
    
    for (const { zipCode, expectedCity, expectedTdsp } of testCases) {
      // Navigate back to homepage for each test
      await page.goto(BASE_URL);
      
      const zipInput = page.locator('[data-testid="zip-input"]').first();
      const zipButton = page.locator('[data-testid="zip-submit"]').first();
      
      // Enter ZIP code
      await zipInput.fill(zipCode);
      await expect(zipButton).toBeEnabled();
      await zipButton.click();
      
      // Should navigate to correct city page
      const expectedSlug = expectedCity.toLowerCase().replace(' ', '-');
      await page.waitForURL(`**/electricity-plans/${expectedSlug}-tx/**`, { timeout: 10000 });
      
      // Verify city-specific content
      await expect(page.locator(`text=${expectedCity}`)).toBeVisible();
      await expect(page.locator(`text=${expectedTdsp}`)).toBeVisible();
      
      // Verify no loading states
      await expect(page.locator('text=Loading')).not.toBeVisible();
    }
  });

  test('should meet performance requirements for ZIP navigation', async ({ page }) => {
    const zipInput = page.locator('[data-testid="zip-input"]').first();
    const zipButton = page.locator('[data-testid="zip-submit"]').first();
    
    // Enter ZIP code
    await zipInput.fill('75201');
    
    // Measure navigation time
    const startTime = Date.now();
    await zipButton.click();
    
    // Wait for navigation to complete
    await page.waitForURL('**/electricity-plans/dallas-tx/**', { timeout: 10000 });
    await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 5000 });
    
    const totalTime = Date.now() - startTime;
    
    // Should meet <500ms total navigation requirement
    expect(totalTime).toBeLessThan(500);
    
    // Verify content is fully loaded
    await expect(page.locator('text=Dallas')).toBeVisible();
    await expect(page.locator('text=kWh')).toBeVisible();
  });

  test('should handle regulated market ZIP codes appropriately', async ({ page }) => {
    const zipInput = page.locator('[data-testid="zip-input"]').first();
    const zipButton = page.locator('[data-testid="zip-submit"]').first();
    
    // Test El Paso (regulated market)
    await zipInput.fill('79901');
    await expect(zipButton).toBeEnabled();
    await zipButton.click();
    
    // Should show error message about regulated market
    await expect(page.locator('[data-testid="zip-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=regulated')).toBeVisible();
    await expect(page.url()).toBe(BASE_URL + '/'); // Should not navigate
  });

  test('should provide consistent UX across different ZIP form locations', async ({ page }) => {
    // Test homepage ZIP form
    await page.goto(BASE_URL);
    let zipInput = page.locator('[data-testid="zip-input"]').first();
    let zipButton = page.locator('[data-testid="zip-submit"]').first();
    
    await zipInput.fill('75201');
    await expect(zipButton).toBeEnabled();
    await zipButton.click();
    await page.waitForURL('**/electricity-plans/dallas-tx/**');
    
    // Test city page ZIP form (if exists)
    await page.goto(BASE_URL + '/texas/houston/');
    if (await page.locator('[data-testid="zip-input"]').first().isVisible()) {
      zipInput = page.locator('[data-testid="zip-input"]').first();
      zipButton = page.locator('[data-testid="zip-submit"]').first();
      
      await zipInput.fill('77001');
      await expect(zipButton).toBeEnabled();
      await zipButton.click();
      await page.waitForURL('**/electricity-plans/houston-tx/**');
    }
  });
});