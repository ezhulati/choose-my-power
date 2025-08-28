#!/usr/bin/env node

/**
 * Download and Save Generated Images
 * Downloads all the ephemeral Ideogram images to local storage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generated image URLs that we need to save
const GENERATED_IMAGES = {
  // Fresh test image we just generated
  'homepage_texas_grid': 'https://ideogram.ai/api/images/ephemeral/rPBdyKNxR0ClPgRa_hQRCA.png?exp=1756429316&sig=0e52486c42cc3feda0eabee06234ebbb2fd96d608f9dfe9dbb5bcf027283bef3',
  
  // Previous batch - these may have expired
  'dallas-city-main': 'https://ideogram.ai/api/images/ephemeral/5ErdpZRhRsqAjJ8s82SLjA.png?exp=1756428464&sig=16a0617ee0d77cffd7783d8c51f61cca2905cc5d0e1876fcab83426d75c9c78c',
  'houston-city-main': 'https://ideogram.ai/api/images/ephemeral/atsJ_e9ZRpGjK5clJAf5qA.png?exp=1756428472&sig=3226606f3f0f1c5eaa58b1ae69d8dcb12b2a8270943adf4f1c5eda162a5f433c',
  'austin-city-main': 'https://ideogram.ai/api/images/ephemeral/ixpFDBahR2eNWJHY3GswRQ.png?exp=1756428507&sig=75f2936de8763fbb4ca174d243048ece406075e3ab99d2d5e08979cb32545b78',
  'green-energy-filter': 'https://ideogram.ai/api/images/ephemeral/XwzJyg2eTRKRptjkOJSTBw.png?exp=1756428329&sig=f1a386b8c61f7047796961ecc5d050a026b6eba3e2874b367eb2f2c4ccb65b78',
  'fixed-rate-filter': 'https://ideogram.ai/api/images/ephemeral/or3YEitbRVWF36u5CzQBrg.png?exp=1756428493&sig=7c7f556844c6db2f70249a560add7f2d350c5f54c5a7388b47670ef1dbfd41a3'
};

async function downloadImage(url, filename) {
  try {
    console.log(`📥 Downloading: ${filename}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ Failed to download ${filename}: ${response.status} ${response.statusText}`);
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

async function downloadAllImages() {
  console.log('🚀 DOWNLOADING AND SAVING ALL GENERATED IMAGES');
  console.log('='.repeat(60));
  
  const results = [];
  let successCount = 0;
  
  for (const [key, url] of Object.entries(GENERATED_IMAGES)) {
    const success = await downloadImage(url, key);
    results.push({ key, success });
    if (success) successCount++;
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('📊 DOWNLOAD RESULTS:');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}/${Object.keys(GENERATED_IMAGES).length} images`);
  console.log('');
  
  results.forEach(({ key, success }) => {
    console.log(`${success ? '✅' : '❌'} ${key}`);
  });
  
  if (successCount > 0) {
    console.log('');
    console.log('🎉 Images saved to: public/images/og/');
    console.log('📝 Next steps:');
    console.log('  1. Update hero-image-mapper.ts to use local URLs');
    console.log('  2. Test the hero backgrounds');
    console.log('  3. Generate more images if needed');
  }
}

downloadAllImages().catch(console.error);