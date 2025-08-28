/**
 * Mobile Analytics Tracker
 * Comprehensive mobile performance monitoring and conversion analytics
 * for Texas electricity comparison platform optimization
 */

interface AnalyticsConfig {
  // Core Configuration
  trackingId: string;
  enablePerformanceMonitoring: boolean;
  enableUserBehaviorTracking: boolean;
  enableConversionTracking: boolean;
  enableErrorTracking: boolean;
  
  // Mobile-specific
  trackTouchPatterns: boolean;
  trackScrollBehavior: boolean;
  trackViewportChanges: boolean;
  trackDeviceCapabilities: boolean;
  trackNetworkConditions: boolean;
  
  // Privacy & Compliance
  enableGDPRCompliance: boolean;
  enableCCPACompliance: boolean;
  anonymizeIPs: boolean;
  respectDoNotTrack: boolean;
  consentRequired: boolean;
  
  // Performance Thresholds
  performanceThresholds: {
    lcp: number;        // Largest Contentful Paint (ms)
    fid: number;        // First Input Delay (ms) 
    cls: number;        // Cumulative Layout Shift
    ttfb: number;       // Time to First Byte (ms)
    fcp: number;        // First Contentful Paint (ms)
  };
  
  // Sampling Rates
  samplingRates: {
    performance: number;    // 0-100% sampling rate
    userBehavior: number;   // 0-100% sampling rate  
    errors: number;         // 0-100% sampling rate
  };
}

interface MobileDeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  operatingSystem: string;
  browser: string;
  screenResolution: string;
  devicePixelRatio: number;
  touchCapable: boolean;
  connectionType?: string;
  effectiveConnectionType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
  
  // Additional Performance Metrics
  domContentLoaded: number;
  loadComplete: number;
  firstByte: number;
  
  // Mobile-specific
  batteryLevel?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  
  // Custom Metrics
  imageLoadTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
}

interface UserBehaviorData {
  // Engagement Metrics
  sessionId: string;
  sessionDuration: number;
  pageViews: number;
  scrollDepth: number;
  clickCount: number;
  
  // Mobile-specific Behavior
  touchPatterns: TouchPattern[];
  swipeGestures: SwipeGesture[];
  orientationChanges: number;
  viewportChanges: number;
  
  // Conversion Funnel
  funnelSteps: string[];
  currentStep: string;
  conversionGoals: ConversionGoal[];
}

interface TouchPattern {
  type: 'tap' | 'double-tap' | 'long-press' | 'pinch' | 'swipe';
  elementType: string;
  elementId?: string;
  coordinates: { x: number; y: number };
  timestamp: number;
  duration?: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  element: string;
  timestamp: number;
}

interface ConversionGoal {
  id: string;
  name: string;
  type: 'page_view' | 'click' | 'form_submit' | 'purchase' | 'signup';
  value?: number;
  completed: boolean;
  timestamp?: number;
}

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  customDimensions?: Record<string, string | number>;
}

class MobileAnalyticsTracker {
  private config: AnalyticsConfig;
  private deviceInfo: MobileDeviceInfo;
  private sessionId: string;
  private startTime: number;
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private consentGiven = false;

  constructor(config: Partial<AnalyticsConfig>) {
    this.config = {
      trackingId: '',
      enablePerformanceMonitoring: true,
      enableUserBehaviorTracking: true,
      enableConversionTracking: true,
      enableErrorTracking: true,
      
      trackTouchPatterns: true,
      trackScrollBehavior: true,
      trackViewportChanges: true,
      trackDeviceCapabilities: true,
      trackNetworkConditions: true,
      
      enableGDPRCompliance: true,
      enableCCPACompliance: true,
      anonymizeIPs: true,
      respectDoNotTrack: true,
      consentRequired: false,
      
      performanceThresholds: {
        lcp: 2500,  // 2.5s
        fid: 100,   // 100ms
        cls: 0.1,   // 0.1
        ttfb: 600,  // 600ms
        fcp: 1800   // 1.8s
      },
      
      samplingRates: {
        performance: 100,    // 100% sampling for performance
        userBehavior: 50,    // 50% sampling for behavior
        errors: 100          // 100% sampling for errors
      },
      
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.deviceInfo = this.detectDeviceInfo();
  }

  /**
   * Initialize the analytics tracker
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check for consent requirements
    if (this.config.consentRequired) {
      await this.waitForConsent();
    }

    // Respect Do Not Track
    if (this.config.respectDoNotTrack && this.isDNTEnabled()) {
      console.log('Analytics tracking disabled due to Do Not Track setting');
      return;
    }

    // Initialize tracking components
    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceTracking();
    }

    if (this.config.enableUserBehaviorTracking) {
      this.initializeBehaviorTracking();
    }

    if (this.config.enableConversionTracking) {
      this.initializeConversionTracking();
    }

    if (this.config.enableErrorTracking) {
      this.initializeErrorTracking();
    }

    // Setup periodic data flushing
    this.setupDataFlushing();

    // Track session start
    this.trackEvent({
      category: 'Session',
      action: 'Start',
      timestamp: this.startTime,
      sessionId: this.sessionId,
      customDimensions: {
        deviceType: this.deviceInfo.deviceType,
        connectionType: this.deviceInfo.connectionType || 'unknown',
        screenResolution: this.deviceInfo.screenResolution
      }
    });

    this.isInitialized = true;
    console.log('Mobile Analytics Tracker initialized:', {
      sessionId: this.sessionId,
      deviceType: this.deviceInfo.deviceType,
      trackingEnabled: this.consentGiven
    });
  }

  /**
   * Wait for user consent if required
   */
  private async waitForConsent(): Promise<void> {
    // Check for existing consent
    const existingConsent = localStorage.getItem('analytics_consent');
    if (existingConsent === 'true') {
      this.consentGiven = true;
      return;
    }

    // Wait for consent event
    return new Promise((resolve) => {
      const checkConsent = () => {
        const consent = localStorage.getItem('analytics_consent');
        if (consent === 'true') {
          this.consentGiven = true;
          resolve();
        } else {
          setTimeout(checkConsent, 100);
        }
      };
      checkConsent();
    });
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDNTEnabled(): boolean {
    return navigator.doNotTrack === '1' || 
           (navigator as any).msDoNotTrack === '1' ||
           (window as any).doNotTrack === '1';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2);
  }

  /**
   * Detect comprehensive device information
   */
  private detectDeviceInfo(): MobileDeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    // Device type detection
    const deviceType = this.getDeviceType(userAgent);
    
    // Operating system detection
    const operatingSystem = this.getOperatingSystem(userAgent);
    
    // Browser detection
    const browser = this.getBrowser(userAgent);
    
    // Connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      userAgent,
      deviceType,
      operatingSystem,
      browser,
      screenResolution: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      connectionType: connection?.type,
      effectiveConnectionType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData || false
    };
  }

  /**
   * Get device type from user agent
   */
  private getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/iPhone|iPod|Android.*Mobile|Windows.*Phone|BlackBerry.*Mobile/i.test(userAgent)) {
      return 'mobile';
    } else if (/iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Get operating system from user agent
   */
  private getOperatingSystem(userAgent: string): string {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  /**
   * Get browser from user agent
   */
  private getBrowser(userAgent: string): string {
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) return 'Chrome';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Opera/.test(userAgent)) return 'Opera';
    return 'Unknown';
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Core Web Vitals tracking
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    // Observe different types of performance entries
    try {
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance observer initialization failed:', error);
    }

    // Track page load timing
    window.addEventListener('load', () => {
      setTimeout(() => this.trackPageLoadMetrics(), 100);
    });
  }

  /**
   * Process performance entries and track metrics
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const shouldSample = Math.random() * 100 < this.config.samplingRates.performance;
    if (!shouldSample) return;

    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.trackPerformanceMetric('lcp', entry.startTime);
        break;
        
      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        this.trackPerformanceMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        break;
        
      case 'layout-shift':
        const clsEntry = entry as any;
        if (!clsEntry.hadRecentInput) {
          this.trackPerformanceMetric('cls', clsEntry.value);
        }
        break;
        
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.trackPerformanceMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
        break;
        
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.trackPerformanceMetric('fcp', entry.startTime);
        }
        break;
    }
  }

  /**
   * Track individual performance metrics
   */
  private trackPerformanceMetric(metric: keyof PerformanceMetrics, value: number): void {
    const threshold = this.config.performanceThresholds[metric as keyof typeof this.config.performanceThresholds];
    const isGood = threshold ? value <= threshold : true;
    
    this.trackEvent({
      category: 'Performance',
      action: metric.toUpperCase(),
      label: isGood ? 'good' : 'needs-improvement',
      value: Math.round(value),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      customDimensions: {
        deviceType: this.deviceInfo.deviceType,
        connectionType: this.deviceInfo.effectiveConnectionType || 'unknown',
        threshold
      }
    });
  }

  /**
   * Track page load metrics
   */
  private trackPageLoadMetrics(): void {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart
      };

      Object.entries(metrics).forEach(([key, value]) => {
        this.trackEvent({
          category: 'Page Load',
          action: key,
          value: Math.round(value),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      });
    }
  }

  /**
   * Initialize behavior tracking
   */
  private initializeBehaviorTracking(): void {
    if (!this.shouldSampleBehavior()) return;

    // Touch patterns
    if (this.config.trackTouchPatterns && this.deviceInfo.touchCapable) {
      this.initializeTouchTracking();
    }

    // Scroll behavior
    if (this.config.trackScrollBehavior) {
      this.initializeScrollTracking();
    }

    // Viewport changes
    if (this.config.trackViewportChanges) {
      this.initializeViewportTracking();
    }

    // Click tracking
    this.initializeClickTracking();
  }

  /**
   * Check if behavior should be sampled
   */
  private shouldSampleBehavior(): boolean {
    return Math.random() * 100 < this.config.samplingRates.userBehavior;
  }

  /**
   * Initialize touch pattern tracking
   */
  private initializeTouchTracking(): void {
    let touchStartTime = 0;
    let touchStartCoords = { x: 0, y: 0 };

    document.addEventListener('touchstart', (event) => {
      touchStartTime = Date.now();
      const touch = event.touches[0];
      touchStartCoords = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      const duration = Date.now() - touchStartTime;
      const target = event.target as HTMLElement;
      
      const touchPattern: TouchPattern = {
        type: duration > 500 ? 'long-press' : 'tap',
        elementType: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        coordinates: touchStartCoords,
        timestamp: Date.now(),
        duration
      };

      this.trackTouchPattern(touchPattern);
    }, { passive: true });

    // Track swipe gestures
    let swipeStartCoords = { x: 0, y: 0 };
    let swipeStartTime = 0;

    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      swipeStartCoords = { x: touch.clientX, y: touch.clientY };
      swipeStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - swipeStartCoords.x;
        const deltaY = touch.clientY - swipeStartCoords.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 50) { // Minimum swipe distance
          const duration = Date.now() - swipeStartTime;
          const velocity = distance / duration;
          
          let direction: SwipeGesture['direction'];
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          const swipeGesture: SwipeGesture = {
            direction,
            distance,
            velocity,
            element: (event.target as HTMLElement).tagName.toLowerCase(),
            timestamp: Date.now()
          };

          this.trackSwipeGesture(swipeGesture);
        }
      }
    }, { passive: true });
  }

  /**
   * Initialize scroll tracking
   */
  private initializeScrollTracking(): void {
    let maxScrollDepth = 0;
    let scrollTimer: number;

    const trackScrollDepth = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
      
      // Track milestone scroll depths
      const milestones = [25, 50, 75, 90, 100];
      const milestone = milestones.find(m => scrollPercent >= m && maxScrollDepth < m);
      
      if (milestone) {
        this.trackEvent({
          category: 'Scroll',
          action: 'Depth',
          label: `${milestone}%`,
          value: milestone,
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    };

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(trackScrollDepth, 250);
    }, { passive: true });
  }

  /**
   * Initialize viewport change tracking
   */
  private initializeViewportTracking(): void {
    let orientationChanges = 0;

    window.addEventListener('orientationchange', () => {
      orientationChanges++;
      
      setTimeout(() => {
        this.trackEvent({
          category: 'Viewport',
          action: 'Orientation Change',
          value: orientationChanges,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          customDimensions: {
            orientation: window.screen.orientation?.type || 'unknown',
            screenResolution: `${window.screen.width}x${window.screen.height}`
          }
        });
      }, 100);
    });

    // Track viewport resizing
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.trackEvent({
          category: 'Viewport',
          action: 'Resize',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          customDimensions: {
            windowSize: `${window.innerWidth}x${window.innerHeight}`
          }
        });
      }, 250);
    });
  }

  /**
   * Initialize click tracking
   */
  private initializeClickTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      // Track clicks on important elements
      if (['button', 'a', 'input'].includes(tagName) || target.getAttribute('role') === 'button') {
        this.trackEvent({
          category: 'Interaction',
          action: 'Click',
          label: tagName,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          customDimensions: {
            elementId: target.id || undefined,
            elementClass: target.className || undefined,
            elementText: target.textContent?.substring(0, 50) || undefined
          }
        });
      }
    }, { passive: true });
  }

  /**
   * Initialize conversion tracking
   */
  private initializeConversionTracking(): void {
    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent({
        category: 'Conversion',
        action: 'Form Submit',
        label: form.id || form.className || 'unknown',
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });

    // Track enrollment button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.textContent?.toLowerCase().includes('enroll') ||
          target.className.includes('enroll')) {
        this.trackEvent({
          category: 'Conversion',
          action: 'Enroll Click',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          customDimensions: {
            elementText: target.textContent?.substring(0, 50)
          }
        });
      }
    });
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      if (Math.random() * 100 < this.config.samplingRates.errors) {
        this.trackEvent({
          category: 'Error',
          action: 'JavaScript Error',
          label: event.message,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          customDimensions: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack?.substring(0, 500)
          }
        });
      }
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (Math.random() * 100 < this.config.samplingRates.errors) {
        this.trackEvent({
          category: 'Error',
          action: 'Unhandled Promise Rejection',
          label: event.reason?.toString() || 'Unknown',
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    });
  }

  /**
   * Track touch patterns
   */
  private trackTouchPattern(pattern: TouchPattern): void {
    this.trackEvent({
      category: 'Touch',
      action: pattern.type,
      label: pattern.elementType,
      timestamp: pattern.timestamp,
      sessionId: this.sessionId,
      customDimensions: {
        elementId: pattern.elementId,
        duration: pattern.duration,
        coordinates: `${pattern.coordinates.x},${pattern.coordinates.y}`
      }
    });
  }

  /**
   * Track swipe gestures
   */
  private trackSwipeGesture(gesture: SwipeGesture): void {
    this.trackEvent({
      category: 'Swipe',
      action: gesture.direction,
      label: gesture.element,
      value: Math.round(gesture.distance),
      timestamp: gesture.timestamp,
      sessionId: this.sessionId,
      customDimensions: {
        velocity: gesture.velocity.toFixed(2),
        distance: Math.round(gesture.distance)
      }
    });
  }

  /**
   * Track custom event
   */
  public trackEvent(event: AnalyticsEvent): void {
    if (!this.consentGiven && this.config.consentRequired) return;

    // Add to queue
    this.eventQueue.push(event);

    // Immediate flush for critical events
    const criticalEvents = ['Error', 'Conversion'];
    if (criticalEvents.includes(event.category)) {
      this.flushEvents();
    }
  }

  /**
   * Track page view
   */
  public trackPageView(page: string, title?: string): void {
    this.trackEvent({
      category: 'Page',
      action: 'View',
      label: page,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      customDimensions: {
        title: title || document.title,
        url: window.location.href,
        referrer: document.referrer
      }
    });
  }

  /**
   * Track conversion goal
   */
  public trackConversion(goal: ConversionGoal): void {
    this.trackEvent({
      category: 'Conversion',
      action: goal.type,
      label: goal.name,
      value: goal.value || 1,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      customDimensions: {
        goalId: goal.id,
        completed: goal.completed.toString()
      }
    });
  }

  /**
   * Setup periodic data flushing
   */
  private setupDataFlushing(): void {
    // Flush every 30 seconds
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });

    // Flush on visibility change (page hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushEvents();
      }
    });
  }

  /**
   * Flush events to analytics service
   */
  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send to multiple analytics services
    this.sendToGoogleAnalytics(events);
    this.sendToCustomEndpoint(events);
  }

  /**
   * Send events to Google Analytics
   */
  private sendToGoogleAnalytics(events: AnalyticsEvent[]): void {
    if (typeof gtag === 'undefined') return;

    events.forEach(event => {
      gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_map: {
          sessionId: event.sessionId,
          deviceType: this.deviceInfo.deviceType,
          ...event.customDimensions
        }
      });
    });
  }

  /**
   * Send events to custom analytics endpoint
   */
  private sendToCustomEndpoint(events: AnalyticsEvent[]): void {
    const payload = {
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo,
      events,
      timestamp: Date.now()
    };

    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.warn('Failed to send analytics data:', error);
    });
  }

  /**
   * Set user consent
   */
  public setConsent(consent: boolean): void {
    this.consentGiven = consent;
    localStorage.setItem('analytics_consent', consent.toString());
    
    if (consent && !this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * Get current analytics state
   */
  public getState() {
    return {
      initialized: this.isInitialized,
      consentGiven: this.consentGiven,
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo,
      eventQueueLength: this.eventQueue.length
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    this.flushEvents();
  }
}

// Export singleton instance
export const mobileAnalyticsTracker = new MobileAnalyticsTracker({
  trackingId: 'choosemypower-mobile',
  enablePerformanceMonitoring: true,
  enableUserBehaviorTracking: true,
  enableConversionTracking: true,
  enableErrorTracking: true,
  consentRequired: false // Set to true in production if needed
});

export default MobileAnalyticsTracker;