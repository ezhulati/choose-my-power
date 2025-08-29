/**
 * Enterprise-grade rate limiting and idempotency system
 * Provides distributed rate limiting, request deduplication, and request replay protection
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (clientId: string, endpoint: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: Array<{
    timestamp: number;
    success?: boolean;
  }>;
}

interface IdempotencyEntry {
  requestId: string;
  response: any;
  timestamp: number;
  ttl: number;
  status: 'processing' | 'completed' | 'failed';
  clientId: string;
}

class RateLimitManager {
  private limitsStore = new Map<string, RateLimitEntry>();
  private idempotencyStore = new Map<string, IdempotencyEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private cleanupIntervalMs = 60000; // 1 minute
  private idempotencyTTL = 3600000; // 1 hour

  constructor() {
    // Setup periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);

    // Cleanup on process exit
    process.on('exit', () => {
      clearInterval(this.cleanupInterval);
    });
  }

  /**
   * Check if request is allowed under rate limits
   */
  public checkRateLimit(
    clientId: string,
    endpoint: string,
    config: RateLimitConfig
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = config.keyGenerator ? 
      config.keyGenerator(clientId, endpoint) : 
      `${clientId}:${endpoint}`;

    const now = Date.now();
    const entry = this.limitsStore.get(key);

    // Initialize or reset if window expired
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        requests: [{ timestamp: now }]
      };
      
      this.limitsStore.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Increment counter
    entry.count++;
    entry.requests.push({ timestamp: now });

    this.limitsStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Update rate limit entry with request result
   */
  public updateRateLimitResult(
    clientId: string,
    endpoint: string,
    success: boolean,
    config: RateLimitConfig
  ): void {
    const key = config.keyGenerator ? 
      config.keyGenerator(clientId, endpoint) : 
      `${clientId}:${endpoint}`;

    const entry = this.limitsStore.get(key);
    if (!entry) return;

    // Find the most recent request and update it
    const lastRequest = entry.requests[entry.requests.length - 1];
    if (lastRequest) {
      lastRequest.success = success;
    }

    // Adjust count based on config
    if ((config.skipSuccessfulRequests && success) || 
        (config.skipFailedRequests && !success)) {
      entry.count = Math.max(0, entry.count - 1);
      entry.requests.pop();
    }

    this.limitsStore.set(key, entry);
  }

  /**
   * Check idempotency - prevent duplicate requests
   */
  public checkIdempotency(
    idempotencyKey: string,
    clientId: string,
    requestData: any
  ): {
    isDuplicate: boolean;
    existingResponse?: any;
    status?: 'processing' | 'completed' | 'failed';
    shouldProcess: boolean;
  } {
    if (!idempotencyKey) {
      return { isDuplicate: false, shouldProcess: true };
    }

    const key = `${clientId}:${idempotencyKey}`;
    const existing = this.idempotencyStore.get(key);

    if (!existing) {
      // New request - store as processing
      this.idempotencyStore.set(key, {
        requestId: idempotencyKey,
        response: null,
        timestamp: Date.now(),
        ttl: Date.now() + this.idempotencyTTL,
        status: 'processing',
        clientId
      });

      return { isDuplicate: false, shouldProcess: true };
    }

    // Check if expired
    if (Date.now() > existing.ttl) {
      // Expired - treat as new request
      this.idempotencyStore.delete(key);
      this.idempotencyStore.set(key, {
        requestId: idempotencyKey,
        response: null,
        timestamp: Date.now(),
        ttl: Date.now() + this.idempotencyTTL,
        status: 'processing',
        clientId
      });

      return { isDuplicate: false, shouldProcess: true };
    }

    // Duplicate request
    if (existing.status === 'completed') {
      return {
        isDuplicate: true,
        existingResponse: existing.response,
        status: existing.status,
        shouldProcess: false
      };
    }

    if (existing.status === 'processing') {
      // Request is still being processed
      return {
        isDuplicate: true,
        status: existing.status,
        shouldProcess: false
      };
    }

    if (existing.status === 'failed') {
      // Previous request failed - allow retry
      existing.status = 'processing';
      existing.timestamp = Date.now();
      this.idempotencyStore.set(key, existing);

      return { isDuplicate: false, shouldProcess: true };
    }

    return { isDuplicate: false, shouldProcess: true };
  }

  /**
   * Store successful idempotent response
   */
  public storeIdempotentResponse(
    idempotencyKey: string,
    clientId: string,
    response: any
  ): void {
    if (!idempotencyKey) return;

    const key = `${clientId}:${idempotencyKey}`;
    const existing = this.idempotencyStore.get(key);

    if (existing) {
      existing.response = response;
      existing.status = 'completed';
      this.idempotencyStore.set(key, existing);
    }
  }

  /**
   * Mark idempotent request as failed
   */
  public markIdempotentRequestFailed(
    idempotencyKey: string,
    clientId: string
  ): void {
    if (!idempotencyKey) return;

    const key = `${clientId}:${idempotencyKey}`;
    const existing = this.idempotencyStore.get(key);

    if (existing) {
      existing.status = 'failed';
      this.idempotencyStore.set(key, existing);
    }
  }

  /**
   * Get rate limit statistics
   */
  public getRateLimitStats(): {
    totalClients: number;
    totalRequests: number;
    activeWindows: number;
    averageRequestsPerWindow: number;
    idempotencyEntries: number;
  } {
    let totalRequests = 0;
    let activeWindows = 0;

    for (const entry of this.limitsStore.values()) {
      totalRequests += entry.count;
      if (Date.now() < entry.resetTime) {
        activeWindows++;
      }
    }

    return {
      totalClients: this.limitsStore.size,
      totalRequests,
      activeWindows,
      averageRequestsPerWindow: activeWindows > 0 ? totalRequests / activeWindows : 0,
      idempotencyEntries: this.idempotencyStore.size
    };
  }

  /**
   * Create a client-specific rate limiter
   */
  public createLimiter(config: RateLimitConfig) {
    return {
      check: (clientId: string, endpoint: string) => 
        this.checkRateLimit(clientId, endpoint, config),
      
      updateResult: (clientId: string, endpoint: string, success: boolean) => 
        this.updateRateLimitResult(clientId, endpoint, success, config)
    };
  }

  /**
   * Clear all rate limit data
   */
  public clearAll(): void {
    this.limitsStore.clear();
    this.idempotencyStore.clear();
  }

  /**
   * Clear rate limits for specific client
   */
  public clearClient(clientId: string): void {
    // Clear rate limits
    const keysToDelete: string[] = [];
    for (const [key] of this.limitsStore) {
      if (key.startsWith(`${clientId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.limitsStore.delete(key));

    // Clear idempotency entries
    const idempKeysToDelete: string[] = [];
    for (const [key] of this.idempotencyStore) {
      if (key.startsWith(`${clientId}:`)) {
        idempKeysToDelete.push(key);
      }
    }
    idempKeysToDelete.forEach(key => this.idempotencyStore.delete(key));
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedRateLimits = 0;
    let cleanedIdempotency = 0;

    // Cleanup expired rate limits
    const rateLimitKeysToDelete: string[] = [];
    for (const [key, entry] of this.limitsStore) {
      if (now >= entry.resetTime) {
        rateLimitKeysToDelete.push(key);
      }
    }
    rateLimitKeysToDelete.forEach(key => {
      this.limitsStore.delete(key);
      cleanedRateLimits++;
    });

    // Cleanup expired idempotency entries
    const idempotencyKeysToDelete: string[] = [];
    for (const [key, entry] of this.idempotencyStore) {
      if (now > entry.ttl) {
        idempotencyKeysToDelete.push(key);
      }
    }
    idempotencyKeysToDelete.forEach(key => {
      this.idempotencyStore.delete(key);
      cleanedIdempotency++;
    });

    if (cleanedRateLimits > 0 || cleanedIdempotency > 0) {
      console.log(`Cleaned up ${cleanedRateLimits} rate limits and ${cleanedIdempotency} idempotency entries`);
    }
  }
}

// Export singleton instance
export const rateLimitManager = new RateLimitManager();

// Pre-configured rate limiters for common use cases

/**
 * Standard rate limiter for search-plans endpoint
 * 100 requests per minute, more restrictive for search operations
 */
export const searchPlansLimiter = rateLimitManager.createLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Restrictive rate limiter for ESIID lookup endpoint
 * 50 requests per minute due to higher cost and complexity
 */
export const esiidLookupLimiter = rateLimitManager.createLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Burst limiter for short-term protection
 * 20 requests per 10 seconds
 */
export const burstLimiter = rateLimitManager.createLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 20,
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count errors against burst limit
});

/**
 * Utility functions for common patterns
 */

export const generateClientId = (request: Request, context?: any): string => {
  // Use multiple signals to identify clients
  const ip = context?.ip || 
             request.headers.get('x-forwarded-for') || 
             request.headers.get('cf-connecting-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const userAgentHash = userAgent.length > 0 ? 
    userAgent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString() : '';

  return `${ip}:${userAgentHash}`;
};

export const extractIdempotencyKey = (request: Request): string | null => {
  return request.headers.get('x-idempotency-key') || 
         request.headers.get('idempotency-key') ||
         null;
};

export const buildRateLimitHeaders = (result: {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
};

export const buildIdempotencyHeaders = (
  idempotencyKey: string | null,
  isDuplicate: boolean
): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
    
    if (isDuplicate) {
      headers['X-Idempotency-Replay'] = 'true';
    }
  }

  return headers;
};

/**
 * Express-style middleware for rate limiting
 */
export const createRateLimitMiddleware = (
  limiter: ReturnType<typeof rateLimitManager.createLimiter>,
  endpoint: string
) => {
  return async (
    request: Request, 
    context: any, 
    next: () => Promise<Response>
  ): Promise<Response> => {
    const clientId = generateClientId(request, context);
    const rateLimitResult = limiter.check(clientId, endpoint);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            userMessage: 'You have made too many requests. Please try again later.',
            retryable: true
          },
          meta: {
            timestamp: new Date().toISOString(),
            retryAfter: rateLimitResult.retryAfter
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...buildRateLimitHeaders(rateLimitResult)
          }
        }
      );
    }

    try {
      const response = await next();
      limiter.updateResult(clientId, endpoint, response.ok);
      return response;
    } catch (error) {
      limiter.updateResult(clientId, endpoint, false);
      throw error;
    }
  };
};

/**
 * Idempotency middleware for preventing duplicate requests
 */
export const createIdempotencyMiddleware = () => {
  return async (
    request: Request,
    context: any,
    next: () => Promise<Response>
  ): Promise<Response> => {
    const idempotencyKey = extractIdempotencyKey(request);
    
    if (!idempotencyKey) {
      return await next();
    }

    const clientId = generateClientId(request, context);
    const idempotencyCheck = rateLimitManager.checkIdempotency(
      idempotencyKey,
      clientId,
      await request.clone().json().catch(() => ({}))
    );

    if (idempotencyCheck.isDuplicate) {
      if (idempotencyCheck.status === 'completed' && idempotencyCheck.existingResponse) {
        // Return cached response
        return new Response(
          JSON.stringify(idempotencyCheck.existingResponse),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...buildIdempotencyHeaders(idempotencyKey, true)
            }
          }
        );
      }

      if (idempotencyCheck.status === 'processing') {
        // Request is still being processed
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'REQUEST_IN_PROGRESS',
              message: 'Request is already being processed',
              userMessage: 'Your request is being processed. Please wait.',
              retryable: true
            },
            meta: {
              timestamp: new Date().toISOString(),
              idempotencyKey
            }
          }),
          {
            status: 409, // Conflict
            headers: {
              'Content-Type': 'application/json',
              ...buildIdempotencyHeaders(idempotencyKey, true),
              'Retry-After': '5' // Suggest retry in 5 seconds
            }
          }
        );
      }
    }

    try {
      const response = await next();
      
      if (response.ok) {
        const responseData = await response.clone().json().catch(() => null);
        if (responseData) {
          rateLimitManager.storeIdempotentResponse(idempotencyKey, clientId, responseData);
        }
      } else {
        rateLimitManager.markIdempotentRequestFailed(idempotencyKey, clientId);
      }

      // Add idempotency headers to response
      const headers = new Headers(response.headers);
      const idempotencyHeaders = buildIdempotencyHeaders(idempotencyKey, false);
      for (const [key, value] of Object.entries(idempotencyHeaders)) {
        headers.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      rateLimitManager.markIdempotentRequestFailed(idempotencyKey, clientId);
      throw error;
    }
  };
};

// Export statistics function for monitoring
export const getRateLimitingStats = () => {
  return rateLimitManager.getRateLimitStats();
};