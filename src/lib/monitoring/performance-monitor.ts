/**
 * Performance Monitor for 881-City Optimization
 * Comprehensive monitoring system for routing, caching, and API performance
 * 
 * Features:
 * - Real-time performance tracking
 * - Memory usage monitoring
 * - API performance metrics
 * - Route timing analysis
 * - Automated performance alerts
 * - Performance reporting dashboard
 */

import { routeCacheManager, getCachePerformanceStats } from '../cache/route-cache-manager';
import { getRouterCacheStats, clearRouterCaches } from '../faceted/faceted-router';
import { comparePowerClient } from '../api/comparepower-client';

interface PerformanceMetric {
  timestamp: number;
  route: string;
  duration: number;
  cacheHit: boolean;
  planCount: number;
  memoryUsage: number;
  apiCalls: number;
  tier: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  route?: string;
}

interface PerformanceSummary {
  timeWindow: string;
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  memoryUsageMB: number;
  slowestRoutes: Array<{ route: string; avgTime: number; count: number }>;
  apiPerformance: {
    totalCalls: number;
    averageTime: number;
    errorRate: number;
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  // Performance thresholds for 881-city optimization
  private readonly THRESHOLDS = {
    ROUTE_TIME_WARNING: 1000,      // 1 second
    ROUTE_TIME_ERROR: 2000,        // 2 seconds
    ROUTE_TIME_CRITICAL: 5000,     // 5 seconds
    MEMORY_WARNING_MB: 1024,       // 1GB
    MEMORY_ERROR_MB: 1536,         // 1.5GB
    MEMORY_CRITICAL_MB: 2048,      // 2GB
    CACHE_HIT_RATE_WARNING: 0.7,   // 70%
    CACHE_HIT_RATE_ERROR: 0.5,     // 50%
    API_ERROR_RATE_WARNING: 0.05,  // 5%
    API_ERROR_RATE_ERROR: 0.1,     // 10%
    MAX_METRICS_HISTORY: 10000,    // Keep max 10k metrics
    ALERT_COOLDOWN_MS: 300000,     // 5 minutes between same alerts
  };

  private lastAlertTimes = new Map<string, number>();

  constructor() {
    this.startMonitoring();
    this.setupGracefulShutdown();
  }

  /**
   * Record a performance metric for route processing
   */
  recordRouteMetric(
    route: string,
    duration: number,
    cacheHit: boolean = false,
    planCount: number = 0,
    tier: number = 3,
    apiCalls: number = 0
  ): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      route,
      duration,
      cacheHit,
      planCount,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      apiCalls,
      tier
    };

    this.metrics.push(metric);
    this.enforceMetricsLimit();
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Starting performance monitoring for 881-city optimization...');

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Log performance summary every 5 minutes
    setInterval(() => {
      this.logPerformanceSummary();
    }, 300000);

    console.log('✅ Performance monitoring active');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🛑 Performance monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const now = Date.now();
      const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes

      // Memory monitoring
      const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      this.checkMemoryUsage(memoryUsage);

      // Cache performance monitoring
      const cacheStats = getCachePerformanceStats();
      this.checkCachePerformance(cacheStats);

      // API performance monitoring
      const apiStats = await this.getApiStats();
      this.checkApiPerformance(apiStats);

      // Route performance monitoring
      this.checkRoutePerformance(recentMetrics);

      // Cleanup old alerts
      this.cleanupOldAlerts();

    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.createAlert('error', 'Health check failure', 'system', 0, 0, error.message);
    }
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    // Route timing alerts
    if (metric.duration > this.THRESHOLDS.ROUTE_TIME_CRITICAL) {
      this.createAlert('critical', 'Critical route performance', 'route_time', metric.duration, this.THRESHOLDS.ROUTE_TIME_CRITICAL, metric.route);
    } else if (metric.duration > this.THRESHOLDS.ROUTE_TIME_ERROR) {
      this.createAlert('error', 'Poor route performance', 'route_time', metric.duration, this.THRESHOLDS.ROUTE_TIME_ERROR, metric.route);
    } else if (metric.duration > this.THRESHOLDS.ROUTE_TIME_WARNING) {
      this.createAlert('warning', 'Slow route performance', 'route_time', metric.duration, this.THRESHOLDS.ROUTE_TIME_WARNING, metric.route);
    }

    // Memory usage alerts
    this.checkMemoryUsage(metric.memoryUsage);
  }

  /**
   * Check memory usage and create alerts if needed
   */
  private checkMemoryUsage(memoryMB: number): void {
    if (memoryMB > this.THRESHOLDS.MEMORY_CRITICAL_MB) {
      this.createAlert('critical', 'Critical memory usage', 'memory', memoryMB, this.THRESHOLDS.MEMORY_CRITICAL_MB);
      this.performEmergencyCleanup();
    } else if (memoryMB > this.THRESHOLDS.MEMORY_ERROR_MB) {
      this.createAlert('error', 'High memory usage', 'memory', memoryMB, this.THRESHOLDS.MEMORY_ERROR_MB);
      this.performMemoryOptimization();
    } else if (memoryMB > this.THRESHOLDS.MEMORY_WARNING_MB) {
      this.createAlert('warning', 'Elevated memory usage', 'memory', memoryMB, this.THRESHOLDS.MEMORY_WARNING_MB);
    }
  }

  /**
   * Check cache performance
   */
  private checkCachePerformance(cacheStats: any): void {
    if (cacheStats.memory.hitRate < this.THRESHOLDS.CACHE_HIT_RATE_ERROR) {
      this.createAlert('error', 'Poor cache hit rate', 'cache_hit_rate', cacheStats.memory.hitRate, this.THRESHOLDS.CACHE_HIT_RATE_ERROR);
    } else if (cacheStats.memory.hitRate < this.THRESHOLDS.CACHE_HIT_RATE_WARNING) {
      this.createAlert('warning', 'Low cache hit rate', 'cache_hit_rate', cacheStats.memory.hitRate, this.THRESHOLDS.CACHE_HIT_RATE_WARNING);
    }
  }

  /**
   * Check API performance
   */
  private checkApiPerformance(apiStats: any): void {
    const errorRate = apiStats.errors / (apiStats.total || 1);
    
    if (errorRate > this.THRESHOLDS.API_ERROR_RATE_ERROR) {
      this.createAlert('error', 'High API error rate', 'api_error_rate', errorRate, this.THRESHOLDS.API_ERROR_RATE_ERROR);
    } else if (errorRate > this.THRESHOLDS.API_ERROR_RATE_WARNING) {
      this.createAlert('warning', 'Elevated API error rate', 'api_error_rate', errorRate, this.THRESHOLDS.API_ERROR_RATE_WARNING);
    }
  }

  /**
   * Check route performance patterns
   */
  private checkRoutePerformance(metrics: PerformanceMetric[]): void {
    if (metrics.length === 0) return;

    const routeStats = new Map<string, { times: number[]; count: number }>();
    
    for (const metric of metrics) {
      const stats = routeStats.get(metric.route) || { times: [], count: 0 };
      stats.times.push(metric.duration);
      stats.count++;
      routeStats.set(metric.route, stats);
    }

    // Check for consistently slow routes
    for (const [route, stats] of routeStats.entries()) {
      if (stats.count >= 3) { // At least 3 requests
        const avgTime = stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length;
        
        if (avgTime > this.THRESHOLDS.ROUTE_TIME_WARNING) {
          this.createAlert('warning', 'Consistently slow route', 'route_average', avgTime, this.THRESHOLDS.ROUTE_TIME_WARNING, route);
        }
      }
    }
  }

  /**
   * Create performance alert with cooldown
   */
  private createAlert(
    type: 'warning' | 'error' | 'critical',
    message: string,
    metric: string,
    value: number,
    threshold: number,
    route?: string
  ): void {
    const alertKey = `${metric}:${route || 'global'}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTimes.get(alertKey) || 0;
    
    // Apply cooldown to prevent spam
    if (now - lastAlert < this.THRESHOLDS.ALERT_COOLDOWN_MS) {
      return;
    }
    
    const alert: PerformanceAlert = {
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: now,
      route
    };
    
    this.alerts.push(alert);
    this.lastAlertTimes.set(alertKey, now);
    
    // Log critical alerts immediately
    if (type === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${message} - ${metric}: ${value} > ${threshold}${route ? ` (Route: ${route})` : ''}`);
    } else if (type === 'error') {
      console.error(`❌ ERROR ALERT: ${message} - ${metric}: ${value} > ${threshold}${route ? ` (Route: ${route})` : ''}`);
    } else {
      console.warn(`⚠️  WARNING ALERT: ${message} - ${metric}: ${value} > ${threshold}${route ? ` (Route: ${route})` : ''}`);
    }
  }

  /**
   * Emergency cleanup for critical memory situations
   */
  private performEmergencyCleanup(): void {
    console.warn('🆘 Performing emergency cleanup...');
    
    try {
      // Clear all caches
      clearRouterCaches();
      routeCacheManager.clearCache();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clear old metrics
      this.metrics = this.metrics.slice(-1000);
      
      console.log('✅ Emergency cleanup completed');
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
    }
  }

  /**
   * Memory optimization for high memory situations
   */
  private performMemoryOptimization(): void {
    console.warn('🔧 Performing memory optimization...');
    
    try {
      // Clear old metrics
      this.metrics = this.metrics.slice(-5000);
      
      // Clear old alerts
      this.alerts = this.alerts.slice(-100);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      console.log('✅ Memory optimization completed');
    } catch (error) {
      console.error('❌ Memory optimization failed:', error);
    }
  }

  /**
   * Get recent performance metrics
   */
  private getRecentMetrics(windowMs: number): PerformanceMetric[] {
    const cutoff = Date.now() - windowMs;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Get API performance statistics
   */
  private async getApiStats(): Promise<any> {
    try {
      const cacheStats = await comparePowerClient.getCacheStats();
      return {
        total: cacheStats.metrics.totalRequests || 0,
        successful: cacheStats.metrics.successfulRequests || 0,
        errors: cacheStats.metrics.failedRequests || 0,
        averageTime: cacheStats.metrics.averageResponseTime || 0
      };
    } catch (error) {
      return { total: 0, successful: 0, errors: 0, averageTime: 0 };
    }
  }

  /**
   * Generate performance summary
   */
  getPerformanceSummary(windowMs: number = 3600000): PerformanceSummary {
    const recentMetrics = this.getRecentMetrics(windowMs);
    const recentAlerts = this.alerts.filter(alert => Date.now() - alert.timestamp < windowMs);
    
    const totalRequests = recentMetrics.length;
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length || 0;
    const p95ResponseTime = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99ResponseTime = durations[Math.floor(durations.length * 0.99)] || 0;
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
    
    // Calculate slowest routes
    const routeStats = new Map<string, { totalTime: number; count: number }>();
    for (const metric of recentMetrics) {
      const stats = routeStats.get(metric.route) || { totalTime: 0, count: 0 };
      stats.totalTime += metric.duration;
      stats.count++;
      routeStats.set(metric.route, stats);
    }
    
    const slowestRoutes = Array.from(routeStats.entries())
      .map(([route, stats]) => ({
        route,
        avgTime: Math.round(stats.totalTime / stats.count),
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics, recentAlerts);

    return {
      timeWindow: `${Math.round(windowMs / 60000)} minutes`,
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      p95ResponseTime: Math.round(p95ResponseTime * 10) / 10,
      p99ResponseTime: Math.round(p99ResponseTime * 10) / 10,
      cacheHitRate: Math.round(cacheHitRate * 1000) / 1000,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      slowestRoutes,
      apiPerformance: {
        totalCalls: recentMetrics.reduce((sum, m) => sum + m.apiCalls, 0),
        averageTime: 0, // Would need API integration
        errorRate: 0    // Would need API integration
      },
      alerts: recentAlerts,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Memory recommendations
    const memoryAlerts = alerts.filter(a => a.metric === 'memory');
    if (memoryAlerts.length > 0) {
      recommendations.push('Consider increasing memory limits or optimizing cache sizes');
    }
    
    // Route performance recommendations
    const slowRoutes = metrics.filter(m => m.duration > this.THRESHOLDS.ROUTE_TIME_WARNING).length;
    if (slowRoutes > metrics.length * 0.1) {
      recommendations.push('Consider preloading more popular routes or optimizing route validation');
    }
    
    // Cache recommendations
    const cacheHitRate = metrics.filter(m => m.cacheHit).length / (metrics.length || 1);
    if (cacheHitRate < this.THRESHOLDS.CACHE_HIT_RATE_WARNING) {
      recommendations.push('Improve cache hit rate by warming more popular routes');
    }
    
    // Tier-based recommendations
    const tier3Routes = metrics.filter(m => m.tier === 3 && m.duration > 1000).length;
    if (tier3Routes > 0) {
      recommendations.push('Consider reducing priority or caching for slower Tier 3 cities');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }
    
    return recommendations;
  }

  /**
   * Utility methods
   */
  private enforceMetricsLimit(): void {
    if (this.metrics.length > this.THRESHOLDS.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-Math.floor(this.THRESHOLDS.MAX_METRICS_HISTORY * 0.8));
    }
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Log performance summary
   */
  private logPerformanceSummary(): void {
    const summary = this.getPerformanceSummary(300000); // Last 5 minutes
    
    console.log('\n📈 PERFORMANCE SUMMARY (881-City System)');
    console.log('═'.repeat(60));
    console.log(`Time Window: ${summary.timeWindow}`);
    console.log(`Total Requests: ${summary.totalRequests}`);
    console.log(`Avg Response Time: ${summary.averageResponseTime}ms`);
    console.log(`P95 Response Time: ${summary.p95ResponseTime}ms`);
    console.log(`P99 Response Time: ${summary.p99ResponseTime}ms`);
    console.log(`Cache Hit Rate: ${Math.round(summary.cacheHitRate * 100)}%`);
    console.log(`Memory Usage: ${summary.memoryUsageMB}MB`);
    console.log(`Active Alerts: ${summary.alerts.length}`);
    
    if (summary.slowestRoutes.length > 0) {
      console.log('\n🐌 Slowest Routes:');
      summary.slowestRoutes.slice(0, 3).forEach(route => {
        console.log(`  ${route.route}: ${route.avgTime}ms (${route.count} requests)`);
      });
    }
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    console.log('═'.repeat(60));
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = () => {
      console.log('🛑 Shutting down performance monitor...');
      this.stopMonitoring();
      console.log('✅ Performance monitor shutdown complete');
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Manual methods for external use
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts.length = 0;
    this.lastAlertTimes.clear();
    console.log('🗑️  Performance alerts cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export function recordRoutePerformance(
  route: string,
  duration: number,
  cacheHit: boolean = false,
  planCount: number = 0,
  tier: number = 3
): void {
  performanceMonitor.recordRouteMetric(route, duration, cacheHit, planCount, tier);
}

export function getPerformanceDashboard() {
  return performanceMonitor.getPerformanceSummary();
}

export function getSystemHealth() {
  const summary = performanceMonitor.getPerformanceSummary(300000);
  const criticalAlerts = summary.alerts.filter(a => a.type === 'critical').length;
  const errorAlerts = summary.alerts.filter(a => a.type === 'error').length;
  
  return {
    status: criticalAlerts > 0 ? 'critical' : errorAlerts > 0 ? 'degraded' : 'healthy',
    averageResponseTime: summary.averageResponseTime,
    memoryUsage: summary.memoryUsageMB,
    cacheHitRate: summary.cacheHitRate,
    alerts: {
      critical: criticalAlerts,
      error: errorAlerts,
      warning: summary.alerts.filter(a => a.type === 'warning').length
    }
  };
}