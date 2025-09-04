import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:4324';
const ARTIFACT_DIR = './artifacts/20250904_163137';
const TEST_RESULTS = [];

// Test data
const VALID_TEXAS_ZIPS = ['75201', '77001', '78701']; // Dallas, Houston, Austin
const INVALID_ZIPS = ['12345', '90210', 'abcd', '123'];

class ZipTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing Playwright browser...');
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    this.page = await this.context.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // Monitor network requests
    this.page.on('request', request => {
      if (request.url().includes('/api/zip-lookup')) {
        console.log(`[Network] ZIP API Request: ${request.url()}`);
      }
    });
    
    this.page.on('response', response => {
      if (response.url().includes('/api/zip-lookup')) {
        console.log(`[Network] ZIP API Response: ${response.status()}`);
      }
    });
  }

  async takeScreenshot(name, description = '') {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(ARTIFACT_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return filename;
  }

  async findZipInputs() {
    // Find all possible ZIP input elements
    const zipInputs = await this.page.$$eval('[class*="zip"], input[placeholder*="ZIP"], input[placeholder*="zip"], form.zip-form input, [data-zip] input', 
      elements => elements.map(el => ({
        id: el.id,
        className: el.className,
        placeholder: el.placeholder,
        name: el.name,
        type: el.type,
        parentForm: el.closest('form')?.className || 'no-form'
      }))
    );
    
    console.log(`🔍 Found ${zipInputs.length} ZIP input elements:`, zipInputs);
    return zipInputs;
  }

  async testZipInput(selector, zipCode, expectSuccess = true) {
    console.log(`🧪 Testing ZIP input with selector "${selector}" and ZIP "${zipCode}"`);
    
    try {
      // Clear and type in ZIP code
      await this.page.fill(selector, '');
      await this.page.type(selector, zipCode, { delay: 100 });
      
      // Take screenshot before submission
      const beforeScreenshot = await this.takeScreenshot(`before-submit-${zipCode}`, `Before submitting ${zipCode}`);
      
      // Try to find and click submit button
      const submitButtons = [
        'button[type="submit"]',
        'input[type="submit"]', 
        'button:has-text("Search")',
        'button:has-text("Find Plans")',
        'button:has-text("Shop")',
        '[data-zip-submit]'
      ];
      
      let submitted = false;
      for (const buttonSelector of submitButtons) {
        const button = await this.page.$(buttonSelector);
        if (button) {
          console.log(`📋 Found submit button: ${buttonSelector}`);
          
          // Wait for potential navigation or API calls
          const [response] = await Promise.all([
            this.page.waitForResponse(res => res.url().includes('/api/') || res.url().includes('/texas/'), { timeout: 5000 }).catch(() => null),
            button.click()
          ]);
          
          submitted = true;
          
          if (response) {
            console.log(`📡 Response received: ${response.url()} - Status: ${response.status()}`);
          }
          
          break;
        }
      }
      
      if (!submitted) {
        // Try pressing Enter
        await this.page.press(selector, 'Enter');
        console.log('⌨️ Tried pressing Enter');
      }
      
      // Wait a moment for any changes
      await this.page.waitForTimeout(2000);
      
      // Take screenshot after submission
      const afterScreenshot = await this.takeScreenshot(`after-submit-${zipCode}`, `After submitting ${zipCode}`);
      
      // Check for error messages
      const errorElements = await this.page.$$eval(
        '.error, [class*="error"], .invalid, [class*="invalid"], [role="alert"]',
        elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );
      
      // Check current URL for navigation
      const currentUrl = this.page.url();
      const urlChanged = !currentUrl.includes('localhost:4325/') || currentUrl !== BASE_URL;
      
      return {
        zipCode,
        selector,
        beforeScreenshot,
        afterScreenshot,
        errors: errorElements,
        urlChanged,
        currentUrl,
        submitted,
        success: expectSuccess ? errorElements.length === 0 : errorElements.length > 0
      };
      
    } catch (error) {
      console.error(`❌ Error testing ZIP input: ${error.message}`);
      const errorScreenshot = await this.takeScreenshot(`error-${zipCode}`, `Error testing ${zipCode}`);
      
      return {
        zipCode,
        selector,
        error: error.message,
        errorScreenshot,
        success: false
      };
    }
  }

  async testPage(url, testName, validZip, invalidZip) {
    console.log(`\n🌐 Testing ${testName}: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(1000);
      
      // Take initial screenshot
      const initialScreenshot = await this.takeScreenshot(`${testName}-initial`, `Initial state of ${testName}`);
      
      // Find ZIP inputs
      const zipInputs = await this.findZipInputs();
      
      if (zipInputs.length === 0) {
        console.log('⚠️  No ZIP inputs found on this page');
        return {
          testName,
          url,
          initialScreenshot,
          zipInputs: [],
          results: [],
          success: false,
          error: 'No ZIP inputs found'
        };
      }
      
      const results = [];
      
      // Test each ZIP input found
      for (let i = 0; i < zipInputs.length; i++) {
        const zipInput = zipInputs[i];
        const selector = zipInput.id ? `#${zipInput.id}` : `.${zipInput.className.split(' ')[0]}`;
        
        console.log(`\n📝 Testing ZIP input ${i + 1}/${zipInputs.length}`);
        
        // Test with valid ZIP
        if (validZip) {
          const validResult = await this.testZipInput(selector, validZip, true);
          results.push({ ...validResult, inputInfo: zipInput, testType: 'valid' });
          
          // Navigate back to original page if URL changed
          if (validResult.urlChanged) {
            await this.page.goto(url, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(1000);
          }
        }
        
        // Test with invalid ZIP
        if (invalidZip) {
          const invalidResult = await this.testZipInput(selector, invalidZip, false);
          results.push({ ...invalidResult, inputInfo: zipInput, testType: 'invalid' });
          
          // Navigate back to original page if URL changed
          if (invalidResult.urlChanged) {
            await this.page.goto(url, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(1000);
          }
        }
      }
      
      return {
        testName,
        url,
        initialScreenshot,
        zipInputs,
        results,
        success: results.every(r => r.success)
      };
      
    } catch (error) {
      console.error(`❌ Error testing page ${testName}: ${error.message}`);
      const errorScreenshot = await this.takeScreenshot(`${testName}-error`, `Error on ${testName}`);
      
      return {
        testName,
        url,
        error: error.message,
        errorScreenshot,
        success: false
      };
    }
  }

  async runAllTests() {
    console.log('🎯 Starting comprehensive ZIP functionality tests...\n');
    
    const testSuite = [
      {
        name: 'homepage',
        url: BASE_URL,
        validZip: '75201',
        invalidZip: '12345'
      },
      {
        name: 'houston-city-page',
        url: `${BASE_URL}/texas/houston-tx`,
        validZip: '77001',
        invalidZip: 'abcd'
      },
      {
        name: 'shop-cheapest',
        url: `${BASE_URL}/shop/cheapest-electricity`,
        validZip: '78701',
        invalidZip: '123'
      }
    ];
    
    for (const test of testSuite) {
      const result = await this.testPage(test.url, test.name, test.validZip, test.invalidZip);
      TEST_RESULTS.push(result);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: TEST_RESULTS.length,
        successful: TEST_RESULTS.filter(r => r.success).length,
        failed: TEST_RESULTS.filter(r => !r.success).length
      },
      results: TEST_RESULTS,
      recommendations: []
    };
    
    // Add recommendations based on results
    const failedTests = TEST_RESULTS.filter(r => !r.success);
    if (failedTests.length > 0) {
      report.recommendations.push('❌ Some ZIP functionality tests failed - requires immediate attention');
      failedTests.forEach(test => {
        report.recommendations.push(`- Fix ZIP inputs on ${test.testName} (${test.url})`);
      });
    }
    
    const pagesWithoutZipInputs = TEST_RESULTS.filter(r => r.zipInputs && r.zipInputs.length === 0);
    if (pagesWithoutZipInputs.length > 0) {
      report.recommendations.push('⚠️ Some pages are missing ZIP input functionality');
    }
    
    // Save detailed report
    const reportPath = path.join(ARTIFACT_DIR, 'zip-functionality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(ARTIFACT_DIR, 'ZIP-TEST-REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📋 Reports saved:`);
    console.log(`- JSON: ${reportPath}`);
    console.log(`- Markdown: ${markdownPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { testSummary, results, recommendations } = report;
    
    let markdown = `# ChooseMyPower ZIP Functionality Test Report\n\n`;
    markdown += `**Generated**: ${new Date().toLocaleString()}\n`;
    markdown += `**Test Environment**: ${BASE_URL}\n\n`;
    
    markdown += `## Executive Summary\n\n`;
    markdown += `- **Total Tests**: ${testSummary.totalTests}\n`;
    markdown += `- **Successful**: ${testSummary.successful}\n`;
    markdown += `- **Failed**: ${testSummary.failed}\n`;
    markdown += `- **Success Rate**: ${((testSummary.successful / testSummary.totalTests) * 100).toFixed(1)}%\n\n`;
    
    markdown += `## Test Results by Page\n\n`;
    
    results.forEach((result, index) => {
      markdown += `### ${index + 1}. ${result.testName.toUpperCase()}\n`;
      markdown += `**URL**: ${result.url}\n`;
      markdown += `**Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n\n`;
      
      if (result.error) {
        markdown += `**Error**: ${result.error}\n\n`;
      }
      
      if (result.zipInputs && result.zipInputs.length > 0) {
        markdown += `**ZIP Inputs Found**: ${result.zipInputs.length}\n\n`;
        
        result.zipInputs.forEach((input, i) => {
          markdown += `#### Input ${i + 1}\n`;
          markdown += `- **ID**: ${input.id || 'None'}\n`;
          markdown += `- **Class**: ${input.className || 'None'}\n`;
          markdown += `- **Placeholder**: ${input.placeholder || 'None'}\n`;
          markdown += `- **Form Context**: ${input.parentForm}\n\n`;
        });
      } else {
        markdown += `**ZIP Inputs Found**: None ⚠️\n\n`;
      }
      
      if (result.results && result.results.length > 0) {
        markdown += `#### Test Results:\n\n`;
        result.results.forEach(test => {
          markdown += `- **ZIP Code**: ${test.zipCode} (${test.testType})\n`;
          markdown += `  - Status: ${test.success ? '✅' : '❌'}\n`;
          markdown += `  - Submitted: ${test.submitted ? 'Yes' : 'No'}\n`;
          markdown += `  - URL Changed: ${test.urlChanged ? 'Yes' : 'No'}\n`;
          if (test.errors && test.errors.length > 0) {
            markdown += `  - Errors: ${test.errors.join(', ')}\n`;
          }
          markdown += `\n`;
        });
      }
      
      markdown += `---\n\n`;
    });
    
    if (recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      recommendations.forEach(rec => {
        markdown += `${rec}\n\n`;
      });
    }
    
    markdown += `## Screenshots\n\n`;
    markdown += `All test screenshots are saved in the artifacts directory:\n`;
    markdown += `\`./artifacts/20250904_163137/\`\n\n`;
    
    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Run the test suite
async function main() {
  const tester = new ZipTester();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
    const report = await tester.generateReport();
    
    console.log('\n🎉 Test suite completed!');
    console.log(`📊 Results: ${report.testSummary.successful}/${report.testSummary.totalTests} tests passed`);
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  } finally {
    await tester.cleanup();
  }
}

// Run the main function
main().catch(console.error);

export { ZipTester };