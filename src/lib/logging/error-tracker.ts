/**
 * Error Tracking and Analytics System
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Advanced error tracking and analytics
 */

import { logger, type LogContext, type ErrorWithContext } from './logger';

interface ErrorPattern {
  type: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'network' | 'security' | 'performance';
  autoRetry?: boolean;
  userMessage?: string;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentErrors: Array<{
    timestamp: string;
    type: string;
    message: string;
    count: number;
  }>;
}

interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

class ErrorTracker {
  private errorPatterns: ErrorPattern[] = [];
  private errorCounts: Map<string, number> = new Map();
  private errorTimestamps: Map<string, number[]> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private suppressedErrors: Set<string> = new Set();

  constructor() {
    this.initializeErrorPatterns();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialize predefined error patterns
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      // Network errors
      {
        type: 'NETWORK_ERROR',
        pattern: /network|fetch|timeout|connection/i,
        severity: 'medium',
        category: 'network',
        autoRetry: true,
        userMessage: 'Network connection issue. Please check your internet connection and try again.'
      },
      {
        type: 'API_RATE_LIMIT',
        pattern: /rate limit|too many requests|429/i,
        severity: 'medium',
        category: 'network',
        autoRetry: true,
        userMessage: 'Service is temporarily busy. Please wait a moment and try again.'
      },
      
      // User input errors
      {
        type: 'VALIDATION_ERROR',
        pattern: /validation|invalid.*input|required.*field/i,
        severity: 'low',
        category: 'user',
        autoRetry: false,
        userMessage: 'Please check your input and try again.'
      },
      {
        type: 'ZIP_CODE_ERROR',
        pattern: /zip.*code|postal.*code|invalid.*zip/i,
        severity: 'low',
        category: 'user',
        autoRetry: false,
        userMessage: 'Please enter a valid Texas ZIP code.'
      },
      
      // System errors
      {
        type: 'DATABASE_ERROR',
        pattern: /database|db|sql|connection.*pool/i,
        severity: 'high',
        category: 'system',
        autoRetry: true,
        userMessage: 'System is temporarily unavailable. Please try again in a few moments.'
      },
      {
        type: 'CACHE_ERROR',
        pattern: /cache|redis|memory/i,
        severity: 'medium',
        category: 'system',
        autoRetry: true,
        userMessage: 'Loading data from source. This may take a moment longer than usual.'
      },
      
      // Performance errors
      {
        type: 'MEMORY_ERROR',
        pattern: /memory|heap|out of memory/i,
        severity: 'critical',
        category: 'performance',
        autoRetry: false,
        userMessage: 'The system is experiencing high load. Please refresh the page.'
      },
      {
        type: 'TIMEOUT_ERROR',
        pattern: /timeout|timed out|request.*timeout/i,
        severity: 'medium',
        category: 'performance',
        autoRetry: true,
        userMessage: 'Request is taking longer than expected. Please try again.'
      },
      
      // Security errors
      {
        type: 'SECURITY_ERROR',
        pattern: /unauthorized|forbidden|security|csrf|xss/i,
        severity: 'critical',
        category: 'security',
        autoRetry: false,
        userMessage: 'Security issue detected. Please refresh the page and try again.'
      },
      
      // Component errors
      {
        type: 'COMPONENT_ERROR',
        pattern: /component|render|react|astro/i,
        severity: 'medium',
        category: 'system',
        autoRetry: false,
        userMessage: 'Display issue encountered. Please refresh the page.'
      }
    ];
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Enhanced unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        action: 'unhandled_rejection',
        url: window.location.href,
        metadata: {
          promise: true,
          handled: false
        }
      });
    });

    // Enhanced global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        action: 'uncaught_exception',
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          handled: false
        }
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.trackError(new Error(`Resource loading failed: ${(event.target as unknown).src || (event.target as unknown).href}`), {
          action: 'resource_error',
          url: window.location.href,
          metadata: {
            resourceType: (event.target as unknown).tagName,
            resourceUrl: (event.target as unknown).src || (event.target as unknown).href
          }
        });
      }
    }, true);
  }

  /**
   * Classify error based on patterns
   */
  private classifyError(error: Error): ErrorPattern | null {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStack = error.stack?.toLowerCase() || '';
    const searchText = `${errorMessage} ${errorStack}`;

    return this.errorPatterns.find(pattern => 
      pattern.pattern.test(searchText)
    ) || null;
  }

  /**
   * Generate unique error key for tracking
   */
  private generateErrorKey(error: Error, context?: LogContext): string {
    const classification = this.classifyError(error);
    const type = classification?.type || 'UNKNOWN_ERROR';
    const component = context?.component || 'unknown';
    const action = context?.action || 'unknown';
    
    return `${type}:${component}:${action}`;
  }

  /**
   * Check if error should be suppressed (too frequent)
   */
  private shouldSuppressError(errorKey: string): boolean {
    const now = Date.now();
    const timestamps = this.errorTimestamps.get(errorKey) || [];
    
    // Remove timestamps older than 5 minutes
    const recentTimestamps = timestamps.filter(ts => now - ts < 300000);
    this.errorTimestamps.set(errorKey, recentTimestamps);
    
    // Suppress if more than 10 occurrences in 5 minutes
    if (recentTimestamps.length >= 10) {
      this.suppressedErrors.add(errorKey);
      return true;
    }
    
    return this.suppressedErrors.has(errorKey);
  }

  /**
   * Main error tracking method
   */
  trackError(error: Error | string, context?: LogContext): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorKey = this.generateErrorKey(errorObj, context);
    const classification = this.classifyError(errorObj);
    
    // Check if should suppress
    if (this.shouldSuppressError(errorKey)) {
      return errorKey;
    }
    
    // Update error counts
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Update timestamps
    const timestamps = this.errorTimestamps.get(errorKey) || [];
    timestamps.push(Date.now());
    this.errorTimestamps.set(errorKey, timestamps);
    
    // Log error with classification
    const logContext: LogContext = {
      ...context,
      metadata: {
        ...context?.metadata,
        errorKey,
        classification: classification?.type || 'UNKNOWN',
        category: classification?.category || 'unknown',
        severity: classification?.severity || 'medium',
        count: currentCount + 1,
        autoRetry: classification?.autoRetry || false
      }
    };
    
    const logLevel = classification?.severity === 'critical' ? 'fatal' : 'error';
    if (logLevel === 'fatal') {
      logger.fatal(`${classification?.type || 'UNKNOWN_ERROR'}: ${errorObj.message}`, errorObj, logContext);
    } else {
      logger.error(`${classification?.type || 'UNKNOWN_ERROR'}: ${errorObj.message}`, errorObj, logContext);
    }
    
    // Handle auto-retry if configured
    if (classification?.autoRetry && this.shouldRetry(errorKey)) {
      this.scheduleRetry(errorKey, context);
    }
    
    return errorKey;
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(errorKey: string): boolean {
    const attempts = this.retryAttempts.get(errorKey) || 0;
    return attempts < 3; // Max 3 retry attempts
  }

  /**
   * Schedule retry for auto-retry errors
   */
  private scheduleRetry(errorKey: string, context?: LogContext): void {
    const attempts = this.retryAttempts.get(errorKey) || 0;
    this.retryAttempts.set(errorKey, attempts + 1);
    
    const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
    
    setTimeout(() => {
      logger.info(`Retrying operation after error: ${errorKey}`, {
        ...context,
        action: 'auto_retry',
        metadata: {
          errorKey,
          attempt: attempts + 1,
          delay
        }
      });
      
      // Emit retry event for components to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('error-retry', {
          detail: { errorKey, attempt: attempts + 1, context }
        }));
      }
    }, delay);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: 0,
      byType: {},
      byCategory: {},
      bySeverity: {},
      recentErrors: []
    };
    
    for (const [errorKey, count] of this.errorCounts.entries()) {
      stats.total += count;
      
      const [type] = errorKey.split(':');
      stats.byType[type] = (stats.byType[type] || 0) + count;
      
      const classification = this.errorPatterns.find(p => p.type === type);
      if (classification) {
        stats.byCategory[classification.category] = (stats.byCategory[classification.category] || 0) + count;
        stats.bySeverity[classification.severity] = (stats.bySeverity[classification.severity] || 0) + count;
      }
    }
    
    // Get recent errors (last 10)
    const sortedErrors = Array.from(this.errorCounts.entries())
      .map(([errorKey, count]) => {
        const timestamps = this.errorTimestamps.get(errorKey) || [];
        const latestTimestamp = Math.max(...timestamps);
        const [type] = errorKey.split(':');
        
        return {
          timestamp: new Date(latestTimestamp).toISOString(),
          type,
          message: errorKey,
          count
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    stats.recentErrors = sortedErrors;
    
    return stats;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error | string): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const classification = this.classifyError(errorObj);
    
    return classification?.userMessage || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorCounts.clear();
    this.errorTimestamps.clear();
    this.retryAttempts.clear();
    this.suppressedErrors.clear();
    
    logger.info('Error tracking history cleared', {
      action: 'clear_error_history'
    });
  }

  /**
   * Create error with context
   */
  createError(message: string, code?: string, statusCode?: number, context?: LogContext): ErrorWithContext {
    const error = new Error(message) as ErrorWithContext;
    error.context = context;
    error.code = code;
    error.statusCode = statusCode;
    error.isOperational = true;
    
    return error;
  }

  /**
   * Wrap async function with error tracking
   */
  wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: LogContext
  ): T {
    return (async (...args: unknown[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.trackError(error as Error, {
          ...context,
          action: 'wrapped_async_error',
          metadata: {
            functionName: fn.name,
            args: args.length
          }
        });
        throw error;
      }
    }) as T;
  }

  /**
   * Create retry decorator for functions
   */
  withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    retryConfig: RetryConfig,
    context?: LogContext
  ): T {
    return (async (...args: unknown[]) => {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === retryConfig.maxAttempts || 
              (retryConfig.retryCondition && !retryConfig.retryCondition(lastError))) {
            this.trackError(lastError, {
              ...context,
              action: 'retry_exhausted',
              metadata: {
                functionName: fn.name,
                totalAttempts: attempt,
                finalError: true
              }
            });
            throw lastError;
          }
          
          const delay = retryConfig.backoffMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
          
          this.trackError(lastError, {
            ...context,
            action: 'retry_attempt',
            metadata: {
              functionName: fn.name,
              attempt,
              nextRetryMs: delay
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError!;
    }) as T;
  }
}

// Create singleton error tracker
const errorTracker = new ErrorTracker();

export { errorTracker, ErrorTracker, type ErrorPattern, type ErrorStats, type RetryConfig };

// Convenience functions
export function trackError(error: Error | string, context?: LogContext): string {
  return errorTracker.trackError(error, context);
}

export function getUserErrorMessage(error: Error | string): string {
  return errorTracker.getUserMessage(error);
}

export function getErrorStats(): ErrorStats {
  return errorTracker.getErrorStats();
}

export function createErrorWithContext(
  message: string,
  code?: string,
  statusCode?: number,
  context?: LogContext
): ErrorWithContext {
  return errorTracker.createError(message, code, statusCode, context);
}

export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: LogContext
): T {
  return errorTracker.wrapAsync(fn, context);
}

export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  retryConfig: RetryConfig,
  context?: LogContext
): T {
  return errorTracker.withRetry(fn, retryConfig, context);
}