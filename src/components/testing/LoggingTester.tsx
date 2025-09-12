/**
 * Interactive Logging System Tester
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Interactive testing interface for logging systems
 */

import React, { useState, useEffect } from 'react';
import { logger, createLogger } from '../../lib/logging/logger';
import { trackError, getUserErrorMessage, getErrorStats, type ErrorStats } from '../../lib/logging/error-tracker';
import { performanceMonitor, recordMetric, startTiming, endTiming, getPerformanceStats } from '../../lib/logging/performance-monitor';
import ErrorBoundary from '../common/ErrorBoundary';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  component?: string;
  duration?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: unknown;
  duration?: number;
}

const LoggingTester: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [performanceStats, setPerformanceStats] = useState<unknown>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [remoteLoggingEnabled, setRemoteLoggingEnabled] = useState(false);

  const componentLogger = createLogger('LoggingTester');

  useEffect(() => {
    // Initialize logging tester
    componentLogger.info('Logging tester component initialized');
    
    // Check remote logging status
    setRemoteLoggingEnabled(process.env.ENABLE_REMOTE_LOGGING === 'true');

    // Update stats periodically
    const updateStats = () => {
      try {
        const errStats = getErrorStats();
        const perfStats = getPerformanceStats();
        setErrorStats(errStats);
        setPerformanceStats(perfStats);
      } catch (error) {
        console.warn('Failed to update stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Add log entry to display
   */
  const addLogEntry = (level: LogEntry['level'], message: string, component?: string, duration?: number) => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      component,
      duration
    };

    setLogs(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  /**
   * Test basic logging functionality
   */
  const testBasicLogging = async () => {
    setActiveTest('basic-logging');
    const startTime = performance.now();
    
    try {
      // Test different log levels
      componentLogger.debug('Debug message test');
      addLogEntry('debug', 'Debug message test', 'LoggingTester');

      componentLogger.info('Info message test');
      addLogEntry('info', 'Info message test', 'LoggingTester');

      componentLogger.warn('Warning message test');
      addLogEntry('warn', 'Warning message test', 'LoggingTester');

      // Test performance logging
      startTiming('test_operation');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
      const duration = endTiming('test_operation');
      addLogEntry('info', `Performance test completed (${duration.toFixed(2)}ms)`, 'LoggingTester', duration);

      const totalDuration = performance.now() - startTime;
      const result: TestResult = {
        success: true,
        message: 'Basic logging test completed successfully',
        duration: totalDuration,
        details: {
          logsGenerated: 4,
          performanceTracked: true
        }
      };

      setTestResults(prev => [result, ...prev]);
      addLogEntry('info', 'Basic logging test completed', 'LoggingTester', totalDuration);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Basic logging test failed',
        details: { error: (error as Error).message }
      };
      setTestResults(prev => [result, ...prev]);
      addLogEntry('error', 'Basic logging test failed', 'LoggingTester');
    } finally {
      setActiveTest(null);
    }
  };

  /**
   * Test error tracking and classification
   */
  const testErrorTracking = async () => {
    setActiveTest('error-tracking');
    const startTime = performance.now();
    
    try {
      // Test different error types
      const errors = [
        new Error('Network timeout - connection failed'),
        new Error('Validation failed: invalid ZIP code format'),
        new Error('Database connection pool exhausted'),
        new Error('Cache miss - Redis connection failed'),
        new Error('Unauthorized access - security violation detected')
      ];

      for (const error of errors) {
        const errorKey = trackError(error, {
          component: 'LoggingTester',
          action: 'test_error_tracking'
        });
        
        const userMessage = getUserErrorMessage(error);
        addLogEntry('error', `${error.message} -> ${userMessage}`, 'ErrorTracker');
        
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between errors
      }

      const totalDuration = performance.now() - startTime;
      const result: TestResult = {
        success: true,
        message: 'Error tracking test completed successfully',
        duration: totalDuration,
        details: {
          errorsProcessed: errors.length,
          classification: 'automatic',
          userMessages: 'generated'
        }
      };

      setTestResults(prev => [result, ...prev]);
      addLogEntry('info', 'Error tracking test completed', 'LoggingTester', totalDuration);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Error tracking test failed',
        details: { error: (error as Error).message }
      };
      setTestResults(prev => [result, ...prev]);
      addLogEntry('error', 'Error tracking test failed', 'LoggingTester');
    } finally {
      setActiveTest(null);
    }
  };

  /**
   * Test performance monitoring
   */
  const testPerformanceMonitoring = async () => {
    setActiveTest('performance-monitoring');
    const startTime = performance.now();
    
    try {
      // Test various performance metrics
      recordMetric('test_custom_metric', 150, 'ms', { test: 'true' });
      addLogEntry('info', 'Custom metric recorded: test_custom_metric = 150ms', 'PerformanceMonitor');

      recordMetric('test_memory_metric', 1024 * 1024 * 5, 'bytes', { type: 'memory' });
      addLogEntry('info', 'Memory metric recorded: test_memory_metric = 5MB', 'PerformanceMonitor');

      // Test timing measurement
      startTiming('async_operation_test');
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate async work
      const asyncDuration = endTiming('async_operation_test');
      addLogEntry('info', `Async operation timed: ${asyncDuration.toFixed(2)}ms`, 'PerformanceMonitor', asyncDuration);

      // Test memory measurement
      if (performanceMonitor) {
        const memoryMetric = performanceMonitor.measureMemory();
        if (memoryMetric) {
          addLogEntry('info', `Memory usage: ${(memoryMetric.heapUsed / 1024 / 1024).toFixed(1)}MB`, 'PerformanceMonitor');
        }
      }

      const totalDuration = performance.now() - startTime;
      const result: TestResult = {
        success: true,
        message: 'Performance monitoring test completed successfully',
        duration: totalDuration,
        details: {
          metricsRecorded: 3,
          timingMeasured: true,
          memoryTracked: true
        }
      };

      setTestResults(prev => [result, ...prev]);
      addLogEntry('info', 'Performance monitoring test completed', 'LoggingTester', totalDuration);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Performance monitoring test failed',
        details: { error: (error as Error).message }
      };
      setTestResults(prev => [result, ...prev]);
      addLogEntry('error', 'Performance monitoring test failed', 'LoggingTester');
    } finally {
      setActiveTest(null);
    }
  };

  /**
   * Test API logging endpoints
   */
  const testApiLogging = async () => {
    setActiveTest('api-logging');
    const startTime = performance.now();
    
    try {
      // Test error logging API
      const errorPayload = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Test API error logging',
        context: {
          component: 'LoggingTester',
          action: 'test_api_logging',
          sessionId: 'test_session_123'
        }
      };

      const errorResponse = await fetch('/api/logging/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorPayload)
      });

      const errorResult = await errorResponse.json();
      addLogEntry('info', `Error API test: ${errorResult.success ? 'Success' : 'Failed'}`, 'APITest');

      // Test performance logging API
      const perfPayload = {
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        coreWebVitals: {
          FCP: 1200,
          LCP: 2400,
          FID: 50,
          CLS: 0.05
        },
        customMetrics: [
          { name: 'test_api_metric', value: 300, unit: 'ms' }
        ]
      };

      const perfResponse = await fetch('/api/logging/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfPayload)
      });

      const perfResult = await perfResponse.json();
      addLogEntry('info', `Performance API test: ${perfResult.success ? 'Success' : 'Failed'}`, 'APITest');

      const totalDuration = performance.now() - startTime;
      const result: TestResult = {
        success: errorResult.success && perfResult.success,
        message: 'API logging test completed',
        duration: totalDuration,
        details: {
          errorApi: errorResult.success,
          performanceApi: perfResult.success,
          errorId: errorResult.errorId,
          reportId: perfResult.reportId
        }
      };

      setTestResults(prev => [result, ...prev]);
      addLogEntry('info', 'API logging test completed', 'LoggingTester', totalDuration);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'API logging test failed',
        details: { error: (error as Error).message }
      };
      setTestResults(prev => [result, ...prev]);
      addLogEntry('error', 'API logging test failed', 'LoggingTester');
    } finally {
      setActiveTest(null);
    }
  };

  /**
   * Test error boundary integration
   */
  const testErrorBoundary = () => {
    setActiveTest('error-boundary');
    addLogEntry('warn', 'Testing error boundary (this will trigger an error)', 'LoggingTester');
    
    // This will trigger the error boundary
    throw new Error('Test error boundary - this is intentional');
  };

  /**
   * Clear all logs
   */
  const clearLogs = () => {
    setLogs([]);
    addLogEntry('info', 'Logs cleared', 'LoggingTester');
  };

  /**
   * Clear test results
   */
  const clearTestResults = () => {
    setTestResults([]);
    addLogEntry('info', 'Test results cleared', 'LoggingTester');
  };

  return (
    <div className="space-y-8">
      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={testBasicLogging}
          disabled={activeTest === 'basic-logging'}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activeTest === 'basic-logging' ? 'Testing...' : 'Test Basic Logging'}
        </button>

        <button
          onClick={testErrorTracking}
          disabled={activeTest === 'error-tracking'}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-texas-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activeTest === 'error-tracking' ? 'Testing...' : 'Test Error Tracking'}
        </button>

        <button
          onClick={testPerformanceMonitoring}
          disabled={activeTest === 'performance-monitoring'}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activeTest === 'performance-monitoring' ? 'Testing...' : 'Test Performance'}
        </button>

        <button
          onClick={testApiLogging}
          disabled={activeTest === 'api-logging'}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activeTest === 'api-logging' ? 'Testing...' : 'Test API Logging'}
        </button>
      </div>

      {/* Error Boundary Test */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Error Boundary Test</h4>
        <p className="text-yellow-700 text-sm mb-3">
          This test will intentionally trigger an error to test the error boundary component.
        </p>
        <ErrorBoundary name="LoggingTesterErrorBoundary" level="component">
          <button
            onClick={testErrorBoundary}
            disabled={activeTest === 'error-boundary'}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {activeTest === 'error-boundary' ? 'Triggering Error...' : 'Test Error Boundary'}
          </button>
        </ErrorBoundary>
      </div>

      {/* Statistics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Error Statistics */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📊 Error Statistics</h4>
          {errorStats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Errors:</span>
                <span className="font-medium">{errorStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Error Categories:</span>
                <span className="font-medium">{Object.keys(errorStats.byCategory).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Recent Errors:</span>
                <span className="font-medium">{errorStats.recentErrors.length}</span>
              </div>
              {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex justify-between">
                  <span className="capitalize">{severity} Errors:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading error statistics...</p>
          )}
        </div>

        {/* Performance Statistics */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">⚡ Performance Statistics</h4>
          {performanceStats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Metrics:</span>
                <span className="font-medium">{performanceStats.totalMetrics}</span>
              </div>
              <div className="flex justify-between">
                <span>Recent Metrics:</span>
                <span className="font-medium">{performanceStats.recentMetrics}</span>
              </div>
              {performanceStats.coreWebVitals && Object.entries(performanceStats.coreWebVitals).map(([metric, value]) => (
                <div key={metric} className="flex justify-between">
                  <span>{metric}:</span>
                  <span className="font-medium">
                    {typeof value === 'number' ? `${value.toFixed(metric === 'CLS' ? 3 : 0)}${metric === 'CLS' ? '' : 'ms'}` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading performance statistics...</p>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">🧪 Test Results</h4>
            <button
              onClick={clearTestResults}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Results
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-texas-red/10 border-texas-red/30 text-texas-red-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{result.message}</span>
                  {result.duration && (
                    <span className="text-xs">
                      {result.duration.toFixed(2)}ms
                    </span>
                  )}
                </div>
                {result.details && (
                  <pre className="text-xs mt-2 opacity-75 overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Logs Display */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-green-300">📋 Live Logs</h4>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Clear Logs
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run a test to see logs appear here.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  log.level === 'info' ? 'text-blue-400' :
                  log.level === 'debug' ? 'text-gray-400' :
                  'text-texas-red'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                {log.component && (
                  <span className="text-purple-400">[{log.component}]</span>
                )}
                <span className="flex-1">{log.message}</span>
                {log.duration && (
                  <span className="text-cyan-400">({log.duration.toFixed(2)}ms)</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-texas-navy/10 border border-texas-navy/30 rounded-lg p-4">
        <h4 className="font-semibold text-texas-navy-800 mb-2">ℹ️ Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-texas-navy-700">Environment:</span>
            <span className="ml-2 font-medium">{import.meta.env.MODE}</span>
          </div>
          <div>
            <span className="text-texas-navy-700">Remote Logging:</span>
            <span className="ml-2 font-medium">{remoteLoggingEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <span className="text-texas-navy-700">Log Level:</span>
            <span className="ml-2 font-medium">{import.meta.env.MODE === 'development' ? 'debug' : 'warn'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingTester;