import { chromium } from 'playwright';

async function checkTableView() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to Dallas page...');
  await page.goto('http://localhost:4325/texas/dallas', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for page to load and click on table view
  console.log('Waiting for view toggle buttons...');
  await page.waitForSelector('[aria-label="Table view"], button:has-text("Table"), [data-view="table"]', { timeout: 10000 }).catch(() => {
    console.log('Could not find table view button with aria-label');
  });
  
  // Try to click on table view button
  console.log('Clicking on table view...');
  const clicked = await page.evaluate(() => {
    // Try different selectors for the table view button
    const selectors = [
      '[aria-label="Table view"]',
      'button:has(svg[class*="table"])',
      'button[title*="Table"]',
      '[data-view="table"]',
      'button.bg-white:has(svg)'
    ];
    
    for (const selector of selectors) {
      try {
        const btn = document.querySelector(selector);
        if (btn && btn.textContent?.includes('Table') === false) {
          // Likely the table icon button
          btn.click();
          return `Clicked using selector: ${selector}`;
        }
      } catch (e) {}
    }
    
    // If no icon button found, look for any button that might toggle view
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const svg = btn.querySelector('svg');
      if (svg && !btn.textContent.trim()) {
        // Button with only SVG icon, likely view toggle
        if (btn.getAttribute('aria-pressed') === 'false' || 
            btn.classList.contains('bg-gray-100')) {
          btn.click();
          return 'Clicked on icon button';
        }
      }
    }
    
    return 'No table view button found';
  });
  
  console.log(clicked);
  
  // Wait for table to appear
  console.log('Waiting for table to load...');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  const screenshotPath = '/tmp/dallas-table-view-proper.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: false
  });
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Analyze table layout
  const analysis = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return { error: 'No table found' };
    
    const container = table.closest('.overflow-x-auto') || 
                     table.closest('.overflow-auto') ||
                     table.parentElement;
    
    const headers = Array.from(table.querySelectorAll('th')).map(th => ({
      text: th.textContent.trim(),
      width: th.getBoundingClientRect().width,
      visible: th.getBoundingClientRect().left >= 0 && 
               th.getBoundingClientRect().right <= window.innerWidth
    }));
    
    return {
      tableWidth: table.scrollWidth,
      containerWidth: container ? container.clientWidth : window.innerWidth,
      viewportWidth: window.innerWidth,
      hasHorizontalScroll: container ? container.scrollWidth > container.clientWidth : false,
      columns: headers.length,
      headers: headers,
      rows: table.querySelectorAll('tbody tr').length || table.querySelectorAll('tr').length - 1
    };
  });
  
  console.log('\n=== Table Layout Analysis ===');
  if (analysis.error) {
    console.log('ERROR:', analysis.error);
  } else {
    console.log(`Viewport: ${analysis.viewportWidth}px`);
    console.log(`Container: ${analysis.containerWidth}px`);  
    console.log(`Table: ${analysis.tableWidth}px`);
    console.log(`Columns: ${analysis.columns}`);
    console.log(`Rows: ${analysis.rows}`);
    console.log(`Horizontal scroll needed: ${analysis.hasHorizontalScroll ? 'YES ❌' : 'NO ✅'}`);
    
    console.log('\n=== Column Details ===');
    analysis.headers.forEach((col, i) => {
      console.log(`${i + 1}. ${col.text}`);
      console.log(`   Width: ${Math.round(col.width)}px`);
      console.log(`   Visible: ${col.visible ? 'YES ✅' : 'NO ❌'}`);
    });
    
    // Summary
    const allVisible = analysis.headers.every(h => h.visible);
    console.log(`\n=== RESULT ===`);
    if (analysis.hasHorizontalScroll) {
      console.log('❌ HORIZONTAL SCROLLING REQUIRED');
      console.log(`   Table (${analysis.tableWidth}px) exceeds container (${analysis.containerWidth}px)`);
    } else if (!allVisible) {
      console.log('❌ SOME COLUMNS NOT FULLY VISIBLE');
    } else {
      console.log('✅ ALL COLUMNS FIT WITHOUT SCROLLING!');
    }
  }
  
  console.log('\nBrowser will remain open for inspection. Press Ctrl+C to close.');
  await new Promise(() => {});
}

checkTableView().catch(console.error);