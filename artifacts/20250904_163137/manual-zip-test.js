import { chromium } from 'playwright';

// Manual focused ZIP testing for specific scenarios
async function manualZipTest() {
  console.log('🎯 Starting focused ZIP functionality tests...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // Monitor console and network
  page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
  page.on('response', response => {
    if (response.url().includes('/api/zip-lookup')) {
      console.log(`[API] ZIP Lookup Response: ${response.status()}`);
    }
  });
  
  const results = [];
  
  try {
    // Test 1: Homepage ZIP functionality
    console.log('\n📍 TEST 1: Homepage ZIP Input');
    await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: './artifacts/20250904_163137/manual-homepage-initial.png', fullPage: true });
    
    // Find the main ZIP input (hero section)
    const mainZipInput = await page.$('input[placeholder*="ZIP"], input[name="zip"]');
    if (mainZipInput) {
      console.log('✅ Found main ZIP input');
      
      // Test valid TX ZIP
      await mainZipInput.fill('75201');
      await page.screenshot({ path: './artifacts/20250904_163137/manual-homepage-filled.png' });
      
      // Find and click submit button
      const submitButton = await page.$('button[type="submit"], button:has-text("Find Plans")');
      if (submitButton) {
        console.log('✅ Found submit button');
        
        // Wait for navigation or API response
        const [response] = await Promise.all([
          page.waitForResponse(res => res.url().includes('/api/zip-lookup') || res.url().includes('/texas/'), { timeout: 10000 }).catch(() => null),
          submitButton.click()
        ]);
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './artifacts/20250904_163137/manual-homepage-after.png', fullPage: true });
        
        results.push({
          test: 'Homepage ZIP',
          status: page.url().includes('/texas/') ? 'SUCCESS' : 'PARTIAL',
          currentUrl: page.url(),
          response: response ? response.status() : 'No response'
        });
      }
    }
    
    // Test 2: City page ZIP functionality
    console.log('\n📍 TEST 2: Houston City Page ZIP Input');
    await page.goto('http://localhost:4324/texas/houston-tx', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: './artifacts/20250904_163137/manual-houston-initial.png', fullPage: true });
    
    const cityZipInput = await page.$('input[placeholder*="ZIP"], input[name="zip"]');
    if (cityZipInput) {
      console.log('✅ Found city page ZIP input');
      await cityZipInput.fill('77001');
      await page.screenshot({ path: './artifacts/20250904_163137/manual-houston-filled.png' });
      
      const citySubmitBtn = await page.$('button[type="submit"], button:has-text("Find Plans"), button:has-text("Search")');
      if (citySubmitBtn) {
        await citySubmitBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './artifacts/20250904_163137/manual-houston-after.png', fullPage: true });
        
        results.push({
          test: 'Houston City Page ZIP',
          status: 'TESTED',
          currentUrl: page.url()
        });
      }
    } else {
      results.push({
        test: 'Houston City Page ZIP',
        status: 'NO ZIP INPUT FOUND',
        currentUrl: page.url()
      });
    }
    
    // Test 3: Shop page ZIP functionality  
    console.log('\n📍 TEST 3: Shop Page ZIP Input');
    await page.goto('http://localhost:4324/shop/cheapest-electricity', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: './artifacts/20250904_163137/manual-shop-initial.png', fullPage: true });
    
    const shopZipInput = await page.$('input[placeholder*="ZIP"], input[name="zip"]');
    if (shopZipInput) {
      console.log('✅ Found shop page ZIP input');
      await shopZipInput.fill('78701');
      await page.screenshot({ path: './artifacts/20250904_163137/manual-shop-filled.png' });
      
      const shopSubmitBtn = await page.$('button[type="submit"], button:has-text("Find Plans"), button:has-text("Search")');
      if (shopSubmitBtn) {
        await shopSubmitBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './artifacts/20250904_163137/manual-shop-after.png', fullPage: true });
        
        results.push({
          test: 'Shop Page ZIP',
          status: 'TESTED',
          currentUrl: page.url()
        });
      }
    } else {
      results.push({
        test: 'Shop Page ZIP',
        status: 'NO ZIP INPUT FOUND',
        currentUrl: page.url()
      });
    }
    
    // Test 4: Invalid ZIP error handling
    console.log('\n📍 TEST 4: Invalid ZIP Error Handling');
    await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const errorTestInput = await page.$('input[placeholder*="ZIP"], input[name="zip"]');
    if (errorTestInput) {
      await errorTestInput.fill('12345'); // Non-Texas ZIP
      await page.screenshot({ path: './artifacts/20250904_163137/manual-invalid-zip.png' });
      
      const errorSubmitBtn = await page.$('button[type="submit"], button:has-text("Find Plans")');
      if (errorSubmitBtn) {
        await errorSubmitBtn.click();
        await page.waitForTimeout(3000);
        
        // Check for error messages
        const errorElements = await page.$$('.error, [class*="error"], .invalid, [role="alert"]');
        const errorTexts = await Promise.all(errorElements.map(el => el.textContent()));
        
        await page.screenshot({ path: './artifacts/20250904_163137/manual-error-handling.png', fullPage: true });
        
        results.push({
          test: 'Invalid ZIP Error Handling',
          status: errorTexts.length > 0 ? 'ERROR SHOWN' : 'NO ERROR SHOWN',
          errorMessages: errorTexts,
          currentUrl: page.url()
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.push({
      test: 'Test Execution',
      status: 'ERROR',
      error: error.message
    });
  }
  
  await browser.close();
  
  // Generate summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  results.forEach(result => {
    console.log(`${result.test}: ${result.status}`);
    if (result.currentUrl) console.log(`  URL: ${result.currentUrl}`);
    if (result.errorMessages) console.log(`  Errors: ${result.errorMessages.join(', ')}`);
  });
  
  return results;
}

// Run manual test
manualZipTest().catch(console.error);