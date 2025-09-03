import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * Diagnostic Test for Address Modal
 * This test will analyze what's actually on the page and try different approaches
 */

const BASE_URL = 'http://localhost:4324';
const PLAN_URL = `${BASE_URL}/electricity-plans/plans/rhythm-energy/rhythm-saver-12`;

// Create artifacts directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACTS_DIR = `./artifacts/${timestamp}_diagnostic_test`;
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runDiagnosticTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Set up logging
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

  try {
    console.log('🔍 Starting diagnostic test...');
    
    // Test 1: Navigate to plan page
    console.log('📍 Test 1: Navigating to plan page...');
    await page.goto(PLAN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // Give React time to hydrate
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, '1_plan_page_loaded.png'),
      fullPage: true 
    });
    
    // Test 2: Extract all text content
    console.log('📍 Test 2: Analyzing page content...');
    const pageText = await page.textContent('body');
    console.log('📝 Page text content (first 500 chars):', pageText?.substring(0, 500));
    
    // Test 3: Find all buttons
    console.log('📍 Test 3: Finding all buttons...');
    const allButtons = await page.locator('button').allTextContents();
    console.log('🔘 All buttons found:', allButtons);
    
    // Test 4: Find all links
    console.log('📍 Test 4: Finding all links...');
    const allLinks = await page.locator('a').allTextContents();
    console.log('🔗 All links found:', allLinks.slice(0, 10)); // First 10 links
    
    // Test 5: Look for specific plan-related elements
    console.log('📍 Test 5: Looking for plan-related elements...');
    
    const selectors = [
      '[data-testid*="plan"]',
      '[data-testid*="select"]',
      '[class*="plan"]',
      '[class*="select"]',
      '[class*="button"]',
      'button[class*="primary"]',
      'button[class*="cta"]',
      '.btn',
      '.button'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          const texts = await page.locator(selector).allTextContents();
          console.log(`✅ Found ${elements.length} elements with selector "${selector}":`, texts);
        }
      } catch (e) {
        // Selector not found or invalid
      }
    }
    
    // Test 6: Check for React hydration
    console.log('📍 Test 6: Checking React hydration status...');
    const reactFound = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasReactDOM: typeof window.ReactDOM !== 'undefined',
        hasReactRoot: document.querySelector('[data-reactroot]') !== null,
        bodyClasses: document.body.className,
        hasHydratedElements: document.querySelectorAll('[data-react-*]').length > 0
      };
    });
    
    console.log('⚛️ React status:', reactFound);
    
    // Test 7: Check for modal-related elements
    console.log('📍 Test 7: Looking for modal elements...');
    const modalSelectors = [
      '[data-testid*="modal"]',
      '[role="dialog"]',
      '[class*="modal"]',
      '[class*="dialog"]',
      '[data-testid*="address"]'
    ];
    
    for (const selector of modalSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`🗂️ Found ${count} modal elements with selector: ${selector}`);
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Test 8: Try to interact with any found buttons
    console.log('📍 Test 8: Testing button interactions...');
    const buttons = await page.locator('button').all();
    console.log(`🔘 Total buttons found: ${buttons.length}`);
    
    if (buttons.length > 0) {
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        try {
          const buttonText = await buttons[i].textContent();
          const isVisible = await buttons[i].isVisible();
          const isEnabled = await buttons[i].isEnabled();
          console.log(`Button ${i + 1}: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);
          
          if (buttonText && (
            buttonText.toLowerCase().includes('select') || 
            buttonText.toLowerCase().includes('choose') ||
            buttonText.toLowerCase().includes('order')
          )) {
            console.log(`🎯 Found relevant button: "${buttonText}"`);
            
            // Try clicking it
            if (isVisible && isEnabled) {
              await buttons[i].click();
              await page.waitForTimeout(2000);
              
              await page.screenshot({ 
                path: path.join(ARTIFACTS_DIR, `2_after_clicking_${i}.png`),
                fullPage: true 
              });
              
              // Check if modal appeared
              const modalCount = await page.locator('[role="dialog"], [data-testid*="modal"]').count();
              console.log(`Modal count after click: ${modalCount}`);
            }
          }
        } catch (e) {
          console.log(`❌ Error testing button ${i}: ${e.message}`);
        }
      }
    }
    
    // Save diagnostic report
    const report = {
      timestamp: new Date().toISOString(),
      url: PLAN_URL,
      pageText: pageText?.substring(0, 1000),
      buttonsFound: allButtons,
      linksFound: allLinks.slice(0, 20),
      reactStatus: reactFound,
      logs: logs,
      totalButtons: buttons.length
    };
    
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'diagnostic_report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Diagnostic test completed!');
    console.log(`📊 Report saved to: ${path.join(ARTIFACTS_DIR, 'diagnostic_report.json')}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error.message);
    
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'error_screenshot.png'),
      fullPage: true 
    });
    
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

runDiagnosticTest()
  .then(report => {
    console.log('\n🎉 Diagnostic completed successfully!');
    console.log(`📁 Artifacts saved to: ${ARTIFACTS_DIR}`);
  })
  .catch(error => {
    console.error('\n💥 Diagnostic failed:', error.message);
    process.exit(1);
  });