import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Icon } from './Icon';

interface ElectricityPlan {
  id: string;
  name: string;
  provider: string;
  rate: number; // cents per kWh
  contractTerm: string;
  planType: 'fixed' | 'variable' | 'indexed';
  greenEnergy: boolean;
  noDeposit?: boolean;
  topRated?: boolean;
  features: string[];
  slug: string; // For generating URLs
}

interface ProfessionalPlanCardProps {
  plan: ElectricityPlan;
  onViewDetails?: (plan: ElectricityPlan) => void;
  className?: string;
}

export const ProfessionalPlanCard: React.FC<ProfessionalPlanCardProps> = ({
  plan,
  onViewDetails,
  className = "",
}) => {
  // Determine the single most important badge to show
  const getSpecialBadge = () => {
    if (plan.greenEnergy) {
      return {
        text: "100% Green Energy",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: "leaf"
      };
    }
    if (plan.noDeposit) {
      return {
        text: "No Deposit",
        className: "bg-texas-gold-100 text-texas-navy border-texas-gold-200",
        icon: "shield"
      };
    }
    if (plan.topRated) {
      return {
        text: "Top Rated",
        className: "bg-texas-red-100 text-texas-red-800 border-texas-red-200",
        icon: "star"
      };
    }
    return null;
  };

  const specialBadge = getSpecialBadge();

  const handleViewDetails = () => {
    // Navigate to product details page
    const url = `/electricity-plans/${plan.provider.toLowerCase().replace(/\s+/g, '-')}/${plan.slug}`;
    window.location.href = url;
    onViewDetails?.(plan);
  };

  return (
    <Card 
      className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group ${className}`}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        {/* Provider Name + Plan Name */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-texas-navy uppercase tracking-wide">
            {plan.provider}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {plan.name}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Rate Display - Prominent */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-green-600">
              {plan.rate}¢
            </span>
            <span className="text-sm text-gray-600">per kWh</span>
          </div>
        </div>

        {/* Contract Length - Essential Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">Contract Length</p>
          <p className="font-semibold text-gray-900">{plan.contractTerm}</p>
        </div>

        {/* Single Special Badge */}
        {specialBadge && (
          <div className="mb-4">
            <Badge 
              className={specialBadge.className}
              variant="outline"
            >
              <Icon icon={specialBadge.icon} size={12} className="mr-1.5" />
              {specialBadge.text}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {/* Single Button */}
        <Button 
          className="w-full bg-texas-navy hover:bg-blue-800 text-white font-semibold transition-colors duration-200 group-hover:bg-texas-red group-hover:hover:bg-texas-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
        >
          View Details
          <Icon icon="arrow-right" size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Mobile-optimized version with even more minimal design
export const MobileProfessionalPlanCard: React.FC<ProfessionalPlanCardProps> = ({
  plan,
  onViewDetails,
  className = "",
}) => {
  const specialBadge = plan.greenEnergy 
    ? { text: "Green Energy", className: "bg-green-100 text-green-800 text-xs", icon: "leaf" }
    : plan.noDeposit 
    ? { text: "No Deposit", className: "bg-texas-gold-100 text-texas-navy text-xs", icon: "shield" }
    : null;

  const handleViewDetails = () => {
    const url = `/electricity-plans/${plan.provider.toLowerCase().replace(/\s+/g, '-')}/${plan.slug}`;
    window.location.href = url;
    onViewDetails?.(plan);
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg cursor-pointer active:scale-95 ${className}`}
      onClick={handleViewDetails}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-texas-navy uppercase tracking-wide mb-1">
              {plan.provider}
            </p>
            <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
              {plan.name}
            </h3>
          </div>
          <div className="text-right ml-3">
            <div className="text-2xl font-bold text-green-600">
              {plan.rate}¢
            </div>
            <div className="text-xs text-gray-600">per kWh</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {plan.contractTerm}
          </span>
          {specialBadge && (
            <Badge className={specialBadge.className} variant="outline">
              <Icon icon={specialBadge.icon} size={10} className="mr-1" />
              {specialBadge.text}
            </Badge>
          )}
        </div>

        <Button 
          className="w-full mt-3 bg-texas-navy hover:bg-texas-red text-white text-sm font-medium"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfessionalPlanCard;