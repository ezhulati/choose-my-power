/**
 * TDSP Information Seed Data
 * Seeds the tdsp_info table with major Texas utility companies
 */

import { db } from '../init';
import { tdspInfo, type NewTdspInfo, MAJOR_TDSPS, DEFAULT_TDSP_SEED_DATA } from '../schema/tdsp-info';

// Extended TDSP seed data with comprehensive service area information
const tdspSeedData: NewTdspInfo[] = [
  {
    duns: MAJOR_TDSPS.ONCOR.duns,
    name: MAJOR_TDSPS.ONCOR.name,
    zone: MAJOR_TDSPS.ONCOR.zone,
    serviceArea: [
      // Major North Texas cities
      'dallas', 'fort-worth', 'plano', 'irving', 'garland', 'mesquite', 'carrollton', 'richardson',
      'lewisville', 'flower-mound', 'frisco', 'mckinney', 'allen', 'denton', 'arlington',
      'grand-prairie', 'duncanville', 'desoto', 'cedar-hill', 'lancaster', 'wylie', 'rockwall',
      
      // Additional Oncor service areas
      'tyler', 'longview', 'marshall', 'kilgore', 'henderson', 'carthage', 'jefferson',
      'waco', 'temple', 'belton', 'killeen', 'copperas-cove', 'harker-heights',
      'corsicana', 'palestine', 'athens', 'canton', 'kaufman', 'terrell',
      
      // East Texas coverage
      'nacogdoches', 'lufkin', 'huntsville', 'conroe', 'willis', 'montgomery',
      'paris', 'sulphur-springs', 'greenville', 'commerce', 'mount-pleasant',
      
      // Central Texas extensions
      'waxahachie', 'ennis', 'midlothian', 'red-oak', 'glenn-heights'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.oncor.com',
      phone: '1-888-313-6862',
      customerService: '1-888-313-6862',
      emergencyContact: '1-888-313-4747',
      businessOffice: '1-214-486-2000',
      serviceTerritory: 'https://www.oncor.com/en/pages/service-areas.aspx',
      address: {
        street: '1616 Woodall Rodgers Freeway',
        city: 'Dallas',
        state: 'Texas',
        zipCode: '75202'
      }
    },
    apiEndpoint: 'https://www.oncor.com/api/territory/v1'
  },
  {
    duns: MAJOR_TDSPS.CENTERPOINT.duns,
    name: MAJOR_TDSPS.CENTERPOINT.name,
    zone: MAJOR_TDSPS.CENTERPOINT.zone,
    serviceArea: [
      // Greater Houston area
      'houston', 'baytown', 'pearland', 'sugar-land', 'the-woodlands', 'spring', 'tomball',
      'katy', 'cypress', 'humble', 'kingwood', 'atascocita', 'friendswood', 'league-city',
      'webster', 'clear-lake', 'seabrook', 'kemah', 'dickinson', 'texas-city', 'la-marque',
      
      // Harris County suburbs
      'pasadena', 'deer-park', 'bellaire', 'west-university-place', 'southside-place',
      'hunters-creek-village', 'piney-point-village', 'bunker-hill-village', 'hedwig-village',
      'jersey-village', 'jacinto-city', 'galena-park', 'cloverleaf', 'channelview',
      
      // Extended service areas
      'missouri-city', 'stafford', 'richmond', 'rosenberg', 'needville', 'wharton',
      'angleton', 'lake-jackson', 'clute', 'freeport', 'sweeny', 'west-columbia',
      
      // Montgomery County
      'magnolia', 'pinehurst', 'oak-ridge-north', 'shenandoah', 'cut-and-shoot',
      
      // Fort Bend County
      'fulshear', 'simonton', 'brookshire', 'sealy', 'bellville', 'hempstead'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.centerpointenergy.com',
      phone: '1-800-332-7143',
      customerService: '1-713-659-2111',
      emergencyContact: '1-713-207-2222',
      businessOffice: '1-713-207-1111',
      serviceTerritory: 'https://www.centerpointenergy.com/en-us/services/electricity/service-areas',
      address: {
        street: '1111 Louisiana Street',
        city: 'Houston',
        state: 'Texas',
        zipCode: '77002'
      }
    },
    apiEndpoint: 'https://www.centerpointenergy.com/api/service-area/v2'
  },
  {
    duns: MAJOR_TDSPS.AEP_NORTH.duns,
    name: MAJOR_TDSPS.AEP_NORTH.name,
    zone: MAJOR_TDSPS.AEP_NORTH.zone,
    serviceArea: [
      // West Texas major cities
      'abilene', 'amarillo', 'lubbock', 'odessa', 'midland', 'big-spring', 'sweetwater',
      'snyder', 'lamesa', 'levelland', 'plainview', 'hereford', 'canyon', 'pampa',
      
      // Panhandle region
      'borger', 'dumas', 'perryton', 'dalhart', 'childress', 'wellington', 'shamrock',
      'claude', 'tulia', 'muleshoe', 'littlefield', 'brownfield', 'tahoka',
      
      // Permian Basin
      'andrews', 'seminole', 'denver-city', 'seagraves', 'stanton', 'colorado-city',
      'san-angelo', 'ballinger', 'winters', 'brady', 'mason', 'llano',
      
      // Additional coverage areas
      'fredericksburg', 'kerrville', 'comfort', 'boerne', 'bandera', 'pipe-creek',
      'junction', 'sonora', 'eldorado', 'menard', 'fort-mckavett'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      customerService: '1-866-223-8508',
      emergencyContact: '1-877-373-4858',
      businessOffice: '1-940-720-2349',
      serviceTerritory: 'https://www.aeptexas.com/service-area/',
      address: {
        street: '2540 North IH-35',
        city: 'Corpus Christi',
        state: 'Texas',
        zipCode: '78408'
      }
    },
    apiEndpoint: 'https://www.aeptexas.com/api/north/v1'
  },
  {
    duns: MAJOR_TDSPS.AEP_CENTRAL.duns,
    name: MAJOR_TDSPS.AEP_CENTRAL.name,
    zone: MAJOR_TDSPS.AEP_CENTRAL.zone,
    serviceArea: [
      // South Texas major cities
      'corpus-christi', 'laredo', 'mcallen', 'harlingen', 'brownsville', 'edinburg', 'mission',
      'pharr', 'weslaco', 'mercedes', 'donna', 'alamo', 'san-juan', 'elsa', 'edcouch',
      
      // Rio Grande Valley
      'roma', 'rio-grande-city', 'zapata', 'hebbronville', 'falfurrias', 'kingsville',
      'alice', 'orange-grove', 'mathis', 'san-diego', 'beeville', 'george-west',
      
      // Coastal Bend
      'port-aransas', 'aransas-pass', 'ingleside', 'portland', 'gregory', 'taft',
      'sinton', 'odem', 'robstown', 'bishop', 'driscoll', 'petronila',
      
      // Webb County and surroundings
      'cotulla', 'dilley', 'pearsall', 'derby', 'encinal', 'artesia-wells',
      
      // Additional Central coverage
      'three-rivers', 'tilden', 'pleasanton', 'jourdanton', 'poteet', 'devine',
      'natalia', 'lytle', 'castroville', 'hondo', 'sabinal', 'knippa', 'uvalde'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      customerService: '1-866-223-8508',
      emergencyContact: '1-877-373-4858',
      businessOffice: '1-361-881-5300',
      serviceTerritory: 'https://www.aeptexas.com/service-area/',
      address: {
        street: '2540 North IH-35',
        city: 'Corpus Christi',
        state: 'Texas',
        zipCode: '78408'
      }
    },
    apiEndpoint: 'https://www.aeptexas.com/api/central/v1'
  },
  {
    duns: MAJOR_TDSPS.TNMP.duns,
    name: MAJOR_TDSPS.TNMP.name,
    zone: MAJOR_TDSPS.TNMP.zone,
    serviceArea: [
      // Southeast Texas
      'beaumont', 'port-arthur', 'orange', 'vidor', 'bridge-city', 'pinehurst', 'rose-city',
      'groves', 'nederland', 'port-neches', 'lumberton', 'silsbee', 'kountze', 'sour-lake',
      
      // Golden Triangle region
      'jasper', 'newton', 'burkeville', 'hemphill', 'san-augustine', 'center', 'tenaha',
      'timpson', 'gary', 'carthage', 'beckville', 'tatum', 'longview-south',
      
      // Coastal areas
      'galveston', 'texas-city', 'la-marque', 'hitchcock', 'santa-fe', 'dickinson-south',
      'bolivar-peninsula', 'crystal-beach', 'high-island', 'winnie', 'stowell',
      
      // Victoria area
      'victoria', 'port-lavaca', 'point-comfort', 'seadrift', 'bloomington', 'edna',
      'ganado', 'el-campo', 'wharton', 'east-bernard', 'boling', 'needville-east',
      
      // Additional TNMP territories
      'matagorda', 'palacios', 'bay-city', 'van-vleck', 'sweeny-east', 'brazoria',
      'angleton-east', 'danbury', 'alvin-south', 'manvel', 'rosharon'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.tnmp.com',
      phone: '1-888-866-7456',
      customerService: '1-888-866-7456',
      emergencyContact: '1-888-743-7898',
      businessOffice: '1-409-951-3100',
      serviceTerritory: 'https://www.tnmp.com/service-area',
      address: {
        street: '5555 San Felipe Road',
        city: 'Houston',
        state: 'Texas',
        zipCode: '77056'
      }
    },
    apiEndpoint: 'https://www.tnmp.com/api/territory/v1'
  }
];

// Additional smaller TDSPs for comprehensive coverage
const additionalTdspData: NewTdspInfo[] = [
  {
    duns: '0050088500',
    name: 'Sharyland Utilities',
    zone: 'Valley',
    serviceArea: [
      'mission-north', 'alton', 'palmhurst', 'los-alamos', 'lhoist-north-america',
      'sharyland', 'abram-perezville', 'palmview-south', 'la-joya', 'penitas'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.sharyland-utilities.com',
      phone: '1-956-585-3636',
      customerService: '1-956-585-3636',
      serviceTerritory: 'https://www.sharyland-utilities.com/service-area'
    }
  },
  {
    duns: '0084070200',
    name: 'Magic Valley Electric Cooperative',
    zone: 'Valley',
    serviceArea: [
      'mercedes-east', 'weslaco-east', 'donna-east', 'alamo-east', 'san-juan-east',
      'pharr-east', 'mcallen-east', 'hidalgo', 'granjeno', 'lopezville',
      'progreso', 'progreso-lakes', 'los-indios', 'rio-hondo', 'san-benito',
      'harlingen-east', 'combes', 'la-feria', 'santa-rosa', 'primera'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.mvec.net',
      phone: '1-956-383-6651',
      customerService: '1-956-383-6651',
      emergencyContact: '1-956-383-6651'
    }
  },
  {
    duns: '0006101700',
    name: 'Entergy Texas',
    zone: 'East',
    serviceArea: [
      'beaumont-north', 'orange-north', 'vidor-north', 'bridge-city-north',
      'pinehurst-north', 'lumberton-north', 'silsbee-north', 'kountze-north',
      'woodville', 'chester', 'colmesneil', 'warren', 'fred', 'spurger',
      'hillister', 'saratoga', 'batson', 'daisetta', 'hull', 'liberty',
      'dayton', 'cleveland', 'splendora', 'new-caney', 'porter', 'kingwood-north'
    ],
    isActive: true,
    contactInfo: {
      website: 'https://www.entergy-texas.com',
      phone: '1-800-368-3749',
      customerService: '1-800-368-3749',
      emergencyContact: '1-800-9OUTAGE'
    }
  }
];

/**
 * Seed TDSP information table with major Texas utilities
 */
export async function seedTdspInfo() {
  try {
    console.warn('🌱 Starting TDSP information seed...');
    
    // Insert major TDSPs first
    const majorInserted = await db.insert(tdspInfo).values(tdspSeedData).returning();
    
    console.warn(`✅ Successfully seeded ${majorInserted.length} major TDSPs:`);
    majorInserted.forEach(tdsp => {
      console.warn(`   - ${tdsp.name} (${tdsp.duns}) - Zone: ${tdsp.zone}, Cities: ${(tdsp.serviceArea as string[]).length}`);
    });
    
    // Insert additional smaller TDSPs
    const additionalInserted = await db.insert(tdspInfo).values(additionalTdspData).returning();
    
    console.warn(`✅ Successfully seeded ${additionalInserted.length} additional TDSPs:`);
    additionalInserted.forEach(tdsp => {
      console.warn(`   - ${tdsp.name} (${tdsp.duns}) - Zone: ${tdsp.zone}, Cities: ${(tdsp.serviceArea as string[]).length}`);
    });
    
    const totalInserted = [...majorInserted, ...additionalInserted];
    
    console.warn(`\n📊 TDSP Coverage Summary:`);
    console.warn(`   - Total TDSPs: ${totalInserted.length}`);
    console.warn(`   - North Zone: ${totalInserted.filter(t => t.zone === 'North').length}`);
    console.warn(`   - Coast Zone: ${totalInserted.filter(t => t.zone === 'Coast').length}`);
    console.warn(`   - Central Zone: ${totalInserted.filter(t => t.zone === 'Central').length}`);
    console.warn(`   - South Zone: ${totalInserted.filter(t => t.zone === 'South').length}`);
    console.warn(`   - Valley Zone: ${totalInserted.filter(t => t.zone === 'Valley').length}`);
    
    // Calculate total cities covered
    const totalCities = totalInserted.reduce((sum, tdsp) => sum + (tdsp.serviceArea as string[]).length, 0);
    console.warn(`   - Total Cities Covered: ${totalCities}`);
    
    return totalInserted;
  } catch (error) {
    console.error('❌ Error seeding TDSP information:', error);
    throw error;
  }
}

/**
 * Update TDSP service area coverage (for maintenance)
 */
export async function updateTdspServiceAreas() {
  try {
    console.warn('🔄 Updating TDSP service areas...');
    
    // This could be used to add new cities to existing TDSPs
    const updateCount = await db
      .update(tdspInfo)
      .set({ lastUpdated: new Date() })
      .where(eq(tdspInfo.isActive, true))
      .returning();
    
    console.warn(`✅ Updated ${updateCount.length} TDSP records with current timestamp`);
    return updateCount;
  } catch (error) {
    console.error('❌ Error updating TDSP service areas:', error);
    throw error;
  }
}

/**
 * Get TDSP coverage statistics
 */
export async function getTdspCoverageStats() {
  try {
    const allTdsps = await db.select().from(tdspInfo).where(eq(tdspInfo.isActive, true));
    
    const stats = {
      totalTdsps: allTdsps.length,
      byZone: {
        North: allTdsps.filter(t => t.zone === 'North').length,
        Coast: allTdsps.filter(t => t.zone === 'Coast').length,
        Central: allTdsps.filter(t => t.zone === 'Central').length,
        South: allTdsps.filter(t => t.zone === 'South').length,
        Valley: allTdsps.filter(t => t.zone === 'Valley').length
      },
      totalCitiesCovered: allTdsps.reduce((sum, tdsp) => sum + (tdsp.serviceArea as string[]).length, 0),
      avgCitiesPerTdsp: Math.round(
        allTdsps.reduce((sum, tdsp) => sum + (tdsp.serviceArea as string[]).length, 0) / allTdsps.length
      ),
      largestTdsp: allTdsps.reduce((largest, current) => 
        (current.serviceArea as string[]).length > (largest.serviceArea as string[]).length ? current : largest
      )
    };
    
    console.warn('📊 TDSP Coverage Statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting TDSP coverage stats:', error);
    throw error;
  }
}

// Export for use in main seed runner
export { tdspSeedData, additionalTdspData };

import { eq } from 'drizzle-orm';