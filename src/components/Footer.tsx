import React from 'react';
import { Zap, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const footerLinks = {
    'Compare': [
      { name: 'Compare Providers', href: '/compare/providers' },
      { name: 'Compare Plans', href: '/compare/plans' },
      { name: 'Compare Rates', href: '/compare/rates' },
      { name: 'Top 5 Providers', href: '/compare/providers/top-5' }
    ],
    'Shop': [
      { name: 'Cheapest Electricity', href: '/shop/cheapest-electricity' },
      { name: 'Best Providers', href: '/shop/best-electricity-providers' },
      { name: 'Green Energy', href: '/shop/green-energy' },
      { name: 'No Deposit Plans', href: '/shop/no-deposit-electricity' }
    ],
    'Locations': [
      { name: 'Texas', href: '/texas/electricity-providers' },
      { name: 'Pennsylvania', href: '/pennsylvania/electricity-providers' },
      { name: 'Ohio', href: '/ohio/electricity-providers' },
      { name: 'All States', href: '/locations' }
    ],
    'Resources': [
      { name: 'How to Switch', href: '/resources/guides/how-to-switch-providers' },
      { name: 'Rate Calculator', href: '/rates/calculator' },
      { name: 'Electricity Guide', href: '/resources/guides' },
      { name: 'FAQ', href: '/resources/faqs' }
    ]
  };

  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-8 w-8 text-red-400" />
              <span className="text-xl font-bold">ChooseMyPower</span>
            </div>
            <p className="text-blue-200 mb-6 max-w-md">
              Compare electricity providers, plans, and rates to find the best deal in your area. 
              We help millions of customers save money on their electric bills.
            </p>
            
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>1-800-COMPARE</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@choosemypower.org</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Serving deregulated energy markets nationwide</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => onNavigate(link.href)}
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-blue-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-blue-300 mb-4 md:mb-0">
              © 2024 ChooseMyPower. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <button
                onClick={() => onNavigate('/privacy-policy')}
                className="text-blue-300 hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigate('/terms-of-service')}
                className="text-blue-300 hover:text-white transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => onNavigate('/resources/support/contact')}
                className="text-blue-300 hover:text-white transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}