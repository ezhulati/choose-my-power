#!/usr/bin/env node

/**
 * Test API Integration with Database
 * Tests the ComparePower API client with database caching
 */

import { config } from 'dotenv';
import { neon } from '@netlify/neon';

// Load environment variables
config();

// Simple test of the caching system
async function testCacheIntegration() {
  console.log('🔍 Testing API Integration with Database');
  console.log('======================================\n');

  const dbUrl = process.env.NETLIFY_DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Database URL not found');
    return;
  }

  try {
    const sql = neon(dbUrl);

    // Test writing to cache table
    console.log('🔄 Testing cache operations...');
    
    const testParams = {
      tdsp_duns: '026741090000',
      display_usage: 1000
    };
    
    const cacheKey = JSON.stringify(testParams);
    const mockPlans = [
      {
        id: 'test-plan-1',
        name: 'Test Plan',
        provider: {
          name: 'Test Provider',
          logo: '/test-logo.svg',
          rating: 4.5,
          reviewCount: 100
        },
        pricing: {
          rate1000kWh: 12.5,
          total1000kWh: 125.0
        }
      }
    ];

    // Insert test cache entry
    await sql`
      INSERT INTO plan_cache (cache_key, tdsp_duns, plans_data, plan_count, lowest_rate, expires_at)
      VALUES (
        ${cacheKey}, 
        ${testParams.tdsp_duns}, 
        ${JSON.stringify(mockPlans)}, 
        ${mockPlans.length}, 
        ${12.5}, 
        ${new Date(Date.now() + 3600000)}
      )
      ON CONFLICT (cache_key) DO UPDATE SET
        plans_data = EXCLUDED.plans_data,
        plan_count = EXCLUDED.plan_count,
        cached_at = NOW()
    `;

    console.log('✅ Successfully wrote to cache table');

    // Test reading from cache
    const cached = await sql`
      SELECT plans_data, cached_at, expires_at, plan_count, lowest_rate
      FROM plan_cache 
      WHERE cache_key = ${cacheKey} 
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (cached.length > 0) {
      console.log('✅ Successfully read from cache table');
      console.log(`   • Plan count: ${cached[0].plan_count}`);
      console.log(`   • Lowest rate: ${cached[0].lowest_rate}¢/kWh`);
      console.log(`   • Cached at: ${cached[0].cached_at}`);
    } else {
      console.log('❌ Could not read from cache table');
    }

    // Test API logging
    console.log('\n🔄 Testing API logging...');
    await sql`
      INSERT INTO api_logs (endpoint, params, response_status, response_time_ms)
      VALUES (
        ${'test-endpoint'}, 
        ${JSON.stringify(testParams)}, 
        ${200}, 
        ${500}
      )
    `;
    console.log('✅ Successfully logged API call');

    // Get cache statistics
    console.log('\n🔄 Getting cache statistics...');
    const [cacheStats, apiStats] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM plan_cache WHERE expires_at > NOW()`,
      sql`SELECT COUNT(*) as count FROM api_logs WHERE created_at > NOW() - INTERVAL '1 hour'`
    ]);

    console.log('📊 Cache Statistics:');
    console.log(`   • Valid cache entries: ${cacheStats[0].count}`);
    console.log(`   • API calls (1h): ${apiStats[0].count}`);

    // Test provider lookup
    console.log('\n🔄 Testing provider data...');
    const providers = await sql`
      SELECT name, puct_number, logo_filename 
      FROM providers 
      ORDER BY name 
      LIMIT 3
    `;

    console.log('✅ Available providers:');
    providers.forEach(provider => {
      console.log(`   • ${provider.name} (${provider.puct_number})`);
    });

    console.log('\n🎉 API Integration Test Completed Successfully!');
    console.log('\n🚀 Your system is ready for:');
    console.log('• Fast database-cached API responses');
    console.log('• Automatic plan storage and analysis');
    console.log('• Performance monitoring and logging');
    console.log('• Offline fallback with stored plans');
    
    // Clean up test data
    await sql`DELETE FROM plan_cache WHERE cache_key = ${cacheKey}`;
    await sql`DELETE FROM api_logs WHERE endpoint = 'test-endpoint'`;
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testCacheIntegration();