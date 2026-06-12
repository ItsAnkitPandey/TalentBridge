import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

/**
 * Toast Notification System
 * Provides beautiful, accessible toast notifications
 */

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const customStyles = {
  success: {
    style: {
      background: '#10b981',
      color: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
  },
  error: {
    style: {
      background: '#ef4444',
      color: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#ef4444',
    },
  },
  info: {
    style: {
      background: '#3b82f6',
      color: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#3b82f6',
    },
  },
  warning: {
    style: {
      background: '#f59e0b',
      color: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#f59e0b',
    },
  },
};

export const ToastProvider = ({ children }) => {
  const showSuccess = (message, options = {}) => {
    toast.success(message, {
      ...customStyles.success,
      icon: <FiCheckCircle size={24} />,
      duration: 4000,
      ...options,
    });
  };

  const showError = (message, options = {}) => {
    toast.error(message, {
      ...customStyles.error,
      icon: <FiXCircle size={24} />,
      duration: 5000,
      ...options,
    });
  };

  const showInfo = (message, options = {}) => {
    toast(message, {
      ...customStyles.info,
      icon: <FiInfo size={24} />,
      duration: 4000,
      ...options,
    });
  };

  const showWarning = (message, options = {}) => {
    toast(message, {
      ...customStyles.warning,
      icon: <FiAlertTriangle size={24} />,
      duration: 4000,
      ...options,
    });
  };

  const showPromise = (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        success: customStyles.success,
        error: customStyles.error,
        ...options,
      }
    );
  };

  const dismiss = (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const value = {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    promise: showPromise,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Roboto', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />
      {children}
    </ToastContext.Provider>
  );
};

// Convenience hook for direct toast usage
export const useNotification = () => {
  const toast = useToast();
  
  return {
    notifySuccess: (message) => toast.success(message),
    notifyError: (message) => toast.error(message),
    notifyInfo: (message) => toast.info(message),
    notifyWarning: (message) => toast.warning(message),
  };
};

export default ToastProvider;
