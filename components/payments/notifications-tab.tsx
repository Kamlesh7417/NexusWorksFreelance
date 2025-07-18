'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Mail, 
  Smartphone, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  CreditCard,
  Target,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_completed: boolean;
  payment_failed: boolean;
  milestone_due: boolean;
  dispute_created: boolean;
  dispute_resolved: boolean;
  payment_overdue: boolean;
  refund_processed: boolean;
  verification_required: boolean;
}

interface PaymentNotification {
  id: string;
  type: 'payment_completed' | 'payment_failed' | 'milestone_due' | 'dispute_created' | 'dispute_resolved' | 'payment_overdue' | 'refund_processed' | 'verification_required';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: Record<string, any>;
}

interface NotificationsTabProps {
  userRole: string;
}

export function NotificationsTab({ userRole }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    payment_completed: true,
    payment_failed: true,
    milestone_due: true,
    dispute_created: true,
    dispute_resolved: true,
    payment_overdue: true,
    refund_processed: true,
    verification_required: true
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Mock notifications data - in real implementation, this would come from API
  useEffect(() => {
    const mockNotifications: PaymentNotification[] = [
      {
        id: '1',
        type: 'payment_completed',
        title: 'Payment Completed',
        message: 'Your payment of $2,500 for Project Alpha - 50% milestone has been processed successfully.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
        priority: 'medium',
        action_url: '/payments/1',
        metadata: { amount: 2500, project: 'Project Alpha', milestone: 50 }
      },
      {
        id: '2',
        type: 'milestone_due',
        title: 'Milestone Payment Due',
        message: 'The 75% milestone for Project Beta is ready for payment. Amount: $1,875',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: false,
        priority: 'high',
        action_url: '/milestones/2',
        metadata: { amount: 1875, project: 'Project Beta', milestone: 75 }
      },
      {
        id: '3',
        type: 'dispute_created',
        title: 'Payment Dispute Created',
        message: 'A dispute has been created for payment #PAY-123. Reason: Quality Issue',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        read: true,
        priority: 'urgent',
        action_url: '/disputes/3',
        metadata: { payment_id: 'PAY-123', dispute_type: 'quality_issue' }
      },
      {
        id: '4',
        type: 'payment_overdue',
        title: 'Payment Overdue',
        message: 'Payment for Project Gamma - 25% milestone is now 3 days overdue.',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: false,
        priority: 'urgent',
        action_url: '/payments/overdue',
        metadata: { project: 'Project Gamma', days_overdue: 3 }
      },
      {
        id: '5',
        type: 'verification_required',
        title: 'Payment Method Verification Required',
        message: 'Your bank account ending in 1234 requires verification to continue receiving payments.',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        read: true,
        priority: 'high',
        action_url: '/payment-methods/verify',
        metadata: { method_type: 'bank_account', last_four: '1234' }
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  // Get notification type info
  const getNotificationTypeInfo = (type: string) => {
    const typeMap = {
      payment_completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Payment Completed' },
      payment_failed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Payment Failed' },
      milestone_due: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Target, label: 'Milestone Due' },
      dispute_created: { color: 'text-orange-400', bg: 'bg-orange-600/20', icon: MessageSquare, label: 'Dispute Created' },
      dispute_resolved: { color: 'text-cyan-400', bg: 'bg-cyan-600/20', icon: CheckCircle, label: 'Dispute Resolved' },
      payment_overdue: { color: 'text-red-400', bg: 'bg-red-600/20', icon: Clock, label: 'Payment Overdue' },
      refund_processed: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: DollarSign, label: 'Refund Processed' },
      verification_required: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: CreditCard, label: 'Verification Required' }
    };
    return typeMap[type as keyof typeof typeMap] || typeMap.payment_completed;
  };

  // Get priority info
  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      low: { color: 'text-green-400', label: 'Low' },
      medium: { color: 'text-yellow-400', label: 'Medium' },
      high: { color: 'text-orange-400', label: 'High' },
      urgent: { color: 'text-red-400', label: 'Urgent' }
    };
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (showUnreadOnly && notification.read) return false;
    return true;
  });

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Update notification settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setLoading(true);
    try {
      // In real implementation, this would call the API
      setSettings(prev => ({ ...prev, ...newSettings }));
      // Show success message
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate notification stats
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.priority === 'urgent').length,
    today: notifications.filter(n => {
      const notificationDate = new Date(n.created_at);
      const today = new Date();
      return notificationDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Payment Notifications</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage your payment notifications and preferences
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={notificationStats.unread === 0}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Notification Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <div className="text-xl font-bold text-white">
            {notificationStats.total}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Unread</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {notificationStats.unread}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-gray-400">Urgent</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            {notificationStats.urgent}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Today</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">
            {notificationStats.today}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700/50">
        {[
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'notifications' && notificationStats.unread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {notificationStats.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Types</option>
              <option value="payment_completed">Payment Completed</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="milestone_due">Milestone Due</option>
              <option value="dispute_created">Dispute Created</option>
              <option value="dispute_resolved">Dispute Resolved</option>
              <option value="payment_overdue">Payment Overdue</option>
              <option value="refund_processed">Refund Processed</option>
              <option value="verification_required">Verification Required</option>
            </select>

            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-cyan-600"
              />
              Show unread only
            </label>

            <div className="text-sm text-gray-400">
              {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.map(notification => {
              const typeInfo = getNotificationTypeInfo(notification.type);
              const priorityInfo = getPriorityInfo(notification.priority);
              const TypeIcon = typeInfo.icon;
              const timeAgo = getTimeAgo(notification.created_at);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-gray-800/30 border rounded-lg p-4 transition-colors ${
                    !notification.read 
                      ? 'border-cyan-500/30 bg-cyan-900/10' 
                      : 'border-gray-700/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                      <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{notification.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className={`text-xs ${priorityInfo.color}`}>
                              {priorityInfo.label} Priority
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">{timeAgo}</span>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-3">{notification.message}</p>
                      
                      {notification.action_url && (
                        <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Notifications</h3>
              <p className="text-gray-500">
                {notifications.length === 0 
                  ? 'You have no payment notifications yet.'
                  : 'No notifications match your current filters.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Delivery Methods */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Delivery Methods</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">Email Notifications</div>
                    <div className="text-gray-400 text-sm">Receive notifications via email</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_enabled}
                    onChange={(e) => updateSettings({ email_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">SMS Notifications</div>
                    <div className="text-gray-400 text-sm">Receive notifications via SMS</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sms_enabled}
                    onChange={(e) => updateSettings({ sms_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">Push Notifications</div>
                    <div className="text-gray-400 text-sm">Receive browser push notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push_enabled}
                    onChange={(e) => updateSettings({ push_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Notification Types</h4>
            <div className="space-y-4">
              {[
                { key: 'payment_completed', label: 'Payment Completed', description: 'When a payment is successfully processed', icon: CheckCircle },
                { key: 'payment_failed', label: 'Payment Failed', description: 'When a payment fails to process', icon: AlertCircle },
                { key: 'milestone_due', label: 'Milestone Due', description: 'When a milestone is ready for payment', icon: Target },
                { key: 'dispute_created', label: 'Dispute Created', description: 'When a payment dispute is created', icon: MessageSquare },
                { key: 'dispute_resolved', label: 'Dispute Resolved', description: 'When a payment dispute is resolved', icon: CheckCircle },
                { key: 'payment_overdue', label: 'Payment Overdue', description: 'When a payment becomes overdue', icon: Clock },
                { key: 'refund_processed', label: 'Refund Processed', description: 'When a refund is processed', icon: DollarSign },
                { key: 'verification_required', label: 'Verification Required', description: 'When payment method verification is needed', icon: CreditCard }
              ].map(({ key, label, description, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">{label}</div>
                      <div className="text-gray-400 text-sm">{description}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key as keyof NotificationSettings] as boolean}
                      onChange={(e) => updateSettings({ [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => updateSettings({})}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default NotificationsTab;