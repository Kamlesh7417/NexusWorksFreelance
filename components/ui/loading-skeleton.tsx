'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  return (
    <>
      {skeletons.map((index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse rounded-md bg-white/10",
            className
          )}
        />
      ))}
    </>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-white/10 rounded w-3/4"></div>
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-white/10 rounded-full"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-4 bg-white/10 rounded w-4/6"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-16 bg-white/10 rounded-full"></div>
        <div className="h-6 w-20 bg-white/10 rounded-full"></div>
        <div className="h-6 w-14 bg-white/10 rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-10 bg-white/10 rounded"></div>
        <div className="h-10 bg-white/10 rounded"></div>
      </div>
      <div className="h-10 bg-white/10 rounded w-full"></div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-6 bg-white/10 rounded w-40"></div>
          <div className="h-4 bg-white/10 rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-4 bg-white/10 rounded w-4/6"></div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <div className="h-6 w-16 bg-white/10 rounded-full"></div>
        <div className="h-6 w-20 bg-white/10 rounded-full"></div>
        <div className="h-6 w-14 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
        <div className="bg-white/10 rounded-lg p-3 w-full">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex items-start gap-3 max-w-[80%] ml-auto">
        <div className="bg-white/10 rounded-lg p-3 w-full">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-2/3"></div>
        </div>
        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
      </div>
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
        <div className="bg-white/10 rounded-lg p-3 w-full">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}