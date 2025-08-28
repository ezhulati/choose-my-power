import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React for production
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [
          // Remove React DevTools in production
          process.env.NODE_ENV === 'production' && [
            'babel-plugin-react-remove-properties',
            { properties: ['data-testid'] }
          ]
        ].filter(Boolean)
      }
    })
  ],
  
  // Dependency optimization for better performance
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server startup
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ],
    // Exclude server-only dependencies
    exclude: [
      'lucide-react',
      'drizzle-orm',
      'postgres',
      'ioredis'
    ],
    // Force optimization of these packages
    force: process.env.NODE_ENV === 'production'
  },
  
  // Build optimizations
  build: {
    // Modern browser target for better optimization
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    // CSS code splitting for better caching
    cssCodeSplit: true,
    
    // Enable CSS minification
    cssMinify: 'lightningcss',
    
    // Bundle size optimizations
    chunkSizeWarningLimit: 1000, // 1MB warning
    assetsInlineLimit: 4096, // 4KB inline threshold
    
    // Rollup optimization
    rollupOptions: {
      // External dependencies (don't bundle these)
      external: (id) => {
        // Externalize node modules in SSR build
        return id.startsWith('node:') || 
               (id.includes('node_modules') && 
                ['drizzle-orm', 'postgres', 'ioredis'].some(pkg => id.includes(pkg)));
      },
      
      output: {
        // Optimize chunk size
        maxParallelFileOps: 4,
        
        // Better tree shaking
        treeshake: {
          annotations: true,
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      }
    },
    
    // Source maps for debugging (development only)
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    
    // Minification settings
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    terserOptions: process.env.NODE_ENV === 'production' ? {
      compress: {
        arguments: false,
        arrows: true,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        ecma: 2020,
        evaluate: true,
        hoist_props: true,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_fnames: false,
        loops: true,
        negate_iife: true,
        passes: 2,
        properties: true,
        pure_funcs: [
          'console.log',
          'console.debug', 
          'console.info',
          'console.warn',
          'console.error'
        ],
        pure_getters: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        typeofs: true,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe: false,
        unused: true
      },
      mangle: {
        safari10: true,
        toplevel: true
      },
      format: {
        comments: false,
        ecma: 2020
      }
    } : undefined
  },
  
  // Development server optimization
  server: {
    // Enable HTTP/2
    https: false,
    
    // Host configuration
    host: '0.0.0.0',
    port: 4324,
    
    // CORS for API integration
    cors: true,
    
    // Development optimizations
    hmr: {
      overlay: true
    },
    
    // Faster dependency discovery
    warmup: {
      clientFiles: [
        './src/components/**/*.tsx',
        './src/layouts/**/*.astro',
        './src/pages/**/*.astro'
      ]
    }
  },
  
  // Asset processing
  assetsInclude: [
    '**/*.svg',
    '**/*.png', 
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.webp',
    '**/*.avif'
  ],
  
  // Environment variables
  define: {
    // Global constants for better tree shaking
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __TEST__: process.env.NODE_ENV === 'test'
  },
  
  // CSS processing
  css: {
    // PostCSS configuration
    postcss: {
      plugins: [
        // Autoprefixer for browser compatibility
        require('autoprefixer')({
          overrideBrowserslist: [
            '> 0.5%',
            'last 2 versions',
            'Firefox ESR',
            'not dead',
            'not IE 11'
          ]
        }),
        
        // CSS optimization in production
        ...(process.env.NODE_ENV === 'production' ? [
          require('cssnano')({
            preset: ['default', {
              // Preserve important comments
              discardComments: { removeAll: false },
              // Optimize CSS custom properties
              reduceIdents: false,
              // Merge media queries
              mergeRules: true
            }]
          })
        ] : [])
      ]
    },
    
    // CSS modules configuration
    modules: {
      generateScopedName: process.env.NODE_ENV === 'production' 
        ? '[hash:base64:5]' 
        : '[name]__[local]__[hash:base64:5]'
    },
    
    // Development CSS source maps
    devSourcemap: process.env.NODE_ENV === 'development'
  },
  
  // JSON processing
  json: {
    // Named exports for better tree shaking
    namedExports: true,
    // Stringify for smaller bundles
    stringify: false
  },
  
  // Enable esbuild for faster builds
  esbuild: {
    // Target modern browsers
    target: 'es2020',
    
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    
    // Optimize for size in production
    minifyIdentifiers: process.env.NODE_ENV === 'production',
    minifySyntax: process.env.NODE_ENV === 'production',
    minifyWhitespace: process.env.NODE_ENV === 'production',
    
    // JSX configuration
    jsx: 'automatic',
    jsxDev: process.env.NODE_ENV === 'development'
  },
  
  // Worker optimization
  worker: {
    // Use Rollup for worker bundling
    format: 'es',
    plugins: [
      react()
    ]
  }
});
