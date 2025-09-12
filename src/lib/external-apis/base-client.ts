/**
 * Base API Client
 * Foundation class for all external API integrations with common functionality
 */

import type { 
  ExternalAPIClient,
  APIResponse,
  APIConfiguration,
  CircuitBreakerState,
  RateLimitInfo
} from '../../types/external-apis';

export interface BaseClientConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
  };
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic' | 'none';
    token?: string;
    apiKey?: string;
    keyHeader?: string;
    username?: string;
    password?: string;
  };
}

export abstract class BaseAPIClient implements ExternalAPIClient {
  protected config: BaseClientConfig;
  protected requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  protected circuitBreakerState: CircuitBreakerState = {
    state: 'closed',
    failureCount: 0,
    lastFailureTime: null,
    nextRetryTime: null
  };

  constructor(config: BaseClientConfig) {
    this.config = config;
  }

  /**
   * Make HTTP request with built-in retry logic, rate limiting, and circuit breaker
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    
    try {
      // Check circuit breaker
      if (!this.isCircuitBreakerOpen()) {
        throw new Error(`Circuit breaker is ${this.circuitBreakerState.state} - too many failures`);
      }

      // Check rate limits
      await this.checkRateLimit();

      // Prepare request
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers = this.buildHeaders(options.headers);
      
      const requestOptions: RequestInit = {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout)
      };

      // Execute request with retries
      const response = await this.executeWithRetries(url, requestOptions);
      const processingTime = Date.now() - startTime;

      // Parse response
      const data = await this.parseResponse<T>(response);

      // Reset circuit breaker on success
      this.onRequestSuccess();

      return {
        success: true,
        data,
        processingTime,
        source: this.config.name,
        cached: false
      };

    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      
      // Handle circuit breaker
      this.onRequestFailure(error);

      return {
        success: false,
        error: error.message || 'Unknown error',
        processingTime,
        source: this.config.name,
        cached: false,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetries(
    url: string, 
    options: RequestInit, 
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
      
    } catch (error: unknown) {
      if (attempt >= this.config.maxRetries || !this.isRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      await this.sleep(delay);
      
      return this.executeWithRetries(url, options, attempt + 1);
    }
  }

  /**
   * Parse API response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      const xmlText = await response.text();
      // Basic XML to JSON conversion - would need proper XML parser for production
      return this.parseXML(xmlText) as T;
    } else {
      return response.text() as T;
    }
  }

  /**
   * Basic XML parsing (override in subclasses for specific formats)
   */
  protected parseXML(xmlText: string): unknown {
    // Simplified XML parsing - real implementation would use DOMParser or xml2js
    const jsonResult: unknown = {};
    
    // Extract simple values (this is a basic implementation)
    const matches = xmlText.match(/<(\w+)>([^<]+)<\/\1>/g);
    if (matches) {
      matches.forEach(match => {
        const [, tag, value] = match.match(/<(\w+)>([^<]+)<\/\1>/) || [];
        if (tag && value) {
          jsonResult[tag] = value;
        }
      });
    }
    
    return jsonResult;
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(additionalHeaders?: HeadersInit): Headers {
    const headers = new Headers(additionalHeaders);
    
    // Set default headers
    headers.set('User-Agent', 'ChooseMyPower-ZIPLookup/1.0');
    headers.set('Accept', 'application/json, application/xml, text/xml, */*');
    
    // Add configured headers
    if (this.config.headers) {
      Object.entries(this.config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    // Add authentication
    if (this.config.authentication) {
      switch (this.config.authentication.type) {
        case 'bearer':
          if (this.config.authentication.token) {
            headers.set('Authorization', `Bearer ${this.config.authentication.token}`);
          }
          break;
        case 'api_key':
          if (this.config.authentication.apiKey && this.config.authentication.keyHeader) {
            headers.set(this.config.authentication.keyHeader, this.config.authentication.apiKey);
          }
          break;
        case 'basic':
          if (this.config.authentication.username && this.config.authentication.password) {
            const credentials = btoa(`${this.config.authentication.username}:${this.config.authentication.password}`);
            headers.set('Authorization', `Basic ${credentials}`);
          }
          break;
      }
    }
    
    return headers;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minuteKey = `${Math.floor(now / 60000)}`;
    const hourKey = `${Math.floor(now / 3600000)}`;
    const dayKey = `${Math.floor(now / 86400000)}`;
    
    const minuteCount = this.getRequestCount(minuteKey, 60000);
    const hourCount = this.getRequestCount(hourKey, 3600000);
    const dayCount = this.getRequestCount(dayKey, 86400000);
    
    if (minuteCount >= this.config.rateLimits.requestsPerMinute) {
      const waitTime = 60000 - (now % 60000);
      throw new Error(`Rate limit exceeded: ${minuteCount}/${this.config.rateLimits.requestsPerMinute} per minute. Retry in ${waitTime}ms`);
    }
    
    if (hourCount >= this.config.rateLimits.requestsPerHour) {
      const waitTime = 3600000 - (now % 3600000);
      throw new Error(`Rate limit exceeded: ${hourCount}/${this.config.rateLimits.requestsPerHour} per hour. Retry in ${waitTime}ms`);
    }
    
    if (dayCount >= this.config.rateLimits.requestsPerDay) {
      const waitTime = 86400000 - (now % 86400000);
      throw new Error(`Rate limit exceeded: ${dayCount}/${this.config.rateLimits.requestsPerDay} per day. Retry in ${waitTime}ms`);
    }
    
    // Increment counters
    this.incrementRequestCount(minuteKey, 60000);
    this.incrementRequestCount(hourKey, 3600000);
    this.incrementRequestCount(dayKey, 86400000);
  }

  /**
   * Get request count for time window
   */
  private getRequestCount(key: string, windowMs: number): number {
    const entry = this.requestCounts.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Increment request count for time window
   */
  private incrementRequestCount(key: string, windowMs: number): void {
    const now = Date.now();
    const entry = this.requestCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      entry.count++;
    }
  }

  /**
   * Circuit breaker logic
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.config.circuitBreaker?.enabled) {
      return true; // Circuit breaker disabled, allow requests
    }
    
    const now = Date.now();
    
    switch (this.circuitBreakerState.state) {
      case 'closed':
        return true; // Normal operation
        
      case 'open':
        // Check if recovery time has passed
        if (this.circuitBreakerState.nextRetryTime && now >= this.circuitBreakerState.nextRetryTime) {
          this.circuitBreakerState.state = 'half-open';
          return true;
        }
        return false;
        
      case 'half-open':
        return true; // Allow one test request
        
      default:
        return true;
    }
  }

  /**
   * Handle successful request for circuit breaker
   */
  private onRequestSuccess(): void {
    if (this.config.circuitBreaker?.enabled) {
      this.circuitBreakerState = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null,
        nextRetryTime: null
      };
    }
  }

  /**
   * Handle failed request for circuit breaker
   */
  private onRequestFailure(error: unknown): void {
    if (!this.config.circuitBreaker?.enabled) {
      return;
    }
    
    const now = Date.now();
    this.circuitBreakerState.failureCount++;
    this.circuitBreakerState.lastFailureTime = now;
    
    if (this.circuitBreakerState.failureCount >= this.config.circuitBreaker.failureThreshold) {
      this.circuitBreakerState.state = 'open';
      this.circuitBreakerState.nextRetryTime = now + this.config.circuitBreaker.recoveryTimeout;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }
    
    if (error.message?.includes('Rate limit')) {
      return false; // Don't retry rate limit errors
    }
    
    if (error.message?.includes('HTTP 4')) {
      return false; // Don't retry client errors (4xx)
    }
    
    return true; // Retry network errors, 5xx errors, etc.
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Abstract methods that must be implemented by subclasses
  abstract validateZipCodes(zipCodes: string[]): Promise<unknown[]>;
  abstract getHealthStatus(): Promise<unknown>;

  // Optional methods with default implementations
  async getRateLimitInfo(): Promise<RateLimitInfo> {
    const now = Date.now();
    const minuteKey = `${Math.floor(now / 60000)}`;
    const hourKey = `${Math.floor(now / 3600000)}`;
    const dayKey = `${Math.floor(now / 86400000)}`;
    
    return {
      limit: this.config.rateLimits.requestsPerMinute,
      remaining: Math.max(0, this.config.rateLimits.requestsPerMinute - this.getRequestCount(minuteKey, 60000)),
      reset: Math.ceil((now % 60000) / 1000),
      retryAfter: this.circuitBreakerState.state === 'open' && this.circuitBreakerState.nextRetryTime 
        ? Math.max(0, Math.ceil((this.circuitBreakerState.nextRetryTime - now) / 1000))
        : 0
    };
  }

  async getConfiguration(): Promise<APIConfiguration> {
    return {
      name: this.config.name,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      rateLimits: { ...this.config.rateLimits },
      circuitBreaker: this.config.circuitBreaker ? { ...this.config.circuitBreaker } : undefined,
      health: {
        circuitBreakerState: this.circuitBreakerState.state,
        failureCount: this.circuitBreakerState.failureCount,
        lastFailureTime: this.circuitBreakerState.lastFailureTime
      }
    };
  }
}