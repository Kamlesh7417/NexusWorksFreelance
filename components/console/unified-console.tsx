'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { ConsoleSidebar } from './console-sidebar';
import { ConsoleHeader } from './console-header';
import { ConsoleMainContent } from './console-main-content';
import { OfflineIndicator } from './offline-indicator';
import { ErrorBoundary } from './error-boundary';
import { PageLoader } from './loading-states';
// import { PerformanceMonitorDev } from './performance-monitor-dev';
// WebSocket imports commented out for now - will enable later
// import { useRealtimeUpdates } from '@/lib/services/realtime-update-service';
// import { useNotifications } from '@/lib/services/notification-service';
// import { messageWebSocket } from '@/lib/services/message-websocket';
// import { performanceMonitor } from '@/lib/services/performance-monitor';

// Console section types
export type ConsoleSection =
  | 'dashboard'
  | 'profile'
  | 'messages'
  | 'projects'
  | 'payments'
  | 'settings';

// Console state interface
interface ConsoleState {
  currentSection: ConsoleSection;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  searchQuery: string;
  sectionStates: Record<string, any>;
}

// Console context interface
interface ConsoleContextType {
  state: ConsoleState;
  setCurrentSection: (section: ConsoleSection) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSectionState: (section: string, state: any) => void;
  getSectionState: (section: string) => any;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

// Notification interface
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Console context
const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
}

// Console provider props
interface ConsoleProviderProps {
  children: ReactNode;
  initialSection?: ConsoleSection;
}

// Console provider component - memoized for performance
export const ConsoleProvider = memo(function ConsoleProvider({ children, initialSection = 'dashboard' }: ConsoleProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useDjangoAuth();

  const [state, setState] = useState<ConsoleState>({
    currentSection: initialSection,
    sidebarCollapsed: false,
    notifications: [],
    searchQuery: '',
    sectionStates: {},
  });

  // Initialize real-time services - commented out for now
  // const { subscribe: subscribeToUpdates, getConnectionStatus } = useRealtimeUpdates();
  // const { addNotification } = useNotifications();

  // Load state from localStorage and URL on mount
  useEffect(() => {
    // First check URL for section parameter
    const urlSection = searchParams.get('section') as ConsoleSection;
    const validSections: ConsoleSection[] = ['dashboard', 'profile', 'messages', 'projects', 'payments', 'settings'];

    let targetSection = initialSection;

    if (urlSection && validSections.includes(urlSection)) {
      targetSection = urlSection;
    } else {
      // Fall back to localStorage
      const savedState = localStorage.getItem('console-state');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.currentSection && validSections.includes(parsed.currentSection)) {
            targetSection = parsed.currentSection;
          }
        } catch (error) {
          console.error('Error loading console state:', error);
        }
      }
    }

    // Load other state from localStorage
    const savedState = localStorage.getItem('console-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          currentSection: targetSection,
          sidebarCollapsed: parsed.sidebarCollapsed || false,
          sectionStates: parsed.sectionStates || {},
        }));
      } catch (error) {
        console.error('Error loading console state:', error);
        setState(prev => ({ ...prev, currentSection: targetSection }));
      }
    } else {
      setState(prev => ({ ...prev, currentSection: targetSection }));
    }
  }, [initialSection, searchParams]);

  // Save state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      currentSection: state.currentSection,
      sidebarCollapsed: state.sidebarCollapsed,
      sectionStates: state.sectionStates,
    };
    localStorage.setItem('console-state', JSON.stringify(stateToSave));
  }, [state.currentSection, state.sidebarCollapsed, state.sectionStates]);

  // Update URL when section changes
  useEffect(() => {
    const currentUrlSection = searchParams.get('section');
    if (currentUrlSection !== state.currentSection) {
      const url = new URL(window.location.href);
      if (state.currentSection === 'dashboard') {
        // Remove section parameter for dashboard (default)
        url.searchParams.delete('section');
      } else {
        url.searchParams.set('section', state.currentSection);
      }

      // Use replace to avoid adding to browser history for every section change
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [state.currentSection, searchParams, router]);

  // Initialize real-time updates when user is available
  useEffect(() => {
    if (!user) return;

    // WebSocket and real-time features commented out for now
    console.log('Console initialized for user:', user?.username);

    // TODO: Re-enable when WebSocket server is ready
    // performanceMonitor.mark('console-init-start');
    // messageWebSocket.connect(user.id?.toString());
    // const unsubscribeUpdates = subscribeToUpdates('*', (update: any) => { ... });
    // performanceMonitor.mark('console-init-end');

    // Cleanup function (empty for now)
    return () => {
      console.log('Console cleanup');
    };
  }, [user]);

  // Monitor connection status and show notifications - commented out for now
  // useEffect(() => {
  //   const checkConnection = () => {
  //     const status = getConnectionStatus();
  //     
  //     // Show connection status notifications
  //     if (status.overall === 'disconnected') {
  //       addNotification({
  //         type: 'warning',
  //         priority: 'medium',
  //         title: 'Connection Lost',
  //         message: 'Real-time updates are temporarily unavailable',
  //         read: false,
  //         persistent: false,
  //       });
  //     }
  //   };

  //   // Check connection status periodically
  //   const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
  //   
  //   return () => clearInterval(interval);
  // }, [getConnectionStatus, addNotification]);

  // Memoized callback functions to prevent unnecessary re-renders
  const setCurrentSection = useCallback((section: ConsoleSection) => {
    // Performance monitoring commented out for now
    // const endMeasurement = performanceMonitor.measureSectionSwitch(state.currentSection, section);

    setState(prev => ({ ...prev, currentSection: section }));

    // End measurement after state update
    // setTimeout(endMeasurement, 0);
  }, [state.currentSection]);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSectionState = useCallback((section: string, sectionState: any) => {
    setState(prev => ({
      ...prev,
      sectionStates: {
        ...prev.sectionStates,
        [section]: sectionState,
      },
    }));
  }, []);

  const getSectionState = useCallback((section: string) => {
    return state.sectionStates[section];
  }, [state.sectionStates]);

  const addConsoleNotification = useCallback((notification: Notification) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: ConsoleContextType = useMemo(() => ({
    state,
    setCurrentSection,
    toggleSidebar,
    setSidebarCollapsed,
    setSearchQuery,
    setSectionState,
    getSectionState,
    addNotification: addConsoleNotification,
    removeNotification,
  }), [
    state,
    setCurrentSection,
    toggleSidebar,
    setSidebarCollapsed,
    setSearchQuery,
    setSectionState,
    getSectionState,
    addConsoleNotification,
    removeNotification,
  ]);

  return (
    <ConsoleContext.Provider value={value}>
      {children}
    </ConsoleContext.Provider>
  );
});

// Main unified console component props
interface UnifiedConsoleProps {
  initialSection?: ConsoleSection;
}

// Main unified console component
export function UnifiedConsole({ initialSection = 'dashboard' }: UnifiedConsoleProps) {
  const { user, loading, isAuthenticated } = useDjangoAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debug logging
  console.log('Console auth state:', { user: !!user, loading, isAuthenticated });

  // Get initial section from URL or use default
  const getInitialSection = (): ConsoleSection => {
    const urlSection = searchParams.get('section') as ConsoleSection;
    const validSections: ConsoleSection[] = ['dashboard', 'profile', 'messages', 'projects', 'payments', 'settings'];

    if (urlSection && validSections.includes(urlSection)) {
      return urlSection;
    }

    return initialSection;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return <PageLoader message="Loading console..." />;
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-cyan-400 mb-6">Please sign in to access the console</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary section="console">
      <ConsoleProvider initialSection={getInitialSection()}>
        <div className="min-h-screen bg-black text-white flex">
          {/* Offline indicator */}
          <OfflineIndicator />

          {/* Performance monitor (dev only) - commented out for now */}
          {/* <PerformanceMonitorDev /> */}

          {/* Sidebar */}
          <ErrorBoundary section="sidebar">
            <ConsoleSidebar />
          </ErrorBoundary>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Header */}
            <ConsoleHeader />

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
              <ConsoleMainContent />
            </main>
          </div>
        </div>
      </ConsoleProvider>
    </ErrorBoundary>
  );
}