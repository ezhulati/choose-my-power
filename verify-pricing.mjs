import { chromium } from 'playwright';

async function verifyPricing() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to electricity plans page...');
  await page.goto('http://localhost:4326/electricity-plans', {
    waitUntil: 'networkidle'
  });
  
  // Wait for plans to load
  console.log('Waiting for plans to load...');
  await page.waitForSelector('[data-testid="plan-card"], .plan-card, tbody tr', { 
    timeout: 30000,
    state: 'visible'
  });
  
  // Capture Grid View (default)
  console.log('Capturing Grid View...');
  await page.screenshot({ 
    path: 'pricing-grid-view.png', 
    fullPage: true 
  });
  
  // Extract pricing data from grid view
  const gridPrices = await page.evaluate(() => {
    const plans = document.querySelectorAll('[data-testid="plan-card"]');
    const prices = [];
    plans.forEach((plan, index) => {
      if (index < 3) { // Get first 3 plans
        const rateText = plan.querySelector('.text-3xl, .text-2xl')?.textContent || '';
        const monthlyText = plan.querySelector('.text-gray-600')?.textContent || '';
        const planName = plan.querySelector('h3')?.textContent || '';
        prices.push({ planName, rateText, monthlyText });
      }
    });
    return prices;
  });
  
  console.log('\n--- Grid View Pricing ---');
  gridPrices.forEach(p => {
    console.log(`Plan: ${p.planName}`);
    console.log(`  Rate: ${p.rateText}`);
    console.log(`  Monthly: ${p.monthlyText}`);
  });
  
  // Switch to Table View
  console.log('\nSwitching to Table View...');
  const tableButton = await page.$('button:has-text("Table")');
  if (tableButton) {
    await tableButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'pricing-table-view.png', 
      fullPage: true 
    });
    
    // Extract pricing data from table view
    const tablePrices = await page.evaluate(() => {
      const rows = document.querySelectorAll('.plan-row, tr[data-testid="plan-row"]');
      const prices = [];
      rows.forEach((row, index) => {
        if (index < 3) { // Get first 3 plans
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const planName = cells[0]?.textContent?.trim() || '';
            const rateText = cells[1]?.textContent?.trim() || '';
            const monthlyText = cells[2]?.textContent?.trim() || '';
            prices.push({ planName, rateText, monthlyText });
          }
        }
      });
      return prices;
    });
    
    console.log('\n--- Table View Pricing ---');
    tablePrices.forEach(p => {
      console.log(`Plan: ${p.planName}`);
      console.log(`  Rate: ${p.rateText}`);
      console.log(`  Monthly: ${p.monthlyText}`);
    });
  }
  
  // Switch to Compact View
  console.log('\nSwitching to Compact View...');
  const compactButton = await page.$('button:has-text("Compact")');
  if (compactButton) {
    await compactButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'pricing-compact-view.png', 
      fullPage: true 
    });
    
    // Extract pricing data from compact view
    const compactPrices = await page.evaluate(() => {
      const cards = document.querySelectorAll('.compact-plan-card, [data-testid="compact-plan"]');
      const prices = [];
      cards.forEach((card, index) => {
        if (index < 3) { // Get first 3 plans
          const planName = card.querySelector('h3, .font-semibold')?.textContent || '';
          const rateText = card.querySelector('.text-xl, .text-lg')?.textContent || '';
          const monthlyText = Array.from(card.querySelectorAll('.text-sm')).find(el => 
            el.textContent?.includes('/mo'))?.textContent || '';
          prices.push({ planName, rateText, monthlyText });
        }
      });
      return prices;
    });
    
    console.log('\n--- Compact View Pricing ---');
    compactPrices.forEach(p => {
      console.log(`Plan: ${p.planName}`);
      console.log(`  Rate: ${p.rateText}`);
      console.log(`  Monthly: ${p.monthlyText}`);
    });
  }
  
  // Check for any extreme values
  console.log('\nChecking for pricing issues...');
  const allPriceTexts = await page.evaluate(() => {
    const texts = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      // Check for problematic values
      if (text.match(/\d{3,}\.?\d*¢/) || text.match(/\$\d{4,}/)) {
        texts.push(text);
      }
    });
    return texts;
  });
  
  if (allPriceTexts.length > 0) {
    console.log('\n⚠️  WARNING: Found potentially incorrect pricing values:');
    allPriceTexts.forEach(text => console.log(`  - ${text}`));
  } else {
    console.log('✅ No extreme pricing values detected (no 960¢ or $9600/mo type values)');
  }
  
  // Capture a close-up of a single plan card for detail
  console.log('\nCapturing detailed view of first plan card...');
  const firstPlan = await page.$('[data-testid="plan-card"], .plan-row, .compact-plan-card');
  if (firstPlan) {
    await firstPlan.screenshot({ path: 'pricing-detail.png' });
  }
  
  console.log('\n✅ Screenshots saved:');
  console.log('  - pricing-grid-view.png');
  console.log('  - pricing-table-view.png');
  console.log('  - pricing-compact-view.png');
  console.log('  - pricing-detail.png');
  
  await browser.close();
}

verifyPricing().catch(console.error);