'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error tracking service
    errorLogger.captureException(error, { 
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            
            <p className="text-gray-300 mb-6">
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              
              <a 
                href="/"
                className="w-full border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                Back to Home
              </a>
            </div>
            
            {this.state.error && (
              <div className="mt-6 text-left">
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-300 transition-colors">Error Details</summary>
                  <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}