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
  output: 'static',
  // Only set adapter for production
  ...(process.env.NODE_ENV === 'production' ? { adapter: netlify() } : {}),
  site: 'https://choosemypower.org',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  },
  server: {
    port: 4324
  }
});