import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Separator } from './separator';
import { Icon } from './Icon';

// Import tabs and slider conditionally for better error handling
let Tabs, TabsContent, TabsList, TabsTrigger, Slider;
try {
  const tabsModule = require('./tabs');
  Tabs = tabsModule.Tabs;
  TabsContent = tabsModule.TabsContent;
  TabsList = tabsModule.TabsList;
  TabsTrigger = tabsModule.TabsTrigger;
} catch (error) {
  console.warn('Tabs component not available');
}

try {
  const sliderModule = require('./slider');
  Slider = sliderModule.Slider;
} catch (error) {
  console.warn('Slider component not available');
}

interface ElectricityPlan {
  id: string;
  name: string;
  provider: {
    name: string;
    slug: string;
    logo?: string;
    rating: number;
    reviews: number;
    description: string;
  };
  rate: number; // cents per kWh
  type: 'fixed' | 'variable' | 'indexed';
  termLength: number; // months
  renewablePercent: number;
  fees: {
    monthlyFee: number;
    cancellationFee: number;
    connectionFee: number;
    depositRequired: boolean;
  };
  features: string[];
  highlights: string[];
  availability: {
    cities: string[];
    zipCodes: string[];
    tdsp: string[];
  };
  reviews?: {
    average: number;
    total: number;
    breakdown: Record<number, number>;
    recent: Array<{
      rating: number;
      comment: string;
      author: string;
      date: string;
    }>;
  };
}

interface ProductDetailsPageProps {
  plan: ElectricityPlan;
  onSelectPlan?: (plan: ElectricityPlan) => void;
  onComparePlans?: () => void;
  onSaveForLater?: (plan: ElectricityPlan) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  plan,
  onSelectPlan,
  onComparePlans,
  onSaveForLater,
}) => {
  const [monthlyUsage, setMonthlyUsage] = useState(1000);

  const calculateMonthlyCost = (usage: number) => {
    const electricityCharge = (usage * plan.rate) / 100;
    const total = electricityCharge + plan.fees.monthlyFee;
    return { electricityCharge, total };
  };

  const { electricityCharge, total } = calculateMonthlyCost(monthlyUsage);

  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        size={size}
        className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const getBreadcrumbs = () => [
    { label: 'Home', href: '/' },
    { label: 'Texas', href: '/texas' },
    { label: 'Electricity Plans', href: '/electricity-plans' },
    { label: plan.provider.name, href: `/providers/${plan.provider.slug}` },
    { label: plan.name, href: '#', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="text-sm text-gray-500">
            {getBreadcrumbs().map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.current ? (
                  <span className="text-gray-900">{crumb.label}</span>
                ) : (
                  <a href={crumb.href} className="hover:text-texas-navy transition-colors">
                    {crumb.label}
                  </a>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN - Plan Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Plan Header */}
            <Card className="p-8 border-gray-100 shadow-lg">
              <div className="flex items-start gap-6 mb-6">
                {plan.provider.logo && (
                  <img
                    src={plan.provider.logo}
                    alt={`${plan.provider.name} logo`}
                    className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">{plan.name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <a href={`/providers/${plan.provider.slug}`} className="text-xl text-texas-navy hover:text-texas-red font-semibold transition-colors">
                      {plan.provider.name}
                    </a>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(plan.provider.rating)}
                      </div>
                      <span className="text-gray-600 text-sm">({plan.provider.reviews.toLocaleString()} reviews)</span>
                    </div>
                  </div>
                  
                  {/* Key Highlights */}
                  <div className="flex flex-wrap gap-3">
                    {plan.highlights.map(highlight => (
                      <Badge 
                        key={highlight} 
                        className="px-4 py-2 bg-texas-gold-100 text-texas-navy font-semibold text-sm"
                        variant="outline"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-texas-cream-50 rounded-xl border border-texas-cream-200">
                  <div className="text-3xl font-bold text-texas-navy mb-1">{plan.rate}¢</div>
                  <div className="text-gray-600 text-sm font-medium">per kWh</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-900 mb-1">{plan.termLength}</div>
                  <div className="text-gray-600 text-sm font-medium">months</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-900 mb-1">{plan.renewablePercent}%</div>
                  <div className="text-gray-600 text-sm font-medium">renewable</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-900 mb-1">${plan.fees.monthlyFee}</div>
                  <div className="text-gray-600 text-sm font-medium">monthly fee</div>
                </div>
              </div>
            </Card>

            {/* Tabbed Content */}
            <Card className="shadow-lg border-gray-100">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b border-gray-200 px-8 pt-6">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent">
                    <TabsTrigger 
                      value="overview"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:text-texas-navy font-semibold"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="details"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:text-texas-navy font-semibold"
                    >
                      Rate Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contract"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:text-texas-navy font-semibold"
                    >
                      Contract Terms
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reviews"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:text-texas-navy font-semibold"
                    >
                      Reviews
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="p-8">
                  <TabsContent value="overview" className="mt-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">What You Get</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Features */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h4>
                        <div className="space-y-3">
                          {plan.features.map(feature => (
                            <div key={feature} className="flex items-center gap-3">
                              <Icon icon="check-circle" size={20} className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Fees Breakdown */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">All Fees</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Monthly service fee</span>
                            <span className="font-semibold">${plan.fees.monthlyFee}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Early termination fee</span>
                            <span className="font-semibold">${plan.fees.cancellationFee}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Connection fee</span>
                            <span className="font-semibold text-green-600">
                              {plan.fees.connectionFee === 0 ? 'FREE' : `$${plan.fees.connectionFee}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Security deposit</span>
                            <span className="font-semibold text-green-600">
                              {plan.fees.depositRequired ? 'Required' : 'Not Required'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Availability */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Available In These Areas</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Major Cities</h5>
                          <div className="flex flex-wrap gap-2">
                            {plan.availability.cities.map(city => (
                              <Badge key={city} variant="secondary" className="bg-white text-gray-700 border border-gray-200">
                                {city}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Utility Companies</h5>
                          <div className="flex flex-wrap gap-2">
                            {plan.availability.tdsp.map(tdsp => (
                              <Badge key={tdsp} variant="secondary" className="bg-white text-gray-700 border border-gray-200">
                                {tdsp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Pricing Breakdown</h3>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Energy Rate</h4>
                          <div className="text-4xl font-bold text-green-600">{plan.rate}¢ per kWh</div>
                          <p className="text-gray-600">
                            {plan.type === 'fixed' ? 'Fixed rate for entire contract term' : 
                             plan.type === 'variable' ? 'Rate may vary monthly' : 
                             'Rate indexed to market prices'}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Usage Examples</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>500 kWh/month</span>
                              <span className="font-medium">${((500 * plan.rate) / 100 + plan.fees.monthlyFee).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>1,000 kWh/month</span>
                              <span className="font-medium">${((1000 * plan.rate) / 100 + plan.fees.monthlyFee).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>1,500 kWh/month</span>
                              <span className="font-medium">${((1500 * plan.rate) / 100 + plan.fees.monthlyFee).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contract" className="mt-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Contract Terms</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">Contract Length</h4>
                          <p className="text-gray-700">{plan.termLength} months</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Early Termination</h4>
                          <p className="text-gray-700">${plan.fees.cancellationFee} fee if cancelled early</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Auto-Renewal</h4>
                          <p className="text-gray-700">Month-to-month at standard rates</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">Rate Type</h4>
                          <p className="text-gray-700 capitalize">{plan.type} rate plan</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Green Energy</h4>
                          <p className="text-gray-700">{plan.renewablePercent}% renewable energy</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Deposit</h4>
                          <p className="text-gray-700">{plan.fees.depositRequired ? 'Required based on credit' : 'Not required'}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>
                    {plan.reviews ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-gray-900">{plan.reviews.average}</div>
                          <div>
                            <div className="flex">{renderStars(plan.reviews.average, 20)}</div>
                            <p className="text-gray-600">{plan.reviews.total.toLocaleString()} reviews</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          {plan.reviews.recent.map((review, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">{renderStars(review.rating, 14)}</div>
                                <span className="text-sm text-gray-600">{review.author} • {review.date}</span>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No reviews available for this plan yet.</p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* RIGHT COLUMN - Selection Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Pricing Calculator Card */}
              <Card className="p-8 shadow-lg border-gray-100">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">Your Monthly Cost</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Usage Slider */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Usage: {monthlyUsage.toLocaleString()} kWh
                    </label>
                    <Slider
                      value={[monthlyUsage]}
                      onValueChange={(value) => setMonthlyUsage(value[0])}
                      min={500}
                      max={3000}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>500</span>
                      <span>3,000</span>
                    </div>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Electricity charges</span>
                        <span>${electricityCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly service fee</span>
                        <span>${plan.fees.monthlyFee}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total monthly cost</span>
                        <span className="text-texas-navy">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary CTA */}
                  <Button 
                    className="w-full bg-texas-red text-white py-4 px-6 font-bold text-lg hover:bg-texas-red-600 transition-all transform hover:scale-105 shadow-lg"
                    onClick={() => onSelectPlan?.(plan)}
                  >
                    Select This Plan
                    <Icon icon="arrow-right" size={20} className="ml-2" />
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                      variant="outline"
                      className="border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white font-semibold"
                      onClick={onComparePlans}
                    >
                      Compare Plans
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                      onClick={() => onSaveForLater?.(plan)}
                    >
                      Save for Later
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card className="bg-texas-cream-50 border-texas-cream-200 p-6">
                <div className="text-center">
                  <Icon icon="shield" size={48} className="text-texas-gold mx-auto mb-3" />
                  <h4 className="font-bold text-texas-navy mb-2">Protected Selection</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Licensed provider • Rate guaranteed • No hidden fees
                  </p>
                  <div className="text-xs text-gray-500">
                    PUCT License #10039 • BBB Accredited
                  </div>
                </div>
              </Card>

              {/* Help Section */}
              <Card className="bg-blue-50 border-blue-200 p-6">
                <div className="text-center">
                  <Icon icon="info" size={32} className="text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-blue-900 mb-2">Need Help Deciding?</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Compare this plan with others or get personalized recommendations.
                  </p>
                  <Button variant="link" className="text-blue-600 font-semibold text-sm hover:text-blue-800 p-0">
                    Get Free Consultation →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;