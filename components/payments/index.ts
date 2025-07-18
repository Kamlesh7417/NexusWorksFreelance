// Payment Management Components
export { default as PaymentManagementInterface } from './payment-management-interface';
export { default as MilestonesTab } from './milestones-tab';
export { default as PaymentMethodsTab } from './payment-methods-tab';
export { default as PaymentHistoryTab } from './payment-history-tab';
export { default as DisputesTab } from './disputes-tab';
export { default as NotificationsTab } from './notifications-tab';
export { default as PaymentMethodModal } from './payment-method-modal';

// Re-export existing payment components
export { MilestonePaymentTracker } from '../dashboard/milestone-payment-tracker';

// Types
export interface PaymentMethod {
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

export interface Milestone {
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

export interface Payment {
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

export interface PaymentDispute {
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