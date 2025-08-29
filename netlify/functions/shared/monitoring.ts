/**
 * Production-grade monitoring and logging system for Netlify Functions
 * Provides comprehensive performance tracking, error monitoring, and operational insights
 */

interface MetricEvent {
  eventType: 'function_invocation' | 'api_call' | 'cache_hit' | 'cache_miss' | 'error' | 'performance';
  functionName: string;
  requestId: string;
  timestamp: number;
  duration?: number;
  data?: Record<string, any>;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  lastResetTime: number;
}

class ProductionMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private events: MetricEvent[] = [];
  private maxEventHistory = 1000; // Keep last 1000 events
  private metricsResetInterval = 3600000; // 1 hour
  private lastCleanup = Date.now();

  /**
   * Record function invocation start
   */
  public startInvocation(functionName: string, requestId: string, metadata?: Record<string, any>): void {
    this.recordEvent({
      eventType: 'function_invocation',
      functionName,
      requestId,
      timestamp: Date.now(),
      data: metadata
    });

    this.initializeMetrics(functionName);
    const metrics = this.metrics.get(functionName)!;
    metrics.totalRequests++;
  }

  /**
   * Record function invocation completion
   */
  public endInvocation(
    functionName: string, 
    requestId: string, 
    success: boolean, 
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const metrics = this.metrics.get(functionName)!;
    
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update response time metrics
    this.updateResponseTimes(functionName, duration);
    this.updateAverageResponseTime(functionName);
    
    // Record completion event
    this.recordEvent({
      eventType: 'performance',
      functionName,
      requestId,
      timestamp: Date.now(),
      duration,
      data: {
        success,
        ...metadata
      }
    });

    this.cleanupIfNeeded();
  }

  /**
   * Record API call performance
   */
  public recordAPICall(
    functionName: string,
    requestId: string,
    apiEndpoint: string,
    duration: number,
    success: boolean,
    cacheHit: boolean = false
  ): void {
    const eventType = cacheHit ? 'cache_hit' : (success ? 'api_call' : 'error');
    
    this.recordEvent({
      eventType,
      functionName,
      requestId,
      timestamp: Date.now(),
      duration,
      data: {
        endpoint: apiEndpoint,
        success,
        cacheHit
      }
    });

    // Update cache hit rate
    const metrics = this.metrics.get(functionName)!;
    const totalApiCalls = this.getEventCount(functionName, ['api_call', 'cache_hit']);
    const cacheHits = this.getEventCount(functionName, ['cache_hit']);
    
    if (totalApiCalls > 0) {
      metrics.cacheHitRate = (cacheHits / totalApiCalls) * 100;
    }
  }

  /**
   * Record error occurrence
   */
  public recordError(
    functionName: string,
    requestId: string,
    error: Error,
    context?: Record<string, any>
  ): void {
    this.recordEvent({
      eventType: 'error',
      functionName,
      requestId,
      timestamp: Date.now(),
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      },
      data: context
    });

    // Update error rate
    const metrics = this.metrics.get(functionName)!;
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
  }

  /**
   * Get current metrics for a function
   */
  public getMetrics(functionName: string): PerformanceMetrics | null {
    return this.metrics.get(functionName) || null;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Record<string, PerformanceMetrics> {
    const result: Record<string, PerformanceMetrics> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = { ...metrics };
    }
    return result;
  }

  /**
   * Get recent events for debugging
   */
  public getRecentEvents(
    functionName?: string, 
    eventType?: string, 
    limit: number = 100
  ): MetricEvent[] {
    let filtered = this.events;

    if (functionName) {
      filtered = filtered.filter(e => e.functionName === functionName);
    }

    if (eventType) {
      filtered = filtered.filter(e => e.eventType === eventType);
    }

    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get performance summary for health checks
   */
  public getHealthSummary(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
    lastActivity: number;
  } {
    const allMetrics = Object.values(this.getAllMetrics());
    
    if (allMetrics.length === 0) {
      return {
        status: 'healthy',
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        lastActivity: 0
      };
    }

    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalFailed = allMetrics.reduce((sum, m) => sum + m.failedRequests, 0);
    const errorRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;
    const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length;
    const avgCacheHitRate = allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / allMetrics.length;
    
    const lastActivity = this.events.length > 0 ? 
      Math.max(...this.events.map(e => e.timestamp)) : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Health thresholds
    if (errorRate > 10 || avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 5 || avgResponseTime > 2000 || avgCacheHitRate < 50) {
      status = 'degraded';
    }

    return {
      status,
      totalRequests,
      errorRate,
      averageResponseTime: avgResponseTime,
      cacheHitRate: avgCacheHitRate,
      lastActivity
    };
  }

  /**
   * Generate performance report
   */
  public generateReport(functionName?: string): string {
    const metrics = functionName ? 
      { [functionName]: this.getMetrics(functionName)! } : 
      this.getAllMetrics();

    const report = ['=== Netlify Functions Performance Report ==='];
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    for (const [name, metric] of Object.entries(metrics)) {
      if (!metric) continue;
      
      report.push(`Function: ${name}`);
      report.push(`  Total Requests: ${metric.totalRequests}`);
      report.push(`  Successful: ${metric.successfulRequests} (${((metric.successfulRequests / metric.totalRequests) * 100).toFixed(1)}%)`);
      report.push(`  Failed: ${metric.failedRequests} (${metric.errorRate.toFixed(1)}%)`);
      report.push(`  Average Response Time: ${metric.averageResponseTime.toFixed(0)}ms`);
      report.push(`  P95 Response Time: ${metric.p95ResponseTime.toFixed(0)}ms`);
      report.push(`  P99 Response Time: ${metric.p99ResponseTime.toFixed(0)}ms`);
      report.push(`  Cache Hit Rate: ${metric.cacheHitRate.toFixed(1)}%`);
      report.push(`  Last Reset: ${new Date(metric.lastResetTime).toISOString()}`);
      report.push('');
    }

    // Recent errors
    const recentErrors = this.getRecentEvents(functionName, 'error', 5);
    if (recentErrors.length > 0) {
      report.push('Recent Errors:');
      recentErrors.forEach(error => {
        report.push(`  ${new Date(error.timestamp).toISOString()}: ${error.error?.message}`);
      });
      report.push('');
    }

    return report.join('\n');
  }

  /**
   * Log to console with structured format
   */
  public log(
    level: 'info' | 'warn' | 'error',
    functionName: string,
    requestId: string,
    message: string,
    data?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      function: functionName,
      requestId,
      message,
      ...data
    };

    const logMessage = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Reset metrics for a function
   */
  public resetMetrics(functionName: string): void {
    this.metrics.set(functionName, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      lastResetTime: Date.now()
    });

    this.responseTimes.set(functionName, []);
  }

  /**
   * Initialize metrics if they don't exist
   */
  private initializeMetrics(functionName: string): void {
    if (!this.metrics.has(functionName)) {
      this.resetMetrics(functionName);
    }
  }

  /**
   * Record a metric event
   */
  private recordEvent(event: MetricEvent): void {
    this.events.push(event);

    // Keep only recent events to prevent memory bloat
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory);
    }
  }

  /**
   * Update response time tracking
   */
  private updateResponseTimes(functionName: string, duration: number): void {
    if (!this.responseTimes.has(functionName)) {
      this.responseTimes.set(functionName, []);
    }

    const times = this.responseTimes.get(functionName)!;
    times.push(duration);

    // Keep only last 100 response times for percentile calculation
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }

    // Update percentiles
    const sorted = [...times].sort((a, b) => a - b);
    const metrics = this.metrics.get(functionName)!;
    
    if (sorted.length >= 20) {
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      metrics.p95ResponseTime = sorted[p95Index];
      metrics.p99ResponseTime = sorted[p99Index];
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(functionName: string): void {
    const times = this.responseTimes.get(functionName) || [];
    if (times.length === 0) return;

    const sum = times.reduce((total, time) => total + time, 0);
    const metrics = this.metrics.get(functionName)!;
    metrics.averageResponseTime = sum / times.length;
  }

  /**
   * Get count of events by type
   */
  private getEventCount(functionName: string, eventTypes: string[]): number {
    return this.events.filter(e => 
      e.functionName === functionName && eventTypes.includes(e.eventType)
    ).length;
  }

  /**
   * Cleanup old data periodically
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    
    if (now - this.lastCleanup > this.metricsResetInterval) {
      // Reset metrics older than reset interval
      for (const [functionName, metrics] of this.metrics.entries()) {
        if (now - metrics.lastResetTime > this.metricsResetInterval) {
          console.log(`Resetting metrics for ${functionName} after ${this.metricsResetInterval / 1000}s`);
          this.resetMetrics(functionName);
        }
      }

      // Clean up old events
      const cutoff = now - this.metricsResetInterval;
      this.events = this.events.filter(e => e.timestamp > cutoff);

      this.lastCleanup = now;
    }
  }
}

// Export singleton instance
export const monitor = new ProductionMonitor();

// Export utility functions for common monitoring patterns
export const logInfo = (functionName: string, requestId: string, message: string, data?: Record<string, any>) => {
  monitor.log('info', functionName, requestId, message, data);
};

export const logError = (functionName: string, requestId: string, error: Error, data?: Record<string, any>) => {
  monitor.log('error', functionName, requestId, error.message, {
    errorType: error.constructor.name,
    stack: error.stack,
    ...data
  });
  monitor.recordError(functionName, requestId, error, data);
};

export const logWarning = (functionName: string, requestId: string, message: string, data?: Record<string, any>) => {
  monitor.log('warn', functionName, requestId, message, data);
};

// Performance timing utilities
export const createTimer = (functionName: string, requestId: string) => {
  const startTime = Date.now();
  
  return {
    end: (success: boolean, metadata?: Record<string, any>) => {
      const duration = Date.now() - startTime;
      monitor.endInvocation(functionName, requestId, success, duration, metadata);
      return duration;
    },
    recordApiCall: (endpoint: string, success: boolean, cacheHit: boolean = false) => {
      const duration = Date.now() - startTime;
      monitor.recordAPICall(functionName, requestId, endpoint, duration, success, cacheHit);
      return duration;
    }
  };
};

// Health check endpoint helper
export const getHealthStatus = () => {
  return {
    ...monitor.getHealthSummary(),
    functions: monitor.getAllMetrics(),
    timestamp: new Date().toISOString()
  };
};

// Performance report generation
export const generatePerformanceReport = (functionName?: string) => {
  return monitor.generateReport(functionName);
};

// Initialize monitoring on import
monitor.log('info', 'monitoring', 'system', 'Production monitoring system initialized', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV
});