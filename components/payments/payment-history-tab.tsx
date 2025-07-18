'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  Calendar, 
  DollarSign,
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

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

interface PaymentHistoryTabProps {
  payments: Payment[];
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userRole: string;
}

export function PaymentHistoryTab({ 
  payments, 
  paymentFilter, 
  setPaymentFilter, 
  searchTerm, 
  setSearchTerm, 
  userRole 
}: PaymentHistoryTabProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState('all');

  // Get payment status info
  const getPaymentStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Clock, label: 'Pending' },
      processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw, label: 'Processing' },
      completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Completed' },
      failed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: XCircle, label: 'Failed' },
      disputed: { color: 'text-orange-400', bg: 'bg-orange-600/20', icon: AlertCircle, label: 'Disputed' },
      refunded: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: ArrowDownLeft, label: 'Refunded' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Get payment type info
  const getPaymentTypeInfo = (type: string) => {
    const typeMap = {
      milestone: { color: 'text-cyan-400', icon: DollarSign, label: 'Milestone' },
      bonus: { color: 'text-green-400', icon: TrendingUp, label: 'Bonus' },
      refund: { color: 'text-purple-400', icon: ArrowDownLeft, label: 'Refund' },
      penalty: { color: 'text-red-400', icon: TrendingDown, label: 'Penalty' }
    };
    return typeMap[type as keyof typeof typeMap] || typeMap.milestone;
  };

  // Sort payments
  const sortedPayments = [...payments].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'processed_at':
        aValue = a.processed_at ? new Date(a.processed_at) : new Date(0);
        bValue = b.processed_at ? new Date(b.processed_at) : new Date(0);
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a.created_at;
        bValue = b.created_at;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter by date range
  const filteredByDate = sortedPayments.filter(payment => {
    if (dateRange === 'all') return true;
    
    const paymentDate = new Date(payment.created_at);
    const now = new Date();
    
    switch (dateRange) {
      case '7d':
        return paymentDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return paymentDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return paymentDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return paymentDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  // Calculate summary statistics
  const summaryStats = {
    total_amount: filteredByDate.reduce((sum, p) => sum + p.amount, 0),
    total_fees: filteredByDate.reduce((sum, p) => sum + p.platform_fee + p.gateway_fee, 0),
    completed_count: filteredByDate.filter(p => p.status === 'completed').length,
    pending_count: filteredByDate.filter(p => p.status === 'pending').length,
    average_amount: filteredByDate.length > 0 ? filteredByDate.reduce((sum, p) => sum + p.amount, 0) / filteredByDate.length : 0
  };

  // Export payments data
  const exportPayments = () => {
    const csvData = filteredByDate.map(payment => ({
      Date: new Date(payment.created_at).toLocaleDateString(),
      'Project': payment.milestone_details.project_title,
      'Milestone': `${payment.milestone_details.percentage}%`,
      'Developer': payment.developer_details.username,
      'Amount': payment.amount,
      'Net Amount': payment.net_amount,
      'Platform Fee': payment.platform_fee,
      'Gateway Fee': payment.gateway_fee,
      'Type': payment.payment_type,
      'Status': payment.status,
      'Processed': payment.processed_at ? new Date(payment.processed_at).toLocaleDateString() : 'N/A'
    }));

    // Convert to CSV and download
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Total Amount</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            ${summaryStats.total_amount.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-red-400" />
            <span className="text-sm text-gray-400">Total Fees</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            ${summaryStats.total_fees.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Completed</span>
          </div>
          <div className="text-xl font-bold text-white">
            {summaryStats.completed_count}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-xl font-bold text-white">
            {summaryStats.pending_count}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Average</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">
            ${summaryStats.average_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportPayments}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-gray-800/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th 
                  className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortBy === 'created_at') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('created_at');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium">Project</th>
                <th className="text-left p-4 text-gray-400 font-medium">
                  {userRole === 'client' ? 'Developer' : 'Client'}
                </th>
                <th 
                  className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                <th 
                  className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortBy === 'status') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('status');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredByDate.map(payment => {
                const statusInfo = getPaymentStatusInfo(payment.status);
                const typeInfo = getPaymentTypeInfo(payment.payment_type);
                const StatusIcon = statusInfo.icon;
                const TypeIcon = typeInfo.icon;
                
                return (
                  <tr key={payment.id} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                    <td className="p-4 text-gray-300">
                      <div>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {payment.milestone_details.project_title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.milestone_details.percentage}% Milestone
                      </div>
                    </td>
                    
                    <td className="p-4 text-gray-300">
                      {payment.developer_details.first_name} {payment.developer_details.last_name}
                      <div className="text-xs text-gray-500">
                        @{payment.developer_details.username}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-white font-bold">
                        ${payment.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Net: ${payment.net_amount.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className={`flex items-center gap-1 ${typeInfo.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentModal(true);
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredByDate.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Payments Found</h3>
          <p className="text-gray-500">
            {payments.length === 0 
              ? 'No payments have been processed yet.'
              : 'No payments match your current filters.'
            }
          </p>
        </div>
      )}

      {/* Payment Detail Modal */}
      {showPaymentModal && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          userRole={userRole}
        />
      )}
    </div>
  );
}

// Payment Detail Modal
function PaymentDetailModal({ 
  payment, 
  onClose, 
  userRole 
}: { 
  payment: Payment; 
  onClose: () => void;
  userRole: string;
}) {
  const statusInfo = getPaymentStatusInfo(payment.status);
  const typeInfo = getPaymentTypeInfo(payment.payment_type);
  const StatusIcon = statusInfo.icon;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Payment Details</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </div>
                <div className={`flex items-center gap-1 ${typeInfo.color}`}>
                  <TypeIcon className="h-3 w-3" />
                  <span className="text-sm">{typeInfo.label}</span>
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
          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-white font-mono text-sm">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold text-lg">
                    ${payment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee:</span>
                  <span className="text-red-400">
                    -${payment.platform_fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gateway Fee:</span>
                  <span className="text-red-400">
                    -${payment.gateway_fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-400 font-medium">Net Amount:</span>
                  <span className="text-green-400 font-bold">
                    ${payment.net_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Project Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Project:</span>
                  <span className="text-white">{payment.milestone_details.project_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Milestone:</span>
                  <span className="text-white">{payment.milestone_details.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Developer:</span>
                  <span className="text-white">
                    {payment.developer_details.first_name} {payment.developer_details.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span className="text-cyan-400">@{payment.developer_details.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <div>
                  <div className="text-white">Payment Created</div>
                  <div className="text-gray-400 text-sm">
                    {new Date(payment.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {payment.processed_at && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div>
                    <div className="text-white">Payment Processed</div>
                    <div className="text-gray-400 text-sm">
                      {new Date(payment.processed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
            
            {payment.status === 'completed' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                <ExternalLink className="h-4 w-4" />
                View Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions (moved outside to avoid re-creation)
function getPaymentStatusInfo(status: string) {
  const statusMap = {
    pending: { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Clock, label: 'Pending' },
    processing: { color: 'text-blue-400', bg: 'bg-blue-600/20', icon: RefreshCw, label: 'Processing' },
    completed: { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Completed' },
    failed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: XCircle, label: 'Failed' },
    disputed: { color: 'text-orange-400', bg: 'bg-orange-600/20', icon: AlertCircle, label: 'Disputed' },
    refunded: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: ArrowDownLeft, label: 'Refunded' }
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.pending;
}

function getPaymentTypeInfo(type: string) {
  const typeMap = {
    milestone: { color: 'text-cyan-400', icon: DollarSign, label: 'Milestone' },
    bonus: { color: 'text-green-400', icon: TrendingUp, label: 'Bonus' },
    refund: { color: 'text-purple-400', icon: ArrowDownLeft, label: 'Refund' },
    penalty: { color: 'text-red-400', icon: TrendingDown, label: 'Penalty' }
  };
  return typeMap[type as keyof typeof typeMap] || typeMap.milestone;
}

export default PaymentHistoryTab;