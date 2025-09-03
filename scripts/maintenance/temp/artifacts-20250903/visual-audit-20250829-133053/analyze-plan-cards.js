import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function analyzePlanCards() {
  console.log('🚀 Starting Plan Cards Analysis...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`🔍 Console [${msg.type()}]:`, msg.text());
  });
  
  // Log network errors
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`❌ Network Error: ${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Navigating to Dallas TX page...');
    await page.goto('http://localhost:4325/texas/dallas-tx', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for plan cards to load
    console.log('⏳ Waiting for plan cards to load...');
    await page.waitForSelector('[data-testid="plan-card"], .plan-card, [class*="plan"], [class*="card"]', { 
      timeout: 15000 
    });
    
    // Capture full page screenshot
    console.log('📸 Capturing full page screenshot...');
    await page.screenshot({ 
      path: './artifacts/visual-audit-20250829-133053/full-page-before.png', 
      fullPage: true 
    });
    
    // Capture viewport screenshot
    await page.screenshot({ 
      path: './artifacts/visual-audit-20250829-133053/viewport-before.png'
    });
    
    // Find all plan cards
    const planCardSelectors = [
      '[data-testid="plan-card"]',
      '.plan-card',
      '[class*="plan-card"]',
      '[class*="electricity-plan"]',
      '.card',
      '[class*="card"]:has(.price)',
      '[class*="plan"]:has(.rate)',
      'article',
      '[role="article"]'
    ];
    
    let planCards = [];
    for (const selector of planCardSelectors) {
      try {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          console.log(`✅ Found ${cards.length} elements with selector: ${selector}`);
          planCards = cards;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (planCards.length === 0) {
      // Try to find any container that might hold plan information
      console.log('🔍 Searching for plan containers with broader selectors...');
      const broadSelectors = [
        'div:has(.price)',
        'div:has([class*="rate"])',
        'div:has([class*="kwh"])',
        'div:has(button)',
        '[class*="grid"] > div',
        'main div[class*="card"]',
        'section > div'
      ];
      
      for (const selector of broadSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`📦 Found ${elements.length} potential plan containers: ${selector}`);
            // Filter elements that seem to contain plan information
            for (const element of elements) {
              const text = await element.textContent();
              if (text && (text.includes('¢') || text.includes('$') || text.includes('kWh') || text.includes('month'))) {
                planCards.push(element);
              }
            }
            if (planCards.length > 0) break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    console.log(`📊 Analysis: Found ${planCards.length} plan cards`);
    
    if (planCards.length === 0) {
      // Capture page content for analysis
      const bodyContent = await page.textContent('body');
      console.log('📄 Page content preview:', bodyContent.substring(0, 500) + '...');
      
      // Get page HTML structure
      const htmlStructure = await page.evaluate(() => {
        const getStructure = (element, depth = 0) => {
          if (depth > 3) return '';
          let result = '  '.repeat(depth) + element.tagName.toLowerCase();
          if (element.className) result += `.${element.className.split(' ').join('.')}`;
          if (element.id) result += `#${element.id}`;
          result += '\n';
          
          for (const child of element.children) {
            result += getStructure(child, depth + 1);
          }
          return result;
        };
        
        return getStructure(document.body);
      });
      
      fs.writeFileSync('./artifacts/visual-audit-20250829-133053/page-structure.txt', htmlStructure);
      console.log('📝 Saved page HTML structure for analysis');
    }
    
    // Analyze each plan card
    const analysisResults = [];
    
    for (let i = 0; i < Math.min(planCards.length, 10); i++) { // Limit to first 10 for performance
      console.log(`🔍 Analyzing plan card ${i + 1}...`);
      
      try {
        // Scroll card into view
        await planCards[i].scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        // Capture individual card screenshot
        await planCards[i].screenshot({ 
          path: `./artifacts/visual-audit-20250829-133053/plan-card-${i + 1}.png` 
        });
        
        // Analyze card structure and styling
        const cardAnalysis = await page.evaluate((element) => {
          const computedStyle = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          // Get text content and structure
          const textContent = element.textContent || '';
          const innerHTML = element.innerHTML;
          
          // Find buttons
          const buttons = element.querySelectorAll('button, a[role="button"], .btn');
          const buttonInfo = Array.from(buttons).map(btn => ({
            text: btn.textContent?.trim(),
            className: btn.className,
            styles: {
              backgroundColor: window.getComputedStyle(btn).backgroundColor,
              color: window.getComputedStyle(btn).color,
              padding: window.getComputedStyle(btn).padding,
              borderRadius: window.getComputedStyle(btn).borderRadius,
              border: window.getComputedStyle(btn).border
            }
          }));
          
          // Find badges/tags
          const badges = element.querySelectorAll('.badge, .tag, [class*="badge"], [class*="tag"]');
          const badgeInfo = Array.from(badges).map(badge => ({
            text: badge.textContent?.trim(),
            className: badge.className,
            styles: {
              backgroundColor: window.getComputedStyle(badge).backgroundColor,
              color: window.getComputedStyle(badge).color,
              padding: window.getComputedStyle(badge).padding,
              borderRadius: window.getComputedStyle(badge).borderRadius
            }
          }));
          
          // Find price information
          const priceElements = element.querySelectorAll('[class*="price"], [class*="rate"], .cost');
          const priceInfo = Array.from(priceElements).map(price => ({
            text: price.textContent?.trim(),
            className: price.className,
            fontSize: window.getComputedStyle(price).fontSize,
            fontWeight: window.getComputedStyle(price).fontWeight,
            color: window.getComputedStyle(price).color
          }));
          
          return {
            dimensions: {
              width: rect.width,
              height: rect.height
            },
            styles: {
              backgroundColor: computedStyle.backgroundColor,
              border: computedStyle.border,
              borderRadius: computedStyle.borderRadius,
              padding: computedStyle.padding,
              margin: computedStyle.margin,
              boxShadow: computedStyle.boxShadow,
              display: computedStyle.display,
              gap: computedStyle.gap
            },
            textContent: textContent.substring(0, 200),
            buttons: buttonInfo,
            badges: badgeInfo,
            prices: priceInfo,
            className: element.className,
            tagName: element.tagName.toLowerCase()
          };
        }, planCards[i]);
        
        analysisResults.push({
          cardIndex: i + 1,
          ...cardAnalysis
        });
        
      } catch (error) {
        console.log(`❌ Error analyzing card ${i + 1}:`, error.message);
        analysisResults.push({
          cardIndex: i + 1,
          error: error.message
        });
      }
    }
    
    // Test different viewports
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      await page.waitForTimeout(1000); // Allow layout to adjust
      
      await page.screenshot({ 
        path: `./artifacts/visual-audit-20250829-133053/${viewport.name}-view.png`,
        fullPage: true 
      });
    }
    
    // Generate analysis report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:4325/texas/dallas-tx',
      totalPlanCards: planCards.length,
      analysisResults,
      recommendations: generateRecommendations(analysisResults)
    };
    
    fs.writeFileSync(
      './artifacts/visual-audit-20250829-133053/plan-cards-analysis.json', 
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Analysis complete! Check the artifacts directory for results.');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    
    // Capture error screenshot
    await page.screenshot({ 
      path: './artifacts/visual-audit-20250829-133053/error-screenshot.png' 
    });
    
    // Get page source for debugging
    const pageSource = await page.content();
    fs.writeFileSync('./artifacts/visual-audit-20250829-133053/page-source.html', pageSource);
  }
  
  await browser.close();
}

function generateRecommendations(analysisResults) {
  const recommendations = [];
  
  if (analysisResults.length === 0) {
    return [{
      category: 'Critical',
      issue: 'No plan cards found',
      recommendation: 'Investigate page loading or card selector issues',
      priority: 'High'
    }];
  }
  
  // Analyze consistency across cards
  const cardStyles = analysisResults.filter(r => !r.error).map(r => r.styles);
  const buttonStyles = analysisResults.filter(r => !r.error && r.buttons).flatMap(r => r.buttons);
  const badgeStyles = analysisResults.filter(r => !r.error && r.badges).flatMap(r => r.badges);
  
  // Check for consistency issues
  if (cardStyles.length > 1) {
    const backgroundColors = [...new Set(cardStyles.map(s => s.backgroundColor))];
    if (backgroundColors.length > 2) {
      recommendations.push({
        category: 'Visual Consistency',
        issue: 'Inconsistent card background colors',
        recommendation: 'Standardize card background colors using design system tokens',
        priority: 'Medium',
        details: `Found ${backgroundColors.length} different background colors: ${backgroundColors.join(', ')}`
      });
    }
    
    const borderRadii = [...new Set(cardStyles.map(s => s.borderRadius))];
    if (borderRadii.length > 2) {
      recommendations.push({
        category: 'Visual Consistency',
        issue: 'Inconsistent border radius',
        recommendation: 'Use consistent border-radius values from design system',
        priority: 'Low',
        details: `Found ${borderRadii.length} different border radius values: ${borderRadii.join(', ')}`
      });
    }
  }
  
  // Check button consistency
  if (buttonStyles.length > 1) {
    const buttonBgColors = [...new Set(buttonStyles.map(s => s.styles.backgroundColor))];
    if (buttonBgColors.length > 2) {
      recommendations.push({
        category: 'Button Styling',
        issue: 'Inconsistent button colors',
        recommendation: 'Standardize button colors using shadcn/ui Button component variants',
        priority: 'High',
        details: `Found ${buttonBgColors.length} different button background colors`
      });
    }
  }
  
  return recommendations;
}

// Run the analysis
analyzePlanCards().catch(console.error);