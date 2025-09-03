import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testHomepageNavigation() {
  // Create artifacts directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const artifactsDir = path.join(process.cwd(), 'artifacts', `navigation-test-${timestamp}`);
  
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  console.log('🚀 Starting homepage navigation test...');
  
  const results = {
    homepage: {},
    links: []
  };

  try {
    // Step 1: Navigate to homepage and capture initial state
    console.log('📍 Navigating to homepage...');
    await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
    
    // Capture homepage screenshot
    await page.screenshot({ 
      path: path.join(artifactsDir, 'homepage-initial.png'),
      fullPage: true 
    });
    
    results.homepage = {
      url: page.url(),
      title: await page.title(),
      loaded: true
    };
    
    console.log(`✅ Homepage loaded: ${results.homepage.url}`);
    
    // Find all navigation links we need to test
    const linksToTest = [
      { name: 'Browse by Location', selector: 'a[href*="location"], a:has-text("Browse by Location")' },
      { name: 'Compare Plans', selector: 'a[href*="compare"], a:has-text("Compare Plans")' },
      { name: 'Calculate Costs', selector: 'a[href*="calculator"], a:has-text("Calculate Costs"), a:has-text("Calculate")' }
    ];
    
    for (const linkInfo of linksToTest) {
      console.log(`\n🔗 Testing "${linkInfo.name}" link...`);
      
      const linkResult = {
        name: linkInfo.name,
        found: false,
        href: null,
        clicked: false,
        finalUrl: null,
        error: null,
        screenshot: null
      };
      
      try {
        // Find the link
        const link = await page.locator(linkInfo.selector).first();
        const linkExists = await link.count() > 0;
        
        if (linkExists) {
          linkResult.found = true;
          linkResult.href = await link.getAttribute('href');
          console.log(`   Found link with href: ${linkResult.href}`);
          
          // Take screenshot before clicking
          await page.screenshot({ 
            path: path.join(artifactsDir, `before-${linkInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`),
            fullPage: true 
          });
          
          // Click the link and wait for navigation
          try {
            await Promise.race([
              link.click(),
              page.waitForTimeout(1000)
            ]);
            
            // Wait a bit for any navigation to complete
            await page.waitForTimeout(2000);
            
            linkResult.clicked = true;
            linkResult.finalUrl = page.url();
            
            console.log(`   Clicked successfully, final URL: ${linkResult.finalUrl}`);
            
            // Take screenshot after clicking
            const screenshotPath = path.join(artifactsDir, `after-${linkInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
            await page.screenshot({ 
              path: screenshotPath,
              fullPage: true 
            });
            linkResult.screenshot = screenshotPath;
            
            // Check if we got an error page
            const pageContent = await page.textContent('body');
            if (pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Error')) {
              linkResult.error = 'Page shows error content (404/Not Found)';
              console.log(`   ⚠️  Error detected: ${linkResult.error}`);
            }
            
          } catch (clickError) {
            linkResult.error = `Click failed: ${clickError.message}`;
            console.log(`   ❌ Click error: ${linkResult.error}`);
          }
          
        } else {
          linkResult.error = 'Link not found on page';
          console.log(`   ❌ Link not found with selector: ${linkInfo.selector}`);
        }
        
      } catch (testError) {
        linkResult.error = `Test error: ${testError.message}`;
        console.log(`   ❌ Test error: ${linkResult.error}`);
      }
      
      results.links.push(linkResult);
      
      // Navigate back to homepage for next test
      if (linkResult.clicked && page.url() !== 'http://localhost:4324/') {
        console.log('   🔄 Navigating back to homepage...');
        await page.goto('http://localhost:4324', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
      }
    }
    
    // Save detailed results
    const reportPath = path.join(artifactsDir, 'navigation-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Generate summary report
    const summaryPath = path.join(artifactsDir, 'navigation-summary.md');
    let summary = `# Homepage Navigation Test Results\n\n`;
    summary += `**Test Date**: ${new Date().toISOString()}\n`;
    summary += `**Homepage URL**: ${results.homepage.url}\n`;
    summary += `**Homepage Title**: ${results.homepage.title}\n\n`;
    
    summary += `## Link Test Results\n\n`;
    
    for (const link of results.links) {
      summary += `### ${link.name}\n`;
      summary += `- **Found**: ${link.found ? '✅ Yes' : '❌ No'}\n`;
      if (link.href) summary += `- **Href**: \`${link.href}\`\n`;
      summary += `- **Clicked**: ${link.clicked ? '✅ Yes' : '❌ No'}\n`;
      if (link.finalUrl) summary += `- **Final URL**: \`${link.finalUrl}\`\n`;
      if (link.error) summary += `- **Error**: ⚠️ ${link.error}\n`;
      if (link.screenshot) summary += `- **Screenshot**: \`${path.basename(link.screenshot)}\`\n`;
      summary += `\n`;
    }
    
    summary += `## Files Generated\n\n`;
    summary += `- \`navigation-test-results.json\` - Detailed test results\n`;
    summary += `- \`homepage-initial.png\` - Homepage screenshot\n`;
    summary += `- \`before-*.png\` - Screenshots before clicking links\n`;
    summary += `- \`after-*.png\` - Screenshots after clicking links\n`;
    
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`\n📊 Test completed! Results saved to:`);
    console.log(`   📁 ${artifactsDir}`);
    console.log(`   📄 ${reportPath}`);
    console.log(`   📄 ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  return results;
}

// Run the test
testHomepageNavigation()
  .then(results => {
    console.log('\n🎉 Navigation test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });

export default testHomepageNavigation;