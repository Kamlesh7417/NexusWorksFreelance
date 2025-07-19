'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, Filter } from 'lucide-react';
import { useNotifications, NotificationData } from '@/lib/services/notification-service';
import { useRealtimeUpdates } from '@/lib/services/realtime-update-service';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationData['type']>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearRead,
    subscribe
  } = useNotifications();

  const { getConnectionStatus } = useRealtimeUpdates();

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, [subscribe]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationData['type']) => {
    const iconMap = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      message: '💬',
      project: '📋',
      payment: '💳',
    };
    return iconMap[type] || '📢';
  };

  // Get notification color based on type and priority
  const getNotificationColor = (notification: NotificationData) => {
    if (notification.priority === 'urgent') return 'border-red-500 bg-red-500/10';
    if (notification.priority === 'high') return 'border-orange-500 bg-orange-500/10';
    
    const colorMap = {
      info: 'border-blue-500 bg-blue-500/10',
      success: 'border-green-500 bg-green-500/10',
      warning: 'border-yellow-500 bg-yellow-500/10',
      error: 'border-red-500 bg-red-500/10',
      message: 'border-purple-500 bg-purple-500/10',
      project: 'border-cyan-500 bg-cyan-500/10',
      payment: 'border-emerald-500 bg-emerald-500/10',
    };
    
    return colorMap[notification.type] || 'border-gray-500 bg-gray-500/10';
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Get connection status indicator
  const connectionStatus = getConnectionStatus();
  const isConnected = connectionStatus.overall === 'connected';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Connection Status */}
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  isConnected 
                    ? 'text-green-400 bg-green-500/20' 
                    : 'text-red-400 bg-red-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {isConnected ? 'Live' : 'Offline'}
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 text-sm">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'message', label: 'Messages' },
                { key: 'project', label: 'Projects' },
                { key: 'payment', label: 'Payments' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded transition-colors ${
                    filter === key
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="p-3 border-b border-gray-700 flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Mark All Read
              </button>
              <button
                onClick={clearRead}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear Read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-800 transition-colors cursor-pointer border-l-4 ${
                      getNotificationColor(notification)
                    } ${!notification.read ? 'bg-gray-800/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          {/* Priority Indicator */}
                          {(notification.priority === 'high' || notification.priority === 'urgent') && (
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                              notification.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                          )}
                        </div>

                        <p className={`text-xs mt-1 ${
                          notification.read ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Action Button */}
                            {notification.actionLabel && (
                              <span className="text-xs text-cyan-400">
                                {notification.actionLabel}
                              </span>
                            )}

                            {/* Mark as Read Button */}
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-gray-500 hover:text-white p-1"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}

                            {/* Remove Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-500 hover:text-red-400 p-1"
                              title="Remove notification"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page if it exists
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}