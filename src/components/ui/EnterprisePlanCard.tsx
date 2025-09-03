import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardAction } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Icon } from './Icon';
import { PROVIDER_LOGO_URLS, PROVIDER_NAME_MAPPING } from '../../lib/logo/provider-mappings';

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
  // Use direct logo mapping with external URLs
  const getProviderLogo = (providerName: string) => {
    if (!providerName?.trim()) {
      return {
        logoUrl: null,
        fallbackIcon: 'zap',
        color: 'bg-texas-navy',
        textColor: 'text-white',
        name: 'Unknown Provider',
        actualLogoUrl: null
      };
    }
    
    // Normalize provider name to match our mapping
    const normalized = providerName.toLowerCase().trim();
    const mappedName = PROVIDER_NAME_MAPPING[normalized] || normalized.replace(/[^a-z0-9]+/g, '-');
    
    // Get logo URL from our comprehensive mapping
    const logoUrl = PROVIDER_LOGO_URLS[mappedName];
    
    // Return standardized format with external logo URL
    return {
      logoUrl: logoUrl || null,
      fallbackIcon: 'zap',
      color: 'bg-texas-navy', 
      textColor: 'text-white',
      name: providerName,
      actualLogoUrl: logoUrl || null
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
          {providerInfo.actualLogoUrl && !providerInfo.actualLogoUrl.startsWith('data:') ? (
            <img 
              src={providerInfo.actualLogoUrl} 
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
            className={`${providerInfo.color} ${providerInfo.textColor} p-2 rounded-lg flex items-center justify-center ${providerInfo.actualLogoUrl && !providerInfo.actualLogoUrl.startsWith('data:') ? 'hidden' : ''}`}
            style={{ display: providerInfo.actualLogoUrl && !providerInfo.actualLogoUrl.startsWith('data:') ? 'none' : 'flex' }}
          >
            {providerInfo.actualLogoUrl && providerInfo.actualLogoUrl.startsWith('data:') ? (
              <img 
                src={providerInfo.actualLogoUrl} 
                alt={`${providerInfo.name} logo`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Icon name={providerInfo.fallbackIcon as any} className="h-5 w-5" />
            )}
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
              window.location.href = `/electricity-plans/plans/${providerSlug}/${plan.slug}`;
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