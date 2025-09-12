/**
 * API Client Factory
 * Creates and configures external API clients for Texas electricity market data
 */

import { ERCOTClient } from './ercot-client';
import { PUCTClient } from './puct-client';
import { OncorClient } from './oncor-client';
import type { ExternalAPIClient } from '../../types/external-apis';

export interface ClientFactoryConfig {
  environment?: 'production' | 'development' | 'sandbox';
  apiKeys?: {
    ercot?: string;
    oncor?: string;
    centerpoint?: string;
    aepNorth?: string;
    aepCentral?: string;
    tnmp?: string;
    usps?: string;
  };
  rateLimits?: {
    conservative?: boolean;
    bursty?: boolean;
  };
  circuitBreaker?: {
    enabled?: boolean;
    aggressive?: boolean;
  };
}

export class APIClientFactory {
  private config: ClientFactoryConfig;
  private clients: Map<string, ExternalAPIClient> = new Map();

  constructor(config: ClientFactoryConfig = {}) {
    this.config = {
      environment: 'production',
      apiKeys: {},
      rateLimits: { conservative: false, bursty: false },
      circuitBreaker: { enabled: true, aggressive: false },
      ...config
    };
  }

  /**
   * Create ERCOT MIS API client
   */
  createERCOTClient(): ERCOTClient {
    const clientId = 'ercot';
    
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId) as ERCOTClient;
    }

    const rateLimits = this.getRateLimits('ercot');
    const circuitBreaker = this.getCircuitBreakerConfig('ercot');

    const client = new ERCOTClient({
      environment: this.config.environment === 'production' ? 'production' : 'sandbox',
      apiKey: this.config.apiKeys?.ercot,
      timeout: 35000,
      maxRetries: 3,
      retryDelay: 1000,
      rateLimits,
      circuitBreaker,
      headers: {
        'User-Agent': 'ChooseMyPower-ZIPLookup/1.0',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Create PUCT REP Directory client
   */
  createPUCTClient(): PUCTClient {
    const clientId = 'puct';
    
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId) as PUCTClient;
    }

    const rateLimits = this.getRateLimits('puct');
    const circuitBreaker = this.getCircuitBreakerConfig('puct');

    const client = new PUCTClient({
      timeout: 50000, // PUCT can be slow
      maxRetries: 2,
      retryDelay: 2000,
      rateLimits,
      circuitBreaker,
      userAgent: 'ChooseMyPower-ZIPLookup/1.0 (Texas ZIP Validation)',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Create Oncor Electric Delivery client
   */
  createOncorClient(): OncorClient | null {
    const clientId = 'oncor';
    
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId) as OncorClient;
    }

    if (!this.config.apiKeys?.oncor) {
      console.warn('Oncor API key not provided, skipping client creation');
      return null;
    }

    const rateLimits = this.getRateLimits('oncor');
    const circuitBreaker = this.getCircuitBreakerConfig('oncor');

    const client = new OncorClient({
      apiKey: this.config.apiKeys.oncor,
      environment: this.config.environment === 'production' ? 'production' : 'sandbox',
      timeout: 20000,
      maxRetries: 4,
      retryDelay: 500,
      rateLimits,
      circuitBreaker,
      headers: {
        'User-Agent': 'ChooseMyPower-ZIPLookup/1.0',
        'Accept-Encoding': 'gzip'
      }
    });

    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Create all available clients
   */
  createAllClients(): Record<string, ExternalAPIClient | null> {
    return {
      ercot: this.createERCOTClient(),
      puct: this.createPUCTClient(),
      oncor: this.createOncorClient(),
      // Additional clients would be created here
      // centerpoint: this.createCenterPointClient(),
      // aepNorth: this.createAEPNorthClient(),
      // aepCentral: this.createAEPCentralClient(),
      // tnmp: this.createTNMPClient(),
      // usps: this.createUSPSClient()
    };
  }

  /**
   * Create clients for a specific ZIP code (based on likely TDSP)
   */
  createClientsForZipCode(zipCode: string): ExternalAPIClient[] {
    const clients: ExternalAPIClient[] = [];
    
    // Always include ERCOT and PUCT for comprehensive coverage
    clients.push(this.createERCOTClient());
    clients.push(this.createPUCTClient());
    
    // Add TDSP-specific client based on ZIP code
    const tdspClient = this.getTDSPClientForZip(zipCode);
    if (tdspClient) {
      clients.push(tdspClient);
    }
    
    return clients.filter(client => client !== null);
  }

  /**
   * Get TDSP client for specific ZIP code
   */
  private getTDSPClientForZip(zipCode: string): ExternalAPIClient | null {
    if (!zipCode || zipCode.length !== 5) {
      return null;
    }
    
    const numericZip = parseInt(zipCode, 10);
    
    // Oncor territory (North Texas)
    if ((numericZip >= 75000 && numericZip <= 75999) || 
        (numericZip >= 76000 && numericZip <= 76999) ||
        (numericZip >= 75700 && numericZip <= 75799)) {
      return this.createOncorClient();
    }
    
    // CenterPoint territory (Houston area)
    if (numericZip >= 77000 && numericZip <= 77999) {
      // return this.createCenterPointClient(); // Would be implemented
      return null;
    }
    
    // AEP territories
    if (numericZip >= 78000 && numericZip <= 78999) {
      // return this.createAEPCentralClient(); // Would be implemented
      return null;
    }
    
    // TNMP territory (Southeast Texas)
    if (numericZip >= 77500 && numericZip <= 77699) {
      // return this.createTNMPClient(); // Would be implemented
      return null;
    }
    
    return null;
  }

  /**
   * Get rate limits configuration for a specific client
   */
  private getRateLimits(clientType: string): { requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number } {
    const baseRateLimits = {
      ercot: { requestsPerMinute: 60, requestsPerHour: 3600, requestsPerDay: 86400 },
      puct: { requestsPerMinute: 30, requestsPerHour: 1800, requestsPerDay: 43200 },
      oncor: { requestsPerMinute: 120, requestsPerHour: 7200, requestsPerDay: 172800 },
      centerpoint: { requestsPerMinute: 100, requestsPerHour: 6000, requestsPerDay: 144000 },
      aep: { requestsPerMinute: 40, requestsPerHour: 2400, requestsPerDay: 57600 },
      tnmp: { requestsPerMinute: 30, requestsPerHour: 1800, requestsPerDay: 43200 },
      usps: { requestsPerMinute: 50, requestsPerHour: 3000, requestsPerDay: 72000 }
    };

    let limits = baseRateLimits[clientType as keyof typeof baseRateLimits] || baseRateLimits.ercot;

    // Apply rate limit modifiers
    if (this.config.rateLimits?.conservative) {
      limits = {
        requestsPerMinute: Math.floor(limits.requestsPerMinute * 0.5),
        requestsPerHour: Math.floor(limits.requestsPerHour * 0.5),
        requestsPerDay: Math.floor(limits.requestsPerDay * 0.5)
      };
    } else if (this.config.rateLimits?.bursty) {
      limits = {
        requestsPerMinute: Math.floor(limits.requestsPerMinute * 1.5),
        requestsPerHour: limits.requestsPerHour, // Keep hourly the same
        requestsPerDay: limits.requestsPerDay    // Keep daily the same
      };
    }

    return limits;
  }

  /**
   * Get circuit breaker configuration for a specific client
   */
  private getCircuitBreakerConfig(clientType: string): { enabled: boolean; failureThreshold: number; recoveryTimeout: number } {
    const baseConfig = {
      enabled: this.config.circuitBreaker?.enabled ?? true,
      failureThreshold: 5,
      recoveryTimeout: 60000
    };

    // Client-specific adjustments
    const clientAdjustments = {
      ercot: { failureThreshold: 5, recoveryTimeout: 60000 },
      puct: { failureThreshold: 3, recoveryTimeout: 120000 }, // PUCT is less reliable
      oncor: { failureThreshold: 8, recoveryTimeout: 90000 },
      centerpoint: { failureThreshold: 6, recoveryTimeout: 120000 },
      aep: { failureThreshold: 4, recoveryTimeout: 240000 },
      tnmp: { failureThreshold: 3, recoveryTimeout: 300000 }
    };

    const adjustment = clientAdjustments[clientType as keyof typeof clientAdjustments];
    if (adjustment) {
      baseConfig.failureThreshold = adjustment.failureThreshold;
      baseConfig.recoveryTimeout = adjustment.recoveryTimeout;
    }

    // Apply aggressive circuit breaker if configured
    if (this.config.circuitBreaker?.aggressive) {
      baseConfig.failureThreshold = Math.max(1, Math.floor(baseConfig.failureThreshold * 0.5));
      baseConfig.recoveryTimeout = baseConfig.recoveryTimeout * 2;
    }

    return baseConfig;
  }

  /**
   * Get client by name
   */
  getClient(clientName: string): ExternalAPIClient | null {
    return this.clients.get(clientName) || null;
  }

  /**
   * Get all active clients
   */
  getAllClients(): ExternalAPIClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Clear all clients (useful for testing)
   */
  clearClients(): void {
    this.clients.clear();
  }

  /**
   * Get client health status
   */
  async getClientHealthStatus(clientName?: string): Promise<unknown> {
    if (clientName) {
      const client = this.clients.get(clientName);
      if (client) {
        return await client.getHealthStatus();
      }
      return { status: 'not_found', client: clientName };
    }

    // Get health status for all clients
    const healthStatuses: Record<string, unknown> = {};
    
    for (const [name, client] of this.clients) {
      try {
        healthStatuses[name] = await client.getHealthStatus();
      } catch (error: unknown) {
        healthStatuses[name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return {
      overall: this.calculateOverallHealth(healthStatuses),
      clients: healthStatuses,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall health from individual client health statuses
   */
  private calculateOverallHealth(healthStatuses: Record<string, unknown>): string {
    const statuses = Object.values(healthStatuses);
    
    if (statuses.length === 0) {
      return 'unknown';
    }
    
    const healthyCount = statuses.filter(status => status.status === 'healthy').length;
    const totalCount = statuses.length;
    
    if (healthyCount === totalCount) {
      return 'healthy';
    } else if (healthyCount >= totalCount * 0.5) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ClientFactoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Clear existing clients to force recreation with new config
    this.clearClients();
  }

  /**
   * Get current configuration
   */
  getConfig(): ClientFactoryConfig {
    return { ...this.config };
  }
}

/**
 * Default factory instance
 */
export const apiClientFactory = new APIClientFactory({
  environment: (process.env.NODE_ENV as 'production' | 'development') || 'production',
  apiKeys: {
    ercot: process.env.ERCOT_API_KEY,
    oncor: process.env.ONCOR_API_KEY,
    centerpoint: process.env.CENTERPOINT_API_KEY,
    aepNorth: process.env.AEP_NORTH_API_KEY,
    aepCentral: process.env.AEP_CENTRAL_API_KEY,
    tnmp: process.env.TNMP_API_KEY,
    usps: process.env.USPS_API_KEY
  },
  rateLimits: {
    conservative: process.env.CONSERVATIVE_RATE_LIMITS === 'true',
    bursty: process.env.BURSTY_RATE_LIMITS === 'true'
  },
  circuitBreaker: {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
    aggressive: process.env.AGGRESSIVE_CIRCUIT_BREAKER === 'true'
  }
});

/**
 * Convenience functions for creating specific clients
 */
export const createERCOTClient = () => apiClientFactory.createERCOTClient();
export const createPUCTClient = () => apiClientFactory.createPUCTClient();
export const createOncorClient = () => apiClientFactory.createOncorClient();
export const createClientsForZip = (zipCode: string) => apiClientFactory.createClientsForZipCode(zipCode);