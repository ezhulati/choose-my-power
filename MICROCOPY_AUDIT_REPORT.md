# Microcopy Audit Report - Calculator & Rate Comparison Tools

## Executive Summary
Current calculator and rate comparison tools use technical, generic language that creates friction and confusion. This audit identifies critical microcopy issues and provides human-centered alternatives that guide users through the decision-making process.

## Critical Microcopy Issues Found

### 1. CALCULATOR PAGE (`RateCalculatorPage.tsx`)

#### Current Problems:

**Element**: Page Title
- **Current**: "Electricity Rate Calculator"
- **Issues**: Generic, doesn't convey value or outcome
- **Optimized Options**: 
  1. "See What You'll Actually Pay Each Month"
  2. "Find Your Real Electricity Costs"
  3. "Calculate Your True Monthly Bill"
- **Best Practice**: Focus on the outcome, not the tool

**Element**: Page Subtitle
- **Current**: "Calculate your exact monthly electricity costs with different providers and plans."
- **Issues**: Passive voice, technical focus
- **Optimized Options**:
  1. "Enter your usage to see real bills from every provider"
  2. "Compare what you'd actually pay with each plan"
  3. "Find out exactly what your bill would be"
- **Best Practice**: Use active voice, focus on user benefit

**Element**: Calculator Settings Label
- **Current**: "Calculator Settings"
- **Issues**: Technical, tool-focused
- **Optimized Options**:
  1. "Your Home & Usage"
  2. "Tell Us About Your Home"
  3. "Customize Your Calculation"
- **Best Practice**: Make it personal and contextual

**Element**: Home Type Label
- **Current**: "Home Type"
- **Issues**: Vague, doesn't guide selection
- **Optimized Options**:
  1. "What best describes your home?"
  2. "Pick your home size"
  3. "Select your living situation"
- **Best Practice**: Ask a question to engage

**Element**: Monthly Usage Label
- **Current**: "Monthly Usage (kWh)"
- **Issues**: Technical unit in label
- **Optimized Options**:
  1. "How much electricity did you use last month?"
  2. "Your monthly electricity use"
  3. "Enter kWh from your last bill"
- **Best Practice**: Reference the bill for context

**Element**: Input Placeholder
- **Current**: "1000"
- **Issues**: No context or guidance
- **Optimized Options**:
  1. "Like 1,200 kWh (check your bill)"
  2. "Type number from your bill"
  3. "Example: 1,000"
- **Best Practice**: Provide example and source

**Element**: Helper Text
- **Current**: "Find this number on your electricity bill"
- **Issues**: Generic instruction
- **Optimized Options**:
  1. "Look for 'kWh used' on page 1 of your bill"
  2. "This is usually in the top-right of your bill"
  3. "Can't find it? Use our home size guide above"
- **Best Practice**: Be specific about location

**Element**: Results Header
- **Current**: "Calculated Costs for {usage} kWh/month"
- **Issues**: Technical, passive
- **Optimized Options**:
  1. "Here's What You'd Pay Each Month"
  2. "Your Monthly Bills Would Be:"
  3. "Real Costs Based on Your {usage} kWh Usage"
- **Best Practice**: Make it personal and clear

**Element**: Quick Results Section
- **Current**: "Quick Results"
- **Issues**: Vague, doesn't convey value
- **Optimized Options**:
  1. "Your Savings Snapshot"
  2. "What We Found"
  3. "The Bottom Line"
- **Best Practice**: Focus on discovery and value

**Element**: Cheapest Label
- **Current**: "Cheapest:"
- **Issues**: Sounds low-quality
- **Optimized Options**:
  1. "Best Value:"
  2. "Lowest Bill:"
  3. "You'd Pay Least With:"
- **Best Practice**: Focus on value, not just price

**Element**: Footer Disclaimer
- **Current**: "*Costs include electricity usage + monthly fees. Excludes taxes and utility delivery charges."
- **Issues**: Dense, technical, buried
- **Optimized Options**:
  1. "* Your actual bill will include taxes and delivery charges (usually $25-40 more)"
  2. "* Plus taxes and utility fees. See full breakdown →"
  3. "* This is your electricity cost. Add ~$30 for delivery fees."
- **Best Practice**: Be transparent and specific

### 2. COMPARE RATES PAGE (`CompareRatesPage.tsx`)

#### Current Problems:

**Element**: Hero Title
- **Current**: "Compare Electricity Rates - Real-Time Rate Analysis"
- **Issues**: Redundant, technical
- **Optimized Options**:
  1. "Which Rate Is Really Cheaper?"
  2. "See All Rates Side by Side"
  3. "Find the Lowest Rate for Your Usage"
- **Best Practice**: Ask the question users have

**Element**: Sort Options
- **Current**: "Sort by Total Cost" / "Sort by Rate" / "Sort by Savings"
- **Issues**: Technical distinctions
- **Optimized Options**:
  1. "Cheapest Monthly Bill First"
  2. "Lowest Rate First"
  3. "Biggest Savings First"
- **Best Practice**: Describe the result, not the action

**Element**: Usage Profile Section
- **Current**: "Monthly Usage Profile"
- **Issues**: Technical term
- **Optimized Options**:
  1. "Pick your home size for accurate costs"
  2. "Which best matches your usage?"
  3. "Select to see your real bills"
- **Best Practice**: Connect selection to outcome

**Element**: No Results Message
- **Current**: (Not present - needs to be added)
- **Optimized Options**:
  1. "No plans match those filters. Try removing some to see more options."
  2. "Hmm, nothing matches. Loosen your filters to see plans."
  3. "No exact matches. Here are similar options:"
- **Best Practice**: Guide recovery, don't dead-end

**Element**: Rate Type Filter
- **Current**: "Rate Type"
- **Issues**: Technical, unclear distinction
- **Optimized Options**:
  1. "Fixed or Variable Rate?"
  2. "Rate Stability"
  3. "How should your rate work?"
- **Best Practice**: Explain the choice

**Element**: Contract Length
- **Current**: "Contract"
- **Issues**: Legal term, intimidating
- **Optimized Options**:
  1. "How long do you want to lock in?"
  2. "Commitment Period"
  3. "Plan Length"
- **Best Practice**: Focus on the commitment, not the contract

### 3. SIMPLE CALCULATOR PAGE (`CalculatorPage.tsx`)

#### Current Problems:

**Element**: Input Label
- **Current**: "Monthly Usage (kWh)"
- **Issues**: Technical parenthetical
- **Optimized Options**:
  1. "Your monthly electricity use"
  2. "kWh from your last bill"
  3. "How much electricity you use"
- **Best Practice**: Natural language first

**Element**: Preset Buttons
- **Current**: "Low Usage" / "Average Usage" / "High Usage"
- **Issues**: Relative terms without context
- **Optimized Options**:
  1. "Small Apartment (500 kWh)"
  2. "Average Home (1,000 kWh)"
  3. "Large House (2,000 kWh)"
- **Best Practice**: Concrete examples with numbers

**Element**: State/Market Label
- **Current**: "State/Market"
- **Issues**: Technical slash construction
- **Optimized Options**:
  1. "Where do you live?"
  2. "Your location"
  3. "Select your state"
- **Best Practice**: Simple, direct question

**Element**: Results Table Headers
- **Current**: "Rank" / "Provider & Plan" / "Rate" / "Energy Cost" / "Monthly Fee"
- **Issues**: Mix of technical and generic terms
- **Optimized Options**:
  1. "Best Deal" / "Company & Plan" / "Price per kWh" / "Usage Cost" / "Service Fee"
  2. "#" / "Provider" / "Rate" / "For Your Usage" / "Monthly Fee"
  3. "Ranking" / "Plan Details" / "Unit Price" / "Your Usage Cost" / "Fixed Fees"
- **Best Practice**: Clear, scannable headers

**Element**: Annual Cost Column
- **Current**: "Annual Cost"
- **Issues**: Doesn't emphasize total
- **Optimized Options**:
  1. "Yearly Total"
  2. "12-Month Cost"
  3. "Annual Bill"
- **Best Practice**: Make timeframe clear

## Hero's Journey Mapping

### Calculator User Journey:
1. **Hero**: Confused bill-payer trying to understand costs
2. **Problem**: "I don't know if I'm overpaying"
3. **Guide**: Our calculator showing truth
4. **Plan**: Enter usage → See all options → Compare real costs
5. **Success**: "Now I know exactly what I'd pay"
6. **Transformation**: From confused to confident decision-maker

### Key Psychological Triggers:
- **Loss Aversion**: "You could be saving $[X]/month"
- **Social Proof**: "[X] people with similar usage chose this plan"
- **Urgency**: "Rates valid today only"
- **Clarity**: "This is your total bill, nothing hidden"

## Implementation Priority

### HIGH PRIORITY (Immediate Impact):
1. Calculator input labels and placeholders
2. Results headers and cost displays
3. Error messages and empty states
4. Button text (Calculate → "Show Me What I'd Pay")

### MEDIUM PRIORITY (User Flow):
1. Section headers and navigation
2. Filter labels and options
3. Helper text and tooltips
4. Confirmation messages

### LOW PRIORITY (Polish):
1. Footer disclaimers
2. Technical explanations
3. Advanced settings labels

## Success Metrics

### Direct Metrics:
- **Form Completion Rate**: Target +15% improvement
- **Calculator Usage**: Target +25% engagement
- **Time to First Result**: Target -20% reduction
- **Support Tickets**: Target -30% for "how to use calculator"

### Indirect Metrics:
- **Conversion Rate**: From calculator to plan selection
- **User Confidence**: Survey scores on understanding costs
- **Return Usage**: Users coming back to recalculate

## Voice & Tone Guidelines

### DO:
- Use conversational language: "Here's what you'd pay"
- Be specific: "Enter the kWh number from your bill"
- Guide actions: "Pick your home size to see accurate costs"
- Acknowledge concerns: "Yes, this includes all fees"
- Celebrate findings: "You found the best deal!"

### DON'T:
- Use jargon: "Calculate amortized kilowatt-hour rates"
- Be vague: "Enter usage amount"
- Use passive voice: "Costs are calculated based on..."
- Hide important info: Bury fees in fine print
- Sound robotic: "Input required fields to proceed"

## Implementation Checklist

- [ ] Update all form labels to question format
- [ ] Replace technical placeholders with examples
- [ ] Rewrite results headers to focus on user benefit
- [ ] Add contextual help text at decision points
- [ ] Create friendly error messages with recovery paths
- [ ] Update button text to action-outcome format
- [ ] Add progress indicators showing calculation steps
- [ ] Include confidence-building messages in results
- [ ] Implement empty state messages
- [ ] Add success confirmations after actions

## Next Steps

1. **Immediate**: Implement high-priority text changes
2. **This Week**: A/B test new calculator labels vs. old
3. **Next Sprint**: Roll out to all calculator variations
4. **Ongoing**: Monitor support tickets for confusion points
5. **Quarterly**: Review and refine based on user feedback

## Expected Outcomes

With these microcopy improvements, we expect:
- **50% reduction** in calculator abandonment
- **30% increase** in completed calculations
- **25% decrease** in support questions
- **20% improvement** in user satisfaction scores
- **15% increase** in conversion to plan selection

The new microcopy transforms technical tools into helpful guides that speak the user's language and address their real concerns about electricity costs.