/**
 * ComparePower API Error Handling System
 * Defines comprehensive error types and mappings for production-ready error handling
 */

export enum ApiErrorType {
  // Network errors
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DNS_ERROR = 'DNS_ERROR',
  
  // HTTP errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // API-specific errors
  INVALID_TDSP = 'INVALID_TDSP',
  NO_PLANS_AVAILABLE = 'NO_PLANS_AVAILABLE',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  
  // Circuit breaker states
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  CIRCUIT_HALF_OPEN = 'CIRCUIT_HALF_OPEN',
  
  // Cache/fallback errors
  CACHE_ERROR = 'CACHE_ERROR',
  FALLBACK_UNAVAILABLE = 'FALLBACK_UNAVAILABLE',
  
  // Unknown
  UNKNOWN = 'UNKNOWN'
}

export interface ApiErrorContext {
  url?: string;
  params?: Record<string, any>;
  statusCode?: number;
  retryAttempt?: number;
  maxRetries?: number;
  responseTime?: number;
  tdspDuns?: string;
  city?: string;
}

export class ComparePowerApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly context: ApiErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  public readonly timestamp: Date;

  constructor(
    type: ApiErrorType,
    message: string,
    context: ApiErrorContext = {},
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ComparePowerApiError';
    this.type = type;
    this.context = context;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();
    this.userMessage = this.generateUserMessage();
  }

  private generateUserMessage(): string {
    const cityName = this.context.city ? ` for ${this.context.city}` : '';
    
    switch (this.type) {
      case ApiErrorType.TIMEOUT:
        return `The service is taking longer than usual to respond${cityName}. Please try again in a moment.`;
      
      case ApiErrorType.NETWORK_ERROR:
        return `We're experiencing connectivity issues${cityName}. Please check your internet connection and try again.`;
      
      case ApiErrorType.RATE_LIMITED:
        return `Too many requests have been made${cityName}. Please wait a moment before trying again.`;
      
      case ApiErrorType.SERVICE_UNAVAILABLE:
        return `Our electricity plan service is temporarily unavailable${cityName}. Please try again in a few minutes.`;
      
      case ApiErrorType.INVALID_TDSP:
        return `We couldn't find electricity plans for your area${cityName}. Please verify your location is in a deregulated Texas market.`;
      
      case ApiErrorType.NO_PLANS_AVAILABLE:
        return `No electricity plans are currently available${cityName}. Try adjusting your filters or check back later.`;
      
      case ApiErrorType.INVALID_PARAMETERS:
        return `Your search criteria${cityName} aren't valid. Please adjust your filters and try again.`;
      
      case ApiErrorType.CIRCUIT_OPEN:
        return `Our electricity plan service${cityName} is temporarily experiencing issues. We're working to restore it quickly.`;
      
      case ApiErrorType.UNAUTHORIZED:
        return `Authentication error occurred${cityName}. Please refresh the page and try again.`;
      
      case ApiErrorType.FORBIDDEN:
        return `Access denied to electricity plan data${cityName}. Please contact support if this continues.`;
      
      case ApiErrorType.SERVER_ERROR:
        return `Our servers are experiencing issues${cityName}. Please try again in a moment.`;
      
      case ApiErrorType.DATA_VALIDATION_ERROR:
        return `The electricity plan data${cityName} appears to be incomplete. Please try again or contact support.`;
      
      case ApiErrorType.FALLBACK_UNAVAILABLE:
        return `All electricity plan services${cityName} are currently unavailable. Please try again later.`;
      
      default:
        return `An unexpected error occurred while fetching electricity plans${cityName}. Please try again.`;
    }
  }

  static fromHttpError(
    statusCode: number,
    statusText: string,
    context: ApiErrorContext = {}
  ): ComparePowerApiError {
    const errorContext = { ...context, statusCode };
    
    switch (statusCode) {
      case 400:
        return new ComparePowerApiError(
          ApiErrorType.INVALID_PARAMETERS,
          `Bad request: ${statusText}`,
          errorContext,
          false
        );
      
      case 401:
        return new ComparePowerApiError(
          ApiErrorType.UNAUTHORIZED,
          `Unauthorized: ${statusText}`,
          errorContext,
          false
        );
      
      case 403:
        return new ComparePowerApiError(
          ApiErrorType.FORBIDDEN,
          `Forbidden: ${statusText}`,
          errorContext,
          false
        );
      
      case 404:
        return new ComparePowerApiError(
          ApiErrorType.NOT_FOUND,
          `Not found: ${statusText}`,
          errorContext,
          false
        );
      
      case 429:
        return new ComparePowerApiError(
          ApiErrorType.RATE_LIMITED,
          `Rate limited: ${statusText}`,
          errorContext,
          true
        );
      
      case 500:
        return new ComparePowerApiError(
          ApiErrorType.SERVER_ERROR,
          `Server error: ${statusText}`,
          errorContext,
          true
        );
      
      case 502:
      case 503:
      case 504:
        return new ComparePowerApiError(
          ApiErrorType.SERVICE_UNAVAILABLE,
          `Service unavailable: ${statusText}`,
          errorContext,
          true
        );
      
      default:
        return new ComparePowerApiError(
          statusCode >= 500 ? ApiErrorType.SERVER_ERROR : ApiErrorType.UNKNOWN,
          `HTTP ${statusCode}: ${statusText}`,
          errorContext,
          statusCode >= 500
        );
    }
  }

  static fromNetworkError(
    error: Error,
    context: ApiErrorContext = {}
  ): ComparePowerApiError {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return new ComparePowerApiError(
        ApiErrorType.TIMEOUT,
        `Request timeout: ${error.message}`,
        context,
        true
      );
    }
    
    if (message.includes('dns') || message.includes('getaddrinfo')) {
      return new ComparePowerApiError(
        ApiErrorType.DNS_ERROR,
        `DNS resolution failed: ${error.message}`,
        context,
        true
      );
    }
    
    return new ComparePowerApiError(
      ApiErrorType.NETWORK_ERROR,
      `Network error: ${error.message}`,
      context,
      true
    );
  }
}

/**
 * Circuit Breaker Implementation for API Resilience
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringInterval: number;
  halfOpenMaxCalls: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        throw new ComparePowerApiError(
          ApiErrorType.CIRCUIT_OPEN,
          'Circuit breaker is open - too many recent failures',
          {},
          false
        );
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        throw new ComparePowerApiError(
          ApiErrorType.CIRCUIT_HALF_OPEN,
          'Circuit breaker half-open call limit exceeded',
          {},
          false
        );
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
    this.halfOpenCalls = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      halfOpenCalls: this.halfOpenCalls,
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
  }
}