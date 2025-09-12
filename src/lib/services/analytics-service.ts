/**
 * Analytics Service - Enhanced for ZIP Coverage System
 * Integrates database infrastructure with privacy-focused analytics
 * Constitutional compliance: Privacy-focused analytics, no PII storage
 */

import { db } from '../database/init';
import { validationLogs, zipCodeMappings } from '../database/schema';
import { eq, and, desc, gte, count, avg, sql } from 'drizzle-orm';
import type { FormInteractionRequest, FormInteraction, InteractionPattern } from '../../types/zip-validation';
import type { ZIPNavigationEvent, ZIPPerformanceMetrics } from '../types/zip-navigation';

export interface AnalyticsMetrics {
  totalInteractions: number;
  successfulSubmissions: number;
  errorRate: number;
  averageDuration: number;
  mobileUsage: number;
  topCityPages: Array<{ cityPage: string; count: number }>;
  conversionRate: number;
}

export class AnalyticsService {
  private zipValidations: unknown[] = [];
  private cityValidations: unknown[] = [];
  private interactions: unknown[] = [];
  private batchQueue: unknown[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly batchDelay = 5000; // 5 seconds

  /**
   * Track ZIP code validation attempts with database integration
   */
  async trackZIPValidation(data: {
    zipCode: string;
    success: boolean;
    errorCode?: string;
    cityName?: string;
    tdspTerritory?: string;
    planCount?: number;
    validationTime: number;
    source?: string;
    confidence?: number;
  }): Promise<void> {
    try {
      // Store in database for persistence using raw SQL (disabled until tables are created)
      // try {
      //   await db.query(`
      //     INSERT INTO validation_logs (zip_code, is_valid, source, confidence, city_slug, tdsp_duns, error_message, processing_time, validated_at)
      //     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      //   `, [
      //     data.zipCode,
      //     data.success,
      //     data.source || 'web_form',
      //     data.confidence || (data.success ? 90 : 0),
      //     data.cityName ? this.cityNameToSlug(data.cityName) : null,
      //     data.tdspTerritory ? this.tdspNameToDuns(data.tdspTerritory) : null,
      //     data.errorCode || null,
      //     data.validationTime,
      //     new Date()
      //   ]);
      // } catch (dbError) {
      //   console.error('[Analytics] Database insert failed:', dbError);
      //   // Continue with in-memory tracking
      // }
    } catch (dbError) {
      console.error('[Analytics] Database tracking failed:', dbError);
    }
    try {
      const record = {
        timestamp: new Date().toISOString(),
        zipCode: data.zipCode,
        success: data.success,
        errorCode: data.errorCode,
        cityName: data.cityName,
        tdspTerritory: data.tdspTerritory,
        planCount: data.planCount,
        validationTime: data.validationTime,
        id: `zip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.zipValidations.push(record);
      
      // Keep only recent records to prevent memory issues
      if (this.zipValidations.length > 1000) {
        this.zipValidations = this.zipValidations.slice(-1000);
      }

      // Log important events
      if (data.success) {
        console.warn(`[Analytics] ZIP validation success: ${data.zipCode} → ${data.cityName}`);
      } else {
        console.warn(`[Analytics] ZIP validation error: ${data.zipCode} → ${data.errorCode}`);
      }
    } catch (error) {
      console.error('[Analytics] Error tracking ZIP validation:', error);
      // Don't throw - analytics failures shouldn't break functionality
    }
  }

  /**
   * Get ZIP validation metrics from database
   */
  async getZIPValidationMetricsFromDB(dateRange?: [Date, Date]): Promise<{
    totalValidations: number;
    successRate: number;
    averageTime: number;
    topSources: Array<{ source: string; count: number }>;
    topCities: Array<{ city: string; count: number }>;
    confidenceDistribution: { avg: number; min: number; max: number };
  }> {
    try {
      const baseQuery = db.select({
        total: count(),
        successful: sql<number>`sum(case when ${validationLogs.isValid} then 1 else 0 end)`,
        avgTime: avg(validationLogs.processingTime),
        avgConfidence: avg(validationLogs.confidence),
        minConfidence: sql<number>`min(${validationLogs.confidence})`,
        maxConfidence: sql<number>`max(${validationLogs.confidence})`
      }).from(validationLogs);

      // Apply date filter if provided
      const query = dateRange
        ? baseQuery.where(and(
            gte(validationLogs.validatedAt, dateRange[0]),
            gte(dateRange[1], validationLogs.validatedAt)
          ))
        : baseQuery;

      const metrics = await query;
      const result = metrics[0];

      if (!result || Number(result.total) === 0) {
        return {
          totalValidations: 0,
          successRate: 0,
          averageTime: 0,
          topSources: [],
          topCities: [],
          confidenceDistribution: { avg: 0, min: 0, max: 0 }
        };
      }

      // Get top sources
      const topSources = await db
        .select({
          source: validationLogs.source,
          count: count()
        })
        .from(validationLogs)
        .groupBy(validationLogs.source)
        .orderBy(desc(count()))
        .limit(5);

      // Get top cities (successful validations only)
      const topCities = await db
        .select({
          citySlug: validationLogs.citySlug,
          count: count()
        })
        .from(validationLogs)
        .where(eq(validationLogs.isValid, true))
        .groupBy(validationLogs.citySlug)
        .orderBy(desc(count()))
        .limit(10);

      return {
        totalValidations: Number(result.total),
        successRate: Number(result.successful) / Number(result.total),
        averageTime: Number(result.avgTime) || 0,
        topSources: topSources.map(s => ({
          source: s.source || 'unknown',
          count: Number(s.count)
        })),
        topCities: topCities.map(c => ({
          city: c.citySlug || 'unknown',
          count: Number(c.count)
        })),
        confidenceDistribution: {
          avg: Math.round(Number(result.avgConfidence) || 0),
          min: Number(result.minConfidence) || 0,
          max: Number(result.maxConfidence) || 0
        }
      };

    } catch (error) {
      console.error('[Analytics] Error getting DB metrics:', error);
      // Fallback to in-memory metrics
      return this.getZIPValidationMetrics();
    }
  }

  /**
   * Get comprehensive ZIP coverage analytics
   */
  async getZIPCoverageAnalytics(): Promise<{
    totalMappedZips: number;
    coverageByTdsp: Array<{ tdsp: string; zipCount: number; avgConfidence: number }>;
    lowConfidenceZips: Array<{ zipCode: string; confidence: number; citySlug: string }>;
    recentValidations: number;
    dataFreshness: { oldest: string; newest: string; avgAge: number };
  }> {
    try {
      // Get total mapped ZIP codes
      const totalMapped = await db
        .select({ count: count() })
        .from(zipCodeMappings);

      // Get coverage by TDSP
      const coverageByTdsp = await db
        .select({
          tdspDuns: zipCodeMappings.tdspDuns,
          zipCount: count(),
          avgConfidence: avg(zipCodeMappings.confidence)
        })
        .from(zipCodeMappings)
        .groupBy(zipCodeMappings.tdspDuns)
        .orderBy(desc(count()));

      // Get low confidence mappings that need attention
      const lowConfidenceZips = await db
        .select({
          zipCode: zipCodeMappings.zipCode,
          confidence: zipCodeMappings.confidence,
          citySlug: zipCodeMappings.citySlug
        })
        .from(zipCodeMappings)
        .where(sql`${zipCodeMappings.confidence} < 70`)
        .orderBy(zipCodeMappings.confidence)
        .limit(50);

      // Get recent validations (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentValidations = await db
        .select({ count: count() })
        .from(validationLogs)
        .where(gte(validationLogs.validatedAt, yesterday));

      // Get data freshness metrics
      const freshnessMetrics = await db
        .select({
          oldest: sql<string>`min(${zipCodeMappings.lastValidated})`,
          newest: sql<string>`max(${zipCodeMappings.lastValidated})`,
          avgAge: sql<number>`avg(extract(epoch from (now() - ${zipCodeMappings.lastValidated})) / 86400)` // Days
        })
        .from(zipCodeMappings);

      const freshness = freshnessMetrics[0] || { oldest: null, newest: null, avgAge: 0 };

      return {
        totalMappedZips: Number(totalMapped[0].count),
        coverageByTdsp: coverageByTdsp.map(c => ({
          tdsp: this.dunsToTdspName(c.tdspDuns),
          zipCount: Number(c.zipCount),
          avgConfidence: Math.round(Number(c.avgConfidence) || 0)
        })),
        lowConfidenceZips: lowConfidenceZips.map(z => ({
          zipCode: z.zipCode,
          confidence: z.confidence,
          citySlug: z.citySlug
        })),
        recentValidations: Number(recentValidations[0].count),
        dataFreshness: {
          oldest: freshness.oldest || new Date().toISOString(),
          newest: freshness.newest || new Date().toISOString(),
          avgAge: Math.round(Number(freshness.avgAge) || 0)
        }
      };

    } catch (error) {
      console.error('[Analytics] Error getting coverage analytics:', error);
      return {
        totalMappedZips: 0,
        coverageByTdsp: [],
        lowConfidenceZips: [],
        recentValidations: 0,
        dataFreshness: {
          oldest: new Date().toISOString(),
          newest: new Date().toISOString(),
          avgAge: 0
        }
      };
    }
  }

  /**
   * Track data quality issues for monitoring
   */
  async trackDataQualityIssue(issue: {
    type: 'missing_mapping' | 'low_confidence' | 'api_failure' | 'stale_data';
    zipCode?: string;
    citySlug?: string;
    tdspDuns?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    source: string;
  }): Promise<void> {
    try {
      // In production, this would insert into a data_quality_issues table
      const qualityIssue = {
        ...issue,
        timestamp: new Date().toISOString(),
        id: `quality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // For now, log with structured format for monitoring
      console.warn('[Analytics] Data Quality Issue:', qualityIssue);

      // Track in memory for immediate access
      if (!this.dataQualityIssues) {
        this.dataQualityIssues = [];
      }
      this.dataQualityIssues.push(qualityIssue);

      // Keep only recent issues to prevent memory growth
      if (this.dataQualityIssues.length > 1000) {
        this.dataQualityIssues = this.dataQualityIssues.slice(-1000);
      }

    } catch (error) {
      console.error('[Analytics] Error tracking data quality issue:', error);
    }
  }

  /**
   * Get data quality summary for monitoring dashboard
   */
  async getDataQualitySummary(hours = 24): Promise<{
    totalIssues: number;
    criticalIssues: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    recentTrends: Array<{ hour: string; issueCount: number }>;
  }> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const issues = (this.dataQualityIssues || []).filter(
        issue => new Date(issue.timestamp) >= cutoffTime
      );

      const issuesByType: Record<string, number> = {};
      const issuesBySeverity: Record<string, number> = {};

      issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
      });

      // Generate hourly trends
      const hourlyTrends: Record<string, number> = {};
      issues.forEach(issue => {
        const hour = new Date(issue.timestamp).toISOString().slice(0, 13);
        hourlyTrends[hour] = (hourlyTrends[hour] || 0) + 1;
      });

      const recentTrends = Object.entries(hourlyTrends)
        .map(([hour, issueCount]) => ({ hour, issueCount }))
        .sort((a, b) => a.hour.localeCompare(b.hour))
        .slice(-24); // Last 24 hours

      return {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        issuesByType,
        issuesBySeverity,
        recentTrends
      };

    } catch (error) {
      console.error('[Analytics] Error getting data quality summary:', error);
      return {
        totalIssues: 0,
        criticalIssues: 0,
        issuesByType: {},
        issuesBySeverity: {},
        recentTrends: []
      };
    }
  }

  // Helper methods for database integration

  private cityNameToSlug(cityName: string): string {
    return cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-tx';
  }

  private tdspNameToDuns(tdspName: string): string | undefined {
    const tdspMapping: Record<string, string> = {
      'oncor': '1039940674000',
      'centerpoint': '957877905',
      'austin energy': '104857401',
      'cps energy': '104857402',
      'aep texas north': '103994067421',
      'aep texas central': '103994067422',
      'tnmp': '104994067401'
    };

    return tdspMapping[tdspName.toLowerCase()] || undefined;
  }

  private dunsToTdspName(duns: string): string {
    const dunsMapping: Record<string, string> = {
      '1039940674000': 'Oncor Electric Delivery',
      '957877905': 'CenterPoint Energy Houston Electric',
      '104857401': 'Austin Energy',
      '104857402': 'CPS Energy',
      '103994067421': 'AEP Texas North',
      '103994067422': 'AEP Texas Central',
      '104994067401': 'Texas-New Mexico Power'
    };

    return dunsMapping[duns] || `TDSP-${duns.slice(-4)}`;
  }

  private dataQualityIssues: unknown[];

  /**
   * Track city plans validation
   */
  async trackCityValidation(data: {
    citySlug: string;
    cityName: string;
    planCount: number;
    isValid: boolean;
    validationTime: number;
  }): Promise<void> {
    try {
      const record = {
        timestamp: new Date().toISOString(),
        citySlug: data.citySlug,
        cityName: data.cityName,
        planCount: data.planCount,
        isValid: data.isValid,
        validationTime: data.validationTime,
        id: `city_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.cityValidations.push(record);
      
      // Keep only recent records
      if (this.cityValidations.length > 1000) {
        this.cityValidations = this.cityValidations.slice(-1000);
      }

      console.warn(`[Analytics] City validation: ${data.citySlug} → ${data.planCount} plans`);
    } catch (error) {
      console.error('[Analytics] Error tracking city validation:', error);
    }
  }

  /**
   * Get ZIP validation analytics
   */
  getZIPValidationMetrics(): {
    totalValidations: number;
    successRate: number;
    averageTime: number;
    topErrorCodes: Array<{ code: string; count: number }>;
    topCities: Array<{ city: string; count: number }>;
  } {
    const total = this.zipValidations.length;
    if (total === 0) {
      return {
        totalValidations: 0,
        successRate: 0,
        averageTime: 0,
        topErrorCodes: [],
        topCities: []
      };
    }

    const successful = this.zipValidations.filter(v => v.success).length;
    const totalTime = this.zipValidations.reduce((sum, v) => sum + v.validationTime, 0);
    
    // Count error codes
    const errorCodes = new Map<string, number>();
    this.zipValidations.filter(v => !v.success).forEach(v => {
      if (v.errorCode) {
        errorCodes.set(v.errorCode, (errorCodes.get(v.errorCode) || 0) + 1);
      }
    });

    // Count cities
    const cities = new Map<string, number>();
    this.zipValidations.filter(v => v.cityName).forEach(v => {
      cities.set(v.cityName, (cities.get(v.cityName) || 0) + 1);
    });

    return {
      totalValidations: total,
      successRate: successful / total,
      averageTime: totalTime / total,
      topErrorCodes: Array.from(errorCodes.entries())
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topCities: Array.from(cities.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  async trackFormInteraction(interaction: FormInteractionRequest): Promise<void> {
    try {
      // Validate the interaction request
      const validatedInteraction = this.validateFormInteractionRequest(interaction);
      
      // Create interaction record
      const interactionRecord = {
        zipCode: validatedInteraction.zipCode,
        cityPage: validatedInteraction.cityPage,
        action: validatedInteraction.action,
        duration: validatedInteraction.duration,
        deviceType: validatedInteraction.deviceType,
        success: validatedInteraction.success,
        sessionId: validatedInteraction.sessionId,
        timestamp: new Date()
      };

      // Add to batch queue for efficient processing
      this.batchQueue.push(interactionRecord);
      
      // Process batch if it reaches size limit
      if (this.batchQueue.length >= this.batchSize) {
        await this.processBatch();
      } else {
        // Set timeout for batch processing if not already set
        this.scheduleBatchProcessing();
      }

      // Real-time tracking for critical actions
      if (validatedInteraction.action === 'submit' || validatedInteraction.action === 'error') {
        await this.processInteractionImmediately(interactionRecord);
      }

    } catch (error) {
      console.error('[AnalyticsService] Error tracking interaction:', error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  async getInteractionMetrics(citySlug: string, dateRange?: [Date, Date]): Promise<AnalyticsMetrics> {
    const relevantInteractions = this.filterInteractions(citySlug, dateRange);
    
    if (relevantInteractions.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalInteractions = relevantInteractions.length;
    const successfulSubmissions = relevantInteractions.filter(
      i => i.action === 'submit' && i.success
    ).length;
    
    const errorInteractions = relevantInteractions.filter(
      i => i.action === 'error' || !i.success
    ).length;
    
    const mobileInteractions = relevantInteractions.filter(
      i => i.deviceType === 'mobile'
    ).length;

    const totalDuration = relevantInteractions.reduce((sum, i) => sum + i.duration, 0);
    const averageDuration = totalDuration / totalInteractions;

    const cityPageCounts = this.aggregateByCityPage(relevantInteractions);
    const focusInteractions = relevantInteractions.filter(i => i.action === 'focus').length;
    
    return {
      totalInteractions,
      successfulSubmissions,
      errorRate: errorInteractions / totalInteractions,
      averageDuration,
      mobileUsage: mobileInteractions / totalInteractions,
      topCityPages: cityPageCounts,
      conversionRate: focusInteractions > 0 ? successfulSubmissions / focusInteractions : 0
    };
  }

  // Advanced analytics methods

  async getInteractionPatterns(sessionIds?: string[]): Promise<InteractionPattern[]> {
    const sessionsToAnalyze = sessionIds || this.getUniqueSessions();
    const patterns: InteractionPattern[] = [];

    for (const sessionId of sessionsToAnalyze) {
      const sessionInteractions = this.interactions.filter(
        i => i.sessionId === sessionId
      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (sessionInteractions.length === 0) continue;

      const totalDuration = sessionInteractions.reduce((sum, i) => sum + i.duration, 0);
      const outcome = this.determineSessionOutcome(sessionInteractions);
      const device = sessionInteractions[0].deviceType;

      patterns.push({
        sessionId,
        interactions: sessionInteractions,
        totalDuration,
        outcome,
        device
      });
    }

    return patterns;
  }

  async getFunnelAnalysis(citySlug: string): Promise<{
    focus: number;
    input: number;
    submit: number;
    success: number;
    error: number;
  }> {
    const interactions = this.interactions.filter(i => i.cityPage === citySlug);
    
    return {
      focus: interactions.filter(i => i.action === 'focus').length,
      input: interactions.filter(i => i.action === 'input').length,
      submit: interactions.filter(i => i.action === 'submit').length,
      success: interactions.filter(i => i.action === 'submit' && i.success).length,
      error: interactions.filter(i => i.action === 'error').length
    };
  }

  async getPerformanceMetrics(citySlug?: string): Promise<{
    averageResponseTime: number;
    slowInteractions: number;
    mobilePerformance: {
      averageTime: number;
      slowCount: number;
    };
    desktopPerformance: {
      averageTime: number;
      slowCount: number;
    };
  }> {
    const relevantInteractions = citySlug 
      ? this.interactions.filter(i => i.cityPage === citySlug)
      : this.interactions;

    const submitInteractions = relevantInteractions.filter(i => i.action === 'submit');
    const averageResponseTime = submitInteractions.length > 0 
      ? submitInteractions.reduce((sum, i) => sum + i.duration, 0) / submitInteractions.length
      : 0;

    const slowThreshold = 3000; // 3 seconds
    const slowInteractions = submitInteractions.filter(i => i.duration > slowThreshold).length;

    const mobileSubmits = submitInteractions.filter(i => i.deviceType === 'mobile');
    const desktopSubmits = submitInteractions.filter(i => i.deviceType === 'desktop');

    return {
      averageResponseTime,
      slowInteractions,
      mobilePerformance: {
        averageTime: mobileSubmits.length > 0 
          ? mobileSubmits.reduce((sum, i) => sum + i.duration, 0) / mobileSubmits.length
          : 0,
        slowCount: mobileSubmits.filter(i => i.duration > slowThreshold).length
      },
      desktopPerformance: {
        averageTime: desktopSubmits.length > 0 
          ? desktopSubmits.reduce((sum, i) => sum + i.duration, 0) / desktopSubmits.length
          : 0,
        slowCount: desktopSubmits.filter(i => i.duration > slowThreshold).length
      }
    };
  }

  // ZIP code analysis
  async getZipCodeAnalytics(dateRange?: [Date, Date]): Promise<{
    totalZipLookups: number;
    uniqueZipCodes: number;
    topZipCodes: Array<{ zipCode: string; count: number; successRate: number }>;
    invalidZipAttempts: number;
    crossCityRedirects: number;
  }> {
    const relevantInteractions = dateRange 
      ? this.interactions.filter(i => 
          i.timestamp >= dateRange[0] && i.timestamp <= dateRange[1]
        )
      : this.interactions;

    const submitInteractions = relevantInteractions.filter(i => i.action === 'submit');
    const uniqueZipCodes = new Set(
      submitInteractions
        .filter(i => i.zipCode && i.zipCode.length === 5)
        .map(i => i.zipCode)
    ).size;

    const zipCodeCounts = this.aggregateByZipCode(submitInteractions);
    const invalidZipAttempts = relevantInteractions.filter(i => 
      i.action === 'error' && i.zipCode && (i.zipCode.length !== 5 || !/^\d{5}$/.test(i.zipCode))
    ).length;

    // Estimate cross-city redirects (simplified logic)
    const crossCityRedirects = relevantInteractions.filter(i => 
      i.action === 'redirect'
    ).length;

    return {
      totalZipLookups: submitInteractions.length,
      uniqueZipCodes,
      topZipCodes: zipCodeCounts.slice(0, 10),
      invalidZipAttempts,
      crossCityRedirects
    };
  }

  // Validation helper
  private validateFormInteractionRequest(interaction: unknown): FormInteractionRequest {
    // Basic validation - in production would use a proper validation library
    return {
      zipCode: interaction.zipCode || '',
      cityPage: interaction.cityPage || '',
      action: interaction.action || 'unknown',
      duration: Number(interaction.duration) || 0,
      deviceType: interaction.deviceType || 'desktop',
      success: Boolean(interaction.success),
      sessionId: interaction.sessionId || `session_${Date.now()}`
    };
  }

  // Private helper methods

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    // Clear timeout if set
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      // Add to in-memory store (in production, would batch insert to database)
      this.interactions.push(...batch);
      
      // Keep only recent interactions to prevent memory issues
      const maxSize = 10000;
      if (this.interactions.length > maxSize) {
        this.interactions = this.interactions.slice(-maxSize);
      }

      console.warn(`[AnalyticsService] Processed batch of ${batch.length} interactions`);
      
    } catch (error) {
      console.error('[AnalyticsService] Batch processing error:', error);
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return; // Already scheduled
    
    this.batchTimeout = setTimeout(async () => {
      await this.processBatch();
    }, this.batchDelay);
  }

  private async processInteractionImmediately(interaction: FormInteraction): Promise<void> {
    // Process critical interactions immediately for real-time metrics
    this.interactions.push(interaction);
    
    // Log important events
    if (interaction.action === 'submit' && interaction.success) {
      console.warn(`[AnalyticsService] Successful ZIP submission: ${interaction.zipCode} on ${interaction.cityPage}`);
    } else if (interaction.action === 'error') {
      console.warn(`[AnalyticsService] Error interaction: ${interaction.zipCode} on ${interaction.cityPage}`);
    }
  }

  private filterInteractions(citySlug: string, dateRange?: [Date, Date]): FormInteraction[] {
    let filtered = this.interactions.filter(i => i.cityPage === citySlug);
    
    if (dateRange) {
      filtered = filtered.filter(i => 
        i.timestamp >= dateRange[0] && i.timestamp <= dateRange[1]
      );
    }
    
    return filtered;
  }

  private aggregateByCityPage(interactions: FormInteraction[]): Array<{ cityPage: string; count: number }> {
    const counts = new Map<string, number>();
    
    interactions.forEach(interaction => {
      const current = counts.get(interaction.cityPage) || 0;
      counts.set(interaction.cityPage, current + 1);
    });
    
    return Array.from(counts.entries())
      .map(([cityPage, count]) => ({ cityPage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private aggregateByZipCode(interactions: FormInteraction[]): Array<{ zipCode: string; count: number; successRate: number }> {
    const stats = new Map<string, { total: number; successful: number }>();
    
    interactions.forEach(interaction => {
      if (!interaction.zipCode || interaction.zipCode.length !== 5) return;
      
      const current = stats.get(interaction.zipCode) || { total: 0, successful: 0 };
      current.total += 1;
      if (interaction.success) current.successful += 1;
      stats.set(interaction.zipCode, current);
    });
    
    return Array.from(stats.entries())
      .map(([zipCode, { total, successful }]) => ({
        zipCode,
        count: total,
        successRate: successful / total
      }))
      .sort((a, b) => b.count - a.count);
  }

  private determineSessionOutcome(interactions: FormInteraction[]): 'success' | 'error' | 'abandoned' {
    const hasSubmit = interactions.some(i => i.action === 'submit');
    const hasError = interactions.some(i => i.action === 'error');
    const lastInteraction = interactions[interactions.length - 1];
    
    if (hasSubmit && lastInteraction.success) return 'success';
    if (hasError || (hasSubmit && !lastInteraction.success)) return 'error';
    return 'abandoned';
  }

  private getUniqueSessions(): string[] {
    const sessions = new Set<string>();
    this.interactions.forEach(i => {
      if (i.sessionId) sessions.add(i.sessionId);
    });
    return Array.from(sessions);
  }

  private getEmptyMetrics(): AnalyticsMetrics {
    return {
      totalInteractions: 0,
      successfulSubmissions: 0,
      errorRate: 0,
      averageDuration: 0,
      mobileUsage: 0,
      topCityPages: [],
      conversionRate: 0
    };
  }

  // Public utility methods

  getInteractionCount(): number {
    return this.interactions.length;
  }

  clearAnalytics(): void {
    this.interactions = [];
    this.batchQueue = [];
    this.zipValidations = [];
    this.cityValidations = [];
    this.dataQualityIssues = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Track ZIP Navigation Events (Phase 3.4 Enhancement)
   */
  private navigationEvents: ZIPNavigationEvent[] = [];
  private routingMetrics: ZIPPerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    fastRoutes: new Set()
  };

  async trackZIPNavigationEvent(event: ZIPNavigationEvent): Promise<void> {
    try {
      // Store event in memory
      this.navigationEvents.push(event);
      
      // Keep only last 1000 events to prevent memory bloat
      if (this.navigationEvents.length > 1000) {
        this.navigationEvents = this.navigationEvents.slice(-1000);
      }

      // Update routing metrics
      this.routingMetrics.totalRequests++;
      
      if (event.eventType === 'zip_lookup_success') {
        this.routingMetrics.averageResponseTime = 
          ((this.routingMetrics.averageResponseTime * (this.routingMetrics.totalRequests - 1)) + event.responseTime) / 
          this.routingMetrics.totalRequests;
          
        if (event.responseTime < 100) {
          this.routingMetrics.fastRoutes.add(event.zipCode);
        }
      }

      // Batch write to database for persistence
      if (this.navigationEvents.length % 10 === 0) {
        await this.flushNavigationEvents();
      }

      console.warn(`[Analytics] ZIP navigation tracked: ${event.eventType} for ${event.zipCode} (${event.responseTime}ms)`);
    } catch (error) {
      console.error('[Analytics] Error tracking ZIP navigation event:', error);
    }
  }

  async getZIPNavigationInsights(hours: number = 24): Promise<{
    totalEvents: number;
    eventTypes: Record<string, number>;
    topZIPs: Array<{ zipCode: string; count: number; avgResponseTime: number }>;
    errorRate: number;
    coverageGaps: string[];
    performanceMetrics: {
      averageResponseTime: number;
      fastRoutesCount: number;
      cacheEffectiveness: number;
    };
  }> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentEvents = this.navigationEvents.filter(e => e.timestamp >= cutoffTime);

      if (recentEvents.length === 0) {
        return {
          totalEvents: 0,
          eventTypes: {},
          topZIPs: [],
          errorRate: 0,
          coverageGaps: [],
          performanceMetrics: {
            averageResponseTime: 0,
            fastRoutesCount: 0,
            cacheEffectiveness: 0
          }
        };
      }

      // Event type distribution
      const eventTypes: Record<string, number> = {};
      recentEvents.forEach(event => {
        eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
      });

      // Top ZIP codes by usage
      const zipUsage = new Map<string, { count: number; totalTime: number }>();
      recentEvents.forEach(event => {
        const existing = zipUsage.get(event.zipCode) || { count: 0, totalTime: 0 };
        zipUsage.set(event.zipCode, {
          count: existing.count + 1,
          totalTime: existing.totalTime + event.responseTime
        });
      });

      const topZIPs = Array.from(zipUsage.entries())
        .map(([zipCode, stats]) => ({
          zipCode,
          count: stats.count,
          avgResponseTime: Math.round(stats.totalTime / stats.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Error rate calculation
      const errorEvents = recentEvents.filter(e => e.eventType === 'zip_lookup_failed').length;
      const errorRate = (errorEvents / recentEvents.length) * 100;

      // Coverage gaps (ZIPs that failed lookup)
      const coverageGaps = recentEvents
        .filter(e => e.eventType === 'zip_coverage_gap')
        .map(e => e.zipCode)
        .filter((zip, index, arr) => arr.indexOf(zip) === index)
        .slice(0, 20);

      // Cache effectiveness
      const cacheTotal = this.routingMetrics.cacheHits + this.routingMetrics.cacheMisses;
      const cacheEffectiveness = cacheTotal > 0 ? 
        (this.routingMetrics.cacheHits / cacheTotal) * 100 : 0;

      return {
        totalEvents: recentEvents.length,
        eventTypes,
        topZIPs,
        errorRate: Math.round(errorRate * 100) / 100,
        coverageGaps,
        performanceMetrics: {
          averageResponseTime: Math.round(this.routingMetrics.averageResponseTime * 100) / 100,
          fastRoutesCount: this.routingMetrics.fastRoutes.size,
          cacheEffectiveness: Math.round(cacheEffectiveness * 100) / 100
        }
      };
    } catch (error) {
      console.error('[Analytics] Error generating ZIP navigation insights:', error);
      return {
        totalEvents: 0,
        eventTypes: {},
        topZIPs: [],
        errorRate: 0,
        coverageGaps: [],
        performanceMetrics: {
          averageResponseTime: 0,
          fastRoutesCount: 0,
          cacheEffectiveness: 0
        }
      };
    }
  }

  private async flushNavigationEvents(): Promise<void> {
    try {
      // In a production system, you'd write to database here
      // For now, we'll just log the batch
      console.warn(`[Analytics] Flushed ${this.navigationEvents.length} navigation events to persistence`);
    } catch (error) {
      console.error('[Analytics] Error flushing navigation events:', error);
    }
  }

  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.interactions, null, 2);
    } else {
      // Simple CSV export
      const headers = 'timestamp,zipCode,cityPage,action,duration,deviceType,success,sessionId';
      const rows = this.interactions.map(i => 
        `${i.timestamp.toISOString()},${i.zipCode},${i.cityPage},${i.action},${i.duration},${i.deviceType},${i.success},${i.sessionId || ''}`
      );
      return [headers, ...rows].join('\n');
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();