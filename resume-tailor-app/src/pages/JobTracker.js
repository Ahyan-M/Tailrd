import React, { useEffect, useRef, useState } from 'react';
import Toast from '../components/Toast';
import StatusDropdown from '../components/StatusDropdown';

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

  // Filter and sort state
  const [filters, setFilters] = useState({
    status: '',
    atsScoreMin: '',
    companyName: '',
    appliedDate: '',
  });

  const [sortBy, setSortBy] = useState({
    field: '',
    direction: 'asc',
  });

  // Automatically fetch job applications when component mounts
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchJobApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // showToast('Application deleted.', 'info'); // Removed to avoid duplicate notification
    } catch (e) {
      showToast('Something went wrong.', 'error');
    }
  };

  // Filter and sort functions
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      atsScoreMin: '',
      companyName: '',
      appliedDate: '',
    });
    setSortBy({
      field: '',
      direction: 'asc',
    });
  };

  // Apply filters and sorting
  const filteredAndSortedApplications = jobApplications
    .filter(app => {
      // Status filter
      if (filters.status && app.status !== filters.status) return false;
      
      // ATS score filter
      if (filters.atsScoreMin && app.optimized_ats_score < parseInt(filters.atsScoreMin)) return false;
      
      // Company name filter
      if (filters.companyName && !app.company_name.toLowerCase().includes(filters.companyName.toLowerCase())) return false;
      
      // Applied date filter
      if (filters.appliedDate) {
        const appDate = new Date(app.created_at);
        const filterDate = new Date();
        
        switch (filters.appliedDate) {
          case 'latest':
            // Show applications from last 7 days
            filterDate.setDate(filterDate.getDate() - 7);
            if (appDate < filterDate) return false;
            break;
          case 'oldest':
            // Show applications older than 30 days
            filterDate.setDate(filterDate.getDate() - 30);
            if (appDate > filterDate) return false;
            break;
          default:
            break;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (!sortBy.field) return 0;
      
      let aValue, bValue;
      
      switch (sortBy.field) {
        case 'improvement':
          aValue = a.ats_improvement;
          bValue = b.ats_improvement;
          break;
        case 'originalAts':
          aValue = a.original_ats_score;
          bValue = b.original_ats_score;
          break;
        case 'jobTitle':
          aValue = a.job_title.toLowerCase();
          bValue = b.job_title.toLowerCase();
          break;
        case 'companyName':
          aValue = a.company_name.toLowerCase();
          bValue = b.company_name.toLowerCase();
          break;
        case 'appliedDate':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }
      
      if (sortBy.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '') || sortBy.field !== '';

  return (
    <>
      <div className="max-w-6xl w-full mx-auto p-4 md:p-8 min-h-screen">
        {/* Header */}
        <div className="w-full text-left mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Job Applications</h1>
          <p className="text-sm md:text-base text-gray-500">Track and manage your job search progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
          <div className="rounded-lg p-3 md:p-4 bg-white shadow flex flex-col items-center border border-gray-100">
            <div className="text-lg md:text-xl font-bold text-gray-900">{jobApplications.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="rounded-lg p-3 md:p-4 bg-white shadow flex flex-col items-center border border-gray-100">
            <div className="text-lg md:text-xl font-bold text-gray-900">{jobApplications.filter(app => app.status === 'interviewing').length}</div>
            <div className="text-xs text-gray-400">Interviewing</div>
          </div>
          <div className="rounded-lg p-3 md:p-4 bg-white shadow flex flex-col items-center border border-gray-100">
            <div className="text-lg md:text-xl font-bold text-gray-900">{jobApplications.filter(app => app.status === 'offered').length}</div>
            <div className="text-xs text-gray-400">Offers</div>
          </div>
          <div className="rounded-lg p-3 md:p-4 bg-white shadow flex flex-col items-center border border-gray-100">
            <div className="text-lg md:text-xl font-bold text-gray-900">{jobApplications.length > 0 ? Math.round(jobApplications.reduce((sum, app) => sum + app.optimized_ats_score, 0) / jobApplications.length) : 0}%</div>
            <div className="text-xs text-gray-400">Avg ATS</div>
          </div>
        </div>

        {/* Integrated Applications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Applications Header with Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">{hasActiveFilters ? 'Filtered Applications' : 'All Applications'}</h2>
                {hasActiveFilters && (
                  <span className="text-sm text-gray-500">
                    Showing {filteredAndSortedApplications.length} of {jobApplications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={fetchJobApplications}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 
                    ${darkMode ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-black border border-black hover:bg-gray-100'}`}
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ATS Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.atsScoreMin}
                  onChange={(e) => handleFilterChange('atsScoreMin', e.target.value)}
                  placeholder="Min score"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange('companyName', e.target.value)}
                  placeholder="Search companies"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Applied Date</label>
                <select
                  value={filters.appliedDate}
                  onChange={(e) => handleFilterChange('appliedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Dates</option>
                  <option value="latest">Latest (7 days)</option>
                  <option value="oldest">Older (30 days)</option>
                </select>
              </div>
            </div>

            {/* Sorting Options */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { field: 'jobTitle', label: 'Job Title' },
                  { field: 'companyName', label: 'Company' },
                  { field: 'improvement', label: 'Improvement %' },
                  { field: 'originalAts', label: 'Original ATS' },
                  { field: 'appliedDate', label: 'Applied Date' },
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSortChange(field)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      sortBy.field === field
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    {sortBy.field === field && (
                      <span className="ml-1">
                        {sortBy.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="p-6">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              </div>
            ) : filteredAndSortedApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center">
                  <p className="text-lg font-semibold mb-2">
                    {jobApplications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {jobApplications.length === 0 
                      ? 'Optimize a resume to start tracking your applications!' 
                      : 'Try adjusting your filters or clear them to see all applications.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedApplications.map((app) => {
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white"
                    >
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-8 min-w-0">
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-lg font-bold text-gray-900 truncate">{app.job_title}</span>
                          <span className="text-sm font-semibold text-gray-700 truncate">{app.company_name}</span>
                          <span className="text-xs text-gray-400">Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-8 flex-shrink-0 mr-8">
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-400">Original ATS</span>
                            <span className="text-sm font-semibold text-gray-700">{app.original_ats_score}%</span>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-400">Optimized ATS</span>
                            <span className="text-sm font-semibold text-gray-700">{app.optimized_ats_score}%</span>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-400">Improvement</span>
                            <span className={`text-sm font-semibold ${app.ats_improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {app.ats_improvement > 0 ? '+' : ''}{app.ats_improvement}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-shrink-0">
                        <StatusDropdown
                          value={app.status || 'applied'}
                          onChange={(newStatus) => handleStatusUpdate(app.id, newStatus)}
                          className="min-w-[140px]"
                        />
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200 text-red-400 hover:text-red-600"
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
        </div>
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