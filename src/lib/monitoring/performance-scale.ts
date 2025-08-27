/**
 * Performance Monitoring System for Scale
 * Monitors performance metrics across thousands of faceted pages
 * Provides real-time insights and automated alerting
 * 
 * Performance Engineer Agent - Phase 2 Implementation
 */

import { tdspMapping } from '../../config/tdsp-mapping';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
  city: string;
  filters: string[];
  userAgent?: string;
  connectionType?: string;
}

interface PerformanceThresholds {
  pageLoadTime: number; // milliseconds
  apiResponseTime: number; // milliseconds
  cacheHitRate: number; // percentage
  errorRate: number; // percentage
}

// Performance thresholds by city tier
const PERFORMANCE_THRESHOLDS: Record<number, PerformanceThresholds> = {
  1: { // Tier 1 cities (major metros)
    pageLoadTime: 2000,
    apiResponseTime: 500,
    cacheHitRate: 90,
    errorRate: 0.1
  },
  2: { // Tier 2 cities 
    pageLoadTime: 2500,
    apiResponseTime: 750,
    cacheHitRate: 85,
    errorRate: 0.5
  },
  3: { // Tier 3 cities
    pageLoadTime: 3000,
    apiResponseTime: 1000,
    cacheHitRate: 80,
    errorRate: 1.0
  }
};

/**
 * Track page performance metrics
 */
export class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics in memory
  
  /**
   * Record performance metrics for a page load
   */
  trackPageLoad(data: {
    city: string;
    filters: string[];
    pageLoadTime: number;
    apiResponseTime?: number;
    cacheHit?: boolean;
    error?: boolean;
  }): void {
    const metric: PerformanceMetrics = {
      city: data.city,
      filters: data.filters,
      pageLoadTime: data.pageLoadTime,
      apiResponseTime: data.apiResponseTime || 0,
      cacheHitRate: data.cacheHit ? 100 : 0,
      errorRate: data.error ? 100 : 0,
      timestamp: Date.now()
    };
    
    this.metrics.push(metric);
    
    // Keep memory usage under control
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Check for performance issues
    this.checkThresholds(metric);
    
    // Send to external monitoring service
    this.sendToMonitoringService(metric);
  }
  
  /**
   * Check if metrics exceed thresholds and trigger alerts
   */
  private checkThresholds(metric: PerformanceMetrics): void {
    const cityTier = tdspMapping[metric.city]?.tier || 3;
    const thresholds = PERFORMANCE_THRESHOLDS[cityTier];
    
    const alerts: string[] = [];
    
    if (metric.pageLoadTime > thresholds.pageLoadTime) {
      alerts.push(`Slow page load: ${metric.pageLoadTime}ms (threshold: ${thresholds.pageLoadTime}ms)`);
    }
    
    if (metric.apiResponseTime > thresholds.apiResponseTime) {
      alerts.push(`Slow API response: ${metric.apiResponseTime}ms (threshold: ${thresholds.apiResponseTime}ms)`);
    }
    
    if (metric.cacheHitRate < thresholds.cacheHitRate) {
      alerts.push(`Low cache hit rate: ${metric.cacheHitRate}% (threshold: ${thresholds.cacheHitRate}%)`);
    }
    
    if (metric.errorRate > thresholds.errorRate) {
      alerts.push(`High error rate: ${metric.errorRate}% (threshold: ${thresholds.errorRate}%)`);
    }
    
    if (alerts.length > 0) {
      this.triggerAlert(metric, alerts);
    }
  }
  
  /**
   * Trigger performance alert
   */
  private triggerAlert(metric: PerformanceMetrics, issues: string[]): void {
    const alert = {
      timestamp: new Date().toISOString(),
      city: metric.city,
      filters: metric.filters,
      issues: issues,
      severity: this.calculateSeverity(metric),
      url: this.buildPageUrl(metric.city, metric.filters)
    };
    
    console.warn('PERFORMANCE ALERT:', alert);
    
    // Send to alerting service (Slack, email, etc.)
    this.sendAlert(alert);
  }
  
  /**
   * Calculate alert severity
   */
  private calculateSeverity(metric: PerformanceMetrics): 'low' | 'medium' | 'high' | 'critical' {
    const cityTier = tdspMapping[metric.city]?.tier || 3;
    const thresholds = PERFORMANCE_THRESHOLDS[cityTier];
    
    let severityScore = 0;
    
    // Page load time severity
    if (metric.pageLoadTime > thresholds.pageLoadTime * 2) severityScore += 3;
    else if (metric.pageLoadTime > thresholds.pageLoadTime * 1.5) severityScore += 2;
    else if (metric.pageLoadTime > thresholds.pageLoadTime) severityScore += 1;
    
    // API response time severity
    if (metric.apiResponseTime > thresholds.apiResponseTime * 2) severityScore += 2;
    else if (metric.apiResponseTime > thresholds.apiResponseTime) severityScore += 1;
    
    // Error rate severity
    if (metric.errorRate > 0) severityScore += 3;
    
    if (severityScore >= 6) return 'critical';
    if (severityScore >= 4) return 'high';
    if (severityScore >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Get performance statistics
   */
  getStats(timeRange: number = 3600000): PerformanceStats {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return this.getEmptyStats();
    }
    
    const totalMetrics = recentMetrics.length;
    const avgPageLoadTime = recentMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / totalMetrics;
    const avgApiResponseTime = recentMetrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / totalMetrics;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalMetrics;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / totalMetrics;
    
    // Calculate percentiles for page load time
    const sortedLoadTimes = recentMetrics.map(m => m.pageLoadTime).sort((a, b) => a - b);
    const p50LoadTime = sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.5)];
    const p95LoadTime = sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.95)];
    const p99LoadTime = sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.99)];
    
    // Group by city tier
    const tierStats = this.calculateTierStats(recentMetrics);
    
    return {
      totalRequests: totalMetrics,
      timeRange: timeRange / 1000 / 60, // minutes
      averagePageLoadTime: avgPageLoadTime,
      averageApiResponseTime: avgApiResponseTime,
      averageCacheHitRate: avgCacheHitRate,
      averageErrorRate: avgErrorRate,
      p50LoadTime,
      p95LoadTime,
      p99LoadTime,
      tierStats,
      slowestPages: this.getSlowestPages(recentMetrics),
      topErrors: this.getTopErrors(recentMetrics)
    };
  }
  
  /**
   * Calculate performance stats by city tier
   */
  private calculateTierStats(metrics: PerformanceMetrics[]): Record<number, TierStats> {
    const tierGroups: Record<number, PerformanceMetrics[]> = { 1: [], 2: [], 3: [] };
    
    metrics.forEach(metric => {
      const tier = tdspMapping[metric.city]?.tier || 3;
      tierGroups[tier].push(metric);
    });
    
    const tierStats: Record<number, TierStats> = {};
    
    Object.entries(tierGroups).forEach(([tierStr, tierMetrics]) => {
      const tier = parseInt(tierStr);
      if (tierMetrics.length === 0) {
        tierStats[tier] = {
          requestCount: 0,
          avgLoadTime: 0,
          avgCacheHitRate: 0,
          errorRate: 0,
          thresholdViolations: 0
        };
        return;
      }
      
      const thresholds = PERFORMANCE_THRESHOLDS[tier];
      const violations = tierMetrics.filter(m => 
        m.pageLoadTime > thresholds.pageLoadTime ||
        m.apiResponseTime > thresholds.apiResponseTime ||
        m.cacheHitRate < thresholds.cacheHitRate ||
        m.errorRate > thresholds.errorRate
      ).length;
      
      tierStats[tier] = {
        requestCount: tierMetrics.length,
        avgLoadTime: tierMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / tierMetrics.length,
        avgCacheHitRate: tierMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / tierMetrics.length,
        errorRate: tierMetrics.filter(m => m.errorRate > 0).length / tierMetrics.length * 100,
        thresholdViolations: violations
      };
    });
    
    return tierStats;
  }
  
  /**
   * Get slowest performing pages
   */
  private getSlowestPages(metrics: PerformanceMetrics[]): SlowPage[] {
    return metrics
      .sort((a, b) => b.pageLoadTime - a.pageLoadTime)
      .slice(0, 10)
      .map(metric => ({
        url: this.buildPageUrl(metric.city, metric.filters),
        loadTime: metric.loadTime,
        city: metric.city,
        filters: metric.filters,
        timestamp: metric.timestamp
      }));
  }
  
  /**
   * Get top error sources
   */
  private getTopErrors(metrics: PerformanceMetrics[]): ErrorSource[] {
    const errorMetrics = metrics.filter(m => m.errorRate > 0);
    const errorGroups: Record<string, number> = {};
    
    errorMetrics.forEach(metric => {
      const key = `${metric.city}/${metric.filters.join('/')}`;
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    });
    
    return Object.entries(errorGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [city, ...filters] = key.split('/');
        return {
          url: this.buildPageUrl(city, filters.filter(Boolean)),
          errorCount: count,
          city,
          filters: filters.filter(Boolean)
        };
      });
  }
  
  private buildPageUrl(city: string, filters: string[]): string {
    const base = `/texas/${city}`;
    return filters.length > 0 ? `${base}/${filters.join('/')}/` : `${base}/`;
  }
  
  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      timeRange: 0,
      averagePageLoadTime: 0,
      averageApiResponseTime: 0,
      averageCacheHitRate: 0,
      averageErrorRate: 0,
      p50LoadTime: 0,
      p95LoadTime: 0,
      p99LoadTime: 0,
      tierStats: {},
      slowestPages: [],
      topErrors: []
    };
  }
  
  /**
   * Send metrics to external monitoring service
   */
  private sendToMonitoringService(metric: PerformanceMetrics): void {
    // Implementation would send to Datadog, New Relic, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: `${metric.city}/${metric.filters.join('/')}`,
        value: Math.round(metric.pageLoadTime),
        custom_map: {
          'metric_1': metric.apiResponseTime,
          'metric_2': metric.cacheHitRate
        }
      });
    }
  }
  
  /**
   * Send alert to monitoring service
   */
  private sendAlert(alert: any): void {
    // Implementation would send to Slack, PagerDuty, etc.
    console.warn('Performance alert would be sent to monitoring service:', alert);
  }
}

// Interfaces
interface PerformanceStats {
  totalRequests: number;
  timeRange: number; // minutes
  averagePageLoadTime: number;
  averageApiResponseTime: number;
  averageCacheHitRate: number;
  averageErrorRate: number;
  p50LoadTime: number;
  p95LoadTime: number;
  p99LoadTime: number;
  tierStats: Record<number, TierStats>;
  slowestPages: SlowPage[];
  topErrors: ErrorSource[];
}

interface TierStats {
  requestCount: number;
  avgLoadTime: number;
  avgCacheHitRate: number;
  errorRate: number;
  thresholdViolations: number;
}

interface SlowPage {
  url: string;
  loadTime: number;
  city: string;
  filters: string[];
  timestamp: number;
}

interface ErrorSource {
  url: string;
  errorCount: number;
  city: string;
  filters: string[];
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();