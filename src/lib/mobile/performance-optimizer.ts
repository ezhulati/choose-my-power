/**
 * Mobile-First Performance Optimization System
 * Bulletproof mobile performance for maximum Texas electricity customer conversions
 * Focus: <2s mobile loading times with >90 Core Web Vitals scores
 */

interface PerformanceConfig {
  targetLCP: number; // Largest Contentful Paint target (ms)
  targetFID: number; // First Input Delay target (ms)
  targetCLS: number; // Cumulative Layout Shift target
  mobileImageQuality: number; // Mobile image quality (0-100)
  preloadCritical: boolean; // Preload critical resources
  enableServiceWorker: boolean; // Enable offline support
  batchSize: number; // API request batching size
}

interface MobileMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  networkType: string;
  deviceMemory?: number;
  connectionSpeed: string;
}

interface OptimizationStrategy {
  imageStrategy: 'progressive' | 'lazy' | 'eager';
  jsStrategy: 'defer' | 'async' | 'critical';
  cssStrategy: 'critical' | 'preload' | 'lazy';
  apiStrategy: 'batch' | 'streaming' | 'cache-first';
}

class MobilePerformanceOptimizer {
  private config: PerformanceConfig;
  private metrics: MobileMetrics | null = null;
  private observer: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetLCP: 2000, // 2 seconds for mobile
      targetFID: 100,   // 100ms for mobile responsiveness
      targetCLS: 0.1,   // Low layout shift
      mobileImageQuality: 75, // Optimized for mobile bandwidth
      preloadCritical: true,
      enableServiceWorker: true,
      batchSize: 5,
      ...config
    };

    this.initializePerformanceMonitoring();
    this.setupCriticalResourcePreloading();
    this.initializeMobileOptimizations();
  }

  /**
   * Initialize comprehensive performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Monitor Core Web Vitals
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    // Observe all performance metrics
    try {
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    // Device and network detection
    this.detectMobileCapabilities();
  }

  /**
   * Process performance entries and track Core Web Vitals
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        const lcpEntry = entry as PerformanceEventTiming;
        this.updateMetric('lcp', lcpEntry.startTime);
        break;

      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        this.updateMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        break;

      case 'layout-shift':
        const clsEntry = entry as any; // LayoutShift interface
        if (!clsEntry.hadRecentInput) {
          this.updateMetric('cls', (this.metrics?.cls || 0) + clsEntry.value);
        }
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.updateMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
        break;

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('fcp', entry.startTime);
        }
        break;
    }
  }

  /**
   * Update performance metrics and trigger optimizations if needed
   */
  private updateMetric(metric: keyof MobileMetrics, value: number): void {
    if (!this.metrics) {
      this.metrics = {
        lcp: 0, fid: 0, cls: 0, ttfb: 0, fcp: 0,
        networkType: 'unknown', connectionSpeed: 'unknown'
      };
    }

    (this.metrics as any)[metric] = value;

    // Trigger optimization if performance is poor
    this.evaluateAndOptimize();

    // Report metrics for analytics
    this.reportMobileMetrics(metric, value);
  }

  /**
   * Detect mobile device capabilities for optimization
   */
  private detectMobileCapabilities(): void {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection;
    const deviceMemory = (navigator as any).deviceMemory;

    if (!this.metrics) {
      this.metrics = {
        lcp: 0, fid: 0, cls: 0, ttfb: 0, fcp: 0,
        networkType: 'unknown', connectionSpeed: 'unknown'
      };
    }

    if (connection) {
      this.metrics.networkType = connection.effectiveType || 'unknown';
      this.metrics.connectionSpeed = connection.downlink ? `${connection.downlink}mbps` : 'unknown';
    }

    if (deviceMemory) {
      this.metrics.deviceMemory = deviceMemory;
    }

    // Optimize based on capabilities
    this.adaptToMobileCapabilities();
  }

  /**
   * Adapt optimizations based on mobile device capabilities
   */
  private adaptToMobileCapabilities(): void {
    const isSlowNetwork = this.metrics?.networkType === '2g' || this.metrics?.networkType === 'slow-2g';
    const isLowMemory = (this.metrics?.deviceMemory || 4) < 2;

    if (isSlowNetwork || isLowMemory) {
      // Aggressive optimizations for constrained devices
      this.config.mobileImageQuality = 60;
      this.config.batchSize = 3;
      
      // Disable non-critical features
      this.disableNonCriticalFeatures();
      
      // Implement data saver mode
      this.enableDataSaverMode();
    }
  }

  /**
   * Evaluate current performance and apply optimizations
   */
  private evaluateAndOptimize(): void {
    if (!this.metrics) return;

    const strategy: OptimizationStrategy = {
      imageStrategy: 'lazy',
      jsStrategy: 'defer',
      cssStrategy: 'critical',
      apiStrategy: 'cache-first'
    };

    // LCP optimization
    if (this.metrics.lcp > this.config.targetLCP) {
      strategy.imageStrategy = 'progressive';
      strategy.cssStrategy = 'preload';
      this.optimizeLCP();
    }

    // FID optimization
    if (this.metrics.fid > this.config.targetFID) {
      strategy.jsStrategy = 'defer';
      this.optimizeFID();
    }

    // CLS optimization
    if (this.metrics.cls > this.config.targetCLS) {
      this.optimizeCLS();
    }

    this.applyOptimizationStrategy(strategy);
  }

  /**
   * Optimize Largest Contentful Paint for mobile
   */
  private optimizeLCP(): void {
    // Preload critical images
    const heroImages = document.querySelectorAll('img[data-priority="high"]');
    heroImages.forEach((img) => {
      if (img instanceof HTMLImageElement && !img.complete) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = img.src;
        link.as = 'image';
        document.head.appendChild(link);
      }
    });

    // Optimize image loading
    this.implementProgressiveImageLoading();
  }

  /**
   * Optimize First Input Delay for mobile responsiveness
   */
  private optimizeFID(): void {
    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[data-critical="false"]');
    scripts.forEach((script) => {
      if (script instanceof HTMLScriptElement && !script.defer && !script.async) {
        script.defer = true;
      }
    });

    // Break up long tasks
    this.implementTaskScheduling();
  }

  /**
   * Optimize Cumulative Layout Shift for mobile stability
   */
  private optimizeCLS(): void {
    // Add size attributes to images without dimensions
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        // Set temporary dimensions to prevent layout shift
        const aspectRatio = img.naturalWidth / img.naturalHeight || 16/9;
        img.style.aspectRatio = aspectRatio.toString();
        img.style.width = '100%';
        img.style.height = 'auto';
      }
    });

    // Reserve space for dynamic content
    this.reserveLayoutSpace();
  }

  /**
   * Implement progressive image loading for mobile
   */
  private implementProgressiveImageLoading(): void {
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadProgressiveImage(img);
              this.intersectionObserver?.unobserve(img);
            }
          });
        },
        { rootMargin: '50px' } // Load images 50px before they come into view
      );
    }

    // Observe all lazy-loaded images
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => {
      this.intersectionObserver?.observe(img);
    });
  }

  /**
   * Load progressive image with quality optimization
   */
  private loadProgressiveImage(img: HTMLImageElement): void {
    const originalSrc = img.dataset.src;
    if (!originalSrc) return;

    // Show low-quality placeholder first
    const placeholderSrc = this.generatePlaceholder(originalSrc);
    if (placeholderSrc) {
      img.src = placeholderSrc;
    }

    // Create high-quality image
    const highQualityImg = new Image();
    highQualityImg.onload = () => {
      img.src = highQualityImg.src;
      img.classList.add('loaded');
    };
    
    // Optimize image URL for mobile
    highQualityImg.src = this.optimizeImageForMobile(originalSrc);
  }

  /**
   * Generate low-quality placeholder for progressive loading
   */
  private generatePlaceholder(src: string): string | null {
    // Generate ultra-low quality version
    if (src.includes('?')) {
      return `${src}&q=20&w=50`;
    }
    return `${src}?q=20&w=50`;
  }

  /**
   * Optimize image URL for mobile devices
   */
  private optimizeImageForMobile(src: string): string {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * devicePixelRatio;
    
    // Add mobile-specific parameters
    let optimizedSrc = src;
    if (src.includes('?')) {
      optimizedSrc += `&q=${this.config.mobileImageQuality}&w=${Math.min(screenWidth, 1200)}&f=webp`;
    } else {
      optimizedSrc += `?q=${this.config.mobileImageQuality}&w=${Math.min(screenWidth, 1200)}&f=webp`;
    }

    return optimizedSrc;
  }

  /**
   * Implement task scheduling for better responsiveness
   */
  private implementTaskScheduling(): void {
    const scheduler = (task: () => void): void => {
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        (window as any).scheduler.postTask(task, { priority: 'user-blocking' });
      } else if ('requestIdleCallback' in window) {
        requestIdleCallback(task);
      } else {
        setTimeout(task, 0);
      }
    };

    // Export scheduler for use by other components
    (window as any).__mobileScheduler = scheduler;
  }

  /**
   * Reserve space for dynamic content to prevent layout shift
   */
  private reserveLayoutSpace(): void {
    // Add minimum heights to containers that will load content
    const containers = document.querySelectorAll('[data-dynamic-content]');
    containers.forEach((container) => {
      if (container instanceof HTMLElement && !container.style.minHeight) {
        const expectedHeight = container.dataset.expectedHeight || '200px';
        container.style.minHeight = expectedHeight;
      }
    });
  }

  /**
   * Setup critical resource preloading for mobile
   */
  private setupCriticalResourcePreloading(): void {
    if (!this.config.preloadCritical || typeof document === 'undefined') return;

    // Preload critical CSS
    const criticalCSS = [
      '/styles/critical-mobile.css',
      '/styles/above-fold.css'
    ];

    criticalCSS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      link.onload = () => {
        // Convert to stylesheet after loading
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });

    // Preload critical JavaScript
    const criticalJS = [
      '/scripts/mobile-core.js',
      '/scripts/touch-handlers.js'
    ];

    criticalJS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }

  /**
   * Initialize mobile-specific optimizations
   */
  private initializeMobileOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Optimize touch events
    this.optimizeTouchEvents();

    // Setup viewport optimization
    this.setupViewportOptimization();

    // Enable mobile-specific caching
    this.enableMobileCaching();

    // Setup service worker for offline support
    if (this.config.enableServiceWorker) {
      this.setupServiceWorker();
    }
  }

  /**
   * Optimize touch events for better mobile performance
   */
  private optimizeTouchEvents(): void {
    // Use passive listeners for scroll performance
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach((event) => {
      document.addEventListener(event, () => {}, { passive: true });
    });

    // Prevent 300ms click delay on mobile
    let touchTime = 0;
    document.addEventListener('touchend', (e) => {
      const now = new Date().getTime();
      if (now - touchTime < 500) {
        e.preventDefault();
      }
      touchTime = now;
    });
  }

  /**
   * Setup viewport optimization for mobile
   */
  private setupViewportOptimization(): void {
    // Ensure proper viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

    // Add safe area CSS custom properties
    document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
  }

  /**
   * Enable mobile-specific caching strategies
   */
  private enableMobileCaching(): void {
    // Cache API responses for faster subsequent loads
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const cacheKey = `mobile_cache_${typeof url === 'string' ? url : url.toString()}`;
      
      // Check cache for GET requests
      if (!options?.method || options.method === 'GET') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 300000) {
            return new Response(JSON.stringify(data));
          }
        }
      }

      // Make request and cache result
      const response = await originalFetch(...args);
      if (response.ok && (!options?.method || options.method === 'GET')) {
        const data = await response.clone().json().catch(() => null);
        if (data) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
      }

      return response;
    };
  }

  /**
   * Setup service worker for offline support and caching
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-mobile.js')
        .then((registration) => {
          console.log('Mobile SW registered:', registration);
        })
        .catch((error) => {
          console.warn('Mobile SW registration failed:', error);
        });
    }
  }

  /**
   * Disable non-critical features for low-end devices
   */
  private disableNonCriticalFeatures(): void {
    // Disable animations on low-end devices
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);

    // Disable background images
    document.body.classList.add('data-saver-mode');
  }

  /**
   * Enable data saver mode for constrained networks
   */
  private enableDataSaverMode(): void {
    // Replace images with placeholders
    const images = document.querySelectorAll('img[src]');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.textContent = 'Image';
        placeholder.onclick = () => {
          img.style.display = 'block';
          placeholder.remove();
        };
        img.style.display = 'none';
        img.parentNode?.insertBefore(placeholder, img);
      }
    });

    // Show data saver indicator
    this.showDataSaverNotification();
  }

  /**
   * Show data saver mode notification
   */
  private showDataSaverNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'data-saver-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>📱 Data Saver Mode Active</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  /**
   * Apply optimization strategy based on performance metrics
   */
  private applyOptimizationStrategy(strategy: OptimizationStrategy): void {
    // Implementation of strategy application
    document.body.setAttribute('data-image-strategy', strategy.imageStrategy);
    document.body.setAttribute('data-js-strategy', strategy.jsStrategy);
    document.body.setAttribute('data-css-strategy', strategy.cssStrategy);
    document.body.setAttribute('data-api-strategy', strategy.apiStrategy);
  }

  /**
   * Report mobile metrics for analytics
   */
  private reportMobileMetrics(metric: string, value: number): void {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'mobile_performance', {
        event_category: 'Performance',
        event_label: metric,
        value: Math.round(value),
        custom_map: {
          network_type: this.metrics?.networkType,
          device_memory: this.metrics?.deviceMemory
        }
      });
    }

    // Log performance issues
    if (metric === 'lcp' && value > this.config.targetLCP) {
      console.warn(`LCP exceeded target: ${value}ms > ${this.config.targetLCP}ms`);
    }
    if (metric === 'fid' && value > this.config.targetFID) {
      console.warn(`FID exceeded target: ${value}ms > ${this.config.targetFID}ms`);
    }
    if (metric === 'cls' && value > this.config.targetCLS) {
      console.warn(`CLS exceeded target: ${value} > ${this.config.targetCLS}`);
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): MobileMetrics | null {
    return this.metrics;
  }

  /**
   * Get performance score (0-100)
   */
  public getPerformanceScore(): number {
    if (!this.metrics) return 0;

    const lcpScore = Math.max(0, 100 - (this.metrics.lcp / this.config.targetLCP) * 50);
    const fidScore = Math.max(0, 100 - (this.metrics.fid / this.config.targetFID) * 50);
    const clsScore = Math.max(0, 100 - (this.metrics.cls / this.config.targetCLS) * 100);

    return (lcpScore + fidScore + clsScore) / 3;
  }

  /**
   * Force performance optimization
   */
  public optimize(): void {
    this.evaluateAndOptimize();
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.observer?.disconnect();
    this.intersectionObserver?.disconnect();
  }
}

// Export singleton instance
export const mobilePerformanceOptimizer = new MobilePerformanceOptimizer();
export default MobilePerformanceOptimizer;

// CSS for mobile performance optimizations
export const mobilePerformanceCSS = `
/* Mobile Performance Optimization Styles */
.image-placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.image-placeholder:hover {
  background: #e5e7eb;
}

.data-saver-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fbbf24;
  color: #92400e;
  z-index: 9999;
  padding: 8px;
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.notification-content button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
}

/* Data saver mode styles */
.data-saver-mode img {
  filter: grayscale(0.5);
}

.data-saver-mode .hero-background {
  display: none;
}

/* Progressive image loading */
img {
  transition: opacity 0.3s ease;
}

img:not(.loaded) {
  opacity: 0.5;
}

img.loaded {
  opacity: 1;
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  /* Reduce motion for better performance */
  * {
    scroll-behavior: auto !important;
  }
  
  /* Optimize touch targets */
  button, a, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Optimize scrolling performance */
  body {
    -webkit-overflow-scrolling: touch;
  }
}

/* High performance mode for low-end devices */
.performance-mode * {
  animation: none !important;
  transition: none !important;
  transform: none !important;
  filter: none !important;
  box-shadow: none !important;
}

/* Safe area support for mobile devices */
.safe-area-inset {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
}
`;