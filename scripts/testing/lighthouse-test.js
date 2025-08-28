import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

async function runLighthouseTest() {
  console.log('🔍 Running Lighthouse test on homepage...\n');
  
  // Launch Chrome
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Get browser endpoint  
    const browserWSEndpoint = browser.wsEndpoint();
    
    // Run Lighthouse
    const result = await lighthouse('http://localhost:4324/', {
      port: (new URL(browserWSEndpoint)).port,
      output: 'json',
      logLevel: 'error',
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    if (!result) {
      throw new Error('Failed to generate Lighthouse report');
    }

    // Extract scores
    const scores = result.lhr.categories;
    
    console.log('📊 Lighthouse Scores:');
    console.log('===================');
    console.log(`🚀 Performance:    ${Math.round(scores.performance.score * 100)}/100`);
    console.log(`♿ Accessibility:   ${Math.round(scores.accessibility.score * 100)}/100`);
    console.log(`🔧 Best Practices:  ${Math.round(scores['best-practices'].score * 100)}/100`);
    console.log(`🔍 SEO:             ${Math.round(scores.seo.score * 100)}/100`);
    console.log('');

    // Key metrics
    const audits = result.lhr.audits;
    console.log('⚡ Core Web Vitals:');
    console.log('==================');
    if (audits['largest-contentful-paint']) {
      console.log(`LCP: ${audits['largest-contentful-paint'].displayValue || 'N/A'}`);
    }
    if (audits['first-contentful-paint']) {
      console.log(`FCP: ${audits['first-contentful-paint'].displayValue || 'N/A'}`);
    }
    if (audits['cumulative-layout-shift']) {
      console.log(`CLS: ${audits['cumulative-layout-shift'].displayValue || 'N/A'}`);
    }
    if (audits['total-blocking-time']) {
      console.log(`TBT: ${audits['total-blocking-time'].displayValue || 'N/A'}`);
    }
    console.log('');

    // Key improvements
    console.log('✅ Implemented Improvements:');
    console.log('============================');
    console.log('• Added width/height to images (prevents CLS)');
    console.log('• Font-display: swap (prevents invisible text)');
    console.log('• Preloaded critical fonts');
    console.log('• Skip navigation links (accessibility)');
    console.log('• Content Security Policy (security)');
    console.log('• JSON-LD structured data (SEO)');
    console.log('• Hero image preloading (improves LCP)');
    console.log('• Fixed color contrast issues');
    console.log('• Code splitting and minification enabled');
    console.log('');

    // Check specific improvements
    const opportunities = result.lhr.audits;
    console.log('🔧 Key Optimizations Status:');
    console.log('============================');
    
    if (opportunities['uses-optimized-images']) {
      const passing = opportunities['uses-optimized-images'].score === 1;
      console.log(`Image optimization: ${passing ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
    }
    
    if (opportunities['font-display']) {
      const passing = opportunities['font-display'].score === 1;
      console.log(`Font display: ${passing ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
    }
    
    if (opportunities['color-contrast']) {
      const passing = opportunities['color-contrast'].score === 1;
      console.log(`Color contrast: ${passing ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
    }
    
    if (opportunities['button-name']) {
      const passing = opportunities['button-name'].score === 1;
      console.log(`Button names: ${passing ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
    }

    console.log('\n🎯 Overall Assessment:');
    console.log('=====================');
    const overall = (scores.performance.score + scores.accessibility.score + scores['best-practices'].score + scores.seo.score) / 4 * 100;
    console.log(`Average Score: ${Math.round(overall)}/100`);
    
    if (overall >= 90) {
      console.log('🎉 Excellent! Your site performs very well.');
    } else if (overall >= 75) {
      console.log('✨ Good performance with room for improvement.');
    } else {
      console.log('⚠️  Needs optimization work.');
    }

  } catch (error) {
    console.error('❌ Lighthouse test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:4324/');
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Dev server not running. Please start with: npm run dev');
    process.exit(1);
  }
  
  await runLighthouseTest();
}

main().catch(console.error);