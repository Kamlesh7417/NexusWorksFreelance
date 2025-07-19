'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { WifiOff, Wifi, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, isConnected, lastOnline, connectionType } = useOnlineStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (isOnline && isConnected) {
      setDismissed(false);
    }
  }, [isOnline, isConnected]);

  // Don't show if online and connected, or if dismissed
  if ((isOnline && isConnected) || dismissed) {
    return null;
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return {
        title: 'You\'re offline',
        message: 'Check your internet connection',
        severity: 'error' as const,
      };
    }
    
    if (!isConnected) {
      return {
        title: 'Connection issues',
        message: 'Having trouble reaching our servers',
        severity: 'warning' as const,
      };
    }

    return {
      title: 'Connection unstable',
      message: 'Your connection may be slow or intermittent',
      severity: 'warning' as const,
    };
  };

  const status = getStatusMessage();

  const handleRetry = () => {
    // Force a page reload to retry connection
    window.location.reload();
  };

  return (
    <>
      {/* Floating notification */}
      <div className={cn(
        "fixed top-4 right-4 z-50 max-w-sm bg-gray-900 border rounded-lg shadow-lg transition-all duration-300",
        status.severity === 'error' ? 'border-red-500' : 'border-yellow-500'
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
              status.severity === 'error' ? 'bg-red-500/20' : 'bg-yellow-500/20'
            )}>
              {!isOnline ? (
                <WifiOff className={cn(
                  "w-4 h-4",
                  status.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                )} />
              ) : (
                <AlertTriangle className={cn(
                  "w-4 h-4",
                  status.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                )} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">
                {status.title}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {status.message}
              </p>
              
              {lastOnline && (
                <p className="text-xs text-gray-500 mt-1">
                  Last online: {lastOnline.toLocaleTimeString()}
                </p>
              )}
              
              {!showDetails && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 mt-2"
                >
                  Show details
                </button>
              )}
              
              {showDetails && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-400">
                    <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
                    <div>Server: {isConnected ? 'Connected' : 'Disconnected'}</div>
                    {connectionType && (
                      <div>Connection: {connectionType}</div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status bar indicator */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 px-4 py-2 text-center text-sm transition-all duration-300",
        status.severity === 'error' ? 'bg-red-900/90 text-red-200' : 'bg-yellow-900/90 text-yellow-200'
      )}>
        <div className="flex items-center justify-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          <span>{status.message}</span>
          {!isOnline && (
            <button
              onClick={handleRetry}
              className="ml-4 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Hook for offline-aware operations
export function useOfflineAware() {
  const { isOnline, isConnected } = useOnlineStatus();
  const [queuedOperations, setQueuedOperations] = useState<Array<() => Promise<void>>>([]);

  const isFullyConnected = isOnline && isConnected;

  // Execute queued operations when connection is restored
  useEffect(() => {
    if (isFullyConnected && queuedOperations.length > 0) {
      const executeQueue = async () => {
        for (const operation of queuedOperations) {
          try {
            await operation();
          } catch (error) {
            console.error('Failed to execute queued operation:', error);
          }
        }
        setQueuedOperations([]);
      };

      executeQueue();
    }
  }, [isFullyConnected, queuedOperations]);

  const executeWhenOnline = (operation: () => Promise<void>) => {
    if (isFullyConnected) {
      return operation();
    } else {
      setQueuedOperations(prev => [...prev, operation]);
      return Promise.reject(new Error('Operation queued for when online'));
    }
  };

  return {
    isOnline,
    isConnected,
    isFullyConnected,
    queuedOperations: queuedOperations.length,
    executeWhenOnline,
  };
}