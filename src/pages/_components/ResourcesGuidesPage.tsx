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
      title: 'How to Choose an Electricity Provider',
      description: 'Complete guide to selecting the right provider for your specific needs and situation.',
      category: 'getting-started',
      icon: Users,
      readTime: '8 min read',
      href: '/resources/guides/choosing-a-provider'
    },
    {
      title: 'Understanding Your Electricity Bill',
      description: 'Learn to read and understand every charge on your electric bill.',
      category: 'getting-started',
      icon: Calculator,
      readTime: '6 min read',
      href: '/resources/guides/understanding-your-bill'
    },
    {
      title: 'How to Switch Electricity Providers',
      description: 'Step-by-step process for changing electricity companies without hassle.',
      category: 'switching',
      icon: Zap,
      readTime: '7 min read',
      href: '/resources/guides/how-to-switch-providers'
    },
    {
      title: 'Fixed vs Variable Rate Plans',
      description: 'Compare different rate structures and find what works best for you.',
      category: 'plans',
      icon: BookOpen,
      readTime: '5 min read',
      href: '/resources/guides/fixed-vs-variable'
    },
    {
      title: 'Green Energy Plans Guide',
      description: 'Everything you need to know about renewable electricity options.',
      category: 'plans',
      icon: Leaf,
      readTime: '9 min read',
      href: '/resources/guides/green-energy'
    },
    {
      title: 'Business Electricity Guide',
      description: 'Commercial electricity considerations for business owners.',
      category: 'business',
      icon: Building,
      readTime: '10 min read',
      href: '/resources/guides/business-electricity'
    },
    {
      title: 'Moving to Texas Electricity Guide',
      description: 'Everything new Texas residents need to know about choosing electricity.',
      category: 'getting-started',
      icon: Home,
      readTime: '12 min read',
      href: '/resources/guides/moving-guide'
    },
    {
      title: 'Red Flags to Avoid',
      description: 'Warning signs and scams to watch out for when choosing providers.',
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
              Electricity Guides & Educational Resources
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Learn everything you need to know about choosing electricity providers, understanding plans, 
              and making informed decisions about your electricity service.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">New to Texas?</h3>
              <p className="text-gray-600 mb-4">
                Moving to Texas and need to choose an electricity provider? Start here for everything you need to know.
              </p>
              <button
                onClick={() => navigate('/resources/guides/moving-guide')}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Texas Moving Guide →
              </button>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Want to Switch?</h3>
              <p className="text-gray-600 mb-4">
                Learn the simple process of switching electricity providers and what to expect during the transition.
              </p>
              <button
                onClick={() => navigate('/resources/guides/how-to-switch-providers')}
                className="text-texas-navy hover:text-texas-navy font-medium"
              >
                Switching Guide →
              </button>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-lg mb-6">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confused by Plans?</h3>
              <p className="text-gray-600 mb-4">
                Understand the differences between fixed, variable, and indexed rate plans to choose wisely.
              </p>
              <button
                onClick={() => navigate('/resources/guides/fixed-vs-variable')}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Plan Types Guide →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}