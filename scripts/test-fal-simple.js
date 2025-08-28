#!/usr/bin/env node

/**
 * Simple fal.ai API Test
 * Test basic API connectivity after payment setup
 */

import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';

dotenv.config();

const FAL_KEY = process.env.FAL_KEY?.trim();

// Configure fal with API key
fal.config({
  credentials: FAL_KEY
});

async function testSimple() {
  console.log('🧪 Testing basic fal.ai API access...');
  console.log(`🔑 Using key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}\n`);

  try {
    // Try the stable diffusion model we used before
    const result = await fal.subscribe("fal-ai/stable-diffusion-v35-large", {
      input: {
        prompt: 'simple blue circle',
        image_size: "square_hd",
        num_inference_steps: 4,
        guidance_scale: 7.5,
        num_images: 1,
        sync_mode: true
      }
    });

    if (result?.data?.images?.[0]) {
      console.log('✅ SUCCESS! API is working');
      console.log(`📸 Image URL: ${result.data.images[0].url}`);
      console.log('🚀 Ready to test nano-banana!');
    } else {
      console.log('❌ No image returned');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    if (error.message?.includes('Forbidden')) {
      console.log('\n💡 Troubleshooting steps:');
      console.log('1. Check if payment method is fully processed');
      console.log('2. Verify account is activated for API usage');
      console.log('3. Try a different model endpoint');
      console.log('4. Check fal.ai dashboard for account status');
    }
  }
}

testSimple().catch(console.error);