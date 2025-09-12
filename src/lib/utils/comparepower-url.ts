/**
 * ComparePower Order URL Builder
 * Generates validated order URLs for the ComparePower booking system
 */

export interface ComparePowerUrlParams {
  esiid: string;
  plan_id: string;
  usage: number;
  zip_code: string;
}

/**
 * Builds a validated ComparePower order URL
 * Returns "ERROR" if validation fails, otherwise returns the complete URL
 */
export function buildComparePowerUrl({ esiid, plan_id, usage, zip_code }: ComparePowerUrlParams): string {
  // Validate ESIID (must be exactly 17 digits per ComparePower specification)
  if (!/^\d{17}$/.test(esiid)) {
    console.error('[ComparePower URL] Invalid ESIID format (must be 17 digits):', esiid);
    return "ERROR";
  }
  
  // Validate ZIP code (5 digits)
  if (!/^\d{5}$/.test(zip_code)) {
    console.error('[ComparePower URL] Invalid ZIP code format:', zip_code);
    return "ERROR";
  }
  
  // Validate usage (numeric)
  if (!Number.isFinite(Number(usage))) {
    console.error('[ComparePower URL] Invalid usage value:', usage);
    return "ERROR";
  }
  
  // Validate plan_id (non-empty string)
  if (!plan_id || typeof plan_id !== 'string') {
    console.error('[ComparePower URL] Invalid plan_id:', plan_id);
    return "ERROR";
  }
  
  const base = "https://orders.comparepower.com/order/service_location";
  const qs = new URLSearchParams({
    esiid,
    plan_id,
    usage: String(usage),
    zip_code
  }).toString();
  
  const finalUrl = `${base}?${qs}`;
  
  console.warn('[ComparePower URL] Generated:', finalUrl);
  return finalUrl;
}