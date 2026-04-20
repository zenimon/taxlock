import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';

/**
 * TryItPanel Component
 * Live request playground for testing API endpoints
 */
const TryItPanel = ({ method, path, requestBody: defaultRequestBody, queryParams }) => {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return 'dev-key-001';
    return localStorage.getItem('decision_api_key') || 'dev-key-001';
  });
  const [requestBody, setRequestBody] = useState(defaultRequestBody ? JSON.stringify(defaultRequestBody, null, 2) : '{}');
  const [queryParamValues, setQueryParamValues] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist API key to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('decision_api_key', apiKey);
    }
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
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
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-amber-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Play className="w-4 h-4" />
        Try it out
      </h3>

      {/* API Key input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
          placeholder="dev-key-001"
        />
      </div>

      {/* Query parameters */}
      {queryParams && queryParams.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request body */}
      {(method === 'POST' || method === 'PUT') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request Body (JSON)
          </label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
          />
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#534AB7] hover:bg-[#463f9c] disabled:bg-[#534AB7]/60 text-white rounded-md font-medium transition-colors"
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
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Response</h4>

          {error ? (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error.name}</p>
                <p className="text-sm text-red-600">{error.message}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span className={`font-mono font-semibold ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-500">
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

class TryItPanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('TryItPanel rendering error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            Try It panel failed to render. Reload the page and try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TryItPanelWithBoundary = (props) => (
  <TryItPanelErrorBoundary>
    <TryItPanel {...props} />
  </TryItPanelErrorBoundary>
);

export default TryItPanelWithBoundary;
