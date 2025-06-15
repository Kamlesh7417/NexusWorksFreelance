// Error logging service for production
export class ErrorLogger {
  private static instance: ErrorLogger;
  private endpoint: string = '/api/log-error';
  
  private constructor() {
    // Initialize error logging
    this.setupGlobalErrorHandlers();
  }
  
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Global unhandled error handler
      window.addEventListener('error', (event) => {
        this.logError({
          type: 'unhandled',
          message: event.message,
          stack: event.error?.stack,
          source: event.filename,
          line: event.lineno,
          column: event.colno
        });
        
        // Don't prevent default error handling
        return false;
      });
      
      // Global promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          type: 'unhandledrejection',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          reason: event.reason
        });
      });
    }
  }
  
  public async logError(error: any) {
    try {
      // In development, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorLogger]', error);
        return;
      }
      
      // In production, send to logging endpoint
      const errorData = {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        ...error
      };
      
      // Send error to backend
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        // Don't wait for response to avoid blocking
        keepalive: true
      });
    } catch (loggingError) {
      // Fallback if logging fails
      console.error('[ErrorLogger] Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }
  
  public captureException(error: Error, context?: Record<string, any>) {
    this.logError({
      type: 'exception',
      message: error.message,
      stack: error.stack,
      context
    });
  }
  
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    this.logError({
      type: 'message',
      level,
      message,
      context
    });
  }
}

// Initialize error logger
export const errorLogger = ErrorLogger.getInstance();

// Helper function to wrap async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage: string = 'An error occurred'
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.captureException(error instanceof Error ? error : new Error(String(error)));
      throw new Error(errorMessage);
    }
  };
}