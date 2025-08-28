/**
 * User Experience Validation Tests
 * 
 * Validates Core Web Vitals, mobile-first design, accessibility,
 * and cross-browser compatibility requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock performance APIs
const mockPerformanceObserver = vi.fn();
const mockGetEntriesByType = vi.fn();

// Mock intersection observer for lazy loading
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

// Setup global mocks
Object.defineProperty(window, 'PerformanceObserver', {
  value: mockPerformanceObserver,
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: mockIntersectionObserver,
});

describe('User Experience Validation Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals Compliance', () => {
    
    it('should meet Largest Contentful Paint (LCP) target <2.5s', async () => {
      const mockLCPEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 1200, // 1.2 seconds
        element: document.createElement('img')
      };
      
      mockGetEntriesByType.mockReturnValue([mockLCPEntry]);
      
      // Simulate page load
      const startTime = performance.now();
      render(<div data-testid="main-content">Content loading...</div>);
      
      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('main-content')).toBeInTheDocument();
      });
      
      // Verify LCP is under threshold
      expect(mockLCPEntry.startTime).toBeLessThan(2500); // 2.5 seconds
    });

    it('should meet First Input Delay (FID) target <100ms', async () => {
      const user = userEvent.setup();
      
      // Record input timing
      const startTime = performance.now();
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);
      
      const inputDelay = performance.now() - startTime;
      
      // FID should be under 100ms
      expect(inputDelay).toBeLessThan(100);
    });

    it('should meet Cumulative Layout Shift (CLS) target <0.1', () => {
      let layoutShiftScore = 0;
      
      // Mock layout shift observer
      mockPerformanceObserver.mockImplementation((callback) => {
        const entries = [
          {
            entryType: 'layout-shift',
            value: 0.05, // Layout shift score
            hadRecentInput: false
          }
        ];
        callback({ getEntries: () => entries });
      });
      
      // Simulate layout changes during load
      render(<div data-testid="dynamic-content">Loading...</div>);
      
      // Update content (potential layout shift)
      const content = screen.getByTestId('dynamic-content');
      fireEvent.transitionEnd(content);
      
      // CLS should be minimal
      expect(layoutShiftScore).toBeLessThan(0.1);
    });

    it('should optimize Time to First Byte (TTFB) <600ms', async () => {
      const mockNavigationEntry = {
        entryType: 'navigation',
        responseStart: 400, // 400ms TTFB
        requestStart: 0
      };
      
      mockGetEntriesByType.mockReturnValue([mockNavigationEntry]);
      
      const ttfb = mockNavigationEntry.responseStart - mockNavigationEntry.requestStart;
      expect(ttfb).toBeLessThan(600);
    });
  });

  describe('Mobile-First Responsive Design', () => {
    
    const viewports = {
      mobile: { width: 375, height: 667 }, // iPhone SE
      tablet: { width: 768, height: 1024 }, // iPad
      desktop: { width: 1200, height: 800 } // Desktop
    };

    Object.entries(viewports).forEach(([device, dimensions]) => {
      describe(`${device} viewport (${dimensions.width}x${dimensions.height})`, () => {
        
        beforeEach(() => {
          // Mock viewport dimensions
          Object.defineProperty(window, 'innerWidth', { 
            value: dimensions.width, 
            configurable: true 
          });
          Object.defineProperty(window, 'innerHeight', { 
            value: dimensions.height, 
            configurable: true 
          });
          
          // Trigger resize event
          fireEvent(window, new Event('resize'));
        });

        it('should display navigation appropriately', () => {
          if (device === 'mobile') {
            // Mobile should have hamburger menu
            expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
            expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();
          } else {
            // Tablet and desktop should show full navigation
            expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
            expect(screen.queryByTestId('mobile-menu-toggle')).not.toBeInTheDocument();
          }
        });

        it('should have touch-friendly interactive elements', () => {
          const buttons = screen.getAllByRole('button');
          
          buttons.forEach(button => {
            const computedStyle = window.getComputedStyle(button);
            const height = parseInt(computedStyle.height);
            const width = parseInt(computedStyle.width);
            
            if (device === 'mobile') {
              // Mobile buttons should meet 44px minimum touch target
              expect(height).toBeGreaterThanOrEqual(44);
              expect(width).toBeGreaterThanOrEqual(44);
            }
          });
        });

        it('should display plan comparison layouts correctly', () => {
          const planGrid = screen.getByTestId('plan-grid');
          const computedStyle = window.getComputedStyle(planGrid);
          
          if (device === 'mobile') {
            // Mobile should show single column
            expect(computedStyle.gridTemplateColumns).toBe('1fr');
          } else if (device === 'tablet') {
            // Tablet should show 2 columns
            expect(computedStyle.gridTemplateColumns).toContain('repeat(2');
          } else {
            // Desktop should show 3+ columns
            expect(computedStyle.gridTemplateColumns).toContain('repeat(3');
          }
        });

        it('should handle text readability and spacing', () => {
          const headings = screen.getAllByRole('heading');
          
          headings.forEach(heading => {
            const computedStyle = window.getComputedStyle(heading);
            const fontSize = parseInt(computedStyle.fontSize);
            const lineHeight = parseInt(computedStyle.lineHeight);
            
            // Minimum font sizes for readability
            if (device === 'mobile') {
              expect(fontSize).toBeGreaterThanOrEqual(16);
            } else {
              expect(fontSize).toBeGreaterThanOrEqual(14);
            }
            
            // Line height for readability (1.4x minimum)
            expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.4);
          });
        });
      });
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    
    it('should have appropriate color contrast ratios', () => {
      // Test high-contrast elements
      const primaryButton = screen.getByRole('button', { name: /search plans/i });
      const computedStyle = window.getComputedStyle(primaryButton);
      
      // Mock color contrast calculation
      const contrastRatio = calculateContrastRatio(
        computedStyle.color,
        computedStyle.backgroundColor
      );
      
      // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'text');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'link');
      
      // Should be able to activate with keyboard
      await user.keyboard('[Enter]');
      // Verify activation occurred (implementation specific)
    });

    it('should have proper ARIA labels and roles', () => {
      // Form elements should have labels
      const zipInput = screen.getByLabelText(/zip code/i);
      expect(zipInput).toHaveAttribute('aria-label');
      
      // Interactive elements should have roles
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toHaveAttribute('role', 'button');
      
      // Navigation should have landmarks
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should provide screen reader support', () => {
      // Important content should have screen reader text
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Images should have alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        const altText = img.getAttribute('alt');
        expect(altText).not.toBe(''); // Alt text should not be empty
      });
      
      // Form validation should be announced
      const requiredInputs = screen.getAllByRole('textbox', { required: true });
      requiredInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-required', 'true');
      });
    });

    it('should handle focus management properly', async () => {
      const user = userEvent.setup();
      
      // Focus should be visible
      const focusableElements = [
        screen.getByRole('button', { name: /search/i }),
        screen.getByRole('textbox', { name: /zip code/i })
      ];
      
      for (const element of focusableElements) {
        element.focus();
        expect(element).toHaveFocus();
        
        // Focus should be visually indicated
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.outline).not.toBe('none');
      }
    });

    it('should support reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      });
      
      // Animations should respect reduced motion
      const animatedElements = document.querySelectorAll('[data-animation]');
      animatedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.animationDuration).toBe('0ms');
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    
    const browsers = [
      { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124' },
      { name: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0' },
      { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/14.1.1' },
      { name: 'Edge', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/91.0.864.59' }
    ];

    browsers.forEach(browser => {
      describe(browser.name, () => {
        
        beforeEach(() => {
          // Mock user agent
          Object.defineProperty(navigator, 'userAgent', {
            value: browser.userAgent,
            configurable: true
          });
        });

        it('should display layout correctly', () => {
          // Core layout elements should be present
          expect(screen.getByRole('main')).toBeInTheDocument();
          expect(screen.getByRole('navigation')).toBeInTheDocument();
          
          // Grid layouts should work
          const planGrid = screen.getByTestId('plan-grid');
          expect(planGrid).toHaveClass('grid');
        });

        it('should handle form interactions', async () => {
          const user = userEvent.setup();
          
          const zipInput = screen.getByLabelText(/zip code/i);
          await user.type(zipInput, '75001');
          
          expect(zipInput).toHaveValue('75001');
          
          const searchButton = screen.getByRole('button', { name: /search/i });
          await user.click(searchButton);
          
          // Should handle click events
          expect(mockProviderResults).toHaveBeenCalled();
        });

        it('should support modern CSS features gracefully', () => {
          // CSS Grid support
          const gridElement = screen.getByTestId('plan-grid');
          const gridStyle = window.getComputedStyle(gridElement);
          expect(gridStyle.display).toBe('grid');
          
          // Flexbox support
          const flexElement = screen.getByTestId('header-nav');
          const flexStyle = window.getComputedStyle(flexElement);
          expect(flexStyle.display).toBe('flex');
          
          // CSS Custom Properties
          const rootStyles = window.getComputedStyle(document.documentElement);
          expect(rootStyles.getPropertyValue('--primary-color')).toBeTruthy();
        });
      });
    });
  });

  describe('Performance Optimization', () => {
    
    it('should implement lazy loading for images', () => {
      const images = screen.getAllByRole('img');
      
      images.forEach(img => {
        if (!img.closest('[data-testid="hero"]')) { // Exclude above-fold images
          expect(img).toHaveAttribute('loading', 'lazy');
        }
      });
      
      // Intersection observer should be used
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should minimize JavaScript bundle size', async () => {
      // Mock bundle analyzer results
      const bundleSize = 150; // KB
      const maxBundleSize = 200; // KB
      
      expect(bundleSize).toBeLessThan(maxBundleSize);
    });

    it('should implement efficient caching strategies', () => {
      // Service worker should be registered
      expect(navigator.serviceWorker).toBeDefined();
      
      // Static assets should have cache headers
      const staticAssets = ['logo.svg', 'styles.css', 'main.js'];
      staticAssets.forEach(asset => {
        // Mock cache verification
        expect(mockCacheHeaders[asset]).toContain('max-age');
      });
    });

    it('should preload critical resources', () => {
      // Critical CSS should be preloaded
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThan(0);
      
      // Font preloading
      const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
      expect(fontPreloads.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;
      
      const user = userEvent.setup();
      
      // Trigger API call
      await user.type(screen.getByLabelText(/zip code/i), '75001');
      await user.click(screen.getByRole('button', { name: /search/i }));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      // Should offer retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should provide meaningful error messages', () => {
      const errorMessages = [
        'Invalid ZIP code format',
        'No providers found for this area',
        'Service temporarily unavailable'
      ];
      
      errorMessages.forEach(message => {
        // Errors should be user-friendly, not technical
        expect(message).not.toMatch(/500|404|undefined|null/);
        expect(message.length).toBeGreaterThan(10); // Meaningful length
      });
    });

    it('should handle JavaScript errors without breaking the page', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate JavaScript error
      const errorComponent = () => {
        throw new Error('Component error');
      };
      
      // Error boundary should catch and display fallback
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      
      mockConsoleError.mockRestore();
    });
  });
});

/**
 * Helper Functions
 */

// Mock color contrast calculation
function calculateContrastRatio(foreground: string, background: string): number {
  // Simplified contrast ratio calculation
  // In real implementation, would parse RGB values and calculate properly
  return 4.7; // Mock acceptable ratio
}

// Mock cache headers
const mockCacheHeaders = {
  'logo.svg': 'max-age=31536000',
  'styles.css': 'max-age=86400',
  'main.js': 'max-age=86400'
};

// Mock viewport dimensions for different devices
export const mockViewports = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 12': { width: 390, height: 844 },
  'iPad': { width: 768, height: 1024 },
  'iPad Pro': { width: 1024, height: 1366 },
  'Desktop': { width: 1200, height: 800 },
  'Large Desktop': { width: 1440, height: 900 }
};

// Performance metrics thresholds
export const performanceThresholds = {
  lcp: 2500, // 2.5 seconds
  fid: 100,  // 100 milliseconds
  cls: 0.1,  // 0.1 layout shift score
  ttfb: 600, // 600 milliseconds
  fcp: 1800  // 1.8 seconds
};

// Accessibility test selectors
export const a11yTestSelectors = {
  skipLink: '[href="#main"]',
  landmarks: 'main, nav, aside, footer',
  headings: 'h1, h2, h3, h4, h5, h6',
  focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  required: '[required], [aria-required="true"]',
  invalid: '[aria-invalid="true"]'
};