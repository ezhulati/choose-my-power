import * as React from "react"
import { Star, Zap, Leaf, Shield, Clock, DollarSign, TrendingUp, CheckCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ElectricityPlan {
  id: string
  provider: string
  planName: string
  rate: number
  rateType: 'fixed' | 'variable' | 'indexed'
  contractLength: number
  monthlyFee?: number
  cancellationFee?: number
  greenEnergy?: number
  rating?: number
  reviewCount?: number
  features?: string[]
  estimatedMonthlyCost?: number
  savings?: number
  isPopular?: boolean
  isFeatured?: boolean
  planUrl?: string
  providerLogo?: string
}

export interface ElectricityPlanCardProps {
  plan: ElectricityPlan
  variant?: 'default' | 'compact' | 'detailed' | 'comparison'
  showComparison?: boolean
  onCompare?: (planId: string) => void
  onViewDetails?: (planId: string) => void
  className?: string
}

const ElectricityPlanCardEnhanced = React.forwardRef<HTMLDivElement, ElectricityPlanCardProps>(
  ({ plan, variant = 'default', showComparison = false, onCompare, onViewDetails, className }, ref) => {
    const {
      provider,
      planName,
      rate,
      rateType,
      contractLength,
      monthlyFee,
      greenEnergy,
      rating,
      reviewCount,
      features = [],
      estimatedMonthlyCost,
      savings,
      isPopular,
      isFeatured,
      planUrl,
      providerLogo
    } = plan

    // Determine card variant based on plan attributes
    const cardVariant = isFeatured 
      ? 'featured' 
      : isPopular 
        ? 'popular' 
        : 'plan-card'

    // Rate type styling
    const getRateTypeBadge = (type: string) => {
      switch (type) {
        case 'fixed':
          return <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">Fixed Rate</Badge>
        case 'variable':
          return <Badge variant="warning" className="bg-orange-100 text-orange-800 border-orange-200">Variable Rate</Badge>
        case 'indexed':
          return <Badge variant="info" className="bg-blue-100 text-blue-800 border-blue-200">Indexed Rate</Badge>
        default:
          return null
      }
    }

    // Format rate display
    const formatRate = (rate: number) => {
      return rate.toFixed(1)
    }

    // Calculate savings indicator
    const getSavingsColor = (savings?: number) => {
      if (!savings) return 'text-gray-500'
      if (savings > 100) return 'text-green-600'
      if (savings > 50) return 'text-texas-gold'
      return 'text-gray-600'
    }

    return (
      <Card 
        ref={ref} 
        variant={cardVariant}
        className={cn(
          "group relative overflow-hidden",
          variant === 'compact' && "max-w-sm",
          variant === 'detailed' && "max-w-lg",
          className
        )}
      >
        {/* Popular/Featured Badge */}
        {(isPopular || isFeatured) && (
          <div className="absolute top-0 right-0 z-10">
            <div className={cn(
              "px-3 py-1 text-xs font-bold text-white rounded-bl-lg",
              isFeatured ? "bg-gradient-to-r from-texas-gold to-yellow-600" : "bg-gradient-to-r from-texas-navy to-blue-800"
            )}>
              {isFeatured ? "Featured" : "Popular"}
            </div>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Provider */}
              <div className="flex items-center gap-3 mb-2">
                {providerLogo && (
                  <img 
                    src={providerLogo} 
                    alt={`${provider} logo`}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <span className="text-sm font-medium text-texas-navy">{provider}</span>
              </div>
              
              {/* Plan Name */}
              <CardTitle className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                {planName}
              </CardTitle>
              
              {/* Rate Type and Contract Length */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {getRateTypeBadge(rateType)}
                <Badge variant="outline" className="text-xs">
                  {contractLength} {contractLength === 1 ? 'Month' : 'Months'}
                </Badge>
              </div>
            </div>

            {/* Rating */}
            {rating && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
                </div>
                {reviewCount && (
                  <span className="text-xs text-gray-500">({reviewCount.toLocaleString()})</span>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Rate Display */}
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-texas-navy">{formatRate(rate)}¢</span>
              <span className="text-sm text-gray-600">/kWh</span>
            </div>
            
            {estimatedMonthlyCost && (
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  ${estimatedMonthlyCost}
                </div>
                <div className="text-xs text-gray-500">est. monthly</div>
              </div>
            )}
          </div>

          {/* Savings Indicator */}
          {savings && savings > 0 && (
            <div className={cn(
              "flex items-center gap-2 mb-4 p-3 rounded-lg border",
              "bg-green-50 border-green-200"
            )}>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Save up to ${savings}/year vs average
              </span>
            </div>
          )}

          {/* Plan Features */}
          {features.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Plan Highlights
              </h4>
              <ul className="space-y-1">
                {features.slice(0, variant === 'compact' ? 2 : 4).map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-texas-gold rounded-full mt-2 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {monthlyFee && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${monthlyFee}/month fee
              </div>
            )}
            {greenEnergy && greenEnergy > 0 && (
              <div className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-green-600" />
                {greenEnergy}% renewable
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-4 gap-3">
          {showComparison && onCompare && (
            <Button 
              variant="texas-outline" 
              size="sm"
              onClick={() => onCompare(plan.id)}
              className="flex-1"
            >
              Compare
            </Button>
          )}
          
          <Button 
            variant="texas-primary" 
            size={showComparison ? "sm" : "default"}
            onClick={() => onViewDetails ? onViewDetails(plan.id) : planUrl && window.open(planUrl, '_blank')}
            className={cn(
              "group-hover:shadow-lg transition-all",
              !showComparison && "flex-1"
            )}
          >
            <Zap className="w-4 h-4 mr-2" />
            {showComparison ? "Details" : "View Plan"}
          </Button>
        </CardFooter>
      </Card>
    )
  }
)

ElectricityPlanCardEnhanced.displayName = "ElectricityPlanCardEnhanced"

export { ElectricityPlanCardEnhanced }