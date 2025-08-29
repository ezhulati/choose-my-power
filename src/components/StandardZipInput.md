# StandardZipInput Component Documentation

## Overview

The `StandardZipInput` component provides a consistent ZIP code input experience across the entire ChooseMyPower site. It uses the same `/api/zip-lookup` endpoint and `/js/zip-lookup.js` script as the homepage for consistent functionality.

## Usage

```astro
---
import StandardZipInput from '../components/StandardZipInput.astro';
---

<!-- Basic usage -->
<StandardZipInput />

<!-- Hero variant (for hero sections with dark backgrounds) -->
<StandardZipInput 
  variant="hero" 
  size="lg"
  showTitle={true}
  showDescription={true}
  showStats={true}
/>

<!-- Inline variant (for content sections) -->
<StandardZipInput 
  variant="inline"
  size="md"
  showTitle={true}
/>

<!-- Compact variant (for sidebars, etc.) -->
<StandardZipInput 
  variant="compact"
  size="sm"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Controls the size of input and button |
| `variant` | `'hero' \| 'inline' \| 'compact'` | `'inline'` | Visual style variant |
| `showTitle` | `boolean` | `false` | Show "Find Plans in Your Area" title |
| `showDescription` | `boolean` | `false` | Show description text below title |
| `showStats` | `boolean` | `false` | Show statistics (cities, providers, plans) |
| `customClass` | `string` | `''` | Additional CSS classes |

## Variants

### Hero Variant
- **Use case**: Hero sections with dark backgrounds
- **Features**: White text, backdrop blur effects, large sizing
- **Background**: Designed for dark blue/navy backgrounds

```astro
<StandardZipInput 
  variant="hero" 
  size="lg"
  showTitle={true}
  showDescription={true}
  showStats={true}
/>
```

### Inline Variant  
- **Use case**: Content sections with light backgrounds
- **Features**: Standard styling, subtle shadows
- **Background**: Designed for white/light backgrounds

```astro
<StandardZipInput 
  variant="inline"
  size="md"
  showTitle={true}
/>
```

### Compact Variant
- **Use case**: Sidebars, small spaces
- **Features**: Minimal styling, small footprint
- **Background**: Neutral, works anywhere

```astro
<StandardZipInput 
  variant="compact"
  size="sm"
/>
```

## Size Options

### Small (`sm`)
- Input: `py-3 text-base`
- Button: `px-6 py-3`
- Icon: `h-5 w-5`
- **Use case**: Sidebars, compact layouts

### Medium (`md`) - Default  
- Input: `py-5 text-xl`
- Button: `px-10 py-5`
- Icon: `h-6 w-6`
- **Use case**: Most content sections

### Large (`lg`)
- Input: `py-6 text-2xl`
- Button: `px-12 py-6` 
- Icon: `h-7 w-7`
- **Use case**: Hero sections, prominent placement

## Features

✅ **Consistent API Integration**: Uses same `/api/zip-lookup` endpoint as homepage  
✅ **JavaScript Enhanced**: Includes `/js/zip-lookup.js` for validation and UX  
✅ **Texas ZIP Validation**: Only accepts 5-digit Texas ZIP codes  
✅ **Auto-submit**: Automatically submits when 5 digits are entered  
✅ **Error Handling**: Shows validation errors and API errors  
✅ **Loading States**: Visual feedback during API calls  
✅ **Accessibility**: Proper ARIA labels and keyboard navigation  
✅ **Mobile Optimized**: Touch-friendly with numeric input mode  
✅ **SEO Friendly**: Progressive enhancement (works without JavaScript)

## Implementation Examples

### Compare Plans Page
```astro
---
import StandardZipInput from '../components/StandardZipInput.astro';
---

<section class="py-16 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h2 class="text-3xl font-bold text-texas-navy mb-8">
      Compare Electricity Plans
    </h2>
    <StandardZipInput 
      variant="inline"
      size="md"
      showTitle={true}
      showDescription={true}
      customClass="max-w-lg mx-auto"
    />
  </div>
</section>
```

### Sidebar Widget
```astro
<aside class="w-80 bg-white p-6 rounded-lg shadow">
  <h3 class="text-lg font-semibold mb-4">Find Your Plans</h3>
  <StandardZipInput 
    variant="compact"
    size="sm"
  />
</aside>
```

### Landing Page Hero
```astro
<section class="bg-gradient-to-br from-texas-navy to-blue-800 text-white">
  <div class="max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 class="text-5xl font-bold mb-8">
      Texas Electricity Made Simple
    </h1>
    <StandardZipInput 
      variant="hero"
      size="lg"
      showTitle={true}
      showDescription={true}
      showStats={true}
    />
  </div>
</section>
```

## Technical Details

### API Integration
- **Endpoint**: `/api/zip-lookup?zip={zipCode}`
- **Method**: GET
- **Response**: JSON with success/error and redirect URL
- **Fallback**: Native form submission if JavaScript fails

### JavaScript Enhancement
- **File**: `/js/zip-lookup.js`
- **Features**: Auto-submit, validation, error display, loading states
- **Progressive**: Works without JavaScript (native form submission)

### Styling
- **Design System**: Uses Texas color palette (`texas-red`, `texas-navy`, etc.)
- **Responsive**: Mobile-first design with touch optimization  
- **Consistent**: Matches homepage implementation exactly

## Browser Support
- **Modern Browsers**: Full functionality with JavaScript
- **Legacy Browsers**: Graceful fallback to native form submission
- **Mobile**: Optimized touch targets and numeric keyboards
- **Screen Readers**: Full accessibility support

## Migration Guide

### From Custom ZIP Forms
Replace hardcoded ZIP forms with StandardZipInput:

```astro
<!-- Before -->
<form action="/api/zip-lookup" method="GET">
  <input type="text" name="zip" placeholder="ZIP code" />
  <button type="submit">Search</button>
</form>

<!-- After -->
<StandardZipInput variant="inline" size="md" />
```

### From React Components  
Replace complex React ZIP components with StandardZipInput:

```astro
<!-- Before -->
<AddressInput onAddressComplete={handleComplete} />

<!-- After -->
<StandardZipInput 
  variant="inline" 
  size="md"
  showTitle={true}
/>
```

## Troubleshooting

### Component Not Rendering
- Ensure correct import path: `import StandardZipInput from '../components/StandardZipInput.astro';`
- Check that file exists at `src/components/StandardZipInput.astro`

### JavaScript Not Working
- Verify `/js/zip-lookup.js` is accessible at `/js/zip-lookup.js`
- Check browser console for JavaScript errors
- Ensure `id="zipForm"` and `id="zipInput"` are present (automatically added by component)

### Styling Issues
- For hero variant, ensure parent has dark background
- For custom styling, use `customClass` prop rather than overriding internal styles
- Verify Tailwind classes are available

### API Integration Issues  
- Ensure `/api/zip-lookup.ts` endpoint exists and is functional
- Check API logs for errors
- Test with a valid Texas ZIP code (75201, 77001, etc.)

## Best Practices

1. **Use appropriate variants**: `hero` for dark backgrounds, `inline` for content, `compact` for small spaces
2. **Size appropriately**: `lg` for heroes, `md` for content, `sm` for sidebars
3. **Show context**: Use `showTitle` and `showDescription` to help users understand the purpose
4. **Stats sparingly**: Only use `showStats` in prominent locations like heroes
5. **Test functionality**: Always test with real ZIP codes to ensure API integration works

## Related Components

- **Homepage**: Uses StandardZipInput with hero variant
- **Legacy Components**: AddressInput.tsx, SmartZipCodeInput.tsx (can be replaced)
- **API Endpoint**: `/api/zip-lookup.ts` handles ZIP processing
- **JavaScript**: `/js/zip-lookup.js` provides enhanced functionality