/**
 * Project Service
 * Handles all project-related API operations
 */

import { apiClient, Project, Task, APIResponse, PaginatedResponse } from '../api-client';

export interface ProjectFilters {
  status?: 'analyzing' | 'proposal_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  client?: string;
  senior_developer?: string;
  page?: number;
  search?: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  budget_range?: {
    min: number;
    max: number;
  };
  timeline_preference?: string;
  required_skills?: string[];
}

export interface ProjectAnalysisResult {
  analysis: {
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    estimated_hours: number;
    budget_estimate: number;
    required_skills: string[];
    risk_factors: string[];
    needs_senior_developer: boolean;
  };
  tasks: Task[];
  timeline_estimate: string;
}

export interface ProjectProposal {
  project_id: string;
  budget_estimate: number;
  timeline_estimate: string;
  task_breakdown: Task[];
  senior_developer_notes?: string;
  modifications: {
    field: string;
    old_value: any;
    new_value: any;
    justification: string;
  }[];
}

export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_budget: number;
  average_completion_time: number;
}

class ProjectService {
  /**
   * Get projects with optional filtering
   */
  async getProjects(filters?: ProjectFilters): Promise<APIResponse<PaginatedResponse<Project>>> {
    return apiClient.getProjects(filters);
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<APIResponse<Project>> {
    return apiClient.getProject(projectId);
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectData): Promise<APIResponse<Project>> {
    return apiClient.createProject({
      title: projectData.title,
      description: projectData.description,
    });
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, updates: Partial<Project>): Promise<APIResponse<Project>> {
    return apiClient.updateProject(projectId, updates);
  }

  /**
   * Trigger AI analysis for a project
   */
  async analyzeProject(projectId: string): Promise<APIResponse<{ analysis: any; tasks: Task[] }>> {
    return apiClient.analyzeProject(projectId);
  }

  /**
   * Get project tasks
   */
  async getProjectTasks(projectId: string): Promise<APIResponse<Task[]>> {
    return apiClient.getProjectTasks(projectId);
  }

  /**
   * Update task status or details
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<APIResponse<Task>> {
    return apiClient.updateTask(taskId, updates);
  }

  /**
   * Assign developer to a task
   */
  async assignDeveloperToTask(taskId: string, developerId: string): Promise<APIResponse<Task>> {
    return this.updateTask(taskId, { assigned_developer: developerId });
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, completionNotes?: string): Promise<APIResponse<Task>> {
    return this.updateTask(taskId, { 
      status: 'completed',
      completion_percentage: 100,
    });
  }

  /**
   * Submit project proposal (for senior developers)
   */
  async submitProposal(proposal: ProjectProposal): Promise<APIResponse<Project>> {
    return apiClient.makeAPIRequest(`/projects/${proposal.project_id}/submit-proposal/`, {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  }

  /**
   * Approve project proposal (for clients)
   */
  async approveProposal(projectId: string, approved: boolean, notes?: string): Promise<APIResponse<Project>> {
    return apiClient.makeRequest(`/projects/${projectId}/approve-proposal/`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes }),
    });
  }

  /**
   * Get project statistics for dashboard
   */
  async getProjectStats(userId?: string): Promise<APIResponse<ProjectStats>> {
    const endpoint = userId ? `/projects/stats/?user=${userId}` : '/projects/stats/';
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get project timeline and milestones
   */
  async getProjectTimeline(projectId: string): Promise<APIResponse<any[]>> {
    return apiClient.makeRequest(`/projects/${projectId}/timeline/`);
  }

  /**
   * Update project milestone
   */
  async updateMilestone(projectId: string, milestoneId: string, updates: any): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/projects/${projectId}/milestones/${milestoneId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string): Promise<APIResponse<any[]>> {
    return apiClient.makeRequest(`/projects/${projectId}/team/`);
  }

  /**
   * Invite developer to project
   */
  async inviteDeveloper(projectId: string, developerId: string, taskIds: string[]): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/projects/${projectId}/invite-developer/`, {
      method: 'POST',
      body: JSON.stringify({
        developer_id: developerId,
        task_ids: taskIds,
      }),
    });
  }

  /**
   * Remove developer from project
   */
  async removeDeveloper(projectId: string, developerId: string): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/projects/${projectId}/remove-developer/`, {
      method: 'POST',
      body: JSON.stringify({ developer_id: developerId }),
    });
  }

  /**
   * Get project activity feed
   */
  async getProjectActivity(projectId: string, limit?: number): Promise<APIResponse<any[]>> {
    const endpoint = `/projects/${projectId}/activity/${limit ? `?limit=${limit}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get project console dashboard data
   */
  async getProjectConsole(projectId: string, endpoint: string = 'dashboard'): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/projects/${projectId}/console?endpoint=${endpoint}`);
  }

  /**
   * Get project details for console
   */
  async getProjectDetails(projectId: string): Promise<APIResponse<any>> {
    return this.getProjectConsole(projectId, 'details');
  }

  /**
   * Get task progress data
   */
  async getTaskProgress(projectId: string): Promise<APIResponse<any>> {
    return this.getProjectConsole(projectId, 'task-progress');
  }

  /**
   * Get team management data
   */
  async getTeamManagement(projectId: string): Promise<APIResponse<any>> {
    return this.getProjectConsole(projectId, 'team-management');
  }

  /**
   * Perform console action
   */
  async performConsoleAction(projectId: string, action: string, data: any): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/projects/${projectId}/console?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Archive/unarchive project
   */
  async archiveProject(projectId: string, archive: boolean = true): Promise<APIResponse<Project>> {
    return apiClient.makeRequest(`/projects/${projectId}/archive/`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  }

  /**
   * Cancel project
   */
  async cancelProject(projectId: string, reason: string): Promise<APIResponse<Project>> {
    return this.updateProject(projectId, { 
      status: 'cancelled',
    });
  }

  /**
   * Get similar projects for recommendations
   */
  async getSimilarProjects(projectId: string, limit: number = 5): Promise<APIResponse<Project[]>> {
    return apiClient.makeRequest(`/projects/${projectId}/similar/?limit=${limit}`);
  }
}

export const projectService = new ProjectService();
export default projectService;