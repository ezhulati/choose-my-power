#!/usr/bin/env node

/**
 * Lightning-Fast HTTP Route Validation
 * Phase 2: Concurrent HTTP testing of all identified routes
 * 
 * This script performs high-speed validation of thousands of URLs using:
 * - Concurrent HTTP requests (no browser overhead)
 * - Smart batching to avoid overwhelming server
 * - Response code analysis (200, 404, 500, etc.)
 * - Performance monitoring and retry logic
 * - Real-time progress reporting
 * 
 * Performance: Tests 1000+ URLs per minute with intelligent rate limiting
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Server settings
  BASE_URL: 'http://localhost:4325',
  
  // Performance settings
  MAX_CONCURRENT: 25,          // Max concurrent requests
  BATCH_SIZE: 100,             // URLs per batch
  REQUEST_TIMEOUT: 10000,      // 10 second timeout
  RETRY_ATTEMPTS: 2,           // Retry failed requests
  DELAY_BETWEEN_BATCHES: 500,  // ms delay between batches
  
  // Response analysis
  SUCCESS_CODES: [200, 301, 302],
  EXPECTED_404_CODES: [404],
  ERROR_CODES: [500, 502, 503, 504],
  
  // Reporting
  PROGRESS_INTERVAL: 50,       // Show progress every N URLs
  SAVE_DETAILED_RESULTS: true
};

// Global state
const results = {
  total_urls: 0,
  tested_urls: 0,
  successful: [],
  dead_paths: [],
  errors: [],
  redirects: [],
  performance: {
    start_time: Date.now(),
    end_time: null,
    duration_ms: null,
    requests_per_second: 0
  },
  summary: {
    success_count: 0,
    not_found_count: 0,
    error_count: 0,
    redirect_count: 0
  }
};

console.log('⚡ Lightning-Fast Route Validation Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

/**
 * Load URLs from route analysis
 */
async function loadUrlsToTest() {
  try {
    console.log('📋 Loading URLs from route analysis...');
    
    const urlListPath = path.join(__dirname, 'expected-urls.txt');
    const urlContent = await fs.readFile(urlListPath, 'utf8');
    const urls = urlContent
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => `${CONFIG.BASE_URL}${url}`);
    
    console.log(`✅ Loaded ${urls.length} URLs for testing`);
    return urls;
  } catch (error) {
    console.error('❌ Failed to load URLs:', error.message);
    
    // Fallback: Use a small set of critical URLs
    console.log('🔄 Using fallback URL set...');
    const fallbackUrls = [
      `${CONFIG.BASE_URL}/`,
      `${CONFIG.BASE_URL}/texas`,
      `${CONFIG.BASE_URL}/texas/dallas-tx`,
      `${CONFIG.BASE_URL}/texas/houston-tx`,
      `${CONFIG.BASE_URL}/shop`,
      `${CONFIG.BASE_URL}/compare`
    ];
    
    return fallbackUrls;
  }
}

/**
 * Test a single URL with retry logic
 */
async function testUrl(url, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChooseMyPower-Route-Validator/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    const result = {
      url: url.replace(CONFIG.BASE_URL, ''),
      full_url: url,
      status_code: response.status,
      status_text: response.statusText,
      response_time_ms: Date.now(),
      attempt: attempt,
      headers: {
        'content-type': response.headers.get('content-type'),
        'location': response.headers.get('location')
      }
    };
    
    // Categorize result
    if (CONFIG.SUCCESS_CODES.includes(response.status)) {
      result.category = 'success';
      results.successful.push(result);
      results.summary.success_count++;
    } else if (CONFIG.EXPECTED_404_CODES.includes(response.status)) {
      result.category = 'not_found';
      results.dead_paths.push(result);
      results.summary.not_found_count++;
    } else if (CONFIG.ERROR_CODES.includes(response.status)) {
      result.category = 'error';
      results.errors.push(result);
      results.summary.error_count++;
    } else if ([301, 302, 307, 308].includes(response.status)) {
      result.category = 'redirect';
      results.redirects.push(result);
      results.summary.redirect_count++;
    } else {
      result.category = 'unknown';
      results.errors.push(result);
      results.summary.error_count++;
    }
    
    return result;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different error types
    let errorType = 'unknown';
    if (error.name === 'AbortError') {
      errorType = 'timeout';
    } else if (error.code === 'ECONNREFUSED') {
      errorType = 'connection_refused';
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'dns_error';
    }
    
    // Retry logic
    if (attempt < CONFIG.RETRY_ATTEMPTS && errorType !== 'connection_refused') {
      console.log(`🔄 Retrying ${url.replace(CONFIG.BASE_URL, '')} (attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      return testUrl(url, attempt + 1);
    }
    
    const result = {
      url: url.replace(CONFIG.BASE_URL, ''),
      full_url: url,
      status_code: null,
      error: error.message,
      error_type: errorType,
      attempt: attempt,
      category: 'error'
    };
    
    results.errors.push(result);
    results.summary.error_count++;
    return result;
  }
}

/**
 * Process URLs in concurrent batches
 */
async function processBatch(urls) {
  const promises = urls.map(url => testUrl(url));
  const batchResults = await Promise.all(promises);
  
  results.tested_urls += urls.length;
  
  // Show progress
  if (results.tested_urls % CONFIG.PROGRESS_INTERVAL === 0) {
    const elapsed = Date.now() - results.performance.start_time;
    const rate = Math.round((results.tested_urls / elapsed) * 1000);
    
    console.log(`⚡ Progress: ${results.tested_urls}/${results.total_urls} URLs tested (${rate} req/sec)`);
  }
  
  return batchResults;
}

/**
 * Main validation logic
 */
async function validateAllRoutes() {
  console.log('🚀 Starting concurrent HTTP validation...');
  
  const allUrls = await loadUrlsToTest();
  results.total_urls = allUrls.length;
  
  console.log(`📊 Testing ${results.total_urls} URLs with ${CONFIG.MAX_CONCURRENT} concurrent requests`);
  console.log(`⚙️  Config: ${CONFIG.BATCH_SIZE} per batch, ${CONFIG.REQUEST_TIMEOUT}ms timeout, ${CONFIG.RETRY_ATTEMPTS} retries`);
  
  // Process URLs in batches
  for (let i = 0; i < allUrls.length; i += CONFIG.BATCH_SIZE) {
    const batch = allUrls.slice(i, i + CONFIG.BATCH_SIZE);
    
    // Split batch into concurrent chunks
    const chunks = [];
    for (let j = 0; j < batch.length; j += CONFIG.MAX_CONCURRENT) {
      chunks.push(batch.slice(j, j + CONFIG.MAX_CONCURRENT));
    }
    
    // Process chunks sequentially, URLs within chunks concurrently
    for (const chunk of chunks) {
      await processBatch(chunk);
    }
    
    // Brief delay between batches to avoid overwhelming server
    if (i + CONFIG.BATCH_SIZE < allUrls.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('✅ All URLs tested!');
}

/**
 * Analyze results and identify patterns
 */
function analyzeResults() {
  console.log('🔍 Analyzing results patterns...');
  
  // Identify dead path patterns
  const deadPathPatterns = {};
  results.dead_paths.forEach(result => {
    const pathParts = result.url.split('/').filter(part => part.length > 0);
    
    if (pathParts.length > 0) {
      const pattern = pathParts[0]; // First path segment
      deadPathPatterns[pattern] = (deadPathPatterns[pattern] || 0) + 1;
    }
  });
  
  // Identify error patterns
  const errorPatterns = {};
  results.errors.forEach(result => {
    const errorType = result.error_type || 'unknown';
    errorPatterns[errorType] = (errorPatterns[errorType] || 0) + 1;
  });
  
  return {
    dead_path_patterns: deadPathPatterns,
    error_patterns: errorPatterns,
    most_common_dead_paths: results.dead_paths
      .reduce((acc, result) => {
        acc[result.url] = (acc[result.url] || 0) + 1;
        return acc;
      }, {}),
    redirect_destinations: results.redirects.map(result => ({
      from: result.url,
      to: result.headers.location,
      status: result.status_code
    }))
  };
}

/**
 * Save detailed results
 */
async function saveResults() {
  console.log('💾 Saving validation results...');
  
  results.performance.end_time = Date.now();
  results.performance.duration_ms = results.performance.end_time - results.performance.start_time;
  results.performance.requests_per_second = Math.round((results.tested_urls / results.performance.duration_ms) * 1000);
  
  const analysis = analyzeResults();
  
  const reportData = {
    ...results,
    analysis,
    config: CONFIG,
    timestamp: new Date().toISOString()
  };
  
  // Save detailed results
  const detailedPath = path.join(__dirname, 'route-validation-results.json');
  await fs.writeFile(detailedPath, JSON.stringify(reportData, null, 2));
  
  // Save dead paths list (high priority)
  const deadPathsPath = path.join(__dirname, 'dead-paths.txt');
  const deadPaths = results.dead_paths.map(result => `${result.status_code} ${result.url}`);
  await fs.writeFile(deadPathsPath, deadPaths.join('\n'));
  
  // Save error list (high priority)
  const errorsPath = path.join(__dirname, 'error-paths.txt');
  const errorPaths = results.errors.map(result => `${result.error_type || 'ERROR'} ${result.url} - ${result.error || 'Unknown error'}`);
  await fs.writeFile(errorsPath, errorPaths.join('\n'));
  
  console.log('✅ Results saved to:');
  console.log(`   📝 Detailed: ${detailedPath}`);
  console.log(`   🚫 Dead Paths: ${deadPathsPath}`);
  console.log(`   ❌ Errors: ${errorsPath}`);
  
  return analysis;
}

/**
 * Print validation summary
 */
function printSummary(analysis) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ROUTE VALIDATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { performance, summary } = results;
  
  console.log(`⏱️  Total Duration: ${performance.duration_ms}ms`);
  console.log(`⚡ Request Rate: ${performance.requests_per_second} req/sec`);
  console.log(`📋 URLs Tested: ${results.tested_urls}/${results.total_urls}`);
  
  console.log('\n📈 RESULTS BREAKDOWN:');
  console.log(`   ✅ Successful: ${summary.success_count} (${((summary.success_count / results.tested_urls) * 100).toFixed(1)}%)`);
  console.log(`   🚫 Dead Paths: ${summary.not_found_count} (${((summary.not_found_count / results.tested_urls) * 100).toFixed(1)}%)`);
  console.log(`   ↗️  Redirects: ${summary.redirect_count} (${((summary.redirect_count / results.tested_urls) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Errors: ${summary.error_count} (${((summary.error_count / results.tested_urls) * 100).toFixed(1)}%)`);
  
  if (summary.not_found_count > 0) {
    console.log('\n🚫 TOP DEAD PATH PATTERNS:');
    Object.entries(analysis.dead_path_patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([pattern, count]) => {
        console.log(`   /${pattern}/* - ${count} dead paths`);
      });
  }
  
  if (summary.error_count > 0) {
    console.log('\n❌ ERROR PATTERNS:');
    Object.entries(analysis.error_patterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([error, count]) => {
        console.log(`   ${error}: ${count} URLs`);
      });
  }
  
  if (summary.redirect_count > 0) {
    console.log('\n↗️  REDIRECT EXAMPLES:');
    analysis.redirect_destinations.slice(0, 3).forEach(redirect => {
      console.log(`   ${redirect.status} ${redirect.from} → ${redirect.to}`);
    });
  }
  
  console.log('\n🚀 Next: Run route-consistency-checker.js for detailed analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Check if server is running
 */
async function checkServerHealth() {
  console.log(`🔍 Checking server health at ${CONFIG.BASE_URL}...`);
  
  try {
    const response = await fetch(CONFIG.BASE_URL, { timeout: 5000 });
    
    if (response.ok) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log(`⚠️  Server responding with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Server is not responding: ${error.message}`);
    console.log('💡 Make sure your dev server is running: npm run dev');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.log('🛑 Cannot proceed without running server');
      process.exit(1);
    }
    
    // Run validation
    await validateAllRoutes();
    
    // Analyze and save results
    const analysis = await saveResults();
    
    // Print summary
    printSummary(analysis);
    
    console.log('🎉 Route validation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Route validation failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚡ Gracefully shutting down...');
  
  if (results.tested_urls > 0) {
    console.log('💾 Saving partial results...');
    await saveResults();
  }
  
  process.exit(0);
});

// Run the validation
main();