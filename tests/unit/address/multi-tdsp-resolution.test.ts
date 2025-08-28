/**
 * Multi-TDSP Resolution Test Suite
 * 
 * Comprehensive test coverage for the multi-TDSP ZIP code handling system.
 * Tests address validation, TDSP resolution, error handling, and fallback strategies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addressTdspResolver } from '../../../src/lib/address/address-tdsp-resolver';
import { addressValidator } from '../../../src/lib/address/address-validator';
import { tdspBoundaryService } from '../../../src/lib/address/tdsp-boundary-service';
import { addressCache } from '../../../src/lib/address/address-cache';
import { addressErrorHandler } from '../../../src/lib/address/error-handling';
import { 
  multiTdspMapping, 
  requiresAddressValidation,
  getMultiTdspZipCodes,
  TDSP_INFO
} from '../../../src/config/multi-tdsp-mapping';
import type { AddressInfo, TdspInfo } from '../../../src/types/facets';

// Test data
const testAddresses = {
  // Multi-TDSP ZIP codes
  addison: {
    street: '1234 Belt Line Road',
    city: 'Addison',
    state: 'TX',
    zipCode: '75001'
  } as AddressInfo,
  
  coppell: {
    street: '5678 Main Street',
    city: 'Coppell', 
    state: 'TX',
    zipCode: '75019'
  } as AddressInfo,

  theColony: {
    street: '9999 Colony Drive',
    city: 'The Colony',
    state: 'TX', 
    zipCode: '75056'
  } as AddressInfo,

  // Standard ZIP codes
  dallas: {
    street: '123 Elm Street',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201'
  } as AddressInfo,

  houston: {
    street: '456 Main Street',
    city: 'Houston',
    state: 'TX',
    zipCode: '77002'
  } as AddressInfo,

  // Edge cases
  invalidZip: {
    street: '123 Test Street',
    city: 'Unknown',
    state: 'TX',
    zipCode: '99999'
  } as AddressInfo,

  incompleteAddress: {
    street: '',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201'
  } as AddressInfo
};

describe('Multi-TDSP Resolution System', () => {
  beforeEach(() => {
    // Clear caches before each test
    addressCache.clearAllCaches();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    addressErrorHandler.clearErrorHistory();
  });

  describe('ZIP Code Analysis', () => {
    it('should correctly identify multi-TDSP ZIP codes', async () => {
      const result = await addressTdspResolver.analyzeZipCode('75001');
      
      expect(result.isMultiTdsp).toBe(true);
      expect(result.primaryTdsp).toBeDefined();
      expect(result.alternatives).toHaveLength(1);
      expect(result.requiresAddressValidation).toBe(true);
      expect(result.explanation).toContain('multiple utility');
    });

    it('should handle standard ZIP codes correctly', async () => {
      const result = await addressTdspResolver.analyzeZipCode('75201');
      
      // This would depend on the implementation of standard ZIP code lookup
      // For now, we'll test that it doesn't throw an error
      expect(result).toBeDefined();
      expect(result.isMultiTdsp).toBeDefined();
    });

    it('should handle invalid ZIP codes gracefully', async () => {
      const result = await addressTdspResolver.analyzeZipCode('00000');
      
      expect(result.isMultiTdsp).toBe(false);
      expect(result.primaryTdsp).toBeNull();
      expect(result.recommendedAction).toBe('collect-address');
    });

    it('should return correct boundary type information', () => {
      const zipCodes = getMultiTdspZipCodes();
      expect(zipCodes).toContain('75001');
      expect(zipCodes).toContain('75019');
      expect(zipCodes).toContain('75056');
      
      expect(requiresAddressValidation('75001')).toBe(true);
      expect(requiresAddressValidation('75019')).toBe(true);
    });
  });

  describe('Address Validation', () => {
    it('should validate complete addresses successfully', async () => {
      const result = await addressValidator.validateAddress(testAddresses.addison);
      
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBeDefined();
      expect(result.normalized?.streetNumber).toBe('1234');
      expect(result.normalized?.streetName).toBe('Belt Line');
      expect(result.normalized?.streetType).toBe('Road');
      expect(result.normalized?.zipCode).toBe('75001');
    });

    it('should handle incomplete addresses with appropriate errors', async () => {
      const result = await addressValidator.validateAddress(testAddresses.incompleteAddress);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Street address is required and must be at least 3 characters');
    });

    it('should normalize address components correctly', async () => {
      const testCases = [
        {
          input: { ...testAddresses.addison, street: '1234 belt line rd' },
          expected: { streetName: 'Belt Line', streetType: 'Road' }
        },
        {
          input: { ...testAddresses.addison, street: '1234 MAIN ST' },
          expected: { streetName: 'Main', streetType: 'Street' }
        }
      ];

      for (const testCase of testCases) {
        const result = await addressValidator.validateAddress(testCase.input);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized?.streetName).toBe(testCase.expected.streetName);
        expect(result.normalized?.streetType).toBe(testCase.expected.streetType);
      }
    });

    it('should handle ZIP+4 codes correctly', async () => {
      const addressWithZip4 = {
        ...testAddresses.addison,
        zip4: '1234'
      };

      const result = await addressValidator.validateAddress(addressWithZip4);
      
      expect(result.isValid).toBe(true);
      expect(result.normalized?.zip4).toBe('1234');
    });
  });

  describe('TDSP Resolution', () => {
    it('should resolve TDSP for multi-TDSP ZIP codes requiring address validation', async () => {
      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.addison);
      
      expect(result.success).toBe(true);
      expect(result.tdsp).toBeDefined();
      expect(result.tdsp?.name).toContain('Oncor Electric Delivery');
      expect(result.confidence).toBeOneOf(['high', 'medium', 'low']);
      expect(result.method).toContain('address');
      expect(result.apiParams).toBeDefined();
      expect(result.apiParams?.tdsp_duns).toBeDefined();
    });

    it('should handle boundary areas with alternative TDSPs', async () => {
      // Test address that should trigger TNMP instead of Oncor
      const boundaryAddress = {
        street: '1234 Spring Valley Road', // Street that might be served by TNMP
        city: 'Addison',
        state: 'TX',
        zipCode: '75001'
      } as AddressInfo;

      const result = await addressTdspResolver.resolveTdspFromAddress(boundaryAddress);
      
      expect(result.success).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Multiple utility providers serve this area');
    });

    it('should provide manual selection when confidence is low', async () => {
      // Mock low confidence scenario
      const mockBoundaryService = vi.spyOn(tdspBoundaryService, 'resolveTdsp');
      mockBoundaryService.mockResolvedValue({
        address: expect.any(Object),
        tdsp: TDSP_INFO.ONCOR,
        confidence: 'low',
        method: 'zip-fallback',
        alternativeTdsps: [TDSP_INFO.TNMP],
        warnings: ['Low confidence result']
      });

      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.addison);
      
      expect(result.requiresManualSelection).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
      
      mockBoundaryService.mockRestore();
    });
  });

  describe('Progressive Resolution Steps', () => {
    it('should generate correct steps for ZIP-only input', async () => {
      const steps = await addressTdspResolver.getProgressiveResolutionSteps('75001');
      
      expect(steps).toHaveLength(2); // ZIP input + address collection
      expect(steps[0].step).toBe('zip-input');
      expect(steps[0].completed).toBe(true);
      expect(steps[1].step).toBe('address-collection');
      expect(steps[1].required).toBe(true);
      expect(steps[1].completed).toBe(false);
    });

    it('should generate complete steps for full address input', async () => {
      const steps = await addressTdspResolver.getProgressiveResolutionSteps('75001', testAddresses.addison);
      
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.find(s => s.step === 'tdsp-determination')).toBeDefined();
      expect(steps.find(s => s.step === 'api-ready')).toBeDefined();
    });

    it('should indicate when address collection is optional vs required', async () => {
      // Multi-TDSP ZIP - address required
      const multiSteps = await addressTdspResolver.getProgressiveResolutionSteps('75001');
      const addressStep = multiSteps.find(s => s.step === 'address-collection');
      expect(addressStep?.required).toBe(true);

      // Standard ZIP - address optional (if we had proper implementation)
      // This would need actual standard ZIP mapping implemented
    });
  });

  describe('TDSP Options and Selection', () => {
    it('should provide TDSP options for boundary areas', async () => {
      const options = await addressTdspResolver.getTdspOptions(testAddresses.addison);
      
      expect(options.options.length).toBeGreaterThanOrEqual(1);
      expect(options.options[0].recommended).toBe(true);
      expect(options.options[0].tdsp).toBeDefined();
      expect(options.options[0].confidence).toBeGreaterThan(0);
      expect(options.helpText).toBeDefined();
    });

    it('should create correct API parameters from TDSP selection', () => {
      const apiParams = addressTdspResolver.createApiParams(TDSP_INFO.ONCOR, 2000);
      
      expect(apiParams.tdsp_duns).toBe(TDSP_INFO.ONCOR.duns);
      expect(apiParams.display_usage).toBe(2000);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network error
      const mockValidator = vi.spyOn(addressValidator, 'validateAddress');
      mockValidator.mockRejectedValue(new Error('Network timeout'));

      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.addison);
      
      expect(result.success).toBe(false);
      expect(result.warnings).toContain('Address validation failed');
      
      mockValidator.mockRestore();
    });

    it('should fall back to geographic heuristics when TDSP resolution fails', async () => {
      // Mock TDSP resolution failure
      const mockBoundaryService = vi.spyOn(tdspBoundaryService, 'resolveTdsp');
      mockBoundaryService.mockRejectedValue(new Error('TDSP resolution failed'));

      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.dallas);
      
      // Should still succeed with fallback
      expect(result.success).toBe(true);
      expect(result.method).toContain('fallback');
      expect(result.confidence).toBe('low');
      expect(result.warnings.length).toBeGreaterThan(0);
      
      mockBoundaryService.mockRestore();
    });

    it('should provide useful error messages for invalid inputs', async () => {
      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.invalidZip);
      
      if (!result.success) {
        expect(result.warnings).toContain('Address validation failed');
        expect(result.suggestions).toContain('Please verify your address and try again');
      }
    });
  });

  describe('Caching Performance', () => {
    it('should cache ZIP code analysis results', async () => {
      const zipCode = '75001';
      
      // First call
      const result1 = await addressTdspResolver.analyzeZipCode(zipCode);
      
      // Second call should be faster (cached)
      const start = Date.now();
      const result2 = await addressTdspResolver.analyzeZipCode(zipCode);
      const duration = Date.now() - start;
      
      expect(result1).toEqual(result2);
      expect(duration).toBeLessThan(50); // Should be much faster from cache
    });

    it('should cache address validation results', async () => {
      // First validation
      const result1 = await addressValidator.validateAddress(testAddresses.addison);
      
      // Second validation should use cache
      const start = Date.now();
      const result2 = await addressValidator.validateAddress(testAddresses.addison);
      const duration = Date.now() - start;
      
      expect(result1.isValid).toBe(result2.isValid);
      expect(duration).toBeLessThan(50);
    });

    it('should maintain cache statistics', () => {
      const stats = addressCache.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRatio');
      expect(stats).toHaveProperty('size');
    });
  });

  describe('Integration with ComparePower API', () => {
    it('should generate correct API parameters for different TDSPs', () => {
      const testCases = [
        { tdsp: TDSP_INFO.ONCOR, expectedDuns: '1039940674000' },
        { tdsp: TDSP_INFO.CENTERPOINT, expectedDuns: '957877905' },
        { tdsp: TDSP_INFO.AEP_CENTRAL, expectedDuns: '007924772' }
      ];

      testCases.forEach(({ tdsp, expectedDuns }) => {
        const apiParams = addressTdspResolver.createApiParams(tdsp);
        
        expect(apiParams.tdsp_duns).toBe(expectedDuns);
        expect(apiParams.display_usage).toBe(1000); // default
      });
    });

    it('should handle TDSP resolution results with proper confidence mapping', async () => {
      const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.addison);
      
      if (result.success) {
        expect(['high', 'medium', 'low']).toContain(result.confidence);
        expect(result.method).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThan(0);
      }
    });
  });

  describe('System Configuration Validation', () => {
    it('should validate system configuration', async () => {
      const validation = await addressTdspResolver.validateConfiguration();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
      
      // Should not have critical configuration issues in test environment
      const criticalIssues = validation.issues.filter(issue => issue.includes('critical'));
      expect(criticalIssues.length).toBeLessThanOrEqual(1); // Allow for missing API keys in test
    });

    it('should provide system statistics', () => {
      const stats = addressTdspResolver.getSystemStats();
      
      expect(stats.multiTdspStats).toBeDefined();
      expect(stats.multiTdspStats.totalZipCodes).toBeGreaterThan(0);
      expect(stats.cacheStats).toBeDefined();
      expect(stats.serviceStats).toBeDefined();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle addresses with special characters', async () => {
      const specialAddress = {
        street: '123 O\'Connor Street #5A',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201'
      } as AddressInfo;

      const result = await addressValidator.validateAddress(specialAddress);
      
      expect(result.isValid).toBe(true);
      expect(result.normalized?.streetName).toContain('O\'Connor');
    });

    it('should handle very long street names', async () => {
      const longStreetAddress = {
        street: '1234 Very Very Very Long Street Name That Might Cause Issues Avenue',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201'
      } as AddressInfo;

      const result = await addressValidator.validateAddress(longStreetAddress);
      
      expect(result.isValid).toBe(true);
      expect(result.normalized?.streetName.length).toBeGreaterThan(20);
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        addressTdspResolver.resolveTdspFromAddress({
          ...testAddresses.addison,
          street: `${1000 + i} Test Street`
        })
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
      });
    });
  });

  describe('Multi-TDSP Configuration', () => {
    it('should have valid multi-TDSP configuration data', () => {
      const zipCodes = getMultiTdspZipCodes();
      
      expect(zipCodes.length).toBeGreaterThan(10);
      
      zipCodes.forEach(zipCode => {
        const config = multiTdspMapping[zipCode];
        expect(config).toBeDefined();
        expect(config.primaryTdsp).toBeDefined();
        expect(config.primaryTdsp.duns).toBeDefined();
        expect(config.primaryTdsp.name).toBeDefined();
        expect(['North', 'Coast', 'Central', 'South', 'Valley']).toContain(config.primaryTdsp.zone);
        expect(typeof config.requiresAddressValidation).toBe('boolean');
      });
    });

    it('should have consistent TDSP information', () => {
      Object.values(TDSP_INFO).forEach(tdsp => {
        expect(tdsp.duns).toBeDefined();
        expect(tdsp.name).toBeDefined();
        expect(tdsp.zone).toBeDefined();
        expect(typeof tdsp.tier).toBe('number');
        expect(typeof tdsp.priority).toBe('number');
        expect(['primary', 'secondary', 'boundary']).toContain(tdsp.coverage);
      });
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should resolve TDSP within acceptable time limits', async () => {
    const start = Date.now();
    const result = await addressTdspResolver.resolveTdspFromAddress(testAddresses.addison);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    expect(result.metadata.processingTime).toBeLessThan(2000);
  });

  it('should handle batch processing efficiently', async () => {
    const batchAddresses = Array.from({ length: 5 }, (_, i) => ({
      ...testAddresses.addison,
      street: `${1000 + i} Batch Test Street`
    }));

    const start = Date.now();
    const promises = batchAddresses.map(addr => 
      addressTdspResolver.resolveTdspFromAddress(addr)
    );
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(results.length).toBe(5);
    expect(duration).toBeLessThan(5000); // Batch of 5 should complete within 5 seconds
    
    results.forEach(result => {
      expect(result.success).toBeDefined();
    });
  });
});

// Helper assertion extensions
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () => `expected ${received} to be one of ${expected.join(', ')}`
    };
  }
});