// T008: ComparisonState interface
// Session-based comparison management for side-by-side plan comparison (FR-003)

import type { ElectricityPlan } from './electricity-plan';

export interface ComparisonState {
  // Selected Plans (Maximum 4 per FR-003)
  selectedPlans: string[];    // Array of plan IDs (max 4)
  comparisonData: ElectricityPlan[]; // Full plan details for comparison
  
  // Comparison Configuration
  focusAreas: ComparisonFocus[]; // User-selected comparison priorities
  showDifferencesOnly: boolean;  // Highlight differences vs. show all
  
  // Session Management
  sessionId: string;          // Browser session identifier
  createdAt: Date;           // Comparison start time
  lastModified: Date;        // Last selection change
  
  // Comparison Calculations
  costComparison: CostAnalysis; // Side-by-side cost breakdown
  featureMatrix: FeatureComparison[]; // Feature availability matrix
  recommendedChoice?: string;  // AI-powered recommendation
}

export interface ComparisonFocus {
  category: 'price' | 'features' | 'contract' | 'green' | 'provider';
  weight: number;  // User priority weighting 1-5
}

export interface CostAnalysis {
  monthlyEstimates: number[];  // Monthly cost for each plan
  firstYearTotal: number[];    // Total first year including fees
  averageRate: number[];       // Effective rate per kWh
  savingsVsFirst: number[];    // Savings compared to most expensive
}

export interface FeatureComparison {
  featureName: string;
  planAvailability: boolean[]; // True/false for each selected plan
  importance: 'high' | 'medium' | 'low'; // Feature importance ranking
}

export type ComparisonCategory = ComparisonFocus['category'];
export type FeatureImportance = FeatureComparison['importance'];

export const MAX_COMPARISON_PLANS = 4;

// Default comparison state
export const createDefaultComparisonState = (): ComparisonState => ({
  selectedPlans: [],
  comparisonData: [],
  focusAreas: [
    { category: 'price', weight: 5 },
    { category: 'features', weight: 3 },
    { category: 'contract', weight: 3 },
    { category: 'green', weight: 2 },
    { category: 'provider', weight: 2 }
  ],
  showDifferencesOnly: false,
  sessionId: generateSessionId(),
  createdAt: new Date(),
  lastModified: new Date(),
  costComparison: {
    monthlyEstimates: [],
    firstYearTotal: [],
    averageRate: [],
    savingsVsFirst: []
  },
  featureMatrix: []
});

// Session ID generation
export const generateSessionId = (): string => {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Comparison state validation
export const canAddPlanToComparison = (state: ComparisonState, planId: string): boolean => {
  if (state.selectedPlans.includes(planId)) return false;
  if (state.selectedPlans.length >= MAX_COMPARISON_PLANS) return false;
  return true;
};

export const addPlanToComparison = (state: ComparisonState, plan: ElectricityPlan): ComparisonState => {
  if (!canAddPlanToComparison(state, plan.id)) return state;
  
  return {
    ...state,
    selectedPlans: [...state.selectedPlans, plan.id],
    comparisonData: [...state.comparisonData, plan],
    lastModified: new Date()
  };
};

export const removePlanFromComparison = (state: ComparisonState, planId: string): ComparisonState => {
  const planIndex = state.selectedPlans.indexOf(planId);
  if (planIndex === -1) return state;
  
  return {
    ...state,
    selectedPlans: state.selectedPlans.filter(id => id !== planId),
    comparisonData: state.comparisonData.filter(plan => plan.id !== planId),
    lastModified: new Date()
  };
};

// Cost analysis calculations
export const calculateCostAnalysis = (plans: ElectricityPlan[], usageKwh: number = 1000): CostAnalysis => {
  const monthlyEstimates = plans.map(plan => {
    const energyCost = (plan.baseRate / 100) * usageKwh;
    return energyCost + plan.monthlyFee;
  });
  
  const firstYearTotal = plans.map((plan, index) => {
    return (monthlyEstimates[index] * 12) + plan.connectionFee;
  });
  
  const averageRate = plans.map((plan, index) => {
    return (firstYearTotal[index] / 12) / usageKwh * 100;
  });
  
  const maxFirstYearCost = Math.max(...firstYearTotal);
  const savingsVsFirst = firstYearTotal.map(cost => maxFirstYearCost - cost);
  
  return {
    monthlyEstimates,
    firstYearTotal,
    averageRate,
    savingsVsFirst
  };
};

// Feature matrix generation
export const generateFeatureMatrix = (plans: ElectricityPlan[]): FeatureComparison[] => {
  // Collect all unique features
  const allFeatures = new Set<string>();
  plans.forEach(plan => {
    plan.planFeatures.forEach(feature => allFeatures.add(feature));
  });
  
  // Create matrix for each feature
  return Array.from(allFeatures).map(featureName => ({
    featureName,
    planAvailability: plans.map(plan => plan.planFeatures.includes(featureName)),
    importance: determineFeatureImportance(featureName)
  }));
};

const determineFeatureImportance = (featureName: string): FeatureImportance => {
  const highImportanceKeywords = ['deposit', 'fee', 'cancellation', 'bill', 'payment'];
  const lowImportanceKeywords = ['reward', 'app', 'website', 'newsletter'];
  
  const lowerFeature = featureName.toLowerCase();
  
  if (highImportanceKeywords.some(keyword => lowerFeature.includes(keyword))) {
    return 'high';
  }
  
  if (lowImportanceKeywords.some(keyword => lowerFeature.includes(keyword))) {
    return 'low';
  }
  
  return 'medium';
};

// Session storage helpers
export const COMPARISON_STORAGE_KEY = 'plans_comparison_state';

export const saveComparisonToSession = (state: ComparisonState): void => {
  try {
    sessionStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save comparison state to session storage:', error);
  }
};

export const loadComparisonFromSession = (): ComparisonState | null => {
  try {
    const stored = sessionStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Validate session age (clear if older than 24 hours)
    const createdAt = new Date(parsed.createdAt);
    const now = new Date();
    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (ageHours > 24) {
      sessionStorage.removeItem(COMPARISON_STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Could not load comparison state from session storage:', error);
    return null;
  }
};