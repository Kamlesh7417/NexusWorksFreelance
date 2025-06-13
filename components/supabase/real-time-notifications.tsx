'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { RealtimeService, MessageService, Message } from '@/lib/supabase';
import { Bell, X, MessageSquare, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'project' | 'bid' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function RealTimeNotifications() {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messageSubscription = RealtimeService.subscribeToMessages(
      user.id,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          
          const notification: Notification = {
            id: `msg_${newMessage.id}`,
            type: 'message',
            title: 'New Message',
            message: `You have a new message: ${newMessage.content.substring(0, 50)}...`,
            timestamp: new Date(newMessage.created_at),
            read: false,
            actionUrl: `/messages/${newMessage.sender_id}`
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('New Message on NexusWorks', {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        }
      }
    );

    // Subscribe to project updates
    const projectSubscription = RealtimeService.subscribeToProjects((payload) => {
      if (payload.eventType === 'INSERT') {
        const notification: Notification = {
          id: `proj_${payload.new.id}`,
          type: 'project',
          title: 'New Project Posted',
          message: `New project: ${payload.new.title}`,
          timestamp: new Date(payload.new.created_at),
          read: false,
          actionUrl: `/projects/${payload.new.id}`
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        const notification: Notification = {
          id: `proj_update_${payload.new.id}`,
          type: 'project',
          title: 'Project Updated',
          message: `Project "${payload.new.title}" has been updated`,
          timestamp: new Date(),
          read: false,
          actionUrl: `/projects/${payload.new.id}`
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      RealtimeService.unsubscribe(messageSubscription);
      RealtimeService.unsubscribe(projectSubscription);
    };
  }, [user]);

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
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-blue-400" />;
      case 'project': return <CheckCircle size={16} className="text-green-400" />;
      case 'bid': return <AlertCircle size={16} className="text-yellow-400" />;
      default: return <Info size={16} className="text-cyan-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'border-blue-500/30 bg-blue-500/10';
      case 'project': return 'border-green-500/30 bg-green-500/10';
      case 'bid': return 'border-yellow-500/30 bg-yellow-500/10';
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

  if (!user) return null;

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-full hover:bg-cyan-500/30 transition-all backdrop-blur-lg"
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
        <div className="fixed top-16 right-4 w-96 max-h-[80vh] bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-400">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                >
                  <X size={16} />
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
                    
                    <p className="text-sm text-gray-300 mb-2">{notification.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {formatTime(notification.timestamp)}
                      </div>
                      
                      {notification.actionUrl && (
                        <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                          View
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
                <p className="text-sm">You'll see updates here when they arrive</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications for New Items */}
      {notifications.slice(0, 1).map(notification => (
        !notification.read && (
          <div
            key={`toast_${notification.id}`}
            className="fixed bottom-4 right-4 w-80 bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-4 z-50 animate-slide-in"
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                <p className="text-xs text-gray-300">{notification.message}</p>
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