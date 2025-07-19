'use client';

// Performance monitoring service for the console
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceEntry[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initialize() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    this.isEnabled = true;

    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor paint timing
    this.observePaintTiming();
    
    // Monitor layout shifts
    this.observeLayoutShifts();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeNavigationTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.storeMetrics('navigation', entries);
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observation not supported:', error);
    }
  }

  private observeResourceTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.storeMetrics('resource', entries);
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observation not supported:', error);
    }
  }

  private observePaintTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.storeMetrics('paint', entries);
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Paint timing observation not supported:', error);
    }
  }

  private observeLayoutShifts() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.storeMetrics('layout-shift', entries);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift observation not supported:', error);
    }
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.storeMetrics('longtask', entries);
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observation not supported:', error);
    }
  }

  private storeMetrics(type: string, entries: PerformanceEntry[]) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const existing = this.metrics.get(type)!;
    existing.push(...entries);
    
    // Keep only the last 100 entries to prevent memory leaks
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
  }

  // Mark custom performance events
  public mark(name: string) {
    if (!this.isEnabled) return;
    
    try {
      performance.mark(name);
    } catch (error) {
      console.warn('Performance mark failed:', error);
    }
  }

  // Measure time between marks
  public measure(name: string, startMark: string, endMark?: string) {
    if (!this.isEnabled) return;
    
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  // Get performance metrics
  public getMetrics(type?: string): PerformanceEntry[] {
    if (type) {
      return this.metrics.get(type) || [];
    }
    
    const allMetrics: PerformanceEntry[] = [];
    this.metrics.forEach(entries => allMetrics.push(...entries));
    return allMetrics;
  }

  // Get Core Web Vitals
  public getCoreWebVitals() {
    const paintEntries = this.getMetrics('paint');
    const layoutShiftEntries = this.getMetrics('layout-shift');
    const navigationEntries = this.getMetrics('navigation');

    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    const lcp = this.getLargestContentfulPaint();
    const cls = this.getCumulativeLayoutShift(layoutShiftEntries);
    const fid = this.getFirstInputDelay();

    return {
      fcp: fcp?.startTime || 0,
      lcp: lcp || 0,
      cls: cls || 0,
      fid: fid || 0,
      ttfb: (navigationEntries[0] as any)?.responseStart || 0,
    };
  }

  private getLargestContentfulPaint(): number {
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
    } catch {
      return 0;
    }
  }

  private getCumulativeLayoutShift(entries: PerformanceEntry[]): number {
    let cls = 0;
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
    });
    return cls;
  }

  private getFirstInputDelay(): number {
    try {
      const fidEntries = performance.getEntriesByType('first-input');
      return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : 0;
    } catch {
      return 0;
    }
  }

  // Get bundle size information
  public getBundleMetrics() {
    const resourceEntries = this.getMetrics('resource');
    const jsResources = resourceEntries.filter(entry => 
      entry.name.includes('.js') || entry.name.includes('/_next/static/')
    );

    const totalSize = jsResources.reduce((sum, entry: any) => {
      return sum + (entry.transferSize || 0);
    }, 0);

    return {
      totalBundleSize: totalSize,
      resourceCount: jsResources.length,
      resources: jsResources.map((entry: any) => ({
        name: entry.name,
        size: entry.transferSize || 0,
        duration: entry.duration,
      })),
    };
  }

  // Log performance summary
  public logPerformanceSummary() {
    if (!this.isEnabled) return;

    const webVitals = this.getCoreWebVitals();
    const bundleMetrics = this.getBundleMetrics();

    console.group('🚀 Console Performance Summary');
    console.log('Core Web Vitals:', {
      'First Contentful Paint': `${webVitals.fcp.toFixed(2)}ms`,
      'Largest Contentful Paint': `${webVitals.lcp.toFixed(2)}ms`,
      'Cumulative Layout Shift': webVitals.cls.toFixed(4),
      'First Input Delay': `${webVitals.fid.toFixed(2)}ms`,
      'Time to First Byte': `${webVitals.ttfb.toFixed(2)}ms`,
    });
    console.log('Bundle Metrics:', {
      'Total Bundle Size': `${(bundleMetrics.totalBundleSize / 1024).toFixed(2)} KB`,
      'Resource Count': bundleMetrics.resourceCount,
    });
    console.groupEnd();
  }

  // Monitor section switching performance
  public measureSectionSwitch(fromSection: string, toSection: string) {
    const markName = `section-switch-${fromSection}-to-${toSection}`;
    this.mark(`${markName}-start`);
    
    // Return a function to end the measurement
    return () => {
      this.mark(`${markName}-end`);
      this.measure(markName, `${markName}-start`, `${markName}-end`);
    };
  }

  // Clean up observers
  public dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook for React components
export function usePerformanceMonitor() {
  return {
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getCoreWebVitals: performanceMonitor.getCoreWebVitals.bind(performanceMonitor),
    measureSectionSwitch: performanceMonitor.measureSectionSwitch.bind(performanceMonitor),
    logSummary: performanceMonitor.logPerformanceSummary.bind(performanceMonitor),
  };
}