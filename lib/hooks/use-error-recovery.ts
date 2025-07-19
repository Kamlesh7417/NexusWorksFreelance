'use client';

import { useState, useCallback } from 'react';
import { useOnlineStatus } from './use-online-status';

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export function useErrorRecovery(config: RetryConfig = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = config;

  const [retryCount, setRetryCount] = useState(0);
  const { isOnline } = useOnlineStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const calculateDelay = (attempt: number) => {
    const delay = baseDelay * Math.pow(backoffFactor, attempt);
    return Math.min(delay, maxDelay);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    onError?: (error: Error, attempt: number) => void
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 0);
        setRetryCount(attempt);
        
        // If offline, throw an error immediately
        if (!isOnline && attempt === 0) {
          throw new Error('Operation failed: Device is offline');
        }
        
        const result = await operation();
        
        // Success - reset state
        setRetryCount(0);
        setIsRetrying(false);
        setLastError(null);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        setLastError(lastError);
        
        if (onError) {
          onError(lastError, attempt);
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        const delay = calculateDelay(attempt);
        await sleep(delay);
      }
    }
    
    setIsRetrying(false);
    throw lastError!;
  }, [maxRetries, baseDelay, maxDelay, backoffFactor, isOnline]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    lastError,
    canRetry: retryCount < maxRetries,
    reset,
  };
}

// Hook for API calls with automatic retry
export function useApiWithRetry() {
  const { executeWithRetry, ...recovery } = useErrorRecovery({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  });

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    return executeWithRetry(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      // Handle different content types
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return await response.text() as T;
      } else {
        return await response.blob() as T;
      }
    });
  }, [executeWithRetry]);

  return {
    apiCall,
    ...recovery,
  };
}

// Hook for form submissions with retry
export function useFormWithRetry<T = any>() {
  const { executeWithRetry, ...recovery } = useErrorRecovery({
    maxRetries: 2,
    baseDelay: 500,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitForm = useCallback(async (
    submitFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await executeWithRetry(submitFn, (error, attempt) => {
        console.warn(`Form submission attempt ${attempt + 1} failed:`, error);
      });
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed';
      setSubmitError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [executeWithRetry]);

  return {
    submitForm,
    isSubmitting,
    submitError,
    clearError: () => setSubmitError(null),
    ...recovery,
  };
}