#!/usr/bin/env node

/**
 * Clean City Skyline Generation - 16:9 Format
 * Beautiful, clean city skylines as they look in 2025 - no power lines or industrial mess
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
const outputDir = path.join(projectRoot, 'public/images/og/clean-cities');

dotenv.config();

// Configure fal with API key
const FAL_KEY = process.env.FAL_KEY?.trim();
fal.config({
  credentials: FAL_KEY
});

// Clean city skyline prompts - beautiful current cities as they look in 2025
const cityPrompts = [
  {
    filename: 'dallas_clean_skyline_16x9.png',
    prompt: 'Beautiful professional photograph of downtown Dallas Texas skyline in 2025. Clean modern city view showing current skyscrapers, Reunion Tower, and downtown buildings as they exist today. Clear blue sky, professional photography, no power lines, no industrial elements. Attractive cityscape.',
    context: 'Dallas city pages',
    priority: 1
  },
  {
    filename: 'houston_clean_skyline_16x9.png',
    prompt: 'Beautiful professional photograph of downtown Houston Texas skyline in 2025. Clean modern city view showing current skyscrapers and downtown buildings as they exist today. Clear sky, professional photography, no power lines, no industrial mess. Attractive urban landscape.',
    context: 'Houston city pages',
    priority: 1
  },
  {
    filename: 'austin_clean_skyline_16x9.png',
    prompt: 'Beautiful professional photograph of downtown Austin Texas skyline in 2025. Clean modern city view showing current buildings, high-rises, and Austin downtown as it exists today. Clear sky, professional photography, no power lines, no industrial elements. Attractive cityscape with modern architecture.',
    context: 'Austin city pages',
    priority: 1
  },
  {
    filename: 'san_antonio_clean_skyline_16x9.png',
    prompt: 'Beautiful professional photograph of downtown San Antonio Texas skyline in 2025. Clean modern city view showing current skyscrapers, Tower of the Americas, and downtown buildings as they exist today. Clear sky, professional photography, no power lines. Attractive cityscape.',
    context: 'San Antonio city pages',
    priority: 1
  },
  {
    filename: 'fort_worth_clean_skyline_16x9.png',
    prompt: 'Beautiful professional photograph of downtown Fort Worth Texas skyline in 2025. Clean modern city view showing current buildings and downtown Fort Worth as it exists today. Clear sky, professional photography, no power lines, no industrial elements. Attractive urban landscape.',
    context: 'Fort Worth city pages',
    priority: 1
  },
  {
    filename: 'plano_clean_cityscape_16x9.png',
    prompt: 'Beautiful professional photograph of Plano Texas cityscape in 2025. Clean modern suburban city view showing current Plano buildings and development as they exist today. Clear sky, professional photography, no power lines. Attractive suburban landscape.',
    context: 'Plano city pages',
    priority: 2
  },
  {
    filename: 'arlington_clean_cityscape_16x9.png',
    prompt: 'Beautiful professional photograph of Arlington Texas cityscape in 2025. Clean modern city view showing current Arlington buildings and urban development as they exist today. Clear sky, professional photography, no power lines. Attractive cityscape.',
    context: 'Arlington city pages',  
    priority: 2
  },
  {
    filename: 'grand_prairie_clean_cityscape_16x9.png',
    prompt: 'Beautiful professional photograph of Grand Prairie Texas cityscape in 2025. Clean modern suburban city view showing current Grand Prairie buildings and development as they exist today. Clear sky, professional photography, no power lines. Attractive urban landscape.',
    context: 'Grand Prairie city pages',
    priority: 2
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
 * Generate single clean city image with FLUX in 16:9 format
 */
async function generateImage(promptData) {
  const { filename, prompt, context } = promptData;
  const outputPath = path.join(outputDir, filename);
  
  console.log(`🏙️ Generating: ${filename}`);
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
        console.log(`\n✅ Generated: ${filename} (${Math.round(downloadResult.size / 1024)}KB) - CLEAN 16:9 CITY`);
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
 * Main clean city generation process
 */
async function generateAllCities() {
  console.log('🏙️ Clean City Skylines - 16:9 Generation');
  console.log('========================================');

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}`);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Sort by priority
    const sortedPrompts = [...cityPrompts].sort((a, b) => a.priority - b.priority);
    
    console.log(`🏙️ Generating ${sortedPrompts.length} CLEAN city skylines in TRUE 16:9`);
    console.log(`✨ Beautiful cities as they look in 2025 - no power lines!`);
    console.log(`💰 Estimated cost: $${(sortedPrompts.length * 0.003).toFixed(3)} (${sortedPrompts.length} × $0.003)\n`);

    let generatedCount = 0;
    let totalCost = 0;
    const results = [];

    // Process images one by one
    for (let i = 0; i < sortedPrompts.length; i++) {
      const promptData = sortedPrompts[i];
      
      console.log(`\n🏙️ Processing ${i + 1}/${sortedPrompts.length} (Priority ${promptData.priority})`);
      
      const result = await generateImage(promptData);
      results.push(result);
      
      if (result.success) {
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
    console.log('\n🎉 Clean City Generation Complete!');
    console.log('==================================');
    console.log(`✅ Successfully generated: ${generatedCount}/${sortedPrompts.length} BEAUTIFUL city skylines`);
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);
    console.log(`📁 Clean city images saved to: /public/images/og/clean-cities/`);
    console.log(`✨ Perfect attractive cityscape backgrounds!`);

    // Show successful generations
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('\n📋 Generated Clean City Images:');
      successful.forEach(result => {
        console.log(`   ✨ ${result.filename}`);
      });
    }

    if (generatedCount === sortedPrompts.length) {
      console.log('\n🏆 Perfect! All clean city skylines generated successfully!');
    }

  } catch (error) {
    console.error('❌ Generation process failed:', error.message);
    process.exit(1);
  }
}

// Run the generation process
generateAllCities().catch(console.error);