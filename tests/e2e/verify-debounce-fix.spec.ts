import { test, expect } from '@playwright/test';

test('Verify Address Search Debouncing is Fixed', async ({ page }) => {
  const apiCalls: any[] = [];

  // Intercept API calls
  await page.route('**/api/ercot/**', async route => {
    const request = route.request();
    const timestamp = Date.now();
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    
    apiCalls.push({
      url: request.url(),
      method: request.method(),
      timestamp,
      body
    });
    
    console.log(`API Call #${apiCalls.length} at ${new Date(timestamp).toISOString()}`);
    console.log(`  Body: ${JSON.stringify(body)}`);
    
    // Mock response to prevent actual API call
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          esiid: '10443720000000001',
          address: '123 MAIN ST',
          city: 'DALLAS',
          state: 'TX',
          zip: '75201',
          tdsp: 'ONCOR',
          meter_type: 'SMART'
        }
      ])
    });
  });

  // Navigate to page
  await page.goto('http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Select This Plan")', { state: 'visible' });
  
  // Open modal
  await page.click('button:has-text("Select This Plan")');
  
  // Wait for modal
  await page.waitForSelector('#address', { state: 'visible' });

  console.log('\n=== TEST 1: SLOW TYPING (should trigger 1 API call) ===');
  
  // Type slowly in address field
  const addressInput = page.locator('#address');
  for (const char of '123 Main Street') {
    await addressInput.type(char, { delay: 150 });
  }
  
  // Type ZIP code
  await page.fill('#zipcode', '75201');
  
  // Wait for debounce period plus buffer
  await page.waitForTimeout(1500);
  
  const slowTypingCalls = apiCalls.length;
  console.log(`✓ Slow typing triggered ${slowTypingCalls} API call(s)`);
  
  // Clear for next test
  apiCalls.length = 0;
  
  console.log('\n=== TEST 2: FAST TYPING (should trigger 1 API call) ===');
  
  // Clear and type fast
  await addressInput.clear();
  await page.fill('#zipcode', '');
  await page.waitForTimeout(500);
  
  await addressInput.type('456 Oak Avenue', { delay: 20 });
  await page.fill('#zipcode', '75202');
  
  // Wait for debounce
  await page.waitForTimeout(1500);
  
  const fastTypingCalls = apiCalls.length;
  console.log(`✓ Fast typing triggered ${fastTypingCalls} API call(s)`);
  
  // Clear for next test
  apiCalls.length = 0;
  
  console.log('\n=== TEST 3: INTERMITTENT TYPING (should trigger 1-2 API calls max) ===');
  
  // Clear fields
  await addressInput.clear();
  await page.fill('#zipcode', '');
  await page.waitForTimeout(500);
  
  // Type partial address
  await addressInput.type('789', { delay: 100 });
  await page.waitForTimeout(600); // Less than debounce
  
  // Continue typing
  await addressInput.type(' Pine Road', { delay: 100 });
  await page.fill('#zipcode', '75203');
  
  // Wait for debounce
  await page.waitForTimeout(1500);
  
  const intermittentCalls = apiCalls.length;
  console.log(`✓ Intermittent typing triggered ${intermittentCalls} API call(s)`);
  
  // Analyze timing between calls if multiple
  if (apiCalls.length > 1) {
    for (let i = 1; i < apiCalls.length; i++) {
      const timeDiff = apiCalls[i].timestamp - apiCalls[i-1].timestamp;
      console.log(`  Time between call ${i} and ${i+1}: ${timeDiff}ms`);
    }
  }
  
  console.log('\n=== RESULTS SUMMARY ===');
  console.log(`✅ Slow typing: ${slowTypingCalls === 1 ? 'PASS' : 'FAIL'} (Expected 1, got ${slowTypingCalls})`);
  console.log(`✅ Fast typing: ${fastTypingCalls === 1 ? 'PASS' : 'FAIL'} (Expected 1, got ${fastTypingCalls})`);
  console.log(`✅ Intermittent typing: ${intermittentCalls <= 2 ? 'PASS' : 'FAIL'} (Expected ≤2, got ${intermittentCalls})`);
  
  // Assert expectations
  expect(slowTypingCalls, 'Slow typing should trigger exactly 1 API call').toBe(1);
  expect(fastTypingCalls, 'Fast typing should trigger exactly 1 API call').toBe(1);
  expect(intermittentCalls, 'Intermittent typing should trigger at most 2 API calls').toBeLessThanOrEqual(2);
  
  console.log('\n✅ All debouncing tests passed! The fidgety behavior has been fixed.');
});