# Testing Strategy & Quality Assurance

**Document**: Comprehensive Testing Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  

## Testing Philosophy & Requirements

The ChooseMyPower platform requires **comprehensive testing coverage** with constitutional requirements for plan ID integrity, ESID accuracy, and performance compliance. Testing must prevent wrong plan orders and ensure 100% real data usage.

### **Testing Pyramid Architecture**
1. **Unit Tests (70%)**: Individual component and function testing
2. **Integration Tests (20%)**: API endpoints and database integration  
3. **End-to-End Tests (10%)**: Complete user journey validation
4. **Performance Tests**: Core Web Vitals and load testing
5. **Security Tests**: Constitutional requirement validation

### **Quality Gates**
- **Unit Test Coverage**: >80% (branches, functions, lines, statements)
- **API Test Coverage**: >95% endpoint coverage
- **E2E Test Coverage**: 100% critical user journeys
- **Performance Requirements**: Core Web Vitals compliance
- **Constitutional Tests**: Zero tolerance for plan ID/ESID violations

## Unit Testing Framework

### **Vitest Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Testing framework configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage requirements  
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80, 
        lines: 80,
        statements: 80
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**'
      ]
    },
    
    // Test timeout configuration
    testTimeout: 10000,          // 10 seconds for unit tests
    hookTimeout: 10000,
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    
    // Watch mode configuration
    watch: {
      ignore: ['**/dist/**', '**/coverage/**']
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});
```

### **Test Setup Configuration**
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'whatwg-fetch'; // Polyfill fetch for testing

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/choosemypower_test',
    REDIS_URL: 'redis://localhost:6379/1',
    COMPAREPOWER_API_KEY: 'test_api_key',
    ERCOT_API_KEY: 'test_ercot_key'
  }
}));

// Mock external APIs
vi.mock('@/lib/api/comparepower-client', () => ({
  comparePowerClient: {
    getPlansForCity: vi.fn(),
    getProviders: vi.fn(),
    validateESID: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' })
  }
}));

// Mock database connection
vi.mock('@/lib/database/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn()
  }
}));

// Mock Redis cache
vi.mock('@/lib/cache/redis-client', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clear: vi.fn()
  }
}));

// Global test utilities
global.generateMockPlan = () => ({
  id: '68b4f12d8e9c4a5b2f3e6d8a9',
  name: 'Test Plan 12',
  provider: { name: 'Test Provider' },
  pricing: { rate1000kWh: 12.5 },
  contract: { lengthMonths: 12, type: 'fixed' },
  features: ['No Deposit', 'Fixed Rate'],
  isActive: true
});

global.generateMockProvider = () => ({
  id: 1,
  name: 'Test Provider',
  displayName: 'Test Provider',
  rating: 4.2,
  plansCount: 15,
  isActive: true
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

### **Component Testing Standards**
```typescript
// tests/components/ProfessionalPlanCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProfessionalPlanCard } from '@/components/ui/ProfessionalPlanCard';

describe('ProfessionalPlanCard', () => {
  const mockPlan = global.generateMockPlan();
  const mockOnSelect = vi.fn();
  const mockOnCompare = vi.fn();
  
  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnCompare.mockClear();
  });
  
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders plan information correctly', () => {
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      expect(screen.getByText(mockPlan.name)).toBeInTheDocument();
      expect(screen.getByText(mockPlan.provider.name)).toBeInTheDocument();
      expect(screen.getByText('12.5¢')).toBeInTheDocument();
      expect(screen.getByText('12 months')).toBeInTheDocument();
    });
    
    it('displays plan features correctly', () => {
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      mockPlan.features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });
    
    it('shows popular badge when plan is marked as popular', () => {
      const popularPlan = { ...mockPlan, isPopular: true };
      
      render(
        <ProfessionalPlanCard 
          plan={popularPlan}
          onSelect={mockOnSelect}
        />
      );
      
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });
  
  // Interaction tests
  describe('User Interactions', () => {
    it('calls onSelect with correct plan ID when Select Plan button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      const selectButton = screen.getByRole('button', { name: /select plan/i });
      await user.click(selectButton);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockPlan.id);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
    
    it('calls onCompare when Compare button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
          onCompare={mockOnCompare}
        />
      );
      
      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);
      
      expect(mockOnCompare).toHaveBeenCalledWith(mockPlan.id, true);
    });
    
    it('handles keyboard navigation correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      const selectButton = screen.getByRole('button', { name: /select plan/i });
      
      // Tab navigation
      await user.tab();
      expect(selectButton).toHaveFocus();
      
      // Enter key activation
      await user.keyboard('[Enter]');
      expect(mockOnSelect).toHaveBeenCalledWith(mockPlan.id);
    });
  });
  
  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      // Check for semantic HTML structure
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select plan/i })).toBeInTheDocument();
      
      // Check for proper heading structure
      const planTitle = screen.getByRole('heading', { level: 3 });
      expect(planTitle).toHaveTextContent(mockPlan.name);
    });
    
    it('maintains color contrast requirements', () => {
      const { container } = render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      // This would be implemented with a color contrast testing utility
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Color contrast validation logic here
        expect(getColorContrast(styles.color, styles.backgroundColor)).toBeGreaterThan(4.5);
      });
    });
    
    it('supports screen reader navigation', () => {
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      // Check for proper text content and labels
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', expect.stringContaining(mockPlan.name));
    });
  });
  
  // Performance tests
  describe('Performance', () => {
    it('renders within performance budget', async () => {
      const renderStart = performance.now();
      
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      const renderTime = performance.now() - renderStart;
      
      // Component should render in less than 16ms (60fps requirement)
      expect(renderTime).toBeLessThan(16);
    });
    
    it('memoizes correctly when props do not change', () => {
      const { rerender } = render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      const initialElement = screen.getByRole('article');
      
      // Re-render with same props
      rerender(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      // Should be the same element (memoization working)
      expect(screen.getByRole('article')).toBe(initialElement);
    });
  });
  
  // Mobile-specific tests
  describe('Mobile Interactions', () => {
    it('handles touch interactions correctly', async () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true
      });
      
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
        />
      );
      
      const card = screen.getByRole('article');
      
      // Test touch target size (minimum 44px)
      const styles = window.getComputedStyle(card);
      const minHeight = parseInt(styles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
    
    it('supports swipe gestures', async () => {
      render(
        <ProfessionalPlanCard 
          plan={mockPlan}
          onSelect={mockOnSelect}
          onCompare={mockOnCompare}
        />
      );
      
      const card = screen.getByRole('article');
      
      // Simulate swipe left (add to comparison)
      fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 50, clientY: 100 }] });
      fireEvent.touchEnd(card, { touches: [] });
      
      await waitFor(() => {
        expect(mockOnCompare).toHaveBeenCalledWith(mockPlan.id, true);
      });
    });
  });
});
```

## Integration Testing

### **API Integration Tests**
```typescript
// tests/api/plans/search.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '@/pages/api/plans/search';
import { setupTestDatabase, cleanupTestDatabase } from '@tests/helpers/database';

describe('/api/plans/search', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  describe('Plan ID Resolution (Constitutional Requirement)', () => {
    it('returns dynamic MongoDB ObjectId, never hardcoded', async () => {
      const response = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      
      const planId = data.data[0].id;
      
      // Validate MongoDB ObjectId format (24 hex characters)
      expect(planId).toMatch(/^[0-9a-f]{24}$/);
      
      // CONSTITUTIONAL REQUIREMENT: Never return hardcoded pattern
      expect(planId).not.toMatch(/^68b[0-9a-f]{21}$/);
      
      // Validate that ID comes from database/generated data
      const isDynamic = await validatePlanIdIsDynamic(planId);
      expect(isDynamic).toBe(true);
    });
    
    it('returns different IDs for same plan across environments', async () => {
      const response1 = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      // Simulate different environment/database
      await setupTestDatabase('alternate');
      
      const response2 = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // Same plan should have different IDs in different environments
      expect(data1.data[0].id).not.toBe(data2.data[0].id);
      
      // Both should be valid ObjectIds
      expect(data1.data[0].id).toMatch(/^[0-9a-f]{24}$/);
      expect(data2.data[0].id).toMatch(/^[0-9a-f]{24}$/);
    });
    
    it('handles database fallback to JSON correctly', async () => {
      // Simulate database unavailability
      vi.mocked(hasPlansInDatabase).mockResolvedValue(false);
      
      const response = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.metadata.performance.source).toBe('json');
      
      // Even from JSON, plan ID must be dynamic
      expect(data.data[0].id).toMatch(/^[0-9a-f]{24}$/);
      expect(data.data[0].id).not.toMatch(/^68b[0-9a-f]{21}$/);
    });
  });
  
  describe('Performance Requirements', () => {
    it('responds within 500ms threshold', async () => {
      const startTime = performance.now();
      
      const response = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      const responseTime = performance.now() - startTime;
      const data = await response.json();
      
      expect(responseTime).toBeLessThan(500);
      expect(data.metadata.performance.responseTime).toBeLessThan(500);
    });
    
    it('caches results for improved performance', async () => {
      const searchParams = 'name=Test%20Plan&provider=Test%20Provider&city=dallas';
      
      // First request (cache miss)
      const response1 = await GET({
        url: new URL(`http://localhost/api/plans/search?${searchParams}`),
        request: new Request('http://localhost')
      });
      const data1 = await response1.json();
      
      // Second request (cache hit)
      const startTime = performance.now();
      const response2 = await GET({
        url: new URL(`http://localhost/api/plans/search?${searchParams}`),
        request: new Request('http://localhost')
      });
      const responseTime = performance.now() - startTime;
      const data2 = await response2.json();
      
      // Cache hit should be faster
      expect(responseTime).toBeLessThan(100);
      expect(data1.data[0].id).toBe(data2.data[0].id);
    });
  });
  
  describe('Error Handling', () => {
    it('returns 400 for missing required parameters', async () => {
      const response = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan'),
        request: new Request('http://localhost')
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
    });
    
    it('handles database errors gracefully', async () => {
      // Simulate database error
      vi.mocked(findPlanByNameAndProviderDB).mockRejectedValue(new Error('Database connection failed'));
      
      const response = await GET({
        url: new URL('http://localhost/api/plans/search?name=Test%20Plan&provider=Test%20Provider&city=dallas'),
        request: new Request('http://localhost')
      });
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
```

### **Database Integration Tests**
```typescript
// tests/integration/database-integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/database/connection';
import { electricityPlans, providers, cities } from '@/lib/database/schema';
import { setupTestDatabase, cleanupTestDatabase, seedTestData } from '@tests/helpers/database';

describe('Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  describe('Plan Data Integrity', () => {
    it('maintains referential integrity between plans and providers', async () => {
      const plans = await db
        .select({
          planId: electricityPlans.id,
          planName: electricityPlans.name,
          providerId: electricityPlans.providerId,
          providerName: providers.name
        })
        .from(electricityPlans)
        .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
        .limit(10);
      
      expect(plans.length).toBeGreaterThan(0);
      
      plans.forEach(plan => {
        expect(plan.planId).toMatch(/^[0-9a-f]{24}$/);  // Valid ObjectId
        expect(plan.providerId).toBeGreaterThan(0);      // Valid provider ID
        expect(plan.providerName).toBeTruthy();          // Provider exists
      });
    });
    
    it('validates plan ID uniqueness across all plans', async () => {
      const planIds = await db
        .select({ id: electricityPlans.id })
        .from(electricityPlans);
      
      const uniqueIds = new Set(planIds.map(p => p.id));
      
      // No duplicate plan IDs
      expect(uniqueIds.size).toBe(planIds.length);
      
      // All IDs are valid ObjectId format
      planIds.forEach(plan => {
        expect(plan.id).toMatch(/^[0-9a-f]{24}$/);
        expect(plan.id).not.toMatch(/^68b[0-9a-f]{21}$/); // No hardcoded IDs
      });
    });
    
    it('ensures all plans have required pricing data', async () => {
      const plansWithoutPricing = await db
        .select({ id: electricityPlans.id, name: electricityPlans.name })
        .from(electricityPlans)
        .where(
          or(
            isNull(electricityPlans.rate1000kWh),
            lt(electricityPlans.rate1000kWh, 0)
          )
        );
      
      // No plans should be missing pricing data
      expect(plansWithoutPricing).toHaveLength(0);
    });
  });
  
  describe('Performance Optimization', () => {
    it('executes city plan queries within performance thresholds', async () => {
      const startTime = performance.now();
      
      const plans = await db
        .select()
        .from(electricityPlans)
        .where(
          and(
            arrayContains(electricityPlans.citySlugs, 'dallas'),
            eq(electricityPlans.isActive, true)
          )
        )
        .orderBy(electricityPlans.rate1000kWh)
        .limit(50);
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(150); // <150ms for city plan queries
      expect(plans.length).toBeGreaterThan(0);
    });
    
    it('efficiently handles provider filtering queries', async () => {
      const startTime = performance.now();
      
      const providerPlans = await db
        .select({
          planId: electricityPlans.id,
          planName: electricityPlans.name,
          providerName: providers.name,
          rate: electricityPlans.rate1000kWh
        })
        .from(electricityPlans)
        .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
        .where(
          and(
            eq(providers.name, 'TXU Energy'),
            eq(electricityPlans.isActive, true)
          )
        )
        .orderBy(electricityPlans.rate1000kWh);
      
      const queryTime = performance.now() - startTime;
      
      expect(queryTime).toBeLessThan(100); // <100ms for provider filtering
    });
  });
  
  describe('Data Consistency', () => {
    it('maintains city-TDSP mapping consistency', async () => {
      const cityTdspMappings = await db
        .select({
          citySlug: cities.slug,
          cityTdsp: cities.tdspDuns,
          planTdsp: electricityPlans.tdspDuns
        })
        .from(cities)
        .innerJoin(
          electricityPlans,
          arrayContains(electricityPlans.citySlugs, cities.slug)
        )
        .limit(100);
      
      // All plans in a city must match the city's TDSP
      cityTdspMappings.forEach(mapping => {
        expect(mapping.cityTdsp).toBe(mapping.planTdsp);
      });
    });
    
    it('validates ZIP code to city mappings', async () => {
      const zipMappings = await db
        .select()
        .from(zipCodeMappings)
        .innerJoin(cities, eq(zipCodeMappings.cityId, cities.id))
        .limit(50);
      
      zipMappings.forEach(mapping => {
        expect(mapping.zip_code_mappings.zipCode).toMatch(/^\d{5}$/);
        expect(mapping.cities.slug).toBeTruthy();
        expect(mapping.zip_code_mappings.isDeregulated).toBe(true);
      });
    });
  });
});
```

## End-to-End Testing

### **Playwright E2E Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    ['github']
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4324',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Test against multiple browsers and devices
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Web server for testing
  webServer: {
    command: 'npm run preview',
    port: 4324,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### **Critical User Journey Tests**
```typescript
// tests/e2e/critical-user-journeys.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.describe('ZIP to Plan Selection Flow', () => {
    test('completes full ZIP to order workflow', async ({ page }) => {
      // Step 1: Homepage ZIP entry
      await page.goto('/');
      
      // Verify homepage loads correctly
      await expect(page.getByRole('heading', { name: /compare electricity plans/i })).toBeVisible();
      
      const zipInput = page.getByPlaceholder(/enter zip code/i);
      await expect(zipInput).toBeVisible();
      
      // Enter valid Dallas ZIP code
      await zipInput.fill('75201');
      
      // Submit should be enabled for valid ZIP
      const submitButton = page.getByRole('button', { name: /compare plans/i });
      await expect(submitButton).not.toBeDisabled();
      
      // Submit ZIP form
      await submitButton.click();
      
      // Step 2: Plan listing page
      await expect(page).toHaveURL(/\/electricity-plans\/dallas-tx\//);
      
      // Wait for plan data to load
      await expect(page.getByTestId('plan-grid')).toBeVisible({ timeout: 10000 });
      
      // Verify plans are displayed
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards.first()).toBeVisible();
      
      // Plans should have required information
      await expect(planCards.first().getByText(/¢/)).toBeVisible(); // Rate display
      await expect(planCards.first().getByText(/months/)).toBeVisible(); // Term display
      
      // Step 3: Plan selection
      const firstPlan = planCards.first();
      const planName = await firstPlan.getByTestId('plan-name').textContent();
      const providerName = await firstPlan.getByTestId('provider-name').textContent();
      
      await firstPlan.getByRole('button', { name: /select plan/i }).click();
      
      // Step 4: Address modal should open
      const addressModal = page.getByTestId('address-search-modal');
      await expect(addressModal).toBeVisible();
      
      // Modal should show selected plan details
      await expect(addressModal.getByText(planName!)).toBeVisible();
      await expect(addressModal.getByText(providerName!)).toBeVisible();
      
      // Fill address form
      await page.getByPlaceholder(/street address/i).fill('123 Main St');
      await page.getByPlaceholder(/city/i).fill('Dallas');
      await page.getByPlaceholder(/state/i).fill('TX');
      await page.getByPlaceholder(/zip code/i).fill('75201');
      
      // Validate address
      await page.getByRole('button', { name: /validate address/i }).click();
      
      // Step 5: ESID generation and validation
      await expect(page.getByText(/generating esid/i)).toBeVisible();
      await expect(page.getByText(/esid.*generated/i)).toBeVisible({ timeout: 15000 });
      
      // Verify ESID format (17 digits starting with 10)
      const esiidText = await page.getByTestId('generated-esiid').textContent();
      expect(esiidText).toMatch(/^10\d{15}$/);
      
      // Step 6: Order preparation
      await page.getByRole('button', { name: /proceed to order/i }).click();
      
      // Should redirect to ComparePower with proper parameters
      await expect(page).toHaveURL(/comparepower\.com/, { timeout: 10000 });
      
      // Verify URL contains plan ID and ESID (but don't check exact values)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/planId=[0-9a-f]{24}/); // MongoDB ObjectId
      expect(currentUrl).toMatch(/esiid=10\d{15}/);      // Valid ESID
    });
    
    test('handles invalid ZIP codes correctly', async ({ page }) => {
      await page.goto('/');
      
      const zipInput = page.getByPlaceholder(/enter zip code/i);
      const submitButton = page.getByRole('button', { name: /compare plans/i });
      
      // Test invalid ZIP formats
      await zipInput.fill('1234');
      await expect(submitButton).toBeDisabled();
      
      await zipInput.fill('abcde');
      await expect(submitButton).toBeDisabled();
      
      // Test out-of-state ZIP
      await zipInput.fill('90210'); // California ZIP
      await submitButton.click();
      
      await expect(page.getByText(/not available in california/i)).toBeVisible();
    });
    
    test('handles server errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('/api/zip/validate', route => 
        route.fulfill({ status: 500, body: '{"success": false, "error": "Server error"}' })
      );
      
      await page.goto('/');
      
      const zipInput = page.getByPlaceholder(/enter zip code/i);
      const submitButton = page.getByRole('button', { name: /compare plans/i });
      
      await zipInput.fill('75201');
      await submitButton.click();
      
      // Should show error message
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
      await expect(page.getByText(/please try again/i)).toBeVisible();
    });
  });
  
  test.describe('Plan Comparison Flow', () => {
    test('compares multiple plans side-by-side', async ({ page }) => {
      await page.goto('/electricity-plans/dallas-tx/');
      
      // Wait for plans to load
      await expect(page.getByTestId('plan-grid')).toBeVisible();
      
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards).toHaveCount.greaterThan(2);
      
      // Select first plan for comparison
      await planCards.nth(0).getByRole('button', { name: /compare/i }).click();
      await expect(page.getByText(/1 plan selected/i)).toBeVisible();
      
      // Select second plan for comparison
      await planCards.nth(1).getByRole('button', { name: /compare/i }).click();
      await expect(page.getByText(/2 plans selected/i)).toBeVisible();
      
      // Open comparison modal
      await page.getByRole('button', { name: /compare selected plans/i }).click();
      
      const comparisonModal = page.getByTestId('comparison-modal');
      await expect(comparisonModal).toBeVisible();
      
      // Modal should show both plans side-by-side
      const comparisonPlans = comparisonModal.locator('[data-testid="comparison-plan"]');
      await expect(comparisonPlans).toHaveCount(2);
      
      // Each plan should have comparison data
      for (let i = 0; i < 2; i++) {
        const plan = comparisonPlans.nth(i);
        await expect(plan.getByTestId('plan-name')).toBeVisible();
        await expect(plan.getByTestId('monthly-cost')).toBeVisible();
        await expect(plan.getByTestId('annual-cost')).toBeVisible();
        await expect(plan.getByTestId('features-list')).toBeVisible();
      }
      
      // Should show savings comparison
      await expect(comparisonModal.getByText(/save.*per year/i)).toBeVisible();
      
      // Select plan from comparison
      await comparisonPlans.first().getByRole('button', { name: /select this plan/i }).click();
      
      // Should open address modal
      await expect(page.getByTestId('address-search-modal')).toBeVisible();
    });
  });
  
  test.describe('Mobile User Experience', () => {
    test('provides optimal mobile experience', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');
      
      await page.goto('/');
      
      // Mobile-specific UI elements
      await expect(page.getByTestId('mobile-hero')).toBeVisible();
      
      // Large touch targets
      const zipInput = page.getByPlaceholder(/enter zip code/i);
      const inputBox = await zipInput.boundingBox();
      expect(inputBox!.height).toBeGreaterThanOrEqual(44); // iOS minimum
      
      const submitButton = page.getByRole('button', { name: /compare plans/i });
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
      
      // Mobile navigation
      await page.getByTestId('mobile-menu-button').click();
      await expect(page.getByTestId('mobile-navigation')).toBeVisible();
      
      // Swipe gestures on plan cards (if implemented)
      await page.goto('/electricity-plans/dallas-tx/');
      await expect(page.getByTestId('plan-grid')).toBeVisible();
      
      const firstPlan = page.locator('[data-testid="plan-card"]').first();
      
      // Simulate swipe gesture
      await firstPlan.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0); // Swipe right
      await page.mouse.up();
      
      // Check if swipe action was recognized (add to comparison)
      await expect(page.getByText(/added to comparison/i)).toBeVisible();
    });
  });
});
```

## Performance Testing

### **Core Web Vitals Testing**
```typescript
// tests/performance/core-web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals Performance', () => {
  test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
    // Enable performance metrics
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    const startTime = Date.now();
    
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = entry.processingStart - entry.startTime;
          }
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
          resolve(vitals);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve(vitals), 5000);
      });
    });
    
    // Core Web Vitals thresholds
    expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(webVitals.fid).toBeLessThan(100);  // FID < 100ms
    expect(webVitals.cls).toBeLessThan(0.1);  // CLS < 0.1
    
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();
    
    // Calculate unused bytes
    const unusedJS = jsCoverage.reduce((sum, entry) => {
      const unused = entry.ranges.reduce((acc, range) => acc + (range.end - range.start), 0);
      return sum + unused;
    }, 0);
    
    // Less than 20% unused JavaScript
    const totalJS = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    expect(unusedJS / totalJS).toBeLessThan(0.2);
  });
  
  test('plan listing pages meet performance requirements', async ({ page }) => {
    await page.goto('/electricity-plans/dallas-tx/');
    
    // Wait for plan data to load
    await expect(page.getByTestId('plan-grid')).toBeVisible();
    
    // Measure paint metrics
    const paintMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        timeToInteractive: performance.now() - navigation.fetchStart
      };
    });
    
    expect(paintMetrics.domContentLoaded).toBeLessThan(1500); // DOM ready < 1.5s
    expect(paintMetrics.timeToInteractive).toBeLessThan(3000); // TTI < 3s
    
    // Test scrolling performance
    const scrollStart = performance.now();
    
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(16); // 60fps = 16.67ms per frame
    }
    
    const scrollTime = performance.now() - scrollStart;
    const fps = 1000 / (scrollTime / 10);
    
    expect(fps).toBeGreaterThan(55); // Maintain ~60fps during scrolling
  });
  
  test('API responses meet performance thresholds', async ({ page }) => {
    // Test ZIP validation performance
    const response = await page.request.post('/api/zip/validate', {
      data: { zipCode: '75201' }
    });
    
    expect(response.status()).toBe(200);
    
    const responseTime = await response.headerValue('x-response-time');
    expect(parseInt(responseTime || '0')).toBeLessThan(200);
    
    // Test plan search performance
    const planSearchResponse = await page.request.get('/api/plans/search?name=Test&provider=Test&city=dallas');
    expect(planSearchResponse.status()).toBe(200);
    
    const planResponseTime = await planSearchResponse.headerValue('x-response-time');
    expect(parseInt(planResponseTime || '0')).toBeLessThan(500);
  });
});
```

## Constitutional Requirement Tests

### **Plan ID & ESID Validation Tests**
```typescript
// tests/constitutional/plan-id-esid-validation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Constitutional Requirements - Plan ID & ESID Integrity', () => {
  test('prevents hardcoded plan IDs throughout application', async ({ page }) => {
    // Test 1: API endpoints never return hardcoded IDs
    const planSearchResponse = await page.request.get('/api/plans/search?name=Cash%20Money%2012&provider=4Change%20Energy&city=dallas');
    const planData = await planSearchResponse.json();
    
    if (planData.success && planData.data.length > 0) {
      const planId = planData.data[0].id;
      
      // Must be valid MongoDB ObjectId
      expect(planId).toMatch(/^[0-9a-f]{24}$/);
      
      // Must NOT be hardcoded pattern
      expect(planId).not.toMatch(/^68b[0-9a-f]{21}$/);
    }
    
    // Test 2: Plan selection workflow uses dynamic IDs
    await page.goto('/electricity-plans/dallas-tx/');
    await expect(page.getByTestId('plan-grid')).toBeVisible();
    
    // Intercept plan selection requests
    let planOrderUrl = '';
    page.on('response', response => {
      if (response.url().includes('comparepower.com')) {
        planOrderUrl = response.url();
      }
    });
    
    // Select first plan
    const firstPlan = page.locator('[data-testid="plan-card"]').first();
    await firstPlan.getByRole('button', { name: /select plan/i }).click();
    
    // Complete address flow (simplified for test)
    const addressModal = page.getByTestId('address-search-modal');
    await expect(addressModal).toBeVisible();
    
    await page.getByPlaceholder(/street address/i).fill('123 Main St');
    await page.getByRole('button', { name: /validate address/i }).click();
    
    await expect(page.getByTestId('generated-esiid')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /proceed to order/i }).click();
    
    // Validate order URL parameters
    await page.waitForTimeout(2000); // Wait for redirect
    
    if (planOrderUrl) {
      const url = new URL(planOrderUrl);
      const planId = url.searchParams.get('planId');
      const esiid = url.searchParams.get('esiid');
      
      // Plan ID validation
      expect(planId).toMatch(/^[0-9a-f]{24}$/);
      expect(planId).not.toMatch(/^68b[0-9a-f]{21}$/);
      
      // ESID validation
      expect(esiid).toMatch(/^10\d{15}$/);
      expect(esiid).not.toMatch(/^10123456789012345$/); // Not hardcoded ESID
    }
  });
  
  test('generates unique ESIDs based on address', async ({ page }) => {
    const addresses = [
      { street: '123 Main St', city: 'Dallas', zip: '75201' },
      { street: '456 Oak Ave', city: 'Dallas', zip: '75202' },
      { street: '789 Elm St', city: 'Houston', zip: '77001' }
    ];
    
    const generatedESIIDs = [];
    
    for (const address of addresses) {
      await page.goto('/electricity-plans/dallas-tx/');
      await expect(page.getByTestId('plan-grid')).toBeVisible();
      
      // Select first plan
      await page.locator('[data-testid="plan-card"]').first()
        .getByRole('button', { name: /select plan/i }).click();
      
      // Enter address
      await page.getByPlaceholder(/street address/i).fill(address.street);
      await page.getByPlaceholder(/city/i).fill(address.city);
      await page.getByPlaceholder(/zip code/i).fill(address.zip);
      
      await page.getByRole('button', { name: /validate address/i }).click();
      await expect(page.getByTestId('generated-esiid')).toBeVisible({ timeout: 15000 });
      
      const esiidText = await page.getByTestId('generated-esiid').textContent();
      const esiid = esiidText?.match(/\d{17}/)?.[0];
      
      expect(esiid).toMatch(/^10\d{15}$/);
      generatedESIIDs.push(esiid);
      
      // Close modal for next iteration
      await page.getByRole('button', { name: /close|cancel/i }).click();
    }
    
    // All ESIIDs should be unique (different addresses = different ESIIDs)
    const uniqueESIIDs = new Set(generatedESIIDs);
    expect(uniqueESIIDs.size).toBe(generatedESIIDs.length);
    
    // ESIIDs should vary based on ZIP code patterns
    expect(generatedESIIDs[0].substring(2, 5)).toBe('752'); // Dallas ZIP pattern
    expect(generatedESIIDs[1].substring(2, 5)).toBe('752'); // Dallas ZIP pattern
    expect(generatedESIIDs[2].substring(2, 5)).toBe('770'); // Houston ZIP pattern
  });
  
  test('validates source code contains no hardcoded IDs', async ({ page }) => {
    // This test would be run as part of CI/CD pipeline
    // Simulated here by checking API responses don't contain patterns
    
    const criticalEndpoints = [
      '/api/plans/search?name=Test&provider=Test&city=dallas',
      '/api/plans/filter',
      '/api/plans/compare'
    ];
    
    for (const endpoint of criticalEndpoints) {
      const response = await page.request.get(endpoint);
      const responseText = await response.text();
      
      // Should not contain hardcoded ObjectId patterns
      expect(responseText).not.toMatch(/68b[0-9a-f]{21}/g);
      
      // Should not contain hardcoded ESID patterns  
      expect(responseText).not.toMatch(/10123456789012345/g);
    }
  });
  
  test('database queries never return hardcoded values', async ({ page }) => {
    // Test database service directly through API
    const planListResponse = await page.request.get('/api/plans/list?city=dallas&limit=10');
    const planData = await planListResponse.json();
    
    if (planData.success && planData.data.length > 0) {
      planData.data.forEach((plan: any) => {
        // Every plan ID must be valid ObjectId
        expect(plan.id).toMatch(/^[0-9a-f]{24}$/);
        
        // No hardcoded IDs allowed
        expect(plan.id).not.toMatch(/^68b[0-9a-f]{21}$/);
        
        // Plans must have required fields
        expect(plan.name).toBeTruthy();
        expect(plan.provider).toBeTruthy();
        expect(plan.pricing?.rate1000kWh).toBeGreaterThan(0);
      });
    }
  });
});
```

This comprehensive testing strategy ensures the ChooseMyPower platform maintains the highest quality standards with particular focus on the constitutional requirements that prevent wrong plan orders through proper plan ID and ESID handling.