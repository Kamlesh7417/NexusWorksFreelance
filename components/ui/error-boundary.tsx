'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorLogger } from '@/lib/error-logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error tracking service
    errorLogger.captureException(error, { errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            
            <p className="text-gray-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
            
            <button 
              onClick={this.handleRetry}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}