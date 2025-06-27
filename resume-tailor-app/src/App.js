import React, { useState, useRef, useEffect } from "react";
import { supabase } from './supabase';

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [exportFormat, setExportFormat] = useState("docx");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [industry, setIndustry] = useState("");
  const [finalDownloadUrl, setFinalDownloadUrl] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [originalAtsScore, setOriginalAtsScore] = useState(null);
  const [optimizedAtsScore, setOptimizedAtsScore] = useState(null);
  const [atsImprovement, setAtsImprovement] = useState(0);
  const [showAtsDetails, setShowAtsDetails] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [jobApplications, setJobApplications] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Check for existing session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert('Check your email for the confirmation link!');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setCurrentStep(2);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setResumeFile(file);
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }
    setLoading(true);
    setResult(null);
    setDownloadUrl(null);
    setSuggestedKeywords([]);
    setSelectedKeywords([]);
    setIndustry("");
    setFinalDownloadUrl(null);
    setOriginalAtsScore(null);
    setOptimizedAtsScore(null);
    setAtsImprovement(0);
    setShowAtsDetails(false);
    setCurrentStep(3);
    setShowModal(false);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("companyName", companyName);
    formData.append("jobRole", jobRole);
    formData.append("exportFormat", exportFormat);

    try {
      // First, calculate original ATS score
      const atsFormData = new FormData();
      atsFormData.append("resume", resumeFile);
      atsFormData.append("jobDescription", jobDescription);
      
      const atsResponse = await fetch("http://localhost:8000/calculate-ats-score", {
        method: "POST",
        body: atsFormData,
        headers: {
          Accept: "application/json"
        }
      });
      
      if (atsResponse.ok) {
        const atsData = await atsResponse.json();
        setOriginalAtsScore(atsData.ats_score);
      }

      // Then optimize the resume
      let response = await fetch("http://localhost:8000/optimize-docx", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        
        // Set optimized ATS scores from response
        if (data.optimized_ats_score) {
          setOptimizedAtsScore(data.optimized_ats_score);
          setAtsImprovement(data.optimized_ats_score.improvement);
        }
        
        // After optimization, fetch suggestions
        await fetchSuggestions(formData);
      } else {
        throw new Error('Failed to optimize resume');
      }
    } catch (err) {
      alert("Error uploading file or connecting to server.");
    }
    setLoading(false);
  };

  const fetchSuggestions = async (formData) => {
    try {
      const suggestForm = new FormData();
      suggestForm.append("resume", resumeFile);
      suggestForm.append("jobDescription", jobDescription);
      
      console.log("Fetching suggestions...");
      const response = await fetch("http://localhost:8000/suggest-keywords", {
        method: "POST",
        body: suggestForm
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Suggestions response:", data);
      
      setSuggestedKeywords(data.suggested_keywords || []);
      setIndustry(data.industry || "");
      
      // Show modal if there are suggestions
      if ((data.suggested_keywords || []).length > 0) {
        console.log("Showing modal with", data.suggested_keywords.length, "suggestions");
        setShowModal(true);
      } else {
        console.log("No suggestions found, not showing modal");
      }
      setCurrentStep(4);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestedKeywords([]);
      setIndustry("");
      // Don't show modal on error, but log the error
    }
  };

  const handleKeywordToggle = (kw) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalDownloadUrl(null);
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("companyName", companyName);
    formData.append("jobRole", jobRole);
    formData.append("exportFormat", exportFormat);
    formData.append("extraKeywords", selectedKeywords.join(", "));
    try {
      const response = await fetch("http://localhost:8000/finalize-resume", {
        method: "POST",
        body: formData
      });
      
      // Get ATS scores from headers if available
      const originalScore = response.headers.get("X-Original-ATS-Score");
      const optimizedScore = response.headers.get("X-Optimized-ATS-Score");
      const improvement = response.headers.get("X-ATS-Improvement");
      
      if (originalScore) setOriginalAtsScore(parseFloat(originalScore));
      if (optimizedScore) setOptimizedAtsScore(parseFloat(optimizedScore));
      if (improvement) setAtsImprovement(parseFloat(improvement));
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setFinalDownloadUrl(url);
      setCurrentStep(5);
    } catch (err) {
      alert("Error finalizing resume.");
    }
    setFinalizing(false);
  };

  const handleDownload = async () => {
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);
      formData.append("companyName", companyName);
      formData.append("jobRole", jobRole);
      formData.append("exportFormat", exportFormat);
      
      const response = await fetch("http://localhost:8000/download-optimized", {
        method: "POST",
        body: formData
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = companyName && jobRole ? `${companyName} ${jobRole} Resume.${exportFormat}` : "optimized_resume.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error downloading file.");
      }
    } catch (err) {
      alert("Error downloading file.");
    }
  };

  const handleExport = (format) => {
    if (format !== 'docx' && format !== 'txt') return; // Only allow docx or txt
    // ...rest of your code
  };

  const Tooltip = ({ children, content }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  // Modal component
  const SuggestionsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border p-8 max-w-lg w-full mx-4 relative animate-fade-in`}>
        <button
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
            darkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setShowModal(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <span className="text-white text-2xl">🚀</span>
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Boost Your ATS Score
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Add these keywords to maximize your resume's ATS compatibility
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {suggestedKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => handleKeywordToggle(kw)}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 transform hover:scale-105 ${
                  selectedKeywords.includes(kw)
                    ? `${darkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-lg' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-lg'}`
                    : `${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleFinalize}
            disabled={selectedKeywords.length === 0 || finalizing}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              selectedKeywords.length === 0 || finalizing
                ? `${darkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl'
            }`}
          >
            {finalizing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Keywords & Download
              </div>
            )}
          </button>
          
          {finalDownloadUrl && (
            <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-2xl p-4`}>
              <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                🎉 Final Resume Ready!
              </h4>
              <a
                href={finalDownloadUrl}
                download={companyName && jobRole ? `${companyName} ${jobRole} Resume.${exportFormat}` : "optimized_resume.docx"}
                className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Final Resume
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const exportFormats = [
    {
      value: 'docx',
      label: 'Microsoft Word (.docx)',
      description: 'Best for editing and ATS compatibility',
      icon: '📄'
    },
    {
      value: 'txt',
      label: 'Plain Text (.txt)',
      description: 'Simple text format for basic applications',
      icon: '📝'
    }
  ];

  // Job Application Tracking Functions
  const saveJobApplication = async () => {
    if (!user || !companyName || !jobRole) return;
    
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([
          {
            user_id: user.id,
            company_name: companyName,
            job_title: jobRole,
            job_description: jobDescription,
            original_ats_score: originalAtsScore?.total_score || 0,
            optimized_ats_score: optimizedAtsScore?.total_score || 0,
            ats_improvement: atsImprovement || 0
          }
        ])
        .select();

      if (error) throw error;
      
      // Refresh applications list
      fetchJobApplications();
      alert('Job application saved successfully!');
    } catch (error) {
      alert('Error saving application: ' + error.message);
    }
  };

  const fetchJobApplications = async () => {
    if (!user) return;
    
    setDashboardLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobApplications(data || []);
    } catch (error) {
      alert('Error fetching applications: ' + error.message);
    }
    setDashboardLoading(false);
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchJobApplications();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchJobApplications();
    } catch (error) {
      alert('Error deleting application: ' + error.message);
    }
  };

  // Load applications when user logs in
  useEffect(() => {
    if (user) {
      fetchJobApplications();
    }
  }, [user]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-full transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-lg'
            }`}
          >
            {darkMode ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

        {/* Authentication Section */}
        {authLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border p-8 max-w-md w-full mx-4`}>
              <div className="text-center mb-8">
                <div className={`w-20 h-20 ${darkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                  <span className="text-white text-2xl font-bold">T</span>
                </div>
                <h1 className={`text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
                  Tailrd
                </h1>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Track your job applications and optimize your resume
                </p>
              </div>

              {!showAuth ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAuth(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              ) : (
                <form onSubmit={showAuth === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full border-2 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border-2 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {showAuth === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuth(showAuth === 'signin' ? 'signup' : 'signin')}
                    className={`w-full py-2 text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    {showAuth === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuth(false)}
                    className={`w-full py-2 text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    Back
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* User Info and Sign Out */}
            <div className="flex justify-between items-center mb-6">
              <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome, {user.email}!
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    darkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
                </button>
                <button
                  onClick={handleSignOut}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Header with Hero Section */}
            <div className="mb-16">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                {/* Text Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex justify-center lg:justify-start items-center mb-6">
                    <div className={`w-20 h-20 ${darkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} rounded-2xl flex items-center justify-center shadow-2xl mr-4 transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                      <span className="text-white text-2xl font-bold">T</span>
                    </div>
                    <h1 className={`text-6xl lg:text-7xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
                      Tailrd
                    </h1>
                  </div>
                  
                  <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Transform Your Resume
                  </h2>
                  
                  <p className={`text-xl lg:text-2xl mb-8 max-w-2xl mx-auto lg:mx-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Smart keyword optimization tailored to your dream job
                  </p>
                  
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-8`}>
                    Upload your resume, add job details, and get a perfectly optimized version in seconds
                  </p>

                  {/* Progress Steps */}
                  <div className="flex items-center justify-center lg:justify-start space-x-4 mb-8">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          step <= currentStep 
                            ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'} shadow-lg` 
                            : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`
                        }`}>
                          {step}
                        </div>
                        {step < 3 && (
                          <div className={`w-8 h-1 mx-2 transition-all duration-300 ${
                            step < currentStep 
                              ? `${darkMode ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}` 
                              : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm space-x-4">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📄 Upload Resume</span>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💼 Fill Job Info</span>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>✨ Optimize</span>
                  </div>
                </div>

                {/* Hero Illustration */}
                <div className="flex-1 flex justify-center">
                  <div className="relative">
                    <svg className="w-80 h-80 lg:w-96 lg:h-96" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Background Circle */}
                      <circle cx="200" cy="200" r="180" fill={darkMode ? "#1f2937" : "#f8fafc"} stroke={darkMode ? "#374151" : "#e2e8f0"} strokeWidth="2"/>
                      
                      {/* Document/Resume */}
                      <rect x="120" y="100" width="160" height="200" rx="8" fill={darkMode ? "#374151" : "#ffffff"} stroke={darkMode ? "#4b5563" : "#e5e7eb"} strokeWidth="2"/>
                      
                      {/* Document lines */}
                      <rect x="140" y="130" width="120" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="150" width="100" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="170" width="110" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="190" width="90" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="210" width="105" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="230" width="95" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="250" width="115" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      <rect x="140" y="270" width="80" height="4" rx="2" fill={darkMode ? "#6b7280" : "#9ca3af"}/>
                      
                      {/* AI/Magic Sparkles */}
                      <circle cx="280" cy="120" r="4" fill="#3b82f6" opacity="0.8">
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="290" cy="140" r="3" fill="#8b5cf6" opacity="0.6">
                        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="275" cy="160" r="2" fill="#06b6d4" opacity="0.7">
                        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" repeatCount="indefinite"/>
                      </circle>
                      
                      {/* Optimization Arrows */}
                      <path d="M 300 200 Q 320 180 340 200 Q 320 220 300 200" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.8">
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite"/>
                      </path>
                      
                      {/* Success Checkmark */}
                      <circle cx="320" cy="280" r="20" fill="#10b981" opacity="0.9"/>
                      <path d="M 310 280 L 315 285 L 330 270" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Card */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-300 transform hover:scale-[1.01]`}>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className={`block text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📄 Upload Resume
                    </label>
                    <Tooltip content="Upload your DOCX resume file to get started">
                      <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </Tooltip>
                  </div>
                  
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 hover:scale-105 ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : darkMode 
                          ? 'border-gray-600 bg-gray-700 hover:border-blue-500' 
                          : 'border-gray-300 bg-gray-50 hover:border-blue-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".docx" 
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <div className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-6`}>
                        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {resumeFile ? resumeFile.name : "Click to upload or drag & drop"}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Only DOCX files accepted • Max 10MB
                      </p>
                      {resumeFile && (
                        <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                          ✓ File uploaded successfully
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Company and Role Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className={`block text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🏢 Company Name
                      </label>
                      <Tooltip content="Enter the company name for better resume customization">
                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      className={`w-full border-2 rounded-xl p-5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Google, Microsoft, Apple..."
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className={`block text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        💼 Job Role
                      </label>
                      <Tooltip content="Enter the specific job title you're applying for">
                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      className={`w-full border-2 rounded-xl p-5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g., Senior Software Engineer..."
                    />
                  </div>
                </div>

                {/* Job Description Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className={`block text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📋 Job Description
                    </label>
                    <Tooltip content="Paste the complete job description for optimal keyword matching">
                      <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </Tooltip>
                  </div>
                  <textarea
                    className={`w-full border-2 rounded-xl p-5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 resize-none text-lg ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    rows={10}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here to help us optimize your resume with relevant keywords and skills..."
                  />
                  {jobDescription && (
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {jobDescription.split(' ').length} words • {jobDescription.length} characters
                    </div>
                  )}
                </div>

                {/* Export Format Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className={`block text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📄 Export Format
                    </label>
                    <Tooltip content="Select the format you want your optimized resume to be exported in">
                      <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </Tooltip>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {exportFormats.map((format) => (
                      <div 
                        key={format.value}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                          exportFormat === format.value 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : darkMode 
                              ? 'border-gray-600 bg-gray-700 hover:border-blue-500' 
                              : 'border-gray-300 bg-gray-50 hover:border-blue-500'
                        }`}
                        onClick={() => handleExport(format.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{format.icon}</div>
                          <div>
                            <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{format.label}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{format.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-3xl text-xl relative overflow-hidden group`}
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loading ? (
                    <div className="flex items-center justify-center relative z-10">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>✨ Optimizing your resume...</span>
                    </div>
                  ) : (
                    <span className="relative z-10">🚀 Optimize Resume</span>
                  )}
                </button>
              </form>
            </div>

            {/* Download Section (always visible after optimization) */}
            {result && result.download_ready && (
              <div className={`rounded-2xl shadow-2xl border p-6 max-w-md w-full mx-auto mb-8 transition-all duration-500 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🎉 Resume Ready!
                    </h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Your optimized resume is ready for download
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveJobApplication}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ATS Score Section */}
            {(originalAtsScore || optimizedAtsScore) && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-500 animate-fade-in`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📊 ATS Optimization Score
                  </h2>
                  <button
                    onClick={() => setShowAtsDetails(!showAtsDetails)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showAtsDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                {/* Score Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Original Score */}
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-6 text-center`}>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Original Score
                    </h3>
                    <div className="relative">
                      <svg className="w-32 h-32 mx-auto transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={darkMode ? '#374151' : '#e5e7eb'}
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={originalAtsScore?.total_score >= 80 ? '#10b981' : originalAtsScore?.total_score >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${originalAtsScore?.total_score || 0}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {originalAtsScore?.total_score || 0}%
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Before optimization
                    </p>
                  </div>

                  {/* Optimized Score */}
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-6 text-center`}>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Optimized Score
                    </h3>
                    <div className="relative">
                      <svg className="w-32 h-32 mx-auto transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={darkMode ? '#374151' : '#e5e7eb'}
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={optimizedAtsScore?.total_score >= 80 ? '#10b981' : optimizedAtsScore?.total_score >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${optimizedAtsScore?.total_score || 0}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {optimizedAtsScore?.total_score || 0}%
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      After optimization
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Applications Dashboard */}
            {showDashboard && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-500 animate-fade-in`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📊 Job Applications Dashboard
                  </h2>
                  <button
                    onClick={fetchJobApplications}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Refresh
                  </button>
                </div>

                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : jobApplications.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-lg mb-2">No job applications yet</p>
                    <p>Optimize a resume to start tracking your applications!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobApplications.map((app) => (
                      <div key={app.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {app.job_title} at {app.company_name}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Applied: {new Date(app.application_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={app.status}
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
            )}
          </>
        )}
      </div>
      
      {/* Render the suggestions modal */}
      {showModal && <SuggestionsModal />}
    </div>
  );
}

export default App;