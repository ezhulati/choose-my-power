#!/usr/bin/env node

import { neon } from '@netlify/neon';
import { config } from 'dotenv';

// Load environment variables
config();

async function testConnection() {
  console.log('🔍 Testing Database Connection with SSL Options');
  console.log('===============================================\n');

  const baseUrl = process.env.NETLIFY_DATABASE_URL;
  
  if (!baseUrl) {
    console.error('❌ NETLIFY_DATABASE_URL not found');
    return;
  }

  // Try different SSL configurations
  const sslConfigs = [
    { name: 'Original URL', url: baseUrl },
    { name: 'Explicit SSL Required', url: baseUrl.replace('?sslmode=require', '') + '?sslmode=require' },
    { name: 'SSL Prefer', url: baseUrl.replace('?sslmode=require', '') + '?sslmode=prefer' },
  ];

  for (const config of sslConfigs) {
    console.log(`🔄 Testing: ${config.name}`);
    
    try {
      const sql = neon(config.url);
      const start = Date.now();
      const result = await sql`SELECT 1 as test, version() as db_version`;
      const responseTime = Date.now() - start;

      console.log(`✅ SUCCESS with ${config.name}`);
      console.log(`⚡ Response time: ${responseTime}ms`);
      console.log(`📊 Database: ${result[0].db_version.split(' ')[0]} ${result[0].db_version.split(' ')[1]}`);
      console.log('');
      
      // If we got here, the connection works!
      console.log('🎉 Database connection is working!');
      console.log('\nNext step: Run "npm run db:setup" to initialize tables');
      return;
      
    } catch (error) {
      console.log(`❌ Failed with ${config.name}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('❌ All connection attempts failed');
  console.log('\n🔧 Possible solutions:');
  console.log('1. Check if database is active in Netlify dashboard');
  console.log('2. Regenerate database credentials');
  console.log('3. Ensure database hasn\'t been paused/suspended');
}

testConnection();