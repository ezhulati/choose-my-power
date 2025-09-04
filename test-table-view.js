import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Dallas page with table view...');
    await page.goto('http://localhost:4325/texas/dallas?view=table', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for the page to fully load
    console.log('Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    // Scroll down to the table section
    console.log('Scrolling to table section...');
    await page.evaluate(() => {
      window.scrollBy(0, 800);
    });
    
    // Wait for the table to be visible - use a more generic selector
    console.log('Waiting for table to load...');
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Give it a moment for any animations to complete
    await page.waitForTimeout(1000);
    
    // Check if all columns are visible
    console.log('Checking table columns...');
    
    // Look for the overflow container
    const tableContainer = await page.$('.overflow-x-auto');
    if (tableContainer) {
      // Scroll the table container to the right to see if there are hidden columns
      await tableContainer.evaluate(el => {
        el.scrollLeft = el.scrollWidth;
      });
      await page.waitForTimeout(500);
      
      // Scroll back to start
      await tableContainer.evaluate(el => {
        el.scrollLeft = 0;
      });
      await page.waitForTimeout(500);
    }
    
    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({
      path: 'table-view-initial.png',
      fullPage: false
    });
    
    // Scroll the table container to show Actions column
    console.log('Scrolling table to show Actions column...');
    const tableContainerForScroll = await page.$('.plans-table-container');
    if (tableContainerForScroll) {
      await tableContainerForScroll.evaluate(el => {
        el.scrollLeft = el.scrollWidth - el.clientWidth; // Scroll to far right
      });
      await page.waitForTimeout(500);
    }
    
    // Take screenshot with Actions column visible
    console.log('Taking screenshot with Actions column...');
    await page.screenshot({
      path: 'table-view-with-actions.png',
      fullPage: false
    });
    
    // Take a screenshot of just the table area
    const tableArea = await page.$('.overflow-x-auto') || await page.$('.plans-table-container') || await page.$('table');
    if (tableArea) {
      await tableArea.screenshot({
        path: 'table-only.png'
      });
    }
    
    // Check for the Actions column visibility
    const actionsColumnVisible = await page.isVisible('th:has-text("Actions")');
    console.log('Actions column header visible:', actionsColumnVisible);
    
    // Check if View Details buttons are visible
    const viewDetailsButtons = await page.$$('button:has-text("View Details")');
    console.log('Number of View Details buttons found:', viewDetailsButtons.length);
    
    // Get table dimensions
    const tableDimensions = await page.evaluate(() => {
      const container = document.querySelector('.overflow-x-auto');
      const table = document.querySelector('table');
      if (container && table) {
        return {
          containerWidth: container.clientWidth,
          containerScrollWidth: container.scrollWidth,
          tableWidth: table.clientWidth,
          hasHorizontalScroll: container.scrollWidth > container.clientWidth
        };
      } else if (table) {
        return {
          tableWidth: table.clientWidth,
          tableScrollWidth: table.scrollWidth,
          hasHorizontalScroll: table.scrollWidth > table.clientWidth
        };
      }
      return null;
    });
    
    console.log('Table dimensions:', tableDimensions);
    
    // Check column headers and their visibility
    const columnData = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('th'));
      return headers.map(h => {
        const rect = h.getBoundingClientRect();
        return {
          text: h.textContent.trim(),
          className: h.className,
          visible: rect.width > 0 && rect.height > 0,
          left: rect.left,
          right: rect.right,
          width: rect.width
        };
      });
    });
    console.log('Column data:', JSON.stringify(columnData, null, 2));
    
    // Check if Actions column is in DOM but hidden
    const actionsColInDOM = await page.$('th.actions-col');
    console.log('Actions column in DOM:', !!actionsColInDOM);
    
    // Check table container overflow
    const containerOverflow = await page.evaluate(() => {
      const container = document.querySelector('.plans-table-container');
      if (container) {
        const computed = window.getComputedStyle(container);
        return {
          overflowX: computed.overflowX,
          overflowY: computed.overflowY,
          width: container.clientWidth,
          scrollWidth: container.scrollWidth
        };
      }
      return null;
    });
    console.log('Container overflow:', containerOverflow);
    
    console.log('Screenshots saved successfully!');
    console.log('- table-view-full.png: Full viewport screenshot');
    console.log('- table-only.png: Table container only');
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ 
      path: 'error-screenshot.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();