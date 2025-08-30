## Implementation Guide (Shleyner + StoryBrand Applied)

### Homepage Copy Structure

```html
<div class="hero-section">
  <!-- Inclusive headline for movers AND existing customers -->
  <h1>Find Your Best Electricity Rate in 10 Minutes</h1>
  <p class="subhead">
    Moving or switching? Use your power to choose the right plan 
    for your home. Clear comparisons. Real prices. No confusion.
  </p>
  
  <!-- Trust + Empowerment -->
  <div class="trust-builder">
    <p>Texas gives you choice. We make it simple.</p>
  </div>
  
  <!-- Clear Path Selection -->
  <div class="path-selector">
    <h2>What brings you here today?</h2>
    <button>I'm moving</button>
    <button>My bill's too high</button>
    <button>Contract ending soon</button>
    <button>Need $0 deposit</button>
  </div>
  
  <!-- Moving-specific warning -->
  <div class="mover-alert">
    <p><strong>Moving?</strong> Don't transfer your old plan. 
    Your new home needs a new rate matched to its size and usage.</p>
  </div>
</div>
```

### Conversational UI Components

```javascript
// Progress indicators that feel human
const progressMessages = {
  step1: {
    moving: "First, where are you moving to?",
    highBill: "Let's see what you're currently paying...",
    renewal: "When does your contract end?",
    deposit: "Let's find plans that work for your situation..."
  },
  step2: {
    moving: "Got it. Now, apartment or house?",
    highBill: "Yep, that's too high. Here's why...",
    renewal: "Perfect timing. Here are your options...",
    deposit: "Found some good options. Take a look..."
  },
  step3: {
    moving: "Here's your account number. Give this to your apartment.",
    highBill: "You'll save about $[X]/month with any of these...",
    renewal: "Lock this in before your auto-renewal hits.",
    deposit: "Pick one. No deposit required."
  }
};

// Error messages that don't blame the user
const humanErrorMessages = {
  invalidZip: "Hmm, that ZIP doesn't look right. Try again?",
  noService: "That area isn't deregulated yet. Sorry about that.",
  timeout: "Taking longer than usual. Hang tight...",
  generalError: "Something went wrong on our end. Give it another shot?"
};

// Success messages that celebrate with them
const celebrationMessages = {
  moving: "Done! Your power will be on when you arrive.",
  highBill: "Nice choice. You just cut your bill by $[X]/month.",
  renewal: "Locked in! No more auto-renewal surprises.",
  deposit: "Approved! $0 deposit, just like we promised."
};
```

### Trust Building Through Story

```javascript
// About Us section
const ourStory = () => (
  <section className="about-us">
    <h2>Why We Built This</h2>
    <p>
      Back in 2009, we discovered firsthand how confusing 
      electricity shopping in Texas could be. We had the power 
      to choose, but using it effectively? That was hard.
    </p>
    <p>
      The bill came. Our "8.9¢" plan cost 16¢. We felt foolish.
      Then we realized – we weren't stupid. The system was just 
      really complicated.
    </p>
    <p>
      So we built tools to help Texans like us use their power 
      of choice effectively. Clear comparisons. Real prices. 
      No confusion.
    </p>
    <p>
      Today, thousands of Texans use our tools every month. 
      Not because we advertise. Because it works, and they 
      tell their friends.
    </p>
  </section>
);
```

### Micro# ChooseMyPower.org Implementation Specification
## Choose Confidently. Tell Your Friends.

### Table of Contents
1. [Critical Directives for Claude Code](#critical-directives-for-claude-code)
2. [Brand Story Framework](#brand-story-framework)
3. [Voice & Tone Guidelines](#voice--tone-guidelines)
4. [Hero Journey by Persona](#hero-journey-by-persona)
5. [Conversational Messaging](#conversational-messaging)
6. [The 3-Step Victory Plan](#the-3-step-victory-plan)
7. [Implementation Guide](#implementation-guide)
8. [Content Templates](#content-templates)
9. [Technical Specifications](#technical-specifications)

---

## Critical Directives for Claude Code

### MANDATORY CHECKLIST FOR IMPLEMENTATION

**Claude Code MUST:**
1. ✅ Review sitemap.md and create a complete page inventory
2. ✅ Update copy on EVERY page, including:
   - Main headlines and subheadlines
   - Button text and CTAs
   - Form labels and placeholders
   - Error messages
   - Success messages
   - Loading states
   - Footer text
   - Meta descriptions
3. ✅ Verify NO page contains:
   - Claims about "all providers" or "every plan"
   - The word "perfect" anywhere
   - Fake metrics or made-up timeframes
   - Texanisms like "y'all" or "howdy"
   - Rates below 8.9¢
   - Wild promises or guarantees

### TRUTH IN ADVERTISING
**We work with about 12-15 quality providers** who offer 100+ plans total. That's plenty of choice for any Texan. We never claim to have every provider because we don't. We have the good ones.

**Language Requirements:**
- ✅ "Compare plans from trusted providers"
- ✅ "See 100+ electricity plans"
- ✅ "Plans from quality providers"
- ❌ "All providers in Texas"
- ❌ "Every available plan"
- ❌ "Complete marketplace"

### BANNED WORDS & PHRASES
- ❌ "Perfect" (use "best" instead)
- ❌ "Y'all" or any forced Texanisms
- ❌ "Howdy" or folksy language
- ❌ "6.3 minutes" or fake precision
- ❌ "Guaranteed savings"
- ❌ "All providers"

### REQUIRED TONE
- ✅ Helpful neighbor (not cowboy)
- ✅ Honest and straightforward
- ✅ Confident without overpromising
- ✅ Clear without being condescending

---

## Brand Story Framework

### The Setup
Every Texan has the power to choose their electricity provider. It's your right. But with that power comes confusion - providers who bury fees deeper than oil wells, plans designed to trick, and for those moving? Time itself becomes the enemy.

### The Hero (That's You, The User)
You're not just a customer. You're the hero of this story. You're the Texan exercising your power of choice, ready to take control, and smart enough to know there's a better way. Whether you're moving, shocked by your bill, or just done with overpaying - you're the one who decides to use your power to choose.

### The Guide (That's Us)
We're not the hero - you are. We're just your neighbors who believe in your right to choose and built tools to make it easier. Think of us as the friend who already figured out the electricity game and wants to help you win it too. We've been overcharged. We've decoded the confusing plans. We've spent the time learning the system.

Now we're here to help you use your power of choice effectively.

### The Plan (Your Path to Victory)
Simple. Clear. No BS. Three steps that actually work:
1. Tell us your situation (moving? high bill? contract ending?)
2. We'll show you the real costs (not the marketing tricks)
3. You pick, you switch, you save

### The Transformation
In 10 minutes, you go from feeling overwhelmed by choices to confidently using your power to choose. No more confusion. No more wondering if you picked wrong. Just confidence that you exercised your right as a Texas consumer and got a fair deal.

### The Result
You're so relieved, so happy with how easy it was to use your power of choice, you tell your friends. Not because we asked you to. Because when something actually helps you navigate your consumer rights in Texas, that's worth sharing.

---

## Voice & Tone Guidelines (Shleyner + StoryBrand Blend)

### Core Voice Principles

**Write Like You're Helping a Friend (Shleyner's Approach)**
```
❌ "ComparePower facilitates electricity plan comparison"
✅ "You'll find your cheapest rate in about 10 minutes"

❌ "Our platform enables efficient selection"  
✅ "Pick a plan without the headache"

❌ "Submit your ZIP code to proceed"
✅ "What's your ZIP? I'll show you what's available"
```

**You're the Hero, We're the Guide (StoryBrand Clarity)**
```
❌ "We help Texans save money"
✅ "You deserve a fair electricity rate"

❌ "Our innovative comparison tool"
✅ "Your shortcut through the confusion"

❌ "We've saved customers millions"
✅ "You'll save money like thousands before you"
```

**Channel Existing Frustration (Shleyner's "Noticing")**
```
❌ "Compare electricity plans easily"
✅ "Tired of feeling ripped off by your electricity company?"

❌ "Find competitive rates"
✅ "See what you should actually be paying"

❌ "Switch providers hassle-free"
✅ "Switch without the usual runaround"
```

### The Three-Question Edit (Every piece of copy must pass)

1. **Can I say this in fewer words?**
   - "Start your comparison process" → "Compare now"
   - "Utilize our search function" → "Search"

2. **Is this part necessary?**
   - Cut corporate speak, keep human truth
   - Remove features, emphasize transformation

3. **Does this connect emotionally?**
   - Not just "save money" but "stop feeling cheated"
   - Not just "compare plans" but "take control"

### Conversation Starters by Context

**Homepage Hero (PAS Formula)**
```
Problem: "You have the power to choose your electricity in Texas."
Agitate: "But with 100+ plans and confusing terms, how do you use that power effectively?"
Solution: "We built tools to help you exercise your right to choose. Let's find your best rate."
```

**For Movers (Urgency + Empathy)**
```
"Moving is stressful enough without electricity confusion.

You have the power to choose your provider in Texas.
Let me help you use it effectively - power on before you arrive."
```

**For Bill Shock (Validation + Authority)**  
```
"That high bill? You have the power to choose something better.
Let's see what other options are available in your area.

I'll show you exactly what you could be paying instead."
```

**For Renewals (Calm + Control)**
```
"Contract ending? That's your chance to use your power of choice.
No need to accept whatever renewal they're offering.

Let's see what the market has for you today."
```

### Micro-Lessons Approach (Complex Made Simple)

**What's a kWh?**
```
"Think of it like gas for your car.
You pay per gallon of gas. You pay per kWh of electricity.
Average Texas home uses about 1,000 per month.

Now let's find your price per 'gallon.'"
```

**Why do rates vary?**
```
"Same electricity, different middlemen.
Like buying the same coffee at different shops - 
the coffee's identical, but one shop charges more.

Let's find the shop that doesn't overcharge."
```

**Fixed vs Variable?**
```
"Fixed = your rate stays the same all year
Variable = your rate changes with the market

Fixed is like locking in gas prices.
Variable is like paying whatever's on the pump."
```

### Emotional Vulnerability Points

**Acknowledge the Challenge**
```
"The power to choose is great - but comparing 100+ plans?
That's where it gets overwhelming.

We're here to help you use your right effectively.
Clear comparisons. Real prices. Your best choice."
```

**Admit What Everyone's Thinking**
```
"Choosing electricity should be simple.
You have the right to choose in Texas, but exercising 
that right shouldn't require a degree in energy economics.

We built tools to translate it all into plain English."
```

**Share the Mission**
```
"We believe in your power to choose.
That's why we built tools to help you use it.

Every Texan deserves to understand what they're buying
and feel confident in their choice."
```

### Language Patterns That Convert

**Second Person Focus (You, Not We)**
```
Before: "We offer comprehensive plan comparison"
After: "You'll see every plan's real cost"

Before: "Our tool calculates savings"
After: "You'll know your exact savings"

Before: "We simplify the process"
After: "You'll be done in 10 minutes"
```

**Present Tense Immediacy**
```
"Your savings start the moment you switch"
"You see real prices, not teaser rates"
"You get your account number in minutes"
```

**Specific Over Generic**
```
Generic: "Save money on electricity"
Specific: "Cut your bill by $47/month"

Generic: "Fast comparison process"
Specific: "Three clicks to your answer"

Generic: "Many plan options"
Specific: "12 providers, 100+ plans, 3 best matches for you"
``` enables efficient plan selection"
✅ "Pick a plan without the headache"

❌ "Users report high satisfaction rates"
✅ "Folks tell their friends about us"
```

**We Keep It Real**
```
❌ "Experience seamless plan migration"
✅ "Switch without your power going off"

❌ "Leverage market insights"
✅ "Know what's actually a good deal"

❌ "Eliminate billing discrepancies"
✅ "Pay what they promised, nothing more"
```

### Conversation Starters by Context

**Homepage Hero**
```
"Tired of that clunky state website? 
We get it. That's why we built this.

Let me show you how to find a fair electricity rate 
without the runaround. Takes about 10 minutes."
```

**For Movers**
```
"Moving day's crazy enough without electricity stress.

Tell me your new ZIP code and I'll have you 
set up before the moving truck arrives."
```

**For Bill Shock Victims**
```
"That bill make your heart skip? 
Been there. It's not you – it's them.

Let me show you what you should actually 
be paying for electricity."
```

**For Contract Renewals**
```
"Got that renewal notice? Good timing.

They're counting on you being too busy to shop around.
Let's find you something better real quick."
```

---

## Persona-Specific Hero Journeys

### The Path Selector (Homepage)
Using Eddie Shleyner's emotional connection + StoryBrand's clarity:

```html
<div class="hero-path-selector">
  <h1>What brings you here today?</h1>
  <div class="path-options">
    <button class="path-moving">I'm moving</button>
    <button class="path-bill">My bill is too high</button>
    <button class="path-renewal">My contract is ending</button>
    <button class="path-deposit">I need $0 deposit</button>
  </div>
</div>
```

### 🏠 Moving Hero's Journey

#### Path Split
```javascript
// After "I'm moving" selection
const movingPathOptions = {
  apartment: {
    button: "I'm moving to an apartment",
    urgency: "Need power TODAY for keys",
    icon: "🏢"
  },
  house: {
    button: "I'm moving to a house",
    urgency: "Get power before move-in day",
    icon: "🏡"
  },
  transfer: {
    button: "I want to transfer my service",
    urgency: "Stop! Let me explain why that's costly",
    icon: "⚠️"
  },
  lastMinute: {
    button: "I move in TODAY/TOMORROW",
    urgency: "Emergency same-day service",
    icon: "⚡"
  }
};
```

#### Transfer Warning Language
```
Hero: "I want to transfer my service"

Guide: "Hold on - transferring is usually a mistake.
        Here's why:
        
        Your current plan's price is based on your OLD home's usage.
        'Fixed rate' is misleading - it's actually a formula that
        changes based on how much electricity you use.
        
        A plan that works for a 2-bedroom apartment will cost
        way more in a 4-bedroom house (or vice versa).
        
        Let's find a plan that matches your NEW home instead.
        Takes the same 10 minutes as transferring, saves you money."

[Continue to normal flow]
```

#### Moving-Specific Education
```javascript
// Progressive education for movers
const moverEducation = {
  whyNotTransfer: [
    "Fixed rate' isn't really fixed - it's a pricing formula",
    "Your rate changes based on usage (500 kWh vs 2000 kWh = different prices)",
    "New home = new usage pattern = need new plan"
  ],
  whatToExpect: [
    "New service takes same time as transfer",
    "No service gap if you plan ahead",
    "Better rate matched to your new home"
  ]
};
```

#### Apartment-Specific Language Path
```
Hero: "I'm moving to an apartment"

Guide: "Got it. In Texas, no electricity account = no keys. 
        Let's get you set up with the RIGHT plan.
        
        (Not just transferring your old one - apartments use
        different amounts of power than houses. You need a 
        plan that matches.)"

[ZIP CODE ENTRY]

"Found 23 plans that work well for apartments in [ZIP].
 Let me show you the 3 that make most sense for typical
 apartment usage..."

[After selection]

"Here's what happens next:
1. You'll get a confirmation email with your account number (5 minutes)
2. Give that number to your apartment office
3. Pick up your keys - you're all set!

Your power will be on before you arrive."
```

#### Last-Minute Mover Language
```
Hero: "I move in TODAY/TOMORROW"

Guide: "No judgment - life happens fast. 
        Let's get your power on NOW.
        
        These providers offer same-day service:"

[Shows ONLY same-day options]

"Pick one and you'll have power in 2-4 hours.
 Account number in your email in 5 minutes.
 Crisis averted."
```

### 💸 High Bill Hero's Journey

#### Initial Empathy + Authority (Shleyner style)
```
Hero: "My bill is too high"

Guide: "That sinking feeling when you open the bill? 
        We know it well.
        
        Here's the thing - you're probably not using 
        more electricity. You're just paying more for it.
        
        Let me show you what you SHOULD be paying..."

[Current Bill Entry]

"Thought so. Based on your usage, you're overpaying 
 by about $[AMOUNT] per month.
 
 Here's how we fix this..."
```

#### The Validation + Solution Flow
```javascript
// After bill analysis
const billShockResponse = {
  significant: { // Over $50/month overpayment
    message: "No wonder you're upset. That's $[ANNUAL] a year 
              going straight to their profits.",
    emotion: "righteous anger",
    cta: "Let's fix this injustice"
  },
  moderate: { // $20-50/month overpayment
    message: "Every dollar counts. That's a streaming service 
              or two you're giving away monthly.",
    emotion: "practical frustration",
    cta: "Claim back what's yours"
  },
  slight: { // Under $20/month
    message: "Even small leaks sink ships. Let's plug this one.",
    emotion: "mild annoyance",
    cta: "Switch to something fair"
  }
};
```

### 🔄 Contract Renewal Hero's Journey

#### The Procrastination Acknowledgment
```
Hero: "My contract is ending"

Guide: "Renewal notices are designed to create panic. 
        Don't fall for it.
        
        You've actually got the upper hand here - 
        providers want to keep you, and new ones 
        want to win you over.
        
        When does your contract end?"

[DATE SELECTOR]

"Perfect. You've got [X days] to find something better.
 That's plenty of time. Let's see who wants your 
 business most..."
```

#### Urgency Without Pressure
```javascript
// Dynamic messaging based on days until expiration
const renewalUrgency = {
  plenty: { // 30+ days
    message: "Plenty of time to be picky. Let's find your best deal.",
    approach: "relaxed comparison"
  },
  moderate: { // 14-29 days
    message: "Good timing. Enough time to compare without rushing.",
    approach: "steady progress"
  },
  urgent: { // 7-13 days
    message: "Time to move. Let's lock in savings before auto-renewal.",
    approach: "focused action"
  },
  critical: { // <7 days
    message: "Let's move fast. Auto-renewal hits in [X] days.",
    approach: "immediate action",
    highlight: "same-day switch available"
  }
};
```

### 💳 No-Deposit Hero's Journey

#### Dignity-Preserving Introduction
```
Hero: "I need $0 deposit"

Guide: "Smart thinking. Why tie up money in deposits 
        when you need it elsewhere?
        
        Here's how deposits work in Texas:
        - Fixed-rate plans: Usually need a credit check
        - Variable plans: Often no credit check
        - Prepaid plans: Never need a deposit
        
        Let's find what works for your situation..."
```

#### Credit-Sensitive Path Options
```javascript
// After initial selection
const depositPathways = {
  checkMyOptions: {
    button: "Check what I qualify for",
    message: "We'll check multiple providers discreetly",
    process: "Soft credit check - won't affect your score"
  },
  prepaidOnly: {
    button: "Show me prepaid plans",
    message: "No credit check, no deposit, no judgment",
    process: "Pay as you go - add money anytime"
  },
  variableRates: {
    button: "Show me no-credit-check plans",
    message: "Rates can change, but no deposit needed",
    process: "Month-to-month flexibility"
  }
};
```

### Language Patterns (Applying Shleyner's Conversational Principles)

#### Vulnerability + Authority Balance
```markdown
Moving: "We remember our first Texas move. The apartment 
         wouldn't give us keys without an account number. 
         Learned that lesson at 5 PM on a Friday."

High Bill: "That 'free nights' plan that wasn't really free? 
            We fell for it too. Now we read the fine print 
            so you don't have to."

Renewal: "Auto-renewal got us once. 40% rate increase overnight.
          Never again."

No Deposit: "Everyone deserves electricity without emptying 
             their savings. We'll find you options."
```

#### Micro-Lessons for Each Path
```javascript
// Progressive education based on persona needs
const microLessons = {
  moving: [
    "Texas quirk: Apartments need your electricity account number",
    "Most providers email it within an hour",
    "Same-day service usually means before 6 PM"
  ],
  highBill: [
    "Your rate has 3 parts: energy + delivery + fees",
    "Delivery is the same regardless of provider",
    "So we focus on finding you the lowest energy rate"
  ],
  renewal: [
    "Providers count on you being too busy to switch",
    "New customer rates are almost always better",
    "Switching takes 10 minutes, saves hundreds"
  ],
  noDeposit: [
    "Deposits range from $0 to $400",
    "Same electricity, different payment timing",
    "Prepaid often costs 1-2¢ more per kWh"
  ]
};
```

### Transformation Messaging by Persona

```markdown
Moving → Moved In
"From apartment hunting stress to keys in hand. Your power's 
on, your account number's ready, and you can focus on unpacking."

High Bill → Fair Bill
"From that monthly gut punch to actually smiling at your bill. 
Same usage, fair price, no more wondering if you're being scammed."

Renewal → Renewed Confidence  
"From renewal panic to 'I got this.' Locked in a better rate 
without the hassle. That was easier than expected."

No Deposit → Empowered Choice
"From worried about qualifying to having options. Found a plan 
that works for your situation. No judgment, just results."
```

### The Friend-Telling Moment

Each persona gets specific "share-worthy" moments:

```javascript
const shareableMoments = {
  moving: "When you hand your apartment office the account number 
           10 minutes after applying",
  highBill: "When your first new bill arrives and it's actually 
             what they promised",
  renewal: "When you realize you saved $300/year in 10 minutes 
            of clicking",
  noDeposit: "When you get power without draining your savings"
};
```

---

## Conversational Messaging

### Addressing Common Doubts

**"Is this really free?"**
```
"Yep, free for you. The electricity companies pay us 
when you sign up. You pay the same price either way, 
so why not use tools that make choosing easier?"
```

**"Why use ChooseMyPower?"**
```
"You have the power to choose in Texas - that's great.
But comparing 100+ plans takes time you don't have.

We built tools to help you use your power of choice 
effectively. Clear comparisons, real prices, no confusion."
```

**"What's the catch?"**
```
"No catch. We help Texans exercise their right to choose
by making comparisons clear and simple. That's it."
```

### Feature Explanations in Plain Talk

**The Power of Choice**
```
"In Texas, you get to choose who provides your electricity.
That's your power of choice - and it can save you money.

We help you use that power effectively by showing
real prices and making comparisons simple."
```

**Usage Slider**
```
"Not sure about your usage? Check last month's bill.
Or just use 1000 kWh – that's pretty typical for 
a 2-bedroom place in Texas summer."
```

**Plan Comparison**
```
"See how we put the monthly cost right up front?
That's your power of choice at work - clear information
to make the best decision for your home."
```

**No-Deposit Finder**
```
"Got hit with a deposit request? Happens to lots of folks.
Hang tight – I'm checking if other companies will 
take you without one. Usually find a few options."
```

---

## The 3-Step Victory Plan

### Step 1: ZIP Code Entry

**The Experience**:
```
Hero: "I need electricity but don't know where to start"

Guide: "No worries, I got you. What's your ZIP code?
        Just need to know which area you're in so I can 
        show you what's actually available."

[ZIP CODE ENTRY BOX]

"Found 100+ plans from quality providers in your area. 
 Let's narrow this down to the good ones..."
```

### Step 2: Usage Reality Check

**The Experience**:
```
Guide: "Great! Now, about how much electricity 
        do you use each month? If you're not sure, 
        1000 kWh is pretty normal.
        
        [SLIDER: 500 ----●---- 3000 kWh]
        
        I'll update the prices as you slide that around.
        This way you see what YOU'LL pay, not what they 
        advertise for some ideal usage nobody has."
```

### Step 3: Clear Choice

**The Experience**:
```
Guide: "Alright, here's the real deal. I sorted these 
        by what you'll actually pay each month, not by 
        their marketing tricks.
        
        [PLAN 1] Reliant - $124/month total
        ✓ Fixed price for 12 months
        ✓ No surprises
        
        [PLAN 2] TXU - $132/month total
        ⚠️ Watch out: $9.95 monthly fee hidden in there
        
        See something you like? Click it and you're 
        a few minutes from being done with this."
```

---

## Implementation Guide

### Homepage Copy Structure

```html
<div class="hero-section">
  <h1>Texas Electricity Without the Tricks</h1>
  <p class="subhead">
    We're Texans who got tired of the games. 
    Now we help neighbors like you find fair rates in 10 minutes.
  </p>
  
  <div class="trust-builder">
    <p>No sign-up needed. No spam. Just answers.</p>
  </div>
  
  <div class="zip-entry">
    <label>Let's start with your ZIP code:</label>
    <input type="text" placeholder="75201" />
    <button>Show me honest prices →</button>
  </div>
  
  <div class="social-proof">
    <p>Your neighbors are saving money too:</p>
    <div class="ticker">
      <span>Houston: Found a better rate (just now)</span>
      <span>Austin: Switched providers (2 min ago)</span>
    </div>
  </div>
</div>
```

### Conversational UI Components

```javascript
// Conversational progress indicator
const ProgressGuide = () => {
  const messages = {
    step1: "First, let me know where you're located...",
    step2: "Great! Now, about how much power do you use?",
    step3: "Perfect. Here are your real options..."
  };
  
  return (
    <div className="guide-voice">
      <p>{messages[currentStep]}</p>
    </div>
  );
};

// Helpful interruptions
const HelpfulHints = {
  onHighUsage: () => (
    <div className="hint">
      "That's higher than average – might be that pool pump. 
       Let me find you plans that work better for big users..."
    </div>
  ),
  
  onLowDeposit: () => (
    <div className="hint">
      "Good news – found 3 plans with no deposit. 
       Sometimes being persistent pays off..."
    </div>
  ),
  
  onPrepaid: () => (
    <div className="hint">
      "These prepaid plans never need deposits. 
       You just pay as you go. Pretty handy..."
    </div>
  )
};
```

### Voice-First Interactions

```javascript
// Natural language filters
const FilterUI = () => (
  <div className="conversational-filters">
    <h3>Want me to narrow these down?</h3>
    
    <button onClick={() => filter('green')}>
      "Show me the green energy ones"
    </button>
    
    <button onClick={() => filter('short')}>
      "I don't like long contracts"
    </button>
    
    <button onClick={() => filter('stable')}>
      "I want predictable bills"
    </button>
    
    <button onClick={() => filter('cheap')}>
      "Just show me the cheapest"
    </button>
  </div>
);

// Conversational error messages
const ErrorMessages = {
  badZip: "Hmm, that ZIP doesn't look right. Try again?",
  noService: "Looks like your area isn't deregulated yet. Sorry about that.",
  timeout: "Taking longer than usual. Hang tight...",
  noResults: "Weird, no plans found. Let me try another way..."
};
```

### Trust Building Through Story

```javascript
// About Us section
const OurStory = () => (
  <section className="about-us">
    <h2>Why We Built This</h2>
    <p>
      Back in 2009, we were just like you – confused by electricity 
      shopping in Texas. That state website? We spent hours on it 
      and still picked wrong.
    </p>
    <p>
      The bill came. Our "8.9¢" plan cost 16¢. We felt stupid.
      Then we realized – it wasn't us. The system was rigged.
    </p>
    <p>
      So we built what should have existed from the start. A simple tool 
      that shows what you'll actually pay. No tricks. No games.
      Just math.
    </p>
    <p>
      Today, thousands of Texans use our tool every month. 
      Not because we advertise. Because it works, and they 
      tell their friends.
    </p>
  </section>
);
```

---

## Content Templates

### Email Templates in Conversational Voice

**Welcome Email**
```
Subject: You found us! Here's what happens next...

Hi [Name],

So you're shopping for electricity in Texas. 
Smart move checking rates before that contract expires.

Most folks find their plan in about 10 minutes here.
Some take 5. Some take 15. Whatever works for you.

Here's your game plan:

1. Enter your ZIP when you're ready
2. Tell us roughly what you use each month
3. Pick from plans sorted by actual cost

No junk. No spam. Just help when you need it.

Questions? Just reply. Real humans answer.

- The ChooseMyPower Team
(Fellow Texans who've been there)

P.S. That state website is still terrible. 
     We checked last week. You made the right call.
```

**Abandoned Cart Email**
```
Subject: Power shopping interrupted?

Hey there,

Saw you were checking out plans earlier. 
Moving day sneak up on you? Happens to everyone.

Your search is still saved:
[LINK: Pick up where you left off]

If you got confused by something, just reply and ask.
We're actual humans and we'll help you figure it out.

No pressure. But if you need power by tomorrow,
might want to knock this out today.

- The ChooseMyPower Team
```

### Social Media Voice

**Twitter/X**
```
"That face when your 'fixed rate' plan has 
17 different charges that can change 😑

(This is why we show total monthly cost. 
Not just the headline rate.)"
```

**Facebook**
```
"Real talk, Texas:

Your electricity rate isn't really 8.9¢.
That's just what they advertise.

Your ACTUAL rate includes:
- Energy charge
- TDSP delivery fees  
- Monthly service fees
- Taxes and surcharges

We add it all up and show you the real number.
Because surprises are for birthdays, not bills."
```

### FAQ Section in Natural Voice

```markdown
## Common Questions (Real Answers)

**"Wait, this is actually free?"**
Yeah, totally free for you. The power companies pay us when 
you sign up through our site. You pay the same price either 
way, but this way you get help finding the best deal.

**"How do I know you're legit?"**
Fair question. We've been doing this since 2009. We're 
licensed by the state (PUC #10014). And honestly? Just 
try us out. No sign-up required to browse.

**"Why not just use the official state site?"**
Have you tried it? It's like they're stuck in 1999. 
No mobile version. Can't sort properly. Doesn't show 
real prices. We built what they should have.

**"I have bad credit. Can you still help?"**
Absolutely. We'll show you which plans don't need deposits. 
Prepaid always works. Some variable rates too. Everyone 
deserves fair electricity prices.

**"Do you have every provider?"**
No, we work with about 12-15 quality providers who offer 
100+ plans total. That's plenty of choice. We focus on 
the ones that treat customers fairly.
```

### Plan Description Translations

```javascript
// Translate marketing speak to plain English
const PlanTranslator = {
  "Free Nights & Weekends": {
    plain: "Free 9pm-6am and weekends, but you pay double during work hours",
    goodFor: "Night owls and weekend warriors",
    badFor: "Work-from-home folks"
  },
  
  "Indexed Rate": {
    plain: "Your rate changes with natural gas prices",
    goodFor: "Gamblers who think prices will drop",
    badFor: "People who like predictable bills"
  },
  
  "Time-of-Use": {
    plain: "Different prices at different times of day",
    goodFor: "People who can shift usage to cheap hours",
    badFor: "Folks with normal 9-5 schedules"
  },
  
  "100% Renewable": {
    plain: "Your money goes to wind and solar farms",
    goodFor: "People who want to support clean energy",
    badFor: "Nobody really, just costs a bit more"
  }
};
```

---

## Technical Specifications

### Conversation State Management

```javascript
// Track where user is in their journey
const ConversationState = {
  stage: 'awareness', // awareness -> consideration -> decision
  persona: null, // detected from behavior
  blockers: [], // detected friction points
  helpers: [], // which features they've used
  
  updateStage(action) {
    // Natural progression tracking
    if (action === 'entered_zip') this.stage = 'consideration';
    if (action === 'viewed_plans') this.stage = 'decision';
  },
  
  detectPersona(data) {
    if (data.urgency === 'high') return 'mover';
    if (data.priceShock) return 'highBill';
    if (data.contractExpiring) return 'renewal';
    if (data.seekingNoDeposit) return 'creditChallenged';
  }
};
```

### Dynamic Voice Adjustment

```javascript
// Adjust tone based on user situation
const VoiceAdapter = {
  urgent: {
    greeting: "Need power today? Let's make this quick.",
    cta: "Get power on now →",
    reassurance: "We do this all day. You'll be fine."
  },
  
  suspicious: {
    greeting: "Tired of getting tricked? We get it.",
    cta: "See the real prices →",
    reassurance: "No games here. Just math."
  },
  
  overwhelmed: {
    greeting: "This shouldn't be complicated. Let us help.",
    cta: "Start with your ZIP →",
    reassurance: "10 minutes and you're done. Promise."
  },
  
  priceShocked: {
    greeting: "That bill hurt, didn't it? Let's fix it.",
    cta: "Find better rates →",
    reassurance: "You're probably overpaying by $50+/month."
  }
};
```

### Micro-Copy Library

```javascript
const MicroCopy = {
  loading: [
    "Checking all 147 plans...",
    "Running the numbers...",
    "Almost there..."
  ],
  
  success: [
    "Found it! Here's what you'll actually pay:",
    "Nice. Found some good options:",
    "Got 'em. Real prices below:"
  ],
  
  encouragement: [
    "You're almost done...",
    "Just one more step...",
    "Nearly there..."
  ],
  
  celebration: [
    "Done! That was easy, right?",
    "Boom. You just saved $.",
    "Nice work. Tell your neighbors!"
  ]
};
```

---

## The Final Word

Remember: We're not building another corporate comparison site. We're building what we wished existed when we were confused about our own bills.

Every word should sound like advice from a helpful neighbor, not marketing from a company. Because that's what we are – Texans helping Texans navigate a system that's designed to confuse.

When in doubt, ask yourself: "Would I say this to my neighbor over the fence?"

If not, rewrite it until you would.

---

## CRITICAL IMPLEMENTATION CHECKLIST FOR CLAUDE CODE

### YOU MUST COMPLETE EVERY ITEM:

1. **Review sitemap.md completely**
   - [ ] Create full page inventory
   - [ ] Note every page that needs copy updates
   - [ ] Include all subpages and modal content

2. **Update ALL copy to follow these rules:**
   - [ ] NO claims about "all providers" - we have 12-15
   - [ ] NO word "perfect" anywhere - use "best"
   - [ ] NO fake metrics or precise times
   - [ ] NO Texanisms ("y'all", "howdy", etc.)
   - [ ] NO rates below 8.9¢
   - [ ] NO wild promises or guarantees

3. **Required tone on every page:**
   - [ ] Helpful neighbor, not corporation
   - [ ] Honest about what we offer
   - [ ] Clear without condescension
   - [ ] Confident without overpromising

4. **Check EVERY instance of:**
   - [ ] Headlines and subheadlines
   - [ ] Button text and CTAs
   - [ ] Form labels and placeholders
   - [ ] Error messages
   - [ ] Success messages
   - [ ] Loading states
   - [ ] Footer text
   - [ ] Meta descriptions
   - [ ] Alt text
   - [ ] Tooltips

5. **Verify messaging accuracy:**
   - [ ] "100+ plans from quality providers" ✓
   - [ ] "12-15 trusted electricity companies" ✓
   - [ ] "Compare plans from quality providers" ✓
   - [ ] Never "all providers" or "every plan" ✗

### FINAL CHECK:
Read every page out loud. If it doesn't sound like helpful advice from a neighbor who's been through this before, rewrite it.

**Goal:** Choose confidently. Tell your friends. Because it's that easy when someone shows you how.

---

## Executive Summary

With only 2 working endpoints (plan search and ESIID lookup), ChooseMyPower.org will focus on being the **fastest, clearest plan comparison tool** in Texas. We'll apply all 7 marketing principles within these constraints to achieve:

- **Superior UX** over Power to Choose
- **Clear, jargon-free comparisons**
- **10-minute enrollment process**
- **Trust through transparency**

---

## Available Technical Resources

### Current API Endpoints

#### 1. Pricing API - Plan Search
```
GET https://pricing.api.comparepower.com/api/plans/current
```

**Parameters:**
- `group`: default
- `tdsp_duns`: Utility DUNS number (e.g., 103994067400 for Oncor)
- `display_usage`: Usage in kWh (e.g., 1000)
- `term`: Contract length in months
- `percent_green`: Renewable percentage
- `is_pre_pay`: Boolean for prepaid plans
- `is_time_of_use`: Boolean for TOU plans
- `requires_auto_pay`: Boolean for autopay requirement

#### 2. ERCOT API - Address/ESIID Lookup
```
GET https://ercot.api.comparepower.com/api/esiids
```
**Parameters:**
- `address`: Street address
- `zip_code`: ZIP code

```
GET https://ercot.api.comparepower.com/api/esiids/{esiid}
```
**Returns:** Detailed ESIID information

### What We CAN Build
- ✅ Fast, clear plan comparisons
- ✅ Real pricing at specific usage levels
- ✅ Address validation and ESIID lookup
- ✅ Filter by contract terms, green energy, etc.
- ✅ Calculate estimated monthly costs
- ✅ Show all available plans transparently
- ✅ **No-Deposit Plan Finder** - Check multiple providers for lowest/no deposit

### What We CANNOT Build (Yet)
- ❌ Bill upload and analysis
- ❌ Smart meter data integration
- ❌ Historical usage tracking
- ❌ Automated fee detection (beyond deposits)
- ❌ Provider behavior scoring

### NEW: No-Deposit Electricity Feature

**How It Works:**
1. User selects any plan they like
2. During checkout, if that provider requires a deposit
3. Our system automatically checks other providers
4. Shows all options ranked by deposit amount ($0 first)
5. User can switch to a no-deposit option with one click

**Key Facts:**
- Credit checks required for all fixed-rate plans
- Month-to-month variable plans = No credit check
- Deposit amount depends on credit score
- Prepaid plans = Always $0 deposit

---

## Principle 1: Transformation-Based Messaging

### The Realistic Transformation
**We don't need fancy tools to deliver transformation. We sell clarity in a confusing market.**

### Core Transformation
"From confused and overwhelmed to confident and saving money in 10 minutes"

### Implementation with Current APIs

#### Hero Variations

```markdown
# Primary Hero
Headline: "See Every Electric Plan in Texas. Clearly. No Tricks."
Subheadline: "What Power to Choose won't show you: real prices at YOUR usage level"
CTA: "Show Me Clear Prices"

# Moving In
Headline: "Moving? Get Power On in 10 Minutes"
Subheadline: "No confusing plans. No hidden fees. Just clear choices."
CTA: "Find My Plan"

# High Bill
Headline: "Fed Up With High Bills? Switch in 10 Minutes"
Subheadline: "See exactly what you'll pay. No surprises."
CTA: "Compare Real Prices"

# Contract Expiring
Headline: "Don't Get Auto-Renewed Into Higher Rates"
Subheadline: "See all your options in one clear list"
CTA: "Check Better Rates"

# No Deposit Seeker
Headline: "Need Electricity With $0 Down? We'll Find It."
Subheadline: "Our system checks every provider to find your lowest deposit"
CTA: "Find No-Deposit Plans"
```

### Transformation Story (Honest Version)

```html
<div class="transformation-story">
  <div class="before">
    <h3>Before ChooseMyPower</h3>
    <ul>
      <li>😵 Confused by 100+ plans</li>
      <li>🤯 Can't understand pricing</li>
      <li>😰 Afraid of choosing wrong</li>
      <li>⏰ Hours wasted comparing</li>
    </ul>
  </div>
  <div class="after">
    <h3>After 10 Minutes Here</h3>
    <ul>
      <li>✅ See plans clearly ranked</li>
      <li>✅ Know exact monthly cost</li>
      <li>✅ Confident in choice</li>
      <li>✅ Enrolled and done</li>
    </ul>
  </div>
</div>
```

---

## Principle 2: Buyer Awareness Levels

### Awareness Strategy with API Constraints

#### Level 1: UNAWARE
**Message:** "Most Texans overpay because plan comparison is intentionally confusing"

**Implementation:**
- Blog content about electricity pricing tricks
- Social posts about neighbor comparisons
- Simple ZIP code tool showing plan COUNT

```javascript
// Simple awareness builder
async function showPlanCount(zipCode) {
  const tdspDuns = getTDSPByZip(zipCode);
  const response = await fetch(
    `https://pricing.api.comparepower.com/api/plans/current?group=default&tdsp_duns=${tdspDuns}&display_usage=1000`
  );
  const plans = await response.json();
  
  return {
    message: `${plans.length} plans available in ${zipCode}. Most people pick wrong.`,
    cta: "See them ranked clearly"
  };
}
```

#### Level 2: PROBLEM AWARE
**Message:** "Yes, comparing plans is hard. We make it simple."

**Landing Page:**
```html
<div class="problem-aware-hero">
  <h1>Tired of Confusing Electricity Plans?</h1>
  <h2>We Show Real Prices. Not Marketing Tricks.</h2>
  
  <div class="usage-selector">
    <h3>What's your average monthly usage?</h3>
    <button data-usage="500">Small (500 kWh)</button>
    <button data-usage="1000">Average (1000 kWh)</button>
    <button data-usage="2000">Large (2000 kWh)</button>
  </div>
</div>
```

#### Level 3: SOLUTION AWARE
**Message:** "Compare plans at YOUR exact usage level"

**Feature Focus:**
- Dynamic usage slider
- Real-time price updates
- Clear cost breakdowns

#### Level 4: PRODUCT AWARE
**Message:** "Why we're better than Power to Choose"

**Comparison Table:**
```markdown
| Feature | Power to Choose | ChooseMyPower |
|---------|----------------|---------------|
| Mobile Friendly | ❌ | ✅ |
| Shows price at YOUR usage | ❌ | ✅ |
| Filters that work | ❌ | ✅ |
| Clear sorting | ❌ | ✅ |
| 10-minute process | ❌ | ✅ |
```

#### Level 5: MOST AWARE
**Message:** "Ready? Let's find your plan."

Simple ZIP code entry → Results in seconds

---

## Principle 3: Market Sophistication

### Realistic Sophistication Strategy

#### Our Actual Mechanisms (with 2 APIs)

**1. "True Price Display"**
```markdown
"While others show teaser rates, we calculate your actual monthly bill"
- Shows price at 500, 1000, 1500, 2000 kWh
- Updates instantly as you adjust usage
- No math required
```

**2. "All Plans, One List"**
```markdown
"Every available plan in your area, refreshed hourly"
- No hidden partner preferences
- No 'featured' manipulation
- Just honest rankings
```

**3. "10-Minute Guarantee"**
```markdown
"If it takes more than 10 minutes, we failed"
- 3 steps: ZIP → Compare → Enroll
- No account required to browse
- Direct links to provider enrollment
```

### Implementation Example

```javascript
// True Price Calculator
function calculateTruePrice(plan, usage) {
  const baseFee = plan.base_fee || 0;
  const energyCharge = plan.rate_per_kwh * usage;
  const tdspCharges = calculateTDSP(plan.tdsp_charges, usage);
  
  const total = baseFee + energyCharge + tdspCharges;
  
  return {
    total: total.toFixed(2),
    breakdown: {
      base: baseFee.toFixed(2),
      energy: energyCharge.toFixed(2),
      delivery: tdspCharges.toFixed(2)
    },
    perKwh: (total / usage).toFixed(3)
  };
}
```

---

## Principle 4: Enter the Existing Conversation

### Mental Conversations We CAN Address

#### 1. "These plans are so confusing"
**Our Response:** "We know. Here they are in plain English."

```html
<div class="plan-card">
  <h3>TXU Energy Free Nights</h3>
  <div class="plain-english">
    <p class="what-it-means">You pay nothing 9pm-6am, but double during the day</p>
    <p class="who-its-for">✅ Good if you work days and run AC at night</p>
    <p class="who-its-not-for">❌ Bad if you work from home</p>
  </div>
  <div class="true-cost">
    <span class="your-bill">Your estimated bill: $127/mo</span>
  </div>
</div>
```

#### 2. "I don't trust these companies"
**Our Response:** "Here's exactly what you'll pay. No surprises."

#### 3. "I don't have time for this"
**Our Response:** "10 minutes. 3 steps. Done."

#### 4. "I can't afford a deposit"
**Our Response:** "We'll find you $0 down options automatically."

```html
<div class="deposit-finder">
  <h3>That plan requires a $300 deposit...</h3>
  <p>But we found 7 other plans with NO deposit!</p>
  <div class="no-deposit-options">
    <div class="option">
      <span class="provider">Payless Power</span>
      <span class="deposit">$0 deposit</span>
      <span class="type">Prepaid</span>
    </div>
    <div class="option">
      <span class="provider">Acacia Energy</span>
      <span class="deposit">$0 deposit</span>
      <span class="type">Variable rate</span>
    </div>
  </div>
</div>
```

### Conversation-Based Features

```javascript
// Address common concerns directly
const conversationFeatures = {
  confusion: {
    feature: "Plain English descriptions",
    implementation: "Translate marketing speak to reality"
  },
  time: {
    feature: "3-step process",
    implementation: "ZIP → Compare → Click to enroll"
  },
  trust: {
    feature: "Show all fees upfront",
    implementation: "Calculate total bill, not just energy rate"
  },
  overwhelm: {
    feature: "Smart defaults",
    implementation: "Pre-select average usage, 12-month terms"
  }
};
```

---

## Principle 5: Proof Over Promise

### Proof We CAN Deliver

#### 1. Specific Speed Metrics
```javascript
// Track and display real metrics
const speedMetrics = {
  pageLoad: "0.8 seconds",
  planLoad: "1.2 seconds", 
  timeToDecision: "6.3 minutes average",
  clicksToEnroll: "4 clicks"
};
```

#### 2. Transparent Data
```markdown
# "Our Data Promise" Section
- Plans updated: Every hour
- Sources: Direct from providers
- Coverage: 100% of available plans
- Hidden plans: 0 (we show everything)
```

#### 3. Real User Counters
```javascript
// Use localStorage for now, database later
function trackUserSuccess() {
  const stats = {
    plansViewed: increment('plansViewed'),
    comparisonsRun: increment('comparisonsRun'),
    timeSpent: trackTime(),
    enrollmentClicks: increment('enrollClicks')
  };
  
  displayStats(stats);
}
```

#### 4. Live Plan Counter
```html
<div class="live-counter">
  <h3>Right Now in ZIP 75205</h3>
  <div class="metric">147 plans available</div>
  <div class="metric">Prices from $47-$238/mo</div>
  <div class="metric">Updated 3 minutes ago</div>
</div>
```

---

## Principle 6: The Big Four Emotions

### Realistic Emotion Triggers

#### NEW 🆕
```markdown
"The 2024 Way to Shop for Electricity"
- Modern, mobile-first design
- Features Power to Choose doesn't have
- Fresh approach to old problem
```

#### EASY 🎯
```markdown
"3 Clicks to Clarity"
1. Enter ZIP
2. Adjust usage slider
3. Click to enroll
```

#### SAFE 🛡️
```markdown
"No Tricks. No Gimmicks. Just Math."
- See our calculation formula
- Compare to your current bill
- No account needed to browse
```

#### BIG 💰
```markdown
"Find Plans $50+ Cheaper in Minutes"
- Sort by savings
- See annual difference
- Real testimonials with amounts
```

### Implementation

```javascript
// Emotion-based UI elements
const emotionUI = {
  new: {
    badge: "2024's Smartest Way",
    color: "gradient-purple",
    icon: "sparkles"
  },
  easy: {
    steps: "Only 3 Steps",
    timer: "Average time: 6 minutes",
    progress: "Step 1 of 3"
  },
  safe: {
    badges: ["No Login Required", "Your Data = Your Business", "Just a Comparison Tool"],
    guarantee: "If we're wrong about prices, tell us"
  },
  big: {
    calculator: "Potential Savings Calculator",
    comparison: "vs. your current plan",
    annual: "That's $[X] per year!"
  }
};
```

---

## Principle 7: Specificity Over Vagueness

### Specific Claims We CAN Make

```markdown
# Real Metrics
- "100+ plans from quality providers" (honest count)
- "Prices updated every hour"
- "4 clicks from ZIP to enrollment"
- "Most people find a plan in about 10 minutes"
- "12-15 trusted providers"
- "$0 deposit options available"

# Specific Comparisons
- "Power to Choose: dozens of clicks. Us: 4 clicks"
- "See prices at 5 usage levels instantly"
- "Mobile responsive vs desktop-only"
- "Automatic deposit comparison"

# Specific Features
- "Slider shows 500-3000 kWh prices"
- "Filter by 3, 6, 12, 24 month terms"
- "Green energy: 0%, 50%, 100% options"
- "Instant deposit check"
- "Prepaid plans = Always $0 deposit"
```

### Vague ❌ vs Specific ✅

```markdown
❌ "Find better rates"
✅ "See all 147 plans in your ZIP"

❌ "Easy comparison"
✅ "Adjust slider, see prices update instantly"

❌ "Save money"
✅ "Plans from $47/mo (500 kWh) in 75205"

❌ "Quick process"
✅ "Average user decides in 6.3 minutes"
```

---

## Realistic Implementation Guide

### MVP Features with Current APIs

#### 1. ZIP Code Entry Page
```javascript
// Simple, focused entry
async function handleZipSubmit(zip) {
  const tdsp = getTDSPByZip(zip);
  if (!tdsp) {
    showError("Sorry, we only serve deregulated Texas areas");
    return;
  }
  
  // Store for the session
  sessionStorage.setItem('userZip', zip);
  sessionStorage.setItem('tdspDuns', tdsp.duns);
  
  // Redirect to comparison
  window.location.href = `/compare?zip=${zip}`;
}
```

#### 2. Smart Comparison Page
```javascript
// Core comparison functionality
async function loadPlans(tdspDuns, usage = 1000) {
  showLoading();
  
  const response = await fetch(
    `https://pricing.api.comparepower.com/api/plans/current?` +
    `group=default&tdsp_duns=${tdspDuns}&display_usage=${usage}`
  );
  
  const plans = await response.json();
  
  // Calculate true prices
  const rankedPlans = plans
    .map(plan => ({
      ...plan,
      truePrice: calculateTruePrice(plan, usage),
      monthlyBill: calculateMonthlyBill(plan, usage),
      depositRequired: plan.term_months > 1 // Fixed-rate plans require credit check
    }))
    .sort((a, b) => a.monthlyBill - b.monthlyBill);
  
  displayPlans(rankedPlans);
  updateMetrics(plans.length, usage);
}
```

#### 3. No-Deposit Plan Finder
```javascript
// Unique deposit comparison feature
async function checkDeposits(selectedPlan, userESIID) {
  // User selected a plan but it requires deposit
  const depositAmount = await checkProviderDeposit(selectedPlan, userESIID);
  
  if (depositAmount > 0) {
    // Show deposit required modal
    showDepositModal(depositAmount);
    
    // Check other providers automatically
    const alternativeProviders = await checkAlternativeProviders(userESIID);
    
    // Sort by deposit amount (lowest first)
    const sortedAlternatives = alternativeProviders
      .sort((a, b) => a.depositAmount - b.depositAmount);
    
    // Display alternatives
    displayDepositAlternatives(sortedAlternatives);
  } else {
    // No deposit required, proceed to enrollment
    proceedToEnrollment(selectedPlan);
  }
}

// Display deposit alternatives
function displayDepositAlternatives(alternatives) {
  const noDepositPlans = alternatives.filter(p => p.depositAmount === 0);
  const lowDepositPlans = alternatives.filter(p => p.depositAmount > 0 && p.depositAmount < 100);
  
  return `
    <div class="deposit-alternatives">
      ${noDepositPlans.length > 0 ? `
        <h3>🎉 ${noDepositPlans.length} Plans with NO Deposit!</h3>
        <div class="no-deposit-list">
          ${noDepositPlans.map(plan => `
            <div class="alternative-plan">
              <h4>${plan.provider}</h4>
              <p class="plan-type">${plan.planType}</p>
              <p class="monthly-cost">${plan.monthlyBill}/mo</p>
              <button onclick="selectAlternative('${plan.id}')">
                Choose This Plan ($0 Deposit)
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${lowDepositPlans.length > 0 ? `
        <h3>Low Deposit Options</h3>
        <div class="low-deposit-list">
          ${lowDepositPlans.map(plan => `
            <div class="alternative-plan">
              <h4>${plan.provider}</h4>
              <p class="deposit-amount">${plan.depositAmount} deposit</p>
              <p class="monthly-cost">${plan.monthlyBill}/mo</p>
              <button onclick="selectAlternative('${plan.id}')">
                Choose This Plan
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="prepaid-option">
        <h3>Always $0 Deposit: Prepaid Plans</h3>
        <p>Pay as you go, no credit check, no surprises</p>
        <button onclick="showPrepaidPlans()">View Prepaid Options</button>
      </div>
    </div>
  `;
}
```

#### 4. Plan Type Indicators
```javascript
// Clear labeling of plan types and deposit requirements
function getPlanTypeInfo(plan) {
  if (plan.is_pre_pay) {
    return {
      label: 'Prepaid',
      depositInfo: 'No deposit ever',
      creditCheck: false,
      badge: '💳 $0 Deposit'
    };
  }
  
  if (plan.term_months === 0 || plan.rate_type === 'variable') {
    return {
      label: 'Variable Rate',
      depositInfo: 'No credit check required',
      creditCheck: false,
      badge: '📊 No Credit Check'
    };
  }
  
  return {
    label: `${plan.term_months}-Month Fixed`,
    depositInfo: 'Credit check required',
    creditCheck: true,
    badge: '🔒 Fixed Rate'
  };
}
```

#### 5. Enhanced Plan Display
```html
<div class="plan-card">
  <div class="plan-header">
    <h3>{{ plan.provider_name }}</h3>
    <span class="plan-name">{{ plan.plan_name }}</span>
    <span class="deposit-badge">{{ plan.depositBadge }}</span>
  </div>
  
  <div class="price-display">
    <div class="monthly-bill">
      <span class="amount">${{ plan.monthlyBill }}</span>
      <span class="label">per month</span>
    </div>
    <div class="effective-rate">
      {{ plan.truePrice }}¢ per kWh (all-in)
    </div>
  </div>
  
  <div class="plan-details">
    <span class="term">{{ plan.term_months }} months</span>
    <span class="green">{{ plan.percent_green }}% renewable</span>
    <span class="deposit-info">{{ plan.depositInfo }}</span>
  </div>
  
  <div class="plan-warnings">
    {{ if plan.creditCheck }}
      <span class="info">ℹ️ Credit check required</span>
    {{ endif }}
    {{ if plan.has_cancellation_fee }}
      <span class="warning">⚠️ Early termination fee applies</span>
    {{ endif }}
  </div>
  
  <button class="enroll-button" 
          data-url="{{ plan.enroll_url }}"
          data-requires-deposit="{{ plan.creditCheck }}">
    Check Availability →
  </button>
</div>
```

#### 6. Deposit Modal Flow
```javascript
// When user selects a plan that might require deposit
function handlePlanSelection(plan) {
  if (!plan.creditCheck) {
    // No credit check needed, straight to enrollment
    window.location.href = plan.enroll_url;
    return;
  }
  
  // Show deposit check modal
  showModal({
    title: "Let's Check Your Deposit",
    content: `
      <div class="deposit-check-modal">
        <p>This ${plan.term_months}-month fixed plan requires a credit check.</p>
        <p>Don't worry - if they ask for a deposit, we'll instantly show you 
           other options with lower or no deposits!</p>
        
        <div class="modal-actions">
          <button onclick="proceedWithDepositCheck('${plan.id}')" class="primary">
            Continue (Find My Best Deposit)
          </button>
          <button onclick="showNoDepositOnly()" class="secondary">
            Show Only No-Deposit Plans
          </button>
        </div>
      </div>
    `
  });
}
```

#### 3. Usage Slider
```html
<div class="usage-control">
  <h3>Your Monthly Usage</h3>
  <input 
    type="range" 
    min="500" 
    max="3000" 
    step="100" 
    value="1000"
    id="usage-slider"
  >
  <div class="usage-display">
    <span id="usage-value">1000</span> kWh/month
    <span class="usage-context">Average Texas home</span>
  </div>
</div>

<script>
document.getElementById('usage-slider').addEventListener('input', (e) => {
  const usage = e.target.value;
  document.getElementById('usage-value').textContent = usage;
  
  // Debounced API call
  clearTimeout(window.usageTimeout);
  window.usageTimeout = setTimeout(() => {
    loadPlans(tdspDuns, usage);
  }, 300);
});
</script>
```

#### 4. Plan Display Cards
```html
<div class="plan-card">
  <div class="plan-header">
    <h3>{{ plan.provider_name }}</h3>
    <span class="plan-name">{{ plan.plan_name }}</span>
  </div>
  
  <div class="price-display">
    <div class="monthly-bill">
      <span class="amount">${{ plan.monthlyBill }}</span>
      <span class="label">per month</span>
    </div>
    <div class="effective-rate">
      {{ plan.truePrice }}¢ per kWh (all-in)
    </div>
  </div>
  
  <div class="plan-details">
    <span class="term">{{ plan.term_months }} months</span>
    <span class="green">{{ plan.percent_green }}% renewable</span>
  </div>
  
  <div class="plan-warnings">
    {{ if plan.has_monthly_fee }}
      <span class="warning">⚠️ ${{ plan.monthly_fee }} monthly fee</span>
    {{ endif }}
    {{ if plan.has_cancellation_fee }}
      <span class="warning">⚠️ Early termination fee applies</span>
    {{ endif }}
  </div>
  
  <button class="enroll-button" data-url="{{ plan.enroll_url }}">
    Check Availability →
  </button>
</div>
```

#### 5. ESIID Lookup Integration
```javascript
// Address validation for enrollment
async function validateAddress(address, zip) {
  const response = await fetch(
    `https://ercot.api.comparepower.com/api/esiids?` +
    `address=${encodeURIComponent(address)}&zip_code=${zip}`
  );
  
  const esiids = await response.json();
  
  if (esiids.length === 0) {
    return { valid: false, message: "Address not found" };
  }
  
  if (esiids.length === 1) {
    return { valid: true, esiid: esiids[0] };
  }
  
  // Multiple units - let user choose
  return { valid: true, multiple: true, options: esiids };
}
```

### Frontend Architecture

```javascript
// Simple, fast, focused
const ChooseMyPowerMVP = {
  // State management
  state: {
    zip: null,
    tdsp: null,
    usage: 1000,
    filters: {
      term: null,
      green: null,
      prepay: false
    },
    plans: [],
    sortBy: 'price'
  },
  
  // Core functions
  init() {
    this.loadStateFromURL();
    this.attachEventListeners();
    this.loadPlans();
  },
  
  async loadPlans() {
    const params = {
      group: 'default',
      tdsp_duns: this.state.tdsp,
      display_usage: this.state.usage,
      ...this.buildFilters()
    };
    
    const plans = await this.api.getPlans(params);
    this.state.plans = this.processPlan(plans);
    this.render();
  },
  
  processPlan(plans) {
    return plans.map(plan => ({
      ...plan,
      monthlyBill: this.calculateBill(plan, this.state.usage),
      warnings: this.detectWarnings(plan),
      benefits: this.detectBenefits(plan)
    }));
  },
  
  render() {
    this.renderMetrics();
    this.renderFilters();
    this.renderPlans();
    this.trackEngagement();
  }
};
```

### CSS for Trust & Clarity

```css
/* Clean, trustworthy design */
:root {
  --primary: #0066CC;
  --success: #00AA44;
  --warning: #FF6600;
  --bg: #FFFFFF;
  --text: #333333;
}

.plan-card {
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}

.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.monthly-bill {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary);
}

.warning {
  color: var(--warning);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.enroll-button {
  background: var(--success);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 16px;
}

/* Mobile-first responsive */
@media (max-width: 768px) {
  .plan-card {
    padding: 16px;
  }
  
  .monthly-bill {
    font-size: 28px;
  }
}
```

---

## MVP Features with Current APIs

### Phase 1: Core Comparison (Week 1)
1. **ZIP to Plans Flow**
   - Clean ZIP entry page
   - Fast plan loading
   - Clear price display

2. **Usage Slider**
   - 500-3000 kWh range
   - Instant price updates
   - Usage guidance

3. **Smart Sorting**
   - Price (default)
   - Term length
   - Green percentage
   - Provider name

### Phase 2: Trust Building (Week 2)
1. **Transparency Features**
   - "How we calculate" modal
   - Price breakdown display
   - Update timestamp

2. **Social Proof**
   - Usage statistics
   - Time on site tracking
   - "X people viewing"

3. **Help Content**
   - "Is this my usage?" helper
   - Term length explainer
   - Green energy guide

### Phase 3: Conversion (Week 3)
1. **Comparison Tools**
   - "Compare to current" feature
   - Savings calculator
   - Annual cost display

2. **Decision Helpers**
   - "Best for most" badge
   - Warning highlights
   - Benefit callouts

3. **Smooth Handoff**
   - Direct enrollment links
   - "What happens next"
   - Provider ratings

---

## Launch Strategy

### Week 1: Foundation
- [ ] Build ZIP entry page
- [ ] Implement plan fetching
- [ ] Create comparison display
- [ ] Add usage slider
- [ ] Mobile optimization

### Week 2: Enhancement
- [ ] Add filters
- [ ] Build trust elements
- [ ] Create help content
- [ ] Implement analytics
- [ ] Speed optimization
- [ ] **Add deposit indicator badges**
- [ ] **Build "No Credit Check" filter**

### Week 3: Conversion
- [ ] A/B test headlines
- [ ] Add social proof
- [ ] Launch calculator
- [ ] Create share features
- [ ] Monitor metrics
- [ ] **Implement deposit comparison flow**
- [ ] **Create prepaid plan section**

### Week 4: Scale
- [ ] Google Ads campaign
- [ ] Social media launch
- [ ] Content creation
- [ ] PR outreach
- [ ] Referral system
- [ ] **Target "no deposit electricity" keywords**
- [ ] **Partner with credit repair sites**

### Success Metrics

```javascript
// Realistic KPIs (no fake precision)
const mvpTargets = {
  week1: {
    visitors: "100+",
    planViews: "500+",
    enrollClicks: "10+"
  },
  week2: {
    visitors: "500+",
    planViews: "2000+",
    enrollClicks: "50+",
    timeOnSite: "4-5 min",
    noDepositSearches: "100+"
  },
  week3: {
    visitors: "1000+",
    planViews: "5000+",
    enrollClicks: "150+",
    conversionRate: "2-3%",
    depositComparisons: "200+"
  },
  week4: {
    visitors: "2500+",
    planViews: "10000+",
    enrollClicks: "500+",
    conversionRate: "2-4%",
    noDepositConversions: "150+"
  }
};
```

## No-Deposit Specific Marketing

### SEO Target Keywords
- "no deposit electricity texas"
- "electricity no credit check"
- "$0 down electricity"
- "prepaid electricity texas"
- "bad credit electricity"
- "same day electricity no deposit"

### Ad Copy Examples
```markdown
# Google Ads
Headline 1: $0 Deposit Electricity
Headline 2: No Credit Check Plans
Description: Find Texas electricity with no deposit. Prepaid & variable rate options. Same-day service available.

# Facebook
"Tired of $300 electricity deposits? 🙄

We check 7+ providers to find you $0 deposit options.
✅ Prepaid plans (no deposit ever)
✅ Variable rates (no credit check)
✅ Compare all options in one place

Join 51,387 Texans saving money without deposits."
```

### Content Strategy
1. **"Complete Guide to No Deposit Electricity in Texas"**
2. **"Prepaid vs Postpaid: Which Saves More?"**
3. **"How to Avoid Electricity Deposits"**
4. **"Bad Credit? You Still Have Options"**

### Trust Messaging for Credit-Challenged Users
```markdown
"We get it. Not everyone has perfect credit.

That's why we:
- Show ALL your options upfront
- Never judge your situation
- Find solutions that work for YOU
- Make the process dignity-preserving

Everyone deserves affordable electricity."
```

---

## Conclusion

With just 2 API endpoints, ChooseMyPower can still deliver massive value by:

1. **Being faster and clearer** than Power to Choose
2. **Showing true prices** at user's actual usage
3. **Working perfectly on mobile**
4. **Building trust through transparency**

The 7 marketing principles apply even with constraints:
- **Transformation**: From confusion to clarity
- **Awareness**: Meet users where they are
- **Sophistication**: Simple tools, powerful results
- **Conversation**: Address real frustrations
- **Proof**: Show real data and metrics
- **Emotions**: New, Easy, Safe, Big savings
- **Specificity**: Exact numbers, not vague promises

**Next Step**: Build the MVP in 3 weeks and start helping Texans save money.

**Remember**: We don't need every feature to be valuable. We just need to be honest, clear, and helpful.

---

## No-Deposit Feature Deep Dive

### Understanding the Credit Check Landscape

**Fixed-Rate Plans (3-24 months)**
- Always require credit check
- Deposit based on credit score
- Most stable pricing
- Best for good credit

**Variable Rate Plans**
- NO credit check required
- NO deposit (usually)
- Prices can change monthly
- Good for credit-challenged

**Prepaid Plans**
- NO credit check ever
- NO deposit ever
- Pay before you use
- Perfect for bad credit

### The Deposit Comparison Advantage

```javascript
// User Journey Example
const depositJourney = {
  step1: "User finds perfect 12-month plan at 8.9¢/kWh",
  step2: "Clicks 'Check Availability'",
  step3: "Provider wants $250 deposit",
  step4: "We automatically check 6 other providers",
  step5: "Show user 3 options with $0 deposit",
  step6: "User switches and saves the $250"
};
```

### Messaging for Different Credit Situations

**Good Credit Messaging**
```markdown
"Your good credit = more options and lower deposits
We'll find your best rate AND lowest deposit"
```

**Fair Credit Messaging**
```markdown
"Some providers want deposits, others don't.
We'll check them all to save you money."
```

**Poor Credit Messaging**
```markdown
"No judgment here. You have options:
✓ Prepaid plans (no deposit, no credit check)
✓ Variable rates (usually no deposit)
✓ We'll find what works for you"
```

### Building Trust with Vulnerable Users

1. **Never shame or judge**
   - "Everyone's situation is different"
   - "We're here to help, not judge"

2. **Be transparent about options**
   - "Fixed rates need credit checks"
   - "Prepaid always works"

3. **Emphasize dignity**
   - "Shop with confidence"
   - "Your information is private"

4. **Show real solutions**
   - Always have multiple options
   - Never leave someone without a path forward

### The Complete No-Deposit Value Prop

```markdown
"Why waste $100-400 on deposits?

ChooseMyPower automatically:
✓ Checks your deposit with multiple providers
✓ Finds $0 deposit alternatives
✓ Shows prepaid options (never any deposit)
✓ Saves you money from day one

Same electricity. Same wires. Just no deposit."
```