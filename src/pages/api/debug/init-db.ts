import type { APIRoute } from 'astro';
import { initializeDatabase } from '../../../lib/database/init.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    
    const result = await initializeDatabase();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database initialization completed successfully',
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};