/// <reference types="vite/client" />

// Global type declarations
declare global {
  // Google Analytics gtag function
  function gtag(command: 'config' | 'event', targetOrAction: string, parameters?: any): void;
  
  // Window extensions
  interface Window {
    DocumentTouch?: any;
  }
}
