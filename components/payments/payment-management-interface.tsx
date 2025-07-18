'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { paymentService } from '@/lib/services/payment-service';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Receipt,
  Target,
  Wallet,
  ArrowRight,
  Download,
  Eye,
  RefreshCw,
  Users,
  PieChart,
  Settings,
  Plus,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  MessageSquare,
  Bell,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

interface PaymentManagementInterfaceProps {
  projectId?: string;
  userRole: 'client' | 'developer' | 'admin';
  className?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'stripe';
  display_name: string;
  last_four?: string;
  brand?: string;
  is_default: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'failed';
  created_at: string;
  total_payments_received: number;
}

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

interface Payment {
  id: string;
  milestone_details: {
    id: string;
    percentage: number;
    project_title: string;
  };
  developer_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  amount: number;
  net_amount: number;
  payment_type: 'milestone' | 'bonus' | 'refund' | 'penalty';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed' | 'refunded';
  processed_at?: string;
  created_at: string;
  platform_fee: number;
  gateway_fee: number;
}

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

export function PaymentManagementInterface({ 
  projectId, 
  userRole, 
  className = '' 
}: PaymentManagementInterfaceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  
  // Modal states
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Processing states
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [verifyingMethod, setVerifyingMethod] = useState<string | null>(null);
  
  // Filters
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [projectId, userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [methodsRes, paymentsRes, disputesRes] = await Promise.all([
        paymentService.getPaymentMethods(),
        paymentService.getPayments({ project: projectId }),
        paymentService.getDisputes()
      ]);

      if (methodsRes.success) setPaymentMethods(methodsRes.data);
      if (paymentsRes.success) setPayments(paymentsRes.data.results || []);
      if (disputesRes.success) setDisputes(disputesRes.data);

      // Load milestones if project specified
      if (projectId) {
        const milestonesRes = await paymentService.getProjectMilestones(projectId);
        if (milestonesRes.success) setMilestones(milestonesRes.data);
      }

    } catch (err) {
      setError('Failed to load payment data');
      console.error('Error loading payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process milestone payment
  const processMilestonePayment = useCallback(async (milestoneId: string) => {
    try {
      setProcessingPayment(milestoneId);
      
      const result = await paymentService.processMilestonePayment({
        milestone_id: milestoneId,
        amount: 0, // Will be calculated by backend
        distributions: [], // Will be calculated by backend
        payment_method_id: paymentMethods.find(m => m.is_default)?.id || ''
      });

      if (result.success) {
        await loadData(); // Refresh data
        // Show success notification
      } else {
        setError(result.error || 'Failed to process payment');
      }
    } catch (err) {
      setError('Failed to process milestone payment');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(null);
    }
  }, [paymentMethods]);

  // Verify payment method
  const verifyPaymentMethod = useCallback(async (methodId: string) => {
    try {
      setVerifyingMethod(methodId);
      
      const result = await paymentService.verifyPaymentMethod(methodId, {});
      
      if (result.success) {
        await loadData(); // Refresh data
      } else {
        setError(result.error || 'Failed to verify payment method');
      }
    } catch (err) {
      setError('Failed to verify payment method');
      console.error('Error verifying payment method:', err);
    } finally {
      setVerifyingMethod(null);
    }
  }, []);

  // Calculate payment statistics
  const paymentStats = {
    total_paid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    total_pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    total_disputed: disputes.filter(d => d.status !== 'closed').length,
    success_rate: payments.length > 0 ? (payments.filter(p => p.status === 'completed').length / payments.length) * 100 : 0,
    average_processing_time: 2.5 // days - would be calculated from actual data
  };

  // Filter payments based on current filters
  const filteredPayments = payments.filter(payment => {
    if (paymentFilter !== 'all' && payment.status !== paymentFilter) return false;
    if (searchTerm && !payment.milestone_details.project_title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !payment.developer_details.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Management</h1>
          <p className="text-gray-400 mt-1">
            {userRole === 'client' ? 'Manage project payments and milestones' :
             userRole === 'developer' ? 'Track your earnings and payment history' :
             'Oversee all platform payments and disputes'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentMethodModal(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
          
          <button
            onClick={loadData}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-300 mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${paymentStats.total_paid.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${paymentStats.total_pending.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-gray-400">Disputes</span>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {paymentStats.total_disputed}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {paymentStats.success_rate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-gray-400">Avg. Processing</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {paymentStats.average_processing_time}d
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700/50">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'milestones', label: 'Milestones', icon: Target },
          { id: 'payments', label: 'Payment History', icon: Receipt },
          { id: 'methods', label: 'Payment Methods', icon: CreditCard },
          { id: 'disputes', label: 'Disputes', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell }
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
              {tab.id === 'disputes' && paymentStats.total_disputed > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {paymentStats.total_disputed}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <PaymentOverviewTab 
            payments={payments}
            milestones={milestones}
            disputes={disputes}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'milestones' && (
          <MilestonesTab 
            milestones={milestones}
            onProcessPayment={processMilestonePayment}
            processingPayment={processingPayment}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'payments' && (
          <PaymentHistoryTab 
            payments={filteredPayments}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'methods' && (
          <PaymentMethodsTab 
            paymentMethods={paymentMethods}
            onVerifyMethod={verifyPaymentMethod}
            verifyingMethod={verifyingMethod}
            onRefresh={loadData}
          />
        )}
        
        {activeTab === 'disputes' && (
          <DisputesTab 
            disputes={disputes}
            onRefresh={loadData}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'notifications' && (
          <NotificationsTab 
            userRole={userRole}
          />
        )}
      </div>

      {/* Modals */}
      {showPaymentMethodModal && (
        <PaymentMethodModal
          onClose={() => setShowPaymentMethodModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

import MilestonesTab from './milestones-tab';
import PaymentMethodsTab from './payment-methods-tab';
import PaymentHistoryTab from './payment-history-tab';
import DisputesTab from './disputes-tab';
import NotificationsTab from './notifications-tab';
import PaymentMethodModal from './payment-method-modal';

// Overview Tab Component
function PaymentOverviewTab({ 
  payments, 
  milestones, 
  disputes, 
  userRole 
}: {
  payments: Payment[];
  milestones: Milestone[];
  disputes: PaymentDispute[];
  userRole: string;
}) {
  return (
    <div className="space-y-6">
      {/* Payment Flow Visualization */}
      <div className="bg-gray-800/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Flow Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Timeline */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              {payments.slice(0, 5).map(payment => (
                <div key={payment.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-400' :
                    payment.status === 'processing' ? 'bg-yellow-400' :
                    payment.status === 'failed' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      ${payment.amount.toLocaleString()} to {payment.developer_details.username}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {payment.milestone_details.project_title} - {payment.milestone_details.percentage}% milestone
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Distribution Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">Payment Distribution</h4>
            <div className="space-y-3">
              {['completed', 'pending', 'processing', 'failed'].map(status => {
                const statusPayments = payments.filter(p => p.status === status);
                const percentage = payments.length > 0 ? (statusPayments.length / payments.length) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-gray-400 capitalize">{status}</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === 'completed' ? 'bg-green-500' :
                          status === 'pending' ? 'bg-yellow-500' :
                          status === 'processing' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-400 text-right">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h4 className="text-md font-medium text-white mb-3">Pending Milestones</h4>
          <div className="text-2xl font-bold text-yellow-400 mb-2">
            {milestones.filter(m => m.status === 'ready').length}
          </div>
          <p className="text-gray-400 text-sm">Ready for payment</p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <h4 className="text-md font-medium text-white mb-3">Active Disputes</h4>
          <div className="text-2xl font-bold text-red-400 mb-2">
            {disputes.filter(d => d.status !== 'closed').length}
          </div>
          <p className="text-gray-400 text-sm">Require attention</p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <h4 className="text-md font-medium text-white mb-3">This Month</h4>
          <div className="text-2xl font-bold text-cyan-400 mb-2">
            ${payments.filter(p => {
              const paymentDate = new Date(p.created_at);
              const now = new Date();
              return paymentDate.getMonth() === now.getMonth() && 
                     paymentDate.getFullYear() === now.getFullYear();
            }).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </div>
          <p className="text-gray-400 text-sm">Total processed</p>
        </div>
      </div>
    </div>
  );
}

// Export the main component
export default PaymentManagementInterface;