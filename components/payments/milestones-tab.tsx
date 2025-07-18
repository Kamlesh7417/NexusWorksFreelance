'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Eye,
  CreditCard,
  RefreshCw,
  Users,
  Target,
  ArrowRight,
  FileText,
  Shield
} from 'lucide-react';

interface Milestone {
  id: string;
  project: string;
  project_details: {
    id: string;
    title: string;
    status: string;
  };
  percentage: number;
  amount: number;
  status: 'pending' | 'ready' | 'processing' | 'completed' | 'disputed' | 'overdue';
  due_date: string;
  paid_date?: string;
  description: string;
  deliverables: string[];
  completion_criteria: string[];
  client_approved: boolean;
  senior_developer_approved: boolean;
}

interface MilestonesTabProps {
  milestones: Milestone[];
  onProcessPayment: (milestoneId: string) => void;
  processingPayment: string | null;
  userRole: string;
}

export function MilestonesTab({ 
  milestones, 
  onProcessPayment, 
  processingPayment, 
  userRole 
}: MilestonesTabProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get milestone status info
  const getMilestoneStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock, label: 'Pending' },
      ready: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle, label: 'Ready for Payment' },
      processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw, label: 'Processing' },
      completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Completed' },
      disputed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Disputed' },
      overdue: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Overdue' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Filter milestones
  const filteredMilestones = milestones.filter(milestone => {
    if (filterStatus === 'all') return true;
    return milestone.status === filterStatus;
  });

  // Calculate milestone progress
  const calculateProgress = (milestone: Milestone) => {
    // This would be calculated based on actual task completion
    // For now, using status to determine progress
    switch (milestone.status) {
      case 'completed': return 100;
      case 'ready': return 90;
      case 'processing': return 95;
      case 'pending': return milestone.percentage - 25; // Previous milestone completion
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Project Milestones</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready">Ready for Payment</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          {filteredMilestones.length} of {milestones.length} milestones
        </div>
      </div>

      {/* Milestone Cards */}
      <div className="space-y-4">
        {filteredMilestones.map(milestone => {
          const statusInfo = getMilestoneStatusInfo(milestone.status);
          const StatusIcon = statusInfo.icon;
          const isProcessing = processingPayment === milestone.id;
          const progress = calculateProgress(milestone);
          
          return (
            <div
              key={milestone.id}
              className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {milestone.percentage}% Milestone
                    </h4>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-2">
                    {milestone.project_details.title}
                  </div>
                  
                  <div className="text-2xl font-bold text-white mb-3">
                    ${milestone.amount.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                    </span>
                    {milestone.paid_date && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Paid: {new Date(milestone.paid_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Completion Progress</span>
                      <span className="text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          milestone.status === 'completed' ? 'bg-green-500' :
                          milestone.status === 'ready' ? 'bg-yellow-500' :
                          milestone.status === 'processing' ? 'bg-blue-500' :
                          'bg-gray-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        milestone.client_approved ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <span className={milestone.client_approved ? 'text-green-400' : 'text-gray-400'}>
                        Client Approved
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        milestone.senior_developer_approved ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <span className={milestone.senior_developer_approved ? 'text-green-400' : 'text-gray-400'}>
                        Senior Dev Approved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMilestone(milestone);
                      setShowMilestoneModal(true);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {milestone.status === 'ready' && userRole === 'client' && (
                    <button
                      onClick={() => onProcessPayment(milestone.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <CreditCard className="h-3 w-3" />
                      )}
                      Process Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Deliverables */}
              {milestone.deliverables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Deliverables</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {milestone.deliverables.slice(0, 4).map((deliverable, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <FileText className="h-3 w-3 text-gray-500" />
                        {deliverable}
                      </div>
                    ))}
                    {milestone.deliverables.length > 4 && (
                      <div className="text-sm text-gray-400">
                        +{milestone.deliverables.length - 4} more deliverables
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMilestones.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Milestones Found</h3>
          <p className="text-gray-500">
            {filterStatus === 'all' 
              ? 'No milestones have been created for this project yet.'
              : `No milestones with status "${filterStatus}" found.`
            }
          </p>
        </div>
      )}

      {/* Milestone Detail Modal */}
      {showMilestoneModal && selectedMilestone && (
        <MilestoneDetailModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowMilestoneModal(false);
            setSelectedMilestone(null);
          }}
          onProcessPayment={onProcessPayment}
          processingPayment={processingPayment}
          userRole={userRole}
        />
      )}
    </div>
  );
}

// Milestone Detail Modal
function MilestoneDetailModal({ 
  milestone, 
  onClose, 
  onProcessPayment,
  processingPayment,
  userRole
}: { 
  milestone: Milestone; 
  onClose: () => void;
  onProcessPayment: (milestoneId: string) => void;
  processingPayment: string | null;
  userRole: string;
}) {
  const statusInfo = getMilestoneStatusInfo(milestone.status);
  const StatusIcon = statusInfo.icon;
  const isProcessing = processingPayment === milestone.id;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {milestone.percentage}% Milestone Details
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </div>
                <span className="text-gray-400 text-sm">
                  {milestone.project_details.title}
                </span>
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
          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold text-xl">
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Due Date:</span>
                  <span className="text-white">
                    {new Date(milestone.due_date).toLocaleDateString()}
                  </span>
                </div>
                {milestone.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid Date:</span>
                    <span className="text-green-400">
                      {new Date(milestone.paid_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Approval Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Client Approval:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.client_approved ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <span className={milestone.client_approved ? 'text-green-400' : 'text-gray-400'}>
                      {milestone.client_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Senior Developer:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.senior_developer_approved ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <span className={milestone.senior_developer_approved ? 'text-green-400' : 'text-gray-400'}>
                      {milestone.senior_developer_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {milestone.description && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 bg-gray-800/50 rounded-lg p-4">
                {milestone.description}
              </p>
            </div>
          )}

          {/* Deliverables */}
          {milestone.deliverables.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Deliverables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {milestone.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-300">{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Criteria */}
          {milestone.completion_criteria.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Completion Criteria</h3>
              <div className="space-y-2">
                {milestone.completion_criteria.map((criteria, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg">
                    <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-300">{criteria}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
            
            {milestone.status === 'ready' && userRole === 'client' && (
              <button
                onClick={() => {
                  onProcessPayment(milestone.id);
                  onClose();
                }}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Process Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function (moved outside component to avoid re-creation)
function getMilestoneStatusInfo(status: string) {
  const statusMap = {
    pending: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock, label: 'Pending' },
    ready: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle, label: 'Ready for Payment' },
    processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw, label: 'Processing' },
    completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Completed' },
    disputed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Disputed' },
    overdue: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Overdue' }
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.pending;
}

export default MilestonesTab;