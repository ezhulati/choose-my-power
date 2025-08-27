import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Clock, HelpCircle, Users } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
    usage: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our electricity experts',
      action: 'Start Chat',
      available: 'Available 24/7',
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our knowledgeable team',
      action: '1-800-CHOOSE-POWER',
      available: 'Mon-Fri 8AM-8PM CT',
      color: 'green'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us your questions and get detailed responses',
      action: 'support@choosemypower.org',
      available: 'Response within 24 hours',
      color: 'purple'
    }
  ];

  const commonTopics = [
    'Help choosing a provider',
    'Understanding my current bill',
    'How to switch providers',
    'Green energy options',
    'Business electricity needs',
    'Moving to a new home',
    'No deposit options',
    'Complaint about a provider'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('/resources')} className="hover:text-blue-600">Resources</button>
            <span className="mx-2">/</span>
            <span>Contact</span>
          </nav>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contact Our Electricity Experts
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Get personalized help choosing electricity providers, understanding plans, and making 
              informed decisions about your electricity service. Our team is here to help.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-${method.color}-100 text-${method.color}-600 rounded-lg mb-6`}>
                <method.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{method.title}</h3>
              <p className="text-gray-600 mb-4">{method.description}</p>
              <div className="font-semibold text-gray-900 mb-2">{method.action}</div>
              <div className="text-sm text-gray-500 mb-4">{method.available}</div>
              <button className={`bg-${method.color}-600 text-white px-6 py-2 rounded-lg hover:bg-${method.color}-700 transition-colors w-full`}>
                {method.title === 'Phone Support' ? 'Call Now' : method.title === 'Email Support' ? 'Send Email' : 'Start Chat'}
              </button>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General Question</option>
                    <option value="choosing">Help Choosing Provider</option>
                    <option value="switching">Switching Providers</option>
                    <option value="billing">Billing Question</option>
                    <option value="complaint">Provider Complaint</option>
                    <option value="business">Business Electricity</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Usage (kWh)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.usage}
                    onChange={(e) => setFormData({...formData, usage: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    placeholder="77001"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us how we can help you with your electricity needs..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Help Topics & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Help Topics</h3>
              <div className="space-y-2">
                {commonTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setFormData({...formData, message: `I need help with: ${topic}`})}
                    className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-blue-900">Response Times</h3>
              </div>
              <div className="space-y-2 text-blue-800">
                <div className="flex justify-between">
                  <span>Live Chat:</span>
                  <span className="font-medium">Immediate</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-medium">Immediate</span>
                </div>
                <div className="flex justify-between">
                  <span>Email/Form:</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Complex Issues:</span>
                  <span className="font-medium">1-2 business days</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-green-900">Our Team</h3>
              </div>
              <p className="text-green-800 text-sm">
                Our customer support team consists of licensed electricity experts who understand 
                the complexities of deregulated energy markets. We're here to provide unbiased 
                guidance to help you make the best decisions for your specific situation.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('/resources/faqs')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Frequently Asked Questions →
                </button>
                <button
                  onClick={() => onNavigate('/resources/guides')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Educational Guides →
                </button>
                <button
                  onClick={() => onNavigate('/rates/calculator')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Rate Calculator →
                </button>
                <button
                  onClick={() => onNavigate('/compare/providers')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Compare Providers →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}