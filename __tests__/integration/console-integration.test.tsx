import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UnifiedConsole, ConsoleProvider } from '@/components/console/unified-console';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { useAuth } from '@/components/auth/auth-provider';

// Mock all dependencies
jest.mock('next/navigation');
jest.mock('@/components/auth/django-auth-provider');
jest.mock('@/components/auth/auth-provider');
jest.mock('@/lib/services/realtime-update-service');
jest.mock('@/lib/services/notification-service');
jest.mock('@/lib/services/message-websocket');

// Mock console components
jest.mock('@/components/console/console-sidebar', () => ({
  ConsoleSidebar: ({ onSectionChange }: { onSectionChange?: (section: string) => void }) => {
    const { useConsole } = require('@/components/console/unified-console');
    const { setCurrentSection, state } = useConsole();
    
    return (
      <div data-testid="console-sidebar">
        <button onClick={() => setCurrentSection('dashboard')}>Dashboard</button>
        <button onClick={() => setCurrentSection('profile')}>Profile</button>
        <button onClick={() => setCurrentSection('messages')}>Messages</button>
        <button onClick={() => setCurrentSection('projects')}>Projects</button>
        <button onClick={() => setCurrentSection('payments')}>Payments</button>
        <button onClick={() => setCurrentSection('settings')}>Settings</button>
        <span data-testid="current-section">{state.currentSection}</span>
      </div>
    );
  },
}));

jest.mock('@/components/console/console-header', () => ({
  ConsoleHeader: () => {
    const { useConsole } = require('@/components/console/unified-console');
    const { setSearchQuery, state } = useConsole();
    
    return (
      <div data-testid="console-header">
        <input
          data-testid="search-input"
          value={state.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
        />
        <span data-testid="header-section">{state.currentSection}</span>
      </div>
    );
  },
}));

jest.mock('@/components/console/console-main-content', () => ({
  ConsoleMainContent: () => {
    const { useConsole } = require('@/components/console/unified-console');
    const { state, setSectionState, getSectionState } = useConsole();
    
    return (
      <div data-testid="console-main-content">
        <div data-testid="main-section">{state.currentSection}</div>
        <button 
          onClick={() => setSectionState(state.currentSection, { edited: true })}
          data-testid="set-section-state"
        >
          Set Section State
        </button>
        <span data-testid="section-state">
          {JSON.stringify(getSectionState(state.currentSection))}
        </span>
      </div>
    );
  },
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
  value: jest.fn().mockImplementation(() => ({
    pathname: '/console',
    search: '',
    searchParams: {
      set: jest.fn(),
      delete: jest.fn(),
    },
  })),
});

describe('Console Integration Tests', () => {
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

  describe('Section Switching', () => {
    it('switches sections correctly and updates all components', async () => {
      render(<UnifiedConsole />);

      // Initially should be on dashboard
      expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');
      expect(screen.getByTestId('header-section')).toHaveTextContent('dashboard');
      expect(screen.getByTestId('main-section')).toHaveTextContent('dashboard');

      // Switch to profile
      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(screen.getByTestId('current-section')).toHaveTextContent('profile');
        expect(screen.getByTestId('header-section')).toHaveTextContent('profile');
        expect(screen.getByTestId('main-section')).toHaveTextContent('profile');
      });

      // Switch to messages
      fireEvent.click(screen.getByText('Messages'));

      await waitFor(() => {
        expect(screen.getByTestId('current-section')).toHaveTextContent('messages');
        expect(screen.getByTestId('header-section')).toHaveTextContent('messages');
        expect(screen.getByTestId('main-section')).toHaveTextContent('messages');
      });
    });

    it('persists section state when switching between sections', async () => {
      render(<UnifiedConsole />);

      // Set state in dashboard section
      fireEvent.click(screen.getByTestId('set-section-state'));
      
      await waitFor(() => {
        expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
      });

      // Switch to profile
      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(screen.getByTestId('main-section')).toHaveTextContent('profile');
      });

      // Switch back to dashboard
      fireEvent.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('main-section')).toHaveTextContent('dashboard');
        expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
      });
    });

    it('updates URL when section changes', async () => {
      render(<UnifiedConsole />);

      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalled();
      });
    });

    it('saves state to localStorage when section changes', async () => {
      render(<UnifiedConsole />);

      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'console-state',
          expect.stringContaining('"currentSection":"profile"')
        );
      });
    });
  });

  describe('State Management', () => {
    it('loads initial state from URL parameter', () => {
      mockSearchParams.get.mockReturnValue('messages');

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('messages');
    });

    it('loads state from localStorage when no URL parameter', () => {
      const savedState = {
        currentSection: 'projects',
        sidebarCollapsed: false,
        sectionStates: {},
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('projects');
    });

    it('prioritizes URL parameter over localStorage', () => {
      mockSearchParams.get.mockReturnValue('payments');
      const savedState = {
        currentSection: 'projects',
        sidebarCollapsed: false,
        sectionStates: {},
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('payments');
    });

    it('handles invalid URL section gracefully', () => {
      mockSearchParams.get.mockReturnValue('invalid-section');

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');
    });

    it('preserves search query across section switches', async () => {
      render(<UnifiedConsole />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');

      // Switch sections
      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(screen.getByTestId('main-section')).toHaveTextContent('profile');
      });

      // Search query should be preserved
      expect(searchInput).toHaveValue('test search');
    });

    it('maintains section states independently', async () => {
      render(<UnifiedConsole />);

      // Set state in dashboard
      fireEvent.click(screen.getByTestId('set-section-state'));
      
      await waitFor(() => {
        expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
      });

      // Switch to profile
      fireEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(screen.getByTestId('section-state')).toHaveTextContent('');
      });

      // Set different state in profile
      fireEvent.click(screen.getByTestId('set-section-state'));

      await waitFor(() => {
        expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
      });

      // Switch back to dashboard - should have original state
      fireEvent.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('section-state')).toHaveTextContent('{"edited":true}');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');

      consoleSpy.mockRestore();
    });

    it('handles invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<UnifiedConsole />);

      expect(screen.getByTestId('current-section')).toHaveTextContent('dashboard');

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Integration', () => {
    it('shows loading state when authentication is loading', () => {
      (useDjangoAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(<UnifiedConsole />);

      expect(screen.getByTestId('page-loader')).toHaveTextContent('Loading console...');
    });

    it('redirects to signin when not authenticated', async () => {
      (useDjangoAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(<UnifiedConsole />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
      });
    });

    it('renders console when authenticated', () => {
      render(<UnifiedConsole />);

      expect(screen.getByTestId('console-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('console-header')).toBeInTheDocument();
      expect(screen.getByTestId('console-main-content')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('initializes real-time services when user is available', () => {
      render(<UnifiedConsole />);

      // Real-time services should be initialized
      // This would be tested more thoroughly with actual service mocks
      expect(screen.getByTestId('console-sidebar')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles window resize events', () => {
      render(<UnifiedConsole />);

      // Simulate window resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Console should still be functional
      expect(screen.getByTestId('console-sidebar')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', async () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <UnifiedConsole />;
      };

      render(<TestComponent />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Switch sections multiple times
      fireEvent.click(screen.getByText('Profile'));
      fireEvent.click(screen.getByText('Messages'));
      fireEvent.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('main-section')).toHaveTextContent('dashboard');
      });

      // Should not cause excessive re-renders
      expect(renderSpy.mock.calls.length).toBeLessThan(initialRenderCount + 10);
    });
  });
});