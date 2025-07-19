'use client';

import { useEffect, useState } from 'react';
import { ProjectProvider, useProject, useDashboardSettings } from './project-context';
import { MultiDashboardNavigation } from './multi-dashboard-navigation';
import { 
  Grid3X3, 
  List, 
  BarChart3, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
  Crown,
  Plus
} from 'lucide-react';

interface UnifiedDashboardProps {
  user: any;
  profile: any;
}

// Dashboard content component that uses the project context
function DashboardContent() {
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    loading, 
    error,
    isSeniorDeveloper,
    user,
    profile
  } = useProject();
  
  const { settings, updateSettings, toggleLayout } = useDashboardSettings();
  
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingDeadlines: 0
  });

  // Calculate dashboard stats when projects change
  useEffect(() => {
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalEarnings: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      averageRating: 4.8,
      upcomingDeadlines: projects.filter(p => {
        if (!p.deadline) return false;
        const deadline = new Date(p.deadline);
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays > 0;
      }).length
    };
    
    setDashboardStats(stats);
  }, [projects]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger a subtle refresh of dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        // Add small random variations to simulate real-time updates
        totalEarnings: prev.totalEarnings + Math.floor(Math.random() * 100),
      }));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleProjectChange = (project: any) => {
    setCurrentProject(project);
  };

  const handleLayoutChange = (newLayout: 'grid' | 'list' | 'compact') => {
    updateSettings({ layout: newLayout });
  };

  // Render project overview when no specific project is selected
  const renderProjectOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={40} className="animate-spin text-cyan-400" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <BarChart3 size={20} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Projects</div>
                <div className="text-xl font-bold text-white">{dashboardStats.totalProjects}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Active</div>
                <div className="text-xl font-bold text-white">{dashboardStats.activeProjects}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CheckCircle size={20} className="text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Completed</div>
                <div className="text-xl font-bold text-white">{dashboardStats.completedProjects}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <DollarSign size={20} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-xl font-bold text-white">${dashboardStats.totalEarnings.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Star size={20} className="text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Rating</div>
                <div className="text-xl font-bold text-white">{dashboardStats.averageRating}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Due Soon</div>
                <div className="text-xl font-bold text-white">{dashboardStats.upcomingDeadlines}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Projects Grid/List */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">All Projects</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSettings({ layout: 'grid' })}
                    className={`p-2 rounded-lg transition-colors ${
                      settings.layout === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => updateSettings({ layout: 'list' })}
                    className={`p-2 rounded-lg transition-colors ${
                      settings.layout === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>

          {settings.layout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <div key={project.id} className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                     onClick={() => setCurrentProject(project)}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white truncate">{project.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'active' ? 'text-green-400 bg-green-500/20' :
                      project.status === 'in_progress' ? 'text-blue-400 bg-blue-500/20' :
                      project.status === 'completed' ? 'text-purple-400 bg-purple-500/20' :
                      project.status === 'paused' ? 'text-yellow-400 bg-yellow-500/20' :
                      'text-gray-400 bg-gray-500/20'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-gray-400">{project.team_size || 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-400" />
                      <span className="text-green-400">${project.budget?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <div key={project.id} className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                     onClick={() => setCurrentProject(project)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        project.status === 'active' ? 'bg-green-400' :
                        project.status === 'in_progress' ? 'bg-blue-400' :
                        project.status === 'completed' ? 'bg-purple-400' :
                        project.status === 'paused' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-white">{project.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="capitalize">{project.role.replace('_', ' ')}</span>
                          <span>{project.progress || 0}% complete</span>
                          <span>${project.budget?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {project.deadline && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Calendar size={14} />
                          <span>{new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'text-green-400 bg-green-500/20' :
                        project.status === 'in_progress' ? 'text-blue-400 bg-blue-500/20' :
                        project.status === 'completed' ? 'text-purple-400 bg-purple-500/20' :
                        project.status === 'paused' ? 'text-yellow-400 bg-yellow-500/20' :
                        'text-gray-400 bg-gray-500/20'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {[
                {
                  type: 'project',
                  title: 'Milestone completed',
                  description: 'E-commerce Platform - Phase 2',
                  time: '2 hours ago',
                  icon: CheckCircle,
                  color: 'text-green-400'
                },
                {
                  type: 'message',
                  title: 'New message',
                  description: 'From Sarah Johnson',
                  time: '4 hours ago',
                  icon: Users,
                  color: 'text-blue-400'
                },
                {
                  type: 'payment',
                  title: 'Payment received',
                  description: '$2,500 for AI project',
                  time: '6 hours ago',
                  icon: DollarSign,
                  color: 'text-green-400'
                },
                {
                  type: 'deadline',
                  title: 'Deadline reminder',
                  description: 'Mobile app due in 3 days',
                  time: '8 hours ago',
                  icon: AlertTriangle,
                  color: 'text-yellow-400'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`p-2 rounded-lg bg-white/10 ${activity.color}`}>
                    <activity.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{activity.title}</p>
                    <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 p-2 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                  <Plus size={14} />
                  Create New Project
                </button>
                <button className="w-full flex items-center gap-2 p-2 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                  <Users size={14} />
                  Invite Team Member
                </button>
                <button className="w-full flex items-center gap-2 p-2 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                  <Settings size={14} />
                  Account Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render project-specific dashboard
  const renderProjectDashboard = () => {
    if (!currentProject) return null;

    // For now, we'll show a project-specific view
    // In a full implementation, this would render different components based on the project and user role
    return (
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentProject.title}</h2>
              <p className="text-gray-400">{currentProject.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                currentProject.status === 'active' ? 'text-green-400 bg-green-500/20' :
                currentProject.status === 'in_progress' ? 'text-blue-400 bg-blue-500/20' :
                currentProject.status === 'completed' ? 'text-purple-400 bg-purple-500/20' :
                currentProject.status === 'paused' ? 'text-yellow-400 bg-yellow-500/20' :
                'text-gray-400 bg-gray-500/20'
              }`}>
                {currentProject.status.replace('_', ' ')}
              </span>
              {currentProject.role === 'senior_developer' && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-1">
                  <Star size={14} />
                  Senior Lead
                </span>
              )}
            </div>
          </div>

          {/* Project-specific content would go here */}
          <div className="text-center py-12 text-gray-400">
            <p>Project-specific dashboard content for {currentProject.title}</p>
            <p className="text-sm mt-2">Role: {currentProject.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Multi-Dashboard Navigation */}
        <div className="mb-8">
          <MultiDashboardNavigation
            user={user}
            profile={profile}
            projects={projects}
            currentProject={currentProject}
            onProjectChange={handleProjectChange}
            onLayoutChange={handleLayoutChange}
            layout={settings.layout}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {currentProject ? renderProjectDashboard() : renderProjectOverview()}
      </div>
    </div>
  );
}

// Main component that provides the project context
export function UnifiedDashboard({ user, profile }: UnifiedDashboardProps) {
  return (
    <ProjectProvider user={user} profile={profile}>
      <DashboardContent />
    </ProjectProvider>
  );
}