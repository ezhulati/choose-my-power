# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ChooseMyPower** is an electricity provider comparison platform for Texas, built with Astro, React, and TypeScript. It's an enterprise-scale application featuring intelligent electricity plan comparison, provider analysis, and educational content hubs.

## Essential Development Commands

### Core Development
- `npm run dev` - Start development server (port 4324)
- `npm run build` - Full production build (includes data generation)
- `npm run build:legacy` - Legacy build with Astro check
- `npm run preview` - Preview production build

### Data Generation (Critical System)
- `npm run build:data:smart` - Smart data generation with caching
- `npm run build:data:fresh` - Force fresh data without cache
- `npm run build:data:881` - Full Texas cities build (881 cities)
- `npm run build:data:tier1` - Priority cities only (200 cities)

### Testing
- `npm run test` - Run Vitest unit tests
- `npm run test:run` - Run tests once without watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:all` - Run both unit and E2E tests

### Quality & Performance
- `npm run lint` - Run ESLint
- `npm run perf:test` - Run performance test suite
- `npm run security:audit` - Security audit and scan

### Production Operations
- `npm run production:deploy` - Deploy to production
- `npm run production:validate` - Validate production readiness
- `npm run health:check` - Check system health
- `npm run cache:stats` - View cache statistics

## Architecture Overview

### Core Technologies
- **Framework**: Astro 5 with React integration
- **Styling**: Tailwind CSS with custom design system
- **Database**: Drizzle ORM with PostgreSQL (Neon)
- **Caching**: Redis (ioredis) for performance optimization
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Deployment**: Netlify with serverless functions

### Key Architectural Patterns

#### 1. **Faceted Navigation System**
Located in `src/lib/faceted/`, this handles complex electricity plan filtering:
- Multi-dimensional filtering (location, plan type, features)
- URL-based state management for SEO
- Static generation for performance

#### 2. **Smart Data Generation Pipeline**
The `scripts/build-data-smart.mjs` system:
- Fetches electricity plan data from APIs
- Implements intelligent caching and batching
- Supports incremental builds for 881+ Texas cities
- Handles rate limiting and error recovery

#### 3. **Multi-TDSP (Utility) System**
Located in `src/config/`, handles Texas utility territories:
- Maps ZIP codes to transmission/distribution service providers
- Manages complex geographic boundaries
- Enables accurate plan availability determination

#### 4. **Component Architecture**
- **Astro Components**: Static content, layouts, and pages
- **React Components**: Interactive features, forms, calculators
- **Mobile-Optimized**: Specialized mobile components in `src/components/mobile/`

### Important File Locations

#### Configuration
- `astro.config.mjs` - Advanced build optimization and chunking strategy
- `src/config/multi-tdsp-mapping.ts` - Texas utility territory mappings
- `src/lib/api/comparepower-client.ts` - Main API client with caching

#### Data Layer
- `src/data/generated/` - Generated city-specific electricity data
- `src/lib/database/` - Database schema, migrations, connection pooling
- `src/lib/cache/` - Redis caching system

#### Core Features
- `src/components/faceted/` - Advanced filtering and comparison UI
- `src/lib/seo/` - SEO optimization and meta generation
- `src/pages/` - Astro pages with dynamic routing

## Development Patterns

### Data Generation Workflow
1. Use `npm run build:data:smart` for development (faster, cached)
2. Use `npm run build:data:fresh` when data sources change
3. Monitor build logs for API rate limiting issues
4. Use `MAX_CITIES=10` environment variable for testing

### Testing Strategy
- Unit tests focus on pure functions and utilities
- Integration tests cover API clients and data processing
- E2E tests validate user journeys and critical paths
- Performance tests ensure Core Web Vitals compliance

### Performance Optimization
- Astro's strategic code splitting (see astro.config.mjs)
- Image optimization pipeline in `src/lib/images/`
- Core Web Vitals monitoring in `src/lib/performance/`
- CDN optimization for Texas-specific content

### Mobile-First Development
- Touch-optimized components in `src/components/mobile/`
- Progressive enhancement for desktop features
- Responsive design system with consistent breakpoints

## Important Environment Variables
- `NODE_ENV=production` - Production build mode
- `USE_CACHED_DATA=false` - Force fresh data generation  
- `MAX_CITIES=N` - Limit data generation for testing
- `BATCH_SIZE=N` - Control API request batching
- `BATCH_DELAY_MS=N` - Control API request delays

## Common Troubleshooting

### Build Issues
- If build fails, check `npm run build:data:smart` first
- API rate limiting: Increase `BATCH_DELAY_MS` or reduce `BATCH_SIZE`
- Memory issues: Use `MAX_CITIES` to limit scope during development

### Performance Issues
- Run `npm run perf:test` to identify bottlenecks
- Check Core Web Vitals with lighthouse tests
- Monitor bundle sizes in build output

### Database Issues
- Use `npm run db:test` to verify database connectivity
- Check environment variables for database configuration
- Ensure proper SSL configuration for production

## SEO & Content Strategy
This platform generates 2000+ pages dynamically. Key patterns:
- City-specific landing pages: `/texas/houston/`
- Plan comparison pages: `/electricity-plans/dallas-tx/`
- Faceted navigation: `/electricity-plans/dallas-tx/12-month/`
- Educational hubs: `/resources/`, `/guides/`

## Critical Performance Considerations
- Data generation can take 20+ minutes for full Texas build
- Use tier-based deployment for production (`npm run deploy:tier1`)
- Monitor API quotas during data generation
- Cache invalidation affects 881 city pages simultaneously