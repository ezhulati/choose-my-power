/**
 * Systematic Z-Index Scale
 * Fixes the z-index chaos throughout the application
 * 
 * USAGE:
 * import { Z_INDEX } from '@/lib/design-system/z-index-scale'
 * className={`z-[${Z_INDEX.DROPDOWN}]`} // Tailwind arbitrary value
 * style={{ zIndex: Z_INDEX.DROPDOWN }} // Inline style
 */

export const Z_INDEX = {
  // Base layers (0-9)
  BASE: 0,
  BACKGROUND_IMAGE: 1,
  CONTENT: 2,
  OVERLAY: 3,

  // Component layers (10-99)
  CARD_HOVER: 10,
  FORM_ELEMENTS: 15,
  BUTTONS: 20,
  
  // Navigation layers (100-199)  
  HEADER: 100,
  NAVIGATION: 110,
  DROPDOWN_MENU: 120,
  MOBILE_NAV_TOGGLE: 130,

  // Modal/Dialog layers (200-299)
  BACKDROP: 200,
  MODAL: 210,
  DIALOG: 220,
  
  // Sidebar layers (300-399)
  SIDEBAR: 300,
  SIDEBAR_OVERLAY: 310,
  
  // Mobile specific (400-499)
  MOBILE_BOTTOM_NAV: 400,
  MOBILE_MENU_OVERLAY: 410,
  MOBILE_SIDE_MENU: 420,
  MOBILE_BOTTOM_SHEET: 430,
  
  // System layers (500-999)
  COMPARISON_BAR: 500,
  FACETED_FILTERS: 510,
  
  // Critical system overlays (1000+)
  TOAST: 1000,
  TOOLTIP: 1100,
  NOTIFICATION: 1200,
  
  // Emergency/Debug (9000+)
  DEBUG_OVERLAY: 9000,
  EMERGENCY_MODAL: 9999,
} as const;

/**
 * CSS Custom Properties for z-index values
 * Use these in CSS files for better maintainability
 */
export const Z_INDEX_CSS_VARS = `
  :root {
    --z-base: ${Z_INDEX.BASE};
    --z-background-image: ${Z_INDEX.BACKGROUND_IMAGE};
    --z-content: ${Z_INDEX.CONTENT};
    --z-overlay: ${Z_INDEX.OVERLAY};
    
    --z-card-hover: ${Z_INDEX.CARD_HOVER};
    --z-form-elements: ${Z_INDEX.FORM_ELEMENTS};
    --z-buttons: ${Z_INDEX.BUTTONS};
    
    --z-header: ${Z_INDEX.HEADER};
    --z-navigation: ${Z_INDEX.NAVIGATION};
    --z-dropdown-menu: ${Z_INDEX.DROPDOWN_MENU};
    --z-mobile-nav-toggle: ${Z_INDEX.MOBILE_NAV_TOGGLE};
    
    --z-backdrop: ${Z_INDEX.BACKDROP};
    --z-modal: ${Z_INDEX.MODAL};
    --z-dialog: ${Z_INDEX.DIALOG};
    
    --z-sidebar: ${Z_INDEX.SIDEBAR};
    --z-sidebar-overlay: ${Z_INDEX.SIDEBAR_OVERLAY};
    
    --z-mobile-bottom-nav: ${Z_INDEX.MOBILE_BOTTOM_NAV};
    --z-mobile-menu-overlay: ${Z_INDEX.MOBILE_MENU_OVERLAY};
    --z-mobile-side-menu: ${Z_INDEX.MOBILE_SIDE_MENU};
    --z-mobile-bottom-sheet: ${Z_INDEX.MOBILE_BOTTOM_SHEET};
    
    --z-comparison-bar: ${Z_INDEX.COMPARISON_BAR};
    --z-faceted-filters: ${Z_INDEX.FACETED_FILTERS};
    
    --z-toast: ${Z_INDEX.TOAST};
    --z-tooltip: ${Z_INDEX.TOOLTIP};
    --z-notification: ${Z_INDEX.NOTIFICATION};
    
    --z-debug-overlay: ${Z_INDEX.DEBUG_OVERLAY};
    --z-emergency-modal: ${Z_INDEX.EMERGENCY_MODAL};
  }
`;

/**
 * Utility function to get z-index value with type safety
 */
export const getZIndex = (layer: keyof typeof Z_INDEX): number => {
  return Z_INDEX[layer];
};

/**
 * Utility function to create Tailwind z-index class
 */
export const zIndexClass = (layer: keyof typeof Z_INDEX): string => {
  return `z-[${Z_INDEX[layer]}]`;
};

/**
 * Validation function to ensure z-index values are properly ordered
 */
export const validateZIndexScale = (): boolean => {
  const values = Object.values(Z_INDEX);
  const sortedValues = [...values].sort((a, b) => a - b);
  
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== sortedValues[i]) {
      console.error('Z-index scale validation failed. Values are not properly ordered.');
      return false;
    }
  }
  
  console.warn('✅ Z-index scale validation passed.');
  return true;
};