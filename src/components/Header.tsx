import React, { useState } from 'react';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onNavigate: (path: string) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  dropdown?: Array<{ name: string; href: string }>;
}

export function Header({ onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigation = [
    {
      name: 'Compare',
      href: '/compare',
      dropdown: [
        { name: 'Find Your Provider', href: '/compare/providers' },
        { name: 'Browse Plans', href: '/compare/plans' },
        { name: 'Check Rates', href: '/compare/rates' },
        { name: 'Top-Rated Options', href: '/compare/providers/top-5' }
      ]
    },
    {
      name: 'Browse',
      href: '/browse',
      dropdown: [
        { name: 'Energy Companies', href: '/electricity-companies' },
        { name: 'Available Plans', href: '/electricity-plans' },
        { name: 'Top Choices', href: '/best' },
        { name: 'Featured Options', href: '/providers' }
      ]
    },
    { name: 'Rates', href: '/rates' },
    {
      name: 'Shop',
      href: '/shop',
      dropdown: [
        { name: 'Budget-Friendly', href: '/shop/cheapest-electricity' },
        { name: 'Trusted Companies', href: '/shop/best-electricity-providers' },
        { name: 'Green Energy', href: '/shop/green-energy' },
        { name: 'No Deposit Required', href: '/shop/no-deposit-electricity' }
      ]
    },
    { name: 'Areas We Serve', href: '/locations' },
    { name: 'Help & Guides', href: '/resources' }
  ];

  const handleNavClick = (item: NavigationItem) => {
    if (item.dropdown) {
      setActiveDropdown(activeDropdown === item.name ? null : item.name);
    } else {
      onNavigate(item.href);
      setActiveDropdown(null);
    }
  };

  const handleMouseEnter = (itemName: string) => {
    setActiveDropdown(itemName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const handleDropdownClick = (href: string) => {
    onNavigate(href);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center space-x-2 text-texas-navy hover:text-texas-navy transition-colors"
            >
              <Zap className="h-8 w-8" />
              <span className="text-xl font-bold text-texas-navy">ChooseMyPower</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.dropdown && handleMouseEnter(item.name)}
                onMouseLeave={() => item.dropdown && handleMouseLeave()}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-texas-navy px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-texas-cream-200"
                >
                  <span>{item.name}</span>
                  {item.dropdown && <ChevronDown className="h-4 w-4" />}
                </button>
                
                {item.dropdown && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-dropdown-menu">
                    {item.dropdown.map((dropdownItem) => (
                      <button
                        key={dropdownItem.name}
                        onClick={() => handleDropdownClick(dropdownItem.href)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-texas-cream-200 hover:text-texas-navy transition-colors"
                      >
                        {dropdownItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-texas-navy p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white mobile-menu z-mobile-side-menu">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-texas-navy hover:bg-texas-cream-200 rounded-md transition-colors"
                  >
                    <span>{item.name}</span>
                    {item.dropdown && (
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </button>
                  
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="ml-4 space-y-1 mt-1">
                      {item.dropdown.map((dropdownItem) => (
                        <button
                          key={dropdownItem.name}
                          onClick={() => handleDropdownClick(dropdownItem.href)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-texas-navy hover:bg-texas-cream-200 rounded-md transition-colors"
                        >
                          {dropdownItem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
