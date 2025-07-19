import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileManager } from '@/components/console/profile-manager';
import { useAuth } from '@/components/auth/auth-provider';

// Mock the auth provider
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfileManager', () => {
  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    role: 'developer' as const,
  };

  const mockProfile = {
    id: 'test-user-1',
    full_name: 'Test User',
    email: 'test@example.com',
    github_username: 'testuser',
    company: 'Test Company',
    hourly_rate: 75,
    experience_level: 'Senior',
    skills: ['React', 'TypeScript', 'Node.js'],
    bio: 'Test bio',
    location: 'Test Location',
    website: 'https://test.com',
    phone: '123-456-7890',
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signInWithDemo: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      refreshUser: jest.fn(),
      isClient: jest.fn(() => false),
      isDeveloper: jest.fn(() => true),
      isAdmin: jest.fn(() => false),
      hasRole: jest.fn(),
      getUserId: jest.fn(() => 'test-user-1'),
      getUser: jest.fn(() => mockUser),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  });

  it('renders profile management interface', () => {
    render(<ProfileManager />);
    
    expect(screen.getByText('Profile Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your profile information, skills, and portfolio')).toBeInTheDocument();
  });

  it('displays user information in form fields', () => {
    render(<ProfileManager />);
    
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
  });

  it('shows tabs for different sections', () => {
    render(<ProfileManager />);
    
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('allows adding new skills', async () => {
    render(<ProfileManager />);
    
    // Switch to skills tab
    fireEvent.click(screen.getByText('Skills'));
    
    // Add a new skill
    const skillInput = screen.getByPlaceholderText('Skill name (e.g., React, Python)');
    fireEvent.change(skillInput, { target: { value: 'Python' } });
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });
  });

  it('allows adding portfolio items', async () => {
    render(<ProfileManager />);
    
    // Switch to portfolio tab
    fireEvent.click(screen.getByText('Portfolio'));
    
    // Add a new portfolio item
    const titleInput = screen.getByPlaceholderText('Project/Item title');
    fireEvent.change(titleInput, { target: { value: 'Test Project' } });
    
    const urlInput = screen.getByPlaceholderText('URL (GitHub, live demo, article link, etc.)');
    fireEvent.change(urlInput, { target: { value: 'https://github.com/test/project' } });
    
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('shows save button and handles save action', async () => {
    render(<ProfileManager />);
    
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeInTheDocument();
    
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('shows loading state when profile is loading', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: true,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signInWithDemo: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      refreshUser: jest.fn(),
      isClient: jest.fn(() => false),
      isDeveloper: jest.fn(() => true),
      isAdmin: jest.fn(() => false),
      hasRole: jest.fn(),
      getUserId: jest.fn(() => 'test-user-1'),
      getUser: jest.fn(() => mockUser),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    render(<ProfileManager />);
    
    expect(screen.getByText('Profile Management')).toBeInTheDocument();
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows developer-specific fields for developer users', () => {
    render(<ProfileManager />);
    
    expect(screen.getByLabelText('Hourly Rate ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Experience Level')).toBeInTheDocument();
  });

  it('hides developer-specific fields for client users', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'client' },
      profile: mockProfile,
      loading: false,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signInWithDemo: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      refreshUser: jest.fn(),
      isClient: jest.fn(() => true),
      isDeveloper: jest.fn(() => false),
      isAdmin: jest.fn(() => false),
      hasRole: jest.fn(),
      getUserId: jest.fn(() => 'test-user-1'),
      getUser: jest.fn(() => mockUser),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    render(<ProfileManager />);
    
    expect(screen.queryByLabelText('Hourly Rate ($)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Experience Level')).not.toBeInTheDocument();
  });
});