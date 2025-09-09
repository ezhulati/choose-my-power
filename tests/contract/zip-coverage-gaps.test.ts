/**
 * Contract Test: GET /api/zip/coverage-gaps
 * 
 * CRITICAL: This test MUST FAIL before implementation
 * Following TDD principles - tests define the contract before implementation exists
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CoverageGapsResponse } from '../../src/types/zip-coverage.ts';

const API_BASE_URL = 'http://localhost:4324';
const ENDPOINT = '/api/zip/coverage-gaps';

describe('Contract Test: GET /api/zip/coverage-gaps', () => {
  beforeEach(() => {
    // Reset any test state before each test
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe('API Contract Validation', () => {
    it('should return comprehensive gap analysis', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      // Contract expectations that MUST be met
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data: CoverageGapsResponse = await response.json();
      
      // Response structure contract
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('gaps');
      expect(data).toHaveProperty('totalGaps');
      expect(data).toHaveProperty('recommendations');
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.gaps)).toBe(true);
      expect(typeof data.totalGaps).toBe('number');
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.totalGaps).toBe(data.gaps.length);
    });

    it('should identify gaps with complete metadata', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      const data: CoverageGapsResponse = await response.json();

      if (data.gaps.length > 0) {
        data.gaps.forEach(gap => {
          // Gap structure contract
          expect(gap).toHaveProperty('zipCode');
          expect(gap).toHaveProperty('estimatedCity');
          expect(gap).toHaveProperty('estimatedTDSP');
          expect(gap).toHaveProperty('priority');
          expect(gap).toHaveProperty('reason');
          expect(gap).toHaveProperty('suggestedSources');

          // Data type contracts
          expect(typeof gap.zipCode).toBe('string');
          expect(gap.zipCode).toMatch(/^\d{5}$/); // Valid ZIP format
          expect(['high', 'medium', 'low']).toContain(gap.priority);
          expect(typeof gap.reason).toBe('string');
          expect(Array.isArray(gap.suggestedSources)).toBe(true);

          // Optional fields type checking
          if (gap.estimatedCity) {
            expect(typeof gap.estimatedCity).toBe('string');
            expect(gap.estimatedCity.length).toBeGreaterThan(0);
          }

          if (gap.estimatedTDSP) {
            expect(typeof gap.estimatedTDSP).toBe('string');
            expect(gap.estimatedTDSP.length).toBeGreaterThan(0);
          }

          // Suggested sources should be valid source names
          gap.suggestedSources.forEach(source => {
            expect(typeof source).toBe('string');
            expect(['ercot', 'puct', 'oncor', 'centerpoint', 'aep_north', 'aep_central', 'tnmp', 'usps']).toContain(source);
          });
        });

        // Priority distribution should be reasonable
        const highPriority = data.gaps.filter(g => g.priority === 'high').length;
        const mediumPriority = data.gaps.filter(g => g.priority === 'medium').length;
        const lowPriority = data.gaps.filter(g => g.priority === 'low').length;
        
        // Total should match
        expect(highPriority + mediumPriority + lowPriority).toBe(data.totalGaps);
        
        // High priority gaps should be limited (major cities should already be mapped)
        if (data.totalGaps > 100) {
          expect(highPriority).toBeLessThan(data.totalGaps * 0.1); // <10% high priority
        }
      }
    });

    it('should provide actionable recommendations', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      const data: CoverageGapsResponse = await response.json();

      expect(data.recommendations.length).toBeGreaterThan(0);

      data.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10); // Meaningful recommendations
        
        // Should contain actionable language
        const actionableWords = ['sync', 'update', 'validate', 'contact', 'review', 'prioritize', 'implement'];
        const hasActionableContent = actionableWords.some(word => 
          recommendation.toLowerCase().includes(word)
        );
        expect(hasActionableContent).toBe(true);
      });

      // Should provide prioritized recommendations
      const firstRecommendation = data.recommendations[0].toLowerCase();
      expect(firstRecommendation).toMatch(/(high|urgent|critical|immediate|priority)/);
    });

    it('should handle priority filtering', async () => {
      const priorities = ['high', 'medium', 'low'];
      
      for (const priority of priorities) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?priority=${priority}`);
        
        expect(response.status).toBe(200);
        
        const data: CoverageGapsResponse = await response.json();
        expect(data.success).toBe(true);

        // All returned gaps should match the requested priority
        data.gaps.forEach(gap => {
          expect(gap.priority).toBe(priority);
        });

        // Total should match filtered count
        expect(data.totalGaps).toBe(data.gaps.length);
      }
    });

    it('should handle region-specific gap analysis', async () => {
      const regions = ['North', 'Coast', 'Central', 'South'];
      
      for (const region of regions) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?region=${region}`);
        
        expect(response.status).toBe(200);
        
        const data: CoverageGapsResponse = await response.json();
        expect(data.success).toBe(true);

        // Gaps should be related to the region
        if (data.gaps.length > 0) {
          // Check that estimated cities/TDSPs align with region
          const regionSpecificGaps = data.gaps.filter(gap => {
            if (gap.estimatedTDSP) {
              // Map TDSP to region
              const tdspRegionMap: Record<string, string[]> = {
                'North': ['oncor', 'aep texas north'],
                'Coast': ['centerpoint'],
                'Central': ['aep texas central'],
                'South': ['tnmp']
              };
              
              return tdspRegionMap[region]?.some(tdsp => 
                gap.estimatedTDSP!.toLowerCase().includes(tdsp)
              );
            }
            return true; // If no TDSP estimate, include in count
          });
          
          expect(regionSpecificGaps.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle limit and pagination parameters', async () => {
      // Test with limit
      const limitedResponse = await fetch(`${API_BASE_URL}${ENDPOINT}?limit=10`);
      
      expect(limitedResponse.status).toBe(200);
      
      const limitedData: CoverageGapsResponse = await limitedResponse.json();
      expect(limitedData.success).toBe(true);
      expect(limitedData.gaps.length).toBeLessThanOrEqual(10);

      // Test with offset
      const offsetResponse = await fetch(`${API_BASE_URL}${ENDPOINT}?limit=10&offset=5`);
      
      expect(offsetResponse.status).toBe(200);
      
      const offsetData: CoverageGapsResponse = await offsetResponse.json();
      expect(offsetData.success).toBe(true);
      expect(offsetData.gaps.length).toBeLessThanOrEqual(10);

      // Pagination metadata
      if (offsetData.pagination) {
        expect(offsetData.pagination).toHaveProperty('total');
        expect(offsetData.pagination).toHaveProperty('page');
        expect(offsetData.pagination).toHaveProperty('limit');
        expect(offsetData.pagination).toHaveProperty('hasNext');
        expect(offsetData.pagination).toHaveProperty('hasPrev');
      }
    });

    it('should identify specific gap types and reasons', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      const data: CoverageGapsResponse = await response.json();

      if (data.gaps.length > 0) {
        const reasons = data.gaps.map(gap => gap.reason.toLowerCase());
        
        // Should identify common gap reasons
        const expectedReasons = [
          'no external data source',
          'conflicting data sources',
          'inactive mapping',
          'municipal utility area',
          'rural/remote area',
          'new development',
          'data source unavailable',
          'validation failed'
        ];

        const foundReasons = expectedReasons.filter(expected =>
          reasons.some(reason => reason.includes(expected))
        );

        expect(foundReasons.length).toBeGreaterThan(0);

        // Each gap should suggest appropriate sources
        data.gaps.forEach(gap => {
          expect(gap.suggestedSources.length).toBeGreaterThan(0);
          
          // High priority gaps should suggest more sources
          if (gap.priority === 'high') {
            expect(gap.suggestedSources.length).toBeGreaterThanOrEqual(2);
          }
        });
      }
    });

    it('should provide performance-optimized responses', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds

      const data: CoverageGapsResponse = await response.json();
      expect(data.success).toBe(true);

      // Check for performance headers
      const processingTime = response.headers.get('X-Processing-Time');
      if (processingTime) {
        const time = parseInt(processingTime.replace('ms', ''));
        expect(time).toBeLessThan(1000); // Internal processing <1s
      }
    });

    it('should handle empty gaps scenario', async () => {
      // This tests the contract when there are no gaps (ideal scenario)
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}?region=NonExistent`);
      
      expect(response.status).toBe(200);
      
      const data: CoverageGapsResponse = await response.json();
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.gaps)).toBe(true);
      expect(data.totalGaps).toBe(0);
      expect(data.gaps.length).toBe(0);
      expect(Array.isArray(data.recommendations)).toBe(true);

      // Even with no gaps, should provide general recommendations
      expect(data.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it('should include gap trend analysis when available', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}?includeTrends=true`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Trend data is optional but should follow contract if present
      if (data.trendAnalysis) {
        expect(data.trendAnalysis).toHaveProperty('previousWeek');
        expect(data.trendAnalysis).toHaveProperty('previousMonth');
        expect(data.trendAnalysis).toHaveProperty('trend');
        
        if (data.trendAnalysis.previousWeek) {
          expect(typeof data.trendAnalysis.previousWeek.totalGaps).toBe('number');
        }
        
        if (data.trendAnalysis.trend) {
          expect(['improving', 'stable', 'worsening']).toContain(data.trendAnalysis.trend);
        }
      }
    });

    it('should support export formats', async () => {
      // CSV export
      const csvResponse = await fetch(`${API_BASE_URL}${ENDPOINT}?format=csv`);
      
      // Should either provide CSV or return 406 Not Acceptable
      expect([200, 406]).toContain(csvResponse.status);
      
      if (csvResponse.status === 200) {
        expect(csvResponse.headers.get('content-type')).toContain('text/csv');
        
        const csvContent = await csvResponse.text();
        expect(csvContent).toContain('zipCode'); // Should have header
      }

      // JSON export with detailed format
      const jsonResponse = await fetch(`${API_BASE_URL}${ENDPOINT}?format=detailed`);
      
      expect(jsonResponse.status).toBe(200);
      
      const jsonData = await jsonResponse.json();
      expect(jsonData.success).toBe(true);
      
      // Detailed format might include additional metadata
      if (jsonData.metadata) {
        expect(jsonData.metadata).toHaveProperty('analysisDate');
        expect(jsonData.metadata).toHaveProperty('criteria');
        expect(jsonData.metadata).toHaveProperty('sources');
      }
    });
  });

  describe('HTTP Method and Header Contracts', () => {
    it('should only accept GET method', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}`, {
          method
        });
        
        expect(response.status).toBe(405); // Method Not Allowed
      }
    });

    it('should include proper caching headers', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      
      expect(response.status).toBe(200);
      
      // Gap analysis should have shorter cache time due to dynamic nature
      const cacheControl = response.headers.get('Cache-Control');
      if (cacheControl) {
        expect(cacheControl).toMatch(/max-age=\d+/);
        
        // Extract max-age value
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1]);
          expect(maxAge).toBeLessThanOrEqual(1800); // ≤30 minutes cache
        }
      }
    });

    it('should include proper CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`, {
        method: 'OPTIONS'
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });

    it('should handle conditional requests', async () => {
      // First request
      const firstResponse = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      const etag = firstResponse.headers.get('ETag');
      
      if (etag) {
        // Conditional request
        const conditionalResponse = await fetch(`${API_BASE_URL}${ENDPOINT}`, {
          headers: {
            'If-None-Match': etag
          }
        });
        
        // Should return 304 if data hasn't changed
        expect([200, 304]).toContain(conditionalResponse.status);
      }
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate priority parameter', async () => {
      const invalidPriorities = ['urgent', 'critical', 'normal', 'invalid', '123'];
      
      for (const priority of invalidPriorities) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?priority=${priority}`);
        
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 400) {
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error).toContain('priority');
        }
      }
    });

    it('should validate numeric parameters', async () => {
      const invalidNumbers = ['abc', '-1', '0', '10001'];
      
      for (const invalid of invalidNumbers) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?limit=${invalid}`);
        
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 400) {
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
        }
      }
    });

    it('should validate region parameter', async () => {
      const validRegions = ['North', 'Coast', 'Central', 'South', 'Valley'];
      const invalidRegions = ['East', 'West', 'Invalid', '123'];
      
      for (const region of validRegions) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?region=${region}`);
        expect(response.status).toBe(200);
      }
      
      for (const region of invalidRegions) {
        const response = await fetch(`${API_BASE_URL}${ENDPOINT}?region=${region}`);
        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle server errors gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}`);
      
      if (response.status >= 500) {
        const data = await response.json();
        
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('timestamp');
        
        expect(data.success).toBe(false);
        expect(typeof data.error).toBe('string');
        expect(typeof data.message).toBe('string');
      }
    });

    it('should provide helpful error messages', async () => {
      // Test malformed query
      const response = await fetch(`${API_BASE_URL}${ENDPOINT}?limit=invalid&priority=wrong`);
      
      if (response.status === 400) {
        const data = await response.json();
        
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.message).toBeDefined();
        
        // Error message should mention specific issues
        const message = data.message.toLowerCase();
        expect(message).toMatch(/(limit|priority|parameter|invalid)/);
      }
    });
  });
});