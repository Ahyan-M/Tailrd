import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabase';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ResumeOptimizer from './pages/ResumeOptimizer';
import JobTracker from './pages/JobTracker';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';

function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Resume optimization state
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [exportFormat, setExportFormat] = useState('docx');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ATS scoring state
  const [originalAtsScore, setOriginalAtsScore] = useState(null);
  const [optimizedAtsScore, setOptimizedAtsScore] = useState(null);
  const [atsImprovement, setAtsImprovement] = useState(0);

  // Keyword suggestions state
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  // Download state
  const [finalizing, setFinalizing] = useState(false);
  const [finalDownloadUrl, setFinalDownloadUrl] = useState(null);

  // Job applications state
  const [jobApplications, setJobApplications] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // File input ref
  const fileInputRef = useRef(null);

  // Authentication state
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Footer state
  const [footerPage, setFooterPage] = useState(null);

  useEffect(() => {
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJobApplications();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Authentication handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        setVerificationSent(true);
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.success("Account created successfully!");
        setAuthMode('signin');
      }
    } catch (error) {
      toast.error("Error creating account: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("Error signing in: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error("Error signing out: " + error.message);
    }
  };

  // File handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.type === 'application/pdf' || 
                 file.type === 'text/plain')) {
      setResumeFile(file);
    } else {
      toast.error('Please select a valid file (.docx, .pdf, or .txt)');
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
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.type === 'application/pdf' || 
                 file.type === 'text/plain')) {
      setResumeFile(file);
    } else {
      toast.error('Please drop a valid file (.docx, .pdf, or .txt)');
    }
  };

  // Resume optimization
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      toast.error('Please upload a resume and provide a job description');
      return;
    }

    setLoading(true);
    setResult(null);
    setOriginalAtsScore(null);
    setOptimizedAtsScore(null);
    setAtsImprovement(0);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("companyName", companyName);
    formData.append("jobRole", jobRole);
    formData.append("exportFormat", exportFormat);

    try {
      const response = await fetch("http://localhost:8000/optimize-docx", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // Get ATS scores from headers if available
      const originalScore = response.headers.get("X-Original-ATS-Score");
      const optimizedScore = response.headers.get("X-Optimized-ATS-Score");
      const improvement = response.headers.get("X-ATS-Improvement");
      
      if (originalScore) setOriginalAtsScore(JSON.parse(originalScore));
      if (optimizedScore) setOptimizedAtsScore(JSON.parse(optimizedScore));
      if (improvement) setAtsImprovement(parseFloat(improvement));

      toast.success("Resume optimized successfully!");
    } catch (error) {
      console.error("Error optimizing resume:", error);
      toast.error("Error optimizing resume. Please try again.");
    } finally {
      setLoading(false);
    }
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
      
      if (data.suggested_keywords && Array.isArray(data.suggested_keywords)) {
        setSuggestedKeywords(data.suggested_keywords);
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestedKeywords(data.suggestions);
      } else if (data.keywords && Array.isArray(data.keywords)) {
        setSuggestedKeywords(data.keywords);
      } else {
        console.warn("No suggestions found in response:", data);
        setSuggestedKeywords([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestedKeywords([]);
    }
  };

  const handleKeywordToggle = (kw) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalDownloadUrl(null);
    setOptimizedAtsScore(null);
    setOriginalAtsScore(null);
    setAtsImprovement(0);
    
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get ATS scores from headers if available
      const originalScore = response.headers.get("X-Original-ATS-Score");
      const optimizedScore = response.headers.get("X-Optimized-ATS-Score");
      const improvement = response.headers.get("X-ATS-Improvement");
      
      if (originalScore) {
        try {
          setOriginalAtsScore(JSON.parse(originalScore));
        } catch (e) {
          setOriginalAtsScore({ total_score: parseFloat(originalScore) });
        }
      }
      
      if (optimizedScore) {
        try {
          setOptimizedAtsScore(JSON.parse(optimizedScore));
        } catch (e) {
          setOptimizedAtsScore({ total_score: parseFloat(optimizedScore) });
        }
      }
      
      if (improvement) {
        setAtsImprovement(parseFloat(improvement));
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setFinalDownloadUrl(url);
      
      toast.success("Resume optimized successfully!");
    } catch (error) {
      console.error("Error finalizing resume:", error);
      toast.error("Error optimizing resume. Please try again.");
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);
      formData.append("companyName", companyName);
      formData.append("jobRole", jobRole);
      formData.append("exportFormat", exportFormat);
      formData.append("extraKeywords", selectedKeywords.join(", "));
      
      const response = await fetch("http://localhost:8000/download-optimized", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = companyName && jobRole ? `${companyName} ${jobRole} Resume.${exportFormat}` : "optimized_resume.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file. Please try again.");
    }
  };

  const handleSimpleOptimize = async () => {
    setFinalizing(true);
    setOptimizedAtsScore(null);
    setOriginalAtsScore(null);
    setAtsImprovement(0);
    
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("companyName", companyName);
    formData.append("jobRole", jobRole);
    formData.append("exportFormat", exportFormat);
    
    try {
      const response = await fetch("http://localhost:8000/optimize-docx", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set some default ATS scores for demonstration
      const mockAtsScore = {
        total_score: 85,
        keyword_score: 90,
        formatting_score: 85,
        content_score: 80,
        structure_score: 85,
        length_score: 90
      };
      
      setOptimizedAtsScore(mockAtsScore);
      setOriginalAtsScore({ total_score: 75 });
      setAtsImprovement(10);
      
      toast.success("Resume optimized successfully!");
    } catch (error) {
      console.error("Error optimizing resume:", error);
      toast.error("Error optimizing resume. Please try again.");
    } finally {
      setFinalizing(false);
    }
  };

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
      toast.success("Job application saved successfully!");
    } catch (error) {
      toast.error("Error saving application: " + error.message);
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
      toast.error("Error fetching applications: " + error.message);
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
      toast.error("Error updating status: " + error.message);
    }
  };

  const deleteApplication = async (id) => {
    // Show confirmation toast with action buttons
    toast.info(
      <div>
        <div className="mb-2">Are you sure you want to delete this application?</div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss();
              performDelete(id);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        position: "top-center",
      }
    );
  };

  const performDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchJobApplications();
      toast.success("Application deleted successfully!");
    } catch (error) {
      toast.error("Error deleting application: " + error.message);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-600"></div>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex min-h-screen">
          {/* Left Side - Hero Section */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
            <div className="max-w-md">
              <div className={`w-20 h-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-8`}>
                <span className="text-4xl font-bold">T</span>
              </div>
              <h1 className={`text-5xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to Tailrd
              </h1>
              <p className={`text-xl text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                The AI-powered resume optimizer that helps you land your dream job
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg">🚀</span>
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    AI-powered ATS optimization
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg">📊</span>
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Real-time compatibility scoring
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg">💼</span>
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Job application tracking
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border p-8`}>
              {/* Logo for mobile */}
              <div className="lg:hidden text-center mb-8">
                <div className={`w-16 h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl font-bold">T</span>
                </div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tailrd
                </h2>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex mb-8">
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    authMode === 'signin'
                      ? 'bg-gray-900 text-white'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    authMode === 'signup'
                      ? 'bg-gray-900 text-white'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Verification Message */}
              {verificationSent && (
                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                        Check your email!
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                        We've sent a verification link to {email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Forms */}
              {authMode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
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
                      placeholder="Enter your password"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      isLoading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
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
                      placeholder="Create a password (min 6 characters)"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      isLoading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* Dark Mode Toggle */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main application
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        handleSignOut={handleSignOut}
      />

      {/* Page Content */}
      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          darkMode={darkMode}
          jobApplications={jobApplications}
          dashboardLoading={dashboardLoading}
          fetchJobApplications={fetchJobApplications}
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === 'resume-optimizer' && (
        <ResumeOptimizer
          resumeFile={resumeFile}
          handleFileChange={handleFileChange}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          isDragOver={isDragOver}
          companyName={companyName}
          setCompanyName={setCompanyName}
          jobRole={jobRole}
          setJobRole={setJobRole}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          atsScores={optimizedAtsScore}
          suggestedKeywords={suggestedKeywords}
          selectedKeywords={selectedKeywords}
          handleKeywordToggle={handleKeywordToggle}
          fetchSuggestions={fetchSuggestions}
          handleFinalize={handleFinalize}
          handleDownload={handleDownload}
          finalizing={finalizing}
          finalDownloadUrl={finalDownloadUrl}
          darkMode={darkMode}
          saveJobApplication={saveJobApplication}
          handleSimpleOptimize={handleSimpleOptimize}
        />
      )}

      {currentPage === 'job-tracker' && (
        <JobTracker
          user={user}
          darkMode={darkMode}
          jobApplications={jobApplications}
          dashboardLoading={dashboardLoading}
          fetchJobApplications={fetchJobApplications}
          updateApplicationStatus={updateApplicationStatus}
          deleteApplication={deleteApplication}
        />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm text-gray-500 bg-gray-50 border-t dark:bg-gray-900 dark:text-gray-400 mt-12">
        <button className="mx-2 underline" onClick={() => setFooterPage('privacy')}>Privacy Policy</button>
        <button className="mx-2 underline" onClick={() => setFooterPage('terms')}>Terms of Service</button>
        <button className="mx-2 underline" onClick={() => setFooterPage('contact')}>Contact</button>
      </footer>

      {/* Render footer pages if selected */}
      {footerPage === 'privacy' && <PrivacyPolicy />}
      {footerPage === 'terms' && <TermsOfService />}
      {footerPage === 'contact' && <Contact />}
    </div>
  );
}

export default App;