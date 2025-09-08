/**
 * Analytics Service - Enhanced for ZIP Navigation System
 * Task T017 from tasks.md
 * Constitutional compliance: Privacy-focused analytics, no PII storage
 */

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
  private zipValidations: any[] = [];
  private cityValidations: any[] = [];
  private interactions: any[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly batchDelay = 5000; // 5 seconds

  /**
   * Track ZIP code validation attempts
   */
  async trackZIPValidation(data: {
    zipCode: string;
    success: boolean;
    errorCode?: string;
    cityName?: string;
    tdspTerritory?: string;
    planCount?: number;
    validationTime: number;
  }): Promise<void> {
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
        console.log(`[Analytics] ZIP validation success: ${data.zipCode} → ${data.cityName}`);
      } else {
        console.log(`[Analytics] ZIP validation error: ${data.zipCode} → ${data.errorCode}`);
      }
    } catch (error) {
      console.error('[Analytics] Error tracking ZIP validation:', error);
      // Don't throw - analytics failures shouldn't break functionality
    }
  }

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

      console.log(`[Analytics] City validation: ${data.citySlug} → ${data.planCount} plans`);
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
      const validatedInteraction = validateFormInteractionRequest(interaction);
      
      // Create FormInteraction model
      const interactionModel = FormInteractionModel.create({
        zipCode: validatedInteraction.zipCode,
        cityPage: validatedInteraction.cityPage,
        action: validatedInteraction.action,
        duration: validatedInteraction.duration,
        deviceType: validatedInteraction.deviceType,
        success: validatedInteraction.success,
        sessionId: validatedInteraction.sessionId
      });

      // Add to batch queue for efficient processing
      this.batchQueue.push(interactionModel.toJSON());
      
      // Process batch if it reaches size limit
      if (this.batchQueue.length >= this.batchSize) {
        await this.processBatch();
      } else {
        // Set timeout for batch processing if not already set
        this.scheduleBatchProcessing();
      }

      // Real-time tracking for critical actions
      if (validatedInteraction.action === 'submit' || validatedInteraction.action === 'error') {
        await this.processInteractionImmediately(interactionModel.toJSON());
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

      console.log(`[AnalyticsService] Processed batch of ${batch.length} interactions`);
      
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
      console.log(`[AnalyticsService] Successful ZIP submission: ${interaction.zipCode} on ${interaction.cityPage}`);
    } else if (interaction.action === 'error') {
      console.log(`[AnalyticsService] Error interaction: ${interaction.zipCode} on ${interaction.cityPage}`);
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
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
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