import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Dallas page...');
    await page.goto('http://localhost:4326/texas/dallas', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Check if we're in grid view (default) or need to switch
    const tableView = await page.$('table.min-w-full');
    if (tableView) {
      console.log('Currently in table view, switching to grid view...');
      // Look for view toggle buttons
      const gridButton = await page.$('button:has-text("Grid"), [aria-label*="Grid"]');
      if (gridButton) {
        await gridButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Wait for plan cards to be visible - use a more specific selector
    try {
      await page.waitForSelector('.compact-plan-card, .plan-card, article', {
        timeout: 10000,
        state: 'attached'
      });
    } catch (e) {
      console.log('Note: Timeout waiting for cards, but continuing...');
    }
    
    console.log('Page loaded, scrolling to capture full content...');
    
    // Scroll down slowly to load all lazy-loaded content
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if(totalHeight >= scrollHeight - window.innerHeight){
            clearInterval(timer);
            // Scroll back to top
            window.scrollTo(0, 0);
            setTimeout(resolve, 1000);
          }
        }, 100);
      });
    });
    
    // Take a full page screenshot
    console.log('Taking full page screenshot...');
    await page.screenshot({ 
      path: 'dallas-grid-view-full.png',
      fullPage: true
    });
    
    console.log('Full page screenshot saved as dallas-grid-view-full.png');
    
    // Also take a screenshot of just the first few plan cards for detail
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'dallas-grid-view-cards.png',
      fullPage: false
    });
    
    console.log('Plan cards detail screenshot saved as dallas-grid-view-cards.png');
    
    // Look for specific design elements
    console.log('\nChecking for Texas design system elements...');
    
    const designChecks = {
      'Texas accent borders': await page.$$eval('[class*="border-t-4"], [class*="border-t-2"]', els => els.length),
      'Provider logos': await page.$$eval('img[alt*="logo"], img[src*="provider"]', els => els.length),
      'Feature badges': await page.$$eval('[class*="badge"], [class*="chip"], .flex.items-center.gap-2.text-sm', els => els.length),
      'Pricing tables': await page.$$eval('[class*="pricing"], table, .grid.grid-cols-3', els => els.length),
      'CTA buttons': await page.$$eval('a[href*="enroll"], button:has-text("View Details"), a:has-text("View Details")', els => els.length),
      'Card hover effects': await page.$$eval('[class*="hover:shadow"], [class*="transition"]', els => els.length)
    };
    
    console.log('\nDesign elements found:');
    for (const [element, count] of Object.entries(designChecks)) {
      console.log(`- ${element}: ${count > 0 ? `✓ Found (${count})` : '✗ Not found'}`);
    }
    
    // Check for specific Texas colors in computed styles
    const texasColors = await page.evaluate(() => {
      const cards = document.querySelectorAll('article, .plan-card, [class*="plan-card"]');
      const colorResults = {
        texasNavy: 0,
        texasRed: 0,
        texasGold: 0,
        gradients: 0
      };
      
      cards.forEach(card => {
        const styles = window.getComputedStyle(card);
        const allStyles = card.getAttribute('class') + ' ' + card.getAttribute('style');
        
        if (allStyles) {
          if (allStyles.includes('002868') || allStyles.includes('navy')) colorResults.texasNavy++;
          if (allStyles.includes('dc2626') || allStyles.includes('red-')) colorResults.texasRed++;
          if (allStyles.includes('f59e0b') || allStyles.includes('amber-') || allStyles.includes('gold')) colorResults.texasGold++;
          if (allStyles.includes('gradient')) colorResults.gradients++;
        }
      });
      
      return colorResults;
    });
    
    console.log('\nTexas color usage:');
    console.log(`- Texas Navy elements: ${texasColors.texasNavy}`);
    console.log(`- Texas Red elements: ${texasColors.texasRed}`);
    console.log(`- Texas Gold elements: ${texasColors.texasGold}`);
    console.log(`- Gradient elements: ${texasColors.gradients}`);
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
    console.log('\nVerification complete!');
  }
})();