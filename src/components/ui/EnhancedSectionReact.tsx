import React from 'react';

interface EnhancedSectionReactProps {
  title?: string;
  subtitle?: string;
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'cream' | 'gradient-navy' | 'gradient-gold';
  titleColor?: 'navy' | 'red' | 'gold';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  centerContent?: boolean;
  children: React.ReactNode;
}

export const EnhancedSectionReact: React.FC<EnhancedSectionReactProps> = ({
  title,
  subtitle,
  titleSize = 'lg',
  background = 'white',
  titleColor = 'navy',
  padding = 'lg',
  maxWidth = '7xl',
  centerContent = true,
  children
}) => {
  // Title size mappings
  const titleSizes = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-3xl md:text-4xl lg:text-5xl',
    xl: 'text-4xl md:text-5xl lg:text-6xl'
  };

  // Background mappings
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    cream: 'bg-gradient-to-b from-texas-cream/30 to-white',
    'gradient-navy': 'bg-gradient-to-br from-texas-navy via-blue-900 to-texas-navy',
    'gradient-gold': 'bg-gradient-to-br from-texas-gold-50 to-texas-cream'
  };

  // Title color mappings
  const titleColors = {
    navy: 'text-texas-navy',
    red: 'text-texas-red',
    gold: 'text-texas-gold'
  };

  // Padding mappings
  const paddings = {
    sm: 'py-12',
    md: 'py-16', 
    lg: 'py-20',
    xl: 'py-24'
  };

  // Max width mappings
  const maxWidths = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <section className={`${backgrounds[background]} ${paddings[padding]}`}>
      <div className={`${maxWidths[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8`}>
        {(title || subtitle) && (
          <div className={`mb-16 ${centerContent ? 'text-center' : ''}`}>
            {title && (
              <h2 className={`${titleSizes[titleSize]} font-bold ${titleColors[titleColor]} mb-6 leading-tight`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
                 dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            )}
          </div>
        )}
        
        {children}
      </div>
    </section>
  );
};

export default EnhancedSectionReact;