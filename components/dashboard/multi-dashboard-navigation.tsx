'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Settings, 
  Star, 
  Crown, 
  Briefcase, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Grid3X3,
  List,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Link from 'next/link';
import { DashboardCustomization } from './dashboard-customization';

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
}

interface MultiDashboardNavigationProps {
  user: any;
  profile: any;
  projects: Project[];
  currentProject?: Project | null;
  onProjectChange: (project: Project | null) => void;
  onLayoutChange?: (layout: 'grid' | 'list' | 'compact') => void;
  layout?: 'grid' | 'list' | 'compact';
}

export function MultiDashboardNavigation({
  user,
  profile,
  projects,
  currentProject,
  onProjectChange,
  onLayoutChange,
  layout = 'grid'
}: MultiDashboardNavigationProps) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesRole = roleFilter === 'all' || project.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Get role-specific features
  const getRoleFeatures = (projectRole: string, userRole: string) => {
    const baseFeatures = ['overview', 'tasks', 'messages'];
    
    if (projectRole === 'client' || userRole === 'client') {
      return [...baseFeatures, 'team', 'budget', 'reports', 'settings'];
    }
    
    if (projectRole === 'senior_developer') {
      return [...baseFeatures, 'team', 'budget', 'reports', 'proposal_review', 'code_review'];
    }
    
    if (projectRole === 'developer') {
      return [...baseFeatures, 'time_tracking', 'deliverables'];
    }
    
    return baseFeatures;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-purple-400 bg-purple-500/20';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl transition-all duration-300 ${
      isExpanded ? 'p-6' : 'p-4'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={24} className="text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Project Dashboard</h2>
          </div>
          
          {profile?.role === 'developer' && projects.some(p => p.role === 'senior_developer') && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
              <Crown size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">Senior Dev</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layout Controls */}
          {onLayoutChange && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => onLayoutChange('grid')}
                className={`p-1 rounded ${layout === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="Grid Layout"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => onLayoutChange('list')}
                className={`p-1 rounded ${layout === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="List Layout"
              >
                <List size={16} />
              </button>
            </div>
          )}
          
          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          {/* Settings */}
          <button 
            onClick={() => setShowCustomization(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Customize Dashboard"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Current Project Selector */}
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="w-full flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {currentProject ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(currentProject.status).split(' ')[1]}`} />
                        <span className="font-medium text-white">{currentProject.title}</span>
                      </div>
                      
                      {currentProject.role === 'senior_developer' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                          <Crown size={12} className="text-yellow-400" />
                          <span className="text-xs text-yellow-400">Lead</span>
                        </div>
                      )}
                      
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(currentProject.status)}`}>
                        {currentProject.status.replace('_', ' ')}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">Select a project...</span>
                  )}
                </div>
                
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {/* Search and Filters */}
                  <div className="p-4 border-b border-white/10">
                    <div className="relative mb-3">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="all" className="bg-gray-900">All Status</option>
                        <option value="active" className="bg-gray-900">Active</option>
                        <option value="in_progress" className="bg-gray-900">In Progress</option>
                        <option value="completed" className="bg-gray-900">Completed</option>
                        <option value="paused" className="bg-gray-900">Paused</option>
                      </select>
                      
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="all" className="bg-gray-900">All Roles</option>
                        <option value="client" className="bg-gray-900">Client</option>
                        <option value="developer" className="bg-gray-900">Developer</option>
                        <option value="senior_developer" className="bg-gray-900">Senior Dev</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* All Projects Option */}
                  <button
                    onClick={() => {
                      onProjectChange(null);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full p-4 text-left hover:bg-white/10 transition-colors border-b border-white/5 ${
                      !currentProject ? 'bg-cyan-500/20 border-cyan-500/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Grid3X3 size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-white">All Projects Overview</div>
                        <div className="text-sm text-gray-400">View all projects at once</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Project List */}
                  {filteredProjects.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      No projects found
                    </div>
                  ) : (
                    filteredProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onProjectChange(project);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                          currentProject?.id === project.id ? 'bg-cyan-500/20 border-cyan-500/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status).split(' ')[1]}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{project.title}</span>
                                {project.role === 'senior_developer' && (
                                  <Crown size={14} className="text-yellow-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="capitalize">{project.role.replace('_', ' ')}</span>
                                {project.progress !== undefined && (
                                  <span>• {project.progress}% complete</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {project.priority && (
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {currentProject && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={16} className="text-cyan-400" />
                  <span className="text-sm text-gray-400">Progress</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {currentProject.progress || 0}%
                </div>
              </div>
              
              {currentProject.budget && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-green-400" />
                    <span className="text-sm text-gray-400">Budget</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    ${currentProject.budget.toLocaleString()}
                  </div>
                </div>
              )}
              
              {currentProject.team_size && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-purple-400" />
                    <span className="text-sm text-gray-400">Team</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {currentProject.team_size}
                  </div>
                </div>
              )}
              
              {currentProject.deadline && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-yellow-400" />
                    <span className="text-sm text-gray-400">Deadline</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {new Date(currentProject.deadline).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Role-Specific Features */}
          {currentProject && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Available Features</h3>
              <div className="flex flex-wrap gap-2">
                {getRoleFeatures(currentProject.role, profile?.role).map(feature => (
                  <Link
                    key={feature}
                    href={`/projects/${currentProject.id}/${feature}`}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors capitalize"
                  >
                    {feature.replace('_', ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects/create"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              New Project
            </Link>
            
            <Link
              href="/messages"
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Messages
            </Link>
            
            <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2">
              <Bell size={16} />
              Notifications
            </button>
          </div>
        </>
      )}
      
      {/* Dashboard Customization Modal */}
      <DashboardCustomization 
        isOpen={showCustomization} 
        onClose={() => setShowCustomization(false)} 
      />
    </div>
  );
}