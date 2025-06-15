'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Calendar, DollarSign, CheckCircle, Loader2 } from 'lucide-react';

interface ProjectMilestoneProps {
  milestone: any;
  projectId: string;
  isClient: boolean;
  isDeveloper: boolean;
  onUpdate?: () => void;
}

export function ProjectMilestone({ 
  milestone, 
  projectId, 
  isClient, 
  isDeveloper,
  onUpdate 
}: ProjectMilestoneProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!isClient && !isDeveloper) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({
          status: newStatus,
          completion_percentage: newStatus === 'completed' ? 100 : 
                                newStatus === 'in_progress' ? 50 : 
                                milestone.completion_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestone.id);
      
      if (error) throw error;
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Milestone update error:', err);
      setError(err.message || 'Failed to update milestone');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'overdue': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">{milestone.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(milestone.status)}`}>
          {milestone.status}
        </span>
      </div>
      
      <p className="text-sm text-gray-400 mb-3">{milestone.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-300">
            Due: {new Date(milestone.due_date).toLocaleDateString()}
          </span>
        </div>
        
        {milestone.amount > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-green-400 font-medium">${milestone.amount.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      {milestone.completion_percentage > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-400">{milestone.completion_percentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
              style={{ width: `${milestone.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-400 mb-3">{error}</div>
      )}
      
      {/* Status Update Buttons */}
      {isDeveloper && milestone.status === 'pending' && (
        <button
          onClick={() => handleStatusUpdate('in_progress')}
          disabled={updating}
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
        >
          {updating ? <Loader2 size={14} className="animate-spin" /> : null}
          Start Milestone
        </button>
      )}
      
      {isDeveloper && milestone.status === 'in_progress' && (
        <button
          onClick={() => handleStatusUpdate('completed')}
          disabled={updating}
          className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
        >
          {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Mark as Completed
        </button>
      )}
      
      {isClient && milestone.status === 'completed' && (
        <button
          onClick={() => alert('Payment functionality coming soon!')}
          className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
        >
          <DollarSign size={14} />
          Release Payment
        </button>
      )}
    </div>
  );
}