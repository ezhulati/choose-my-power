/**
 * Astro Middleware - Security Headers and Request Processing
 * Implements comprehensive security measures including CSP, HSTS, and input validation
 */

import type { APIContext, MiddlewareNext } from 'astro';

// Generate a cryptographically secure nonce for CSP
function generateNonce(): string {
  // Use Web Crypto API which is available in both Node.js and Edge runtime
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

// Content Security Policy configuration
const buildCSPDirectives = (nonce: string) => ({
  'default-src': "'self'",
  'script-src': [
    "'self'",
    `'nonce-${nonce}'`, // Use nonce instead of unsafe-inline
    "'strict-dynamic'", // Allow scripts loaded by nonce to load other scripts
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://vercel.live',
  ].join(' '),
  'style-src': [
    "'self'",
    `'nonce-${nonce}'`, // Use nonce for inline styles
    'https://fonts.googleapis.com',
    "'unsafe-inline'", // Fallback for older browsers that don't support nonces
  ].join(' '),
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:', // For generated images
  ].join(' '),
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ].join(' '),
  'connect-src': [
    "'self'",
    'https://pricing.api.comparepower.com',
    'https://ercot.api.comparepower.com',
    'https://api.ideogram.ai',
    'https://fal.run',
    'https://vercel.live',
    'wss://vercel.live',
  ].join(' '),
  'frame-ancestors': "'none'",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
});

const buildCSPHeader = (nonce: string) => {
  const directives = buildCSPDirectives(nonce);
  return Object.entries(directives)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim(); // Remove leading/trailing whitespace
};

// Security headers configuration
const buildSecurityHeaders = (nonce: string) => ({
  // CSP handled by netlify.toml to avoid conflicts and support script hashes
  // ...(import.meta.env.PROD ? { 'Content-Security-Policy': buildCSPHeader(nonce) } : {}),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=(),',
    'microphone=(),',
    'geolocation=(self),',
    'payment=()',
  ].join(' '),
});

// Rate limiting configuration (simple in-memory store for development)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 1000; // requests per window

function getRateLimitKey(request: Request): string {
  // In production, consider using X-Forwarded-For or CF-Connecting-IP
  const clientIP = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
  return `rate_limit:${clientIP}`;
}

function checkRateLimit(request: Request): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const limitData = rateLimitMap.get(key);

  if (!limitData || now > limitData.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (limitData.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  limitData.count++;
  return true;
}

// Input validation utilities
function validateZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode.trim());
}

function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 5 && trimmed.length <= 200;
}

function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .slice(0, 500); // Limit length
}

export async function onRequest(context: APIContext, next: MiddlewareNext) {
  const { request, url } = context;
  
  // Handle trailing slash removal for faceted navigation routes
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    // Only redirect faceted navigation routes to maintain consistency with trailingSlash: 'never'
    if (url.pathname.startsWith('/electricity-plans')) {
      const newUrl = new URL(url);
      newUrl.pathname = url.pathname.slice(0, -1); // Remove trailing slash
      
      return new Response(null, {
        status: 301,
        headers: {
          'Location': newUrl.toString()
        }
      });
    }
  }
  
  const response = await next();

  // Skip security headers for static assets in development
  if (import.meta.env.DEV && (
    url.pathname.startsWith('/_astro') ||
    url.pathname.startsWith('/images') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  )) {
    return response;
  }

  // Apply rate limiting (skip in development)
  if (import.meta.env.PROD && !checkRateLimit(request)) {
    console.warn(`Rate limit exceeded for ${getRateLimitKey(request)}`);
    return new Response('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        'Content-Type': 'text/plain'
      }
    });
  }

  // Input validation for API endpoints
  if (url.pathname.startsWith('/api')) {
    try {
      const method = request.method;
      
      // Validate ZIP code parameters
      if (url.searchParams.has('zip') || url.searchParams.has('zipCode')) {
        const zipCode = url.searchParams.get('zip') || url.searchParams.get('zipCode');
        if (zipCode && !validateZipCode(zipCode)) {
          console.warn(`Invalid ZIP code format: ${zipCode}`);
          return new Response(
            JSON.stringify({ error: 'Invalid ZIP code format. Must be 5 digits.' }), 
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      // Validate address parameters
      if (url.searchParams.has('address')) {
        const address = url.searchParams.get('address');
        if (address && !validateAddress(address)) {
          console.warn(`Invalid address format: ${address}`);
          return new Response(
            JSON.stringify({ error: 'Invalid address format. Must be 5-200 characters.' }), 
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      // Validate request body size for POST requests
      if (method === 'POST' || method === 'PUT') {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 100000) { // 100KB limit
          console.warn(`Request body too large: ${contentLength} bytes`);
          return new Response(
            JSON.stringify({ error: 'Request body too large. Maximum 100KB allowed.' }), 
            { 
              status: 413, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      }

    } catch (error) {
      console.error('Error in API validation middleware:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Apply security headers to HTML responses
  if (response.headers.get('content-type')?.includes('text/html') || 
      !response.headers.get('content-type')) {
    
    // Generate a fresh nonce for each request
    const nonce = generateNonce();
    
    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Add security headers with nonce
    const securityHeaders = buildSecurityHeaders(nonce);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // Make nonce available to the response for use in templates
    newResponse.headers.set('X-CSP-Nonce', nonce);

    // Add cache control for static pages
    if (url.pathname.match(/^\/electricity-plans\//)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    }

    return newResponse;
  }

  return response;
}

// Export utilities for use in API endpoints
export { validateZipCode, validateAddress, sanitizeString };