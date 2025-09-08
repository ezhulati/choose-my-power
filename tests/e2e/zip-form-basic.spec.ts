// E2E test for basic ZIP lookup form submission
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages
// This test MUST FAIL until form component is implemented

import { test, expect } from '@playwright/test';

test.describe('ZIP Code Lookup Form - Basic E2E', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🔴 E2E test running - should FAIL until form component implemented');
  });

  test('should display ZIP lookup form on Dallas city page', async ({ page }) => {
    await page.goto('/texas/dallas/');
    
    // This should fail until form is added to city pages
    const zipForm = page.locator('[data-testid="zip-lookup-form"]');
    await expect(zipForm).toBeVisible();
    
    const zipInput = page.locator('input[name="zipCode"]');
    await expect(zipInput).toBeVisible();
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Find Plans');
  });

  test('should submit valid Dallas ZIP code and redirect', async ({ page }) => {
    await page.goto('/texas/dallas/');
    
    const zipInput = page.locator('input[name="zipCode"]');
    await zipInput.fill('75201');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should redirect to filtered plans page
    await expect(page).toHaveURL(/\/electricity-plans\/dallas-tx\?zip=75201/);
    
    // Should show filtered plans
    const plansList = page.locator('[data-testid="plans-list"]');
    await expect(plansList).toBeVisible();
  });

  test('should show error for invalid ZIP code', async ({ page }) => {
    await page.goto('/texas/dallas/');
    
    const zipInput = page.locator('input[name="zipCode"]');
    await zipInput.fill('12345');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="zip-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('not in Texas');
  });

  test('should handle cross-city ZIP redirection', async ({ page }) => {
    await page.goto('/texas/dallas/');
    
    const zipInput = page.locator('input[name="zipCode"]');
    await zipInput.fill('77001'); // Houston ZIP
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should redirect to Houston page
    await expect(page).toHaveURL(/\/texas\/houston/);
  });
});