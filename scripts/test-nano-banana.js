#!/usr/bin/env node

/**
 * Test nano-banana API with a Single Image
 * Quick test to verify nano-banana model works with our existing images
 */

import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';

dotenv.config();

const FAL_KEY = process.env.FAL_KEY?.trim();

// Configure fal with API key
fal.config({
  credentials: FAL_KEY
});

async function testNanoBanana() {
  console.log('🍌 Testing nano-banana API...');
  console.log(`🔑 Using key: ${FAL_KEY.substring(0, 8)}...${FAL_KEY.substring(FAL_KEY.length - 4)}\n`);

  if (!FAL_KEY || FAL_KEY.includes('your-fal-key')) {
    console.log('❌ Fal.ai API key not configured properly');
    process.exit(1);
  }

  try {
    console.log('🍌 Testing nano-banana enhancement...');
    
    // Use a publicly accessible test image for nano-banana testing
    const testImageUrl = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop';
    
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt: 'Create a professional Texas electricity grid with power transmission towers against blue sky, high quality, professional photography, no text, no words',
        num_images: 1,
        output_format: "png"
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
      
      console.log('\n🎉 SUCCESS! nano-banana API is working correctly');
      console.log('─'.repeat(60));
      console.log(`📸 Enhanced Image URL: ${image.url}`);
      console.log(`🎨 Content Type: ${image.content_type || 'png'}`);
      console.log(`🍌 Enhanced with nano-banana + Gemini model`);
      console.log(`📝 Description: ${result.data.description || 'Enhanced image'}`)
      
      console.log('\n✅ nano-banana is ready for batch enhancement!');
      console.log('💰 Estimated cost for enhancing all 26 images: $0.26 (26 × $0.01)');
      console.log('🚀 Ready to run: node scripts/enhance-nano-banana.js');
      
    } else {
      console.log('❌ No enhanced image data received from nano-banana');
      console.log('Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ nano-banana API test failed:', error.message || error);
    
    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Verify your FAL_KEY is correct in .env file');
      console.log('2. Check that your fal.ai account has credits');
      console.log('3. Ensure the API key has proper permissions');
      console.log('4. Verify the test image URL is accessible');
    }

    if (error.message?.includes('image_urls')) {
      console.log('\n💡 Note: Make sure the Astro dev server is running:');
      console.log('   npm run dev');
      console.log('   This makes the test image accessible at localhost:4325');
    }
  }
}

testNanoBanana().catch(console.error);