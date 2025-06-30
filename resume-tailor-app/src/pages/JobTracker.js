import React, { useEffect } from 'react';
import { ReactComponent as ToDoAltIcon } from '../assets/icons/to-do-alt.svg';
import { ReactComponent as BullseyeArrowIcon } from '../assets/icons/bullseye-arrow.svg';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/check-circle.svg';
import { ReactComponent as ScriptIcon } from '../assets/icons/script.svg';
import { ReactComponent as ChartLineUpIcon } from '../assets/icons/chart-line-up.svg';

const JobTracker = ({
  user,
  darkMode,
  jobApplications,
  dashboardLoading,
  fetchJobApplications,
  updateApplicationStatus,
  deleteApplication
}) => {
  // Automatically fetch job applications when component mounts
  useEffect(() => {
    if (user) {
      fetchJobApplications();
    }
  }, [user, fetchJobApplications]);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Job Applications Tracker
        </h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Track and manage all your job applications in one place
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-center text-2xl mb-2"><ToDoAltIcon width={32} height={32} /></div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Applications
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-center text-2xl mb-2"><BullseyeArrowIcon width={32} height={32} /></div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.filter(app => app.status === 'interviewing').length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            In Progress
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-center text-2xl mb-2"><CheckCircleIcon width={32} height={32} /></div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.filter(app => app.status === 'offered').length}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Offers Received
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-center text-2xl mb-2"><ChartLineUpIcon width={32} height={32} /></div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {jobApplications.length > 0 ? Math.round(jobApplications.reduce((sum, app) => sum + app.optimized_ats_score, 0) / jobApplications.length) : 0}%
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Avg ATS Score
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Applications</h2>
        <button
          onClick={fetchJobApplications}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 mt-2 sm:mt-0 sm:ml-4 ${
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
        <div className={`mx-auto rounded-2xl border ${darkMode ? 'bg-white/5 border-gray-700' : 'bg-white border-gray-200'} text-center shadow-sm`} style={{ width: '900px', minHeight: '340px', padding: '3.5rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="mb-4">
              <ScriptIcon width={64} height={64} />
            </div>
            <p className="text-lg font-semibold mb-2">No applications yet</p>
            <p className="mb-2">Optimize a resume to start tracking your applications!</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto rounded-2xl border text-center shadow-sm" style={{ width: '900px', minHeight: '340px', padding: '3.5rem', margin: '0 auto' }}>
          <div className="flex flex-col gap-6 w-full">
            {jobApplications.map((app) => (
              <div key={app.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between px-10 py-8 w-full`} style={{ minHeight: '120px' }}>
                <div className="flex-1 text-left mb-4 md:mb-0">
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.job_title} at {app.company_name}</h3>
                  <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div>
                    <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Original ATS Score</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.original_ats_score}%</p>
                  </div>
                  <div>
                    <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Optimized ATS Score</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.optimized_ats_score}%</p>
                  </div>
                  <div>
                    <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Improvement</p>
                    <p className={`text-2xl font-bold ${app.ats_improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>{app.ats_improvement > 0 ? '+' : ''}{app.ats_improvement}%</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={app.status || 'applied'}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className={`px-4 py-2 rounded-lg text-base font-medium ${
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
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTracker; 