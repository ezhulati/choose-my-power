/**
 * Plan Recommendation Widget - React component powered by LangGraph agent
 */

import React, { useState, useEffect, useRef } from 'react';
import { planRecommendationAgent } from '../../lib/agents/plan-recommendation-agent';
import type { Plan } from '../../types/facets';

interface PlanRecommendation {
  plan: Plan;
  score: number;
  reasoning: string;
  savings: number;
  pros: string[];
  cons: string[];
  confidence: number;
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

interface PlanRecommendationWidgetProps {
  initialLocation?: string;
  onPlanSelect?: (plan: Plan) => void;
  className?: string;
}

export const PlanRecommendationWidget: React.FC<PlanRecommendationWidgetProps> = ({
  initialLocation = '',
  onPlanSelect,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    location: initialLocation,
    monthlyUsage: 1000,
    priorities: [],
  });
  const [userMessage, setUserMessage] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [analysisSteps, setAnalysisSteps] = useState<unknown[]>([]);
  const [isStreamMode, setIsStreamMode] = useState(false);
  const streamingRef = useRef<AbortController | null>(null);

  const handleGetRecommendations = async () => {
    if (!preferences.location.trim()) {
      alert('Please enter a city location to get recommendations.');
      return;
    }

    setIsLoading(true);
    setAgentResponse('');
    setRecommendations([]);
    setAnalysisSteps([]);

    try {
      const message = userMessage.trim() || 
        `I need help finding the best electricity plan for my needs in ${preferences.location}. ${
          preferences.greenEnergy ? 'I prefer green energy plans. ' : ''
        }${preferences.planType ? `I want a ${preferences.planType} rate plan. ` : ''
        }${preferences.contractLength ? `I prefer a ${preferences.contractLength}-month contract. ` : ''
        }My monthly usage is around ${preferences.monthlyUsage} kWh.`;

      const result = await planRecommendationAgent.recommend(
        message,
        preferences.location,
        preferences
      );

      setAgentResponse(result.response);
      setRecommendations(result.recommendations);
      setConfidence(result.confidence);
      setAnalysisSteps(result.analysisSteps);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setAgentResponse('Sorry, I encountered an error while analyzing plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamRecommendations = async () => {
    if (!preferences.location.trim()) {
      alert('Please enter a city location to get recommendations.');
      return;
    }

    setIsLoading(true);
    setIsStreamMode(true);
    setAgentResponse('Starting analysis...');
    setRecommendations([]);
    setAnalysisSteps([]);

    // Cancel any existing stream
    if (streamingRef.current) {
      streamingRef.current.abort();
    }

    streamingRef.current = new AbortController();

    try {
      const message = userMessage.trim() || 
        `I need help finding the best electricity plan for my needs in ${preferences.location}.`;

      const stream = await planRecommendationAgent.streamRecommendation(
        message,
        preferences.location,
        preferences
      );

      let stepCount = 0;
      const stepNames = ['Collecting preferences', 'Fetching plans', 'Analyzing options', 'Generating recommendations'];

      for await (const update of stream) {
        if (streamingRef.current?.signal.aborted) break;

        // Update UI based on the current step
        if (update.currentStep) {
          setAgentResponse(`${stepNames[stepCount] || 'Processing'}...`);
          stepCount++;
        }

        // Update analysis steps if available
        if (update.analysisSteps?.length > 0) {
          setAnalysisSteps(update.analysisSteps);
        }

        // Update recommendations if available
        if (update.recommendations?.length > 0) {
          setRecommendations(update.recommendations);
          setConfidence(update.confidence || 0);
        }

        // Final response
        if (update.messages?.length > 0) {
          const lastMessage = update.messages[update.messages.length - 1];
          if (lastMessage.content) {
            setAgentResponse(lastMessage.content);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error streaming recommendations:', error);
        setAgentResponse('Sorry, I encountered an error while analyzing plans. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsStreamMode(false);
      streamingRef.current = null;
    }
  };

  const handleStopStream = () => {
    if (streamingRef.current) {
      streamingRef.current.abort();
    }
    setIsLoading(false);
    setIsStreamMode(false);
  };

  const PrioritySelector = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-texas-navy">
        What's most important to you? (Select all that apply)
      </label>
      <div className="flex flex-wrap gap-2">
        {(['price', 'green', 'stability', 'flexibility'] as const).map((priority) => (
          <button
            key={priority}
            type="button"
            onClick={() => {
              setPreferences(prev => ({
                ...prev,
                priorities: prev.priorities.includes(priority)
                  ? prev.priorities.filter(p => p !== priority)
                  : [...prev.priorities, priority]
              }));
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
              preferences.priorities.includes(priority)
                ? 'bg-texas-red text-white border-texas-red'
                : 'bg-white text-texas-navy border-gray-300 hover:border-texas-red'
            }`}
          >
            {priority === 'price' && '💰 Low Price'}
            {priority === 'green' && '🌱 Green Energy'}
            {priority === 'stability' && '📊 Rate Stability'}
            {priority === 'flexibility' && '🔄 Flexibility'}
          </button>
        ))}
      </div>
    </div>
  );

  const RecommendationCard = ({ recommendation }: { recommendation: PlanRecommendation }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-texas-navy text-lg">{recommendation.plan.plan_name}</h3>
          <p className="text-gray-600">{recommendation.plan.company}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-texas-red">{recommendation.plan.rate_display}</div>
          <div className="text-sm text-gray-500">
            Score: {Math.round(recommendation.score * 100)}%
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-700 mb-2">{recommendation.reasoning}</div>
        {recommendation.savings > 0 && (
          <div className="bg-texas-gold-50 border border-texas-gold-200 rounded-lg p-3">
            <div className="text-texas-gold-800 font-medium">
              💰 Estimated savings: ${Math.round(recommendation.savings)}/month
            </div>
          </div>
        )}
      </div>

      {recommendation.pros.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-green-800 text-sm mb-1">Pros:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            {recommendation.pros.map((pro, i) => (
              <li key={i} className="flex items-start">
                <span className="text-green-500 mr-1">✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendation.cons.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-orange-800 text-sm mb-1">Considerations:</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            {recommendation.cons.map((con, i) => (
              <li key={i} className="flex items-start">
                <span className="text-orange-500 mr-1">⚠</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onPlanSelect?.(recommendation.plan)}
          className="btn-primary flex-1 py-2 px-4 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 transition-colors"
        >
          Select This Plan
        </button>
        <button
          className="btn-outline flex-1 py-2 px-4 border-2 border-texas-navy text-texas-navy rounded-lg hover:bg-texas-navy hover:text-white transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className={`plan-recommendation-widget ${className}`}>
      <div className="bg-gradient-to-r from-texas-cream to-gray-50 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-texas-navy mb-2">
          🤖 AI Plan Recommendation
        </h2>
        <p className="text-gray-700 mb-4">
          Let our AI agent analyze thousands of electricity plans to find the perfect match for your needs.
        </p>

        {/* Preferences Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-texas-navy mb-2">
              City/Location
            </label>
            <input
              type="text"
              value={preferences.location}
              onChange={(e) => setPreferences(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Houston, Dallas, Austin"
              className="input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texas-navy mb-2">
              Monthly Usage (kWh)
            </label>
            <input
              type="number"
              value={preferences.monthlyUsage}
              onChange={(e) => setPreferences(prev => ({ ...prev, monthlyUsage: parseInt(e.target.value) || 1000 }))}
              placeholder="1000"
              className="input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texas-navy mb-2">
              Plan Type Preference
            </label>
            <select
              value={preferences.planType || ''}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                planType: e.target.value as 'fixed' | 'variable' | 'indexed' | undefined 
              }))}
              className="select-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
            >
              <option value="">Any</option>
              <option value="fixed">Fixed Rate</option>
              <option value="variable">Variable Rate</option>
              <option value="indexed">Indexed Rate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-texas-navy mb-2">
              Contract Length (months)
            </label>
            <select
              value={preferences.contractLength || ''}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                contractLength: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="select-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
            >
              <option value="">Any Length</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.greenEnergy || false}
              onChange={(e) => setPreferences(prev => ({ ...prev, greenEnergy: e.target.checked }))}
              className="w-4 h-4 text-texas-red border-gray-300 rounded focus:ring-texas-red"
            />
            <span className="text-sm font-medium text-texas-navy">🌱 Prefer renewable/green energy plans</span>
          </label>
        </div>

        <PrioritySelector />

        {/* Custom Message */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-texas-navy mb-2">
            Additional requirements or questions (optional)
          </label>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="e.g., I'm moving to a new house, I want to avoid early termination fees, I care about customer service ratings..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleGetRecommendations}
            disabled={isLoading || !preferences.location}
            className="btn-primary px-6 py-3 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && !isStreamMode ? 'Analyzing...' : '🔍 Get AI Recommendations'}
          </button>
          
          <button
            onClick={isStreamMode ? handleStopStream : handleStreamRecommendations}
            disabled={!preferences.location}
            className={`px-6 py-3 rounded-lg transition-colors ${
              isStreamMode 
                ? 'bg-red-600 text-white hover:bg-texas-red-700' 
                : 'btn-outline border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white'
            }`}
          >
            {isStreamMode ? '⏹️ Stop' : '🔄 Stream Analysis'}
          </button>
        </div>
      </div>

      {/* Analysis Progress */}
      {analysisSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-texas-navy mb-3">Analysis Progress</h3>
          <div className="space-y-2">
            {analysisSteps.map((step, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-medium mr-2">{step.step}:</span>
                <span className="text-gray-600">{step.description}</span>
              </div>
            ))}
          </div>
          {confidence > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Confidence Score:</span>
                <span className={`font-medium ${
                  confidence > 0.7 ? 'text-green-600' : 
                  confidence > 0.4 ? 'text-yellow-600' : 'text-texas-red'
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent Response */}
      {agentResponse && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <div className="bg-texas-red-100 p-2 rounded-full">
              <span className="text-texas-red text-lg">🤖</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-texas-navy mb-2">AI Analysis</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {agentResponse}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-texas-navy mb-4">
            Recommended Plans ({recommendations.length})
          </h3>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard key={index} recommendation={recommendation} />
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-texas-red">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-texas-red"></div>
            <span className="font-medium">
              {isStreamMode ? 'Streaming analysis...' : 'Analyzing electricity plans...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanRecommendationWidget;