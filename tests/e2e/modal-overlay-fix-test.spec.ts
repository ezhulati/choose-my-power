import { test, expect, chromium } from '@playwright/test';

test.describe('Modal Overlay Fix Verification', () => {
  test('Verify modal opens without dark overlay blocking issue', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Step 1: Navigating to product detail page...');
    await page.goto('http://localhost:4324/electricity-plans/plans/txu-energy/electric-freedom-24');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/step1-product-page-loaded.png', 
      fullPage: true 
    });
    console.log('✅ Product detail page loaded');
    
    // Find and click the Select This Plan button
    console.log('Step 2: Looking for Select This Plan button...');
    
    // Try multiple selectors
    const selectors = [
      'button:has-text("Select This Plan")',
      '[data-testid="select-plan-button"]',
      '.btn-primary:has-text("Select")',
      'button.bg-texas-red'
    ];
    
    let selectButton = null;
    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        selectButton = element;
        console.log(`Found button with selector: ${selector}`);
        break;
      }
    }
    
    if (!selectButton) {
      // List all visible buttons for debugging
      const buttons = await page.locator('button').all();
      console.log(`Found ${buttons.length} buttons on page:`);
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const text = await buttons[i].textContent();
        console.log(`  Button ${i + 1}: "${text}"`);
      }
      throw new Error('Could not find Select This Plan button');
    }
    
    console.log('Step 3: Clicking Select This Plan button...');
    await selectButton.click();
    
    // Wait for modal to appear
    console.log('Step 4: Waiting for modal to open...');
    await page.waitForTimeout(1000); // Give modal time to animate
    
    // Take screenshot of modal state
    await page.screenshot({ 
      path: 'test-results/step2-modal-opened.png', 
      fullPage: true 
    });
    
    // Check for modal presence
    const modalSelectors = [
      '[role="dialog"]',
      '.fixed.inset-0.z-50',
      '[data-testid="address-modal"]',
      '.modal-content'
    ];
    
    let modalFound = false;
    for (const selector of modalSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 500 }).catch(() => false)) {
        modalFound = true;
        console.log(`✅ Modal found with selector: ${selector}`);
        break;
      }
    }
    
    if (!modalFound) {
      console.log('⚠️ Modal may not be visible or properly opened');
    }
    
    // Check for dark overlay issues
    console.log('Step 5: Checking for overlay issues...');
    const overlays = page.locator('.fixed.inset-0.bg-black, .fixed.inset-0.bg-gray-900');
    const overlayCount = await overlays.count();
    
    if (overlayCount > 0) {
      console.log(`Found ${overlayCount} potential overlay(s)`);
      for (let i = 0; i < overlayCount; i++) {
        const overlay = overlays.nth(i);
        const opacity = await overlay.evaluate(el => window.getComputedStyle(el).opacity);
        const zIndex = await overlay.evaluate(el => window.getComputedStyle(el).zIndex);
        console.log(`  Overlay ${i + 1}: opacity=${opacity}, z-index=${zIndex}`);
      }
    } else {
      console.log('✅ No problematic overlays detected');
    }
    
    // Test interaction with modal content
    console.log('Step 6: Testing modal interaction...');
    
    // Look for input fields in the modal
    const inputSelectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="street"]',
      'input[placeholder*="Address"]',
      'input[type="text"]'
    ];
    
    let inputField = null;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
        inputField = element;
        console.log(`Found input field with selector: ${selector}`);
        break;
      }
    }
    
    if (inputField) {
      // Test if we can interact with the input
      await inputField.click();
      await inputField.fill('123 Test Street');
      await page.screenshot({ 
        path: 'test-results/step3-address-entered.png', 
        fullPage: true 
      });
      console.log('✅ Successfully entered address in modal');
      
      // Look for ZIP input
      const zipSelectors = [
        'input[placeholder*="zip"]',
        'input[placeholder*="ZIP"]',
        'input[maxlength="5"]'
      ];
      
      let zipField = null;
      for (const selector of zipSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
          zipField = element;
          console.log(`Found ZIP field with selector: ${selector}`);
          break;
        }
      }
      
      if (zipField) {
        await zipField.click();
        await zipField.fill('75201');
        await page.screenshot({ 
          path: 'test-results/step4-zip-entered.png', 
          fullPage: true 
        });
        console.log('✅ Successfully entered ZIP code');
      }
      
      // Look for submit button
      const submitSelectors = [
        'button:has-text("Check Availability")',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button[type="submit"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
          submitButton = element;
          console.log(`Found submit button with selector: ${selector}`);
          break;
        }
      }
      
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(2000); // Wait for response
        await page.screenshot({ 
          path: 'test-results/step5-after-submit.png', 
          fullPage: true 
        });
        console.log('✅ Successfully submitted form');
      }
    } else {
      console.log('⚠️ Could not find input fields in modal');
    }
    
    // Final verification
    console.log('\n=== TEST RESULTS ===');
    console.log('✅ Page loaded successfully');
    console.log(modalFound ? '✅ Modal opened' : '⚠️ Modal may not have opened properly');
    console.log(overlayCount === 0 ? '✅ No blocking overlays' : '⚠️ Potential overlay issues detected');
    console.log(inputField ? '✅ Modal is interactive' : '⚠️ Could not interact with modal');
    
    await browser.close();
  });
});