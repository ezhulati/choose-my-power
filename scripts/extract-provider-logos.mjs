#!/usr/bin/env node
/**
 * Extract provider logos from ComparePower CSV data
 * Creates provider-to-logo mapping for integration into the app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the CSV file
const csvPath = '/Users/mbp-ez/Downloads/AI Library/Apps/CMP/comparepower-2025-08-27.csv';
const outputPath = path.join(__dirname, '../src/data/provider-logos.json');

async function parseCSV() {
  try {
    console.log('📊 Reading ComparePower CSV data from:', csvPath);
    
    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    
    console.log('📄 CSV file found, reading content...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    const providerMap = new Map();
    let processedCount = 0;
    
    // Skip header line and process data
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSV format: logoUrl,PUCT#,term,rateType,lock,greenEnergy,rate,calculation,total,planName,description,phone,phoneDisplay
      const columns = line.split(',');
      if (columns.length < 2) continue;
      
      const logoUrl = columns[0];
      const puctNumber = columns[1];
      
      if (logoUrl && logoUrl.startsWith('https://assets.comparepower.com/images/')) {
        // Extract provider name from logo URL
        const logoFilename = path.basename(logoUrl);
        const providerKey = logoFilename.replace('.svg', '').replace(/_/g, ' ');
        
        // Extract PUCT company info if available
        const puctMatch = puctNumber.match(/PUCT #\s*(\d+)/);
        const puctNum = puctMatch ? puctMatch[1] : null;
        
        // Store provider info
        if (!providerMap.has(providerKey)) {
          providerMap.set(providerKey, {
            name: providerKey,
            logoUrl: logoUrl,
            logoFilename: logoFilename,
            puctNumber: puctNum,
            plans: 0
          });
        }
        
        // Increment plan count
        const provider = providerMap.get(providerKey);
        provider.plans++;
        processedCount++;
      }
    }
    
    console.log(`✅ Processed ${processedCount} plans`);
    console.log(`🏢 Found ${providerMap.size} unique providers`);
    
    // Convert to array and sort by plan count (most popular first)
    const providers = Array.from(providerMap.values())
      .sort((a, b) => b.plans - a.plans);
    
    // Display summary
    console.log('\n📋 Provider Summary:');
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name} (${provider.plans} plans) - PUCT #${provider.puctNumber}`);
    });
    
    // Create mapping object for easy lookup
    const providerMapping = {};
    providers.forEach(provider => {
      // Create multiple lookup keys for flexibility
      const keys = [
        provider.name.toLowerCase(),
        provider.name.toLowerCase().replace(/\s+/g, ''),
        provider.name.toLowerCase().replace(/\s+/g, '_'),
        provider.name.toLowerCase().replace(/\s+energy$/i, ''),
        provider.name.toLowerCase().replace(/\s+power$/i, ''),
        provider.name.toLowerCase().replace(/\s+utilities$/i, '')
      ];
      
      keys.forEach(key => {
        providerMapping[key] = {
          name: provider.name,
          logoUrl: provider.logoUrl,
          logoFilename: provider.logoFilename,
          puctNumber: provider.puctNumber
        };
      });
    });
    
    // Save to JSON file
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'comparepower-2025-08-27.csv',
        totalProviders: providers.length,
        totalPlans: processedCount
      },
      providers: providers,
      mapping: providerMapping
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved provider mapping to: ${outputPath}`);
    
    return output;
    
  } catch (error) {
    console.error('❌ Error parsing CSV:', error.message);
    throw error;
  }
}

// Run if called directly
console.log('🚀 Starting provider logo extraction script...');
console.log('Script URL:', import.meta.url);
console.log('Process argv[1]:', process.argv[1]);

parseCSV()
  .then(() => {
    console.log('\n🎉 Provider logo extraction completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Extraction failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });

export { parseCSV };