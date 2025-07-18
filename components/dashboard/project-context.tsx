'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
  id: string;
  title: string;
  status: string;
  role: 'client' | 'developer' | 'senior_developer';
  progress?: number;
  budget?: number;
  deadline?: string;
  team_size?: number;
  priority?: 'low' | 'medium' | 'high';
  client?: any;
  developer?: any;
  description?: string;
  skills_required?: string[];
}

interface DashboardSettings {
  layout: 'grid' | 'list' | 'compact';
  theme: 'dark' | 'light' | 'auto';
  showNotifications: boolean;
  showQuickStats: boolean;
  defaultView: 'overview' | 'projects' | 'tasks';
  sidebarCollapsed: boolean;
  customWidgets: string[];
}

interface ProjectContextType {
  // Project Management
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  
  // Dashboard Settings
  dashboardSettings: DashboardSettings;
  updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
  
  // User Context
  user: any;
  profile: any;
  
  // Navigation State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Permissions
  hasPermission: (permission: string, projectId?: string) => boolean;
  isSeniorDeveloper: (projectId?: string) => boolean;
  
  // Loading States
  loading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  user: any;
  profile: any;
}

export function ProjectProvider({ children, user, profile }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Default dashboard settings
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    layout: 'grid',
    theme: 'dark',
    showNotifications: true,
    showQuickStats: true,
    defaultView: 'overview',
    sidebarCollapsed: false,
    customWidgets: ['recent_projects', 'upcoming_deadlines', 'team_activity']
  });

  // Load dashboard settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboard_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setDashboardSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading dashboard settings:', error);
      }
    }
  }, []);

  // Save dashboard settings to localStorage
  const updateDashboardSettings = (newSettings: Partial<DashboardSettings>) => {
    const updated = { ...dashboardSettings, ...newSettings };
    setDashboardSettings(updated);
    localStorage.setItem('dashboard_settings', JSON.stringify(updated));
  };

  // Fetch projects based on user role and permissions
  const refreshProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data for demonstration - in real implementation, this would be API calls
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'E-commerce Platform Redesign',
          status: 'in_progress',
          role: profile?.role === 'client' ? 'client' : 'senior_developer',
          progress: 65,
          budget: 15000,
          deadline: '2024-02-15',
          team_size: 4,
          priority: 'high',
          description: 'Complete redesign of the e-commerce platform with modern UI/UX',
          skills_required: ['React', 'Node.js', 'PostgreSQL', 'AWS']
        },
        {
          id: '2',
          title: 'Mobile App Development',
          status: 'active',
          role: profile?.role === 'client' ? 'client' : 'developer',
          progress: 30,
          budget: 8000,
          deadline: '2024-03-01',
          team_size: 2,
          priority: 'medium',
          description: 'Native mobile app for iOS and Android',
          skills_required: ['React Native', 'Firebase', 'TypeScript']
        },
        {
          id: '3',
          title: 'AI Chatbot Integration',
          status: 'completed',
          role: profile?.role === 'client' ? 'client' : 'developer',
          progress: 100,
          budget: 5000,
          deadline: '2024-01-15',
          team_size: 1,
          priority: 'low',
          description: 'Integration of AI chatbot for customer support',
          skills_required: ['Python', 'OpenAI API', 'FastAPI']
        },
        {
          id: '4',
          title: 'Blockchain Voting System',
          status: 'paused',
          role: profile?.role === 'client' ? 'client' : 'senior_developer',
          progress: 45,
          budget: 20000,
          deadline: '2024-04-01',
          team_size: 3,
          priority: 'high',
          description: 'Secure blockchain-based voting system',
          skills_required: ['Solidity', 'Web3', 'React', 'Ethereum']
        },
        {
          id: '5',
          title: 'Data Analytics Dashboard',
          status: 'active',
          role: 'developer',
          progress: 20,
          budget: 12000,
          deadline: '2024-03-15',
          team_size: 2,
          priority: 'medium',
          description: 'Real-time analytics dashboard for business intelligence',
          skills_required: ['Python', 'D3.js', 'PostgreSQL', 'Docker']
        }
      ];

      // Filter projects based on user role and permissions
      let filteredProjects = mockProjects;
      
      if (profile?.role === 'client') {
        // Clients see projects they own
        filteredProjects = mockProjects.filter(p => p.role === 'client');
      } else if (profile?.role === 'developer') {
        // Developers see projects they're assigned to
        filteredProjects = mockProjects.filter(p => p.role === 'developer' || p.role === 'senior_developer');
      }

      setProjects(filteredProjects);
      
      // Set current project if none selected and projects exist
      if (!currentProject && filteredProjects.length > 0) {
        const activeProject = filteredProjects.find(p => p.status === 'in_progress') || filteredProjects[0];
        setCurrentProject(activeProject);
      }
      
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string, projectId?: string): boolean => {
    const project = projectId ? projects.find(p => p.id === projectId) : currentProject;
    
    if (!project) return false;
    
    // Permission matrix based on role
    const permissions = {
      client: [
        'view_project', 'edit_project', 'delete_project', 'manage_team', 
        'approve_tasks', 'manage_budget', 'view_reports', 'manage_settings'
      ],
      senior_developer: [
        'view_project', 'edit_proposal', 'manage_team', 'approve_tasks',
        'view_budget', 'view_reports', 'code_review', 'mentor_developers'
      ],
      developer: [
        'view_project', 'update_tasks', 'log_time', 'view_deliverables'
      ]
    };
    
    const userRole = project.role;
    const rolePermissions = permissions[userRole] || [];
    
    return rolePermissions.includes(permission);
  };

  // Check if user is senior developer for a project
  const isSeniorDeveloper = (projectId?: string): boolean => {
    const project = projectId ? projects.find(p => p.id === projectId) : currentProject;
    return project?.role === 'senior_developer';
  };

  // Load projects on mount
  useEffect(() => {
    if (user && profile) {
      refreshProjects();
    }
  }, [user, profile]);

  const contextValue: ProjectContextType = {
    // Project Management
    projects,
    currentProject,
    setCurrentProject,
    refreshProjects,
    
    // Dashboard Settings
    dashboardSettings,
    updateDashboardSettings,
    
    // User Context
    user,
    profile,
    
    // Navigation State
    activeTab,
    setActiveTab,
    
    // Permissions
    hasPermission,
    isSeniorDeveloper,
    
    // Loading States
    loading,
    error
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Custom hooks for specific functionality
export function useProjectPermissions(projectId?: string) {
  const { hasPermission, isSeniorDeveloper } = useProject();
  
  return {
    canEdit: hasPermission('edit_project', projectId),
    canDelete: hasPermission('delete_project', projectId),
    canManageTeam: hasPermission('manage_team', projectId),
    canApproveTasks: hasPermission('approve_tasks', projectId),
    canManageBudget: hasPermission('manage_budget', projectId),
    canViewReports: hasPermission('view_reports', projectId),
    isSeniorDev: isSeniorDeveloper(projectId)
  };
}

export function useDashboardSettings() {
  const { dashboardSettings, updateDashboardSettings } = useProject();
  
  return {
    settings: dashboardSettings,
    updateSettings: updateDashboardSettings,
    toggleLayout: () => {
      const layouts: ('grid' | 'list' | 'compact')[] = ['grid', 'list', 'compact'];
      const currentIndex = layouts.indexOf(dashboardSettings.layout);
      const nextLayout = layouts[(currentIndex + 1) % layouts.length];
      updateDashboardSettings({ layout: nextLayout });
    },
    toggleSidebar: () => {
      updateDashboardSettings({ sidebarCollapsed: !dashboardSettings.sidebarCollapsed });
    }
  };
}