// T022: Comparison selection logic
// Side-by-side plan comparison state management (FR-006: up to 4 plans)

import type { ElectricityPlan } from '../types/electricity-plan';
import type { ComparisonState } from '../types/comparison-state';

export class ComparisonStateManager {
  private static readonly MAX_COMPARISONS = 4;
  private static readonly STORAGE_KEY = 'cmp-comparison-state';
  private static readonly EXPIRY_HOURS = 24;

  private state: ComparisonState = {
    selectedPlans: [],
    lastUpdated: new Date(),
    sessionId: this.generateSessionId(),
    comparisonSettings: {
      showAllFeatures: false,
      highlightDifferences: true,
      sortBy: 'baseRate',
      showCalculations: true
    }
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add plan to comparison set (FR-006)
   */
  addPlan(plan: ElectricityPlan): {
    success: boolean;
    message: string;
    comparisonCount: number;
  } {
    // Validate plan has required fields
    if (!plan.id || !plan.planName || !plan.providerName) {
      return {
        success: false,
        message: 'Invalid plan data - missing required fields',
        comparisonCount: this.state.selectedPlans.length
      };
    }

    // Check if already in comparison
    if (this.state.selectedPlans.some(p => p.id === plan.id)) {
      return {
        success: false,
        message: 'Plan is already in comparison',
        comparisonCount: this.state.selectedPlans.length
      };
    }

    // Check maximum limit
    if (this.state.selectedPlans.length >= ComparisonStateManager.MAX_COMPARISONS) {
      return {
        success: false,
        message: `Maximum ${ComparisonStateManager.MAX_COMPARISONS} plans can be compared`,
        comparisonCount: this.state.selectedPlans.length
      };
    }

    // Add plan and update state
    this.state.selectedPlans.push(plan);
    this.state.lastUpdated = new Date();
    this.saveToStorage();

    return {
      success: true,
      message: `${plan.planName} added to comparison`,
      comparisonCount: this.state.selectedPlans.length
    };
  }

  /**
   * Remove plan from comparison
   */
  removePlan(planId: string): {
    success: boolean;
    message: string;
    comparisonCount: number;
  } {
    const initialCount = this.state.selectedPlans.length;
    this.state.selectedPlans = this.state.selectedPlans.filter(p => p.id !== planId);
    
    const wasRemoved = this.state.selectedPlans.length < initialCount;
    
    if (wasRemoved) {
      this.state.lastUpdated = new Date();
      this.saveToStorage();
    }

    return {
      success: wasRemoved,
      message: wasRemoved ? 'Plan removed from comparison' : 'Plan not found in comparison',
      comparisonCount: this.state.selectedPlans.length
    };
  }

  /**
   * Clear all plans from comparison
   */
  clearComparison(): void {
    this.state.selectedPlans = [];
    this.state.lastUpdated = new Date();
    this.saveToStorage();
  }

  /**
   * Get current comparison state
   */
  getState(): ComparisonState {
    return { ...this.state };
  }

  /**
   * Get selected plans array
   */
  getSelectedPlans(): ElectricityPlan[] {
    return [...this.state.selectedPlans];
  }

  /**
   * Get comparison count
   */
  getComparisonCount(): number {
    return this.state.selectedPlans.length;
  }

  /**
   * Check if plan is selected for comparison
   */
  isPlanSelected(planId: string): boolean {
    return this.state.selectedPlans.some(p => p.id === planId);
  }

  /**
   * Check if comparison is full
   */
  isComparisonFull(): boolean {
    return this.state.selectedPlans.length >= ComparisonStateManager.MAX_COMPARISONS;
  }

  /**
   * Get remaining comparison slots
   */
  getRemainingSlots(): number {
    return Math.max(0, ComparisonStateManager.MAX_COMPARISONS - this.state.selectedPlans.length);
  }

  /**
   * Toggle plan in comparison (add if not present, remove if present)
   */
  togglePlan(plan: ElectricityPlan): {
    action: 'added' | 'removed' | 'error';
    success: boolean;
    message: string;
    comparisonCount: number;
  } {
    const isSelected = this.isPlanSelected(plan.id);
    
    if (isSelected) {
      const result = this.removePlan(plan.id);
      return {
        action: 'removed',
        ...result
      };
    } else {
      const result = this.addPlan(plan);
      return {
        action: result.success ? 'added' : 'error',
        ...result
      };
    }
  }

  /**
   * Update comparison settings
   */
  updateSettings(settings: Partial<ComparisonState['comparisonSettings']>): void {
    this.state.comparisonSettings = {
      ...this.state.comparisonSettings,
      ...settings
    };
    this.state.lastUpdated = new Date();
    this.saveToStorage();
  }

  /**
   * Reorder plans in comparison for better UX
   */
  reorderPlans(newOrder: string[]): {
    success: boolean;
    message: string;
  } {
    // Validate that all plan IDs exist and count matches
    if (newOrder.length !== this.state.selectedPlans.length) {
      return {
        success: false,
        message: 'Invalid reorder: plan count mismatch'
      };
    }

    const allPlansExist = newOrder.every(id => 
      this.state.selectedPlans.some(p => p.id === id)
    );

    if (!allPlansExist) {
      return {
        success: false,
        message: 'Invalid reorder: unknown plan ID'
      };
    }

    // Reorder plans according to new order
    const reorderedPlans: ElectricityPlan[] = [];
    newOrder.forEach(id => {
      const plan = this.state.selectedPlans.find(p => p.id === id);
      if (plan) reorderedPlans.push(plan);
    });

    this.state.selectedPlans = reorderedPlans;
    this.state.lastUpdated = new Date();
    this.saveToStorage();

    return {
      success: true,
      message: 'Plans reordered successfully'
    };
  }

  /**
   * Get comparison analytics for tracking
   */
  getComparisonAnalytics(): {
    planCount: number;
    providerCount: number;
    averageRate: number;
    contractLengthRange: { min: number; max: number };
    sessionDuration: number;
    commonFeatures: string[];
    priceSpread: number;
  } {
    const plans = this.state.selectedPlans;
    
    if (plans.length === 0) {
      return {
        planCount: 0,
        providerCount: 0,
        averageRate: 0,
        contractLengthRange: { min: 0, max: 0 },
        sessionDuration: 0,
        commonFeatures: [],
        priceSpread: 0
      };
    }

    // Calculate metrics
    const rates = plans.map(p => p.baseRate);
    const averageRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const priceSpread = maxRate - minRate;

    const providers = new Set(plans.map(p => p.providerName));
    const providerCount = providers.size;

    const contractLengths = plans.map(p => p.contractLength);
    const contractLengthRange = {
      min: Math.min(...contractLengths),
      max: Math.max(...contractLengths)
    };

    // Find common features across all plans
    const allFeatures = plans.map(p => p.planFeatures);
    const commonFeatures = allFeatures.reduce((common, features) => 
      common.filter(feature => features.includes(feature))
    );

    const sessionDuration = Date.now() - this.state.lastUpdated.getTime();

    return {
      planCount: plans.length,
      providerCount,
      averageRate: Math.round(averageRate * 100) / 100,
      contractLengthRange,
      sessionDuration,
      commonFeatures,
      priceSpread: Math.round(priceSpread * 100) / 100
    };
  }

  /**
   * Validate comparison state integrity
   */
  validateState(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check plan count
    if (this.state.selectedPlans.length > ComparisonStateManager.MAX_COMPARISONS) {
      errors.push(`Too many plans in comparison (${this.state.selectedPlans.length}/${ComparisonStateManager.MAX_COMPARISONS})`);
    }

    // Check for duplicate plans
    const planIds = this.state.selectedPlans.map(p => p.id);
    const uniqueIds = new Set(planIds);
    if (planIds.length !== uniqueIds.size) {
      errors.push('Duplicate plans found in comparison');
    }

    // Check plan data integrity
    this.state.selectedPlans.forEach((plan, index) => {
      if (!plan.id || !plan.planName || !plan.providerName) {
        errors.push(`Plan ${index + 1} missing required data`);
      }
      if (typeof plan.baseRate !== 'number' || plan.baseRate <= 0) {
        warnings.push(`Plan ${index + 1} has invalid rate`);
      }
    });

    // Check session age
    const ageHours = (Date.now() - this.state.lastUpdated.getTime()) / (1000 * 60 * 60);
    if (ageHours > ComparisonStateManager.EXPIRY_HOURS) {
      warnings.push('Comparison session is older than 24 hours');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate shareable comparison URL
   */
  generateShareableURL(baseURL: string = ''): string {
    if (this.state.selectedPlans.length === 0) {
      return '';
    }

    const planIds = this.state.selectedPlans.map(p => p.id).join(',');
    const city = this.state.selectedPlans[0].serviceArea?.[0] || 'houston';
    
    return `${baseURL}/electricity-plans/${city}-tx/compare/?plans=${planIds}`;
  }

  /**
   * Load comparison from shareable URL
   */
  loadFromShareableURL(planIds: string[], planLookupFn: (id: string) => Promise<ElectricityPlan | null>): Promise<{
    success: boolean;
    loadedCount: number;
    failedIds: string[];
  }> {
    return new Promise(async (resolve) => {
      const results = {
        success: true,
        loadedCount: 0,
        failedIds: [] as string[]
      };

      // Clear current comparison
      this.clearComparison();

      // Load each plan
      for (const planId of planIds.slice(0, ComparisonStateManager.MAX_COMPARISONS)) {
        try {
          const plan = await planLookupFn(planId);
          if (plan) {
            const addResult = this.addPlan(plan);
            if (addResult.success) {
              results.loadedCount++;
            } else {
              results.failedIds.push(planId);
            }
          } else {
            results.failedIds.push(planId);
          }
        } catch (error) {
          results.failedIds.push(planId);
        }
      }

      results.success = results.loadedCount > 0;
      resolve(results);
    });
  }

  /**
   * Save state to localStorage with expiry
   */
  private saveToStorage(): void {
    try {
      const storageData = {
        state: this.state,
        expiry: Date.now() + (ComparisonStateManager.EXPIRY_HOURS * 60 * 60 * 1000)
      };
      localStorage.setItem(ComparisonStateManager.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.warn('[ComparisonStateManager] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage with expiry check
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(ComparisonStateManager.STORAGE_KEY);
      if (!stored) return;

      const storageData = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() > storageData.expiry) {
        localStorage.removeItem(ComparisonStateManager.STORAGE_KEY);
        return;
      }

      // Restore state with date object conversion
      this.state = {
        ...storageData.state,
        lastUpdated: new Date(storageData.state.lastUpdated)
      };
    } catch (error) {
      console.warn('[ComparisonStateManager] Failed to load from localStorage:', error);
      localStorage.removeItem(ComparisonStateManager.STORAGE_KEY);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset to fresh state
   */
  reset(): void {
    this.state = {
      selectedPlans: [],
      lastUpdated: new Date(),
      sessionId: this.generateSessionId(),
      comparisonSettings: {
        showAllFeatures: false,
        highlightDifferences: true,
        sortBy: 'baseRate',
        showCalculations: true
      }
    };
    this.saveToStorage();
  }

  /**
   * Get comparison state summary for UI
   */
  getStateSummary(): {
    count: number;
    isFull: boolean;
    hasPlans: boolean;
    canAddMore: boolean;
    remainingSlots: number;
    providers: string[];
  } {
    const count = this.state.selectedPlans.length;
    const providers = [...new Set(this.state.selectedPlans.map(p => p.providerName))];
    
    return {
      count,
      isFull: count >= ComparisonStateManager.MAX_COMPARISONS,
      hasPlans: count > 0,
      canAddMore: count < ComparisonStateManager.MAX_COMPARISONS,
      remainingSlots: ComparisonStateManager.MAX_COMPARISONS - count,
      providers
    };
  }
}

// Export singleton instance for consistent usage across app
export const comparisonStateManager = new ComparisonStateManager();

// React hook type for component integration
export interface UseComparisonStateResult {
  selectedPlans: ElectricityPlan[];
  comparisonCount: number;
  isFull: boolean;
  canAddMore: boolean;
  addPlan: (plan: ElectricityPlan) => { success: boolean; message: string };
  removePlan: (planId: string) => { success: boolean; message: string };
  togglePlan: (plan: ElectricityPlan) => { action: 'added' | 'removed' | 'error'; success: boolean; message: string };
  clearComparison: () => void;
  isPlanSelected: (planId: string) => boolean;
  updateSettings: (settings: Partial<ComparisonState['comparisonSettings']>) => void;
  shareableURL: string;
  analytics: ReturnType<ComparisonStateManager['getComparisonAnalytics']>;
}

/**
 * React hook factory for comparison state management
 * Usage in components: const { selectedPlans, addPlan, togglePlan } = useComparisonState();
 */
export const createComparisonStateHook = () => {
  return (): UseComparisonStateResult => {
    // This will be implemented when React components are created
    // Placeholder structure for type safety
    return {
      selectedPlans: comparisonStateManager.getSelectedPlans(),
      comparisonCount: comparisonStateManager.getComparisonCount(),
      isFull: comparisonStateManager.isComparisonFull(),
      canAddMore: !comparisonStateManager.isComparisonFull(),
      addPlan: () => ({ success: false, message: '' }),
      removePlan: () => ({ success: false, message: '' }),
      togglePlan: () => ({ action: 'error', success: false, message: '' }),
      clearComparison: () => {},
      isPlanSelected: () => false,
      updateSettings: () => {},
      shareableURL: '',
      analytics: comparisonStateManager.getComparisonAnalytics()
    };
  };
};