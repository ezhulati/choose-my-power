/**
 * Microcopy Library for ChooseMyPower
 * 
 * Conversational text patterns that make the experience feel human.
 * Every piece of text follows the neighbor-over-the-fence test:
 * "Would a friendly local expert say it this way?"
 */

export const microcopyLibrary = {
  // Button Labels - Action-oriented, outcome-focused
  buttons: {
    primary: {
      search: 'Show My Plans',
      compare: 'Compare These',
      select: 'Pick This One',
      continue: 'Keep Going',
      submit: 'That's It',
      save: 'Save This',
      filter: 'Filter Plans',
      reset: 'Start Over',
      tryAgain: 'Try Again',
      viewMore: 'Show More',
      viewLess: 'Show Less',
      getStarted: 'Let's Go',
      findPlans: 'Find My Plans',
      seePrices: 'See Prices',
      checkRates: 'Check Rates'
    },
    secondary: {
      cancel: 'Never Mind',
      back: 'Go Back',
      skip: 'Skip This',
      maybe: 'Maybe Later',
      help: 'Need Help?',
      learn: 'Tell Me More',
      why: 'Why Ask?',
      explain: 'How's That Work?'
    }
  },

  // Form Fields - Clear, specific, example-driven
  forms: {
    placeholders: {
      zipCode: '75201',
      streetAddress: '123 Main St',
      email: 'you@email.com',
      phone: '(214) 555-0123',
      usage: '1000',
      squareFeet: '1500'
    },
    labels: {
      zipCode: 'ZIP Code',
      streetAddress: 'Street Address',
      email: 'Email',
      phone: 'Phone',
      monthlyUsage: 'Monthly kWh',
      homeSize: 'Square Feet',
      contractLength: 'How Long?',
      planType: 'Price Type'
    },
    helpers: {
      zipCode: 'Your 5-digit ZIP',
      streetAddress: 'Number and street name',
      usage: 'Check your last bill',
      email: 'For your results',
      phone: 'Text-friendly number',
      multiZip: 'You're on the border - need your street too'
    }
  },

  // Error Messages - Friendly, specific, helpful
  errors: {
    validation: {
      zipRequired: 'Need your ZIP code',
      zipInvalid: 'Just need 5 digits - like 75201',
      zipNotTexas: 'That's not a Texas ZIP code',
      zipNotFound: 'Can't find that ZIP. Double-check?',
      addressRequired: 'What street are you on?',
      addressTooShort: 'Need the street number and name',
      addressNotFound: 'Can't find that address. Try just the number and street?',
      emailInvalid: 'That email doesn't look right',
      phoneInvalid: 'Need a 10-digit phone number',
      usageInvalid: 'Just numbers - like 1000'
    },
    network: {
      connectionLost: 'Lost connection. Check your internet?',
      serverError: 'Something broke on our side. Try again?',
      timeout: 'Taking too long. Let's try again?',
      notAvailable: 'Can't load that right now. Refresh?'
    },
    boundary: {
      multiTdsp: 'You're right on the border. What street?',
      needAddress: 'Multiple utilities here. Need your exact address.',
      notDeregulated: 'That's a city-owned utility area - no switching there.',
      notCovered: 'We don't cover that area yet.'
    }
  },

  // Success Messages - Celebratory, clear, encouraging
  success: {
    found: {
      plans: 'Nice! Found {count} plans in your area',
      singlePlan: 'Found 1 plan that works',
      utility: 'Got it! You're served by {name}',
      address: 'Perfect! Found your spot',
      savings: 'You could save ${amount} a year!'
    },
    actions: {
      saved: 'Saved it!',
      compared: 'Added to comparison',
      filtered: 'Showing {count} matches',
      shared: 'Sent!',
      updated: 'All set!'
    }
  },

  // Loading Messages - Human, progress-aware
  loading: {
    initial: 'One sec...',
    searching: 'Looking up your area...',
    fetchingPlans: 'Getting all your plans...',
    comparing: 'Comparing prices...',
    calculating: 'Running the numbers...',
    almostDone: 'Almost ready...',
    finalizing: 'Just about done...',
    specific: {
      zipLookup: 'Checking your ZIP...',
      addressValidation: 'Finding your address...',
      utilityCheck: 'Looking up your utility...',
      planDetails: 'Getting plan details...',
      rateCalculation: 'Calculating your rate...'
    }
  },

  // Navigation - Clear, action-oriented
  navigation: {
    main: {
      home: 'Home',
      shop: 'Shop Plans',
      compare: 'Compare',
      learn: 'Learn',
      help: 'Help'
    },
    breadcrumbs: {
      separator: '›',
      you: 'You're here'
    },
    pagination: {
      next: 'Next',
      previous: 'Back',
      page: 'Page {n}',
      showing: 'Showing {start}-{end} of {total}'
    }
  },

  // Empty States - Encouraging, helpful
  empty: {
    noResults: {
      title: 'No Matches',
      message: 'Try different filters?',
      action: 'Clear Filters'
    },
    noPlans: {
      title: 'No Plans Yet',
      message: 'Enter your ZIP to see plans',
      action: 'Get Started'
    },
    comparison: {
      title: 'Nothing to Compare',
      message: 'Pick at least 2 plans',
      action: 'Browse Plans'
    }
  },

  // Tooltips & Help Text - Brief, clear
  tooltips: {
    contractLength: 'How long the price is locked in',
    earlyTermination: 'Fee if you leave early',
    greenEnergy: 'Percentage from renewable sources',
    usageCredit: 'Bill credit at certain usage levels',
    monthlyFee: 'Fixed charge every month',
    tdsp: 'Your utility company (wires & poles)',
    rep: 'Who you buy electricity from'
  },

  // Confirmation Messages - Clear, reassuring
  confirmations: {
    questions: {
      remove: 'Remove this?',
      clear: 'Clear everything?',
      leave: 'Leave without saving?',
      switch: 'Switch plans?'
    },
    actions: {
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      cancel: 'Cancel'
    }
  },

  // Progress Indicators - Step-aware
  progress: {
    steps: {
      zip: 'ZIP Code',
      address: 'Address',
      utility: 'Utility',
      plans: 'Plans',
      compare: 'Compare',
      select: 'Select'
    },
    status: {
      current: 'Current Step',
      completed: 'Done',
      upcoming: 'Next'
    }
  },

  // Filter Options - Conversational labels
  filters: {
    labels: {
      contractLength: 'How long?',
      rateType: 'Price type',
      greenEnergy: 'Clean energy?',
      features: 'Additional features',
      provider: 'Company',
      priceRange: 'Monthly cost'
    },
    options: {
      any: 'Any',
      fixed: 'Fixed price',
      variable: 'Variable price',
      indexed: 'Market price',
      prepaid: 'Pay upfront',
      postpaid: 'Pay monthly',
      green: 'Renewable energy',
      noDeposit: 'No deposit',
      noContract: 'No contract',
      freeWeekends: 'Free weekends',
      timeOfUse: 'Time-based pricing'
    }
  },

  // Mobile-Specific - Thumb-friendly
  mobile: {
    actions: {
      tap: 'Tap',
      swipe: 'Swipe',
      hold: 'Hold',
      pull: 'Pull to refresh'
    },
    buttons: {
      call: 'Call Now',
      text: 'Text Me',
      share: 'Share',
      save: 'Save'
    }
  },

  // Encouragement - Motivational, friendly
  encouragement: {
    progress: [
      'You're doing great!',
      'Almost there!',
      'One more step!',
      'Looking good!',
      'Nice choice!'
    ],
    savings: [
      'That's a great rate!',
      'You'll save a bunch!',
      'Smart pick!',
      'Good eye!',
      'That's the one!'
    ]
  },

  // Time-Sensitive - Urgency without pressure
  timeSensitive: {
    limited: 'Time-sensitive',
    ending: 'Ends {time}',
    popular: 'Going fast',
    lastChance: 'Last chance',
    today: 'Today only'
  }
};

// Helper function to get microcopy with fallback
export function getMicrocopy(path: string, replacements?: Record<string, unknown>): string {
  const keys = path.split('.');
  let value: unknown = microcopyLibrary;
  
  for (const key of keys) {
    value = value?.[key];
    if (!value) {
      console.warn(`Microcopy not found: ${path}`);
      return path; // Return path as fallback
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Microcopy is not a string: ${path}`);
    return path;
  }
  
  // Replace placeholders
  if (replacements) {
    Object.entries(replacements).forEach(([key, val]) => {
      value = value.replace(`{${key}}`, val);
    });
  }
  
  return value;
}

// Export specific categories for easy import
export const buttons = microcopyLibrary.buttons;
export const forms = microcopyLibrary.forms;
export const errors = microcopyLibrary.errors;
export const success = microcopyLibrary.success;
export const loading = microcopyLibrary.loading;
export const navigation = microcopyLibrary.navigation;
export const empty = microcopyLibrary.empty;
export const tooltips = microcopyLibrary.tooltips;
export const confirmations = microcopyLibrary.confirmations;
export const progress = microcopyLibrary.progress;
export const filters = microcopyLibrary.filters;
export const mobile = microcopyLibrary.mobile;
export const encouragement = microcopyLibrary.encouragement;
export const timeSensitive = microcopyLibrary.timeSensitive;

export default microcopyLibrary;