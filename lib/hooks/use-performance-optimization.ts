'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { performanceMonitor } from '@/lib/services/performance-monitor';

// Hook for optimizing component performance
export function usePerformanceOptimization(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    mountTimeRef.current = performance.now();
    performanceMonitor.mark(`${componentName}-mount`);
    
    return () => {
      const unmountTime = performance.now();
      performanceMonitor.mark(`${componentName}-unmount`);
      performanceMonitor.measure(
        `${componentName}-lifetime`,
        `${componentName}-mount`,
        `${componentName}-unmount`
      );
    };
  }, [componentName]);

  // Track render count
  useEffect(() => {
    renderCountRef.current += 1;
    performanceMonitor.mark(`${componentName}-render-${renderCountRef.current}`);
  });

  // Debounced function factory
  const createDebouncedCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T, delay: number = 300): T => {
      const timeoutRef = useRef<NodeJS.Timeout>();
      
      return ((...args: any[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      }) as T;
    },
    []
  );

  // Throttled function factory
  const createThrottledCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T, delay: number = 100): T => {
      const lastCallRef = useRef<number>(0);
      
      return ((...args: any[]) => {
        const now = Date.now();
        if (now - lastCallRef.current >= delay) {
          lastCallRef.current = now;
          callback(...args);
        }
      }) as T;
    },
    []
  );

  // Memoized value factory with performance tracking
  const createMemoizedValue = useCallback(
    <T>(factory: () => T, deps: React.DependencyList, name?: string): T => {
      const memoName = name || `${componentName}-memo`;
      
      return useMemo(() => {
        performanceMonitor.mark(`${memoName}-start`);
        const result = factory();
        performanceMonitor.mark(`${memoName}-end`);
        performanceMonitor.measure(memoName, `${memoName}-start`, `${memoName}-end`);
        return result;
      }, deps);
    },
    [componentName]
  );

  // Performance metrics for the component
  const getComponentMetrics = useCallback(() => {
    return {
      renderCount: renderCountRef.current,
      mountTime: mountTimeRef.current,
      currentTime: performance.now(),
      lifetime: performance.now() - mountTimeRef.current,
    };
  }, []);

  return {
    createDebouncedCallback,
    createThrottledCallback,
    createMemoizedValue,
    getComponentMetrics,
    renderCount: renderCountRef.current,
  };
}

// Hook for monitoring expensive operations
export function useExpensiveOperation(operationName: string) {
  const startOperation = useCallback(() => {
    performanceMonitor.mark(`${operationName}-start`);
    return () => {
      performanceMonitor.mark(`${operationName}-end`);
      performanceMonitor.measure(operationName, `${operationName}-start`, `${operationName}-end`);
    };
  }, [operationName]);

  return { startOperation };
}

// Hook for lazy loading with intersection observer
export function useLazyLoading(threshold: number = 0.1) {
  const elementRef = useRef<HTMLElement>(null);
  const isVisibleRef = useRef(false);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            isVisibleRef.current = true;
            performanceMonitor.mark('lazy-load-visible');
          }
        });
      },
      { threshold }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold]);

  return {
    ref: elementRef,
    isVisible: isVisibleRef.current,
  };
}

// Hook for virtual scrolling optimization
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const scrollTopRef = useRef(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTopRef.current / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTopRef.current + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const updateScrollTop = useCallback((scrollTop: number) => {
    scrollTopRef.current = scrollTop;
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    updateScrollTop,
    visibleRange,
  };
}

// Hook for bundle size monitoring
export function useBundleMonitoring() {
  useEffect(() => {
    // Monitor bundle loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('/_next/static/chunks/')) {
          performanceMonitor.mark(`chunk-loaded-${entry.name.split('/').pop()}`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Bundle monitoring not supported:', error);
    }

    return () => observer.disconnect();
  }, []);

  const getBundleMetrics = useCallback(() => {
    return performanceMonitor.getBundleMetrics();
  }, []);

  return { getBundleMetrics };
}