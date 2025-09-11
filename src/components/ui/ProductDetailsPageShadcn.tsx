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
  const [realPlanId, setRealPlanId] = useState<string | null>(null);
  const [planIdLoading, setPlanIdLoading] = useState(true);
  const [currentCitySlug, setCurrentCitySlug] = useState<string>('dallas');

  // Extract current city from URL for proper plan routing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const pathParts = pathname.split('/');
      
      if (pathParts[1] === 'electricity-plans' && pathParts[2] && pathParts[2] !== 'plans') {
        // Direct electricity-plans URL: /electricity-plans/dallas-tx/...
        setCurrentCitySlug(pathParts[2]);
      } else if (pathParts[1] === 'texas' && pathParts[2]) {
        // Texas city page: /texas/dallas/
        setCurrentCitySlug(pathParts[2] + '-tx'); // Convert to electricity-plans format
      } else {
        // Fallback: try to get from document referrer or use planData city info
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.origin)) {
          const referrerParts = new URL(referrer).pathname.split('/');
          if (referrerParts[1] === 'electricity-plans' && referrerParts[2] && referrerParts[2] !== 'plans') {
            setCurrentCitySlug(referrerParts[2]);
          } else if (referrerParts[1] === 'texas' && referrerParts[2]) {
            setCurrentCitySlug(referrerParts[2] + '-tx');
          }
        }
      }
    }
  }, []);

  // Fetch real plan ID from ComparePower API
  React.useEffect(() => {
    const fetchRealPlanId = async () => {
      setPlanIdLoading(true);
      
      // Skip if plan already has a valid MongoDB ObjectId
      if (planData.id && /^[a-f0-9]{24}$/i.test(planData.id)) {
        console.log(`[ProductDetails] Plan already has valid MongoDB ID: ${planData.id}`);
        setRealPlanId(planData.id);
        setPlanIdLoading(false);
        return;
      }

      try {
        console.log(`[ProductDetails] Fetching real plan ID for: "${planData.name}" by "${planData.provider.name}"`);
        
        // Include city in the search if available
        const cityParam = currentCitySlug ? `&city=${encodeURIComponent(currentCitySlug)}` : '';
        const response = await fetch(`/api/plans/search?name=${encodeURIComponent(planData.name)}&provider=${encodeURIComponent(planData.provider.name)}${cityParam}`);
        
        if (response.ok) {
          const searchResults = await response.json();
          if (searchResults && searchResults.length > 0) {
            console.log(`[ProductDetails] Fetched plan ID from API: ${searchResults[0].id}`);
            setRealPlanId(searchResults[0].id);
          } else {
            console.warn(`[ProductDetails] No plan found via API for: "${planData.name}" by "${planData.provider.name}"`);
          }
        } else {
          console.warn('[ProductDetails] API response not OK:', response.status);
        }
      } catch (error) {
        console.warn('[ProductDetails] Could not fetch real plan ID from API:', error);
        // Will use fallback ObjectId in modal
      } finally {
        setPlanIdLoading(false);
      }
    };
    
    fetchRealPlanId();
  }, [planData.name, planData.provider.name, planData.id, currentCitySlug]);

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
        className={`w-4 h-4 transition-colors duration-200 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
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
    <div className="min-h-screen bg-gradient-to-b from-texas-cream to-gray-50">
      {/* Breadcrumb Navigation - Enhanced with Texas branding */}
      <div className="bg-white border-b border-texas-cream-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  href="/" 
                  className="text-texas-navy hover:text-texas-red font-medium transition-colors duration-200"
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-texas-gold" />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  href="/electricity-plans"
                  className="text-texas-navy hover:text-texas-red font-medium transition-colors duration-200"
                >
                  Electricity Plans
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-texas-gold" />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  href={`/providers/${planData.provider.slug}`}
                  className="text-texas-navy hover:text-texas-red font-medium transition-colors duration-200"
                >
                  {planData.provider.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-texas-gold" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-600 font-medium">{planData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
          
          {/* LEFT COLUMN - Plan Details */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Plan Header Card - Enterprise SaaS Grade */}
            <Card className="bg-white shadow-xl border border-texas-cream-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-texas-navy to-blue-800 text-white p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  <div className="bg-white p-3 rounded-2xl shadow-lg flex-shrink-0">
                    <ProviderLogo 
                      providerName={planData.provider.name}
                      size="xl"
                      variant="rounded"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight break-words">
                      {planData.name}
                    </CardTitle>
                    
                    <div className="flex flex-col gap-4 mb-6">
                      <a 
                        href={`/providers/${planData.provider.slug}`} 
                        className="text-base sm:text-lg lg:text-xl text-texas-gold hover:text-white font-semibold transition-colors duration-200 hover:underline break-words"
                      >
                        {planData.provider.name}
                      </a>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(planData.provider.rating)}
                          </div>
                          <span className="text-texas-cream text-sm sm:text-base font-medium">
                            {planData.provider.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-texas-cream text-sm sm:text-base font-medium">
                          ({planData.provider.reviews.toLocaleString()} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {/* Key Highlights - Mobile Optimized */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {planData.highlights.map((highlight) => (
                        <Badge 
                          key={highlight} 
                          className="bg-texas-gold text-texas-navy px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-full shadow-md hover:bg-white hover:text-texas-navy transition-all duration-200 touch-manipulation"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                {/* Quick Stats Grid - Mobile Optimized */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="group text-center p-4 sm:p-6 bg-gradient-to-br from-texas-red-50 to-texas-red-100 rounded-2xl border border-texas-red-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 touch-manipulation">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-texas-red mb-2 group-hover:scale-110 transition-transform duration-200">{planData.rate}¢</div>
                    <div className="text-texas-navy text-xs sm:text-sm font-bold uppercase tracking-wide">per kWh</div>
                    <div className="w-6 sm:w-8 h-1 bg-texas-red mx-auto mt-2 sm:mt-3 rounded-full"></div>
                  </div>
                  <div className="group text-center p-4 sm:p-6 bg-gradient-to-br from-texas-navy/5 to-texas-navy/10 rounded-2xl border border-texas-navy/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 touch-manipulation">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-texas-navy mb-2 group-hover:scale-110 transition-transform duration-200">{planData.termLength}</div>
                    <div className="text-texas-navy text-xs sm:text-sm font-bold uppercase tracking-wide">months</div>
                    <div className="w-6 sm:w-8 h-1 bg-texas-navy mx-auto mt-2 sm:mt-3 rounded-full"></div>
                  </div>
                  <div className="group text-center p-4 sm:p-6 bg-gradient-to-br from-texas-gold-50 to-texas-gold-100 rounded-2xl border border-texas-gold-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 touch-manipulation">
                    <div className="flex items-center justify-center mb-2">
                      <Leaf className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-texas-gold mr-1 sm:mr-2" />
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-texas-gold group-hover:scale-110 transition-transform duration-200">{planData.renewablePercent}%</span>
                    </div>
                    <div className="text-texas-navy text-xs sm:text-sm font-bold uppercase tracking-wide">renewable</div>
                    <div className="w-6 sm:w-8 h-1 bg-texas-gold mx-auto mt-2 sm:mt-3 rounded-full"></div>
                  </div>
                  <div className="group text-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 touch-manipulation">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 group-hover:scale-110 transition-transform duration-200">${planData.fees.monthlyFee}</div>
                    <div className="text-texas-navy text-xs sm:text-sm font-bold uppercase tracking-wide">monthly fee</div>
                    <div className="w-6 sm:w-8 h-1 bg-gray-400 mx-auto mt-2 sm:mt-3 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content Card - Enterprise Grade */}
            <Card className="bg-white shadow-xl border border-texas-cream-200 rounded-2xl overflow-hidden">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b border-texas-cream-200 bg-gradient-to-r from-gray-50 to-white px-8 pt-8 pb-2">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0 gap-8">
                    <TabsTrigger 
                      value="overview"
                      className="relative data-[state=active]:border-b-4 data-[state=active]:border-texas-red data-[state=active]:bg-transparent data-[state=active]:text-texas-navy rounded-none pb-6 px-0 font-bold text-lg hover:text-texas-red transition-all duration-200 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-1 data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-texas-red data-[state=active]:after:to-texas-gold data-[state=active]:after:rounded-full"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Overview
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contract"
                      className="relative data-[state=active]:border-b-4 data-[state=active]:border-texas-red data-[state=active]:bg-transparent data-[state=active]:text-texas-navy rounded-none pb-6 px-0 font-bold text-lg hover:text-texas-red transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Contract Details
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reviews"
                      className="relative data-[state=active]:border-b-4 data-[state=active]:border-texas-red data-[state=active]:bg-transparent data-[state=active]:text-texas-navy rounded-none pb-6 px-0 font-bold text-lg hover:text-texas-red transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Reviews
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faq"
                      className="relative data-[state=active]:border-b-4 data-[state=active]:border-texas-red data-[state=active]:bg-transparent data-[state=active]:text-texas-navy rounded-none pb-6 px-0 font-bold text-lg hover:text-texas-red transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        FAQ
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="overview" className="p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-texas-navy mb-3">What You Get</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full"></div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-10">
                    {/* Features - Enhanced */}
                    <div className="bg-gradient-to-br from-texas-cream-50 to-white p-8 rounded-2xl border border-texas-cream-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-texas-gold rounded-lg">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-texas-navy">Plan Features</h4>
                      </div>
                      <div className="space-y-4">
                        {planData.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-texas-gold hover:shadow-md transition-all duration-200">
                            <div className="p-1 bg-texas-gold-100 rounded-full flex-shrink-0 mt-1">
                              <CheckCircle className="w-4 h-4 text-texas-gold" />
                            </div>
                            <span className="text-gray-800 font-medium leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Fees Breakdown - Enhanced */}
                    <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-texas-navy rounded-lg">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-texas-navy">All Fees</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                          <span className="text-gray-700 font-medium">Monthly service fee</span>
                          <span className="font-bold text-texas-navy text-lg">${planData.fees.monthlyFee}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                          <span className="text-gray-700 font-medium">Early termination fee</span>
                          <span className="font-bold text-texas-navy text-lg">${planData.fees.cancellationFee}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                          <span className="text-gray-700 font-medium">Connection fee</span>
                          <span className="font-bold text-lg">
                            {planData.fees.connectionFee === 0 ? (
                              <span className="text-texas-gold bg-texas-gold-100 px-3 py-1 rounded-full text-sm">FREE</span>
                            ) : (
                              <span className="text-texas-navy">${planData.fees.connectionFee}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                          <span className="text-gray-700 font-medium">Security deposit</span>
                          <span className="font-bold text-lg">
                            {planData.fees.depositRequired ? (
                              <span className="text-texas-red">Required</span>
                            ) : (
                              <span className="text-texas-gold bg-texas-gold-100 px-3 py-1 rounded-full text-sm">Not Required</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Availability - Enhanced */}
                  <div className="mt-10 p-8 bg-gradient-to-r from-texas-navy to-blue-800 rounded-2xl shadow-xl text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-texas-gold rounded-lg">
                        <Zap className="w-6 h-6 text-texas-navy" />
                      </div>
                      <h4 className="text-2xl font-bold">Service Availability</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h5 className="font-bold text-texas-gold mb-4 text-lg">Major Cities</h5>
                        <div className="flex flex-wrap gap-3">
                          {planData.availability.cities.map((city) => (
                            <Badge 
                              key={city} 
                              className="bg-white/10 hover:bg-white hover:text-texas-navy text-white border-white/30 px-4 py-2 font-medium transition-all duration-200 hover:scale-105"
                            >
                              {city}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-bold text-texas-gold mb-4 text-lg">Utility Companies</h5>
                        <div className="flex flex-wrap gap-3">
                          {planData.availability.tdsp.map((tdsp) => (
                            <Badge 
                              key={tdsp} 
                              className="bg-white/10 hover:bg-white hover:text-texas-navy text-white border-white/30 px-4 py-2 font-medium transition-all duration-200 hover:scale-105"
                            >
                              {tdsp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contract" className="p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-texas-navy mb-3">Contract Terms & Details</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full"></div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Contract Terms */}
                    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-texas-navy rounded-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-texas-navy">Key Contract Terms</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-700">Contract Length</span>
                            <span className="font-bold text-texas-navy text-lg">{planData.termLength} months</span>
                          </div>
                          <p className="text-sm text-gray-600">Fixed-term commitment with guaranteed rates</p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-700">Rate Type</span>
                            <span className="font-bold text-texas-navy text-lg capitalize">{planData.type}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {planData.type === 'fixed' ? 'Rate remains constant throughout contract' : 'Rate may vary based on market conditions'}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-700">Auto-Renewal</span>
                            <span className="font-bold text-texas-gold">Optional</span>
                          </div>
                          <p className="text-sm text-gray-600">Choose to auto-renew or switch at contract end</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Important Notices */}
                    <div className="bg-gradient-to-br from-texas-cream-50 to-orange-50 p-8 rounded-2xl border border-texas-cream-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-texas-red rounded-lg">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-texas-navy">Important Information</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                          <h5 className="font-bold text-texas-navy mb-2">Cancellation Policy</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            You may cancel within 3 business days of enrollment without penalty. After that period, early termination fees may apply.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                          <h5 className="font-bold text-texas-navy mb-2">Bill Guarantee</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            We guarantee your rate for the entire contract term. No surprise rate increases or hidden fees.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                          <h5 className="font-bold text-texas-navy mb-2">Customer Rights</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            As a Texas electricity customer, you have specific rights protected by PUCT regulations. 
                            <a href="#" className="text-texas-red hover:underline font-medium ml-1">Learn more</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Contract Button */}
                  <div className="mt-8 text-center">
                    <Button 
                      className="bg-texas-navy hover:bg-texas-red text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5" />
                        <span>Download Full Contract Terms</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-texas-navy mb-3">Customer Reviews & Ratings</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full"></div>
                  </div>
                  
                  {/* Overall Rating Summary */}
                  <div className="bg-gradient-to-r from-texas-navy to-blue-800 p-8 rounded-2xl text-white mb-8 shadow-xl">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-texas-gold mb-2">{planData.provider.rating.toFixed(1)}</div>
                        <div className="flex justify-center mb-2">
                          {renderStars(planData.provider.rating)}
                        </div>
                        <div className="text-texas-cream font-medium">
                          Based on {planData.provider.reviews.toLocaleString()} customer reviews
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const percentage = stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 7 : stars === 2 ? 2 : 1;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-texas-gold font-medium w-8">{stars} ★</span>
                              <div className="flex-1 bg-white/20 rounded-full h-2">
                                <div 
                                  className="bg-texas-gold h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-texas-cream text-sm w-10">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Reviews */}
                  <div className="grid gap-6">
                    {/* Sample Review 1 */}
                    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="bg-texas-gold p-3 rounded-full">
                          <Star className="w-6 h-6 text-texas-navy" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Sarah M. - Houston, TX</span>
                            <span className="text-sm text-gray-500">2 weeks ago</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed mb-3">
                            "Excellent service and competitive rates. The sign-up process was smooth and customer service was very helpful when I had questions about my bill."
                          </p>
                          <div className="flex gap-2">
                            <Badge className="bg-texas-gold-100 text-texas-navy text-xs px-3 py-1">Verified Customer</Badge>
                            <Badge className="bg-green-100 text-green-700 text-xs px-3 py-1">12-Month Plan</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Sample Review 2 */}
                    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="bg-texas-navy p-3 rounded-full">
                          <Star className="w-6 h-6 text-texas-gold" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex">
                              {Array.from({ length: 4 }, (_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                              <Star className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Mike R. - Dallas, TX</span>
                            <span className="text-sm text-gray-500">1 month ago</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed mb-3">
                            "Good rates and reliable service. Had one billing issue that was resolved quickly by their support team. Overall satisfied with the service."
                          </p>
                          <div className="flex gap-2">
                            <Badge className="bg-texas-gold-100 text-texas-navy text-xs px-3 py-1">Verified Customer</Badge>
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-3 py-1">24-Month Plan</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* See More Reviews Button */}
                  <div className="mt-8 text-center">
                    <Button 
                      variant="outline"
                      className="border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        <span>View All {planData.provider.reviews.toLocaleString()} Reviews</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="faq" className="p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-texas-navy mb-3">Frequently Asked Questions</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full"></div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* FAQ Item 1 */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-texas-red p-2 rounded-full flex-shrink-0">
                            <Info className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-texas-navy mb-3">
                              How do I switch to this plan?
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              Switching is easy and takes just a few minutes. Click the "Select This Plan" button, verify your service address, and we'll handle the rest. There's no service interruption during the switch.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* FAQ Item 2 */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-texas-gold p-2 rounded-full flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-texas-navy" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-texas-navy mb-3">
                              Are there any hidden fees?
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              No hidden fees. All costs are clearly displayed above, including the monthly service fee of ${planData.fees.monthlyFee} and any applicable connection or termination fees. What you see is what you pay.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* FAQ Item 3 */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-texas-navy p-2 rounded-full flex-shrink-0">
                            <Leaf className="w-5 h-5 text-texas-gold" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-texas-navy mb-3">
                              What does {planData.renewablePercent}% renewable mean?
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              This plan is backed by {planData.renewablePercent}% renewable energy sources like wind and solar. This helps reduce your carbon footprint while supporting clean energy development in Texas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* FAQ Item 4 */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-600 p-2 rounded-full flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-texas-navy mb-3">
                              How long does it take to start service?
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              Service typically begins within 1-2 business days for existing connections. New connections may take 3-5 business days depending on your utility company's processing time.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* More Questions CTA */}
                  <div className="mt-10 p-8 bg-gradient-to-r from-texas-navy to-blue-800 rounded-2xl text-white text-center">
                    <h4 className="text-2xl font-bold mb-4">Still Have Questions?</h4>
                    <p className="text-texas-cream mb-6 text-lg">
                      Our Texas energy experts are here to help you make the right choice.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        className="bg-texas-gold hover:bg-white text-texas-navy hover:text-texas-navy font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📞</span>
                          <span>Call (877) 999-POWER</span>
                        </div>
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-2 border-texas-gold text-texas-gold hover:bg-texas-gold hover:text-texas-navy font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <span>Live Chat Support</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Related Plans Card - Enterprise Grade */}
            <Card className="bg-white shadow-xl border border-texas-cream-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-texas-cream-200 p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-texas-gold rounded-lg">
                    <Star className="w-6 h-6 text-texas-navy" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-texas-navy">
                    Customers Also Viewed
                  </CardTitle>
                </div>
                <div className="w-20 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full"></div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Mock related plans with enhanced styling */}
                  <Card className="group bg-gradient-to-br from-white to-gray-50 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-texas-gold/5 rounded-full -translate-y-10 translate-x-10"></div>
                    <CardContent className="p-0 relative">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-white rounded-xl shadow-md">
                          <ProviderLogo 
                            providerName="TXU Energy" 
                            size="sm"
                            variant="rounded"
                            className="w-12 h-12"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-texas-navy group-hover:text-texas-red transition-colors duration-200">Electric Freedom 24</h4>
                          <p className="text-base text-gray-600 font-medium">TXU Energy</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-3xl font-extrabold text-texas-red">11.8¢</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">per kWh</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">4.2</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-texas-navy hover:bg-texas-red text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 group-hover:scale-105 focus-visible:ring-2 focus-visible:ring-texas-navy/40"
                        onClick={() => window.location.href = `/electricity-plans/${currentCitySlug}/txu-energy/electric-freedom-24`}
                        aria-label="View details for TXU Energy Electric Freedom 24 plan"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="group bg-gradient-to-br from-white to-gray-50 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-texas-red/5 rounded-full -translate-y-10 translate-x-10"></div>
                    <CardContent className="p-0 relative">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-white rounded-xl shadow-md">
                          <ProviderLogo 
                            providerName="Direct Energy" 
                            size="sm"
                            variant="rounded"
                            className="w-12 h-12"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-texas-navy group-hover:text-texas-red transition-colors duration-200">Live Brighter 12</h4>
                          <p className="text-base text-gray-600 font-medium">Direct Energy</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-3xl font-extrabold text-texas-red">13.2¢</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">per kWh</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">4.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-texas-navy hover:bg-texas-red text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 group-hover:scale-105 focus-visible:ring-2 focus-visible:ring-texas-navy/40"
                        onClick={() => window.location.href = `/electricity-plans/${currentCitySlug}/direct-energy/live-brighter-12`}
                        aria-label="View details for Direct Energy Live Brighter 12 plan"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                {/* View All Plans CTA */}
                <div className="mt-8 text-center">
                  <Button 
                    variant="outline"
                    className="border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white py-4 px-8 font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                    onClick={() => window.location.href = `/electricity-plans/${currentCitySlug}`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>View All Available Plans</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Selection Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              
              {/* Pricing Calculator Card - Enterprise Grade */}
              <Card className="bg-white shadow-2xl border border-texas-cream-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-texas-cream to-texas-cream-200 border-b border-texas-cream-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-texas-navy rounded-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-texas-navy">
                      Your Monthly Cost
                    </CardTitle>
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-texas-red to-texas-gold rounded-full mt-3"></div>
                </CardHeader>
                
                <CardContent className="p-8">
                  {/* Usage Slider - Enhanced */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-lg font-bold text-texas-navy">
                        Monthly Usage (kWh)
                      </label>
                      <div className="bg-texas-red text-white px-4 py-2 rounded-full font-bold text-xl">
                        {usage.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl">
                      <Slider
                        value={[usage]}
                        onValueChange={(value) => setUsage(value[0])}
                        max={3000}
                        min={500}
                        step={50}
                        className="w-full mb-4"
                      />
                      <div className="flex justify-between text-sm text-gray-600 font-medium">
                        <span className="bg-gray-200 px-3 py-1 rounded-full">500 kWh</span>
                        <span className="bg-gray-200 px-3 py-1 rounded-full">3,000 kWh</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost Breakdown - Enhanced */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-4 border border-gray-200 shadow-lg">
                    <h4 className="text-lg font-bold text-texas-navy mb-4">Cost Breakdown</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-gray-700 font-medium">Electricity charges</span>
                        <span className="font-bold text-gray-800 text-lg">${electricityCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-gray-700 font-medium">Monthly service fee</span>
                        <span className="font-bold text-gray-800 text-lg">${planData.fees.monthlyFee}</span>
                      </div>
                      <div className="border-t-2 border-texas-gold pt-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-texas-navy to-blue-800 rounded-2xl text-white shadow-xl text-center">
                          <span className="font-bold text-xl mb-2">Total Monthly Cost</span>
                          <span className="font-extrabold text-3xl text-texas-gold">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-8 bg-gradient-to-t from-gray-50 to-white">
                  <div className="w-full space-y-4">
                    {/* Primary CTA - Enterprise Grade */}
                    <div className="relative">
                      <Button 
                        onClick={() => setIsAddressModalOpen(true)}
                        disabled={planIdLoading}
                        className="w-full bg-gradient-to-r from-texas-red to-red-600 hover:from-texas-red-600 hover:to-red-700 text-white py-4 px-6 text-lg font-bold rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-texas-red/40 focus-visible:ring-offset-2 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        aria-describedby="plan-selection-description"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          {planIdLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading Plan...</span>
                            </>
                          ) : (
                            <>
                              <span>Select This Plan</span>
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </div>
                      </Button>
                      <div className="absolute -inset-1 bg-gradient-to-r from-texas-red to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-300 -z-10 pointer-events-none"></div>
                    </div>
                    
                    <div id="plan-selection-description" className="sr-only">
                      Opens address verification modal to check plan availability at your service location
                    </div>
                    
                    {/* Secondary Actions - Enhanced */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <Button 
                        variant="outline" 
                        className="border-2 border-texas-navy text-texas-navy hover:bg-texas-navy hover:text-white py-4 px-6 font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-texas-navy/40"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Compare Plans
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-2 border-texas-gold text-texas-gold hover:bg-texas-gold hover:text-texas-navy py-4 px-6 font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-texas-gold/40"
                      >
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Save for Later
                        </div>
                      </Button>
                    </div>
                    
                    {/* Value Proposition */}
                    <div className="text-center p-4 bg-gradient-to-r from-texas-cream-50 to-white rounded-xl border border-texas-cream-200">
                      <p className="text-sm text-texas-navy font-semibold">
                        🔒 Secure signup • ⚡ Instant activation • 📞 24/7 support
                      </p>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Trust Signals Card - Enhanced */}
              <Card className="bg-gradient-to-br from-texas-gold-50 to-orange-50 border-2 border-texas-gold-200 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="relative">
                    <div className="absolute -top-2 -right-2 w-16 h-16 bg-texas-gold rounded-full opacity-20"></div>
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-texas-red rounded-full opacity-20"></div>
                    <div className="relative">
                      <div className="bg-texas-gold p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-lg">
                        <Shield className="w-12 h-12 text-texas-navy mx-auto" />
                      </div>
                      <CardTitle className="text-xl font-bold text-texas-navy mb-4">
                        Protected Selection
                      </CardTitle>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-texas-navy">
                          <CheckCircle className="w-5 h-5 text-texas-gold" />
                          <span className="font-semibold">Licensed Provider</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-texas-navy">
                          <CheckCircle className="w-5 h-5 text-texas-gold" />
                          <span className="font-semibold">Rate Guaranteed</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-texas-navy">
                          <CheckCircle className="w-5 h-5 text-texas-gold" />
                          <span className="font-semibold">No Hidden Fees</span>
                        </div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl">
                        <div className="text-sm text-texas-navy font-bold">
                          PUCT License #10039 • BBB A+ Rated
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section Card - Enhanced */}
              <Card className="bg-gradient-to-br from-texas-navy to-blue-800 text-white shadow-xl rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-texas-gold/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-texas-red/10 rounded-full translate-y-12 -translate-x-12"></div>
                <CardContent className="p-8 text-center relative">
                  <div className="bg-texas-gold p-3 rounded-full w-16 h-16 mx-auto mb-4">
                    <Info className="w-10 h-10 text-texas-navy mx-auto" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-4">
                    Need Help Deciding?
                  </CardTitle>
                  <CardDescription className="text-texas-cream mb-6 text-base leading-relaxed">
                    Our Texas energy experts are here to help you find the perfect plan for your home and budget.
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="border-2 border-texas-gold text-texas-gold hover:bg-texas-gold hover:text-texas-navy font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Get Free Consultation
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Button>
                  
                  {/* Contact Options */}
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="space-y-2 text-center">
                      <div className="text-texas-cream text-sm">
                        📞 Call: (877) 999-POWER
                      </div>
                      <div className="text-texas-cream text-sm">
                        💬 Chat: Available 24/7
                      </div>
                    </div>
                  </div>
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
          },
          // Priority: Use plan's actual MongoDB ID first, then fallback to API-fetched ID
          apiPlanId: planData.id && /^[a-f0-9]{24}$/i.test(planData.id) ? planData.id : realPlanId
        }}
        usage={usage}
        onSuccess={handleAddressSuccess}
      />
    </div>
  );
};