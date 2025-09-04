import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // Show the browser UI for debugging
    devtools: true   // Open DevTools automatically
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      console.log(`[${type.toUpperCase()}]:`, text);
    }
  });
  
  // Log any page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });
  
  console.log('🔍 Starting button debugging test...\n');
  
  try {
    // Navigate to the product detail page
    const url = 'http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12';
    console.log(`📍 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for the page to fully render
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: 'debug-full-page.png', 
      fullPage: true 
    });
    console.log('📸 Full page screenshot saved as debug-full-page.png');
    
    // Check if the button exists
    console.log('\n🔎 Checking for "Select This Plan" button...');
    const buttonSelector = 'button:has-text("Select This Plan")';
    const buttonExists = await page.locator(buttonSelector).count();
    
    if (buttonExists === 0) {
      console.log('❌ Button NOT FOUND! Searching for alternative selectors...');
      
      // Try different selectors
      const alternativeSelectors = [
        'button:text("Select This Plan")',
        'button:text-is("Select This Plan")',
        'button >> text="Select This Plan"',
        'text="Select This Plan"',
        '*:text("Select This Plan")'
      ];
      
      for (const selector of alternativeSelectors) {
        const count = await page.locator(selector).count();
        console.log(`   Selector "${selector}": ${count} elements found`);
      }
    } else {
      console.log(`✅ Button found! (${buttonExists} instance(s))`);
      
      // Get button properties
      const button = page.locator(buttonSelector).first();
      
      // Check if button is visible
      const isVisible = await button.isVisible();
      console.log(`   Visibility: ${isVisible ? '✅ Visible' : '❌ Hidden'}`);
      
      // Check if button is enabled
      const isEnabled = await button.isEnabled();
      console.log(`   Enabled: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      
      // Get button bounding box
      const box = await button.boundingBox();
      if (box) {
        console.log(`   Position: x=${box.x}, y=${box.y}`);
        console.log(`   Size: ${box.width}x${box.height}`);
      }
      
      // Check for click handlers
      console.log('\n🔧 Checking button attributes and handlers...');
      const buttonAttrs = await button.evaluate(el => {
        const attrs = {};
        for (let attr of el.attributes) {
          attrs[attr.name] = attr.value;
        }
        
        // Check for onClick handlers
        const hasOnClick = !!el.onclick;
        const hasEventListeners = typeof el._reactInternalFiber !== 'undefined' || 
                                 typeof el.__reactInternalInstance !== 'undefined' ||
                                 typeof el._reactInternalInstance !== 'undefined';
        
        return {
          attributes: attrs,
          hasOnClick,
          hasReactHandlers: hasEventListeners,
          className: el.className,
          disabled: el.disabled,
          type: el.type,
          tagName: el.tagName
        };
      });
      
      console.log('   Button properties:', JSON.stringify(buttonAttrs, null, 2));
      
      // Check for overlapping elements
      console.log('\n🔍 Checking for overlapping elements...');
      const elementAtCenter = await page.evaluate(({ x, y, width, height }) => {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const element = document.elementFromPoint(centerX, centerY);
        if (element) {
          return {
            tagName: element.tagName,
            className: element.className,
            text: element.textContent?.substring(0, 50)
          };
        }
        return null;
      }, box);
      
      if (elementAtCenter) {
        console.log('   Element at button center:', elementAtCenter);
      }
      
      // Scroll button into view and highlight it
      await button.scrollIntoViewIfNeeded();
      await button.evaluate(el => {
        el.style.border = '3px solid red';
        el.style.boxShadow = '0 0 10px red';
      });
      
      // Take screenshot of the button area
      await button.screenshot({ path: 'debug-button.png' });
      console.log('📸 Button screenshot saved as debug-button.png');
      
      // Try clicking the button
      console.log('\n🖱️ Attempting to click the button...');
      
      // Set up response listeners before clicking
      const modalPromise = page.waitForSelector('[role="dialog"], .modal, [data-state="open"]', { 
        timeout: 5000 
      }).catch(() => null);
      
      try {
        await button.click({ timeout: 5000 });
        console.log('✅ Button clicked successfully!');
        
        // Wait a moment for any action to occur
        await page.waitForTimeout(2000);
        
        // Check if modal opened
        const modal = await modalPromise;
        if (modal) {
          console.log('✅ Modal appeared after click!');
          await page.screenshot({ path: 'debug-modal.png', fullPage: true });
          console.log('📸 Modal screenshot saved as debug-modal.png');
          
          // Check modal content
          const modalText = await modal.textContent();
          console.log(`   Modal content preview: ${modalText?.substring(0, 100)}...`);
        } else {
          console.log('❌ No modal appeared after click');
          
          // Check if URL changed
          const newUrl = page.url();
          if (newUrl !== url) {
            console.log(`   URL changed to: ${newUrl}`);
          } else {
            console.log('   URL did not change');
          }
          
          // Take another screenshot to see what changed
          await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
          console.log('📸 Post-click screenshot saved as debug-after-click.png');
        }
        
      } catch (clickError) {
        console.log('❌ Error clicking button:', clickError.message);
      }
      
      // Check console for errors
      console.log('\n📋 Checking browser console for errors...');
      const consoleErrors = await page.evaluate(() => {
        const errors = [];
        // Check if there are any console errors in memory
        if (window.console && window.console.memory) {
          // This won't work directly, but we've already set up console listeners
        }
        return errors;
      });
    }
    
    // Check for API endpoints
    console.log('\n🌐 Checking API endpoints...');
    const apiEndpoints = [
      '/api/plans/search',
      '/api/ercot/search',
      '/api/ercot/validate'
    ];
    
    for (const endpoint of apiEndpoints) {
      const response = await page.evaluate(async (ep) => {
        try {
          const res = await fetch(ep);
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { error: e.message };
        }
      }, endpoint);
      console.log(`   ${endpoint}: ${JSON.stringify(response)}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n🏁 Debugging complete! Check the screenshots for visual inspection.');
  console.log('Press Ctrl+C to close the browser and exit.');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // Wait 5 minutes
  
  await browser.close();
})();