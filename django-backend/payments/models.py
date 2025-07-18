from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class Milestone(models.Model):
    """25% payment increment milestones as specified in design"""
    
    MILESTONE_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('paid', 'Paid'),
        ('disputed', 'Disputed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'projects.Project', 
        on_delete=models.CASCADE, 
        related_name='milestones'
    )
    percentage = models.IntegerField()  # 25, 50, 75, 100
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=MILESTONE_STATUS, default='pending')
    due_date = models.DateTimeField()
    paid_date = models.DateTimeField(null=True, blank=True)
    
    # Additional milestone details
    description = models.TextField(blank=True, null=True)
    deliverables = models.JSONField(default=list)  # List of expected deliverables
    completion_criteria = models.JSONField(default=list)  # Criteria for completion
    
    # Approval workflow
    client_approved = models.BooleanField(default=False)
    client_approval_date = models.DateTimeField(null=True, blank=True)
    senior_developer_approved = models.BooleanField(default=False)
    senior_developer_approval_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestones'
        ordering = ['project', 'percentage']
        
    def __str__(self):
        return f"{self.project.title} - {self.percentage}% Milestone"


class Payment(models.Model):
    """Milestone-based payment tracking as specified in design"""
    
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('disputed', 'Disputed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_TYPES = [
        ('milestone', 'Milestone Payment'),
        ('bonus', 'Bonus Payment'),
        ('refund', 'Refund'),
        ('penalty', 'Penalty Deduction'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='payments')
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default='milestone')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Payment processing
    payment_gateway = models.ForeignKey(
        'PaymentGateway', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL
    )
    transaction_id = models.CharField(max_length=200, blank=True, null=True)
    gateway_response = models.JSONField(default=dict)
    
    # Timing
    processed_at = models.DateTimeField(null=True, blank=True)
    expected_date = models.DateTimeField(null=True, blank=True)
    
    # Fees and deductions
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gateway_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Additional details
    description = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Payment to {self.developer.username} - ${self.amount}"


class PaymentGateway(models.Model):
    """Payment gateway configurations and settings"""
    
    GATEWAY_TYPES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('square', 'Square'),
        ('bank_transfer', 'Bank Transfer'),
        ('crypto', 'Cryptocurrency'),
    ]
    
    GATEWAY_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
        ('deprecated', 'Deprecated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPES)
    status = models.CharField(max_length=20, choices=GATEWAY_STATUS, default='active')
    
    # Configuration
    api_endpoint = models.URLField()
    api_key_encrypted = models.TextField()  # Encrypted API key
    webhook_url = models.URLField(blank=True, null=True)
    webhook_secret = models.CharField(max_length=200, blank=True, null=True)
    
    # Fees and limits
    transaction_fee_percentage = models.DecimalField(max_digits=5, decimal_places=4, default=0.0)
    transaction_fee_fixed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    minimum_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.01)
    maximum_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Supported features
    supports_refunds = models.BooleanField(default=True)
    supports_partial_refunds = models.BooleanField(default=True)
    supports_recurring = models.BooleanField(default=False)
    supports_escrow = models.BooleanField(default=False)
    
    # Geographic and currency support
    supported_countries = models.JSONField(default=list)
    supported_currencies = models.JSONField(default=list)
    
    # Performance metrics
    success_rate = models.FloatField(default=0.0)
    average_processing_time = models.IntegerField(default=0)  # Seconds
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_gateways'
        ordering = ['name']
        
    def __str__(self):
        return f"{self.name} ({self.gateway_type})"


class TransactionLog(models.Model):
    """Detailed transaction logs for payment processing"""
    
    LOG_TYPES = [
        ('payment_initiated', 'Payment Initiated'),
        ('payment_processing', 'Payment Processing'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('refund_initiated', 'Refund Initiated'),
        ('refund_completed', 'Refund Completed'),
        ('dispute_opened', 'Dispute Opened'),
        ('dispute_resolved', 'Dispute Resolved'),
        ('webhook_received', 'Webhook Received'),
        ('error_occurred', 'Error Occurred'),
    ]
    
    LOG_LEVELS = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transaction_logs')
    
    # Log details
    log_type = models.CharField(max_length=30, choices=LOG_TYPES)
    log_level = models.CharField(max_length=10, choices=LOG_LEVELS, default='info')
    message = models.TextField()
    
    # Technical details
    gateway_response = models.JSONField(default=dict)
    error_code = models.CharField(max_length=100, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Context information
    user_agent = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transaction_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'log_type']),
            models.Index(fields=['log_level', 'created_at']),
        ]
        
    def __str__(self):
        return f"{self.payment} - {self.log_type} ({self.log_level})"


class PaymentDispute(models.Model):
    """Handle payment conflicts and disputes"""
    
    DISPUTE_TYPES = [
        ('non_delivery', 'Non-delivery of Work'),
        ('quality_issue', 'Quality Issue'),
        ('scope_change', 'Scope Change'),
        ('payment_delay', 'Payment Delay'),
        ('unauthorized_charge', 'Unauthorized Charge'),
        ('duplicate_charge', 'Duplicate Charge'),
        ('other', 'Other'),
    ]
    
    DISPUTE_STATUS = [
        ('opened', 'Opened'),
        ('under_review', 'Under Review'),
        ('evidence_requested', 'Evidence Requested'),
        ('mediation', 'In Mediation'),
        ('resolved_client', 'Resolved in Favor of Client'),
        ('resolved_developer', 'Resolved in Favor of Developer'),
        ('resolved_partial', 'Partially Resolved'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='disputes')
    
    # Dispute parties
    initiated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_disputes')
    disputed_against = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disputes_against')
    
    # Dispute details
    dispute_type = models.CharField(max_length=30, choices=DISPUTE_TYPES)
    status = models.CharField(max_length=20, choices=DISPUTE_STATUS, default='opened')
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    
    # Dispute content
    title = models.CharField(max_length=200)
    description = models.TextField()
    disputed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Evidence and documentation
    evidence_files = models.JSONField(default=list)  # File URLs
    communication_logs = models.JSONField(default=list)  # Related messages
    
    # Resolution details
    resolution_summary = models.TextField(blank=True, null=True)
    resolution_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    resolved_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='resolved_disputes'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Timeline tracking
    response_deadline = models.DateTimeField(null=True, blank=True)
    escalation_date = models.DateTimeField(null=True, blank=True)
    
    # Internal notes
    admin_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_disputes'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Dispute: {self.title} - {self.status}"


class PaymentMethod(models.Model):
    """User payment methods for receiving payments"""
    
    METHOD_TYPES = [
        ('bank_account', 'Bank Account'),
        ('paypal', 'PayPal'),
        ('stripe_account', 'Stripe Account'),
        ('crypto_wallet', 'Cryptocurrency Wallet'),
        ('digital_wallet', 'Digital Wallet'),
    ]
    
    METHOD_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    
    # Method details
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    status = models.CharField(max_length=20, choices=METHOD_STATUS, default='pending_verification')
    is_default = models.BooleanField(default=False)
    
    # Account information (encrypted)
    account_details = models.JSONField(default=dict)  # Encrypted account details
    display_name = models.CharField(max_length=100)  # User-friendly name
    
    # Verification
    verification_status = models.CharField(max_length=20, default='pending')
    verification_date = models.DateTimeField(null=True, blank=True)
    verification_documents = models.JSONField(default=list)
    
    # Usage statistics
    total_payments_received = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    last_used_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        ordering = ['-is_default', '-last_used_date']
        
    def __str__(self):
        return f"{self.user.username} - {self.display_name}"
