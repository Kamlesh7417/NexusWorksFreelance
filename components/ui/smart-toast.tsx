'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { SmartNotification, smartNotifications } from '@/lib/services/smart-notifications';

interface ToastProps {
  notification: SmartNotification;
  onDismiss: (id: string) => void;
}

function Toast({ notification, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleActionClick = () => {
    if (notification.action?.onClick) {
      notification.action.onClick();
    } else if (notification.action?.href) {
      window.location.href = notification.action.href;
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-100';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-100';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getColorClasses()}
        backdrop-blur-lg border rounded-lg p-4 shadow-lg max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            </div>
            
            {notification.dismissible && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {notification.action && (
            <button
              onClick={handleActionClick}
              className="mt-3 text-sm font-medium underline hover:no-underline transition-all"
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SmartToastContainer() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  useEffect(() => {
    const unsubscribe = smartNotifications.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    smartNotifications.dismissNotification(id);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications
        .sort((a, b) => {
          // Sort by priority (high first) then by creation time
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .map(notification => (
          <Toast
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
    </div>
  );
}

// Hook for easy access to smart notifications in components
export function useSmartToast() {
  return {
    showSuccess: (message: string, title?: string) => {
      smartNotifications.showSuccessMessage(message, title);
    },
    showError: (message: string, title?: string) => {
      smartNotifications.showErrorMessage(message, title);
    },
    showInfo: (message: string, title?: string) => {
      smartNotifications.showNotification({
        type: 'info',
        title: title || 'Info',
        message,
        priority: 'medium'
      });
    },
    showWarning: (message: string, title?: string) => {
      smartNotifications.showNotification({
        type: 'warning',
        title: title || 'Warning',
        message,
        priority: 'medium'
      });
    },
    showCustom: (notification: Omit<SmartNotification, 'id'>) => {
      smartNotifications.showNotification(notification);
    }
  };
}