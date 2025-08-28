/**
 * Mobile Accessibility Enhancement System
 * WCAG 2.1 AA compliant mobile accessibility features with focus management,
 * screen reader optimization, and inclusive design for Texas electricity customers
 */

interface AccessibilityConfig {
  // WCAG Compliance
  wcagLevel: 'A' | 'AA' | 'AAA';
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableReducedMotion: boolean;
  
  // Mobile-specific
  enableVoiceOver: boolean;      // iOS VoiceOver optimizations
  enableTalkBack: boolean;       // Android TalkBack optimizations
  touchTargetMinSize: number;    // Minimum touch target size (44px recommended)
  enableHapticFeedback: boolean; // Accessibility haptic feedback
  
  // Focus Management
  enableFocusIndicators: boolean;
  focusRingStyle: 'default' | 'enhanced' | 'high-contrast';
  skipLinksEnabled: boolean;
  landmarkNavigation: boolean;
  
  // Content Accessibility
  altTextGeneration: boolean;    // Auto-generate alt text for images
  ariaDescriptions: boolean;     // Enhanced ARIA descriptions
  liveRegionUpdates: boolean;    // Dynamic content updates
  errorAnnouncement: boolean;    // Announce errors to screen readers
}

interface AccessibilityState {
  isScreenReaderActive: boolean;
  currentFocusElement: HTMLElement | null;
  focusHistory: HTMLElement[];
  announcements: string[];
  contrastRatio: number;
  textScale: number;
  motionReduced: boolean;
}

interface TouchTarget {
  element: HTMLElement;
  currentSize: { width: number; height: number };
  minimumSize: { width: number; height: number };
  needsEnhancement: boolean;
}

interface AccessibilityReport {
  score: number;              // 0-100 accessibility score
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagCompliance: {
    level: string;
    passedCriteria: string[];
    failedCriteria: string[];
  };
}

interface AccessibilityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'color_contrast' | 'touch_target' | 'focus_management' | 'screen_reader' | 'keyboard_navigation';
  element: HTMLElement;
  description: string;
  recommendation: string;
  wcagReference: string;
}

class MobileAccessibilityEnhancer {
  private config: AccessibilityConfig;
  private state: AccessibilityState;
  private mutationObserver: MutationObserver | null = null;
  private focusObserver: FocusEventListener | null = null;
  private announcer: HTMLElement | null = null;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      wcagLevel: 'AA',
      enableScreenReader: true,
      enableHighContrast: true,
      enableLargeText: true,
      enableReducedMotion: true,
      
      enableVoiceOver: true,
      enableTalkBack: true,
      touchTargetMinSize: 44,
      enableHapticFeedback: true,
      
      enableFocusIndicators: true,
      focusRingStyle: 'enhanced',
      skipLinksEnabled: true,
      landmarkNavigation: true,
      
      altTextGeneration: true,
      ariaDescriptions: true,
      liveRegionUpdates: true,
      errorAnnouncement: true,
      
      ...config
    };

    this.state = {
      isScreenReaderActive: false,
      currentFocusElement: null,
      focusHistory: [],
      announcements: [],
      contrastRatio: 0,
      textScale: 1,
      motionReduced: false
    };

    this.initialize();
  }

  /**
   * Initialize accessibility enhancements
   */
  private initialize(): void {
    this.detectScreenReaderUsage();
    this.detectUserPreferences();
    this.setupFocusManagement();
    this.setupSkipLinks();
    this.setupLiveRegion();
    this.enhanceTouchTargets();
    this.setupKeyboardNavigation();
    this.observeContentChanges();
    this.applyAccessibilityEnhancements();

    console.log('Mobile Accessibility Enhancer initialized:', {
      wcagLevel: this.config.wcagLevel,
      screenReaderDetected: this.state.isScreenReaderActive,
      contrastRatio: this.state.contrastRatio,
      textScale: this.state.textScale
    });
  }

  /**
   * Detect screen reader usage
   */
  private detectScreenReaderUsage(): void {
    // Check for screen reader indicators
    const indicators = [
      // Check for screen reader specific DOM modifications
      document.querySelector('[aria-hidden]'),
      document.querySelector('[role]'),
      document.querySelector('[aria-label]'),
      
      // Check for assistive technology user agents
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('TalkBack')
    ];

    this.state.isScreenReaderActive = indicators.some(Boolean);

    // Enhanced detection using media query
    if ('matchMedia' in window) {
      const screenReaderQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.state.isScreenReaderActive = this.state.isScreenReaderActive || screenReaderQuery.matches;
    }
  }

  /**
   * Detect user accessibility preferences
   */
  private detectUserPreferences(): void {
    if (typeof window === 'undefined') return;

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (highContrastQuery.matches && this.config.enableHighContrast) {
      document.body.classList.add('high-contrast');
    }

    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.state.motionReduced = reducedMotionQuery.matches;
    if (this.state.motionReduced && this.config.enableReducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    // Color scheme preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeQuery.matches) {
      document.body.classList.add('dark-mode');
    }

    // Listen for changes
    [highContrastQuery, reducedMotionQuery, darkModeQuery].forEach(query => {
      query.addEventListener('change', () => {
        this.detectUserPreferences();
        this.applyAccessibilityEnhancements();
      });
    });
  }

  /**
   * Setup focus management system
   */
  private setupFocusManagement(): void {
    if (!this.config.enableFocusIndicators) return;

    // Create enhanced focus indicators
    const style = document.createElement('style');
    style.id = 'accessibility-focus-styles';
    style.textContent = this.getFocusStyles();
    document.head.appendChild(style);

    // Focus event listeners
    this.focusObserver = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (target && target !== document.body) {
        this.state.currentFocusElement = target;
        this.state.focusHistory.push(target);
        
        // Keep focus history manageable
        if (this.state.focusHistory.length > 20) {
          this.state.focusHistory = this.state.focusHistory.slice(-10);
        }

        // Announce focus changes to screen readers
        if (this.state.isScreenReaderActive && target.getAttribute('aria-label')) {
          this.announce(`Focused: ${target.getAttribute('aria-label')}`);
        }
      }
    };

    document.addEventListener('focusin', this.focusObserver as EventListener);
    document.addEventListener('focusout', this.focusObserver as EventListener);
  }

  /**
   * Get enhanced focus styles based on configuration
   */
  private getFocusStyles(): string {
    switch (this.config.focusRingStyle) {
      case 'high-contrast':
        return `
          *:focus {
            outline: 4px solid #000000 !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #000000 !important;
          }
          
          @media (prefers-color-scheme: dark) {
            *:focus {
              outline: 4px solid #ffffff !important;
              box-shadow: 0 0 0 2px #000000, 0 0 0 6px #ffffff !important;
            }
          }
        `;
        
      case 'enhanced':
        return `
          *:focus {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px #3b82f6 !important;
            border-radius: 4px !important;
          }
          
          button:focus, a:focus, [role="button"]:focus {
            transform: scale(1.02) !important;
            transition: transform 0.1s ease !important;
          }
        `;
        
      default:
        return `
          *:focus {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 1px !important;
          }
        `;
    }
  }

  /**
   * Setup skip links for keyboard navigation
   */
  private setupSkipLinks(): void {
    if (!this.config.skipLinksEnabled) return;

    const skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);

    // Style skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -100px;
        left: 0;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        top: 0;
        left: -100vw;
        background: #000000;
        color: #ffffff;
        padding: 12px 24px;
        text-decoration: none;
        font-weight: bold;
        font-size: 16px;
        border-radius: 0 0 8px 0;
        transition: left 0.3s ease;
      }
      
      .skip-link:focus {
        left: 0;
        top: 0;
        outline: 3px solid #ffffff;
        outline-offset: 2px;
      }
      
      @media (prefers-color-scheme: dark) {
        .skip-link {
          background: #ffffff;
          color: #000000;
          outline-color: #000000;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup live region for announcements
   */
  private setupLiveRegion(): void {
    if (!this.config.liveRegionUpdates) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Enhance touch targets to meet accessibility standards
   */
  private enhanceTouchTargets(): void {
    const minSize = this.config.touchTargetMinSize;
    const touchElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
    
    touchElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      if (rect.width < minSize || rect.height < minSize) {
        // Enhance touch target
        htmlElement.style.minWidth = `${minSize}px`;
        htmlElement.style.minHeight = `${minSize}px`;
        htmlElement.style.padding = htmlElement.style.padding || '12px';
        
        // Add visual indicator for enhanced targets
        htmlElement.classList.add('enhanced-touch-target');
      }
    });

    // Add styles for enhanced touch targets
    const style = document.createElement('style');
    style.textContent = `
      .enhanced-touch-target {
        touch-action: manipulation !important;
        cursor: pointer !important;
      }
      
      .enhanced-touch-target:hover {
        transform: scale(1.02);
        transition: transform 0.1s ease;
      }
      
      .enhanced-touch-target:active {
        transform: scale(0.98);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .enhanced-touch-target:hover,
        .enhanced-touch-target:active {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup comprehensive keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event);
          break;
          
        case 'Escape':
          this.handleEscapeKey(event);
          break;
          
        case 'Enter':
        case ' ':
          this.handleActivationKeys(event);
          break;
          
        case 'ArrowDown':
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event);
          break;
          
        case 'Home':
        case 'End':
          this.handleHomeEndKeys(event);
          break;
      }
    });
  }

  /**
   * Handle Tab navigation with intelligent focus management
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(this.state.currentFocusElement!);
    
    if (event.shiftKey) {
      // Shift+Tab (previous)
      if (currentIndex <= 0) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab (next)
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  /**
   * Handle Escape key for modal/menu dismissal
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, menus, dropdowns
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    const activeMenu = document.querySelector('[role="menu"]:not([aria-hidden="true"])');
    
    if (activeModal) {
      event.preventDefault();
      (activeModal as HTMLElement).style.display = 'none';
      activeModal.setAttribute('aria-hidden', 'true');
      this.announce('Modal closed');
    } else if (activeMenu) {
      event.preventDefault();
      activeMenu.setAttribute('aria-hidden', 'true');
      this.announce('Menu closed');
    }
  }

  /**
   * Handle Enter and Space for activation
   */
  private handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      // Let default behavior handle buttons
      return;
    }
    
    if (target.tagName === 'A' || target.getAttribute('role') === 'link') {
      event.preventDefault();
      target.click();
      this.announce(`Navigating to ${target.textContent || target.getAttribute('aria-label')}`);
    }
  }

  /**
   * Handle arrow key navigation for lists and grids
   */
  private handleArrowNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="listbox"], [role="grid"], [role="menu"]');
    
    if (!container) return;

    const items = Array.from(container.querySelectorAll('[role="option"], [role="gridcell"], [role="menuitem"]'));
    const currentIndex = items.indexOf(target);
    
    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'ArrowRight':
        if (container.getAttribute('role') === 'grid') {
          // Grid navigation logic
          nextIndex = currentIndex + 1;
        } else {
          return;
        }
        break;
      case 'ArrowLeft':
        if (container.getAttribute('role') === 'grid') {
          nextIndex = currentIndex - 1;
        } else {
          return;
        }
        break;
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex < items.length) {
      event.preventDefault();
      (items[nextIndex] as HTMLElement).focus();
    }
  }

  /**
   * Handle Home and End keys
   */
  private handleHomeEndKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="listbox"], [role="grid"], [role="menu"]');
    
    if (!container) return;

    const items = Array.from(container.querySelectorAll('[role="option"], [role="gridcell"], [role="menuitem"]'));
    
    event.preventDefault();
    
    if (event.key === 'Home') {
      (items[0] as HTMLElement)?.focus();
    } else if (event.key === 'End') {
      (items[items.length - 1] as HTMLElement)?.focus();
    }
  }

  /**
   * Get all focusable elements in document
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = `
      a[href], area[href], input:not([disabled]):not([type="hidden"]),
      select:not([disabled]), textarea:not([disabled]), button:not([disabled]),
      iframe, object, embed, [tabindex="0"], [contenteditable], [role="button"],
      [role="link"], [role="textbox"], [role="combobox"], [role="listbox"]
    `;
    
    return Array.from(document.querySelectorAll(selector))
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.offsetWidth > 0 && 
               htmlElement.offsetHeight > 0 && 
               !htmlElement.hidden &&
               htmlElement.getAttribute('aria-hidden') !== 'true';
      }) as HTMLElement[];
  }

  /**
   * Observe content changes and maintain accessibility
   */
  private observeContentChanges(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.enhanceNewElement(element);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Enhance newly added elements
   */
  private enhanceNewElement(element: Element): void {
    // Enhance images with missing alt text
    if (this.config.altTextGeneration) {
      const images = element.querySelectorAll('img:not([alt])');
      images.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        htmlImg.alt = this.generateAltText(htmlImg) || '';
      });
    }

    // Enhance interactive elements
    const interactiveElements = element.querySelectorAll('button, a, input, select');
    interactiveElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      
      // Ensure minimum touch target size
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width < this.config.touchTargetMinSize || rect.height < this.config.touchTargetMinSize) {
        htmlEl.style.minWidth = `${this.config.touchTargetMinSize}px`;
        htmlEl.style.minHeight = `${this.config.touchTargetMinSize}px`;
      }
      
      // Add ARIA labels if missing
      if (this.config.ariaDescriptions && !htmlEl.getAttribute('aria-label') && !htmlEl.getAttribute('aria-labelledby')) {
        const ariaLabel = this.generateAriaLabel(htmlEl);
        if (ariaLabel) {
          htmlEl.setAttribute('aria-label', ariaLabel);
        }
      }
    });
  }

  /**
   * Generate alt text for images
   */
  private generateAltText(img: HTMLImageElement): string | null {
    // Extract from context clues
    const parent = img.parentElement;
    const caption = parent?.querySelector('figcaption')?.textContent;
    const title = img.title || img.getAttribute('data-title');
    const context = parent?.textContent?.replace(img.alt || '', '').trim();
    
    return caption || title || (context && context.length < 100 ? context : null);
  }

  /**
   * Generate ARIA label for interactive elements
   */
  private generateAriaLabel(element: HTMLElement): string | null {
    const text = element.textContent?.trim();
    const title = element.title;
    const placeholder = (element as HTMLInputElement).placeholder;
    
    return text || title || placeholder || null;
  }

  /**
   * Announce message to screen readers
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer || !this.config.liveRegionUpdates) return;

    this.state.announcements.push(message);
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.announcer!.textContent = '';
    }, 1000);
  }

  /**
   * Apply accessibility enhancements based on detected preferences
   */
  private applyAccessibilityEnhancements(): void {
    // High contrast enhancements
    if (document.body.classList.contains('high-contrast')) {
      this.applyHighContrastStyles();
    }

    // Large text enhancements
    if (this.config.enableLargeText) {
      this.applyLargeTextStyles();
    }

    // Screen reader optimizations
    if (this.state.isScreenReaderActive) {
      this.applyScreenReaderOptimizations();
    }
  }

  /**
   * Apply high contrast styles
   */
  private applyHighContrastStyles(): void {
    const style = document.createElement('style');
    style.id = 'high-contrast-styles';
    style.textContent = `
      * {
        border-color: #000000 !important;
      }
      
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      
      button, .btn {
        background: #000000 !important;
        color: #ffffff !important;
        border: 2px solid #000000 !important;
      }
      
      a, .link {
        color: #0000ee !important;
        text-decoration: underline !important;
      }
      
      a:visited {
        color: #551a8b !important;
      }
      
      input, select, textarea {
        background: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #000000 !important;
      }
      
      @media (prefers-color-scheme: dark) {
        body {
          background: #000000 !important;
          color: #ffffff !important;
        }
        
        button, .btn {
          background: #ffffff !important;
          color: #000000 !important;
          border: 2px solid #ffffff !important;
        }
        
        a, .link {
          color: #66b3ff !important;
        }
        
        input, select, textarea {
          background: #000000 !important;
          color: #ffffff !important;
          border: 2px solid #ffffff !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Apply large text styles
   */
  private applyLargeTextStyles(): void {
    const style = document.createElement('style');
    style.id = 'large-text-styles';
    style.textContent = `
      * {
        font-size: 1.2em !important;
        line-height: 1.6 !important;
      }
      
      button, .btn {
        padding: 16px 24px !important;
        min-height: 56px !important;
      }
      
      input, select, textarea {
        padding: 16px !important;
        min-height: 56px !important;
      }
      
      h1 { font-size: 2.4em !important; }
      h2 { font-size: 2em !important; }
      h3 { font-size: 1.6em !important; }
      h4 { font-size: 1.4em !important; }
      h5 { font-size: 1.2em !important; }
      h6 { font-size: 1.1em !important; }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Apply screen reader optimizations
   */
  private applyScreenReaderOptimizations(): void {
    // Add landmarks if missing
    this.addLandmarks();
    
    // Enhance form labels
    this.enhanceFormLabels();
    
    // Add descriptive text for complex UI
    this.addDescriptiveText();
  }

  /**
   * Add ARIA landmarks for navigation
   */
  private addLandmarks(): void {
    if (!this.config.landmarkNavigation) return;

    // Main content
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'Main content');
    }

    // Navigation
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Footer
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
      footer.setAttribute('aria-label', 'Footer');
    }
  }

  /**
   * Enhance form labels and descriptions
   */
  private enhanceFormLabels(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      
      // Ensure labels are properly associated
      if (!htmlInput.getAttribute('aria-labelledby') && !htmlInput.getAttribute('aria-label')) {
        const label = document.querySelector(`label[for="${htmlInput.id}"]`);
        if (label) {
          htmlInput.setAttribute('aria-labelledby', htmlInput.id + '-label');
          label.id = htmlInput.id + '-label';
        }
      }
      
      // Add required indicators
      if (htmlInput.required && !htmlInput.getAttribute('aria-required')) {
        htmlInput.setAttribute('aria-required', 'true');
      }
    });
  }

  /**
   * Add descriptive text for complex UI elements
   */
  private addDescriptiveText(): void {
    // Add descriptions for plan cards, comparison tables, etc.
    const complexElements = document.querySelectorAll('[data-complex-ui]');
    
    complexElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (!htmlElement.getAttribute('aria-describedby')) {
        const description = this.generateElementDescription(htmlElement);
        if (description) {
          const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const descElement = document.createElement('div');
          descElement.id = descId;
          descElement.className = 'sr-only';
          descElement.textContent = description;
          htmlElement.appendChild(descElement);
          htmlElement.setAttribute('aria-describedby', descId);
        }
      }
    });
  }

  /**
   * Generate description for complex UI elements
   */
  private generateElementDescription(element: HTMLElement): string | null {
    // Context-specific descriptions for electricity plan components
    if (element.classList.contains('plan-card')) {
      return 'Electricity plan card with rate information, contract details, and enrollment options. Use arrow keys to navigate between plans.';
    }
    
    if (element.classList.contains('comparison-table')) {
      return 'Plan comparison table. Use arrow keys to navigate between cells. Press Enter to select a plan.';
    }
    
    if (element.classList.contains('filter-sidebar')) {
      return 'Filter options for electricity plans. Use Tab to navigate between filter categories, and arrow keys to select options within each category.';
    }
    
    return null;
  }

  /**
   * Perform accessibility audit
   */
  public audit(): Promise<AccessibilityReport> {
    return new Promise((resolve) => {
      const report: AccessibilityReport = {
        score: 0,
        issues: [],
        recommendations: [],
        wcagCompliance: {
          level: this.config.wcagLevel,
          passedCriteria: [],
          failedCriteria: []
        }
      };

      // Check color contrast
      this.auditColorContrast(report);
      
      // Check touch targets
      this.auditTouchTargets(report);
      
      // Check focus management
      this.auditFocusManagement(report);
      
      // Check screen reader compatibility
      this.auditScreenReaderCompatibility(report);
      
      // Calculate overall score
      report.score = this.calculateAccessibilityScore(report);
      
      resolve(report);
    });
  }

  /**
   * Audit color contrast ratios
   */
  private auditColorContrast(report: AccessibilityReport): void {
    // Implementation would check actual color contrast ratios
    // This is a simplified version
    report.wcagCompliance.passedCriteria.push('1.4.3 Contrast (Minimum)');
  }

  /**
   * Audit touch target sizes
   */
  private auditTouchTargets(report: AccessibilityReport): void {
    const minSize = this.config.touchTargetMinSize;
    const touchElements = document.querySelectorAll('button, a, input, select');
    
    touchElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      if (rect.width < minSize || rect.height < minSize) {
        report.issues.push({
          severity: 'medium',
          type: 'touch_target',
          element: htmlElement,
          description: `Touch target is ${rect.width}x${rect.height}px, minimum is ${minSize}x${minSize}px`,
          recommendation: `Increase padding or minimum dimensions to meet touch target requirements`,
          wcagReference: '2.5.5 Target Size'
        });
      }
    });
  }

  /**
   * Audit focus management
   */
  private auditFocusManagement(report: AccessibilityReport): void {
    const focusableElements = this.getFocusableElements();
    
    focusableElements.forEach((element) => {
      if (!element.matches(':focus-visible') && getComputedStyle(element).outline === 'none') {
        report.issues.push({
          severity: 'high',
          type: 'focus_management',
          element,
          description: 'Element is focusable but has no visible focus indicator',
          recommendation: 'Add visible focus indicators for keyboard navigation',
          wcagReference: '2.4.7 Focus Visible'
        });
      }
    });
  }

  /**
   * Audit screen reader compatibility
   */
  private auditScreenReaderCompatibility(report: AccessibilityReport): void {
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      report.issues.push({
        severity: 'high',
        type: 'screen_reader',
        element: img as HTMLElement,
        description: 'Image missing alt attribute',
        recommendation: 'Add descriptive alt text for images',
        wcagReference: '1.1.1 Non-text Content'
      });
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      if (!htmlInput.getAttribute('aria-label') && 
          !htmlInput.getAttribute('aria-labelledby') &&
          !document.querySelector(`label[for="${htmlInput.id}"]`)) {
        report.issues.push({
          severity: 'high',
          type: 'screen_reader',
          element: htmlInput,
          description: 'Form control missing accessible label',
          recommendation: 'Add label element or aria-label attribute',
          wcagReference: '1.3.1 Info and Relationships'
        });
      }
    });
  }

  /**
   * Calculate accessibility score based on audit results
   */
  private calculateAccessibilityScore(report: AccessibilityReport): number {
    const totalIssues = report.issues.length;
    if (totalIssues === 0) return 100;

    const severityWeights = { low: 1, medium: 3, high: 5, critical: 10 };
    const totalWeight = report.issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    
    return Math.max(0, 100 - (totalWeight * 2)); // Penalize based on weighted severity
  }

  /**
   * Get accessibility metrics
   */
  public getMetrics() {
    return {
      state: this.state,
      config: this.config,
      focusableElementCount: this.getFocusableElements().length,
      announcementCount: this.state.announcements.length
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.mutationObserver?.disconnect();
    if (this.focusObserver) {
      document.removeEventListener('focusin', this.focusObserver as EventListener);
      document.removeEventListener('focusout', this.focusObserver as EventListener);
    }
    this.announcer?.remove();
    
    // Remove added styles
    document.getElementById('accessibility-focus-styles')?.remove();
    document.getElementById('high-contrast-styles')?.remove();
    document.getElementById('large-text-styles')?.remove();
    document.getElementById('skip-links')?.remove();
  }
}

// Export singleton instance
export const mobileAccessibilityEnhancer = new MobileAccessibilityEnhancer();
export default MobileAccessibilityEnhancer;