import React, { useState } from 'react';
import CodeBlock from './CodeBlock';

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
      GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      POST: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
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
        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono text-gray-800 dark:text-gray-200">
          {path}
        </code>
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Query parameters */}
      {queryParams && queryParams.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Query Parameters</h4>
          <SchemaTable fields={queryParams.map(p => ({ ...p, required: false }))} />
        </div>
      )}

      {/* Request body schema */}
      {requestBody && requestBody.fields && requestBody.fields.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowRequest(!showRequest)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
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
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
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
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Code Examples</h4>
          
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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

// Import SchemaTable locally to avoid circular dependency
const SchemaTable = ({ fields }) => {
  const [expandedRows, setExpandedRows] = useState({});

  if (!fields || fields.length === 0) {
    return null;
  }

  const toggleRow = (fieldName) => {
    setExpandedRows(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const getTypeColor = (type) => {
    const colors = {
      string: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
      number: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
      boolean: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
      object: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
      array: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30',
      integer: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30'
    };
    return colors[type?.toLowerCase()] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 w-1/4">Field</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 w-1/6">Type</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 w-1/6">Required</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const isExpanded = expandedRows[field.name];
            const hasNested = field.nested && field.nested.length > 0;

            return (
              <React.Fragment key={field.name}>
                <tr
                  className={`border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {hasNested && (
                        <button
                          onClick={() => toggleRow(field.name)}
                          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                      <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
                        {field.name}
                      </code>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(field.type)}`}>
                      {field.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {field.required ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Required
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                    {field.description}
                  </td>
                </tr>
                {hasNested && isExpanded && (
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td colSpan={4} className="py-2 px-3 pl-10">
                      <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        <SchemaTable fields={field.nested} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EndpointBlock;
