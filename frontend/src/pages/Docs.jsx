import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { docSections, getSectionById, getAdjacentSections } from '@/data/docsContent';
import DocsSidebar from '@/components/docs/DocsSidebar';
import EndpointBlock from '@/components/docs/EndpointBlock';
import CodeBlock from '@/components/docs/CodeBlock';
import OnThisPage from '@/components/docs/OnThisPage';
import TryItPanel from '@/components/docs/TryItPanel';

/**
 * Docs Page
 * Main documentation page with split-pane layout
 */
const Docs = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docs_dark_mode') === 'true' ||
        (!localStorage.getItem('docs_dark_mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const contentRef = useRef(null);
  const currentSectionId = params.section || 'overview';
  const section = getSectionById(currentSectionId);
  const adjacent = getAdjacentSections(currentSectionId);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('docs_dark_mode', String(darkMode));
  }, [darkMode]);

  // Scroll to top on section change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentSectionId]);

  // Handle sections with content.sections (text-based)
  const renderContentSections = (sections) => {
    if (!sections) return null;

    return sections.map((section, index) => (
      <div key={index} className="mb-8">
        {section.heading && (
          <h2
            id={section.heading.toLowerCase().replace(/\s+/g, '-')}
            className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 scroll-mt-24"
          >
            {section.heading}
          </h2>
        )}
        
        {section.content && (
          <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
            {section.content.split('\n').map((line, i) => {
              // Handle table rows
              if (line.includes('|') && line.trim().startsWith('|')) {
                return null; // Tables handled separately
              }
              return <p key={i} className="mb-3">{line}</p>;
            })}
          </div>
        )}

        {section.table && (
          <div className="my-6 overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {section.table.headers.map((header, i) => (
                    <th key={i} className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-3 px-4 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.codeExample && (
          <CodeBlock
            language={section.codeExample.language}
            code={section.codeExample.code}
          />
        )}
      </div>
    ));
  };

  // Render endpoint content (for API reference pages)
  const renderEndpointContent = (content) => {
    if (!content.method) {
      return renderContentSections(content.sections);
    }

    return (
      <>
        <EndpointBlock
          method={content.method}
          path={content.path}
          description={content.description}
          requestBody={content.requestBody}
          responseExample={content.responseExample}
          codeExamples={content.codeExamples}
          queryParams={content.queryParams}
        />

        {/* Try It Panel - shown on desktop for POST/PUT endpoints */}
        {(content.method === 'POST' || content.method === 'PUT') && (
          <div className="hidden lg:block">
            <TryItPanel
              method={content.method}
              path={content.path}
              requestBody={content.requestBody?.fields ? 
                Object.fromEntries(content.requestBody.fields
                  .filter(f => f.required)
                  .map(f => [f.name, f.type === 'number' ? 0 : f.type === 'object' ? {} : '']))
                : {}}
              queryParams={content.queryParams}
            />
          </div>
        )}
      </>
    );
  };

  if (!section) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Section not found</h1>
          <Link to="/docs" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
            Return to documentation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-gray-900 dark:text-white">Decision API</span>
            </Link>
            <span className="hidden sm:inline-block text-sm text-gray-500 dark:text-gray-400">
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <a
              href="https://github.com/decision-api"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left sidebar */}
        <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <Link to="/docs" className="hover:text-gray-700 dark:hover:text-gray-300">
                Docs
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 dark:text-white font-medium">
                {section.title}
              </span>
            </nav>

            {/* Page title */}
            <h1
              ref={contentRef}
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {section.content.title}
            </h1>

            {/* Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {renderEndpointContent(section.content)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              {adjacent.prev ? (
                <Link
                  to={`/docs/${adjacent.prev.id}`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Previous</div>
                    <div className="font-medium">{adjacent.prev.title}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {adjacent.next ? (
                <Link
                  to={`/docs/${adjacent.next.id}`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Next</div>
                    <div className="font-medium">{adjacent.next.title}</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : null}
            </div>
          </div>
        </main>

        {/* Right sidebar - On this page */}
        <OnThisPage contentRef={contentRef} />
      </div>
    </div>
  );
};

export default Docs;
