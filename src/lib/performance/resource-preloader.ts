/**
 * Resource Preloader for Core Web Vitals Optimization
 * Intelligent preloading of critical resources based on user behavior and page type
 */

interface PreloadStrategy {
  priority: 'high' | 'medium' | 'low';
  trigger: 'immediate' | 'hover' | 'intersection' | 'idle';
  resources: string[];
  condition?: () => boolean;
}

interface PreloadConfig {
  // Critical resources to preload immediately
  critical: {
    fonts: string[];
    scripts: string[];
    styles: string[];
    images: string[];
  };
  
  // Page-specific preload strategies
  pageStrategies: Map<string, PreloadStrategy[]>;
  
  // User behavior triggers
  behavioral: {
    hoverDelay: number;         // ms to wait before preloading on hover
    intersectionMargin: string; // margin for intersection observer
    idleTimeout: number;        // ms to wait for idle time
  };
  
  // Performance budgets
  budgets: {
    maxConcurrentRequests: number;
    maxBandwidthMbps: number;
    respectDataSaver: boolean;
  };
}

export class ResourcePreloader {
  private config: PreloadConfig;
  private preloadedResources = new Set<string>();
  private intersectionObserver?: IntersectionObserver;
  private hoverTimeouts = new Map<string, number>();
  private performanceMetrics = {
    preloadsTriggered: 0,
    preloadsCompleted: 0,
    cacheHits: 0,
    bandwidthSaved: 0
  };

  constructor(config: Partial<PreloadConfig> = {}) {
    this.config = {
      critical: {
        fonts: [
          'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf',
          'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf',
          'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf'
        ],
        scripts: [
          // Assets are generated with hashed names by Astro build process
          // Actual preloading handled by Astro's built-in optimization
        ],
        styles: [
          // Critical CSS is inlined by Astro for better performance
        ],
        images: []
      },
      pageStrategies: new Map(),
      behavioral: {
        hoverDelay: 150,
        intersectionMargin: '100px',
        idleTimeout: 2000
      },
      budgets: {
        maxConcurrentRequests: 6,
        maxBandwidthMbps: 10,
        respectDataSaver: true
      },
      ...config
    };

    this.initializeStrategies();
    this.setupObservers();
  }

  /**
   * Initialize preload strategies for different page types
   */
  private initializeStrategies(): void {
    // Homepage strategy
    this.config.pageStrategies.set('/', [
      {
        priority: 'high',
        trigger: 'immediate',
        resources: [
          '/texas',
          '/electricity-plans/dallas/',
          '/electricity-plans/houston/',
          // Faceted system assets handled by Astro's module system
        ]
      },
      {
        priority: 'medium',
        trigger: 'idle',
        resources: [
          '/compare',
          '/providers',
          // API system assets handled by Astro's module system
        ]
      }
    ]);

    // Texas market page strategy
    this.config.pageStrategies.set('/texas', [
      {
        priority: 'high',
        trigger: 'immediate',
        resources: [
          '/electricity-plans/dallas/',
          '/electricity-plans/houston/',
          '/electricity-plans/austin-tx/',
          '/electricity-plans/san-antonio-tx/'
        ]
      }
    ]);

    // City page strategy
    this.config.pageStrategies.set('/electricity-plans/[city]', [
      {
        priority: 'high',
        trigger: 'immediate',
        resources: [
          // Faceted system assets handled by Astro's module system,
          // API system assets handled by Astro's module system
        ]
      },
      {
        priority: 'medium',
        trigger: 'hover',
        resources: [
          '/electricity-plans/[city]/12-month/',
          '/electricity-plans/[city]/fixed-rate/',
          '/electricity-plans/[city]/green-energy/'
        ]
      }
    ]);

    // Faceted page strategy
    this.config.pageStrategies.set('/electricity-plans/[city]/[filter]', [
      {
        priority: 'high',
        trigger: 'immediate',
        resources: [
          // Faceted system assets handled by Astro's module system,
          // API system assets handled by Astro's module system
        ]
      },
      {
        priority: 'medium',
        trigger: 'intersection',
        resources: [
          '/compare',
          // SEO system assets handled by Astro's module system
        ]
      }
    ]);
  }

  /**
   * Start preloading based on current page and user behavior
   */
  async startPreloading(currentPath: string): Promise<void> {
    console.log('🚀 Starting intelligent resource preloading');

    // Check performance budget constraints
    if (!this.isWithinBudget()) {
      console.warn('⚠️ Preloading restricted due to performance budget constraints');
      return;
    }

    // Preload critical resources immediately
    await this.preloadCriticalResources();

    // Apply page-specific strategies
    await this.applyPageStrategies(currentPath);

    // Setup behavioral triggers
    this.setupBehavioralTriggers();
  }

  /**
   * Preload critical resources for immediate page rendering
   */
  private async preloadCriticalResources(): Promise<void> {
    const criticalPromises: Promise<void>[] = [];

    // Preload critical fonts
    for (const font of this.config.critical.fonts) {
      if (!this.preloadedResources.has(font)) {
        criticalPromises.push(this.preloadResource(font, 'font', 'high'));
      }
    }

    // Preload critical scripts
    for (const script of this.config.critical.scripts) {
      if (!this.preloadedResources.has(script)) {
        criticalPromises.push(this.preloadResource(script, 'script', 'high'));
      }
    }

    // Preload critical styles
    for (const style of this.config.critical.styles) {
      if (!this.preloadedResources.has(style)) {
        criticalPromises.push(this.preloadResource(style, 'style', 'high'));
      }
    }

    // Wait for all critical resources
    await Promise.allSettled(criticalPromises);
    console.log('✅ Critical resources preloaded');
  }

  /**
   * Apply page-specific preload strategies
   */
  private async applyPageStrategies(currentPath: string): Promise<void> {
    // Find matching strategy
    let strategies: PreloadStrategy[] = [];
    
    for (const [pattern, pageStrategies] of this.config.pageStrategies.entries()) {
      if (this.matchesPattern(currentPath, pattern)) {
        strategies = pageStrategies;
        break;
      }
    }

    if (strategies.length === 0) {
      console.log('ℹ️ No specific preload strategy found for', currentPath);
      return;
    }

    // Apply strategies based on trigger
    for (const strategy of strategies) {
      if (strategy.condition && !strategy.condition()) {
        continue;
      }

      switch (strategy.trigger) {
        case 'immediate':
          await this.executeStrategy(strategy);
          break;
        case 'idle':
          this.scheduleIdlePreload(strategy);
          break;
        case 'hover':
        case 'intersection':
          // These are handled by behavioral triggers
          break;
      }
    }
  }

  /**
   * Execute a preload strategy
   */
  private async executeStrategy(strategy: PreloadStrategy): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const resource of strategy.resources) {
      if (!this.preloadedResources.has(resource)) {
        const resourceType = this.inferResourceType(resource);
        promises.push(this.preloadResource(resource, resourceType, strategy.priority));
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Preload a specific resource
   */
  private async preloadResource(
    url: string, 
    type: 'script' | 'style' | 'font' | 'image' | 'fetch',
    priority: 'high' | 'medium' | 'low'
  ): Promise<void> {
    if (this.preloadedResources.has(url)) {
      this.performanceMetrics.cacheHits++;
      return;
    }

    try {
      this.performanceMetrics.preloadsTriggered++;
      
      if (typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        // Set resource type and attributes
        switch (type) {
          case 'script':
            link.as = 'script';
            if (priority === 'high') {
              link.setAttribute('fetchpriority', 'high');
            }
            break;
          case 'style':
            link.as = 'style';
            break;
          case 'font':
            link.as = 'font';
            link.type = 'font/ttf';
            link.crossOrigin = 'anonymous';
            if (priority === 'high') {
              link.setAttribute('fetchpriority', 'high');
            }
            break;
          case 'image':
            link.as = 'image';
            if (this.supportsAvif()) {
              link.type = 'image/avif';
            } else if (this.supportsWebp()) {
              link.type = 'image/webp';
            }
            break;
          case 'fetch':
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
            break;
        }

        // Add to document
        document.head.appendChild(link);

        // Track completion
        link.onload = () => {
          this.performanceMetrics.preloadsCompleted++;
          console.log(`✅ Preloaded: ${url}`);
        };

        link.onerror = () => {
          console.warn(`❌ Failed to preload: ${url}`);
        };

        this.preloadedResources.add(url);
      } else {
        // Server-side: use fetch to warm cache
        await fetch(url, { 
          method: 'HEAD',
          priority: priority === 'high' ? 'high' : 'low'
        } as any);
        this.preloadedResources.add(url);
      }
    } catch (error) {
      console.warn(`Failed to preload ${url}:`, error);
    }
  }

  /**
   * Setup behavioral triggers for preloading
   */
  private setupBehavioralTriggers(): void {
    if (typeof document === 'undefined') return;

    // Hover-based preloading
    this.setupHoverPreloading();

    // Intersection-based preloading
    this.setupIntersectionPreloading();

    // Connection-aware preloading
    this.setupConnectionAwarePreloading();
  }

  /**
   * Setup hover-based preloading for links
   */
  private setupHoverPreloading(): void {
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link || !this.isInternalLink(link.href)) return;

      const href = link.href;
      if (this.preloadedResources.has(href)) return;

      // Clear any existing timeout for this link
      if (this.hoverTimeouts.has(href)) {
        clearTimeout(this.hoverTimeouts.get(href));
      }

      // Set timeout for preloading
      const timeoutId = setTimeout(() => {
        this.preloadResource(href, 'fetch', 'medium');
        this.hoverTimeouts.delete(href);
      }, this.config.behavioral.hoverDelay);

      this.hoverTimeouts.set(href, timeoutId);
    });

    // Cancel preload on mouse leave
    document.addEventListener('mouseout', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link) {
        const href = link.href;
        if (this.hoverTimeouts.has(href)) {
          clearTimeout(this.hoverTimeouts.get(href));
          this.hoverTimeouts.delete(href);
        }
      }
    });
  }

  /**
   * Setup intersection-based preloading
   */
  private setupIntersectionPreloading(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadUrls = element.dataset.preload?.split(',') || [];
            
            for (const url of preloadUrls) {
              if (url.trim() && !this.preloadedResources.has(url.trim())) {
                const resourceType = this.inferResourceType(url.trim());
                this.preloadResource(url.trim(), resourceType, 'low');
              }
            }
            
            this.intersectionObserver?.unobserve(element);
          }
        });
      },
      {
        rootMargin: this.config.behavioral.intersectionMargin,
        threshold: 0.1
      }
    );

    // Observe elements with preload data attributes
    document.querySelectorAll('[data-preload]').forEach((element) => {
      this.intersectionObserver?.observe(element);
    });
  }

  /**
   * Setup connection-aware preloading
   */
  private setupConnectionAwarePreloading(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Adjust preloading based on connection quality
      if (connection) {
        const effectiveType = connection.effectiveType;
        const saveData = connection.saveData;
        
        if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
          console.log('🐌 Slow connection detected - reducing preloading');
          this.config.budgets.maxConcurrentRequests = 2;
        } else if (effectiveType === '3g') {
          this.config.budgets.maxConcurrentRequests = 4;
        } else {
          this.config.budgets.maxConcurrentRequests = 6;
        }
      }
    }
  }

  /**
   * Schedule idle-time preloading
   */
  private scheduleIdlePreload(strategy: PreloadStrategy): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        () => {
          this.executeStrategy(strategy);
        },
        { timeout: this.config.behavioral.idleTimeout }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.executeStrategy(strategy);
      }, this.config.behavioral.idleTimeout);
    }
  }

  /**
   * Check if within performance budget
   */
  private isWithinBudget(): boolean {
    if (this.config.budgets.respectDataSaver && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.saveData) {
        return false;
      }
    }

    // Check concurrent requests (simplified)
    if (this.performanceMetrics.preloadsTriggered > this.config.budgets.maxConcurrentRequests) {
      return false;
    }

    return true;
  }

  /**
   * Helper functions
   */
  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern === path) return true;
    
    // Simple pattern matching for dynamic routes
    const regex = pattern.replace(/\[([^\]]+)\]/g, '([^/]+)');
    return new RegExp(`^${regex}$`).test(path);
  }

  private inferResourceType(url: string): 'script' | 'style' | 'font' | 'image' | 'fetch' {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(ttf|woff2?|otf|eot)$/)) return 'font';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    return 'fetch';
  }

  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.origin === location.origin;
    } catch {
      return url.startsWith('/');
    }
  }

  private supportsWebp(): boolean {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAvif(): boolean {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      preloadedResourcesCount: this.preloadedResources.size,
      hitRate: this.performanceMetrics.preloadsTriggered > 0 ? 
        this.performanceMetrics.cacheHits / this.performanceMetrics.preloadsTriggered : 0
    };
  }

  /**
   * Manual preload method for external use
   */
  async preload(
    resources: string[], 
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    const promises = resources.map(url => {
      const type = this.inferResourceType(url);
      return this.preloadResource(url, type, priority);
    });
    
    await Promise.allSettled(promises);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.intersectionObserver?.disconnect();
    
    // Clear all timeouts
    for (const timeoutId of this.hoverTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.hoverTimeouts.clear();
  }
}

// Export singleton and utility functions
export const resourcePreloader = new ResourcePreloader();

export function initializePreloading(currentPath: string): Promise<void> {
  return resourcePreloader.startPreloading(currentPath);
}

export function preloadCriticalResources(resources: string[]): Promise<void> {
  return resourcePreloader.preload(resources, 'high');
}

export function getPreloadMetrics() {
  return resourcePreloader.getMetrics();
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const currentPath = window.location.pathname;
    initializePreloading(currentPath);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    resourcePreloader.cleanup();
  });
}

export default ResourcePreloader;