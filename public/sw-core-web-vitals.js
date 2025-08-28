/**
 * Core Web Vitals Service Worker
 * Advanced caching strategies for optimal performance
 * 
 * Features:
 * - Stale-while-revalidate for API responses
 * - Cache-first for static assets
 * - Network-first for HTML pages
 * - Background sync for offline functionality
 * - Performance monitoring and optimization
 */

const CACHE_VERSION = 'v2.1.0';
const CACHE_NAMES = {
  static: `static-assets-${CACHE_VERSION}`,
  dynamic: `dynamic-content-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-responses-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`,
  critical: `critical-resources-${CACHE_VERSION}`
};

// Cache expiration times (in seconds)
const CACHE_EXPIRATION = {
  static: 30 * 24 * 60 * 60,    // 30 days
  dynamic: 24 * 60 * 60,        // 1 day
  images: 7 * 24 * 60 * 60,     // 7 days
  api: 15 * 60,                 // 15 minutes
  fonts: 365 * 24 * 60 * 60,    // 1 year
  critical: 7 * 24 * 60 * 60    // 7 days
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/assets/css/critical-*.css',
  '/assets/js/00-vendor-react-*.js',
  '/assets/js/01-vendor-ui-*.js',
  '/assets/fonts/inter-*.woff2'
];

// Static assets patterns
const STATIC_ASSETS = [
  /\.(?:css|js|woff2?|ttf|eot|otf)$/,
  /\/assets\//,
  /\/images\/.*\.(png|jpg|jpeg|gif|svg|webp|avif)$/
];

// API patterns
const API_PATTERNS = [
  /\/api\//,
  /api\.comparepower\.com/,
  /pricing\.api\.comparepower\.com/
];

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  averageResponseTime: 0
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing Core Web Vitals Service Worker', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Cache critical resources immediately
        const criticalCache = await caches.open(CACHE_NAMES.critical);
        await criticalCache.addAll(CRITICAL_RESOURCES);
        
        // Prefetch important pages
        const dynamicCache = await caches.open(CACHE_NAMES.dynamic);
        const importantPages = [
          '/texas',
          '/electricity-plans/dallas-tx/',
          '/electricity-plans/houston-tx/',
          '/compare'
        ];
        
        for (const page of importantPages) {
          try {
            const response = await fetch(page);
            if (response.ok) {
              await dynamicCache.put(page, response);
            }
          } catch (error) {
            console.warn('Failed to prefetch:', page, error);
          }
        }
        
        console.log('✅ SW: Critical resources cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('❌ SW: Installation failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating Core Web Vitals Service Worker');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          !Object.values(CACHE_NAMES).includes(name)
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Claim all clients
        await self.clients.claim();
        
        console.log('✅ SW: Activation complete');
      } catch (error) {
        console.error('❌ SW: Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event Handler with Advanced Caching Strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip POST requests and other methods
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Main request handler with performance optimization
 */
async function handleRequest(request) {
  const startTime = performance.now();
  const url = new URL(request.url);
  
  try {
    let response;
    
    // Critical resources - Cache First with Network Fallback
    if (isCriticalResource(request)) {
      response = await cacheFirstStrategy(request, CACHE_NAMES.critical);
    }
    // Static assets - Cache First with Network Fallback
    else if (isStaticAsset(request)) {
      response = await cacheFirstStrategy(request, getCacheNameForAsset(request));
    }
    // API responses - Stale While Revalidate
    else if (isAPIRequest(request)) {
      response = await staleWhileRevalidateStrategy(request, CACHE_NAMES.api);
    }
    // HTML pages - Network First with Cache Fallback
    else if (isHTMLRequest(request)) {
      response = await networkFirstStrategy(request, CACHE_NAMES.dynamic);
    }
    // Images - Cache First with Network Fallback
    else if (isImageRequest(request)) {
      response = await cacheFirstStrategy(request, CACHE_NAMES.images);
    }
    // Default - Network First
    else {
      response = await networkFirstStrategy(request, CACHE_NAMES.dynamic);
    }
    
    // Track performance metrics
    const responseTime = performance.now() - startTime;
    updatePerformanceMetrics(responseTime, response.type === 'cached');
    
    // Add performance headers
    if (response) {
      response.headers.set('SW-Cache-Status', response.type === 'cached' ? 'hit' : 'miss');
      response.headers.set('SW-Response-Time', `${Math.round(responseTime)}ms`);
    }
    
    return response;
    
  } catch (error) {
    console.error('SW: Request failed:', error);
    
    // Only return offline fallback for genuine network failures (not HTTP errors like 404)
    // Check if it's a network error vs HTTP error
    if (isHTMLRequest(request) && isNetworkError(error)) {
      console.warn('SW: Network unavailable, showing offline fallback');
      return getOfflineFallback();
    }
    
    // For HTTP errors or other requests, let the browser handle it naturally
    throw error;
  }
}

/**
 * Cache First Strategy - Best for static assets
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, addTimestamp(responseToCache));
    }
    
    performanceMetrics.cacheMisses++;
    return networkResponse;
    
  } catch (error) {
    // Return stale cache if available
    if (cachedResponse) {
      console.warn('SW: Serving stale content due to network error');
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network First Strategy - Best for HTML pages
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request, {
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseToCache = networkResponse.clone();
      await cache.put(request, addTimestamp(responseToCache));
      return networkResponse;
    }
    
    // If response is not ok but we got a response, return it anyway
    // Don't cache non-ok responses
    return networkResponse;
    
  } catch (error) {
    // Only show offline fallback for actual network failures, not 404s or other HTTP errors
    console.warn('SW: Network request failed, trying cache:', error.message);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.warn('SW: Serving cached content due to network error');
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    
    // If we have no cache and it's a genuine network error, re-throw
    // This will let the browser handle it naturally instead of showing offline page
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy - Best for API responses
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh data in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, addTimestamp(networkResponse.clone()));
    }
    return networkResponse;
  }).catch(error => {
    console.warn('SW: Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cachedResponse && !isExpired(cachedResponse)) {
    performanceMetrics.cacheHits++;
    // Don't await the fetch promise - let it run in background
    fetchPromise;
    return cachedResponse;
  }
  
  // No cache available, wait for network
  performanceMetrics.networkRequests++;
  performanceMetrics.cacheMisses++;
  return await fetchPromise;
}

/**
 * Request classification functions
 */
function isCriticalResource(request) {
  return CRITICAL_RESOURCES.some(pattern => 
    request.url.includes(pattern.replace('*', ''))
  );
}

function isStaticAsset(request) {
  return STATIC_ASSETS.some(pattern => pattern.test(request.url));
}

function isAPIRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

function isHTMLRequest(request) {
  return request.headers.get('Accept')?.includes('text/html') ||
         request.url.endsWith('/') ||
         (!request.url.includes('.') && !request.url.includes('api'));
}

function isImageRequest(request) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(request.url);
}

/**
 * Check if error is a network error (vs HTTP error)
 */
function isNetworkError(error) {
  // Network errors typically have these characteristics
  return error.name === 'TypeError' ||
         error.message.includes('NetworkError') ||
         error.message.includes('Failed to fetch') ||
         error.message.includes('ERR_NETWORK') ||
         error.message.includes('ERR_INTERNET_DISCONNECTED') ||
         error.code === 'NETWORK_ERROR';
}

/**
 * Get appropriate cache name for asset
 */
function getCacheNameForAsset(request) {
  if (request.url.includes('/fonts/')) {
    return CACHE_NAMES.fonts;
  }
  if (isImageRequest(request)) {
    return CACHE_NAMES.images;
  }
  return CACHE_NAMES.static;
}

/**
 * Cache expiration utilities
 */
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('SW-Cached-At', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function isExpired(response) {
  const cachedAt = response.headers.get('SW-Cached-At');
  if (!cachedAt) return false;
  
  const cacheAge = (Date.now() - parseInt(cachedAt)) / 1000;
  const maxAge = getMaxAgeForResponse(response);
  
  return cacheAge > maxAge;
}

function getMaxAgeForResponse(response) {
  const url = response.url;
  
  if (url.includes('/api/')) return CACHE_EXPIRATION.api;
  if (url.includes('/fonts/')) return CACHE_EXPIRATION.fonts;
  if (isImageRequest({ url })) return CACHE_EXPIRATION.images;
  if (isStaticAsset({ url })) return CACHE_EXPIRATION.static;
  
  return CACHE_EXPIRATION.dynamic;
}

/**
 * Offline fallback page
 */
async function getOfflineFallback() {
  const fallbackHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - ChooseMyPower.org</title>
      <style>
        body {
          font-family: Inter, system-ui, sans-serif;
          margin: 0;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, #002868 0%, #1e40af 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        .offline-container {
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.125rem; margin-bottom: 2rem; line-height: 1.6; }
        .retry-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .retry-btn:hover { background: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <h1>⚡ You're Offline</h1>
        <p>Don't worry! We've cached your Texas electricity plans for offline viewing. Check your connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
        <p style="margin-top: 2rem; font-size: 0.875rem; opacity: 0.8;">
          Cached by ChooseMyPower.org Service Worker
        </p>
      </div>
    </body>
    </html>
  `;
  
  return new Response(fallbackHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    performanceMetrics.backgroundSyncs++;
    
    // Sync any pending analytics events
    await syncAnalyticsEvents();
    
    // Prefetch popular pages
    await prefetchPopularPages();
    
    console.log('✅ SW: Background sync completed');
  } catch (error) {
    console.error('❌ SW: Background sync failed:', error);
  }
}

/**
 * Analytics event synchronization
 */
async function syncAnalyticsEvents() {
  // Implementation would sync offline analytics events
  console.log('📊 SW: Syncing analytics events');
}

/**
 * Prefetch popular pages during idle time
 */
async function prefetchPopularPages() {
  const popularPages = [
    '/texas/austin/electricity-plans',
    '/texas/san-antonio/electricity-plans',
    '/electricity-plans/dallas-tx/12-month',
    '/electricity-plans/houston-tx/fixed-rate'
  ];
  
  const cache = await caches.open(CACHE_NAMES.dynamic);
  
  for (const page of popularPages) {
    try {
      const existing = await cache.match(page);
      if (!existing || isExpired(existing)) {
        const response = await fetch(page);
        if (response.ok) {
          await cache.put(page, addTimestamp(response));
        }
      }
    } catch (error) {
      console.warn('SW: Failed to prefetch:', page);
    }
  }
}

/**
 * Performance metrics tracking
 */
function updatePerformanceMetrics(responseTime, wasFromCache) {
  if (wasFromCache) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
  }
  
  // Update running average
  const totalResponses = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
  performanceMetrics.averageResponseTime = 
    (performanceMetrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
}

/**
 * Message handling from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_METRICS') {
    event.ports[0].postMessage({
      type: 'METRICS_RESPONSE',
      data: performanceMetrics
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({
        type: 'CACHE_CLEARED',
        success: true
      });
    });
  }
  
  if (event.data && event.data.type === 'PREFETCH_PAGES') {
    const pages = event.data.pages || [];
    prefetchPages(pages).then(() => {
      event.ports[0].postMessage({
        type: 'PREFETCH_COMPLETE',
        success: true
      });
    });
  }
});

/**
 * Clear all caches utility
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('🗑️ SW: All caches cleared');
}

/**
 * Prefetch specific pages
 */
async function prefetchPages(pages) {
  const cache = await caches.open(CACHE_NAMES.dynamic);
  
  for (const page of pages) {
    try {
      const response = await fetch(page);
      if (response.ok) {
        await cache.put(page, addTimestamp(response));
      }
    } catch (error) {
      console.warn('SW: Failed to prefetch:', page, error);
    }
  }
}

/**
 * Periodic cache cleanup
 */
setInterval(async () => {
  try {
    await cleanupExpiredCache();
  } catch (error) {
    console.error('SW: Cache cleanup failed:', error);
  }
}, 30 * 60 * 1000); // Every 30 minutes

/**
 * Clean up expired cache entries
 */
async function cleanupExpiredCache() {
  for (const cacheName of Object.values(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && isExpired(response)) {
        await cache.delete(request);
      }
    }
  }
}

console.log('🚀 Core Web Vitals Service Worker loaded successfully');
console.log('📊 Performance optimizations active:');
console.log('   ✓ Advanced caching strategies');
console.log('   ✓ Background sync');
console.log('   ✓ Offline fallbacks');
console.log('   ✓ Performance monitoring');
console.log('   ✓ Cache expiration management');