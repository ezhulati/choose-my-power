/**
 * LangGraph Agent Integration Layer
 * Connects LangGraph agents with existing ChooseMyPower systems
 */

import type { Plan, ApiParams } from '../../types/facets';
import { comparePowerClient } from '../api/comparepower-client';
import { planRepository } from '../database/plan-repository';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../config/tdsp-mapping';
import { AGENT_CONFIG, validateAgentEnvironment } from './agent-config';

// Integration validation
export async function validateIntegrations(): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate environment
  const envValidation = validateAgentEnvironment();
  if (!envValidation.isValid) {
    errors.push(...envValidation.errors);
  }

  // Test API client integration
  try {
    const healthCheck = await comparePowerClient.healthCheck();
    if (!healthCheck.status === 'healthy') {
      errors.push('ComparePower API client health check failed');
    }
  } catch (error) {
    errors.push(`API client integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test database integration
  try {
    await planRepository.testConnection();
  } catch (error) {
    errors.push(`Database integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Enhanced API client wrapper for agents
export class AgentApiClient {
  private static instance: AgentApiClient;

  private constructor() {}

  static getInstance(): AgentApiClient {
    if (!AgentApiClient.instance) {
      AgentApiClient.instance = new AgentApiClient();
    }
    return AgentApiClient.instance;
  }

  // Get plans with agent-specific caching and error handling
  async getPlansForAgent(params: ApiParams, agentType: string): Promise<Plan[]> {
    const cacheKey = `agent:${agentType}:plans:${JSON.stringify(params)}`;
    
    try {
      // Try cache first
      const cached = await this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from API with timeout
      const plans = await Promise.race([
        comparePowerClient.getPlansForCity(params),
        this.timeoutPromise(AGENT_CONFIG.planRecommendation.timeoutMs, 'API request timeout')
      ]);

      // Cache the results
      await this.setCachedData(cacheKey, plans, AGENT_CONFIG.planRecommendation.cacheTTL);
      
      return plans;
    } catch (error) {
      console.error(`Agent API error for ${agentType}:`, error);
      
      // Try to return stale cache data as fallback
      const staleData = await this.getCachedData(cacheKey, true);
      if (staleData) {
        console.warn(`Returning stale cache data for ${agentType}`);
        return staleData;
      }
      
      throw error;
    }
  }

  // Plan analysis with database fallback
  async analyzePlanForAgent(planId: string, agentType: string): Promise<unknown> {
    try {
      // Try database first for plan details
      const dbPlan = await planRepository.getPlanById(planId);
      if (dbPlan) {
        return this.enhancePlanData(dbPlan, agentType);
      }

      // Fallback to API if not in database
      console.warn(`Plan ${planId} not found in database, using API fallback`);
      return null;
    } catch (error) {
      console.error(`Plan analysis error for ${agentType}:`, error);
      return null;
    }
  }

  // City validation with TDSP integration
  validateCityForAgent(citySlug: string): {
    isValid: boolean;
    citySlug: string;
    displayName: string;
    tdsp: string;
    error?: string;
  } {
    try {
      const isValid = validateCitySlug(citySlug);
      if (!isValid) {
        return {
          isValid: false,
          citySlug: '',
          displayName: '',
          tdsp: '',
          error: `Invalid city slug: ${citySlug}`,
        };
      }

      return {
        isValid: true,
        citySlug,
        displayName: formatCityName(citySlug),
        tdsp: getTdspFromCity(citySlug),
      };
    } catch (error) {
      return {
        isValid: false,
        citySlug: '',
        displayName: '',
        tdsp: '',
        error: error instanceof Error ? error.message : 'City validation failed',
      };
    }
  }

  // Batch processing for data pipeline agent
  async processCityBatch(cityBatch: string[], config: unknown): Promise<{
    successful: Array<{ citySlug: string; plansCount: number; processingTime: number; cacheHit: boolean }>;
    failed: Array<{ citySlug: string; error: string; retryable: boolean }>;
  }> {
    const successful: Array<{ citySlug: string; plansCount: number; processingTime: number; cacheHit: boolean }> = [];
    const failed: Array<{ citySlug: string; error: string; retryable: boolean }> = [];

    const promises = cityBatch.map(async (citySlug) => {
      const startTime = Date.now();
      
      try {
        // Check cache first if enabled
        let cacheHit = false;
        let plans: Plan[] = [];

        if (config.useCachedData && !config.forceRebuild) {
          const cacheKey = `batch:plans:${citySlug}`;
          const cached = await this.getCachedData(cacheKey);
          if (cached) {
            plans = cached;
            cacheHit = true;
          }
        }

        // Fetch from API if no cache hit
        if (!cacheHit) {
          plans = await this.getPlansForAgent({ city: citySlug }, 'dataPipeline');
          
          // Cache for future use
          const cacheKey = `batch:plans:${citySlug}`;
          await this.setCachedData(cacheKey, plans, config.cacheTTL || 3600);
        }

        const processingTime = Date.now() - startTime;
        successful.push({
          citySlug,
          plansCount: plans.length,
          processingTime,
          cacheHit,
        });

      } catch (error) {
        const isRetryable = this.isRetryableError(error);
        failed.push({
          citySlug,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: isRetryable,
        });
      }
    });

    await Promise.allSettled(promises);
    
    return { successful, failed };
  }

  // Private helper methods
  private async getCachedData(key: string, includeStale = false): Promise<unknown> {
    try {
      // Integration with your existing Redis cache
      if (AGENT_CONFIG.integration.useExistingCache) {
        // This would integrate with your actual cache implementation
        // For now, returning null to use fresh data
        return null;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async setCachedData(key: string, data: unknown, ttl: number): Promise<void> {
    try {
      if (AGENT_CONFIG.integration.useExistingCache) {
        // This would integrate with your actual cache implementation
        // For now, this is a no-op
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  private enhancePlanData(plan: unknown, agentType: string): unknown {
    // Enhance plan data with agent-specific information
    return {
      ...plan,
      agentAnalysis: {
        processedBy: agentType,
        timestamp: new Date(),
        // Add agent-specific enhancements here
      },
    };
  }

  private isRetryableError(error: unknown): boolean {
    // Determine if an error is retryable
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'rate_limit'];
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  private timeoutPromise<T>(timeoutMs: number, errorMessage: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
  }
}

// Session manager for support chatbot
export class AgentSessionManager {
  private static instance: AgentSessionManager;
  private activeSessions = new Map<string, unknown>();

  private constructor() {}

  static getInstance(): AgentSessionManager {
    if (!AgentSessionManager.instance) {
      AgentSessionManager.instance = new AgentSessionManager();
    }
    return AgentSessionManager.instance;
  }

  createSession(sessionId: string, userProfile?: any): void {
    this.activeSessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      userProfile: userProfile || {},
      conversationHistory: [],
      needsEscalation: false,
    });
  }

  getSession(sessionId: string): unknown {
    return this.activeSessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: unknown): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.set(sessionId, {
        ...session,
        ...updates,
        lastActivity: new Date(),
      });
    }
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    const timeout = AGENT_CONFIG.supportChatbot.sessionTimeoutMs;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > timeout) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }
}

// Monitoring and metrics
export class AgentMetricsCollector {
  private static instance: AgentMetricsCollector;
  private metrics = new Map<string, unknown>();

  private constructor() {}

  static getInstance(): AgentMetricsCollector {
    if (!AgentMetricsCollector.instance) {
      AgentMetricsCollector.instance = new AgentMetricsCollector();
    }
    return AgentMetricsCollector.instance;
  }

  recordAgentCall(agentType: string, operation: string, duration: number, success: boolean): void {
    const key = `${agentType}:${operation}`;
    const existing = this.metrics.get(key) || {
      totalCalls: 0,
      successfulCalls: 0,
      totalDuration: 0,
      errors: 0,
    };

    this.metrics.set(key, {
      totalCalls: existing.totalCalls + 1,
      successfulCalls: existing.successfulCalls + (success ? 1 : 0),
      totalDuration: existing.totalDuration + duration,
      errors: existing.errors + (success ? 0 : 1),
      lastCall: new Date(),
    });
  }

  getMetrics(): unknown {
    const result: unknown = {};
    
    for (const [key, metrics] of this.metrics.entries()) {
      const [agentType, operation] = key.split(':');
      
      if (!result[agentType]) {
        result[agentType] = {};
      }
      
      result[agentType][operation] = {
        ...metrics,
        averageDuration: metrics.totalCalls > 0 ? metrics.totalDuration / metrics.totalCalls : 0,
        successRate: metrics.totalCalls > 0 ? (metrics.successfulCalls / metrics.totalCalls) * 100 : 0,
      };
    }
    
    return result;
  }

  resetMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instances
export const agentApiClient = AgentApiClient.getInstance();
export const agentSessionManager = AgentSessionManager.getInstance();
export const agentMetrics = AgentMetricsCollector.getInstance();

// Cleanup function for production
setInterval(() => {
  agentSessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000); // Clean up every 5 minutes