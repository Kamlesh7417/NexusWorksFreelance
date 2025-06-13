'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const mockNotifications = [
        {
          type: 'success' as const,
          title: 'Task Completed',
          message: 'Alexandra Reed completed "API Integration" task',
          actionUrl: '/project/tasks',
          actionLabel: 'View Task'
        },
        {
          type: 'warning' as const,
          title: 'SLA Alert',
          message: 'Project "AI Healthcare Dashboard" approaching deadline',
          actionUrl: '/project/timeline',
          actionLabel: 'View Timeline'
        },
        {
          type: 'info' as const,
          title: 'New Team Member',
          message: 'Marcus Tan joined your project team',
          actionUrl: '/project/team',
          actionLabel: 'View Team'
        },
        {
          type: 'error' as const,
          title: 'Build Failed',
          message: 'GitHub Actions build failed for main branch',
          actionUrl: '/project/github',
          actionLabel: 'View Details'
        },
        {
          type: 'info' as const,
          title: 'Budget Update',
          message: 'Project budget utilization: 65% ($3,250 of $5,000)',
          actionUrl: '/project/budget',
          actionLabel: 'View Budget'
        }
      ];

      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        ...randomNotification,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep last 20
      setUnreadCount(prev => prev + 1);
    }, 15000); // New notification every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'error': return <AlertTriangle size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-cyan-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-cyan-500/30 bg-cyan-500/10';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-20 right-20 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-full hover:bg-cyan-500/30 transition-all"
        >
          <Bell size={20} className="text-cyan-400" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 w-96 max-h-[80vh] bg-black/90 border border-cyan-500/30 rounded-2xl backdrop-blur-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-400">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 hover:bg-white/5 transition-colors cursor-pointer ${
                      getNotificationColor(notification.type)
                    } ${!notification.read ? 'bg-white/5' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-sm opacity-80 mb-2">{notification.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatTime(notification.timestamp)}
                      </div>
                      
                      {notification.actionUrl && (
                        <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                          {notification.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see project updates here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications for New Items */}
      {notifications.slice(0, 3).map(notification => (
        !notification.read && (
          <div
            key={`toast_${notification.id}`}
            className="fixed bottom-4 right-4 w-80 bg-black/90 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-lg z-50 animate-slide-in"
            style={{
              animation: 'slideIn 0.3s ease-out forwards',
              transform: 'translateX(100%)'
            }}
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                <p className="text-xs opacity-80">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        )
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}