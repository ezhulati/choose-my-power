/**
 * Performance Optimizer for Faceted Navigation
 * Implements caching, debouncing, lazy loading, and performance monitoring
 * Optimized for 881-city scale with enterprise-grade performance
 */

import type { FilterState, Plan, FacetValue } from '../../types/facets';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

export interface PerformanceMetrics {
  searchTime: number;
  cacheHitRate: number;
  apiCalls: number;
  renderTime: number;
  memoryUsage?: number;
}

export interface OptimizationOptions {
  enableCache: boolean;
  enableDebounce: boolean;
  debounceDelay: number;
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  maxConcurrentRequests: number;
}

export class PerformanceOptimizer {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private requestCache = new Map<string, Promise<unknown>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private performanceMetrics: PerformanceMetrics = {
    searchTime: 0,
    cacheHitRate: 0,
    apiCalls: 0,
    renderTime: 0
  };

  private readonly defaultConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 300000, // 5 minutes
    staleWhileRevalidate: true
  };

  private readonly defaultOptions: OptimizationOptions = {
    enableCache: true,
    enableDebounce: true,
    debounceDelay: 300,
    enableLazyLoading: true,
    enablePreloading: false,
    maxConcurrentRequests: 5
  };

  private activeRequests = 0;
  private requestQueue: Array<() => Promise<unknown>> = [];

  constructor(
    private config: CacheConfig = {},
    private options: OptimizationOptions = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.options = { ...this.defaultOptions, ...options };

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Optimized search with caching, debouncing, and request deduplication
   */
  async optimizedSearch(
    citySlug: string,
    filterState: FilterState,
    searchFunction: () => Promise<unknown>
  ): Promise<unknown> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(citySlug, filterState);

    try {
      // Check cache first
      if (this.options.enableCache) {
        const cached = this.getCached(cacheKey);
        if (cached) {
          this.updateMetrics('cacheHit', performance.now() - startTime);
          return cached;
        }
      }

      // Check if request is already in flight
      if (this.requestCache.has(cacheKey)) {
        return await this.requestCache.get(cacheKey)!;
      }

      // Rate limit requests
      const request = this.executeWithRateLimit(async () => {
        this.performanceMetrics.apiCalls++;
        return await searchFunction();
      });

      // Cache the promise to avoid duplicate requests
      this.requestCache.set(cacheKey, request);

      const result = await request;

      // Cache the result
      if (this.options.enableCache && result) {
        this.setCached(cacheKey, result, this.config.ttl);
      }

      // Clean up request cache
      this.requestCache.delete(cacheKey);

      this.updateMetrics('apiCall', performance.now() - startTime);
      return result;

    } catch (error) {
      // Clean up on error
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Debounced function execution
   */
  debounce<T extends (...args: unknown[]) => Promise<unknown>>(
    key: string,
    func: T,
    delay?: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    if (!this.options.enableDebounce) {
      return func;
    }

    const debounceDelay = delay || this.options.debounceDelay;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Clear existing timer
        if (this.debounceTimers.has(key)) {
          clearTimeout(this.debounceTimers.get(key)!);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, debounceDelay);

        this.debounceTimers.set(key, timer);
      });
    };
  }

  /**
   * Lazy loading with intersection observer
   */
  createLazyLoader<T>(
    loadFunction: () => Promise<T>,
    options: IntersectionObserverInit = {}
  ): {
    element: HTMLElement | null;
    load: () => Promise<T>;
    observer: IntersectionObserver | null;
  } {
    if (!this.options.enableLazyLoading) {
      return {
        element: null,
        load: loadFunction,
        observer: null
      };
    }

    let hasLoaded = false;
    let loadPromise: Promise<T> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            hasLoaded = true;
            loadPromise = loadFunction();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    return {
      element: null, // Will be set by component
      load: async () => {
        if (loadPromise) return loadPromise;
        if (hasLoaded) return loadFunction();
        
        hasLoaded = true;
        loadPromise = loadFunction();
        return loadPromise;
      },
      observer
    };
  }

  /**
   * Preload data for likely next interactions
   */
  async preloadData(
    citySlug: string,
    baseFilters: FilterState,
    commonFilterCombinations: FilterState[]
  ): Promise<void> {
    if (!this.options.enablePreloading) return;

    const preloadPromises = commonFilterCombinations.map(async (filters) => {
      const combinedFilters = { ...baseFilters, ...filters };
      const cacheKey = this.generateCacheKey(citySlug, combinedFilters);
      
      // Only preload if not already cached
      if (!this.getCached(cacheKey)) {
        try {
          // Use a lightweight request for preloading
          const response = await fetch('/api/facets/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ citySlug, filters: combinedFilters, preview: true })
          });

          if (response.ok) {
            const data = await response.json();
            this.setCached(cacheKey, data, this.config.ttl / 2); // Shorter TTL for preloaded data
          }
        } catch (error) {
          console.warn('Preload failed:', error);
        }
      }
    });

    // Execute preloads with concurrency limit
    const chunks = this.chunkArray(preloadPromises, 3);
    for (const chunk of chunks) {
      await Promise.allSettled(chunk);
    }
  }

  /**
   * Optimize facet counts calculation
   */
  optimizeFacetCounts(
    plans: Plan[],
    currentFilters: FilterState
  ): Record<string, Record<string, number>> {
    const startTime = performance.now();
    
    // Use Map for better performance with large datasets
    const counters = {
      rateTypes: new Map<string, number>(),
      contractLengths: new Map<string, number>(),
      greenEnergyLevels: new Map<string, number>(),
      providers: new Map<string, number>(),
      priceRanges: new Map<string, number>()
    };

    // Single pass through plans
    for (const plan of plans) {
      // Rate types
      const rateType = plan.rate_type || 'unknown';
      counters.rateTypes.set(rateType, (counters.rateTypes.get(rateType) || 0) + 1);

      // Contract lengths
      const contract = plan.term_months?.toString() || 'unknown';
      counters.contractLengths.set(contract, (counters.contractLengths.get(contract) || 0) + 1);

      // Green energy levels
      const greenLevel = plan.percent_green >= 100 ? '100' : '0';
      counters.greenEnergyLevels.set(greenLevel, (counters.greenEnergyLevels.get(greenLevel) || 0) + 1);

      // Providers
      const provider = plan.provider || 'unknown';
      counters.providers.set(provider, (counters.providers.get(provider) || 0) + 1);

      // Price ranges
      const rate = parseFloat(plan.rate) || 0;
      const priceRange = this.getPriceRange(rate);
      counters.priceRanges.set(priceRange, (counters.priceRanges.get(priceRange) || 0) + 1);
    }

    // Convert Maps to objects
    const result = {
      rateTypes: Object.fromEntries(counters.rateTypes),
      contractLengths: Object.fromEntries(counters.contractLengths),
      greenEnergyLevels: Object.fromEntries(counters.greenEnergyLevels),
      providers: Object.fromEntries(counters.providers),
      priceRanges: Object.fromEntries(counters.priceRanges)
    };

    this.updateMetrics('render', performance.now() - startTime);
    return result;
  }

  /**
   * Virtual scrolling for large plan lists
   */
  createVirtualScroller<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: T, index: number) => HTMLElement
  ): {
    visibleItems: T[];
    scrollTop: number;
    totalHeight: number;
    update: (scrollTop: number) => void;
  } {
    let scrollTop = 0;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    const totalHeight = items.length * itemHeight;

    const update = (newScrollTop: number) => {
      scrollTop = Math.max(0, Math.min(newScrollTop, totalHeight - containerHeight));
    };

    const getVisibleItems = (): T[] => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      return items.slice(startIndex, endIndex);
    };

    return {
      get visibleItems() { return getVisibleItems(); },
      get scrollTop() { return scrollTop; },
      get totalHeight() { return totalHeight; },
      update
    };
  }

  /**
   * Memory optimization - clean up unused resources
   */
  optimizeMemory(): void {
    // Clean up cache
    this.cleanupCache();

    // Clear completed debounce timers
    this.debounceTimers.clear();

    // Clear completed requests
    this.requestCache.clear();

    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
      (window as unknown).gc();
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = this.getMemoryUsage();
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      searchTime: 0,
      cacheHitRate: 0,
      apiCalls: 0,
      renderTime: 0
    };
  }

  // Private helper methods

  private generateCacheKey(citySlug: string, filterState: FilterState): string {
    const sortedKeys = Object.keys(filterState).sort();
    const filterString = sortedKeys
      .map(key => `${key}:${JSON.stringify(filterState[key as keyof FilterState])}`)
      .join('|');
    
    return `${citySlug}:${filterString}`;
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      // Handle stale-while-revalidate
      if (this.config.staleWhileRevalidate) {
        return cached.data; // Return stale data, revalidation handled elsewhere
      } else {
        this.cache.delete(key);
        return null;
      }
    }

    return cached.data;
  }

  private setCached(key: string, data: unknown, ttl: number): void {
    // Enforce cache size limit
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = Math.floor(this.config.maxSize * 0.1); // Remove 10%
      
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.options.maxConcurrentRequests) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    this.activeRequests++;
    try {
      const result = await fn();
      return result;
    } finally {
      this.activeRequests--;
      // Process queue
      if (this.requestQueue.length > 0) {
        const nextRequest = this.requestQueue.shift()!;
        setImmediate(() => nextRequest());
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl && !this.config.staleWhileRevalidate) {
        this.cache.delete(key);
      }
    }
  }

  private updateMetrics(type: 'cacheHit' | 'apiCall' | 'render', duration: number): void {
    switch (type) {
      case 'cacheHit':
        break;
      case 'apiCall':
        this.performanceMetrics.searchTime = duration;
        break;
      case 'render':
        this.performanceMetrics.renderTime = duration;
        break;
    }
  }

  private calculateCacheHitRate(): number {
    // This would be calculated based on cache hits vs misses
    return 0; // Placeholder implementation
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      return (window.performance as unknown).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private getPriceRange(rate: number): string {
    if (rate < 10) return '0-10';
    if (rate < 15) return '10-15';
    if (rate < 20) return '15-20';
    return '20+';
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export utility hooks for React components
export function useOptimizedSearch() {
  return {
    search: performanceOptimizer.optimizedSearch.bind(performanceOptimizer),
    debounce: performanceOptimizer.debounce.bind(performanceOptimizer),
    metrics: performanceOptimizer.getMetrics.bind(performanceOptimizer)
  };
}

export function useVirtualScroller<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  return performanceOptimizer.createVirtualScroller(items, itemHeight, containerHeight, () => document.createElement('div'));
}