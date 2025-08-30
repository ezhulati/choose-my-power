import React from 'react';
import { FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface TermsOfServicePageProps {
}

export function TermsOfServicePage({}: TermsOfServicePageProps) {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.navigateToPath) {
      window.navigateToPath(path);
    } else {
      // Fallback for SSR or if script hasn't loaded yet
      window.location.href = path;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-texas-navy">Home</button>
            <span className="mx-2">/</span>
            <span>Terms of Service</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-texas-cream text-texas-navy rounded-lg mb-6">
              <FileText className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
              Here are the ground rules for using our site. We've written them in plain English 
              so you know exactly what to expect when using our services.
            </p>
            <p className="text-sm text-gray-500">Last updated: January 2024</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Points */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Service</h3>
            <p className="text-gray-600 text-sm">Our comparison platform is completely free for consumers to use.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-texas-cream text-texas-navy rounded-lg mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Independent Service</h3>
            <p className="text-gray-600 text-sm">We provide unbiased comparisons and don't favor any particular provider.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Information Only</h3>
            <p className="text-gray-600 text-sm">We provide information to help you decide - final contracts are with providers.</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
            
            <p className="text-gray-600 mb-6">
              By accessing and using ChooseMyPower ("we," "our," or "us"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Our Service</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>Comparison Platform:</strong> We provide a platform to compare electricity providers, plans, and rates. 
              Our service helps you understand your options but does not directly sell electricity or enter into contracts with consumers.</p>
              
              <p><strong>Information Source:</strong> We aggregate publicly available information from electricity providers and 
              regulatory sources. While we strive for accuracy, rates and terms can change frequently.</p>
              
              <p><strong>Independent Service:</strong> We are not owned by or affiliated with any electricity provider. 
              We may receive compensation from providers for referrals, but this does not affect our comparisons or recommendations.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">User Responsibilities</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>Accurate Information:</strong> You agree to provide accurate information when using our calculators 
              and tools. Inaccurate information may lead to incorrect cost estimates.</p>
              
              <p><strong>Verify Information:</strong> You should verify all rates, terms, and conditions directly with 
              electricity providers before signing any contracts. We are not responsible for changes in provider offerings.</p>
              
              <p><strong>Prohibited Uses:</strong> You may not use our service for any unlawful purpose or in any way that 
              could damage, disable, or impair our platform or interfere with others' use of the service.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Disclaimers</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>No Warranties:</strong> Our service is provided "as is" without any warranties. We make no guarantees 
              about the accuracy, completeness, or timeliness of the information provided.</p>
              
              <p><strong>Rate Changes:</strong> Electricity rates and provider terms can change without notice. The information 
              on our platform may not reflect the most current offerings.</p>
              
              <p><strong>Provider Relationships:</strong> We are not responsible for the actions, services, or policies of 
              electricity providers. Your contract and service relationship is directly with the provider you choose.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Limitation of Liability</h2>
            
            <p className="text-gray-600 mb-6">
              To the fullest extent permitted by law, ChooseMyPower shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including without limitation, loss of profits, data, use, 
              goodwill, or other intangible losses, resulting from your use of our service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Provider Compensation</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>Referral Fees:</strong> We may receive compensation from electricity providers when users sign up 
              for service through our platform. This compensation helps us maintain our free service.</p>
              
              <p><strong>No Bias:</strong> Compensation does not influence our comparisons, rankings, or recommendations. 
              We strive to present all available options fairly and transparently.</p>
              
              <p><strong>Disclosure:</strong> We clearly disclose when we receive compensation and maintain editorial independence 
              in our content and recommendations.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Privacy</h2>
            
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our service, 
              to understand our practices regarding the collection and use of your information.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Modifications</h2>
            
            <p className="text-gray-600 mb-6">
              We reserve the right to modify these terms at any time. We will post any changes on this page and update 
              the "Last updated" date. Your continued use of our service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Governing Law</h2>
            
            <p className="text-gray-600 mb-6">
              These terms shall be governed by and construed in accordance with the laws of the State of Texas, 
              without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Information</h2>
            
            <div className="text-gray-600">
              <p className="mb-4">If you have questions about these terms, please contact us:</p>
              <ul className="space-y-2">
                <li>• Email: legal@choosemypower.org</li>
                <li>• Phone: 1-800-CHOOSE-POWER</li>
                <li>• Mail: ChooseMyPower Legal Team, [Address]</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 bg-texas-cream-200 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Questions About These Terms?</h3>
          <p className="text-texas-navy mb-4">Our team is available to clarify any questions about our terms of service.</p>
          <button
            onClick={() => navigate('/resources/support/contact')}
            className="bg-texas-navy text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Contact Legal Team
          </button>
        </div>
      </div>
    </div>
  );
}