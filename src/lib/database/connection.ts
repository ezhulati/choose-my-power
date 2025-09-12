import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Constitutional requirement: Use proper environment variable detection
const getDatabaseUrl = () => {
  // Prioritize Netlify database URL for production/staging
  if (process.env.NETLIFY_DATABASE_URL) {
    return process.env.NETLIFY_DATABASE_URL
  }
  
  // Fall back to standard DATABASE_URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  No DATABASE_URL found, using development defaults')
    return 'postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev'
  }
  
  throw new Error('DATABASE_URL is required. Please set NETLIFY_DATABASE_URL or DATABASE_URL environment variable.')
}

// Connection configuration
const connectionString = getDatabaseUrl()

// Configure postgres client with appropriate settings
const postgresClient = postgres(connectionString, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Idle timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  onnotice: process.env.NODE_ENV === 'development' ? console.warn : undefined,
})

// Initialize Drizzle with schema
export const db = drizzle(postgresClient, { schema })

// Connection health check utility
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    await postgresClient`SELECT 1 as health_check`
    const latency = Date.now() - startTime
    
    return {
      connected: true,
      latency
    }
  } catch (error) {
    console.error('[Database] Health check failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Connection pooling metrics
export async function getDatabaseMetrics() {
  try {
    const result = await postgresClient`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `
    
    return result[0]
  } catch (error) {
    console.error('[Database] Failed to get metrics:', error)
    return null
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await postgresClient.end()
    console.warn('[Database] Connection closed gracefully')
  } catch (error) {
    console.error('[Database] Error closing connection:', error)
  }
}

// Export postgres client for advanced queries if needed
export { postgresClient }

export default db