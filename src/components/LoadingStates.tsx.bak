/**
 * Professional Loading States Component Suite
 * 
 * Complete collection of loading indicators and animations designed for
 * the ChooseMyPower electricity plan search system. Features Texas-themed
 * branding, accessibility compliance, and smooth animations.
 * 
 * Components:
 * - ElectricitySearchLoader: Main search loading animation
 * - PlanCardSkeleton: Plan card placeholder loading
 * - FiltersSkeleton: Filters sidebar loading
 * - ProgressiveLoader: Multi-step loading with progress
 * - PulseLoader: Simple pulsing animation
 * - SpinnerLoader: Traditional spinner variations
 * - TextShimmer: Shimmer effect for text placeholders
 * - DataTableSkeleton: Table/grid loading states
 * 
 * @module LoadingStates
 */

import React, { useEffect, useState } from 'react';
import {
  Zap,
  Search,
  MapPin,
  Home,
  Building,
  Filter,
  Star,
  Calendar,
  DollarSign,
  Leaf,
  Clock,
  CheckCircle,
  TrendingUp,
  Loader2,
  BarChart3,
  Grid,
  List,
  Compare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Main Loading States Component
export interface LoadingStatesProps {
  /** Type of loading animation to show */
  type?: 'search' | 'plans' | 'filters' | 'progressive' | 'pulse' | 'spinner' | 'shimmer' | 'table';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual variant with Texas branding */
  variant?: 'default' | 'texas' | 'minimal' | 'hero';
  /** Custom message to show */
  message?: string;
  /** Show progress indicator (for progressive type) */
  showProgress?: boolean;
  /** Current progress (0-100) */
  progress?: number;
  /** Loading step information */
  steps?: string[];
  /** Current step index */
  currentStep?: number;
  /** Custom CSS classes */
  className?: string;
  /** Fullscreen overlay */
  overlay?: boolean;
  /** Animation duration in ms */
  duration?: number;
}

export function LoadingStates({
  type = 'search',
  size = 'md',
  variant = 'texas',
  message,
  showProgress = false,
  progress = 0,
  steps = [],
  currentStep = 0,
  className,
  overlay = false,
  duration = 2000
}: LoadingStatesProps) {
  const LoaderComponent = getLoaderComponent(type);
  
  const baseClass = cn(
    'flex flex-col items-center justify-center',
    overlay && 'fixed inset-0 bg-white/90 backdrop-blur-sm z-50',
    className
  );

  return (
    <div className={baseClass}>
      <LoaderComponent
        size={size}
        variant={variant}
        message={message}
        showProgress={showProgress}
        progress={progress}
        steps={steps}
        currentStep={currentStep}
        duration={duration}
      />
    </div>
  );
}

// Get the appropriate loader component
function getLoaderComponent(type: string) {
  switch (type) {
    case 'search':
      return ElectricitySearchLoader;
    case 'plans':
      return PlanCardSkeleton;
    case 'filters':
      return FiltersSkeleton;
    case 'progressive':
      return ProgressiveLoader;
    case 'pulse':
      return PulseLoader;
    case 'spinner':
      return SpinnerLoader;
    case 'shimmer':
      return TextShimmer;
    case 'table':
      return DataTableSkeleton;
    default:
      return ElectricitySearchLoader;
  }
}

// Electricity Search Loader - Main loading animation
interface ElectricitySearchLoaderProps {
  size: string;
  variant: string;
  message?: string;
  duration: number;
}

function ElectricitySearchLoader({ 
  size, 
  variant, 
  message = 'Getting all your options ready...', 
  duration 
}: ElectricitySearchLoaderProps) {
  const [currentIcon, setCurrentIcon] = useState(0);
  
  const icons = [
    { Icon: MapPin, label: 'Looking up your area' },
    { Icon: Search, label: 'Finding all your plans' },
    { Icon: Zap, label: 'Comparing prices' },
    { Icon: Building, label: 'Checking your utility' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, duration / icons.length);

    return () => clearInterval(interval);
  }, [duration, icons.length]);

  const sizeConfig = {
    sm: { container: 'p-6', icon: 'h-8 w-8', text: 'text-sm' },
    md: { container: 'p-8', icon: 'h-12 w-12', text: 'text-base' },
    lg: { container: 'p-12', icon: 'h-16 w-16', text: 'text-lg' },
    xl: { container: 'p-16', icon: 'h-20 w-20', text: 'text-xl' }
  };

  const variantConfig = {
    default: {
      container: 'bg-background border border-input rounded-lg',
      icon: 'text-primary',
      text: 'text-foreground'
    },
    texas: {
      container: 'bg-gradient-to-br from-texas-cream-50 to-white border-2 border-texas-navy/20 rounded-xl shadow-lg',
      icon: 'text-texas-navy',
      text: 'text-texas-navy'
    },
    minimal: {
      container: 'bg-gray-50 rounded-lg',
      icon: 'text-gray-600',
      text: 'text-gray-600'
    },
    hero: {
      container: 'bg-gradient-to-br from-texas-gold/10 to-texas-navy/5 border border-texas-gold/30 rounded-2xl shadow-xl',
      icon: 'text-texas-gold-700',
      text: 'text-texas-navy'
    }
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];
  const style = variantConfig[variant as keyof typeof variantConfig];
  const { Icon, label } = icons[currentIcon];

  return (
    <Card className={cn(style.container, config.container)}>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className={cn(
            'relative z-10 animate-pulse',
            config.icon,
            style.icon
          )}>
            <Icon className="w-full h-full" />
          </div>
          
          {/* Ripple Effect */}
          <div className="absolute inset-0 -m-4">
            <div className={cn(
              'w-full h-full rounded-full border-2 animate-ping opacity-30',
              variant === 'texas' ? 'border-texas-navy' : 'border-current'
            )} />
          </div>
          
          {/* Electric Sparks */}
          {variant === 'texas' && (
            <>
              <div className="absolute -top-2 -right-2 text-texas-gold animate-bounce">
                <Zap className="h-4 w-4" />
              </div>
              <div className="absolute -bottom-2 -left-2 text-texas-gold animate-bounce delay-500">
                <Zap className="h-3 w-3" />
              </div>
            </>
          )}
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <div className={cn('font-medium', config.text, style.text)}>
            {message}
          </div>
          <div className={cn('text-sm opacity-70 animate-fade-in', style.text)}>
            {label}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2">
          {icons.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentIcon 
                  ? variant === 'texas' ? 'bg-texas-navy' : 'bg-primary'
                  : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Plan Card Skeleton - Loading placeholder for plan cards
function PlanCardSkeleton({ size }: { size: string }) {
  const sizeConfig = {
    sm: 'p-4 space-y-3',
    md: 'p-6 space-y-4',
    lg: 'p-8 space-y-6',
    xl: 'p-10 space-y-8'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded" />
                <div className="h-8 w-8 bg-gray-200 rounded" />
              </div>
            </div>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center space-y-1">
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-12 mx-auto" />
              </div>
              <div className="text-center space-y-1">
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-14 mx-auto" />
              </div>
            </div>
            
            {/* Feature Badges */}
            <div className="flex gap-2 mt-3">
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-18" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// Filters Skeleton - Loading placeholder for filters sidebar
function FiltersSkeleton({ size }: { size: string }) {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-24" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 5 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded flex-1" />
                  <div className="h-4 bg-gray-200 rounded w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Progressive Loader - Multi-step loading with progress
interface ProgressiveLoaderProps {
  steps: string[];
  currentStep: number;
  progress: number;
  showProgress: boolean;
  variant: string;
  size: string;
}

function ProgressiveLoader({ 
  steps, 
  currentStep, 
  progress, 
  showProgress, 
  variant, 
  size 
}: ProgressiveLoaderProps) {
  const defaultSteps = [
    'Looking up your neighborhood...',
    'Finding who serves you...',
    'Getting all the plans...',
    'Comparing prices...',
    'Almost ready...'
  ];

  const displaySteps = steps.length > 0 ? steps : defaultSteps;

  const sizeConfig = {
    sm: { container: 'p-4', text: 'text-sm', icon: 'h-5 w-5' },
    md: { container: 'p-6', text: 'text-base', icon: 'h-6 w-6' },
    lg: { container: 'p-8', text: 'text-lg', icon: 'h-7 w-7' },
    xl: { container: 'p-10', text: 'text-xl', icon: 'h-8 w-8' }
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];

  return (
    <Card className={cn(
      variant === 'texas' && 'border-2 border-texas-navy/20 bg-gradient-to-br from-texas-cream-50 to-white',
      config.container
    )}>
      <CardContent className="space-y-6">
        {/* Main Progress Circle */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (showProgress ? progress : (currentStep + 1)) / (showProgress ? 100 : displaySteps.length))}`}
                className={cn(
                  'transition-all duration-500 ease-out',
                  variant === 'texas' ? 'text-texas-navy' : 'text-primary'
                )}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className={cn(
                'animate-pulse',
                config.icon,
                variant === 'texas' ? 'text-texas-gold' : 'text-primary'
              )} />
            </div>
          </div>

          {showProgress && (
            <div className={cn('font-semibold', config.text)}>
              {Math.round(progress)}%
            </div>
          )}
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {displaySteps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                index < currentStep && 'opacity-50',
                index === currentStep && 'opacity-100',
                index > currentStep && 'opacity-30'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm',
                index < currentStep && (variant === 'texas' ? 'bg-texas-navy text-white' : 'bg-primary text-primary-foreground'),
                index === currentStep && (variant === 'texas' ? 'border-2 border-texas-navy' : 'border-2 border-primary'),
                index > currentStep && 'border-2 border-gray-300'
              )}>
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : index === currentStep ? (
                  <div className={cn(
                    'w-2 h-2 rounded-full animate-pulse',
                    variant === 'texas' ? 'bg-texas-navy' : 'bg-primary'
                  )} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              
              <span className={cn(
                'transition-all duration-300',
                config.text,
                index === currentStep && 'font-medium',
                variant === 'texas' ? 'text-texas-navy' : 'text-foreground'
              )}>
                {step}
              </span>
              
              {index === currentStep && (
                <Loader2 className={cn(
                  'h-4 w-4 animate-spin ml-auto',
                  variant === 'texas' ? 'text-texas-navy' : 'text-primary'
                )} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Pulse Loader - Simple pulsing animation
function PulseLoader({ size, variant }: { size: string; variant: string }) {
  const sizeConfig = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={cn(
        'rounded-full animate-pulse',
        sizeConfig[size as keyof typeof sizeConfig],
        variant === 'texas' ? 'bg-texas-navy' : 'bg-primary'
      )} />
      <div className="flex space-x-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full animate-bounce',
              variant === 'texas' ? 'bg-texas-gold' : 'bg-primary'
            )}
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// Spinner Loader - Traditional spinner variations
function SpinnerLoader({ size, variant }: { size: string; variant: string }) {
  const sizeConfig = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className={cn(
        'animate-spin',
        sizeConfig[size as keyof typeof sizeConfig],
        variant === 'texas' ? 'text-texas-navy' : 'text-primary'
      )} />
      <div className={cn(
        'text-sm animate-pulse',
        variant === 'texas' ? 'text-texas-navy' : 'text-muted-foreground'
      )}>
        One sec...
      </div>
    </div>
  );
}

// Text Shimmer - Shimmer effect for text placeholders
function TextShimmer({ size }: { size: string }) {
  const sizeConfig = {
    sm: { line: 'h-3', spacing: 'space-y-2' },
    md: { line: 'h-4', spacing: 'space-y-3' },
    lg: { line: 'h-5', spacing: 'space-y-4' },
    xl: { line: 'h-6', spacing: 'space-y-5' }
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];

  return (
    <div className={cn('w-full max-w-md', config.spacing)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer',
            config.line,
            index === 0 && 'w-3/4',
            index === 1 && 'w-full',
            index === 2 && 'w-5/6',
            index === 3 && 'w-4/5',
            index === 4 && 'w-2/3'
          )}
          style={{
            backgroundSize: '200% 100%',
            animation: `shimmer 1.5s infinite linear ${index * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}

// Data Table Skeleton - Table/grid loading states
function DataTableSkeleton({ size }: { size: string }) {
  const sizeConfig = {
    sm: { cell: 'h-4', padding: 'p-2' },
    md: { cell: 'h-5', padding: 'p-3' },
    lg: { cell: 'h-6', padding: 'p-4' },
    xl: { cell: 'h-7', padding: 'p-5' }
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];

  return (
    <Card>
      <CardContent className={config.padding}>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'bg-gray-200 rounded animate-pulse',
                  config.cell
                )}
              />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, cellIndex) => (
                <div
                  key={cellIndex}
                  className={cn(
                    'bg-gray-100 rounded animate-pulse',
                    config.cell
                  )}
                  style={{
                    animationDelay: `${(rowIndex * 5 + cellIndex) * 0.05}s`
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Add shimmer keyframes to global styles (this would typically be in CSS)
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .animate-shimmer {
    animation: shimmer 1.5s infinite linear;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// Inject styles (in a real app, this would be in CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
}

// Export individual components for direct use
export {
  ElectricitySearchLoader,
  PlanCardSkeleton,
  FiltersSkeleton,
  ProgressiveLoader,
  PulseLoader,
  SpinnerLoader,
  TextShimmer,
  DataTableSkeleton
};

// Export with display name
LoadingStates.displayName = 'LoadingStates';