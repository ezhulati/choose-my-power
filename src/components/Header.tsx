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
        { name: 'Compare Providers', href: '/compare/providers' },
        { name: 'Compare Plans', href: '/compare/plans' },
        { name: 'Compare Rates', href: '/compare/rates' },
        { name: 'Top 5 Providers', href: '/compare/providers/top-5' }
      ]
    },
    {
      name: 'Browse',
      href: '/browse',
      dropdown: [
        { name: 'Electricity Companies', href: '/electricity-companies' },
        { name: 'Electricity Plans', href: '/electricity-plans' },
        { name: 'Best Rankings', href: '/best' },
        { name: 'All Providers', href: '/providers' }
      ]
    },
    { name: 'Rates', href: '/rates' },
    {
      name: 'Shop',
      href: '/shop',
      dropdown: [
        { name: 'Cheapest Electricity', href: '/shop/cheapest-electricity' },
        { name: 'Best Providers', href: '/shop/best-electricity-providers' },
        { name: 'Green Energy', href: '/shop/green-energy' },
        { name: 'No Deposit Plans', href: '/shop/no-deposit-electricity' }
      ]
    },
    { name: 'Locations', href: '/locations' },
    { name: 'Resources', href: '/resources' }
  ];

  const handleNavClick = (item: NavigationItem) => {
    if (item.dropdown) {
      setActiveDropdown(activeDropdown === item.name ? null : item.name);
    } else {
      onNavigate(item.href);
      setActiveDropdown(null);
    }
  };

  const handleDropdownClick = (href: string) => {
    onNavigate(href);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Zap className="h-8 w-8" />
              <span className="text-xl font-bold text-blue-800">ChooseMyPower</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-blue-50"
                >
                  <span>{item.name}</span>
                  {item.dropdown && <ChevronDown className="h-4 w-4" />}
                </button>
                
                {item.dropdown && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    {item.dropdown.map((dropdownItem) => (
                      <button
                        key={dropdownItem.name}
                        onClick={() => handleDropdownClick(dropdownItem.href)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
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
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
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