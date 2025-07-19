/**
 * React Hook for Real-time Data Management
 * Provides easy integration with real-time updates for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeUpdates, RealtimeUpdate } from '@/lib/services/realtime-update-service';
import { useNotifications } from '@/lib/services/notification-service';

export interface RealtimeDataOptions<T> {
  initialData?: T;
  updateFilter?: (update: RealtimeUpdate) => boolean;
  dataTransformer?: (data: T, update: RealtimeUpdate) => T;
  notificationConfig?: {
    enabled: boolean;
    title?: string;
    message?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  debounceMs?: number;
}

export interface RealtimeDataState<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  connectionStatus: string;
}

export function useRealtimeData<T>(
  updateType: RealtimeUpdate['type'] | '*',
  options: RealtimeDataOptions<T> = {}
): RealtimeDataState<T> & {
  updateData: (newData: T) => void;
  refetch: () => void;
  clearError: () => void;
} {
  const {
    initialData,
    updateFilter,
    dataTransformer,
    notificationConfig,
    debounceMs = 300
  } = options;

  const [state, setState] = useState<RealtimeDataState<T>>({
    data: initialData as T,
    isLoading: false,
    error: null,
    lastUpdate: null,
    connectionStatus: 'disconnected',
  });

  const { subscribe, getConnectionStatus } = useRealtimeUpdates();
  const { addNotification } = useNotifications();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle real-time updates
  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    // Apply filter if provided
    if (updateFilter && !updateFilter(update)) {
      return;
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce updates to prevent excessive re-renders
    debounceTimeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newData = prevState.data;

        // Apply data transformer if provided
        if (dataTransformer) {
          try {
            newData = dataTransformer(prevState.data, update);
          } catch (error) {
            console.error('Error transforming data:', error);
            return {
              ...prevState,
              error: error as Error,
            };
          }
        }

        return {
          ...prevState,
          data: newData,
          lastUpdate: update.timestamp,
          error: null,
        };
      });

      // Show notification if configured
      if (notificationConfig?.enabled) {
        addNotification({
          type: 'info',
          priority: notificationConfig.priority || 'medium',
          title: notificationConfig.title || 'Data Updated',
          message: notificationConfig.message || 'Your data has been updated',
          read: false,
          persistent: false,
        });
      }
    }, debounceMs);
  }, [updateFilter, dataTransformer, notificationConfig, debounceMs, addNotification]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = subscribe(updateType, handleUpdate);
    return unsubscribe;
  }, [subscribe, updateType, handleUpdate]);

  // Monitor connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const status = getConnectionStatus();
      setState(prevState => ({
        ...prevState,
        connectionStatus: status.overall,
      }));
    };

    // Initial check
    checkConnectionStatus();

    // Check periodically
    const interval = setInterval(checkConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, [getConnectionStatus]);

  // Manual data update function
  const updateData = useCallback((newData: T) => {
    setState(prevState => ({
      ...prevState,
      data: newData,
      lastUpdate: new Date(),
      error: null,
    }));
  }, []);

  // Refetch function (placeholder for future API integration)
  const refetch = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    // In a real implementation, this would trigger a data fetch
    // For now, we'll just clear the loading state
    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
      }));
    }, 100);
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      error: null,
    }));
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    updateData,
    refetch,
    clearError,
  };
}

// Specialized hook for project data
export function useRealtimeProjectData(projectId: string, initialData?: any) {
  return useRealtimeData('project', {
    initialData,
    updateFilter: (update) => update.projectId === projectId,
    dataTransformer: (data, update) => {
      // Merge update data with existing data
      if (update.action === 'updated' && update.data) {
        return { ...data, ...update.data };
      }
      return data;
    },
    notificationConfig: {
      enabled: true,
      title: 'Project Updated',
      message: 'Your project has been updated',
      priority: 'medium',
    },
  });
}

// Specialized hook for message data
export function useRealtimeMessageData(conversationId: string, initialData?: any[]) {
  return useRealtimeData('message', {
    initialData: initialData || [],
    updateFilter: (update) => update.conversationId === conversationId,
    dataTransformer: (messages, update) => {
      if (update.action === 'created' && update.data) {
        // Add new message to the list
        return [...messages, update.data];
      }
      if (update.action === 'updated' && update.data) {
        // Update existing message
        return messages.map((msg: any) => 
          msg.id === update.data.id ? { ...msg, ...update.data } : msg
        );
      }
      return messages;
    },
    notificationConfig: {
      enabled: true,
      title: 'New Message',
      message: 'You have received a new message',
      priority: 'medium',
    },
  });
}

// Specialized hook for payment data
export function useRealtimePaymentData(projectId?: string, initialData?: any[]) {
  return useRealtimeData('payment', {
    initialData: initialData || [],
    updateFilter: (update) => !projectId || update.projectId === projectId,
    dataTransformer: (payments, update) => {
      if (update.action === 'updated' && update.data) {
        // Update payment in the list
        return payments.map((payment: any) => 
          payment.id === update.data.id ? { ...payment, ...update.data } : payment
        );
      }
      return payments;
    },
    notificationConfig: {
      enabled: true,
      title: 'Payment Updated',
      message: 'A payment has been updated',
      priority: 'high',
    },
  });
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const [status, setStatus] = useState({
    websocket: 'disconnected',
    messageSocket: 'disconnected',
    overall: 'disconnected',
  });

  const { getConnectionStatus, reconnectAll } = useRealtimeUpdates();

  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = getConnectionStatus();
      setStatus(currentStatus);
    };

    // Initial check
    checkStatus();

    // Check periodically
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [getConnectionStatus]);

  return {
    ...status,
    reconnect: reconnectAll,
    isConnected: status.overall === 'connected',
  };
}