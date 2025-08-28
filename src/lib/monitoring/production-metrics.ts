/**
 * Production Performance Monitoring System
 * Tracks API performance, cache efficiency, and deployment health for 881 cities
 */

export interface ProductionMetrics {
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    rateLimitHits: number;
    circuitBreakerTrips: number;
    errorsByType: Record<string, number>;
  };
  cache: {
    memoryHitRate: number;
    redisHitRate: number;
    cacheSize: number;
    compressionRatio?: number;
    evictionCount: number;
  };
  deployment: {
    citiesActive: number;
    tdspGroupsActive: number;
    lastDeployment: number;
    healthScore: number;
    uptime: number;
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
    eventLoopDelay: number;
    activeHandles: number;
  };
}

export interface AlertThresholds {
  errorRate: number; // e.g., 0.05 for 5%
  responseTime: number; // milliseconds
  cacheHitRate: number; // e.g., 0.8 for 80%
  memoryUsage: number; // MB
  healthScore: number; // 0-100
}

export class ProductionMonitor {
  private metrics: ProductionMetrics;
  private alerts: AlertThresholds;
  private startTime: number;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: Array<(alert: any) => void> = [];

  constructor(alertThresholds: Partial<AlertThresholds> = {}) {
    this.startTime = Date.now();
    this.alerts = {
      errorRate: 0.05,
      responseTime: 5000,
      cacheHitRate: 0.80,
      memoryUsage: 512, // MB
      healthScore: 85,
      ...alertThresholds
    };

    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): ProductionMetrics {
    return {
      api: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        rateLimitHits: 0,
        circuitBreakerTrips: 0,
        errorsByType: {}
      },
      cache: {
        memoryHitRate: 0,
        redisHitRate: 0,
        cacheSize: 0,
        evictionCount: 0
      },
      deployment: {
        citiesActive: 0,
        tdspGroupsActive: 0,
        lastDeployment: 0,
        healthScore: 100,
        uptime: 0
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        eventLoopDelay: 0,
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0
      }
    };
  }

  /**
   * Start production monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      this.checkAlerts();
    }, intervalMs);

    console.log(`🔍 Production monitoring started (${intervalMs}ms interval)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Production monitoring stopped');
  }

  /**
   * Record API request metrics
   */
  recordApiRequest(
    responseTime: number, 
    success: boolean, 
    errorType?: string
  ): void {
    this.metrics.api.totalRequests++;
    
    if (success) {
      this.metrics.api.successfulRequests++;
    } else {
      this.metrics.api.failedRequests++;
      if (errorType) {
        this.metrics.api.errorsByType[errorType] = 
          (this.metrics.api.errorsByType[errorType] || 0) + 1;
      }
    }

    // Update average response time
    const total = this.metrics.api.totalRequests;
    this.metrics.api.averageResponseTime = 
      (this.metrics.api.averageResponseTime * (total - 1) + responseTime) / total;

    // Track slow requests
    if (responseTime > this.alerts.responseTime) {
      this.metrics.api.slowRequests++;
    }
  }

  /**
   * Record cache metrics
   */
  recordCacheMetrics(
    memoryHitRate: number,
    redisHitRate: number,
    cacheSize: number,
    compressionRatio?: number
  ): void {
    this.metrics.cache.memoryHitRate = memoryHitRate;
    this.metrics.cache.redisHitRate = redisHitRate;
    this.metrics.cache.cacheSize = cacheSize;
    
    if (compressionRatio !== undefined) {
      this.metrics.cache.compressionRatio = compressionRatio;
    }
  }

  /**
   * Record deployment metrics
   */
  recordDeploymentMetrics(
    citiesActive: number,
    tdspGroupsActive: number,
    lastDeployment?: number
  ): void {
    this.metrics.deployment.citiesActive = citiesActive;
    this.metrics.deployment.tdspGroupsActive = tdspGroupsActive;
    this.metrics.deployment.uptime = Date.now() - this.startTime;
    
    if (lastDeployment) {
      this.metrics.deployment.lastDeployment = lastDeployment;
    }

    // Calculate health score
    this.calculateHealthScore();
  }

  /**
   * Collect system performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Memory usage
      this.metrics.performance.memoryUsage = process.memoryUsage();
      
      // CPU usage (if available)
      if (process.cpuUsage) {
        this.metrics.performance.cpuUsage = process.cpuUsage();
      }
      
      // Active handles
      this.metrics.performance.activeHandles = 
        (process as any)._getActiveHandles?.()?.length || 0;
      
      // Event loop delay measurement
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        this.metrics.performance.eventLoopDelay = delay;
      });

    } catch (error) {
      console.warn('Error collecting performance metrics:', error);
    }
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(): void {
    let score = 100;
    
    // Penalize high error rate
    const errorRate = this.metrics.api.failedRequests / this.metrics.api.totalRequests;
    if (errorRate > this.alerts.errorRate) {
      score -= (errorRate - this.alerts.errorRate) * 1000;
    }
    
    // Penalize slow response times
    if (this.metrics.api.averageResponseTime > this.alerts.responseTime) {
      score -= (this.metrics.api.averageResponseTime - this.alerts.responseTime) / 100;
    }
    
    // Penalize low cache hit rates
    if (this.metrics.cache.memoryHitRate < this.alerts.cacheHitRate) {
      score -= (this.alerts.cacheHitRate - this.metrics.cache.memoryHitRate) * 50;
    }
    
    // Penalize high memory usage
    const memoryUsageMB = this.metrics.performance.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > this.alerts.memoryUsage) {
      score -= (memoryUsageMB - this.alerts.memoryUsage) / 10;
    }
    
    this.metrics.deployment.healthScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Check alert thresholds and trigger alerts
   */
  private checkAlerts(): void {
    const alerts: any[] = [];
    
    // Error rate alert
    const errorRate = this.metrics.api.failedRequests / this.metrics.api.totalRequests;
    if (errorRate > this.alerts.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'critical',
        value: errorRate,
        threshold: this.alerts.errorRate,
        message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold`
      });
    }
    
    // Response time alert
    if (this.metrics.api.averageResponseTime > this.alerts.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        severity: 'warning',
        value: this.metrics.api.averageResponseTime,
        threshold: this.alerts.responseTime,
        message: `Average response time ${this.metrics.api.averageResponseTime}ms exceeds threshold`
      });
    }
    
    // Cache hit rate alert
    if (this.metrics.cache.memoryHitRate < this.alerts.cacheHitRate) {
      alerts.push({
        type: 'LOW_CACHE_HIT_RATE',
        severity: 'warning',
        value: this.metrics.cache.memoryHitRate,
        threshold: this.alerts.cacheHitRate,
        message: `Cache hit rate ${(this.metrics.cache.memoryHitRate * 100).toFixed(1)}% below threshold`
      });
    }
    
    // Memory usage alert
    const memoryUsageMB = this.metrics.performance.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > this.alerts.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'warning',
        value: memoryUsageMB,
        threshold: this.alerts.memoryUsage,
        message: `Memory usage ${memoryUsageMB.toFixed(1)}MB exceeds threshold`
      });
    }
    
    // Health score alert
    if (this.metrics.deployment.healthScore < this.alerts.healthScore) {
      alerts.push({
        type: 'LOW_HEALTH_SCORE',
        severity: 'critical',
        value: this.metrics.deployment.healthScore,
        threshold: this.alerts.healthScore,
        message: `Health score ${this.metrics.deployment.healthScore.toFixed(1)} below threshold`
      });
    }
    
    // Trigger alert callbacks
    alerts.forEach(alert => {
      console.warn(`🚨 ALERT: ${alert.message}`);
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert callback:', error);
        }
      });
    });
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: any) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProductionMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * Get metrics summary for monitoring dashboards
   */
  getMetricsSummary(): any {
    const errorRate = this.metrics.api.totalRequests > 0 
      ? this.metrics.api.failedRequests / this.metrics.api.totalRequests 
      : 0;
      
    const memoryUsageMB = this.metrics.performance.memoryUsage.heapUsed / 1024 / 1024;
    
    return {
      timestamp: Date.now(),
      healthScore: this.metrics.deployment.healthScore,
      
      requests: {
        total: this.metrics.api.totalRequests,
        successful: this.metrics.api.successfulRequests,
        failed: this.metrics.api.failedRequests,
        errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
        averageResponseTime: Math.round(this.metrics.api.averageResponseTime)
      },
      
      cache: {
        memoryHitRate: Math.round(this.metrics.cache.memoryHitRate * 100),
        redisHitRate: Math.round(this.metrics.cache.redisHitRate * 100),
        size: this.metrics.cache.cacheSize,
        compressionRatio: this.metrics.cache.compressionRatio
      },
      
      deployment: {
        citiesActive: this.metrics.deployment.citiesActive,
        tdspGroups: this.metrics.deployment.tdspGroupsActive,
        uptime: Math.round((Date.now() - this.startTime) / 1000) // seconds
      },
      
      performance: {
        memoryUsageMB: Math.round(memoryUsageMB),
        eventLoopDelay: Math.round(this.metrics.performance.eventLoopDelay),
        activeHandles: this.metrics.performance.activeHandles
      }
    };
  }

  /**
   * Export metrics to JSON for external monitoring systems
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      summary: this.getMetricsSummary(),
      alerts: this.alerts
    }, null, 2);
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
    console.log('📊 Production metrics reset');
  }
}

// Create singleton instance for production use
export const productionMonitor = new ProductionMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  productionMonitor.startMonitoring(30000); // 30 second intervals
  
  // Log summary every 5 minutes
  setInterval(() => {
    const summary = productionMonitor.getMetricsSummary();
    console.log('📊 Production Metrics Summary:');
    console.log(`   Health Score: ${summary.healthScore}/100`);
    console.log(`   Requests: ${summary.requests.total} (${summary.requests.errorRate}% error rate)`);
    console.log(`   Cache Hit Rate: ${summary.cache.memoryHitRate}% memory, ${summary.cache.redisHitRate}% Redis`);
    console.log(`   Memory Usage: ${summary.performance.memoryUsageMB}MB`);
    console.log(`   Active Cities: ${summary.deployment.citiesActive}`);
  }, 300000); // 5 minutes
}

// Graceful shutdown
process.on('SIGINT', () => {
  productionMonitor.stopMonitoring();
});

process.on('SIGTERM', () => {
  productionMonitor.stopMonitoring();
});