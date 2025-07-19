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
    <div data-testid="project-console">Project Console for {projectId}</div>
  ),
}));

const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockUseDjangoAuth = useDjangoAuth as jest.MockedFunction<typeof useDjangoAuth>;

describe('ProjectManager', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'client',
    full_name: 'Test User'
  };

  const mockProjects = [
    {
      id: '1',
      title: 'Test Project 1',
      description: 'A test project description',
      status: 'in_progress',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      budget_range: { min: 5000, max: 10000 },
      tasks_count: 5,
      completion_percentage: 60,
      team_members_count: 3
    },
    {
      id: '2',
      title: 'Test Project 2',
      description: 'Another test project',
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      budget_range: { min: 3000, max: 5000 },
      tasks_count: 8,
      completion_percentage: 100,
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders project manager with header and controls', async () => {
    render(<ProjectManager />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Manage your projects and collaborations')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('loads and displays projects', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });

    expect(mockProjectService.getProjects).toHaveBeenCalledWith({
      status: undefined,
      search: undefined,
      page: 1
    });
  });

  it('filters projects by search term', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Project 1' } });

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    });
  });

  it('filters projects by status', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mockProjectService.getProjects).toHaveBeenCalledWith({
        status: 'completed',
        search: undefined,
        page: 1
      });
    });
  });

  it('opens project console when view button is clicked', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Project');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('project-console')).toBeInTheDocument();
      expect(screen.getByText(/Project Console for/)).toBeInTheDocument();
    });
  });

  it('opens create project modal when new project button is clicked', async () => {
    render(<ProjectManager />);

    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });
  });

  it('handles project creation', async () => {
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

    render(<ProjectManager />);

    // Open create modal
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    // Fill form
    const titleInput = screen.getByPlaceholderText('Enter project title...');
    const descriptionInput = screen.getByPlaceholderText('Describe your project requirements...');
    
    fireEvent.change(titleInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'New project description' } });

    // Submit form
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);

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

  it('displays error state when loading fails', async () => {
    mockProjectService.getProjects.mockRejectedValue(new Error('Failed to load'));

    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Projects')).toBeInTheDocument();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('displays empty state when no projects exist', async () => {
    mockProjectService.getProjects.mockResolvedValue({
      data: {
        results: [],
        count: 0,
        next: null,
        previous: null
      },
      error: null
    });

    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
    });
  });

  it('shows project statistics correctly', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Check if project stats are displayed
    expect(screen.getByText('$5,000 - $10,000')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText('5 tasks')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // Progress
  });

  it('handles back navigation from project console', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open project console
    const viewButtons = screen.getAllByTitle('View Project');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('project-console')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText('Back to Projects');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.queryByTestId('project-console')).not.toBeInTheDocument();
    });
  });

  it('refreshes projects when refresh button is clicked', async () => {
    render(<ProjectManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Refresh Projects');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockProjectService.getProjects).toHaveBeenCalledTimes(2);
    });
  });
});