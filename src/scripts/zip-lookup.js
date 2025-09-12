// Enhanced ZIP code form with API-based lookup and comprehensive error handling
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('zipForm');
  const input = document.getElementById('zipInput');
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Loading state management
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

  // Error display management
  function showError(message, type = 'error') {
    // Clear all existing error messages first
    clearErrors();

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'zip-error-message mt-4 p-4 rounded-lg text-sm';
    
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

  // Clear any error messages - improved to handle multiple messages
  function clearErrors() {
    // Remove all error messages that might exist
    const existingErrors = document.querySelectorAll('.zip-error-message');
    existingErrors.forEach(error => {
      if (error.parentNode) {
        error.remove();
      }
    });
  }

  // Form submission handler with duplicate prevention
  let isSubmitting = false;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
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
      // Call our ZIP lookup API
      const response = await fetch(`/api/zip-lookup?zip=${encodeURIComponent(zipCode)}`);
      const result = await response.json();

      setLoadingState(false);
      isSubmitting = false;

      if (result.success) {
        // Success - use reliable form-based navigation
        
        // Show success feedback briefly
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
        
        // Use browser's native navigation for most reliable experience
        // This avoids JavaScript navigation issues entirely
        window.location = result.redirectUrl;
      } else {
        // Handle different error types
        
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
          showError(`${result.error} <a href="/texas/electricity-providers" class="underline font-semibold hover:text-red-900">Browse all Texas providers →</a>`);
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
      showError('Unable to process your request right now. Please try again or <a href="/texas/electricity-providers" class="underline font-semibold hover:text-red-900">browse all Texas providers →</a>');
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

  // Auto-submit on 5 digits (optional UX enhancement)
  let autoSubmitTimeout = null;
  input.addEventListener('input', function(e) {
    // Clear any pending auto-submit
    if (autoSubmitTimeout) {
      clearTimeout(autoSubmitTimeout);
      autoSubmitTimeout = null;
    }
    
    if (e.target.value.length === 5) {
      // Small delay to let user see the complete ZIP code
      autoSubmitTimeout = setTimeout(() => {
        if (!submitButton.disabled) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
        autoSubmitTimeout = null;
      }, 500);
    }
  });
});