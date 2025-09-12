import type { APIRoute } from 'astro';
import { validateESIID, type ESIIDDetails } from '../../../lib/services/ercot-service.ts';
import { initializeDatabase } from '../../../lib/database/init.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Initialize database if needed
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('Database initialization skipped (may already be initialized):', dbError.message);
    }

    const body = await request.json();
    const { esiid } = body;

    if (!esiid) {
      return new Response(JSON.stringify({ 
        error: 'ESIID is required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate ESIID format (should be 17 digits starting with 10)
    if (!/^10\d{15}$/.test(esiid)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid ESIID format. Must be 17 digits starting with 10.' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Get ESIID details from database-driven service
    const esiidDetails = await validateESIID(esiid);

    if (!esiidDetails) {
      return new Response(JSON.stringify({ 
        error: 'ESIID not found or invalid' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // ESIID validation successful - logging removed to comply with ESLint rules

    return new Response(JSON.stringify(esiidDetails), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ ERCOT validation API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};