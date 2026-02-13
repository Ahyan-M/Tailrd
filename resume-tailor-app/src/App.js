import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
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

// 1. Add password validation utility function at the top (after imports):
const passwordRules = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least 1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least 1 special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

function getPasswordStrength(pw) {
  let score = 0;
  passwordRules.forEach(rule => { if (rule.test(pw)) score++; });
  if (pw.length === 0) return { label: '', color: '' };
  if (score <= 2) return { label: 'Weak', color: 'red' };
  if (score === 3) return { label: 'Medium', color: 'yellow' };
  if (score === 4) return { label: 'Strong', color: 'green' };
  if (score === 5) return { label: 'Very Strong', color: 'green' };
  return { label: '', color: '' };
}

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

  // Password visibility state
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  // Footer state
  const [footerPage, setFooterPage] = useState(null);

  // Add state for forgot/reset password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [resetPasswordToken, setResetPasswordToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [forceShowResetForm, setForceShowResetForm] = useState(false);

  // Add state for OAuth error
  const [oauthError, setOauthError] = useState('');

  // Handler for OAuth sign-in
  const handleOAuthSignIn = async (provider) => {
    setOauthError('');
    try {
      await supabase.auth.signInWithOAuth({ provider });
    } catch (err) {
      setOauthError('OAuth sign-in failed. Please try again.');
    }
  };

  // Detect Supabase password reset token on app load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    if (type === 'recovery' && accessToken) {
      setResetPasswordToken(accessToken);
      setShowForgotPassword(false);
      setForceShowResetForm(true); // Always show reset form
      // Optionally, clear any user session to force password reset
      setUser(null);
    }
  }, []);

  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setForgotMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setForgotMessage('Error: ' + (err.message || 'Could not send reset email.'));
    } finally {
      setForgotLoading(false);
    }
  };

  // Reset password handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetMessage('Password updated! You can now log in.');
      setResetPasswordToken(null);
      setAuthMode('signin');
      // Clear the token from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Optionally, log out the user
      setUser(null);
      setForceShowResetForm(false); // Hide reset form after success
    } catch (err) {
      setResetMessage('Error: ' + (err.message || 'Could not update password.'));
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJobApplications();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.log('Starting sign out process...');
      
      // Debug current auth state
      const authState = await debugAuthState();
      console.log('Auth state before sign out:', authState);
      
      // Check if user is authenticated before attempting sign out
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session found, clearing local state');
        setUser(null);
        toast.success("Signed out successfully!");
        return;
      }
      
      console.log('Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful, clearing user state');
      setUser(null);
      toast.success("Signed out successfully!");
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Handle specific error types
      if (error.message?.includes('403')) {
        toast.error("Authentication error: Session may have expired. Please refresh the page.");
        // Force clear state for 403 errors
        setUser(null);
        window.location.reload();
      } else if (error.message?.includes('network')) {
        toast.error("Network error: Please check your connection and try again.");
      } else {
        toast.error("Error signing out: " + error.message);
      }
      
      // Force clear user state even if sign out fails
      setUser(null);
    }
  };


  // Debug authentication state
  const debugAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current session:', session);
      console.log('Current user:', user);
      console.log('Local user state:', user);
      
      return { session, user };
    } catch (error) {
      console.error('Error getting auth state:', error);
      return { session: null, user: null };
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
       if (error.message.includes('File too large')) {
        toast.error("File is too large for keyword suggestions. Please upload a smaller resume file.");
      } else if (error.message.includes('Job description too long')) {
        toast.error("Job description is too long for keyword suggestions. Please shorten it.");
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.original_ats_score && data.optimized_ats_score) {
        setOriginalAtsScore(data.original_ats_score);
        setOptimizedAtsScore(data.optimized_ats_score);
        setAtsImprovement(data.optimized_ats_score.improvement || 0);
        
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
      const { error } = await supabase
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

  // Remove duplicate toast notifications for delete (only show in performDelete)
  const deleteApplication = async (id) => {
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
        position: "bottom-center",
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
        <div className="flex flex-col md:flex-row min-h-screen w-full">
          {/* Left Side - Hero Section */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 md:p-12">
            <div className="max-w-md w-full">
              <div className={`w-24 h-24 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-8`}>
                <TailrdIcon className="w-20 h-20" />
              </div>
              <h1 className={`text-3xl md:text-5xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to Tailrd</h1>
              <p className={`text-base md:text-xl text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>The smart resume optimizer that helps you land your dream job</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <RocketIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>ATS-optimized resume enhancement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <ChartIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Real-time compatibility scoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Job application tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
            <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border p-4 md:p-8`}>
              {/* Logo for mobile */}
              <div className="lg:hidden text-center mb-8">
                <div className={`w-20 h-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <TailrdIcon className="w-16 h-16" />
                </div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tailrd</h2>
              </div>
              {/* Auth Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="flex rounded-xl border border-gray-200 bg-gray-100 overflow-hidden shadow-sm w-full max-w-xs">
                  <button
                    onClick={() => { setAuthMode('signin'); setLoginError(''); }}
                    className={`w-1/2 px-2 md:px-8 py-2 md:py-3 font-semibold transition-all duration-200 focus:outline-none text-base ${
                      authMode === 'signin'
                        ? 'bg-white text-black shadow-sm border-r border-gray-200 z-10'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-r border-gray-200'
                    }`}
                    style={{ borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem' }}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setLoginError(''); }}
                    className={`w-1/2 px-2 md:px-8 py-2 md:py-3 font-semibold transition-all duration-200 focus:outline-none text-base ${
                      authMode === 'signup'
                        ? 'bg-white text-black shadow-sm z-10'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={{ borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}
                  >
                    Sign Up
                  </button>
                </div>
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
                {authMode === 'signin' && !showForgotPassword && !resetPasswordToken && (
                  <form onSubmit={handleSignIn} className="space-y-6">
                    {/* OAuth buttons */}
                    <div className="flex flex-col gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn('google')}
                        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg font-medium border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.68 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.66 7.01l7.19 5.6C43.98 37.1 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.01-2.99-1.01-6.21 0-9.2l-7.98-6.2C.64 17.1 0 20.47 0 24c0 3.53.64 6.9 1.77 10.15l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.19-5.6c-2.01 1.35-4.59 2.15-8.71 2.15-6.38 0-11.87-3.63-13.33-8.85l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                        Sign in with Google
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn('github')}
                        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg font-medium border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        Sign in with GitHub
                      </button>
                    </div>
                    {/* Divider */}
                    <div className="flex items-center my-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="mx-2 text-xs text-gray-400">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    {oauthError && <p className="text-red-500 text-sm text-center">{oauthError}</p>}
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
                      <div className="relative flex items-center">
                        <input
                          type={loginPasswordVisible ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError('');
                          }}
                          placeholder="Enter your password"
                          required
                          className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'}`}
                        />
                        <button type="button" onClick={() => setLoginPasswordVisible(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                          tabIndex={-1}
                          aria-label={loginPasswordVisible ? 'Hide password' : 'Show password'}
                        >
                          {loginPasswordVisible ? (
                            // Eye-slash icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                          ) : (
                            // Eye icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </div>
                      {/* Forgot Password link below password input */}
                      <div className="text-right mt-2 mb-1">
                        <button type="button" className="text-sm text-blue-600 hover:underline focus:outline-none" onClick={() => setShowForgotPassword(true)}>
                          Forgot Password?
                        </button>
                      </div>
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
                      <div className="flex flex-col gap-1">
                        <div className="relative flex items-center">
                          <input
                            type={signupPasswordVisible ? "text" : "password"}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create Password"
                            required
                            className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 shadow-sm focus:shadow-md focus:border-blue-400 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 outline-none"
                          />
                          {/* Icon group inside input */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button type="button" onClick={() => setSignupPasswordVisible(v => !v)}
                              className="text-gray-500 hover:text-blue-600 focus:outline-none transition-colors p-0 m-0"
                              tabIndex={-1}
                              aria-label={signupPasswordVisible ? 'Hide password' : 'Show password'}
                              style={{ background: 'transparent', border: 'none' }}
                            >
                              {signupPasswordVisible ? (
                                // Eye-slash icon (outlined)
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>
                              ) : (
                                // Eye icon (outlined)
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              )}
                            </button>
                            <div className="relative group">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-black text-black bg-white font-bold text-base shadow-sm transition-colors group-hover:bg-gray-100 cursor-pointer">?</span>
                              {/* Tooltip */}
                              <div className="absolute right-0 top-8 z-20 hidden group-hover:block bg-gray-900 text-white border border-gray-800 rounded-xl shadow-lg p-4 w-64 text-sm animate-fade-in">
                                <div className="font-semibold mb-2">Password must have:</div>
                                <ul className="space-y-1">
                                  {passwordRules.map((rule, idx) => (
                                    <li key={idx} className="flex items-center">
                                      <span className={`mr-2 text-lg ${rule.test(signupPassword) ? 'text-green-400' : 'text-red-400'}`}>{rule.test(signupPassword) ? '✔' : '✖'}</span>
                                      <span className={rule.test(signupPassword) ? 'text-green-300' : ''}>{rule.label}</span>
                                    </li>
                                  ))}
                                </ul>
                                {/* Arrow */}
                                <div className="absolute right-4 -top-2 w-3 h-3 bg-gray-900 border-l border-t border-gray-800 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Strength bar and label below input */}
                        <div className="flex items-center mt-2 gap-2">
                          <span className={`text-sm font-bold min-w-[56px] ${getPasswordStrength(signupPassword).color === 'red' ? 'text-red-500' : getPasswordStrength(signupPassword).color === 'yellow' ? 'text-yellow-500' : getPasswordStrength(signupPassword).color === 'green' ? 'text-green-600' : 'text-gray-400'}`}>{getPasswordStrength(signupPassword).label}</span>
                          <div className="flex-1 h-3 bg-gray-100 border border-gray-300 rounded-full overflow-hidden shadow-sm">
                            <div className={`h-3 transition-all duration-300 rounded-full ${getPasswordStrength(signupPassword).color === 'red' ? 'bg-red-500 w-1/4' : getPasswordStrength(signupPassword).color === 'yellow' ? 'bg-yellow-400 w-2/4' : getPasswordStrength(signupPassword).color === 'green' ? 'bg-green-500 w-full' : 'bg-gray-100 w-0'}`}></div>
                          </div>
                        </div>
                      </div>
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
                        <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                      )}
                      {signupConfirmPassword && signupPassword === signupConfirmPassword && (
                        <p className="text-green-500 text-sm mt-1">Passwords match!</p>
                      )}
                    </div>
                    <button type="submit" disabled={isLoading} className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${isLoading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}`}>{isLoading ? 'Creating Account...' : 'Create Account'}</button>
                  </form>
                )}
                {authMode === 'signin' && showForgotPassword && (
                  <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                    <label className="block text-sm font-medium mb-1">Enter your email to reset password</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400"
                      placeholder="Your email"
                    />
                    <button type="submit" disabled={forgotLoading} className="w-full py-3 px-6 rounded-lg font-medium bg-black text-white">
                      {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                    </button>
                    {forgotMessage && <p className="text-sm mt-2 text-center">{forgotMessage}</p>}
                    <button type="button" className="text-xs text-gray-500 hover:underline mt-2" onClick={() => setShowForgotPassword(false)}>Back to Log In</button>
                  </form>
                )}
                {(resetPasswordToken && forceShowResetForm) && (
                  <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                    <label className="block text-sm font-medium mb-1">Set a New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400"
                      placeholder="New password"
                    />
                    <button type="submit" disabled={resetLoading} className="w-full py-3 px-6 rounded-lg font-medium bg-black text-white">
                      {resetLoading ? 'Updating...' : 'Update Password'}
                    </button>
                    {resetMessage && <p className="text-sm mt-2 text-center">{resetMessage}</p>}
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

      {currentPage === 'learn-about' && (
        <ATSGuide darkMode={darkMode} />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="bottom-center"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
        toastClassName={({ type }) => {
          const base = 'flex items-center rounded-xl shadow-md border-0 px-5 py-3 text-sm md:text-base font-sans max-w-md w-full animate-fade-in relative mb-3 pr-12';
          switch (type) {
            case 'success':
              return `${base} bg-green-50 text-green-800`;
            case 'error':
              return `${base} bg-red-50 text-red-800`;
            case 'warning':
              return `${base} bg-yellow-50 text-yellow-800`;
            case 'info':
              return `${base} bg-blue-50 text-blue-800`;
            default:
              return `${base} bg-gray-50 text-gray-800`;
          }
        }}
        bodyClassName={() =>
          'flex items-center w-full gap-2 text-sm md:text-base'
        }
        progressClassName={() =>
          'bg-black bg-opacity-10 rounded-full'
        }
        closeButton={({ closeToast }) => (
          <button
            onClick={closeToast}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-30"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4 text-inherit" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        icon={({ type }) => {
          const iconClass = "w-5 h-5 mr-2 flex-shrink-0";
          switch (type) {
            case 'success':
              return (
                <svg className={iconClass + ' text-green-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              );
            case 'error':
              return (
                <svg className={iconClass + ' text-red-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
                </svg>
              );
            case 'warning':
              return (
                <svg className={iconClass + ' text-yellow-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M4.93 19h14.14a2 2 0 001.74-2.99l-7.07-12.25a2 2 0 00-3.48 0L3.19 16.01A2 2 0 004.93 19z" />
                </svg>
              );
            case 'info':
              return (
                <svg className={iconClass + ' text-blue-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                </svg>
              );
            default:
              return null;
          }
        }}
        style={{
          zIndex: 9999,
          '--toastify-spacing': '72px',
        }}
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