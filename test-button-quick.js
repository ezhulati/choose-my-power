import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true // Run in headless mode for quick testing
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`[ERROR]:`, text);
    }
  });
  
  console.log('🔍 Testing "Select This Plan" button functionality...\n');
  
  try {
    // Navigate to the product detail page
    const url = 'http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';
    console.log(`📍 Navigating to product page...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check if the button exists
    const buttonSelector = 'button:has-text("Select This Plan")';
    const buttonExists = await page.locator(buttonSelector).count();
    
    if (buttonExists === 0) {
      console.log('❌ FAILED: Button not found on page');
      process.exit(1);
    }
    
    console.log('✅ Button found on page');
    
    const button = page.locator(buttonSelector).first();
    
    // Check if button is visible and enabled
    const isVisible = await button.isVisible();
    const isEnabled = await button.isEnabled();
    
    if (!isVisible) {
      console.log('❌ FAILED: Button is not visible');
      process.exit(1);
    }
    
    if (!isEnabled) {
      console.log('❌ FAILED: Button is disabled');
      process.exit(1);
    }
    
    console.log('✅ Button is visible and enabled');
    
    // Try clicking the button with force option to bypass any overlapping elements
    console.log('🖱️ Attempting to click button...');
    
    // Set up modal listener before clicking
    const modalPromise = page.waitForSelector('[role="dialog"], .modal, [data-state="open"]', { 
      timeout: 3000 
    }).catch(() => null);
    
    try {
      // Try regular click first
      await button.click({ timeout: 3000 });
      console.log('✅ Button clicked successfully!');
    } catch (clickError) {
      // If regular click fails, try force click
      console.log('⚠️ Regular click failed, trying force click...');
      try {
        await button.click({ force: true, timeout: 3000 });
        console.log('✅ Force click successful!');
      } catch (forceClickError) {
        console.log('❌ FAILED: Could not click button');
        console.log('   Error:', clickError.message);
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-click-failed.png', fullPage: true });
        console.log('📸 Debug screenshot saved as debug-click-failed.png');
        process.exit(1);
      }
    }
    
    // Wait for modal or any response
    await page.waitForTimeout(1500);
    
    // Check if modal appeared
    const modal = await modalPromise;
    if (modal) {
      console.log('✅ SUCCESS: Modal opened after clicking button!');
      
      // Check if it's the address search modal
      const modalTitle = await page.locator('[role="dialog"] h2, .modal h2, h2:has-text("Check Service Availability")').textContent().catch(() => null);
      if (modalTitle) {
        console.log(`   Modal title: "${modalTitle}"`);
      }
      
      // Take a screenshot of the modal
      await page.screenshot({ path: 'success-modal-opened.png', fullPage: true });
      console.log('📸 Success screenshot saved as success-modal-opened.png');
      
      console.log('\n✅ TEST PASSED: Button is working correctly!');
    } else {
      // Check if URL changed (might navigate instead of modal)
      const newUrl = page.url();
      if (newUrl !== url) {
        console.log(`⚠️ URL changed to: ${newUrl}`);
        console.log('   Button triggered navigation instead of modal');
      } else {
        console.log('❌ FAILED: No modal appeared and URL did not change');
        await page.screenshot({ path: 'debug-no-response.png', fullPage: true });
        console.log('📸 Debug screenshot saved as debug-no-response.png');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 Test completed');
  process.exit(0);
})();