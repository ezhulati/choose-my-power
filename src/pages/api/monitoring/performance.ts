/**
 * Performance Monitoring API Endpoint
 * Task T030: Comprehensive performance monitoring dashboard API
 * Phase 3.4 Enhancement: Real-time performance metrics and alerting
 */

import type { APIRoute } from 'astro';
import { zipPerformanceMonitoringService } from '../../../lib/services/zip-performance-monitoring-service';

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = Date.now();

  try {
    const searchParams = url.searchParams;
    const action = searchParams.get('action') || 'health';
    const format = searchParams.get('format') || 'json';

    switch (action) {
      case 'health': {
        const systemHealth = await zipPerformanceMonitoringService.getSystemHealth();
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: systemHealth,
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Response-Time': `${responseTime}ms`,
            'X-API-Version': '1.0'
          }
        });
      }

      case 'trends': {
        const hours = parseInt(searchParams.get('hours') || '24');
        const trends = zipPerformanceMonitoringService.getPerformanceTrends(hours);
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: {
            trends,
            timeframe: `${hours} hours`,
            dataPoints: trends.length
          },
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      case 'alerts': {
        const alerts = zipPerformanceMonitoringService.getActiveAlerts();
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: {
            alerts,
            totalActive: alerts.length,
            critical: alerts.filter(a => a.severity === 'CRITICAL').length,
            high: alerts.filter(a => a.severity === 'HIGH').length
          },
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      case 'recommendations': {
        const recommendations = await zipPerformanceMonitoringService.getOptimizationRecommendations();
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: recommendations,
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=1800', // Cache for 30 minutes
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      case 'cache': {
        const cacheAnalysis = await zipPerformanceMonitoringService.getCacheAnalysis();
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: cacheAnalysis,
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=600', // Cache for 10 minutes
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      case 'export': {
        const exportFormat = (searchParams.get('format') || 'JSON').toUpperCase() as 'JSON' | 'CSV';
        const exportData = await zipPerformanceMonitoringService.exportPerformanceData(exportFormat);
        const responseTime = Date.now() - startTime;

        if (exportFormat === 'CSV') {
          return new Response(JSON.stringify({
            success: true,
            message: 'CSV export prepared',
            data: {
              exportId: exportData.exportId,
              recordCount: exportData.recordCount,
              downloadUrl: `/api/monitoring/download?id=${exportData.exportId}`
            },
            responseTime,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Response-Time': `${responseTime}ms`
            }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: exportData,
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="zip-performance-${exportData.exportId}.json"`,
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      default: {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
            supportedActions: ['health', 'trends', 'alerts', 'recommendations', 'cache', 'export']
          },
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      }
    }
  } catch (error) {
    console.error('[API] Performance monitoring error:', error);
    const responseTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'MONITORING_ERROR',
        message: 'Performance monitoring service temporarily unavailable',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      responseTime,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'resolve_alert': {
        const { alertId, resolution } = body;
        
        if (!alertId) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: 'MISSING_ALERT_ID',
              message: 'Alert ID is required'
            },
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const resolved = await zipPerformanceMonitoringService.resolveAlert(alertId, resolution);
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: resolved,
          data: {
            alertId,
            resolved,
            resolvedAt: resolved ? new Date().toISOString() : null
          },
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: resolved ? 200 : 404,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      case 'record_event': {
        const { event } = body;
        
        if (!event) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: 'MISSING_EVENT_DATA',
              message: 'Event data is required'
            },
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await zipPerformanceMonitoringService.recordPerformanceEvent(event);
        const responseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          message: 'Performance event recorded',
          responseTime,
          timestamp: new Date().toISOString()
        }), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${responseTime}ms`
          }
        });
      }

      default: {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
            supportedActions: ['resolve_alert', 'record_event']
          },
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      }
    }
  } catch (error) {
    console.error('[API] Performance monitoring POST error:', error);
    const responseTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'REQUEST_ERROR',
        message: 'Invalid request format',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      responseTime,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  }
};