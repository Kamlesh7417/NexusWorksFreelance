'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import { useBundleMonitoring } from '@/lib/hooks/use-performance-optimization';

interface PerformanceStats {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  bundleSize: number;
  resourceCount: number;
}

// Development-only performance monitoring overlay
export function PerformanceMonitorDev() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getBundleMetrics } = useBundleMonitoring();

  // Only show in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Show performance monitor with keyboard shortcut
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update stats periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const webVitals = performanceMonitor.getCoreWebVitals();
      const bundleMetrics = getBundleMetrics();

      setStats({
        fcp: webVitals.fcp,
        lcp: webVitals.lcp,
        cls: webVitals.cls,
        fid: webVitals.fid,
        ttfb: webVitals.ttfb,
        bundleSize: bundleMetrics.totalBundleSize,
        resourceCount: bundleMetrics.resourceCount,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isVisible, getBundleMetrics]);

  if (process.env.NODE_ENV !== 'development' || !isVisible || !stats) {
    return null;
  }

  const getScoreColor = (metric: string, value: number) => {
    switch (metric) {
      case 'fcp':
        return value < 1800 ? 'text-green-400' : value < 3000 ? 'text-yellow-400' : 'text-red-400';
      case 'lcp':
        return value < 2500 ? 'text-green-400' : value < 4000 ? 'text-yellow-400' : 'text-red-400';
      case 'cls':
        return value < 0.1 ? 'text-green-400' : value < 0.25 ? 'text-yellow-400' : 'text-red-400';
      case 'fid':
        return value < 100 ? 'text-green-400' : value < 300 ? 'text-yellow-400' : 'text-red-400';
      case 'ttfb':
        return value < 800 ? 'text-green-400' : value < 1800 ? 'text-yellow-400' : 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 border border-gray-600 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Performance Monitor</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-white"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          {/* Core Web Vitals */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">FCP:</span>
              <span className={getScoreColor('fcp', stats.fcp)}>
                {stats.fcp.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">LCP:</span>
              <span className={getScoreColor('lcp', stats.lcp)}>
                {stats.lcp.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CLS:</span>
              <span className={getScoreColor('cls', stats.cls)}>
                {stats.cls.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">FID:</span>
              <span className={getScoreColor('fid', stats.fid)}>
                {stats.fid.toFixed(0)}ms
              </span>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">TTFB:</span>
                  <span className={getScoreColor('ttfb', stats.ttfb)}>
                    {stats.ttfb.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bundle:</span>
                  <span className="text-gray-300">
                    {(stats.bundleSize / 1024).toFixed(1)}KB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resources:</span>
                  <span className="text-gray-300">{stats.resourceCount}</span>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-2 mt-2">
                <button
                  onClick={() => performanceMonitor.logPerformanceSummary()}
                  className="w-full text-xs bg-cyan-600 hover:bg-cyan-700 text-white py-1 px-2 rounded transition-colors"
                >
                  Log Full Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-3 pb-2 text-xs text-gray-500">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

// Hook to enable performance monitoring in development
export function useDevPerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring enabled. Press Ctrl+Shift+P to view stats.');
    }
  }, []);

  return process.env.NODE_ENV === 'development';
}