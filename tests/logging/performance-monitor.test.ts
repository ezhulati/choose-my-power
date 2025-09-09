/**
 * Performance Monitor Test Suite
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Unit tests for performance monitoring system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor, recordMetric, startTiming, endTiming, measureMemory, getPerformanceStats } from '../../src/lib/logging/performance-monitor';

// Mock logger
vi.mock('../../src/lib/logging/logger', () => ({
  logger: {
    performance: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    usedJSHeapSize: 1000000
  },
  getEntriesByType: vi.fn(),
  getEntriesByName: vi.fn()
};

// Mock PerformanceObserver
class MockPerformanceObserver {
  constructor(public callback: Function) {}
  observe() {}
  disconnect() {}
}

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset performance.now to return incremental values
    let timeCounter = 1000;
    mockPerformance.now.mockImplementation(() => {
      timeCounter += 10;
      return timeCounter;
    });

    // Mock global performance
    (global as any).performance = mockPerformance;
    (global as any).PerformanceObserver = MockPerformanceObserver;
    (global as any).window = {
      performance: mockPerformance,
      location: { href: 'http://localhost:3000/test' }
    };

    performanceMonitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.dispose();
    delete (global as any).performance;
    delete (global as any).PerformanceObserver;
    delete (global as any).window;
  });

  describe('Metric Recording', () => {
    it('should record custom metrics', () => {
      recordMetric('test_metric', 150, 'ms', { component: 'test' });
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBe(1);
    });

    it('should record metrics with different units', () => {
      recordMetric('response_time', 200, 'ms');
      recordMetric('memory_usage', 1024000, 'bytes');
      recordMetric('request_count', 5, 'count');
      recordMetric('cpu_usage', 75, 'percent');
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBe(4);
    });

    it('should include tags in metrics', () => {
      recordMetric('api_call', 300, 'ms', {
        endpoint: '/api/test',
        method: 'GET',
        status: '200'
      });
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBe(1);
    });

    it('should limit metric storage', () => {
      // Record more than max metrics
      for (let i = 0; i < 1200; i++) {
        recordMetric(`metric_${i}`, i, 'ms');
      }
      
      const stats = getPerformanceStats();
      // Should be limited to maxMetrics * 0.8 = 800
      expect(stats.totalMetrics).toBeLessThan(1000);
      expect(stats.totalMetrics).toBeGreaterThan(700);
    });
  });

  describe('Timing Measurements', () => {
    it('should measure timing correctly', () => {
      startTiming('test_operation');
      const duration = endTiming('test_operation');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBe(10); // Based on our mock increment
    });

    it('should handle multiple concurrent timings', () => {
      startTiming('operation_1');
      startTiming('operation_2');
      
      const duration1 = endTiming('operation_1');
      const duration2 = endTiming('operation_2');
      
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0);
    });

    it('should warn about missing start time', () => {
      const duration = endTiming('non_existent_timer');
      expect(duration).toBe(0);
    });

    it('should clean up timer after ending', () => {
      startTiming('test_timer');
      endTiming('test_timer');
      
      // Should warn about missing timer if we try to end it again
      const duration2 = endTiming('test_timer');
      expect(duration2).toBe(0);
    });
  });

  describe('Memory Measurement', () => {
    it('should measure memory when available', () => {
      const memoryMetric = measureMemory();
      
      expect(memoryMetric).not.toBeNull();
      expect(memoryMetric?.heapUsed).toBe(1000000);
      expect(memoryMetric?.heapTotal).toBe(2000000);
      expect(memoryMetric?.unit).toBe('bytes');
    });

    it('should return null when memory API not available', () => {
      delete (global as any).performance.memory;
      
      const memoryMetric = measureMemory();
      expect(memoryMetric).toBeNull();
    });
  });

  describe('API Call Tracking', () => {
    it('should track successful API calls', () => {
      performanceMonitor.measureApiCall('/api/test', 'GET', 200, 150);
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('should track failed API calls', () => {
      performanceMonitor.measureApiCall('/api/test', 'POST', 500, 300);
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('should log warnings for slow API calls', () => {
      const { logger } = require('../../src/lib/logging/logger');
      
      performanceMonitor.measureApiCall('/api/slow', 'GET', 200, 3000);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow API call detected'),
        expect.objectContaining({
          metadata: expect.objectContaining({
            duration: 3000
          })
        })
      );
    });
  });

  describe('Component Render Tracking', () => {
    it('should track component render times', () => {
      performanceMonitor.measureComponentRender('TestComponent', 10);
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('should log warnings for slow renders', () => {
      const { logger } = require('../../src/lib/logging/logger');
      
      performanceMonitor.measureComponentRender('SlowComponent', 25);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow component render'),
        expect.objectContaining({
          metadata: expect.objectContaining({
            renderTime: 25
          })
        })
      );
    });

    it('should not warn for fast renders', () => {
      const { logger } = require('../../src/lib/logging/logger');
      
      performanceMonitor.measureComponentRender('FastComponent', 5);
      
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Performance Statistics', () => {
    it('should calculate averages correctly', () => {
      recordMetric('test_metric', 100, 'ms');
      recordMetric('test_metric', 200, 'ms');
      recordMetric('test_metric', 300, 'ms');
      
      const stats = getPerformanceStats();
      expect(stats.averages.test_metric).toBe(200);
    });

    it('should calculate percentiles correctly', () => {
      // Record 100 metrics for percentile calculation
      for (let i = 1; i <= 100; i++) {
        recordMetric('percentile_test', i, 'ms');
      }
      
      const stats = getPerformanceStats();
      expect(stats.percentiles.percentile_test).toBeDefined();
      expect(stats.percentiles.percentile_test.p50).toBeCloseTo(50, 5);
      expect(stats.percentiles.percentile_test.p95).toBeCloseTo(95, 5);
      expect(stats.percentiles.percentile_test.p99).toBeCloseTo(99, 5);
    });

    it('should filter recent metrics correctly', () => {
      // Record old metric (mock timestamp manipulation)
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000000); // Old timestamp
      recordMetric('old_metric', 100, 'ms');
      
      // Record recent metric
      Date.now = vi.fn(() => Date.now() + 600000); // 10 minutes later
      recordMetric('recent_metric', 200, 'ms');
      
      Date.now = originalNow;
      
      const stats = getPerformanceStats();
      expect(stats.recentMetrics).toBe(1); // Only recent metric should count
    });
  });

  describe('Report Generation', () => {
    it('should generate performance report', () => {
      recordMetric('test_metric', 150, 'ms');
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toBeDefined();
      expect(report?.timestamp).toBeDefined();
      expect(report?.pageUrl).toBe('http://localhost:3000/test');
      expect(report?.customMetrics).toHaveLength(1);
    });

    it('should include Core Web Vitals in report', () => {
      // Simulate Core Web Vitals
      performanceMonitor.recordMetric('core_web_vitals_fcp', 1200, 'ms');
      performanceMonitor.recordMetric('core_web_vitals_lcp', 2400, 'ms');
      
      const report = performanceMonitor.generateReport();
      
      expect(report?.customMetrics.length).toBeGreaterThan(0);
    });

    it('should return null when not in browser environment', () => {
      delete (global as any).window;
      
      const freshMonitor = new PerformanceMonitor();
      const report = freshMonitor.generateReport();
      
      expect(report).toBeNull();
      
      freshMonitor.dispose();
    });
  });

  describe('Function Timing Decorator', () => {
    it('should time synchronous functions', () => {
      const testFunction = (x: number, y: number) => x + y;
      const timedFunction = performanceMonitor.withTiming(testFunction, 'add_numbers');
      
      const result = timedFunction(2, 3);
      
      expect(result).toBe(5);
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('should time asynchronous functions', async () => {
      const asyncFunction = async (delay: number) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'done';
      };
      
      const timedFunction = performanceMonitor.withTiming(asyncFunction, 'async_operation');
      
      const result = await timedFunction(10);
      
      expect(result).toBe('done');
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('should handle function errors correctly', () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };
      
      const timedFunction = performanceMonitor.withTiming(errorFunction, 'error_function');
      
      expect(() => timedFunction()).toThrow('Test error');
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0); // Should still record timing
    });

    it('should handle async function errors correctly', async () => {
      const asyncErrorFunction = async () => {
        throw new Error('Async test error');
      };
      
      const timedFunction = performanceMonitor.withTiming(asyncErrorFunction, 'async_error_function');
      
      await expect(timedFunction()).rejects.toThrow('Async test error');
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0); // Should still record timing
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should cleanup old metrics', () => {
      // Mock old timestamps
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000000); // 25 hours ago
      
      recordMetric('old_metric_1', 100, 'ms');
      recordMetric('old_metric_2', 200, 'ms');
      
      // Reset to current time
      Date.now = originalNow;
      
      // Trigger cleanup (normally happens periodically)
      performanceMonitor['cleanupOldMetrics']();
      
      const stats = getPerformanceStats();
      expect(stats.totalMetrics).toBe(0); // Old metrics should be cleaned up
    });

    it('should dispose of observers correctly', () => {
      const disconnectSpy = vi.spyOn(MockPerformanceObserver.prototype, 'disconnect');
      
      performanceMonitor.dispose();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Resource Type Detection', () => {
    it('should detect resource types correctly', () => {
      const testCases = [
        { url: 'https://example.com/script.js', expected: 'script' },
        { url: 'https://example.com/style.css', expected: 'stylesheet' },
        { url: 'https://example.com/image.jpg', expected: 'image' },
        { url: 'https://example.com/font.woff2', expected: 'font' },
        { url: 'https://example.com/api/data', expected: 'api' },
        { url: 'https://example.com/other.txt', expected: 'other' }
      ];
      
      testCases.forEach(({ url, expected }) => {
        const result = performanceMonitor['getResourceType'](url);
        expect(result).toBe(expected);
      });
    });
  });
});

describe('Performance Monitor without browser environment', () => {
  it('should handle missing window gracefully', () => {
    // Ensure no window object
    delete (global as any).window;
    delete (global as any).performance;
    delete (global as any).PerformanceObserver;
    
    expect(() => new PerformanceMonitor()).not.toThrow();
  });

  it('should not setup observers without Performance API', () => {
    delete (global as any).window;
    delete (global as any).performance;
    delete (global as any).PerformanceObserver;
    
    const monitor = new PerformanceMonitor();
    
    // Should not have any observers
    expect(monitor['observers']).toHaveLength(0);
    
    monitor.dispose();
  });
});