/**
 * Sitemap Auto-Update Webhook Endpoint
 * Handles notifications when pages are added, removed, or updated
 * Integrates with build systems and CMS for automatic sitemap updates
 */

import type { APIRoute } from 'astro';
import { handleSitemapWebhook } from '../../../lib/sitemap/auto-update-system';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.action || !body.urls || !Array.isArray(body.urls)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: action, urls'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate action type
    if (!['add', 'remove', 'update'].includes(body.action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action. Must be: add, remove, or update'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Process the webhook
    const result = await handleSitemapWebhook(
      body.action,
      body.urls,
      body.source || 'api'
    );

    return new Response(JSON.stringify({
      ...result,
      timestamp: new Date().toISOString(),
      processed_urls: body.urls.length
    }), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Sitemap webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Handle preflight requests for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
};

// Also handle GET for webhook status/info
export const GET: APIRoute = async () => {
  try {
    const { sitemapUpdater } = await import('../../../lib/sitemap/auto-update-system');
    const status = sitemapUpdater.getCacheStatus();
    const hourlyStats = sitemapUpdater.getUpdateStats('hour');
    const dailyStats = sitemapUpdater.getUpdateStats('day');

    return new Response(JSON.stringify({
      webhook_status: 'active',
      auto_update: 'enabled',
      cache_status: status,
      stats: {
        last_hour: hourlyStats,
        last_day: dailyStats
      },
      endpoints: {
        webhook: '/api/sitemap/webhook',
        xml: '/sitemap.xml',
        user_friendly: '/sitemap'
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Sitemap status error:', error);
    
    return new Response(JSON.stringify({
      webhook_status: 'error',
      error: 'Unable to retrieve status',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};