/**
 * Integration Service
 * Provides unified interface for all Django backend integrations
 */

import { apiClient } from '../api-client';
import { djangoAuth } from '../auth-django';
import { realtimeSync } from '../realtime-sync';
import projectService from './project-service';
import matchingService from './matching-service';
import paymentService from './payment-service';
import communicationService from './communication-service';
import learningService from './learning-service';

export interface IntegrationStatus {
  api_connected: boolean;
  websocket_connected: boolean;
  auth_status: 'authenticated' | 'unauthenticated' | 'expired';
  last_sync: Date | null;
  pending_operations: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    api: boolean;
    websocket: boolean;
    database: boolean;
    ai_services: boolean;
  };
  response_times: {
    api: number;
    websocket: number;
  };
  last_check: Date;
}

class IntegrationService {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: HealthCheck | null = null;
  private statusListeners: Array<(status: IntegrationStatus) => void> = [];

  constructor() {
    this.startHealthChecks();
    this.setupEventListeners();
  }

  /**
   * Initialize all integrations
   */
  async initialize(): Promise<void> {
    try {
      // Initialize authentication
      await this.initializeAuth();
      
      // Initialize real-time sync
      this.initializeRealtimeSync();
      
      // Perform initial health check
      await this.performHealthCheck();
      
      console.log('Integration service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize integration service:', error);
      throw error;
    }
  }

  /**
   * Initialize authentication
   */
  private async initializeAuth(): Promise<void> {
    // Auth initialization is handled automatically by djangoAuth
    // Just verify we have a valid session
    const authState = djangoAuth.getAuthState();
    if (authState.isAuthenticated) {
      await djangoAuth.refreshUser();
    }
  }

  /**
   * Initialize real-time synchronization
   */
  private initializeRealtimeSync(): void {
    // Real-time sync is initialized automatically
    // Set up global event handlers
    realtimeSync.subscribe('*', (event) => {
      this.handleRealtimeEvent(event);
    });
  }

  /**
   * Handle real-time events globally
   */
  private handleRealtimeEvent(event: any): void {
    // Log important events
    console.log('Real-time event received:', event.type, event.data);
    
    // Handle specific event types that need global processing
    switch (event.type) {
      case 'auth_expired':
        this.handleAuthExpired();
        break;
      case 'system_maintenance':
        this.handleSystemMaintenance(event.data);
        break;
      case 'emergency_notification':
        this.handleEmergencyNotification(event.data);
        break;
    }
  }

  /**
   * Handle authentication expiration
   */
  private async handleAuthExpired(): Promise<void> {
    console.warn('Authentication expired, attempting refresh...');
    try {
      await djangoAuth.refreshUser();
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
      // Redirect to login or show notification
      window.location.href = '/auth/signin';
    }
  }

  /**
   * Handle system maintenance notifications
   */
  private handleSystemMaintenance(data: any): void {
    // Show maintenance notification to user
    const event = new CustomEvent('systemMaintenance', { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Handle emergency notifications
   */
  private handleEmergencyNotification(data: any): void {
    // Show emergency notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('System Alert', {
        body: data.message,
        icon: '/logo-nexus.jpg',
        tag: 'emergency',
        requireInteraction: true,
      });
    }
  }

  /**
   * Get current integration status
   */
  getIntegrationStatus(): IntegrationStatus {
    const authState = djangoAuth.getAuthState();
    const syncState = realtimeSync.getSyncState();

    return {
      api_connected: apiClient.isAuthenticated(),
      websocket_connected: syncState.isConnected,
      auth_status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
      last_sync: syncState.lastSync,
      pending_operations: syncState.pendingUpdates,
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity
      const apiStart = Date.now();
      const apiResponse = await apiClient.makeRequest('/health/');
      const apiTime = Date.now() - apiStart;
      const apiHealthy = apiResponse.status === 200;

      // Test WebSocket connectivity
      const wsStart = Date.now();
      const wsHealthy = realtimeSync.getSyncState().isConnected;
      const wsTime = Date.now() - wsStart;

      // Get service status from API
      const servicesResponse = await apiClient.makeRequest('/health/services/');
      const servicesHealthy = (servicesResponse.data as any) || {
        database: false,
        ai_services: false,
      };

      const healthCheck: HealthCheck = {
        status: this.calculateOverallStatus(apiHealthy, wsHealthy, servicesHealthy),
        services: {
          api: apiHealthy,
          websocket: wsHealthy,
          database: servicesHealthy.database || false,
          ai_services: servicesHealthy.ai_services || false,
        },
        response_times: {
          api: apiTime,
          websocket: wsTime,
        },
        last_check: new Date(),
      };

      this.lastHealthCheck = healthCheck;
      return healthCheck;
    } catch (error) {
      console.error('Health check failed:', error);
      
      const healthCheck: HealthCheck = {
        status: 'unhealthy',
        services: {
          api: false,
          websocket: false,
          database: false,
          ai_services: false,
        },
        response_times: {
          api: Date.now() - startTime,
          websocket: 0,
        },
        last_check: new Date(),
      };

      this.lastHealthCheck = healthCheck;
      return healthCheck;
    }
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(
    apiHealthy: boolean,
    wsHealthy: boolean,
    services: any
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const criticalServices = [apiHealthy, services.database];
    const optionalServices = [wsHealthy, services.ai_services];

    const criticalHealthy = criticalServices.every(Boolean);
    const optionalHealthy = optionalServices.every(Boolean);

    if (criticalHealthy && optionalHealthy) {
      return 'healthy';
    } else if (criticalHealthy) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Perform health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Set up global event listeners
   */
  private setupEventListeners(): void {
    // Listen for network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Network connection restored');
        this.handleNetworkReconnect();
      });

      window.addEventListener('offline', () => {
        console.log('Network connection lost');
        this.handleNetworkDisconnect();
      });
    }
  }

  /**
   * Handle network reconnection
   */
  private async handleNetworkReconnect(): Promise<void> {
    try {
      // Reconnect real-time sync
      realtimeSync.reconnect();
      
      // Refresh authentication
      await djangoAuth.refreshUser();
      
      // Perform health check
      await this.performHealthCheck();
      
      // Notify listeners
      this.notifyStatusListeners();
    } catch (error) {
      console.error('Failed to handle network reconnection:', error);
    }
  }

  /**
   * Handle network disconnection
   */
  private handleNetworkDisconnect(): void {
    // Update status
    this.notifyStatusListeners();
    
    // Show offline notification
    const event = new CustomEvent('networkDisconnected');
    window.dispatchEvent(event);
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: IntegrationStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(): void {
    const status = this.getIntegrationStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): HealthCheck | null {
    return this.lastHealthCheck;
  }

  /**
   * Force reconnection of all services
   */
  async reconnectAll(): Promise<void> {
    try {
      // Reconnect real-time sync
      realtimeSync.reconnect();
      
      // Refresh authentication
      await djangoAuth.refreshUser();
      
      // Perform health check
      await this.performHealthCheck();
      
      console.log('All services reconnected successfully');
    } catch (error) {
      console.error('Failed to reconnect services:', error);
      throw error;
    }
  }

  /**
   * Get all available services
   */
  getServices() {
    return {
      auth: djangoAuth,
      api: apiClient,
      realtime: realtimeSync,
      projects: projectService,
      matching: matchingService,
      payments: paymentService,
      communication: communicationService,
      learning: learningService,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHealthChecks();
    this.statusListeners = [];
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();

// React hook for using integration service
export function useIntegration() {
  const [status, setStatus] = React.useState<IntegrationStatus>(
    integrationService.getIntegrationStatus()
  );
  const [healthCheck, setHealthCheck] = React.useState<HealthCheck | null>(
    integrationService.getLastHealthCheck()
  );

  React.useEffect(() => {
    const unsubscribe = integrationService.onStatusChange(setStatus);
    
    // Update health check periodically
    const healthInterval = setInterval(() => {
      setHealthCheck(integrationService.getLastHealthCheck());
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(healthInterval);
    };
  }, []);

  return {
    status,
    healthCheck,
    services: integrationService.getServices(),
    reconnectAll: integrationService.reconnectAll.bind(integrationService),
    performHealthCheck: integrationService.performHealthCheck.bind(integrationService),
  };
}

// Import React for hooks
import React from 'react';

export default integrationService;