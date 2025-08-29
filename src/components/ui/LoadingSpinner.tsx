/**
 * LoadingSpinner Component
 * Reusable loading spinner with different sizes and messages
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-texas-navy border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <div className={`loading-spinner ${className}`} role="status" aria-live="polite">
      <div 
        className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-hidden="true"
      >
      </div>
      {message && (
        <span className="spinner-message" aria-live="polite">
          {message}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;

// Component styles
const styles = `
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  border: 2px solid;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('loading-spinner-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'loading-spinner-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}