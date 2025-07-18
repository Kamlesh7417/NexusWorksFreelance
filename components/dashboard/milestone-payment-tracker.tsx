'use client';

import React, { useState, useCallback } from 'react';
import { useProject } from './project-context';
import { paymentService } from '@/lib/services/payment-service';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  CreditCard,
  Receipt,
  Target,
  Wallet,
  ArrowRight,
  Download,
  Eye,
  RefreshCw,
  Users,
  PieChart
} from 'lucide-react';

interface MilestonePaymentTrackerProps {
  projectDetails: any;
  taskProgress: any;
  className?: string;
}

interface Milestone {
  id: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'due' | 'processing' | 'paid' | 'overdue';
  due_date: string;
  paid_date?: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  developer: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
}

interface PaymentSummary {
  total_budget: number;
  paid_amount: number;
  pending_amount: number;
  next_milestone_amount: number;
  completion_percentage: number;
  payment_health: 'healthy' | 'warning' | 'critical';
}

export function MilestonePaymentTracker({ 
  projectDetails, 
  taskProgress, 
  className = '' 
}: MilestonePaymentTrackerProps) {
  const { hasPermission } = useProject();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real implementation, this would come from props or API
  const milestones: Milestone[] = projectDetails?.milestones || [
    {
      id: '1',
      percentage: 25,
      amount: 3750,
      status: 'paid',
      due_date: '2024-01-15',
      paid_date: '2024-01-14',
      payments: [
        { id: '1', developer: 'john_doe', amount: 2250, status: 'completed', processed_at: '2024-01-14' },
        { id: '2', developer: 'jane_smith', amount: 1500, status: 'completed', processed_at: '2024-01-14' }
      ]
    },
    {
      id: '2',
      percentage: 50,
      amount: 3750,
      status: 'due',
      due_date: '2024-02-15',
      payments: [
        { id: '3', developer: 'john_doe', amount: 2250, status: 'pending' },
        { id: '4', developer: 'jane_smith', amount: 1500, status: 'pending' }
      ]
    },
    {
      id: '3',
      percentage: 75,
      amount: 3750,
      status: 'pending',
      due_date: '2024-03-15',
      payments: []
    },
    {
      id: '4',
      percentage: 100,
      amount: 3750,
      status: 'pending',
      due_date: '2024-04-15',
      payments: []
    }
  ];

  // Calculate payment summary
  const paymentSummary: PaymentSummary = {
    total_budget: projectDetails?.resource_allocation?.total_budget || 15000,
    paid_amount: milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0),
    pending_amount: milestones.filter(m => m.status !== 'paid').reduce((sum, m) => sum + m.amount, 0),
    next_milestone_amount: milestones.find(m => m.status === 'due')?.amount || 0,
    completion_percentage: taskProgress?.overall_progress?.completion_percentage || 0,
    payment_health: 'healthy' // This would be calculated based on payment delays, etc.
  };

  // Get milestone status info
  const getMilestoneStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock },
      due: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle },
      processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw },
      paid: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle },
      overdue: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Process milestone payment
  const processMilestonePayment = useCallback(async (milestoneId: string) => {
    if (!hasPermission('manage_budget')) return;

    try {
      setProcessingPayment(milestoneId);
      await paymentService.processMilestonePayment(projectDetails.id, milestoneId);
      // Refresh data would be called here
    } catch (error) {
      console.error('Failed to process payment:', error);
    } finally {
      setProcessingPayment(null);
    }
  }, [hasPermission, projectDetails.id]);

  // Calculate milestone progress based on task completion
  const calculateMilestoneProgress = (milestonePercentage: number) => {
    const currentProgress = paymentSummary.completion_percentage;
    const previousMilestone = milestonePercentage - 25;
    const progressInRange = Math.max(0, currentProgress - previousMilestone);
    const rangeSize = 25;
    return Math.min(100, (progressInRange / rangeSize) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Budget</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${paymentSummary.total_budget.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Paid Amount</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${paymentSummary.paid_amount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {Math.round((paymentSummary.paid_amount / paymentSummary.total_budget) * 100)}% of budget
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${paymentSummary.pending_amount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {Math.round((paymentSummary.pending_amount / paymentSummary.total_budget) * 100)}% remaining
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <span className="text-sm text-gray-400">Next Milestone</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            ${paymentSummary.next_milestone_amount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Due on next completion
          </div>
        </div>
      </div>

      {/* Payment Health Indicator */}
      <div className={`rounded-lg p-4 ${
        paymentSummary.payment_health === 'healthy' ? 'bg-green-900/20 border border-green-500/30' :
        paymentSummary.payment_health === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/30' :
        'bg-red-900/20 border border-red-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            paymentSummary.payment_health === 'healthy' ? 'bg-green-400' :
            paymentSummary.payment_health === 'warning' ? 'bg-yellow-400' :
            'bg-red-400'
          }`} />
          <div>
            <div className={`font-semibold ${
              paymentSummary.payment_health === 'healthy' ? 'text-green-400' :
              paymentSummary.payment_health === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              Payment Health: {paymentSummary.payment_health.charAt(0).toUpperCase() + paymentSummary.payment_health.slice(1)}
            </div>
            <div className="text-sm text-gray-400">
              {paymentSummary.payment_health === 'healthy' && 'All payments are on track'}
              {paymentSummary.payment_health === 'warning' && 'Some payments may be delayed'}
              {paymentSummary.payment_health === 'critical' && 'Immediate attention required for payments'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700/50">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'milestones', label: 'Milestones', icon: Target },
          { id: 'payments', label: 'Payment History', icon: Receipt }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress vs Payment Chart */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Progress vs Payment Timeline</h3>
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const statusInfo = getMilestoneStatusInfo(milestone.status);
                const StatusIcon = statusInfo.icon;
                const progress = calculateMilestoneProgress(milestone.percentage);
                
                return (
                  <div key={milestone.id} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {milestone.percentage}% Milestone
                        </div>
                        <span className="text-white font-medium">
                          ${milestone.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            milestone.status === 'paid' ? 'bg-green-500' :
                            milestone.status === 'due' ? 'bg-yellow-500' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${milestone.status === 'paid' ? 100 : progress}%` }}
                        />
                      </div>
                      <div className="absolute right-0 top-0 text-xs text-gray-400 mt-4">
                        {milestone.status === 'paid' ? 'Completed' : `${Math.round(progress)}% ready`}
                      </div>
                    </div>
                    
                    {index < milestones.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Distribution</h3>
              <div className="space-y-3">
                {milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center justify-between">
                    <span className="text-gray-400">{milestone.percentage}% Milestone</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        ${milestone.amount.toLocaleString()}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        milestone.status === 'paid' ? 'bg-green-400' :
                        milestone.status === 'due' ? 'bg-yellow-400' :
                        'bg-gray-600'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Payment Breakdown</h3>
              <div className="space-y-3">
                {/* This would show payment distribution among team members */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs">
                      J
                    </div>
                    <span className="text-gray-400">John Doe</span>
                  </div>
                  <span className="text-white font-medium">$6,750</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                      J
                    </div>
                    <span className="text-gray-400">Jane Smith</span>
                  </div>
                  <span className="text-white font-medium">$4,500</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                      M
                    </div>
                    <span className="text-gray-400">Mike Johnson</span>
                  </div>
                  <span className="text-white font-medium">$3,750</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {milestones.map(milestone => {
            const statusInfo = getMilestoneStatusInfo(milestone.status);
            const StatusIcon = statusInfo.icon;
            const isProcessing = processingPayment === milestone.id;
            
            return (
              <div
                key={milestone.id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {milestone.percentage}% Milestone
                      </h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      ${milestone.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
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
                  </div>

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
                    
                    {milestone.status === 'due' && hasPermission('manage_budget') && (
                      <button
                        onClick={() => processMilestonePayment(milestone.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
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

                {/* Payment Breakdown */}
                {milestone.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Payment Breakdown</h4>
                    <div className="space-y-2">
                      {milestone.payments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs">
                              {payment.developer.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-300">{payment.developer}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              ${payment.amount.toLocaleString()}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              payment.status === 'completed' ? 'bg-green-400' :
                              payment.status === 'processing' ? 'bg-yellow-400' :
                              payment.status === 'failed' ? 'bg-red-400' :
                              'bg-gray-400'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Payment History</h3>
            <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <div className="bg-gray-800/30 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Milestone</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Developer</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.flatMap(milestone => 
                    milestone.payments.map(payment => (
                      <tr key={payment.id} className="border-t border-gray-700/50">
                        <td className="p-4 text-gray-300">
                          {payment.processed_at ? new Date(payment.processed_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-white">{milestone.percentage}% Milestone</td>
                        <td className="p-4 text-gray-300">{payment.developer}</td>
                        <td className="p-4 text-white font-medium">${payment.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                            payment.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400' :
                            payment.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
        />
      )}
    </div>
  );
}

// Milestone Detail Modal
function MilestoneDetailModal({ 
  milestone, 
  onClose 
}: { 
  milestone: Milestone; 
  onClose: () => void; 
}) {
  const statusInfo = getMilestoneStatusInfo(milestone.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {milestone.percentage}% Milestone
              </h2>
              <div className={`flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Payment Amount</h3>
              <div className="text-3xl font-bold text-white">
                ${milestone.amount.toLocaleString()}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Due Date:</span>
                  <span className="text-white">{new Date(milestone.due_date).toLocaleDateString()}</span>
                </div>
                {milestone.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid Date:</span>
                    <span className="text-green-400">{new Date(milestone.paid_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {milestone.payments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Payment Breakdown</h3>
              <div className="space-y-3">
                {milestone.payments.map(payment => (
                  <div key={payment.id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {payment.developer.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{payment.developer}</span>
                      </div>
                      <span className="text-white font-bold">${payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        payment.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                        payment.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400' :
                        payment.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.processed_at && (
                        <span className="text-gray-400">
                          {new Date(payment.processed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function
function getMilestoneStatusInfo(status: string) {
  const statusMap = {
    pending: { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock },
    due: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: AlertCircle },
    processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw },
    paid: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle },
    overdue: { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle }
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.pending;
}