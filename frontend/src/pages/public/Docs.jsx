import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const Docs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'authentication', title: 'Authentication' },
    { id: 'errors', title: 'Errors' },
    { id: 'transactions', title: 'Transactions' },
    { id: 'rules', title: 'Rules' },
    { id: 'simulation', title: 'Simulation' },
    { id: 'webhooks', title: 'Webhooks' },
    { id: 'changelog', title: 'Changelog' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#534AB7] rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Decision API</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <a href="/login" className="text-gray-600 hover:text-gray-900">Sign in</a>
              <Button size="sm">Get Started</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <nav className="sticky top-8 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-[#534AB7] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h1>
              <p className="text-gray-600 mb-8">
                Welcome to the Decision API documentation. This guide will help you integrate our allocation engine into your application.
              </p>

              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Getting Started</h2>
                  <p className="text-gray-600">
                    The Decision API helps you automatically allocate incoming funds across different buckets based on customizable rules.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Base URL</h3>
                  <code className="block bg-gray-100 px-4 py-2 rounded-lg text-sm font-mono">
                    https://api.decisionapi.com/v1
                  </code>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Quick Example</h3>
                  <pre className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg text-sm overflow-x-auto">
{`curl -X POST https://api.decisionapi.com/v1/allocate \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100000,
    "currency": "INR",
    "source": "revenue"
  }'`}
                  </pre>
                </div>
              )}

              {activeSection === 'authentication' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Authentication</h2>
                  <p className="text-gray-600">
                    All API requests require authentication using an API key. Include your API key in the X-API-Key header.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-900">Getting Your API Key</h3>
                  <p className="text-gray-600">
                    After signing up, you'll receive an API key that you can use to authenticate requests. You can regenerate your key at any time from the settings page.
                  </p>
                </div>
              )}

              {activeSection === 'transactions' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Transactions</h2>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono font-semibold">POST</span>
                      <code className="text-sm font-mono">/allocate</code>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Allocate an incoming amount across configured buckets.
                    </p>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Field</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Required</th>
                          <th className="text-left py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 font-mono">amount</td>
                          <td className="py-2">number</td>
                          <td className="py-2"><span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">Yes</span></td>
                          <td className="py-2">Amount to allocate</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 font-mono">currency</td>
                          <td className="py-2">string</td>
                          <td className="py-2"><span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">Yes</span></td>
                          <td className="py-2">Currency code (e.g., INR, USD)</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">source</td>
                          <td className="py-2">string</td>
                          <td className="py-2"><span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">Yes</span></td>
                          <td className="py-2">Source type (e.g., revenue, refund)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Placeholder for other sections */}
              {!['overview', 'authentication', 'transactions'].includes(activeSection) && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Documentation for this section is coming soon.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Docs;
