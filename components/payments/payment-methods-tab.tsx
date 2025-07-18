'use client';

import React, { useState } from 'react';
import { paymentService } from '@/lib/services/payment-service';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Star,
  DollarSign,
  Calendar,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Building2 as Bank,
  Smartphone
} from 'lucide-react';

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

interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];
  onVerifyMethod: (methodId: string) => void;
  verifyingMethod: string | null;
  onRefresh: () => void;
}

export function PaymentMethodsTab({ 
  paymentMethods, 
  onVerifyMethod, 
  verifyingMethod, 
  onRefresh 
}: PaymentMethodsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  // Get payment method icon
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return CreditCard;
      case 'bank_account': return Bank;
      case 'paypal': return Smartphone;
      case 'stripe': return CreditCard;
      default: return CreditCard;
    }
  };

  // Get verification status info
  const getVerificationInfo = (status: string) => {
    switch (status) {
      case 'verified':
        return { color: 'text-green-400', bg: 'bg-green-600/20', icon: CheckCircle, label: 'Verified' };
      case 'pending':
        return { color: 'text-yellow-400', bg: 'bg-yellow-600/20', icon: Clock, label: 'Pending' };
      case 'failed':
        return { color: 'text-red-400', bg: 'bg-red-600/20', icon: AlertCircle, label: 'Failed' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-600/20', icon: Clock, label: 'Unknown' };
    }
  };

  // Set payment method as default
  const setAsDefault = async (methodId: string) => {
    try {
      setSettingDefault(methodId);
      const result = await paymentService.updatePaymentMethod(methodId, { is_default: true });
      if (result.success) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    } finally {
      setSettingDefault(null);
    }
  };

  // Delete payment method
  const deleteMethod = async (methodId: string) => {
    try {
      const result = await paymentService.deletePaymentMethod(methodId);
      if (result.success) {
        onRefresh();
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage your payment methods for receiving payments
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map(method => {
          const MethodIcon = getMethodIcon(method.type);
          const verificationInfo = getVerificationInfo(method.verification_status);
          const VerificationIcon = verificationInfo.icon;
          const isVerifying = verifyingMethod === method.id;
          const isSettingDefault = settingDefault === method.id;
          
          return (
            <div
              key={method.id}
              className={`bg-gray-800/30 border rounded-lg p-4 transition-colors ${
                method.is_default 
                  ? 'border-cyan-500/50 bg-cyan-900/10' 
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    method.is_default ? 'bg-cyan-600/20' : 'bg-gray-700/50'
                  }`}>
                    <MethodIcon className={`h-5 w-5 ${
                      method.is_default ? 'text-cyan-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{method.display_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {method.is_default && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600/20 text-cyan-400 rounded-full text-xs">
                          <Star className="h-3 w-3" />
                          Default
                        </div>
                      )}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${verificationInfo.bg} ${verificationInfo.color}`}>
                        <VerificationIcon className="h-3 w-3" />
                        {verificationInfo.label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div className="relative">
                  <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                    <Settings className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Method Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">
                    {method.type.replace('_', ' ')}
                  </span>
                </div>
                
                {method.last_four && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ending in:</span>
                    <span className="text-white">****{method.last_four}</span>
                  </div>
                )}
                
                {method.brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Brand:</span>
                    <span className="text-white">{method.brand}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Added:</span>
                  <span className="text-white">
                    {new Date(method.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Received:</span>
                  <span className="text-green-400 font-medium">
                    ${method.total_payments_received.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!method.is_verified && method.verification_status !== 'failed' && (
                  <button
                    onClick={() => onVerifyMethod(method.id)}
                    disabled={isVerifying}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Shield className="h-3 w-3" />
                    )}
                    Verify
                  </button>
                )}
                
                {!method.is_default && method.is_verified && (
                  <button
                    onClick={() => setAsDefault(method.id)}
                    disabled={isSettingDefault}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isSettingDefault ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Star className="h-3 w-3" />
                    )}
                    Set Default
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedMethod(method);
                    setShowEditModal(true);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="h-3 w-3 text-gray-400" />
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(method.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Payment Methods</h3>
          <p className="text-gray-500 mb-4">
            Add a payment method to start receiving payments for your work.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            Add Your First Payment Method
          </button>
        </div>
      )}

      {/* Payment Method Statistics */}
      {paymentMethods.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Payment Method Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {paymentMethods.filter(m => m.is_verified).length}
              </div>
              <div className="text-gray-400 text-sm">Verified Methods</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                ${paymentMethods.reduce((sum, m) => sum + m.total_payments_received, 0).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Received</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {paymentMethods.filter(m => m.verification_status === 'pending').length}
              </div>
              <div className="text-gray-400 text-sm">Pending Verification</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPaymentMethodModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {showEditModal && selectedMethod && (
        <EditPaymentMethodModal
          method={selectedMethod}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMethod(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedMethod(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Payment Method</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this payment method? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMethod(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Payment Method Modal
function AddPaymentMethodModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    type: 'credit_card',
    display_name: '',
    account_number: '',
    routing_number: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    paypal_email: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would tokenize the payment method
      // and send the token to the backend
      const result = await paymentService.addPaymentMethod({
        type: formData.type,
        token: 'mock_token', // Would be real token from payment processor
        is_default: formData.is_default
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to add payment method');
      }
    } catch (err) {
      setError('Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Payment Method</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">Payment Method Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_account">Bank Account</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe Account</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., My Primary Card"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          {/* Conditional fields based on payment type */}
          {formData.type === 'credit_card' && (
            <>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Card Number</label>
                <input
                  type="text"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Month</label>
                  <input
                    type="text"
                    value={formData.expiry_month}
                    onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                    placeholder="MM"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Year</label>
                  <input
                    type="text"
                    value={formData.expiry_year}
                    onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                    placeholder="YY"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">CVV</label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                    placeholder="123"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'bank_account' && (
            <>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Account Number</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Account number"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Routing Number</label>
                <input
                  type="text"
                  value={formData.routing_number}
                  onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                  placeholder="Routing number"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'paypal' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">PayPal Email</label>
              <input
                type="email"
                value={formData.paypal_email}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-cyan-600"
            />
            <label htmlFor="is_default" className="text-gray-400 text-sm">
              Set as default payment method
            </label>
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
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Payment Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Payment Method Modal
function EditPaymentMethodModal({ 
  method, 
  onClose, 
  onSuccess 
}: { 
  method: PaymentMethod; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [displayName, setDisplayName] = useState(method.display_name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.updatePaymentMethod(method.id, {
        display_name: displayName
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to update payment method');
      }
    } catch (err) {
      setError('Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Edit Payment Method</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentMethodsTab;