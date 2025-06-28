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

  return (
    <nav className={`border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button
            className="flex items-center space-x-4 focus:outline-none group"
            onClick={handleLogoClick}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
            aria-label="Go to Dashboard"
          >
            <div className={`w-12 h-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all`}>
              <span className="text-2xl font-extrabold">T</span>
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:underline`}>
              Tailrd
            </span>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`px-5 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  currentPage === page.id
                    ? darkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-900'
                    : darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={{ minWidth: 160 }}
              >
                <span className="mr-3 text-xl align-middle">{page.icon}</span>
                {page.name}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl text-xl transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User Menu */}
            {user && (
              <div className={`flex items-center space-x-3 px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800/70' : 'bg-gray-100/70'} border border-transparent`}>
                <div className={`w-9 h-9 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                  <span className="text-lg font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className={`text-base ml-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
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