'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from './project-context';
import { useRealtimeSync, useRealtimeSubscription } from '@/lib/realtime-sync';
import { useWebSocket } from '@/lib/websocket-client';
import { projectService } from '@/lib/services/project-service';
import { 
  Activity, 
  Users, 
  Clock, 
  DollarSign, 
  GitBranch, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  Filter,
  Search
} from 'lucide-react';

interface ProjectConsoleProps {
  projectId: string;
  className?: string;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  user_role: string;
  client: any;
  senior_developer: any;
  tasks: any[];
  team_members: any[];
  resource_allocation: any;
  milestones: any[];
  pending_invitations: any[];
  ai_analysis: any;
  required_skills: string[];
  created_at: string;
  updated_at: string;
}

interface TaskProgress {
  project_id: string;
  project_title: string;
  task_statistics: any;
  overall_progress: any;
  task_progress: any[];
  critical_path_tasks: any[];
  timeline_analysis: any;
}

interface TeamManagement {
  team_members: any[];
  pending_invitations: any[];
  team_metrics: any;
  role_permissions: any;
}

export function ProjectManagementConsole({ projectId, className = '' }: ProjectConsoleProps) {
  const { currentProject, hasPermission, isSeniorDeveloper } = useProject();
  const { isConnected, subscribe, unsubscribe } = useRealtimeSync();
  const { subscribeToProject, unsubscribeFromProject, getConnectionStatus } = useWebSocket();
  
  // State management
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [teamManagement, setTeamManagement] = useState<TeamManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters and search
  const [taskFilter, setTaskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load project data
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load project details, task progress, and team management data in parallel
      const [detailsResponse, progressResponse, teamResponse] = await Promise.all([
        projectService.getProjectDetails(projectId),
        projectService.getTaskProgress(projectId),
        projectService.getTeamManagement(projectId)
      ]);
      
      if (!detailsResponse.success || !progressResponse.success || !teamResponse.success) {
        throw new Error('Failed to load project data');
      }
      
      const [details, progress, team] = [
        detailsResponse.data,
        progressResponse.data,
        teamResponse.data
      ];
      
      setProjectDetails(details);
      setTaskProgress(progress);
      setTeamManagement(team);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data');
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadProjectData();
    setRefreshing(false);
  }, [loadProjectData]);

  // Real-time event handlers
  const handleProjectUpdate = useCallback((event: any) => {
    if (event.project_id === projectId) {
      refreshData();
    }
  }, [projectId, refreshData]);

  const handleTaskUpdate = useCallback((event: any) => {
    if (event.data.project_id === projectId) {
      refreshData();
    }
  }, [projectId, refreshData]);

  // Set up real-time subscriptions
  useRealtimeSubscription(`project_${projectId}`, handleProjectUpdate);
  useRealtimeSubscription('task_updated', handleTaskUpdate);

  // Load data on mount and set up WebSocket subscription
  useEffect(() => {
    loadProjectData();
    
    // Subscribe to WebSocket updates for this project
    if (projectId) {
      subscribeToProject(projectId);
    }
    
    return () => {
      // Cleanup WebSocket subscription
      if (projectId) {
        unsubscribeFromProject(projectId);
      }
    };
  }, [loadProjectData, projectId, subscribeToProject, unsubscribeFromProject]);

  // Handle data refresh events from WebSocket
  useEffect(() => {
    const handleProjectUpdate = (event: CustomEvent) => {
      const { projectId: updatedProjectId } = event.detail;
      if (updatedProjectId === projectId) {
        refreshData();
      }
    };

    const handleTaskUpdate = (event: CustomEvent) => {
      const { projectId: updatedProjectId } = event.detail;
      if (updatedProjectId === projectId) {
        refreshData();
      }
    };

    const handleTeamUpdate = (event: CustomEvent) => {
      const { projectId: updatedProjectId } = event.detail;
      if (updatedProjectId === projectId) {
        refreshData();
      }
    };

    const handlePaymentUpdate = (event: CustomEvent) => {
      const { projectId: updatedProjectId } = event.detail;
      if (updatedProjectId === projectId) {
        refreshData();
      }
    };

    // Legacy data refresh events
    const handleDataRefresh = (event: CustomEvent) => {
      const { resource, id } = event.detail;
      if (resource === 'projects' && id === projectId) {
        refreshData();
      }
    };

    window.addEventListener('projectUpdate', handleProjectUpdate as EventListener);
    window.addEventListener('taskUpdate', handleTaskUpdate as EventListener);
    window.addEventListener('teamUpdate', handleTeamUpdate as EventListener);
    window.addEventListener('paymentUpdate', handlePaymentUpdate as EventListener);
    window.addEventListener('dataRefresh', handleDataRefresh as EventListener);
    
    return () => {
      window.removeEventListener('projectUpdate', handleProjectUpdate as EventListener);
      window.removeEventListener('taskUpdate', handleTaskUpdate as EventListener);
      window.removeEventListener('teamUpdate', handleTeamUpdate as EventListener);
      window.removeEventListener('paymentUpdate', handlePaymentUpdate as EventListener);
      window.removeEventListener('dataRefresh', handleDataRefresh as EventListener);
    };
  }, [projectId, refreshData]);

  // Filter tasks based on current filter and search
  const filteredTasks = taskProgress?.task_progress?.filter(task => {
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_developer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading project console...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Project</h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{projectDetails.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Status: <span className="text-cyan-400 capitalize">{projectDetails.status}</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Role: <span className="text-cyan-400 capitalize">{projectDetails.user_role.replace('_', ' ')}</span>
              </span>
              {(isConnected || getConnectionStatus() === 'connected') && (
                <span className="flex items-center gap-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live Updates
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {hasPermission('manage_settings') && (
              <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Progress</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Math.round(taskProgress?.overall_progress?.completion_percentage || 0)}%
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Team Size</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {teamManagement?.team_members?.length || 0}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Tasks</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {taskProgress?.task_statistics?.completed_tasks || 0}/{taskProgress?.task_statistics?.total_tasks || 0}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Budget</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${Math.round(projectDetails.resource_allocation?.allocated_budget || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 py-4 border-b border-gray-700/50">
        <div className="flex items-center gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'budget', label: 'Budget', icon: DollarSign },
            ...(hasPermission('code_review') ? [{ id: 'github', label: 'GitHub', icon: GitBranch }] : [])
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <ProjectOverview 
            projectDetails={projectDetails}
            taskProgress={taskProgress}
            teamManagement={teamManagement}
          />
        )}
        
        {activeTab === 'tasks' && (
          <TaskManagement
            taskProgress={taskProgress}
            projectDetails={projectDetails}
            filteredTasks={filteredTasks}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onTaskUpdate={refreshData}
          />
        )}
        
        {activeTab === 'team' && (
          <TeamManagementTab
            teamManagement={teamManagement}
            projectDetails={projectDetails}
            onTeamUpdate={refreshData}
          />
        )}
        
        {activeTab === 'timeline' && (
          <TimelineManagement
            projectDetails={projectDetails}
            taskProgress={taskProgress}
          />
        )}
        
        {activeTab === 'budget' && (
          <BudgetManagement
            projectDetails={projectDetails}
            taskProgress={taskProgress}
          />
        )}
        
        {activeTab === 'github' && hasPermission('code_review') && (
          <GitHubIntegration
            projectDetails={projectDetails}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components will be implemented in separate files
function ProjectOverview({ projectDetails, taskProgress, teamManagement }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Description */}
        <div className="bg-gray-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Description</h3>
          <p className="text-gray-300 leading-relaxed">{projectDetails.description}</p>
          
          {projectDetails.required_skills?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {projectDetails.required_skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Chart */}
        <div className="bg-gray-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progress Overview</h3>
          <div className="space-y-4">
            {taskProgress?.task_statistics && Object.entries(taskProgress.task_statistics).map(([key, value]) => {
              if (key === 'total_tasks') return null;
              const percentage = ((value as number) / taskProgress.task_statistics.total_tasks) * 100;
              const colors = {
                completed_tasks: 'bg-green-500',
                in_progress_tasks: 'bg-blue-500',
                assigned_tasks: 'bg-yellow-500',
                pending_tasks: 'bg-gray-500'
              };
              
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-white">{value as number}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[key as keyof typeof colors] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {/* This would be populated with real activity data */}
          <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-white text-sm">Task "API Integration" completed</p>
              <p className="text-gray-400 text-xs">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
            <Users className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-white text-sm">New developer joined the team</p>
              <p className="text-gray-400 text-xs">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the actual components
import { TaskManagement } from './task-management';
import { TeamManagementInterface } from './team-management-interface';
import { MilestonePaymentTracker } from './milestone-payment-tracker';
import { GitHubIntegration } from './github-integration';

function TimelineManagement({ projectDetails, taskProgress }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Project Timeline</h3>
        <div className="space-y-4">
          {/* Timeline visualization */}
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Timeline visualization will be implemented...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetManagement({ projectDetails, taskProgress }: any) {
  return (
    <MilestonePaymentTracker 
      projectDetails={projectDetails}
      taskProgress={taskProgress}
    />
  );
}

function TeamManagementTab({ teamManagement, projectDetails, onTeamUpdate }: any) {
  return (
    <TeamManagementInterface
      teamManagement={teamManagement}
      projectDetails={projectDetails}
      onTeamUpdate={onTeamUpdate}
    />
  );
}