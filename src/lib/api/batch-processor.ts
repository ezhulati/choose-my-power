/**
 * API Batch Processing and Compression System
 * Combines multiple API requests and compresses responses
 * Provides request deduplication and intelligent batching
 */

import { ComparePowerApiError, ApiErrorType } from './errors';
import { createManagedCache } from '../utils/memory-manager';

interface BatchRequest {
  id: string;
  params: Record<string, unknown>;
  resolve: (result: unknown) => void;
  reject: (error: unknown) => void;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

interface BatchProcessorConfig {
  maxBatchSize: number;
  batchTimeout: number; // milliseconds
  compression: boolean;
  deduplication: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // milliseconds
}

interface RequestStats {
  totalRequests: number;
  batchedRequests: number;
  deduplicatedRequests: number;
  compressedBytes: number;
  averageResponseTime: number;
  errorRate: number;
  circuitBreakerTrips: number;
}

export class ApiBatchProcessor {
  private pendingRequests = new Map<string, BatchRequest[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private circuitBreakerState = new Map<string, { isOpen: boolean; failures: number; lastFailure: number }>();
  private deduplicationCache = createManagedCache<unknown>('api-dedup', 5000); // 5 seconds
  private stats: RequestStats = {
    totalRequests: 0,
    batchedRequests: 0,
    deduplicatedRequests: 0,
    compressedBytes: 0,
    averageResponseTime: 0,
    errorRate: 0,
    circuitBreakerTrips: 0
  };

  constructor(private config: BatchProcessorConfig) {}

  /**
   * Add request to batch for processing
   */
  async batchRequest<T>(
    endpoint: string,
    params: Record<string, unknown>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    this.stats.totalRequests++;

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(endpoint)) {
      throw new ComparePowerApiError(
        ApiErrorType.CIRCUIT_BREAKER_OPEN,
        `Circuit breaker is open for endpoint: ${endpoint}`,
        { endpoint },
        false
      );
    }

    // Check for deduplicated request
    if (this.config.deduplication) {
      const dedupeKey = this.generateDedupeKey(endpoint, params);
      const cachedResult = this.deduplicationCache.get(dedupeKey);
      
      if (cachedResult) {
        this.stats.deduplicatedRequests++;
        return cachedResult;
      }
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId();
      const batchRequest: BatchRequest = {
        id: requestId,
        params,
        resolve,
        reject,
        timestamp: Date.now(),
        priority
      };

      // Add to pending requests
      if (!this.pendingRequests.has(endpoint)) {
        this.pendingRequests.set(endpoint, []);
      }
      
      const endpointRequests = this.pendingRequests.get(endpoint)!;
      endpointRequests.push(batchRequest);

      // Sort by priority (high -> normal -> low)
      endpointRequests.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Process immediately if batch is full or high priority
      if (endpointRequests.length >= this.config.maxBatchSize || priority === 'high') {
        this.processBatch(endpoint);
      } else {
        // Set timer to process batch
        this.scheduleBatchProcessing(endpoint);
      }
    });
  }

  /**
   * Process batch of requests for an endpoint
   */
  private async processBatch(endpoint: string): Promise<void> {
    const requests = this.pendingRequests.get(endpoint);
    if (!requests || requests.length === 0) return;

    // Clear pending requests and timer
    this.pendingRequests.delete(endpoint);
    const timer = this.batchTimers.get(endpoint);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(endpoint);
    }

    const startTime = Date.now();
    this.stats.batchedRequests += requests.length;

    try {
      // Combine all request parameters
      const batchParams = this.combineBatchParams(requests);
      
      // Make batched API call
      const response = await this.makeBatchApiCall(endpoint, batchParams);
      
      // Process and distribute responses
      await this.distributeBatchResponses(requests, response);
      
      // Update circuit breaker on success
      this.recordSuccess(endpoint);
      
      // Update stats
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      
    } catch (error) {
      // Handle batch failure
      this.handleBatchFailure(endpoint, requests, error);
    }
  }

  /**
   * Combine parameters from multiple requests into a single batch
   */
  private combineBatchParams(requests: BatchRequest[]): Record<string, unknown> {
    const combined: Record<string, unknown> = {};
    const uniqueParams = new Map<string, Set<unknown>>();
    
    // Collect all unique parameter values
    for (const request of requests) {
      for (const [key, value] of Object.entries(request.params)) {
        if (!uniqueParams.has(key)) {
          uniqueParams.set(key, new Set());
        }
        uniqueParams.get(key)!.add(value);
      }
    }
    
    // Create batch parameters
    for (const [key, valueSet] of uniqueParams) {
      const values = Array.from(valueSet);
      if (values.length === 1) {
        combined[key] = values[0];
      } else {
        // For multiple values, create array or comma-separated string
        combined[key] = key === 'tdsp_duns' ? values : values.join(',');
      }
    }
    
    // Add batch metadata
    combined._batch_size = requests.length;
    combined._batch_ids = requests.map(r => r.id).join(',');
    
    return combined;
  }

  /**
   * Make the actual batched API call
   */
  private async makeBatchApiCall(endpoint: string, params: Record<string, unknown>): Promise<unknown> {
    const url = new URL(endpoint);
    
    // Add parameters to URL
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ChooseMyPower.org/1.0 Batch-Processor',
      'Accept': 'application/json',
    };

    // Add compression headers
    if (this.config.compression) {
      headers['Accept-Encoding'] = 'gzip, deflate, br';
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(30000) // 30 second timeout for batch requests
    });

    if (!response.ok) {
      throw new ComparePowerApiError(
        ApiErrorType.API_REQUEST_ERROR,
        `Batch API request failed: ${response.status} ${response.statusText}`,
        { endpoint, status: response.status },
        response.status >= 500
      );
    }

    // Track compression savings
    const contentLength = response.headers.get('content-length');
    if (contentLength && this.config.compression) {
      this.stats.compressedBytes += parseInt(contentLength);
    }

    const data = await response.json();
    
    // Cache for deduplication
    if (this.config.deduplication && Array.isArray(data)) {
      // Cache individual results based on their parameters
      data.forEach((item: unknown, index: number) => {
        if (item && typeof item === 'object') {
          const dedupeKey = this.generateDedupeKeyForItem(endpoint, item);
          this.deduplicationCache.set(dedupeKey, item);
        }
      });
    }
    
    return data;
  }

  /**
   * Distribute batch responses to individual requests
   */
  private async distributeBatchResponses(
    requests: BatchRequest[],
    batchResponse: unknown): Promise<void> {
    if (!Array.isArray(batchResponse)) {
      // Single response - distribute to all requests
      for (const request of requests) {
        try {
          request.resolve(batchResponse);
        } catch (error) {
          console.warn('Error resolving batch request:', error);
        }
      }
      return;
    }

    // Multiple responses - match to requests
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      try {
        // Find matching response for this request
        const matchingResponse = this.findMatchingResponse(request, batchResponse);
        
        if (matchingResponse) {
          request.resolve(matchingResponse);
        } else {
          // No matching response - return empty array or handle gracefully
          request.resolve([]);
        }
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Find matching response for a specific request
   */
  private findMatchingResponse(request: BatchRequest, responses: unknown[]): unknown {
    // For electricity plans API, match by TDSP DUNS
    const tdspDuns = request.params.tdsp_duns;
    
    if (tdspDuns) {
      return responses.filter(plan => {
        return plan.tdsp?.duns === tdspDuns || 
               plan.tdsp_duns === tdspDuns ||
               plan.utility?.duns === tdspDuns;
      });
    }
    
    // Fallback: return first response or all responses
    return responses.length === 1 ? responses[0] : responses;
  }

  /**
   * Handle batch processing failure
   */
  private handleBatchFailure(
    endpoint: string,
    requests: BatchRequest[],
    error: unknown): void {
    // Record failure for circuit breaker
    this.recordFailure(endpoint);
    this.stats.errorRate = (this.stats.errorRate + 1) / this.stats.totalRequests;

    // Reject all requests in the batch
    for (const request of requests) {
      try {
        request.reject(error);
      } catch (rejectionError) {
        console.warn('Error rejecting batch request:', rejectionError);
      }
    }
  }

  /**
   * Schedule batch processing with timeout
   */
  private scheduleBatchProcessing(endpoint: string): void {
    if (this.batchTimers.has(endpoint)) return;

    const timer = setTimeout(() => {
      this.processBatch(endpoint);
    }, this.config.batchTimeout);

    this.batchTimers.set(endpoint, timer);
  }

  /**
   * Check if circuit breaker is open for endpoint
   */
  private isCircuitBreakerOpen(endpoint: string): boolean {
    const state = this.circuitBreakerState.get(endpoint);
    if (!state || !state.isOpen) return false;

    // Check if circuit breaker timeout has expired
    const now = Date.now();
    if (now - state.lastFailure > this.config.circuitBreakerTimeout) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }

    return true;
  }

  /**
   * Record successful request for circuit breaker
   */
  private recordSuccess(endpoint: string): void {
    const state = this.circuitBreakerState.get(endpoint);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Record failed request for circuit breaker
   */
  private recordFailure(endpoint: string): void {
    let state = this.circuitBreakerState.get(endpoint);
    if (!state) {
      state = { isOpen: false, failures: 0, lastFailure: 0 };
      this.circuitBreakerState.set(endpoint, state);
    }

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true;
      this.stats.circuitBreakerTrips++;
      console.warn(`Circuit breaker opened for endpoint: ${endpoint} after ${state.failures} failures`);
    }
  }

  /**
   * Update response time statistics
   */
  private updateResponseTimeStats(responseTime: number): void {
    const totalRequests = this.stats.totalRequests;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate deduplication cache key
   */
  private generateDedupeKey(endpoint: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    return `${endpoint}_${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }

  /**
   * Generate deduplication key for individual items
   */
  private generateDedupeKeyForItem(endpoint: string, item: unknown): string {
    // For electricity plans, use plan ID or unique identifier
    const identifier = item.id || item._id || item.plan_id || JSON.stringify(item);
    return `${endpoint}_item_${identifier}`;
  }

  /**
   * Get processing statistics
   */
  getStats(): RequestStats & { pendingBatches: number; circuitBreakerStates: Record<string, unknown> } {
    return {
      ...this.stats,
      pendingBatches: this.pendingRequests.size,
      circuitBreakerStates: Object.fromEntries(this.circuitBreakerState)
    };
  }

  /**
   * Clear all pending requests and caches
   */
  clear(): void {
    // Reject all pending requests
    for (const requests of this.pendingRequests.values()) {
      for (const request of requests) {
        request.reject(new Error('Batch processor cleared'));
      }
    }

    // Clear timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.pendingRequests.clear();
    this.batchTimers.clear();
    this.deduplicationCache.clear();
  }
}

// Create default configuration
export function createDefaultBatchConfig(): BatchProcessorConfig {
  return {
    maxBatchSize: parseInt(process.env.BATCH_MAX_SIZE || '10'),
    batchTimeout: parseInt(process.env.BATCH_TIMEOUT || '100'), // 100ms
    compression: process.env.BATCH_COMPRESSION !== 'false',
    deduplication: process.env.BATCH_DEDUPLICATION !== 'false',
    retryAttempts: parseInt(process.env.BATCH_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.BATCH_RETRY_DELAY || '1000'),
    circuitBreakerThreshold: parseInt(process.env.BATCH_CIRCUIT_BREAKER_THRESHOLD || '5'),
    circuitBreakerTimeout: parseInt(process.env.BATCH_CIRCUIT_BREAKER_TIMEOUT || '60000') // 1 minute
  };
}

// Export singleton instance
export const apiBatchProcessor = new ApiBatchProcessor(createDefaultBatchConfig());