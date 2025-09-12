import React from 'react';
import { BookOpen } from 'lucide-react';
import StandardZipInputReact from '../../components/StandardZipInputReact';

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
      {/* Professional Hero Section */}
      <div className="relative bg-gradient-to-br from-texas-navy via-blue-800 to-texas-navy text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
              <BookOpen className="w-5 h-5 text-texas-gold mr-3" />
              <span className="font-semibold text-lg">Texas Electricity Resources</span>
            </div>
            
            {/* Enhanced Typography */}
            <div className="space-y-8 max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Finally. Texas Help
                <span className="block text-texas-gold mt-2">That Actually Helps</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
                <span className="text-texas-red font-semibold">You've spent hours.</span> 
                <span className="text-white font-semibold">We've been there.</span> 
                <span className="text-white/80">Here's everything we learned the hard way.</span>
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg mb-16">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-100 font-medium">No corporate nonsense</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-navy/100/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-white/90 font-medium">Real experience</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-texas-red/20 backdrop-blur-sm rounded-full border border-texas-red/30">
                  <div className="w-2 h-2 bg-texas-red-200 rounded-full mr-2"></div>
                  <span className="text-red-100 font-medium">Actually helpful</span>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto mb-6 mt-16">
              <StandardZipInputReact 
                size="lg"
                variant="inline"
                className="w-full"
              />
            </div>
            
            <div className="text-blue-200">
              <p className="text-lg font-medium">Compare plans and providers • Find the best rates • Get honest advice</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guides Section */}
        <div className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-8">The Stuff We Wish Someone Had Told Us</h2>
          
          <div className="grid md:grid-cols-2 gap-10">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-md border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 group">
                <div className="flex items-start">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-3xl mr-6 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <guide.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-texas-navy font-semibold mb-2">{guide.category}</div>
                    <h3 className="text-xl font-bold text-texas-navy mb-3">{guide.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{guide.description}</p>
                    <a
                      href={guide.href}
                      className="text-texas-red hover:text-texas-red-600 font-semibold group-hover:translate-x-2 transition-transform duration-200 inline-block"
                    >
                      Read Guide →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="/resources/guides"
              className="bg-texas-navy text-white px-8 py-4 rounded-xl hover:bg-texas-navy/90 transition-colors font-semibold text-lg shadow-md hover:shadow-xl"
            >
              View All Guides
            </a>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-8">Calculators That Don't Lie to You</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            {tools.map((tool, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-md border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <tool.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-texas-navy mb-4">{tool.title}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{tool.description}</p>
                <a
                  href={tool.href}
                  className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-300 w-full inline-block text-center font-semibold shadow-md hover:shadow-xl"
                >
                  Use Tool
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-8">When Stuff Goes Wrong (And It Will)</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-md border border-gray-200 hover:shadow-xl hover:border-texas-navy transition-all duration-300 text-center group">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-${option.color}-100 text-${option.color}-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-texas-navy mb-4">{option.title}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{option.description}</p>
                <a
                  href={option.href}
                  className={`bg-${option.color}-600 text-white px-8 py-4 rounded-xl hover:bg-${option.color}-700 transition-all duration-300 w-full inline-block text-center font-semibold shadow-md hover:shadow-xl`}
                >
                  Get Help
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-texas-navy mb-12 text-center">The Most-Read Stuff (Because Everyone Gets Tricked By This)</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <a
              href="/resources/guides/red-flags"
              className="p-6 text-left border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-texas-navy transition-all duration-300 block group"
            >
              <h3 className="font-bold text-texas-navy mb-2 group-hover:text-texas-red">Scammer Alert: Red Flags</h3>
              <p className="text-gray-600 leading-relaxed">How to spot the door-to-door vultures and phone scammers</p>
            </a>
            
            <a
              href="/resources/guides/green-energy"
              className="p-6 text-left border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-texas-navy transition-all duration-300 block group"
            >
              <h3 className="font-bold text-texas-navy mb-2 group-hover:text-texas-red">Green Energy (The Real Story)</h3>
              <p className="text-gray-600 leading-relaxed">What's actually green vs. marketing greenwashing</p>
            </a>
            
            <a
              href="/resources/guides/business-electricity"
              className="p-6 text-left border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-texas-navy transition-all duration-300 block group"
            >
              <h3 className="font-bold text-texas-navy mb-2 group-hover:text-texas-red">Business Electricity Survival</h3>
              <p className="text-gray-600 leading-relaxed">Don't let them fleece your business too</p>
            </a>
            
            <a
              href="/resources/guides/moving-guide"
              className="p-6 text-left border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-texas-navy transition-all duration-300 block group"
            >
              <h3 className="font-bold text-texas-navy mb-2 group-hover:text-texas-red">New to Texas? Start Here</h3>
              <p className="text-gray-600 leading-relaxed">Don't get taken advantage of on day one</p>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-texas-cream p-6 rounded-2xl text-center shadow-md">
              <div className="text-3xl font-bold text-texas-navy">1000s</div>
              <div className="text-texas-navy font-medium">Texans Helped</div>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl text-center shadow-md">
              <div className="text-3xl font-bold text-green-900">$500+</div>
              <div className="text-green-700 font-medium">Avg. Savings/Year</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl text-center shadow-md">
              <div className="text-3xl font-bold text-purple-900">Zero</div>
              <div className="text-purple-700 font-medium">Sales Pressure</div>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl text-center shadow-md">
              <div className="text-3xl font-bold text-orange-900">100%</div>
              <div className="text-orange-700 font-medium">Honest Advice</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}