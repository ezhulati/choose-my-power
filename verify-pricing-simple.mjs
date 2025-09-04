import { chromium } from 'playwright';

async function verifyPricing() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('Page error:', err));
  
  console.log('Navigating to electricity plans page...');
  await page.goto('http://localhost:4326/electricity-plans', {
    waitUntil: 'domcontentloaded'
  });
  
  // Wait a moment for React to render
  console.log('Waiting for initial render...');
  await page.waitForTimeout(3000);
  
  // Take screenshot of current state
  console.log('Taking screenshot of current state...');
  await page.screenshot({ 
    path: 'pricing-current-state.png', 
    fullPage: true 
  });
  
  // Check what's on the page
  const pageContent = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasPlans = bodyText.includes('plan') || bodyText.includes('Plan');
    const hasError = bodyText.includes('error') || bodyText.includes('Error');
    const hasLoading = bodyText.includes('loading') || bodyText.includes('Loading');
    
    // Look for any plan-related elements
    const planElements = document.querySelectorAll('[class*="plan"], [id*="plan"], tbody tr, .grid > div');
    
    return {
      hasPlans,
      hasError, 
      hasLoading,
      planElementCount: planElements.length,
      firstFewWords: bodyText.substring(0, 200),
      title: document.title
    };
  });
  
  console.log('\n--- Page Analysis ---');
  console.log('Title:', pageContent.title);
  console.log('Has plan mentions:', pageContent.hasPlans);
  console.log('Has error messages:', pageContent.hasError);
  console.log('Has loading indicators:', pageContent.hasLoading);
  console.log('Plan-like elements found:', pageContent.planElementCount);
  console.log('First 200 chars:', pageContent.firstFewWords);
  
  // Try to find pricing information regardless of structure
  console.log('\n--- Searching for Pricing Information ---');
  const pricingInfo = await page.evaluate(() => {
    const prices = [];
    
    // Search for cent values (like 8.9¢, 12.4¢)
    const centRegex = /\d+\.?\d*¢/g;
    const monthlyRegex = /\$\d+\.?\d*\/mo/gi;
    
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      
      // Find cent values
      const centMatches = text.match(centRegex);
      if (centMatches) {
        centMatches.forEach(match => {
          const value = parseFloat(match.replace('¢', ''));
          if (value > 0 && value < 100) { // Reasonable cent values
            if (!prices.find(p => p.text === match)) {
              prices.push({ text: match, value, type: 'rate' });
            }
          }
        });
      }
      
      // Find monthly values
      const monthlyMatches = text.match(monthlyRegex);
      if (monthlyMatches) {
        monthlyMatches.forEach(match => {
          const value = parseFloat(match.replace('$', '').replace('/mo', ''));
          if (value > 0 && value < 1000) { // Reasonable monthly values
            if (!prices.find(p => p.text === match)) {
              prices.push({ text: match, value, type: 'monthly' });
            }
          }
        });
      }
    });
    
    // Also check for problematic values
    const problematicPrices = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      // Check for 960¢ or similar high cent values
      const badCentMatch = text.match(/\d{3,}\.?\d*¢/);
      if (badCentMatch) {
        problematicPrices.push(badCentMatch[0]);
      }
      // Check for $9600/mo or similar high monthly values
      const badMonthlyMatch = text.match(/\$\d{4,}\.?\d*\/mo/i);
      if (badMonthlyMatch) {
        problematicPrices.push(badMonthlyMatch[0]);
      }
    });
    
    return { prices, problematicPrices };
  });
  
  if (pricingInfo.prices.length > 0) {
    console.log('\nFound pricing values:');
    pricingInfo.prices.forEach(p => {
      console.log(`  ${p.type === 'rate' ? 'Rate' : 'Monthly'}: ${p.text}`);
    });
  } else {
    console.log('\nNo pricing values found on the page');
  }
  
  if (pricingInfo.problematicPrices.length > 0) {
    console.log('\n⚠️  WARNING: Found problematic pricing values:');
    pricingInfo.problematicPrices.forEach(p => console.log(`  - ${p}`));
  } else {
    console.log('\n✅ No problematic pricing values detected (no 960¢ or $9600/mo)');
  }
  
  console.log('\n✅ Screenshot saved: pricing-current-state.png');
  
  await browser.close();
}

verifyPricing().catch(console.error);