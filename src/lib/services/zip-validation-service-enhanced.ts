/**
 * ZIP Validation Service
 * Core business logic for Texas ZIP code validation and territory mapping
 * Integrates database infrastructure with external API clients
 */

import { db } from '../database/init';
import { zipCodeMappings, cityTerritories, dataSources, validationLogs } from '../database/schema';
import { apiClientFactory } from '../external-apis/client-factory';
import type { 
  ZIPValidationRequest,
  ZIPValidationResponse,
  ZIPValidationResult,
  ZIPValidationSummary
} from '../../types/zip-validation';
import { eq, and, desc, gte } from 'drizzle-orm';

export interface ZIPValidationOptions {
  sources?: string[];
  requireMultipleSources?: boolean;
  conflictResolution?: 'highest_confidence' | 'majority_vote' | 'latest_data';
  enableFallback?: boolean;
  forceRefresh?: boolean;
  maxRetries?: number;
  timeout?: number;
  bypassDatabase?: boolean;
}

export class ZIPValidationService {
  private cache: Map<string, { data: ZIPValidationResult; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 21600000; // 6 hours
  private readonly CACHE_CLEANUP_INTERVAL = 3600000; // 1 hour
  
  constructor() {
    // Start cache cleanup
    setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Validate a single ZIP code
   */
  async validateZIP(
    zipCode: string, 
    options: ZIPValidationOptions = {}
  ): Promise<ZIPValidationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Input validation
      if (!this.isValidZipCodeFormat(zipCode)) {
        return this.createFailureResult(zipCode, 'INVALID_ZIP', 'Invalid ZIP code format', startTime);
      }

      if (!this.isTexasZipCode(zipCode)) {
        return this.createFailureResult(zipCode, 'NOT_TEXAS', 'ZIP code is not in Texas', startTime);
      }

      // Check cache first (unless force refresh)
      if (!options.forceRefresh) {
        const cachedResult = this.getCachedResult(zipCode);
        if (cachedResult) {
          await this.logValidation(zipCode, cachedResult, requestId, true);
          return cachedResult;
        }
      }

      // Check database for existing validated mapping
      let result = await this.getStoredValidation(zipCode);
      
      // If no stored data or force refresh, validate with external APIs
      if (!result || options.forceRefresh || this.isStaleData(result)) {
        result = await this.validateWithExternalSources(zipCode, options);
        
        // Store successful validation in database
        if (result.success && !options.bypassDatabase) {
          await this.storeValidation(zipCode, result);
        }
      }

      // Cache the result
      this.cacheResult(zipCode, result);
      
      // Log the validation
      await this.logValidation(zipCode, result, requestId, false);
      
      return result;
      
    } catch (error: any) {
      const failureResult = this.createFailureResult(
        zipCode, 
        'API_ERROR', 
        error.message, 
        startTime
      );
      
      await this.logValidation(zipCode, failureResult, 'single_error', false);
      return failureResult;
    }
  }

  /**
   * Validate multiple ZIP codes in bulk
   */
  async validateBulk(request: ZIPValidationRequest): Promise<ZIPValidationResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const results: ZIPValidationResult[] = [];
    
    try {
      console.log(`🚀 Starting bulk validation for ${request.zipCodes.length} ZIP codes`);
      
      // Process ZIP codes in batches to manage resources
      const batchSize = 10;
      const batches = this.createBatches(request.zipCodes, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} ZIP codes)`);
        
        // Process batch concurrently
        const batchPromises = batch.map(zipCode => 
          this.validateZIP(zipCode, {
            sources: request.sources,
            enableFallback: request.enableFallback,
            forceRefresh: request.forceRefresh
          })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Collect results
        batchResults.forEach((promiseResult, index) => {
          const zipCode = batch[index];
          if (promiseResult.status === 'fulfilled') {
            results.push(promiseResult.value);
          } else {
            results.push(this.createFailureResult(
              zipCode, 
              'API_ERROR', 
              promiseResult.reason?.message || 'Validation failed', 
              startTime
            ));
          }
        });
        
        // Add delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await this.sleep(1000);
        }
      }
      
      const processingTime = Date.now() - startTime;
      const summary = this.createValidationSummary(request.zipCodes, results, processingTime);
      
      console.log(`✅ Bulk validation completed: ${summary.successCount}/${summary.totalRequested} successful`);
      
      return {
        success: true,
        results,
        summary,
        requestId,
        processingTime
      };
      
    } catch (error: any) {
      console.error('❌ Bulk validation failed:', error);
      
      return {
        success: false,
        results,
        error: error.message,
        summary: this.createValidationSummary(request.zipCodes, results, Date.now() - startTime),
        requestId,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate ZIP code using external data sources
   */
  private async validateWithExternalSources(
    zipCode: string, 
    options: ZIPValidationOptions
  ): Promise<ZIPValidationResult> {
    const startTime = Date.now();
    const sources = options.sources || ['ercot', 'puct', 'oncor'];
    const validationSources = [];
    
    try {
      // Get appropriate clients for this ZIP code
      const clients = options.sources 
        ? this.getClientsByNames(options.sources)
        : apiClientFactory.createClientsForZipCode(zipCode);
      
      if (clients.length === 0) {
        throw new Error('No available data sources for validation');
      }
      
      // Validate with multiple sources concurrently
      const validationPromises = clients.map(async (client, index) => {
        try {
          const sourceStartTime = Date.now();
          const clientConfig = await client.getConfiguration();
          const results = await client.validateZipCodes([zipCode]);
          const sourceTime = Date.now() - sourceStartTime;
          
          if (results.length > 0) {
            return {
              source: clientConfig.name,
              slug: this.getClientSlug(clientConfig.name),
              result: results[0],
              responseTime: sourceTime,
              success: results[0].isValid,
              confidence: results[0].confidence || 0
            };
          }
          
          throw new Error('No results returned from source');
        } catch (error: any) {
          return {
            source: 'unknown',
            slug: sources[index] || 'unknown',
            error: error.message,
            responseTime: 0,
            success: false,
            confidence: 0
          };
        }
      });
      
      const sourceResults = await Promise.allSettled(validationPromises);
      
      // Process source results
      sourceResults.forEach(result => {
        if (result.status === 'fulfilled') {
          validationSources.push(result.value);
        } else {
          validationSources.push({
            source: 'error',
            slug: 'error',
            error: result.reason?.message || 'Unknown error',
            responseTime: 0,
            success: false,
            confidence: 0
          });
        }
      });
      
      // Find successful validations
      const successfulSources = validationSources.filter(source => source.success);
      
      if (successfulSources.length === 0) {
        // No successful validations - try fallback
        if (options.enableFallback) {
          return await this.validateWithFallback(zipCode, startTime);
        }
        
        throw new Error('No successful validations from any source');
      }
      
      // Resolve conflicts if multiple sources
      const bestResult = this.resolveSourceConflicts(
        successfulSources, 
        options.conflictResolution || 'highest_confidence'
      );
      
      // Create final result
      const processingTime = Date.now() - startTime;
      const conflicts = successfulSources.length > 1 ? this.detectConflicts(successfulSources) : undefined;
      
      return {
        zipCode,
        success: true,
        citySlug: bestResult.result.cityName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        cityDisplayName: bestResult.result.cityName || 'Unknown',
        tdspDuns: bestResult.result.tdspDuns || '',
        tdspName: bestResult.result.tdspName || 'Unknown TDSP',
        serviceType: bestResult.result.serviceType || 'deregulated',
        confidence: bestResult.confidence,
        dataSource: bestResult.slug,
        planCount: await this.getPlanCountForCity(bestResult.result.cityName),
        redirectUrl: this.generateRedirectUrl(bestResult.result.cityName),
        processingTime,
        validationDetails: {
          sources: validationSources,
          method: 'multi_source',
          validatedAt: new Date(),
          nextValidation: new Date(Date.now() + this.DEFAULT_TTL)
        },
        conflicts
      };
      
    } catch (error: any) {
      return this.createFailureResult(zipCode, 'API_ERROR', error.message, startTime);
    }
  }

  /**
   * Fallback validation using cached data or nearest city
   */
  private async validateWithFallback(zipCode: string, startTime: number): Promise<ZIPValidationResult> {
    try {
      // Try to find nearest validated ZIP codes
      const nearestResults = await this.findNearestValidatedZips(zipCode);
      
      if (nearestResults.length > 0) {
        const nearest = nearestResults[0];
        
        return {
          zipCode,
          success: true,
          citySlug: nearest.citySlug,
          cityDisplayName: nearest.cityDisplayName,
          tdspDuns: nearest.tdspDuns,
          tdspName: nearest.tdspName,
          serviceType: nearest.serviceType,
          confidence: Math.max(0, nearest.confidence - 20), // Reduce confidence for fallback
          dataSource: 'fallback_nearest',
          planCount: nearest.planCount,
          redirectUrl: this.generateRedirectUrl(nearest.cityDisplayName),
          processingTime: Date.now() - startTime,
          validationDetails: {
            sources: [{
              source: 'fallback',
              slug: 'fallback_nearest',
              success: true,
              confidence: nearest.confidence - 20,
              responseTime: Date.now() - startTime
            }],
            method: 'fallback_nearest',
            validatedAt: new Date(),
            nextValidation: new Date(Date.now() + this.DEFAULT_TTL / 2) // Shorter TTL for fallback
          }
        };
      }
      
      // If no nearest results, return failure
      throw new Error('No fallback data available');
      
    } catch (error: any) {
      return this.createFailureResult(zipCode, 'NOT_FOUND', 'ZIP code not found and no fallback available', startTime);
    }
  }

  /**
   * Get stored validation from database
   */
  async getStoredValidation(zipCode: string): Promise<ZIPValidationResult | null> {
    try {
      const stored = await db
        .select()
        .from(zipCodeMappings)
        .where(eq(zipCodeMappings.zipCode, zipCode))
        .limit(1);
      
      if (stored.length === 0) {
        return null;
      }
      
      const mapping = stored[0];
      
      return {
        zipCode,
        success: true,
        citySlug: mapping.citySlug,
        cityDisplayName: mapping.cityDisplayName,
        tdspDuns: mapping.tdspDuns,
        tdspName: mapping.tdspName,
        serviceType: mapping.serviceType,
        confidence: mapping.confidence,
        dataSource: mapping.dataSource,
        planCount: await this.getPlanCountForCity(mapping.cityDisplayName),
        redirectUrl: this.generateRedirectUrl(mapping.cityDisplayName),
        processingTime: 0,
        validationDetails: {
          sources: [{
            source: mapping.dataSource,
            slug: mapping.dataSource,
            success: true,
            confidence: mapping.confidence,
            responseTime: 0
          }],
          method: 'database',
          validatedAt: mapping.lastValidated,
          nextValidation: new Date(mapping.lastValidated.getTime() + this.DEFAULT_TTL)
        }
      };
      
    } catch (error) {
      console.error('Error retrieving stored validation:', error);
      return null;
    }
  }

  /**
   * Store validation result in database
   */
  private async storeValidation(zipCode: string, result: ZIPValidationResult): Promise<void> {
    try {
      // Insert or update ZIP code mapping
      await db
        .insert(zipCodeMappings)
        .values({
          zipCode,
          citySlug: result.citySlug,
          cityDisplayName: result.cityDisplayName,
          tdspDuns: result.tdspDuns,
          tdspName: result.tdspName,
          serviceType: result.serviceType,
          confidence: result.confidence,
          dataSource: result.dataSource,
          lastValidated: new Date(),
          isActive: true
        })
        .onConflictDoUpdate({
          target: zipCodeMappings.zipCode,
          set: {
            citySlug: result.citySlug,
            cityDisplayName: result.cityDisplayName,
            tdspDuns: result.tdspDuns,
            tdspName: result.tdspName,
            serviceType: result.serviceType,
            confidence: result.confidence,
            dataSource: result.dataSource,
            lastValidated: new Date(),
            updatedAt: new Date()
          }
        });
      
      console.log(`💾 Stored validation for ZIP ${zipCode} -> ${result.cityDisplayName}`);
      
    } catch (error) {
      console.error(`❌ Failed to store validation for ZIP ${zipCode}:`, error);
    }
  }

  /**
   * Log validation attempt
   */
  private async logValidation(
    zipCode: string, 
    result: ZIPValidationResult, 
    requestId: string,
    cacheHit: boolean
  ): Promise<void> {
    try {
      // Get data source ID (simplified - would look up from database)
      const dataSourceId = await this.getDataSourceId(result.dataSource);
      
      await db.insert(validationLogs).values({
        zipCode,
        validationType: 'single',
        requestId,
        dataSourceId: dataSourceId || '00000000-0000-0000-0000-000000000000',
        dataSourceSlug: result.dataSource,
        isValid: result.success,
        confidence: result.confidence,
        citySlug: result.citySlug,
        cityDisplayName: result.cityDisplayName,
        tdspDuns: result.tdspDuns,
        tdspName: result.tdspName,
        serviceType: result.serviceType,
        requestPayload: { zipCode },
        responseData: result.validationDetails || {},
        processingTime: result.processingTime,
        cacheHit,
        errorCode: result.success ? undefined : 'VALIDATION_FAILED',
        errorMessage: result.error,
        validatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Failed to log validation:', error);
      // Don't throw - logging failures shouldn't break validation
    }
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentLogs = await db
        .select()
        .from(validationLogs)
        .where(gte(validationLogs.validatedAt, last24Hours));
      
      const totalValidations = recentLogs.length;
      const successfulValidations = recentLogs.filter(log => log.isValid).length;
      const cacheHits = recentLogs.filter(log => log.cacheHit).length;
      
      return {
        totalValidations,
        successfulValidations,
        successRate: totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0,
        cacheHitRate: totalValidations > 0 ? (cacheHits / totalValidations) * 100 : 0,
        averageResponseTime: totalValidations > 0 
          ? recentLogs.reduce((sum, log) => sum + log.processingTime, 0) / totalValidations 
          : 0,
        cacheSize: this.cache.size,
        period: '24_hours'
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return {
        totalValidations: 0,
        successfulValidations: 0,
        successRate: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        cacheSize: this.cache.size,
        error: error.message
      };
    }
  }

  // Helper methods
  
  private isValidZipCodeFormat(zipCode: string): boolean {
    return /^\d{5}$/.test(zipCode);
  }
  
  private isTexasZipCode(zipCode: string): boolean {
    const num = parseInt(zipCode, 10);
    return num >= 73000 && num <= 79999;
  }
  
  private isStaleData(result: ZIPValidationResult): boolean {
    if (!result.validationDetails?.nextValidation) return true;
    return new Date() > result.validationDetails.nextValidation;
  }
  
  private createFailureResult(
    zipCode: string, 
    errorCode: string, 
    errorMessage: string, 
    startTime: number
  ): ZIPValidationResult {
    return {
      zipCode,
      success: false,
      confidence: 0,
      dataSource: 'error',
      error: errorMessage,
      processingTime: Date.now() - startTime,
      validationDetails: {
        sources: [],
        method: 'error',
        validatedAt: new Date(),
        nextValidation: new Date(Date.now() + 300000) // 5 min for errors
      }
    };
  }
  
  private generateRequestId(): string {
    return `zip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private createValidationSummary(
    requested: string[], 
    results: ZIPValidationResult[], 
    processingTime: number
  ): ZIPValidationSummary {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return {
      totalRequested: requested.length,
      totalProcessed: results.length,
      successCount,
      failureCount,
      averageConfidence: successCount > 0 
        ? results.filter(r => r.success).reduce((sum, r) => sum + r.confidence, 0) / successCount 
        : 0,
      averageProcessingTime: results.length > 0
        ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
        : 0,
      totalProcessingTime: processingTime
    };
  }

  // Cache management
  
  private getCachedResult(zipCode: string): ZIPValidationResult | null {
    const cached = this.cache.get(zipCode);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    return null;
  }
  
  private cacheResult(zipCode: string, result: ZIPValidationResult): void {
    this.cache.set(zipCode, {
      data: result,
      timestamp: Date.now(),
      ttl: result.success ? this.DEFAULT_TTL : 300000 // 5 min for failures
    });
  }
  
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Additional helper methods (simplified implementations)
  
  private getClientsByNames(names: string[]) {
    const clients = [];
    for (const name of names) {
      const client = apiClientFactory.getClient(name);
      if (client) clients.push(client);
    }
    return clients;
  }
  
  private getClientSlug(name: string): string {
    const slugMap: Record<string, string> = {
      'ERCOT MIS API': 'ercot_mis',
      'PUCT REP Directory': 'puct_rep_directory',
      'Oncor Electric Delivery API': 'oncor_territory_api'
    };
    return slugMap[name] || name.toLowerCase().replace(/\s+/g, '_');
  }
  
  private resolveSourceConflicts(sources: any[], resolution: string): any {
    switch (resolution) {
      case 'highest_confidence':
        return sources.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
      case 'majority_vote':
        // Simplified majority vote implementation
        return sources[0];
      default:
        return sources[0];
    }
  }
  
  private detectConflicts(sources: any[]): any[] | undefined {
    // Simplified conflict detection
    return sources.length > 1 ? [] : undefined;
  }
  
  private async getPlanCountForCity(cityName?: string): Promise<number> {
    // Mock implementation - would query actual plan data
    if (!cityName) return 0;
    
    const majorCities: Record<string, number> = {
      'Dallas': 45, 'Houston': 52, 'Austin': 38, 'Fort Worth': 41,
      'San Antonio': 35, 'El Paso': 18, 'Arlington': 33
    };
    
    return majorCities[cityName] || 15;
  }
  
  private generateRedirectUrl(cityName?: string): string {
    if (!cityName) return '/electricity-plans/texas/';
    
    const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
    return `/electricity-plans/${citySlug}-tx/`;
  }
  
  private async findNearestValidatedZips(zipCode: string): Promise<any[]> {
    try {
      // Find ZIP codes with similar prefixes
      const prefix = zipCode.substring(0, 3);
      
      const nearbyResults = await db
        .select()
        .from(zipCodeMappings)
        .where(
          and(
            eq(zipCodeMappings.isActive, true),
            gte(zipCodeMappings.confidence, 80)
          )
        )
        .orderBy(desc(zipCodeMappings.confidence))
        .limit(5);
      
      return nearbyResults.filter(result => 
        result.zipCode.startsWith(prefix)
      );
      
    } catch (error) {
      console.error('Error finding nearest validated ZIPs:', error);
      return [];
    }
  }
  
  private async getDataSourceId(sourceSlug: string): Promise<string | null> {
    try {
      const source = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.slug, sourceSlug))
        .limit(1);
      
      return source.length > 0 ? source[0].id : null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const zipValidationService = new ZIPValidationService();