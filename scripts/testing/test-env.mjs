#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔍 Environment Variable Test');
console.log('============================\n');

const dbUrl = process.env.NETLIFY_DATABASE_URL;
const unpooledUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED;

console.log('NETLIFY_DATABASE_URL exists:', dbUrl ? '✅ Yes' : '❌ No');
console.log('NETLIFY_DATABASE_URL_UNPOOLED exists:', unpooledUrl ? '✅ Yes' : '❌ No');

if (dbUrl) {
  console.log('\n🔍 Connection String Analysis:');
  console.log('- Starts with postgresql://:', dbUrl.startsWith('postgresql://') ? '✅' : '❌');
  console.log('- Contains username:', dbUrl.includes('restless-mouse') ? '✅' : '❌');
  console.log('- Contains @ symbol:', dbUrl.includes('@') ? '✅' : '❌');
  console.log('- Contains host:', dbUrl.includes('neon.tech') ? '✅' : '❌');
  console.log('- Length:', dbUrl.length, 'characters');
} else {
  console.log('\n❌ No database URL found - check .env file format');
}