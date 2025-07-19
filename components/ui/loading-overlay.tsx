import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <div className="nexus-loading-overlay">
      <div className="nexus-card p-8 flex flex-col items-center gap-4">
        <div className="nexus-spinner"></div>
        <span className="text-white font-medium">Loading...</span>
      </div>
    </div>
  );
}