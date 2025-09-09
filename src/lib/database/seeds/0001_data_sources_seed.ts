/**
 * Data Sources Seed Data
 * Seeds the data_sources table with Texas electricity market API configurations
 */

import { db } from '../init';
import { dataSources, type NewDataSource } from '../schema/data-source';
import { TEXAS_DATA_SOURCES, DATA_SOURCE_TYPES } from '../schema/data-source';

// Seed data for Texas electricity market data sources
const dataSourcesSeedData: NewDataSource[] = [
  {
    name: TEXAS_DATA_SOURCES.ERCOT_MIS.name,
    slug: TEXAS_DATA_SOURCES.ERCOT_MIS.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.ercot.com/api/1/services/read',
    apiVersion: 'v1',
    authentication: {
      type: 'none' // ERCOT MIS is public API
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
        requestsPerDay: 86400,
        burstLimit: 10
      },
      timeouts: {
        connect: 5000,
        read: 30000,
        total: 35000
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      endpoints: {
        serviceTerritoryLookup: {
          path: '/np4-745-cd/service-territory-lookup',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        },
        loadZoneLookup: {
          path: '/np4-745-er/load-zone-lookup',
          method: 'GET',
          cache: {
            enabled: true,
            ttl: 3600 // 1 hour
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 60000
      }
    },
    isActive: true,
    priority: 95,
    reliability: 98,
    metadata: {
      description: 'Official ERCOT market data and territory mappings',
      region: 'texas',
      category: 'electricity_market',
      coverage: 'statewide',
      dataTypes: ['service_territory', 'load_zone', 'tdsp_mapping'],
      updateFrequency: 'daily',
      officialSource: true
    }
  },
  {
    name: TEXAS_DATA_SOURCES.PUCT_REP_DIRECTORY.name,
    slug: TEXAS_DATA_SOURCES.PUCT_REP_DIRECTORY.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'http://www.puc.texas.gov/industry/electric/directories',
    apiVersion: 'v2',
    authentication: {
      type: 'none' // PUCT directory is public
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 1800,
        requestsPerDay: 43200,
        burstLimit: 5
      },
      timeouts: {
        connect: 10000,
        read: 45000,
        total: 50000
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 15000,
        backoffMultiplier: 2.5
      },
      endpoints: {
        repDirectory: {
          path: '/rep/REP_DIRECTORY.aspx',
          method: 'GET',
          cache: {
            enabled: true,
            ttl: 21600 // 6 hours
          }
        },
        serviceAreas: {
          path: '/rep/service-areas.json',
          method: 'GET',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 120000
      }
    },
    isActive: true,
    priority: 90,
    reliability: 95,
    metadata: {
      description: 'Official PUCT provider certification data',
      region: 'texas',
      category: 'regulatory',
      coverage: 'statewide',
      dataTypes: ['provider_certification', 'service_areas', 'deregulation_status'],
      updateFrequency: 'weekly',
      officialSource: true
    }
  },
  {
    name: TEXAS_DATA_SOURCES.ONCOR_TERRITORY_API.name,
    slug: TEXAS_DATA_SOURCES.ONCOR_TERRITORY_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.oncor.com/api/territory',
    apiVersion: 'v1',
    authentication: {
      type: 'api_key',
      keyHeader: 'X-API-Key'
      // API key would be stored in environment variables, not in seed data
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 7200,
        requestsPerDay: 172800,
        burstLimit: 20
      },
      timeouts: {
        connect: 3000,
        read: 15000,
        total: 20000
      },
      retryPolicy: {
        maxRetries: 4,
        baseDelay: 500,
        maxDelay: 8000,
        backoffMultiplier: 2
      },
      endpoints: {
        zipLookup: {
          path: '/zip-lookup',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 43200 // 12 hours
          }
        },
        addressValidation: {
          path: '/address-validation',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 21600 // 6 hours
          }
        },
        serviceBoundary: {
          path: '/service-boundary',
          method: 'GET',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 8,
        recoveryTimeout: 90000
      }
    },
    isActive: true,
    priority: 85,
    reliability: 92,
    metadata: {
      description: 'Oncor TDSP territory validation - North Texas',
      region: 'north_texas',
      category: 'utility_tdsp',
      coverage: 'north_texas',
      dataTypes: ['zip_territory', 'address_validation', 'service_boundary'],
      updateFrequency: 'realtime',
      officialSource: true,
      serviceArea: ['dallas', 'fort-worth', 'plano', 'irving', 'garland', 'mesquite']
    }
  },
  {
    name: TEXAS_DATA_SOURCES.CENTERPOINT_TERRITORY_API.name,
    slug: TEXAS_DATA_SOURCES.CENTERPOINT_TERRITORY_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.centerpointenergy.com/api/service-area',
    apiVersion: 'v2',
    authentication: {
      type: 'bearer'
      // Token would be obtained via OAuth and stored in environment
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 6000,
        requestsPerDay: 144000,
        burstLimit: 15
      },
      timeouts: {
        connect: 4000,
        read: 20000,
        total: 25000
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 750,
        maxDelay: 12000,
        backoffMultiplier: 2.2
      },
      endpoints: {
        territoryCheck: {
          path: '/territory-check',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 21600 // 6 hours
          }
        },
        zipValidation: {
          path: '/zip-validation',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 43200 // 12 hours
          }
        },
        serviceMap: {
          path: '/service-map',
          method: 'GET',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 6,
        recoveryTimeout: 120000
      }
    },
    isActive: true,
    priority: 85,
    reliability: 90,
    metadata: {
      description: 'CenterPoint TDSP territory validation - Houston area',
      region: 'houston_area',
      category: 'utility_tdsp',
      coverage: 'houston_area',
      dataTypes: ['zip_territory', 'address_validation', 'service_map'],
      updateFrequency: 'realtime',
      officialSource: true,
      serviceArea: ['houston', 'baytown', 'pearland', 'sugar-land', 'the-woodlands']
    }
  },
  {
    name: TEXAS_DATA_SOURCES.USPS_ADDRESS_API.name,
    slug: TEXAS_DATA_SOURCES.USPS_ADDRESS_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
    apiVersion: 'v1',
    authentication: {
      type: 'api_key',
      keyHeader: 'userid'
      // USPS API uses userid parameter
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 3000,
        requestsPerDay: 72000,
        burstLimit: 10
      },
      timeouts: {
        connect: 5000,
        read: 25000,
        total: 30000
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 1500,
        maxDelay: 10000,
        backoffMultiplier: 3
      },
      endpoints: {
        addressValidation: {
          path: '?API=Verify&XML=',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 604800 // 7 days (addresses don't change often)
          }
        },
        zipLookup: {
          path: '?API=ZipCodeLookup&XML=',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 2592000 // 30 days
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 180000
      }
    },
    isActive: true,
    priority: 80,
    reliability: 96,
    metadata: {
      description: 'Official USPS address standardization',
      region: 'national',
      category: 'address_validation',
      coverage: 'national',
      dataTypes: ['address_standardization', 'zip_lookup', 'city_state_validation'],
      updateFrequency: 'continuous',
      officialSource: true
    }
  },
  {
    name: TEXAS_DATA_SOURCES.AEP_NORTH_API.name,
    slug: TEXAS_DATA_SOURCES.AEP_NORTH_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.aeptexas.com/api/north',
    apiVersion: 'v1',
    authentication: {
      type: 'basic'
      // Username/password would be in environment variables
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 40,
        requestsPerHour: 2400,
        requestsPerDay: 57600,
        burstLimit: 8
      },
      timeouts: {
        connect: 6000,
        read: 30000,
        total: 40000
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 16000,
        backoffMultiplier: 4
      },
      endpoints: {
        serviceTerritory: {
          path: '/service-territory',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 4,
        recoveryTimeout: 240000
      }
    },
    isActive: true,
    priority: 75,
    reliability: 88,
    metadata: {
      description: 'AEP Texas North service territory data',
      region: 'west_texas',
      category: 'utility_tdsp',
      coverage: 'west_texas',
      dataTypes: ['service_territory', 'zip_validation'],
      updateFrequency: 'daily',
      officialSource: true,
      serviceArea: ['abilene', 'amarillo', 'lubbock', 'odessa', 'midland']
    }
  },
  {
    name: TEXAS_DATA_SOURCES.AEP_CENTRAL_API.name,
    slug: TEXAS_DATA_SOURCES.AEP_CENTRAL_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.aeptexas.com/api/central',
    apiVersion: 'v1',
    authentication: {
      type: 'basic'
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 40,
        requestsPerHour: 2400,
        requestsPerDay: 57600,
        burstLimit: 8
      },
      timeouts: {
        connect: 6000,
        read: 30000,
        total: 40000
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 16000,
        backoffMultiplier: 4
      },
      endpoints: {
        serviceTerritory: {
          path: '/service-territory',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 4,
        recoveryTimeout: 240000
      }
    },
    isActive: true,
    priority: 75,
    reliability: 88,
    metadata: {
      description: 'AEP Texas Central service territory data',
      region: 'south_texas',
      category: 'utility_tdsp',
      coverage: 'south_texas',
      dataTypes: ['service_territory', 'zip_validation'],
      updateFrequency: 'daily',
      officialSource: true,
      serviceArea: ['corpus-christi', 'laredo', 'mcallen', 'harlingen', 'brownsville']
    }
  },
  {
    name: TEXAS_DATA_SOURCES.TNMP_API.name,
    slug: TEXAS_DATA_SOURCES.TNMP_API.slug,
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.tnmp.com/api/territory',
    apiVersion: 'v1',
    authentication: {
      type: 'api_key',
      keyHeader: 'Authorization'
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 1800,
        requestsPerDay: 43200,
        burstLimit: 5
      },
      timeouts: {
        connect: 8000,
        read: 35000,
        total: 45000
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 3000,
        maxDelay: 20000,
        backoffMultiplier: 3
      },
      endpoints: {
        zipValidation: {
          path: '/zip-validation',
          method: 'POST',
          cache: {
            enabled: true,
            ttl: 86400 // 24 hours
          }
        }
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 300000
      }
    },
    isActive: true,
    priority: 70,
    reliability: 85,
    metadata: {
      description: 'TNMP service territory validation',
      region: 'east_texas',
      category: 'utility_tdsp',
      coverage: 'east_texas',
      dataTypes: ['zip_validation', 'service_territory'],
      updateFrequency: 'daily',
      officialSource: true,
      serviceArea: ['beaumont', 'port-arthur', 'galveston', 'texas-city', 'victoria']
    }
  },
  {
    name: TEXAS_DATA_SOURCES.INTERNAL_CACHE.name,
    slug: TEXAS_DATA_SOURCES.INTERNAL_CACHE.slug,
    type: DATA_SOURCE_TYPES.CACHE,
    baseUrl: 'redis://localhost:6379',
    authentication: {
      type: 'none'
    },
    configuration: {
      rateLimits: {
        requestsPerMinute: 10000,
        requestsPerHour: 600000,
        requestsPerDay: 14400000,
        burstLimit: 1000
      },
      timeouts: {
        connect: 1000,
        read: 2000,
        total: 3000
      },
      retryPolicy: {
        maxRetries: 1,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2
      },
      endpoints: {
        get: { path: '/', method: 'GET', cache: { enabled: false, ttl: 0 } },
        set: { path: '/', method: 'POST', cache: { enabled: false, ttl: 0 } },
        del: { path: '/', method: 'DELETE', cache: { enabled: false, ttl: 0 } }
      }
    },
    isActive: true,
    priority: 100,
    reliability: 99,
    metadata: {
      description: 'High-speed internal cache for validated data',
      region: 'internal',
      category: 'cache',
      coverage: 'application',
      dataTypes: ['cache'],
      updateFrequency: 'realtime',
      officialSource: false
    }
  }
];

/**
 * Seed data sources table with Texas electricity market APIs
 */
export async function seedDataSources() {
  try {
    console.log('🌱 Starting data sources seed...');
    
    // Insert seed data
    const inserted = await db.insert(dataSources).values(dataSourcesSeedData).returning();
    
    console.log(`✅ Successfully seeded ${inserted.length} data sources:`);
    inserted.forEach(source => {
      console.log(`   - ${source.name} (${source.slug}) - Priority: ${source.priority}, Reliability: ${source.reliability}%`);
    });
    
    return inserted;
  } catch (error) {
    console.error('❌ Error seeding data sources:', error);
    throw error;
  }
}

/**
 * Update data source statistics (for development/testing)
 */
export async function updateDataSourceStats() {
  try {
    console.log('📊 Updating data source statistics...');
    
    // Update last_success for all active sources
    const updated = await db
      .update(dataSources)
      .set({ 
        lastSuccess: new Date(),
        averageResponseTime: 2500 // Mock average response time
      })
      .where(eq(dataSources.isActive, true))
      .returning();
    
    console.log(`✅ Updated statistics for ${updated.length} data sources`);
    return updated;
  } catch (error) {
    console.error('❌ Error updating data source stats:', error);
    throw error;
  }
}

// Export for use in main seed runner
export { dataSourcesSeedData };

import { eq } from 'drizzle-orm';