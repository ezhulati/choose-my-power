#!/usr/bin/env node

/**
 * nano-banana Image Enhancement Script
 * Enhances existing fal.ai generated images using nano-banana model
 * Processes all images in /public/images/og/ and creates enhanced versions
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
const imagesDir = path.join(projectRoot, 'public/images/og');

dotenv.config();

// Configure fal with API key
const FAL_KEY = process.env.FAL_KEY?.trim();
fal.config({
  credentials: FAL_KEY
});

// nano-banana enhancement configurations for different image types
const enhancementPrompts = {
  // Cities
  'dallas-city-main': 'enhance the dynamic Dallas cityscape with improved lighting and sharper architectural details',
  'houston-city-main': 'enhance the Houston energy capital skyline with better contrast and refined industrial elements',
  'austin-city-main': 'enhance the Austin tech hub atmosphere with improved clarity and vibrant colors',

  // Geographic Tiers
  'tier1-north_cities': 'enhance the North Texas regional imagery with crisp details and professional lighting',
  'tier1-coast_cities': 'enhance the Texas coastal energy infrastructure with better definition and clarity',
  'tier1-central_cities': 'enhance the Central Texas landscape with improved color saturation and sharpness',
  'tier1-south_cities': 'enhance the South Texas energy grid with refined details and professional finish',

  // Filter Categories
  'green-energy-filter': 'enhance the green energy imagery with vibrant natural colors and crisp renewable energy elements',
  'fixed-rate-filter': 'enhance the stable rate concept with improved clarity and professional financial imagery',
  'filter_12month_all': 'enhance the annual planning theme with sharper details and refined temporal elements',
  'filter_variable-rate_all': 'enhance the dynamic rate imagery with better contrast and clearer visual elements',

  // Core Pages
  'homepage_texas_grid': 'enhance the main Texas electricity grid with improved lighting, sharper transmission lines, and vibrant sky',
  'state-texas-overview': 'enhance the comprehensive Texas energy overview with better detail definition and professional clarity',
  'global_comparison_all': 'enhance the comparison visualization with sharper charts, better contrast, and refined data elements',

  // Seasonal
  'seasonal_summer_cooling': 'enhance the summer energy theme with vibrant cooling imagery and crisp air conditioning elements',
  'seasonal_winter_heating': 'enhance the winter heating focus with warmer tones and refined heating system details',

  // Default enhancement for unspecified images
  'default': 'enhance details, improve lighting, sharpen clarity, professional finish, vibrant colors, crisp resolution'
};

/**
 * Get enhancement prompt for specific image
 */
function getEnhancementPrompt(filename) {
  const baseName = path.basename(filename, '.png').replace('.jpg', '');
  
  // Check for exact matches first
  if (enhancementPrompts[baseName]) {
    return enhancementPrompts[baseName];
  }
  
  // Check for partial matches
  for (const [key, prompt] of Object.entries(enhancementPrompts)) {
    if (baseName.includes(key) || key.includes(baseName)) {
      return prompt;
    }
  }
  
  return enhancementPrompts.default;
}

/**
 * Download enhanced image to local file system
 */
async function downloadEnhancedImage(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, imageBuffer);
    
    return true;
  } catch (error) {
    console.error(`❌ Download failed for ${outputPath}:`, error.message);
    return false;
  }
}

/**
 * Enhance single image with nano-banana
 */
async function enhanceImage(imagePath, outputPath) {
  const filename = path.basename(imagePath);
  const enhancementPrompt = getEnhancementPrompt(filename);
  
  console.log(`🍌 Enhancing: ${filename}`);
  console.log(`   Prompt: ${enhancementPrompt.substring(0, 80)}...`);
  
  try {
    // Convert local file path to public URL
    const publicUrl = `http://localhost:4325/images/og/${filename}`;
    
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        image_urls: [publicUrl],
        prompt: enhancementPrompt,
        num_inference_steps: 4,
        strength: 0.65, // Moderate enhancement to preserve original character
        guidance_scale: 2.5,
        seed: Math.floor(Math.random() * 1000000),
        sync_mode: true
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          process.stdout.write('.');
        }
      }
    });

    if (result?.data?.images?.[0]) {
      const enhancedImageUrl = result.data.images[0].url;
      
      // Download enhanced image
      const downloadSuccess = await downloadEnhancedImage(enhancedImageUrl, outputPath);
      
      if (downloadSuccess) {
        const stats = await fs.stat(outputPath);
        console.log(`\n✅ Enhanced: ${filename} (${Math.round(stats.size / 1024)}KB)`);
        return true;
      }
    }

    console.log(`\n❌ Failed to enhance: ${filename}`);
    return false;

  } catch (error) {
    console.error(`\n❌ Enhancement error for ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main enhancement process
 */
async function enhanceAllImages() {
  console.log('🍌 nano-banana Image Enhancement Pipeline');
  console.log('==========================================');

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}`);

  try {
    // Ensure images directory exists
    await fs.access(imagesDir);
    
    // Read all PNG files in the images directory
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png') && !file.includes('_enhanced')
    );

    if (imageFiles.length === 0) {
      console.log('❌ No PNG images found in /public/images/og/');
      process.exit(1);
    }

    console.log(`📸 Found ${imageFiles.length} images to enhance`);
    console.log(`💰 Estimated cost: $${(imageFiles.length * 0.01).toFixed(2)} (${imageFiles.length} × $0.01)\n`);

    // Create enhanced directory if it doesn't exist
    const enhancedDir = path.join(imagesDir, 'enhanced');
    await fs.mkdir(enhancedDir, { recursive: true });

    let enhancedCount = 0;
    let totalCost = 0;

    // Process images in smaller batches for nano-banana
    const batchSize = 2;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      
      console.log(`\n🎨 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);
      
      const batchPromises = batch.map(async (filename) => {
        const inputPath = path.join(imagesDir, filename);
        const outputPath = path.join(enhancedDir, filename.replace('.png', '_enhanced.png'));
        
        const success = await enhanceImage(inputPath, outputPath);
        if (success) {
          enhancedCount++;
          totalCost += 0.01; // nano-banana cost per image
        }
        return success;
      });

      await Promise.allSettled(batchPromises);
      
      // Rate limiting delay between batches
      if (i + batchSize < imageFiles.length) {
        console.log('\n⏳ Cooling down between batches...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Final report
    console.log('\n🎉 nano-banana Enhancement Complete!');
    console.log('=====================================');
    console.log(`✅ Successfully enhanced: ${enhancedCount}/${imageFiles.length} images`);
    console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);
    console.log(`📁 Enhanced images saved to: /public/images/og/enhanced/`);
    console.log(`🚀 Enhanced images ready for deployment!`);

    if (enhancedCount === imageFiles.length) {
      console.log('\n🏆 Perfect! All images enhanced successfully');
    } else {
      console.log(`\n⚠️  ${imageFiles.length - enhancedCount} images failed enhancement`);
    }

  } catch (error) {
    console.error('❌ Enhancement process failed:', error.message);
    process.exit(1);
  }
}

// Run the enhancement process
enhanceAllImages().catch(console.error);