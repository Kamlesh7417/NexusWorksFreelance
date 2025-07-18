from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Milestone, Payment, PaymentGateway, TransactionLog, 
    PaymentDispute, PaymentMethod
)

User = get_user_model()


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for the 25% payment Milestone model"""
    
    project_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'project_details', 'percentage', 'amount',
            'status', 'due_date', 'paid_date', 'description', 'deliverables',
            'completion_criteria', 'client_approved', 'client_approval_date',
            'senior_developer_approved', 'senior_developer_approval_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'paid_date', 'client_approval_date', 
            'senior_developer_approval_date', 'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for the Payment model"""
    
    milestone_details = serializers.SerializerMethodField()
    developer_details = serializers.SerializerMethodField()
    gateway_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'milestone', 'milestone_details', 'developer', 'developer_details',
            'amount', 'payment_type', 'status', 'payment_gateway', 'gateway_details',
            'transaction_id', 'gateway_response', 'processed_at', 'expected_date',
            'platform_fee', 'gateway_fee', 'net_amount', 'description', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'gateway_response', 'processed_at', 
            'platform_fee', 'gateway_fee', 'net_amount', 'created_at', 'updated_at'
        ]
    
    def get_milestone_details(self, obj):
        """Get basic milestone information"""
        if obj.milestone:
            return {
                'id': obj.milestone.id,
                'percentage': obj.milestone.percentage,
                'project_title': obj.milestone.project.title,
            }
        return None
    
    def get_developer_details(self, obj):
        """Get basic developer information"""
        if obj.developer:
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
            }
        return None
    
    def get_gateway_details(self, obj):
        """Get basic payment gateway information"""
        if obj.payment_gateway:
            return {
                'id': obj.payment_gateway.id,
                'name': obj.payment_gateway.name,
                'gateway_type': obj.payment_gateway.gateway_type,
            }
        return None


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer for PaymentGateway model"""
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'gateway_type', 'status', 'api_endpoint',
            'webhook_url', 'transaction_fee_percentage', 'transaction_fee_fixed',
            'minimum_amount', 'maximum_amount', 'supports_refunds',
            'supports_partial_refunds', 'supports_recurring', 'supports_escrow',
            'supported_countries', 'supported_currencies', 'success_rate',
            'average_processing_time', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'api_key_encrypted', 'webhook_secret', 'success_rate',
            'average_processing_time', 'created_at', 'updated_at'
        ]


class TransactionLogSerializer(serializers.ModelSerializer):
    """Serializer for TransactionLog model"""
    
    payment_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TransactionLog
        fields = [
            'id', 'payment', 'payment_details', 'log_type', 'log_level',
            'message', 'gateway_response', 'error_code', 'error_message',
            'user_agent', 'ip_address', 'session_id', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_payment_details(self, obj):
        """Get basic payment information"""
        if obj.payment:
            return {
                'id': obj.payment.id,
                'amount': obj.payment.amount,
                'status': obj.payment.status,
                'developer_username': obj.payment.developer.username,
            }
        return None


class PaymentDisputeSerializer(serializers.ModelSerializer):
    """Serializer for PaymentDispute model"""
    
    payment_details = serializers.SerializerMethodField()
    initiated_by_details = serializers.SerializerMethodField()
    disputed_against_details = serializers.SerializerMethodField()
    resolved_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentDispute
        fields = [
            'id', 'payment', 'payment_details', 'initiated_by', 'initiated_by_details',
            'disputed_against', 'disputed_against_details', 'dispute_type', 'status',
            'priority', 'title', 'description', 'disputed_amount', 'evidence_files',
            'communication_logs', 'resolution_summary', 'resolution_amount',
            'resolved_by', 'resolved_by_details', 'resolved_at', 'response_deadline',
            'escalation_date', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'resolved_by', 'resolved_at', 'admin_notes', 'created_at', 'updated_at'
        ]
    
    def get_payment_details(self, obj):
        """Get basic payment information"""
        if obj.payment:
            return {
                'id': obj.payment.id,
                'amount': obj.payment.amount,
                'status': obj.payment.status,
            }
        return None
    
    def get_initiated_by_details(self, obj):
        """Get basic information about dispute initiator"""
        if obj.initiated_by:
            return {
                'id': obj.initiated_by.id,
                'username': obj.initiated_by.username,
                'first_name': obj.initiated_by.first_name,
                'last_name': obj.initiated_by.last_name,
            }
        return None
    
    def get_disputed_against_details(self, obj):
        """Get basic information about disputed party"""
        if obj.disputed_against:
            return {
                'id': obj.disputed_against.id,
                'username': obj.disputed_against.username,
                'first_name': obj.disputed_against.first_name,
                'last_name': obj.disputed_against.last_name,
            }
        return None
    
    def get_resolved_by_details(self, obj):
        """Get basic information about dispute resolver"""
        if obj.resolved_by:
            return {
                'id': obj.resolved_by.id,
                'username': obj.resolved_by.username,
                'first_name': obj.resolved_by.first_name,
                'last_name': obj.resolved_by.last_name,
            }
        return None


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMethod model"""
    
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'user', 'user_details', 'method_type', 'status', 'is_default',
            'display_name', 'verification_status', 'verification_date',
            'total_payments_received', 'last_used_date', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'account_details', 'verification_date', 'verification_documents',
            'total_payments_received', 'last_used_date', 'created_at', 'updated_at'
        ]
    
    def get_user_details(self, obj):
        """Get basic user information"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
            }
        return None


# Legacy serializers for backward compatibility
class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for payment intents"""
    
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default='usd')
    project_id = serializers.UUIDField()
    milestone_id = serializers.UUIDField(required=False)
    description = serializers.CharField(max_length=500)


class PaymentHistorySerializer(serializers.Serializer):
    """Serializer for payment history"""
    
    id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()
    project_title = serializers.CharField()
    recipient_name = serializers.CharField()
    created_at = serializers.DateTimeField()
    processed_at = serializers.DateTimeField()


class EscrowReleaseSerializer(serializers.Serializer):
    """Serializer for escrow release"""
    
    project_id = serializers.UUIDField()
    milestone_id = serializers.UUIDField(required=False)
    release_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    release_reason = serializers.CharField(max_length=500)