'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you would send this to your error tracking service
    // Example: Sentry.captureException(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[400px] bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            We've encountered an unexpected error. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
          
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-6 text-left w-full">
              <details className="bg-black/30 p-4 rounded-lg text-sm">
                <summary className="text-red-400 cursor-pointer mb-2">Error Details (Development Only)</summary>
                <p className="text-white mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="text-gray-400 overflow-auto p-2 bg-black/50 rounded text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-[400px] bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        {error?.message || "We've encountered an unexpected error. Our team has been notified."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Refresh Page
      </button>
    </div>
  );
}