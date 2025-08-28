/**
 * Cloudflare Workers Edge Caching Layer
 * Provides ultra-fast response times by caching at edge locations
 * Handles intelligent cache invalidation and warming
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheKey = this.generateCacheKey(url);
    const cache = caches.default;

    // Check if this is an API request that should be cached
    if (this.shouldCache(url)) {
      // Try to get from edge cache first
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log(`Cache HIT: ${url.pathname}`);
        return this.addCacheHeaders(cachedResponse, 'HIT');
      }

      console.log(`Cache MISS: ${url.pathname}`);
      
      // If not in cache, fetch from origin
      const response = await this.fetchFromOrigin(request, env);
      
      if (response && response.ok) {
        // Clone response for caching (response can only be read once)
        const responseClone = response.clone();
        const ttl = this.getTTL(url);
        
        // Cache the response with appropriate headers
        const cacheableResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers: {
            ...responseClone.headers,
            'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
            'Edge-Cache-Tag': this.getCacheTags(url),
            'X-Edge-Cache': 'MISS',
            'X-Edge-Cache-TTL': ttl.toString()
          }
        });

        // Store in edge cache
        ctx.waitUntil(cache.put(request, cacheableResponse.clone()));
        
        return this.addCacheHeaders(cacheableResponse, 'MISS');
      }
    }

    // For non-cacheable requests, pass through to origin
    return this.fetchFromOrigin(request, env);
  },

  /**
   * Determine if a URL should be cached at the edge
   */
  shouldCache(url) {
    const pathname = url.pathname;
    
    // Cache electricity plan pages
    if (pathname.startsWith('/electricity-plans/')) return true;
    if (pathname.startsWith('/texas/') && pathname.includes('electricity')) return true;
    
    // Cache static assets
    if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2|woff)$/)) return true;
    
    // Cache API responses
    if (pathname.startsWith('/api/plans') || pathname.startsWith('/api/providers')) return true;
    
    // Don't cache admin, dynamic forms, or user-specific content
    if (pathname.startsWith('/admin')) return false;
    if (pathname.includes('?user=') || pathname.includes('?session=')) return false;
    if (url.searchParams.has('nocache')) return false;
    
    // Cache most other pages
    return true;
  },

  /**
   * Get cache TTL based on content type and URL
   */
  getTTL(url) {
    const pathname = url.pathname;
    
    // Static assets - cache for 1 month
    if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2|woff)$/)) {
      return 2592000; // 30 days
    }
    
    // API responses - cache for 1 hour
    if (pathname.startsWith('/api/')) {
      return 3600; // 1 hour
    }
    
    // Electricity plan pages - cache for 30 minutes
    if (pathname.startsWith('/electricity-plans/') || pathname.includes('electricity')) {
      return 1800; // 30 minutes
    }
    
    // Other pages - cache for 10 minutes
    return 600; // 10 minutes
  },

  /**
   * Generate cache key for consistent caching
   */
  generateCacheKey(url) {
    // Normalize URL for consistent caching
    const normalizedUrl = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    trackingParams.forEach(param => normalizedUrl.searchParams.delete(param));
    
    // Sort search parameters for consistent keys
    const sortedParams = new URLSearchParams();
    Array.from(normalizedUrl.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => sortedParams.append(key, value));
    
    normalizedUrl.search = sortedParams.toString();
    
    return normalizedUrl.toString();
  },

  /**
   * Get cache tags for targeted invalidation
   */
  getCacheTags(url) {
    const tags = ['all'];
    const pathname = url.pathname;
    
    // Add content-specific tags
    if (pathname.startsWith('/electricity-plans/')) {
      tags.push('plans');
      
      // Extract city from URL
      const cityMatch = pathname.match(/\/electricity-plans\/([^\/]+)/);
      if (cityMatch) {
        tags.push(`city:${cityMatch[1]}`);
      }
    }
    
    if (pathname.startsWith('/texas/')) {
      tags.push('texas');
    }
    
    if (pathname.startsWith('/api/')) {
      tags.push('api');
    }
    
    return tags.join(',');
  },

  /**
   * Fetch from origin server with error handling
   */
  async fetchFromOrigin(request, env) {
    try {
      const originUrl = new URL(request.url);
      
      // Use environment-specific origin
      const origin = env.ORIGIN_URL || 'https://choosemypower.org';
      originUrl.hostname = new URL(origin).hostname;
      
      const originRequest = new Request(originUrl, {
        method: request.method,
        headers: {
          ...request.headers,
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
          'X-Edge-Worker': 'true'
        },
        body: request.body
      });

      const response = await fetch(originRequest);
      
      // Return error page for 5xx errors
      if (response.status >= 500) {
        return this.errorResponse(response.status, 'Server Error');
      }
      
      return response;
      
    } catch (error) {
      console.error('Origin fetch error:', error);
      return this.errorResponse(502, 'Bad Gateway');
    }
  },

  /**
   * Create error response
   */
  errorResponse(status, message) {
    return new Response(`
      <html>
        <head><title>Error ${status}</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
          <h1>Error ${status}</h1>
          <p>${message}</p>
          <p>Please try again in a few moments.</p>
        </body>
      </html>
    `, {
      status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  },

  /**
   * Add cache debugging headers
   */
  addCacheHeaders(response, cacheStatus) {
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'X-Edge-Cache': cacheStatus,
        'X-Edge-Cache-Date': new Date().toISOString()
      }
    });
    
    return newResponse;
  }
};