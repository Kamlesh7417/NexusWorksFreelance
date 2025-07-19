import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UnifiedConsole, ConsoleProvider, useConsole } from '@/components/console/unified-console';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { useAuth } from '@/components/auth/auth-provider';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/components/auth/django-auth-provider');
jest.mock('@/components/auth/auth-provider');
jest.mock('@/lib/services/realtime-update-service');
jest.mock('@/lib/services/notification-service');
jest.mock('@/lib/services/message-websocket');
jest.mock('@/components/console/console-sidebar', () => ({
  ConsoleSidebar: () => <div data-testid="console-sidebar">Sidebar</div>,
}));

jest.mock('@/components/console/console-header', () => ({
  ConsoleHeader: () => <div data-testid="console-header">Header</div>,
}));

jest.mock('@/components/console/console-main-content', () => ({
  ConsoleMainContent: () => <div data-testid="console-main-content">Main Content</div>,
}));

jest.mock('@/components/console/offline-indicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline</div>,
}));

jest.mock('@/components/console/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/console/loading-states', () => ({
  PageLoader: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'developer',
};

const mockProfile = {
  id: 1,
  full_name: 'Test User',
  user: 1,
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL constructor
Object.defineProperty(window, 'URL', {
  value: jest.fn().mockImplementation((url) => ({
    pathname: '/console',
    search: '',
    searchParams: {
      set: jest.fn(),
      delete: jest.fn(),
    },
  })),
});

// Test component to access console context
const TestConsoleConsumer = () => {
  const console = useConsole();
  return (
    <div>
      <span data-testid="current-section">{console.state.currentSection}</span>
      <span data-testid="sidebar-collapsed">{console.state.sidebarCollapsed.toString()}</span>
      <span data-testid="search-query">{console.state.searchQuery}</span>
      <button onClick={() => console.setCurrentSection('profile')}>Set Profile</button>
      <button onClick={() => console.toggleSidebar()}>Toggle Sidebar</button>
      <button onClick={() => console.setSearchQuery('test query')}>Set Search</button>
    </div>
  );
};

describe('UnifiedConsole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useDjangoAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      signOut: jest.fn(),
      hasRole: jest.fn().mockReturnValue(true),
    });
    mockSearchParams.get.mockReturnValue(null);
  });

  it('renders loading state when authentication is loading', () => {
    (useDjangoAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(<UnifiedConsole />);

    expect(screen.getByText('Loading console...')).toBeInTheDocument();
  });

  it('redirects to signin when user is not authenticated', async () => {
    (useDjangoAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<UnifiedConsole />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('renders authentication required message when not authenticated', () => {
    (useDjangoAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<UnifiedConsole />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access the console')).toBeInTheDocument();
  });

  it('renders console components when authenticated', () => {
    render(<UnifiedConsole />);

    // Check that main console components are rendered
    expect(screen.getByTestId('console-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('console-header')).toBeInTheDocument();
    expect(screen.getByTestId('console-main-content')).toBeInTheDocument();
  });

  it('initializes with dashboard section by default', () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');
  });

  it('initializes with section from URL parameter', () => {
    mockSearchParams.get.mockReturnValue('profile');

    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toHaveTextContent('profile');
  });

  it('loads state from localStorage', () => {
    const savedState = {
      currentSection: 'messages',
      sidebarCollapsed: true,
      sectionStates: { profile: { edited: true } },
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toHaveTextContent('messages');
    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
  });

  it('saves state to localStorage when state changes', async () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    fireEvent.click(screen.getByText('Set Profile'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'console-state',
        expect.stringContaining('"currentSection":"profile"')
      );
    });
  });

  it('updates URL when section changes', async () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    fireEvent.click(screen.getByText('Set Profile'));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled();
    });
  });

  it('handles section switching correctly', () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');

    fireEvent.click(screen.getByText('Set Profile'));

    expect(screen.getByTestId('current-section')).toHaveTextContent('profile');
  });

  it('handles sidebar toggle correctly', () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('false');

    fireEvent.click(screen.getByText('Toggle Sidebar'));

    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
  });

  it('handles search query updates correctly', () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('search-query')).toHaveTextContent('');

    fireEvent.click(screen.getByText('Set Search'));

    expect(screen.getByTestId('search-query')).toHaveTextContent('test query');
  });

  it('throws error when useConsole is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestConsoleConsumer />);
    }).toThrow('useConsole must be used within a ConsoleProvider');

    consoleSpy.mockRestore();
  });

  it('handles invalid section in URL gracefully', () => {
    mockSearchParams.get.mockReturnValue('invalid-section');

    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    // Should fall back to dashboard
    expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    // Should still render with default state
    expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');

    consoleSpy.mockRestore();
  });

  it('removes section parameter from URL for dashboard', async () => {
    mockSearchParams.get.mockReturnValue('dashboard');

    render(
      <ConsoleProvider initialSection="dashboard">
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled();
    });
  });

  it('preserves section states correctly', () => {
    const TestSectionState = () => {
      const console = useConsole();
      return (
        <div>
          <button onClick={() => console.setSectionState('profile', { edited: true })}>
            Set Section State
          </button>
          <span data-testid="section-state">
            {JSON.stringify(console.getSectionState('profile'))}
          </span>
        </div>
      );
    };

    render(
      <ConsoleProvider>
        <TestSectionState />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('section-state')).toHaveTextContent('');

    fireEvent.click(screen.getByText('Set Section State'));

    expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
  });
});

describe('ConsoleProvider', () => {
  it('provides console context to children', () => {
    render(
      <ConsoleProvider>
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-collapsed')).toBeInTheDocument();
    expect(screen.getByTestId('search-query')).toBeInTheDocument();
  });

  it('accepts initial section prop', () => {
    render(
      <ConsoleProvider initialSection="projects">
        <TestConsoleConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('current-section')).toHaveTextContent('projects');
  });

  it('handles notification management', () => {
    const TestNotifications = () => {
      const console = useConsole();
      const notification = {
        id: 'test-1',
        type: 'info' as const,
        title: 'Test',
        message: 'Test message',
        timestamp: new Date(),
        read: false,
      };

      return (
        <div>
          <button onClick={() => console.addNotification(notification)}>
            Add Notification
          </button>
          <button onClick={() => console.removeNotification('test-1')}>
            Remove Notification
          </button>
          <span data-testid="notification-count">
            {console.state.notifications.length}
          </span>
        </div>
      );
    };

    render(
      <ConsoleProvider>
        <TestNotifications />
      </ConsoleProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('Add Notification'));
    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Remove Notification'));
    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });
});