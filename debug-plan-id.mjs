#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', `plan-id-debug-${TIMESTAMP}`);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveScreenshot(page, name) {
  const filePath = path.join(ARTIFACTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
  return filePath;
}

async function saveConsoleLog(consoleMessages, filename) {
  const filePath = path.join(ARTIFACTS_DIR, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(consoleMessages, null, 2));
  console.log(`Console log saved: ${filePath}`);
  return filePath;
}

async function saveNetworkLog(networkRequests, filename) {
  const filePath = path.join(ARTIFACTS_DIR, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(networkRequests, null, 2));
  console.log(`Network log saved: ${filePath}`);
  return filePath;
}

async function saveDiagnosticReport(data, filename) {
  const filePath = path.join(ARTIFACTS_DIR, `${filename}.md`);
  await fs.writeFile(filePath, data);
  console.log(`Diagnostic report saved: ${filePath}`);
  return filePath;
}

async function debugPlanIdWorkflow() {
  const browser = await chromium.launch({ 
    headless: false,  // Set to true for headless mode
    slowMo: 1000 // Slow down actions for debugging
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  
  // Arrays to collect diagnostic data
  const consoleMessages = [];
  const networkRequests = [];
  const planIdValues = {
    initial: null,
    afterApi: null,
    beforeOrder: null,
    finalUrl: null
  };

  await ensureDir(ARTIFACTS_DIR);

  // Setup console logging
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleMessages.push(logEntry);
    console.log(`🖥️  CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Setup network request monitoring
  page.on('request', (request) => {
    const requestData = {
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
      timestamp: new Date().toISOString()
    };
    networkRequests.push(requestData);
    console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
  });

  page.on('response', (response) => {
    const responseData = {
      url: response.url(),
      status: response.status(),
      timestamp: new Date().toISOString()
    };
    console.log(`📨 RESPONSE: ${response.status()} ${response.url()}`);
  });

  try {
    console.log('🚀 Starting Plan ID Debug Workflow...');
    
    // Step 1: Navigate to the specific plan page
    console.log('📍 Step 1: Navigating to plan page...');
    const planUrl = 'http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';
    await page.goto(planUrl, { waitUntil: 'networkidle' });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    await saveScreenshot(page, '01-plan-page-loaded');

    // Step 2: Extract initial plan data from the page
    console.log('🔍 Step 2: Extracting initial plan data...');
    
    // Check if plan data is available in the page
    const initialPlanData = await page.evaluate(() => {
      // Look for plan data in various places
      const planElement = document.querySelector('[data-plan-id]');
      const selectButton = document.querySelector('button[onclick*="selectPlan"], button[data-plan-id]');
      
      return {
        planElementId: planElement?.dataset?.planId || null,
        selectButtonData: selectButton?.dataset?.planId || selectButton?.getAttribute('onclick') || null,
        pageUrl: window.location.href,
        planFromUrl: window.location.pathname.split('/').pop()
      };
    });
    
    planIdValues.initial = initialPlanData;
    console.log('Initial Plan Data:', JSON.stringify(initialPlanData, null, 2));

    // Step 3: Click "Select This Plan" button
    console.log('🖱️  Step 3: Clicking Select This Plan button...');
    
    // Wait for and click the Select This Plan button
    await page.waitForSelector('text=Select This Plan', { timeout: 10000 });
    await page.click('text=Select This Plan');
    
    // Wait for modal to appear
    await page.waitForSelector('.modal, [role="dialog"], .address-modal', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '02-address-modal-opened');

    // Step 4: Fill in the address form
    console.log('📝 Step 4: Filling address form...');
    
    // Fill address field using the correct ID from AddressSearchModal
    await page.fill('#address', '123 Main St');
    
    // Fill ZIP field using the correct ID from AddressSearchModal  
    await page.fill('#zipcode', '75001');
    
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '03-address-form-filled');

    // Step 5: Wait for automatic address search to complete
    console.log('🔍 Step 5: Waiting for automatic address search...');
    
    // The AddressSearchModal auto-searches after filling the form
    // Wait for the results step to appear (Service Locations Found)
    await page.waitForSelector('text=Service Locations Found', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await saveScreenshot(page, '04-address-search-results');
    
    // Step 5.5: Select a service location from the results
    console.log('🏠 Step 5.5: Selecting service location...');
    
    // Click the first service location card (which should be visible now)
    const locationCard = page.locator('[role="button"]').first();
    if (await locationCard.count() > 0) {
      await locationCard.click();
      // Wait for validation and success step
      console.log('⏳ Waiting for address validation...');
      await page.waitForSelector('text=Plan Available!', { timeout: 10000 });
      await page.waitForTimeout(2000);
    }
    
    await saveScreenshot(page, '05-address-validated');

    // Step 6: Look for and monitor the Order This Plan button
    console.log('🎯 Step 6: Locating Order This Plan button...');
    
    // Wait for Order button to appear in the success step
    const orderButton = page.locator('button:has-text("Order This Plan")');
    await page.waitForTimeout(2000);

    // Check if Order button exists
    const orderButtonExists = await orderButton.count() > 0;
    console.log(`Order button found: ${orderButtonExists}`);

    if (orderButtonExists) {
      // Step 7: Extract plan data right before ordering
      console.log('📊 Step 7: Extracting plan data before order...');
      
      const preOrderPlanData = await page.evaluate(() => {
        // Check for plan ID in various locations
        // Find Order This Plan button using DOM methods
        const buttons = document.querySelectorAll('button');
        const orderBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Order This Plan'));
        const planData = {
          orderButtonHref: orderBtn?.href || null,
          orderButtonOnclick: orderBtn?.getAttribute('onclick') || null,
          orderButtonData: orderBtn?.dataset || {},
          currentUrl: window.location.href,
          // Look for any plan ID variables in window scope
          windowPlanId: window.planId || window.apiPlanId || null,
          // Check for console logs that may have been printed
          consoleLogs: [], // We'll capture this from our listener
        };

        // Check for React or other framework data
        try {
          const reactInstance = orderBtn?._reactInternalInstance || orderBtn?.__reactInternalInstance;
          if (reactInstance) {
            planData.reactProps = reactInstance.memoizedProps;
          }
        } catch (e) {
          console.log('No React data found');
        }

        // Try to find any plan data in the DOM
        const planElements = document.querySelectorAll('[data-plan-id], [data-api-plan-id]');
        planData.domPlanIds = Array.from(planElements).map(el => ({
          tagName: el.tagName,
          planId: el.dataset.planId,
          apiPlanId: el.dataset.apiPlanId,
          textContent: el.textContent?.slice(0, 100)
        }));

        return planData;
      });

      planIdValues.beforeOrder = preOrderPlanData;
      console.log('Pre-Order Plan Data:', JSON.stringify(preOrderPlanData, null, 2));

      await saveScreenshot(page, '06-before-order-click');

      // Step 8: Click Order This Plan and capture the URL
      console.log('🚀 Step 8: Clicking Order This Plan...');
      
      // Listen for navigation or new tab
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        orderButton.click()
      ]);

      if (newPage) {
        // New tab opened
        await newPage.waitForLoadState('networkidle');
        const finalUrl = newPage.url();
        planIdValues.finalUrl = finalUrl;
        console.log(`🌐 New page opened: ${finalUrl}`);
        
        await saveScreenshot(newPage, '07-order-page-opened');
        await newPage.close();
      } else {
        // Same page navigation
        await page.waitForTimeout(3000);
        const finalUrl = page.url();
        planIdValues.finalUrl = finalUrl;
        console.log(`🌐 Page navigated to: ${finalUrl}`);
        
        await saveScreenshot(page, '07-order-page-same-window');
      }
    }

    // Step 9: Capture any API responses about plan lookup
    console.log('📡 Step 9: Looking for plan search API calls...');
    
    const planApiCalls = networkRequests.filter(req => 
      req.url.includes('/api/plans') || 
      req.url.includes('search') || 
      req.url.includes('plan')
    );
    
    console.log(`Found ${planApiCalls.length} plan-related API calls`);

  } catch (error) {
    console.error('❌ Error during workflow:', error);
    await saveScreenshot(page, '99-error-state');
  } finally {
    // Step 10: Generate diagnostic report
    console.log('📝 Step 10: Generating diagnostic report...');
    
    const diagnosticReport = `
# Plan ID Debug Report
**Generated**: ${new Date().toISOString()}
**Plan URL**: ${planUrl}

## Executive Summary
- Initial Plan ID: ${planIdValues.initial?.planElementId || planIdValues.initial?.planFromUrl || 'Not found'}
- API Plan ID: ${planIdValues.afterApi || 'Not captured'}
- Final URL: ${planIdValues.finalUrl || 'Not captured'}

## Detailed Findings

### 1. Initial Plan Data
\`\`\`json
${JSON.stringify(planIdValues.initial, null, 2)}
\`\`\`

### 2. Pre-Order Plan Data
\`\`\`json
${JSON.stringify(planIdValues.beforeOrder, null, 2)}
\`\`\`

### 3. Plan API Calls
${networkRequests.filter(req => req.url.includes('/api/plans') || req.url.includes('search')).map(req => 
  `- ${req.method} ${req.url} (${req.timestamp})`
).join('\\n')}

### 4. Console Messages (Last 20)
${consoleMessages.slice(-20).map(msg => 
  `- [${msg.type.toUpperCase()}] ${msg.text} (${msg.timestamp})`
).join('\\n')}

### 5. Plan ID Analysis
- **URL Slug**: ${planIdValues.initial?.planFromUrl}
- **Found API ID**: 68b84e0e206770f7c563793b (from server logs)
- **Final Order URL**: ${planIdValues.finalUrl}

## Recommendations
${planIdValues.finalUrl ? 
  `The order flow completed and redirected to: ${planIdValues.finalUrl}` :
  'The order flow did not complete - check for JavaScript errors or missing API responses'
}

## Next Steps
1. Check if the API call in /api/plans/search is returning the correct plan ID
2. Verify that the order button uses the API plan ID (68b84e0e206770f7c563793b) not the URL slug
3. Monitor the Power to Choose URL for proper plan ID parameter
`;
    
    const planUrl = 'http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';

    await saveDiagnosticReport(diagnosticReport, 'plan-id-debug-report');
    await saveConsoleLog(consoleMessages, 'console-messages');
    await saveNetworkLog(networkRequests, 'network-requests');

    await browser.close();
    
    console.log('✅ Debug workflow completed!');
    console.log(`📁 Artifacts saved to: ${ARTIFACTS_DIR}`);
    
    return {
      success: true,
      planIdValues,
      consoleMessages: consoleMessages.length,
      networkRequests: networkRequests.length,
      artifactsDir: ARTIFACTS_DIR
    };
  }
}

// Run the debug workflow
debugPlanIdWorkflow()
  .then((result) => {
    console.log('\n🎉 Debug Results:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });