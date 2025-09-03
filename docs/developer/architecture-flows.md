# Architecture Flow Diagrams (Developer Guide)

This page summarizes the three critical runtime flows with compact sequence diagrams and direct code references you can jump to while debugging.

## Plan Fetching & Caching

```mermaid
sequenceDiagram
    participant Page/Route
    participant ComparePowerClient
    participant RedisCache
    participant PlanRepository (DB)
    participant ComparePower API

    Note over Page/Route: Prefer DB-first path
    Page/Route->>ComparePowerClient: getPlansWithCache(params)
    ComparePowerClient->>PlanRepository (DB): getPlansFromCache(params)
    alt Fresh DB cache exists
      PlanRepository (DB)-->>ComparePowerClient: plans
      ComparePowerClient-->>Page/Route: plans
    else No DB cache
      ComparePowerClient->>PlanRepository (DB): getActivePlans(tdsp, filters?)
      alt Active plans exist
        PlanRepository (DB)-->>ComparePowerClient: active plans
        ComparePowerClient->>PlanRepository (DB): setPlansCache(ttl=30m)
        ComparePowerClient-->>Page/Route: plans
      else No active plans
        Note over ComparePowerClient: Fallback to fetchPlans()
        ComparePowerClient->>RedisCache: get(params)
        alt Redis hit
          RedisCache-->>ComparePowerClient: plans
          ComparePowerClient-->>Page/Route: plans
        else Miss
          ComparePowerClient->>PlanRepository (DB): getPlansFromCache(params)
          alt DB cache hit
            PlanRepository (DB)-->>ComparePowerClient: plans
            ComparePowerClient-->>Page/Route: plans
          else Miss
            ComparePowerClient->>ComparePower API: GET /api/plans/current?... (retry/backoff)
            ComparePower API-->>ComparePowerClient: raw plans[]
            ComparePowerClient->>ComparePowerClient: clean + validate + transform
            ComparePowerClient->>RedisCache: set(params, plans)
            ComparePowerClient->>PlanRepository (DB): setPlansCache(ttl=1h)
            ComparePowerClient->>PlanRepository (DB): storePlans(raw)
            ComparePowerClient-->>Page/Route: plans
          end
        end
      end
    end
```

Code references:
- `src/lib/api/comparepower-client.ts:196` fetchPlans entry (rate-limit, cache chain)
- `src/lib/api/comparepower-client.ts:260` DB‑first path (getPlansWithCache)
- `src/lib/api/comparepower-client.ts:557` makeRequestWithRetry (backoff, errors)
- `src/lib/api/comparepower-client.ts:377` cleanPlanData (auto-fixes)
- `src/lib/database/plan-repository.ts:93` DB cache read/write
- `src/lib/database/plan-repository.ts:266` getActivePlans fallback

## Faceted URL → API Mapping

```mermaid
sequenceDiagram
    participant User
    participant FacetedRouter
    participant FilterMapper
    participant ComparePowerClient
    participant Astro Page

    User->>Astro Page: GET /electricity-plans/:city/[:filters]
    Astro Page->>FacetedRouter: validateRoute(path, {requirePlans?})
    FacetedRouter->>FacetedRouter: parse city + filters
    FacetedRouter->>FacetedRouter: validate city → TDSP DUNS
    FacetedRouter->>FilterMapper: mapFiltersToApiParams(city, filters, duns)
    FilterMapper-->>FacetedRouter: {isValid, apiParams, appliedFilters}
    FacetedRouter->>FacetedRouter: generate canonical URL (+shouldIndex)
    alt requirePlans && isValid
      FacetedRouter->>ComparePowerClient: fetchPlans(apiParams)
      ComparePowerClient-->>FacetedRouter: plans
    end
    alt invalid
      FacetedRouter-->>Astro Page: {redirectUrl or 404}
      Astro Page-->>User: Redirect or 404
    else valid
      FacetedRouter-->>Astro Page: routeResult (canonical, shouldIndex, plans?)
      Astro Page-->>User: Render page
    end
```

Code references:
- `src/lib/faceted/faceted-router.ts:56` validateRoute
- `src/lib/faceted/faceted-router.ts:203` canonical URL generation
- `src/lib/faceted/faceted-router.ts:233` shouldIndex logic
- `src/pages/electricity-plans/[...path].astro:38` SSR route handling + redirects

## ZIP Resolution (Form → City Page)

```mermaid
sequenceDiagram
    participant User
    participant Browser JS
    participant Astro ZIP API
    participant City Page

    User->>Browser JS: Submit ZIP form
    Browser JS->>Astro ZIP API: GET /api/zip-lookup?zip=75201 (AJAX)
    alt Municipal ZIP
      Astro ZIP API-->>Browser JS: {success:false, redirectUrl:/texas/:city/municipal-utility}
      Browser JS->>User: Navigate to municipal page
    else Deregulated ZIP
      Astro ZIP API-->>Browser JS: {success:true, redirectUrl:/texas/:city}
      Browser JS->>User: Navigate to /texas/:city
      User->>City Page: GET /texas/:city
      City Page->>ComparePowerClient: fetchPlans(tdsp_duns, usage=1000)
      ComparePowerClient-->>City Page: plans
      City Page-->>User: Render city overview
    end
```

Code references:
- `public/js/zip-lookup.js:169` AJAX call + navigation strategy
- `src/components/StandardZipInput.astro:150` script include for all forms
- `src/pages/api/zip-lookup.ts:35` ZIP handler (HTML redirect vs JSON)
- `src/pages/texas/[city].astro:21` City route (validates city, fetches plans)

---

Rendering the diagrams locally (optional):
- VS Code Markdown Preview often renders Mermaid directly.
- Or use Mermaid CLI: `npx @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg` (requires Node tooling).

