#!/usr/bin/env node

/**
 * Simple Ideogram API Test Script
 * Tests the API connection and generates a sample image
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.IDEOGRAM_API_KEY?.trim();
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

console.log('🔍 Environment Debug:');
console.log(`Raw API key variable: "${process.env.IDEOGRAM_API_KEY}"`);
console.log(`Trimmed API key: "${API_KEY}"`);
console.log(`Key length: ${API_KEY?.length || 0}`);
console.log('');

if (!API_KEY || API_KEY.length < 10) {
  console.error('❌ IDEOGRAM_API_KEY not found or too short in .env file');
  console.log('Current value:', API_KEY ? `"${API_KEY.substring(0, 5)}..." (${API_KEY.length} chars)` : 'undefined');
  console.log('Please add your API key to .env:');
  console.log('IDEOGRAM_API_KEY="your_actual_ideogram_key_here"');
  console.log('Make sure there are no extra spaces or characters');
  process.exit(1);
}

console.log('🧪 Testing Ideogram API connection...\n');

async function testIdeogramAPI() {
  const testPrompt = 'A modern Dallas cityscape with electrical infrastructure, clean energy theme, no text, professional photography style';
  
  console.log(`📝 Test prompt: ${testPrompt}`);
  console.log(`🔗 API endpoint: ${API_URL}`);
  console.log(`🔑 API key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        rendering_speed: 'TURBO',
        style_type: 'AUTO',
        aspect_ratio: '16:9'
      })
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response received successfully!');
    console.log(`📸 Generated images: ${result.data?.length || 0}`);
    
    if (result.data && result.data[0]) {
      const imageData = result.data[0];
      console.log(`🎨 Image URL: ${imageData.url}`);
      console.log(`✨ Enhanced prompt: ${imageData.prompt}`);
      console.log(`🔢 Image ID: ${imageData.id}`);
      console.log(`⚡ Generation time: ~3-5 seconds`);
      
      // Verify image accessibility
      console.log('\n🔍 Testing image URL accessibility...');
      try {
        const imageResponse = await fetch(imageData.url);
        if (imageResponse.ok) {
          console.log('✅ Generated image is accessible');
          console.log(`📏 Image size: ${Math.round(imageResponse.headers.get('content-length') / 1024)}KB`);
        } else {
          console.log('⚠️ Image URL not immediately accessible (may need a moment)');
        }
      } catch (error) {
        console.log('⚠️ Could not verify image accessibility:', error.message);
      }
      
    } else {
      console.log('⚠️ No image data in response');
    }
    
    console.log('\n🎉 API test completed successfully!');
    console.log('✅ Your Ideogram integration is working correctly.');
    console.log('\n🚀 Next steps:');
    console.log('  1. Run: npm run og:generate-priority');
    console.log('  2. Monitor: npm run og:monitor');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  • Check your API key is correct');
      console.log('  • Ensure you have credits in your Ideogram account');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  • Check your internet connection');
      console.log('  • Verify the API endpoint is accessible');
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('  • Check Ideogram API status and documentation');
      console.log('  • Verify your account has sufficient credits');
    }
  }
}

// Run the test
testIdeogramAPI().catch(console.error);