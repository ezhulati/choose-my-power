# Icon System Integration

## 🎯 **New Iconify-Powered Icon System**

I've successfully integrated a comprehensive icon system using **Iconify** with **Tabler icons** for your ChooseMyPower website. Here's how to use it:

## 📦 **Installed Packages**
- `@iconify/react` - React integration for client-side components
- `@iconify/utils` - Utility functions for icon management

## 🔧 **Available Components**

### 1. **Icon.tsx** (React Component)
```typescript
// For React components (.tsx files)
import { Icon, ElectricityIcon } from '../ui/Icon';

// Basic usage
<Icon icon="lightning" size={24} className="text-yellow-500" />

// Pre-configured electricity icons
<ElectricityIcon name="solar" size={32} className="text-yellow-600" />

// Direct Iconify usage
<Icon icon="tabler:bolt" size={24} color="#fbbf24" />
```

### 2. **Icon.astro** (Astro Component)
```astro
---
// For Astro pages (.astro files)
import Icon from '../components/ui/Icon.astro';
---

<Icon icon="lightning" size={24} className="text-yellow-500" />
<Icon icon="tabler:solar-panel" size={32} color="#059669" />
```

## ⚡ **Available Electricity-Themed Icons**

### Power & Energy
- `lightning` → tabler:bolt
- `flash` → tabler:flash  
- `energy` → tabler:battery-charging
- `power` → tabler:plug
- `electricity` → tabler:zap
- `solar` → tabler:solar-panel
- `wind` → tabler:wind

### Business & Money
- `dollar-sign` → tabler:currency-dollar
- `savings` → tabler:coin
- `calculator` → tabler:calculator
- `chart` → tabler:chart-line
- `trending-up` → tabler:trending-up
- `trending-down` → tabler:trending-down
- `bar-chart` → tabler:chart-bar

### Green Energy
- `leaf` → tabler:leaf
- `eco` → tabler:recycle
- `earth` → tabler:world
- `sun` → tabler:sun

### Navigation & UI
- `search` → tabler:search
- `filter` → tabler:filter
- `menu` → tabler:menu-2
- `compare` → tabler:arrows-left-right
- `shop` → tabler:shopping-cart
- `location` → tabler:map-pin
- `home` → tabler:home

### Status & Actions
- `success` → tabler:circle-check
- `error` → tabler:circle-x
- `warning` → tabler:alert-triangle
- `award` → tabler:award
- `star` → tabler:star
- `shield` → tabler:shield

## 🚀 **Usage Examples**

### In Astro Pages
```astro
---
import Icon from '../components/ui/Icon.astro';
---

<!-- Using mapped names -->
<Icon icon="lightning" size={24} className="text-yellow-500" />
<Icon icon="solar" size={32} className="text-green-600" />
<Icon icon="dollar-sign" size={20} className="text-green-500" />

<!-- Using direct Tabler icons -->
<Icon icon="tabler:bolt" size={24} />
<Icon icon="tabler:solar-panel" size={32} />

<!-- With custom styling -->
<Icon icon="energy" size={28} className="text-blue-600 mr-2" />
```

### In React Components
```tsx
import { Icon, ElectricityIcon, PowerIcon, GreenIcon } from '../ui/Icon';

function MyComponent() {
  return (
    <div>
      {/* Basic usage */}
      <Icon icon="lightning" size={24} className="text-yellow-500" />
      
      {/* Pre-configured components */}
      <PowerIcon size={32} className="text-yellow-600" />
      <GreenIcon size={28} className="text-emerald-600" />
      
      {/* Electricity-specific icons */}
      <ElectricityIcon name="solar" size={24} />
      <ElectricityIcon name="wind" size={24} />
    </div>
  );
}
```

## 🎨 **Icon Categories Available**

### 1. **Tabler Icons** (Primary - 4,000+ icons)
- `tabler:bolt`, `tabler:solar-panel`, `tabler:leaf`, etc.
- Consistent design, perfect for electricity/energy themes

### 2. **Lucide Icons** (Current setup)
- `lucide:zap`, `lucide:leaf`, `lucide:calculator`, etc.  
- Still supported for backward compatibility

### 3. **Any Iconify Icon** (100,000+ icons)
- `heroicons:bolt`, `carbon:solar-panel`, `solar:energy`, etc.
- Access to the entire Iconify ecosystem

## 🔄 **Migration Path**

### Phase 1: Start Using New System
```astro
<!-- Old way -->
import { Zap } from 'lucide-react';
<Zap className="h-6 w-6" />

<!-- New way -->
import Icon from '../components/ui/Icon.astro';
<Icon icon="zap" size={24} />
```

### Phase 2: Gradually Replace Lucide Imports
```astro
<!-- Replace these imports -->
import { Building2, Award, Users, TrendingUp, Star, Shield, Zap } from 'lucide-react';

<!-- With this -->
import Icon from '../components/ui/Icon.astro';

<!-- And use like this -->
<Icon icon="building" size={24} />
<Icon icon="award" size={24} />
<Icon icon="users" size={24} />
```

## ⚙️ **MCP Server Integration**

Your MCP server configuration is set up for icon discovery:
```json
"icon-iconify-pickicon-mcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "pickapicon-mcp@latest"],
    "env": {
        "PREFIX": "<LIKE tabler>"
    }
}
```

Once the MCP server is fully functional, you'll be able to:
- Search icons by keyword
- Get icon recommendations
- Find similar icons
- Browse icon families

## 🎯 **Benefits**

1. **Consistent Design**: All Tabler icons have the same visual style
2. **Better Performance**: Iconify loads icons on-demand
3. **Huge Selection**: Access to 100,000+ icons from multiple libraries
4. **Easy Switching**: Change entire icon sets by updating one mapping
5. **Type Safety**: TypeScript support with predefined icon names
6. **Server-Side Rendering**: Works perfectly with Astro's SSR

## 📍 **Next Steps**

1. **Test the system**: Visit `/demo/icons` (once I fix the demo page)
2. **Start migrating**: Begin replacing Lucide icons in high-visibility areas
3. **Customize mapping**: Add more electricity-specific icon mappings
4. **Optimize performance**: Set up icon bundling for production

The icon system is now ready for use across your entire ChooseMyPower website! 🚀