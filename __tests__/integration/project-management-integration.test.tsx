import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectManager } from '@/components/console/project-manager';
import { projectService } from '@/lib/services/project-service';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';

// Mock the dependencies
jest.mock('@/lib/services/project-service');
jest.mock('@/components/auth/django-auth-provider');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the ProjectManagementConsole component
jest.mock('@/components/dashboard/project-management-console', () => ({
  ProjectManagementConsole: ({ projectId }: { projectId: string }) => (
    <div data-testid="project-management-console">
      <h2>Project Management Console</h2>
      <p>Managing project: {projectId}</p>
      <div data-testid="project-tasks">Task Management</div>
      <div data-testid="project-team">Team Management</div>
      <div data-testid="project-timeline">Timeline</div>
    </div>
  ),
}));



const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockUseDjangoAuth = useDjangoAuth as jest.MockedFunction<typeof useDjangoAuth>;

describe('Project Management Integration', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'client',
    full_name: 'Test User'
  };

  const mockProjects = [
    {
      id: '1',
      title: 'E-commerce Platform',
      description: 'Build a modern e-commerce platform with React and Node.js',
      status: 'in_progress',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      budget_range: { min: 5000, max: 10000 },
      tasks_count: 12,
      completion_percentage: 75,
      team_members_count: 4
    },
    {
      id: '2',
      title: 'Mobile App Development',
      description: 'Create a cross-platform mobile app',
      status: 'proposal_review',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      budget_range: { min: 8000, max: 15000 },
      tasks_count: 8,
      completion_percentage: 25,
      team_members_count: 2
    }
  ];

  beforeEach(() => {
    mockUseDjangoAuth.mockReturnValue({
      user: mockUser,
      profile: mockUser,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    mockProjectService.getProjects.mockResolvedValue({
      data: {
        results: mockProjects,
        count: 2,
        next: null,
        previous: null
      },
      error: null
    });

    mockProjectService.createProject.mockResolvedValue({
      data: {
        id: '3',
        title: 'New Project',
        description: 'New project description',
        status: 'analyzing',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
      },
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderProjectManager = () => {
    return render(<ProjectManager />);
  };

  it('integrates project management section into console', async () => {
    renderProjectManager();

    // Should show project management interface
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Manage your projects and collaborations')).toBeInTheDocument();
    
    // Should load and display projects
    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    // Should show project controls
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('allows navigation from project list to project console', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    });

    // Click view project button
    const viewButtons = screen.getAllByTitle('View Project');
    fireEvent.click(viewButtons[0]);

    // Should show project management console
    await waitFor(() => {
      expect(screen.getByTestId('project-management-console')).toBeInTheDocument();
      expect(screen.getByText('Project Management Console')).toBeInTheDocument();
      expect(screen.getByText(/Managing project:/)).toBeInTheDocument();
    });

    // Should show project management components
    expect(screen.getByTestId('project-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('project-team')).toBeInTheDocument();
    expect(screen.getByTestId('project-timeline')).toBeInTheDocument();
  });

  it('allows navigation back from project console to project list', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    });

    // Navigate to project console
    const viewButtons = screen.getAllByTitle('View Project');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('project-management-console')).toBeInTheDocument();
    });

    // Navigate back to project list
    const backButton = screen.getByText('Back to Projects');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.queryByTestId('project-management-console')).not.toBeInTheDocument();
    });
  });

  it('integrates project creation workflow', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    // Open create project modal
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    // Fill out project form
    const titleInput = screen.getByPlaceholderText('Enter project title...');
    const descriptionInput = screen.getByPlaceholderText('Describe your project requirements...');
    
    fireEvent.change(titleInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'New project description' } });

    // Submit form
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);

    // Should call project service
    await waitFor(() => {
      expect(mockProjectService.createProject).toHaveBeenCalledWith({
        title: 'New Project',
        description: 'New project description',
        budget_range: undefined,
        timeline_preference: undefined,
        required_skills: undefined
      });
    });
  });



  it('handles project filtering and search', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'E-commerce' } });

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.queryByText('Mobile App Development')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    // Test status filter
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    await waitFor(() => {
      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        status: 'in_progress',
        search: undefined,
        page: 1
      });
    });
  });

  it('displays project statistics and progress', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    });

    // Should show project statistics
    expect(screen.getByText('$5,000 - $10,000')).toBeInTheDocument();
    expect(screen.getByText('4 members')).toBeInTheDocument();
    expect(screen.getByText('12 tasks')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument(); // Progress

    // Should show status indicators
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Proposal Review')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    mockProjectService.getProjects.mockRejectedValue(new Error('Network error'));

    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('Error Loading Projects')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    // Test retry functionality
    mockProjectService.getProjects.mockResolvedValue({
      data: {
        results: mockProjects,
        count: 2,
        next: null,
        previous: null
      },
      error: null
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    });
  });

  it('handles empty project state', async () => {
    mockProjectService.getProjects.mockResolvedValue({
      data: {
        results: [],
        count: 0,
        next: null,
        previous: null
      },
      error: null
    });

    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
    });

    // Should show create project button
    const createButton = screen.getByText('Create Project');
    expect(createButton).toBeInTheDocument();
  });

  it('integrates with existing project management console', async () => {
    renderProjectManager();

    await waitFor(() => {
      expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    });

    // Navigate to project console
    const viewButtons = screen.getAllByTitle('View Project');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('project-management-console')).toBeInTheDocument();
    });

    // Verify integration with existing components
    expect(screen.getByTestId('project-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('project-team')).toBeInTheDocument();
    expect(screen.getByTestId('project-timeline')).toBeInTheDocument();
  });
});