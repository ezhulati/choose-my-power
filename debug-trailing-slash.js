import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugTrailingSlash() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const artifactsDir = path.join(__dirname, 'artifacts', timestamp);
  
  // Create artifacts directory
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordHar: {
      path: path.join(artifactsDir, 'network.har')
    }
  });
  
  const page = await context.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${new Date().toISOString()}] ${msg.type()}: ${msg.text()}`);
  });
  
  // Collect network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType()
    });
  });
  
  // Collect network responses
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      timestamp: new Date().toISOString(),
      status: response.status(),
      url: response.url(),
      headers: response.headers()
    });
  });
  
  try {
    console.log('🔍 Starting trailing slash debug investigation...');
    
    // Step 1: Navigate to the Houston electricity plans page
    console.log('📍 Step 1: Navigating to Houston electricity plans page...');
    await page.goto('http://localhost:4324/electricity-plans/houston');
    await page.waitForLoadState('networkidle');
    
    // Capture initial page state
    await page.screenshot({ 
      path: path.join(artifactsDir, '01-initial-page.png'),
      fullPage: true
    });
    
    console.log(`Current URL: ${page.url()}`);
    
    // Step 2: Wait for page to fully load and inspect sidebar filter links
    console.log('🔍 Step 2: Inspecting sidebar filter links...');
    
    // Wait for sidebar to be visible
    await page.waitForSelector('[data-testid="filters-sidebar"], .filters-sidebar, aside', { timeout: 10000 });
    
    // Find all filter links in the sidebar
    const filterLinks = await page.locator('aside a, .filters-sidebar a, [data-testid="filters-sidebar"] a').all();
    
    if (filterLinks.length === 0) {
      console.log('⚠️  No filter links found in sidebar. Let me check for alternative selectors...');
      
      // Try broader search for links
      const allLinks = await page.locator('a[href*="/electricity-plans/houston"]').all();
      console.log(`Found ${allLinks.length} links containing "/electricity-plans/houston"`);
      
      // Get all link information
      const allLinkData = [];
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const classes = await link.getAttribute('class');
        allLinkData.push({ href, text: text?.trim(), classes });
      }
      
      fs.writeFileSync(
        path.join(artifactsDir, 'all-links-analysis.json'),
        JSON.stringify(allLinkData, null, 2)
      );
      
      console.log('All links data saved to all-links-analysis.json');
    }
    
    // Capture sidebar area specifically
    await page.screenshot({ 
      path: path.join(artifactsDir, '02-sidebar-area.png'),
      clip: { x: 0, y: 0, width: 400, height: 800 }
    });
    
    // Get page HTML to inspect filter link structure
    const pageHTML = await page.content();
    fs.writeFileSync(path.join(artifactsDir, 'initial-page-html.html'), pageHTML);
    
    // Step 3: Look for Fixed Rate filter link specifically
    console.log('🎯 Step 3: Looking for Fixed Rate filter link...');
    
    // Try multiple selectors for Fixed Rate link
    const fixedRateSelectors = [
      'a[href*="fixed-rate"]',
      'a:has-text("Fixed Rate")',
      'a:has-text("Fixed")',
      '[data-filter="fixed-rate"] a',
      '.filter-option:has-text("Fixed Rate") a',
      'li:has-text("Fixed Rate") a'
    ];
    
    let fixedRateLink = null;
    let fixedRateLinkSelector = null;
    
    for (const selector of fixedRateSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.count() > 0) {
          fixedRateLink = link;
          fixedRateLinkSelector = selector;
          console.log(`✅ Found Fixed Rate link with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!fixedRateLink) {
      console.log('❌ Could not find Fixed Rate filter link. Taking screenshot of entire page for analysis...');
      await page.screenshot({ 
        path: path.join(artifactsDir, '03-no-fixed-rate-link-found.png'),
        fullPage: true
      });
      
      // Get all text content that might contain "Fixed"
      const fixedTexts = await page.locator(':has-text("Fixed")').all();
      const fixedTextData = [];
      for (const element of fixedTexts) {
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        const href = await element.getAttribute('href');
        fixedTextData.push({ tagName, text: text?.trim(), href });
      }
      
      fs.writeFileSync(
        path.join(artifactsDir, 'fixed-text-elements.json'),
        JSON.stringify(fixedTextData, null, 2)
      );
    } else {
      // Step 4: Inspect the Fixed Rate link attributes
      console.log('📋 Step 4: Inspecting Fixed Rate link attributes...');
      
      const linkHref = await fixedRateLink.getAttribute('href');
      const linkText = await fixedRateLink.textContent();
      const linkClasses = await fixedRateLink.getAttribute('class');
      
      console.log(`Fixed Rate Link Details:`);
      console.log(`  Selector: ${fixedRateLinkSelector}`);
      console.log(`  href: ${linkHref}`);
      console.log(`  text: ${linkText?.trim()}`);
      console.log(`  classes: ${linkClasses}`);
      
      // Highlight the link for visual confirmation
      await fixedRateLink.evaluate(el => {
        el.style.border = '3px solid red';
        el.style.backgroundColor = 'yellow';
      });
      
      await page.screenshot({ 
        path: path.join(artifactsDir, '04-highlighted-fixed-rate-link.png'),
        fullPage: true
      });
      
      // Step 5: Click the Fixed Rate link and monitor navigation
      console.log('🖱️  Step 5: Clicking Fixed Rate link and monitoring navigation...');
      
      // Clear previous network requests
      networkRequests.length = 0;
      networkResponses.length = 0;
      
      // Click the link
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        fixedRateLink.click()
      ]);
      
      // Get the new URL
      const newURL = page.url();
      console.log(`🔗 Navigated to: ${newURL}`);
      
      // Check if it has a trailing slash
      const hasTrailingSlash = newURL.endsWith('/') && newURL !== 'http://localhost:4324/';
      console.log(`❓ Has trailing slash: ${hasTrailingSlash}`);
      
      // Capture the new page
      await page.screenshot({ 
        path: path.join(artifactsDir, '05-after-click-navigation.png'),
        fullPage: true
      });
      
      // Step 6: Test the URL without trailing slash
      console.log('🔄 Step 6: Testing URL without trailing slash...');
      
      if (hasTrailingSlash) {
        const urlWithoutSlash = newURL.replace(/\/$/, '');
        console.log(`Testing URL without slash: ${urlWithoutSlash}`);
        
        try {
          await page.goto(urlWithoutSlash);
          await page.waitForLoadState('networkidle');
          
          await page.screenshot({ 
            path: path.join(artifactsDir, '06-url-without-slash.png'),
            fullPage: true
          });
          
          console.log(`✅ URL without slash works: ${page.url()}`);
        } catch (error) {
          console.log(`❌ URL without slash failed: ${error.message}`);
        }
      }
    }
    
    // Step 7: Generate comprehensive report
    console.log('📊 Step 7: Generating comprehensive analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      investigation: 'Trailing Slash Debug Analysis',
      initialURL: 'http://localhost:4324/electricity-plans/houston',
      finalURL: page.url(),
      fixedRateLink: {
        found: !!fixedRateLink,
        selector: fixedRateLinkSelector,
        href: fixedRateLink ? await fixedRateLink.getAttribute('href') : null,
        text: fixedRateLink ? await fixedRateLink.textContent() : null
      },
      trailingSlashIssue: {
        detected: page.url().endsWith('/') && page.url() !== 'http://localhost:4324/',
        originalURL: page.url(),
        urlWithoutSlash: page.url().replace(/\/$/, '')
      },
      networkRequests: networkRequests.filter(req => req.url.includes('electricity-plans')),
      networkResponses: networkResponses.filter(res => res.url.includes('electricity-plans')),
      consoleLogs: consoleLogs
    };
    
    fs.writeFileSync(
      path.join(artifactsDir, 'debug-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Save console logs separately
    fs.writeFileSync(
      path.join(artifactsDir, 'console-logs.txt'),
      consoleLogs.join('\n')
    );
    
    // Save network requests separately  
    fs.writeFileSync(
      path.join(artifactsDir, 'network-requests.json'),
      JSON.stringify(networkRequests, null, 2)
    );
    
    console.log(`\n🎉 Investigation complete!`);
    console.log(`📁 All artifacts saved to: ${artifactsDir}`);
    console.log(`\n📋 Summary:`);
    console.log(`  - Initial URL: http://localhost:4324/electricity-plans/houston`);
    console.log(`  - Final URL: ${page.url()}`);
    console.log(`  - Trailing slash detected: ${page.url().endsWith('/') && page.url() !== 'http://localhost:4324/'}`);
    console.log(`  - Fixed Rate link found: ${!!fixedRateLink}`);
    console.log(`  - Total network requests: ${networkRequests.length}`);
    console.log(`  - Console log entries: ${consoleLogs.length}`);
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
    
    // Save error state
    await page.screenshot({ 
      path: path.join(artifactsDir, 'error-state.png'),
      fullPage: true
    });
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      url: page.url(),
      consoleLogs: consoleLogs,
      networkRequests: networkRequests
    };
    
    fs.writeFileSync(
      path.join(artifactsDir, 'error-report.json'),
      JSON.stringify(errorReport, null, 2)
    );
  } finally {
    await browser.close();
  }
}

// Run the investigation
debugTrailingSlash().catch(console.error);