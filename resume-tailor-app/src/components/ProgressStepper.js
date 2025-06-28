import React from 'react';

const ProgressStepper = ({ currentStep, darkMode }) => {
  const steps = [
    { id: 1, name: 'Upload Resume', icon: '📄' },
    { id: 2, name: 'Job Details', icon: '💼' },
    { id: 3, name: 'Optimization', icon: '⚡' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                currentStep >= step.id
                  ? darkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-900 text-white'
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

            {/* Connector Line */}
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
  );
};

export default ProgressStepper; 