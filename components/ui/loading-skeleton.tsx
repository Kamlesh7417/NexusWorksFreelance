'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  inline?: boolean;
}

export function LoadingSkeleton({
  className,
  count = 1,
  height = 'h-4',
  width = 'w-full',
  circle = false,
  inline = false
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-white/10 rounded',
            circle && 'rounded-full',
            height,
            width,
            inline ? 'inline-block' : 'block',
            className
          )}
          style={{ marginBottom: index < count - 1 ? '0.5rem' : '0' }}
        />
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 bg-white/10 rounded-full" />
      <div className="space-y-2">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-3 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-white/10 rounded" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-16 bg-white/10 rounded-full" />
        <div className="h-6 w-20 bg-white/10 rounded-full" />
        <div className="h-6 w-24 bg-white/10 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-8 bg-white/10 rounded" />
        <div className="h-8 bg-white/10 rounded" />
      </div>
      
      <div className="h-10 w-full bg-white/10 rounded-lg" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3">
          <div className="h-4 w-48 bg-white/20 rounded mb-2" />
          <div className="h-4 w-32 bg-white/20 rounded" />
        </div>
      </div>
      
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-cyan-500/20 rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3">
          <div className="h-4 w-56 bg-white/20 rounded mb-2" />
          <div className="h-4 w-40 bg-white/20 rounded" />
        </div>
      </div>
      
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3">
          <div className="h-4 w-64 bg-white/20 rounded mb-2" />
          <div className="h-4 w-48 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-4 border-b border-white/10 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-12 bg-white/10 rounded" />
              </div>
              <div className="h-3 w-48 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}