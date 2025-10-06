/**
 * Django API Error Handler
 * Provides comprehensive error handling for Django REST API responses
 */

import { APIResponse } from './api-client';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * Enhanced error handling wrapper for API operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<APIResponse<T>>,
  endpoint: string,
  retryConfig: Partial<RetryConfig> = {}
): Promise<APIResponse<T>> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // If successful or non-retryable error, return immediately
      if (result.status < 500 || attempt === config.maxAttempts) {
        return result;
      }
      
      // Server error - retry with exponential backoff
      lastError = result;
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      console.warn(`API request to ${endpoint} failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      lastError = error;
      
      // Network errors - retry
      if (attempt < config.maxAttempts && isRetryableError(error)) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );
        
        console.warn(`Network error for ${endpoint} (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Non-retryable error or max attempts reached
      return {
        status: 0,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  // Return the last error if all retries failed
  return lastError || {
    status: 0,
    error: 'All retry attempts failed',
  };
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network error
  }
  
  if (error instanceof Error && error.name === 'AbortError') {
    return true; // Timeout error
  }
  
  return false;
}

/**
 * Django-specific error message handler
 */
export class DjangoErrorHandler {
  static handleDjangoError(error: any, context: string): string {
    // Django validation errors (400)
    if (error.status === 400 && error.data) {
      if (typeof error.data === 'object') {
        // Handle field-specific validation errors
        const fieldErrors = [];
        for (const [field, messages] of Object.entries(error.data)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          return fieldErrors.join('; ');
        }
        
        // Handle non-field errors
        if (error.data.non_field_errors) {
          return Array.isArray(error.data.non_field_errors) 
            ? error.data.non_field_errors.join(', ')
            : error.data.non_field_errors;
        }
        
        // Handle detail field
        if (error.data.detail) {
          return error.data.detail;
        }
      }
      
      return error.data.message || 'Validation error occurred';
    }

    // Authentication errors (401)
    if (error.status === 401) {
      return 'Please sign in to continue';
    }

    // Permission errors (403)
    if (error.status === 403) {
      return 'You do not have permission to perform this action';
    }

    // Not found errors (404)
    if (error.status === 404) {
      return `${context} not found`;
    }

    // Method not allowed (405)
    if (error.status === 405) {
      return 'This action is not allowed';
    }

    // Conflict errors (409)
    if (error.status === 409) {
      return error.data?.detail || 'A conflict occurred with existing data';
    }

    // Rate limiting (429)
    if (error.status === 429) {
      return 'Too many requests. Please try again later.';
    }

    // Server errors (500+)
    if (error.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }

    // Network errors
    if (error.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }

    // Default fallback
    return error.message || error.error || 'An unexpected error occurred';
  }

  /**
   * Get user-friendly error message for toast notifications
   */
  static getToastMessage(error: any, context: string): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  } {
    const message = this.handleDjangoError(error, context);
    
    if (error.status === 401) {
      return {
        title: 'Authentication Required',
        message,
        type: 'warning',
      };
    }
    
    if (error.status === 403) {
      return {
        title: 'Access Denied',
        message,
        type: 'warning',
      };
    }
    
    if (error.status === 404) {
      return {
        title: 'Not Found',
        message,
        type: 'info',
      };
    }
    
    if (error.status >= 500) {
      return {
        title: 'Server Error',
        message,
        type: 'error',
      };
    }
    
    if (error.status === 0) {
      return {
        title: 'Connection Error',
        message,
        type: 'error',
      };
    }
    
    return {
      title: 'Error',
      message,
      type: 'error',
    };
  }
}

/**
 * Utility function to check if a response indicates an authentication error
 */
export function isAuthError(response: APIResponse<any>): boolean {
  return response.status === 401;
}

/**
 * Utility function to check if a response indicates a permission error
 */
export function isPermissionError(response: APIResponse<any>): boolean {
  return response.status === 403;
}

/**
 * Utility function to check if a response indicates a server error
 */
export function isServerError(response: APIResponse<any>): boolean {
  return response.status >= 500;
}

/**
 * Utility function to check if a response indicates a network error
 */
export function isNetworkError(response: APIResponse<any>): boolean {
  return response.status === 0;
}