#!/usr/bin/env node

/**
 * CLI Script for Batch OG Image Generation
 * Provides command-line interface for managing strategic image generation
 */

import { batchGenerator } from '../src/lib/images/batch-generator.js';
import { imageCache } from '../src/lib/images/image-cache.js';
import { imageStrategy } from '../src/lib/images/image-strategy.js';

const commands = {
  'generate-all': generateAllImages,
  'generate-priority': generatePriorityImages,
  'generate-city': generateCityImages,
  'status': showStatus,
  'cleanup': cleanup,
  'preview': previewStrategy,
  'cache-stats': showCacheStats,
  'help': showHelp
};

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command || !commands[command]) {
    showHelp();
    process.exit(1);
  }

  try {
    await commands[command](args);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Generate strategic batch of all images (~300 optimized)
 */
async function generateAllImages(args) {
  console.log('🏭 Starting strategic batch generation for all pages...');
  console.log('💡 This will generate ~300 optimized images to cover 10,000+ pages\n');
  
  const jobId = await batchGenerator.generateStrategicBatch({
    batchSize: 10,
    maxConcurrency: 2,
    delayBetweenBatches: 3000
  });
  
  console.log(`✅ Batch job started: ${jobId}`);
  console.log('📊 Use "npm run og:status" to monitor progress');
  console.log('🔍 Use "npm run og:status ${jobId}" for detailed job status');
}

/**
 * Generate high-priority images first
 */
async function generatePriorityImages(args) {
  console.log('🎯 Starting high-priority image generation...');
  console.log('🏙️ Generating images for homepage, major cities, and common filters\n');
  
  const jobId = await batchGenerator.generateHighPriorityBatch();
  
  console.log(`✅ High-priority batch started: ${jobId}`);
  console.log('📊 Use "npm run og:status" to monitor progress');
}

/**
 * Generate images for specific city
 */
async function generateCityImages(args) {
  const city = args[0];
  const filters = args.slice(1);
  
  if (!city) {
    console.error('❌ City required. Usage: npm run og:city dallas-tx [filter1] [filter2]');
    process.exit(1);
  }
  
  console.log(`🏙️ Generating images for ${city}...`);
  if (filters.length > 0) {
    console.log(`🔧 Filters: ${filters.join(', ')}`);
  }
  
  const jobId = await batchGenerator.generateCityBatch(city, filters);
  
  console.log(`✅ City batch started: ${jobId}`);
  console.log('📊 Use "npm run og:status" to monitor progress');
}

/**
 * Show batch generation status
 */
async function showStatus(args) {
  const jobId = args[0];
  
  if (jobId) {
    // Show specific job status
    const job = batchGenerator.getJobStatus(jobId);
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      return;
    }
    
    console.log(`\n📋 JOB STATUS: ${jobId}`);
    console.log('=' .repeat(60));
    console.log(`Status: ${getStatusEmoji(job.status)} ${job.status.toUpperCase()}`);
    console.log(`Progress: ${job.progress}%`);
    console.log(`Images: ${job.generatedImages}/${job.totalImages}`);
    
    if (job.startedAt) {
      console.log(`Started: ${new Date(job.startedAt).toLocaleString()}`);
    }
    
    if (job.completedAt) {
      console.log(`Completed: ${new Date(job.completedAt).toLocaleString()}`);
      
      const startTime = new Date(job.startedAt).getTime();
      const endTime = new Date(job.completedAt).getTime();
      const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
      console.log(`Duration: ${duration} minutes`);
    }
    
    if (job.errors.length > 0) {
      console.log(`\n❌ ERRORS (${job.errors.length}):`);
      job.errors.slice(0, 5).forEach(error => console.log(`  • ${error}`));
      if (job.errors.length > 5) {
        console.log(`  ... and ${job.errors.length - 5} more errors`);
      }
    }
    
  } else {
    // Show all jobs overview
    const jobs = batchGenerator.getAllJobs();
    const stats = await batchGenerator.getBatchStats();
    
    console.log('\n📊 BATCH GENERATION OVERVIEW');
    console.log('=' .repeat(60));
    console.log(`Active Jobs: ${stats.activeJobs}`);
    console.log(`Queued Jobs: ${stats.queuedJobs}`);
    console.log(`Completed Jobs: ${stats.completedJobs}`);
    console.log(`Total Images Generated: ${stats.totalImagesGenerated}`);
    console.log(`Total Errors: ${stats.totalErrors}`);
    
    if (jobs.length > 0) {
      console.log(`\n📋 RECENT JOBS:`);
      jobs.slice(-5).reverse().forEach(job => {
        const status = getStatusEmoji(job.status);
        const progress = job.progress > 0 ? `${job.progress}%` : 'Starting';
        const images = `${job.generatedImages}/${job.totalImages}`;
        console.log(`  ${status} ${job.id} - ${progress} - ${images} images`);
      });
    }
  }
}

/**
 * Preview cost optimization strategy
 */
async function previewStrategy(args) {
  console.log('🧠 Analyzing cost optimization strategy...\n');
  
  // This would require loading all contexts, which is expensive
  // For now, show template information
  console.log('📊 IMAGE TEMPLATE STRATEGY PREVIEW:');
  console.log('=' .repeat(60));
  console.log('🏠 Homepage & Global: 5 unique images');
  console.log('🏙️ Major Cities: 15-20 unique images');
  console.log('🎯 Tier/Zone Templates: 12 strategic templates');
  console.log('🔧 Filter-Specific: 50-80 targeted images');
  console.log('🔄 Combinations: 50-100 popular combos');
  console.log('🌱 Seasonal: 10-20 seasonal variations');
  console.log('=' .repeat(60));
  console.log('💰 TOTAL: ~300 unique images covering 10,000+ pages');
  console.log('💸 Cost Savings: ~97% reduction vs individual images');
  
  console.log('\n🎯 Strategy Benefits:');
  console.log('  • Major cities get unique, branded images');
  console.log('  • Similar pages share optimized templates');
  console.log('  • Filter combinations reuse base templates');
  console.log('  • Seasonal context adds variety');
  console.log('  • Fallback system ensures 100% coverage');
}

/**
 * Show cache statistics
 */
async function showCacheStats(args) {
  console.log('💾 Loading cache statistics...\n');
  
  const stats = await imageCache.getCacheStats();
  
  console.log('📊 IMAGE CACHE STATISTICS:');
  console.log('=' .repeat(60));
  console.log(`Total Images: ${stats.totalImages}`);
  console.log(`Cache Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log(`Cache Miss Rate: ${(stats.missRate * 100).toFixed(1)}%`);
  console.log(`Cache Size: ${stats.cacheSize}`);
  console.log(`Oldest Image: ${stats.oldestImage}`);
  console.log(`Newest Image: ${stats.newestImage}`);
  
  // Health check
  console.log('\n🔍 System Health Check:');
  try {
    const health = await batchGenerator.getBatchStats();
    console.log(`✅ Batch System: Active (${health.activeJobs} running, ${health.queuedJobs} queued)`);
  } catch (error) {
    console.log(`❌ Batch System: Error - ${error.message}`);
  }
}

/**
 * Cleanup old jobs and expired cache
 */
async function cleanup(args) {
  console.log('🧹 Starting cleanup process...\n');
  
  // Clean old batch jobs
  const cleanedJobs = batchGenerator.cleanupOldJobs(7);
  console.log(`✅ Cleaned ${cleanedJobs} old batch jobs`);
  
  // Clean expired cache images
  const cleanedImages = await imageCache.cleanupExpired();
  console.log(`✅ Cleaned ${cleanedImages} expired cache images`);
  
  console.log('\n🎉 Cleanup complete!');
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🖼️  OG Image Generation CLI

COMMANDS:
  generate-all     Generate strategic batch of ~300 optimized images
  generate-priority Generate high-priority images (homepage, major cities)
  generate-city    Generate images for specific city
                   Usage: npm run og:city dallas-tx [green-energy] [fixed-rate]
  
  status [job-id]  Show batch generation status (all jobs or specific job)
  preview          Preview cost optimization strategy
  cache-stats      Show image cache statistics and health
  cleanup          Clean up old jobs and expired cache images
  help             Show this help message

EXAMPLES:
  npm run og:generate-all           # Generate full strategic batch
  npm run og:generate-priority      # Generate high-priority images first  
  npm run og:city dallas-tx         # Generate all Dallas images
  npm run og:city houston-tx green-energy fixed-rate  # Houston with filters
  npm run og:status                 # Show all jobs overview
  npm run og:status batch_123...    # Show specific job details
  npm run og:cache-stats            # View cache performance
  npm run og:cleanup                # Clean up old data

💡 TIP: Start with 'generate-priority' to get key images, then 'generate-all' for complete coverage.
💰 COST: Strategic generation creates ~300 images instead of 10,000+ for massive savings.
`);
}

/**
 * Get emoji for job status
 */
function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    running: '⚡',
    completed: '✅',
    failed: '❌'
  };
  
  return emojis[status] || '❓';
}

// Run the CLI
main().catch(console.error);