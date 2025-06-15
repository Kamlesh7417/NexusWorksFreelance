'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Clock, 
  Users, 
  Briefcase,
  Tag,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Flag,
  Zap,
  Star,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { BidForm } from '@/components/ui/bid-form';
import { ProjectMilestone } from '@/components/ui/project-milestone';
import { MessageButton } from '@/components/ui/message-button';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [userHasBid, setUserHasBid] = useState(false);
  const [userBid, setUserBid] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllBids, setShowAllBids] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const { data: project, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url, role, bio, location),
            developer:user_profiles!projects_developer_id_fkey(id, full_name, avatar_url, role, bio, location)
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        setProject(project);

        // Fetch bids for this project
        const { data: bids, error: bidsError } = await supabase
          .from('project_bids')
          .select(`
            *,
            freelancer:user_profiles(id, full_name, avatar_url, role, hourly_rate, skills)
          `)
          .eq('project_id', params.id);

        if (bidsError) {
          throw bidsError;
        }

        setBids(bids || []);

        // Fetch milestones for this project
        const { data: milestones, error: milestonesError } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', params.id)
          .order('due_date', { ascending: true });

        if (milestonesError) {
          throw milestonesError;
        }

        setMilestones(milestones || []);

        // Check if current user has already bid on this project
        if (user) {
          const userBid = bids?.find(bid => bid.freelancer?.id === user.id);
          if (userBid) {
            setUserHasBid(true);
            setUserBid(userBid);
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id, supabase, user]);

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (error) throw error;
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const refreshMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', params.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error refreshing milestones:', error);
    }
  };

  const handleAcceptBid = async (bidId: string, developerId: string) => {
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
        .eq('id', project.id);
      
      // Reject all other bids for this project
      await supabase
        .from('project_bids')
        .update({ status: 'rejected' })
        .eq('project_id', project.id)
        .neq('id', bidId);
      
      // Refresh project data
      const { data: updatedProject } = await supabase
        .from('projects')
        .select(`
          *,
          client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url, role, bio, location),
          developer:user_profiles!projects_developer_id_fkey(id, full_name, avatar_url, role, bio, location)
        `)
        .eq('id', params.id)
        .single();
      
      setProject(updatedProject);
      
      // Refresh bids
      const { data: updatedBids } = await supabase
        .from('project_bids')
        .select(`
          *,
          freelancer:user_profiles(id, full_name, avatar_url, role, hourly_rate, skills)
        `)
        .eq('project_id', params.id);
      
      setBids(updatedBids || []);
      
      // Send a message to the developer
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: developerId,
          project_id: project.id,
          content: `Congratulations! Your bid for the project "${project.title}" has been accepted. Let's get started!`,
          read: false
        });
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  const handleRejectBid = async (bidId: string, developerId: string) => {
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
          freelancer:user_profiles(id, full_name, avatar_url, role, hourly_rate, skills)
        `)
        .eq('project_id', params.id);
      
      setBids(updatedBids || []);
      
      // Send a message to the developer
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: developerId,
          project_id: project.id,
          content: `Thank you for your interest in the project "${project.title}". Unfortunately, we've decided to go with another developer for this project.`,
          read: false
        });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid. Please try again.');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'expert': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'complex': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'simple': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'active': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
      case 'draft': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'rejected': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
    }
  };

  const isClient = user && project?.client?.id === user.id;
  const isDeveloper = user && project?.developer?.id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-4">The project you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/projects"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-gray-400 capitalize">{project.category.replace('-', ' ')}</span>
                <span className="text-gray-400">•</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(project.urgency)}`}>
                  {project.urgency} urgency
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getComplexityColor(project.complexity)}`}>
                  {project.complexity} complexity
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isClient && project.status === 'active' && (
                <>
                  <Link 
                    href={`/projects/${project.id}/edit`}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Project
                  </Link>
                  <button
                    onClick={handleDeleteProject}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
              
              {isDeveloper && project.status === 'in_progress' && (
                <Link 
                  href={`/projects/${project.id}/update`}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Clock size={16} />
                  Update Progress
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Project Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Description */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Project Description</h2>
              <div className="text-gray-300 space-y-4 whitespace-pre-line">
                {project.description}
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required && project.skills_required.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Milestones */}
            {milestones.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Project Milestones</h2>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <ProjectMilestone 
                      key={milestone.id} 
                      milestone={milestone} 
                      projectId={project.id}
                      isClient={isClient}
                      isDeveloper={isDeveloper}
                      onUpdate={refreshMilestones}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bid Section */}
            {user && profile && profile.role !== 'client' && project.status === 'active' && (
              <div id="bid-section" className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {userHasBid ? 'Your Bid' : 'Submit a Bid'}
                </h2>
                
                {userHasBid ? (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-cyan-400">Your Bid Details</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getBidStatusColor(userBid.status)}`}>
                        {userBid.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Your Bid Amount</div>
                        <div className="text-xl font-semibold text-green-400">${userBid.amount.toLocaleString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Submitted On</div>
                        <div className="text-white">{new Date(userBid.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Your Proposal</div>
                      <div className="bg-white/5 rounded-lg p-3 text-gray-300">
                        {userBid.message}
                      </div>
                    </div>
                    
                    {/* Message Client Button */}
                    {user && project.client && (
                      <div className="mt-4">
                        <MessageButton 
                          userId={user.id}
                          recipientId={project.client.id}
                          recipientName={project.client.full_name}
                          recipientAvatar={project.client.avatar_url}
                          projectId={project.id}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <BidForm 
                    projectId={project.id}
                    userId={user.id}
                    projectBudget={{
                      min: project.budget_min,
                      max: project.budget_max
                    }}
                    onBidSubmitted={() => {
                      setUserHasBid(true);
                      // Refresh bids
                      supabase
                        .from('project_bids')
                        .select(`
                          *,
                          freelancer:user_profiles(id, full_name, avatar_url, role, hourly_rate, skills)
                        `)
                        .eq('project_id', params.id)
                        .eq('freelancer_id', user.id)
                        .single()
                        .then(({ data }) => {
                          if (data) setUserBid(data);
                        });
                    }}
                  />
                )}
              </div>
            )}

            {/* Bids Section - Only visible to project owner */}
            {isClient && bids.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Project Bids ({bids.length})
                </h2>
                
                <div className="space-y-4">
                  {bids.slice(0, showAllBids ? undefined : 3).map(bid => (
                    <div key={bid.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {bid.freelancer?.avatar_url ? (
                            <img 
                              src={bid.freelancer.avatar_url} 
                              alt={bid.freelancer.full_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <User size={16} className="text-cyan-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{bid.freelancer?.full_name}</div>
                            <div className="text-xs text-gray-400 capitalize">{bid.freelancer?.role}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-semibold text-green-400">${bid.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(bid.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-3 mb-3 text-gray-300 text-sm">
                        {bid.message}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {bid.freelancer?.skills && bid.freelancer.skills.slice(0, 5).map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-xs px-2 py-1 rounded-full ${getBidStatusColor(bid.status)}`}>
                          {bid.status}
                        </div>
                        
                        <div className="flex gap-2">
                          {project.status === 'active' && bid.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleAcceptBid(bid.id, bid.freelancer.id)}
                                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-3 rounded-lg transition-all duration-200"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleRejectBid(bid.id, bid.freelancer.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-medium py-2 px-3 rounded-lg transition-all duration-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {/* Message Button */}
                          {user && bid.freelancer && (
                            <MessageButton 
                              userId={user.id}
                              recipientId={bid.freelancer.id}
                              recipientName={bid.freelancer.full_name}
                              recipientAvatar={bid.freelancer.avatar_url}
                              projectId={project.id}
                              variant="icon"
                            />
                          )}
                          
                          <button className="bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {bids.length > 3 && (
                    <button
                      onClick={() => setShowAllBids(!showAllBids)}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      {showAllBids ? 'Show Less' : `Show All ${bids.length} Bids`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Project Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <DollarSign size={20} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Budget</div>
                    <div className="font-semibold text-green-400">
                      ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {project.deadline && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Calendar size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Deadline</div>
                      <div className="font-semibold text-white">
                        {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                
                {project.estimated_hours && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Clock size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Estimated Hours</div>
                      <div className="font-semibold text-white">{project.estimated_hours} hours</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Tag size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Category</div>
                    <div className="font-semibold text-white capitalize">
                      {project.category.replace('-', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <Briefcase size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Bids</div>
                    <div className="font-semibold text-white">{bids.length} proposals</div>
                  </div>
                </div>
                
                {project.created_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <Clock size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Posted</div>
                      <div className="font-semibold text-white">
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
            {project.client && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About the Client</h2>
                
                <div className="flex items-center gap-3 mb-4">
                  {project.client.avatar_url ? (
                    <img 
                      src={project.client.avatar_url} 
                      alt={project.client.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <User size={20} className="text-cyan-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{project.client.full_name}</div>
                    <div className="text-sm text-gray-400 capitalize">{project.client.role}</div>
                  </div>
                </div>
                
                {project.client.bio && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Bio</div>
                    <p className="text-gray-300 text-sm">{project.client.bio}</p>
                  </div>
                )}
                
                {project.client.location && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Location</div>
                    <div className="flex items-center gap-1 text-white">
                      <MapPin size={14} className="text-gray-400" />
                      {project.client.location}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    <span className="text-white">4.9</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">15 reviews</span>
                </div>
                
                {user && user.id !== project.client.id && (
                  <MessageButton 
                    userId={user.id}
                    recipientId={project.client.id}
                    recipientName={project.client.full_name}
                    recipientAvatar={project.client.avatar_url}
                    projectId={project.id}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* Developer Information (if assigned) */}
            {project.developer && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Assigned Developer</h2>
                
                <div className="flex items-center gap-3 mb-4">
                  {project.developer.avatar_url ? (
                    <img 
                      src={project.developer.avatar_url} 
                      alt={project.developer.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{project.developer.full_name}</div>
                    <div className="text-sm text-gray-400 capitalize">{project.developer.role}</div>
                  </div>
                </div>
                
                {project.developer.bio && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Bio</div>
                    <p className="text-gray-300 text-sm">{project.developer.bio}</p>
                  </div>
                )}
                
                {project.developer.location && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Location</div>
                    <div className="flex items-center gap-1 text-white">
                      <MapPin size={14} className="text-gray-400" />
                      {project.developer.location}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    <span className="text-white">4.8</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">12 reviews</span>
                </div>
                
                {user && user.id !== project.developer.id && (
                  <MessageButton 
                    userId={user.id}
                    recipientId={project.developer.id}
                    recipientName={project.developer.full_name}
                    recipientAvatar={project.developer.avatar_url}
                    projectId={project.id}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* AI Project Analysis */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">AI Project Analysis</h2>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Complexity</div>
                  <div className="font-semibold text-white capitalize">{project.complexity || 'Moderate'}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Estimated Effort</div>
                  <div className="font-semibold text-white">{project.estimated_hours || '40'} hours</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Recommended Team</div>
                  <div className="font-semibold text-white">1-2 developers</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Success Probability</div>
                  <div className="font-semibold text-green-400">92%</div>
                </div>
              </div>
            </div>

            {/* Report Project */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <button className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-gray-400 hover:text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <Flag size={16} />
                Report Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}