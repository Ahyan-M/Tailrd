import React from 'react';

const Dashboard = ({ 
  user, 
  darkMode, 
  jobApplications, 
  dashboardLoading, 
  fetchJobApplications,
  setCurrentPage
}) => {
  const recentApplications = jobApplications.slice(0, 3);
  
  const quickActions = [
    {
      title: "Optimize Resume",
      description: "Upload and optimize your resume",
      icon: "📄",
      action: () => {
        setCurrentPage('resume-optimizer');
      }
    },
    {
      title: "View Applications",
      description: "Track your job applications",
      icon: "📊",
      action: () => {
        setCurrentPage('job-tracker');
      }
    },
    {
      title: "ATS Guide",
      description: "Learn about ATS optimization",
      icon: "📚",
      action: () => {
        // Could open help modal or navigate to guide page
      }
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Ready to optimize your resume and land your dream job?
            </p>
          </div>
          <div className={`w-16 h-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center shadow-lg`}>
            <span className="text-2xl">T</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 border ${
                darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="relative z-10">
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {action.title}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Applications
          </h2>
          <button
            onClick={fetchJobApplications}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Refresh
          </button>
        </div>

        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : recentApplications.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg mb-2">No applications yet</p>
            <p>Upload your first resume to get started!</p>
            <button
              onClick={() => {
                setCurrentPage('resume-optimizer');
              }}
              className="mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentApplications.map((app) => (
              <div key={app.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.job_title}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {app.company_name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'offered' ? 'bg-green-100 text-green-800' :
                    app.status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ATS Score</p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.optimized_ats_score}%
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Improvement</p>
                    <p className={`text-xl font-bold ${app.ats_improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {app.ats_improvement > 0 ? '+' : ''}{app.ats_improvement}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-2xl mb-2">📊</div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Applications
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-2xl mb-2">🎯</div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.filter(app => app.status === 'interviewing').length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            In Progress
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-2xl mb-2">✅</div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.filter(app => app.status === 'offered').length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Offers Received
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-2xl mb-2">📈</div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.length > 0 ? Math.round(jobApplications.reduce((sum, app) => sum + app.optimized_ats_score, 0) / jobApplications.length) : 0}%
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Avg ATS Score
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 