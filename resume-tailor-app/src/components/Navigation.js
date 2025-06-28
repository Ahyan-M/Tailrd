import React from 'react';

const Navigation = ({ 
  currentPage, 
  setCurrentPage, 
  darkMode, 
  toggleDarkMode, 
  user, 
  handleSignOut 
}) => {
  const pages = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'resume-optimizer', name: 'Resume Optimizer', icon: '📄' },
    { id: 'job-tracker', name: 'Job Tracker', icon: '📊' }
  ];

  // Handle logo click: go to dashboard and reload
  const handleLogoClick = () => {
    setCurrentPage('dashboard');
    window.location.reload();
  };

  // Get username from user object
  const username = user?.user_metadata?.username || user?.username || user?.email?.split('@')[0] || '';

  return (
    <nav className={`border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <button
            className="flex items-center space-x-2 focus:outline-none group"
            onClick={handleLogoClick}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
            aria-label="Go to Dashboard"
          >
            <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all`}>
              <span className="text-lg font-extrabold">T</span>
            </div>
            <span className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:underline`}>
              Tailrd
            </span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300 ${
                  currentPage === page.id
                    ? darkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-900'
                    : darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={{ minWidth: 100 }}
              >
                <span className="mr-2 text-lg align-middle">{page.icon}</span>
                {page.name}
              </button>
            ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg text-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User Menu */}
            {user && (
              <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-800/70' : 'bg-gray-100/70'} border border-transparent`}>
                <div className={`w-7 h-7 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                  <span className="text-base font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {username}
                </span>
                <button
                  onClick={handleSignOut}
                  className={`text-sm ml-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 