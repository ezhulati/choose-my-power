/**
 * Database configuration for Netlify
 * Simple export for database connection
 */

import { neon } from '@netlify/neon';

let db;

// Initialize database connection
const dbUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL;

if (dbUrl) {
  const sql = neon(dbUrl);
  db = {
    query: sql,
    sql: sql  // Expose the raw client as well
  };
} else {
  // Fallback for development or when database is not available
  console.warn('⚠️  Database not configured - using mock database functions');
  db = {
    async query(sql, params) {
      // Return properly structured mock data for testing
      const mockPlanData = [
        {
          id: 'mock-plan-1',
          provider: 'TXU Energy',
          plan_name: 'Mock Fixed 12',
          rate_type: 'fixed',
          price_per_kwh: 0.12,
          term_months: 12,
          early_termination_fee: 150,
          deposit_required: false,
          renewable_percentage: 0,
          promo_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-plan-2', 
          provider: 'Reliant Energy',
          plan_name: 'Mock Green 24',
          rate_type: 'fixed',
          price_per_kwh: 0.14,
          term_months: 24,
          early_termination_fee: 200,
          deposit_required: true,
          renewable_percentage: 100,
          promo_code: 'GREEN2025',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Return mock data structure that matches database query expectations
      return {
        ok: true,
        rows: mockPlanData,
        rowCount: mockPlanData.length,
        fields: [
          { name: 'id', dataTypeID: 25 },
          { name: 'provider', dataTypeID: 25 },
          { name: 'plan_name', dataTypeID: 25 }
        ]
      };
    },
    sql: async (strings, ...values) => {
      // Handle template literal SQL queries
      return db.query(strings.join('?'), values);
    }
  };
}

export { db };