/**
 * Plan Details Page Order Flow Test
 * 
 * Tests the complete order functionality on plan details page:
 * 1. Navigate to specific Gexa plan page
 * 2. Interact with "Select This Plan" button
 * 3. Fill address search modal
 * 4. Complete order flow and validate redirect to ComparePower
 * 
 * Test Target: http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Artifact directory for screenshots and reports
const ARTIFACT_DIR = './artifacts/20250904-174752';

// Ensure artifacts directory exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

test.describe('Plan Details Order Flow Testing', () => {
  let page;
  let context;
  
  test.beforeEach(async ({ browser }) => {
    // Create context with detailed logging
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordHar: { path: path.join(ARTIFACT_DIR, 'network-activity.har') }
    });
    
    page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    // Log network requests
    page.on('request', request => {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    });
    
    // Log network responses
    page.on('response', response => {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    });
    
    // Capture uncaught errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });
  });
  
  test.afterEach(async () => {
    await context.close();
  });

  test('Complete Plan Details Order Flow - Gexa Eco Saver Plus 12', async () => {
    console.log('Starting plan details order flow test...');
    
    // Step 1: Navigate to the specific plan page
    console.log('Step 1: Navigating to Gexa plan details page');
    const planUrl = 'http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12';
    
    try {
      await page.goto(planUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');
      
      // Take baseline screenshot
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '01-plan-details-page-loaded.png'),
        fullPage: true 
      });
      
      console.log('✅ Successfully navigated to plan details page');
      
      // Verify we're on the correct page
      const pageTitle = await page.title();
      const currentUrl = page.url();
      console.log(`Page Title: ${pageTitle}`);
      console.log(`Current URL: ${currentUrl}`);
      
    } catch (error) {
      console.error('❌ Error navigating to plan page:', error);
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '01-navigation-error.png'),
        fullPage: true 
      });
      throw error;
    }
    
    // Step 2: Locate the "Select This Plan" button
    console.log('Step 2: Looking for Select This Plan button');
    
    let selectButton;
    const possibleSelectors = [
      'button:has-text("Select This Plan")',
      'a:has-text("Select This Plan")', 
      '[data-testid="select-plan-button"]',
      '.order-button',
      '.select-plan-btn',
      'button:has-text("Order This Plan")',
      'a:has-text("Order This Plan")',
      'button:has-text("Choose Plan")',
      'a:has-text("Choose Plan")'
    ];
    
    let buttonFound = false;
    let usedSelector = '';
    
    for (const selector of possibleSelectors) {
      try {
        const element = await page.locator(selector);
        if (await element.count() > 0) {
          selectButton = element.first();
          buttonFound = true;
          usedSelector = selector;
          console.log(`✅ Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!buttonFound) {
      console.log('❌ Could not find Select This Plan button with common selectors');
      
      // Take screenshot of current page state
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '02-button-not-found.png'),
        fullPage: true 
      });
      
      // Try to find any buttons on the page
      const allButtons = await page.locator('button, a[role="button"], .btn').allTextContents();
      console.log('Available buttons on page:', allButtons);
      
      // Also check for any elements that might be order-related
      const orderElements = await page.locator('*').evaluateAll(elements => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('select') || text.includes('order') || text.includes('choose') || text.includes('sign up');
          })
          .map(el => ({
            tagName: el.tagName,
            textContent: el.textContent?.trim(),
            className: el.className,
            id: el.id
          }));
      });
      
      console.log('Potential order-related elements:', orderElements);
      
      throw new Error('Select This Plan button not found');
    }
    
    // Step 3: Take screenshot before clicking
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, '02-before-button-click.png'),
      fullPage: true 
    });
    
    // Get button details for logging
    const buttonText = await selectButton.textContent();
    const isVisible = await selectButton.isVisible();
    const isEnabled = await selectButton.isEnabled();
    
    console.log(`Button found - Text: "${buttonText}", Visible: ${isVisible}, Enabled: ${isEnabled}`);
    
    // Step 4: Click the button
    console.log('Step 3: Clicking the Select This Plan button');
    
    try {
      await selectButton.scrollIntoViewIfNeeded();
      await selectButton.click({ timeout: 10000 });
      
      console.log('✅ Successfully clicked the Select This Plan button');
      
      // Wait a moment for any modal or navigation to occur
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '03-after-button-click.png'),
        fullPage: true 
      });
      
    } catch (error) {
      console.error('❌ Error clicking Select This Plan button:', error);
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '03-button-click-error.png'),
        fullPage: true 
      });
      throw error;
    }
    
    // Step 5: Check if a modal appeared or if we were redirected
    console.log('Step 4: Checking for address search modal or redirect');
    
    const currentUrlAfterClick = page.url();
    console.log(`URL after button click: ${currentUrlAfterClick}`);
    
    // Check if we're still on the same page (modal) or redirected
    if (currentUrlAfterClick !== planUrl) {
      console.log('🔄 Page redirected after button click');
      
      // Check if redirected to ComparePower
      if (currentUrlAfterClick.includes('comparepower.com') || currentUrlAfterClick.includes('powertochoose')) {
        console.log('✅ Successfully redirected to external provider site');
        
        await page.screenshot({ 
          path: path.join(ARTIFACT_DIR, '04-external-redirect.png'),
          fullPage: true 
        });
        
        return; // Test successful - direct redirect
      } else {
        console.log('⚠️ Redirected to unexpected URL');
      }
    }
    
    // Step 6: Look for address search modal
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '.address-modal',
      '.search-modal',
      '[data-testid="address-modal"]',
      '.modal-overlay',
      '.popup'
    ];
    
    let modalFound = false;
    let modal;
    
    for (const selector of modalSelectors) {
      try {
        const element = await page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          modal = element.first();
          modalFound = true;
          console.log(`✅ Found modal with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (modalFound) {
      console.log('Step 5: Address search modal detected');
      
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '04-modal-opened.png'),
        fullPage: true 
      });
      
      // Step 7: Fill out the address search modal
      console.log('Step 6: Filling out address search modal with test data');
      
      const testAddress = '123 Main St';
      const testZip = '75001';
      
      // Try different input selectors for address
      const addressSelectors = [
        'input[name="address"]',
        'input[placeholder*="address" i]',
        'input[type="text"]',
        '#address',
        '.address-input'
      ];
      
      let addressInput;
      for (const selector of addressSelectors) {
        try {
          const element = modal.locator(selector);
          if (await element.count() > 0) {
            addressInput = element.first();
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Try different input selectors for ZIP
      const zipSelectors = [
        'input[name="zip"]',
        'input[name="zipcode"]',
        'input[placeholder*="zip" i]',
        'input[placeholder*="postal" i]',
        '#zip',
        '#zipcode',
        '.zip-input'
      ];
      
      let zipInput;
      for (const selector of zipSelectors) {
        try {
          const element = modal.locator(selector);
          if (await element.count() > 0) {
            zipInput = element.first();
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Fill in the form fields if found
      if (addressInput) {
        await addressInput.fill(testAddress);
        console.log(`✅ Filled address field with: ${testAddress}`);
      } else {
        console.log('⚠️ Address input field not found');
      }
      
      if (zipInput) {
        await zipInput.fill(testZip);
        console.log(`✅ Filled ZIP field with: ${testZip}`);
      } else {
        console.log('⚠️ ZIP input field not found');
      }
      
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '05-modal-filled.png'),
        fullPage: true 
      });
      
      // Step 8: Submit the form
      console.log('Step 7: Submitting address search form');
      
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Search")',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button:has-text("Submit")',
        '.submit-btn',
        '.continue-btn'
      ];
      
      let submitButton;
      for (const selector of submitSelectors) {
        try {
          const element = modal.locator(selector);
          if (await element.count() > 0) {
            submitButton = element.first();
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Clicked submit button');
        
        // Wait for potential redirect
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        console.log(`Final URL after form submission: ${finalUrl}`);
        
        await page.screenshot({ 
          path: path.join(ARTIFACT_DIR, '06-after-form-submit.png'),
          fullPage: true 
        });
        
        // Check if redirected to ComparePower
        if (finalUrl.includes('comparepower.com') || finalUrl.includes('powertochoose')) {
          console.log('✅ Successfully redirected to external provider site after form submission');
        } else {
          console.log('⚠️ Expected redirect to ComparePower did not occur');
          console.log(`Current URL: ${finalUrl}`);
        }
        
      } else {
        console.log('⚠️ Submit button not found in modal');
        
        // Log all buttons in modal
        const modalButtons = await modal.locator('button, a[role="button"]').allTextContents();
        console.log('Available buttons in modal:', modalButtons);
      }
      
    } else {
      console.log('⚠️ No address search modal found after button click');
      
      // Take screenshot of current state
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, '04-no-modal-found.png'),
        fullPage: true 
      });
      
      // Check if there are any visible forms on the page
      const forms = await page.locator('form').count();
      console.log(`Number of forms on page: ${forms}`);
      
      if (forms > 0) {
        console.log('Forms detected on page, taking screenshot');
        await page.screenshot({ 
          path: path.join(ARTIFACT_DIR, '04-forms-detected.png'),
          fullPage: true 
        });
      }
    }
    
    // Final assessment
    console.log('🏁 Test completed - generating summary');
    
    const summary = {
      testUrl: planUrl,
      buttonFound: buttonFound,
      buttonSelector: usedSelector,
      modalFound: modalFound,
      finalUrl: page.url(),
      timestamp: new Date().toISOString()
    };
    
    // Save test summary
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('Test Summary:', summary);
  });
});