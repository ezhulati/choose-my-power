#!/usr/bin/env node

/**
 * FLUX 16:9 Image Generation Script
 * Uses fal.ai/flux/schnell with proper aspect ratio controls for realistic Texas infrastructure
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fal } from '@fal-ai/client';
import dotenv from 'dotenv';

// Setup paths and environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'public/images/og/flux-16x9');

dotenv.config();

// Configure fal with API key
const FAL_KEY = process.env.FAL_KEY?.trim();
fal.config({
  credentials: FAL_KEY
});

// FLUX image generation prompts - 16:9 realistic Texas infrastructure
const imagePrompts = [
  // Core Pages
  {
    filename: 'homepage_texas_grid_16x9.png',
    prompt: 'Professional documentary photograph of current Texas electrical transmission towers and power lines against clear blue sky. Real steel transmission infrastructure as it exists today, photojournalism style, natural lighting, genuine electrical grid',
    context: 'homepage main hero image',
    priority: 1
  },
  
  // Major Texas Cities  
  {
    filename: 'dallas_city_main_16x9.png',
    prompt: 'Documentary photograph of downtown Dallas Texas skyline with real power lines and electrical infrastructure visible. Current buildings and transmission lines as they exist today, professional photography',
    context: 'Dallas city electricity plans',
    priority: 1
  },
  {
    filename: 'houston_city_main_16x9.png',
    prompt: 'Documentary photograph of Houston Texas skyline showing real energy facilities, oil refineries, and power plants. Current industrial infrastructure as it exists today, photojournalism style',
    context: 'Houston city electricity plans',
    priority: 1
  },
  {
    filename: 'austin_city_main_16x9.png',
    prompt: 'Documentary photograph of Austin Texas downtown with real electrical infrastructure and solar panels on buildings. Current Austin cityscape with existing power grid, professional photography',
    context: 'Austin city electricity plans',
    priority: 1
  },
  {
    filename: 'san_antonio_city_main_16x9.png',
    prompt: 'Documentary photograph of San Antonio Texas with CPS Energy electrical infrastructure. Real power substations and transmission lines as they exist today, professional photography',
    context: 'San Antonio city electricity plans',
    priority: 1
  },
  {
    filename: 'fort_worth_city_main_16x9.png',
    prompt: 'Documentary photograph of Fort Worth Texas with electrical transmission infrastructure. Real power towers and distribution lines as they exist today, professional photography',
    context: 'Fort Worth city electricity plans',
    priority: 1
  },

  // Regional Infrastructure
  {
    filename: 'tier1_north_cities_16x9.png',
    prompt: 'Documentary photograph of North Texas electrical infrastructure with transmission towers and power substations. Real current electrical equipment as it exists today, photojournalism style',
    context: 'North Texas regional pages',
    priority: 1
  },
  {
    filename: 'tier1_coast_cities_16x9.png',
    prompt: 'Documentary photograph of Texas coastal electrical infrastructure with power plants and transmission lines near refineries. Real Gulf Coast energy facilities as they exist today',
    context: 'Texas coast regional pages',
    priority: 1
  },
  {
    filename: 'tier1_central_cities_16x9.png',
    prompt: 'Documentary photograph of Central Texas electrical grid with transmission towers and solar installations. Real power infrastructure around Austin area as it exists today',
    context: 'Central Texas regional pages',  
    priority: 1
  },
  {
    filename: 'tier1_south_cities_16x9.png',
    prompt: 'Documentary photograph of South Texas electrical infrastructure with power transmission lines and wind farms. Real energy facilities as they exist today, professional photography',
    context: 'South Texas regional pages',
    priority: 1
  },

  // Filter Categories
  {
    filename: 'green_energy_filter_16x9.png',
    prompt: 'Documentary photograph of Texas renewable energy infrastructure with wind turbines and solar panel installations. Real green energy facilities currently operating in Texas, photojournalism style',
    context: 'Green energy filter pages',
    priority: 2
  },
  {
    filename: 'fixed_rate_filter_16x9.png',
    prompt: 'Documentary photograph of stable Texas electrical infrastructure with steady transmission towers and reliable power substations. Real dependable electrical grid as it exists today',
    context: 'Fixed rate electricity plans',
    priority: 2
  },
  {
    filename: 'variable_rate_filter_16x9.png',
    prompt: 'Documentary photograph of modern Texas smart grid infrastructure with smart meters and digital monitoring equipment. Real adaptive power systems as they exist today in Texas',
    context: 'Variable rate electricity plans', 
    priority: 2
  },

  // State Overview
  {
    filename: 'state_texas_overview_16x9.png',
    prompt: 'Documentary aerial photograph of Texas electrical grid with vast network of transmission lines crossing the landscape. Real power infrastructure spanning Texas as it exists today, professional photography',
    context: 'Texas state pages',
    priority: 1
  }
];

/**
 * Download generated image to local file system
 */
async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, imageBuffer);
    
    const stats = await fs.stat(outputPath);
    return { success: true, size: stats.size };
  } catch (error) {
    console.error(`❌ Download failed for ${outputPath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate single image with FLUX in 16:9 format
 */
async function generateImage(promptData) {
  const { filename, prompt, context } = promptData;
  const outputPath = path.join(outputDir, filename);
  
  // Check if file already exists
  try {
    await fs.access(outputPath);
    console.log(`⏭️  Skipping: ${filename} (already exists)`);
    return { success: true, filename, skipped: true };
  } catch {
    // File doesn't exist, proceed with generation
  }
  
  console.log(`🚀 Generating: ${filename}`);
  console.log(`   Context: ${context}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9", // Explicit 16:9 aspect ratio!
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          process.stdout.write('.');
        }
      }
    });

    if (result?.data?.images?.[0]) {
      const imageUrl = result.data.images[0].url;
      
      // Download the generated image
      const downloadResult = await downloadImage(imageUrl, outputPath);
      
      if (downloadResult.success) {
        console.log(`\n✅ Generated: ${filename} (${Math.round(downloadResult.size / 1024)}KB) - TRUE 16:9 FORMAT`);
        return { success: true, filename, url: imageUrl };
      } else {
        console.log(`\n❌ Generation succeeded but download failed: ${filename}`);
        return { success: false, filename, error: downloadResult.error };
      }
    }

    console.log(`\n❌ Failed to generate: ${filename}`);
    return { success: false, filename, error: 'No image data received' };

  } catch (error) {
    console.error(`\n❌ Generation error for ${filename}:`, error.message);
    return { success: false, filename, error: error.message };
  }
}

/**
 * Main image generation process
 */
async function generateAllImages() {
  console.log('🚀 FLUX 16:9 Image Generation Pipeline');
  console.log('====================================');

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}`);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Sort by priority
    const sortedPrompts = [...imagePrompts].sort((a, b) => a.priority - b.priority);
    
    console.log(`🎨 Generating ${sortedPrompts.length} TRUE 16:9 images with FLUX`);
    console.log(`📐 Using landscape_16_9 format for proper widescreen images`);
    console.log(`💰 Estimated cost: $${(sortedPrompts.length * 0.003).toFixed(3)} (${sortedPrompts.length} × $0.003)\n`);

    let generatedCount = 0;
    let totalCost = 0;
    const results = [];

    // Process images one by one
    for (let i = 0; i < sortedPrompts.length; i++) {
      const promptData = sortedPrompts[i];
      
      console.log(`\n🎨 Processing ${i + 1}/${sortedPrompts.length} (Priority ${promptData.priority})`);
      
      const result = await generateImage(promptData);
      results.push(result);
      
      if (result.success && !result.skipped) {
        generatedCount++;
        totalCost += 0.003; // FLUX cost per image
      }
      
      // Rate limiting delay
      if (i + 1 < sortedPrompts.length) {
        console.log('⏳ Brief cooldown...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final report
    console.log('\n🎉 FLUX 16:9 Generation Complete!');
    console.log('==================================');
    console.log(`✅ Successfully generated: ${generatedCount}/${sortedPrompts.length} TRUE 16:9 images`);
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);
    console.log(`📁 16:9 images saved to: /public/images/og/flux-16x9/`);
    console.log(`🚀 Perfect widescreen format for hero backgrounds!`);

    // Show successful generations
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('\n📋 Generated 16:9 Images:');
      successful.forEach(result => {
        console.log(`   ✅ ${result.filename}`);
      });
    }

    if (generatedCount === sortedPrompts.length) {
      console.log('\n🏆 Perfect! All 16:9 images generated successfully with FLUX');
    }

  } catch (error) {
    console.error('❌ Generation process failed:', error.message);
    process.exit(1);
  }
}

// Run the generation process
generateAllImages().catch(console.error);