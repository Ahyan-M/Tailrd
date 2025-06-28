import React from 'react';

const JobTracker = ({
  user,
  darkMode,
  jobApplications,
  dashboardLoading,
  fetchJobApplications,
  updateApplicationStatus,
  deleteApplication
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Job Applications Tracker 📊
        </h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Track and manage all your job applications in one place
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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

      {/* Applications List */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 shadow-sm`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            All Applications
          </h2>
          <button
            onClick={fetchJobApplications}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
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
        ) : jobApplications.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg mb-2">No applications yet</p>
            <p>Optimize a resume to start tracking your applications!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobApplications.map((app) => (
              <div key={app.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.job_title} at {app.company_name}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={app.status || 'applied'}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        app.status === 'offered' ? 'bg-green-100 text-green-800' :
                        app.status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Original ATS Score</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.original_ats_score}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Optimized ATS Score</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.optimized_ats_score}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Improvement</p>
                    <p className={`text-2xl font-bold ${app.ats_improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {app.ats_improvement > 0 ? '+' : ''}{app.ats_improvement}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTracker; 