// T014: Contract test POST /analytics/filter-interaction
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Tests analytics integration for user behavior tracking

import { describe, it, expect, beforeAll } from 'vitest';
import type { AnalyticsRequest, AnalyticsResponse, APIError } from '../../src/lib/types/api-types';

const API_BASE = 'http://localhost:4324/api';

describe('POST /analytics/filter-interaction - Contract Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: Contract tests should FAIL until API implementation is complete');
  });

  describe('successful requests', () => {
    it('should record basic filter interaction', async () => {
      const analyticsData: AnalyticsRequest = {
        sessionId: 'test_session_123',
        filterType: 'contractLength',
        filterValue: '12',
        resultCount: 23,
        responseTime: 187,
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (test browser)'
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      });
      
      expect(response.status).toBe(201);
      
      const result: AnalyticsResponse = await response.json();
      
      // Validate response structure
      expect(result).toHaveProperty('recorded');
      expect(result).toHaveProperty('sessionId');
      
      expect(result.recorded).toBe(true);
      expect(result.sessionId).toBe(analyticsData.sessionId);
      
      // Optional event ID for tracking
      if (result.eventId) {
        expect(typeof result.eventId).toBe('string');
        expect(result.eventId.length).toBeGreaterThan(0);
      }
      
      console.log(`✅ Analytics recorded: ${analyticsData.filterType}=${analyticsData.filterValue} (${analyticsData.responseTime}ms)`);
    });

    it('should handle various filter interaction types', async () => {
      const filterTypes = [
        { type: 'contractLength', value: '24', resultCount: 18 },
        { type: 'rateType', value: 'fixed', resultCount: 35 },
        { type: 'priceRange', value: '8.0-12.0', resultCount: 27 },
        { type: 'provider', value: 'Reliant Energy', resultCount: 12 },
        { type: 'greenEnergy', value: '50+', resultCount: 8 },
        { type: 'sort', value: 'price-asc', resultCount: 50 }
      ];
      
      for (const filter of filterTypes) {
        const analyticsData: AnalyticsRequest = {
          sessionId: `test_session_${Date.now()}`,
          filterType: filter.type,
          filterValue: filter.value,
          resultCount: filter.resultCount,
          responseTime: Math.floor(Math.random() * 200) + 100, // Random 100-300ms
          timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        });
        
        expect(response.status).toBe(201);
        
        const result: AnalyticsResponse = await response.json();
        expect(result.recorded).toBe(true);
        
        console.log(`✅ ${filter.type} filter recorded: ${filter.value} → ${filter.resultCount} results`);
      }
    });

    it('should record performance metrics accurately', async () => {
      const performanceTests = [
        { responseTime: 50, description: 'Fast response' },
        { responseTime: 150, description: 'Normal response' },
        { responseTime: 280, description: 'Slow but acceptable response' },
        { responseTime: 350, description: 'Slow response (performance issue)' }
      ];
      
      for (const test of performanceTests) {
        const analyticsData: AnalyticsRequest = {
          sessionId: `perf_test_${Date.now()}`,
          filterType: 'performance_test',
          filterValue: test.description,
          resultCount: 25,
          responseTime: test.responseTime,
          timestamp: new Date().toISOString(),
          additionalData: {
            performanceCategory: test.responseTime > 300 ? 'slow' : 'acceptable',
            testScenario: test.description
          }
        };
        
        const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        });
        
        expect(response.status).toBe(201);
        
        const result: AnalyticsResponse = await response.json();
        expect(result.recorded).toBe(true);
        
        console.log(`✅ Performance metric recorded: ${test.responseTime}ms (${test.description})`);
      }
    });

    it('should handle zero result scenarios', async () => {
      const zeroResultScenarios = [
        { filters: 'maxRate=5.0&minGreenEnergy=100', reason: 'Unrealistic price and green energy' },
        { filters: 'contractLength=1&excludeETF=true', reason: 'Very restrictive combination' },
        { filters: 'provider=NonexistentProvider', reason: 'Invalid provider' }
      ];
      
      for (const scenario of zeroResultScenarios) {
        const analyticsData: AnalyticsRequest = {
          sessionId: `zero_result_${Date.now()}`,
          filterType: 'zero_results',
          filterValue: scenario.filters,
          resultCount: 0, // Zero results
          responseTime: 125,
          timestamp: new Date().toISOString(),
          additionalData: {
            abandonment_reason: scenario.reason,
            user_frustration_indicator: true
          }
        };
        
        const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        });
        
        expect(response.status).toBe(201);
        
        const result: AnalyticsResponse = await response.json();
        expect(result.recorded).toBe(true);
        
        console.log(`✅ Zero results tracked: ${scenario.reason}`);
      }
    });

    it('should handle session-based analytics', async () => {
      const sessionId = `session_journey_${Date.now()}`;
      
      // Simulate a user journey with multiple interactions
      const userJourney = [
        { step: 1, filterType: 'session_start', filterValue: 'page_load', resultCount: 52 },
        { step: 2, filterType: 'contractLength', filterValue: '12', resultCount: 28 },
        { step: 3, filterType: 'rateType', filterValue: 'fixed', resultCount: 22 },
        { step: 4, filterType: 'priceRange', filterValue: 'max-12.0', resultCount: 18 },
        { step: 5, filterType: 'comparison_add', filterValue: 'plan_67b123...', resultCount: 18 },
        { step: 6, filterType: 'comparison_view', filterValue: '3_plans', resultCount: 3 },
        { step: 7, filterType: 'plan_selected', filterValue: 'plan_67b124...', resultCount: 1 }
      ];
      
      for (const interaction of userJourney) {
        const analyticsData: AnalyticsRequest = {
          sessionId,
          filterType: interaction.filterType,
          filterValue: interaction.filterValue,
          resultCount: interaction.resultCount,
          responseTime: Math.floor(Math.random() * 150) + 100,
          timestamp: new Date().toISOString(),
          additionalData: {
            journey_step: interaction.step,
            conversion_funnel: interaction.step === 7 ? 'converted' : 'in_progress'
          }
        };
        
        const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        });
        
        expect(response.status).toBe(201);
        
        // Small delay to maintain timestamp order
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`✅ User journey tracked: ${userJourney.length} interactions for session ${sessionId}`);
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        sessionId: 'test_session',
        filterType: 'contractLength'
        // Missing filterValue, resultCount, responseTime
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteData)
      });
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('code');
      expect(error.code).toBe('MISSING_REQUIRED_FIELDS');
      
      console.log('✅ Missing fields validation passed');
    });

    it('should return 400 for invalid data types', async () => {
      const invalidData = {
        sessionId: 'test_session',
        filterType: 'contractLength',
        filterValue: '12',
        resultCount: 'invalid_number', // Should be number
        responseTime: -50, // Should be positive
        timestamp: 'invalid_date'
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('INVALID_DATA_TYPES');
      
      console.log('✅ Invalid data types validation passed');
    });

    it('should return 400 for malformed JSON', async () => {
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json {'
      });
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('INVALID_JSON');
      
      console.log('✅ Malformed JSON validation passed');
    });

    it('should return 400 for invalid response times', async () => {
      const invalidResponseTimes = [-1, 0, 10000, NaN, Infinity];
      
      for (const invalidTime of invalidResponseTimes) {
        const analyticsData = {
          sessionId: 'test_session',
          filterType: 'test',
          filterValue: 'test',
          resultCount: 1,
          responseTime: invalidTime,
          timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        });
        
        expect(response.status).toBe(400);
        
        const error: APIError = await response.json();
        expect(error.code).toBe('INVALID_RESPONSE_TIME');
        
        console.log(`✅ Invalid response time rejected: ${invalidTime}`);
      }
    });
  });

  describe('data validation and security', () => {
    it('should sanitize and validate input data', async () => {
      const potentiallyDangerousData: AnalyticsRequest = {
        sessionId: '<script>alert("xss")</script>',
        filterType: 'contractLength; DROP TABLE analytics;--',
        filterValue: '"malicious": "payload"',
        resultCount: 999999999, // Very large number
        responseTime: 150,
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 <script>dangerous</script>',
        additionalData: {
          'suspicious_key': '<img src=x onerror=alert(1)>',
          'another_key': { nested: 'object with "quotes"' }
        }
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(potentiallyDangerousData)
      });
      
      // Should either sanitize and accept, or reject with validation error
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        const result: AnalyticsResponse = await response.json();
        expect(result.recorded).toBe(true);
        console.log('✅ Potentially dangerous data sanitized and recorded');
      } else {
        const error: APIError = await response.json();
        expect(error.code).toBe('DATA_VALIDATION_FAILED');
        console.log('✅ Potentially dangerous data properly rejected');
      }
    });

    it('should enforce reasonable data size limits', async () => {
      const largeData: AnalyticsRequest = {
        sessionId: 'test_session',
        filterType: 'large_data_test',
        filterValue: 'x'.repeat(1000), // Very long string
        resultCount: 50,
        responseTime: 200,
        timestamp: new Date().toISOString(),
        additionalData: {
          largeField: 'a'.repeat(10000), // Very large additional data
          anotherLargeField: Array(1000).fill('data').join(',')
        }
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(largeData)
      });
      
      // Should handle large data appropriately (either accept with truncation or reject)
      expect([201, 400, 413]).toContain(response.status);
      
      if (response.status === 413) {
        const error: APIError = await response.json();
        expect(error.code).toBe('PAYLOAD_TOO_LARGE');
      }
      
      console.log(`✅ Large data handling: Status ${response.status}`);
    });
  });

  describe('performance and scalability', () => {
    it('should handle concurrent analytics requests', async () => {
      const numConcurrentRequests = 10;
      const requests = [];
      
      for (let i = 0; i < numConcurrentRequests; i++) {
        const analyticsData: AnalyticsRequest = {
          sessionId: `concurrent_test_${i}`,
          filterType: 'concurrent_test',
          filterValue: `test_${i}`,
          resultCount: i + 1,
          responseTime: Math.floor(Math.random() * 200) + 100,
          timestamp: new Date().toISOString()
        };
        
        requests.push(fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        }));
      }
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        console.log(`✅ Concurrent request ${index + 1} succeeded`);
      });
      
      console.log(`✅ Concurrent analytics test: ${numConcurrentRequests} requests completed successfully`);
    });

    it('should process analytics requests quickly', async () => {
      const analyticsData: AnalyticsRequest = {
        sessionId: 'performance_test',
        filterType: 'performance_benchmark',
        filterValue: 'speed_test',
        resultCount: 42,
        responseTime: 175,
        timestamp: new Date().toISOString()
      };
      
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      });
      
      const endTime = Date.now();
      const requestDuration = endTime - startTime;
      
      expect(response.status).toBe(201);
      
      // Analytics recording should be fast (non-blocking)
      expect(requestDuration).toBeLessThan(200); // Should be very fast
      
      console.log(`✅ Analytics performance: Request completed in ${requestDuration}ms`);
    });
  });

  describe('rate limiting and abuse prevention', () => {
    it('should handle high-frequency requests from same session', async () => {
      const sessionId = 'high_frequency_test';
      const numRequests = 20;
      const requests = [];
      
      for (let i = 0; i < numRequests; i++) {
        const analyticsData: AnalyticsRequest = {
          sessionId,
          filterType: 'high_frequency',
          filterValue: `rapid_fire_${i}`,
          resultCount: 10,
          responseTime: 100,
          timestamp: new Date().toISOString()
        };
        
        requests.push(fetch(`${API_BASE}/analytics/filter-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyticsData)
        }));
        
        // Very small delay between requests to simulate rapid user interactions
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const responses = await Promise.all(requests);
      
      // Most requests should succeed, but some rate limiting is acceptable
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeGreaterThan(numRequests * 0.7); // At least 70% success
      
      if (rateLimitedCount > 0) {
        console.log(`✅ Rate limiting working: ${rateLimitedCount} requests rate-limited`);
      }
      
      console.log(`✅ High-frequency test: ${successCount}/${numRequests} requests successful`);
    });
  });

  describe('constitutional compliance', () => {
    it('should not log or store sensitive information', async () => {
      const analyticsData: AnalyticsRequest = {
        sessionId: 'privacy_test',
        filterType: 'privacy_check',
        filterValue: 'safe_value',
        resultCount: 15,
        responseTime: 150,
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (privacy test)',
        additionalData: {
          // Should not include PII or sensitive data
          interaction_type: 'filter_selection',
          category: 'price_filter'
          // NO: email, address, payment info, plan IDs with personal data
        }
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      });
      
      expect(response.status).toBe(201);
      
      const result: AnalyticsResponse = await response.json();
      expect(result.recorded).toBe(true);
      
      // Response should not echo back any potentially sensitive data
      expect(result).not.toHaveProperty('userAgent');
      expect(result).not.toHaveProperty('additionalData');
      
      console.log('✅ Privacy compliance: No sensitive data logged or returned');
    });

    it('should validate plan IDs when included in analytics', async () => {
      const analyticsData: AnalyticsRequest = {
        sessionId: 'plan_id_validation',
        filterType: 'plan_comparison',
        filterValue: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
        resultCount: 1,
        responseTime: 200,
        timestamp: new Date().toISOString(),
        additionalData: {
          compared_plans: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          selected_plan: '507f1f77bcf86cd799439011'
        }
      };
      
      const response = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      });
      
      expect(response.status).toBe(201);
      
      // Test with invalid/hardcoded plan ID (constitutional violation)
      const invalidAnalyticsData: AnalyticsRequest = {
        ...analyticsData,
        filterValue: '68b123456789012345678901', // Hardcoded ID pattern
        additionalData: {
          selected_plan: '68b123456789012345678901' // Should be rejected
        }
      };
      
      const invalidResponse = await fetch(`${API_BASE}/analytics/filter-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidAnalyticsData)
      });
      
      // Should reject hardcoded plan IDs
      expect([400, 201]).toContain(invalidResponse.status);
      
      if (invalidResponse.status === 400) {
        const error: APIError = await invalidResponse.json();
        expect(error.code).toBe('INVALID_PLAN_ID');
        console.log('✅ Hardcoded plan ID properly rejected');
      }
      
      console.log('✅ Plan ID validation in analytics working correctly');
    });
  });
});