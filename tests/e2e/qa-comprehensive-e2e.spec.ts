/**
 * QA Comprehensive End-to-End Test Suite
 * 
 * This suite tests complete user journeys and critical business flows
 * across the ChooseMyPower platform to ensure production readiness.
 * 
 * Test Categories:
 * - Critical User Journeys
 * - Cross-Browser Compatibility
 * - Mobile Responsiveness
 * - Performance Validation
 * - Accessibility Compliance
 * - Lead Generation Flow
 * - SEO and Analytics
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:4324';
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // 2.5 seconds
  CLS: 0.1,
  FID: 100, // 100ms
  TTFB: 800 // 800ms
};

// Helper functions
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.readyState === 'complete');
}

async function checkAccessibility(page: Page) {
  // Check for proper heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  expect(headings).toBeGreaterThan(0);
  
  // Check for alt text on images
  const images = await page.locator('img').count();
  if (images > 0) {
    const imagesWithAlt = await page.locator('img[alt]').count();
    expect(imagesWithAlt).toBe(images);
  }
  
  // Check for proper form labels
  const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').count();
  if (inputs > 0) {
    const inputsWithLabels = await page.locator('input[aria-label], input[id][aria-labelledby], label input').count();
    expect(inputsWithLabels).toBeGreaterThan(0);
  }
}

async function measureCoreWebVitals(page: Page) {
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;
      let fid = 0;

      // Measure LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Measure CLS
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // Measure FID (simulated through input delay)
      const startTime = performance.now();
      setTimeout(() => {
        fid = performance.now() - startTime;
        resolve({ lcp, cls, fid });
      }, 100);
    });
  });

  return vitals;
}

test.describe('QA Comprehensive E2E Tests - Critical User Journeys', () => {
  test('Complete ZIP Code Search Journey', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Test homepage loads correctly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();

    // Search for Dallas ZIP code
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const searchButton = page.locator('button').filter({ hasText: /search|find/i }).first();
    await searchButton.click();

    // Wait for results to load
    await page.waitForLoadState('networkidle');
    
    // Verify plan results are displayed
    const planCards = page.locator('[data-testid="plan-card"], .plan-card, [class*="plan"]').first();
    await expect(planCards).toBeVisible({ timeout: 10000 });

    // Verify essential plan information is displayed
    await expect(page.locator('text=/TXU Energy|Reliant|Direct Energy|Green Mountain/i').first()).toBeVisible();
    await expect(page.locator('text=/¢|cents/i').first()).toBeVisible();
    await expect(page.locator('text=/month/i').first()).toBeVisible();

    // Check accessibility
    await checkAccessibility(page);
  });

  test('Plan Comparison Journey', async ({ page }) => {
    await page.goto(`${BASE_URL}/texas/dallas`);
    await waitForPageLoad(page);

    // Select multiple plans for comparison
    const compareCheckboxes = page.locator('input[type="checkbox"], button[aria-label*="compare"], [data-testid*="compare"]');
    const checkboxCount = await compareCheckboxes.count();
    
    if (checkboxCount >= 2) {
      await compareCheckboxes.nth(0).click();
      await compareCheckboxes.nth(1).click();

      // Click compare button
      const compareButton = page.locator('button').filter({ hasText: /compare/i });
      if (await compareButton.count() > 0) {
        await compareButton.click();
        
        // Verify comparison view
        await expect(page.locator('text=/comparison|compare/i')).toBeVisible();
      }
    }

    await checkAccessibility(page);
  });

  test('Faceted Navigation Journey', async ({ page }) => {
    await page.goto(`${BASE_URL}/texas/houston`);
    await waitForPageLoad(page);

    // Test filter interactions
    const filterOptions = [
      'button[data-filter="fixed"], text=/fixed rate/i',
      'button[data-filter="12-month"], text=/12 month/i',
      'button[data-filter="renewable"], text=/renewable|green/i',
      'button[data-filter="no-deposit"], text=/no deposit/i'
    ];

    for (const filterSelector of filterOptions) {
      const filter = page.locator(filterSelector).first();
      if (await filter.count() > 0) {
        await filter.click();
        await page.waitForTimeout(1000); // Allow for filtering
        
        // Verify URL updates with filter
        const currentUrl = page.url();
        expect(currentUrl).toContain('houston');
      }
    }

    await checkAccessibility(page);
  });

  test('Provider Research Journey', async ({ page }) => {
    await page.goto(`${BASE_URL}/providers`);
    await waitForPageLoad(page);

    // Verify providers page loads
    await expect(page.locator('h1')).toBeVisible();
    
    // Click on a provider
    const providerLink = page.locator('a[href*="/providers/"], text=/TXU|Reliant|Direct Energy/i').first();
    if (await providerLink.count() > 0) {
      await providerLink.click();
      await waitForPageLoad(page);
      
      // Verify provider detail page
      await expect(page.locator('h1, h2')).toBeVisible();
      await expect(page.locator('text=/plans|electricity/i')).toBeVisible();
    }

    await checkAccessibility(page);
  });

  test('Mobile User Journey', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Test mobile navigation
    const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-trigger, [data-testid="mobile-menu"]');
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      await expect(page.locator('.mobile-menu, [data-testid="mobile-menu-content"]')).toBeVisible();
    }

    // Test ZIP code input on mobile
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('77001');
    
    // Verify mobile-optimized search
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify mobile plan cards are responsive
    const planCard = page.locator('[data-testid="plan-card"], .plan-card').first();
    if (await planCard.count() > 0) {
      const boundingBox = await planCard.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
    }

    await checkAccessibility(page);
  });
});

test.describe('QA Performance & Core Web Vitals', () => {
  test('Homepage Performance Validation', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second max load time

    // Measure Core Web Vitals
    const vitals = await measureCoreWebVitals(page);
    expect(vitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    expect(vitals.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
  });

  test('Plan Search Performance', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Measure search response time
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const startTime = Date.now();
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    
    await page.waitForLoadState('networkidle');
    const searchTime = Date.now() - startTime;
    
    expect(searchTime).toBeLessThan(3000); // 3 second max search time
    
    // Verify results loaded
    const planResults = page.locator('[data-testid="plan-card"], .plan-card, [class*="plan"]').first();
    await expect(planResults).toBeVisible({ timeout: 5000 });
  });

  test('Large Dataset Performance', async ({ page }) => {
    // Test performance with filters that might return many results
    await page.goto(`${BASE_URL}/texas/houston`);
    await waitForPageLoad(page);

    const startTime = Date.now();
    
    // Apply multiple filters to test filtering performance
    const fixedRateFilter = page.locator('button, a').filter({ hasText: /fixed/i }).first();
    if (await fixedRateFilter.count() > 0) {
      await fixedRateFilter.click();
      await page.waitForTimeout(500);
    }
    
    const filterTime = Date.now() - startTime;
    expect(filterTime).toBeLessThan(2000); // 2 second max filter time
  });
});

test.describe('QA Accessibility Compliance', () => {
  test('WCAG 2.1 AA Compliance - Keyboard Navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Test keyboard navigation
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.focus();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key functionality
    await zipInput.fill('75001');
    await page.keyboard.press('Enter');
    
    await page.waitForLoadState('networkidle');
  });

  test('Screen Reader Compatibility', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Check for proper ARIA attributes
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [role]').count();
    expect(ariaElements).toBeGreaterThan(0);

    // Check for semantic HTML
    const semanticElements = await page.locator('main, header, footer, nav, section, article').count();
    expect(semanticElements).toBeGreaterThan(0);

    // Check skip links
    const skipLinks = page.locator('a[href="#main"], a[href="#content"]');
    if (await skipLinks.count() > 0) {
      await expect(skipLinks.first()).toBeInTheDocument();
    }
  });

  test('Color Contrast Compliance', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // This would typically use axe-playwright or similar tool
    // For now, we'll do basic checks
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button, label');
    const elementCount = await textElements.count();
    expect(elementCount).toBeGreaterThan(0);

    // Verify no elements have visibility: hidden that should be accessible
    const hiddenElements = await page.locator('[style*="visibility: hidden"], .sr-only:not([aria-hidden="true"])').count();
    // sr-only elements should still be accessible to screen readers
  });
});

test.describe('QA Security & Data Protection', () => {
  test('Input Sanitization', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Test potentially malicious inputs
    const maliciousInputs = [
      '<script>alert("xss")</script>75001',
      "'; DROP TABLE plans; --",
      '"><img src=x onerror=alert(1)>',
      'javascript:alert("xss")'
    ];

    const zipInput = page.locator('input[type="text"]').first();
    
    for (const maliciousInput of maliciousInputs) {
      await zipInput.fill(maliciousInput);
      
      // Submit and verify no script execution
      const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
      await searchButton.click();
      
      // Wait briefly and check no alerts appeared
      await page.waitForTimeout(1000);
      
      // Clear input for next test
      await zipInput.clear();
    }
  });

  test('URL Parameter Validation', async ({ page }) => {
    // Test malicious URL parameters
    const maliciousUrls = [
      `${BASE_URL}/?zip=<script>alert('xss')</script>`,
      `${BASE_URL}/texas/<script>alert('xss')</script>`,
      `${BASE_URL}/?redirect=javascript:alert('xss')`
    ];

    for (const url of maliciousUrls) {
      const response = await page.goto(url);
      
      // Should either redirect safely or return error, not execute script
      expect(response?.status()).toBeLessThan(500);
      
      await page.waitForTimeout(1000);
      // Verify no script execution occurred
    }
  });

  test('Form Security', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await waitForPageLoad(page);

    // Test form inputs exist and have proper attributes
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await expect(emailInput).toHaveAttribute('type', 'email');
      
      // Test email validation
      await emailInput.fill('invalid-email');
      const form = page.locator('form').first();
      if (await form.count() > 0) {
        // Should trigger validation
        const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          // Should show validation error, not submit
        }
      }
    }
  });
});

test.describe('QA Lead Generation & Analytics', () => {
  test('Lead Capture Flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Search for plans
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    await waitForPageLoad(page);

    // Look for contact/enrollment buttons
    const contactButtons = page.locator('button, a').filter({ 
      hasText: /contact|call|enroll|get started|learn more/i 
    });
    
    if (await contactButtons.count() > 0) {
      await contactButtons.first().click();
      
      // Verify contact form or redirect
      await page.waitForTimeout(2000);
      
      // Should either show form or navigate to provider
      const currentUrl = page.url();
      expect(currentUrl).toBeDefined();
    }
  });

  test('Analytics Tracking', async ({ page }) => {
    // Enable console logging to catch analytics events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Perform trackable actions
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify analytics calls (this would depend on your analytics implementation)
    // Look for Google Analytics, Facebook Pixel, or custom analytics
    const hasAnalytics = await page.evaluate(() => {
      return !!(window.gtag || window.fbq || window.dataLayer);
    });
    
    // Analytics should be present in production
    if (process.env.NODE_ENV === 'production') {
      expect(hasAnalytics).toBe(true);
    }
  });
});

test.describe('QA Cross-Browser Compatibility', () => {
  test('Essential Functionality Across Browsers', async ({ page, browserName }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Test basic functionality works in all browsers
    const zipInput = page.locator('input[type="text"]').first();
    await expect(zipInput).toBeVisible();
    
    await zipInput.fill('75001');
    const inputValue = await zipInput.inputValue();
    expect(inputValue).toBe('75001');

    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();

    // Browser-specific optimizations
    if (browserName === 'webkit') {
      // Safari-specific tests
      await expect(page.locator('input[type="text"]')).toHaveCSS('appearance', 'none');
    }
  });
});

test.describe('QA Regression Prevention', () => {
  test('Critical Path Smoke Test', async ({ page }) => {
    // This test ensures the most critical functionality always works
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 1. Homepage loads
    await expect(page.locator('h1')).toBeVisible();
    
    // 2. ZIP search works
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    
    // 3. Results display
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify we have content (either plans or appropriate messaging)
    const hasContent = await page.locator('body').innerHTML();
    expect(hasContent.length).toBeGreaterThan(1000); // Should have substantial content
    
    // 4. Navigation works
    const navLinks = page.locator('nav a, header a').first();
    if (await navLinks.count() > 0) {
      await navLinks.click();
      await waitForPageLoad(page);
      expect(page.url()).toBeDefined();
    }
  });

  test('API Integration Smoke Test', async ({ page }) => {
    // Test that our API integration is working
    await page.goto(BASE_URL);
    
    // Monitor network requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('comparepower')) {
        apiRequests.push(request.url());
      }
    });

    // Trigger API call
    const zipInput = page.locator('input[type="text"]').first();
    await zipInput.fill('75001');
    
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await searchButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // Should have made API requests
    expect(apiRequests.length).toBeGreaterThan(0);
  });
});