/**
 * Client-Side Memory Management System
 * Prevents memory leaks in caches and component state
 * Provides automatic cleanup and monitoring
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  ttl: number;
}

interface MemoryManagerConfig {
  maxCacheSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  memoryThreshold: number; // MB
}

export class MemoryManager {
  private caches = new Map<string, Map<string, CacheEntry<any>>>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private observers = new Set<MutationObserver>();
  private config: MemoryManagerConfig;
  private memoryWarnings = 0;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      maxCacheSize: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      memoryThreshold: 50, // 50MB
      ...config
    };

    this.startMemoryMonitoring();
    this.setupPageUnloadCleanup();
  }

  /**
   * Create a managed cache with automatic cleanup
   */
  createCache<T>(name: string, ttl?: number): ManagedCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
      this.startCacheCleanup(name);
    }

    return new ManagedCache<T>(
      name,
      this.caches.get(name)!,
      ttl || this.config.defaultTTL,
      this.config.maxCacheSize
    );
  }

  /**
   * Start automatic cleanup for a cache
   */
  private startCacheCleanup(cacheName: string): void {
    const interval = setInterval(() => {
      this.cleanupCache(cacheName);
    }, this.config.cleanupInterval);

    this.intervals.set(cacheName, interval);
  }

  /**
   * Clean up expired and least-used cache entries
   */
  private cleanupCache(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const now = Date.now();
    const entries = Array.from(cache.entries());
    
    // Remove expired entries
    let removedExpired = 0;
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
        removedExpired++;
      }
    }

    // If still over limit, remove least recently used
    if (cache.size > this.config.maxCacheSize) {
      const sortedEntries = entries
        .filter(([key]) => cache.has(key)) // Still exists after expiry cleanup
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      
      const excessCount = cache.size - this.config.maxCacheSize;
      let removedLRU = 0;
      
      for (let i = 0; i < excessCount && i < sortedEntries.length; i++) {
        cache.delete(sortedEntries[i][0]);
        removedLRU++;
      }

      if (removedLRU > 0) {
        console.debug(`Cache ${cacheName}: Removed ${removedLRU} LRU entries`);
      }
    }

    if (removedExpired > 0) {
      console.debug(`Cache ${cacheName}: Removed ${removedExpired} expired entries`);
    }
  }

  /**
   * Monitor memory usage and trigger cleanup
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Check memory usage every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    // Monitor performance entries for memory leaks
    if ('performance' in window && 'memory' in (window.performance as any)) {
      this.monitorPerformanceMemory();
    }
  }

  /**
   * Check current memory usage and trigger cleanup if needed
   */
  private checkMemoryUsage(): void {
    if (typeof window === 'undefined') return;

    const performance = window.performance as any;
    if (!performance.memory) return;

    const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercentage = (usedMB / limitMB) * 100;

    if (usedMB > this.config.memoryThreshold || usagePercentage > 80) {
      this.memoryWarnings++;
      console.warn(`High memory usage detected: ${usedMB.toFixed(1)}MB (${usagePercentage.toFixed(1)}%)`);
      
      // Force cleanup of all caches
      this.forceCleanupAll();
      
      // Trigger garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    }
  }

  /**
   * Monitor performance memory metrics
   */
  private monitorPerformanceMemory(): void {
    const performance = window.performance as any;
    if (!performance.memory) return;

    let previousUsage = performance.memory.usedJSHeapSize;
    
    setInterval(() => {
      const currentUsage = performance.memory.usedJSHeapSize;
      const delta = currentUsage - previousUsage;
      
      // Alert on rapid memory growth (>10MB in 30 seconds)
      if (delta > 10 * 1024 * 1024) {
        console.warn(`Rapid memory growth detected: +${(delta / (1024 * 1024)).toFixed(1)}MB`);
        this.forceCleanupAll();
      }
      
      previousUsage = currentUsage;
    }, 30000);
  }

  /**
   * Force cleanup of all caches
   */
  private forceCleanupAll(): void {
    for (const cacheName of this.caches.keys()) {
      this.cleanupCache(cacheName);
    }
  }

  /**
   * Setup cleanup on page unload
   */
  private setupPageUnloadCleanup(): void {
    if (typeof window === 'undefined') return;

    const cleanup = () => this.destroy();
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Also cleanup on visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.forceCleanupAll();
      }
    });
  }

  /**
   * Create a managed mutation observer that auto-cleans up
   */
  createObserver(callback: MutationCallback, options?: MutationObserverInit): MutationObserver {
    const observer = new MutationObserver(callback);
    this.observers.add(observer);
    return observer;
  }

  /**
   * Destroy all resources and cleanup
   */
  destroy(): void {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Disconnect all observers
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();

    // Clear all caches
    this.caches.clear();

    console.log('MemoryManager destroyed and cleaned up');
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): MemoryStats {
    const cacheStats = new Map<string, number>();
    for (const [name, cache] of this.caches) {
      cacheStats.set(name, cache.size);
    }

    let memoryUsage: MemoryUsage | undefined;
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      const memory = (window.performance as any).memory;
      memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
        limit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024))
      };
    }

    return {
      caches: Object.fromEntries(cacheStats),
      memoryUsage,
      memoryWarnings: this.memoryWarnings,
      observerCount: this.observers.size
    };
  }
}

/**
 * Managed cache with automatic cleanup
 */
class ManagedCache<T> {
  constructor(
    private name: string,
    private cache: Map<string, CacheEntry<T>>,
    private ttl: number,
    private maxSize: number
  ) {}

  set(key: string, value: T, customTTL?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data: value,
      timestamp: now,
      accessCount: 1,
      lastAccess: now,
      ttl: customTTL || this.ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccess = now;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Types
interface MemoryStats {
  caches: Record<string, number>;
  memoryUsage?: MemoryUsage;
  memoryWarnings: number;
  observerCount: number;
}

interface MemoryUsage {
  used: number; // MB
  total: number; // MB
  limit: number; // MB
}

// Export singleton instance
export const memoryManager = new MemoryManager();

// Export cache creation helper
export function createManagedCache<T>(name: string, ttl?: number): ManagedCache<T> {
  return memoryManager.createCache<T>(name, ttl);
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__memoryManager = memoryManager;
}