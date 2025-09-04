import { chromium } from 'playwright';
import fs from 'fs';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const artifactDir = `./artifacts/${timestamp}-esiid-completion`;
fs.mkdirSync(artifactDir, { recursive: true });

console.log('🔍 Testing ESIID Lookup Completion');
console.log('===============================');

async function testESIIDCompletion() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console Error: ${msg.text()}`);
    } else if (msg.text().includes('ESIID') || msg.text().includes('Found exact')) {
      console.log(`💡 ESIID Log: ${msg.text()}`);
    }
  });
  
  try {
    // Navigate to plan detail page
    console.log('📍 Navigating to plan detail page...');
    await page.goto('http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Click Select This Plan
    console.log('🔘 Clicking "Select This Plan" button...');
    await page.locator('button').filter({ hasText: /select this plan/i }).click();
    
    // Wait for modal
    await page.waitForSelector('dialog, .modal, [role="dialog"]', { timeout: 10000 });
    
    // Fill form
    console.log('📝 Filling address form...');
    await page.fill('input[placeholder*="address" i]', '123 Main St');
    await page.fill('input[placeholder*="zip" i], input[name*="zip" i]', '75001');
    
    // Take screenshot before clicking search
    await page.screenshot({ 
      path: `${artifactDir}/before-search.png`,
      fullPage: true 
    });
    
    // Click Check Availability and monitor network
    console.log('🔍 Clicking "Check Availability" and monitoring network...');
    
    // Listen for API responses
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/ercot/search')) {
        console.log(`📡 ESIID API Response: ${response.status()} - ${response.url()}`);
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    await page.locator('button').filter({ hasText: /check availability/i }).click();
    
    // Wait longer for ESIID search to complete
    console.log('⏳ Waiting for ESIID search results...');
    await page.waitForTimeout(5000);
    
    // Take screenshot after search
    await page.screenshot({ 
      path: `${artifactDir}/after-search.png`,
      fullPage: true 
    });
    
    // Check for address results or ESIID data
    const searchAnalysis = await page.evaluate(() => {
      // Look for various result indicators
      const resultSelectors = [
        'button:has-text("Proceed")',
        'button:has-text("Continue")',
        'button:has-text("Order")',
        'button:has-text("Next")',
        'a[href*="comparepower"]',
        '.address-result',
        '.esiid-result',
        '[data-testid*="address"]',
        '[data-testid*="result"]'
      ];
      
      const foundElements = [];
      for (const selector of resultSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements.push({
              selector,
              count: elements.length,
              text: Array.from(elements).map(el => el.textContent?.trim()).slice(0, 3)
            });
          }
        } catch (e) {
          // Ignore selector errors
        }
      }
      
      // Also check for any text mentioning ESIID, address, or proceed
      const allText = document.body.textContent || '';
      const hasESIIDText = allText.toLowerCase().includes('esiid');
      const hasAddressText = allText.includes('123 Main St');
      const hasProceedText = allText.toLowerCase().includes('proceed');
      
      // Look for any clickable elements that might proceed
      const allButtons = Array.from(document.querySelectorAll('button, a')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        href: el.href,
        disabled: el.disabled,
        visible: el.offsetParent !== null
      })).filter(btn => btn.text && btn.visible);
      
      return {
        foundElements,
        textAnalysis: {
          hasESIIDText,
          hasAddressText, 
          hasProceedText
        },
        allButtons: allButtons.slice(0, 10), // Limit to first 10 buttons
        modalStillOpen: !!document.querySelector('dialog[open], .modal, [role="dialog"]')
      };
    });
    
    console.log('📊 Search Analysis:');
    console.log(`   • Found result elements: ${searchAnalysis.foundElements.length}`);
    console.log(`   • Has ESIID text: ${searchAnalysis.textAnalysis.hasESIIDText}`);
    console.log(`   • Has address text: ${searchAnalysis.textAnalysis.hasAddressText}`);
    console.log(`   • Has proceed text: ${searchAnalysis.textAnalysis.hasProceedText}`);
    console.log(`   • Modal still open: ${searchAnalysis.modalStillOpen}`);
    console.log(`   • API responses: ${apiResponses.length}`);
    
    if (searchAnalysis.foundElements.length > 0) {
      console.log('   • Found elements:');
      searchAnalysis.foundElements.forEach(el => {
        console.log(`     - ${el.selector}: ${el.count} items`);
        el.text.forEach(text => text && console.log(`       "${text}"`));
      });
    }
    
    if (searchAnalysis.allButtons.length > 0) {
      console.log('   • Available buttons:');
      searchAnalysis.allButtons.slice(0, 5).forEach(btn => {
        console.log(`     - ${btn.tag}: "${btn.text}" ${btn.href ? `(${btn.href})` : ''}`);
      });
    }
    
    // Try to click any proceed/continue button
    let proceedSuccess = false;
    let finalUrl = '';
    
    if (searchAnalysis.foundElements.length > 0) {
      console.log('🚀 Attempting to find and click proceed button...');
      
      try {
        // Try various proceed button patterns
        const proceedButtons = [
          'button:has-text("Proceed")',
          'button:has-text("Continue")', 
          'button:has-text("Order")',
          'button:has-text("Next")',
          'a[href*="comparepower"]'
        ];
        
        for (const buttonSelector of proceedButtons) {
          const button = page.locator(buttonSelector).first();
          if (await button.count() > 0) {
            console.log(`✅ Found button: ${buttonSelector}`);
            
            // Set up navigation listener
            page.on('framenavigated', frame => {
              if (frame === page.mainFrame()) {
                finalUrl = frame.url();
                console.log(`🌐 Navigated to: ${finalUrl}`);
              }
            });
            
            await button.click();
            await page.waitForTimeout(3000);
            
            if (finalUrl && finalUrl.includes('comparepower.com')) {
              proceedSuccess = true;
              console.log('✅ Successfully redirected to ComparePower!');
              break;
            }
          }
        }
        
        if (!proceedSuccess) {
          console.log('⚠️  No proceed button found or didn\'t redirect to ComparePower');
        }
        
      } catch (error) {
        console.log(`❌ Error clicking proceed: ${error.message}`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: `${artifactDir}/final-state.png`,
      fullPage: true 
    });
    
    // Save analysis
    const fullAnalysis = {
      timestamp: new Date().toISOString(),
      apiResponses,
      searchAnalysis,
      proceedSuccess,
      finalUrl,
      testSuccess: proceedSuccess && finalUrl.includes('esiid=10443720007962125')
    };
    
    fs.writeFileSync(
      `${artifactDir}/analysis.json`,
      JSON.stringify(fullAnalysis, null, 2)
    );
    
    console.log('\n🏁 ESIID Test Completion Results:');
    console.log('==================================');
    console.log(`✅ Address form filled: ✓`);
    console.log(`✅ Search API called: ${apiResponses.length > 0 ? '✓' : '✗'}`);
    console.log(`✅ Proceed button found: ${searchAnalysis.foundElements.length > 0 ? '✓' : '✗'}`);
    console.log(`✅ Redirected to ComparePower: ${proceedSuccess ? '✓' : '✗'}`);
    console.log(`✅ Contains expected ESIID: ${finalUrl.includes('esiid=10443720007962125') ? '✓' : '✗'}`);
    console.log(`📁 Artifacts saved to: ${artifactDir}`);
    
    if (finalUrl) {
      console.log(`🔗 Final URL: ${finalUrl}`);
      
      // Analyze the URL
      const urlAnalysis = {
        hasESIID: finalUrl.includes('esiid='),
        esiidValue: (finalUrl.match(/esiid=([^&]+)/) || [])[1],
        isExpectedESIID: finalUrl.includes('esiid=10443720007962125'),
        hasPlanID: finalUrl.includes('plan_id='),
        hasZip: finalUrl.includes('zip_code=75001')
      };
      
      console.log('🔍 URL Analysis:');
      Object.entries(urlAnalysis).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value}`);
      });
    }
    
    return fullAnalysis;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ 
      path: `${artifactDir}/error.png`,
      fullPage: true 
    });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testESIIDCompletion().catch(console.error);