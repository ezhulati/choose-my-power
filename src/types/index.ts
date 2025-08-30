export interface Provider {
  id: string;
  name: string;
  slug: string;
  logo: string;
  rating: number;
  reviewCount: number;
  description: string;
  serviceStates: string[];
  plans: Plan[];
  features: string[];
  contactPhone: string;
  website: string;
  // Hero's journey messaging framework
  assessment: 'good' | 'mixed' | 'bad';
  heroJourney: {
    honestHeader: string;
    whatTheyreGoodAt: string[];
    whereTheyFallShort: string[];
    realCustomerThemes: string[];
    bestPlans?: string[];
    bottomLine: string;
    recommendedAction: 'choose' | 'compare' | 'avoid';
  };
  marketingVsReality: {
    marketingClaims: string[];
    actualPerformance: string[];
  };
}

export interface Plan {
  id: string;
  providerId: string;
  name: string;
  type: 'fixed' | 'variable' | 'indexed';
  rate: number;
  termLength: number;
  renewablePercent: number;
  features: string[];
  fees: {
    monthlyFee: number;
    cancellationFee: number;
    connectionFee: number;
  };
}

export interface State {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  isDeregulated: boolean;
  averageRate: number;
  topCities: City[];
  utilityCompanies: string[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateSlug: string;
  zipCodes: string[];
  population: number;
  averageRate: number;
  topProviders: string[];
}

export interface ComparisonData {
  providers: Provider[];
  location?: {
    state: string;
    city?: string;
    zipCode?: string;
  };
  filters: {
    planType?: string;
    greenEnergy?: boolean;
    maxRate?: number;
    termLength?: number;
  };
}

export interface Review {
  id: string;
  providerId: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  verified: boolean;
}