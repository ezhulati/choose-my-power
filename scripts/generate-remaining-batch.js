#!/usr/bin/env node

/**
 * Generate Remaining Strategic Images
 * Continues from where the batch left off
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.IDEOGRAM_API_KEY?.trim();
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

console.log('🎯 CONTINUING STRATEGIC BATCH GENERATION\n');

// Continue from where we left off
const remainingImages = [
  {
    name: 'Fixed + 12-Month Combo',
    prompt: 'Stable electrical grid with annual planning cycles, reliable year-long energy infrastructure, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '250 pages',
    cacheKey: 'combo_fixed-12month_all'
  },
  {
    name: 'Green + Dallas City Combo',
    prompt: 'Dallas renewable energy infrastructure with wind and solar integration, metropolitan green energy hub, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '150 pages',
    cacheKey: 'combo_green-dallas_all'
  },
  {
    name: 'Green + Houston City Combo',
    prompt: 'Houston industrial renewable energy transition, port city with green infrastructure integration, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '150 pages',
    cacheKey: 'combo_green-houston_all'
  },
  {
    name: 'Summer Peak Energy',
    prompt: 'High-demand summer energy infrastructure with cooling systems, peak load management, hot weather energy grid, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '400 pages',
    cacheKey: 'seasonal_summer_peak'
  },
  {
    name: 'Winter Energy Demand',
    prompt: 'Winter energy infrastructure with heating systems, cold weather power grid reliability, seasonal demand management, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '300 pages',
    cacheKey: 'seasonal_winter_demand'
  },
  {
    name: 'Energy Savings Plans',
    prompt: 'Efficient energy infrastructure with conservation elements, smart grid technology, energy optimization systems, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '500 pages',
    cacheKey: 'specialty_savings_all'
  },
  {
    name: 'Business Energy Solutions',
    prompt: 'Commercial energy infrastructure with industrial facilities, business district power systems, commercial energy grid, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '300 pages',
    cacheKey: 'specialty_business_all'
  },
  {
    name: 'Smart Home Energy',
    prompt: 'Residential smart energy systems with home automation, modern household energy management, connected home infrastructure, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '200 pages',
    cacheKey: 'specialty_smart-home_all'
  },
  {
    name: 'Low Rate Finder',
    prompt: 'Cost-effective energy infrastructure with budget optimization elements, affordable power grid access, economical energy systems, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '600 pages',
    cacheKey: 'specialty_low-rate_all'
  },
  {
    name: 'Plan Comparison Tool',
    prompt: 'Multi-option energy infrastructure comparison, side-by-side power systems, decision-making energy landscape, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS',
    pages: '400 pages',
    cacheKey: 'tool_comparison_all'
  }
];

async function generateRemainingBatch() {
  console.log(`🔑 Using API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  
  let totalCost = 0;
  let successCount = 0;
  const results = [];

  for (let i = 0; i < remainingImages.length; i++) {
    const image = remainingImages[i];
    console.log(`⚡ [${i + 1}/${remainingImages.length}] ${image.name}`);
    console.log(`📄 Covers: ${image.pages}`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: image.prompt,
          rendering_speed: 'TURBO',
          style_type: 'AUTO',
          aspect_ratio: '16x9'
        })
      });

      if (!response.ok) {
        console.log(`❌ Failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      console.log(`✅ SUCCESS! ${result.data[0].url}`);
      
      results.push({
        name: image.name,
        url: result.data[0].url,
        cacheKey: image.cacheKey,
        pages: image.pages
      });
      
      totalCost += 0.10;
      successCount++;
      
      // Quick pause between requests
      if (i < remainingImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n🎊 REMAINING BATCH COMPLETE!');
  console.log(`✅ Generated: ${successCount}/${remainingImages.length} images`);
  console.log(`💰 Batch cost: $${totalCost.toFixed(2)}`);
  console.log(`📄 Additional coverage: ~3,250 pages`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name} - ${result.url}`);
  });
}

if (!API_KEY || API_KEY.includes('YOUR_ACTUAL_API_KEY')) {
  console.log('❌ API key not configured');
  process.exit(1);
}

generateRemainingBatch().catch(console.error);