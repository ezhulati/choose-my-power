# ChooseMyPower Component Documentation

## Overview

This documentation system provides comprehensive guides for all reusable components in the ChooseMyPower project, ensuring consistent design and implementation across the entire Texas electricity comparison platform.

## Documentation Structure

### 📋 Templates & Standards
- **[Component Documentation Template](component-documentation-template.md)** - Complete template for documenting components
- **[Documentation Standards](component-documentation-standards.md)** - Writing guidelines and quality requirements

### 🧩 Component Documentation
- **[Button](components/Button.md)** - Primary interactive element with Texas-themed variants *(Sample Documentation)*

### 🎨 Design System Integration
All components are designed to maintain consistency with the ChooseMyPower Texas-themed design system:
- **Texas Navy** (#002868) - Primary brand color
- **Texas Red** (#dc2626) - Action/urgency color
- **Texas Gold** (#f59e0b) - Accent/premium color
- **Texas Cream** (#f8edd3) - Soft background color

## Quick Start Guide

### For Component Documentation
1. **Copy the [template](component-documentation-template.md)**
2. **Follow the [standards guide](component-documentation-standards.md)**
3. **Document all required sections**
4. **Include accessibility testing**
5. **Add real-world code examples**

### Documentation Requirements

#### Mandatory for All Components
- ✅ **Component Header** - Name, type, status
- ✅ **Purpose & Overview** - What and why
- ✅ **Props/Parameters** - Complete API
- ✅ **Usage Examples** - 3+ practical examples
- ✅ **Accessibility** - WCAG AA compliance
- ✅ **States & Variations** - All interactive states

#### Additional for UI Components
- ✅ **Visual Preview** - Screenshots/demos
- ✅ **Styling & Theming** - Texas design system integration
- ✅ **Testing** - Unit and accessibility tests

## Component Categories

### 🔹 Atoms (Basic Building Blocks)
*Foundation components that cannot be broken down further*
- Button *(documented)*
- Input, Icon, Badge
- Typography, Spacing primitives

### 🔸 Molecules (Combined Atoms)  
*Simple combinations of atoms with specific purpose*
- SearchInput, PlanCard, Navigation
- Form fields, Card components

### 🔶 Organisms (Complex Components)
*Complex UI components with business logic*
- Header, FacetedSidebar, PlanGrid
- Data tables, Complex forms

### 🔷 Templates (Layout Components)
*Page-level objects providing content structure*
- Layout, PageTemplate
- Grid systems, Content layouts

## Texas Design System Alignment

### Color Usage Guidelines
```tsx
// ✅ Correct Texas theme usage
<Button variant="texas-primary">Primary Action</Button>    // Navy
<Button variant="texas-secondary">Get Started</Button>    // Red  
<Button variant="texas-accent">Best Value</Button>        // Gold
<Button variant="texas-outline">Learn More</Button>       // Navy outline
```

### Typography Scale
- **Display:** 72px - Hero sections  
- **Headings:** 36px-18px - Content hierarchy
- **Body:** 16px - Primary content
- **Small:** 14px-12px - Secondary text

### Spacing System
- **8pt Grid:** All spacing uses multiples of 8px
- **Component Padding:** 16px, 24px, 32px standard
- **Section Spacing:** 64px, 96px, 128px for layouts

## Accessibility Standards

### WCAG AA Compliance Required
All components must meet:
- ✅ **4.5:1 color contrast** minimum
- ✅ **Keyboard navigation** support  
- ✅ **Screen reader** compatibility
- ✅ **44px minimum** touch targets
- ✅ **Focus indicators** visible

### Testing Requirements
```bash
# Automated accessibility testing
npm run test:a11y

# Screen reader testing checklist
- NVDA (Windows)
- JAWS (Windows)  
- VoiceOver (macOS)
```

## Documentation Workflow

### 1. Component Development
- Component API finalized
- Design review approved
- Unit tests completed

### 2. Documentation Creation  
- Use template as starting point
- Include all mandatory sections
- Create working code examples
- Take high-quality screenshots

### 3. Review Process
- Technical review by development team
- Design system compliance check
- Accessibility review and testing
- Content editing for clarity

### 4. Publication
- Add to component library
- Update Storybook stories
- Link from main documentation
- Announce to team

## Best Practices

### Code Examples
```tsx
// ✅ Complete, runnable examples
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export function GoodExample() {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button 
      variant="texas-primary"
      disabled={loading}
      onClick={handleAction}
    >
      {loading && <Zap className="w-4 h-4 animate-spin" />}
      {loading ? 'Processing...' : 'Get Started'}
    </Button>
  );
}
```

### Visual Documentation
- **High-quality screenshots** for all UI components
- **Multiple states** shown (default, hover, focus, disabled)
- **Responsive behavior** documented
- **Consistent styling** and context

### Writing Style
- **Professional but approachable** tone
- **Action-oriented** language ("Use this when...")
- **Developer-focused** perspective
- **Consistent terminology** throughout

## Maintenance

### Regular Updates Required
- **Weekly:** Check for broken links
- **Monthly:** Verify screenshot accuracy  
- **Quarterly:** Complete documentation review
- **Per Release:** Update version information

### Quality Assurance
- Automated link checking in CI/CD
- Code example validation
- Screenshot optimization
- Accessibility standard updates

## Resources & References

### Internal Resources
- **[CLAUDE.md](../CLAUDE.md)** - Project overview and development commands
- **Figma Design System** - Visual design specifications
- **Storybook** - Interactive component library

### External References
- **[WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Accessibility standards
- **[Inclusive Components](https://inclusive-components.design/)** - A11y patterns
- **[Texas State Brand Guidelines](link)** - Official brand standards

## Contributing

### Adding New Documentation
1. Follow the [template](component-documentation-template.md)
2. Adhere to [documentation standards](component-documentation-standards.md) 
3. Include comprehensive examples and testing
4. Submit for team review before publishing

### Updating Existing Documentation
1. Identify outdated information
2. Update code examples and screenshots
3. Verify accessibility information
4. Test all links and references
5. Submit changes for review

---

## Documentation Index

### Component Library Status

| Component | Status | Documentation | Accessibility | Last Updated |
|-----------|---------|---------------|---------------|--------------|
| Button | ✅ Stable | [Complete](components/Button.md) | WCAG AA | 2025-09-02 |
| Input | 🚧 In Progress | Planned | - | - |
| Card | 🚧 In Progress | Planned | - | - |
| Modal | 📋 Planned | Planned | - | - |

### Legend
- ✅ **Complete** - Fully documented and maintained
- 🚧 **In Progress** - Documentation being created
- 📋 **Planned** - Scheduled for documentation
- ❌ **Outdated** - Needs updating

---

*This documentation system ensures consistent design and implementation across the entire ChooseMyPower platform, maintaining the Texas electricity market branding while providing excellent developer experience.*