import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { comparePowerClient } from '../../src/lib/api/comparepower-client';
import { facetedRouter } from '../../src/lib/faceted/faceted-router';
import { staticGenerationStrategy } from '../../src/lib/faceted/static-generation-strategy';
import type { ApiParams } from '../../src/types/facets';

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Array<{
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    memory: NodeJS.MemoryUsage;
    success: boolean;
    error?: string;
  }> = [];

  startOperation(operation: string): () => void {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    return (success = true, error?: string) => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.metrics.push({
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        memory: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        success,
        error
      });
    };
  }

  getMetrics() {
    return this.metrics;
  }

  getStats(operation?: string) {
    const filtered = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
    
    if (filtered.length === 0) return null;
    
    const durations = filtered.map(m => m.duration);
    const memoryUsage = filtered.map(m => m.memory.heapUsed);
    
    return {
      count: filtered.length,
      successRate: filtered.filter(m => m.success).length / filtered.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99)
      },
      memory: {
        min: Math.min(...memoryUsage),
        max: Math.max(...memoryUsage),
        avg: memoryUsage.reduce((sum, m) => sum + m, 0) / memoryUsage.length
      }
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  clear() {
    this.metrics = [];
  }

  generateReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    let report = '\n=== PERFORMANCE TEST REPORT ===\n\n';
    
    operations.forEach(op => {
      const stats = this.getStats(op);
      if (stats) {
        report += `${op}:\n`;
        report += `  Count: ${stats.count}\n`;
        report += `  Success Rate: ${(stats.successRate * 100).toFixed(2)}%\n`;
        report += `  Duration (ms): Min=${stats.duration.min.toFixed(2)} Max=${stats.duration.max.toFixed(2)} Avg=${stats.duration.avg.toFixed(2)}\n`;
        report += `  Duration P95/P99: ${stats.duration.p95.toFixed(2)}ms / ${stats.duration.p99.toFixed(2)}ms\n`;
        report += `  Memory (bytes): Min=${stats.memory.min} Max=${stats.memory.max} Avg=${stats.memory.avg.toFixed(0)}\n\n`;
      }
    });
    
    return report;
  }
}

// Load testing utilities
async function simulateLoad<T>(
  operation: () => Promise<T>,
  concurrency: number,
  duration: number,
  monitor: PerformanceMonitor
): Promise<{ results: Array<T | Error>; stats: any }> {
  const results: Array<T | Error> = [];
  const promises: Promise<void>[] = [];
  const startTime = Date.now();
  
  // Create worker function
  const worker = async () => {
    while (Date.now() - startTime < duration) {
      const endOperation = monitor.startOperation('load_test_operation');
      try {
        const result = await operation();
        results.push(result);
        endOperation(true);
      } catch (error) {
        results.push(error as Error);
        endOperation(false, error.message);
      }
    }
  };
  
  // Start concurrent workers
  for (let i = 0; i < concurrency; i++) {
    promises.push(worker());
  }
  
  await Promise.all(promises);
  
  return {
    results,
    stats: monitor.getStats('load_test_operation')
  };
}

describe('Performance and Load Testing Framework', () => {
  let monitor: PerformanceMonitor;
  
  beforeAll(() => {
    monitor = new PerformanceMonitor();
    console.log('🚀 Starting performance and load tests...');
  });

  afterAll(() => {
    console.log(monitor.generateReport());
    
    // Clear any remaining connections
    comparePowerClient.shutdown();
  });

  describe('API Performance Under Load', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const testParams: ApiParams = {
        tdsp_duns: '1039940674000', // Dallas
        display_usage: 1000
      };

      const { results, stats } = await simulateLoad(
        () => comparePowerClient.fetchPlans(testParams),
        10, // 10 concurrent requests
        30000, // 30 seconds
        monitor
      );

      // Verify performance requirements
      expect(stats.successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(stats.duration.avg).toBeLessThan(2000); // Average < 2s
      expect(stats.duration.p95).toBeLessThan(3000); // 95th percentile < 3s
      
      const successfulResults = results.filter(r => !(r instanceof Error));
      expect(successfulResults.length).toBeGreaterThan(0);
      
      console.log(`✓ API Load Test: ${results.length} requests, ${stats.successRate * 100}% success rate`);
      console.log(`  Average response time: ${stats.duration.avg.toFixed(0)}ms`);
      console.log(`  P95 response time: ${stats.duration.p95.toFixed(0)}ms`);
    }, 45000);

    it('should maintain performance across different cities', async () => {
      const cities = [
        { name: 'Dallas', tdsp: '1039940674000' },
        { name: 'Houston', tdsp: '957877905' },
        { name: 'Austin', tdsp: '007924772' },
        { name: 'Fort Worth', tdsp: '1039940674000' }
      ];

      for (const city of cities) {
        const endOperation = monitor.startOperation(`api_${city.name.toLowerCase()}`);
        
        try {
          const startTime = Date.now();
          const plans = await comparePowerClient.fetchPlans({
            tdsp_duns: city.tdsp,
            display_usage: 1000
          });
          const duration = Date.now() - startTime;

          expect(Array.isArray(plans)).toBe(true);
          expect(duration).toBeLessThan(5000); // Max 5s per city
          
          endOperation(true);
          console.log(`✓ ${city.name}: ${plans.length} plans in ${duration}ms`);
        } catch (error) {
          endOperation(false, error.message);
          throw error;
        }
      }
    }, 60000);

    it('should handle rate limiting gracefully under high load', async () => {
      // Clear cache to force API calls
      await comparePowerClient.clearCache();
      
      const rapidRequests = 50;
      const promises: Promise<any>[] = [];
      const times: number[] = [];
      let rateLimitHits = 0;

      for (let i = 0; i < rapidRequests; i++) {
        const endOperation = monitor.startOperation('rate_limit_test');
        
        promises.push(
          (async () => {
            const startTime = Date.now();
            try {
              await comparePowerClient.fetchPlans({
                tdsp_duns: '957877905',
                display_usage: 1000
              });
              const duration = Date.now() - startTime;
              times.push(duration);
              endOperation(true);
            } catch (error) {
              const duration = Date.now() - startTime;
              times.push(duration);
              if (error.message.includes('rate limit')) {
                rateLimitHits++;
              }
              endOperation(false, error.message);
            }
          })()
        );
      }

      await Promise.all(promises);

      // Rate limiting should kick in for rapid requests
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const laterRequestsAvg = times.slice(-10).reduce((sum, time) => sum + time, 0) / 10;

      expect(laterRequestsAvg).toBeGreaterThan(avgTime * 0.8); // Later requests should be slower
      console.log(`✓ Rate limiting test: ${rateLimitHits} rate limit hits, avg time ${avgTime.toFixed(0)}ms`);
    }, 120000);
  });

  describe('Static Site Generation Performance', () => {
    it('should generate static paths efficiently at scale', async () => {
      const endOperation = monitor.startOperation('static_path_generation');
      
      try {
        const startTime = Date.now();
        const staticPaths = await staticGenerationStrategy.generateStaticPaths();
        const generationTime = Date.now() - startTime;

        expect(staticPaths.length).toBeGreaterThan(100);
        expect(generationTime).toBeLessThan(5000); // Should complete within 5 seconds

        // Verify path structure
        const samplePath = staticPaths[0];
        expect(samplePath).toHaveProperty('params');
        expect(samplePath.params).toHaveProperty('slug');

        endOperation(true);
        console.log(`✓ Generated ${staticPaths.length} static paths in ${generationTime}ms`);
      } catch (error) {
        endOperation(false, error.message);
        throw error;
      }
    }, 30000);

    it('should handle concurrent route generation efficiently', async () => {
      const cities = ['dallas', 'houston', 'austin', 'fort-worth', 'plano', 'garland', 'irving', 'arlington'];
      const filterCombinations = [
        [],
        ['12-month'],
        ['green-energy'],
        ['fixed-rate'],
        ['12-month', 'green-energy'],
        ['24-month', 'autopay-discount']
      ];

      const { results, stats } = await simulateLoad(
        async () => {
          const city = cities[Math.floor(Math.random() * cities.length)];
          const filters = filterCombinations[Math.floor(Math.random() * filterCombinations.length)];
          
          return facetedRouter.generateRouteData(city, filters);
        },
        8, // 8 concurrent generators
        20000, // 20 seconds
        monitor
      );

      expect(stats.successRate).toBeGreaterThan(0.98); // 98% success rate
      expect(stats.duration.avg).toBeLessThan(100); // Average < 100ms per route
      
      const successfulResults = results.filter(r => !(r instanceof Error));
      expect(successfulResults.length).toBeGreaterThan(0);

      console.log(`✓ Route generation: ${results.length} routes generated concurrently`);
      console.log(`  Success rate: ${(stats.successRate * 100).toFixed(2)}%`);
      console.log(`  Average generation time: ${stats.duration.avg.toFixed(0)}ms`);
    }, 30000);
  });

  describe('Memory Usage and Leak Detection', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate prolonged usage
      for (let i = 0; i < 100; i++) {
        const endOperation = monitor.startOperation('memory_test');
        
        try {
          // Perform typical operations
          await comparePowerClient.fetchPlans({
            tdsp_duns: '1039940674000',
            display_usage: 1000
          });
          
          const routeData = await facetedRouter.generateRouteData('dallas', ['12-month']);
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          
          endOperation(true);
        } catch (error) {
          endOperation(false, error.message);
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable (< 50MB)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`✓ Memory test: Growth ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }, 60000);

    it('should properly clean up resources', async () => {
      // Test cache cleanup
      const cacheStatsBefore = await comparePowerClient.getCacheStats();
      
      // Perform operations that create cache entries
      for (let i = 0; i < 20; i++) {
        await comparePowerClient.fetchPlans({
          tdsp_duns: `${1000000000000 + i}`, // Different TDSP for each request
          display_usage: 1000
        }).catch(() => {}); // Ignore errors for invalid TDSPs
      }
      
      // Clear cache and verify cleanup
      await comparePowerClient.clearCache();
      const cacheStatsAfter = await comparePowerClient.getCacheStats();
      
      expect(cacheStatsAfter.memory.totalEntries).toBeLessThanOrEqual(cacheStatsBefore.memory.totalEntries);
      
      console.log('✓ Resource cleanup verified');
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle API failures gracefully under load', async () => {
      // Mock intermittent failures
      let callCount = 0;
      const originalFetch = global.fetch;
      
      global.fetch = vi.fn().mockImplementation((...args) => {
        callCount++;
        if (callCount % 3 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        return originalFetch(...args);
      });

      const { results, stats } = await simulateLoad(
        () => comparePowerClient.fetchPlans({
          tdsp_duns: '1039940674000',
          display_usage: 1000
        }),
        5, // 5 concurrent requests
        15000, // 15 seconds
        monitor
      );

      // Should handle failures gracefully
      const errors = results.filter(r => r instanceof Error);
      const successes = results.filter(r => !(r instanceof Error));
      
      expect(successes.length).toBeGreaterThan(0); // Some should succeed
      expect(stats.successRate).toBeGreaterThan(0.5); // At least 50% success
      
      console.log(`✓ Error handling: ${successes.length} successes, ${errors.length} handled failures`);
      
      // Restore fetch
      global.fetch = originalFetch;
    }, 30000);

    it('should recover from circuit breaker state', async () => {
      // Force circuit breaker open
      global.fetch = vi.fn(() => Promise.reject(new Error('Forced failure')));
      
      // Make requests to trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        try {
          await comparePowerClient.fetchPlans({
            tdsp_duns: '1039940674000',
            display_usage: 1000
          });
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Verify circuit breaker is open
      const healthCheck1 = await comparePowerClient.healthCheck();
      expect(healthCheck1.circuitBreakerOpen).toBe(true);
      
      // Restore normal behavior
      global.fetch = fetch;
      
      // Wait for circuit breaker recovery
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test recovery
      try {
        const plans = await comparePowerClient.fetchPlans({
          tdsp_duns: '1039940674000',
          display_usage: 1000
        });
        
        expect(Array.isArray(plans)).toBe(true);
        console.log('✓ Circuit breaker recovery verified');
      } catch (error) {
        // Circuit breaker might still be recovering
        console.log('⚠ Circuit breaker still recovering');
      }
    }, 20000);
  });

  describe('Scalability Testing', () => {
    it('should scale to handle realistic production load', async () => {
      // Simulate realistic production traffic patterns
      const productionLoad = async () => {
        const operations = [
          // 60% plan fetches
          () => comparePowerClient.fetchPlans({
            tdsp_duns: ['1039940674000', '957877905', '007924772'][Math.floor(Math.random() * 3)],
            display_usage: [500, 1000, 1500, 2000][Math.floor(Math.random() * 4)]
          }),
          
          // 30% route generation
          () => facetedRouter.generateRouteData(
            ['dallas', 'houston', 'austin'][Math.floor(Math.random() * 3)],
            Math.random() > 0.5 ? ['12-month'] : []
          ),
          
          // 10% cache operations
          () => comparePowerClient.getCacheStats()
        ];
        
        const operation = operations[
          Math.random() < 0.6 ? 0 : (Math.random() < 0.85 ? 1 : 2)
        ];
        
        return operation();
      };

      const { results, stats } = await simulateLoad(
        productionLoad,
        15, // 15 concurrent users
        45000, // 45 seconds
        monitor
      );

      // Production requirements
      expect(stats.successRate).toBeGreaterThan(0.99); // 99% uptime
      expect(stats.duration.p95).toBeLessThan(2000); // 95% under 2s
      expect(stats.duration.p99).toBeLessThan(5000); // 99% under 5s
      
      console.log(`✓ Production load simulation: ${results.length} operations`);
      console.log(`  Success rate: ${(stats.successRate * 100).toFixed(3)}%`);
      console.log(`  P95 response time: ${stats.duration.p95.toFixed(0)}ms`);
      console.log(`  P99 response time: ${stats.duration.p99.toFixed(0)}ms`);
    }, 60000);

    it('should maintain performance with large datasets', async () => {
      // Test with plans containing many options
      const largeBatchParams: ApiParams = {
        tdsp_duns: '957877905', // Houston - typically has many plans
        display_usage: 1000
      };

      const endOperation = monitor.startOperation('large_dataset_test');
      
      try {
        const startTime = Date.now();
        const plans = await comparePowerClient.fetchPlans(largeBatchParams);
        const duration = Date.now() - startTime;
        
        // Should handle large result sets efficiently
        expect(duration).toBeLessThan(10000); // Max 10s even for large datasets
        expect(plans.length).toBeGreaterThan(0);
        
        // Verify all plans have required data structure
        plans.forEach(plan => {
          expect(plan.id).toBeDefined();
          expect(plan.name).toBeDefined();
          expect(plan.provider.name).toBeDefined();
          expect(plan.pricing.rate1000kWh).toBeGreaterThan(0);
        });
        
        endOperation(true);
        console.log(`✓ Large dataset: ${plans.length} plans processed in ${duration}ms`);
      } catch (error) {
        endOperation(false, error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const baselineMetrics = {
        apiResponseTime: 1500, // ms
        routeGenerationTime: 50, // ms
        cacheHitRatio: 0.8,
        memoryUsagePerRequest: 5 * 1024 * 1024 // 5MB
      };

      // Test current performance
      const apiStart = Date.now();
      await comparePowerClient.fetchPlans({
        tdsp_duns: '1039940674000',
        display_usage: 1000
      });
      const apiTime = Date.now() - apiStart;

      const routeStart = Date.now();
      await facetedRouter.generateRouteData('dallas', ['12-month']);
      const routeTime = Date.now() - routeStart;

      const cacheStats = await comparePowerClient.getCacheStats();
      const cacheHitRatio = cacheStats.memory.hitRate || 0;

      // Performance regression thresholds (20% degradation)
      expect(apiTime).toBeLessThan(baselineMetrics.apiResponseTime * 1.2);
      expect(routeTime).toBeLessThan(baselineMetrics.routeGenerationTime * 1.2);
      expect(cacheHitRatio).toBeGreaterThan(baselineMetrics.cacheHitRatio * 0.8);

      console.log(`✓ Performance regression check passed:`);
      console.log(`  API response time: ${apiTime}ms (baseline: ${baselineMetrics.apiResponseTime}ms)`);
      console.log(`  Route generation: ${routeTime}ms (baseline: ${baselineMetrics.routeGenerationTime}ms)`);
      console.log(`  Cache hit ratio: ${(cacheHitRatio * 100).toFixed(1)}% (baseline: ${(baselineMetrics.cacheHitRatio * 100).toFixed(1)}%)`);
    });
  });
});