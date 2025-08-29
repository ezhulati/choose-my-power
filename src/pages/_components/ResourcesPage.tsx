import React from 'react';
import { BookOpen, Calculator, HelpCircle, Phone, FileText, Shield, Users, Zap } from 'lucide-react';

interface ResourcesPageProps {
}

export function ResourcesPage({}: ResourcesPageProps) {
  const guides = [
    {
      title: 'How to Choose an Electricity Provider',
      description: 'Complete guide to selecting the right provider for your needs',
      href: '/resources/guides/choosing-a-provider',
      icon: Users,
      category: 'Getting Started'
    },
    {
      title: 'Understanding Your Electricity Bill',
      description: 'Learn to read and understand all charges on your electric bill',
      href: '/resources/guides/understanding-your-bill',
      icon: FileText,
      category: 'Getting Started'
    },
    {
      title: 'How to Switch Providers',
      description: 'Step-by-step process for changing electricity companies',
      href: '/resources/guides/how-to-switch-providers',
      icon: Zap,
      category: 'Switching'
    },
    {
      title: 'Fixed vs Variable Rate Plans',
      description: 'Compare different rate structures and find what works for you',
      href: '/resources/guides/fixed-vs-variable',
      icon: BookOpen,
      category: 'Plan Types'
    }
  ];

  const tools = [
    {
      title: 'Electricity Rate Calculator',
      description: 'Calculate and compare monthly costs based on your usage',
      href: '/rates/calculator',
      icon: Calculator
    },
    {
      title: 'Usage Estimator',
      description: 'Estimate your monthly kWh usage by home size and appliances',
      href: '/resources/tools/usage-estimator',
      icon: Zap
    },
    {
      title: 'Savings Calculator',
      description: 'Calculate potential savings by switching providers',
      href: '/resources/tools/savings-calculator',
      icon: Calculator
    }
  ];

  const supportOptions = [
    {
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions about electricity providers',
      href: '/resources/faqs',
      icon: HelpCircle,
      color: 'blue'
    },
    {
      title: 'Contact Support',
      description: 'Get personalized help with choosing electricity plans',
      href: '/resources/support/contact',
      icon: Phone,
      color: 'green'
    },
    {
      title: 'File a Complaint',
      description: 'Learn how to resolve issues with electricity providers',
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
              Resources & Guides
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Everything you need to know about choosing electricity providers, understanding plans, 
              and making informed decisions about your electricity service.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guides Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Educational Guides</h2>
          
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Calculation Tools</h2>
          
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Get Help & Support</h2>
          
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Resources</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/resources/guides/red-flags"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Red Flags to Avoid</h3>
              <p className="text-sm text-gray-600">Warning signs when choosing providers</p>
            </a>
            
            <a
              href="/resources/guides/green-energy"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Green Energy Guide</h3>
              <p className="text-sm text-gray-600">Everything about renewable energy plans</p>
            </a>
            
            <a
              href="/resources/guides/business-electricity"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Business Electricity</h3>
              <p className="text-sm text-gray-600">Commercial electricity considerations</p>
            </a>
            
            <a
              href="/resources/guides/moving-guide"
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <h3 className="font-medium text-gray-900 mb-1">Moving Guide</h3>
              <p className="text-sm text-gray-600">Electricity setup for new residents</p>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-texas-cream-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">25+</div>
              <div className="text-sm text-texas-navy">Guides & Articles</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">10+</div>
              <div className="text-sm text-green-700">Calculation Tools</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">24/7</div>
              <div className="text-sm text-purple-700">Support Available</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-900">Free</div>
              <div className="text-sm text-orange-700">All Resources</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}