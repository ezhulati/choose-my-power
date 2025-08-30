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
    // Pricing for different usage levels
    pricing?: {
      rate500kWh?: number;
      rate1000kWh?: number;
      rate2000kWh?: number;
    };
  };
  onViewDetails?: (plan: EnterprisePlanCardProps['plan']) => void;
  className?: string;
}

export const EnterprisePlanCard: React.FC<EnterprisePlanCardProps> = ({
  plan,
  onViewDetails,
  className = "",
}) => {
  // Real provider logo mapping from CompareMore CSV data
  const getProviderLogo = (providerName: string) => {
    const provider = providerName.toLowerCase();
    
    // Map Texas electricity providers to their actual CompareMore logo URLs
    if (provider.includes('frontier') || provider.includes('frontier utilities')) return { 
      logoUrl: 'https://assets.comparepower.com/images/frontier_utilities.svg',
      fallbackIcon: 'zap', 
      color: 'bg-blue-600', 
      textColor: 'text-white',
      name: 'Frontier Utilities' 
    };
    if (provider.includes('gexa')) return { 
      logoUrl: 'https://assets.comparepower.com/images/gexa_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-blue-500', 
      textColor: 'text-white',
      name: 'Gexa Energy' 
    };
    if (provider.includes('4change') || provider.includes('4 change')) return { 
      logoUrl: 'https://assets.comparepower.com/images/4change_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-green-600', 
      textColor: 'text-white',
      name: '4Change Energy' 
    };
    if (provider.includes('discount power')) return { 
      logoUrl: 'https://assets.comparepower.com/images/discount_power.svg',
      fallbackIcon: 'zap', 
      color: 'bg-orange-600', 
      textColor: 'text-white',
      name: 'Discount Power' 
    };
    if (provider.includes('cirro')) return { 
      logoUrl: 'https://assets.comparepower.com/images/cirro_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-purple-600', 
      textColor: 'text-white',
      name: 'Cirro Energy' 
    };
    if (provider.includes('apge')) return { 
      logoUrl: 'https://assets.comparepower.com/images/apge.svg',
      fallbackIcon: 'zap', 
      color: 'bg-indigo-600', 
      textColor: 'text-white',
      name: 'APGE' 
    };
    if (provider.includes('rhythm')) return { 
      logoUrl: 'https://assets.comparepower.com/images/rhythm_energy.svg',
      fallbackIcon: 'leaf', 
      color: 'bg-green-700', 
      textColor: 'text-white',
      name: 'Rhythm Energy' 
    };
    if (provider.includes('atlantex')) return { 
      logoUrl: 'https://assets.comparepower.com/images/atlantex_power.svg',
      fallbackIcon: 'star', 
      color: 'bg-blue-700', 
      textColor: 'text-white',
      name: 'Atlantex Power' 
    };
    if (provider.includes('just energy')) return { 
      logoUrl: 'https://assets.comparepower.com/images/just_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-red-600', 
      textColor: 'text-white',
      name: 'Just Energy' 
    };
    if (provider.includes('tara energy')) return { 
      logoUrl: 'https://assets.comparepower.com/images/tara_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-purple-500', 
      textColor: 'text-white',
      name: 'Tara Energy' 
    };
    if (provider.includes('reliant')) return { 
      logoUrl: 'https://assets.comparepower.com/images/reliant.svg',
      fallbackIcon: 'zap', 
      color: 'bg-blue-600', 
      textColor: 'text-white',
      name: 'Reliant Energy' 
    };
    if (provider.includes('direct energy')) return { 
      logoUrl: 'https://assets.comparepower.com/images/direct_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-orange-600', 
      textColor: 'text-white',
      name: 'Direct Energy' 
    };
    if (provider.includes('green mountain')) return { 
      logoUrl: 'https://assets.comparepower.com/images/green_mountain.svg',
      fallbackIcon: 'leaf', 
      color: 'bg-green-600', 
      textColor: 'text-white',
      name: 'Green Mountain Energy' 
    };
    if (provider.includes('amigo energy')) return { 
      logoUrl: 'https://assets.comparepower.com/images/amigo_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-yellow-600', 
      textColor: 'text-white',
      name: 'Amigo Energy' 
    };
    if (provider.includes('payless power')) return { 
      logoUrl: 'https://assets.comparepower.com/images/payless_power.svg',
      fallbackIcon: 'zap', 
      color: 'bg-red-500', 
      textColor: 'text-white',
      name: 'Payless Power' 
    };
    if (provider.includes('txu')) return { 
      logoUrl: 'https://assets.comparepower.com/images/txu_energy.svg',
      fallbackIcon: 'zap', 
      color: 'bg-red-600', 
      textColor: 'text-white',
      name: 'TXU Energy' 
    };
    
    // Default for unknown providers
    return { 
      logoUrl: null,
      fallbackIcon: 'zap', 
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


  // Format rate display
  const formatRate = (rate: number | string) => {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? 'Call for Rate' : `${numRate.toFixed(1)}¢`;
  };

  const providerInfo = getProviderLogo(plan.provider);
  const planTypeInfo = getPlanTypeInfo(plan.planType);

  return (
    <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 hover:border-texas-navy/30 bg-white ${className}`}>
      {/* Provider Header - Stacked Layout */}
      <CardHeader className="p-4 pb-1 text-center">
        {/* Provider Logo */}
        <div className="w-20 h-12 mx-auto mb-2 flex items-center justify-center bg-transparent overflow-hidden">
          {providerInfo.logoUrl ? (
            <img 
              src={providerInfo.logoUrl} 
              alt={`${providerInfo.name} logo`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Fallback to icon if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`${providerInfo.color} ${providerInfo.textColor} p-2 rounded-lg flex items-center justify-center ${providerInfo.logoUrl ? 'hidden' : ''}`}
            style={{ display: providerInfo.logoUrl ? 'none' : 'flex' }}
          >
            <Icon name={providerInfo.fallbackIcon as any} className="h-5 w-5" />
          </div>
        </div>
        
        {/* Provider Name */}
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {providerInfo.name}
        </div>
        
        {/* Plan Name */}
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2">
          {plan.name}
        </h3>
        
        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-1 mb-1">
          {/* Green Energy Badge */}
          {plan.greenEnergy && (
            <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] font-medium px-2 py-1">
              100% Green Energy
            </Badge>
          )}
          
          {/* No Deposit Badge - Only for prepaid or variable month-to-month plans */}
          {(plan.planType === 'variable' && plan.contractTerm?.toLowerCase().includes('month-to-month')) && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-medium px-2 py-1">
              No Deposit
            </Badge>
          )}
          
          {/* Top Rated Badge */}
          {plan.topRated && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] font-medium px-2 py-1">
              Top Rated
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Plan Details */}
      <CardContent className="px-4 pb-0 pt-0 space-y-0">

        {/* Pricing Table for Different Usage Levels */}
        <div className="bg-gray-50 rounded-lg border p-3 mb-3">
          <div className="text-[10px] font-medium text-gray-600 mb-2 text-center">Monthly Usage Pricing</div>
          <div className="grid grid-cols-3 gap-1">
            <div className="text-center py-1.5 bg-white rounded border">
              <div className="text-sm font-bold text-texas-navy">
                {plan.pricing?.rate500kWh ? `${plan.pricing.rate500kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="text-[9px] text-gray-600">500 kWh</div>
            </div>
            <div className="text-center py-1.5 bg-white rounded border border-texas-navy">
              <div className="text-sm font-bold text-texas-navy">
                {plan.pricing?.rate1000kWh ? `${plan.pricing.rate1000kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="text-[9px] text-texas-navy font-medium">1000 kWh</div>
            </div>
            <div className="text-center py-1.5 bg-white rounded border">
              <div className="text-sm font-bold text-texas-navy">
                {plan.pricing?.rate2000kWh ? `${plan.pricing.rate2000kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="text-[9px] text-gray-600">2000 kWh</div>
            </div>
          </div>
          
          {/* Monthly Bill Totals */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-[9px] font-medium text-gray-500 mb-1 text-center">Estimated Monthly Bill</div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="text-xs font-semibold text-gray-700">
                ${plan.pricing?.rate500kWh ? ((plan.pricing.rate500kWh * 500) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 500) / 100)}
              </div>
              <div className="text-xs font-semibold text-texas-navy">
                ${plan.pricing?.rate1000kWh ? ((plan.pricing.rate1000kWh * 1000) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 1000) / 100)}
              </div>
              <div className="text-xs font-semibold text-gray-700">
                ${plan.pricing?.rate2000kWh ? ((plan.pricing.rate2000kWh * 2000) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 2000) / 100)}
              </div>
            </div>
          </div>
        </div>

        {/* Contract & Type Info */}
        <div className="grid grid-cols-2 gap-2 text-center mt-3">
          <div className="py-1.5 px-2 bg-white border rounded-lg">
            <div className="text-sm font-semibold text-gray-900">{plan.contractTerm}</div>
            <div className="text-[10px] text-gray-500">Contract</div>
          </div>
          <div className="py-1.5 px-2 bg-white border rounded-lg">
            <div className="text-sm font-semibold text-gray-900">{planTypeInfo.label}</div>
            <div className="text-[10px] text-gray-500">Rate Type</div>
          </div>
        </div>

      </CardContent>

      {/* CTA Button */}
      <CardFooter className="p-4 pt-2">
        <Button
          onClick={() => {
            if (onViewDetails) {
              onViewDetails(plan);
            } else {
              // Fallback navigation when onViewDetails is not provided
              const providerSlug = plan.provider.toLowerCase().replace(/\s+/g, '-');
              window.location.href = `/electricity-plans/${providerSlug}/${plan.slug}`;
            }
          }}
          className="w-full bg-texas-red hover:bg-texas-red-600 text-white font-semibold py-3 text-sm rounded-lg transition-all duration-200"
        >
          View Details
          <Icon name="arrow-right" className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};