import { test, expect } from '@playwright/test';

test('Address Search - Analyze Debouncing Issues', async ({ page }) => {
  const apiCalls: any[] = [];

  // Intercept API calls
  await page.route('**/api/ercot/**', async route => {
    const request = route.request();
    apiCalls.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now(),
      body: request.postData() ? JSON.parse(request.postData()) : null
    });
    console.log(`API Call #${apiCalls.length}: ${request.url()}`);
    await route.continue();
  });

  // Navigate to page
  await page.goto('http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Select This Plan")', { state: 'visible' });
  
  // Open modal
  await page.click('button:has-text("Select This Plan")');
  
  // Wait for modal
  await page.waitForSelector('#address', { state: 'visible' });

  // Test 1: Type slowly
  console.log('\n=== SLOW TYPING TEST ===');
  await page.fill('#address', ''); // Clear first
  for (const char of '123 Main') {
    await page.locator('#address').type(char, { delay: 400 });
  }
  await page.fill('#zipcode', '75201');
  await page.waitForTimeout(2000);
  
  console.log(`Total API calls after slow typing: ${apiCalls.length}`);
  
  // Test 2: Clear and type fast
  console.log('\n=== FAST TYPING TEST ===');
  const callsBefore = apiCalls.length;
  await page.fill('#address', '');
  await page.fill('#address', '456 Oak Street');
  await page.waitForTimeout(2000);
  
  console.log(`API calls from fast typing: ${apiCalls.length - callsBefore}`);
  
  // Analyze duplicate calls
  const duplicates = new Map();
  apiCalls.forEach(call => {
    const key = JSON.stringify(call.body);
    duplicates.set(key, (duplicates.get(key) || 0) + 1);
  });
  
  console.log('\n=== DUPLICATE ANALYSIS ===');
  duplicates.forEach((count, body) => {
    if (count > 1) {
      console.log(`Duplicate: ${body} called ${count} times`);
    }
  });
  
  // Take screenshot
  await page.screenshot({ path: 'address-search-modal.png', fullPage: true });
});