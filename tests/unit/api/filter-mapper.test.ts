import { describe, it, expect, beforeEach } from 'vitest';
import { FilterMapper, filterMapper, parseFilterUrl, buildFilterUrl, validateFilter } from '../../../src/lib/api/filter-mapper';
import type { ApiParams } from '../../../src/types/facets';

describe('Filter Mapper', () => {
  let mapper: FilterMapper;

  beforeEach(() => {
    mapper = new FilterMapper();
  });

  describe('URL to API Parameter Conversion', () => {
    it('should map term filters correctly', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        ['12-month'],
        '1039940674000'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.term).toBe(12);
      expect(result.appliedFilters).toHaveLength(1);
      expect(result.appliedFilters[0].displayName).toBe('12-Month Contract');
    });

    it('should map green energy filters correctly', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['100-green'],
        '957877905'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.percent_green).toBe(100);
      expect(result.appliedFilters[0].displayName).toBe('100% Green Energy');
    });

    it('should map plan feature filters correctly', () => {
      const result = mapper.mapFiltersToApiParams(
        'austin-tx',
        ['prepaid', 'time-of-use'],
        '007924772'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.is_pre_pay).toBe(true);
      expect(result.apiParams.is_time_of_use).toBe(true);
      expect(result.appliedFilters).toHaveLength(2);
    });

    it('should handle complex filter combinations', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        ['24-month', 'fixed-rate', '50-green', 'autopay-discount'],
        '1039940674000'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.term).toBe(24);
      expect(result.apiParams.percent_green).toBe(50);
      expect(result.apiParams.requires_auto_pay).toBe(true);
      expect(result.appliedFilters).toHaveLength(4);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect filter conflicts', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['12-month', '24-month'], // Conflicting terms
        '957877905'
      );

      expect(result.isValid).toBe(true); // Still valid, but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Multiple term filters'))).toBe(true);
    });

    it('should validate parameter combinations', () => {
      const result = mapper.mapFiltersToApiParams(
        'austin-tx',
        ['prepaid', '36-month'], // Prepaid with long term is unusual
        '007924772'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Prepaid plans typically'))).toBe(true);
    });

    it('should handle unknown filters', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        ['unknown-filter'],
        '1039940674000'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unknown filter: 'unknown-filter'");
    });

    it('should validate TDSP DUNS requirement', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        ['12-month'],
        '' // Empty DUNS
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('TDSP DUNS'))).toBe(true);
    });

    it('should handle usage level filters', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['high-usage'],
        '957877905'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.display_usage).toBe(2000);
      expect(result.appliedFilters[0].displayName).toBe('High Usage (2000 kWh)');
    });
  });

  describe('API Parameters to URL Generation', () => {
    it('should generate URL segments from API parameters', () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12,
        percent_green: 100,
        is_pre_pay: true,
        display_usage: 2000
      };

      const segments = mapper.generateUrlFromParams(params);

      expect(segments).toContain('12-month');
      expect(segments).toContain('green-energy');
      expect(segments).toContain('prepaid');
      expect(segments).toContain('high-usage');
    });

    it('should handle month-to-month contracts', () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 1
      };

      const segments = mapper.generateUrlFromParams(params);

      expect(segments).toContain('month-to-month');
    });

    it('should handle partial green energy', () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        percent_green: 25
      };

      const segments = mapper.generateUrlFromParams(params);

      expect(segments).toContain('25-green');
    });
  });

  describe('Filter Validation', () => {
    it('should validate individual filter segments', () => {
      expect(mapper.validateFilterSegment('12-month').isValid).toBe(true);
      expect(mapper.validateFilterSegment('100-green').isValid).toBe(true);
      expect(mapper.validateFilterSegment('prepaid').isValid).toBe(true);
      expect(mapper.validateFilterSegment('invalid-filter').isValid).toBe(false);
    });

    it('should provide validation details', () => {
      const result = mapper.validateFilterSegment('24-month');

      expect(result.isValid).toBe(true);
      expect(result.definition).toBeDefined();
      expect(result.definition?.type).toBe('term');
    });

    it('should validate value ranges', () => {
      // Valid green energy percentages
      expect(mapper.validateFilterSegment('100-green').isValid).toBe(true);
      expect(mapper.validateFilterSegment('50-green').isValid).toBe(true);
      
      // Invalid term lengths would be caught by the pattern matching
      const invalidResult = mapper.validateFilterSegment('invalid-month');
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Filter Suggestions', () => {
    it('should provide suggestions for partial matches', () => {
      const suggestions = mapper.getFilterSuggestions('green');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('green'))).toBe(true);
    });

    it('should prioritize exact prefix matches', () => {
      const suggestions = mapper.getFilterSuggestions('100');

      expect(suggestions[0]).toBe('100-green');
    });

    it('should limit suggestion count', () => {
      const suggestions = mapper.getFilterSuggestions('', 3);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Available Filters', () => {
    it('should return all available filter types', () => {
      const available = mapper.getAvailableFilters();

      expect(available.length).toBeGreaterThan(0);
      expect(available.some(f => f.type === 'term')).toBe(true);
      expect(available.some(f => f.type === 'green_energy')).toBe(true);
      expect(available.some(f => f.type === 'plan_features')).toBe(true);
    });

    it('should exclude specified filter types', () => {
      const available = mapper.getAvailableFilters(['term']);

      expect(available.some(f => f.type === 'term')).toBe(false);
      expect(available.some(f => f.type === 'green_energy')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty filter arrays', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        [],
        '1039940674000'
      );

      expect(result.isValid).toBe(true);
      expect(result.appliedFilters).toHaveLength(0);
      expect(result.warnings).toContain('No filters applied - showing all available plans');
    });

    it('should handle many filters warning', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['12-month', 'fixed-rate', '100-green', 'prepaid', 'autopay-discount'],
        '957877905'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Many filters applied'))).toBe(true);
    });

    it('should provide city-specific recommendations', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['100-green'],
        '957877905'
      );

      expect(result.warnings.some(w => w.includes('Houston area'))).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should parse filter URLs', () => {
      const result = parseFilterUrl(
        'dallas-tx',
        ['12-month', 'green-energy'],
        '1039940674000'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.term).toBe(12);
      expect(result.apiParams.percent_green).toBe(100);
    });

    it('should build filter URLs', () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 24,
        percent_green: 50,
        is_time_of_use: true
      };

      const segments = buildFilterUrl(params);

      expect(segments).toContain('24-month');
      expect(segments).toContain('50-green');
      expect(segments).toContain('time-of-use');
    });

    it('should validate filters', () => {
      expect(validateFilter('12-month')).toBe(true);
      expect(validateFilter('invalid-filter')).toBe(false);
    });

    it('should suggest filters', () => {
      const suggestions = mapper.getFilterSuggestions('pre');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('prepaid'))).toBe(true);
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle comprehensive filter combination for Dallas', () => {
      const result = mapper.mapFiltersToApiParams(
        'dallas-tx',
        ['24-month', 'fixed-rate', '100-green', 'no-deposit', '1000-kwh'],
        '1039940674000'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams).toEqual({
        tdsp_duns: '1039940674000',
        term: 24,
        percent_green: 100,
        display_usage: 1000
      });
      expect(result.appliedFilters).toHaveLength(5);
    });

    it('should handle Houston green energy scenario', () => {
      const result = mapper.mapFiltersToApiParams(
        'houston-tx',
        ['12-month', 'green-energy', 'autopay-discount'],
        '957877905'
      );

      expect(result.isValid).toBe(true);
      expect(result.apiParams.percent_green).toBe(100);
      expect(result.apiParams.requires_auto_pay).toBe(true);
      expect(result.warnings.some(w => w.includes('Houston area'))).toBe(true);
    });

    it('should handle Austin prepaid scenario with warnings', () => {
      const result = mapper.mapFiltersToApiParams(
        'austin-tx',
        ['prepaid', '36-month', '100-green'],
        '007924772'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Prepaid plans typically'))).toBe(true);
      expect(result.warnings.some(w => w.includes('100% green energy with prepaid'))).toBe(true);
    });
  });
});

describe('Filter Mapping Integration', () => {
  it('should round-trip filters correctly', () => {
    const originalParams: ApiParams = {
      tdsp_duns: '1039940674000',
      term: 12,
      percent_green: 100,
      is_pre_pay: true,
      requires_auto_pay: true,
      display_usage: 2000
    };

    // Convert to URL segments
    const segments = buildFilterUrl(originalParams);
    
    // Convert back to API params
    const result = parseFilterUrl('dallas-tx', segments, '1039940674000');

    expect(result.isValid).toBe(true);
    expect(result.apiParams.term).toBe(originalParams.term);
    expect(result.apiParams.percent_green).toBe(originalParams.percent_green);
    expect(result.apiParams.is_pre_pay).toBe(originalParams.is_pre_pay);
    expect(result.apiParams.requires_auto_pay).toBe(originalParams.requires_auto_pay);
    expect(result.apiParams.display_usage).toBe(originalParams.display_usage);
  });
});