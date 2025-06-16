'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onRemove={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove();
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const getToastClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'error':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'info':
      default:
        return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400';
    }
  };

  return (
    <div className={`max-w-md w-full p-4 rounded-lg border backdrop-blur-lg animate-fadeIn ${getToastClasses()}`}>
      <div className="flex items-center justify-between">
        <p>{toast.message}</p>
        <button 
          onClick={onRemove}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}