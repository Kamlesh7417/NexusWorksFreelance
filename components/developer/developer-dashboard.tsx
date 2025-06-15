'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  Star,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Eye,
  Award,
  Target,
  Home,
  BookOpen,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { MessageList } from '../ui/message-list';
import { Logo } from '@/components/ui/logo';

interface DeveloperDashboardProps {
  user: any;
  profile: any;
}

export function DeveloperDashboard({ user, profile }: DeveloperDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'portfolio' | 'learning' | 'community' | 'messages'>('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch developer's assigned projects
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url)
          `)
          .eq('developer_id', user.id);
        
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data: projectsData, error: projectsError } = await query;
        
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch developer's bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('project_bids')
          .select(`
            *,
            project:projects(*),
            freelancer:user_profiles(*)
          `)
          .eq('freelancer_id', user.id);
        
        if (bidsError) throw bidsError;
        setBids(bidsData || []);

        // Fetch available projects that match developer's skills
        const { data: availableData, error: availableError } = await supabase
          .from('projects')
          .select(`
            *,
            client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url)
          `)
          .eq('status', 'active')
          .neq('client_id', user.id)
          .limit(6);
        
        if (availableError) throw availableError;
        
        // Calculate match score based on skills
        const projectsWithScore = availableData?.map(project => {
          const requiredSkills = project.skills_required || [];
          const userSkills = profile.skills || [];
          
          // Calculate skill match percentage
          const matchingSkills = requiredSkills.filter((skill: string) => 
            userSkills.some((userSkill: string) => 
              userSkill.toLowerCase() === skill.toLowerCase()
            )
          );
          
          const matchScore = requiredSkills.length > 0 
            ? Math.round((matchingSkills.length / requiredSkills.length) * 100) 
            : 0;
          
          return {
            ...project,
            matchScore
          };
        }) || [];
        
        // Sort by match score
        projectsWithScore.sort((a, b) => b.matchScore - a.matchScore);
        
        setAvailableProjects(projectsWithScore);
      } catch (error) {
        console.error('Error fetching developer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, profile.skills, statusFilter, supabase]);

  // Filter projects by search term
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });

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

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'unavailable': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Developer Dashboard</h1>
            <p className="text-gray-300">Welcome back, {profile.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              profile.availability_status === 'available' ? 'bg-green-500/20 text-green-400' :
              profile.availability_status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {profile.availability_status || 'available'}
            </span>
            <Link 
              href="/"
              className="nexus-action-btn flex items-center gap-2"
            >
              <Home size={16} />
              Public Site
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 max-w-4xl overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'projects', label: 'My Projects', icon: Briefcase },
            { id: 'portfolio', label: 'Portfolio', icon: Award },
            { id: 'learning', label: 'Learning', icon: BookOpen },
            { id: 'community', label: 'Community', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
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
                    <h3 className="font-semibold text-green-400">Total Earnings</h3>
                    <p className="text-2xl font-bold">${profile.hourly_rate ? profile.hourly_rate * 40 : 0}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">Rating</h3>
                    <p className="text-2xl font-bold">4.9</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={24} className="text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-400">Completed</h3>
                    <p className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Projects */}
            <div className="nexus-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Current Projects</h3>
                <Link href="/projects" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Browse More Projects
                </Link>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={30} className="animate-spin text-cyan-400" />
                </div>
              ) : projects.filter(p => p.status === 'in_progress').length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-400 mb-2">No active projects</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Browse the marketplace to find projects that match your skills
                  </p>
                  <Link 
                    href="/projects"
                    className="nexus-action-btn inline-flex items-center gap-2"
                  >
                    Find Projects
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.filter(p => p.status === 'in_progress').map(project => (
                    <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/projects/${project.id}`} className="font-medium text-cyan-400 hover:underline">
                          {project.title}
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Client: {project.client?.full_name}</span>
                        <span className="text-sm text-gray-400">
                          {project.deadline ? `Due: ${new Date(project.deadline).toLocaleDateString()}` : 'No deadline'}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                          style={{ width: '45%' }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-400">45% complete</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Projects */}
            <div className="nexus-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Recommended Projects</h3>
                <Link href="/projects" className="text-sm text-cyan-400 hover:text-cyan-300">
                  View All
                </Link>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={30} className="animate-spin text-cyan-400" />
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-400 mb-2">No available projects</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Check back later for new projects that match your skills
                  </p>
                  <Link 
                    href="/projects"
                    className="nexus-action-btn inline-flex items-center gap-2"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableProjects.slice(0, 4).map(project => (
                    <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/projects/${project.id}`} className="font-medium text-cyan-400 hover:underline">
                          {project.title}
                        </Link>
                        <span className={`font-semibold ${getMatchColor(project.matchScore)}`}>
                          {project.matchScore}% match
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">Client: {project.client?.full_name}</div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 font-semibold">${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}</span>
                        <span className="text-sm text-gray-400">
                          {project.deadline ? `Due: ${new Date(project.deadline).toLocaleDateString()}` : 'No deadline'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
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
                      <Link 
                        href={`/projects/${project.id}`}
                        className="nexus-action-btn w-full text-sm py-2 flex items-center justify-center gap-1"
                      >
                        <Send size={14} />
                        Apply Now
                      </Link>
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
                  <option value="in_progress" className="bg-gray-900">In Progress</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
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
                    : 'You haven\'t been assigned to any projects yet'}
                </p>
                <Link 
                  href="/projects"
                  className="nexus-action-btn inline-flex items-center gap-2"
                >
                  Find Projects
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
                    
                    <div className="text-sm text-gray-400 mb-4">Client: {project.client?.full_name}</div>
                    
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
                        <span className="text-gray-400">Deadline:</span>
                        <div className="font-semibold">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                        </div>
                      </div>
                    </div>
                    
                    {project.status === 'in_progress' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                            style={{ width: '45%' }}
                          ></div>
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
                      
                      {project.status === 'in_progress' && (
                        <Link 
                          href={`/projects/${project.id}/update`}
                          className="nexus-action-btn text-sm py-2 px-4"
                        >
                          Update
                        </Link>
                      )}
                      
                      {/* Message Client Button */}
                      {user && project.client && (
                        <MessageButton 
                          userId={user.id}
                          recipientId={project.client.id}
                          recipientName={project.client.full_name}
                          recipientAvatar={project.client.avatar_url}
                          projectId={project.id}
                          variant="icon"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bids Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">My Bids</h3>
              <Link href="/projects" className="text-sm text-cyan-400 hover:text-cyan-300">
                Find More Projects
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={40} className="animate-spin text-cyan-400" />
              </div>
            ) : bids.length === 0 ? (
              <div className="nexus-card text-center py-12">
                <Send size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400 mb-2">No bids yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Browse the marketplace to find projects and submit bids
                </p>
                <Link 
                  href="/projects"
                  className="nexus-action-btn inline-flex items-center gap-2"
                >
                  Browse Projects
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bids.map(bid => (
                  <div key={bid.id} className="nexus-card">
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/projects/${bid.project?.id}`} className="font-medium text-cyan-400 hover:underline">
                        {bid.project?.title}
                      </Link>
                      <span className={`text-xs px-2 py-1 rounded-full ${getBidStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Your Bid:</span>
                        <div className="font-semibold text-green-400">${bid.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Submitted:</span>
                        <div className="font-semibold">{new Date(bid.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3 mb-4 text-sm text-gray-300">
                      <div className="text-xs text-gray-400 mb-1">Your Proposal:</div>
                      <div className="line-clamp-3">{bid.message}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        href={`/projects/${bid.project?.id}`}
                        className="nexus-action-btn flex-1 text-sm py-2 flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        View Project
                      </Link>
                      
                      {bid.status === 'accepted' && (
                        <div className="bg-green-500/20 border border-green-500/40 rounded-lg px-3 py-2 text-green-400 text-sm flex items-center gap-1">
                          <CheckCircle size={14} />
                          Accepted
                        </div>
                      )}
                      
                      {bid.status === 'rejected' && (
                        <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-red-400 text-sm flex items-center gap-1">
                          <XCircle size={14} />
                          Rejected
                        </div>
                      )}
                      
                      {/* Message Client Button */}
                      {user && bid.project?.client_id && (
                        <MessageButton 
                          userId={user.id}
                          recipientId={bid.project.client_id}
                          recipientName={bid.project.client?.full_name || 'Client'}
                          projectId={bid.project.id}
                          variant="icon"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Developer Learning Hub</h3>
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-cyan-400" />
              <p className="text-lg mb-4">Access the full learning platform</p>
              <p className="text-sm text-gray-400 mb-6">
                Explore courses, coding environments, shadowing opportunities, and skill assessments
              </p>
              <Link 
                href="/?page=learning"
                className="nexus-action-btn"
              >
                Go to Learning Platform
              </Link>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Developer Community</h3>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-purple-400" />
              <p className="text-lg mb-4">Join the developer community</p>
              <p className="text-sm text-gray-400 mb-6">
                Connect with peers, join events, participate in forums, and contribute to open source
              </p>
              <Link 
                href="/?page=community"
                className="nexus-action-btn"
              >
                Go to Community Hub
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