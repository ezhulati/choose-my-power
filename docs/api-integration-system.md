# ComparePower API Integration System

## Overview

The ChooseMyPower.org platform uses a production-ready API integration system designed to handle high traffic loads while maintaining excellent performance and reliability. This document provides comprehensive information about the system architecture, components, and usage.

## System Architecture

### Tiered Caching Strategy

```
User Request → Memory Cache → Redis Cache → Database Cache → API → Response
```

1. **Memory Cache**: Ultra-fast in-process cache (< 1ms lookup)
2. **Redis Cache**: Distributed cache for scalability (< 10ms lookup)  
3. **Database Cache**: PostgreSQL persistent cache (< 50ms lookup)
4. **API Fallback**: ComparePower API as the source of truth

### Core Components

#### 1. Enhanced API Client (`comparepower-client.ts`)

**Production-Ready Features:**
- Circuit breaker pattern for resilience
- Exponential backoff retry logic (5 attempts)
- Rate limiting (10 requests/second, 20 burst)
- Request/response validation
- Comprehensive error handling
- Performance monitoring and metrics
- Graceful degradation strategies

**Error Handling:**
- Network timeouts and failures
- HTTP error status codes
- Invalid API responses
- Rate limiting
- Circuit breaker states
- Fallback data strategies

#### 2. Redis Caching Layer (`redis-cache.ts`)

**Features:**
- Tiered caching with memory + Redis
- Cache warming for popular cities
- TTL management (1 hour default)
- Automatic cleanup and LRU eviction
- Connection resilience
- Performance metrics

**Cache Warming Strategy:**
- Pre-loads popular cities: Dallas, Houston, Austin, South Texas
- Common filter combinations: default, 12-month, 24-month, 100% green
- Runs automatically in production
- Reduces cold start latency

#### 3. Error Handling System (`errors.ts`)

**Error Categories:**
- Network errors (timeout, DNS, connectivity)
- HTTP errors (401, 403, 404, 429, 5xx)
- API-specific errors (invalid TDSP, no plans, validation)
- Circuit breaker states
- Cache/fallback errors

**User-Friendly Messages:**
- Contextual error messages with city names
- Actionable suggestions for users
- Differentiated messaging for different error types

#### 4. TDSP Validation System (`tdsp-validator.ts`)

**Capabilities:**
- Validates all 234+ Texas city TDSP mappings
- Connectivity testing for unique TDSP endpoints
- Tier-based validation (Tier 1 = major cities)
- Zone-based validation (North, Coast, Central, South, Valley)
- Performance monitoring and error analysis
- Automated recommendations

**Validation Metrics:**
- Overall success rate (target: >95%)
- Tier 1 success rate (target: >98%)  
- Response time tracking
- Error pattern analysis

#### 5. Filter Parameter Mapping (`filter-mapper.ts`)

**Supported Filters:**
- **Contract Terms**: 6, 12, 24, 36 months, month-to-month
- **Rate Types**: Fixed, variable, indexed
- **Green Energy**: 100%, 50%, 25%, partial renewable
- **Plan Features**: No deposit, prepaid, autopay discount, time-of-use
- **Providers**: TXU, Reliant, Green Mountain, Gexa, etc.
- **Usage Levels**: 500 kWh (low), 1000 kWh (average), 2000 kWh (high)

**URL Structure Examples:**
```
/texas/dallas-tx/12-month-green-energy-autopay-discount/
/texas/houston-tx/24-month-fixed-rate-no-deposit/
/texas/austin-tx/prepaid-time-of-use/
```

**Validation Features:**
- Parameter conflict detection
- Logical combination warnings
- Invalid filter suggestions
- Round-trip URL mapping
- Comprehensive error handling

## Production Configuration

### Environment Variables

```bash
# Required
COMPAREPOWER_API_URL=https://pricing.api.comparepower.com
COMPAREPOWER_API_KEY=your_api_key_here

# Optional - Redis Caching
REDIS_URL=redis://localhost:6379

# Optional - Performance Tuning
NODE_ENV=production
```

### Cache Configuration

```typescript
{
  redis: {
    url: process.env.REDIS_URL,
    maxRetries: 3,
    retryDelayMs: 2000,
    ttlSeconds: 3600, // 1 hour
    maxMemoryMb: 256
  },
  memory: {
    maxEntries: 1000,
    ttlMs: 1800000, // 30 minutes
    cleanupIntervalMs: 300000 // 5 minutes
  },
  warming: {
    enabled: true,
    popularCities: ['1039940674000', '957877905', '007924772'],
    commonFilters: [
      {}, // Default
      { term: 12 },
      { term: 24 },
      { percent_green: 100 }
    ]
  }
}
```

### Circuit Breaker Configuration

```typescript
{
  failureThreshold: 5,      // Open after 5 failures
  recoveryTimeout: 60000,   // 1 minute recovery
  monitoringInterval: 10000, // 10 second monitoring
  halfOpenMaxCalls: 3       // 3 test calls in half-open
}
```

## Usage Examples

### Basic Plan Fetching

```typescript
import { comparePowerClient } from './lib/api/comparepower-client';

// Fetch plans for Dallas
const plans = await comparePowerClient.fetchPlans({
  tdsp_duns: '1039940674000',
  display_usage: 1000
});

console.log(`Found ${plans.length} plans`);
```

### Filter-Based Requests

```typescript
import { filterMapper, comparePowerClient } from './lib/api/';

// Map URL filters to API parameters
const filterResult = filterMapper.mapFiltersToApiParams(
  'houston-tx',
  ['12-month', 'green-energy', 'autopay-discount'],
  '957877905'
);

if (filterResult.isValid) {
  const plans = await comparePowerClient.fetchPlans(filterResult.apiParams);
  console.log(`Found ${plans.length} green energy plans`);
}
```

### Health Monitoring

```typescript
// Check system health
const health = await comparePowerClient.healthCheck();
console.log(`API Health: ${health.healthy}`);
console.log(`Circuit Breaker: ${health.circuitBreakerOpen ? 'Open' : 'Closed'}`);
console.log(`Redis: ${health.redisConnected ? 'Connected' : 'Disconnected'}`);

// Get detailed statistics
const stats = await comparePowerClient.getCacheStats();
console.log('Cache Statistics:', stats);
```

### TDSP Validation

```typescript
import { tdspValidator } from './lib/api/tdsp-validator';

// Quick connectivity check
const connectivity = await tdspValidator.validateConnectivity();
console.log(`TDSP Success Rate: ${connectivity.summary.valid}/${connectivity.summary.total}`);

// Full validation (use sparingly)
const summary = await tdspValidator.validateAllMappings();
console.log('Full Validation Results:', summary);
```

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test:run

# Run API-specific tests
npm run test -- tests/unit/api/

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests (requires API access)
npm run test:integration

# Skip integration tests in CI
SKIP_INTEGRATION_TESTS=true npm run test:integration
```

### Production Validation

```bash
# Quick production check
npm run test:api:quick

# Full production test suite
npm run test:api

# Manual validation script
node scripts/test-production-api.mjs --help
```

## Performance Targets

### Response Times
- **Cache Hit**: < 10ms
- **Cache Miss (API)**: < 1500ms average, < 3000ms max
- **Database Fallback**: < 500ms
- **Error Response**: < 100ms

### Throughput
- **Target**: 1,000+ requests/hour
- **Rate Limiting**: 10 requests/second per client
- **Burst Capacity**: 20 requests

### Reliability
- **Uptime Target**: 99.9%
- **Cache Hit Rate**: >80%
- **TDSP Validation**: >95% success
- **Tier 1 Cities**: >98% success

## Monitoring & Alerting

### Key Metrics to Monitor

1. **API Response Times**
   - Average, P95, P99 response times
   - Error rates by type
   - Circuit breaker state changes

2. **Cache Performance**
   - Hit rates (memory, Redis, database)
   - Cache size and eviction rates
   - Warming success rates

3. **TDSP Health**
   - Validation success rates by tier/zone
   - Failed TDSP endpoints
   - Plan availability by city

4. **Error Patterns**
   - Error types and frequencies
   - User-facing error rates
   - Fallback usage statistics

### Recommended Alerts

- API error rate > 5%
- Cache hit rate < 70%
- Circuit breaker open for > 5 minutes
- Tier 1 city validation < 95%
- Average response time > 2 seconds

## Production Deployment Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] Integration tests pass (if API available)
- [ ] Production test suite passes
- [ ] TDSP validation > 95% success rate
- [ ] Performance benchmarks met
- [ ] Error handling verified
- [ ] Monitoring configured

### Configuration

- [ ] Environment variables set
- [ ] Redis cache configured (if used)
- [ ] Rate limiting configured
- [ ] Circuit breaker thresholds set
- [ ] Cache warming enabled

### Post-Deployment

- [ ] Health check endpoints working
- [ ] Metrics collection active
- [ ] Error alerting configured
- [ ] Performance monitoring active
- [ ] Cache statistics available

## Troubleshooting Guide

### Common Issues

#### High Error Rates
1. Check API health endpoint
2. Verify TDSP validation results
3. Review circuit breaker status
4. Check rate limiting configuration

#### Poor Performance
1. Verify cache hit rates
2. Check Redis connectivity
3. Review database query performance
4. Analyze slow query logs

#### Cache Issues
1. Verify Redis configuration
2. Check memory limits
3. Review TTL settings
4. Monitor eviction rates

#### TDSP Failures
1. Run TDSP validation suite
2. Check specific city/zone patterns
3. Verify API endpoint changes
4. Review error logs for patterns

### Debug Commands

```bash
# Health check
curl https://your-domain.com/api/health

# Test specific TDSP
node -e "
  import('./src/lib/api/comparepower-client.js').then(async ({ comparePowerClient }) => {
    const plans = await comparePowerClient.fetchPlans({
      tdsp_duns: '1039940674000',
      display_usage: 1000
    });
    console.log(\`Found \${plans.length} plans\`);
    await comparePowerClient.shutdown();
  });
"

# Check cache statistics
node -e "
  import('./src/lib/api/comparepower-client.js').then(async ({ comparePowerClient }) => {
    const stats = await comparePowerClient.getCacheStats();
    console.log(JSON.stringify(stats, null, 2));
    await comparePowerClient.shutdown();
  });
"
```

## API Rate Limits & Best Practices

### Rate Limiting
- 10 requests per second per client
- 20 request burst capacity
- Automatic queuing and spacing
- Exponential backoff on rate limit hits

### Best Practices
1. **Always use caching** - Don't bypass the cache layer
2. **Handle errors gracefully** - Use provided error types and messages
3. **Monitor performance** - Track response times and error rates
4. **Validate inputs** - Use filter mapper for URL parameters
5. **Test thoroughly** - Run production test suite before deployment

### Cost Optimization
- Cache warming reduces API calls
- Intelligent TTL based on data freshness
- Fallback to database when possible
- Circuit breaker prevents cascading failures

## Support & Maintenance

### Regular Tasks
- Weekly TDSP validation runs
- Monthly performance reviews
- Quarterly filter mapping updates
- Annual API contract reviews

### Version Updates
1. Review API changelog
2. Update integration tests
3. Run full validation suite
4. Deploy with monitoring
5. Verify production metrics

For additional support or questions about the API integration system, please refer to the test suites and example implementations in the codebase.