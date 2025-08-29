# ChooseMyPower Faceted Navigation Implementation Guide

## Mission: Implement Comprehensive Faceted Navigation for Texas Electricity Plans

Based on the Azure AI Search faceted navigation patterns, this guide provides detailed implementation instructions for creating a world-class faceted navigation system for the ChooseMyPower electricity comparison platform.

---

## **1. Understanding Faceted Navigation for Electricity Plans**

### **What We're Building:**
A sophisticated filtering system that allows users to navigate through 880+ Texas cities and thousands of electricity plans using multiple filter dimensions simultaneously.

### **Key Concepts Applied to Electricity Plans:**
- **Dynamic Facets**: Filter buckets that update based on current search results
- **Multi-dimensional Filtering**: Combine location, plan features, pricing, and provider filters
- **Hierarchical Navigation**: City → Plan Type → Features → Provider progression
- **Real-time Counts**: Show number of available plans for each filter combination

---

## **2. Faceted Fields Architecture for Electricity Data**

### **Primary Facetable Fields:**

```typescript
// Core Location Facets
interface LocationFacets {
  city_slug: string;           // "dallas-tx", "houston-tx"
  tdsp_zone: string;          // "North", "Coast", "Central", "South"
  service_area: string;       // "Oncor", "CenterPoint", "AEP"
}

// Plan Characteristic Facets
interface PlanFacets {
  rate_type: string;          // "fixed", "variable", "indexed"
  contract_length: number;    // 12, 24, 36 months
  green_energy: boolean;      // true/false
  plan_features: string[];    // ["no-deposit", "prepaid", "free-nights"]
  price_range: string;        // "0-8", "8-12", "12-16", "16+" cents/kWh
}

// Provider Facets
interface ProviderFacets {
  provider_name: string;      // "TXU Energy", "Reliant", "Direct Energy"
  provider_rating: number;    // 3.5, 4.0, 4.5, 5.0
  customer_type: string;      // "residential", "business", "both"
}

// Usage Pattern Facets
interface UsageFacets {
  usage_tier: string;         // "low-500", "medium-1000", "high-2000+"
  bill_credits: boolean;      // plans with bill credits
  time_of_use: boolean;       // weekend/night free plans
}
```

---

## **3. URL Structure and Routing Patterns**

### **Hierarchical URL Design:**
```
/electricity-plans/[city]/[filters]...

Examples:
/electricity-plans/dallas-tx/
/electricity-plans/dallas-tx/12-month/
/electricity-plans/dallas-tx/12-month/fixed-rate/
/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/
/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/no-deposit/
```

### **Multi-Filter Combinations:**
```
// Contract + Rate Type + Features
/electricity-plans/houston-tx/24-month+fixed-rate+green-energy/

// Price Range + Provider + Features  
/electricity-plans/austin-tx/8-12-cents+reliant+prepaid/

// Complex Multi-Dimensional
/electricity-plans/fort-worth-tx/12-month+variable-rate+green-energy+no-deposit+bill-credits/
```

---

## **4. Database Schema for Faceted Search**

### **Enhanced Plan Index Schema:**
```sql
-- Add faceted search support to plans table
ALTER TABLE plans ADD COLUMN facets JSONB;
ALTER TABLE plans ADD COLUMN search_vector tsvector;

-- Create indexes for fast faceted queries
CREATE INDEX idx_plans_facets_gin ON plans USING gin(facets);
CREATE INDEX idx_plans_search_vector ON plans USING gin(search_vector);
CREATE INDEX idx_plans_city_rate_type ON plans(city_slug, rate_type);
CREATE INDEX idx_plans_contract_green ON plans(contract_length, green_energy);

-- Facets structure example
UPDATE plans SET facets = jsonb_build_object(
  'location', jsonb_build_object(
    'city_slug', city_slug,
    'tdsp_zone', tdsp_zone,
    'service_area', service_area
  ),
  'plan_features', jsonb_build_object(
    'rate_type', rate_type,
    'contract_length', contract_length,
    'green_energy', green_energy,
    'features', features_array
  ),
  'pricing', jsonb_build_object(
    'rate_cents', rate_cents,
    'price_range', price_range,
    'bill_credits', has_bill_credits
  ),
  'provider', jsonb_build_object(
    'name', provider_name,
    'rating', provider_rating
  )
);
```

---

## **5. API Implementation for Faceted Search**

### **Faceted Search API Endpoint:**
```typescript
// /src/pages/api/search/faceted.ts
export async function POST(request: Request) {
  const { city, filters, search_query } = await request.json();
  
  // Build faceted query
  const facetedQuery = buildFacetedQuery({
    city_slug: city,
    applied_filters: filters,
    search_text: search_query
  });
  
  const result = await executeAdvancedSearch(facetedQuery);
  
  return Response.json({
    '@search.facets': result.facets,
    '@odata.count': result.total_count,
    value: result.plans,
    applied_filters: filters,
    available_filters: result.available_facets
  });
}

interface FacetedSearchQuery {
  base_query: string;
  facets: {
    rate_type: { count: number, sort: 'count' },
    contract_length: { count: 5, sort: 'value' },
    green_energy: { count: 2 },
    provider_name: { count: 10, sort: 'count' },
    price_range: { values: '8|12|16|20', interval: 4 }
  };
  filters: string[];
  city_constraint: string;
}
```

---

## **6. Frontend Faceted Navigation Components**

### **Main Faceted Search Component:**
```tsx
// /src/components/faceted/FacetedPlanSearch.tsx
interface FacetedPlanSearchProps {
  city: string;
  initialFilters?: AppliedFilter[];
  searchQuery?: string;
}

export function FacetedPlanSearch({ city, initialFilters = [], searchQuery = '' }) {
  const [facets, setFacets] = useState<FacetResponse | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>(initialFilters);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time search with debouncing
  const debouncedSearch = useCallback(
    debounce(async (query: string, filters: AppliedFilter[]) => {
      setLoading(true);
      const results = await searchPlans({
        city,
        query,
        filters,
        facets: ['rate_type', 'contract_length', 'green_energy', 'provider_name', 'price_range']
      });
      
      setFacets(results['@search.facets']);
      setPlans(results.value);
      setLoading(false);
    }, 300),
    [city]
  );
  
  return (
    <div className="faceted-search-container">
      {/* Search Input */}
      <SearchInput 
        value={searchQuery}
        onChange={(query) => debouncedSearch(query, appliedFilters)}
        placeholder={`Search ${city} electricity plans...`}
      />
      
      {/* Applied Filters Breadcrumb */}
      <FilterBreadcrumb 
        filters={appliedFilters}
        onRemoveFilter={removeFilter}
        onClearAll={clearAllFilters}
      />
      
      <div className="faceted-layout">
        {/* Faceted Navigation Sidebar */}
        <FacetedSidebar 
          facets={facets}
          appliedFilters={appliedFilters}
          onToggleFilter={toggleFilter}
          loading={loading}
        />
        
        {/* Plan Results Grid */}
        <PlanResultsGrid 
          plans={plans}
          loading={loading}
          totalCount={facets?.['@odata.count'] || 0}
          sortOptions={['rate-asc', 'rate-desc', 'contract-asc', 'rating-desc']}
        />
      </div>
    </div>
  );
}
```

### **Faceted Sidebar Component:**
```tsx
// /src/components/faceted/FacetedSidebar.tsx
export function FacetedSidebar({ facets, appliedFilters, onToggleFilter, loading }) {
  return (
    <aside className="faceted-sidebar">
      {/* Rate Type Facet */}
      <FacetGroup 
        title="Rate Type"
        facetKey="rate_type"
        facetData={facets?.rate_type}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="checkbox"
      />
      
      {/* Contract Length Facet */}
      <FacetGroup 
        title="Contract Length"
        facetKey="contract_length"
        facetData={facets?.contract_length}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="checkbox"
        sortBy="value"
      />
      
      {/* Green Energy Facet */}
      <FacetGroup 
        title="Green Energy"
        facetKey="green_energy"
        facetData={facets?.green_energy}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="toggle"
      />
      
      {/* Price Range Facet */}
      <FacetGroup 
        title="Price Range (¢/kWh)"
        facetKey="price_range"
        facetData={facets?.price_range}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="range"
        rangeLabels={['Under 8¢', '8-12¢', '12-16¢', '16-20¢', '20¢+']}
      />
      
      {/* Provider Facet */}
      <FacetGroup 
        title="Provider"
        facetKey="provider_name"
        facetData={facets?.provider_name}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="checkbox"
        showCount={8}
        expandable={true}
      />
      
      {/* Plan Features Facet */}
      <FacetGroup 
        title="Plan Features"
        facetKey="plan_features"
        facetData={facets?.plan_features}
        appliedFilters={appliedFilters}
        onToggle={onToggleFilter}
        displayFormat="checkbox"
        multiSelect={true}
      />
    </aside>
  );
}
```

---

## **7. Advanced Faceted Features Implementation**

### **Hierarchical Facets (City → TDSP → Plans):**
```typescript
// Hierarchical facet query example
const hierarchicalFacets = {
  "facets": [
    "tdsp_zone > city_slug", 
    "provider_name > (rate_type ; contract_length)"
  ]
};

// Response structure:
{
  "@search.facets": {
    "tdsp_zone": [
      {
        "value": "North",
        "count": 2547,
        "@search.facets": {
          "city_slug": [
            { "value": "dallas-tx", "count": 1234 },
            { "value": "fort-worth-tx", "count": 892 },
            { "value": "plano-tx", "count": 421 }
          ]
        }
      }
    ]
  }
}
```

### **Facet Filtering with Regular Expressions:**
```typescript
// Filter providers starting with specific letters
const providerFilterFacets = {
  "facets": [
    "provider_name,includeTermFilter:/(TXU|Reliant|Direct).*/"
  ]
};

// Filter contract lengths to common terms only
const contractFilterFacets = {
  "facets": [
    "contract_length,includeTermFilter:/(12|24|36)/"
  ]
};
```

### **Facet Aggregations for Business Intelligence:**
```typescript
// Calculate average rates per provider
const aggregatedFacets = {
  "facets": [
    "provider_name, metric: avg, field: rate_cents",
    "rate_type, metric: sum, field: plan_count"
  ]
};
```

---

## **8. URL State Management and SEO**

### **URL Sync Implementation:**
```typescript
// /src/lib/faceted/url-state-manager.ts
export class FacetedURLStateManager {
  static encodeFiltersToURL(filters: AppliedFilter[]): string {
    const segments = filters
      .sort((a, b) => FILTER_ORDER.indexOf(a.type) - FILTER_ORDER.indexOf(b.type))
      .map(filter => filter.urlSegment);
    
    return segments.join('/');
  }
  
  static decodeURLToFilters(pathSegments: string[]): AppliedFilter[] {
    return pathSegments
      .map(segment => this.parseFilterSegment(segment))
      .filter(Boolean);
  }
  
  static generateCanonicalURL(city: string, filters: AppliedFilter[]): string {
    const filterPath = this.encodeFiltersToURL(filters);
    return `/electricity-plans/${city}/${filterPath}`;
  }
  
  static generateMetaTags(city: string, filters: AppliedFilter[], planCount: number) {
    const filterNames = filters.map(f => f.displayName).join(' + ');
    const title = filters.length > 0 
      ? `${filterNames} Electricity Plans in ${city}, TX | ${planCount} Plans`
      : `Electricity Plans in ${city}, TX | Compare ${planCount} Plans`;
      
    return {
      title,
      description: `Compare ${planCount} ${filterNames} electricity plans in ${city}, Texas. Find the best rates and switch providers.`,
      canonical: this.generateCanonicalURL(city, filters),
      keywords: [city, 'electricity', 'plans', ...filterNames.split(' + ')].join(', ')
    };
  }
}
```

---

## **9. Performance Optimization Strategies**

### **Caching Strategy:**
```typescript
// Multi-layer caching for faceted search
const facetedCacheStrategy = {
  // L1: In-memory facet structure cache (5 minutes)
  facetStructureCache: new Map<string, FacetStructure>(),
  
  // L2: Redis plan results cache (15 minutes)  
  planResultsCache: new RedisCache('faceted-results:', 900),
  
  // L3: Database query cache (1 hour)
  queryCache: new RedisCache('faceted-queries:', 3600),
  
  // Cache key generation
  generateCacheKey: (city: string, filters: AppliedFilter[], query: string) => {
    return `${city}:${filters.map(f => f.urlSegment).sort().join(':')}:${query}`;
  }
};
```

### **Database Query Optimization:**
```sql
-- Optimized faceted search query
WITH filtered_plans AS (
  SELECT * FROM plans 
  WHERE city_slug = $1 
    AND ($2::text IS NULL OR search_vector @@ plainto_tsquery($2))
    AND ($3::jsonb IS NULL OR facets @> $3)
),
facet_counts AS (
  SELECT 
    jsonb_object_agg(
      facet_key, 
      jsonb_build_object('value', facet_value, 'count', cnt)
    ) as facets
  FROM (
    SELECT 
      key as facet_key,
      value as facet_value,
      COUNT(*) as cnt
    FROM filtered_plans,
    jsonb_each_text(facets->'plan_features')
    GROUP BY key, value
    ORDER BY cnt DESC
    LIMIT 10
  ) facet_data
)
SELECT 
  p.*,
  fc.facets
FROM filtered_plans p
CROSS JOIN facet_counts fc
ORDER BY rate_cents ASC
LIMIT $4 OFFSET $5;
```

---

## **10. Implementation Phases**

### **Phase 1: Core Faceted Infrastructure**
1. ✅ Database schema updates with faceted indexes
2. ✅ Basic faceted search API endpoint  
3. ✅ URL routing for faceted navigation
4. ✅ Core React components (sidebar, results grid)

### **Phase 2: Advanced Faceting Features**  
1. 🔄 Hierarchical facets (City → TDSP → Plans)
2. 🔄 Facet filtering and aggregations
3. 🔄 Real-time facet count updates
4. 🔄 Advanced URL state management

### **Phase 3: Performance & Scale Optimization**
1. ⏳ Multi-layer caching implementation
2. ⏳ Database query optimization for 881+ cities
3. ⏳ CDN integration for facet metadata
4. ⏳ Performance monitoring and analytics

### **Phase 4: Enhanced UX Features**
1. ⏳ Facet search and autocomplete
2. ⏳ Saved search preferences
3. ⏳ Facet suggestions based on user behavior
4. ⏳ Mobile-optimized faceted navigation

---

## **11. Success Metrics**

### **Performance Targets:**
- **Faceted search response time**: < 200ms for cached results
- **Initial page load**: < 1.5s for any faceted combination  
- **Database query performance**: < 100ms for complex faceted queries
- **Cache hit rate**: > 85% for popular city/filter combinations

### **User Experience Targets:**
- **Filter application**: Instant visual feedback (< 50ms)
- **Plan count updates**: Real-time facet count updates
- **URL sharing**: All faceted states shareable via URL
- **Mobile experience**: Full faceted navigation on mobile devices

### **SEO Performance:**
- **Indexed faceted pages**: 5,000+ unique URL combinations
- **Search ranking**: Top 3 for "[city] [filter] electricity plans" 
- **Page speed**: Core Web Vitals compliance for all faceted pages
- **Crawl efficiency**: XML sitemaps with faceted URL prioritization

---

## **12. Implementation Agents Required**

### **Immediate Deployment Agents:**
1. **Backend Engineer** - Database schema, API endpoints, caching layer
2. **Frontend UI Developer** - Faceted components, URL state management  
3. **System Architect** - Performance optimization, scaling strategy
4. **QA Test Engineer** - Comprehensive testing across filter combinations

### **Specialized Sub-Agents:**
1. **Database Performance Agent** - Query optimization for faceted search
2. **Caching Strategy Agent** - Multi-layer cache implementation
3. **SEO Optimization Agent** - Faceted URL structure and meta generation
4. **Mobile UX Agent** - Touch-optimized faceted navigation

---

## **Ready to Deploy Comprehensive Faceted Navigation System**

This implementation guide provides the complete roadmap for building world-class faceted navigation that will transform ChooseMyPower into the most sophisticated electricity plan comparison platform in Texas. The system will handle 880+ cities, thousands of plans, and complex multi-dimensional filtering with enterprise-grade performance and user experience.

**Next Step: Deploy specialized agents to execute this comprehensive faceted navigation implementation.**