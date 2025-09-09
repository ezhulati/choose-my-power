/**
 * WCAG 2.1 Compliance Service for ZIP Navigation
 * Task T034: Accessibility compliance implementation
 * Phase 3.5 Polish & Validation: WCAG 2.1 AA compliance
 */

export interface AccessibilityConfig {
  level: 'A' | 'AA' | 'AAA';
  colorContrast: {
    normalText: number;
    largeText: number;
  };
  focusManagement: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  touchTargetSize: number; // Minimum size in pixels
}

export interface ColorContrastResult {
  ratio: number;
  passes: boolean;
  level: 'A' | 'AA' | 'AAA' | 'fail';
  recommendation?: string;
}

export interface AccessibilityViolation {
  type: 'color-contrast' | 'focus-management' | 'keyboard-navigation' | 'aria-labels' | 'touch-targets';
  severity: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  recommendation: string;
  wcagRule: string;
}

export class WCAGComplianceService {
  private config: AccessibilityConfig = {
    level: 'AA',
    colorContrast: {
      normalText: 4.5, // WCAG AA requirement
      largeText: 3.0   // WCAG AA requirement for large text (18pt+ or 14pt+ bold)
    },
    focusManagement: true,
    keyboardNavigation: true,
    screenReaderSupport: true,
    touchTargetSize: 44 // WCAG AA minimum touch target size
  };

  /**
   * Calculate color contrast ratio between two colors
   */
  calculateColorContrast(foreground: string, background: string): ColorContrastResult {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    let level: 'A' | 'AA' | 'AAA' | 'fail' = 'fail';
    let passes = false;
    
    if (ratio >= 7.0) {
      level = 'AAA';
      passes = true;
    } else if (ratio >= 4.5) {
      level = 'AA';
      passes = true;
    } else if (ratio >= 3.0) {
      level = 'A';
      passes = ratio >= this.config.colorContrast.largeText;
    }
    
    const recommendation = !passes ? 
      `Increase contrast to at least ${this.config.colorContrast.normalText}:1 for normal text` :
      undefined;
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      passes,
      level,
      recommendation
    };
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // Calculate luminance
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  /**
   * Audit ZIP navigation components for accessibility violations
   */
  auditZIPNavigation(element: HTMLElement): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // Check ZIP input fields
    const zipInputs = element.querySelectorAll('input[type="tel"], input[name*="zip"]');
    zipInputs.forEach((input, index) => {
      violations.push(...this.auditFormField(input as HTMLInputElement, index));
    });
    
    // Check buttons
    const buttons = element.querySelectorAll('button');
    buttons.forEach((button, index) => {
      violations.push(...this.auditButton(button, index));
    });
    
    // Check interactive elements
    const interactive = element.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    interactive.forEach((el, index) => {
      violations.push(...this.auditInteractiveElement(el as HTMLElement, index));
    });
    
    // Check error messages
    const errorElements = element.querySelectorAll('[role="alert"], .error, .invalid');
    errorElements.forEach((error, index) => {
      violations.push(...this.auditErrorMessage(error as HTMLElement, index));
    });
    
    return violations;
  }

  /**
   * Audit form field accessibility
   */
  private auditFormField(input: HTMLInputElement, index: number): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const fieldId = `zip-input-${index}`;
    
    // Check for associated label
    const label = document.querySelector(`label[for="${input.id}"]`) || 
                 input.closest('label') ||
                 document.querySelector(`label[for="${fieldId}"]`);
    
    if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      violations.push({
        type: 'aria-labels',
        severity: 'error',
        element: `ZIP input field #${index}`,
        description: 'Form input lacks accessible label',
        recommendation: 'Add a <label> element or aria-label attribute',
        wcagRule: 'WCAG 2.1 - 3.3.2 Labels or Instructions (AA)'
      });
    }
    
    // Check for error association
    if (input.hasAttribute('aria-invalid') && input.getAttribute('aria-invalid') === 'true') {
      const errorId = input.getAttribute('aria-describedby');
      if (!errorId || !document.getElementById(errorId)) {
        violations.push({
          type: 'aria-labels',
          severity: 'error',
          element: `ZIP input field #${index}`,
          description: 'Invalid field lacks proper error description',
          recommendation: 'Use aria-describedby to link to error message',
          wcagRule: 'WCAG 2.1 - 3.3.1 Error Identification (AA)'
        });
      }
    }
    
    // Check input mode for mobile
    if (input.type === 'tel' && !input.getAttribute('inputmode')) {
      violations.push({
        type: 'keyboard-navigation',
        severity: 'warning',
        element: `ZIP input field #${index}`,
        description: 'Missing inputmode attribute for mobile optimization',
        recommendation: 'Add inputmode="numeric" for ZIP code inputs',
        wcagRule: 'WCAG 2.1 - 2.5.8 Target Size (AA)'
      });
    }
    
    return violations;
  }

  /**
   * Audit button accessibility
   */
  private auditButton(button: HTMLButtonElement, index: number): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // Check button has accessible text
    const hasText = button.textContent?.trim() || 
                   button.getAttribute('aria-label') || 
                   button.getAttribute('aria-labelledby');
    
    if (!hasText) {
      violations.push({
        type: 'aria-labels',
        severity: 'error',
        element: `Button #${index}`,
        description: 'Button lacks accessible text',
        recommendation: 'Add text content or aria-label attribute',
        wcagRule: 'WCAG 2.1 - 4.1.2 Name, Role, Value (AA)'
      });
    }
    
    // Check touch target size
    const rect = button.getBoundingClientRect();
    if (rect.width < this.config.touchTargetSize || rect.height < this.config.touchTargetSize) {
      violations.push({
        type: 'touch-targets',
        severity: 'warning',
        element: `Button #${index}`,
        description: `Touch target too small: ${rect.width}x${rect.height}px`,
        recommendation: `Ensure minimum ${this.config.touchTargetSize}x${this.config.touchTargetSize}px touch target`,
        wcagRule: 'WCAG 2.1 - 2.5.5 Target Size (AAA)'
      });
    }
    
    // Check disabled state announcement
    if (button.disabled && !button.getAttribute('aria-label')?.includes('disabled')) {
      violations.push({
        type: 'aria-labels',
        severity: 'info',
        element: `Button #${index}`,
        description: 'Disabled state not announced to screen readers',
        recommendation: 'Include disabled state in aria-label or use aria-disabled',
        wcagRule: 'WCAG 2.1 - 4.1.2 Name, Role, Value (AA)'
      });
    }
    
    return violations;
  }

  /**
   * Audit interactive element accessibility
   */
  private auditInteractiveElement(element: HTMLElement, index: number): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // Check for proper focus indicators
    const focusStyles = window.getComputedStyle(element, ':focus');
    const hasVisibleFocus = focusStyles.outline !== 'none' || 
                           focusStyles.boxShadow !== 'none' ||
                           focusStyles.border !== focusStyles.getPropertyValue('border');
    
    if (!hasVisibleFocus) {
      violations.push({
        type: 'focus-management',
        severity: 'error',
        element: `Interactive element #${index}`,
        description: 'Missing visible focus indicator',
        recommendation: 'Add :focus styles with outline, box-shadow, or border',
        wcagRule: 'WCAG 2.1 - 2.4.7 Focus Visible (AA)'
      });
    }
    
    // Check tabindex usage
    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) > 0) {
      violations.push({
        type: 'keyboard-navigation',
        severity: 'warning',
        element: `Interactive element #${index}`,
        description: 'Positive tabindex disrupts natural tab order',
        recommendation: 'Use tabindex="0" or rely on natural DOM order',
        wcagRule: 'WCAG 2.1 - 2.4.3 Focus Order (AA)'
      });
    }
    
    return violations;
  }

  /**
   * Audit error message accessibility
   */
  private auditErrorMessage(element: HTMLElement, index: number): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // Check for proper ARIA live region
    const liveRegion = element.getAttribute('aria-live') || 
                      element.getAttribute('role');
    
    if (!liveRegion || (liveRegion !== 'alert' && liveRegion !== 'assertive')) {
      violations.push({
        type: 'aria-labels',
        severity: 'error',
        element: `Error message #${index}`,
        description: 'Error message not announced to screen readers',
        recommendation: 'Add role="alert" or aria-live="assertive"',
        wcagRule: 'WCAG 2.1 - 3.3.1 Error Identification (AA)'
      });
    }
    
    // Check color-only error indication
    const styles = window.getComputedStyle(element);
    const hasIconOrText = element.querySelector('svg, .icon') || 
                         element.textContent?.includes('Error') ||
                         element.textContent?.includes('Invalid');
    
    if (!hasIconOrText && styles.color) {
      violations.push({
        type: 'color-contrast',
        severity: 'warning',
        element: `Error message #${index}`,
        description: 'Error indication relies only on color',
        recommendation: 'Add text, icons, or other visual indicators beyond color',
        wcagRule: 'WCAG 2.1 - 1.4.1 Use of Color (AA)'
      });
    }
    
    return violations;
  }

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport(violations: AccessibilityViolation[]): {
    summary: {
      total: number;
      errors: number;
      warnings: number;
      infos: number;
    };
    compliance: {
      level: 'A' | 'AA' | 'AAA' | 'fail';
      percentage: number;
    };
    violations: AccessibilityViolation[];
    recommendations: string[];
  } {
    const errors = violations.filter(v => v.severity === 'error').length;
    const warnings = violations.filter(v => v.severity === 'warning').length;
    const infos = violations.filter(v => v.severity === 'info').length;
    
    const complianceLevel = errors > 0 ? 'fail' : 
                           warnings > 0 ? 'A' : 'AA';
    
    const compliancePercentage = Math.round(
      ((violations.length - errors) / Math.max(violations.length, 1)) * 100
    );
    
    const recommendations = [
      ...new Set(violations.map(v => v.recommendation))
    ].slice(0, 5);
    
    return {
      summary: {
        total: violations.length,
        errors,
        warnings,
        infos
      },
      compliance: {
        level: complianceLevel,
        percentage: compliancePercentage
      },
      violations,
      recommendations
    };
  }

  /**
   * Get WCAG-compliant color scheme for Texas theme
   */
  getAccessibleColors(): {
    primary: { foreground: string; background: string; ratio: number };
    secondary: { foreground: string; background: string; ratio: number };
    error: { foreground: string; background: string; ratio: number };
    success: { foreground: string; background: string; ratio: number };
  } {
    return {
      primary: {
        foreground: '#ffffff',
        background: '#002868', // texas-navy
        ratio: this.calculateColorContrast('#ffffff', '#002868').ratio
      },
      secondary: {
        foreground: '#002868',
        background: '#ffffff',
        ratio: this.calculateColorContrast('#002868', '#ffffff').ratio
      },
      error: {
        foreground: '#ffffff',
        background: '#b91c1c', // texas-red-600 for better contrast
        ratio: this.calculateColorContrast('#ffffff', '#b91c1c').ratio
      },
      success: {
        foreground: '#ffffff',
        background: '#d97706', // texas-gold-600
        ratio: this.calculateColorContrast('#ffffff', '#d97706').ratio
      }
    };
  }
}

// Export singleton instance
export const wcagComplianceService = new WCAGComplianceService();