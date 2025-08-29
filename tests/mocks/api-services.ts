/**
 * Comprehensive API Service Mocks for Testing
 * 
 * Provides realistic mocks for external services including:
 * - ComparePower API with all endpoints and scenarios
 * - ERCOT ESIID resolution service
 * - Texas utility TDSP services
 * - Rate limiting and caching behavior
 * - Network error conditions and retry logic
 * - Database connection pooling simulation
 * - Real-time data feeds and updates
 */

import { vi } from 'vitest';
import type { 
  ElectricityPlan,
  Provider,
  TdspInfo,
  ApiParams,
  ZipSearchResponse,
  ApiErrorResponse,
  AddressTDSPResolution
} from '@/types/electricity-plans';

// Mock data generators from test utils
import {
  generateMockPlan,
  generateMockProvider,
  generateMockTdspInfo,
  generateMockSearchResponse
} from '../utils/test-utils';

// ============================================================================
// ComparePower API Mock Service
// ============================================================================

interface MockApiState {
  requestCount: number;
  rateLimitReached: boolean;
  cacheHits: Map<string, any>;
  networkLatency: number;
  errorRate: number;
  planDatabase: ElectricityPlan[];
}

class ComparePowerApiMock {
  private state: MockApiState = {
    requestCount: 0,
    rateLimitReached: false,
    cacheHits: new Map(),
    networkLatency: 200,
    errorRate: 0.02, // 2% error rate
    planDatabase: []
  };
  
  constructor() {
    this.initializePlanDatabase();
  }
  
  /**
   * Initialize with realistic plan data for Texas markets
   */
  private initializePlanDatabase(): void {
    const tdsps = [
      { duns: '055757763', name: 'Oncor Electric Delivery', zone: 'North' },
      { duns: '073140841', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
      { duns: '098807071', name: 'AEP Texas Central Company', zone: 'South' },
      { duns: '080816643', name: 'Texas-New Mexico Power Company', zone: 'West' }
    ];
    
    const providers = [
      'TXU Energy', 'Reliant Energy', 'Direct Energy', 'Green Mountain Energy',
      'Gexa Energy', 'Discount Power', 'TriEagle Energy', 'Pulse Power',
      'Champion Energy', 'Amigo Energy', 'Cirro Energy', 'Just Energy'
    ];
    
    // Generate plans for each TDSP-Provider combination
    tdsps.forEach(tdsp => {
      providers.forEach(providerName => {
        // Each provider has 3-8 plans per TDSP
        const planCount = 3 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < planCount; i++) {
          const plan = generateMockPlan({
            provider: generateMockProvider({ name: providerName }),
            tdsp: tdsp.duns,
            availableInZones: [tdsp.zone]
          });
          
          this.state.planDatabase.push(plan);
        }
      });
    });
  }
  
  /**
   * Mock plan search with realistic filtering and caching
   */
  async fetchPlans(params: ApiParams): Promise<ElectricityPlan[]> {
    this.state.requestCount++;
    
    // Simulate rate limiting
    if (this.state.requestCount > 100) {
      this.state.rateLimitReached = true;
      throw new Error('Rate limit exceeded. Please try again in 60 seconds.');
    }
    
    // Simulate network errors based on error rate
    if (Math.random() < this.state.errorRate) {
      throw new Error('Network error: Unable to connect to plan database');
    }
    
    // Generate cache key
    const cacheKey = JSON.stringify(params);
    
    // Check cache first
    if (this.state.cacheHits.has(cacheKey)) {
      await this.simulateNetworkDelay(50); // Cache hits are faster
      return this.state.cacheHits.get(cacheKey);
    }
    
    // Simulate network latency
    await this.simulateNetworkDelay(this.state.networkLatency);
    
    // Filter plans based on parameters
    let filteredPlans = this.filterPlans(params);
    
    // Sort by rate (default)
    filteredPlans = filteredPlans.sort((a, b) => a.pricing.rate1000kWh - b.pricing.rate1000kWh);
    
    // Cache the results
    this.state.cacheHits.set(cacheKey, filteredPlans);
    
    return filteredPlans;
  }
  
  /**
   * Filter plans based on API parameters
   */
  private filterPlans(params: ApiParams): ElectricityPlan[] {
    let plans = [...this.state.planDatabase];
    
    // Filter by TDSP
    if (params.tdsp_duns) {
      plans = plans.filter(plan => plan.tdsp === params.tdsp_duns);
    }
    
    // Filter by contract length
    if (params.term) {
      plans = plans.filter(plan => plan.contract.length === params.term);
    }
    
    // Filter by green energy percentage
    if (params.percent_green !== undefined) {
      plans = plans.filter(plan => plan.features.greenEnergy >= params.percent_green);
    }
    
    // Filter by prepaid
    if (params.is_pre_pay !== undefined) {
      const isPrepaid = plan => plan.name.toLowerCase().includes('prepaid');
      plans = plans.filter(plan => isPrepaid(plan) === params.is_pre_pay);
    }
    
    // Filter by time of use
    if (params.is_time_of_use !== undefined) {
      plans = plans.filter(plan => plan.features.timeOfUse === params.is_time_of_use);
    }
    
    // Filter by auto pay requirement
    if (params.requires_auto_pay !== undefined) {
      plans = plans.filter(plan => {
        const requiresAutoPay = plan.features.autopay.available && plan.features.autopay.discount > 0;
        return requiresAutoPay === params.requires_auto_pay;
      });
    }
    
    // Adjust rates based on usage
    if (params.display_usage) {
      plans = plans.map(plan => ({
        ...plan,
        pricing: {
          ...plan.pricing,
          displayRate: this.calculateRateForUsage(plan, params.display_usage!)
        }
      }));
    }
    
    return plans;
  }
  
  /**
   * Calculate rate for specific usage level
   */
  private calculateRateForUsage(plan: ElectricityPlan, usage: number): number {
    if (usage <= 500) {
      return plan.pricing.rate500kWh;
    } else if (usage <= 1000) {
      return plan.pricing.rate1000kWh;
    } else {
      return plan.pricing.rate2000kWh;
    }
  }
  
  /**
   * Mock health check endpoint
   */
  async healthCheck(): Promise<{ status: string; responseTime: number; planCount: number }> {
    const startTime = Date.now();
    await this.simulateNetworkDelay(100);
    
    return {
      status: this.state.rateLimitReached ? 'degraded' : 'healthy',
      responseTime: Date.now() - startTime,
      planCount: this.state.planDatabase.length
    };
  }
  
  /**
   * Mock cache statistics
   */
  getCacheStats(): { hits: number; size: number; hitRate: number } {
    const hits = this.state.cacheHits.size;
    const hitRate = this.state.requestCount > 0 ? hits / this.state.requestCount : 0;
    
    return {
      hits,
      size: this.state.cacheHits.size,
      hitRate
    };
  }
  
  /**
   * Reset mock state for testing
   */
  reset(): void {
    this.state.requestCount = 0;
    this.state.rateLimitReached = false;
    this.state.cacheHits.clear();
    this.state.networkLatency = 200;
    this.state.errorRate = 0.02;
  }
  
  /**
   * Configure mock behavior for testing
   */
  configure(options: Partial<{
    networkLatency: number;
    errorRate: number;
    rateLimitThreshold: number;
  }>): void {
    if (options.networkLatency !== undefined) {
      this.state.networkLatency = options.networkLatency;
    }
    if (options.errorRate !== undefined) {
      this.state.errorRate = options.errorRate;
    }
  }
  
  /**
   * Simulate network delay
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// ERCOT ESIID API Mock Service
// ============================================================================

interface ESIIDMockState {
  requestCount: number;
  knownAddresses: Map<string, AddressTDSPResolution>;
  networkLatency: number;
  successRate: number;
}

class ErcotESIIDApiMock {
  private state: ESIIDMockState = {
    requestCount: 0,
    knownAddresses: new Map(),
    networkLatency: 300,
    successRate: 0.85 // 85% success rate for address resolution
  };
  
  constructor() {
    this.initializeKnownAddresses();
  }
  
  /**
   * Initialize with known addresses for testing
   */
  private initializeKnownAddresses(): void {
    const knownAddresses = [
      {
        address: '123 Main Street, Dallas, TX 75201',
        zipCode: '75201',
        esiid: '10175757630000123456',
        tdsp_duns: '055757763',
        tdsp_name: 'Oncor Electric Delivery',
        confidence: 'high' as const
      },
      {
        address: '456 Oak Avenue, Houston, TX 77001',
        zipCode: '77001',
        esiid: '10731408410000456789',
        tdsp_duns: '073140841',
        tdsp_name: 'CenterPoint Energy Houston Electric',
        confidence: 'high' as const
      },
      {
        address: '789 Pine Drive, Austin, TX 78701',
        zipCode: '78701',
        esiid: '10988070710000789012',
        tdsp_duns: '098807071',
        tdsp_name: 'AEP Texas Central Company',
        confidence: 'medium' as const
      }
    ];
    
    knownAddresses.forEach(addr => {
      const key = this.generateAddressKey(addr.address, addr.zipCode);
      this.state.knownAddresses.set(key, {
        resolvedAddress: addr.address,
        confidence: addr.confidence,
        esiid: addr.esiid,
        premise: {
          streetNumber: addr.address.split(' ')[0],
          streetName: addr.address.split(' ').slice(1, -3).join(' '),
          city: addr.address.split(', ')[1],
          state: 'TX',
          zipCode: addr.zipCode
        }
      });
    });
  }
  
  /**
   * Mock address to TDSP resolution
   */
  async resolveAddressToTDSP(
    address: string, 
    zipCode: string, 
    usage?: number
  ): Promise<{
    success: boolean;
    esiid?: string;
    tdsp_duns?: string;
    tdsp_name?: string;
    confidence?: 'high' | 'medium' | 'low';
    resolved_address?: string;
    error?: string;
  }> {
    this.state.requestCount++;
    
    // Simulate network latency
    await this.simulateNetworkDelay(this.state.networkLatency);
    
    // Simulate service failures
    if (Math.random() > this.state.successRate) {
      return {
        success: false,
        error: 'ESIID service temporarily unavailable'
      };
    }
    
    // Check if address is in our known addresses
    const addressKey = this.generateAddressKey(address, zipCode);
    const knownAddress = this.state.knownAddresses.get(addressKey);
    
    if (knownAddress) {
      return {
        success: true,
        esiid: knownAddress.esiid,
        tdsp_duns: this.getTdspFromZipCode(zipCode),
        tdsp_name: this.getTdspNameFromDuns(this.getTdspFromZipCode(zipCode)),
        confidence: knownAddress.confidence,
        resolved_address: knownAddress.resolvedAddress
      };
    }
    
    // Generate synthetic ESIID for unknown addresses
    const tdspDuns = this.getTdspFromZipCode(zipCode);
    if (tdspDuns) {
      const syntheticESIID = this.generateSyntheticESIID(tdspDuns);
      return {
        success: true,
        esiid: syntheticESIID,
        tdsp_duns: tdspDuns,
        tdsp_name: this.getTdspNameFromDuns(tdspDuns),
        confidence: 'medium',
        resolved_address: this.standardizeAddress(address, zipCode)
      };
    }
    
    return {
      success: false,
      error: 'Address not found in ERCOT database'
    };
  }
  
  /**
   * Mock ESIID lookup by ID
   */
  async lookupESIID(esiid: string): Promise<{
    success: boolean;
    address?: string;
    tdsp_duns?: string;
    tdsp_name?: string;
    premise?: any;
    error?: string;
  }> {
    await this.simulateNetworkDelay(this.state.networkLatency);
    
    // Check if ESIID is in our known data
    for (const [key, data] of this.state.knownAddresses.entries()) {
      if (data.esiid === esiid) {
        return {
          success: true,
          address: data.resolvedAddress,
          tdsp_duns: this.getTdspFromESIID(esiid),
          tdsp_name: this.getTdspNameFromDuns(this.getTdspFromESIID(esiid)!),
          premise: data.premise
        };
      }
    }
    
    return {
      success: false,
      error: 'ESIID not found'
    };
  }
  
  /**
   * Mock health check
   */
  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    await this.simulateNetworkDelay(50);
    
    return {
      status: this.state.successRate > 0.8 ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime
    };
  }
  
  /**
   * Generate address key for caching
   */
  private generateAddressKey(address: string, zipCode: string): string {
    return `${address.toLowerCase().trim()}_${zipCode}`;
  }
  
  /**
   * Get TDSP DUNS from ZIP code
   */
  private getTdspFromZipCode(zipCode: string): string | null {
    // Simplified TDSP mapping for testing
    const firstDigit = zipCode.charAt(1);
    switch (firstDigit) {
      case '5': // North Texas (Dallas area)
        return '055757763'; // Oncor
      case '7': // Houston area
        return '073140841'; // CenterPoint
      case '8': // Austin/Central area
        return '098807071'; // AEP Texas Central
      default:
        return '080816643'; // TNMP
    }
  }
  
  /**
   * Get TDSP name from DUNS number
   */
  private getTdspNameFromDuns(duns: string): string {
    switch (duns) {
      case '055757763':
        return 'Oncor Electric Delivery';
      case '073140841':
        return 'CenterPoint Energy Houston Electric';
      case '098807071':
        return 'AEP Texas Central Company';
      case '080816643':
        return 'Texas-New Mexico Power Company';
      default:
        return 'Unknown TDSP';
    }
  }
  
  /**
   * Get TDSP from ESIID
   */
  private getTdspFromESIID(esiid: string): string | null {
    if (esiid.length < 12) return null;
    
    const tdspPrefix = esiid.substring(2, 11);
    if (tdspPrefix.startsWith('55757763')) return '055757763';
    if (tdspPrefix.startsWith('73140841')) return '073140841';
    if (tdspPrefix.startsWith('98807071')) return '098807071';
    if (tdspPrefix.startsWith('80816643')) return '080816643';
    
    return null;
  }
  
  /**
   * Generate synthetic ESIID for testing
   */
  private generateSyntheticESIID(tdspDuns: string): string {
    const prefix = '10';
    const tdspPart = tdspDuns.replace(/^0+/, '');
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const checksum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefix}${tdspPart}${randomSuffix}${checksum}`;
  }
  
  /**
   * Standardize address format
   */
  private standardizeAddress(address: string, zipCode: string): string {
    // Basic address standardization for testing
    const cleanAddress = address.trim();
    if (!cleanAddress.includes(zipCode)) {
      return `${cleanAddress}, TX ${zipCode}`;
    }
    return cleanAddress;
  }
  
  /**
   * Configure mock behavior
   */
  configure(options: Partial<{
    networkLatency: number;
    successRate: number;
  }>): void {
    if (options.networkLatency !== undefined) {
      this.state.networkLatency = options.networkLatency;
    }
    if (options.successRate !== undefined) {
      this.state.successRate = options.successRate;
    }
  }
  
  /**
   * Reset mock state
   */
  reset(): void {
    this.state.requestCount = 0;
  }
  
  /**
   * Simulate network delay
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Database Connection Mock
// ============================================================================

class DatabaseConnectionMock {
  private connectionPool: Array<{ id: number; inUse: boolean; lastUsed: number }> = [];
  private maxConnections = 10;
  private queryCount = 0;
  private isHealthy = true;
  
  constructor() {
    // Initialize connection pool
    for (let i = 0; i < this.maxConnections; i++) {
      this.connectionPool.push({
        id: i,
        inUse: false,
        lastUsed: Date.now()
      });
    }
  }
  
  /**
   * Mock database query
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    if (!this.isHealthy) {
      throw new Error('Database connection failed');
    }
    
    const connection = this.acquireConnection();
    if (!connection) {
      throw new Error('No database connections available');
    }
    
    try {
      // Simulate query execution time
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      this.queryCount++;
      
      // Return mock results based on query type
      if (sql.toLowerCase().includes('select')) {
        return this.generateMockQueryResults(sql);
      } else if (sql.toLowerCase().includes('insert')) {
        return [{ insertId: Math.floor(Math.random() * 1000000), affectedRows: 1 }];
      } else if (sql.toLowerCase().includes('update')) {
        return [{ affectedRows: Math.floor(Math.random() * 5) + 1 }];
      } else if (sql.toLowerCase().includes('delete')) {
        return [{ affectedRows: Math.floor(Math.random() * 3) }];
      }
      
      return [];
    } finally {
      this.releaseConnection(connection);
    }
  }
  
  /**
   * Acquire database connection from pool
   */
  private acquireConnection(): { id: number; inUse: boolean; lastUsed: number } | null {
    const available = this.connectionPool.find(conn => !conn.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available;
    }
    return null;
  }
  
  /**
   * Release database connection back to pool
   */
  private releaseConnection(connection: { id: number; inUse: boolean; lastUsed: number }): void {
    connection.inUse = false;
    connection.lastUsed = Date.now();
  }
  
  /**
   * Generate mock query results
   */
  private generateMockQueryResults(sql: string): any[] {
    if (sql.toLowerCase().includes('plans')) {
      return Array.from({ length: Math.floor(Math.random() * 50) + 10 }, (_, i) => ({
        id: i + 1,
        name: `Plan ${i + 1}`,
        provider_id: Math.floor(Math.random() * 10) + 1,
        rate: (Math.random() * 5 + 8).toFixed(2),
        contract_length: [6, 12, 18, 24, 36][Math.floor(Math.random() * 5)]
      }));
    }
    
    if (sql.toLowerCase().includes('providers')) {
      return Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Provider ${i + 1}`,
        rating: (Math.random() * 2 + 3).toFixed(1)
      }));
    }
    
    return [];
  }
  
  /**
   * Get connection pool statistics
   */
  getPoolStats(): {
    totalConnections: number;
    activeConnections: number;
    availableConnections: number;
    queryCount: number;
  } {
    const activeConnections = this.connectionPool.filter(conn => conn.inUse).length;
    
    return {
      totalConnections: this.maxConnections,
      activeConnections,
      availableConnections: this.maxConnections - activeConnections,
      queryCount: this.queryCount
    };
  }
  
  /**
   * Simulate database health issues
   */
  setHealthy(healthy: boolean): void {
    this.isHealthy = healthy;
  }
  
  /**
   * Reset mock state
   */
  reset(): void {
    this.queryCount = 0;
    this.isHealthy = true;
    this.connectionPool.forEach(conn => {
      conn.inUse = false;
      conn.lastUsed = Date.now();
    });
  }
}

// ============================================================================
// Mock Service Instances
// ============================================================================

// Create singleton instances for use across tests
export const mockComparePowerApi = new ComparePowerApiMock();
export const mockErcotESIIDApi = new ErcotESIIDApiMock();
export const mockDatabaseConnection = new DatabaseConnectionMock();

// ============================================================================
// Mock Service Factory
// ============================================================================

export class MockServiceFactory {
  /**
   * Create configured mock services for specific test scenarios
   */
  static createScenario(scenario: 'normal' | 'high-latency' | 'error-prone' | 'offline'): {
    comparePowerApi: ComparePowerApiMock;
    ercotApi: ErcotESIIDApiMock;
    database: DatabaseConnectionMock;
  } {
    const comparePowerApi = new ComparePowerApiMock();
    const ercotApi = new ErcotESIIDApiMock();
    const database = new DatabaseConnectionMock();
    
    switch (scenario) {
      case 'high-latency':
        comparePowerApi.configure({ networkLatency: 2000 });
        ercotApi.configure({ networkLatency: 3000 });
        break;
        
      case 'error-prone':
        comparePowerApi.configure({ errorRate: 0.2 }); // 20% error rate
        ercotApi.configure({ successRate: 0.5 }); // 50% success rate
        database.setHealthy(false);
        break;
        
      case 'offline':
        comparePowerApi.configure({ errorRate: 1.0 }); // 100% error rate
        ercotApi.configure({ successRate: 0.0 }); // 0% success rate
        database.setHealthy(false);
        break;
        
      default: // 'normal'
        // Use default configurations
        break;
    }
    
    return { comparePowerApi, ercotApi, database };
  }
  
  /**
   * Reset all mock services to default state
   */
  static resetAll(): void {
    mockComparePowerApi.reset();
    mockErcotESIIDApi.reset();
    mockDatabaseConnection.reset();
  }
}

// ============================================================================
// Vitest Mock Setup
// ============================================================================

/**
 * Setup mocks for Vitest tests
 */
export function setupApiMocks(): void {
  // Mock fetch globally for HTTP requests
  global.fetch = vi.fn();
  
  // Mock the actual service modules
  vi.mock('@/lib/api/comparepower-client', () => ({
    comparePowerClient: {
      fetchPlans: vi.fn((...args) => mockComparePowerApi.fetchPlans(...args)),
      healthCheck: vi.fn(() => mockComparePowerApi.healthCheck()),
      getCacheStats: vi.fn(() => mockComparePowerApi.getCacheStats())
    }
  }));
  
  vi.mock('@/lib/api/ercot-esiid-client', () => ({
    ercotESIIDClient: {
      resolveAddressToTDSP: vi.fn((...args) => mockErcotESIIDApi.resolveAddressToTDSP(...args)),
      lookupESIID: vi.fn((...args) => mockErcotESIIDApi.lookupESIID(...args)),
      healthCheck: vi.fn(() => mockErcotESIIDApi.healthCheck())
    }
  }));
  
  vi.mock('@/lib/database/connection-pool', () => ({
    db: {
      query: vi.fn((...args) => mockDatabaseConnection.query(...args)),
      getPoolStats: vi.fn(() => mockDatabaseConnection.getPoolStats())
    }
  }));
}

/**
 * Cleanup mocks after tests
 */
export function cleanupApiMocks(): void {
  vi.clearAllMocks();
  MockServiceFactory.resetAll();
}

// Export types for use in tests
export type {
  ComparePowerApiMock,
  ErcotESIIDApiMock,
  DatabaseConnectionMock
};
