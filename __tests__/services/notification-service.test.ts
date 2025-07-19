/**
 * Tests for Notification Service
 */

import { notificationService, NotificationData } from '@/lib/services/notification-service';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Notification API
const NotificationMock = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  onclick: null,
}));
Object.defineProperty(window, 'Notification', {
  value: NotificationMock,
  configurable: true,
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    NotificationMock.permission = 'granted';
    
    // Clear all notifications before each test
    notificationService.clearAll();
  });

  describe('Adding Notifications', () => {
    it('should add a single notification', () => {
      const notification = {
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test Notification',
        message: 'This is a test',
        read: false,
        persistent: true,
      };

      const id = notificationService.addNotification(notification);

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^notification_/);
    });

    it('should add multiple notifications', () => {
      const notifications = [
        {
          type: 'info' as const,
          priority: 'medium' as const,
          title: 'Test 1',
          message: 'Message 1',
          read: false,
          persistent: true,
        },
        {
          type: 'success' as const,
          priority: 'low' as const,
          title: 'Test 2',
          message: 'Message 2',
          read: false,
          persistent: true,
        },
      ];

      const ids = notificationService.addNotifications(notifications);

      expect(ids).toHaveLength(2);
      expect(ids.every(id => typeof id === 'string')).toBe(true);
    });

    it('should show browser notification for high priority', () => {
      const notification = {
        type: 'warning' as const,
        priority: 'high' as const,
        title: 'High Priority',
        message: 'Important message',
        read: false,
        persistent: true,
      };

      notificationService.addNotification(notification);

      expect(NotificationMock).toHaveBeenCalledWith(
        'High Priority',
        expect.objectContaining({
          body: 'Important message',
          icon: '/logo-nexus.jpg',
        })
      );
    });
  });

  describe('Reading Notifications', () => {
    it('should mark notification as read', async () => {
      const notification = {
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test',
        message: 'Test message',
        read: false,
        persistent: true,
      };

      const id = notificationService.addNotification(notification);
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mark as read
      notificationService.markAsRead(id);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const notifications = notificationService.getNotifications();
      const found = notifications.find(n => n.id === id);
      expect(found?.read).toBe(true);
    });

    it('should mark all notifications as read', (done) => {
      // Add multiple notifications
      notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test 1',
        message: 'Message 1',
        read: false,
        persistent: true,
      });

      notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test 2',
        message: 'Message 2',
        read: false,
        persistent: true,
      });

      // Subscribe to changes
      const unsubscribe = notificationService.subscribe((notifications) => {
        if (notifications.length > 0 && notifications.every(n => n.read)) {
          expect(notifications.every(n => n.read)).toBe(true);
          unsubscribe();
          done();
        }
      });

      // Mark all as read after subscription
      setTimeout(() => {
        notificationService.markAllAsRead();
      }, 100);
    });
  });

  describe('Removing Notifications', () => {
    it('should remove a notification', (done) => {
      const id = notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test',
        message: 'Test message',
        read: false,
        persistent: true,
      });

      // Subscribe to changes
      const unsubscribe = notificationService.subscribe((notifications) => {
        if (notifications.length === 0) {
          expect(notifications.find(n => n.id === id)).toBeUndefined();
          unsubscribe();
          done();
        }
      });

      // Remove notification after subscription
      setTimeout(() => {
        notificationService.removeNotification(id);
      }, 100);
    });

    it('should clear all notifications', (done) => {
      // Add notifications
      notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test 1',
        message: 'Message 1',
        read: false,
        persistent: true,
      });

      notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Test 2',
        message: 'Message 2',
        read: false,
        persistent: true,
      });

      // Subscribe to changes
      const unsubscribe = notificationService.subscribe((notifications) => {
        if (notifications.length === 0) {
          expect(notifications).toHaveLength(0);
          unsubscribe();
          done();
        }
      });

      // Clear all after subscription
      setTimeout(() => {
        notificationService.clearAll();
      }, 100);
    });
  });

  describe('Filtering and Querying', () => {
    beforeEach(() => {
      // Add test notifications
      notificationService.addNotification({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Info',
        message: 'Info message',
        read: false,
        persistent: true,
      });

      notificationService.addNotification({
        type: 'error' as const,
        priority: 'high' as const,
        title: 'Error',
        message: 'Error message',
        read: true,
        persistent: true,
      });
    });

    it('should get notifications by type', () => {
      const infoNotifications = notificationService.getNotificationsByType('info');
      const errorNotifications = notificationService.getNotificationsByType('error');

      expect(infoNotifications).toHaveLength(1);
      expect(errorNotifications).toHaveLength(1);
      expect(infoNotifications[0].type).toBe('info');
      expect(errorNotifications[0].type).toBe('error');
    });

    it('should get notifications by priority', () => {
      const mediumNotifications = notificationService.getNotificationsByPriority('medium');
      const highNotifications = notificationService.getNotificationsByPriority('high');

      expect(mediumNotifications).toHaveLength(1);
      expect(highNotifications).toHaveLength(1);
      expect(mediumNotifications[0].priority).toBe('medium');
      expect(highNotifications[0].priority).toBe('high');
    });

    it('should get unread notifications', () => {
      const unreadNotifications = notificationService.getUnreadNotifications();
      
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].read).toBe(false);
    });

    it('should get unread count', () => {
      const unreadCount = notificationService.getUnreadCount();
      
      expect(unreadCount).toBe(1);
    });

    it('should get unread count by type', () => {
      const infoUnreadCount = notificationService.getUnreadCountByType('info');
      const errorUnreadCount = notificationService.getUnreadCountByType('error');
      
      expect(infoUnreadCount).toBe(1);
      expect(errorUnreadCount).toBe(0);
    });
  });

  describe('WebSocket Integration', () => {
    it('should create notification from WebSocket message', () => {
      const message = {
        type: 'project_updated',
        title: 'Project Updated',
        message: 'Your project has been updated',
        priority: 'medium',
        user_id: 'user-1',
        project_id: 'project-1',
      };

      const id = notificationService.createFromWebSocketMessage(message);

      expect(typeof id).toBe('string');
      
      const notifications = notificationService.getNotifications();
      const created = notifications.find(n => n.id === id);
      
      expect(created).toBeDefined();
      expect(created?.type).toBe('project');
      expect(created?.title).toBe('Project Updated');
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers of changes', (done) => {
      let callCount = 0;
      
      const unsubscribe = notificationService.subscribe((notifications) => {
        callCount++;
        
        if (callCount === 2) { // First call is immediate, second is after adding
          expect(notifications).toHaveLength(1);
          expect(notifications[0].title).toBe('Subscription Test');
          unsubscribe();
          done();
        }
      });

      // Add notification after subscription
      setTimeout(() => {
        notificationService.addNotification({
          type: 'info' as const,
          priority: 'medium' as const,
          title: 'Subscription Test',
          message: 'Testing subscription',
          read: false,
          persistent: true,
        });
      }, 100);
    });
  });
});