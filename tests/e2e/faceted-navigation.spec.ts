import { test, expect } from '@playwright/test';

test.describe('Faceted Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary test state
    await page.route('**/api/plans/**', async route => {
      // Mock API responses for consistent testing
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'plan-test-1',
            product: {
              _id: 'product-1',
              brand: {
                _id: 'brand-1',
                name: 'TXU Energy',
                puct_number: '10000',
                legal_name: 'TXU Energy Retail Company LLC',
                contact_info: {
                  sales: { phone_number: '1-800-TXU-ENERGY' },
                  support: {
                    address: '1601 Bryan St, Dallas, TX 75201',
                    email: 'customer.care@txu.com',
                    phone_number: '1-800-TXU-ENERGY'
                  }
                }
              },
              name: 'TXU Energy Select 12',
              term: 12,
              family: 'select',
              percent_green: 0,
              headline: 'Fixed rate for 12 months',
              early_termination_fee: 150,
              description: 'Reliable electricity with fixed pricing',
              is_pre_pay: false,
              is_time_of_use: false
            },
            tdsp: {
              _id: 'tdsp-oncor',
              name: 'Oncor Electric Delivery',
              short_name: 'Oncor',
              abbreviation: 'ONC',
              duns_number: '1039940674000'
            },
            expected_prices: [
              { usage: 500, price: 65.50, actual: 65.50, valid: true },
              { usage: 1000, price: 120.00, actual: 120.00, valid: true },
              { usage: 2000, price: 230.00, actual: 230.00, valid: true }
            ],
            display_pricing_500: { usage: 500, avg: 0.131, total: 65.50 },
            display_pricing_1000: { usage: 1000, avg: 0.120, total: 120.00 },
            display_pricing_2000: { usage: 2000, avg: 0.115, total: 230.00 },
            document_links: []
          },
          {
            _id: 'plan-test-2',
            product: {
              _id: 'product-2',
              brand: {
                _id: 'brand-2',
                name: 'Green Mountain Energy',
                puct_number: '10079',
                legal_name: 'Green Mountain Energy Company',
                contact_info: {
                  sales: { phone_number: '1-888-GREEN-MOUNTAIN' },
                  support: {
                    address: '1221 McKinney St, Houston, TX 77010',
                    email: 'support@greenmountain.com',
                    phone_number: '1-888-GREEN-MOUNTAIN'
                  }
                }
              },
              name: 'Pollution Free e-Plus 12',
              term: 12,
              family: 'eplus',
              percent_green: 100,
              headline: '100% renewable energy',
              early_termination_fee: 0,
              description: '100% wind-powered electricity',
              is_pre_pay: false,
              is_time_of_use: false
            },
            tdsp: {
              _id: 'tdsp-oncor',
              name: 'Oncor Electric Delivery',
              short_name: 'Oncor',
              abbreviation: 'ONC',
              duns_number: '1039940674000'
            },
            expected_prices: [
              { usage: 500, price: 72.25, actual: 72.25, valid: true },
              { usage: 1000, price: 135.50, actual: 135.50, valid: true },
              { usage: 2000, price: 265.00, actual: 265.00, valid: true }
            ],
            display_pricing_500: { usage: 500, avg: 0.1445, total: 72.25 },
            display_pricing_1000: { usage: 1000, avg: 0.1355, total: 135.50 },
            display_pricing_2000: { usage: 2000, avg: 0.1325, total: 265.00 },
            document_links: []
          }
        ])
      });
    });
  });

  test.describe('Basic Navigation', () => {
    test('should load city electricity plans page', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Check page loads successfully
      await expect(page).toHaveTitle(/Dallas.*Electricity Plans/i);
      
      // Check for essential page elements
      await expect(page.locator('h1')).toContainText('Dallas');
      await expect(page.locator('[data-testid="plan-grid"]')).toBeVisible();
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Check breadcrumbs are present and functional
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
      await expect(page.locator('nav[aria-label="Breadcrumb"] a[href="/"]')).toContainText('Home');
      await expect(page.locator('nav[aria-label="Breadcrumb"] a[href="/texas/"]')).toContainText('Texas');
    });

    test('should show plan results', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Wait for plans to load
      await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
      
      // Check that plan cards are displayed
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards).toHaveCount(2); // Based on our mock data
      
      // Check plan details are visible
      await expect(planCards.first()).toContainText('TXU Energy');
      await expect(planCards.first()).toContainText('12');
    });
  });

  test.describe('Single Filter Navigation', () => {
    test('should filter by contract term', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/');
      
      // Check URL is correct
      expect(page.url()).toContain('/dallas-tx/12-month/');
      
      // Check filter is reflected in page title
      await expect(page).toHaveTitle(/12-Month.*Dallas/i);
      
      // Check active filter is displayed
      await expect(page.locator('[data-testid="active-filter"]')).toContainText('12-Month');
    });

    test('should filter by green energy', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/green-energy/');
      
      // Check URL is correct
      expect(page.url()).toContain('/dallas-tx/green-energy/');
      
      // Check page shows green energy focus
      await expect(page).toHaveTitle(/Green Energy.*Dallas/i);
      await expect(page.locator('[data-testid="active-filter"]')).toContainText('Green Energy');
    });

    test('should show appropriate plans for filter', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/green-energy/');
      
      // Wait for filtered results
      await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
      
      // Should show green energy plans
      const greenPlanCard = page.locator('[data-testid="plan-card"]').filter({ hasText: 'Green Mountain' });
      await expect(greenPlanCard).toBeVisible();
      await expect(greenPlanCard).toContainText('100%');
    });
  });

  test.describe('Multi-Filter Navigation', () => {
    test('should handle two-filter combination', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/green-energy/');
      
      // Check URL structure
      expect(page.url()).toContain('/dallas-tx/12-month/green-energy/');
      
      // Check both filters are active
      await expect(page.locator('[data-testid="active-filter"]')).toHaveCount(2);
      
      // Check page title reflects both filters
      await expect(page).toHaveTitle(/12-Month.*Green Energy.*Dallas/i);
    });

    test('should show breadcrumbs for multi-filter navigation', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/green-energy/');
      
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"] a');
      await expect(breadcrumbs).toHaveCount(5); // Home, Texas, Dallas, 12-month, Green Energy
      
      // Check specific breadcrumb links
      await expect(breadcrumbs.nth(2)).toHaveAttribute('href', '/electricity-plans/dallas-tx/');
      await expect(breadcrumbs.nth(3)).toHaveAttribute('href', '/electricity-plans/dallas-tx/12-month/');
    });

    test('should allow filter removal', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/green-energy/');
      
      // Click to remove green energy filter
      const removeGreenEnergyButton = page.locator('[data-testid="remove-filter"]').filter({ hasText: 'Green Energy' });
      await removeGreenEnergyButton.click();
      
      // Should navigate to single filter page
      await expect(page).toHaveURL(/\/electricity-plans\/dallas-tx\/12-month\/$/);
      
      // Should only have one active filter
      await expect(page.locator('[data-testid="active-filter"]')).toHaveCount(1);
    });

    test('should allow clearing all filters', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/green-energy/');
      
      // Click clear all filters
      await page.locator('[data-testid="clear-all-filters"]').click();
      
      // Should navigate to city page
      await expect(page).toHaveURL(/\/electricity-plans\/dallas-tx\/$/);
      
      // Should have no active filters
      await expect(page.locator('[data-testid="active-filter"]')).toHaveCount(0);
    });
  });

  test.describe('Filter Sidebar Navigation', () => {
    test('should show available filters in sidebar', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Check sidebar is present
      await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();
      
      // Check for filter categories
      await expect(page.locator('[data-testid="filter-category"]')).toHaveCount.greaterThan(0);
    });

    test('should allow adding filters via sidebar', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Click on a filter in sidebar
      await page.locator('[data-testid="filter-option"][data-filter="12-month"]').click();
      
      // Should navigate to filtered page
      await expect(page).toHaveURL(/\/electricity-plans\/dallas-tx\/12-month\/$/);
      
      // Filter should be active
      await expect(page.locator('[data-testid="active-filter"]')).toContainText('12-Month');
    });

    test('should show filter states correctly in sidebar', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/');
      
      // Active filter should be highlighted in sidebar
      const activeFilterOption = page.locator('[data-testid="filter-option"][data-filter="12-month"]');
      await expect(activeFilterOption).toHaveClass(/active/);
      
      // Other filters should be available for adding
      const availableFilterOption = page.locator('[data-testid="filter-option"][data-filter="green-energy"]');
      await expect(availableFilterOption).toBeVisible();
      await expect(availableFilterOption).not.toHaveClass(/active/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid city gracefully', async ({ page }) => {
      const response = await page.goto('/electricity-plans/invalid-city-tx/');
      
      // Should redirect to 404 or handle gracefully
      expect(response?.status()).toBe(404);
    });

    test('should handle invalid filter combinations', async ({ page }) => {
      const response = await page.goto('/electricity-plans/dallas-tx/invalid-filter/');
      
      // Should redirect to valid page or show error
      if (response?.status() === 200) {
        // If it loads, should show error message or redirect
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      } else {
        expect(response?.status()).toBe(404);
      }
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/plans/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/electricity-plans/dallas-tx/');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load electricity plans');
    });
  });

  test.describe('SEO and Metadata', () => {
    test('should have proper meta tags for city page', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Check title
      await expect(page).toHaveTitle(/Best Electricity Plans in Dallas, TX/i);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /Compare electricity plans in Dallas, Texas/i);
      
      // Check canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /\/electricity-plans\/dallas-tx\/$/);
    });

    test('should have proper meta tags for filtered pages', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/');
      
      // Check title includes filter
      await expect(page).toHaveTitle(/12-Month Contract Electricity Plans in Dallas, TX/i);
      
      // Check meta description includes filter
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /12-Month Contract electricity plans in Dallas/i);
    });

    test('should have structured data', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/12-month/');
      
      // Check for breadcrumb structured data
      const structuredData = page.locator('script[type="application/ld+json"]');
      await expect(structuredData).toHaveCount.greaterThan(0);
    });
  });

  test.describe('Performance', () => {
    test('should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds (generous for E2E testing)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid filter changes without breaking', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Rapidly change filters
      await page.locator('[data-testid="filter-option"][data-filter="12-month"]').click();
      await page.waitForURL(/12-month/);
      
      await page.locator('[data-testid="filter-option"][data-filter="green-energy"]').click();
      await page.waitForURL(/green-energy/);
      
      await page.locator('[data-testid="remove-filter"]').first().click();
      
      // Should end up in a valid state
      await expect(page.locator('[data-testid="plan-grid"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('should be responsive on mobile', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Check mobile layout elements
      await expect(page.locator('[data-testid="plan-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();
      
      // Should have proper mobile navigation
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumbs).toBeVisible();
    });

    test('should handle filter interactions on mobile', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Should be able to interact with filters on mobile
      await page.locator('[data-testid="filter-option"][data-filter="12-month"]').click();
      await expect(page).toHaveURL(/12-month/);
      
      // Active filter should be visible and removable
      await expect(page.locator('[data-testid="active-filter"]')).toBeVisible();
      await page.locator('[data-testid="remove-filter"]').click();
      await expect(page).toHaveURL(/\/dallas-tx\/$/);
    });
  });
});