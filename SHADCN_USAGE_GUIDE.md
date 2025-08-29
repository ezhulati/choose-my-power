# Shadcn/UI Components Usage Guide for ChooseMyPower

This guide demonstrates how to use the installed shadcn/ui components to improve design consistency and spacing throughout the electricity plan comparison platform.

## Installed Components

### Core Components
- ✅ **Badge** - For labels, status indicators, and tags
- ✅ **Button** - For CTAs, actions, and navigation
- ✅ **Card** - For plan cards, content containers, and sections
- ✅ **Separator** - For visual section breaks
- ✅ **Alert** - For important messages and notifications

### Enhanced Components
- ✅ **Tabs** - For tabbed interfaces and view switching
- ✅ **Progress** - For loading states and progress indicators
- ✅ **Tooltip** - For helpful hints and additional information
- ✅ **Avatar** - For user profiles and provider representations

### Form Components
- ✅ **Input** - Already available for form inputs
- ✅ **Select** - Already available for dropdowns
- ✅ **Table** - Already available for comparison tables

## Design System Integration

### Texas-Themed Variants

All components have been enhanced with Texas-specific variants that match your brand:

#### Badge Variants
```tsx
// Texas-specific badge variants
<Badge variant="texas-primary">Featured Plan</Badge>
<Badge variant="texas-secondary">Top Choice</Badge>
<Badge variant="texas-accent">Best Value</Badge>
<Badge variant="green-energy">🌱 100% Green</Badge>
<Badge variant="featured">🏆 #1 Plan</Badge>
```

#### Button Variants
```tsx
// Texas-themed button variants
<Button variant="texas-primary">Enroll Now</Button>
<Button variant="texas-secondary">Compare Plans</Button>
<Button variant="texas-outline">Learn More</Button>
<Button variant="texas-ghost">View Details</Button>
```

#### Card Variants
```tsx
// Specialized card variants for plans
<Card variant="plan-card">Standard Plan Card</Card>
<Card variant="popular">Popular Plan (with special styling)</Card>
<Card variant="featured">Featured Plan (gold accent)</Card>
<Card variant="texas-themed">Texas-branded card</Card>
```

## Implementation Examples

### 1. Improved Plan Card Structure

Replace the current custom card styling with shadcn/ui Card components:

```astro
---
// Before: Custom card with inconsistent spacing
<div class="plan-card plan-card-hover bg-white border rounded-lg p-6">
  <!-- Content -->
</div>

// After: Structured shadcn/ui Card
---
<Card variant="plan-card" className="hover:shadow-lg transition-all duration-300">
  <CardHeader>
    <!-- Provider info and badges -->
  </CardHeader>
  <CardContent className="space-y-6">
    <!-- Pricing, features, contract details -->
    <Separator className="my-6" />
    <!-- Additional sections -->
  </CardContent>
  <CardFooter>
    <!-- Action buttons -->
  </CardFooter>
</Card>
```

### 2. Consistent Badge Usage

Replace inline badge styles with shadcn/ui Badges:

```astro
<!-- Before: Custom badge styles -->
<span class="trust-badge bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
  12-month
</span>

<!-- After: Consistent Badge component -->
<Badge variant="plan-type" className="flex items-center gap-1">
  <span>📅</span>
  <span>12-month</span>
</Badge>
```

### 3. Professional Button Styling

Replace custom button classes with shadcn/ui Buttons:

```astro
<!-- Before: Custom button styles -->
<a href="/enroll" class="btn-primary-texas enroll-btn">
  Enroll Now
</a>

<!-- After: Consistent Button component -->
<Button variant="texas-primary" size="lg" asChild>
  <a href="/enroll">
    <span className="mr-2">⚡</span>
    Enroll Now
  </a>
</Button>
```

### 4. Improved Section Separation

Use Separator component for better visual hierarchy:

```astro
<!-- Before: Custom border styles -->
<div class="border-t border-gray-100 pt-6 mb-6">

<!-- After: Semantic Separator -->
<Separator className="my-6" />
<div className="space-y-4">
```

### 5. Alert for Important Information

Replace custom alert boxes with Alert component:

```astro
<!-- Before: Custom alert styling -->
<div class="price-transparency bg-green-50 border border-green-200 rounded-lg p-3">
  <p class="text-green-800">Prices include all fees</p>
</div>

<!-- After: Consistent Alert component -->
<Alert className="border-green-200 bg-green-50">
  <AlertDescription className="text-green-800 font-medium flex items-center gap-2">
    <span className="text-green-600">ℹ️</span>
    Prices include all electricity charges and delivery fees - no hidden costs
  </AlertDescription>
</Alert>
```

## Mobile Component Improvements

### Touch-Friendly Buttons
```tsx
// Larger touch targets for mobile
<Button variant="texas-primary" size="lg" className="min-h-[48px] px-6">
  <span className="mr-2">⚡</span>
  Enroll Now
</Button>
```

### Compact Card Layout
```tsx
<Card variant="plan-card" className="mx-4 mb-4">
  <CardHeader className="pb-4">
    <!-- Minimal header content -->
  </CardHeader>
  <CardContent className="space-y-4">
    <!-- Condensed content -->
  </CardContent>
  <CardFooter className="pt-4">
    <!-- Stacked buttons on mobile -->
    <div className="flex flex-col gap-3 w-full sm:flex-row">
      <Button variant="texas-primary" className="flex-1">Enroll</Button>
      <Button variant="texas-outline" className="flex-1">Compare</Button>
    </div>
  </CardFooter>
</Card>
```

## Accessibility Improvements

### Semantic Badges with Icons
```tsx
<Badge variant="success" className="flex items-center gap-1" aria-label="No deposit required">
  <span>💰</span>
  <span>No Deposit</span>
</Badge>
```

### Descriptive Buttons
```tsx
<Button 
  variant="texas-outline" 
  aria-label={`Compare ${plan.name} plan`}
  className="compare-btn"
>
  <span className="mr-2">📊</span>
  Compare
</Button>
```

## Animation and Interaction Patterns

### Card Hover Effects
```tsx
<Card 
  variant="plan-card" 
  className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
>
```

### Button Loading States
```tsx
<Button variant="texas-primary" disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Enrolling...
    </>
  ) : (
    <>
      <span className="mr-2">⚡</span>
      Enroll Now
    </>
  )}
</Button>
```

### Progressive Disclosure with Tabs
```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="pricing">Pricing</TabsTrigger>
    <TabsTrigger value="features">Features</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="space-y-4">
    <!-- Plan overview content -->
  </TabsContent>
  <!-- Additional tab content -->
</Tabs>
```

## Spacing and Layout Consistency

### Container Spacing
```tsx
// Use consistent spacing utilities
<div className="space-y-6">     <!-- Vertical spacing between sections -->
<div className="space-y-4">     <!-- Tighter vertical spacing -->
<div className="flex gap-3">    <!-- Horizontal spacing for inline elements -->
```

### Grid Layouts
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Responsive grid with consistent gaps -->
</div>
```

## Color System Integration

The components automatically use your existing Texas color palette:
- `texas-navy` - Primary brand color
- `texas-red` - Secondary brand color  
- `texas-gold` - Accent color
- `texas-cream` - Light background color
- `texas-blue` - Link color

## Implementation Priority

1. **High Impact, Low Effort**
   - Replace custom badges with Badge component
   - Use Button component for all CTAs
   - Add Separator components between sections

2. **Medium Impact, Medium Effort**
   - Restructure plan cards with Card components
   - Add Alert components for important information
   - Implement Progress components for loading states

3. **High Impact, High Effort**
   - Implement Tabs for complex interfaces
   - Add Tooltip components for enhanced UX
   - Create comprehensive mobile component variations

## Testing and Quality Assurance

### Visual Consistency Checklist
- [ ] All badges use consistent styling and spacing
- [ ] Buttons have uniform sizing and touch targets
- [ ] Cards have proper spacing and visual hierarchy
- [ ] Colors match the Texas brand guidelines
- [ ] Mobile components are touch-friendly

### Accessibility Checklist
- [ ] All interactive elements have proper aria-labels
- [ ] Color contrast meets WCAG guidelines
- [ ] Focus states are clearly visible
- [ ] Screen reader navigation is logical

## Performance Considerations

- Components are tree-shakeable - only imported components are bundled
- CSS-in-JS is optimized with `class-variance-authority`
- Consistent component usage reduces CSS bundle size
- Semantic HTML improves Core Web Vitals

## Next Steps

1. Start by implementing the improved PlanCard component (`PlanCardImproved.astro`)
2. Update mobile components using the improved version (`MobilePlanComparisonImproved.tsx`)  
3. Use the showcase example (`PlanComparisonShowcase.astro`) as a reference for design patterns
4. Gradually replace custom styling throughout the codebase
5. Test on mobile devices to ensure touch-friendly interactions

This systematic approach will significantly improve the design consistency and user experience of your electricity plan comparison platform while maintaining the Texas brand identity.