import React, { useState, useRef, useEffect } from 'react';

const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'bg-gray-100 text-gray-700' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-blue-100 text-blue-700' },
  { value: 'offered', label: 'Offered', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-200 text-gray-500' },
];

const StatusDropdown = ({ 
  value, 
  onChange, 
  className = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = statusOptions.find(option => option.value === value) || statusOptions[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue) => {
    onChange(newValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200
          ${selectedOption.color}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer'}
        `}
      >
        <span>{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                w-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150
                ${option.value === value ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}
                focus:outline-none focus:bg-gray-50
              `}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {option.value === value && (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown; 