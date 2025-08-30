import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardAction } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Icon } from './Icon';

interface EnterprisePlanCardProps {
  plan: {
    id: string;
    name: string;
    provider: string;
    rate: number | string;
    contractTerm: string;
    planType: 'fixed' | 'variable' | 'indexed';
    greenEnergy?: boolean;
    noDeposit?: boolean;
    topRated?: boolean;
    features?: string[];
    slug: string;
  };
  onViewDetails: (plan: EnterprisePlanCardProps['plan']) => void;
  className?: string;
}

export const EnterprisePlanCard: React.FC<EnterprisePlanCardProps> = ({
  plan,
  onViewDetails,
  className = "",
}) => {
  // Professional provider logo mapping
  const getProviderLogo = (providerName: string) => {
    const provider = providerName.toLowerCase();
    
    // Map common Texas electricity providers to their brand colors and icons
    if (provider.includes('reliant')) return { 
      icon: 'zap', 
      color: 'bg-blue-600', 
      textColor: 'text-white',
      name: 'Reliant Energy' 
    };
    if (provider.includes('txu')) return { 
      icon: 'zap', 
      color: 'bg-red-600', 
      textColor: 'text-white',
      name: 'TXU Energy' 
    };
    if (provider.includes('direct')) return { 
      icon: 'zap', 
      color: 'bg-orange-600', 
      textColor: 'text-white',
      name: 'Direct Energy' 
    };
    if (provider.includes('green mountain')) return { 
      icon: 'leaf', 
      color: 'bg-green-600', 
      textColor: 'text-white',
      name: 'Green Mountain Energy' 
    };
    if (provider.includes('constellation')) return { 
      icon: 'star', 
      color: 'bg-indigo-600', 
      textColor: 'text-white',
      name: 'Constellation Energy' 
    };
    if (provider.includes('stream')) return { 
      icon: 'zap', 
      color: 'bg-teal-600', 
      textColor: 'text-white',
      name: 'Stream Energy' 
    };
    
    // Default for unknown providers
    return { 
      icon: 'zap', 
      color: 'bg-texas-navy', 
      textColor: 'text-white',
      name: providerName 
    };
  };

  // Get rate type styling based on plan type
  const getPlanTypeInfo = (type: 'fixed' | 'variable' | 'indexed') => {
    switch (type) {
      case 'fixed':
        return {
          label: 'Fixed Rate',
          description: 'Rate locked for contract term',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: 'shield'
        };
      case 'variable':
        return {
          label: 'Variable Rate',
          description: 'Rate may change monthly',
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: 'trending-up'
        };
      case 'indexed':
        return {
          label: 'Indexed Rate',
          description: 'Follows wholesale market',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: 'bar-chart'
        };
      default:
        return {
          label: 'Fixed Rate',
          description: 'Rate locked for contract term',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: 'shield'
        };
    }
  };

  // Get special badge for premium features
  const getSpecialBadge = () => {
    if (plan.greenEnergy) return { 
      text: "100% Green Energy", 
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 border-green-300",
      icon: "leaf"
    };
    if (plan.topRated) return { 
      text: "Top Rated Provider", 
      variant: "secondary" as const,
      className: "bg-texas-gold-100 text-texas-navy border-texas-gold-300",
      icon: "star"
    };
    if (plan.noDeposit) return { 
      text: "No Deposit Required", 
      variant: "outline" as const,
      className: "bg-texas-red-50 text-texas-red-700 border-texas-red-200",
      icon: "shield"
    };
    return null;
  };

  // Format rate display
  const formatRate = (rate: number | string) => {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? 'Call for Rate' : `${numRate.toFixed(1)}¢`;
  };

  const providerInfo = getProviderLogo(plan.provider);
  const planTypeInfo = getPlanTypeInfo(plan.planType);
  const specialBadge = getSpecialBadge();

  return (
    <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 hover:border-texas-navy/30 bg-white ${className}`}>
      {/* Provider Header */}
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${providerInfo.color} ${providerInfo.textColor} p-2 rounded-lg`}>
              <Icon name={providerInfo.icon as any} className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold text-gray-900">
              {providerInfo.name}
            </div>
          </div>
          {specialBadge && (
            <Badge className={`${specialBadge.className} text-xs font-medium px-2 py-1`}>
              {specialBadge.text}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Plan Details */}
      <CardContent className="p-6 pt-0 space-y-4">
        {/* Plan Name */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug">
          {plan.name}
        </h3>

        {/* Rate Display */}
        <div className="text-center py-4 bg-gray-50 rounded-lg border">
          <div className="text-3xl font-black text-texas-navy">
            {formatRate(plan.rate)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            per kWh
          </div>
        </div>

        {/* Contract & Type Info */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="py-2 px-3 bg-white border rounded-lg">
            <div className="text-sm font-semibold text-gray-900">{plan.contractTerm}</div>
            <div className="text-xs text-gray-500">Contract</div>
          </div>
          <div className="py-2 px-3 bg-white border rounded-lg">
            <div className="text-sm font-semibold text-gray-900">{planTypeInfo.label}</div>
            <div className="text-xs text-gray-500">Rate Type</div>
          </div>
        </div>

        {/* Features - Only show unique ones, avoid redundancy */}
        {plan.features && plan.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {plan.features
              .filter(feature => 
                // Remove redundant features that match plan type or special badge
                !feature.toLowerCase().includes(planTypeInfo.label.toLowerCase()) &&
                (!specialBadge || !feature.toLowerCase().includes(specialBadge.text.toLowerCase().split(' ')[0]))
              )
              .slice(0, 3)
              .map((feature, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))
            }
          </div>
        )}
      </CardContent>

      {/* CTA Button */}
      <CardFooter className="p-6 pt-0">
        <Button
          onClick={() => onViewDetails(plan)}
          className="w-full bg-texas-red hover:bg-texas-red-600 text-white font-semibold py-3 text-sm rounded-lg transition-all duration-200"
        >
          View Details
          <Icon name="arrow-right" className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};