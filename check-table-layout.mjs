import { chromium } from 'playwright';

async function checkTableLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // High-quality screenshots
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to Dallas table view...');
  await page.goto('http://localhost:4325/texas/dallas?view=table', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for table to be fully loaded - try multiple possible selectors
  try {
    await page.waitForSelector('table', { timeout: 5000 });
  } catch {
    console.log('Table not found with simple selector, trying alternatives...');
    await page.waitForSelector('[data-testid="plans-table"]', { timeout: 5000 }).catch(() => {});
  }
  
  // Take full page screenshot
  const screenshotPath = '/tmp/dallas-table-view.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: false // Just viewport to see if horizontal scroll is needed
  });
  
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Check if horizontal scrolling is present
  const hasHorizontalScroll = await page.evaluate(() => {
    // Try multiple possible container selectors
    const container = document.querySelector('.overflow-x-auto') || 
                     document.querySelector('.overflow-auto') ||
                     document.querySelector('[style*="overflow"]') ||
                     document.querySelector('table')?.parentElement;
    if (!container) return false;
    return container.scrollWidth > container.clientWidth;
  });
  
  // Get table dimensions
  const tableDimensions = await page.evaluate(() => {
    const table = document.querySelector('table');
    const container = document.querySelector('.overflow-x-auto') || 
                     document.querySelector('.overflow-auto') ||
                     table?.parentElement;
    if (!table) return null;
    
    return {
      tableWidth: table.scrollWidth,
      containerWidth: container ? container.clientWidth : window.innerWidth,
      viewportWidth: window.innerWidth,
      columns: table.querySelectorAll('thead th').length || table.querySelectorAll('th').length,
      rowCount: table.querySelectorAll('tbody tr').length || table.querySelectorAll('tr').length - 1
    };
  });
  
  // Check column visibility
  const columnVisibility = await page.evaluate(() => {
    const headers = document.querySelectorAll('thead th') || document.querySelectorAll('th');
    const results = [];
    
    headers.forEach((header, index) => {
      const rect = header.getBoundingClientRect();
      results.push({
        text: header.textContent.trim(),
        isFullyVisible: rect.left >= 0 && rect.right <= window.innerWidth,
        left: rect.left,
        right: rect.right,
        width: rect.width
      });
    });
    
    return results;
  });
  
  console.log('\n=== Table Layout Analysis ===');
  console.log('Viewport width:', tableDimensions?.viewportWidth, 'px');
  console.log('Container width:', tableDimensions?.containerWidth, 'px');
  console.log('Table width:', tableDimensions?.tableWidth, 'px');
  console.log('Number of columns:', tableDimensions?.columns);
  console.log('Number of rows:', tableDimensions?.rowCount);
  console.log('\nHorizontal scrolling required:', hasHorizontalScroll ? 'YES ❌' : 'NO ✅');
  
  console.log('\n=== Column Visibility ===');
  columnVisibility.forEach((col, i) => {
    console.log(`Column ${i + 1}: "${col.text}"`);
    console.log(`  Width: ${Math.round(col.width)}px`);
    console.log(`  Position: ${Math.round(col.left)} to ${Math.round(col.right)}`);
    console.log(`  Fully visible: ${col.isFullyVisible ? 'YES ✅' : 'NO ❌'}`);
  });
  
  // Check for specific UI elements
  const uiCheck = await page.evaluate(() => {
    const results = {
      hasRatingStars: document.querySelectorAll('.fa-star').length > 0,
      hasViewDetailsButtons: document.querySelectorAll('button:has-text("View Details")').length > 0 || 
                              document.querySelectorAll('a:has-text("View Details")').length > 0 ||
                              document.querySelectorAll('button').length > 0,
      hasPlanLinks: document.querySelectorAll('td a').length > 0,
      hasFeatureBadges: document.querySelectorAll('[class*="badge"], [class*="chip"], [class*="tag"]').length > 0
    };
    return results;
  });
  
  console.log('\n=== UI Elements Check ===');
  console.log('Rating stars present:', uiCheck.hasRatingStars ? 'YES ✅' : 'NO ⚠️');
  console.log('View Details buttons:', uiCheck.hasViewDetailsButtons ? 'YES ✅' : 'NO ⚠️');
  console.log('Plan links present:', uiCheck.hasPlanLinks ? 'YES ✅' : 'NO ⚠️');
  console.log('Feature badges:', uiCheck.hasFeatureBadges ? 'YES ✅' : 'NO ⚠️');
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  // Keep browser open for manual inspection
  console.log('\n✅ Screenshot captured. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close when done reviewing.');
  
  // Keep the script running
  await new Promise(() => {});
}

checkTableLayout().catch(console.error);