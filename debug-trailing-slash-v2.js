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
    slowMo: 500
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
    console.log('🔍 Starting trailing slash debug investigation v2...');
    
    // Step 1: Navigate to the Houston electricity plans page
    console.log('📍 Step 1: Navigating to Houston electricity plans page...');
    await page.goto('http://localhost:4324/electricity-plans/houston', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log(`Current URL: ${page.url()}`);
    
    // Wait for some content to appear (more flexible approach)
    console.log('⏳ Waiting for page content to load...');
    try {
      // Wait for any of these elements to appear
      await page.waitForSelector('main, .container, .page-container, h1, .plan-card, .filter', { 
        timeout: 15000 
      });
      console.log('✅ Page content loaded successfully');
    } catch (e) {
      console.log('⚠️  Timeout waiting for main content, proceeding anyway...');
    }
    
    // Capture initial page state
    await page.screenshot({ 
      path: path.join(artifactsDir, '01-initial-page.png'),
      fullPage: true
    });
    
    // Get page HTML to inspect structure
    const pageHTML = await page.content();
    fs.writeFileSync(path.join(artifactsDir, 'initial-page-html.html'), pageHTML);
    
    // Step 2: Find ALL links on the page and analyze them
    console.log('🔍 Step 2: Analyzing all links on the page...');
    
    const allLinks = await page.locator('a[href]').all();
    console.log(`Found ${allLinks.length} total links on the page`);
    
    // Collect detailed link information
    const linkData = [];
    for (let i = 0; i < allLinks.length; i++) {
      try {
        const link = allLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const classes = await link.getAttribute('class');
        const id = await link.getAttribute('id');
        const parent = await link.locator('..').first().evaluate(el => el.tagName);
        
        linkData.push({
          index: i,
          href,
          text: text?.trim() || '',
          classes,
          id,
          parentTag: parent,
          isElectricityPlanLink: href?.includes('electricity-plans'),
          hasFixedInText: text?.toLowerCase().includes('fixed'),
          hasRateInText: text?.toLowerCase().includes('rate')
        });
      } catch (e) {
        console.log(`Error analyzing link ${i}: ${e.message}`);
      }
    }
    
    // Save all link data
    fs.writeFileSync(
      path.join(artifactsDir, 'all-links-analysis.json'),
      JSON.stringify(linkData, null, 2)
    );
    
    // Filter for relevant filter links
    const filterLinks = linkData.filter(link => 
      link.isElectricityPlanLink && 
      link.href?.includes('houston') &&
      (link.hasFixedInText || link.hasRateInText || link.href?.includes('fixed') || link.href?.includes('rate'))
    );
    
    console.log(`Found ${filterLinks.length} potential filter links:`);
    filterLinks.forEach(link => {
      console.log(`  - "${link.text}" -> ${link.href}`);
    });
    
    // Step 3: Look specifically for Fixed Rate links
    console.log('🎯 Step 3: Looking for Fixed Rate filter links...');
    
    let fixedRateLink = null;
    let fixedRateLinkData = null;
    
    // Find the best Fixed Rate link candidate
    const fixedRateCandidates = linkData.filter(link => 
      (link.text?.toLowerCase().includes('fixed') && link.text?.toLowerCase().includes('rate')) ||
      link.href?.includes('fixed-rate')
    );
    
    if (fixedRateCandidates.length > 0) {
      fixedRateLinkData = fixedRateCandidates[0];
      console.log(`✅ Found Fixed Rate link: "${fixedRateLinkData.text}" -> ${fixedRateLinkData.href}`);
      
      // Get the actual element
      fixedRateLink = page.locator('a').nth(fixedRateLinkData.index);
      
      // Highlight the link for visual confirmation
      await fixedRateLink.evaluate(el => {
        el.style.border = '3px solid red';
        el.style.backgroundColor = 'yellow';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      
      await page.waitForTimeout(1000); // Let it scroll
      
      await page.screenshot({ 
        path: path.join(artifactsDir, '02-highlighted-fixed-rate-link.png'),
        fullPage: true
      });
      
      // Step 4: Click the Fixed Rate link and monitor navigation
      console.log('🖱️  Step 4: Clicking Fixed Rate link and monitoring navigation...');
      
      const originalURL = page.url();
      
      // Clear previous network data for this click
      networkRequests.length = 0;
      networkResponses.length = 0;
      
      // Click the link and wait for navigation
      const navigationPromise = page.waitForURL(/.*/, { timeout: 10000 }).catch(() => {
        console.log('Navigation timeout - checking if URL changed anyway...');
      });
      
      await fixedRateLink.click();
      await navigationPromise;
      
      const newURL = page.url();
      console.log(`🔗 Navigation result:`);
      console.log(`  Original: ${originalURL}`);
      console.log(`  New:      ${newURL}`);
      console.log(`  Changed:  ${originalURL !== newURL}`);
      
      // Check for trailing slash
      const hasTrailingSlash = newURL.endsWith('/') && !newURL.endsWith('://localhost:4324/');
      console.log(`❓ Has trailing slash: ${hasTrailingSlash}`);
      
      // Capture the new page
      await page.screenshot({ 
        path: path.join(artifactsDir, '03-after-click-navigation.png'),
        fullPage: true
      });
      
      // Step 5: If there's a trailing slash, test URL without it
      if (hasTrailingSlash) {
        console.log('🔄 Step 5: Testing URL without trailing slash...');
        
        const urlWithoutSlash = newURL.replace(/\/$/, '');
        console.log(`Testing URL without slash: ${urlWithoutSlash}`);
        
        try {
          await page.goto(urlWithoutSlash);
          await page.waitForLoadState('domcontentloaded');
          
          await page.screenshot({ 
            path: path.join(artifactsDir, '04-url-without-slash.png'),
            fullPage: true
          });
          
          const finalURL = page.url();
          console.log(`✅ URL without slash result: ${finalURL}`);
          
          // Check if it redirected back to trailing slash
          if (finalURL.endsWith('/')) {
            console.log('⚠️  Server redirected back to trailing slash URL');
          }
          
        } catch (error) {
          console.log(`❌ URL without slash failed: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ No Fixed Rate filter links found');
      
      // Let's look for ANY filter-like links
      const potentialFilters = linkData.filter(link => 
        link.href?.includes('houston') && 
        link.href !== 'http://localhost:4324/electricity-plans/houston' &&
        link.text?.length > 0 &&
        link.text?.length < 50
      );
      
      console.log(`Found ${potentialFilters.length} potential filter links:`);
      potentialFilters.slice(0, 5).forEach(link => {
        console.log(`  - "${link.text}" -> ${link.href}`);
      });
      
      if (potentialFilters.length > 0) {
        console.log('🔄 Testing first potential filter link...');
        const testLink = page.locator('a').nth(potentialFilters[0].index);
        
        await testLink.evaluate(el => {
          el.style.border = '3px solid blue';
          el.style.backgroundColor = 'lightblue';
        });
        
        await page.screenshot({ 
          path: path.join(artifactsDir, '02-test-filter-link.png'),
          fullPage: true
        });
        
        const originalURL = page.url();
        await testLink.click();
        await page.waitForTimeout(2000);
        const newURL = page.url();
        
        console.log(`Test navigation: ${originalURL} -> ${newURL}`);
        
        await page.screenshot({ 
          path: path.join(artifactsDir, '03-test-navigation-result.png'),
          fullPage: true
        });
      }
    }
    
    // Step 6: Generate comprehensive report
    console.log('📊 Step 6: Generating comprehensive analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      investigation: 'Trailing Slash Debug Analysis v2',
      pageAnalysis: {
        url: page.url(),
        totalLinks: allLinks.length,
        electricityPlanLinks: linkData.filter(l => l.isElectricityPlanLink).length,
        potentialFilterLinks: filterLinks.length
      },
      fixedRateAnalysis: {
        found: !!fixedRateLinkData,
        linkData: fixedRateLinkData,
        candidates: fixedRateCandidates.length
      },
      trailingSlashAnalysis: {
        currentURL: page.url(),
        hasTrailingSlash: page.url().endsWith('/') && !page.url().endsWith('://localhost:4324/'),
        suspiciousLinks: linkData.filter(l => l.href?.endsWith('/')).length
      },
      networkAnalysis: {
        totalRequests: networkRequests.length,
        failedRequests: networkResponses.filter(r => r.status >= 400).length,
        electricityPlanRequests: networkRequests.filter(r => r.url.includes('electricity-plans')).length
      },
      linkAnalysis: linkData,
      consoleLogs: consoleLogs,
      networkRequests: networkRequests,
      networkResponses: networkResponses
    };
    
    fs.writeFileSync(
      path.join(artifactsDir, 'debug-report-v2.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n🎉 Investigation complete!`);
    console.log(`📁 All artifacts saved to: ${artifactsDir}`);
    console.log(`\n📋 Summary:`);
    console.log(`  - Current URL: ${page.url()}`);
    console.log(`  - Total links found: ${allLinks.length}`);
    console.log(`  - Fixed Rate links found: ${fixedRateCandidates.length}`);
    console.log(`  - Has trailing slash: ${page.url().endsWith('/') && !page.url().endsWith('://localhost:4324/')}`);
    console.log(`  - Network requests: ${networkRequests.length}`);
    console.log(`  - Console logs: ${consoleLogs.length}`);
    
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
    // Keep browser open for manual inspection
    console.log('🔍 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    
    // Don't close automatically - let user inspect
    // await browser.close();
  }
}

// Run the investigation
debugTrailingSlash().catch(console.error);