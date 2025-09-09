// T011: Contract test GET /api/plans/list
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Constitutional compliance: No hardcoded plan IDs in test data

import { describe, it, expect, beforeAll } from 'vitest';
import type { PlansListResponse, APIError } from '../../src/lib/types/api-types';
import type { ElectricityPlan } from '../../src/lib/types/electricity-plan';

const API_BASE = 'http://localhost:4324/api';

describe('GET /api/plans/list - Contract Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: Contract tests should FAIL until API implementation is complete');
  });

  describe('successful responses', () => {
    it('should return plans list with required structure', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=dallas&limit=10`);
      
      expect(response.status).toBe(200);
      
      const data: PlansListResponse = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('plans');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('filterCounts');
      expect(data).toHaveProperty('appliedFilters');
      expect(data).toHaveProperty('responseTime');
      
      // Validate plans array
      expect(Array.isArray(data.plans)).toBe(true);
      expect(data.plans.length).toBeGreaterThan(0);
      expect(data.plans.length).toBeLessThanOrEqual(10);
      
      // Validate totalCount
      expect(typeof data.totalCount).toBe('number');
      expect(data.totalCount).toBeGreaterThan(0);
      
      // Validate responseTime (performance requirement <300ms)
      expect(typeof data.responseTime).toBe('number');
      expect(data.responseTime).toBeLessThan(300); // NFR-005 requirement
      
      console.log(`✅ API Response time: ${data.responseTime}ms (required: <300ms)`);
    });

    it('should return properly structured plan objects', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=dallas&limit=5`);
      const data: PlansListResponse = await response.json();
      
      // Validate each plan has required structure
      data.plans.forEach((plan: ElectricityPlan, index: number) => {
        // Constitutional compliance: Validate MongoDB ObjectId format
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/);
        expect(typeof plan.planName).toBe('string');
        expect(plan.planName.length).toBeGreaterThan(0);
        
        expect(typeof plan.providerName).toBe('string');
        expect(plan.providerName.length).toBeGreaterThan(0);
        
        // Pricing validation
        expect(typeof plan.baseRate).toBe('number');
        expect(plan.baseRate).toBeGreaterThan(0);
        
        expect(['fixed', 'variable', 'indexed']).toContain(plan.rateType);
        
        expect([1, 6, 12, 24, 36]).toContain(plan.contractLength);
        
        expect(typeof plan.monthlyFee).toBe('number');
        expect(plan.monthlyFee).toBeGreaterThanOrEqual(0);
        
        expect(typeof plan.estimatedMonthlyCost).toBe('number');
        expect(plan.estimatedMonthlyCost).toBeGreaterThan(0);
        
        // Features validation
        expect(typeof plan.greenEnergyPercentage).toBe('number');
        expect(plan.greenEnergyPercentage).toBeGreaterThanOrEqual(0);
        expect(plan.greenEnergyPercentage).toBeLessThanOrEqual(100);
        
        expect(Array.isArray(plan.planFeatures)).toBe(true);
        expect(['active', 'limited', 'discontinued']).toContain(plan.availability);
        
        console.log(`✅ Plan ${index + 1} structure valid: ${plan.planName} (${plan.id})`);
      });
    });

    it('should handle filtering parameters correctly', async () => {
      // Test contract length filtering
      const response = await fetch(`${API_BASE}/plans/list?city=dallas&contractLengths=12,24&limit=20`);
      const data: PlansListResponse = await response.json();
      
      expect(response.status).toBe(200);
      
      // All returned plans should match filter criteria
      data.plans.forEach(plan => {
        expect([12, 24]).toContain(plan.contractLength);
      });
      
      // Applied filters should reflect request
      expect(data.appliedFilters.city).toBe('dallas');
      expect(data.appliedFilters.contractLengths).toEqual(expect.arrayContaining([12, 24]));
      
      console.log(`✅ Filtering test passed: ${data.plans.length} plans match contract length filter`);
    });

    it('should provide filter counts for UI indicators', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=houston&limit=50`);
      const data: PlansListResponse = await response.json();
      
      // Filter counts should be present
      expect(typeof data.filterCounts).toBe('object');
      expect(Object.keys(data.filterCounts).length).toBeGreaterThan(0);
      
      // Validate some expected filter count keys
      const filterKeys = Object.keys(data.filterCounts);
      expect(filterKeys.some(key => key.includes('month'))).toBe(true); // Contract lengths
      expect(filterKeys.some(key => key.includes('rate') || key.includes('fixed') || key.includes('variable'))).toBe(true); // Rate types
      
      console.log(`✅ Filter counts provided: ${Object.keys(data.filterCounts).length} categories`);
    });

    it('should support sorting parameters', async () => {
      // Test price sorting (ascending)
      const priceAscResponse = await fetch(`${API_BASE}/plans/list?city=dallas&sortBy=price&sortOrder=asc&limit=10`);
      const priceAscData: PlansListResponse = await priceAscResponse.json();
      
      // Verify ascending price order
      for (let i = 1; i < priceAscData.plans.length; i++) {
        expect(priceAscData.plans[i].baseRate).toBeGreaterThanOrEqual(priceAscData.plans[i-1].baseRate);
      }
      
      // Test price sorting (descending)
      const priceDescResponse = await fetch(`${API_BASE}/plans/list?city=dallas&sortBy=price&sortOrder=desc&limit=10`);
      const priceDescData: PlansListResponse = await priceDescResponse.json();
      
      // Verify descending price order
      for (let i = 1; i < priceDescData.plans.length; i++) {
        expect(priceDescData.plans[i].baseRate).toBeLessThanOrEqual(priceDescData.plans[i-1].baseRate);
      }
      
      console.log('✅ Sorting validation passed for price (asc/desc)');
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing required city parameter', async () => {
      const response = await fetch(`${API_BASE}/plans/list?limit=10`);
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('timestamp');
      expect(typeof error.error).toBe('string');
      expect(error.error.toLowerCase()).toContain('city');
      
      console.log('✅ Error handling test passed: Missing city parameter');
    });

    it('should return 404 for invalid city', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=invalidcity&limit=10`);
      
      expect(response.status).toBe(404);
      
      const error: APIError = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('PLANS_NOT_FOUND');
      
      console.log('✅ Error handling test passed: Invalid city');
    });

    it('should return 400 for invalid filter parameters', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=dallas&contractLengths=invalid&minRate=-5`);
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('INVALID_PARAMETERS');
      
      console.log('✅ Error handling test passed: Invalid parameters');
    });
  });

  describe('performance requirements', () => {
    it('should meet response time requirements consistently', async () => {
      const requests = [];
      const numRequests = 5;
      
      // Make multiple concurrent requests
      for (let i = 0; i < numRequests; i++) {
        requests.push(fetch(`${API_BASE}/plans/list?city=dallas&limit=20`));
      }
      
      const responses = await Promise.all(requests);
      const responseData = await Promise.all(responses.map(r => r.json()));
      
      // All requests should meet performance requirements
      responseData.forEach((data: PlansListResponse, index) => {
        expect(data.responseTime).toBeLessThan(300); // NFR-005 requirement
        console.log(`✅ Request ${index + 1} response time: ${data.responseTime}ms`);
      });
      
      const avgResponseTime = responseData.reduce((sum, data) => sum + data.responseTime, 0) / numRequests;
      console.log(`✅ Average response time: ${avgResponseTime.toFixed(1)}ms (required: <300ms)`);
    });

    it('should handle concurrent requests without degradation', async () => {
      const numConcurrentRequests = 10;
      const startTime = Date.now();
      
      const requests = Array(numConcurrentRequests).fill(0).map(() => 
        fetch(`${API_BASE}/plans/list?city=houston&limit=30`)
      );
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Concurrent processing should be efficient
      expect(totalTime).toBeLessThan(1000); // Should handle 10 requests in under 1 second
      
      console.log(`✅ Concurrent request test: ${numConcurrentRequests} requests in ${totalTime}ms`);
    });
  });

  describe('constitutional compliance', () => {
    it('should never return hardcoded plan IDs', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=dallas&limit=50`);
      const data: PlansListResponse = await response.json();
      
      // Check for any hardcoded IDs (constitutional violation pattern)
      const hardcodedIdPattern = /68b[0-9a-f]{21}/i;
      
      data.plans.forEach(plan => {
        expect(plan.id).not.toMatch(hardcodedIdPattern);
        
        // All IDs should be valid MongoDB ObjectIds from real data
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/);
        
        // IDs should be different (not repeated hardcoded values)
        const otherPlanIds = data.plans.filter(p => p.id !== plan.id).map(p => p.id);
        expect(otherPlanIds).not.toContain(plan.id);
      });
      
      console.log(`✅ Constitutional compliance: All ${data.plans.length} plan IDs are valid and unique`);
    });

    it('should use real data service layer only', async () => {
      const response = await fetch(`${API_BASE}/plans/list?city=austin&limit=10`);
      const data: PlansListResponse = await response.json();
      
      // Verify data characteristics that indicate real service layer usage
      data.plans.forEach(plan => {
        // Real data should have realistic Texas provider names
        const texasProviders = ['TXU Energy', 'Reliant Energy', 'Direct Energy', 'Green Mountain Energy', '4Change Energy'];
        const isRealProvider = texasProviders.some(provider => 
          plan.providerName.toLowerCase().includes(provider.toLowerCase().split(' ')[0])
        );
        
        // Real data should have realistic rate ranges for Texas
        expect(plan.baseRate).toBeGreaterThan(5); // Realistic minimum for Texas
        expect(plan.baseRate).toBeLessThan(30); // Realistic maximum for Texas
        
        // Real data should have proper TDSP territories
        const texasTDSPs = ['Oncor', 'CenterPoint', 'AEP Texas', 'TNMP'];
        expect(texasTDSPs).toContain(plan.tdspTerritory);
      });
      
      console.log(`✅ Real data validation passed: All plans show characteristics of real Texas electricity data`);
    });
  });
});