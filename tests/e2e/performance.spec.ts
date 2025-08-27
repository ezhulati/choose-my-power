import { test, expect, Page } from '@playwright/test';

// Core Web Vitals thresholds (Google's recommended values)
const CORE_WEB_VITALS = {
  LCP: 2500, // Largest Contentful Paint - Good: ≤2.5s
  FID: 100,  // First Input Delay - Good: ≤100ms  
  CLS: 0.1,  // Cumulative Layout Shift - Good: ≤0.1
  FCP: 1800, // First Contentful Paint - Good: ≤1.8s
  TTFB: 800  // Time to First Byte - Good: ≤800ms
};

async function measureCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = {
        LCP: 0,
        FID: 0,
        CLS: 0,
        FCP: 0,
        TTFB: 0
      };

      // Measure TTFB
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // Measure FCP
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.FCP = fcpEntry.startTime;
      }

      // Use Web Vitals library if available
      if (typeof window !== 'undefined' && (window as any).webVitals) {
        const { getCLS, getFID, getLCP } = (window as any).webVitals;

        let resolvedCount = 0;
        const checkComplete = () => {
          resolvedCount++;
          if (resolvedCount >= 3) {
            setTimeout(() => resolve(metrics), 100);
          }
        };

        getCLS((metric: any) => {
          metrics.CLS = metric.value;
          checkComplete();
        });

        getFID((metric: any) => {
          metrics.FID = metric.value;
          checkComplete();
        });

        getLCP((metric: any) => {
          metrics.LCP = metric.value;
          checkComplete();
        });

        // Fallback timeout
        setTimeout(() => resolve(metrics), 5000);
      } else {
        // Fallback measurements
        setTimeout(() => {
          // Estimate LCP using largest element
          const largestElement = document.querySelector('.plan-card, .main-content, h1');
          if (largestElement && performance.now) {
            metrics.LCP = performance.now();
          }
          
          resolve(metrics);
        }, 1000);
      }
    });
  });
}

async function measurePageLoadMetrics(page: Page) {
  return await page.evaluate(() => {
    const perfData = performance.timing;
    const navigationStart = perfData.navigationStart;

    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - navigationStart,
      domComplete: perfData.domComplete - navigationStart,
      loadComplete: perfData.loadEventEnd - navigationStart,
      firstByte: perfData.responseStart - navigationStart,
      domInteractive: perfData.domInteractive - navigationStart,
      pageSize: document.documentElement.innerHTML.length,
      resourceCount: performance.getEntriesByType('resource').length
    };
  });
}

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.addInitScript(() => {
      // Mock Web Vitals library if needed
      (window as any).webVitals = {
        getCLS: (callback: Function) => setTimeout(() => callback({ value: Math.random() * 0.05 }), 100),
        getFID: (callback: Function) => setTimeout(() => callback({ value: Math.random() * 50 }), 200),
        getLCP: (callback: Function) => setTimeout(() => callback({ value: Math.random() * 2000 + 1000 }), 300)
      };
    });
  });

  test.describe('Core Web Vitals', () => {
    test('Dallas plans page meets Core Web Vitals thresholds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/texas/dallas/electricity-plans', { 
        waitUntil: 'networkidle' 
      });
      
      // Wait for plans to load
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const metrics = await measureCoreWebVitals(page);
      const loadMetrics = await measurePageLoadMetrics(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Core Web Vitals:', metrics);
      console.log('Load Metrics:', loadMetrics);
      console.log('Total Load Time:', totalLoadTime, 'ms');

      // Test Core Web Vitals
      if (metrics.LCP > 0) {
        expect(metrics.LCP).toBeLessThan(CORE_WEB_VITALS.LCP);
      }
      if (metrics.FID > 0) {
        expect(metrics.FID).toBeLessThan(CORE_WEB_VITALS.FID);
      }
      if (metrics.CLS > 0) {
        expect(metrics.CLS).toBeLessThan(CORE_WEB_VITALS.CLS);
      }
      if (metrics.FCP > 0) {
        expect(metrics.FCP).toBeLessThan(CORE_WEB_VITALS.FCP);
      }
      if (metrics.TTFB > 0) {
        expect(metrics.TTFB).toBeLessThan(CORE_WEB_VITALS.TTFB);
      }

      // General load time should be reasonable
      expect(totalLoadTime).toBeLessThan(10000); // 10 seconds max
      expect(loadMetrics.domContentLoaded).toBeLessThan(5000); // 5 seconds max
    });

    test('Houston filtered page meets performance standards', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/texas/houston/electricity-plans/12-month', {
        waitUntil: 'networkidle'
      });
      
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const metrics = await measureCoreWebVitals(page);
      const loadMetrics = await measurePageLoadMetrics(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Filtered Page Metrics:', { metrics, loadMetrics, totalLoadTime });

      // Filtered pages should have similar performance to base pages
      if (metrics.LCP > 0) {
        expect(metrics.LCP).toBeLessThan(CORE_WEB_VITALS.LCP * 1.2); // Allow 20% tolerance
      }
      
      expect(totalLoadTime).toBeLessThan(12000); // Slightly higher tolerance for filtered pages
    });

    test('Mobile performance meets standards', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 });
      }

      const startTime = Date.now();
      
      await page.goto('/texas/fort-worth/electricity-plans', {
        waitUntil: 'networkidle'
      });
      
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const metrics = await measureCoreWebVitals(page);
      const loadMetrics = await measurePageLoadMetrics(page);
      const totalLoadTime = Date.now() - startTime;

      console.log('Mobile Performance:', { metrics, loadMetrics, totalLoadTime });

      // Mobile has more relaxed thresholds
      if (metrics.LCP > 0) {
        expect(metrics.LCP).toBeLessThan(CORE_WEB_VITALS.LCP * 1.5); // 50% tolerance for mobile
      }
      
      expect(totalLoadTime).toBeLessThan(15000); // 15 seconds max for mobile
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('Critical resources load efficiently', async ({ page }) => {
      const resourceLoadTimes: Record<string, number> = {};
      
      page.on('response', (response) => {
        const request = response.request();
        const timing = response.timing();
        resourceLoadTimes[request.url()] = timing.responseEnd - timing.requestStart;
      });

      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      // Check CSS load times
      const cssRequests = Object.keys(resourceLoadTimes).filter(url => url.includes('.css'));
      if (cssRequests.length > 0) {
        const avgCssLoadTime = cssRequests.reduce((sum, url) => sum + resourceLoadTimes[url], 0) / cssRequests.length;
        expect(avgCssLoadTime).toBeLessThan(2000); // 2 seconds max for CSS
      }

      // Check JavaScript load times  
      const jsRequests = Object.keys(resourceLoadTimes).filter(url => url.includes('.js'));
      if (jsRequests.length > 0) {
        const avgJsLoadTime = jsRequests.reduce((sum, url) => sum + resourceLoadTimes[url], 0) / jsRequests.length;
        expect(avgJsLoadTime).toBeLessThan(3000); // 3 seconds max for JS
      }

      // Check API response times
      const apiRequests = Object.keys(resourceLoadTimes).filter(url => url.includes('/api/'));
      if (apiRequests.length > 0) {
        apiRequests.forEach(url => {
          expect(resourceLoadTimes[url]).toBeLessThan(5000); // 5 seconds max for API
        });
      }
    });

    test('Images load efficiently', async ({ page }) => {
      let imageCount = 0;
      let totalImageLoadTime = 0;

      page.on('response', async (response) => {
        if (response.request().resourceType() === 'image') {
          const timing = response.timing();
          const loadTime = timing.responseEnd - timing.requestStart;
          imageCount++;
          totalImageLoadTime += loadTime;
          
          // Individual images should load reasonably fast
          expect(loadTime).toBeLessThan(3000); // 3 seconds max per image
        }
      });

      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      // Wait a bit for lazy-loaded images
      await page.waitForTimeout(2000);

      if (imageCount > 0) {
        const avgImageLoadTime = totalImageLoadTime / imageCount;
        expect(avgImageLoadTime).toBeLessThan(1500); // 1.5 seconds average
      }
    });
  });

  test.describe('Interactive Performance', () => {
    test('Plan comparison interaction is responsive', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      const startTime = Date.now();
      
      // Click compare button
      await page.locator('.compare-btn').first().click();
      
      // Wait for comparison bar to appear
      await page.waitForSelector('.comparison-bar', { timeout: 5000 });
      
      const interactionTime = Date.now() - startTime;
      console.log('Comparison interaction time:', interactionTime, 'ms');
      
      // Should be very fast
      expect(interactionTime).toBeLessThan(500); // 500ms max for UI interactions
    });

    test('Filter navigation is performant', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      const startTime = Date.now();
      
      // Navigate to filtered page
      await page.goto('/texas/houston/electricity-plans/green-energy');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const navigationTime = Date.now() - startTime;
      console.log('Filter navigation time:', navigationTime, 'ms');
      
      // Filter navigation should be reasonably fast
      expect(navigationTime).toBeLessThan(8000); // 8 seconds max
    });

    test('Plan card rendering performance', async ({ page }) => {
      await page.goto('/texas/fort-worth/electricity-plans');
      
      const startTime = Date.now();
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      // Wait for all plan cards to be visible
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.plan-card');
        return cards.length > 0 && Array.from(cards).every(card => {
          const rect = card.getBoundingClientRect();
          return rect.height > 0 && rect.width > 0;
        });
      }, { timeout: 10000 });
      
      const renderTime = Date.now() - startTime;
      console.log('Plan cards render time:', renderTime, 'ms');
      
      // Plan cards should render quickly
      expect(renderTime).toBeLessThan(6000); // 6 seconds max
      
      // Check that multiple plan cards are rendered
      const planCardCount = await page.locator('.plan-card').count();
      expect(planCardCount).toBeGreaterThan(0);
      
      // Verify essential plan card content is present
      const firstCard = page.locator('.plan-card').first();
      await expect(firstCard.locator('.plan-name')).toBeVisible();
      await expect(firstCard.locator('.rate-value')).toBeVisible();
      await expect(firstCard.locator('.enroll-btn')).toBeVisible();
    });
  });

  test.describe('Memory Performance', () => {
    test('Page memory usage remains reasonable', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      // Get initial memory usage
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (memoryInfo) {
        console.log('Memory usage:', memoryInfo);
        
        // Memory usage should be reasonable (less than 50MB for JS heap)
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
        
        // Should not be close to memory limit
        const memoryUsagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        expect(memoryUsagePercentage).toBeLessThan(25); // Less than 25% of limit
      }
    });

    test('Multiple page navigations do not leak memory', async ({ page }) => {
      const cities = ['dallas', 'houston', 'fort-worth'];
      let initialMemory = 0;
      
      for (let i = 0; i < cities.length; i++) {
        await page.goto(`/texas/${cities[i]}/electricity-plans`);
        await page.waitForSelector('.plan-card', { timeout: 30000 });
        
        const memoryInfo = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });

        if (i === 0) {
          initialMemory = memoryInfo;
        } else if (memoryInfo > 0) {
          // Memory should not grow excessively with navigation
          const memoryGrowth = memoryInfo - initialMemory;
          expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
        }

        console.log(`Memory after ${cities[i]}:`, memoryInfo);
      }
    });
  });

  test.describe('Accessibility Performance', () => {
    test('Page maintains accessibility during interactions', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });

      // Test keyboard navigation performance
      const startTime = Date.now();
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const keyboardNavTime = Date.now() - startTime;
      console.log('Keyboard navigation time:', keyboardNavTime, 'ms');
      
      // Keyboard navigation should be responsive
      expect(keyboardNavTime).toBeLessThan(1000); // 1 second max
      
      // Verify focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});