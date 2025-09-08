// Test fixtures for ZIP code validation and TDSP mapping
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import { 
  ZIPValidationResult, 
  CityZipCodesResponse, 
  FormInteraction, 
  ZIPCodeLookup 
} from '../../src/types/zip-validation';

// Dallas ZIP codes (Oncor TDSP)
export const DALLAS_ZIP_CODES = [
  '75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208',
  '75209', '75210', '75211', '75212', '75214', '75215', '75216', '75217',
  '75218', '75219', '75220', '75221', '75222', '75223', '75224', '75225',
  '75226', '75227', '75228', '75229', '75230', '75231', '75232', '75233',
  '75234', '75235', '75236', '75237', '75238', '75240', '75241', '75242',
  '75243', '75244', '75245', '75246', '75247', '75248', '75249', '75250',
  '75251', '75252', '75253', '75254', '75260', '75261', '75262', '75263',
  '75264', '75265', '75266', '75267', '75270', '75275', '75277', '75283',
  '75284', '75285', '75286', '75287', '75390', '75391', '75392', '75393',
  '75394', '75395', '75396', '75397', '75398'
];

// Houston ZIP codes (CenterPoint TDSP)
export const HOUSTON_ZIP_CODES = [
  '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008',
  '77009', '77010', '77011', '77012', '77013', '77014', '77015', '77016',
  '77017', '77018', '77019', '77020', '77021', '77022', '77023', '77024',
  '77025', '77026', '77027', '77028', '77029', '77030', '77031', '77032',
  '77033', '77034', '77035', '77036', '77037', '77038', '77039', '77040',
  '77041', '77042', '77043', '77044', '77045', '77046', '77047', '77048',
  '77049', '77050', '77051', '77052', '77053', '77054', '77055', '77056',
  '77057', '77058', '77059', '77060', '77061', '77062', '77063', '77064',
  '77065', '77066', '77067', '77068', '77069', '77070', '77071', '77072',
  '77073', '77074', '77075', '77076', '77077', '77078', '77079', '77080',
  '77081', '77082', '77083', '77084', '77085', '77086', '77087', '77088',
  '77089', '77090', '77091', '77092', '77093', '77094', '77095', '77096',
  '77098', '77099', '77201', '77202', '77203', '77204', '77205', '77206',
  '77207', '77208', '77209', '77210', '77212', '77213', '77215', '77216',
  '77217', '77218', '77219', '77220', '77221', '77222', '77223', '77224',
  '77225', '77226', '77227', '77228', '77229', '77230', '77231', '77233',
  '77234', '77235', '77236', '77237', '77238', '77240', '77241', '77242',
  '77243', '77244', '77245', '77248', '77249', '77251', '77252', '77253',
  '77254', '77255', '77256', '77257', '77258', '77259', '77260', '77261',
  '77262', '77263', '77265', '77266', '77267', '77268', '77269', '77270',
  '77271', '77272', '77273', '77274', '77275', '77277', '77279', '77280',
  '77282', '77284', '77287', '77288', '77289', '77290', '77291', '77292',
  '77293', '77297', '77298', '77299'
];

// Austin ZIP codes (Austin Energy/Oncor mixed)
export const AUSTIN_ZIP_CODES = [
  '78701', '78702', '78703', '78704', '78705', '78712', '78713', '78714',
  '78715', '78716', '78717', '78718', '78719', '78720', '78721', '78722',
  '78723', '78724', '78725', '78726', '78727', '78728', '78729', '78730',
  '78731', '78732', '78733', '78734', '78735', '78736', '78737', '78738',
  '78739', '78741', '78742', '78744', '78745', '78746', '78747', '78748',
  '78749', '78750', '78751', '78752', '78753', '78754', '78755', '78756',
  '78757', '78758', '78759', '78760', '78761', '78762', '78763', '78764',
  '78765', '78766', '78767', '78768', '78769', '78772', '78773', '78774',
  '78775', '78778', '78779', '78780', '78781', '78783', '78799'
];

// TDSP mappings for test data
export const TDSP_MAPPINGS = {
  'oncor': {
    name: 'Oncor Electric Delivery Company',
    cities: ['dallas', 'fort-worth', 'arlington', 'irving', 'plano', 'garland'],
    zipSamples: DALLAS_ZIP_CODES.slice(0, 10)
  },
  'centerpoint': {
    name: 'CenterPoint Energy Houston Electric',
    cities: ['houston', 'sugar-land', 'baytown', 'pasadena'],
    zipSamples: HOUSTON_ZIP_CODES.slice(0, 10)
  },
  'aep-texas': {
    name: 'AEP Texas',
    cities: ['corpus-christi', 'beaumont', 'port-arthur'],
    zipSamples: ['78401', '78402', '78404', '77701', '77702', '77706']
  },
  'tnmp': {
    name: 'Texas-New Mexico Power Company',
    cities: ['lubbock', 'amarillo', 'abilene'],
    zipSamples: ['79401', '79402', '79404', '79101', '79102', '79107']
  }
};

// Valid ZIP validation results for testing
export const VALID_ZIP_RESULTS: Record<string, ZIPValidationResult> = {
  '75201': {
    zipCode: '75201',
    isValid: true,
    tdsp: 'oncor',
    citySlug: 'dallas-tx',
    redirectUrl: '/electricity-plans/dallas-tx?zip=75201',
    availablePlans: 42,
    errorMessage: null,
    suggestions: []
  },
  '77001': {
    zipCode: '77001',
    isValid: true,
    tdsp: 'centerpoint',
    citySlug: 'houston-tx',
    redirectUrl: '/electricity-plans/houston-tx?zip=77001',
    availablePlans: 38,
    errorMessage: null,
    suggestions: []
  },
  '78701': {
    zipCode: '78701',
    isValid: true,
    tdsp: 'austin-energy',
    citySlug: 'austin-tx',
    redirectUrl: '/electricity-plans/austin-tx?zip=78701',
    availablePlans: 24,
    errorMessage: null,
    suggestions: []
  }
};

// Invalid ZIP validation results for testing
export const INVALID_ZIP_RESULTS: Record<string, ZIPValidationResult> = {
  '12345': {
    zipCode: '12345',
    isValid: false,
    tdsp: null,
    citySlug: null,
    redirectUrl: null,
    availablePlans: 0,
    errorMessage: 'ZIP code 12345 is not in Texas electricity service area',
    suggestions: ['75201', '75202', '75203']
  },
  '90210': {
    zipCode: '90210',
    isValid: false,
    tdsp: null,
    citySlug: null,
    redirectUrl: null,
    availablePlans: 0,
    errorMessage: 'ZIP code 90210 is not in Texas electricity service area',
    suggestions: ['77001', '77002', '77003']
  },
  'ABCDE': {
    zipCode: 'ABCDE',
    isValid: false,
    tdsp: null,
    citySlug: null,
    redirectUrl: null,
    availablePlans: 0,
    errorMessage: 'ZIP code must be exactly 5 digits',
    suggestions: []
  }
};

// City ZIP codes responses for testing
export const CITY_ZIP_RESPONSES: Record<string, CityZipCodesResponse> = {
  'dallas-tx': {
    citySlug: 'dallas-tx',
    cityName: 'Dallas',
    zipCodes: DALLAS_ZIP_CODES.slice(0, 5).map(zip => ({
      zipCode: zip,
      tdsp: 'oncor',
      planCount: 42
    })),
    totalZipCodes: DALLAS_ZIP_CODES.length
  },
  'houston-tx': {
    citySlug: 'houston-tx',
    cityName: 'Houston',
    zipCodes: HOUSTON_ZIP_CODES.slice(0, 5).map(zip => ({
      zipCode: zip,
      tdsp: 'centerpoint',
      planCount: 38
    })),
    totalZipCodes: HOUSTON_ZIP_CODES.length
  }
};

// Sample form interactions for testing
export const SAMPLE_FORM_INTERACTIONS: FormInteraction[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    zipCode: '75201',
    cityPage: 'dallas-tx',
    action: 'submit',
    timestamp: new Date('2025-01-09T10:30:00Z'),
    duration: 5000,
    deviceType: 'desktop',
    success: true,
    sessionId: 'session123'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    zipCode: '77001',
    cityPage: 'houston-tx',
    action: 'submit',
    timestamp: new Date('2025-01-09T11:00:00Z'),
    duration: 3500,
    deviceType: 'mobile',
    success: true,
    sessionId: 'session456'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    zipCode: '12345',
    cityPage: 'dallas-tx',
    action: 'error',
    timestamp: new Date('2025-01-09T11:30:00Z'),
    duration: 8000,
    deviceType: 'mobile',
    success: false,
    sessionId: 'session789'
  }
];

// Sample ZIP code lookups for database testing
export const SAMPLE_ZIP_LOOKUPS: ZIPCodeLookup[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    zipCode: '75201',
    citySlug: 'dallas-tx',
    timestamp: new Date('2025-01-09T10:30:00Z'),
    isValid: true,
    tdspId: 'oncor',
    redirectUrl: '/electricity-plans/dallas-tx?zip=75201',
    errorCode: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session123'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    zipCode: '12345',
    citySlug: 'dallas-tx',
    timestamp: new Date('2025-01-09T11:30:00Z'),
    isValid: false,
    tdspId: null,
    redirectUrl: null,
    errorCode: 'ZIP_NOT_IN_TEXAS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    sessionId: 'session789'
  }
];

// Mock ERCOT API responses
export const MOCK_ERCOT_RESPONSES = {
  valid: {
    '75201': {
      esiid: '10123456789012345',
      tdsp: 'oncor',
      status: 'active',
      serviceAddress: 'Dallas, TX 75201'
    }
  },
  invalid: {
    '12345': {
      error: 'Invalid ZIP code',
      message: 'ZIP code not found in Texas service territories'
    }
  }
};

// Performance test data
export const PERFORMANCE_TEST_ZIPS = [
  ...DALLAS_ZIP_CODES.slice(0, 20),
  ...HOUSTON_ZIP_CODES.slice(0, 20),
  ...AUSTIN_ZIP_CODES.slice(0, 10)
];

// Device detection test data
export const USER_AGENTS = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
};

// Rate limiting test data
export const RATE_LIMIT_TEST_REQUESTS = Array.from({ length: 15 }, (_, i) => ({
  zipCode: `7520${i.toString().padStart(1, '0')}`,
  citySlug: 'dallas-tx',
  timestamp: new Date(Date.now() + i * 1000)
}));