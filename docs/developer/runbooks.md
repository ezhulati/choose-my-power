# Incident Runbooks (Quick Fix Guides)

These short, practical checklists help you resolve our most common production issues fast.

## 1) Routing/404/Trailing Slash
- Symptom: 404 or “Do you want to go to … instead?” after clicking a link.
- Quick checks:
  - Confirm path has no trailing slash (app uses trailingSlash: `never`).
  - Netlify redirect rules present for `/electricity-plans/*/`, `/texas/*/`, `/admin/*/`.
  - Canonical and breadcrumb URLs in pages don’t include trailing slashes.
- Files to inspect:
  - `astro.config.mjs` (trailingSlash)
  - `netlify.toml` (redirects)
  - `src/pages/electricity-plans/[...path].astro` (canonical/currentUrl)
  - `src/pages/texas/[city].astro` (canonical/currentUrl, breadcrumbs)
  - `src/pages/sitemap-faceted*.ts` (ensure `<loc>` is slashless)
- Fix steps:
  1. Normalize any slashed links in the rendering code (build URLs without trailing `/`).
  2. Add/verify Netlify redirects for slash-terminated paths.
  3. Re-run in dev; verify direct navigation and internal links.

## 2) ZIP Resolution (Form → City)
- Symptom: Submitting ZIP flashes a 404 or doesn’t navigate correctly.
- Quick checks:
  - Browser console shows “ZIP lookup script loaded”.
  - Script isn’t double-initialized (global guard present).
  - `/api/zip-lookup` returns JSON for AJAX (status 200) and 302 for Accept: text/html.
- Files to inspect:
  - `public/js/zip-lookup.js`
  - `src/components/StandardZipInput.astro` (script include exists)
  - `src/pages/api/zip-lookup.ts`
- Fix steps:
  1. Ensure script loads on every page with the ZIP form.
  2. Keep the 100ms delayed navigation to avoid dynamic-route 404 flash.
  3. For split ZIP/municipal cases, verify redirectUrl logic.

## 3) Plan Fetching/Caching/Latency
- Symptom: Slow plan results, inconsistent data, or excessive API calls.
- Quick checks:
  - Logs show DB cache hits (`getPlansFromCache`) and Redis hits.
  - Circuit breaker not tripping repeatedly.
  - API retries not saturating (exponential backoff in effect).
- Files to inspect:
  - `src/lib/api/comparepower-client.ts` (fetchPlans, getPlansWithCache, makeRequestWithRetry)
  - `src/lib/database/plan-repository.ts` (cache reads/writes, active plans fallback)
- Fix steps:
  1. Prefer `getPlansWithCache` usage (DB-first) where possible.
  2. Verify TTLs and cache warming in prod; increase TTL slightly if churn is high.
  3. Inspect slow-request logs (>5s); consider raising backoff for rate limits.

## 4) Faceted URL Validation
- Symptom: Valid filters redirect or show canonicalization warnings.
- Quick checks:
  - `filterMapper.mapFiltersToApiParams` maps URL segments → apiParams.
  - `generateCanonicalUrl` uses canonical filter ordering.
- Files to inspect:
  - `src/lib/faceted/faceted-router.ts`
- Fix steps:
  1. Check `typeOrder` in `generateCanonicalFilterOrder` for the filter you added.
  2. Ensure the filter has URL patterns in filterMapper.

---

Keep these current by updating file references when changing core code.
