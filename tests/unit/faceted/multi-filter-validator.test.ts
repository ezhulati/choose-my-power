import { describe, it, expect, vi, beforeEach } from 'vitest';
import { multiFilterValidator } from '../../../src/lib/faceted/multi-filter-validator';
import * as tdspMapping from '../../../src/config/tdsp-mapping';
import * as filterMapper from '../../../src/lib/api/filter-mapper';

// Mock the dependencies
vi.mock('../../../src/config/tdsp-mapping', () => ({
  getTdspFromCity: vi.fn(),
  formatCityName: vi.fn()
}));

vi.mock('../../../src/lib/api/filter-mapper', () => ({
  filterMapper: {
    mapFiltersToApiParams: vi.fn(),
    filterDefinitions: [
      {
        type: 'term',
        urlPatterns: ['6-month', '12-month', '24-month'],
        apiParam: 'term',
        valueTransform: vi.fn(),
        displayName: vi.fn(),
        isValid: vi.fn(),
        description: 'Contract term'
      },
      {
        type: 'green_energy',
        urlPatterns: ['green-energy', '50-green'],
        apiParam: 'percent_green',
        valueTransform: vi.fn(),
        displayName: vi.fn(),
        isValid: vi.fn(),
        description: 'Green energy'
      }
    ]
  }
}));

describe('MultiFilterValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue('1039940674000');
    vi.mocked(tdspMapping.formatCityName).mockReturnValue('Dallas');
  });

  describe('runValidationTests', () => {
    beforeEach(() => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockImplementation(
        (city, filters, tdsp) => {
          // Mock validation logic
          const hasConflicts = filters.includes('12-month') && filters.includes('24-month');
          const hasUnknownFilter = filters.includes('invalid-filter');
          
          if (hasConflicts) {
            return {
              isValid: false,
              apiParams: { tdsp_duns: tdsp, display_usage: 1000 },
              warnings: [],
              errors: ['Multiple term filters conflict'],
              appliedFilters: []
            };
          }
          
          if (hasUnknownFilter) {
            return {
              isValid: false,
              apiParams: { tdsp_duns: tdsp, display_usage: 1000 },
              warnings: [],
              errors: ['Unknown filter: invalid-filter'],
              appliedFilters: []
            };
          }
          
          const appliedFilters = filters.map(filter => ({
            type: filter.includes('month') ? 'term' as const : 'green_energy' as const,
            urlSegment: filter,
            apiParam: filter.includes('month') ? 'term' : 'percent_green',
            value: filter === '12-month' ? 12 : filter === '24-month' ? 24 : 100,
            displayName: filter === '12-month' ? '12-Month Contract' : 
                        filter === '24-month' ? '24-Month Contract' : 
                        '100% Green Energy'
          }));
          
          const warnings = [];
          if (filters.includes('100-green') && filters.includes('prepaid')) {
            warnings.push('100% green energy with prepaid plans may have limited availability');
          }
          
          return {
            isValid: true,
            apiParams: { tdsp_duns: tdsp, display_usage: 1000 },
            warnings,
            errors: [],
            appliedFilters
          };
        }
      );
    });

    it('should run comprehensive validation tests', async () => {
      const results = await multiFilterValidator.runValidationTests();
      
      expect(results.passed).toBeGreaterThan(0);
      expect(results.failed).toBeGreaterThanOrEqual(0);
      expect(results.results).toBeDefined();
      expect(Array.isArray(results.results)).toBe(true);
    });

    it('should pass tests for valid single filters', async () => {
      const results = await multiFilterValidator.runValidationTests();
      
      // Find valid single filter test
      const validSingleFilterTest = results.results.find(
        r => r.test.filters.length === 1 && 
             r.test.filters[0] === '12-month' && 
             r.test.expected === 'valid'
      );
      
      expect(validSingleFilterTest?.passed).toBe(true);
    });

    it('should pass tests for valid two-filter combinations', async () => {
      const results = await multiFilterValidator.runValidationTests();
      
      // Find valid two-filter combination test
      const validTwoFilterTest = results.results.find(
        r => r.test.filters.length === 2 && 
             r.test.filters.includes('12-month') && 
             r.test.filters.includes('fixed-rate') && 
             r.test.expected === 'valid'
      );
      
      expect(validTwoFilterTest?.passed).toBe(true);
    });

    it('should identify warning cases correctly', async () => {
      // Mock to return warnings for specific combination
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
        warnings: ['100% green energy with prepaid plans may have limited availability'],
        errors: [],
        appliedFilters: []
      });
      
      const results = await multiFilterValidator.runValidationTests();
      
      const warningTest = results.results.find(
        r => r.test.expected === 'warning'
      );
      
      expect(warningTest?.passed).toBe(true);
    });

    it('should identify invalid filter combinations', async () => {
      const results = await multiFilterValidator.runValidationTests();
      
      // Find conflicting filters test
      const conflictTest = results.results.find(
        r => r.test.filters.includes('12-month') && 
             r.test.filters.includes('24-month') && 
             r.test.expected === 'invalid'
      );
      
      expect(conflictTest?.passed).toBe(true);
    });
  });

  describe('generateFilterCombinations', () => {
    it('should generate valid combinations for a city', () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
        warnings: [],
        errors: [],
        appliedFilters: []
      });
      
      const combinations = multiFilterValidator.generateFilterCombinations('dallas-tx', 2);
      
      expect(Array.isArray(combinations)).toBe(true);
      expect(combinations.length).toBeGreaterThan(0);
      
      // Should include some valid combinations
      const validCombinations = combinations.filter(c => c.isValid);
      expect(validCombinations.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid city', () => {
      vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue(null);
      
      const combinations = multiFilterValidator.generateFilterCombinations('invalid-city');
      
      expect(combinations).toEqual([]);
    });

    it('should respect maxDepth parameter', () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
        warnings: [],
        errors: [],
        appliedFilters: []
      });
      
      const combinations = multiFilterValidator.generateFilterCombinations('dallas-tx', 1);
      
      // All combinations should have 1 filter or fewer
      const deepCombinations = combinations.filter(c => c.filters.length > 1);
      expect(deepCombinations.length).toBe(0);
    });

    it('should calculate SEO values correctly', () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
        warnings: [],
        errors: [],
        appliedFilters: []
      });
      
      const combinations = multiFilterValidator.generateFilterCombinations('dallas-tx', 2);
      
      // Should have combinations with different SEO values
      const highValueCombos = combinations.filter(c => c.seoValue === 'high');
      const mediumValueCombos = combinations.filter(c => c.seoValue === 'medium');
      const lowValueCombos = combinations.filter(c => c.seoValue === 'low');
      
      expect(highValueCombos.length + mediumValueCombos.length + lowValueCombos.length)
        .toBe(combinations.length);
    });
  });

  describe('getPopularCombinations', () => {
    it('should return more combinations for tier 1 cities', () => {
      const tier1Combos = multiFilterValidator.getPopularCombinations('dallas-tx', 1);
      const tier3Combos = multiFilterValidator.getPopularCombinations('small-city-tx', 3);
      
      expect(tier1Combos.length).toBeGreaterThan(tier3Combos.length);
    });

    it('should include essential filters for all tiers', () => {
      const tier3Combos = multiFilterValidator.getPopularCombinations('small-city-tx', 3);
      
      // Should include basic essential filters
      const hasBasicFilters = tier3Combos.some(combo => 
        combo.includes('12-month') || 
        combo.includes('fixed-rate') || 
        combo.includes('green-energy')
      );
      
      expect(hasBasicFilters).toBe(true);
    });

    it('should include complex combinations for tier 1 cities', () => {
      const tier1Combos = multiFilterValidator.getPopularCombinations('dallas-tx', 1);
      
      // Should include two-filter combinations
      const hasTwoFilterCombos = tier1Combos.some(combo => combo.length === 2);
      expect(hasTwoFilterCombos).toBe(true);
    });
  });

  describe('validateUrlStructure', () => {
    it('should validate correct URL structure', () => {
      const result = multiFilterValidator.validateUrlStructure('/electricity-plans/dallas-tx/12-month/');
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should identify missing electricity-plans prefix', () => {
      const result = multiFilterValidator.validateUrlStructure('/dallas-tx/12-month/');
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL must start with /electricity-plans/');
    });

    it('should identify missing trailing slash', () => {
      const result = multiFilterValidator.validateUrlStructure('/electricity-plans/dallas-tx/12-month');
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL must end with trailing slash');
    });

    it('should identify spaces in URL', () => {
      const result = multiFilterValidator.validateUrlStructure('/electricity-plans/dallas tx/12-month/');
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL contains spaces');
    });

    it('should identify double separators', () => {
      const result = multiFilterValidator.validateUrlStructure('/electricity-plans//dallas-tx/12-month/');
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL contains double separators');
    });

    it('should identify URLs that are too deep', () => {
      const result = multiFilterValidator.validateUrlStructure('/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/prepaid/');
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL too deep (max 3 filters allowed)');
    });
  });
});