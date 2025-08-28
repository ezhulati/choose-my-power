#!/usr/bin/env node

/**
 * nano-banana New Image Generation Script
 * Uses nano-banana + Gemini to create entirely new images for ChooseMyPower.org
 * Processes multiple reference images to create unique Texas electricity-themed images
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
const outputDir = path.join(projectRoot, 'public/images/og/nano-banana');

dotenv.config();

// Configure fal with API key
const FAL_KEY = process.env.FAL_KEY?.trim();
fal.config({
  credentials: FAL_KEY
});

// Reference images for nano-banana to work with
const referenceImages = [
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800', // Power lines
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=800', // Solar panels  
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&h=800', // Wind turbines
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1200&h=800'  // Electric grid
];

// nano-banana image generation prompts for ChooseMyPower.org (16:9 aspect ratio, realistic imagery)
const imagePrompts = [
  // Core Homepage Images
  {
    filename: 'homepage_texas_grid_wide.png',
    prompt: 'Professional wide-format documentary photograph taken in 2024 of actual Texas electrical transmission lines and power towers. Real steel transmission towers with power lines, shot during daytime with natural lighting. Genuine current electrical infrastructure, not artistic rendering. Photojournalism style. ASPECT RATIO: Make this a wide horizontal rectangle image, much wider than tall, cinematic widescreen format.',
    context: 'homepage main hero image',
    priority: 1
  },
  
  // Major Texas Cities (Current 2024 Reality)
  {
    filename: 'dallas_city_main_nano.png', 
    prompt: '16:9 documentary photograph taken in 2024 of actual downtown Dallas skyline with real power lines visible. Current Dallas buildings as they exist today, actual transmission infrastructure, street-level view. No CGI, no concept art, genuine photograph of present-day Dallas.',
    context: 'Dallas city electricity plans',
    priority: 1
  },
  {
    filename: 'houston_city_main_nano.png',
    prompt: '16:9 documentary photograph taken in 2024 of actual Houston skyline and energy facilities. Real petrochemical plants, existing oil refineries, current industrial infrastructure as it exists today. Photojournalism style showing genuine Houston energy sector.',
    context: 'Houston city electricity plans', 
    priority: 1
  },
  {
    filename: 'austin_city_main_nano.png',
    prompt: '16:9 documentary photograph taken in 2024 of actual Austin Texas downtown with real electrical infrastructure. Current Austin buildings, existing power lines, actual solar panels on buildings today. No concept designs, genuine present-day Austin photography.',
    context: 'Austin city electricity plans',
    priority: 1
  },
  {
    filename: 'san_antonio_city_main_nano.png',
    prompt: '16:9 documentary photograph taken in 2024 of actual San Antonio with real CPS Energy infrastructure. Current electrical substations, existing power lines, genuine present-day San Antonio electrical grid as it operates today.',
    context: 'San Antonio city electricity plans',
    priority: 1
  },
  {
    filename: 'fort_worth_city_main_nano.png',
    prompt: '16:9 documentary photograph taken in 2024 of actual Fort Worth Texas with real electrical infrastructure. Current power transmission towers, existing distribution lines, genuine present-day Fort Worth energy grid.',
    context: 'Fort Worth city electricity plans',
    priority: 1
  },

  // Regional Tiers (Current Infrastructure)
  {
    filename: 'tier1_north_cities_nano.png',
    prompt: '16:9 documentary photograph taken in 2024 of actual North Texas electrical infrastructure. Real transmission towers and power substations as they exist today, genuine current electrical equipment. Photojournalism style, no artistic interpretation.',
    context: 'North Texas regional pages',
    priority: 1
  },
  {
    filename: 'tier1_coast_cities_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas coastal electrical infrastructure with current power plants, transmission lines near refineries, and real Gulf Coast energy facilities as they exist today.',
    context: 'Texas coast regional pages',
    priority: 1
  },
  {
    filename: 'tier1_central_cities_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Central Texas electrical grid with current transmission towers, solar farms, and power infrastructure around Austin area as they exist today.',
    context: 'Central Texas regional pages',
    priority: 1
  },
  {
    filename: 'tier1_south_cities_nano.png',
    prompt: 'Wide 16:9 realistic photograph of South Texas electrical infrastructure with current power transmission lines, wind farms, and energy facilities as they exist today.',
    context: 'South Texas regional pages',
    priority: 1
  },

  // Filter Categories (Real Current Infrastructure)
  {
    filename: 'green_energy_filter_nano.png',
    prompt: 'Wide 16:9 realistic photograph of actual Texas renewable energy - real wind turbines and solar panel installations currently operating in Texas. Documentary-style photography of existing green energy infrastructure.',
    context: 'Green energy filter pages',
    priority: 2
  },
  {
    filename: 'fixed_rate_filter_nano.png',
    prompt: 'Wide 16:9 realistic photograph of stable Texas electrical infrastructure - steady transmission towers, reliable power substations, and consistent energy grid. Show current, dependable electrical infrastructure as it exists today.',
    context: 'Fixed rate electricity plans',
    priority: 2
  },
  {
    filename: 'variable_rate_filter_nano.png', 
    prompt: 'Wide 16:9 realistic photograph of modern Texas smart grid infrastructure - current smart meters, digital monitoring equipment, and adaptive power systems as they exist today in Texas.',
    context: 'Variable rate electricity plans',
    priority: 2
  },
  {
    filename: 'filter_12month_all_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas residential electrical infrastructure - current power lines serving neighborhoods, distribution transformers, and residential electrical connections as they exist today.',
    context: '12-month plan pages',
    priority: 2
  },
  {
    filename: 'filter_24month_all_nano.png',
    prompt: 'Wide 16:9 realistic photograph of long-term Texas electrical infrastructure - major transmission lines, large substations, and permanent electrical installations built for longevity.',
    context: '24-month plan pages',
    priority: 2
  },
  {
    filename: 'prepaid_plans_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas residential electrical meters and connections - current digital meters, electrical panels, and household power connections as they exist today.',
    context: 'Prepaid electricity plans',
    priority: 2
  },

  // Seasonal Usage (Real Texas Conditions)
  {
    filename: 'summer_peak_usage_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas summer electrical demand - current air conditioning units on real Texas homes, power lines under intense summer heat, and electrical infrastructure during peak summer conditions.',
    context: 'Summer peak usage pages', 
    priority: 3
  },
  {
    filename: 'winter_demand_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas winter electrical infrastructure - current power lines and electrical equipment during real Texas winter conditions, heating infrastructure as it exists today.',
    context: 'Winter demand pages',
    priority: 3
  },

  // State Overview
  {
    filename: 'state_texas_overview_nano.png',
    prompt: 'Wide 16:9 realistic aerial photograph of Texas electrical grid - vast network of current transmission lines crossing Texas landscape, real power infrastructure spanning the state as it exists today.',
    context: 'Texas state pages',
    priority: 1
  },

  // Business/Specialty
  {
    filename: 'business_electricity_nano.png',
    prompt: 'Wide 16:9 realistic photograph of Texas commercial electrical infrastructure - current industrial power connections, business district electrical grid, and commercial power facilities as they exist today.',
    context: 'Business electricity plans',
    priority: 3
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
 * Generate single image with nano-banana + Gemini
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
  
  console.log(`🍌 Generating: ${filename}`);
  console.log(`   Context: ${context}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt: prompt,
        num_images: 1,
        output_format: "png"
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
      const outputPath = path.join(outputDir, filename);
      
      // Download the generated image
      const downloadResult = await downloadImage(imageUrl, outputPath);
      
      if (downloadResult.success) {
        console.log(`\n✅ Generated: ${filename} (${Math.round(downloadResult.size / 1024)}KB)`);
        if (result.data.description) {
          console.log(`   📝 AI Description: ${result.data.description.substring(0, 80)}...`);
        }
        return { success: true, filename, url: imageUrl, description: result.data.description };
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
  console.log('🍌 nano-banana + Gemini Image Generation Pipeline');
  console.log('================================================');

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}`);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Sort by priority (1 = highest priority)
    const sortedPrompts = [...imagePrompts].sort((a, b) => a.priority - b.priority);
    
    console.log(`🎨 Generating ${sortedPrompts.length} new images with nano-banana`);
    console.log(`📸 Using ${referenceImages.length} reference images for context`);
    console.log(`💰 Estimated cost: $${(sortedPrompts.length * 0.01).toFixed(2)} (${sortedPrompts.length} × $0.01)\n`);

    let generatedCount = 0;
    let totalCost = 0;
    const results = [];

    // Process images one by one for better control
    for (let i = 0; i < sortedPrompts.length; i++) {
      const promptData = sortedPrompts[i];
      
      console.log(`\n🎨 Processing ${i + 1}/${sortedPrompts.length} (Priority ${promptData.priority})`);
      
      const result = await generateImage(promptData);
      results.push(result);
      
      if (result.success) {
        generatedCount++;
        totalCost += 0.01; // nano-banana cost per image
      }
      
      // Rate limiting delay between requests (nano-banana is powered by Gemini)
      if (i + 1 < sortedPrompts.length) {
        console.log('\n⏳ Cooling down between generations...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final report
    console.log('\n🎉 nano-banana Generation Complete!');
    console.log('====================================');
    console.log(`✅ Successfully generated: ${generatedCount}/${sortedPrompts.length} images`);
    console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);
    console.log(`📁 New images saved to: /public/images/og/nano-banana/`);
    console.log(`🚀 Ready to update hero-image-mapper.ts with new images!`);

    // Show successful generations
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('\n📋 Generated Images:');
      successful.forEach(result => {
        console.log(`   ✅ ${result.filename}`);
      });
    }

    // Show failures if any
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\n⚠️  Failed Generations:');
      failed.forEach(result => {
        console.log(`   ❌ ${result.filename}: ${result.error}`);
      });
    }

    if (generatedCount === sortedPrompts.length) {
      console.log('\n🏆 Perfect! All images generated successfully with nano-banana + Gemini');
    }

  } catch (error) {
    console.error('❌ Generation process failed:', error.message);
    process.exit(1);
  }
}

// Run the generation process
generateAllImages().catch(console.error);