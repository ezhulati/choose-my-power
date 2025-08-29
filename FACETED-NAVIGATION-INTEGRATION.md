# Faceted Navigation System - Integration Documentation

## Overview

The ChooseMyPower faceted navigation system provides enterprise-grade filtering and search capabilities for Texas electricity plans across 880+ cities. This documentation covers integration, deployment, and maintenance of the complete system.

## System Architecture

### Core Components

1. **Routing Layer** (`/src/pages/texas/[city]/electricity-plans/`)
   - Handles legacy URL redirects to canonical format
   - Validates city slugs and filters
   - Implements SEO-friendly 301 redirects

2. **API Layer** (`/src/pages/api/`)
   - `/api/search/faceted` - Main search endpoint with real-time filtering
   - `/api/facets/[city]` - City-specific facet metadata and counts
   - `/api/plans/filter` - Real-time plan filtering with debouncing
   - `/api/search/faceted-autocomplete` - Context-aware search suggestions

3. **Component Layer** (`/src/components/faceted/`)
   - `FacetedPlanSearch` - Main orchestration component
   - `EnhancedFacetedSidebar` - Desktop filtering interface
   - `MobileFacetedSearch` - Touch-optimized mobile interface
   - `PlanResultsGrid` - Enhanced plan display with virtual scrolling
   - `FilterBreadcrumb` - Hierarchical navigation component

4. **State Management** (`/src/lib/faceted/`)
   - `url-state-manager` - URL encoding/decoding for filters
   - `performance-optimizer` - Caching, debouncing, request management
   - `faceted-router` - URL validation and sitemap generation

5. **Database Layer** (`/src/lib/database/`)
   - Enhanced schema with JSONB facet fields
   - GIN indexes for high-performance faceted queries
   - Full-text search vector support

## Integration Guide

### 1. Database Setup

The system requires PostgreSQL with JSONB support. Ensure these schema enhancements are applied:

```sql
-- Add faceted search columns to electricity_plans table
ALTER TABLE electricity_plans ADD COLUMN IF NOT EXISTS facets JSONB DEFAULT '{}';
ALTER TABLE electricity_plans ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE electricity_plans ADD COLUMN IF NOT EXISTS city_slug VARCHAR(255);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_plans_facets_gin ON electricity_plans USING gin(facets);
CREATE INDEX IF NOT EXISTS idx_plans_search_vector ON electricity_plans USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_plans_city_rate_type ON electricity_plans(city_slug, rate_type);
CREATE INDEX IF NOT EXISTS idx_plans_city_term ON electricity_plans(city_slug, term_months);
CREATE INDEX IF NOT EXISTS idx_plans_city_green ON electricity_plans(city_slug, percent_green);
```

### 2. API Integration

All faceted APIs follow a consistent pattern:

#### Faceted Search API
```typescript
// POST /api/search/faceted
interface FacetedSearchRequest {
  citySlug: string;
  filters: FilterState;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeFacets?: boolean;
  sessionId?: string;
}

interface FacetedSearchResponse {
  success: boolean;
  plans: Plan[];
  totalCount: number;
  facets?: FacetCounts;
  metadata: SearchMetadata;
  performance: PerformanceMetrics;
}
```

#### Integration Example
```typescript
import { FacetedPlanSearch } from '@/components/faceted/FacetedPlanSearch';

// In your Astro page component
---
const { city } = Astro.params;
const citySlug = formatCitySlug(city);
---

<FacetedPlanSearch 
  citySlug={citySlug}
  initialFilters={{}}
  enableAnalytics={true}
  performanceMode="optimized"
  client:load 
/>
```

### 3. URL Structure and Routing

The system uses hierarchical URL structures:

```
Base URL: /electricity-plans/{city-slug}/
Filtered URLs: /electricity-plans/{city-slug}/{filter1}/{filter2}/

Examples:
- /electricity-plans/dallas-tx/
- /electricity-plans/dallas-tx/12-month/
- /electricity-plans/dallas-tx/12-month/fixed-rate/
- /electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/
```

#### URL State Management
```typescript
import { urlStateManager } from '@/lib/faceted/url-state-manager';

// Parse current URL
const { citySlug, filterState, isValid } = urlStateManager.parseUrl(window.location.pathname);

// Update URL with new filters
urlStateManager.updateUrl(citySlug, newFilterState, { historyMethod: 'push' });

// Generate canonical URL for SEO
const canonicalUrl = urlStateManager.getCanonicalUrl(citySlug, filterState);
```

### 4. Component Integration

#### Desktop Integration
```tsx
import { FacetedPlanSearch } from '@/components/faceted/FacetedPlanSearch';

<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <div className="lg:col-span-1">
    {/* Sidebar will be rendered by FacetedPlanSearch */}
  </div>
  <div className="lg:col-span-3">
    <FacetedPlanSearch 
      citySlug="dallas-tx"
      initialFilters={{}}
      enableAnalytics={true}
      performanceMode="optimized"
    />
  </div>
</div>
```

#### Mobile Integration
```tsx
import { MobileFacetedSearch } from '@/components/faceted/MobileFacetedSearch';

<div className="block lg:hidden">
  <MobileFacetedSearch 
    citySlug="dallas-tx"
    initialFilters={{}}
    onFilterChange={handleFilterChange}
  />
</div>
```

### 5. Performance Optimization

The system includes enterprise-grade performance optimization:

#### Caching Configuration
```typescript
import { performanceOptimizer } from '@/lib/faceted/performance-optimizer';

// Configure cache settings
const optimizer = new PerformanceOptimizer({
  maxSize: 1000,           // Cache 1000 search results
  ttl: 300000,            // 5-minute TTL
  staleWhileRevalidate: true
}, {
  enableCache: true,
  enableDebounce: true,
  debounceDelay: 300,     // 300ms debounce
  enableLazyLoading: true,
  maxConcurrentRequests: 5
});
```

#### Request Debouncing
```typescript
const debouncedSearch = performanceOptimizer.debounce(
  'faceted-search',
  async (filters) => {
    const response = await fetch('/api/search/faceted', {
      method: 'POST',
      body: JSON.stringify({ citySlug, filters })
    });
    return response.json();
  },
  300
);
```

## Deployment Guide

### 1. Environment Configuration

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_SSL=true

# Redis Cache (optional but recommended)
REDIS_URL=redis://host:port
REDIS_PASSWORD=your-password

# Performance Settings
NODE_ENV=production
ENABLE_PERFORMANCE_MONITORING=true
FACETED_CACHE_TTL=300000
MAX_CONCURRENT_REQUESTS=10

# Feature Flags
ENABLE_FACETED_ANALYTICS=true
ENABLE_VIRTUAL_SCROLLING=true
ENABLE_MOBILE_OPTIMIZATIONS=true
```

### 2. Build Configuration

Update your `astro.config.mjs`:

```javascript
export default defineConfig({
  // ... existing config
  experimental: {
    serverIslands: true
  },
  vite: {
    define: {
      'import.meta.env.ENABLE_FACETED_ANALYTICS': JSON.stringify(process.env.ENABLE_FACETED_ANALYTICS || 'false'),
      'import.meta.env.FACETED_CACHE_TTL': JSON.stringify(process.env.FACETED_CACHE_TTL || '300000')
    },
    optimizeDeps: {
      include: ['@faceted/performance-optimizer', '@faceted/url-state-manager']
    }
  }
});
```

### 3. Database Migrations

Run database migrations in production:

```bash
# Apply faceted search schema enhancements
npm run db:migrate:faceted

# Generate faceted indexes (can take time for large datasets)
npm run db:index:faceted

# Update search vectors for existing plans
npm run db:update:search-vectors
```

### 4. Performance Monitoring

#### Core Web Vitals Monitoring
```typescript
// Add to your performance monitoring
import { performanceOptimizer } from '@/lib/faceted/performance-optimizer';

// Monitor faceted search performance
const metrics = performanceOptimizer.getMetrics();
console.log('Faceted Search Metrics:', {
  averageSearchTime: metrics.searchTime,
  cacheHitRate: metrics.cacheHitRate,
  totalApiCalls: metrics.apiCalls,
  memoryUsage: metrics.memoryUsage
});

// Alert thresholds
if (metrics.searchTime > 500) {
  console.warn('Faceted search response time exceeds 500ms');
}
if (metrics.cacheHitRate < 0.7) {
  console.warn('Cache hit rate below 70%');
}
```

#### Database Query Monitoring
```sql
-- Monitor faceted query performance
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%facets%' 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 5. CDN and Caching Strategy

#### Static Asset Optimization
```javascript
// In your build process
const facetedAssets = [
  'faceted-search.js',
  'mobile-faceted.js',
  'performance-optimizer.js'
];

// Configure long-term caching
facetedAssets.forEach(asset => {
  // Set 1-year cache with ETags
  setCacheHeaders(asset, { maxAge: 31536000, etag: true });
});
```

#### API Response Caching
```typescript
// Configure API response caching
export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'ETag': generateETag(data)
    }
  });
};
```

## Testing and Validation

### 1. Integration Tests

Run the comprehensive test suite:

```bash
# Run faceted navigation integration tests
npm run test:faceted

# Run performance benchmarks
npm run test:performance:faceted

# Run E2E tests for faceted navigation
npm run test:e2e:faceted
```

### 2. Load Testing

Test system performance under load:

```typescript
// Load test configuration
const loadTest = {
  concurrent_users: 100,
  test_duration: '10m',
  scenarios: [
    { url: '/electricity-plans/dallas-tx/', weight: 40 },
    { url: '/electricity-plans/dallas-tx/12-month/', weight: 30 },
    { url: '/electricity-plans/houston-tx/fixed-rate/', weight: 20 },
    { url: '/api/search/faceted', method: 'POST', weight: 10 }
  ],
  thresholds: {
    http_req_duration: ['p95<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01']  // Error rate under 1%
  }
};
```

### 3. Performance Validation

#### Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Faceted Search Response**: < 300ms (P95)

#### Memory Usage Monitoring
```typescript
// Monitor memory usage in production
setInterval(() => {
  const metrics = performanceOptimizer.getMetrics();
  if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected:', metrics.memoryUsage);
    performanceOptimizer.optimizeMemory();
  }
}, 60000); // Check every minute
```

## Maintenance and Operations

### 1. Cache Management

#### Cache Invalidation Strategy
```typescript
// Invalidate faceted caches when plans are updated
export async function invalidateFacetedCache(citySlug: string) {
  const cacheKeys = [
    `facets:${citySlug}`,
    `search:${citySlug}:*`,
    `plans:${citySlug}:*`
  ];
  
  await Promise.all(
    cacheKeys.map(key => redis.del(key))
  );
}

// Auto-invalidation on data updates
export async function updateElectricityPlans(plans: Plan[]) {
  await savePlans(plans);
  
  // Get affected cities
  const affectedCities = [...new Set(plans.map(p => p.city_slug))];
  
  // Invalidate caches for affected cities
  await Promise.all(
    affectedCities.map(citySlug => invalidateFacetedCache(citySlug))
  );
}
```

### 2. Analytics and Monitoring

#### Search Analytics
```typescript
// Track faceted search usage
interface FacetedAnalytics {
  searchQuery: string;
  filters: FilterState;
  results: number;
  responseTime: number;
  userAgent: string;
  sessionId: string;
}

// Log search analytics
export function trackFacetedSearch(analytics: FacetedAnalytics) {
  // Send to your analytics platform
  analyticsClient.track('faceted_search', {
    ...analytics,
    timestamp: new Date().toISOString()
  });
}
```

#### Error Monitoring
```typescript
// Monitor faceted search errors
export function monitorFacetedErrors() {
  // API error tracking
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('faceted')) {
      console.error('Faceted search error:', event.reason);
      // Send to error tracking service
    }
  });
}
```

### 3. Database Maintenance

#### Regular Maintenance Tasks
```sql
-- Update search vectors (run weekly)
UPDATE electricity_plans 
SET search_vector = to_tsvector('english', 
  COALESCE(plan_name, '') || ' ' ||
  COALESCE(provider, '') || ' ' ||
  COALESCE(features::text, '')
)
WHERE search_vector IS NULL OR updated_at > NOW() - INTERVAL '7 days';

-- Rebuild faceted indexes (run monthly)
REINDEX INDEX CONCURRENTLY idx_plans_facets_gin;
REINDEX INDEX CONCURRENTLY idx_plans_search_vector;

-- Analyze table statistics (run weekly)
ANALYZE electricity_plans;
```

## Troubleshooting

### Common Issues

#### 1. Slow Faceted Search Response
**Symptoms**: Search takes >500ms, high CPU usage
**Solutions**:
- Check database index usage: `EXPLAIN ANALYZE` on faceted queries
- Increase cache TTL and hit rate
- Consider database connection pooling
- Review API rate limiting settings

#### 2. High Memory Usage
**Symptoms**: Memory usage growing over time
**Solutions**:
- Call `performanceOptimizer.optimizeMemory()` regularly
- Reduce cache size configuration
- Enable garbage collection monitoring
- Review virtual scrolling implementation

#### 3. Mobile Performance Issues
**Symptoms**: Slow scrolling, delayed touch responses
**Solutions**:
- Enable hardware acceleration in CSS
- Reduce virtual scrolling item count
- Optimize touch event handlers
- Test on actual devices, not just browser dev tools

#### 4. Cache Inconsistency
**Symptoms**: Stale results, outdated facet counts
**Solutions**:
- Implement proper cache invalidation strategy
- Use cache versioning for breaking changes
- Monitor cache hit rates and TTL settings
- Consider cache warming for popular cities

### Performance Debugging

```typescript
// Enable debug mode
localStorage.setItem('faceted-debug', 'true');

// Monitor search performance
const searchMetrics = performanceOptimizer.getMetrics();
console.table(searchMetrics);

// Debug URL state issues
const urlDebug = urlStateManager.parseUrl(window.location.pathname);
console.log('URL State Debug:', urlDebug);
```

## Conclusion

The faceted navigation system provides enterprise-grade filtering capabilities optimized for Texas electricity plan comparison. Follow this integration guide for successful deployment and maintain the system using the provided monitoring and maintenance procedures.

For additional support or questions about the faceted navigation system, refer to the component documentation in `/src/components/faceted/` or the API documentation in `/src/pages/api/`.