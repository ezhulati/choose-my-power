# Technical Specifications

**Document**: Complete Technical Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  

## Core Technology Stack

### **Frontend Framework**
```javascript
// Primary Technologies
- Astro 5.13.4 (Static Site Generator with SSR)
- React 18.3.1 (Interactive Components)
- TypeScript 5.9.2 (Type Safety)
- Tailwind CSS 3.4.1 (Styling Framework)

// UI Component Library
- Radix UI (Accessible primitives)
- Lucide React (Icon system)
- shadcn/ui patterns (Component architecture)
```

### **Backend & Database**
```javascript
// Database Stack  
- PostgreSQL (Primary database via Neon)
- Drizzle ORM 0.44.5 (Type-safe database queries)
- Redis/ioredis 5.3.2 (Caching layer)

// Runtime & Deployment
- Node.js >=20.5.0 (Server runtime)
- Netlify Functions (Serverless deployment)
- Astro Server (SSR capabilities)
```

### **Build & Development Tools**
```javascript
// Build System
- Vite 5.4.10 (Build tool and dev server)
- esbuild (Fast bundling)
- PostCSS 8.4.35 (CSS processing)

// Testing Framework
- Vitest 3.2.4 (Unit testing)
- Playwright 1.55.0 (E2E testing)
- Testing Library (Component testing)

// Code Quality
- ESLint 9.9.1 (Linting)
- TypeScript ESLint (Type checking)
- Prettier (Code formatting)
```

## Architecture Patterns

### **Astro Architecture**
```typescript
// astro.config.mjs - Core configuration
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server', // SSR enabled
  adapter: conditionalAdapter(), // Netlify/Node based on env
  
  // Performance optimizations
  vite: {
    build: {
      rollupOptions: {
        manualChunks: strategicChunkStrategy
      }
    }
  }
});
```

### **React Integration Pattern**
```typescript
// Component architecture
/src/components/
├── ui/                 # Base UI components (78+ components)
├── plans/              # Plan-specific components  
├── faceted/            # Filtering system components
├── mobile/             # Mobile-optimized interfaces
├── address/            # Address validation components
└── agents/             # AI integration components

// Page architecture  
/src/pages/
├── [state].astro      # Dynamic state pages
├── electricity-plans/ # Plan comparison pages
├── texas/             # Texas-specific pages
└── api/               # Serverless API endpoints
```

### **Service Layer Architecture**
```typescript
// Service layer pattern - /src/lib/services/
interface ServiceLayer {
  // Core data services
  provider-service.ts    // Real provider data management
  city-service.ts       // City and demographic data  
  plan-service.ts       // Plan data with MongoDB ObjectIds
  
  // External integrations
  ercot-service.ts      // Texas grid operator integration
  tdsp-service.ts       // Utility territory management
  zip-validation-service.ts // ZIP code validation
  
  // Performance services
  cache-service.ts      // Redis caching abstractions
  analytics-service.ts  // User interaction tracking
}
```

## Database Architecture

### **Schema Design**
```sql
-- Primary tables structure
CREATE TABLE electricity_plans (
  id VARCHAR(24) PRIMARY KEY,  -- MongoDB ObjectId format
  name VARCHAR(255) NOT NULL,
  provider_id INTEGER REFERENCES providers(id),
  city_slug VARCHAR(100),
  rate_type VARCHAR(50),
  contract_length INTEGER,
  rate_cents_per_kwh DECIMAL(5,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  logo_url TEXT,
  website_url TEXT,
  rating DECIMAL(3,2),
  plans_count INTEGER DEFAULT 0
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  state VARCHAR(2) DEFAULT 'TX',
  zip_codes TEXT[], -- Array of ZIP codes
  tdsp_duns VARCHAR(20),
  population INTEGER,
  median_income INTEGER
);

CREATE TABLE tdsp_territories (
  id SERIAL PRIMARY KEY,
  duns VARCHAR(20) UNIQUE, -- TDSP identifier
  name VARCHAR(255) NOT NULL,
  service_area TEXT,
  delivery_charges JSONB -- Complex rate structures
);

CREATE TABLE zip_code_mappings (
  zip_code VARCHAR(5) PRIMARY KEY,
  city_id INTEGER REFERENCES cities(id),
  tdsp_duns VARCHAR(20) REFERENCES tdsp_territories(duns),
  is_deregulated BOOLEAN DEFAULT true
);
```

### **ORM Configuration**
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NETLIFY_DATABASE_URL!,
    ssl: true
  }
});

// Connection configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.NETLIFY_DATABASE_URL!, {
  ssl: 'require',
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 60
});

export const db = drizzle(client);
```

## API Architecture

### **API Endpoint Structure**
```typescript
// /src/pages/api/ - Serverless function endpoints

// Plan Management APIs
GET  /api/plans/search        // Dynamic plan ID resolution
GET  /api/plans/filter        // Multi-dimensional filtering  
GET  /api/plans/compare       // Side-by-side comparison
GET  /api/plans/list          // City-specific plan listings
POST /api/plans/suggestions   // Intelligent plan recommendations

// Location & Validation APIs
POST /api/zip/validate        // ZIP code validation with TDSP
POST /api/zip/navigate        // Direct ZIP-to-plans routing
POST /api/ercot/validate      // ESID generation and validation
POST /api/address/validate    // USPS address standardization

// Search & Discovery APIs  
GET  /api/search/faceted      // Multi-dimensional search
GET  /api/search/autocomplete // Search suggestions
GET  /api/facets/[city]       // City-specific filter options

// System APIs
GET  /api/health/system       // System health monitoring
GET  /api/health/database     // Database connectivity check
POST /api/analytics/interaction // User interaction tracking
```

### **API Response Standards**
```typescript
// Standard API response format
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    performance: {
      responseTime: number;
      source: 'database' | 'cache' | 'api';
    };
  };
}

// Example implementation
export async function GET({ params, request }: APIContext) {
  const startTime = performance.now();
  
  try {
    const data = await getPlansForCity(params.city);
    
    return new Response(JSON.stringify({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        performance: {
          responseTime: performance.now() - startTime,
          source: 'database'
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## Build System Architecture

### **Data Generation Pipeline**
```javascript
// scripts/build-data-smart.mjs - Enterprise build system

class SmartDataBuilder {
  constructor() {
    this.config = {
      maxCities: process.env.MAX_CITIES || 881,
      batchSize: process.env.BATCH_SIZE || 10,
      batchDelay: process.env.BATCH_DELAY_MS || 2000,
      useCachedData: process.env.USE_CACHED_DATA !== 'false'
    };
  }

  async buildAllCityData() {
    // Intelligent caching strategy
    const cacheStatus = await this.checkCacheValidity();
    
    if (cacheStatus.isValid && this.config.useCachedData) {
      console.log('✅ Using cached data (build time <30s)');
      return this.loadCachedData();
    }
    
    // Fresh data generation
    console.log('🔄 Generating fresh data (build time <8min)');
    return this.generateFreshData();
  }

  async generateFreshData() {
    const cities = await this.loadTexasCities();
    const batches = this.createBatches(cities, this.config.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(batch);
      await this.delay(this.config.batchDelay); // Rate limiting
    }
    
    await this.generateAggregateData();
    await this.updateCacheMetadata();
  }
}
```

### **Build Performance Targets**
```yaml
# Performance specifications
Build Performance:
  cached_builds: "<30 seconds"
  fresh_builds: "<8 minutes" 
  incremental_builds: "<2 minutes"
  
Data Processing:
  texas_cities: 881
  api_requests: "Batched with circuit breakers"
  error_recovery: "Exponential backoff"
  
Caching Strategy:
  hot_cache: "Frequently accessed cities"
  warm_cache: "Medium priority cities"  
  cold_cache: "Low priority cities"
```

## Performance Optimization

### **Core Web Vitals Strategy**
```javascript
// astro.config.mjs - Performance optimization
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        // Strategic code splitting for optimal loading
        manualChunks: (id) => {
          if (id.includes('react')) return 'vendor-react';      // Load first
          if (id.includes('ui')) return 'vendor-ui';            // Preload  
          if (id.includes('api')) return 'api-system';          // Lazy load
          if (id.includes('faceted')) return 'faceted-system';  // Route-based
          if (id.includes('mobile')) return 'mobile-system';    // Conditional
        }
      }
    }
  },
  
  // Image optimization
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        formats: ['avif', 'webp'],
        quality: { avif: 70, webp: 80 },
        loading: 'lazy'
      }
    }
  }
});
```

### **Caching Architecture**
```typescript
// /src/lib/cache/ - Redis caching system
interface CacheStrategy {
  // Multi-tier caching
  level1: 'In-memory cache (Node.js)';
  level2: 'Redis cache (shared)';
  level3: 'Generated JSON files (fallback)';
  
  // Cache invalidation
  strategies: ['Time-based', 'Event-driven', 'Manual'];
  
  // Performance targets
  hit_ratio: '>85%';
  response_time: '<100ms cache hits';
}

export class CacheManager {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get<T>(key: string): Promise<T | null> {
    // L1 cache check
    const l1Result = this.memoryCache.get(key);
    if (l1Result) return l1Result;
    
    // L2 cache check  
    const l2Result = await this.redis.get(key);
    if (l2Result) {
      this.memoryCache.set(key, JSON.parse(l2Result));
      return JSON.parse(l2Result);
    }
    
    return null;
  }
}
```

## Security Architecture

### **Input Validation**
```typescript
// Zod schemas for all API inputs
import { z } from 'zod';

export const ZipValidationSchema = z.object({
  zipCode: z.string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits')
    .refine(isValidTexasZip, 'ZIP code must be in Texas'),
  source: z.enum(['user_input', 'geolocation']).optional()
});

export const PlanSearchSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(50), 
  city: z.string().min(1).max(50),
  filters: z.object({
    contractLength: z.number().min(1).max(36).optional(),
    rateType: z.enum(['fixed', 'variable', 'indexed']).optional(),
    greenEnergy: z.boolean().optional()
  }).optional()
});
```

### **Plan ID Security (Constitutional Requirement)**
```typescript
// CRITICAL: Never hardcode plan IDs or ESIDs
// This system prevents wrong plan orders

export async function getPlanObjectId(
  planName: string, 
  providerName: string, 
  citySlug: string
): Promise<string | null> {
  // Dynamic resolution only
  const plan = await db
    .select({ id: electricityPlans.id })
    .from(electricityPlans)
    .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
    .where(
      and(
        eq(electricityPlans.name, planName),
        eq(providers.name, providerName),
        eq(electricityPlans.citySlug, citySlug)
      )
    )
    .limit(1);
    
  return plan[0]?.id || null;
}

// Validation script to prevent hardcoded IDs
export function validateNoHardcodedIds() {
  const hardcodedPattern = /68b[0-9a-f]{21}/g; // MongoDB ObjectId pattern
  // Scan all source files and fail build if found
}
```

### **ESID Lookup (ComparePower ERCOT API Integration)**
```typescript
// CRITICAL: ESIDs must be looked up from ERCOT via ComparePower API, never hardcoded
export async function lookupESIDs(address: string, zipCode: string): Promise<ESIDResult[]> {
  // Call ComparePower ERCOT API for address search
  const response = await fetch(
    `https://ercot.api.comparepower.com/api/esiids?` + 
    new URLSearchParams({ address, zip_code: zipCode }),
    {
      headers: {
        'Authorization': `Bearer ${process.env.COMPAREPOWER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('ERCOT API lookup failed');
  }
  
  const data = await response.json();
  
  return data.esiids.map(esid => ({
    esiid: esid.esiid,
    serviceAddress: esid.service_address,
    city: esid.city,
    state: esid.state,
    zipCode: esid.zip_code,
    tdspCode: esid.tdsp_code,
    tdspName: esid.tdsp_name,
    premiseType: esid.premise_type,
    meterStatus: esid.meter_status,
    isActive: esid.meter_status === 'ACTIVE'
  }));
}

// Validate specific ESIID details
export async function validateESID(esiid: string): Promise<ESIDDetails> {
  const response = await fetch(
    `https://ercot.api.comparepower.com/api/esiids/${esiid}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.COMPAREPOWER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('ESIID not found in ERCOT system');
  }
  
  return await response.json();
}
```

## Development Environment

### **Required Software Versions**
```json
{
  "engines": {
    "node": ">=20.5.0",
    "npm": ">=10.2.0"
  },
  "volta": {
    "node": "20.5.0",
    "npm": "10.2.0"
  }
}
```

### **Environment Variables**
```bash
# Development
NODE_ENV=development
LOCAL_BUILD=true

# Database
NETLIFY_DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_URL=fallback_url

# API Integration
COMPAREPOWER_API_KEY=your_api_key
ERCOT_API_KEY=your_ercot_key

# Performance  
USE_CACHED_DATA=true
MAX_CITIES=10
BATCH_SIZE=5
BATCH_DELAY_MS=2000

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Monitoring
ANALYTICS_KEY=your_analytics_key
```

### **Development Scripts**
```bash
# Core Development
npm run dev              # Start development server (port 4324)
npm run build           # Full production build
npm run build:local     # Local build with Node adapter

# Data Management  
npm run build:data:smart    # Smart cached build (<30s)
npm run build:data:fresh    # Fresh data build (<8min)
npm run build:data:881      # Full Texas build (881 cities)

# Testing
npm run test            # Unit tests with Vitest
npm run test:e2e        # E2E tests with Playwright
npm run test:all        # Complete test suite

# Quality Assurance
npm run lint            # ESLint checking
npm run validate:ids    # Check for hardcoded IDs (critical)
npm run security:audit  # Security scanning
```

This technical specification provides the complete foundation for implementing the ChooseMyPower platform with all architectural patterns, security requirements, and performance optimizations needed for enterprise-scale deployment.