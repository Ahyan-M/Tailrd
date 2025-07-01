import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent as ToDoAltIcon } from '../assets/icons/to-do-alt.svg';
import { ReactComponent as BullseyeArrowIcon } from '../assets/icons/bullseye-arrow.svg';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/check-circle.svg';
import { ReactComponent as ScriptIcon } from '../assets/icons/script.svg';
import { ReactComponent as ChartLineUpIcon } from '../assets/icons/chart-line-up.svg';
import { ReactComponent as BriefcaseIcon } from '../assets/icons/briefcase.svg';
import { ReactComponent as BoltIcon } from '../assets/icons/bolt.svg';
import Toast from '../components/Toast';

const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'bg-gray-100 text-gray-700' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-blue-100 text-blue-700' },
  { value: 'offered', label: 'Offered', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-200 text-gray-500' },
];

const JobTracker = ({
  user,
  darkMode,
  jobApplications,
  dashboardLoading,
  fetchJobApplications,
  updateApplicationStatus,
  deleteApplication
}) => {
  const hasFetched = useRef(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Automatically fetch job applications when component mounts
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchJobApplications();
    }
  }, [user]);

  // Toast helpers
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };
  const closeToast = () => setToast({ ...toast, show: false });

  // Wrap status update with toast
  const handleStatusUpdate = async (id, value) => {
    try {
      await updateApplicationStatus(id, value);
      showToast('Status updated!', 'success');
    } catch (e) {
      showToast('Something went wrong.', 'error');
    }
  };

  // Wrap delete with toast
  const handleDelete = async (id) => {
    try {
      await deleteApplication(id);
      showToast('Application deleted.', 'info');
    } catch (e) {
      showToast('Something went wrong.', 'error');
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="w-full text-left mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Job Applications</h1>
          <p className="text-base text-gray-500">Minimal tracker for your job search progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8">
          <div className="rounded-xl p-4 bg-white shadow-sm flex flex-col items-center">
            <div className="text-lg font-bold text-gray-900">{jobApplications.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="rounded-xl p-4 bg-white shadow-sm flex flex-col items-center">
            <div className="text-lg font-bold text-gray-900">{jobApplications.filter(app => app.status === 'interviewing').length}</div>
            <div className="text-xs text-gray-400">Interviewing</div>
          </div>
          <div className="rounded-xl p-4 bg-white shadow-sm flex flex-col items-center">
            <div className="text-lg font-bold text-gray-900">{jobApplications.filter(app => app.status === 'offered').length}</div>
            <div className="text-xs text-gray-400">Offers</div>
          </div>
          <div className="rounded-xl p-4 bg-white shadow-sm flex flex-col items-center">
            <div className="text-lg font-bold text-gray-900">{jobApplications.length > 0 ? Math.round(jobApplications.reduce((sum, app) => sum + app.optimized_ats_score, 0) / jobApplications.length) : 0}%</div>
            <div className="text-xs text-gray-400">Avg ATS</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="w-full flex flex-row items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">All Applications</h2>
          <button
            onClick={fetchJobApplications}
            className="px-3 py-1 rounded-lg font-medium bg-white border border-gray-200 text-gray-500 hover:shadow transition-all duration-200"
          >
            Refresh
          </button>
        </div>

        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : jobApplications.length === 0 ? (
          <div className="mx-auto rounded-2xl border bg-white/80 border-gray-200 text-center shadow-sm" style={{ width: '100%', minHeight: '220px', padding: '2.5rem', margin: '0 auto' }}>
            <div className="flex flex-col items-center">
              <p className="text-base font-semibold mb-1">No applications yet</p>
              <p className="text-sm text-gray-500">Optimize a resume to start tracking your applications!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 w-full">
            {jobApplications.map((app) => {
              const statusObj = statusOptions.find(opt => opt.value === (app.status || 'applied')) || statusOptions[0];
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 gap-4 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg border border-transparent hover:border-blue-100"
                  style={{ minHeight: '100px' }}
                >
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 text-left">
                    <div className="flex flex-col flex-1">
                      <span className="text-lg font-bold text-gray-900 leading-tight">{app.job_title}</span>
                      <span className="text-base font-semibold text-gray-700">{app.company_name}</span>
                      <span className="text-xs text-gray-400 font-light">Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-row gap-6 mt-2 sm:mt-0">
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-gray-400">Original ATS</span>
                        <span className="text-base font-semibold text-gray-700">{app.original_ats_score}%</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-gray-400">Optimized ATS</span>
                        <span className="text-base font-semibold text-gray-700">{app.optimized_ats_score}%</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-gray-400">Improvement</span>
                        <span className={`text-base font-semibold ${app.ats_improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>{app.ats_improvement > 0 ? '+' : ''}{app.ats_improvement}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 mt-2 sm:mt-0">
                    <div className={`flex items-center rounded-lg px-2 py-1 text-sm font-medium ${statusObj.color} transition-all duration-200`}
                      style={{ minWidth: '120px' }}
                    >
                      <select
                        value={app.status || 'applied'}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        className="bg-transparent outline-none border-none text-inherit font-medium w-full cursor-pointer focus:ring-0 focus:outline-none hover:bg-blue-50 transition-all duration-200"
                        style={{ minWidth: '80px' }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="ml-2 p-2 rounded-full hover:bg-red-50 transition-colors duration-200 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </>
  );
};

export default JobTracker;