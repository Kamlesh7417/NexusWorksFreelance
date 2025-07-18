'use client';

import { useState, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  DollarSign, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  FileText, 
  MessageSquare,
  Loader2,
  Eye,
  EyeOff,
  History,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { projectService, ProjectProposal } from '@/lib/services/project-service';

interface ProposalModification {
  field: string;
  old_value: any;
  new_value: any;
  justification: string;
  timestamp: string;
}

interface SeniorDeveloperProposalInterfaceProps {
  projectId: string;
  proposal: ProjectProposal;
  onProposalUpdate: (updatedProposal: ProjectProposal) => void;
  onSubmit: () => void;
  isReadOnly?: boolean;
}

export default function SeniorDeveloperProposalInterface({
  projectId,
  proposal,
  onProposalUpdate,
  onSubmit,
  isReadOnly = false
}: SeniorDeveloperProposalInterfaceProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [modifications, setModifications] = useState<ProposalModification[]>(proposal.modifications || []);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local state for editable fields
  const [localProposal, setLocalProposal] = useState<ProjectProposal>(proposal);

  useEffect(() => {
    setLocalProposal(proposal);
    setModifications(proposal.modifications || []);
  }, [proposal]);

  const handleFieldEdit = (field: string, newValue: any) => {
    if (isReadOnly || isLocked) return;

    const oldValue = getFieldValue(field);
    
    if (oldValue === newValue) {
      setEditingField(null);
      return;
    }

    if (!justification.trim()) {
      setError('Please provide justification for this change');
      return;
    }

    const modification: ProposalModification = {
      field,
      old_value: oldValue,
      new_value: newValue,
      justification: justification.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedModifications = [...modifications, modification];
    const updatedProposal = {
      ...localProposal,
      [field]: newValue,
      modifications: updatedModifications
    };

    setModifications(updatedModifications);
    setLocalProposal(updatedProposal);
    onProposalUpdate(updatedProposal);
    
    setEditingField(null);
    setJustification('');
    setError(null);
    setSuccess(`${field.replace('_', ' ')} updated successfully`);
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const getFieldValue = (field: string): any => {
    switch (field) {
      case 'budget_estimate':
        return localProposal.budget_estimate;
      case 'timeline_estimate':
        return localProposal.timeline_estimate;
      case 'senior_developer_notes':
        return localProposal.senior_developer_notes;
      default:
        return null;
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setJustification('');
    setError(null);
  };

  const submitProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await projectService.submitProposal(localProposal);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setIsLocked(true);
      setSuccess('Proposal submitted successfully!');
      onSubmit();
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const getModificationIcon = (field: string) => {
    switch (field) {
      case 'budget_estimate':
        return <DollarSign size={14} className="text-green-400" />;
      case 'timeline_estimate':
        return <Calendar size={14} className="text-blue-400" />;
      case 'senior_developer_notes':
        return <MessageSquare size={14} className="text-purple-400" />;
      default:
        return <Edit3 size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Senior Developer Proposal Review</h2>
          <p className="text-gray-400">Review and modify the AI-generated project proposal</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <History size={16} />
            {showHistory ? 'Hide' : 'Show'} History
          </button>
          
          <div className="flex items-center gap-2">
            {isLocked ? <Lock size={16} className="text-red-400" /> : <Unlock size={16} className="text-green-400" />}
            <span className="text-sm text-gray-400">
              {isLocked ? 'Locked' : 'Editable'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
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

      {/* Modification History */}
      {showHistory && modifications.length > 0 && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <History size={18} />
            Modification History
          </h3>
          
          <div className="space-y-3">
            {modifications.map((mod, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getModificationIcon(mod.field)}
                    <span className="font-medium text-white capitalize">
                      {mod.field.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(mod.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Previous Value</div>
                    <div className="text-sm text-red-400 bg-red-500/10 rounded px-2 py-1">
                      {typeof mod.old_value === 'object' ? JSON.stringify(mod.old_value) : mod.old_value}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400 mb-1">New Value</div>
                    <div className="text-sm text-green-400 bg-green-500/10 rounded px-2 py-1">
                      {typeof mod.new_value === 'object' ? JSON.stringify(mod.new_value) : mod.new_value}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400 mb-1">Justification</div>
                  <p className="text-sm text-gray-300">{mod.justification}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposal Fields */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-6">
        
        {/* Budget Estimate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <DollarSign size={18} />
              Budget Estimate
            </label>
            
            {!isReadOnly && !isLocked && editingField !== 'budget_estimate' && (
              <button
                onClick={() => setEditingField('budget_estimate')}
                className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-3 py-1 rounded-lg transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>
          
          {editingField === 'budget_estimate' ? (
            <div className="space-y-3">
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  defaultValue={localProposal.budget_estimate}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Enter budget estimate"
                  id="budget-input"
                />
              </div>
              
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Provide justification for this change..."
                rows={3}
                required
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.getElementById('budget-input') as HTMLInputElement;
                    handleFieldEdit('budget_estimate', parseFloat(input.value));
                  }}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-white">
              ${localProposal.budget_estimate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Timeline Estimate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <Calendar size={18} />
              Timeline Estimate
            </label>
            
            {!isReadOnly && !isLocked && editingField !== 'timeline_estimate' && (
              <button
                onClick={() => setEditingField('timeline_estimate')}
                className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-3 py-1 rounded-lg transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>
          
          {editingField === 'timeline_estimate' ? (
            <div className="space-y-3">
              <input
                type="text"
                defaultValue={localProposal.timeline_estimate}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="e.g., 8-12 weeks, 3 months"
                id="timeline-input"
              />
              
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Provide justification for this change..."
                rows={3}
                required
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.getElementById('timeline-input') as HTMLInputElement;
                    handleFieldEdit('timeline_estimate', input.value);
                  }}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xl font-semibold text-white">
              {localProposal.timeline_estimate}
            </div>
          )}
        </div>

        {/* Task Breakdown */}
        <div className="space-y-3">
          <label className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
            <FileText size={18} />
            Task Breakdown ({localProposal.task_breakdown.length} tasks)
          </label>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {localProposal.task_breakdown.map((task, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <div className="text-sm text-gray-400">
                    {task.estimated_hours}h • Priority {task.priority}
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">{task.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {task.required_skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Senior Developer Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <MessageSquare size={18} />
              Senior Developer Notes
            </label>
            
            {!isReadOnly && !isLocked && editingField !== 'senior_developer_notes' && (
              <button
                onClick={() => setEditingField('senior_developer_notes')}
                className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-3 py-1 rounded-lg transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>
          
          {editingField === 'senior_developer_notes' ? (
            <div className="space-y-3">
              <textarea
                defaultValue={localProposal.senior_developer_notes || ''}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Add your professional notes and recommendations..."
                rows={6}
                id="notes-input"
              />
              
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Provide justification for this change..."
                rows={3}
                required
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.getElementById('notes-input') as HTMLTextAreaElement;
                    handleFieldEdit('senior_developer_notes', input.value);
                  }}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-4">
              {localProposal.senior_developer_notes ? (
                <p className="text-gray-300 whitespace-pre-wrap">
                  {localProposal.senior_developer_notes}
                </p>
              ) : (
                <p className="text-gray-400 italic">No notes added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        {!isReadOnly && !isLocked && (
          <div className="pt-6 border-t border-white/20">
            <div className="flex items-center gap-4">
              <button
                onClick={submitProposal}
                disabled={loading || modifications.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Proposal
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info size={14} />
                {modifications.length === 0 
                  ? 'Make at least one modification to submit'
                  : `${modifications.length} modification${modifications.length > 1 ? 's' : ''} ready to submit`
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}