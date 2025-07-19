/**
 * Notification Service for Real-time Updates
 * Handles notification management, persistence, and real-time updates
 */

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'project' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  userId?: string;
  projectId?: string;
  conversationId?: string;
}

export interface NotificationBatch {
  notifications: NotificationData[];
  timestamp: Date;
  batchId: string;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private handlers = new Set<(notifications: NotificationData[]) => void>();
  private batchHandlers = new Set<(batch: NotificationBatch) => void>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingBatch: NotificationData[] = [];
  private readonly BATCH_DELAY = 500; // 500ms batch delay
  private readonly MAX_NOTIFICATIONS = 100;
  private readonly STORAGE_KEY = 'console-notifications';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.requestNotificationPermission();
    }
  }

  /**
   * Request browser notification permission
   */
  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        
        // Clean up old notifications (older than 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => n.timestamp > weekAgo);
        
        this.saveToStorage();
        this.notifyHandlers();
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveToStorage(): void {
    try {
      // Only save persistent notifications
      const persistentNotifications = this.notifications.filter(n => n.persistent);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistentNotifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  /**
   * Add a single notification
   */
  public addNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullNotification: NotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    // Add to pending batch for efficient updates
    this.pendingBatch.push(fullNotification);
    this.scheduleBatchUpdate();

    // Show browser notification for high priority items
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      this.showBrowserNotification(fullNotification);
    }

    return id;
  }

  /**
   * Add multiple notifications efficiently
   */
  public addNotifications(notifications: Omit<NotificationData, 'id' | 'timestamp'>[]): string[] {
    const ids: string[] = [];
    
    notifications.forEach(notification => {
      const id = this.generateId();
      const fullNotification: NotificationData = {
        ...notification,
        id,
        timestamp: new Date(),
      };
      
      this.pendingBatch.push(fullNotification);
      ids.push(id);
    });

    this.scheduleBatchUpdate();
    return ids;
  }

  /**
   * Schedule batch update to prevent excessive re-renders
   */
  private scheduleBatchUpdate(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process pending batch of notifications
   */
  private processBatch(): void {
    if (this.pendingBatch.length === 0) return;

    const batch: NotificationBatch = {
      notifications: [...this.pendingBatch],
      timestamp: new Date(),
      batchId: this.generateId(),
    };

    // Add to main notifications array
    this.notifications.unshift(...this.pendingBatch);
    
    // Limit total notifications
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    // Clear pending batch
    this.pendingBatch = [];
    this.batchTimeout = null;

    // Save to storage
    this.saveToStorage();

    // Notify handlers
    this.notifyHandlers();
    this.notifyBatchHandlers(batch);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Mark multiple notifications as read
   */
  public markMultipleAsRead(ids: string[]): void {
    let changed = false;
    
    ids.forEach(id => {
      const notification = this.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        notification.read = true;
        changed = true;
      }
    });

    if (changed) {
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    let changed = false;
    
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        changed = true;
      }
    });

    if (changed) {
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Remove notification
   */
  public removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Remove multiple notifications
   */
  public removeNotifications(ids: string[]): void {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => !ids.includes(n.id));
    
    if (this.notifications.length !== initialLength) {
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyHandlers();
  }

  /**
   * Clear read notifications
   */
  public clearRead(): void {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => !n.read);
    
    if (this.notifications.length !== initialLength) {
      this.saveToStorage();
      this.notifyHandlers();
    }
  }

  /**
   * Get all notifications
   */
  public getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get notifications by type
   */
  public getNotificationsByType(type: NotificationData['type']): NotificationData[] {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Get notifications by priority
   */
  public getNotificationsByPriority(priority: NotificationData['priority']): NotificationData[] {
    return this.notifications.filter(n => n.priority === priority);
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get unread count by type
   */
  public getUnreadCountByType(type: NotificationData['type']): number {
    return this.notifications.filter(n => !n.read && n.type === type).length;
  }

  /**
   * Subscribe to notification updates
   */
  public subscribe(handler: (notifications: NotificationData[]) => void): () => void {
    this.handlers.add(handler);
    
    // Immediately call with current notifications
    handler([...this.notifications]);
    
    return () => this.handlers.delete(handler);
  }

  /**
   * Subscribe to batch updates
   */
  public subscribeToBatch(handler: (batch: NotificationBatch) => void): () => void {
    this.batchHandlers.add(handler);
    return () => this.batchHandlers.delete(handler);
  }

  /**
   * Notify all handlers
   */
  private notifyHandlers(): void {
    const notifications = [...this.notifications];
    this.handlers.forEach(handler => {
      try {
        handler(notifications);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }

  /**
   * Notify batch handlers
   */
  private notifyBatchHandlers(batch: NotificationBatch): void {
    this.batchHandlers.forEach(handler => {
      try {
        handler(batch);
      } catch (error) {
        console.error('Error in batch notification handler:', error);
      }
    });
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: NotificationData): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo-nexus.jpg',
          tag: notification.id,
          badge: '/logo-nexus.jpg',
          timestamp: notification.timestamp.getTime(),
          requireInteraction: notification.priority === 'urgent',
        });

        // Auto-close after 5 seconds for non-urgent notifications
        if (notification.priority !== 'urgent') {
          setTimeout(() => {
            if (browserNotification && typeof browserNotification.close === 'function') {
              browserNotification.close();
            }
          }, 5000);
        }

        // Handle click
        browserNotification.onclick = () => {
          if (typeof window !== 'undefined' && window.focus) {
            window.focus();
          }
          if (notification.actionUrl && typeof window !== 'undefined') {
            window.location.href = notification.actionUrl;
          }
          if (browserNotification && typeof browserNotification.close === 'function') {
            browserNotification.close();
          }
        };
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create notification from WebSocket message
   */
  public createFromWebSocketMessage(message: any): string {
    const notification: Omit<NotificationData, 'id' | 'timestamp'> = {
      type: this.mapMessageTypeToNotificationType(message.type),
      priority: this.mapMessagePriorityToNotificationPriority(message.priority || 'medium'),
      title: message.title || this.getDefaultTitle(message.type),
      message: message.message || message.body || 'New update available',
      read: false,
      persistent: message.persistent !== false,
      actionUrl: message.actionUrl,
      actionLabel: message.actionLabel,
      metadata: message.metadata || {},
      userId: message.user_id,
      projectId: message.project_id,
      conversationId: message.conversation_id,
    };

    return this.addNotification(notification);
  }

  /**
   * Map WebSocket message type to notification type
   */
  private mapMessageTypeToNotificationType(messageType: string): NotificationData['type'] {
    const typeMap: Record<string, NotificationData['type']> = {
      'message': 'message',
      'project_updated': 'project',
      'task_updated': 'project',
      'team_updated': 'project',
      'payment_updated': 'payment',
      'payment_processed': 'payment',
      'notification': 'info',
      'error': 'error',
      'warning': 'warning',
      'success': 'success',
    };

    return typeMap[messageType] || 'info';
  }

  /**
   * Map message priority to notification priority
   */
  private mapMessagePriorityToNotificationPriority(messagePriority: string): NotificationData['priority'] {
    const priorityMap: Record<string, NotificationData['priority']> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent',
      'critical': 'urgent',
    };

    return priorityMap[messagePriority] || 'medium';
  }

  /**
   * Get default title for message type
   */
  private getDefaultTitle(messageType: string): string {
    const titleMap: Record<string, string> = {
      'message': 'New Message',
      'project_updated': 'Project Updated',
      'task_updated': 'Task Updated',
      'team_updated': 'Team Updated',
      'payment_updated': 'Payment Updated',
      'payment_processed': 'Payment Processed',
      'notification': 'Notification',
      'error': 'Error',
      'warning': 'Warning',
      'success': 'Success',
    };

    return titleMap[messageType] || 'Notification';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// React hook for using notification service
export function useNotifications() {
  return {
    addNotification: notificationService.addNotification.bind(notificationService),
    addNotifications: notificationService.addNotifications.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markMultipleAsRead: notificationService.markMultipleAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService),
    removeNotifications: notificationService.removeNotifications.bind(notificationService),
    clearAll: notificationService.clearAll.bind(notificationService),
    clearRead: notificationService.clearRead.bind(notificationService),
    getNotifications: notificationService.getNotifications.bind(notificationService),
    getUnreadNotifications: notificationService.getUnreadNotifications.bind(notificationService),
    getNotificationsByType: notificationService.getNotificationsByType.bind(notificationService),
    getNotificationsByPriority: notificationService.getNotificationsByPriority.bind(notificationService),
    getUnreadCount: notificationService.getUnreadCount.bind(notificationService),
    getUnreadCountByType: notificationService.getUnreadCountByType.bind(notificationService),
    subscribe: notificationService.subscribe.bind(notificationService),
    subscribeToBatch: notificationService.subscribeToBatch.bind(notificationService),
    createFromWebSocketMessage: notificationService.createFromWebSocketMessage.bind(notificationService),
  };
}

export default notificationService;