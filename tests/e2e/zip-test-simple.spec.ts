import { test, expect } from '@playwright/test';

const ZIP_CODES = [
  { zip: '77001', city: 'Houston', expectedUrl: '/electricity-plans/houston' },
  { zip: '75201', city: 'Dallas', expectedUrl: '/electricity-plans/dallas' },
  { zip: '78701', city: 'Austin', expectedUrl: '/electricity-plans/austin-tx' },
  { zip: '76101', city: 'Fort Worth', expectedUrl: '/electricity-plans/fort-worth' },
];

test.describe('ZIP Code Lookup - Simple Test', () => {
  for (const testCase of ZIP_CODES) {
    test(`${testCase.zip} - ${testCase.city}`, async ({ page }) => {
      // Set a reasonable timeout
      test.setTimeout(30000);
      
      // Track errors
      const errors: string[] = [];
      let errFailedCount = 0;
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          errors.push(text);
          if (text.includes('ERR_FAILED')) {
            errFailedCount++;
          }
        }
      });
      
      page.on('requestfailed', request => {
        const failure = request.failure();
        if (failure?.errorText === 'net::ERR_FAILED') {
          errFailedCount++;
        }
      });
      
      try {
        // Navigate to homepage
        await page.goto('https://choose-my-power.netlify.app', { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        // Find ZIP input
        const zipInput = await page.locator('input[placeholder*="ZIP" i], input[placeholder*="zip" i]').first();
        await expect(zipInput).toBeVisible({ timeout: 5000 });
        
        // Enter ZIP code
        await zipInput.clear();
        await zipInput.fill(testCase.zip);
        
        // Submit (try button first, then Enter)
        const searchButton = await page.locator('button:has-text("Search"), button:has-text("Find Plans"), button[type="submit"]').first();
        if (await searchButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await searchButton.click();
        } else {
          await zipInput.press('Enter');
        }
        
        // Wait for navigation
        await page.waitForURL(
          url => url.href.includes(testCase.expectedUrl),
          { timeout: 10000 }
        );
        
        // Verify we're on the right page
        const currentUrl = page.url();
        expect(currentUrl).toContain(testCase.expectedUrl);
        
        // Wait for content
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        
        // Check for plan content
        const hasPlans = await page.locator('text=/\\d+ plans? available/i, .plan-card').first().isVisible({ timeout: 3000 }).catch(() => false);
        
        // Report results
        console.log(`✅ ${testCase.zip} (${testCase.city}): SUCCESS`);
        console.log(`   URL: ${currentUrl}`);
        console.log(`   ERR_FAILED count: ${errFailedCount}`);
        console.log(`   Plans visible: ${hasPlans}`);
        
      } catch (error) {
        console.log(`❌ ${testCase.zip} (${testCase.city}): FAILED`);
        console.log(`   Error: ${error}`);
        console.log(`   ERR_FAILED count: ${errFailedCount}`);
        throw error;
      }
    });
  }
});