'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectManager, Task } from '@/lib/project-management';
import { GitHubIntegration } from '@/lib/github';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  GitBranch,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react';

interface ProjectDashboardProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

export function ProjectDashboard({ project, onProjectUpdate }: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'team' | 'github'>('overview');
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubIssues, setGithubIssues] = useState<any[]>([]);
  const [slaReport, setSlaReport] = useState<any>(null);

  useEffect(() => {
    // Calculate SLA report
    const report = ProjectManager.generateSLAReport(project);
    setSlaReport(report);

    // Load GitHub data if connected
    if (project.githubRepo) {
      loadGitHubData();
    }
  }, [project]);

  const loadGitHubData = async () => {
    // This would use actual GitHub token in production
    const mockToken = 'github_token';
    
    if (project.githubRepo) {
      const issues = await GitHubIntegration.getRepoIssues(
        mockToken, 
        project.githubRepo.owner, 
        project.githubRepo.repo
      );
      setGithubIssues(issues);
    }
  };

  const progress = ProjectManager.calculateProjectProgress(project);
  const timeline = ProjectManager.estimateProjectTimeline(project);
  const pricing = ProjectManager.calculateDynamicPricing(project);

  const tasksByStatus = {
    todo: project.tasks.filter(t => t.status === 'todo').length,
    'in-progress': project.tasks.filter(t => t.status === 'in-progress').length,
    review: project.tasks.filter(t => t.status === 'review').length,
    done: project.tasks.filter(t => t.status === 'done').length,
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">{project.name}</h2>
          <p className="text-sm opacity-80">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            project.status === 'active' ? 'bg-green-500/20 text-green-400' :
            project.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
            project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {project.status}
          </span>
          <span className="text-cyan-400 font-semibold">{progress}% Complete</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'tasks', label: 'Tasks', icon: CheckCircle },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'github', label: 'GitHub', icon: GitBranch },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-cyan-400" />
                <span className="text-sm">Progress</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">{progress}%</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-sm">Budget</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                ${project.budget.allocated.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                Spent: ${project.budget.spent.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-yellow-400" />
                <span className="text-sm">Timeline</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{timeline.estimatedDays}</div>
              <div className="text-xs text-gray-400">days estimated</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className={getRiskColor(slaReport?.riskLevel)} />
                <span className="text-sm">Risk Level</span>
              </div>
              <div className={`text-2xl font-bold capitalize ${getRiskColor(slaReport?.riskLevel)}`}>
                {slaReport?.riskLevel}
              </div>
              <div className="text-xs text-gray-400">
                {slaReport?.overdueTasks} overdue tasks
              </div>
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-cyan-400 font-semibold mb-4">Task Distribution</h4>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    status === 'done' ? 'text-green-400' :
                    status === 'in-progress' ? 'text-yellow-400' :
                    status === 'review' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {status.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Compliance */}
          {slaReport && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-4">SLA Compliance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span>{slaReport.responseTimeCompliance}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${slaReport.responseTimeCompliance}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Resolution Time</span>
                    <span>{slaReport.resolutionTimeCompliance}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full"
                      style={{ width: `${slaReport.resolutionTimeCompliance}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Pricing */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
            <h4 className="text-purple-400 font-semibold mb-2">Quantum Pricing Analysis</h4>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              ${pricing.toLocaleString()}
            </div>
            <p className="text-sm opacity-80">
              Dynamic pricing based on complexity, urgency, and team size
            </p>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-cyan-400 font-semibold">Project Tasks</h4>
            <button className="nexus-action-btn text-sm px-4 py-2">
              Create Task
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {project.tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h4 className="text-cyan-400 font-semibold">Project Timeline</h4>
          
          <div className="space-y-4">
            {project.timeline.milestones.map(milestone => (
              <div key={milestone.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-cyan-400">{milestone.name}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    milestone.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    milestone.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
                <p className="text-sm opacity-80 mb-2">{milestone.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                  <span>{milestone.completionPercentage}% complete</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                    style={{ width: `${milestone.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-cyan-400 font-semibold">Team Members</h4>
            <button className="nexus-action-btn text-sm px-4 py-2">
              Add Member
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.team.map((member, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <Users size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium text-cyan-400">{member}</div>
                    <div className="text-xs text-gray-400">Team Member</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GitHub Tab */}
      {activeTab === 'github' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-cyan-400 font-semibold">GitHub Integration</h4>
            {!project.githubRepo && (
              <button className="nexus-action-btn text-sm px-4 py-2">
                Connect Repository
              </button>
            )}
          </div>
          
          {project.githubRepo ? (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch size={16} className="text-cyan-400" />
                  <span className="font-medium">Connected Repository</span>
                </div>
                <a 
                  href={project.githubRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  {project.githubRepo.owner}/{project.githubRepo.repo}
                </a>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="font-medium text-cyan-400 mb-3">Recent Issues</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {githubIssues.slice(0, 5).map(issue => (
                    <div key={issue.id} className="bg-white/5 rounded-lg p-3 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">#{issue.number}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          issue.state === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {issue.state}
                        </span>
                      </div>
                      <p className="text-sm">{issue.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
              <p>No GitHub repository connected</p>
              <p className="text-sm">Connect a repository to enable code collaboration</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-400 bg-green-500/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-500/20';
      case 'review': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-cyan-400">{task.title}</h5>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>
      </div>
      
      <p className="text-sm opacity-80 mb-3">{task.description}</p>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span>SP: {task.storyPoints}</span>
          <span>Est: {task.timeTracking.estimated}h</span>
          {task.assignee && <span>Assigned: {task.assignee}</span>}
        </div>
        {task.dueDate && (
          <span className="text-gray-400">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      
      {task.timeTracking.logged > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{Math.round((task.timeTracking.logged / task.timeTracking.estimated) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full"
              style={{ width: `${Math.min((task.timeTracking.logged / task.timeTracking.estimated) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}