import React, { useState } from 'react';
import CodeBlock from './CodeBlock';
import SchemaTable from './SchemaTable';

/**
 * EndpointBlock Component
 * Renders a complete API endpoint documentation block with:
 * - Method badge and path
 * - Description
 * - Request/response schemas
 * - Multi-language code examples with tabs
 */
const EndpointBlock = ({ method, path, description, requestBody, responseExample, codeExamples, queryParams }) => {
  const [activeTab, setActiveTab] = useState('curl');
  const [showRequest, setShowRequest] = useState(true);
  const [showResponse, setShowResponse] = useState(true);

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700'
    };
    return colors[method] || colors.GET;
  };

  const tabs = [
    { id: 'curl', label: 'cURL' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'go', label: 'Go' }
  ];

  return (
    <div className="mb-12">
      {/* Endpoint header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`inline-block px-3 py-1 rounded-md font-mono text-sm font-semibold ${getMethodColor(method)}`}>
          {method}
        </span>
        <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-800">
          {path}
        </code>
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Query parameters */}
      {queryParams && queryParams.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Query Parameters</h4>
          <SchemaTable fields={queryParams.map(p => ({ ...p, required: false }))} />
        </div>
      )}

      {/* Request body schema */}
      {requestBody && requestBody.fields && requestBody.fields.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowRequest(!showRequest)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 hover:text-[#534AB7] transition-colors"
          >
            <span className={`transform transition-transform ${showRequest ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Request Body
          </button>
          {showRequest && <SchemaTable fields={requestBody.fields} />}
        </div>
      )}

      {/* Response example */}
      {responseExample && (
        <div className="mb-6">
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 hover:text-[#534AB7] transition-colors"
          >
            <span className={`transform transition-transform ${showResponse ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Response 200
          </button>
          {showResponse && (
            <CodeBlock language="json" code={JSON.stringify(responseExample, null, 2)} />
          )}
        </div>
      )}

      {/* Code examples with tabs */}
      {codeExamples && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Code Examples</h4>
          
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#534AB7] text-[#534AB7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code content */}
          <CodeBlock
            language={activeTab === 'nodejs' ? 'javascript' : activeTab}
            code={codeExamples[activeTab] || ''}
          />
        </div>
      )}
    </div>
  );
};

export default EndpointBlock;
