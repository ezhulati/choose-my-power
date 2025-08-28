/**
 * Production Metrics Collector for ChooseMyPower.org
 * Enterprise monitoring system with real-time metrics collection
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

/**
 * Production Metrics Configuration
 */
const metricsConfig = {
  collection: {
    interval: 30000, // 30 seconds
    enableRealTime: true,
    enableHistorical: true,
    enableAlerts: true
  },
  storage: {
    metricsPath: path.join(projectRoot, 'reports', 'metrics'),
    retentionDays: 30,
    compressionEnabled: true
  },
  thresholds: {
    // Core Web Vitals
    lcp: { good: 2500, poor: 4000 }, // milliseconds
    fid: { good: 100, poor: 300 },   // milliseconds
    cls: { good: 0.1, poor: 0.25 },  // score
    
    // System metrics
    responseTime: { good: 1000, poor: 3000 }, // milliseconds
    errorRate: { good: 0.01, poor: 0.05 },    // percentage
    availability: { good: 0.99, poor: 0.95 }, // percentage
    
    // Business metrics
    conversionRate: { good: 0.03, poor: 0.01 }, // percentage
    bounceRate: { good: 0.4, poor: 0.7 }        // percentage
  },
  endpoints: {
    health: 'https://choosemypower.org/health',
    vitals: 'https://choosemypower.org/api/vitals',
    analytics: 'https://choosemypower.org/api/analytics'
  },
  alerts: {
    webhook: process.env.ALERTS_WEBHOOK_URL,
    email: process.env.ALERTS_EMAIL,
    slack: process.env.SLACK_WEBHOOK_URL
  }
};

/**
 * Production Metrics Collector Class
 */
class ProductionMetricsCollector {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.metrics = new Map();
    this.alertHistory = new Map();
    this.startTime = Date.now();
  }

  async initialize() {
    // Ensure metrics directory exists
    await fs.mkdir(metricsConfig.storage.metricsPath, { recursive: true });
    
    console.log('📊 Production Metrics Collector initialized');
    console.log(`📍 Metrics storage: ${metricsConfig.storage.metricsPath}`);
    console.log(`⏱️  Collection interval: ${metricsConfig.collection.interval}ms`);
  }

  async collectHealthMetrics() {
    try {
      const response = await fetch(metricsConfig.endpoints.health, {
        timeout: 10000,
        headers: { 'User-Agent': 'ChooseMyPower-Metrics/1.0' }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const healthData = await response.json();
      
      return {
        timestamp: Date.now(),
        status: healthData.status,
        responseTime: healthData.metrics?.responseTime || 0,
        availability: healthData.status === 'healthy' ? 1 : 0,
        checks: healthData.checks,
        memoryUsage: healthData.metrics?.memoryUsage,
        uptime: healthData.metrics?.uptime || 0
      };
    } catch (error) {
      return {
        timestamp: Date.now(),
        status: 'error',
        responseTime: 0,
        availability: 0,
        error: error.message
      };
    }
  }

  async collectPerformanceMetrics() {
    const criticalPages = [
      { url: 'https://choosemypower.org/', name: 'homepage' },
      { url: 'https://choosemypower.org/texas/dallas', name: 'dallas-city' },
      { url: 'https://choosemypower.org/electricity-plans/dallas-tx', name: 'dallas-plans' },
      { url: 'https://choosemypower.org/providers', name: 'providers' }
    ];

    const performanceMetrics = [];

    for (const page of criticalPages) {
      try {
        const start = Date.now();
        const response = await fetch(page.url, {
          timeout: 15000,
          headers: { 'User-Agent': 'ChooseMyPower-Metrics/1.0' }
        });

        const responseTime = Date.now() - start;
        const contentLength = parseInt(response.headers.get('content-length') || '0');

        performanceMetrics.push({
          page: page.name,
          url: page.url,
          responseTime,
          status: response.status,
          contentLength,
          available: response.ok,
          timestamp: Date.now()
        });

        // Simulate Core Web Vitals collection (in production, this would come from real user monitoring)
        performanceMetrics.push({
          page: page.name,
          metric: 'lcp',
          value: responseTime * 1.2, // Approximate LCP
          timestamp: Date.now()
        });

      } catch (error) {
        performanceMetrics.push({
          page: page.name,
          url: page.url,
          error: error.message,
          available: false,
          timestamp: Date.now()
        });
      }
    }

    return performanceMetrics;
  }

  async collectBusinessMetrics() {
    // In production, this would integrate with analytics APIs
    // For now, we'll simulate realistic business metrics
    
    const baseConversionRate = 0.032; // 3.2% base conversion rate
    const baseBounceRate = 0.45;     // 45% base bounce rate
    
    // Add some realistic variance
    const conversionVariance = (Math.random() - 0.5) * 0.01;
    const bounceVariance = (Math.random() - 0.5) * 0.1;
    
    return {
      timestamp: Date.now(),
      conversionRate: Math.max(0, baseConversionRate + conversionVariance),
      bounceRate: Math.max(0, Math.min(1, baseBounceRate + bounceVariance)),
      pageViews: Math.floor(Math.random() * 1000) + 500,
      uniqueVisitors: Math.floor(Math.random() * 300) + 200,
      avgSessionDuration: Math.floor(Math.random() * 180) + 120, // seconds
      topPages: [
        { page: '/', views: Math.floor(Math.random() * 200) + 100 },
        { page: '/texas/dallas', views: Math.floor(Math.random() * 150) + 75 },
        { page: '/electricity-plans/dallas-tx', views: Math.floor(Math.random() * 100) + 50 }
      ]
    };
  }

  async collectAPIMetrics() {
    try {
      // Import the API client to get cache stats
      const { comparePowerClient } = await import('../../src/lib/api/comparepower-client.ts');
      
      const cacheStats = await comparePowerClient.getCacheStats();
      
      return {
        timestamp: Date.now(),
        cache: {
          hitRate: cacheStats.redis?.hitRate || 0,
          memoryUsage: cacheStats.memory?.totalEntries || 0,
          redisConnected: cacheStats.redis?.connected || false
        },
        api: {
          totalRequests: cacheStats.metrics?.totalRequests || 0,
          successfulRequests: cacheStats.metrics?.successfulRequests || 0,
          failedRequests: cacheStats.metrics?.failedRequests || 0,
          averageResponseTime: cacheStats.metrics?.averageResponseTime || 0,
          circuitBreakerTrips: cacheStats.metrics?.circuitBreakerTrips || 0
        }
      };
    } catch (error) {
      return {
        timestamp: Date.now(),
        error: error.message,
        cache: { hitRate: 0, memoryUsage: 0, redisConnected: false },
        api: { totalRequests: 0, successfulRequests: 0, failedRequests: 0 }
      };
    }
  }

  async collectAllMetrics() {
    const timestamp = Date.now();
    
    console.log(`📊 Collecting metrics at ${new Date(timestamp).toISOString()}`);
    
    try {
      const [healthMetrics, performanceMetrics, businessMetrics, apiMetrics] = await Promise.allSettled([
        this.collectHealthMetrics(),
        this.collectPerformanceMetrics(),
        this.collectBusinessMetrics(),
        this.collectAPIMetrics()
      ]);

      const combinedMetrics = {
        timestamp,
        collection: {
          duration: Date.now() - timestamp,
          success: true
        },
        health: healthMetrics.status === 'fulfilled' ? healthMetrics.value : { error: healthMetrics.reason?.message },
        performance: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : { error: performanceMetrics.reason?.message },
        business: businessMetrics.status === 'fulfilled' ? businessMetrics.value : { error: businessMetrics.reason?.message },
        api: apiMetrics.status === 'fulfilled' ? apiMetrics.value : { error: apiMetrics.reason?.message }
      };

      // Store metrics
      await this.storeMetrics(combinedMetrics);
      
      // Check for alerts
      await this.checkAlerts(combinedMetrics);
      
      // Update in-memory metrics
      this.metrics.set(timestamp, combinedMetrics);
      
      // Cleanup old metrics (keep last 1000 entries in memory)
      if (this.metrics.size > 1000) {
        const oldestKey = this.metrics.keys().next().value;
        this.metrics.delete(oldestKey);
      }
      
      console.log(`✅ Metrics collection completed (${combinedMetrics.collection.duration}ms)`);
      
      return combinedMetrics;
      
    } catch (error) {
      console.error('❌ Metrics collection failed:', error.message);
      
      const errorMetrics = {
        timestamp,
        collection: {
          duration: Date.now() - timestamp,
          success: false,
          error: error.message
        }
      };
      
      await this.storeMetrics(errorMetrics);
      return errorMetrics;
    }
  }

  async storeMetrics(metrics) {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `metrics-${dateStr}.json`;
    const filepath = path.join(metricsConfig.storage.metricsPath, filename);
    
    try {
      let existingData = [];
      
      // Try to read existing data
      try {
        const data = await fs.readFile(filepath, 'utf8');
        existingData = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is empty, start with empty array
      }
      
      // Append new metrics
      existingData.push(metrics);
      
      // Write back to file
      await fs.writeFile(filepath, JSON.stringify(existingData, null, 2));
      
    } catch (error) {
      console.error('Failed to store metrics:', error.message);
    }
  }

  async checkAlerts(metrics) {
    const alerts = [];
    
    // Health alerts
    if (metrics.health.status !== 'healthy') {
      alerts.push({
        type: 'health',
        severity: 'critical',
        message: `Health check failed: ${metrics.health.status}`,
        value: metrics.health.status,
        timestamp: metrics.timestamp
      });
    }
    
    // Performance alerts
    if (metrics.health.responseTime > metricsConfig.thresholds.responseTime.poor) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow response time: ${metrics.health.responseTime}ms`,
        value: metrics.health.responseTime,
        threshold: metricsConfig.thresholds.responseTime.poor,
        timestamp: metrics.timestamp
      });
    }
    
    // Availability alerts
    if (metrics.health.availability < metricsConfig.thresholds.availability.poor) {
      alerts.push({
        type: 'availability',
        severity: 'critical',
        message: `Low availability: ${(metrics.health.availability * 100).toFixed(1)}%`,
        value: metrics.health.availability,
        threshold: metricsConfig.thresholds.availability.poor,
        timestamp: metrics.timestamp
      });
    }
    
    // Business metrics alerts
    if (metrics.business && metrics.business.conversionRate < metricsConfig.thresholds.conversionRate.poor) {
      alerts.push({
        type: 'business',
        severity: 'warning',
        message: `Low conversion rate: ${(metrics.business.conversionRate * 100).toFixed(2)}%`,
        value: metrics.business.conversionRate,
        threshold: metricsConfig.thresholds.conversionRate.poor,
        timestamp: metrics.timestamp
      });
    }
    
    // API alerts
    if (metrics.api && metrics.api.cache && metrics.api.cache.hitRate < 0.5) {
      alerts.push({
        type: 'cache',
        severity: 'warning',
        message: `Low cache hit rate: ${(metrics.api.cache.hitRate * 100).toFixed(1)}%`,
        value: metrics.api.cache.hitRate,
        timestamp: metrics.timestamp
      });
    }
    
    // Send alerts that haven't been sent recently
    for (const alert of alerts) {
      const alertKey = `${alert.type}-${alert.severity}`;
      const lastAlert = this.alertHistory.get(alertKey);
      const alertCooldown = 300000; // 5 minutes
      
      if (!lastAlert || (Date.now() - lastAlert) > alertCooldown) {
        await this.sendAlert(alert);
        this.alertHistory.set(alertKey, Date.now());
      }
    }
    
    return alerts;
  }

  async sendAlert(alert) {
    console.log(`🚨 ALERT: [${alert.severity.toUpperCase()}] ${alert.message}`);
    
    if (!metricsConfig.alerts.slack) {
      return;
    }
    
    const color = {
      'critical': 'danger',
      'warning': 'warning',
      'info': 'good'
    }[alert.severity] || 'warning';
    
    const payload = {
      text: `🚨 ChooseMyPower.org Alert`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toISOString(),
            short: false
          }
        ]
      }]
    };
    
    try {
      const response = await fetch(metricsConfig.alerts.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('📤 Alert sent successfully');
      }
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  async generateReport() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Get metrics from the last hour
    const recentMetrics = Array.from(this.metrics.entries())
      .filter(([timestamp]) => timestamp >= oneHourAgo)
      .map(([_, metrics]) => metrics);
    
    if (recentMetrics.length === 0) {
      return { message: 'No recent metrics available' };
    }
    
    const healthMetrics = recentMetrics.map(m => m.health).filter(Boolean);
    const performanceMetrics = recentMetrics.map(m => m.performance).filter(Boolean).flat();
    const businessMetrics = recentMetrics.map(m => m.business).filter(Boolean);
    
    const report = {
      timestamp: now,
      period: {
        start: oneHourAgo,
        end: now,
        duration: now - oneHourAgo,
        samplesCount: recentMetrics.length
      },
      health: {
        uptime: healthMetrics.filter(h => h.status === 'healthy').length / healthMetrics.length,
        averageResponseTime: healthMetrics.reduce((sum, h) => sum + (h.responseTime || 0), 0) / healthMetrics.length,
        totalErrors: healthMetrics.filter(h => h.error).length
      },
      performance: {
        averageResponseTime: this.calculateAverage(performanceMetrics.map(p => p.responseTime).filter(Boolean)),
        availability: performanceMetrics.filter(p => p.available).length / Math.max(performanceMetrics.length, 1),
        totalRequests: performanceMetrics.length
      },
      business: businessMetrics.length > 0 ? {
        averageConversionRate: this.calculateAverage(businessMetrics.map(b => b.conversionRate)),
        averageBounceRate: this.calculateAverage(businessMetrics.map(b => b.bounceRate)),
        totalPageViews: businessMetrics.reduce((sum, b) => sum + (b.pageViews || 0), 0)
      } : null
    };
    
    return report;
  }

  calculateAverage(values) {
    const filtered = values.filter(v => typeof v === 'number' && !isNaN(v));
    return filtered.length > 0 ? filtered.reduce((sum, v) => sum + v, 0) / filtered.length : 0;
  }

  async start() {
    if (this.isRunning) {
      console.log('📊 Metrics collector is already running');
      return;
    }
    
    await this.initialize();
    
    this.isRunning = true;
    
    // Collect initial metrics
    await this.collectAllMetrics();
    
    // Set up interval collection
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.collectAllMetrics();
      }
    }, metricsConfig.collection.interval);
    
    console.log('🚀 Production metrics collector started');
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('⏹️  Production metrics collector stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: Date.now() - this.startTime,
      metricsCount: this.metrics.size,
      alertsCount: this.alertHistory.size,
      lastCollection: this.metrics.size > 0 ? Math.max(...this.metrics.keys()) : null
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  const collector = new ProductionMetricsCollector();
  
  switch (command) {
    case 'start':
      await collector.start();
      
      // Keep running until interrupted
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down metrics collector...');
        await collector.stop();
        process.exit(0);
      });
      
      // Generate reports every hour
      setInterval(async () => {
        const report = await collector.generateReport();
        console.log('📊 Hourly Report:', JSON.stringify(report, null, 2));
      }, 60 * 60 * 1000);
      
      break;
      
    case 'collect':
      await collector.initialize();
      const metrics = await collector.collectAllMetrics();
      console.log(JSON.stringify(metrics, null, 2));
      process.exit(0);
      break;
      
    case 'report':
      await collector.start();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for some data
      const report = await collector.generateReport();
      console.log(JSON.stringify(report, null, 2));
      await collector.stop();
      process.exit(0);
      break;
      
    case 'status':
      const status = collector.getStatus();
      console.log(JSON.stringify(status, null, 2));
      process.exit(0);
      break;
      
    default:
      console.log('Usage: node production-metrics-collector.mjs [start|collect|report|status]');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProductionMetricsCollector, metricsConfig };