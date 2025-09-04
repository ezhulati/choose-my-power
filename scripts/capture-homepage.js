import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set a desktop viewport for a comprehensive view
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:4325/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for key elements to ensure page is fully loaded
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Wait a bit more for any animations to complete
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `homepage-screenshot-${timestamp}.png`;
    
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    
    // Also take a viewport-only screenshot for the hero section
    const heroScreenshotPath = `homepage-hero-${timestamp}.png`;
    await page.screenshot({ 
      path: heroScreenshotPath,
      fullPage: false
    });
    
    console.log(`Hero screenshot saved: ${heroScreenshotPath}`);
    
    // Scroll down to capture more sections
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    
    const midScreenshotPath = `homepage-mid-${timestamp}.png`;
    await page.screenshot({ 
      path: midScreenshotPath,
      fullPage: false
    });
    
    console.log(`Mid-section screenshot saved: ${midScreenshotPath}`);
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
})();