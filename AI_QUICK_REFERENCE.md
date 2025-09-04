# 🤖 AI Agents Quick Reference

## ✅ Status: CONFIGURED & READY

Your Anthropic API key is set up and agents are ready to use!

## 🚀 Quick Commands

```bash
# Test connection
npm run agents:connect

# Run all tests
npm run agents:test

# Test individual features
npm run agents:recommend    # Plan recommendations
npm run agents:chat        # Support chatbot
npm run agents:pipeline    # Data pipeline
```

## 📦 Import Components

```tsx
// Plan recommendations
import PlanRecommendationWidget from '@/components/agents/PlanRecommendationWidget';
<PlanRecommendationWidget initialLocation="houston-tx" />

// Support chat
import SupportChatWidget from '@/components/agents/SupportChatWidget';
<SupportChatWidget position="bottom-right" />

// Data pipeline (admin)
import DataPipelineDashboard from '@/components/agents/DataPipelineDashboard';
<DataPipelineDashboard />
```

## 🔧 Key Files

- **Agents**: `src/lib/agents/`
- **Components**: `src/components/agents/`
- **Config**: `src/lib/agents/agent-config.ts`
- **Docs**: `docs/LANGGRAPH_INTEGRATION.md`

## 🎯 What Each Agent Does

- **Plan Recommendation**: AI analyzes electricity plans with reasoning
- **Support Chatbot**: Handles customer questions with escalation
- **Data Pipeline**: Smart orchestration of 881 city data builds

Your AI agents are ready to transform ChooseMyPower! 🚀