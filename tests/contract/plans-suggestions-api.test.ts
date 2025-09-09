// T013: Contract test GET /api/plans/suggestions
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Tests intelligent filter suggestions for zero results (FR-011)

import { describe, it, expect, beforeAll } from 'vitest';
import type { PlansSuggestionsResponse, APIError, FilterSuggestion } from '../../src/lib/types/api-types';
import type { ElectricityPlan } from '../../src/lib/types/electricity-plan';

const API_BASE = 'http://localhost:4324/api';

describe('GET /api/plans/suggestions - Contract Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: Contract tests should FAIL until API implementation is complete');
  });

  describe('successful responses', () => {
    it('should return suggestions for restrictive filters', async () => {
      // Create very restrictive filters that should yield zero results
      const restrictiveFilters = {
        contractLengths: [6],
        rateTypes: ['fixed'],
        minRate: 5.0,
        maxRate: 8.0,
        minGreenEnergy: 100,
        excludeEarlyTerminationFee: true
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(restrictiveFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=dallas`);
      
      expect(response.status).toBe(200);
      
      const data: PlansSuggestionsResponse = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('alternativeFilters');
      expect(data).toHaveProperty('nearbyOptions');
      
      // Suggestions should be provided
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
      
      console.log(`✅ Suggestions response valid: ${data.suggestions.length} suggestions provided`);
    });

    it('should provide structured filter suggestions', async () => {
      const restrictiveFilters = {
        contractLengths: [1], // Very uncommon
        maxRate: 6.0, // Very low
        minGreenEnergy: 90 // Very high
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(restrictiveFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=houston`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // Validate each suggestion
      data.suggestions.forEach((suggestion: FilterSuggestion) => {
        expect(typeof suggestion.filterCategory).toBe('string');
        expect(suggestion.filterCategory.length).toBeGreaterThan(0);
        
        expect(typeof suggestion.suggestion).toBe('string');
        expect(suggestion.suggestion.length).toBeGreaterThan(0);
        
        expect(typeof suggestion.expectedResults).toBe('number');
        expect(suggestion.expectedResults).toBeGreaterThan(0);
        
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
        
        // Action should be provided when relevant
        if (suggestion.action) {
          expect(['increase', 'decrease', 'remove', 'add']).toContain(suggestion.action);
        }
      });
      
      console.log('✅ Suggestion structure validation passed');
    });

    it('should prioritize suggestions by impact', async () => {
      const zeroResultFilters = {
        maxRate: 5.0, // Extremely low
        contractLengths: [1, 6], // Uncommon combinations
        minProviderRating: 5.0 // Perfect rating requirement
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(zeroResultFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=austin`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // Should have at least one high priority suggestion
      const highPrioritySuggestions = data.suggestions.filter(s => s.priority === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);
      
      // High priority suggestions should have higher expected results
      const highPriorityResults = highPrioritySuggestions.map(s => s.expectedResults);
      const otherResults = data.suggestions.filter(s => s.priority !== 'high').map(s => s.expectedResults);
      
      if (otherResults.length > 0) {
        const avgHighPriority = highPriorityResults.reduce((sum, val) => sum + val, 0) / highPriorityResults.length;
        const avgOther = otherResults.reduce((sum, val) => sum + val, 0) / otherResults.length;
        
        expect(avgHighPriority).toBeGreaterThanOrEqual(avgOther);
      }
      
      console.log(`✅ Priority validation: ${highPrioritySuggestions.length} high priority suggestions`);
    });

    it('should provide alternative filter configurations', async () => {
      const problematicFilters = {
        contractLengths: [6], // Uncommon
        rateTypes: ['variable'], // Less common
        maxMonthlyFee: 5.0, // Very low
        selectedProviders: ['NonexistentProvider'] // Invalid provider
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(problematicFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=dallas`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // Alternative filters should be provided
      expect(typeof data.alternativeFilters).toBe('object');
      expect(data.alternativeFilters).not.toBeNull();
      
      // Alternative filters should be different from original
      const altFilters = data.alternativeFilters;
      if (altFilters.contractLengths) {
        expect(altFilters.contractLengths).not.toEqual([6]);
      }
      
      if (altFilters.selectedProviders) {
        expect(altFilters.selectedProviders).not.toContain('NonexistentProvider');
      }
      
      console.log('✅ Alternative filters provided and validated');
    });

    it('should provide nearby matching plans when possible', async () => {
      const nearMissFilters = {
        maxRate: 10.0,
        contractLengths: [12],
        minGreenEnergy: 95 // Very high but achievable
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(nearMissFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=houston`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // Nearby options should be provided (up to 5)
      expect(Array.isArray(data.nearbyOptions)).toBe(true);
      expect(data.nearbyOptions.length).toBeLessThanOrEqual(5);
      
      // Each nearby option should be a valid plan
      data.nearbyOptions.forEach((plan: ElectricityPlan) => {
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/); // Valid MongoDB ObjectId
        expect(typeof plan.planName).toBe('string');
        expect(typeof plan.providerName).toBe('string');
        expect(typeof plan.baseRate).toBe('number');
        
        // Plans should be reasonably close to original criteria
        expect(plan.baseRate).toBeLessThan(15.0); // Not too far from maxRate: 10.0
        if (plan.contractLength) {
          expect([6, 12, 24]).toContain(plan.contractLength); // Close to 12 months
        }
      });
      
      console.log(`✅ Nearby options validation: ${data.nearbyOptions.length} nearby plans provided`);
    });

    it('should handle different filter categories appropriately', async () => {
      // Test price-focused restrictions
      const priceFilters = {
        maxRate: 7.0,
        maxMonthlyFee: 8.0
      };
      
      const priceParam = encodeURIComponent(JSON.stringify(priceFilters));
      const priceResponse = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${priceParam}&city=dallas`);
      const priceData: PlansSuggestionsResponse = await priceResponse.json();
      
      // Should suggest price-related adjustments
      const priceSuggestions = priceData.suggestions.filter(s => 
        s.filterCategory.includes('Rate') || 
        s.filterCategory.includes('Fee') ||
        s.filterCategory.includes('price')
      );
      expect(priceSuggestions.length).toBeGreaterThan(0);
      
      // Test feature-focused restrictions
      const featureFilters = {
        requiredFeatures: ['NonexistentFeature', 'AnotherRareFeature'],
        minGreenEnergy: 100
      };
      
      const featureParam = encodeURIComponent(JSON.stringify(featureFilters));
      const featureResponse = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${featureParam}&city=dallas`);
      const featureData: PlansSuggestionsResponse = await featureResponse.json();
      
      // Should suggest feature-related adjustments
      const featureSuggestions = featureData.suggestions.filter(s => 
        s.filterCategory.includes('Feature') || 
        s.filterCategory.includes('Green') ||
        s.filterCategory.includes('feature')
      );
      expect(featureSuggestions.length).toBeGreaterThan(0);
      
      console.log('✅ Category-specific suggestions validation passed');
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing required parameters', async () => {
      // Missing currentFilters
      const response1 = await fetch(`${API_BASE}/plans/suggestions?city=dallas`);
      expect(response1.status).toBe(400);
      
      const error1: APIError = await response1.json();
      expect(error1.code).toBe('MISSING_FILTERS');
      
      // Missing city
      const response2 = await fetch(`${API_BASE}/plans/suggestions?currentFilters={}`);
      expect(response2.status).toBe(400);
      
      const error2: APIError = await response2.json();
      expect(error2.code).toBe('MISSING_CITY');
      
      console.log('✅ Missing parameter handling passed');
    });

    it('should return 400 for invalid filter JSON', async () => {
      const invalidJson = 'invalid-json-string';
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${invalidJson}&city=dallas`);
      
      expect(response.status).toBe(400);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('INVALID_FILTER_JSON');
      expect(error.error.toLowerCase()).toContain('json');
      
      console.log('✅ Invalid JSON handling passed');
    });

    it('should return 404 for invalid city', async () => {
      const validFilters = JSON.stringify({ maxRate: 10.0 });
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${encodeURIComponent(validFilters)}&city=invalidcity`);
      
      expect(response.status).toBe(404);
      
      const error: APIError = await response.json();
      expect(error.code).toBe('CITY_NOT_FOUND');
      
      console.log('✅ Invalid city handling passed');
    });

    it('should handle empty or minimal filter sets gracefully', async () => {
      // Empty filters
      const emptyFilters = JSON.stringify({});
      const response1 = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${encodeURIComponent(emptyFilters)}&city=dallas`);
      
      // Should not error, but may return minimal suggestions
      expect(response1.status).toBe(200);
      
      // Minimal filters (should return suggestions)
      const minimalFilters = JSON.stringify({ city: 'dallas' });
      const response2 = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${encodeURIComponent(minimalFilters)}&city=dallas`);
      
      expect(response2.status).toBe(200);
      
      console.log('✅ Empty/minimal filter handling passed');
    });
  });

  describe('performance requirements', () => {
    it('should generate suggestions quickly', async () => {
      const complexFilters = {
        contractLengths: [1, 6],
        rateTypes: ['fixed', 'variable'],
        maxRate: 8.0,
        minGreenEnergy: 75,
        requiredFeatures: ['Feature1', 'Feature2'],
        selectedProviders: ['Provider1', 'Provider2'],
        excludeEarlyTerminationFee: true
      };
      
      const startTime = Date.now();
      const filterParam = encodeURIComponent(JSON.stringify(complexFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=austin`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      
      // Suggestions generation should be fast
      expect(responseTime).toBeLessThan(500); // Should be faster than plan comparison
      
      console.log(`✅ Suggestions performance: ${responseTime}ms`);
    });

    it('should handle concurrent suggestion requests', async () => {
      const testFilters = [
        { maxRate: 8.0, contractLengths: [12] },
        { minGreenEnergy: 80, rateTypes: ['fixed'] },
        { maxMonthlyFee: 10.0, excludeEarlyTerminationFee: true },
        { selectedProviders: ['Reliant'], minProviderRating: 4.0 }
      ];
      
      const requests = testFilters.map(filters => {
        const filterParam = encodeURIComponent(JSON.stringify(filters));
        return fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=houston`);
      });
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      console.log(`✅ Concurrent suggestions test: ${testFilters.length} requests completed`);
    });
  });

  describe('suggestion quality and intelligence', () => {
    it('should provide actionable suggestions with realistic expectations', async () => {
      const unrealisticFilters = {
        maxRate: 1.0, // Impossibly low
        minProviderRating: 5.0, // Perfect rating
        minGreenEnergy: 100, // 100% renewable
        contractLengths: [1] // Very uncommon
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(unrealisticFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=dallas`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // Suggestions should be realistic and actionable
      data.suggestions.forEach(suggestion => {
        expect(suggestion.expectedResults).toBeGreaterThan(0);
        expect(suggestion.expectedResults).toBeLessThan(1000); // Reasonable upper bound
        
        // Suggestion text should be helpful and specific
        expect(suggestion.suggestion.length).toBeGreaterThan(10); // Not just "increase"
        expect(suggestion.suggestion).toMatch(/\d/); // Should include specific numbers
      });
      
      // High priority suggestions should address the most restrictive filters
      const highPriority = data.suggestions.filter(s => s.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
      
      // Should suggest increasing the impossibly low rate
      const rateSuggestions = data.suggestions.filter(s => 
        s.suggestion.toLowerCase().includes('rate') || 
        s.suggestion.toLowerCase().includes('price')
      );
      expect(rateSuggestions.length).toBeGreaterThan(0);
      
      console.log(`✅ Suggestion quality validation: ${data.suggestions.length} actionable suggestions`);
    });

    it('should adapt suggestions based on city context', async () => {
      const sameFilters = {
        maxRate: 9.0,
        contractLengths: [12],
        minGreenEnergy: 50
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(sameFilters));
      
      // Test in different Texas cities
      const dallasResponse = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=dallas`);
      const houstonResponse = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=houston`);
      
      const dallasData: PlansSuggestionsResponse = await dallasResponse.json();
      const houstonData: PlansSuggestionsResponse = await houstonResponse.json();
      
      // Both should succeed
      expect(dallasResponse.status).toBe(200);
      expect(houstonResponse.status).toBe(200);
      
      // Suggestions may vary based on local plan availability
      // At minimum, both should provide valid suggestions
      expect(dallasData.suggestions.length).toBeGreaterThan(0);
      expect(houstonData.suggestions.length).toBeGreaterThan(0);
      
      // Expected results may differ between cities
      const dallasResults = dallasData.suggestions.map(s => s.expectedResults);
      const houstonResults = houstonData.suggestions.map(s => s.expectedResults);
      
      // Both should have realistic expectations for their respective markets
      dallasResults.forEach(result => {
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(200); // Reasonable for Dallas market
      });
      
      houstonResults.forEach(result => {
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(200); // Reasonable for Houston market
      });
      
      console.log(`✅ City-specific suggestions: Dallas ${dallasData.suggestions.length}, Houston ${houstonData.suggestions.length}`);
    });
  });

  describe('constitutional compliance', () => {
    it('should provide suggestions without exposing hardcoded data', async () => {
      const testFilters = {
        maxRate: 5.0,
        contractLengths: [6],
        minGreenEnergy: 95
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(testFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=austin`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // All nearby options should have valid, non-hardcoded IDs
      data.nearbyOptions.forEach(plan => {
        expect(plan.id).toMatch(/^[0-9a-fA-F]{24}$/);
        expect(plan.id).not.toMatch(/68b[0-9a-f]{21}/i); // No hardcoded IDs
      });
      
      // Suggestions should be based on real data patterns
      data.suggestions.forEach(suggestion => {
        expect(suggestion.expectedResults).toBeGreaterThan(0); // Based on actual plan counts
      });
      
      console.log('✅ Constitutional compliance: No hardcoded data in suggestions');
    });

    it('should only suggest realistic Texas electricity market options', async () => {
      const testFilters = {
        maxRate: 8.0,
        rateTypes: ['fixed'],
        contractLengths: [12, 24]
      };
      
      const filterParam = encodeURIComponent(JSON.stringify(testFilters));
      const response = await fetch(`${API_BASE}/plans/suggestions?currentFilters=${filterParam}&city=dallas`);
      const data: PlansSuggestionsResponse = await response.json();
      
      // All suggestions should be realistic for Texas market
      data.suggestions.forEach(suggestion => {
        // Rate suggestions should be in Texas range
        if (suggestion.suggestion.includes('rate') || suggestion.suggestion.includes('$')) {
          const rateMatch = suggestion.suggestion.match(/\$?(\d+\.?\d*)/);
          if (rateMatch) {
            const suggestedRate = parseFloat(rateMatch[1]);
            expect(suggestedRate).toBeGreaterThan(5); // Minimum realistic Texas rate
            expect(suggestedRate).toBeLessThan(25); // Maximum realistic Texas rate
          }
        }
        
        // Contract length suggestions should be standard Texas terms
        if (suggestion.suggestion.includes('month')) {
          const monthMatch = suggestion.suggestion.match(/(\d+)[\s-]?month/);
          if (monthMatch) {
            const suggestedMonths = parseInt(monthMatch[1]);
            expect([1, 6, 12, 24, 36]).toContain(suggestedMonths);
          }
        }
      });
      
      // Nearby options should be real Texas plans
      data.nearbyOptions.forEach(plan => {
        expect(plan.baseRate).toBeGreaterThan(5);
        expect(plan.baseRate).toBeLessThan(25);
        expect([1, 6, 12, 24, 36]).toContain(plan.contractLength);
        
        // Should have valid Texas TDSP
        const texasTDSPs = ['Oncor', 'CenterPoint', 'AEP Texas', 'TNMP'];
        expect(texasTDSPs).toContain(plan.tdspTerritory);
      });
      
      console.log('✅ Texas market compliance: All suggestions realistic for Texas electricity market');
    });
  });
});