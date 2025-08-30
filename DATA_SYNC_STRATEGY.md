# Professional Electricity Data Synchronization Strategy

## Overview

ChooseMyPower now implements a **professional electricity comparison platform data strategy** that minimizes API calls while ensuring fresh, accurate data for users. This system is designed to handle 881+ Texas cities with optimal performance and reliability.

## 🚀 Quick Start

### Fixed Database Constraint Issue
The main database constraint issue has been **RESOLVED**:
- **Problem**: `ON CONFLICT (external_id)` was failing because the unique constraint is actually on `(external_id, tdsp_duns)`
- **Solution**: Updated plan-repository.ts to use `ON CONFLICT (external_id, tdsp_duns)` 
- **Status**: ✅ Fixed and tested

### Professional Data Sync Commands

```bash
# Sync high-priority cities (recommended - fast)
npm run sync:priority

# Sync specific city
npm run sync:city dallas-tx

# Monitor sync status and performance
npm run sync:monitor

# Full sync all 881 cities (use sparingly)
npm run sync:full

# Database optimization
npm run db:optimize
npm run db:health
```

## 🏗️ Architecture Overview

### Professional Data Flow Strategy

```
User Request → Database Cache → Active Plans → API Call (if needed)
     ↓              ↓              ↓              ↓
  Instant      30min-2hr TTL   Persistent    Last Resort
```

**Key Principles:**
1. **Database-First**: Always check database before making API calls
2. **Intelligent Caching**: Multi-layer cache with proper TTL management  
3. **Minimal API Usage**: Professional sites call external APIs only 1-2 times per hour
4. **Graceful Fallbacks**: Always have backup data available
5. **Performance Monitoring**: Track and optimize all data operations

### Data Synchronization Layers

#### 1. Memory Cache (Fastest - 30 minutes TTL)
- In-memory storage for hot data
- Immediate response for recent requests
- Automatically cleared on server restart

#### 2. Redis Cache (Fast - 1 hour TTL) 
- Distributed cache for scalability
- Survives server restarts
- Shared across application instances

#### 3. Database Cache (Medium - 2 hours TTL)
- Persistent cache with expiration
- Survives Redis failures
- Queryable with filters and sorting

#### 4. Active Database Plans (Persistent)
- Long-term storage of all plan data
- Historical data for trend analysis
- Always available as fallback

#### 5. API Calls (Slowest - Last Resort)
- Only called when no cached data available
- Rate-limited and monitored
- Results stored in all cache layers

## 📊 Performance Optimization

### Database Indexing Strategy

The system creates **15+ specialized indexes** for optimal query performance:

```sql
-- Primary plan lookups
idx_plans_primary_lookup (tdsp_duns, is_active, rate_1000kwh)

-- Faceted search optimization  
idx_plans_faceted_contract (tdsp_duns, is_active, term_months, rate_type, rate_1000kwh)
idx_plans_faceted_green (tdsp_duns, is_active, percent_green, rate_1000kwh)

-- Provider performance
idx_plans_provider_performance (provider_id, is_active, rate_1000kwh, last_scraped_at)

-- And 10+ more specialized indexes...
```

### Query Performance Features

- **Materialized Views** for complex aggregations
- **Composite Indexes** for multi-filter queries
- **Partial Indexes** for active plans only
- **GIN Indexes** for full-text search
- **Statistics Updates** for query planner optimization

## 🔄 Automated Synchronization

### Sync Schedules (Professional Strategy)

```bash
# Priority Cities (Major metros, high-traffic areas)
# Runs every hour via cron
0 * * * * npm run sync:priority

# Full System Sync (All 881 cities)  
# Runs once daily at 2 AM
0 2 * * * npm run sync:full

# Database maintenance
# Runs weekly on Sundays at 3 AM
0 3 * * 0 npm run db:maintenance
```

### Intelligent Sync Strategy

1. **Priority Sync** (High-traffic cities first)
   - Major metros: Dallas, Houston, Austin, San Antonio
   - Recently searched cities
   - Cities with recent leads/conversions
   - ~5-10 minute execution time

2. **Regular Sync** (All cities, batched)
   - Groups cities by TDSP for efficiency
   - Respects API rate limits (25 req/sec max)
   - Smart error recovery and retry logic
   - ~60-90 minute execution time

3. **Emergency Sync** (Manual override)
   - Force refresh specific cities
   - Bypass normal rate limiting
   - Used for data quality issues

## 🛠️ Development & Operations

### Local Development

```bash
# Start development server
npm run dev

# Test specific city sync
npm run sync:city houston-tx

# Monitor sync performance
npm run sync:monitor

# Check database health
npm run db:health
```

### Production Operations

```bash
# Monitor system health
npm run production:status

# Optimize database
npm run db:optimize  

# Performance metrics
npm run db:metrics

# Cache statistics
npm run cache:stats
```

### Error Handling & Recovery

#### Automatic Recovery Strategies
1. **Circuit Breaker**: Protects against API failures
2. **Exponential Backoff**: Smart retry logic with jitter
3. **Database Fallback**: Use cached data if API fails
4. **Stale Data Serving**: Better stale data than no data

#### Manual Recovery Commands
```bash
# Emergency stop all sync operations
npm run sync:emergency

# Clear all caches and start fresh
npm run cache:clear && npm run sync:priority

# Database repair (if needed)
npm run db:maintenance
```

## 📈 Monitoring & Analytics

### Key Performance Metrics

- **Cache Hit Rate**: Target 85%+ for optimal performance
- **API Call Frequency**: <50 calls/hour during normal operation
- **Average Response Time**: <500ms for cached data, <2s for API calls
- **Database Query Performance**: <100ms for indexed queries
- **Sync Success Rate**: >95% for all sync operations

### Performance Monitoring

```bash
# Real-time performance monitoring
npm run sync:monitor

# Database performance analysis  
npm run db:metrics

# Cache efficiency report
npm run cache:stats

# API usage statistics
npm run monitor:metrics
```

### Alerts & Thresholds

- **High API Usage**: >100 calls/hour
- **Low Cache Hit Rate**: <70% 
- **Slow Queries**: >1 second average
- **Sync Failures**: >5% failure rate
- **Database Performance**: >90% disk usage

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://localhost:6379

# API Configuration  
COMPAREPOWER_API_URL=https://api.comparepower.com
COMPAREPOWER_API_KEY=your_api_key

# Sync Configuration
SYNC_INTERVAL_MS=3600000    # 1 hour
BATCH_SIZE=10               # API requests per batch
BATCH_DELAY_MS=2000         # Delay between batches

# Performance Tuning
MAX_CONCURRENT_REQUESTS=5
CACHE_TTL_HOURS=2
ENABLE_QUERY_OPTIMIZATION=true
```

### Deployment Tiers

#### Tier 1: Major Cities (~200 cities)
- Dallas/Fort Worth Metro
- Houston Metro  
- Austin Metro
- San Antonio Metro
- Other major population centers

#### Tier 2: Medium Cities (~300 cities)
- Regional centers
- Growing suburbs
- Economic hubs

#### Tier 3: All Cities (~381 remaining)
- Small towns
- Rural areas
- Complete coverage

## 🚨 Troubleshooting

### Common Issues

#### 1. "No unique constraint matching ON CONFLICT"
**Status**: ✅ **RESOLVED**
- **Cause**: Using wrong constraint name in ON CONFLICT clause
- **Solution**: Updated to use `(external_id, tdsp_duns)` composite key

#### 2. High API Usage
```bash
# Check current usage
npm run monitor:metrics

# Increase cache TTL if needed
# Edit: src/lib/database/data-sync-manager.ts
# Change cache TTL from 1 hour to 2 hours
```

#### 3. Low Cache Hit Rate
```bash
# Analyze cache performance
npm run cache:stats

# Warm cache for priority cities
npm run sync:priority

# Clear and rebuild if corrupted
npm run cache:clear && npm run sync:priority
```

#### 4. Database Performance Issues
```bash
# Run performance analysis
npm run db:health

# Optimize indexes and statistics  
npm run db:optimize

# Clean up old data
npm run db:maintenance
```

#### 5. Sync Queue Stuck
```bash
# Check sync status
npm run sync:status

# Stop and restart if needed
npm run sync:stop
npm run sync:priority

# Emergency stop if unresponsive
npm run sync:emergency
```

## 📚 Technical Details

### Database Schema Highlights

```sql
-- Plans table with composite unique constraint
CREATE TABLE electricity_plans (
    id UUID PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    tdsp_duns VARCHAR(20) NOT NULL,
    -- ... other fields
    UNIQUE(external_id, tdsp_duns)  -- Fixed constraint
);

-- Cache table with expiration
CREATE TABLE plan_cache (
    id UUID PRIMARY KEY,
    cache_key VARCHAR(500) UNIQUE,
    plans_data JSONB,
    expires_at TIMESTAMP,
    -- ... indexes for fast lookup
);
```

### API Client Architecture

```typescript
// Professional database-first approach
async getPlansWithCache(params: ApiParams): Promise<Plan[]> {
  // 1. Check database cache first (professional approach)
  const dbCached = await planRepository.getPlansFromCache(params);
  if (dbCached) return dbCached;

  // 2. Check active database plans  
  const activePlans = await planRepository.getActivePlans(params.tdsp_duns);
  if (activePlans.length > 0) return activePlans;

  // 3. Only make API call as last resort
  return await this.fetchFromAPI(params);
}
```

### Sync Manager Features

- **Job Queuing**: Priority-based job processing
- **Batch Processing**: Group requests by TDSP for efficiency  
- **Rate Limiting**: Respect API quotas and avoid overload
- **Error Recovery**: Exponential backoff with jitter
- **Monitoring**: Comprehensive metrics and logging

## 🎯 Next Steps

### Immediate Actions (Done ✅)
- [x] Fix database constraint issues
- [x] Implement database-first caching strategy
- [x] Create automated sync scripts
- [x] Set up performance monitoring
- [x] Add comprehensive error handling

### Ongoing Optimization
- [ ] Set up production monitoring alerts
- [ ] Implement cache warming strategies  
- [ ] Create performance benchmarking suite
- [ ] Add advanced analytics and reporting
- [ ] Optimize for Core Web Vitals

### Future Enhancements
- [ ] Machine learning for predictive caching
- [ ] Geographic clustering for TDSP optimization
- [ ] Real-time price change notifications
- [ ] Advanced A/B testing for cache strategies

## 📞 Support

For issues or questions about the data synchronization system:

1. **Check Status**: `npm run sync:status`
2. **View Logs**: Check application logs for error details
3. **Performance**: `npm run db:health` for health check
4. **Emergency**: `npm run sync:emergency` to stop all operations

**This professional data strategy ensures ChooseMyPower can reliably serve 881+ Texas cities with optimal performance and minimal external API dependency.**