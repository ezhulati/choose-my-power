/**
 * Database configuration for Netlify
 * Simple export for database connection
 */

import { neon } from '@netlify/neon';

let db;

// Initialize database connection
const dbUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL;

if (dbUrl) {
  db = neon(dbUrl);
} else {
  // Fallback for development or when database is not available
  console.warn('⚠️  Database not configured - using mock database functions');
  db = {
    async query() {
      return [];
    }
  };
}

export { db };