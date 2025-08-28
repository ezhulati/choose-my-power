module.exports = {
  ci: {
    collect: {
      // Comprehensive URL testing for Core Web Vitals optimization
      url: [
        // Core pages
        'http://localhost:4324/',
        'http://localhost:4324/texas',
        'http://localhost:4324/admin/core-web-vitals-dashboard',
        
        // High-traffic city pages
        'http://localhost:4324/electricity-plans/dallas-tx/',
        'http://localhost:4324/electricity-plans/houston-tx/',
        'http://localhost:4324/electricity-plans/austin-tx/',
        'http://localhost:4324/electricity-plans/fort-worth-tx/',
        'http://localhost:4324/electricity-plans/san-antonio-tx/',
        
        // Faceted navigation pages (Core Web Vitals critical)
        'http://localhost:4324/electricity-plans/dallas-tx/12-month/',
        'http://localhost:4324/electricity-plans/houston-tx/fixed-rate/',
        'http://localhost:4324/electricity-plans/austin-tx/green-energy/',
        'http://localhost:4324/electricity-plans/dallas-tx/12-month/fixed-rate/',
        'http://localhost:4324/electricity-plans/houston-tx/24-month/green-energy/',
        
        // Static pages
        'http://localhost:4324/compare',
        'http://localhost:4324/providers'
      ],
      numberOfRuns: 5, // Increased for better accuracy
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu --headless',
        
        // Test both mobile and desktop
        preset: 'desktop',
        
        // Realistic network conditions for Core Web Vitals
        throttling: {
          rttMs: 40,           // Good 4G latency
          throughputKbps: 10240, // 10 Mbps download
          cpuSlowdownMultiplier: 1, // No CPU throttling for desktop
          requestLatencyMs: 0,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 10240
        },
        
        // Extended timeout for complex pages
        maxWaitForFcp: 60000,
        maxWaitForLoad: 60000,
        
        // Form factor specific settings
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        
        // Additional audits for Core Web Vitals
        onlyAudits: null, // Run all audits
        skipAudits: [
          // Skip audits not relevant to Core Web Vitals
          'is-on-https', // Will fail on localhost
          'uses-https'   // Will fail on localhost
        ]
      }
    },
    
    // Mobile configuration (separate run)
    mobile: {
      collect: {
        url: [
          'http://localhost:4324/',
          'http://localhost:4324/electricity-plans/dallas-tx/',
          'http://localhost:4324/electricity-plans/houston-tx/',
          'http://localhost:4324/electricity-plans/dallas-tx/12-month/'
        ],
        numberOfRuns: 3,
        settings: {
          chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu --headless',
          preset: 'mobile',
          throttling: {
            rttMs: 150,          // Realistic mobile latency
            throughputKbps: 1600, // Slow 3G
            cpuSlowdownMultiplier: 4, // Mobile CPU throttling
            requestLatencyMs: 150,
            downloadThroughputKbps: 1600,
            uploadThroughputKbps: 750
          },
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            disabled: false
          }
        }
      }
    },
    
    assert: {
      assertions: {
        // Enhanced Performance thresholds for "Excellent" Core Web Vitals
        'categories:performance': ['error', { minScore: 0.92 }], // Higher threshold
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.92 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        
        // Core Web Vitals - "Excellent" Google thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 1800 }], // Excellent: <1.8s
        'first-input-delay': ['error', { maxNumericValue: 75 }],           // Excellent: <75ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],  // Excellent: <0.05
        
        // Additional Core Web Vitals metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1200 }],  // Excellent threshold
        'total-blocking-time': ['error', { maxNumericValue: 150 }],      // Excellent: <150ms
        'speed-index': ['warn', { maxNumericValue: 2000 }],              // Fast loading
        'interactive': ['warn', { maxNumericValue: 3000 }],              // Quick interactivity
        
        // Network and loading optimizations
        'server-response-time': ['error', { maxNumericValue: 500 }],     // Fast TTFB
        'first-meaningful-paint': ['warn', { maxNumericValue: 1500 }],   // Quick meaningful content
        'max-potential-fid': ['error', { maxNumericValue: 100 }],        // Potential FID issues
        
        // Resource optimization (critical for Core Web Vitals)
        'unused-css-rules': ['error', { maxNumericValue: 25000 }],       // <25KB unused CSS
        'unused-javascript': ['error', { maxNumericValue: 50000 }],      // <50KB unused JS
        'render-blocking-resources': ['error', { maxNumericValue: 500 }], // Minimal render blocking
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'modern-image-formats': 'error',                                 // WebP/AVIF usage
        'efficient-animated-content': 'error',                          // No inefficient GIFs
        'offscreen-images': 'error',                                     // Lazy loading
        'uses-webp-images': ['warn', { minScore: 0.8 }],               // WebP adoption
        'uses-optimized-images': ['error', { maxNumericValue: 10000 }], // <10KB unoptimized images
        'uses-responsive-images': 'error',                              // Responsive images
        
        // JavaScript and CSS optimizations
        'uses-text-compression': 'error',                               // Gzip/Brotli
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 2000 }], // <2s main thread work
        'bootup-time': ['warn', { maxNumericValue: 1000 }],             // <1s JavaScript boot
        'duplicated-javascript': 'error',                              // No duplicate JS
        'legacy-javascript': 'error',                                  // Modern JS only
        
        // Font and text rendering (CLS prevention)
        'font-display': 'error',                                       // font-display: swap
        'preload-fonts': 'warn',                                       // Critical font preloading
        'font-size': 'error',                                          // Readable font sizes
        
        // Network efficiency
        'uses-http2': 'warn',                                          // HTTP/2 usage
        'uses-rel-preconnect': 'warn',                                 // DNS preconnect
        'uses-rel-preload': 'warn',                                    // Resource preloading
        'critical-request-chains': ['warn', { maxNumericValue: 3 }],   // Shallow critical chains
        
        // SEO essentials (affect Core Web Vitals ranking)
        'document-title': 'error',
        'meta-description': 'error',
        'link-text': 'error',
        'is-crawlable': 'error',
        'canonical': 'error',
        'meta-viewport': 'error',
        
        // Accessibility (user experience factor)
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'tabindex': 'error',
        'heading-order': 'warn',
        'landmark-one-main': 'warn',
        
        // Mobile optimization (Core Web Vitals critical)
        'viewport': 'error',
        'tap-targets': 'error',                                        // Touch target size
        'content-width': 'error',                                      // Content fits viewport
        
        // Security (best practices)
        'no-document-write': 'error',
        'external-anchors-use-rel-noopener': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        
        // Progressive Web App features
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'maskable-icon': 'warn',
        
        // Performance budgets
        'performance-budget': 'warn',
        'timing-budget': 'warn'
      }
    },
    
    // Upload results for tracking
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: 'core-web-vitals-%%PATHNAME%%-%%DATETIME%%.html'
    },
    
    // Server configuration for CI/CD
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  },
  
  // Additional configuration for different environments
  profiles: {
    // Production-like testing
    production: {
      collect: {
        settings: {
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1
          }
        }
      },
      assert: {
        assertions: {
          'largest-contentful-paint': ['error', { maxNumericValue: 1800 }],
          'first-input-delay': ['error', { maxNumericValue: 75 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }]
        }
      }
    },
    
    // Slow network testing (3G)
    slow3g: {
      collect: {
        settings: {
          throttling: {
            rttMs: 300,
            throughputKbps: 700,
            cpuSlowdownMultiplier: 4
          }
        }
      },
      assert: {
        assertions: {
          'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
          'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
          'speed-index': ['error', { maxNumericValue: 5000 }]
        }
      }
    }
  }
};