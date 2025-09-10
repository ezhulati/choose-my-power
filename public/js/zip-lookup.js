// Enhanced ZIP code form with API-based lookup and comprehensive error handling
// Using traditional script format to bypass module loading issues
(function() {
  'use strict';
  // Prevent double-initialization if script is included more than once
  try {
    if (window.__ZIP_LOOKUP_INITIALIZED__) {
      console.log('🔁 ZIP lookup script already initialized, skipping re-init');
      return;
    }
    window.__ZIP_LOOKUP_INITIALIZED__ = true;
  } catch (e) {
    // If window not accessible for some reason, continue safely
  }
  
  // Debug logging for troubleshooting
  console.log('🔧 ZIP lookup script loaded');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZipLookup);
  } else {
    initZipLookup();
  }
  
  function initZipLookup() {
  console.log('🚀 Initializing ZIP lookup functionality');
  
  // Find all ZIP forms on the page (supports multiple forms with unique IDs)
  const zipForms = document.querySelectorAll('.zip-form');
  
  if (zipForms.length === 0) {
    console.error('❌ No ZIP forms found, falling back to native form submission');
    return; // Let browser handle form submission naturally
  }
  
  console.log(`✅ Found ${zipForms.length} ZIP form(s), setting up JavaScript handlers`);
  
  // Initialize each form individually
  zipForms.forEach((form, index) => {
    // Skip if this form was already initialized
    if (form.dataset && form.dataset.zipLookupInit === '1') {
      return;
    }
    if (form.dataset) {
      form.dataset.zipLookupInit = '1';
    }
    const input = form.querySelector('.zip-input');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!input || !submitButton) {
      console.warn(`⚠️ Form ${index + 1} missing required elements, skipping`);
      return;
    }
    
    console.log(`✅ Setting up form ${index + 1} with ID: ${form.id}`);
  
    // Loading state management for this specific form
    function setLoadingState(loading) {
      if (loading) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Looking up...
        `;
      } else {
        submitButton.disabled = false;
        submitButton.innerHTML = `
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        `;
      }
    }

    // Error display management for this specific form
    function showError(message, type = 'error') {
      // Clear existing error messages for this form
      clearErrors();

      // Create error element
      const errorDiv = document.createElement('div');
      errorDiv.className = 'zip-error-message mt-4 p-4 rounded-lg text-sm';
      errorDiv.dataset.formId = form.id; // Associate error with this form
      
      if (type === 'municipal') {
        errorDiv.className += ' bg-yellow-50 border border-yellow-200 text-yellow-800';
        errorDiv.innerHTML = `
          <div class="flex items-start">
            <svg class="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div>
              <strong>Municipal Utility Area</strong>
              <p class="mt-1">${message}</p>
            </div>
          </div>
        `;
      } else {
        errorDiv.className += ' bg-red-50 border border-red-200 text-red-800';
        errorDiv.innerHTML = `
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <strong>ZIP Code Error</strong>
              <p class="mt-1">${message}</p>
            </div>
          </div>
        `;
      }

      // Insert after form
      form.parentNode.insertBefore(errorDiv, form.nextSibling);

      // Auto-remove after 8 seconds for non-municipal errors
      if (type !== 'municipal') {
        setTimeout(() => {
          if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
          }
        }, 8000);
      }
    }

    // Clear error messages for this specific form
    function clearErrors() {
      // Remove error messages associated with this form
      const existingErrors = document.querySelectorAll(`.zip-error-message[data-form-id="${form.id}"]`);
      existingErrors.forEach(error => {
        if (error.parentNode) {
          error.remove();
        }
      });
    }

    // Form submission handler with duplicate prevention and fallback
    let isSubmitting = false;
    let hasShownNotification = false;
    
    // Enhanced form submission handler
    form.addEventListener('submit', async function(e) {
      console.log(`🎯 Form ${form.id} submit event triggered`);
      
      // CRITICAL: Always prevent default form submission
      e.preventDefault();
      e.stopPropagation();
      console.log(`✅ Form ${form.id} default prevented, handling with JavaScript`);
      
      // Prevent duplicate submissions for this specific form
      if (isSubmitting) {
        console.log(`⏳ Form ${form.id} already submitting, ignoring duplicate`);
        return;
      }
    
    const zipCode = input.value.trim();

    // Clear previous errors
    clearErrors();

    // Basic validation
    if (!zipCode) {
      showError('Please enter your ZIP code to find electricity plans in your area.');
      input.focus();
      return;
    }

    if (zipCode.length !== 5) {
      showError('Please enter a valid 5-digit ZIP code.');
      input.focus();
      return;
    }

    // Set loading state and submission flag
    isSubmitting = true;
    setLoadingState(true);

    try {
      // Call our ZIP lookup API (FIXED: uses working endpoint)
      console.log(`📞 Making API call to /api/zip-lookup with ZIP: ${zipCode}`);
      const url = `/api/zip-lookup?zip=${encodeURIComponent(zipCode)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Handle redirected responses (API might redirect directly)
      if (res.redirected) {
        console.log('🔄 API redirected directly, following redirect');
        window.location = res.url;
        return;
      }

      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }

      // Check content type to handle both JSON and HTML responses
      const ct = res.headers.get('content-type') || '';
      
      let result;
      if (ct.includes('application/json')) {
        result = await res.json();
        console.log('📦 API JSON response:', result);
      } else {
        // API returned HTML/redirect instead of JSON - this shouldn't happen with our API
        console.warn('⚠️ API returned non-JSON content type:', ct);
        console.log('🔄 Attempting to parse as JSON anyway...');
        try {
          result = await res.json();
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON:', parseError);
          // Don't redirect to API URL, show proper error instead
          console.log('🔄 API returned invalid response, showing error to user');
          showError('Unable to process your ZIP code right now. Please try again or <a href="/electricity-plans" class="underline font-semibold hover:text-red-900">browse all electricity plans →</a>');
          return;
        }
      }

      setLoadingState(false);
      isSubmitting = false;

      if (result && result.success) {
        // Success - use reliable form-based navigation
        console.log('✅ ZIP lookup successful:', result);
        
        // Show success feedback briefly - but only once per form
        if (!hasShownNotification) {
          hasShownNotification = true;
          const successMessage = document.createElement('div');
          successMessage.className = 'zip-success-message mt-4 p-4 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800';
          successMessage.innerHTML = `
            <div class="flex items-center">
              <svg class="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <div>
                <strong>Found your area!</strong>
                <p class="mt-1">Loading ${result.cityDisplayName} electricity plans...</p>
              </div>
            </div>
          `;
          form.parentNode.insertBefore(successMessage, form.nextSibling);
        }
        
        // Multiple navigation strategies for maximum reliability
        const redirectUrl = result.redirectUrl || result.redirectURL;
        console.log('🎯 Navigating to:', redirectUrl);
        
        // Add small delay to prevent "page can't be found" flash on dynamic routes
        setTimeout(() => {
          try {
            // Primary: Use window.location.href for most reliable navigation
            window.location.href = redirectUrl;
          } catch (navError) {
            console.warn('⚠️ window.location.href failed, trying alternatives:', navError);
            
            try {
              // Fallback 1: Use window.location assignment
              window.location = redirectUrl;
            } catch (navError2) {
              console.warn('⚠️ window.location assignment failed, trying replace:', navError2);
              
              try {
                // Fallback 2: Use location.replace
                window.location.replace(redirectUrl);
              } catch (navError3) {
                console.error('❌ All navigation methods failed, using Texas page as final fallback:', navError3);
                // Final safety net: redirect to a user-facing page
                window.location.href = '/texas';
              }
            }
          }
        }, 100); // 100ms delay to prevent "page can't be found" flash
      } else {
        // Handle different error types
        console.log('⚠️ ZIP lookup failed:', result);
        
        if (result.errorType === 'non_deregulated') {
          // Municipal utility area
          showError(result.error, 'municipal');
          // Optionally redirect after showing message
          setTimeout(() => {
            if (result.redirectUrl) {
              // Use browser's native navigation for municipal utilities too
              window.location = result.redirectUrl;
            }
          }, 3000);
        } else if (result.errorType === 'not_found') {
          // ZIP not found - provide helpful fallback
          showError(`${result.error} <a href="/electricity-plans" class="underline font-semibold hover:text-red-900">Browse all electricity plans →</a>`);
        } else if (result.errorType === 'invalid_zip') {
          // Invalid format
          showError(result.error);
          input.focus();
        } else {
          // Generic error
          showError('Unable to find plans for this ZIP code. Please try again or browse our Texas providers.');
        }
      }

    } catch (error) {
      setLoadingState(false);
      isSubmitting = false;
      console.error('❌ ZIP lookup API error:', error);
      
      // Check if this is a network or API error - if so, try fallback
      if (error.message.includes('API responded') || error.name === 'TypeError') {
        console.log('🔄 API failed, attempting robust fallback navigation');
        
        // Try to determine a sensible fallback page based on ZIP code
        let fallbackUrl = '/texas'; // Default fallback for Texas ZIPs
        
        // Show error instead of redirecting to generic pages
        showError('Unable to process your ZIP code right now. Please try again or <a href="/electricity-plans" class="underline font-semibold hover:text-red-900">browse all electricity plans →</a>');
        return;
      }
      
      showError('Unable to process your request right now. Please try again or <a href="/electricity-plans" class="underline font-semibold hover:text-red-900">browse all electricity plans →</a>');
    }
  });

    // Input formatting - only allow numeric input
    input.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
      
      // Clear errors when user starts typing again
      if (e.target.value.length > 0) {
        clearErrors();
      }
    });

    // Enhanced input validation with real-time feedback
    input.addEventListener('keypress', function(e) {
      // Only allow numeric characters
      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });

    // Removed auto-submit functionality - users must click button to navigate
    
    }); // End of forEach loop for each form
  } // End of initZipLookup function
})(); // End of IIFE
