import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const BASE_URL = 'http://localhost:4324';
const PLAN_URL = '/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';
const TEST_DATA = {
  address: '123 Main St',
  zipCode: '75001'
};
const EXPECTED_URL_PATTERN = /^https:\/\/orders\.comparepower\.com\/order\/service_location\?.*esiid=.*&plan_id=.*&usage=.*&zip_code=.*/;

// Artifacts directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '');
const ARTIFACTS_DIR = `./artifacts/${timestamp}_order_plan_workflow_enhanced`;

async function createArtifactsDir() {
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    console.log(`📁 Created artifacts directory: ${ARTIFACTS_DIR}`);
  } catch (error) {
    console.error('Failed to create artifacts directory:', error);
    process.exit(1);
  }
}

async function saveScreenshot(page, filename, step) {
  const screenshotPath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: true,
    animations: 'disabled'
  });
  console.log(`📸 Screenshot saved: ${filename} (Step: ${step})`);
}

async function saveTestReport(testResults, filename) {
  const reportPath = path.join(ARTIFACTS_DIR, filename);
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      totalSteps: testResults.length,
      passedSteps: testResults.filter(r => r.success).length,
      failedSteps: testResults.filter(r => !r.success).length
    }
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Test report saved: ${filename}`);
}

async function waitForNetworkResponse(page, urlPattern, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for network response')), timeout);
    
    page.on('response', (response) => {
      if (urlPattern.test(response.url())) {
        clearTimeout(timer);
        resolve(response);
      }
    });
  });
}

async function testOrderPlanWorkflowEnhanced() {
  await createArtifactsDir();
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Reduce delay for faster execution
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: ARTIFACTS_DIR,
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  const consoleMessages = [];
  const networkRequests = [];
  const testResults = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push(msg);
    console.log(`🔍 Console [${msg.type()}]: ${msg.text()}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('ercot') || request.url().includes('comparepower')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`🌐 Network Request: ${request.method()} ${request.url()}`);
    }
  });

  // Capture network responses
  page.on('response', async (response) => {
    if (response.url().includes('ercot/search')) {
      try {
        const responseBody = await response.text();
        console.log(`🌐 ERCOT Search Response (${response.status()}): ${responseBody}`);
      } catch (e) {
        console.log(`🌐 ERCOT Search Response: ${response.status()} (could not read body)`);
      }
    }
  });

  try {
    // Step 1: Navigate to plan page
    console.log('\n🚀 Step 1: Navigating to Frontier Utilities plan page...');
    const fullUrl = BASE_URL + PLAN_URL;
    await page.goto(fullUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await saveScreenshot(page, '01_plan_page_loaded.png', 'Plan page loaded');
    
    testResults.push({
      step: 1,
      description: 'Navigate to plan page',
      url: fullUrl,
      success: true,
      timestamp: new Date().toISOString()
    });

    // Step 2: Click "Select This Plan" button
    console.log('\n🖱️  Step 2: Clicking Select This Plan button...');
    const selectButton = page.locator('button:has-text("Select This Plan"), a:has-text("Select This Plan")').first();
    await selectButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveScreenshot(page, '02_before_select_button_click.png', 'Before clicking Select This Plan');
    
    await selectButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal, [data-modal]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow modal animations
    await saveScreenshot(page, '03_address_modal_opened.png', 'Address modal opened');
    
    testResults.push({
      step: 2,
      description: 'Click Select This Plan button',
      success: true,
      timestamp: new Date().toISOString()
    });

    // Step 3: Fill address form and wait for auto-search
    console.log('\n📝 Step 3: Filling address form and waiting for auto-search...');
    
    // Find and fill address field
    const addressField = page.locator('#address');
    await addressField.waitFor({ state: 'visible', timeout: 10000 });
    await addressField.clear();
    await addressField.fill(TEST_DATA.address);
    
    // Find and fill ZIP code field
    const zipField = page.locator('#zipcode');
    await zipField.waitFor({ state: 'visible', timeout: 5000 });
    await zipField.clear();
    await zipField.fill(TEST_DATA.zipCode);
    
    await saveScreenshot(page, '04_address_form_filled.png', 'Address form filled');
    
    // Wait for auto-search to trigger (component has 1200ms debounce)
    console.log('⏳ Waiting for auto-search to trigger...');
    await page.waitForTimeout(1500);
    
    // Look for loading indicator or search progress
    try {
      await page.waitForSelector('text="Searching for service locations..."', { timeout: 5000 });
      console.log('🔍 Auto-search triggered - waiting for results...');
    } catch (e) {
      console.log('⚠️  Auto-search indicator not visible, manually triggering search...');
      const checkButton = page.locator('button:has-text("Check Availability")');
      if (await checkButton.count() > 0) {
        await checkButton.click();
      }
    }
    
    // Wait for network response
    try {
      const response = await waitForNetworkResponse(page, /\/api\/ercot\/search/, 8000);
      console.log(`✅ ERCOT search API responded with status: ${response.status()}`);
    } catch (e) {
      console.log('⚠️  No ERCOT search response detected');
    }
    
    testResults.push({
      step: 3,
      description: 'Fill address form and trigger search',
      address: TEST_DATA.address,
      zipCode: TEST_DATA.zipCode,
      success: true,
      timestamp: new Date().toISOString()
    });

    // Step 4: Wait for and handle search results
    console.log('\n📍 Step 4: Waiting for search results...');
    
    // Wait longer for the results to appear and modal to transition
    await page.waitForTimeout(3000);
    
    await saveScreenshot(page, '05_after_search_wait.png', 'After search wait');
    
    // Check if we have results or are still in search mode
    const hasResults = await page.locator('text="Service Locations Found"').count() > 0;
    const hasError = await page.locator('text="No service locations found"').count() > 0;
    const stillSearching = await page.locator('text="Check Availability for Frontier Saver Plus 12"').count() > 0;
    
    console.log(`🔍 Modal state - Has Results: ${hasResults}, Has Error: ${hasError}, Still Searching: ${stillSearching}`);
    
    if (hasResults) {
      console.log('✅ Search results found - proceeding to select address');
      
      // Look for address cards
      const addressCards = page.locator('[role="button"]').filter({ hasText: /123|Main|75001/ });
      
      if (await addressCards.count() > 0) {
        await addressCards.first().click();
        console.log('✅ Address selected from results');
        
        // Wait for validation to complete
        await page.waitForTimeout(3000);
        
        // Wait for success step
        try {
          await page.waitForSelector('text="Plan Available!", button:has-text("Order This Plan")', { timeout: 10000 });
          console.log('✅ Success step reached - plan validation completed');
        } catch (e) {
          console.log('⚠️  Success step not detected within timeout');
        }
        
        await saveScreenshot(page, '06_address_selected.png', 'Address selected and validated');
        
        testResults.push({
          step: 4,
          description: 'Select address from results',
          success: true,
          timestamp: new Date().toISOString()
        });
        
        // Step 5: Click Order This Plan
        console.log('\n🛒 Step 5: Looking for Order This Plan button...');
        
        const orderButton = page.locator('button:has-text("Order This Plan")');
        
        if (await orderButton.count() > 0) {
          await saveScreenshot(page, '07_before_order_button.png', 'Before clicking order button');
          
          // Set up navigation listener before clicking
          const navigationPromise = page.waitForURL(/comparepower\.com/, { timeout: 15000 }).catch(() => null);
          
          await orderButton.click();
          console.log('✅ Order This Plan button clicked');
          
          // Wait for potential redirect or new tab
          await page.waitForTimeout(3000);
          
          const finalUrl = page.url();
          console.log(`📍 Final URL: ${finalUrl}`);
          
          await saveScreenshot(page, '08_after_order_click.png', 'After order button click');
          
          // Check if URL matches expected pattern
          const urlMatches = EXPECTED_URL_PATTERN.test(finalUrl);
          
          testResults.push({
            step: 5,
            description: 'Click Order This Plan and capture redirect',
            finalUrl: finalUrl,
            urlMatches: urlMatches,
            expectedPattern: EXPECTED_URL_PATTERN.source,
            success: true,
            timestamp: new Date().toISOString()
          });
          
          // Extract URL parameters if it's a ComparePower URL
          if (finalUrl.includes('comparepower.com')) {
            const urlObj = new URL(finalUrl);
            const params = {
              esiid: urlObj.searchParams.get('esiid'),
              plan_id: urlObj.searchParams.get('plan_id'),
              usage: urlObj.searchParams.get('usage'),
              zip_code: urlObj.searchParams.get('zip_code')
            };
            
            console.log('\n🎉 SUCCESS: Redirected to ComparePower order page!');
            console.log('📊 Extracted URL Parameters:');
            console.log(`  ESIID: ${params.esiid}`);
            console.log(`  Plan ID: ${params.plan_id}`);
            console.log(`  Usage: ${params.usage}`);
            console.log(`  ZIP Code: ${params.zip_code}`);
            
            testResults[testResults.length - 1].extractedParams = params;
            testResults[testResults.length - 1].redirectSuccess = true;
          } else if (finalUrl !== page.url()) {
            console.log('⚠️  Page URL changed but not to ComparePower domain');
            testResults[testResults.length - 1].redirectSuccess = false;
          } else {
            console.log('⚠️  No redirect detected - order may open in new tab');
            testResults[testResults.length - 1].redirectSuccess = false;
          }
          
        } else {
          console.log('❌ Order This Plan button not found');
          await saveScreenshot(page, '07_no_order_button.png', 'Order button not found');
          testResults.push({
            step: 5,
            description: 'Click Order This Plan button',
            success: false,
            error: 'Order button not found',
            timestamp: new Date().toISOString()
          });
        }
        
      } else {
        console.log('❌ No address cards found in results');
        testResults.push({
          step: 4,
          description: 'Select address from results',
          success: false,
          error: 'No address cards found',
          timestamp: new Date().toISOString()
        });
      }
      
    } else if (hasError) {
      console.log('❌ Search returned error - no service locations found');
      testResults.push({
        step: 4,
        description: 'Handle search results',
        success: false,
        error: 'No service locations found',
        timestamp: new Date().toISOString()
      });
    } else if (stillSearching) {
      console.log('⚠️  Modal still in search state - API may have failed silently');
      testResults.push({
        step: 4,
        description: 'Handle search results',
        success: false,
        error: 'Search did not complete or return results',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️  Unknown modal state');
      testResults.push({
        step: 4,
        description: 'Handle search results',
        success: false,
        error: 'Unknown modal state after search',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    await saveScreenshot(page, 'error_state.png', 'Error occurred');
    testResults.push({
      step: 'error',
      description: 'Test failed with error',
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Save artifacts
    const networkLog = path.join(ARTIFACTS_DIR, 'network_requests.json');
    await fs.writeFile(networkLog, JSON.stringify(networkRequests, null, 2));
    
    const consoleLog = path.join(ARTIFACTS_DIR, 'console_log.txt');
    const logContent = consoleMessages.map(msg => 
      `[${new Date().toISOString()}] ${msg.type()}: ${msg.text()}`
    ).join('\n');
    await fs.writeFile(consoleLog, logContent);
    
    await saveTestReport(testResults, 'test_results.json');
    
    await context.close();
    await browser.close();
    
    console.log(`\n📁 All artifacts saved to: ${ARTIFACTS_DIR}`);
    
    // Print comprehensive summary
    console.log('\n📊 Test Summary:');
    console.log(`Total steps: ${testResults.length}`);
    console.log(`Passed: ${testResults.filter(r => r.success).length}`);
    console.log(`Failed: ${testResults.filter(r => !r.success).length}`);
    
    const finalResult = testResults.find(r => r.extractedParams);
    if (finalResult) {
      console.log('\n🎯 Final Order URL Generated:');
      console.log(`https://orders.comparepower.com/order/service_location?esiid=${finalResult.extractedParams.esiid}&plan_id=${finalResult.extractedParams.plan_id}&usage=${finalResult.extractedParams.usage}&zip_code=${finalResult.extractedParams.zip_code}`);
    }
    
    return testResults;
  }
}

// Run the test
testOrderPlanWorkflowEnhanced().catch(console.error);