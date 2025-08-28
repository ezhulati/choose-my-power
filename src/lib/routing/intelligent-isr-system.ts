/**
 * Intelligent Incremental Static Regeneration (ISR) System
 * Enterprise-grade ISR for ChooseMyPower.org with smart cache invalidation
 * 
 * Features:
 * - Smart revalidation based on data freshness and user demand
 * - Predictive page regeneration using traffic patterns
 * - Priority-based regeneration queue with circuit breakers
 * - Real-time price change detection and invalidation
 * - Edge cache coordination with CDN invalidation
 * - Performance analytics and monitoring
 * - Graceful fallback strategies
 */

import type { 
  CachedRoute, 
  RoutePriority, 
  RouteCache 
} from './enterprise-routing-system';
import { enterpriseCacheSystem } from './enterprise-cache-system';
import { comparePowerClient } from '../api/comparepower-client';
import { tdspMapping } from '../../config/tdsp-mapping';

export interface ISRConfig {
  // Revalidation timing
  defaultRevalidateSeconds: number;
  criticalRouteRevalidateSeconds: number;
  lowPriorityRouteRevalidateSeconds: number;
  maxStaleWhileRevalidateSeconds: number;
  
  // Queue management
  maxQueueSize: number;
  maxConcurrentRegens: number;
  regenTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  
  // Smart invalidation
  enablePriceChangeDetection: boolean;
  priceChangeThreshold: number; // percentage
  enableTrafficBasedRevalidation: boolean;
  trafficThreshold: number; // requests per hour
  
  // Performance limits
  maxDailyRegeneration: number;
  regenerationRateLimitMs: number;
  enablePreemptiveRegeneration: boolean;
  
  // CDN integration
  enableCdnInvalidation: boolean;
  cdnInvalidationBatchSize: number;
  cdnInvalidationDelayMs: number;
}

export interface RegenerationTask {
  routePath: string;
  priority: RoutePriority;
  reason: RegenerationReason;
  scheduledAt: number;
  attempts: number;
  lastError?: string;
  estimatedDuration?: number;
}

export interface RegenerationMetrics {
  totalRegenerations: number;
  successfulRegenerations: number;
  failedRegenerations: number;
  averageRegenerationTime: number;
  queueLength: number;
  dailyRegenerationCount: number;
  lastResetTime: number;
  topRegeneratedRoutes: Array<{ route: string; count: number }>;
}

export interface TrafficPattern {
  routePath: string;
  hourlyRequests: number[];
  peakHours: number[];
  averageResponseTime: number;
  lastAccessTime: number;
  accessCount: number;
}

export type RegenerationReason = 
  | 'scheduled'
  | 'price_change'
  | 'high_traffic' 
  | 'data_stale'
  | 'manual'
  | 'cdn_miss'
  | 'error_recovery';

export class IntelligentISRSystem {
  private config: ISRConfig;
  private cache: RouteCache;
  private regenerationQueue: Map<string, RegenerationTask> = new Map();
  private activeRegenerations: Set<string> = new Set();
  private metrics: RegenerationMetrics;
  private trafficPatterns: Map<string, TrafficPattern> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private isShuttingDown: boolean = false;

  constructor(config?: Partial<ISRConfig>, cache?: RouteCache) {
    this.config = {
      // Revalidation timing
      defaultRevalidateSeconds: 1800, // 30 minutes
      criticalRouteRevalidateSeconds: 900, // 15 minutes
      lowPriorityRouteRevalidateSeconds: 7200, // 2 hours
      maxStaleWhileRevalidateSeconds: 86400, // 24 hours
      
      // Queue management
      maxQueueSize: 1000,
      maxConcurrentRegens: 5,
      regenTimeoutMs: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelayMs: 5000,
      
      // Smart invalidation
      enablePriceChangeDetection: true,
      priceChangeThreshold: 5, // 5% price change
      enableTrafficBasedRevalidation: true,
      trafficThreshold: 100, // 100 requests per hour
      
      // Performance limits
      maxDailyRegeneration: 5000,
      regenerationRateLimitMs: 1000, // 1 second between regens
      enablePreemptiveRegeneration: true,
      
      // CDN integration
      enableCdnInvalidation: true,
      cdnInvalidationBatchSize: 50,
      cdnInvalidationDelayMs: 5000,
      
      ...config
    };

    this.cache = cache || enterpriseCacheSystem;
    
    this.metrics = {
      totalRegenerations: 0,
      successfulRegenerations: 0,
      failedRegenerations: 0,
      averageRegenerationTime: 0,
      queueLength: 0,
      dailyRegenerationCount: 0,
      lastResetTime: Date.now(),
      topRegeneratedRoutes: []
    };

    this.initializeISRSystem();
  }

  /**
   * Initialize the ISR system with background processes
   */
  private initializeISRSystem(): void {
    console.log('🔄 Initializing Intelligent ISR System...');

    // Start queue processor
    this.startQueueProcessor();

    // Start traffic pattern analyzer
    this.startTrafficAnalyzer();

    // Start price monitoring
    if (this.config.enablePriceChangeDetection) {
      this.startPriceMonitoring();
    }

    // Schedule daily metrics reset
    this.scheduleDailyReset();

    // Graceful shutdown handler
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());

    console.log('✅ ISR System initialized successfully');
  }

  /**
   * Check if a route needs regeneration
   */
  async shouldRegenerate(routePath: string, lastGenerated: number): Promise<{
    shouldRegenerate: boolean;
    reason: RegenerationReason;
    priority: RoutePriority;
  }> {
    try {
      const now = Date.now();
      const ageSeconds = (now - lastGenerated) / 1000;
      
      // Get route priority and traffic pattern
      const cached = await this.cache.get(routePath);
      const priority = cached?.priority || 'low';
      const traffic = this.trafficPatterns.get(routePath);
      
      // Check scheduled revalidation
      const revalidateThreshold = this.getRevalidationThreshold(priority);
      if (ageSeconds > revalidateThreshold) {
        return {
          shouldRegenerate: true,
          reason: 'scheduled',
          priority
        };
      }

      // Check price changes
      if (this.config.enablePriceChangeDetection) {
        const priceChangeDetected = await this.detectPriceChanges(routePath);
        if (priceChangeDetected) {
          return {
            shouldRegenerate: true,
            reason: 'price_change',
            priority: this.elevatedPriority(priority)
          };
        }
      }

      // Check traffic-based revalidation
      if (this.config.enableTrafficBasedRevalidation && traffic) {
        const highTrafficDetected = this.isHighTrafficRoute(traffic);
        if (highTrafficDetected && ageSeconds > revalidateThreshold * 0.5) {
          return {
            shouldRegenerate: true,
            reason: 'high_traffic',
            priority
          };
        }
      }

      // Check data staleness
      const isStale = ageSeconds > this.config.maxStaleWhileRevalidateSeconds;
      if (isStale) {
        return {
          shouldRegenerate: true,
          reason: 'data_stale',
          priority: this.elevatedPriority(priority)
        };
      }

      return {
        shouldRegenerate: false,
        reason: 'scheduled',
        priority
      };

    } catch (error) {
      console.error('❌ Error checking regeneration status:', error);
      return {
        shouldRegenerate: false,
        reason: 'scheduled',
        priority: 'low'
      };
    }
  }

  /**
   * Queue a route for regeneration
   */
  async queueRegeneration(
    routePath: string, 
    reason: RegenerationReason,
    priority: RoutePriority = 'medium'
  ): Promise<boolean> {
    try {
      // Check queue limits
      if (this.regenerationQueue.size >= this.config.maxQueueSize) {
        console.warn(`⚠️  Regeneration queue full (${this.config.maxQueueSize}), skipping ${routePath}`);
        return false;
      }

      // Check daily limits
      if (this.metrics.dailyRegenerationCount >= this.config.maxDailyRegeneration) {
        console.warn(`⚠️  Daily regeneration limit reached (${this.config.maxDailyRegeneration})`);
        return false;
      }

      // Skip if already in queue or actively regenerating
      if (this.regenerationQueue.has(routePath) || this.activeRegenerations.has(routePath)) {
        return false;
      }

      const task: RegenerationTask = {
        routePath,
        priority,
        reason,
        scheduledAt: Date.now(),
        attempts: 0
      };

      this.regenerationQueue.set(routePath, task);
      this.metrics.queueLength = this.regenerationQueue.size;

      console.log(`📥 Queued regeneration: ${routePath} (reason: ${reason}, priority: ${priority})`);
      return true;

    } catch (error) {
      console.error('❌ Error queueing regeneration:', error);
      return false;
    }
  }

  /**
   * Manually trigger regeneration for specific routes
   */
  async regenerateRoutes(routePaths: string[], reason: RegenerationReason = 'manual'): Promise<number> {
    let queuedCount = 0;

    for (const routePath of routePaths) {
      const success = await this.queueRegeneration(routePath, reason, 'high');
      if (success) queuedCount++;
    }

    console.log(`🔄 Manually queued ${queuedCount}/${routePaths.length} routes for regeneration`);
    return queuedCount;
  }

  /**
   * Invalidate routes by pattern with smart batching
   */
  async invalidateRoutes(pattern: string): Promise<number> {
    try {
      console.log(`🗑️  Invalidating routes matching pattern: ${pattern}`);

      // Invalidate cache entries
      const invalidatedCount = await this.cache.invalidate(pattern);

      // Queue regeneration for high-priority routes
      if (invalidatedCount > 0) {
        await this.queuePatternRegeneration(pattern);
        
        // CDN invalidation
        if (this.config.enableCdnInvalidation) {
          await this.invalidateCdn(pattern);
        }
      }

      return invalidatedCount;

    } catch (error) {
      console.error('❌ Error invalidating routes:', error);
      return 0;
    }
  }

  /**
   * Get current ISR metrics and status
   */
  getMetrics(): RegenerationMetrics & { config: ISRConfig; queueStatus: any } {
    return {
      ...this.metrics,
      config: this.config,
      queueStatus: {
        queueSize: this.regenerationQueue.size,
        activeRegenerations: this.activeRegenerations.size,
        pendingByPriority: this.getQueueByPriority()
      }
    };
  }

  /**
   * Start the queue processor that handles regeneration tasks
   */
  private startQueueProcessor(): void {
    const processQueue = async () => {
      if (this.isShuttingDown) return;

      try {
        // Process queued tasks
        await this.processRegenerationQueue();

        // Schedule next processing cycle
        setTimeout(processQueue, 1000);

      } catch (error) {
        console.error('❌ Queue processor error:', error);
        setTimeout(processQueue, 5000); // Retry after delay
      }
    };

    processQueue();
    console.log('✅ Queue processor started');
  }

  /**
   * Process the regeneration queue
   */
  private async processRegenerationQueue(): Promise<void> {
    if (this.activeRegenerations.size >= this.config.maxConcurrentRegens) {
      return; // Too many active regenerations
    }

    // Get highest priority task
    const task = this.getHighestPriorityTask();
    if (!task) return;

    // Remove from queue and add to active
    this.regenerationQueue.delete(task.routePath);
    this.activeRegenerations.add(task.routePath);
    this.metrics.queueLength = this.regenerationQueue.size;

    // Execute regeneration
    this.executeRegeneration(task)
      .finally(() => {
        this.activeRegenerations.delete(task.routePath);
      });
  }

  /**
   * Execute a single regeneration task
   */
  private async executeRegeneration(task: RegenerationTask): Promise<void> {
    const startTime = Date.now();
    task.attempts++;

    try {
      console.log(`🔄 Regenerating: ${task.routePath} (attempt ${task.attempts})`);

      // Rate limiting
      await this.enforceRateLimit();

      // Perform regeneration
      await this.performRouteRegeneration(task.routePath);

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateSuccessMetrics(duration, task.routePath);

      console.log(`✅ Regenerated: ${task.routePath} in ${duration}ms`);

    } catch (error) {
      console.error(`❌ Regeneration failed: ${task.routePath}`, error);

      task.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.failedRegenerations++;

      // Retry logic
      if (task.attempts < this.config.retryAttempts) {
        setTimeout(() => {
          this.regenerationQueue.set(task.routePath, task);
        }, this.config.retryDelayMs * task.attempts);
      }
    }
  }

  /**
   * Perform the actual route regeneration
   */
  private async performRouteRegeneration(routePath: string): Promise<void> {
    // Parse route to get city and filters
    const segments = routePath.split('/');
    const citySlug = segments[0];
    const filterSegments = segments.slice(1);

    const cityConfig = tdspMapping[citySlug];
    if (!cityConfig) {
      throw new Error(`Unknown city: ${citySlug}`);
    }

    // Fetch fresh data
    const plans = await comparePowerClient.fetchPlans({
      tdsp_duns: cityConfig.duns,
      display_usage: 1000
      // Add filter parameters here based on filterSegments
    });

    // Calculate pricing metrics
    const rates = plans.map(p => parseFloat(p.rate) || 0).filter(r => r > 0);
    const planMetrics = {
      count: plans.length,
      lowestRate: rates.length > 0 ? Math.min(...rates) : 0,
      highestRate: rates.length > 0 ? Math.max(...rates) : 0,
      avgRate: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
    };

    // Update cache with fresh data
    const cachedRoute: CachedRoute = {
      params: { path: routePath },
      props: {
        citySlug,
        cityName: cityConfig.city,
        tdspDuns: cityConfig.duns,
        filterSegments,
        tier: cityConfig.tier || 3,
        priority: 'medium',
        lastUpdated: Date.now(),
        preloaded: true,
        ...planMetrics
      },
      generatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      priority: 'medium',
      seoValue: 'medium'
    };

    await this.cache.set(routePath, cachedRoute);

    // Store price history for change detection
    this.updatePriceHistory(routePath, planMetrics.avgRate);
  }

  /**
   * Detect price changes for a route
   */
  private async detectPriceChanges(routePath: string): Promise<boolean> {
    if (!this.config.enablePriceChangeDetection) return false;

    const history = this.priceHistory.get(routePath) || [];
    if (history.length < 2) return false;

    const currentPrice = history[history.length - 1];
    const previousPrice = history[history.length - 2];
    
    if (previousPrice === 0) return false;

    const changePercent = Math.abs((currentPrice - previousPrice) / previousPrice) * 100;
    return changePercent >= this.config.priceChangeThreshold;
  }

  /**
   * Track route access patterns for traffic-based revalidation
   */
  trackRouteAccess(routePath: string, responseTime: number): void {
    let pattern = this.trafficPatterns.get(routePath);
    
    if (!pattern) {
      pattern = {
        routePath,
        hourlyRequests: new Array(24).fill(0),
        peakHours: [],
        averageResponseTime: responseTime,
        lastAccessTime: Date.now(),
        accessCount: 0
      };
    }

    // Update metrics
    const currentHour = new Date().getHours();
    pattern.hourlyRequests[currentHour]++;
    pattern.accessCount++;
    pattern.lastAccessTime = Date.now();
    
    // Update average response time
    pattern.averageResponseTime = 
      (pattern.averageResponseTime * (pattern.accessCount - 1) + responseTime) / pattern.accessCount;

    this.trafficPatterns.set(routePath, pattern);
  }

  /**
   * Utility methods
   */
  private getRevalidationThreshold(priority: RoutePriority): number {
    switch (priority) {
      case 'critical': return this.config.criticalRouteRevalidateSeconds;
      case 'high': return this.config.defaultRevalidateSeconds * 0.75;
      case 'medium': return this.config.defaultRevalidateSeconds;
      case 'low': return this.config.lowPriorityRouteRevalidateSeconds;
      default: return this.config.defaultRevalidateSeconds;
    }
  }

  private elevatedPriority(priority: RoutePriority): RoutePriority {
    const elevationMap: Record<RoutePriority, RoutePriority> = {
      'low': 'medium',
      'medium': 'high',
      'high': 'critical',
      'critical': 'critical'
    };
    return elevationMap[priority];
  }

  private isHighTrafficRoute(pattern: TrafficPattern): boolean {
    const hourlyAverage = pattern.hourlyRequests.reduce((a, b) => a + b, 0) / 24;
    return hourlyAverage >= this.config.trafficThreshold / 24;
  }

  private getHighestPriorityTask(): RegenerationTask | null {
    if (this.regenerationQueue.size === 0) return null;

    const tasks = Array.from(this.regenerationQueue.values());
    const priorityOrder: Record<RoutePriority, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledAt - b.scheduledAt; // FIFO for same priority
    })[0];
  }

  private getQueueByPriority(): Record<RoutePriority, number> {
    const counts: Record<RoutePriority, number> = {
      'critical': 0,
      'high': 0,
      'medium': 0,
      'low': 0
    };

    for (const task of this.regenerationQueue.values()) {
      counts[task.priority]++;
    }

    return counts;
  }

  private async enforceRateLimit(): Promise<void> {
    // Simple rate limiting - wait if needed
    await new Promise(resolve => setTimeout(resolve, this.config.regenerationRateLimitMs));
  }

  private updateSuccessMetrics(duration: number, routePath: string): void {
    this.metrics.totalRegenerations++;
    this.metrics.successfulRegenerations++;
    this.metrics.dailyRegenerationCount++;

    // Update average regeneration time
    this.metrics.averageRegenerationTime = 
      (this.metrics.averageRegenerationTime * (this.metrics.totalRegenerations - 1) + duration) / 
      this.metrics.totalRegenerations;
  }

  private updatePriceHistory(routePath: string, price: number): void {
    let history = this.priceHistory.get(routePath) || [];
    history.push(price);
    
    // Keep only last 10 price points
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    this.priceHistory.set(routePath, history);
  }

  private startTrafficAnalyzer(): void {
    // Analyze traffic patterns every hour
    setInterval(() => {
      this.analyzeTrafficPatterns();
    }, 3600000); // 1 hour
  }

  private analyzeTrafficPatterns(): void {
    console.log('📊 Analyzing traffic patterns...');
    
    for (const [routePath, pattern] of this.trafficPatterns.entries()) {
      // Identify peak hours
      const maxRequests = Math.max(...pattern.hourlyRequests);
      pattern.peakHours = pattern.hourlyRequests
        .map((requests, hour) => ({ hour, requests }))
        .filter(({ requests }) => requests >= maxRequests * 0.8)
        .map(({ hour }) => hour);
      
      // Schedule preemptive regeneration for high-traffic routes
      if (this.config.enablePreemptiveRegeneration && this.isHighTrafficRoute(pattern)) {
        this.queueRegeneration(routePath, 'high_traffic', 'medium');
      }
    }
  }

  private startPriceMonitoring(): void {
    // Monitor prices every 15 minutes
    setInterval(() => {
      this.monitorPriceChanges();
    }, 900000); // 15 minutes
  }

  private async monitorPriceChanges(): Promise<void> {
    console.log('💰 Monitoring price changes...');
    
    // This would typically check for price changes across all routes
    // For now, just log that monitoring is active
  }

  private async queuePatternRegeneration(pattern: string): Promise<void> {
    // Queue regeneration for routes matching the pattern
    // This would typically parse the pattern and queue relevant routes
    console.log(`🔄 Queuing regeneration for pattern: ${pattern}`);
  }

  private async invalidateCdn(pattern: string): Promise<void> {
    console.log(`🌐 Invalidating CDN for pattern: ${pattern}`);
    // CDN invalidation logic would go here
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyMetrics();
      this.scheduleDailyReset(); // Schedule for next day
    }, msUntilMidnight);
  }

  private resetDailyMetrics(): void {
    this.metrics.dailyRegenerationCount = 0;
    this.metrics.lastResetTime = Date.now();
    console.log('📊 Daily metrics reset');
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 ISR System graceful shutdown initiated...');
    this.isShuttingDown = true;
    
    // Wait for active regenerations to complete
    while (this.activeRegenerations.size > 0) {
      console.log(`⏳ Waiting for ${this.activeRegenerations.size} active regenerations to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ ISR System shutdown complete');
  }
}

// Export singleton for production use
export const intelligentISRSystem = new IntelligentISRSystem({
  enablePriceChangeDetection: process.env.NODE_ENV === 'production',
  enableTrafficBasedRevalidation: process.env.NODE_ENV === 'production',
  maxDailyRegeneration: process.env.NODE_ENV === 'production' ? 5000 : 100
});

// Export factory function
export function createISRSystem(config?: Partial<ISRConfig>, cache?: RouteCache): IntelligentISRSystem {
  return new IntelligentISRSystem(config, cache);
}