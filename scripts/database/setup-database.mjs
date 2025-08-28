#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this script to initialize the ChooseMyPower database with all required tables and seed data
 * 
 * Usage:
 *   node scripts/setup-database.mjs
 *   node scripts/setup-database.mjs --reset (WARNING: destroys all data)
 */

import { setupDatabase, resetDatabase, getDatabaseStats, testDatabaseConnection } from '../src/lib/database/migrations.js';

const isReset = process.argv.includes('--reset');

async function main() {
  console.log('🔌 ChooseMyPower Database Setup');
  console.log('================================\n');

  // Test connection first
  console.log('Testing database connection...');
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    console.error('❌ Could not connect to database. Please check your environment variables:');
    console.error('- NETLIFY_DATABASE_URL');
    console.error('- NETLIFY_DATABASE_URL_UNPOOLED');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful\n');

  try {
    if (isReset) {
      console.log('⚠️  RESET MODE - This will destroy all existing data!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      
      // Give user 5 seconds to cancel
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await resetDatabase();
      console.log('');
    }
    
    await setupDatabase();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start using the database in your application.\n');
    
    // Show final stats
    const stats = await getDatabaseStats();
    console.log('📊 Final Database Statistics:');
    console.log(`   • Providers: ${stats.providers}`);
    console.log(`   • Cities: ${stats.cities}`);
    console.log(`   • Active Plans: ${stats.activePlans}`);
    console.log(`   • Valid Cache Entries: ${stats.validCacheEntries}`);
    console.log(`   • API Calls (24h): ${stats.apiCallsLast24h}\n`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();