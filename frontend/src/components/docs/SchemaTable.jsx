import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * SchemaTable Component
 * Displays request/response field schemas in a clean table format
 */
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
      integer: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
      date: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30'
    };
    return colors[type?.toLowerCase()] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className="my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-1/4">Field</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-1/6">Type</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-1/6">Required</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const isExpanded = expandedRows[field.name];
            const hasNested = field.nested && field.nested.length > 0;

            return (
              <React.Fragment key={field.name}>
                <tr
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {hasNested && (
                        <button
                          onClick={() => toggleRow(field.name)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                      <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
                        {field.name}
                      </code>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(field.type)}`}>
                      {field.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {field.required ? (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Required
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {field.description}
                  </td>
                </tr>

                {/* Nested fields */}
                {hasNested && isExpanded && (
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td colSpan={4} className="py-2 px-4 pl-12">
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

export default SchemaTable;
