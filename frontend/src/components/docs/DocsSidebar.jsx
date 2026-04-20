import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { groupedSections } from '@/data/docsContent';

/**
 * DocsSidebar Component
 * Left sidebar navigation with collapsible section groups
 */
const DocsSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(groupedSections));

  const currentSection = location.pathname.replace(/^\/docs\/?/, '') || 'overview';

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

  const handleLinkClick = () => {
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
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Docs</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
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
                        className={`block px-3 py-2 text-sm rounded-lg transition-all ${isActive(section.id)
                            ? 'bg-[#534AB7]/10 text-[#534AB7] font-medium border-l-2 border-[#534AB7]'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
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
