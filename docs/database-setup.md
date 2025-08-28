# Database Setup Guide - Netlify Neon Integration

This guide walks you through setting up and configuring the Netlify Neon database for the ChooseMyPower application.

## Overview

The ChooseMyPower application uses Netlify's Neon database integration for:
- **Plan Caching**: Store API responses for faster page loads
- **Provider Management**: Manage electricity provider information and logos
- **Analytics**: Track user searches and API performance
- **Offline Resilience**: Serve cached data when the external API is unavailable

## Database Setup

### 1. Environment Variables

Your Netlify deployment should automatically have these environment variables:
- `NETLIFY_DATABASE_URL` - Pooled connection for application use
- `NETLIFY_DATABASE_URL_UNPOOLED` - Direct connection for migrations

For local development, copy these from your Netlify dashboard to `.env`:

```bash
# .env
# 🔒 SECURITY NOTE: Replace these with your actual database credentials from Netlify dashboard
# Never commit real credentials to version control
NETLIFY_DATABASE_URL="postgresql://your-username:your-secure-password@your-host.neon.tech/main?sslmode=require"
NETLIFY_DATABASE_URL_UNPOOLED="postgresql://your-username:your-secure-password@your-host.neon.tech/main?sslmode=require"
```

### 2. Test Database Connection

Before setting up tables, test your connection:

```bash
npm run db:test
```

This will verify:
- ✅ Database connectivity
- ✅ Health check (response time)
- ⚠️ Table existence (expected to fail before setup)

### 3. Initialize Database

Run the setup script to create all tables and seed initial data:

```bash
npm run db:setup
```

This creates:
- **Tables**: providers, electricity_plans, plan_cache, api_logs, user_searches, cities, tdsp
- **Indexes**: Optimized for common queries
- **Triggers**: Auto-update timestamps
- **Seed Data**: Major Texas providers, cities, and TDSP information

### 4. Verify Setup

After setup, run the test again to see populated statistics:

```bash
npm run db:test
```

Expected output:
```
📊 Current Database Statistics:
   • Providers: 16
   • Cities: 5
   • Active Plans: 0 (populated by API calls)
   • Valid Cache Entries: 0
   • API Calls (24h): 0
```

## Database Schema

### Core Tables

#### `providers`
- **Purpose**: Store electricity provider information and logos
- **Key Fields**: `name`, `puct_number`, `logo_filename`, `logo_url`
- **Relationships**: Referenced by `electricity_plans`

#### `electricity_plans`
- **Purpose**: Store individual plan data from ComparePower API
- **Key Fields**: `external_id`, `provider_id`, `rate_1000kwh`, `term_months`
- **Relationships**: Links to `providers` and `tdsp`

#### `plan_cache`
- **Purpose**: Cache API responses for faster page loads
- **Key Fields**: `cache_key`, `plans_data` (JSONB), `expires_at`
- **TTL**: 1 hour (configurable)

#### `cities`
- **Purpose**: Texas city information and TDSP mapping
- **Key Fields**: `name`, `slug`, `tdsp_duns`, `zip_codes`
- **Relationships**: Links to `tdsp`

### Support Tables

- `tdsp` - Transmission and Distribution Service Providers
- `api_logs` - API call monitoring and performance tracking
- `user_searches` - Analytics for user behavior

## API Integration

The database integrates seamlessly with the ComparePower API client:

1. **Cache-First Strategy**: Check database cache → Memory cache → API call
2. **Automatic Storage**: Store plans individually for analysis
3. **Fallback Resilience**: Serve database plans if API is down
4. **Performance Monitoring**: Log all API calls with response times

### Usage Example

```typescript
import { comparePowerClient } from './lib/api/comparepower-client';

// This will automatically:
// 1. Check database cache
// 2. Call API if needed
// 3. Store results in database
// 4. Log performance metrics
const plans = await comparePowerClient.fetchPlans({
  tdsp_duns: '026741090000',
  display_usage: 1000
});
```

## Maintenance

### Regular Cleanup

Set up a scheduled function to clean expired cache:

```typescript
import { planRepository } from './lib/database/plan-repository';

// Clean expired entries (runs automatically)
const cleaned = await planRepository.cleanExpiredCache();
console.log(`Cleaned ${cleaned} expired entries`);
```

### Cache Statistics

Monitor cache performance:

```typescript
const stats = await comparePowerClient.getCacheStats();
console.log('Cache Performance:', stats);
```

### Reset Database (⚠️ Destructive)

For development only:

```bash
npm run db:reset
```

## Production Deployment

### Netlify Configuration

1. **Connect Database**: In Netlify dashboard, go to your site → Add-ons → Neon Database
2. **Auto Environment**: `NETLIFY_DATABASE_URL*` variables are set automatically
3. **Build Hook**: Database setup runs during deployment

### Build Integration

The database setup is integrated into the build process:

```json
{
  "scripts": {
    "build": "npm run db:setup && astro build"
  }
}
```

## Troubleshooting

### Connection Issues

❌ **"Could not connect to database"**
- Check environment variables are set
- Verify database is running in Netlify dashboard
- Test network connectivity

❌ **"Permission denied"**
- Ensure using correct connection string
- Check if IP is whitelisted (usually not needed with Netlify)

### Performance Issues

❌ **Slow queries**
- Check index usage: `EXPLAIN ANALYZE SELECT ...`
- Monitor with: `npm run db:test`
- Consider adding custom indexes

❌ **High cache misses**
- Check TTL settings in plan repository
- Monitor with cache stats
- Consider increasing cache duration

### Data Issues

❌ **Missing providers**
- Re-run seeding: `npm run db:setup`
- Check provider logo mapper integration
- Verify CSV data extraction

❌ **Outdated plans**
- Plans auto-update on API calls
- Force refresh by clearing cache
- Check API response transformation

## Development Tips

1. **Local Testing**: Use `npm run db:test` frequently during development
2. **Schema Changes**: Always update `schema.ts` and migration scripts
3. **Cache Strategy**: Test both online and offline scenarios
4. **Performance**: Monitor query performance with database logs
5. **Fallbacks**: Ensure graceful degradation when database is unavailable

## Support

For issues with:
- **Netlify Neon**: Check Netlify documentation and support
- **Schema Design**: Review `src/lib/database/schema.ts`
- **API Integration**: Check `src/lib/api/comparepower-client.ts`
- **Performance**: Use monitoring tools and database statistics