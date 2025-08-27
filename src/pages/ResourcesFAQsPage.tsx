import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface ResourcesFAQsPageProps {
  onNavigate: (path: string) => void;
}

export function ResourcesFAQsPage({ onNavigate }: ResourcesFAQsPageProps) {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'choosing' | 'switching' | 'billing' | 'plans'>('all');

  const faqs = [
    {
      id: 'what-is-deregulation',
      category: 'choosing',
      question: 'What does electricity deregulation mean?',
      answer: 'Electricity deregulation means you have the power to choose your electricity provider. In deregulated states like Texas, you can shop for electricity plans just like you shop for cell phone or internet service. Your local utility still delivers the electricity, but you choose who supplies it and at what rate.'
    },
    {
      id: 'how-to-choose-provider',
      category: 'choosing',
      question: 'How do I choose the right electricity provider?',
      answer: 'Compare providers based on: 1) Total monthly cost (not just the rate), 2) Contract terms and length, 3) Customer service ratings and reviews, 4) Green energy options if important to you, 5) Additional fees and charges. Use your actual monthly usage to calculate real costs.'
    },
    {
      id: 'switching-process',
      category: 'switching',
      question: 'How long does it take to switch electricity providers?',
      answer: 'The switching process typically takes 1-2 billing cycles (30-60 days) to complete. However, you can sign up with a new provider immediately. Your new provider handles all the paperwork and coordination with your current provider.'
    },
    {
      id: 'service-interruption',
      category: 'switching',
      question: 'Will my electricity be shut off when I switch providers?',
      answer: 'No, your electricity service will not be interrupted when you switch providers. The transition happens seamlessly behind the scenes. The same power lines and infrastructure deliver electricity to your home regardless of which provider you choose.'
    },
    {
      id: 'fixed-vs-variable',
      category: 'plans',
      question: 'What\'s the difference between fixed and variable rate plans?',
      answer: 'Fixed-rate plans keep the same price per kWh throughout your entire contract, making your bills predictable. Variable-rate plans can change monthly based on market conditions - they may start lower but can increase over time. Fixed rates are generally better for budgeting.'
    },
    {
      id: 'green-energy-cost',
      category: 'plans',
      question: 'Do green energy plans cost more?',
      answer: 'Not necessarily. Many 100% renewable energy plans are competitively priced with traditional plans. Some green plans even cost less than conventional electricity. The price depends more on the provider and contract terms than the energy source.'
    },
    {
      id: 'understanding-bill',
      category: 'billing',
      question: 'Why is my electricity bill higher than the advertised rate?',
      answer: 'Your bill includes more than just the electricity rate. It also includes: monthly service fees from your provider, delivery charges from your utility company, taxes, and sometimes other fees. Always compare total monthly costs, not just the per-kWh rate.'
    },
    {
      id: 'cancellation-fees',
      category: 'billing',
      question: 'Can I cancel my electricity contract early?',
      answer: 'Yes, but you may have to pay an early termination fee (ETF). The ETF amount varies by provider and is listed in your contract. Some providers offer no-fee plans or will waive the fee in certain circumstances like moving out of the service area.'
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
      answer: 'In Texas, you must choose an electricity provider before you can get service. Compare providers and plans, sign up online or by phone, and schedule your service start date. Allow 1-3 business days for connection. Don\'t wait until moving day to sign up.'
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
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('/resources')} className="hover:text-blue-600">Resources</button>
            <span className="mx-2">/</span>
            <span>FAQs</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Find answers to common questions about choosing electricity providers, switching service, 
              and understanding your electricity options.
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
                    ? 'bg-blue-600 text-white'
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Our support team is here to help you 
            understand your electricity options and make informed decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('/resources/support/contact')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => onNavigate('/resources/guides')}
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