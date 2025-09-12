// T028: PlansComparison component implementation  
// Side-by-side plan comparison with cost analysis and feature matrix (FR-006, FR-009)

import React, { memo, useState, useEffect, useMemo } from 'react';
import type { ElectricityPlan } from '../../lib/types/electricity-plan';
import type { ComparisonAnalysis } from '../../lib/plan-comparison/cost-analysis';
import type { FeatureMatrix } from '../../lib/plan-comparison/feature-matrix';
import { costAnalysisEngine, CostAnalysisUtils } from '../../lib/plan-comparison/cost-analysis';
import { featureMatrixBuilder, FeatureMatrixUtils } from '../../lib/plan-comparison/feature-matrix';

interface PlansComparisonProps {
  plans: ElectricityPlan[];
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: ElectricityPlan) => void;
  onClose?: () => void;
  monthlyUsage?: number;
  analysisMonths?: number;
  className?: string;
}

type ComparisonView = 'overview' | 'costs' | 'features';

const PlansComparison: React.FC<PlansComparisonProps> = memo(({
  plans,
  onRemovePlan,
  onSelectPlan,
  onClose,
  monthlyUsage = 1000,
  analysisMonths = 12,
  className = ''
}) => {
  const [currentView, setCurrentView] = useState<ComparisonView>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [costAnalysis, setCostAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [featureMatrix, setFeatureMatrix] = useState<FeatureMatrix | null>(null);

  // Generate analysis data
  useEffect(() => {
    const generateAnalysis = async () => {
      if (plans.length === 0) return;
      
      setIsLoading(true);
      try {
        // Generate cost analysis
        const costResult = costAnalysisEngine.comparePlans(plans, {
          monthlyUsageKwh: monthlyUsage,
          analysisMonths: analysisMonths,
          includePromotions: true,
          includeConnectFees: true,
          taxRate: 0
        });

        // Generate feature matrix
        const featureResult = featureMatrixBuilder.buildMatrix(plans, {
          showOnlyDifferences: false,
          highlightBestValues: true,
          includeAllFeatures: true,
          priorityFilter: 'all'
        });

        setCostAnalysis(costResult);
        setFeatureMatrix(featureResult);
      } catch (error) {
        console.error('[PlansComparison] Analysis error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateAnalysis();
  }, [plans, monthlyUsage, analysisMonths]);

  // Comparison highlights
  const highlights = useMemo(() => {
    if (!costAnalysis || !featureMatrix) return null;
    return FeatureMatrixUtils.getComparisonHighlights(featureMatrix);
  }, [costAnalysis, featureMatrix]);

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Plans to Compare
        </h3>
        <p className="text-gray-600">
          Add plans from the listings to see a detailed comparison
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const viewTabs: Array<{ id: ComparisonView; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'costs', label: 'Cost Analysis', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'features', label: 'Features', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Compare Plans ({plans.length}/4)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Comparing {monthlyUsage.toLocaleString()} kWh/month usage over {analysisMonths} months
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close comparison"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Comparison views">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === tab.id
                  ? 'border-texas-red text-texas-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={currentView === tab.id ? 'page' : undefined}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentView === 'overview' && (
          <OverviewView 
            plans={plans}
            costAnalysis={costAnalysis}
            highlights={highlights}
            onRemovePlan={onRemovePlan}
            onSelectPlan={onSelectPlan}
          />
        )}
        
        {currentView === 'costs' && costAnalysis && (
          <CostAnalysisView 
            analysis={costAnalysis}
            onRemovePlan={onRemovePlan}
            onSelectPlan={onSelectPlan}
          />
        )}
        
        {currentView === 'features' && featureMatrix && (
          <FeatureMatrixView 
            matrix={featureMatrix}
            onRemovePlan={onRemovePlan}
            onSelectPlan={onSelectPlan}
          />
        )}
      </div>
    </div>
  );
});

// Overview View Component
interface OverviewViewProps {
  plans: ElectricityPlan[];
  costAnalysis: ComparisonAnalysis | null;
  highlights: ReturnType<typeof FeatureMatrixUtils.getComparisonHighlights> | null;
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: ElectricityPlan) => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({ 
  plans, 
  costAnalysis, 
  highlights, 
  onRemovePlan, 
  onSelectPlan 
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Highlights */}
      {highlights && costAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-texas-red">
              {CostAnalysisUtils.formatCurrency(costAnalysis.summary.lowestCost.totalCost)}
            </div>
            <div className="text-sm text-gray-600">Lowest Total Cost</div>
            <div className="text-xs font-medium text-gray-900 mt-1">
              {costAnalysis.summary.lowestCost.planName}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-texas-red">
              {highlights.lowestRate.rate.toFixed(2)}¢
            </div>
            <div className="text-sm text-gray-600">Lowest Rate</div>
            <div className="text-xs font-medium text-gray-900 mt-1">
              {highlights.lowestRate.plan.planName}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-texas-red">
              {highlights.highestRating.rating.toFixed(1)}⭐
            </div>
            <div className="text-sm text-gray-600">Highest Rating</div>
            <div className="text-xs font-medium text-gray-900 mt-1">
              {highlights.highestRating.plan.providerName}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-texas-red">
              {highlights.mostGreen.percentage}%
            </div>
            <div className="text-sm text-gray-600">Most Green</div>
            <div className="text-xs font-medium text-gray-900 mt-1">
              {highlights.mostGreen.plan.planName}
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const planCostAnalysis = costAnalysis?.plans.find(p => p.planId === plan.id);
          return (
            <div key={plan.id} className="relative bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-texas-red transition-colors">
              {/* Remove Button */}
              <button
                onClick={() => onRemovePlan(plan.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-texas-red rounded-full flex items-center justify-center hover:bg-red-200 transition-colors text-xs"
                aria-label={`Remove ${plan.planName} from comparison`}
              >
                ×
              </button>

              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="font-bold text-texas-navy text-lg leading-tight mb-1">
                  {plan.planName}
                </h3>
                <p className="text-sm font-medium text-gray-600">
                  {plan.providerName}
                </p>
                
                {/* Rating */}
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3 h-3 ${
                          star <= plan.providerRating 
                            ? 'text-texas-gold fill-current' 
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-xs text-gray-600">
                      {plan.providerRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="font-bold text-texas-navy">
                    {plan.baseRate.toFixed(2)}¢/kWh
                  </span>
                </div>
                
                {planCostAnalysis && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Cost:</span>
                    <span className="font-bold text-texas-navy">
                      {CostAnalysisUtils.formatCurrency(planCostAnalysis.totalCost)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Contract:</span>
                  <span className="font-medium text-gray-900">
                    {plan.contractLength} months
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Fee:</span>
                  <span className="font-medium text-gray-900">
                    {plan.monthlyFee === 0 ? 'None' : CostAnalysisUtils.formatCurrency(plan.monthlyFee)}
                  </span>
                </div>

                {plan.greenEnergyPercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Green Energy:</span>
                    <span className="font-medium text-green-600">
                      {plan.greenEnergyPercentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Rank Badge */}
              {planCostAnalysis && (
                <div className="mb-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    planCostAnalysis.costRank === 1 
                      ? 'bg-green-100 text-green-800' 
                      : planCostAnalysis.costRank <= 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    #{planCostAnalysis.costRank} {CostAnalysisUtils.getCostLevelDescription(planCostAnalysis, costAnalysis!)}
                  </span>
                </div>
              )}

              {/* Select Button */}
              <button
                onClick={() => onSelectPlan(plan)}
                className="w-full py-2 bg-texas-red text-white font-medium rounded-md hover:bg-texas-red-600 transition-colors"
              >
                Select This Plan
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Cost Analysis View Component
interface CostAnalysisViewProps {
  analysis: ComparisonAnalysis;
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: ElectricityPlan) => void;
}

const CostAnalysisView: React.FC<CostAnalysisViewProps> = ({ 
  analysis, 
  onRemovePlan, 
  onSelectPlan 
}) => {
  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-texas-navy/10 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-navy-900">
            {CostAnalysisUtils.formatCurrency(analysis.summary.lowestCost.totalCost)}
          </div>
          <div className="text-sm text-texas-navy-700">Best Deal</div>
          <div className="text-xs font-medium text-texas-navy-900 mt-1">
            {analysis.summary.lowestCost.planName}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-navy-900">
            {CostAnalysisUtils.formatCurrency(analysis.summary.costSpread)}
          </div>
          <div className="text-sm text-texas-navy-700">Price Difference</div>
          <div className="text-xs text-texas-navy mt-1">
            Between highest and lowest
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-texas-navy-900">
            {CostAnalysisUtils.formatCurrency(analysis.summary.averageCost)}
          </div>
          <div className="text-sm text-texas-navy-700">Average Cost</div>
          <div className="text-xs text-texas-navy mt-1">
            Across all compared plans
          </div>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Rate</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Energy Cost</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Monthly Fees</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Promo Savings</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total Cost</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {analysis.plans
              .sort((a, b) => a.totalCost - b.totalCost)
              .map((planAnalysis) => {
                const plan = analysis.plans.find(p => p.planId === planAnalysis.planId);
                if (!plan) return null;

                return (
                  <tr key={planAnalysis.planId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{planAnalysis.planName}</div>
                        <div className="text-sm text-gray-500">{planAnalysis.providerName}</div>
                        {planAnalysis.costRank === 1 && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Best Deal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {planAnalysis.costPerKwh.toFixed(2)}¢/kWh
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {CostAnalysisUtils.formatCurrency(planAnalysis.breakdown.energyCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {CostAnalysisUtils.formatCurrency(planAnalysis.breakdown.monthlyFee)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {planAnalysis.breakdown.promotionalSavings > 0 ? (
                        <span className="text-green-600">
                          -{CostAnalysisUtils.formatCurrency(planAnalysis.breakdown.promotionalSavings)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-texas-navy">
                        {CostAnalysisUtils.formatCurrency(planAnalysis.totalCost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {CostAnalysisUtils.formatCurrency(planAnalysis.averageMonthlyCost)}/month
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectPlan({ id: planAnalysis.planId } as ElectricityPlan)}
                          className="px-3 py-1 bg-texas-red text-white text-xs font-medium rounded hover:bg-texas-red-600 transition-colors"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => onRemovePlan(planAnalysis.planId)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                          aria-label={`Remove ${planAnalysis.planName}`}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Monthly Projections */}
      {analysis.plans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cost Projections</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.plans.slice(0, 3).map((planAnalysis) => (
                <div key={planAnalysis.planId} className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900 mb-3">{planAnalysis.planName}</h4>
                  <div className="space-y-1 text-sm">
                    {planAnalysis.monthlyProjections.slice(0, 6).map((month) => (
                      <div key={month.month} className="flex justify-between">
                        <span className="text-gray-600">Month {month.month}:</span>
                        <span className="font-medium">
                          {CostAnalysisUtils.formatCurrency(month.netMonthlyCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Matrix View Component
interface FeatureMatrixViewProps {
  matrix: FeatureMatrix;
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: ElectricityPlan) => void;
}

const FeatureMatrixView: React.FC<FeatureMatrixViewProps> = ({ 
  matrix, 
  onRemovePlan, 
  onSelectPlan 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['pricing', 'contract']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Feature Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-900">
            {matrix.summary.totalFeatures}
          </div>
          <div className="text-sm text-green-700">Features Compared</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-900">
            {matrix.summary.sharedFeatures}
          </div>
          <div className="text-sm text-green-700">Shared Features</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-900">
            {Object.keys(matrix.summary.uniqueFeatures).length}
          </div>
          <div className="text-sm text-green-700">Plans with Unique Features</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-900">
            {matrix.categories.length}
          </div>
          <div className="text-sm text-green-700">Categories</div>
        </div>
      </div>

      {/* Feature Categories */}
      {matrix.categories.map((category) => {
        const categoryComparisons = matrix.comparisons.filter(c => c.categoryId === category.id);
        const isExpanded = expandedCategories.includes(category.id);

        return (
          <div key={category.id} className="border border-gray-200 rounded-lg">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {categoryComparisons.length} features
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="px-6 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-2 py-3 text-left text-sm font-medium text-gray-900">Feature</th>
                        {matrix.plans.map((plan) => (
                          <th key={plan.id} className="px-2 py-3 text-center text-sm font-medium text-gray-900 min-w-32">
                            <div>
                              <div className="truncate">{plan.planName}</div>
                              <div className="text-xs text-gray-500 font-normal">{plan.providerName}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categoryComparisons.map((comparison) => (
                        <tr key={comparison.feature} className="hover:bg-gray-50">
                          <td className="px-2 py-3 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{comparison.feature}</div>
                              {comparison.helpText && (
                                <div className="text-xs text-gray-500">{comparison.helpText}</div>
                              )}
                            </div>
                          </td>
                          {comparison.planValues.map((planValue) => (
                            <td key={planValue.planId} className="px-2 py-3 text-center text-sm">
                              {comparison.displayFormat === 'check' ? (
                                <div className="flex justify-center">
                                  {planValue.hasValue ? (
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ) : (
                                <div className={`${planValue.isHighlight ? 'font-bold text-texas-red' : 'text-gray-900'}`}>
                                  {planValue.displayValue}
                                  {planValue.isHighlight && (
                                    <div className="text-xs text-texas-red">★ Best</div>
                                  )}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

PlansComparison.displayName = 'PlansComparison';

export default PlansComparison;