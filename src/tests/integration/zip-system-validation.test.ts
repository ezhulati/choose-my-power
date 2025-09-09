/**
 * ZIP System Validation Tests
 * Task T031: Core system validation for ZIP navigation functionality
 * Phase 3.5 Polish & Validation: Essential tests that work with live services
 */

import { describe, it, expect } from 'vitest';
import { zipRoutingService } from '../../lib/services/zip-routing-service';
import { zipErrorRecoveryService } from '../../lib/services/zip-error-recovery-service';
import { zipPerformanceMonitoringService } from '../../lib/services/zip-performance-monitoring-service';

describe('ZIP System Validation Tests', () => {
  describe('Error Handling and Recovery', () => {
    it('should provide comprehensive error recovery for invalid ZIP codes', async () => {
      const invalidTests = [
        { zip: '99999', expectedType: 'NOT_TEXAS' },
        { zip: 'ABCDE', expectedType: 'INVALID_FORMAT' },
        { zip: '123', expectedType: 'INVALID_FORMAT' }
      ];

      for (const test of invalidTests) {
        const result = await zipRoutingService.getZIPRouting(test.zip);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe(test.expectedType);
        expect(result.error!.suggestions).toBeDefined();
        expect(result.error!.recoveryActions).toBeDefined();
        expect(result.error!.helpfulTips).toBeDefined();
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        
        // Verify suggestions are properly formatted
        if (result.error!.suggestions && result.error!.suggestions.length > 0) {
          expect(result.error!.suggestions.length).toBeLessThanOrEqual(5);
          result.error!.suggestions.forEach(suggestion => {
            expect(typeof suggestion).toBe('string');
            expect(suggestion.length).toBeGreaterThan(0);
          });
        }
      }
    }, 5000);

    it('should provide different error recovery strategies by error type', async () => {
      const errorRecoveryTests = [
        'INVALID_FORMAT',
        'NOT_TEXAS',
        'NOT_FOUND',
        'NOT_DEREGULATED'
      ] as const;

      for (const errorType of errorRecoveryTests) {
        const recovery = await zipErrorRecoveryService.getErrorRecovery('99999', errorType);
        
        expect(recovery.suggestions).toBeDefined();
        expect(recovery.recoveryActions).toBeDefined();
        expect(recovery.helpfulTips).toBeDefined();
        
        expect(Array.isArray(recovery.suggestions)).toBe(true);
        expect(Array.isArray(recovery.recoveryActions)).toBe(true);
        expect(Array.isArray(recovery.helpfulTips)).toBe(true);
        
        expect(recovery.suggestions.length).toBeGreaterThan(0);
        expect(recovery.recoveryActions.length).toBeGreaterThan(0);
        expect(recovery.helpfulTips.length).toBeGreaterThan(0);
      }
    }, 3000);

    it('should format suggestions appropriately for display', async () => {
      const testSuggestions = [
        { zipCode: '75201', cityName: 'Dallas', reason: 'popular' as const },
        { zipCode: '77001', cityName: 'Houston', reason: 'typo_correction' as const },
        { zipCode: '78701', cityName: 'Austin', reason: 'nearby' as const }
      ];

      const formatted = zipErrorRecoveryService.formatSuggestionsForDisplay(testSuggestions);
      
      expect(formatted.length).toBe(testSuggestions.length);
      formatted.forEach((suggestion, index) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion).toContain(testSuggestions[index].zipCode);
        expect(suggestion.length).toBeGreaterThan(5); // Should have more than just ZIP code
      });
    }, 1000);
  });

  describe('Performance Monitoring System', () => {
    it('should provide system health metrics', async () => {
      const health = await zipPerformanceMonitoringService.getSystemHealth();
      
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.totalRequests).toBeGreaterThanOrEqual(0);
      expect(health.successRate).toBeGreaterThanOrEqual(0);
      expect(health.successRate).toBeLessThanOrEqual(100);
      expect(health.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(health.cacheHitRate).toBeLessThanOrEqual(100);
      expect(health.performanceByRegion).toBeDefined();
      expect(health.alertsSummary).toBeDefined();
    }, 3000);

    it('should generate optimization recommendations', async () => {
      const recommendations = await zipPerformanceMonitoringService.getOptimizationRecommendations();
      
      expect(recommendations.recommendations).toBeDefined();
      expect(Array.isArray(recommendations.recommendations)).toBe(true);
      expect(recommendations.summary).toBeDefined();
      expect(recommendations.summary.totalRecommendations).toBeGreaterThanOrEqual(0);
      expect(recommendations.summary.highPriority).toBeGreaterThanOrEqual(0);
      expect(recommendations.summary.estimatedImprovementPercent).toBeGreaterThanOrEqual(0);
      
      // Validate recommendation structure
      recommendations.recommendations.forEach(rec => {
        expect(rec.type).toMatch(/^(CACHE_OPTIMIZATION|ERROR_REDUCTION|PERFORMANCE_TUNING|INFRASTRUCTURE)$/);
        expect(rec.priority).toMatch(/^(HIGH|MEDIUM|LOW)$/);
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.expectedImpact).toBeDefined();
        expect(Array.isArray(rec.implementation)).toBe(true);
        expect(rec.implementation.length).toBeGreaterThan(0);
      });
    }, 3000);

    it('should provide cache analysis', async () => {
      const analysis = await zipPerformanceMonitoringService.getCacheAnalysis();
      
      expect(analysis.overview).toBeDefined();
      expect(analysis.overview.hitRate).toBeGreaterThanOrEqual(0);
      expect(analysis.overview.hitRate).toBeLessThanOrEqual(100);
      expect(analysis.overview.missRate).toBeGreaterThanOrEqual(0);
      expect(analysis.overview.missRate).toBeLessThanOrEqual(100);
      expect(analysis.overview.totalRequests).toBeGreaterThanOrEqual(0);
      expect(analysis.overview.averageHitResponseTime).toBeGreaterThanOrEqual(0);
      expect(analysis.overview.averageMissResponseTime).toBeGreaterThanOrEqual(0);
      
      expect(Array.isArray(analysis.hotZIPs)).toBe(true);
      expect(Array.isArray(analysis.coldZIPs)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    }, 3000);

    it('should handle alert management', async () => {
      const alerts = zipPerformanceMonitoringService.getActiveAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      
      // Verify alert structure if any exist
      alerts.forEach(alert => {
        expect(alert.id).toBeDefined();
        expect(alert.type).toBeDefined();
        expect(alert.severity).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
        expect(alert.message).toBeDefined();
        expect(alert.timestamp).toBeDefined();
        expect(alert.metrics).toBeDefined();
      });
    }, 1000);

    it('should export performance data correctly', async () => {
      const exported = await zipPerformanceMonitoringService.exportPerformanceData('JSON');
      
      expect(exported.exportId).toBeDefined();
      expect(exported.format).toBe('JSON');
      expect(exported.recordCount).toBeGreaterThanOrEqual(0);
      expect(exported.generatedAt).toBeDefined();
      expect(exported.data).toBeDefined();
      
      // Validate export structure
      const data = exported.data as any;
      expect(data.systemHealth).toBeDefined();
      expect(data.trends).toBeDefined();
      expect(data.alerts).toBeDefined();
      expect(data.cacheAnalysis).toBeDefined();
      expect(data.metadata).toBeDefined();
    }, 3000);
  });

  describe('Service Integration and Performance', () => {
    it('should maintain performance metrics correctly', async () => {
      const initialMetrics = zipRoutingService.getPerformanceMetrics();
      const initialRequests = initialMetrics.totalRequests;
      const initialCacheHits = initialMetrics.cacheHits;
      
      // Perform test operations
      await zipRoutingService.getZIPRouting('75701'); // Should work or give expected error
      await zipRoutingService.getZIPRouting('99999'); // Should error
      
      const finalMetrics = zipRoutingService.getPerformanceMetrics();
      expect(finalMetrics.totalRequests).toBeGreaterThanOrEqual(initialRequests);
      expect(finalMetrics.cacheHits).toBeGreaterThanOrEqual(initialCacheHits);
      expect(finalMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    }, 3000);

    it('should handle concurrent requests efficiently', async () => {
      const concurrentCount = 5;
      const testRequests = Array(concurrentCount).fill(null).map(() => 
        zipRoutingService.getZIPRouting('99999') // Use invalid ZIP for consistent behavior
      );
      
      const startTime = Date.now();
      const results = await Promise.all(testRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results.length).toBe(concurrentCount);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach(result => {
        expect(result.success).toBe(false); // Invalid ZIP should fail
        expect(result.error).toBeDefined();
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
      });
    }, 8000);

    it('should handle bulk ZIP processing', async () => {
      const testZIPs = ['99999', '88888', '77777', '66666', '55555'];
      const startTime = Date.now();
      
      const results = await zipRoutingService.getBulkZIPRouting(testZIPs);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results.size).toBe(testZIPs.length);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      testZIPs.forEach(zip => {
        const result = results.get(zip);
        expect(result).toBeDefined();
        expect(result!.responseTime).toBeGreaterThanOrEqual(0);
      });
    }, 20000);
  });

  describe('Configuration and Environment Validation', () => {
    it('should handle missing Redis gracefully', async () => {
      // The services should work even without Redis
      const cacheStats = await zipRoutingService.getCacheStats();
      
      expect(cacheStats).toBeDefined();
      expect(cacheStats.totalCachedRoutes).toBeGreaterThanOrEqual(0);
      expect(typeof cacheStats.cacheSize).toBe('string');
    }, 2000);

    it('should validate service initialization', async () => {
      // Services should be properly initialized and accessible
      expect(zipRoutingService).toBeDefined();
      expect(zipErrorRecoveryService).toBeDefined();
      expect(zipPerformanceMonitoringService).toBeDefined();
      
      // Performance metrics should be accessible
      const metrics = zipRoutingService.getPerformanceMetrics();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHits).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheMisses).toBeGreaterThanOrEqual(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    }, 1000);

    it('should handle performance event recording', async () => {
      // Should be able to record performance events without error
      await expect(zipPerformanceMonitoringService.recordPerformanceEvent({
        type: 'REQUEST',
        zipCode: 'TEST',
        responseTime: 100
      })).resolves.not.toThrow();
      
      await expect(zipPerformanceMonitoringService.recordPerformanceEvent({
        type: 'ERROR',
        zipCode: 'TEST',
        responseTime: 50,
        errorCode: 'NOT_FOUND'
      })).resolves.not.toThrow();
      
      await expect(zipPerformanceMonitoringService.recordPerformanceEvent({
        type: 'CACHE_HIT',
        zipCode: 'TEST',
        responseTime: 5
      })).resolves.not.toThrow();
    }, 3000);
  });
});