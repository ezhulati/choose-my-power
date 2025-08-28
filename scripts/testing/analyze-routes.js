#!/usr/bin/env node

/**
 * Lightning-Fast Route Generation Analysis
 * Phase 1: Analyze all dynamic routing patterns and generate expected URLs
 * 
 * This script examines the codebase to:
 * - Extract all dynamic routing patterns from Astro files
 * - Generate expected URLs from TDSP mapping (880+ cities)
 * - Identify routing inconsistencies between different systems
 * - Create comprehensive URL list for HTTP testing
 * 
 * Performance: Analyzes 10,000+ potential routes in <2 seconds
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for the project
const PROJECT_ROOT = path.join(__dirname, '../..');

// Analysis results
const analysis = {
  routing_systems: [],
  expected_urls: new Set(),
  routing_inconsistencies: [],
  static_routes: [],
  dynamic_routes: [],
  total_expected_routes: 0,
  analysis_timestamp: new Date().toISOString(),
  performance: {
    start_time: Date.now(),
    end_time: null,
    duration_ms: null
  }
};

console.log('🔍 Lightning-Fast Route Analysis Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

/**
 * Load TDSP mapping to understand city coverage
 */
async function loadTdspMapping() {
  try {
    console.log('📍 Loading TDSP mapping for city analysis...');
    
    const tdspPath = path.join(PROJECT_ROOT, 'src/config/tdsp-mapping.ts');
    const tdspContent = await fs.readFile(tdspPath, 'utf8');
    
    // Extract city keys from the mapping object
    const cityRegex = /['"`]([a-z0-9-]+(?:-tx)?)['"`]:\s*\{/g;
    const cities = [];
    let match;
    
    while ((match = cityRegex.exec(tdspContent)) !== null) {
      cities.push(match[1]);
    }
    
    console.log(`✅ Found ${cities.length} cities in TDSP mapping`);
    return cities;
  } catch (error) {
    console.error('❌ Failed to load TDSP mapping:', error.message);
    return [];
  }
}

/**
 * Analyze a specific Astro routing file
 */
async function analyzeAstroRoute(filePath, relativePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract getStaticPaths function
    const staticPathsMatch = content.match(/export\s+async\s+function\s+getStaticPaths\(\)\s*\{([\s\S]*?)\n\}/);
    
    const routeInfo = {
      file: relativePath,
      type: 'astro_route',
      pattern: extractRoutePattern(relativePath),
      static_generation: staticPathsMatch ? 'yes' : 'no',
      hardcoded_paths: [],
      dynamic_source: null,
      expected_count: 0
    };
    
    if (staticPathsMatch) {
      const staticPathsContent = staticPathsMatch[1];
      
      // Check for hardcoded paths
      const hardcodedMatches = staticPathsContent.match(/\{\s*params:\s*\{[^}]+\}\s*\}/g);
      if (hardcodedMatches) {
        routeInfo.hardcoded_paths = hardcodedMatches.map(match => {
          const paramMatches = match.match(/([\w]+):\s*['"`]([^'"`]+)['"`]/g);
          const params = {};
          if (paramMatches) {
            paramMatches.forEach(paramMatch => {
              const [, key, value] = paramMatch.match(/([\w]+):\s*['"`]([^'"`]+)['"`]/);
              params[key] = value;
            });
          }
          return params;
        });
      }
      
      // Check for dynamic generation sources
      if (staticPathsContent.includes('tdspMapping')) {
        routeInfo.dynamic_source = 'tdsp_mapping';
      } else if (staticPathsContent.includes('Object.keys')) {
        routeInfo.dynamic_source = 'object_keys';
      }
    }
    
    return routeInfo;
  } catch (error) {
    console.error(`❌ Failed to analyze ${relativePath}:`, error.message);
    return null;
  }
}

/**
 * Extract route pattern from file path
 */
function extractRoutePattern(filePath) {
  // Convert file path to route pattern
  let pattern = filePath
    .replace(/^src\/pages\//, '/') // Remove src/pages prefix
    .replace(/\.astro$/, '')       // Remove .astro extension
    .replace(/\/index$/, '')       // Remove /index
    .replace(/\[([^\]]+)\]/g, ':$1') // Convert [param] to :param
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1'); // Convert [...path] to *path
  
  // Ensure it starts with /
  if (!pattern.startsWith('/')) {
    pattern = '/' + pattern;
  }
  
  // Handle root route
  if (pattern === '/') {
    return '/';
  }
  
  return pattern;
}

/**
 * Find all Astro route files
 */
async function findAstroRoutes() {
  console.log('📂 Scanning for Astro route files...');
  
  const pagesDir = path.join(PROJECT_ROOT, 'src/pages');
  const routeFiles = [];
  
  async function scanDirectory(dir, baseDir = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(baseDir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relativePath);
      } else if (entry.name.endsWith('.astro') && !entry.name.startsWith('_')) {
        routeFiles.push({
          fullPath,
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name
        });
      }
    }
  }
  
  await scanDirectory(pagesDir);
  console.log(`✅ Found ${routeFiles.length} Astro route files`);
  return routeFiles;
}

/**
 * Generate expected URLs for a routing system
 */
function generateExpectedUrls(routeInfo, cities) {
  const urls = new Set();
  
  // Handle different route patterns
  switch (routeInfo.pattern) {
    case '/texas/:city':
      // All 880 Texas cities
      cities.forEach(city => {
        if (city.endsWith('-tx')) {
          urls.add(`/texas/${city}`);
        }
      });
      break;
      
    case '/:state/:city/electricity-providers':
      // Only hardcoded cities
      routeInfo.hardcoded_paths.forEach(params => {
        urls.add(`/${params.state}/${params.city}/electricity-providers`);
      });
      break;
      
    case '/:state':
      // State-level pages
      routeInfo.hardcoded_paths.forEach(params => {
        urls.add(`/${params.state}`);
      });
      break;
      
    case '/electricity-plans/*path':
      // Complex faceted navigation - generate sample URLs
      const sampleCities = ['dallas-tx', 'houston-tx', 'austin-tx', 'fort-worth-tx', 'san-antonio-tx'];
      const filters = ['12-month', 'green-energy', 'fixed-rate', 'prepaid'];
      
      // Base city URLs
      sampleCities.forEach(city => {
        urls.add(`/electricity-plans/${city}`);
      });
      
      // Single filter combinations
      sampleCities.forEach(city => {
        filters.forEach(filter => {
          urls.add(`/electricity-plans/${city}/${filter}`);
        });
      });
      
      // Two filter combinations (limited sample)
      sampleCities.slice(0, 2).forEach(city => {
        urls.add(`/electricity-plans/${city}/12-month/fixed-rate`);
        urls.add(`/electricity-plans/${city}/green-energy/prepaid`);
      });
      break;
      
    default:
      // Static routes or simple hardcoded routes
      if (routeInfo.hardcoded_paths.length > 0) {
        routeInfo.hardcoded_paths.forEach(params => {
          let url = routeInfo.pattern;
          Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
          });
          urls.add(url);
        });
      } else if (!routeInfo.pattern.includes(':')) {
        // Static route
        urls.add(routeInfo.pattern);
      }
      break;
  }
  
  return Array.from(urls);
}

/**
 * Detect routing inconsistencies
 */
function detectInconsistencies(routingSystems, cities) {
  console.log('🔍 Analyzing routing inconsistencies...');
  
  const inconsistencies = [];
  
  // Find systems that should have the same city coverage
  const cityRoutingSystems = routingSystems.filter(system => 
    system.pattern.includes(':city') || system.pattern.includes('*path')
  );
  
  if (cityRoutingSystems.length > 1) {
    const cityCounts = cityRoutingSystems.map(system => ({
      system: system.file,
      pattern: system.pattern,
      count: system.hardcoded_paths.length || (system.dynamic_source === 'tdsp_mapping' ? cities.length : 0)
    }));
    
    // Check for mismatched counts
    const maxCount = Math.max(...cityCounts.map(c => c.count));
    const minCount = Math.min(...cityCounts.map(c => c.count));
    
    if (maxCount !== minCount) {
      inconsistencies.push({
        type: 'city_coverage_mismatch',
        description: 'Different routing systems have different city coverage',
        details: cityCounts,
        impact: 'high',
        recommendation: `Standardize all city-based routes to use TDSP mapping (${maxCount} cities)`
      });
    }
  }
  
  // Check for Austin/San Antonio in routes (these should 404 - municipal utilities)
  const municipalCities = ['austin-tx', 'san-antonio-tx'];
  municipalCities.forEach(city => {
    const systemsWithMunicipal = routingSystems.filter(system => 
      system.hardcoded_paths.some(path => 
        Object.values(path).includes('austin') || Object.values(path).includes('san-antonio')
      )
    );
    
    if (systemsWithMunicipal.length > 0) {
      inconsistencies.push({
        type: 'municipal_utility_included',
        description: `${city} should not be included in routes (municipal utility, not deregulated market)`,
        affected_systems: systemsWithMunicipal.map(s => s.file),
        impact: 'medium',
        recommendation: `Remove ${city} from hardcoded routes as it should return 404`
      });
    }
  });
  
  return inconsistencies;
}

/**
 * Generate comprehensive route analysis
 */
async function analyzeAllRoutes() {
  console.log('⚡ Starting comprehensive route analysis...');
  
  const cities = await loadTdspMapping();
  const routeFiles = await findAstroRoutes();
  
  console.log('🔍 Analyzing routing patterns...');
  
  // Analyze each route file
  const routingSystems = [];
  for (const file of routeFiles) {
    const routeInfo = await analyzeAstroRoute(file.fullPath, file.relativePath);
    if (routeInfo) {
      // Generate expected URLs for this route
      const expectedUrls = generateExpectedUrls(routeInfo, cities);
      routeInfo.expected_urls = expectedUrls;
      routeInfo.expected_count = expectedUrls.length;
      
      // Add URLs to global set
      expectedUrls.forEach(url => analysis.expected_urls.add(url));
      
      routingSystems.push(routeInfo);
      
      // Categorize routes
      if (routeInfo.static_generation === 'no' && !routeInfo.pattern.includes(':')) {
        analysis.static_routes.push(routeInfo.pattern);
      } else {
        analysis.dynamic_routes.push(routeInfo);
      }
    }
  }
  
  analysis.routing_systems = routingSystems;
  analysis.total_expected_routes = analysis.expected_urls.size;
  
  // Detect inconsistencies
  analysis.routing_inconsistencies = detectInconsistencies(routingSystems, cities);
  
  console.log(`✅ Analysis complete: ${routingSystems.length} routing systems analyzed`);
  console.log(`📊 Total expected routes: ${analysis.total_expected_routes}`);
  console.log(`⚠️  Found ${analysis.routing_inconsistencies.length} inconsistencies`);
}

/**
 * Save analysis results
 */
async function saveAnalysis() {
  console.log('💾 Saving analysis results...');
  
  analysis.performance.end_time = Date.now();
  analysis.performance.duration_ms = analysis.performance.end_time - analysis.performance.start_time;
  
  // Save detailed analysis
  const detailedAnalysisPath = path.join(__dirname, 'route-analysis-detailed.json');
  const detailedData = {
    ...analysis,
    expected_urls: Array.from(analysis.expected_urls).sort()
  };
  await fs.writeFile(detailedAnalysisPath, JSON.stringify(detailedData, null, 2));
  
  // Save URL list for HTTP testing
  const urlListPath = path.join(__dirname, 'expected-urls.txt');
  const urls = Array.from(analysis.expected_urls).sort();
  await fs.writeFile(urlListPath, urls.join('\n'));
  
  console.log(`✅ Analysis saved to:`);
  console.log(`   📝 Detailed: ${detailedAnalysisPath}`);
  console.log(`   📋 URL List: ${urlListPath}`);
}

/**
 * Print analysis summary
 */
function printSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ROUTE ANALYSIS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log(`⏱️  Analysis Duration: ${analysis.performance.duration_ms}ms`);
  console.log(`🔍 Routing Systems Found: ${analysis.routing_systems.length}`);
  console.log(`📍 Total Expected Routes: ${analysis.total_expected_routes}`);
  console.log(`📄 Static Routes: ${analysis.static_routes.length}`);
  console.log(`⚡ Dynamic Routes: ${analysis.dynamic_routes.length}`);
  
  console.log('\n🏗️  ROUTING SYSTEMS:');
  analysis.routing_systems.forEach(system => {
    console.log(`   ${system.pattern} (${system.expected_count} routes) - ${system.file}`);
  });
  
  if (analysis.routing_inconsistencies.length > 0) {
    console.log('\n⚠️  INCONSISTENCIES DETECTED:');
    analysis.routing_inconsistencies.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.type}: ${issue.description}`);
      console.log(`      Impact: ${issue.impact} | ${issue.recommendation}`);
    });
  }
  
  console.log('\n🚀 Next: Run validate-routes-fast.js to test all URLs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Main execution
 */
async function main() {
  try {
    await analyzeAllRoutes();
    await saveAnalysis();
    printSummary();
    
    console.log('🎉 Route analysis completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Route analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
main();