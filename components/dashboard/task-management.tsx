'use client';

import React, { useState, useCallback } from 'react';
import { useProject } from './project-context';
import { projectService } from '@/lib/services/project-service';
import { 
  CheckCircle, 
  Clock, 
  User, 
  AlertCircle, 
  Play, 
  Pause, 
  Edit, 
  Eye,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  GitBranch
} from 'lucide-react';

interface TaskManagementProps {
  taskProgress: any;
  projectDetails: any;
  filteredTasks: any[];
  taskFilter: string;
  setTaskFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onTaskUpdate: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  estimated_hours: number;
  completion_percentage: number;
  required_skills: string[];
  dependencies: string[];
  assigned_developer: any;
  assignment_details: any;
  created_at: string;
  updated_at: string;
}

export function TaskManagement({
  taskProgress,
  projectDetails,
  filteredTasks,
  taskFilter,
  setTaskFilter,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  onTaskUpdate
}: TaskManagementProps) {
  const { hasPermission, isSeniorDeveloper } = useProject();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // Task status colors and icons
  const getTaskStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock },
      assigned: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: User },
      in_progress: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Play },
      completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle },
      approved: { color: 'text-green-500', bg: 'bg-green-500/20', icon: CheckCircle },
      disputed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Priority colors
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-400';
    if (priority >= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Update task status
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    if (!hasPermission('update_tasks') && !hasPermission('approve_tasks')) {
      return;
    }

    try {
      setUpdatingTask(taskId);
      await projectService.updateTask(taskId, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setUpdatingTask(null);
    }
  }, [hasPermission, onTaskUpdate]);

  // Update task progress
  const updateTaskProgress = useCallback(async (taskId: string, progress: number) => {
    if (!hasPermission('update_tasks')) {
      return;
    }

    try {
      setUpdatingTask(taskId);
      await projectService.updateTask(taskId, { completion_percentage: progress });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task progress:', error);
    } finally {
      setUpdatingTask(null);
    }
  }, [hasPermission, onTaskUpdate]);

  // Assign developer to task
  const assignDeveloper = useCallback(async (taskId: string, developerId: string) => {
    if (!hasPermission('manage_team')) {
      return;
    }

    try {
      setUpdatingTask(taskId);
      await projectService.assignDeveloperToTask(taskId, developerId);
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to assign developer:', error);
    } finally {
      setUpdatingTask(null);
    }
  }, [hasPermission, onTaskUpdate]);

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {taskProgress?.task_statistics && Object.entries(taskProgress.task_statistics).map(([key, value]) => {
          const statusInfo = getTaskStatusInfo(key.replace('_tasks', ''));
          const Icon = statusInfo.icon;
          
          return (
            <div key={key} className={`${statusInfo.bg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${statusInfo.color}`} />
                <span className="text-sm text-gray-400 capitalize">
                  {key.replace('_', ' ')}
                </span>
              </div>
              <div className={`text-2xl font-bold ${statusInfo.color}`}>
                {value as number}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {hasPermission('manage_team') && (
          <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'assigned', 'in_progress', 'completed', 'approved', 'disputed'].map(status => (
              <button
                key={status}
                onClick={() => setTaskFilter(status)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  taskFilter === status
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All Tasks' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Critical Path Tasks */}
      {taskProgress?.critical_path_tasks?.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Critical Path Tasks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskProgress.critical_path_tasks.map((task: any) => (
              <div key={task.id} className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">{task.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className={`capitalize ${getTaskStatusInfo(task.status).color}`}>
                    {task.status}
                  </span>
                  <span className="text-gray-400">
                    {task.completion_percentage}% complete
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${task.completion_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tasks found matching your criteria</p>
          </div>
        ) : (
          filteredTasks.map((task: Task) => {
            const statusInfo = getTaskStatusInfo(task.status);
            const StatusIcon = statusInfo.icon;
            const isUpdating = updatingTask === task.id;
            
            return (
              <div
                key={task.id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {task.status.replace('_', ' ')}
                      </div>
                      <div className={`text-xs ${getPriorityColor(task.priority)}`}>
                        Priority {task.priority}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                    
                    {/* Task Skills */}
                    {task.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.required_skills.map((skill, index) => (
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
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {hasPermission('update_tasks') && (
                      <button
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit Task"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{task.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.completion_percentage}%` }}
                      />
                    </div>
                    {hasPermission('update_tasks') && (
                      <div className="flex gap-1 mt-2">
                        {[25, 50, 75, 100].map(progress => (
                          <button
                            key={progress}
                            onClick={() => updateTaskProgress(task.id, progress)}
                            disabled={isUpdating}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                          >
                            {progress}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignment */}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Assigned Developer</div>
                    {task.assigned_developer ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {task.assigned_developer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-white text-sm">{task.assigned_developer.name}</div>
                          <div className="text-gray-400 text-xs">@{task.assigned_developer.username}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Unassigned</div>
                    )}
                  </div>

                  {/* Time & Budget */}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Time & Budget</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-3 w-3" />
                        {task.estimated_hours}h estimated
                      </div>
                      {task.assignment_details && (
                        <>
                          <div className="flex items-center gap-2 text-gray-300">
                            <TrendingUp className="h-3 w-3" />
                            {task.assignment_details.hours_logged}h logged
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="h-3 w-3" />
                            ${task.assignment_details.spent_budget || 0}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                {(hasPermission('update_tasks') || hasPermission('approve_tasks')) && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/50">
                    {task.status === 'pending' && hasPermission('manage_team') && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'assigned')}
                        disabled={isUpdating}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                      >
                        <User className="h-3 w-3" />
                        Assign
                      </button>
                    )}
                    
                    {task.status === 'assigned' && hasPermission('update_tasks') && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        disabled={isUpdating}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                      >
                        <Play className="h-3 w-3" />
                        Start
                      </button>
                    )}
                    
                    {task.status === 'in_progress' && hasPermission('update_tasks') && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        disabled={isUpdating}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Complete
                      </button>
                    )}
                    
                    {task.status === 'completed' && hasPermission('approve_tasks') && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'approved')}
                        disabled={isUpdating}
                        className="flex items-center gap-1 px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approve
                      </button>
                    )}

                    <button className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      Comment
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onUpdate={onTaskUpdate}
        />
      )}
    </div>
  );
}

// Task Detail Modal Component
function TaskDetailModal({ task, onClose, onUpdate }: { task: Task; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">{task.description}</p>
            </div>
            
            {task.required_skills?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {task.required_skills.map((skill, index) => (
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
            
            {task.dependencies?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Dependencies</h3>
                <div className="space-y-2">
                  {task.dependencies.map((depId, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-400">
                      <ArrowRight className="h-4 w-4" />
                      Task ID: {depId}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Progress</h3>
                <div className="text-2xl font-bold text-cyan-400 mb-2">
                  {task.completion_percentage}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-cyan-500 h-3 rounded-full"
                    style={{ width: `${task.completion_percentage}%` }}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Time Tracking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated:</span>
                    <span className="text-white">{task.estimated_hours}h</span>
                  </div>
                  {task.assignment_details && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Logged:</span>
                      <span className="text-white">{task.assignment_details.hours_logged}h</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}