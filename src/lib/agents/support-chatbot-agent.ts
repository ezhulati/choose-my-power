/**
 * LangGraph Customer Support Chatbot Agent
 * Stateful conversational agent for electricity plan support and guidance
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { Plan } from '../../types/facets';
import { comparePowerClient } from '../api/comparepower-client';
import { getTdspFromCity, validateCitySlug, formatCityName } from '../../config/tdsp-mapping';
import { planRecommendationAgent } from './plan-recommendation-agent';

// Chatbot State Interface
interface SupportChatbotState {
  messages: BaseMessage[];
  userProfile: UserProfile;
  conversationContext: ConversationContext;
  currentIntent: Intent;
  actionQueue: Action[];
  sessionData: SessionData;
  needsHumanHandoff: boolean;
  confidenceScore: number;
  lastActivity: Date;
}

interface UserProfile {
  sessionId: string;
  location?: string;
  monthlyUsage?: number;
  currentProvider?: string;
  preferences: {
    planType?: 'fixed' | 'variable' | 'indexed';
    contractLength?: number;
    greenEnergy?: boolean;
    budgetRange?: [number, number];
    priorities: ('price' | 'green' | 'stability' | 'service')[];
  };
  previousQuestions: string[];
  satisfactionRating?: number;
}

interface ConversationContext {
  topic: 'plan_comparison' | 'signup_help' | 'bill_questions' | 'general_info' | 'complaint' | 'technical_support';
  subTopic?: string;
  stage: 'greeting' | 'information_gathering' | 'analysis' | 'recommendation' | 'followup' | 'escalation';
  entities: {
    cityMentioned?: string;
    providerMentioned?: string;
    planMentioned?: string;
    usageMentioned?: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
}

interface Intent {
  primary: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresAction: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface Action {
  type: 'fetch_plans' | 'calculate_savings' | 'provide_info' | 'escalate' | 'collect_feedback';
  parameters: Record<string, any>;
  priority: number;
  estimatedTime: number;
}

interface SessionData {
  startTime: Date;
  messageCount: number;
  topicsDiscussed: string[];
  plansViewed: string[];
  actionsCompleted: string[];
  isResolved: boolean;
  escalated: boolean;
  feedbackGiven: boolean;
}

// Tools for the support agent
const identifyUserIntent = tool({
  name: "identify_user_intent",
  description: "Analyze user message to identify intent and extract entities",
  schema: z.object({
    message: z.string().describe("User message to analyze"),
    conversationHistory: z.array(z.string()).describe("Previous messages for context"),
  }),
  func: async ({ message, conversationHistory }) => {
    const lowerMessage = message.toLowerCase();
    
    // Intent classification (simplified - would use ML model in production)
    const intents = {
      plan_comparison: ['compare', 'plans', 'best plan', 'cheapest', 'recommend'],
      signup_help: ['sign up', 'enroll', 'switch', 'how to', 'process'],
      bill_questions: ['bill', 'rate', 'charge', 'fee', 'cost'],
      complaint: ['problem', 'issue', 'wrong', 'error', 'dissatisfied', 'unhappy'],
      technical_support: ['website', 'login', 'password', 'error', 'broken'],
      general_info: ['how does', 'what is', 'explain', 'tell me about'],
    };

    let primaryIntent = 'general_info';
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
      const score = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent;
      }
    }

    // Entity extraction
    const entities = {
      cityMentioned: extractCity(message),
      usageMentioned: extractUsage(message),
      providerMentioned: extractProvider(message),
    };

    // Sentiment analysis (simplified)
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry', 'problem'];
    const positiveWords = ['good', 'great', 'excellent', 'love', 'happy', 'satisfied'];
    
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' = 'neutral';
    if (negativeCount > positiveCount) {
      sentiment = negativeCount > 2 ? 'frustrated' : 'negative';
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
    }

    return {
      primary: primaryIntent,
      confidence: Math.min(maxScore / 3, 1),
      entities,
      sentiment,
      complexity: maxScore > 2 ? 'complex' : maxScore > 0 ? 'moderate' : 'simple',
      requiresAction: ['plan_comparison', 'signup_help', 'complaint'].includes(primaryIntent),
    };
  },
});

const fetchRelevantPlans = tool({
  name: "fetch_relevant_plans",
  description: "Fetch electricity plans relevant to user's location and preferences",
  schema: z.object({
    location: z.string().describe("City or location"),
    preferences: z.any().optional().describe("User preferences object"),
  }),
  func: async ({ location, preferences = {} }) => {
    try {
      if (!validateCitySlug(location)) {
        return {
          success: false,
          error: 'Invalid location provided',
          suggestions: ['houston-tx', 'dallas-tx', 'austin-tx', 'san-antonio-tx'],
        };
      }

      const plans = await comparePowerClient.getPlansForCity({ city: location });
      
      // Apply basic filtering based on preferences
      let filteredPlans = plans;
      
      if (preferences.planType) {
        filteredPlans = filteredPlans.filter(plan => 
          plan.rate_type?.toLowerCase() === preferences.planType
        );
      }

      if (preferences.greenEnergy) {
        filteredPlans = filteredPlans.filter(plan => 
          (plan.renewable_percentage || 0) > 0
        );
      }

      if (preferences.contractLength) {
        filteredPlans = filteredPlans.filter(plan => 
          plan.contract_length === preferences.contractLength
        );
      }

      // Sort by rate for basic ranking
      filteredPlans.sort((a, b) => {
        const rateA = parseFloat(a.rate_display?.replace(/[^\d.]/g, '') || '0');
        const rateB = parseFloat(b.rate_display?.replace(/[^\d.]/g, '') || '0');
        return rateA - rateB;
      });

      return {
        success: true,
        plans: filteredPlans.slice(0, 5), // Top 5 relevant plans
        totalAvailable: plans.length,
        location: formatCityName(location),
        tdsp: getTdspFromCity(location),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch plans',
        plans: [],
      };
    }
  },
});

const generatePlanSummary = tool({
  name: "generate_plan_summary",
  description: "Generate a user-friendly summary of electricity plans",
  schema: z.object({
    plans: z.array(z.any()).describe("Array of plan objects"),
    userPreferences: z.any().describe("User preferences for context"),
  }),
  func: async ({ plans, userPreferences }) => {
    if (!plans.length) {
      return {
        summary: "No plans found matching your criteria. Let me help you adjust your preferences or suggest alternatives.",
        recommendations: [],
      };
    }

    const summaries = plans.map((plan, index) => {
      const rate = plan.rate_display || 'Rate not available';
      const provider = plan.company || 'Unknown provider';
      const contract = plan.contract_length ? `${plan.contract_length}-month contract` : 'Contract length varies';
      const green = (plan.renewable_percentage || 0) > 0 ? 
        `${plan.renewable_percentage}% renewable` : 'Non-renewable';
      
      const pros = [];
      const cons = [];

      // Analyze plan features
      if ((plan.renewable_percentage || 0) > 50) pros.push('High renewable content');
      if (plan.contract_length <= 12) pros.push('Flexible contract');
      if (!plan.monthly_fee || plan.monthly_fee === 0) pros.push('No monthly fee');
      
      if (plan.early_termination_fee > 0) cons.push(`$${plan.early_termination_fee} early termination fee`);
      if (plan.monthly_fee > 0) cons.push(`$${plan.monthly_fee} monthly fee`);

      return {
        rank: index + 1,
        planName: plan.plan_name || 'Unnamed Plan',
        provider,
        rate,
        contract,
        green,
        pros,
        cons,
        planId: plan.plan_id,
      };
    });

    const summary = `I found ${plans.length} electricity plans for you${userPreferences.location ? ` in ${formatCityName(userPreferences.location)}` : ''}. Here are the top options:

${summaries.map(plan => `
**${plan.rank}. ${plan.planName}** - ${plan.provider}
💰 Rate: ${plan.rate}
📅 ${plan.contract}
🌱 ${plan.green}
${plan.pros.length ? `✅ ${plan.pros.join(', ')}` : ''}
${plan.cons.length ? `⚠️ ${plan.cons.join(', ')}` : ''}
`).join('\n')}

Would you like me to explain any of these plans in more detail or help you with the signup process?`;

    return {
      success: true,
      summary,
      recommendations: summaries,
    };
  },
});

const checkEscalationNeeds = tool({
  name: "check_escalation_needs",
  description: "Determine if the conversation needs human escalation",
  schema: z.object({
    conversationContext: z.any().describe("Current conversation context"),
    userProfile: z.any().describe("User profile information"),
    messages: z.array(z.any()).describe("Conversation messages"),
  }),
  func: async ({ conversationContext, userProfile, messages }) => {
    const escalationTriggers = {
      frustrationLevel: conversationContext.sentiment === 'frustrated',
      complexIssue: conversationContext.topic === 'complaint' && conversationContext.stage === 'escalation',
      repetitiveQuestions: userProfile.previousQuestions.filter(q => 
        userProfile.previousQuestions.includes(q)
      ).length > 2,
      longConversation: messages.length > 20,
      technicalIssues: conversationContext.topic === 'technical_support' && 
                      conversationContext.subTopic === 'complex_error',
      explicitRequest: messages.some(msg => 
        msg.content.toLowerCase().includes('human') || 
        msg.content.toLowerCase().includes('agent') ||
        msg.content.toLowerCase().includes('supervisor')
      ),
    };

    const triggeredReasons = Object.entries(escalationTriggers)
      .filter(([_, triggered]) => triggered)
      .map(([reason, _]) => reason);

    const needsEscalation = triggeredReasons.length > 0;
    const urgency = triggeredReasons.includes('explicitRequest') || 
                   triggeredReasons.includes('frustrationLevel') ? 'high' : 'medium';

    return {
      needsEscalation,
      reasons: triggeredReasons,
      urgency,
      recommendation: needsEscalation ? 
        'Transfer to human agent for better assistance' : 
        'Continue with automated support',
    };
  },
});

// Helper functions
function extractCity(message: string): string | undefined {
  const cityPattern = /\b(houston|dallas|austin|san antonio|fort worth|el paso|arlington|corpus christi|plano|lubbock|garland|irving|amarillo|grand prairie|brownsville|pasadena|mesquite|mckinney|carrollton|beaumont|abilene|waco|midland|denton|odessa|round rock|richardson|tyler|lewisville|college station|pearland|killeen|sugar land|flower mound|missouri city|allen|league city|cedar park|bryan|pharr|san marcos|longview|baytown|conroe|port arthur|new braunfels|temple|rosenberg|mansfield|cedar hill|harlingen|north richland hills|victoria|pflugerville|burleson|texarkana|frisco|huntsville|bedford|keller|wylie|coppell|desoto|duncanville|missouri city|euless|grapevine|georgetown|leander|rockwall|hurst|nacogdoches|cleburne|galveston|sherman|waxahachie|lufkin|weatherford|greenville|paris|marshall|orange|athens|palestine|corsicana|stephenville|mineral wells|seguin|alice|del rio|eagle pass|uvalde|kerrville|huntsville|jasper|livingston|carthage|center|henderson|jefferson|gilmer|kilgore|tyler|longview|marshall|carthage|center|henderson|jefferson|gilmer)\b/i;
  
  const match = message.match(cityPattern);
  return match ? `${match[1].toLowerCase().replace(' ', '-')}-tx` : undefined;
}

function extractUsage(message: string): number | undefined {
  const usagePattern = /(\d+)\s*kwh|(\d+)\s*kilowatt|usage.*?(\d+)|(\d+).*?usage/i;
  const match = message.match(usagePattern);
  return match ? parseInt(match[1] || match[2] || match[3] || match[4]) : undefined;
}

function extractProvider(message: string): string | undefined {
  const providers = ['reliant', 'txu', 'direct energy', 'green mountain', 'just energy', 'champion energy', 'constellation', 'pulse power', 'gexa', 'griddy'];
  const mentioned = providers.find(provider => 
    message.toLowerCase().includes(provider)
  );
  return mentioned;
}

// Workflow nodes
async function analyzeUserInput(state: SupportChatbotState): Promise<Partial<SupportChatbotState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!(lastMessage instanceof HumanMessage)) {
    return state;
  }

  const conversationHistory = state.messages
    .filter(msg => msg instanceof HumanMessage)
    .map(msg => msg.content.toString());

  const intentResult = await identifyUserIntent.func({
    message: lastMessage.content.toString(),
    conversationHistory,
  });

  return {
    currentIntent: {
      primary: intentResult.primary,
      confidence: intentResult.confidence,
      parameters: intentResult.entities,
      requiresAction: intentResult.requiresAction,
      complexity: intentResult.complexity,
    },
    conversationContext: {
      ...state.conversationContext,
      topic: intentResult.primary as any,
      entities: intentResult.entities,
      sentiment: intentResult.sentiment,
      stage: intentResult.requiresAction ? 'analysis' : 'information_gathering',
    },
    userProfile: {
      ...state.userProfile,
      location: intentResult.entities.cityMentioned || state.userProfile.location,
      monthlyUsage: intentResult.entities.usageMentioned || state.userProfile.monthlyUsage,
      previousQuestions: [...state.userProfile.previousQuestions, lastMessage.content.toString()],
    },
  };
}

async function processUserRequest(state: SupportChatbotState): Promise<Partial<SupportChatbotState>> {
  const { currentIntent, userProfile, conversationContext } = state;

  switch (currentIntent.primary) {
    case 'plan_comparison':
      if (!userProfile.location) {
        const response = new AIMessage({
          content: "I'd be happy to help you compare electricity plans! First, could you tell me which city in Texas you're located in? This will help me find the most accurate plans and rates for your area.",
        });
        
        return {
          messages: [...state.messages, response],
          conversationContext: { ...conversationContext, stage: 'information_gathering' },
        };
      }

      // Fetch relevant plans
      const plansResult = await fetchRelevantPlans.func({
        location: userProfile.location,
        preferences: userProfile.preferences,
      });

      if (!plansResult.success) {
        const errorResponse = new AIMessage({
          content: `I'm having trouble finding plans for that location. ${plansResult.error} Could you try again with a different city name? Some popular Texas cities I can help with are Houston, Dallas, Austin, and San Antonio.`,
        });
        
        return {
          messages: [...state.messages, errorResponse],
        };
      }

      // Generate plan summary
      const summaryResult = await generatePlanSummary.func({
        plans: plansResult.plans,
        userPreferences: userProfile,
      });

      const planResponse = new AIMessage({
        content: summaryResult.summary,
      });

      return {
        messages: [...state.messages, planResponse],
        conversationContext: { ...conversationContext, stage: 'recommendation' },
        sessionData: {
          ...state.sessionData,
          plansViewed: [...state.sessionData.plansViewed, ...plansResult.plans.map(p => p.plan_id)],
          actionsCompleted: [...state.sessionData.actionsCompleted, 'plan_comparison'],
        },
      };

    case 'signup_help':
      const signupResponse = new AIMessage({
        content: `I can help guide you through the signup process! Here's what you'll typically need:

📋 **Required Information:**
- Your current address and ZIP code
- Social Security Number (for credit check)
- Government-issued ID
- Previous 12 months of electricity usage (optional but helpful)

📋 **Signup Steps:**
1. Choose your electricity plan
2. Fill out the enrollment form
3. Provide required documentation
4. Wait for confirmation (usually 1-2 business days)
5. Your new service starts on your next meter read date

⚡ **What happens to your current service:**
- Your new provider handles the switch
- No interruption to your electricity
- You'll receive final bill from old provider

Would you like me to help you find the right plan first, or do you have specific questions about the signup process?`,
      });

      return {
        messages: [...state.messages, signupResponse],
        conversationContext: { ...conversationContext, stage: 'recommendation' },
      };

    case 'bill_questions':
      const billResponse = new AIMessage({
        content: `I can help explain electricity bills and charges! Here are the most common questions:

💡 **Understanding Your Bill:**
- **Energy Charge**: Cost per kWh used (this is your main rate)
- **Base Charge**: Monthly connection fee (if applicable)
- **TDU Delivery Charges**: Transmission/distribution fees (regulated)
- **Taxes**: State and local taxes

📊 **Common Bill Issues:**
- Higher than expected usage (check for seasonal changes, new appliances)
- Rate changes (check if you're on a variable rate plan)
- Fees (monthly fees, connection fees, late fees)

🔍 **What specific aspect of your bill would you like me to explain?**
- Why your bill is higher/lower than expected
- Understanding specific charges
- How to calculate your effective rate
- Tips for reducing your bill

Feel free to describe what you're seeing on your bill!`,
      });

      return {
        messages: [...state.messages, billResponse],
        conversationContext: { ...conversationContext, stage: 'information_gathering' },
      };

    case 'complaint':
      // Check if escalation is needed
      const escalationCheck = await checkEscalationNeeds.func({
        conversationContext,
        userProfile,
        messages: state.messages,
      });

      if (escalationCheck.needsEscalation) {
        const escalationResponse = new AIMessage({
          content: `I understand you're having an issue, and I want to make sure you get the best help possible. Let me connect you with a human specialist who can better assist you with this matter.

While I prepare that connection, could you briefly describe:
1. What specific problem you're experiencing
2. How long this has been going on
3. What you've tried so far

A human agent will be with you shortly to provide more personalized assistance.`,
        });

        return {
          messages: [...state.messages, escalationResponse],
          needsHumanHandoff: true,
          conversationContext: { ...conversationContext, stage: 'escalation' },
        };
      }

      const complaintResponse = new AIMessage({
        content: `I'm sorry to hear you're experiencing an issue. I'm here to help resolve this for you. Could you tell me more about what's happening? The more details you can provide, the better I can assist you.

Some helpful information would be:
- What specific problem are you facing?
- When did this issue start?
- Have you contacted your electricity provider about this?
- What outcome are you looking for?

I'll do my best to guide you through resolving this issue.`,
      });

      return {
        messages: [...state.messages, complaintResponse],
        conversationContext: { ...conversationContext, stage: 'information_gathering' },
      };

    case 'technical_support':
      const techResponse = new AIMessage({
        content: `I can help with technical issues on our website! Here are some common solutions:

🔧 **Login Problems:**
- Clear your browser cache and cookies
- Try incognito/private browsing mode
- Reset your password if needed

🔧 **Website Issues:**
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Try a different browser
- Check your internet connection

🔧 **Form/Signup Problems:**
- Make sure all required fields are filled
- Check for any error messages
- Try different browsers or devices

What specific technical issue are you experiencing? I can provide more targeted help based on your situation.`,
      });

      return {
        messages: [...state.messages, techResponse],
        conversationContext: { ...conversationContext, stage: 'information_gathering' },
      };

    default:
      const generalResponse = new AIMessage({
        content: `Hello! I'm here to help you with electricity plans and services in Texas. I can assist you with:

🔍 **Plan Comparison** - Find the best electricity plan for your needs
⚡ **Signup Help** - Guide you through switching providers
💡 **Bill Questions** - Explain charges and help understand your bill
📞 **General Info** - Answer questions about Texas electricity market

What would you like help with today?`,
      });

      return {
        messages: [...state.messages, generalResponse],
        conversationContext: { ...conversationContext, stage: 'information_gathering' },
      };
  }
}

async function checkEscalation(state: SupportChatbotState): Promise<Partial<SupportChatbotState>> {
  const escalationCheck = await checkEscalationNeeds.func({
    conversationContext: state.conversationContext,
    userProfile: state.userProfile,
    messages: state.messages,
  });

  return {
    needsHumanHandoff: escalationCheck.needsEscalation,
    confidenceScore: state.currentIntent.confidence,
  };
}

// Create the support chatbot workflow
function createSupportChatbotWorkflow() {
  const workflow = new StateGraph<SupportChatbotState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      userProfile: {
        value: (x: UserProfile, y: UserProfile) => ({ ...x, ...y }),
        default: () => ({
          sessionId: Math.random().toString(36).substr(2, 9),
          preferences: { priorities: [] },
          previousQuestions: [],
        }),
      },
      conversationContext: {
        value: (x: ConversationContext, y: ConversationContext) => ({ ...x, ...y }),
        default: () => ({
          topic: 'general_info',
          stage: 'greeting',
          entities: {},
          sentiment: 'neutral',
        }),
      },
      currentIntent: {
        value: (x: Intent, y: Intent) => ({ ...x, ...y }),
        default: () => ({
          primary: 'general_info',
          confidence: 0,
          parameters: {},
          requiresAction: false,
          complexity: 'simple',
        }),
      },
      actionQueue: {
        value: (x: Action[], y: Action[]) => y || x,
        default: () => [],
      },
      sessionData: {
        value: (x: SessionData, y: SessionData) => ({ ...x, ...y }),
        default: () => ({
          startTime: new Date(),
          messageCount: 0,
          topicsDiscussed: [],
          plansViewed: [],
          actionsCompleted: [],
          isResolved: false,
          escalated: false,
          feedbackGiven: false,
        }),
      },
      needsHumanHandoff: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false,
      },
      confidenceScore: {
        value: (x: number, y: number) => y ?? x,
        default: () => 1,
      },
      lastActivity: {
        value: (x: Date, y: Date) => y || x,
        default: () => new Date(),
      },
    },
  });

  // Add nodes
  workflow.addNode("analyze_input", analyzeUserInput);
  workflow.addNode("process_request", processUserRequest);
  workflow.addNode("check_escalation", checkEscalation);

  // Define edges
  workflow.addEdge(START, "analyze_input");
  workflow.addEdge("analyze_input", "process_request");
  workflow.addEdge("process_request", "check_escalation");
  
  // Conditional edge based on escalation needs
  workflow.addConditionalEdges(
    "check_escalation",
    (state: SupportChatbotState) => {
      return state.needsHumanHandoff ? "escalate" : "complete";
    },
    {
      "escalate": END, // Would hand off to human in production
      "complete": END,
    }
  );

  return workflow.compile({ checkpointer: new MemorySaver() });
}

// Export the main support chatbot
export class SupportChatbotAgent {
  private workflow: ReturnType<typeof createSupportChatbotWorkflow>;

  constructor() {
    this.workflow = createSupportChatbotWorkflow();
  }

  async chat(message: string, sessionId?: string, userProfile?: Partial<UserProfile>): Promise<{
    response: string;
    needsEscalation: boolean;
    conversationStage: string;
    sessionId: string;
    suggestions?: string[];
  }> {
    const config = { 
      configurable: { 
        thread_id: sessionId || Math.random().toString(36).substr(2, 9) 
      } 
    };

    const initialState: Partial<SupportChatbotState> = {
      messages: [new HumanMessage(message)],
      userProfile: {
        sessionId: sessionId || Math.random().toString(36).substr(2, 9),
        preferences: { priorities: [] },
        previousQuestions: [],
        ...userProfile,
      },
      lastActivity: new Date(),
    };

    try {
      const result = await this.workflow.invoke(initialState, config);
      
      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage instanceof AIMessage ? 
        lastMessage.content.toString() : 
        "I apologize, but I encountered an issue processing your request. Could you please try again?";

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(result.conversationContext.topic, result.conversationContext.stage);

      return {
        response,
        needsEscalation: result.needsHumanHandoff,
        conversationStage: result.conversationContext.stage,
        sessionId: result.userProfile.sessionId,
        suggestions,
      };
    } catch (error) {
      console.error('Support chatbot error:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team if the issue persists.",
        needsEscalation: true,
        conversationStage: 'error',
        sessionId: sessionId || 'error',
      };
    }
  }

  async streamChat(message: string, sessionId?: string, userProfile?: Partial<UserProfile>) {
    const config = { 
      configurable: { 
        thread_id: sessionId || Math.random().toString(36).substr(2, 9) 
      } 
    };

    const initialState: Partial<SupportChatbotState> = {
      messages: [new HumanMessage(message)],
      userProfile: { sessionId: sessionId || Math.random().toString(36).substr(2, 9), preferences: { priorities: [] }, previousQuestions: [], ...userProfile },
      lastActivity: new Date(),
    };

    return this.workflow.stream(initialState, config);
  }

  private generateSuggestions(topic: string, stage: string): string[] {
    const suggestionMap: Record<string, Record<string, string[]>> = {
      plan_comparison: {
        information_gathering: [
          "I'm in Houston and use about 1000 kWh per month",
          "Show me green energy plans",
          "I want a fixed-rate plan",
        ],
        analysis: [
          "Can you explain the difference between these plans?",
          "Which plan would save me the most money?",
          "What are the contract terms?",
        ],
        recommendation: [
          "Help me sign up for this plan",
          "Can you show me more details about the top plan?",
          "Are there any hidden fees?",
        ],
      },
      signup_help: {
        information_gathering: [
          "What documents do I need to switch providers?",
          "How long does it take to switch?",
          "Will my electricity be turned off during the switch?",
        ],
        recommendation: [
          "Walk me through the signup process",
          "What happens after I submit my application?",
          "Can I cancel if I change my mind?",
        ],
      },
      bill_questions: {
        information_gathering: [
          "Why is my bill higher than last month?",
          "What are TDU charges?",
          "How can I lower my electricity bill?",
        ],
        analysis: [
          "Can you help me calculate my effective rate?",
          "Are there any unusual charges on my bill?",
          "Should I switch to a different plan?",
        ],
      },
      general_info: {
        greeting: [
          "Help me find the best electricity plan",
          "I need help switching providers",
          "I have questions about my electricity bill",
        ],
      },
    };

    return suggestionMap[topic]?.[stage] || [
      "How can I save money on electricity?",
      "What's the difference between fixed and variable rates?",
      "How do I switch electricity providers in Texas?",
    ];
  }

  // Method to get conversation history
  async getConversationHistory(sessionId: string): Promise<BaseMessage[]> {
    const config = { configurable: { thread_id: sessionId } };
    try {
      const state = await this.workflow.getState(config);
      return state.values.messages || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }
}

// Create singleton instance
export const supportChatbotAgent = new SupportChatbotAgent();