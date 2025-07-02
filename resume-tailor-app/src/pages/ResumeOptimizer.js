import React, { useState } from 'react';
import { ReactComponent as MemoIcon } from '../assets/icons/memo.svg';
import { ReactComponent as BriefcaseIcon } from '../assets/icons/briefcase.svg';
import { ReactComponent as BoltIcon } from '../assets/icons/bolt.svg';
import { ReactComponent as DownToLineIcon } from '../assets/icons/down-to-line.svg';

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
  handleSimpleOptimize
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [optimizing, setOptimizing] = useState(false);

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
    try {
      // Try the simple optimization first
      await handleSimpleOptimize();
      // After optimization, automatically fetch suggestions
      await fetchSuggestions();
    } catch (error) {
      console.error('Optimization failed:', error);
      // If simple optimization fails, try the complex one
      try {
        await handleFinalize();
        await fetchSuggestions();
      } catch (finalizeError) {
        console.error('Finalize also failed:', finalizeError);
      }
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resume Optimizer</h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload, optimize, and download your ATS-ready resume</p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl w-full mx-auto mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                  currentStep === step.id
                    ? darkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-blue-100 text-blue-700'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-400' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.icon}
                </div>
                <div className={`mt-2 text-sm font-medium text-center ${
                  currentStep >= step.id
                    ? darkMode ? 'text-white' : 'text-gray-900'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {step.name}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id
                    ? darkMode ? 'bg-gray-600' : 'bg-gray-400'
                    : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

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
                onClick={() => setCurrentStep(3)}
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
              {/* ATS Score Overview */}
              <div className="lg:col-span-2">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 shadow-sm`}>
                  <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ATS Compatibility Score
                  </h2>
                  
                  {atsScores ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className={`text-6xl font-bold mb-2 ${formatScore(atsScores.total_score).color}`}>
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
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ready to optimize your resume
                      </p>
                      <button
                        onClick={handleOptimize}
                        disabled={optimizing || finalizing}
                        className={`mt-4 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          optimizing || finalizing
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        {optimizing || finalizing ? 'Processing...' : 'Optimize Resume'}
                      </button>
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
                    <button
                      onClick={fetchSuggestions}
                      disabled={!atsScores}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                        !atsScores
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : darkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Refresh
                    </button>
                  </div>

                  {suggestedKeywords.length > 0 ? (
                    <div className="space-y-2">
                      {suggestedKeywords.map((keyword, index) => (
                        <button
                          key={index}
                          onClick={() => handleKeywordToggle(keyword)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                            selectedKeywords.includes(keyword)
                              ? darkMode 
                                ? 'bg-gray-700 border-gray-500' 
                                : 'bg-gray-100 border-gray-400'
                              : darkMode 
                                ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {keyword}
                            </span>
                            <span className={`text-sm ${selectedKeywords.includes(keyword) ? 'text-green-600' : 'text-gray-400'}`}>
                              {selectedKeywords.includes(keyword) ? '✓' : '+'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{atsScores ? 'No keyword suggestions available' : 'Optimize first to get suggestions'}</p>
                      {atsScores && (
                        <button
                          onClick={fetchSuggestions}
                          className="mt-3 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-all duration-300"
                        >
                          Get Suggestions
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(2)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                ← Back
              </button>
              
              {atsScores && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Continue to Download →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Download */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 shadow-sm`}>
              <div className="text-center">
                <div className="text-center">
                  <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resume Optimized Successfully!</h2>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your resume has been optimized for maximum ATS compatibility</p>
                </div>

                {atsScores && (
                  <div className="mt-8 text-center">
                    <div className={`text-4xl font-bold mb-2 ${formatScore(atsScores.total_score).color}`}>
                      {atsScores.total_score}% ATS Score
                    </div>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatScore(atsScores.total_score).label} compatibility
                    </p>
                  </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleDownload}
                    className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-300"
                  >
                    Download Resume
                  </button>
                  <button
                    onClick={saveJobApplication}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300"
                  >
                    Save to Applications
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  // Reset state for new optimization
                  setOptimizing(false);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                Optimize Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizer; 