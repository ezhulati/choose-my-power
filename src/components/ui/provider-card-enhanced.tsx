import * as React from "react"
import { Star, Zap, Users, Shield, Award, ArrowRight, Phone, Globe, Leaf } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ElectricityProvider {
  id: string
  name: string
  logo?: string
  rating?: number
  reviewCount?: number
  planCount?: number
  lowestRate?: number
  specialties?: string[]
  customerService?: {
    phone?: string
    hours?: string
    rating?: number
  }
  website?: string
  greenEnergyOptions?: boolean
  businessPlans?: boolean
  serviceArea?: string[]
  features?: string[]
  isRecommended?: boolean
  isFeatured?: boolean
}

export interface ProviderCardProps {
  provider: ElectricityProvider
  variant?: 'default' | 'compact' | 'detailed' | 'grid'
  showPlansButton?: boolean
  onViewProvider?: (providerId: string) => void
  onViewPlans?: (providerId: string) => void
  className?: string
}

const ProviderCardEnhanced = React.forwardRef<HTMLDivElement, ProviderCardProps>(
  ({ provider, variant = 'default', showPlansButton = true, onViewProvider, onViewPlans, className }, ref) => {
    const {
      id,
      name,
      logo,
      rating,
      reviewCount,
      planCount,
      lowestRate,
      specialties = [],
      customerService,
      website,
      greenEnergyOptions,
      businessPlans,
      features = [],
      isRecommended,
      isFeatured
    } = provider

    // Determine card variant based on provider attributes
    const cardVariant = isFeatured 
      ? 'featured' 
      : isRecommended 
        ? 'popular' 
        : 'provider-card'

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
        {/* Recommended/Featured Badge */}
        {(isRecommended || isFeatured) && (
          <div className="absolute top-0 right-0 z-10">
            <div className={cn(
              "px-3 py-1 text-xs font-bold text-white rounded-bl-lg",
              isFeatured ? "bg-gradient-to-r from-texas-gold to-yellow-600" : "bg-gradient-to-r from-texas-navy to-blue-800"
            )}>
              {isFeatured ? "Featured" : "Recommended"}
            </div>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            {/* Provider Logo */}
            <div className="flex-shrink-0">
              {logo ? (
                <img 
                  src={logo} 
                  alt={`${name} logo`}
                  className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-100 p-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-texas-navy/10 to-texas-navy/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-8 h-8 text-texas-navy" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Provider Name */}
              <CardTitle className="text-xl font-bold text-texas-navy mb-1">
                {name}
              </CardTitle>

              {/* Rating and Reviews */}
              {rating && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
                  </div>
                  {reviewCount && (
                    <span className="text-sm text-gray-500">
                      ({reviewCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Plan Count and Lowest Rate */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {planCount && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {planCount} plans
                  </div>
                )}
                {lowestRate && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold">
                      From {lowestRate.toFixed(1)}¢/kWh
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, variant === 'compact' ? 2 : 4).map((specialty, index) => (
                  <Badge key={index} variant="plan-type" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Key Features */}
          <div className="space-y-3 mb-4">
            {greenEnergyOptions && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Leaf className="w-4 h-4 text-green-600" />
                Green energy options available
              </div>
            )}
            {businessPlans && (
              <div className="flex items-center gap-2 text-sm text-texas-navy">
                <Shield className="w-4 h-4 text-texas-navy" />
                Business plans available
              </div>
            )}
            {customerService?.rating && customerService.rating >= 4.0 && (
              <div className="flex items-center gap-2 text-sm text-texas-navy">
                <Award className="w-4 h-4 text-texas-navy" />
                Excellent customer service
              </div>
            )}
          </div>

          {/* Additional Features */}
          {features.length > 0 && variant !== 'compact' && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Features</h4>
              <ul className="space-y-1">
                {features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-texas-gold rounded-full mt-2 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer Service Info */}
          {customerService && variant === 'detailed' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Service</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {customerService.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {customerService.phone}
                  </div>
                )}
                {customerService.hours && (
                  <div className="text-xs">{customerService.hours}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 gap-3">
          {/* View Provider Button */}
          <Button 
            variant="texas-outline" 
            size="sm"
            onClick={() => onViewProvider ? onViewProvider(id) : website && window.open(website, '_blank')}
            className="flex-1 group-hover:border-texas-navy/50"
          >
            <Globe className="w-4 h-4 mr-2" />
            Learn More
          </Button>
          
          {/* View Plans Button */}
          {showPlansButton && (
            <Button 
              variant="texas-primary" 
              size="sm"
              onClick={() => onViewPlans && onViewPlans(id)}
              className="flex-1 group-hover:shadow-lg transition-all"
            >
              <Zap className="w-4 h-4 mr-2" />
              View Plans
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }
)

ProviderCardEnhanced.displayName = "ProviderCardEnhanced"

export { ProviderCardEnhanced }