import { chromium, firefox, webkit } from 'playwright';

const browsers = [
  { name: 'Chromium', launch: chromium },
  { name: 'Firefox', launch: firefox },
  { name: 'WebKit (Safari)', launch: webkit }
];

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Large Desktop', width: 2560, height: 1440 }
];

const testStates = [
  'default',
  'hover',
  'focus',
  'active'
];

async function runCrossBrowserTests() {
  for (const browserConfig of browsers) {
    const browser = await browserConfig.launch.launch({ headless: false });
    
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      try {
        console.log(`Testing ${browserConfig.name} at ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await page.goto('http://localhost:4326/texas/dallas-tx', { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        });
        
        // Wait for plan cards to load
        await page.waitForSelector('.plan-card-improved', { timeout: 30000 });
        
        // Take default state screenshot
        await page.screenshot({ 
          path: `screenshots/${browserConfig.name.toLowerCase()}-${viewport.name.toLowerCase()}-default.png`,
          fullPage: true 
        });
        
        // Test plan card interactions
        const firstCard = page.locator('.plan-card-improved').first();
        
        // Hover state
        await firstCard.hover();
        await page.screenshot({ 
          path: `screenshots/${browserConfig.name.toLowerCase()}-${viewport.name.toLowerCase()}-hover.png`,
          clip: await firstCard.boundingBox()
        });
        
        // Focus state on enroll button
        await firstCard.locator('.enroll-btn').focus();
        await page.screenshot({ 
          path: `screenshots/${browserConfig.name.toLowerCase()}-${viewport.name.toLowerCase()}-focus.png`,
          clip: await firstCard.boundingBox()
        });
        
        // Test comparison toggle
        await firstCard.locator('.compare-btn').click();
        await page.waitForTimeout(500); // Wait for state change
        await page.screenshot({ 
          path: `screenshots/${browserConfig.name.toLowerCase()}-${viewport.name.toLowerCase()}-comparison.png`,
          clip: await firstCard.boundingBox()
        });
        
        // Analyze visual properties
        const cardStyles = await firstCard.evaluate((element) => {
          const computed = window.getComputedStyle(element);
          return {
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow,
            backgroundColor: computed.backgroundColor,
            padding: computed.padding,
            gap: computed.gap,
            display: computed.display,
            gridTemplateColumns: computed.gridTemplateColumns
          };
        });
        
        console.log(`${browserConfig.name} ${viewport.name} styles:`, cardStyles);
        
        // Test badge positioning
        const badges = await page.locator('.plan-card-improved .absolute').all();
        for (let i = 0; i < badges.length; i++) {
          const badgeBox = await badges[i].boundingBox();
          console.log(`${browserConfig.name} ${viewport.name} Badge ${i}:`, badgeBox);
        }
        
        // Test button accessibility
        const buttons = await firstCard.locator('button, a[href]').all();
        for (let i = 0; i < buttons.length; i++) {
          const buttonBox = await buttons[i].boundingBox();
          const isAccessible = buttonBox && buttonBox.width >= 44 && buttonBox.height >= 44;
          console.log(`${browserConfig.name} ${viewport.name} Button ${i} accessible:`, isAccessible, buttonBox);
        }
        
      } catch (error) {
        console.error(`Error testing ${browserConfig.name} ${viewport.name}:`, error.message);
      }
      
      await context.close();
    }
    
    await browser.close();
  }
}

// Create screenshots directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('screenshots', { recursive: true });
} catch (e) {}

runCrossBrowserTests().catch(console.error);