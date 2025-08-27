module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/texas/dallas/electricity-plans',
        'http://localhost:4173/texas/houston/electricity-plans',
        'http://localhost:4173/texas/fort-worth/electricity-plans',
        'http://localhost:4173/texas/dallas/electricity-plans/12-month',
        'http://localhost:4173/texas/houston/electricity-plans/green-energy',
        'http://localhost:4173/texas/austin/electricity-plans/12-month+fixed-rate'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Network and loading
        'server-response-time': ['warn', { maxNumericValue: 800 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'uses-passive-event-listeners': 'warn',
        'no-document-write': 'error',
        
        // SEO essentials
        'document-title': 'error',
        'meta-description': 'error',
        'link-text': 'error',
        'is-crawlable': 'error',
        'hreflang': 'warn',
        'canonical': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'tabindex': 'warn',
        'heading-order': 'warn',
        
        // Resource optimization
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        
        // Mobile friendliness
        'viewport': 'error',
        'font-size': 'error',
        'tap-targets': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      // Configure if using LHCI server
    }
  }
};