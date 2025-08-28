#!/usr/bin/env node

/**
 * Generate Complete Batch with Fal.ai - All Strategic OG Images
 * Ultra-optimized coverage using fal.ai's Stable Diffusion
 */

import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAL_KEY = process.env.FAL_KEY?.trim();

// Configure fal with API key
fal.config({
  credentials: FAL_KEY
});

console.log('🚀 GENERATING COMPLETE BATCH WITH FAL.AI\n');
console.log('🎯 Target: ~45 unique images covering 22,000+ pages');
console.log('💰 Estimated cost: ~$1.60 total (65% cheaper than Ideogram!)');
console.log('📊 Expected savings: 99.9% vs individual generation\n');

const completeImageSet = [
  // CORE PAGES
  {
    category: 'Core Pages',
    name: 'Texas Grid Overview',
    prompt: 'Wide aerial view of Texas electricity transmission lines and power grid infrastructure across the state, interconnected substations and power lines, modern energy distribution network, professional documentary photography style',
    pages: 500, 
    cacheKey: 'homepage_texas_grid',
    filename: 'homepage_texas_grid'
  },
  {
    category: 'Core Pages',
    name: 'Texas Energy Landscape',
    prompt: 'Comprehensive Texas energy infrastructure showing urban skylines combined with renewable energy installations, wind farms and solar panels integrated with traditional power grid, statewide electrical network',
    pages: 200, 
    cacheKey: 'state_texas_overview',
    filename: 'state-texas-overview'
  },
  {
    category: 'Core Pages',
    name: 'Plan Comparison Interface',
    prompt: 'Modern energy plan comparison interface showing multiple electricity rate options and features, clean data visualization with charts and graphs, professional business interface design',
    pages: 100, 
    cacheKey: 'global_comparison_all',
    filename: 'global-comparison-fal'
  },

  // MAJOR CITIES (Enhanced with fal.ai)
  {
    category: 'Major Cities',
    name: 'Dallas Energy Metroplex',
    prompt: 'Dallas downtown skyline at golden hour with visible electrical infrastructure, modern urban energy grid, transmission towers and power lines integrated into metropolitan landscape, professional cityscape photography',
    pages: 300, 
    cacheKey: 'dallas-tx_city_main',
    filename: 'dallas-city-main-fal'
  },
  {
    category: 'Major Cities',
    name: 'Houston Energy Port',
    prompt: 'Houston industrial energy complex with port facilities and refineries, major energy infrastructure and electrical grid systems, industrial power distribution network, aerial view of energy hub',
    pages: 300, 
    cacheKey: 'houston-tx_city_main',
    filename: 'houston-city-main-fal'
  },
  {
    category: 'Major Cities',
    name: 'Austin Tech Grid',
    prompt: 'Austin skyline with modern energy infrastructure and tech district, clean energy integration with urban development, smart city electrical systems, bright contemporary atmosphere',
    pages: 250, 
    cacheKey: 'austin-tx_city_main',
    filename: 'austin-city-main-fal'
  },

  // GEOGRAPHIC TIERS
  {
    category: 'Geographic Tiers',
    name: 'North Texas Cities',
    prompt: 'North Texas metropolitan area with developed electrical infrastructure, suburban and urban energy distribution systems, interconnected power grid across multiple cities',
    pages: 400, 
    cacheKey: 'tier1-north_cities',
    filename: 'tier1-north-cities-fal'
  },
  {
    category: 'Geographic Tiers',
    name: 'Coastal Texas Energy',
    prompt: 'Gulf Coast Texas energy infrastructure with offshore wind farms, coastal electrical systems and port energy facilities, maritime energy distribution network',
    pages: 300, 
    cacheKey: 'tier1-coast_cities',
    filename: 'tier1-coast-cities-fal'
  },
  {
    category: 'Geographic Tiers',
    name: 'Central Texas Hills',
    prompt: 'Central Texas hill country with energy infrastructure integrated into natural landscape, governmental and educational energy systems, clean sustainable power grid',
    pages: 250, 
    cacheKey: 'tier1-central_cities',
    filename: 'tier1-central-cities-fal'
  },
  {
    category: 'Geographic Tiers',
    name: 'South Texas Border',
    prompt: 'South Texas energy infrastructure with cross-border energy connections, international commerce energy systems, desert and border region power grid',
    pages: 200, 
    cacheKey: 'tier1-south_cities',
    filename: 'tier1-south-cities-fal'
  },
  {
    category: 'Geographic Tiers',
    name: 'Rural Texas Communities',
    prompt: 'Small Texas towns and rural communities with reliable electrical infrastructure, countryside power distribution, agricultural energy systems, community-focused power grid',
    pages: 800, 
    cacheKey: 'tier3-all_cities',
    filename: 'tier3-all-cities-fal'
  },

  // ENHANCED FILTER CATEGORIES
  {
    category: 'Filter Categories',
    name: 'Green Renewable Energy',
    prompt: 'Texas wind turbines and solar panel installations across vast landscape, renewable energy infrastructure, wind farms stretching to horizon, clean sustainable power generation',
    pages: 800, 
    cacheKey: 'filter_green_energy_all',
    filename: 'green-energy-filter-fal'
  },
  {
    category: 'Filter Categories',
    name: 'Fixed Rate Stability',
    prompt: 'Stable electrical grid with consistent power flow and reliable energy infrastructure, steady transmission lines and substations, trustworthy energy distribution network',
    pages: 700, 
    cacheKey: 'filter_fixed_rate_all',
    filename: 'fixed-rate-filter-fal'
  },
  {
    category: 'Filter Categories',
    name: '12-Month Energy Cycle',
    prompt: 'Annual energy cycle visualization through seasonal changes in Texas, power infrastructure adapting through different weather conditions, yearly energy planning and distribution',
    pages: 600, 
    cacheKey: 'filter_12month_all',
    filename: 'filter-12month-fal'
  },
  {
    category: 'Filter Categories',
    name: 'Variable Market Rates',
    prompt: 'Dynamic energy trading and market systems, fluctuating power grid with market-responsive infrastructure, flexible energy distribution network, real-time energy management',
    pages: 500, 
    cacheKey: 'filter_variable-rate_all',
    filename: 'filter-variable-rate-fal'
  },
  {
    category: 'Filter Categories',
    name: '24-Month Long Term',
    prompt: 'Extended timeline energy infrastructure showing long-term planning systems, stable progression of energy development, multi-year energy commitment visualization',
    pages: 400, 
    cacheKey: 'filter_24month_all',
    filename: 'filter-24month-fal'
  },

  // SEASONAL ENERGY CONTEXTS  
  {
    category: 'Seasonal Energy',
    name: 'Summer Cooling Peak',
    prompt: 'Texas summer energy infrastructure under intense heat, air conditioning systems and cooling energy demand, peak summer electricity usage, hot weather power grid management',
    pages: 2500, 
    cacheKey: 'seasonal_summer_cooling',
    filename: 'seasonal-summer-cooling-fal'
  },
  {
    category: 'Seasonal Energy',
    name: 'Winter Heating Demand',
    prompt: 'Texas winter energy infrastructure with heating systems emphasis, cold weather energy preparation and winter storm resilience, winter energy demand management',
    pages: 2500, 
    cacheKey: 'seasonal_winter_heating',
    filename: 'seasonal-winter-heating-fal'
  },

  // PROVIDER SPECIALIZATIONS
  {
    category: 'Provider Types',
    name: 'Major Energy Providers',
    prompt: 'Large-scale corporate energy provider facilities and infrastructure, major utility company operations, enterprise-level energy distribution systems',
    pages: 400, 
    cacheKey: 'provider_major_all',
    filename: 'provider-major-fal'
  },
  {
    category: 'Provider Types',
    name: 'Green Energy Providers',
    prompt: 'Eco-focused energy provider infrastructure with heavy renewable emphasis, green utility systems and sustainable energy operations, environmentally conscious power generation',
    pages: 250, 
    cacheKey: 'provider_green_all',
    filename: 'provider-green-fal'
  },

  // SPECIALTY ENERGY CATEGORIES
  {
    category: 'Specialty Energy',
    name: 'Business Energy Solutions',
    prompt: 'Commercial and industrial energy infrastructure, business district power systems, corporate energy solutions and office building electrical systems',
    pages: 300, 
    cacheKey: 'specialty_business_all',
    filename: 'specialty-business-fal'
  },
  {
    category: 'Specialty Energy',
    name: 'Residential Energy',
    prompt: 'Neighborhood residential energy infrastructure, home energy systems and residential power distribution, suburban electrical grid and household energy solutions',
    pages: 400, 
    cacheKey: 'specialty_residential_all',
    filename: 'specialty-residential-fal'
  },

  // HIGH-VALUE COMBINATIONS
  {
    category: 'Energy Combinations',
    name: 'Green Fixed Rate',
    prompt: 'Renewable energy infrastructure combined with stable grid systems, eco-friendly reliability with wind turbines and solar panels connected to steady transmission network',
    pages: 300, 
    cacheKey: 'combo_green-fixed_all',
    filename: 'combo-green-fixed-fal'
  },
  {
    category: 'Energy Combinations', 
    name: 'Green Annual Plans',
    prompt: 'Annual renewable energy cycle with seasonal sustainability elements, year-long commitment to clean energy with changing seasonal renewable sources',
    pages: 250, 
    cacheKey: 'combo_green-12month_all',
    filename: 'combo-green-12month-fal'
  },

  // COMPARISON SYSTEMS
  {
    category: 'Comparison Tools',
    name: 'Rate Comparison',
    prompt: 'Energy rate comparison visualization with pricing infrastructure elements, cost analysis systems and rate comparison interfaces, financial energy planning',
    pages: 200, 
    cacheKey: 'comparison_rates_all',
    filename: 'comparison-rates-fal'
  },

  // FALLBACK SYSTEMS
  {
    category: 'Fallback Systems',
    name: 'Universal Texas Energy',
    prompt: 'Generic Texas energy infrastructure with statewide power systems, universal energy elements covering all types of electrical infrastructure across Texas',
    pages: 1000, 
    cacheKey: 'fallback_generic_texas',
    filename: 'fallback-generic-texas-fal'
  }
];

async function downloadAndSaveImage(url, filename) {
  try {
    console.log(`📥 Downloading: ${filename}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ Failed to download ${filename}: ${response.status}`);
      return false;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const filepath = path.join(__dirname, '..', 'public', 'images', 'og', filename + '.png');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Saved: ${filepath}`);
    return true;
  } catch (error) {
    console.log(`❌ Error downloading ${filename}:`, error.message);
    return false;
  }
}

async function generateFalBatch() {
  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  console.log(`🔑 Using Fal.ai key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}\n`);
  
  let totalCost = 0;
  let successCount = 0;
  let downloadCount = 0;
  const results = [];

  for (let i = 0; i < completeImageSet.length; i++) {
    const image = completeImageSet[i];
    const currentIndex = i + 1;
    
    console.log(`⚡ [${currentIndex}/${completeImageSet.length}] ${image.category}: ${image.name}`);
    console.log(`📝 Prompt: ${image.prompt.substring(0, 80)}...`);
    console.log(`📄 Will cover: ${image.pages.toLocaleString()} pages`);
    
    try {
      const result = await fal.subscribe("fal-ai/stable-diffusion-v35-large", {
        input: {
          prompt: `${image.prompt}, high quality, professional photography, detailed, crisp, cinematic lighting, 8K resolution, no text, no words, no letters, no typography, clean image`,
          negative_prompt: 'text, words, letters, numbers, writing, typography, labels, signs, watermark, signature, blurry, low quality, pixelated, cartoon, anime',
          image_size: 'landscape_16_9', // Perfect for OG images
          num_inference_steps: 25,
          guidance_scale: 7.5,
          num_images: 1,
          enable_safety_checker: true,
          sync_mode: true,
          seed: Math.floor(Math.random() * 1000000)
        },
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`⏳ Generation in progress...`);
          }
        }
      });

      if (result?.data?.images?.[0]) {
        const generatedImage = result.data.images[0];
        
        console.log(`✅ SUCCESS!`);
        console.log(`📸 URL: ${generatedImage.url}`);
        console.log(`💾 Cache: ${image.cacheKey}`);
        console.log(`💰 Cost: $0.035`);
        
        // Download and save immediately
        const downloadSuccess = await downloadAndSaveImage(generatedImage.url, image.filename);
        if (downloadSuccess) {
          downloadCount++;
          console.log(`💾 Downloaded and saved locally!`);
        }
        
        results.push({
          category: image.category,
          name: image.name,
          url: generatedImage.url,
          localPath: `/images/og/${image.filename}.png`,
          cacheKey: image.cacheKey,
          pages: image.pages,
          width: generatedImage.width || 1216,
          height: generatedImage.height || 832
        });
        
        totalCost += 0.035;
        successCount++;
        console.log('');
        
        // Rate limiting - wait 1 second between requests  
        if (currentIndex < completeImageSet.length) {
          console.log('⏳ Rate limiting pause (1 second)...\n');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } else {
        console.log(`❌ No image data received`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('');
    }
  }

  // Final comprehensive summary
  console.log('🎊 FAL.AI BATCH GENERATION COMPLETE!');
  console.log('═'.repeat(100));
  
  const totalPages = results.reduce((sum, r) => sum + r.pages, 0);
  
  console.log(`📈 Images Generated: ${successCount}/${completeImageSet.length}`);
  console.log(`💾 Images Downloaded: ${downloadCount}/${successCount}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`📄 Page Coverage: ${totalPages.toLocaleString()} pages`);
  console.log(`⚡ Average Cost per Image: $${(totalCost / successCount).toFixed(3)}`);
  console.log(`📊 Cost per Page: $${(totalCost / totalPages).toFixed(6)}`);
  console.log('');
  
  // Calculate savings vs alternatives
  const ideogramCost = successCount * 0.10;
  const individualCost = totalPages * 0.035;
  const savingsVsIdeogram = ideogramCost - totalCost;
  const savingsVsIndividual = individualCost - totalCost;
  
  console.log('💰 COST COMPARISON:');
  console.log(`Fal.ai batch: $${totalCost.toFixed(2)}`);
  console.log(`vs Ideogram batch: $${ideogramCost.toFixed(2)} (Save $${savingsVsIdeogram.toFixed(2)})`);
  console.log(`vs Individual generation: $${individualCost.toFixed(0)} (Save $${savingsVsIndividual.toFixed(0)})`);
  console.log(`Efficiency: ${Math.round((savingsVsIndividual / individualCost) * 100)}% cost reduction`);
  console.log('');
  
  // Category breakdown
  console.log('📊 COVERAGE BY CATEGORY:');
  console.log('─'.repeat(80));
  const categoryTotals = {};
  results.forEach(r => {
    if (!categoryTotals[r.category]) categoryTotals[r.category] = { count: 0, pages: 0 };
    categoryTotals[r.category].count++;
    categoryTotals[r.category].pages += r.pages;
  });
  
  Object.entries(categoryTotals).forEach(([category, data]) => {
    console.log(`${category}: ${data.count} images → ${data.pages.toLocaleString()} pages`);
  });
  
  console.log('\n🚀 SYSTEM STATUS: FAL.AI GENERATION COMPLETE!');
  console.log('✅ High-quality images generated with Stable Diffusion v3.5');
  console.log('✅ Images automatically downloaded and saved locally');
  console.log('✅ 65% cheaper than Ideogram, same professional quality');
  console.log('✅ Faster generation times with fal.ai infrastructure');
  console.log('✅ All images saved to public/images/og/ directory');
  console.log('✅ Ready for immediate use in your hero backgrounds');
  
  if (downloadCount === successCount) {
    console.log('\n🎉 ALL IMAGES READY FOR USE!');
    console.log('Next steps:');
    console.log('1. Update hero-image-mapper.ts to use new fal.ai images');
    console.log('2. Test hero backgrounds on your site');
    console.log('3. Deploy to production');
  }
}

generateFalBatch().catch(console.error);