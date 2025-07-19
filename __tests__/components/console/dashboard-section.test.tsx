import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConsoleMainContent } from '@/components/console/console-main-content';
import { ConsoleProvider } from '@/components/console/unified-console';
import { DjangoAuthProvider } from '@/components/auth/django-auth-provider';

// Mock the UnifiedDashboard component
jest.mock('@/components/dashboard/unified-dashboard', () => ({
  UnifiedDashboard: ({ user, profile }: { user: any; profile: any }) => (
    <div data-testid="unified-dashboard">
      <div data-testid="dashboard-user">{user?.email || 'No user'}</div>
      <div data-testid="dashboard-profile">{profile?.full_name || 'No profile'}</div>
    </div>
  ),
}));

// Mock the auth provider
jest.mock('@/components/auth/django-auth-provider', () => ({
  ...jest.requireActual('@/components/auth/django-auth-provider'),
  useDjangoAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      user_type: 'developer',
      first_name: 'Test',
      last_name: 'User',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

describe('Dashboard Section', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <DjangoAuthProvider>
        <ConsoleProvider>
          {component}
        </ConsoleProvider>
      </DjangoAuthProvider>
    );
  };

  it('renders dashboard section with unified dashboard', () => {
    renderWithProviders(<ConsoleMainContent />);
    
    // Check if the dashboard overview title is present
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    
    // Check if quick action buttons are present
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check if the unified dashboard component is rendered
    expect(screen.getByTestId('unified-dashboard')).toBeInTheDocument();
  });

  it('displays user information in welcome message', () => {
    renderWithProviders(<ConsoleMainContent />);
    
    // Check if welcome message includes user info
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  });

  it('renders unified dashboard with user data', () => {
    renderWithProviders(<ConsoleMainContent />);
    
    // Check if user data is passed to the dashboard
    expect(screen.getByTestId('dashboard-user')).toHaveTextContent('test@example.com');
  });
});