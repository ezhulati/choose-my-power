# User Journeys & Experience Flows

**Document**: Complete User Experience Specification  
**Version**: 1.0  
**Date**: 2025-09-09  

## Primary User Personas

### **Persona 1: The Cost-Conscious Switcher**
- **Demographics**: Age 28-45, household income $40k-80k, tech-savvy
- **Goals**: Find the lowest electricity rates, reduce monthly bills
- **Pain Points**: Confused by complex rate structures, worried about hidden fees
- **Device Usage**: 60% mobile, 40% desktop
- **Behavior**: Price-focused, compares multiple options, reads reviews

### **Persona 2: The Green Energy Advocate**  
- **Demographics**: Age 25-55, household income $60k-120k, environmentally conscious
- **Goals**: Find renewable energy options, support sustainable providers
- **Pain Points**: Limited green energy options, higher costs
- **Device Usage**: 50% mobile, 50% desktop  
- **Behavior**: Feature-focused, willing to pay premium for green energy

### **Persona 3: The Busy Professional**
- **Demographics**: Age 30-50, household income $80k+, time-constrained
- **Goals**: Quick comparison, reliable service, minimal hassle
- **Pain Points**: No time for extensive research, needs simple decisions
- **Device Usage**: 70% mobile, 30% desktop
- **Behavior**: Convenience-focused, trusts recommendations, values efficiency

### **Persona 4: The First-Time Renter**
- **Demographics**: Age 22-35, moving to Texas, unfamiliar with deregulation
- **Goals**: Understand electricity options, get service quickly
- **Pain Points**: Overwhelmed by choices, doesn't understand TDSP vs provider
- **Device Usage**: 80% mobile, 20% desktop
- **Behavior**: Education-focused, seeks guidance, relies on recommendations

## Core User Journeys

### **Journey 1: ZIP Code to Plan Selection (Primary Flow - 45% of users)**

#### **Entry Points**
1. **Homepage Hero**: Large ZIP input with "Compare Plans" CTA
2. **City Pages**: ZIP lookup forms on Dallas, Houston, Austin pages  
3. **Direct URLs**: `/electricity-plans/dallas-tx/` with ZIP prompts
4. **Organic Search**: "Electricity plans [ZIP]" searches

#### **Step-by-Step Flow**

**Step 1: ZIP Code Entry**
```
User Experience:
- Large, mobile-optimized ZIP input field
- Real-time validation (Texas ZIP codes only)
- Auto-format to 5-digit format
- Disabled submit until valid ZIP entered
- Loading state during validation (200ms target)

Technical Implementation:
- POST /api/zip/validate
- TDSP territory lookup
- City slug determination  
- Plan count preview
- Error handling for invalid/non-Texas ZIPs
```

**Step 2: Instant Navigation**  
```
User Experience:
- Direct redirect to /electricity-plans/{city-tx}/
- No intermediate pages or loading screens
- Full page render before display (constitutional requirement)
- Plan count and city confirmation

Technical Implementation:  
- ZIP to city slug mapping
- Pre-load plan data during validation
- Render complete plans page
- Analytics tracking: ZIP → Plans conversion
```

**Step 3: Plan Browsing**
```
User Experience:
- Grid view of available plans (12-24 plans per page)
- Clear pricing display (cents per kWh + estimated monthly bill)
- Provider logos and ratings
- Quick filter options (contract length, rate type)
- Sort by price, rating, or features

Technical Implementation:
- Real data from provider-service.ts
- Faceted navigation system
- Client-side filtering for performance
- Plan ID resolution for ordering
```

**Step 4: Plan Comparison (Optional)**
```  
User Experience:
- "Compare" checkboxes on plan cards
- Side-by-side comparison modal (up to 3 plans)
- Feature comparison matrix
- Calculated savings comparison
- Monthly/annual cost projections

Technical Implementation:
- POST /api/plans/compare  
- Usage profile calculations
- Real-time cost calculations
- Responsive comparison table
```

**Step 5: Plan Selection**
```
User Experience:
- "Select Plan" button opens address modal
- Clear plan confirmation with details
- "Order Now" CTA with provider branding
- Trust signals (secure, official ComparePower integration)

Technical Implementation:
- Plan ID resolution via /api/plans/search
- MongoDB ObjectId validation (never hardcoded)
- ComparePower order URL generation
- Address validation modal
```

**Step 6: Address Validation**
```
User Experience:
- Full address form with smart autocomplete
- Real-time USPS validation
- Address suggestions for partial matches  
- ESID generation confirmation
- Service territory validation

Technical Implementation:
- POST /api/address/validate (USPS integration)
- POST /api/ercot/validate (ESID generation)
- Address-based ESID calculation (never hardcoded)
- TDSP territory confirmation
```

**Step 7: Order Completion**
```
User Experience:
- Redirect to ComparePower with plan details
- Pre-filled customer information
- Plan confirmation page
- Order tracking information

Technical Implementation:
- ComparePower API integration
- Plan ID + ESID + address payload
- Order tracking pixel
- Conversion analytics
```

### **Journey 2: Educational Research to Plans (25% of users)**

#### **Entry Points**
1. **Educational Content**: Blog posts about deregulation
2. **Provider Pages**: Individual electricity company pages
3. **Resource Pages**: Guides about choosing electricity plans
4. **Comparison Pages**: "Best Plans" or "Green Energy" pages

#### **Step-by-Step Flow**

**Step 1: Educational Content Consumption**
```
User Experience:
- Comprehensive guides about Texas electricity deregulation
- Provider comparison articles
- Rate type explanations (fixed vs variable)
- TDSP territory information

Content Requirements:
- 2000+ word comprehensive guides
- Interactive elements (calculators, comparisons)
- Expert insights and tips
- Clear calls-to-action to compare plans
```

**Step 2: Provider Research**
```  
User Experience:
- Individual provider pages with detailed information
- Customer ratings and reviews
- Plan portfolio overview
- Service territory coverage
- Contact information and customer service ratings

Technical Implementation:
- Real provider data from provider-service.ts
- Dynamic rating calculations
- Plan count by city
- Customer review aggregation
```

**Step 3: Location-Specific Navigation**
```
User Experience:
- "See Plans in Your Area" CTAs throughout content
- ZIP input forms embedded in articles  
- City-specific recommendations
- Local context and pricing information

Technical Implementation:  
- Same ZIP validation flow as Journey 1
- Context-aware plan recommendations
- City-specific content customization
```

### **Journey 3: Direct City Navigation (20% of users)**

#### **Entry Points**
1. **Organic Search**: "Electricity plans Dallas" searches
2. **Direct URLs**: `/texas/dallas/` or `/electricity-plans/dallas-tx/`
3. **Local SEO**: Google My Business or local directory links
4. **Referral Traffic**: Local websites and forums

#### **Step-by-Step Flow**

**Step 1: City Landing Page**
```
User Experience:
- City-specific hero with local imagery
- Plan count and average rate information  
- Local utility (TDSP) information
- Top provider recommendations
- ZIP input for address confirmation

Content Elements:
- "Electricity Plans in [City], Texas"
- Local context (population, demographics)
- TDSP territory explanation
- Average residential usage statistics
```

**Step 2: Plan Filtering and Browsing**
```
User Experience:
- Pre-filtered plans for specific city
- Local provider focus
- City-specific rates and offers
- Service territory confirmation

Technical Implementation:
- City-specific plan data loading
- TDSP-filtered provider lists  
- Local rate calculations
- Geographic plan availability
```

**Step 3: Plan Selection Flow**  
```
(Continues with same address validation and ordering flow as Journey 1)
```

### **Journey 4: Mobile-First Experience (60% of users)**

#### **Mobile-Specific Optimizations**

**Touch Interface Design**
```
User Experience:
- Large, thumb-friendly input fields (min 44px touch targets)
- Swipe gestures for plan cards
- Pull-to-refresh on plan lists
- Mobile-optimized comparison modal
- One-handed operation support

Technical Implementation:
- Touch-optimized React components in /src/components/mobile/
- Progressive Web App features
- Offline capability for plan browsing
- Mobile-specific performance optimizations
```

**Mobile Performance**
```  
Performance Requirements:
- <3 second page load on 3G networks
- <1 second ZIP validation response
- Lazy loading for plan images and details
- Progressive image loading (AVIF/WebP)
- Client-side caching for return visits

Technical Implementation:
- Astro's strategic code splitting
- Mobile-first CSS with desktop enhancement
- Service worker for offline functionality
- Image optimization pipeline
```

## Critical User Flow Requirements

### **Constitutional Requirements (Must-Have)**

**1. Plan ID Integrity**
```
Requirement: Never display or process hardcoded plan IDs
Implementation: Dynamic MongoDB ObjectId resolution only
Validation: Automated tests prevent hardcoded ID patterns
Risk: Wrong plan orders if IDs are hardcoded
```

**2. ESID Accuracy**  
```
Requirement: Address-based ESID generation only
Implementation: ZIP pattern + address validation + ERCOT API
Validation: Never hardcode ESIDs, always generate from address
Risk: Service connection failures with wrong ESIDs  
```

**3. Full Page Rendering**
```
Requirement: Complete page load before user sees content
Implementation: Astro SSR with data pre-loading
Validation: No partial loading states visible to users
Risk: Poor user experience with incomplete data
```

### **Performance Requirements**

**Page Load Performance**
- **Homepage**: <2 seconds LCP, <100ms FID
- **Plan Pages**: <3 seconds LCP with full plan data
- **ZIP Validation**: <200ms response time
- **Address Modal**: <300ms to display
- **Plan Comparison**: <500ms to load comparison data

**Mobile Performance**
- **Touch Response**: <16ms for all interactions  
- **Scroll Performance**: 60fps maintained
- **Image Loading**: Progressive AVIF/WebP with lazy loading
- **Offline Support**: Plan browsing available offline

### **Accessibility Requirements**

**WCAG 2.1 AA Compliance**
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Management**: Visible focus indicators throughout flows
- **Alternative Text**: Descriptive alt text for all images

**Mobile Accessibility**
- **Touch Targets**: Minimum 44px for all interactive elements
- **Zoom Support**: 400% zoom without horizontal scrolling  
- **Voice Control**: Support for voice navigation
- **High Contrast**: Support for high contrast mode

## Analytics & Optimization

### **Key Performance Indicators**

**Conversion Metrics**
- **ZIP to Plans**: >75% conversion rate
- **Plans to Address**: >25% conversion rate  
- **Address to Order**: >60% conversion rate
- **Overall Conversion**: >15% ZIP to order completion

**Engagement Metrics**
- **Average Session Duration**: >3 minutes
- **Pages per Session**: >3 pages
- **Plan Comparison Usage**: >30% of sessions
- **Mobile Engagement**: >60% mobile traffic retention

**Technical Metrics**
- **Page Load Speed**: 95% pages <3 seconds
- **API Response Times**: 95% <500ms
- **Error Rates**: <2% across all user flows
- **Mobile Performance**: Core Web Vitals in green zone

### **A/B Testing Framework**

**Test Categories**
1. **ZIP Input Optimization**: Form design, validation messages, CTAs
2. **Plan Display**: Card layout, information hierarchy, pricing display
3. **Comparison Tools**: Modal design, feature presentation, CTA placement
4. **Mobile Experience**: Touch interactions, navigation patterns, form flows

**Testing Implementation**  
```typescript
// A/B testing service integration
interface ABTest {
  testId: string;
  variant: 'control' | 'variant_a' | 'variant_b';
  trafficSplit: number;
  metrics: string[];
  duration: string;
}

// Usage in components
const { variant } = useABTest('zip_form_design');
const ZipForm = variant === 'variant_a' ? 
  <EnhancedZipForm /> : <StandardZipForm />;
```

This comprehensive user journey documentation ensures that development teams can create user experiences that convert effectively while maintaining the technical requirements and performance standards necessary for the ChooseMyPower platform.