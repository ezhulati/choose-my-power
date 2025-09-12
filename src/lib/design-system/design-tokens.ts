/**
 * Professional Design System for ChooseMyPower
 * Consistent spacing, typography, colors, and component patterns
 */

// SPACING SCALE - Based on 4px base unit for perfect pixel alignment
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
  '6xl': '4rem',    // 64px
  '7xl': '5rem',    // 80px
  '8xl': '6rem',    // 96px
} as const;

// TYPOGRAPHY SCALE - Professional type hierarchy
export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// COLOR PALETTE - Professional Texas-themed colors with accessibility compliance
export const COLORS = {
  // Brand Colors
  brand: {
    navy: '#002768',      // Texas Navy - Primary brand
    red: '#BE0B31',       // Texas Red - Secondary brand
    gold: '#F59E0B',      // Texas Gold - Accent
    cream: '#F8EDD3',     // Texas Cream - Background accent
  },
  
  // Semantic Colors
  semantic: {
    success: '#059669',   // Green for positive actions
    warning: '#D97706',   // Orange for warnings
    error: '#DC2626',     // Red for errors
    info: '#0891B2',      // Blue for information
  },
  
  // Neutral Grays - Accessible and professional
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// COMPONENT PATTERNS - Reusable component configurations
export const COMPONENTS = {
  // Button variants
  button: {
    sizes: {
      sm: {
        padding: `${SPACING.sm} ${SPACING.lg}`,
        fontSize: TYPOGRAPHY.fontSize.sm[0],
        height: '2rem',
      },
      md: {
        padding: `${SPACING.md} ${SPACING.xl}`,
        fontSize: TYPOGRAPHY.fontSize.base[0],
        height: '2.5rem',
      },
      lg: {
        padding: `${SPACING.lg} ${SPACING['2xl']}`,
        fontSize: TYPOGRAPHY.fontSize.lg[0],
        height: '3rem',
      },
    },
    
    variants: {
      primary: {
        backgroundColor: COLORS.brand.navy,
        color: 'white',
        hoverBackgroundColor: '#001a4d', // Darker navy
      },
      secondary: {
        backgroundColor: COLORS.brand.red,
        color: 'white',
        hoverBackgroundColor: '#a0092a', // Darker red
      },
      outline: {
        backgroundColor: 'transparent',
        color: COLORS.brand.navy,
        border: `1px solid ${COLORS.brand.navy}`,
      },
    },
  },
  
  // Card patterns
  card: {
    elevation: {
      low: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      high: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      highest: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    
    borderRadius: {
      sm: '0.25rem',   // 4px
      md: '0.5rem',    // 8px
      lg: '0.75rem',   // 12px
      xl: '1rem',      // 16px
    },
  },
  
  // Layout containers
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    
    padding: {
      mobile: SPACING.lg,     // 16px on mobile
      tablet: SPACING['2xl'], // 24px on tablet
      desktop: SPACING['3xl'], // 32px on desktop
    },
  },
} as const;

// RESPONSIVE BREAKPOINTS - Mobile-first approach
export const BREAKPOINTS = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large screens
} as const;

// ANIMATION TIMING - Consistent motion design
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// UTILITY FUNCTIONS
export const designSystem = {
  // Get spacing value
  spacing: (key: keyof typeof SPACING) => SPACING[key],
  
  // Get color value
  color: (category: keyof typeof COLORS, shade?: string | number) => {
    const colorCategory = COLORS[category];
    if (shade && typeof colorCategory === 'object' && shade in colorCategory) {
      return (colorCategory as unknown)[shade];
    }
    return typeof colorCategory === 'string' ? colorCategory : colorCategory[500];
  },
  
  // Generate shadow utilities
  shadow: (level: keyof typeof COMPONENTS.card.elevation) => 
    COMPONENTS.card.elevation[level],
  
  // Responsive utility
  responsive: (mobile: string, tablet?: string, desktop?: string) => ({
    base: mobile,
    ...(tablet && { md: tablet }),
    ...(desktop && { lg: desktop }),
  }),
} as const;

// CSS CUSTOM PROPERTIES GENERATOR
export const generateCSSVariables = () => `
  :root {
    /* Spacing */
    ${Object.entries(SPACING).map(([key, value]) => `--spacing-${key}: ${value};`).join('\n    ')}
    
    /* Colors */
    --color-brand-navy: ${COLORS.brand.navy};
    --color-brand-red: ${COLORS.brand.red};
    --color-brand-gold: ${COLORS.brand.gold};
    --color-brand-cream: ${COLORS.brand.cream};
    
    ${Object.entries(COLORS.neutral).map(([key, value]) => `--color-neutral-${key}: ${value};`).join('\n    ')}
    ${Object.entries(COLORS.semantic).map(([key, value]) => `--color-${key}: ${value};`).join('\n    ')}
    
    /* Typography */
    --font-weight-light: ${TYPOGRAPHY.fontWeight.light};
    --font-weight-normal: ${TYPOGRAPHY.fontWeight.normal};
    --font-weight-medium: ${TYPOGRAPHY.fontWeight.medium};
    --font-weight-semibold: ${TYPOGRAPHY.fontWeight.semibold};
    --font-weight-bold: ${TYPOGRAPHY.fontWeight.bold};
    
    /* Animation */
    --duration-fast: ${ANIMATION.duration.fast};
    --duration-normal: ${ANIMATION.duration.normal};
    --duration-slow: ${ANIMATION.duration.slow};
  }
`;