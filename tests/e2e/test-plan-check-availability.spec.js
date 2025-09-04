/**
 * Plan Details Check Availability Button Test
 * 
 * Tests the "Check Availability" button functionality that was discovered in the modal
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = './artifacts/20250904-174752';

test.describe('Plan Details Check Availability Flow', () => {
  let page;
  let context;
  
  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
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
  });
  
  test.afterEach(async () => {
    await context.close();
  });

  test('Test Check Availability Button Functionality', async () => {
    console.log('Testing Check Availability button functionality...');
    
    const planUrl = 'http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12';
    
    // Navigate to plan page
    await page.goto(planUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Click Select This Plan button
    const selectButton = await page.locator('button:has-text("Select This Plan")');
    await selectButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(2000);
    
    // Find modal
    const modal = await page.locator('[role="dialog"]');
    
    // Fill form fields
    await modal.locator('input[name="address"]').fill('123 Main St');
    await modal.locator('input[name="zip"]').fill('75001');
    
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, '07-before-check-availability.png'),
      fullPage: true 
    });
    
    // Click the Check Availability button
    const checkAvailabilityButton = modal.locator('button:has-text("Check Availability")');
    
    console.log('Clicking Check Availability button...');
    await checkAvailabilityButton.click();
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`URL after Check Availability: ${currentUrl}`);
    
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, '08-after-check-availability.png'),
      fullPage: true 
    });
    
    // Check if redirected to external site
    if (currentUrl.includes('comparepower.com') || currentUrl.includes('powertochoose')) {
      console.log('✅ Successfully redirected to external provider');
      
      const finalScreenshot = path.join(ARTIFACT_DIR, '09-external-site-redirect.png');
      await page.screenshot({ path: finalScreenshot, fullPage: true });
      
    } else if (currentUrl !== planUrl) {
      console.log('⚠️ Redirected to unexpected URL:', currentUrl);
      
    } else {
      console.log('⚠️ No redirect occurred - still on original page');
      
      // Check if modal is still open or closed
      const modalStillOpen = await modal.isVisible();
      console.log(`Modal still visible: ${modalStillOpen}`);
      
      // Look for any success/error messages
      const messages = await page.locator('.alert, .message, .notification, [role="alert"]').allTextContents();
      if (messages.length > 0) {
        console.log('Messages found:', messages);
      }
    }
    
    // Final summary
    const summary = {
      testUrl: planUrl,
      checkAvailabilityClicked: true,
      finalUrl: currentUrl,
      redirectedToExternal: currentUrl.includes('comparepower.com') || currentUrl.includes('powertochoose'),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'check-availability-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('Check Availability Test Summary:', summary);
  });
});