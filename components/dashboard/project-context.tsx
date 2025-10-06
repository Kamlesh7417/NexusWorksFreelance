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
      // Import project service for real API calls
      const { projectService } = await import('@/lib/services/project-service');
      
      // Fetch real projects from Django API with role-based filtering
      const response = await projectService.getProjects({
        page: 1,
        // Django backend should handle role-based filtering automatically
        // but we can add explicit filters if needed
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Transform API response to match our Project interface
      const apiProjects = response.data?.results || [];
      const transformedProjects: Project[] = apiProjects.map((apiProject: any) => ({
        id: apiProject.id,
        title: apiProject.title,
        status: apiProject.status,
        role: apiProject.user_role || (user?.user_type === 'client' ? 'client' : 'developer'),
        progress: apiProject.completion_percentage || 0,
        budget: apiProject.budget_range?.max || apiProject.budget_range?.min || 0,
        deadline: apiProject.deadline,
        team_size: apiProject.team_members_count || 1,
        priority: apiProject.priority || 'medium',
        description: apiProject.description,
        skills_required: apiProject.required_skills || []
      }));

      setProjects(transformedProjects);
      
      // Set current project if none selected and projects exist
      if (!currentProject && transformedProjects.length > 0) {
        const activeProject = transformedProjects.find(p => p.status === 'in_progress') || transformedProjects[0];
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