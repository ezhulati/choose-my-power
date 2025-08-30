/**
 * ComparePower API Error Handling System
 * Defines comprehensive error types and mappings for production-ready error handling
 */

export enum ApiErrorType {
  // Network errors
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DNS_ERROR = 'DNS_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // HTTP errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // API-specific errors
  INVALID_TDSP = 'INVALID_TDSP',
  NO_PLANS_AVAILABLE = 'NO_PLANS_AVAILABLE',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  API_REQUEST_ERROR = 'API_REQUEST_ERROR',
  BATCH_PROCESSING_ERROR = 'BATCH_PROCESSING_ERROR',
  
  // Circuit breaker states
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  CIRCUIT_HALF_OPEN = 'CIRCUIT_HALF_OPEN',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  
  // Cache/fallback errors
  CACHE_ERROR = 'CACHE_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
  FALLBACK_UNAVAILABLE = 'FALLBACK_UNAVAILABLE',
  
  // Mass deployment specific
  MASS_DEPLOYMENT_ERROR = 'MASS_DEPLOYMENT_ERROR',
  TDSP_MAPPING_ERROR = 'TDSP_MAPPING_ERROR',
  
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
  batchId?: string;
  citiesAffected?: number;
  deploymentPhase?: 'warming' | 'production' | 'validation';
  errorCode?: string;
  requestId?: string;
  timestamp?: number;
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
    const phase = this.context.deploymentPhase ? ` during ${this.context.deploymentPhase}` : '';
    
    switch (this.type) {
      case ApiErrorType.TIMEOUT:
        return `Things are moving a bit slow right now${cityName}. Let's give it another try?`;
      
      case ApiErrorType.NETWORK_ERROR:
        return `Hmm, we're having trouble connecting${cityName}. Mind checking your internet and trying again?`;
        
      case ApiErrorType.CONNECTION_REFUSED:
        return `Our servers are being a bit shy right now${cityName}. Let's try again in just a minute?`;
      
      case ApiErrorType.RATE_LIMITED:
        return `Whoa, lots of folks are searching right now${cityName}! Just take a quick breather and try again?`;
        
      case ApiErrorType.GATEWAY_TIMEOUT:
        return `Our systems got a little backed up${cityName}. Ready to give it another shot?`;
      
      case ApiErrorType.SERVICE_UNAVAILABLE:
        return `We're doing some quick maintenance${cityName}. Check back in a few minutes - we'll be right back!`;
      
      case ApiErrorType.INVALID_TDSP:
        return `That area looks like it might not have retail electricity choice${cityName}. Double-check you're in a deregulated Texas market?`;
      
      case ApiErrorType.NO_PLANS_AVAILABLE:
        return `Hmm, we're not finding any plans that match right now${cityName}. Try loosening up those filters or check back soon?`;
      
      case ApiErrorType.INVALID_PARAMETERS:
        return `Those search settings don't look quite right${cityName}. Mind tweaking them and trying again?`;
      
      case ApiErrorType.CIRCUIT_OPEN:
      case ApiErrorType.CIRCUIT_BREAKER_OPEN:
        return `We're having some technical hiccups${cityName}. Our team is on it and we'll be back up soon!`;
        
      case ApiErrorType.BATCH_PROCESSING_ERROR:
        return `We're juggling a lot of requests${phase} and some got mixed up. Let's try that again?`;
        
      case ApiErrorType.MASS_DEPLOYMENT_ERROR:
        return `We're rolling out some updates${phase} and hit a snag. Check our status page or drop us a line if this keeps up!`;
        
      case ApiErrorType.TDSP_MAPPING_ERROR:
        return `We're having trouble figuring out which utility serves you${cityName}. Can you double-check that address?`;
        
      case ApiErrorType.REDIS_ERROR:
        return `Our quick-lookup system is having a moment${cityName}. Things might be a bit slower than usual.`;
      
      case ApiErrorType.UNAUTHORIZED:
        return `Looks like we lost track of who you are${cityName}. Try refreshing the page?`;
      
      case ApiErrorType.FORBIDDEN:
        return `Something's blocking access to your plan data${cityName}. If this keeps happening, give us a shout!`;
      
      case ApiErrorType.SERVER_ERROR:
        return `Our servers are having a rough day${cityName}. Give us a minute to sort this out?`;
      
      case ApiErrorType.DATA_VALIDATION_ERROR:
        return `Some of the plan info${cityName} looks a bit wonky. Try again, or let us know if it keeps acting up!`;
      
      case ApiErrorType.FALLBACK_UNAVAILABLE:
        return `Everything seems to be down for maintenance${cityName}. Check back in a bit - we're working on it!`;
      
      default:
        return `Something weird just happened${cityName}. Want to give it another try?`;
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
        return new ComparePowerApiError(
          ApiErrorType.SERVICE_UNAVAILABLE,
          `Service unavailable: ${statusText}`,
          errorContext,
          true
        );
        
      case 504:
        return new ComparePowerApiError(
          ApiErrorType.GATEWAY_TIMEOUT,
          `Gateway timeout: ${statusText}`,
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
    const enhancedContext = {
      ...context,
      timestamp: Date.now(),
      errorCode: 'NETWORK_ERROR'
    };
    
    // Check for timeout/abort scenarios including DOMException AbortError
    if (message.includes('timeout') || 
        message.includes('aborted') || 
        (error instanceof DOMException && error.name === 'AbortError')) {
      return new ComparePowerApiError(
        ApiErrorType.TIMEOUT,
        `Request timeout: ${error.message}`,
        enhancedContext,
        true
      );
    }
    
    if (message.includes('dns') || message.includes('getaddrinfo')) {
      return new ComparePowerApiError(
        ApiErrorType.DNS_ERROR,
        `DNS resolution failed: ${error.message}`,
        enhancedContext,
        true
      );
    }
    
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return new ComparePowerApiError(
        ApiErrorType.CONNECTION_REFUSED,
        `Connection refused: ${error.message}`,
        enhancedContext,
        true
      );
    }
    
    if (message.includes('enotfound') || message.includes('host not found')) {
      return new ComparePowerApiError(
        ApiErrorType.DNS_ERROR,
        `Host not found: ${error.message}`,
        enhancedContext,
        true
      );
    }
    
    return new ComparePowerApiError(
      ApiErrorType.NETWORK_ERROR,
      `Network error: ${error.message}`,
      enhancedContext,
      true
    );
  }
  
  /**
   * Create error for batch processing failures
   */
  static forBatchProcessing(
    message: string,
    context: ApiErrorContext = {}
  ): ComparePowerApiError {
    return new ComparePowerApiError(
      ApiErrorType.BATCH_PROCESSING_ERROR,
      `Batch processing error: ${message}`,
      {
        ...context,
        timestamp: Date.now(),
        errorCode: 'BATCH_ERROR'
      },
      false
    );
  }
  
  /**
   * Create error for mass deployment failures
   */
  static forMassDeployment(
    message: string,
    citiesAffected: number,
    context: ApiErrorContext = {}
  ): ComparePowerApiError {
    return new ComparePowerApiError(
      ApiErrorType.MASS_DEPLOYMENT_ERROR,
      `Mass deployment error: ${message}`,
      {
        ...context,
        citiesAffected,
        timestamp: Date.now(),
        errorCode: 'DEPLOYMENT_ERROR'
      },
      true
    );
  }
  
  /**
   * Create error for TDSP mapping issues
   */
  static forTdspMapping(
    city: string,
    tdspDuns: string,
    context: ApiErrorContext = {}
  ): ComparePowerApiError {
    return new ComparePowerApiError(
      ApiErrorType.TDSP_MAPPING_ERROR,
      `TDSP mapping error for ${city}: ${tdspDuns}`,
      {
        ...context,
        city,
        tdspDuns,
        timestamp: Date.now(),
        errorCode: 'TDSP_ERROR'
      },
      false
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
  private successCount = 0;
  private lastSuccessTime = 0;
  private stateChangeCallbacks: Array<(state: CircuitBreakerState) => void> = [];

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