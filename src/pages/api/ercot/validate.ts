import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    // Call ERCOT API to get detailed ESIID information
    const ercotResponse = await fetch(
      `https://ercot.api.comparepower.com/api/esiids/${esiid}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChooseMyPower/1.0'
        }
      }
    );

    if (!ercotResponse.ok) {
      console.error('ERCOT API validation error:', ercotResponse.status, ercotResponse.statusText);
      return new Response(JSON.stringify({ 
        error: 'Unable to validate service location' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const esiidDetails = await ercotResponse.json();

    return new Response(JSON.stringify(esiidDetails), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('ERCOT validation API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};