'use client';

import { useState, useEffect } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastOnline: Date | null;
  connectionType: string | null;
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    lastOnline: null,
    connectionType: null,
  });

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      const now = new Date();
      
      setStatus(prev => ({
        ...prev,
        isOnline,
        lastOnline: !isOnline ? now : prev.lastOnline,
      }));
    };

    const updateConnectionInfo = () => {
      // Get connection information if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setStatus(prev => ({
          ...prev,
          connectionType: connection.effectiveType || connection.type || null,
        }));
      }
    };

    // Test actual connectivity by making a request
    const testConnectivity = async () => {
      if (!navigator.onLine) {
        setStatus(prev => ({ ...prev, isConnected: false }));
        return;
      }

      try {
        // Try to fetch a small resource to test connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
        });
        
        clearTimeout(timeoutId);
        
        setStatus(prev => ({
          ...prev,
          isConnected: response.ok,
        }));
      } catch (error) {
        setStatus(prev => ({ ...prev, isConnected: false }));
      }
    };

    // Initial setup
    updateOnlineStatus();
    updateConnectionInfo();
    testConnectivity();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Connection change listener (if supported)
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Periodic connectivity test
    const connectivityInterval = setInterval(testConnectivity, 30000); // Test every 30 seconds

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
      
      clearInterval(connectivityInterval);
    };
  }, []);

  return status;
}