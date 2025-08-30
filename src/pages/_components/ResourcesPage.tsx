import React from 'react';
import { BookOpen, Calculator, HelpCircle, Phone, FileText, Shield, Users, Zap } from 'lucide-react';

interface ResourcesPageProps {
}

export function ResourcesPage({}: ResourcesPageProps) {
  const guides = [
    {
      title: 'How to Pick a Provider That Won\'t Screw You',
      description: 'The real deal on choosing electricity providers - what they don\'t want you to know',
      href: '/resources/guides/choosing-a-provider',
      icon: Users,
      category: 'Don\'t Get Fooled'
    },
    {
      title: 'What the Heck is a kWh and Why Should You Care?',
      description: 'Decode your electric bill like a pro and spot the hidden fees',
      href: '/resources/guides/understanding-your-bill',
      icon: FileText,
      category: 'Money Matters'
    },
    {
      title: 'How to Switch Electric Companies (It\'s Easier Than You Think)',
      description: 'Your lights stay on, your bill goes down - here\'s exactly how to do it',
      href: '/resources/guides/how-to-switch-providers',
      icon: Zap,
      category: 'Take Action'
    },
    {
      title: 'Fixed vs Variable: Which Won\'t Bite You Later?',
      description: 'Plain English breakdown of rate types so you don\'t get surprised',
      href: '/resources/guides/fixed-vs-variable',
      icon: BookOpen,
      category: 'Smart Choices'
    }
  ];

  const tools = [
    {
      title: 'Real Cost Calculator',
      description: 'See what you\'ll actually pay (not the marketing rate they show you)',
      href: '/rates/calculator',
      icon: Calculator
    },
    {
      title: 'Usage Reality Check',
      description: 'Figure out how much electricity you actually use (most people guess wrong)',
      href: '/resources/tools/usage-estimator',
      icon: Zap
    },
    {
      title: 'Switching Savings Calculator',
      description: 'Find out if switching is worth it or if you should wait',
      href: '/resources/tools/savings-calculator',
      icon: Calculator
    }
  ];

  const supportOptions = [
    {
      title: 'Real Questions, Straight Answers',
      description: 'No corporate nonsense - just honest answers to what you\'re actually wondering',
      href: '/resources/faqs',
      icon: HelpCircle,
      color: 'blue'
    },
    {
      title: 'Need Help? We\'re Real Humans',
      description: 'Talk to someone who actually understands Texas electricity (we\'re not salespeople)',
      href: '/resources/support/contact',
      icon: Phone,
      color: 'green'
    },
    {
      title: 'Provider Screwed You Over?',
      description: 'Here\'s how to fight back when electric companies don\'t play fair',
      href: '/resources/support/complaints',
      icon: Shield,
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Finally. Texas Electricity Help That Actually Helps
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              You've spent hours trying to figure this out. So did we. Here's everything we learned the hard way, 
              explained like we're helping a friend. No corporate nonsense. Just the stuff that actually matters.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guides Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">The Stuff We Wish Someone Had Told Us</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mr-4 flex-shrink-0">
                    <guide.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-texas-navy font-medium mb-1">{guide.category}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{guide.title}</h3>
                    <p className="text-gray-600 mb-4">{guide.description}</p>
                    <a
                      href={guide.href}
                      className="text-texas-navy hover:text-texas-navy font-medium text-sm inline-block"
                    >
                      Read Guide →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/resources/guides"
              className="bg-texas-navy text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors inline-block"
            >
              View All Guides
            </a>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Calculators That Don't Lie to You</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                  <tool.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{tool.title}</h3>
                <p className="text-gray-600 mb-6">{tool.description}</p>
                <a
                  href={tool.href}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full inline-block text-center"
                >
                  Use Tool
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">When Stuff Goes Wrong (And It Will)</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${option.color}-100 text-${option.color}-600 rounded-lg mb-6`}>
                  <option.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{option.title}</h3>
                <p className="text-gray-600 mb-6">{option.description}</p>
                <a
                  href={option.href}
                  className={`bg-${option.color}-600 text-white px-6 py-3 rounded-lg hover:bg-${option.color}-700 transition-colors w-full inline-block text-center`}
                >
                  Get Help
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Most-Read Stuff (Because Everyone Gets Tricked By This)</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/resources/guides/red-flags"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Scammer Alert: Red Flags</h3>
              <p className="text-sm text-gray-600">How to spot the door-to-door vultures and phone scammers</p>
            </a>
            
            <a
              href="/resources/guides/green-energy"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Green Energy (The Real Story)</h3>
              <p className="text-sm text-gray-600">What's actually green vs. marketing greenwashing</p>
            </a>
            
            <a
              href="/resources/guides/business-electricity"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Business Electricity Survival</h3>
              <p className="text-sm text-gray-600">Don't let them fleece your business too</p>
            </a>
            
            <a
              href="/resources/guides/moving-guide"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">New to Texas? Start Here</h3>
              <p className="text-sm text-gray-600">Don't get taken advantage of on day one</p>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-texas-cream-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">1000s</div>
              <div className="text-sm text-texas-navy">Texans Helped</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">$500+</div>
              <div className="text-sm text-green-700">Avg. Savings/Year</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">Zero</div>
              <div className="text-sm text-purple-700">Sales Pressure</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-900">100%</div>
              <div className="text-sm text-orange-700">Honest Advice</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}