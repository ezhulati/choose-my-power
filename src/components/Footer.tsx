import React from 'react';
import { Zap, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const footerLinks = {
    'Compare': [
      { name: 'Find Your Provider', href: '/compare/providers' },
      { name: 'Browse Plans', href: '/compare/plans' },
      { name: 'Check Rates', href: '/compare/rates' },
      { name: 'Top-Rated Options', href: '/compare/providers/top-5' }
    ],
    'Shop': [
      { name: 'Budget-Friendly Options', href: '/shop/cheapest-electricity' },
      { name: 'Trusted Companies', href: '/shop/best-electricity-providers' },
      { name: 'Green Energy Plans', href: '/shop/green-energy' },
      { name: 'No Deposit Required', href: '/shop/no-deposit-electricity' }
    ],
    'Locations': [
      { name: 'Texas Areas', href: '/texas/electricity-providers' },
      { name: 'Pennsylvania Areas', href: '/pennsylvania/electricity-providers' },
      { name: 'Ohio Areas', href: '/ohio/electricity-providers' },
      { name: 'All Areas We Serve', href: '/locations' }
    ],
    'Resources': [
      { name: 'How to Switch', href: '/resources/guides/how-to-switch-providers' },
      { name: 'Rate Calculator', href: '/rates/calculator' },
      { name: 'Energy Guides', href: '/resources/guides' },
      { name: 'Common Questions', href: '/resources/faqs' }
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
              Your friendly Texas electricity shopping guide. We help you compare plans and 
              find the right fit for your home and budget - no tricks, just honest comparisons.
            </p>
            
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>Questions? Give us a call</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@choosemypower.org</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Proudly serving Texas communities</span>
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