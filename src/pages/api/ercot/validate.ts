import type { APIRoute } from 'astro';

interface ESIIDDetails {
  esiid: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  tdsp: string;
  tdsp_code: string;
  meter_type: string;
  service_class: string;
  rate_class: string;
  load_profile: string;
  status: string;
  premise_type: string;
  switch_hold: boolean;
  market_participant: string;
  created_date: string;
  updated_date: string;
}

// Mock data generator for detailed ESIID validation
const generateESIIDDetails = (esiid: string): ESIIDDetails => {
  // Extract ZIP area from ESIID (simplified logic)
  const esiidNum = parseInt(esiid);
  const zipBase = Math.floor((esiidNum % 100000) + 75000);
  
  // Determine service area details based on ESIID pattern
  let tdsp = 'Oncor Electric Delivery';
  let tdspCode = 'ONCOR';
  let city = 'Dallas';
  let county = 'Dallas';
  
  if (zipBase >= 77000 && zipBase <= 77999) {
    tdsp = 'CenterPoint Energy';
    tdspCode = 'CNPE';
    city = 'Houston';
    county = 'Harris';
  } else if (zipBase >= 78000 && zipBase <= 78999) {
    tdsp = 'AEP Texas';
    tdspCode = 'AEPTX';
    city = 'Austin';
    county = 'Travis';
  } else if (zipBase >= 79000 && zipBase <= 79999) {
    tdsp = 'TNMP (Texas-New Mexico Power)';
    tdspCode = 'TNMP';
    city = 'El Paso';
    county = 'El Paso';
  } else if (zipBase >= 76000 && zipBase <= 76999) {
    tdsp = 'Oncor Electric Delivery';
    tdspCode = 'ONCOR';
    city = 'Fort Worth';
    county = 'Tarrant';
  }

  // Generate realistic address based on city
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const streetNames = [
    'Main St', 'Oak Ave', 'Pine Dr', 'Elm St', 'Maple Ave', 
    'Cedar Ln', 'Park Blvd', 'First Ave', 'Second St', 'Third Dr'
  ];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const address = `${streetNumber} ${streetName}`;

  const serviceClasses = ['Residential', 'Commercial', 'Industrial'];
  const rateClasses = ['R1', 'R2', 'GS', 'GP', 'LI'];
  const loadProfiles = ['R1', 'R2', 'SH', 'WH', 'GS'];
  const meterTypes = ['Smart Meter', 'Electric', 'AMR', 'AMI'];
  const premiseTypes = ['Single Family', 'Apartment', 'Condo', 'Townhouse', 'Commercial'];

  // Generate timestamps
  const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
  const updatedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    esiid,
    address,
    city,
    state: 'TX',
    zip: zipBase.toString(),
    county,
    tdsp,
    tdsp_code: tdspCode,
    meter_type: meterTypes[Math.floor(Math.random() * meterTypes.length)],
    service_class: serviceClasses[Math.floor(Math.random() * serviceClasses.length)],
    rate_class: rateClasses[Math.floor(Math.random() * rateClasses.length)],
    load_profile: loadProfiles[Math.floor(Math.random() * loadProfiles.length)],
    status: 'Active',
    premise_type: premiseTypes[Math.floor(Math.random() * premiseTypes.length)],
    switch_hold: Math.random() > 0.9, // 10% chance of switch hold
    market_participant: `${tdspCode}_MP`,
    created_date: createdDate,
    updated_date: updatedDate
  };
};

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

    // Generate mock ESIID details
    const esiidDetails = generateESIIDDetails(esiid);

    // Add small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

    console.log(`Generated mock validation details for ESIID: ${esiid}`);

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