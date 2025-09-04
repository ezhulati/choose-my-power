# AI Agents Setup Guide

## ✅ Status: READY TO USE

Your Anthropic API key has been securely configured and tested successfully!

## 🔐 Security Configuration

### ✅ API Key Secure Storage
- **Local Development**: Stored in `.env.local` (gitignored)
- **Environment Variable**: `ANTHROPIC_API_KEY` is set
- **Connection**: ✅ Tested and working with Claude 3.5 Sonnet
- **Security**: ❌ **Key is NOT stored in any committed files**

### 🏠 For Local Development

Your API key is already configured in `.env.local`:
```bash
# Already done for you:
ANTHROPIC_API_KEY=sk-ant-api03-PsSg76L3...
NODE_ENV=development
```

### 🚀 For Production Deployment (Netlify)

Add the environment variable in your Netlify dashboard:

1. Go to **Netlify Dashboard** → Your Site → **Site settings**
2. Navigate to **Environment variables**
3. Click **Add variable**
4. Set:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-YOUR-ACTUAL-API-KEY-HERE`
   - **Scopes**: All scopes

## 🧪 Testing Your Setup

### Quick Connection Test
```bash
npm run agents:connect
```

### Full Integration Test
```bash
npm run agents:test
```

### Test Individual Agents
```bash
# Test plan recommendations
npm run agents:recommend

# Test support chatbot
npm run agents:chat

# Test data pipeline (will process sample cities)
npm run agents:pipeline
```

## 🎯 Using the AI Agents

### 1. Plan Recommendation Widget

Add to any page for AI-powered plan recommendations:

```tsx
import PlanRecommendationWidget from '@/components/agents/PlanRecommendationWidget';

function PlanComparison() {
  return (
    <PlanRecommendationWidget
      initialLocation="houston-tx"
      onPlanSelect={(plan) => {
        console.log('User selected:', plan.plan_name);
        // Handle plan selection - redirect to signup, etc.
      }}
    />
  );
}
```

**Features:**
- AI analyzes user preferences and usage patterns
- Provides detailed reasoning for each recommendation
- Shows pros/cons and potential savings
- Confidence scoring for recommendations
- Real-time streaming analysis option

### 2. Support Chat Widget

Add anywhere for intelligent customer support:

```tsx
import SupportChatWidget from '@/components/agents/SupportChatWidget';

function Layout() {
  return (
    <div>
      {/* Your content */}
      
      <SupportChatWidget
        position="bottom-right"
        userProfile={{
          location: 'dallas-tx',
          monthlyUsage: 1000,
          currentProvider: 'TXU Energy'
        }}
        onEscalation={(sessionId, messages) => {
          // Handle escalation to human support
          console.log('Escalating session:', sessionId);
          // Send to your support ticket system
        }}
      />
    </div>
  );
}
```

**Features:**
- Handles 6 support categories (plans, billing, signup, complaints, etc.)
- Context-aware conversations with memory
- Smart escalation detection
- Mobile-optimized interface
- Suggested follow-up questions

### 3. Data Pipeline Dashboard (Admin Only)

Monitor and control your data generation:

```tsx
import DataPipelineDashboard from '@/components/agents/DataPipelineDashboard';

function AdminDataPage() {
  return (
    <DataPipelineDashboard
      autoRefresh={true}
      refreshInterval={30000}
    />
  );
}
```

**Features:**
- Real-time monitoring of 881 city data generation
- Intelligent batching and retry logic
- Progress tracking and ETA calculations
- Error analysis and recovery
- Performance metrics and throughput monitoring

## 📊 Monitoring & Performance

### View Agent Metrics
```bash
npm run agents:metrics
```

### Check Agent Health
```bash
npm run agents:health
```

### Monitor Performance
The agents automatically collect:
- Response times
- Success/failure rates
- Cache hit rates
- User satisfaction scores
- Error patterns

## 🔧 Configuration Options

### Customize Agent Behavior

Edit `src/lib/agents/agent-config.ts`:

```typescript
export const AGENT_CONFIG = {
  planRecommendation: {
    maxPlansToAnalyze: 5,        // Analyze top 5 plans
    confidenceThreshold: 0.4,    // Min confidence for recommendations
    timeoutMs: 30000,           // 30 second timeout
  },
  
  dataPipeline: {
    defaultBatchSize: 10,        // Process 10 cities at once
    maxRetries: 3,              // Retry failed cities 3 times
    defaultDelayMs: 2000,       // 2 second delay between batches
  },
  
  supportChatbot: {
    sessionTimeoutMs: 1800000,   // 30 minute sessions
    maxMessagesPerSession: 50,   // Limit conversation length
  }
};
```

## 🚨 Troubleshooting

### Common Issues

1. **"API key not found" error**
   ```bash
   # Check if key is set
   echo $ANTHROPIC_API_KEY
   
   # If empty, set it:
   export ANTHROPIC_API_KEY=your_key_here
   ```

2. **"Network timeout" errors**
   ```bash
   # Increase timeout in agent-config.ts
   timeoutMs: 60000  // 60 seconds
   ```

3. **"Rate limit exceeded"**
   ```bash
   # Reduce batch size in data pipeline
   defaultBatchSize: 5
   defaultDelayMs: 5000  // 5 seconds
   ```

### Debug Mode

Enable detailed logging:

```typescript
// In development
AGENT_CONFIG.monitoring.enableDetailedLogging = true;
```

## 🎉 You're All Set!

Your AI agents are configured and ready to enhance your ChooseMyPower platform:

- ✅ **API Key**: Securely configured
- ✅ **Connection**: Tested with Claude 3.5 Sonnet
- ✅ **Components**: Ready to import and use
- ✅ **Integration**: Works with existing systems
- ✅ **Testing**: Full test suite available
- ✅ **Monitoring**: Performance metrics enabled

Start by adding the components to your pages and watch your user experience transform with AI-powered assistance! 🚀