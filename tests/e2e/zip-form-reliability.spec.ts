import { test, expect } from '@playwright/test';

test.describe('ZIP Form Reliability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the ZIP lookup script to load and initialize
    await page.waitForFunction(() => {
      return window.console && 
             document.getElementById('zipForm') && 
             document.getElementById('zipInput');
    });
  });

  test('should navigate successfully on button click', async ({ page }) => {
    // Type ZIP code
    await page.fill('#zipInput', '75205');
    
    // Click the Find Plans button
    const button = page.locator('button[type="submit"]');
    await button.click();
    
    // Wait for navigation to complete
    await page.waitForURL(/\/texas\/dallas/, { timeout: 10000 });
    
    // Verify we're on the Dallas plans page
    expect(page.url()).toMatch(/\/texas\/dallas/);
    
    // Verify the page loaded properly
    await expect(page).toHaveTitle(/Dallas/i);
  });

  test('should navigate successfully on Enter key', async ({ page }) => {
    // Type ZIP code
    await page.fill('#zipInput', '75205');
    
    // Press Enter in the input field
    await page.press('#zipInput', 'Enter');
    
    // Wait for navigation to complete
    await page.waitForURL(/\/texas\/dallas/, { timeout: 10000 });
    
    // Verify we're on the Dallas plans page
    expect(page.url()).toMatch(/\/texas\/dallas/);
    
    // Verify the page loaded properly
    await expect(page).toHaveTitle(/Dallas/i);
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/zip-lookup**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    // Type ZIP code and submit
    await page.fill('#zipInput', '75205');
    await page.click('button[type="submit"]');
    
    // Should show error message instead of navigating
    await expect(page.locator('.zip-error-message')).toBeVisible({ timeout: 5000 });
    
    // Should not navigate away from homepage
    expect(page.url()).toContain('/');
  });

  test('should prevent duplicate submissions', async ({ page }) => {
    let apiCallCount = 0;
    
    // Track API calls
    await page.route('**/api/zip-lookup**', route => {
      apiCallCount++;
      route.continue();
    });

    // Fill ZIP code
    await page.fill('#zipInput', '75205');
    
    // Click button multiple times rapidly
    const button = page.locator('button[type="submit"]');
    await Promise.all([
      button.click(),
      button.click(),
      button.click()
    ]);
    
    // Wait a bit for any delayed requests
    await page.waitForTimeout(1000);
    
    // Should only make one API call despite multiple clicks
    expect(apiCallCount).toBe(1);
  });

  test('should auto-submit after 5 digits and brief delay', async ({ page }) => {
    // Type 5 digits
    await page.fill('#zipInput', '75205');
    
    // Wait for auto-submit timeout (500ms)
    await page.waitForURL(/\/texas\/dallas/, { timeout: 15000 });
    
    // Verify navigation occurred
    expect(page.url()).toMatch(/\/texas\/dallas/);
  });

  test('should show loading state during submission', async ({ page }) => {
    // Slow down the API response to test loading state
    await page.route('**/api/zip-lookup**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    // Fill and submit
    await page.fill('#zipInput', '75205');
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toContainText('Looking up');
    
    // Should show loading spinner
    await expect(page.locator('button[type="submit"] svg.animate-spin')).toBeVisible();
  });

  test('should clear errors when user starts typing again', async ({ page }) => {
    // Create an error first
    await page.fill('#zipInput', '123'); // Invalid ZIP
    await page.click('button[type="submit"]');
    
    // Wait for error to appear
    await expect(page.locator('.zip-error-message')).toBeVisible();
    
    // Start typing again
    await page.fill('#zipInput', '75205');
    
    // Error should disappear
    await expect(page.locator('.zip-error-message')).not.toBeVisible();
  });

  test('should validate ZIP code format', async ({ page }) => {
    // Test invalid ZIP codes
    const invalidZips = ['123', '12345a', 'abcde', ''];
    
    for (const zip of invalidZips) {
      await page.fill('#zipInput', zip);
      await page.click('button[type="submit"]');
      
      if (zip === '') {
        await expect(page.locator('.zip-error-message')).toContainText('Please enter your ZIP code');
      } else {
        await expect(page.locator('.zip-error-message')).toContainText('valid 5-digit ZIP code');
      }
      
      // Clear the error for next test
      await page.fill('#zipInput', '');
    }
  });

  test('should handle municipal utility areas', async ({ page }) => {
    // Mock API response for municipal utility
    await page.route('**/api/zip-lookup**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          errorType: 'non_deregulated',
          error: 'This area is served by a municipal utility.',
          municipalUtility: true
        })
      });
    });

    await page.fill('#zipInput', '78701'); // Austin ZIP
    await page.click('button[type="submit"]');
    
    // Should show municipal utility message with different styling
    await expect(page.locator('.zip-error-message')).toHaveClass(/bg-yellow-50/);
    await expect(page.locator('.zip-error-message')).toContainText('Municipal Utility Area');
  });
});