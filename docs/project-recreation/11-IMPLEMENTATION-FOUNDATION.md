# Implementation Foundation: Critical Files & Configuration

**Document**: Essential Implementation Files for Project Bootstrap  
**Version**: 1.0  
**Date**: 2025-09-09  
**Purpose**: Provide all critical files needed to start the ChooseMyPower project

## Complete Package.json

### **Root Package.json**
```json
{
  "name": "choose-my-power",
  "version": "1.0.0",
  "description": "Texas electricity provider comparison platform",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev --port 4324",
    "start": "astro dev --port 4324",
    "build": "npm run build:data:smart && astro build",
    "build:local": "LOCAL_BUILD=true astro build",
    "build:legacy": "astro check && astro build",
    "preview": "astro preview",
    
    "build:data:smart": "node scripts/build-data-smart.mjs",
    "build:data:fresh": "USE_CACHED_DATA=false node scripts/build-data-smart.mjs",
    "build:data:881": "MAX_CITIES=881 node scripts/build-data-smart.mjs",
    "build:data:tier1": "TIER_PRIORITY=high MAX_CITIES=200 node scripts/build-data-smart.mjs",
    
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:run && npm run test:e2e",
    "test:api": "vitest run tests/api/",
    "test:integration": "vitest run tests/integration/",
    "test:faceted": "vitest run tests/faceted/",
    
    "lint": "eslint . --ext .js,.ts,.jsx,.tsx,.astro",
    "lint:fix": "eslint . --ext .js,.ts,.jsx,.tsx,.astro --fix",
    "validate:ids": "node scripts/validate-no-hardcoded-ids.mjs",
    "perf:test": "lighthouse http://localhost:4324 --output html --output-path ./reports/lighthouse.html",
    "perf:test:critical": "node scripts/performance-critical-test.mjs",
    "security:audit": "npm audit && node scripts/security-scan.mjs",
    "security:scan": "eslint . --ext .js,.ts,.jsx,.tsx --config .eslintrc.security.js",
    
    "db:migrate": "drizzle-kit migrate",
    "db:generate": "drizzle-kit generate:pg",
    "db:seed": "node scripts/seed-database.mjs",
    "db:reset": "node scripts/reset-database.mjs",
    "db:test": "node scripts/test-database-connection.mjs",
    "db:health": "node scripts/database-health-check.mjs",
    "db:metrics": "node scripts/database-performance-metrics.mjs",
    "db:optimize": "node scripts/optimize-database.mjs",
    
    "cache:stats": "node scripts/cache-statistics.mjs",
    "health:check": "node scripts/system-health-check.mjs",
    "production:deploy": "npm run build && netlify deploy --prod",
    "production:validate": "node scripts/production-readiness-check.mjs"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/netlify": "^5.5.3",
    "@astrojs/node": "^8.3.4",
    "@astrojs/react": "^3.6.2",
    "@astrojs/sitemap": "^3.2.1",
    "@astrojs/tailwind": "^5.1.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "astro": "^5.13.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "~5.9.2",
    
    "drizzle-orm": "^0.44.5",
    "drizzle-kit": "^0.30.0",
    "postgres": "^3.4.5",
    "ioredis": "^5.3.2",
    
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    
    "zod": "^3.23.8",
    "sharp": "^0.33.5",
    "date-fns": "^4.1.0",
    "nanoid": "^5.0.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.1",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "@vitest/coverage-v8": "^3.2.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.1",
    "eslint-plugin-astro": "^1.2.4",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-security": "^3.0.1",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.35",
    "prettier": "^3.3.3",
    "prettier-plugin-astro": "^0.15.1",
    "prettier-plugin-tailwindcss": "^0.6.8",
    "tailwindcss": "^3.4.1",
    "vite": "^5.4.10",
    "vitest": "^3.2.4"
  },
  "engines": {
    "node": ">=20.5.0",
    "npm": ">=10.2.0"
  },
  "volta": {
    "node": "20.5.0",
    "npm": "10.2.0"
  }
}
```

## Core Configuration Files

### **Astro Configuration (astro.config.mjs)**
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isNetlify = process.env.NETLIFY === 'true' || process.env.DEPLOY_CONTEXT;
const useLocalBuild = process.env.LOCAL_BUILD === 'true';

// Conditional adapter selection
function getAdapter() {
  if (isNetlify && !useLocalBuild) {
    return netlify({
      dist: new URL('./dist/', import.meta.url),
      edgeMiddleware: false,
      cacheOnDemandPages: true,
    });
  }
  return node({ mode: 'standalone' });
}

// Strategic code chunking for performance
function strategicChunkStrategy(id) {
  // Core React libraries - Load first
  if (id.includes('react') || id.includes('react-dom')) {
    return 'vendor-react';
  }
  
  // UI components - Preload
  if (id.includes('@radix-ui') || id.includes('/ui/')) {
    return 'vendor-ui';
  }
  
  // API and services - Lazy load
  if (id.includes('/api/') || id.includes('/services/')) {
    return 'api-system';
  }
  
  // Faceted search system - Route-based
  if (id.includes('/faceted/')) {
    return 'faceted-system';
  }
  
  // Mobile components - Conditional loading
  if (id.includes('/mobile/')) {
    return 'mobile-system';
  }
  
  // Plan components - Feature-based
  if (id.includes('/plans/')) {
    return 'plans-system';
  }
  
  // Large utilities
  if (id.includes('lodash') || id.includes('date-fns')) {
    return 'vendor-utils';
  }
  
  return 'vendor';
}

export default defineConfig({
  site: 'https://choosemypower.com',
  output: 'server', // Enable SSR for dynamic content
  adapter: getAdapter(),
  
  integrations: [
    react({
      include: ['**/react/*', '**/ui/*', '**/components/*'],
    }),
    tailwind({
      applyBaseStyles: false, // Custom CSS control
    }),
    sitemap({
      filter: (page) => {
        // Exclude admin and API routes from sitemap
        return !page.includes('/admin/') && !page.includes('/api/');
      },
    }),
  ],
  
  vite: {
    build: {
      target: 'es2020',
      rollupOptions: {
        external: ['sharp'], // Externalize for serverless
        output: {
          manualChunks: strategicChunkStrategy,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  },
  
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        formats: ['avif', 'webp'],
        quality: { avif: 70, webp: 80 },
        loading: 'lazy',
      },
    },
  },
  
  // Security headers
  security: {
    checkOrigin: true,
  },
  
  // Development server
  server: {
    port: 4324,
    host: true,
  },
});
```

### **Drizzle Configuration (drizzle.config.ts)**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL!,
    ssl: true,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'supabase',
  },
});
```

### **TypeScript Configuration (tsconfig.json)**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "allowJs": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/types/*": ["./src/types/*"],
      "@/config/*": ["./src/config/*"],
      "@/data/*": ["./src/data/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.astro",
    "scripts/**/*.ts",
    "scripts/**/*.mjs"
  ],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

### **Tailwind Configuration (tailwind.config.mjs)**
```javascript
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Texas-themed brand colors
        'texas-navy': '#002868',
        'texas-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        'texas-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        'texas-cream': {
          50: '#fefefe',
          200: '#fefcf8',
          300: '#fdf8f0',
          400: '#fbf2e4',
          500: '#f8edd3',
        },
        
        // shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        serif: ['Georgia', ...fontFamily.serif],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
```

### **ESLint Configuration (.eslintrc.js)**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:astro/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  plugins: ['@typescript-eslint', 'react', 'jsx-a11y'],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
  ],
};
```

### **Prettier Configuration (.prettierrc.js)**
```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
```

### **Environment Configuration (.env.example)**
```bash
# Application
NODE_ENV=development
LOCAL_BUILD=true

# Database
# Choose one option for development:
# Option 1: Local PostgreSQL
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev

# Option 2: Netlify's Neon (production-like)
NETLIFY_DATABASE_URL=your_neon_connection_string

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# API Integration (required for data generation)
COMPAREPOWER_API_KEY=your_comparepower_api_key
ERCOT_API_KEY=your_ercot_api_key

# Development settings
MAX_CITIES=10
BATCH_SIZE=3
BATCH_DELAY_MS=1000
USE_CACHED_DATA=true
TIER_PRIORITY=high

# Testing
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/choosemypower_test

# Analytics (optional)
ANALYTICS_KEY=your_analytics_key

# Security (production)
SECRET_KEY=your_secret_key_here
```

### **Vitest Configuration (vitest.config.ts)**
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**',
      ],
    },
    
    testTimeout: 10000,
    hookTimeout: 10000,
    threads: true,
    maxThreads: 4,
    
    watch: {
      ignore: ['**/dist/**', '**/coverage/**'],
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/tests': resolve(__dirname, './tests'),
    },
  },
});
```

### **Playwright Configuration (playwright.config.ts)**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:4324',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4324',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Project Structure Setup

### **Required Directory Structure**
```
choose-my-power/
├── src/
│   ├── components/
│   │   ├── ui/                    # Base UI components
│   │   ├── plans/                 # Plan-specific components
│   │   ├── faceted/              # Filtering system
│   │   ├── mobile/               # Mobile-optimized components
│   │   ├── address/              # Address validation
│   │   └── agents/               # AI integration components
│   ├── pages/
│   │   ├── api/                  # Serverless API endpoints
│   │   ├── electricity-plans/    # Plan comparison pages
│   │   └── texas/               # Texas-specific pages
│   ├── lib/
│   │   ├── database/            # Database schema and queries
│   │   ├── services/            # Business logic services
│   │   ├── validation/          # Input validation schemas
│   │   └── cache/               # Caching utilities
│   ├── config/                  # Configuration files
│   ├── types/                   # TypeScript type definitions
│   └── data/
│       └── generated/           # Generated city data files
├── scripts/                     # Build and utility scripts
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   └── fixtures/                # Test data
├── drizzle/                     # Database migrations
├── docs/                        # Documentation
└── netlify/
    └── functions/               # Netlify function deployments
```

### **Critical Files Checklist**
- ✅ package.json with all dependencies
- ✅ astro.config.mjs with performance optimization
- ✅ drizzle.config.ts for database migrations
- ✅ tsconfig.json with proper path mapping
- ✅ tailwind.config.mjs with Texas theme
- ✅ eslint configuration for code quality
- ✅ prettier configuration for formatting
- ✅ vitest configuration for testing
- ✅ playwright configuration for E2E testing
- ✅ environment variable template

This foundation provides all critical configuration files needed to bootstrap the ChooseMyPower project successfully.