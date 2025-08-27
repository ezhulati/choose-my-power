# Customer Requirements Document (CRD)
## ChooseMyPower.org - The Texas Electricity Authority

### Document Version: 1.0
### Date: August 2025
### Product Owner: Senior PM, ChooseMyPower.org
### Document Status: Draft

---

## 1. Executive Summary

### 1.1 Purpose
ChooseMyPower.org serves as an educational authority and trusted alternative to the state-run Power to Choose website, empowering Texas residents to make informed electricity decisions through transparent comparisons, educational content, and simplified enrollment processes.

### 1.2 Vision Statement
"To be the most trusted, transparent, and user-friendly electricity comparison platform in Texas, where consumers feel empowered to make informed choices about their energy future."

### 1.3 Core Value Proposition
- **10-minute decision** vs. 3-hour research process
- **Government-level trust** with superior user experience
- **Educational-first approach** that builds confidence
- **Unbiased comparisons** with transparent affiliate model

---

## 2. Market Context & Opportunity

### 2.1 Texas Deregulated Market
- **8M+ deregulated meters** across Texas
- **4M annual transactions** (3M move-ins + 1M switchers)
- **$25-30 average commission** per successful enrollment
- **85% of users** frustrated with Power to Choose experience

### 2.2 Competitive Landscape
| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| Power to Choose | Official government site | Poor UX, confusing pricing | Better UX, clearer comparisons |
| ComparePower.com | Good UX, established brand | Perceived as commercial | Educational authority positioning |
| Direct Providers | Brand recognition | Biased recommendations | Unbiased multi-provider comparison |
| Energy Ogre | Full-service management | Subscription cost | Free service |

### 2.3 User Pain Points
1. **Trust Issues**: "Is this site legitimate?"
2. **Complexity**: "I don't understand these plans"
3. **Time Pressure**: "I need power by tomorrow"
4. **Price Confusion**: "Why is my bill different?"
5. **Choice Overload**: "There are too many options"

---

## 3. Target Users & Personas

### 3.1 Primary Personas

#### Persona 1: The Moving Texan (40% of users)
- **Demographics**: Age 25-45, household income $40-80K
- **Scenario**: Moving to new apartment/home
- **Goals**: Get power connected by move-in date
- **Pain Points**: Time pressure, don't have account number yet, overwhelmed by choices
- **Success Metric**: Account activated before move-in

#### Persona 2: The Bill Questioner (30% of users)
- **Demographics**: Age 35-65, household income $50-100K
- **Scenario**: Received high electricity bill
- **Goals**: Verify they're not being overcharged
- **Pain Points**: Don't understand bill, feel scammed, want validation
- **Success Metric**: Confidence in current plan or switch to better rate

#### Persona 3: The Contract Expirer (20% of users)
- **Demographics**: Age 30-60, household income $60-120K
- **Scenario**: Received renewal notice
- **Goals**: Decide whether to renew or switch
- **Pain Points**: Analysis paralysis, fear of making wrong choice
- **Success Metric**: Make confident renewal/switch decision

#### Persona 4: The Emergency Connector (10% of users)
- **Demographics**: Age 20-50, variable income
- **Scenario**: Power disconnected or about to be
- **Goals**: Get power restored immediately
- **Pain Points**: Credit issues, deposit requirements, urgency
- **Success Metric**: Same-day power restoration

### 3.2 User Journey Stages
1. **Awareness**: "I need to do something about electricity"
2. **Research**: "What are my options?"
3. **Comparison**: "Which plan is best for me?"
4. **Decision**: "I'm ready to choose"
5. **Enrollment**: "Sign me up"
6. **Confirmation**: "Did I make the right choice?"

---

## 4. Product Requirements

### 4.1 Core Features

#### 4.1.1 Intelligent Plan Comparison
**User Need**: "Show me apples-to-apples comparisons"
- Display all-inclusive pricing (energy + TDU + taxes)
- Calculate based on actual usage patterns
- Highlight hidden fees and gotchas
- Show 500/1000/2000 kWh pricing tiers
- Display contract terms clearly
- Flag satisfaction guarantee options

#### 4.1.2 Educational Content Hub
**User Need**: "Help me understand electricity"
- "Electricity 101" guide for beginners
- Bill decoder tool with visual explanations
- Glossary of terms (kWh, TDU, EFL, etc.)
- Video tutorials for common tasks
- FAQ section organized by persona
- Blog with seasonal tips and market updates

#### 4.1.3 Personalized Recommendations
**User Need**: "Tell me what's best for my situation"
- Smart quiz to identify user type
- Usage estimator based on home size
- Recommendation engine with clear reasoning
- "Why this plan?" explanations
- Alternative suggestions with trade-offs
- Persona-based filtering

#### 4.1.4 Trust & Transparency Center
**User Need**: "How do I know this is legitimate?"
- "How We Make Money" page
- Provider verification badges
- Real customer reviews (ShopperApproved integration)
- BBB accreditation display
- Security certifications
- Privacy policy in plain English

#### 4.1.5 Quick Decision Tools
**User Need**: "I don't have time for this"
- "Best Plan for Most People" highlight
- Quick match quiz (3 questions max)
- One-click sorting by total cost
- Mobile-optimized speed enrollment
- Pre-filled forms where possible
- Progress indicators

### 4.2 Specialized Tools

#### 4.2.1 Bill Analyzer
**Purpose**: Help users understand if they're overpaying
- Upload bill functionality
- AI-powered data extraction
- Current rate breakdown
- Savings calculator
- "Switch or Stay" recommendation
- Educational callouts

#### 4.2.2 Move-In Assistant
**Purpose**: Streamline the moving process
- Timeline checklist
- "Power by Date" guarantee finder
- Deposit estimator
- Document requirements list
- Utility contact information
- Moving tips specific to Texas

#### 4.2.3 Contract Expiration Manager
**Purpose**: Prevent auto-renewals at bad rates
- Email reminder system
- Rate comparison vs. current plan
- "Renew or Switch" decision tree
- Historical rate tracking
- Loyalty offer checker
- Switch timing optimizer

#### 4.2.4 Emergency Power Finder
**Purpose**: Get power restored quickly
- Same-day activation filter
- No-deposit plan finder
- Prepaid plan explainer
- Credit-challenged options
- Payment plan information
- Crisis resource links

### 4.3 Content Requirements

#### 4.3.1 Educational Content
- **Beginner Guides**: Understanding deregulation, reading your bill, choosing a plan
- **Advanced Topics**: Time-of-use plans, renewable energy, demand charges
- **Seasonal Content**: Summer preparation, winter storm readiness
- **News & Updates**: Market changes, new providers, regulatory updates
- **Tools & Calculators**: Usage estimator, savings calculator, solar calculator

#### 4.3.2 Comparison Content
- **Provider Profiles**: History, customer service ratings, plan types
- **Plan Deep Dives**: Detailed analysis of popular plans
- **Head-to-Head Comparisons**: Provider vs. provider breakdowns
- **Market Reports**: Average rates, trends, predictions
- **Location Guides**: City-specific electricity guides

#### 4.3.3 Decision Support Content
- **Buyer's Guides**: By persona, situation, and preference
- **Checklists**: Moving, switching, comparing
- **Templates**: Cancellation letters, complaint forms
- **Scripts**: What to say when calling providers
- **Flowcharts**: Decision trees for common scenarios

---

## 5. User Experience Requirements

### 5.1 Design Principles

#### 5.1.1 Government-Inspired Trust
- Clean, official-looking design
- Texas state colors (#002768 navy, #be0b31 red)
- Minimal advertising
- Professional typography
- Structured layouts
- Accessibility compliance

#### 5.1.2 Task-Oriented Simplicity
- Clear primary actions
- Progressive disclosure
- Minimal cognitive load
- Smart defaults
- Contextual help
- Mobile-first approach

#### 5.1.3 Educational Authority
- Information hierarchy
- Visual learning aids
- Plain English
- Authoritative tone
- Cited sources
- Expert validation

### 5.2 User Interface Requirements

#### 5.2.1 Homepage
- **Hero Section**: Clear value prop with persona selection
- **Quick Tools**: Rate finder, bill analyzer, usage calculator
- **Trust Signals**: Reviews, accreditations, security badges
- **Educational Gateway**: Featured guides and resources
- **Simplified Search**: ZIP code entry with smart detection

#### 5.2.2 Plan Listing Page
- **Smart Filters**: Presets for each persona
- **Comparison Table**: Standardized format, sortable
- **Plan Cards**: Key info above fold, expandable details
- **Sticky CTA**: "Enroll Now" always visible
- **Help Sidebar**: Contextual tips and definitions

#### 5.2.3 Plan Detail Page
- **Pricing Breakdown**: Visual chart with all components
- **Contract Terms**: Highlighted important clauses
- **Provider Info**: Ratings, reviews, contact info
- **Alternatives**: "Similar plans you might like"
- **Enrollment Path**: Clear next steps with timeline

#### 5.2.4 Educational Hub
- **Learning Paths**: Structured by user type
- **Resource Library**: Searchable, filterable content
- **Interactive Tools**: Calculators, quizzes, demos
- **Video Center**: Tutorials and explainers
- **Download Center**: Guides, checklists, templates

### 5.3 Mobile Experience
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Offline Mode**: Key content cached
- **App-Like Feel**: Smooth transitions, native controls
- **Quick Actions**: One-thumb operation for key tasks

### 5.4 Accessibility Requirements
- **WCAG 2.1 AA Compliance**: Full accessibility
- **Screen Reader Support**: Proper ARIA labels
- **Keyboard Navigation**: Full site navigable
- **High Contrast Mode**: Alternative color scheme
- **Text Scaling**: Up to 200% without breaking
- **Alternative Formats**: Audio, large print options

---

## 6. Technical Requirements

### 6.1 Performance
- **Page Load**: <2 seconds on 3G
- **Time to Interactive**: <3 seconds
- **API Response**: <500ms for searches
- **Uptime**: 99.9% availability
- **Mobile Score**: 90+ on PageSpeed Insights

### 6.2 SEO & Discovery
- **Schema Markup**: Structured data for plans
- **Meta Optimization**: Dynamic titles/descriptions
- **URL Structure**: Human-readable, hierarchical
- **XML Sitemaps**: Auto-generated, submitted
- **Internal Linking**: Smart cross-references
- **Content Freshness**: Daily rate updates

### 6.3 Analytics & Tracking
- **User Behavior**: Full funnel tracking
- **Conversion Points**: Multi-touch attribution
- **A/B Testing**: Built-in experimentation
- **Heat Mapping**: User interaction patterns
- **Search Analytics**: Query performance
- **Custom Events**: Persona identification

### 6.4 Integration Requirements
- **Provider APIs**: Real-time rate feeds
- **Enrollment APIs**: Direct submission
- **Review Platform**: ShopperApproved
- **Email Service**: Automated campaigns
- **CRM System**: User relationship management
- **Analytics Platforms**: GA4, GTM, others

### 6.5 Security & Compliance
- **SSL/TLS**: Full site encryption
- **PCI Compliance**: For payment processing
- **PUCT Compliance**: Texas regulatory requirements
- **Data Privacy**: CCPA/GDPR ready
- **Secure Storage**: Encrypted user data
- **Regular Audits**: Security assessments

---

## 7. Content & Copy Requirements

### 7.1 Voice & Tone
- **Authoritative**: Expert knowledge without arrogance
- **Empathetic**: Understanding user frustrations
- **Clear**: Plain English, no jargon
- **Empowering**: "You can do this" messaging
- **Trustworthy**: Honest about pros/cons
- **Action-Oriented**: Clear next steps

### 7.2 Copy Style (Eddie Shleyner Approach)
- **Vulnerable**: Acknowledge the complexity
- **Specific**: Concrete examples and numbers
- **Conversational**: Like talking to a smart friend
- **Story-Driven**: Real user scenarios
- **Benefit-Focused**: What's in it for them
- **Scannable**: Headers, bullets, short paragraphs

### 7.3 Key Messaging
- **Primary**: "Use Your Power to Choose"
- **Supporting**: "The smarter way to shop for electricity"
- **Trust**: "Unbiased comparisons you can trust"
- **Speed**: "Find your best plan in under 10 minutes"
- **Education**: "Understand your options, make better choices"
- **Empowerment**: "Take control of your electricity costs"

---

## 8. Success Metrics

### 8.1 Business KPIs
- **Monthly Revenue**: $75K (target from portfolio)
- **Conversion Rate**: 3-4% visitor to enrollment
- **Average Order Value**: $25-30 per enrollment
- **User Acquisition Cost**: <$10 per enrollment
- **Lifetime Value**: $75+ per user

### 8.2 User Experience Metrics
- **Time to Decision**: <10 minutes average
- **Bounce Rate**: <35% on landing pages
- **Page Views per Session**: 4-6 pages
- **Return Visitor Rate**: >20%
- **Mobile Conversion**: >2.5%

### 8.3 Engagement Metrics
- **Tool Usage**: 40%+ use calculator/analyzer
- **Content Engagement**: 3+ minutes average
- **Email Signup**: 15%+ of visitors
- **Review Completion**: 5%+ post-enrollment
- **Referral Rate**: 10%+ word-of-mouth

### 8.4 Quality Metrics
- **Customer Satisfaction**: 4.5+ stars
- **Support Tickets**: <2% of enrollments
- **Plan Match Rate**: 85%+ happy after 60 days
- **Complaint Rate**: <0.5% to regulators
- **Trust Score**: 80+ NPS

---

## 9. Launch Strategy

### 9.1 Phase 1: MVP (Month 1-2)
- Core comparison functionality
- Basic educational content
- Mobile-responsive design
- Essential trust signals
- Analytics implementation

### 9.2 Phase 2: Enhancement (Month 3-4)
- Bill analyzer tool
- Expanded content library
- Email automation
- A/B testing framework
- Advanced filtering

### 9.3 Phase 3: Authority Building (Month 5-6)
- Complete educational hub
- Video content
- Community features
- API partnerships
- PR campaign

### 9.4 Phase 4: Scale (Month 7+)
- Performance optimization
- Feature expansion
- Market expansion
- Partnership growth
- Brand building

---

## 10. User Stories

### 10.1 Core Functionality Stories

#### Plan Comparison & Selection
- **As a** Moving Texan, **I want to** see all electricity plans available at my new address **so that** I can choose one and have power by my move-in date
- **As a** Bill Questioner, **I want to** compare my current plan's cost to other available plans **so that** I can determine if I'm overpaying
- **As a** Contract Expirer, **I want to** see how my current plan's renewal rate compares to new customer rates **so that** I can decide whether to renew or switch
- **As a** Emergency Connector, **I want to** filter plans by same-day activation **so that** I can get power restored immediately

#### Educational & Decision Support
- **As a** new Texas resident, **I want to** understand how electricity deregulation works **so that** I can make informed decisions
- **As a** confused customer, **I want to** decode my electricity bill line by line **so that** I understand what I'm paying for
- **As a** overwhelmed shopper, **I want to** take a quick quiz to get personalized plan recommendations **so that** I don't have to research dozens of options
- **As a** cautious consumer, **I want to** read about hidden fees and gotchas **so that** I can avoid unpleasant surprises

### 10.2 Trust & Transparency Stories
- **As a** skeptical user, **I want to** understand how the website makes money **so that** I can trust the recommendations aren't biased
- **As a** first-time visitor, **I want to** see customer reviews and ratings **so that** I can trust this website is legitimate
- **As a** security-conscious user, **I want to** see security certifications and privacy policies **so that** I feel safe entering my information
- **As a** comparison shopper, **I want to** see verified provider information **so that** I can trust the data accuracy

### 10.3 User Experience Stories
- **As a** mobile user, **I want to** easily compare plans on my phone **so that** I can shop anywhere
- **As a** time-pressed user, **I want to** see the "best plan for most people" highlighted **so that** I can make a quick decision
- **As a** detail-oriented user, **I want to** access comprehensive plan information **so that** I can make a fully informed choice
- **As a** visual learner, **I want to** see pricing charts and graphs **so that** I can easily understand cost differences

### 10.4 Tool-Specific Stories

#### Bill Analyzer
- **As a** Bill Questioner, **I want to** upload a photo of my bill **so that** the system can automatically extract my usage data
- **As a** current customer, **I want to** see a breakdown of my current rate vs. available rates **so that** I can quantify potential savings
- **As a** confused customer, **I want to** see explanations of each line item on my bill **so that** I understand what I'm paying for

#### Move-In Assistant
- **As a** Moving Texan, **I want to** see a moving checklist with electricity tasks **so that** I don't forget important steps
- **As a** renter, **I want to** know what documents I need to set up electricity **so that** I can prepare in advance
- **As a** credit-challenged mover, **I want to** estimate deposit requirements **so that** I can budget accordingly

#### Contract Expiration Manager
- **As a** Contract Expirer, **I want to** receive email reminders before my contract expires **so that** I don't get automatically renewed at a higher rate
- **As a** existing customer, **I want to** see historical rate data for my current plan **so that** I can track how my rates have changed over time
- **As a** loyalty program member, **I want to** check if my current provider has retention offers **so that** I can negotiate a better rate

#### Emergency Power Finder
- **As a** Emergency Connector, **I want to** find plans with no credit check **so that** I can get power despite credit issues
- **As a** cash-strapped user, **I want to** see prepaid plan options **so that** I can control my spending
- **As a** someone in crisis, **I want to** access resources for payment assistance **so that** I can get help paying my bills

### 10.5 Content & Education Stories
- **As a** beginner, **I want to** access "Electricity 101" guides **so that** I can learn the basics before shopping
- **As a** seasonal resident, **I want to** find tips for managing summer/winter bills **so that** I can prepare for high usage months
- **As a** environmentally conscious user, **I want to** learn about renewable energy plans **so that** I can reduce my carbon footprint
- **As a** tech enthusiast, **I want to** understand smart home integration options **so that** I can optimize my energy usage

### 10.6 Advanced Features Stories
- **As a** data-driven user, **I want to** see market trend reports **so that** I can time my plan changes optimally
- **As a** multi-property owner, **I want to** compare plans for multiple addresses **so that** I can manage all my accounts efficiently
- **As a** business owner, **I want to** access commercial plan comparisons **so that** I can find the best rates for my business
- **As a** frequent mover, **I want to** save my preferences and history **so that** I can quickly find plans at new addresses

### 10.7 Support & Service Stories
- **As a** confused user, **I want to** access live chat support **so that** I can get immediate help with plan selection
- **As a** enrolled customer, **I want to** receive follow-up emails with tips **so that** I can maximize my plan benefits
- **As a** dissatisfied customer, **I want to** access complaint resolution resources **so that** I can address issues with my provider
- **As a** referrer, **I want to** easily share plan recommendations with friends **so that** I can help them save money too

### 10.8 Accessibility Stories
- **As a** visually impaired user, **I want to** navigate the site with a screen reader **so that** I can independently compare plans
- **As a** user with limited mobility, **I want to** navigate the entire site using only a keyboard **so that** I can access all features
- **As a** user with cognitive disabilities, **I want to** see complex information broken into simple steps **so that** I can understand my options
- **As a** user who speaks English as a second language, **I want to** access plan information in simple, clear language **so that** I can make informed decisions

---

## 11. Risk Mitigation

### 11.1 Technical Risks
- **Data Accuracy**: Multiple provider API validation
- **Site Performance**: CDN and caching strategy
- **Security Breaches**: Regular audits and monitoring
- **Scalability**: Cloud infrastructure planning

### 11.2 Market Risks
- **Regulatory Changes**: Flexible architecture
- **Competitor Response**: Unique value proposition
- **Provider Relations**: Win-win partnerships
- **Market Volatility**: Diversified content strategy

### 11.3 User Risks
- **Trust Issues**: Transparency and social proof
- **Complexity**: Progressive disclosure design
- **Decision Paralysis**: Smart recommendations
- **Technical Barriers**: Multiple support channels

---

## 12. Appendices

### Appendix A: Competitor Feature Matrix
[Detailed comparison table of features across competitors]

### Appendix B: User Research Data
[Summary of user interviews, surveys, and testing]

### Appendix C: Technical Architecture
[System design diagrams and specifications]

### Appendix D: Content Calendar
[6-month editorial calendar with topics]

### Appendix E: Wireframes & Mockups
[Key page designs and user flows]

---

**Document Status**: Ready for stakeholder review
**Next Steps**: Technical feasibility assessment and design sprint planning