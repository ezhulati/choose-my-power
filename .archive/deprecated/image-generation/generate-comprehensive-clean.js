#!/usr/bin/env node

/**
 * Comprehensive Clean Image Generation - 16:9 Format
 * Beautiful, clean, realistic images for ALL ChooseMyPower.org pages
 * Current 2025 imagery - no futuristic elements, no industrial mess
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
const outputDir = path.join(projectRoot, 'public/images/og/comprehensive-clean');

dotenv.config();

// Configure fal with API key
const FAL_KEY = process.env.FAL_KEY?.trim();
fal.config({
  credentials: FAL_KEY
});

// Comprehensive clean image prompts for ALL pages
const comprehensivePrompts = [
  // CORE HOMEPAGE & STATE
  {
    filename: 'homepage_hero_clean_16x9.png',
    prompt: 'Beautiful professional photograph of clean modern Texas landscape with rolling hills under bright blue sky in 2025. Peaceful rural Texas scenery, green fields, clear atmosphere, no power lines or industrial elements. Natural beauty representing Texas energy choice.',
    context: 'Main homepage hero',
    priority: 1
  },
  {
    filename: 'texas_state_overview_16x9.png', 
    prompt: 'Beautiful aerial photograph of Texas landscape in 2025 showing vast open plains, rolling hills, and clear blue skies. Clean natural Texas scenery representing the state, no industrial elements, peaceful and attractive.',
    context: 'Texas state overview pages',
    priority: 1
  },

  // REGIONAL LANDSCAPES (Clean Natural Beauty)
  {
    filename: 'north_texas_region_16x9.png',
    prompt: 'Beautiful photograph of North Texas landscape in 2025 with rolling plains and clear blue sky. Clean natural scenery around Dallas-Fort Worth area, peaceful rural landscape, no industrial elements.',
    context: 'North Texas regional pages',
    priority: 1
  },
  {
    filename: 'east_texas_region_16x9.png',
    prompt: 'Beautiful photograph of East Texas landscape in 2025 showing forests, green hills, and clear skies. Natural piney woods scenery, peaceful and clean, no industrial elements.',
    context: 'East Texas regional pages',
    priority: 1
  },
  {
    filename: 'central_texas_region_16x9.png',
    prompt: 'Beautiful photograph of Central Texas hill country in 2025 with rolling hills, oak trees, and blue skies. Clean natural Texas hill country scenery around Austin area, peaceful landscape.',
    context: 'Central Texas regional pages',
    priority: 1
  },
  {
    filename: 'south_texas_region_16x9.png',
    prompt: 'Beautiful photograph of South Texas landscape in 2025 with open plains, clear skies, and natural scenery. Clean rural South Texas, peaceful and attractive, no industrial elements.',
    context: 'South Texas regional pages',
    priority: 1
  },
  {
    filename: 'west_texas_region_16x9.png',
    prompt: 'Beautiful photograph of West Texas landscape in 2025 with wide open plains, big sky, and distant mountains. Clean desert and plains scenery, peaceful and vast, natural beauty.',
    context: 'West Texas regional pages',
    priority: 1
  },
  {
    filename: 'gulf_coast_region_16x9.png',
    prompt: 'Beautiful photograph of Texas Gulf Coast in 2025 with clean beaches, blue ocean water, and clear skies. Peaceful coastal scenery, natural beauty, no industrial elements.',
    context: 'Gulf Coast regional pages',
    priority: 1
  },

  // PLAN TYPE VISUALIZATIONS (Clean & Modern)
  {
    filename: 'fixed_rate_concept_16x9.png',
    prompt: 'Beautiful modern graphic design representing stability and consistency in 2025. Clean geometric patterns, steady lines, professional blue and white color scheme, minimalist design representing fixed rates.',
    context: 'Fixed rate plan pages',
    priority: 2
  },
  {
    filename: 'variable_rate_concept_16x9.png',
    prompt: 'Beautiful modern graphic design representing flexibility and adaptability in 2025. Clean flowing curves, dynamic but smooth patterns, professional green and blue colors, minimalist design representing variable rates.',
    context: 'Variable rate plan pages',
    priority: 2
  },
  {
    filename: '12_month_plans_16x9.png',
    prompt: 'Beautiful modern graphic design representing annual planning in 2025. Clean calendar-inspired design with 12 elegant sections, professional colors, minimalist style representing 12-month commitments.',
    context: '12-month plan pages',
    priority: 2
  },
  {
    filename: '24_month_plans_16x9.png',
    prompt: 'Beautiful modern graphic design representing long-term planning in 2025. Clean timeline design with elegant progression, professional colors, minimalist style representing 24-month commitments.',
    context: '24-month plan pages',
    priority: 2
  },
  {
    filename: 'month_to_month_plans_16x9.png',
    prompt: 'Beautiful modern graphic design representing flexibility in 2025. Clean, flowing design with smooth transitions, professional colors, minimalist style representing month-to-month plans.',
    context: 'Month-to-month plan pages',
    priority: 2
  },

  // GREEN ENERGY (Clean & Natural)
  {
    filename: 'renewable_energy_clean_16x9.png',
    prompt: 'Beautiful photograph of clean modern wind turbines in Texas landscape in 2025. Elegant white wind turbines against clear blue sky and green fields, peaceful and clean renewable energy scene.',
    context: 'Green energy plan pages',
    priority: 2
  },
  {
    filename: 'solar_energy_clean_16x9.png',
    prompt: 'Beautiful photograph of clean modern solar panel installation in Texas in 2025. Sleek solar panels on residential rooftops with blue sky, clean and attractive renewable energy, no industrial mess.',
    context: 'Solar energy plan pages',
    priority: 2
  },
  {
    filename: '100_percent_renewable_16x9.png',
    prompt: 'Beautiful photograph combining wind turbines and solar panels in clean Texas landscape in 2025. Harmonious renewable energy scene with clear skies, green fields, peaceful and attractive.',
    context: '100% renewable plan pages',
    priority: 2
  },

  // SEASONAL THEMES (Natural Beauty)
  {
    filename: 'summer_comfort_16x9.png',
    prompt: 'Beautiful photograph of comfortable Texas home in summer 2025 with clean landscaping, blue sky, and peaceful setting. Modern home with nice architecture, no visible power lines or industrial elements.',
    context: 'Summer energy usage pages',
    priority: 3
  },
  {
    filename: 'winter_warmth_16x9.png',
    prompt: 'Beautiful photograph of cozy Texas home in winter 2025 with clean landscaping and clear sky. Comfortable residential setting, warm lighting, no visible power lines or industrial elements.',
    context: 'Winter energy usage pages', 
    priority: 3
  },
  {
    filename: 'spring_renewal_16x9.png',
    prompt: 'Beautiful photograph of Texas landscape in spring 2025 with blooming wildflowers, green grass, and clear blue sky. Natural spring beauty, peaceful and clean, no industrial elements.',
    context: 'Spring energy season pages',
    priority: 3
  },
  {
    filename: 'fall_efficiency_16x9.png',
    prompt: 'Beautiful photograph of Texas landscape in fall 2025 with autumn colors, clear sky, and peaceful scenery. Natural fall beauty, clean and attractive, no industrial elements.',
    context: 'Fall energy season pages',
    priority: 3
  },

  // BUSINESS & SPECIALTY (Professional & Clean)
  {
    filename: 'business_district_clean_16x9.png',
    prompt: 'Beautiful photograph of modern Texas business district in 2025 with clean office buildings, professional architecture, and clear sky. Attractive commercial area, no power lines or industrial mess.',
    context: 'Business electricity plan pages',
    priority: 3
  },
  {
    filename: 'residential_neighborhood_16x9.png',
    prompt: 'Beautiful photograph of clean modern Texas residential neighborhood in 2025 with nice homes, landscaping, and clear sky. Attractive suburban setting, peaceful and clean, no visible power infrastructure.',
    context: 'Residential plan pages',
    priority: 2
  },
  {
    filename: 'small_business_16x9.png',
    prompt: 'Beautiful photograph of attractive small business storefront in Texas in 2025 with clean modern architecture and clear sky. Professional appearance, no visible power lines or industrial elements.',
    context: 'Small business plan pages',
    priority: 3
  },

  // COMPARISON & TOOLS (Modern Graphics)
  {
    filename: 'plan_comparison_16x9.png',
    prompt: 'Beautiful modern graphic design for comparing electricity plans in 2025. Clean side-by-side layout with professional colors, elegant typography, minimalist comparison chart design.',
    context: 'Plan comparison pages',
    priority: 2
  },
  {
    filename: 'rate_calculator_16x9.png',
    prompt: 'Beautiful modern graphic design representing energy calculations in 2025. Clean mathematical elements, professional blue and green colors, elegant calculator interface design, minimalist style.',
    context: 'Rate calculator pages',
    priority: 3
  },
  {
    filename: 'savings_concept_16x9.png',
    prompt: 'Beautiful modern graphic design representing savings and value in 2025. Clean upward trending elements, professional green colors, elegant financial graphics, minimalist design style.',
    context: 'Savings and value pages',
    priority: 3
  },

  // SPECIALTY SERVICES (Clean Concepts)
  {
    filename: 'prepaid_electricity_16x9.png',
    prompt: 'Beautiful modern graphic design representing prepaid electricity in 2025. Clean payment-related graphics, professional blue and white colors, elegant financial design, minimalist style.',
    context: 'Prepaid electricity pages',
    priority: 3
  },
  {
    filename: 'no_deposit_plans_16x9.png',
    prompt: 'Beautiful modern graphic design representing no deposit plans in 2025. Clean, barrier-free design elements, professional colors, elegant simplicity, minimalist style representing easy access.',
    context: 'No deposit plan pages',
    priority: 3
  },
  {
    filename: 'smart_meter_16x9.png',
    prompt: 'Beautiful photograph of modern smart home in Texas in 2025 with clean architecture and technology integration. Sleek home design with clear sky, no visible power lines, attractive residential setting.',
    context: 'Smart meter pages',
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
 * Generate single clean image with FLUX in 16:9 format
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
  
  console.log(`✨ Generating: ${filename}`);
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
        console.log(`\n✅ Generated: ${filename} (${Math.round(downloadResult.size / 1024)}KB) - CLEAN 16:9`);
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
 * Main comprehensive clean image generation
 */
async function generateAllImages() {
  console.log('✨ Comprehensive Clean Images - 16:9 Generation');
  console.log('===============================================');

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}`);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Sort by priority
    const sortedPrompts = [...comprehensivePrompts].sort((a, b) => a.priority - b.priority);
    
    console.log(`✨ Generating ${sortedPrompts.length} COMPREHENSIVE clean images in TRUE 16:9`);
    console.log(`🌟 Beautiful, realistic imagery for ALL ChooseMyPower.org pages`);
    console.log(`🚫 No futuristic elements, no industrial mess, no power lines`);
    console.log(`💰 Estimated cost: $${(sortedPrompts.length * 0.003).toFixed(3)} (${sortedPrompts.length} × $0.003)\n`);

    let generatedCount = 0;
    let totalCost = 0;
    const results = [];

    // Process images one by one
    for (let i = 0; i < sortedPrompts.length; i++) {
      const promptData = sortedPrompts[i];
      
      console.log(`\n✨ Processing ${i + 1}/${sortedPrompts.length} (Priority ${promptData.priority})`);
      
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
    console.log('\n🎉 Comprehensive Clean Generation Complete!');
    console.log('==========================================');
    console.log(`✅ Successfully generated: ${generatedCount}/${sortedPrompts.length} BEAUTIFUL images`);
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);
    console.log(`📁 Clean images saved to: /public/images/og/comprehensive-clean/`);
    console.log(`🌟 Complete coverage for ALL ChooseMyPower.org pages!`);

    // Show successful generations by category
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('\n📋 Generated Clean Images by Category:');
      
      const priority1 = successful.filter(r => comprehensivePrompts.find(p => p.filename === r.filename)?.priority === 1);
      const priority2 = successful.filter(r => comprehensivePrompts.find(p => p.filename === r.filename)?.priority === 2);
      const priority3 = successful.filter(r => comprehensivePrompts.find(p => p.filename === r.filename)?.priority === 3);
      
      if (priority1.length > 0) {
        console.log('\n🏆 Core Pages (Priority 1):');
        priority1.forEach(result => console.log(`   ✨ ${result.filename}`));
      }
      
      if (priority2.length > 0) {
        console.log('\n🎯 Main Features (Priority 2):');
        priority2.forEach(result => console.log(`   ✨ ${result.filename}`));
      }
      
      if (priority3.length > 0) {
        console.log('\n⭐ Specialty Pages (Priority 3):');
        priority3.forEach(result => console.log(`   ✨ ${result.filename}`));
      }
    }

    console.log('\n🚀 Ready to update hero-image-mapper.ts with comprehensive clean images!');

    if (generatedCount === sortedPrompts.length) {
      console.log('\n🏆 PERFECT! Complete comprehensive clean image library generated!');
    }

  } catch (error) {
    console.error('❌ Generation process failed:', error.message);
    process.exit(1);
  }
}

// Run the generation process
generateAllImages().catch(console.error);