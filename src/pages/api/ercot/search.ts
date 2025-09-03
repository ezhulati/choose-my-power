import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { address, zipCode } = body;

    if (!address || !zipCode) {
      return new Response(JSON.stringify({ 
        error: 'Address and ZIP code are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Call ERCOT API to search for ESIIDs
    const ercotResponse = await fetch(
      `https://ercot.api.comparepower.com/api/esiids?address=${encodeURIComponent(address)}&zip_code=${zipCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChooseMyPower/1.0'
        }
      }
    );

    if (!ercotResponse.ok) {
      console.error('ERCOT API error:', ercotResponse.status, ercotResponse.statusText);
      return new Response(JSON.stringify({ 
        error: 'Unable to search for service locations' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const locations = await ercotResponse.json();

    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('ERCOT search API error:', error);
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