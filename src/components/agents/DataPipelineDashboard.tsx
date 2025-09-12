/**
 * Data Pipeline Dashboard - React component for monitoring LangGraph data pipeline
 */

import React, { useState, useEffect, useRef } from 'react';
import { dataPipelineAgent } from '../../lib/agents/data-pipeline-agent';

interface PipelineConfig {
  maxCities: number;
  batchSize: number;
  batchDelayMs: number;
  maxRetries: number;
  useCachedData: boolean;
  forceRebuild: boolean;
  tierPriority?: 'high' | 'medium' | 'low';
  concurrentBatches: number;
  healthCheckInterval: number;
}

interface PipelineStatus {
  isRunning: boolean;
  currentPhase: string;
  totalCities: number;
  completed: number;
  failed: number;
  percentComplete: number;
  throughput: number;
  estimatedTimeRemaining: number;
  lastUpdate: Date;
}

interface DataPipelineDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DataPipelineDashboard: React.FC<DataPipelineDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const [config, setConfig] = useState<PipelineConfig>({
    maxCities: 881,
    batchSize: 10,
    batchDelayMs: 2000,
    maxRetries: 3,
    useCachedData: true,
    forceRebuild: false,
    tierPriority: 'high',
    concurrentBatches: 1,
    healthCheckInterval: 30000,
  });

  const [status, setStatus] = useState<PipelineStatus>({
    isRunning: false,
    currentPhase: 'idle',
    totalCities: 0,
    completed: 0,
    failed: 0,
    percentComplete: 0,
    throughput: 0,
    estimatedTimeRemaining: 0,
    lastUpdate: new Date(),
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamController, setStreamController] = useState<AbortController | null>(null);
  const [lastRunResult, setLastRunResult] = useState<unknown>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoRefresh && !status.isRunning) {
      const interval = setInterval(() => {
        setStatus(prev => ({ ...prev, lastUpdate: new Date() }));
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, status.isRunning]);

  useEffect(() => {
    scrollLogsToBottom();
  }, [logs]);

  const scrollLogsToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
  };

  const handleStartPipeline = async () => {
    if (status.isRunning) return;

    setStatus(prev => ({
      ...prev,
      isRunning: true,
      currentPhase: 'initializing',
      completed: 0,
      failed: 0,
      percentComplete: 0,
    }));

    addLog(`Starting data pipeline with config: ${JSON.stringify(config)}`, 'info');

    try {
      const result = await dataPipelineAgent.runPipeline(config);
      
      setLastRunResult(result);
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: result.success ? 'complete' : 'error',
        completed: result.completedCities,
        failed: result.failedCities,
        percentComplete: 100,
        lastUpdate: new Date(),
      }));

      addLog(`Pipeline completed: ${result.completedCities} cities processed, ${result.failedCities} failed`, result.success ? 'success' : 'warning');
      addLog(result.report, 'info');
    } catch (error) {
      addLog(`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: 'error',
        lastUpdate: new Date(),
      }));
    }
  };

  const handleStreamPipeline = async () => {
    if (isStreaming) {
      // Stop streaming
      streamController?.abort();
      setIsStreaming(false);
      setStreamController(null);
      addLog('Pipeline streaming stopped by user', 'info');
      return;
    }

    setIsStreaming(true);
    const controller = new AbortController();
    setStreamController(controller);

    setStatus(prev => ({
      ...prev,
      isRunning: true,
      currentPhase: 'initializing',
      completed: 0,
      failed: 0,
      percentComplete: 0,
    }));

    addLog(`Starting streaming pipeline with config: ${JSON.stringify(config)}`, 'info');

    try {
      const stream = await dataPipelineAgent.streamPipeline(config);
      
      for await (const update of stream) {
        if (controller.signal.aborted) break;

        // Update status based on stream update
        setStatus(prev => ({
          ...prev,
          currentPhase: update.progress?.currentPhase || prev.currentPhase,
          totalCities: update.totalCities || prev.totalCities,
          completed: update.completedCities?.length || prev.completed,
          failed: update.failedCities?.length || prev.failed,
          percentComplete: update.progress?.percentComplete || prev.percentComplete,
          throughput: update.progress?.throughput || prev.throughput,
          estimatedTimeRemaining: update.progress?.estimatedTimeRemaining || prev.estimatedTimeRemaining,
          lastUpdate: new Date(),
        }));

        // Add relevant logs
        if (update.progress?.currentPhase) {
          addLog(`Phase: ${update.progress.currentPhase}`, 'info');
        }

        if (update.completedCities?.length > 0) {
          const latest = update.completedCities[update.completedCities.length - 1];
          addLog(`Completed: ${latest.citySlug} (${latest.plansCount} plans, ${latest.processingTime}ms)`, 'success');
        }

        if (update.failedCities?.length > 0) {
          const latest = update.failedCities[update.failedCities.length - 1];
          addLog(`Failed: ${latest.citySlug} - ${latest.error}`, 'error');
        }

        if (update.batchStatus) {
          addLog(`Batch ${update.batchStatus.currentBatchNumber}/${update.batchStatus.totalBatches} - Avg time: ${update.batchStatus.avgBatchTime}ms`, 'info');
        }
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        addLog(`Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    } finally {
      setIsStreaming(false);
      setStreamController(null);
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastUpdate: new Date(),
      }));
    }
  };

  const ConfigSection = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-texas-navy mb-4">Pipeline Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Cities</label>
          <input
            type="number"
            value={config.maxCities}
            onChange={(e) => setConfig(prev => ({ ...prev, maxCities: parseInt(e.target.value) || 881 }))}
            disabled={status.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
          <input
            type="number"
            value={config.batchSize}
            onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 10 }))}
            disabled={status.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Delay (ms)</label>
          <input
            type="number"
            value={config.batchDelayMs}
            onChange={(e) => setConfig(prev => ({ ...prev, batchDelayMs: parseInt(e.target.value) || 2000 }))}
            disabled={status.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
          <input
            type="number"
            value={config.maxRetries}
            onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
            disabled={status.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tier Priority</label>
          <select
            value={config.tierPriority || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, tierPriority: e.target.value as 'high' | 'medium' | 'low' | undefined }))}
            disabled={status.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          >
            <option value="">All cities</option>
            <option value="high">High (Top 50)</option>
            <option value="medium">Medium (Top 200)</option>
            <option value="low">Low (All 881)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concurrent Batches</label>
          <input
            type="number"
            value={config.concurrentBatches}
            onChange={(e) => setConfig(prev => ({ ...prev, concurrentBatches: parseInt(e.target.value) || 1 }))}
            disabled={status.isRunning}
            min="1"
            max="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.useCachedData}
            onChange={(e) => setConfig(prev => ({ ...prev, useCachedData: e.target.checked }))}
            disabled={status.isRunning}
            className="w-4 h-4 text-texas-red border-gray-300 rounded focus:ring-texas-red disabled:opacity-50"
          />
          <span className="text-sm font-medium text-gray-700">Use cached data when available</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.forceRebuild}
            onChange={(e) => setConfig(prev => ({ ...prev, forceRebuild: e.target.checked }))}
            disabled={status.isRunning}
            className="w-4 h-4 text-texas-red border-gray-300 rounded focus:ring-texas-red disabled:opacity-50"
          />
          <span className="text-sm font-medium text-gray-700">Force rebuild (ignore cache)</span>
        </label>
      </div>
    </div>
  );

  const StatusSection = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-texas-navy">Pipeline Status</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status.isRunning ? 'bg-blue-100 text-texas-navy-800' : 
          status.currentPhase === 'complete' ? 'bg-green-100 text-green-800' :
          status.currentPhase === 'error' ? 'bg-red-100 text-texas-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status.isRunning ? '🏃‍♂️ Running' : 
           status.currentPhase === 'complete' ? '✅ Complete' :
           status.currentPhase === 'error' ? '❌ Error' :
           '💤 Idle'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-navy">{status.totalCities}</div>
          <div className="text-sm text-gray-600">Total Cities</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{status.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-red">{status.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-navy">{status.throughput.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Cities/min</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{status.percentComplete}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-texas-red h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.percentComplete}%` }}
          ></div>
        </div>
      </div>

      {status.isRunning && status.estimatedTimeRemaining > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Estimated time remaining:</span> {Math.ceil(status.estimatedTimeRemaining)} minutes
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Last updated: {status.lastUpdate.toLocaleString()}
      </div>
    </div>
  );

  const ControlSection = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-texas-navy mb-4">Pipeline Controls</h3>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleStartPipeline}
          disabled={status.isRunning || isStreaming}
          className="px-4 py-2 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🚀 Start Pipeline
        </button>

        <button
          onClick={handleStreamPipeline}
          disabled={status.isRunning && !isStreaming}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isStreaming 
              ? 'bg-red-600 text-white hover:bg-texas-red-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isStreaming ? '⏹️ Stop Stream' : '📡 Stream Pipeline'}
        </button>

        <button
          onClick={() => {
            setLogs([]);
            addLog('Logs cleared', 'info');
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🧹 Clear Logs
        </button>

        <button
          onClick={() => {
            const configStr = JSON.stringify(config, null, 2);
            navigator.clipboard.writeText(configStr);
            addLog('Configuration copied to clipboard', 'info');
          }}
          className="px-4 py-2 bg-texas-gold text-white rounded-lg hover:bg-texas-gold-600 transition-colors"
        >
          📋 Copy Config
        </button>
      </div>

      {lastRunResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Last Run Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Status: <span className={lastRunResult.success ? 'text-green-600' : 'text-texas-red'}>
              {lastRunResult.success ? 'Success' : 'Failed'}
            </span></div>
            <div>Cities Completed: <span className="font-medium">{lastRunResult.completedCities}</span></div>
            <div>Cities Failed: <span className="font-medium">{lastRunResult.failedCities}</span></div>
            <div>Total Time: <span className="font-medium">{Math.round(lastRunResult.totalTime / 1000)} seconds</span></div>
          </div>
        </div>
      )}
    </div>
  );

  const LogsSection = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-texas-navy">Pipeline Logs</h3>
        <div className="text-sm text-gray-500">{logs.length} entries</div>
      </div>
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Start a pipeline to see activity...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 break-all">
              {log}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );

  return (
    <div className={`data-pipeline-dashboard ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-texas-navy mb-2">
          🤖 LangGraph Data Pipeline Dashboard
        </h2>
        <p className="text-gray-700">
          Monitor and control the intelligent data generation pipeline for {config.maxCities} Texas cities.
          Powered by LangGraph workflow orchestration with fault tolerance and smart retry logic.
        </p>
      </div>

      <ConfigSection />
      <StatusSection />
      <ControlSection />
      <LogsSection />
    </div>
  );
};

export default DataPipelineDashboard;