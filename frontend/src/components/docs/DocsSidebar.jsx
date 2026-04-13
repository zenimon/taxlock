import React, { useState } from 'react';
import { Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { groupedSections } from '@/data/docsContent';

/**
 * DocsSidebar Component
 * Left sidebar navigation with collapsible section groups
 */
const DocsSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const params = useParams();
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(groupedSections));

  // Get current section ID from URL params or hash
  const currentSection = params.section || 'overview';

  const toggleGroup = (group) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const isActive = (sectionId) => {
    return currentSection === sectionId;
  };

  const handleLinkClick = (sectionId) => {
    // Update hash for scroll position
    window.location.hash = sectionId;
    // Close mobile drawer on selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Docs</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
          {Object.entries(groupedSections).map(([group, sections]) => (
            <div key={group} className="mb-6">
              <button
                onClick={() => toggleGroup(group)}
                className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {expandedGroups.includes(group) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {group}
              </button>

              {expandedGroups.includes(group) && (
                <ul className="space-y-1">
                  {sections.map(section => (
                    <li key={section.id}>
                      <Link
                        to={`/docs/${section.id}`}
                        onClick={() => handleLinkClick(section.id)}
                        className={`block px-3 py-2 text-sm rounded-lg transition-all ${
                          isActive(section.id)
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium border-l-2 border-purple-600'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default DocsSidebar;
