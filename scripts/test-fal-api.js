#!/usr/bin/env node

/**
 * Test Fal.ai API Connection
 * Quick test to verify API key and generation capability
 */

import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';

dotenv.config();

const FAL_KEY = process.env.FAL_KEY?.trim();

// Configure fal with API key
fal.config({
  credentials: FAL_KEY
});

async function testFalApi() {
  console.log('🧪 Testing Fal.ai API Connection...');
  console.log(`🔑 Using key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}\n`);

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  try {
    console.log('⚡ Generating test image...');
    
    const result = await fal.subscribe("fal-ai/stable-diffusion-v35-large", {
      input: {
        prompt: 'Texas electricity transmission towers against blue sky, high quality, professional photography, no text, no words',
        negative_prompt: 'text, words, letters, numbers, writing, typography, labels, signs',
        image_size: 'landscape_16_9',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        sync_mode: true,
        seed: 123456
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`⏳ Status: ${update.status}`);
        }
      }
    });

    if (result?.data?.images?.[0]) {
      const image = result.data.images[0];
      
      console.log('\n🎉 SUCCESS! Fal.ai API is working correctly');
      console.log('─'.repeat(60));
      console.log(`📸 Image URL: ${image.url}`);
      console.log(`📐 Dimensions: ${image.width}x${image.height}`);
      console.log(`🎨 Content Type: ${image.content_type}`);
      console.log(`🌱 Seed: ${result.data.seed}`);
      console.log(`⚡ Has NSFW: ${result.data.has_nsfw_concepts?.[0] || false}`);
      
      if (result.data.timings) {
        console.log(`⏱️  Generation Time: ${Object.values(result.data.timings).reduce((a, b) => a + b, 0).toFixed(2)}s`);
      }
      
      console.log('\n✅ Fal.ai is ready for batch generation!');
      console.log('💰 Estimated cost for full batch: ~$1.60 (25 images × $0.035)');
      console.log('🚀 Ready to run: npm run generate:fal-batch');
      
    } else {
      console.log('❌ No image data received from fal.ai');
      console.log('Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Fal.ai API test failed:', error.message || error);
    
    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Verify your FAL_KEY is correct in .env file');
      console.log('2. Check that your fal.ai account has credits');
      console.log('3. Ensure the API key has proper permissions');
    }
  }
}

testFalApi().catch(console.error);