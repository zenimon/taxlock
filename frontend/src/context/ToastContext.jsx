import { createContext, useContext } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const showToast = (message, type = 'default') => {
    switch (type) {
      case 'success':
        return toast.success(message);
      case 'error':
        return toast.error(message);
      case 'loading':
        return toast.loading(message);
      default:
        return toast(message);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
