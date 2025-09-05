/**
 * Database Health Check API
 * Verifies database connectivity and initialization status
 */

import type { APIRoute } from 'astro';
import { checkDatabaseHealth, initializeDatabase } from '../../../lib/database/init.ts';

export const GET: APIRoute = async () => {
  try {
    // Check database health first
    let healthStatus = await checkDatabaseHealth();
    
    // If database is not healthy, try to initialize
    if (!healthStatus.healthy) {
      console.log('🔧 Database not healthy, attempting initialization...');
      
      try {
        await initializeDatabase();
        healthStatus = await checkDatabaseHealth();
      } catch (initError) {
        console.error('Failed to initialize database:', initError);
      }
    }

    const responseData = {
      database: healthStatus,
      environment: {
        has_database_url: !!process.env.NETLIFY_DATABASE_URL,
        node_env: process.env.NODE_ENV,
        netlify_context: process.env.CONTEXT
      },
      timestamp: new Date().toISOString()
    };

    const status = healthStatus.healthy ? 200 : 500;

    console.log(`🏥 Database health check: ${healthStatus.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);

    return new Response(JSON.stringify(responseData, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    return new Response(JSON.stringify({
      database: {
        healthy: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};