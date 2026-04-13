import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';

/**
 * TryItPanel Component
 * Live request playground for testing API endpoints
 */
const TryItPanel = ({ method, path, requestBody: defaultRequestBody, queryParams }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('decision_api_key') || 'dev-key-001');
  const [requestBody, setRequestBody] = useState(defaultRequestBody ? JSON.stringify(defaultRequestBody, null, 2) : '{}');
  const [queryParamValues, setQueryParamValues] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist API key to localStorage
  useEffect(() => {
    localStorage.setItem('decision_api_key', apiKey);
  }, [apiKey]);

  // Initialize query param values
  useEffect(() => {
    if (queryParams) {
      const initialValues = {};
      queryParams.forEach(param => {
        initialValues[param.name] = param.default || '';
      });
      setQueryParamValues(initialValues);
    }
  }, [queryParams]);

  const buildUrl = () => {
    const baseUrl = 'http://localhost:3000/api/v1';
    let url = `${baseUrl}${path}`;

    if (queryParams && Object.keys(queryParamValues).length > 0) {
      const params = new URLSearchParams();
      Object.entries(queryParamValues).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    return url;
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      const options = {
        method,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      };

      if (method !== 'GET' && method !== 'DELETE') {
        options.body = requestBody;
      }

      const res = await fetch(buildUrl(), options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        duration,
        headers: Object.fromEntries(res.headers.entries())
      });
    } catch (err) {
      setError({
        message: err.message || 'Network error',
        name: err.name
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 400 && status < 500) return 'text-amber-600 dark:text-amber-400';
    if (status >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-8">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Play className="w-4 h-4" />
        Try it out
      </h3>

      {/* API Key input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="dev-key-001"
        />
      </div>

      {/* Query parameters */}
      {queryParams && queryParams.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Query Parameters
          </label>
          <div className="space-y-2">
            {queryParams.map(param => (
              <div key={param.name} className="flex gap-2">
                <input
                  type="text"
                  value={queryParamValues[param.name] || ''}
                  onChange={(e) => setQueryParamValues(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  placeholder={param.name}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request body */}
      {(method === 'POST' || method === 'PUT') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Request Body (JSON)
          </label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md font-medium transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Send Request
          </>
        )}
      </button>

      {/* Response */}
      {(response || error) && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Response</h4>

          {error ? (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error.name}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span className={`font-mono font-semibold ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {response.duration}ms
                </span>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TryItPanel;
