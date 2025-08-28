#!/usr/bin/env node
/**
 * Faceted Pages Build Script
 * Pre-builds static pages and warms caches for optimal performance
 * Run with: node scripts/build-faceted-pages.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function main() {
  console.log(colorize('🏗️  Faceted Pages Build System', 'cyan'));
  console.log(colorize('=' .repeat(50), 'blue'));

  const startTime = Date.now();
  let stats = {
    totalPages: 0,
    highPriorityPages: 0,
    mediumPriorityPages: 0,
    lowPriorityPages: 0,
    cacheWarmed: 0,
    errors: 0
  };

  try {
    // Set production environment
    process.env.NODE_ENV = 'production';

    // Import modules
    const { staticGenerationStrategy, getPreBuildUrls } = await import('../src/lib/faceted/static-generation-strategy.ts');
    const { comparePowerClient } = await import('../src/lib/api/comparepower-client.ts');

    console.log(colorize('\n📊 Generating build plan...', 'blue'));
    
    // Get pre-build URLs
    const urls = await getPreBuildUrls();
    stats.totalPages = urls.length;

    console.log(`${colorize('Total pages to build:', 'blue')} ${formatNumber(stats.totalPages)}`);

    // Analyze URLs by priority
    const highPriorityUrls = urls.filter(url => url.split('/').filter(Boolean).length <= 3); // City pages + single filters
    const mediumPriorityUrls = urls.filter(url => {
      const segments = url.split('/').filter(Boolean);
      return segments.length === 4; // Two filters
    });
    const lowPriorityUrls = urls.filter(url => {
      const segments = url.split('/').filter(Boolean);
      return segments.length > 4; // Three+ filters
    });

    stats.highPriorityPages = highPriorityUrls.length;
    stats.mediumPriorityPages = mediumPriorityUrls.length;
    stats.lowPriorityPages = lowPriorityUrls.length;

    console.log(`  ${colorize('High priority:', 'green')} ${formatNumber(stats.highPriorityPages)}`);
    console.log(`  ${colorize('Medium priority:', 'yellow')} ${formatNumber(stats.mediumPriorityPages)}`);
    console.log(`  ${colorize('Low priority:', 'red')} ${formatNumber(stats.lowPriorityPages)}`);

    // Warm cache for high-priority pages
    console.log(colorize('\n🔥 Warming cache for high-priority pages...', 'blue'));
    
    const batchSize = 10;
    const highPriorityBatches = chunkArray(highPriorityUrls, batchSize);
    
    for (let i = 0; i < highPriorityBatches.length; i++) {
      const batch = highPriorityBatches[i];
      const progress = `(${i + 1}/${highPriorityBatches.length})`;
      
      console.log(`  Processing batch ${progress}: ${batch.length} pages`);
      
      try {
        await Promise.allSettled(
          batch.map(url => warmCacheForUrl(url))
        );
        stats.cacheWarmed += batch.length;
      } catch (error) {
        console.warn(`    ⚠️  Batch ${progress} failed: ${error.message}`);
        stats.errors++;
      }

      // Small delay to avoid overwhelming the API
      if (i < highPriorityBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Generate sitemap data
    console.log(colorize('\n🗺️  Generating sitemap data...', 'blue'));
    
    const sitemapData = urls.map(url => ({
      url: `https://choosemypower.org${url}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: url.split('/').filter(Boolean).length <= 3 ? 'daily' : 'weekly',
      priority: getPriorityFromUrl(url)
    }));

    // Write sitemap data to file
    const sitemapPath = join(process.cwd(), 'dist', 'faceted-sitemap.json');
    await fs.writeFile(sitemapPath, JSON.stringify(sitemapData, null, 2));
    console.log(`  ✅ Sitemap data written to: ${sitemapPath}`);

    // Generate build summary
    console.log(colorize('\n📈 Build performance analysis...', 'blue'));
    
    const duration = Date.now() - startTime;
    const pagesPerSecond = stats.totalPages / (duration / 1000);
    const avgTimePerPage = duration / stats.totalPages;

    console.log(`  Build time: ${formatDuration(duration)}`);
    console.log(`  Pages per second: ${pagesPerSecond.toFixed(2)}`);
    console.log(`  Average time per page: ${avgTimePerPage.toFixed(0)}ms`);

    // Cache statistics
    try {
      const cacheStats = await comparePowerClient.getCacheStats();
      console.log(colorize('\n💾 Cache statistics:', 'blue'));
      console.log(`  Memory cache entries: ${formatNumber(cacheStats.memory.totalEntries)}`);
      console.log(`  Redis cache hit rate: ${(cacheStats.redis?.hitRate || 0 * 100).toFixed(1)}%`);
      console.log(`  Database cache entries: ${formatNumber(cacheStats.database?.totalCacheEntries || 0)}`);
    } catch (error) {
      console.warn('  ⚠️  Could not retrieve cache statistics');
    }

    // Build recommendations
    console.log(colorize('\n💡 Build recommendations:', 'blue'));
    
    if (avgTimePerPage > 1000) {
      console.log(`  ⚠️  Average page build time is high (${avgTimePerPage.toFixed(0)}ms). Consider optimizing API calls.`);
    } else {
      console.log(`  ✅ Page build time is optimal (${avgTimePerPage.toFixed(0)}ms)`);
    }

    if (stats.errors > 0) {
      console.log(`  ⚠️  ${stats.errors} errors occurred during cache warming`);
    }

    if (stats.totalPages > 2000) {
      console.log('  💡 Consider implementing more aggressive filtering for production builds');
    }

    // Final summary
    console.log(colorize('\n🎉 Build Summary:', 'cyan'));
    console.log(colorize('=' .repeat(30), 'blue'));
    console.log(`${colorize('Total pages:', 'blue')} ${formatNumber(stats.totalPages)}`);
    console.log(`${colorize('Cache warmed:', 'green')} ${formatNumber(stats.cacheWarmed)}`);
    console.log(`${colorize('Build time:', 'blue')} ${formatDuration(duration)}`);
    console.log(`${colorize('Performance:', 'blue')} ${pagesPerSecond.toFixed(1)} pages/sec`);
    console.log(`${colorize('Status:', 'blue')} ${stats.errors === 0 ? colorize('SUCCESS', 'green') : colorize('WITH WARNINGS', 'yellow')}`);

    // Write build report
    const reportPath = join(process.cwd(), 'dist', 'build-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      stats,
      performance: {
        pagesPerSecond,
        avgTimePerPage
      },
      urls: urls.length
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Build report saved to: ${reportPath}`);

    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    console.error(colorize(`\n💥 Build failed: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Warm cache for a specific URL
 */
async function warmCacheForUrl(url) {
  try {
    // Extract city and filters from URL
    const segments = url.split('/').filter(Boolean);
    if (segments.length < 3) return; // Skip if not electricity-plans URL
    
    const citySlug = segments[2];
    const filterSegments = segments.slice(3);
    
    // Import router and validate
    const { facetedRouter } = await import('../src/lib/faceted/faceted-router.ts');
    const path = filterSegments.length > 0 ? `${citySlug}/${filterSegments.join('/')}` : citySlug;
    
    // This will cache the API response
    await facetedRouter.validateRoute(path, { requirePlans: true });
    
  } catch (error) {
    // Ignore individual URL failures during cache warming
    console.warn(`    ⚠️  Failed to warm cache for ${url}: ${error.message}`);
  }
}

/**
 * Get priority from URL structure
 */
function getPriorityFromUrl(url) {
  const segments = url.split('/').filter(Boolean);
  const filterCount = segments.length - 2; // Subtract 'electricity-plans' and city
  
  if (filterCount === 0) return '1.0';        // City pages
  if (filterCount === 1) return '0.8';        // Single filter
  if (filterCount === 2) return '0.6';        // Two filters
  return '0.4';                                // Three+ filters
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Run the build
main();