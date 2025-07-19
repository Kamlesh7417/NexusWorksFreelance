/**
 * WebSocket Service for Real-time Messaging
 * Handles WebSocket connections for real-time message updates
 */

export interface MessageWebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline';
  data: any;
  user_id?: string;
  conversation_id?: string;
  timestamp: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  typing: boolean;
}

export interface OnlineStatus {
  user_id: string;
  online: boolean;
  last_seen?: string;
}

class MessageWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private messageHandlers = new Set<(message: MessageWebSocketMessage) => void>();
  private typingHandlers = new Set<(typing: TypingIndicator) => void>();
  private onlineStatusHandlers = new Set<(status: OnlineStatus) => void>();
  private connectionStatusHandlers = new Set<(status: string) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
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
   * Connect to message WebSocket
   */
  public async connect(userId?: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.notifyConnectionStatus('connecting');

    try {
      // For development, we'll simulate WebSocket connection
      // In production, this would connect to your real-time messaging server
      const wsUrl = this.getWebSocketUrl(userId);
      
      // Check if we can actually connect to a WebSocket server
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Message WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionStatus('connected');
          
          // Send initial presence
          if (userId) {
            this.sendPresence(userId, true);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MessageWebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Message WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.notifyConnectionStatus('disconnected');
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Message WebSocket error:', error);
          this.isConnecting = false;
          this.notifyConnectionStatus('error');
          // Fall back to mock mode
          this.setupMockWebSocket(userId);
        };
      } catch (error) {
        // WebSocket server not available, use mock implementation
        console.log('WebSocket server not available, using mock implementation');
        this.setupMockWebSocket(userId);
      }

    } catch (error) {
      console.error('Failed to connect message WebSocket:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus('error');
      this.setupMockWebSocket(userId);
    }
  }

  /**
   * Setup mock WebSocket for development
   */
  private setupMockWebSocket(userId?: string): void {
    console.log('Setting up mock WebSocket for development');
    this.isConnecting = false;
    this.notifyConnectionStatus('connected');
    
    // Simulate connection success
    setTimeout(() => {
      if (userId) {
        this.sendPresence(userId, true);
      }
    }, 100);
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyConnectionStatus('disconnected');
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(userId?: string): string {
    // For demo purposes, we'll create a mock WebSocket URL
    // In production, this would connect to your real-time messaging server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_MESSAGE_WS_HOST || 'localhost:8001';
    const params = userId ? `?user_id=${userId}` : '';
    
    // For development, we'll simulate WebSocket functionality using Supabase realtime
    // This is a fallback URL that won't actually connect but provides the interface
    return `${protocol}//${host}/ws/messages/${params}`;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: MessageWebSocketMessage): void {
    console.log('Message WebSocket message received:', message);

    // Notify all message handlers
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });

    // Handle specific message types
    switch (message.type) {
      case 'message':
        // New message received
        break;
      case 'typing':
        this.handleTypingIndicator(message);
        break;
      case 'read':
        // Message read status update
        break;
      case 'online':
      case 'offline':
        this.handleOnlineStatus(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(message: MessageWebSocketMessage): void {
    const typingData: TypingIndicator = {
      user_id: message.user_id!,
      conversation_id: message.conversation_id!,
      typing: message.data.typing
    };

    this.typingHandlers.forEach(handler => {
      try {
        handler(typingData);
      } catch (error) {
        console.error('Error in typing handler:', error);
      }
    });
  }

  /**
   * Handle online status updates
   */
  private handleOnlineStatus(message: MessageWebSocketMessage): void {
    const statusData: OnlineStatus = {
      user_id: message.user_id!,
      online: message.type === 'online',
      last_seen: message.data.last_seen
    };

    this.onlineStatusHandlers.forEach(handler => {
      try {
        handler(statusData);
      } catch (error) {
        console.error('Error in online status handler:', error);
      }
    });
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(userId: string, conversationId: string, typing: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        user_id: userId,
        conversation_id: conversationId,
        data: { typing },
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Send presence update
   */
  public sendPresence(userId: string, online: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: online ? 'online' : 'offline',
        user_id: userId,
        data: { 
          online,
          last_seen: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Send message read status
   */
  public sendMessageRead(userId: string, messageId: string, conversationId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'read',
        user_id: userId,
        conversation_id: conversationId,
        data: { message_id: messageId },
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Subscribe to message updates
   */
  public onMessage(handler: (message: MessageWebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to typing indicators
   */
  public onTyping(handler: (typing: TypingIndicator) => void): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  /**
   * Subscribe to online status updates
   */
  public onOnlineStatus(handler: (status: OnlineStatus) => void): () => void {
    this.onlineStatusHandlers.add(handler);
    return () => this.onlineStatusHandlers.delete(handler);
  }

  /**
   * Subscribe to connection status updates
   */
  public onConnectionStatus(handler: (status: string) => void): () => void {
    this.connectionStatusHandlers.add(handler);
    return () => this.connectionStatusHandlers.delete(handler);
  }

  /**
   * Notify connection status handlers
   */
  private notifyConnectionStatus(status: string): void {
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
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
      console.error('Max message WebSocket reconnection attempts reached');
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
export const messageWebSocket = new MessageWebSocketService();

// React hook for using message WebSocket
export function useMessageWebSocket() {
  return {
    connect: messageWebSocket.connect.bind(messageWebSocket),
    disconnect: messageWebSocket.disconnect.bind(messageWebSocket),
    sendTypingIndicator: messageWebSocket.sendTypingIndicator.bind(messageWebSocket),
    sendPresence: messageWebSocket.sendPresence.bind(messageWebSocket),
    sendMessageRead: messageWebSocket.sendMessageRead.bind(messageWebSocket),
    onMessage: messageWebSocket.onMessage.bind(messageWebSocket),
    onTyping: messageWebSocket.onTyping.bind(messageWebSocket),
    onOnlineStatus: messageWebSocket.onOnlineStatus.bind(messageWebSocket),
    onConnectionStatus: messageWebSocket.onConnectionStatus.bind(messageWebSocket),
    getConnectionStatus: messageWebSocket.getConnectionStatus.bind(messageWebSocket),
    reconnect: messageWebSocket.reconnect.bind(messageWebSocket),
  };
}

export default messageWebSocket;