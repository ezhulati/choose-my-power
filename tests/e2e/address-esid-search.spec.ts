import { test, expect } from '@playwright/test';

interface TestAddress {
  address: string;
  zipCode: string;
  city: string;
  description: string;
}

const TEST_ADDRESSES: TestAddress[] = [
  {
    address: "3031 Oliver St, Apt 1214",
    zipCode: "75205",
    city: "Dallas",
    description: "Dallas Uptown apartment complex"
  },
  {
    address: "1234 Main Street",
    zipCode: "75201",
    city: "Dallas", 
    description: "Dallas downtown commercial area"
  },
  {
    address: "567 Elm Street",
    zipCode: "75202",
    city: "Dallas",
    description: "Dallas Deep Ellum neighborhood"
  },
  {
    address: "890 Oak Avenue",
    zipCode: "77001",
    city: "Houston",
    description: "Houston downtown district"
  },
  {
    address: "2100 Smith Street",
    zipCode: "77002",
    city: "Houston",
    description: "Houston Midtown area"
  },
  {
    address: "1500 Louisiana Street",
    zipCode: "77003",
    city: "Houston", 
    description: "Houston Third Ward"
  },
  {
    address: "789 Congress Avenue",
    zipCode: "78701",
    city: "Austin",
    description: "Austin downtown core"
  },
  {
    address: "456 6th Street",
    zipCode: "78702",
    city: "Austin",
    description: "Austin East Side"
  },
  {
    address: "321 University Drive",
    zipCode: "76101",
    city: "Fort Worth",
    description: "Fort Worth downtown"
  },
  {
    address: "555 Collins Street",
    zipCode: "76102", 
    city: "Arlington",
    description: "Arlington entertainment district"
  }
];

test.describe('Address ESID Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a plan details page
    await page.goto('/electricity-plans/plans/gexa-energy/gexa-eco-saver-plus-12');
    await page.waitForLoadState('networkidle');
  });

  TEST_ADDRESSES.forEach((testAddress, index) => {
    test(`Address ${index + 1}: ${testAddress.description}`, async ({ page }) => {
      console.log(`\n🧪 Testing address ${index + 1}/${TEST_ADDRESSES.length}: ${testAddress.address}, ${testAddress.zipCode}`);

      // Click the "Select This Plan" button to open address modal
      const selectButton = page.locator('button:has-text("Select This Plan")').first();
      await expect(selectButton).toBeVisible();
      await selectButton.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(page.locator('text=Check Service Availability')).toBeVisible();

      // Fill in the address
      const addressInput = page.locator('input[placeholder*="Main Street"], input[autocomplete="street-address"]');
      await expect(addressInput).toBeVisible();
      await addressInput.clear();
      await addressInput.fill(testAddress.address);

      // Fill in the ZIP code
      const zipInput = page.locator('input[placeholder*="75201"], input[autocomplete="postal-code"]');
      await expect(zipInput).toBeVisible();
      await zipInput.clear();
      await zipInput.fill(testAddress.zipCode);

      // Wait for ZIP validation to show
      await page.waitForTimeout(500);

      // Check for ZIP validation feedback
      const zipValidation = page.locator('text=ZIP code is valid');
      if (await zipValidation.isVisible()) {
        console.log(`✅ ZIP code ${testAddress.zipCode} validated successfully`);
      }

      // Wait for auto-search to potentially trigger (1200ms + buffer)
      console.log(`⏳ Waiting for auto-search to complete...`);
      await page.waitForTimeout(2000);

      // Check if auto-search found results
      const resultsSection = page.locator('text=Service Locations Found');
      const planAvailable = page.locator('text=Plan Available!');
      const searchError = page.locator('[role="alert"]');

      if (await resultsSection.isVisible() || await planAvailable.isVisible()) {
        console.log(`🎯 Auto-search found results for ${testAddress.address}`);
      } else {
        // If auto-search didn't work, try manual search
        console.log(`🔍 Auto-search didn't trigger, clicking Check Availability...`);
        const checkButton = page.locator('button:has-text("Check Availability")');
        
        if (await checkButton.isVisible() && await checkButton.isEnabled()) {
          await checkButton.click();
          
          // Wait for search to complete
          await page.waitForTimeout(3000);
          
          // Check for loading state
          const loadingIndicator = page.locator('text=Searching for service locations');
          if (await loadingIndicator.isVisible()) {
            console.log(`⏳ Manual search in progress...`);
            await page.waitForSelector('text=Searching for service locations', { state: 'hidden', timeout: 10000 });
          }
        } else {
          console.log(`❌ Check Availability button not available or disabled`);
        }
      }

      // Check final results after search attempts
      await page.waitForTimeout(1000);

      if (await resultsSection.isVisible()) {
        console.log(`✅ Found ESID selection screen`);
        
        // Select the first available location
        const firstLocation = page.locator('[role="button"]').filter({ hasText: testAddress.zipCode }).first();
        if (await firstLocation.isVisible()) {
          await firstLocation.click();
          console.log(`📍 Selected service location`);
          
          // Wait for validation
          await page.waitForTimeout(2000);
        }
      }

      if (await planAvailable.isVisible()) {
        console.log(`🎉 Plan availability confirmed`);
        
        // Check if Order This Plan button is available
        const orderButton = page.locator('button:has-text("Order This Plan")');
        if (await orderButton.isVisible()) {
          console.log(`🔗 Order button is available`);
          
          // Test the order flow (without actually clicking to avoid opening external URLs)
          const orderButtonEnabled = await orderButton.isEnabled();
          if (orderButtonEnabled) {
            console.log(`✅ Order button is enabled and ready`);
            
            // Check if we can intercept the order URL
            await page.route('https://orders.comparepower.com/**', route => {
              const url = route.request().url();
              console.log(`🌐 Would open ComparePower order URL: ${url}`);
              
              // Verify URL structure
              const urlObj = new URL(url);
              const esiid = urlObj.searchParams.get('esiid');
              const planId = urlObj.searchParams.get('plan_id');
              const usage = urlObj.searchParams.get('usage');
              const zipCode = urlObj.searchParams.get('zip_code');
              
              console.log(`   📋 ESIID: ${esiid}`);
              console.log(`   📋 Plan ID: ${planId}`);
              console.log(`   📋 Usage: ${usage}`);
              console.log(`   📋 ZIP: ${zipCode}`);
              
              // Validate URL parameters
              expect(esiid).toMatch(/^\d{17}$/); // 17 digits
              expect(planId).toMatch(/^[a-f0-9]{24}$/i); // MongoDB ObjectId
              expect(usage).toMatch(/^\d+$/); // Numeric
              expect(zipCode).toBe(testAddress.zipCode); // Matches input
              
              // Don't actually navigate
              route.abort();
            });
            
            // Click the order button to test URL generation
            await orderButton.click();
            await page.waitForTimeout(1000);
          } else {
            console.log(`⚠️ Order button is disabled`);
          }
        }
        
        // Check for any error messages
        const errorMessages = page.locator('[role="alert"]');
        const errorCount = await errorMessages.count();
        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const errorText = await errorMessages.nth(i).textContent();
            console.log(`⚠️ Error message: ${errorText}`);
          }
        }
      }

      // Check for search errors
      if (await searchError.isVisible()) {
        const errorText = await searchError.textContent();
        console.log(`❌ Search error: ${errorText}`);
        
        // This might be expected for some addresses outside service areas
        if (errorText?.includes('Service area not found') || errorText?.includes('outside the Texas deregulated market')) {
          console.log(`ℹ️ Address outside deregulated area - this is expected behavior`);
        }
      }

      // Close modal before next test
      const closeButton = page.locator('button[aria-label="Close"], [data-dialog-close]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      } else {
        // Try pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      console.log(`✅ Test completed for ${testAddress.description}\n`);
    });
  });

  test('API Endpoint Direct Testing', async ({ page }) => {
    console.log('\n🔧 Testing API endpoints directly...');
    
    for (const [index, testAddress] of TEST_ADDRESSES.entries()) {
      console.log(`\n📡 API Test ${index + 1}: ${testAddress.address}, ${testAddress.zipCode}`);
      
      // Test the ERCOT search API directly
      const response = await page.request.post('/api/ercot/search-dynamic', {
        data: {
          address: testAddress.address,
          zipCode: testAddress.zipCode
        }
      });
      
      const status = response.status();
      console.log(`   📊 API Response Status: ${status}`);
      
      if (status === 200) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   ✅ Found ${data.length} ESID(s)`);
          console.log(`   📍 First ESID: ${data[0].esiid}`);
          console.log(`   🏠 Address: ${data[0].address}`);
          console.log(`   🏢 TDSP: ${data[0].tdsp}`);
          
          // Validate ESID format
          expect(data[0].esiid).toMatch(/^\d{17}$/);
          expect(data[0].address).toBeTruthy();
          expect(data[0].city).toBeTruthy();
          expect(data[0].zip).toBe(testAddress.zipCode);
        } else {
          console.log(`   ⚠️ No ESIDs found - may be outside service area`);
        }
      } else {
        const errorData = await response.json().catch(() => null);
        console.log(`   ❌ API Error: ${errorData?.error || 'Unknown error'}`);
      }
    }
  });
});