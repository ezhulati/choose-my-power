import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testNavigationLinks() {
  console.log('🚀 Starting navigation links test...');
  
  // Create artifacts directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const artifactsDir = `./artifacts/navigation-test-${timestamp}`;
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  const results = [];
  
  try {
    console.log('📍 Navigating to homepage: http://localhost:4324');
    await page.goto('http://localhost:4324');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: `${artifactsDir}/01-homepage.png`,
      fullPage: true 
    });
    console.log('✅ Homepage screenshot captured');

    // Test 1: Browse by Location link
    console.log('\n🔗 Testing "Browse by Location" link...');
    try {
      // Look for the "Explore 881 Cities" link in the Browse by Location section
      const browseLink = page.locator('text="Explore 881 Cities"').first();
      await browseLink.click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      const expectedUrl = 'http://localhost:4324/texas';
      const urlMatch = currentUrl === expectedUrl || currentUrl === expectedUrl + '/';
      
      await page.screenshot({ 
        path: `${artifactsDir}/02-browse-by-location.png`,
        fullPage: true 
      });
      
      results.push({
        link: 'Browse by Location',
        expected: '/texas',
        actual: currentUrl,
        success: urlMatch,
        pageLoaded: true,
        screenshot: '02-browse-by-location.png'
      });
      
      console.log(`   Expected: ${expectedUrl}`);
      console.log(`   Actual: ${currentUrl}`);
      console.log(`   Status: ${urlMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      results.push({
        link: 'Browse by Location',
        expected: '/texas',
        actual: 'ERROR',
        success: false,
        error: error.message,
        pageLoaded: false
      });
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }

    // Return to homepage
    await page.goto('http://localhost:4324');
    await page.waitForLoadState('networkidle');

    // Test 2: Compare Plans link
    console.log('\n🔗 Testing "Compare Plans" link...');
    try {
      // Look for the "Compare All Plans" link in the Compare Plans section
      const compareLink = page.locator('text="Compare All Plans"').first();
      await compareLink.click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      const expectedUrl = 'http://localhost:4324/electricity-plans';
      const urlMatch = currentUrl === expectedUrl || currentUrl === expectedUrl + '/';
      
      await page.screenshot({ 
        path: `${artifactsDir}/03-compare-plans.png`,
        fullPage: true 
      });
      
      results.push({
        link: 'Compare Plans',
        expected: '/electricity-plans',
        actual: currentUrl,
        success: urlMatch,
        pageLoaded: true,
        screenshot: '03-compare-plans.png'
      });
      
      console.log(`   Expected: ${expectedUrl}`);
      console.log(`   Actual: ${currentUrl}`);
      console.log(`   Status: ${urlMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      results.push({
        link: 'Compare Plans',
        expected: '/electricity-plans',
        actual: 'ERROR',
        success: false,
        error: error.message,
        pageLoaded: false
      });
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }

    // Return to homepage
    await page.goto('http://localhost:4324');
    await page.waitForLoadState('networkidle');

    // Test 3: Calculate Costs link
    console.log('\n🔗 Testing "Calculate Costs" link...');
    try {
      // Look for the "Calculate Savings" link in the Calculate Costs section
      const calculateLink = page.locator('text="Calculate Savings"').first();
      await calculateLink.click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      const expectedUrl = 'http://localhost:4324/rates/calculator';
      const urlMatch = currentUrl === expectedUrl || currentUrl === expectedUrl + '/';
      
      await page.screenshot({ 
        path: `${artifactsDir}/04-calculate-costs.png`,
        fullPage: true 
      });
      
      results.push({
        link: 'Calculate Costs',
        expected: '/rates/calculator',
        actual: currentUrl,
        success: urlMatch,
        pageLoaded: true,
        screenshot: '04-calculate-costs.png'
      });
      
      console.log(`   Expected: ${expectedUrl}`);
      console.log(`   Actual: ${currentUrl}`);
      console.log(`   Status: ${urlMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      results.push({
        link: 'Calculate Costs',
        expected: '/rates/calculator',
        actual: 'ERROR',
        success: false,
        error: error.message,
        pageLoaded: false
      });
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }

    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      testUrl: 'http://localhost:4324',
      results: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };

    // Save detailed report
    fs.writeFileSync(
      `${artifactsDir}/navigation-test-report.json`,
      JSON.stringify(report, null, 2)
    );

    // Create summary markdown
    const markdown = `# Navigation Links Test Report

**Test Date**: ${new Date().toISOString()}
**Homepage URL**: http://localhost:4324
**Results**: ${report.summary.passed}/${report.summary.total} links working correctly

## Test Results

${results.map((result, index) => `
### ${index + 1}. ${result.link}
- **Expected**: ${result.expected}
- **Actual**: ${result.actual}
- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **Page Loaded**: ${result.pageLoaded ? 'Yes' : 'No'}
- **Screenshot**: ${result.screenshot || 'Not captured'}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Screenshots Captured
1. Homepage: 01-homepage.png
2. Browse by Location: 02-browse-by-location.png
3. Compare Plans: 03-compare-plans.png
4. Calculate Costs: 04-calculate-costs.png

## Summary
${report.summary.passed === report.summary.total ? '🎉 All navigation links are working correctly!' : '⚠️ Some navigation links need attention.'}
`;

    fs.writeFileSync(`${artifactsDir}/README.md`, markdown);

    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📁 Artifacts saved to: ${artifactsDir}`);
    
    if (report.summary.passed === report.summary.total) {
      console.log('\n🎉 All navigation links are working correctly!');
    } else {
      console.log('\n⚠️ Some navigation links need attention. Check the report for details.');
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testNavigationLinks().catch(console.error);