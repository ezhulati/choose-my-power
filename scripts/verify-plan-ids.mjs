#!/usr/bin/env node

/**
 * Verification script for electricity plan MongoDB ObjectIds
 * 
 * This script scans all generated JSON files to:
 * 1. Verify each plan has an `id` field
 * 2. Validate the `id` format (24 character hex string)
 * 3. Report plans with missing or invalid IDs
 * 4. Generate a report of all unique providers
 * 5. Check for specific providers like 4Change Energy
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// MongoDB ObjectId validation regex
const MONGO_ID_REGEX = /^[a-f0-9]{24}$/i;

async function verifyPlanIds() {
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}   Plan ID Verification Script${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const dataDir = path.join(__dirname, '..', 'src', 'data', 'generated');
  
  try {
    // Check if directory exists
    await fs.access(dataDir);
  } catch {
    console.error(`${colors.red}✗ Data directory not found: ${dataDir}${colors.reset}`);
    process.exit(1);
  }

  const files = await fs.readdir(dataDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${colors.blue}${jsonFiles.length}${colors.reset} city data files\n`);

  const stats = {
    totalFiles: 0,
    totalPlans: 0,
    plansWithValidIds: 0,
    plansWithInvalidIds: 0,
    plansMissingIds: 0,
    providers: new Set(),
    providersWithIssues: new Map(), // provider -> count of issues
    specificProviders: {
      '4Change Energy': { count: 0, sampleIds: [] },
      'Amigo Energy': { count: 0, sampleIds: [] },
      'TXU Energy': { count: 0, sampleIds: [] },
      'Reliant Energy': { count: 0, sampleIds: [] },
      'Green Mountain Energy': { count: 0, sampleIds: [] }
    }
  };

  const invalidPlans = [];
  const missingIdPlans = [];

  // Process each city file
  for (const file of jsonFiles.slice(0, 10)) { // Process first 10 files for quick check
    const filePath = path.join(dataDir, file);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Plans are nested under filters['no-filters'].plans in the generated data
      let plans = [];
      if (data.filters && data.filters['no-filters'] && data.filters['no-filters'].plans) {
        plans = data.filters['no-filters'].plans;
      } else if (data.plans && Array.isArray(data.plans)) {
        plans = data.plans;
      } else {
        console.warn(`${colors.yellow}⚠ No plans found in ${file}${colors.reset}`);
        continue;
      }

      stats.totalFiles++;
      
      for (const plan of plans) {
        stats.totalPlans++;
        
        // Track provider
        const providerName = plan.provider?.name || 'Unknown Provider';
        stats.providers.add(providerName);
        
        // Check specific providers
        if (stats.specificProviders[providerName]) {
          stats.specificProviders[providerName].count++;
          if (plan.id && stats.specificProviders[providerName].sampleIds.length < 3) {
            stats.specificProviders[providerName].sampleIds.push({
              id: plan.id,
              planName: plan.name,
              city: data.city || file.replace('.json', '')
            });
          }
        }
        
        // Validate plan ID
        if (!plan.id) {
          stats.plansMissingIds++;
          missingIdPlans.push({
            file,
            planName: plan.name,
            provider: providerName
          });
          
          // Track provider issues
          stats.providersWithIssues.set(
            providerName, 
            (stats.providersWithIssues.get(providerName) || 0) + 1
          );
        } else if (!MONGO_ID_REGEX.test(plan.id)) {
          stats.plansWithInvalidIds++;
          invalidPlans.push({
            file,
            planName: plan.name,
            provider: providerName,
            invalidId: plan.id
          });
          
          // Track provider issues
          stats.providersWithIssues.set(
            providerName, 
            (stats.providersWithIssues.get(providerName) || 0) + 1
          );
        } else {
          stats.plansWithValidIds++;
        }
      }
    } catch (error) {
      console.error(`${colors.red}✗ Error processing ${file}: ${error.message}${colors.reset}`);
    }
  }

  // Print results
  console.log(`${colors.blue}══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   VERIFICATION RESULTS${colors.reset}`);
  console.log(`${colors.blue}══════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.green}✓ Files Processed:${colors.reset} ${stats.totalFiles}`);
  console.log(`${colors.green}✓ Total Plans:${colors.reset} ${stats.totalPlans}`);
  console.log(`${colors.green}✓ Valid MongoDB IDs:${colors.reset} ${stats.plansWithValidIds} (${(stats.plansWithValidIds/stats.totalPlans*100).toFixed(1)}%)`);
  
  if (stats.plansWithInvalidIds > 0) {
    console.log(`${colors.red}✗ Invalid IDs:${colors.reset} ${stats.plansWithInvalidIds}`);
  }
  
  if (stats.plansMissingIds > 0) {
    console.log(`${colors.red}✗ Missing IDs:${colors.reset} ${stats.plansMissingIds}`);
  }

  // Provider summary
  console.log(`\n${colors.magenta}══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}   PROVIDER SUMMARY${colors.reset}`);
  console.log(`${colors.magenta}══════════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.cyan}Total Unique Providers:${colors.reset} ${stats.providers.size}\n`);

  // Show specific provider details
  console.log(`${colors.yellow}Key Providers:${colors.reset}`);
  for (const [provider, data] of Object.entries(stats.specificProviders)) {
    if (data.count > 0) {
      console.log(`\n  ${colors.green}✓${colors.reset} ${provider}: ${data.count} plans found`);
      if (data.sampleIds.length > 0) {
        console.log(`    ${colors.cyan}Sample IDs:${colors.reset}`);
        data.sampleIds.forEach(sample => {
          console.log(`      • ${sample.id} - "${sample.planName}" (${sample.city})`);
        });
      }
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${provider}: No plans found`);
    }
  }

  // Show providers with issues
  if (stats.providersWithIssues.size > 0) {
    console.log(`\n${colors.red}Providers with ID Issues:${colors.reset}`);
    for (const [provider, count] of stats.providersWithIssues.entries()) {
      console.log(`  • ${provider}: ${count} plans with issues`);
    }
  }

  // Show sample of invalid plans
  if (invalidPlans.length > 0) {
    console.log(`\n${colors.red}Sample Invalid Plan IDs (first 5):${colors.reset}`);
    invalidPlans.slice(0, 5).forEach(plan => {
      console.log(`  • ${plan.planName} (${plan.provider})`);
      console.log(`    File: ${plan.file}`);
      console.log(`    Invalid ID: ${plan.invalidId}`);
    });
  }

  // Show sample of missing IDs
  if (missingIdPlans.length > 0) {
    console.log(`\n${colors.red}Sample Plans Missing IDs (first 5):${colors.reset}`);
    missingIdPlans.slice(0, 5).forEach(plan => {
      console.log(`  • ${plan.planName} (${plan.provider})`);
      console.log(`    File: ${plan.file}`);
    });
  }

  // Final summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  const successRate = (stats.plansWithValidIds / stats.totalPlans * 100).toFixed(1);
  if (successRate === '100.0') {
    console.log(`${colors.green}✓ SUCCESS: All plans have valid MongoDB ObjectIds!${colors.reset}`);
  } else if (successRate >= 95) {
    console.log(`${colors.yellow}⚠ MOSTLY GOOD: ${successRate}% of plans have valid IDs${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ISSUES FOUND: Only ${successRate}% of plans have valid IDs${colors.reset}`);
  }
  
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(stats.plansWithInvalidIds > 0 || stats.plansMissingIds > 0 ? 1 : 0);
}

// Run the verification
verifyPlanIds().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});