#!/usr/bin/env node
/**
 * Professional Electricity Data Synchronization Script
 * 
 * This script implements a professional electricity comparison platform's data sync strategy:
 * - Can be run as a scheduled job (cron/systemd timer)
 * - Supports multiple sync modes (priority, full, city-specific)
 * - Implements professional error handling and recovery
 * - Comprehensive logging and monitoring
 * - Rate limiting to respect API quotas
 * - Database-first approach to minimize API calls
 * 
 * Usage:
 *   npm run sync:priority     # Sync priority cities (fast)
 *   npm run sync:full         # Full sync all cities (slow)
 *   npm run sync:city dallas  # Sync specific city
 *   npm run sync:monitor      # Show sync status and stats
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Check if we're in the right directory
if (!existsSync(join(rootDir, 'package.json'))) {
  console.error('❌ Script must be run from the project root directory');
  process.exit(1);
}

// Import our sync manager
const { dataSyncManager } = await import('../src/lib/database/data-sync-manager.js');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'priority';
  const target = args[1];
  
  return { mode, target, args };
}

/**
 * Display usage information
 */
function showUsage() {
  console.log(`
🔄 ChooseMyPower Data Synchronization Tool

USAGE:
  node scripts/sync-electricity-data.mjs [mode] [target]

MODES:
  priority    Sync high-priority cities (default) - Fast, ~5-10 min
  full        Sync all 881 Texas cities - Slow, ~60-90 min  
  city        Sync specific city (requires city slug)
  monitor     Show sync status and statistics
  status      Show current sync queue status
  stop        Stop all running sync operations
  emergency   Emergency stop all operations

EXAMPLES:
  node scripts/sync-electricity-data.mjs priority
  node scripts/sync-electricity-data.mjs city dallas-tx
  node scripts/sync-electricity-data.mjs full
  node scripts/sync-electricity-data.mjs monitor
  
SCHEDULED USAGE (cron):
  # Run priority sync every hour
  0 * * * * cd /path/to/project && npm run sync:priority
  
  # Run full sync once daily at 2 AM
  0 2 * * * cd /path/to/project && npm run sync:full
  `);
}

/**
 * Main sync execution
 */
async function main() {
  const { mode, target } = parseArgs();
  
  console.log(`🚀 ChooseMyPower Data Sync - Mode: ${mode.toUpperCase()}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  try {
    switch (mode.toLowerCase()) {
      case 'help':
      case '--help':
      case '-h':
        showUsage();
        break;
        
      case 'priority':
        await runPrioritySync();
        break;
        
      case 'full':
        await runFullSync();
        break;
        
      case 'city':
        if (!target) {
          console.error('❌ City slug required for city mode');
          console.log('Example: node scripts/sync-electricity-data.mjs city dallas-tx');
          process.exit(1);
        }
        await runCitySync(target);
        break;
        
      case 'monitor':
        await showMonitorInfo();
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'stop':
        await stopSync();
        break;
        
      case 'emergency':
        await emergencyStop();
        break;
        
      default:
        console.error(`❌ Unknown mode: ${mode}`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Sync failed with error:', error);
    
    // Log error for monitoring
    try {
      const { planRepository } = await import('../src/lib/database/plan-repository.js');
      await planRepository.logApiCall(
        'sync_script_error',
        { mode, target, error: String(error) },
        500,
        0,
        String(error)
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    process.exit(1);
  }
}

/**
 * Run priority sync for high-traffic cities
 */
async function runPrioritySync() {
  console.log('🎯 Starting priority city synchronization...');
  console.log('This will sync major cities and recently searched areas');
  
  const startTime = Date.now();
  
  // Start the sync manager
  dataSyncManager.start();
  
  // Wait for initial priority sync to complete
  await new Promise(resolve => {
    const checkInterval = setInterval(async () => {
      const status = dataSyncManager.getSyncStatus();
      
      console.log(`📊 Progress: ${status.completedJobs} completed, ${status.pendingJobs} pending, ${status.failedJobs} failed`);
      
      if (status.pendingJobs === 0) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 5000); // Check every 5 seconds
  });
  
  dataSyncManager.stop();
  
  const duration = Date.now() - startTime;
  const stats = dataSyncManager.getSyncStatus();
  
  console.log(`✅ Priority sync completed in ${Math.round(duration / 1000)}s`);
  console.log(`📈 Results: ${stats.completedJobs} successful, ${stats.failedJobs} failed`);
  
  await showSyncStats();
}

/**
 * Run full sync for all cities
 */
async function runFullSync() {
  console.log('🌎 Starting FULL synchronization of all 881+ Texas cities...');
  console.log('⚠️  This will take 60-90 minutes and make many API calls');
  console.log('💡 Consider running during off-peak hours');
  
  // Confirm before proceeding
  if (process.stdin.isTTY) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Continue with full sync? (y/N): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Full sync cancelled');
      return;
    }
  }
  
  const startTime = Date.now();
  
  // Start the sync manager
  dataSyncManager.start();
  
  // Force refresh all cities
  await dataSyncManager.forceRefreshAllCities();
  
  // Monitor progress
  let lastUpdate = Date.now();
  const monitorInterval = setInterval(async () => {
    const status = dataSyncManager.getSyncStatus();
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`📊 [${elapsed}s] Progress: ${status.completedJobs} completed, ${status.pendingJobs} pending, ${status.failedJobs} failed`);
    
    if (status.pendingJobs === 0) {
      clearInterval(monitorInterval);
    }
    
    lastUpdate = Date.now();
  }, 30000); // Update every 30 seconds
  
  // Wait for completion
  await new Promise(resolve => {
    const checkInterval = setInterval(async () => {
      const status = dataSyncManager.getSyncStatus();
      
      if (status.pendingJobs === 0) {
        clearInterval(checkInterval);
        clearInterval(monitorInterval);
        resolve();
      }
    }, 10000); // Check every 10 seconds
  });
  
  dataSyncManager.stop();
  
  const duration = Date.now() - startTime;
  const stats = dataSyncManager.getSyncStatus();
  
  console.log(`✅ Full sync completed in ${Math.round(duration / 60000)} minutes`);
  console.log(`📈 Results: ${stats.completedJobs} successful, ${stats.failedJobs} failed`);
  
  await showSyncStats();
}

/**
 * Run sync for specific city
 */
async function runCitySync(citySlug) {
  console.log(`🏙️  Syncing specific city: ${citySlug}`);
  
  try {
    const { planRepository } = await import('../src/lib/database/plan-repository.js');
    
    // Get city info from database
    const cities = await planRepository.getAllCities();
    const city = cities.find(c => c.slug === citySlug);
    
    if (!city) {
      console.error(`❌ City not found: ${citySlug}`);
      console.log('💡 Available cities:');
      cities.slice(0, 10).forEach(c => console.log(`   - ${c.slug}`));
      if (cities.length > 10) {
        console.log(`   ... and ${cities.length - 10} more cities`);
      }
      return;
    }
    
    console.log(`📍 Syncing ${city.name} (TDSP: ${city.tdsp_duns})`);
    
    const jobId = await dataSyncManager.syncCity(city.slug, city.tdsp_duns, 'high');
    console.log(`🔄 Sync job started: ${jobId}`);
    
    // Start sync manager temporarily
    dataSyncManager.start();
    
    // Wait for this specific job to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(async () => {
        const status = dataSyncManager.getSyncStatus();
        
        if (status.pendingJobs === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
    dataSyncManager.stop();
    
    console.log(`✅ City sync completed for ${city.name}`);
    
  } catch (error) {
    console.error(`❌ City sync failed for ${citySlug}:`, error);
    throw error;
  }
}

/**
 * Show monitoring information
 */
async function showMonitorInfo() {
  console.log('📊 ChooseMyPower Data Sync Monitor\n');
  
  const status = dataSyncManager.getSyncStatus();
  const stats = await dataSyncManager.getSyncStats();
  
  console.log('🔄 SYNC STATUS:');
  console.log(`   Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
  console.log(`   Queue Size: ${status.queueSize}`);
  console.log(`   Pending Jobs: ${status.pendingJobs}`);
  console.log(`   Completed Jobs: ${status.completedJobs}`);
  console.log(`   Failed Jobs: ${status.failedJobs}`);
  
  console.log('\n📈 LAST 24 HOURS:');
  console.log(`   Total Syncs: ${stats.last24Hours.totalSyncs}`);
  console.log(`   Successful: ${stats.last24Hours.successfulSyncs}`);
  console.log(`   Failed: ${stats.last24Hours.failedSyncs}`);
  console.log(`   Avg Duration: ${Math.round(stats.last24Hours.averageDuration)}ms`);
  
  console.log('\n🌐 API USAGE:');
  console.log(`   Total API Calls: ${stats.apiUsage.totalCalls}`);
  console.log(`   Cache Hit Rate: ${Math.round(stats.apiUsage.cacheHitRate)}%`);
  
  await showSyncStats();
}

/**
 * Show current sync status
 */
async function showStatus() {
  const status = dataSyncManager.getSyncStatus();
  
  console.log('📋 Current Sync Queue Status:');
  console.log(`   🔄 Running: ${status.isRunning}`);
  console.log(`   📦 Queue Size: ${status.queueSize}`);
  console.log(`   ⏳ Pending: ${status.pendingJobs}`);
  console.log(`   ✅ Completed: ${status.completedJobs}`);
  console.log(`   ❌ Failed: ${status.failedJobs}`);
  
  if (status.queueSize === 0) {
    console.log('\n💡 Queue is empty. Run sync:priority or sync:full to start sync jobs.');
  }
}

/**
 * Stop all sync operations
 */
async function stopSync() {
  console.log('⏹️  Stopping all sync operations...');
  dataSyncManager.stop();
  console.log('✅ Sync operations stopped');
}

/**
 * Emergency stop all operations
 */
async function emergencyStop() {
  console.log('🚨 EMERGENCY STOP: Halting all sync operations immediately');
  dataSyncManager.emergencyStop();
  console.log('✅ Emergency stop completed');
}

/**
 * Show detailed sync statistics
 */
async function showSyncStats() {
  try {
    const { planRepository } = await import('../src/lib/database/plan-repository.js');
    const cacheStats = await planRepository.getCacheStats();
    
    console.log('\n📊 DATABASE STATISTICS:');
    console.log(`   Total Cache Entries: ${cacheStats.totalCacheEntries}`);
    console.log(`   Active Cache Entries: ${cacheStats.activeCacheEntries}`);
    console.log(`   API Calls (24h): ${cacheStats.apiCallsLast24h}`);
    console.log(`   Last Updated: ${cacheStats.timestamp}`);
  } catch (error) {
    console.error('Failed to get sync stats:', error);
  }
}

/**
 * Signal handling for graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, stopping sync gracefully...');
  dataSyncManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, stopping sync gracefully...');
  dataSyncManager.stop();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  dataSyncManager.emergencyStop();
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});