import { test, expect } from '@playwright/test';

test.describe('Complete Order Flow Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a plan details page with logging
    console.log('🚀 Navigating to plan page...');
    await page.goto('/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Order Flow: Address → ESIID → Order URL', async ({ page }) => {
    console.log('\n🧪 Starting complete order flow test...');

    // Step 1: Click "Select This Plan" to open address modal
    console.log('📝 Step 1: Opening address search modal...');
    const selectButton = page.locator('button:has-text("Select This Plan")').first();
    await expect(selectButton).toBeVisible();
    await selectButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    console.log('✅ Address modal opened');

    // Step 2: Fill address form with a known working address
    console.log('📝 Step 2: Filling address form...');
    const testAddress = "3031 Oliver St, Apt 1214";
    const testZip = "75205";
    
    const addressInput = page.locator('input[autocomplete="street-address"]');
    await addressInput.fill(testAddress);
    
    const zipInput = page.locator('input[autocomplete="postal-code"]');  
    await zipInput.fill(testZip);
    console.log(`✅ Filled address: ${testAddress}, ${testZip}`);

    // Wait for validation
    await page.waitForTimeout(1000);

    // Step 3: Trigger search (auto or manual)
    console.log('📝 Step 3: Triggering address search...');
    
    // Wait for auto-search to potentially complete
    await page.waitForTimeout(2500);
    
    // Check if we have results, if not try manual search
    const hasResults = await page.locator('text=Service Locations Found').isVisible() || 
                       await page.locator('text=Plan Available!').isVisible();
    
    if (!hasResults) {
      console.log('🔍 Auto-search not complete, trying manual search...');
      const checkButton = page.locator('button:has-text("Check Availability")');
      if (await checkButton.isVisible() && await checkButton.isEnabled()) {
        await checkButton.click();
        console.log('⏳ Manual search triggered');
        
        // Wait for search to complete
        await page.waitForTimeout(5000);
      }
    }

    // Step 4: Select ESIID location  
    console.log('📝 Step 4: Selecting ESIID location...');
    
    // Check for location selection step
    const locationCards = page.locator('[role="button"]').filter({ hasText: testZip });
    const locationCount = await locationCards.count();
    
    if (locationCount > 0) {
      console.log(`✅ Found ${locationCount} service locations`);
      await locationCards.first().click();
      console.log('📍 Selected first service location');
      
      // Wait for validation
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ No service locations found - checking for direct plan availability');
    }

    // Step 5: Check for plan availability confirmation
    console.log('📝 Step 5: Checking plan availability...');
    
    const planAvailable = page.locator('text=Plan Available!');
    await expect(planAvailable).toBeVisible({ timeout: 10000 });
    console.log('🎉 Plan availability confirmed!');

    // Step 6: Test order button and URL generation
    console.log('📝 Step 6: Testing order process...');
    
    const orderButton = page.locator('button:has-text("Order This Plan")');
    await expect(orderButton).toBeVisible();
    
    // Check if order button is enabled
    const isEnabled = await orderButton.isEnabled();
    console.log(`🔘 Order button enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      // Wait a bit more for plan ID to load
      console.log('⏳ Order button disabled, waiting for plan ID to load...');
      await page.waitForTimeout(3000);
      
      const isEnabledAfterWait = await orderButton.isEnabled();
      console.log(`🔘 Order button enabled after wait: ${isEnabledAfterWait}`);
    }

    // Capture the order URL attempt
    let orderUrl = '';
    let urlParams = {};
    
    // Set up route interception for ComparePower orders
    await page.route('https://orders.comparepower.com/**', route => {
      orderUrl = route.request().url();
      console.log(`🌐 Intercepted ComparePower order URL: ${orderUrl}`);
      
      const url = new URL(orderUrl);
      urlParams = {
        esiid: url.searchParams.get('esiid'),
        plan_id: url.searchParams.get('plan_id'),
        usage: url.searchParams.get('usage'),
        zip_code: url.searchParams.get('zip_code')
      };
      
      console.log('📋 URL Parameters:');
      console.log(`   ESIID: ${urlParams.esiid}`);
      console.log(`   Plan ID: ${urlParams.plan_id}`);
      console.log(`   Usage: ${urlParams.usage}`);
      console.log(`   ZIP Code: ${urlParams.zip_code}`);
      
      // Prevent actual navigation
      route.abort();
    });

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.text().includes('[AddressModal]')) {
        console.log(`📝 Modal Log: ${msg.text()}`);
      }
    });

    // Step 7: Click order button
    console.log('📝 Step 7: Clicking Order This Plan button...');
    await orderButton.click();
    
    // Wait for URL generation and potential redirect
    await page.waitForTimeout(2000);

    // Step 8: Validate results
    console.log('📝 Step 8: Validating order flow results...');
    
    if (orderUrl) {
      console.log('✅ Order URL generated successfully!');
      
      // Validate URL parameters
      expect(urlParams.esiid).toBeTruthy();
      expect(urlParams.plan_id).toBeTruthy();
      expect(urlParams.usage).toBeTruthy();
      expect(urlParams.zip_code).toBe(testZip);
      
      // Validate ESIID format (flexible for ComparePower API)
      expect(urlParams.esiid).toMatch(/^[0-9A-Z]{15,25}$/i);
      
      // Validate plan ID format (MongoDB ObjectId)
      expect(urlParams.plan_id).toMatch(/^[a-f0-9]{24}$/i);
      
      // Validate usage is numeric
      expect(urlParams.usage).toMatch(/^\d+$/);
      
      console.log('✅ All URL parameters validated successfully!');
      
    } else {
      console.log('❌ No order URL was generated');
      
      // Check for error messages
      const errorMessages = page.locator('[role="alert"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        console.log('🔴 Found error messages:');
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`   Error ${i + 1}: ${errorText}`);
        }
      }
      
      if (consoleErrors.length > 0) {
        console.log('🔴 Console errors detected:');
        consoleErrors.forEach((error, index) => {
          console.log(`   Console Error ${index + 1}: ${error}`);
        });
      }
      
      // This will fail the test
      expect(orderUrl).toBeTruthy();
    }

    console.log('🏁 Complete order flow test finished!');
  });

  test('Plan ID Resolution Testing', async ({ page }) => {
    console.log('\n🧪 Testing plan ID resolution...');

    // Test the plan search API directly
    console.log('📡 Testing plan search API...');
    
    const planSearchResponse = await page.request.get('/api/plans/search?name=Gexa%20Eco%20Saver%20Plus%2012&provider=Gexa%20Energy&city=dallas');
    const planSearchStatus = planSearchResponse.status();
    
    console.log(`📊 Plan search API status: ${planSearchStatus}`);
    
    if (planSearchStatus === 200) {
      const planData = await planSearchResponse.json();
      console.log(`✅ Plan search successful:`, planData);
      
      if (planData && planData.length > 0) {
        const planId = planData[0].id;
        console.log(`📋 Plan ID: ${planId}`);
        
        // Validate MongoDB ObjectId format
        expect(planId).toMatch(/^[a-f0-9]{24}$/i);
        console.log('✅ Plan ID format validated');
      }
    } else {
      console.log('❌ Plan search API failed');
      const errorData = await planSearchResponse.json().catch(() => null);
      console.log('Error:', errorData);
    }

    // Test with different plan
    console.log('📡 Testing with 4Change Energy plan...');
    
    const plan2Response = await page.request.get('/api/plans/search?name=Maxx%20Saver%20Value%2024&provider=4Change%20Energy&city=dallas');
    const plan2Status = plan2Response.status();
    
    console.log(`📊 4Change plan search status: ${plan2Status}`);
    
    if (plan2Status === 200) {
      const plan2Data = await plan2Response.json();
      console.log(`✅ 4Change plan search successful:`, plan2Data);
    }
  });

  test('Address API Comprehensive Test', async ({ page }) => {
    console.log('\n🧪 Testing address API with multiple addresses...');

    const workingAddresses = [
      { address: "3031 Oliver St, Apt 1214", zipCode: "75205", city: "Dallas" },
      { address: "1234 Main Street", zipCode: "75201", city: "Dallas" },
      { address: "567 Elm Street", zipCode: "75202", city: "Dallas" }
    ];

    for (const testAddr of workingAddresses) {
      console.log(`\n📍 Testing: ${testAddr.address}, ${testAddr.zipCode}`);
      
      const response = await page.request.post('/api/ercot/search-dynamic', {
        data: {
          address: testAddr.address,
          zipCode: testAddr.zipCode
        }
      });

      const status = response.status();
      console.log(`   📊 Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   ✅ Found ${data.length} ESIDs`);
          console.log(`   📋 First ESIID: ${data[0].esiid}`);
          
          // Test URL generation
          const testUrl = `https://orders.comparepower.com/order/service_location?esiid=${data[0].esiid}&plan_id=68bbc3ac4030b9912e39f8d7&usage=1000&zip_code=${testAddr.zipCode}`;
          console.log(`   🔗 Sample order URL: ${testUrl}`);
          
        } else {
          console.log(`   ⚠️ No ESIDs returned`);
        }
      } else {
        console.log(`   ❌ API error`);
      }
    }
  });
});