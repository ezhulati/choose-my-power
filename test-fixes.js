import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Create timestamped artifact directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const artifactDir = `./artifacts/${timestamp}`;
fs.mkdirSync(artifactDir, { recursive: true });

console.log(`🔍 Testing fixes with artifacts saved to: ${artifactDir}`);

async function testPlanCardsWidthFix(page) {
  console.log('\n📊 TEST 1: Plan Cards Width Fix');
  console.log('=================================');
  
  try {
    // Navigate to Dallas plans page
    console.log('📍 Navigating to Dallas plans page...');
    await page.goto('http://localhost:4324/electricity-plans/dallas', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for plan cards to load
    console.log('⏳ Waiting for plan cards to load...');
    await page.waitForSelector('[data-testid="plan-card"], .plan-card, .bg-white', { 
      timeout: 15000 
    });
    
    // Take baseline screenshot
    await page.screenshot({ 
      path: `${artifactDir}/test1-plan-cards-desktop.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test1-plan-cards-desktop.png');
    
    // Count plan cards in viewport and check layout
    const planCardsInfo = await page.evaluate(() => {
      // Look for plan cards with various selectors
      const cardSelectors = [
        '[data-testid="plan-card"]',
        '.plan-card',
        '.bg-white.rounded',
        '.border.bg-white',
        'article',
        '.grid > div:has(.text-center, .border)'
      ];
      
      let cards = [];
      for (const selector of cardSelectors) {
        cards = Array.from(document.querySelectorAll(selector));
        if (cards.length > 0) break;
      }
      
      if (cards.length === 0) {
        // Fallback: look for any grid children that look like plan cards
        const gridContainers = document.querySelectorAll('.grid, [class*="grid-cols"]');
        for (const grid of gridContainers) {
          const children = Array.from(grid.children);
          if (children.length >= 3) {
            cards = children;
            break;
          }
        }
      }
      
      console.log(`Found ${cards.length} potential plan cards`);
      
      if (cards.length === 0) return { count: 0, error: 'No plan cards found' };
      
      // Get the parent grid container
      const firstCard = cards[0];
      const gridContainer = firstCard.closest('.grid, [class*="grid-cols"]') || firstCard.parentElement;
      
      // Check grid columns class
      const gridClasses = gridContainer ? gridContainer.className : '';
      const hasThreeColumns = gridClasses.includes('grid-cols-3') || 
                             gridClasses.includes('lg:grid-cols-3') ||
                             gridClasses.includes('md:grid-cols-3');
      const hasFourColumns = gridClasses.includes('grid-cols-4') || 
                            gridClasses.includes('lg:grid-cols-4');
      
      // Get actual computed columns count
      const gridStyle = gridContainer ? getComputedStyle(gridContainer) : null;
      const computedColumns = gridStyle ? gridStyle.gridTemplateColumns : 'none';
      const actualColumnCount = computedColumns !== 'none' ? 
        computedColumns.split(' ').length : 0;
      
      // Check if cards are wider (indicating 3 columns vs 4)
      const firstCardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
      const containerWidth = gridContainer ? gridContainer.getBoundingClientRect().width : window.innerWidth;
      const expectedWidth3Col = containerWidth / 3;
      const expectedWidth4Col = containerWidth / 4;
      const isCloserTo3Col = Math.abs(firstCardWidth - expectedWidth3Col) < Math.abs(firstCardWidth - expectedWidth4Col);
      
      return {
        count: cards.length,
        gridClasses,
        hasThreeColumns,
        hasFourColumns,
        computedColumns,
        actualColumnCount,
        firstCardWidth: Math.round(firstCardWidth),
        containerWidth: Math.round(containerWidth),
        expectedWidth3Col: Math.round(expectedWidth3Col),
        expectedWidth4Col: Math.round(expectedWidth4Col),
        isCloserTo3Col,
        cardsSample: cards.slice(0, 3).map(card => ({
          width: Math.round(card.getBoundingClientRect().width),
          height: Math.round(card.getBoundingClientRect().height),
          className: card.className
        }))
      };
    });
    
    console.log('📊 Plan Cards Analysis:');
    console.log(`   • Found ${planCardsInfo.count} plan cards`);
    console.log(`   • Grid classes: ${planCardsInfo.gridClasses || 'None found'}`);
    console.log(`   • Has 3 columns class: ${planCardsInfo.hasThreeColumns}`);
    console.log(`   • Has 4 columns class: ${planCardsInfo.hasFourColumns}`);
    console.log(`   • Computed columns: ${planCardsInfo.computedColumns}`);
    console.log(`   • Actual column count: ${planCardsInfo.actualColumnCount}`);
    console.log(`   • First card width: ${planCardsInfo.firstCardWidth}px`);
    console.log(`   • Container width: ${planCardsInfo.containerWidth}px`);
    console.log(`   • Expected 3-col width: ${planCardsInfo.expectedWidth3Col}px`);
    console.log(`   • Expected 4-col width: ${planCardsInfo.expectedWidth4Col}px`);
    console.log(`   • Closer to 3-column layout: ${planCardsInfo.isCloserTo3Col}`);
    
    if (planCardsInfo.cardsSample) {
      console.log('   • Sample cards:');
      planCardsInfo.cardsSample.forEach((card, i) => {
        console.log(`     ${i + 1}. ${card.width}x${card.height}px`);
      });
    }
    
    // Save analysis to file
    fs.writeFileSync(
      `${artifactDir}/test1-plan-cards-analysis.json`,
      JSON.stringify(planCardsInfo, null, 2)
    );
    
    const success = planCardsInfo.count > 0 && 
                   (planCardsInfo.hasThreeColumns || planCardsInfo.isCloserTo3Col) && 
                   !planCardsInfo.hasFourColumns;
    
    console.log(`\n✅ Test 1 Result: ${success ? 'PASSED' : 'FAILED'}`);
    if (success) {
      console.log('   • Plan cards are displaying 3 per row ✓');
      console.log('   • Cards appear wider and more readable ✓');
    } else {
      console.log('   • Plan cards may still be 4 per row ✗');
      console.log('   • Check grid-cols-3 implementation');
    }
    
    return { success, details: planCardsInfo };
    
  } catch (error) {
    console.error('❌ Test 1 Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testESIIDLookupFix(page) {
  console.log('\n🏠 TEST 2: ESIID Lookup Fix');
  console.log('===========================');
  
  try {
    // Navigate to plan detail page
    console.log('📍 Navigating to plan detail page...');
    await page.goto('http://localhost:4324/electricity-plans/plans/frontier-utilities/frontier-saver-plus-12', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take baseline screenshot
    await page.screenshot({ 
      path: `${artifactDir}/test2-plan-detail-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test2-plan-detail-page.png');
    
    // Find and click "Select This Plan" button
    console.log('🔍 Looking for "Select This Plan" button...');
    const selectButton = await page.locator('button, a').filter({ 
      hasText: /select this plan/i 
    }).first();
    
    if (await selectButton.count() === 0) {
      // Try alternative button texts
      const altButtons = [
        'Get This Plan',
        'Choose Plan', 
        'Sign Up',
        'Order Now',
        'Select Plan'
      ];
      
      for (const buttonText of altButtons) {
        const altButton = page.locator('button, a').filter({ hasText: new RegExp(buttonText, 'i') });
        if (await altButton.count() > 0) {
          console.log(`✅ Found button with text: "${buttonText}"`);
          await altButton.first().click();
          break;
        }
      }
    } else {
      console.log('✅ Found "Select This Plan" button, clicking...');
      await selectButton.click();
    }
    
    // Wait for address modal to open
    console.log('⏳ Waiting for address modal to open...');
    await page.waitForSelector('dialog, .modal, [role="dialog"]', { 
      timeout: 10000 
    });
    
    // Take screenshot of modal
    await page.screenshot({ 
      path: `${artifactDir}/test2-address-modal.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test2-address-modal.png');
    
    // Fill in address form
    console.log('📝 Filling in address form...');
    
    // Find address input field
    const addressInput = page.locator('input[placeholder*="address" i], input[name*="address" i], input[id*="address" i]').first();
    if (await addressInput.count() === 0) {
      console.log('⚠️  Address input not found by placeholder, trying alternative selectors...');
    }
    
    // Fill address
    await addressInput.fill('123 Main St');
    console.log('✅ Entered address: "123 Main St"');
    
    // Find ZIP input field  
    const zipInput = page.locator('input[placeholder*="zip" i], input[name*="zip" i], input[id*="zip" i]').first();
    await zipInput.fill('75001');
    console.log('✅ Entered ZIP: "75001"');
    
    // Click search button
    console.log('🔍 Clicking search button...');
    const searchButton = page.locator('button').filter({ hasText: /search|find|lookup/i }).first();
    await searchButton.click();
    
    // Wait for address results
    console.log('⏳ Waiting for address search results...');
    await page.waitForTimeout(3000); // Wait for API response
    
    // Check for search results
    const searchResults = await page.evaluate(() => {
      // Look for address result elements
      const resultElements = document.querySelectorAll(
        '.address-result, .search-result, [data-testid*="address"], .cursor-pointer:has(.address)'
      );
      
      // Also check for text content containing the address
      const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('123 Main St') || text.includes('75001');
      });
      
      return {
        resultElements: resultElements.length,
        textMatches: textElements.length,
        foundAddress: textElements.some(el => el.textContent.includes('123 Main St')),
        foundZip: textElements.some(el => el.textContent.includes('75001'))
      };
    });
    
    console.log('📊 Address Search Results:');
    console.log(`   • Result elements found: ${searchResults.resultElements}`);
    console.log(`   • Text matches: ${searchResults.textMatches}`);
    console.log(`   • Found address: ${searchResults.foundAddress}`);
    console.log(`   • Found ZIP: ${searchResults.foundZip}`);
    
    // Take screenshot of results
    await page.screenshot({ 
      path: `${artifactDir}/test2-search-results.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test2-search-results.png');
    
    // Select the first address result
    console.log('📌 Selecting address result...');
    const addressResult = page.locator('.address-result, .search-result, [data-testid*="address"], .cursor-pointer').first();
    if (await addressResult.count() > 0) {
      await addressResult.click();
      console.log('✅ Selected address result');
    } else {
      console.log('⚠️  No clickable address result found, proceeding anyway...');
    }
    
    // Click "Proceed to Order" button
    console.log('🛒 Looking for "Proceed to Order" button...');
    const proceedButton = page.locator('button, a').filter({ 
      hasText: /proceed|continue|order|next/i 
    }).first();
    
    // Set up navigation tracking
    let targetUrl = '';
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        targetUrl = frame.url();
        console.log(`🌐 Navigation detected: ${targetUrl}`);
      }
    });
    
    // Click proceed button
    if (await proceedButton.count() > 0) {
      console.log('✅ Found proceed button, clicking...');
      await proceedButton.click();
      
      // Wait for navigation or new tab
      await page.waitForTimeout(5000);
      
      // Check if we navigated to ComparePower
      if (targetUrl.includes('comparepower.com')) {
        console.log('✅ Redirected to ComparePower URL');
        console.log(`   URL: ${targetUrl}`);
        
        // Check if URL contains expected parameters
        const urlAnalysis = {
          url: targetUrl,
          hasESIID: targetUrl.includes('esiid='),
          hasPlanID: targetUrl.includes('plan_id='),
          hasUsage: targetUrl.includes('usage='),
          hasZip: targetUrl.includes('zip_code='),
          esiidValue: (targetUrl.match(/esiid=([^&]+)/) || [])[1],
          isExpectedESIID: targetUrl.includes('esiid=10443720007962125')
        };
        
        console.log('🔍 URL Analysis:');
        console.log(`   • Has ESIID: ${urlAnalysis.hasESIID}`);
        console.log(`   • Has Plan ID: ${urlAnalysis.hasPlanID}`);
        console.log(`   • Has Usage: ${urlAnalysis.hasUsage}`);
        console.log(`   • Has ZIP: ${urlAnalysis.hasZip}`);
        console.log(`   • ESIID Value: ${urlAnalysis.esiidValue || 'Not found'}`);
        console.log(`   • Expected ESIID: ${urlAnalysis.isExpectedESIID}`);
        
        // Navigate to the URL to check if it's blank
        try {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(3000);
          
          const pageContent = await page.evaluate(() => {
            return {
              title: document.title,
              bodyText: document.body?.textContent?.trim() || '',
              hasContent: document.body?.textContent?.trim().length > 100,
              isBlank: document.body?.textContent?.trim().length < 50
            };
          });
          
          console.log('📄 ComparePower Page Analysis:');
          console.log(`   • Title: ${pageContent.title}`);
          console.log(`   • Has content: ${pageContent.hasContent}`);
          console.log(`   • Is blank: ${pageContent.isBlank}`);
          console.log(`   • Body text length: ${pageContent.bodyText.length} chars`);
          
          // Take final screenshot
          await page.screenshot({ 
            path: `${artifactDir}/test2-comparepower-page.png`,
            fullPage: true 
          });
          console.log('📸 Screenshot saved: test2-comparepower-page.png');
          
          // Save URL analysis
          fs.writeFileSync(
            `${artifactDir}/test2-url-analysis.json`,
            JSON.stringify({ ...urlAnalysis, pageContent }, null, 2)
          );
          
          const success = urlAnalysis.hasESIID && 
                         urlAnalysis.isExpectedESIID && 
                         !pageContent.isBlank;
          
          console.log(`\n✅ Test 2 Result: ${success ? 'PASSED' : 'FAILED'}`);
          if (success) {
            console.log('   • Address search found "123 Main St, 75001" ✓');
            console.log('   • ComparePower URL contains expected ESIID ✓');
            console.log('   • ComparePower page is NOT blank ✓');
          } else {
            console.log('   • Issues detected:');
            if (!urlAnalysis.hasESIID) console.log('     - No ESIID in URL ✗');
            if (!urlAnalysis.isExpectedESIID) console.log('     - Wrong ESIID value ✗');
            if (pageContent.isBlank) console.log('     - ComparePower page is blank ✗');
          }
          
          return { success, details: { ...urlAnalysis, pageContent } };
          
        } catch (error) {
          console.error('❌ Error loading ComparePower page:', error.message);
          return { success: false, error: `ComparePower page error: ${error.message}` };
        }
        
      } else {
        console.error('❌ Did not redirect to ComparePower');
        console.log(`   Current URL: ${targetUrl || page.url()}`);
        return { success: false, error: 'No redirect to ComparePower' };
      }
    } else {
      console.error('❌ Proceed button not found');
      return { success: false, error: 'Proceed button not found' };
    }
    
  } catch (error) {
    console.error('❌ Test 2 Error:', error.message);
    await page.screenshot({ 
      path: `${artifactDir}/test2-error.png`,
      fullPage: true 
    });
    return { success: false, error: error.message };
  }
}

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Playwright Test) Chrome/120.0.0.0'
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });
  
  console.log('🚀 Starting ChooseMyPower Fix Verification Tests');
  console.log('================================================');
  
  try {
    // Test 1: Plan Cards Width Fix
    const test1Result = await testPlanCardsWidthFix(page);
    
    // Test 2: ESIID Lookup Fix  
    const test2Result = await testESIIDLookupFix(page);
    
    // Generate summary report
    const report = {
      timestamp: new Date().toISOString(),
      artifactDirectory: artifactDir,
      tests: {
        planCardsWidthFix: test1Result,
        esiidLookupFix: test2Result
      },
      overallSuccess: test1Result.success && test2Result.success
    };
    
    fs.writeFileSync(
      `${artifactDir}/test-summary-report.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📋 FINAL TEST SUMMARY');
    console.log('=====================');
    console.log(`✅ Test 1 (Plan Cards): ${test1Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Test 2 (ESIID Lookup): ${test2Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`📁 Artifacts saved to: ${artifactDir}`);
    console.log(`🎯 Overall Result: ${report.overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    if (!report.overallSuccess) {
      console.log('\n🔧 Issues Found:');
      if (!test1Result.success) {
        console.log(`   • Plan Cards: ${test1Result.error || 'Layout not showing 3 columns'}`);
      }
      if (!test2Result.success) {
        console.log(`   • ESIID Lookup: ${test2Result.error || 'Address lookup or URL generation failed'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run tests
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});