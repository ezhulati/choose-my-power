# Dynamic Hero Messaging System

## Overview
Sophisticated temporal messaging system that delivers context-aware homepage messaging based on time of day, day of week, and user behavior patterns. Celebrates Texas electricity choice while acknowledging that comparing options is tedious work.

## Core Philosophy
**"Texas gives you the power to choose - unlike monopoly states. The choice is great, the comparison work isn't."**

The messaging acknowledges:
- Having choice is a Texas advantage (vs monopoly states)
- The comparison work is the tedious part
- Choosing wrong costs double (holdover rates)
- We'll make the research quick and painless

## System Components

### 1. DynamicHeroMessaging Component
**Location:** `/src/components/DynamicHeroMessaging.tsx`

React component that:
- Renders dynamic headlines and subheadlines
- Updates every minute for freshness
- Includes A/B testing capability (30% get variant B)
- Shows urgency flags and CTA text when appropriate

### 2. Temporal Messaging Engine
**Location:** `/src/lib/messaging/temporal-messaging-engine.ts`

Core engine that generates contextual messages based on:
- **Time of Day:** early-morning, morning, lunch, afternoon, evening, late-night
- **Day of Week:** Special handling for weekends, Fridays, Mondays
- **Seasonal Context:** Summer AC season, winter heating, shoulder seasons
- **A/B Testing:** Automatic variant generation with urgency modifiers

### 3. CSS Animations
**Location:** `/src/styles/dynamic-messaging.css`

Smooth transitions and animations:
- Fade-in animation for initial load
- Smooth text transitions on updates
- Urgency message pulse effect
- Prevention of layout shift

## Time-Based Messaging Examples

### Weekend Warriors (Saturday/Sunday)
- **Saturday Morning:** "Another Saturday morning wasted on electricity rates?"
- **Saturday Afternoon:** "Gorgeous Saturday afternoon for... rate shopping?"
- **Sunday Morning:** "Sunday morning electricity mass. Pray for lower rates."
- **Sunday Evening:** "Sunday evening electricity anxiety. Classic."

### Friday Fatigue
- **Friday Afternoon:** "Wrapping up Friday with... electricity shopping?"
- **Friday Night:** "Friday night electricity shopping. You absolute legend."

### Monday Blues
- **Monday Morning:** "Monday, 6am. Already dealing with electricity rates."
- **Monday Evening:** "Monday night, still at the electricity thing."

### Weekday Grind (Tuesday-Thursday)
- **Lunch Hour:** "Lunch break electricity shopping. Delicious."
- **Late Night:** "2am electricity shopping. This is your life now."
- **Early Morning:** "Up early dealing with electricity rates? Before coffee, even."

## Messaging Structure

Each message bundle contains:
```typescript
{
  headline: string;        // Main attention-grabbing headline
  subheadline: string;     // Supporting context and empathy
  urgencyFlag?: string;    // Time-sensitive information
  ctaText?: string;        // Action-oriented button text
  socialProof?: string;    // Trust signals (future feature)
}
```

## A/B Testing Framework

The system includes built-in A/B testing:
- 30% of visitors see "variant B" with enhanced urgency
- Automatic urgency modifiers can be added
- Performance tracking ready for analytics integration

## Implementation Details

### Update Frequency
- Messages update every 60 seconds
- Smooth transitions prevent jarring changes
- Initial load shows contextual message immediately

### Fallback Messaging
Default message if time detection fails:
- "Texas Makes You Choose Your Electricity."
- "No default utility. Pick wrong, pay double."

### Performance Optimizations
- Lightweight time calculations
- Minimal re-renders
- CSS-based animations (no JavaScript animation loops)
- Prevents layout shift with min-height

## Future Enhancements

### Planned Features
1. **Contract Expiry Integration**
   - Show days until contract expires
   - Escalating urgency as deadline approaches

2. **Geographic Awareness**
   - City-specific messaging
   - Local weather integration (AC usage in summer)

3. **Behavioral Triggers**
   - Return visitor detection
   - Scroll depth awareness
   - Time on site tracking

4. **Advanced Personalization**
   - Previous search history
   - Plan preference learning
   - Smart recommendations

### Analytics Integration
Track performance metrics:
- Engagement rate by message variant
- Conversion rate by time of day
- A/B test winner determination
- Optimal messaging times

## Usage

The system automatically activates on the homepage. No configuration needed.

### Testing Different Times
To test different time scenarios in development:
```javascript
// In browser console
const testDate = new Date('2024-08-30 21:00:00'); // Friday 9pm
// System will show Friday night messaging
```

### Customization
To adjust messaging patterns, edit:
- `/src/lib/messaging/temporal-messaging-engine.ts` for message content
- `/src/components/DynamicHeroMessaging.tsx` for display logic
- `/src/styles/dynamic-messaging.css` for animations

## Best Practices

### Writing New Messages
1. **Acknowledge the pain** - Start with empathy
2. **Be specific** - Use actual times, days, numbers
3. **Add personality** - Conversational, not corporate
4. **Include urgency** - But make it credible
5. **Provide relief** - Promise quick resolution

### Message Length Guidelines
- **Headline:** 5-12 words, punchy and relatable
- **Subheadline:** 15-30 words, conversational explanation
- **Urgency Flag:** 5-10 words, specific and actionable
- **CTA Text:** 2-5 words, action-oriented

## Monitoring & Optimization

### Key Metrics to Track
- Time-to-first-interaction by message variant
- ZIP code submission rate
- Bounce rate by time of day
- Message engagement heatmap

### Optimization Cycle
1. Deploy new message variants
2. Run for 1 week minimum
3. Analyze performance data
4. Iterate on winning patterns
5. Document learnings

## Technical Notes

### Browser Compatibility
- ES6+ JavaScript required
- CSS animations use modern properties
- Fallback for older browsers included

### SEO Considerations
- Messages don't affect SEO (client-side only)
- Core content remains static for crawlers
- No layout shift maintains Core Web Vitals

### Accessibility
- Text remains readable during transitions
- No auto-playing animations that could trigger seizures
- Respects prefers-reduced-motion settings

## Support

For issues or improvements:
1. Check browser console for errors
2. Verify time detection is working
3. Test A/B variant distribution
4. Monitor performance metrics

---

*This system transforms a mundane homepage into a dynamic, empathetic experience that acknowledges the user's context and frustration while guiding them to quick resolution.*