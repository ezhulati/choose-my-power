/**
 * LangGraph Agent Configuration
 * Central configuration for all LangGraph agents in the ChooseMyPower platform
 */

export const AGENT_CONFIG = {
  // Anthropic Claude configuration
  anthropic: {
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY || '', // Set in environment variables
    maxTokens: 4000,
    temperature: 0.1, // Low temperature for consistent, reliable responses
  },

  // Plan recommendation agent settings
  planRecommendation: {
    maxPlansToAnalyze: 5,
    confidenceThreshold: 0.4, // Minimum confidence for recommendations
    cacheTTL: 1800, // 30 minutes cache for recommendations
    timeoutMs: 30000, // 30 second timeout for recommendations
  },

  // Data pipeline agent settings
  dataPipeline: {
    defaultBatchSize: 10,
    maxRetries: 3,
    defaultDelayMs: 2000,
    healthCheckInterval: 30000,
    maxConcurrentBatches: 3,
    timeoutMs: 300000, // 5 minute timeout for pipeline operations
  },

  // Support chatbot agent settings
  supportChatbot: {
    sessionTimeoutMs: 1800000, // 30 minutes session timeout
    maxMessagesPerSession: 50,
    escalationTriggers: {
      frustrationKeywords: ['frustrated', 'angry', 'terrible', 'awful', 'hate'],
      escalationKeywords: ['human', 'agent', 'supervisor', 'manager'],
      maxConsecutiveFailures: 3,
      longConversationThreshold: 20,
    },
    cacheTTL: 900, // 15 minutes cache for chat responses
  },

  // Integration settings
  integration: {
    // Your existing ComparePower API client
    useExistingApiClient: true,
    // Your existing Redis cache
    useExistingCache: true,
    // Your existing database
    useExistingDatabase: true,
    // Enable/disable specific agents
    enabledAgents: {
      planRecommendation: true,
      dataPipeline: true,
      supportChatbot: true,
    },
  },

  // Error handling and monitoring
  monitoring: {
    enableDetailedLogging: process.env.NODE_ENV === 'development',
    enableMetrics: true,
    errorReporting: {
      enabled: process.env.NODE_ENV === 'production',
      // Add your error reporting service here (e.g., Sentry)
    },
  },
};

// Environment validation
export function validateAgentEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!AGENT_CONFIG.anthropic.apiKey && process.env.NODE_ENV === 'production') {
    errors.push('ANTHROPIC_API_KEY environment variable is required for production');
  }

  // Add more environment validations as needed
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper to get agent-specific config
export function getAgentConfig(agentType: 'planRecommendation' | 'dataPipeline' | 'supportChatbot') {
  const baseConfig = {
    anthropic: AGENT_CONFIG.anthropic,
    monitoring: AGENT_CONFIG.monitoring,
    integration: AGENT_CONFIG.integration,
  };

  switch (agentType) {
    case 'planRecommendation':
      return { ...baseConfig, ...AGENT_CONFIG.planRecommendation };
    case 'dataPipeline':
      return { ...baseConfig, ...AGENT_CONFIG.dataPipeline };
    case 'supportChatbot':
      return { ...baseConfig, ...AGENT_CONFIG.supportChatbot };
    default:
      return baseConfig;
  }
}