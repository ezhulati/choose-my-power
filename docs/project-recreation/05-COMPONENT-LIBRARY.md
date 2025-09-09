# Component Library & Design System

**Document**: Complete UI Component Specifications  
**Version**: 1.0  
**Date**: 2025-09-09  

## Design System Overview

The ChooseMyPower design system is built on Texas-themed branding with Power to Choose aesthetics, featuring **78 React components** and **comprehensive Astro integrations** for optimal performance and accessibility.

### **Core Design Principles**
1. **Texas-First Branding**: Navy, red, and gold color palette inspired by Texas flag
2. **Mobile-First Approach**: 60% mobile traffic optimization
3. **Accessibility Compliance**: WCAG 2.1 AA standards throughout
4. **Performance Focus**: Core Web Vitals optimization in every component
5. **Real Data Integration**: Zero mock data, database-first component patterns

## Color System

### **Primary Brand Colors**
```css
/* Texas Navy - Primary brand color */  
--texas-navy: #002868;

/* Texas Red - Action, CTAs, urgency */
--texas-red: #dc2626; /* red-600 */
--texas-red-50: #fef2f2;
--texas-red-100: #fee2e2; 
--texas-red-200: #fecaca;
--texas-red-300: #fca5a5;
--texas-red-400: #f87171;
--texas-red-500: #ef4444;
--texas-red-600: #dc2626; /* Primary */
--texas-red-700: #b91c1c;
--texas-red-800: #991b1b;

/* Texas Gold - Highlights, success, premium */
--texas-gold: #f59e0b; /* amber-500 */
--texas-gold-50: #fffbeb;
--texas-gold-100: #fef3c7;
--texas-gold-200: #fde68a;
--texas-gold-300: #fcd34d;
--texas-gold-400: #fbbf24;
--texas-gold-500: #f59e0b; /* Primary */
--texas-gold-600: #d97706;
--texas-gold-700: #b45309;

/* Texas Cream - Soft backgrounds */
--texas-cream: #f8edd3;
--texas-cream-50: #fefefe;
--texas-cream-200: #fefcf8;  
--texas-cream-300: #fdf8f0;
--texas-cream-400: #fbf2e4;
--texas-cream-500: #f8edd3; /* Primary */
```

### **Semantic Color Usage**
```css
/* Component-specific color applications */
.primary-cta { color: var(--texas-red); }           /* Shop, Compare, Sign Up */
.secondary-cta { color: var(--texas-navy); }        /* Learn More, View Details */
.success-state { color: var(--texas-gold); }        /* Savings, Best Value */
.navigation { color: var(--texas-navy); }           /* Headers, links, menu */
.section-bg { background: var(--texas-cream-200); } /* Section backgrounds */
```

## Typography System

### **Font Stack**
```css
/* Primary font family */
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

/* Secondary font (emphasis/quotes) */  
font-family: 'Georgia', serif;
```

### **Type Scale & Usage**
```css
/* Display Text - Hero sections */
.text-hero { font-size: 4.5rem; line-height: 1.1; font-weight: 800; } /* 72px */
.text-display { font-size: 3.75rem; line-height: 1.1; font-weight: 700; } /* 60px */

/* Headings - Content hierarchy */
.text-h1 { font-size: 2.25rem; line-height: 1.1; font-weight: 700; } /* 36px */
.text-h2 { font-size: 1.875rem; line-height: 1.2; font-weight: 600; } /* 30px */
.text-h3 { font-size: 1.5rem; line-height: 1.3; font-weight: 600; } /* 24px */
.text-h4 { font-size: 1.25rem; line-height: 1.4; font-weight: 500; } /* 20px */

/* Body Text */  
.text-body { font-size: 1rem; line-height: 1.5; font-weight: 400; } /* 16px */
.text-small { font-size: 0.875rem; line-height: 1.4; font-weight: 400; } /* 14px */
.text-caption { font-size: 0.75rem; line-height: 1.3; font-weight: 400; } /* 12px */
```

## Core UI Components

### **1. Button Component System**

#### **Button Variants**
```typescript
// src/components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// Implementation with Texas branding
const buttonVariants = {
  primary: 'bg-texas-red hover:bg-texas-red-600 text-white',
  secondary: 'bg-texas-navy hover:bg-blue-800 text-white',
  outline: 'border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white',
  ghost: 'text-texas-navy hover:bg-texas-cream-200',
  destructive: 'bg-red-600 hover:bg-red-700 text-white'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base', 
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};
```

#### **Usage Examples**
```tsx
// Primary CTA buttons  
<Button variant="primary" size="lg">Compare Plans</Button>
<Button variant="primary" size="lg" fullWidth>Get Started</Button>

// Secondary actions
<Button variant="secondary" size="md">Learn More</Button>
<Button variant="outline" size="md">View Details</Button>

// Loading states
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Submit'}
</Button>
```

### **2. Card Component System**

#### **Plan Card Component**
```typescript
// src/components/ui/ProfessionalPlanCard.tsx
interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    provider: {
      name: string;
      logo?: string;
      rating: number;
    };
    pricing: {
      rate1000kWh: number;
      estimatedMonthlyBill?: number;
    };
    contract: {
      lengthMonths: number;
      type: 'fixed' | 'variable' | 'indexed';
    };
    features: string[];
    isPopular?: boolean;
    savings?: {
      amount: number;
      percentage: number;
    };
  };
  onSelect: (planId: string) => void;
  onCompare?: (planId: string, checked: boolean) => void;
  isComparing?: boolean;
}

// Card structure with Texas branding
<Card className="plan-card hover:shadow-lg hover:border-texas-navy transition-all duration-300">
  <CardHeader>
    <div className="flex justify-between items-start">
      <ProviderLogo provider={plan.provider} />
      {plan.isPopular && (
        <Badge className="bg-texas-gold text-white">Most Popular</Badge>
      )}
    </div>
    <CardTitle className="text-texas-navy">{plan.name}</CardTitle>
  </CardHeader>
  
  <CardContent>
    <PricingDisplay pricing={plan.pricing} />
    <ContractDetails contract={plan.contract} />
    <FeatureList features={plan.features} />
    
    <div className="flex gap-2 mt-4">
      <Button 
        variant="primary" 
        size="lg" 
        fullWidth
        onClick={() => onSelect(plan.id)}
      >
        Select Plan
      </Button>
      <Button 
        variant="outline" 
        size="lg"
        onClick={() => onCompare?.(plan.id, !isComparing)}
      >
        Compare
      </Button>
    </div>
  </CardContent>
</Card>
```

### **3. Form Components**

#### **ZIP Code Input Component**
```typescript
// src/components/ui/ZipCodeInput.tsx
interface ZipCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean, data?: ZipValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValidation?: boolean;
}

// Mobile-optimized implementation
<div className="zip-input-container">
  <div className="relative">
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]{5}"
      maxLength={5}
      value={zipCode}
      onChange={handleZipChange}
      placeholder="Enter ZIP code"
      className={cn(
        "pl-12 pr-16 py-3 text-lg", // Large touch targets for mobile
        "border-2 focus:border-texas-red focus:ring-texas-red-200",
        validationState === 'error' && "border-red-500",
        validationState === 'success' && "border-green-500"
      )}
    />
    
    {/* Left icon */}
    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    
    {/* Right validation indicator */}
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
      {isValidating && <Loader2 className="w-5 h-5 animate-spin text-texas-red" />}
      {validationState === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
      {validationState === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
    </div>
  </div>
  
  {/* Validation message */}
  {showValidation && validationMessage && (
    <div className={cn(
      "mt-2 text-sm",
      validationState === 'error' ? "text-red-600" : "text-green-600"
    )}>
      {validationMessage}
    </div>
  )}
</div>
```

#### **Address Search Modal**
```typescript
// src/components/ui/AddressSearchModal.tsx
interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: {
    id: string;
    name: string;
    provider: { name: string };
    apiPlanId?: string; // MongoDB ObjectId from API
  };
  onSuccess: (esiid: string, address: string) => void;
}

// Modal with multi-step address validation
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-texas-navy">
        Confirm Your Service Address
      </DialogTitle>
      <DialogDescription>
        We need to verify your address to ensure accurate plan pricing and availability.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* Step 1: Address Entry */}
      <AddressForm
        onSubmit={handleAddressSubmit}
        loading={isValidating}
        error={validationError}
      />
      
      {/* Step 2: Address Validation Results */}
      {validationResults && (
        <AddressValidationResults
          results={validationResults}
          onSelect={handleAddressSelect}
        />
      )}
      
      {/* Step 3: ESID Generation */}
      {selectedAddress && (
        <ESIDGeneration
          address={selectedAddress}
          onSuccess={handleESIDSuccess}
          loading={isGeneratingESID}
        />
      )}
      
      {/* Final Step: Order Preparation */}
      {esiid && (
        <OrderSummary
          plan={planData}
          address={selectedAddress}
          esiid={esiid}
          onProceed={() => onSuccess(esiid, selectedAddress.formatted)}
        />
      )}
    </div>
  </DialogContent>
</Dialog>
```

### **4. Navigation Components**

#### **Header Navigation**
```typescript
// src/components/Header.tsx
interface HeaderProps {
  transparent?: boolean;
  sticky?: boolean;
}

// Responsive header with mobile optimization
<header className={cn(
  "w-full z-50 transition-all duration-300",
  sticky && "sticky top-0",
  transparent ? "bg-transparent" : "bg-white shadow-sm"
)}>
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16 lg:h-20">
      
      {/* Logo */}
      <div className="flex items-center">
        <Logo className="h-8 lg:h-10" />
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-8">
        <NavLink href="/electricity-plans">Compare Plans</NavLink>
        <NavLink href="/providers">Providers</NavLink>
        <NavLink href="/resources">Resources</NavLink>
        <NavLink href="/about">About</NavLink>
      </nav>
      
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 rounded-md text-texas-navy"
        onClick={toggleMobileMenu}
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* CTA Button */}
      <div className="hidden lg:block">
        <Button variant="primary" size="md">
          Find Plans
        </Button>
      </div>
    </div>
  </div>
  
  {/* Mobile Menu */}
  <MobileNavigation 
    isOpen={mobileMenuOpen}
    onClose={() => setMobileMenuOpen(false)}
  />
</header>
```

### **5. Specialized Components**

#### **Faceted Filter Component**
```typescript
// src/components/faceted/FacetedFilters.tsx
interface FacetedFiltersProps {
  facets: {
    contractLengths: FilterOption[];
    rateTypes: FilterOption[];
    providers: FilterOption[];
    features: FilterOption[];
  };
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  planCount: number;
}

// Advanced filtering interface
<div className="faceted-filters space-y-6">
  {/* Active Filters Display */}
  <ActiveFiltersDisplay 
    filters={activeFilters}
    onRemove={handleFilterRemove}
    onClear={handleClearAll}
  />
  
  {/* Filter Categories */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    
    {/* Contract Length Filter */}
    <FilterGroup title="Contract Length">
      {facets.contractLengths.map(option => (
        <FilterCheckbox
          key={option.value}
          label={`${option.value} months`}
          count={option.count}
          checked={activeFilters.contractLengths.includes(option.value)}
          onChange={(checked) => handleFilterChange('contractLengths', option.value, checked)}
        />
      ))}
    </FilterGroup>
    
    {/* Rate Type Filter */}
    <FilterGroup title="Rate Type">
      <FilterRadioGroup
        options={facets.rateTypes}
        selected={activeFilters.rateType}
        onChange={(value) => handleFilterChange('rateType', value)}
      />
    </FilterGroup>
    
    {/* Provider Filter */}
    <FilterGroup title="Providers">
      <ProviderFilterList
        providers={facets.providers}
        selected={activeFilters.providers}
        onChange={(providers) => handleFilterChange('providers', providers)}
      />
    </FilterGroup>
    
    {/* Features Filter */}
    <FilterGroup title="Plan Features">
      <FeatureFilterList
        features={facets.features}
        selected={activeFilters.features}
        onChange={(features) => handleFilterChange('features', features)}
      />
    </FilterGroup>
  </div>
  
  {/* Results Summary */}
  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
    <span className="text-sm text-gray-600">
      {planCount} plans match your filters
    </span>
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleClearAll}
    >
      Clear All Filters
    </Button>
  </div>
</div>
```

## Mobile-First Component Patterns

### **Touch-Optimized Interfaces**
```typescript
// Mobile-specific component optimizations
interface TouchOptimizedProps {
  minTouchTarget: 44; // pixels - iOS/Android minimum
  swipeGestures: boolean;
  hapticFeedback: boolean;
  oneHandedOperation: boolean;
}

// Plan card with swipe gestures
<SwipeableCard
  onSwipeLeft={() => addToComparison(plan.id)}
  onSwipeRight={() => viewDetails(plan.id)}
  className="touch-manipulation" // CSS property for smooth scrolling
>
  <PlanCardContent plan={plan} />
  <SwipeIndicators />
</SwipeableCard>

// Mobile-optimized comparison modal
<ComparisonModal
  orientation="portrait" // Optimized for mobile screens
  maxPlans={2} // Reduced for mobile viewing
  swipeToNavigate={true}
  stackedLayout={true} // Vertical stacking instead of side-by-side
>
  <PlanComparisonContent />
</ComparisonModal>
```

### **Progressive Enhancement Patterns**
```typescript
// Progressive enhancement for mobile features
const MobileEnhancedComponent = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [supportsTouch, setSupportsTouch] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setSupportsTouch('ontouchstart' in window);
  }, []);
  
  return (
    <div className={cn(
      "component-base",
      isMobile && "mobile-optimized",
      supportsTouch && "touch-enabled"
    )}>
      {/* Base functionality for all devices */}
      <BaseContent />
      
      {/* Enhanced mobile features */}
      {isMobile && supportsTouch && (
        <MobileTouchFeatures />
      )}
    </div>
  );
};
```

## Component Testing Standards

### **Component Test Requirements**
```typescript
// Example component test suite
// tests/components/PlanCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfessionalPlanCard } from '../src/components/ui/ProfessionalPlanCard';

describe('ProfessionalPlanCard', () => {
  const mockPlan = {
    id: '68b4f12d8e9c4a5b2f3e6d8a9',
    name: 'Cash Money 12',
    provider: { name: '4Change Energy', rating: 4.2 },
    pricing: { rate1000kWh: 12.5 },
    contract: { lengthMonths: 12, type: 'fixed' as const },
    features: ['No Deposit', 'Fixed Rate']
  };
  
  it('renders plan information correctly', () => {
    render(
      <ProfessionalPlanCard 
        plan={mockPlan}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('Cash Money 12')).toBeInTheDocument();
    expect(screen.getByText('4Change Energy')).toBeInTheDocument();
    expect(screen.getByText('12.5¢')).toBeInTheDocument();
  });
  
  it('calls onSelect with plan ID when Select Plan button is clicked', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <ProfessionalPlanCard 
        plan={mockPlan}
        onSelect={mockOnSelect}
      />
    );
    
    fireEvent.click(screen.getByText('Select Plan'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockPlan.id);
  });
  
  it('meets accessibility standards', () => {
    const { container } = render(
      <ProfessionalPlanCard 
        plan={mockPlan}
        onSelect={jest.fn()}
      />
    );
    
    // Check for proper ARIA labels
    expect(screen.getByRole('button', { name: /select plan/i })).toBeInTheDocument();
    
    // Check for semantic HTML
    expect(container.querySelector('article')).toBeInTheDocument();
    
    // Ensure color contrast compliance
    const elements = container.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      // Color contrast testing logic here
    });
  });
  
  it('handles mobile touch interactions', () => {
    // Mock touch events
    Object.defineProperty(window, 'ontouchstart', {
      value: () => {},
      writable: true
    });
    
    render(
      <ProfessionalPlanCard 
        plan={mockPlan}
        onSelect={jest.fn()}
      />
    );
    
    const card = screen.getByRole('article');
    
    // Test touch target size (minimum 44px)
    const styles = window.getComputedStyle(card);
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    
    // Test touch interactions
    fireEvent.touchStart(card);
    fireEvent.touchEnd(card);
  });
});
```

## Component Performance Standards

### **Performance Requirements**
- **Render Time**: <16ms for smooth 60fps interactions
- **Bundle Size**: Individual components <5KB gzipped  
- **Memory Usage**: <50MB total for component tree
- **Touch Response**: <16ms for all touch interactions

### **Performance Optimization Patterns**
```typescript
// Lazy loading for heavy components
const HeavyComparisonModal = lazy(() => import('./ComparisonModal'));

// Memoization for expensive calculations  
const MemoizedPlanCard = React.memo(PlanCard, (prevProps, nextProps) => {
  return prevProps.plan.id === nextProps.plan.id &&
         prevProps.isComparing === nextProps.isComparing;
});

// Virtual scrolling for large lists
const VirtualizedPlanList = () => {
  return (
    <FixedSizeList
      height={600}
      itemCount={plans.length}
      itemSize={300}
      itemData={plans}
    >
      {PlanCardRenderer}
    </FixedSizeList>
  );
};
```

This component library specification provides the complete foundation for building a cohesive, accessible, and performant user interface that matches the Texas-themed branding and mobile-first requirements of the ChooseMyPower platform.