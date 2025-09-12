import React from 'react';
import { Z_INDEX, zIndexClass } from '../../lib/design-system/z-index-scale';
import { cn } from '../../lib/utils';

export interface ProfessionalHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'city' | 'state' | 'compare' | 'minimal';
  location?: string;
}

export function ProfessionalHero({
  title,
  subtitle,
  backgroundImage,
  overlayOpacity = 0.6,
  className,
  children,
  variant = 'default',
  location
}: ProfessionalHeroProps) {
  
  // Professional gradient backgrounds based on variant
  const getBackgroundStyle = () => {
    if (backgroundImage) {
      return {
        backgroundImage: `
          linear-gradient(135deg, 
            rgba(0, 40, 104, ${overlayOpacity}) 0%, 
            rgba(30, 64, 175, ${overlayOpacity - 0.1}) 35%, 
            rgba(190, 11, 49, ${overlayOpacity - 0.2}) 100%
          ),
          url('${backgroundImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    // Professional gradients by variant
    const gradients = {
      default: 'linear-gradient(135deg, #002768 0%, #1e40af 35%, #be0b31 100%)',
      city: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #7c2d12 100%)',
      state: 'linear-gradient(135deg, #be0b31 0%, #dc2626 35%, #002768 100%)',
      compare: 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #7c3aed 100%)',
      minimal: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    };

    return {
      background: gradients[variant],
    };
  };

  const getTextColor = () => {
    return variant === 'minimal' ? 'text-gray-900' : 'text-white';
  };

  const getSubtitleColor = () => {
    return variant === 'minimal' ? 'text-gray-600' : 'text-white/90';
  };

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        zIndexClass('BACKGROUND_IMAGE'),
        className
      )}
      style={getBackgroundStyle()}
    >
      {/* Professional overlay pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content container */}
      <div 
        className={cn(
          "relative min-h-[400px] flex items-center justify-center",
          zIndexClass('CONTENT')
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center">
            {/* Location breadcrumb for city/state pages */}
            {location && (
              <div className={cn("mb-4", getSubtitleColor())}>
                <span className="text-sm font-medium opacity-90">
                  Texas → {location}
                </span>
              </div>
            )}

            {/* Main title */}
            <h1 className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight",
              getTextColor()
            )}>
              <span className="block">{title}</span>
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className={cn(
                "text-xl md:text-2xl max-w-4xl mx-auto mb-12 leading-relaxed",
                getSubtitleColor()
              )}>
                {subtitle}
              </p>
            )}

            {/* Children content (search forms, CTAs, etc.) */}
            {children && (
              <div className="flex flex-col items-center space-y-8">
                {children}
              </div>
            )}

            {/* Professional accent elements */}
            <div className="mt-16 flex justify-center items-center space-x-8 opacity-70">
              <div className={cn("text-sm font-medium", getSubtitleColor())}>
                Trusted by 50,000+ Texas residents
              </div>
              <div className={cn("w-px h-6 bg-current opacity-30")} />
              <div className={cn("text-sm font-medium", getSubtitleColor())}>
                Compare 100+ providers
              </div>
              <div className={cn("w-px h-6 bg-current opacity-30")} />
              <div className={cn("text-sm font-medium", getSubtitleColor())}>
                Save $200+ annually
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}