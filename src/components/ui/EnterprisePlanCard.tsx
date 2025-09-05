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
    <Card className={`group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-2 border-gray-200 hover:border-texas-gold bg-gradient-to-br from-white to-gray-50 relative overflow-hidden ${className}`}>
      {/* Texas Brand Accent Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-texas-navy via-texas-red to-texas-gold"></div>
      
      {/* Provider Header - Stacked Layout */}
      <CardHeader className="p-6 pb-3 text-center relative">
        {/* Provider Logo with Enhanced Styling */}
        <div className="w-24 h-14 mx-auto mb-3 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
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
            className={`${providerInfo.color} ${providerInfo.textColor} p-3 rounded-xl flex items-center justify-center shadow-sm ${providerInfo.actualLogoUrl && !providerInfo.actualLogoUrl.startsWith('data:') ? 'hidden' : ''}`}
            style={{ display: providerInfo.actualLogoUrl && !providerInfo.actualLogoUrl.startsWith('data:') ? 'none' : 'flex' }}
          >
            {providerInfo.actualLogoUrl && providerInfo.actualLogoUrl.startsWith('data:') ? (
              <img 
                src={providerInfo.actualLogoUrl} 
                alt={`${providerInfo.name} logo`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Icon name={providerInfo.fallbackIcon as any} className="h-6 w-6" />
            )}
          </div>
        </div>
        
        {/* Provider Name */}
        <div className="text-sm font-bold text-texas-navy mb-2">
          {providerInfo.name}
        </div>
        
        {/* Plan Name */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3">
          {plan.name}
        </h3>
        
        {/* Feature Badges - Enhanced with Texas Design System */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {/* Green Energy Badge */}
          {plan.greenEnergy && (
            <Badge className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <Icon name="leaf" className="h-3 w-3 mr-1" />
              100% Green
            </Badge>
          )}
          
          {/* No Deposit Badge */}
          {plan.noDeposit && (
            <Badge className="bg-gradient-to-r from-texas-gold/20 to-texas-gold/10 text-texas-gold border-texas-gold/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <Icon name="shield" className="h-3 w-3 mr-1" />
              No Deposit
            </Badge>
          )}
          
          {/* Top Rated Badge */}
          {plan.topRated && (
            <Badge className="bg-gradient-to-r from-texas-red/20 to-texas-red/10 text-texas-red border-texas-red/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <Icon name="star" className="h-3 w-3 mr-1" />
              Top Rated
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Plan Details */}
      <CardContent className="px-6 pb-0 pt-0 space-y-0">

        {/* Enhanced Pricing Table with Texas Design System - Vertical Stack */}
        <div className="bg-gradient-to-r from-gray-50 to-texas-cream/20 rounded-xl border-2 border-gray-200 p-4 mb-4 shadow-sm">
          <div className="text-xs font-bold text-texas-navy mb-3 text-center">Monthly Usage Pricing</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-base font-bold text-gray-900">
                {plan.pricing?.rate500kWh ? `${plan.pricing.rate500kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="text-xs text-gray-600 font-medium">500 kWh</div>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gradient-to-r from-texas-navy to-blue-800 text-white rounded-lg border-2 border-texas-navy shadow-md">
              <div className="text-base font-bold">
                {plan.pricing?.rate1000kWh ? `${plan.pricing.rate1000kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="flex flex-col text-right">
                <div className="text-xs font-semibold">1000 kWh</div>
                <div className="text-[10px] opacity-90">Most Common</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-base font-bold text-gray-900">
                {plan.pricing?.rate2000kWh ? `${plan.pricing.rate2000kWh.toFixed(1)}¢` : formatRate(plan.rate)}
              </div>
              <div className="text-xs text-gray-600 font-medium">2000 kWh</div>
            </div>
          </div>
          
          {/* Enhanced Monthly Bill Totals - Vertical Stack */}
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-xs font-bold text-gray-700 mb-2 text-center">Estimated Monthly Bill</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1 px-2">
                <div className="text-sm font-bold text-gray-700">
                  ${plan.pricing?.rate500kWh ? ((plan.pricing.rate500kWh * 500) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 500) / 100)}
                </div>
                <div className="text-xs text-gray-600">500 kWh</div>
              </div>
              <div className="flex justify-between items-center py-1 px-2 bg-texas-gold/20 rounded">
                <div className="text-sm font-bold text-texas-navy">
                  ${plan.pricing?.rate1000kWh ? ((plan.pricing.rate1000kWh * 1000) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 1000) / 100)}
                </div>
                <div className="text-xs text-texas-navy font-semibold">1000 kWh</div>
              </div>
              <div className="flex justify-between items-center py-1 px-2">
                <div className="text-sm font-bold text-gray-700">
                  ${plan.pricing?.rate2000kWh ? ((plan.pricing.rate2000kWh * 2000) / 100).toFixed(0) : Math.round((parseFloat(plan.rate.toString()) * 2000) / 100)}
                </div>
                <div className="text-xs text-gray-600">2000 kWh</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Contract & Type Info */}
        <div className="grid grid-cols-2 gap-3 text-center mt-4">
          <div className="py-3 px-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-texas-navy/30 transition-all duration-200">
            <div className="text-base font-bold text-texas-navy">{plan.contractTerm}</div>
            <div className="text-xs text-gray-600 font-medium">Contract</div>
          </div>
          <div className="py-3 px-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-texas-navy/30 transition-all duration-200">
            <div className="text-base font-bold text-texas-navy">{planTypeInfo.label}</div>
            <div className="text-xs text-gray-600 font-medium">Rate Type</div>
          </div>
        </div>

      </CardContent>

      {/* Enhanced CTA Button */}
      <CardFooter className="p-6 pt-4">
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
          className="w-full bg-gradient-to-r from-texas-red to-texas-red-600 hover:from-texas-red-600 hover:to-texas-red-700 text-white font-bold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center">
            View Plan Details
            <Icon name="arrow-right" className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        </Button>
      </CardFooter>
    </Card>
  );
};