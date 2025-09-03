import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testModalFlow() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const artifactsDir = path.join(__dirname, 'artifacts', `${timestamp}_modal_test`);
    
    // Ensure artifacts directory exists
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1024 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));
    
    const testResults = {
        timestamp: new Date().toISOString(),
        steps: [],
        finalUrl: '',
        parametersFound: {},
        success: false,
        errors: []
    };
    
    try {
        console.log('🚀 Starting modal flow test...');
        
        // Step 1: Navigate to the specific plan page
        console.log('📍 Step 1: Navigating to plan page...');
        await page.goto('http://localhost:4324/electricity-plans/plans/rhythm-energy/rhythm-saver-12', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // Wait for React hydration
        await page.waitForTimeout(3000);
        
        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(artifactsDir, '01_plan_page_loaded.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 1,
            description: 'Plan page loaded successfully',
            status: 'success'
        });
        
        // Step 2: Click "Select This Plan" button
        console.log('🔘 Step 2: Clicking Select This Plan button...');
        
        // Wait for the button to be available - it's a specific button with "Select This Plan" text
        await page.waitForSelector('button:has-text("Select This Plan")', {
            timeout: 15000
        });
        
        const selectButton = await page.locator('button:has-text("Select This Plan")').first();
        await selectButton.click();
        
        // Wait for shadcn Dialog modal to appear - it uses role="dialog"
        await page.waitForSelector('[role="dialog"]', {
            timeout: 15000
        });
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '02_modal_opened.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 2,
            description: 'Modal opened successfully',
            status: 'success'
        });
        
        // Step 3: Enter address
        console.log('📝 Step 3: Entering address...');
        
        // Look for the address input with id="address" (from line 195-196 in modal)
        const addressInput = await page.locator('#address').first();
        await addressInput.fill('3031 Oliver st Apt 1214');
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '03_address_entered.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 3,
            description: 'Address entered: 3031 Oliver st Apt 1214',
            status: 'success'
        });
        
        // Step 4: Enter ZIP code
        console.log('📮 Step 4: Entering ZIP code...');
        
        // Look for the zip input with id="zipcode" (from line 209-210 in modal)
        const zipInput = await page.locator('#zipcode').first();
        await zipInput.fill('75205');
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '04_zip_entered.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 4,
            description: 'ZIP code entered: 75205',
            status: 'success'
        });
        
        // Step 5: Click Check Availability or wait for auto-search
        console.log('🔍 Step 5: Triggering availability check...');
        
        // The modal has auto-search (lines 72-78), but also a manual button
        // Look for "Check Availability" button with Search icon
        try {
            const checkButton = await page.locator('button:has-text("Check Availability")').first();
            await checkButton.click();
        } catch (e) {
            console.log('Auto-search should trigger after 500ms delay...');
            await page.waitForTimeout(1000); // Wait for auto-search
        }
        
        // Wait for search results - the modal switches to 'results' step
        // Look for the "Service Locations Found" heading or search results container
        await page.waitForSelector('text="Service Locations Found"', {
            timeout: 20000
        });
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '05_search_results.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 5,
            description: 'Search results displayed',
            status: 'success'
        });
        
        // Step 6: Select ESIID for APT 1214
        console.log('🏠 Step 6: Selecting ESIID for APT 1214...');
        
        // Look for the apartment 1214 result - it should be in a Card component
        const aptResult = await page.locator('text=/.*1214.*/i').first();
        await aptResult.click();
        
        // Wait for the success step to appear
        await page.waitForSelector('text="Plan Available!"', {
            timeout: 15000
        });
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '06_esiid_selected.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 6,
            description: 'ESIID selected for APT 1214',
            status: 'success'
        });
        
        // Step 7: Click Order This Plan
        console.log('🛒 Step 7: Clicking Order This Plan...');
        
        // Wait for the order button to appear in success step
        await page.waitForSelector('button:has-text("Order This Plan")', {
            timeout: 10000
        });
        
        const orderButton = await page.locator('button:has-text("Order This Plan")').first();
        
        // Set up navigation listener before clicking
        const navigationPromise = page.waitForEvent('popup', { timeout: 10000 });
        
        await orderButton.click();
        
        // Wait for new page/popup
        const newPage = await navigationPromise;
        const finalUrl = newPage.url();
        
        testResults.finalUrl = finalUrl;
        
        console.log('🎯 Final URL:', finalUrl);
        
        // Parse URL parameters
        const urlObj = new URL(finalUrl);
        const params = Object.fromEntries(urlObj.searchParams);
        
        testResults.parametersFound = params;
        
        await page.screenshot({ 
            path: path.join(artifactsDir, '07_order_clicked.png'),
            fullPage: true 
        });
        
        // Take screenshot of the new page
        await newPage.screenshot({ 
            path: path.join(artifactsDir, '08_comparepower_page.png'),
            fullPage: true 
        });
        
        testResults.steps.push({
            step: 7,
            description: 'Order This Plan clicked - new page opened',
            status: 'success',
            url: finalUrl,
            parameters: params
        });
        
        // Verify required parameters
        const requiredParams = ['esiid', 'plan_id', 'zip_code', 'usage'];
        const expectedValues = {
            plan_id: 'rhythm-saver-12',
            zip_code: '75205',
            usage: '1000'
        };
        
        let allParamsPresent = true;
        const missingParams = [];
        const incorrectParams = [];
        
        for (const param of requiredParams) {
            if (!params[param]) {
                allParamsPresent = false;
                missingParams.push(param);
            }
        }
        
        // Check expected values
        for (const [key, expectedValue] of Object.entries(expectedValues)) {
            if (params[key] !== expectedValue) {
                incorrectParams.push({
                    param: key,
                    expected: expectedValue,
                    actual: params[key]
                });
            }
        }
        
        testResults.success = allParamsPresent && incorrectParams.length === 0;
        testResults.missingParams = missingParams;
        testResults.incorrectParams = incorrectParams;
        
        if (testResults.success) {
            console.log('✅ SUCCESS: All required parameters found with correct values!');
        } else {
            console.log('❌ FAILURE: Missing or incorrect parameters');
            if (missingParams.length > 0) {
                console.log('Missing params:', missingParams);
            }
            if (incorrectParams.length > 0) {
                console.log('Incorrect params:', incorrectParams);
            }
        }
        
        await newPage.close();
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        testResults.errors.push(error.message);
        testResults.success = false;
        
        // Take error screenshot
        await page.screenshot({ 
            path: path.join(artifactsDir, 'error_screenshot.png'),
            fullPage: true 
        });
    } finally {
        // Save test results
        fs.writeFileSync(
            path.join(artifactsDir, 'test_results.json'),
            JSON.stringify(testResults, null, 2)
        );
        
        // Generate HTML report
        const htmlReport = generateHTMLReport(testResults, artifactsDir);
        fs.writeFileSync(
            path.join(artifactsDir, 'test_report.html'),
            htmlReport
        );
        
        console.log(`📊 Test results saved to: ${artifactsDir}`);
        
        await browser.close();
    }
    
    return testResults;
}

function generateHTMLReport(results, artifactsDir) {
    const screenshots = fs.readdirSync(artifactsDir)
        .filter(file => file.endsWith('.png'))
        .sort();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Modal Flow Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .failure { color: red; }
        .step { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .screenshot { max-width: 800px; margin: 10px 0; }
        .parameters { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .url-box { background: #e8f4f8; padding: 10px; border-left: 4px solid #007acc; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Address Search Modal Flow Test Report</h1>
    <p><strong>Timestamp:</strong> ${results.timestamp}</p>
    <p><strong>Overall Result:</strong> <span class="${results.success ? 'success' : 'failure'}">${results.success ? 'SUCCESS' : 'FAILURE'}</span></p>
    
    <h2>Final URL</h2>
    <div class="url-box">
        <strong>URL:</strong> ${results.finalUrl}
    </div>
    
    <h2>Parameters Found</h2>
    <div class="parameters">
        <pre>${JSON.stringify(results.parametersFound, null, 2)}</pre>
    </div>
    
    ${results.missingParams && results.missingParams.length > 0 ? `
    <h3 class="failure">Missing Parameters</h3>
    <ul>
        ${results.missingParams.map(param => `<li>${param}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${results.incorrectParams && results.incorrectParams.length > 0 ? `
    <h3 class="failure">Incorrect Parameters</h3>
    <ul>
        ${results.incorrectParams.map(param => `<li><strong>${param.param}:</strong> Expected "${param.expected}", got "${param.actual}"</li>`).join('')}
    </ul>
    ` : ''}
    
    <h2>Test Steps</h2>
    ${results.steps.map(step => `
    <div class="step">
        <h3>Step ${step.step}: ${step.description}</h3>
        <p><strong>Status:</strong> <span class="${step.status === 'success' ? 'success' : 'failure'}">${step.status}</span></p>
        ${step.url ? `<p><strong>URL:</strong> ${step.url}</p>` : ''}
        ${step.parameters ? `<div class="parameters"><pre>${JSON.stringify(step.parameters, null, 2)}</pre></div>` : ''}
    </div>
    `).join('')}
    
    <h2>Screenshots</h2>
    ${screenshots.map(screenshot => `
    <div>
        <h3>${screenshot}</h3>
        <img src="${screenshot}" alt="${screenshot}" class="screenshot" />
    </div>
    `).join('')}
    
    ${results.errors.length > 0 ? `
    <h2 class="failure">Errors</h2>
    <ul>
        ${results.errors.map(error => `<li>${error}</li>`).join('')}
    </ul>
    ` : ''}
</body>
</html>
    `;
}

// Run the test
testModalFlow().then(results => {
    console.log('Test completed:', results.success ? 'SUCCESS' : 'FAILURE');
    process.exit(results.success ? 0 : 1);
}).catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});