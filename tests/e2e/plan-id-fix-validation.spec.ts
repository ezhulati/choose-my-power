/**
 * Plan ID Fix Validation Test Suite
 * 
 * This test validates the updated plan ID handling system that was implemented to fix
 * the Order Plan functionality. It tests both scenarios:
 * 
 * 1. Valid Plan Scenario: Uses a real plan that exists in the database
 * 2. Fallback Scenario: Uses a fake/non-existent plan to test fallback logic
 * 
 * The test specifically looks for:
 * - apiPlanIdAvailable: true/false in console logs
 * - usingFallback: true/false in console logs  
 * - The actual planId being used in the final order URL
 * 
 * Created: September 5, 2025
 */

import { test, expect, type Page } from '@playwright/test';
import { join } from 'path';

const ARTIFACTS_DIR = join(process.cwd(), 'artifacts', `${new Date().toISOString().replace(/[:.]/g, '-')}_plan_id_testing`);

interface ConsoleLogCapture {
  type: string;
  text: string;
  timestamp: string;
}

interface PlanIdTestResults {
  scenario: string;
  url: string;
  planFound: boolean;
  apiPlanIdAvailable: boolean | null;
  usingFallback: boolean | null;
  finalPlanId: string | null;
  orderUrl: string | null;
  consoleLogs: ConsoleLogCapture[];
  screenshots: {
    initial: string;
    afterAddress: string;
    beforeOrder: string;
  };
}

class PlanIdTester {
  private page: Page;
  private consoleLogs: ConsoleLogCapture[] = [];
  
  constructor(page: Page) {
    this.page = page;
    this.setupConsoleCapture();
  }

  private setupConsoleCapture() {
    this.page.on('console', (msg) => {
      const logEntry: ConsoleLogCapture = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      this.consoleLogs.push(logEntry);
      
      // Log important plan ID related messages
      if (msg.text().includes('apiPlanIdAvailable') || 
          msg.text().includes('usingFallback') ||
          msg.text().includes('planId') ||
          msg.text().includes('Order This Plan')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
  }

  async testPlanScenario(scenario: string, planUrl: string): Promise<PlanIdTestResults> {
    console.log(`\n=== Testing ${scenario} ===`);
    
    // Reset console logs for this scenario
    this.consoleLogs = [];
    
    const result: PlanIdTestResults = {
      scenario,
      url: planUrl,
      planFound: false,
      apiPlanIdAvailable: null,
      usingFallback: null,
      finalPlanId: null,
      orderUrl: null,
      consoleLogs: [],
      screenshots: {
        initial: '',
        afterAddress: '',
        beforeOrder: ''
      }
    };

    try {
      // Step 1: Navigate to the plan URL
      console.log(`Navigating to: ${planUrl}`);
      await this.page.goto(planUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Take initial screenshot
      const initialScreenshot = `${ARTIFACTS_DIR}/${scenario.toLowerCase().replace(/\s+/g, '_')}_01_initial.png`;
      await this.page.screenshot({ path: initialScreenshot, fullPage: true });
      result.screenshots.initial = initialScreenshot;
      console.log(`Initial screenshot saved: ${initialScreenshot}`);

      // Step 2: Click "Select This Plan" button
      console.log('Looking for "Select This Plan" button...');
      const selectButton = this.page.locator('button, a').filter({ hasText: /select this plan/i }).first();
      await expect(selectButton).toBeVisible({ timeout: 10000 });
      await selectButton.click();
      console.log('Clicked "Select This Plan" button');

      // Step 3: Wait for address modal and fill in address
      console.log('Waiting for address modal...');
      await this.page.waitForSelector('[data-testid="address-modal"], .address-modal, [role="dialog"]', { timeout: 10000 });
      
      // Fill in address details
      console.log('Filling in address: "123 Main St", ZIP: "75001"');
      
      // Try multiple selectors for address field
      const addressSelectors = [
        'input[name="address"]',
        'input[placeholder*="address"]',
        'input[id*="address"]',
        '[data-testid="address-input"]'
      ];
      
      let addressFilled = false;
      for (const selector of addressSelectors) {
        try {
          const addressField = this.page.locator(selector).first();
          if (await addressField.isVisible()) {
            await addressField.fill('123 Main St');
            addressFilled = true;
            console.log(`Address filled using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!addressFilled) {
        throw new Error('Could not find address input field');
      }

      // Fill ZIP code
      const zipSelectors = [
        'input[name="zip"]',
        'input[name="zipCode"]', 
        'input[placeholder*="ZIP"]',
        'input[id*="zip"]',
        '[data-testid="zip-input"]'
      ];
      
      let zipFilled = false;
      for (const selector of zipSelectors) {
        try {
          const zipField = this.page.locator(selector).first();
          if (await zipField.isVisible()) {
            await zipField.fill('75001');
            zipFilled = true;
            console.log(`ZIP filled using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!zipFilled) {
        throw new Error('Could not find ZIP input field');
      }

      // Step 4: Submit the address form
      console.log('Submitting address form...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Continue")',
        'button:has-text("Search")',
        'button:has-text("Find")',
        '[data-testid="submit-address"]'
      ];
      
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitButton = this.page.locator(selector).first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            submitted = true;
            console.log(`Submitted using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!submitted) {
        throw new Error('Could not find submit button');
      }

      // Wait for any loading/processing
      await this.page.waitForTimeout(2000);
      await this.page.waitForLoadState('networkidle');
      
      // Take screenshot after address submission
      const afterAddressScreenshot = `${ARTIFACTS_DIR}/${scenario.toLowerCase().replace(/\s+/g, '_')}_02_after_address.png`;
      await this.page.screenshot({ path: afterAddressScreenshot, fullPage: true });
      result.screenshots.afterAddress = afterAddressScreenshot;
      console.log(`After address screenshot saved: ${afterAddressScreenshot}`);

      // Step 5: Look for "Order This Plan" button
      console.log('Looking for "Order This Plan" button...');
      const orderButton = this.page.locator('button, a').filter({ hasText: /order this plan/i }).first();
      
      // Wait up to 15 seconds for the order button to appear
      await expect(orderButton).toBeVisible({ timeout: 15000 });
      console.log('Found "Order This Plan" button');
      
      // Take screenshot before clicking order
      const beforeOrderScreenshot = `${ARTIFACTS_DIR}/${scenario.toLowerCase().replace(/\s+/g, '_')}_03_before_order.png`;
      await this.page.screenshot({ path: beforeOrderScreenshot, fullPage: true });
      result.screenshots.beforeOrder = beforeOrderScreenshot;
      console.log(`Before order screenshot saved: ${beforeOrderScreenshot}`);

      // Step 6: Analyze console logs for plan ID information
      console.log('Analyzing console logs for plan ID information...');
      result.consoleLogs = [...this.consoleLogs];
      
      for (const log of this.consoleLogs) {
        if (log.text.includes('apiPlanIdAvailable')) {
          const match = log.text.match(/apiPlanIdAvailable:\s*(true|false)/);
          if (match) {
            result.apiPlanIdAvailable = match[1] === 'true';
            console.log(`Found apiPlanIdAvailable: ${result.apiPlanIdAvailable}`);
          }
        }
        
        if (log.text.includes('usingFallback')) {
          const match = log.text.match(/usingFallback:\s*(true|false)/);
          if (match) {
            result.usingFallback = match[1] === 'true';
            console.log(`Found usingFallback: ${result.usingFallback}`);
          }
        }
        
        if (log.text.includes('planId') && !log.text.includes('apiPlanIdAvailable')) {
          const match = log.text.match(/planId[^\w]*([a-f0-9]{24})/);
          if (match) {
            result.finalPlanId = match[1];
            console.log(`Found planId: ${result.finalPlanId}`);
          }
        }
      }

      // Step 7: Click "Order This Plan" and capture URL
      console.log('Clicking "Order This Plan" to test final URL...');
      
      // Set up a listener for navigation
      const navigationPromise = this.page.waitForURL('**/order**', { timeout: 10000 });
      
      await orderButton.click();
      
      try {
        await navigationPromise;
        result.orderUrl = this.page.url();
        console.log(`Order URL: ${result.orderUrl}`);
        
        // Extract plan ID from URL if present
        const urlMatch = result.orderUrl.match(/planId=([a-f0-9]{24})/);
        if (urlMatch) {
          result.finalPlanId = urlMatch[1];
          console.log(`Plan ID from URL: ${result.finalPlanId}`);
        }
        
      } catch (e) {
        console.log('Navigation to order page did not occur within timeout, but continuing...');
        result.orderUrl = this.page.url();
      }

      // Determine if plan was found based on API response
      result.planFound = result.apiPlanIdAvailable === true;
      
      console.log(`=== ${scenario} Results ===`);
      console.log(`Plan found: ${result.planFound}`);
      console.log(`API Plan ID Available: ${result.apiPlanIdAvailable}`);
      console.log(`Using fallback: ${result.usingFallback}`);
      console.log(`Final plan ID: ${result.finalPlanId}`);
      console.log(`Order URL: ${result.orderUrl}`);
      
    } catch (error) {
      console.error(`Error in ${scenario}:`, error);
      result.consoleLogs = [...this.consoleLogs];
      
      // Take error screenshot
      try {
        const errorScreenshot = `${ARTIFACTS_DIR}/${scenario.toLowerCase().replace(/\s+/g, '_')}_error.png`;
        await this.page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`Error screenshot saved: ${errorScreenshot}`);
      } catch (screenshotError) {
        console.error('Could not take error screenshot:', screenshotError);
      }
      
      throw error;
    }

    return result;
  }
}

test.describe('Plan ID Fix Validation', () => {
  let tester: PlanIdTester;
  const testResults: PlanIdTestResults[] = [];

  test.beforeEach(async ({ page }) => {
    tester = new PlanIdTester(page);
    
    // Create artifacts directory
    await page.evaluate((dir) => {
      // This will be handled by Node.js mkdir in the actual test
    }, ARTIFACTS_DIR);
  });

  test('should handle valid plan scenario correctly', async ({ page }) => {
    const validPlanUrl = 'http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';
    
    const result = await tester.testPlanScenario('Valid Plan Scenario', validPlanUrl);
    testResults.push(result);
    
    // Assertions for valid plan scenario
    expect(result.planFound).toBe(true);
    expect(result.apiPlanIdAvailable).toBe(true);
    expect(result.usingFallback).toBe(false);
    expect(result.finalPlanId).toBeTruthy();
    expect(result.finalPlanId).toMatch(/^[a-f0-9]{24}$/); // Valid MongoDB ObjectId format
    expect(result.orderUrl).toContain('order');
  });

  test('should handle fallback scenario correctly', async ({ page }) => {
    const fakePlanUrl = 'http://localhost:4324/electricity-plans/plans/fake-provider/fake-plan-12';
    
    const result = await tester.testPlanScenario('Fallback Scenario', fakePlanUrl);
    testResults.push(result);
    
    // Assertions for fallback scenario
    expect(result.planFound).toBe(false);
    expect(result.apiPlanIdAvailable).toBe(false);
    expect(result.usingFallback).toBe(true);
    expect(result.finalPlanId).toBeTruthy();
    expect(result.finalPlanId).toMatch(/^[a-f0-9]{24}$/); // Should use default MongoDB ObjectId
    expect(result.orderUrl).toContain('order');
  });

  test.afterAll(async () => {
    // Generate comprehensive test report
    console.log('\n=== GENERATING COMPREHENSIVE TEST REPORT ===');
    
    const report = {
      testExecutionDate: new Date().toISOString(),
      testPurpose: 'Validate Plan ID fix implementation for Order Plan functionality',
      scenarios: testResults,
      summary: {
        totalScenarios: testResults.length,
        successfulScenarios: testResults.filter(r => r.finalPlanId !== null).length,
        failedScenarios: testResults.filter(r => r.finalPlanId === null).length,
      },
      conclusions: [
        'Valid plan scenario should use real plan ID from API search',
        'Fallback scenario should use default MongoDB ObjectId when plan not found',
        'Both scenarios should successfully reach order functionality',
        'Console logs should clearly indicate which mode is being used'
      ]
    };

    // Save test report
    const reportPath = `${ARTIFACTS_DIR}/PLAN_ID_TEST_REPORT.json`;
    const reportContent = JSON.stringify(report, null, 2);
    
    // Create markdown version of the report
    const markdownReport = `# Plan ID Fix Validation Test Report

**Test Date**: ${report.testExecutionDate}
**Purpose**: ${report.testPurpose}

## Test Summary
- **Total Scenarios**: ${report.summary.totalScenarios}
- **Successful**: ${report.summary.successfulScenarios} 
- **Failed**: ${report.summary.failedScenarios}

## Test Results

${testResults.map(result => `
### ${result.scenario}

- **URL**: ${result.url}
- **Plan Found**: ${result.planFound ? '✅ Yes' : '❌ No'}
- **API Plan ID Available**: ${result.apiPlanIdAvailable ? '✅ True' : '❌ False'}
- **Using Fallback**: ${result.usingFallback ? '⚠️ True' : '✅ False'}
- **Final Plan ID**: \`${result.finalPlanId}\`
- **Order URL**: ${result.orderUrl}

**Screenshots**:
- Initial: \`${result.screenshots.initial}\`
- After Address: \`${result.screenshots.afterAddress}\`
- Before Order: \`${result.screenshots.beforeOrder}\`

**Console Logs** (${result.consoleLogs.length} entries):
${result.consoleLogs.filter(log => 
  log.text.includes('apiPlanIdAvailable') || 
  log.text.includes('usingFallback') ||
  log.text.includes('planId')
).map(log => `- [${log.type.toUpperCase()}] ${log.text}`).join('\n')}

`).join('\n')}

## Conclusions

${report.conclusions.map(conclusion => `- ${conclusion}`).join('\n')}

## Artifacts Location
All screenshots and logs are saved in: \`${ARTIFACTS_DIR}\`
`;

    console.log('Test report generated:');
    console.log(markdownReport);
    
    // In a real file system context, you would write these files:
    // await writeFile(reportPath, reportContent);
    // await writeFile(`${ARTIFACTS_DIR}/PLAN_ID_TEST_REPORT.md`, markdownReport);
  });
});