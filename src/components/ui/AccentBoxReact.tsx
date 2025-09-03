import React from 'react';

interface AccentBoxReactProps {
  accentColor?: 'navy' | 'red' | 'gold' | 'green';
  background?: 'light' | 'white';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const AccentBoxReact: React.FC<AccentBoxReactProps> = ({
  accentColor = 'navy',
  background = 'light',
  padding = 'md',
  className = '',
  children
}) => {
  // Accent color mappings
  const accentColors = {
    navy: 'border-l-texas-navy',
    red: 'border-l-texas-red', 
    gold: 'border-l-texas-gold',
    green: 'border-l-green-600'
  };

  // Background color mappings for accent boxes
  const backgrounds = {
    light: {
      navy: 'bg-texas-navy/5',
      red: 'bg-texas-red/5',
      gold: 'bg-texas-gold/5', 
      green: 'bg-green-500/5'
    },
    white: 'bg-white'
  };

  // Padding mappings
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const bgClass = background === 'white' ? backgrounds.white : backgrounds.light[accentColor];

  return (
    <div className={`${bgClass} rounded-lg ${paddings[padding]} border-l-4 ${accentColors[accentColor]} ${className}`}>
      {children}
    </div>
  );
};

export default AccentBoxReact;