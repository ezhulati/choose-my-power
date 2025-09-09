/**
 * Performance Monitoring and Metrics System
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Performance tracking and optimization
 */

import { logger, type LogContext } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent' | 'ratio';
  timestamp: number;
  tags?: Record<string, string>;
  context?: LogContext;
}

interface TimingMetric extends PerformanceMetric {
  startTime: number;
  endTime: number;
  duration: number;
  unit: 'ms';
}

interface MemoryMetric extends PerformanceMetric {
  heapUsed: number;
  heapTotal: number;
  external: number;
  unit: 'bytes';
}

interface CoreWebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

interface PerformanceReport {
  timestamp: string;
  pageUrl: string;
  userAgent: string;
  connectionType?: string;
  coreWebVitals: CoreWebVitals;
  customMetrics: PerformanceMetric[];
  resourceTimings: PerformanceResourceTiming[];
  errors: number;
  warnings: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  private coreWebVitals: CoreWebVitals = {};
  private enabled: boolean;
  private reportingInterval: number = 30000; // 30 seconds
  private maxMetrics: number = 1000;

  constructor() {
    this.enabled = typeof window !== 'undefined' && 'performance' in window;
    
    if (this.enabled) {
      this.initializeObservers();
      this.startPeriodicReporting();
      this.trackPageLoadMetrics();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.coreWebVitals.LCP = lastEntry.startTime;
        this.recordMetric('core_web_vitals_lcp', lastEntry.startTime, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          this.coreWebVitals.FID = entry.processingStart - entry.startTime;
          this.recordMetric('core_web_vitals_fid', this.coreWebVitals.FID, 'ms');
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.coreWebVitals.CLS = clsValue;
        this.recordMetric('core_web_vitals_cls', clsValue, 'ratio');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Navigation timing
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: PerformanceNavigationTiming) => {
          this.processNavigationTiming(entry);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: PerformanceResourceTiming) => {
          this.processResourceTiming(entry);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

    } catch (error) {
      logger.warn('Failed to initialize performance observers', error, {
        component: 'PerformanceMonitor',
        action: 'initialize_observers'
      });
    }
  }

  /**
   * Process navigation timing metrics
   */
  private processNavigationTiming(entry: PerformanceNavigationTiming): void {
    // Time to First Byte
    const ttfb = entry.responseStart - entry.requestStart;
    this.coreWebVitals.TTFB = ttfb;
    this.recordMetric('core_web_vitals_ttfb', ttfb, 'ms');

    // DOM Content Loaded
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    this.recordMetric('dom_content_loaded', domContentLoaded, 'ms');

    // Load Complete
    const loadComplete = entry.loadEventEnd - entry.loadEventStart;
    this.recordMetric('load_complete', loadComplete, 'ms');

    // DNS Lookup Time
    const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
    this.recordMetric('dns_lookup_time', dnsTime, 'ms');

    // TCP Connection Time
    const tcpTime = entry.connectEnd - entry.connectStart;
    this.recordMetric('tcp_connection_time', tcpTime, 'ms');

    // SSL Time (if applicable)
    if (entry.secureConnectionStart > 0) {
      const sslTime = entry.connectEnd - entry.secureConnectionStart;
      this.recordMetric('ssl_handshake_time', sslTime, 'ms');
    }
  }

  /**
   * Process resource timing metrics
   */
  private processResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const resourceType = this.getResourceType(entry.name);
    
    this.recordMetric(`resource_load_time_${resourceType}`, duration, 'ms', {
      resource_url: entry.name,
      resource_type: resourceType,
      cache_hit: entry.transferSize === 0 ? 'true' : 'false'
    });

    // Track large resources
    if (entry.transferSize > 100000) { // > 100KB
      this.recordMetric('large_resource_detected', entry.transferSize, 'bytes', {
        resource_url: entry.name,
        resource_type: resourceType
      });
    }
  }

  /**
   * Determine resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Track page load metrics
   */
  private trackPageLoadMetrics(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordMetric('dom_ready', performance.now(), 'ms');
      });
    }

    window.addEventListener('load', () => {
      this.recordMetric('page_load_complete', performance.now(), 'ms');
      
      // Measure First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        this.coreWebVitals.FCP = fcpEntry.startTime;
        this.recordMetric('core_web_vitals_fcp', fcpEntry.startTime, 'ms');
      }
    });
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting(): void {
    setInterval(() => {
      this.generateReport();
      this.cleanupOldMetrics();
    }, this.reportingInterval);
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    tags?: Record<string, string>,
    context?: LogContext
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
      context
    };

    this.metrics.push(metric);

    // Log significant metrics
    if (this.shouldLogMetric(name, value, unit)) {
      logger.performance(`Performance metric: ${name} = ${value}${unit}`, performance.now(), {
        component: 'PerformanceMonitor',
        action: 'record_metric',
        ...context,
        metadata: {
          metricName: name,
          metricValue: value,
          metricUnit: unit,
          tags
        }
      });
    }

    // Cleanup if too many metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics * 0.8);
    }
  }

  /**
   * Determine if metric should be logged
   */
  private shouldLogMetric(name: string, value: number, unit: string): boolean {
    // Always log Core Web Vitals
    if (name.includes('core_web_vitals')) return true;
    
    // Log slow operations
    if (unit === 'ms' && value > 1000) return true;
    
    // Log large memory usage
    if (unit === 'bytes' && value > 10000000) return true; // > 10MB
    
    // Log API calls
    if (name.includes('api_')) return true;
    
    return false;
  }

  /**
   * Start timing measurement
   */
  startTiming(name: string, context?: LogContext): void {
    this.timers.set(name, performance.now());
    
    logger.debug(`Started timing: ${name}`, {
      component: 'PerformanceMonitor',
      action: 'start_timing',
      ...context,
      metadata: { timingName: name }
    });
  }

  /**
   * End timing measurement
   */
  endTiming(name: string, context?: LogContext): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`No start time found for timing: ${name}`, {
        component: 'PerformanceMonitor',
        action: 'end_timing_error',
        ...context
      });
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.timers.delete(name);
    this.recordMetric(name, duration, 'ms', undefined, context);
    
    logger.debug(`Completed timing: ${name} = ${duration.toFixed(2)}ms`, {
      component: 'PerformanceMonitor',
      action: 'end_timing',
      ...context,
      metadata: {
        timingName: name,
        duration,
        startTime,
        endTime
      }
    });

    return duration;
  }

  /**
   * Measure memory usage
   */
  measureMemory(context?: LogContext): MemoryMetric | null {
    if (!this.enabled || !(performance as any).memory) {
      return null;
    }

    const memInfo = (performance as any).memory;
    const metric: MemoryMetric = {
      name: 'memory_usage',
      value: memInfo.usedJSHeapSize,
      unit: 'bytes',
      timestamp: Date.now(),
      heapUsed: memInfo.usedJSHeapSize,
      heapTotal: memInfo.totalJSHeapSize,
      external: memInfo.usedJSHeapSize,
      context
    };

    this.recordMetric('heap_used', memInfo.usedJSHeapSize, 'bytes', undefined, context);
    this.recordMetric('heap_total', memInfo.totalJSHeapSize, 'bytes', undefined, context);
    
    return metric;
  }

  /**
   * Measure API call performance
   */
  measureApiCall(url: string, method: string, statusCode: number, duration: number, context?: LogContext): void {
    const success = statusCode >= 200 && statusCode < 400;
    
    this.recordMetric('api_call_duration', duration, 'ms', {
      url,
      method,
      status_code: statusCode.toString(),
      success: success.toString()
    }, context);

    this.recordMetric('api_call_count', 1, 'count', {
      url,
      method,
      status_code: statusCode.toString()
    }, context);

    // Log slow API calls
    if (duration > 2000) {
      logger.warn(`Slow API call detected: ${method} ${url} (${duration}ms)`, {
        component: 'PerformanceMonitor',
        action: 'slow_api_call',
        ...context,
        metadata: {
          url,
          method,
          statusCode,
          duration
        }
      });
    }
  }

  /**
   * Measure React component render time
   */
  measureComponentRender(componentName: string, renderTime: number, context?: LogContext): void {
    this.recordMetric('component_render_time', renderTime, 'ms', {
      component: componentName
    }, context);

    // Log slow renders
    if (renderTime > 16) { // > 16ms (60fps threshold)
      logger.warn(`Slow component render: ${componentName} (${renderTime}ms)`, {
        component: 'PerformanceMonitor',
        action: 'slow_component_render',
        ...context,
        metadata: {
          componentName,
          renderTime
        }
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<string, any> {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => now - m.timestamp < 300000);
    
    const stats = {
      coreWebVitals: this.coreWebVitals,
      totalMetrics: this.metrics.length,
      recentMetrics: last5Minutes.length,
      averages: {} as Record<string, number>,
      percentiles: {} as Record<string, any>
    };

    // Calculate averages for timing metrics
    const timingMetrics = last5Minutes.filter(m => m.unit === 'ms');
    const metricGroups = timingMetrics.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = [];
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      if (values.length > 0) {
        stats.averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        const sorted = values.sort((a, b) => a - b);
        stats.percentiles[name] = {
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        };
      }
    });

    return stats;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport | null {
    if (!this.enabled) return null;

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType,
      coreWebVitals: { ...this.coreWebVitals },
      customMetrics: this.metrics.slice(-50), // Last 50 metrics
      resourceTimings: performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      errors: this.metrics.filter(m => m.name.includes('error')).length,
      warnings: this.metrics.filter(m => m.name.includes('warning')).length
    };

    logger.info('Performance report generated', {
      component: 'PerformanceMonitor',
      action: 'generate_report',
      metadata: {
        reportSize: this.metrics.length,
        coreWebVitals: this.coreWebVitals,
        errors: report.errors,
        warnings: report.warnings
      }
    });

    return report;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    const originalLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (originalLength !== this.metrics.length) {
      logger.debug(`Cleaned up ${originalLength - this.metrics.length} old performance metrics`, {
        component: 'PerformanceMonitor',
        action: 'cleanup_metrics'
      });
    }
  }

  /**
   * Decorator for timing functions
   */
  withTiming<T extends (...args: any[]) => any>(
    fn: T,
    name?: string,
    context?: LogContext
  ): T {
    const timingName = name || fn.name || 'anonymous_function';
    
    return ((...args: any[]) => {
      this.startTiming(timingName, context);
      
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.finally(() => {
            this.endTiming(timingName, context);
          });
        } else {
          this.endTiming(timingName, context);
          return result;
        }
      } catch (error) {
        this.endTiming(timingName, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Dispose of observers and cleanup
   */
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.timers.clear();
    this.metrics = [];
  }
}

// Create singleton performance monitor
const performanceMonitor = new PerformanceMonitor();

export { 
  performanceMonitor, 
  PerformanceMonitor, 
  type PerformanceMetric, 
  type TimingMetric, 
  type MemoryMetric, 
  type CoreWebVitals, 
  type PerformanceReport 
};

// Convenience functions
export function recordMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'],
  tags?: Record<string, string>,
  context?: LogContext
): void {
  performanceMonitor.recordMetric(name, value, unit, tags, context);
}

export function startTiming(name: string, context?: LogContext): void {
  performanceMonitor.startTiming(name, context);
}

export function endTiming(name: string, context?: LogContext): number {
  return performanceMonitor.endTiming(name, context);
}

export function measureMemory(context?: LogContext): MemoryMetric | null {
  return performanceMonitor.measureMemory(context);
}

export function withTiming<T extends (...args: any[]) => any>(
  fn: T,
  name?: string,
  context?: LogContext
): T {
  return performanceMonitor.withTiming(fn, name, context);
}

export function getPerformanceStats(): Record<string, any> {
  return performanceMonitor.getStats();
}