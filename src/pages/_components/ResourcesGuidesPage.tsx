import React, { useState } from 'react';
import { BookOpen, Users, Zap, Calculator, Shield, Home, Building, Leaf } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface ResourcesGuidesPageProps {
}

export function ResourcesGuidesPage({}: ResourcesGuidesPageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'getting-started' | 'switching' | 'plans' | 'business'>('all');

  const guides = [
    {
      title: 'How to Pick a Provider That Won\'t Screw You Over',
      description: 'The insider secrets on choosing providers - what they don\'t want you to know about their tricks.',
      category: 'getting-started',
      icon: Users,
      readTime: '8 min read',
      href: '/resources/guides/choosing-a-provider'
    },
    {
      title: 'What the Heck is a kWh and Why Should You Care?',
      description: 'Decode your electric bill like a detective and catch the hidden fees they hope you miss.',
      category: 'getting-started',
      icon: Calculator,
      readTime: '6 min read',
      href: '/resources/guides/understanding-your-bill'
    },
    {
      title: 'How to Switch Electric Companies (It\'s Easier Than You Think)',
      description: 'Your lights stay on, the process is free, and it takes 5 minutes. Here\'s exactly what happens.',
      category: 'switching',
      icon: Zap,
      readTime: '7 min read',
      href: '/resources/guides/how-to-switch-providers'
    },
    {
      title: 'Fixed vs Variable: Which Won\'t Bite You Later?',
      description: 'The real deal on rate types - including the one that looks cheap but will destroy your budget.',
      category: 'plans',
      icon: BookOpen,
      readTime: '5 min read',
      href: '/resources/guides/fixed-vs-variable'
    },
    {
      title: 'Green Energy: What\'s Actually Green vs. Marketing Nonsense',
      description: 'How to find truly renewable plans and avoid the greenwashing that\'s everywhere.',
      category: 'plans',
      icon: Leaf,
      readTime: '9 min read',
      href: '/resources/guides/green-energy'
    },
    {
      title: 'Don\'t Let Them Fleece Your Business Too',
      description: 'Commercial electricity is even trickier. Here\'s how to protect your bottom line.',
      category: 'business',
      icon: Building,
      readTime: '10 min read',
      href: '/resources/guides/business-electricity'
    },
    {
      title: 'New to Texas? Don\'t Get Taken Advantage Of',
      description: 'What every newcomer needs to know to avoid the rookie mistakes that cost hundreds.',
      category: 'getting-started',
      icon: Home,
      readTime: '12 min read',
      href: '/resources/guides/moving-guide'
    },
    {
      title: 'Scammer Alert: How to Spot the Vultures',
      description: 'Door-to-door scams, phone tricks, and bait-and-switch tactics - here\'s how they work.',
      category: 'getting-started',
      icon: Shield,
      readTime: '4 min read',
      href: '/resources/guides/red-flags'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Guides', count: guides.length },
    { id: 'getting-started', name: 'Getting Started', count: guides.filter(g => g.category === 'getting-started').length },
    { id: 'switching', name: 'Switching Providers', count: guides.filter(g => g.category === 'switching').length },
    { id: 'plans', name: 'Understanding Plans', count: guides.filter(g => g.category === 'plans').length },
    { id: 'business', name: 'Business', count: guides.filter(g => g.category === 'business').length }
  ];

  const filteredGuides = selectedCategory === 'all' 
    ? guides 
    : guides.filter(guide => guide.category === selectedCategory);

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
            <span>Guides</span>
          </nav>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Beat the Texas Electricity Game
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              No corporate doublespeak here. Just straight talk about how to navigate Texas electricity without getting ripped off. These guides will save you money and headaches.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredGuides.map((guide, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mr-4">
                    <guide.icon className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-texas-navy font-medium">
                    {categories.find(c => c.id === guide.category)?.name}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{guide.title}</h3>
                <p className="text-gray-600 mb-4">{guide.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{guide.readTime}</span>
                  <button
                    onClick={() => navigate(guide.href)}
                    className="text-texas-navy hover:text-texas-navy font-medium text-sm"
                  >
                    Read Guide →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Most Popular Guides
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-lg mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Just Moved to Texas?</h3>
              <p className="text-gray-600 mb-4">
                Don't let them take advantage of you on day one. Here's what you need to know before the vultures circle.
              </p>
              <button
                onClick={() => navigate('/resources/guides/moving-guide')}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Newcomer Protection Guide →
              </button>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tired of High Bills?</h3>
              <p className="text-gray-600 mb-4">
                Switching is easier than ordering pizza and could save you hundreds. Here's how it actually works.
              </p>
              <button
                onClick={() => navigate('/resources/guides/how-to-switch-providers')}
                className="text-texas-navy hover:text-texas-navy font-medium"
              >
                Easy Switch Guide →
              </button>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">All Plans Look the Same?</h3>
              <p className="text-gray-600 mb-4">
                They're designed to confuse you. Here's how to cut through the nonsense and find the real differences.
              </p>
              <button
                onClick={() => navigate('/resources/guides/fixed-vs-variable')}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Plan Decoder →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}