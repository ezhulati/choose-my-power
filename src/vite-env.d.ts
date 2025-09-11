/// <reference types="vite/client" />

// Global type declarations
declare global {
  // Google Analytics gtag function
  function gtag(command: 'config' | 'event', targetOrAction: string, parameters?: Record<string, unknown>): void;
  
  // Window extensions
  interface Window {
    DocumentTouch?: unknown;
  }
}
