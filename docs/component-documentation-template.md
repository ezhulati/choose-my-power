# Component Documentation Template

## Overview
This template provides a standardized format for documenting all reusable components in the ChooseMyPower project. Consistent documentation ensures maintainability, design consistency, and developer productivity across the entire website.

## Template Structure

### 1. Component Header
```markdown
# [ComponentName]

> Brief one-line description of the component's primary purpose

**Type:** [UI Component | Layout Component | Business Logic Component | Form Component | etc.]  
**Category:** [Atoms | Molecules | Organisms | Templates]  
**Status:** [Stable | Beta | Deprecated | New]  
**Last Updated:** [Date]  
**Maintainer:** [Team/Person]
```

### 2. Purpose & Overview
```markdown
## Purpose

Describe what the component does, why it exists, and what problems it solves. Include:
- Primary use case
- Business context
- Design system alignment
- When to use vs. when not to use
```

### 3. Visual Preview
```markdown
## Preview

[Include screenshot or visual example]

**Figma:** [Link to design file if available]  
**Storybook:** [Link to storybook story if available]
```

### 4. API Reference
```markdown
## Props/Parameters

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `propName` | `string` | `undefined` | ✅ | Description of what this prop does |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | ❌ | Visual style variant |

### Prop Details

#### `propName`
- **Purpose:** Detailed explanation of the prop
- **Validation:** Any validation rules or constraints
- **Examples:** 
  ```tsx
  <Component propName="example" />
  ```

#### `variant`
- **Available Options:**
  - `'primary'`: Default styling for main actions
  - `'secondary'`: Subtle styling for secondary actions
- **Design Impact:** How each variant affects visual presentation
```

### 5. Usage Examples
```markdown
## Usage Examples

### Basic Usage
```tsx
import { ComponentName } from '@/components/ui/component-name';

export function ExampleUsage() {
  return (
    <ComponentName
      prop1="value"
      prop2={true}
    >
      Content here
    </ComponentName>
  );
}
```

### Advanced Usage
```tsx
// Complex example with multiple features
export function AdvancedExample() {
  const [state, setState] = useState();
  
  return (
    <ComponentName
      variant="custom"
      onAction={(data) => handleAction(data)}
      className="custom-styles"
    >
      <ComponentName.Subcomponent />
    </ComponentName>
  );
}
```

### Integration Examples
- How to use within forms
- How to use with other components
- Common patterns and compositions
```

### 6. Styling & Theming
```markdown
## Styling & Theming

### CSS Classes
| Class | Purpose | Customizable |
|-------|---------|--------------|
| `.component-base` | Base styling | ❌ |
| `.component-variant-*` | Variant styles | ✅ |

### Texas Design System Integration
- How component aligns with Texas-themed design tokens
- Available color variants (texas-navy, texas-red, texas-gold, etc.)
- Typography scale usage
- Spacing system compliance

### Custom Styling
```css
/* Override examples */
.custom-component {
  --component-bg: theme('colors.texas-navy');
  --component-text: theme('colors.white');
}
```

### Responsive Behavior
- Mobile-first breakpoints
- Touch target sizing
- Responsive typography
```

### 7. Accessibility
```markdown
## Accessibility

### WCAG Compliance
- **Level:** [AA | AAA]
- **Compliance Status:** [Compliant | Partial | Non-compliant]

### Features
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA attributes
- ✅ Color contrast (4.5:1 minimum)

### ARIA Attributes
| Attribute | Usage | Required |
|-----------|-------|----------|
| `aria-label` | Provides accessible name | ✅ |
| `role` | Defines component role | ❌ |

### Keyboard Interactions
| Key | Action |
|-----|--------|
| `Enter` | Activates the component |
| `Space` | Alternative activation |
| `Escape` | Dismisses/cancels |

### Screen Reader Testing
- **NVDA:** [Status]
- **JAWS:** [Status]
- **VoiceOver:** [Status]
```

### 8. States & Variations
```markdown
## States & Variations

### Interactive States
- **Default:** Normal state appearance
- **Hover:** Visual feedback on mouse hover
- **Focus:** Keyboard focus indicator
- **Active/Pressed:** Click/touch feedback
- **Disabled:** Non-interactive state
- **Loading:** Async operation in progress

### Variants
Document each visual variant with:
- Use case
- Visual differences
- When to use
- Screenshots/examples

### Size Variations
- Small (sm)
- Default
- Large (lg)
- Extra Large (xl)
```

### 9. Edge Cases & Error Handling
```markdown
## Edge Cases & Error Handling

### Data Edge Cases
- **Empty State:** How component behaves with no data
- **Overflow:** Long text, large numbers, etc.
- **Invalid Props:** Malformed or missing required props
- **Network Failures:** For components that fetch data

### Error Boundaries
- How component handles errors
- Error recovery mechanisms
- User-facing error messages

### Performance Considerations
- Large dataset handling
- Re-render optimization
- Memory usage patterns
```

### 10. Testing
```markdown
## Testing

### Unit Tests
```tsx
// Example test structure
describe('ComponentName', () => {
  it('renders with required props', () => {
    // Test implementation
  });
  
  it('handles user interactions', () => {
    // Interaction tests
  });
  
  it('meets accessibility standards', () => {
    // A11y tests
  });
});
```

### Integration Tests
- Component behavior within larger contexts
- Data flow testing
- State management integration

### Visual Regression Tests
- Screenshot comparisons
- Cross-browser testing
- Responsive behavior validation

### Manual Testing Checklist
- [ ] All variants render correctly
- [ ] Interactive states work
- [ ] Keyboard navigation functions
- [ ] Screen reader announces properly
- [ ] Mobile touch targets are adequate
- [ ] Error states display correctly
```

### 11. Dependencies
```markdown
## Dependencies

### Internal Dependencies
- `@/lib/utils` - Utility functions
- `@/components/ui/primitives` - Base components

### External Dependencies
- `@radix-ui/react-*` - Primitives
- `class-variance-authority` - Styling variants
- `tailwindcss` - Utility classes

### Peer Dependencies
List any components or systems this component expects to be available.
```

### 12. Migration & Breaking Changes
```markdown
## Migration & Breaking Changes

### Version History
| Version | Changes | Breaking | Migration Guide |
|---------|---------|----------|----------------|
| v2.0.0 | New API structure | ✅ | [Link to migration guide] |
| v1.1.0 | Added new props | ❌ | N/A |

### Deprecation Notices
- Feature/prop being deprecated
- Timeline for removal
- Recommended alternatives
```

### 13. Development Notes
```markdown
## Development Notes

### Implementation Details
- Architecture decisions
- Performance optimizations
- Technical constraints

### Known Issues
- Current limitations
- Workarounds
- Planned improvements

### Contribution Guidelines
- How to modify the component
- Testing requirements
- Review process
```

### 14. Related Components
```markdown
## Related Components

### Composition Patterns
- Components commonly used together
- Layout relationships
- Data flow between components

### Alternatives
- When to use other components instead
- Feature comparison matrix
- Migration paths between similar components
```

---

## Template Usage Guidelines

### 1. **Completeness**: Not every section is required for every component, but consider each section
### 2. **Maintenance**: Update documentation when component changes
### 3. **Examples**: Provide real, working code examples
### 4. **Screenshots**: Include visual examples for UI components
### 5. **Testing**: Document how the component should be tested
### 6. **Accessibility**: Every UI component must have accessibility documentation

## Documentation Standards

### Writing Style
- **Clear and Concise**: Use simple, direct language
- **Example-Driven**: Show, don't just tell
- **User-Focused**: Write from the perspective of someone using the component
- **Consistent**: Follow the same structure and terminology

### Code Examples
- Must be complete and runnable
- Include imports and setup
- Show common use cases first
- Include error handling where relevant

### Visual Documentation
- Screenshots should be high-quality and up-to-date
- Include different states and variants
- Show responsive behavior when relevant
- Use consistent styling and branding

---

*This template ensures consistency across all component documentation in the ChooseMyPower project and maintains design system integrity.*