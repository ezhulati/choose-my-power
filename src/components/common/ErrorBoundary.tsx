/**
 * React Error Boundary with Comprehensive Logging
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Production-ready error boundaries
 */

import React, { Component, type ReactNode } from 'react';
import { trackError, getUserErrorMessage } from '../../lib/logging/error-tracker';
import { logger } from '../../lib/logging/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: unknown) => ReactNode;
  onError?: (error: Error, errorInfo: unknown) => void;
  level?: 'page' | 'component' | 'feature';
  name?: string;
  isolate?: boolean; // Whether to isolate errors to this boundary
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: unknown;
  errorId?: string;
  retryCount: number;
  lastErrorTime: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    const { onError, name = 'UnknownComponent', level = 'component' } = this.props;
    
    // Track error with context
    const errorId = trackError(error, {
      component: `ErrorBoundary:${name}`,
      action: 'component_error_boundary',
      metadata: {
        errorBoundaryName: name,
        errorBoundaryLevel: level,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        errorInfo: {
          digest: errorInfo.digest,
          stack: errorInfo.componentStack?.slice(0, 1000) // Limit size
        }
      }
    });

    // Update state with error info
    this.setState({
      errorInfo,
      errorId
    });

    // Log detailed error information
    logger.error(`Error boundary triggered in ${name}`, error, {
      component: `ErrorBoundary:${name}`,
      action: 'error_boundary_triggered',
      metadata: {
        errorId,
        errorBoundaryLevel: level,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        isolate: this.props.isolate
      }
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError, {
          component: `ErrorBoundary:${name}`,
          action: 'error_handler_failed'
        });
      }
    }

    // Setup auto-retry for transient errors
    this.scheduleRetry();
  }

  /**
   * Schedule automatic retry for potentially transient errors
   */
  private scheduleRetry = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      logger.warn('Max retries reached for error boundary', undefined, {
        component: `ErrorBoundary:${this.props.name}`,
        action: 'max_retries_reached',
        metadata: {
          maxRetries: this.maxRetries,
          finalRetryCount: retryCount
        }
      });
      return;
    }

    const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
    
    this.retryTimeoutId = setTimeout(() => {
      logger.info('Attempting automatic retry for error boundary', undefined, {
        component: `ErrorBoundary:${this.props.name}`,
        action: 'auto_retry_attempt',
        metadata: {
          retryCount: retryCount + 1,
          delay
        }
      });
      
      this.retry();
    }, delay);
  };

  /**
   * Retry rendering by resetting error state
   */
  private retry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: undefined,
      retryCount: prevState.retryCount + 1,
      lastErrorTime: 0
    }));

    logger.info('Error boundary retry executed', undefined, {
      component: `ErrorBoundary:${this.props.name}`,
      action: 'error_boundary_retry',
      metadata: {
        retryCount: this.state.retryCount + 1
      }
    });
  };

  /**
   * Manual retry function for user-triggered retries
   */
  private handleManualRetry = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    logger.info('Manual retry triggered by user', undefined, {
      component: `ErrorBoundary:${this.props.name}`,
      action: 'manual_retry_triggered',
      metadata: {
        currentRetryCount: this.state.retryCount
      }
    });

    this.retry();
  };

  /**
   * Reset error boundary to initial state
   */
  private handleReset = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: undefined,
      retryCount: 0,
      lastErrorTime: 0
    });

    logger.info('Error boundary reset by user', undefined, {
      component: `ErrorBoundary:${this.props.name}`,
      action: 'error_boundary_reset'
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, name = 'Component', level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        try {
          return fallback(error, errorInfo);
        } catch (fallbackError) {
          logger.error('Error in custom fallback renderer', fallbackError, {
            component: `ErrorBoundary:${name}`,
            action: 'fallback_render_error'
          });
          // Fall through to default error UI
        }
      }

      // Get user-friendly error message
      const userMessage = getUserErrorMessage(error);
      const showRetry = retryCount < this.maxRetries;
      const showTechnicalDetails = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary-container p-6 bg-texas-red/10 border border-texas-red/30 rounded-lg m-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-texas-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-texas-red-800 mb-2">
                {level === 'page' ? 'Page Error' : level === 'feature' ? 'Feature Error' : 'Component Error'}
              </h3>
              
              <p className="text-texas-red-700 mb-4">
                {userMessage}
              </p>

              {showTechnicalDetails && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-texas-red hover:text-texas-red-800 font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-texas-red/20 rounded text-sm">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {errorId && (
                      <div className="mb-2">
                        <strong>Error ID:</strong> {errorId}
                      </div>
                    )}
                    <div className="mb-2">
                      <strong>Component:</strong> {name}
                    </div>
                    <div className="mb-2">
                      <strong>Retry Count:</strong> {retryCount}
                    </div>
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                          {errorInfo.componentStack.slice(0, 500)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex space-x-3">
                {showRetry && (
                  <button
                    onClick={this.handleManualRetry}
                    className="px-4 py-2 bg-texas-red text-white rounded hover:bg-texas-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-texas-navy text-white rounded hover:bg-texas-navy-600 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {retryCount >= this.maxRetries && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-yellow-800 text-sm">
                    <strong>Persistent Error:</strong> This error has occurred multiple times. 
                    You may need to refresh the page or contact support if the problem continues.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...boundaryProps} name={WrappedComponent.name || 'WrappedComponent'}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithErrorBoundary;
}

// Hook for triggering error boundaries programmatically
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // Create error with component stack if available
    if (errorInfo?.componentStack) {
      error.stack = `${error.stack}\n\nComponent Stack:${errorInfo.componentStack}`;
    }
    
    // Throw error to trigger nearest error boundary
    throw error;
  };
}

export default ErrorBoundary;