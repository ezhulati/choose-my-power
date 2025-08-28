# Product Requirements Document (PRD) - UPDATED v2.0
## ChooseMyPower.org - The Texas Electricity Authority

### Document Version: 2.0 (Astro + Faceted Navigation)
### Date: August 2025
### Product Owner: Senior PM, ChooseMyPower.org
### Engineering Lead: TBD
### Design Lead: TBD
### Document Status: Draft - Updated with Faceted Navigation Strategy

---

## 1. Product Overview

### 1.1 Product Definition
ChooseMyPower.org is a web-based electricity comparison platform designed to serve as the trusted alternative to Power to Choose, providing Texas residents with transparent plan comparisons, educational resources, and simplified enrollment processes. The platform leverages ComparePower's pricing API infrastructure to create thousands of SEO-optimized landing pages through faceted navigation.

### 1.2 Technical Stack (Updated)
- **Frontend Framework**: Astro 4.x with TypeScript
- **UI Components**: React for interactive islands + Astro components
- **Styling**: Tailwind CSS + Astro scoped styles  
- **Backend API**: ComparePower Pricing API (external) + Node.js service layer
- **Database**: PostgreSQL with Redis caching
- **Search**: Elasticsearch
- **CDN**: Cloudflare with edge caching
- **Analytics**: Google Analytics 4 + Partytown
- **Monitoring**: Datadog
- **Email**: SendGrid
- **SMS**: Twilio

### 1.3 Architecture with Faceted Navigation
```
┌─────────────────────────────────────────────────────────────────────┐
│                     Astro Static Site Generator                      │
├─────────────────────────────────────────────────────────────────────┤
│  Faceted Pages          │  Static Pages      │  API Routes          │
│  ├── /[city]/           │  ├── /             │  ├── /api/meta      │
│  ├── /[city]/[filter]   │  ├── /education    │  ├── /api/schema    │
│  └── /[city]/[f1]/[f2]  │  └── /tools        │  └── /api/canonical │
└─────────────────────────┴────────────────────┴──────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │   Service Layer API   │
                          │      (Node.js)        │
                          └───────────┬───────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌─────────────────┐    ┌──────────────────────┐    ┌────────────────┐
│ ComparePower    │    │    PostgreSQL        │    │ Elasticsearch  │
│ Pricing API     │    │  (Facet Metadata)    │    │ (Content)      │
└─────────────────┘    └──────────────────────┘    └────────────────┘
```

### 1.4 Enhanced Astro Configuration
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import compress from 'astro-compress';
import { facetedSitemapGenerator } from './src/utils/sitemap';

export default defineConfig({
  site: 'https://choosemypower.org',
  output: 'hybrid', // SSG for high-value pages, SSR for long-tail
  
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      serialize(item) {
        // Custom serialization for faceted pages
        if (item.url.includes('/electricity-plans/')) {
          item.changefreq = 'daily';
          item.priority = getFacetedPagePriority(item.url);
        }
        return item;
      },
      customPages: async () => {
        // Generate faceted navigation sitemap entries
        return await facetedSitemapGenerator();
      }
    }),
    partytown({
      config: { forward: ['dataLayer.push'] }
    }),
    compress({ HTML: true, CSS: true, JavaScript: true })
  ],
  
  vite: {
    ssr: {
      external: ['@prisma/client'],
    },
  },
  
  experimental: {
    hybridOutput: true,
    redirects: true,
  },
});
```

---

## 2. Faceted Navigation Implementation

### 2.1 URL Architecture

#### 2.1.1 URL Structure & Routing
```typescript
// src/types/facets.ts
interface FacetedUrl {
  city: string;
  filters: string[];
  apiParams: ApiParams;
}

interface ApiParams {
  tdsp_duns: string;
  term?: number;
  percent_green?: number;
  is_pre_pay?: boolean;
  display_usage?: number;
  brand_id?: string;
}

// URL Pattern Examples:
// /electricity-plans/dallas-tx/
// /electricity-plans/dallas-tx/12-month/
// /electricity-plans/dallas-tx/12-month/fixed-rate/
// /electricity-plans/dallas-tx/green-energy/
```

#### 2.1.2 TDSP Mapping Configuration
```javascript
// src/config/tdsp-mapping.ts
export const tdspMapping = {
  // Major metros
  'dallas-tx': { duns: '103994067400', name: 'Oncor', zone: 'North' },
  'fort-worth-tx': { duns: '103994067400', name: 'Oncor', zone: 'North' },
  'houston-tx': { duns: '103994067401', name: 'CenterPoint', zone: 'Coast' },
  'austin-tx': { duns: '103994067402', name: 'Austin Energy', zone: 'Central' },
  'san-antonio-tx': { duns: '103994067403', name: 'CPS Energy', zone: 'South' },
  
  // Secondary cities
  'corpus-christi-tx': { duns: '103994067404', name: 'AEP Texas', zone: 'Coast' },
  'laredo-tx': { duns: '103994067404', name: 'AEP Texas', zone: 'South' },
  'mcallen-tx': { duns: '103994067404', name: 'AEP Texas', zone: 'Valley' },
  
  // Add all deregulated cities...
};

// Zip code to city mapping for redirects
export const zipToCity = {
  '75001': 'dallas-tx',
  '75201': 'dallas-tx',
  '77001': 'houston-tx',
  '77002': 'houston-tx',
  '78701': 'austin-tx',
  // Complete mapping...
};
```

### 2.2 Dynamic Page Generation

#### 2.2.1 Faceted Page Component
```astro
---
// src/pages/electricity-plans/[...path].astro
import Layout from '@layouts/SEOLayout.astro';
import FacetedPlanGrid from '@components/faceted/FacetedPlanGrid.astro';
import FacetedSidebar from '@components/faceted/FacetedSidebar.react';
import BreadcrumbSchema from '@components/schema/BreadcrumbSchema.astro';
import { parseFacetedUrl, fetchPlansFromAPI } from '@lib/faceted';
import { generateFacetedMeta } from '@lib/seo/meta-generator';
import { determineCanonicalUrl } from '@lib/seo/canonical';

// Pre-build high-value pages
export async function getStaticPaths() {
  const highValuePaths = [
    // City pages (Tier 1)
    { params: { path: 'dallas-tx' }, props: { priority: 1.0 } },
    { params: { path: 'houston-tx' }, props: { priority: 1.0 } },
    { params: { path: 'austin-tx' }, props: { priority: 1.0 } },
    
    // Single filters (Tier 2)
    { params: { path: 'dallas-tx/12-month' }, props: { priority: 0.8 } },
    { params: { path: 'dallas-tx/fixed-rate' }, props: { priority: 0.8 } },
    { params: { path: 'dallas-tx/green-energy' }, props: { priority: 0.8 } },
    { params: { path: 'dallas-tx/prepaid' }, props: { priority: 0.8 } },
    
    // High-value combinations (Tier 3)
    { params: { path: 'dallas-tx/12-month/fixed-rate' }, props: { priority: 0.6 } },
    { params: { path: 'houston-tx/prepaid/no-deposit' }, props: { priority: 0.6 } },
  ];
  
  return highValuePaths;
}

// Enable SSR for long-tail pages
export const prerender = false;

// Parse URL and fetch data
const { path } = Astro.params;
const { city, filters, apiParams } = parseFacetedUrl(path);

// Validate URL structure (404 for invalid combinations)
if (!city || filters.length > 3) {
  return Astro.redirect('/404', 404);
}

// Fetch plans from ComparePower API
const plans = await fetchPlansFromAPI(apiParams);

// Generate SEO metadata
const meta = generateFacetedMeta({
  city,
  filters,
  planCount: plans.length,
  lowestRate: Math.min(...plans.map(p => p.rate)),
  location: tdspMapping[city].name
});

// Determine canonical URL
const canonicalUrl = determineCanonicalUrl(Astro.url.pathname, filters);

// Generate breadcrumb data
const breadcrumbs = generateBreadcrumbs(city, filters);
---

<Layout 
  title={meta.title}
  description={meta.description}
  canonical={canonicalUrl}
  noindex={filters.length > 2} // NoIndex deep combinations
>
  <BreadcrumbSchema items={breadcrumbs} />
  
  <div class="faceted-page-container">
    <header class="faceted-header">
      <h1>{meta.h1}</h1>
      
      <!-- Dynamic content based on filters -->
      <div class="category-description">
        <Fragment set:html={meta.categoryContent} />
      </div>
      
      <!-- Trust signals -->
      <div class="trust-bar">
        <span>{plans.length} plans available</span>
        <span>Updated {new Date().toLocaleDateString()}</span>
        <span>Prices include all fees</span>
      </div>
    </header>
    
    <div class="faceted-layout">
      <!-- React component for interactive filtering -->
      <aside class="filter-sidebar">
        <FacetedSidebar 
          client:idle
          currentFilters={filters}
          availableFilters={getAvailableFilters(city, filters)}
          planCounts={getPlanCounts(plans)}
        />
      </aside>
      
      <!-- Server-rendered plan grid -->
      <main class="plan-results">
        <FacetedPlanGrid 
          plans={plans}
          city={city}
          filters={filters}
        />
      </main>
    </div>
    
    <!-- SEO content footer -->
    <footer class="seo-content">
      <Fragment set:html={meta.footerContent} />
    </footer>
  </div>
  
  <!-- Schema markup -->
  <script type="application/ld+json" set:html={JSON.stringify(meta.schema)} />
</Layout>

<style>
  .faceted-page-container {
    @apply max-w-7xl mx-auto px-4 py-8;
  }
  
  .faceted-layout {
    @apply grid grid-cols-1 lg:grid-cols-4 gap-8;
  }
  
  .filter-sidebar {
    @apply lg:col-span-1;
  }
  
  .plan-results {
    @apply lg:col-span-3;
  }
  
  .category-description {
    @apply prose prose-lg max-w-none my-6 text-gray-700;
  }
</style>
```

### 2.3 API Integration Layer

#### 2.3.1 ComparePower API Client
```typescript
// src/lib/api/comparepower-client.ts
interface ComparePowerAPIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}

export class ComparePowerClient {
  private config: ComparePowerAPIConfig;
  private cache: Map<string, CachedResponse>;

  constructor(config: ComparePowerAPIConfig) {
    this.config = config;
    this.cache = new Map();
  }

  async fetchPlans(params: ApiParams): Promise<Plan[]> {
    const cacheKey = this.getCacheKey(params);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour
        return cached.data;
      }
    }

    const queryParams = new URLSearchParams({
      group: 'default',
      tdsp_duns: params.tdsp_duns,
      display_usage: String(params.display_usage || 1000),
      ...(params.term && { term: String(params.term) }),
      ...(params.percent_green && { percent_green: String(params.percent_green) }),
      ...(params.is_pre_pay !== undefined && { is_pre_pay: String(params.is_pre_pay) }),
    });

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/plans/current?${queryParams}`,
        {
          headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: this.transformPlans(data),
        timestamp: Date.now(),
      });

      return this.transformPlans(data);
    } catch (error) {
      console.error('ComparePower API Error:', error);
      
      // Return cached data if available
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }
      
      throw error;
    }
  }

  private transformPlans(apiData: any[]): Plan[] {
    return apiData.map(plan => ({
      id: plan.id,
      name: plan.plan_name,
      provider: {
        name: plan.brand_name,
        logo: plan.brand_logo,
        rating: plan.brand_rating,
        reviewCount: plan.review_count,
      },
      pricing: {
        rate500kWh: plan.rate_500,
        rate1000kWh: plan.rate_1000,
        rate2000kWh: plan.rate_2000,
        ratePerKwh: plan.rate_per_kwh,
      },
      contract: {
        length: plan.term_months,
        type: plan.rate_type,
        earlyTerminationFee: plan.cancellation_fee,
        autoRenewal: plan.auto_renewal,
        satisfactionGuarantee: plan.satisfaction_guarantee,
      },
      features: {
        greenEnergy: plan.percent_green,
        billCredit: plan.bill_credit,
        freeTime: plan.free_time,
        deposit: {
          required: plan.deposit_required,
          amount: plan.deposit_amount,
        },
      },
      availability: {
        enrollmentType: plan.enrollment_type,
        serviceAreas: plan.service_areas,
      },
    }));
  }

  private getCacheKey(params: ApiParams): string {
    return JSON.stringify(params);
  }
}
```

### 2.4 SEO Implementation

#### 2.4.1 Dynamic Meta Generation
```typescript
// src/lib/seo/meta-generator.ts
export function generateFacetedMeta(options: FacetedMetaOptions): FacetedMeta {
  const { city, filters, planCount, lowestRate, location } = options;
  
  // Title templates
  const titleTemplates = {
    base: `${planCount} Electricity Plans in ${formatCityName(city)} | Compare Rates`,
    '12-month': `${planCount} Best 12-Month Electricity Plans in ${formatCityName(city)}`,
    'fixed-rate': `Fixed Rate Electricity Plans in ${formatCityName(city)} | Lock Your Rate`,
    'green-energy': `100% Green Energy Plans in ${formatCityName(city)} | Renewable Power`,
    'prepaid': `No Deposit Prepaid Electricity in ${formatCityName(city)} | Same Day Service`,
    '12-month,fixed-rate': `12-Month Fixed Rate Plans in ${formatCityName(city)} | Stable Pricing`,
  };

  // Description templates
  const descriptionTemplates = {
    base: `Compare ${planCount} electricity plans in ${formatCityName(city)}. Find rates as low as ${lowestRate}¢/kWh. No hidden fees, transparent pricing. Switch in minutes.`,
    '12-month': `Lock in stable rates with ${planCount} 12-month electricity plans in ${formatCityName(city)}. Rates from ${lowestRate}¢/kWh with no surprises.`,
    'fixed-rate': `Protect against rate hikes with fixed-rate electricity in ${formatCityName(city)}. ${planCount} plans starting at ${lowestRate}¢/kWh.`,
    'green-energy': `Go 100% renewable with green energy plans in ${formatCityName(city)}. ${planCount} eco-friendly options from ${lowestRate}¢/kWh.`,
    'prepaid': `Get electricity today with no deposit in ${formatCityName(city)}. ${planCount} prepaid plans available. No credit check required.`,
  };

  const filterKey = filters.join(',') || 'base';
  
  return {
    title: titleTemplates[filterKey] || titleTemplates.base,
    description: descriptionTemplates[filterKey] || descriptionTemplates.base,
    h1: generateH1(city, filters, planCount),
    categoryContent: generateCategoryContent(city, filters, planCount, lowestRate),
    footerContent: generateFooterContent(city, filters),
    schema: generateSchema({
      city,
      filters,
      planCount,
      lowestRate,
      location,
    }),
  };
}

function generateCategoryContent(
  city: string, 
  filters: string[], 
  planCount: number, 
  lowestRate: number
): string {
  const templates = {
    '12-month': `
      <p>Looking for stable electricity rates in ${formatCityName(city)}? Our 12-month electricity plans offer the perfect balance of price protection and flexibility. Lock in today's rates for a full year without the long-term commitment of 24 or 36-month contracts.</p>
      
      <p>With ${planCount} plans currently available from trusted providers, you'll find competitive rates starting as low as ${lowestRate}¢ per kWh. These annual contracts protect you from seasonal price spikes while avoiding hefty early termination fees if your needs change.</p>
      
      <p>All prices shown include energy charges, TDU delivery fees, and applicable taxes - no hidden surprises on your bill. Compare plans from top-rated providers and switch online in minutes.</p>
    `,
    'green-energy': `
      <p>Make a positive environmental impact with 100% renewable energy plans in ${formatCityName(city)}. These plans ensure your electricity usage is matched with renewable energy credits from Texas wind and solar farms.</p>
      
      <p>Choose from ${planCount} green energy options starting at just ${lowestRate}¢ per kWh - often competitive with traditional plans. Supporting renewable energy has never been more affordable or accessible.</p>
      
      <p>Every plan displayed includes complete pricing transparency and provider ratings from real customers. Join thousands of ${formatCityName(city)} residents powering their homes with clean, renewable electricity.</p>
    `,
    // Add more templates...
  };

  return templates[filters[0]] || templates['12-month'];
}
```

#### 2.4.2 Canonical URL Logic
```typescript
// src/lib/seo/canonical.ts
export function determineCanonicalUrl(currentPath: string, filters: string[]): string {
  const baseUrl = 'https://choosemypower.org';
  
  // High-value combinations that self-canonicalize
  const selfCanonicalCombos = [
    ['12-month'],
    ['fixed-rate'],
    ['green-energy'],
    ['prepaid'],
    ['12-month', 'fixed-rate'],
    ['prepaid', 'no-deposit'],
  ];

  // Check if current combination should self-canonicalize
  const isHighValue = selfCanonicalCombos.some(combo => 
    combo.length === filters.length && 
    combo.every(f => filters.includes(f))
  );

  if (isHighValue) {
    return `${baseUrl}${currentPath}`;
  }

  // Complex combinations canonical to simpler version
  if (filters.length > 2) {
    const simplifiedPath = currentPath.split('/').slice(0, -1).join('/');
    return `${baseUrl}${simplifiedPath}`;
  }

  // Low-value filters canonical to city page
  const lowValueFilters = ['time-of-use', 'business', 'spanish-plans'];
  if (filters.some(f => lowValueFilters.includes(f))) {
    const cityPath = currentPath.split('/').slice(0, 3).join('/');
    return `${baseUrl}${cityPath}/`;
  }

  // Default to self-canonical
  return `${baseUrl}${currentPath}`;
}
```

#### 2.4.3 Schema Markup Generation
```typescript
// src/lib/seo/schema.ts
export function generateFacetedSchema(data: SchemaData): object[] {
  const schemas = [];
  
  // BreadcrumbList Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://choosemypower.org"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Electricity Plans",
        "item": "https://choosemypower.org/electricity-plans"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": formatCityName(data.city),
        "item": `https://choosemypower.org/electricity-plans/${data.city}/`
      },
      ...data.filters.map((filter, index) => ({
        "@type": "ListItem",
        "position": 4 + index,
        "name": formatFilterName(filter),
        "item": `https://choosemypower.org/electricity-plans/${data.city}/${data.filters.slice(0, index + 1).join('/')}/`
      }))
    ]
  });

  // ItemList Schema for plans
  schemas.push({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": data.h1,
    "description": data.description,
    "numberOfItems": data.planCount,
    "itemListElement": data.plans.slice(0, 10).map((plan, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": plan.name,
        "brand": {
          "@type": "Brand",
          "name": plan.provider.name
        },
        "offers": {
          "@type": "Offer",
          "price": plan.pricing.rate1000kWh,
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": plan.pricing.ratePerKwh,
            "priceCurrency": "USD",
            "unitText": "kWh"
          },
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": plan.provider.rating ? {
          "@type": "AggregateRating",
          "ratingValue": plan.provider.rating,
          "reviewCount": plan.provider.reviewCount
        } : undefined
      }
    }))
  });

  // Local Business Schema for city pages
  if (data.filters.length === 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": data.h1,
      "description": data.description,
      "url": `https://choosemypower.org/electricity-plans/${data.city}/`,
      "mainEntity": {
        "@type": "Service",
        "name": "Electricity Plan Comparison",
        "provider": {
          "@type": "Organization",
          "name": "ChooseMyPower.org"
        },
        "areaServed": {
          "@type": "City",
          "name": formatCityName(data.city),
          "addressRegion": "TX"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Electricity Plans",
          "itemListElement": schemas[1].itemListElement
        }
      }
    });
  }

  return schemas;
}
```

### 2.5 Performance Optimization

#### 2.5.1 Caching Strategy
```typescript
// src/middleware/cache.ts
export async function cacheMiddleware({ request, next }) {
  const url = new URL(request.url);
  
  // Determine cache duration based on page type
  const cacheDuration = getCacheDuration(url.pathname);
  
  // Set cache headers
  const response = await next();
  
  if (response.status === 200) {
    response.headers.set('Cache-Control', `public, max-age=${cacheDuration}, s-maxage=${cacheDuration * 2}`);
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Add ETags for conditional requests
    const etag = await generateETag(response.body);
    response.headers.set('ETag', etag);
  }
  
  return response;
}

function getCacheDuration(pathname: string): number {
  // City pages update frequently
  if (pathname.match(/^\/electricity-plans\/[^\/]+\/$/)) {
    return 3600; // 1 hour
  }
  
  // Single filter pages
  if (pathname.match(/^\/electricity-plans\/[^\/]+\/[^\/]+\/$/)) {
    return 7200; // 2 hours
  }
  
  // Multi-filter combinations
  if (pathname.match(/^\/electricity-plans\/[^\/]+\/[^\/]+\/[^\/]+/)) {
    return 14400; // 4 hours
  }
  
  // Default
  return 3600;
}
```

#### 2.5.2 Edge Caching Configuration
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;
  
  // Check cache
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request);
    
    // Cache faceted pages
    if (url.pathname.includes('/electricity-plans/') && response.status === 200) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.set('X-Cache-Status', 'MISS');
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }
  } else {
    // Add cache hit header
    const headers = new Headers(response.headers);
    headers.set('X-Cache-Status', 'HIT');
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }
  
  return response;
}
```

### 2.6 Internal Linking Strategy

#### 2.6.1 Hub & Spoke Implementation
```astro
---
// src/components/faceted/InternalLinking.astro
export interface Props {
  currentCity: string;
  currentFilters: string[];
  planCount: number;
}

const { currentCity, currentFilters, planCount } = Astro.props;

// Define high-value links based on current page
const getRelevantLinks = () => {
  const baseUrl = `/electricity-plans/${currentCity}`;
  
  // City page links to all major filters
  if (currentFilters.length === 0) {
    return [
      { url: `${baseUrl}/12-month/`, text: '12-Month Plans', count: 45 },
      { url: `${baseUrl}/fixed-rate/`, text: 'Fixed Rate Plans', count: 62 },
      { url: `${baseUrl}/green-energy/`, text: '100% Green Energy', count: 23 },
      { url: `${baseUrl}/prepaid/`, text: 'No Deposit Plans', count: 18 },
      { url: `${baseUrl}/month-to-month/`, text: 'Month-to-Month', count: 15 },
    ];
  }
  
  // Single filter pages only link back to hub
  if (currentFilters.length === 1) {
    return [
      { url: `${baseUrl}/`, text: `All ${formatCityName(currentCity)} Plans`, count: planCount }
    ];
  }
  
  // Multi-filter pages link to parent
  return [
    { 
      url: `${baseUrl}/${currentFilters[0]}/`, 
      text: `All ${formatFilterName(currentFilters[0])} Plans`, 
      count: null 
    }
  ];
};

const links = getRelevantLinks();
---

<nav class="internal-links" aria-label="Related electricity plan categories">
  <h3 class="sr-only">Browse related plan types</h3>
  <div class="link-grid">
    {links.map(link => (
      <a href={link.url} class="category-link">
        <span class="link-text">{link.text}</span>
        {link.count && <span class="plan-count">({link.count})</span>}
      </a>
    ))}
  </div>
</nav>

<style>
  .internal-links {
    @apply my-8 p-6 bg-gray-50 rounded-lg;
  }
  
  .link-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }
  
  .category-link {
    @apply flex items-center justify-between p-4 bg-white rounded border border-gray-200 hover:border-blue-500 transition-colors;
  }
  
  .link-text {
    @apply font-medium text-gray-900;
  }
  
  .plan-count {
    @apply text-sm text-gray-600;
  }
</style>
```

### 2.7 Analytics & Monitoring

#### 2.7.1 Enhanced Analytics Tracking
```typescript
// src/lib/analytics/faceted-tracking.ts
export class FacetedAnalytics {
  trackPageView(data: FacetedPageData): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faceted_page_view', {
        page_type: 'faceted_category',
        city: data.city,
        filters_active: data.filters,
        filter_count: data.filters.length,
        plan_count: data.planCount,
        lowest_rate: data.lowestRate,
        tdsp_zone: data.tdspZone,
        canonical_self: data.canonicalSelf,
        page_depth: data.filters.length + 1,
      });
    }
  }

  trackFilterInteraction(action: string, filter: string, resultCount: number): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'filter_interaction', {
        action: action, // 'add' or 'remove'
        filter_type: filter,
        result_count: resultCount,
        page_url: window.location.pathname,
      });
    }
  }

  trackPlanClick(plan: Plan, position: number, pageData: FacetedPageData): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'plan_click', {
        plan_id: plan.id,
        plan_name: plan.name,
        provider: plan.provider.name,
        rate: plan.pricing.rate1000kWh,
        position: position,
        page_type: 'faceted',
        city: pageData.city,
        filters: pageData.filters,
      });
    }
  }
}
```

#### 2.7.2 Performance Monitoring
```typescript
// src/lib/monitoring/performance.ts
export function trackFacetedPerformance() {
  if ('PerformanceObserver' in window) {
    // Track Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      window.gtag('event', 'performance_metric', {
        metric_name: 'LCP',
        value: lastEntry.startTime,
        page_type: 'faceted',
        page_url: window.location.pathname,
      });
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Track API response times
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('api.comparepower.com')) {
          window.gtag('event', 'api_performance', {
            endpoint: entry.name,
            duration: entry.duration,
            response_size: entry.transferSize,
            cache_hit: entry.transferSize === 0,
          });
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
  }
}
```

### 2.8 Testing & Quality Assurance

#### 2.8.1 Faceted Page Testing
```typescript
// tests/faceted/faceted-pages.test.ts
import { test, expect } from '@playwright/test';
import { tdspMapping } from '@/config/tdsp-mapping';

test.describe('Faceted Navigation Pages', () => {
  // Test city pages
  for (const city of Object.keys(tdspMapping).slice(0, 5)) {
    test(`City page: ${city}`, async ({ page }) => {
      await page.goto(`/electricity-plans/${city}/`);
      
      // Check page loads
      await expect(page).toHaveTitle(new RegExp(`Electricity Plans in .+ \\| Compare Rates`));
      
      // Verify plans loaded
      const planCards = page.locator('.plan-card');
      await expect(planCards).toHaveCount(20); // At least 20 plans
      
      // Check meta tags
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description).toContain('Compare');
      expect(description).toContain('electricity plans');
      
      // Verify schema markup
      const schema = await page.locator('script[type="application/ld+json"]').textContent();
      expect(schema).toContain('BreadcrumbList');
      expect(schema).toContain('ItemList');
    });
  }
  
  // Test filter combinations
  const filterCombos = [
    ['dallas-tx', '12-month'],
    ['houston-tx', 'green-energy'],
    ['austin-tx', '12-month', 'fixed-rate'],
  ];
  
  for (const combo of filterCombos) {
    test(`Filter combo: ${combo.join('/')}`, async ({ page }) => {
      await page.goto(`/electricity-plans/${combo.join('/')}/`);
      
      // Verify filtered results
      const planCards = page.locator('.plan-card');
      const count = await planCards.count();
      expect(count).toBeGreaterThan(0);
      
      // Check canonical tag
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toBeDefined();
      
      // Verify active filters displayed
      if (combo.length > 1) {
        const activeFilters = page.locator('.active-filters .filter-tag');
        await expect(activeFilters).toHaveCount(combo.length - 1);
      }
    });
  }
});

// Test canonical logic
test.describe('Canonical URL Logic', () => {
  test('High-value pages self-canonicalize', async ({ page }) => {
    await page.goto('/electricity-plans/dallas-tx/12-month/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://choosemypower.org/electricity-plans/dallas-tx/12-month/');
  });
  
  test('Complex combos canonical to parent', async ({ page }) => {
    await page.goto('/electricity-plans/dallas-tx/12-month/fixed-rate/1000-kwh/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://choosemypower.org/electricity-plans/dallas-tx/12-month/fixed-rate/');
  });
});

// Test robots meta tags
test.describe('Robots Meta Tags', () => {
  test('Deep combinations are noindexed', async ({ page }) => {
    await page.goto('/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/');
    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    expect(robots).toContain('noindex');
  });
  
  test('High-value pages are indexed', async ({ page }) => {
    await page.goto('/electricity-plans/dallas-tx/12-month/');
    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    expect(robots || 'index,follow').not.toContain('noindex');
  });
});
```

---

## 3. Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [x] Set up Astro project with TypeScript
- [x] Configure build pipeline and deployment
- [ ] Implement TDSP mapping and URL routing
- [ ] Create ComparePower API client
- [ ] Build basic faceted page template

### Phase 2: Core Features (Weeks 3-4)
- [ ] Implement meta tag generation system
- [ ] Build canonical URL logic
- [ ] Create schema markup generators
- [ ] Develop filter sidebar component
- [ ] Implement caching layers

### Phase 3: SEO Features (Weeks 5-6)
- [ ] Generate high-priority static pages
- [ ] Implement dynamic sitemap generation
- [ ] Configure robots.txt rules
- [ ] Set up internal linking system
- [ ] Create category content templates

### Phase 4: Performance & Analytics (Weeks 7-8)
- [ ] Implement edge caching
- [ ] Set up performance monitoring
- [ ] Configure analytics tracking
- [ ] Build A/B testing framework
- [ ] Optimize Core Web Vitals

### Phase 5: Launch & Iterate (Weeks 9-10)
- [ ] Gradual rollout of faceted pages
- [ ] Monitor Search Console
- [ ] Analyze user behavior
- [ ] Iterate on content and structure
- [ ] Scale to additional cities

---

## 4. Success Metrics

### Technical KPIs
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Speed | <2s | Lighthouse |
| Core Web Vitals | All green | PageSpeed Insights |
| API Response Time | <500ms | Datadog |
| Cache Hit Rate | >80% | CloudFlare Analytics |
| Error Rate | <0.5% | Sentry |

### SEO KPIs
| Metric | Target | Timeline |
|--------|--------|----------|
| Indexed Pages | 1,000+ | Month 2 |
| Organic Traffic | +200% | Month 6 |
| Long-tail Keywords | 500+ ranking | Month 4 |
| Average Position | Top 10 | Month 6 |
| CTR | >5% | Month 3 |

### Business KPIs
| Metric | Target | Timeline |
|--------|--------|----------|
| Conversion Rate | 3-4% | Month 3 |
| Revenue/Visitor | $0.75+ | Month 4 |
| Monthly Revenue | $75K | Month 6 |
| Cost per Conversion | <$10 | Month 3 |

---

## 5. Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching, request queuing, fallback data
- **Data Accuracy**: Validation layers, monitoring, alerts
- **Page Proliferation**: Smart URL rules, crawl budget management
- **Performance Impact**: Edge caching, lazy loading, code splitting

### SEO Risks
- **Duplicate Content**: Canonical tags, unique content per page
- **Crawl Budget**: Robots.txt, priority sitemaps, monitoring
- **Index Bloat**: NoIndex rules, quality thresholds
- **Algorithm Updates**: Diverse strategy, quality focus

---

**Document Status**: Ready for technical review
**Next Steps**:
1. Technical architecture approval
2. API access agreement with ComparePower
3. Development environment setup
4. Sprint planning for Phase 1

**Sign-offs Required**:
- [ ] Product Owner
- [ ] Engineering Lead  
- [ ] SEO Lead
- [ ] ComparePower API Team
- [ ] Security Review