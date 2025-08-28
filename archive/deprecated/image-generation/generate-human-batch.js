#!/usr/bin/env node

/**
 * Human-Centered Image Generation Script
 * Generates people-focused, relatable images for Texas electricity site
 * Based on user feedback: "People people people using electricity in real life"
 */

import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';
import fs from 'fs';

dotenv.config();

const FAL_KEY = process.env.FAL_KEY?.trim();

// Configure fal with API key
fal.config({
  credentials: FAL_KEY
});

// HUMAN-CENTERED IMAGE PROMPTS - Deregulated Cities Only
const HUMAN_IMAGES = [
  // HOMEPAGE HEROES
  {
    filename: 'homepage_nighttime_neighborhood_16x9.png',
    prompt: 'Beautiful American suburban Texas neighborhood at night, warm yellow lights glowing in home windows throughout the neighborhood, porch lights illuminated, street lamps lighting driveways and sidewalks, cozy family homes with cars in driveways, peaceful evening atmosphere, blue hour sky, realistic photography, no text, 16:9',
    category: 'homepage'
  },
  
  // DALLAS TX (Oncor - Deregulated) 
  {
    filename: 'dallas_family_patio_evening_16x9.png',
    prompt: 'Happy Hispanic family on Dallas suburban home patio at evening, warm patio lights glowing, children playing while parents relax, modern home with interior lights on, Dallas skyline softly visible in background, comfortable family time, realistic photography, no text, 16:9',
    category: 'city'
  },
  
  // HOUSTON TX (CenterPoint - Deregulated)
  {
    filename: 'houston_summer_cooling_relief_16x9.png',  
    prompt: 'Diverse family staying comfortably cool indoors during Houston summer evening, air conditioning running efficiently, children playing games while parents cook dinner, relief from heat visible through bright sunny windows, modern home interior, realistic photography, no text, 16:9',
    category: 'city'
  },
  
  // FORT WORTH TX (Oncor - Deregulated)
  {
    filename: 'fort_worth_family_dinner_16x9.png',
    prompt: 'Traditional Texas family at Fort Worth home during dinner time, warm dining room lighting, kids doing homework at kitchen table, parents preparing meal, cozy family atmosphere, efficient home lighting, realistic photography, no text, 16:9',
    category: 'city'
  },
  
  // PLANO TX (Oncor - Deregulated)
  {
    filename: 'plano_modern_family_homework_16x9.png',
    prompt: 'Modern diverse family in Plano suburban home, children doing homework at kitchen island with LED lighting, parents nearby with laptops, energy-efficient appliances, comfortable family routine, contemporary home design, realistic photography, no text, 16:9',
    category: 'city'
  },
  
  // LUBBOCK TX (LP&L - Newly Deregulated 2024)
  {
    filename: 'lubbock_families_comparing_plans_16x9.png',
    prompt: 'Lubbock families at community meeting comparing electricity plans for the first time, excitement about new choice in deregulated market, people holding plan comparison sheets, community center setting, realistic photography, no text, 16:9',
    category: 'city'
  },
  
  // ELECTRICITY PLAN TYPES - People Benefiting
  {
    filename: 'fixed_rate_family_budget_security_16x9.png',
    prompt: 'Young couple at kitchen table reviewing stable electricity bills with relief and satisfaction, calculator and budget paperwork spread out, morning coffee, financial planning peace of mind, realistic photography, no text, 16:9',
    category: 'plan_type'
  },
  
  {
    filename: 'green_energy_eco_family_16x9.png',
    prompt: 'Environmentally conscious Texas family with solar panels visible on roof, parents teaching children about renewable energy, bright sunny day, electric car in driveway, pride in sustainable living choices, realistic photography, no text, 16:9',
    category: 'plan_type'
  },
  
  {
    filename: 'twelve_month_new_homeowners_16x9.png',
    prompt: 'First-time homebuyers signing 12-month electricity contract at kitchen table, moving boxes visible in background, real estate agent explaining plan options, life milestone celebration, excitement about home ownership, realistic photography, no text, 16:9',
    category: 'plan_type'
  },
  
  {
    filename: 'variable_rate_smart_monitoring_16x9.png',
    prompt: 'Tech-savvy young professional monitoring real-time electricity usage on smartphone app, modern smart home devices visible, LED lights throughout apartment, conscious energy management, realistic photography, no text, 16:9',
    category: 'plan_type'
  },
  
  {
    filename: 'prepaid_college_convenience_16x9.png',
    prompt: 'College students in Texas apartment managing prepaid electricity account on phone, no monthly bills to worry about, casual dorm-like setting, young adult independence and financial control, realistic photography, no text, 16:9',
    category: 'plan_type'
  },
  
  // LIFE SCENARIOS & SAVINGS
  {
    filename: 'bill_savings_celebration_16x9.png',
    prompt: 'Diverse couple at dining table comparing old expensive electricity bill to new lower bill, expressions of joy and celebration, visible savings difference, successful money management, kitchen setting, realistic photography, no text, 16:9',
    category: 'savings'
  },
  
  {
    filename: 'moving_in_lights_first_time_16x9.png',
    prompt: 'Young Texas family moving into new home, turning on lights and appliances for the first time, excitement about new beginning, moving boxes and furniture, warm welcome feeling, children exploring new rooms, realistic photography, no text, 16:9',
    category: 'transition'
  },
  
  {
    filename: 'summer_ac_comfort_efficiency_16x9.png',
    prompt: 'Texas family escaping summer heat indoors, air conditioning running efficiently, children playing board games while parents relax, cold drinks visible, comfort and relief from outdoor heat, bright sunlight through windows, realistic photography, no text, 16:9',
    category: 'seasonal'
  },
  
  {
    filename: 'work_from_home_efficient_power_16x9.png',
    prompt: 'Professional working efficiently from home office, multiple devices powered including laptop and monitor, good LED task lighting, modern home office setup, work-life balance, comfortable productivity, realistic photography, no text, 16:9',
    category: 'lifestyle'
  }
];

async function generateImage(imageConfig) {
  console.log(`🎨 Generating: ${imageConfig.filename}`);
  console.log(`📝 Category: ${imageConfig.category}`);
  console.log(`📄 Prompt: ${imageConfig.prompt.substring(0, 80)}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/stable-diffusion-v35-large", {
      input: {
        prompt: imageConfig.prompt,
        negative_prompt: 'text, words, letters, numbers, writing, typography, labels, signs, power lines, industrial equipment, commercial buildings, corporate imagery, stock photo aesthetics, artificial lighting, cartoon, anime',
        image_size: 'landscape_16_9',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        sync_mode: true,
        seed: Math.floor(Math.random() * 1000000) // Random seed for variety
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`⏳ Status: ${update.status}`);
        }
      }
    });

    if (result?.data?.images?.[0]) {
      const image = result.data.images[0];
      
      console.log(`✅ Success: ${imageConfig.filename}`);
      console.log(`📸 Image URL: ${image.url}`);
      console.log(`📐 Dimensions: ${image.width}x${image.height}`);
      
      return {
        filename: imageConfig.filename,
        category: imageConfig.category,
        url: image.url,
        dimensions: `${image.width}x${image.height}`,
        contentType: image.content_type,
        seed: result.data.seed,
        success: true
      };
    } else {
      console.log(`❌ Failed: ${imageConfig.filename} - No image data`);
      return { 
        filename: imageConfig.filename, 
        category: imageConfig.category,
        success: false, 
        error: 'No image data' 
      };
    }

  } catch (error) {
    console.error(`❌ Failed: ${imageConfig.filename} - ${error.message || error}`);
    return { 
      filename: imageConfig.filename,
      category: imageConfig.category, 
      success: false, 
      error: error.message || error 
    };
  }
}

async function main() {
  console.log('🚀 Starting Human-Centered Image Generation for Choose My Power');
  console.log('👨‍👩‍👧‍👦 Theme: Real people using electricity, saving money, living their lives');
  console.log('🏘️ Focus: Texas families in deregulated cities only\n');
  console.log(`🔑 Using API key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}\n`);

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ FAL_KEY not configured properly');
    process.exit(1);
  }

  const results = [];
  let currentIndex = 1;

  try {
    // Generate images with proper pacing
    for (const imageConfig of HUMAN_IMAGES) {
      console.log(`\n📦 Processing ${currentIndex}/${HUMAN_IMAGES.length}`);
      
      const result = await generateImage(imageConfig);
      results.push(result);
      
      // Pace requests to avoid rate limiting (2 second delay)
      if (currentIndex < HUMAN_IMAGES.length) {
        console.log('⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      currentIndex++;
    }

    // Generate report
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 HUMAN-CENTERED GENERATION REPORT');
    console.log('─'.repeat(60));
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`💰 Estimated Cost: $${(successful.length * 0.035).toFixed(2)}`);
    console.log(`🕒 Total Time: ${((currentIndex - 1) * 2 / 60).toFixed(1)} minutes`);
    
    if (successful.length > 0) {
      console.log('\n🎉 Successfully Generated Images:');
      successful.forEach(result => {
        console.log(`  📸 ${result.filename} (${result.dimensions}) - ${result.category}`);
      });
      
      console.log('\n📋 BREAKDOWN BY CATEGORY:');
      const byCategory = successful.reduce((acc, result) => {
        acc[result.category] = (acc[result.category] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} images`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Images:');
      failed.forEach(result => {
        console.log(`  ❌ ${result.filename}: ${result.error}`);
      });
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      theme: 'human-centered electricity usage',
      deregulatedCitiesOnly: true,
      totalGenerated: successful.length,
      totalFailed: failed.length,
      estimatedCost: successful.length * 0.035,
      processingTimeMinutes: (currentIndex - 1) * 2 / 60,
      results: results,
      categories: Object.keys(successful.reduce((acc, result) => {
        acc[result.category] = true;
        return acc;
      }, {}))
    };
    
    fs.writeFileSync('human-centered-generation-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to: human-centered-generation-report.json');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Download successful images to public/images/og/human-centered/');
    console.log('2. Update hero-image-mapper.ts with new human-centered paths');  
    console.log('3. Remove non-deregulated city references from codebase');
    console.log('4. Test images on live site');
    console.log('\n✅ Human-centered image generation complete!');
    
  } catch (error) {
    console.error('💥 Generation failed:', error.message || error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
🏠 Human-Centered Image Generator for Choose My Power

Generates authentic, people-focused images showing:
• Texas families using electricity in daily life
• Moving into new homes and turning on lights
• Saving money on electricity bills  
• Comfortable living with efficient energy use
• Only focuses on DEREGULATED Texas cities

Usage:
  node scripts/generate-human-batch.js

Options:
  --help    Show this help message

Generated Images: ${HUMAN_IMAGES.length} total
• Homepage heroes: 1
• City-specific people images: 5 (deregulated cities only)  
• Plan type human images: 5
• Life scenario images: 4

Estimated Cost: $${(HUMAN_IMAGES.length * 0.035).toFixed(2)}
Processing Time: ~${(HUMAN_IMAGES.length * 2 / 60).toFixed(1)} minutes
`);
  process.exit(0);
}

main().catch(console.error);