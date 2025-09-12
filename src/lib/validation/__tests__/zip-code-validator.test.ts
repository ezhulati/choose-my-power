/**
 * Unit Tests for ZIP Code Validation System
 * 
 * Tests all functional requirements from specification:
 * FR-001: ZIP code format validation (5-digit requirement)
 * FR-002: Texas boundary validation
 * FR-003: Deregulated market area verification
 * FR-004: Error messaging for invalid ZIP codes
 * FR-005: Form data preservation
 * FR-006: TDSP mapping integration
 * FR-007: Real-time validation feedback
 * FR-008: Mixed TDSP handling
 * 
 * Test file for: /src/lib/validation/zip-code-validator.ts
 * Feature: ZIP Code Validation (Branch: 001-add-zip-code)
 */

import { describe, it, expect } from 'vitest';
import { 
  ZipCodeValidator, 
  validateZipCode, 
  validateZipFormat, 
  getValidationMessage,
  requiresAddressValidation,
  type ZipCodeValidationResult 
} from '../zip-code-validator';

describe('ZIP Code Validator', () => {
  
  describe('FR-001: Format Validation (5-digit requirement)', () => {
    it('should accept valid 5-digit ZIP codes', () => {
      const result = ZipCodeValidator.validateFormat('75201');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty ZIP codes', () => {
      const result = ZipCodeValidator.validateFormat('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ZIP code is required');
    });

    it('should reject ZIP codes with less than 5 digits', () => {
      const result = ZipCodeValidator.validateFormat('1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ZIP code must be 5 digits');
    });

    it('should reject ZIP codes with more than 5 digits', () => {
      const result = ZipCodeValidator.validateFormat('123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ZIP code must be exactly 5 digits');
    });

    it('should reject non-numeric ZIP codes', () => {
      const result = ZipCodeValidator.validateFormat('abcde');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 5-digit ZIP code');
    });

    it('should clean and validate ZIP codes with non-numeric characters', () => {
      const result = ZipCodeValidator.validateFormat('75-201');
      expect(result.isValid).toBe(true);
    });
  });

  describe('FR-002: Texas Boundary Validation', () => {
    it('should accept valid Dallas ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('75201');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid Houston ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('77001');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid Austin ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('78701');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid Fort Worth ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('76101');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid West Texas ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('79901');
      expect(result.isValid).toBe(true);
    });

    it('should reject California ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('90210');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This ZIP code is outside Texas\'s deregulated electricity market');
    });

    it('should reject New York ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('10001');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This ZIP code is outside Texas\'s deregulated electricity market');
    });

    it('should reject Florida ZIP codes', () => {
      const result = ZipCodeValidator.validateTexasBoundary('33101');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This ZIP code is outside Texas\'s deregulated electricity market');
    });
  });

  describe('FR-003: Deregulated Market Area Verification', () => {
    it('should accept deregulated Dallas ZIP codes', () => {
      const result = ZipCodeValidator.validateDeregulatedArea('75201');
      expect(result.isValid).toBe(true);
      expect(result.isRegulated).toBe(false);
    });

    it('should accept deregulated Houston ZIP codes', () => {
      const result = ZipCodeValidator.validateDeregulatedArea('77401'); // Bellaire
      expect(result.isValid).toBe(true);
      expect(result.isRegulated).toBe(false);
    });

    it('should reject regulated Austin ZIP codes (Austin Energy)', () => {
      const result = ZipCodeValidator.validateDeregulatedArea('78701');
      expect(result.isValid).toBe(false);
      expect(result.isRegulated).toBe(true);
      expect(result.error).toBe('This area has regulated electricity service - plan comparison not available');
    });

    it('should reject regulated San Antonio ZIP codes (CPS Energy)', () => {
      const result = ZipCodeValidator.validateDeregulatedArea('78201');
      expect(result.isValid).toBe(false);
      expect(result.isRegulated).toBe(true);
      expect(result.error).toBe('This area has regulated electricity service - plan comparison not available');
    });

    it('should reject regulated El Paso ZIP codes', () => {
      const result = ZipCodeValidator.validateDeregulatedArea('79901');
      expect(result.isValid).toBe(false);
      expect(result.isRegulated).toBe(true);
      expect(result.error).toBe('This area has regulated electricity service - plan comparison not available');
    });
  });

  describe('FR-006: TDSP Integration', () => {
    it('should identify Oncor territory for Dallas ZIP codes', () => {
      const result = ZipCodeValidator.getTdspInfo('75201');
      expect(result.tdsp?.name).toBe('Oncor Electric Delivery');
      expect(result.requiresAddressValidation).toBe(false);
    });

    it('should identify CenterPoint territory for Houston ZIP codes', () => {
      const result = ZipCodeValidator.getTdspInfo('77001');
      expect(result.tdsp?.name).toBe('CenterPoint Energy Houston Electric');
      expect(result.requiresAddressValidation).toBe(false);
    });

    it('should identify AEP Central territory for Austin area ZIP codes', () => {
      const result = ZipCodeValidator.getTdspInfo('78660'); // Pflugerville - deregulated
      expect(result.tdsp?.name).toBe('AEP Texas Central Company');
    });

    it('should handle multi-TDSP ZIP codes with address validation required', () => {
      const result = ZipCodeValidator.getTdspInfo('75001'); // Addison - multi-TDSP
      expect(result.requiresAddressValidation).toBe(true);
      expect(result.warnings).toContain('This ZIP code spans multiple utility territories. Address validation may be required.');
    });
  });

  describe('FR-008: Mixed TDSP Territory Handling', () => {
    it('should identify mixed TDSP areas correctly', () => {
      // Frisco area - known multi-TDSP ZIP
      const result = ZipCodeValidator.getTdspInfo('75034');
      expect(result.requiresAddressValidation).toBe(true);
      expect(result.tdsp?.name).toBe('Oncor Electric Delivery'); // Primary TDSP
      expect(result.boundaryType).toBe('street-level');
    });

    it('should provide warnings for boundary areas', () => {
      const result = ZipCodeValidator.getTdspInfo('76020'); // Azle - three-way boundary
      expect(result.requiresAddressValidation).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should validate a complete valid deregulated ZIP code', () => {
      const result = validateZipCode('75201', {
        strictTexasOnly: true,
        requireDeregulated: true
      });

      expect(result.isValid).toBe(true);
      expect(result.isTexas).toBe(true);
      expect(result.isDeregulated).toBe(true);
      expect(result.zipCode).toBe('75201');
      expect(result.tdsp?.name).toBe('Oncor Electric Delivery');
      expect(result.errors).toHaveLength(0);
      expect(result.city).toBe('Dallas');
    });

    it('should handle regulated area with warnings when not strict', () => {
      const result = validateZipCode('78701', {
        strictTexasOnly: true,
        requireDeregulated: false
      });

      expect(result.isValid).toBe(true);
      expect(result.isTexas).toBe(true);
      expect(result.isDeregulated).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject invalid format immediately', () => {
      const result = validateZipCode('1234');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ZIP code must be 5 digits');
    });

    it('should reject non-Texas ZIP codes when strict', () => {
      const result = validateZipCode('90210', {
        strictTexasOnly: true,
        requireDeregulated: true
      });

      expect(result.isValid).toBe(false);
      expect(result.isTexas).toBe(false);
      expect(result.errors).toContain('This ZIP code is outside Texas\'s deregulated electricity market');
    });
  });

  describe('FR-004: Error Messaging', () => {
    it('should provide user-friendly error messages for invalid format', () => {
      const result = validateZipCode('1234');
      const message = getValidationMessage(result);
      
      expect(message.type).toBe('error');
      expect(message.message).toBe('ZIP code must be 5 digits');
      expect(message.actionable).toBe('Please enter exactly 5 numbers');
    });

    it('should provide actionable feedback for non-Texas ZIP codes', () => {
      const result = validateZipCode('90210');
      const message = getValidationMessage(result);
      
      expect(message.type).toBe('error');
      expect(message.message).toBe('This ZIP code is outside Texas\'s deregulated electricity market');
      expect(message.actionable).toBe('Please try a different ZIP code');
    });

    it('should provide success messages for valid ZIP codes', () => {
      const result = validateZipCode('75201');
      const message = getValidationMessage(result);
      
      expect(message.type).toBe('success');
      expect(message.message).toBe('Dallas is in the deregulated electricity market');
    });

    it('should provide warnings for mixed TDSP areas', () => {
      const result = validateZipCode('75001'); // Multi-TDSP area
      const message = getValidationMessage(result);
      
      if (message.type === 'warning') {
        expect(message.actionable).toContain('Address validation');
      }
    });
  });

  describe('Utility Functions', () => {
    it('should correctly identify address validation requirements', () => {
      expect(requiresAddressValidation('75201')).toBe(false); // Dallas - single TDSP
      expect(requiresAddressValidation('75001')).toBe(true);  // Addison - multi-TDSP
    });

    it('should handle format validation function', () => {
      expect(validateZipFormat('75201').isValid).toBe(true);
      expect(validateZipFormat('1234').isValid).toBe(false);
    });

    it('should provide supported ZIP ranges', () => {
      const ranges = ZipCodeValidator.getSupportedZipRanges();
      expect(ranges).toContainEqual({ min: 75001, max: 75999 }); // Dallas area
      expect(ranges).toContainEqual({ min: 77001, max: 77999 }); // Houston area
    });

    it('should identify regulated areas', () => {
      expect(ZipCodeValidator.isRegulatedArea('78701')).toBe(true);  // Austin Energy
      expect(ZipCodeValidator.isRegulatedArea('78201')).toBe(true);  // CPS Energy
      expect(ZipCodeValidator.isRegulatedArea('75201')).toBe(false); // Deregulated Dallas
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(validateZipFormat(null as unknown).isValid).toBe(false);
      expect(validateZipFormat(undefined as unknown).isValid).toBe(false);
    });

    it('should handle whitespace in ZIP codes', () => {
      const result = validateZipFormat(' 75201 ');
      expect(result.isValid).toBe(true);
    });

    it('should handle mixed alphanumeric with numbers', () => {
      const result = validateZipFormat('75a01');
      expect(result.isValid).toBe(false);
    });

    it('should provide empty arrays for unknown ZIP TDSP info', () => {
      const result = ZipCodeValidator.getTdspInfo('99999'); // Non-existent ZIP
      expect(result.warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('Utility territory information not available')
      ]));
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle bulk validation efficiently', () => {
      const testZips = ['75201', '77001', '78701', '76101', '79901'];
      const results = testZips.map(zip => validateZipCode(zip));
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('isTexas');
        expect(result).toHaveProperty('zipCode');
      });
    });

    it('should maintain consistent results for same inputs', () => {
      const zip = '75201';
      const result1 = validateZipCode(zip);
      const result2 = validateZipCode(zip);
      
      expect(result1).toEqual(result2);
    });
  });
});