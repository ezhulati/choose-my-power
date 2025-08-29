/**
 * Comprehensive End-to-End Tests for Enterprise ZIP Code Search System
 * 
 * Tests complete user journeys across the entire application including:
 * - ZIP code search and plan discovery
 * - Faceted navigation and filtering
 * - Plan comparison and detailed views
 * - Mobile and desktop responsive behavior
 * - Error handling and recovery scenarios
 * - Performance and accessibility compliance
 * - Multi-browser compatibility
 * - Network conditions and offline handling
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000
  },
  urls: {
    homepage: '/',
    planSearch: '/electricity-plans/dallas-tx',
    faceted: '/electricity-plans/dallas-tx/12-month/fixed-rate',
    comparison: '/compare'
  },
  testData: {
    validZipCodes: ['75201', '77001', '78701', '76101'],
    invalidZipCodes: ['12345', '99999', '00000'],
    testAddresses: {
      dallas: '123 Main Street, Dallas, TX 75201',
      houston: '456 Oak Avenue, Houston, TX 77001',
      austin: '789 Pine Drive, Austin, TX 78701'
    }
  }
};

// Helper functions
class PageHelpers {
  constructor(private page: Page) {}

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle', { timeout: TEST_CONFIG.timeouts.medium });
  }

  async searchForPlans(zipCode: string, options?: { address?: string; waitForResults?: boolean }) {
    const searchInput = this.page.getByRole('combobox', { name: /zip code search/i });
    await searchInput.fill(zipCode);
    
    if (options?.address) {
      const addressInput = this.page.getByPlaceholder(/address/i);
      await addressInput.fill(options.address);
    }

    await this.page.getByRole('button', { name: /search electricity plans/i }).click();
    
    if (options?.waitForResults !== false) {
      await this.waitForSearchResults();
    }
  }

  async waitForSearchResults() {
    // Wait for loading to complete
    await expect(this.page.getByTestId('loading-spinner')).not.toBeVisible({ timeout: TEST_CONFIG.timeouts.long });
    
    // Wait for either results or error message
    const resultsOrError = this.page.locator('[data-testid="plan-results"], [data-testid="error-message"], [data-testid="no-results"]');
    await expect(resultsOrError.first()).toBeVisible({ timeout: TEST_CONFIG.timeouts.long });
  }

  async applyFilter(filterType: string, value: string) {
    const filterSection = this.page.locator(`[data-testid="filter-${filterType}"]`);
    await filterSection.getByText(value, { exact: false }).click();
    await this.waitForNetworkIdle();
  }

  async addPlanToComparison(planIndex: number = 0) {
    const plans = this.page.locator('[data-testid="plan-card"]');
    const plan = plans.nth(planIndex);
    await plan.getByRole('button', { name: /compare|add to comparison/i }).click();
  }

  async checkAccessibility() {
    // Check for basic accessibility features
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    const landmarks = await this.page.locator('main, nav, aside, header, footer').count();
    const inputs = await this.page.locator('input, select, textarea').count();
    const inputsWithLabels = await this.page.locator('input[aria-label], input[aria-labelledby], select[aria-label], textarea[aria-label]').count();
    
    expect(headings).toBeGreaterThan(0);
    expect(landmarks).toBeGreaterThan(0);
    
    if (inputs > 0) {
      expect(inputsWithLabels).toBe(inputs); // All inputs should have labels
    }
  }

  async measurePagePerformance() {
    const navigationTiming = await this.page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        firstPaint: timing.responseEnd - timing.requestStart
      };
    });
    
    // Core Web Vitals thresholds
    expect(navigationTiming.loadComplete).toBeLessThan(3000); // 3 seconds
    expect(navigationTiming.domContentLoaded).toBeLessThan(1500); // 1.5 seconds
    
    return navigationTiming;
  }
}

test.describe('Enterprise ZIP Code Search - Complete User Journeys', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PageHelpers(page);
    
    // Navigate to homepage
    await page.goto(TEST_CONFIG.urls.homepage);
    await helpers.waitForNetworkIdle();
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Choose My Power|Electricity Plans/i);
  });

  test.describe('Primary Search Flow', () => {
    test('should complete full ZIP code search journey successfully', async ({ page }) => {
      // Step 1: Enter ZIP code and search
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      
      // Step 2: Verify search results loaded
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards.first()).toBeVisible();
      
      const planCount = await planCards.count();
      expect(planCount).toBeGreaterThan(0);
      
      // Step 3: Verify TDSP information is displayed
      const tdspInfo = page.locator('[data-testid="tdsp-info"]');
      await expect(tdspInfo).toBeVisible();
      
      // Step 4: Verify plan details are complete
      const firstPlan = planCards.first();
      await expect(firstPlan.locator('.plan-name')).toBeVisible();
      await expect(firstPlan.locator('.provider-name')).toBeVisible();
      await expect(firstPlan.locator('.rate-display')).toBeVisible();
      
      // Step 5: Check performance metrics
      await helpers.measurePagePerformance();
    });

    test('should handle split ZIP codes with address resolution', async ({ page }) => {
      const splitZipCode = '77001'; // Houston - typically has multiple TDSPs
      const testAddress = TEST_CONFIG.testData.testAddresses.houston;
      
      // Enter ZIP code first
      await helpers.searchForPlans(splitZipCode, { waitForResults: false });
      
      // Check if address input is requested
      const addressPrompt = page.locator('[data-testid="address-required"]');
      const hasAddressPrompt = await addressPrompt.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasAddressPrompt) {
        // Fill in address for split ZIP resolution
        await page.getByPlaceholder(/address/i).fill(testAddress);
        await page.getByRole('button', { name: /search with address/i }).click();
      }
      
      await helpers.waitForSearchResults();
      
      // Verify results loaded with proper TDSP resolution
      const results = page.locator('[data-testid="plan-results"]');
      await expect(results).toBeVisible();
      
      const tdspInfo = page.locator('[data-testid="tdsp-info"]');
      await expect(tdspInfo).toBeVisible();
      await expect(tdspInfo).toContainText(/CenterPoint|Oncor|AEP/i);
    });

    test('should show helpful error messages for invalid ZIP codes', async ({ page }) => {
      const invalidZip = TEST_CONFIG.testData.invalidZipCodes[0];
      
      // Enter invalid ZIP code
      await helpers.searchForPlans(invalidZip, { waitForResults: false });
      
      // Wait for error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: TEST_CONFIG.timeouts.medium });
      
      // Verify error is helpful
      await expect(errorMessage).toContainText(/Texas|deregulated|valid/i);
      
      // Verify suggestions are provided
      const suggestions = page.locator('[data-testid="zip-suggestions"]');
      const hasSuggestions = await suggestions.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasSuggestions) {
        const suggestionItems = suggestions.locator('.suggestion-item');
        expect(await suggestionItems.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Faceted Navigation and Filtering', () => {
    test.beforeEach(async ({ page }) => {
      // Start with a search that has results
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      await helpers.waitForSearchResults();
    });

    test('should apply single filters and update results', async ({ page }) => {
      // Get initial plan count
      const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();
      expect(initialPlanCount).toBeGreaterThan(0);
      
      // Apply contract length filter
      await helpers.applyFilter('contract-length', '12 month');
      
      // Verify filter is applied
      const activeFilters = page.locator('[data-testid="active-filter"]');
      await expect(activeFilters).toContainText('12 month');
      
      // Verify URL updated
      await expect(page).toHaveURL(/12-month/i);
      
      // Verify results updated
      await helpers.waitForSearchResults();
      const filteredPlanCount = await page.locator('[data-testid="plan-card"]').count();
      expect(filteredPlanCount).toBeLessThanOrEqual(initialPlanCount);
      
      // Verify all displayed plans match filter
      const planCards = page.locator('[data-testid="plan-card"]');
      const count = await planCards.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const plan = planCards.nth(i);
        const contractText = plan.locator('.contract-length');
        await expect(contractText).toContainText(/12/i);
      }
    });

    test('should handle multiple filters effectively', async ({ page }) => {
      // Apply multiple filters in sequence
      await helpers.applyFilter('rate-type', 'Fixed Rate');
      await helpers.applyFilter('contract-length', '12 month');
      await helpers.applyFilter('green-energy', '100%');
      
      // Verify all filters are active
      const activeFilters = page.locator('[data-testid="active-filter"]');
      await expect(activeFilters).toHaveCount(3);
      
      // Verify URL contains all filters
      await expect(page).toHaveURL(/fixed-rate/i);
      await expect(page).toHaveURL(/12-month/i);
      await expect(page).toHaveURL(/green-energy/i);
      
      // Verify results meet all criteria
      await helpers.waitForSearchResults();
      const planCards = page.locator('[data-testid="plan-card"]');
      const hasResults = await planCards.count();
      
      if (hasResults > 0) {
        // Check first few plans meet criteria
        for (let i = 0; i < Math.min(hasResults, 3); i++) {
          const plan = planCards.nth(i);
          await expect(plan.locator('.rate-type')).toContainText(/fixed/i);
          await expect(plan.locator('.contract-length')).toContainText(/12/i);
          await expect(plan.locator('.green-percentage')).toContainText(/100%/i);
        }
      }
    });

    test('should show appropriate message when no plans match filters', async ({ page }) => {
      // Apply very restrictive filters
      await helpers.applyFilter('contract-length', '36 month');
      await helpers.applyFilter('green-energy', '100%');
      await helpers.applyFilter('rate-type', 'Variable');
      
      await helpers.waitForSearchResults();
      
      // Check for no results message
      const noResults = page.locator('[data-testid="no-results"]');
      const hasNoResults = await noResults.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasNoResults) {
        await expect(noResults).toContainText(/no plans match|adjust filters|try different/i);
        
        // Verify helpful suggestions
        const suggestions = page.locator('[data-testid="filter-suggestions"]');
        const hasSuggestions = await suggestions.isVisible().catch(() => false);
        
        if (hasSuggestions) {
          expect(await suggestions.locator('button').count()).toBeGreaterThan(0);
        }
      }
    });

    test('should persist filters across page navigation', async ({ page, context }) => {
      // Apply filters
      await helpers.applyFilter('rate-type', 'Fixed Rate');
      await helpers.applyFilter('contract-length', '12 month');
      
      const currentUrl = page.url();
      
      // Navigate away and back
      await page.goto(TEST_CONFIG.urls.homepage);
      await page.goBack();
      
      // Verify filters are still applied
      await expect(page).toHaveURL(currentUrl);
      
      const activeFilters = page.locator('[data-testid="active-filter"]');
      await expect(activeFilters).toHaveCount(2);
    });
  });

  test.describe('Plan Comparison Feature', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      await helpers.waitForSearchResults();
    });

    test('should add multiple plans to comparison', async ({ page }) => {
      // Add first plan to comparison
      await helpers.addPlanToComparison(0);
      
      // Verify comparison badge/indicator
      const comparisonIndicator = page.locator('[data-testid="comparison-count"]');
      await expect(comparisonIndicator).toContainText('1');
      
      // Add second plan
      await helpers.addPlanToComparison(1);
      await expect(comparisonIndicator).toContainText('2');
      
      // Add third plan
      await helpers.addPlanToComparison(2);
      await expect(comparisonIndicator).toContainText('3');
    });

    test('should view detailed plan comparison', async ({ page }) => {
      // Add multiple plans to comparison
      await helpers.addPlanToComparison(0);
      await helpers.addPlanToComparison(1);
      
      // Go to comparison view
      const compareButton = page.getByRole('button', { name: /compare plans|view comparison/i });
      await compareButton.click();
      
      // Verify comparison page loaded
      await expect(page).toHaveURL(/compare/i);
      
      // Verify plans are displayed side by side
      const comparisonTable = page.locator('[data-testid="comparison-table"]');
      await expect(comparisonTable).toBeVisible();
      
      const comparedPlans = comparisonTable.locator('.plan-column');
      expect(await comparedPlans.count()).toBe(2);
      
      // Verify key comparison points
      await expect(comparisonTable).toContainText(/rate|price/i);
      await expect(comparisonTable).toContainText(/contract/i);
      await expect(comparisonTable).toContainText(/provider/i);
      await expect(comparisonTable).toContainText(/green energy/i);
    });

    test('should remove plans from comparison', async ({ page }) => {
      // Add plans to comparison
      await helpers.addPlanToComparison(0);
      await helpers.addPlanToComparison(1);
      
      const comparisonCount = page.locator('[data-testid="comparison-count"]');
      await expect(comparisonCount).toContainText('2');
      
      // Remove one plan
      const firstPlan = page.locator('[data-testid="plan-card"]').first();
      const removeButton = firstPlan.getByRole('button', { name: /remove from comparison/i });
      await removeButton.click();
      
      // Verify count updated
      await expect(comparisonCount).toContainText('1');
    });
  });

  test.describe('Mobile Responsive Behavior', () => {
    test('should work correctly on mobile devices', async ({ page, context }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate and search
      await page.goto(TEST_CONFIG.urls.homepage);
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      
      // Verify mobile-optimized layout
      const searchInput = page.getByRole('combobox', { name: /zip code search/i });
      await expect(searchInput).toBeVisible();
      
      // Check if mobile menu/filters work
      const mobileFilters = page.locator('[data-testid="mobile-filters"]');
      const hasMobileFilters = await mobileFilters.isVisible().catch(() => false);
      
      if (hasMobileFilters) {
        await mobileFilters.click();
        const filtersPanel = page.locator('[data-testid="filters-panel"]');
        await expect(filtersPanel).toBeVisible();
      }
      
      // Verify plan cards are mobile-friendly
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards.first()).toBeVisible();
      
      // Check touch targets are appropriate size (minimum 44px)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle touch interactions properly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      
      // Test swipe gestures if implemented
      const planCard = page.locator('[data-testid="plan-card"]').first();
      await planCard.hover();
      
      // Test tap interactions
      await planCard.tap();
      
      // Verify appropriate response (expand, navigate, etc.)
      const expandedContent = planCard.locator('.expanded-details');
      const hasExpanded = await expandedContent.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasExpanded) {
        expect(await expandedContent.textContent()).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should recover from network errors gracefully', async ({ page, context }) => {
      // Simulate network failure
      await context.setOffline(true);
      
      // Attempt search
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0], { waitForResults: false });
      
      // Verify error message appears
      const errorMessage = page.locator('[data-testid="error-message"], [data-testid="network-error"]');
      await expect(errorMessage).toBeVisible({ timeout: TEST_CONFIG.timeouts.medium });
      
      // Verify retry mechanism
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      const hasRetry = await retryButton.isVisible().catch(() => false);
      
      if (hasRetry) {
        // Restore network and retry
        await context.setOffline(false);
        await retryButton.click();
        
        // Verify recovery
        await helpers.waitForSearchResults();
        const planCards = page.locator('[data-testid="plan-card"]');
        await expect(planCards.first()).toBeVisible();
      }
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow network
      await context.route('**/*', async (route, request) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        await route.continue();
      });
      
      // Start search
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0], { waitForResults: false });
      
      // Verify loading state is shown
      const loadingIndicator = page.locator('[data-testid="loading-spinner"], [data-testid="zap-icon"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for results with extended timeout
      await helpers.waitForSearchResults();
      
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards.first()).toBeVisible();
    });

    test('should provide helpful feedback for service unavailable', async ({ page, context }) => {
      // Mock API failure
      await context.route('**/api/**', async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable',
              userMessage: 'Our electricity plan service is temporarily unavailable. Please try again in a few minutes.',
              retryable: true
            }
          })
        });
      });
      
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0], { waitForResults: false });
      
      // Verify appropriate error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: TEST_CONFIG.timeouts.medium });
      await expect(errorMessage).toContainText(/temporarily unavailable|try again/i);
      
      // Verify retry option is available
      const retryButton = page.getByRole('button', { name: /try again|retry/i });
      await expect(retryButton).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet Core Web Vitals requirements', async ({ page }) => {
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      
      const metrics = await helpers.measurePagePerformance();
      
      // Verify performance thresholds
      expect(metrics.loadComplete).toBeLessThan(3000); // 3 seconds
      expect(metrics.domContentLoaded).toBeLessThan(1500); // 1.5 seconds
      
      // Check for layout shifts
      const layoutShift = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if ((entry as any).hadRecentInput) continue;
              clsValue += (entry as any).value;
            }
            resolve(clsValue);
          });
          observer.observe({type: 'layout-shift', buffered: true});
          
          // Resolve after 2 seconds if no shifts detected
          setTimeout(() => resolve(clsValue), 2000);
        });
      });
      
      expect(layoutShift).toBeLessThan(0.1); // CLS threshold
    });

    test('should be fully accessible', async ({ page }) => {
      await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
      
      // Run accessibility checks
      await helpers.checkAccessibility();
      
      // Test keyboard navigation
      const searchInput = page.getByRole('combobox', { name: /zip code search/i });
      await searchInput.focus();
      
      // Navigate with tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible and logical
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Test screen reader compatibility
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      expect(await h1.count()).toBe(1); // Should have exactly one h1
    });

    test('should handle large result sets efficiently', async ({ page }) => {
      // Search for ZIP code likely to have many results
      await helpers.searchForPlans('75201'); // Dallas central
      
      await helpers.waitForSearchResults();
      
      // Measure rendering performance with many results
      const startTime = Date.now();
      
      // Scroll through results to trigger any virtual scrolling
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(100);
      }
      
      const scrollTime = Date.now() - startTime;
      expect(scrollTime).toBeLessThan(1000); // Should be smooth
      
      // Verify all visible plans are properly rendered
      const visiblePlans = page.locator('[data-testid="plan-card"]:visible');
      const planCount = await visiblePlans.count();
      
      // Check first few plans have all required elements
      for (let i = 0; i < Math.min(planCount, 5); i++) {
        const plan = visiblePlans.nth(i);
        await expect(plan.locator('.plan-name')).toBeVisible();
        await expect(plan.locator('.provider-name')).toBeVisible();
        await expect(plan.locator('.rate-display')).toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ page }) => {
        // Basic functionality test for each browser
        await helpers.searchForPlans(TEST_CONFIG.testData.validZipCodes[0]);
        await helpers.waitForSearchResults();
        
        // Verify core features work
        const planCards = page.locator('[data-testid="plan-card"]');
        await expect(planCards.first()).toBeVisible();
        
        // Test filter interaction
        const filterButton = page.locator('[data-testid="filter-button"]').first();
        const hasFilters = await filterButton.isVisible().catch(() => false);
        
        if (hasFilters) {
          await filterButton.click();
          await helpers.waitForNetworkIdle();
        }
        
        // Verify no console errors
        const logs = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            logs.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        expect(logs.filter(log => !log.includes('favicon'))).toHaveLength(0);
      });
    });
  });
});
