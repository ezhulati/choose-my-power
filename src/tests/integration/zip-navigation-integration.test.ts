/**
 * ZIP Navigation Integration Tests
 * Task T031: Comprehensive integration test suite for ZIP navigation system
 * Phase 3.5 Polish & Validation: End-to-end testing of all ZIP navigation features
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { zipRoutingService } from '../../lib/services/zip-routing-service';
import { zipValidationService } from '../../lib/services/zip-validation-service';
import { zipErrorRecoveryService } from '../../lib/services/zip-error-recovery-service';
import { zipPerformanceMonitoringService } from '../../lib/services/zip-performance-monitoring-service';
import { analyticsService } from '../../lib/services/analytics-service';

describe('ZIP Navigation Integration Tests', () => {
  // Test data
  const validTexasZIPs = [
    { zip: '75701', city: 'Tyler', expectedSlug: 'tyler-tx' },
    { zip: '77001', city: 'Houston', expectedSlug: 'houston-tx' },
    { zip: '75201', city: 'Dallas', expectedSlug: 'dallas-tx' },
    { zip: '78701', city: 'Austin', expectedSlug: 'austin-tx' }
  ];

  const invalidZIPs = [
    { zip: '99999', expectedError: 'NOT_TEXAS' },
    { zip: '12345', expectedError: 'NOT_TEXAS' },
    { zip: 'ABCDE', expectedError: 'INVALID_FORMAT' },
    { zip: '123', expectedError: 'INVALID_FORMAT' }
  ];

  beforeAll(async () => {
    // Clear cache and reset metrics for clean testing
    await zipRoutingService.clearCache();
  });

  beforeEach(async () => {
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('End-to-End ZIP Routing Flow', () => {
    it('should handle valid Texas ZIP codes with complete routing flow', async () => {
      for (const testCase of validTexasZIPs) {
        const result = await zipRoutingService.getZIPRouting(testCase.zip);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.zipCode).toBe(testCase.zip);
        expect(result.data!.citySlug).toBe(testCase.expectedSlug);
        expect(result.data!.redirectUrl).toBe(`/electricity-plans/${testCase.expectedSlug}`);
        expect(result.data!.planCount).toBeGreaterThan(0);
        expect(result.responseTime).toBeDefined();
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
      }
    }, 10000);

    it('should demonstrate cache performance improvement', async () => {
      const testZIP = '75701';
      
      // First request (cache miss)
      const firstResult = await zipRoutingService.getZIPRouting(testZIP);
      expect(firstResult.cached).toBe(false);
      expect(firstResult.data!.source).toBe('fresh');
      const firstResponseTime = firstResult.responseTime;

      // Second request (cache hit)
      const secondResult = await zipRoutingService.getZIPRouting(testZIP);
      expect(secondResult.cached).toBe(true);
      expect(secondResult.data!.source).toBe('cache');
      
      // Cache hit should be significantly faster
      expect(secondResult.responseTime).toBeLessThanOrEqual(firstResponseTime);
      expect(secondResult.responseTime).toBeLessThan(50); // Should be very fast from cache
    }, 5000);

    it('should handle invalid ZIP codes with comprehensive error recovery', async () => {
      for (const testCase of invalidZIPs) {
        const result = await zipRoutingService.getZIPRouting(testCase.zip);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe(testCase.expectedError);
        expect(result.error!.message).toBeDefined();
        expect(result.error!.suggestions).toBeDefined();
        expect(result.error!.recoveryActions).toBeDefined();
        expect(result.error!.helpfulTips).toBeDefined();
        
        // Verify suggestions are helpful
        if (result.error!.suggestions && result.error!.suggestions.length > 0) {
          expect(result.error!.suggestions.length).toBeGreaterThan(0);
          expect(result.error!.suggestions.length).toBeLessThanOrEqual(5);
        }
      }
    }, 10000);
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance events automatically', async () => {
      // Clear existing performance data
      const initialMetrics = zipRoutingService.getPerformanceMetrics();
      const initialTotal = initialMetrics.totalRequests;

      // Generate test requests
      await zipRoutingService.getZIPRouting('75701'); // Cache miss
      await zipRoutingService.getZIPRouting('75701'); // Cache hit
      await zipRoutingService.getZIPRouting('99999'); // Error

      // Verify performance tracking
      const finalMetrics = zipRoutingService.getPerformanceMetrics();
      expect(finalMetrics.totalRequests).toBe(initialTotal + 3);
      expect(finalMetrics.cacheHits).toBeGreaterThanOrEqual(1);
      expect(finalMetrics.cacheMisses).toBeGreaterThanOrEqual(1);
      expect(finalMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    }, 5000);

    it('should generate system health insights', async () => {
      const systemHealth = await zipPerformanceMonitoringService.getSystemHealth();
      
      expect(systemHealth.uptime).toBeGreaterThanOrEqual(0);
      expect(systemHealth.totalRequests).toBeGreaterThanOrEqual(0);
      expect(systemHealth.successRate).toBeGreaterThanOrEqual(0);
      expect(systemHealth.successRate).toBeLessThanOrEqual(100);
      expect(systemHealth.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(systemHealth.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(systemHealth.cacheHitRate).toBeLessThanOrEqual(100);
      expect(systemHealth.performanceByRegion).toBeDefined();
      expect(systemHealth.alertsSummary).toBeDefined();
    }, 3000);

    it('should provide optimization recommendations', async () => {
      const recommendations = await zipPerformanceMonitoringService.getOptimizationRecommendations();
      
      expect(recommendations.recommendations).toBeDefined();
      expect(Array.isArray(recommendations.recommendations)).toBe(true);
      expect(recommendations.summary).toBeDefined();
      expect(recommendations.summary.totalRecommendations).toBeGreaterThanOrEqual(0);
      expect(recommendations.summary.highPriority).toBeGreaterThanOrEqual(0);
      expect(recommendations.summary.estimatedImprovementPercent).toBeGreaterThanOrEqual(0);

      // Verify recommendation structure
      recommendations.recommendations.forEach(rec => {
        expect(rec.type).toBeDefined();
        expect(rec.priority).toMatch(/^(HIGH|MEDIUM|LOW)$/);
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.expectedImpact).toBeDefined();
        expect(Array.isArray(rec.implementation)).toBe(true);
      });
    }, 3000);
  });

  describe('Error Recovery and Analytics Integration', () => {
    it('should provide intelligent error recovery for different error types', async () => {
      const errorTests = [
        { zip: 'ABCDE', expectedType: 'INVALID_FORMAT' },
        { zip: '12345', expectedType: 'NOT_TEXAS' },
        { zip: '99999', expectedType: 'NOT_TEXAS' }
      ];

      for (const test of errorTests) {
        const recovery = await zipErrorRecoveryService.getErrorRecovery(test.zip, test.expectedType as any);
        
        expect(recovery.suggestions).toBeDefined();
        expect(recovery.recoveryActions).toBeDefined();
        expect(recovery.helpfulTips).toBeDefined();
        
        expect(recovery.suggestions.length).toBeGreaterThan(0);
        expect(recovery.recoveryActions.length).toBeGreaterThan(0);
        expect(recovery.helpfulTips.length).toBeGreaterThan(0);

        // Verify suggestion formatting
        const formattedSuggestions = zipErrorRecoveryService.formatSuggestionsForDisplay(recovery.suggestions);
        expect(formattedSuggestions.length).toBe(recovery.suggestions.length);
        formattedSuggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string');
          expect(suggestion.length).toBeGreaterThan(0);
        });
      }
    }, 5000);

    it('should track analytics events for all ZIP operations', async () => {
      const initialInsights = await analyticsService.getZIPNavigationInsights(1);
      const initialEventCount = initialInsights.totalEvents;

      // Generate events
      await zipRoutingService.getZIPRouting('77001'); // Success
      await zipRoutingService.getZIPRouting('99999'); // Error

      // Small delay to ensure events are processed
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalInsights = await analyticsService.getZIPNavigationInsights(1);
      expect(finalInsights.totalEvents).toBeGreaterThanOrEqual(initialEventCount);
      
      // Verify insights structure
      expect(finalInsights.eventTypes).toBeDefined();
      expect(finalInsights.topZIPs).toBeDefined();
      expect(finalInsights.errorRate).toBeGreaterThanOrEqual(0);
      expect(finalInsights.errorRate).toBeLessThanOrEqual(100);
      expect(finalInsights.performanceMetrics).toBeDefined();
    }, 5000);
  });

  describe('Bulk Operations and Stress Testing', () => {
    it('should handle bulk ZIP routing efficiently', async () => {
      const testZIPs = ['75701', '77001', '75201', '78701', '76101'];
      const startTime = Date.now();
      
      const results = await zipRoutingService.getBulkZIPRouting(testZIPs);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results.size).toBe(testZIPs.length);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all results
      testZIPs.forEach(zip => {
        const result = results.get(zip);
        expect(result).toBeDefined();
        expect(result!.success).toBe(true);
      });
    }, 15000);

    it('should maintain performance under concurrent requests', async () => {
      const concurrentRequests = 10;
      const testZIP = '75201';
      
      const startTime = Date.now();
      const promises = Array(concurrentRequests).fill(null).map(() => 
        zipRoutingService.getZIPRouting(testZIP)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const averageTime = (endTime - startTime) / concurrentRequests;
      
      expect(results.length).toBe(concurrentRequests);
      expect(averageTime).toBeLessThan(1000); // Average should be under 1 second
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
      });
    }, 10000);
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain consistent ZIP to city mappings', async () => {
      const testCases = [
        { zip: '75701', expectedCity: 'Tyler' },
        { zip: '77001', expectedCity: 'Houston' },
        { zip: '75201', expectedCity: 'Dallas' }
      ];

      for (const testCase of testCases) {
        const routingResult = await zipRoutingService.getZIPRouting(testCase.zip);
        const validationResult = await zipValidationService.validateZIPCode(testCase.zip);
        
        // Results should be consistent between services
        expect(routingResult.success).toBe(true);
        expect(validationResult.isValid).toBe(true);
        expect(routingResult.data!.cityName).toBe(testCase.expectedCity);
        expect(validationResult.cityData!.name).toBe(testCase.expectedCity);
      }
    }, 5000);

    it('should validate TDSP territory mappings', async () => {
      const texasZIPs = ['75701', '77001', '78701', '76101'];
      
      for (const zip of texasZIPs) {
        const result = await zipRoutingService.getZIPRouting(zip);
        
        expect(result.success).toBe(true);
        expect(result.data!.tdspTerritory).toBeDefined();
        expect(result.data!.tdspTerritory).not.toBe('Unknown');
        expect(typeof result.data!.tdspTerritory).toBe('string');
        expect(result.data!.tdspTerritory.length).toBeGreaterThan(0);
      }
    }, 5000);
  });

  afterAll(async () => {
    // Clean up test data and reset caches
    await zipRoutingService.clearCache();
  });
});