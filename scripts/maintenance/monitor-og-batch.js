#!/usr/bin/env node

/**
 * Real-time Batch Generation Monitor
 * Live monitoring dashboard for OG image generation progress
 */

import { batchGenerator } from '../src/lib/images/batch-generator.js';

const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_REFRESH_COUNT = 720; // Run for up to 1 hour

async function main() {
  const jobId = process.argv[2];
  
  if (jobId) {
    await monitorSpecificJob(jobId);
  } else {
    await monitorAllJobs();
  }
}

/**
 * Monitor specific job in real-time
 */
async function monitorSpecificJob(jobId) {
  console.log(`🔍 Monitoring job: ${jobId}`);
  console.log('Press Ctrl+C to stop monitoring\n');
  
  let refreshCount = 0;
  let lastProgress = -1;
  let lastGeneratedImages = -1;
  
  const interval = setInterval(async () => {
    try {
      const job = batchGenerator.getJobStatus(jobId);
      
      if (!job) {
        console.log(`❌ Job not found: ${jobId}`);
        clearInterval(interval);
        return;
      }
      
      // Clear screen and show updated status
      process.stdout.write('\x1B[2J\x1B[0f');
      
      console.log(`🔍 MONITORING JOB: ${jobId}`);
      console.log('=' .repeat(80));
      console.log(`Status: ${getStatusEmoji(job.status)} ${job.status.toUpperCase()}`);
      console.log(`Progress: ${getProgressBar(job.progress)} ${job.progress}%`);
      console.log(`Images Generated: ${job.generatedImages}/${job.totalImages}`);
      
      if (job.startedAt) {
        const runtime = calculateRuntime(job.startedAt);
        console.log(`Runtime: ${runtime}`);
        
        if (job.progress > 0) {
          const eta = calculateETA(job.startedAt, job.progress);
          console.log(`ETA: ${eta}`);
        }
      }
      
      // Show rate information
      if (job.generatedImages > lastGeneratedImages && lastGeneratedImages >= 0) {
        const rate = (job.generatedImages - lastGeneratedImages) / (REFRESH_INTERVAL / 1000);
        console.log(`Rate: ${rate.toFixed(1)} images/second`);
      }
      
      if (job.errors.length > 0) {
        console.log(`\n❌ Recent Errors (${job.errors.length} total):`);
        job.errors.slice(-3).forEach(error => {
          console.log(`  • ${error.substring(0, 70)}${error.length > 70 ? '...' : ''}`);
        });
      }
      
      console.log(`\nLast Updated: ${new Date().toLocaleTimeString()}`);
      console.log('Press Ctrl+C to stop monitoring');
      
      // Check if job is complete
      if (job.status === 'completed' || job.status === 'failed') {
        console.log(`\n🎉 Job ${job.status}!`);
        
        if (job.status === 'completed') {
          console.log(`✅ Successfully generated ${job.generatedImages} images`);
        } else {
          console.log(`❌ Job failed with ${job.errors.length} errors`);
        }
        
        clearInterval(interval);
        return;
      }
      
      lastProgress = job.progress;
      lastGeneratedImages = job.generatedImages;
      refreshCount++;
      
      if (refreshCount >= MAX_REFRESH_COUNT) {
        console.log('\n⏰ Monitoring timeout reached (1 hour)');
        clearInterval(interval);
      }
      
    } catch (error) {
      console.error('❌ Monitoring error:', error.message);
      clearInterval(interval);
    }
  }, REFRESH_INTERVAL);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Monitoring stopped');
    process.exit(0);
  });
}

/**
 * Monitor all jobs overview
 */
async function monitorAllJobs() {
  console.log('📊 Monitoring all batch jobs');
  console.log('Press Ctrl+C to stop monitoring\n');
  
  let refreshCount = 0;
  
  const interval = setInterval(async () => {
    try {
      const stats = await batchGenerator.getBatchStats();
      const jobs = batchGenerator.getAllJobs();
      
      // Clear screen
      process.stdout.write('\x1B[2J\x1B[0f');
      
      console.log('📊 BATCH GENERATION OVERVIEW');
      console.log('=' .repeat(80));
      console.log(`Active Jobs: ${stats.activeJobs}`);
      console.log(`Queued Jobs: ${stats.queuedJobs}`);
      console.log(`Completed Jobs: ${stats.completedJobs}`);
      console.log(`Total Images Generated: ${stats.totalImagesGenerated}`);
      console.log(`Total Errors: ${stats.totalErrors}`);
      
      if (stats.activeJobs > 0) {
        console.log(`\n⚡ ACTIVE JOBS:`);
        const activeJobs = jobs.filter(job => job.status === 'running');
        
        activeJobs.forEach(job => {
          console.log(`  ${getStatusEmoji(job.status)} ${job.id}`);
          console.log(`    Progress: ${getProgressBar(job.progress, 30)} ${job.progress}%`);
          console.log(`    Images: ${job.generatedImages}/${job.totalImages}`);
          
          if (job.startedAt) {
            const runtime = calculateRuntime(job.startedAt);
            console.log(`    Runtime: ${runtime}`);
          }
          
          if (job.errors.length > 0) {
            console.log(`    Errors: ${job.errors.length}`);
          }
          console.log('');
        });
      }
      
      if (stats.queuedJobs > 0) {
        console.log(`⏳ QUEUED JOBS: ${stats.queuedJobs}`);
        const queuedJobs = jobs.filter(job => job.status === 'pending');
        queuedJobs.slice(0, 3).forEach(job => {
          console.log(`  • ${job.id} (${job.totalImages} images)`);
        });
        if (queuedJobs.length > 3) {
          console.log(`  ... and ${queuedJobs.length - 3} more`);
        }
        console.log('');
      }
      
      console.log(`Last Updated: ${new Date().toLocaleTimeString()}`);
      console.log('Press Ctrl+C to stop monitoring');
      
      refreshCount++;
      if (refreshCount >= MAX_REFRESH_COUNT) {
        console.log('\n⏰ Monitoring timeout reached (1 hour)');
        clearInterval(interval);
      }
      
    } catch (error) {
      console.error('❌ Monitoring error:', error.message);
      clearInterval(interval);
    }
  }, REFRESH_INTERVAL);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Monitoring stopped');
    process.exit(0);
  });
}

/**
 * Get status emoji
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

/**
 * Generate progress bar
 */
function getProgressBar(progress, width = 40) {
  const filledWidth = Math.round((progress / 100) * width);
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(width - filledWidth);
  return `[${filled}${empty}]`;
}

/**
 * Calculate runtime from start time
 */
function calculateRuntime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate estimated time to completion
 */
function calculateETA(startTime, progress) {
  if (progress <= 0) return 'Calculating...';
  
  const start = new Date(startTime);
  const now = new Date();
  const elapsed = now - start; // ms
  
  const totalEstimated = (elapsed / progress) * 100;
  const remaining = totalEstimated - elapsed;
  
  const remainingMinutes = Math.round(remaining / (1000 * 60));
  
  if (remainingMinutes < 1) {
    return 'Less than 1 minute';
  } else if (remainingMinutes < 60) {
    return `${remainingMinutes} minutes`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

// Run the monitor
main().catch(console.error);