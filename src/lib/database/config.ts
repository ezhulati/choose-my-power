/**
 * Database Configuration for Netlify Neon Integration
 * Handles connection setup and environment variable management
 */

import { neon } from '@netlify/neon';

interface DatabaseConfig {
  url: string;
  unpooledUrl: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.NETLIFY_DATABASE_URL || import.meta.env.NETLIFY_DATABASE_URL;
  const unpooledUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED || import.meta.env.NETLIFY_DATABASE_URL_UNPOOLED;

  if (!url || !unpooledUrl) {
    throw new Error('Database environment variables not found. Please set NETLIFY_DATABASE_URL and NETLIFY_DATABASE_URL_UNPOOLED');
  }

  return {
    url,
    unpooledUrl,
    maxConnections: 10,
    connectionTimeout: 10000, // 10 seconds
    queryTimeout: 30000, // 30 seconds
  };
}

/**
 * Create database connection using Netlify Neon
 * Uses pooled connection for better performance
 */
export function createDatabaseConnection() {
  const config = getDatabaseConfig();
  
  try {
    // Use pooled connection for better performance
    const sql = neon(config.url);
    return sql;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

/**
 * Create unpooled database connection for migrations and admin tasks
 */
export function createUnpooledDatabaseConnection() {
  const config = getDatabaseConfig();
  
  try {
    const sql = neon(config.unpooledUrl);
    return sql;
  } catch (error) {
    console.error('Failed to create unpooled database connection:', error);
    throw error;
  }
}

/**
 * Test database connectivity
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const sql = createDatabaseConnection();
    await sql`SELECT 1 as test`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Database connection singleton
 */
let dbInstance: ReturnType<typeof neon> | null = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
  }
  return dbInstance;
}

/**
 * Database health check for monitoring
 */
export async function getDatabaseHealth() {
  try {
    const sql = getDatabase();
    const start = Date.now();
    await sql`SELECT 1 as health_check`;
    const duration = Date.now() - start;
    
    return {
      healthy: true,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}