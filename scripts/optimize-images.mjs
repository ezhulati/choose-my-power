#!/usr/bin/env node

/**
 * Image Optimization Script for ChooseMyPower.org
 * Converts images to WebP and AVIF formats for better performance
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
  inputDir: join(projectRoot, 'public', 'images'),
  outputDir: join(projectRoot, 'public', 'images'),
  formats: ['webp', 'avif'],
  quality: {
    webp: 80,
    avif: 70
  },
  extensions: ['.png', '.jpg', '.jpeg'],
  skipExisting: true
};

async function findImages(dir) {
  const images = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subImages = await findImages(fullPath);
        images.push(...subImages);
      } else if (config.extensions.includes(extname(entry.name).toLowerCase())) {
        images.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}:`, error.message);
  }
  
  return images;
}

async function convertImage(inputPath, outputPath, format, quality) {
  try {
    // Check if Sharp is available
    const sharpCommand = `npx sharp-cli --input "${inputPath}" --output "${outputPath}" --format ${format} --quality ${quality}`;
    
    try {
      execSync(sharpCommand, { stdio: 'pipe' });
      return true;
    } catch (sharpError) {
      // Fallback to ImageMagick if available
      const magickCommand = format === 'webp' 
        ? `convert "${inputPath}" -quality ${quality} "${outputPath}"`
        : `convert "${inputPath}" -quality ${quality} "${outputPath}"`;
      
      try {
        execSync(magickCommand, { stdio: 'pipe' });
        return true;
      } catch (magickError) {
        console.warn(`Could not convert ${inputPath}: No suitable image processor found`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
    return false;
  }
}

async function getImageDimensions(imagePath) {
  try {
    // Try to get dimensions using sips (macOS) or identify (ImageMagick)
    let result;
    try {
      result = execSync(`sips -g pixelWidth -g pixelHeight "${imagePath}" 2>/dev/null`, { encoding: 'utf8' });
      const widthMatch = result.match(/pixelWidth: (\d+)/);
      const heightMatch = result.match(/pixelHeight: (\d+)/);
      if (widthMatch && heightMatch) {
        return {
          width: parseInt(widthMatch[1]),
          height: parseInt(heightMatch[1])
        };
      }
    } catch (e) {
      // Try ImageMagick identify
      result = execSync(`identify -format "%w %h" "${imagePath}" 2>/dev/null`, { encoding: 'utf8' });
      const [width, height] = result.trim().split(' ').map(Number);
      if (width && height) {
        return { width, height };
      }
    }
  } catch (error) {
    console.warn(`Could not get dimensions for ${imagePath}`);
  }
  return null;
}

async function generatePictureElement(imagePath, alternatives) {
  const dimensions = await getImageDimensions(imagePath);
  const relativePath = imagePath.replace(join(projectRoot, 'public'), '');
  const baseName = basename(relativePath, extname(relativePath));
  const dirName = dirname(relativePath);
  
  let pictureElement = '<picture>\n';
  
  // Add AVIF source if available
  if (alternatives.avif) {
    const avifPath = join(dirName, baseName + '.avif');
    pictureElement += `  <source srcset="${avifPath}" type="image/avif" />\n`;
  }
  
  // Add WebP source if available
  if (alternatives.webp) {
    const webpPath = join(dirName, baseName + '.webp');
    pictureElement += `  <source srcset="${webpPath}" type="image/webp" />\n`;
  }
  
  // Add original as fallback
  let imgAttributes = `src="${relativePath}" alt=""`;
  if (dimensions) {
    imgAttributes += ` width="${dimensions.width}" height="${dimensions.height}"`;
  }
  pictureElement += `  <img ${imgAttributes} loading="lazy" decoding="async" />\n`;
  pictureElement += '</picture>';
  
  return pictureElement;
}

async function optimizeImages() {
  console.log('🖼️  Starting image optimization...');
  
  // Find all images
  const images = await findImages(config.inputDir);
  console.log(`Found ${images.length} images to process`);
  
  const results = {
    converted: 0,
    skipped: 0,
    failed: 0,
    totalSavings: 0
  };
  
  const pictureElements = [];
  
  for (const imagePath of images) {
    const relativePath = imagePath.replace(join(projectRoot, 'public'), '');
    const baseName = basename(imagePath, extname(imagePath));
    const dirName = dirname(imagePath);
    
    console.log(`Processing: ${relativePath}`);
    
    const alternatives = {};
    let originalSize;
    
    try {
      const stats = await fs.stat(imagePath);
      originalSize = stats.size;
    } catch (error) {
      console.warn(`Could not get file stats for ${imagePath}`);
      continue;
    }
    
    // Convert to each format
    for (const format of config.formats) {
      const outputPath = join(dirName, `${baseName}.${format}`);
      
      // Skip if file already exists and skipExisting is true
      if (config.skipExisting) {
        try {
          await fs.access(outputPath);
          console.log(`  ⏭️  ${format.toUpperCase()} already exists, skipping`);
          alternatives[format] = outputPath;
          results.skipped++;
          continue;
        } catch (error) {
          // File doesn't exist, continue with conversion
        }
      }
      
      const success = await convertImage(
        imagePath, 
        outputPath, 
        format, 
        config.quality[format]
      );
      
      if (success) {
        try {
          const stats = await fs.stat(outputPath);
          const savings = originalSize - stats.size;
          const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
          
          console.log(`  ✅ ${format.toUpperCase()}: ${(stats.size / 1024).toFixed(1)}KB (${savingsPercent}% smaller)`);
          
          alternatives[format] = outputPath;
          results.converted++;
          results.totalSavings += savings;
        } catch (error) {
          console.warn(`Could not get stats for converted file ${outputPath}`);
        }
      } else {
        results.failed++;
      }
    }
    
    // Generate picture element suggestion
    if (Object.keys(alternatives).length > 0) {
      const pictureHtml = await generatePictureElement(imagePath, alternatives);
      pictureElements.push({
        original: relativePath,
        html: pictureHtml
      });
    }
  }
  
  // Generate report
  console.log('\n📊 Optimization Results:');
  console.log(`✅ Converted: ${results.converted} images`);
  console.log(`⏭️  Skipped: ${results.skipped} images`);
  console.log(`❌ Failed: ${results.failed} images`);
  console.log(`💾 Total savings: ${(results.totalSavings / 1024 / 1024).toFixed(2)}MB`);
  
  // Save picture elements suggestions
  if (pictureElements.length > 0) {
    const reportContent = `# Image Optimization Report

## Generated Picture Elements

Use these optimized picture elements in your HTML:

${pictureElements.map(item => `### ${item.original}

\`\`\`html
${item.html}
\`\`\`

`).join('')}

## Usage Notes

1. Replace \`<img>\` tags with the corresponding \`<picture>\` elements above
2. Add appropriate \`alt\` attributes for accessibility
3. Adjust \`loading\` attribute as needed (\`eager\` for above-fold images)
4. Consider adding \`sizes\` attribute for responsive images

## Performance Impact

- **Estimated bandwidth savings:** ${(results.totalSavings / 1024 / 1024).toFixed(2)}MB
- **Formats generated:** ${config.formats.join(', ').toUpperCase()}
- **Browser support:** WebP (96%+), AVIF (85%+)
`;
    
    const reportPath = join(projectRoot, 'image-optimization-report.md');
    await fs.writeFile(reportPath, reportContent);
    console.log(`\n📋 Report saved to: ${reportPath}`);
  }
  
  console.log('\n🎉 Image optimization complete!');
}

// Run the optimization
optimizeImages().catch(console.error);