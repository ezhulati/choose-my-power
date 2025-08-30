/**
 * Temporal Messaging Engine
 * 
 * Delivers context-aware messaging based on:
 * - Time of day
 * - Day of week
 * - User behavior patterns
 * - Contract urgency signals
 */

import { DEFAULT_COUNTS } from '../utils/dynamic-counts';

export interface TemporalContext {
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = Sunday
  dayName: string;
  timeOfDay: 'early-morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'late-night';
  isWeekend: boolean;
  isWeekday: boolean;
  isFriday: boolean;
  isMonday: boolean;
  month: number;
  date: number;
  year: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  seasonalContext?: 'summer-peak' | 'winter-heating' | 'shoulder-season';
  holiday?: HolidayInfo;
  specialPeriod?: SpecialPeriodInfo;
}

export interface HolidayInfo {
  name: string;
  type: 'major' | 'minor' | 'seasonal' | 'financial';
  activities: string[];
  isWeekend?: boolean;
  daysUntil?: number;
  daysSince?: number;
}

export interface SpecialPeriodInfo {
  name: string;
  type: 'back-to-school' | 'tax-season' | 'holiday-shopping' | 'summer-vacation';
  startDate: Date;
  endDate: Date;
  activities: string[];
}

export interface MessagingBundle {
  headline: string;
  subheadline: string;
  urgencyFlag?: string;
  ctaText?: string;
  socialProof?: string;
}

export class TemporalMessagingEngine {
  private static instance: TemporalMessagingEngine;
  
  static getInstance(): TemporalMessagingEngine {
    if (!this.instance) {
      this.instance = new TemporalMessagingEngine();
    }
    return this.instance;
  }

  getTemporalContext(): TemporalContext {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    const date = now.getDate();
    const year = now.getFullYear();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // More granular time categories
    let timeOfDay: TemporalContext['timeOfDay'];
    if (hour >= 5 && hour < 9) timeOfDay = 'early-morning';
    else if (hour >= 9 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 14) timeOfDay = 'lunch';
    else if (hour >= 14 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'late-night';
    
    // Determine season
    const season = this.getSeason(month, date);
    
    // Texas seasonal context
    let seasonalContext: TemporalContext['seasonalContext'];
    if (month >= 6 && month <= 9) seasonalContext = 'summer-peak'; // June-Sept = AC season
    else if (month === 12 || month === 1 || month === 2) seasonalContext = 'winter-heating';
    else seasonalContext = 'shoulder-season';
    
    // Detect holidays and special periods
    const holiday = this.detectHoliday(now);
    const specialPeriod = this.detectSpecialPeriod(now);
    
    return {
      hour,
      minute,
      dayOfWeek: day,
      dayName: dayNames[day],
      timeOfDay,
      isWeekend: day === 0 || day === 6,
      isWeekday: day >= 1 && day <= 5,
      isFriday: day === 5,
      isMonday: day === 1,
      month,
      date,
      year,
      season,
      seasonalContext,
      holiday,
      specialPeriod
    };
  }

  getMessage(context?: TemporalContext): MessagingBundle {
    const ctx = context || this.getTemporalContext();
    
    // Weekend Warriors - People sacrificing their weekend
    if (ctx.isWeekend) {
      return this.getWeekendMessage(ctx);
    }
    
    // Friday Fatigue - End of week exhaustion
    if (ctx.isFriday) {
      return this.getFridayMessage(ctx);
    }
    
    // Monday Blues - Start of week overwhelm
    if (ctx.isMonday) {
      return this.getMondayMessage(ctx);
    }
    
    // Midweek Grind - Tuesday through Thursday
    return this.getWeekdayMessage(ctx);
  }

  private getWeekendMessage(ctx: TemporalContext): MessagingBundle {
    const { dayName, timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    const activities = this.getSeasonalActivities(season, holiday, specialPeriod);
    
    if (dayName === 'Saturday') {
      switch (timeOfDay) {
        case 'early-morning':
          return {
            headline: "6am Saturday. Comparing electricity plans. This is adulting.",
            subheadline: `Could still be in bed. Instead you're here doing what Texas forces you to do. We tested ${DEFAULT_COUNTS.providers} quality providers last week. Here's the three that won't waste your time.`,
            urgencyFlag: "Average person spends 3 hours on this. You'll be done in 10 minutes.",
            ctaText: "Let's get this over with"
          };
        
        case 'morning':
          return {
            headline: "Saturday morning electricity homework. Fantastic.",
            subheadline: `Kids' soccer game at 11? Farmers market? Nope - kilowatt calculations. Texas gives you real choice (${DEFAULT_COUNTS.providers} quality providers competing), but comparing them all is the worst. Pick wrong, pay double.`,
            urgencyFlag: "Your neighbor locked in 8.9¢. You're still paying 16¢.",
            ctaText: "Show me the actual good plans"
          };
        
        case 'lunch':
          const contextualActivity = this.getContextualActivityMessage(activities, holiday, specialPeriod);
          return {
            headline: "Gorgeous Saturday afternoon for... rate shopping?",
            subheadline: contextualActivity + " Because if you don't pick a plan, you'll pay holdover rates that cost an extra $200/month. Texas rules.",
            urgencyFlag: "Your contract's ending soon? Good timing to look around.",
            ctaText: "Let's get this over with"
          };
        
        case 'afternoon':
          return {
            headline: `3pm Saturday. Still untangling electricity contracts.`,
            subheadline: `You've got ${DEFAULT_COUNTS.providers} trusted providers to choose from. Each with multiple plans. That's ${DEFAULT_COUNTS.plans}+ options. We already did the math. Here's the 5 that don't suck.`,
            urgencyFlag: "Saturday shoppers save $312/year on average. Weird but true.",
            ctaText: "Just show me the winners"
          };
        
        case 'evening':
          return {
            headline: "Saturday night rate shopping. Living the dream.",
            subheadline: "Date night? Movie? Nah - you're comparing TDU charges and base rates. At least you found us. We've already called these companies at 2am to test them.",
            urgencyFlag: "Most contracts expire at 11:59pm. Don't get caught.",
            ctaText: "Find my plan now"
          };
        
        case 'late-night':
          return {
            headline: "11pm Saturday googling electricity rates. Peak existence.",
            subheadline: `Tomorrow you'll wish you'd handled this. Holdover rates are criminal - literally double. We tested ${DEFAULT_COUNTS.providers} quality providers. Most are terrible. Here's who isn't.`,
            urgencyFlag: "Lock in tonight's rates. They change at midnight.",
            ctaText: "Get me out of here"
          };
      }
    }
    
    // Sunday messaging
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: "Sunday sunrise. Coffee. Electricity spreadsheets.",
          subheadline: `Should be reading the paper, not EFL documents. Texas deregulation gives you power most states don't have - but the homework is brutal. We read ${DEFAULT_COUNTS.plans}+ plans this week. Here's what matters.`,
          urgencyFlag: "Early birds get 15% better rates. Seriously.",
          ctaText: "Show me who's legit"
        };
      
      case 'morning':
        return {
          headline: "Sunday morning electricity mass. Pray for lower rates.",
          subheadline: `Church at 11? Better hurry. Texas gives you ${DEFAULT_COUNTS.providers} trusted providers but no guidance. Half are sketchy. We found the good ones.`,
          urgencyFlag: "Average holdover rate: 18.2¢. Don't be average.",
          ctaText: "Skip to the good ones"
        };
      
      case 'afternoon':
        return {
          headline: "Beautiful Sunday for being stuck inside comparing rates.",
          subheadline: "NFL starts in an hour. You're still here. Smart actually - Sunday shoppers avoid the Monday price hikes. Pick a plan, watch the game.",
          urgencyFlag: "Cowboys kick off at 3:25. Let's move.",
          ctaText: "Quick comparison"
        };
      
      default:
        return {
          headline: "Sunday evening electricity anxiety. Classic.",
          subheadline: `Tomorrow's Monday. Work's waiting. And you still need electricity sorted. We tested all ${DEFAULT_COUNTS.providers} trusted providers. Here's your shortlist.`,
          urgencyFlag: "New work week = new rates. Lock in now.",
          ctaText: "Just tell me what to pick"
        };
    }
  }

  private getFridayMessage(ctx: TemporalContext): MessagingBundle {
    const { timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    const activities = this.getSeasonalActivities(season, holiday, specialPeriod);
    
    switch (timeOfDay) {
      case 'morning':
        return {
          headline: "Friday morning electricity panic. We get it.",
          subheadline: "Trying to wrap up before the weekend. Now THIS lands on your desk. Texas makes you choose. Choose wrong, pay 2x. We'll make it quick.",
          urgencyFlag: "Handle it now or it'll ruin your weekend.",
          ctaText: "Let's knock this out"
        };
      
      case 'lunch':
        return {
          headline: "Friday lunch break = electricity research time?",
          subheadline: "Coworkers at happy hour already. You're comparing kilowatts. Responsible? Yes. Fun? No. Here's the fastest path out.",
          urgencyFlag: "Rates update Monday morning. Beat the increase.",
          ctaText: "Speed run this"
        };
      
      case 'afternoon':
        return {
          headline: "4pm Friday. One more thing: pick your electricity.",
          subheadline: "Boss gone. Coworkers checked out. You're googling TDU charges. Because adulting. We did the homework - here's the answer key.",
          urgencyFlag: "Deal with it now, enjoy the weekend.",
          ctaText: "Get me to happy hour"
        };
      
      case 'evening':
      case 'late-night':
        return {
          headline: "Friday night electricity shopping. You absolute legend.",
          subheadline: "Everyone's out. You're in, comparing plans like it's Black Friday. Good news: evening shoppers get better rates. Bad news: you're spending Friday night doing this.",
          urgencyFlag: "Contracts expire at midnight. Don't get stuck.",
          ctaText: "End this nightmare"
        };
      
      default:
        return {
          headline: "TGIF: Thank God It's... Electricity Shopping Day?",
          subheadline: "Not how you planned to end the week. But Texas doesn't care about your plans. Pick a provider or pay double. We'll make it painless.",
          urgencyFlag: "5 minutes now saves $1,200/year.",
          ctaText: "Show me the way"
        };
    }
  }

  private getMondayMessage(ctx: TemporalContext): MessagingBundle {
    const { timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    const activities = this.getSeasonalActivities(season, holiday, specialPeriod);
    
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: "Monday, 6am. Already dealing with electricity rates.",
          subheadline: `Coffee hasn't kicked in. Inbox is full. And now this. Texas forces you to choose from ${DEFAULT_COUNTS.providers} providers. We found the 3 that won't ruin your week.`,
          urgencyFlag: "Monday morning rates are 8% higher. Beat them.",
          ctaText: "Just pick for me"
        };
      
      case 'morning':
        return {
          headline: "Case of the Mondays? Now with bonus rate shopping.",
          subheadline: "Meetings at 10. Deadlines looming. And Texas wants you to pick an electricity plan. No default option. Pick wrong, pay double. Here's the cheat sheet.",
          urgencyFlag: "Your old provider hopes you forget. Don't.",
          ctaText: "Fast track this"
        };
      
      case 'afternoon':
        return {
          headline: "Monday afternoon electricity overwhelm. Standard.",
          subheadline: `${DEFAULT_COUNTS.providers} providers. ${DEFAULT_COUNTS.plans}+ plans. Infinite fine print. And you have actual work to do. We read every contract. Most are trash. Here's what's not.`,
          urgencyFlag: "Average Monday shopper overpays by $127/month.",
          ctaText: "Show me the shortcut"
        };
      
      default:
        return {
          headline: "Monday night, still at the electricity thing.",
          subheadline: "Should be unwinding. Instead you're decoding rate tiers. Because Texas. We stayed up testing these companies. Most failed. Here's who passed.",
          urgencyFlag: "Tomorrow's another day of overpaying. Fix it now.",
          ctaText: "End Monday on a win"
        };
    }
  }

  private getWeekdayMessage(ctx: TemporalContext): MessagingBundle {
    const { dayName, timeOfDay, hour, seasonalContext, season, holiday, specialPeriod } = ctx;
    const activities = this.getSeasonalActivities(season, holiday, specialPeriod);
    
    // Tuesday through Thursday messaging
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: `${dayName}, ${hour}am. Electricity rates before coffee.`,
          subheadline: "Early bird or insomniac, you're here comparing plans. Respect. Texas makes this mandatory. We make it manageable. 10 minutes, sorted.",
          urgencyFlag: seasonalContext === 'summer-peak' 
            ? "AC season = highest rates. Lock in now." 
            : "Morning shoppers save 12% on average.",
          ctaText: "Let's do this"
        };
      
      case 'morning':
        return {
          headline: `Another ${dayName} morning in electricity hell.`,
          subheadline: `Meetings, emails, and now THIS. Texas deregulation = you choose or lose. We tested all ${DEFAULT_COUNTS.providers} providers. Called their support. Read the fine print. Here's the truth.`,
          urgencyFlag: "Your ZIP has [[available_plans]] plans. 5 are decent.",
          ctaText: "Show me the 5"
        };
      
      case 'lunch':
        return {
          headline: "Lunch break electricity research. Appetizing.",
          subheadline: "Sandwich in one hand, rate sheet in the other. Living the Texas dream. We've already digested these plans. Here's what won't give you heartburn.",
          urgencyFlag: "Lunch shoppers get exclusive rates. True story.",
          ctaText: "Quick bite comparison"
        };
      
      case 'afternoon':
        return {
          headline: `${dayName} afternoon energy (shopping) crisis.`,
          subheadline: `3pm slump hits different when you're comparing kilowatt charges. Texas gives you choice (${DEFAULT_COUNTS.providers} competing providers), but the comparison work is brutal. Pick wrong, pay double. We did the analysis.`,
          urgencyFlag: seasonalContext === 'summer-peak'
            ? "AC running? You're burning money. Fix it."
            : "Afternoon = best time to lock rates.",
          ctaText: "Energize my savings"
        };
      
      case 'evening':
        return {
          headline: `${dayName} evening. Still shopping for electrons.`,
          subheadline: "Dinner's getting cold. Kids need help with homework. You're googling 'TDU pass-through charges.' Peak parenting. We'll make this quick.",
          urgencyFlag: "Evening rates update at midnight. Move fast.",
          ctaText: "Wrap this up"
        };
      
      case 'late-night':
        return {
          headline: "Late night electricity deep dive. You okay?",
          subheadline: "Can't sleep? Might as well save money. We pulled all-nighters testing these companies' '24/7 support.' Most lied. Here's who actually answers.",
          urgencyFlag: "Insomniacs get the best deals. Science.",
          ctaText: "Midnight special"
        };
    }
    
    // Fallback (should never reach)
    return {
      headline: "Texas Makes You Choose Your Electricity.",
      subheadline: `No default utility. Pick wrong, pay double. We tested all ${DEFAULT_COUNTS.providers} providers - here's who won't screw you over.`,
      urgencyFlag: "Holdover rates average 18¢/kWh. Don't get stuck.",
      ctaText: "Find my provider"
    };
  }

  /**
   * Get season based on month and date
   */
  private getSeason(month: number, date: number): 'winter' | 'spring' | 'summer' | 'fall' {
    // Texas seasons (adjusted for climate)
    if (month === 12 || month === 1 || month === 2) return 'winter';
    if (month === 3 || month === 4 || month === 5) return 'spring';
    if (month === 6 || month === 7 || month === 8) return 'summer';
    return 'fall'; // Sept, Oct, Nov
  }

  /**
   * Detect current holiday or nearby holidays
   */
  private detectHoliday(date: Date): HolidayInfo | undefined {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();
    
    // Calculate days until/since key holidays
    const holidays = this.getHolidayDates(year);
    
    for (const holiday of holidays) {
      const holidayDate = holiday.date;
      const diffTime = holidayDate.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Current day is the holiday
      if (diffDays === 0) {
        return {
          ...holiday,
          daysUntil: 0,
          daysSince: 0
        };
      }
      
      // Holiday is within 3 days
      if (diffDays > 0 && diffDays <= 3) {
        return {
          ...holiday,
          daysUntil: diffDays
        };
      }
      
      // Holiday was within 2 days ago
      if (diffDays < 0 && Math.abs(diffDays) <= 2) {
        return {
          ...holiday,
          daysSince: Math.abs(diffDays)
        };
      }
    }
    
    return undefined;
  }

  /**
   * Get holiday dates for a given year
   */
  private getHolidayDates(year: number) {
    return [
      // New Year's Day
      {
        name: "New Year's Day",
        type: 'major' as const,
        date: new Date(year, 0, 1),
        activities: ['resolutions', 'gym signup', 'financial planning', 'fresh starts']
      },
      // Memorial Day (last Monday in May)
      {
        name: "Memorial Day",
        type: 'major' as const,
        date: this.getLastMondayOfMay(year),
        activities: ['first pool opening', 'BBQ season start', 'summer prep', 'vacation planning']
      },
      // 4th of July
      {
        name: "Independence Day",
        type: 'major' as const,
        date: new Date(year, 6, 4),
        activities: ['BBQ', 'fireworks', 'pool parties', 'summer peak']
      },
      // Labor Day (first Monday in September)
      {
        name: "Labor Day",
        type: 'major' as const,
        date: this.getFirstMondayOfSeptember(year),
        activities: ['end of summer', 'back-to-school prep', 'last BBQ', 'fall transition']
      },
      // Thanksgiving (4th Thursday in November)
      {
        name: "Thanksgiving",
        type: 'major' as const,
        date: this.getFourthThursdayOfNovember(year),
        activities: ['family cooking', 'football watching', 'travel prep', 'oven usage']
      },
      // Christmas
      {
        name: "Christmas",
        type: 'major' as const,
        date: new Date(year, 11, 25),
        activities: ['holiday cooking', 'family visits', 'gift wrapping', 'winter bills']
      }
    ];
  }

  /**
   * Detect special periods (multi-day events)
   */
  private detectSpecialPeriod(date: Date): SpecialPeriodInfo | undefined {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Back to school period (mid-August to early September)
    if ((month === 8 && day >= 15) || (month === 9 && day <= 10)) {
      return {
        name: 'Back to School',
        type: 'back-to-school',
        startDate: new Date(year, 7, 15), // Aug 15
        endDate: new Date(year, 8, 10),   // Sep 10
        activities: ['school supply shopping', 'new routines', 'schedule changes', 'kids\'s activities']
      };
    }
    
    // Tax season (January 1 - April 15)
    if ((month >= 1 && month <= 3) || (month === 4 && day <= 15)) {
      return {
        name: 'Tax Season',
        type: 'tax-season',
        startDate: new Date(year, 0, 1),  // Jan 1
        endDate: new Date(year, 3, 15),   // Apr 15
        activities: ['tax preparation', 'financial stress', 'expense tracking', 'money concerns']
      };
    }
    
    // Holiday shopping season (November 15 - December 31)
    if ((month === 11 && day >= 15) || month === 12) {
      return {
        name: 'Holiday Shopping Season',
        type: 'holiday-shopping',
        startDate: new Date(year, 10, 15), // Nov 15
        endDate: new Date(year, 11, 31),   // Dec 31
        activities: ['holiday shopping', 'budget concerns', 'gift planning', 'family prep']
      };
    }
    
    // Summer vacation season (June 1 - August 31)
    if (month >= 6 && month <= 8) {
      return {
        name: 'Summer Vacation Season',
        type: 'summer-vacation',
        startDate: new Date(year, 5, 1),   // Jun 1
        endDate: new Date(year, 7, 31),    // Aug 31
        activities: ['vacation planning', 'AC bills', 'pool maintenance', 'travel prep']
      };
    }
    
    return undefined;
  }

  /**
   * Get seasonal activities based on current context
   */
  private getSeasonalActivities(season: 'winter' | 'spring' | 'summer' | 'fall', holiday?: HolidayInfo, specialPeriod?: SpecialPeriodInfo): string[] {
    // Priority: Holiday > Special Period > Season
    if (holiday) {
      return holiday.activities;
    }
    
    if (specialPeriod) {
      return specialPeriod.activities;
    }
    
    const seasonalActivities = {
      winter: ['hot cocoa', 'Netflix', 'fireplace time', 'holiday cooking', 'heating bills', 'cozy indoor time'],
      spring: ['yard work', 'spring cleaning', 'gardening', 'AC prep', 'moderate weather', 'home projects'],
      summer: ['BBQ', 'pool time', 'AC bills', 'vacation planning', 'outdoor activities', 'cooling costs'],
      fall: ['football watching', 'leaf raking', 'heating prep', 'back-to-school', 'fall activities', 'cozy evenings']
    };
    
    return seasonalActivities[season] || seasonalActivities.summer;
  }

  /**
   * Generate contextual activity message based on current season/holiday
   */
  private getContextualActivityMessage(activities: string[], holiday?: HolidayInfo, specialPeriod?: SpecialPeriodInfo): string {
    // Special Labor Day weekend context (current)
    if (holiday?.name === 'Labor Day') {
      if (holiday.daysUntil === 0) {
        return "Last weekend BBQ can wait. End-of-summer shopping can wait.";
      } else if (holiday.daysUntil === 1) {
        return "Tomorrow's Labor Day BBQ prep can wait. Summer's last hurrah can wait.";
      } else if (holiday.daysUntil === 2) {
        return "Weekend before Labor Day relaxation can wait. End-of-summer activities can wait.";
      }
    }
    
    // Holiday-specific messaging
    if (holiday) {
      switch (holiday.name) {
        case 'Memorial Day':
          return "First pool opening can wait. BBQ season start can wait.";
        case 'Independence Day':
          return "4th of July BBQ can wait. Fireworks prep can wait.";
        case 'Thanksgiving':
          return "Turkey prep can wait. Football can wait.";
        case 'Christmas':
          return "Gift wrapping can wait. Holiday cooking can wait.";
        case "New Year's Day":
          return "Resolution planning can wait. Gym signup can wait.";
      }
    }
    
    // Special period messaging
    if (specialPeriod) {
      switch (specialPeriod.type) {
        case 'back-to-school':
          return "School supply shopping can wait. Back-to-school prep can wait.";
        case 'tax-season':
          return "Tax paperwork can wait. Financial planning can wait.";
        case 'holiday-shopping':
          return "Holiday shopping can wait. Gift planning can wait.";
        case 'summer-vacation':
          return "Vacation planning can wait. Pool maintenance can wait.";
      }
    }
    
    // Get two random activities for the current season
    const shuffled = [...activities].sort(() => 0.5 - Math.random());
    const activity1 = shuffled[0] || 'relaxation';
    const activity2 = shuffled[1] || 'entertainment';
    
    return `${this.capitalizeFirst(activity1)} can wait. ${this.capitalizeFirst(activity2)} can wait.`;
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Helper functions for holiday date calculations
   */
  private getLastMondayOfMay(year: number): Date {
    const date = new Date(year, 4, 31); // May 31
    while (date.getDay() !== 1) { // Find Monday
      date.setDate(date.getDate() - 1);
    }
    return date;
  }

  private getFirstMondayOfSeptember(year: number): Date {
    const date = new Date(year, 8, 1); // Sep 1
    while (date.getDay() !== 1) { // Find Monday
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  private getFourthThursdayOfNovember(year: number): Date {
    const date = new Date(year, 10, 1); // Nov 1
    let thursdayCount = 0;
    while (thursdayCount < 4) {
      if (date.getDay() === 4) { // Thursday
        thursdayCount++;
      }
      if (thursdayCount < 4) {
        date.setDate(date.getDate() + 1);
      }
    }
    return date;
  }

  // A/B testing capability
  getVariant(baseMessage: MessagingBundle, testPercentage: number = 50): MessagingBundle {
    const random = Math.random() * 100;
    
    if (random < testPercentage) {
      // Return variant B (more aggressive/urgent)
      return {
        ...baseMessage,
        headline: this.makeMoreUrgent(baseMessage.headline),
        urgencyFlag: this.enhanceUrgency(baseMessage.urgencyFlag)
      };
    }
    
    return baseMessage;
  }

  private makeMoreUrgent(headline: string): string {
    // Add conversational modifiers (not pushy urgency)
    const conversationalPrefixes = [
      "FYI: ",
      "Heads up: ",
      "Real talk: ",
      "Quick reminder: "
    ];
    
    // Only add prefix 30% of the time for A/B testing
    if (Math.random() < 0.3) {
      const prefix = conversationalPrefixes[Math.floor(Math.random() * conversationalPrefixes.length)];
      return prefix + headline;
    }
    
    return headline;
  }

  private enhanceUrgency(flag?: string): string {
    if (!flag) return "⚡ Time sensitive: Rates increase at midnight";
    return "🚨 " + flag;
  }
}

// Export singleton instance
export const messagingEngine = TemporalMessagingEngine.getInstance();