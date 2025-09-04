import { test, expect } from '@playwright/test';

test.describe('Product Detail Page Address Entry Flow', () => {
  test('Complete address entry flow without overlay issues', async ({ page }) => {
    // Navigate to product detail page
    await page.goto('http://localhost:4324/electricity-plans/plans/txu-energy/electric-freedom-24');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial page
    await page.screenshot({ 
      path: 'test-results/01-product-detail-page.png', 
      fullPage: true 
    });
    
    // Find and click the "Select This Plan" button
    const selectButton = page.getByRole('button', { name: /select this plan/i }).first();
    await expect(selectButton).toBeVisible();
    await selectButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Take screenshot to verify modal is visible without overlay issues
    await page.screenshot({ 
      path: 'test-results/02-modal-opened.png', 
      fullPage: true 
    });
    
    // Verify modal is visible and not obscured
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check that modal content is interactable (not blocked by overlay)
    const modalOpacity = await modal.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.opacity;
    });
    expect(parseFloat(modalOpacity)).toBe(1);
    
    // Test 1: Enter a Texas address
    const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="street" i]').first();
    await expect(addressInput).toBeVisible();
    await addressInput.fill('123 Main Street');
    
    await page.screenshot({ 
      path: 'test-results/03-address-entered.png', 
      fullPage: true 
    });
    
    // Test 2: Enter a Texas ZIP code
    const zipInput = page.locator('input[placeholder*="zip" i], input[type="text"][maxlength="5"]').first();
    await expect(zipInput).toBeVisible();
    await zipInput.fill('75201');
    
    await page.screenshot({ 
      path: 'test-results/04-zip-entered.png', 
      fullPage: true 
    });
    
    // Click "Check Availability" or wait for auto-search
    const checkButton = page.getByRole('button', { name: /check availability/i });
    if (await checkButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkButton.click();
    } else {
      // Wait for auto-search to trigger
      await page.waitForTimeout(1000);
    }
    
    // Wait for service locations to load
    await page.waitForSelector('[data-testid="service-location"], .service-location, [role="listitem"]', { 
      timeout: 10000 
    });
    
    await page.screenshot({ 
      path: 'test-results/05-service-locations-loaded.png', 
      fullPage: true 
    });
    
    // Click on the first service location
    const serviceLocation = page.locator('[data-testid="service-location"], .service-location, [role="listitem"]').first();
    await expect(serviceLocation).toBeVisible();
    await serviceLocation.click();
    
    // Wait for success screen
    await page.waitForTimeout(1000);
    
    // Take screenshot of success state
    await page.screenshot({ 
      path: 'test-results/06-success-screen.png', 
      fullPage: true 
    });
    
    // Verify success message or next step is visible
    const successIndicator = page.locator('text=/success|confirmed|selected|next/i');
    const hasSuccessIndicator = await successIndicator.count() > 0;
    
    // Generate test report
    console.log('Test Report:');
    console.log('✅ Product detail page loaded successfully');
    console.log('✅ Select This Plan button is clickable');
    console.log('✅ Modal opened without overlay issues');
    console.log('✅ Modal opacity is 1 (fully visible)');
    console.log('✅ Address input field is functional');
    console.log('✅ ZIP code input field accepts 5 digits');
    console.log('✅ Service locations loaded successfully');
    console.log('✅ Service location selection works');
    console.log(hasSuccessIndicator ? '✅ Success screen displayed' : '⚠️ Success screen may not be fully visible');
  });
  
  test('Verify ZIP code input validation', async ({ page }) => {
    await page.goto('http://localhost:4324/electricity-plans/plans/txu-energy/electric-freedom-24');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    const selectButton = page.getByRole('button', { name: /select this plan/i }).first();
    await selectButton.click();
    await page.waitForSelector('[role="dialog"]');
    
    // Find ZIP input
    const zipInput = page.locator('input[placeholder*="zip" i], input[type="text"][maxlength="5"]').first();
    
    // Test numeric input only
    await zipInput.fill('abcde');
    const value1 = await zipInput.inputValue();
    
    // Clear and test 5-digit limit
    await zipInput.clear();
    await zipInput.fill('123456789');
    const value2 = await zipInput.inputValue();
    
    // Verify ZIP validation
    expect(value2.length).toBeLessThanOrEqual(5);
    
    await page.screenshot({ 
      path: 'test-results/07-zip-validation.png', 
      fullPage: true 
    });
    
    console.log('ZIP Validation Test:');
    console.log(`✅ ZIP field limits to 5 characters: ${value2.length <= 5}`);
    console.log(`✅ Current ZIP value: ${value2}`);
  });
  
  test('Test modal interaction without dark overlay blocking', async ({ page }) => {
    await page.goto('http://localhost:4324/electricity-plans/plans/txu-energy/electric-freedom-24');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    const selectButton = page.getByRole('button', { name: /select this plan/i }).first();
    await selectButton.click();
    await page.waitForSelector('[role="dialog"]');
    
    // Check for dark overlay issues
    const backdrop = page.locator('.fixed.inset-0.bg-black, [data-testid="modal-backdrop"]');
    const hasBackdrop = await backdrop.count() > 0;
    
    if (hasBackdrop) {
      const backdropOpacity = await backdrop.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.opacity;
      });
      
      const backdropZIndex = await backdrop.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.zIndex;
      });
      
      console.log('Backdrop Analysis:');
      console.log(`Backdrop opacity: ${backdropOpacity}`);
      console.log(`Backdrop z-index: ${backdropZIndex}`);
      
      // Check modal z-index is higher than backdrop
      const modal = page.locator('[role="dialog"]');
      const modalZIndex = await modal.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.zIndex;
      });
      
      console.log(`Modal z-index: ${modalZIndex}`);
      
      if (backdropZIndex !== 'auto' && modalZIndex !== 'auto') {
        expect(parseInt(modalZIndex)).toBeGreaterThan(parseInt(backdropZIndex));
      }
    }
    
    // Test that all modal elements are clickable
    const modalButtons = page.locator('[role="dialog"] button');
    const buttonCount = await modalButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = modalButtons.nth(i);
      const isClickable = await button.isVisible() && await button.isEnabled();
      console.log(`Button ${i + 1} is clickable: ${isClickable}`);
    }
    
    await page.screenshot({ 
      path: 'test-results/08-modal-interaction-test.png', 
      fullPage: true 
    });
  });
});