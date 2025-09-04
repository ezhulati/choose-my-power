import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testZipFormSubmission() {
  const ARTIFACTS_DIR = './artifacts/20250903-222221-zip-form-test';
  const BASE_URL = 'http://localhost:4324';
  const TEST_ZIP = '75202';
  
  console.log('🚀 Starting ZIP form submission test...');
  console.log(`📁 Artifacts will be saved to: ${ARTIFACTS_DIR}`);
  
  // Ensure artifacts directory exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }
  
  // Launch browser with detailed logging
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(`🔍 Console: ${logEntry}`);
  });
  
  // Capture network requests
  const networkLogs = [];
  page.on('request', request => {
    const logEntry = `${request.method()} ${request.url()}`;
    networkLogs.push(logEntry);
    console.log(`📡 Network: ${logEntry}`);
  });
  
  // Capture responses
  page.on('response', response => {
    const logEntry = `${response.status()} ${response.url()}`;
    networkLogs.push(logEntry);
    console.log(`📥 Response: ${logEntry}`);
  });
  
  try {
    console.log(`📖 Step 1: Navigate to ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for any dynamic content
    
    // Capture baseline screenshot
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '01-homepage-baseline.png'),
      fullPage: true 
    });
    console.log('✅ Homepage loaded and baseline screenshot captured');
    
    console.log('📖 Step 2: Looking for ZIP code input forms...');
    
    // Find all potential ZIP input elements
    const zipInputs = await page.locator('input[type="text"], input[type="number"], input').all();
    let foundZipInput = null;
    let zipForm = null;
    
    console.log(`Found ${zipInputs.length} input elements, checking each one...`);
    
    for (let i = 0; i < zipInputs.length; i++) {
      const input = zipInputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const className = await input.getAttribute('class');
      
      console.log(`Input ${i + 1}:`, {
        placeholder,
        name, 
        id,
        className: className?.substring(0, 50) + (className?.length > 50 ? '...' : '')
      });
      
      // Check if this looks like a ZIP input
      const isZipInput = (
        placeholder?.toLowerCase().includes('zip') ||
        name?.toLowerCase().includes('zip') ||
        id?.toLowerCase().includes('zip') ||
        placeholder?.includes('75') ||
        placeholder?.includes('Enter ZIP')
      );
      
      if (isZipInput) {
        console.log(`✅ Found potential ZIP input: Input ${i + 1}`);
        foundZipInput = input;
        
        // Find the containing form
        zipForm = await input.locator('xpath=ancestor::form[1]').first();
        break;
      }
    }
    
    if (!foundZipInput) {
      console.log('❌ No ZIP input found. Let me check for specific patterns...');
      
      // Try common ZIP input patterns
      const patterns = [
        'input[placeholder*="ZIP" i]',
        'input[placeholder*="zip" i]', 
        'input[name*="zip" i]',
        'input[id*="zip" i]',
        'input[placeholder*="75"]'
      ];
      
      for (const pattern of patterns) {
        const matches = await page.locator(pattern).all();
        if (matches.length > 0) {
          console.log(`✅ Found ZIP input using pattern: ${pattern}`);
          foundZipInput = matches[0];
          zipForm = await foundZipInput.locator('xpath=ancestor::form[1]').first();
          break;
        }
      }
    }
    
    if (!foundZipInput) {
      throw new Error('No ZIP input field found on the page');
    }
    
    // Highlight the found input for the screenshot
    await foundZipInput.evaluate(el => {
      el.style.outline = '3px solid red';
      el.style.backgroundColor = '#fff3cd';
    });
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '02-zip-input-located.png'),
      fullPage: true 
    });
    
    console.log(`📖 Step 3: Enter ZIP code ${TEST_ZIP}`);
    
    // Clear and enter ZIP code
    await foundZipInput.clear();
    await foundZipInput.fill(TEST_ZIP);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '03-zip-entered.png'),
      fullPage: true 
    });
    
    console.log('📖 Step 4: Looking for submit button...');
    
    // Find submit button - look for various patterns
    let submitButton = null;
    const buttonPatterns = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Find Plans")',
      'button:has-text("Search")', 
      'button:has-text("Go")',
      'button:has-text("Submit")',
      'a:has-text("Find Plans")',
      '[role="button"]:has-text("Find")'
    ];
    
    for (const pattern of buttonPatterns) {
      const buttons = await page.locator(pattern).all();
      if (buttons.length > 0) {
        console.log(`✅ Found submit button using pattern: ${pattern}`);
        submitButton = buttons[0];
        break;
      }
    }
    
    // If no specific submit button found, look within the form
    if (!submitButton && zipForm) {
      const formButtons = await zipForm.locator('button, input[type="submit"], a[href*="zip"]').all();
      if (formButtons.length > 0) {
        console.log('✅ Found submit button within form');
        submitButton = formButtons[0];
      }
    }
    
    if (!submitButton) {
      // Look for any button near the ZIP input
      submitButton = await page.locator('button').first();
      console.log('⚠️  Using first available button as fallback');
    }
    
    if (!submitButton) {
      throw new Error('No submit button found');
    }
    
    // Highlight the submit button
    await submitButton.evaluate(el => {
      el.style.outline = '3px solid blue';
      el.style.backgroundColor = '#d4edda';
    });
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '04-submit-button-located.png'),
      fullPage: true 
    });
    
    console.log('📖 Step 5: Click submit button and observe behavior');
    
    // Record current URL before clicking
    const beforeUrl = page.url();
    console.log(`Current URL before click: ${beforeUrl}`);
    
    // Click the submit button
    await submitButton.click();
    
    // Wait for navigation or response
    await page.waitForTimeout(3000);
    
    // Record URL after clicking  
    const afterUrl = page.url();
    console.log(`Current URL after click: ${afterUrl}`);
    
    // Check if we're on a JSON response page
    const pageContent = await page.content();
    const isJsonResponse = (
      afterUrl.includes('/api/zip-lookup') ||
      pageContent.includes('application/json') ||
      (pageContent.includes('{') && pageContent.includes('"zip"')) ||
      pageContent.trim().startsWith('{')
    );
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '05-after-submit.png'),
      fullPage: true 
    });
    
    // Analyze the result
    console.log('📖 Step 6: Analyzing results...');
    
    let diagnosis = {
      beforeUrl,
      afterUrl,
      isJsonResponse,
      expectedUrl: '/texas/dallas/',
      actualBehavior: '',
      issue: '',
      recommendation: ''
    };
    
    if (isJsonResponse) {
      diagnosis.actualBehavior = 'Shows raw JSON API response';
      diagnosis.issue = 'Form submits to API endpoint instead of navigating to city page';
      diagnosis.recommendation = 'Fix form action or JavaScript to handle client-side navigation';
      console.log('❌ ISSUE CONFIRMED: Showing JSON instead of city page');
    } else if (afterUrl.includes('/texas/dallas')) {
      diagnosis.actualBehavior = 'Successfully navigated to Dallas city page';
      diagnosis.issue = 'None - working correctly';
      diagnosis.recommendation = 'No action needed';
      console.log('✅ SUCCESS: Navigated correctly to city page');
    } else {
      diagnosis.actualBehavior = `Navigated to unexpected URL: ${afterUrl}`;
      diagnosis.issue = 'Form navigation not working as expected';
      diagnosis.recommendation = 'Check form action and JavaScript event handlers';
      console.log('⚠️  UNEXPECTED: Form behavior is different than expected');
    }
    
    // Save all logs and analysis
    const logData = {
      timestamp: new Date().toISOString(),
      testResults: diagnosis,
      consoleLogs,
      networkLogs,
      pageContent: isJsonResponse ? pageContent.substring(0, 1000) : 'Not JSON response'
    };
    
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'test-results.json'), 
      JSON.stringify(logData, null, 2)
    );
    
    // Create summary report
    const report = `# ZIP Form Test Results
    
**Test Date:** ${new Date().toLocaleString()}
**Test ZIP Code:** ${TEST_ZIP}

## Results Summary
- **Before URL:** ${beforeUrl}
- **After URL:** ${afterUrl}  
- **Expected URL:** ${diagnosis.expectedUrl}
- **Is JSON Response:** ${isJsonResponse ? 'YES ❌' : 'NO ✅'}

## Diagnosis
- **Actual Behavior:** ${diagnosis.actualBehavior}
- **Issue:** ${diagnosis.issue}
- **Recommendation:** ${diagnosis.recommendation}

## Console Logs
${consoleLogs.map(log => `- ${log}`).join('\n')}

## Network Activity  
${networkLogs.slice(-10).map(log => `- ${log}`).join('\n')}

## Screenshots Captured
1. \`01-homepage-baseline.png\` - Initial homepage
2. \`02-zip-input-located.png\` - ZIP input highlighted
3. \`03-zip-entered.png\` - ZIP code entered
4. \`04-submit-button-located.png\` - Submit button highlighted  
5. \`05-after-submit.png\` - Result after clicking submit
`;
    
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test-report.md'), report);
    
    console.log('\n🎯 TEST COMPLETE!');
    console.log('📊 Results:', diagnosis);
    console.log(`📁 All artifacts saved to: ${ARTIFACTS_DIR}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Capture error screenshot
    try {
      await page.screenshot({ 
        path: path.join(ARTIFACTS_DIR, 'error-screenshot.png'),
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError.message);
    }
    
    // Save error info
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      url: page.url(),
      consoleLogs,
      networkLogs
    };
    
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'error-details.json'), 
      JSON.stringify(errorInfo, null, 2)
    );
    
  } finally {
    await browser.close();
  }
}

// Run the test
testZipFormSubmission().catch(console.error);