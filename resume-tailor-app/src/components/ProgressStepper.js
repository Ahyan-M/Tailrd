import React from 'react';

const ProgressStepper = ({ currentStep, steps, loading, processingStage }) => {
  const getStageMessage = (stage) => {
    switch (stage) {
      case 'uploading':
        return 'Uploading resume...';
      case 'analyzing':
        return 'Analyzing resume content...';
      case 'extracting':
        return 'Extracting keywords...';
      case 'scoring':
        return 'Calculating ATS scores...';
      case 'optimizing':
        return 'Optimizing resume...';
      case 'finalizing':
        return 'Finalizing document...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-blue-500 border-blue-500 text-white'
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
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                {currentStep === step.id && loading && processingStage && (
                  <p className="text-xs text-blue-600 mt-1 animate-pulse">
                    {getStageMessage(processingStage)}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress bar for current step */}
      {loading && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${(currentStep / steps.length) * 100}%`,
                animation: 'pulse 2s infinite'
              }}
            />
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length} - {getStageMessage(processingStage)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressStepper; 