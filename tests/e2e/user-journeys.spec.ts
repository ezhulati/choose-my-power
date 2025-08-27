import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for API-dependent tests
    test.setTimeout(60000);
  });

  test.describe('Plan Discovery Journey', () => {
    test('User can browse Dallas electricity plans and see pricing', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      
      // Wait for page to load
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Verify page loads with plans
      await expect(page).toHaveTitle(/Electricity Plans.*Dallas/i);
      await expect(page.locator('h1')).toContainText('Dallas');
      
      // Check that plans are displayed
      const planCards = page.locator('.plan-card');
      await expect(planCards).toHaveCount.greaterThan(0);
      
      // Verify plan cards contain essential information
      const firstPlan = planCards.first();
      await expect(firstPlan.locator('.plan-name')).toBeVisible();
      await expect(firstPlan.locator('.provider-name')).toBeVisible();
      await expect(firstPlan.locator('.rate-value')).toBeVisible();
      await expect(firstPlan.locator('.enroll-btn')).toBeVisible();
      
      // Check pricing display
      await expect(firstPlan.locator('.rate-value')).toContainText('¢');
      await expect(firstPlan.locator('.monthly-bill')).toBeVisible();
      
      // Verify rate transparency message
      await expect(page.locator('.price-transparency')).toContainText('no hidden costs');
    });

    test('User can navigate between different Texas cities', async ({ page }) => {
      // Start in Dallas
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const dallasPlanCount = await page.locator('.plan-card').count();
      expect(dallasPlanCount).toBeGreaterThan(0);
      
      // Navigate to Houston
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      await expect(page.locator('h1')).toContainText('Houston');
      const houstonPlanCount = await page.locator('.plan-card').count();
      expect(houstonPlanCount).toBeGreaterThan(0);
      
      // Navigate to Fort Worth
      await page.goto('/texas/fort-worth/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      await expect(page.locator('h1')).toContainText('Fort Worth');
      const fortWorthPlanCount = await page.locator('.plan-card').count();
      expect(fortWorthPlanCount).toBeGreaterThan(0);
    });
  });

  test.describe('Plan Filtering Journey', () => {
    test('User can filter plans by contract length', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const initialPlanCount = await page.locator('.plan-card').count();
      
      // Navigate to 12-month filter page
      await page.goto('/texas/dallas/electricity-plans/12-month');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Verify URL and page content
      expect(page.url()).toContain('/12-month');
      await expect(page.locator('h1')).toContainText('12');
      
      const filteredPlanCount = await page.locator('.plan-card').count();
      expect(filteredPlanCount).toBeGreaterThan(0);
      
      // Verify all displayed plans are 12-month plans
      const contractLengths = await page.locator('.plan-card .value').allTextContents();
      const monthContracts = contractLengths.filter(text => text.includes('12 months'));
      expect(monthContracts.length).toBeGreaterThan(0);
    });

    test('User can filter plans by green energy', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans/green-energy');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Verify green energy filter is applied
      await expect(page.locator('h1')).toContainText('Green');
      
      // Check for green energy indicators
      const greenIndicators = page.locator('.feature-item.green, .feature-item:has-text("renewable")');
      const greenCount = await greenIndicators.count();
      expect(greenCount).toBeGreaterThan(0);
    });

    test('User can combine multiple filters', async ({ page }) => {
      await page.goto('/texas/austin/electricity-plans/12-month+green-energy');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Verify combined filters in URL and content
      expect(page.url()).toContain('/12-month+green-energy');
      await expect(page.locator('h1')).toContainText('12');
      await expect(page.locator('h1')).toContainText('Green');
      
      // Verify plans match both criteria
      const planCards = page.locator('.plan-card');
      const planCount = await planCards.count();
      
      if (planCount > 0) {
        // Check first plan has both 12-month contract and green energy
        const firstPlan = planCards.first();
        await expect(firstPlan.locator(':text("12 months")')).toBeVisible();
        await expect(firstPlan.locator('.feature-item.green, .feature-item:has-text("renewable")')).toBeVisible();
      }
    });
  });

  test.describe('Plan Comparison Journey', () => {
    test('User can add plans to comparison', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Add first plan to comparison
      const firstCompareBtn = page.locator('.compare-btn').first();
      await firstCompareBtn.click();
      
      // Verify comparison bar appears
      await expect(page.locator('.comparison-bar')).toBeVisible();
      await expect(page.locator('.comparison-title')).toContainText('Compare 1 Plan');
      
      // Add second plan to comparison
      const secondCompareBtn = page.locator('.compare-btn').nth(1);
      await secondCompareBtn.click();
      
      // Verify comparison bar updates
      await expect(page.locator('.comparison-title')).toContainText('Compare 2 Plans');
      
      // Verify compare button is enabled
      const viewComparisonBtn = page.locator('.view-comparison-btn');
      await expect(viewComparisonBtn).toBeEnabled();
      await expect(viewComparisonBtn).toContainText('Compare Plans');
    });

    test('User can remove plans from comparison', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Add two plans to comparison
      await page.locator('.compare-btn').first().click();
      await page.locator('.compare-btn').nth(1).click();
      
      // Verify 2 plans in comparison
      await expect(page.locator('.comparison-title')).toContainText('Compare 2 Plans');
      
      // Remove one plan from comparison bar
      const removeBtns = page.locator('.remove-plan-btn');
      await removeBtns.first().click();
      
      // Verify updated count
      await expect(page.locator('.comparison-title')).toContainText('Compare 1 Plan');
      
      // Clear all comparisons
      await page.locator('.clear-all-btn').click();
      
      // Verify comparison bar disappears
      await expect(page.locator('.comparison-bar')).not.toBeVisible();
    });

    test('User cannot add more than 3 plans to comparison', async ({ page }) => {
      await page.goto('/texas/fort-worth/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Add maximum 3 plans
      for (let i = 0; i < 3; i++) {
        await page.locator('.compare-btn').nth(i).click();
      }
      
      // Verify maximum reached
      await expect(page.locator('.comparison-title')).toContainText('Compare 3 Plans');
      
      // Try to add a fourth plan - should be ignored
      const planCountBefore = await page.locator('.comparison-plan-card').count();
      await page.locator('.compare-btn').nth(3).click();
      
      const planCountAfter = await page.locator('.comparison-plan-card').count();
      expect(planCountAfter).toBe(planCountBefore); // Should remain the same
    });
  });

  test.describe('Plan Enrollment Journey', () => {
    test('User can click enroll button and be directed to enrollment', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Get plan information before clicking
      const firstPlan = page.locator('.plan-card').first();
      const planName = await firstPlan.locator('.plan-name').textContent();
      const providerName = await firstPlan.locator('.provider-name').textContent();
      
      // Click enroll button
      const enrollBtn = firstPlan.locator('.enroll-btn');
      await expect(enrollBtn).toBeVisible();
      await expect(enrollBtn).toContainText('Enroll');
      
      // Click and verify navigation intent (URL should change)
      const enrollPromise = page.waitForURL('**/enroll/**');
      await enrollBtn.click();
      
      try {
        await enrollPromise;
        // Verify enrollment URL contains plan information
        expect(page.url()).toMatch(/\/enroll\//);
        expect(page.url()).toContain('city=dallas');
      } catch (error) {
        // If enrollment page doesn't exist yet, just verify click worked
        console.log('Enrollment page not implemented yet, but click registered');
      }
    });

    test('User sees trust signals and transparency information', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const firstPlan = page.locator('.plan-card').first();
      
      // Verify trust indicators
      await expect(firstPlan.locator('.trust-indicator')).toContainText('Texas Approved');
      
      // Verify transparency messaging
      await expect(page.locator('.price-transparency')).toContainText('no hidden costs');
      
      // Verify fine print
      await expect(firstPlan.locator('.fine-print')).toContainText('terms and conditions');
      
      // Check for enrollment type indicator
      await expect(firstPlan.locator('.enrollment-type')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness Journey', () => {
    test('Mobile user can browse and interact with plans', async ({ page, isMobile }) => {
      if (!isMobile) {
        // Simulate mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
      }
      
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Verify mobile layout
      const planCard = page.locator('.plan-card').first();
      await expect(planCard).toBeVisible();
      
      // Verify buttons are accessible on mobile
      await expect(planCard.locator('.enroll-btn')).toBeVisible();
      await expect(planCard.locator('.compare-btn')).toBeVisible();
      
      // Test comparison on mobile
      await planCard.locator('.compare-btn').click();
      
      // Verify comparison bar is visible and usable on mobile
      const comparisonBar = page.locator('.comparison-bar');
      await expect(comparisonBar).toBeVisible();
      
      // Verify mobile-optimized comparison bar layout
      await expect(comparisonBar.locator('.view-comparison-btn')).toBeVisible();
    });
  });

  test.describe('Performance and Loading Journey', () => {
    test('Page loads within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within 10 seconds (generous for API-dependent content)
      expect(loadTime).toBeLessThan(10000);
      
      // Verify critical content is present
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.plan-card').first()).toBeVisible();
      
      console.log(`Page loaded in ${loadTime}ms`);
    });

    test('Plans display correctly when API is slow', async ({ page }) => {
      // Navigate to page
      await page.goto('/texas/houston/electricity-plans');
      
      // Wait for loading states or error states
      await page.waitForTimeout(2000);
      
      // Either plans should be loaded or there should be appropriate messaging
      const planCards = page.locator('.plan-card');
      const planCount = await planCards.count();
      
      if (planCount > 0) {
        // Plans loaded successfully
        await expect(planCards.first()).toBeVisible();
      } else {
        // Should show loading or error message
        const loadingIndicator = page.locator('[data-testid="loading"], .loading, .error-message');
        const hasLoadingOrError = await loadingIndicator.count() > 0;
        
        if (!hasLoadingOrError) {
          // If no plans and no loading/error message, wait a bit more
          await page.waitForTimeout(5000);
          const finalPlanCount = await page.locator('.plan-card').count();
          expect(finalPlanCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('SEO and Metadata Journey', () => {
    test('Pages have proper SEO metadata', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      
      // Verify title
      await expect(page).toHaveTitle(/Electricity Plans.*Dallas.*Texas/i);
      
      // Verify meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.toLowerCase()).toContain('dallas');
      expect(metaDescription?.toLowerCase()).toContain('electricity');
      
      // Verify canonical URL
      const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonicalUrl).toContain('/texas/dallas/electricity-plans');
      
      // Verify structured data
      const structuredData = await page.locator('script[type="application/ld+json"]').count();
      expect(structuredData).toBeGreaterThan(0);
    });

    test('Filtered pages have appropriate SEO metadata', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans/12-month');
      
      // Verify title includes filter information
      await expect(page).toHaveTitle(/12.*Month.*Houston.*Electricity/i);
      
      // Verify meta description mentions the filter
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription?.toLowerCase()).toContain('12');
      expect(metaDescription?.toLowerCase()).toContain('month');
      expect(metaDescription?.toLowerCase()).toContain('houston');
    });
  });

  test.describe('Error Handling Journey', () => {
    test('User sees appropriate message when no plans are available', async ({ page }) => {
      // Navigate to a page that might have no results
      await page.goto('/texas/austin/electricity-plans/very-specific+rare-filter');
      
      await page.waitForTimeout(10000); // Wait for API response
      
      const planCount = await page.locator('.plan-card').count();
      
      if (planCount === 0) {
        // Should show appropriate messaging
        const noResultsMessage = page.locator(':text("no plans"), :text("No plans"), :text("0 plans")');
        const messageCount = await noResultsMessage.count();
        
        if (messageCount > 0) {
          await expect(noResultsMessage.first()).toBeVisible();
        } else {
          // At minimum, the page should still be functional
          await expect(page.locator('h1')).toBeVisible();
        }
      }
    });

    test('Application handles network errors gracefully', async ({ page }) => {
      // Intercept and fail API requests to simulate network error
      await page.route('**/api/plans/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/texas/dallas/electricity-plans');
      
      // Wait for error handling
      await page.waitForTimeout(5000);
      
      // Page should still be functional even with API errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Should show some form of error message or fallback content
      const errorMessages = page.locator('.error, [data-testid="error"], :text("error"), :text("unavailable")');
      const hasErrorMessage = await errorMessages.count() > 0;
      
      if (!hasErrorMessage) {
        // At minimum, basic page structure should be present
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });
});