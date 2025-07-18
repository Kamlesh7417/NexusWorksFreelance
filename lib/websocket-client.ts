/**
 * WebSocket Client for Real-time Project Updates
 * Handles WebSocket connections to Django Channels for real-time project management
 */

import { realtimeSync } from './realtime-sync';

export interface WebSocketMessage {
  type: string;
  data: any;
  project_id?: string;
  user_id?: string;
  timestamp: string;
}

export interface ProjectUpdateMessage extends WebSocketMessage {
  type: 'project_updated' | 'task_updated' | 'team_updated' | 'payment_updated';
  data: {
    project_id: string;
    update_type: string;
    changes: any;
    updated_by: string;
  };
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private subscriptions = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
      
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.ws) {
          this.connect();
        }
      });

      // Handle online/offline events
      window.addEventListener('online', () => this.connect());
      window.addEventListener('offline', () => this.disconnect());
    }
  }

  /**
   * Connect to Django Channels WebSocket
   */
  private async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token available for WebSocket connection');
        this.isConnecting = false;
        return;
      }

      const wsUrl = this.getWebSocketUrl(token);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to Django backend');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.resubscribeToChannels();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get WebSocket URL with authentication
   */
  private getWebSocketUrl(token: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_DJANGO_WS_HOST || 'localhost:8000';
    return `${protocol}//${host}/ws/projects/?token=${token}`;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received:', message);

    // Forward to realtime sync system
    realtimeSync.handleExternalMessage({
      type: message.type,
      data: message.data,
      timestamp: message.timestamp,
      user_id: message.user_id,
      project_id: message.project_id,
    });

    // Handle specific message types
    switch (message.type) {
      case 'project_updated':
        this.handleProjectUpdate(message as ProjectUpdateMessage);
        break;
      case 'task_updated':
        this.handleTaskUpdate(message as ProjectUpdateMessage);
        break;
      case 'team_updated':
        this.handleTeamUpdate(message as ProjectUpdateMessage);
        break;
      case 'payment_updated':
        this.handlePaymentUpdate(message as ProjectUpdateMessage);
        break;
      case 'notification':
        this.handleNotification(message);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Handle project updates
   */
  private handleProjectUpdate(message: ProjectUpdateMessage): void {
    // Trigger UI refresh for project data
    window.dispatchEvent(new CustomEvent('projectUpdate', {
      detail: {
        projectId: message.data.project_id,
        updateType: message.data.update_type,
        changes: message.data.changes,
        updatedBy: message.data.updated_by
      }
    }));
  }

  /**
   * Handle task updates
   */
  private handleTaskUpdate(message: ProjectUpdateMessage): void {
    // Trigger UI refresh for task data
    window.dispatchEvent(new CustomEvent('taskUpdate', {
      detail: {
        projectId: message.data.project_id,
        updateType: message.data.update_type,
        changes: message.data.changes,
        updatedBy: message.data.updated_by
      }
    }));
  }

  /**
   * Handle team updates
   */
  private handleTeamUpdate(message: ProjectUpdateMessage): void {
    // Trigger UI refresh for team data
    window.dispatchEvent(new CustomEvent('teamUpdate', {
      detail: {
        projectId: message.data.project_id,
        updateType: message.data.update_type,
        changes: message.data.changes,
        updatedBy: message.data.updated_by
      }
    }));
  }

  /**
   * Handle payment updates
   */
  private handlePaymentUpdate(message: ProjectUpdateMessage): void {
    // Trigger UI refresh for payment data
    window.dispatchEvent(new CustomEvent('paymentUpdate', {
      detail: {
        projectId: message.data.project_id,
        updateType: message.data.update_type,
        changes: message.data.changes,
        updatedBy: message.data.updated_by
      }
    }));

    // Show notification for payment events
    if (message.data.update_type === 'payment_processed') {
      this.showNotification('Payment Processed', 'A milestone payment has been processed');
    }
  }

  /**
   * Handle notifications
   */
  private handleNotification(message: WebSocketMessage): void {
    const { title, body, type } = message.data;
    this.showNotification(title, body, type);
  }

  /**
   * Show browser notification
   */
  private showNotification(title: string, body: string, type: string = 'info'): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo-nexus.jpg',
        tag: `project-${type}`,
      });
    }
  }

  /**
   * Subscribe to project updates
   */
  public subscribeToProject(projectId: string): void {
    if (this.subscriptions.has(projectId)) {
      return;
    }

    this.subscriptions.add(projectId);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        project_id: projectId,
      }));
    }
  }

  /**
   * Unsubscribe from project updates
   */
  public unsubscribeFromProject(projectId: string): void {
    if (!this.subscriptions.has(projectId)) {
      return;
    }

    this.subscriptions.delete(projectId);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        project_id: projectId,
      }));
    }
  }

  /**
   * Send message to WebSocket
   */
  public sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeToChannels(): void {
    this.subscriptions.forEach(projectId => {
      this.ws?.send(JSON.stringify({
        type: 'subscribe',
        project_id: projectId,
      }));
    });
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
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  /**
   * Force reconnection
   */
  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Export singleton instance
export const webSocketClient = new WebSocketClient();

// React hook for using WebSocket client
export function useWebSocket() {
  return {
    subscribeToProject: webSocketClient.subscribeToProject.bind(webSocketClient),
    unsubscribeFromProject: webSocketClient.unsubscribeFromProject.bind(webSocketClient),
    sendMessage: webSocketClient.sendMessage.bind(webSocketClient),
    getConnectionStatus: webSocketClient.getConnectionStatus.bind(webSocketClient),
    reconnect: webSocketClient.reconnect.bind(webSocketClient),
  };
}

export default webSocketClient;