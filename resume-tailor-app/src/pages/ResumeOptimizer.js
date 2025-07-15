import React, { useState, useEffect, useRef } from 'react';
import { ReactComponent as MemoIcon } from '../assets/icons/memo.svg';
import { ReactComponent as BriefcaseIcon } from '../assets/icons/briefcase.svg';
import { ReactComponent as BoltIcon } from '../assets/icons/bolt.svg';
import { ReactComponent as DownToLineIcon } from '../assets/icons/down-to-line.svg';
import { ReactComponent as BullseyeArrowIcon } from '../assets/icons/bullseye-arrow.svg';
import ProgressStepper from '../components/ProgressStepper';

const ResumeOptimizer = ({
  resumeFile,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isDragOver,
  companyName,
  setCompanyName,
  jobRole,
  setJobRole,
  jobDescription,
  setJobDescription,
  atsScores,
  suggestedKeywords,
  selectedKeywords,
  handleKeywordToggle,
  fetchSuggestions,
  handleFinalize,
  handleDownload,
  finalizing,
  finalDownloadUrl,
  darkMode,
  saveJobApplication,
  handleSimpleOptimize,
  handleReset,
  handleFastOptimize
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [optimizing, setOptimizing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [optimizationError, setOptimizationError] = useState('');
  const [lastOptimizedKeywords, setLastOptimizedKeywords] = useState([]);
  const [keywordsChanged, setKeywordsChanged] = useState(false);

  // Track changes to selectedKeywords
  useEffect(() => {
    // Compare arrays (order-insensitive, by value)
    const current = [...selectedKeywords].sort().join(',');
    const last = [...lastOptimizedKeywords].sort().join(',');
    setKeywordsChanged(current !== last && selectedKeywords.length > 0);
  }, [selectedKeywords, lastOptimizedKeywords]);

  const steps = [
    { id: 1, name: 'Upload Resume', icon: <MemoIcon width={22} height={22} /> },
    { id: 2, name: 'Job Details', icon: <BriefcaseIcon width={22} height={22} /> },
    { id: 3, name: 'Optimize', icon: <BoltIcon width={22} height={22} /> },
    { id: 4, name: 'Download', icon: <DownToLineIcon width={22} height={22} /> }
  ];

  const formatScore = (score) => {
    if (score >= 90) return { color: 'text-green-600', label: 'Excellent' };
    if (score >= 80) return { color: 'text-blue-600', label: 'Good' };
    if (score >= 70) return { color: 'text-yellow-600', label: 'Fair' };
    return { color: 'text-red-600', label: 'Needs Improvement' };
  };

  const canProceedToStep2 = resumeFile;
  const canProceedToStep3 = companyName && jobRole && jobDescription;
  const canProceedToStep4 = atsScores;

  const handleOptimize = async () => {
    setOptimizing(true);
    setProcessingStage('uploading');
    setOptimizationError(''); // Clear previous errors
    
    try {
      // Enhanced processing stages with better timing and feedback
      const stageTimings = {
        uploading: 800,
        analyzing: 1200,
        extracting: 1000,
        scoring: 1500,
        optimizing: 2000,
        finalizing: 1000
      };

      // Start with uploading stage
      setTimeout(() => setProcessingStage('analyzing'), stageTimings.uploading);
      setTimeout(() => setProcessingStage('extracting'), stageTimings.uploading + stageTimings.analyzing);
      setTimeout(() => setProcessingStage('scoring'), stageTimings.uploading + stageTimings.analyzing + stageTimings.extracting);
      setTimeout(() => setProcessingStage('optimizing'), stageTimings.uploading + stageTimings.analyzing + stageTimings.extracting + stageTimings.scoring);
      
      // First, fetch suggestions if not already available
      if (suggestedKeywords.length === 0) {
        await fetchSuggestions();
      }
      
      // Perform the actual optimization with ALL keywords (job keywords + selected keywords)
      await handleSimpleOptimize();
      
      // Final stages
      setTimeout(() => setProcessingStage('finalizing'), 100);
      
      setProcessingStage('preparing');
      setTimeout(() => {
        // Move to step 4 (download) after optimization
        setOptimizing(false);
        // After optimizing, update lastOptimizedKeywords to a sorted version
        setLastOptimizedKeywords([...selectedKeywords].sort());
        // Do NOT auto-advance to step 4
        // setCurrentStep(4);
      }, 500);
      
    } catch (error) {
      console.error('Optimization failed:', error);
      let errorMessage = 'Failed to optimize resume. Please try again.';
      
      // Enhanced error handling with specific messages
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Optimization timed out. Please try with a smaller file or shorter job description.';
      } else if (error.message.includes('File too large')) {
        errorMessage = 'File is too large. Please upload a smaller resume file (max 16MB).';
      } else if (error.message.includes('Job description too long')) {
        errorMessage = 'Job description is too long. Please keep it under 750 words.';
      } else if (error.message.includes('Server is busy')) {
        errorMessage = 'Server is busy. Please try again in a moment.';
      } else if (error.message.includes('too complex')) {
        errorMessage = 'File is too complex to process. Please try with a simpler resume format.';
      } else if (error.message.includes('Invalid file format')) {
        errorMessage = 'Invalid file format. Please upload a .docx file.';
      } else if (error.message.includes('No keywords found')) {
        errorMessage = 'Not enough keywords found in the job description.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('Error optimizing resume. Please try again.')) {
        errorMessage = 'Error optimizing resume. Please try again.';
      }
      
      setOptimizationError(errorMessage);
      // Stay on step 3 to show error
      setOptimizing(false);
    }
  };

  const getStageMessage = (stage) => {
    switch (stage) {
      case 'uploading':
        return 'Uploading your resume...';
      case 'analyzing':
        return 'Analyzing your resume...';
      case 'extracting':
        return 'Extracting text from your resume...';
      case 'scoring':
        return 'Scoring your resume...';
      case 'optimizing':
        return 'Optimizing your resume...';
      case 'finalizing':
        return 'Finalizing your resume...';
      default:
        return 'Processing...';
    }
  };

  const getProgressPercentage = () => {
    const totalTime = 1000 + 1200 + 1000 + 1500 + 2000 + 1000; // Sum of all stages
    const elapsedTime = totalTime - (optimizing ? 0 : 1000); // Subtract the current stage if optimizing
    return (elapsedTime / totalTime) * 100;
  };

  const getEstimatedTime = () => {
    if (!resumeFile) return '2-3 minutes';
    
    const fileSizeMB = resumeFile.size / (1024 * 1024);
    if (fileSizeMB < 1) return '1-2 minutes';
    if (fileSizeMB < 2) return '2-3 minutes';
    if (fileSizeMB < 5) return '3-4 minutes';
    return '4-5 minutes';
  };

  const getFileSizeWarning = () => {
    if (!resumeFile) return null;
    
    const fileSizeMB = resumeFile.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      return {
        type: 'warning',
        message: 'Large file detected. This may take longer to process.'
      };
    }
    if (fileSizeMB > 5) {
      return {
        type: 'info',
        message: 'Medium file size. Processing should be quick.'
      };
    }
    return {
      type: 'success',
      message: 'Small file size. This should process quickly.'
    };
  };

  const fileSizeWarning = getFileSizeWarning();

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Loading Overlay */}
      {/* Modal overlay removed: do not render anything here when optimizing */}
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resume Optimizer</h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload, optimize, and download your ATS-ready resume</p>
      </div>

      {/* Progress Steps */}
      <ProgressStepper 
        currentStep={currentStep}
        steps={steps}
        loading={optimizing || finalizing}
        processingStage={processingStage}
      />

      {/* Step Content */}
      <div className="max-w-4xl w-full mx-auto">
        {/* Step 1: Upload Resume */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? darkMode 
                    ? 'border-gray-400 bg-gray-800' 
                    : 'border-gray-400 bg-gray-50'
                  : darkMode 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ minHeight: '320px', minWidth: '520px', padding: '3.5rem' }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-6">
                <div>
                  <h3 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {resumeFile ? 'File Selected!' : 'Drop your resume here'}
                  </h3>
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {resumeFile 
                      ? resumeFile.name 
                      : 'or click to browse files'
                    }
                  </p>
                </div>

                {!resumeFile && (
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Supports .docx files only
                  </div>
                )}
              </div>
            </div>

            {resumeFile && (
              <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {resumeFile.name}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Continue
                  </button>
                </div>
                
                {/* File size warning */}
                {fileSizeWarning && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    fileSizeWarning.type === 'warning' 
                      ? darkMode 
                        ? 'bg-yellow-900 border-yellow-700 text-yellow-200' 
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : fileSizeWarning.type === 'info'
                      ? darkMode 
                        ? 'bg-blue-900 border-blue-700 text-blue-200' 
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                      : darkMode 
                        ? 'bg-green-900 border-green-700 text-green-200' 
                        : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {fileSizeWarning.type === 'warning' ? '⚠️' : fileSizeWarning.type === 'info' ? 'ℹ️' : '✅'}
                      </span>
                      <span className="text-sm font-medium">{fileSizeWarning.message}</span>
                    </div>
                    <p className={`text-xs mt-1 ${darkMode ? 'opacity-80' : 'opacity-70'}`}>
                      Estimated processing time: {getEstimatedTime()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Job Details */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here. This helps us identify key skills, requirements, and keywords to optimize your resume for this specific role."
                rows={8}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 resize-none ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                }`}
              />
              {/* Live word count and limit feedback */}
              <div className={`text-sm mt-2 ${jobDescription.split(/\s+/).filter(Boolean).length > 750 ? 'text-red-500 font-semibold' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {jobDescription.split(/\s+/).filter(Boolean).length} / 750 words
                {jobDescription.split(/\s+/).filter(Boolean).length > 750 && (
                  <span className="ml-2">(Maximum reached)</span>
                )}
              </div>
              {jobDescription.split(/\s+/).filter(Boolean).length > 750 && (
                <div className="text-red-500 text-xs mt-1">Job description is too long. Please keep it under 750 words.</div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                ← Back
              </button>
              
              <button
                onClick={() => {
                  setCurrentStep(3);
                  // Automatically fetch suggestions when moving to step 3
                  setTimeout(() => fetchSuggestions(), 100);
                }}
                disabled={!canProceedToStep3 || jobDescription.split(/\s+/).filter(Boolean).length > 750}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  !canProceedToStep3 || jobDescription.split(/\s+/).filter(Boolean).length > 750
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optimization */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Keyword Selection and Optimization */}
              <div className="lg:col-span-2">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 shadow-sm`}>
                  <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select Keywords & Optimize
                  </h2>
                  
                  {atsScores ? (
                    <div className="space-y-6">
                      {/* ATS Score Display */}
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-2 ${formatScore(atsScores.total_score).color}`}>
                          {atsScores.total_score}%
                        </div>
                        <div className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatScore(atsScores.total_score).label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Keyword Match</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{atsScores.keyword_score}%</span>
                          </div>
                          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${atsScores.keyword_score}%` }}></div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Formatting</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{atsScores.formatting_score}%</span>
                          </div>
                          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${atsScores.formatting_score}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                          onClick={handleOptimize}
                          disabled={optimizing || finalizing}
                          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${optimizing || finalizing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                          {keywordsChanged
                            ? 'Optimize Again with Selected Keywords'
                            : optimizing || finalizing
                              ? 'Optimizing...'
                              : `Optimize with ${selectedKeywords.length} Selected Keywords`}
                        </button>
                        {/* New button to go to download page */}
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-black text-white hover:bg-gray-900"
                          disabled={optimizing || finalizing || !atsScores}
                        >
                          Go to Download Page
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ready to optimize your resume with selected keywords
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button
                          onClick={handleOptimize}
                          disabled={optimizing || finalizing}
                          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                            optimizing || finalizing
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                        >
                          {optimizing || finalizing ? 'Processing...' : 'Optimize Resume'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyword Suggestions */}
              <div className="lg:col-span-1">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Suggested Keywords
                    </h3>
                  </div>

                  {suggestedKeywords.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 mb-3">
                        Select keywords to include in your resume optimization:
                      </div>
                      {suggestedKeywords.map((keyword, index) => (
                        <button
                          key={index}
                          onClick={() => handleKeywordToggle(keyword)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                            ${selectedKeywords.includes(keyword)
                              ? darkMode 
                                ? 'bg-green-600 border-green-400 text-white animate-keyword-pop' 
                                : 'bg-green-500 border-green-600 text-white animate-keyword-pop' // More contrast in light mode
                              : darkMode 
                                ? 'bg-gray-700 border-gray-600 hover:border-green-400 hover:bg-green-900 text-white' 
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-900'}
                          `}
                          style={{
                            boxShadow: selectedKeywords.includes(keyword) ? '0 2px 12px 0 rgba(34,197,94,0.15)' : undefined,
                            transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${selectedKeywords.includes(keyword) ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>{keyword}</span>
                            <span className={`text-sm ${selectedKeywords.includes(keyword) ? 'text-white' : 'text-gray-400'}`}>{selectedKeywords.includes(keyword) ? '✓ Selected' : 'Click to add'}</span>
                          </div>
                        </button>
                      ))}
                      {selectedKeywords.length > 0 && (
                        <div className="mt-4 p-3 bg-black border border-black rounded-lg">
                          <p className="text-sm text-white">
                            <strong>{selectedKeywords.length} keywords selected.</strong> Click "Optimize Again" to include them in your resume.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {atsScores ? 'Click "Get Keywords" to see suggested keywords from the job description' : 'Optimize your resume first to get keyword suggestions'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back button for step 3 */}
            <div className="flex justify-start mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                ← Back to Job Details
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download or Error */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-8`}>
              <div className="text-center">
                {optimizationError ? (
                  <>
                    <div className="text-center">
                      <h2 className={`text-3xl font-bold mb-4 text-red-600`}>Optimization Unsuccessful</h2>
                      <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{optimizationError}</p>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => {
                          setOptimizationError('');
                          setCurrentStep(2); // Go back to job details
                        }}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        ← Modify Job Details
                      </button>
                      <button
                        onClick={() => {
                          handleReset();
                          setCurrentStep(1);
                          setOptimizing(false);
                          setOptimizationError('');
                        }}
                        className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300"
                      >
                        Try Again
                      </button>
                    </div>
                  </>
                ) : (
                  <>

                    <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resume Optimized Successfully!</h2>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your resume has been optimized for maximum ATS compatibility</p>
                    {atsScores && (
                      <div className="mt-8 text-center">
                        <div className={`text-4xl font-bold mb-2 ${formatScore(atsScores.total_score).color}`}>
                          {atsScores.total_score}% ATS Score
                        </div>
                        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatScore(atsScores.total_score).label} compatibility</p>
                      </div>
                    )}
                    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={handleDownload}
                        className="px-8 py-4 bg-white text-black border border-gray-300 hover:bg-gray-100 font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                        Download Resume
                      </button>
                      <button
                        onClick={saveJobApplication}
                        className="px-8 py-4 bg-black text-white hover:bg-gray-900 font-medium rounded-lg transition-all duration-300"
                      >
                        Save to Applications
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {!optimizationError && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleReset();
                    setCurrentStep(1);
                    setOptimizing(false);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  Optimize Another Resume
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizer; 