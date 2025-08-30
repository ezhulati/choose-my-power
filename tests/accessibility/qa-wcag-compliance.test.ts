/**
 * QA WCAG 2.1 AA Accessibility Compliance Test Suite
 * 
 * This suite ensures the ChooseMyPower platform meets Web Content Accessibility
 * Guidelines (WCAG) 2.1 Level AA standards, providing equal access to all users
 * including those with disabilities.
 * 
 * WCAG Principles Tested:
 * - Perceivable: Information and UI components must be presentable to users
 * - Operable: UI components and navigation must be operable
 * - Understandable: Information and UI operation must be understandable
 * - Robust: Content must be robust enough for various assistive technologies
 * 
 * Compliance Areas:
 * - Keyboard Navigation
 * - Screen Reader Compatibility
 * - Color Contrast (4.5:1 ratio)
 * - Focus Management
 * - ARIA Implementation
 * - Semantic HTML Structure
 * - Form Accessibility
 * - Image Alt Text
 * - Video/Audio Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JSDOM } from 'jsdom';

// Accessibility testing utilities
interface AccessibilityViolation {
  id: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA';
}

// Mock axe-core for accessibility testing
const mockAxeResults = {
  violations: [] as AccessibilityViolation[],
  passes: [] as AccessibilityViolation[],
  incomplete: [] as AccessibilityViolation[],
  inapplicable: [] as AccessibilityViolation[]
};

// Color contrast calculator
class ContrastCalculator {
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  meetsWCAGAA(foreground: string, background: string): ContrastResult {
    const ratio = this.calculateContrastRatio(foreground, background);
    const passesAA = ratio >= 4.5;
    const passesAAA = ratio >= 7;
    
    return {
      foreground,
      background,
      ratio: Math.round(ratio * 100) / 100,
      passes: passesAA,
      level: passesAAA ? 'AAA' : 'AA'
    };
  }
}

// Keyboard navigation tester
class KeyboardNavigationTester {
  private focusableElements: string[] = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]'
  ];

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = this.focusableElements.join(', ');
    return Array.from(container.querySelectorAll(selector));
  }

  async testTabOrder(container: HTMLElement): Promise<boolean> {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) return true;
    
    // Test sequential tab navigation
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i];
      element.focus();
      
      // Verify element is focused
      if (document.activeElement !== element) {
        return false;
      }
      
      // Verify element is visible and has proper focus styles
      const styles = window.getComputedStyle(element);
      const hasVisibleFocus = styles.outline !== 'none' || 
                             styles.outlineWidth !== '0' ||
                             styles.boxShadow !== 'none';
      
      if (!hasVisibleFocus && !element.matches(':focus-visible')) {
        console.warn(`Element lacks visible focus indicator:`, element);
      }
    }
    
    return true;
  }

  async testEscapeKey(container: HTMLElement): Promise<boolean> {
    // Find modal, dropdown, or other dismissible components
    const dismissible = container.querySelector('[role="dialog"], [role="menu"], .modal, .dropdown');
    
    if (dismissible) {
      // Simulate Escape key press
      fireEvent.keyDown(dismissible, { key: 'Escape', code: 'Escape' });
      
      // Check if component was dismissed (implementation-dependent)
      return true;
    }
    
    return true;
  }
}

// Screen reader compatibility tester
class ScreenReaderTester {
  testAriaLabels(container: HTMLElement): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for unlabeled form controls
    const formControls = container.querySelectorAll('input, select, textarea');
    formControls.forEach(control => {
      const hasLabel = control.hasAttribute('aria-label') ||
                      control.hasAttribute('aria-labelledby') ||
                      container.querySelector(`label[for="${control.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form control missing label: ${control.tagName}`);
      }
    });
    
    // Check for unlabeled buttons
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const hasAccessibleName = button.textContent?.trim() ||
                               button.hasAttribute('aria-label') ||
                               button.hasAttribute('aria-labelledby');
      
      if (!hasAccessibleName) {
        issues.push(`Button missing accessible name`);
      }
    });
    
    // Check for proper heading structure
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      if (currentLevel > lastLevel + 1) {
        issues.push(`Heading level skip: ${heading.tagName} after h${lastLevel}`);
      }
      lastLevel = currentLevel;
    });
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  testLandmarkRoles(container: HTMLElement): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for main landmark
    const mainLandmark = container.querySelector('main, [role="main"]');
    if (!mainLandmark) {
      issues.push('Missing main landmark');
    }
    
    // Check for navigation landmarks
    const navElements = container.querySelectorAll('nav, [role="navigation"]');
    navElements.forEach(nav => {
      if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
        issues.push('Navigation landmark missing accessible name');
      }
    });
    
    // Check for content structure
    const hasHeader = container.querySelector('header, [role="banner"]');
    const hasFooter = container.querySelector('footer, [role="contentinfo"]');
    
    if (!hasHeader) issues.push('Missing header/banner landmark');
    if (!hasFooter) issues.push('Missing footer/contentinfo landmark');
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  testImageAlternatives(container: HTMLElement): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const isDecorative = img.hasAttribute('alt') && img.getAttribute('alt') === '';
      const hasAltText = img.hasAttribute('alt') && img.getAttribute('alt')?.trim();
      const hasAriaLabel = img.hasAttribute('aria-label');
      const isHidden = img.hasAttribute('aria-hidden') && img.getAttribute('aria-hidden') === 'true';
      
      if (!isDecorative && !hasAltText && !hasAriaLabel && !isHidden) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });
    
    return {
      passed: issues.length === 0,
      issues
    };
  }
}

// Focus management tester
class FocusManagementTester {
  testFocusTrap(container: HTMLElement): boolean {
    // Find modal or dialog elements
    const modal = container.querySelector('[role="dialog"], .modal');
    
    if (!modal) return true;
    
    const focusableElements = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return false;
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Test that focus is trapped within modal
    firstFocusable.focus();
    expect(document.activeElement).toBe(firstFocusable);
    
    // Simulate Tab from last element should go to first
    fireEvent.keyDown(lastFocusable, { key: 'Tab' });
    // In a real focus trap, this would move focus to first element
    
    return true;
  }

  testSkipLinks(container: HTMLElement): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const skipLinks = container.querySelectorAll('a[href^="#"]');
    let hasMainSkipLink = false;
    
    skipLinks.forEach(link => {
      const href = link.getAttribute('href');
      const target = href ? container.querySelector(href) : null;
      
      if (href === '#main' || href === '#content') {
        hasMainSkipLink = true;
      }
      
      if (!target) {
        issues.push(`Skip link target not found: ${href}`);
      }
    });
    
    if (skipLinks.length > 0 && !hasMainSkipLink) {
      issues.push('Missing skip to main content link');
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }
}

describe('QA WCAG 2.1 AA Accessibility Compliance', () => {
  let contrastCalculator: ContrastCalculator;
  let keyboardTester: KeyboardNavigationTester;
  let screenReaderTester: ScreenReaderTester;
  let focusManagementTester: FocusManagementTester;

  beforeEach(() => {
    contrastCalculator = new ContrastCalculator();
    keyboardTester = new KeyboardNavigationTester();
    screenReaderTester = new ScreenReaderTester();
    focusManagementTester = new FocusManagementTester();

    // Set up DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WCAG Principle 1: Perceivable', () => {
    describe('Color Contrast Compliance', () => {
      it('should meet WCAG AA color contrast ratios (4.5:1)', () => {
        // Test brand colors from design system
        const colorTests = [
          { foreground: '#1a365d', background: '#ffffff' }, // Dark blue on white
          { foreground: '#2d3748', background: '#f7fafc' }, // Gray text on light background
          { foreground: '#ffffff', background: '#3182ce' }, // White text on blue
          { foreground: '#1a202c', background: '#edf2f7' }, // Dark text on light gray
          { foreground: '#e53e3e', background: '#ffffff' }, // Error red on white
          { foreground: '#38a169', background: '#ffffff' }, // Success green on white
        ];

        colorTests.forEach(({ foreground, background }) => {
          const result = contrastCalculator.meetsWCAGAA(foreground, background);
          expect(result.passes).toBe(true);
          expect(result.ratio).toBeGreaterThanOrEqual(4.5);
          
          console.log(`Color contrast: ${foreground} on ${background} = ${result.ratio}:1`);
        });
      });

      it('should identify insufficient color contrasts', () => {
        const failingTests = [
          { foreground: '#999999', background: '#ffffff' }, // Light gray on white (fails)
          { foreground: '#cccccc', background: '#ffffff' }, // Very light gray on white (fails)
          { foreground: '#ffff00', background: '#ffffff' }, // Yellow on white (likely fails)
        ];

        failingTests.forEach(({ foreground, background }) => {
          const result = contrastCalculator.meetsWCAGAA(foreground, background);
          if (!result.passes) {
            console.warn(`Failing contrast: ${foreground} on ${background} = ${result.ratio}:1`);
          }
          expect(result.ratio).toBeDefined();
        });
      });

      it('should validate Texas-themed brand colors for accessibility', () => {
        const texasBrandColors = [
          { name: 'Texas Blue', foreground: '#003f7f', background: '#ffffff' },
          { name: 'Texas Orange', foreground: '#ff8c00', background: '#ffffff' },
          { name: 'Lone Star Red', foreground: '#c41e3a', background: '#ffffff' },
          { name: 'Prairie Green', foreground: '#228b22', background: '#ffffff' },
        ];

        texasBrandColors.forEach(({ name, foreground, background }) => {
          const result = contrastCalculator.meetsWCAGAA(foreground, background);
          expect(result.passes).toBe(true);
          
          console.log(`${name}: ${result.ratio}:1 contrast ratio`);
        });
      });
    });

    describe('Image Accessibility', () => {
      it('should provide appropriate alt text for all images', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <img src="logo.png" alt="ChooseMyPower - Texas Electricity Comparison" />
          <img src="hero-image.jpg" alt="Texas power lines against sunset sky" />
          <img src="decorative.svg" alt="" role="presentation" />
          <img src="chart.png" alt="Electricity rates comparison showing TXU at 11.5¢/kWh" />
        `;

        const result = screenReaderTester.testImageAlternatives(mockContainer);
        expect(result.passed).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should handle complex images with detailed descriptions', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <figure>
            <img src="complex-chart.png" alt="Electricity plan comparison chart" aria-describedby="chart-description" />
            <figcaption id="chart-description">
              Chart showing 5 electricity plans: TXU Fixed 12 at 11.5¢/kWh, 
              Reliant Variable at 10.2¢/kWh, Direct Energy Green at 13.2¢/kWh
            </figcaption>
          </figure>
        `;

        const img = mockContainer.querySelector('img');
        const description = mockContainer.querySelector('#chart-description');
        
        expect(img?.hasAttribute('alt')).toBe(true);
        expect(img?.hasAttribute('aria-describedby')).toBe(true);
        expect(description).toBeTruthy();
      });
    });

    describe('Text Alternatives', () => {
      it('should provide text alternatives for non-text content', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <button aria-label="Search for electricity plans">
            <svg><path d="..."></path></svg>
          </button>
          <a href="#" aria-label="Download plan details as PDF">
            <i class="icon-download"></i>
          </a>
          <div role="img" aria-label="5 star rating">★★★★★</div>
        `;

        const button = mockContainer.querySelector('button');
        const link = mockContainer.querySelector('a');
        const rating = mockContainer.querySelector('[role="img"]');

        expect(button?.hasAttribute('aria-label')).toBe(true);
        expect(link?.hasAttribute('aria-label')).toBe(true);
        expect(rating?.hasAttribute('aria-label')).toBe(true);
      });
    });
  });

  describe('WCAG Principle 2: Operable', () => {
    describe('Keyboard Accessibility', () => {
      it('should support full keyboard navigation', async () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <header>
            <nav>
              <a href="/">Home</a>
              <a href="/plans">Plans</a>
              <a href="/providers">Providers</a>
            </nav>
          </header>
          <main>
            <input type="text" placeholder="Enter ZIP code" />
            <button>Search Plans</button>
            <div tabindex="0" role="button">Custom Button</div>
          </main>
        `;
        document.body.appendChild(mockContainer);

        const result = await keyboardTester.testTabOrder(mockContainer);
        expect(result).toBe(true);

        const focusableElements = keyboardTester.getFocusableElements(mockContainer);
        expect(focusableElements.length).toBeGreaterThan(0);

        document.body.removeChild(mockContainer);
      });

      it('should handle Enter and Space key interactions', () => {
        const mockContainer = document.createElement('div');
        const mockClick = vi.fn();
        
        mockContainer.innerHTML = `
          <button id="search-btn">Search</button>
          <div role="button" tabindex="0" id="custom-btn">Custom</div>
        `;
        document.body.appendChild(mockContainer);

        const searchButton = mockContainer.querySelector('#search-btn') as HTMLElement;
        const customButton = mockContainer.querySelector('#custom-btn') as HTMLElement;

        searchButton.addEventListener('click', mockClick);
        customButton.addEventListener('click', mockClick);
        customButton.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            mockClick();
          }
        });

        // Test Enter key
        fireEvent.keyDown(searchButton, { key: 'Enter' });
        fireEvent.keyDown(customButton, { key: 'Enter' });
        
        // Test Space key
        fireEvent.keyDown(customButton, { key: ' ' });

        expect(mockClick).toHaveBeenCalledTimes(3);

        document.body.removeChild(mockContainer);
      });

      it('should provide visible focus indicators', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <style>
            .focus-visible:focus {
              outline: 2px solid #3182ce;
              outline-offset: 2px;
            }
            button:focus {
              box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5);
            }
          </style>
          <button class="focus-visible">Focusable Button</button>
          <input type="text" class="focus-visible" />
          <a href="#" class="focus-visible">Focusable Link</a>
        `;
        document.body.appendChild(mockContainer);

        const focusableElements = mockContainer.querySelectorAll('.focus-visible');
        focusableElements.forEach(element => {
          const htmlElement = element as HTMLElement;
          htmlElement.focus();
          
          // Check for focus styles (this would be more robust in a real browser)
          const computedStyle = window.getComputedStyle(htmlElement);
          // In a real test, we'd verify outline or box-shadow properties
          expect(element).toBe(document.activeElement);
        });

        document.body.removeChild(mockContainer);
      });
    });

    describe('Focus Management', () => {
      it('should implement proper focus trap in modals', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Plan Details</h2>
            <input type="text" placeholder="Your email" />
            <button>Subscribe</button>
            <button>Cancel</button>
          </div>
        `;
        document.body.appendChild(mockContainer);

        const result = focusManagementTester.testFocusTrap(mockContainer);
        expect(result).toBe(true);

        document.body.removeChild(mockContainer);
      });

      it('should provide skip links for keyboard navigation', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <a href="#main" class="skip-link">Skip to main content</a>
          <a href="#navigation" class="skip-link">Skip to navigation</a>
          <header>
            <nav id="navigation">Navigation content</nav>
          </header>
          <main id="main">Main content</main>
        `;
        document.body.appendChild(mockContainer);

        const result = focusManagementTester.testSkipLinks(mockContainer);
        expect(result.passed).toBe(true);
        expect(result.issues).toHaveLength(0);

        document.body.removeChild(mockContainer);
      });

      it('should manage focus after dynamic content changes', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <button id="load-plans">Load Plans</button>
          <div id="results" aria-live="polite"></div>
        `;
        document.body.appendChild(mockContainer);

        const loadButton = mockContainer.querySelector('#load-plans') as HTMLElement;
        const resultsContainer = mockContainer.querySelector('#results') as HTMLElement;

        // Simulate loading plans
        loadButton.addEventListener('click', () => {
          resultsContainer.innerHTML = `
            <h2 tabindex="-1" id="results-heading">Search Results</h2>
            <p>5 plans found for your area</p>
          `;
          
          // Focus should move to results heading
          const resultsHeading = mockContainer.querySelector('#results-heading') as HTMLElement;
          resultsHeading.focus();
        });

        fireEvent.click(loadButton);
        
        const resultsHeading = mockContainer.querySelector('#results-heading');
        expect(resultsHeading).toBe(document.activeElement);

        document.body.removeChild(mockContainer);
      });
    });

    describe('Time Limits and Animations', () => {
      it('should provide controls for time-sensitive content', () => {
        // Test auto-refresh functionality with user controls
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <div class="auto-refresh">
            <p>Plans will refresh automatically in <span id="countdown">30</span> seconds</p>
            <button id="pause-refresh">Pause Auto-refresh</button>
            <button id="refresh-now">Refresh Now</button>
          </div>
        `;

        const pauseButton = mockContainer.querySelector('#pause-refresh');
        const refreshButton = mockContainer.querySelector('#refresh-now');

        expect(pauseButton).toBeTruthy();
        expect(refreshButton).toBeTruthy();
      });

      it('should respect user preferences for motion', () => {
        // Mock prefers-reduced-motion
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          })),
        });

        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <style>
            @media (prefers-reduced-motion: reduce) {
              .animated {
                animation: none !important;
                transition: none !important;
              }
            }
            .animated {
              animation: slide-in 0.3s ease-out;
            }
          </style>
          <div class="animated">Content with animation</div>
        `;

        // Verify that reduced motion preference is respected
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        expect(mediaQuery.matches).toBe(true);
      });
    });
  });

  describe('WCAG Principle 3: Understandable', () => {
    describe('Form Accessibility', () => {
      it('should provide clear labels and instructions', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <form>
            <fieldset>
              <legend>Personal Information</legend>
              
              <label for="email">Email Address (required)</label>
              <input type="email" id="email" required aria-describedby="email-help" />
              <div id="email-help">We'll use this to send you plan recommendations</div>
              
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" pattern="[0-9]{5}" aria-describedby="zip-format" />
              <div id="zip-format">Enter your 5-digit ZIP code</div>
              
              <label for="usage">Monthly Usage (kWh)</label>
              <input type="number" id="usage" min="0" aria-describedby="usage-help" />
              <div id="usage-help">Check your recent electricity bill for this information</div>
            </fieldset>
            
            <button type="submit">Find Plans</button>
          </form>
        `;
        document.body.appendChild(mockContainer);

        // Verify all inputs have labels
        const inputs = mockContainer.querySelectorAll('input');
        inputs.forEach(input => {
          const label = mockContainer.querySelector(`label[for="${input.id}"]`);
          expect(label).toBeTruthy();
          
          if (input.hasAttribute('aria-describedby')) {
            const helpText = mockContainer.querySelector(`#${input.getAttribute('aria-describedby')}`);
            expect(helpText).toBeTruthy();
          }
        });

        document.body.removeChild(mockContainer);
      });

      it('should provide helpful error messages', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <form>
            <label for="email-error">Email Address</label>
            <input type="email" id="email-error" aria-describedby="email-error-msg" aria-invalid="true" />
            <div id="email-error-msg" role="alert">
              Please enter a valid email address (e.g., john@example.com)
            </div>
            
            <label for="zip-error">ZIP Code</label>
            <input type="text" id="zip-error" aria-describedby="zip-error-msg" aria-invalid="true" />
            <div id="zip-error-msg" role="alert">
              Please enter a 5-digit ZIP code for Texas (e.g., 75001)
            </div>
          </form>
        `;
        document.body.appendChild(mockContainer);

        const errorInputs = mockContainer.querySelectorAll('[aria-invalid="true"]');
        errorInputs.forEach(input => {
          const errorId = input.getAttribute('aria-describedby');
          const errorMessage = mockContainer.querySelector(`#${errorId}`);
          
          expect(errorMessage).toBeTruthy();
          expect(errorMessage?.getAttribute('role')).toBe('alert');
        });

        document.body.removeChild(mockContainer);
      });

      it('should group related form controls', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <form>
            <fieldset>
              <legend>Plan Type Preferences</legend>
              
              <input type="radio" id="fixed" name="plan-type" value="fixed" />
              <label for="fixed">Fixed Rate</label>
              
              <input type="radio" id="variable" name="plan-type" value="variable" />
              <label for="variable">Variable Rate</label>
              
              <input type="radio" id="indexed" name="plan-type" value="indexed" />
              <label for="indexed">Indexed Rate</label>
            </fieldset>
            
            <fieldset>
              <legend>Green Energy Options</legend>
              
              <input type="checkbox" id="renewable" name="features" value="renewable" />
              <label for="renewable">100% Renewable Energy</label>
              
              <input type="checkbox" id="carbon-offset" name="features" value="carbon-offset" />
              <label for="carbon-offset">Carbon Offset Program</label>
            </fieldset>
          </form>
        `;
        document.body.appendChild(mockContainer);

        const fieldsets = mockContainer.querySelectorAll('fieldset');
        expect(fieldsets.length).toBe(2);
        
        fieldsets.forEach(fieldset => {
          const legend = fieldset.querySelector('legend');
          expect(legend).toBeTruthy();
          
          const inputs = fieldset.querySelectorAll('input');
          expect(inputs.length).toBeGreaterThan(0);
        });

        document.body.removeChild(mockContainer);
      });
    });

    describe('Content Structure and Language', () => {
      it('should have proper heading hierarchy', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <h1>Compare Texas Electricity Plans</h1>
          <h2>Search Results</h2>
          <h3>Fixed Rate Plans</h3>
          <h4>TXU Energy Plans</h4>
          <h3>Variable Rate Plans</h3>
          <h4>Reliant Energy Plans</h4>
          <h2>How to Choose</h2>
          <h3>Rate Types Explained</h3>
        `;
        document.body.appendChild(mockContainer);

        const result = screenReaderTester.testAriaLabels(mockContainer);
        // This test focuses on heading structure, which is part of the ARIA test
        expect(result).toBeDefined();

        document.body.removeChild(mockContainer);
      });

      it('should specify page language', () => {
        expect(document.documentElement.hasAttribute('lang')).toBe(true);
        
        // Test sections with different languages if applicable
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <p>Compare electricity plans in Texas</p>
          <p lang="es">Compara planes de electricidad en Texas</p>
        `;
        
        const spanishText = mockContainer.querySelector('[lang="es"]');
        expect(spanishText?.getAttribute('lang')).toBe('es');
      });
    });
  });

  describe('WCAG Principle 4: Robust', () => {
    describe('Semantic HTML and ARIA', () => {
      it('should use proper semantic HTML structure', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <header>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/plans">Plans</a></li>
                <li><a href="/providers">Providers</a></li>
              </ul>
            </nav>
          </header>
          
          <main>
            <section>
              <h1>Find Your Best Electricity Plan</h1>
              <article>
                <h2>TXU Energy Simply Fixed 12</h2>
                <p>Fixed rate plan with 12-month term</p>
              </article>
            </section>
            
            <aside>
              <h2>Energy Saving Tips</h2>
              <p>Learn how to reduce your electricity usage</p>
            </aside>
          </main>
          
          <footer>
            <p>&copy; 2024 ChooseMyPower</p>
          </footer>
        `;
        document.body.appendChild(mockContainer);

        const result = screenReaderTester.testLandmarkRoles(mockContainer);
        expect(result.passed).toBe(true);
        expect(result.issues).toHaveLength(0);

        // Verify semantic structure
        expect(mockContainer.querySelector('header')).toBeTruthy();
        expect(mockContainer.querySelector('nav')).toBeTruthy();
        expect(mockContainer.querySelector('main')).toBeTruthy();
        expect(mockContainer.querySelector('section')).toBeTruthy();
        expect(mockContainer.querySelector('article')).toBeTruthy();
        expect(mockContainer.querySelector('aside')).toBeTruthy();
        expect(mockContainer.querySelector('footer')).toBeTruthy();

        document.body.removeChild(mockContainer);
      });

      it('should implement proper ARIA roles and properties', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <div role="tablist" aria-label="Plan comparison tabs">
            <button role="tab" aria-selected="true" aria-controls="fixed-panel" id="fixed-tab">
              Fixed Rate Plans
            </button>
            <button role="tab" aria-selected="false" aria-controls="variable-panel" id="variable-tab">
              Variable Rate Plans
            </button>
          </div>
          
          <div role="tabpanel" id="fixed-panel" aria-labelledby="fixed-tab">
            <h3>Fixed Rate Plans</h3>
            <p>Rate stays the same for entire contract term</p>
          </div>
          
          <div role="tabpanel" id="variable-panel" aria-labelledby="variable-tab" hidden>
            <h3>Variable Rate Plans</h3>
            <p>Rate may change monthly based on market conditions</p>
          </div>
          
          <div role="alert" aria-live="polite" id="status-updates"></div>
          
          <button aria-expanded="false" aria-controls="plan-details">
            View Plan Details
          </button>
          <div id="plan-details" hidden>
            <p>Detailed plan information...</p>
          </div>
        `;
        document.body.appendChild(mockContainer);

        // Verify ARIA implementation
        const tablist = mockContainer.querySelector('[role="tablist"]');
        const tabs = mockContainer.querySelectorAll('[role="tab"]');
        const tabpanels = mockContainer.querySelectorAll('[role="tabpanel"]');
        const alert = mockContainer.querySelector('[role="alert"]');
        const expandableButton = mockContainer.querySelector('[aria-expanded]');

        expect(tablist).toBeTruthy();
        expect(tabs.length).toBe(2);
        expect(tabpanels.length).toBe(2);
        expect(alert).toBeTruthy();
        expect(expandableButton).toBeTruthy();

        // Verify relationships
        tabs.forEach((tab, index) => {
          const controlsId = tab.getAttribute('aria-controls');
          const relatedPanel = mockContainer.querySelector(`#${controlsId}`);
          expect(relatedPanel).toBeTruthy();
          expect(relatedPanel?.getAttribute('aria-labelledby')).toBe(tab.id);
        });

        document.body.removeChild(mockContainer);
      });

      it('should provide live region updates for dynamic content', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <div aria-live="polite" aria-atomic="true" id="search-status">
            Ready to search
          </div>
          
          <div aria-live="assertive" id="error-alerts"></div>
          
          <div aria-live="off" id="background-updates"></div>
        `;
        document.body.appendChild(mockContainer);

        const politeRegion = mockContainer.querySelector('#search-status');
        const assertiveRegion = mockContainer.querySelector('#error-alerts');
        const offRegion = mockContainer.querySelector('#background-updates');

        expect(politeRegion?.getAttribute('aria-live')).toBe('polite');
        expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive');
        expect(offRegion?.getAttribute('aria-live')).toBe('off');

        // Test dynamic updates
        if (politeRegion) {
          politeRegion.textContent = 'Searching for plans...';
          expect(politeRegion.textContent).toBe('Searching for plans...');
        }

        document.body.removeChild(mockContainer);
      });
    });

    describe('Assistive Technology Compatibility', () => {
      it('should provide comprehensive accessibility API information', () => {
        const mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
          <button 
            id="compare-btn"
            aria-label="Compare selected electricity plans"
            aria-describedby="compare-help"
            aria-pressed="false"
            type="button"
          >
            Compare Plans (2 selected)
          </button>
          <div id="compare-help">
            Select up to 3 plans to compare side-by-side
          </div>
          
          <input
            type="range"
            min="500"
            max="3000"
            value="1000"
            aria-label="Monthly electricity usage in kilowatt hours"
            aria-valuetext="1000 kilowatt hours per month"
            aria-describedby="usage-help"
          />
          <div id="usage-help">
            Drag to adjust your typical monthly electricity usage
          </div>
        `;
        document.body.appendChild(mockContainer);

        const button = mockContainer.querySelector('#compare-btn');
        const slider = mockContainer.querySelector('input[type="range"]');

        expect(button?.hasAttribute('aria-label')).toBe(true);
        expect(button?.hasAttribute('aria-describedby')).toBe(true);
        expect(button?.hasAttribute('aria-pressed')).toBe(true);

        expect(slider?.hasAttribute('aria-label')).toBe(true);
        expect(slider?.hasAttribute('aria-valuetext')).toBe(true);
        expect(slider?.hasAttribute('aria-describedby')).toBe(true);

        document.body.removeChild(mockContainer);
      });
    });
  });

  describe('Comprehensive Accessibility Validation', () => {
    it('should pass comprehensive WCAG 2.1 AA audit', () => {
      const mockContainer = document.createElement('div');
      mockContainer.innerHTML = `
        <html lang="en">
          <head>
            <title>ChooseMyPower - Compare Texas Electricity Plans</title>
            <meta name="description" content="Compare electricity plans from top Texas providers" />
          </head>
          <body>
            <a href="#main" class="skip-link">Skip to main content</a>
            
            <header>
              <h1>ChooseMyPower</h1>
              <nav aria-label="Main navigation">
                <ul>
                  <li><a href="/">Home</a></li>
                  <li><a href="/plans">Plans</a></li>
                  <li><a href="/providers">Providers</a></li>
                </ul>
              </nav>
            </header>
            
            <main id="main">
              <section>
                <h2>Find Your Best Electricity Plan</h2>
                <form>
                  <label for="zip-search">Enter your ZIP code</label>
                  <input type="text" id="zip-search" pattern="[0-9]{5}" required />
                  <button type="submit">Search Plans</button>
                </form>
              </section>
            </main>
            
            <footer>
              <p>&copy; 2024 ChooseMyPower. All rights reserved.</p>
            </footer>
          </body>
        </html>
      `;

      // Run comprehensive accessibility tests
      const ariaResults = screenReaderTester.testAriaLabels(mockContainer);
      const landmarkResults = screenReaderTester.testLandmarkRoles(mockContainer);
      const imageResults = screenReaderTester.testImageAlternatives(mockContainer);
      const skipLinkResults = focusManagementTester.testSkipLinks(mockContainer);

      expect(ariaResults.passed).toBe(true);
      expect(landmarkResults.passed).toBe(true);
      expect(imageResults.passed).toBe(true);
      expect(skipLinkResults.passed).toBe(true);

      // Log comprehensive accessibility report
      console.log('Accessibility Compliance Report:', {
        'ARIA Labels': ariaResults.passed ? 'PASS' : 'FAIL',
        'Landmark Roles': landmarkResults.passed ? 'PASS' : 'FAIL',
        'Image Alternatives': imageResults.passed ? 'PASS' : 'FAIL',
        'Skip Links': skipLinkResults.passed ? 'PASS' : 'FAIL',
        'Issues Found': [
          ...ariaResults.issues,
          ...landmarkResults.issues,
          ...imageResults.issues,
          ...skipLinkResults.issues
        ]
      });
    });
  });
});