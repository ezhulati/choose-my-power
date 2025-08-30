import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ResourcesFAQsPageProps {
}

export function ResourcesFAQsPage({}: ResourcesFAQsPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'choosing' | 'switching' | 'billing' | 'plans'>('all');

  const faqs = [
    {
      id: 'what-is-deregulation',
      category: 'choosing',
      question: 'What the heck is electricity deregulation anyway?',
      answer: 'Think of it like this: your local utility company (like Oncor or CenterPoint) owns the power lines, but they don\'t get to sell you electricity anymore. Instead, you get to shop around for who supplies your power - kind of like choosing between AT&T and Verizon, except it\'s for electricity. The same wires deliver power to your house no matter who you choose.'
    },
    {
      id: 'how-to-choose-provider',
      category: 'choosing',
      question: 'How do I pick a provider that won\'t screw me over?',
      answer: 'First rule: ignore the big flashy rate they advertise - it\'s usually misleading. Instead, look at what you\'ll actually pay each month based on how much electricity you use. Check reviews (especially complaints), avoid door-to-door salespeople like the plague, and read the fine print for hidden fees. If it sounds too good to be true, it probably is.'
    },
    {
      id: 'switching-process',
      category: 'switching',
      question: 'How long does switching actually take?',
      answer: 'You can sign up in 5 minutes online, but the actual switch happens on your next meter reading date - usually 2-4 weeks later. You don\'t do anything except sign up. Your new company handles all the behind-the-scenes stuff. Think of it like switching cell phone carriers - same process.'
    },
    {
      id: 'service-interruption',
      category: 'switching',
      question: 'Will my power get shut off when I switch?',
      answer: 'Nope, your lights stay on the whole time. It\'s the same power lines, same electricity - just a different company sending you the bill. It\'s like changing who manages your bank account; the money doesn\'t disappear while you switch banks.'
    },
    {
      id: 'fixed-vs-variable',
      category: 'plans',
      question: 'Fixed vs variable rates - which one won\'t bite me?',
      answer: 'Fixed rate = same price the whole contract. Variable rate = they can change it whenever they want (and they usually do, and not in your favor). Variable rates are like teaser rates on credit cards - they hook you with a low price then jack it up. Stick with fixed unless you enjoy surprises on your electric bill.'
    },
    {
      id: 'green-energy-cost',
      category: 'plans',
      question: 'Do green energy plans actually cost more?',
      answer: 'Usually not much, and sometimes they\'re even cheaper. The real trick is figuring out what\'s actually \'green\' versus marketing nonsense. Some companies just buy \'renewable energy credits\' (which is basically accounting magic) while others use actual wind and solar power. Do your homework on what \'green\' really means.'
    },
    {
      id: 'understanding-bill',
      category: 'billing',
      question: 'Why is my bill way higher than that rate they advertised?',
      answer: 'Because they\'re playing games with you. That \'rate\' they advertise often only applies if you use exactly 1,000 or 2,000 kWh. Use more or less, and boom - different rate. Plus they add monthly fees, connection fees, and who knows what else. This is why you should always look at the total monthly cost for YOUR usage, not their marketing number.'
    },
    {
      id: 'cancellation-fees',
      category: 'billing',
      question: 'Can I get out of my contract if I hate my provider?',
      answer: 'Yes, but they\'ll probably charge you an early termination fee - usually $100-300. It\'s like breaking a cell phone contract. Sometimes it\'s worth paying the fee if you\'ll save more money with a different provider. Do the math first. Some companies waive the fee if you\'re moving out of Texas.'
    },
    {
      id: 'deposit-required',
      category: 'choosing',
      question: 'Do I need to pay a deposit for electricity service?',
      answer: 'It depends on your credit score and the provider. Customers with good credit typically don\'t need deposits. Those with poor or no credit may need to pay a deposit or choose a prepaid plan. Some providers offer no-deposit options for all customers.'
    },
    {
      id: 'move-to-texas',
      category: 'choosing',
      question: 'I\'m moving to Texas. How do I get electricity turned on?',
      answer: 'In deregulated areas of Texas, you get to choose your electricity provider - a freedom most states don\'t offer. Compare providers and plans to find your best rate, sign up online or by phone, and schedule your service start date. Allow 1-3 business days for connection. Don\'t wait until moving day to sign up.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'choosing', name: 'Choosing Providers' },
    { id: 'switching', name: 'Switching' },
    { id: 'plans', name: 'Plan Types' },
    { id: 'billing', name: 'Bills & Fees' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (faqId: string) => {
    setOpenFAQ(openFAQ === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/resources')} className="hover:text-texas-navy">Resources</button>
            <span className="mx-2">/</span>
            <span>FAQs</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Questions, Straight Answers
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              No corporate nonsense here. Just honest answers to the questions you're actually asking about Texas electricity. We've helped thousands of people figure this out.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-texas-navy text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-12">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {openFAQ === faq.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              </button>
              
              {openFAQ === faq.id && (
                <div className="px-6 pb-6">
                  <div className="text-gray-600 leading-relaxed">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Confused? We Get It.</h2>
          <p className="text-gray-600 mb-6">
            Texas electricity is needlessly complicated. If you can't find your answer here or want someone to walk you through your specific situation, just ask. We're real humans who've helped thousands of Texans figure this out.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/resources/support/contact')}
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('/resources/guides')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Guides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}