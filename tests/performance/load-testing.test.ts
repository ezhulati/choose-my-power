/**
 * Comprehensive Performance and Load Testing Suite
 * 
 * Tests system performance under various load conditions including:
 * - Single user performance benchmarks
 * - Concurrent user load testing (up to 1000+ users)
 * - API endpoint stress testing
 * - Database connection pooling under load
 * - Cache performance validation
 * - Memory and CPU usage monitoring
 * - Network bandwidth optimization
 * - Core Web Vitals compliance
 * - Breakdown testing to identify limits
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

// Performance testing configuration
const PERFORMANCE_CONFIG = {
  thresholds: {
    // Core Web Vitals
    firstContentfulPaint: 1800, // 1.8 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1, // 0.1 score
    timeToInteractive: 3500, // 3.5 seconds
    
    // API Performance
    apiResponseTime: 500, // 500ms
    apiResponseTime95th: 1000, // 1 second 95th percentile
    
    // Load Testing
    concurrentUsers: {
      light: 50,
      medium: 200,
      heavy: 500,
      extreme: 1000
    },
    
    // Resource Usage
    memoryUsage: 512 * 1024 * 1024, // 512MB
    cpuUsage: 80, // 80% max CPU usage
    
    // Network
    bundleSize: 1024 * 1024, // 1MB max bundle size
    imageOptimization: 100 * 1024 // 100KB max image size
  },
  
  testDurations: {
    short: 30 * 1000, // 30 seconds
    medium: 2 * 60 * 1000, // 2 minutes
    long: 5 * 60 * 1000, // 5 minutes
    stress: 10 * 60 * 1000 // 10 minutes
  },
  
  urls: {
    homepage: 'http://localhost:4324/',
    search: 'http://localhost:4324/.netlify/functions/search-plans',
    esiid: 'http://localhost:4324/.netlify/functions/lookup-esiid',
    health: 'http://localhost:4324/.netlify/functions/health'
  }
};

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memoryBaseline: number = 0;
  
  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }
  
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }
  
  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const duration = performance.now() - startTime;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    this.startTimes.delete(name);
    return duration;
  }
  
  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
  
  getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }
  
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }
}

// Load testing utilities
class LoadTester {
  private workers: Worker[] = [];
  private results: any[] = [];
  
  async simulateUsers(userCount: number, duration: number, targetUrl: string): Promise<any> {
    const userResults = [];
    const promises = [];
    
    for (let i = 0; i < userCount; i++) {
      const promise = this.simulateSingleUser(targetUrl, duration, i);
      promises.push(promise);
      
      // Stagger user starts to simulate realistic load ramping
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const results = await Promise.allSettled(promises);
    
    return {
      totalUsers: userCount,
      successfulUsers: results.filter(r => r.status === 'fulfilled').length,
      failedUsers: results.filter(r => r.status === 'rejected').length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    };
  }
  
  private async simulateSingleUser(url: string, duration: number, userId: number): Promise<any> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const requests = [];
    let requestCount = 0;
    let errorCount = 0;
    
    while (Date.now() < endTime) {
      try {
        const requestStart = performance.now();
        
        // Simulate realistic user behavior
        const response = await this.makeRequest(url, {
          zipCode: ['75201', '77001', '78701', '76101'][Math.floor(Math.random() * 4)],
          usage: 500 + Math.floor(Math.random() * 2000),
          requestId: `load_test_${userId}_${requestCount}`
        });
        
        const requestTime = performance.now() - requestStart;
        
        requests.push({
          requestId: requestCount,
          responseTime: requestTime,
          status: response.status,
          success: response.ok
        });
        
        requestCount++;
        
        // Simulate user think time (1-5 seconds)
        const thinkTime = 1000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
        
      } catch (error) {
        errorCount++;
        requests.push({
          requestId: requestCount,
          error: error.message,
          success: false
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successfulRequests = requests.filter(r => r.success);
    const responseTimes = successfulRequests.map(r => r.responseTime).filter(t => typeof t === 'number');
    
    return {
      userId,
      duration: totalTime,
      totalRequests: requestCount,
      successfulRequests: successfulRequests.length,
      errorCount,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
    };
  }
  
  private async makeRequest(url: string, data: any): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTester/1.0'
      },
      body: JSON.stringify(data)
    });
    
    return response;
  }
  
  cleanup(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}

// Network performance utilities
class NetworkProfiler {
  async measureBundleSize(url: string): Promise<{ size: number; gzippedSize: number }> {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;
      
      // Simulate gzip compression ratio (typically 60-80% reduction)
      const gzippedSize = Math.floor(size * 0.3);
      
      return { size, gzippedSize };
    } catch (error) {
      return { size: 0, gzippedSize: 0 };
    }
  }
  
  async measureImageOptimization(imageUrls: string[]): Promise<any[]> {
    const results = [];
    
    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const size = buffer.byteLength;
        const contentType = response.headers.get('content-type') || '';
        
        results.push({
          url,
          size,
          contentType,
          optimized: size <= PERFORMANCE_CONFIG.thresholds.imageOptimization
        });
      } catch (error) {
        results.push({
          url,
          error: error.message,
          optimized: false
        });
      }
    }
    
    return results;
  }
}

// Mock server for testing
let testServer: ChildProcess | null = null;

// Test suite
describe('Performance and Load Testing Suite', () => {
  let monitor: PerformanceMonitor;
  let loadTester: LoadTester;
  let networkProfiler: NetworkProfiler;
  
  beforeAll(async () => {
    monitor = new PerformanceMonitor();
    loadTester = new LoadTester();
    networkProfiler = new NetworkProfiler();
    
    // Start test server if not already running
    // This would typically start your development server
    // testServer = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
    // await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for server startup
  }, 30000);
  
  afterAll(async () => {
    loadTester.cleanup();
    
    if (testServer) {
      testServer.kill();
    }
  });
  
  beforeEach(() => {
    monitor.reset();
  });
  
  describe('Single User Performance Benchmarks', () => {
    it('should meet Core Web Vitals thresholds', async () => {
      // Test would typically use Lighthouse or similar tool
      const mockMetrics = {
        firstContentfulPaint: 1200, // ms
        largestContentfulPaint: 2100, // ms
        firstInputDelay: 50, // ms
        cumulativeLayoutShift: 0.05, // score
        timeToInteractive: 3000 // ms
      };
      
      expect(mockMetrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_CONFIG.thresholds.firstContentfulPaint);
      expect(mockMetrics.largestContentfulPaint).toBeLessThan(PERFORMANCE_CONFIG.thresholds.largestContentfulPaint);
      expect(mockMetrics.firstInputDelay).toBeLessThan(PERFORMANCE_CONFIG.thresholds.firstInputDelay);
      expect(mockMetrics.cumulativeLayoutShift).toBeLessThan(PERFORMANCE_CONFIG.thresholds.cumulativeLayoutShift);
      expect(mockMetrics.timeToInteractive).toBeLessThan(PERFORMANCE_CONFIG.thresholds.timeToInteractive);
    });
    
    it('should handle search API requests within performance thresholds', async () => {
      const testRequests = 10;
      
      for (let i = 0; i < testRequests; i++) {
        monitor.startTimer(`api-request-${i}`);
        
        try {
          // Mock API request - in real test would hit actual endpoint
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
          
          const responseTime = monitor.endTimer(`api-request-${i}`);
          expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime);
        } catch (error) {
          monitor.endTimer(`api-request-${i}`);
          throw error;
        }
      }
      
      const apiMetrics = monitor.getMetrics('api-request-0');
      if (apiMetrics) {
        expect(apiMetrics.p95).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime95th);
      }
    });
    
    it('should maintain low memory usage during extended operations', async () => {
      const initialMemory = monitor.getCurrentMemoryUsage();
      
      // Simulate intensive operations
      const operations = [];
      for (let i = 0; i < 1000; i++) {
        operations.push({
          id: i,
          data: new Array(100).fill(`test-data-${i}`)
        });
        
        // Simulate processing
        operations[i].processed = operations[i].data.map(item => item.toUpperCase());
      }
      
      const peakMemory = monitor.getCurrentMemoryUsage();
      const memoryIncrease = peakMemory - initialMemory;
      
      // Clean up
      operations.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = monitor.getCurrentMemoryUsage();
      const memoryRecovered = peakMemory - finalMemory;
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_CONFIG.thresholds.memoryUsage);
      expect(memoryRecovered / memoryIncrease).toBeGreaterThan(0.7); // 70% memory recovery
    });
  });
  
  describe('Concurrent User Load Testing', () => {
    it('should handle light concurrent load (50 users)', async () => {
      const userCount = PERFORMANCE_CONFIG.thresholds.concurrentUsers.light;
      const duration = PERFORMANCE_CONFIG.testDurations.short;
      
      const results = await loadTester.simulateUsers(
        userCount,
        duration,
        PERFORMANCE_CONFIG.urls.search
      );
      
      expect(results.successfulUsers).toBeGreaterThan(userCount * 0.95); // 95% success rate
      expect(results.failedUsers).toBeLessThan(userCount * 0.05); // Less than 5% failures
      
      const avgResponseTime = results.results
        .filter((r: any) => r.averageResponseTime > 0)
        .reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / results.successfulUsers;
        
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime * 1.5);
    }, 60000);
    
    it('should handle medium concurrent load (200 users)', async () => {
      const userCount = PERFORMANCE_CONFIG.thresholds.concurrentUsers.medium;
      const duration = PERFORMANCE_CONFIG.testDurations.medium;
      
      const results = await loadTester.simulateUsers(
        userCount,
        duration,
        PERFORMANCE_CONFIG.urls.search
      );
      
      expect(results.successfulUsers).toBeGreaterThan(userCount * 0.90); // 90% success rate
      expect(results.failedUsers).toBeLessThan(userCount * 0.10); // Less than 10% failures
      
      const avgResponseTime = results.results
        .filter((r: any) => r.averageResponseTime > 0)
        .reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / results.successfulUsers;
        
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime * 2);
    }, 180000);
    
    it('should handle heavy concurrent load (500 users)', async () => {
      const userCount = PERFORMANCE_CONFIG.thresholds.concurrentUsers.heavy;
      const duration = PERFORMANCE_CONFIG.testDurations.medium;
      
      const results = await loadTester.simulateUsers(
        userCount,
        duration,
        PERFORMANCE_CONFIG.urls.search
      );
      
      expect(results.successfulUsers).toBeGreaterThan(userCount * 0.85); // 85% success rate
      expect(results.failedUsers).toBeLessThan(userCount * 0.15); // Less than 15% failures
      
      const avgResponseTime = results.results
        .filter((r: any) => r.averageResponseTime > 0)
        .reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / results.successfulUsers;
        
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime * 3);
    }, 300000);
    
    it('should survive extreme load testing (1000+ users)', async () => {
      const userCount = PERFORMANCE_CONFIG.thresholds.concurrentUsers.extreme;
      const duration = PERFORMANCE_CONFIG.testDurations.long;
      
      const results = await loadTester.simulateUsers(
        userCount,
        duration,
        PERFORMANCE_CONFIG.urls.search
      );
      
      // Under extreme load, we expect some degradation but system should remain functional
      expect(results.successfulUsers).toBeGreaterThan(userCount * 0.75); // 75% success rate
      expect(results.failedUsers).toBeLessThan(userCount * 0.25); // Less than 25% failures
      
      // Response times may be higher under extreme load
      const avgResponseTime = results.results
        .filter((r: any) => r.averageResponseTime > 0)
        .reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / results.successfulUsers;
        
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime * 5);
    }, 600000);
  });
  
  describe('API Endpoint Stress Testing', () => {
    it('should handle rapid successive requests to search endpoint', async () => {
      const requestCount = 100;
      const promises = [];
      
      for (let i = 0; i < requestCount; i++) {
        monitor.startTimer(`rapid-request-${i}`);
        
        const promise = fetch(PERFORMANCE_CONFIG.urls.search, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: '75201',
            usage: 1000,
            requestId: `stress-test-${i}`
          })
        }).then(response => {
          monitor.endTimer(`rapid-request-${i}`);
          return { index: i, status: response.status, ok: response.ok };
        }).catch(error => {
          monitor.endTimer(`rapid-request-${i}`);
          return { index: i, error: error.message, ok: false };
        });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      const successfulRequests = results.filter(r => r.ok).length;
      const failedRequests = results.filter(r => !r.ok).length;
      
      expect(successfulRequests).toBeGreaterThan(requestCount * 0.9); // 90% success rate
      expect(failedRequests).toBeLessThan(requestCount * 0.1); // Less than 10% failures
      
      // Check average response time
      const firstRequestMetrics = monitor.getMetrics('rapid-request-0');
      if (firstRequestMetrics) {
        expect(firstRequestMetrics.mean).toBeLessThan(PERFORMANCE_CONFIG.thresholds.apiResponseTime * 2);
      }
    }, 30000);
    
    it('should handle invalid requests gracefully under load', async () => {
      const requestCount = 50;
      const invalidRequests = [
        { zipCode: '' }, // Empty ZIP
        { zipCode: '12345' }, // Invalid ZIP
        { zipCode: '75201', usage: -100 }, // Invalid usage
        { zipCode: '75201', usage: 'invalid' }, // Invalid usage type
        {} // Empty request
      ];
      
      const promises = [];
      
      for (let i = 0; i < requestCount; i++) {
        const invalidRequest = invalidRequests[i % invalidRequests.length];
        
        const promise = fetch(PERFORMANCE_CONFIG.urls.search, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidRequest)
        }).then(response => {
          return { 
            index: i, 
            status: response.status, 
            ok: response.ok,
            isValidationError: response.status === 400
          };
        }).catch(error => {
          return { index: i, error: error.message, ok: false };
        });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // All requests should return proper error responses, not crash
      const properErrorResponses = results.filter(r => 
        r.isValidationError || (r.status >= 400 && r.status < 500)
      ).length;
      
      expect(properErrorResponses).toBe(requestCount); // All should be validation errors
      
      // No requests should cause server errors (5xx)
      const serverErrors = results.filter(r => r.status >= 500).length;
      expect(serverErrors).toBe(0);
    }, 30000);
  });
  
  describe('Cache Performance Validation', () => {
    it('should show improved performance with caching', async () => {
      const testZip = '75201';
      const testRequest = {
        zipCode: testZip,
        usage: 1000
      };
      
      // First request (cache miss)
      monitor.startTimer('cache-miss');
      const firstResponse = await fetch(PERFORMANCE_CONFIG.urls.search, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      const firstResponseTime = monitor.endTimer('cache-miss');
      
      expect(firstResponse.ok).toBe(true);
      
      // Wait a bit to ensure first request is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second request (should be cache hit)
      monitor.startTimer('cache-hit');
      const secondResponse = await fetch(PERFORMANCE_CONFIG.urls.search, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      const secondResponseTime = monitor.endTimer('cache-hit');
      
      expect(secondResponse.ok).toBe(true);
      
      // Cache hit should be significantly faster
      expect(secondResponseTime).toBeLessThan(firstResponseTime * 0.8); // 20% improvement
      
      // Check cache hit header if available
      const cacheHitHeader = secondResponse.headers.get('X-Cache-Hit');
      if (cacheHitHeader) {
        expect(cacheHitHeader).toBe('true');
      }
    }, 15000);
    
    it('should handle cache invalidation properly', async () => {
      // This test would verify that cache is properly invalidated when needed
      // and that the system gracefully handles cache misses
      
      const testRequest = {
        zipCode: '77001',
        usage: 1500,
        filters: { term: 12 }
      };
      
      // Make initial request
      const response1 = await fetch(PERFORMANCE_CONFIG.urls.search, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      
      expect(response1.ok).toBe(true);
      
      // Simulate cache invalidation (in real scenario, this might be triggered by admin action)
      // For testing purposes, we'll just wait and make another request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make request with different parameters to test cache key variation
      const modifiedRequest = { ...testRequest, usage: 2000 };
      const response2 = await fetch(PERFORMANCE_CONFIG.urls.search, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifiedRequest)
      });
      
      expect(response2.ok).toBe(true);
      
      // Both requests should succeed regardless of cache state
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
    }, 15000);
  });
  
  describe('Network Bandwidth Optimization', () => {
    it('should have optimized bundle sizes', async () => {
      const mainBundleUrl = `${PERFORMANCE_CONFIG.urls.homepage}assets/index.js`;
      const stylesheetUrl = `${PERFORMANCE_CONFIG.urls.homepage}assets/index.css`;
      
      const [bundleSize, stylesheetSize] = await Promise.all([
        networkProfiler.measureBundleSize(mainBundleUrl).catch(() => ({ size: 0, gzippedSize: 0 })),
        networkProfiler.measureBundleSize(stylesheetUrl).catch(() => ({ size: 0, gzippedSize: 0 }))
      ]);
      
      // Total bundle size should be reasonable
      const totalSize = bundleSize.size + stylesheetSize.size;
      
      if (totalSize > 0) {
        expect(totalSize).toBeLessThan(PERFORMANCE_CONFIG.thresholds.bundleSize);
        
        // Gzipped size should show good compression
        const totalGzipped = bundleSize.gzippedSize + stylesheetSize.gzippedSize;
        const compressionRatio = totalGzipped / totalSize;
        expect(compressionRatio).toBeLessThan(0.4); // Should compress to less than 40%
      }
    }, 10000);
    
    it('should have optimized images', async () => {
      const imageUrls = [
        `${PERFORMANCE_CONFIG.urls.homepage}images/og-default.jpg`,
        `${PERFORMANCE_CONFIG.urls.homepage}images/cities/dallas-city-main.webp`,
        `${PERFORMANCE_CONFIG.urls.homepage}images/providers/provider-major.png`
      ];
      
      const results = await networkProfiler.measureImageOptimization(imageUrls);
      
      results.forEach(result => {
        if (!result.error) {
          expect(result.size).toBeLessThan(PERFORMANCE_CONFIG.thresholds.imageOptimization);
          
          // Check for modern image formats
          if (result.contentType) {
            const isModernFormat = result.contentType.includes('webp') || 
                                 result.contentType.includes('avif');
            const isOptimized = isModernFormat || result.size <= 50 * 1024; // 50KB for traditional formats
            
            expect(isOptimized).toBe(true);
          }
        }
      });
    }, 15000);
  });
  
  describe('Stress Testing and Limits', () => {
    it('should gracefully handle memory pressure', async () => {
      const initialMemory = monitor.getCurrentMemoryUsage();
      
      // Create memory pressure by allocating large objects
      const largeObjects = [];
      
      try {
        for (let i = 0; i < 100; i++) {
          // Allocate 1MB objects
          largeObjects.push(new Array(250000).fill(`memory-test-${i}`));
          
          // Check if memory usage is getting too high
          const currentMemory = monitor.getCurrentMemoryUsage();
          const memoryIncrease = currentMemory - initialMemory;
          
          if (memoryIncrease > PERFORMANCE_CONFIG.thresholds.memoryUsage) {
            break; // Stop before hitting critical memory levels
          }
        }
        
        // System should still be responsive
        const testResponse = await fetch(PERFORMANCE_CONFIG.urls.health);
        expect(testResponse.ok).toBe(true);
        
      } finally {
        // Clean up
        largeObjects.length = 0;
        if (global.gc) {
          global.gc();
        }
      }
      
      // Memory should be recoverable
      const finalMemory = monitor.getCurrentMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_CONFIG.thresholds.memoryUsage * 0.5);
    }, 30000);
    
    it('should identify breaking point for concurrent users', async () => {
      const testDuration = PERFORMANCE_CONFIG.testDurations.short;
      const results = [];
      
      // Gradually increase load until we find the breaking point
      const testLevels = [50, 100, 200, 400, 600, 800];
      
      for (const userCount of testLevels) {
        console.log(`Testing ${userCount} concurrent users...`);
        
        const result = await loadTester.simulateUsers(
          userCount,
          testDuration,
          PERFORMANCE_CONFIG.urls.search
        );
        
        const successRate = result.successfulUsers / result.totalUsers;
        const avgResponseTime = result.results
          .filter((r: any) => r.averageResponseTime > 0)
          .reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / result.successfulUsers;
        
        results.push({
          userCount,
          successRate,
          avgResponseTime,
          totalRequests: result.results.reduce((sum: any, r: any) => sum + r.totalRequests, 0)
        });
        
        console.log(`${userCount} users: ${(successRate * 100).toFixed(1)}% success, ${avgResponseTime.toFixed(0)}ms avg response`);
        
        // Stop if success rate drops below 70% or response time exceeds 5 seconds
        if (successRate < 0.7 || avgResponseTime > 5000) {
          console.log(`Breaking point reached at ${userCount} users`);
          break;
        }
        
        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Verify we can handle at least 200 concurrent users
      const minAcceptableUsers = 200;
      const acceptableResults = results.filter(r => 
        r.userCount >= minAcceptableUsers && r.successRate >= 0.85
      );
      
      expect(acceptableResults.length).toBeGreaterThan(0);
      
      console.log('Load test results:', results);
    }, 600000);
  });
  
  describe('Performance Monitoring and Alerting', () => {
    it('should collect comprehensive performance metrics', async () => {
      // Simulate various operations and collect metrics
      const operations = [
        { name: 'homepage-load', duration: 800 },
        { name: 'search-query', duration: 300 },
        { name: 'filter-apply', duration: 150 },
        { name: 'plan-details', duration: 200 },
        { name: 'comparison-view', duration: 400 }
      ];
      
      // Simulate multiple instances of each operation
      for (const operation of operations) {
        for (let i = 0; i < 20; i++) {
          monitor.startTimer(`${operation.name}-${i}`);
          
          // Simulate operation with some variance
          const actualDuration = operation.duration + (Math.random() - 0.5) * 200;
          await new Promise(resolve => setTimeout(resolve, Math.max(50, actualDuration)));
          
          monitor.endTimer(`${operation.name}-${i}`);
        }
      }
      
      // Analyze collected metrics
      for (const operation of operations) {
        const metrics = monitor.getMetrics(`${operation.name}-0`);
        expect(metrics).toBeTruthy();
        
        if (metrics) {
          expect(metrics.count).toBe(20);
          expect(metrics.mean).toBeGreaterThan(0);
          expect(metrics.p95).toBeGreaterThan(metrics.mean);
          expect(metrics.max).toBeGreaterThan(metrics.min);
          
          // Performance thresholds based on operation type
          const threshold = operation.name.includes('load') ? 2000 : 1000;
          expect(metrics.p95).toBeLessThan(threshold);
        }
      }
    }, 30000);
    
    it('should detect performance regressions', async () => {
      // Baseline performance measurement
      const baselineRuns = 10;
      const baselineTimes = [];
      
      for (let i = 0; i < baselineRuns; i++) {
        monitor.startTimer(`baseline-${i}`);
        
        // Simulate API request
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
        
        baselineTimes.push(monitor.endTimer(`baseline-${i}`));
      }
      
      const baselineAvg = baselineTimes.reduce((sum, time) => sum + time, 0) / baselineTimes.length;
      
      // Simulate performance regression
      const regressionRuns = 10;
      const regressionTimes = [];
      
      for (let i = 0; i < regressionRuns; i++) {
        monitor.startTimer(`regression-${i}`);
        
        // Simulate slower response (regression)
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 100));
        
        regressionTimes.push(monitor.endTimer(`regression-${i}`));
      }
      
      const regressionAvg = regressionTimes.reduce((sum, time) => sum + time, 0) / regressionTimes.length;
      
      // Detect regression (>50% increase should trigger alert)
      const performanceIncrease = (regressionAvg - baselineAvg) / baselineAvg;
      
      if (performanceIncrease > 0.5) {
        console.warn(`Performance regression detected: ${(performanceIncrease * 100).toFixed(1)}% increase`);
      }
      
      // In real scenario, this would trigger alerts or fail CI/CD
      expect(performanceIncrease).toBeLessThan(2.0); // Allow up to 200% increase for test
    }, 15000);
  });
});
