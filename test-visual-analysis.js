import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Dallas-TX page...');
    await page.goto('http://localhost:4326/texas/dallas-tx', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Page loaded, taking screenshot...');
    await page.screenshot({ path: 'dallas-tx-page-full.png', fullPage: true });
    
    console.log('Looking for plan cards...');
    
    // Check for different possible selectors
    const selectors = ['.plan-card-improved', '.plan-card', '[data-plan-id]', '.faceted-plan-grid .grid > *'];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        // Take screenshot of first plan card
        await elements[0].screenshot({ path: `plan-card-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
        console.log(`Screenshot saved for selector: ${selector}`);
        
        // Get the element's HTML for analysis
        const html = await elements[0].innerHTML();
        console.log(`HTML preview for ${selector}:`, html.substring(0, 300) + '...');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
})();