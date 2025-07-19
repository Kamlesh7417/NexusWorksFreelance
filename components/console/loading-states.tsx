'use client';

import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Generic loading spinner
export function LoadingSpinner({ 
  size = 'md', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={cn(
      'animate-spin text-cyan-400',
      sizeClasses[size],
      className
    )} />
  );
}

// Full page loading state
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-cyan-400 text-lg">{message}</p>
      </div>
    </div>
  );
}

// Section loading state
export function SectionLoader({ 
  message = 'Loading section...', 
  height = 'h-64' 
}: { 
  message?: string; 
  height?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center', height)}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-2" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Skeleton components for different content types
export function SkeletonCard() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-800 border border-gray-700 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="w-16 h-8 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-700 p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="h-3 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="w-16 h-6 bg-gray-700 rounded"></div>
            </div>
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse">
        {/* Profile header */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
        
        {/* Form sections */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="h-5 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, fieldIndex) => (
                  <div key={fieldIndex}>
                    <div className="h-4 bg-gray-700 rounded w-1/6 mb-2"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ 
  isOnline, 
  isConnected 
}: { 
  isOnline: boolean; 
  isConnected: boolean;
}) {
  if (isOnline && isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Wifi className="w-4 h-4" />
        <span>Connected</span>
      </div>
    );
  }

  if (isOnline && !isConnected) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <Wifi className="w-4 h-4" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-400 text-sm">
      <WifiOff className="w-4 h-4" />
      <span>Offline</span>
    </div>
  );
}

// Loading overlay for forms and sections
export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children 
}: {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <LoadingSpinner className="mx-auto mb-2" />
            <p className="text-gray-300 text-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Retry button component
export function RetryButton({ 
  onRetry, 
  isLoading = false, 
  children = 'Try Again' 
}: {
  onRetry: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onRetry}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <Loader2 className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}