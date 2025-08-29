import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      // Disable the default base styles
      applyBaseStyles: false,
    }),
    // Only use Netlify adapter for production builds
    ...(process.env.NODE_ENV === 'production' ? [netlify()] : [])
  ],
  output: 'server',
  // Only set adapter for production
  ...(process.env.NODE_ENV === 'production' ? { adapter: netlify() } : {}),
  site: 'https://choosemypower.org',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    // Advanced bundle optimization for Core Web Vitals
    rollupOptions: {
      output: {
        // Strategic code splitting for optimal loading performance
        manualChunks: (id) => {
          // Critical vendor chunks (load first)
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
          
          // UI components chunk (preload for interaction)
          if (id.includes('lucide-react') || id.includes('components/ui')) {
            return 'vendor-ui';
          }
          
          // API and data management (lazy load)
          if (id.includes('api/') || id.includes('database/') || id.includes('cache/')) {
            return 'api-system';
          }
          
          // Faceted navigation system (route-based)
          if (id.includes('faceted/') || id.includes('routing/')) {
            return 'faceted-system';
          }
          
          // SEO and optimization (defer)
          if (id.includes('seo/') || id.includes('schema') || id.includes('sitemap')) {
            return 'seo-system';
          }
          
          // Performance monitoring (lazy load)
          if (id.includes('monitoring/') || id.includes('performance/')) {
            return 'performance-system';
          }
          
          // Image optimization (lazy load)
          if (id.includes('images/') || id.includes('optimization/')) {
            return 'image-system';
          }
          
          // Mobile-specific features (conditional load)
          if (id.includes('mobile/') || id.includes('touch')) {
            return 'mobile-system';
          }
          
          // Address and location features (lazy load)
          if (id.includes('address/') || id.includes('location')) {
            return 'address-system';
          }
          
          // Third-party integrations (defer)
          if (id.includes('node_modules/') && !id.includes('react')) {
            return 'vendor-utils';
          }
        },
        
        // Optimized chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          let name = 'chunk';
          
          if (facadeModuleId) {
            // Extract meaningful names from module paths
            const parts = facadeModuleId.split('/');
            name = parts[parts.length - 1]?.replace(/\.(tsx?|jsx?)$/, '') || 'chunk';
          } else if (chunkInfo.name) {
            name = chunkInfo.name;
          }
          
          // Add priority indicator for loading order
          const priorityMap = {
            'vendor-react': '00-',
            'vendor-ui': '01-',
            'faceted-system': '02-',
            'api-system': '03-',
            'seo-system': '04-',
            'performance-system': '05-',
            'mobile-system': '06-',
            'image-system': '07-',
            'address-system': '08-',
            'vendor-utils': '09-'
          };
          
          const priority = priorityMap[name] || '99-';
          return `assets/js/${priority}${name}-[hash].js`;
        },
        
        // Optimized asset naming for performance
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(css)$/.test(assetInfo.name)) {
            // Separate critical and non-critical CSS
            if (assetInfo.name.includes('critical')) {
              return `assets/css/critical-[hash].${ext}`;
            }
            return `assets/css/styles-[hash].${ext}`;
          }
          
          if (/\.(woff2?|ttf|eot|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          
          return `assets/misc/[name]-[hash].${ext}`;
        },
        
        // Note: maxParallelFileOps moved to correct location
      }
    },
    
    // Advanced compression and minification
    minify: 'terser',
    terserOptions: {
      compress: {
        arguments: false,
        arrows: true,
        booleans: true,
        booleans_as_integers: false,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        ecma: 2020,
        evaluate: true,
        expression: false,
        global_defs: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        },
        hoist_funs: false,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_classnames: false,
        keep_fargs: true,
        keep_fnames: false,
        keep_infinity: false,
        loops: true,
        negate_iife: true,
        passes: 2,
        properties: true,
        pure_funcs: [
          'console.log',
          'console.debug',
          'console.info',
          'console.warn',
          'console.error',
          'console.trace',
          'console.assert'
        ],
        pure_getters: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        top_retain: null,
        typeofs: true,
        unsafe: false,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: true,
        module: true
      },
      mangle: {
        safari10: true,
        keep_classnames: false,
        keep_fnames: false,
        toplevel: true,
        eval: false,
        properties: {
          reserved: ['componentDidCatch']
        }
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4KB inline limit
    cssMinify: 'lightningcss',
    
    // Build performance optimization
    target: 'es2020',
    sourcemap: process.env.NODE_ENV !== 'production' ? 'inline' : false
  },
  server: {
    port: 4324
  },
  // Performance optimizations
  vite: {
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 600,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Source map generation for debugging
      sourcemap: process.env.NODE_ENV !== 'production'
    },
    optimizeDeps: {
      // Pre-bundle these dependencies
      include: [
        'react',
        'react-dom',
        'lucide-react'
      ],
      // Exclude server-only dependencies
      exclude: [
        'drizzle-orm',
        'postgres',
        'ioredis'
      ]
    },
    ssr: {
      // Don't externalize these packages in SSR
      noExternal: ['lucide-react']
    }
  },
  // Prefetch optimization
  prefetch: {
    // Prefetch internal links on hover
    prefetchAll: false,
    defaultStrategy: 'hover'
  },
  // Remove experimental features that are causing errors
  // experimental: {
  //   optimizeHoistedScript: true
  // },
  // Compression and optimization
  compressHTML: true,
  scopedStyleStrategy: 'attribute'
});