/**
 * Temporal Messaging Engine
 * 
 * Delivers context-aware messaging based on:
 * - Time of day
 * - Day of week
 * - User behavior patterns
 * - Contract urgency signals
 */

import { DEFAULT_COUNTS, getRealTimeLowestRate } from '../utils/dynamic-counts';

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
    
    // Holiday-specific messaging takes priority
    if (ctx.holiday) {
      return this.getHolidayMessage(ctx);
    }
    
    // Special period messaging
    if (ctx.specialPeriod) {
      return this.getSpecialPeriodMessage(ctx);
    }
    
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

  private getHolidayMessage(ctx: TemporalContext): MessagingBundle {
    const { holiday, timeOfDay, isWeekend, dayName } = ctx;
    if (!holiday) return this.getWeekendMessage(ctx);

    switch (holiday.name) {
      case "Labor Day":
        if (holiday.daysSince && holiday.daysSince <= 7) {
          // RECENTLY PAST LABOR DAY
          return {
            headline: "Post-Labor Day adulting mode.",
            subheadline: "Summer's over. Fall rates kicking in. Time to get your situation sorted."
          };
        } else if (holiday.daysUntil === 0) {
          // IT'S LABOR DAY
          return {
            headline: "Labor Day. Ironic electricity shopping.",
            subheadline: "Celebrating work by doing more work. At least this saves money."
          };
        } else if (holiday.daysUntil === 1) {
          // SUNDAY OF LABOR DAY WEEKEND
          return {
            headline: "Labor Day tomorrow. Last chance weekend.",
            subheadline: "Summer's over Monday. Time to lock in a good rate for fall."
          };
        } else if (holiday.daysUntil === 2 && dayName === 'Saturday') {
          // SATURDAY OF LABOR DAY WEEKEND
          return {
            headline: "Labor Day weekend. Saturday electricity reality check.",
            subheadline: "End of summer, AC bills dropping soon. Time to lock in a good rate for fall."
          };
        } else if (holiday.daysUntil <= 7) {
          // WEEK BEFORE LABOR DAY
          return {
            headline: "Labor Day approaching. Summer wind-down.",
            subheadline: "End of peak AC season coming. Good time to lock in fall rates."
          };
        } else {
          return {
            headline: "Labor Day weekend electricity homework.",
            subheadline: "Last weekend of summer. Time to adult and fix your rate."
          };
        }

      case "Memorial Day":
        return {
          headline: holiday.daysUntil === 0
            ? "Memorial Day electricity research."
            : "Memorial Day weekend prep.",
          subheadline: holiday.daysUntil === 0
            ? "Pool season starts now. Time to lock in a good rate."
            : "Summer's coming. AC bills are coming. Get ready."
        };

      case "Independence Day":
        return {
          headline: holiday.daysUntil === 0
            ? "July 4th electricity freedom."
            : "4th of July weekend planning.",
          subheadline: holiday.daysUntil === 0
            ? "Celebrate independence with a better electricity rate."
            : "BBQ season means AC season. Find a better rate first."
        };

      case "Thanksgiving":
        return {
          headline: holiday.daysUntil === 0
            ? "Thanksgiving Day electricity gratitude."
            : "Thanksgiving prep mode.",
          subheadline: holiday.daysUntil === 0
            ? "Thankful for working AC during family visits."
            : "Family coming over? Better check that electricity rate first."
        };

      case "Christmas":
        return {
          headline: holiday.daysUntil === 0
            ? "Christmas Day electricity miracle."
            : "Christmas prep electricity audit.",
          subheadline: holiday.daysUntil === 0
            ? "Even Santa would comparison shop for electricity."
            : "Holiday lights cost extra. Find a rate that doesn't."
        };

      case "New Year's Day":
        return {
          headline: holiday.daysUntil === 0
            ? "New Year, new electricity rate."
            : "New Year resolution prep.",
          subheadline: holiday.daysUntil === 0
            ? "Starting the year right. With better electricity."
            : "Resolution idea. Find a better electricity rate."
        };

      case "Halloween":
        return {
          headline: holiday.daysUntil === 0
            ? "Halloween night electricity check."
            : "Halloween prep electricity audit.",
          subheadline: holiday.daysUntil === 0
            ? "Scary bills are worse than haunted houses."
            : "Don't let your electricity rate give you nightmares."
        };

      case "Black Friday":
        return {
          headline: holiday.daysUntil === 0
            ? "Black Friday. Shopping for electricity too?"
            : "Black Friday prep mode.",
          subheadline: holiday.daysUntil === 0
            ? "Best deal today might be switching your electricity rate."
            : "Shopping deals everywhere. Don't forget your electricity rate."
        };

      case "Mother's Day":
        return {
          headline: holiday.daysUntil === 0
            ? "Happy Mother's Day. Mom energy savings."
            : "Mother's Day prep electricity check.",
          subheadline: holiday.daysUntil === 0
            ? "Even Mom would approve of saving money on electricity."
            : "Get your life together before Mom asks about your bills."
        };

      case "Father's Day":
        return {
          headline: holiday.daysUntil === 0
            ? "Father's Day. Dad-level electricity comparison."
            : "Father's Day prep adulting check.",
          subheadline: holiday.daysUntil === 0
            ? "Channel your inner dad: compare rates, save money, fix things."
            : "Time to adult like Dad taught you. Starting with electricity."
        };

      default:
        return isWeekend ? this.getWeekendMessage(ctx) : this.getWeekdayMessage(ctx);
    }
  }

  private getSpecialPeriodMessage(ctx: TemporalContext): MessagingBundle {
    const { specialPeriod, timeOfDay, isWeekend } = ctx;
    if (!specialPeriod) return this.getWeekendMessage(ctx);

    switch (specialPeriod.type) {
      case 'back-to-school':
        return {
          headline: isWeekend
            ? "Back-to-school weekend electricity homework."
            : "Back-to-school electricity assignment.",
          subheadline: "New schedules, new routines. Might as well get a new (better) electricity rate."
        };

      case 'tax-season':
        return {
          headline: timeOfDay === 'late-night'
            ? "Late night tax season electricity therapy."
            : "Tax season electricity deduction research.",
          subheadline: "Can't deduct electricity, but you can definitely pay less for it."
        };

      case 'holiday-shopping':
        return {
          headline: isWeekend
            ? "Holiday shopping break. Electricity edition."
            : "Holiday shopping list electricity research.",
          subheadline: "Shopping for everyone else. Shop for yourself too. Better electricity rate."
        };

      case 'summer-vacation':
        return {
          headline: timeOfDay === 'evening'
            ? "Summer evening AC bill reality check."
            : "Summer vacation electricity planning.",
          subheadline: "Vacation costs money. AC costs money. Save on one of them."
        };

      default:
        return isWeekend ? this.getWeekendMessage(ctx) : this.getWeekdayMessage(ctx);
    }
  }

  private getWeekendMessage(ctx: TemporalContext): MessagingBundle {
    const { dayName, timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    
    // Season-aware weekend messaging
    const seasonalContext = ctx.seasonalContext;
    const currentMonth = ctx.month;
    
    if (dayName === 'Saturday') {
      // Seasonal context for weekends
      const seasonalSuffix = seasonalContext === 'summer-peak' 
        ? "AC bills hitting hard this summer." 
        : seasonalContext === 'winter-heating' 
          ? "Heating costs adding up." 
          : "Perfect weather for saving money.";
      
      switch (timeOfDay) {
        case 'early-morning':
          return {
            headline: currentMonth >= 10 && currentMonth <= 12
              ? "Saturday morning fall electricity check."
              : currentMonth >= 3 && currentMonth <= 5
                ? "Saturday morning spring energy audit."
                : "Saturday morning electricity shopping.",
            subheadline: seasonalContext === 'summer-peak'
              ? "Early start beats the heat and the high rates."
              : "You could do literally anything else. But here we are. No teaser rates that cost 14¢."
          };
        
        case 'morning':
          return {
            headline: currentMonth >= 6 && currentMonth <= 9
              ? "Saturday morning AC bill reality check."
              : currentMonth >= 12 || currentMonth <= 2
                ? "Saturday morning winter rate review."
                : "Saturday morning. Still dealing with Texas electricity.",
            subheadline: `${DEFAULT_COUNTS.providers} companies, ${DEFAULT_COUNTS.plans} plans. ${seasonalSuffix}`
          };
        
        case 'lunch':
          return {
            headline: "Saturday lunch break productivity.",
            subheadline: seasonalContext === 'summer-peak'
              ? "Too hot to go out anyway. Might as well save money on AC costs."
              : "Weekend project that actually pays you back. Clear prices, straight answers."
          };
        
        case 'afternoon':
          return {
            headline: `${hour === 15 ? '3pm Saturday. Still untangling electricity contracts.' : 'Saturday afternoon electricity homework.'}`,
            subheadline: seasonalContext === 'winter-heating'
              ? "Cozy indoor project. We read the fine print so you don't have to."
              : "We read the fine print so you don't have to. Here's what's actually good."
          };
        
        case 'evening':
          return {
            headline: currentMonth >= 11 || currentMonth <= 1
              ? "Saturday night cozy electricity research."
              : "Saturday night electricity research.",
            subheadline: seasonalContext === 'summer-peak'
              ? "Smart to stay in with the AC. Smarter to find a better rate."
              : "Either very responsible or very bored. Clear prices, no teaser rates."
          };
        
        case 'late-night':
          return {
            headline: "Late Saturday night energy focus.",
            subheadline: seasonalContext === 'summer-peak'
              ? "Can't sleep in this heat? Might as well find cheaper AC power."
              : "Couldn't sleep? Might as well find a better rate. No teaser rates that cost 14¢."
          };
      }
    }
    
    // Sunday messaging - seasonal and contextual
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: currentMonth >= 1 && currentMonth <= 3
            ? "Sunday morning New Year energy audit."
            : currentMonth >= 9 && currentMonth <= 11
              ? "Sunday morning fall rate prep."
              : "Sunday morning. Getting your life together.",
          subheadline: seasonalContext === 'summer-peak'
            ? "Before the week heats up. Smart to lock in cooling savings."
            : "Starting with electricity rates. Smart move. No teaser rates that cost 14¢."
        };
      
      case 'morning':
        return {
          headline: currentMonth >= 6 && currentMonth <= 8
            ? "Sunday morning summer bill strategy."
            : currentMonth >= 12 || currentMonth <= 2
              ? "Sunday morning winter rate check."
              : "Sunday morning electricity audit.",
          subheadline: seasonalContext === 'summer-peak'
            ? "Coffee and AC strategy session. Let's find you better cooling rates."
            : "Coffee in one hand, rate comparison in the other. Clear prices, straight answers."
        };
      
      case 'lunch':
        return {
          headline: "Sunday lunch break adulting.",
          subheadline: seasonalContext === 'winter-heating'
            ? "Cozy indoor productivity. Find heating bill relief while it's warm inside."
            : "Weekend project that actually saves money. No 40-page contracts."
        };
      
      case 'afternoon':
        return {
          headline: currentMonth >= 4 && currentMonth <= 5
            ? "Sunday afternoon spring cleaning your rates."
            : "Sunday afternoon. Adulting hard.",
          subheadline: seasonalContext === 'summer-peak'
            ? "AC season's here. Time to get the rates sorted before peak bills hit."
            : `We tested all ${DEFAULT_COUNTS.providers} providers. Here's who doesn't waste your time.`
        };
      
      case 'evening':
        return {
          headline: "Sunday evening prep mode.",
          subheadline: seasonalContext === 'summer-peak'
            ? "Monday's hot weather coming. Lock in your cooling rate tonight."
            : currentMonth >= 8 && currentMonth <= 10
              ? "Fall's coming. Perfect timing to prep your rates for season change."
              : "Monday's coming. Fix your electricity rate while you can still think."
        };
      
      case 'late-night':
        return {
          headline: "Sunday night electricity focus.",
          subheadline: seasonalContext === 'summer-peak'
            ? "Too hot to sleep? Perfect time to find better AC rates."
            : "Tomorrow's Monday. At least your rate will be sorted. No teaser rates."
        };
    }
  }

  private getFridayMessage(ctx: TemporalContext): MessagingBundle {
    const { timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: "Friday morning electricity mission.",
          subheadline: "Early start on weekend prep. No teaser rates that cost 14¢."
        };
      
      case 'morning':
        return {
          headline: "Friday morning electricity to-do.",
          subheadline: "Get this off your list before the weekend. Clear prices, straight answers."
        };
      
      case 'lunch':
        return {
          headline: "Friday lunch break productivity.",
          subheadline: "15 minutes to find a better rate. Then weekend mode. No 40-page contracts."
        };
      
      case 'afternoon':
        return {
          headline: "Friday afternoon. Almost weekend.",
          subheadline: `One quick thing: find a better rate. ${DEFAULT_COUNTS.plans} plans reviewed.`
        };
      
      case 'evening':
        return {
          headline: "Friday night electricity research.",
          subheadline: "Either very responsible or questionable weekend plans. Clear prices either way."
        };
      
      case 'late-night':
        return {
          headline: "Late Friday night. Still grinding.",
          subheadline: "Might as well save money while you're up. No teaser rates."
        };
      
      default:
        return {
          headline: "Friday. Cross this off your list.",
          subheadline: "Weekend starts when you find the right electricity rate."
        };
    }
  }

  private getMondayMessage(ctx: TemporalContext): MessagingBundle {
    const { timeOfDay, hour, season, holiday, specialPeriod } = ctx;
    
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: "Monday morning electricity mission.",
          subheadline: `${DEFAULT_COUNTS.providers} providers, endless plans. We found the ones that matter. No teaser rates.`
        };
      
      case 'morning':
        return {
          headline: "Monday morning. Time to adult.",
          subheadline: "Starting with electricity rates. Clear prices, straight answers."
        };
      
      case 'lunch':
        return {
          headline: "Monday lunch break electricity check.",
          subheadline: "Week's half started. Might as well fix your rate. No 40-page contracts."
        };
      
      case 'afternoon':
        return {
          headline: "Monday afternoon electricity homework.",
          subheadline: `${DEFAULT_COUNTS.plans} plans out there. We read them all. Here's what's worth it.`
        };
      
      case 'evening':
        return {
          headline: "Monday evening electricity wrap-up.",
          subheadline: "End of day one. Start with a better rate for the rest of the week."
        };
      
      case 'late-night':
        return {
          headline: "Late Monday night electricity research.",
          subheadline: "Monday insomnia? Productive use of time. No teaser rates that cost 14¢."
        };
      
      default:
        return {
          headline: "Monday. Week starts right.",
          subheadline: "Begin with better electricity. Clear prices, no surprises."
        };
    }
  }

  private getWeekdayMessage(ctx: TemporalContext): MessagingBundle {
    const { dayName, timeOfDay, hour, seasonalContext, season, holiday, specialPeriod } = ctx;
    
    // Tuesday through Thursday messaging
    switch (timeOfDay) {
      case 'early-morning':
        return {
          headline: `${dayName} morning electricity deep dive.`,
          subheadline: "Early start on the adulting. We respect the hustle."
        };
      
      case 'morning':
        return {
          headline: `${dayName} morning. Checking electricity rates.`,
          subheadline: `We tested all ${DEFAULT_COUNTS.providers} providers. Here's what actually works.`
        };
      
      case 'lunch':
        return {
          headline: "Lunch break electricity optimization.",
          subheadline: "15 minutes well spent. We already did the boring research part."
        };
      
      case 'afternoon':
        return {
          headline: `${dayName} afternoon electricity audit.`,
          subheadline: seasonalContext === 'summer-peak'
            ? "AC season means higher bills. Time to find a better rate."
            : "Perfect time to review your electricity situation."
        };
      
      case 'evening':
        return {
          headline: `${dayName} evening productivity.`,
          subheadline: "Wrapping up the day with some money-saving research. Smart move."
        };
      
      case 'late-night':
        return {
          headline: "Late night electricity deep thoughts.",
          subheadline: "Can't sleep? Might as well find a better rate. We tested the reliable ones."
        };
    }
    
    // Fallback (should never reach)
    return {
      headline: "Texas electricity plan comparison.",
      subheadline: `We reviewed all ${DEFAULT_COUNTS.providers} providers. Here's what's worth your time.`
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
      },
      // Halloween
      {
        name: "Halloween",
        type: 'seasonal' as const,
        date: new Date(year, 9, 31),
        activities: ['trick-or-treating', 'costume prep', 'candy shopping', 'decorating']
      },
      // Black Friday (day after Thanksgiving)
      {
        name: "Black Friday",
        type: 'financial' as const,
        date: (() => {
          const thanksgiving = this.getFourthThursdayOfNovember(year);
          const blackFriday = new Date(thanksgiving);
          blackFriday.setDate(blackFriday.getDate() + 1);
          return blackFriday;
        })(),
        activities: ['deal hunting', 'shopping', 'budget stress', 'holiday spending']
      },
      // Mother's Day (2nd Sunday in May)
      {
        name: "Mother's Day",
        type: 'seasonal' as const,
        date: this.getSecondSundayOfMay(year),
        activities: ['family brunch', 'gift giving', 'mother appreciation', 'family time']
      },
      // Father's Day (3rd Sunday in June)
      {
        name: "Father's Day",
        type: 'seasonal' as const,
        date: this.getThirdSundayOfJune(year),
        activities: ['BBQ', 'sports watching', 'dad gifts', 'family time']
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
   * Simplified to avoid negative messaging
   */
  private getContextualActivityMessage(activities: string[], holiday?: HolidayInfo, specialPeriod?: SpecialPeriodInfo): string {
    // Keep it simple and positive
    return "";
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

  private getSecondSundayOfMay(year: number): Date {
    const date = new Date(year, 4, 1); // May 1
    let sundayCount = 0;
    while (sundayCount < 2) {
      if (date.getDay() === 0) { // Sunday
        sundayCount++;
      }
      if (sundayCount < 2) {
        date.setDate(date.getDate() + 1);
      }
    }
    return date;
  }

  private getThirdSundayOfJune(year: number): Date {
    const date = new Date(year, 5, 1); // June 1
    let sundayCount = 0;
    while (sundayCount < 3) {
      if (date.getDay() === 0) { // Sunday
        sundayCount++;
      }
      if (sundayCount < 3) {
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
      "Heads up: "
    ];
    
    // Only add prefix 30% of the time for A/B testing
    if (Math.random() < 0.3) {
      const prefix = conversationalPrefixes[Math.floor(Math.random() * conversationalPrefixes.length)];
      return prefix + headline;
    }
    
    return headline;
  }

  private enhanceUrgency(flag?: string): string {
    if (!flag) return "";
    return flag;
  }
}

// Export singleton instance
export const messagingEngine = TemporalMessagingEngine.getInstance();