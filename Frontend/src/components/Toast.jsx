import React, { useEffect, useState } from 'react';
import { IoClose, IoCheckmarkCircle, IoInformationCircle, IoWarning, IoAlertCircle } from 'react-icons/io5';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  id 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose(id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border transform transition-all duration-300 ease-in-out";
    
    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200',
          icon: <IoCheckmarkCircle className="text-green-500 text-xl" />,
          bg: 'bg-green-50'
        };
      case 'error':
        return {
          border: 'border-red-200',
          icon: <IoAlertCircle className="text-red-500 text-xl" />,
          bg: 'bg-red-50'
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          icon: <IoWarning className="text-yellow-500 text-xl" />,
          bg: 'bg-yellow-50'
        };
      default:
        return {
          border: 'border-blue-200',
          icon: <IoInformationCircle className="text-blue-500 text-xl" />,
          bg: 'bg-blue-50'
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 ${typeStyles.border}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {typeStyles.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {message}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <IoClose className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Toast Context and Provider
const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default Toast;
