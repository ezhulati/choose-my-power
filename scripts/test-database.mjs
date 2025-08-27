#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the Netlify Neon database connection and basic operations
 * 
 * Usage:
 *   node scripts/test-database.mjs
 */

import { testDatabaseConnection, getDatabaseHealth, getDatabaseStats } from '../src/lib/database/config.js';

async function main() {
  console.log('🔍 Testing ChooseMyPower Database Connection');
  console.log('============================================\n');

  // Test basic connectivity
  console.log('1. Testing database connectivity...');
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    console.error('❌ Database connection failed!');
    console.error('\nPlease check:');
    console.error('• NETLIFY_DATABASE_URL is set correctly');
    console.error('• NETLIFY_DATABASE_URL_UNPOOLED is set correctly');
    console.error('• Database is accessible from this environment');
    console.error('• Network connectivity to Neon database');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful!\n');

  // Test health check
  console.log('2. Running database health check...');
  const health = await getDatabaseHealth();
  
  if (health.healthy) {
    console.log(`✅ Database is healthy (${health.responseTime}ms response time)`);
  } else {
    console.warn(`⚠️  Database health check failed: ${health.error}`);
  }
  console.log('');

  // Get current stats (if tables exist)
  console.log('3. Checking database statistics...');
  try {
    const stats = await getDatabaseStats();
    console.log('📊 Current Database Statistics:');
    console.log(`   • Providers: ${stats.providers}`);
    console.log(`   • Cities: ${stats.cities}`);
    console.log(`   • Active Plans: ${stats.activePlans}`);
    console.log(`   • Valid Cache Entries: ${stats.validCacheEntries}`);
    console.log(`   • API Calls (24h): ${stats.apiCallsLast24h}`);
  } catch (error) {
    console.log('⚠️  Database tables not yet created. Run setup-database.mjs first.');
  }
  
  console.log('\n🎉 Database test completed!');
  console.log('\nNext steps:');
  console.log('• Run "node scripts/setup-database.mjs" to initialize tables');
  console.log('• Update your actual database credentials in .env');
  console.log('• Start the development server with "npm run dev"');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();