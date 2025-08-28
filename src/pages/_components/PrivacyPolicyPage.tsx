import React from 'react';
import { Shield, Eye, Lock, Users } from 'lucide-react';

// Extend Window interface to include our navigation function
declare global {
  interface Window {
    navigateToPath: (path: string) => void;
  }
}

interface PrivacyPolicyPageProps {
}

export function PrivacyPolicyPage({}: PrivacyPolicyPageProps) {
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
            <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <span>Privacy Policy</span>
          </nav>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg mb-6">
              <Shield className="h-8 w-8" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparent Collection</h3>
            <p className="text-gray-600 text-sm">We only collect information necessary to help you compare electricity options.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Storage</h3>
            <p className="text-gray-600 text-sm">Your data is protected with industry-standard security measures.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sale of Data</h3>
            <p className="text-gray-600 text-sm">We never sell your personal information to third parties.</p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Information You Provide</h3>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>• ZIP code and location information to show relevant providers</li>
              <li>• Contact information when you request support or sign up for alerts</li>
              <li>• Usage information to provide accurate cost calculations</li>
              <li>• Preferences for plan types and features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect Automatically</h3>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>• Pages you visit and links you click to improve our service</li>
              <li>• Device and browser information for technical support</li>
              <li>• IP address and general location for regional content</li>
              <li>• Cookies and similar technologies for site functionality</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>To Provide Our Service:</strong> We use your location and usage information to show you relevant electricity providers and accurate cost comparisons.</p>
              
              <p><strong>To Improve Our Platform:</strong> We analyze usage patterns to improve our comparison tools and add helpful features.</p>
              
              <p><strong>To Communicate With You:</strong> We may send you rate alerts, market updates, or respond to your support requests if you've opted in.</p>
              
              <p><strong>To Ensure Security:</strong> We monitor for fraud and abuse to protect our users and maintain service quality.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information Sharing</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>With Electricity Providers:</strong> If you choose to contact a provider through our platform, we may share your contact information and preferences to help them serve you better.</p>
              
              <p><strong>With Service Providers:</strong> We work with trusted third parties who help us operate our platform (hosting, analytics, customer support). They're contractually required to protect your data.</p>
              
              <p><strong>For Legal Compliance:</strong> We may disclose information if required by law, court order, or to protect our legal rights.</p>
              
              <p><strong>Business Transfers:</strong> If our company is acquired or merged, your information may be transferred as part of that transaction.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights and Choices</h2>
            
            <div className="text-gray-600 space-y-4 mb-6">
              <p><strong>Access and Correction:</strong> You can request to see what information we have about you and ask us to correct any inaccuracies.</p>
              
              <p><strong>Deletion:</strong> You can ask us to delete your personal information, subject to legal and operational requirements.</p>
              
              <p><strong>Marketing Communications:</strong> You can opt out of marketing emails at any time using the unsubscribe link or by contacting us.</p>
              
              <p><strong>Cookies:</strong> You can control cookies through your browser settings, though this may affect site functionality.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
            
            <p className="text-gray-600 mb-6">
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, 
              regular security assessments, and limiting access to your information to authorized personnel only.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Children's Privacy</h2>
            
            <p className="text-gray-600 mb-6">
              Our service is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to This Policy</h2>
            
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We'll notify you of any material changes 
              by posting the new policy on this page and updating the "Last updated" date. We encourage you 
              to review this policy periodically.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
            
            <div className="text-gray-600">
              <p className="mb-4">If you have questions about this privacy policy or our data practices, please contact us:</p>
              <ul className="space-y-2">
                <li>• Email: privacy@choosemypower.org</li>
                <li>• Phone: 1-800-CHOOSE-POWER</li>
                <li>• Mail: ChooseMyPower Privacy Team, [Address]</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Questions About Your Privacy?</h3>
          <p className="text-blue-800 mb-4">We're committed to transparency. Contact us with any privacy concerns.</p>
          <button
            onClick={() => navigate('/resources/support/contact')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Privacy Team
          </button>
        </div>
      </div>
    </div>
  );
}