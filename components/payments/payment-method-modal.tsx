'use client';

import React, { useState } from 'react';
import { paymentService } from '@/lib/services/payment-service';
import { 
  CreditCard, 
  Building2 as Bank, 
  Smartphone, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from 'lucide-react';

interface PaymentMethodModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentMethodModal({ onClose, onSuccess }: PaymentMethodModalProps) {
  const [step, setStep] = useState(1); // 1: Select Type, 2: Enter Details, 3: Verify
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    display_name: '',
    // Credit Card
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    // Bank Account
    account_number: '',
    routing_number: '',
    account_type: 'checking',
    account_holder_name: '',
    // PayPal
    paypal_email: '',
    // Stripe
    stripe_account_id: '',
    // Common
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);

  // Payment method types
  const paymentTypes = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
      popular: true
    },
    {
      id: 'bank_account',
      name: 'Bank Account',
      description: 'Direct bank transfer (ACH)',
      icon: Bank,
      popular: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'PayPal account',
      icon: Smartphone,
      popular: false
    },
    {
      id: 'stripe',
      name: 'Stripe Account',
      description: 'Connect your Stripe account',
      icon: CreditCard,
      popular: false
    }
  ];

  // Handle type selection
  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep(2);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!validateFormData()) {
        setLoading(false);
        return;
      }

      // In a real implementation, this would tokenize the payment method
      // and send the token to the backend
      const result = await paymentService.addPaymentMethod({
        type: selectedType,
        token: generateMockToken(), // Would be real token from payment processor
        is_default: formData.is_default
      });

      if (result.success) {
        setStep(3); // Move to verification step
      } else {
        setError(result.error || 'Failed to add payment method');
      }
    } catch (err) {
      setError('Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  // Validate form data
  const validateFormData = (): boolean => {
    if (!formData.display_name.trim()) {
      setError('Display name is required');
      return false;
    }

    switch (selectedType) {
      case 'credit_card':
        if (!formData.card_number || !formData.expiry_month || !formData.expiry_year || !formData.cvv) {
          setError('All credit card fields are required');
          return false;
        }
        if (formData.card_number.replace(/\s/g, '').length < 13) {
          setError('Invalid card number');
          return false;
        }
        break;
      
      case 'bank_account':
        if (!formData.account_number || !formData.routing_number) {
          setError('Account and routing numbers are required');
          return false;
        }
        if (formData.routing_number.length !== 9) {
          setError('Routing number must be 9 digits');
          return false;
        }
        break;
      
      case 'paypal':
        if (!formData.paypal_email) {
          setError('PayPal email is required');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.paypal_email)) {
          setError('Invalid email address');
          return false;
        }
        break;
      
      case 'stripe':
        if (!formData.stripe_account_id) {
          setError('Stripe account ID is required');
          return false;
        }
        break;
    }

    return true;
  };

  // Generate mock token (in real implementation, this would use Stripe.js, etc.)
  const generateMockToken = (): string => {
    return `tok_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Format card number
  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Handle verification completion
  const handleVerificationComplete = () => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 1 ? 'Add Payment Method' :
                 step === 2 ? 'Enter Payment Details' :
                 'Verify Payment Method'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3].map(stepNum => (
                  <div
                    key={stepNum}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNum === step ? 'bg-cyan-600 text-white' :
                      stepNum < step ? 'bg-green-600 text-white' :
                      'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {stepNum < step ? <CheckCircle className="h-4 w-4" /> : stepNum}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Payment Type */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-400 mb-6">
                Choose the type of payment method you'd like to add
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className="relative p-6 bg-gray-800/30 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-colors text-left"
                    >
                      {type.popular && (
                        <div className="absolute top-2 right-2 bg-cyan-600 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-700/50 rounded-lg">
                          <Icon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{type.name}</h3>
                          <p className="text-gray-400 text-sm">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Enter Payment Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <span className="text-red-400 font-medium">Error</span>
                  </div>
                  <p className="text-red-300 mt-1">{error}</p>
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Display Name *</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., My Primary Card"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  A friendly name to help you identify this payment method
                </p>
              </div>

              {/* Credit Card Fields */}
              {selectedType === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Cardholder Name *</label>
                    <input
                      type="text"
                      value={formData.cardholder_name}
                      onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Card Number *</label>
                    <div className="relative">
                      <input
                        type={showSensitiveData ? 'text' : 'password'}
                        value={formData.card_number}
                        onChange={(e) => setFormData({ ...formData, card_number: formatCardNumber(e.target.value) })}
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white"
                        maxLength={19}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showSensitiveData ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Month *</label>
                      <select
                        value={formData.expiry_month}
                        onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Year *</label>
                      <select
                        value={formData.expiry_year}
                        onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        required
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year.toString().slice(-2)}>
                            {year.toString().slice(-2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">CVV *</label>
                      <input
                        type={showSensitiveData ? 'text' : 'password'}
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
                        placeholder="123"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Account Fields */}
              {selectedType === 'bank_account' && (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Account Holder Name *</label>
                    <input
                      type="text"
                      value={formData.account_holder_name}
                      onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Account Type *</label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Routing Number *</label>
                    <input
                      type="text"
                      value={formData.routing_number}
                      onChange={(e) => setFormData({ ...formData, routing_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="123456789"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      maxLength={9}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Account Number *</label>
                    <input
                      type={showSensitiveData ? 'text' : 'password'}
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="Account number"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </>
              )}

              {/* PayPal Fields */}
              {selectedType === 'paypal' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">PayPal Email *</label>
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

              {/* Stripe Fields */}
              {selectedType === 'stripe' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Stripe Account ID *</label>
                  <input
                    type="text"
                    value={formData.stripe_account_id}
                    onChange={(e) => setFormData({ ...formData, stripe_account_id: e.target.value })}
                    placeholder="acct_1234567890"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    You can find this in your Stripe dashboard
                  </p>
                </div>
              )}

              {/* Default Option */}
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

              {/* Security Notice */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Secure Processing</h4>
                    <p className="text-gray-400 text-sm">
                      Your payment information is encrypted and processed securely. 
                      We never store your full payment details on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Add Payment Method'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <VerificationStep
              paymentType={selectedType}
              onComplete={handleVerificationComplete}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Verification Step Component
function VerificationStep({ 
  paymentType, 
  onComplete, 
  onBack 
}: { 
  paymentType: string; 
  onComplete: () => void; 
  onBack: () => void; 
}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would verify with the payment processor
      if (verificationCode === '123456') {
        onComplete();
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="p-4 bg-cyan-600/20 rounded-full">
          <Shield className="h-8 w-8 text-cyan-400" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Verify Your Payment Method</h3>
        <p className="text-gray-400">
          {paymentType === 'credit_card' && 'We\'ve sent a verification code to your phone number on file.'}
          {paymentType === 'bank_account' && 'We\'ve made two small deposits to your account. Please enter the amounts.'}
          {paymentType === 'paypal' && 'Please check your PayPal account for a verification request.'}
          {paymentType === 'stripe' && 'Please verify your Stripe account connection.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-gray-400 text-sm mb-2">
          {paymentType === 'bank_account' ? 'Deposit Amounts' : 'Verification Code'}
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder={paymentType === 'bank_account' ? '0.01, 0.02' : '123456'}
          className="w-full max-w-xs mx-auto bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2 justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verifying...
            </div>
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
}

export default PaymentMethodModal;