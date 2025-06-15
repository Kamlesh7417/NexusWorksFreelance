import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Eye,
  Home,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { MessageList } from '../ui/message-list';
import { Logo } from '@/components/ui/logo';

interface ClientDashboardProps {
  user: any;
  profile: any;
}

export function ClientDashboard({ user, profile }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'developers' | 'messages'>('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch client's projects
        let query = supabase
          .from('projects')
          .select(`
            *,
            developer:user_profiles!projects_developer_id_fkey(id, full_name, avatar_url)
          `)
          .eq('client_id', user.id);
        
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data: projectsData, error: projectsError } = await query;
        
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch bids for client's projects
        const projectIds = projectsData?.map(p => p.id) || [];
        
        if (projectIds.length > 0) {
          const { data: bidsData, error: bidsError } = await supabase
            .from('project_bids')
            .select(`
              *,
              project:projects(*),
              freelancer:user_profiles(*)
            `)
            .in('project_id', projectIds);
          
          if (bidsError) throw bidsError;
          setBids(bidsData || []);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, statusFilter, supabase]);

  const handleAcceptBid = async (bidId: string, projectId: string, developerId: string) => {
    try {
      // Update bid status
      await supabase
        .from('project_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);
      
      // Update project status and assign developer
      await supabase
        .from('projects')
        .update({ 
          status: 'in_progress',
          developer_id: developerId
        })
        .eq('id', projectId);
      
      // Reject all other bids for this project
      await supabase
        .from('project_bids')
        .update({ status: 'rejected' })
        .eq('project_id', projectId)
        .neq('id', bidId);
      
      // Refresh data
      const { data: updatedBids } = await supabase
        .from('project_bids')
        .select(`
          *,
          project:projects(*),
          freelancer:user_profiles(*)
        `)
        .in('project_id', projects.map(p => p.id));
      
      setBids(updatedBids || []);
      
      // Update projects
      const { data: updatedProjects } = await supabase
        .from('projects')
        .select(`
          *,
          developer:user_profiles!projects_developer_id_fkey(id, full_name, avatar_url)
        `)
        .eq('client_id', user.id);
      
      setProjects(updatedProjects || []);
      
      // Send a message to the developer
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: developerId,
          project_id: projectId,
          content: `Congratulations! Your bid has been accepted for the project. Let's get started!`,
          read: false
        });
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  const handleRejectBid = async (bidId: string, developerId: string, projectId: string) => {
    try {
      await supabase
        .from('project_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);
      
      // Refresh bids
      const { data: updatedBids } = await supabase
        .from('project_bids')
        .select(`
          *,
          project:projects(*),
          freelancer:user_profiles(*)
        `)
        .in('project_id', projects.map(p => p.id));
      
      setBids(updatedBids || []);
      
      // Send a message to the developer
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: developerId,
          project_id: projectId,
          content: `Thank you for your interest in my project. Unfortunately, I've decided to go with another developer.`,
          read: false
        });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      // Remove project from state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Remove associated bids
      setBids(prev => prev.filter(b => b.project_id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Filter projects by search term
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });

  // Get bids for a specific project
  const getProjectBids = (projectId: string) => {
    return bids.filter(bid => bid.project_id === projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-purple-400 bg-purple-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Client Dashboard</h1>
            <p className="text-gray-300">Welcome back, {profile.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="nexus-action-btn flex items-center gap-2"
            >
              <Home size={16} />
              Public Site
            </Link>
            <Link 
              href="/projects/create"
              className="nexus-action-btn flex items-center gap-2"
            >
              <Plus size={16} />
              Post New Project
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 max-w-2xl">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'projects', label: 'My Projects', icon: Briefcase },
            { id: 'developers', label: 'Find Developers', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase size={24} className="text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-cyan-400">Active Projects</h3>
                    <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active' || p.status === 'in_progress').length}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-400">Total Budget</h3>
                    <p className="text-2xl font-bold">${projects.reduce((sum, p) => sum + p.budget_max, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={24} className="text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-400">Total Bids</h3>
                    <p className="text-2xl font-bold">{bids.length}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">Completed</h3>
                    <p className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="nexus-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Recent Projects</h3>
                <Link href="/projects/create" className="text-sm text-cyan-400 hover:text-cyan-300">
                  + New Project
                </Link>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={30} className="animate-spin text-cyan-400" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-400 mb-2">No projects yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first project to get started
                  </p>
                  <Link 
                    href="/projects/create"
                    className="nexus-action-btn inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Post New Project
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 3).map(project => (
                    <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/projects/${project.id}`} className="font-medium text-cyan-400 hover:underline">
                          {project.title}
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}</span>
                        <span className="text-gray-400">{getProjectBids(project.id).length} bids</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bids */}
            <div className="nexus-card">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Recent Bids</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={30} className="animate-spin text-cyan-400" />
                </div>
              ) : bids.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-400 mb-2">No bids yet</p>
                  <p className="text-sm text-gray-500">
                    When developers submit bids on your projects, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.slice(0, 3).map(bid => (
                    <div key={bid.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {bid.freelancer?.avatar_url ? (
                            <img 
                              src={bid.freelancer.avatar_url} 
                              alt={bid.freelancer.full_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <Users size={14} className="text-cyan-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{bid.freelancer?.full_name}</div>
                            <div className="text-xs text-gray-400">
                              for <Link href={`/projects/${bid.project_id}`} className="text-cyan-400 hover:underline">{bid.project?.title}</Link>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-400">${bid.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{new Date(bid.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${getBidStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                        
                        <div className="flex gap-2">
                          <Link 
                            href={`/projects/${bid.project_id}`}
                            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
                          >
                            View
                          </Link>
                          
                          {bid.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleAcceptBid(bid.id, bid.project_id, bid.freelancer.id)}
                                className="text-xs bg-green-500/20 hover:bg-green-500/30 px-2 py-1 rounded text-green-400"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleRejectBid(bid.id, bid.freelancer.id, bid.project_id)}
                                className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded text-red-400"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recent Messages */}
            <div className="nexus-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Recent Messages</h3>
                <Link href="/messages" className="text-sm text-cyan-400 hover:text-cyan-300">
                  View All
                </Link>
              </div>
              
              <MessageList userId={user.id} limit={3} showViewAll={false} />
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">My Projects</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="all" className="bg-gray-900">All Status</option>
                  <option value="active" className="bg-gray-900">Active</option>
                  <option value="in_progress" className="bg-gray-900">In Progress</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                  <option value="cancelled" className="bg-gray-900">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={40} className="animate-spin text-cyan-400" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="nexus-card text-center py-12">
                <Briefcase size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400 mb-2">No projects found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first project to get started'}
                </p>
                <Link 
                  href="/projects/create"
                  className="nexus-action-btn inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Post New Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.map(project => (
                  <div key={project.id} className="nexus-card">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-cyan-400">{project.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-sm opacity-80 mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skills_required && project.skills_required.slice(0, 3).map((skill: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                      {project.skills_required && project.skills_required.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs">
                          +{project.skills_required.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <div className="font-semibold text-green-400">
                          ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Bids:</span>
                        <div className="font-semibold">{getProjectBids(project.id).length}</div>
                      </div>
                    </div>
                    
                    {project.developer && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                        <div className="text-sm text-gray-400 mb-1">Assigned Developer:</div>
                        <div className="flex items-center gap-2">
                          {project.developer.avatar_url ? (
                            <img 
                              src={project.developer.avatar_url} 
                              alt={project.developer.full_name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Users size={12} className="text-blue-400" />
                            </div>
                          )}
                          <span className="text-white">{project.developer.full_name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="nexus-action-btn flex-1 text-sm py-2 flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        View Details
                      </Link>
                      
                      {project.status === 'active' && (
                        <>
                          <Link 
                            href={`/projects/${project.id}/edit`}
                            className="nexus-action-btn text-sm py-2 px-3"
                          >
                            <Edit size={14} />
                          </Link>
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="nexus-back-btn text-sm py-2 px-3"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Find Developers</h3>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-400 mb-2">Developer search coming soon</p>
              <p className="text-sm text-gray-500 mb-4">
                Browse our marketplace to find skilled developers for your projects
              </p>
              <Link 
                href="/projects"
                className="nexus-action-btn inline-flex items-center gap-2"
              >
                Go to Marketplace
              </Link>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="nexus-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-cyan-400">Messages</h3>
              <Link href="/messages" className="text-sm text-cyan-400 hover:text-cyan-300">
                View All Messages
              </Link>
            </div>
            
            <MessageList userId={user.id} limit={10} />
          </div>
        )}
      </div>
    </div>
  );
}