/**
 * Comprehensive ZIP Code Service
 * Uses a comprehensive offline database of Texas ZIP codes
 * Maps any Texas ZIP to the nearest supported electricity market
 */

interface ComprehensiveZIPResult {
  success: boolean;
  zipCode: string;
  cityName?: string;
  citySlug?: string;
  cityDisplayName?: string;
  redirectUrl?: string;
  county?: string;
  isTexas?: boolean;
  isDeregulated?: boolean;
  municipalUtility?: boolean;
  utilityName?: string;
  utilityInfo?: string;
  confidence?: number;
  error?: string;
  errorType?: 'invalid_zip' | 'non_texas' | 'non_deregulated' | 'not_found';
  processingTime?: number;
}

/**
 * Comprehensive Texas ZIP Code Database
 * Based on USPS data and Texas geography
 */
class TexasZIPDatabase {
  private zipDatabase = new Map<string, {
    city: string;
    county: string;
    region: string;
    latitude?: number;
    longitude?: number;
  }>();

  constructor() {
    this.loadZIPDatabase();
  }

  private loadZIPDatabase() {
    // Comprehensive Texas ZIP codes database (major cities and regions)
    const texasZIPs = [
      // Houston Metro Area (77xxx range)
      { zip: '77001', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77002', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77003', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77004', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77005', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77006', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77007', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77008', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77009', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77010', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77011', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77012', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77013', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77014', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77015', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77016', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77017', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77018', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77019', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77020', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77021', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77022', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77023', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77024', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77025', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77026', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77027', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77028', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77029', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77030', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77031', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77032', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77033', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77034', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77035', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77036', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77037', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77038', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77039', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77040', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77041', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77042', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77043', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77044', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77045', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77046', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77047', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77048', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77049', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77050', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77051', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77052', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77053', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77054', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77055', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77056', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77057', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77058', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77059', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77060', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77061', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77062', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77063', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77064', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77065', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77066', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77067', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77068', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77069', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77070', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77071', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77072', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77073', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77074', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77075', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77076', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77077', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77078', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77079', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77080', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77081', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77082', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77083', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77084', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77085', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77086', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77087', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77088', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77089', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77090', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77091', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77092', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77093', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77094', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77095', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77096', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77097', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77098', city: 'Houston', county: 'Harris', region: 'Coast' },
      { zip: '77099', city: 'Houston', county: 'Harris', region: 'Coast' },
      
      // Houston suburbs and surrounding areas
      { zip: '77301', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77302', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77303', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77304', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77316', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77318', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77320', city: 'Huntsville', county: 'Walker', region: 'Coast' },
      { zip: '77340', city: 'Huntsville', county: 'Walker', region: 'Coast' },
      { zip: '77341', city: 'Huntsville', county: 'Walker', region: 'Coast' },
      { zip: '77384', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77385', city: 'Conroe', county: 'Montgomery', region: 'Coast' },
      { zip: '77404', city: 'Katy', county: 'Harris', region: 'Coast' },
      { zip: '77449', city: 'Katy', county: 'Fort Bend', region: 'Coast' },
      { zip: '77450', city: 'Katy', county: 'Fort Bend', region: 'Coast' },
      { zip: '77493', city: 'Katy', county: 'Fort Bend', region: 'Coast' },
      { zip: '77494', city: 'Katy', county: 'Fort Bend', region: 'Coast' },
      
      // College Station / Bryan Area (Brazos County)
      { zip: '77801', city: 'Bryan', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77802', city: 'Bryan', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77803', city: 'Bryan', county: 'Brazos', region: 'Coast' }, // Municipal utility  
      { zip: '77807', city: 'Bryan', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77808', city: 'Bryan', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77840', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77841', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77842', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77843', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77844', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      { zip: '77845', city: 'College Station', county: 'Brazos', region: 'Coast' }, // Municipal utility
      
      // Dallas Metro Area (75xxx range)
      { zip: '75201', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75202', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75203', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75204', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75205', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75206', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75207', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75208', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75209', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75210', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75211', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75212', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75214', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75215', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75216', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75217', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75218', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75219', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75220', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75221', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75222', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75223', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75224', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75225', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75226', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75227', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75228', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75229', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75230', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75231', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75232', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75233', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75234', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75235', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75236', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75237', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75238', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75240', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75241', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75243', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75244', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75246', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75247', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75248', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75249', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75250', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75251', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75252', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75253', city: 'Dallas', county: 'Dallas', region: 'North' },
      { zip: '75254', city: 'Dallas', county: 'Dallas', region: 'North' },

      // Austin Area (78xxx range - mostly municipal utilities)
      { zip: '78701', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78702', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78703', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78704', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78705', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78712', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78713', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78714', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78715', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78716', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78717', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78718', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78719', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78720', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78721', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78722', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78723', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78724', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78725', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78726', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78727', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78728', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78729', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78730', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78731', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78732', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78733', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78734', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78735', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78736', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78737', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78738', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78739', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78741', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78742', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78744', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78745', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78746', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78747', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78748', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78749', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78750', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78751', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78752', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78753', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78754', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78755', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78756', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78757', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78758', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy
      { zip: '78759', city: 'Austin', county: 'Travis', region: 'Central' }, // Austin Energy

      // San Antonio Area (78xxx range - mostly CPS Energy municipal utility)
      { zip: '78201', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78202', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78203', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78204', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78205', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78206', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78207', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78208', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78209', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78210', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78211', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78212', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78213', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78214', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78215', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78216', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78217', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78218', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78219', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78220', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78221', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78222', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78223', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78224', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78225', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78226', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78227', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78228', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78229', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78230', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78231', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78232', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78233', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78234', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78235', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78236', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78237', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78238', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78239', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78240', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78241', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78242', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78244', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78245', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78246', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78247', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78248', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78249', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78250', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78251', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78252', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78253', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78254', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78255', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78256', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78257', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78258', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78259', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78260', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78261', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78263', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78264', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78265', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78266', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78268', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy
      { zip: '78269', city: 'San Antonio', county: 'Bexar', region: 'South' }, // CPS Energy

      // Other major cities
      { zip: '79401', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79402', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79403', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79404', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79407', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79410', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79411', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79412', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79413', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79414', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79415', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79416', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79423', city: 'Lubbock', county: 'Lubbock', region: 'West' },
      { zip: '79424', city: 'Lubbock', county: 'Lubbock', region: 'West' },

      // More comprehensive coverage
      { zip: '76101', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76102', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76103', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76104', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76105', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76106', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76107', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76108', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76109', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76110', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76111', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76112', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76114', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76115', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76116', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76117', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76118', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76119', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76120', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76121', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76122', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76123', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76124', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76126', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76127', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76129', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76131', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76132', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76133', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76134', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76135', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76136', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76137', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76140', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76148', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76164', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76177', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76179', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76180', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76181', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76182', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76185', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76191', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76192', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76196', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76197', city: 'Fort Worth', county: 'Tarrant', region: 'North' },
      { zip: '76199', city: 'Fort Worth', county: 'Tarrant', region: 'North' },

      // Corpus Christi area
      { zip: '78401', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78402', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78403', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78404', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78405', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78406', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78407', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78408', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78409', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78410', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78411', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78412', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78413', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78414', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78415', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78416', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78417', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78418', city: 'Corpus Christi', county: 'Nueces', region: 'South' },
      { zip: '78419', city: 'Corpus Christi', county: 'Nueces', region: 'South' },

      // Tyler area  
      { zip: '75701', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75702', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75703', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75704', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75706', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75707', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75708', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75709', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75710', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75711', city: 'Tyler', county: 'Smith', region: 'North' },
      { zip: '75712', city: 'Tyler', county: 'Smith', region: 'North' },

      // Amarillo area
      { zip: '79101', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79102', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79103', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79104', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79105', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79106', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79107', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79108', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79109', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79110', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79111', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79114', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79118', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79119', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79120', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79121', city: 'Amarillo', county: 'Potter', region: 'West' },
      { zip: '79124', city: 'Amarillo', county: 'Potter', region: 'West' },

      // Waco area
      { zip: '76701', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76702', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76703', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76704', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76705', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76706', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76707', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76708', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76710', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76711', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76712', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76714', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76715', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76716', city: 'Waco', county: 'McLennan', region: 'Central' },
      { zip: '76798', city: 'Waco', county: 'McLennan', region: 'Central' },

      // El Paso area
      { zip: '79901', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79902', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79903', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79904', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79905', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79906', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79907', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79908', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79910', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79911', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79912', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79913', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79914', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79915', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79916', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79917', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79918', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79920', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79922', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79924', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79925', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79926', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79927', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79928', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79929', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79930', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79931', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79932', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79934', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79935', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79936', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79938', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79940', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79941', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79942', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79943', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79944', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79945', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79946', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79947', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79948', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79949', city: 'El Paso', county: 'El Paso', region: 'West' },
      { zip: '79950', city: 'El Paso', county: 'El Paso', region: 'West' }
    ];

    // Load all ZIP codes into the database
    for (const zipData of texasZIPs) {
      this.zipDatabase.set(zipData.zip, {
        city: zipData.city,
        county: zipData.county,
        region: zipData.region,
        latitude: zipData.latitude,
        longitude: zipData.longitude
      });
    }

    console.warn(`📍 Loaded ${this.zipDatabase.size} Texas ZIP codes into comprehensive database`);
  }

  lookupZIP(zipCode: string): { city: string; county: string; region: string; latitude?: number; longitude?: number } | null {
    return this.zipDatabase.get(zipCode) || null;
  }

  findByPattern(zipCode: string): { city: string; county: string; region: string; confidence: number } | null {
    // For ZIP codes not in our database, use pattern matching
    const prefix3 = zipCode.substring(0, 3);
    const prefix2 = zipCode.substring(0, 2);

    // Houston area patterns (77xxx)
    if (prefix2 === '77') {
      if (zipCode >= '77001' && zipCode <= '77099') {
        return { city: 'Houston', county: 'Harris', region: 'Coast', confidence: 85 };
      }
      if (zipCode >= '77301' && zipCode <= '77399') {
        return { city: 'Conroe', county: 'Montgomery', region: 'Coast', confidence: 80 };
      }
      if (zipCode >= '77400' && zipCode <= '77499') {
        return { city: 'Katy', county: 'Harris', region: 'Coast', confidence: 80 };
      }
      if (zipCode >= '77800' && zipCode <= '77899') {
        return { city: 'Bryan', county: 'Brazos', region: 'Coast', confidence: 80 };
      }
      // Default Houston area
      return { city: 'Houston', county: 'Harris', region: 'Coast', confidence: 70 };
    }

    // Dallas area patterns (75xxx)
    if (prefix2 === '75') {
      if (zipCode >= '75201' && zipCode <= '75399') {
        return { city: 'Dallas', county: 'Dallas', region: 'North', confidence: 85 };
      }
      if (zipCode >= '75701' && zipCode <= '75799') {
        return { city: 'Tyler', county: 'Smith', region: 'North', confidence: 80 };
      }
      // Default Dallas area
      return { city: 'Dallas', county: 'Dallas', region: 'North', confidence: 70 };
    }

    // Austin/Central Texas patterns (78xxx)
    if (prefix2 === '78') {
      if (zipCode >= '78701' && zipCode <= '78799') {
        return { city: 'Austin', county: 'Travis', region: 'Central', confidence: 85 };
      }
      if (zipCode >= '78201' && zipCode <= '78299') {
        return { city: 'San Antonio', county: 'Bexar', region: 'South', confidence: 85 };
      }
      if (zipCode >= '78401' && zipCode <= '78499') {
        return { city: 'Corpus Christi', county: 'Nueces', region: 'South', confidence: 80 };
      }
      // Default Austin area
      return { city: 'Austin', county: 'Travis', region: 'Central', confidence: 70 };
    }

    // Fort Worth patterns (76xxx)
    if (prefix2 === '76') {
      if (zipCode >= '76101' && zipCode <= '76199') {
        return { city: 'Fort Worth', county: 'Tarrant', region: 'North', confidence: 85 };
      }
      if (zipCode >= '76701' && zipCode <= '76799') {
        return { city: 'Waco', county: 'McLennan', region: 'Central', confidence: 80 };
      }
      // Default Fort Worth area
      return { city: 'Fort Worth', county: 'Tarrant', region: 'North', confidence: 70 };
    }

    // West Texas patterns (79xxx)
    if (prefix2 === '79') {
      if (zipCode >= '79101' && zipCode <= '79199') {
        return { city: 'Amarillo', county: 'Potter', region: 'West', confidence: 85 };
      }
      if (zipCode >= '79401' && zipCode <= '79499') {
        return { city: 'Lubbock', county: 'Lubbock', region: 'West', confidence: 85 };
      }
      if (zipCode >= '79901' && zipCode <= '79999') {
        return { city: 'El Paso', county: 'El Paso', region: 'West', confidence: 85 };
      }
      // Default West Texas - Lubbock
      return { city: 'Lubbock', county: 'Lubbock', region: 'West', confidence: 70 };
    }

    // Not a recognized Texas ZIP pattern
    return null;
  }
}

/**
 * Municipal Utility Checker
 */
class MunicipalUtilityChecker {
  private municipalUtilities = new Map<string, { name: string; description: string }>();

  constructor() {
    this.loadMunicipalUtilities();
  }

  private loadMunicipalUtilities() {
    const utilities = [
      { city: 'austin', name: 'Austin Energy', description: 'Austin Energy is a municipal utility serving the Austin area.' },
      { city: 'san antonio', name: 'CPS Energy', description: 'CPS Energy is a municipal utility serving the San Antonio area.' },
      { city: 'garland', name: 'Garland Power & Light', description: 'Garland Power & Light serves the City of Garland.' },
      { city: 'bryan', name: 'Bryan Texas Utilities', description: 'Bryan Texas Utilities serves the Bryan area.' },
      { city: 'college station', name: 'College Station Utilities', description: 'College Station Utilities serves the College Station area.' },
      { city: 'denton', name: 'Denton Municipal Electric', description: 'Denton Municipal Electric serves the City of Denton.' },
      { city: 'georgetown', name: 'Georgetown Utility Systems', description: 'Georgetown Utility Systems serves the Georgetown area.' },
      { city: 'greenville', name: 'Greenville Electric Utility System', description: 'Greenville Electric Utility serves the Greenville area.' }
    ];

    for (const util of utilities) {
      this.municipalUtilities.set(util.city, {
        name: util.name,
        description: util.description
      });
    }
  }

  checkMunicipal(cityName: string): { isMunicipal: boolean; info?: { name: string; description: string } } {
    const cityLower = cityName.toLowerCase();
    const utilInfo = this.municipalUtilities.get(cityLower);
    
    return { 
      isMunicipal: !!utilInfo, 
      info: utilInfo 
    };
  }
}

/**
 * City Mapping Service
 */
class CityMappingService {
  private supportedCities = new Map<string, string>();

  constructor() {
    this.loadSupportedCities();
  }

  private loadSupportedCities() {
    const cityMappings = [
      { name: 'Houston', slug: 'houston-tx' },
      { name: 'Dallas', slug: 'dallas-tx' },
      { name: 'Austin', slug: 'austin-tx' },
      { name: 'San Antonio', slug: 'san-antonio-tx' },
      { name: 'Fort Worth', slug: 'fort-worth-tx' },
      { name: 'El Paso', slug: 'el-paso-tx' },
      { name: 'Arlington', slug: 'arlington-tx' },
      { name: 'Corpus Christi', slug: 'corpus-christi-tx' },
      { name: 'Plano', slug: 'plano-tx' },
      { name: 'Lubbock', slug: 'lubbock-tx' },
      { name: 'Irving', slug: 'irving-tx' },
      { name: 'Garland', slug: 'garland-tx' },
      { name: 'Frisco', slug: 'frisco-tx' },
      { name: 'McKinney', slug: 'mckinney-tx' },
      { name: 'Tyler', slug: 'tyler-tx' },
      { name: 'Amarillo', slug: 'amarillo-tx' },
      { name: 'Waco', slug: 'waco-tx' },
      { name: 'Conroe', slug: 'conroe-tx' },
      { name: 'Katy', slug: 'katy-tx' },
      { name: 'Bryan', slug: 'bryan-tx' },
      { name: 'College Station', slug: 'college-station-tx' }
    ];

    for (const city of cityMappings) {
      this.supportedCities.set(city.name.toLowerCase(), city.slug);
    }
  }

  mapToSupportedCity(cityName: string, region: string): { slug: string; confidence: number } {
    const cityLower = cityName.toLowerCase();
    
    // Direct match
    const directMatch = this.supportedCities.get(cityLower);
    if (directMatch) {
      return { slug: directMatch, confidence: 95 };
    }

    // Regional fallbacks
    switch (region) {
      case 'Coast':
        return { slug: 'houston-tx', confidence: 80 };
      case 'North':
        return { slug: 'dallas-tx', confidence: 80 };
      case 'Central':
        return { slug: 'austin-tx', confidence: 80 };
      case 'South':
        return { slug: 'san-antonio-tx', confidence: 80 };
      case 'West':
        return { slug: 'lubbock-tx', confidence: 80 };
      default:
        return { slug: 'houston-tx', confidence: 70 }; // Default to largest market
    }
  }
}

/**
 * Main Comprehensive ZIP Service
 */
export class ComprehensiveZIPService {
  private zipDatabase = new TexasZIPDatabase();
  private municipalChecker = new MunicipalUtilityChecker();
  private cityMapper = new CityMappingService();
  private cache = new Map<string, { data: ComprehensiveZIPResult; timestamp: number }>();
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Universal ZIP code lookup using comprehensive offline database
   */
  async lookupZIPCode(zipCode: string): Promise<ComprehensiveZIPResult> {
    const startTime = Date.now();

    try {
      // Basic validation
      if (!this.isValidZIPCode(zipCode)) {
        return this.createErrorResult(zipCode, 'invalid_zip', 'Invalid ZIP code format', startTime);
      }

      if (!this.isTexasZIPRange(zipCode)) {
        return this.createErrorResult(zipCode, 'non_texas', 'ZIP code is not in Texas', startTime);
      }

      // Check cache first
      const cached = this.cache.get(zipCode);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }

      // Look up in comprehensive database
      let zipData = this.zipDatabase.lookupZIP(zipCode);
      let confidence = 95;

      if (!zipData) {
        // Try pattern matching for unknown ZIPs
        const patternMatch = this.zipDatabase.findByPattern(zipCode);
        if (patternMatch) {
          zipData = {
            city: patternMatch.city,
            county: patternMatch.county,
            region: patternMatch.region
          };
          confidence = patternMatch.confidence;
        } else {
          return this.createErrorResult(zipCode, 'not_found', 'ZIP code not found in Texas', startTime);
        }
      }

      // Check for municipal utilities
      const municipalCheck = this.municipalChecker.checkMunicipal(zipData.city);
      
      if (municipalCheck.isMunicipal && municipalCheck.info) {
        // Map to supported city for municipal utility page
        const cityMapping = this.cityMapper.mapToSupportedCity(zipData.city, zipData.region);
        
        const result: ComprehensiveZIPResult = {
          success: false,
          zipCode,
          cityName: zipData.city,
          citySlug: cityMapping.slug,
          cityDisplayName: this.formatCityDisplayName(cityMapping.slug),
          county: zipData.county,
          isTexas: true,
          isDeregulated: false,
          municipalUtility: true,
          utilityName: municipalCheck.info.name,
          utilityInfo: municipalCheck.info.description,
          redirectUrl: `/electricity-plans/${cityMapping.slug}/municipal-utility`,
          confidence: Math.min(confidence, cityMapping.confidence),
          error: `${zipData.city} is served by ${municipalCheck.info.name}, a municipal utility. Residents cannot choose their electricity provider.`,
          errorType: 'non_deregulated',
          processingTime: Date.now() - startTime
        };

        // Cache the result
        this.cache.set(zipCode, { data: result, timestamp: Date.now() });
        return result;
      }

      // Map to supported deregulated city
      const cityMapping = this.cityMapper.mapToSupportedCity(zipData.city, zipData.region);

      const result: ComprehensiveZIPResult = {
        success: true,
        zipCode,
        cityName: zipData.city,
        citySlug: cityMapping.slug,
        cityDisplayName: this.formatCityDisplayName(cityMapping.slug),
        redirectUrl: `/electricity-plans/${cityMapping.slug}`,
        county: zipData.county,
        isTexas: true,
        isDeregulated: true,
        municipalUtility: false,
        confidence: Math.min(confidence, cityMapping.confidence),
        processingTime: Date.now() - startTime
      };

      // Cache successful result
      this.cache.set(zipCode, { data: result, timestamp: Date.now() });

      console.warn(`✅ Comprehensive lookup: ZIP ${zipCode} (${zipData.city}) -> ${cityMapping.slug} (confidence: ${result.confidence}%)`);
      return result;

    } catch (error) {
      console.error(`❌ Comprehensive ZIP lookup failed for ${zipCode}:`, error);
      return this.createErrorResult(zipCode, 'not_found', 'System error during ZIP lookup', startTime);
    }
  }

  private isValidZIPCode(zipCode: string): boolean {
    // Must be exactly 5 digits
    if (!zipCode || typeof zipCode !== 'string') {
      return false;
    }
    return /^\d{5}$/.test(zipCode.trim());
  }

  private isTexasZIPRange(zipCode: string): boolean {
    const zipNum = parseInt(zipCode);
    return zipNum >= 75000 && zipNum <= 79999;
  }

  private formatCityDisplayName(citySlug: string): string {
    return citySlug
      .split('-')
      .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Tx', ', TX');
  }

  private createErrorResult(
    zipCode: string, 
    errorType: ComprehensiveZIPResult['errorType'], 
    error: string, 
    startTime: number
  ): ComprehensiveZIPResult {
    return {
      success: false,
      zipCode,
      error,
      errorType,
      processingTime: Date.now() - startTime
    };
  }
}

// Export singleton instance
export const comprehensiveZIPService = new ComprehensiveZIPService();