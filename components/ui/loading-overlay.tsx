'use client';

import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
        <p className="text-cyan-400 text-lg">Loading...</p>
      </div>
    </div>
  );
}