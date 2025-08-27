#!/usr/bin/env node
/**
 * Download provider logos from ComparePower assets
 * Uses the provider mapping to download all logo files
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const mappingPath = path.join(__dirname, '../src/data/provider-logos.json');
const logoDir = path.join(__dirname, '../src/assets/logos');

/**
 * Download a file from URL to local path
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${path.basename(filepath)}`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });
      
    }).on('error', (error) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(error);
    });
  });
}

/**
 * Download all provider logos
 */
async function downloadLogos() {
  try {
    // Read provider mapping
    console.log('📋 Reading provider mapping...');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    
    console.log(`🎯 Found ${mapping.providers.length} providers to download`);
    
    // Ensure logo directory exists
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    // Download each logo
    let downloaded = 0;
    let skipped = 0;
    
    for (const provider of mapping.providers) {
      const logoPath = path.join(logoDir, provider.logoFilename);
      
      // Check if already exists
      if (fs.existsSync(logoPath)) {
        console.log(`⏭️  Skipping existing: ${provider.logoFilename}`);
        skipped++;
        continue;
      }
      
      try {
        await downloadFile(provider.logoUrl, logoPath);
        downloaded++;
        
        // Small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to download ${provider.name}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Download Summary:`);
    console.log(`✅ Downloaded: ${downloaded} logos`);
    console.log(`⏭️  Skipped: ${skipped} existing logos`);
    console.log(`📁 Saved to: ${logoDir}`);
    
    // Create a fallback logo placeholder
    const fallbackPath = path.join(logoDir, 'fallback.svg');
    if (!fs.existsSync(fallbackPath)) {
      console.log(`🎨 Creating fallback logo...`);
      const fallbackSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#E5E7EB"/>
  <path d="M8 12h16M8 16h16M8 20h16" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;
      fs.writeFileSync(fallbackPath, fallbackSvg);
      console.log(`✅ Created fallback logo`);
    }
    
  } catch (error) {
    console.error('💥 Download failed:', error.message);
    throw error;
  }
}

// Run if called directly
console.log('🚀 Starting logo download...');

downloadLogos()
  .then(() => {
    console.log('\n🎉 Logo download completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Download failed:', error);
    process.exit(1);
  });

export { downloadLogos };