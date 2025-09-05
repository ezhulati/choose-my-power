const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://choose-my-power.netlify.app';
const ARTIFACTS_DIR = './artifacts/20250904_190225_site_investigation';

// Test pages to investigate
const TEST_PAGES = [
  { name: 'homepage', url: '/' },
  { name: 'texas', url: '/texas/' },
  { name: 'electricity-plans', url: '/electricity-plans/' },
  { name: 'houston', url: '/texas/houston/' },
  { name: 'dallas-plans', url: '/electricity-plans/dallas-tx/' }
];

class SiteInvestigator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      site: SITE_URL,
      browsers: [],
      summary: {
        totalErrors: 0,
        failedRequests: 0,
        pagesWithIssues: 0,
        commonIssues: []
      }
    };
  }

  async investigate() {
    console.log(`🔍 Starting site investigation for ${SITE_URL}`);
    console.log(`📁 Artifacts will be saved to: ${ARTIFACTS_DIR}`);
    
    // Test with Chromium (most similar to production)
    await this.testBrowser('chromium');
    
    // Save comprehensive report
    await this.generateReport();
    
    console.log('✅ Investigation complete! Check artifacts directory for results.');
  }

  async testBrowser(browserName) {
    console.log(`\n🌐 Testing with ${browserName}...`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const browserResults = {
      name: browserName,
      pages: [],
      totalConsoleErrors: 0,
      totalNetworkErrors: 0
    };

    for (const testPage of TEST_PAGES) {
      console.log(`  📄 Testing page: ${testPage.name} (${testPage.url})`);
      
      const pageResult = await this.testPage(context, testPage, browserName);
      browserResults.pages.push(pageResult);
      browserResults.totalConsoleErrors += pageResult.consoleErrors.length;
      browserResults.totalNetworkErrors += pageResult.failedRequests.length;
    }

    this.results.browsers.push(browserResults);
    await browser.close();
  }

  async testPage(context, testPage, browserName) {
    const page = await context.newPage();
    const pageResult = {
      name: testPage.name,
      url: testPage.url,
      fullUrl: `${SITE_URL}${testPage.url}`,
      loadTime: 0,
      finalUrl: '',
      status: '',
      consoleErrors: [],
      consoleWarnings: [],
      failedRequests: [],
      screenshots: [],
      loadingStates: [],
      responseTime: 0
    };

    // Collect console messages
    page.on('console', (msg) => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      
      if (msg.type() === 'error') {
        pageResult.consoleErrors.push(message);
        console.log(`    ❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        pageResult.consoleWarnings.push(message);
        console.log(`    ⚠️  Console Warning: ${msg.text()}`);
      }
    });

    // Collect failed network requests
    page.on('response', (response) => {
      if (!response.ok()) {
        const failedRequest = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers()
        };
        pageResult.failedRequests.push(failedRequest);
        console.log(`    🚫 Failed Request: ${response.status()} ${response.url()}`);
      }
    });

    try {
      // Record loading states
      const startTime = Date.now();
      
      console.log(`    🚀 Navigating to ${pageResult.fullUrl}...`);
      pageResult.loadingStates.push({ timestamp: Date.now(), state: 'navigation-start' });
      
      // Navigate with extended timeout
      const response = await page.goto(pageResult.fullUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      pageResult.status = response?.status() || 'unknown';
      pageResult.finalUrl = page.url();
      pageResult.loadingStates.push({ timestamp: Date.now(), state: 'domcontentloaded' });
      
      console.log(`    📊 Response Status: ${pageResult.status}`);
      console.log(`    🔗 Final URL: ${pageResult.finalUrl}`);

      // Take initial screenshot
      const screenshotPath = `${ARTIFACTS_DIR}/${testPage.name}_${browserName}_initial.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      pageResult.screenshots.push({
        name: 'initial',
        path: screenshotPath,
        timestamp: Date.now()
      });
      console.log(`    📸 Initial screenshot saved`);

      // Wait a bit to see if content loads
      console.log(`    ⏳ Waiting 3 seconds for dynamic content...`);
      await page.waitForTimeout(3000);
      pageResult.loadingStates.push({ timestamp: Date.now(), state: 'after-3s-wait' });

      // Take screenshot after waiting
      const afterWaitPath = `${ARTIFACTS_DIR}/${testPage.name}_${browserName}_after_wait.png`;
      await page.screenshot({ 
        path: afterWaitPath, 
        fullPage: true 
      });
      pageResult.screenshots.push({
        name: 'after-wait',
        path: afterWaitPath,
        timestamp: Date.now()
      });

      // Check for specific content indicators
      const pageContent = await page.content();
      const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
      
      console.log(`    📝 Page Content Length: ${pageContent.length} characters`);
      console.log(`    📝 Visible Text Length: ${bodyText.length} characters`);
      
      // Check for common loading indicators
      const hasSpinner = await page.$('.spinner, .loading, [data-loading]').then(el => !!el);
      const hasChooseMyPowerContent = bodyText.toLowerCase().includes('choose my power') || 
                                     bodyText.toLowerCase().includes('electricity') ||
                                     pageContent.includes('choose-my-power');
      
      console.log(`    🔄 Has Loading Spinner: ${hasSpinner}`);
      console.log(`    📄 Has ChooseMyPower Content: ${hasChooseMyPowerContent}`);
      
      pageResult.analysis = {
        contentLength: pageContent.length,
        visibleTextLength: bodyText.length,
        hasSpinner,
        hasChooseMyPowerContent,
        isBlankPage: bodyText.trim().length < 100 && !hasChooseMyPowerContent
      };

      // Test refresh behavior
      console.log(`    🔄 Testing page refresh...`);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      pageResult.loadingStates.push({ timestamp: Date.now(), state: 'after-refresh' });
      
      const refreshScreenshotPath = `${ARTIFACTS_DIR}/${testPage.name}_${browserName}_after_refresh.png`;
      await page.screenshot({ 
        path: refreshScreenshotPath, 
        fullPage: true 
      });
      pageResult.screenshots.push({
        name: 'after-refresh',
        path: refreshScreenshotPath,
        timestamp: Date.now()
      });

      pageResult.loadTime = Date.now() - startTime;
      console.log(`    ⏱️  Total Load Time: ${pageResult.loadTime}ms`);

    } catch (error) {
      console.log(`    💥 Error testing page: ${error.message}`);
      pageResult.error = error.message;
      
      // Take error screenshot
      try {
        const errorScreenshotPath = `${ARTIFACTS_DIR}/${testPage.name}_${browserName}_error.png`;
        await page.screenshot({ 
          path: errorScreenshotPath, 
          fullPage: true 
        });
        pageResult.screenshots.push({
          name: 'error',
          path: errorScreenshotPath,
          timestamp: Date.now()
        });
      } catch (screenshotError) {
        console.log(`    📸 Could not take error screenshot: ${screenshotError.message}`);
      }
    }

    await page.close();
    return pageResult;
  }

  async generateReport() {
    // Calculate summary statistics
    this.results.summary.totalErrors = this.results.browsers.reduce((sum, browser) => 
      sum + browser.totalConsoleErrors, 0);
    this.results.summary.failedRequests = this.results.browsers.reduce((sum, browser) => 
      sum + browser.totalNetworkErrors, 0);
    
    // Generate detailed analysis
    const analysis = this.analyzeResults();
    
    const reportPath = `${ARTIFACTS_DIR}/investigation-report.json`;
    const readableReportPath = `${ARTIFACTS_DIR}/investigation-report.md`;
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate readable markdown report
    const markdownReport = this.generateMarkdownReport(analysis);
    fs.writeFileSync(readableReportPath, markdownReport);
    
    console.log(`\n📊 Reports saved:`);
    console.log(`   - JSON: ${reportPath}`);
    console.log(`   - Markdown: ${readableReportPath}`);
  }

  analyzeResults() {
    const analysis = {
      criticalIssues: [],
      commonPatterns: [],
      recommendations: [],
      pageStatus: []
    };

    for (const browser of this.results.browsers) {
      for (const page of browser.pages) {
        const pageAnalysis = {
          name: page.name,
          url: page.url,
          issues: []
        };

        // Analyze for blank page
        if (page.analysis?.isBlankPage) {
          pageAnalysis.issues.push('BLANK_PAGE');
          analysis.criticalIssues.push(`${page.name}: Page appears blank or has minimal content`);
        }

        // Analyze for loading issues
        if (page.consoleErrors.length > 0) {
          pageAnalysis.issues.push('CONSOLE_ERRORS');
          analysis.criticalIssues.push(`${page.name}: ${page.consoleErrors.length} console errors`);
        }

        // Analyze for network failures
        if (page.failedRequests.length > 0) {
          pageAnalysis.issues.push('NETWORK_FAILURES');
          analysis.criticalIssues.push(`${page.name}: ${page.failedRequests.length} failed requests`);
        }

        // Check for timeout/loading issues
        if (page.error) {
          pageAnalysis.issues.push('LOADING_ERROR');
          analysis.criticalIssues.push(`${page.name}: ${page.error}`);
        }

        analysis.pageStatus.push(pageAnalysis);
      }
    }

    // Generate recommendations
    if (analysis.criticalIssues.length > 0) {
      analysis.recommendations.push('🔥 URGENT: Multiple critical issues found requiring immediate attention');
    }
    
    if (analysis.criticalIssues.some(issue => issue.includes('BLANK_PAGE'))) {
      analysis.recommendations.push('📄 Blank page issues suggest JavaScript bundle problems or API failures');
    }
    
    if (analysis.criticalIssues.some(issue => issue.includes('CONSOLE_ERRORS'))) {
      analysis.recommendations.push('🐛 Console errors need investigation - check browser dev tools');
    }
    
    if (analysis.criticalIssues.some(issue => issue.includes('NETWORK_FAILURES'))) {
      analysis.recommendations.push('🌐 Network failures suggest CDN, API, or asset loading issues');
    }

    return analysis;
  }

  generateMarkdownReport(analysis) {
    const timestamp = new Date().toISOString();
    
    return `# ChooseMyPower Site Investigation Report

**Generated:** ${timestamp}  
**Site:** ${SITE_URL}  
**Investigation ID:** 20250904_190225

## 🚨 Executive Summary

${analysis.criticalIssues.length > 0 ? 
  `**CRITICAL ISSUES FOUND:** ${analysis.criticalIssues.length} critical issues require immediate attention.` :
  `**STATUS:** No critical issues detected.`}

### Key Findings
- **Total Console Errors:** ${this.results.summary.totalErrors}
- **Failed Network Requests:** ${this.results.summary.failedRequests}
- **Pages Tested:** ${TEST_PAGES.length}
- **Browsers Tested:** ${this.results.browsers.length}

## 🔍 Detailed Findings

### Critical Issues
${analysis.criticalIssues.length > 0 ? 
  analysis.criticalIssues.map(issue => `- ❌ ${issue}`).join('\n') :
  '✅ No critical issues found'}

### Page-by-Page Analysis

${this.results.browsers[0]?.pages.map(page => `
#### ${page.name.toUpperCase()} (${page.url})
- **Status:** ${page.status}
- **Load Time:** ${page.loadTime}ms
- **Console Errors:** ${page.consoleErrors.length}
- **Failed Requests:** ${page.failedRequests.length}
- **Content Analysis:**
  - Page Length: ${page.analysis?.contentLength || 0} characters
  - Visible Text: ${page.analysis?.visibleTextLength || 0} characters
  - Has Content: ${page.analysis?.hasChooseMyPowerContent ? '✅' : '❌'}
  - Blank Page: ${page.analysis?.isBlankPage ? '🚨 YES' : '✅ No'}

${page.consoleErrors.length > 0 ? `
**Console Errors:**
${page.consoleErrors.map(err => `- \`${err.text}\` (${err.location?.url}:${err.location?.lineNumber})`).join('\n')}
` : ''}

${page.failedRequests.length > 0 ? `
**Failed Requests:**
${page.failedRequests.map(req => `- ${req.status} ${req.url}`).join('\n')}
` : ''}

**Screenshots:**
${page.screenshots.map(screenshot => `- ${screenshot.name}: \`${screenshot.path}\``).join('\n')}
`).join('\n')}

## 🎯 Recommendations

${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

### Immediate Actions Needed

1. **Check Build Process:** Verify that the latest build deployed correctly
2. **Review Console Errors:** Open browser dev tools and check for JavaScript errors
3. **Validate Assets:** Ensure all CSS, JS, and asset files are loading properly
4. **Test Locally:** Compare local development server with deployed version
5. **Check Netlify Logs:** Review deployment logs for build errors or warnings

### Technical Investigation Steps

1. **Browser Dev Tools:**
   \`\`\`bash
   # Open site in Chrome/Firefox with dev tools
   # Check Console tab for errors
   # Check Network tab for failed requests
   # Check Sources tab to verify files loaded
   \`\`\`

2. **Netlify Deployment Check:**
   \`\`\`bash
   npm run build
   # Check if build completes without errors
   # Compare build output with deployed version
   \`\`\`

3. **Local vs Production Comparison:**
   \`\`\`bash
   npm run dev
   # Test same pages locally
   # Compare behavior and console output
   \`\`\`

## 📊 Raw Data

Full investigation results are available in \`investigation-report.json\` for detailed analysis.

---
*Investigation completed using Playwright automation*
`;
  }
}

// Run the investigation
async function main() {
  const investigator = new SiteInvestigator();
  await investigator.investigate();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SiteInvestigator };