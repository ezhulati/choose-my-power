import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Separator } from './separator';
import { Icon } from './Icon';

interface ElectricityPlan {
  id: string;
  name: string;
  provider: string;
  rate: number; // cents per kWh
  baseCharge: number; // monthly base charge
  contractTerm: string;
  planType: 'fixed' | 'variable' | 'indexed';
  greenEnergy: boolean;
  features: string[];
  monthlyEstimate: number; // based on 1000 kWh
  rating: number; // 1-5 stars
}

interface ElectricityPlanCardProps {
  plan: ElectricityPlan;
  onSelect?: (plan: ElectricityPlan) => void;
  onCompare?: (plan: ElectricityPlan) => void;
  isPopular?: boolean;
}

export const ElectricityPlanCard: React.FC<ElectricityPlanCardProps> = ({
  plan,
  onSelect,
  onCompare,
  isPopular = false,
}) => {
  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'variable':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'indexed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        size={16}
        className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'ring-2 ring-blue-500 ring-offset-2' : ''
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-blue-600 text-white">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {plan.name}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {plan.provider}
            </CardDescription>
            <div className="flex items-center mt-2 space-x-1">
              {renderStars(plan.rating)}
              <span className="text-sm text-gray-600 ml-1">({plan.rating})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {plan.rate}¢
            </div>
            <div className="text-sm text-gray-600">per kWh</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Contract Term</div>
            <div className="font-medium">{plan.contractTerm}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Base Charge</div>
            <div className="font-medium">${plan.baseCharge}/month</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Plan Type</div>
            <Badge className={getPlanTypeColor(plan.planType)} variant="outline">
              {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-gray-600">Monthly Est.*</div>
            <div className="font-bold text-gray-900">${plan.monthlyEstimate}</div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Plan Features:</div>
          <div className="flex flex-wrap gap-2">
            {plan.greenEnergy && (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                <Icon icon="leaf" size={12} className="mr-1" />
                Green Energy
              </Badge>
            )}
            {plan.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 space-x-2">
        <Button 
          className="flex-1" 
          onClick={() => onSelect?.(plan)}
        >
          <Icon icon="zap" size={16} className="mr-2" />
          Select Plan
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onCompare?.(plan)}
        >
          <Icon icon="compare" size={16} className="mr-2" />
          Compare
        </Button>
      </CardFooter>

      <div className="absolute bottom-2 right-2">
        <div className="text-xs text-gray-500">*Based on 1,000 kWh</div>
      </div>
    </Card>
  );
};

// Provider comparison card component
interface ProviderCardProps {
  provider: {
    name: string;
    logo?: string;
    rating: number;
    customerSatisfaction: number;
    plansAvailable: number;
    lowestRate: number;
    features: string[];
    greenOptions: boolean;
  };
  onViewPlans?: (providerName: string) => void;
}

export const ProviderComparisonCard: React.FC<ProviderCardProps> = ({
  provider,
  onViewPlans,
}) => {
  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon icon="building" size={24} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            <div className="flex items-center space-x-1 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Icon
                  key={i}
                  icon="star"
                  size={14}
                  className={i < provider.rating ? 'text-yellow-400' : 'text-gray-300'}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">({provider.rating})</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Customer Satisfaction</span>
            <span className="font-semibold text-green-600">{provider.customerSatisfaction}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Plans Available</span>
            <span className="font-semibold">{provider.plansAvailable}+</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Starting Rate</span>
            <span className="font-semibold text-green-600">{provider.lowestRate}¢/kWh</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="text-sm font-medium">Features:</div>
          <div className="flex flex-wrap gap-1">
            {provider.greenOptions && (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                <Icon icon="leaf" size={10} className="mr-1" />
                Green
              </Badge>
            )}
            {provider.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onViewPlans?.(provider.name)}
        >
          <Icon icon="eye" size={16} className="mr-2" />
          View Plans
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElectricityPlanCard;