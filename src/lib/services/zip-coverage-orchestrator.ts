/**
 * ZIP Coverage Orchestrator Service
 * Orchestrates all ZIP coverage services for comprehensive Texas electricity market coverage
 * Coordinates database, external APIs, analytics, and city coverage management
 */

import { zipValidationService } from './zip-validation-service';
import { tdspService } from './tdsp-service';
import { analyticsService } from './analytics-service';
import { cityCoverageService } from './city-coverage-service';
import { apiClientFactory } from '../external-apis/client-factory';
import type { 
  ZIPValidationResult, 
  ZIPValidationOptions,
  ZIPCoverageSystemStatus 
} from '../../types/zip-validation';

export interface ZIPCoverageOperationResult {
  success: boolean;
  processed: number;
  errors: number;
  details: {
    zipValidations: number;
    cityUpdates: number;
    tdspValidations: number;
    dataQualityIssues: number;
  };
  processingTime: number;
  summary: string;
}

export interface SystemHealthCheck {
  overall: 'healthy' | 'degraded' | 'critical';
  services: {
    database: 'healthy' | 'degraded' | 'down';
    externalAPIs: 'healthy' | 'degraded' | 'down';
    zipValidation: 'healthy' | 'degraded' | 'down';
    analytics: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    totalZipsMapped: number;
    avgConfidence: number;
    recentValidations: number;
    errorRate: number;
    apiResponseTime: number;
  };
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    message: string;
    recommendation: string;
  }>;
  lastChecked: string;
}

export class ZIPCoverageOrchestrator {
  private operationQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: SystemHealthCheck;

  constructor() {
    // Start periodic health checks
    this.startHealthMonitoring();
  }

  /**
   * Comprehensive ZIP validation using all available services
   */
  async validateZIP(zipCode: string, options: ZIPValidationOptions & {
    updateCoverage?: boolean;
    trackAnalytics?: boolean;
  } = {}): Promise<ZIPValidationResult> {
    const startTime = Date.now();

    try {
      // Primary validation through ZIP validation service
      const validationResult = await zipValidationService.validateZIP(zipCode, options);

      // If successful and city identified, update city coverage
      if (options.updateCoverage && validationResult.isValid && validationResult.citySlug) {
        this.queueOperation(async () => {
          const coverageData = await cityCoverageService.getCityCoverage(validationResult.citySlug!);
          if (coverageData && coverageData.coverage.coveragePercentage < 90) {
            // City needs more comprehensive mapping
            await this.improveZIPCoverage(validationResult.citySlug!);
          }
        });
      }

      // Track analytics if enabled
      if (options.trackAnalytics !== false) {
        await analyticsService.trackZIPValidation({
          zipCode,
          success: validationResult.isValid,
          errorCode: validationResult.error ? 'VALIDATION_FAILED' : undefined,
          cityName: validationResult.cityName,
          tdspTerritory: validationResult.tdspName,
          validationTime: validationResult.processingTime || 0,
          source: validationResult.source,
          confidence: validationResult.confidence
        });
      }

      return {
        ...validationResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Validation error:', error);
      
      // Track the error
      await analyticsService.trackZIPValidation({
        zipCode,
        success: false,
        errorCode: 'ORCHESTRATOR_ERROR',
        validationTime: Date.now() - startTime,
        source: 'orchestrator'
      });

      return {
        zipCode,
        isValid: false,
        error: error instanceof Error ? error.message : 'Orchestration failed',
        confidence: 0,
        source: 'orchestrator_error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Bulk ZIP validation with comprehensive coverage analysis
   */
  async validateZIPsBulk(zipCodes: string[], options: {
    batchSize?: number;
    includeAnalytics?: boolean;
    improveCoverage?: boolean;
  } = {}): Promise<ZIPCoverageOperationResult> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 25;
    let processed = 0;
    let errors = 0;
    const details = {
      zipValidations: 0,
      cityUpdates: 0,
      tdspValidations: 0,
      dataQualityIssues: 0
    };

    try {
      // Process in batches
      for (let i = 0; i < zipCodes.length; i += batchSize) {
        const batch = zipCodes.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (zipCode) => {
          try {
            const result = await this.validateZIP(zipCode, {
              updateCoverage: options.improveCoverage,
              trackAnalytics: options.includeAnalytics
            });
            
            details.zipValidations++;
            if (result.isValid) {
              processed++;
            } else {
              errors++;
            }

            return result;
          } catch (error) {
            console.error(`[ZIPCoverageOrchestrator] Error validating ${zipCode}:`, error);
            errors++;
            details.dataQualityIssues++;
            return null;
          }
        });

        await Promise.all(batchPromises);

        // Add delay between batches to prevent rate limiting
        if (i + batchSize < zipCodes.length) {
          await this.sleep(1000);
        }
      }

      // Process queued operations
      await this.processOperationQueue();

      return {
        success: errors < zipCodes.length * 0.1, // Success if < 10% errors
        processed,
        errors,
        details,
        processingTime: Date.now() - startTime,
        summary: `Processed ${processed} ZIP codes successfully with ${errors} errors`
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Bulk validation error:', error);
      return {
        success: false,
        processed,
        errors: zipCodes.length - processed,
        details,
        processingTime: Date.now() - startTime,
        summary: `Bulk validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Comprehensive system health check
   */
  async performHealthCheck(): Promise<SystemHealthCheck> {
    const startTime = Date.now();

    try {
      // Check database connectivity
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check external API health
      const apiHealth = await this.checkAPIHealth();
      
      // Check service health
      const serviceHealth = await this.checkServiceHealth();
      
      // Get system metrics
      const metrics = await this.getSystemMetrics();
      
      // Determine overall health
      const services = {
        database: dbHealth,
        externalAPIs: apiHealth,
        zipValidation: serviceHealth.zipValidation,
        analytics: serviceHealth.analytics
      };

      const healthyServices = Object.values(services).filter(s => s === 'healthy').length;
      const totalServices = Object.values(services).length;
      
      let overall: 'healthy' | 'degraded' | 'critical';
      if (healthyServices === totalServices) {
        overall = 'healthy';
      } else if (healthyServices >= totalServices * 0.75) {
        overall = 'degraded';
      } else {
        overall = 'critical';
      }

      // Generate issues and recommendations
      const issues = this.generateHealthIssues(services, metrics);

      const healthCheck: SystemHealthCheck = {
        overall,
        services,
        metrics,
        issues,
        lastChecked: new Date().toISOString()
      };

      this.lastHealthCheck = healthCheck;
      return healthCheck;

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Health check error:', error);
      
      return {
        overall: 'critical',
        services: {
          database: 'down',
          externalAPIs: 'down',
          zipValidation: 'down',
          analytics: 'down'
        },
        metrics: {
          totalZipsMapped: 0,
          avgConfidence: 0,
          recentValidations: 0,
          errorRate: 1.0,
          apiResponseTime: Date.now() - startTime
        },
        issues: [{
          severity: 'critical',
          component: 'orchestrator',
          message: 'Health check failed completely',
          recommendation: 'Check system logs and restart services'
        }],
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Improve ZIP coverage for a city using all available data sources
   */
  async improveZIPCoverage(citySlug: string): Promise<ZIPCoverageOperationResult> {
    const startTime = Date.now();
    let processed = 0;
    let errors = 0;
    const details = {
      zipValidations: 0,
      cityUpdates: 0,
      tdspValidations: 0,
      dataQualityIssues: 0
    };

    try {
      // Get current city coverage
      const currentCoverage = await cityCoverageService.getCityCoverage(citySlug);
      if (!currentCoverage) {
        throw new Error(`City not found: ${citySlug}`);
      }

      // If coverage is already good, skip
      if (currentCoverage.coverage.coveragePercentage >= 95) {
        return {
          success: true,
          processed: 0,
          errors: 0,
          details,
          processingTime: Date.now() - startTime,
          summary: 'City already has excellent coverage'
        };
      }

      // Try to find additional ZIP codes using external APIs
      const potentialZipRanges = this.generateZipRangesForCity(citySlug);
      const newMappings: Array<{
        zipCode: string;
        confidence: number;
        tdspDuns: string;
        source: string;
      }> = [];

      for (const zipRange of potentialZipRanges) {
        for (let zip = zipRange.start; zip <= zipRange.end; zip += 1) {
          const zipCode = zip.toString().padStart(5, '0');
          
          try {
            // Skip if we already have this ZIP
            if (currentCoverage.zipCodes.includes(zipCode)) {
              continue;
            }

            // Validate through multiple sources
            const validationResult = await zipValidationService.validateZIP(zipCode, {
              sources: ['ercot', 'puct'],
              requireMultipleSources: false
            });

            if (validationResult.isValid && validationResult.citySlug === citySlug) {
              newMappings.push({
                zipCode,
                confidence: validationResult.confidence || 75,
                tdspDuns: validationResult.tdspDuns || currentCoverage.primaryTdsp.duns,
                source: validationResult.source || 'api_discovery'
              });
              
              details.zipValidations++;
              processed++;
            }

          } catch (error) {
            errors++;
            details.dataQualityIssues++;
            console.error(`[ZIPCoverageOrchestrator] Error validating ${zipCode}:`, error);
          }

          // Rate limiting
          if (processed % 10 === 0) {
            await this.sleep(500);
          }
        }
      }

      // Update city coverage with new mappings
      if (newMappings.length > 0) {
        const updateResult = await cityCoverageService.updateCityCoverage(citySlug, newMappings);
        details.cityUpdates = updateResult.added + updateResult.updated;
      }

      return {
        success: newMappings.length > 0 || errors < processed * 0.2,
        processed,
        errors,
        details,
        processingTime: Date.now() - startTime,
        summary: `Improved coverage for ${citySlug}: added ${newMappings.length} new ZIP mappings`
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Coverage improvement error:', error);
      return {
        success: false,
        processed,
        errors,
        details,
        processingTime: Date.now() - startTime,
        summary: `Failed to improve coverage: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<ZIPCoverageSystemStatus> {
    try {
      const [healthCheck, coverageMetrics, zipMetrics, qualityMetrics] = await Promise.all([
        this.performHealthCheck(),
        cityCoverageService.getSystemCoverageMetrics(),
        analyticsService.getZIPCoverageAnalytics(),
        analyticsService.getDataQualitySummary()
      ]);

      return {
        health: healthCheck,
        coverage: {
          totalCities: coverageMetrics.totalCities,
          coveredCities: coverageMetrics.fullyCoveredCities + coverageMetrics.partiallyCoveredCities,
          totalZipsMapped: zipMetrics.totalMappedZips,
          averageCoverage: coverageMetrics.averageCoveragePercentage,
          lastUpdated: new Date().toISOString()
        },
        quality: {
          dataFreshness: zipMetrics.dataFreshness.avgAge,
          avgConfidence: healthCheck.metrics.avgConfidence,
          recentIssues: qualityMetrics.totalIssues,
          criticalIssues: qualityMetrics.criticalIssues
        },
        performance: {
          avgResponseTime: healthCheck.metrics.apiResponseTime,
          recentValidations: healthCheck.metrics.recentValidations,
          errorRate: healthCheck.metrics.errorRate,
          throughput: Math.round(healthCheck.metrics.recentValidations / 24) // Per hour
        }
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Error getting system status:', error);
      throw error;
    }
  }

  // Private helper methods

  private queueOperation(operation: () => Promise<any>): void {
    this.operationQueue.push(operation);
    
    // Auto-process if queue gets large
    if (this.operationQueue.length >= 50) {
      this.processOperationQueue();
    }
  }

  private async processOperationQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const operations = [...this.operationQueue];
      this.operationQueue = [];

      // Process in smaller batches
      const batchSize = 10;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(op => op()));
        
        if (i + batchSize < operations.length) {
          await this.sleep(100);
        }
      }

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Operation queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      // Simple query to test database connectivity
      const result = await cityCoverageService.getSystemCoverageMetrics();
      return result.totalCities > 0 ? 'healthy' : 'degraded';
    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Database health check failed:', error);
      return 'down';
    }
  }

  private async checkAPIHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const healthChecks = await Promise.allSettled([
        apiClientFactory.getClientHealthStatus('ercot'),
        apiClientFactory.getClientHealthStatus('puct'),
        apiClientFactory.getClientHealthStatus('oncor')
      ]);

      const healthyAPIs = healthChecks.filter(check => 
        check.status === 'fulfilled' && check.value.status === 'healthy'
      ).length;

      if (healthyAPIs === healthChecks.length) return 'healthy';
      if (healthyAPIs > 0) return 'degraded';
      return 'down';

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] API health check failed:', error);
      return 'down';
    }
  }

  private async checkServiceHealth(): Promise<{
    zipValidation: 'healthy' | 'degraded' | 'down';
    analytics: 'healthy' | 'degraded' | 'down';
  }> {
    try {
      // Test ZIP validation service
      const testZip = '75201'; // Dallas ZIP
      const zipResult = await zipValidationService.validateZIP(testZip);
      const zipHealth = zipResult.isValid ? 'healthy' : 'degraded';

      // Test analytics service
      const analyticsMetrics = await analyticsService.getZIPValidationMetricsFromDB();
      const analyticsHealth = analyticsMetrics.totalValidations >= 0 ? 'healthy' : 'down';

      return {
        zipValidation: zipHealth,
        analytics: analyticsHealth
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Service health check failed:', error);
      return {
        zipValidation: 'down',
        analytics: 'down'
      };
    }
  }

  private async getSystemMetrics(): Promise<SystemHealthCheck['metrics']> {
    try {
      const [coverageAnalytics, zipMetrics] = await Promise.all([
        analyticsService.getZIPCoverageAnalytics(),
        analyticsService.getZIPValidationMetricsFromDB([
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date()
        ])
      ]);

      return {
        totalZipsMapped: coverageAnalytics.totalMappedZips,
        avgConfidence: coverageAnalytics.coverageByTdsp.reduce((sum, t) => sum + t.avgConfidence, 0) / 
                      Math.max(coverageAnalytics.coverageByTdsp.length, 1),
        recentValidations: coverageAnalytics.recentValidations,
        errorRate: 1 - zipMetrics.successRate,
        apiResponseTime: zipMetrics.averageTime || 0
      };

    } catch (error) {
      console.error('[ZIPCoverageOrchestrator] Error getting system metrics:', error);
      return {
        totalZipsMapped: 0,
        avgConfidence: 0,
        recentValidations: 0,
        errorRate: 1.0,
        apiResponseTime: 5000
      };
    }
  }

  private generateHealthIssues(
    services: SystemHealthCheck['services'], 
    metrics: SystemHealthCheck['metrics']
  ): SystemHealthCheck['issues'] {
    const issues: SystemHealthCheck['issues'] = [];

    // Check service health
    Object.entries(services).forEach(([service, health]) => {
      if (health === 'down') {
        issues.push({
          severity: 'critical',
          component: service,
          message: `${service} service is down`,
          recommendation: `Restart ${service} service and check logs`
        });
      } else if (health === 'degraded') {
        issues.push({
          severity: 'high',
          component: service,
          message: `${service} service is degraded`,
          recommendation: `Monitor ${service} service performance`
        });
      }
    });

    // Check metrics
    if (metrics.errorRate > 0.1) {
      issues.push({
        severity: 'high',
        component: 'validation',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        recommendation: 'Check external API connectivity and data quality'
      });
    }

    if (metrics.avgConfidence < 70) {
      issues.push({
        severity: 'medium',
        component: 'data_quality',
        message: `Low average confidence: ${metrics.avgConfidence}%`,
        recommendation: 'Update validation rules and refresh data sources'
      });
    }

    if (metrics.apiResponseTime > 3000) {
      issues.push({
        severity: 'medium',
        component: 'performance',
        message: `Slow API response time: ${metrics.apiResponseTime}ms`,
        recommendation: 'Optimize database queries and API client configurations'
      });
    }

    return issues;
  }

  private generateZipRangesForCity(citySlug: string): Array<{ start: number; end: number }> {
    // Generate potential ZIP ranges based on city
    const baseZip = this.getCityBaseZip(citySlug);
    if (!baseZip) return [];

    // Generate ranges around the base ZIP
    return [
      { start: baseZip, end: baseZip + 50 },
      { start: Math.max(baseZip - 50, 70000), end: baseZip - 1 }
    ].filter(range => range.start <= range.end);
  }

  private getCityBaseZip(citySlug: string): number | null {
    const cityZipMap: Record<string, number> = {
      'dallas-tx': 75201,
      'houston-tx': 77001,
      'austin-tx': 78701,
      'fort-worth-tx': 76101,
      'san-antonio-tx': 78201,
      'el-paso-tx': 79901
    };

    return cityZipMap[citySlug] || null;
  }

  private startHealthMonitoring(): void {
    // Perform health check every 15 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('[ZIPCoverageOrchestrator] Scheduled health check failed:', error);
      }
    }, 15 * 60 * 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown orchestrator and cleanup resources
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Process remaining operations
    if (this.operationQueue.length > 0) {
      this.processOperationQueue();
    }
  }
}

// Export singleton instance
export const zipCoverageOrchestrator = new ZIPCoverageOrchestrator();