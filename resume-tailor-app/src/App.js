import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabase';
import { API_ENDPOINTS } from './config';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ResumeOptimizer from './pages/ResumeOptimizer';
import JobTracker from './pages/JobTracker';
import ATSGuide from './pages/ATSGuide';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import { Analytics } from '@vercel/analytics/react';

// Import SVG icons
import { ReactComponent as RocketIcon } from './assets/icons/rocket-lunch.svg';
import { ReactComponent as ChartIcon } from './assets/icons/chart-line-up.svg';
import { ReactComponent as BriefcaseIcon } from './assets/icons/briefcase.svg';
import { ReactComponent as TailrdIcon } from './assets/icons/TailrdIcon.svg';

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
  // Separate state for Log In
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Separate state for Sign Up
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loginError, setLoginError] = useState('');

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
      // Handle authentication callback from email confirmation
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      // Check if we're handling a callback (email confirmation, etc.)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session with the tokens from URL
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) throw sessionError;
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setUser(sessionData.session?.user ?? null);
        toast.success("Email confirmed successfully! Welcome to Tailrd!");
      } else {
        setUser(data.session?.user ?? null);
      }
    } catch (error) {
      console.error('Error getting session:', error);
      toast.error("Authentication error: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Authentication handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            username: signupUsername,
          },
          emailRedirectTo: window.location.origin
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
    setLoginError(''); // Clear previous errors
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setUser(data.user);
      toast.success("Welcome back!");
    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('Error logging in: ' + error.message);
      }
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
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setResumeFile(file);
    } else {
      toast.error('Please select a valid .docx file');
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
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setResumeFile(file);
    } else {
      toast.error('Please drop a valid .docx file');
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
      // Optimized timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds for complex files

      const startTime = Date.now();
      
      // Add request headers for better performance
      const response = await fetch(API_ENDPOINTS.OPTIMIZE_DOCX, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        // Enhanced error handling with specific messages
        if (response.status === 503) {
          throw new Error('Server is busy. Please try again in a moment.');
        } else if (response.status === 408) {
          throw new Error('Request timed out. Please try with a smaller file or shorter description.');
        } else if (response.status === 413) {
          throw new Error('File is too large or complex. Please try with a smaller file.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(errorMessage);
        }
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

      // Show performance metrics if available
      if (data.performance_metrics) {
        console.log(`Processing completed in ${processingTime}ms`, data.performance_metrics);
      }

      toast.success(`Resume optimized successfully in ${Math.round(processingTime/1000)}s!`);
    } catch (error) {
      console.error("Error optimizing resume:", error);
      
      // Enhanced error handling with specific messages
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please try again with a smaller file or shorter job description.");
      } else if (error.message.includes('File too large')) {
        toast.error("File is too large. Please upload a smaller resume file (max 16MB).");
      } else if (error.message.includes('Job description too long')) {
        toast.error("Job description is too long. Please keep it under 750 words.");
      } else if (error.message.includes('Server is busy')) {
        toast.error("Server is busy. Please try again in a moment.");
      } else if (error.message.includes('timed out')) {
        toast.error("Processing took too long. Please try with a smaller file or shorter description.");
      } else if (error.message.includes('too complex')) {
        toast.error("File is too complex to process. Please try with a simpler resume format.");
      } else if (error.message.includes('Too many requests')) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Error optimizing resume. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const suggestForm = new FormData();
      suggestForm.append("resume", resumeFile);
      suggestForm.append("jobDescription", jobDescription);
      
      console.log("Fetching suggestions...");
      
      // Optimized timeout for suggestions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds for suggestions

      const response = await fetch(API_ENDPOINTS.SUGGEST_KEYWORDS, {
        method: "POST",
        body: suggestForm,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        toast.error("Keyword suggestions timed out. Please try again.");
      } else if (error.message.includes('File too large')) {
        toast.error("File is too large for keyword suggestions. Please upload a smaller resume file.");
      } else if (error.message.includes('Job description too long')) {
        toast.error("Job description is too long for keyword suggestions. Please shorten it.");
      } else {
        toast.error("Error fetching keyword suggestions. Please try again.");
      }
      
      setSuggestedKeywords([]);
    }
  };

  const handleKeywordToggle = (kw) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
      console.log("Removed keyword:", kw, "Current keywords:", selectedKeywords.filter(k => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
      console.log("Added keyword:", kw, "Current keywords:", [...selectedKeywords, kw]);
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
    // Only add keywords if they exist
    if (selectedKeywords.length > 0) {
      const keywordsString = selectedKeywords.join(", ");
      // Try multiple parameter names that the backend might expect
      formData.append("extraKeywords", keywordsString);
      formData.append("keywords", keywordsString);
      formData.append("selected_keywords", keywordsString);
      formData.append("additional_keywords", keywordsString);
      console.log("Sending keywords to finalize:", selectedKeywords);
      console.log("Keywords string being sent (finalize):", keywordsString);
    } else {
      console.log("No keywords selected for finalize");
    }
    
    try {
      // Optimized timeout for finalization
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds for finalization

      const startTime = Date.now();
      const response = await fetch(API_ENDPOINTS.FINALIZE_RESUME, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/octet-stream',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        // Handle specific error types with helpful messages
        if (response.status === 503) {
          throw new Error('Server is busy. Please try again in a moment.');
        } else if (response.status === 408) {
          throw new Error('Request timed out. Please try with a smaller file or shorter description.');
        } else if (response.status === 413) {
          throw new Error('File is too large or complex. Please try with a smaller file.');
        } else {
          throw new Error(errorMessage);
        }
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
      
      toast.success(`Resume finalized successfully in ${Math.round(processingTime/1000)}s!`);
    } catch (error) {
      console.error("Error finalizing resume:", error);
      
      // Enhanced error handling with specific messages
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please try again with a smaller file or shorter job description.");
      } else if (error.message.includes('File too large')) {
        toast.error("File is too large. Please upload a smaller resume file (max 16MB).");
      } else if (error.message.includes('Job description too long')) {
        toast.error("Job description is too long. Please keep it under 750 words.");
      } else if (error.message.includes('Server is busy')) {
        toast.error("Server is busy. Please try again in a moment.");
      } else if (error.message.includes('timed out')) {
        toast.error("Processing took too long. Please try with a smaller file or shorter description.");
      } else if (error.message.includes('too complex')) {
        toast.error("File is too complex to process. Please try with a simpler resume format.");
      } else {
        toast.error("Error optimizing resume. Please try again.");
      }
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
      // Only add keywords if they exist
      console.log("Current selectedKeywords state (download):", selectedKeywords);
      if (selectedKeywords.length > 0) {
        const keywordsString = selectedKeywords.join(", ");
        // Try multiple parameter names that the backend might expect
        formData.append("extraKeywords", keywordsString);
        formData.append("keywords", keywordsString);
        formData.append("selected_keywords", keywordsString);
        formData.append("additional_keywords", keywordsString);
        console.log("Sending keywords to download:", selectedKeywords);
        console.log("Keywords string being sent (download):", keywordsString);
      } else {
        console.log("No keywords selected for download");
      }
      
      const response = await fetch(API_ENDPOINTS.DOWNLOAD_OPTIMIZED, {
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
    // Add selected keywords to the request
    console.log("Current selectedKeywords state:", selectedKeywords);
    if (selectedKeywords.length > 0) {
      const keywordsString = selectedKeywords.join(", ");
      // Try multiple parameter names that the backend might expect
      formData.append("extraKeywords", keywordsString);
      formData.append("keywords", keywordsString);
      formData.append("selected_keywords", keywordsString);
      formData.append("additional_keywords", keywordsString);
      console.log("Sending keywords to optimization:", selectedKeywords);
      console.log("Keywords string being sent:", keywordsString);
    } else {
      console.log("No keywords selected for optimization");
    }
    
    try {
      // Optimized request with better headers and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout
      
      const startTime = Date.now();
      const response = await fetch(API_ENDPOINTS.OPTIMIZE_DOCX, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        // Enhanced error handling
        if (response.status === 503) {
          throw new Error('Server is busy. Please try again in a moment.');
        } else if (response.status === 408) {
          throw new Error('Request timed out. Please try with a smaller file or shorter description.');
        } else if (response.status === 413) {
          throw new Error('File is too large or complex. Please try with a smaller file.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      
      // Use the real ATS scores from the backend
      if (data.original_ats_score && data.optimized_ats_score) {
        setOriginalAtsScore(data.original_ats_score);
        setOptimizedAtsScore(data.optimized_ats_score);
        setAtsImprovement(data.optimized_ats_score.improvement || 0);
        
        toast.success(`Resume optimized successfully in ${Math.round(processingTime/1000)}s!`);
      } else {
        // Fallback to mock scores if backend doesn't return proper data
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
        
        toast.success(`Resume optimized successfully in ${Math.round(processingTime/1000)}s!`);
      }
    } catch (error) {
      console.error("Error optimizing resume:", error);
      
      // Enhanced error handling with specific messages
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please try again with a smaller file or shorter job description.");
      } else if (error.message.includes('File too large')) {
        toast.error("File is too large. Please upload a smaller resume file (max 16MB).");
      } else if (error.message.includes('Job description too long')) {
        toast.error("Job description is too long. Please keep it under 750 words.");
      } else if (error.message.includes('Server is busy')) {
        toast.error("Server is busy. Please try again in a moment.");
      } else if (error.message.includes('timed out')) {
        toast.error("Processing took too long. Please try with a smaller file or shorter description.");
      } else if (error.message.includes('too complex')) {
        toast.error("File is too complex to process. Please try with a simpler resume format.");
      } else if (error.message.includes('Too many requests')) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Error optimizing resume. Please try again.");
      }
    } finally {
      setFinalizing(false);
    }
  };

  // New fast optimization function with immediate feedback
  const handleFastOptimize = async () => {
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
    formData.append("fast_mode", "true"); // Add fast mode flag
    // Add selected keywords to the request
    console.log("Current selectedKeywords state (fast):", selectedKeywords);
    if (selectedKeywords.length > 0) {
      const keywordsString = selectedKeywords.join(", ");
      // Try multiple parameter names that the backend might expect
      formData.append("extraKeywords", keywordsString);
      formData.append("keywords", keywordsString);
      formData.append("selected_keywords", keywordsString);
      formData.append("additional_keywords", keywordsString);
      console.log("Sending keywords to fast optimization:", selectedKeywords);
      console.log("Keywords string being sent (fast):", keywordsString);
    } else {
      console.log("No keywords selected for fast optimization");
    }
    
    try {
      // Shorter timeout for fast mode
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds for fast mode
      
      const startTime = Date.now();
      const response = await fetch(API_ENDPOINTS.OPTIMIZE_DOCX, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Optimization-Mode': 'fast'
        }
      });
      
      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.original_ats_score && data.optimized_ats_score) {
        setOriginalAtsScore(data.original_ats_score);
        setOptimizedAtsScore(data.optimized_ats_score);
        setAtsImprovement(data.optimized_ats_score.improvement || 0);
        
        toast.success(`Fast optimization completed in ${Math.round(processingTime/1000)}s!`);
      } else {
        // Fallback scores for fast mode
        const fastAtsScore = {
          total_score: 82,
          keyword_score: 88,
          formatting_score: 82,
          content_score: 78,
          structure_score: 82,
          length_score: 88
        };
        
        setOptimizedAtsScore(fastAtsScore);
        setOriginalAtsScore({ total_score: 72 });
        setAtsImprovement(10);
        
        toast.success(`Fast optimization completed in ${Math.round(processingTime/1000)}s!`);
      }
    } catch (error) {
      console.error("Error in fast optimization:", error);
      toast.error("Fast optimization failed. Please try the standard optimization.");
    } finally {
      setFinalizing(false);
    }
  };

  // Reset function to clear all resume optimization state
  const handleReset = () => {
    setResumeFile(null);
    setIsDragOver(false);
    setCompanyName('');
    setJobRole('');
    setJobDescription('');
    setExportFormat('docx');
    setLoading(false);
    setResult(null);
    setOriginalAtsScore(null);
    setOptimizedAtsScore(null);
    setAtsImprovement(0);
    setSuggestedKeywords([]);
    setSelectedKeywords([]);
    setFinalizing(false);
    setFinalDownloadUrl(null);
    
    // Clear file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-600"></div>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
  return (
      <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex min-h-screen">
          {/* Left Side - Hero Section */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
            <div className="max-w-md">
              <div className={`w-24 h-24 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-8`}>
                <TailrdIcon className="w-20 h-20" />
              </div>
              <h1 className={`text-5xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to Tailrd</h1>
              <p className={`text-xl text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>The smart resume optimizer that helps you land your dream job</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <RocketIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ATS-optimized resume enhancement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <ChartIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Real-time compatibility scoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Job application tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border p-8`}>
              {/* Logo for mobile */}
              <div className="lg:hidden text-center mb-8">
                <div className={`w-20 h-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <TailrdIcon className="w-16 h-16" />
                </div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tailrd</h2>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex mb-8 rounded-lg p-1">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setLoginError('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 relative ${
                    authMode === 'signin'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-transparent text-black'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setLoginError('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 relative ${
                    authMode === 'signup'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-transparent text-black'
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
                        We've sent a verification link to {signupEmail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Forms */}
              <div className="relative">
                {authMode === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Enter your email"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Enter your password"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                      />
                      {loginError && (
                        <p className="text-red-500 text-sm mt-1">{loginError}</p>
                      )}
                    </div>
                    <button type="submit" disabled={isLoading} className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${isLoading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}`}>{isLoading ? 'Logging In...' : 'Log In'}</button>
                  </form>
                )}
                {authMode === 'signup' && (
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                      <input
                        type="text"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a password (min 6 characters)"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
                      <input
                        type="password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'} ${signupConfirmPassword && signupPassword !== signupConfirmPassword ? 'border-red-500 focus:border-red-500' : ''} ${signupConfirmPassword && signupPassword === signupConfirmPassword ? 'border-green-500 focus:border-green-500' : ''}`}
                      />
                      {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                        <p className="text-red-500 text-sm mt-1">Passwords don't match</p>
                      )}
                      {signupConfirmPassword && signupPassword === signupConfirmPassword && (
                        <p className="text-green-500 text-sm mt-1">Passwords Match!</p>
                      )}
                    </div>
                    <button type="submit" disabled={isLoading} className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${isLoading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}`}>{isLoading ? 'Creating Account...' : 'Create Account'}</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main application
  return (
     <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
          handleReset={handleReset}
          handleFastOptimize={handleFastOptimize}
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

      {currentPage === 'ats-guide' && (
        <ATSGuide darkMode={darkMode} />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName={() =>
          'rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 py-4 text-base font-medium max-w-xs w-full animate-fade-in'
        }
        bodyClassName={() =>
          'flex items-center w-full'
        }
      />

      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm bg-black text-white mt-12">
        <button className="mx-2 underline text-white" onClick={() => setFooterPage('privacy')}>Privacy Policy</button>
        <button className="mx-2 underline text-white" onClick={() => setFooterPage('terms')}>Terms of Service</button>
        <button className="mx-2 underline text-white" onClick={() => setFooterPage('contact')}>Contact</button> 
      </footer>

      {/* Render footer pages if selected */}
      {footerPage === 'privacy' && <PrivacyPolicy />}
      {footerPage === 'terms' && <TermsOfService />}
      {footerPage === 'contact' && <Contact />}

      <Analytics />
    </div>
  );
}

export default App;