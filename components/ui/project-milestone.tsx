'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';

interface ProjectMilestoneProps {
  milestone: any;
  projectId: string;
  isClient: boolean;
  isDeveloper: boolean;
  onUpdate: () => void;
}

export function ProjectMilestone({ 
  milestone, 
  projectId, 
  isClient, 
  isDeveloper,
  onUpdate
}: ProjectMilestoneProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({ 
          status: newStatus,
          completion_percentage: newStatus === 'completed' ? 100 : milestone.completion_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestone.id);
      
      if (error) throw error;
      
      onUpdate();
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone status');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionChange = async (percentage: number) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({ 
          completion_percentage: percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestone.id);
      
      if (error) throw error;
      
      onUpdate();
    } catch (error) {
      console.error('Error updating milestone completion:', error);
      alert('Failed to update milestone completion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'overdue': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">{milestone.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(milestone.status)}`}>
          {milestone.status.replace('_', ' ')}
        </span>
      </div>
      
      {milestone.description && (
        <p className="text-sm text-gray-400 mb-3">{milestone.description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        {milestone.due_date && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-yellow-400" />
            <span>Due: {formatDate(milestone.due_date)}</span>
          </div>
        )}
        
        {milestone.amount && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-green-400" />
            <span>${milestone.amount.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span>{milestone.completion_percentage}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
            style={{ width: `${milestone.completion_percentage}%` }}
          ></div>
        </div>
      </div>
      
      {isDeveloper && milestone.status !== 'completed' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCompletionChange(25)}
            disabled={loading || milestone.completion_percentage >= 25}
            className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            25%
          </button>
          <button
            onClick={() => handleCompletionChange(50)}
            disabled={loading || milestone.completion_percentage >= 50}
            className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            50%
          </button>
          <button
            onClick={() => handleCompletionChange(75)}
            disabled={loading || milestone.completion_percentage >= 75}
            className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            75%
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            Complete
          </button>
        </div>
      )}
      
      {isClient && milestone.status === 'completed' && (
        <div className="flex justify-end">
          <button
            className="text-xs px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
          >
            Release Payment
          </button>
        </div>
      )}
    </div>
  );
}