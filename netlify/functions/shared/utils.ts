/**
 * Shared utilities for Netlify Functions
 * Provides essential TDSP mapping and validation functionality
 */

import { tdspMapping } from '../../../src/config/tdsp-mapping';
import { multiTdspMapping } from '../../../src/config/multi-tdsp-mapping';

// ZIP code to TDSP DUNS mapping
const zipToTdspMapping: Record<string, { duns: string; name: string; zone: string }> = {
  // Major Texas ZIP codes and their primary TDSPs
  // Dallas/Fort Worth area - Oncor
  '75201': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75202': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75203': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75204': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75205': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75206': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75207': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75208': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75209': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75210': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75211': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75212': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75214': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75215': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75216': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75217': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75218': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75219': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75220': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75221': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75222': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75223': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75224': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75225': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75226': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75227': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75228': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75229': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75230': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75231': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75232': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75233': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75234': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75235': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75236': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75237': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75238': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75240': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75241': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75242': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75243': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75244': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75246': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75247': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75248': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75249': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75250': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75251': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75252': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75253': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '75254': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  
  // Fort Worth area
  '76101': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76102': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76103': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76104': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76105': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76106': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76107': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76108': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76109': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76110': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76111': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76112': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76113': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76114': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76115': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76116': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76117': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76118': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76119': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76120': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76121': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76122': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76123': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76124': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76126': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76127': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76129': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76130': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76131': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76132': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76133': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76134': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76135': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76136': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76137': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76140': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76147': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76148': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76155': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76161': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76162': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76163': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76164': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76177': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76179': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76180': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  '76182': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  
  // Houston area - CenterPoint
  '77001': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77002': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77003': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77004': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77005': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77006': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77007': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77008': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77009': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77010': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77011': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77012': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77013': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77014': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77015': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77016': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77017': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77018': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77019': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77020': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77021': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77022': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77023': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77024': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77025': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77026': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77027': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77028': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77029': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77030': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77031': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77032': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77033': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77034': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77035': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77036': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77037': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77038': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77039': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77040': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77041': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77042': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77043': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77044': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77045': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77046': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77047': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77048': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77049': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77050': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77051': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77052': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77053': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77054': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77055': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77056': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77057': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77058': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77059': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77060': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77061': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77062': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77063': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77064': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77065': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77066': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77067': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77068': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77069': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77070': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77071': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77072': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77073': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77074': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77075': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77076': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77077': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77078': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77079': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77080': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77081': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77082': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77083': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77084': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77085': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77086': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77087': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77088': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77089': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77090': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77091': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77092': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77093': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77094': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77095': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77096': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77098': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '77099': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  
  // Austin area - AEP Central
  '78701': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78702': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78703': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78704': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78705': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78712': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78717': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78719': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78721': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78722': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78723': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78724': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78725': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78726': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78727': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78728': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78729': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78730': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78731': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78732': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78733': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78734': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78735': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78736': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78737': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78738': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78739': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78741': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78742': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78744': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78745': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78746': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78747': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78748': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78749': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78750': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78751': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78752': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78753': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78754': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78756': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78757': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78758': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  '78759': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  
  // San Antonio area - CenterPoint
  '78201': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78202': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78203': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78204': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78205': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78207': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78208': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78209': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78210': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78211': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78212': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78213': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78214': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78215': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78216': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78217': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78218': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78219': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78220': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78221': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78222': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78223': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78224': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78225': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78226': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78227': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78228': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78229': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78230': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78231': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78232': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78233': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78234': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78235': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78236': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78237': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78238': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78239': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78240': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78242': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78244': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78245': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78247': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78248': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78249': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78250': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78251': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78252': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78253': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78254': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78255': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78256': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78257': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78258': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78259': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78260': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78261': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78263': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78264': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  '78266': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
};

/**
 * Get TDSP information from ZIP code
 */
export function getTdspFromZip(zipCode: string): { duns: string; name: string; zone: string } | null {
  return zipToTdspMapping[zipCode] || null;
}

/**
 * Check if ZIP code is in a deregulated Texas market
 */
export function isTexasZip(zipCode: string): boolean {
  return zipToTdspMapping.hasOwnProperty(zipCode);
}

/**
 * Validate that a ZIP code has electricity plan data available
 */
export function validateTexasZip(zipCode: string): boolean {
  return isTexasZip(zipCode);
}

/**
 * Get all supported ZIP codes
 */
export function getSupportedZipCodes(): string[] {
  return Object.keys(zipToTdspMapping);
}

/**
 * Get ZIP codes by TDSP
 */
export function getZipCodesByTdsp(tdspDuns: string): string[] {
  return Object.entries(zipToTdspMapping)
    .filter(([_, info]) => info.duns === tdspDuns)
    .map(([zip]) => zip);
}

/**
 * Get zone from TDSP DUNS
 */
export function getZoneFromTdsp(tdspDuns: string): string {
  switch (tdspDuns) {
    case '1039940674000': return 'North'; // Oncor
    case '957877905': return 'Coast'; // CenterPoint
    case '007924772': return 'Central'; // AEP Central
    case '007923311': return 'North'; // AEP North
    case '007929441': return 'South'; // TNMP
    default: return 'Unknown';
  }
}

/**
 * Check if ZIP code is in multi-TDSP configuration
 */
export function isMultiTdspZip(zipCode: string): boolean {
  return multiTdspMapping.hasOwnProperty(zipCode);
}

/**
 * Get the primary TDSP for a multi-TDSP ZIP code
 */
export function getPrimaryTdspForZip(zipCode: string): { duns: string; name: string; zone: string } | null {
  const multiTdsp = multiTdspMapping[zipCode];
  if (!multiTdsp) return null;
  
  return {
    duns: multiTdsp.primaryTdsp.duns,
    name: multiTdsp.primaryTdsp.name,
    zone: multiTdsp.primaryTdsp.zone
  };
}

/**
 * Check if ZIP code requires address validation for accurate TDSP determination
 */
export function requiresAddressValidation(zipCode: string): boolean {
  const multiTdsp = multiTdspMapping[zipCode];
  return multiTdsp?.requiresAddressValidation || false;
}

/**
 * Get TDSP alternatives for a multi-TDSP ZIP code
 */
export function getAlternativeTdsps(zipCode: string): Array<{ duns: string; name: string; zone: string }> {
  const multiTdsp = multiTdspMapping[zipCode];
  if (!multiTdsp?.alternativeTdsps) return [];
  
  return multiTdsp.alternativeTdsps.map(alt => ({
    duns: alt.duns,
    name: alt.name,
    zone: alt.zone
  }));
}

/**
 * Comprehensive ZIP code resolution with fallback strategy
 */
export function resolveZipToTdsp(zipCode: string): {
  success: boolean;
  tdsp: { duns: string; name: string; zone: string } | null;
  isMultiTdsp: boolean;
  requiresAddress: boolean;
  alternatives?: Array<{ duns: string; name: string; zone: string }>;
  method: 'direct_mapping' | 'multi_tdsp_primary' | 'not_supported';
} {
  // Check direct mapping first
  const directTdsp = getTdspFromZip(zipCode);
  if (directTdsp) {
    return {
      success: true,
      tdsp: directTdsp,
      isMultiTdsp: false,
      requiresAddress: false,
      method: 'direct_mapping'
    };
  }
  
  // Check multi-TDSP configuration
  const primaryTdsp = getPrimaryTdspForZip(zipCode);
  if (primaryTdsp) {
    return {
      success: true,
      tdsp: primaryTdsp,
      isMultiTdsp: true,
      requiresAddress: requiresAddressValidation(zipCode),
      alternatives: getAlternativeTdsps(zipCode),
      method: 'multi_tdsp_primary'
    };
  }
  
  // No TDSP found
  return {
    success: false,
    tdsp: null,
    isMultiTdsp: false,
    requiresAddress: false,
    method: 'not_supported'
  };
}

/**
 * Validate TDSP DUNS number format
 */
export function validateTdspDuns(duns: string): boolean {
  // DUNS numbers are typically 9-13 digits
  return /^\d{9,13}$/.test(duns);
}

/**
 * Get human-readable TDSP name from DUNS
 */
export function getTdspNameFromDuns(duns: string): string {
  switch (duns) {
    case '1039940674000': return 'Oncor Electric Delivery';
    case '957877905': return 'CenterPoint Energy Houston Electric';
    case '007924772': return 'AEP Texas Central Company';
    case '007923311': return 'AEP Texas North Company';
    case '007929441': return 'Texas-New Mexico Power Company';
    default: return 'Unknown TDSP';
  }
}

/**
 * Performance statistics for monitoring
 */
export function getZipMappingStats() {
  const totalZips = Object.keys(zipToTdspMapping).length;
  const multiTdspZips = Object.keys(multiTdspMapping).length;
  const tdspCounts = {};
  
  Object.values(zipToTdspMapping).forEach(info => {
    tdspCounts[info.duns] = (tdspCounts[info.duns] || 0) + 1;
  });
  
  return {
    totalZipCodes: totalZips,
    multiTdspZipCodes: multiTdspZips,
    tdspDistribution: tdspCounts,
    coverage: {
      oncor: tdspCounts['1039940674000'] || 0,
      centerpoint: tdspCounts['957877905'] || 0,
      aepCentral: tdspCounts['007924772'] || 0,
      aepNorth: tdspCounts['007923311'] || 0,
      tnmp: tdspCounts['007929441'] || 0
    }
  };
}