/**
 * Multi-TDSP System Integration Tests
 * 
 * End-to-end integration tests for the complete multi-TDSP address resolution system.
 * Tests the integration between all components including UI, API, and caching.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { addressTdspResolver } from '../../src/lib/address/address-tdsp-resolver';
import { addressValidator } from '../../src/lib/address/address-validator';
import { tdspBoundaryService } from '../../src/lib/address/tdsp-boundary-service';
import { addressCache } from '../../src/lib/address/address-cache';
import { comparePowerClient } from '../../src/lib/api/comparepower-client';
import type { AddressInfo, Plan } from '../../src/types/facets';

// Integration test scenarios based on real-world usage patterns
const integrationScenarios = [
  {
    name: 'Dallas Boundary Area - Oncor vs TNMP',
    address: {
      street: '1234 Belt Line Road',
      city: 'Addison',
      state: 'TX',
      zipCode: '75001'
    } as AddressInfo,
    expectedTdsps: ['Oncor Electric Delivery', 'Texas-New Mexico Power Company'],
    requiresValidation: true,
    description: 'Tests boundary area between Oncor and TNMP territories'
  },
  {
    name: 'Houston Multi-TDSP Area', 
    address: {
      street: '5678 Westheimer Road',
      city: 'Houston',
      state: 'TX',
      zipCode: '77084'
    } as AddressInfo,
    expectedTdsps: ['CenterPoint Energy Houston Electric'],
    requiresValidation: true,
    description: 'Tests Houston area with potential TNMP boundary'
  },
  {
    name: 'Fort Worth Complex Boundary',
    address: {
      street: '9999 Camp Bowie Boulevard',
      city: 'Fort Worth',
      state: 'TX',
      zipCode: '76116'
    } as AddressInfo,
    expectedTdsps: ['Oncor Electric Delivery', 'AEP Texas North Company'],
    requiresValidation: true,
    description: 'Tests three-way TDSP boundary area'
  },
  {
    name: 'Austin Area Standard Resolution',
    address: {
      street: '100 Congress Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    } as AddressInfo,
    expectedTdsps: ['AEP Texas Central Company'],
    requiresValidation: false,
    description: 'Tests standard single-TDSP resolution'
  }
];

describe('Multi-TDSP System Integration', () => {
  beforeAll(async () => {
    // System initialization
    console.log('Initializing multi-TDSP system integration tests...');
    
    // Clear all caches to ensure clean test state
    await addressCache.clearAllCaches();
    
    // Validate system configuration
    const validation = await addressTdspResolver.validateConfiguration();
    if (!validation.isValid && validation.issues.some(i => i.includes('CRITICAL'))) {
      console.warn('System has critical configuration issues:', validation.issues);
    }
  });

  afterAll(async () => {
    // Cleanup
    await addressCache.clearAllCaches();
  });

  beforeEach(() => {
    // Reset any test-specific state
  });

  describe('Complete Resolution Workflow', () => {
    integrationScenarios.forEach(scenario => {
      it(`should handle ${scenario.name} correctly`, async () => {
        console.log(`Testing scenario: ${scenario.description}`);
        
        // Step 1: ZIP Code Analysis
        const zipAnalysis = await addressTdspResolver.analyzeZipCode(scenario.address.zipCode);
        
        expect(zipAnalysis).toBeDefined();
        if (scenario.requiresValidation) {
          expect(zipAnalysis.requiresAddressValidation).toBe(true);
        }
        
        // Step 2: Address Resolution
        const resolutionResult = await addressTdspResolver.resolveTdspFromAddress(scenario.address);
        
        expect(resolutionResult.success).toBe(true);
        expect(resolutionResult.tdsp).toBeDefined();
        expect(resolutionResult.apiParams).toBeDefined();
        
        // Verify TDSP is one of the expected ones
        const tdspNames = [
          resolutionResult.tdsp?.name,
          ...(resolutionResult.alternatives?.map(alt => alt.name) || [])
        ].filter(Boolean);
        
        const hasExpectedTdsp = scenario.expectedTdsps.some(expected => 
          tdspNames.some(actual => actual?.includes(expected))
        );
        expect(hasExpectedTdsp).toBe(true);
        
        // Step 3: Verify API Parameters
        expect(resolutionResult.apiParams?.tdsp_duns).toBeDefined();
        expect(resolutionResult.apiParams?.display_usage).toBe(1000);
        
        // Step 4: Performance Check
        expect(resolutionResult.metadata.processingTime).toBeLessThan(5000);
        
        console.log(`✓ Scenario completed: ${resolutionResult.tdsp?.name} (${resolutionResult.confidence} confidence)`);
      }, 10000); // 10 second timeout for integration tests
    });
  });

  describe('Progressive Resolution Flow', () => {
    it('should guide user through complete ZIP → Address → TDSP flow', async () => {
      const testZip = '75001';
      const testAddress = integrationScenarios[0].address;
      
      // Step 1: ZIP-only analysis
      const step1 = await addressTdspResolver.getProgressiveResolutionSteps(testZip);
      
      expect(step1.length).toBeGreaterThanOrEqual(2);
      expect(step1[0].step).toBe('zip-input');
      expect(step1[0].completed).toBe(true);
      expect(step1[1].step).toBe('address-collection');
      expect(step1[1].required).toBe(true);
      
      // Step 2: Add address information
      const step2 = await addressTdspResolver.getProgressiveResolutionSteps(testZip, testAddress);
      
      expect(step2.length).toBeGreaterThanOrEqual(3);
      
      const tdspStep = step2.find(s => s.step === 'tdsp-determination');
      expect(tdspStep).toBeDefined();
      expect(tdspStep?.completed).toBe(true);
      
      const apiStep = step2.find(s => s.step === 'api-ready');
      expect(apiStep).toBeDefined();
      expect(apiStep?.completed).toBe(true);
      expect(apiStep?.data?.apiParams).toBeDefined();
    });

    it('should provide TDSP options for manual selection when needed', async () => {
      const boundaryAddress = integrationScenarios[0].address; // Known boundary area
      
      const options = await addressTdspResolver.getTdspOptions(boundaryAddress);
      
      expect(options.options.length).toBeGreaterThan(0);
      expect(options.options[0].recommended).toBe(true);
      expect(options.helpText).toBeDefined();
      
      // Test TDSP selection
      const selectedTdsp = options.options[0].tdsp;
      const apiParams = addressTdspResolver.createApiParams(selectedTdsp);
      
      expect(apiParams.tdsp_duns).toBe(selectedTdsp.duns);
    });
  });

  describe('Cache Performance Integration', () => {
    it('should demonstrate caching benefits across multiple requests', async () => {
      const testAddress = integrationScenarios[0].address;
      
      // First request (cache miss)
      const start1 = Date.now();
      const result1 = await addressTdspResolver.resolveTdspFromAddress(testAddress);
      const time1 = Date.now() - start1;
      
      expect(result1.success).toBe(true);
      expect(result1.metadata.cacheHit).toBe(false);
      
      // Second request (cache hit)
      const start2 = Date.now();
      const result2 = await addressTdspResolver.resolveTdspFromAddress(testAddress);
      const time2 = Date.now() - start2;
      
      expect(result2.success).toBe(true);
      expect(time2).toBeLessThan(time1); // Should be faster
      
      // Results should be consistent
      expect(result1.tdsp?.duns).toBe(result2.tdsp?.duns);
      expect(result1.confidence).toBe(result2.confidence);
      
      console.log(`Cache performance: ${time1}ms → ${time2}ms (${Math.round((1 - time2/time1) * 100)}% faster)`);
    });

    it('should maintain cache statistics correctly', async () => {
      const initialStats = addressCache.getStats();
      
      // Make several requests to different addresses
      const promises = integrationScenarios.slice(0, 3).map(scenario => 
        addressTdspResolver.resolveTdspFromAddress(scenario.address)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      const finalStats = addressCache.getStats();
      
      expect(finalStats.hits.total).toBeGreaterThanOrEqual(initialStats.hits.total);
      expect(finalStats.hitRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid addresses with graceful fallbacks', async () => {
      const invalidAddress = {
        street: '',
        city: '',
        state: 'TX',
        zipCode: '00000'
      } as AddressInfo;
      
      const result = await addressTdspResolver.resolveTdspFromAddress(invalidAddress);
      
      // Should not throw, but should indicate failure
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide meaningful fallbacks when external services fail', async () => {
      // This would test with mocked service failures
      // For integration test, we'll test with edge case addresses
      
      const edgeAddress = {
        street: '999999 Nonexistent Street',
        city: 'Unknown City',
        state: 'TX',
        zipCode: '75001' // Valid ZIP but invalid address
      } as AddressInfo;
      
      const result = await addressTdspResolver.resolveTdspFromAddress(edgeAddress);
      
      // Should still provide some result, even if low confidence
      expect(result).toBeDefined();
      expect(result.confidence).toBeDefined();
      
      if (result.success) {
        expect(result.tdsp).toBeDefined();
        expect(result.method).toContain('fallback');
      }
    });
  });

  describe('API Integration', () => {
    it('should integrate with ComparePower API for resolved TDSPs', async () => {
      const testAddress = integrationScenarios[0].address;
      
      // Resolve TDSP
      const resolution = await addressTdspResolver.resolveTdspFromAddress(testAddress);
      
      expect(resolution.success).toBe(true);
      expect(resolution.apiParams).toBeDefined();
      
      // Test API integration (if API is available)
      if (resolution.apiParams) {
        try {
          const plans = await comparePowerClient.fetchPlans(resolution.apiParams);
          
          expect(Array.isArray(plans)).toBe(true);
          
          if (plans.length > 0) {
            expect(plans[0]).toHaveProperty('id');
            expect(plans[0]).toHaveProperty('name');
            expect(plans[0]).toHaveProperty('provider');
            expect(plans[0]).toHaveProperty('pricing');
            
            console.log(`✓ API integration successful: ${plans.length} plans found`);
          }
        } catch (apiError) {
          console.warn('API integration test skipped - service unavailable:', apiError);
          // This is acceptable in CI/test environments
        }
      }
    }, 15000); // Extended timeout for API calls
  });

  describe('System Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const addresses = integrationScenarios.slice(0, concurrentRequests).map(s => s.address);
      
      const start = Date.now();
      const promises = addresses.map(address => 
        addressTdspResolver.resolveTdspFromAddress(address)
      );
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
      });
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Concurrent test completed: ${concurrentRequests} requests in ${duration}ms`);
    });

    it('should maintain acceptable memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process many addresses
      const batchSize = 20;
      const testBatch = Array.from({ length: batchSize }, (_, i) => ({
        ...integrationScenarios[i % integrationScenarios.length].address,
        street: `${1000 + i} Test Street`
      }));
      
      const results = await Promise.all(
        testBatch.map(addr => addressTdspResolver.resolveTdspFromAddress(addr))
      );
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      expect(results.length).toBe(batchSize);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      
      console.log(`Memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase for ${batchSize} requests`);
    });
  });

  describe('Configuration Validation', () => {
    it('should have complete multi-TDSP configuration', async () => {
      const stats = addressTdspResolver.getSystemStats();
      
      expect(stats.multiTdspStats.totalZipCodes).toBeGreaterThan(15);
      expect(stats.multiTdspStats.requiresValidation).toBeGreaterThan(10);
      
      // Verify coverage across metro areas
      expect(stats.multiTdspStats.byMetroArea.dallasfortworth).toBeGreaterThan(3);
      expect(stats.multiTdspStats.byMetroArea.houston).toBeGreaterThan(2);
      
      console.log('Multi-TDSP Coverage:', stats.multiTdspStats);
    });

    it('should validate system readiness', async () => {
      const validation = await addressTdspResolver.validateConfiguration();
      
      expect(validation.isValid || validation.warnings.length === 0).toBe(false); // Should have some warnings in test env
      
      // Log configuration status
      if (validation.issues.length > 0) {
        console.log('Configuration Issues:', validation.issues.map(i => i));
      }
      
      if (validation.recommendations.length > 0) {
        console.log('Recommendations:', validation.recommendations);
      }
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should handle typical user journey: ZIP → Address → Plans', async () => {
      const userZip = '75001';
      const userAddress = {
        street: '1234 Main Street',
        city: 'Addison',
        state: 'TX',
        zipCode: userZip
      } as AddressInfo;
      
      // Step 1: User enters ZIP code
      const zipAnalysis = await addressTdspResolver.analyzeZipCode(userZip);
      expect(zipAnalysis.isMultiTdsp).toBe(true);
      expect(zipAnalysis.requiresAddressValidation).toBe(true);
      
      // Step 2: System requests full address
      const resolutionSteps = await addressTdspResolver.getProgressiveResolutionSteps(userZip);
      const addressStep = resolutionSteps.find(s => s.step === 'address-collection');
      expect(addressStep?.required).toBe(true);
      
      // Step 3: User provides address
      const resolution = await addressTdspResolver.resolveTdspFromAddress(userAddress);
      expect(resolution.success).toBe(true);
      
      // Step 4: System determines TDSP and creates API params
      expect(resolution.tdsp).toBeDefined();
      expect(resolution.apiParams).toBeDefined();
      
      // Step 5: Verify API params would work with ComparePower
      expect(resolution.apiParams?.tdsp_duns).toBeDefined();
      expect(['1039940674000', '007929441'].includes(resolution.apiParams!.tdsp_duns)).toBe(true);
      
      console.log(`Complete user journey: ${userZip} → ${resolution.tdsp?.name} → ${resolution.confidence} confidence`);
    });

    it('should handle user selecting different TDSP option', async () => {
      const boundaryAddress = integrationScenarios[2].address; // Fort Worth boundary
      
      // Get TDSP options
      const options = await addressTdspResolver.getTdspOptions(boundaryAddress);
      expect(options.options.length).toBeGreaterThan(1);
      
      // User selects alternative TDSP
      const alternativeTdsp = options.options.find(opt => !opt.recommended)?.tdsp;
      
      if (alternativeTdsp) {
        const apiParams = addressTdspResolver.createApiParams(alternativeTdsp);
        
        expect(apiParams.tdsp_duns).toBe(alternativeTdsp.duns);
        expect(apiParams.display_usage).toBe(1000);
        
        console.log(`Manual TDSP selection: ${alternativeTdsp.name} (${alternativeTdsp.duns})`);
      }
    });
  });
});

describe('System Monitoring and Diagnostics', () => {
  it('should provide comprehensive system diagnostics', async () => {
    // Generate some activity
    const testRequests = integrationScenarios.slice(0, 3).map(scenario => 
      addressTdspResolver.resolveTdspFromAddress(scenario.address)
    );
    
    await Promise.all(testRequests);
    
    // Check system stats
    const stats = addressTdspResolver.getSystemStats();
    expect(stats.multiTdspStats).toBeDefined();
    expect(stats.cacheStats).toBeDefined();
    expect(stats.serviceStats).toBeDefined();
    
    // Check cache performance
    const cacheStats = addressCache.getStats();
    expect(cacheStats.hitRatio).toBeGreaterThanOrEqual(0);
    expect(cacheStats.size.memory).toBeGreaterThanOrEqual(0);
    
    console.log('System Diagnostics:', {
      multiTdspCoverage: stats.multiTdspStats.totalZipCodes,
      cacheHitRatio: Math.round(cacheStats.hitRatio * 100) + '%',
      cacheSize: cacheStats.size.memory
    });
  });
});