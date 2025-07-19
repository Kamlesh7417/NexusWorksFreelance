/**
 * Tests for Real-time Update Service
 */

import { realtimeUpdateService, RealtimeUpdate } from '@/lib/services/realtime-update-service';

// Mock WebSocket and other dependencies
jest.mock('@/lib/websocket-client', () => ({
  webSocketClient: {
    getConnectionStatus: jest.fn(() => 'connected'),
    subscribeToProject: jest.fn(),
    unsubscribeFromProject: jest.fn(),
    reconnect: jest.fn(),
  },
}));

jest.mock('@/lib/services/message-websocket', () => ({
  messageWebSocket: {
    onMessage: jest.fn(),
    onConnectionStatus: jest.fn(),
    reconnect: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    subscribeToBatch: jest.fn(() => jest.fn()),
    addNotification: jest.fn(),
  },
}));

describe('RealtimeUpdateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Update Subscription', () => {
    it('should allow subscribing to specific update types', () => {
      const handler = jest.fn();
      const unsubscribe = realtimeUpdateService.subscribe('project', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow subscribing to all update types', () => {
      const handler = jest.fn();
      const unsubscribe = realtimeUpdateService.subscribe('*', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call handlers when updates are triggered', () => {
      const handler = jest.fn();
      realtimeUpdateService.subscribe('project', handler);

      const update: Omit<RealtimeUpdate, 'timestamp'> = {
        type: 'project',
        action: 'updated',
        data: { id: '1', name: 'Test Project' },
        projectId: '1',
      };

      realtimeUpdateService.triggerUpdate(update);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          ...update,
          timestamp: expect.any(Date),
        })
      );
    });

    it('should not call handlers for different update types', () => {
      const projectHandler = jest.fn();
      const messageHandler = jest.fn();
      
      realtimeUpdateService.subscribe('project', projectHandler);
      realtimeUpdateService.subscribe('message', messageHandler);

      const update: Omit<RealtimeUpdate, 'timestamp'> = {
        type: 'project',
        action: 'updated',
        data: { id: '1' },
      };

      realtimeUpdateService.triggerUpdate(update);

      expect(projectHandler).toHaveBeenCalled();
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('Batch Updates', () => {
    it('should batch multiple updates', (done) => {
      const batchHandler = jest.fn();
      realtimeUpdateService.subscribeToBatch(batchHandler);

      // Trigger multiple updates quickly
      realtimeUpdateService.triggerUpdate({
        type: 'project',
        action: 'updated',
        data: { id: '1' },
      });

      realtimeUpdateService.triggerUpdate({
        type: 'project',
        action: 'updated',
        data: { id: '2' },
      });

      // Wait for batch processing
      setTimeout(() => {
        expect(batchHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: expect.arrayContaining([
              expect.objectContaining({ data: { id: '1' } }),
              expect.objectContaining({ data: { id: '2' } }),
            ]),
            batchId: expect.any(String),
            timestamp: expect.any(Date),
          })
        );
        done();
      }, 400); // Wait longer than batch delay
    });
  });

  describe('Project Subscription', () => {
    it('should subscribe to project-specific updates', () => {
      const handler = jest.fn();
      const unsubscribe = realtimeUpdateService.subscribeToProject('project-1', handler);

      // Trigger update for the subscribed project
      realtimeUpdateService.triggerUpdate({
        type: 'project',
        action: 'updated',
        data: { id: 'project-1' },
        projectId: 'project-1',
      });

      expect(handler).toHaveBeenCalled();

      // Trigger update for a different project
      handler.mockClear();
      realtimeUpdateService.triggerUpdate({
        type: 'project',
        action: 'updated',
        data: { id: 'project-2' },
        projectId: 'project-2',
      });

      expect(handler).not.toHaveBeenCalled();

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Conversation Subscription', () => {
    it('should subscribe to conversation-specific updates', () => {
      const handler = jest.fn();
      const unsubscribe = realtimeUpdateService.subscribeToConversation('conv-1', handler);

      // Trigger update for the subscribed conversation
      realtimeUpdateService.triggerUpdate({
        type: 'message',
        action: 'created',
        data: { id: 'msg-1' },
        conversationId: 'conv-1',
      });

      expect(handler).toHaveBeenCalled();

      // Trigger update for a different conversation
      handler.mockClear();
      realtimeUpdateService.triggerUpdate({
        type: 'message',
        action: 'created',
        data: { id: 'msg-2' },
        conversationId: 'conv-2',
      });

      expect(handler).not.toHaveBeenCalled();

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Connection Status', () => {
    it('should return connection status', () => {
      const status = realtimeUpdateService.getConnectionStatus();

      expect(status).toHaveProperty('websocket');
      expect(status).toHaveProperty('messageSocket');
      expect(status).toHaveProperty('overall');
    });
  });

  describe('Notification Creation', () => {
    it('should create notifications from updates', () => {
      const update: RealtimeUpdate = {
        type: 'project',
        action: 'updated',
        data: { id: '1', name: 'Test Project' },
        timestamp: new Date(),
        projectId: '1',
      };

      const notificationId = realtimeUpdateService.createNotificationFromUpdate(update, {
        title: 'Custom Title',
        priority: 'high',
      });

      expect(typeof notificationId).toBe('string');
    });
  });
});