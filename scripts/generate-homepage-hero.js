#!/usr/bin/env node
/**
 * Generate Perfect Homepage Hero Image
 * Nighttime Texas suburban neighborhood with lights on
 */

import fs from 'fs/promises';
import path from 'path';

// Perfect nighttime neighborhood prompt
const HOMEPAGE_PROMPT = {
  prompt: "Beautiful Texas suburban neighborhood at night, warm yellow lights glowing in home windows and doorways, street lamps illuminating curved driveways and sidewalks, two-story homes with front porches, cars in driveways, peaceful American dream neighborhood, high quality photography, deep blue night sky, cozy evening atmosphere, residential electricity in use, 16:9 aspect ratio",
  filename: "homepage_night_neighborhood_16x9.png"
};

// Generate with FAL API
async function generateHomepageHero() {
  try {
    console.log('🏠 Generating Perfect Homepage Hero Image');
    console.log('🌙 Theme: Nighttime Texas suburbs with lights on');
    console.log(`📝 Prompt: ${HOMEPAGE_PROMPT.prompt}`);
    
    // Simple fetch to FAL API
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: HOMEPAGE_PROMPT.prompt,
        image_size: "landscape_16_9",
        num_images: 1,
        guidance_scale: 7,
        num_inference_steps: 50
      }),
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📸 FAL API Response:', result);

    if (result.images?.[0]?.url) {
      // Download image
      const imageResponse = await fetch(result.images[0].url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Save to public directory
      const outputDir = path.join(process.cwd(), 'public', 'images', 'og');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, HOMEPAGE_PROMPT.filename);
      await fs.writeFile(outputPath, Buffer.from(imageBuffer));
      
      console.log(`✅ Perfect! Saved homepage hero: ${outputPath}`);
      console.log('🎯 Next: Update hero-image-mapper.ts to use this image');
      
      return { success: true, path: outputPath };
    } else {
      console.error('❌ No image URL in response:', result);
      return { success: false, error: 'No image generated' };
    }
  } catch (error) {
    console.error('❌ Error generating homepage hero:', error);
    return { success: false, error: error.message };
  }
}

// Run it
generateHomepageHero().catch(console.error);