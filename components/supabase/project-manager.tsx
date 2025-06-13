'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { ProjectService, Project, RealtimeService } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye, 
  Edit, 
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  MessageSquare
} from 'lucide-react';

export function ProjectManager() {
  const { user, profile } = useSupabaseAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form state for creating/editing projects
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    category: '',
    urgency: 'medium',
    skills_required: ''
  });

  useEffect(() => {
    if (user) {
      loadProjects();
      
      // Set up real-time subscription
      const subscription = RealtimeService.subscribeToProjects((payload) => {
        console.log('Real-time project update:', payload);
        
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => 
            p.id === payload.new.id ? payload.new : p
          ));
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== payload.old.id));
        }
      });

      return () => {
        RealtimeService.unsubscribe(subscription);
      };
    }
  }, [user, statusFilter, categoryFilter]);

  const loadProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      // If user is a client, show their projects
      if (profile?.role === 'client') {
        filters.client_id = user.id;
      }

      const { data, error } = await ProjectService.getProjects(filters);

      if (error) {
        setError(error.message);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      setError('Failed to load projects');
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        budget_min: parseInt(formData.budget_min) || 0,
        budget_max: parseInt(formData.budget_max) || 0,
        deadline: formData.deadline || undefined,
        client_id: user.id,
        status: 'draft' as const,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(Boolean),
        category: formData.category,
        urgency: formData.urgency as 'low' | 'medium' | 'high'
      };

      const { data, error } = await ProjectService.createProject(projectData);

      if (error) {
        setError(error.message);
      } else {
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          budget_min: '',
          budget_max: '',
          deadline: '',
          category: '',
          urgency: 'medium',
          skills_required: ''
        });
        // Project will be added via real-time subscription
      }
    } catch (err) {
      setError('Failed to create project');
      console.error('Create project error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await ProjectService.deleteProject(id);

      if (error) {
        setError(error.message);
      }
      // Project will be removed via real-time subscription
    } catch (err) {
      setError('Failed to delete project');
      console.error('Delete project error:', err);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/5 border border-white/20 rounded-2xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">Please sign in to manage projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-cyan-400">Project Manager</h2>
            <p className="text-gray-400">Manage your projects with real-time Supabase integration</p>
          </div>
          
          {profile?.role === 'client' && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Project
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-cyan-400">Create New Project</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    required
                  >
                    <option value="" className="bg-gray-900">Select category</option>
                    <option value="web-development" className="bg-gray-900">Web Development</option>
                    <option value="mobile-app" className="bg-gray-900">Mobile App</option>
                    <option value="ai-ml" className="bg-gray-900">AI/Machine Learning</option>
                    <option value="blockchain" className="bg-gray-900">Blockchain</option>
                    <option value="design" className="bg-gray-900">UI/UX Design</option>
                    <option value="other" className="bg-gray-900">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 min-h-[120px]"
                  placeholder="Describe your project requirements..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Min Budget ($)
                  </label>
                  <input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="1000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="5000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    value={formData.skills_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills_required: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="React, Node.js, TypeScript (comma-separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Urgency
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="low" className="bg-gray-900">Low</option>
                    <option value="medium" className="bg-gray-900">Medium</option>
                    <option value="high" className="bg-gray-900">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="border border-gray-500 text-gray-400 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="all" className="bg-gray-900">All Status</option>
              <option value="draft" className="bg-gray-900">Draft</option>
              <option value="active" className="bg-gray-900">Active</option>
              <option value="in_progress" className="bg-gray-900">In Progress</option>
              <option value="completed" className="bg-gray-900">Completed</option>
              <option value="cancelled" className="bg-gray-900">Cancelled</option>
            </select>

            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="all" className="bg-gray-900">All Categories</option>
              <option value="web-development" className="bg-gray-900">Web Development</option>
              <option value="mobile-app" className="bg-gray-900">Mobile App</option>
              <option value="ai-ml" className="bg-gray-900">AI/ML</option>
              <option value="blockchain" className="bg-gray-900">Blockchain</option>
              <option value="design" className="bg-gray-900">Design</option>
              <option value="other" className="bg-gray-900">Other</option>
            </select>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center">
            <Users size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {profile?.role === 'client' 
                ? 'Create your first project to get started' 
                : 'No projects match your current filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {project.category.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getUrgencyColor(project.urgency)}`}>
                      {project.urgency}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-400" />
                    <span className="text-green-400 font-semibold">
                      ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                    </span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-yellow-400" />
                      <span className="text-gray-300">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {project.skills_required.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {project.skills_required.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
                          {skill}
                        </span>
                      ))}
                      {project.skills_required.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                          +{project.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors">
                      <Eye size={16} className="text-cyan-400" />
                    </button>
                    {profile?.role === 'client' && project.client_id === user.id && (
                      <>
                        <button className="p-2 bg-blue-500/20 border border-blue-500/40 rounded-lg hover:bg-blue-500/30 transition-colors">
                          <Edit size={16} className="text-blue-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </>
                    )}
                    {profile?.role === 'developer' && (
                      <button className="p-2 bg-green-500/20 border border-green-500/40 rounded-lg hover:bg-green-500/30 transition-colors">
                        <MessageSquare size={16} className="text-green-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}