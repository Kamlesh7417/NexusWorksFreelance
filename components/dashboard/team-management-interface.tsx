'use client';

import React, { useState, useCallback } from 'react';
import { useProject } from './project-context';
import { projectService } from '@/lib/services/project-service';
import { 
  Users, 
  Crown, 
  Star, 
  Clock, 
  DollarSign, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare,
  UserPlus,
  UserMinus,
  Eye,
  Edit,
  MoreVertical,
  Activity,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';

interface TeamManagementInterfaceProps {
  teamManagement: any;
  projectDetails: any;
  onTeamUpdate: () => void;
}

interface TeamMember {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'client' | 'senior_developer' | 'developer';
  tasks_assigned: number;
  tasks_completed: number;
  total_hours_logged: number;
  total_earnings: number;
  last_activity: string;
  profile: any;
}

interface PendingInvitation {
  id: string;
  task: any;
  developer: any;
  match_score: number;
  offered_rate: number;
  estimated_hours: number;
  invited_at: string;
  expires_at: string;
  invitation_rank: number;
}

export function TeamManagementInterface({ 
  teamManagement, 
  projectDetails, 
  onTeamUpdate 
}: TeamManagementInterfaceProps) {
  const { hasPermission, isSeniorDeveloper } = useProject();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  // Get role display info
  const getRoleInfo = (role: string) => {
    const roleMap = {
      client: { label: 'Client', color: 'text-purple-400', bg: 'bg-purple-600/20', icon: Crown },
      senior_developer: { label: 'Senior Developer', color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Star },
      developer: { label: 'Developer', color: 'text-blue-400', bg: 'bg-blue-600/20', icon: Users }
    };
    return roleMap[role as keyof typeof roleMap] || roleMap.developer;
  };

  // Calculate team member performance
  const calculatePerformance = (member: TeamMember) => {
    const completionRate = member.tasks_assigned > 0 ? (member.tasks_completed / member.tasks_assigned) * 100 : 0;
    const avgEarningsPerTask = member.tasks_completed > 0 ? member.total_earnings / member.tasks_completed : 0;
    const hoursPerTask = member.tasks_completed > 0 ? member.total_hours_logged / member.tasks_completed : 0;
    
    return {
      completionRate: Math.round(completionRate),
      avgEarningsPerTask: Math.round(avgEarningsPerTask),
      hoursPerTask: Math.round(hoursPerTask * 10) / 10
    };
  };

  // Handle invitation response
  const handleInvitationResponse = useCallback(async (invitationId: string, action: 'accept' | 'decline') => {
    if (!hasPermission('manage_team')) return;

    try {
      setProcessingInvitation(invitationId);
      
      const response = await fetch(`/api/invitations/${invitationId}/${action}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} invitation`);
      }

      onTeamUpdate();
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
    } finally {
      setProcessingInvitation(null);
    }
  }, [hasPermission, onTeamUpdate]);

  // Remove team member
  const removeMember = useCallback(async (memberId: string) => {
    if (!hasPermission('manage_team')) return;

    try {
      await projectService.removeDeveloper(projectDetails.id, memberId);
      onTeamUpdate();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  }, [hasPermission, projectDetails.id, onTeamUpdate]);

  if (!teamManagement) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Loading team information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Members</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {teamManagement.team_members?.length || 0}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Active Developers</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {teamManagement.team_metrics?.active_developers || 0}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(teamManagement.team_metrics?.total_hours_logged || 0)}h
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Budget</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${Math.round(teamManagement.team_metrics?.total_budget_spent || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700/50">
        {[
          { id: 'members', label: 'Team Members', count: teamManagement.team_members?.length || 0 },
          { id: 'invitations', label: 'Pending Invitations', count: teamManagement.pending_invitations?.length || 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Team Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Team Members</h3>
            {hasPermission('manage_team') && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite Developer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamManagement.team_members?.map((member: TeamMember) => {
              const roleInfo = getRoleInfo(member.role);
              const RoleIcon = roleInfo.icon;
              const performance = calculatePerformance(member);

              return (
                <div
                  key={member.id}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{member.name}</h4>
                        <p className="text-gray-400 text-sm">@{member.username}</p>
                        <div className={`flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs ${roleInfo.bg} ${roleInfo.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowMemberModal(true);
                        }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                      
                      {hasPermission('manage_team') && member.role !== 'client' && (
                        <div className="relative group">
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => removeMember(member.id)}
                              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors w-full text-left"
                            >
                              <UserMinus className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Tasks</div>
                      <div className="text-white font-semibold">
                        {member.tasks_completed}/{member.tasks_assigned}
                      </div>
                      <div className="text-xs text-gray-500">
                        {performance.completionRate}% completion
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Hours Logged</div>
                      <div className="text-white font-semibold">
                        {Math.round(member.total_hours_logged)}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {performance.hoursPerTask}h avg/task
                      </div>
                    </div>
                  </div>

                  {/* Member Profile Info */}
                  {member.profile && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Experience</span>
                        <span className="text-white capitalize">{member.profile.experience_level}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Hourly Rate</span>
                        <span className="text-white">${member.profile.hourly_rate}/hr</span>
                      </div>
                      
                      {member.profile.reputation_score > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Reputation</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-white">{member.profile.reputation_score}/5</span>
                          </div>
                        </div>
                      )}

                      {member.profile.skills?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-400 mb-2">Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {member.profile.skills.slice(0, 4).map((skill: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {member.profile.skills.length > 4 && (
                              <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                                +{member.profile.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/50">
                    <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors">
                      <Mail className="h-3 w-3" />
                      Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Pending Invitations</h3>
          
          {teamManagement.pending_invitations?.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamManagement.pending_invitations?.map((invitation: PendingInvitation) => (
                <div
                  key={invitation.id}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {invitation.task.title}
                        </h4>
                        <div className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                          Rank #{invitation.invitation_rank}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>Match Score: {Math.round(invitation.match_score * 100)}%</span>
                        <span>Rate: ${invitation.offered_rate}/hr</span>
                        <span>Est. {invitation.estimated_hours}h</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {invitation.developer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{invitation.developer.name}</div>
                          <div className="text-gray-400 text-sm">@{invitation.developer.username}</div>
                        </div>
                      </div>

                      {invitation.developer.profile && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {invitation.developer.profile.skills?.slice(0, 5).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {hasPermission('manage_team') && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                          disabled={processingInvitation === invitation.id}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                          disabled={processingInvitation === invitation.id}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Invited {new Date(invitation.invited_at).toLocaleDateString()} • 
                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Invite Developer Modal */}
      {showInviteModal && (
        <InviteDeveloperModal
          projectId={projectDetails.id}
          onClose={() => setShowInviteModal(false)}
          onInvite={onTeamUpdate}
        />
      )}
    </div>
  );
}

// Member Detail Modal
function MemberDetailModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const roleInfo = getRoleInfo(member.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {member.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{member.name}</h2>
                <p className="text-gray-400">@{member.username}</p>
                <div className={`flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs ${roleInfo.bg} ${roleInfo.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{member.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">
                  Last active: {member.last_activity ? new Date(member.last_activity).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">{member.tasks_completed}</div>
                <div className="text-sm text-gray-400">Tasks Completed</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">{Math.round(member.total_hours_logged)}h</div>
                <div className="text-sm text-gray-400">Hours Logged</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">${Math.round(member.total_earnings).toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Earnings</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">
                  {member.tasks_assigned > 0 ? Math.round((member.tasks_completed / member.tasks_assigned) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Completion Rate</div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          {member.profile && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience Level:</span>
                  <span className="text-white capitalize">{member.profile.experience_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hourly Rate:</span>
                  <span className="text-white">${member.profile.hourly_rate}/hr</span>
                </div>
                {member.profile.reputation_score > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reputation:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-white">{member.profile.reputation_score}/5</span>
                    </div>
                  </div>
                )}
                
                {member.profile.skills?.length > 0 && (
                  <div>
                    <div className="text-gray-400 mb-2">Skills:</div>
                    <div className="flex flex-wrap gap-2">
                      {member.profile.skills.map((skill: string, index: number) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Invite Developer Modal
function InviteDeveloperModal({ 
  projectId, 
  onClose, 
  onInvite 
}: { 
  projectId: string; 
  onClose: () => void; 
  onInvite: () => void; 
}) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableDevelopers, setAvailableDevelopers] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Invite Developer</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Developer invitation interface will be implemented...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function (moved outside component to avoid re-creation)
function getRoleInfo(role: string) {
  const roleMap = {
    client: { label: 'Client', color: 'text-purple-400', bg: 'bg-purple-600/20', icon: Crown },
    senior_developer: { label: 'Senior Developer', color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Star },
    developer: { label: 'Developer', color: 'text-blue-400', bg: 'bg-blue-600/20', icon: Users }
  };
  return roleMap[role as keyof typeof roleMap] || roleMap.developer;
}