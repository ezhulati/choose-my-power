// T012: Contract test GET /api/plans/compare
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Tests side-by-side comparison functionality (FR-003)

import { describe, it, expect, beforeAll } from 'vitest';
import type { PlansCompareResponse, APIError } from '../../src/lib/types/api-types';
import type { ElectricityPlan } from '../../src/lib/types/electricity-plan';
import type { CostAnalysis, FeatureComparison } from '../../src/lib/types/comparison-state';

const API_BASE = 'http://localhost:4324/api';

// Sample valid MongoDB ObjectIds for testing (these will be replaced with real IDs from data)
const SAMPLE_PLAN_IDS = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014'
];

describe('GET /api/plans/compare - Contract Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: Contract tests should FAIL until API implementation is complete');
  });

  describe('successful responses', () => {
    it('should return comparison data for 2-4 valid plan IDs', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 3);
      const queryParams = `planIds=${testPlanIds.join(',')}&usageKwh=1000`;
      
      const response = await fetch(`${API_BASE}/plans/compare?${queryParams}`);
      
      expect(response.status).toBe(200);
      
      const data: PlansCompareResponse = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('comparisonData');
      expect(data).toHaveProperty('costAnalysis');
      expect(data).toHaveProperty('featureMatrix');
      expect(data).toHaveProperty('responseTime');
      
      // Validate comparison data
      expect(Array.isArray(data.comparisonData)).toBe(true);
      expect(data.comparisonData).toHaveLength(3);
      
      // Validate each compared plan
      data.comparisonData.forEach((plan: ElectricityPlan) => {
        expect(testPlanIds).toContain(plan.id);
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/); // Constitutional compliance
      });
      
      // Performance requirement
      expect(typeof data.responseTime).toBe('number');
      expect(data.responseTime).toBeLessThan(300);
      
      console.log(`✅ Comparison response valid for ${data.comparisonData.length} plans in ${data.responseTime}ms`);
    });

    it('should provide comprehensive cost analysis', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 4); // Maximum 4 plans
      const queryParams = `planIds=${testPlanIds.join(',')}&usageKwh=1200`;
      
      const response = await fetch(`${API_BASE}/plans/compare?${queryParams}`);
      const data: PlansCompareResponse = await response.json();
      
      const costAnalysis: CostAnalysis = data.costAnalysis;
      
      // Validate cost analysis structure
      expect(Array.isArray(costAnalysis.monthlyEstimates)).toBe(true);
      expect(Array.isArray(costAnalysis.firstYearTotal)).toBe(true);
      expect(Array.isArray(costAnalysis.averageRate)).toBe(true);
      expect(Array.isArray(costAnalysis.savingsVsFirst)).toBe(true);
      
      // All arrays should have same length as number of plans
      const planCount = data.comparisonData.length;
      expect(costAnalysis.monthlyEstimates).toHaveLength(planCount);
      expect(costAnalysis.firstYearTotal).toHaveLength(planCount);
      expect(costAnalysis.averageRate).toHaveLength(planCount);
      expect(costAnalysis.savingsVsFirst).toHaveLength(planCount);
      
      // Validate cost calculations
      costAnalysis.monthlyEstimates.forEach((estimate, index) => {
        expect(typeof estimate).toBe('number');
        expect(estimate).toBeGreaterThan(0);
        
        // First year total should be ~12x monthly (plus connection fees)
        const firstYear = costAnalysis.firstYearTotal[index];
        expect(firstYear).toBeGreaterThan(estimate * 12);
        expect(firstYear).toBeLessThan(estimate * 12 + 500); // Reasonable connection fee range
      });
      
      // Savings should be calculated relative to most expensive option
      const maxFirstYear = Math.max(...costAnalysis.firstYearTotal);
      costAnalysis.savingsVsFirst.forEach((savings, index) => {
        expect(costAnalysis.firstYearTotal[index] + savings).toBeCloseTo(maxFirstYear, 2);
      });
      
      console.log('✅ Cost analysis validation passed');
    });

    it('should generate comprehensive feature comparison matrix', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 3);
      const queryParams = `planIds=${testPlanIds.join(',')}&focusAreas=features,price`;
      
      const response = await fetch(`${API_BASE}/plans/compare?${queryParams}`);
      const data: PlansCompareResponse = await response.json();
      
      const featureMatrix: FeatureComparison[] = data.featureMatrix;
      
      expect(Array.isArray(featureMatrix)).toBe(true);
      expect(featureMatrix.length).toBeGreaterThan(0);
      
      // Validate each feature comparison
      featureMatrix.forEach(feature => {
        expect(typeof feature.featureName).toBe('string');
        expect(feature.featureName.length).toBeGreaterThan(0);
        
        expect(Array.isArray(feature.planAvailability)).toBe(true);
        expect(feature.planAvailability).toHaveLength(data.comparisonData.length);
        
        // Each availability should be boolean
        feature.planAvailability.forEach(available => {
          expect(typeof available).toBe('boolean');
        });
        
        expect(['high', 'medium', 'low']).toContain(feature.importance);
      });
      
      console.log(`✅ Feature matrix validation passed: ${featureMatrix.length} features compared`);
    });

    it('should provide intelligent plan recommendations', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 3);
      const queryParams = `planIds=${testPlanIds.join(',')}&focusAreas=price,green&usageKwh=1500`;
      
      const response = await fetch(`${API_BASE}/plans/compare?${queryParams}`);
      const data: PlansCompareResponse = await response.json();
      
      if (data.recommendation) {
        const rec = data.recommendation;
        
        // Recommended plan should be one of the compared plans
        expect(testPlanIds).toContain(rec.recommendedPlanId);
        expect(rec.recommendedPlanId).toMatch(/^[0-9a-fA-F]{24}$/);
        
        // Should provide reasons
        expect(Array.isArray(rec.reasons)).toBe(true);
        expect(rec.reasons.length).toBeGreaterThan(0);
        rec.reasons.forEach(reason => {
          expect(typeof reason).toBe('string');
          expect(reason.length).toBeGreaterThan(0);
        });
        
        // Confidence score validation
        expect(typeof rec.confidenceScore).toBe('number');
        expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(rec.confidenceScore).toBeLessThanOrEqual(1);
        
        // Savings highlight (if provided)
        if (rec.savingsHighlight) {
          expect(typeof rec.savingsHighlight.annualSavings).toBe('number');
          expect(typeof rec.savingsHighlight.percentageSavings).toBe('number');
          expect(rec.savingsHighlight.percentageSavings).toBeGreaterThanOrEqual(0);
          expect(rec.savingsHighlight.percentageSavings).toBeLessThanOrEqual(100);
        }
        
        console.log(`✅ Recommendation provided: ${rec.recommendedPlanId} (confidence: ${rec.confidenceScore})`);
      }
    });

    it('should handle different usage scenarios correctly', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 2);
      
      // Test low usage (500 kWh)
      const lowUsageResponse = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=500`);
      const lowUsageData: PlansCompareResponse = await lowUsageResponse.json();
      
      // Test high usage (2500 kWh)
      const highUsageResponse = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=2500`);
      const highUsageData: PlansCompareResponse = await highUsageResponse.json();
      
      // Cost calculations should reflect usage differences
      const lowMonthlyCost = lowUsageData.costAnalysis.monthlyEstimates[0];
      const highMonthlyCost = highUsageData.costAnalysis.monthlyEstimates[0];
      
      expect(highMonthlyCost).toBeGreaterThan(lowMonthlyCost);
      
      // The difference should be proportional to usage difference
      const usageRatio = 2500 / 500; // 5x usage
      const costRatio = highMonthlyCost / lowMonthlyCost;
      expect(costRatio).toBeGreaterThan(2); // At least 2x cost for 5x usage (fixed fees reduce ratio)
      expect(costRatio).toBeLessThan(6); // But not more than 6x (fixed fees impact)
      
      console.log(`✅ Usage scenario validation: Low usage ${lowMonthlyCost}, High usage ${highMonthlyCost}`);
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing plan IDs', async () => {
      const response = await fetch(`${API_BASE}/plans/compare`);
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('MISSING_PLAN_IDS');
      expect(error.error.toLowerCase()).toContain('plan');
    });

    it('should return 400 for invalid number of plan IDs', async () => {
      // Too few plans (only 1)
      const response1 = await fetch(`${API_BASE}/plans/compare?planIds=${SAMPLE_PLAN_IDS[0]}`);
      expect(response1.status).toBe(400);
      
      const error1: APIError = await response1.json();
      expect(error1.code).toBe('INVALID_PLAN_COUNT');
      
      // Too many plans (more than 4)
      const tooManyIds = [...SAMPLE_PLAN_IDS, '507f1f77bcf86cd799439015'];
      const response2 = await fetch(`${API_BASE}/plans/compare?planIds=${tooManyIds.join(',')}`);
      expect(response2.status).toBe(400);
      
      const error2: APIError = await response2.json();
      expect(error2.code).toBe('INVALID_PLAN_COUNT');
      
      console.log('✅ Plan count validation passed');
    });

    it('should return 400 for invalid plan ID formats', async () => {
      const invalidIds = ['invalid-id', '123', 'not-a-mongodb-id'];
      const response = await fetch(`${API_BASE}/plans/compare?planIds=${invalidIds.join(',')}`);
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('INVALID_PLAN_IDS');
      
      console.log('✅ Invalid plan ID format handling passed');
    });

    it('should return 404 for non-existent plan IDs', async () => {
      // Valid format but non-existent IDs
      const nonExistentIds = [
        '000000000000000000000000',
        '111111111111111111111111'
      ];
      
      const response = await fetch(`${API_BASE}/plans/compare?planIds=${nonExistentIds.join(',')}`);
      
      expect(response.status).toBe(404);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('PLANS_NOT_FOUND');
      
      console.log('✅ Non-existent plan ID handling passed');
    });

    it('should return 400 for invalid usage parameters', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 2);
      
      // Invalid usage (negative)
      const response1 = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=-100`);
      expect(response1.status).toBe(400);
      
      // Invalid usage (too high)
      const response2 = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=10000`);
      expect(response2.status).toBe(400);
      
      // Invalid usage (not a number)
      const response3 = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=invalid`);
      expect(response3.status).toBe(400);
      
      console.log('✅ Usage parameter validation passed');
    });
  });

  describe('performance requirements', () => {
    it('should meet comparison response time requirements', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 4); // Maximum complexity
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=1000`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      
      const data: PlansCompareResponse = await response.json();
      
      // API reported response time should be under 300ms
      expect(data.responseTime).toBeLessThan(300);
      
      // Total request time should also be reasonable
      expect(responseTime).toBeLessThan(500);
      
      console.log(`✅ Performance test: API ${data.responseTime}ms, Total ${responseTime}ms`);
    });

    it('should handle multiple concurrent comparison requests', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 3);
      const numRequests = 5;
      
      const requests = Array(numRequests).fill(0).map((_, index) => 
        fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}&usageKwh=${1000 + index * 100}`)
      );
      
      const responses = await Promise.all(requests);
      const responseData = await Promise.all(responses.map(r => r.json()));
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // All should meet performance requirements
      responseData.forEach((data: PlansCompareResponse, index) => {
        expect(data.responseTime).toBeLessThan(300);
      });
      
      console.log(`✅ Concurrent comparison test: ${numRequests} requests completed successfully`);
    });
  });

  describe('constitutional compliance', () => {
    it('should only accept and return valid MongoDB ObjectIds', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 3);
      const response = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}`);
      const data: PlansCompareResponse = await response.json();
      
      // All returned plan IDs should be valid MongoDB ObjectIds
      data.comparisonData.forEach(plan => {
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/);
        
        // Should not be hardcoded values (constitutional violation)
        expect(plan.id).not.toMatch(/68b[0-9a-f]{21}/i);
      });
      
      // Recommendation should also use valid ID
      if (data.recommendation) {
        expect(data.recommendation.recommendedPlanId).toMatch(/^[0-9a-fA-F]{24}$/);
        expect(data.recommendation.recommendedPlanId).not.toMatch(/68b[0-9a-f]{21}/i);
      }
      
      console.log('✅ Constitutional compliance: All plan IDs are valid MongoDB ObjectIds');
    });

    it('should provide comparison of real Texas electricity plans only', async () => {
      const testPlanIds = SAMPLE_PLAN_IDS.slice(0, 2);
      const response = await fetch(`${API_BASE}/plans/compare?planIds=${testPlanIds.join(',')}`);
      const data: PlansCompareResponse = await response.json();
      
      // All compared plans should be real Texas electricity plans
      data.comparisonData.forEach(plan => {
        // Real Texas providers
        expect(plan.providerName).toBeTruthy();
        expect(typeof plan.providerName).toBe('string');
        
        // Real Texas rate ranges
        expect(plan.baseRate).toBeGreaterThan(5);
        expect(plan.baseRate).toBeLessThan(30);
        
        // Real Texas TDSP territories
        const texasTDSPs = ['Oncor', 'CenterPoint', 'AEP Texas', 'TNMP'];
        expect(texasTDSPs).toContain(plan.tdspTerritory);
        
        // Real contract terms
        expect([1, 6, 12, 24, 36]).toContain(plan.contractLength);
      });
      
      console.log('✅ Real data validation: All compared plans are legitimate Texas electricity plans');
    });
  });
});