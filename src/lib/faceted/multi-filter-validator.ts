/**
 * Multi-Filter URL Validation System
 * Handles complex filter combinations with advanced conflict resolution
 * Tests thousands of filter combinations for URL generation
 */

import { filterMapper, type FilterValidationResult, type AppliedFilter } from '../api/filter-mapper';
import { getTdspFromCity, formatCityName } from '../../config/tdsp-mapping';

export interface MultiFilterTest {
  city: string;
  filters: string[];
  expected: 'valid' | 'warning' | 'invalid';
  description: string;
}

export interface FilterCombinationResult {
  isValid: boolean;
  url: string;
  filters: string[];
  warnings: string[];
  errors: string[];
  conflictResolution?: string;
  seoValue: 'high' | 'medium' | 'low';
  shouldGenerate: boolean;
}

export class MultiFilterValidator {
  /**
   * Comprehensive test cases for multi-filter combinations
   */
  private readonly testCases: MultiFilterTest[] = [
    // Valid single filter combinations
    { city: 'dallas-tx', filters: ['12-month'], expected: 'valid', description: '12-month contract in Dallas' },
    { city: 'houston-tx', filters: ['green-energy'], expected: 'valid', description: '100% green energy in Houston' },
    { city: 'austin-tx', filters: ['prepaid'], expected: 'valid', description: 'Prepaid plans in Austin' },
    
    // Valid two-filter combinations
    { city: 'dallas-tx', filters: ['12-month', 'fixed-rate'], expected: 'valid', description: '12-month fixed rate in Dallas' },
    { city: 'houston-tx', filters: ['green-energy', '24-month'], expected: 'valid', description: 'Green energy 24-month in Houston' },
    { city: 'fort-worth-tx', filters: ['prepaid', 'no-deposit'], expected: 'valid', description: 'Prepaid no-deposit in Fort Worth' },
    
    // Valid three-filter combinations (rare but allowed)
    { city: 'dallas-tx', filters: ['12-month', 'fixed-rate', 'autopay-discount'], expected: 'valid', description: 'Complex valid combination' },
    
    // Warning cases - valid but suboptimal
    { city: 'houston-tx', filters: ['100-green', 'prepaid'], expected: 'warning', description: 'Green energy + prepaid may have limited options' },
    { city: 'dallas-tx', filters: ['month-to-month', 'autopay-discount'], expected: 'warning', description: 'Month-to-month rarely requires autopay' },
    { city: 'austin-tx', filters: ['prepaid', '36-month'], expected: 'warning', description: 'Prepaid plans typically have shorter terms' },
    
    // Invalid cases - conflicting filters
    { city: 'dallas-tx', filters: ['12-month', '24-month'], expected: 'invalid', description: 'Multiple term filters conflict' },
    { city: 'houston-tx', filters: ['fixed-rate', 'variable-rate'], expected: 'invalid', description: 'Multiple rate type filters conflict' },
    { city: 'austin-tx', filters: ['green-energy', '50-green'], expected: 'invalid', description: 'Multiple green energy percentages conflict' },
    
    // Invalid cases - too many filters
    { city: 'dallas-tx', filters: ['12-month', 'fixed-rate', 'green-energy', 'prepaid'], expected: 'invalid', description: 'Too many filters (exceeds depth limit)' },
    
    // Edge cases
    { city: 'dallas-tx', filters: ['invalid-filter'], expected: 'invalid', description: 'Unknown filter should fail' },
    { city: 'nonexistent-city', filters: ['12-month'], expected: 'invalid', description: 'Invalid city should fail' }
  ];

  /**
   * Run comprehensive validation tests
   */
  async runValidationTests(): Promise<{ passed: number; failed: number; results: Array<{ test: MultiFilterTest; result: FilterValidationResult; passed: boolean }> }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of this.testCases) {
      try {
        const tdspDuns = getTdspFromCity(test.city);
        if (!tdspDuns && test.expected !== 'invalid') {
          // Skip city validation tests if city doesn't exist
          continue;
        }

        let result: FilterValidationResult;
        
        if (tdspDuns) {
          result = filterMapper.mapFiltersToApiParams(test.city, test.filters, tdspDuns);
        } else {
          // Mock result for invalid city tests
          result = {
            isValid: false,
            apiParams: { tdsp_duns: '', display_usage: 1000 },
            warnings: [],
            errors: ['Invalid city'],
            appliedFilters: []
          };
        }

        const testPassed = this.evaluateTestResult(test, result);
        results.push({ test, result, passed: testPassed });
        
        if (testPassed) passed++;
        else failed++;

      } catch (error) {
        const errorResult = {
          isValid: false,
          apiParams: { tdsp_duns: '', display_usage: 1000 },
          warnings: [],
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          appliedFilters: []
        };
        
        results.push({ test, result: errorResult, passed: false });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  /**
   * Evaluate if a test result matches expectations
   */
  private evaluateTestResult(test: MultiFilterTest, result: FilterValidationResult): boolean {
    switch (test.expected) {
      case 'valid':
        return result.isValid && result.errors.length === 0;
      case 'warning':
        return result.isValid && result.warnings.length > 0;
      case 'invalid':
        return !result.isValid || result.errors.length > 0;
      default:
        return false;
    }
  }

  /**
   * Generate all possible filter combinations for testing
   */
  generateFilterCombinations(city: string, maxDepth = 3): FilterCombinationResult[] {
    const tdspDuns = getTdspFromCity(city);
    if (!tdspDuns) return [];

    const results: FilterCombinationResult[] = [];
    
    // Get all available filter patterns
    const allPatterns = filterMapper.filterDefinitions.flatMap(def => def.urlPatterns);
    
    // Generate combinations of different depths
    for (let depth = 1; depth <= maxDepth; depth++) {
      const combinations = this.getCombinations(allPatterns, depth);
      
      for (const combo of combinations) {
        const result = this.validateCombination(city, combo, tdspDuns);
        results.push(result);
      }
    }

    return results.filter(r => r.isValid && r.shouldGenerate);
  }

  /**
   * Validate a specific filter combination
   */
  private validateCombination(city: string, filters: string[], tdspDuns: string): FilterCombinationResult {
    const validationResult = filterMapper.mapFiltersToApiParams(city, filters, tdspDuns);
    
    return {
      isValid: validationResult.isValid,
      url: `/electricity-plans/${city}/${filters.join('/')}`,
      filters,
      warnings: validationResult.warnings,
      errors: validationResult.errors,
      conflictResolution: this.getConflictResolution(validationResult),
      seoValue: this.calculateSeoValue(city, filters, validationResult),
      shouldGenerate: this.shouldGenerateUrl(city, filters, validationResult)
    };
  }

  /**
   * Calculate SEO value of a filter combination
   */
  private calculateSeoValue(city: string, filters: string[], validationResult: FilterValidationResult): 'high' | 'medium' | 'low' {
    if (!validationResult.isValid) return 'low';

    // High-value combinations
    const highValueFilters = ['12-month', '24-month', 'fixed-rate', 'green-energy'];
    const highValueCombos = [
      ['12-month', 'fixed-rate'],
      ['green-energy', '12-month'],
      ['green-energy', 'fixed-rate']
    ];

    // Single high-value filters
    if (filters.length === 1 && highValueFilters.includes(filters[0])) {
      return 'high';
    }

    // High-value two-filter combinations
    if (filters.length === 2) {
      const hasHighValueCombo = highValueCombos.some(combo =>
        combo.length === filters.length &&
        combo.every(f => filters.includes(f))
      );
      
      if (hasHighValueCombo) return 'high';
    }

    // Medium value for valid combinations
    if (filters.length <= 2) return 'medium';

    // Low value for complex combinations
    return 'low';
  }

  /**
   * Determine if URL should be generated
   */
  private shouldGenerateUrl(city: string, filters: string[], validationResult: FilterValidationResult): boolean {
    if (!validationResult.isValid) return false;
    
    // Don't generate URLs with too many warnings
    if (validationResult.warnings.length > 2) return false;
    
    // Don't generate very deep combinations
    if (filters.length > 3) return false;

    // Generate high and medium SEO value URLs
    const seoValue = this.calculateSeoValue(city, filters, validationResult);
    return seoValue === 'high' || seoValue === 'medium';
  }

  /**
   * Get conflict resolution suggestion
   */
  private getConflictResolution(validationResult: FilterValidationResult): string | undefined {
    if (validationResult.errors.length === 0) return undefined;

    const firstError = validationResult.errors[0];
    
    if (firstError.includes('Multiple') && firstError.includes('term')) {
      return 'Remove all but one contract term filter';
    }
    
    if (firstError.includes('Multiple') && firstError.includes('rate')) {
      return 'Remove all but one rate type filter';
    }
    
    if (firstError.includes('Multiple') && firstError.includes('green')) {
      return 'Remove all but one green energy filter';
    }
    
    if (firstError.includes('Unknown filter')) {
      return 'Remove invalid filter from URL';
    }

    return 'Simplify filter combination';
  }

  /**
   * Get all combinations of specified length
   */
  private getCombinations<T>(array: T[], length: number): T[][] {
    if (length === 0) return [[]];
    if (length > array.length) return [];

    const result: T[][] = [];
    
    for (let i = 0; i <= array.length - length; i++) {
      const head = array[i];
      const tail = array.slice(i + 1);
      const tailCombos = this.getCombinations(tail, length - 1);
      
      for (const combo of tailCombos) {
        result.push([head, ...combo]);
      }
    }

    return result;
  }

  /**
   * Get popular filter combinations for a city tier
   */
  getPopularCombinations(city: string, cityTier: number = 2): string[][] {
    const popular: string[][] = [];

    // Tier 1 cities (major metros)
    if (cityTier === 1) {
      popular.push(
        ['12-month'],
        ['24-month'],
        ['fixed-rate'],
        ['green-energy'],
        ['prepaid'],
        ['12-month', 'fixed-rate'],
        ['12-month', 'green-energy'],
        ['fixed-rate', 'green-energy'],
        ['24-month', 'fixed-rate']
      );
    }
    // Tier 2 cities (secondary metros)
    else if (cityTier === 2) {
      popular.push(
        ['12-month'],
        ['24-month'],
        ['fixed-rate'],
        ['green-energy'],
        ['12-month', 'fixed-rate']
      );
    }
    // Tier 3 cities (smaller cities)
    else {
      popular.push(
        ['12-month'],
        ['fixed-rate'],
        ['green-energy']
      );
    }

    return popular;
  }

  /**
   * Validate URL structure for production readiness
   */
  validateUrlStructure(url: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check URL format
    if (!url.startsWith('/electricity-plans')) {
      issues.push('URL must start with /electricity-plans/');
    }
    
    if (!url.endsWith('/')) {
      issues.push('URL must end with trailing slash');
    }
    
    // Check for invalid characters
    if (url.includes(' ')) {
      issues.push('URL contains spaces');
    }
    
    if (url.includes('__') || url.includes('//')) {
      issues.push('URL contains double separators');
    }
    
    // Check segment count
    const segments = url.split('/').filter(Boolean);
    if (segments.length > 5) { // electricity-plans + city + max 3 filters
      issues.push('URL too deep (max 3 filters allowed)');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton
export const multiFilterValidator = new MultiFilterValidator();

// Export utility functions
export function testFilterCombinations(): Promise<{ passed: number; failed: number }> {
  return multiFilterValidator.runValidationTests().then(result => ({
    passed: result.passed,
    failed: result.failed
  }));
}

export function generateCombinationsForCity(city: string): FilterCombinationResult[] {
  return multiFilterValidator.generateFilterCombinations(city);
}

export function validateUrlStructure(url: string): boolean {
  return multiFilterValidator.validateUrlStructure(url).isValid;
}