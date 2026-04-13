import React, { useState, useEffect, useRef } from 'react';

/**
 * OnThisPage Component
 * Right column anchor navigation that extracts headings from content
 * and highlights the active section as user scrolls
 */
const OnThisPage = ({ contentRef }) => {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  // Extract headings from content on mount and when content changes
  useEffect(() => {
    if (!contentRef?.current) return;

    const elements = contentRef.current.querySelectorAll('h2, h3');
    const headingData = Array.from(elements).map(el => ({
      id: el.id || el.textContent.toLowerCase().replace(/\s+/g, '-'),
      text: el.textContent,
      level: el.tagName.toLowerCase()
    }));

    setHeadings(headingData);

    // Set up intersection observer for active state
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id || entry.target.textContent.toLowerCase().replace(/\s+/g, '-');
            setActiveId(id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [contentRef]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-52 sticky top-24 self-start">
      <nav aria-label="On this page" className="text-sm">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">On this page</h4>
        <ul className="space-y-2 border-l-2 border-gray-200 dark:border-gray-800">
          {headings.map(heading => (
            <li key={heading.id} className={`${heading.level === 'h3' ? 'pl-4' : ''}`}>
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={`block py-1 transition-colors border-l-2 -ml-[2px] ${
                  activeId === heading.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default OnThisPage;
