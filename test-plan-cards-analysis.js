const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function analyzePlanCards() {
  console.log('🚀 Starting plan cards analysis...');
  
  // Create artifact directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const artifactDir = path.join('./artifacts', `${timestamp}_dallas_plan_cards_analysis`);
  
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    viewport: { width: 1280, height: 800 }
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`📋 Console [${msg.type()}]:`, msg.text());
    });
    
    // Log page errors
    page.on('pageerror', (error) => {
      console.error('❌ Page Error:', error.message);
    });
    
    console.log('🔍 Navigating to Dallas page...');
    await page.goto('http://localhost:4324/texas/dallas-tx', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({ 
      path: path.join(artifactDir, 'full_page.png'),
      fullPage: true 
    });
    
    // Wait for plan cards to load
    console.log('⏳ Waiting for plan cards to load...');
    await page.waitForSelector('[data-testid="plan-card"], .plan-card, [class*="plan"], [class*="card"]', {
      timeout: 10000
    });
    
    // Take screenshot of viewport area
    await page.screenshot({ 
      path: path.join(artifactDir, 'viewport.png')
    });
    
    // Find and analyze plan cards
    console.log('🔍 Analyzing plan cards...');
    
    // Try multiple selectors to find plan cards
    const possibleSelectors = [
      '[data-testid="plan-card"]',
      '.plan-card',
      '[class*="plan-card"]',
      '[class*="card"]',
      'article',
      '[role="article"]'
    ];
    
    let planCards = [];
    for (const selector of possibleSelectors) {
      const cards = await page.$$(selector);
      if (cards.length > 0) {
        console.log(`✅ Found ${cards.length} elements with selector: ${selector}`);
        planCards = cards;
        break;
      }
    }
    
    if (planCards.length === 0) {
      console.log('🔍 No plan cards found with standard selectors, analyzing page structure...');
      
      // Get page structure
      const pageStructure = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const structure = {};
        
        for (let element of elements) {
          const classes = Array.from(element.classList);
          const tagName = element.tagName.toLowerCase();
          
          if (classes.some(cls => cls.includes('plan') || cls.includes('card'))) {
            if (!structure[tagName]) structure[tagName] = [];
            structure[tagName].push({
              classes: classes,
              id: element.id,
              textContent: element.textContent?.substring(0, 100)
            });
          }
        }
        
        return structure;
      });
      
      console.log('📋 Page structure with plan/card elements:', JSON.stringify(pageStructure, null, 2));
    }
    
    // Capture individual plan cards if found
    if (planCards.length > 0) {
      console.log(`📸 Capturing ${Math.min(planCards.length, 5)} individual plan cards...`);
      
      for (let i = 0; i < Math.min(planCards.length, 5); i++) {
        await planCards[i].screenshot({
          path: path.join(artifactDir, `plan_card_${i + 1}.png`)
        });
      }
    }
    
    // Analyze CSS styles and layout
    console.log('🎨 Analyzing CSS styles and design system compliance...');
    
    const designAnalysis = await page.evaluate(() => {
      const analysis = {
        typography: {},
        colors: {},
        spacing: {},
        shadows: {},
        borders: {},
        buttons: {},
        badges: {},
        layout: {}
      };
      
      // Find elements that might be plan cards or related components
      const cardElements = document.querySelectorAll('[class*="card"], [class*="plan"], article, [role="article"]');
      
      cardElements.forEach((element, index) => {
        if (index < 5) { // Analyze first 5 elements
          const computedStyle = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          analysis.layout[`element_${index}`] = {
            width: rect.width,
            height: rect.height,
            classes: Array.from(element.classList),
            position: computedStyle.position,
            display: computedStyle.display,
            flexDirection: computedStyle.flexDirection,
            gap: computedStyle.gap
          };
          
          analysis.shadows[`element_${index}`] = computedStyle.boxShadow;
          analysis.borders[`element_${index}`] = {
            border: computedStyle.border,
            borderRadius: computedStyle.borderRadius
          };
          
          // Check for buttons within the element
          const buttons = element.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
          if (buttons.length > 0) {
            analysis.buttons[`element_${index}`] = Array.from(buttons).map(btn => {
              const btnStyle = getComputedStyle(btn);
              return {
                classes: Array.from(btn.classList),
                backgroundColor: btnStyle.backgroundColor,
                color: btnStyle.color,
                padding: btnStyle.padding,
                borderRadius: btnStyle.borderRadius,
                fontSize: btnStyle.fontSize,
                fontWeight: btnStyle.fontWeight
              };
            });
          }
          
          // Check for badges
          const badges = element.querySelectorAll('.badge, [class*="badge"], .tag, [class*="tag"]');
          if (badges.length > 0) {
            analysis.badges[`element_${index}`] = Array.from(badges).map(badge => {
              const badgeStyle = getComputedStyle(badge);
              return {
                classes: Array.from(badge.classList),
                backgroundColor: badgeStyle.backgroundColor,
                color: badgeStyle.color,
                position: badgeStyle.position,
                fontSize: badgeStyle.fontSize
              };
            });
          }
        }
      });
      
      // Global typography analysis
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading, index) => {
        if (index < 10) {
          const style = getComputedStyle(heading);
          analysis.typography[`${heading.tagName.toLowerCase()}_${index}`] = {
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color: style.color,
            marginTop: style.marginTop,
            marginBottom: style.marginBottom
          };
        }
      });
      
      return analysis;
    });
    
    // Save analysis to file
    fs.writeFileSync(
      path.join(artifactDir, 'design_analysis.json'),
      JSON.stringify(designAnalysis, null, 2)
    );
    
    // Check for accessibility issues
    console.log('♿ Running accessibility checks...');
    
    const accessibilityResults = await page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt text on images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt || img.alt.trim() === '') {
          issues.push(`Image ${index + 1} missing alt text`);
        }
      });
      
      // Check for button accessibility
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach((btn, index) => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          issues.push(`Button ${index + 1} missing accessible text`);
        }
      });
      
      // Check color contrast (basic check)
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let lowContrastElements = 0;
      
      textElements.forEach((element) => {
        const style = getComputedStyle(element);
        const backgroundColor = style.backgroundColor;
        const color = style.color;
        
        // Simple heuristic - if both are very light or very dark, flag it
        if ((backgroundColor.includes('rgb(255') && color.includes('rgb(240')) ||
            (backgroundColor.includes('rgb(0') && color.includes('rgb(20'))) {
          lowContrastElements++;
        }
      });
      
      if (lowContrastElements > 0) {
        issues.push(`${lowContrastElements} elements may have low color contrast`);
      }
      
      return issues;
    });
    
    console.log('✅ Analysis complete!');
    console.log(`📁 Artifacts saved to: ${artifactDir}`);
    
    if (accessibilityResults.length > 0) {
      console.log('⚠️  Accessibility issues found:', accessibilityResults);
    }
    
    return {
      artifactDir,
      designAnalysis,
      accessibilityResults,
      planCardsFound: planCards.length
    };
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzePlanCards()
  .then((results) => {
    console.log('🎉 Analysis Results Summary:');
    console.log(`- Artifacts directory: ${results.artifactDir}`);
    console.log(`- Plan cards found: ${results.planCardsFound}`);
    console.log(`- Accessibility issues: ${results.accessibilityResults.length}`);
    
    if (results.accessibilityResults.length > 0) {
      console.log('Accessibility Issues:');
      results.accessibilityResults.forEach(issue => console.log(`  - ${issue}`));
    }
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });