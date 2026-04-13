import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * CodeBlock Component
 * Syntax-highlighted code block with copy functionality
 * Uses highlight.js from CDN for syntax highlighting
 */
const CodeBlock = ({ language, code, filename }) => {
  const [copied, setCopied] = useState(false);

  // Load highlight.js from CDN on mount
  useEffect(() => {
    if (!window.hljs) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
      script.onload = () => {
        // Load language grammars
        const langs = ['javascript', 'python', 'go', 'bash', 'json', 'http'];
        const langScripts = langs.map(lang => {
          return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${lang}.min.js`;
            s.onload = resolve;
            document.head.appendChild(s);
          });
        });
        Promise.all(langScripts).then(() => {
          window.hljs.initHighlightingOnLoad();
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  // Highlight code when it changes
  useEffect(() => {
    if (window.hljs && code) {
      const blocks = document.querySelectorAll(`[data-code-block-${language}]`);
      blocks.forEach(block => {
        window.hljs.highlightElement(block);
      });
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getLanguageLabel = () => {
    const labels = {
      javascript: 'JavaScript',
      python: 'Python',
      go: 'Go',
      curl: 'cURL',
      bash: 'cURL',
      json: 'JSON',
      http: 'HTTP'
    };
    return labels[language] || language;
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden bg-gray-900 shadow-lg">
      {/* Header bar */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          {filename && (
            <span className="text-xs text-gray-400 font-mono">{filename}</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">{getLanguageLabel()}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code
          data-code-block={language}
          className={`language-${language === 'curl' || language === 'bash' ? 'bash' : language}`}
        >
          {code}
        </code>
      </pre>

      {/* Mobile copy button (if no header) */}
      {!filename && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      )}
    </div>
  );
};

export default CodeBlock;
