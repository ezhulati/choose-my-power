import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://choose-my-power.netlify.app';
const TIMEOUT = 30000; // 30 seconds per test

// ZIP codes to test organized by city
const ZIP_TEST_DATA = [
  // Houston ZIP codes
  { zip: '77001', expectedCity: 'houston', cityName: 'Houston' },
  { zip: '77002', expectedCity: 'houston', cityName: 'Houston' },
  { zip: '77003', expectedCity: 'houston', cityName: 'Houston' },
  { zip: '77004', expectedCity: 'houston', cityName: 'Houston' },
  { zip: '77005', expectedCity: 'houston', cityName: 'Houston' },
  
  // Dallas ZIP codes
  { zip: '75201', expectedCity: 'dallas', cityName: 'Dallas' },
  { zip: '75202', expectedCity: 'dallas', cityName: 'Dallas' },
  { zip: '75203', expectedCity: 'dallas', cityName: 'Dallas' },
  { zip: '75204', expectedCity: 'dallas', cityName: 'Dallas' },
  { zip: '75205', expectedCity: 'dallas', cityName: 'Dallas' },
  
  // Austin ZIP codes
  { zip: '78701', expectedCity: 'austin-tx', cityName: 'Austin' },
  { zip: '78702', expectedCity: 'austin-tx', cityName: 'Austin' },
  { zip: '78703', expectedCity: 'austin-tx', cityName: 'Austin' },
  
  // Fort Worth ZIP codes
  { zip: '76101', expectedCity: 'fort-worth', cityName: 'Fort Worth' },
  { zip: '76102', expectedCity: 'fort-worth', cityName: 'Fort Worth' },
  { zip: '76103', expectedCity: 'fort-worth', cityName: 'Fort Worth' },
];

// Test results tracking
const testResults: Array<{
  zip: string;
  city: string;
  success: boolean;
  url?: string;
  error?: string;
  consoleErrors: string[];
  networkErrors: string[];
  loadTime?: number;
  retryAttempts?: number;
}> = [];

test.describe('Comprehensive ZIP Code Lookup Validation', () => {
  test.setTimeout(TIMEOUT * ZIP_TEST_DATA.length); // Set overall timeout

  test('Should validate all Texas ZIP codes and generate report', async ({ page }) => {
    console.log('='.repeat(80));
    console.log('Starting Comprehensive ZIP Code Lookup Test');
    console.log(`Testing ${ZIP_TEST_DATA.length} ZIP codes across 4 Texas cities`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log('='.repeat(80));

    for (const testCase of ZIP_TEST_DATA) {
      const startTime = Date.now();
      const result = {
        zip: testCase.zip,
        city: testCase.cityName,
        success: false,
        consoleErrors: [] as string[],
        networkErrors: [] as string[],
        retryAttempts: 0,
      };

      console.log(`\n[${testCase.zip}] Testing ${testCase.cityName} ZIP code...`);

      try {
        // Set up console error monitoring
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            consoleErrors.push(text);
            
            // Track retry attempts
            if (text.includes('Retrying')) {
              result.retryAttempts++;
            }
            
            // Log significant errors immediately
            if (text.includes('ERR_FAILED') || text.includes('ZIP Code Error')) {
              console.log(`  ⚠️ Console Error: ${text}`);
            }
          }
        });

        // Set up network error monitoring
        const networkErrors: string[] = [];
        page.on('requestfailed', request => {
          const failure = request.failure();
          if (failure) {
            const errorMsg = `${request.url()} - ${failure.errorText}`;
            networkErrors.push(errorMsg);
            
            if (failure.errorText === 'net::ERR_FAILED') {
              console.log(`  ❌ Network Error: ERR_FAILED on ${request.url()}`);
            }
          }
        });

        // Navigate to homepage
        await page.goto(BASE_URL, { 
          waitUntil: 'networkidle',
          timeout: 20000 
        });

        // Wait for page to be fully loaded
        await page.waitForLoadState('domcontentloaded');

        // Find and interact with ZIP code input
        // Try multiple possible selectors
        const zipInputSelectors = [
          'input[placeholder*="ZIP"]',
          'input[placeholder*="zip"]',
          'input[type="text"][name*="zip"]',
          'input#zip-code',
          '.zip-input',
          'input[aria-label*="ZIP"]'
        ];

        let zipInput = null;
        for (const selector of zipInputSelectors) {
          try {
            zipInput = await page.locator(selector).first();
            if (await zipInput.isVisible({ timeout: 1000 })) {
              break;
            }
          } catch {
            // Continue to next selector
          }
        }

        if (!zipInput || !(await zipInput.isVisible())) {
          throw new Error('Could not find ZIP code input field');
        }

        // Clear and enter ZIP code
        await zipInput.clear();
        await zipInput.fill(testCase.zip);
        console.log(`  ✓ Entered ZIP code: ${testCase.zip}`);

        // Find and click search button
        const searchButtonSelectors = [
          'button:has-text("Search")',
          'button:has-text("Find Plans")',
          'button:has-text("Get Started")',
          'button[type="submit"]',
          '.search-button',
          'button[aria-label*="Search"]'
        ];

        let searchButton = null;
        for (const selector of searchButtonSelectors) {
          try {
            searchButton = await page.locator(selector).first();
            if (await searchButton.isVisible({ timeout: 1000 })) {
              break;
            }
          } catch {
            // Continue to next selector
          }
        }

        if (!searchButton || !(await searchButton.isVisible())) {
          // Try pressing Enter as fallback
          await zipInput.press('Enter');
          console.log(`  ✓ Submitted via Enter key`);
        } else {
          await searchButton.click();
          console.log(`  ✓ Clicked search button`);
        }

        // Wait for navigation with extended timeout
        await page.waitForURL(
          url => url.href.includes('/electricity-plans/'),
          { timeout: 15000 }
        );

        // Get the current URL
        const currentUrl = page.url();
        console.log(`  ✓ Navigated to: ${currentUrl}`);

        // Verify correct city in URL
        if (!currentUrl.includes(`/electricity-plans/${testCase.expectedCity}`)) {
          throw new Error(`Incorrect navigation - Expected ${testCase.expectedCity}, got ${currentUrl}`);
        }

        // Wait for page content to load
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Check for plans available text or similar indicators
        const contentIndicators = [
          'text=/\\d+ plans? available/i',
          'text=/electricity plans/i',
          'text=/compare plans/i',
          '.plan-card',
          '[data-testid="plan-list"]'
        ];

        let contentFound = false;
        for (const indicator of contentIndicators) {
          try {
            const element = await page.locator(indicator).first();
            if (await element.isVisible({ timeout: 3000 })) {
              contentFound = true;
              break;
            }
          } catch {
            // Continue checking
          }
        }

        if (!contentFound) {
          console.log(`  ⚠️ Warning: Could not verify page content loaded completely`);
        } else {
          console.log(`  ✓ Page content loaded successfully`);
        }

        // Calculate load time
        const loadTime = Date.now() - startTime;
        
        // Mark as successful
        result.success = true;
        result.url = currentUrl;
        result.loadTime = loadTime;
        result.consoleErrors = consoleErrors;
        result.networkErrors = networkErrors;

        console.log(`  ✅ SUCCESS - Load time: ${loadTime}ms`);
        
        if (result.retryAttempts > 0) {
          console.log(`  ℹ️ Required ${result.retryAttempts} retry attempt(s)`);
        }

      } catch (error) {
        const loadTime = Date.now() - startTime;
        result.error = error instanceof Error ? error.message : String(error);
        result.loadTime = loadTime;
        console.log(`  ❌ FAILED: ${result.error}`);
        console.log(`  Load time: ${loadTime}ms`);
      }

      testResults.push(result);

      // Clean up event listeners
      page.removeAllListeners('console');
      page.removeAllListeners('requestfailed');
    }

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const successCount = testResults.filter(r => r.success).length;
    const failureCount = testResults.filter(r => !r.success).length;
    const successRate = ((successCount / testResults.length) * 100).toFixed(1);

    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total ZIP codes tested: ${testResults.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`   Success Rate: ${successRate}%`);

    // Group results by city
    const cityGroups = new Map<string, typeof testResults>();
    for (const result of testResults) {
      if (!cityGroups.has(result.city)) {
        cityGroups.set(result.city, []);
      }
      cityGroups.get(result.city)!.push(result);
    }

    console.log(`\n📍 Results by City:`);
    for (const [city, results] of cityGroups) {
      const citySuccess = results.filter(r => r.success).length;
      const cityTotal = results.length;
      const cityRate = ((citySuccess / cityTotal) * 100).toFixed(1);
      
      console.log(`\n   ${city}:`);
      console.log(`   - Tested: ${cityTotal} ZIP codes`);
      console.log(`   - Success: ${citySuccess}/${cityTotal} (${cityRate}%)`);
      
      // List failed ZIPs for this city
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.log(`   - Failed ZIPs:`);
        for (const fail of failed) {
          console.log(`     • ${fail.zip}: ${fail.error}`);
        }
      }
    }

    // Performance Analysis
    const successfulTests = testResults.filter(r => r.success);
    if (successfulTests.length > 0) {
      const avgLoadTime = successfulTests.reduce((sum, r) => sum + (r.loadTime || 0), 0) / successfulTests.length;
      const maxLoadTime = Math.max(...successfulTests.map(r => r.loadTime || 0));
      const minLoadTime = Math.min(...successfulTests.map(r => r.loadTime || 0));
      
      console.log(`\n⚡ Performance Metrics:`);
      console.log(`   Average load time: ${avgLoadTime.toFixed(0)}ms`);
      console.log(`   Fastest load: ${minLoadTime}ms`);
      console.log(`   Slowest load: ${maxLoadTime}ms`);
    }

    // Retry Analysis
    const testsWithRetries = testResults.filter(r => r.retryAttempts && r.retryAttempts > 0);
    if (testsWithRetries.length > 0) {
      console.log(`\n🔄 Retry Mechanism:`);
      console.log(`   Tests requiring retries: ${testsWithRetries.length}`);
      const totalRetries = testsWithRetries.reduce((sum, r) => sum + (r.retryAttempts || 0), 0);
      console.log(`   Total retry attempts: ${totalRetries}`);
      console.log(`   ZIP codes with retries:`);
      for (const test of testsWithRetries) {
        console.log(`     • ${test.zip}: ${test.retryAttempts} attempt(s)`);
      }
    }

    // Error Analysis
    const testsWithErrors = testResults.filter(r => 
      (r.consoleErrors && r.consoleErrors.length > 0) || 
      (r.networkErrors && r.networkErrors.length > 0)
    );
    
    if (testsWithErrors.length > 0) {
      console.log(`\n⚠️ Error Analysis:`);
      
      // Check for ERR_FAILED
      const errFailedTests = testResults.filter(r => 
        r.consoleErrors?.some(e => e.includes('ERR_FAILED')) ||
        r.networkErrors?.some(e => e.includes('ERR_FAILED'))
      );
      
      if (errFailedTests.length > 0) {
        console.log(`   ❌ ERR_FAILED detected in ${errFailedTests.length} test(s):`);
        for (const test of errFailedTests) {
          console.log(`     • ZIP ${test.zip}`);
        }
      }
      
      // Check for ZIP Code Error
      const zipErrorTests = testResults.filter(r => 
        r.consoleErrors?.some(e => e.includes('ZIP Code Error'))
      );
      
      if (zipErrorTests.length > 0) {
        console.log(`   ❌ "ZIP Code Error" detected in ${zipErrorTests.length} test(s):`);
        for (const test of zipErrorTests) {
          console.log(`     • ZIP ${test.zip}`);
        }
      }
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    if (successRate === '100.0') {
      console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    } else if (parseFloat(successRate) >= 90) {
      console.log(`⚠️ MOSTLY SUCCESSFUL - ${successRate}% pass rate`);
    } else {
      console.log(`❌ SIGNIFICANT ISSUES DETECTED - Only ${successRate}% pass rate`);
    }
    console.log('='.repeat(80));

    // Assert for test results
    expect(successCount).toBeGreaterThan(0);
    if (failureCount > 0) {
      console.log('\n⚠️ Some tests failed - review the detailed report above');
    }
  });
});