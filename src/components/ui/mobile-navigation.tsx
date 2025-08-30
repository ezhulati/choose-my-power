import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ChevronRight, Home, Search, MapPin, Calculator, BookOpen } from 'lucide-react';
import { Button } from './button';
import { Z_INDEX, zIndexClass } from '../../lib/design-system/z-index-scale';
import { cn } from '../../lib/utils';

interface MobileNavigationProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: Array<{ name: string; href: string; description?: string }>;
}

export function MobileNavigation({ onNavigate, currentPath = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationItems: NavigationItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Compare',
      href: '/compare',
      icon: Search,
      children: [
        { name: 'Compare Providers', href: '/compare/providers', description: 'See them side-by-side' },
        { name: 'Compare Plans', href: '/compare/plans', description: 'Features and prices' },
        { name: 'Compare Rates', href: '/compare/rates', description: 'Calculate your cost' },
        { name: 'Top 5 Providers', href: '/compare/providers/top-5', description: 'Our best picks' }
      ]
    },
    {
      name: 'Browse',
      href: '/browse',
      icon: BookOpen,
      children: [
        { name: 'Electricity Companies', href: '/electricity-companies', description: 'Who we recommend' },
        { name: 'Electricity Plans', href: '/electricity-plans', description: 'All your options' },
        { name: 'Best Rankings', href: '/best', description: 'Top picks' },
        { name: 'Our Providers', href: '/providers', description: 'Full list' }
      ]
    },
    {
      name: 'Rates',
      href: '/rates',
      icon: Calculator,
    },
    {
      name: 'Locations',
      href: '/locations',
      icon: MapPin,
    },
    {
      name: 'Resources',
      href: '/resources',
      icon: BookOpen,
    }
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleNavigate = (href: string) => {
    onNavigate(href);
    setIsOpen(false);
    setExpandedSection(null);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  const isActiveLink = (href: string) => {
    return currentPath === href || (href !== '/' && currentPath.startsWith(href));
  };

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <Button
        variant="ghost"
        size="default"
        onClick={() => setIsOpen(true)}
        className={cn(
          "md:hidden text-gray-700 hover:text-texas-navy p-3 min-h-[48px] min-w-[48px] touch-manipulation",
          zIndexClass('MOBILE_NAV_TOGGLE')
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={cn(
              "fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300",
              zIndexClass('MOBILE_MENU_OVERLAY')
            )}
            onClick={() => setIsOpen(false)}
          />

          {/* Sliding Menu Panel */}
          <div 
            className={cn(
              "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out",
              zIndexClass('MOBILE_SIDE_MENU'),
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-texas-navy to-texas-red-600">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-texas-navy font-bold text-xl">⚡</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">ChooseMyPower</h2>
                  <p className="text-blue-100 text-sm">Find Your Perfect Plan</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="default"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 hover:text-white p-3 min-h-[48px] min-w-[48px] touch-manipulation"
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        onClick={() => item.children ? toggleSection(item.name) : handleNavigate(item.href)}
                        className={cn(
                          "flex-1 justify-start text-left p-4 min-h-[48px] touch-manipulation",
                          isActiveLink(item.href) 
                            ? "bg-texas-navy text-white hover:bg-texas-navy hover:bg-opacity-90 hover:text-white" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        <span className="font-medium">{item.name}</span>
                      </Button>
                      
                      {item.children && (
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={() => toggleSection(item.name)}
                          className="p-3 min-h-[48px] min-w-[48px] text-gray-500 hover:text-gray-700 touch-manipulation"
                        >
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              expandedSection === item.name ? "rotate-180" : ""
                            )} 
                          />
                        </Button>
                      )}
                    </div>
                    
                    {/* Submenu */}
                    {item.children && expandedSection === item.name && (
                      <div className="ml-8 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.children.map((child) => (
                          <Button
                            key={child.name}
                            variant="ghost"
                            onClick={() => handleNavigate(child.href)}
                            className={cn(
                              "w-full justify-start text-left p-4 min-h-[48px] touch-manipulation",
                              isActiveLink(child.href)
                                ? "bg-texas-cream-200 text-texas-navy border-l-4 border-texas-navy"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-sm">{child.name}</span>
                              {child.description && (
                                <span className="text-xs text-gray-500 mt-1">{child.description}</span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Menu Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Need help choosing?</p>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleNavigate('/contact')}
                  className="w-full min-h-[48px] touch-manipulation"
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}