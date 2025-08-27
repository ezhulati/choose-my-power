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
    })
  ],
  output: 'static',
  adapter: netlify(),
  site: 'https://choosemypower.org',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  }
});