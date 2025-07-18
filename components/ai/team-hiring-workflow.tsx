'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Calculator,
  Send,
  UserPlus,
  Timer,
  Award,
  Target,
  Zap
} from 'lucide-react';
import { projectService } from '@/lib/services/project-service';
import { matchingService, DetailedMatch } from '@/lib/services/matching-service';

interface TeamMember {
  developer_id: string;
  task_ids: string[];
  hourly_rate: number;
  estimated_hours: number;
  status: 'invited' | 'accepted' | 'declined' | 'pending';
  invitation_sent: string;
  response_deadline: string;
}

interface DynamicPricing {
  base_rate: number;
  complexity_multiplier: number;
  urgency_multiplier: number;
  skill_premium: number;
  market_adjustment: number;
  final_rate: number;
  total_cost: number;
}

interface TeamHiringWorkflowProps {
  projectId: string;
  matches: DetailedMatch[];
  onTeamUpdate: (team: TeamMember[]) => void;
}

export default function TeamHiringWorkflow({ 
  projectId, 
  matches, 
  onTeamUpdate 
}: TeamHiringWorkflowProps) {
  const [selectedDevelopers, setSelectedDevelopers] = useState<Map<string, string[]>>(new Map());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pricing, setPricing] = useState<Map<string, DynamicPricing>>(new Map());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [showPricingDetails, setShowPricingDetails] = useState<string | null>(null);

  useEffect(() => {
    loadProjectTasks();
  }, [projectId]);

  useEffect(() => {
    calculateTeamPricing();
  }, [selectedDevelopers, projectTasks]);

  const loadProjectTasks = async () => {
    try {
      const result = await projectService.getProjectTasks(projectId);
      if (result.data) {
        setProjectTasks(result.data);
      }
    } catch (err) {
      console.error('Failed to load project tasks:', err);
    }
  };

  const calculateDynamicPricing = (
    match: DetailedMatch, 
    taskIds: string[]
  ): DynamicPricing => {
    const assignedTasks = projectTasks.filter(task => taskIds.includes(task.id));
    const totalHours = assignedTasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    const baseRate = match.developer_profile.hourly_rate;
    
    // Calculate multipliers
    const complexityMultiplier = getComplexityMultiplier(assignedTasks);
    const urgencyMultiplier = getUrgencyMultiplier();
    const skillPremium = getSkillPremium(match, assignedTasks);
    const marketAdjustment = getMarketAdjustment(match.developer_profile.skills);
    
    const finalRate = baseRate * complexityMultiplier * urgencyMultiplier + skillPremium + marketAdjustment;
    const totalCost = finalRate * totalHours;
    
    return {
      base_rate: baseRate,
      complexity_multiplier: complexityMultiplier,
      urgency_multiplier: urgencyMultiplier,
      skill_premium: skillPremium,
      market_adjustment: marketAdjustment,
      final_rate: Math.round(finalRate * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100
    };
  };

  const getComplexityMultiplier = (tasks: any[]): number => {
    const avgComplexity = tasks.reduce((sum, task) => {
      switch (task.priority) {
        case 1: return sum + 1.0; // Low complexity
        case 2: return sum + 1.2; // Medium complexity
        case 3: return sum + 1.5; // High complexity
        default: return sum + 1.0;
      }
    }, 0) / tasks.length;
    
    return avgComplexity || 1.0;
  };

  const getUrgencyMultiplier = (): number => {
    // This would typically come from project urgency settings
    return 1.1; // 10% urgency premium
  };

  const getSkillPremium = (match: DetailedMatch, tasks: any[]): number => {
    const requiredSkills = new Set(
      tasks.flatMap(task => task.required_skills || [])
    );
    
    const expertSkills = match.developer_profile.skills.filter(skill => 
      requiredSkills.has(skill) && match.match_details.skill_matches.includes(skill)
    );
    
    return expertSkills.length * 5; // $5 premium per expert skill
  };

  const getMarketAdjustment = (skills: string[]): number => {
    // High-demand skills get market premium
    const highDemandSkills = ['React', 'Node.js', 'Python', 'AWS', 'Kubernetes'];
    const premiumSkills = skills.filter(skill => highDemandSkills.includes(skill));
    
    return premiumSkills.length * 3; // $3 market adjustment per high-demand skill
  };

  const calculateTeamPricing = () => {
    const newPricing = new Map<string, DynamicPricing>();
    let total = 0;
    
    selectedDevelopers.forEach((taskIds, developerId) => {
      const match = matches.find(m => m.developer === developerId);
      if (match && taskIds.length > 0) {
        const pricing = calculateDynamicPricing(match, taskIds);
        newPricing.set(developerId, pricing);
        total += pricing.total_cost;
      }
    });
    
    setPricing(newPricing);
    setTotalBudget(total);
  };

  const toggleDeveloperTask = (developerId: string, taskId: string) => {
    const currentTasks = selectedDevelopers.get(developerId) || [];
    const newTasks = currentTasks.includes(taskId)
      ? currentTasks.filter(id => id !== taskId)
      : [...currentTasks, taskId];
    
    const newSelected = new Map(selectedDevelopers);
    if (newTasks.length === 0) {
      newSelected.delete(developerId);
    } else {
      newSelected.set(developerId, newTasks);
    }
    
    setSelectedDevelopers(newSelected);
  };

  const inviteDeveloper = async (developerId: string) => {
    const taskIds = selectedDevelopers.get(developerId);
    if (!taskIds || taskIds.length === 0) {
      setError('Please select at least one task for this developer');
      return;
    }

    setInviting(prev => new Set(prev).add(developerId));
    setError(null);

    try {
      const result = await projectService.inviteDeveloper(projectId, developerId, taskIds);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update team members
      const match = matches.find(m => m.developer === developerId);
      const pricingInfo = pricing.get(developerId);
      
      if (match && pricingInfo) {
        const newMember: TeamMember = {
          developer_id: developerId,
          task_ids: taskIds,
          hourly_rate: pricingInfo.final_rate,
          estimated_hours: projectTasks
            .filter(task => taskIds.includes(task.id))
            .reduce((sum, task) => sum + task.estimated_hours, 0),
          status: 'invited',
          invitation_sent: new Date().toISOString(),
          response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const updatedTeam = [...teamMembers, newMember];
        setTeamMembers(updatedTeam);
        onTeamUpdate(updatedTeam);
      }

      setSuccess(`Invitation sent to developer successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to invite developer:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(prev => {
        const newSet = new Set(prev);
        newSet.delete(developerId);
        return newSet;
      });
    }
  };

  const inviteAllSelected = async () => {
    setLoading(true);
    const invitations = Array.from(selectedDevelopers.keys());
    
    for (const developerId of invitations) {
      await inviteDeveloper(developerId);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-500/20';
      case 'declined':
        return 'text-red-400 bg-red-500/20';
      case 'invited':
        return 'text-blue-400 bg-blue-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={14} />;
      case 'declined':
        return <XCircle size={14} />;
      case 'invited':
        return <Send size={14} />;
      case 'pending':
        return <Timer size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Hiring Workflow</h2>
          <p className="text-gray-400">Select developers and tasks with dynamic pricing</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Budget</div>
            <div className="text-2xl font-bold text-green-400">
              ${totalBudget.toLocaleString()}
            </div>
          </div>
          
          {selectedDevelopers.size > 0 && (
            <button
              onClick={inviteAllSelected}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Invite All ({selectedDevelopers.size})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Current Team Members */}
      {teamMembers.length > 0 && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={18} />
            Current Team ({teamMembers.length} members)
          </h3>
          
          <div className="space-y-3">
            {teamMembers.map((member, index) => {
              const match = matches.find(m => m.developer === member.developer_id);
              const statusStyle = getStatusColor(member.status);
              
              return (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-white" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-white">
                          {match?.developer_profile.user.email.split('@')[0] || 'Developer'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {member.task_ids.length} tasks • {member.estimated_hours}h • ${member.hourly_rate}/hr
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${statusStyle}`}>
                      {getStatusIcon(member.status)}
                      <span className="capitalize">{member.status}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    Invited: {new Date(member.invitation_sent).toLocaleDateString()} • 
                    Deadline: {new Date(member.response_deadline).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Developer Selection */}
      <div className="space-y-4">
        {matches.map((match) => {
          const isSelected = selectedDevelopers.has(match.developer);
          const selectedTasks = selectedDevelopers.get(match.developer) || [];
          const pricingInfo = pricing.get(match.developer);
          const isInviting = inviting.has(match.developer);
          
          return (
            <div
              key={match.developer}
              className={`bg-white/5 backdrop-blur-lg border rounded-xl p-6 transition-all duration-200 ${
                isSelected ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {match.developer_profile.user.email.split('@')[0]}
                      </h3>
                      
                      <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400">
                        {Math.round(match.match_score * 100)}% Match
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" />
                        <span>{match.developer_profile.reputation_score.toFixed(1)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>${match.developer_profile.hourly_rate}/hr</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Award size={14} />
                        <span className="capitalize">{match.developer_profile.experience_level}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {pricingInfo && (
                    <button
                      onClick={() => setShowPricingDetails(
                        showPricingDetails === match.developer ? null : match.developer
                      )}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Calculator size={14} />
                      Pricing
                    </button>
                  )}
                  
                  <button
                    onClick={() => inviteDeveloper(match.developer)}
                    disabled={!isSelected || isInviting}
                    className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Invite
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Task Selection */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Select Tasks</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {projectTasks.map((task) => {
                    const isTaskSelected = selectedTasks.includes(task.id);
                    
                    return (
                      <label
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isTaskSelected
                            ? 'bg-cyan-500/10 border-cyan-500/40'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isTaskSelected}
                          onChange={() => toggleDeveloperTask(match.developer, task.id)}
                          className="rounded"
                        />
                        
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{task.title}</div>
                          <div className="text-xs text-gray-400">
                            {task.estimated_hours}h • Priority {task.priority}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Pricing Details */}
              {pricingInfo && showPricingDetails === match.developer && (
                <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <Calculator size={14} />
                    Dynamic Pricing Breakdown
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Base Rate</div>
                      <div className="text-white font-medium">${pricingInfo.base_rate}/hr</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Complexity</div>
                      <div className="text-white font-medium">×{pricingInfo.complexity_multiplier.toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Urgency</div>
                      <div className="text-white font-medium">×{pricingInfo.urgency_multiplier.toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Skill Premium</div>
                      <div className="text-white font-medium">+${pricingInfo.skill_premium}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Market Adj.</div>
                      <div className="text-white font-medium">+${pricingInfo.market_adjustment}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Final Rate</div>
                      <div className="text-green-400 font-bold">${pricingInfo.final_rate}/hr</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Cost</span>
                      <span className="text-xl font-bold text-green-400">
                        ${pricingInfo.total_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Match */}
              <div className="flex flex-wrap gap-2">
                {match.developer_profile.skills.slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs ${
                      match.match_details.skill_matches.includes(skill)
                        ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                        : 'bg-gray-500/20 border border-gray-500/40 text-gray-400'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}