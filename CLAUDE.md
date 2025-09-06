# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ChooseMyPower** is an electricity provider comparison platform for Texas, built with Astro, React, and TypeScript. It's an enterprise-scale application featuring intelligent electricity plan comparison, provider analysis, and educational content hubs.

**CRITICAL**: This application now uses a **100% real data architecture** with PostgreSQL database integration and comprehensive service layer abstraction. **NO MOCK DATA** is used in production components.

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

## CRITICAL: Plan ID & ESID System Architecture

### ⚠️ **NEVER USE HARDCODED PLAN IDs or ESIDs** ⚠️

This system was previously affected by a critical bug where hardcoded plan IDs caused wrong plans to be ordered. The system is now 100% dynamic and must remain so.

#### **Plan ID Resolution Flow** (MUST BE DYNAMIC)
1. **User selects plan** → Plan data includes name, provider, city context
2. **ProductDetailsPageShadcn.tsx** → Calls `/api/plans/search` with plan name + provider + city
3. **API returns MongoDB ObjectId** → Real plan ID from generated data files
4. **AddressSearchModal.tsx** → Uses `getPlanObjectId()` to validate and extract plan ID
5. **Order URL contains correct plan ID** → Passed to ComparePower order system

#### **ESID Resolution Flow** (MUST BE ADDRESS-BASED)
1. **User enters address** → Street address + ZIP code
2. **ERCOT validation API** → Generates ESID based on ZIP code pattern
3. **TDSP mapping** → Determines utility territory from ESID
4. **Order URL contains user's ESID** → Actual service location ID

### **Critical Files That Handle Plan/ESID IDs**
- `src/components/ui/AddressSearchModal.tsx` - Plan ID validation & order URL generation
- `src/components/ui/ProductDetailsPageShadcn.tsx` - API plan ID fetching
- `src/pages/api/plans/search.ts` - Plan ID resolution from real data
- `src/lib/api/plan-data-service.ts` - Dynamic plan data retrieval
- `src/pages/api/ercot/validate.ts` - ESID generation from address

### **Verification Commands**
```bash
# Test plan ID resolution (must return real MongoDB ObjectIds)
curl "http://localhost:4325/api/plans/search?name=Cash%20Money%2012&provider=4Change%20Energy&city=dallas"

# Test ESID generation (must be address-based)
curl -X POST "http://localhost:4325/api/ercot/validate" -H "Content-Type: application/json" -d '{"esiid": "10123456789012345"}'

# Verify no hardcoded plan IDs in source code
grep -r "68b[0-9a-f]\{21\}" src/ --exclude-dir=data
```

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

#### Data Layer (100% Real Data Architecture)
- `src/lib/services/` - **SERVICE LAYER** - Database-first data services with JSON fallbacks
  - `provider-service.ts` - Real provider data with filtering and statistics
  - `city-service.ts` - Real city data with TDSP mappings and demographics  
  - `plan-service.ts` - Real plan data with MongoDB ObjectIds for orders
- `src/data/generated/` - Generated city-specific electricity data (JSON fallbacks)
- `src/lib/database/` - PostgreSQL database schema, migrations, connection pooling
- `src/lib/cache/` - Redis caching system for performance optimization

#### Core Features
- `src/components/faceted/` - Advanced filtering and comparison UI
- `src/lib/seo/` - SEO optimization and meta generation
- `src/pages/` - Astro pages with dynamic routing

## ⚠️ CRITICAL: Real Data Architecture (NO MOCK DATA)

### Database-First Service Layer Pattern
All React components now use real data services instead of mock data:

```typescript
// ✅ CORRECT: Use real data services
import { getProviders, getCities, getPlansForCity } from '../../lib/services/provider-service';

// ❌ NEVER DO: Import mock data
import { mockProviders, mockStates } from '../../data/mockData'; // FORBIDDEN
```

### Data Flow Architecture
1. **Database First**: PostgreSQL with Drizzle ORM provides primary data
2. **Service Layer**: Abstracted data access with comprehensive error handling  
3. **JSON Fallback**: Generated data files provide resilience if database unavailable
4. **Caching**: Redis optimization for frequently accessed data
5. **Real-time**: All statistics and counts calculated from actual data

### Service Layer Usage Pattern
```typescript
// Standard component data loading pattern
const [providers, setProviders] = useState<RealProvider[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const providersData = await getProviders('texas');
      setProviders(providersData);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

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
- **Service Layer Fallbacks**: Components gracefully fallback to JSON data if database unavailable
- **No Mock Data**: System never falls back to mock data - only real data sources

### Real Data Service Troubleshooting
```bash
# Test provider service
curl "http://localhost:4325/api/providers?state=texas"

# Test city service  
curl "http://localhost:4325/api/cities?state=texas"

# Test plan service
curl "http://localhost:4325/api/plans/city/houston"

# Check service layer logs
grep "ProviderService\|CityService\|PlanService" logs/
```

### Plan ID & ESID Issues (CRITICAL)
**⚠️ If users report wrong plans being ordered or address validation failures:**

#### Plan ID Troubleshooting
```bash
# 1. Test plan ID resolution for affected provider
curl "http://localhost:4325/api/plans/search?name=PLAN_NAME&provider=PROVIDER_NAME&city=CITY"

# 2. Check for hardcoded plan IDs in source code (should return ZERO results)
grep -r "68b[0-9a-f]\{21\}" src/ --exclude-dir=data

# 3. Verify plan data service is using real data sources
node -e "const { getPlansForCity } = require('./src/lib/services/provider-service.ts'); getPlansForCity('dallas', 'texas').then(console.log)"
```

#### ESID Troubleshooting
```bash
# 1. Test ESID generation
curl -X POST "http://localhost:4325/api/ercot/validate" -H "Content-Type: application/json" -d '{"esiid": "10123456789012345"}'

# 2. Check for hardcoded ESIDs (should return ZERO results)  
grep -r "10[0-9]\{15\}" src/ --exclude-dir=test

# 3. Verify TDSP mapping is address-based
# Different ZIP patterns should generate different TDSPs
```

#### Emergency Response
- **DO NOT** add hardcoded fallback plan IDs
- **DO NOT** use default ESIDs  
- **DO NOT** import or use mock data (`mockData.ts`)
- Show error messages instead of wrong data
- Always use service layer functions (`getProviders`, `getCities`, `getPlansForCity`)
- Check `/docs/PLAN-ID-ESID-SPECIFICATION.md` for complete requirements

## ⚠️ NEW COMPONENT DEVELOPMENT REQUIREMENTS

When creating new components, you MUST:

### 1. Use Real Data Services ONLY
```typescript
// ✅ CORRECT: Import real data services
import { getProviders, getCities, getPlansForCity, getCityBySlug, type RealProvider, type RealCity } from '../../lib/services/provider-service';

// ❌ FORBIDDEN: Never import mock data
// import { mockProviders, mockStates } from '../../data/mockData';
```

### 2. Implement Standard Loading Pattern
```typescript
const [providers, setProviders] = useState<RealProvider[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const data = await getProviders('texas');
      setProviders(data);
    } catch (error) {
      console.error('[ComponentName] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### 3. Handle Loading and Error States
```typescript
if (loading) {
  return <div className="text-center py-12">Loading...</div>;
}

if (providers.length === 0) {
  return <div className="text-center py-12">No providers found.</div>;
}
```

### 4. Use Type-Safe Data Access
```typescript
// ✅ Handle different data field names gracefully
const planRate = parseFloat(plan.rate || plan.planRate || '12.5');
const providerName = provider.name || provider.providerName || 'Provider';
const cityZips = city.zipCodes || city.zipCodeList || [];
```

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

## ChooseMyPower Design System

**Version**: 1.0  
**Last Updated**: August 29, 2025  
**Philosophy**: Authentic Texas electricity market branding with Power to Choose aesthetics

### 🎨 Color System

#### Primary Brand Colors (Texas Flag Inspired)
```css
/* Texas Navy - Primary brand color */
texas-navy: #002868

/* Texas Red - Action, CTAs, urgency */
texas-red: #dc2626 (500)
texas-red-50: #fef2f2 (lightest tint)
texas-red-100: #fee2e2
texas-red-200: #fecaca  
texas-red-300: #fca5a5
texas-red-400: #f87171
texas-red-600: #b91c1c (hover/active)
texas-red-700: #991b1b (pressed)
texas-red-800: #7f1d1d (darkest)

/* Texas Gold - Highlights, success, premium */
texas-gold: #f59e0b (500)
texas-gold-50: #fffbeb
texas-gold-100: #fef3c7  
texas-gold-200: #fde68a
texas-gold-300: #fcd34d
texas-gold-400: #fbbf24
texas-gold-600: #d97706 (hover/active)
texas-gold-700: #b45309 (pressed)

/* Texas Cream - Soft backgrounds, subtle areas */
texas-cream: #f8edd3 (500)  
texas-cream-50: #fefefe (lightest)
texas-cream-200: #fefcf8
texas-cream-300: #fdf8f0
texas-cream-400: #fbf2e4
```

#### Semantic Color Usage
- **Primary Actions**: `texas-red` (Shop, Compare, Sign Up)
- **Secondary Actions**: `texas-navy` (Learn More, View Details)
- **Success States**: `texas-gold` (Savings, Best Value)
- **Navigation**: `texas-navy` (headers, links, menu)
- **Backgrounds**: `texas-cream` variants for sections
- **Text**: `texas-navy` for headings, gray-900/700/600 for body

#### Accessibility Requirements
- **WCAG AA**: Minimum 4.5:1 contrast ratio for normal text
- **WCAG AAA**: Target 7:1 contrast ratio where possible
- All color combinations tested for colorblind accessibility

### 📝 Typography System

#### Font Stack
```css
Primary: 'Inter', system-ui, sans-serif
Secondary: 'Georgia', serif (for emphasis/quotes)
```

#### Type Scale
```css
/* Display - Hero sections, major headings */
text-7xl: 72px / 1.1 (4.5rem) - Hero titles
text-6xl: 60px / 1.1 (3.75rem) - Page titles
text-5xl: 48px / 1.1 (3rem) - Section titles

/* Headings - Content hierarchy */
text-4xl: 36px / 1.1 (2.25rem) - H1
text-3xl: 30px / 1.2 (1.875rem) - H2  
text-2xl: 24px / 1.3 (1.5rem) - H3
text-xl: 20px / 1.4 (1.25rem) - H4
text-lg: 18px / 1.5 (1.125rem) - H5

/* Body Text */
text-base: 16px / 1.5 (1rem) - Primary body
text-sm: 14px / 1.4 (0.875rem) - Secondary text, captions
text-xs: 12px / 1.3 (0.75rem) - Labels, fine print
```

#### Font Weights
```css
font-light: 300 - Rare use, large display text
font-normal: 400 - Body text default
font-medium: 500 - Emphasized body text
font-semibold: 600 - Subheadings, important text
font-bold: 700 - Headings, CTAs
font-extrabold: 800 - Display headings only
```

#### Typography Rules
1. **Headings**: Always `texas-navy`, font-bold or semibold
2. **Body Text**: `text-gray-900` primary, `text-gray-700` secondary
3. **Links**: `text-texas-navy` with `hover:text-texas-red`
4. **CTAs**: White text on colored backgrounds
5. **Line Height**: Increase with smaller font sizes for readability

### 📏 Spacing & Layout System

#### Spacing Scale (Tailwind Units)
```css
0.5: 2px  - Fine details, borders
1: 4px    - Tight spacing
1.5: 6px  - Button padding
2: 8px    - Small gaps
3: 12px   - Standard gaps
4: 16px   - Standard padding
6: 24px   - Section padding
8: 32px   - Large padding
10: 40px  - Large gaps
12: 48px  - Section margins
16: 64px  - Large section spacing  
20: 80px  - Hero padding
24: 96px  - Major section gaps
32: 128px - Page section spacing
```

#### Container System
```css
/* Max Widths */
max-w-sm: 384px - Small containers
max-w-md: 448px - Form containers
max-w-lg: 512px - Content containers
max-w-xl: 576px - Article containers
max-w-2xl: 672px - Blog posts
max-w-4xl: 896px - Wide content
max-w-6xl: 1152px - Page content
max-w-7xl: 1280px - Full layouts

/* Standard Container */
.container: center, px-4, max-w-7xl
```

#### Grid System
```css
/* Plan Grids */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6 md:gap-8

/* City Grids */  
grid-cols-2 md:grid-cols-3 lg:grid-cols-4
gap-4

/* Feature Grids */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-8
```

### 🔲 Component Library

#### Button Variants
```css
/* Primary - Main CTAs */
.btn-primary {
  @apply bg-texas-red text-white px-6 py-3 rounded-lg font-semibold;
  @apply hover:bg-texas-red-600 transition-all duration-200;
  @apply focus:ring-4 focus:ring-texas-red-200 focus:outline-none;
}

/* Secondary - Less important actions */
.btn-secondary {
  @apply bg-texas-navy text-white px-6 py-3 rounded-lg font-semibold;
  @apply hover:bg-blue-800 transition-all duration-200;
}

/* Outline - Subtle actions */
.btn-outline {
  @apply border-2 border-texas-navy text-texas-navy px-6 py-3 rounded-lg font-semibold;
  @apply hover:bg-texas-navy hover:text-white transition-all duration-200;
}

/* Gold - Premium actions */
.btn-gold {
  @apply bg-texas-gold text-white px-6 py-3 rounded-lg font-semibold;
  @apply hover:bg-texas-gold-600 transition-all duration-200;
}
```

#### Card Components
```css
/* Plan Cards */
.plan-card {
  @apply bg-white rounded-xl shadow-lg border border-gray-200;
  @apply hover:shadow-xl hover:-translate-y-1 transition-all duration-300;
  @apply p-6;
}

/* City Cards */
.city-card {
  @apply bg-white rounded-lg shadow-md border border-gray-100;
  @apply hover:shadow-lg hover:border-texas-navy transition-all duration-200;
  @apply p-4;
}

/* Feature Cards */
.feature-card {
  @apply bg-gradient-to-br from-white to-gray-50 rounded-xl;
  @apply border border-gray-200 p-8 text-center;
  @apply hover:border-texas-gold transition-all duration-300;
}
```

#### Form Elements
```css
/* Input Fields */
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg;
  @apply focus:ring-4 focus:ring-texas-red-200 focus:border-texas-red;
  @apply text-gray-900 placeholder-gray-500;
}

/* Select Dropdowns */
.select-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg bg-white;
  @apply focus:ring-4 focus:ring-texas-red-200 focus:border-texas-red;
  @apply text-gray-900;
}
```

### 🎯 Interactive States

#### Hover States
- **Buttons**: Darken by 100 (texas-red-600, texas-navy → blue-800)
- **Cards**: `hover:shadow-xl hover:-translate-y-1`
- **Links**: `hover:text-texas-red hover:underline`

#### Focus States  
- **Buttons**: `focus:ring-4 focus:ring-{color}-200`
- **Inputs**: `focus:ring-4 focus:ring-texas-red-200 focus:border-texas-red`
- **Cards**: `focus:outline-none focus:ring-2 focus:ring-texas-navy`

#### Active/Pressed States
- **Buttons**: `active:scale-95` or darker color variant
- **Interactive Elements**: Brief scale animation

### 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
sm: 640px   - Large phones
md: 768px   - Tablets  
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large screens
```

#### Responsive Patterns
```css
/* Typography */
text-4xl md:text-5xl lg:text-6xl

/* Padding */  
py-12 md:py-16 lg:py-20

/* Grid */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Spacing */
gap-4 md:gap-6 lg:gap-8
```

### 🔧 Utility Classes

#### Common Patterns
```css
/* Hero Sections */
.hero-gradient {
  @apply bg-gradient-to-r from-texas-navy via-blue-800 to-texas-navy;
}

/* Professional Hero Section with Proper Overlay Containment */
.professional-hero {
  @apply relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white;
}

.professional-hero-overlay {
  @apply absolute inset-0 bg-black/20;
}

/* Section Backgrounds */
.section-cream {
  @apply bg-gradient-to-b from-texas-cream to-gray-50;
}

/* Texas Themed Shadows */
.texas-shadow {
  @apply shadow-md shadow-texas-red/10;
}

/* Trust Signals - Must maintain proper spacing */
.trust-signals {
  @apply flex flex-col sm:flex-row items-center justify-center gap-4 text-lg mb-16;
}

.trust-signals + * {
  @apply mt-8; /* CRITICAL: Following content needs mt-8 for symmetrical spacing */
}
```

### ♿ Accessibility Guidelines

#### Color Contrast
- **Body text**: Minimum 4.5:1 against background
- **Large text**: Minimum 3:1 against background
- **Interactive elements**: Must pass contrast tests

#### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order throughout pages
- Skip links for keyboard navigation

#### ARIA Labels
- Descriptive labels for all buttons and links
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all meaningful images

### 📋 Usage Rules

#### DO's
- ✅ Use texas-navy for primary text and navigation
- ✅ Use texas-red for primary CTAs and urgent actions  
- ✅ Use texas-gold for success states and highlights
- ✅ Maintain consistent spacing using the scale
- ✅ Test all color combinations for accessibility
- ✅ Use hover states on interactive elements

#### DON'Ts
- ❌ Don't use generic blue/red colors (use Texas variants)
- ❌ Don't mix font weights within the same text block
- ❌ Don't use less than text-sm for body text
- ❌ Don't create custom spacing outside the scale
- ❌ Don't skip hover/focus states on buttons/links
- ❌ **CRITICAL:** Never use `absolute inset-0 bg-black/20` without `relative` positioning on the parent container - this causes overlay bleed beyond hero sections
- ❌ Don't use `shadow-lg` - use `shadow-md` for professional, lighter shadows
- ❌ **CRITICAL:** Trust signals must have proper spacing from subsequent content - use `mt-8` on the following element to match hero section symmetry

### 🔄 Maintenance Protocol

**When adding new components:**
1. Check if existing design system components can be used
2. If creating new variants, follow established patterns
3. Update this design system documentation
4. Test accessibility and responsive behavior
5. Add examples to component library

**Color changes require:**
1. Accessibility testing across all combinations
2. Update of this documentation
3. Review of all existing components
4. Brand consistency check

**This design system should be referenced for ALL design decisions and updated whenever new patterns are established.**