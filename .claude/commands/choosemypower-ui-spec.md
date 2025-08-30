# ChooseMyPower.org Complete UI Design Specification
## Shadcn/ui Design System Implementation
### Version 1.0 | August 2025

---

## 🎯 MANDATORY: USE SHADCN/UI MCP SERVER

### THIS IS NON-NEGOTIABLE
**Every developer MUST use the Shadcn/ui MCP server to maintain absolute consistency across all 5,800+ pages.**

### Setup Instructions (One-Time - Takes 10 seconds)

#### Option 1: Claude Code CLI
```bash
claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp
```

#### Option 2: Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://www.shadcn.io/api/mcp"]
    }
  }
}
```

### How to Use for ChooseMyPower.org

#### 1. Before implementing ANY component, check available options:
```
use shadcn to give me a list of all components available
```

#### 2. Get exact component specifications:
```
use shadcn and give me information about [component name] component
```

#### 3. Implement with Texas brand colors:
```
use shadcn and implement the button component with these specifications:
- Primary: bg-texas-navy (#002868) with white text
- Hover: bg-texas-navy/90 with white text (text must stay visible!)
- Focus: ring-2 ring-texas-navy ring-offset-2
```

#### 4. For complex components like plan cards:
```
use shadcn and help me create a card component for electricity plans that includes:
- Plan name and provider
- Rate display (XX.X¢ per kWh)
- Monthly estimate
- Select button with proper Texas navy styling
- Hover states that maintain text visibility
```

### Why This Matters

❌ **WITHOUT MCP**: Developers guess at implementations, create inconsistent components, break design system

✅ **WITH MCP**: Every component follows exact shadcn/ui patterns, maintains consistency, works perfectly

### Examples for ChooseMyPower.org

#### Get the correct form pattern:
```
use shadcn and show me how to implement a ZIP code search form with:
- Input with 5-digit validation
- Texas red submit button
- Proper error states
- Mobile responsive
```

#### Implement comparison table:
```
use shadcn and implement a data table for comparing electricity plans with:
- Sortable columns for rate, contract length, provider
- Row selection for comparison
- Mobile responsive design
- Texas brand colors for headers
```

#### Create loading states:
```
use shadcn and show me skeleton components for:
- Plan card loading state
- Table loading state
- Form submission loading
```

### Team Requirements

1. **NEVER** implement a component without checking MCP first
2. **ALWAYS** verify component props and variants through MCP
3. **DOCUMENT** any custom extensions in team notes
4. **SHARE** MCP queries that produce good patterns

### Common MCP Queries for Our Project

```bash
# Get all form components for enrollment flow
use shadcn to show me all form-related components

# Check dialog/modal patterns for plan details
use shadcn and give me information about dialog component with examples

# Find the right loading component
use shadcn to show me loading and skeleton components

# Get dropdown patterns for filters
use shadcn and show me select and dropdown menu components
```

---

## 🚨 CRITICAL: BUTTON HOVER STATE RULES

### ⚠️ THE PROBLEM
**Never allow text to become invisible on hover!** Common mistakes:
- ❌ White text on white background during hover
- ❌ Blue text on blue background during hover
- ❌ Any color combination where text disappears

### ✅ THE SOLUTION: MANDATORY HOVER RULES

```tsx
// RULE 1: Dark backgrounds → Light text (stays light on hover)
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white">
  Text stays visible
</Button>

// RULE 2: Light backgrounds → Dark text (stays dark on hover)
<Button className="bg-white text-texas-navy hover:bg-gray-50 hover:text-texas-navy">
  Text stays visible
</Button>

// RULE 3: Outline buttons → Invert colors on hover
<Button className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white">
  Text inverts properly
</Button>

// NEVER DO THIS:
// ❌ <Button className="bg-blue-600 text-white hover:bg-white">Missing hover:text-color!</Button>
// ❌ <Button className="bg-white text-blue-600 hover:bg-blue-600">Missing hover:text-white!</Button>
```

---

## ⛔ CRITICAL: BUTTON ICON RULES

### ONE ICON MAXIMUM PER BUTTON

**NEVER put icons on both sides of button text. This is terrible UI design.**

```tsx
// ❌ WRONG - Two icons cluttering the button
<Button>
  <ChevronRight className="mr-2 h-4 w-4" />
  Next Step
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>

// ❌ WRONG - Icons fighting for attention
<Button>
  <Zap className="mr-2 h-4 w-4" />
  Compare Plans
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>

// ✅ CORRECT - Single icon before text
<Button>
  <Zap className="mr-2 h-4 w-4" />
  Compare Plans
</Button>

// ✅ CORRECT - Single icon after text
<Button>
  Next Step
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>

// ✅ CORRECT - Icon only (with proper aria-label)
<Button size="icon" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</Button>
```

### Icon Placement Guidelines

1. **Leading Icons** (before text) - Use for:
   - Actions that need emphasis: `<Search /> Search Plans`
   - Status indicators: `<Check /> Completed`
   - Object indicators: `<FileText /> View Contract`

2. **Trailing Icons** (after text) - Use for:
   - Directional movement: `Next <ChevronRight />`
   - External links: `Learn More <ExternalLink />`
   - Dropdowns: `Select Plan <ChevronDown />`

3. **Icon-Only Buttons** - Use for:
   - Mobile menu toggles
   - Close/dismiss actions
   - Compact spaces (always include aria-label)

### Button Icon Examples for ChooseMyPower.org

```tsx
// Primary CTA - Icon emphasizes action
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white">
  <Zap className="mr-2 h-4 w-4" />
  Compare Plans Now
</Button>

// Navigation - Icon shows direction
<Button variant="outline">
  Continue
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>

// Form submission - Icon reinforces action
<Button type="submit">
  <Search className="mr-2 h-4 w-4" />
  Find Plans
</Button>

// Mobile menu - Icon only
<Button variant="ghost" size="icon" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</Button>

// NEVER DO THIS:
// ❌ <Button><Zap className="mr-2" /> Compare <ArrowRight className="ml-2" /></Button>
// ❌ <Button><Search className="mr-2" /> Search Plans <Search className="ml-2" /></Button>
```

---

### Button State Matrix (MUST FOLLOW)

| Initial State | Hover State | Text Visibility |
|--------------|-------------|-----------------|
| `bg-texas-navy text-white` | `hover:bg-texas-navy/90 hover:text-white` | ✅ White on dark blue |
| `bg-texas-red text-white` | `hover:bg-texas-red/90 hover:text-white` | ✅ White on dark red |
| `bg-texas-gold text-white` | `hover:bg-texas-gold/90 hover:text-white` | ✅ White on dark gold |
| `bg-white text-texas-navy` | `hover:bg-gray-50 hover:text-texas-navy` | ✅ Navy on light gray |
| `border-texas-navy text-texas-navy` | `hover:bg-texas-navy hover:text-white` | ✅ Inverted colors |
| `bg-green-600 text-white` | `hover:bg-green-700 hover:text-white` | ✅ White on darker green |

---

## 1. DESIGN SYSTEM FOUNDATION

### 1.1 Shadcn/ui Configuration
```typescript
// components.json (MUST use these exact settings)
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 1.2 Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Texas Brand Colors (MUST use these exact values)
        'texas-navy': '#002868',
        'texas-red': '#BE0B31',
        'texas-gold': '#F59E0B',
        'texas-cream': '#F8EDD3',
        
        // Semantic Colors
        'success': '#059669',
        'warning': '#D97706',
        'error': '#DC2626',
        'info': '#0891B2',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 1.3 Global CSS Variables
```css
/* src/styles/globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  :root {
    /* Texas Brand Colors in HSL */
    --texas-navy: 212 100% 20%;
    --texas-red: 346 86% 40%;
    --texas-gold: 38 94% 50%;
    --texas-cream: 39 82% 91%;
    
    /* Shadcn/ui System Colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 212 100% 20%;
    --primary-foreground: 0 0% 100%;
    --secondary: 346 86% 40%;
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 38 94% 50%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 212 100% 20%;
    --radius: 0.5rem;
  }
  
  .dark {
    /* Dark mode colors if needed */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

/* Custom utility classes */
@layer utilities {
  .animate-in {
    animation: fade-in 0.3s ease-out;
  }
  
  .slide-in {
    animation: slide-up 0.3s ease-out;
  }
}
```

---

## 2. COMPREHENSIVE COMPONENT SPECIFICATIONS

### 2.1 Button Component (Complete Specification)

```tsx
// EVERY button must follow these patterns exactly

// Primary CTA Button (Homepage, Plan Cards)
<Button 
  className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white 
             focus:ring-2 focus:ring-texas-navy focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
  size="lg"
>
  Compare Plans Now
</Button>

// Secondary Button (Less Important Actions)
<Button 
  className="bg-texas-red text-white hover:bg-texas-red/90 hover:text-white
             focus:ring-2 focus:ring-texas-red focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
>
  View Details
</Button>

// Accent Button (Special Offers, Highlights)
<Button 
  className="bg-texas-gold text-white hover:bg-texas-gold/90 hover:text-white
             focus:ring-2 focus:ring-texas-gold focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
>
  Limited Time Offer
</Button>

// Outline Button (Secondary Actions)
<Button 
  variant="outline"
  className="border-texas-navy text-texas-navy 
             hover:bg-texas-navy hover:text-white hover:border-texas-navy
             focus:ring-2 focus:ring-texas-navy focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
>
  Learn More
</Button>

// Ghost Button (Tertiary Actions)
<Button 
  variant="ghost"
  className="text-texas-navy hover:bg-texas-navy/10 hover:text-texas-navy
             focus:ring-2 focus:ring-texas-navy focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
>
  Cancel
</Button>

// Icon Button (Mobile Menu, Close, etc.)
<Button
  variant="ghost"
  size="icon"
  className="text-texas-navy hover:bg-texas-navy/10 hover:text-texas-navy
             focus:ring-2 focus:ring-texas-navy focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200"
  aria-label="Open menu"
>
  <Menu className="h-5 w-5" />
</Button>

// Loading State Button
<Button disabled className="bg-texas-navy text-white opacity-50 cursor-not-allowed">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Success State Button
<Button className="bg-green-600 text-white hover:bg-green-700 hover:text-white
                   focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                   transition-all duration-200">
  <Check className="mr-2 h-4 w-4" />
  Plan Selected
</Button>
```

### 2.2 Card Component (Electricity Plans)

```tsx
// Standard Plan Card
<Card className="hover:shadow-lg transition-all duration-200 cursor-pointer
                 border border-gray-200 hover:border-texas-navy/20">
  <CardHeader className="p-6 pb-4">
    <div className="flex justify-between items-start">
      <div>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {planName}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 mt-1">
          {providerName}
        </CardDescription>
      </div>
      <Badge className={cn(
        "text-xs font-medium",
        planType === 'fixed' && "bg-green-100 text-green-800 border-green-200",
        planType === 'variable' && "bg-orange-100 text-orange-800 border-orange-200",
        planType === 'indexed' && "bg-blue-100 text-blue-800 border-blue-200"
      )}>
        {planTypeLabel}
      </Badge>
    </div>
  </CardHeader>
  
  <CardContent className="p-6 pt-0 space-y-4">
    {/* Rate Display */}
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-green-600">{rate}¢</span>
      <span className="text-sm text-gray-500">per kWh</span>
    </div>
    
    {/* Monthly Estimate */}
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-sm text-gray-600">Estimated Monthly Bill</p>
      <p className="text-xl font-bold text-gray-900">${monthlyEstimate}</p>
      <p className="text-xs text-gray-500">Based on {usage} kWh/month</p>
    </div>
    
    {/* Key Features */}
    <div className="flex flex-wrap gap-2">
      {features.map(feature => (
        <Badge key={feature} variant="secondary" className="text-xs">
          {feature}
        </Badge>
      ))}
    </div>
    
    {/* Rating */}
    {rating && (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-4 w-4",
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
      </div>
    )}
  </CardContent>
  
  <CardFooter className="p-6 pt-0">
    <Button 
      className="w-full bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white
                 focus:ring-2 focus:ring-texas-navy focus:ring-offset-2
                 transition-all duration-200"
    >
      Select This Plan
    </Button>
  </CardFooter>
</Card>

// Popular/Featured Plan Card
<Card className="relative hover:shadow-xl transition-all duration-200 cursor-pointer
                 border-2 border-texas-gold ring-2 ring-texas-gold/20">
  {/* Popular Badge */}
  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
    <Badge className="bg-texas-gold text-white px-4 py-1">
      Most Popular
    </Badge>
  </div>
  {/* Rest of card content same as above */}
</Card>
```

### 2.3 Form Components (Complete Set)

```tsx
// ZIP Code Search (Homepage Hero)
<form className="w-full max-w-lg mx-auto">
  <Label htmlFor="zip-code" className="sr-only">
    Enter your ZIP code
  </Label>
  <div className="flex gap-3">
    <Input
      id="zip-code"
      type="text"
      inputMode="numeric"
      pattern="[0-9]{5}"
      maxLength={5}
      placeholder="Enter ZIP code"
      className="h-12 text-base flex-1
                 border-gray-300 focus:border-texas-navy focus:ring-texas-navy
                 invalid:border-red-500 invalid:focus:ring-red-500"
      aria-label="ZIP code"
      aria-describedby="zip-error"
      required
    />
    <Button 
      type="submit"
      size="lg"
      className="bg-texas-red text-white hover:bg-texas-red/90 hover:text-white
                 focus:ring-2 focus:ring-texas-red focus:ring-offset-2
                 transition-all duration-200"
    >
      Find Plans
    </Button>
  </div>
  <p id="zip-error" className="mt-2 text-sm text-red-600 hidden">
    Please enter a valid 5-digit ZIP code
  </p>
</form>

// Usage Calculator Form
<div className="space-y-4">
  <div>
    <Label htmlFor="home-size" className="text-sm font-medium text-gray-700">
      Home Size
    </Label>
    <Select>
      <SelectTrigger id="home-size" className="w-full mt-1">
        <SelectValue placeholder="Select your home size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apartment">Apartment (500-1000 sq ft)</SelectItem>
        <SelectItem value="small">Small Home (1000-1500 sq ft)</SelectItem>
        <SelectItem value="medium">Medium Home (1500-2500 sq ft)</SelectItem>
        <SelectItem value="large">Large Home (2500+ sq ft)</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div>
    <Label htmlFor="usage-slider" className="text-sm font-medium text-gray-700">
      Monthly Usage: <span className="font-bold">{usage} kWh</span>
    </Label>
    <Slider
      id="usage-slider"
      min={500}
      max={3000}
      step={100}
      value={[usage]}
      onValueChange={([value]) => setUsage(value)}
      className="mt-2"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>500 kWh</span>
      <span>3000 kWh</span>
    </div>
  </div>
</div>

// Filter Controls
<div className="space-y-4 p-4 bg-gray-50 rounded-lg">
  <h3 className="font-semibold text-gray-900">Filter Plans</h3>
  
  {/* Contract Length */}
  <div>
    <Label className="text-sm font-medium text-gray-700">Contract Length</Label>
    <RadioGroup defaultValue="all" className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="all" id="all-lengths" />
        <Label htmlFor="all-lengths" className="text-sm text-gray-600 cursor-pointer">
          All Lengths
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="6" id="6-months" />
        <Label htmlFor="6-months" className="text-sm text-gray-600 cursor-pointer">
          6 Months
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="12" id="12-months" />
        <Label htmlFor="12-months" className="text-sm text-gray-600 cursor-pointer">
          12 Months
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="24" id="24-months" />
        <Label htmlFor="24-months" className="text-sm text-gray-600 cursor-pointer">
          24 Months
        </Label>
      </div>
    </RadioGroup>
  </div>
  
  {/* Plan Type */}
  <div>
    <Label className="text-sm font-medium text-gray-700">Plan Type</Label>
    <div className="mt-2 space-y-2">
      <Checkbox id="fixed-rate" className="data-[state=checked]:bg-texas-navy" />
      <Label htmlFor="fixed-rate" className="text-sm text-gray-600 cursor-pointer ml-2">
        Fixed Rate
      </Label>
    </div>
    {/* More checkboxes... */}
  </div>
  
  {/* Price Range */}
  <div>
    <Label className="text-sm font-medium text-gray-700">
      Price Range: {priceRange[0]}¢ - {priceRange[1]}¢ per kWh
    </Label>
    <Slider
      min={8}
      max={20}
      step={0.1}
      value={priceRange}
      onValueChange={setPriceRange}
      className="mt-2"
    />
  </div>
</div>
```

### 2.4 Navigation Components

```tsx
// Desktop Navigation Bar
<header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <Zap className="h-8 w-8 text-texas-gold" />
        <span className="text-xl font-bold text-texas-navy">ChooseMyPower</span>
      </Link>
      
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link 
          href="/compare" 
          className="text-gray-700 hover:text-texas-navy transition-colors duration-200"
        >
          Compare Plans
        </Link>
        <Link 
          href="/providers" 
          className="text-gray-700 hover:text-texas-navy transition-colors duration-200"
        >
          Providers
        </Link>
        <Link 
          href="/resources" 
          className="text-gray-700 hover:text-texas-navy transition-colors duration-200"
        >
          Resources
        </Link>
        <Button 
          className="bg-texas-red text-white hover:bg-texas-red/90 hover:text-white
                     focus:ring-2 focus:ring-texas-red focus:ring-offset-2
                     transition-all duration-200"
        >
          Get Started
        </Button>
      </div>
      
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-texas-navy hover:bg-texas-navy/10 hover:text-texas-navy"
        aria-label="Open menu"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  </nav>
</header>

// Mobile Navigation Menu
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetContent side="right" className="w-[300px] sm:w-[350px]">
    <SheetHeader>
      <SheetTitle className="text-texas-navy">Menu</SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col space-y-4 mt-8">
      <Link 
        href="/compare" 
        className="text-lg text-gray-700 hover:text-texas-navy transition-colors py-2"
        onClick={() => setMobileMenuOpen(false)}
      >
        Compare Plans
      </Link>
      {/* More links... */}
      <Button 
        className="bg-texas-red text-white hover:bg-texas-red/90 hover:text-white
                   focus:ring-2 focus:ring-texas-red focus:ring-offset-2
                   transition-all duration-200 w-full mt-4"
      >
        Get Started
      </Button>
    </nav>
  </SheetContent>
</Sheet>

// Breadcrumbs
<nav aria-label="Breadcrumb" className="text-sm">
  <ol className="flex items-center space-x-2">
    <li>
      <Link href="/" className="text-gray-500 hover:text-texas-navy transition-colors">
        Home
      </Link>
    </li>
    <ChevronRight className="h-4 w-4 text-gray-400" />
    <li>
      <Link href="/texas" className="text-gray-500 hover:text-texas-navy transition-colors">
        Texas
      </Link>
    </li>
    <ChevronRight className="h-4 w-4 text-gray-400" />
    <li>
      <span className="text-gray-900 font-medium" aria-current="page">
        {cityName}
      </span>
    </li>
  </ol>
</nav>
```

### 2.5 Table Component (Plan Comparison)

```tsx
// Comparison Table
<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow className="bg-gray-50">
        <TableHead className="font-semibold text-texas-navy">Plan Details</TableHead>
        <TableHead className="font-semibold text-texas-navy text-center">Plan A</TableHead>
        <TableHead className="font-semibold text-texas-navy text-center">Plan B</TableHead>
        <TableHead className="font-semibold text-texas-navy text-center">Plan C</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">Rate per kWh</TableCell>
        <TableCell className="text-center">
          <span className="text-lg font-bold text-green-600">12.5¢</span>
        </TableCell>
        <TableCell className="text-center">
          <span className="text-lg font-bold text-green-600">13.2¢</span>
        </TableCell>
        <TableCell className="text-center">
          <span className="text-lg font-bold text-green-600">11.9¢</span>
        </TableCell>
      </TableRow>
      <TableRow className="bg-gray-50">
        <TableCell className="font-medium">Contract Length</TableCell>
        <TableCell className="text-center">12 months</TableCell>
        <TableCell className="text-center">24 months</TableCell>
        <TableCell className="text-center">6 months</TableCell>
      </TableRow>
      {/* More rows... */}
    </TableBody>
  </Table>
</div>
```

### 2.6 Modal/Dialog Components

```tsx
// Plan Details Modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-texas-navy">
        Plan Details
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        Complete information about this electricity plan
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Plan details content */}
    </div>
    
    <DialogFooter>
      <Button 
        variant="outline"
        onClick={() => setIsOpen(false)}
        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-700"
      >
        Close
      </Button>
      <Button 
        className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white
                   focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
      >
        Select This Plan
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.7 Toast/Notification Components

```tsx
// Success Toast
toast({
  title: "Plan Selected!",
  description: "You've successfully selected the TXU Energy Saver plan.",
  className: "border-green-200 bg-green-50",
  action: (
    <ToastAction 
      altText="View details"
      className="text-green-600 hover:text-green-700"
    >
      View Details
    </ToastAction>
  ),
})

// Error Toast
toast({
  variant: "destructive",
  title: "Error",
  description: "Please enter a valid ZIP code to continue.",
})

// Info Toast
toast({
  title: "Tip",
  description: "You can save an average of $200/year by switching plans.",
  className: "border-blue-200 bg-blue-50",
})
```

### 2.8 Loading States

```tsx
// Full Page Loading
<div className="flex items-center justify-center min-h-[400px]">
  <div className="text-center">
    <Loader2 className="h-8 w-8 animate-spin text-texas-navy mx-auto" />
    <p className="mt-2 text-sm text-gray-600">Loading plans...</p>
  </div>
</div>

// Card Skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
    <Skeleton className="h-4 w-[150px] mt-2" />
  </CardHeader>
  <CardContent className="space-y-4">
    <Skeleton className="h-10 w-[100px]" />
    <Skeleton className="h-20 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-[80px]" />
      <Skeleton className="h-6 w-[80px]" />
    </div>
  </CardContent>
  <CardFooter>
    <Skeleton className="h-10 w-full" />
  </CardFooter>
</Card>

// Inline Loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Calculating...
</Button>
```

### 2.9 Empty States

```tsx
// No Results
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 text-gray-400">
    <Search className="h-full w-full" />
  </div>
  <h3 className="mt-4 text-lg font-semibold text-gray-900">No plans found</h3>
  <p className="mt-2 text-sm text-gray-600">
    Try adjusting your filters or search criteria
  </p>
  <Button 
    className="mt-4 bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    onClick={resetFilters}
  >
    Clear Filters
  </Button>
</div>

// Error State
<Alert className="border-red-200 bg-red-50">
  <AlertCircle className="h-4 w-4 text-red-600" />
  <AlertTitle className="text-red-800">Unable to load plans</AlertTitle>
  <AlertDescription className="text-red-700">
    Please check your connection and try again.
  </AlertDescription>
</Alert>
```

---

## 3. LAYOUT SPECIFICATIONS

### 3.1 Page Structure

```tsx
// Standard Page Layout
<div className="min-h-screen flex flex-col">
  {/* Header */}
  <Header />
  
  {/* Main Content */}
  <main className="flex-1">
    {/* Hero Section */}
    <section className="bg-gradient-to-b from-texas-navy to-texas-navy/90 text-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Hero content */}
      </div>
    </section>
    
    {/* Content Sections */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section content */}
      </div>
    </section>
  </main>
  
  {/* Footer */}
  <Footer />
</div>

// Two Column Layout (Filters + Results)
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  <div className="grid lg:grid-cols-4 gap-6">
    {/* Sidebar Filters */}
    <aside className="lg:col-span-1">
      <div className="sticky top-20 space-y-4">
        {/* Filter components */}
      </div>
    </aside>
    
    {/* Main Results */}
    <main className="lg:col-span-3">
      <div className="space-y-4">
        {/* Result cards */}
      </div>
    </main>
  </div>
</div>
```

### 3.2 Grid Systems

```tsx
// Plan Grid (Responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {plans.map(plan => <PlanCard key={plan.id} {...plan} />)}
</div>

// Feature Grid (4 columns on desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
  {features.map(feature => <FeatureCard key={feature.id} {...feature} />)}
</div>

// Provider Logo Grid
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  {providers.map(provider => (
    <div key={provider.id} className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
      <img 
        src={provider.logo} 
        alt={provider.name}
        className="h-12 w-auto object-contain"
      />
    </div>
  ))}
</div>
```

### 3.3 Spacing Rules

```tsx
// Section Spacing
const sectionSpacing = {
  hero: "py-24 md:py-32",
  standard: "py-16 md:py-24",
  compact: "py-12 md:py-16",
  footer: "py-12"
}

// Content Spacing
const contentSpacing = {
  cardGrid: "gap-6",
  formElements: "space-y-4",
  textBlocks: "space-y-6",
  inlineElements: "space-x-4"
}

// Component Internal Spacing
const componentSpacing = {
  card: "p-6",
  button: {
    sm: "px-3 py-1.5",
    default: "px-4 py-2",
    lg: "px-8 py-3"
  },
  input: "px-3 py-2",
  badge: "px-2.5 py-0.5"
}
```

---

## 4. TYPOGRAPHY RULES

### 4.1 Type Scale

```tsx
// Display (Hero Headlines)
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-texas-navy leading-tight">
  Find the Best Electricity Plans in {city}
</h1>

// Page Title
<h1 className="text-3xl md:text-4xl font-bold text-gray-900">
  Compare Electricity Plans
</h1>

// Section Title
<h2 className="text-2xl md:text-3xl font-bold text-gray-900">
  Why Choose ChooseMyPower?
</h2>

// Subsection Title
<h3 className="text-xl md:text-2xl font-semibold text-gray-800">
  Plan Features
</h3>

// Card Title
<h4 className="text-lg font-semibold text-gray-900">
  TXU Energy Saver 12
</h4>

// Body Large
<p className="text-lg text-gray-700 leading-relaxed">
  We help Texas residents find...
</p>

// Body Default
<p className="text-base text-gray-600 leading-relaxed">
  Compare plans from top providers...
</p>

// Body Small
<p className="text-sm text-gray-500">
  *Based on average usage of 1000 kWh/month
</p>

// Caption
<span className="text-xs text-gray-400">
  Last updated: 5 minutes ago
</span>
```

### 4.2 Font Weights

```tsx
const fontWeights = {
  normal: "font-normal",   // 400 - Body text
  medium: "font-medium",   // 500 - Emphasis
  semibold: "font-semibold", // 600 - Subheadings
  bold: "font-bold",       // 700 - Headings
  extrabold: "font-extrabold" // 800 - Display
}

// Usage
<h1 className="font-bold">       // Main headings
<h3 className="font-semibold">   // Subheadings
<p className="font-normal">      // Body text
<strong className="font-medium"> // Inline emphasis
```

---

## 5. COLOR USAGE GUIDE

### 5.1 Background Colors

```tsx
// Page Backgrounds
className="bg-white"              // Primary background
className="bg-gray-50"            // Alternate sections
className="bg-texas-cream/10"     // Feature sections
className="bg-texas-navy"         // Dark hero sections

// Component Backgrounds
className="bg-white"              // Cards, modals
className="bg-gray-50"            // Input fields, wells
className="bg-blue-50"            // Info boxes
className="bg-green-50"           // Success states
className="bg-red-50"             // Error states
className="bg-texas-gold/10"      // Highlight boxes
```

### 5.2 Text Colors

```tsx
// Primary Text
className="text-gray-900"         // Headings
className="text-gray-700"         // Body text
className="text-gray-600"         // Secondary text
className="text-gray-500"         // Muted text
className="text-gray-400"         // Disabled text

// Brand Text
className="text-texas-navy"       // Brand emphasis
className="text-texas-red"        // Warnings, urgency
className="text-texas-gold"       // Highlights

// Semantic Text
className="text-green-600"        // Success, savings
className="text-red-600"          // Errors
className="text-blue-600"         // Links, info
```

### 5.3 Border Colors

```tsx
// Standard Borders
className="border-gray-200"       // Default borders
className="border-gray-300"       // Emphasized borders
className="border-gray-100"       // Subtle borders

// Interactive Borders
className="border-texas-navy"     // Focus states
className="border-texas-red"      // Error states
className="border-green-500"      // Success states

// Special Borders
className="border-texas-gold"     // Featured items
className="border-transparent"    // No visible border
```

---

## 6. RESPONSIVE DESIGN

### 6.1 Breakpoint Usage

```tsx
// Mobile First Approach
className="text-base md:text-lg lg:text-xl"     // Progressive enhancement
className="px-4 sm:px-6 lg:px-8"                // Container padding
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // Grid layouts

// Hide/Show Elements
className="hidden md:block"       // Hide on mobile
className="md:hidden"             // Show only on mobile
className="hidden lg:flex"       // Hide until large screens
```

### 6.2 Mobile Optimizations

```tsx
// Touch Targets (minimum 44x44px)
<Button className="min-h-[44px] min-w-[44px]">
  
// Mobile-Optimized Forms
<form className="space-y-4">
  <Input className="h-12 text-base" /> {/* Larger inputs */}
  <Button className="w-full h-12">     {/* Full-width buttons */}
</form>

// Mobile Navigation
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
  <div className="grid grid-cols-4 gap-1 p-2">
    {/* Mobile nav items */}
  </div>
</nav>

// Swipeable Cards (mobile)
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-4 pb-4">
    {plans.map(plan => (
      <div key={plan.id} className="w-[280px] flex-shrink-0">
        <PlanCard {...plan} />
      </div>
    ))}
  </div>
</div>
```

---

## 7. INTERACTION STATES

### 7.1 Hover States (WITH PROPER TEXT CONTRAST)

```tsx
// Link Hover
className="text-gray-700 hover:text-texas-navy transition-colors duration-200"

// Card Hover
className="hover:shadow-lg hover:border-texas-navy/20 transition-all duration-200"

// Button Hover (ALWAYS specify hover text color!)
className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"

// Icon Button Hover
className="text-gray-600 hover:text-texas-navy hover:bg-gray-100 rounded-lg p-2"
```

### 7.2 Focus States

```tsx
// Input Focus
className="focus:border-texas-navy focus:ring-2 focus:ring-texas-navy/20"

// Button Focus
className="focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"

// Link Focus
className="focus:outline-none focus:ring-2 focus:ring-texas-navy focus:ring-offset-2 rounded"
```

### 7.3 Active States

```tsx
// Button Active
className="active:scale-95 transition-transform duration-150"

// Tab Active
className="border-b-2 border-texas-navy text-texas-navy font-semibold"

// Navigation Active
className="bg-texas-navy/10 text-texas-navy font-medium"
```

### 7.4 Disabled States

```tsx
// Disabled Button
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Disabled Input
className="disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"

// Disabled Card
className="opacity-60 pointer-events-none"
```

---

## 8. ANIMATIONS & TRANSITIONS

### 8.1 Standard Transitions

```tsx
// Color Transitions
className="transition-colors duration-200"

// All Properties
className="transition-all duration-200"

// Transform
className="transition-transform duration-150"

// Opacity
className="transition-opacity duration-300"
```

### 8.2 Animation Classes

```tsx
// Fade In
className="animate-in fade-in duration-300"

// Slide Up
className="animate-in slide-in-from-bottom-4 duration-300"

// Spinner
className="animate-spin"

// Pulse
className="animate-pulse"
```

### 8.3 Custom Animations

```css
/* Gentle float animation for hero elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Shimmer effect for loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 9. ICONOGRAPHY

### 9.1 Icon Usage

```tsx
import { 
  // Navigation
  Menu, X, ChevronDown, ChevronRight, ChevronLeft, ArrowRight,
  
  // Actions
  Search, Filter, Download, Share2, Copy, ExternalLink,
  
  // Features
  Zap, Home, Building2, DollarSign, Shield, Award,
  
  // Status
  Check, X as Close, AlertCircle, Info, HelpCircle,
  
  // UI Elements
  Star, Heart, Bookmark, Calendar, Clock, MapPin,
  
  // Loading
  Loader2
} from "lucide-react"

// Icon Sizes
const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8"
}

// Usage Example
<Zap className="h-5 w-5 text-texas-gold" />
<Check className="h-4 w-4 text-green-600" />
<AlertCircle className="h-5 w-5 text-red-600" />
```

### 9.2 Icon + Text Combinations

```tsx
// Button with Icon
<Button>
  <Zap className="mr-2 h-4 w-4" />
  Compare Plans
</Button>

// Feature List
<div className="flex items-start space-x-3">
  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
  <span className="text-gray-700">No hidden fees</span>
</div>

// Info Box
<div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
  <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
  <p className="text-sm text-blue-900">
    Prices shown include all fees and charges
  </p>
</div>
```

---

## 10. SPECIAL COMPONENTS

### 10.1 Trust Badges

```tsx
// Security Badge
<div className="flex items-center space-x-2 text-sm text-gray-600">
  <Shield className="h-4 w-4 text-green-600" />
  <span>SSL Secured</span>
</div>

// Rating Badge
<div className="flex items-center space-x-2">
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
  <span className="text-sm font-medium">4.8/5</span>
  <span className="text-sm text-gray-500">(2,451 reviews)</span>
</div>

// Partner Badge
<div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
  <img src="/puct-logo.png" alt="PUCT Certified" className="h-12" />
</div>
```

### 10.2 Pricing Display

```tsx
// Large Price Display
<div className="text-center">
  <div className="flex items-start justify-center">
    <span className="text-2xl font-medium text-gray-600 mt-2">$</span>
    <span className="text-6xl font-bold text-green-600">89</span>
    <div className="ml-2 mt-2">
      <span className="text-2xl font-medium text-gray-600">.99</span>
      <span className="block text-sm text-gray-500">/month</span>
    </div>
  </div>
  <p className="text-sm text-gray-500 mt-2">*Based on 1000 kWh usage</p>
</div>

// Inline Price
<span className="text-lg font-bold text-green-600">
  12.5¢ <span className="text-sm font-normal text-gray-500">per kWh</span>
</span>
```

### 10.3 Progress Indicators

```tsx
// Step Progress
<div className="flex items-center justify-between">
  {[1, 2, 3].map((step, index) => (
    <div key={step} className="flex items-center">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
        currentStep >= step 
          ? "bg-texas-navy text-white" 
          : "bg-gray-200 text-gray-600"
      )}>
        {step}
      </div>
      {index < 2 && (
        <div className={cn(
          "w-20 h-1 mx-2",
          currentStep > step ? "bg-texas-navy" : "bg-gray-200"
        )} />
      )}
    </div>
  ))}
</div>

// Loading Bar
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-texas-navy h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 10.4 Footer Component

```tsx
<footer className="bg-gray-900 text-white">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Company Info */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-8 w-8 text-texas-gold" />
          <span className="text-xl font-bold">ChooseMyPower</span>
        </div>
        <p className="text-gray-400 text-sm">
          Helping Texans find the best electricity plans since 2010.
        </p>
      </div>
      
      {/* Quick Links */}
      <div>
        <h3 className="font-semibold mb-4">Quick Links</h3>
        <ul className="space-y-2">
          <li>
            <a href="/compare" className="text-gray-400 hover:text-white transition-colors">
              Compare Plans
            </a>
          </li>
          {/* More links */}
        </ul>
      </div>
      
      {/* Resources */}
      <div>
        <h3 className="font-semibold mb-4">Resources</h3>
        <ul className="space-y-2">
          <li>
            <a href="/guide" className="text-gray-400 hover:text-white transition-colors">
              Buyer's Guide
            </a>
          </li>
          {/* More links */}
        </ul>
      </div>
      
      {/* Contact */}
      <div>
        <h3 className="font-semibold mb-4">Contact</h3>
        <p className="text-gray-400 text-sm">
          Questions? Call us at<br />
          <a href="tel:1-800-POWER-TX" className="text-white font-semibold">
            1-800-POWER-TX
          </a>
        </p>
      </div>
    </div>
    
    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
      <p>&copy; 2025 ChooseMyPower.org. All rights reserved.</p>
    </div>
  </div>
</footer>
```

---

## 11. DATA VISUALIZATION COMPONENTS

### 11.1 Usage Charts

```tsx
// Line Chart for Usage Trends
<Card>
  <CardHeader>
    <CardTitle>Your Monthly Usage</CardTitle>
    <CardDescription>kWh consumption over the last 12 months</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={usageData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="usage" 
            stroke="#002868" 
            strokeWidth={2}
            dot={{ fill: '#002868', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

// Bar Chart for Plan Comparison
<Card>
  <CardHeader>
    <CardTitle>Plan Cost Comparison</CardTitle>
    <CardDescription>Estimated monthly costs based on your usage</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="planName" className="text-xs" angle={-45} textAnchor="end" />
          <YAxis className="text-xs" />
          <Tooltip 
            formatter={(value) => `${value}`}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Bar dataKey="cost" fill="#F59E0B" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

// Savings Calculator Display
<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center">
  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
    <DollarSign className="h-8 w-8 text-white" />
  </div>
  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Potential Annual Savings</p>
  <p className="text-5xl font-bold text-green-600 mt-2">$347</p>
  <p className="text-sm text-gray-600 mt-2">Compared to your current plan</p>
  <Button 
    className="mt-6 bg-green-600 text-white hover:bg-green-700 hover:text-white"
    size="lg"
  >
    Start Saving Now
  </Button>
</div>

// Pie Chart for Energy Sources
<Card>
  <CardHeader>
    <CardTitle>Energy Source Breakdown</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={energySourceData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {energySourceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

### 11.2 Metrics Dashboard

```tsx
// Key Metrics Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Current Rate</p>
          <p className="text-2xl font-bold text-gray-900">15.2¢</p>
          <p className="text-xs text-gray-500">per kWh</p>
        </div>
        <Zap className="h-8 w-8 text-texas-gold opacity-20" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Avg Monthly Bill</p>
          <p className="text-2xl font-bold text-gray-900">$142</p>
          <p className="text-xs text-red-600">↑ 12% vs last year</p>
        </div>
        <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Contract Ends</p>
          <p className="text-2xl font-bold text-gray-900">45</p>
          <p className="text-xs text-gray-500">days remaining</p>
        </div>
        <Calendar className="h-8 w-8 text-blue-600 opacity-20" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Available Plans</p>
          <p className="text-2xl font-bold text-gray-900">127</p>
          <p className="text-xs text-green-600">23 under 12¢/kWh</p>
        </div>
        <FileText className="h-8 w-8 text-purple-600 opacity-20" />
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 12. TRUST & SOCIAL PROOF COMPONENTS

### 12.1 Customer Testimonials

```tsx
// Testimonial Card
<Card className="bg-gray-50 border-0">
  <CardContent className="p-6">
    <div className="flex gap-1 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-700 italic mb-4">
      "ChooseMyPower made switching so easy! I'm saving $50 every month and the whole process took less than 10 minutes."
    </p>
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src="/testimonials/sarah-m.jpg" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-gray-900">Sarah Martinez</p>
        <p className="text-sm text-gray-500">Austin, TX</p>
      </div>
    </div>
  </CardContent>
</Card>

// Testimonial Carousel
<div className="relative overflow-hidden">
  <div className="flex transition-transform duration-500 ease-out" 
       style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
    {testimonials.map((testimonial, index) => (
      <div key={index} className="w-full flex-shrink-0 px-4">
        <TestimonialCard {...testimonial} />
      </div>
    ))}
  </div>
  <button 
    onClick={prevTestimonial}
    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    aria-label="Previous testimonial"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>
  <button 
    onClick={nextTestimonial}
    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    aria-label="Next testimonial"
  >
    <ChevronRight className="h-5 w-5" />
  </button>
</div>
```

### 12.2 Trust Badges & Certifications

```tsx
// Trust Badge Bar
<div className="bg-gray-50 border-y border-gray-200">
  <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
      {/* BBB Accreditation */}
      <div className="flex flex-col items-center text-center">
        <img src="/badges/bbb-a-plus.svg" alt="BBB A+ Rating" className="h-16 mb-2" />
        <p className="text-sm text-gray-600">A+ Rated</p>
      </div>
      
      {/* PUCT Certification */}
      <div className="flex flex-col items-center text-center">
        <img src="/badges/puct-certified.svg" alt="PUCT Certified" className="h-16 mb-2" />
        <p className="text-sm text-gray-600">PUCT Certified</p>
      </div>
      
      {/* Customer Count */}
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl font-bold text-texas-navy">50,000+</div>
        <p className="text-sm text-gray-600">Texans Served</p>
      </div>
      
      {/* Years in Business */}
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl font-bold text-texas-navy">15</div>
        <p className="text-sm text-gray-600">Years of Service</p>
      </div>
    </div>
  </div>
</div>

// Security & Privacy Badges
<div className="flex flex-wrap items-center gap-4 justify-center text-sm text-gray-600">
  <div className="flex items-center gap-2">
    <Shield className="h-4 w-4 text-green-600" />
    <span>SSL Secured</span>
  </div>
  <div className="flex items-center gap-2">
    <Lock className="h-4 w-4 text-green-600" />
    <span>Your Data is Safe</span>
  </div>
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <span>No Hidden Fees</span>
  </div>
</div>
```

### 12.3 Provider Ratings Display

```tsx
// Provider Rating Card
<Card className="hover:shadow-lg transition-all duration-200">
  <CardContent className="p-6">
    <div className="flex items-start justify-between mb-4">
      <img 
        src="/providers/txu-energy.svg" 
        alt="TXU Energy" 
        className="h-12 w-auto"
      />
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Verified Provider
      </Badge>
    </div>
    
    <div className="space-y-3">
      {/* Overall Rating */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-5 w-5",
                  i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="font-semibold">4.2</span>
          <span className="text-sm text-gray-500">(1,847 reviews)</span>
        </div>
      </div>
      
      {/* Rating Breakdown */}
      <div className="space-y-2">
        <RatingBar label="Customer Service" rating={4.5} />
        <RatingBar label="Billing Accuracy" rating={4.3} />
        <RatingBar label="Plan Variety" rating={4.0} />
        <RatingBar label="Value for Money" rating={3.9} />
      </div>
      
      <Button variant="outline" className="w-full mt-4">
        Read All Reviews
      </Button>
    </div>
  </CardContent>
</Card>

// Rating Bar Component
const RatingBar = ({ label, rating }: { label: string; rating: number }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-600 w-32">{label}</span>
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div 
        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
        style={{ width: `${(rating / 5) * 100}%` }}
      />
    </div>
    <span className="text-sm font-medium w-8">{rating}</span>
  </div>
);
```

---

## 13. MULTI-STEP ENROLLMENT FLOW

### 13.1 Step Progress Indicator

```tsx
// Enrollment Steps Component
<div className="mb-8">
  <div className="flex items-center justify-between relative">
    {/* Progress Line */}
    <div className="absolute left-0 top-5 h-0.5 w-full bg-gray-200">
      <div 
        className="h-full bg-texas-navy transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      />
    </div>
    
    {/* Step Circles */}
    {steps.map((step, index) => {
      const stepNumber = index + 1;
      const isActive = stepNumber === currentStep;
      const isCompleted = stepNumber < currentStep;
      
      return (
        <div key={step.id} className="relative z-10 flex flex-col items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200",
            isCompleted && "bg-texas-navy text-white",
            isActive && "bg-texas-navy text-white ring-4 ring-texas-navy/20",
            !isCompleted && !isActive && "bg-gray-200 text-gray-600"
          )}>
            {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
          </div>
          <span className={cn(
            "text-xs mt-2 text-center hidden sm:block",
            isActive ? "text-texas-navy font-medium" : "text-gray-500"
          )}>
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
</div>

// Mobile Step Indicator
<div className="sm:hidden mb-6">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-medium text-gray-900">Step {currentStep} of {totalSteps}</h3>
    <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-texas-navy transition-all duration-500"
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    />
  </div>
  <p className="text-sm text-gray-600 mt-2">{steps[currentStep - 1].label}</p>
</div>
```

### 13.2 Enrollment Form Steps

```tsx
// Step 1: Plan Confirmation
<Card>
  <CardHeader>
    <CardTitle>Confirm Your Plan Selection</CardTitle>
    <CardDescription>Review your chosen electricity plan details</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-600">Plan Name:</span>
        <span className="font-medium">{selectedPlan.name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Rate:</span>
        <span className="font-medium text-green-600">{selectedPlan.rate}¢/kWh</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Contract Length:</span>
        <span className="font-medium">{selectedPlan.term} months</span>
      </div>
      <Separator className="my-2" />
      <div className="flex justify-between text-lg">
        <span className="font-medium">Estimated Monthly Bill:</span>
        <span className="font-bold">${selectedPlan.estimatedBill}</span>
      </div>
    </div>
    
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        This estimate is based on {usage} kWh monthly usage. Your actual bill may vary.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>

// Step 2: Service Address
<Card>
  <CardHeader>
    <CardTitle>Service Address</CardTitle>
    <CardDescription>Where will you be receiving electricity service?</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="service-address">Street Address</Label>
        <Input 
          id="service-address"
          placeholder="123 Main Street"
          className="mt-1"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="apt">Apt/Unit (Optional)</Label>
          <Input 
            id="apt"
            placeholder="Apt 4B"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="service-zip">ZIP Code</Label>
          <Input 
            id="service-zip"
            placeholder="75001"
            pattern="[0-9]{5}"
            maxLength={5}
            className="mt-1"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="move-in-date">Move-in Date</Label>
        <Input 
          id="move-in-date"
          type="date"
          className="mt-1"
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
    </div>
    
    <div className="flex items-start space-x-2">
      <Checkbox id="same-billing" />
      <Label htmlFor="same-billing" className="text-sm text-gray-600 cursor-pointer">
        Billing address is the same as service address
      </Label>
    </div>
  </CardContent>
</Card>

// Step 3: Personal Information
<Card>
  <CardHeader>
    <CardTitle>Personal Information</CardTitle>
    <CardDescription>We need this information to set up your account</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="first-name">First Name</Label>
        <Input 
          id="first-name"
          placeholder="John"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="last-name">Last Name</Label>
        <Input 
          id="last-name"
          placeholder="Doe"
          className="mt-1"
          required
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor="email">Email Address</Label>
      <Input 
        id="email"
        type="email"
        placeholder="john.doe@example.com"
        className="mt-1"
        required
      />
      <p className="text-xs text-gray-500 mt-1">
        We'll send your contract and account information here
      </p>
    </div>
    
    <div>
      <Label htmlFor="phone">Phone Number</Label>
      <Input 
        id="phone"
        type="tel"
        placeholder="(555) 123-4567"
        className="mt-1"
        required
      />
    </div>
    
    <div>
      <Label htmlFor="ssn">Last 4 digits of SSN</Label>
      <Input 
        id="ssn"
        type="text"
        pattern="[0-9]{4}"
        maxLength={4}
        placeholder="1234"
        className="mt-1 w-32"
        required
      />
      <p className="text-xs text-gray-500 mt-1">
        Required for identity verification
      </p>
    </div>
  </CardContent>
</Card>

// Step 4: Payment Method
<Card>
  <CardHeader>
    <CardTitle>Payment Method</CardTitle>
    <CardDescription>Choose how you'd like to pay your electricity bills</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <RadioGroup defaultValue="autopay" className="space-y-3">
      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
        <RadioGroupItem value="autopay" id="autopay" />
        <div className="flex-1">
          <Label htmlFor="autopay" className="cursor-pointer">
            <div className="font-medium">AutoPay (Recommended)</div>
            <div className="text-sm text-gray-600">
              Save $1/month and never miss a payment
            </div>
          </Label>
        </div>
        <Badge className="bg-green-100 text-green-800">Save $12/year</Badge>
      </div>
      
      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
        <RadioGroupItem value="manual" id="manual" />
        <div className="flex-1">
          <Label htmlFor="manual" className="cursor-pointer">
            <div className="font-medium">Manual Payment</div>
            <div className="text-sm text-gray-600">
              Pay each bill individually when due
            </div>
          </Label>
        </div>
      </div>
    </RadioGroup>
    
    <Separator />
    
    <div className="space-y-4">
      <h4 className="font-medium">Bank Account Information</h4>
      
      <div>
        <Label htmlFor="account-type">Account Type</Label>
        <Select>
          <SelectTrigger id="account-type" className="mt-1">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checking">Checking</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="routing">Routing Number</Label>
          <Input 
            id="routing"
            placeholder="123456789"
            pattern="[0-9]{9}"
            maxLength={9}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="account">Account Number</Label>
          <Input 
            id="account"
            type="password"
            placeholder="••••••••••"
            className="mt-1"
            required
          />
        </div>
      </div>
    </div>
    
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertDescription>
        Your payment information is encrypted and secure. We never store your full account details.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>

// Step 5: Review & Submit
<Card>
  <CardHeader>
    <CardTitle>Review & Submit</CardTitle>
    <CardDescription>Please review all information before submitting</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Summary sections */}
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Plan Details</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          {/* Plan summary */}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Service Information</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          {/* Service address summary */}
        </div>
      </div>
    </div>
    
    <Separator />
    
    <div className="space-y-3">
      <div className="flex items-start space-x-2">
        <Checkbox id="terms" required />
        <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
          I agree to the <Link href="/terms" className="text-texas-navy underline">Terms of Service</Link> and <Link href="/privacy" className="text-texas-navy underline">Privacy Policy</Link>
        </Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="contract" required />
        <Label htmlFor="contract" className="text-sm text-gray-600 cursor-pointer">
          I understand this is a {selectedPlan.term}-month contract with {selectedPlan.provider}
        </Label>
      </div>
    </div>
    
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Early Termination Fee</AlertTitle>
      <AlertDescription className="text-orange-700">
        This plan has a ${selectedPlan.etf} early termination fee if you cancel before the contract ends.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>
```

### 13.3 Form Navigation

```tsx
// Step Navigation Buttons
<div className="flex justify-between mt-8">
  <Button
    variant="outline"
    onClick={handlePrevious}
    disabled={currentStep === 1}
    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-700"
  >
    <ChevronLeft className="mr-2 h-4 w-4" />
    Previous
  </Button>
  
  {currentStep < totalSteps ? (
    <Button
      onClick={handleNext}
      disabled={!isStepValid}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      Next
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  ) : (
    <Button
      onClick={handleSubmit}
      disabled={!isFormValid || isSubmitting}
      className="bg-green-600 text-white hover:bg-green-700 hover:text-white"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Complete Enrollment
          <Check className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )}
</div>
```

---

## 14. ADVANCED FORM PATTERNS

### 14.1 Address Autocomplete

```tsx
// Address Autocomplete Component
<div className="relative">
  <Label htmlFor="address-search">Start typing your address</Label>
  <div className="relative mt-1">
    <Input
      id="address-search"
      value={addressQuery}
      onChange={(e) => setAddressQuery(e.target.value)}
      placeholder="123 Main St, Austin, TX"
      className="pr-10"
    />
    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  </div>
  
  {suggestions.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          className={cn(
            "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
            index !== suggestions.length - 1 && "border-b border-gray-100"
          )}
          onClick={() => handleAddressSelect(suggestion)}
        >
          <div className="font-medium text-gray-900">{suggestion.streetAddress}</div>
          <div className="text-sm text-gray-500">{suggestion.city}, {suggestion.state} {suggestion.zip}</div>
        </button>
      ))}
    </div>
  )}
</div>

// Location Detection
<Button
  variant="outline"
  onClick={detectLocation}
  className="w-full border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white"
>
  <MapPin className="mr-2 h-4 w-4" />
  Use My Current Location
</Button>
```

### 14.2 File Upload (Bill Analysis)

```tsx
// Drag & Drop File Upload
<div
  className={cn(
    "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
    isDragging ? "border-texas-navy bg-texas-navy/5" : "border-gray-300",
    file && "border-green-500 bg-green-50"
  )}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <input
    type="file"
    id="bill-upload"
    className="hidden"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={handleFileSelect}
  />
  
  {!file ? (
    <>
      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="font-medium text-gray-900 mb-2">Upload Your Electricity Bill</h3>
      <p className="text-sm text-gray-600 mb-4">
        Drag and drop your bill here, or click to browse
      </p>
      <Button
        variant="outline"
        onClick={() => document.getElementById('bill-upload')?.click()}
        className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white"
      >
        Choose File
      </Button>
      <p className="text-xs text-gray-500 mt-4">
        Supported formats: PDF, JPG, PNG (max 10MB)
      </p>
    </>
  ) : (
    <>
      <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h3 className="font-medium text-gray-900 mb-2">{file.name}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeBill}
          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
        >
          <Search className="mr-2 h-4 w-4" />
          Analyze Bill
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={removeFile}
          className="text-red-600 hover:bg-red-50 hover:text-red-600"
        >
          <X className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </>
  )}
</div>

// Upload Progress
{isUploading && (
  <div className="mt-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">Uploading...</span>
      <span className="text-gray-900 font-medium">{uploadProgress}%</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-texas-navy transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  </div>
)}
```

### 14.3 Dynamic Form Fields

```tsx
// Usage Pattern Selection
<div className="space-y-4">
  <Label>How do you use electricity?</Label>
  
  <RadioGroup value={usagePattern} onValueChange={setUsagePattern}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <label
        htmlFor="pattern-low"
        className={cn(
          "relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all",
          usagePattern === 'low' 
            ? "border-texas-navy bg-texas-navy/5" 
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <RadioGroupItem value="low" id="pattern-low" className="sr-only" />
        <Home className="h-8 w-8 text-texas-navy mb-2" />
        <span className="font-medium">Light User</span>
        <span className="text-sm text-gray-600 text-center mt-1">
          Small apartment, minimal AC use
        </span>
        <span className="text-xs text-gray-500 mt-2">~500-750 kWh/mo</span>
      </label>
      
      <label
        htmlFor="pattern-medium"
        className={cn(
          "relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all",
          usagePattern === 'medium' 
            ? "border-texas-navy bg-texas-navy/5" 
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <RadioGroupItem value="medium" id="pattern-medium" className="sr-only" />
        <Home className="h-8 w-8 text-texas-navy mb-2" />
        <span className="font-medium">Average User</span>
        <span className="text-sm text-gray-600 text-center mt-1">
          2-3 bedroom home, regular AC
        </span>
        <span className="text-xs text-gray-500 mt-2">~1000-1500 kWh/mo</span>
      </label>
      
      <label
        htmlFor="pattern-high"
        className={cn(
          "relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all",
          usagePattern === 'high' 
            ? "border-texas-navy bg-texas-navy/5" 
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <RadioGroupItem value="high" id="pattern-high" className="sr-only" />
        <Building2 className="h-8 w-8 text-texas-navy mb-2" />
        <span className="font-medium">Heavy User</span>
        <span className="text-sm text-gray-600 text-center mt-1">
          Large home, pool, heavy AC use
        </span>
        <span className="text-xs text-gray-500 mt-2">2000+ kWh/mo</span>
      </label>
    </div>
  </RadioGroup>
  
  {/* Dynamic fields based on selection */}
  {usagePattern === 'high' && (
    <Alert className="mt-4">
      <Zap className="h-4 w-4" />
      <AlertDescription>
        As a heavy user, you might benefit from our tiered rate plans. We'll highlight these options for you.
      </AlertDescription>
    </Alert>
  )}
</div>

// Conditional Fields
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Switch 
      id="solar" 
      checked={hasSolar}
      onCheckedChange={setHasSolar}
    />
    <Label htmlFor="solar" className="cursor-pointer">
      I have solar panels
    </Label>
  </div>
  
  {hasSolar && (
    <div className="ml-7 space-y-4 animate-in slide-in-from-top-2">
      <div>
        <Label htmlFor="solar-size">Solar System Size (kW)</Label>
        <Input 
          id="solar-size"
          type="number"
          placeholder="5.0"
          step="0.1"
          className="mt-1 w-32"
        />
      </div>
      
      <div>
        <Label htmlFor="solar-provider">Solar Installer</Label>
        <Input 
          id="solar-provider"
          placeholder="e.g., Tesla, Sunrun"
          className="mt-1"
        />
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          We'll show you plans with the best solar buyback rates
        </AlertDescription>
      </Alert>
    </div>
  )}
</div>
```

---

## 15. NOTIFICATION SYSTEM

### 15.1 Toast Notifications

```tsx
// Success Toast
toast({
  title: "Plan Selected Successfully!",
  description: "You've chosen the TXU Energy Saver 12 plan.",
  action: (
    <ToastAction altText="View details">View Details</ToastAction>
  ),
})

// Error Toast
toast({
  variant: "destructive",
  title: "Uh oh! Something went wrong.",
  description: "Please check your internet connection and try again.",
})

// Info Toast with Custom Styling
toast({
  className: "border-blue-200 bg-blue-50",
  title: (
    <div className="flex items-center gap-2">
      <Info className="h-4 w-4 text-blue-600" />
      <span>Price Drop Alert</span>
    </div>
  ),
  description: "3 plans in your area just dropped below 12¢/kWh",
  action: (
    <ToastAction 
      altText="View plans" 
      className="text-blue-600 hover:text-blue-700"
    >
      View Plans
    </ToastAction>
  ),
})

// Loading Toast
const toastId = toast({
  title: "Analyzing your usage...",
  description: (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>This may take a moment</span>
    </div>
  ),
  duration: Infinity,
})

// Update toast when complete
toast({
  id: toastId,
  title: "Analysis Complete!",
  description: "We found 23 plans that match your usage pattern.",
  action: (
    <ToastAction altText="View results">View Results</ToastAction>
  ),
})
```

### 15.2 In-App Notifications

```tsx
// Notification Center Icon
<Button variant="ghost" size="icon" className="relative">
  <Bell className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</Button>

// Notification Dropdown
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {/* Badge */}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-80" align="end">
    <DropdownMenuLabel className="flex justify-between items-center">
      <span>Notifications</span>
      <Button variant="ghost" size="sm" className="text-xs">
        Mark all as read
      </Button>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    {/* Notification Items */}
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.map(notification => (
        <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
          <div className="flex gap-3 w-full">
            <div className={cn(
              "flex-shrink-0 w-2 h-2 rounded-full mt-2",
              !notification.read && "bg-blue-500"
            )} />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-gray-500">{notification.message}</p>
              <p className="text-xs text-gray-400">{notification.time}</p>
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </div>
    
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-center">
      <Link href="/notifications" className="text-sm text-texas-navy">
        View All Notifications
      </Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Notification Permission Request
<Alert className="border-blue-200 bg-blue-50">
  <Bell className="h-4 w-4 text-blue-600" />
  <AlertTitle className="text-blue-900">Stay Updated on Price Drops</AlertTitle>
  <AlertDescription className="text-blue-700">
    Get instant notifications when electricity rates drop in your area.
  </AlertDescription>
  <div className="mt-3 flex gap-2">
    <Button 
      size="sm"
      onClick={requestNotificationPermission}
      className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
    >
      Enable Notifications
    </Button>
    <Button 
      size="sm"
      variant="ghost"
      onClick={dismissNotificationPrompt}
      className="text-blue-600 hover:text-blue-700"
    >
      Not Now
    </Button>
  </div>
</Alert>
```

### 15.3 Email Preference Center

```tsx
// Email Preferences Form
<Card>
  <CardHeader>
    <CardTitle>Email Preferences</CardTitle>
    <CardDescription>
      Choose what updates you'd like to receive
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Preference Categories */}
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <Checkbox 
          id="price-alerts"
          checked={preferences.priceAlerts}
          onCheckedChange={(checked) => updatePreference('priceAlerts', checked)}
        />
        <div className="flex-1">
          <Label htmlFor="price-alerts" className="cursor-pointer">
            <div className="font-medium">Price Drop Alerts</div>
            <div className="text-sm text-gray-600">
              Get notified when rates drop below your target price
            </div>
          </Label>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <Checkbox 
          id="contract-reminders"
          checked={preferences.contractReminders}
          onCheckedChange={(checked) => updatePreference('contractReminders', checked)}
        />
        <div className="flex-1">
          <Label htmlFor="contract-reminders" className="cursor-pointer">
            <div className="font-medium">Contract Expiration Reminders</div>
            <div className="text-sm text-gray-600">
              Receive alerts 60, 30, and 14 days before your contract ends
            </div>
          </Label>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <Checkbox 
          id="usage-insights"
          checked={preferences.usageInsights}
          onCheckedChange={(checked) => updatePreference('usageInsights', checked)}
        />
        <div className="flex-1">
          <Label htmlFor="usage-insights" className="cursor-pointer">
            <div className="font-medium">Monthly Usage Insights</div>
            <div className="text-sm text-gray-600">
              Receive personalized tips to reduce your electricity usage
            </div>
          </Label>
        </div>
      </div>
    </div>
    
    <Separator />
    
    {/* Frequency Settings */}
    <div>
      <Label htmlFor="frequency" className="text-sm font-medium">
        Email Frequency
      </Label>
      <Select value={preferences.frequency} onValueChange={updateFrequency}>
        <SelectTrigger id="frequency" className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="immediate">Immediate</SelectItem>
          <SelectItem value="daily">Daily Digest</SelectItem>
          <SelectItem value="weekly">Weekly Summary</SelectItem>
          <SelectItem value="monthly">Monthly Roundup</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </CardContent>
  <CardFooter>
    <Button 
      onClick={savePreferences}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      Save Preferences
    </Button>
  </CardFooter>
</Card>
```

---

## 16. ERROR STATES & EMPTY STATES

### 16.1 Network Error States

```tsx
// Connection Error
<div className="min-h-[400px] flex items-center justify-center p-8">
  <div className="text-center max-w-md">
    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
      <WifiOff className="h-full w-full" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Connection Lost
    </h3>
    <p className="text-gray-600 mb-6">
      We're having trouble connecting to our servers. Please check your internet connection and try again.
    </p>
    <Button 
      onClick={retry}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
</div>

// API Error
<Alert className="border-red-200 bg-red-50">
  <AlertCircle className="h-4 w-4 text-red-600" />
  <AlertTitle className="text-red-800">Unable to Load Plans</AlertTitle>
  <AlertDescription className="text-red-700">
    We're experiencing technical difficulties. Please try again in a few moments.
    <br />
    <span className="text-xs">Error Code: {errorCode}</span>
  </AlertDescription>
  <Button 
    size="sm"
    variant="outline"
    className="mt-3 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
    onClick={retry}
  >
    Retry
  </Button>
</Alert>

// Timeout Error
<Card className="border-orange-200 bg-orange-50">
  <CardContent className="p-6 text-center">
    <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
    <h3 className="font-semibold text-gray-900 mb-2">Request Timed Out</h3>
    <p className="text-gray-600 mb-4">
      This is taking longer than expected. The server might be busy.
    </p>
    <div className="flex gap-2 justify-center">
      <Button 
        variant="outline"
        onClick={cancel}
        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-700"
      >
        Cancel
      </Button>
      <Button 
        onClick={retry}
        className="bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
      >
        Keep Waiting
      </Button>
    </div>
  </CardContent>
</Card>
```

### 16.2 Empty States

```tsx
// No Search Results
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
    <SearchX className="h-full w-full" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No Plans Found
  </h3>
  <p className="text-gray-600 max-w-md mx-auto mb-6">
    We couldn't find any plans matching your criteria. Try adjusting your filters or search terms.
  </p>
  <div className="flex gap-2 justify-center">
    <Button 
      variant="outline"
      onClick={clearFilters}
      className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white"
    >
      Clear Filters
    </Button>
    <Button 
      onClick={showAllPlans}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      View All Plans
    </Button>
  </div>
</div>

// No Saved Plans
<Card className="border-dashed">
  <CardContent className="p-12 text-center">
    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <h3 className="font-semibold text-gray-900 mb-2">No Saved Plans Yet</h3>
    <p className="text-gray-600 max-w-sm mx-auto mb-6">
      Save plans you're interested in to compare them side by side later.
    </p>
    <Button 
      onClick={browsePlans}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      Browse Plans
    </Button>
  </CardContent>
</Card>

// No Notifications
<div className="p-8 text-center">
  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
  <h3 className="font-medium text-gray-900 mb-2">You're All Caught Up!</h3>
  <p className="text-sm text-gray-600">
    No new notifications at this time.
  </p>
</div>
```

---

## 17. MOBILE-SPECIFIC PATTERNS

### 17.1 Mobile Navigation

```tsx
// Bottom Navigation Bar (Mobile)
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
  <div className="grid grid-cols-4 h-16">
    <Link 
      href="/"
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs",
        pathname === '/' ? "text-texas-navy" : "text-gray-500"
      )}
    >
      <Home className="h-5 w-5" />
      <span>Home</span>
    </Link>
    
    <Link 
      href="/compare"
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs",
        pathname === '/compare' ? "text-texas-navy" : "text-gray-500"
      )}
    >
      <Search className="h-5 w-5" />
      <span>Search</span>
    </Link>
    
    <Link 
      href="/saved"
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs relative",
        pathname === '/saved' ? "text-texas-navy" : "text-gray-500"
      )}
    >
      <Bookmark className="h-5 w-5" />
      <span>Saved</span>
      {savedCount > 0 && (
        <span className="absolute -top-1 right-4 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {savedCount}
        </span>
      )}
    </Link>
    
    <Link 
      href="/account"
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs",
        pathname === '/account' ? "text-texas-navy" : "text-gray-500"
      )}
    >
      <User className="h-5 w-5" />
      <span>Account</span>
    </Link>
  </div>
</nav>

// Mobile Drawer Menu
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetContent side="left" className="w-[280px] p-0">
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-texas-gold" />
          <span className="font-bold text-lg">ChooseMyPower</span>
        </div>
      </div>
      
      {/* Menu Items */}
      <nav className="flex-1 py-4">
        <Link 
          href="/compare"
          className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-texas-navy transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Search className="h-5 w-5" />
          <span>Compare Plans</span>
        </Link>
        
        <Link 
          href="/providers"
          className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-texas-navy transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Building2 className="h-5 w-5" />
          <span>Providers</span>
        </Link>
        
        <Separator className="my-2" />
        
        <Link 
          href="/help"
          className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-texas-navy transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <HelpCircle className="h-5 w-5" />
          <span>Help & Support</span>
        </Link>
      </nav>
      
      {/* Footer */}
      <div className="p-6 border-t">
        <Button 
          className="w-full bg-texas-red text-white hover:bg-texas-red/90 hover:text-white"
          onClick={() => {
            setMobileMenuOpen(false)
            router.push('/enroll')
          }}
        >
          Get Started
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

### 17.2 Mobile-Optimized Components

```tsx
// Mobile Filter Sheet
<Sheet open={filterOpen} onOpenChange={setFilterOpen}>
  <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
    <SheetHeader className="pb-4">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
      <SheetTitle>Filter Plans</SheetTitle>
    </SheetHeader>
    
    <div className="overflow-y-auto h-[calc(100%-120px)] pb-4">
      {/* Filter content */}
      <div className="space-y-6">
        {/* Contract Length */}
        <div>
          <h3 className="font-medium mb-3">Contract Length</h3>
          {/* Filter options */}
        </div>
        
        {/* Price Range */}
        <div>
          <h3 className="font-medium mb-3">Price Range</h3>
          {/* Slider */}
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            clearFilters()
            setFilterOpen(false)
          }}
        >
          Clear All
        </Button>
        <Button 
          className="flex-1 bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
          onClick={() => setFilterOpen(false)}
        >
          Show {resultCount} Plans
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>

// Swipeable Plan Cards
<div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
  <div className="flex gap-4 pb-4">
    {plans.map((plan, index) => (
      <div 
        key={plan.id} 
        className="w-[85vw] max-w-[320px] flex-shrink-0 first:ml-0 last:mr-4"
      >
        <Card className="h-full">
          {/* Plan card content optimized for mobile */}
        </Card>
      </div>
    ))}
  </div>
  
  {/* Scroll Indicators */}
  <div className="flex justify-center gap-1 mt-2">
    {plans.map((_, index) => (
      <div 
        key={index}
        className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          currentIndex === index 
            ? "w-8 bg-texas-navy" 
            : "w-1.5 bg-gray-300"
        )}
      />
    ))}
  </div>
</div>

// Mobile Comparison View
<div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 md:hidden">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium">
      {selectedPlans.length} plans selected
    </span>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={clearSelection}
      className="text-red-600 hover:text-red-700"
    >
      Clear
    </Button>
  </div>
  <Button 
    className="w-full bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    onClick={openComparisonModal}
    disabled={selectedPlans.length < 2}
  >
    Compare Selected Plans
  </Button>
</div>
```

### 17.3 Touch Gestures

```tsx
// Pull to Refresh
const [refreshing, setRefreshing] = useState(false)

<div 
  className="min-h-screen overscroll-y-contain"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {refreshing && (
    <div className="absolute top-0 left-0 right-0 flex justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-texas-navy" />
    </div>
  )}
  
  {/* Content */}
</div>

// Swipe Actions on Cards
<div 
  className="relative overflow-hidden"
  onTouchStart={handleSwipeStart}
  onTouchMove={handleSwipeMove}
  onTouchEnd={handleSwipeEnd}
>
  <div 
    className="transition-transform duration-200"
    style={{ transform: `translateX(${swipeOffset}px)` }}
  >
    <Card>{/* Card content */}</Card>
  </div>
  
  {/* Swipe Actions */}
  <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-green-500">
    <Bookmark className="h-5 w-5 text-white" />
  </div>
</div>
```

---

## 18. PERFORMANCE MONITORING UI

### 18.1 Development Mode Indicators

```tsx
// Core Web Vitals Monitor (Dev Only)
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-20 left-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50">
    <div className="space-y-1">
      <div className="flex justify-between gap-4">
        <span>LCP:</span>
        <span className={cn(
          lcp < 2500 ? "text-green-400" : lcp < 4000 ? "text-yellow-400" : "text-red-400"
        )}>
          {lcp}ms
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span>FID:</span>
        <span className={cn(
          fid < 100 ? "text-green-400" : fid < 300 ? "text-yellow-400" : "text-red-400"
        )}>
          {fid}ms
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span>CLS:</span>
        <span className={cn(
          cls < 0.1 ? "text-green-400" : cls < 0.25 ? "text-yellow-400" : "text-red-400"
        )}>
          {cls.toFixed(3)}
        </span>
      </div>
    </div>
  </div>
)}

// Bundle Size Indicator
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs p-2 rounded">
    <div>Bundle: {bundleSize}KB</div>
    <div>Gzip: {gzipSize}KB</div>
  </div>
)}
```

### 18.2 Loading Performance

```tsx
// Route Loading Indicator
<div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
  <div 
    className="h-full bg-texas-navy transition-all duration-300"
    style={{ 
      width: `${loadingProgress}%`,
      transition: loadingProgress === 100 ? 'none' : undefined
    }}
  />
</div>

// Lazy Load Boundaries
<div className="relative min-h-[400px]">
  {!isVisible ? (
    <div className="absolute inset-0 flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  ) : (
    <LazyComponent />
  )}
</div>

// Image Loading States
<div className="relative aspect-video bg-gray-100">
  {!imageLoaded && (
    <div className="absolute inset-0 animate-pulse bg-gray-200" />
  )}
  <img 
    src={imageSrc}
    alt={alt}
    onLoad={() => setImageLoaded(true)}
    className={cn(
      "w-full h-full object-cover transition-opacity duration-300",
      imageLoaded ? "opacity-100" : "opacity-0"
    )}
  />
</div>
```

---

## 19. CONTENT TEMPLATES

### 19.1 Blog/Article Layout

```tsx
// Article Page Template
<article className="max-w-4xl mx-auto px-4 py-12">
  {/* Article Header */}
  <header className="mb-8">
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link href="/blog" className="hover:text-texas-navy">Blog</Link>
      <ChevronRight className="h-4 w-4" />
      <span>Energy Savings</span>
    </div>
    
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      {article.title}
    </h1>
    
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.initials}</AvatarFallback>
        </Avatar>
        <span>{author.name}</span>
      </div>
      <span>•</span>
      <time dateTime={article.publishedAt}>
        {formatDate(article.publishedAt)}
      </time>
      <span>•</span>
      <span>{article.readTime} min read</span>
    </div>
  </header>
  
  {/* Featured Image */}
  <div className="aspect-video rounded-xl overflow-hidden mb-8">
    <img 
      src={article.featuredImage} 
      alt={article.imageAlt}
      className="w-full h-full object-cover"
    />
  </div>
  
  {/* Article Content */}
  <div className="prose prose-lg max-w-none">
    {article.content}
  </div>
  
  {/* Author Bio */}
  <div className="mt-12 p-6 bg-gray-50 rounded-xl">
    <div className="flex gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={author.avatar} />
        <AvatarFallback>{author.initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-semibold text-gray-900">{author.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{author.bio}</p>
      </div>
    </div>
  </div>
  
  {/* Related Articles */}
  <section className="mt-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
    <div className="grid md:grid-cols-3 gap-6">
      {relatedArticles.map(article => (
        <ArticleCard key={article.id} {...article} />
      ))}
    </div>
  </section>
</article>
```

### 19.2 FAQ Accordion

```tsx
// FAQ Section
<div className="max-w-3xl mx-auto">
  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
    Frequently Asked Questions
  </h2>
  
  <Accordion type="single" collapsible className="space-y-4">
    {faqs.map((faq, index) => (
      <AccordionItem 
        key={index} 
        value={`item-${index}`}
        className="border rounded-lg px-6"
      >
        <AccordionTrigger className="text-left hover:no-underline py-4">
          <span className="font-medium text-gray-900">{faq.question}</span>
        </AccordionTrigger>
        <AccordionContent className="text-gray-600 pb-4">
          {faq.answer}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
  
  <div className="mt-8 text-center">
    <p className="text-gray-600 mb-4">Still have questions?</p>
    <Button 
      variant="outline"
      className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white"
    >
      Contact Support
    </Button>
  </div>
</div>
```

### 19.3 Glossary Terms

```tsx
// Glossary Term Component
<div className="group relative inline-block">
  <button className="border-b border-dotted border-gray-400 text-gray-900 hover:border-gray-600">
    {term}
  </button>
  
  <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
    <div className="font-medium mb-1">{term}</div>
    <div className="text-gray-300">{definition}</div>
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
      <div className="border-8 border-transparent border-t-gray-900" />
    </div>
  </div>
</div>

// Glossary Page
<div className="max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold text-gray-900 mb-8">Energy Terms Glossary</h1>
  
  {/* Alphabet Navigation */}
  <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b">
    {alphabet.map(letter => (
      <Button
        key={letter}
        variant="ghost"
        size="sm"
        className={cn(
          "w-10 h-10",
          hasTermsForLetter(letter) 
            ? "text-texas-navy hover:bg-texas-navy hover:text-white" 
            : "text-gray-300 cursor-not-allowed"
        )}
        onClick={() => scrollToLetter(letter)}
        disabled={!hasTermsForLetter(letter)}
      >
        {letter}
      </Button>
    ))}
  </div>
  
  {/* Terms List */}
  <div className="space-y-8">
    {groupedTerms.map(group => (
      <div key={group.letter} id={`letter-${group.letter}`}>
        <h2 className="text-2xl font-bold text-texas-navy mb-4">
          {group.letter}
        </h2>
        <dl className="space-y-4">
          {group.terms.map(term => (
            <div key={term.id} className="border-b pb-4">
              <dt className="font-semibold text-gray-900">{term.name}</dt>
              <dd className="mt-1 text-gray-600">{term.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    ))}
  </div>
</div>
```

---

## 20. ACCESSIBILITY ENHANCEMENTS

### 20.1 Skip Links & Landmarks

```tsx
// Skip Links
<div className="sr-only focus-within:not-sr-only">
  <a 
    href="#main" 
    className="absolute top-4 left-4 bg-texas-navy text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
  >
    Skip to main content
  </a>
  <a 
    href="#plans" 
    className="absolute top-4 left-4 bg-texas-navy text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
  >
    Skip to plans
  </a>
  <a 
    href="#footer" 
    className="absolute top-4 left-4 bg-texas-navy text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
  >
    Skip to footer
  </a>
</div>

// Semantic Landmarks
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation */}
  </nav>
</header>

<main role="main" id="main">
  <section aria-labelledby="plans-heading">
    <h2 id="plans-heading">Available Plans</h2>
    {/* Plans content */}
  </section>
</main>

<aside role="complementary" aria-label="Filters">
  {/* Sidebar filters */}
</aside>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

### 20.2 Live Regions

```tsx
// Search Results Announcement
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true" 
  className="sr-only"
>
  {isSearching ? (
    "Searching for electricity plans..."
  ) : (
    `Found ${resultCount} plans matching your criteria`
  )}
</div>

// Form Validation Announcements
<div 
  role="alert" 
  aria-live="assertive" 
  aria-atomic="true" 
  className="sr-only"
>
  {errors.length > 0 && (
    `There are ${errors.length} errors in the form. Please review and correct them.`
  )}
</div>

// Loading State Announcements
<div 
  role="status" 
  aria-live="polite" 
  aria-busy={isLoading}
  className={cn(
    "text-center py-8",
    isLoading ? "block" : "sr-only"
  )}
>
  <Loader2 className="h-8 w-8 animate-spin mx-auto" aria-hidden="true" />
  <span className="sr-only">Loading more plans...</span>
</div>
```

### 20.3 Keyboard Navigation Enhancements

```tsx
// Roving Tabindex for Lists
const PlanList = ({ plans, selectedIndex, onSelect }) => {
  return (
    <ul role="list" className="space-y-4">
      {plans.map((plan, index) => (
        <li 
          key={plan.id}
          role="listitem"
          tabIndex={index === selectedIndex ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && index < plans.length - 1) {
              onSelect(index + 1)
            } else if (e.key === 'ArrowUp' && index > 0) {
              onSelect(index - 1)
            } else if (e.key === 'Enter' || e.key === ' ') {
              selectPlan(plan)
            }
          }}
          className="focus:outline-none focus:ring-2 focus:ring-texas-navy focus:ring-offset-2 rounded-lg"
        >
          <PlanCard {...plan} />
        </li>
      ))}
    </ul>
  )
}

// Modal Focus Trap
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null)
  
  useFocusTrap(modalRef, isOpen)
  
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      const previouslyFocused = document.activeElement
      
      // Focus modal
      modalRef.current?.focus()
      
      // Restore focus on close
      return () => {
        previouslyFocused?.focus()
      }
    }
  }, [isOpen])
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={modalRef}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### 20.4 Screen Reader Enhancements

```tsx
// Descriptive Button Labels
<Button 
  aria-label={`Select ${plan.name} plan from ${plan.provider} at ${plan.rate} cents per kilowatt hour`}
  className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
>
  Select Plan
</Button>

// Table Accessibility
<Table>
  <caption className="sr-only">
    Comparison of electricity plans showing rates, contract length, and features
  </caption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Plan Name</TableHead>
      <TableHead scope="col">Rate (¢/kWh)</TableHead>
      <TableHead scope="col">Contract Length</TableHead>
      <TableHead scope="col">Monthly Estimate</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {plans.map(plan => (
      <TableRow key={plan.id}>
        <TableCell scope="row">{plan.name}</TableCell>
        <TableCell>{plan.rate}</TableCell>
        <TableCell>{plan.term} months</TableCell>
        <TableCell>${plan.estimate}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Form Field Descriptions
<div>
  <Label htmlFor="usage">Monthly Usage (kWh)</Label>
  <Input 
    id="usage"
    type="number"
    aria-describedby="usage-help"
    className="mt-1"
  />
  <p id="usage-help" className="text-sm text-gray-600 mt-1">
    Enter your average monthly electricity usage in kilowatt hours. 
    You can find this on your electricity bill.
  </p>
</div>
```

---

## 21. SEO & META COMPONENTS

### 21.1 Structured Data

```tsx
// Plan Structured Data
<script 
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": plan.name,
      "description": plan.description,
      "brand": {
        "@type": "Brand",
        "name": plan.provider
      },
      "offers": {
        "@type": "Offer",
        "price": plan.rate,
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": plan.rate,
          "priceCurrency": "USD",
          "unitText": "kWh"
        },
        "eligibleRegion": {
          "@type": "Place",
          "name": "Texas"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": plan.rating,
        "reviewCount": plan.reviewCount
      }
    })
  }}
/>

// Local Business Schema
<script 
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "ChooseMyPower",
      "description": "Texas electricity plan comparison and enrollment",
      "url": "https://choosemypower.org",
      "telephone": "1-800-POWER-TX",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Austin",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 30.2672,
        "longitude": -97.7431
      },
      "openingHours": "Mo-Fr 08:00-20:00",
      "sameAs": [
        "https://facebook.com/choosemypower",
        "https://twitter.com/choosemypower"
      ]
    })
  }}
/>
```

### 21.2 Meta Tags Component

```tsx
// SEO Meta Component
const SEOMeta = ({ 
  title, 
  description, 
  image, 
  url, 
  type = "website",
  publishedTime,
  modifiedTime,
  author
}) => {
  const fullTitle = `${title} | ChooseMyPower - Texas Electricity Plans`
  
  return (
    <Head>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="ChooseMyPower" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@choosemypower" />
      
      {/* Article Specific */}
      {type === "article" && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:modified_time" content={modifiedTime} />
          <meta property="article:author" content={author} />
        </>
      )}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Head>
  )
}
```

### 21.3 Dynamic Sitemap

```tsx
// Sitemap Component
export const generateSitemap = () => {
  const baseUrl = 'https://choosemypower.org'
  
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/compare', priority: 0.9, changefreq: 'daily' },
    { url: '/providers', priority: 0.8, changefreq: 'weekly' },
    { url: '/resources', priority: 0.7, changefreq: 'weekly' },
  ]
  
  const cityPages = cities.map(city => ({
    url: `/texas/${city.slug}`,
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: city.lastUpdated
  }))
  
  const providerPages = providers.map(provider => ({
    url: `/providers/${provider.slug}`,
    priority: 0.7,
    changefreq: 'weekly'
  }))
  
  return [...staticPages, ...cityPages, ...providerPages]
}

// Breadcrumb Schema
const BreadcrumbSchema = ({ items }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      })
    }}
  />
)
```

---

## 22. STATE MANAGEMENT PATTERNS

### 22.1 URL State Persistence

```tsx
// useURLState Hook
const useURLState = (defaultState) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const state = useMemo(() => {
    const params = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return { ...defaultState, ...params }
  }, [searchParams, defaultState])
  
  const setState = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === defaultState[key]) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    
    router.push(`?${newParams.toString()}`, { scroll: false })
  }, [searchParams, router, defaultState])
  
  return [state, setState]
}

// Usage in Filter Component
const PlanFilters = () => {
  const [filters, setFilters] = useURLState({
    contractLength: 'all',
    planType: 'all',
    minRate: '',
    maxRate: '',
    provider: 'all'
  })
  
  return (
    <div className="space-y-4">
      <Select
        value={filters.contractLength}
        onValueChange={(value) => setFilters({ contractLength: value })}
      >
        {/* Select options */}
      </Select>
    </div>
  )
}
```

### 22.2 Comparison Basket

```tsx
// useComparisonBasket Hook
const useComparisonBasket = () => {
  const [plans, setPlans] = useLocalStorage('comparison-plans', [])
  const maxPlans = 4
  
  const addPlan = useCallback((plan) => {
    setPlans(current => {
      if (current.find(p => p.id === plan.id)) {
        return current
      }
      if (current.length >= maxPlans) {
        toast({
          title: "Comparison limit reached",
          description: `You can compare up to ${maxPlans} plans at once`,
          variant: "destructive"
        })
        return current
      }
      return [...current, plan]
    })
  }, [setPlans, maxPlans])
  
  const removePlan = useCallback((planId) => {
    setPlans(current => current.filter(p => p.id !== planId))
  }, [setPlans])
  
  const clearBasket = useCallback(() => {
    setPlans([])
  }, [setPlans])
  
  return {
    plans,
    addPlan,
    removePlan,
    clearBasket,
    isFull: plans.length >= maxPlans,
    isEmpty: plans.length === 0,
    count: plans.length
  }
}

// Comparison Basket UI
const ComparisonBasket = () => {
  const { plans, removePlan, clearBasket, count } = useComparisonBasket()
  
  if (count === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Compare Plans ({count})</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearBasket}
          className="text-red-600 hover:text-red-700"
        >
          Clear All
        </Button>
      </div>
      
      <div className="space-y-2 mb-4">
        {plans.map(plan => (
          <div key={plan.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{plan.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removePlan(plan.id)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <Button 
        className="w-full bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
        disabled={count < 2}
      >
        Compare Selected
      </Button>
    </div>
  )
}
```

### 22.3 Form State Management

```tsx
// Multi-Step Form State
const useMultiStepForm = (steps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  
  const updateFormData = useCallback((stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }, [])
  
  const validateStep = useCallback((stepIndex) => {
    const step = steps[stepIndex]
    const stepErrors = step.validate?.(formData) || {}
    setErrors(prev => ({ ...prev, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }, [steps, formData])
  
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }, [currentStep, validateStep, steps.length])
  
  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])
  
  const goToStep = useCallback((index) => {
    if (index < currentStep || validateStep(currentStep)) {
      setCurrentStep(index)
    }
  }, [currentStep, validateStep])
  
  return {
    currentStep,
    formData,
    errors,
    touched,
    updateFormData,
    nextStep,
    previousStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    progress: ((currentStep + 1) / steps.length) * 100
  }
}
```

---

## 23. TESTING SPECIFICATIONS

### 23.1 Visual Regression Markers

```tsx
// Component Test IDs
<Card data-testid="plan-card" data-plan-id={plan.id}>
  <CardHeader>
    <CardTitle data-testid="plan-name">{plan.name}</CardTitle>
    <CardDescription data-testid="provider-name">{plan.provider}</CardDescription>
  </CardHeader>
  <CardContent>
    <div data-testid="plan-rate" className="text-3xl font-bold text-green-600">
      {plan.rate}¢
    </div>
    <Button 
      data-testid="select-plan-button"
      data-plan-id={plan.id}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      Select Plan
    </Button>
  </CardContent>
</Card>

// Form Test Attributes
<form data-testid="enrollment-form" onSubmit={handleSubmit}>
  <Input 
    data-testid="email-input"
    id="email"
    type="email"
    required
    aria-required="true"
  />
  
  <Select data-testid="contract-length-select">
    <SelectTrigger data-testid="contract-length-trigger">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="6" data-testid="contract-option-6">
        6 Months
      </SelectItem>
      <SelectItem value="12" data-testid="contract-option-12">
        12 Months
      </SelectItem>
    </SelectContent>
  </Select>
  
  <Button 
    type="submit"
    data-testid="submit-button"
    disabled={!isValid}
  >
    Submit
  </Button>
</form>
```

### 23.2 E2E Test Selectors

```tsx
// Page-level Test IDs
<div data-page="plan-comparison" className="min-h-screen">
  <section data-section="hero" className="bg-texas-navy text-white py-24">
    {/* Hero content */}
  </section>
  
  <section data-section="filters" className="py-8">
    <div data-filter-group="contract-length">
      {/* Filter options */}
    </div>
    <div data-filter-group="plan-type">
      {/* Filter options */}
    </div>
  </section>
  
  <section data-section="results" className="py-8">
    <div data-results-count>{results.length}</div>
    <div data-results-grid className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Result cards */}
    </div>
  </section>
</div>

// Interactive Element States
<Button 
  data-state={isLoading ? "loading" : "ready"}
  data-action="compare-plans"
  className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
>
  {isLoading ? "Loading..." : "Compare Plans"}
</Button>
```

### 23.3 Component Test Patterns

```tsx
// Accessibility Testing Helpers
const PlanCard = ({ plan, ...props }) => {
  return (
    <Card 
      {...props}
      role="article"
      aria-label={`Electricity plan: ${plan.name}`}
    >
      {/* Component content */}
    </Card>
  )
}

// State Testing Helpers
const FilterPanel = () => {
  const [filters, setFilters] = useState({})
  
  return (
    <div 
      data-testid="filter-panel"
      data-active-filters={Object.keys(filters).length}
      data-filter-state={JSON.stringify(filters)}
    >
      {/* Filter components */}
    </div>
  )
}

// Error Boundary Testing
<ErrorBoundary
  fallback={
    <div data-testid="error-boundary-fallback">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          Please refresh the page and try again
        </AlertDescription>
      </Alert>
    </div>
  }
>
  {children}
</ErrorBoundary>
```

---

## 24. UTILITY FUNCTIONS & HELPERS

### 24.1 CSS Utility Function

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format rate
export function formatRate(rate: number): string {
  return rate.toFixed(1)
}

// Format kWh
export function formatUsage(kwh: number): string {
  return new Intl.NumberFormat('en-US').format(kwh)
}
```

### 24.2 Date & Time Helpers

```tsx
// Date formatting
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

// Relative time
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  
  return formatDate(d)
}

// Contract end date warning
export function getContractWarning(endDate: string): {
  level: 'info' | 'warning' | 'urgent'
  message: string
} | null {
  const end = new Date(endDate)
  const now = new Date()
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  
  if (daysRemaining < 0) {
    return {
      level: 'urgent',
      message: 'Your contract has expired!'
    }
  }
  
  if (daysRemaining <= 14) {
    return {
      level: 'urgent',
      message: `Contract expires in ${daysRemaining} days!`
    }
  }
  
  if (daysRemaining <= 30) {
    return {
      level: 'warning',
      message: `Contract expires in ${daysRemaining} days`
    }
  }
  
  if (daysRemaining <= 60) {
    return {
      level: 'info',
      message: `Contract expires in ${Math.round(daysRemaining / 30)} months`
    }
  }
  
  return null
}
```

### 24.3 Validation Helpers

```tsx
// ZIP code validation
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip)
}

// Email validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Phone validation
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}

// Usage validation
export function isValidUsage(usage: string | number): boolean {
  const num = typeof usage === 'string' ? parseInt(usage) : usage
  return !isNaN(num) && num >= 0 && num <= 10000
}

// Form validation schema
export const enrollmentSchema = {
  email: {
    required: 'Email is required',
    validate: (value: string) => 
      isValidEmail(value) || 'Please enter a valid email'
  },
  zipCode: {
    required: 'ZIP code is required',
    validate: (value: string) =>
      isValidZipCode(value) || 'Please enter a 5-digit ZIP code'
  },
  phone: {
    required: 'Phone number is required',
    validate: (value: string) =>
      isValidPhone(value) || 'Please enter a 10-digit phone number'
  },
  usage: {
    required: 'Usage estimate is required',
    validate: (value: string) =>
      isValidUsage(value) || 'Please enter a valid usage amount'
  }
}
```

---

## 25. THEME CONFIGURATION

### 25.1 Complete Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Texas Brand Colors
        'texas-navy': '#002868',
        'texas-red': '#BE0B31',
        'texas-gold': '#F59E0B',
        'texas-cream': '#F8EDD3',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### 25.2 CSS Custom Properties

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Texas Brand Colors in HSL */
    --texas-navy: 212 100% 20%;
    --texas-red: 346 86% 40%;
    --texas-gold: 38 94% 50%;
    --texas-cream: 39 82% 91%;
    
    /* Light Theme (default) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 212 100% 20%;
    --primary-foreground: 0 0% 100%;
    --secondary: 346 86% 40%;
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 38 94% 50%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 212 100% 20%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 212 100% 60%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 346 86% 60%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 38 94% 60%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212 100% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}

@layer utilities {
  /* Text balance */
  .text-balance {
    text-wrap: balance;
  }
  
  /* Hide scrollbar */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Glass morphism */
  .glass {
    @apply bg-white/80 backdrop-blur-md;
  }
  
  /* Texas theme gradients */
  .gradient-texas {
    @apply bg-gradient-to-r from-texas-navy to-texas-navy/80;
  }
  
  .gradient-radial-texas {
    background: radial-gradient(circle at top left, theme('colors.texas-navy'), theme('colors.texas-navy' / 0.8));
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-break {
    page-break-after: always;
  }
}
```

---

## 26. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Install and configure Shadcn/ui with all required components
- [ ] Set up Tailwind with Texas brand colors
- [ ] Create base layout components
- [ ] Implement button system with proper hover states
- [ ] Set up typography scale
- [ ] Configure font loading strategy
- [ ] Set up CSS custom properties
- [ ] Create utility functions (cn, formatters)

### Phase 2: Core Components (Week 2)
- [ ] Build plan card component with all states
- [ ] Create form components (inputs, selects, etc.)
- [ ] Implement navigation (desktop & mobile)
- [ ] Build comparison table with sorting
- [ ] Create loading states and skeletons
- [ ] Implement toast notification system
- [ ] Build modal/dialog components
- [ ] Create badge variants

### Phase 3: Complex Features (Week 3)
- [ ] Multi-step enrollment flow
- [ ] Data visualization components
- [ ] Trust & social proof components
- [ ] Advanced form patterns (autocomplete, file upload)
- [ ] Mobile-specific patterns (bottom sheet, swipe)
- [ ] Error states and empty states
- [ ] Notification center
- [ ] Comparison basket

### Phase 4: Page Templates (Week 4)
- [ ] Homepage template with hero
- [ ] City landing page template
- [ ] Plan comparison page template
- [ ] Provider page template
- [ ] Search results template
- [ ] Blog/article template
- [ ] FAQ page template
- [ ] Enrollment flow pages

### Phase 5: Polish & Testing (Week 5)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Visual regression testing setup
- [ ] E2E test implementation
- [ ] Final QA

### Critical Success Factors
1. **Every button must have explicit hover text colors**
2. **All interactive elements must be keyboard accessible**
3. **Mobile touch targets must be minimum 44x44px**
4. **Page load time must be under 3 seconds**
5. **WCAG AA compliance is mandatory**
6. **Consistent use of Texas brand colors**
7. **All components use Shadcn/ui as base**
8. **Proper focus management throughout**

---

## 27. COMMON PITFALLS TO AVOID

### 27.1 Hover State Mistakes
```tsx
// ❌ WRONG - Text disappears on hover
<Button className="bg-white text-blue-600 hover:bg-blue-600">
  Text becomes invisible!
</Button>

// ✅ CORRECT - Text stays visible
<Button className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white">
  Text stays visible
</Button>

// ❌ WRONG - No hover state defined
<Button className="bg-texas-navy text-white">
  No hover feedback
</Button>

// ✅ CORRECT - Subtle hover effect maintains contrast
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white">
  Proper hover state
</Button>

// ❌ WRONG - Conflicting hover states
<Button className="hover:bg-white hover:bg-blue-600">
  Which color wins?
</Button>

// ✅ CORRECT - Single, clear hover state
<Button className="bg-white text-texas-navy hover:bg-texas-navy hover:text-white">
  Clear hover behavior
</Button>
```

### 27.2 Button Icon Mistakes
```tsx
// ❌ WRONG - Two icons on one button
<Button>
  <Search className="mr-2 h-4 w-4" />
  Search Plans
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>

// ✅ CORRECT - One icon only
<Button>
  <Search className="mr-2 h-4 w-4" />
  Search Plans
</Button>

// ❌ WRONG - Duplicate icons for emphasis
<Button>
  <Zap className="mr-2 h-4 w-4" />
  Fast Signup
  <Zap className="ml-2 h-4 w-4" />
</Button>

// ✅ CORRECT - Single icon is enough
<Button>
  <Zap className="mr-2 h-4 w-4" />
  Fast Signup
</Button>

// ❌ WRONG - Icon sandwich
<Button>
  <ChevronRight className="mr-2 h-4 w-4" />
  Continue
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>

// ✅ CORRECT - Icon indicates direction clearly
<Button>
  Continue
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>
```

### 27.3 Spacing Inconsistencies
```tsx
// ❌ WRONG - Random spacing values
<div className="p-5 mb-7 mt-3">
  <h2 className="mb-3.5">Title</h2>
  <p className="mt-2.5">Content</p>
</div>

// ✅ CORRECT - Use consistent 4px scale
<div className="p-6 mb-8 mt-4">
  <h2 className="mb-4">Title</h2>
  <p className="mt-2">Content</p>
</div>

// ❌ WRONG - Mixed units
<div className="p-[18px] mb-[1.5rem] mt-[12px]">
  Inconsistent units
</div>

// ✅ CORRECT - Stick to rem-based Tailwind classes
<div className="p-4 mb-6 mt-3">
  Consistent spacing
</div>
```

### 27.3 Color Usage Errors
```tsx
// ❌ WRONG - Hardcoded colors
<div className="text-[#002868] bg-[#F8EDD3]">
  Don't hardcode hex values
</div>

// ✅ CORRECT - Use defined color tokens
<div className="text-texas-navy bg-texas-cream">
  Use theme colors
</div>

// ❌ WRONG - Inconsistent color shades
<Card className="bg-blue-100 border-blue-600 text-blue-900">
  Multiple blue shades
</Card>

// ✅ CORRECT - Cohesive color usage
<Card className="bg-white border-gray-200 text-gray-900">
  Consistent color scheme
</Card>
```

### 27.4 Accessibility Mistakes
```tsx
// ❌ WRONG - No accessible labels
<button onClick={handleClick}>
  <X />
</button>

// ✅ CORRECT - Proper ARIA labels
<button onClick={handleClick} aria-label="Close dialog">
  <X />
</button>

// ❌ WRONG - Poor focus management
<div onClick={handleClick} className="cursor-pointer">
  Not keyboard accessible
</div>

// ✅ CORRECT - Keyboard accessible
<button 
  onClick={handleClick}
  className="focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
>
  Keyboard accessible
</button>
```

### 27.5 Mobile Responsiveness Issues
```tsx
// ❌ WRONG - Fixed widths
<div className="w-[600px]">
  Breaks on mobile
</div>

// ✅ CORRECT - Responsive widths
<div className="w-full max-w-2xl">
  Responsive on all screens
</div>

// ❌ WRONG - Small touch targets
<button className="p-1 text-xs">
  Too small on mobile
</button>

// ✅ CORRECT - Minimum 44px touch targets
<button className="min-h-[44px] min-w-[44px] p-3">
  Mobile-friendly tap target
</button>
```

### 27.6 Performance Pitfalls
```tsx
// ❌ WRONG - Loading everything upfront
import HeavyComponent from './HeavyComponent'

// ✅ CORRECT - Lazy load when needed
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton className="h-[400px]" />
})

// ❌ WRONG - Unoptimized images
<img src="/huge-image.jpg" />

// ✅ CORRECT - Optimized, responsive images
<picture>
  <source srcSet="/image-mobile.webp" media="(max-width: 768px)" />
  <source srcSet="/image-desktop.webp" media="(min-width: 769px)" />
  <img src="/image-fallback.jpg" alt="Description" loading="lazy" />
</picture>
```

---

## FINAL NOTES

This comprehensive UI specification ensures:

1. **Absolute Consistency**: Every component follows the same patterns
2. **Accessibility First**: WCAG AA compliance throughout
3. **Performance Optimized**: Sub-3 second load times
4. **Mobile Responsive**: 60%+ of traffic is mobile
5. **Texas Branded**: Consistent use of brand colors
6. **Shadcn/ui Based**: Single source of truth for components
7. **Developer Friendly**: Clear examples and patterns
8. **SEO Optimized**: Structured data and meta tags
9. **User Focused**: 10-minute journey from landing to enrollment
10. **Scalable**: Ready for 5,800+ pages

Remember: **Always specify hover text colors explicitly!** This is the most common mistake that makes text disappear on hover.

---

This specification is your single source of truth for all UI implementation on ChooseMyPower.org. Any deviations must be documented and approved to maintain design system integrity across all 5,800+ pages.

---

## 28. IMPLEMENTATION GUIDE

### 28.1 Getting Started

```bash
# 1. Install Shadcn/ui CLI
npm install -D @shadcn/ui

# 2. Initialize Shadcn/ui
npx shadcn-ui@latest init

# 3. Install all required components
npx shadcn-ui@latest add alert alert-dialog avatar badge button card checkbox dialog dropdown-menu form input label navigation-menu popover radio-group scroll-area select separator sheet skeleton slider switch table tabs textarea toast toggle tooltip

# 4. Install additional dependencies
npm install @radix-ui/react-icons lucide-react recharts class-variance-authority tailwind-merge clsx tailwindcss-animate

# 5. Install development dependencies
npm install -D @types/react @types/react-dom prettier eslint-config-prettier
```

### 28.2 Project Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── MobileNav.tsx
│   ├── plans/                # Plan-specific components
│   │   ├── PlanCard.tsx
│   │   ├── PlanComparison.tsx
│   │   ├── PlanFilters.tsx
│   │   └── PlanGrid.tsx
│   ├── forms/                # Form components
│   │   ├── EnrollmentForm.tsx
│   │   ├── ZipCodeSearch.tsx
│   │   └── UsageCalculator.tsx
│   └── shared/               # Shared components
│       ├── TrustBadges.tsx
│       ├── LoadingStates.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── validators.ts         # Validation functions
│   ├── formatters.ts         # Formatting functions
│   └── constants.ts          # App constants
├── hooks/                    # Custom React hooks
│   ├── useURLState.ts
│   ├── useComparisonBasket.ts
│   ├── useMultiStepForm.ts
│   └── useLocalStorage.ts
├── styles/
│   ├── globals.css           # Global styles
│   └── fonts/                # Local font files
└── types/
    ├── plan.ts               # Plan type definitions
    ├── provider.ts           # Provider types
    └── enrollment.ts         # Enrollment types
```

### 28.3 Component Development Workflow

```tsx
// 1. Create component file following naming convention
// components/plans/PlanCard.tsx

// 2. Import necessary dependencies
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Plan } from "@/types/plan"

// 3. Define component props with TypeScript
interface PlanCardProps {
  plan: Plan
  isPopular?: boolean
  onSelect?: (plan: Plan) => void
  className?: string
}

// 4. Create component with proper accessibility
export function PlanCard({ 
  plan, 
  isPopular = false, 
  onSelect,
  className 
}: PlanCardProps) {
  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer",
        isPopular && "border-2 border-texas-gold ring-2 ring-texas-gold/20",
        className
      )}
      onClick={() => onSelect?.(plan)}
      role="article"
      aria-label={`${plan.name} electricity plan from ${plan.provider}`}
    >
      {/* Component implementation following the specification */}
    </Card>
  )
}

// 5. Export with display name for debugging
PlanCard.displayName = "PlanCard"

// 6. Create Storybook story (optional)
// components/plans/PlanCard.stories.tsx
```

### 28.4 Style Guidelines

```tsx
// ALWAYS use cn() for conditional classes
import { cn } from "@/lib/utils"

// ✅ CORRECT
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>

// ❌ WRONG
<div className={`base-classes ${isActive ? 'active-classes' : ''}`}>

// Component variants using CVA
import { cva, type VariantProps } from "class-variance-authority"

const planCardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 hover:border-texas-navy/20",
        popular: "border-texas-gold ring-2 ring-texas-gold/20",
        selected: "border-texas-navy ring-2 ring-texas-navy",
      },
      size: {
        default: "p-6",
        compact: "p-4",
        large: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Use with type safety
interface PlanCardProps extends VariantProps<typeof planCardVariants> {
  // other props
}
```

### 28.5 State Management Best Practices

```tsx
// 1. URL State for shareable filters
const [filters, setFilters] = useURLState({
  contractLength: 'all',
  planType: 'all',
  priceRange: '0-100'
})

// 2. Local Storage for user preferences
const [preferences, setPreferences] = useLocalStorage('user-preferences', {
  viewMode: 'grid',
  sortBy: 'price',
  showDetails: false
})

// 3. React State for UI state
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)

// 4. Context for global app state
const PlanComparisonContext = createContext<ComparisonContextType | null>(null)

// 5. Server state with React Query (if using)
const { data: plans, isLoading, error } = useQuery({
  queryKey: ['plans', filters],
  queryFn: () => fetchPlans(filters)
})
```

### 28.6 Performance Optimization Checklist

```tsx
// 1. Image Optimization
<Image 
  src="/hero.jpg"
  alt="Texas electricity"
  width={1200}
  height={600}
  priority // for above-fold images
  placeholder="blur"
  blurDataURL={shimmerDataURL}
/>

// 2. Code Splitting
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    loading: () => <Skeleton className="h-96" />,
    ssr: false // if not needed on server
  }
)

// 3. Memoization
const MemoizedPlanCard = memo(PlanCard, (prevProps, nextProps) => {
  return prevProps.plan.id === nextProps.plan.id &&
         prevProps.isPopular === nextProps.isPopular
})

// 4. Debouncing
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    searchPlans(query)
  }, 300),
  []
)

// 5. Virtual Scrolling for long lists
import { VirtualList } from '@tanstack/react-virtual'

// 6. Prefetching
const router = useRouter()
useEffect(() => {
  router.prefetch('/enrollment')
}, [router])
```

---

## 29. MIGRATION STRATEGY

### 29.1 Gradual Migration Plan

```tsx
// Phase 1: Create adapter components
// adapters/LegacyButton.tsx
import { Button as NewButton } from "@/components/ui/button"

export function LegacyButton({ 
  variant, 
  color, 
  size, 
  ...props 
}: LegacyButtonProps) {
  // Map old props to new system
  const newVariant = mapVariant(variant, color)
  const newSize = mapSize(size)
  
  return (
    <NewButton 
      variant={newVariant} 
      size={newSize}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
      {...props}
    />
  )
}

// Phase 2: Update imports gradually
// Before:
import { Button } from '@/components/LegacyButton'

// After:
import { Button } from '@/components/ui/button'

// Phase 3: Update props and classes
// Before:
<Button color="primary" size="large">Click Me</Button>

// After:
<Button 
  className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
  size="lg"
>
  Click Me
</Button>
```

### 29.2 CSS Migration

```css
/* Create temporary compatibility layer */
/* styles/legacy-compat.css */

/* Map old classes to new ones */
.btn-primary {
  @apply bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white;
}

.btn-secondary {
  @apply bg-texas-red text-white hover:bg-texas-red/90 hover:text-white;
}

.card-shadow {
  @apply shadow-lg;
}

/* Deprecation warnings in dev */
.btn-primary::before {
  content: "⚠️ Deprecated: Use Button component with texas-navy classes";
  @apply hidden;
}

@media (prefers-reduced-motion: no-preference) {
  .legacy-component {
    animation: deprecation-pulse 2s ease-in-out infinite;
  }
}
```

---

## 30. DOCUMENTATION STANDARDS

### 30.1 Component Documentation Template

```tsx
/**
 * PlanCard Component
 * 
 * Displays an electricity plan with rate, features, and selection CTA.
 * Follows Texas brand guidelines and supports popular/selected states.
 * 
 * @example
 * ```tsx
 * <PlanCard 
 *   plan={planData}
 *   isPopular={true}
 *   onSelect={(plan) => console.log('Selected:', plan)}
 * />
 * ```
 * 
 * @accessibility
 * - Keyboard navigable with Enter/Space to select
 * - Screen reader announces plan details
 * - Focus indicators meet WCAG AA standards
 * - Color contrast ratios exceed 4.5:1
 * 
 * @performance
 * - Memoized to prevent unnecessary re-renders
 * - Lazy loads rating stars component
 * - Images use next/image for optimization
 */
```

### 30.2 Design Token Documentation

```typescript
// design-tokens/colors.ts
export const colors = {
  /**
   * Texas Navy
   * Primary brand color - Used for headers, CTAs, and primary actions
   * Hex: #002868
   * RGB: 0, 40, 104
   * Pantone: 281 C
   * Usage: Primary buttons, navigation, headings
   */
  'texas-navy': '#002868',
  
  /**
   * Texas Red  
   * Secondary brand color - Used for urgency and secondary CTAs
   * Hex: #BE0B31
   * RGB: 190, 11, 49
   * Pantone: 200 C
   * Usage: Alert buttons, warnings, sale badges
   */
  'texas-red': '#BE0B31',
} as const

// Export for Figma Tokens plugin
export const figmaTokens = {
  color: {
    brand: {
      navy: { value: colors['texas-navy'] },
      red: { value: colors['texas-red'] },
    }
  }
}
```

---

## 31. QUALITY ASSURANCE CHECKLIST

### 31.1 Pre-Deployment Checklist

```markdown
## Component Review Checklist

### Visual Design
- [ ] Matches Figma designs exactly
- [ ] Follows Texas brand colors
- [ ] Consistent spacing (4px grid)
- [ ] Proper typography hierarchy
- [ ] All states designed (hover, active, disabled, loading, error)

### Functionality
- [ ] All interactions work as expected
- [ ] Form validation provides clear feedback
- [ ] Loading states show appropriately
- [ ] Error states handle gracefully
- [ ] Success states confirm actions

### Accessibility
- [ ] Keyboard navigation works completely
- [ ] Screen reader tested with NVDA/JAWS
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] Focus indicators visible and clear
- [ ] ARIA labels present where needed
- [ ] Skip links functional

### Responsive Design
- [ ] Mobile (320px - 768px) tested
- [ ] Tablet (768px - 1024px) tested  
- [ ] Desktop (1024px+) tested
- [ ] Touch targets minimum 44x44px
- [ ] Text remains readable at all sizes
- [ ] Images scale appropriately

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images optimized (WebP/AVIF)
- [ ] Code split where appropriate

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 9+)

### Code Quality
- [ ] TypeScript types complete
- [ ] No ESLint errors
- [ ] Props documented
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] No console errors/warnings
```

### 31.2 Automated Testing Setup

```typescript
// tests/visual-regression/plan-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PlanCard Visual Regression', () => {
  test('default state matches snapshot', async ({ page }) => {
    await page.goto('/components/plan-card/default')
    await expect(page).toHaveScreenshot('plan-card-default.png')
  })
  
  test('hover state shows correct colors', async ({ page }) => {
    await page.goto('/components/plan-card/default')
    const button = page.locator('[data-testid="select-plan-button"]')
    
    // Check initial state
    await expect(button).toHaveCSS('background-color', 'rgb(0, 40, 104)') // texas-navy
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)') // white
    
    // Hover and check colors remain visible
    await button.hover()
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)') // white text still visible
  })
  
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/components/plan-card/default')
    
    // Tab to card
    await page.keyboard.press('Tab')
    const card = page.locator('[data-testid="plan-card"]')
    await expect(card).toBeFocused()
    
    // Enter selects card
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/enrollment/)
  })
})
```

---

## 32. MAINTENANCE & UPDATES

### 32.1 Version Control for Design System

```json
// package.json
{
  "name": "@choosemypower/ui",
  "version": "1.0.0",
  "exports": {
    "./components": "./src/components/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./utils": "./src/lib/utils.ts",
    "./styles": "./src/styles/globals.css"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### 32.2 Change Log Template

```markdown
# Design System Changelog

## [1.1.0] - 2024-09-15

### Added
- New `ComparisonTable` component for side-by-side plan comparison
- `useComparisonBasket` hook for managing plan selection
- Texas Gold accent color variant for buttons

### Changed
- Updated `PlanCard` hover states to ensure text visibility
- Improved mobile responsiveness for `EnrollmentForm`
- Standardized spacing to strict 4px grid system

### Fixed
- Fixed button text disappearing on hover in white variant
- Resolved focus trap issue in modal components
- Corrected ARIA labels in navigation menu

### Deprecated
- `LegacyButton` component - migrate to `Button` by v2.0.0

### Breaking Changes
- None in this release
```

### 32.3 Design System Governance

```typescript
// design-system/governance.ts

export const governanceRules = {
  // New Component Approval Process
  newComponent: {
    requiredSteps: [
      'Create RFC (Request for Comments) issue',
      'Design review with stakeholders',
      'Accessibility audit',
      'Performance impact assessment',
      'Documentation complete',
      'Two team member approvals'
    ],
    
    template: `
    ## New Component Proposal: [Component Name]
    
    ### Problem Statement
    What user/business problem does this solve?
    
    ### Proposed Solution
    How does this component address the problem?
    
    ### Design Specifications
    - Figma link:
    - States covered:
    - Responsive behavior:
    
    ### Technical Specifications
    - Props interface:
    - Dependencies:
    - Performance considerations:
    
    ### Accessibility
    - Keyboard navigation:
    - Screen reader support:
    - WCAG compliance:
    `
  },
  
  // Breaking Change Process
  breakingChange: {
    minimumNotice: '30 days',
    requiredSteps: [
      'Migration guide written',
      'Codemod provided (if applicable)',
      'Deprecation warnings added',
      'Team notification sent',
      'Documentation updated'
    ]
  }
}
```

---

## 33. DEVELOPER RESOURCES

### 33.1 Quick Reference Card

```typescript
// Quick Copy-Paste Patterns

// Texas Navy Button (Primary CTA)
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white focus:ring-2 focus:ring-texas-navy focus:ring-offset-2">
  Compare Plans
</Button>

// Texas Red Button (Secondary CTA)
<Button className="bg-texas-red text-white hover:bg-texas-red/90 hover:text-white focus:ring-2 focus:ring-texas-red focus:ring-offset-2">
  Get Started
</Button>

// Outline Button (Tertiary)
<Button variant="outline" className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white">
  Learn More
</Button>

// Standard Card Container
<Card className="hover:shadow-lg transition-all duration-200">
  <CardHeader className="p-6">
    <CardTitle className="text-lg font-semibold text-gray-900">Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Content */}
  </CardContent>
</Card>

// Page Section Container
<section className="py-16 md:py-24">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
    {/* Section content */}
  </div>
</section>

// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Mobile-First Responsive Text
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-texas-navy">
  Responsive Heading
</h1>

// Loading State
<div className="flex items-center justify-center p-8">
  <Loader2 className="h-8 w-8 animate-spin text-texas-navy" />
</div>

// Error State
<Alert className="border-red-200 bg-red-50">
  <AlertCircle className="h-4 w-4 text-red-600" />
  <AlertTitle className="text-red-800">Error</AlertTitle>
  <AlertDescription className="text-red-700">
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>

// Empty State
<div className="text-center py-12">
  <SearchX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
  <p className="text-gray-600">Try adjusting your filters</p>
</div>
```

### 33.2 VS Code Snippets

```json
// .vscode/snippets/choosemypower.code-snippets
{
  "Texas Navy Button": {
    "prefix": "btn-navy",
    "body": [
      "<Button className=\"bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white focus:ring-2 focus:ring-texas-navy focus:ring-offset-2\">",
      "  ${1:Button Text}",
      "</Button>"
    ]
  },
  
  "Plan Card": {
    "prefix": "plan-card",
    "body": [
      "<Card className=\"hover:shadow-lg transition-all duration-200\">",
      "  <CardHeader className=\"p-6\">",
      "    <CardTitle className=\"text-lg font-semibold text-gray-900\">${1:Plan Name}</CardTitle>",
      "    <CardDescription className=\"text-sm text-gray-500\">${2:Provider Name}</CardDescription>",
      "  </CardHeader>",
      "  <CardContent className=\"p-6 pt-0\">",
      "    <div className=\"text-3xl font-bold text-green-600\">${3:12.5}¢</div>",
      "    ${4:<!-- Additional content -->}",
      "  </CardContent>",
      "  <CardFooter className=\"p-6 pt-0\">",
      "    <Button className=\"w-full bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white\">",
      "      Select Plan",
      "    </Button>",
      "  </CardFooter>",
      "</Card>"
    ]
  }
}
```

### 33.3 Tooling Configuration

```javascript
// prettier.config.js
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.ts',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
}

// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:tailwindcss/recommended',
  ],
  rules: {
    'tailwindcss/classnames-order': 'warn',
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/enforces-negative-arbitrary-values': 'warn',
  },
}
```

---

## CONCLUSION

This comprehensive UI design specification provides everything needed to build and maintain a consistent, accessible, and high-performing user interface for ChooseMyPower.org across all 5,800+ pages.

### Key Takeaways:

1. **Consistency is Paramount**: Use Shadcn/ui components exclusively
2. **Accessibility First**: Every interaction must be keyboard accessible
3. **Performance Matters**: Sub-3 second load times are mandatory
4. **Mobile Responsive**: 60%+ of traffic demands mobile-first design
5. **Texas Branded**: Consistent use of brand colors builds trust
6. **Developer Experience**: Clear patterns and documentation save time
7. **Scalability Built-in**: Ready for 5,800+ pages from day one

### Remember The Golden Rule:
**Always specify hover text colors explicitly!** This prevents the most common UI bug where text becomes invisible on hover.

### Support & Updates:
- Documentation: [Internal Wiki Link]
- Design Files: [Figma Link]
- Component Library: [Storybook Link]
- Questions: [Slack Channel]

---

*Last Updated: August 29, 2025*
*Version: 1.0.0*
*Maintained by: ChooseMyPower.org Design System Team*

### 21.1 Structured Data

```tsx
// Plan Structured Data
<script 
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": plan.name,
      "description": plan.description,
      "brand": {
        "@type": "Brand",
        "name": plan.provider
      },
      "offers": {
        "@type": "Offer",
        "price": plan.rate,
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": plan.rate,
          "priceCurrency": "USD",
          "unitText": "kWh"
        },
        "eligibleRegion": {
          "@type": "Place",
          "name": "Texas"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": plan.rating,
        "reviewCount": plan.reviewCount
      }
    })
  }}
/>

// Local Business Schema
<script 
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "ChooseMyPower",
      "description": "Texas electricity plan comparison and enrollment",
      "url": "https://choosemypower.org",
      "telephone": "1-800-POWER-TX",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Austin",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 30.2672,
        "longitude": -97.7431
      },
      "openingHours": "Mo-Fr 08:00-20:00",
      "sameAs": [
        "https://facebook.com/choosemypower",
        "https://twitter.com/choosemypower"
      ]
    })
  }}
/>
```

### 21.2 Meta Tags Component

```tsx
// SEO Meta Component
const SEOMeta = ({ 
  title, 
  description, 
  image, 
  url, 
  type = "website",
  publishedTime,
  modifiedTime,
  author
}) => {
  const fullTitle = `${title} | ChooseMyPower - Texas Electricity Plans`
  
  return (
    <Head>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="ChooseMyPower" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@choosemypower" />
      
      {/* Article Specific */}
      {type === "article" && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:modified_time" content={modifiedTime} />
          <meta property="article:author" content={author} />
        </>
      )}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Head>
  )
}
```

---

## 22. TESTING SPECIFICATIONS

### 22.1 Visual Regression Markers

```tsx
// Component Test IDs
<Card data-testid="plan-card" data-plan-id={plan.id}>
  <CardHeader>
    <CardTitle data-testid="plan-name">{plan.name}</CardTitle>
    <CardDescription data-testid="provider-name">{plan.provider}</CardDescription>
  </CardHeader>
  <CardContent>
    <div data-testid="plan-rate" className="text-3xl font-bold text-green-600">
      {plan.rate}¢
    </div>
    <Button 
      data-testid="select-plan-button"
      data-plan-id={plan.id}
      className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
    >
      Select Plan
    </Button>
  </CardContent>
</Card>

// Form Test Attributes
<form data-testid="enrollment-form" onSubmit={handleSubmit}>
  <Input 
    data-testid="email-input"
    id="email"
    type="email"
    required
    aria-required="true"
  />
  
  <Select data-testid="contract-length-select">
    <SelectTrigger data-testid="contract-length-trigger">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="6" data-testid="contract-option-6">
        6 Months
      </SelectItem>
      <SelectItem value="12" data-testid="contract-option-12">
        12 Months
      </SelectItem>
    </SelectContent>
  </Select>
  
  <Button 
    type="submit"
    data-testid="submit-button"
    disabled={!isValid}
  >
    Submit
  </Button>
</form>
```

### 22.2 E2E Test Selectors

```tsx
// Page-level Test IDs
<div data-page="plan-comparison" className="min-h-screen">
  <section data-section="hero" className="bg-texas-navy text-white py-24">
    {/* Hero content */}
  </section>
  
  <section data-section="filters" className="py-8">
    <div data-filter-group="contract-length">
      {/* Filter options */}
    </div>
    <div data-filter-group="plan-type">
      {/* Filter options */}
    </div>
  </section>
  
  <section data-section="results" className="py-8">
    <div data-results-count>{results.length}</div>
    <div data-results-grid className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Result cards */}
    </div>
  </section>
</div>

// Interactive Element States
<Button 
  data-state={isLoading ? "loading" : "ready"}
  data-action="compare-plans"
  className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
>
  {isLoading ? "Loading..." : "Compare Plans"}
</Button>
```

### 22.3 Component Test Patterns

```tsx
// Accessibility Testing Helpers
const PlanCard = ({ plan, ...props }) => {
  return (
    <Card 
      {...props}
      role="article"
      aria-label={`Electricity plan: ${plan.name}`}
    >
      {/* Component content */}
    </Card>
  )
}

// State Testing Helpers
const FilterPanel = () => {
  const [filters, setFilters] = useState({})
  
  return (
    <div 
      data-testid="filter-panel"
      data-active-filters={Object.keys(filters).length}
      data-filter-state={JSON.stringify(filters)}
    >
      {/* Filter components */}
    </div>
  )
}

// Error Boundary Testing
<ErrorBoundary
  fallback={
    <div data-testid="error-boundary-fallback">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          Please refresh the page and try again
        </AlertDescription>
      </Alert>
    </div>
  }
>
  {children}
</ErrorBoundary>
```

---

## 23. ERROR HANDLING & VALIDATION

### 23.1 Form Validation

```tsx
// Field Error State
<div>
  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    className={cn(
      "mt-1",
      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
    )}
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
  />
  {errors.email && (
    <p id="email-error" className="mt-1 text-sm text-red-600">
      Please enter a valid email address
    </p>
  )}
</div>

// Success State
<div className="rounded-md bg-green-50 p-4">
  <div className="flex">
    <Check className="h-5 w-5 text-green-400" />
    <div className="ml-3">
      <p className="text-sm font-medium text-green-800">
        Successfully updated your preferences
      </p>
    </div>
  </div>
</div>
```

### 23.2 Error Pages

```tsx
// 404 Page
<div className="min-h-[60vh] flex items-center justify-center">
  <div className="text-center">
    <h1 className="text-6xl font-bold text-texas-navy">404</h1>
    <h2 className="mt-4 text-2xl font-semibold text-gray-900">
      Page Not Found
    </h2>
    <p className="mt-2 text-gray-600">
      Sorry, we couldn't find the page you're looking for.
    </p>
    <Button 
      className="mt-6 bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
      onClick={() => router.push('/')}
    >
      Go Back Home
    </Button>
  </div>
</div>
```

---

## 24. ACCESSIBILITY CHECKLIST

### 24.1 Required Attributes

```tsx
// All interactive elements must have:
- aria-label or visible label text
- role (if not semantic HTML)
- aria-describedby for additional context
- aria-expanded for toggleable elements
- aria-current for active navigation items
- aria-invalid for form errors
- aria-live for dynamic content updates

// Skip Links
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                          bg-texas-navy text-white px-4 py-2 rounded">
  Skip to main content
</a>

// Screen Reader Only Text
<span className="sr-only">Opens in new window</span>
```

### 24.2 Keyboard Navigation

```tsx
// Tab Order
- Logical flow from top to bottom, left to right
- tabindex="0" for focusable elements
- tabindex="-1" for programmatic focus only
- Never use tabindex > 0

// Keyboard Shortcuts
- Enter/Space to activate buttons
- Arrow keys for menu navigation
- Escape to close modals/dropdowns
- Tab to move forward, Shift+Tab to move backward
```

---

## 25. PERFORMANCE GUIDELINES

### 25.1 Image Optimization

```tsx
// Responsive Images
<picture>
  <source 
    srcSet="/hero-desktop.webp" 
    media="(min-width: 1024px)"
    type="image/webp"
  />
  <source 
    srcSet="/hero-mobile.webp" 
    media="(max-width: 1023px)"
    type="image/webp"
  />
  <img 
    src="/hero-fallback.jpg" 
    alt="Find electricity plans in Texas"
    className="w-full h-auto"
    loading="lazy"
    decoding="async"
  />
</picture>

// Provider Logos
<img 
  src="/providers/txu-logo.svg" 
  alt="TXU Energy"
  className="h-12 w-auto"
  loading="lazy"
  width="120"
  height="48"
/>
```

### 25.2 Code Splitting

```tsx
// Lazy Load Components
const PlanComparison = dynamic(() => import('@/components/PlanComparison'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false
})

// Conditional Loading
{showFilters && (
  <Suspense fallback={<div>Loading filters...</div>}>
    <FilterPanel />
  </Suspense>
)}
```

---

## 26. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Install and configure Shadcn/ui with all required components
- [ ] Set up Tailwind with Texas brand colors
- [ ] Create base layout components
- [ ] Implement button system with proper hover states
- [ ] Set up typography scale

### Phase 2: Core Components (Week 2)
- [ ] Build plan card component
- [ ] Create form components (inputs, selects, etc.)
- [ ] Implement navigation (desktop & mobile)
- [ ] Build comparison table
- [ ] Create loading states

### Phase 3: Page Templates (Week 3)
- [ ] Homepage template
- [ ] City landing page template
- [ ] Plan comparison page template
- [ ] Provider page template
- [ ] Search results template

### Phase 4: Polish & Testing (Week 4)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Final QA

### Critical Success Factors
1. **Every button must have explicit hover text colors**
2. **All interactive elements must be keyboard accessible**
3. **Mobile touch targets must be minimum 44x44px**
4. **Page load time must be under 3 seconds**
5. **WCAG AA compliance is mandatory**

---

## 27. COMMON PITFALLS TO AVOID

### 27.1 Hover State Mistakes
```tsx
// ❌ WRONG - Text disappears on hover
<Button className="bg-white text-blue-600 hover:bg-blue-600">

// ✅ CORRECT - Text stays visible
<Button className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white">

// ❌ WRONG - No hover state defined
<Button className="bg-texas-navy text-white">

// ✅ CORRECT - Subtle hover effect maintains contrast
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white">
```

### 27.2 Spacing Inconsistencies
```tsx
// ❌ WRONG - Random spacing values
<div className="p-5 mb-7 mt-3">

// ✅ CORRECT - Use consistent scale
<div className="p-6 mb-8 mt-4">

// ❌ WRONG - Mixed units
<div className="p-[18px] mb-[1.5rem]">

// ✅ CORRECT - Stick to rem-based scale
<div className="p-4 mb-6">
```

### 27.3 Color Usage Errors
```tsx
// ❌ WRONG - Hardcoded colors
<div className="text-[#002868]">

// ✅ CORRECT - Use defined color tokens
<div className="text-texas-navy">

// ❌ WRONG - Inconsistent shades
<div className="bg-blue-600 text-blue-700 border-blue-800">

// ✅ CORRECT - Harmonious color usage
<div className="bg-texas-navy text-white border-texas-navy/20">
```

---

This specification ensures complete consistency across all pages of ChooseMyPower.org. Every developer should reference this document when implementing UI components. Any deviations must be documented and approved to maintain design system integrity.

### 11.1 Form Validation

```tsx
// Field Error State
<div>
  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    className={cn(
      "mt-1",
      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
    )}
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
  />
  {errors.email && (
    <p id="email-error" className="mt-1 text-sm text-red-600">
      Please enter a valid email address
    </p>
  )}
</div>

// Success State
<div className="rounded-md bg-green-50 p-4">
  <div className="flex">
    <Check className="h-5 w-5 text-green-400" />
    <div className="ml-3">
      <p className="text-sm font-medium text-green-800">
        Successfully updated your preferences
      </p>
    </div>
  </div>
</div>
```

### 11.2 Error Pages

```tsx
// 404 Page
<div className="min-h-[60vh] flex items-center justify-center">
  <div className="text-center">
    <h1 className="text-6xl font-bold text-texas-navy">404</h1>
    <h2 className="mt-4 text-2xl font-semibold text-gray-900">
      Page Not Found
    </h2>
    <p className="mt-2 text-gray-600">
      Sorry, we couldn't find the page you're looking for.
    </p>
    <Button 
      className="mt-6 bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white"
      onClick={() => router.push('/')}
    >
      Go Back Home
    </Button>
  </div>
</div>
```

---

## 12. ACCESSIBILITY CHECKLIST

### 12.1 Required Attributes

```tsx
// All interactive elements must have:
- aria-label or visible label text
- role (if not semantic HTML)
- aria-describedby for additional context
- aria-expanded for toggleable elements
- aria-current for active navigation items
- aria-invalid for form errors
- aria-live for dynamic content updates

// Skip Links
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                          bg-texas-navy text-white px-4 py-2 rounded">
  Skip to main content
</a>

// Screen Reader Only Text
<span className="sr-only">Opens in new window</span>
```

### 12.2 Keyboard Navigation

```tsx
// Tab Order
- Logical flow from top to bottom, left to right
- tabindex="0" for focusable elements
- tabindex="-1" for programmatic focus only
- Never use tabindex > 0

// Keyboard Shortcuts
- Enter/Space to activate buttons
- Arrow keys for menu navigation
- Escape to close modals/dropdowns
- Tab to move forward, Shift+Tab to move backward
```

---

## 13. PERFORMANCE GUIDELINES

### 13.1 Image Optimization

```tsx
// Responsive Images
<picture>
  <source 
    srcSet="/hero-desktop.webp" 
    media="(min-width: 1024px)"
    type="image/webp"
  />
  <source 
    srcSet="/hero-mobile.webp" 
    media="(max-width: 1023px)"
    type="image/webp"
  />
  <img 
    src="/hero-fallback.jpg" 
    alt="Find electricity plans in Texas"
    className="w-full h-auto"
    loading="lazy"
    decoding="async"
  />
</picture>

// Provider Logos
<img 
  src="/providers/txu-logo.svg" 
  alt="TXU Energy"
  className="h-12 w-auto"
  loading="lazy"
  width="120"
  height="48"
/>
```

### 13.2 Code Splitting

```tsx
// Lazy Load Components
const PlanComparison = dynamic(() => import('@/components/PlanComparison'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false
})

// Conditional Loading
{showFilters && (
  <Suspense fallback={<div>Loading filters...</div>}>
    <FilterPanel />
  </Suspense>
)}
```

---

## 14. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Install and configure Shadcn/ui with all required components
- [ ] Set up Tailwind with Texas brand colors
- [ ] Create base layout components
- [ ] Implement button system with proper hover states
- [ ] Set up typography scale

### Phase 2: Core Components (Week 2)
- [ ] Build plan card component
- [ ] Create form components (inputs, selects, etc.)
- [ ] Implement navigation (desktop & mobile)
- [ ] Build comparison table
- [ ] Create loading states

### Phase 3: Page Templates (Week 3)
- [ ] Homepage template
- [ ] City landing page template
- [ ] Plan comparison page template
- [ ] Provider page template
- [ ] Search results template

### Phase 4: Polish & Testing (Week 4)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Final QA

### Critical Success Factors
1. **Every button must have explicit hover text colors**
2. **All interactive elements must be keyboard accessible**
3. **Mobile touch targets must be minimum 44x44px**
4. **Page load time must be under 3 seconds**
5. **WCAG AA compliance is mandatory**

---

## 15. COMMON PITFALLS TO AVOID

### 15.1 Hover State Mistakes
```tsx
// ❌ WRONG - Text disappears on hover
<Button className="bg-white text-blue-600 hover:bg-blue-600">

// ✅ CORRECT - Text stays visible
<Button className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white">

// ❌ WRONG - No hover state defined
<Button className="bg-texas-navy text-white">

// ✅ CORRECT - Subtle hover effect maintains contrast
<Button className="bg-texas-navy text-white hover:bg-texas-navy/90 hover:text-white">
```

### 15.2 Spacing Inconsistencies
```tsx
// ❌ WRONG - Random spacing values
<div className="p-5 mb-7 mt-3">

// ✅ CORRECT - Use consistent scale
<div className="p-6 mb-8 mt-4">

// ❌ WRONG - Mixed units
<div className="p-[18px] mb-[1.5rem]">

// ✅ CORRECT - Stick to rem-based scale
<div className="p-4 mb-6">
```

### 15.3 Color Usage Errors
```tsx
// ❌ WRONG - Hardcoded colors
<div className="text-[#002868]">

// ✅ CORRECT - Use defined color tokens
<div className="text-texas-navy">

// ❌ WRONG - Inconsistent shades
<div className="bg-blue-600 text-blue-700 border-blue-800">

// ✅ CORRECT - Harmonious color usage
<div className="bg-texas-navy text-white border-texas-navy/20">
```

---

This specification ensures complete consistency across all pages of ChooseMyPower.org. Every developer should reference this document when implementing UI components. Any deviations must be documented and approved to maintain design system integrity.