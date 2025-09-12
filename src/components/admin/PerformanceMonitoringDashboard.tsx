/**
 * Performance Monitoring Dashboard Component
 * Task T030: Real-time performance monitoring interface for administrators
 * Phase 3.4 Enhancement: Comprehensive system health visualization
 */

import React, { useState, useEffect, useCallback } from 'react';

interface SystemHealth {
  uptime: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorDistribution: Record<string, number>;
  topErrorZIPs: Array<{ zipCode: string; errorCount: number; lastError: string }>;
  performanceByRegion: Record<string, {
    requestCount: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  alertsSummary: {
    active: number;
    resolved: number;
    critical: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: Record<string, number>;
  timestamp: string;
  resolved?: boolean;
}

interface OptimizationRecommendation {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string[];
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'recommendations' | 'cache'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [cacheAnalysis, setCacheAnalysis] = useState<unknown>(null);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/performance?action=health');
      const data = await response.json();
      if (data.success) {
        setSystemHealth(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/performance?action=alerts');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/performance?action=recommendations');
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  const fetchCacheAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/performance?action=cache');
      const data = await response.json();
      if (data.success) {
        setCacheAnalysis(data.data);
      }
    } catch (error) {
      console.error('Error fetching cache analysis:', error);
    }
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alertId })
      });
      
      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSystemHealth(),
        fetchAlerts(),
        fetchRecommendations(),
        fetchCacheAnalysis()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchSystemHealth, fetchAlerts, fetchRecommendations, fetchCacheAnalysis]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await fetchSystemHealth();
      if (selectedTab === 'alerts') {
        await fetchAlerts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedTab, fetchSystemHealth, fetchAlerts]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-texas-red';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-texas-red-800 border-texas-red/30';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-texas-navy-800 border-texas-navy/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-texas-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-texas-navy">Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time system health and performance metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth.successRate, { good: 95, warning: 90 })}`}>
                  {systemHealth.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-texas-navy" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className={`text-2xl font-bold ${getHealthColor(300 - systemHealth.averageResponseTime, { good: 200, warning: 100 })}`}>
                  {systemHealth.averageResponseTime}ms
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth.cacheHitRate, { good: 80, warning: 60 })}`}>
                  {systemHealth.cacheHitRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'alerts', label: `Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}` },
            { id: 'recommendations', label: `Recommendations ${recommendations.length > 0 ? `(${recommendations.length})` : ''}` },
            { id: 'cache', label: 'Cache Analysis' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as unknown)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-texas-red text-texas-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && systemHealth && (
        <div className="space-y-6">
          {/* Performance by Region */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Region</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(systemHealth.performanceByRegion).map(([region, stats]) => (
                <div key={region} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{region}</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="text-gray-600">{stats.requestCount.toLocaleString()} requests</div>
                    <div className={getHealthColor(300 - stats.averageResponseTime, { good: 200, warning: 100 })}>
                      {stats.averageResponseTime}ms avg
                    </div>
                    <div className={getHealthColor(stats.successRate, { good: 95, warning: 90 })}>
                      {stats.successRate}% success
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Requests</span>
                  <span className="font-semibold">{systemHealth.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Alerts</span>
                  <span className={`font-semibold ${systemHealth.alertsSummary.active > 0 ? 'text-texas-red' : 'text-green-600'}`}>
                    {systemHealth.alertsSummary.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Critical Alerts</span>
                  <span className={`font-semibold ${systemHealth.alertsSummary.critical > 0 ? 'text-texas-red' : 'text-green-600'}`}>
                    {systemHealth.alertsSummary.critical}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.open('/api/monitoring/performance?action=export&format=JSON', '_blank')}
                  className="w-full px-4 py-2 bg-texas-navy text-white rounded-lg hover:bg-texas-navy-800 transition-colors"
                >
                  Export Performance Data
                </button>
                <button 
                  onClick={async () => {
                    await fetchSystemHealth();
                    await fetchAlerts();
                    setLastUpdated(new Date());
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-green-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800 mb-2">All Clear!</h3>
              <p className="text-green-600">No active performance alerts at this time.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`rounded-xl border p-6 ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/50">
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{alert.type}</h4>
                    <p className="mb-4">{alert.message}</p>
                    {Object.keys(alert.metrics).length > 0 && (
                      <div className="text-sm bg-white/30 rounded-lg p-3">
                        <strong>Metrics:</strong>
                        <ul className="mt-1">
                          {Object.entries(alert.metrics).map(([key, value]) => (
                            <li key={key}>• {key}: {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-4 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="bg-texas-navy/10 border border-texas-navy/30 rounded-xl p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-texas-navy-800 mb-2">System Optimized</h3>
              <p className="text-texas-navy">No performance optimization recommendations at this time.</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    rec.priority === 'HIGH' ? 'bg-red-100 text-texas-red-800' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{rec.title}</h4>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <div className="mb-4">
                      <span className="text-sm font-medium text-green-600">Expected Impact: </span>
                      <span className="text-sm text-gray-600">{rec.expectedImpact}</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-800 mb-2">Implementation Steps:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.implementation.map((step, i) => (
                          <li key={i}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'cache' && cacheAnalysis && (
        <div className="space-y-6">
          {/* Cache Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {cacheAnalysis.overview.hitRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Hit Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {cacheAnalysis.overview.averageHitResponseTime}ms
                </div>
                <div className="text-sm text-gray-600 mt-1">Cache Hit Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {cacheAnalysis.overview.averageMissResponseTime}ms
                </div>
                <div className="text-sm text-gray-600 mt-1">Cache Miss Response</div>
              </div>
            </div>
          </div>

          {/* Hot and Cold ZIPs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Most Cached ZIPs (Hot)</h4>
              <div className="space-y-3">
                {cacheAnalysis.hotZIPs.map((zip: unknown, index: number) => (
                  <div key={zip.zipCode} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{zip.zipCode}</span>
                      <span className="text-sm text-gray-600 ml-2">({zip.hitCount} hits)</span>
                    </div>
                    <span className="text-sm text-green-600">{zip.avgResponseTime}ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Cache Misses (Cold)</h4>
              <div className="space-y-3">
                {cacheAnalysis.coldZIPs.map((zip: unknown, index: number) => (
                  <div key={zip.zipCode} className="flex justify-between items-center p-3 bg-texas-red/10 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{zip.zipCode}</span>
                      <span className="text-sm text-gray-600 ml-2">({zip.missCount} misses)</span>
                    </div>
                    <span className="text-sm text-texas-red">{zip.avgResponseTime}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cache Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Cache Optimization Recommendations</h4>
            <ul className="space-y-2">
              {cacheAnalysis.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-texas-navy mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};