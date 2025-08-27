import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

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
  site: 'https://choosemypower.org',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  }
});