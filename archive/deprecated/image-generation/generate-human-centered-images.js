#!/usr/bin/env node
/**
 * Human-Centered Image Generation Script
 * Creates realistic, people-focused images for Texas electricity comparison site
 * Focus: Real people using electricity, saving money, living their lives
 */

// Import FAL client - using dynamic import to handle TypeScript
const { falClient } = await import('../src/lib/images/fal-client.ts');
import fs from 'fs/promises';
import path from 'path';

// Human-Centered Image Prompts - Focus on People & Real Life
const HUMAN_CENTERED_PROMPTS = {
  // HOMEPAGE & CORE PAGES
  homepage_evening_neighborhood: {
    prompt: "Beautiful American suburban Texas neighborhood at blue hour twilight, warm yellow lights glowing in home windows, street lights just turning on, driveways and sidewalks visible, cozy family homes with porch lights, cars in driveways, peaceful evening atmosphere, realistic photography style, 16:9 aspect ratio",
    filename: "homepage_evening_neighborhood_16x9.png",
    category: "homepage"
  },
  
  homepage_lights_coming_on: {
    prompt: "Texas suburban neighborhood street view at dusk, multiple homes with warm interior lights turning on in windows, porch lights glowing, street lamps illuminating driveways, blue hour sky, American dream homes, electricity bringing comfort and warmth, realistic photography, 16:9 aspect ratio",
    filename: "homepage_lights_coming_on_16x9.png", 
    category: "homepage"
  },

  // MAJOR TEXAS CITIES - People in Context
  dallas_family_backyard: {
    prompt: "Multi-generational Hispanic family barbecuing in Dallas suburban backyard at twilight, patio lights glowing, modern home with windows lit up, Dallas skyline in soft background, warm family atmosphere, realistic photography, 16:9 aspect ratio",
    filename: "dallas_family_backyard_16x9.png",
    category: "city"
  },

  houston_summer_comfort: {
    prompt: "Diverse family staying cool indoors during Houston summer evening, kids playing while parents relax, air conditioning running efficiently, modern home with warm interior lighting, relief from heat, realistic photography, 16:9 aspect ratio",
    filename: "houston_summer_comfort_16x9.png",
    category: "city"
  },

  lubbock_new_market: {
    prompt: "Lubbock families celebrating having electricity choice for first time, comparing plans at community center meeting, excited about new deregulated market options, realistic photography, 16:9 aspect ratio",
    filename: "lubbock_new_choice_16x9.png",
    category: "city"
  },

  fort_worth_family_evening: {
    prompt: "Traditional Texas family in Fort Worth home at dinner time, warm dining room lighting, kids doing homework under task lighting, cozy family atmosphere, efficient electricity use, realistic photography, 16:9 aspect ratio",
    filename: "fort_worth_family_evening_16x9.png",
    category: "city"
  },

  plano_modern_family: {
    prompt: "Modern diverse family in Plano suburban home at evening, children doing homework at kitchen island, warm LED lighting, energy-efficient appliances, comfortable family routine, realistic photography, 16:9 aspect ratio",
    filename: "plano_modern_family_16x9.png",
    category: "city"
  },

  arlington_sports_family: {
    prompt: "Texas family in Arlington watching evening sports on TV, comfortable living room with efficient lighting, stadium lights visible through window, home team pride, realistic photography, 16:9 aspect ratio",  
    filename: "arlington_sports_family_16x9.png",
    category: "city"
  },

  // ELECTRICITY PLAN TYPES - People Benefiting
  fixed_rate_security: {
    prompt: "Young couple reviewing predictable electricity bills with relief and satisfaction, calculator and paperwork on kitchen table, morning coffee, budget planning, financial security, realistic photography, 16:9 aspect ratio",
    filename: "fixed_rate_budget_security_16x9.png",
    category: "plan_type"
  },

  green_energy_family: {
    prompt: "Eco-conscious Texas family with solar panels visible on roof, parents teaching children about renewable energy, bright sunny day, sustainable living, pride in environmental choice, realistic photography, 16:9 aspect ratio",
    filename: "green_energy_family_education_16x9.png", 
    category: "plan_type"
  },

  twelve_month_planning: {
    prompt: "First-time homebuyers signing 12-month electricity contract at kitchen table, real estate agent explaining options, moving boxes in background, life milestone moment, realistic photography, 16:9 aspect ratio",
    filename: "twelve_month_planning_16x9.png",
    category: "plan_type"
  },

  variable_rate_monitoring: {
    prompt: "Tech-savvy person monitoring real-time electricity usage on smartphone app, smart home devices visible, modern efficient appliances, conscious energy management, realistic photography, 16:9 aspect ratio",
    filename: "variable_rate_smart_monitoring_16x9.png",
    category: "plan_type"
  },

  prepaid_convenience: {
    prompt: "College students in Texas apartment managing prepaid electricity account on phone, no bills to worry about, casual dorm-like setting, young adult independence, realistic photography, 16:9 aspect ratio",
    filename: "prepaid_student_convenience_16x9.png",
    category: "plan_type"
  },

  // SEASONAL & USAGE SCENARIOS
  summer_cooling_relief: {
    prompt: "Texas family escaping summer heat indoors, children playing comfortably, AC running efficiently, cold drinks, relief from outside heat visible through bright windows, realistic photography, 16:9 aspect ratio",
    filename: "summer_cooling_family_relief_16x9.png",
    category: "seasonal"
  },

  winter_warmth_comfort: {
    prompt: "Texas family cozy around fireplace on rare cold evening, warm interior lighting, blankets and hot drinks, efficient heating, comfortable home atmosphere, realistic photography, 16:9 aspect ratio",
    filename: "winter_warmth_comfort_16x9.png", 
    category: "seasonal"
  },

  // SAVINGS & BILL SCENARIOS
  bill_comparison_joy: {
    prompt: "Diverse couple comparing old expensive electricity bill to new lower bill, expressions of joy and relief, savings visible, kitchen table with paperwork, successful money management, realistic photography, 16:9 aspect ratio",
    filename: "bill_savings_comparison_16x9.png",
    category: "savings"
  },

  smart_home_efficiency: {
    prompt: "Modern Texas family using smart home app to optimize electricity usage, teenagers learning about efficiency, LED bulbs throughout home, technology helping save money, realistic photography, 16:9 aspect ratio",
    filename: "smart_home_family_efficiency_16x9.png",
    category: "smart"
  },

  // BUSINESS & HIGH USAGE
  small_business_owner: {
    prompt: "Texas small business owner reviewing electricity costs for restaurant, efficient LED lighting in background, evening dinner service, managing operational costs, entrepreneurial spirit, realistic photography, 16:9 aspect ratio", 
    filename: "small_business_electricity_16x9.png",
    category: "business"
  },

  // MOVING & LIFE TRANSITIONS  
  apartment_move_in: {
    prompt: "Young Texas residents moving into first apartment, turning on lights and appliances for first time, excitement about independence, moving boxes, starting new chapter, realistic photography, 16:9 aspect ratio",
    filename: "apartment_move_in_16x9.png",
    category: "transition"
  }
};

// Generate image using FAL API
async function generateImage(imageConfig) {
  try {
    console.log(`🎨 Generating: ${imageConfig.filename}`);
    console.log(`📝 Prompt: ${imageConfig.prompt}`);
    
    const result = await falClient.generateImage({
      prompt: imageConfig.prompt,
      image_size: "landscape_16_9",
      num_images: 1,
      guidance_scale: 7,
      num_inference_steps: 50
    });

    if (result.success && result.images?.[0]?.url) {
      // Download and save image
      const response = await fetch(result.images[0].url);
      const imageBuffer = await response.arrayBuffer();
      
      // Create directory structure
      const outputDir = path.join(process.cwd(), 'public', 'images', 'og', 'human-centered');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, imageConfig.filename);
      await fs.writeFile(outputPath, Buffer.from(imageBuffer));
      
      console.log(`✅ Saved: ${outputPath}`);
      return { success: true, path: outputPath };
    } else {
      console.error(`❌ Failed to generate: ${imageConfig.filename}`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error generating ${imageConfig.filename}:`, error);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Human-Centered Image Generation');
  console.log('Focus: Real people using electricity, saving money, living their lives\n');
  
  const results = [];
  const imageConfigs = Object.values(HUMAN_CENTERED_PROMPTS);
  
  // Generate images in batches to avoid API rate limits
  const batchSize = 3;
  for (let i = 0; i < imageConfigs.length; i += batchSize) {
    const batch = imageConfigs.slice(i, i + batchSize);
    
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageConfigs.length/batchSize)}`);
    
    const batchPromises = batch.map(config => generateImage(config));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Wait between batches
    if (i + batchSize < imageConfigs.length) {
      console.log('⏳ Waiting 10 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`\n📊 Generation Complete:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed images:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.error}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Update hero-image-mapper.ts with new human-centered image paths');
  console.log('2. Test images on different page types');
  console.log('3. Generate additional images as needed');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}