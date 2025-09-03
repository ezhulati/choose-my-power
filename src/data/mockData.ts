import type { Provider, State, City } from '../types/index';

export const mockProviders: Provider[] = [
  {
    id: 'apge',
    name: 'APGE (American Powernet)',
    slug: 'apge',
    logo: 'https://assets.comparepower.com/images/apge.svg',
    rating: 4.1,
    reviewCount: 1234,
    description: 'Texas electricity provider offering simple, low-rate plans with no gimmicks or hidden fees.',
    serviceStates: ['texas'],
    assessment: 'good',
    heroJourney: {
      honestHeader: 'APGE Review: Actually Decent for Simple Plans',
      whatTheyreGoodAt: [
        'Genuinely competitive rates that match their advertising',
        'No monthly base fees on most plans',
        'Clear, straightforward contract terms',
        'Consistent billing without surprise charges'
      ],
      whereTheyFallShort: [
        'Limited plan variety compared to larger providers',
        'Customer service can be slow during peak times',
        'Website interface feels dated',
        'No new features or smart home integration'
      ],
      realCustomerThemes: [
        '"Rates are exactly what they promised"',
        '"Simple billing, no surprises"',
        '"Customer service takes forever but they do help"',
        '"Not flashy but gets the job done"'
      ],
      bestPlans: ['SimpleSaver 11', 'SimpleSaver 12'],
      bottomLine: 'A solid choice for customers who want honest rates without gimmicks. Not the cheapest, but predictable.',
      recommendedAction: 'choose'
    },
    marketingVsReality: {
      marketingClaims: ['No hidden fees', 'Simple plans', 'Competitive rates'],
      actualPerformance: ['Actually true - fees are transparent', 'Plans are genuinely simple', 'Rates competitive for their tier']
    },
    plans: [
      {
        id: 'apge-simplesaver-11',
        providerId: 'apge',
        name: 'SimpleSaver 11',
        type: 'fixed',
        rate: 9.7,
        termLength: 11,
        renewablePercent: 5.85,
        features: ['Fixed Rate', '$100 Bill Credit', 'No Hidden Fees'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'apge-simplesaver-12',
        providerId: 'apge',
        name: 'SimpleSaver 12',
        type: 'fixed',
        rate: 9.8,
        termLength: 12,
        renewablePercent: 5.85,
        features: ['Fixed Rate', '$100 Bill Credit', 'No Hidden Fees'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'apge-true-simple-12',
        providerId: 'apge',
        name: 'True Simple 12',
        type: 'fixed',
        rate: 15.4,
        termLength: 12,
        renewablePercent: 5.85,
        features: ['Fixed Rate', 'No Gimmicks', 'Straightforward'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Simple Plans', 'No Hidden Fees', 'Competitive Rates'],
    contactPhone: '877-420-3510',
    website: 'https://www.apge.com'
  },
  {
    id: 'gexa-energy',
    name: 'Gexa Energy',
    slug: 'gexa-energy',
    logo: 'https://assets.comparepower.com/images/gexa_energy.svg',
    rating: 4.3,
    reviewCount: 2156,
    description: '100% green energy provider with excellent customer service and satisfaction guarantees.',
    serviceStates: ['texas'],
    assessment: 'good',
    heroJourney: {
      honestHeader: 'Gexa Energy Review: Actually Good Green Energy Option',
      whatTheyreGoodAt: [
        'Legitimate 100% renewable energy from wind farms',
        'Above-average customer service ratings',
        '60-day satisfaction guarantee actually honored',
        'Bill credits are real and applied correctly'
      ],
      whereTheyFallShort: [
        'Green plans cost more than fossil fuel alternatives',
        'Contract terms can be complex with multiple tiers',
        'Rate increases after intro periods',
        'Limited availability in some rural areas'
      ],
      realCustomerThemes: [
        '"Love that it\'s actually green energy"',
        '"Customer service is helpful and friendly"',
        '"Bill went up after first year"',
        '"Worth paying extra for clean energy"'
      ],
      bestPlans: ['Eco Saver Plus 12'],
      bottomLine: 'Best choice if you want legitimate green energy and don\'t mind paying a premium for environmental benefits.',
      recommendedAction: 'choose'
    },
    marketingVsReality: {
      marketingClaims: ['100% clean energy', 'Excellent service', 'Bill credits'],
      actualPerformance: ['Actually 100% renewable', 'Service is above average', 'Credits applied as promised']
    },
    plans: [
      {
        id: 'gexa-eco-saver-plus-12',
        providerId: 'gexa-energy',
        name: 'Eco Saver Plus 12',
        type: 'fixed',
        rate: 9.8,
        termLength: 12,
        renewablePercent: 100,
        features: ['100% Green Energy', '$125 Usage Credit', '60 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'gexa-eco-saver-edge-plus',
        providerId: 'gexa-energy',
        name: 'Eco Saver Edge Plus',
        type: 'fixed',
        rate: 12.0,
        termLength: 12,
        renewablePercent: 100,
        features: ['100% Green Energy', '$100 Usage Credit', '60 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['100% Renewable Energy', 'Usage Credits', '60 Day Happiness Guarantee'],
    contactPhone: '888-688-8460',
    website: 'https://www.gexaenergy.com'
  },
  {
    id: 'frontier-utilities',
    name: 'Frontier Utilities',
    slug: 'frontier-utilities',
    logo: 'https://assets.comparepower.com/images/frontier_utilities.svg',
    rating: 4.2,
    reviewCount: 892,
    description: 'Texas electricity provider offering usage-based bill credits and satisfaction guarantees.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'frontier-saver-plus-12',
        providerId: 'frontier-utilities',
        name: 'Saver Plus 12',
        type: 'fixed',
        rate: 9.8,
        termLength: 12,
        renewablePercent: 30.4,
        features: ['$125 Usage Credit', '60 Day Guarantee', 'Medium to Large Homes'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'frontier-straight-power',
        providerId: 'frontier-utilities',
        name: 'Frontier Straight Power $175',
        type: 'fixed',
        rate: 17.5,
        termLength: 12,
        renewablePercent: 30.4,
        features: ['Fixed Monthly Bill', 'Up to 1200 kWh', '60 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Usage Credits', 'Satisfaction Guarantee', 'No Hidden Fees'],
    contactPhone: '866-280-3131',
    website: 'https://www.frontierutilities.com'
  },
  {
    id: 'rhythm-energy',
    name: 'Rhythm Energy',
    slug: 'rhythm-energy',
    logo: 'https://assets.comparepower.com/images/rhythm_energy.svg',
    rating: 4.4,
    reviewCount: 1567,
    description: '100% renewable energy provider with smart home integration and reward points.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'rhythm-saver-12',
        providerId: 'rhythm-energy',
        name: 'Rhythm Saver 12',
        type: 'fixed',
        rate: 10.1,
        termLength: 12,
        renewablePercent: 100,
        features: ['100% Green Energy', '$100 Bill Credits', 'Auto Pay Credit'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'rhythm-simply-green-23',
        providerId: 'rhythm-energy',
        name: 'Simply Green 23',
        type: 'fixed',
        rate: 16.4,
        termLength: 23,
        renewablePercent: 100,
        features: ['100% Green Energy', 'No Hidden Fees', 'Rhythm Rewards'],
        fees: { monthlyFee: 0, cancellationFee: 175, connectionFee: 0 }
      }
    ],
    features: ['100% Renewable Energy', 'Smart Home Integration', 'Rhythm Rewards Points'],
    contactPhone: '877-825-9940',
    website: 'https://www.rhythmenergy.com'
  },
  {
    id: '4change-energy',
    name: '4Change Energy',
    slug: '4change-energy',
    logo: 'https://assets.comparepower.com/images/4change_energy.svg',
    rating: 3.9,
    reviewCount: 743,
    description: 'Simple electricity plans with no confusing gimmicks and satisfaction guarantees.',
    serviceStates: ['texas'],
    plans: [
      {
        id: '4change-maxx-saver-24',
        providerId: '4change-energy',
        name: 'Maxx Saver Value 24',
        type: 'fixed',
        rate: 9.9,
        termLength: 24,
        renewablePercent: 9,
        features: ['$125 Bill Credit', '60 Day Guarantee', 'Fixed Rate'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: '4change-one-rate-24',
        providerId: '4change-energy',
        name: 'One Rate 24',
        type: 'fixed',
        rate: 16.7,
        termLength: 24,
        renewablePercent: 6,
        features: ['Simple Rate', 'No Strings Attached', '60 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      }
    ],
    features: ['Simple Plans', 'No Confusing Terms', '60 Day Satisfaction Guarantee'],
    contactPhone: '888-250-2215',
    website: 'https://www.4changeenergy.com'
  },
  {
    id: 'discount-power',
    name: 'Discount Power',
    slug: 'discount-power',
    logo: 'https://assets.comparepower.com/images/discount_power.svg',
    rating: 3.8,
    reviewCount: 1089,
    description: 'Affordable electricity with straightforward plans and bill credit options.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'discount-bill-credit-24',
        providerId: 'discount-power',
        name: 'Bill Credit Bundle 24',
        type: 'fixed',
        rate: 10.1,
        termLength: 24,
        renewablePercent: 20,
        features: ['$125 Bill Credit', '90 Day Guarantee', 'Small to Medium Homes'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'discount-wise-buy-24',
        providerId: 'discount-power',
        name: 'Wise Buy Basic 24 Online',
        type: 'fixed',
        rate: 15.8,
        termLength: 24,
        renewablePercent: 20,
        features: ['Fixed Rate', 'No Hidden Fees', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      }
    ],
    features: ['Bill Credits', 'Affordable Plans', '90 Day Satisfaction Guarantee'],
    contactPhone: '866-996-1740',
    website: 'https://www.discountpower.com'
  },
  {
    id: 'cirro-energy',
    name: 'Cirro Energy',
    slug: 'cirro-energy',
    logo: 'https://assets.comparepower.com/images/cirro_energy.svg',
    rating: 4.0,
    reviewCount: 978,
    description: 'Simple electricity plans with bill credits and satisfaction guarantees.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'cirro-simple-bill-credit-24',
        providerId: 'cirro-energy',
        name: 'Simple Bill Credit 24',
        type: 'fixed',
        rate: 10.1,
        termLength: 24,
        renewablePercent: 20,
        features: ['$125 Bill Credit', '90 Day Guarantee', 'Small to Medium Homes'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'cirro-simple-advantage-12',
        providerId: 'cirro-energy',
        name: 'Simple Advantage 12',
        type: 'fixed',
        rate: 15.9,
        termLength: 12,
        renewablePercent: 24,
        features: ['Fixed Rate', 'Simple Plan', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Simple Plans', 'Bill Credits', '90 Day Satisfaction Guarantee'],
    contactPhone: '866-965-5660',
    website: 'https://www.cirro.com'
  },
  {
    id: 'reliant-energy',
    name: 'Reliant Energy',
    slug: 'reliant-energy',
    logo: 'https://assets.comparepower.com/images/reliant.svg',
    rating: 4.1,
    reviewCount: 3421,
    description: 'Major Texas electricity provider with diverse plan options and bill credits.',
    serviceStates: ['texas'],
    assessment: 'mixed',
    heroJourney: {
      honestHeader: 'Reliant Energy Review: The Good and Bad',
      whatTheyreGoodAt: [
        'Wide variety of plan options to choose from',
        'Established company with reliable power delivery',
        'New programs like free nights/weekends',
        'Good mobile app and online account management'
      ],
      whereTheyFallShort: [
        'Complex pricing structures with hidden details',
        'Rates increase significantly after intro periods',
        'Customer service wait times can be excessive',
        'Bill credits often have usage requirements not clearly explained'
      ],
      realCustomerThemes: [
        '"App is great but bills are confusing"',
        '"Free nights only work if you use tons of power"',
        '"Rate doubled after first year"',
        '"Customer service put me on hold for 45 minutes"'
      ],
      bestPlans: ['Power Savings 24 plan'],
      bottomLine: 'Large provider with options, but read the fine print carefully. Good for some, frustrating for others.',
      recommendedAction: 'compare'
    },
    marketingVsReality: {
      marketingClaims: ['Free nights', 'Locked rates', 'Bill credits'],
      actualPerformance: ['Free only under specific high-usage conditions', 'Rate increases after promotional period', 'Credits have complex qualification requirements']
    },
    plans: [
      {
        id: 'reliant-power-savings-24',
        providerId: 'reliant-energy',
        name: 'Power Savings 24 plan',
        type: 'fixed',
        rate: 14.5,
        termLength: 24,
        renewablePercent: 20,
        features: ['Locked Rate', '$50 Bill Credit', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'reliant-truly-free-nights',
        providerId: 'reliant-energy',
        name: 'Truly Free Nights 100% Solar 12 plan',
        type: 'fixed',
        rate: 19.2,
        termLength: 12,
        renewablePercent: 100,
        features: ['Free Nights 8PM-6AM', '100% Solar', 'Make It Solar Program'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Diverse Plan Options', 'Bill Credits', '90 Day Satisfaction Guarantee'],
    contactPhone: '866-983-4620',
    website: 'https://www.reliant.com'
  },
  {
    id: 'constellation-energy',
    name: 'Constellation Energy',
    slug: 'constellation-energy',
    logo: 'https://assets.comparepower.com/images/constellation.svg',
    rating: 3.9,
    reviewCount: 1876,
    description: 'National energy supplier with usage bill credits and home protection plans.',
    serviceStates: ['texas', 'pennsylvania'],
    plans: [
      {
        id: 'constellation-24-month-usage',
        providerId: 'constellation-energy',
        name: '24 Month Usage Bill Credit',
        type: 'fixed',
        rate: 14.5,
        termLength: 24,
        renewablePercent: 30.4,
        features: ['Up to $50 Bill Credits', 'Usage Based', 'Fixed Rate'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'constellation-12-month-ac',
        providerId: 'constellation-energy',
        name: '12Mo Usage Bill Credit + A/C Protection',
        type: 'fixed',
        rate: 14.7,
        termLength: 12,
        renewablePercent: 30.4,
        features: ['A/C Protection', 'HVAC Monitoring', '$50 Bill Credits'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Home Protection Plans', 'Usage Bill Credits', 'HVAC Monitoring'],
    contactPhone: '877-390-0411',
    website: 'https://www.constellation.com'
  },
  {
    id: 'direct-energy',
    name: 'Direct Energy',
    slug: 'direct-energy',
    logo: 'https://assets.comparepower.com/images/direct_energy.svg',
    rating: 3.7,
    reviewCount: 1432,
    description: 'Price stability and specialty plans like free nights electricity.',
    serviceStates: ['texas', 'pennsylvania'],
    plans: [
      {
        id: 'direct-live-brighter-lite-12',
        providerId: 'direct-energy',
        name: 'Live Brighter Lite 12',
        type: 'fixed',
        rate: 15.5,
        termLength: 12,
        renewablePercent: 20,
        features: ['Price Stability', 'Under 1000 kWh Homes', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'direct-twelve-hour-power',
        providerId: 'direct-energy',
        name: 'Twelve Hour Power 12',
        type: 'fixed',
        rate: 22.6,
        termLength: 12,
        renewablePercent: 20,
        features: ['Free Nights 9PM-9AM', 'Specialty Plan', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Free Night Plans', 'Price Stability', '90 Day Satisfaction Guarantee'],
    contactPhone: '866-285-4447',
    website: 'https://www.directenergy.com'
  },
  {
    id: 'green-mountain-energy',
    name: 'Green Mountain Energy',
    slug: 'green-mountain-energy',
    logo: 'https://assets.comparepower.com/images/green_mountain.svg',
    rating: 4.2,
    reviewCount: 987,
    description: 'Leading renewable energy provider with 100% clean electricity plans.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'gme-pollution-free-conserve-12',
        providerId: 'green-mountain-energy',
        name: 'Pollution Free Conserve 12 Preferred',
        type: 'fixed',
        rate: 17.5,
        termLength: 12,
        renewablePercent: 100,
        features: ['100% Wind Energy', 'Conserve & Save', 'Small Spaces'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'gme-pollution-free-eplus-12',
        providerId: 'green-mountain-energy',
        name: 'Pollution Free e-Plus 12 Preferred',
        type: 'fixed',
        rate: 17.8,
        termLength: 12,
        renewablePercent: 100,
        features: ['100% Wind Energy', '90 Day Guarantee', 'Clean Energy'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['100% Clean Energy', 'Wind Power', '90 Day Satisfaction Guarantee'],
    contactPhone: '844-854-2257',
    website: 'https://www.greenmountainenergy.com'
  },
  {
    id: 'just-energy',
    name: 'Just Energy',
    slug: 'just-energy',
    logo: 'https://assets.comparepower.com/images/just_energy.svg',
    rating: 3.6,
    reviewCount: 1234,
    description: 'Simple electricity plans with clear pricing and happiness guarantees.',
    serviceStates: ['texas'],
    assessment: 'bad',
    heroJourney: {
      honestHeader: 'Just Energy Review: Proceed with Caution',
      whatTheyreGoodAt: [
        'Sometimes offers competitive intro rates',
        'Simple plan names (though pricing isn\'t simple)',
        'Available in most Texas markets'
      ],
      whereTheyFallShort: [
        'History of customer complaints and lawsuits',
        'Aggressive sales tactics and door-to-door marketing',
        'Rates often increase dramatically after intro periods',
        'Difficult cancellation process with high fees',
        'Poor customer service ratings consistently'
      ],
      realCustomerThemes: [
        '"They tricked me into switching"',
        '"Bill tripled after 6 months"',
        '"Impossible to reach customer service"',
        '"Charged me $200 to cancel"'
      ],
      bottomLine: 'Significant red flags from customer reviews and regulatory complaints. Many better options available.',
      recommendedAction: 'avoid'
    },
    marketingVsReality: {
      marketingClaims: ['Simple plans', 'Happiness guarantee', 'No surprises'],
      actualPerformance: ['Plans have complex variable pricing', 'Guarantee has strict limitations', 'Many customers report billing surprises']
    },
    plans: [
      {
        id: 'just-power-plus-24',
        providerId: 'just-energy',
        name: 'Power Plus - 24',
        type: 'fixed',
        rate: 12.4,
        termLength: 24,
        renewablePercent: 31.5,
        features: ['$100 Credit', '60 Day Guarantee', 'Fixed Rate'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'just-basics-24',
        providerId: 'just-energy',
        name: 'Basics - 24',
        type: 'fixed',
        rate: 17.5,
        termLength: 24,
        renewablePercent: 31.5,
        features: ['No Base Charge', 'Clear Fixed Rate', '60 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      }
    ],
    features: ['Simple Plans', 'No Base Charges', '60 Day Happiness Guarantee'],
    contactPhone: '866-985-2820',
    website: 'https://www.justenergy.com'
  },
  {
    id: 'tara-energy',
    name: 'Tara Energy',
    slug: 'tara-energy',
    logo: 'https://assets.comparepower.com/images/tara_energy.svg',
    rating: 3.8,
    reviewCount: 654,
    description: 'Texas electricity provider with value plans and free weekend electricity options.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'tara-value-wise-24',
        providerId: 'tara-energy',
        name: 'Value Wise - 24',
        type: 'fixed',
        rate: 14.1,
        termLength: 24,
        renewablePercent: 31.5,
        features: ['$75 Credit', '1000+ kWh Usage', 'Value Plan'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'tara-weekends-free-24',
        providerId: 'tara-energy',
        name: 'Weekends Free Plan - 24',
        type: 'fixed',
        rate: 17.5,
        termLength: 24,
        renewablePercent: 31.5,
        features: ['Free Weekends', 'Power-Packed Weekends', 'Specialty Plan'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      }
    ],
    features: ['Free Weekend Plans', 'Value Pricing', 'Bill Credits'],
    contactPhone: '877-599-2580',
    website: 'https://www.taraenergy.com'
  },
  {
    id: 'atlantex-power',
    name: 'Atlantex Power',
    slug: 'atlantex-power',
    logo: 'https://assets.comparepower.com/images/atlantex_power.svg',
    rating: 4.0,
    reviewCount: 567,
    description: 'New electricity plans with free time periods and green energy options.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'atlantex-radiance1000-12',
        providerId: 'atlantex-power',
        name: 'Radiance1000 12',
        type: 'fixed',
        rate: 12.1,
        termLength: 12,
        renewablePercent: 7,
        features: ['$100 Monthly Credit', '999+ kWh Usage', '90 Day Guarantee'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'atlantex-luminous-weekends-12',
        providerId: 'atlantex-power',
        name: 'Luminous Weekends 12',
        type: 'fixed',
        rate: 16.2,
        termLength: 12,
        renewablePercent: 7,
        features: ['Free Weekends', 'Friday 10PM-Monday 9AM', 'No TDU Markup'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Free Time Periods', 'No TDU Markup', '90 Day Satisfaction Guarantee'],
    contactPhone: '866-992-1590',
    website: 'https://www.atlantexpower.com'
  },
  {
    id: 'amigo-energy',
    name: 'Amigo Energy',
    slug: 'amigo-energy',
    logo: 'https://assets.comparepower.com/images/amigo_energy.svg',
    rating: 3.9,
    reviewCount: 823,
    description: 'Flexible electricity plans with free time periods and no monthly fees.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'amigo-secure-energy-24',
        providerId: 'amigo-energy',
        name: 'Secure Energy - 24',
        type: 'fixed',
        rate: 17.6,
        termLength: 24,
        renewablePercent: 31.5,
        features: ['Fixed Rate', 'Secure Plan', 'Great Value'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      },
      {
        id: 'amigo-12th-month-free',
        providerId: 'amigo-energy',
        name: '12th Month Free - 12',
        type: 'fixed',
        rate: 18.6,
        termLength: 12,
        renewablePercent: 31.5,
        features: ['12th Month Free', 'No Monthly Fee', 'Simple Rate'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Free Month Plans', 'Free Time Periods', 'No Monthly Fees'],
    contactPhone: '866-993-4445',
    website: 'https://www.amigoenergy.com'
  },
  {
    id: 'payless-power',
    name: 'Payless Power',
    slug: 'payless-power',
    logo: 'https://assets.comparepower.com/images/payless_power.svg',
    rating: 3.5,
    reviewCount: 892,
    description: 'Prepaid electricity with no credit check or deposit required.',
    serviceStates: ['texas'],
    plans: [
      {
        id: 'payless-12-month-prepaid',
        providerId: 'payless-power',
        name: '12 Month - Prepaid - No Deposit & No Credit Check',
        type: 'fixed',
        rate: 19.2,
        termLength: 12,
        renewablePercent: 25.5,
        features: ['No Credit Check', 'No Deposit', 'Prepaid Service'],
        fees: { monthlyFee: 0, cancellationFee: 0, connectionFee: 40 }
      },
      {
        id: 'payless-6-month-prepaid',
        providerId: 'payless-power',
        name: '6 Month - Prepaid -No Deposit & No Credit Check',
        type: 'fixed',
        rate: 19.6,
        termLength: 6,
        renewablePercent: 25.5,
        features: ['No Credit Check', 'No Deposit', 'Short Term'],
        fees: { monthlyFee: 0, cancellationFee: 0, connectionFee: 40 }
      }
    ],
    features: ['Prepaid Service', 'No Credit Check', 'No Deposit Required'],
    contactPhone: '855-854-8490',
    website: 'https://www.paylesspower.com',
    assessment: 'mixed',
    heroJourney: {
      honestHeader: 'Payless Power Review: The Good and Bad',
      whatTheyreGoodAt: [
        'No credit check or deposit required',
        'Prepaid service with usage control',
        'Good for people with poor credit history',
        'No long-term contract commitment'
      ],
      whereTheyFallShort: [
        'Higher rates than traditional post-paid plans',
        'Daily fees can add up quickly',
        'Limited customer service hours',
        'Prepaid model not for everyone'
      ],
      realCustomerThemes: [
        '"Great for getting started with bad credit"',
        '"Rates are high but at least no deposit"',
        '"Daily fees add up more than expected"',
        '"Good for controlling usage"'
      ],
      bottomLine: 'Useful option for people with credit issues, but you\'ll pay more for the convenience.',
      recommendedAction: 'compare'
    },
    marketingVsReality: {
      marketingClaims: ['No deposit', 'No credit check', 'Control your usage'],
      actualPerformance: ['True - no deposit needed', 'True - no credit check', 'Prepaid helps but rates are higher']
    }
  },
  {
    id: 'txu-energy',
    name: 'TXU Energy',
    slug: 'txu-energy',
    logo: 'https://assets.comparepower.com/images/txu_energy.svg',
    rating: 3.8,
    reviewCount: 4567,
    description: 'One of Texas\' largest electricity providers with diverse plan options and established infrastructure.',
    serviceStates: ['texas'],
    assessment: 'mixed',
    heroJourney: {
      honestHeader: 'TXU Energy Review: The Good and Bad',
      whatTheyreGoodAt: [
        'Long-established company with reliable service',
        'Wide variety of plan options and terms',
        'Good mobile app and online account management',
        'New plans like free nights and weekends'
      ],
      whereTheyFallShort: [
        'Often not the cheapest option available',
        'Complex pricing with variable rate increases',
        'Customer service can have long wait times',
        'Free time plans have high usage requirements'
      ],
      realCustomerThemes: [
        '"Reliable but expensive"',
        '"Free nights only work if you use a lot of power"',
        '"Customer service takes forever"',
        '"Bills went up after the first year"'
      ],
      bestPlans: ['TXU Energy Oncor Electric Delivery 12'],
      bottomLine: 'Large, established provider that\'s reliable but often pricier than alternatives. Good if you value brand recognition.',
      recommendedAction: 'compare'
    },
    marketingVsReality: {
      marketingClaims: ['Free nights', 'Texas\' #1 provider', 'Locked rates'],
      actualPerformance: ['Free only with high usage', 'Large but not necessarily best value', 'Rates can increase after intro periods']
    },
    plans: [
      {
        id: 'txu-oncor-12',
        providerId: 'txu-energy',
        name: 'TXU Energy Oncor Electric Delivery 12',
        type: 'fixed',
        rate: 15.2,
        termLength: 12,
        renewablePercent: 23,
        features: ['Fixed Rate', 'No Monthly Fee', 'Online Account Management'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      }
    ],
    features: ['Brand Recognition', 'Diverse Plan Options', 'Mobile App'],
    contactPhone: '1-800-242-9113',
    website: 'https://www.txu.com'
  },
  {
    id: 'champion-energy',
    name: 'Champion Energy',
    slug: 'champion-energy',
    logo: 'https://assets.comparepower.com/images/champion_energy.svg',
    rating: 4.0,
    reviewCount: 1876,
    description: 'Texas electricity provider focused on competitive rates and customer satisfaction.',
    serviceStates: ['texas'],
    assessment: 'good',
    heroJourney: {
      honestHeader: 'Champion Energy Review: Actually Decent',
      whatTheyreGoodAt: [
        'Competitive rates that match their advertising',
        'Good customer service ratings',
        'Straightforward contract terms',
        'Reliable billing without surprises'
      ],
      whereTheyFallShort: [
        'Limited plan variety compared to larger providers',
        'Not available in all Texas markets',
        'Website could be more user-friendly',
        'Fewer new features than competitors'
      ],
      realCustomerThemes: [
        '"Rates stayed exactly what they promised"',
        '"Customer service actually picks up the phone"',
        '"Simple plan, simple billing"',
        '"Nothing fancy but reliable"'
      ],
      bestPlans: ['Champion Saver 12', 'Champion Select 24'],
      bottomLine: 'Solid choice for customers who want honest rates and decent service without unnecessary complications.',
      recommendedAction: 'choose'
    },
    marketingVsReality: {
      marketingClaims: ['Competitive rates', 'Great service', 'No surprises'],
      actualPerformance: ['Rates are genuinely competitive', 'Service is above average', 'Billing is transparent']
    },
    plans: [
      {
        id: 'champion-saver-12',
        providerId: 'champion-energy',
        name: 'Champion Saver 12',
        type: 'fixed',
        rate: 11.2,
        termLength: 12,
        renewablePercent: 30,
        features: ['Fixed Rate', 'No Monthly Fee', '100% Wind Energy'],
        fees: { monthlyFee: 0, cancellationFee: 150, connectionFee: 0 }
      },
      {
        id: 'champion-select-24',
        providerId: 'champion-energy',
        name: 'Champion Select 24',
        type: 'fixed',
        rate: 10.8,
        termLength: 24,
        renewablePercent: 30,
        features: ['Low Fixed Rate', '24 Month Term', 'Online Account'],
        fees: { monthlyFee: 0, cancellationFee: 200, connectionFee: 0 }
      }
    ],
    features: ['Competitive Rates', 'Good Service', 'Renewable Energy Options'],
    contactPhone: '1-866-636-3271',
    website: 'https://www.championenergy.com'
  }
];

export const mockStates: State[] = [
  {
    id: 'texas',
    name: 'Texas',
    slug: 'texas',
    abbreviation: 'TX',
    isDeregulated: true,
    averageRate: 12.1,
    topCities: [
      {
        id: 'houston',
        name: 'Houston',
        slug: 'houston',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010'],
        population: 2320268,
        averageRate: 11.8,
        topProviders: ['apge', 'gexa-energy', 'frontier-utilities', 'rhythm-energy', '4change-energy']
      },
      {
        id: 'dallas',
        name: 'Dallas',
        slug: 'dallas',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210'],
        population: 1343573,
        averageRate: 12.2,
        topProviders: ['apge', 'gexa-energy', 'reliant-energy', 'constellation-energy', 'discount-power']
      },
      // Note: Austin and San Antonio removed - served by municipal utilities (Austin Energy & CPS Energy, not deregulated)
      {
        id: 'fort-worth',
        name: 'Fort Worth',
        slug: 'fort-worth',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['76101', '76102', '76103', '76104', '76105', '76106', '76107', '76108', '76109', '76110'],
        population: 918915,
        averageRate: 12.1,
        topProviders: ['apge', 'reliant-energy', 'green-mountain-energy', 'constellation-energy', 'cirro-energy']
      },
      {
        id: 'el-paso',
        name: 'El Paso',
        slug: 'el-paso',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['79901', '79902', '79903', '79904', '79905', '79906', '79907', '79908', '79910', '79911'],
        population: 695044,
        averageRate: 12.3,
        topProviders: ['apge', 'direct-energy', 'constellation-energy', 'discount-power', 'cirro-energy']
      },
      {
        id: 'arlington',
        name: 'Arlington',
        slug: 'arlington',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['76001', '76002', '76003', '76004', '76005', '76006', '76010', '76011', '76012', '76013'],
        population: 398854,
        averageRate: 12.0,
        topProviders: ['apge', 'reliant-energy', 'constellation-energy', 'discount-power', 'cirro-energy']
      },
      {
        id: 'plano',
        name: 'Plano',
        slug: 'plano',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75023', '75024', '75025', '75026', '75074', '75075', '75093', '75094', '75023', '75086'],
        population: 285494,
        averageRate: 12.1,
        topProviders: ['apge', 'reliant-energy', 'green-mountain-energy', 'rhythm-energy', 'atlantex-power']
      },
      {
        id: 'irving',
        name: 'Irving',
        slug: 'irving',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75038', '75039', '75060', '75061', '75062', '75063', '75014', '75015', '75016', '75017'],
        population: 256684,
        averageRate: 11.9,
        topProviders: ['apge', 'reliant-energy', 'direct-energy', 'constellation-energy', 'discount-power']
      },
      {
        id: 'garland',
        name: 'Garland',
        slug: 'garland',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75040', '75041', '75042', '75043', '75044', '75045', '75046', '75047', '75048', '75049'],
        population: 246018,
        averageRate: 12.0,
        topProviders: ['apge', 'reliant-energy', 'constellation-energy', 'discount-power', 'cirro-energy']
      },
      {
        id: 'frisco',
        name: 'Frisco',
        slug: 'frisco',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75033', '75034', '75035', '75036', '75037', '75054', '75033', '75035', '75068', '75070'],
        population: 200509,
        averageRate: 12.2,
        topProviders: ['apge', 'green-mountain-energy', 'reliant-energy', 'rhythm-energy', 'atlantex-power']
      },
      {
        id: 'mckinney',
        name: 'McKinney',
        slug: 'mckinney',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75069', '75070', '75071', '75072', '75454', '75069', '75071', '75454', '75070', '75072'],
        population: 195308,
        averageRate: 12.1,
        topProviders: ['apge', 'reliant-energy', 'direct-energy', 'green-mountain-energy', 'constellation-energy']
      },
      {
        id: 'corpus-christi',
        name: 'Corpus Christi',
        slug: 'corpus-christi',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['78401', '78402', '78403', '78404', '78405', '78406', '78407', '78408', '78409', '78410'],
        population: 326586,
        averageRate: 11.7,
        topProviders: ['direct-energy', 'constellation-energy', 'apge', 'discount-power', 'cirro-energy']
      },
      {
        id: 'beaumont',
        name: 'Beaumont',
        slug: 'beaumont',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['77701', '77702', '77703', '77704', '77705', '77706', '77707', '77708', '77710', '77713'],
        population: 118296,
        averageRate: 11.9,
        topProviders: ['apge', 'reliant-energy', 'direct-energy', 'gexa-energy', 'frontier-utilities']
      },
      {
        id: 'pasadena',
        name: 'Pasadena',
        slug: 'pasadena',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['77501', '77502', '77503', '77504', '77505', '77506', '77507', '77508', '77571', '77586'],
        population: 151950,
        averageRate: 11.8,
        topProviders: ['reliant-energy', 'apge', 'green-mountain-energy', 'gexa-energy', 'rhythm-energy']
      },
      {
        id: 'mesquite',
        name: 'Mesquite',
        slug: 'mesquite',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75149', '75150', '75181', '75182', '75185', '75187', '75149', '75150', '75181', '75189'],
        population: 150108,
        averageRate: 12.0,
        topProviders: ['apge', 'reliant-energy', 'constellation-energy', 'discount-power', 'cirro-energy']
      },
      {
        id: 'killeen',
        name: 'Killeen',
        slug: 'killeen',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['76540', '76541', '76542', '76543', '76549', '76544', '76548', '76549', '76540', '76541'],
        population: 153095,
        averageRate: 12.1,
        topProviders: ['apge', 'direct-energy', 'constellation-energy', 'just-energy', 'tara-energy']
      },
      {
        id: 'carrollton',
        name: 'Carrollton',
        slug: 'carrollton',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['75006', '75007', '75010', '75011', '75019', '75006', '75007', '75010', '75011', '75019'],
        population: 133434,
        averageRate: 12.0,
        topProviders: ['apge', 'reliant-energy', 'green-mountain-energy', 'rhythm-energy', 'atlantex-power']
      },
      {
        id: 'denton',
        name: 'Denton',
        slug: 'denton',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['76201', '76202', '76203', '76204', '76205', '76206', '76207', '76208', '76209', '76210'],
        population: 139869,
        averageRate: 12.2,
        topProviders: ['apge', 'green-mountain-energy', 'reliant-energy', 'rhythm-energy', 'atlantex-power']
      },
      {
        id: 'midland',
        name: 'Midland',
        slug: 'midland',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['79701', '79702', '79703', '79704', '79705', '79706', '79707', '79708', '79710', '79711'],
        population: 146038,
        averageRate: 12.4,
        topProviders: ['direct-energy', 'apge', 'constellation-energy', 'discount-power', 'cirro-energy']
      },
      {
        id: 'abilene',
        name: 'Abilene',
        slug: 'abilene',
        state: 'Texas',
        stateSlug: 'texas',
        zipCodes: ['79601', '79602', '79603', '79604', '79605', '79606', '79607', '79608', '79697', '79698'],
        population: 125182,
        averageRate: 12.3,
        topProviders: ['apge', 'direct-energy', 'constellation-energy', 'discount-power', 'just-energy']
      }
    ],
    utilityCompanies: ['CenterPoint Energy', 'Oncor', 'AEP Texas', 'TNMP']
  },
  {
    id: 'pennsylvania',
    name: 'Pennsylvania',
    slug: 'pennsylvania',
    abbreviation: 'PA',
    isDeregulated: true,
    averageRate: 13.4,
    topCities: [
      {
        id: 'philadelphia',
        name: 'Philadelphia',
        slug: 'philadelphia',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['19101', '19102', '19103', '19104', '19105', '19106', '19107', '19108', '19109', '19110'],
        population: 1584064,
        averageRate: 13.1,
        topProviders: ['direct-energy', 'constellation-energy', 'just-energy']
      },
      {
        id: 'pittsburgh',
        name: 'Pittsburgh',
        slug: 'pittsburgh',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['15201', '15202', '15203', '15204', '15205', '15206', '15207', '15208', '15209', '15210'],
        population: 302971,
        averageRate: 13.8,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'allentown',
        name: 'Allentown',
        slug: 'allentown',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['18101', '18102', '18103', '18104', '18105', '18106', '18109', '18195', '18103', '18104'],
        population: 125845,
        averageRate: 13.2,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'erie',
        name: 'Erie',
        slug: 'erie',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['16501', '16502', '16503', '16504', '16505', '16506', '16507', '16508', '16509', '16510'],
        population: 94831,
        averageRate: 13.5,
        topProviders: ['constellation-energy', 'direct-energy']
      },
      {
        id: 'reading',
        name: 'Reading',
        slug: 'reading',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['19601', '19602', '19603', '19604', '19605', '19606', '19607', '19608', '19609', '19610'],
        population: 95112,
        averageRate: 13.3,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'scranton',
        name: 'Scranton',
        slug: 'scranton',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['18501', '18502', '18503', '18504', '18505', '18506', '18507', '18508', '18509', '18510'],
        population: 76328,
        averageRate: 13.6,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'bethlehem',
        name: 'Bethlehem',
        slug: 'bethlehem',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['18015', '18017', '18018', '18020', '18025', '18016', '18017', '18018', '18020', '18025'],
        population: 75781,
        averageRate: 13.4,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'norristown',
        name: 'Norristown',
        slug: 'norristown',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['19401', '19403', '19404', '19401', '19403', '19404', '19401', '19403', '19404', '19401'],
        population: 34324,
        averageRate: 13.3,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      },
      {
        id: 'chester',
        name: 'Chester',
        slug: 'chester',
        state: 'Pennsylvania',
        stateSlug: 'pennsylvania',
        zipCodes: ['19013', '19014', '19015', '19016', '19013', '19014', '19015', '19016', '19013', '19014'],
        population: 33855,
        averageRate: 13.2,
        topProviders: ['constellation-energy', 'direct-energy', 'just-energy']
      }
    ],
    utilityCompanies: ['PECO', 'PPL Electric', 'Duquesne Light', 'Met-Ed', 'Penelec']
  }
];

export const utilityCompanies = {
  texas: [
    {
      id: 'centerpoint-energy',
      name: 'CenterPoint Energy',
      slug: 'centerpoint-energy',
      serviceArea: ['Houston', 'Southeast Texas'],
      description: 'Utility company serving the greater Houston area and surrounding regions.',
      website: 'https://www.centerpointenergy.com'
    },
    {
      id: 'oncor',
      name: 'Oncor',
      slug: 'oncor',
      serviceArea: ['Dallas', 'Fort Worth', 'North Texas'],
      description: 'Largest electric transmission and distribution utility in Texas.',
      website: 'https://www.oncor.com'
    },
    {
      id: 'aep-texas',
      name: 'AEP Texas',
      slug: 'aep-texas',
      serviceArea: ['Corpus Christi', 'South Texas'],
      description: 'Serves customers in South and West Texas regions.',
      website: 'https://www.aeptexas.com'
    }
  ],
  pennsylvania: [
    {
      id: 'peco',
      name: 'PECO',
      slug: 'peco',
      serviceArea: ['Philadelphia', 'Southeastern Pennsylvania'],
      description: 'Electric and natural gas utility serving southeastern Pennsylvania.',
      website: 'https://www.peco.com'
    },
    {
      id: 'ppl-electric',
      name: 'PPL Electric',
      slug: 'ppl-electric',
      serviceArea: ['Allentown', 'Eastern Pennsylvania'],
      description: 'Electric utility serving eastern and central Pennsylvania.',
      website: 'https://www.pplelectric.com'
    },
    {
      id: 'duquesne-light',
      name: 'Duquesne Light',
      slug: 'duquesne-light',
      serviceArea: ['Pittsburgh', 'Western Pennsylvania'],
      description: 'Electric utility serving southwestern Pennsylvania.',
      website: 'https://www.duquesnelight.com'
    }
  ]
};