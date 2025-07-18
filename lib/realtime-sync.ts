/**
 * Real-time Data Synchronization
 * Handles WebSocket connections and real-time updates between frontend and backend
 */

import { apiClient, Project, Task, Payment, User } from './api-client';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
  user_id?: string;
  project_id?: string;
}

export interface RealtimeSubscription {
  id: string;
  channel: string;
  callback: (event: RealtimeEvent) => void;
}

export interface SyncState {
  isConnected: boolean;
  lastSync: Date | null;
  pendingUpdates: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

class RealtimeSync {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private syncState: SyncState = {
    isConnected: false,
    lastSync: null,
    pendingUpdates: 0,
    connectionStatus: 'disconnected',
  };
  private listeners: Array<(state: SyncState) => void> = [];

  // Cache for optimistic updates
  private optimisticUpdates: Map<string, any> = new Map();
  private syncQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Only connect if real-time sync is enabled
      if (this.isRealtimeSyncEnabled()) {
        this.connect();
      }
      
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.ws && this.isRealtimeSyncEnabled()) {
          this.connect();
        }
      });

      // Handle online/offline events
      window.addEventListener('online', () => {
        if (this.isRealtimeSyncEnabled()) {
          this.connect();
        }
      });
      window.addEventListener('offline', () => this.disconnect());
    }
  }

  /**
   * Check if real-time sync is enabled via environment variables
   */
  private isRealtimeSyncEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC !== 'false';
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateSyncState({ connectionStatus: 'connecting' });

    const wsUrl = this.getWebSocketUrl();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.updateSyncState({
        isConnected: true,
        connectionStatus: 'connected',
        lastSync: new Date(),
      });
      
      this.startHeartbeat();
      this.authenticate();
      this.processQueuedUpdates();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.updateSyncState({
        isConnected: false,
        connectionStatus: 'disconnected',
      });
      
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateSyncState({ connectionStatus: 'error' });
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  /**
   * Get WebSocket URL with authentication
   */
  private getWebSocketUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_DJANGO_WS_URL || 'ws://localhost:8000/ws';
    const token = localStorage.getItem('access_token');
    return `${baseUrl}/realtime/${token ? `?token=${token}` : ''}`;
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticate(): void {
    const token = localStorage.getItem('access_token');
    if (token && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token,
      }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    const event: RealtimeEvent = {
      type: data.type,
      data: data.data,
      timestamp: data.timestamp || new Date().toISOString(),
      user_id: data.user_id,
      project_id: data.project_id,
    };

    // Update sync state
    this.updateSyncState({ lastSync: new Date() });

    // Handle different event types
    switch (event.type) {
      case 'project_updated':
        this.handleProjectUpdate(event);
        break;
      case 'task_updated':
        this.handleTaskUpdate(event);
        break;
      case 'payment_processed':
        this.handlePaymentUpdate(event);
        break;
      case 'message_received':
        this.handleMessageReceived(event);
        break;
      case 'notification':
        this.handleNotification(event);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }

    // Notify subscribers
    this.notifySubscribers(event);
  }

  /**
   * Handle project updates
   */
  private handleProjectUpdate(event: RealtimeEvent): void {
    const project = event.data as Project;
    
    // Remove optimistic update if it exists
    this.optimisticUpdates.delete(`project_${project.id}`);
    
    // Update local cache or trigger re-fetch
    this.triggerDataRefresh('projects', project.id);
  }

  /**
   * Handle task updates
   */
  private handleTaskUpdate(event: RealtimeEvent): void {
    const task = event.data as Task;
    
    // Remove optimistic update if it exists
    this.optimisticUpdates.delete(`task_${task.id}`);
    
    // Update local cache or trigger re-fetch
    this.triggerDataRefresh('tasks', task.id);
  }

  /**
   * Handle payment updates
   */
  private handlePaymentUpdate(event: RealtimeEvent): void {
    const payment = event.data as Payment;
    
    // Remove optimistic update if it exists
    this.optimisticUpdates.delete(`payment_${payment.id}`);
    
    // Update local cache or trigger re-fetch
    this.triggerDataRefresh('payments', payment.id);
  }

  /**
   * Handle new messages
   */
  private handleMessageReceived(event: RealtimeEvent): void {
    // Trigger notification or update message list
    this.triggerDataRefresh('messages', event.data.conversation_id);
  }

  /**
   * Handle notifications
   */
  private handleNotification(event: RealtimeEvent): void {
    // Show notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(event.data.title, {
        body: event.data.message,
        icon: '/logo-nexus.jpg',
      });
    }
  }

  /**
   * Trigger data refresh for specific resource
   */
  private triggerDataRefresh(resource: string, id?: string): void {
    // Emit custom event for components to listen to
    const refreshEvent = new CustomEvent('dataRefresh', {
      detail: { resource, id },
    });
    window.dispatchEvent(refreshEvent);
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(channel: string, callback: (event: RealtimeEvent) => void): string {
    const id = `${channel}_${Date.now()}_${Math.random()}`;
    const subscription: RealtimeSubscription = {
      id,
      channel,
      callback,
    };
    
    this.subscriptions.set(id, subscription);
    
    // Send subscription message to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel,
      }));
    }
    
    return id;
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      
      // Send unsubscribe message to server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe',
          channel: subscription.channel,
        }));
      }
    }
  }

  /**
   * Notify subscribers of events
   */
  private notifySubscribers(event: RealtimeEvent): void {
    this.subscriptions.forEach(subscription => {
      if (this.eventMatchesChannel(event, subscription.channel)) {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  /**
   * Check if event matches subscription channel
   */
  private eventMatchesChannel(event: RealtimeEvent, channel: string): boolean {
    // Support wildcard channels
    if (channel === '*') return true;
    
    // Support project-specific channels
    if (channel.startsWith('project_') && event.project_id) {
      return channel === `project_${event.project_id}`;
    }
    
    // Support user-specific channels
    if (channel.startsWith('user_') && event.user_id) {
      return channel === `user_${event.user_id}`;
    }
    
    // Support event type channels
    return channel === event.type;
  }

  /**
   * Perform optimistic update
   */
  optimisticUpdate<T>(key: string, data: T, syncOperation: () => Promise<void>): void {
    // Store optimistic update
    this.optimisticUpdates.set(key, data);
    
    // Add sync operation to queue
    this.syncQueue.push(async () => {
      try {
        await syncOperation();
        // Remove optimistic update on success
        this.optimisticUpdates.delete(key);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Keep optimistic update for retry
      }
    });
    
    this.processQueuedUpdates();
  }

  /**
   * Process queued sync operations
   */
  private async processQueuedUpdates(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    this.updateSyncState({ pendingUpdates: this.syncQueue.length });
    
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Failed to process sync operation:', error);
        }
      }
    }
    
    this.updateSyncState({ pendingUpdates: 0 });
    this.isProcessingQueue = false;
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  /**
   * Update sync state and notify listeners
   */
  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach(listener => {
      try {
        listener(this.syncState);
      } catch (error) {
        console.error('Error in sync state listener:', error);
      }
    });
  }

  /**
   * Subscribe to sync state changes
   */
  onSyncStateChange(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Get optimistic update data
   */
  getOptimisticUpdate<T>(key: string): T | null {
    return this.optimisticUpdates.get(key) || null;
  }

  /**
   * Clear all optimistic updates
   */
  clearOptimisticUpdates(): void {
    this.optimisticUpdates.clear();
  }

  /**
   * Handle external WebSocket messages (from Django backend)
   */
  handleExternalMessage(event: RealtimeEvent): void {
    this.handleMessage(event);
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSync();

// React hook for using real-time sync
export function useRealtimeSync() {
  const [syncState, setSyncState] = React.useState<SyncState>(realtimeSync.getSyncState());

  React.useEffect(() => {
    const unsubscribe = realtimeSync.onSyncStateChange(setSyncState);
    return unsubscribe;
  }, []);

  return {
    ...syncState,
    subscribe: realtimeSync.subscribe.bind(realtimeSync),
    unsubscribe: realtimeSync.unsubscribe.bind(realtimeSync),
    optimisticUpdate: realtimeSync.optimisticUpdate.bind(realtimeSync),
    reconnect: realtimeSync.reconnect.bind(realtimeSync),
    getOptimisticUpdate: realtimeSync.getOptimisticUpdate.bind(realtimeSync),
  };
}

// React hook for subscribing to specific channels
export function useRealtimeSubscription(
  channel: string,
  callback: (event: RealtimeEvent) => void,
  dependencies: any[] = []
) {
  React.useEffect(() => {
    const subscriptionId = realtimeSync.subscribe(channel, callback);
    
    return () => {
      realtimeSync.unsubscribe(subscriptionId);
    };
  }, [channel, ...dependencies]);
}

// Import React for hooks
import React from 'react';

export default realtimeSync;