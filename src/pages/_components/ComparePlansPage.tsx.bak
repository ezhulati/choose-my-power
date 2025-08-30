import React, { useState } from 'react';
import { ZipCodeSearch } from '../../components/ZipCodeSearch';
import { mockProviders, mockStates } from '../../data/mockData';
import { Icon } from '../../components/ui/Icon';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ComparePlansPageProps {
}

export function ComparePlansPage({}: ComparePlansPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'fixed' | 'variable' | 'green' | 'prepaid' | 'free-time'>('all');
  const [termFilter, setTermFilter] = useState<'all' | '12' | '24' | '36'>('all');
  const [monthlyUsage, setMonthlyUsage] = useState('1000');
  const [showComparison, setShowComparison] = useState(false);

  const handleZipSearch = (zipCode: string) => {
    navigate(`/texas/houston/electricity-plans`);
  };

  const planTypes = [
    {
      id: 'fixed',
      name: 'Fixed Rate Plans',
      icon: Shield,
      color: 'blue',
      description: 'Rates locked for entire contract term',
      benefits: ['Predictable bills', 'Budget protection', 'Rate stability', 'No surprise increases'],
      count: 150
    },
    {
      id: 'variable',
      name: 'Variable Rate Plans', 
      icon: TrendingDown,
      color: 'orange',
      description: 'Rates can change monthly with market',
      benefits: ['Market flexibility', 'Potential savings', 'No long commitment', 'Lower starting rates'],
      count: 85
    },
    {
      id: 'green',
      name: 'Green Energy Plans',
      icon: Leaf,
      color: 'green',
      description: '100% renewable energy sources',
      benefits: ['Environmental impact', 'Wind & solar power', 'Carbon neutral', 'Green certificates'],
      count: 95
    },
    {
      id: 'prepaid',
      name: 'Prepaid Plans',
      icon: DollarSign,
      color: 'purple',
      description: 'Pay before you use electricity',
      benefits: ['No credit check', 'Usage control', 'No deposits', 'Flexible terms'],
      count: 45
    },
    {
      id: 'free-time',
      name: 'Free Time Plans',
      icon: Clock,
      color: 'indigo',
      description: 'Free electricity during specific hours',
      benefits: ['Free nights/weekends', 'High usage savings', 'Time-based value', 'Peak shifting'],
      count: 35
    }
  ];

  // Get all plans with provider info
  const allPlans = mockProviders.flatMap(provider => 
    provider.plans.map(plan => ({ 
      ...plan, 
      providerName: provider.name, 
      providerSlug: provider.slug,
      providerRating: provider.rating,
      providerLogo: provider.logo
    }))
  );

  // Apply filters
  const filteredPlans = allPlans.filter(plan => {
    if (planTypeFilter !== 'all') {
      if (planTypeFilter === 'green' && plan.renewablePercent < 100) return false;
      if (planTypeFilter === 'prepaid' && !plan.name.toLowerCase().includes('prepaid')) return false;
      if (planTypeFilter === 'free-time' && !plan.name.toLowerCase().includes('free')) return false;
      if (planTypeFilter === 'fixed' && plan.type !== 'fixed') return false;
      if (planTypeFilter === 'variable' && plan.type !== 'variable') return false;
    }
    if (termFilter !== 'all' && plan.termLength !== parseInt(termFilter)) return false;
    return true;
  });

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      } else if (prev.length < 4) {
        return [...prev, planId];
      }
      return prev;
    });
  };

  const selectedPlanData = selectedPlans.map(id => 
    allPlans.find(p => p.id === id)
  ).filter(Boolean);

  const calculateMonthlyCost = (rate: number, usage: number, monthlyFee: number) => {
    return (rate * usage / 100) + monthlyFee;
  };

  const planComparisonMetrics = [
    { name: 'Rate per kWh', key: 'rate', format: (val: number) => `${val}¢` },
    { name: 'Contract Length', key: 'termLength', format: (val: number) => `${val} months` },
    { name: 'Plan Type', key: 'type', format: (val: string) => val.charAt(0).toUpperCase() + val.slice(1) },
    { name: 'Monthly Fee', key: 'monthlyFee', format: (plan: any) => `$${plan.fees.monthlyFee}` },
    { name: 'Cancellation Fee', key: 'cancellationFee', format: (plan: any) => `$${plan.fees.cancellationFee}` },
    { name: 'Renewable %', key: 'renewablePercent', format: (val: number) => `${val}%` },
    { name: 'Monthly Cost*', key: 'monthlyCost', format: (plan: any) => `$${calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee).toFixed(2)}` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-8">
              <Icon icon="electricity" size={40} className="text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Compare Electricity Plans - Detailed Plan Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-4xl mx-auto">
              Compare specific electricity plans side-by-side. Analyze rates, contract terms, features, 
              and costs to find the best plan for your usage and preferences.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{allPlans.length}</div>
                <div className="text-green-200 text-sm">Total Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">5</div>
                <div className="text-green-200 text-sm">Plan Types</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">{Math.min(...allPlans.map(p => p.rate))}¢</div>
                <div className="text-green-200 text-sm">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-green-200 text-sm">Comparison</div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <ZipCodeSearch 
                onSearch={handleZipSearch} 
                placeholder="Enter zip code"
                size="lg"
              />
              <p className="text-green-200 text-sm mt-2">Find plans available in your area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Comparison Bar */}
        {selectedPlans.length > 0 && (
          <div className="bg-green-600 text-white rounded-lg p-4 mb-8 sticky top-4 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Comparing {selectedPlans.length} Plans:</span>
                <div className="flex items-center space-x-2">
                  {selectedPlans.slice(0, 2).map((id) => {
                    const plan = allPlans.find(p => p.id === id);
                    return plan ? (
                      <div key={id} className="flex items-center bg-white/20 rounded-full px-3 py-1">
                        <span className="text-sm mr-2">{plan.name}</span>
                        <button
                          onClick={() => togglePlan(id)}
                          className="text-white hover:text-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                  {selectedPlans.length > 2 && (
                    <span className="text-sm">+{selectedPlans.length - 2} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="secondary"
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  {showComparison ? 'Hide' : 'Show'} Plan Comparison
                </Button>
                <button
                  onClick={() => setSelectedPlans([])}
                  className="text-white hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Plan Comparison */}
        {showComparison && selectedPlanData.length > 1 && (
          <Card className="mb-8">
            <CardContent className="p-6">
            <CardTitle className="text-2xl mb-6">
              Detailed Plan Comparison for {monthlyUsage} kWh/month
            </CardTitle>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left font-medium">Plan Details</TableHead>
                    {selectedPlanData.map((plan) => (
                      <TableHead key={plan?.id} className="text-center min-w-48">
                        <div className="flex flex-col items-center">
                          <img
                            src={plan?.providerLogo}
                            alt={`${plan?.providerName} logo`}
                            className="w-10 h-10 rounded-lg object-cover mb-2"
                          />
                          <div className="font-semibold">{plan?.name}</div>
                          <div className="text-sm text-muted-foreground">{plan?.providerName}</div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planComparisonMetrics.map((metric) => (
                    <TableRow key={metric.name}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      {selectedPlanData.map((plan) => (
                        <TableCell key={plan?.id} className="text-center">
                          <div className={`font-semibold ${metric.name === 'Monthly Cost*' ? 'text-green-600 text-lg' : ''}`}>
                            {metric.key === 'monthlyFee' || metric.key === 'cancellationFee' || metric.key === 'monthlyCost'
                              ? metric.format(plan)
                              : metric.format((plan as any)?.[metric.key] || 0)
                            }
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Key Features</TableCell>
                    {selectedPlanData.map((plan) => (
                      <TableCell key={plan?.id}>
                        <div className="space-y-1">
                          {plan?.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center text-xs text-muted-foreground">
                              <Icon icon="success" size={12} className="text-green-600 mr-1 flex-shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Actions</TableCell>
                    {selectedPlanData.map((plan) => (
                      <TableCell key={plan?.id} className="text-center">
                        <div className="space-y-2">
                          <Button
                            onClick={() => navigate(`/plans/${plan?.providerSlug}/${plan?.id}`)}
                            size="sm"
                            className="w-full"
                          >
                            View Plan Details
                          </Button>
                          <Button
                            onClick={() => navigate(`/texas/houston/electricity-plans`)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Get This Plan
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              *Monthly cost calculated for {monthlyUsage} kWh usage including base charges
            </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Type Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse Plans by Type
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setPlanTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                planTypeFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Plan Types
            </button>
            {planTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setPlanTypeFilter(type.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  planTypeFilter === type.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {planTypes.map((type) => (
              <Card key={type.id} className="p-6 text-center">
                <CardContent className="p-0">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-${type.color}-100 text-${type.color}-600 rounded-lg mb-4`}>
                    <Icon icon={type.id === 'fixed' ? 'shield' : type.id === 'variable' ? 'trending' : type.id === 'green' ? 'leaf' : type.id === 'prepaid' ? 'dollar' : 'tabler:clock'} size={24} />
                  </div>
                  <CardTitle className="text-lg mb-2">{type.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">{type.description}</CardDescription>
                  <div className="text-2xl font-bold mb-2">{type.count}</div>
                  <div className="text-sm text-muted-foreground">plans available</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Calculator */}
        <Card className="p-8 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-6">
              Plan Cost Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Usage (kWh)</label>
                <Input
                  type="number"
                  value={monthlyUsage}
                  onChange={(e) => setMonthlyUsage(e.target.value)}
                  placeholder="1000"
                  className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Plan Type</label>
                <Select value={planTypeFilter} onValueChange={(value) => setPlanTypeFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plan Types</SelectItem>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                    <SelectItem value="variable">Variable Rate</SelectItem>
                    <SelectItem value="green">Green Energy</SelectItem>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="free-time">Free Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Contract Length</label>
                <Select value={termFilter} onValueChange={(value) => setTermFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Length</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                    <SelectItem value="36">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg text-muted-foreground mb-2">
                Showing {filteredPlans.length} plans matching your criteria
              </div>
              <div className="text-sm text-muted-foreground">
                Costs calculated for {monthlyUsage} kWh monthly usage
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Plan Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredPlans.length} Plans Match Your Criteria
            </h2>
            <div className="text-sm text-gray-500">
              Select up to 4 plans to compare
            </div>
          </div>

          <div className="space-y-4">
            {filteredPlans.slice(0, 20).map((plan) => {
              const isSelected = selectedPlans.includes(plan.id);
              const monthlyCost = calculateMonthlyCost(plan.rate, parseInt(monthlyUsage), plan.fees.monthlyFee);
              
              return (
                <Card key={plan.id} className="p-6 hover:shadow-md transition-shadow relative">
                  {/* Selection Button */}
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={() => togglePlan(plan.id)}
                      disabled={!isSelected && selectedPlans.length >= 4}
                      size="icon"
                      variant={isSelected ? "default" : "outline"}
                      className={`w-8 h-8 rounded-full ${
                        selectedPlans.length >= 4 && !isSelected
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isSelected ? (
                        <Icon icon="success" size={16} />
                      ) : (
                        <Icon icon="tabler:plus" size={16} />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pr-12">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <img
                          src={plan.providerLogo}
                          alt={`${plan.providerName} logo`}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <div className="text-texas-navy font-medium">{plan.providerName}</div>
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          <Badge variant={plan.type === 'fixed' ? 'default' : plan.type === 'variable' ? 'secondary' : 'outline'}>
                            {plan.type} rate
                          </Badge>
                          {plan.renewablePercent === 100 && (
                            <Badge variant="secondary" className="bg-texas-gold-100 text-texas-navy">
                              <Icon icon="leaf" size={12} className="mr-1" />
                              100% Green
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div className="flex items-center">
                          <Icon icon="tabler:calendar" size={16} className="text-muted-foreground mr-2" />
                          <span>{plan.termLength} month term</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="dollar" size={16} className="text-muted-foreground mr-2" />
                          <span>${plan.fees.monthlyFee}/month fee</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="leaf" size={16} className="text-muted-foreground mr-2" />
                          <span>{plan.renewablePercent}% renewable</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="shield" size={16} className="text-muted-foreground mr-2" />
                          <span>${plan.fees.cancellationFee} ETF</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="star" size={16} className="text-yellow-400 mr-1" />
                          <span>{plan.providerRating} provider rating</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-muted-foreground mb-2">Plan Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className="text-3xl font-bold text-green-600 mb-1">{plan.rate}¢</div>
                      <div className="text-sm text-gray-500 mb-3">per kWh</div>
                      
                      <div className="mb-4">
                        <div className="text-lg font-bold text-texas-navy">${monthlyCost.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">monthly cost*</div>
                        <div className="text-sm text-gray-500">${(monthlyCost * 12).toFixed(0)}/year</div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/plans/${plan.providerSlug}/${plan.id}`)}
                          className="w-full"
                          size="sm"
                        >
                          Plan Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/texas/houston/electricity-plans`)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Get This Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cross-Hub Navigation */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
                <Icon icon="users" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Compare Providers</CardTitle>
              <CardDescription className="text-sm mb-4">
                Compare electricity companies by specialization and service quality.
              </CardDescription>
              <Button
                onClick={() => navigate('/compare/providers')}
                variant="ghost"
                className="text-texas-navy hover:text-texas-navy font-medium text-sm"
              >
                Compare Providers →
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
                <Icon icon="calculator" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Compare Rates</CardTitle>
              <CardDescription className="text-sm mb-4">
                Real-time rate comparison with detailed cost analysis and calculators.
              </CardDescription>
              <Button
                onClick={() => navigate('/compare/rates')}
                variant="ghost"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                Compare Rates →
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 text-center hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
                <Icon icon="tabler:award" size={24} />
              </div>
              <CardTitle className="text-lg mb-3">Best Plans</CardTitle>
              <CardDescription className="text-sm mb-4">
                Expert rankings of top plans by category and features.
              </CardDescription>
              <Button
                onClick={() => navigate('/best')}
                variant="ghost"
                className="text-orange-600 hover:text-orange-800 font-medium text-sm"
              >
                View Best Plans →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}