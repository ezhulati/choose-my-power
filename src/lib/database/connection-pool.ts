/**
 * Enterprise Database Connection Pool
 * Provides high-performance connection management with automatic failover
 * Supports read replicas and connection health monitoring
 */

import postgres from 'postgres';
import { createManagedCache } from '../utils/memory-manager';

interface ConnectionPoolConfig {
  // Primary database connection
  primary: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  // Read replica connections (optional)
  replicas?: Array<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    weight?: number; // Load balancing weight
  }>;
  // Pool settings
  pool: {
    min: number;
    max: number;
    idleTimeout: number; // milliseconds
    connectionTimeout: number; // milliseconds
    statementTimeout: number; // milliseconds
    maxLifetime: number; // milliseconds
  };
  // Performance settings
  performance: {
    preparedStatements: boolean;
    queryCache: boolean;
    queryTimeout: number; // milliseconds
    retryAttempts: number;
    retryDelay: number; // milliseconds
  };
  // Health monitoring
  monitoring: {
    healthCheckInterval: number; // milliseconds
    slowQueryThreshold: number; // milliseconds
    maxFailures: number; // Before marking connection as unhealthy
  };
}

interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ConnectionHealth {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  responseTime: number;
}

export class DatabaseConnectionPool {
  private primarySql: ReturnType<typeof postgres> | null = null;
  private replicaSqls: ReturnType<typeof postgres>[] = [];
  private replicaWeights: number[] = [];
  private connectionHealth = new Map<string, ConnectionHealth>();
  private queryCache = createManagedCache<unknown>('db-queries', 5 * 60 * 1000); // 5 minutes
  private stats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private config: ConnectionPoolConfig) {
    this.initializePrimaryConnection();
    this.initializeReplicaConnections();
    this.startHealthMonitoring();
  }

  /**
   * Initialize primary database connection
   */
  private initializePrimaryConnection(): void {
    try {
      this.primarySql = postgres({
        host: this.config.primary.host,
        port: this.config.primary.port,
        database: this.config.primary.database,
        username: this.config.primary.username,
        password: this.config.primary.password,
        
        // Connection pool settings
        max: this.config.pool.max,
        idle_timeout: this.config.pool.idleTimeout / 1000,
        connect_timeout: this.config.pool.connectionTimeout / 1000,
        
        // Performance settings
        prepare: this.config.performance.preparedStatements,
        transform: postgres.camel, // Convert to camelCase
        
        // Error handling
        onnotice: (notice) => {
          console.warn('PostgreSQL notice:', notice);
        },
        
        // Connection lifecycle
        connection: {
          application_name: 'choosemypower-pool-primary',
          search_path: 'public'
        }
      });

      this.connectionHealth.set('primary', {
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        responseTime: 0
      });

      console.warn('Primary database connection initialized');
    } catch (error) {
      console.error('Failed to initialize primary database connection:', error);
      this.connectionHealth.set('primary', {
        isHealthy: false,
        lastCheck: Date.now(),
        consecutiveFailures: 1,
        responseTime: 0
      });
    }
  }

  /**
   * Initialize read replica connections
   */
  private initializeReplicaConnections(): void {
    if (!this.config.replicas) return;

    for (let i = 0; i < this.config.replicas.length; i++) {
      const replica = this.config.replicas[i];
      const replicaId = `replica-${i}`;
      
      try {
        const replicaSql = postgres({
          host: replica.host,
          port: replica.port,
          database: replica.database,
          username: replica.username,
          password: replica.password,
          
          // Replica-specific settings (read-only optimizations)
          max: Math.floor(this.config.pool.max / 2), // Fewer connections per replica
          idle_timeout: this.config.pool.idleTimeout / 1000,
          connect_timeout: this.config.pool.connectionTimeout / 1000,
          
          prepare: this.config.performance.preparedStatements,
          transform: postgres.camel,
          
          connection: {
            application_name: `choosemypower-pool-${replicaId}`,
            search_path: 'public'
          }
        });

        this.replicaSqls.push(replicaSql);
        this.replicaWeights.push(replica.weight || 1);
        
        this.connectionHealth.set(replicaId, {
          isHealthy: true,
          lastCheck: Date.now(),
          consecutiveFailures: 0,
          responseTime: 0
        });

        console.warn(`Read replica ${replicaId} initialized`);
      } catch (error) {
        console.error(`Failed to initialize read replica ${replicaId}:`, error);
        this.connectionHealth.set(replicaId, {
          isHealthy: false,
          lastCheck: Date.now(),
          consecutiveFailures: 1,
          responseTime: 0
        });
      }
    }
  }

  /**
   * Execute a write query (uses primary connection)
   */
  async executeWrite<T>(query: string, params?: unknown[]): Promise<T[]> {
    if (!this.primarySql) {
      throw new Error('Primary database connection not available');
    }

    const startTime = Date.now();
    
    try {
      this.stats.totalQueries++;
      
      const result = params 
        ? await this.primarySql`${query}`.bind(params)
        : await this.primarySql`${query}`;
      
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);
      this.updateConnectionHealth('primary', responseTime, true);
      
      return result as T[];
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedQueries++;
      this.updateConnectionHealth('primary', responseTime, false);
      
      console.error('Write query failed:', error);
      throw error;
    }
  }

  /**
   * Execute a read query (uses read replica or primary)
   */
  async executeRead<T>(query: string, params?: unknown[], useCache = false): Promise<T[]> {
    const cacheKey = useCache ? this.generateCacheKey(query, params) : null;
    
    // Check cache first if enabled
    if (cacheKey && this.config.performance.queryCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    const startTime = Date.now();
    let sql: ReturnType<typeof postgres> | null = null;
    let connectionId = '';

    try {
      this.stats.totalQueries++;
      
      // Select the best available connection
      const connection = this.selectReadConnection();
      sql = connection.sql;
      connectionId = connection.id;
      
      if (!sql) {
        throw new Error('No healthy database connections available');
      }

      const result = params 
        ? await sql`${query}`.bind(params)
        : await sql`${query}`;
      
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);
      this.updateConnectionHealth(connectionId, responseTime, true);
      
      // Cache the result if enabled
      if (cacheKey && this.config.performance.queryCache) {
        this.queryCache.set(cacheKey, result);
      }
      
      return result as T[];
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedQueries++;
      if (connectionId) {
        this.updateConnectionHealth(connectionId, responseTime, false);
      }
      
      console.error('Read query failed:', error);
      
      // Retry with primary if replica failed
      if (connectionId !== 'primary' && this.primarySql) {
        console.warn('Retrying query with primary connection');
        return this.executeReadWithPrimary(query, params, cacheKey);
      }
      
      throw error;
    }
  }

  /**
   * Execute read query with primary connection (fallback)
   */
  private async executeReadWithPrimary<T>(query: string, params?: unknown[], cacheKey?: string | null): Promise<T[]> {
    if (!this.primarySql) {
      throw new Error('Primary database connection not available');
    }

    const startTime = Date.now();
    
    try {
      const result = params 
        ? await this.primarySql`${query}`.bind(params)
        : await this.primarySql`${query}`;
      
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);
      this.updateConnectionHealth('primary', responseTime, true);
      
      // Cache the result if enabled
      if (cacheKey && this.config.performance.queryCache) {
        this.queryCache.set(cacheKey, result);
      }
      
      return result as T[];
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateConnectionHealth('primary', responseTime, false);
      throw error;
    }
  }

  /**
   * Select the best read connection based on health and load balancing
   */
  private selectReadConnection(): { sql: ReturnType<typeof postgres> | null; id: string } {
    // Find healthy replicas
    const healthyReplicas: Array<{ sql: ReturnType<typeof postgres>; id: string; weight: number }> = [];
    
    for (let i = 0; i < this.replicaSqls.length; i++) {
      const replicaId = `replica-${i}`;
      const health = this.connectionHealth.get(replicaId);
      
      if (health?.isHealthy) {
        healthyReplicas.push({
          sql: this.replicaSqls[i],
          id: replicaId,
          weight: this.replicaWeights[i]
        });
      }
    }

    // If we have healthy replicas, use weighted random selection
    if (healthyReplicas.length > 0) {
      const totalWeight = healthyReplicas.reduce((sum, replica) => sum + replica.weight, 0);
      const random = Math.random() * totalWeight;
      
      let currentWeight = 0;
      for (const replica of healthyReplicas) {
        currentWeight += replica.weight;
        if (random <= currentWeight) {
          return { sql: replica.sql, id: replica.id };
        }
      }
    }

    // Fall back to primary if no healthy replicas
    const primaryHealth = this.connectionHealth.get('primary');
    if (primaryHealth?.isHealthy && this.primarySql) {
      return { sql: this.primarySql, id: 'primary' };
    }

    // No healthy connections available
    return { sql: null, id: '' };
  }

  /**
   * Update connection health status
   */
  private updateConnectionHealth(connectionId: string, responseTime: number, success: boolean): void {
    const health = this.connectionHealth.get(connectionId);
    if (!health) return;

    health.lastCheck = Date.now();
    health.responseTime = responseTime;

    if (success) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
    } else {
      health.consecutiveFailures++;
      if (health.consecutiveFailures >= this.config.monitoring.maxFailures) {
        health.isHealthy = false;
        console.warn(`Connection ${connectionId} marked as unhealthy after ${health.consecutiveFailures} failures`);
      }
    }
  }

  /**
   * Update query statistics
   */
  private updateStats(responseTime: number, fromCache: boolean): void {
    if (responseTime > this.config.monitoring.slowQueryThreshold) {
      this.stats.slowQueries++;
    }

    // Update rolling average response time
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalQueries - 1) + responseTime) / this.stats.totalQueries;
  }

  /**
   * Generate cache key for query results
   */
  private generateCacheKey(query: string, params?: unknown[]): string {
    const normalizedQuery = query.trim().toLowerCase();
    const paramStr = params ? JSON.stringify(params) : '';
    return Buffer.from(normalizedQuery + paramStr).toString('base64').substring(0, 64);
  }

  /**
   * Start health monitoring for all connections
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.monitoring.healthCheckInterval);
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises: Promise<void>[] = [];

    // Check primary connection
    if (this.primarySql) {
      healthCheckPromises.push(this.checkConnectionHealth(this.primarySql, 'primary'));
    }

    // Check replica connections
    for (let i = 0; i < this.replicaSqls.length; i++) {
      const replicaId = `replica-${i}`;
      healthCheckPromises.push(this.checkConnectionHealth(this.replicaSqls[i], replicaId));
    }

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific connection
   */
  private async checkConnectionHealth(sql: ReturnType<typeof postgres>, connectionId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await sql`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;
      this.updateConnectionHealth(connectionId, responseTime, true);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateConnectionHealth(connectionId, responseTime, false);
      console.warn(`Health check failed for ${connectionId}:`, error);
    }
  }

  /**
   * Get current pool statistics
   */
  getStats(): QueryStats & { connections: Record<string, ConnectionHealth> } {
    return {
      ...this.stats,
      connections: Object.fromEntries(this.connectionHealth)
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    const closePromises: Promise<void>[] = [];

    if (this.primarySql) {
      closePromises.push(this.primarySql.end());
    }

    for (const replicaSql of this.replicaSqls) {
      closePromises.push(replicaSql.end());
    }

    await Promise.allSettled(closePromises);
    console.warn('Database connection pool closed');
  }
}

// Create default configuration from environment
export function createDefaultConfig(): ConnectionPoolConfig {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
  }

  const url = new URL(databaseUrl);
  
  return {
    primary: {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5 minutes
      connectionTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
      maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '3600000') // 1 hour
    },
    performance: {
      preparedStatements: process.env.DB_PREPARED_STATEMENTS !== 'false',
      queryCache: process.env.DB_QUERY_CACHE !== 'false',
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '15000'), // 15 seconds
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000') // 1 second
    },
    monitoring: {
      healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
      slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'), // 1 second
      maxFailures: parseInt(process.env.DB_MAX_FAILURES || '3')
    }
  };
}

// Export singleton instance
let poolInstance: DatabaseConnectionPool | null = null;

export function getConnectionPool(): DatabaseConnectionPool {
  if (!poolInstance) {
    const config = createDefaultConfig();
    poolInstance = new DatabaseConnectionPool(config);
  }
  return poolInstance;
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (poolInstance) {
      await poolInstance.close();
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (poolInstance) {
      await poolInstance.close();
    }
    process.exit(0);
  });
}