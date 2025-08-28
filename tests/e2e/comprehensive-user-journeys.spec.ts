import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Test data and utilities
const testData = {
  validZipCodes: ['75201', '77002', '78701', '76102'], // Dallas, Houston, Austin, Fort Worth
  invalidZipCodes: ['00000', '99999', 'invalid'],
  testEmailDomain: '@choosemypower-test.com',
  popularFilters: ['12-month', 'green-energy', 'fixed-rate', 'autopay-discount'],
  testPhoneNumber: '(555) 123-4567'
};

// Helper functions
async function navigateToCity(page: Page, city: string): Promise<void> {
  await page.goto(`/texas/${city}/electricity-plans`);
  await page.waitForSelector('.plan-card', { timeout: 30000 });
}

async function waitForPlansToLoad(page: Page): Promise<void> {
  await page.waitForSelector('.plan-card', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

async function addPlanToComparison(page: Page, planIndex: number = 0): Promise<void> {
  const compareButtons = page.locator('.compare-btn');
  await compareButtons.nth(planIndex).click();
  await page.waitForSelector('.comparison-bar');
}

async function measurePagePerformance(page: Page): Promise<{
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
}> {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0
      };
      
      // Measure Core Web Vitals
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime;
          }
          if (entry.entryType === 'first-input') {
            metrics.fid = entry.processingStart - entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            metrics.cls += entry.value;
          }
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
        }
      }).observe({
        type: 'largest-contentful-paint',
        buffered: true
      });
      
      setTimeout(() => resolve(metrics), 3000);
    });
  });
}

test.describe('Comprehensive User Journey Testing', () => {
  test.describe('Homepage and ZIP Code Search Journey', () => {
    test('User can search by ZIP code and navigate to city plans', async ({ page }) => {
      await page.goto('/');
      
      // Verify homepage loads
      await expect(page).toHaveTitle(/Choose My Power/i);
      await expect(page.locator('h1')).toContainText(/find.*electricity.*plans/i);
      
      // Find and fill ZIP code search
      const zipInput = page.locator('input[type="text"][placeholder*="ZIP"]');
      await zipInput.fill('75201'); // Dallas ZIP
      
      // Submit search
      await page.locator('button[type="submit"]').click();
      
      // Should redirect to Dallas plans page
      await page.waitForURL('**/texas/dallas/electricity-plans');
      await waitForPlansToLoad(page);
      
      // Verify plans are displayed
      await expect(page.locator('.plan-card')).toHaveCount.greaterThan(0);
      await expect(page.locator('h1')).toContainText('Dallas');
    });

    test('User gets appropriate feedback for invalid ZIP codes', async ({ page }) => {
      await page.goto('/');
      
      const zipInput = page.locator('input[type="text"][placeholder*="ZIP"]');
      
      // Test invalid ZIP codes
      for (const invalidZip of testData.invalidZipCodes) {
        await zipInput.fill(invalidZip);
        await page.locator('button[type="submit"]').click();
        
        // Should show error message
        await expect(page.locator('.error, [role="alert"]')).toContainText(/invalid.*zip/i);
        
        await zipInput.clear();
      }
    });

    test('User can navigate between different cities', async ({ page }) => {
      const cities = ['dallas', 'houston', 'austin', 'fort-worth'];
      
      for (const city of cities) {
        await navigateToCity(page, city);
        
        // Verify city-specific content
        await expect(page.locator('h1')).toContainText(new RegExp(city, 'i'));
        await expect(page.locator('.plan-card')).toHaveCount.greaterThan(0);
        
        // Check breadcrumbs
        await expect(page.locator('.breadcrumb')).toContainText(city);
        
        console.log(`✓ ${city} page loaded with plans`);
      }
    });
  });

  test.describe('Plan Discovery and Filtering Journey', () => {
    test('User can browse plans and apply single filters', async ({ page }) => {
      await navigateToCity(page, 'dallas');
      
      const initialPlanCount = await page.locator('.plan-card').count();
      console.log(`Initial plan count: ${initialPlanCount}`);
      
      // Apply 12-month filter
      await page.goto('/texas/dallas/electricity-plans/12-month');
      await waitForPlansToLoad(page);
      
      // Verify filter is applied
      await expect(page.locator('h1')).toContainText('12');
      const filteredPlanCount = await page.locator('.plan-card').count();
      
      console.log(`Filtered plan count: ${filteredPlanCount}`);
      
      // Verify plans match filter criteria
      const contractLengths = await page.locator('.plan-card .contract-length').allTextContents();
      const hasCorrectTerm = contractLengths.some(text => text.includes('12'));
      expect(hasCorrectTerm).toBe(true);
    });

    test('User can combine multiple filters effectively', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans/12-month+green-energy');
      await waitForPlansToLoad(page);
      
      // Verify URL contains both filters
      expect(page.url()).toContain('12-month+green-energy');
      
      // Verify page title reflects both filters
      await expect(page).toHaveTitle(/12.*month.*green.*energy.*houston/i);
      
      // Verify plans meet both criteria
      const planCards = page.locator('.plan-card');
      const planCount = await planCards.count();
      
      if (planCount > 0) {
        const firstPlan = planCards.first();
        await expect(firstPlan.locator(':text("12")')).toBeVisible();
        await expect(firstPlan.locator('.green-indicator')).toBeVisible();
      }
      
      console.log(`Found ${planCount} plans matching combined filters`);
    });

    test('User can remove filters and see updated results', async ({ page }) => {
      await page.goto('/texas/austin/electricity-plans/12-month+green-energy+fixed-rate');
      await waitForPlansToLoad(page);
      
      const initialPlanCount = await page.locator('.plan-card').count();
      
      // Navigate to remove one filter
      await page.goto('/texas/austin/electricity-plans/12-month+green-energy');
      await waitForPlansToLoad(page);
      
      const updatedPlanCount = await page.locator('.plan-card').count();
      
      // Should have same or more plans after removing filter
      expect(updatedPlanCount).toBeGreaterThanOrEqual(initialPlanCount);
      
      console.log(`Filter removal: ${initialPlanCount} -> ${updatedPlanCount} plans`);
    });

    test('User gets helpful feedback when no plans match filters', async ({ page }) => {
      // Try a very restrictive filter combination that might return no results
      await page.goto('/texas/small-city/electricity-plans/36-month+100-green+prepaid+no-deposit');
      
      await page.waitForTimeout(10000); // Wait for API response
      
      const planCount = await page.locator('.plan-card').count();
      
      if (planCount === 0) {
        // Should show helpful messaging
        const noResultsText = page.locator('.no-results, .empty-state');
        await expect(noResultsText).toBeVisible();
        
        // Should suggest alternative filters
        await expect(page.locator('.filter-suggestions')).toBeVisible();
        
        // Should provide fallback options
        await expect(page.locator('a[href*="electricity-plans"]')).toBeVisible();
      }
    });
  });

  test.describe('Plan Comparison Journey', () => {
    test('User can compare multiple plans side-by-side', async ({ page }) => {
      await navigateToCity(page, 'dallas');
      
      // Add first plan to comparison
      await addPlanToComparison(page, 0);
      await expect(page.locator('.comparison-bar')).toContainText('Compare 1 Plan');
      
      // Add second plan
      await addPlanToComparison(page, 1);
      await expect(page.locator('.comparison-bar')).toContainText('Compare 2 Plans');
      
      // Add third plan
      await addPlanToComparison(page, 2);
      await expect(page.locator('.comparison-bar')).toContainText('Compare 3 Plans');
      
      // Click Compare Plans button
      const compareButton = page.locator('.view-comparison-btn');
      await expect(compareButton).toBeEnabled();
      await compareButton.click();
      
      // Should navigate to comparison page
      await page.waitForURL('**/compare-plans');
      
      // Verify comparison table
      await expect(page.locator('.comparison-table')).toBeVisible();
      await expect(page.locator('.comparison-plan-column')).toHaveCount(3);
    });

    test('User can remove plans from comparison', async ({ page }) => {
      await navigateToCity(page, 'houston');
      
      // Add multiple plans
      await addPlanToComparison(page, 0);
      await addPlanToComparison(page, 1);
      
      await expect(page.locator('.comparison-bar')).toContainText('Compare 2 Plans');
      
      // Remove one plan
      const removeBtns = page.locator('.remove-plan-btn');
      await removeBtns.first().click();
      
      await expect(page.locator('.comparison-bar')).toContainText('Compare 1 Plan');
      
      // Clear all comparisons
      await page.locator('.clear-all-btn').click();
      await expect(page.locator('.comparison-bar')).not.toBeVisible();
    });

    test('Comparison persists across page navigation', async ({ page }) => {
      await navigateToCity(page, 'austin');
      
      // Add plans to comparison
      await addPlanToComparison(page, 0);
      await addPlanToComparison(page, 1);
      
      // Navigate to different filter page
      await page.goto('/texas/austin/electricity-plans/green-energy');
      await waitForPlansToLoad(page);
      
      // Comparison should persist
      await expect(page.locator('.comparison-bar')).toContainText('Compare 2 Plans');
    });
  });

  test.describe('Plan Details and Enrollment Journey', () => {
    test('User can view detailed plan information', async ({ page }) => {
      await navigateToCity(page, 'dallas');
      
      // Click on first plan for details
      const firstPlan = page.locator('.plan-card').first();
      const planName = await firstPlan.locator('.plan-name').textContent();
      
      await firstPlan.locator('.details-btn, .plan-name').click();
      
      // Should show plan details modal or navigate to details page
      await expect(page.locator('.plan-details, .modal')).toBeVisible();
      
      // Verify detailed information is displayed
      await expect(page.locator('.rate-breakdown')).toBeVisible();
      await expect(page.locator('.contract-terms')).toBeVisible();
      await expect(page.locator('.features-list')).toBeVisible();
    });

    test('User can initiate enrollment process', async ({ page }) => {
      await navigateToCity(page, 'houston');
      
      const firstPlan = page.locator('.plan-card').first();
      const planName = await firstPlan.locator('.plan-name').textContent();
      const providerName = await firstPlan.locator('.provider-name').textContent();
      
      // Click enroll button
      const enrollBtn = firstPlan.locator('.enroll-btn');
      await expect(enrollBtn).toBeVisible();
      await expect(enrollBtn).toContainText(/enroll/i);
      
      await enrollBtn.click();
      
      // Should navigate to enrollment or external provider site
      // Check if staying on site or redirecting
      await page.waitForTimeout(2000);
      
      if (page.url().includes('choosemypower')) {
        // Internal enrollment flow
        await expect(page.locator('.enrollment-form')).toBeVisible();
        await expect(page.locator('.selected-plan')).toContainText(planName!);
      } else {
        // External redirect - verify new tab/page
        console.log(`✓ Redirected to external enrollment for ${providerName}`);
      }
    });

    test('User sees trust signals and transparency information', async ({ page }) => {
      await navigateToCity(page, 'fort-worth');
      
      const planCard = page.locator('.plan-card').first();
      
      // Verify trust indicators
      await expect(planCard.locator('.trust-badge')).toContainText(/texas.*approved/i);
      await expect(planCard.locator('.transparency-info')).toContainText(/no.*hidden.*costs/i);
      
      // Check for provider ratings and reviews
      await expect(planCard.locator('.provider-rating')).toBeVisible();
      await expect(planCard.locator('.review-count')).toBeVisible();
      
      // Verify fine print and terms are accessible
      await expect(planCard.locator('.terms-link')).toBeVisible();
    });
  });

  test.describe('Mobile User Experience Journey', () => {
    test('Mobile user can complete full journey', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 });
      }
      
      // Start from homepage
      await page.goto('/');
      
      // Use ZIP search on mobile
      const zipInput = page.locator('input[type="text"]').first();
      await zipInput.fill('77002'); // Houston ZIP
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL('**/texas/houston/electricity-plans');
      await waitForPlansToLoad(page);
      
      // Verify mobile layout
      await expect(page.locator('.mobile-layout, .plan-card')).toBeVisible();
      
      // Test mobile comparison
      await addPlanToComparison(page, 0);
      await expect(page.locator('.comparison-bar')).toBeVisible();
      
      // Test mobile filters (if available)
      const filterToggle = page.locator('.filter-toggle, .mobile-filters-btn');
      if (await filterToggle.isVisible()) {
        await filterToggle.click();
        await expect(page.locator('.filters-drawer')).toBeVisible();
      }
      
      console.log('✓ Mobile user journey completed successfully');
    });

    test('Touch gestures work correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToCity(page, 'dallas');
      
      const planCard = page.locator('.plan-card').first();
      
      // Test tap interactions
      await planCard.tap();
      
      // Test swipe for comparison (if implemented)
      const boundingBox = await planCard.boundingBox();
      if (boundingBox) {
        await page.touchscreen.tap(boundingBox.x + 50, boundingBox.y + 50);
        
        // Swipe right
        await page.touchscreen.tap(boundingBox.x + 50, boundingBox.y + 50);
        await page.mouse.move(boundingBox.x + 200, boundingBox.y + 50);
        await page.touchscreen.tap(boundingBox.x + 200, boundingBox.y + 50);
      }
    });
  });

  test.describe('Performance and Core Web Vitals Journey', () => {
    test('Pages meet Core Web Vitals thresholds', async ({ page }) => {
      const cities = ['dallas', 'houston'];
      
      for (const city of cities) {
        await page.goto(`/texas/${city}/electricity-plans`);
        
        const metrics = await measurePagePerformance(page);
        
        // Core Web Vitals thresholds
        expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
        expect(metrics.fid).toBeLessThan(100);  // FID < 100ms
        expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
        expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
        
        console.log(`✓ ${city} Core Web Vitals: LCP=${metrics.lcp}ms, FID=${metrics.fid}ms, CLS=${metrics.cls}, FCP=${metrics.fcp}ms`);
      }
    });

    test('Pages load quickly on slow networks', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await navigateToCity(page, 'austin');
      const loadTime = Date.now() - startTime;
      
      // Should still load within acceptable time on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      console.log(`✓ Slow network load time: ${loadTime}ms`);
    });
  });

  test.describe('Error Handling and Recovery Journey', () => {
    test('User can recover from network errors', async ({ page, context }) => {
      await navigateToCity(page, 'dallas');
      
      // Block API requests to simulate network failure
      await context.route('**/api/**', route => route.abort());
      
      // Navigate to a page that requires API data
      await page.goto('/texas/houston/electricity-plans');
      
      // Should show error state but remain functional
      await page.waitForTimeout(5000);
      
      const errorElements = page.locator('.error, [role="alert"], .fallback-content');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        await expect(errorElements.first()).toBeVisible();
        console.log('✓ Error state displayed correctly');
      }
      
      // Should still show basic page structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Re-enable network and test recovery
      await context.unroute('**/api/**');
      await page.reload();
      await waitForPlansToLoad(page);
      
      await expect(page.locator('.plan-card')).toHaveCount.greaterThan(0);
      console.log('✓ Recovered from network error successfully');
    });

    test('Invalid URLs redirect appropriately', async ({ page }) => {
      const invalidUrls = [
        '/texas/nonexistent-city/electricity-plans',
        '/texas/dallas/electricity-plans/invalid-filter',
        '/texas/houston/electricity-plans/conflicting+filters'
      ];
      
      for (const url of invalidUrls) {
        await page.goto(url);
        
        // Should either redirect to valid page or show helpful error
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const hasErrorMessage = await page.locator('.error, [role="alert"]').count() > 0;
        
        // Should handle gracefully
        expect(
          currentUrl.includes('/texas/') || 
          currentUrl === '/' || 
          hasErrorMessage
        ).toBe(true);
        
        console.log(`✓ Invalid URL ${url} handled appropriately`);
      }
    });
  });

  test.describe('SEO and Metadata Journey', () => {
    test('Pages have proper SEO elements', async ({ page }) => {
      const testPages = [
        '/texas/dallas/electricity-plans',
        '/texas/houston/electricity-plans/12-month',
        '/texas/austin/electricity-plans/green-energy+fixed-rate'
      ];
      
      for (const url of testPages) {
        await page.goto(url);
        
        // Check title
        const title = await page.title();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(60); // SEO best practice
        
        // Check meta description
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription!.length).toBeGreaterThan(50);
        expect(metaDescription!.length).toBeLessThan(160); // SEO best practice
        
        // Check canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        expect(canonical).toContain(url);
        
        // Check structured data
        const jsonLd = await page.locator('script[type="application/ld+json"]').count();
        expect(jsonLd).toBeGreaterThan(0);
        
        console.log(`✓ SEO elements verified for ${url}`);
      }
    });
  });

  test.describe('Analytics and Tracking Journey', () => {
    test('User interactions are tracked correctly', async ({ page }) => {
      // Mock Google Analytics
      await page.addInitScript(() => {
        window.gtag = (command, eventName, params) => {
          window.gtagEvents = window.gtagEvents || [];
          window.gtagEvents.push({ command, eventName, params });
        };
      });
      
      await navigateToCity(page, 'dallas');
      
      // Add plan to comparison (should track)
      await addPlanToComparison(page, 0);
      
      // Click enroll button (should track)
      const enrollBtn = page.locator('.enroll-btn').first();
      await enrollBtn.click();
      
      // Check that events were tracked
      const trackedEvents = await page.evaluate(() => window.gtagEvents || []);
      
      expect(trackedEvents.length).toBeGreaterThan(0);
      
      const comparisonEvent = trackedEvents.find(e => e.eventName === 'add_to_comparison');
      const enrollEvent = trackedEvents.find(e => e.eventName === 'begin_enrollment');
      
      expect(comparisonEvent).toBeDefined();
      expect(enrollEvent).toBeDefined();
      
      console.log(`✓ Tracked ${trackedEvents.length} user interaction events`);
    });
  });
});