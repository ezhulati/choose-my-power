import React from 'react';

interface EnhancedCardReactProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: 'navy' | 'red' | 'gold' | 'green';
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  accentColor?: 'navy' | 'red' | 'gold';
  className?: string;
  children: React.ReactNode;
}

export const EnhancedCardReact: React.FC<EnhancedCardReactProps> = ({
  title,
  subtitle,
  icon,
  iconColor = 'navy',
  variant = 'default',
  padding = 'lg',
  hoverEffect = true,
  accentColor = 'navy',
  className = '',
  children
}) => {
  // Icon color mappings
  const iconColors = {
    navy: 'text-texas-navy',
    red: 'text-texas-red', 
    gold: 'text-texas-gold',
    green: 'text-green-600'
  };

  // Icon background colors
  const iconBgColors = {
    navy: 'bg-texas-navy/10',
    red: 'bg-texas-red/10',
    gold: 'bg-texas-gold/10', 
    green: 'bg-green-500/10'
  };

  // Variant mappings
  const variants = {
    default: 'bg-white shadow-lg border border-gray-100',
    elevated: 'bg-white shadow-xl border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100'
  };

  // Padding mappings
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const hoverClasses = hoverEffect ? 'hover:shadow-xl transition-all duration-300' : '';

  return (
    <div className={`${variants[variant]} ${paddings[padding]} rounded-xl ${hoverClasses} ${className}`}>
      {(icon || title) && (
        <div className="flex items-start mb-6">
          {icon && (
            <div className={`w-12 h-12 ${iconBgColors[iconColor]} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
              <div className={`w-6 h-6 ${iconColors[iconColor]}`}>
                {icon}
              </div>
            </div>
          )}
          {title && (
            <div>
              <h3 className="text-2xl font-bold text-texas-navy mb-2">{title}</h3>
              {subtitle && (
                <p className="text-lg text-gray-700 leading-relaxed font-semibold">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default EnhancedCardReact;