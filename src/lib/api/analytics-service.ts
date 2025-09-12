/**
 * Analytics & Reporting Service for ChooseMyPower
 * Comprehensive analytics system for tracking user behavior, performance, and business metrics
 * Features:
 * - Real-time user journey tracking
 * - Conversion funnel analysis
 * - Plan comparison analytics
 * - Performance monitoring
 * - Business intelligence reporting
 */

import type { ApiMetrics, UserSearch, PlanComparison, Lead } from '../database/schema';
import { planRepository } from '../database/plan-repository';

export interface UserJourneyEvent {
  sessionId: string;
  userId?: string;
  event: 'page_view' | 'search' | 'plan_view' | 'comparison_start' | 'comparison_complete' | 'lead_capture' | 'conversion';
  page?: string;
  planId?: string;
  searchQuery?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversionFunnel {
  step: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  totalRequests: number;
  slowQueries: number;
}

export interface BusinessMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  averageLeadScore: number;
  topPerformingPages: Array<{ page: string; views: number; conversions: number }>;
  topSearchQueries: Array<{ query: string; count: number; conversions: number }>;
  planPopularity: Array<{ planId: string; views: number; comparisons: number }>;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentSearches: number;
  recentConversions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>;
}

export class AnalyticsService {
  private eventQueue: UserJourneyEvent[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private realTimeMetrics: RealTimeMetrics = {
    activeUsers: 0,
    currentSearches: 0,
    recentConversions: 0,
    systemHealth: 'healthy',
    alerts: [],
  };

  constructor() {
    // Start background processing
    this.startEventProcessor();
    this.startRealTimeMetricsUpdater();
  }

  /**
   * Track user journey events
   */
  async trackEvent(event: UserJourneyEvent): Promise<void> {
    try {
      // Add to queue for batch processing
      this.eventQueue.push({
        ...event,
        timestamp: new Date(),
      });

      // Update real-time metrics
      this.updateRealTimeMetrics(event);

      // Process immediately if queue is full
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        await this.flushEventQueue();
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(sessionId: string, page: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'page_view',
      page,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Track search
   */
  async trackSearch(
    sessionId: string,
    query: string,
    resultsCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'search',
      searchQuery: query,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        resultsCount,
      },
    });
  }

  /**
   * Track plan view
   */
  async trackPlanView(sessionId: string, planId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'plan_view',
      planId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Track plan comparison
   */
  async trackPlanComparison(
    sessionId: string,
    planIds: string[],
    duration: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'comparison_start',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        planIds,
        planCount: planIds.length,
      },
    });

    // Track completion after duration
    setTimeout(() => {
      this.trackEvent({
        sessionId,
        event: 'comparison_complete',
        timestamp: new Date(),
        metadata: {
          ...metadata,
          planIds,
          duration,
        },
      });
    }, duration * 1000);
  }

  /**
   * Track lead capture
   */
  async trackLeadCapture(
    sessionId: string,
    leadId: string,
    score: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'lead_capture',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        leadId,
        score,
      },
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(
    sessionId: string,
    conversionType: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'conversion',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        conversionType,
        value,
      },
    });
  }

  /**
   * Get conversion funnel analysis
   */
  async getConversionFunnel(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ConversionFunnel[]> {
    const events = await planRepository.getUserJourneyEvents(timeframe);
    
    // Define funnel steps
    const steps = [
      { step: 'Landing Page Visit', events: ['page_view'] },
      { step: 'Search Performed', events: ['search'] },
      { step: 'Plan Viewed', events: ['plan_view'] },
      { step: 'Comparison Started', events: ['comparison_start'] },
      { step: 'Lead Captured', events: ['lead_capture'] },
      { step: 'Conversion', events: ['conversion'] },
    ];

    const funnel: ConversionFunnel[] = [];
    let previousUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const users = this.countUniqueUsers(events, step.events);
      
      const conversionRate = previousUsers > 0 ? (users / previousUsers) * 100 : 100;
      const dropOffRate = previousUsers > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

      funnel.push({
        step: step.step,
        users,
        conversionRate,
        dropOffRate,
      });

      previousUsers = users;
    }

    return funnel;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceMetrics> {
    const metrics = await planRepository.getPerformanceMetrics(timeframe);
    
    return {
      avgResponseTime: metrics.avgResponseTime || 0,
      p95ResponseTime: metrics.p95ResponseTime || 0,
      p99ResponseTime: metrics.p99ResponseTime || 0,
      errorRate: metrics.errorRate || 0,
      cacheHitRate: metrics.cacheHitRate || 0,
      totalRequests: metrics.totalRequests || 0,
      slowQueries: metrics.slowQueries || 0,
    };
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<BusinessMetrics> {
    const [
      leadMetrics,
      topPages,
      topQueries,
      planStats
    ] = await Promise.all([
      planRepository.getLeadAnalytics(timeframe),
      planRepository.getTopPerformingPages(timeframe),
      planRepository.getTopSearchQueries(timeframe),
      planRepository.getPlanPopularityStats(timeframe),
    ]);

    return {
      totalLeads: leadMetrics.totalLeads,
      qualifiedLeads: leadMetrics.qualifiedLeads,
      conversionRate: leadMetrics.conversionRate,
      averageLeadScore: leadMetrics.averageScore,
      topPerformingPages: topPages,
      topSearchQueries: topQueries,
      planPopularity: planStats,
    };
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): RealTimeMetrics {
    return { ...this.realTimeMetrics };
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    overview: BusinessMetrics;
    funnel: ConversionFunnel[];
    performance: PerformanceMetrics;
    realTime: RealTimeMetrics;
    trends: {
      trafficTrend: Array<{ date: string; visits: number; conversions: number }>;
      searchTrend: Array<{ date: string; searches: number; results: number }>;
      performanceTrend: Array<{ date: string; responseTime: number; errorRate: number }>;
    };
  }> {
    const [overview, funnel, performance, trends] = await Promise.all([
      this.getBusinessMetrics(timeframe),
      this.getConversionFunnel(timeframe),
      this.getPerformanceMetrics(timeframe),
      this.getTrendData(timeframe),
    ]);

    return {
      overview,
      funnel,
      performance,
      realTime: this.getRealTimeMetrics(),
      trends,
    };
  }

  /**
   * Get user journey for a specific session
   */
  async getUserJourney(sessionId: string): Promise<{
    events: UserJourneyEvent[];
    summary: {
      duration: number;
      pagesViewed: number;
      searchesPerformed: number;
      plansViewed: number;
      comparisionsMade: number;
      leadCaptured: boolean;
      converted: boolean;
    };
  }> {
    const events = await planRepository.getSessionEvents(sessionId);
    
    const summary = {
      duration: this.calculateSessionDuration(events),
      pagesViewed: events.filter(e => e.event === 'page_view').length,
      searchesPerformed: events.filter(e => e.event === 'search').length,
      plansViewed: events.filter(e => e.event === 'plan_view').length,
      comparisionsMade: events.filter(e => e.event === 'comparison_start').length,
      leadCaptured: events.some(e => e.event === 'lead_capture'),
      converted: events.some(e => e.event === 'conversion'),
    };

    return { events, summary };
  }

  /**
   * Get plan comparison analytics
   */
  async getPlanComparisonAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalComparisons: number;
    averagePlansPerComparison: number;
    mostComparedPlans: Array<{ planId: string; count: number; provider: string }>;
    comparisonConversionRate: number;
    popularComparisons: Array<{ planIds: string[]; count: number }>;
  }> {
    return planRepository.getPlanComparisonAnalytics(timeframe);
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    noResultsRate: number;
    averageResultsPerQuery: number;
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    searchToLeadRate: number;
    queryCategories: Record<string, number>;
  }> {
    return planRepository.getSearchAnalytics(timeframe);
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(config: {
    metrics: string[];
    timeframe: { start: Date; end: Date };
    filters?: Record<string, unknown>;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    data: Array<Record<string, unknown>>;
    summary: Record<string, unknown>;
    metadata: {
      generatedAt: Date;
      timeframe: { start: Date; end: Date };
      totalRecords: number;
    };
  }> {
    // Implement custom report generation logic
    return {
      data: [],
      summary: {},
      metadata: {
        generatedAt: new Date(),
        timeframe: config.timeframe,
        totalRecords: 0,
      },
    };
  }

  /**
   * Private methods for internal processing
   */

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Batch insert into database
      await planRepository.storeUserJourneyEvents(events);

    } catch (error) {
      console.error('Failed to flush event queue:', error);
      // Put events back in queue for retry
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private startEventProcessor(): void {
    setInterval(() => {
      this.flushEventQueue();
    }, this.FLUSH_INTERVAL);
  }

  private startRealTimeMetricsUpdater(): void {
    setInterval(async () => {
      await this.updateRealTimeMetrics();
    }, 10000); // Update every 10 seconds
  }

  private async updateRealTimeMetrics(newEvent?: UserJourneyEvent): Promise<void> {
    try {
      // Update active users count
      this.realTimeMetrics.activeUsers = await planRepository.getActiveUsersCount();
      
      // Update current searches
      this.realTimeMetrics.currentSearches = await planRepository.getCurrentSearchesCount();
      
      // Update recent conversions
      this.realTimeMetrics.recentConversions = await planRepository.getRecentConversionsCount();

      // Check system health
      this.realTimeMetrics.systemHealth = await this.checkSystemHealth();

      // Update alerts
      this.realTimeMetrics.alerts = await this.getSystemAlerts();

    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
      this.realTimeMetrics.systemHealth = 'critical';
    }
  }

  private async checkSystemHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    const checks = await Promise.all([
      planRepository.healthCheck(),
      this.checkApiResponseTimes(),
      this.checkErrorRates(),
    ]);

    if (checks.some(check => !check.healthy && check.critical)) {
      return 'critical';
    } else if (checks.some(check => !check.healthy)) {
      return 'warning';
    }
    return 'healthy';
  }

  private async checkApiResponseTimes(): Promise<{ healthy: boolean; critical: boolean }> {
    const metrics = await planRepository.getRecentPerformanceMetrics();
    const healthy = metrics.avgResponseTime < 1000; // Less than 1 second
    const critical = metrics.avgResponseTime > 5000; // More than 5 seconds
    return { healthy, critical };
  }

  private async checkErrorRates(): Promise<{ healthy: boolean; critical: boolean }> {
    const metrics = await planRepository.getRecentErrorRates();
    const healthy = metrics.errorRate < 0.05; // Less than 5%
    const critical = metrics.errorRate > 0.20; // More than 20%
    return { healthy, critical };
  }

  private async getSystemAlerts(): Promise<Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>> {
    const alerts = [];
    
    // Check for high error rates
    const errorRate = await planRepository.getCurrentErrorRate();
    if (errorRate > 0.10) {
      alerts.push({
        type: 'error_rate',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        severity: 'error' as const,
      });
    }

    // Check for slow response times
    const avgResponseTime = await planRepository.getCurrentAvgResponseTime();
    if (avgResponseTime > 3000) {
      alerts.push({
        type: 'slow_response',
        message: `Slow response times: ${avgResponseTime}ms average`,
        severity: 'warning' as const,
      });
    }

    // Check for database connection issues
    const dbHealthy = await planRepository.isDatabaseHealthy();
    if (!dbHealthy) {
      alerts.push({
        type: 'database',
        message: 'Database connection issues detected',
        severity: 'error' as const,
      });
    }

    return alerts;
  }

  private countUniqueUsers(events: UserJourneyEvent[], eventTypes: string[]): number {
    const uniqueUsers = new Set();
    events.forEach(event => {
      if (eventTypes.includes(event.event)) {
        uniqueUsers.add(event.sessionId);
      }
    });
    return uniqueUsers.size;
  }

  private calculateSessionDuration(events: UserJourneyEvent[]): number {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const start = sortedEvents[0].timestamp.getTime();
    const end = sortedEvents[sortedEvents.length - 1].timestamp.getTime();
    
    return Math.round((end - start) / 1000); // Duration in seconds
  }

  private async getTrendData(timeframe: 'day' | 'week' | 'month'): Promise<{
    trafficTrend: Array<{ date: string; visits: number; conversions: number }>;
    searchTrend: Array<{ date: string; searches: number; results: number }>;
    performanceTrend: Array<{ date: string; responseTime: number; errorRate: number }>;
  }> {
    return {
      trafficTrend: await planRepository.getTrafficTrend(timeframe),
      searchTrend: await planRepository.getSearchTrend(timeframe),
      performanceTrend: await planRepository.getPerformanceTrend(timeframe),
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(
    format: 'csv' | 'json' | 'xlsx',
    timeframe: { start: Date; end: Date },
    metrics: string[]
  ): Promise<string> {
    // Implement data export functionality
    return 'exported-data-url';
  }

  /**
   * Schedule automated reports
   */
  async scheduleReport(config: {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    metrics: string[];
    format: 'pdf' | 'html' | 'csv';
  }): Promise<string> {
    // Implement automated report scheduling
    return 'report-id';
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for external use
export type {
  UserJourneyEvent,
  ConversionFunnel,
  PerformanceMetrics,
  BusinessMetrics,
  RealTimeMetrics,
};