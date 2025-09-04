import { test, expect, Page } from '@playwright/test';

test.describe('Address Search Modal - Debouncing and Multiple Call Issues', () => {
  let page: Page;
  let apiCallLog: { url: string; timestamp: number; body: any }[] = [];

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    apiCallLog = [];

    // Intercept all API calls to track duplicates
    await page.route('**/api/ercot/**', async route => {
      const request = route.request();
      const url = request.url();
      const postData = request.postData();
      
      apiCallLog.push({
        url,
        timestamp: Date.now(),
        body: postData ? JSON.parse(postData) : null
      });

      console.log(`API Call ${apiCallLog.length}: ${url} at ${new Date().toISOString()}`);
      if (postData) {
        console.log('Request Body:', JSON.parse(postData));
      }

      // Continue with the request
      await route.continue();
    });

    // Navigate to product detail page
    await page.goto('http://localhost:4324/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12', {
      waitUntil: 'networkidle'
    });
  });

  test('Test 1: Slow typing in address field', async () => {
    console.log('\n=== TEST 1: SLOW TYPING IN ADDRESS FIELD ===\n');
    
    // Open modal
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    // Type slowly in address field
    const addressInput = page.locator('#address');
    const testAddress = '123 Main Street';
    
    console.log('Starting slow typing...');
    for (const char of testAddress) {
      await addressInput.type(char, { delay: 300 });
      console.log(`Typed: "${await addressInput.inputValue()}" - API calls so far: ${apiCallLog.length}`);
      await page.waitForTimeout(100);
    }

    // Type ZIP code
    const zipInput = page.locator('#zipcode');
    await zipInput.type('75201', { delay: 200 });

    // Wait for any pending API calls
    await page.waitForTimeout(2000);

    // Analyze results
    console.log('\n=== SLOW TYPING RESULTS ===');
    console.log(`Total API calls made: ${apiCallLog.length}`);
    
    // Check for duplicate calls
    const duplicates = findDuplicateCalls(apiCallLog);
    console.log(`Duplicate calls found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate calls details:');
      duplicates.forEach(dup => {
        console.log(`- Same request sent ${dup.count} times: ${JSON.stringify(dup.body)}`);
        console.log(`  Time between calls: ${dup.timeDiffs.join('ms, ')}ms`);
      });
    }

    // Check debounce timing
    if (apiCallLog.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < apiCallLog.length; i++) {
        timeDiffs.push(apiCallLog[i].timestamp - apiCallLog[i-1].timestamp);
      }
      console.log(`\nTime between API calls: ${timeDiffs.join('ms, ')}ms`);
      console.log(`Average time between calls: ${Math.round(timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length)}ms`);
    }
  });

  test('Test 2: Fast typing in address field', async () => {
    console.log('\n=== TEST 2: FAST TYPING IN ADDRESS FIELD ===\n');
    
    // Open modal
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    // Type quickly
    const addressInput = page.locator('#address');
    console.log('Starting fast typing...');
    
    await addressInput.type('123 Main Street', { delay: 50 });
    console.log(`Typed full address quickly - API calls so far: ${apiCallLog.length}`);
    
    const zipInput = page.locator('#zipcode');
    await zipInput.type('75201', { delay: 50 });
    console.log(`Typed ZIP quickly - API calls so far: ${apiCallLog.length}`);

    // Wait for debounce and API calls
    await page.waitForTimeout(2000);

    // Analyze results
    console.log('\n=== FAST TYPING RESULTS ===');
    console.log(`Total API calls made: ${apiCallLog.length}`);
    
    const duplicates = findDuplicateCalls(apiCallLog);
    console.log(`Duplicate calls found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate calls details:');
      duplicates.forEach(dup => {
        console.log(`- Same request sent ${dup.count} times: ${JSON.stringify(dup.body)}`);
      });
    }
  });

  test('Test 3: Intermittent typing (stop and start)', async () => {
    console.log('\n=== TEST 3: INTERMITTENT TYPING ===\n');
    
    // Open modal
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    const addressInput = page.locator('#address');
    const zipInput = page.locator('#zipcode');

    // Type part of address
    console.log('Typing partial address...');
    await addressInput.type('123', { delay: 100 });
    await page.waitForTimeout(500);
    
    // Continue typing
    console.log('Continuing address...');
    await addressInput.type(' Main', { delay: 100 });
    await page.waitForTimeout(900); // Wait past debounce
    
    console.log(`After first pause - API calls: ${apiCallLog.length}`);
    
    // Add ZIP
    console.log('Adding ZIP...');
    await zipInput.type('75201', { delay: 100 });
    
    // Wait for API call
    await page.waitForTimeout(1500);
    console.log(`After ZIP - API calls: ${apiCallLog.length}`);
    
    // Complete address
    console.log('Completing address...');
    await addressInput.type(' Street', { delay: 100 });
    
    await page.waitForTimeout(2000);

    // Analyze results
    console.log('\n=== INTERMITTENT TYPING RESULTS ===');
    console.log(`Total API calls made: ${apiCallLog.length}`);
    
    apiCallLog.forEach((call, index) => {
      console.log(`\nCall ${index + 1}:`);
      console.log(`  Timestamp: ${call.timestamp}`);
      console.log(`  Body: ${JSON.stringify(call.body)}`);
    });
  });

  test('Test 4: Clear and re-type', async () => {
    console.log('\n=== TEST 4: CLEAR AND RE-TYPE ===\n');
    
    // Open modal
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    const addressInput = page.locator('#address');
    const zipInput = page.locator('#zipcode');

    // Type complete address and ZIP
    console.log('Initial typing...');
    await addressInput.type('456 Oak Avenue');
    await zipInput.type('75202');
    
    await page.waitForTimeout(1500);
    console.log(`After initial entry - API calls: ${apiCallLog.length}`);
    
    // Clear and re-type
    console.log('Clearing address...');
    await addressInput.clear();
    await page.waitForTimeout(500);
    
    console.log('Re-typing new address...');
    await addressInput.type('789 Pine Road');
    
    await page.waitForTimeout(2000);

    // Analyze results
    console.log('\n=== CLEAR AND RE-TYPE RESULTS ===');
    console.log(`Total API calls made: ${apiCallLog.length}`);
    
    const duplicates = findDuplicateCalls(apiCallLog);
    if (duplicates.length > 0) {
      console.log('\nFound duplicate calls after clearing:');
      duplicates.forEach(dup => {
        console.log(`- ${JSON.stringify(dup.body)} called ${dup.count} times`);
      });
    }
  });

  test('Test 5: Monitor console errors and warnings', async () => {
    console.log('\n=== TEST 5: CONSOLE MONITORING ===\n');
    
    const consoleMessages: { type: string; text: string; location?: string }[] = [];
    
    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()?.url
        });
      }
    });

    // Open modal and trigger searches
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    // Type rapidly to stress test
    const addressInput = page.locator('#address');
    const zipInput = page.locator('#zipcode');
    
    for (let i = 0; i < 3; i++) {
      await addressInput.clear();
      await addressInput.type(`Test Address ${i}`);
      await zipInput.clear();
      await zipInput.type(`7520${i}`);
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(2000);

    // Report console issues
    console.log('\n=== CONSOLE MESSAGES ===');
    console.log(`Errors found: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`Warnings found: ${consoleMessages.filter(m => m.type === 'warning').length}`);
    
    if (consoleMessages.length > 0) {
      console.log('\nDetails:');
      consoleMessages.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
        if (msg.location) {
          console.log(`  Location: ${msg.location}`);
        }
      });
    }
  });

  test('Test 6: Analyze useEffect dependencies', async () => {
    console.log('\n=== TEST 6: USE EFFECT BEHAVIOR ===\n');
    
    // Open modal
    await page.click('button:has-text("Select This Plan")');
    await page.waitForSelector('#address', { state: 'visible' });

    const addressInput = page.locator('#address');
    const zipInput = page.locator('#zipcode');
    
    // Test minimum character requirement (3 chars)
    console.log('Testing minimum character requirement...');
    await addressInput.type('12'); // Less than 3 chars
    await zipInput.type('75201');
    await page.waitForTimeout(1200);
    console.log(`With 2 chars in address: ${apiCallLog.length} API calls`);
    
    // Add one more character to trigger
    await addressInput.type('3');
    await page.waitForTimeout(1200);
    console.log(`With 3 chars in address: ${apiCallLog.length} API calls`);
    
    // Clear everything and test ZIP requirement
    const currentCalls = apiCallLog.length;
    await addressInput.clear();
    await zipInput.clear();
    apiCallLog = []; // Reset for clarity
    
    console.log('\nTesting ZIP code requirement...');
    await addressInput.type('123 Main St');
    await zipInput.type('7520'); // Only 4 digits
    await page.waitForTimeout(1200);
    console.log(`With 4 digit ZIP: ${apiCallLog.length} API calls`);
    
    await zipInput.type('1'); // Complete to 5 digits
    await page.waitForTimeout(1200);
    console.log(`With 5 digit ZIP: ${apiCallLog.length} API calls`);
  });

  // Helper function to find duplicate API calls
  function findDuplicateCalls(calls: typeof apiCallLog) {
    const callMap = new Map<string, { count: number; timestamps: number[]; body: any }>();
    
    calls.forEach(call => {
      const key = JSON.stringify(call.body);
      const existing = callMap.get(key);
      if (existing) {
        existing.count++;
        existing.timestamps.push(call.timestamp);
      } else {
        callMap.set(key, {
          count: 1,
          timestamps: [call.timestamp],
          body: call.body
        });
      }
    });

    const duplicates: Array<{ body: any; count: number; timeDiffs: number[] }> = [];
    
    callMap.forEach((value, key) => {
      if (value.count > 1) {
        const timeDiffs = [];
        for (let i = 1; i < value.timestamps.length; i++) {
          timeDiffs.push(value.timestamps[i] - value.timestamps[i-1]);
        }
        duplicates.push({
          body: value.body,
          count: value.count,
          timeDiffs
        });
      }
    });

    return duplicates;
  }
});

// Summary test
test('SUMMARY: Debouncing Analysis', async ({ page }) => {
  console.log('\n' + '='.repeat(60));
  console.log('DEBOUNCING ISSUES ANALYSIS SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log('IDENTIFIED ISSUES:');
  console.log('1. Debounce timer (800ms) in useEffect at line 95');
  console.log('2. useEffect dependency array includes isSearching state');
  console.log('3. No cleanup of previous API calls if new ones are triggered');
  console.log('4. Auto-search triggers on every change after min requirements met');
  console.log('5. Manual search button also available, can cause duplicate calls');
  
  console.log('\nROOT CAUSES:');
  console.log('- The isSearching dependency in useEffect (line 99) can cause re-renders');
  console.log('- No AbortController to cancel in-flight requests');
  console.log('- Debounce only applies to auto-search, not manual button clicks');
  console.log('- No prevention of duplicate API calls for same search terms');
  
  console.log('\nRECOMMENDED FIXES:');
  console.log('1. Remove isSearching from useEffect dependencies');
  console.log('2. Implement AbortController for request cancellation');
  console.log('3. Add request deduplication logic');
  console.log('4. Disable manual search button during auto-search');
  console.log('5. Increase debounce time to 1000-1200ms');
  console.log('6. Add loading state that prevents multiple searches');
});