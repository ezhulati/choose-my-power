/**
 * Error Tracker Test Suite
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Unit tests for error tracking system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorTracker, trackError, getUserErrorMessage, getErrorStats, createErrorWithContext } from '../../src/lib/logging/error-tracker';

// Mock logger
vi.mock('../../src/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn()
  }
}));

describe('ErrorTracker', () => {
  let errorTracker: ErrorTracker;

  beforeEach(() => {
    errorTracker = new ErrorTracker();
    // Clear any existing error history
    errorTracker.clearErrorHistory();
    vi.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network timeout - connection failed');
      const errorKey = trackError(networkError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('NETWORK_ERROR');
      
      const userMessage = getUserErrorMessage(networkError);
      expect(userMessage).toContain('Network connection issue');
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Validation failed: invalid input format');
      const errorKey = trackError(validationError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('VALIDATION_ERROR');
      
      const userMessage = getUserErrorMessage(validationError);
      expect(userMessage).toContain('check your input');
    });

    it('should classify database errors correctly', () => {
      const dbError = new Error('Database connection pool exhausted');
      const errorKey = trackError(dbError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('DATABASE_ERROR');
      
      const userMessage = getUserErrorMessage(dbError);
      expect(userMessage).toContain('temporarily unavailable');
    });

    it('should classify security errors correctly', () => {
      const securityError = new Error('Unauthorized access - security violation');
      const errorKey = trackError(securityError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('SECURITY_ERROR');
      
      const userMessage = getUserErrorMessage(securityError);
      expect(userMessage).toContain('Security issue detected');
    });

    it('should handle unknown errors with fallback', () => {
      const unknownError = new Error('Some completely random error message');
      const errorKey = trackError(unknownError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('UNKNOWN_ERROR');
      
      const userMessage = getUserErrorMessage(unknownError);
      expect(userMessage).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Error Statistics', () => {
    it('should track error counts correctly', () => {
      const error1 = new Error('Network timeout');
      const error2 = new Error('Validation failed');
      const error3 = new Error('Network timeout'); // Duplicate
      
      trackError(error1, { component: 'Component1' });
      trackError(error2, { component: 'Component2' });
      trackError(error3, { component: 'Component1' }); // Same component, same error type
      
      const stats = getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType['NETWORK_ERROR']).toBe(2);
      expect(stats.byType['VALIDATION_ERROR']).toBe(1);
      expect(stats.byCategory['network']).toBe(2);
      expect(stats.byCategory['user']).toBe(1);
    });

    it('should track recent errors', () => {
      const error = new Error('Test error');
      trackError(error, { component: 'TestComponent' });
      
      const stats = getErrorStats();
      
      expect(stats.recentErrors).toHaveLength(1);
      expect(stats.recentErrors[0].type).toBe('UNKNOWN_ERROR');
      expect(stats.recentErrors[0].count).toBe(1);
    });

    it('should clear error history', () => {
      const error = new Error('Test error');
      trackError(error, { component: 'TestComponent' });
      
      let stats = getErrorStats();
      expect(stats.total).toBe(1);
      
      errorTracker.clearErrorHistory();
      
      stats = getErrorStats();
      expect(stats.total).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });
  });

  describe('Error Suppression', () => {
    it('should suppress frequently occurring errors', () => {
      const error = new Error('Network timeout');
      const context = { component: 'TestComponent', action: 'test_action' };
      
      // Generate multiple occurrences of the same error
      for (let i = 0; i < 12; i++) {
        trackError(error, context);
      }
      
      const stats = getErrorStats();
      
      // Should have suppressed some errors after hitting the threshold
      expect(stats.total).toBeLessThan(12);
    });

    it('should not suppress different error types', () => {
      const networkError = new Error('Network timeout');
      const validationError = new Error('Validation failed');
      
      for (let i = 0; i < 6; i++) {
        trackError(networkError, { component: 'TestComponent' });
        trackError(validationError, { component: 'TestComponent' });
      }
      
      const stats = getErrorStats();
      
      expect(stats.byType['NETWORK_ERROR']).toBeGreaterThan(0);
      expect(stats.byType['VALIDATION_ERROR']).toBeGreaterThan(0);
    });
  });

  describe('Error Context Creation', () => {
    it('should create error with context', () => {
      const error = createErrorWithContext(
        'Test error message',
        'TEST_CODE',
        400,
        { component: 'TestComponent', userId: 'user123' }
      );
      
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({
        component: 'TestComponent',
        userId: 'user123'
      });
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Async Function Wrapping', () => {
    it('should track errors from wrapped async functions', async () => {
      const failingFunction = async () => {
        throw new Error('Async function failed');
      };
      
      const wrappedFunction = errorTracker.wrapAsync(
        failingFunction,
        { component: 'TestComponent' }
      );
      
      await expect(wrappedFunction()).rejects.toThrow('Async function failed');
      
      const stats = getErrorStats();
      expect(stats.total).toBe(1);
    });

    it('should not interfere with successful async functions', async () => {
      const successfulFunction = async (value: string) => {
        return `Success: ${value}`;
      };
      
      const wrappedFunction = errorTracker.wrapAsync(
        successfulFunction,
        { component: 'TestComponent' }
      );
      
      const result = await wrappedFunction('test');
      expect(result).toBe('Success: test');
      
      const stats = getErrorStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry functions with exponential backoff', async () => {
      let attemptCount = 0;
      const flakyFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const retriedFunction = errorTracker.withRetry(
        flakyFunction,
        {
          maxAttempts: 3,
          backoffMs: 10,
          backoffMultiplier: 2
        },
        { component: 'TestComponent' }
      );
      
      const result = await retriedFunction();
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max attempts', async () => {
      const alwaysFailFunction = async () => {
        throw new Error('Always fails');
      };
      
      const retriedFunction = errorTracker.withRetry(
        alwaysFailFunction,
        {
          maxAttempts: 2,
          backoffMs: 10,
          backoffMultiplier: 2
        },
        { component: 'TestComponent' }
      );
      
      await expect(retriedFunction()).rejects.toThrow('Always fails');
      
      const stats = getErrorStats();
      expect(stats.total).toBe(1); // Only final error should be tracked
    });

    it('should respect retry conditions', async () => {
      let attemptCount = 0;
      const conditionalFailFunction = async () => {
        attemptCount++;
        if (attemptCount === 1) {
          const error = new Error('Retryable error') as any;
          error.retryable = true;
          throw error;
        } else {
          const error = new Error('Non-retryable error') as any;
          error.retryable = false;
          throw error;
        }
      };
      
      const retriedFunction = errorTracker.withRetry(
        conditionalFailFunction,
        {
          maxAttempts: 3,
          backoffMs: 10,
          backoffMultiplier: 2,
          retryCondition: (error: any) => error.retryable
        },
        { component: 'TestComponent' }
      );
      
      await expect(retriedFunction()).rejects.toThrow('Non-retryable error');
      expect(attemptCount).toBe(2); // Should have retried once, then failed on non-retryable
    });
  });

  describe('String Errors', () => {
    it('should handle string errors', () => {
      const stringError = 'This is a string error';
      const errorKey = trackError(stringError, { component: 'TestComponent' });
      
      expect(errorKey).toContain('UNKNOWN_ERROR');
      
      const userMessage = getUserErrorMessage(stringError);
      expect(userMessage).toBe('An unexpected error occurred. Please try again.');
      
      const stats = getErrorStats();
      expect(stats.total).toBe(1);
    });
  });

  describe('Auto-retry Events', () => {
    it('should emit retry events for auto-retry errors', (done) => {
      // Mock window and event listener
      const mockWindow = {
        dispatchEvent: vi.fn(),
        addEventListener: vi.fn()
      };
      
      (global as any).window = mockWindow;
      
      const networkError = new Error('Network timeout - should auto retry');
      trackError(networkError, { component: 'TestComponent' });
      
      // Wait for retry to be scheduled
      setTimeout(() => {
        expect(mockWindow.dispatchEvent).toHaveBeenCalled();
        done();
      }, 1100); // Wait longer than 1 second retry delay
    }, 2000);
  });
});

describe('Global Error Handlers', () => {
  beforeEach(() => {
    // Reset window mock
    delete (global as any).window;
  });

  it('should setup global error handlers when window is available', () => {
    const mockWindow = {
      addEventListener: vi.fn()
    };
    
    (global as any).window = mockWindow;
    
    // Import fresh instance to trigger constructor
    const freshErrorTracker = new ErrorTracker();
    
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should not setup global handlers when window is not available', () => {
    // Ensure window is undefined
    expect(typeof window).toBe('undefined');
    
    // Should not throw error
    expect(() => new ErrorTracker()).not.toThrow();
  });
});