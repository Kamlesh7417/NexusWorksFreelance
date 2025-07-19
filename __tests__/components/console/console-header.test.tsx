import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConsoleHeader } from '@/components/console/console-header';
import { useConsole } from '@/components/console/unified-console';
import { useAuth } from '@/components/auth/auth-provider';

// Mock dependencies
jest.mock('@/components/console/unified-console');
jest.mock('@/components/auth/auth-provider');
jest.mock('@/components/console/notification-center');

const mockConsole = {
  state: {
    currentSection: 'dashboard',
    sidebarCollapsed: false,
    notifications: [],
    searchQuery: '',
    sectionStates: {},
  },
  setSearchQuery: jest.fn(),
  setCurrentSection: jest.fn(),
  toggleSidebar: jest.fn(),
  setSidebarCollapsed: jest.fn(),
  setSectionState: jest.fn(),
  getSectionState: jest.fn(),
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
};

const mockAuth = {
  user: {
    id: 1,
    email: 'test@example.com',
    role: 'developer',
  },
  profile: {
    id: 1,
    full_name: 'Test User',
    user: 1,
  },
  signOut: jest.fn(),
  hasRole: jest.fn().mockReturnValue(true),
};

// Mock NotificationCenter component
jest.mock('@/components/console/notification-center', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

describe('ConsoleHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConsole as jest.Mock).mockReturnValue(mockConsole);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('renders header with correct elements', () => {
    render(<ConsoleHeader />);

    // Check breadcrumbs
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Check search input
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    // Check notification center
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();

    // Check user menu
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('displays correct section title in breadcrumbs', () => {
    const mockConsoleWithProfile = {
      ...mockConsole,
      state: { ...mockConsole.state, currentSection: 'profile' },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleWithProfile);

    render(<ConsoleHeader />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<ConsoleHeader />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockConsole.setSearchQuery).toHaveBeenCalledWith('test search');
  });

  it('displays current search query', () => {
    const mockConsoleWithSearch = {
      ...mockConsole,
      state: { ...mockConsole.state, searchQuery: 'existing search' },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleWithSearch);

    render(<ConsoleHeader />);

    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(searchInput.value).toBe('existing search');
  });

  it('shows user avatar with correct initial', () => {
    render(<ConsoleHeader />);

    const avatar = screen.getByText('T'); // First letter of Test User's email
    expect(avatar).toBeInTheDocument();
  });

  it('shows user menu on click', async () => {
    render(<ConsoleHeader />);

    const userMenuButton = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  it('closes user menu when clicking outside', async () => {
    render(<ConsoleHeader />);

    const userMenuButton = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    // Click outside the menu
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  it('handles sign out correctly', async () => {
    render(<ConsoleHeader />);

    const userMenuButton = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('displays fallback user info when profile is not available', () => {
    const mockAuthWithoutProfile = {
      ...mockAuth,
      profile: null,
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithoutProfile);

    render(<ConsoleHeader />);

    expect(screen.getByText('test')).toBeInTheDocument(); // Email username
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('displays fallback user info when user email is not available', () => {
    const mockAuthWithoutEmail = {
      ...mockAuth,
      user: { ...mockAuth.user, email: null },
      profile: null,
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithoutEmail);

    render(<ConsoleHeader />);

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument(); // Fallback role
  });

  it('shows correct section titles for all sections', () => {
    const sections = [
      { section: 'dashboard', title: 'Dashboard' },
      { section: 'profile', title: 'Profile' },
      { section: 'messages', title: 'Messages' },
      { section: 'projects', title: 'Projects' },
      { section: 'payments', title: 'Payments' },
      { section: 'settings', title: 'Settings' },
    ];

    sections.forEach(({ section, title }) => {
      const mockConsoleWithSection = {
        ...mockConsole,
        state: { ...mockConsole.state, currentSection: section },
      };
      (useConsole as jest.Mock).mockReturnValue(mockConsoleWithSection);

      const { rerender } = render(<ConsoleHeader />);

      expect(screen.getByText(title)).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  it('handles keyboard navigation for search input', () => {
    render(<ConsoleHeader />);

    const searchInput = screen.getByPlaceholderText('Search...');
    
    // Test Enter key
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // Test Escape key
    fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });
    
    // Should not throw errors
    expect(searchInput).toBeInTheDocument();
  });

  it('renders breadcrumb navigation correctly', () => {
    render(<ConsoleHeader />);

    const breadcrumbs = screen.getAllByRole('navigation');
    expect(breadcrumbs).toHaveLength(1);

    // Check breadcrumb structure
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('handles user menu keyboard navigation', async () => {
    render(<ConsoleHeader />);

    const userMenuButton = screen.getByRole('button', { name: /test user/i });
    
    // Test Enter key to open menu
    fireEvent.keyDown(userMenuButton, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    // Test Escape key to close menu
    fireEvent.keyDown(userMenuButton, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  it('displays user email in dropdown', async () => {
    render(<ConsoleHeader />);

    const userMenuButton = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles missing user data gracefully', () => {
    const mockAuthWithoutUser = {
      ...mockAuth,
      user: null,
      profile: null,
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithoutUser);

    render(<ConsoleHeader />);

    expect(screen.getByText('U')).toBeInTheDocument(); // Fallback avatar
    expect(screen.getByText('User')).toBeInTheDocument(); // Fallback name
    expect(screen.getByText('Member')).toBeInTheDocument(); // Fallback role
  });

  it('applies correct CSS classes for styling', () => {
    render(<ConsoleHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-gray-900', 'border-b', 'border-gray-800');

    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toHaveClass('bg-gray-800', 'border', 'border-gray-700');
  });
});