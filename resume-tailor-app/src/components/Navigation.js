import React, { useState, useRef } from 'react';
import { ReactComponent as TailrdIcon } from '../assets/icons/TailrdIcon.svg';

const Navigation = ({ 
  currentPage, 
  setCurrentPage, 
  darkMode, 
  toggleDarkMode, 
  user, 
  handleSignOut 
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pages = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'resume-optimizer', name: 'Resume Optimizer' },
    { id: 'job-tracker', name: 'Job Tracker' }
  ];

  // Handle logo click: go to dashboard and reload
  const handleLogoClick = () => {
    setCurrentPage('dashboard');
    window.location.reload();
  };

  // Get username from user object
  const username = user?.user_metadata?.username || user?.username || user?.email?.split('@')[0] || '';

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`border-b ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}> 
      <div className="max-w-full mx-auto px-8 sm:px-16 lg:px-32">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            className="flex items-center space-x-2 focus:outline-none"
            onClick={handleLogoClick}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
            aria-label="Go to Dashboard"
          >
            <div className={`w-8 h-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} rounded flex items-center justify-center`}>
              <TailrdIcon className="w-6 h-6" />
            </div>
            <span className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tailrd</span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`px-3 py-1 text-base font-medium border-b-2 transition-all duration-200 ${
                  currentPage === page.id
                    ? darkMode 
                      ? 'border-blue-400 text-white' 
                      : 'border-blue-600 text-gray-900'
                    : 'border-transparent ' + (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                }`}
                style={{ background: 'none', borderRadius: 0 }}
              >
                {page.name}
              </button>
            ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`ml-6 p-2 rounded transition-colors duration-200 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                // Sun icon
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                // Moon icon
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
              )}
            </button>

            {/* User Menu Dropdown */}
            {user && (
              <div className="relative ml-8" ref={dropdownRef}>
                <button
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full focus:outline-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  <div className={`w-7 h-7 ${darkMode ? 'bg-gray-900' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                    <span className="text-base font-bold">{username.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</span>
                  <svg className="ml-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {dropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <button
                      onClick={handleSignOut}
                      className={`block w-full text-left px-4 py-3 text-sm rounded-lg transition-colors duration-200 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Add a gap below nav */}
      <div className="h-4" />
    </nav>
  );
};

export default Navigation; 