/**
 * Real-time Update Service
 * Coordinates real-time updates across the console using WebSocket connections
 */

import { webSocketClient } from '../websocket-client';
import { messageWebSocket } from './message-websocket';
import { notificationService, NotificationData } from './notification-service';

export interface RealtimeUpdate {
  type: 'project' | 'message' | 'payment' | 'team' | 'task' | 'notification';
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  data: any;
  timestamp: Date;
  userId?: string;
  projectId?: string;
  conversationId?: string;
}

export interface UpdateBatch {
  updates: RealtimeUpdate[];
  timestamp: Date;
  batchId: string;
}

class RealtimeUpdateService {
  private updateHandlers = new Map<string, Set<(update: RealtimeUpdate) => void>>();
  private batchHandlers = new Set<(batch: UpdateBatch) => void>();
  private pendingUpdates: RealtimeUpdate[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 300; // 300ms batch delay
  private isInitialized = false;
  private connectionStatus = {
    websocket: 'disconnected',
    messageSocket: 'disconnected',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize the real-time update service
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Set up WebSocket message handlers
    this.setupWebSocketHandlers();
    this.setupMessageSocketHandlers();
    
    // Set up notification integration
    this.setupNotificationIntegration();

    this.isInitialized = true;
  }

  /**
   * Set up main WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    // Listen for project updates
    window.addEventListener('projectUpdate', (event: any) => {
      const update: RealtimeUpdate = {
        type: 'project',
        action: 'updated',
        data: event.detail,
        timestamp: new Date(),
        projectId: event.detail.projectId,
        userId: event.detail.updatedBy,
      };
      this.processUpdate(update);
    });

    // Listen for task updates
    window.addEventListener('taskUpdate', (event: any) => {
      const update: RealtimeUpdate = {
        type: 'task',
        action: 'updated',
        data: event.detail,
        timestamp: new Date(),
        projectId: event.detail.projectId,
        userId: event.detail.updatedBy,
      };
      this.processUpdate(update);
    });

    // Listen for team updates
    window.addEventListener('teamUpdate', (event: any) => {
      const update: RealtimeUpdate = {
        type: 'team',
        action: 'updated',
        data: event.detail,
        timestamp: new Date(),
        projectId: event.detail.projectId,
        userId: event.detail.updatedBy,
      };
      this.processUpdate(update);
    });

    // Listen for payment updates
    window.addEventListener('paymentUpdate', (event: any) => {
      const update: RealtimeUpdate = {
        type: 'payment',
        action: 'updated',
        data: event.detail,
        timestamp: new Date(),
        projectId: event.detail.projectId,
        userId: event.detail.updatedBy,
      };
      this.processUpdate(update);
    });

    // Monitor WebSocket connection status
    const checkWebSocketStatus = () => {
      const status = webSocketClient.getConnectionStatus();
      if (this.connectionStatus.websocket !== status) {
        this.connectionStatus.websocket = status;
        this.notifyConnectionStatusChange();
      }
    };

    setInterval(checkWebSocketStatus, 5000);
  }

  /**
   * Set up message WebSocket handlers
   */
  private setupMessageSocketHandlers(): void {
    // Handle new messages
    messageWebSocket.onMessage((message) => {
      const update: RealtimeUpdate = {
        type: 'message',
        action: message.type === 'message' ? 'created' : 'updated',
        data: message.data,
        timestamp: new Date(message.timestamp),
        userId: message.user_id,
        conversationId: message.conversation_id,
      };
      this.processUpdate(update);
    });

    // Monitor message socket connection status
    messageWebSocket.onConnectionStatus((status) => {
      if (this.connectionStatus.messageSocket !== status) {
        this.connectionStatus.messageSocket = status;
        this.notifyConnectionStatusChange();
      }
    });
  }

  /**
   * Set up notification integration
   */
  private setupNotificationIntegration(): void {
    // Subscribe to notification batches to create update events
    notificationService.subscribeToBatch((batch) => {
      batch.notifications.forEach(notification => {
        const update: RealtimeUpdate = {
          type: 'notification',
          action: 'created',
          data: notification,
          timestamp: notification.timestamp,
          userId: notification.userId,
          projectId: notification.projectId,
          conversationId: notification.conversationId,
        };
        this.processUpdate(update);
      });
    });
  }

  /**
   * Process a single update
   */
  private processUpdate(update: RealtimeUpdate): void {
    // Add to pending batch
    this.pendingUpdates.push(update);
    this.scheduleBatchUpdate();

    // Immediately notify type-specific handlers
    const typeHandlers = this.updateHandlers.get(update.type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(update);
        } catch (error) {
          console.error(`Error in ${update.type} update handler:`, error);
        }
      });
    }

    // Notify all handlers
    const allHandlers = this.updateHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(update);
        } catch (error) {
          console.error('Error in global update handler:', error);
        }
      });
    }
  }

  /**
   * Schedule batch update
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
   * Process pending batch of updates
   */
  private processBatch(): void {
    if (this.pendingUpdates.length === 0) return;

    const batch: UpdateBatch = {
      updates: [...this.pendingUpdates],
      timestamp: new Date(),
      batchId: this.generateId(),
    };

    // Clear pending updates
    this.pendingUpdates = [];
    this.batchTimeout = null;

    // Notify batch handlers
    this.batchHandlers.forEach(handler => {
      try {
        handler(batch);
      } catch (error) {
        console.error('Error in batch update handler:', error);
      }
    });
  }

  /**
   * Subscribe to updates by type
   */
  public subscribe(
    type: RealtimeUpdate['type'] | '*',
    handler: (update: RealtimeUpdate) => void
  ): () => void {
    if (!this.updateHandlers.has(type)) {
      this.updateHandlers.set(type, new Set());
    }
    
    const handlers = this.updateHandlers.get(type)!;
    handlers.add(handler);

    return () => handlers.delete(handler);
  }

  /**
   * Subscribe to batch updates
   */
  public subscribeToBatch(handler: (batch: UpdateBatch) => void): () => void {
    this.batchHandlers.add(handler);
    return () => this.batchHandlers.delete(handler);
  }

  /**
   * Manually trigger an update
   */
  public triggerUpdate(update: Omit<RealtimeUpdate, 'timestamp'>): void {
    const fullUpdate: RealtimeUpdate = {
      ...update,
      timestamp: new Date(),
    };
    this.processUpdate(fullUpdate);
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { websocket: string; messageSocket: string; overall: string } {
    const overall = this.connectionStatus.websocket === 'connected' || 
                   this.connectionStatus.messageSocket === 'connected' 
                   ? 'connected' : 'disconnected';

    return {
      ...this.connectionStatus,
      overall,
    };
  }

  /**
   * Reconnect all WebSocket connections
   */
  public reconnectAll(): void {
    webSocketClient.reconnect();
    messageWebSocket.reconnect();
  }

  /**
   * Subscribe to project-specific updates
   */
  public subscribeToProject(
    projectId: string,
    handler: (update: RealtimeUpdate) => void
  ): () => void {
    // Subscribe to WebSocket project updates
    webSocketClient.subscribeToProject(projectId);

    // Create filtered handler
    const filteredHandler = (update: RealtimeUpdate) => {
      if (update.projectId === projectId) {
        handler(update);
      }
    };

    // Subscribe to all updates and filter
    const unsubscribe = this.subscribe('*', filteredHandler);

    // Return cleanup function
    return () => {
      unsubscribe();
      webSocketClient.unsubscribeFromProject(projectId);
    };
  }

  /**
   * Subscribe to conversation-specific updates
   */
  public subscribeToConversation(
    conversationId: string,
    handler: (update: RealtimeUpdate) => void
  ): () => void {
    // Create filtered handler
    const filteredHandler = (update: RealtimeUpdate) => {
      if (update.conversationId === conversationId) {
        handler(update);
      }
    };

    // Subscribe to message updates and filter
    return this.subscribe('message', filteredHandler);
  }

  /**
   * Create notification from update
   */
  public createNotificationFromUpdate(
    update: RealtimeUpdate,
    options: Partial<Omit<NotificationData, 'id' | 'timestamp'>> = {}
  ): string {
    const notification: Omit<NotificationData, 'id' | 'timestamp'> = {
      type: this.mapUpdateTypeToNotificationType(update.type),
      priority: options.priority || 'medium',
      title: options.title || this.getDefaultUpdateTitle(update),
      message: options.message || this.getDefaultUpdateMessage(update),
      read: false,
      persistent: options.persistent !== false,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      metadata: {
        ...options.metadata,
        updateType: update.type,
        updateAction: update.action,
        originalData: update.data,
      },
      userId: update.userId,
      projectId: update.projectId,
      conversationId: update.conversationId,
    };

    return notificationService.addNotification(notification);
  }

  /**
   * Map update type to notification type
   */
  private mapUpdateTypeToNotificationType(updateType: RealtimeUpdate['type']): NotificationData['type'] {
    const typeMap: Record<RealtimeUpdate['type'], NotificationData['type']> = {
      'project': 'project',
      'task': 'project',
      'team': 'project',
      'payment': 'payment',
      'message': 'message',
      'notification': 'info',
    };

    return typeMap[updateType] || 'info';
  }

  /**
   * Get default title for update
   */
  private getDefaultUpdateTitle(update: RealtimeUpdate): string {
    const titleMap: Record<string, string> = {
      'project_created': 'New Project Created',
      'project_updated': 'Project Updated',
      'task_created': 'New Task Created',
      'task_updated': 'Task Updated',
      'team_updated': 'Team Updated',
      'payment_updated': 'Payment Updated',
      'message_created': 'New Message',
    };

    const key = `${update.type}_${update.action}`;
    return titleMap[key] || `${update.type} ${update.action}`;
  }

  /**
   * Get default message for update
   */
  private getDefaultUpdateMessage(update: RealtimeUpdate): string {
    const messageMap: Record<string, string> = {
      'project_created': 'A new project has been created',
      'project_updated': 'Project details have been updated',
      'task_created': 'A new task has been added',
      'task_updated': 'Task status has been updated',
      'team_updated': 'Team composition has changed',
      'payment_updated': 'Payment status has been updated',
      'message_created': 'You have a new message',
    };

    const key = `${update.type}_${update.action}`;
    return messageMap[key] || `${update.type} has been ${update.action}`;
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionStatusChange(): void {
    const status = this.getConnectionStatus();
    
    // Create notification for connection issues
    if (status.overall === 'disconnected') {
      notificationService.addNotification({
        type: 'warning',
        priority: 'medium',
        title: 'Connection Issue',
        message: 'Real-time updates may be delayed. Attempting to reconnect...',
        read: false,
        persistent: false,
      });
    } else if (status.overall === 'connected') {
      notificationService.addNotification({
        type: 'success',
        priority: 'low',
        title: 'Connected',
        message: 'Real-time updates are now active',
        read: false,
        persistent: false,
      });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const realtimeUpdateService = new RealtimeUpdateService();

// React hook for using real-time updates
export function useRealtimeUpdates() {
  return {
    subscribe: realtimeUpdateService.subscribe.bind(realtimeUpdateService),
    subscribeToBatch: realtimeUpdateService.subscribeToBatch.bind(realtimeUpdateService),
    subscribeToProject: realtimeUpdateService.subscribeToProject.bind(realtimeUpdateService),
    subscribeToConversation: realtimeUpdateService.subscribeToConversation.bind(realtimeUpdateService),
    triggerUpdate: realtimeUpdateService.triggerUpdate.bind(realtimeUpdateService),
    getConnectionStatus: realtimeUpdateService.getConnectionStatus.bind(realtimeUpdateService),
    reconnectAll: realtimeUpdateService.reconnectAll.bind(realtimeUpdateService),
    createNotificationFromUpdate: realtimeUpdateService.createNotificationFromUpdate.bind(realtimeUpdateService),
  };
}

export default realtimeUpdateService;