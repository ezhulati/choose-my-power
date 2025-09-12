/**
 * Comprehensive Logging System
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Production-grade logging infrastructure
 */

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: LogContext;
  stack?: string;
  duration?: number;
  performanceMetrics?: {
    memory?: number;
    timing?: number;
    cacheHit?: boolean;
  };
}

interface ErrorWithContext extends Error {
  context?: LogContext;
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: string;
  private enableRemoteLogging: boolean;
  private remoteEndpoint?: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'warn');
    this.enableRemoteLogging = process.env.ENABLE_REMOTE_LOGGING === 'true';
    this.remoteEndpoint = process.env.REMOTE_LOGGING_ENDPOINT;

    // Auto-flush buffer periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.flushLogs(), this.flushInterval);
    }
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context: LogContext = {},
    error?: Error,
    duration?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.getDefaultContext(),
        ...context
      }
    };

    if (error) {
      entry.stack = error.stack;
      if (error instanceof ErrorWithContext) {
        entry.context = { ...entry.context, ...error.context };
      }
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    if (typeof window !== 'undefined' && window.performance) {
      entry.performanceMetrics = {
        memory: (performance as unknown).memory?.usedJSHeapSize,
        timing: performance.now()
      };
    }

    return entry;
  }

  /**
   * Get default context from environment
   */
  private getDefaultContext(): LogContext {
    const context: LogContext = {};

    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
      
      // Extract session ID from localStorage or generate one
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('session_id', sessionId);
      }
      context.sessionId = sessionId;
    }

    return context;
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Output log to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    const contextStr = entry.context.component 
      ? `[${entry.context.component}]` 
      : '';

    const message = `${prefix} ${contextStr} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.warn(message, entry.context);
        break;
      case 'info':
        console.info(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context);
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.context);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    if (this.isDevelopment && entry.performanceMetrics) {
      console.warn('Performance:', entry.performanceMetrics);
    }
  }

  /**
   * Add log entry to buffer for remote logging
   */
  private bufferLog(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  private async flushLogs(): Promise<void> {
    if (!this.enableRemoteLogging || !this.remoteEndpoint || this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: 'choosemypower-frontend'
        })
      });
    } catch (error) {
      // Don't log this error to avoid infinite loops
      console.warn('Failed to send logs to remote endpoint:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  /**
   * Main logging method
   */
  private log(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number
  ): void {
    const entry = this.createLogEntry(level, message, context, error, duration);
    
    this.outputToConsole(entry);
    this.bufferLog(entry);
  }

  /**
   * Debug logging
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info logging
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning logging
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Fatal error logging
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
    
    // Force immediate flush for fatal errors
    this.flushLogs();
  }

  /**
   * Performance logging with timing
   */
  performance(message: string, startTime: number, context?: LogContext): void {
    const duration = performance.now() - startTime;
    this.log('info', `${message} (${duration.toFixed(2)}ms)`, context, undefined, duration);
  }

  /**
   * API request logging
   */
  apiRequest(method: string, url: string, statusCode?: number, duration?: number, context?: LogContext): void {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    const message = `${method} ${url} ${statusCode ? `[${statusCode}]` : ''}`;
    
    this.log(level, message, {
      ...context,
      action: 'api_request',
      metadata: {
        method,
        url,
        statusCode,
        duration
      }
    }, undefined, duration);
  }

  /**
   * User action logging
   */
  userAction(action: string, context?: LogContext): void {
    this.log('info', `User action: ${action}`, {
      ...context,
      action: 'user_action',
      metadata: {
        userAction: action
      }
    });
  }

  /**
   * Component lifecycle logging
   */
  componentLifecycle(component: string, lifecycle: string, context?: LogContext): void {
    this.log('debug', `${component} ${lifecycle}`, {
      ...context,
      component,
      action: 'lifecycle',
      metadata: {
        lifecycle
      }
    });
  }

  /**
   * Cache operation logging
   */
  cacheOperation(operation: string, key: string, hit: boolean, context?: LogContext): void {
    this.log('debug', `Cache ${operation}: ${key} ${hit ? 'HIT' : 'MISS'}`, {
      ...context,
      action: 'cache_operation',
      metadata: {
        operation,
        key,
        hit
      }
    });
  }

  /**
   * Database operation logging
   */
  databaseOperation(operation: string, table: string, duration?: number, context?: LogContext): void {
    this.log('debug', `DB ${operation}: ${table}`, {
      ...context,
      action: 'database_operation',
      metadata: {
        operation,
        table
      }
    }, undefined, duration);
  }

  /**
   * Security event logging
   */
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    
    this.log(level, `Security event: ${event}`, {
      ...context,
      action: 'security_event',
      metadata: {
        securityEvent: event,
        severity
      }
    });
  }

  /**
   * Create a child logger with specific context
   */
  createChildLogger(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
    
    childLogger.createLogEntry = (level, message, childContext = {}, error?, duration?) => {
      return originalCreateLogEntry(level, message, { ...context, ...childContext }, error, duration);
    };
    
    return childLogger;
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export logger and types
export { logger, Logger, type LogContext, type LogEntry, type ErrorWithContext };

// Convenience function for creating contextual loggers
export function createLogger(component: string, additionalContext?: LogContext): Logger {
  return logger.createChildLogger({
    component,
    ...additionalContext
  });
}

// Error boundary helper
export function logErrorBoundary(error: Error, errorInfo: unknown, component: string): void {
  logger.error('React Error Boundary triggered', error, {
    component,
    action: 'error_boundary',
    metadata: {
      componentStack: errorInfo.componentStack,
      errorBoundary: component
    }
  });
}

// Unhandled error catchers
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      action: 'unhandled_rejection',
      url: window.location.href
    });
  });

  // Catch uncaught exceptions
  window.addEventListener('error', (event) => {
    logger.error('Uncaught exception', event.error, {
      action: 'uncaught_exception',
      url: window.location.href,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });
}