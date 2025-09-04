import { chromium } from 'playwright';
import fs from 'fs';

async function testESIIDDisplay() {
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 500 // Add delay between actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Create artifacts directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const artifactsDir = `./artifacts/${timestamp}`;
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  try {
    console.log('📋 Starting ESIID display test...');
    
    // Try multiple pages to find working address modal
    const pagesToTry = [
      'http://localhost:4324/',
      'http://localhost:4324/electricity-plans/',
      'http://localhost:4324/texas/',
      'http://localhost:4324/electricity-plans/dallas-tx/',
    ];
    
    let workingPage = null;
    let pageIndex = 0;
    
    for (const url of pagesToTry) {
      try {
        console.log(`🌐 Trying page: ${url}`);
        await page.goto(url, { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // Check if page loaded correctly (not an error page)
        const title = await page.title();
        if (title.includes('Error') || title.includes('CSSSyntaxError')) {
          console.log(`⚠️  Page has errors: ${title}`);
          continue;
        }
        
        workingPage = url;
        console.log(`✅ Successfully loaded: ${url}`);
        break;
        
      } catch (e) {
        console.log(`❌ Failed to load ${url}: ${e.message}`);
        continue;
      }
    }
    
    if (!workingPage) {
      throw new Error('Could not find a working page to test');
    }
    
    // Capture baseline screenshot
    await page.screenshot({ path: `${artifactsDir}/01-working-page-${pageIndex}.png`, fullPage: true });
    console.log('✅ Working page loaded and baseline screenshot captured');
    
    // Step 2: Look for any button that might open an address modal
    console.log('🔍 Looking for buttons that might open address modal...');
    
    const buttonSelectors = [
      'button:has-text("Select This Plan")',
      'button:has-text("Get Started")',
      'button:has-text("Find Plans")',
      'button:has-text("Shop Plans")',
      'button:has-text("Compare")',
      'button:has-text("Search")',
      '.select-plan-btn',
      '[data-testid="select-plan"]',
      'a[href*="plans"]:has-text("Select")',
    ];
    
    let modalButton = null;
    
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          console.log(`✅ Found button with selector: ${selector}`);
          modalButton = button;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!modalButton) {
      console.log('⚠️  No modal button found, looking for ZIP input instead...');
      
      // Try to find ZIP input and enter address there
      const zipInputs = [
        'input[name="zip"]',
        'input[placeholder*="ZIP"]',
        'input[placeholder*="zip"]',
        '#zipInput',
        '.zip-input'
      ];
      
      let zipInput = null;
      for (const selector of zipInputs) {
        try {
          const input = page.locator(selector);
          if (await input.count() > 0 && await input.isVisible()) {
            zipInput = input;
            console.log(`✅ Found ZIP input: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (zipInput) {
        console.log('📝 Using ZIP input workflow instead...');
        await zipInput.fill('75001');
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // This should take us to a plans page, let's try to find a select button there
          await page.screenshot({ path: `${artifactsDir}/02-after-zip-search.png`, fullPage: true });
          
          // Try to find select buttons on the results page
          modalButton = page.locator('button').filter({ hasText: /select|choose|get started/i }).first();
        }
      }
    }
    
    if (modalButton && await modalButton.count() > 0) {
      console.log('🖱️  Clicking button to open modal...');
      await modalButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  No suitable button found. Checking for existing address modal...');
    }
    
    // Look for the modal - it might already be visible or appear after button click
    console.log('🔍 Looking for address search modal...');
    
    const modalSelectors = [
      '[data-testid="address-search-modal"]',
      '[role="dialog"]',
      '.modal',
      'dialog[open]',
      '[data-state="open"]'
    ];
    
    let modalFound = false;
    let modalElement = null;
    
    for (const selector of modalSelectors) {
      try {
        modalElement = page.locator(selector);
        await modalElement.waitFor({ state: 'visible', timeout: 3000 });
        if (await modalElement.count() > 0) {
          console.log(`✅ Found modal with selector: ${selector}`);
          modalFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!modalFound) {
      console.log('⚠️  Modal not found, but continuing with test to see if we can trigger it...');
    }
    
    await page.screenshot({ path: `${artifactsDir}/02-modal-or-page-state.png`, fullPage: true });
    
    // Step 3: Try to enter test address in various possible inputs
    console.log('📝 Looking for address input fields...');
    
    const addressInputs = [
      'input[placeholder*="address"]',
      'input[placeholder*="Address"]',
      'input[id="address"]',
      'input[name="address"]',
      '#address'
    ];
    
    const zipInputs = [
      'input[placeholder*="ZIP"]',
      'input[placeholder*="zip"]',
      'input[id="zipCode"]',
      'input[name="zip"]',
      'input[name="zipCode"]'
    ];
    
    let addressInput = null;
    let zipInput = null;
    
    // Find address input
    for (const selector of addressInputs) {
      try {
        const input = page.locator(selector);
        if (await input.count() > 0 && await input.isVisible()) {
          addressInput = input;
          console.log(`✅ Found address input: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Find ZIP input
    for (const selector of zipInputs) {
      try {
        const input = page.locator(selector);
        if (await input.count() > 0 && await input.isVisible()) {
          zipInput = input;
          console.log(`✅ Found ZIP input: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (addressInput && zipInput) {
      console.log('📝 Entering test address and ZIP code...');
      await addressInput.fill('123 Main St');
      await zipInput.fill('75001');
    } else {
      console.log('⚠️  Address inputs not found. Looking for any visible inputs...');
      
      // Try to find any inputs in the modal or page
      const allInputs = page.locator('input[type="text"], input:not([type])');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} text inputs`);
      
      if (inputCount >= 2) {
        console.log('🔧 Using first two inputs as address and ZIP...');
        await allInputs.nth(0).fill('123 Main St');
        await allInputs.nth(1).fill('75001');
      } else if (inputCount === 1) {
        console.log('🔧 Using single input as ZIP code...');
        await allInputs.nth(0).fill('75001');
      }
    }
    
    await page.screenshot({ path: `${artifactsDir}/03-address-entered.png`, fullPage: true });
    console.log('✅ Test address entered');
    
    // Step 4: Click search button
    console.log('🔍 Looking for search button...');
    
    const searchButtons = [
      'button:has-text("Search")',
      'button[type="submit"]',
      'button:has-text("Find")',
      'button:has-text("Search Addresses")',
      '.search-button',
      '[data-testid="search-button"]'
    ];
    
    let searchButton = null;
    for (const selector of searchButtons) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0 && await button.isVisible()) {
          searchButton = button;
          console.log(`✅ Found search button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (searchButton) {
      console.log('🖱️  Clicking search button...');
      await searchButton.click();
    } else {
      console.log('⚠️  No search button found, trying Enter key...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for search results
    console.log('⏳ Waiting for search results...');
    await page.waitForTimeout(3000); // Allow time for API call
    
    // Look for address cards or results with multiple selectors
    const resultSelectors = [
      '[data-testid="address-card"]',
      '.address-card',
      '.search-results',
      '[role="listbox"]',
      '.location-result',
      'div:has-text("ESIID")',
      'div:has-text("Oncor")'
    ];
    
    let resultsFound = false;
    for (const selector of resultSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Found search results with selector: ${selector}`);
        resultsFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!resultsFound) {
      console.log('⚠️  Address results not found, but continuing...');
    }
    
    await page.screenshot({ path: `${artifactsDir}/04-search-results.png`, fullPage: true });
    console.log('✅ Search completed');
    
    // Step 5: Comprehensive ESIID verification
    console.log('🔍 Starting comprehensive ESIID verification...');
    
    // First, check for any ESIID text in the page
    const pageContent = await page.textContent('body');
    const hasESIIDText = pageContent.includes('ESIID');
    console.log(`📝 Page contains ESIID text: ${hasESIIDText}`);
    
    // Look for ESIID numbers specifically
    const esiidMatches = pageContent.match(/ESIID[:\s]*([0-9]{17})/g) || [];
    console.log(`📝 Found ${esiidMatches.length} ESIID number(s): ${esiidMatches}`);
    
    // Check for various possible ESIID selectors and elements
    const esiidSelectors = [
      'text="ESIID:"',
      '*:has-text("ESIID:")',
      '[data-testid="esiid-badge"]',
      '.esiid-badge',
      '.badge:has-text("ESIID")',
      'span:has-text("ESIID")',
      'div:has-text("ESIID")'
    ];
    
    let esiidElementsFound = [];
    
    for (const selector of esiidSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ Found ${count} ESIID element(s) with selector: ${selector}`);
          // Get the text content of these elements
          for (let i = 0; i < Math.min(count, 3); i++) { // Limit to first 3
            try {
              const text = await elements.nth(i).textContent();
              esiidElementsFound.push({ selector, text });
              console.log(`   📝 Element ${i + 1} text: "${text}"`);
            } catch (e) {
              // Continue
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Check for TDSP and meter type badges as reference points
    const referenceChecks = [
      { name: 'TDSP (Oncor)', selectors: ['text="Oncor"', '*:has-text("Oncor Electric Delivery")', '.badge:has-text("Oncor")'] },
      { name: 'Meter Type (Electric)', selectors: ['text="Electric"', '.badge:has-text("Electric")', 'span:has-text("Electric")'] },
      { name: 'Address Cards', selectors: ['.address-card', '[data-testid="address-card"]', '.location-result'] }
    ];
    
    const referenceResults = {};
    for (const check of referenceChecks) {
      let found = 0;
      for (const selector of check.selectors) {
        try {
          const count = await page.locator(selector).count();
          found += count;
        } catch (e) {
          // Continue
        }
      }
      referenceResults[check.name] = found;
      console.log(`📊 ${check.name}: ${found} element(s) found`);
    }
    
    // Comprehensive screenshot
    await page.screenshot({ path: `${artifactsDir}/05-comprehensive-verification.png`, fullPage: true });
    console.log('📸 Comprehensive verification screenshot captured');
    
    // Try to capture modal area specifically
    try {
      const modalArea = page.locator('[role="dialog"], .modal, [data-state="open"]').first();
      if (await modalArea.count() > 0) {
        await modalArea.screenshot({ path: `${artifactsDir}/06-modal-area-closeup.png` });
        console.log('📸 Modal area closeup screenshot captured');
      }
    } catch (e) {
      console.log('⚠️  Could not capture modal area closeup');
    }
    
    // Final ESIID verification summary
    const esiidVerification = {
      hasESIIDText: hasESIIDText,
      esiidNumbersFound: esiidMatches.length,
      esiidNumbers: esiidMatches,
      esiidElementsFound: esiidElementsFound.length,
      esiidElements: esiidElementsFound,
      referenceElements: referenceResults,
      testPassed: hasESIIDText && (esiidMatches.length > 0 || esiidElementsFound.length > 0)
    };
    
    console.log('\n🎯 ESIID VERIFICATION SUMMARY:');
    console.log(`- ESIID text found: ${esiidVerification.hasESIIDText ? 'YES' : 'NO'}`);
    console.log(`- ESIID numbers found: ${esiidVerification.esiidNumbersFound}`);
    console.log(`- ESIID elements found: ${esiidVerification.esiidElementsFound}`);
    console.log(`- Test passed: ${esiidVerification.testPassed ? 'YES' : 'NO'}`);
    
    if (esiidVerification.esiidNumbers.length > 0) {
      console.log(`- ESIID values: ${esiidVerification.esiidNumbers.join(', ')}`);
    }
    
    // Generate comprehensive test report
    const report = {
      timestamp: new Date().toISOString(),
      workingPage: workingPage,
      testSteps: [
        `✅ Found working page: ${workingPage}`,
        modalFound ? '✅ Address modal detected' : '⚠️ Modal detection uncertain',
        '✅ Entered test address (123 Main St, 75001)',
        resultsFound ? '✅ Search results appeared' : '⚠️ Search results uncertain',
        esiidVerification.testPassed ? '✅ ESIID verification passed' : '❌ ESIID verification failed'
      ],
      esiidVerification: esiidVerification,
      screenshots: [
        '01-working-page-0.png',
        '02-modal-or-page-state.png',
        '03-address-entered.png',
        '04-search-results.png',
        '05-comprehensive-verification.png',
        '06-modal-area-closeup.png'
      ]
    };
    
    fs.writeFileSync(`${artifactsDir}/test-report.json`, JSON.stringify(report, null, 2));
    console.log('📝 Comprehensive test report saved');
    
    console.log('\n📋 FINAL TEST SUMMARY:');
    console.log(`- Working Page: ${workingPage}`);
    console.log(`- ESIID Text Found: ${esiidVerification.hasESIIDText ? 'YES' : 'NO'}`);
    console.log(`- ESIID Numbers: ${esiidVerification.esiidNumbersFound}`);
    console.log(`- ESIID Elements: ${esiidVerification.esiidElementsFound}`);
    console.log(`- Test Result: ${esiidVerification.testPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`- Screenshots: ${artifactsDir}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: `${artifactsDir}/error-screenshot.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testESIIDDisplay().catch(console.error);