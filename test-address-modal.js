import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive Address Search Modal Test
 * Tests the complete workflow from plan page to ComparePower URL generation
 * Validates all required parameters: esiid, plan_id, zip_code, usage=1000
 */

const BASE_URL = 'http://localhost:4324';
const PLAN_URL = `${BASE_URL}/electricity-plans/plans/rhythm-energy/rhythm-saver-12`;
const HOME_URL = `${BASE_URL}/`;
const TEST_ADDRESS = '3031 Oliver st Apt 1214';
const TEST_ZIP = '75205';
const EXPECTED_ESIID = '10443720007962125';
const EXPECTED_URL_PATTERN = /https:\/\/orders\.comparepower\.com\/order\/service_location\?.*esiid=10443720007962125.*plan_id=rhythm-saver-12.*zip_code=75205.*usage=1000/;

// Create artifacts directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACTS_DIR = `./artifacts/${timestamp}_address_modal_test`;
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

console.log(`📂 Artifacts will be saved to: ${ARTIFACTS_DIR}`);

async function runTest() {
  const browser = await chromium.launch({ 
    headless: false,  // Run in visible mode for debugging
    slowMo: 1000      // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Record HAR for network analysis
    recordHar: { path: path.join(ARTIFACTS_DIR, 'network.har') }
  });
  
  const page = await context.newPage();
  
  // Set up console and error logging
  const logs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    console.log(logEntry);
    logs.push(logEntry);
  });
  
  page.on('pageerror', error => {
    const errorEntry = `[ERROR] ${error.message}`;
    console.error(errorEntry);
    logs.push(errorEntry);
  });

  // Track all popup/new tab creation
  let orderUrl = null;
  context.on('page', async newPage => {
    console.log('🆕 New page/popup opened:', newPage.url());
    orderUrl = newPage.url();
    
    // Take screenshot of the new page
    await newPage.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'comparepower_page.png'),
      fullPage: true 
    });
  });

  try {
    console.log('🚀 Starting comprehensive address modal test...');
    
    // Step 0: First check homepage to ensure site is working
    console.log('📍 Step 0: Testing homepage connectivity...');
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '0_homepage_check.png'),
      fullPage: true 
    });
    console.log('✅ Homepage connectivity verified');
    
    // Step 1: Navigate to plan page
    console.log('📍 Step 1: Navigating to plan page...');
    await page.goto(PLAN_URL, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to render completely
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '1_plan_page_initial.png'),
      fullPage: true 
    });
    console.log('✅ Plan page loaded successfully');

    // Step 2: Click "Select This Plan" to open modal
    console.log('📍 Step 2: Looking for and clicking "Select This Plan" button...');
    
    // Try multiple button selectors
    const buttonSelectors = [
      'button:has-text("Select This Plan")',
      'button:has-text("Select Plan")',
      'button:has-text("Choose")',
      'a:has-text("Select This Plan")',
      'a:has-text("Select Plan")',
      '[data-testid="select-plan"]',
      'button[class*="select"]'
    ];
    
    let buttonClicked = false;
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`Found button with selector: ${selector}`);
          await button.click();
          buttonClicked = true;
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found or not clickable`);
      }
    }
    
    if (!buttonClicked) {
      console.log('⚠️ No select button found. Taking screenshot for debugging...');
      await page.screenshot({ 
        path: path.join(ARTIFACTS_DIR, '2_debug_no_button.png'),
        fullPage: true 
      });
      throw new Error('Could not find any "Select This Plan" button');
    }
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="address-modal"]', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '2_modal_opened.png'),
      fullPage: true 
    });
    console.log('✅ Address modal opened successfully');

    // Step 3: Fill in address and ZIP code
    console.log('📍 Step 3: Filling in address and ZIP code...');
    
    // Fill address field
    const addressInput = page.locator('input[placeholder*="address" i], input[name*="address" i], input[id*="address" i]').first();
    await addressInput.waitFor({ state: 'visible' });
    await addressInput.fill(TEST_ADDRESS);
    
    // Fill ZIP code field
    const zipInput = page.locator('input[placeholder*="zip" i], input[name*="zip" i], input[id*="zip" i]').first();
    await zipInput.waitFor({ state: 'visible' });
    await zipInput.fill(TEST_ZIP);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '3_form_filled.png'),
      fullPage: true 
    });
    console.log('✅ Address and ZIP code filled successfully');

    // Step 4: Click "Check Availability" and wait for results
    console.log('📍 Step 4: Clicking "Check Availability"...');
    const checkButton = page.locator('button:has-text("Check Availability")').first();
    await checkButton.waitFor({ state: 'visible' });
    await checkButton.click();
    
    // Wait for ESIID results to load (this may take a few seconds)
    console.log('⏳ Waiting for ESIID search results...');
    await page.waitForTimeout(3000); // Allow time for API call
    
    // Look for ESIID results or success state
    await page.waitForSelector('[data-testid*="esiid"], .esiid, text="APT 1214"', { timeout: 15000 });
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '4_esiid_results.png'),
      fullPage: true 
    });
    console.log('✅ ESIID search completed');

    // Step 5: Select the specific ESIID for APT 1214
    console.log('📍 Step 5: Selecting ESIID for APT 1214...');
    
    // Try multiple selectors to find the correct ESIID
    let esiidSelected = false;
    const possibleSelectors = [
      `text="${EXPECTED_ESIID}"`,
      `text="APT 1214"`,
      `[data-esiid="${EXPECTED_ESIID}"]`,
      'button:has-text("APT 1214")',
      'li:has-text("APT 1214")'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          esiidSelected = true;
          console.log(`✅ Selected ESIID using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector ${selector} not found or not clickable`);
      }
    }
    
    if (!esiidSelected) {
      // If specific ESIID not found, try to select the first available option
      console.log('⚠️ Specific ESIID not found, selecting first available option...');
      const firstOption = page.locator('[role="button"]:has-text("1214"), button:has-text("Select")').first();
      if (await firstOption.isVisible({ timeout: 2000 })) {
        await firstOption.click();
        esiidSelected = true;
        console.log('✅ Selected first available ESIID option');
      }
    }
    
    if (!esiidSelected) {
      throw new Error('Failed to select any ESIID option');
    }
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '5_esiid_selected.png'),
      fullPage: true 
    });

    // Step 6: Click "Order This Plan" to navigate to ComparePower
    console.log('📍 Step 6: Clicking "Order This Plan"...');
    
    // Wait for the success step and order button
    const orderButton = page.locator('button:has-text("Order This Plan"), button:has-text("Continue"), a:has-text("Order")').first();
    await orderButton.waitFor({ state: 'visible', timeout: 10000 });
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '6_ready_to_order.png'),
      fullPage: true 
    });
    
    // Click the order button and capture the URL
    await orderButton.click();
    
    // Wait for navigation or popup
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '7_final_state.png'),
      fullPage: true 
    });
    
    console.log('✅ Order button clicked');

    // Step 7: Capture and validate the final URL
    console.log('📍 Step 7: Validating ComparePower URL...');
    
    // Check if we have a popup URL
    if (orderUrl) {
      console.log(`🔗 Captured URL from popup: ${orderUrl}`);
    } else {
      // Check current page URL
      orderUrl = page.url();
      console.log(`🔗 Current page URL: ${orderUrl}`);
    }
    
    // Parse URL parameters
    const url = new URL(orderUrl);
    const params = {
      esiid: url.searchParams.get('esiid'),
      plan_id: url.searchParams.get('plan_id'),
      zip_code: url.searchParams.get('zip_code'),
      usage: url.searchParams.get('usage')
    };
    
    console.log('📋 URL Parameters Found:');
    console.log(`  - esiid: ${params.esiid}`);
    console.log(`  - plan_id: ${params.plan_id}`);
    console.log(`  - zip_code: ${params.zip_code}`);
    console.log(`  - usage: ${params.usage}`);
    
    // Validation results
    const results = {
      url: orderUrl,
      parameters: params,
      validations: {
        esiid: params.esiid === EXPECTED_ESIID,
        plan_id: params.plan_id === 'rhythm-saver-12',
        zip_code: params.zip_code === TEST_ZIP,
        usage: params.usage === '1000',
        isComparePowerUrl: orderUrl.includes('orders.comparepower.com')
      }
    };
    
    // Check overall success
    const allValid = Object.values(results.validations).every(v => v);
    
    console.log('\n🎯 VALIDATION RESULTS:');
    console.log(`  ✓ ESIID Correct: ${results.validations.esiid ? '✅' : '❌'}`);
    console.log(`  ✓ Plan ID Correct: ${results.validations.plan_id ? '✅' : '❌'}`);
    console.log(`  ✓ ZIP Code Correct: ${results.validations.zip_code ? '✅' : '❌'}`);
    console.log(`  ✓ Usage Correct: ${results.validations.usage ? '✅' : '❌'}`);
    console.log(`  ✓ ComparePower URL: ${results.validations.isComparePowerUrl ? '✅' : '❌'}`);
    console.log(`\n🏆 OVERALL STATUS: ${allValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Save detailed test report
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: allValid
      },
      testSteps: [
        '1. Navigate to plan page',
        '2. Click "Select This Plan"',
        '3. Fill address and ZIP',
        '4. Click "Check Availability"',
        '5. Select ESIID',
        '6. Click "Order This Plan"',
        '7. Validate URL parameters'
      ],
      testData: {
        planUrl: PLAN_URL,
        address: TEST_ADDRESS,
        zipCode: TEST_ZIP,
        expectedEsiid: EXPECTED_ESIID
      },
      results,
      logs
    };
    
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'test_report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📊 Detailed test report saved to: ${path.join(ARTIFACTS_DIR, 'test_report.json')}`);
    
    return results;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'error_state.png'),
      fullPage: true 
    });
    
    // Save error report
    const errorReport = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      logs
    };
    
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'error_report.json'),
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

const startTime = Date.now();
runTest()
  .then(results => {
    console.log('\n🎉 Test completed successfully!');
    console.log(`📁 All artifacts saved to: ${ARTIFACTS_DIR}`);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    console.log(`📁 Error artifacts saved to: ${ARTIFACTS_DIR}`);
    process.exit(1);
  });