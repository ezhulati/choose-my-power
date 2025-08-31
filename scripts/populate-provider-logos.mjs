/**
 * Populate Provider Logos from CSV Data
 * Processes comparepower-2025-08-27.csv and updates database with logo URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock database connection for now - will integrate with actual DB
const logoMappings = new Map();

// Provider name normalization
function normalizeProviderName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Extract provider name from URL
function extractProviderFromUrl(logoUrl) {
  const match = logoUrl.match(/\/images\/([^.]+)\.svg/);
  if (match) {
    return match[1].replace(/_/g, '-');
  }
  return null;
}

// Process the CSV data
async function processLogoCSV() {
  console.log('🚀 Processing provider logos from CSV...');
  
  const csvPath = path.join(__dirname, '..', 'comparepower-2025-08-27.csv');
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const providerLogos = new Map();
    let processed = 0;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      if (columns.length < 2) continue;
      
      const logoUrl = columns[0];
      const puctNumber = columns[1];
      
      // Extract provider information
      if (logoUrl && logoUrl.startsWith('https://assets.comparepower.com/images/')) {
        const providerSlug = extractProviderFromUrl(logoUrl);
        if (providerSlug) {
          // Convert slug back to readable name
          const providerName = providerSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (!providerLogos.has(providerName)) {
            providerLogos.set(providerName, {
              name: providerName,
              slug: providerSlug,
              logoUrl: logoUrl,
              puctNumber: puctNumber.replace('PUCT # ', ''),
              localLogoPath: `/logos/${providerSlug}.svg`
            });
            processed++;
          }
        }
      }
    }
    
    console.log(`✅ Processed ${processed} unique providers from CSV`);
    
    // Display results
    console.log('\n📋 Provider Logo Mapping:');
    console.log('=' .repeat(80));
    
    for (const [name, data] of providerLogos) {
      console.log(`${name.padEnd(20)} | ${data.logoUrl}`);
    }
    
    // Generate updated logo service mappings
    await generateLogoServiceUpdates(providerLogos);
    
    // Generate SQL for database population
    await generateDatabaseSQL(providerLogos);
    
    return providerLogos;
    
  } catch (error) {
    console.error('❌ Error processing CSV:', error);
    throw error;
  }
}

// Generate updated logo service mappings
async function generateLogoServiceUpdates(providerLogos) {
  console.log('\n🔧 Generating logo service updates...');
  
  // Create updated provider name mapping
  const nameMapping = {};
  const colors = {};
  
  for (const [name, data] of providerLogos) {
    const normalizedName = name.toLowerCase();
    nameMapping[normalizedName] = data.slug;
    
    // Add common variations
    const words = name.split(' ');
    if (words.length > 1) {
      nameMapping[words[0].toLowerCase()] = data.slug;
    }
    
    // Generate brand colors (you can customize these)
    colors[data.slug] = generateBrandColor(data.slug);
  }
  
  // Write the updated mappings to a file
  const mappingContent = `/**
 * Auto-generated Provider Mappings from CSV Data
 * Generated: ${new Date().toISOString()}
 */

export const PROVIDER_NAME_MAPPING = ${JSON.stringify(nameMapping, null, 2)};

export const PROVIDER_COLORS = ${JSON.stringify(colors, null, 2)};

export const PROVIDER_LOGO_URLS = {
${Array.from(providerLogos.values()).map(p => `  '${p.slug}': '${p.logoUrl}'`).join(',\n')}
};`;
  
  const mappingPath = path.join(__dirname, '..', 'src', 'lib', 'logo', 'provider-mappings.ts');
  fs.writeFileSync(mappingPath, mappingContent);
  console.log(`✅ Updated provider mappings: ${mappingPath}`);
}

// Generate database SQL
async function generateDatabaseSQL(providerLogos) {
  console.log('\n🗄️ Generating database SQL...');
  
  const sqlStatements = [];
  
  for (const [name, data] of providerLogos) {
    sqlStatements.push(`
INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('${name.replace(/'/g, "''")}', '${data.logoUrl}', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = '${data.logoUrl}', updated_at = NOW();`);
  }
  
  const sqlContent = `-- Auto-generated Provider Logo Population SQL
-- Generated: ${new Date().toISOString()}
-- Source: comparepower-2025-08-27.csv

BEGIN;

${sqlStatements.join('\n')}

COMMIT;

-- Verification query
SELECT provider_name, logo_url FROM provider_cache ORDER BY provider_name;
`;
  
  const sqlPath = path.join(__dirname, '..', 'db', 'populate-provider-logos.sql');
  
  // Create db directory if it doesn't exist
  const dbDir = path.dirname(sqlPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  fs.writeFileSync(sqlPath, sqlContent);
  console.log(`✅ Generated database SQL: ${sqlPath}`);
}

// Generate a brand color based on provider slug
function generateBrandColor(slug) {
  const colorMap = {
    'reliant': '#E31E24',
    'txu-energy': '#1E3A8A',
    'direct-energy': '#00A651',
    'constellation': '#0066CC',
    'frontier-utilities': '#8B5A3C',
    'rhythm-energy': '#FF6B35',
    'discount-power': '#2563EB',
    'payless-power': '#059669',
    'atlantex-power': '#7C3AED',
    'apge': '#DC2626',
    'tara-energy': '#EA580C',
    'gexa-energy': '#10B981',
    'just-energy': '#8B5CF6',
    'green-mountain': '#22C55E',
    'amigo-energy': '#F59E0B',
    'cirro-energy': '#06B6D4',
    '4change-energy': '#EF4444'
  };
  
  return colorMap[slug] || '#6B7280'; // Default gray
}

// Download logos locally (optional)
async function downloadLogos(providerLogos) {
  console.log('\n⬇️ Downloading logos locally...');
  
  // This would require implementing actual HTTP downloads
  // For now, just log what would be downloaded
  
  for (const [name, data] of providerLogos) {
    console.log(`Would download: ${data.logoUrl} -> public${data.localLogoPath}`);
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Provider Logo Population Script');
    console.log('=' .repeat(50));
    
    const providerLogos = await processLogoCSV();
    
    console.log('\n🎉 Script completed successfully!');
    console.log(`📊 Found ${providerLogos.size} unique providers with logos`);
    
    // Display next steps
    console.log('\n📝 Next Steps:');
    console.log('1. Review generated files:');
    console.log('   - src/lib/logo/provider-mappings.ts');
    console.log('   - db/populate-provider-logos.sql');
    console.log('2. Run SQL against your database');
    console.log('3. Update logo service to use new mappings');
    console.log('4. Test logo display across the application');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();