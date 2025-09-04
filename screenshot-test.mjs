import { chromium } from 'playwright';
import { promises as fs } from 'fs';

async function captureTableView() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Dallas table view...');
    await page.goto('http://localhost:4325/texas/dallas?view=table', {
      waitUntil: 'networkidle'
    });
    
    // Wait for page to load and styles to apply
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take a full page screenshot
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    // Save the screenshot
    await fs.writeFile('/tmp/dallas-table-view.png', screenshot);
    console.log('Screenshot saved to /tmp/dallas-table-view.png');
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
}

captureTableView();