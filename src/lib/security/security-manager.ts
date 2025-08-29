/**
 * Security Manager for ChooseMyPower Backend
 * Comprehensive security system with rate limiting, input validation, and threat detection
 * Features:
 * - Rate limiting per IP and session
 * - Input validation and sanitization
 * - SQL injection prevention
 * - XSS protection
 * - CORS configuration
 * - API key management
 * - Request throttling and abuse detection
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
}

export interface SecurityConfig {
  rateLimits: {
    global: RateLimitConfig;
    api: RateLimitConfig;
    search: RateLimitConfig;
    leads: RateLimitConfig;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  validation: {
    maxRequestSize: number;
    maxFieldLength: number;
    allowedFileTypes: string[];
  };
  monitoring: {
    logFailedRequests: boolean;
    alertThreshold: number;
    banThreshold: number;
  };
}

export interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'validation_error' | 'suspicious_activity' | 'blocked_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  endpoint: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class SecurityManager {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private trustedIPs: Set<string> = new Set();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimits: {
        global: {
          windowMs: 60000, // 1 minute
          maxRequests: 100,
        },
        api: {
          windowMs: 60000, // 1 minute
          maxRequests: 60,
        },
        search: {
          windowMs: 60000, // 1 minute
          maxRequests: 120, // Higher limit for search
        },
        leads: {
          windowMs: 300000, // 5 minutes
          maxRequests: 5, // Strict limit for lead creation
        },
      },
      cors: {
        allowedOrigins: [
          'https://choosemypower.org',
          'https://www.choosemypower.org',
          process.env.FRONTEND_URL || 'http://localhost:4324',
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-Session-ID',
          'X-API-Key',
        ],
        credentials: true,
      },
      validation: {
        maxRequestSize: 1024 * 1024, // 1MB
        maxFieldLength: 10000,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      },
      monitoring: {
        logFailedRequests: true,
        alertThreshold: 10, // Alert after 10 failed requests from same IP
        banThreshold: 50, // Ban after 50 failed requests from same IP
      },
      ...config,
    };

    // Initialize trusted IPs (internal services, CDN, etc.)
    this.trustedIPs.add('127.0.0.1');
    this.trustedIPs.add('::1');
    
    // Add CDN/proxy IPs if configured
    if (process.env.TRUSTED_PROXIES) {
      process.env.TRUSTED_PROXIES.split(',').forEach(ip => {
        this.trustedIPs.add(ip.trim());
      });
    }

    // Start cleanup interval
    setInterval(() => {
      this.cleanupExpiredRateLimits();
      this.cleanupOldSecurityEvents();
    }, 60000); // Every minute
  }

  /**
   * Check rate limit for a request
   */
  checkRateLimit(
    request: {
      ip: string;
      endpoint: string;
      userAgent?: string;
    },
    limitType: keyof SecurityConfig['rateLimits']
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const config = this.config.rateLimits[limitType];
    const key = `${limitType}:${request.ip}`;
    const now = Date.now();

    // Check if IP is blocked
    if (this.blockedIPs.has(request.ip)) {
      this.logSecurityEvent({
        type: 'blocked_request',
        severity: 'high',
        ip: request.ip,
        userAgent: request.userAgent,
        endpoint: request.endpoint,
        message: 'Request from blocked IP',
        metadata: { limitType },
      });
      return { allowed: false, remaining: 0, resetTime: 0 };
    }

    // Check if IP is trusted
    if (this.trustedIPs.has(request.ip)) {
      return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
    }

    const existing = this.rateLimitStore.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Create new or reset expired limit
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip: request.ip,
        userAgent: request.userAgent,
        endpoint: request.endpoint,
        message: `Rate limit exceeded: ${existing.count}/${config.maxRequests} in ${config.windowMs}ms`,
        metadata: { limitType, count: existing.count, limit: config.maxRequests },
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    // Increment count
    existing.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime,
    };
  }

  /**
   * Validate and sanitize input data
   */
  validateInput(data: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    try {
      // Check overall data size
      const dataSize = JSON.stringify(data).length;
      if (dataSize > this.config.validation.maxRequestSize) {
        errors.push(`Request too large: ${dataSize} bytes (max: ${this.config.validation.maxRequestSize})`);
      }

      // Validate each field
      for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];
        const fieldResult = this.validateField(field, value, rule);
        
        if (!fieldResult.valid) {
          errors.push(...fieldResult.errors);
        } else {
          sanitizedData[field] = fieldResult.sanitizedValue;
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      };

    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid request format'],
      };
    }
  }

  /**
   * Validate individual field
   */
  private validateField(fieldName: string, value: any, rule: ValidationRule): {
    valid: boolean;
    errors: string[];
    sanitizedValue: any;
  } {
    const errors: string[] = [];
    let sanitizedValue = value;

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors, sanitizedValue };
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null)) {
      return { valid: true, errors: [], sanitizedValue: null };
    }

    // Type validation and sanitization
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
          break;
        }
        
        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${fieldName} must be at most ${rule.maxLength} characters`);
        }
        if (value.length > this.config.validation.maxFieldLength) {
          errors.push(`${fieldName} exceeds maximum field length`);
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${fieldName} format is invalid`);
        }

        // Sanitize HTML/XSS
        sanitizedValue = this.sanitizeString(value);
        break;

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          errors.push(`${fieldName} must be a number`);
          break;
        }
        
        if (rule.min !== undefined && num < rule.min) {
          errors.push(`${fieldName} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && num > rule.max) {
          errors.push(`${fieldName} must be at most ${rule.max}`);
        }
        
        sanitizedValue = num;
        break;

      case 'boolean':
        if (typeof value === 'string') {
          sanitizedValue = value.toLowerCase() === 'true';
        } else if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
          break;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${fieldName} must be a valid email address`);
        }
        
        sanitizedValue = value.toLowerCase().trim();
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
          break;
        }
        
        if (rule.minItems && value.length < rule.minItems) {
          errors.push(`${fieldName} must have at least ${rule.minItems} items`);
        }
        if (rule.maxItems && value.length > rule.maxItems) {
          errors.push(`${fieldName} must have at most ${rule.maxItems} items`);
        }
        break;

      default:
        // Custom validation
        if (rule.validator) {
          const customResult = rule.validator(value);
          if (!customResult.valid) {
            errors.push(...customResult.errors);
          } else {
            sanitizedValue = customResult.value || sanitizedValue;
          }
        }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  /**
   * Sanitize string to prevent XSS
   */
  private sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Check CORS
   */
  checkCORS(origin: string | undefined, method: string): {
    allowed: boolean;
    headers: Record<string, string>;
  } {
    const config = this.config.cors;
    const headers: Record<string, string> = {};

    // Check origin
    if (origin && !config.allowedOrigins.includes('*')) {
      if (!config.allowedOrigins.includes(origin)) {
        return { allowed: false, headers };
      }
    }

    // Check method
    if (!config.allowedMethods.includes(method.toUpperCase())) {
      return { allowed: false, headers };
    }

    // Set CORS headers
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    headers['Access-Control-Allow-Credentials'] = config.credentials ? 'true' : 'false';

    return { allowed: true, headers };
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string | undefined, requiredLevel: 'public' | 'private' | 'admin' = 'public'): boolean {
    if (!apiKey) {
      return requiredLevel === 'public';
    }

    const validKeys = {
      public: process.env.PUBLIC_API_KEY,
      private: process.env.PRIVATE_API_KEY,
      admin: process.env.ADMIN_API_KEY,
    };

    // Check if key matches required level or higher
    switch (requiredLevel) {
      case 'public':
        return apiKey === validKeys.public || 
               apiKey === validKeys.private || 
               apiKey === validKeys.admin;
      case 'private':
        return apiKey === validKeys.private || 
               apiKey === validKeys.admin;
      case 'admin':
        return apiKey === validKeys.admin;
      default:
        return false;
    }
  }

  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity(request: {
    ip: string;
    userAgent?: string;
    endpoint: string;
    data?: any;
  }): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for common attack patterns in user agent
    if (request.userAgent) {
      const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /masscan/i,
        /zap/i,
        /burp/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(request.userAgent)) {
          reasons.push('Suspicious user agent detected');
          break;
        }
      }
    }

    // Check for SQL injection patterns
    if (request.data) {
      const sqlPatterns = [
        /(\bor\b|\band\b).*=.*('|")/i,
        /union.*select/i,
        /drop.*table/i,
        /insert.*into/i,
        /delete.*from/i,
        /update.*set/i,
      ];

      const dataString = JSON.stringify(request.data).toLowerCase();
      for (const pattern of sqlPatterns) {
        if (pattern.test(dataString)) {
          reasons.push('Potential SQL injection attempt');
          break;
        }
      }
    }

    // Check endpoint access patterns
    const recentEvents = this.securityEvents.filter(
      event => event.ip === request.ip && 
      Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
    );

    if (recentEvents.length > 20) {
      reasons.push('Excessive requests from IP');
    }

    const errorEvents = recentEvents.filter(event => 
      event.type === 'validation_error' || event.type === 'rate_limit'
    );
    if (errorEvents.length > 10) {
      reasons.push('High error rate from IP');
    }

    if (reasons.length > 0) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: reasons.length > 2 ? 'high' : 'medium',
        ip: request.ip,
        userAgent: request.userAgent,
        endpoint: request.endpoint,
        message: `Suspicious activity detected: ${reasons.join(', ')}`,
        metadata: { reasons, recentEventsCount: recentEvents.length },
      });
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    
    this.logSecurityEvent({
      type: 'blocked_request',
      severity: 'critical',
      ip,
      endpoint: 'SYSTEM',
      message: `IP blocked: ${reason}`,
      metadata: { reason, blockedAt: new Date() },
    });

    console.warn(`IP ${ip} has been blocked: ${reason}`);
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): boolean {
    const wasBlocked = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    
    if (wasBlocked) {
      this.logSecurityEvent({
        type: 'blocked_request',
        severity: 'medium',
        ip,
        endpoint: 'SYSTEM',
        message: 'IP unblocked',
        metadata: { unblockedAt: new Date() },
      });
    }

    return wasBlocked;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event,
    };

    this.securityEvents.push(securityEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Security Event [${event.severity.toUpperCase()}]:`, event.message, event.metadata);
    }

    // Check if IP should be auto-blocked
    this.checkAutoBlock(event.ip);
  }

  /**
   * Check if IP should be auto-blocked
   */
  private checkAutoBlock(ip: string): void {
    if (this.trustedIPs.has(ip) || this.blockedIPs.has(ip)) {
      return;
    }

    const recentEvents = this.securityEvents.filter(
      event => event.ip === ip && 
      Date.now() - event.timestamp.getTime() < 3600000 // Last hour
    );

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    const totalEvents = recentEvents.length;

    // Auto-block criteria
    if (criticalEvents >= 3 || highEvents >= 10 || totalEvents >= this.config.monitoring.banThreshold) {
      this.blockIP(ip, `Auto-blocked: ${criticalEvents} critical, ${highEvents} high severity events, ${totalEvents} total events in last hour`);
    }
  }

  /**
   * Clean up expired rate limits
   */
  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Clean up old security events
   */
  private cleanupOldSecurityEvents(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    blockedIPs: number;
    recentEvents: number;
    rateLimitHits: number;
    suspiciousActivity: number;
  } {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 3600000 // Last hour
    );

    return {
      blockedIPs: this.blockedIPs.size,
      recentEvents: recentEvents.length,
      rateLimitHits: recentEvents.filter(e => e.type === 'rate_limit').length,
      suspiciousActivity: recentEvents.filter(e => e.type === 'suspicious_activity').length,
    };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(hours = 24): SecurityEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.securityEvents.filter(
      event => event.timestamp.getTime() > cutoff
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Validation rule types
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'array' | 'custom';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  minItems?: number;
  maxItems?: number;
  validator?: (value: any) => { valid: boolean; errors: string[]; value?: any };
}

export type ValidationRules = Record<string, ValidationRule>;

// Export singleton instance
export const securityManager = new SecurityManager();

// Export types for external use
export type { SecurityEvent, ValidationResult, RateLimitConfig, SecurityConfig };