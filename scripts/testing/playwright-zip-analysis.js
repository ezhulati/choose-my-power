import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

async function analyzeZipLookup() {
    // Create timestamped directory for artifacts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const artifactsDir = `./artifacts/zip-lookup-analysis-${timestamp}`;
    
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    console.log(`📁 Artifacts will be saved to: ${artifactsDir}`);

    const browser = await chromium.launch({ 
        headless: false,
        devtools: true,
        slowMo: 1000 // Slow down for observation
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    
    // Comprehensive logging setup
    const networkRequests = [];
    const consoleMessages = [];
    const javascriptErrors = [];
    
    // Monitor ALL network requests
    page.on('request', request => {
        networkRequests.push({
            timestamp: new Date().toISOString(),
            type: 'REQUEST',
            method: request.method(),
            url: request.url(),
            resourceType: request.resourceType(),
            headers: request.headers(),
            postData: request.postData()
        });
        console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
        networkRequests.push({
            timestamp: new Date().toISOString(),
            type: 'RESPONSE',
            status: response.status(),
            url: response.url(),
            headers: response.headers()
        });
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
    });

    // Monitor console messages
    page.on('console', msg => {
        const message = {
            timestamp: new Date().toISOString(),
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        };
        consoleMessages.push(message);
        console.log(`🔍 CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // Monitor JavaScript errors
    page.on('pageerror', error => {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack
        };
        javascriptErrors.push(errorInfo);
        console.log(`❌ JS ERROR: ${error.message}`);
    });

    try {
        console.log('\n=== STEP 1: Navigate to homepage ===');
        
        // Start the dev server if not running
        console.log('📋 Starting development server...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const port = await startDevServer();
        const baseUrl = `http://localhost:${port}`;
        console.log(`🌐 Using base URL: ${baseUrl}`);
        
        await page.goto(baseUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        console.log('✅ Homepage loaded');
        
        // Take initial screenshot
        await page.screenshot({ 
            path: `${artifactsDir}/01-homepage-loaded.png`, 
            fullPage: true 
        });

        console.log('\n=== STEP 2: Inspect form structure ===');
        
        // Find and inspect the form
        const formElement = await page.locator('form').first();
        const formHtml = await formElement.innerHTML();
        
        fs.writeFileSync(`${artifactsDir}/form-structure.html`, formHtml);
        console.log('💾 Form HTML structure saved');

        // Check for ZIP input field
        const zipInput = page.locator('input[type="text"]').first();
        const zipInputExists = await zipInput.count() > 0;
        console.log(`🔍 ZIP input field exists: ${zipInputExists}`);

        if (zipInputExists) {
            const inputAttributes = await zipInput.evaluate(el => ({
                id: el.id,
                name: el.name,
                placeholder: el.placeholder,
                value: el.value,
                className: el.className
            }));
            console.log('📋 Input attributes:', inputAttributes);
        }

        console.log('\n=== STEP 3: Check JavaScript loading ===');
        
        // Check if zip-lookup.js is loaded
        const zipLookupScript = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return scripts.find(script => script.src.includes('zip-lookup.js'));
        });
        
        console.log(`📜 zip-lookup.js loaded: ${!!zipLookupScript}`);
        
        if (zipLookupScript) {
            console.log('📜 Script src:', await page.evaluate(el => el.src, zipLookupScript));
        }

        console.log('\n=== STEP 4: Test ZIP code 75202 - Step by step ===');
        
        // Clear any existing network requests
        networkRequests.length = 0;
        consoleMessages.length = 0;
        javascriptErrors.length = 0;

        // Focus and enter ZIP code
        await zipInput.focus();
        await page.screenshot({ path: `${artifactsDir}/02-input-focused.png` });
        
        console.log('⌨️  Typing ZIP code 75202...');
        await zipInput.fill('75202');
        await page.screenshot({ path: `${artifactsDir}/03-zip-entered.png` });
        
        // Wait a moment for any JavaScript to react
        await page.waitForTimeout(1000);

        // Find submit button
        const submitButton = page.locator('button[type="submit"]').first();
        const submitExists = await submitButton.count() > 0;
        console.log(`🔘 Submit button exists: ${submitExists}`);

        if (submitExists) {
            const buttonText = await submitButton.textContent();
            console.log(`🔘 Button text: "${buttonText}"`);
        }

        console.log('\n=== STEP 5: Monitor form submission ===');
        
        // Set up navigation listener
        let navigationOccurred = false;
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                navigationOccurred = true;
                console.log(`🚀 NAVIGATION to: ${frame.url()}`);
            }
        });

        // Click submit and monitor what happens
        console.log('🖱️  Clicking submit button...');
        await submitButton.click();
        
        // Wait and observe
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        console.log(`🚀 Navigation occurred: ${navigationOccurred}`);
        
        await page.screenshot({ path: `${artifactsDir}/04-after-submit.png`, fullPage: true });

        console.log('\n=== STEP 6: Test with JavaScript disabled ===');
        
        // Create new context with JavaScript disabled
        const jsDisabledContext = await browser.newContext({
            javaScriptEnabled: false,
            viewport: { width: 1280, height: 720 }
        });
        
        const jsDisabledPage = await jsDisabledContext.newPage();
        
        console.log('🚫 Loading page with JavaScript disabled...');
        await jsDisabledPage.goto(baseUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        await jsDisabledPage.screenshot({ 
            path: `${artifactsDir}/05-no-js-homepage.png`, 
            fullPage: true 
        });

        // Try form submission without JS
        const noJsZipInput = jsDisabledPage.locator('input[type="text"]').first();
        const noJsSubmitButton = jsDisabledPage.locator('button[type="submit"]').first();
        
        if (await noJsZipInput.count() > 0 && await noJsSubmitButton.count() > 0) {
            await noJsZipInput.fill('75202');
            
            console.log('🖱️  Clicking submit without JavaScript...');
            await noJsSubmitButton.click();
            await jsDisabledPage.waitForTimeout(2000);
            
            const noJsCurrentUrl = jsDisabledPage.url();
            console.log(`📍 No-JS URL after submit: ${noJsCurrentUrl}`);
            
            await jsDisabledPage.screenshot({ 
                path: `${artifactsDir}/06-no-js-after-submit.png`, 
                fullPage: true 
            });
        }

        await jsDisabledContext.close();

        console.log('\n=== STEP 7: Detailed analysis ===');
        
        // Save all collected data
        fs.writeFileSync(
            `${artifactsDir}/network-requests.json`, 
            JSON.stringify(networkRequests, null, 2)
        );
        
        fs.writeFileSync(
            `${artifactsDir}/console-messages.json`, 
            JSON.stringify(consoleMessages, null, 2)
        );
        
        fs.writeFileSync(
            `${artifactsDir}/javascript-errors.json`, 
            JSON.stringify(javascriptErrors, null, 2)
        );

        // Generate analysis report
        const analysisReport = {
            timestamp: new Date().toISOString(),
            homepage_loaded: true,
            zip_input_exists: zipInputExists,
            submit_button_exists: submitExists,
            zip_lookup_script_loaded: !!zipLookupScript,
            navigation_occurred: navigationOccurred,
            final_url: currentUrl,
            total_network_requests: networkRequests.length,
            total_console_messages: consoleMessages.length,
            total_js_errors: javascriptErrors.length,
            key_findings: []
        };

        // Analyze key findings
        if (javascriptErrors.length > 0) {
            analysisReport.key_findings.push('JavaScript errors detected during execution');
        }
        
        if (navigationOccurred && currentUrl.includes('75202')) {
            analysisReport.key_findings.push('Form submitted successfully - page navigated to ZIP-specific URL');
        } else if (navigationOccurred) {
            analysisReport.key_findings.push('Unexpected navigation occurred');
        } else {
            analysisReport.key_findings.push('No navigation occurred - AJAX call might be happening or JavaScript failed');
        }

        const ajaxRequests = networkRequests.filter(req => 
            req.type === 'REQUEST' && 
            (req.resourceType === 'xhr' || req.resourceType === 'fetch')
        );
        
        if (ajaxRequests.length > 0) {
            analysisReport.key_findings.push(`${ajaxRequests.length} AJAX/Fetch requests detected`);
        }

        fs.writeFileSync(
            `${artifactsDir}/analysis-report.json`, 
            JSON.stringify(analysisReport, null, 2)
        );

        console.log('\n📋 ANALYSIS SUMMARY:');
        console.log('==================');
        console.log(`📁 Artifacts directory: ${artifactsDir}`);
        console.log(`📊 Network requests: ${networkRequests.length}`);
        console.log(`💬 Console messages: ${consoleMessages.length}`);
        console.log(`❌ JavaScript errors: ${javascriptErrors.length}`);
        console.log(`🔍 Key findings: ${analysisReport.key_findings.length}`);
        
        analysisReport.key_findings.forEach((finding, index) => {
            console.log(`   ${index + 1}. ${finding}`);
        });

        // Keep browser open for manual inspection
        console.log('\n⏸️  Browser left open for manual inspection. Press Ctrl+C when done.');
        
        // Wait indefinitely until user closes
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        
        // Save error details
        fs.writeFileSync(
            `${artifactsDir}/error-log.json`, 
            JSON.stringify({
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                networkRequests,
                consoleMessages,
                javascriptErrors
            }, null, 2)
        );
        
        await page.screenshot({ path: `${artifactsDir}/error-state.png`, fullPage: true });
    } finally {
        // Don't close browser automatically - let user inspect
        console.log('🔍 Analysis complete. Check artifacts directory for detailed results.');
    }
}

// Start development server first
async function startDevServer() {
    return new Promise((resolve) => {
        console.log('🚀 Starting development server...');
        const devServer = spawn('npm', ['run', 'dev'], {
            stdio: 'pipe',
            cwd: process.cwd()
        });

        let detectedPort = '4324'; // default

        devServer.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            
            // Look for the actual port in the output
            const portMatch = output.match(/localhost:(\d+)/);
            if (portMatch) {
                detectedPort = portMatch[1];
                console.log(`✅ Development server detected on port ${detectedPort}`);
                setTimeout(() => resolve(detectedPort), 2000);
            }
        });

        devServer.stderr.on('data', (data) => {
            console.log('DEV SERVER:', data.toString());
        });

        // Fallback timeout
        setTimeout(() => resolve(detectedPort), 10000);
    });
}

// Main execution
async function main() {
    try {
        await analyzeZipLookup();
    } catch (error) {
        console.error('❌ Failed to start analysis:', error);
        process.exit(1);
    }
}

main();