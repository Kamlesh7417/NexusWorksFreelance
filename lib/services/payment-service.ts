/**
 * Payment Service
 * Handles all payment-related operations including milestones and transactions
 */

import { apiClient, Payment, APIResponse, PaginatedResponse } from '../api-client';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'stripe';
  last_four?: string;
  brand?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Milestone {
  id: string;
  project: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'ready' | 'processing' | 'completed' | 'disputed';
  due_date: string;
  paid_date?: string;
  description: string;
  tasks_completed: number;
  total_tasks: number;
}

export interface PaymentDistribution {
  developer: string;
  developer_name: string;
  amount: number;
  percentage: number;
  tasks_completed: string[];
  hours_worked: number;
}

export interface PaymentRequest {
  milestone_id: string;
  amount: number;
  distributions: PaymentDistribution[];
  payment_method_id: string;
  notes?: string;
}

export interface PaymentDispute {
  id: string;
  payment: string;
  raised_by: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export interface PaymentStats {
  total_paid: number;
  total_pending: number;
  total_disputed: number;
  average_payment_time: number;
  payment_success_rate: number;
  monthly_volume: number;
}

export interface InvoiceData {
  project_id: string;
  milestone_id: string;
  amount: number;
  tax_rate?: number;
  discount?: number;
  notes?: string;
}

class PaymentService {
  /**
   * Get payments with optional filtering
   */
  async getPayments(filters?: {
    project?: string;
    developer?: string;
    status?: string;
    milestone?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Payment>>> {
    return apiClient.getPayments(filters);
  }

  /**
   * Get payment methods for current user
   */
  async getPaymentMethods(): Promise<APIResponse<PaymentMethod[]>> {
    return apiClient.makeRequest('/payments/methods/');
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(methodData: {
    type: string;
    token: string;
    is_default?: boolean;
  }): Promise<APIResponse<PaymentMethod>> {
    return apiClient.makeRequest('/payments/methods/', {
      method: 'POST',
      body: JSON.stringify(methodData),
    });
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    methodId: string, 
    updates: Partial<PaymentMethod>
  ): Promise<APIResponse<PaymentMethod>> {
    return apiClient.makeRequest(`/payments/methods/${methodId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/payments/methods/${methodId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Get project milestones
   */
  async getProjectMilestones(projectId: string): Promise<APIResponse<Milestone[]>> {
    return apiClient.makeRequest(`/payments/milestones/?project=${projectId}`);
  }

  /**
   * Get specific milestone details
   */
  async getMilestone(milestoneId: string): Promise<APIResponse<Milestone>> {
    return apiClient.makeRequest(`/payments/milestones/${milestoneId}/`);
  }

  /**
   * Process milestone payment
   */
  async processMilestonePayment(paymentRequest: PaymentRequest): Promise<APIResponse<{
    payment_id: string;
    status: string;
    transaction_id?: string;
    estimated_completion: string;
  }>> {
    return apiClient.makeRequest('/payments/process-milestone/', {
      method: 'POST',
      body: JSON.stringify(paymentRequest),
    });
  }

  /**
   * Get payment distribution for a milestone
   */
  async getPaymentDistribution(milestoneId: string): Promise<APIResponse<PaymentDistribution[]>> {
    return apiClient.makeRequest(`/payments/distribution/${milestoneId}/`);
  }

  /**
   * Calculate payment distribution automatically
   */
  async calculateDistribution(milestoneId: string): Promise<APIResponse<PaymentDistribution[]>> {
    return apiClient.makeRequest(`/payments/calculate-distribution/${milestoneId}/`, {
      method: 'POST',
    });
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    type?: 'incoming' | 'outgoing';
  }): Promise<APIResponse<PaginatedResponse<Payment>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/payments/history/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(timeframe?: 'week' | 'month' | 'quarter' | 'year'): Promise<APIResponse<PaymentStats>> {
    const endpoint = `/payments/stats/${timeframe ? `?timeframe=${timeframe}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Create payment dispute
   */
  async createDispute(disputeData: {
    payment_id: string;
    reason: string;
    description: string;
    evidence?: string[];
  }): Promise<APIResponse<PaymentDispute>> {
    return apiClient.makeRequest('/payments/disputes/', {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  }

  /**
   * Get payment disputes
   */
  async getDisputes(filters?: {
    status?: string;
    payment?: string;
  }): Promise<APIResponse<PaymentDispute[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/payments/disputes/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Update dispute status
   */
  async updateDispute(
    disputeId: string, 
    updates: {
      status?: string;
      resolution?: string;
      admin_notes?: string;
    }
  ): Promise<APIResponse<PaymentDispute>> {
    return apiClient.makeRequest(`/payments/disputes/${disputeId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Generate invoice for milestone
   */
  async generateInvoice(invoiceData: InvoiceData): Promise<APIResponse<{
    invoice_id: string;
    pdf_url: string;
    amount: number;
    due_date: string;
  }>> {
    return apiClient.makeRequest('/payments/invoices/', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/payments/invoices/${invoiceId}/`);
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, transactionId?: string): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/payments/invoices/${invoiceId}/mark-paid/`, {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId }),
    });
  }

  /**
   * Request payment refund
   */
  async requestRefund(paymentId: string, reason: string, amount?: number): Promise<APIResponse<{
    refund_id: string;
    status: string;
    estimated_completion: string;
  }>> {
    return apiClient.makeRequest(`/payments/${paymentId}/refund/`, {
      method: 'POST',
      body: JSON.stringify({ reason, amount }),
    });
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId: string): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/payments/refunds/${refundId}/`);
  }

  /**
   * Set up automatic payments for project
   */
  async setupAutomaticPayments(projectId: string, settings: {
    enabled: boolean;
    payment_method_id: string;
    auto_approve_threshold?: number;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/payments/auto-setup/${projectId}/`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Get payment gateway status
   */
  async getGatewayStatus(): Promise<APIResponse<{
    stripe_status: string;
    paypal_status: string;
    bank_transfer_status: string;
    processing_delays: Record<string, number>;
  }>> {
    return apiClient.makeRequest('/payments/gateway-status/');
  }

  /**
   * Verify payment method
   */
  async verifyPaymentMethod(methodId: string, verificationData: any): Promise<APIResponse<{
    verified: boolean;
    verification_status: string;
    next_steps?: string[];
  }>> {
    return apiClient.makeRequest(`/payments/methods/${methodId}/verify/`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  /**
   * Get tax information for payments
   */
  async getTaxInfo(year?: number): Promise<APIResponse<{
    total_earnings: number;
    total_fees: number;
    tax_documents: string[];
    tax_rate: number;
  }>> {
    const endpoint = `/payments/tax-info/${year ? `?year=${year}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }
}

export const paymentService = new PaymentService();
export default paymentService;