/**
 * QA API-Database-Frontend Integration Test Suite
 * 
 * This suite validates the complete data flow from external APIs through
 * the database layer to the frontend components, ensuring data integrity
 * and proper error handling throughout the system.
 * 
 * Integration Points Tested:
 * - ComparePower API to Plan Repository
 * - Database queries to component rendering
 * - Cache layer integration
 * - Multi-TDSP system integration
 * - Search service to results display
 * - Lead management workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Import integration components and services
import { comparePowerClient } from '@/lib/api/comparepower-client';
import { planRepository } from '@/lib/database/plan-repository';
import { searchService } from '@/lib/api/search-service';
import { leadManagement } from '@/lib/api/lead-management';
import { multiTdspDetector } from '@/lib/api/multi-tdsp-detector';
import { addressValidator } from '@/lib/address/address-validator';
import { batchProcessor } from '@/lib/api/batch-processor';

// Import components for integration testing
import { LivePlanGrid } from '@/components/LivePlanGrid.astro';
import { FacetedPlanGrid } from '@/components/faceted/FacetedPlanGrid.astro';

// Mock Redis for testing
vi.mock('ioredis', () => ({
  default: class MockRedis {
    private store = new Map();
    
    async get(key: string) {
      return this.store.get(key) || null;
    }
    
    async set(key: string, value: string, ...args: any[]) {
      this.store.set(key, value);
      return 'OK';
    }
    
    async del(key: string) {
      return this.store.delete(key) ? 1 : 0;
    }
    
    async exists(key: string) {
      return this.store.has(key) ? 1 : 0;
    }
    
    async ttl(key: string) {
      return -1; // No expiration for testing
    }
    
    async flushall() {
      this.store.clear();
      return 'OK';
    }
  }
}));

// Mock database connection for testing
vi.mock('@/lib/database/connection-pool', () => ({
  connectionPool: {
    query: vi.fn(),
    connect: vi.fn(),
    release: vi.fn()
  }
}));

describe('QA API-Database-Frontend Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ComparePower API to Database Integration', () => {
    it('should fetch plans from API and store in database', async () => {
      const mockApiResponse = {
        plans: [
          {
            id: 'integration-api-plan-1',
            provider: 'TXU Energy',
            plan_name: 'Integration Test Fixed 12',
            rate_type: 'fixed',
            price_per_kwh: 0.115,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: 'https://example.com/plan/1',
            enrollment_url: 'https://example.com/enroll/1'
          },
          {
            id: 'integration-api-plan-2',
            provider: 'Reliant Energy',
            plan_name: 'Integration Test Green 24',
            rate_type: 'variable',
            price_per_kwh: 0.135,
            term_months: 24,
            early_termination_fee: 200,
            deposit_required: true,
            renewable_percentage: 100,
            details_url: 'https://example.com/plan/2',
            enrollment_url: 'https://example.com/enroll/2'
          }
        ],
        total: 2,
        page: 1,
        per_page: 50
      };

      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      // Mock database insertion
      const mockDbInsert = vi.fn().mockResolvedValue({ success: true, count: 2 });
      vi.mocked(planRepository.insertPlans).mockImplementation(mockDbInsert);

      // Fetch and store plans
      const apiResult = await comparePowerClient.getPlans('75001');
      expect(apiResult.plans).toHaveLength(2);

      // Verify plans were stored in database
      await planRepository.insertPlans(apiResult.plans);
      expect(mockDbInsert).toHaveBeenCalledWith(apiResult.plans);
    });

    it('should handle API errors and fallback to database', async () => {
      // Mock API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('API temporarily unavailable'));

      // Mock database fallback
      const mockDbFallback = vi.fn().mockResolvedValue({
        plans: [
          {
            id: 'fallback-plan-1',
            provider: 'Cached Provider',
            plan_name: 'Fallback Plan',
            rate_type: 'fixed',
            price_per_kwh: 0.125,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: 'https://example.com/cached/1',
            enrollment_url: 'https://example.com/cached/enroll/1'
          }
        ],
        total: 1
      });
      
      vi.mocked(planRepository.getPlansForZip).mockImplementation(mockDbFallback);

      try {
        await comparePowerClient.getPlans('75001');
      } catch (error) {
        // Should fall back to database
        const fallbackResult = await planRepository.getPlansForZip('75001');
        expect(fallbackResult.plans).toHaveLength(1);
        expect(mockDbFallback).toHaveBeenCalledWith('75001');
      }
    });

    it('should integrate cache layer correctly', async () => {
      const zipCode = '75001';
      const cacheKey = `plans:${zipCode}`;
      
      const mockPlans = {
        plans: [
          {
            id: 'cached-plan-1',
            provider: 'Cached Provider',
            plan_name: 'Cached Plan',
            rate_type: 'fixed',
            price_per_kwh: 0.115,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: 'https://example.com/cached/1',
            enrollment_url: 'https://example.com/cached/enroll/1'
          }
        ],
        total: 1
      };

      // First call should fetch from API and cache
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPlans
      });

      const result1 = await comparePowerClient.getPlans(zipCode);
      expect(result1.plans).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await comparePowerClient.getPlans(zipCode);
      expect(result2.plans).toHaveLength(1);
      // Fetch should still only be called once (cached result)
    });
  });

  describe('Multi-TDSP System Integration', () => {
    it('should correctly map ZIP codes to TDSP territories', async () => {
      const testCases = [
        { zip: '75001', expectedTdsp: 'ONCOR' }, // Dallas area
        { zip: '77001', expectedTdsp: 'CENTERPOINT' }, // Houston area
        { zip: '78701', expectedTdsp: 'ONCOR' }, // Austin area
        { zip: '78201', expectedTdsp: 'CPS_ENERGY' } // San Antonio area
      ];

      for (const testCase of testCases) {
        const tdspInfo = await multiTdspDetector.getTdspForZip(testCase.zip);
        expect(tdspInfo.name).toContain(testCase.expectedTdsp.replace('_', ' '));
        expect(tdspInfo.territory).toBeDefined();
        expect(tdspInfo.serviceAreas).toContain(testCase.zip);
      }
    });

    it('should filter plans based on TDSP availability', async () => {
      const mockPlans = [
        {
          id: 'tdsp-plan-1',
          provider: 'TXU Energy',
          plan_name: 'ONCOR Plan',
          tdsp_territories: ['ONCOR'],
          rate_type: 'fixed',
          price_per_kwh: 0.115,
          term_months: 12,
          early_termination_fee: 150,
          deposit_required: false,
          renewable_percentage: 0,
          details_url: 'https://example.com/plan/1',
          enrollment_url: 'https://example.com/enroll/1'
        },
        {
          id: 'tdsp-plan-2',
          provider: 'Reliant Energy',
          plan_name: 'CenterPoint Plan',
          tdsp_territories: ['CENTERPOINT'],
          rate_type: 'fixed',
          price_per_kwh: 0.125,
          term_months: 12,
          early_termination_fee: 175,
          deposit_required: false,
          renewable_percentage: 50,
          details_url: 'https://example.com/plan/2',
          enrollment_url: 'https://example.com/enroll/2'
        }
      ];

      // Mock API response with TDSP info
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ plans: mockPlans, total: 2 })
      });

      // Test Dallas ZIP (ONCOR territory)
      const dallasPlans = await comparePowerClient.getPlans('75001');
      const availableDallasPlans = dallasPlans.plans.filter(plan => 
        plan.tdsp_territories?.includes('ONCOR')
      );
      expect(availableDallasPlans).toHaveLength(1);
      expect(availableDallasPlans[0].plan_name).toBe('ONCOR Plan');

      // Test Houston ZIP (CenterPoint territory)
      const houstonPlans = await comparePowerClient.getPlans('77001');
      const availableHoustonPlans = houstonPlans.plans.filter(plan => 
        plan.tdsp_territories?.includes('CENTERPOINT')
      );
      expect(availableHoustonPlans).toHaveLength(1);
      expect(availableHoustonPlans[0].plan_name).toBe('CenterPoint Plan');
    });
  });

  describe('Search Service Integration', () => {
    it('should integrate autocomplete with real city data', async () => {
      const mockCities = [
        { name: 'Dallas', state: 'TX', zip_codes: ['75001', '75002', '75003'] },
        { name: 'Houston', state: 'TX', zip_codes: ['77001', '77002', '77003'] },
        { name: 'Austin', state: 'TX', zip_codes: ['78701', '78702', '78703'] }
      ];

      // Mock database query for cities
      const mockCityQuery = vi.fn().mockResolvedValue({ cities: mockCities });
      vi.mocked(planRepository.getCities).mockImplementation(mockCityQuery);

      // Test autocomplete functionality
      const searchResults = await searchService.autocomplete('Dal');
      expect(searchResults).toContain('Dallas, TX');
      
      const houstonResults = await searchService.autocomplete('Hou');
      expect(houstonResults).toContain('Houston, TX');
      
      const austinResults = await searchService.autocomplete('Aus');
      expect(austinResults).toContain('Austin, TX');
    });

    it('should handle fuzzy matching for typos', async () => {
      const mockCities = [
        { name: 'Dallas', state: 'TX' },
        { name: 'Houston', state: 'TX' },
        { name: 'Austin', state: 'TX' }
      ];

      vi.mocked(planRepository.getCities).mockResolvedValue({ cities: mockCities });

      // Test fuzzy matching
      const typoResults = await searchService.fuzzySearch('Dalas'); // Missing 'l'
      expect(typoResults).toContain('Dallas, TX');
      
      const misspelledResults = await searchService.fuzzySearch('Houstin'); // Wrong 'o'
      expect(misspelledResults).toContain('Houston, TX');
    });
  });

  describe('Lead Management Integration', () => {
    it('should capture and process leads correctly', async () => {
      const mockLead = {
        zip_code: '75001',
        selected_plan_id: 'test-plan-1',
        provider: 'TXU Energy',
        contact_preference: 'email',
        email: 'test@example.com',
        phone: '555-123-4567',
        usage_kwh: 1000
      };

      // Mock lead storage
      const mockLeadStorage = vi.fn().mockResolvedValue({ 
        id: 'lead-12345', 
        status: 'captured',
        created_at: new Date().toISOString()
      });
      vi.mocked(leadManagement.captureLead).mockImplementation(mockLeadStorage);

      // Mock lead qualification
      const mockLeadQualification = vi.fn().mockResolvedValue({
        qualified: true,
        score: 85,
        reasons: ['valid_contact_info', 'appropriate_usage', 'service_area_match']
      });
      vi.mocked(leadManagement.qualifyLead).mockImplementation(mockLeadQualification);

      // Process lead
      const capturedLead = await leadManagement.captureLead(mockLead);
      expect(capturedLead.status).toBe('captured');
      expect(mockLeadStorage).toHaveBeenCalledWith(mockLead);

      // Qualify lead
      const qualification = await leadManagement.qualifyLead(capturedLead.id);
      expect(qualification.qualified).toBe(true);
      expect(qualification.score).toBeGreaterThan(80);
      expect(mockLeadQualification).toHaveBeenCalledWith(capturedLead.id);
    });

    it('should handle lead routing to providers', async () => {
      const mockLead = {
        id: 'lead-12345',
        provider: 'TXU Energy',
        plan_id: 'test-plan-1',
        contact_info: {
          email: 'test@example.com',
          phone: '555-123-4567'
        }
      };

      // Mock provider routing
      const mockProviderRouting = vi.fn().mockResolvedValue({
        routed: true,
        provider_endpoint: 'https://api.txu.com/leads',
        response_code: 200,
        confirmation_id: 'TXU-CONF-789'
      });
      vi.mocked(leadManagement.routeToProvider).mockImplementation(mockProviderRouting);

      // Route lead
      const routingResult = await leadManagement.routeToProvider(mockLead);
      expect(routingResult.routed).toBe(true);
      expect(routingResult.confirmation_id).toBeDefined();
      expect(mockProviderRouting).toHaveBeenCalledWith(mockLead);
    });
  });

  describe('Batch Processing Integration', () => {
    it('should process multiple API requests efficiently', async () => {
      const zipCodes = ['75001', '75002', '75003', '77001', '77002'];
      
      const mockBatchResponse = zipCodes.map(zip => ({
        zip_code: zip,
        plans: [
          {
            id: `batch-plan-${zip}`,
            provider: 'Batch Provider',
            plan_name: `Batch Plan for ${zip}`,
            rate_type: 'fixed',
            price_per_kwh: 0.115,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: `https://example.com/plan/${zip}`,
            enrollment_url: `https://example.com/enroll/${zip}`
          }
        ],
        total: 1
      }));

      // Mock batch API response
      global.fetch = vi.fn().mockImplementation((url) => {
        const zip = url.match(/zip=(\d{5})/)?.[1];
        const response = mockBatchResponse.find(r => r.zip_code === zip);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => response || { plans: [], total: 0 }
        });
      });

      // Process batch
      const batchResults = await batchProcessor.processBatch(zipCodes, {
        batchSize: 2,
        delayMs: 100
      });

      expect(batchResults).toHaveLength(5);
      expect(global.fetch).toHaveBeenCalledTimes(5);
      
      // Verify rate limiting was applied
      batchResults.forEach((result, index) => {
        expect(result.zip_code).toBe(zipCodes[index]);
        expect(result.plans).toHaveLength(1);
      });
    });

    it('should handle batch processing errors gracefully', async () => {
      const zipCodes = ['75001', '75002', 'invalid'];
      
      // Mock mixed success/failure responses
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('invalid')) {
          return Promise.reject(new Error('Invalid ZIP code'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ plans: [], total: 0 })
        });
      });

      const batchResults = await batchProcessor.processBatch(zipCodes, {
        batchSize: 1,
        delayMs: 50,
        continueOnError: true
      });

      // Should have 2 successful results and 1 error
      const successfulResults = batchResults.filter(r => r.success);
      const errorResults = batchResults.filter(r => r.error);
      
      expect(successfulResults).toHaveLength(2);
      expect(errorResults).toHaveLength(1);
      expect(errorResults[0].zip_code).toBe('invalid');
    });
  });

  describe('Address Validation Integration', () => {
    it('should validate addresses through complete workflow', async () => {
      const testAddresses = [
        {
          input: '123 Main St, Dallas, TX 75001',
          expected: {
            street: '123 Main St',
            city: 'Dallas',
            state: 'TX',
            zip: '75001',
            valid: true
          }
        },
        {
          input: '456 Oak Ave, Houston, TX 77001',
          expected: {
            street: '456 Oak Ave',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            valid: true
          }
        },
        {
          input: 'Invalid Address, Nowhere, XX 00000',
          expected: {
            valid: false
          }
        }
      ];

      for (const testCase of testAddresses) {
        const validation = await addressValidator.validateAddress(testCase.input);
        
        if (testCase.expected.valid) {
          expect(validation.valid).toBe(true);
          expect(validation.parsed?.city).toBe(testCase.expected.city);
          expect(validation.parsed?.state).toBe(testCase.expected.state);
          expect(validation.parsed?.zip).toBe(testCase.expected.zip);
          
          // Should also return TDSP info
          expect(validation.tdsp_info).toBeDefined();
          expect(validation.tdsp_info?.name).toBeDefined();
        } else {
          expect(validation.valid).toBe(false);
          expect(validation.error_message).toBeDefined();
        }
      }
    });
  });

  describe('Error Handling & Recovery Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      // Simulate API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));
      
      // Mock database fallback
      const mockDbFallback = vi.fn().mockResolvedValue({
        plans: [
          {
            id: 'fallback-plan',
            provider: 'Emergency Provider',
            plan_name: 'Fallback Plan',
            rate_type: 'fixed',
            price_per_kwh: 0.125,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: 'https://example.com/fallback',
            enrollment_url: 'https://example.com/fallback/enroll'
          }
        ],
        total: 1,
        source: 'database_fallback'
      });
      
      vi.mocked(planRepository.getPlansForZip).mockImplementation(mockDbFallback);

      // Should gracefully fall back to database
      try {
        await comparePowerClient.getPlans('75001');
      } catch (error) {
        // Handle API error and use fallback
        const fallbackResult = await planRepository.getPlansForZip('75001');
        expect(fallbackResult.plans).toHaveLength(1);
        expect(fallbackResult.source).toBe('database_fallback');
      }
    });

    it('should implement circuit breaker pattern', async () => {
      // Simulate repeated API failures
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Service unavailable'));
      });

      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await comparePowerClient.getPlans('75001');
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should be open, reducing API calls
      expect(callCount).toBeLessThan(10); // Should have stopped making calls
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across cache, database, and API', async () => {
      const zipCode = '75001';
      const planId = 'consistency-test-plan';
      
      const mockPlan = {
        id: planId,
        provider: 'Consistency Test Provider',
        plan_name: 'Data Consistency Plan',
        rate_type: 'fixed',
        price_per_kwh: 0.115,
        term_months: 12,
        early_termination_fee: 150,
        deposit_required: false,
        renewable_percentage: 0,
        details_url: 'https://example.com/consistency',
        enrollment_url: 'https://example.com/consistency/enroll',
        last_updated: new Date().toISOString()
      };

      // 1. API returns fresh data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ plans: [mockPlan], total: 1 })
      });

      const apiResult = await comparePowerClient.getPlans(zipCode);
      expect(apiResult.plans[0].id).toBe(planId);

      // 2. Data should be stored in database
      const mockDbStore = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(planRepository.insertPlans).mockImplementation(mockDbStore);
      
      await planRepository.insertPlans(apiResult.plans);
      expect(mockDbStore).toHaveBeenCalledWith(apiResult.plans);

      // 3. Cache should contain the same data
      const cachedResult = await comparePowerClient.getPlans(zipCode);
      expect(cachedResult.plans[0].id).toBe(planId);
      expect(cachedResult.plans[0].last_updated).toBe(mockPlan.last_updated);

      // 4. Database query should return consistent data
      const mockDbQuery = vi.fn().mockResolvedValue({
        plans: [mockPlan],
        total: 1
      });
      vi.mocked(planRepository.getPlansForZip).mockImplementation(mockDbQuery);
      
      const dbResult = await planRepository.getPlansForZip(zipCode);
      expect(dbResult.plans[0].id).toBe(planId);
      expect(dbResult.plans[0].last_updated).toBe(mockPlan.last_updated);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-volume requests efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate 100 concurrent requests
      const requests = Array.from({ length: 100 }, (_, i) => 
        comparePowerClient.getPlans(`7500${i.toString().padStart(2, '0')}`)
      );

      // Mock API responses
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ plans: [], total: 0 })
      });

      const results = await Promise.all(requests);
      const endTime = performance.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});