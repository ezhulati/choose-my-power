import { chromium } from 'playwright';

async function verifyTableLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  console.log('1. Navigating to Dallas page...');
  await page.goto('http://localhost:4325/texas/dallas', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for the page to fully load
  await page.waitForTimeout(3000);
  
  console.log('2. Looking for view toggle buttons...');
  
  // Try clicking the table view button with different strategies
  const tableViewClicked = await page.evaluate(() => {
    // Method 1: Find by data-view attribute
    const tableBtn = document.querySelector('[data-view="table"]');
    if (tableBtn) {
      tableBtn.click();
      return 'Clicked table button via data-view';
    }
    
    // Method 2: Find by aria-label
    const ariaBtn = document.querySelector('[aria-label="Table view"]');
    if (ariaBtn) {
      ariaBtn.click();
      return 'Clicked table button via aria-label';
    }
    
    // Method 3: Find by text content
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent.includes('Table')) {
        btn.click();
        return 'Clicked table button via text content';
      }
    }
    
    return 'No table view button found';
  });
  
  console.log('3. Click result:', tableViewClicked);
  
  // Wait for table to appear
  console.log('4. Waiting for table view to activate...');
  await page.waitForTimeout(2000);
  
  // Check if table is visible
  const tableVisible = await page.evaluate(() => {
    const tableView = document.querySelector('.table-view');
    const table = document.querySelector('table');
    return {
      tableViewClass: tableView?.className,
      tableExists: !!table,
      tableVisible: table && getComputedStyle(table).display !== 'none',
      tableViewActive: tableView?.classList.contains('active')
    };
  });
  
  console.log('5. Table visibility:', tableVisible);
  
  // Take screenshots
  const screenshotPath = '/tmp/dallas-table-final.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: false
  });
  console.log(`6. Screenshot saved to: ${screenshotPath}`);
  
  // Scroll to table if needed
  await page.evaluate(() => {
    const table = document.querySelector('table');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Take table-focused screenshot
  const tableScreenshotPath = '/tmp/dallas-table-focused.png';
  await page.screenshot({ 
    path: tableScreenshotPath,
    fullPage: false
  });
  console.log(`7. Table-focused screenshot saved to: ${tableScreenshotPath}`);
  
  // Analyze table layout
  const analysis = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return { error: 'No table found' };
    
    const container = table.closest('.overflow-x-auto') || 
                     table.closest('.overflow-auto') ||
                     table.closest('.plans-table-container') ||
                     table.parentElement;
    
    const headers = Array.from(table.querySelectorAll('th')).map(th => {
      const rect = th.getBoundingClientRect();
      return {
        text: th.textContent.trim(),
        width: rect.width,
        left: rect.left,
        right: rect.right,
        visible: rect.left >= 0 && rect.right <= window.innerWidth
      };
    });
    
    const tableRect = table.getBoundingClientRect();
    const containerRect = container?.getBoundingClientRect();
    
    return {
      tableWidth: table.scrollWidth,
      tableVisibleWidth: tableRect.width,
      containerWidth: container ? container.clientWidth : window.innerWidth,
      containerScrollWidth: container ? container.scrollWidth : table.scrollWidth,
      viewportWidth: window.innerWidth,
      hasHorizontalScroll: container ? container.scrollWidth > container.clientWidth : false,
      tablePosition: {
        left: tableRect.left,
        right: tableRect.right,
        top: tableRect.top
      },
      containerHasOverflow: container ? getComputedStyle(container).overflowX : 'none',
      columns: headers.length,
      headers: headers,
      rows: table.querySelectorAll('tbody tr').length || table.querySelectorAll('tr').length - 1
    };
  });
  
  console.log('\n=== TABLE LAYOUT ANALYSIS ===');
  if (analysis.error) {
    console.log('ERROR:', analysis.error);
  } else {
    console.log(`Viewport Width: ${analysis.viewportWidth}px`);
    console.log(`Container Width: ${analysis.containerWidth}px`);
    console.log(`Container Scroll Width: ${analysis.containerScrollWidth}px`);
    console.log(`Table Width (scrollWidth): ${analysis.tableWidth}px`);
    console.log(`Table Visible Width: ${analysis.tableVisibleWidth}px`);
    console.log(`Table Position: left=${analysis.tablePosition.left}px, right=${analysis.tablePosition.right}px`);
    console.log(`Container Overflow-X: ${analysis.containerHasOverflow}`);
    console.log(`Columns: ${analysis.columns}`);
    console.log(`Rows: ${analysis.rows}`);
    console.log(`Horizontal Scroll Required: ${analysis.hasHorizontalScroll ? 'YES ❌' : 'NO ✅'}`);
    
    console.log('\n=== COLUMN DETAILS ===');
    let allColumnsVisible = true;
    analysis.headers.forEach((col, i) => {
      const visibility = col.visible ? '✅' : '❌';
      console.log(`${i + 1}. "${col.text}" - ${Math.round(col.width)}px [${Math.round(col.left)} to ${Math.round(col.right)}] ${visibility}`);
      if (!col.visible) allColumnsVisible = false;
    });
    
    console.log('\n=== FINAL RESULT ===');
    if (!analysis.hasHorizontalScroll && allColumnsVisible) {
      console.log('✅ SUCCESS: All table columns fit without horizontal scrolling!');
      console.log('   All 6 columns are visible within the viewport.');
    } else if (analysis.hasHorizontalScroll) {
      console.log('❌ FAILURE: Horizontal scrolling is still required.');
      console.log(`   Table (${analysis.tableWidth}px) exceeds container (${analysis.containerWidth}px)`);
    } else if (!allColumnsVisible) {
      console.log('❌ FAILURE: Some columns are not fully visible in the viewport.');
    }
  }
  
  console.log('\nBrowser will remain open for manual inspection. Press Ctrl+C to close.');
  await new Promise(() => {});
}

verifyTableLayout().catch(console.error);