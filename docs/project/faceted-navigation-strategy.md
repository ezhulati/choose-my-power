# Faceted Navigation SEO Strategy for ChooseMyPower.org

## Executive Summary

This document provides a comprehensive faceted navigation implementation strategy for ChooseMyPower.org, transforming live electricity plan data into scalable SEO landing pages. By leveraging ComparePoower's existing pricing API infrastructure, we can create thousands of targeted pages capturing high-intent Texas electricity shopping searches.

## Current API Structure

ChooseMyPower.org will leverage ComparePoower's existing pricing API:

```
GET https://pricing.api.comparepower.com/api/plans/current?group=default&tdsp_duns=103994067400&display_usage=1000
```

**Note:** This implementation assumes API access agreement between ChooseMyPower.org and ComparePoower for electricity plan data.

Available filter parameters:
- `tdsp_duns` (required): Utility DUNS number
- `term`: Contract length (6, 12, 24 months)
- `percent_green`: Green energy percentage (0, 10, 50, 100)
- `is_pre_pay`: Prepaid plans (true/false)
- `is_time_of_use`: Time-of-use plans (true/false)
- `requires_auto_pay`: Autopay required (true/false)
- `display_usage`: Monthly kWh usage (500, 1000, 2000)
- `brand_id`: Specific provider ID

## Phase 1: URL Architecture & Structure

### Primary URL Structure

Transform API parameters into clean, crawlable URLs:

**Base Structure:**
- `/electricity-plans/` (master hub page)
- `/electricity-plans/[city-slug]/` (location pages)
- `/electricity-plans/[city-slug]/[filter]/` (single filter)
- `/electricity-plans/[city-slug]/[filter-1]/[filter-2]/` (combinations)

**Examples:**
- `/electricity-plans/dallas-tx/`
- `/electricity-plans/dallas-tx/12-month/`
- `/electricity-plans/dallas-tx/fixed-rate/green-energy/`
- `/electricity-plans/dallas-tx/prepaid/`

### TDSP Zone Mapping

Create URL-friendly mappings for Texas utilities:

```javascript
const tdspMapping = {
  'dallas-tx': '103994067400', // Oncor
  'houston-tx': '103994067401', // CenterPoint
  'austin-tx': '103994067402', // Austin Energy
  'san-antonio-tx': '103994067403', // CPS Energy
  // Add all TDSP zones
};
```

### Filter URL Segments

Map API parameters to SEO-friendly URL segments:

```javascript
const filterMapping = {
  term: {
    '6': '6-month',
    '12': '12-month', 
    '24': '24-month',
    '36': '36-month'
  },
  rate_type: {
    'fixed': 'fixed-rate',
    'variable': 'variable-rate',
    'indexed': 'indexed-rate'
  },
  green_energy: {
    '100': 'green-energy',
    '50': 'partial-green'
  },
  plan_features: {
    'is_pre_pay': 'prepaid',
    'requires_auto_pay': 'autopay-discount',
    'is_time_of_use': 'time-of-use'
  }
};
```

## Phase 2: Technical Implementation

### Server-Side Rendering Architecture

Implement Next.js or similar SSR framework:

```javascript
// lib/comparepower-api.js
async function fetchPlansFromAPI(filters) {
  const params = new URLSearchParams({
    group: 'default',
    tdsp_duns: filters.tdsp_duns,
    display_usage: filters.usage || 1000,
    ...filters
  });
  
  const response = await fetch(
    `https://pricing.api.comparepower.com/api/plans/current?${params}`
  );
  
  return response.json();
}

// pages/electricity-plans/[...slug].js
export async function getStaticPaths() {
  // Generate paths for high-value combinations
  const paths = [
    '/electricity-plans/dallas-tx/',
    '/electricity-plans/dallas-tx/12-month/',
    '/electricity-plans/dallas-tx/fixed-rate/',
    '/electricity-plans/dallas-tx/green-energy/',
    // High-value combinations
    '/electricity-plans/dallas-tx/12-month/fixed-rate/',
  ];
  
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const filters = parseUrlToApiParams(params.slug);
  const plans = await fetchPlansFromAPI(filters); // Calls ComparePoower API
  
  return {
    props: { plans, filters },
    revalidate: 3600 // Revalidate every hour
  };
}
```

### Dynamic Meta Tags & Content

Generate unique meta content for each faceted page:

```javascript
function generateMetaTags(filters, location, planCount) {
  const templates = {
    'title': {
      'base': `${planCount} Electricity Plans in ${location} | Compare Rates`,
      '12-month': `${planCount} 12-Month Electricity Plans in ${location}`,
      'fixed-rate': `Fixed Rate Electricity Plans in ${location} | Lock Your Rate`,
      'green-energy': `100% Green Energy Plans in ${location} | Renewable Power`,
      'prepaid': `No Deposit Prepaid Electricity in ${location}`,
    },
    'description': {
      'base': `Compare ${planCount} electricity plans in ${location}. Find rates as low as ${lowestRate}¢/kWh. No hidden fees. Switch in minutes.`,
      // Add variations for each filter
    }
  };
  
  return generateFromTemplate(templates, filters);
}
```

### Canonicalization Logic

Implement smart canonical rules:

```javascript
function generateCanonical(currentUrl, filters) {
  // Self-canonical for high-value pages
  const highValueCombos = [
    ['12-month'],
    ['fixed-rate'],
    ['green-energy'],
    ['12-month', 'fixed-rate'],
  ];
  
  if (isHighValueCombo(filters, highValueCombos)) {
    return currentUrl; // Self-referencing
  }
  
  // Complex combos canonical to simpler versions
  if (filters.length > 2) {
    return generateUrlFromFilters(filters.slice(0, 1));
  }
  
  // Low-value filters canonical to parent
  return getParentCategoryUrl(currentUrl);
}
```

## Phase 3: Content Strategy

### Dynamic H1 Generation

```javascript
const h1Templates = {
  'base': 'Electricity Plans in {location}',
  '12-month': '12-Month Electricity Plans in {location}',
  'fixed-rate': 'Fixed Rate Electricity Plans in {location}',
  'green-energy': '100% Renewable Energy Plans in {location}',
  'prepaid': 'Prepaid Electricity Plans with No Deposit in {location}',
  // Combinations
  '12-month,fixed-rate': '12-Month Fixed Rate Plans in {location}',
};
```

### Category Description Content

Add 150-300 words of unique content per faceted page:

```javascript
const contentTemplates = {
  '12-month': `
    <div class="category-description">
      <p>Lock in stable electricity rates for a full year with our 12-month plans in {location}. 
      These plans offer price protection against market volatility while avoiding early termination 
      fees common with longer contracts.</p>
      
      <p>Current 12-month rates in {location} range from {minRate}¢ to {maxRate}¢ per kWh for 
      {avgUsage} kWh monthly usage. Compare {planCount} available plans from {providerCount} 
      trusted providers.</p>
    </div>
  `,
  // Add templates for each valuable facet
};
```

### Schema Markup Implementation

```javascript
function generateSchema(pageType, data) {
  const schemas = [];
  
  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": generateBreadcrumbs(data.url)
  });
  
  // ItemList for plans
  schemas.push({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": data.h1,
    "description": data.metaDescription,
    "numberOfItems": data.planCount,
    "itemListElement": data.plans.map((plan, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": plan.name,
        "offers": {
          "@type": "Offer",
          "price": plan.rate,
          "priceCurrency": "USD"
        }
      }
    }))
  });
  
  return schemas;
}
```

## Phase 4: Keyword Mapping & Prioritization

### High-Priority Faceted Pages by Search Volume

**Tier 1 (1,000+ searches/month):**
- `/dallas-tx/` - "electricity plans dallas"
- `/houston-tx/` - "houston electric companies"
- `/dallas-tx/cheap/` - "cheap electricity dallas"
- `/houston-tx/no-deposit/` - "no deposit electricity houston"

**Tier 2 (100-1,000 searches/month):**
- `/dallas-tx/12-month/` - "12 month electricity plans dallas"
- `/austin-tx/green-energy/` - "renewable energy plans austin"
- `/houston-tx/fixed-rate/` - "fixed rate electricity houston"

**Tier 3 (Long-tail opportunities):**
- `/dallas-tx/12-month/fixed-rate/` - "12 month fixed electricity dallas"
- `/houston-tx/prepaid/same-day/` - "same day prepaid electricity houston"

### Dynamic Filter Combinations

```javascript
// Only create pages for combinations with search demand
const allowedCombinations = [
  ['term', 'rate_type'], // "12 month fixed rate"
  ['location', 'green_energy'], // "green energy dallas"
  ['location', 'plan_features.prepaid'], // "prepaid electricity houston"
];

// Block low-value combinations
const blockedCombinations = [
  ['sort_order'], // Never index sort variations
  ['page_number'], // Pagination beyond page 2
  ['display_usage', 'any_other'], // Usage + other filters
];
```

## Phase 5: Crawl Management

### Robots.txt Configuration

```
User-agent: *
# Block sorting and pagination
Disallow: /*?sort=
Disallow: /*?page=
Disallow: /*&sort=
Disallow: /*&page=

# Block low-value filter combinations
Disallow: /*/*/*/*/*/ # 4+ filter depth
Disallow: /*/time-of-use/
Disallow: /*/business/

# Allow high-value facets
Allow: /electricity-plans/*/12-month/$
Allow: /electricity-plans/*/fixed-rate/$
Allow: /electricity-plans/*/green-energy/$
```

### XML Sitemap Strategy

```xml
<!-- faceted-plans-sitemap.xml -->
<urlset>
  <!-- City pages (highest priority) -->
  <url>
    <loc>https://choosemypower.org/electricity-plans/dallas-tx/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Single filter pages -->
  <url>
    <loc>https://choosemypower.org/electricity-plans/dallas-tx/12-month/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- High-value combinations -->
  <url>
    <loc>https://choosemypower.org/electricity-plans/dallas-tx/12-month/fixed-rate/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

## Phase 6: Performance Optimization

### Caching Strategy

```javascript
// Cache configuration
const cacheStrategy = {
  // CDN edge caching
  'city-pages': {
    maxAge: 3600, // 1 hour
    sMaxAge: 7200, // 2 hours CDN
  },
  'single-filter': {
    maxAge: 7200, // 2 hours
    sMaxAge: 14400, // 4 hours CDN
  },
  'multi-filter': {
    maxAge: 14400, // 4 hours
    sMaxAge: 28800, // 8 hours CDN
  }
};

// Fragment caching for plan cards
function getCachedPlanCard(planId) {
  const cacheKey = `plan-card-${planId}`;
  return cache.get(cacheKey) || generateAndCache(planId);
}
```

### Database Query Optimization

```sql
-- Indexed columns for faceted queries
CREATE INDEX idx_plans_tdsp_term ON plans(tdsp_duns, term_length);
CREATE INDEX idx_plans_green ON plans(percent_green);
CREATE INDEX idx_plans_features ON plans(is_pre_pay, requires_auto_pay);

-- Optimized query for faceted results
SELECT p.*, 
       COUNT(*) OVER() as total_count,
       MIN(rate_per_kwh) OVER() as min_rate,
       MAX(rate_per_kwh) OVER() as max_rate
FROM plans p
WHERE tdsp_duns = ? 
  AND term_length = ?
  AND is_active = 1
ORDER BY rate_per_kwh ASC
LIMIT 50;
```

## Phase 7: Internal Linking Architecture

### Hub & Spoke Model

```javascript
// Main category pages link to valuable facets
const hubPageLinks = {
  '/electricity-plans/dallas-tx/': [
    { url: '/electricity-plans/dallas-tx/12-month/', anchor: '12-Month Plans' },
    { url: '/electricity-plans/dallas-tx/fixed-rate/', anchor: 'Fixed Rate Plans' },
    { url: '/electricity-plans/dallas-tx/green-energy/', anchor: '100% Green Energy' },
    { url: '/electricity-plans/dallas-tx/prepaid/', anchor: 'No Deposit Plans' },
  ]
};

// Faceted pages only link back to hub
const spokePageLinks = {
  '/electricity-plans/dallas-tx/12-month/': [
    { url: '/electricity-plans/dallas-tx/', anchor: 'All Dallas Plans' },
    // No links between faceted pages
  ]
};
```

### Contextual Filter Links

```html
<!-- Active filters with removal option -->
<div class="active-filters">
  <span class="filter-tag">
    12 Month 
    <a href="/electricity-plans/dallas-tx/" rel="nofollow">×</a>
  </span>
  <span class="filter-tag">
    Fixed Rate
    <a href="/electricity-plans/dallas-tx/12-month/" rel="nofollow">×</a>
  </span>
</div>

<!-- Available filters (only show if valuable) -->
<div class="filter-options">
  <h3>Contract Length</h3>
  <a href="/electricity-plans/dallas-tx/6-month/">6 Month</a>
  <a href="/electricity-plans/dallas-tx/12-month/">12 Month</a>
  <a href="/electricity-plans/dallas-tx/24-month/">24 Month</a>
</div>
```

## Phase 8: Monitoring & KPIs

### Key Metrics to Track

```javascript
// Google Analytics 4 Events
gtag('event', 'faceted_page_view', {
  'page_type': 'faceted_category',
  'filters_active': ['12-month', 'fixed-rate'],
  'plan_count': 45,
  'tdsp_zone': 'oncor',
  'lowest_rate': 0.089
});

// Conversion tracking
gtag('event', 'plan_enrollment', {
  'landing_page_type': 'faceted',
  'filters_on_landing': ['12-month'],
  'plan_selected': 'Reliant Basic 12',
  'rate': 0.092
});
```

### Search Console Monitoring

Monitor these specific metrics:
- Impressions by page pattern (`/electricity-plans/*/`)
- CTR for faceted pages vs standard pages
- Average position for target keywords
- Pages with high impressions but low CTR (optimization opportunities)

### Performance Dashboard

```sql
-- Weekly faceted page performance
SELECT 
  url_pattern,
  COUNT(DISTINCT session_id) as sessions,
  AVG(plans_viewed) as avg_plans_viewed,
  SUM(enrollments) as total_enrollments,
  SUM(enrollments)::FLOAT / COUNT(DISTINCT session_id) as conversion_rate
FROM analytics_events
WHERE page_type = 'faceted'
  AND date >= CURRENT_DATE - 7
GROUP BY url_pattern
ORDER BY conversion_rate DESC;
```

## Phase 9: Testing & Rollout

### A/B Testing Framework

```javascript
// Test faceted page elements
const tests = {
  'meta_description': {
    'control': 'Compare {count} electricity plans in {location}',
    'variant': 'Find electricity rates from {minRate}¢/kWh in {location}'
  },
  'h1_format': {
    'control': '{filter} Electricity Plans in {location}',
    'variant': '{location} {filter} Electricity Rates'
  },
  'cta_text': {
    'control': 'View Plan Details',
    'variant': 'Check Availability'
  }
};
```

### Phased Rollout Schedule

**Week 1-2: Infrastructure**
- Set up URL routing
- Implement server-side rendering
- Configure caching layers

**Week 3-4: High-Value Pages**
- Launch major city pages
- Deploy single-filter pages (term length)
- Monitor crawling and indexation

**Week 5-6: Expansion**
- Add provider-specific pages
- Implement green energy filters
- Launch prepaid/no-deposit pages

**Week 7-8: Optimization**
- Analyze performance data
- Adjust canonical strategies
- Fine-tune internal linking

## Phase 10: Expected Results & ROI

### Traffic Projections

Based on industry benchmarks:
- **Month 1-2**: 20-30% increase in indexed pages
- **Month 3-4**: 50-100% increase in long-tail traffic
- **Month 6**: 200-300% increase in organic conversions

### Conversion Rate Improvements

Faceted pages typically show:
- 25-35% higher conversion rates than generic category pages
- 40-50% lower bounce rates due to better intent matching
- 2-3x higher revenue per visitor

### Competitive Advantages

This implementation will:
- Capture searches competitors miss (long-tail combinations)
- Provide better user experience than state-run Power to Choose
- Build topical authority for Texas electricity searches
- Create scalable framework for new markets/features

## Technical Implementation Checklist

### Prerequisites
- [ ] Server-side rendering capability
- [ ] Database indexes on filter columns
- [ ] CDN configuration for edge caching
- [ ] Analytics tracking implementation

### Phase 1 Launch
- [ ] URL routing for city pages
- [ ] API integration for live data
- [ ] Meta tag generation
- [ ] Canonical tag logic
- [ ] Basic schema markup

### Phase 2 Enhancement
- [ ] Multi-filter URL support
- [ ] Advanced canonicalization
- [ ] Internal linking logic
- [ ] XML sitemap generation
- [ ] Robots.txt rules

### Phase 3 Optimization
- [ ] Performance monitoring
- [ ] A/B testing framework
- [ ] Cache optimization
- [ ] Crawl budget monitoring
- [ ] Conversion tracking

## Conclusion

This faceted navigation strategy transforms ChooseMyPower.org's dynamic pricing data into a powerful SEO asset. By implementing clean URLs, strategic canonicalization, and careful crawl management, the site can capture thousands of high-intent electricity shopping queries while maintaining excellent user experience and site performance.