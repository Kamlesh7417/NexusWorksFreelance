'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorLogger } from '@/lib/error-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error tracking service
    errorLogger.captureException(error, { componentStack: errorInfo.componentStack });
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
              <p className="text-red-400 text-sm font-mono">
                {this.state.error?.toString() || 'Unknown error'}
              </p>
            </div>
            
            <button
              onClick={this.handleReset}
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