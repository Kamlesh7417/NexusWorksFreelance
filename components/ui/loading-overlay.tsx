'use client';

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}