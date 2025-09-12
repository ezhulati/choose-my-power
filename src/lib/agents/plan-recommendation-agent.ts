/**
 * LangGraph Plan Recommendation Agent
 * Intelligent multi-step reasoning for electricity plan recommendations
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { Plan, ApiParams } from '../../types/facets';
import { comparePowerClient } from '../api/comparepower-client';
import { getTdspFromCity, validateCitySlug } from '../../config/tdsp-mapping';

// Agent State Interface
interface PlanRecommendationState {
  messages: BaseMessage[];
  userPreferences: UserPreferences;
  availablePlans: Plan[];
  recommendations: PlanRecommendation[];
  analysisSteps: AnalysisStep[];
  currentStep: string;
  confidence: number;
  needsHumanInput?: boolean;
  error?: string;
}

interface UserPreferences {
  location: string;
  monthlyUsage: number;
  planType?: 'fixed' | 'variable' | 'indexed';
  contractLength?: number;
  greenEnergy?: boolean;
  budget?: number;
  priorities: ('price' | 'green' | 'stability' | 'flexibility')[];
}

interface PlanRecommendation {
  plan: Plan;
  score: number;
  reasoning: string;
  savings: number;
  pros: string[];
  cons: string[];
  confidence: number;
}

interface AnalysisStep {
  step: string;
  description: string;
  result: unknown;
  timestamp: Date;
}

// Tools for the agent
const fetchPlansForLocation = tool({
  name: "fetch_plans_for_location",
  description: "Fetch available electricity plans for a specific location",
  schema: z.object({
    citySlug: z.string().describe("City slug for the location"),
    zipCode: z.string().optional().describe("ZIP code for more precise results"),
  }),
  func: async ({ citySlug, zipCode }) => {
    try {
      if (!validateCitySlug(citySlug)) {
        throw new Error(`Invalid city slug: ${citySlug}`);
      }

      const apiParams: ApiParams = {
        city: citySlug,
        zip: zipCode,
      };

      const plans = await comparePowerClient.getPlansForCity(apiParams);
      return {
        success: true,
        plans: plans.slice(0, 20), // Limit to top 20 plans for analysis
        count: plans.length,
        tdsp: getTdspFromCity(citySlug),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        plans: [],
        count: 0,
      };
    }
  },
});

const calculatePlanSavings = tool({
  name: "calculate_plan_savings",
  description: "Calculate potential savings for a plan based on usage",
  schema: z.object({
    planId: z.string().describe("Plan ID to analyze"),
    monthlyUsage: z.number().describe("Monthly usage in kWh"),
    currentRate: z.number().optional().describe("Current rate for comparison"),
  }),
  func: async ({ planId, monthlyUsage, currentRate }) => {
    try {
      // This would integrate with your existing plan calculation logic
      const mockSavings = Math.random() * 200 - 50; // Placeholder calculation
      return {
        planId,
        monthlyUsage,
        estimatedMonthlyCost: monthlyUsage * 0.12, // Placeholder
        potentialSavings: mockSavings,
        annualSavings: mockSavings * 12,
        recommendation: mockSavings > 0 ? 'recommended' : 'not_recommended',
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Calculation failed',
      };
    }
  },
});

const analyzePlanFeatures = tool({
  name: "analyze_plan_features",
  description: "Analyze plan features against user preferences",
  schema: z.object({
    plan: z.any().describe("Plan object to analyze"),
    preferences: z.any().describe("User preferences object"),
  }),
  func: async ({ plan, preferences }) => {
    const features = {
      isGreen: plan.renewable_percentage > 0,
      contractLength: plan.contract_length,
      rateType: plan.rate_type,
      hasEarlyTerminationFee: plan.early_termination_fee > 0,
      monthlyFee: plan.monthly_fee || 0,
    };

    const compatibility = {
      greenMatch: preferences.greenEnergy ? features.isGreen : true,
      contractMatch: preferences.contractLength ? 
        features.contractLength === preferences.contractLength : true,
      typeMatch: preferences.planType ? 
        features.rateType === preferences.planType : true,
    };

    const score = Object.values(compatibility).filter(Boolean).length / 
                  Object.values(compatibility).length;

    return {
      features,
      compatibility,
      compatibilityScore: score,
      reasoning: `Plan ${compatibility.greenMatch ? 'matches' : 'does not match'} green energy preference, ${compatibility.contractMatch ? 'matches' : 'does not match'} contract length preference`,
    };
  },
});

// Agent workflow nodes
async function collectUserPreferences(state: PlanRecommendationState): Promise<Partial<PlanRecommendationState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Extract preferences from user message (simplified - would use more sophisticated NLP)
  const content = lastMessage.content.toString().toLowerCase();
  
  const preferences: Partial<UserPreferences> = {
    priorities: [],
  };

  // Simple keyword extraction (would be more sophisticated in production)
  if (content.includes('green') || content.includes('renewable')) {
    preferences.greenEnergy = true;
    preferences.priorities?.push('green');
  }
  if (content.includes('cheap') || content.includes('save')) {
    preferences.priorities?.push('price');
  }
  if (content.includes('fixed')) {
    preferences.planType = 'fixed';
    preferences.priorities?.push('stability');
  }

  const step: AnalysisStep = {
    step: 'collect_preferences',
    description: 'Extracted user preferences from conversation',
    result: preferences,
    timestamp: new Date(),
  };

  return {
    userPreferences: { ...state.userPreferences, ...preferences },
    analysisSteps: [...state.analysisSteps, step],
    currentStep: 'fetch_plans',
  };
}

async function fetchAvailablePlans(state: PlanRecommendationState): Promise<Partial<PlanRecommendationState>> {
  const location = state.userPreferences.location;
  
  if (!location) {
    return {
      error: 'Location not specified',
      needsHumanInput: true,
      currentStep: 'collect_preferences',
    };
  }

  try {
    const result = await fetchPlansForLocation.func({ citySlug: location });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const step: AnalysisStep = {
      step: 'fetch_plans',
      description: `Fetched ${result.count} plans for ${location}`,
      result: { count: result.count, tdsp: result.tdsp },
      timestamp: new Date(),
    };

    return {
      availablePlans: result.plans,
      analysisSteps: [...state.analysisSteps, step],
      currentStep: 'analyze_plans',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch plans',
      currentStep: 'error',
    };
  }
}

async function analyzePlans(state: PlanRecommendationState): Promise<Partial<PlanRecommendationState>> {
  const { availablePlans, userPreferences } = state;
  
  if (!availablePlans.length) {
    return {
      error: 'No plans available for analysis',
      currentStep: 'error',
    };
  }

  const recommendations: PlanRecommendation[] = [];

  // Analyze each plan
  for (const plan of availablePlans.slice(0, 5)) { // Limit to top 5 for detailed analysis
    try {
      const [savingsResult, featuresResult] = await Promise.all([
        calculatePlanSavings.func({
          planId: plan.plan_id,
          monthlyUsage: userPreferences.monthlyUsage || 1000,
        }),
        analyzePlanFeatures.func({
          plan,
          preferences: userPreferences,
        }),
      ]);

      if (!savingsResult.error && featuresResult.compatibilityScore) {
        const score = (featuresResult.compatibilityScore * 0.6) + 
                     ((savingsResult.potentialSavings > 0 ? 1 : 0) * 0.4);

        recommendations.push({
          plan,
          score,
          reasoning: `${featuresResult.reasoning}. Estimated ${savingsResult.potentialSavings > 0 ? 'savings' : 'additional cost'} of $${Math.abs(savingsResult.potentialSavings)}/month`,
          savings: savingsResult.potentialSavings,
          pros: [
            ...(featuresResult.features.isGreen ? ['Renewable energy'] : []),
            ...(savingsResult.potentialSavings > 0 ? [`Save $${savingsResult.potentialSavings}/month`] : []),
            ...(featuresResult.features.contractLength <= 12 ? ['Short-term commitment'] : []),
          ],
          cons: [
            ...(featuresResult.features.hasEarlyTerminationFee ? ['Early termination fee'] : []),
            ...(featuresResult.features.monthlyFee > 0 ? [`$${featuresResult.features.monthlyFee} monthly fee`] : []),
            ...(savingsResult.potentialSavings < 0 ? [`$${Math.abs(savingsResult.potentialSavings)} more expensive`] : []),
          ],
          confidence: featuresResult.compatibilityScore,
        });
      }
    } catch (error) {
      console.error(`Error analyzing plan ${plan.plan_id}:`, error);
    }
  }

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);

  const step: AnalysisStep = {
    step: 'analyze_plans',
    description: `Analyzed ${availablePlans.length} plans, created ${recommendations.length} recommendations`,
    result: { recommendationCount: recommendations.length },
    timestamp: new Date(),
  };

  return {
    recommendations,
    analysisSteps: [...state.analysisSteps, step],
    currentStep: 'generate_response',
    confidence: recommendations.length > 0 ? recommendations[0].confidence : 0,
  };
}

async function generateResponse(state: PlanRecommendationState): Promise<Partial<PlanRecommendationState>> {
  const { recommendations, userPreferences, analysisSteps } = state;
  
  if (!recommendations.length) {
    const errorMessage = new AIMessage({
      content: "I wasn't able to find suitable plans for your preferences. Could you provide more details about your location and usage requirements?",
    });
    
    return {
      messages: [...state.messages, errorMessage],
      currentStep: 'complete',
    };
  }

  const topRecommendation = recommendations[0];
  const analysisLog = analysisSteps.map(step => `${step.step}: ${step.description}`).join(', ');

  const responseContent = `
Based on your preferences for ${userPreferences.location}, I've analyzed ${state.availablePlans.length} available plans. Here are my top recommendations:

**🏆 Top Recommendation: ${topRecommendation.plan.plan_name}**
- Provider: ${topRecommendation.plan.company}
- Rate: ${topRecommendation.plan.rate_display}
- ${topRecommendation.reasoning}
- Confidence: ${(topRecommendation.confidence * 100).toFixed(1)}%

**Pros:**
${topRecommendation.pros.map(pro => `✅ ${pro}`).join('\n')}

**Cons:**
${topRecommendation.cons.map(con => `⚠️ ${con}`).join('\n')}

${recommendations.length > 1 ? `
**Other Good Options:**
${recommendations.slice(1, 3).map((rec, i) => `
${i + 2}. ${rec.plan.plan_name} - ${rec.plan.company}
   Score: ${(rec.score * 100).toFixed(1)}% | ${rec.reasoning}
`).join('')}
` : ''}

*Analysis completed: ${analysisLog}*

Would you like me to explain any of these recommendations in more detail or help you with the signup process?
`;

  const responseMessage = new AIMessage({ content: responseContent });

  return {
    messages: [...state.messages, responseMessage],
    currentStep: 'complete',
  };
}

// Create the workflow
function createPlanRecommendationWorkflow() {
  const workflow = new StateGraph<PlanRecommendationState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      userPreferences: {
        value: (x: UserPreferences, y: UserPreferences) => ({ ...x, ...y }),
        default: () => ({ location: '', monthlyUsage: 1000, priorities: [] }),
      },
      availablePlans: {
        value: (x: Plan[], y: Plan[]) => y || x,
        default: () => [],
      },
      recommendations: {
        value: (x: PlanRecommendation[], y: PlanRecommendation[]) => y || x,
        default: () => [],
      },
      analysisSteps: {
        value: (x: AnalysisStep[], y: AnalysisStep[]) => x.concat(y),
        default: () => [],
      },
      currentStep: {
        value: (x: string, y: string) => y || x,
        default: () => 'collect_preferences',
      },
      confidence: {
        value: (x: number, y: number) => y ?? x,
        default: () => 0,
      },
      needsHumanInput: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false,
      },
      error: {
        value: (x: string, y: string) => y || x,
        default: () => '',
      },
    },
  });

  // Add nodes
  workflow.addNode("collect_preferences", collectUserPreferences);
  workflow.addNode("fetch_plans", fetchAvailablePlans);
  workflow.addNode("analyze_plans", analyzePlans);
  workflow.addNode("generate_response", generateResponse);

  // Define edges
  workflow.addEdge(START, "collect_preferences");
  workflow.addEdge("collect_preferences", "fetch_plans");
  workflow.addEdge("fetch_plans", "analyze_plans");
  workflow.addEdge("analyze_plans", "generate_response");
  workflow.addEdge("generate_response", END);

  return workflow.compile();
}

// Export the main agent
export class PlanRecommendationAgent {
  private workflow: ReturnType<typeof createPlanRecommendationWorkflow>;

  constructor() {
    this.workflow = createPlanRecommendationWorkflow();
  }

  async recommend(userMessage: string, location: string, preferences?: Partial<UserPreferences>): Promise<{
    response: string;
    recommendations: PlanRecommendation[];
    confidence: number;
    analysisSteps: AnalysisStep[];
  }> {
    const initialState: PlanRecommendationState = {
      messages: [new HumanMessage(userMessage)],
      userPreferences: {
        location,
        monthlyUsage: preferences?.monthlyUsage || 1000,
        planType: preferences?.planType,
        contractLength: preferences?.contractLength,
        greenEnergy: preferences?.greenEnergy,
        budget: preferences?.budget,
        priorities: preferences?.priorities || [],
      },
      availablePlans: [],
      recommendations: [],
      analysisSteps: [],
      currentStep: 'collect_preferences',
      confidence: 0,
    };

    try {
      const result = await this.workflow.invoke(initialState);
      
      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage.content.toString();

      return {
        response,
        recommendations: result.recommendations,
        confidence: result.confidence,
        analysisSteps: result.analysisSteps,
      };
    } catch (error) {
      console.error('Plan recommendation agent error:', error);
      return {
        response: 'I encountered an error while analyzing plans. Please try again or contact support.',
        recommendations: [],
        confidence: 0,
        analysisSteps: [],
      };
    }
  }

  async streamRecommendation(userMessage: string, location: string, preferences?: Partial<UserPreferences>) {
    const initialState: PlanRecommendationState = {
      messages: [new HumanMessage(userMessage)],
      userPreferences: { location, monthlyUsage: 1000, priorities: [], ...preferences },
      availablePlans: [],
      recommendations: [],
      analysisSteps: [],
      currentStep: 'collect_preferences',
      confidence: 0,
    };

    // Return async generator for streaming
    return this.workflow.stream(initialState);
  }
}

// Create singleton instance
export const planRecommendationAgent = new PlanRecommendationAgent();