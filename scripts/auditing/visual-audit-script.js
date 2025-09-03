import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Configuration
const baseURL = 'http://localhost:4324';
const timestamp = '20250829-133053';
const artifactsDir = `./artifacts/visual-audit-${timestamp}`;
const screenshotsDir = `${artifactsDir}/screenshots`;
const reportsDir = `${artifactsDir}/reports`;

// Test pages
const pages = [
  {
    name: 'city-page',
    url: '/texas/dallas-tx',
    description: 'City-specific electricity plan page'
  },
  {
    name: 'faceted-page',
    url: '/electricity-plans/dallas-tx/',
    description: 'Faceted navigation electricity plans page'
  },
  {
    name: 'filtered-page',
    url: '/electricity-plans/dallas-tx/12-month/variable-rate',
    description: 'Filtered electricity plans page'
  }
];

// Standard viewports for testing
const viewports = [
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

// Texas brand colors for validation
const brandColors = {
  navy: '#003366',
  red: '#CC0000',
  gold: '#FFD700',
  white: '#FFFFFF',
  black: '#000000'
};

async function runVisualAudit() {
  console.log('🚀 Starting comprehensive visual audit...');
  console.log(`📁 Artifacts will be saved to: ${artifactsDir}`);
  
  // Ensure directories exist
  [screenshotsDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  // Enable console logging
  const auditResults = {
    pages: {},
    globalIssues: [],
    recommendations: []
  };

  for (const pageConfig of pages) {
    console.log(`\\n🔍 Auditing ${pageConfig.name}: ${pageConfig.url}`);
    
    const page = await context.newPage();
    const pageResults = {
      name: pageConfig.name,
      url: pageConfig.url,
      screenshots: {},
      consoleErrors: [],
      networkErrors: [],
      contrastIssues: [],
      accessibilityIssues: [],
      visualInconsistencies: []
    };

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageResults.consoleErrors.push({
          message: msg.text(),
          location: msg.location()
        });
      }
    });

    // Monitor network errors
    page.on('response', response => {
      if (!response.ok()) {
        pageResults.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    try {
      // Navigate to page with network wait
      await page.goto(`${baseURL}${pageConfig.url}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);

      // Take screenshots at different viewports
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000); // Allow layout to settle
        
        const screenshotPath = `${screenshotsDir}/${pageConfig.name}-${viewport.name}.png`;
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true,
          animations: 'disabled'
        });
        
        pageResults.screenshots[viewport.name] = screenshotPath;
        console.log(`  📸 Screenshot saved: ${viewport.name}`);
      }

      // Reset to standard desktop view for detailed analysis
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(1000);

      // Inject axe-core for accessibility testing
      await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js' });
      
      // Run axe accessibility audit
      const accessibilityResults = await page.evaluate(async () => {
        return new Promise((resolve) => {
          axe.run((err, results) => {
            if (err) resolve({ error: err.message });
            resolve(results);
          });
        });
      });

      if (accessibilityResults.violations) {
        pageResults.accessibilityIssues = accessibilityResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          nodes: violation.nodes.length
        }));
      }

      // Check for contrast issues by examining computed styles
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach((el, index) => {
          if (index > 1000) return; // Limit to prevent timeout
          
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          const fontSize = parseFloat(style.fontSize);
          
          // Simple contrast check (basic implementation)
          if (color && backgroundColor && 
              color !== 'rgba(0, 0, 0, 0)' && 
              backgroundColor !== 'rgba(0, 0, 0, 0)') {
            
            // Check for potential issues
            if ((color.includes('255, 255, 255') && backgroundColor.includes('255, 255, 255')) ||
                (color.includes('0, 0, 0') && backgroundColor.includes('0, 0, 0'))) {
              issues.push({
                element: el.tagName + (el.className ? '.' + el.className : ''),
                color: color,
                backgroundColor: backgroundColor,
                fontSize: fontSize,
                text: el.textContent?.substring(0, 50) || ''
              });
            }
          }
        });
        
        return issues;
      });

      pageResults.contrastIssues = contrastIssues;

      // Check for plan cards and their styling consistency
      const planCardAnalysis = await page.evaluate(() => {
        const planCards = Array.from(document.querySelectorAll('[data-testid*="plan-card"], .plan-card, [class*="plan-card"]'));
        
        return planCards.map((card, index) => {
          const style = window.getComputedStyle(card);
          const badges = card.querySelectorAll('.badge, [class*="badge"]');
          
          return {
            index,
            className: card.className,
            backgroundColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            padding: style.padding,
            margin: style.margin,
            badgeCount: badges.length,
            hasProperShadow: style.boxShadow !== 'none'
          };
        });
      });

      pageResults.planCards = planCardAnalysis;

      // Check for Texas brand color usage
      const brandColorUsage = await page.evaluate((colors) => {
        const usage = {};
        const elements = document.querySelectorAll('*');
        
        Object.entries(colors).forEach(([colorName, colorValue]) => {
          usage[colorName] = 0;
        });
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          Object.entries(colors).forEach(([colorName, colorValue]) => {
            if (color.includes(colorValue) || backgroundColor.includes(colorValue)) {
              usage[colorName]++;
            }
          });
        });
        
        return usage;
      }, brandColors);

      pageResults.brandColorUsage = brandColorUsage;

    } catch (error) {
      console.error(`❌ Error auditing ${pageConfig.name}:`, error.message);
      pageResults.error = error.message;
    }

    await page.close();
    auditResults.pages[pageConfig.name] = pageResults;
  }

  await browser.close();

  // Generate comprehensive report
  const reportPath = `${reportsDir}/visual-audit-report.json`;
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

  // Generate human-readable summary
  const summaryPath = `${reportsDir}/audit-summary.md`;
  const summary = generateAuditSummary(auditResults);
  fs.writeFileSync(summaryPath, summary);

  console.log('\\n✅ Visual audit completed!');
  console.log(`📊 Full report: ${reportPath}`);
  console.log(`📋 Summary: ${summaryPath}`);
  
  return auditResults;
}

function generateAuditSummary(results) {
  const summary = [];
  
  summary.push('# Visual Audit Summary');
  summary.push(`Generated: ${new Date().toISOString()}`);
  summary.push('');
  
  Object.entries(results.pages).forEach(([pageName, pageData]) => {
    summary.push(`## ${pageName.toUpperCase()}`);
    summary.push(`URL: ${pageData.url}`);
    summary.push('');
    
    // Console errors
    if (pageData.consoleErrors.length > 0) {
      summary.push('### ❌ Console Errors');
      pageData.consoleErrors.forEach(error => {
        summary.push(`- ${error.message}`);
      });
      summary.push('');
    }
    
    // Network errors
    if (pageData.networkErrors.length > 0) {
      summary.push('### 🌐 Network Errors');
      pageData.networkErrors.forEach(error => {
        summary.push(`- ${error.status} ${error.statusText}: ${error.url}`);
      });
      summary.push('');
    }
    
    // Contrast issues
    if (pageData.contrastIssues.length > 0) {
      summary.push('### 🎨 Contrast Issues');
      summary.push(`Found ${pageData.contrastIssues.length} potential contrast problems`);
      pageData.contrastIssues.slice(0, 5).forEach(issue => {
        summary.push(`- ${issue.element}: ${issue.color} on ${issue.backgroundColor}`);
      });
      summary.push('');
    }
    
    // Accessibility issues
    if (pageData.accessibilityIssues.length > 0) {
      summary.push('### ♿ Accessibility Issues');
      pageData.accessibilityIssues.forEach(issue => {
        summary.push(`- **${issue.impact.toUpperCase()}**: ${issue.description}`);
      });
      summary.push('');
    }
    
    // Plan cards analysis
    if (pageData.planCards && pageData.planCards.length > 0) {
      summary.push('### 💳 Plan Cards Analysis');
      summary.push(`Found ${pageData.planCards.length} plan cards`);
      const consistentStyles = pageData.planCards.every((card, index, arr) => 
        index === 0 || (
          card.backgroundColor === arr[0].backgroundColor &&
          card.borderRadius === arr[0].borderRadius &&
          card.padding === arr[0].padding
        )
      );
      summary.push(`Style consistency: ${consistentStyles ? '✅ Consistent' : '❌ Inconsistent'}`);
      summary.push('');
    }
    
    // Brand color usage
    if (pageData.brandColorUsage) {
      summary.push('### 🏴 Texas Brand Colors');
      Object.entries(pageData.brandColorUsage).forEach(([color, count]) => {
        summary.push(`- ${color}: ${count} usages`);
      });
      summary.push('');
    }
    
    summary.push('---');
    summary.push('');
  });
  
  return summary.join('\\n');
}

// Run the audit
runVisualAudit().catch(console.error);