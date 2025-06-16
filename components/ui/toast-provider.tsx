'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
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

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
      
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts]);

  const getToastColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'error': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      default: return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`${getToastColor(toast.type)} border rounded-lg p-4 shadow-lg animate-fadeIn`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{toast.title}</h4>
                <p className="text-sm">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}