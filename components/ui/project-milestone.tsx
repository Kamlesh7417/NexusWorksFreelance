'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Calendar, DollarSign, CheckCircle, XCircle, Loader2, Edit, Save } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: milestone.title,
    description: milestone.description || '',
    due_date: milestone.due_date,
    amount: milestone.amount?.toString() || '',
    completion_percentage: milestone.completion_percentage?.toString() || '0'
  });
  
  const supabase = createClientComponentClient();

  const handleUpdateMilestone = async () => {
    if (!projectId || !milestone.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date,
          amount: parseFloat(formData.amount) || 0,
          completion_percentage: parseInt(formData.completion_percentage) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestone.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!projectId || !milestone.id) return;
    
    setLoading(true);
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // If completing, set completion to 100%
      if (newStatus === 'completed') {
        updates.completion_percentage = 100;
      }
      
      const { error } = await supabase
        .from('project_milestones')
        .update(updates)
        .eq('id', milestone.id);
      
      if (error) throw error;
      
      onUpdate();
    } catch (error) {
      console.error('Error updating milestone status:', error);
      alert('Failed to update milestone status');
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
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  if (isEditing) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-1">
                Completion (%)
              </label>
              <input
                type="number"
                value={formData.completion_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, completion_percentage: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-medium py-2 px-3 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateMilestone}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-cyan-400">{milestone.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(milestone.status)}`}>
          {milestone.status}
        </span>
      </div>
      
      {milestone.description && (
        <p className="text-sm text-gray-300 mb-3">{milestone.description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-300">{formatDate(milestone.due_date)}</span>
        </div>
        
        {milestone.amount > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-green-400">${milestone.amount.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Completion</span>
          <span>{milestone.completion_percentage}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
            style={{ width: `${milestone.completion_percentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex gap-2">
        {isClient && milestone.status !== 'completed' && (
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            Complete
          </button>
        )}
        
        {isDeveloper && milestone.status === 'pending' && (
          <button
            onClick={() => handleStatusChange('in_progress')}
            disabled={loading}
            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            Start
          </button>
        )}
        
        {isClient && (
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Edit size={14} />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}