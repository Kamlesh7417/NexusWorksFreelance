'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDjangoAuth } from '../auth/django-auth-provider';
import { projectService } from '@/lib/services/project-service';
// import { useRealtimeProjectData, useConnectionStatus } from '@/lib/hooks/use-realtime-data';
// import { useRealtimeUpdates } from '@/lib/services/realtime-update-service';
import { ProjectManagementConsole } from '../dashboard/project-management-console';
import { Project as APIProject } from '@/lib/api-client';
import { 
  Search, 
  Filter, 
  Plus, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  Eye,
  Edit,
  Archive,
  Trash2,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface Project extends APIProject {
  budget_range?: {
    min: number;
    max: number;
  };
  updated_at?: string;
  tasks_count?: number;
  completion_percentage?: number;
  team_members_count?: number;
  deadline?: string;
}

interface ProjectFilters {
  status: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function ProjectManager() {
  const { user } = useDjangoAuth();
  const router = useRouter();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters and search
  const [filters, setFilters] = useState<ProjectFilters>({
    status: 'all',
    search: '',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await projectService.getProjects({
        status: filters.status !== 'all' ? filters.status as any : undefined,
        search: filters.search || undefined,
        page: 1
      });
      
      if (response?.data?.results) {
        setProjects(response.data.results);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Load projects on mount and filter changes
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Project] || '';
      const bValue = b[filters.sortBy as keyof Project] || '';
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle project actions
  const handleCreateProject = () => {
    setShowCreateForm(true);
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleEditProject = (projectId: string) => {
    // Navigate to project edit page or open edit modal
    router.push(`/projects/${projectId}/edit`);
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.archiveProject(projectId, true);
      await loadProjects(); // Refresh the list
    } catch (err) {
      console.error('Error archiving project:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'proposal_review':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'approved':
        return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'in_progress':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
      case 'cancelled':
        return 'text-red-400 bg-red-500/20 border-red-500/40';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'proposal_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // If a project is selected, show the project console
  if (selectedProject) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Projects
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProjectManagementConsole projectId={selectedProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">Manage your projects and collaborations</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadProjects}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh Projects"
            >
              <RefreshCw className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Status</option>
              <option value="analyzing">Analyzing</option>
              <option value="proposal_review">Proposal Review</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="created_at">Created Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading projects...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-red-400">Error Loading Projects</h3>
            </div>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={loadProjects}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'
              }
            </p>
            <button
              onClick={handleCreateProject}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedProjects.map(project => (
              <div
                key={project.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-all duration-200"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                      {project.title}
                    </h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="capitalize">{project.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleViewProject(project.id)}
                      className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Project"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditProject(project.id)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Project"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveProject(project.id)}
                      className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Archive Project"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Project Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {project.budget_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-300">
                        ${project.budget_range.min?.toLocaleString()} - ${project.budget_range.max?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {project.team_members_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-300">
                        {project.team_members_count} members
                      </span>
                    </div>
                  )}
                  
                  {project.tasks_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-300">
                        {project.tasks_count} tasks
                      </span>
                    </div>
                  )}
                  
                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {project.completion_percentage !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{project.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleViewProject(project.id)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Project
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <CreateProjectModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}

// Create Project Modal Component
function CreateProjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    required_skills: '',
    timeline_preference: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget_range: formData.budget_min && formData.budget_max ? {
          min: parseInt(formData.budget_min),
          max: parseInt(formData.budget_max)
        } : undefined,
        timeline_preference: formData.timeline_preference || undefined,
        required_skills: formData.required_skills 
          ? formData.required_skills.split(',').map(s => s.trim()).filter(Boolean)
          : undefined
      };

      await projectService.createProject(projectData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create New Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              placeholder="Enter project title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Project Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="Describe your project requirements..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Min Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="5000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Max Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="10000"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.required_skills}
              onChange={(e) => setFormData(prev => ({ ...prev, required_skills: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              placeholder="React, Node.js, Python, MongoDB..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Timeline Preference
            </label>
            <select
              value={formData.timeline_preference}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline_preference: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select timeline...</option>
              <option value="asap">ASAP</option>
              <option value="1-2_weeks">1-2 weeks</option>
              <option value="1_month">1 month</option>
              <option value="2-3_months">2-3 months</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Project
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}