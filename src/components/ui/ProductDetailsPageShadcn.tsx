"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Button } from './button';
import { Slider } from './slider';
import AddressSearchModal from './AddressSearchModal';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './breadcrumb';
import { 
  Calendar, 
  Zap, 
  Shield, 
  Leaf, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';

interface PlanData {
  id: string;
  name: string;
  provider: {
    name: string;
    slug: string;
    logo: string;
    rating: number;
    reviews: number;
    description: string;
  };
  rate: number;
  type: 'fixed' | 'variable' | 'indexed';
  termLength: number;
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
}

interface ProductDetailsPageShadcnProps {
  planData: PlanData;
}

export const ProductDetailsPageShadcn: React.FC<ProductDetailsPageShadcnProps> = ({ planData }) => {
  const [usage, setUsage] = useState(1000);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const calculateCosts = (kwh: number) => {
    const electricityCharge = (kwh * planData.rate) / 100;
    const total = electricityCharge + planData.fees.monthlyFee;
    return { electricityCharge, total };
  };

  const { electricityCharge, total } = calculateCosts(usage);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleAddressSuccess = (esiid: string, address: string) => {
    // Track successful address validation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'plan_selection_with_address', {
        plan_id: planData.id,
        provider: planData.provider.name,
        esiid: esiid,
        validated_address: address
      });
    }
    
    // Close the modal
    setIsAddressModalOpen(false);
    
    // The modal component handles the redirect to ComparePower
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/electricity-plans">Electricity Plans</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/providers/${planData.provider.slug}`}>
                  {planData.provider.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{planData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN - Plan Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Plan Header Card */}
            <Card className="p-8">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-6 mb-6">
                  <ProviderLogo 
                    providerName={planData.provider.name}
                    size="xl"
                    variant="rounded"
                    className="w-20 h-20 rounded-2xl border border-gray-200 shadow-sm"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-4xl font-bold text-gray-900 mb-3">
                      {planData.name}
                    </CardTitle>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <a 
                        href={`/providers/${planData.provider.slug}`} 
                        className="text-xl text-texas-navy hover:text-texas-red font-semibold"
                      >
                        {planData.provider.name}
                      </a>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(planData.provider.rating)}
                        </div>
                        <span className="text-gray-600 text-sm">
                          ({planData.provider.reviews.toLocaleString()} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {/* Key Highlights */}
                    <div className="flex flex-wrap gap-3">
                      {planData.highlights.map((highlight) => (
                        <Badge key={highlight} variant="secondary" className="bg-texas-gold-100 text-texas-navy">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-texas-cream-50 rounded-xl border border-texas-cream-200">
                    <div className="text-3xl font-bold text-texas-navy mb-1">{planData.rate}¢</div>
                    <div className="text-gray-600 text-sm font-medium">per kWh</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-900 mb-1">{planData.termLength}</div>
                    <div className="text-gray-600 text-sm font-medium">months</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-900 mb-1">{planData.renewablePercent}%</div>
                    <div className="text-gray-600 text-sm font-medium">renewable</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-900 mb-1">${planData.fees.monthlyFee}</div>
                    <div className="text-gray-600 text-sm font-medium">monthly fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content Card */}
            <Card>
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b border-gray-200 px-8 pt-6">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="overview"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:bg-transparent rounded-none pb-4"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contract"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:bg-transparent rounded-none pb-4"
                    >
                      Contract Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reviews"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:bg-transparent rounded-none pb-4"
                    >
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faq"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-texas-navy data-[state=active]:bg-transparent rounded-none pb-4"
                    >
                      FAQ
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="overview" className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">What You Get</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Features */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h4>
                      <div className="space-y-3">
                        {planData.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
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
                          <span className="font-semibold">${planData.fees.monthlyFee}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Early termination fee</span>
                          <span className="font-semibold">${planData.fees.cancellationFee}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Connection fee</span>
                          <span className="font-semibold text-green-600">
                            {planData.fees.connectionFee === 0 ? 'FREE' : `$${planData.fees.connectionFee}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Security deposit</span>
                          <span className="font-semibold text-green-600">
                            {planData.fees.depositRequired ? 'Required' : 'Not Required'}
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
                          {planData.availability.cities.map((city) => (
                            <Badge key={city} variant="outline" className="bg-white">
                              {city}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Utility Companies</h5>
                        <div className="flex flex-wrap gap-2">
                          {planData.availability.tdsp.map((tdsp) => (
                            <Badge key={tdsp} variant="outline" className="bg-white">
                              {tdsp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contract" className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contract Terms</h3>
                  <p className="text-gray-600">Contract details content would go here...</p>
                </TabsContent>

                <TabsContent value="reviews" className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>
                  <p className="text-gray-600">Customer reviews content would go here...</p>
                </TabsContent>

                <TabsContent value="faq" className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                  <p className="text-gray-600">FAQ content would go here...</p>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Related Plans Card */}
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-6">
                  Customers Also Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Mock related plans with working buttons */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 mb-3">
                        <ProviderLogo 
                          providerName="TXU Energy" 
                          size="sm"
                          variant="rounded"
                          className="w-10 h-10"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Electric Freedom 24</h4>
                          <p className="text-sm text-gray-600">TXU Energy</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-texas-navy">11.8¢</span>
                        <Button 
                          size="sm" 
                          className="bg-texas-navy hover:bg-texas-red"
                          onClick={() => window.location.href = '/electricity-plans/txu-energy/electric-freedom-24'}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 mb-3">
                        <ProviderLogo 
                          providerName="Direct Energy" 
                          size="sm"
                          variant="rounded"
                          className="w-10 h-10"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Live Brighter 12</h4>
                          <p className="text-sm text-gray-600">Direct Energy</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-texas-navy">13.2¢</span>
                        <Button 
                          size="sm" 
                          className="bg-texas-navy hover:bg-texas-red"
                          onClick={() => window.location.href = '/electricity-plans/direct-energy/live-brighter-12'}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Selection Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Pricing Calculator Card */}
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-6">
                    Your Monthly Cost
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {/* Usage Slider */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Usage (kWh)
                    </label>
                    <Slider
                      value={[usage]}
                      onValueChange={(value) => setUsage(value[0])}
                      max={3000}
                      min={500}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>500</span>
                      <span className="font-medium">{usage.toLocaleString()}</span>
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
                        <span>${planData.fees.monthlyFee}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                        <span>Total monthly cost</span>
                        <span className="text-texas-navy">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex-col space-y-4">
                  {/* Primary CTA */}
                  <Button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="w-full bg-texas-red hover:bg-texas-red-600 text-white py-4 px-6 text-lg font-bold"
                  >
                    Select This Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="outline" className="border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white">
                      Compare Plans
                    </Button>
                    <Button variant="outline">
                      Save for Later
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Trust Signals Card */}
              <Card className="p-6 bg-texas-cream-50 border-texas-cream-200">
                <CardContent className="text-center">
                  <Shield className="w-12 h-12 text-texas-gold mx-auto mb-3" />
                  <CardTitle className="font-bold text-texas-navy mb-2">
                    Protected Selection
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mb-4">
                    Licensed provider • Rate guaranteed • No hidden fees
                  </CardDescription>
                  <div className="text-xs text-gray-500">
                    PUCT License #10039 • BBB Accredited
                  </div>
                </CardContent>
              </Card>

              {/* Help Section Card */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <CardContent className="text-center">
                  <Info className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <CardTitle className="font-semibold text-blue-900 mb-2">
                    Need Help Deciding?
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-700 mb-4">
                    Compare this plan with others or get personalized recommendations.
                  </CardDescription>
                  <Button variant="link" className="text-blue-600 font-semibold hover:text-blue-800 p-0">
                    Get Free Consultation →
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>

      {/* Address Search Modal */}
      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        planData={{
          id: planData.id,
          name: planData.name,
          provider: {
            name: planData.provider.name
          }
        }}
        onSuccess={handleAddressSuccess}
      />
    </div>
  );
};