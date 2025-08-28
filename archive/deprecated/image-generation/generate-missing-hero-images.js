#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security: Validate API key from environment variables only
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY;

if (!IDEOGRAM_API_KEY) {
  console.error('❌ SECURITY ERROR: IDEOGRAM_API_KEY environment variable is required');
  console.error('Please set your API key:');
  console.error('   export IDEOGRAM_API_KEY="your_actual_api_key_here"');
  console.error('');
  console.error('🔒 For security reasons, API keys must be provided via environment variables.');
  console.error('Never commit API keys to version control.');
  process.exit(1);
}

// Image prompts for different categories
const IMAGE_PROMPTS = {
  'houston-city-main': 'Professional Houston Texas cityscape with oil refineries and modern downtown skyline, energy industry theme, dramatic lighting, suitable for hero background, wide cinematic aspect ratio',
  'state-texas-overview': 'Aerial view of Texas electricity infrastructure with power lines, wind farms, and oil refineries, energy grid visualization, professional business style, wide format',
  'global-comparison': 'Global energy comparison visualization with world map, power grids, and renewable energy symbols, professional business infographic style',
  'tier1-north-cities': 'North Texas cities energy infrastructure, power plants and urban skylines, professional energy industry theme, wide format',
  'tier2-north-cities': 'Secondary north Texas cities with smaller power infrastructure, suburban energy distribution, professional style',
  'tier1-coast-cities': 'Texas coastal cities with offshore energy platforms, refineries, and ports, Gulf Coast energy industry, dramatic sky',
  'tier2-coast-cities': 'Secondary Texas coastal towns with smaller energy infrastructure, coastal refineries, professional style',
  'tier1-central-cities': 'Central Texas energy hub with Austin tech industry, clean energy theme, modern infrastructure, professional style',
  'tier2-central-cities': 'Secondary central Texas cities with distributed energy systems, rural-urban energy mix, professional theme',
  'tier1-south-cities': 'South Texas energy corridor with major refineries, petrochemical plants, and power infrastructure, industrial landscape',
  'tier2-south-cities': 'Secondary south Texas towns with smaller energy facilities, rural energy distribution, professional style',
  'tier3-all-cities': 'Small Texas towns with basic electrical infrastructure, power lines and local distribution, rural energy theme',
  'filter-12month': 'Stable energy contract visualization with 12-month calendar and consistent pricing graphs, professional business style',
  'filter-variable-rate': 'Dynamic energy pricing visualization with fluctuating graphs and market indicators, professional financial style',
  'filter-24month': 'Long-term energy contract with 24-month timeline and stable pricing visualization, professional business theme',
  'filter-prepaid': 'Prepaid energy concept with payment cards, mobile apps, and flexible payment options, modern consumer style',
  'filter-no-deposit': 'No deposit energy service with instant activation, easy signup process, consumer-friendly visualization',
  'filter-time-of-use': 'Time-of-use electricity pricing with day/night usage patterns, smart meter visualization, professional tech style',
  'combo-green-fixed': 'Green energy with fixed rates, renewable sources with stable pricing, eco-friendly professional style',
  'combo-fixed-12month': 'Fixed rate 12-month energy plan with stable pricing and reliability themes, professional business style',
  'combo-green-dallas': 'Dallas green energy with renewable sources and city skyline, eco-friendly urban energy theme',
  'combo-green-houston': 'Houston green energy with renewable infrastructure and cityscape, sustainable energy theme',
  'seasonal-summer-peak': 'Texas summer peak energy demand with hot weather, air conditioning, and high usage visualization',
  'seasonal-winter-demand': 'Texas winter energy demand with heating systems and cold weather energy usage patterns',
  'specialty-savings': 'Energy savings visualization with money symbols, reduced bills, and cost optimization themes',
  'specialty-business': 'Business energy solutions with commercial buildings, industrial facilities, and corporate energy management',
  'specialty-smart-home': 'Smart home energy management with IoT devices, automated systems, and tech-savvy energy control',
  'specialty-low-rate': 'Low rate energy plans with competitive pricing, budget-friendly themes, and cost savings visualization',
  'tool-comparison': 'Energy plan comparison tools with charts, graphs, and decision-making visualization, analytical theme'
};

// Generate image using Ideogram API
async function generateImage(prompt, filename) {
  console.log(`🎨 Generating image: ${filename}`);
  
  try {
    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_request: {
          prompt: prompt,
          aspect_ratio: 'ASPECT_16_10',
          model: 'V_2',
          magic_prompt_option: 'AUTO'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response format from API');
    }

    const imageUrl = data.data[0].url;
    console.log(`✅ Generated image URL: ${imageUrl}`);
    
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const buffer = await imageResponse.buffer();
    const outputPath = path.join(__dirname, '..', 'public', 'images', 'og', `${filename}.png`);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`💾 Saved: ${filename}.png (${buffer.length} bytes)`);
    
    return imageUrl;
    
  } catch (error) {
    console.error(`❌ Failed to generate ${filename}:`, error.message);
    return null;
  }
}

// Main function
async function generateMissingImages() {
  console.log('🚀 Starting hero image generation...');
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'og');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check which images we already have
  const existingFiles = fs.readdirSync(outputDir);
  console.log(`📁 Found ${existingFiles.length} existing images`);

  const imagesToGenerate = [
    { key: 'houston-city-main', filename: 'houston-city-main' },
    { key: 'state-texas-overview', filename: 'state-texas-overview' },
    { key: 'global-comparison', filename: 'global-comparison' },
    { key: 'tier1-north-cities', filename: 'tier1-north-cities' },
    { key: 'tier2-north-cities', filename: 'tier2-north-cities' },
    { key: 'tier1-coast-cities', filename: 'tier1-coast-cities' },
    { key: 'tier2-coast-cities', filename: 'tier2-coast-cities' },
    { key: 'tier1-central-cities', filename: 'tier1-central-cities' },
    { key: 'tier2-central-cities', filename: 'tier2-central-cities' },
    { key: 'tier1-south-cities', filename: 'tier1-south-cities' },
    { key: 'tier2-south-cities', filename: 'tier2-south-cities' },
    { key: 'tier3-all-cities', filename: 'tier3-all-cities' },
    { key: 'filter-12month', filename: 'filter-12month' },
    { key: 'filter-variable-rate', filename: 'filter-variable-rate' },
    { key: 'filter-24month', filename: 'filter-24month' },
    { key: 'filter-prepaid', filename: 'filter-prepaid' },
    { key: 'filter-no-deposit', filename: 'filter-no-deposit' },
    { key: 'filter-time-of-use', filename: 'filter-time-of-use' },
    { key: 'combo-green-fixed', filename: 'combo-green-fixed' },
    { key: 'combo-fixed-12month', filename: 'combo-fixed-12month' },
    { key: 'combo-green-dallas', filename: 'combo-green-dallas' },
    { key: 'combo-green-houston', filename: 'combo-green-houston' },
    { key: 'seasonal-summer-peak', filename: 'seasonal-summer-peak' },
    { key: 'seasonal-winter-demand', filename: 'seasonal-winter-demand' },
    { key: 'specialty-savings', filename: 'specialty-savings' },
    { key: 'specialty-business', filename: 'specialty-business' },
    { key: 'specialty-smart-home', filename: 'specialty-smart-home' },
    { key: 'specialty-low-rate', filename: 'specialty-low-rate' },
    { key: 'tool-comparison', filename: 'tool-comparison' }
  ];

  console.log(`🎯 Planning to generate ${imagesToGenerate.length} images`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const { key, filename } of imagesToGenerate) {
    const outputFile = `${filename}.png`;
    
    // Skip if already exists
    if (existingFiles.includes(outputFile)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      skipped++;
      continue;
    }

    const prompt = IMAGE_PROMPTS[key];
    if (!prompt) {
      console.log(`⚠️  No prompt found for ${key}, skipping`);
      continue;
    }

    const result = await generateImage(prompt, filename);
    
    if (result) {
      generated++;
    } else {
      failed++;
    }

    // Rate limiting - wait 2 seconds between requests
    if (generated + failed < imagesToGenerate.length) {
      console.log('⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n📊 Generation Summary:');
  console.log(`✅ Generated: ${generated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🎯 Total planned: ${imagesToGenerate.length}`);
}

// Run the script
generateMissingImages().catch(console.error);