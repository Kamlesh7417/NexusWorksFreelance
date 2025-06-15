'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-400" />;
      case 'error': return <AlertCircle size={20} className="text-red-400" />;
      case 'info': return <Info size={20} className="text-cyan-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-500/20 border-green-500/40';
      case 'error': return 'bg-red-500/20 border-red-500/40';
      case 'info': return 'bg-cyan-500/20 border-cyan-500/40';
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 max-w-md w-full md:w-auto p-4 rounded-lg border backdrop-blur-lg shadow-lg transition-all duration-300 ${getStyles()} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-white">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}