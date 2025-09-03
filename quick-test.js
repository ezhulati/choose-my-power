import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4324';
const PLAN_URL = `${BASE_URL}/electricity-plans/plans/rhythm-energy/rhythm-saver-12`;

async function quickTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log errors and console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[ERROR] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('🚀 Testing plan page...');
    await page.goto(PLAN_URL, { waitUntil: 'domcontentloaded' });
    
    // Wait for React to potentially hydrate
    await page.waitForTimeout(5000);
    
    // Check for "Select" buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('🔘 All buttons:', buttons);
    
    const selectButtons = buttons.filter(text => 
      text.toLowerCase().includes('select') || 
      text.toLowerCase().includes('choose') ||
      text.toLowerCase().includes('order')
    );
    
    if (selectButtons.length > 0) {
      console.log('✅ Found select buttons:', selectButtons);
      
      // Try clicking the first one
      const button = page.locator('button:has-text("Select This Plan"), button:has-text("Select")').first();
      if (await button.isVisible()) {
        console.log('🔘 Clicking select button...');
        await button.click();
        await page.waitForTimeout(2000);
        
        // Check for modal
        const modalCount = await page.locator('[role="dialog"], [data-testid*="modal"]').count();
        console.log(`📂 Modal count after click: ${modalCount}`);
        
        if (modalCount > 0) {
          console.log('🎉 SUCCESS: Modal opened!');
          
          // Take screenshot
          await page.screenshot({ path: './artifacts/modal_success.png', fullPage: true });
        }
      }
    } else {
      console.log('❌ No select buttons found');
    }
    
    await page.screenshot({ path: './artifacts/plan_page_test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

quickTest();