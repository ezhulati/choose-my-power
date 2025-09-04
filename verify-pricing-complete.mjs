import { chromium } from 'playwright';

async function verifyPricingComplete() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('🚀 Navigating to electricity plans page...');
  await page.goto('http://localhost:4326/electricity-plans', {
    waitUntil: 'networkidle'
  });
  
  // Wait for initial content to load
  await page.waitForTimeout(2000);
  
  // 1. Capture Grid View (default)
  console.log('\n📸 Capturing Grid View...');
  await page.screenshot({ 
    path: 'pricing-grid-view.png', 
    fullPage: true 
  });
  
  // Extract pricing from grid view
  const gridPricing = await page.evaluate(() => {
    const plans = [];
    const cards = document.querySelectorAll('.plan-card, [data-testid="plan-card"]');
    
    cards.forEach((card, index) => {
      if (index < 5) { // Get first 5 plans
        const planName = card.querySelector('h3, .font-bold')?.textContent?.trim() || '';
        const rateText = Array.from(card.querySelectorAll('*')).find(el => 
          el.textContent?.includes('¢'))?.textContent?.trim() || '';
        const monthlyText = Array.from(card.querySelectorAll('*')).find(el => 
          el.textContent?.includes('/mo'))?.textContent?.trim() || '';
        
        if (planName || rateText) {
          plans.push({ 
            planName: planName || `Plan ${index + 1}`,
            rateText,
            monthlyText
          });
        }
      }
    });
    
    return plans;
  });
  
  console.log('\n✅ Grid View Pricing:');
  gridPricing.forEach(p => {
    console.log(`   ${p.planName}`);
    if (p.rateText) console.log(`     Rate: ${p.rateText}`);
    if (p.monthlyText) console.log(`     Monthly: ${p.monthlyText}`);
  });
  
  // 2. Switch to Table View
  console.log('\n📸 Switching to Table View...');
  const tableButton = await page.$('button:has-text("Table")');
  if (tableButton) {
    await tableButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'pricing-table-view.png', 
      fullPage: true 
    });
    
    // Extract pricing from table view
    const tablePricing = await page.evaluate(() => {
      const plans = [];
      const rows = document.querySelectorAll('tbody tr');
      
      rows.forEach((row, index) => {
        if (index < 5) { // Get first 5 plans
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const planName = cells[0]?.textContent?.trim() || '';
            const rateText = cells[1]?.textContent?.trim() || '';
            const monthlyText = cells[2]?.textContent?.trim() || '';
            
            plans.push({ planName, rateText, monthlyText });
          }
        }
      });
      
      return plans;
    });
    
    if (tablePricing.length > 0) {
      console.log('\n✅ Table View Pricing:');
      tablePricing.forEach(p => {
        console.log(`   ${p.planName}`);
        console.log(`     Rate: ${p.rateText}`);
        console.log(`     Monthly: ${p.monthlyText}`);
      });
    }
  } else {
    console.log('   Table view button not found');
  }
  
  // 3. Switch to Compact View
  console.log('\n📸 Switching to Compact View...');
  const compactButton = await page.$('button:has-text("Compact")');
  if (compactButton) {
    await compactButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'pricing-compact-view.png', 
      fullPage: true 
    });
    
    // Extract pricing from compact view
    const compactPricing = await page.evaluate(() => {
      const plans = [];
      const cards = document.querySelectorAll('.compact-plan-card, [class*="compact"]');
      
      cards.forEach((card, index) => {
        if (index < 5) { // Get first 5 plans
          const planName = card.querySelector('h3, .font-semibold')?.textContent?.trim() || '';
          const rateText = Array.from(card.querySelectorAll('*')).find(el => 
            el.textContent?.includes('¢'))?.textContent?.trim() || '';
          const monthlyText = Array.from(card.querySelectorAll('*')).find(el => 
            el.textContent?.includes('/mo'))?.textContent?.trim() || '';
          
          if (planName || rateText) {
            plans.push({ 
              planName: planName || `Plan ${index + 1}`,
              rateText,
              monthlyText
            });
          }
        }
      });
      
      return plans;
    });
    
    if (compactPricing.length > 0) {
      console.log('\n✅ Compact View Pricing:');
      compactPricing.forEach(p => {
        console.log(`   ${p.planName}`);
        if (p.rateText) console.log(`     Rate: ${p.rateText}`);
        if (p.monthlyText) console.log(`     Monthly: ${p.monthlyText}`);
      });
    }
  } else {
    console.log('   Compact view button not found');
  }
  
  // 4. Check for pricing issues
  console.log('\n🔍 Checking for pricing anomalies...');
  const pricingAnalysis = await page.evaluate(() => {
    const allText = document.body.innerText;
    
    // Check for problematic values
    const hasHighCents = /\d{3,}\.?\d*¢/.test(allText);
    const hasHighMonthly = /\$\d{4,}\.?\d*\/mo/i.test(allText);
    
    // Count normal pricing patterns
    const normalCents = (allText.match(/\d{1,2}\.?\d*¢/g) || []).length;
    const normalMonthly = (allText.match(/\$\d{1,3}\.?\d*\/mo/gi) || []).length;
    
    return {
      hasHighCents,
      hasHighMonthly,
      normalCents,
      normalMonthly
    };
  });
  
  if (pricingAnalysis.hasHighCents || pricingAnalysis.hasHighMonthly) {
    console.log('⚠️  WARNING: Found potentially incorrect pricing values!');
    if (pricingAnalysis.hasHighCents) console.log('   - High cent values detected (960¢ or similar)');
    if (pricingAnalysis.hasHighMonthly) console.log('   - High monthly values detected ($9600/mo or similar)');
  } else {
    console.log('✅ All pricing values appear correct!');
    console.log(`   - Found ${pricingAnalysis.normalCents} normal cent values (e.g., 8.9¢, 12.4¢)`);
    console.log(`   - Found ${pricingAnalysis.normalMonthly} normal monthly values`);
  }
  
  // 5. Capture detailed view of one plan card
  console.log('\n📸 Capturing detailed plan card...');
  const firstCard = await page.$('.plan-card, [data-testid="plan-card"], tbody tr:first-of-type');
  if (firstCard) {
    await firstCard.screenshot({ path: 'pricing-detail-card.png' });
    console.log('✅ Detailed card screenshot saved');
  }
  
  console.log('\n✨ Verification complete! Screenshots saved:');
  console.log('   - pricing-grid-view.png');
  console.log('   - pricing-table-view.png');
  console.log('   - pricing-compact-view.png');
  console.log('   - pricing-detail-card.png');
  
  await browser.close();
}

verifyPricingComplete().catch(console.error);