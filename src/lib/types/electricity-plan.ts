// T006: ElectricityPlan interface
// Constitutional compliance: Dynamic IDs only, no hardcoded plan IDs

export interface ElectricityPlan {
  // Core Plan Identity (Constitutional: Dynamic IDs only)
  id: string;                    // MongoDB ObjectId from generated data
  planName: string;             // Human-readable plan name
  providerName: string;         // Electricity provider company name
  
  // Pricing Information (Transparent display requirement FR-009)
  baseRate: number;             // Rate per kWh in cents
  rateType: 'fixed' | 'variable' | 'indexed';
  contractLength: number;       // Contract length in months
  monthlyFee: number;          // Monthly service charge
  connectionFee: number;       // One-time connection fee
  earlyTerminationFee: number; // ETF amount
  estimatedMonthlyCost: number; // Calculated for average usage
  
  // Plan Features (Filtering requirements FR-002)
  greenEnergyPercentage: number; // Renewable energy percentage
  planFeatures: string[];       // Plan-specific features array
  planType: string;            // e.g., "Basic", "Premium", "Green"
  promotionalOffers: string[]; // Limited-time offers
  
  // Service Information
  serviceArea: string[];       // ZIP codes served
  tdspTerritory: string;      // Transmission service provider
  availability: 'active' | 'limited' | 'discontinued';
  lastUpdated: Date;          // Data freshness tracking
  
  // Provider Details (Supporting comparison FR-003)
  providerRating: number;     // Customer satisfaction rating
  customerServiceHours: string;
  paymentOptions: string[];
  
  // Calculated Fields (Performance optimization)
  totalFirstYearCost: number; // Including all fees and estimates
  averageRateIncludingFees: number; // Effective rate calculation
}

export type RateType = ElectricityPlan['rateType'];
export type PlanAvailability = ElectricityPlan['availability'];

// Validation helpers for constitutional compliance
export const isValidPlanId = (id: string): boolean => {
  // MongoDB ObjectId validation (24 character hex string)
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const validateElectricityPlan = (plan: Partial<ElectricityPlan>): string[] => {
  const errors: string[] = [];
  
  if (!plan.id || !isValidPlanId(plan.id)) {
    errors.push('Plan ID must be a valid MongoDB ObjectId');
  }
  
  if (!plan.planName || plan.planName.trim().length === 0) {
    errors.push('Plan name is required');
  }
  
  if (!plan.providerName || plan.providerName.trim().length === 0) {
    errors.push('Provider name is required');
  }
  
  if (typeof plan.baseRate !== 'number' || plan.baseRate < 0) {
    errors.push('Base rate must be a positive number');
  }
  
  if (!['fixed', 'variable', 'indexed'].includes(plan.rateType || '')) {
    errors.push('Rate type must be fixed, variable, or indexed');
  }
  
  if (!plan.contractLength || ![1, 6, 12, 24, 36].includes(plan.contractLength)) {
    errors.push('Contract length must be 1, 6, 12, 24, or 36 months');
  }
  
  if (typeof plan.greenEnergyPercentage !== 'number' || 
      plan.greenEnergyPercentage < 0 || 
      plan.greenEnergyPercentage > 100) {
    errors.push('Green energy percentage must be between 0 and 100');
  }
  
  return errors;
};