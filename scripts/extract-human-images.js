#!/usr/bin/env node

/**
 * Extract Human-Centered Images from Generation Report
 * Processes the human-centered-generation-report.json and saves base64 images
 */

import fs from 'fs';
import path from 'path';

const REPORT_PATH = './human-centered-generation-report.json';
const OUTPUT_DIR = './public/images/og/human-centered';

async function extractImages() {
  console.log('📸 Extracting human-centered images from generation report...');
  
  try {
    // Read the generation report
    const reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`✅ Created directory: ${OUTPUT_DIR}`);
    }
    
    const results = reportData.results || [];
    let successCount = 0;
    let failedCount = 0;
    
    console.log(`\n🔍 Processing ${results.length} images...`);
    
    for (const result of results) {
      if (result.success && result.url) {
        try {
          const filename = result.filename;
          const outputPath = path.join(OUTPUT_DIR, filename);
          
          console.log(`📋 Processing: ${filename}`);
          
          // Check if URL is base64 data URI
          if (result.url.startsWith('data:image/')) {
            // Extract base64 data
            const base64Data = result.url.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Write the image file
            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`  ✅ Saved: ${outputPath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
            successCount++;
            
          } else {
            // Handle regular URL (would need fetch for downloading)
            console.log(`  ⚠️  Skipping HTTP URL: ${filename}`);
            failedCount++;
          }
          
        } catch (error) {
          console.error(`  ❌ Failed to process ${result.filename}:`, error.message);
          failedCount++;
        }
      } else {
        console.log(`  ⚠️  Skipping failed generation: ${result.filename}`);
        failedCount++;
      }
    }
    
    console.log(`\n📊 EXTRACTION COMPLETE:`);
    console.log(`✅ Successfully saved: ${successCount} images`);
    console.log(`❌ Failed: ${failedCount} images`);
    
    if (successCount > 0) {
      console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);
      console.log(`🎯 Next Steps:`);
      console.log(`1. Verify all images saved correctly`);
      console.log(`2. Test hero image loading on site`);
      console.log(`3. Update any missing image references`);
    }
    
  } catch (error) {
    console.error('💥 Extraction failed:', error.message);
    process.exit(1);
  }
}

// Run the extraction
extractImages().catch(console.error);