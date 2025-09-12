/**
 * TDSP Validation System
 * Validates all TDSP mappings against the ComparePower API
 * Ensures data integrity and identifies coverage gaps
 */

import { comparePowerClient } from './comparepower-client';
import { tdspMapping, type TdspMapping } from '../../config/tdsp-mapping';
import type { ApiParams } from '../../types/facets';

export interface TdspValidationResult {
  duns: string;
  citySlug: string;
  name: string;
  zone: string;
  tier: number;
  priority: number;
  isValid: boolean;
  plansFound: number;
  responseTime: number;
  error?: string;
  lastValidated: Date;
}

export interface ValidationSummary {
  totalCities: number;
  validCities: number;
  invalidCities: number;
  totalPlans: number;
  averageResponseTime: number;
  coverageByZone: Record<string, { valid: number; invalid: number; total: number }>;
  coverageByTier: Record<number, { valid: number; invalid: number; total: number }>;
  errors: Array<{ citySlug: string; error: string }>;
  recommendations: string[];
  timestamp: Date;
}

export class TdspValidator {
  private results: Map<string, TdspValidationResult> = new Map();
  private isValidating = false;

  /**
   * Validate all TDSP mappings
   */
  async validateAllMappings(): Promise<ValidationSummary> {
    if (this.isValidating) {
      throw new Error('Validation is already in progress');
    }

    this.isValidating = true;
    console.warn('Starting comprehensive TDSP validation...');

    try {
      const cities = Object.entries(tdspMapping);
      const batchSize = 5; // Process in batches to avoid overwhelming the API
      
      for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        const batchPromises = batch.map(([citySlug, config]) =>
          this.validateSingleTdsp(citySlug, config)
        );

        await Promise.all(batchPromises);
        
        // Progress logging
        console.warn(`Validated ${Math.min(i + batchSize, cities.length)}/${cities.length} cities`);
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < cities.length) {
          await this.sleep(1000);
        }
      }

      return this.generateSummary();
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Validate a single TDSP mapping
   */
  async validateSingleTdsp(
    citySlug: string, 
    config: TdspMapping[string]
  ): Promise<TdspValidationResult> {
    const startTime = Date.now();
    
    try {
      const params: ApiParams = {
        tdsp_duns: config.duns,
        display_usage: 1000
      };

      const plans = await comparePowerClient.fetchPlans(params);
      const responseTime = Date.now() - startTime;
      
      const result: TdspValidationResult = {
        duns: config.duns,
        citySlug,
        name: config.name,
        zone: config.zone,
        tier: config.tier,
        priority: config.priority,
        isValid: plans.length > 0,
        plansFound: plans.length,
        responseTime,
        lastValidated: new Date()
      };

      if (plans.length === 0) {
        result.error = 'No plans returned from API';
      }

      this.results.set(citySlug, result);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: TdspValidationResult = {
        duns: config.duns,
        citySlug,
        name: config.name,
        zone: config.zone,
        tier: config.tier,
        priority: config.priority,
        isValid: false,
        plansFound: 0,
        responseTime,
        error: errorMessage,
        lastValidated: new Date()
      };

      this.results.set(citySlug, result);
      return result;
    }
  }

  /**
   * Quick validation with basic connectivity check
   */
  async validateConnectivity(): Promise<{
    uniqueTdsps: Array<{ duns: string; name: string; isValid: boolean; error?: string }>;
    summary: { total: number; valid: number; invalid: number };
  }> {
    console.warn('Running quick TDSP connectivity check...');
    
    // Get unique TDSP DUNS numbers
    const uniqueTdsps = Array.from(
      new Set(Object.values(tdspMapping).map(config => config.duns))
    ).map(duns => {
      const config = Object.values(tdspMapping).find(c => c.duns === duns)!;
      return { duns, name: config.name };
    });

    const results = await Promise.all(
      uniqueTdsps.map(async ({ duns, name }) => {
        try {
          const params: ApiParams = { tdsp_duns: duns, display_usage: 1000 };
          const plans = await comparePowerClient.fetchPlans(params);
          return {
            duns,
            name,
            isValid: plans.length > 0,
            plansFound: plans.length
          };
        } catch (error) {
          return {
            duns,
            name,
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const validCount = results.filter(r => r.isValid).length;
    
    return {
      uniqueTdsps: results,
      summary: {
        total: results.length,
        valid: validCount,
        invalid: results.length - validCount
      }
    };
  }

  /**
   * Validate specific cities by tier/zone
   */
  async validateByTier(tier: number): Promise<TdspValidationResult[]> {
    const citiesInTier = Object.entries(tdspMapping)
      .filter(([_, config]) => config.tier === tier);

    console.warn(`Validating ${citiesInTier.length} Tier ${tier} cities...`);

    const results = await Promise.all(
      citiesInTier.map(([citySlug, config]) => 
        this.validateSingleTdsp(citySlug, config)
      )
    );

    return results;
  }

  async validateByZone(zone: string): Promise<TdspValidationResult[]> {
    const citiesInZone = Object.entries(tdspMapping)
      .filter(([_, config]) => config.zone === zone);

    console.warn(`Validating ${citiesInZone.length} cities in ${zone} zone...`);

    const results = await Promise.all(
      citiesInZone.map(([citySlug, config]) => 
        this.validateSingleTdsp(citySlug, config)
      )
    );

    return results;
  }

  /**
   * Generate comprehensive validation summary
   */
  private generateSummary(): ValidationSummary {
    const results = Array.from(this.results.values());
    const validResults = results.filter(r => r.isValid);
    const invalidResults = results.filter(r => !r.isValid);
    
    const totalPlans = validResults.reduce((sum, r) => sum + r.plansFound, 0);
    const averageResponseTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
      : 0;

    // Coverage by zone
    const coverageByZone: Record<string, { valid: number; invalid: number; total: number }> = {};
    const coverageByTier: Record<number, { valid: number; invalid: number; total: number }> = {};

    for (const result of results) {
      // Zone coverage
      if (!coverageByZone[result.zone]) {
        coverageByZone[result.zone] = { valid: 0, invalid: 0, total: 0 };
      }
      coverageByZone[result.zone].total++;
      if (result.isValid) {
        coverageByZone[result.zone].valid++;
      } else {
        coverageByZone[result.zone].invalid++;
      }

      // Tier coverage
      if (!coverageByTier[result.tier]) {
        coverageByTier[result.tier] = { valid: 0, invalid: 0, total: 0 };
      }
      coverageByTier[result.tier].total++;
      if (result.isValid) {
        coverageByTier[result.tier].valid++;
      } else {
        coverageByTier[result.tier].invalid++;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, coverageByZone, coverageByTier);

    return {
      totalCities: results.length,
      validCities: validResults.length,
      invalidCities: invalidResults.length,
      totalPlans,
      averageResponseTime: Math.round(averageResponseTime),
      coverageByZone,
      coverageByTier,
      errors: invalidResults.map(r => ({ 
        citySlug: r.citySlug, 
        error: r.error || 'Unknown error' 
      })),
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    results: TdspValidationResult[],
    zoneStats: Record<string, unknown>,
    tierStats: Record<string, unknown>
  ): string[] {
    const recommendations: string[] = [];
    const invalidResults = results.filter(r => !r.isValid);
    const validationRate = results.length > 0 ? (results.length - invalidResults.length) / results.length : 0;

    if (validationRate < 0.95) {
      recommendations.push(`Overall validation rate is ${(validationRate * 100).toFixed(1)}% - investigate failing TDSP mappings`);
    }

    // Zone-specific recommendations
    for (const [zone, stats] of Object.entries(zoneStats)) {
      const zoneRate = stats.total > 0 ? stats.valid / stats.total : 0;
      if (zoneRate < 0.9) {
        recommendations.push(`${zone} zone has low validation rate (${(zoneRate * 100).toFixed(1)}%) - verify TDSP configurations`);
      }
    }

    // Tier-specific recommendations
    const tier1Stats = tierStats[1];
    if (tier1Stats && tier1Stats.valid / tier1Stats.total < 0.98) {
      recommendations.push('Tier 1 cities have validation issues - these are critical for user experience');
    }

    // Performance recommendations
    const avgResponseTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
      : 0;
    
    if (avgResponseTime > 5000) {
      recommendations.push('High average response times detected - consider caching strategies');
    }

    // Specific error patterns
    const commonErrors = this.analyzeErrorPatterns(invalidResults);
    for (const errorPattern of commonErrors) {
      recommendations.push(`Common error detected: ${errorPattern} - review API configuration`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All TDSP mappings are valid and performing well');
    }

    return recommendations;
  }

  /**
   * Analyze error patterns for common issues
   */
  private analyzeErrorPatterns(invalidResults: TdspValidationResult[]): string[] {
    const errorCounts = new Map<string, number>();
    
    for (const result of invalidResults) {
      const error = result.error || 'Unknown error';
      const pattern = this.categorizeError(error);
      errorCounts.set(pattern, (errorCounts.get(pattern) || 0) + 1);
    }

    return Array.from(errorCounts.entries())
      .filter(([_, count]) => count > 1) // Only show patterns that occur multiple times
      .sort(([, a], [, b]) => b - a)
      .map(([pattern, count]) => `${pattern} (${count} occurrences)`);
  }

  /**
   * Categorize errors into common patterns
   */
  private categorizeError(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('timeout') || lowerError.includes('aborted')) {
      return 'Timeout errors';
    }
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'Network connectivity issues';
    }
    if (lowerError.includes('500') || lowerError.includes('server error')) {
      return 'Server errors';
    }
    if (lowerError.includes('401') || lowerError.includes('unauthorized')) {
      return 'Authentication errors';
    }
    if (lowerError.includes('404') || lowerError.includes('not found')) {
      return 'Invalid TDSP configuration';
    }
    if (lowerError.includes('no plans')) {
      return 'No plans available';
    }
    
    return 'Other errors';
  }

  /**
   * Get validation results for a specific city
   */
  getResultForCity(citySlug: string): TdspValidationResult | null {
    return this.results.get(citySlug) || null;
  }

  /**
   * Get all validation results
   */
  getAllResults(): TdspValidationResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Clear validation results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Export validation results to JSON
   */
  exportResults(): string {
    const summary = this.generateSummary();
    const results = this.getAllResults();
    
    return JSON.stringify({
      summary,
      results,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a default instance
export const tdspValidator = new TdspValidator();

// Utility function to run quick validation
export async function quickValidation(): Promise<void> {
  console.warn('Running quick TDSP validation...');
  
  try {
    const connectivity = await tdspValidator.validateConnectivity();
    
    console.warn('TDSP Connectivity Results:');
    console.warn(`Total unique TDSPs: ${connectivity.summary.total}`);
    console.warn(`Valid: ${connectivity.summary.valid}`);
    console.warn(`Invalid: ${connectivity.summary.invalid}`);
    
    if (connectivity.summary.invalid > 0) {
      console.warn('\nInvalid TDSPs:');
      connectivity.uniqueTdsps
        .filter(t => !t.isValid)
        .forEach(t => console.warn(`- ${t.name} (${t.duns}): ${t.error || 'No plans found'}`));
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

// Utility function to run full validation
export async function fullValidation(): Promise<ValidationSummary> {
  console.warn('Running full TDSP validation...');
  
  try {
    const summary = await tdspValidator.validateAllMappings();
    
    console.warn('\n=== TDSP Validation Summary ===');
    console.warn(`Total cities: ${summary.totalCities}`);
    console.warn(`Valid cities: ${summary.validCities}`);
    console.warn(`Invalid cities: ${summary.invalidCities}`);
    console.warn(`Success rate: ${((summary.validCities / summary.totalCities) * 100).toFixed(1)}%`);
    console.warn(`Total plans found: ${summary.totalPlans}`);
    console.warn(`Average response time: ${summary.averageResponseTime}ms`);
    
    if (summary.recommendations.length > 0) {
      console.warn('\n=== Recommendations ===');
      summary.recommendations.forEach((rec, i) => {
        console.warn(`${i + 1}. ${rec}`);
      });
    }
    
    return summary;
  } catch (error) {
    console.error('Full validation failed:', error);
    throw error;
  }
}