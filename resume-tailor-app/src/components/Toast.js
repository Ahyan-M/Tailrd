import React, { useEffect, useState } from 'react';

const typeStyles = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const Toast = ({ message, type = 'info', onClose, show }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  // Handle fade out before unmount
  useEffect(() => {
    if (!visible && show) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, show, onClose]);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 z-50
        transform -translate-x-1/2
        flex items-center
        min-w-[220px] max-w-xs sm:max-w-sm px-4 py-3
        rounded-lg shadow-lg
        ${typeStyles[type] || typeStyles.info}
        transition-all duration-300
        ${show && visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      role="alert"
      style={{ pointerEvents: show && visible ? 'auto' : 'none' }}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="ml-3 text-lg font-bold text-gray-400 hover:text-gray-700 focus:outline-none"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast; 