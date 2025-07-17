import React, { useEffect, useState } from 'react';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/check-circle.svg';
import { ReactComponent as BullseyeArrowIcon } from '../assets/icons/bullseye-arrow.svg';
import { ReactComponent as MemoIcon } from '../assets/icons/memo.svg';

const typeConfig = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    text: 'text-green-700',
    icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    accent: 'bg-green-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    icon: <BullseyeArrowIcon className="w-6 h-6 text-red-500" />,
    accent: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-100',
    icon: <MemoIcon className="w-6 h-6 text-blue-500" />,
    accent: 'bg-blue-500',
  },
};

const Toast = ({ message, type = 'info', onClose, show, darkMode = false, stackIndex = 0 }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 4000);
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

  // Stacking: each toast is offset by 80px per stackIndex from bottom
  const bottomOffset = 24 + stackIndex * 80;

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`
        fixed left-1/2 transform -translate-x-1/2 z-50
        flex items-center w-full max-w-sm px-4 py-3
        rounded-xl border shadow-lg
        ${config.bg} ${config.border} ${config.text}
        transition-all duration-300 ease-out
        ${show && visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${darkMode ? 'dark' : ''}
      `}
      role="alert"
      style={{
        bottom: `${bottomOffset}px`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        pointerEvents: show && visible ? 'auto' : 'none',
      }}
    >
      {/* Accent bar */}
      <div className={`w-1 h-10 rounded-lg mr-4 ${config.accent} flex-shrink-0`} />
      {/* Icon */}
      <div className="flex items-center justify-center mr-3">{config.icon}</div>
      {/* Message */}
      <div className="flex-1 text-sm font-medium break-words pr-2">{message}</div>
      {/* Dismiss (X) */}
      <button
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
        tabIndex={0}
      >
        <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export default Toast; 