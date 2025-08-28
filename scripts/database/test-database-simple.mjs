#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Tests the Netlify Neon database connection directly
 */

import { neon } from '@netlify/neon';
import { config } from 'dotenv';

// Load environment variables
config();

async function testConnection() {
  console.log('🔍 Testing ChooseMyPower Database Connection');
  console.log('============================================\n');

  const dbUrl = process.env.NETLIFY_DATABASE_URL;
  const unpooledUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED;

  if (!dbUrl || !unpooledUrl) {
    console.error('❌ Environment variables not found!');
    console.error('Please ensure these are set in your .env file:');
    console.error('- NETLIFY_DATABASE_URL');
    console.error('- NETLIFY_DATABASE_URL_UNPOOLED');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('🔄 Testing database connection...\n');

  try {
    // Test pooled connection
    const sql = neon(dbUrl);
    const start = Date.now();
    const result = await sql`SELECT 1 as test, NOW() as timestamp`;
    const responseTime = Date.now() - start;

    console.log('✅ Database connection successful!');
    console.log(`⚡ Response time: ${responseTime}ms`);
    console.log(`🕒 Server time: ${result[0].timestamp}`);
    console.log('');

    // Test basic query
    console.log('🔍 Testing table existence...');
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      if (tables.length > 0) {
        console.log('✅ Found existing tables:');
        tables.forEach(table => {
          console.log(`   • ${table.table_name}`);
        });
      } else {
        console.log('ℹ️  No tables found - database is ready for setup');
      }
    } catch (tableError) {
      console.log('ℹ️  Could not check tables (expected for new database)');
    }

    console.log('\n🎉 Database test completed successfully!');
    console.log('\nNext steps:');
    console.log('• Run "npm run db:setup" to initialize tables');
    console.log('• Your database is ready to use!');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('• Database credentials in .env file');
    console.error('• Network connectivity');
    console.error('• Database is running on Netlify');
    process.exit(1);
  }
}

testConnection();