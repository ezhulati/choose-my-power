import { chromium } from 'playwright';
import fs from 'fs';

async function testNavigationLinksSimple() {
  console.log('🚀 Starting simplified navigation links test...');
  
  // Create artifacts directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const artifactsDir = `./artifacts/navigation-simple-${timestamp}`;
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  const testResults = [];
  
  try {
    // Navigate to homepage first
    console.log('📍 Navigating to homepage: http://localhost:4324');
    await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: `${artifactsDir}/01-homepage.png`,
      fullPage: true 
    });
    console.log('✅ Homepage screenshot captured');

    // Test the three key navigation destinations
    const testUrls = [
      {
        name: 'Browse by Location',
        url: 'http://localhost:4324/texas',
        description: 'Texas cities and locations page'
      },
      {
        name: 'Compare Plans', 
        url: 'http://localhost:4324/compare',
        description: 'Electricity plans comparison page'
      },
      {
        name: 'Calculate Costs',
        url: 'http://localhost:4324/rates/calculator', 
        description: 'Rate calculator page'
      }
    ];

    for (let i = 0; i < testUrls.length; i++) {
      const test = testUrls[i];
      console.log(`\n🔗 Testing ${test.name} (${test.url})...`);
      
      try {
        await page.goto(test.url, { waitUntil: 'networkidle' });
        
        const currentUrl = page.url();
        const pageTitle = await page.title();
        
        // Check if page loaded successfully
        const pageContent = await page.textContent('body');
        const hasContent = pageContent && pageContent.length > 100;
        
        // Look for error indicators
        const hasError = pageContent.includes('404') || 
                       pageContent.includes('Not Found') || 
                       pageContent.includes('Error') ||
                       currentUrl.includes('404');
        
        await page.screenshot({ 
          path: `${artifactsDir}/${String(i + 2).padStart(2, '0')}-${test.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        const success = !hasError && hasContent;
        
        testResults.push({
          name: test.name,
          targetUrl: test.url,
          actualUrl: currentUrl,
          pageTitle: pageTitle,
          success: success,
          hasContent: hasContent,
          hasError: hasError,
          screenshot: `${String(i + 2).padStart(2, '0')}-${test.name.toLowerCase().replace(/\s+/g, '-')}.png`
        });
        
        console.log(`   Target: ${test.url}`);
        console.log(`   Actual: ${currentUrl}`);
        console.log(`   Title: ${pageTitle}`);
        console.log(`   Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
      } catch (error) {
        testResults.push({
          name: test.name,
          targetUrl: test.url,
          actualUrl: 'ERROR',
          success: false,
          error: error.message
        });
        console.log(`   Status: ❌ ERROR - ${error.message}`);
      }
    }

    // Now test the actual homepage links by examining their href attributes
    console.log('\n🔍 Examining homepage navigation links...');
    await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
    
    // Check the actual href values of the links
    const linkTests = [
      { text: 'Explore 881 Cities', expectedPath: '/texas' },
      { text: 'Compare All Plans', expectedPath: '/compare' },
      { text: 'Calculate Savings', expectedPath: '/rates/calculator' }
    ];

    const linkResults = [];
    for (const linkTest of linkTests) {
      try {
        const link = page.locator(`text="${linkTest.text}"`).first();
        const href = await link.getAttribute('href');
        const isCorrect = href === linkTest.expectedPath;
        
        linkResults.push({
          linkText: linkTest.text,
          expectedHref: linkTest.expectedPath,
          actualHref: href,
          correct: isCorrect
        });
        
        console.log(`   "${linkTest.text}": ${href} ${isCorrect ? '✅' : '❌'}`);
      } catch (error) {
        linkResults.push({
          linkText: linkTest.text,
          expectedHref: linkTest.expectedPath,
          actualHref: 'NOT_FOUND',
          correct: false,
          error: error.message
        });
        console.log(`   "${linkTest.text}": NOT FOUND ❌`);
      }
    }

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Navigation Links Verification',
      homepage: 'http://localhost:4324',
      pageTests: testResults,
      linkTests: linkResults,
      summary: {
        pagesTotal: testResults.length,
        pagesPassed: testResults.filter(r => r.success).length,
        pagesFailed: testResults.filter(r => !r.success).length,
        linksTotal: linkResults.length,
        linksCorrect: linkResults.filter(r => r.correct).length,
        linksIncorrect: linkResults.filter(r => !r.correct).length
      }
    };

    fs.writeFileSync(
      `${artifactsDir}/navigation-report.json`,
      JSON.stringify(report, null, 2)
    );

    // Create summary report
    const summaryMarkdown = `# Navigation Links Test Report

**Date**: ${new Date().toLocaleString()}
**Homepage**: http://localhost:4324

## Page Navigation Tests
${testResults.map((result, i) => `
### ${i + 1}. ${result.name}
- **Target URL**: ${result.targetUrl}
- **Actual URL**: ${result.actualUrl}  
- **Page Title**: ${result.pageTitle || 'N/A'}
- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **Screenshot**: ${result.screenshot || 'Not captured'}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Homepage Link Attributes
${linkResults.map((result, i) => `
### ${i + 1}. "${result.linkText}"
- **Expected href**: ${result.expectedPath}
- **Actual href**: ${result.actualHref}
- **Status**: ${result.correct ? '✅ CORRECT' : '❌ INCORRECT'}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Summary
- **Pages Working**: ${report.summary.pagesPassed}/${report.summary.pagesTotal}
- **Links Correct**: ${report.summary.linksCorrect}/${report.summary.linksTotal}
- **Overall Status**: ${(report.summary.pagesPassed === report.summary.pagesTotal && report.summary.linksCorrect === report.summary.linksTotal) ? '🎉 ALL TESTS PASSED' : '⚠️ ISSUES FOUND'}

## Key Findings
${report.summary.pagesPassed === report.summary.pagesTotal ? '✅ All destination pages load successfully' : `❌ ${report.summary.pagesFailed} pages failed to load`}
${report.summary.linksCorrect === report.summary.linksTotal ? '✅ All homepage links have correct href attributes' : `❌ ${report.summary.linksIncorrect} links have incorrect href attributes`}
`;

    fs.writeFileSync(`${artifactsDir}/summary.md`, summaryMarkdown);

    console.log('\n📊 FINAL RESULTS');
    console.log('==================');
    console.log(`✅ Pages working: ${report.summary.pagesPassed}/${report.summary.pagesTotal}`);
    console.log(`✅ Links correct: ${report.summary.linksCorrect}/${report.summary.linksTotal}`);
    console.log(`📁 Reports saved to: ${artifactsDir}`);
    
    const allGood = report.summary.pagesPassed === report.summary.pagesTotal && 
                   report.summary.linksCorrect === report.summary.linksTotal;
    
    if (allGood) {
      console.log('\n🎉 SUCCESS: All navigation links are working correctly!');
      console.log('Your fix for the "Compare Plans" link is verified and working.');
    } else {
      console.log('\n⚠️ Some issues found. Check the detailed report for more information.');
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
}

testNavigationLinksSimple().catch(console.error);