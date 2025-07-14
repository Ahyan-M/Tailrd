import React from 'react';

const ProgressStepper = ({ currentStep, steps, loading, processingStage }) => {
  const getStageMessage = (stage) => {
    switch (stage) {
      case 'uploading':
        return 'Uploading resume to our servers...';
      case 'analyzing':
        return 'Analyzing resume content and structure...';
      case 'extracting':
        return 'Extracting keywords and skills...';
      case 'scoring':
        return 'Calculating ATS compatibility scores...';
      case 'optimizing':
        return 'Optimizing resume for maximum impact...';
      case 'finalizing':
        return 'Finalizing your optimized document...';
      case 'preparing':
        return 'Preparing your resume for download...';
      default:
        return 'Processing your resume...';
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'uploading':
        return '📤';
      case 'analyzing':
        return '🔍';
      case 'extracting':
        return '🔑';
      case 'scoring':
        return '📊';
      case 'optimizing':
        return '⚡';
      case 'finalizing':
        return '✨';
      case 'preparing':
        return '📄';
      default:
        return '⏳';
    }
  };

  const getProgressPercentage = () => {
    if (!loading) return 0;
    
    const stageProgress = {
      'uploading': 10,
      'analyzing': 25,
      'extracting': 40,
      'scoring': 60,
      'optimizing': 80,
      'finalizing': 95,
      'preparing': 100
    };
    
    return stageProgress[processingStage] || 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  currentStep > step.id
                    ? 'bg-green-500 border-green-500 text-white shadow-lg'
                    : currentStep === step.id
                    ? 'bg-gray-200 border-gray-300 text-gray-900 shadow-lg'
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium transition-all duration-300 ${
                  currentStep > step.id ? 'text-black' : currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                {currentStep === step.id && loading && processingStage && (
                  <div className="mt-1">
                    
                  </div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Enhanced Progress bar for current step */}
      {loading && (
        <div className="mt-8">
          <div className="relative">
            <div className="w-full bg-black rounded-full h-3 overflow-hidden">
              <div 
                className="bg-black h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{ 
                  width: `${getProgressPercentage()}%`,
                }}
              >
                {/* Removed shimmer/gradient for solid black */}
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Step {currentStep} of {steps.length} - {getStageMessage(processingStage)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                This may take a few moments depending on your file size...
              </p>
            </div>
          </div>
          {/* Additional loading indicators */}
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default ProgressStepper; 