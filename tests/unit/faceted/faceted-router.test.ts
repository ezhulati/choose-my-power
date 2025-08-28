import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { facetedRouter } from '../../../src/lib/faceted/faceted-router';
import * as tdspMapping from '../../../src/config/tdsp-mapping';
import * as filterMapper from '../../../src/lib/api/filter-mapper';
import * as comparePowerClient from '../../../src/lib/api/comparepower-client';

// Mock the dependencies
vi.mock('../../../src/config/tdsp-mapping', () => ({
  validateCitySlug: vi.fn(),
  getTdspFromCity: vi.fn(),
  formatCityName: vi.fn()
}));

vi.mock('../../../src/lib/api/filter-mapper', () => ({
  filterMapper: {
    mapFiltersToApiParams: vi.fn(),
    getAvailableFilters: vi.fn(),
    getDefinitionByPattern: vi.fn(),
    filterDefinitions: []
  }
}));

vi.mock('../../../src/lib/api/comparepower-client', () => ({
  comparePowerClient: {
    fetchPlans: vi.fn()
  }
}));

describe('FacetedRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(tdspMapping.validateCitySlug).mockReturnValue(true);
    vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue('1039940674000');
    vi.mocked(tdspMapping.formatCityName).mockReturnValue('Dallas');
    
    vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
      isValid: true,
      apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
      warnings: [],
      errors: [],
      appliedFilters: []
    });
  });

  describe('validateRoute', () => {
    it('should validate a simple city path', async () => {
      const result = await facetedRouter.validateRoute('dallas-tx');
      
      expect(result.isValid).toBe(true);
      expect(result.citySlug).toBe('dallas-tx');
      expect(result.cityName).toBe('Dallas');
      expect(result.tdspDuns).toBe('1039940674000');
      expect(result.filterSegments).toEqual([]);
    });

    it('should validate a city with single filter', async () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000, term: 12 },
        warnings: [],
        errors: [],
        appliedFilters: [{
          type: 'term',
          urlSegment: '12-month',
          apiParam: 'term',
          value: 12,
          displayName: '12-Month Contract'
        }]
      });

      const result = await facetedRouter.validateRoute('dallas-tx/12-month');
      
      expect(result.isValid).toBe(true);
      expect(result.citySlug).toBe('dallas-tx');
      expect(result.filterSegments).toEqual(['12-month']);
      expect(result.filterResult?.appliedFilters).toHaveLength(1);
      expect(result.filterResult?.appliedFilters[0].displayName).toBe('12-Month Contract');
    });

    it('should validate a city with multiple filters', async () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: true,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000, term: 12, percent_green: 100 },
        warnings: [],
        errors: [],
        appliedFilters: [
          {
            type: 'term',
            urlSegment: '12-month',
            apiParam: 'term',
            value: 12,
            displayName: '12-Month Contract'
          },
          {
            type: 'green_energy',
            urlSegment: 'green-energy',
            apiParam: 'percent_green',
            value: 100,
            displayName: '100% Green Energy'
          }
        ]
      });

      const result = await facetedRouter.validateRoute('dallas-tx/12-month/green-energy');
      
      expect(result.isValid).toBe(true);
      expect(result.filterSegments).toEqual(['12-month', 'green-energy']);
      expect(result.filterResult?.appliedFilters).toHaveLength(2);
    });

    it('should handle empty path', async () => {
      const result = await facetedRouter.validateRoute('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL: No city specified');
      expect(result.redirectUrl).toBe('/electricity-plans/');
    });

    it('should handle invalid city', async () => {
      vi.mocked(tdspMapping.validateCitySlug).mockReturnValue(false);
      
      const result = await facetedRouter.validateRoute('invalid-city');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid city: invalid-city');
      expect(result.redirectUrl).toBe('/404');
    });

    it('should handle missing TDSP mapping', async () => {
      vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue(null);
      
      const result = await facetedRouter.validateRoute('dallas-tx');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No TDSP mapping found for city: dallas-tx');
      expect(result.redirectUrl).toBe('/404');
    });

    it('should handle too many filters', async () => {
      const result = await facetedRouter.validateRoute('dallas-tx/12-month/fixed-rate/green-energy/prepaid');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too many filters (max 3)');
      expect(result.redirectUrl).toContain('dallas-tx');
    });

    it('should handle invalid filter combination', async () => {
      vi.mocked(filterMapper.filterMapper.mapFiltersToApiParams).mockReturnValue({
        isValid: false,
        apiParams: { tdsp_duns: '1039940674000', display_usage: 1000 },
        warnings: [],
        errors: ['Multiple term filters conflict'],
        appliedFilters: []
      });

      const result = await facetedRouter.validateRoute('dallas-tx/12-month/24-month');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid filter combination: Multiple term filters conflict');
      expect(result.redirectUrl).toBeTruthy();
    });

    it('should fetch plans when requirePlans is true', async () => {
      const mockPlans = [
        { id: 'plan1', name: 'Test Plan 1' },
        { id: 'plan2', name: 'Test Plan 2' }
      ];
      
      vi.mocked(comparePowerClient.comparePowerClient.fetchPlans).mockResolvedValue(mockPlans as any);

      const result = await facetedRouter.validateRoute('dallas-tx/12-month', { requirePlans: true });
      
      expect(result.isValid).toBe(true);
      expect(result.plans).toEqual(mockPlans);
      expect(comparePowerClient.comparePowerClient.fetchPlans).toHaveBeenCalledWith({
        tdsp_duns: '1039940674000',
        display_usage: 1000
      });
    });

    it('should handle API error when fetching plans', async () => {
      vi.mocked(comparePowerClient.comparePowerClient.fetchPlans).mockRejectedValue(
        new Error('API Error')
      );

      const result = await facetedRouter.validateRoute('dallas-tx/12-month', { requirePlans: true });
      
      expect(result.isValid).toBe(true); // Should still be valid, just with error
      expect(result.error).toBe('Failed to fetch plans: API Error');
      expect(result.plans).toEqual([]);
    });
  });

  describe('getSuggestedFilters', () => {
    beforeEach(() => {
      vi.mocked(filterMapper.filterMapper.getAvailableFilters).mockReturnValue([
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
          description: 'Green energy percentage'
        }
      ] as any);
    });

    it('should return suggested filters for a city', () => {
      const suggestions = facetedRouter.getSuggestedFilters('dallas-tx', [], 4);
      
      expect(suggestions).toEqual(['6-month', 'green-energy']);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should return empty array for invalid city', () => {
      vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue(null);
      
      const suggestions = facetedRouter.getSuggestedFilters('invalid-city', []);
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('generateValidCombinations', () => {
    it('should generate valid URL combinations for a city', () => {
      const combinations = facetedRouter.generateValidCombinations('dallas-tx', 2);
      
      expect(combinations).toContain('/electricity-plans/dallas-tx/');
      expect(combinations.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid city', () => {
      vi.mocked(tdspMapping.getTdspFromCity).mockReturnValue(null);
      
      const combinations = facetedRouter.generateValidCombinations('invalid-city');
      
      expect(combinations).toEqual([]);
    });
  });

  describe('generatePageTitle', () => {
    it('should generate title for city page', () => {
      const title = facetedRouter.generatePageTitle('Dallas', []);
      
      expect(title).toBe('Best Electricity Plans in Dallas, TX | Compare Energy Rates');
    });

    it('should generate title for filtered page', () => {
      const appliedFilters = [{
        type: 'term' as const,
        urlSegment: '12-month',
        apiParam: 'term',
        value: 12,
        displayName: '12-Month Contract'
      }];
      
      const title = facetedRouter.generatePageTitle('Dallas', appliedFilters);
      
      expect(title).toBe('12-Month Contract Electricity Plans in Dallas, TX | Compare Rates');
    });

    it('should generate title for multiple filters', () => {
      const appliedFilters = [
        {
          type: 'term' as const,
          urlSegment: '12-month',
          apiParam: 'term',
          value: 12,
          displayName: '12-Month Contract'
        },
        {
          type: 'green_energy' as const,
          urlSegment: 'green-energy',
          apiParam: 'percent_green',
          value: 100,
          displayName: '100% Green Energy'
        }
      ];
      
      const title = facetedRouter.generatePageTitle('Dallas', appliedFilters);
      
      expect(title).toBe('12-Month Contract + 100% Green Energy Electricity Plans in Dallas, TX | Compare Rates');
    });
  });

  describe('getFilterDescription', () => {
    it('should generate description for city page', () => {
      const description = facetedRouter.getFilterDescription('Dallas', []);
      
      expect(description).toBe('Compare electricity plans in Dallas, Texas. Find the best energy rates and switch providers.');
    });

    it('should generate description for filtered page', () => {
      const appliedFilters = [{
        type: 'term' as const,
        urlSegment: '12-month',
        apiParam: 'term',
        value: 12,
        displayName: '12-Month Contract'
      }];
      
      const description = facetedRouter.getFilterDescription('Dallas', appliedFilters);
      
      expect(description).toBe('Find 12-Month Contract electricity plans in Dallas, Texas. Compare rates from top energy providers.');
    });
  });

  describe('getBreadcrumbs', () => {
    it('should generate breadcrumbs for city page', () => {
      const breadcrumbs = facetedRouter.getBreadcrumbs('dallas-tx', 'Dallas', []);
      
      expect(breadcrumbs).toEqual([
        { name: 'Home', url: '/' },
        { name: 'Texas Electricity', url: '/texas/' },
        { name: 'Dallas Plans', url: '/electricity-plans/dallas-tx/' }
      ]);
    });

    it('should generate breadcrumbs for filtered page', () => {
      const appliedFilters = [{
        type: 'term' as const,
        urlSegment: '12-month',
        apiParam: 'term',
        value: 12,
        displayName: '12-Month Contract'
      }];
      
      const breadcrumbs = facetedRouter.getBreadcrumbs('dallas-tx', 'Dallas', appliedFilters);
      
      expect(breadcrumbs).toEqual([
        { name: 'Home', url: '/' },
        { name: 'Texas Electricity', url: '/texas/' },
        { name: 'Dallas Plans', url: '/electricity-plans/dallas-tx/' },
        { name: '12-Month Contract', url: '/electricity-plans/dallas-tx/12-month/' }
      ]);
    });
  });
});