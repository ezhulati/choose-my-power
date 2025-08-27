import { describe, it, expect } from 'vitest';
import {
  addFilterToUrl,
  removeFilterFromUrl,
  extractFiltersFromPath,
  parseUrlFilters,
  isHighValuePage
} from '../../../src/lib/faceted/url-parser';

describe('URL Parser', () => {
  describe('extractFiltersFromPath', () => {
    it('should extract no filters from base city path', () => {
      const path = '/texas/dallas/electricity-plans';
      const filters = extractFiltersFromPath(path);
      expect(filters).toEqual([]);
    });

    it('should extract single filter from path', () => {
      const path = '/texas/houston/electricity-plans/12-month';
      const filters = extractFiltersFromPath(path);
      expect(filters).toEqual(['12-month']);
    });

    it('should extract multiple filters from path', () => {
      const path = '/texas/austin/electricity-plans/12-month+fixed-rate+green-energy';
      const filters = extractFiltersFromPath(path);
      expect(filters).toEqual(['12-month', 'fixed-rate', 'green-energy']);
    });

    it('should handle empty filter segments', () => {
      const path = '/texas/dallas/electricity-plans/12-month++fixed-rate';
      const filters = extractFiltersFromPath(path);
      expect(filters).toEqual(['12-month', 'fixed-rate']);
    });

    it('should return empty array for invalid paths', () => {
      expect(extractFiltersFromPath('/invalid/path')).toEqual([]);
      expect(extractFiltersFromPath('/texas/dallas/other-page')).toEqual([]);
      expect(extractFiltersFromPath('')).toEqual([]);
    });
  });

  describe('parseUrlFilters', () => {
    it('should parse city and filters correctly', () => {
      const url = '/texas/fort-worth/electricity-plans/24-month+variable-rate';
      const result = parseUrlFilters(url);
      
      expect(result).toEqual({
        city: 'fort-worth',
        filters: ['24-month', 'variable-rate']
      });
    });

    it('should handle city without filters', () => {
      const url = '/texas/dallas/electricity-plans';
      const result = parseUrlFilters(url);
      
      expect(result).toEqual({
        city: 'dallas',
        filters: []
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const url = '/invalid/path';
      const result = parseUrlFilters(url);
      
      expect(result).toEqual({
        city: '',
        filters: []
      });
    });
  });

  describe('addFilterToUrl', () => {
    it('should add filter to base city path', () => {
      const currentPath = '/texas/dallas/electricity-plans';
      const result = addFilterToUrl(currentPath, '12-month');
      
      expect(result).toBe('/texas/dallas/electricity-plans/12-month');
    });

    it('should add filter to existing filtered path', () => {
      const currentPath = '/texas/houston/electricity-plans/fixed-rate';
      const result = addFilterToUrl(currentPath, 'green-energy');
      
      expect(result).toBe('/texas/houston/electricity-plans/fixed-rate+green-energy');
    });

    it('should sort filters alphabetically', () => {
      const currentPath = '/texas/austin/electricity-plans/green-energy';
      const result = addFilterToUrl(currentPath, '12-month');
      
      expect(result).toBe('/texas/austin/electricity-plans/12-month+green-energy');
    });

    it('should not add duplicate filters', () => {
      const currentPath = '/texas/dallas/electricity-plans/12-month+fixed-rate';
      const result = addFilterToUrl(currentPath, '12-month');
      
      expect(result).toBe('/texas/dallas/electricity-plans/12-month+fixed-rate');
    });

    it('should handle multiple existing filters', () => {
      const currentPath = '/texas/fort-worth/electricity-plans/fixed-rate+prepaid';
      const result = addFilterToUrl(currentPath, 'autopay-discount');
      
      expect(result).toBe('/texas/fort-worth/electricity-plans/autopay-discount+fixed-rate+prepaid');
    });

    it('should handle invalid paths gracefully', () => {
      const currentPath = '/invalid/path';
      const result = addFilterToUrl(currentPath, 'fixed-rate');
      
      expect(result).toBe('/invalid/path');
    });
  });

  describe('removeFilterFromUrl', () => {
    it('should remove filter and maintain base city path', () => {
      const currentPath = '/texas/dallas/electricity-plans/12-month';
      const result = removeFilterFromUrl(currentPath, '12-month');
      
      expect(result).toBe('/texas/dallas/electricity-plans');
    });

    it('should remove filter from multi-filter path', () => {
      const currentPath = '/texas/houston/electricity-plans/12-month+fixed-rate+green-energy';
      const result = removeFilterFromUrl(currentPath, 'fixed-rate');
      
      expect(result).toBe('/texas/houston/electricity-plans/12-month+green-energy');
    });

    it('should maintain filter order after removal', () => {
      const currentPath = '/texas/austin/electricity-plans/autopay-discount+fixed-rate+prepaid';
      const result = removeFilterFromUrl(currentPath, 'fixed-rate');
      
      expect(result).toBe('/texas/austin/electricity-plans/autopay-discount+prepaid');
    });

    it('should handle non-existent filter gracefully', () => {
      const currentPath = '/texas/dallas/electricity-plans/12-month+fixed-rate';
      const result = removeFilterFromUrl(currentPath, 'non-existent');
      
      expect(result).toBe('/texas/dallas/electricity-plans/12-month+fixed-rate');
    });

    it('should handle removing from base path gracefully', () => {
      const currentPath = '/texas/fort-worth/electricity-plans';
      const result = removeFilterFromUrl(currentPath, 'non-existent');
      
      expect(result).toBe('/texas/fort-worth/electricity-plans');
    });

    it('should handle invalid paths gracefully', () => {
      const currentPath = '/invalid/path';
      const result = removeFilterFromUrl(currentPath, 'fixed-rate');
      
      expect(result).toBe('/invalid/path');
    });
  });

  describe('isHighValuePage', () => {
    it('should consider base city pages as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans')).toBe(true);
      expect(isHighValuePage('/texas/houston/electricity-plans')).toBe(true);
    });

    it('should consider high-value single filters as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans/12-month')).toBe(true);
      expect(isHighValuePage('/texas/houston/electricity-plans/24-month')).toBe(true);
      expect(isHighValuePage('/texas/austin/electricity-plans/fixed-rate')).toBe(true);
      expect(isHighValuePage('/texas/fort-worth/electricity-plans/variable-rate')).toBe(true);
      expect(isHighValuePage('/texas/dallas/electricity-plans/green-energy')).toBe(true);
      expect(isHighValuePage('/texas/houston/electricity-plans/prepaid')).toBe(true);
      expect(isHighValuePage('/texas/austin/electricity-plans/no-deposit')).toBe(true);
    });

    it('should not consider low-value single filters as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans/obscure-filter')).toBe(false);
      expect(isHighValuePage('/texas/houston/electricity-plans/very-specific')).toBe(false);
    });

    it('should consider high-value two-filter combinations as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans/12-month+fixed-rate')).toBe(true);
      expect(isHighValuePage('/texas/houston/electricity-plans/24-month+fixed-rate')).toBe(true);
      expect(isHighValuePage('/texas/austin/electricity-plans/green-energy+12-month')).toBe(true);
      expect(isHighValuePage('/texas/fort-worth/electricity-plans/fixed-rate+green-energy')).toBe(true);
      expect(isHighValuePage('/texas/dallas/electricity-plans/no-deposit+prepaid')).toBe(true);
      expect(isHighValuePage('/texas/houston/electricity-plans/12-month+autopay-discount')).toBe(true);
      expect(isHighValuePage('/texas/austin/electricity-plans/autopay-discount+fixed-rate')).toBe(true);
    });

    it('should not consider low-value two-filter combinations as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans/12-month+obscure-filter')).toBe(false);
      expect(isHighValuePage('/texas/houston/electricity-plans/random-filter+variable-rate')).toBe(false);
    });

    it('should not consider three or more filters as high value', () => {
      expect(isHighValuePage('/texas/dallas/electricity-plans/12-month+fixed-rate+green-energy')).toBe(false);
      expect(isHighValuePage('/texas/houston/electricity-plans/autopay+fixed-rate+green+prepaid')).toBe(false);
    });

    it('should handle invalid paths gracefully', () => {
      expect(isHighValuePage('/invalid/path')).toBe(false);
      expect(isHighValuePage('')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with trailing slashes', () => {
      const filters = extractFiltersFromPath('/texas/dallas/electricity-plans/12-month/');
      expect(filters).toEqual(['12-month']);
    });

    it('should handle URLs with query parameters', () => {
      const filters = extractFiltersFromPath('/texas/dallas/electricity-plans/12-month?utm_source=google');
      expect(filters).toEqual(['12-month']);
    });

    it('should handle URLs with hash fragments', () => {
      const filters = extractFiltersFromPath('/texas/dallas/electricity-plans/12-month#section');
      expect(filters).toEqual(['12-month']);
    });

    it('should handle malformed filter combinations', () => {
      const filters = extractFiltersFromPath('/texas/dallas/electricity-plans/+12-month++fixed-rate+');
      expect(filters).toEqual(['12-month', 'fixed-rate']);
    });

    it('should preserve case sensitivity in city names', () => {
      const result = parseUrlFilters('/texas/Fort-Worth/electricity-plans/fixed-rate');
      expect(result.city).toBe('Fort-Worth');
    });

    it('should handle special characters in filter names', () => {
      const currentPath = '/texas/dallas/electricity-plans';
      const result = addFilterToUrl(currentPath, 'time-of-use');
      expect(result).toBe('/texas/dallas/electricity-plans/time-of-use');
    });

    it('should maintain consistency in filter ordering across operations', () => {
      let currentPath = '/texas/dallas/electricity-plans';
      
      // Add filters in different orders
      currentPath = addFilterToUrl(currentPath, 'green-energy');
      currentPath = addFilterToUrl(currentPath, '12-month');
      currentPath = addFilterToUrl(currentPath, 'fixed-rate');
      
      expect(currentPath).toBe('/texas/dallas/electricity-plans/12-month+fixed-rate+green-energy');
      
      // Remove and re-add should maintain order
      currentPath = removeFilterFromUrl(currentPath, 'fixed-rate');
      currentPath = addFilterToUrl(currentPath, 'fixed-rate');
      
      expect(currentPath).toBe('/texas/dallas/electricity-plans/12-month+fixed-rate+green-energy');
    });
  });
});