/**
 * Hero Image Mapping System
 * Maps page contexts to the generated OG images for hero backgrounds
 */

// Complete Image Library - All 60+ high-quality 16:9 images!
// Updated with new clean, realistic images from FLUX and comprehensive generation
export const GENERATED_IMAGES = {
  // CORE PAGES - 16:9 FLUX Generated
  homepage_texas_grid: '/images/og/comprehensive-clean/residential_neighborhood_16x9.png', // Cozy residential neighborhood at dusk
  state_texas_overview: '/images/og/comprehensive-clean/texas_state_overview_16x9.png', // State overview 16:9
  global_comparison_all: '/images/og/comprehensive-clean/plan_comparison_16x9.png', // Plan comparison

  // MAJOR CITIES (Tier 1) - Clean City Skylines
  'dallas-tx_city_main': '/images/og/clean-cities/dallas_clean_skyline_16x9.png', // Clean Dallas skyline
  'houston-tx_city_main': '/images/og/clean-cities/houston_clean_skyline_16x9.png', // Clean Houston skyline  
  'austin-tx_city_main': '/images/og/clean-cities/austin_clean_skyline_16x9.png', // Clean Austin skyline

  // ADDITIONAL MAJOR CITIES - Clean Skylines
  'fort-worth-tx_city_main': '/images/og/clean-cities/fort_worth_clean_skyline_16x9.png', // Fort Worth skyline
  'san-antonio-tx_city_main': '/images/og/clean-cities/san_antonio_clean_skyline_16x9.png', // San Antonio skyline
  'arlington-tx_city_main': '/images/og/clean-cities/arlington_clean_cityscape_16x9.png', // Arlington cityscape
  'plano-tx_city_main': '/images/og/clean-cities/plano_clean_cityscape_16x9.png', // Plano cityscape
  'grand-prairie-tx_city_main': '/images/og/clean-cities/grand_prairie_clean_cityscape_16x9.png', // Grand Prairie

  // GEOGRAPHIC REGIONS - 16:9 Regional Views
  'tier1-north_cities': '/images/og/comprehensive-clean/north_texas_region_16x9.png', // North Texas region
  'tier2-north_cities': '/images/og/flux-16x9/tier1_north_cities_16x9.png', // North Texas FLUX
  'tier1-coast_cities': '/images/og/comprehensive-clean/gulf_coast_region_16x9.png', // Gulf Coast region
  'tier2-coast_cities': '/images/og/flux-16x9/tier1_coast_cities_16x9.png', // Coast FLUX
  'tier1-central_cities': '/images/og/comprehensive-clean/central_texas_region_16x9.png', // Central Texas region
  'tier2-central_cities': '/images/og/flux-16x9/tier1_central_cities_16x9.png', // Central FLUX
  'tier1-south_cities': '/images/og/comprehensive-clean/south_texas_region_16x9.png', // South Texas region
  'tier2-south_cities': '/images/og/flux-16x9/tier1_south_cities_16x9.png', // South FLUX
  'tier3-all_cities': '/images/og/comprehensive-clean/residential_neighborhood_16x9.png', // Smaller cities
  'east-texas_cities': '/images/og/comprehensive-clean/east_texas_region_16x9.png', // East Texas
  'west-texas_cities': '/images/og/comprehensive-clean/west_texas_region_16x9.png', // West Texas

  // FILTER CATEGORIES - 16:9 Clean Concepts
  filter_green_energy_all: '/images/og/comprehensive-clean/renewable_energy_clean_16x9.png', // Clean renewable energy
  filter_fixed_rate_all: '/images/og/comprehensive-clean/fixed_rate_concept_16x9.png', // Fixed rate concept
  filter_12month_all: '/images/og/comprehensive-clean/12_month_plans_16x9.png', // 12-month plans
  'filter_variable-rate_all': '/images/og/comprehensive-clean/variable_rate_concept_16x9.png', // Variable rate
  filter_24month_all: '/images/og/comprehensive-clean/24_month_plans_16x9.png', // 24-month plans
  filter_prepaid_all: '/images/og/comprehensive-clean/prepaid_electricity_16x9.png', // Prepaid plans
  'filter_no-deposit_all': '/images/og/comprehensive-clean/no_deposit_plans_16x9.png', // No deposit
  'filter_time-of-use_all': '/images/og/comprehensive-clean/smart_meter_16x9.png', // Time of use (smart meter)
  'filter_month-to-month_all': '/images/og/comprehensive-clean/month_to_month_plans_16x9.png', // Month to month
  'filter_100-renewable_all': '/images/og/comprehensive-clean/100_percent_renewable_16x9.png', // 100% renewable
  'filter_solar-energy_all': '/images/og/comprehensive-clean/solar_energy_clean_16x9.png', // Solar energy

  // FILTER COMBINATIONS
  'combo_green-fixed_all': '/images/og/combo_green-fixed_all.png', // Green + Fixed
  'combo_green-12month_all': '/images/og/combo_green-12month_all.png', // Green + 12-month
  'combo_fixed-12month_all': '/images/og/combo_fixed-12month_all.png', // Fixed + 12-month
  'combo_prepaid-nodeposit_all': '/images/og/combo_prepaid-nodeposit_all.png', // Prepaid + No deposit
  'combo_green-variable_all': '/images/og/combo_green-variable_all.png', // Green + Variable
  'combo_green-dallas_all': '/images/og/combo-green-dallas.png', // Green + Dallas (existing)
  'combo_green-houston_all': '/images/og/combo-green-houston.png', // Green + Houston (existing)

  // SEASONAL CONTEXTS - 16:9 Seasonal Imagery
  seasonal_summer_cooling: '/images/og/comprehensive-clean/summer_comfort_16x9.png', // Summer comfort
  seasonal_winter_heating: '/images/og/comprehensive-clean/winter_warmth_16x9.png', // Winter warmth
  seasonal_spring_renewal: '/images/og/comprehensive-clean/spring_renewal_16x9.png', // Spring renewal
  seasonal_fall_efficiency: '/images/og/comprehensive-clean/fall_efficiency_16x9.png', // Fall efficiency
  
  // Legacy seasonal mapping
  seasonal_summer_peak: '/images/og/comprehensive-clean/summer_comfort_16x9.png',
  seasonal_winter_demand: '/images/og/comprehensive-clean/winter_warmth_16x9.png',

  // PROVIDER TYPES
  provider_major_all: '/images/og/provider_major_all.png', // Major providers
  provider_regional_all: '/images/og/provider_regional_all.png', // Regional providers
  provider_green_all: '/images/og/provider_green_all.png', // Green providers

  // SPECIALTY CATEGORIES - 16:9 Targeted Imagery
  specialty_business_all: '/images/og/comprehensive-clean/business_district_clean_16x9.png', // Business district
  specialty_residential_all: '/images/og/comprehensive-clean/residential_neighborhood_16x9.png', // Residential
  'specialty_low-usage_all': '/images/og/comprehensive-clean/residential_neighborhood_16x9.png', // Low usage
  'specialty_high-usage_all': '/images/og/comprehensive-clean/business_district_clean_16x9.png', // High usage
  specialty_savings_all: '/images/og/comprehensive-clean/savings_concept_16x9.png', // Savings concept
  specialty_smart_home_all: '/images/og/comprehensive-clean/smart_meter_16x9.png', // Smart home
  specialty_low_rate_all: '/images/og/comprehensive-clean/savings_concept_16x9.png', // Low rate (savings)
  'specialty_small-business_all': '/images/og/comprehensive-clean/small_business_16x9.png', // Small business

  // COMPARISON TYPES - 16:9 Comparison Tools
  comparison_rates_all: '/images/og/comprehensive-clean/plan_comparison_16x9.png', // Plan comparison
  comparison_features_all: '/images/og/comprehensive-clean/plan_comparison_16x9.png', // Feature comparison
  comparison_providers_all: '/images/og/comprehensive-clean/plan_comparison_16x9.png', // Provider comparison
  tool_comparison_all: '/images/og/comprehensive-clean/rate_calculator_16x9.png', // Rate calculator
  tool_calculator_all: '/images/og/comprehensive-clean/rate_calculator_16x9.png', // Calculator tool

  // FALLBACK TEMPLATES - 16:9 Fallbacks
  fallback_generic_texas: '/images/og/comprehensive-clean/texas_state_overview_16x9.png', // Generic Texas
  fallback_default_grid: '/images/og/comprehensive-clean/homepage_hero_clean_16x9.png', // Default grid
  fallback_universal_utility: '/images/og/comprehensive-clean/residential_neighborhood_16x9.png', // Universal utility
  
  // LEGACY MAPPINGS (for backwards compatibility)
  homepage_texas_grid_legacy: '/images/og/homepage_texas_grid.png', // Old homepage
  state_texas_overview_legacy: '/images/og/state-texas-overview.png', // Old state
  global_comparison_all_legacy: '/images/og/global_comparison_all.png' // Old comparison
};

export interface HeroImageContext {
  pageType: 'homepage' | 'city' | 'state' | 'filter' | 'provider' | 'compare' | 'calculator';
  location?: string;
  filters?: string[];
  specialty?: string;
}

/**
 * Get the most appropriate hero background image for a given page context
 */
export function getHeroImage(context: HeroImageContext): string | undefined {
  const { pageType, location, filters, specialty } = context;

  // Homepage gets the main Texas grid image
  if (pageType === 'homepage') {
    return GENERATED_IMAGES.homepage_texas_grid;
  }

  // City pages get city-specific or regional images
  if (pageType === 'city' && location) {
    const cityKey = `${location}_city_main` as keyof typeof GENERATED_IMAGES;
    if (GENERATED_IMAGES[cityKey]) {
      return GENERATED_IMAGES[cityKey];
    }

    // Fall back to regional images based on location
    if (location.includes('dallas') || location.includes('plano') || location.includes('garland') || 
        location.includes('fort-worth') || location.includes('arlington') || location.includes('grand-prairie')) {
      return GENERATED_IMAGES['tier1-north_cities'];
    }
    if (location.includes('houston') || location.includes('sugar-land') || location.includes('galveston') ||
        location.includes('beaumont') || location.includes('port-arthur')) {
      return GENERATED_IMAGES['tier1-coast_cities'];
    }
    if (location.includes('austin') || location.includes('cedar-park') || location.includes('round-rock') ||
        location.includes('san-marcos') || location.includes('kyle')) {
      return GENERATED_IMAGES['tier1-central_cities'];
    }
    if (location.includes('san-antonio') || location.includes('corpus-christi') || location.includes('laredo') ||
        location.includes('brownsville') || location.includes('mcallen')) {
      return GENERATED_IMAGES['tier1-south_cities'];
    }
    if (location.includes('tyler') || location.includes('longview') || location.includes('marshall')) {
      return GENERATED_IMAGES['east-texas_cities'];
    }
    if (location.includes('lubbock') || location.includes('midland') || location.includes('odessa') ||
        location.includes('amarillo') || location.includes('abilene')) {
      return GENERATED_IMAGES['west-texas_cities'];
    }
    
    // Default regional fallback
    return GENERATED_IMAGES['tier3-all_cities'];
  }

  // State pages get state overview
  if (pageType === 'state') {
    return GENERATED_IMAGES.state_texas_overview;
  }

  // Filter pages get filter-specific images
  if (pageType === 'filter' && filters && filters.length > 0) {
    const primaryFilter = filters[0].toLowerCase();
    
    // Handle combinations first
    if (filters.includes('green-energy') && filters.includes('fixed-rate')) {
      return GENERATED_IMAGES['combo_green-fixed_all'];
    }
    if (filters.includes('green-energy') && location?.includes('dallas')) {
      return GENERATED_IMAGES['combo_green-dallas_all'];
    }
    if (filters.includes('green-energy') && location?.includes('houston')) {
      return GENERATED_IMAGES['combo_green-houston_all'];
    }
    if (filters.includes('fixed-rate') && filters.includes('12-month')) {
      return GENERATED_IMAGES['combo_fixed-12month_all'];
    }

    // Single filter mappings
    const filterMappings: Record<string, keyof typeof GENERATED_IMAGES> = {
      'green-energy': 'filter_green_energy_all',
      'renewable': 'filter_green_energy_all',
      'fixed-rate': 'filter_fixed_rate_all',
      'variable-rate': 'filter_variable-rate_all',
      '12-month': 'filter_12month_all',
      '24-month': 'filter_24month_all',
      'month-to-month': 'filter_month-to-month_all',
      'prepaid': 'filter_prepaid_all',
      'no-deposit': 'filter_no-deposit_all',
      'time-of-use': 'filter_time-of-use_all',
      '100-renewable': 'filter_100-renewable_all',
      'solar': 'filter_solar-energy_all',
      'solar-energy': 'filter_solar-energy_all',
    };

    const filterKey = filterMappings[primaryFilter];
    if (filterKey && GENERATED_IMAGES[filterKey]) {
      return GENERATED_IMAGES[filterKey];
    }
  }

  // Specialty pages
  if (specialty) {
    const specialtyMappings: Record<string, keyof typeof GENERATED_IMAGES> = {
      'savings': 'specialty_savings_all',
      'business': 'specialty_business_all',
      'small-business': 'specialty_small-business_all',
      'smart-home': 'specialty_smart_home_all',
      'low-rate': 'specialty_low_rate_all',
      'residential': 'specialty_residential_all',
      'low-usage': 'specialty_low-usage_all',
      'high-usage': 'specialty_high-usage_all',
    };

    const specialtyKey = specialtyMappings[specialty];
    if (specialtyKey && GENERATED_IMAGES[specialtyKey]) {
      return GENERATED_IMAGES[specialtyKey];
    }
  }

  // Comparison and calculator pages
  if (pageType === 'compare' || pageType === 'calculator') {
    return GENERATED_IMAGES.tool_comparison_all;
  }

  // Default fallback - use the main Texas grid image
  return GENERATED_IMAGES.homepage_texas_grid;
}

/**
 * Get seasonal hero image (if applicable)
 */
export function getSeasonalImage(): string | undefined {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  // Summer peak (June-August)
  if (month >= 6 && month <= 8) {
    return GENERATED_IMAGES.seasonal_summer_peak;
  }
  
  // Winter demand (December-February)
  if (month === 12 || month <= 2) {
    return GENERATED_IMAGES.seasonal_winter_demand;
  }
  
  return undefined;
}

/**
 * Utility to extract context from URL pathname
 */
export function extractContextFromPath(pathname: string): HeroImageContext {
  const segments = pathname.split('/').filter(Boolean);
  
  // Homepage
  if (segments.length === 0) {
    return { pageType: 'homepage' };
  }
  
  // Texas state page
  if (segments[0] === 'texas' && segments.length === 1) {
    return { pageType: 'state', location: 'texas' };
  }
  
  // City pages: /texas/dallas-tx
  if (segments[0] === 'texas' && segments.length === 2) {
    return { 
      pageType: 'city', 
      location: segments[1] 
    };
  }
  
  // Faceted pages: /electricity-plans/...
  if (segments[0] === 'electricity-plans') {
    const filters = segments.slice(1);
    return { 
      pageType: 'filter', 
      filters 
    };
  }
  
  // Compare pages
  if (segments[0] === 'compare') {
    return { pageType: 'compare' };
  }
  
  // Calculator pages
  if (segments.includes('calculator')) {
    return { pageType: 'calculator' };
  }
  
  // Default
  return { pageType: 'homepage' };
}