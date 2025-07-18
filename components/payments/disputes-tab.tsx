'use client';

import React, { useState } from 'react';
import { paymentService } from '@/lib/services/payment-service';
import { 
  MessageSquare, 
  Plus, 
  Eye, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Flag,
  User,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Paperclip,
  Shield,
  Scale,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface PaymentDispute {
  id: string;
  payment_details: {
    id: string;
    amount: number;
    status: string;
  };
  initiated_by_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  disputed_against_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  dispute_type: 'non_delivery' | 'quality_issue' | 'scope_change' | 'payment_delay' | 'unauthorized_charge' | 'duplicate_charge' | 'other';
  status: 'opened' | 'under_review' | 'evidence_requested' | 'mediation' | 'resolved_client' | 'resolved_developer' | 'resolved_partial' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  disputed_amount: number;
  created_at: string;
  response_deadline?: string;
}

interface DisputesTabProps {
  disputes: PaymentDispute[];
  onRefresh: () => void;
  userRole: string;
}

export function DisputesTab({ disputes, onRefresh, userRole }: DisputesTabProps) {
  const [selectedDispute, setSelectedDispute] = useState<PaymentDispute | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Get dispute status info
  const getDisputeStatusInfo = (status: string) => {
    const statusMap = {
      opened: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle, label: 'Opened' },
      under_review: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: Eye, label: 'Under Review' },
      evidence_requested: { color: 'text-orange-400', bg: 'bg-orange-600/20', icon: FileText, label: 'Evidence Requested' },
      mediation: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: Scale, label: 'In Mediation' },
      resolved_client: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Resolved (Client)' },
      resolved_developer: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Resolved (Developer)' },
      resolved_partial: { color: 'text-cyan-400', bg: 'bg-cyan-600/20', icon: CheckCircle, label: 'Partially Resolved' },
      closed: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: XCircle, label: 'Closed' },
      escalated: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertTriangle, label: 'Escalated' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.opened;
  };

  // Get dispute priority info
  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      low: { color: 'text-green-400', bg: 'bg-green-600/20', label: 'Low' },
      medium: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', label: 'Medium' },
      high: { color: 'text-orange-400', bg: 'bg-orange-600/20', label: 'High' },
      urgent: { color: 'text-red-400', bg: 'bg-red-600/20', label: 'Urgent' }
    };
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
  };

  // Get dispute type label
  const getDisputeTypeLabel = (type: string) => {
    const typeMap = {
      non_delivery: 'Non-delivery of Work',
      quality_issue: 'Quality Issue',
      scope_change: 'Scope Change',
      payment_delay: 'Payment Delay',
      unauthorized_charge: 'Unauthorized Charge',
      duplicate_charge: 'Duplicate Charge',
      other: 'Other'
    };
    return typeMap[type as keyof typeof typeMap] || 'Unknown';
  };

  // Filter disputes
  const filteredDisputes = disputes.filter(dispute => {
    if (filterStatus !== 'all' && dispute.status !== filterStatus) return false;
    if (filterPriority !== 'all' && dispute.priority !== filterPriority) return false;
    return true;
  });

  // Calculate dispute statistics
  const disputeStats = {
    total: disputes.length,
    open: disputes.filter(d => ['opened', 'under_review', 'evidence_requested', 'mediation'].includes(d.status)).length,
    resolved: disputes.filter(d => ['resolved_client', 'resolved_developer', 'resolved_partial'].includes(d.status)).length,
    urgent: disputes.filter(d => d.priority === 'urgent').length,
    total_amount: disputes.reduce((sum, d) => sum + d.disputed_amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Payment Disputes</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage payment disputes and resolution processes
          </p>
        </div>
        
        {userRole !== 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Dispute
          </button>
        )}
      </div>

      {/* Dispute Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Total Disputes</span>
          </div>
          <div className="text-xl font-bold text-white">
            {disputeStats.total}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Open</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {disputeStats.open}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Resolved</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            {disputeStats.resolved}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-gray-400">Urgent</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            {disputeStats.urgent}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Total Amount</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">
            ${disputeStats.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">All Statuses</option>
          <option value="opened">Opened</option>
          <option value="under_review">Under Review</option>
          <option value="evidence_requested">Evidence Requested</option>
          <option value="mediation">In Mediation</option>
          <option value="resolved_client">Resolved (Client)</option>
          <option value="resolved_developer">Resolved (Developer)</option>
          <option value="resolved_partial">Partially Resolved</option>
          <option value="closed">Closed</option>
          <option value="escalated">Escalated</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <div className="text-sm text-gray-400">
          {filteredDisputes.length} of {disputes.length} disputes
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map(dispute => {
          const statusInfo = getDisputeStatusInfo(dispute.status);
          const priorityInfo = getPriorityInfo(dispute.priority);
          const StatusIcon = statusInfo.icon;
          const isOverdue = dispute.response_deadline && new Date(dispute.response_deadline) < new Date();
          
          return (
            <div
              key={dispute.id}
              className={`bg-gray-800/30 border rounded-lg p-6 hover:border-gray-600/50 transition-colors ${
                dispute.priority === 'urgent' ? 'border-red-500/30' : 'border-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {dispute.title}
                    </h4>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityInfo.bg} ${priorityInfo.color}`}>
                      <Flag className="h-3 w-3" />
                      {priorityInfo.label}
                    </div>
                    {isOverdue && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-600/20 text-red-400">
                        <Clock className="h-3 w-3" />
                        Overdue
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-3">
                    {getDisputeTypeLabel(dispute.dispute_type)}
                  </div>
                  
                  <p className="text-gray-300 mb-4 line-clamp-2">
                    {dispute.description}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        {dispute.initiated_by_details.first_name} {dispute.initiated_by_details.last_name}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span>
                        {dispute.disputed_against_details.first_name} {dispute.disputed_against_details.last_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${dispute.disputed_amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(dispute.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {dispute.response_deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Deadline: {new Date(dispute.response_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowDisputeModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDisputes.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Disputes Found</h3>
          <p className="text-gray-500">
            {disputes.length === 0 
              ? 'No payment disputes have been created yet.'
              : 'No disputes match your current filters.'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showDisputeModal && selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedDispute(null);
          }}
          onRefresh={onRefresh}
          userRole={userRole}
        />
      )}

      {showCreateModal && (
        <CreateDisputeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Dispute Detail Modal
function DisputeDetailModal({ 
  dispute, 
  onClose, 
  onRefresh, 
  userRole 
}: { 
  dispute: PaymentDispute; 
  onClose: () => void;
  onRefresh: () => void;
  userRole: string;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');

  const statusInfo = getDisputeStatusInfo(dispute.status);
  const priorityInfo = getPriorityInfo(dispute.priority);
  const StatusIcon = statusInfo.icon;

  // Resolve dispute (admin only)
  const resolveDispute = async () => {
    if (userRole !== 'admin') return;
    
    try {
      setLoading(true);
      const result = await paymentService.updateDispute(dispute.id, {
        status: resolutionType,
        resolution: resolutionSummary,
        admin_notes: `Resolved with ${resolutionType}. Amount: $${resolutionAmount}`
      });

      if (result.success) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{dispute.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityInfo.bg} ${priorityInfo.color}`}>
                  <Flag className="h-3 w-3" />
                  {priorityInfo.label}
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
          {/* Dispute Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Dispute Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{getDisputeTypeLabel(dispute.dispute_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Disputed Amount:</span>
                  <span className="text-white font-bold">
                    ${dispute.disputed_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>
                {dispute.response_deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Deadline:</span>
                    <span className="text-white">
                      {new Date(dispute.response_deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Parties Involved</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-gray-400 text-sm">Initiated By:</div>
                  <div className="text-white">
                    {dispute.initiated_by_details.first_name} {dispute.initiated_by_details.last_name}
                  </div>
                  <div className="text-cyan-400 text-sm">
                    @{dispute.initiated_by_details.username}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Disputed Against:</div>
                  <div className="text-white">
                    {dispute.disputed_against_details.first_name} {dispute.disputed_against_details.last_name}
                  </div>
                  <div className="text-cyan-400 text-sm">
                    @{dispute.disputed_against_details.username}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-300">{dispute.description}</p>
            </div>
          </div>

          {/* Admin Resolution Section */}
          {userRole === 'admin' && !['resolved_client', 'resolved_developer', 'resolved_partial', 'closed'].includes(dispute.status) && (
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resolve Dispute</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Resolution Type</label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select resolution type</option>
                    <option value="resolved_client">Resolve in favor of Client</option>
                    <option value="resolved_developer">Resolve in favor of Developer</option>
                    <option value="resolved_partial">Partial resolution</option>
                  </select>
                </div>

                {resolutionType === 'resolved_partial' && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Resolution Amount</label>
                    <input
                      type="number"
                      value={resolutionAmount}
                      onChange={(e) => setResolutionAmount(e.target.value)}
                      placeholder="Enter resolution amount"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Resolution Summary</label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Explain the resolution decision..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <button
                  onClick={resolveDispute}
                  disabled={loading || !resolutionType || !resolutionSummary}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Resolve Dispute
                </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Dispute Modal
function CreateDisputeModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    payment_id: '',
    dispute_type: 'other',
    title: '',
    description: '',
    disputed_amount: '',
    evidence: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.createDispute({
        payment_id: formData.payment_id,
        reason: formData.dispute_type,
        description: formData.description,
        evidence: formData.evidence
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to create dispute');
      }
    } catch (err) {
      setError('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create Payment Dispute</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">Payment ID</label>
            <input
              type="text"
              value={formData.payment_id}
              onChange={(e) => setFormData({ ...formData, payment_id: e.target.value })}
              placeholder="Enter payment ID"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Dispute Type</label>
            <select
              value={formData.dispute_type}
              onChange={(e) => setFormData({ ...formData, dispute_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="non_delivery">Non-delivery of Work</option>
              <option value="quality_issue">Quality Issue</option>
              <option value="scope_change">Scope Change</option>
              <option value="payment_delay">Payment Delay</option>
              <option value="unauthorized_charge">Unauthorized Charge</option>
              <option value="duplicate_charge">Duplicate Charge</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for the dispute"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the dispute..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Disputed Amount</label>
            <input
              type="number"
              value={formData.disputed_amount}
              onChange={(e) => setFormData({ ...formData, disputed_amount: e.target.value })}
              placeholder="Amount in dispute"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getDisputeStatusInfo(status: string) {
  const statusMap = {
    opened: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle, label: 'Opened' },
    under_review: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: Eye, label: 'Under Review' },
    evidence_requested: { color: 'text-orange-400', bg: 'bg-orange-600/20', icon: FileText, label: 'Evidence Requested' },
    mediation: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: Scale, label: 'In Mediation' },
    resolved_client: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Resolved (Client)' },
    resolved_developer: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Resolved (Developer)' },
    resolved_partial: { color: 'text-cyan-400', bg: 'bg-cyan-600/20', icon: CheckCircle, label: 'Partially Resolved' },
    closed: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: XCircle, label: 'Closed' },
    escalated: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertTriangle, label: 'Escalated' }
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.opened;
}

function getPriorityInfo(priority: string) {
  const priorityMap = {
    low: { color: 'text-green-400', bg: 'bg-green-600/20', label: 'Low' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', label: 'Medium' },
    high: { color: 'text-orange-400', bg: 'bg-orange-600/20', label: 'High' },
    urgent: { color: 'text-red-400', bg: 'bg-red-600/20', label: 'Urgent' }
  };
  return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
}

function getDisputeTypeLabel(type: string) {
  const typeMap = {
    non_delivery: 'Non-delivery of Work',
    quality_issue: 'Quality Issue',
    scope_change: 'Scope Change',
    payment_delay: 'Payment Delay',
    unauthorized_charge: 'Unauthorized Charge',
    duplicate_charge: 'Duplicate Charge',
    other: 'Other'
  };
  return typeMap[type as keyof typeof typeMap] || 'Unknown';
}

export default DisputesTab;