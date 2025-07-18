from django.contrib import admin
from .models import (
    Milestone, Payment, PaymentGateway, TransactionLog, 
    PaymentDispute, PaymentMethod
)


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    """Admin interface for Milestone model"""
    
    list_display = [
        'project', 'percentage', 'amount', 'status', 
        'due_date', 'client_approved', 'senior_developer_approved'
    ]
    list_filter = ['status', 'percentage', 'client_approved', 'senior_developer_approved']
    search_fields = ['project__title', 'project__client__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('project', 'percentage', 'amount', 'status', 'description')
        }),
        ('Timeline', {
            'fields': ('due_date', 'paid_date')
        }),
        ('Deliverables', {
            'fields': ('deliverables', 'completion_criteria')
        }),
        ('Approval Status', {
            'fields': (
                'client_approved', 'client_approval_date',
                'senior_developer_approved', 'senior_developer_approval_date'
            )
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model"""
    
    list_display = [
        'developer', 'milestone', 'amount', 'net_amount', 
        'payment_type', 'status', 'processed_at'
    ]
    list_filter = ['payment_type', 'status', 'payment_gateway']
    search_fields = [
        'developer__username', 'milestone__project__title', 
        'transaction_id'
    ]
    readonly_fields = [
        'id', 'transaction_id', 'gateway_response', 'processed_at',
        'platform_fee', 'gateway_fee', 'net_amount', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Payment Details', {
            'fields': ('milestone', 'developer', 'amount', 'payment_type', 'status')
        }),
        ('Gateway Information', {
            'fields': ('payment_gateway', 'transaction_id', 'gateway_response')
        }),
        ('Fees and Processing', {
            'fields': ('platform_fee', 'gateway_fee', 'net_amount', 'processed_at', 'expected_date')
        }),
        ('Additional Information', {
            'fields': ('description', 'metadata')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    """Admin interface for PaymentGateway model"""
    
    list_display = [
        'name', 'gateway_type', 'status', 'success_rate',
        'transaction_fee_percentage', 'supports_refunds'
    ]
    list_filter = ['gateway_type', 'status', 'supports_refunds', 'supports_escrow']
    search_fields = ['name', 'gateway_type']
    readonly_fields = [
        'id', 'success_rate', 'average_processing_time', 
        'created_at', 'updated_at'
    ]
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'gateway_type', 'status')
        }),
        ('API Configuration', {
            'fields': ('api_endpoint', 'api_key_encrypted', 'webhook_url', 'webhook_secret')
        }),
        ('Fees and Limits', {
            'fields': (
                'transaction_fee_percentage', 'transaction_fee_fixed',
                'minimum_amount', 'maximum_amount'
            )
        }),
        ('Features', {
            'fields': (
                'supports_refunds', 'supports_partial_refunds',
                'supports_recurring', 'supports_escrow'
            )
        }),
        ('Geographic Support', {
            'fields': ('supported_countries', 'supported_currencies')
        }),
        ('Performance Metrics', {
            'fields': ('success_rate', 'average_processing_time')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    """Admin interface for TransactionLog model"""
    
    list_display = [
        'payment', 'log_type', 'log_level', 'message', 'created_at'
    ]
    list_filter = ['log_type', 'log_level', 'created_at']
    search_fields = ['payment__transaction_id', 'message', 'error_code']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Log Information', {
            'fields': ('payment', 'log_type', 'log_level', 'message')
        }),
        ('Technical Details', {
            'fields': ('gateway_response', 'error_code', 'error_message')
        }),
        ('Context', {
            'fields': ('user_agent', 'ip_address', 'session_id')
        }),
        ('Additional Data', {
            'fields': ('metadata',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PaymentDispute)
class PaymentDisputeAdmin(admin.ModelAdmin):
    """Admin interface for PaymentDispute model"""
    
    list_display = [
        'title', 'dispute_type', 'status', 'priority',
        'disputed_amount', 'initiated_by', 'created_at'
    ]
    list_filter = ['dispute_type', 'status', 'priority', 'created_at']
    search_fields = [
        'title', 'initiated_by__username', 'disputed_against__username',
        'payment__transaction_id'
    ]
    readonly_fields = [
        'id', 'resolved_by', 'resolved_at', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Dispute Information', {
            'fields': (
                'payment', 'dispute_type', 'status', 'priority',
                'title', 'description', 'disputed_amount'
            )
        }),
        ('Parties', {
            'fields': ('initiated_by', 'disputed_against')
        }),
        ('Evidence', {
            'fields': ('evidence_files', 'communication_logs')
        }),
        ('Resolution', {
            'fields': (
                'resolution_summary', 'resolution_amount',
                'resolved_by', 'resolved_at'
            )
        }),
        ('Timeline', {
            'fields': ('response_deadline', 'escalation_date')
        }),
        ('Internal Notes', {
            'fields': ('admin_notes',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    """Admin interface for PaymentMethod model"""
    
    list_display = [
        'user', 'display_name', 'method_type', 'status',
        'is_default', 'verification_status', 'total_payments_received'
    ]
    list_filter = ['method_type', 'status', 'verification_status', 'is_default']
    search_fields = ['user__username', 'display_name']
    readonly_fields = [
        'id', 'account_details', 'verification_date', 'verification_documents',
        'total_payments_received', 'last_used_date', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'method_type', 'status', 'is_default', 'display_name')
        }),
        ('Verification', {
            'fields': (
                'verification_status', 'verification_date', 'verification_documents'
            )
        }),
        ('Usage Statistics', {
            'fields': ('total_payments_received', 'last_used_date')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
