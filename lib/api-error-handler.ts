/**
 * API Error Handler
 * Provides centralized error handling and retry logic for API calls
 */

import { APIResponse, APIError } from './api-client';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NetworkError', 'TimeoutError', 'ConnectionError'],
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000,
  monitoringPeriod: 300000,
};

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }
}

class APIErrorHandler {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;

  constructor(
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
    circuitBreakerConfig: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
  ) {
    this.retryConfig = retryConfig;
    this.circuitBreakerConfig = circuitBreakerConfig;
  }

  /**
   * Execute API call with retry logic and circuit breaker
   */
  async executeWithRetry<T>(
    operation: () => Promise<APIResponse<T>>,
    endpoint: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<APIResponse<T>> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    const circuitBreaker = this.getCircuitBreaker(endpoint);

    return circuitBreaker.execute(async () => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
          const response = await operation();
          
          // If response is successful, return it
          if (response.status >= 200 && response.status < 300) {
            return response;
          }
          
          // Check if error is retryable
          if (!this.isRetryableError(response, config)) {
            return response;
          }
          
          lastError = response;
          
          // Don't delay on the last attempt
          if (attempt < config.maxRetries) {
            await this.delay(this.calculateDelay(attempt, config));
          }
        } catch (error) {
          lastError = error;
          
          // Check if error is retryable
          if (!this.isRetryableException(error, config)) {
            throw error;
          }
          
          // Don't delay on the last attempt
          if (attempt < config.maxRetries) {
            await this.delay(this.calculateDelay(attempt, config));
          }
        }
      }
      
      // All retries exhausted
      if (lastError instanceof Error) {
        throw lastError;
      } else {
        return lastError as APIResponse<T>;
      }
    });
  }

  /**
   * Handle API errors and provide user-friendly messages
   */
  handleError(error: any): APIError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network connection error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0,
        details: error,
      };
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
        status: 408,
        details: error,
      };
    }

    // API Response errors
    if (error.status) {
      return this.handleHTTPError(error);
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      details: error,
    };
  }

  /**
   * Handle HTTP status code errors
   */
  private handleHTTPError(response: APIResponse<any>): APIError {
    const status = response.status;
    
    switch (status) {
      case 400:
        return {
          message: response.error || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          status,
          details: response.data,
        };
      
      case 401:
        return {
          message: 'Authentication required. Please log in again.',
          code: 'UNAUTHORIZED',
          status,
          details: response.data,
        };
      
      case 403:
        return {
          message: 'Access denied. You don\'t have permission for this action.',
          code: 'FORBIDDEN',
          status,
          details: response.data,
        };
      
      case 404:
        return {
          message: 'Resource not found.',
          code: 'NOT_FOUND',
          status,
          details: response.data,
        };
      
      case 409:
        return {
          message: 'Conflict. The resource already exists or is in use.',
          code: 'CONFLICT',
          status,
          details: response.data,
        };
      
      case 422:
        return {
          message: 'Validation error. Please check your input.',
          code: 'VALIDATION_ERROR',
          status,
          details: response.data,
        };
      
      case 429:
        return {
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMITED',
          status,
          details: response.data,
        };
      
      case 500:
        return {
          message: 'Server error. Please try again later.',
          code: 'INTERNAL_SERVER_ERROR',
          status,
          details: response.data,
        };
      
      case 502:
        return {
          message: 'Service temporarily unavailable. Please try again.',
          code: 'BAD_GATEWAY',
          status,
          details: response.data,
        };
      
      case 503:
        return {
          message: 'Service maintenance in progress. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          status,
          details: response.data,
        };
      
      case 504:
        return {
          message: 'Request timed out. Please try again.',
          code: 'GATEWAY_TIMEOUT',
          status,
          details: response.data,
        };
      
      default:
        return {
          message: response.error || `HTTP ${status} error occurred`,
          code: 'HTTP_ERROR',
          status,
          details: response.data,
        };
    }
  }

  /**
   * Check if an API response error is retryable
   */
  private isRetryableError(response: APIResponse<any>, config: RetryConfig): boolean {
    return config.retryableStatusCodes.includes(response.status);
  }

  /**
   * Check if an exception is retryable
   */
  private isRetryableException(error: any, config: RetryConfig): boolean {
    if (error.name && config.retryableErrors.includes(error.name)) {
      return true;
    }
    
    if (error.message) {
      return config.retryableErrors.some(retryableError => 
        error.message.toLowerCase().includes(retryableError.toLowerCase())
      );
    }
    
    return false;
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, config.maxDelay);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get or create circuit breaker for endpoint
   */
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker(this.circuitBreakerConfig));
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((breaker, endpoint) => {
      status[endpoint] = breaker.getState();
    });
    return status;
  }

  /**
   * Reset circuit breaker for endpoint
   */
  resetCircuitBreaker(endpoint: string): void {
    const breaker = this.circuitBreakers.get(endpoint);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(breaker => breaker.reset());
  }
}

// Export singleton instance
export const apiErrorHandler = new APIErrorHandler();

// Utility function to wrap API calls with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<APIResponse<T>>,
  endpoint: string,
  customRetryConfig?: Partial<RetryConfig>
): Promise<APIResponse<T>> {
  try {
    return await apiErrorHandler.executeWithRetry(operation, endpoint, customRetryConfig);
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    return {
      status: apiError.status,
      error: apiError.message,
      data: apiError.details,
    };
  }
}

export default apiErrorHandler;