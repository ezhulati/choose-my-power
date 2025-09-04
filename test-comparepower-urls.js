import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACTS_DIR = './artifacts/20250904_161416_comparepower_url_analysis';

// Ensure artifacts directory exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// URLs to test
const BROKEN_URL = 'https://orders.comparepower.com/order/service_location?esiid=10698838736794883&plan_id=68b84e0e206770f7c563793b&usage=1000&zip_code=75205';
const WORKING_URL = 'https://orders.comparepower.com/order/service_location?esiid=10443720007962125&plan_id=68b84e0e206770f7c563793b&usage=1000&zip_code=75205';

async function analyzeURL(browser, url, urlType) {
    console.log(`\n=== Testing ${urlType} URL ===`);
    console.log(`URL: ${url}`);
    
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });
        console.log(`Request: ${request.method()} ${request.url()}`);
    });
    
    // Capture network responses
    const networkResponses = [];
    page.on('response', response => {
        networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            timestamp: new Date().toISOString()
        });
        console.log(`Response: ${response.status()} ${response.url()}`);
    });
    
    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.log(`Page Error: ${error.message}`);
    });
    
    try {
        // Set up HAR recording
        await page.routeFromHAR(`${ARTIFACTS_DIR}/${urlType}_network.har`, {
            mode: 'record',
            update: true
        });
        
        // Navigate to the URL with extended timeout
        console.log(`Navigating to ${url}...`);
        const response = await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        console.log(`Initial response: ${response.status()} ${response.statusText()}`);
        
        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(5000);
        
        // Capture initial screenshot
        await page.screenshot({
            path: `${ARTIFACTS_DIR}/${urlType}_initial.png`,
            fullPage: true
        });
        
        // Get page content and title
        const title = await page.title();
        const url_final = page.url();
        const content = await page.content();
        
        // Check if page appears blank (common indicators)
        const bodyText = await page.locator('body').textContent();
        const hasVisibleContent = bodyText.trim().length > 100; // Arbitrary threshold
        
        // Look for specific elements that might indicate the page loaded properly
        const hasForm = await page.locator('form').count() > 0;
        const hasInputs = await page.locator('input').count() > 0;
        const hasContent = await page.locator('main, .main, #main, .content, #content').count() > 0;
        
        // Check for error messages or redirects
        const hasErrorMessage = await page.locator('text=/error/i, text=/not found/i, text=/404/i').count() > 0;
        
        // Wait for any potential redirects or loading
        await page.waitForTimeout(3000);
        
        // Capture final screenshot after waiting
        await page.screenshot({
            path: `${ARTIFACTS_DIR}/${urlType}_final.png`,
            fullPage: true
        });
        
        // Extract URL parameters for analysis
        const urlObj = new URL(url);
        const params = Object.fromEntries(urlObj.searchParams.entries());
        
        // Compile analysis results
        const analysis = {
            url: url,
            finalUrl: url_final,
            title: title,
            responseStatus: response.status(),
            responseStatusText: response.statusText(),
            parameters: params,
            pageMetrics: {
                hasVisibleContent,
                contentLength: bodyText.trim().length,
                hasForm,
                hasInputs,
                hasContent,
                hasErrorMessage
            },
            consoleMessages: consoleMessages,
            networkRequests: networkRequests.slice(0, 10), // Limit for readability
            networkResponses: networkResponses.slice(0, 10), // Limit for readability
            pageErrors: pageErrors,
            timestamp: new Date().toISOString()
        };
        
        // Save detailed analysis
        fs.writeFileSync(
            `${ARTIFACTS_DIR}/${urlType}_analysis.json`,
            JSON.stringify(analysis, null, 2)
        );
        
        // Save page HTML for inspection
        fs.writeFileSync(
            `${ARTIFACTS_DIR}/${urlType}_page.html`,
            content
        );
        
        console.log(`\n${urlType} Analysis Summary:`);
        console.log(`- Final URL: ${url_final}`);
        console.log(`- Response Status: ${response.status()} ${response.statusText()}`);
        console.log(`- Page Title: ${title}`);
        console.log(`- Has Visible Content: ${hasVisibleContent}`);
        console.log(`- Content Length: ${bodyText.trim().length} characters`);
        console.log(`- Has Form: ${hasForm}`);
        console.log(`- Has Inputs: ${hasInputs}`);
        console.log(`- Has Main Content: ${hasContent}`);
        console.log(`- Has Error Message: ${hasErrorMessage}`);
        console.log(`- Console Messages: ${consoleMessages.length}`);
        console.log(`- Network Requests: ${networkRequests.length}`);
        console.log(`- Page Errors: ${pageErrors.length}`);
        
        return analysis;
        
    } catch (error) {
        console.error(`Error testing ${urlType} URL:`, error.message);
        
        // Capture error screenshot
        try {
            await page.screenshot({
                path: `${ARTIFACTS_DIR}/${urlType}_error.png`,
                fullPage: true
            });
        } catch (screenshotError) {
            console.error('Failed to capture error screenshot:', screenshotError.message);
        }
        
        const errorAnalysis = {
            url: url,
            error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            },
            consoleMessages,
            networkRequests,
            networkResponses,
            pageErrors
        };
        
        fs.writeFileSync(
            `${ARTIFACTS_DIR}/${urlType}_error_analysis.json`,
            JSON.stringify(errorAnalysis, null, 2)
        );
        
        return errorAnalysis;
        
    } finally {
        await page.close();
    }
}

async function compareURLParameters() {
    console.log('\n=== URL Parameter Comparison ===');
    
    const brokenUrlObj = new URL(BROKEN_URL);
    const workingUrlObj = new URL(WORKING_URL);
    
    const brokenParams = Object.fromEntries(brokenUrlObj.searchParams.entries());
    const workingParams = Object.fromEntries(workingUrlObj.searchParams.entries());
    
    console.log('Broken URL Parameters:', brokenParams);
    console.log('Working URL Parameters:', workingParams);
    
    const comparison = {
        brokenUrl: {
            full: BROKEN_URL,
            base: brokenUrlObj.origin + brokenUrlObj.pathname,
            parameters: brokenParams
        },
        workingUrl: {
            full: WORKING_URL,
            base: workingUrlObj.origin + workingUrlObj.pathname,
            parameters: workingParams
        },
        differences: {
            esiid: {
                broken: brokenParams.esiid,
                working: workingParams.esiid,
                different: brokenParams.esiid !== workingParams.esiid
            },
            plan_id: {
                broken: brokenParams.plan_id,
                working: workingParams.plan_id,
                different: brokenParams.plan_id !== workingParams.plan_id
            },
            usage: {
                broken: brokenParams.usage,
                working: workingParams.usage,
                different: brokenParams.usage !== workingParams.usage
            },
            zip_code: {
                broken: brokenParams.zip_code,
                working: workingParams.zip_code,
                different: brokenParams.zip_code !== workingParams.zip_code
            }
        }
    };
    
    // ESIID analysis
    console.log('\n=== ESIID Analysis ===');
    console.log(`Broken ESIID: ${brokenParams.esiid} (length: ${brokenParams.esiid.length})`);
    console.log(`Working ESIID: ${workingParams.esiid} (length: ${workingParams.esiid.length})`);
    
    // Check ESIID format (should be 17 digits)
    const esiidPattern = /^\d{17}$/;
    const brokenEsiidValid = esiidPattern.test(brokenParams.esiid);
    const workingEsiidValid = esiidPattern.test(workingParams.esiid);
    
    console.log(`Broken ESIID valid format: ${brokenEsiidValid}`);
    console.log(`Working ESIID valid format: ${workingEsiidValid}`);
    
    comparison.esiidAnalysis = {
        brokenValid: brokenEsiidValid,
        workingValid: workingEsiidValid,
        bothValid: brokenEsiidValid && workingEsiidValid,
        pattern: esiidPattern.toString()
    };
    
    fs.writeFileSync(
        `${ARTIFACTS_DIR}/url_parameter_comparison.json`,
        JSON.stringify(comparison, null, 2)
    );
    
    return comparison;
}

async function main() {
    console.log('🔍 Starting ComparePower URL Analysis');
    console.log(`📁 Artifacts will be saved to: ${ARTIFACTS_DIR}`);
    
    const browser = await chromium.launch({
        headless: false, // Show browser for visual debugging
        slowMo: 1000    // Slow down for observation
    });
    
    try {
        // Test both URLs
        const brokenAnalysis = await analyzeURL(browser, BROKEN_URL, 'broken');
        const workingAnalysis = await analyzeURL(browser, WORKING_URL, 'working');
        
        // Compare URL parameters
        const parameterComparison = await compareURLParameters();
        
        // Generate comprehensive report
        const report = {
            summary: {
                testTimestamp: new Date().toISOString(),
                brokenUrl: BROKEN_URL,
                workingUrl: WORKING_URL,
                artifactsDirectory: ARTIFACTS_DIR
            },
            brokenUrlAnalysis: brokenAnalysis,
            workingUrlAnalysis: workingAnalysis,
            parameterComparison: parameterComparison,
            conclusions: {
                mainDifference: parameterComparison.differences.esiid.different ? 'ESIID values differ' : 'URLs are identical except for ESIID',
                esiidIssue: !parameterComparison.esiidAnalysis.brokenValid ? 'Broken URL has invalid ESIID format' : 'ESIID format appears valid',
                recommendations: []
            }
        };
        
        // Add specific recommendations based on analysis
        if (brokenAnalysis.pageMetrics && !brokenAnalysis.pageMetrics.hasVisibleContent) {
            report.conclusions.recommendations.push('Broken URL shows blank page - likely invalid ESIID');
        }
        
        if (parameterComparison.esiidAnalysis.brokenValid && !parameterComparison.esiidAnalysis.workingValid) {
            report.conclusions.recommendations.push('Both ESIIDs appear valid format-wise - issue may be data validation');
        }
        
        if (!parameterComparison.esiidAnalysis.brokenValid) {
            report.conclusions.recommendations.push('Fix ESIID format to 17-digit numeric string');
        }
        
        report.conclusions.recommendations.push('Test with known valid ESIID values from ComparePower database');
        report.conclusions.recommendations.push('Implement ESIID validation before generating order URLs');
        
        fs.writeFileSync(
            `${ARTIFACTS_DIR}/comprehensive_analysis_report.json`,
            JSON.stringify(report, null, 2)
        );
        
        // Generate markdown report
        const markdownReport = `# ComparePower URL Analysis Report

## Executive Summary
- **Test Date**: ${new Date().toISOString()}
- **Broken URL**: ${BROKEN_URL}
- **Working URL**: ${WORKING_URL}

## Key Findings

### URL Parameter Differences
- **ESIID Broken**: ${parameterComparison.differences.esiid.broken}
- **ESIID Working**: ${parameterComparison.differences.esiid.working}
- **Different**: ${parameterComparison.differences.esiid.different}

### ESIID Validation
- **Broken ESIID Valid Format**: ${parameterComparison.esiidAnalysis.brokenValid}
- **Working ESIID Valid Format**: ${parameterComparison.esiidAnalysis.workingValid}

### Page Loading Results
- **Broken URL Has Content**: ${brokenAnalysis.pageMetrics?.hasVisibleContent || false}
- **Working URL Has Content**: ${workingAnalysis.pageMetrics?.hasVisibleContent || false}

## Recommendations
${report.conclusions.recommendations.map(rec => `- ${rec}`).join('\n')}

## Files Generated
- Screenshots: broken_initial.png, broken_final.png, working_initial.png, working_final.png
- Network HAR files: broken_network.har, working_network.har
- HTML snapshots: broken_page.html, working_page.html
- Analysis JSON: broken_analysis.json, working_analysis.json
- Full report: comprehensive_analysis_report.json
`;
        
        fs.writeFileSync(
            `${ARTIFACTS_DIR}/analysis_report.md`,
            markdownReport
        );
        
        console.log('\n🎉 Analysis Complete!');
        console.log(`📊 Comprehensive report saved to: ${ARTIFACTS_DIR}/comprehensive_analysis_report.json`);
        console.log(`📝 Markdown report saved to: ${ARTIFACTS_DIR}/analysis_report.md`);
        
    } finally {
        await browser.close();
    }
}

// Run the analysis
main().catch(console.error);