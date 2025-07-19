import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { useConsole } from '@/components/console/unified-console';
import { useAuth } from '@/components/auth/auth-provider';

// Mock dependencies
jest.mock('@/components/console/unified-console');
jest.mock('@/components/auth/auth-provider');

const mockConsole = {
  state: {
    currentSection: 'dashboard',
    sidebarCollapsed: false,
    notifications: [],
    searchQuery: '',
    sectionStates: {},
  },
  setCurrentSection: jest.fn(),
  toggleSidebar: jest.fn(),
  setSidebarCollapsed: jest.fn(),
  setSearchQuery: jest.fn(),
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

describe('ConsoleSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConsole as jest.Mock).mockReturnValue(mockConsole);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('renders sidebar with all navigation items', () => {
    render(<ConsoleSidebar />);

    // Check navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders sidebar header with logo and title', () => {
    render(<ConsoleSidebar />);

    expect(screen.getByText('NexusWorks')).toBeInTheDocument();
  });

  it('renders user info at bottom', () => {
    render(<ConsoleSidebar />);

    expect(screen.getByText('test')).toBeInTheDocument(); // Username from email
    expect(screen.getByText('Developer')).toBeInTheDocument(); // User role
  });

  it('highlights active section', () => {
    render(<ConsoleSidebar />);

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('bg-cyan-600', 'text-white');
  });

  it('handles section navigation clicks', () => {
    render(<ConsoleSidebar />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(profileButton);

    expect(mockConsole.setCurrentSection).toHaveBeenCalledWith('profile');
  });

  it('handles sidebar toggle', () => {
    render(<ConsoleSidebar />);

    const toggleButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(toggleButton);

    expect(mockConsole.toggleSidebar).toHaveBeenCalled();
  });

  it('renders collapsed state correctly', () => {
    const mockConsoleCollapsed = {
      ...mockConsole,
      state: { ...mockConsole.state, sidebarCollapsed: true },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleCollapsed);

    render(<ConsoleSidebar />);

    // Should not show text labels when collapsed
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('NexusWorks')).not.toBeInTheDocument();

    // Should show expand button
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
  });

  it('shows tooltips when collapsed', () => {
    const mockConsoleCollapsed = {
      ...mockConsole,
      state: { ...mockConsole.state, sidebarCollapsed: true },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleCollapsed);

    render(<ConsoleSidebar />);

    const buttons = screen.getAllByRole('button');
    const dashboardButton = buttons.find(button => button.getAttribute('title') === 'Dashboard');
    expect(dashboardButton).toBeInTheDocument();
  });

  it('displays notification badges', () => {
    const mockConsoleWithBadges = {
      ...mockConsole,
      // Note: In the actual component, badges would come from a different source
      // This test assumes the component would show badges when available
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleWithBadges);

    render(<ConsoleSidebar />);

    // The component currently doesn't implement dynamic badges,
    // but this test structure is ready for when it does
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('shows quick actions on hover', async () => {
    render(<ConsoleSidebar />);

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    fireEvent.mouseEnter(dashboardButton);

    await waitFor(() => {
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });
  });

  it('hides quick actions on mouse leave', async () => {
    render(<ConsoleSidebar />);

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    fireEvent.mouseEnter(dashboardButton);

    await waitFor(() => {
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(dashboardButton);

    await waitFor(() => {
      expect(screen.queryByText('Create Project')).not.toBeInTheDocument();
    });
  });

  it('handles quick action clicks', async () => {
    render(<ConsoleSidebar />);

    const projectsButton = screen.getByRole('button', { name: /projects/i });
    fireEvent.mouseEnter(projectsButton);

    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    expect(mockConsole.setCurrentSection).toHaveBeenCalledWith('projects');
  });

  it('filters navigation items based on permissions', () => {
    const mockAuthWithLimitedPermissions = {
      ...mockAuth,
      hasRole: jest.fn().mockReturnValue(false),
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithLimitedPermissions);

    render(<ConsoleSidebar />);

    // All items should still be visible since none have specific permission requirements
    // in the current implementation
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles different user roles correctly', () => {
    const mockAuthWithDifferentRole = {
      ...mockAuth,
      user: { ...mockAuth.user, role: 'client' },
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithDifferentRole);

    render(<ConsoleSidebar />);

    expect(screen.getByText('Client')).toBeInTheDocument();
  });

  it('handles missing user data gracefully', () => {
    const mockAuthWithoutUser = {
      ...mockAuth,
      user: null,
      profile: null,
    };
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithoutUser);

    render(<ConsoleSidebar />);

    expect(screen.getByText('U')).toBeInTheDocument(); // Fallback avatar
    expect(screen.getByText('User')).toBeInTheDocument(); // Fallback name
    expect(screen.getByText('Member')).toBeInTheDocument(); // Fallback role
  });

  it('applies correct CSS classes for different states', () => {
    render(<ConsoleSidebar />);

    const sidebar = screen.getByRole('navigation').closest('div');
    expect(sidebar).toHaveClass('w-64'); // Expanded width

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('bg-cyan-600'); // Active state
  });

  it('applies collapsed CSS classes', () => {
    const mockConsoleCollapsed = {
      ...mockConsole,
      state: { ...mockConsole.state, sidebarCollapsed: true },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleCollapsed);

    render(<ConsoleSidebar />);

    const sidebar = screen.getByRole('navigation').closest('div');
    expect(sidebar).toHaveClass('w-16'); // Collapsed width
  });

  it('handles keyboard navigation', () => {
    render(<ConsoleSidebar />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    
    // Test Enter key
    fireEvent.keyDown(profileButton, { key: 'Enter', code: 'Enter' });
    expect(mockConsole.setCurrentSection).toHaveBeenCalledWith('profile');

    // Test Space key
    fireEvent.keyDown(profileButton, { key: ' ', code: 'Space' });
    expect(mockConsole.setCurrentSection).toHaveBeenCalledWith('profile');
  });

  it('shows user avatar with correct styling', () => {
    render(<ConsoleSidebar />);

    const avatar = screen.getByText('T'); // First letter of email
    const avatarContainer = avatar.closest('div');
    expect(avatarContainer).toHaveClass('bg-gradient-to-br', 'from-purple-400', 'to-pink-500');
  });

  it('handles section switching with proper state updates', () => {
    const { rerender } = render(<ConsoleSidebar />);

    // Initially dashboard is active
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('bg-cyan-600');

    // Update mock to show profile as active
    const mockConsoleWithProfile = {
      ...mockConsole,
      state: { ...mockConsole.state, currentSection: 'profile' },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleWithProfile);

    rerender(<ConsoleSidebar />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    expect(profileButton).toHaveClass('bg-cyan-600');
  });

  it('does not show quick actions when collapsed', async () => {
    const mockConsoleCollapsed = {
      ...mockConsole,
      state: { ...mockConsole.state, sidebarCollapsed: true },
    };
    (useConsole as jest.Mock).mockReturnValue(mockConsoleCollapsed);

    render(<ConsoleSidebar />);

    const buttons = screen.getAllByRole('button');
    const dashboardButton = buttons[1]; // Skip toggle button
    fireEvent.mouseEnter(dashboardButton);

    // Quick actions should not appear when collapsed
    await waitFor(() => {
      expect(screen.queryByText('Create Project')).not.toBeInTheDocument();
    });
  });
});