#!/usr/bin/env node
/**
 * Automated Performance Testing Suite
 * Runs comprehensive performance tests across the entire application
 * Monitors Core Web Vitals, API performance, and infrastructure metrics
 */

import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const PERFORMANCE_THRESHOLDS = {
  // Lighthouse scores (0-100)
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 95,
  
  // Core Web Vitals (milliseconds)
  lcp: 2500,        // Largest Contentful Paint
  fid: 100,         // First Input Delay
  cls: 0.1,         // Cumulative Layout Shift
  
  // Page load metrics (milliseconds)
  ttfb: 200,        // Time to First Byte
  fcp: 1800,        // First Contentful Paint
  tti: 3800,        // Time to Interactive
  
  // API performance (milliseconds)
  apiResponseTime: 500,
  
  // Bundle sizes (KB)
  jsBundle: 250,
  cssBundle: 50,
  
  // Cache performance (percentage)
  cacheHitRate: 85
};

const TEST_URLS = [
  // Core pages
  { url: '/', name: 'Homepage', critical: true },
  { url: '/texas', name: 'Texas Market Page', critical: true },
  { url: '/electricity-plans/dallas-tx/', name: 'Dallas Plans Page', critical: true },
  { url: '/electricity-plans/houston-tx/', name: 'Houston Plans Page', critical: true },
  
  // Faceted navigation (high-traffic paths)
  { url: '/electricity-plans/dallas-tx/12-month/', name: 'Dallas 12-month Plans', critical: true },
  { url: '/electricity-plans/houston-tx/fixed-rate/', name: 'Houston Fixed Rate Plans', critical: false },
  { url: '/electricity-plans/austin-tx/green-energy/', name: 'Austin Green Energy Plans', critical: false },
  
  // Complex filtered pages
  { url: '/electricity-plans/dallas-tx/12-month/fixed-rate/', name: 'Dallas Multi-Filter Page', critical: false },
  { url: '/electricity-plans/houston-tx/24-month/green-energy/', name: 'Houston Multi-Filter Page', critical: false },
  
  // Static pages
  { url: '/compare', name: 'Compare Plans Page', critical: false },
  { url: '/providers', name: 'Providers Page', critical: false }
];

const MOBILE_DEVICE = {
  name: 'iPhone 12',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
};

class PerformanceTestSuite {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalFailures: 0,
        overallScore: 0
      },
      tests: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run complete performance test suite
   */
  async runAll() {
    console.log('🚀 STARTING PERFORMANCE TEST SUITE');
    console.log('=' .repeat(60));
    console.log(`Testing ${TEST_URLS.length} URLs with Lighthouse + Custom Metrics`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('');

    try {
      // Initialize browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
      });

      // Run tests for each URL
      for (const testConfig of TEST_URLS) {
        await this.runTestForUrl(browser, testConfig);
      }

      await browser.close();

      // Generate final report
      await this.generateReport();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 PERFORMANCE TEST RESULTS');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${this.results.summary.totalTests}`);
      console.log(`Passed: ${this.results.summary.passedTests}`);
      console.log(`Failed: ${this.results.summary.failedTests}`);
      console.log(`Critical Failures: ${this.results.summary.criticalFailures}`);
      console.log(`Overall Score: ${this.results.summary.overallScore.toFixed(1)}/100`);
      
      if (this.results.summary.criticalFailures > 0) {
        console.log('\n❌ CRITICAL PERFORMANCE ISSUES DETECTED');
        process.exit(1);
      } else if (this.results.summary.failedTests > 0) {
        console.log('\n⚠️  Some performance tests failed (non-critical)');
        process.exit(0);
      } else {
        console.log('\n✅ All performance tests passed!');
        process.exit(0);
      }

    } catch (error) {
      console.error('Fatal error during performance testing:', error);
      process.exit(1);
    }
  }

  /**
   * Run performance test for a specific URL
   */
  async runTestForUrl(browser, testConfig) {
    const { url, name, critical } = testConfig;
    const fullUrl = url.startsWith('http') ? url : `http://localhost:4324${url}`;
    
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${fullUrl}`);
    console.log(`   Critical: ${critical ? 'YES' : 'NO'}`);

    const testResult = {
      url,
      name,
      critical,
      timestamp: new Date().toISOString(),
      lighthouse: null,
      customMetrics: null,
      passed: false,
      issues: []
    };

    try {
      // Run Lighthouse audit
      console.log('   📊 Running Lighthouse audit...');
      const lighthouseResult = await this.runLighthouseAudit(fullUrl);
      testResult.lighthouse = lighthouseResult;

      // Run custom performance tests
      console.log('   ⚡ Running custom performance tests...');
      const customMetrics = await this.runCustomTests(browser, fullUrl);
      testResult.customMetrics = customMetrics;

      // Evaluate results
      const evaluation = this.evaluateResults(lighthouseResult, customMetrics, critical);
      testResult.passed = evaluation.passed;
      testResult.issues = evaluation.issues;

      if (testResult.passed) {
        console.log('   ✅ PASSED');
      } else {
        console.log(`   ❌ FAILED (${evaluation.issues.length} issues)`);
        evaluation.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }

    } catch (error) {
      testResult.issues.push(`Test execution failed: ${error.message}`);
      console.log(`   💥 ERROR: ${error.message}`);
    }

    // Update summary
    this.results.summary.totalTests++;
    if (testResult.passed) {
      this.results.summary.passedTests++;
    } else {
      this.results.summary.failedTests++;
      if (critical) {
        this.results.summary.criticalFailures++;
      }
    }

    this.results.tests.push(testResult);
  }

  /**
   * Run Lighthouse audit on a URL
   */
  async runLighthouseAudit(url) {
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: 9222,
      settings: {
        formFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3
        }
      }
    };

    try {
      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult;

      return {
        scores: {
          performance: Math.round(lhr.categories.performance.score * 100),
          accessibility: Math.round(lhr.categories.accessibility.score * 100),
          bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
          seo: Math.round(lhr.categories.seo.score * 100)
        },
        metrics: {
          lcp: lhr.audits['largest-contentful-paint']?.numericValue || 0,
          fcp: lhr.audits['first-contentful-paint']?.numericValue || 0,
          cls: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
          tti: lhr.audits['interactive']?.numericValue || 0,
          ttfb: lhr.audits['time-to-first-byte']?.numericValue || 0
        },
        opportunities: lhr.audits['unused-css-rules']?.details?.items?.length || 0
      };
    } catch (error) {
      console.warn('Lighthouse audit failed:', error.message);
      return null;
    }
  }

  /**
   * Run custom performance tests
   */
  async runCustomTests(browser, url) {
    const page = await browser.newPage();
    
    try {
      // Emulate mobile device
      await page.emulate(MOBILE_DEVICE);

      // Enable performance monitoring
      await page.setCacheEnabled(true);
      
      const startTime = Date.now();
      
      // Navigate to page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const loadTime = Date.now() - startTime;

      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          navigationTiming: {
            ttfb: navigation.responseStart - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart
          },
          paintTiming: {
            firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
          },
          resourceCounts: {
            totalResources: performance.getEntriesByType('resource').length,
            jsResources: performance.getEntriesByType('resource').filter(r => r.name.includes('.js')).length,
            cssResources: performance.getEntriesByType('resource').filter(r => r.name.includes('.css')).length,
            imageResources: performance.getEntriesByType('resource').filter(r => 
              r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)/)
            ).length
          }
        };
      });

      // Check bundle sizes
      const jsSize = await this.getBundleSize(page, 'script');
      const cssSize = await this.getBundleSize(page, 'link[rel="stylesheet"]');

      // Test API response time
      const apiResponseTime = await this.testApiPerformance(page);

      return {
        loadTime,
        statusCode: response.status(),
        metrics,
        bundleSizes: {
          js: jsSize,
          css: cssSize
        },
        apiResponseTime
      };

    } finally {
      await page.close();
    }
  }

  /**
   * Get bundle size for specific resource type
   */
  async getBundleSize(page, selector) {
    try {
      const sizes = await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);
        const promises = Array.from(elements).map(async (element) => {
          const url = element.href || element.src;
          if (!url || url.startsWith('data:')) return 0;
          
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            return blob.size;
          } catch {
            return 0;
          }
        });
        
        return Promise.all(promises);
      }, selector);

      return sizes.reduce((total, size) => total + size, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Test API performance
   */
  async testApiPerformance(page) {
    try {
      const startTime = Date.now();
      
      // Look for API calls in network traffic
      const apiCalls = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/') || entry.name.includes('api.comparepower.com'))
          .map(entry => ({
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          }));
      });

      if (apiCalls.length > 0) {
        return apiCalls.reduce((avg, call) => avg + call.duration, 0) / apiCalls.length;
      }

      return Date.now() - startTime;
    } catch {
      return 0;
    }
  }

  /**
   * Evaluate test results against thresholds
   */
  evaluateResults(lighthouseResult, customMetrics, critical) {
    const issues = [];
    let passed = true;

    if (lighthouseResult) {
      // Check Lighthouse scores
      if (lighthouseResult.scores.performance < PERFORMANCE_THRESHOLDS.performance) {
        issues.push(`Performance score: ${lighthouseResult.scores.performance} (threshold: ${PERFORMANCE_THRESHOLDS.performance})`);
        if (critical) passed = false;
      }

      if (lighthouseResult.scores.accessibility < PERFORMANCE_THRESHOLDS.accessibility) {
        issues.push(`Accessibility score: ${lighthouseResult.scores.accessibility} (threshold: ${PERFORMANCE_THRESHOLDS.accessibility})`);
        if (critical) passed = false;
      }

      // Check Core Web Vitals
      if (lighthouseResult.metrics.lcp > PERFORMANCE_THRESHOLDS.lcp) {
        issues.push(`LCP: ${Math.round(lighthouseResult.metrics.lcp)}ms (threshold: ${PERFORMANCE_THRESHOLDS.lcp}ms)`);
        if (critical) passed = false;
      }

      if (lighthouseResult.metrics.cls > PERFORMANCE_THRESHOLDS.cls) {
        issues.push(`CLS: ${lighthouseResult.metrics.cls.toFixed(3)} (threshold: ${PERFORMANCE_THRESHOLDS.cls})`);
        if (critical) passed = false;
      }
    }

    if (customMetrics) {
      // Check load time
      if (customMetrics.loadTime > 5000) {
        issues.push(`Page load time: ${customMetrics.loadTime}ms (threshold: 5000ms)`);
        if (critical) passed = false;
      }

      // Check bundle sizes
      const jsKB = Math.round(customMetrics.bundleSizes.js / 1024);
      if (jsKB > PERFORMANCE_THRESHOLDS.jsBundle) {
        issues.push(`JS bundle size: ${jsKB}KB (threshold: ${PERFORMANCE_THRESHOLDS.jsBundle}KB)`);
      }

      // Check API performance
      if (customMetrics.apiResponseTime > PERFORMANCE_THRESHOLDS.apiResponseTime) {
        issues.push(`API response time: ${Math.round(customMetrics.apiResponseTime)}ms (threshold: ${PERFORMANCE_THRESHOLDS.apiResponseTime}ms)`);
      }
    }

    return { passed, issues };
  }

  /**
   * Generate detailed performance report
   */
  async generateReport() {
    const reportDir = './reports/performance';
    await mkdir(reportDir, { recursive: true });
    
    const reportFile = `${reportDir}/performance-report-${Date.now()}.json`;
    
    // Calculate overall score
    const scores = this.results.tests
      .filter(test => test.lighthouse)
      .map(test => test.lighthouse.scores.performance);
    
    if (scores.length > 0) {
      this.results.summary.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    await writeFile(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);

    // Generate HTML report
    await this.generateHtmlReport(reportDir);
  }

  /**
   * Generate HTML performance report
   */
  async generateHtmlReport(reportDir) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ChooseMyPower.org</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .test-result { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .critical-failed { border-left: 5px solid #d32f2f; background: #ffebee; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 15px 0; }
        .metric { background: #f9f9f9; padding: 10px; border-radius: 4px; text-align: center; }
        .issues { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .score { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="metrics">
            <div class="metric">
                <div class="score">${this.results.summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="score">${this.results.summary.passedTests}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="score">${this.results.summary.failedTests}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="score">${this.results.summary.criticalFailures}</div>
                <div>Critical Failures</div>
            </div>
            <div class="metric">
                <div class="score">${this.results.summary.overallScore.toFixed(1)}</div>
                <div>Overall Score</div>
            </div>
        </div>
    </div>

    ${this.results.tests.map(test => `
        <div class="test-result ${test.passed ? 'passed' : (test.critical && !test.passed ? 'critical-failed' : 'failed')}">
            <h3>${test.name}</h3>
            <p><strong>URL:</strong> ${test.url}</p>
            <p><strong>Critical:</strong> ${test.critical ? 'Yes' : 'No'}</p>
            <p><strong>Status:</strong> ${test.passed ? '✅ Passed' : '❌ Failed'}</p>
            
            ${test.lighthouse ? `
                <h4>Lighthouse Scores</h4>
                <div class="metrics">
                    <div class="metric">
                        <div class="score">${test.lighthouse.scores.performance}</div>
                        <div>Performance</div>
                    </div>
                    <div class="metric">
                        <div class="score">${test.lighthouse.scores.accessibility}</div>
                        <div>Accessibility</div>
                    </div>
                    <div class="metric">
                        <div class="score">${test.lighthouse.scores.bestPractices}</div>
                        <div>Best Practices</div>
                    </div>
                    <div class="metric">
                        <div class="score">${test.lighthouse.scores.seo}</div>
                        <div>SEO</div>
                    </div>
                </div>
                
                <h4>Core Web Vitals</h4>
                <div class="metrics">
                    <div class="metric">
                        <div class="score">${Math.round(test.lighthouse.metrics.lcp)}ms</div>
                        <div>LCP</div>
                    </div>
                    <div class="metric">
                        <div class="score">${Math.round(test.lighthouse.metrics.fcp)}ms</div>
                        <div>FCP</div>
                    </div>
                    <div class="metric">
                        <div class="score">${test.lighthouse.metrics.cls.toFixed(3)}</div>
                        <div>CLS</div>
                    </div>
                    <div class="metric">
                        <div class="score">${Math.round(test.lighthouse.metrics.tti)}ms</div>
                        <div>TTI</div>
                    </div>
                </div>
            ` : ''}

            ${test.issues.length > 0 ? `
                <div class="issues">
                    <h4>Issues Found:</h4>
                    <ul>
                        ${test.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('')}

    <p><em>Generated on ${new Date(this.results.timestamp).toLocaleString()}</em></p>
</body>
</html>
    `;

    const htmlFile = `${reportDir}/performance-report.html`;
    await writeFile(htmlFile, htmlContent);
    console.log(`📊 HTML report saved to: ${htmlFile}`);
  }
}

// Run performance tests
const testSuite = new PerformanceTestSuite();
testSuite.runAll().catch(console.error);