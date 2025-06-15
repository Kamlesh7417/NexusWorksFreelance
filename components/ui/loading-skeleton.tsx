import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
  circle?: boolean;
  height?: string | number;
  width?: string | number;
}

export function Skeleton({
  className,
  count = 1,
  circle = false,
  height,
  width
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse bg-white/10 rounded",
            circle && "rounded-full",
            className
          )}
          style={{
            height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
            width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined
          }}
        />
      ))}
    </>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-2/3 h-6 bg-white/10 rounded"></div>
        <div className="w-1/4 h-6 bg-white/10 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="w-full h-4 bg-white/10 rounded"></div>
        <div className="w-full h-4 bg-white/10 rounded"></div>
        <div className="w-3/4 h-4 bg-white/10 rounded"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="w-20 h-6 bg-white/10 rounded-full"></div>
        <div className="w-24 h-6 bg-white/10 rounded-full"></div>
        <div className="w-16 h-6 bg-white/10 rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-8 bg-white/10 rounded"></div>
        <div className="h-8 bg-white/10 rounded"></div>
      </div>
      <div className="w-full h-10 bg-white/10 rounded-lg"></div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="flex-1">
          <div className="w-40 h-6 bg-white/10 rounded mb-2"></div>
          <div className="w-24 h-4 bg-white/10 rounded"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="w-full h-4 bg-white/10 rounded"></div>
        <div className="w-full h-4 bg-white/10 rounded"></div>
        <div className="w-3/4 h-4 bg-white/10 rounded"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="w-20 h-6 bg-white/10 rounded-full"></div>
        <div className="w-24 h-6 bg-white/10 rounded-full"></div>
        <div className="w-16 h-6 bg-white/10 rounded-full"></div>
      </div>
      <div className="w-full h-10 bg-white/10 rounded-lg"></div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3">
          <div className="w-48 h-4 bg-white/10 rounded mb-2"></div>
          <div className="w-24 h-3 bg-white/10 rounded"></div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-cyan-500/20 rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3">
          <div className="w-56 h-4 bg-white/10 rounded mb-2"></div>
          <div className="w-24 h-3 bg-white/10 rounded"></div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3">
          <div className="w-64 h-4 bg-white/10 rounded mb-2"></div>
          <div className="w-24 h-3 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="p-4 border-b border-white/10 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-full"></div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <div className="w-32 h-5 bg-white/10 rounded"></div>
            <div className="w-10 h-4 bg-white/10 rounded"></div>
          </div>
          <div className="w-48 h-4 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-8 bg-white/10 rounded"></div>
          <div className="w-64 h-5 bg-white/10 rounded"></div>
        </div>
        <div className="w-32 h-10 bg-white/10 rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-4">
            <div className="w-full h-24 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
      
      <div className="bg-white/5 rounded-lg p-6">
        <div className="w-48 h-6 bg-white/10 rounded mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-4">
              <div className="w-full h-24 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}