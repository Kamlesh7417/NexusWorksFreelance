'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  count?: number;
}

export function Skeleton({ className, variant = 'default', count = 1 }: SkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={cn("bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse", className)}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded"></div>
                <div className="h-3 w-24 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/10 rounded"></div>
              <div className="h-3 w-full bg-white/10 rounded"></div>
              <div className="h-3 w-3/4 bg-white/10 rounded"></div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-24 bg-white/10 rounded-lg"></div>
              <div className="h-8 w-24 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
          </div>
        );
      case 'avatar':
        return (
          <div className={cn("w-12 h-12 bg-white/10 rounded-full animate-pulse", className)}></div>
        );
      case 'button':
        return (
          <div className={cn("h-10 w-32 bg-white/10 rounded-lg animate-pulse", className)}></div>
        );
      default:
        return (
          <div className={cn("h-6 bg-white/10 rounded animate-pulse", className)}></div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton />
          <Skeleton className="w-3/4" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton />
          <Skeleton className="w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton />
          <Skeleton className="w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="w-20 h-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton variant="text" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}