"""
Payment processing views and API endpoints
"""
import json
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
# from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import (
    Payment, PaymentGateway, TransactionLog, PaymentDispute, 
    PaymentMethod, Milestone
)
from .serializers import (
    PaymentSerializer, PaymentGatewaySerializer, TransactionLogSerializer,
    PaymentDisputeSerializer, PaymentMethodSerializer, MilestoneSerializer
)
from .services import (
    PaymentProcessingService, PaymentDelayService, 
    PaymentReconciliationService, WebhookService
)
from projects.models import Project

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    """Payment management ViewSet"""
    
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['status', 'payment_type', 'developer', 'milestone']
    
    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Payment.objects.all()
        elif user.role == 'client':
            # Clients can see payments for their projects
            return Payment.objects.filter(
                milestone__project__client=user
            )
        elif user.role == 'developer':
            # Developers can see their own payments
            return Payment.objects.filter(developer=user)
        
        return Payment.objects.none()
    
    @action(detail=False, methods=['post'])
    def process_milestone_payment(self, request):
        """Process payment for a completed milestone"""
        milestone_id = request.data.get('milestone_id')
        
        if not milestone_id:
            return Response(
                {'error': 'milestone_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            milestone = get_object_or_404(Milestone, id=milestone_id)
            
            # Check permissions
            if (request.user.role != 'admin' and 
                milestone.project.client != request.user):
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Process payment
            payment_service = PaymentProcessingService()
            result = payment_service.process_milestone_payment(milestone)
            
            if result['success']:
                return Response({
                    'message': 'Milestone payment processed successfully',
                    'payments': result['payments'],
                    'total_amount': result['total_amount']
                })
            else:
                return Response(
                    {'error': result['error']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error processing milestone payment: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a payment"""
        payment = self.get_object()
        refund_amount = request.data.get('amount')
        
        # Check permissions
        if (request.user.role != 'admin' and 
            payment.milestone.project.client != request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            payment_service = PaymentProcessingService()
            gateway_service = payment_service.get_gateway_service(
                payment.payment_gateway.gateway_type
            )
            
            result = gateway_service.refund_payment(
                payment, 
                Decimal(str(refund_amount)) if refund_amount else None
            )
            
            if result['success']:
                return Response({
                    'message': 'Refund processed successfully',
                    'refund_id': result['refund_id'],
                    'amount': result['amount']
                })
            else:
                return Response(
                    {'error': result['error']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """Get payment history for user"""
        user = request.user
        
        if user.role == 'developer':
            payments = Payment.objects.filter(developer=user)
        elif user.role == 'client':
            payments = Payment.objects.filter(milestone__project__client=user)
        else:
            return Response(
                {'error': 'Invalid user role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Apply date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            payments = payments.filter(created_at__gte=start_date)
        if end_date:
            payments = payments.filter(created_at__lte=end_date)
        
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """Payment gateway management ViewSet"""
    
    queryset = PaymentGateway.objects.all()
    serializer_class = PaymentGatewaySerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test payment gateway connection"""
        gateway = self.get_object()
        
        try:
            payment_service = PaymentProcessingService()
            gateway_service = payment_service.get_gateway_service(gateway.gateway_type)
            
            # Perform a test operation (like getting gateway status)
            test_result = gateway_service.get_payment_status('test_transaction')
            
            return Response({
                'gateway': gateway.name,
                'status': 'connected' if test_result else 'failed',
                'message': 'Gateway connection test completed'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Gateway connection failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """Payment method management ViewSet"""
    
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payment methods by user"""
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user when creating payment method"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set payment method as default"""
        payment_method = self.get_object()
        
        # Remove default from other methods
        PaymentMethod.objects.filter(
            user=request.user, 
            is_default=True
        ).update(is_default=False)
        
        # Set this method as default
        payment_method.is_default = True
        payment_method.save()
        
        return Response({'message': 'Payment method set as default'})
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify payment method"""
        payment_method = self.get_object()
        
        # In a real implementation, this would integrate with the payment gateway
        # to verify the account details
        payment_method.verification_status = 'verified'
        payment_method.verification_date = timezone.now()
        payment_method.status = 'verified'
        payment_method.save()
        
        return Response({'message': 'Payment method verified successfully'})


class PaymentDisputeViewSet(viewsets.ModelViewSet):
    """Payment dispute management ViewSet"""
    
    queryset = PaymentDispute.objects.all()
    serializer_class = PaymentDisputeSerializer
    permission_classes = [IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['status', 'dispute_type', 'priority']
    
    def get_queryset(self):
        """Filter disputes based on user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return PaymentDispute.objects.all()
        else:
            # Users can see disputes they're involved in
            return PaymentDispute.objects.filter(
                models.Q(initiated_by=user) | models.Q(disputed_against=user)
            )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a payment dispute"""
        dispute = self.get_object()
        
        # Only admins can resolve disputes
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can resolve disputes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        resolution_type = request.data.get('resolution_type')  # 'client', 'developer', 'partial'
        resolution_amount = request.data.get('resolution_amount')
        resolution_summary = request.data.get('resolution_summary')
        
        if resolution_type == 'client':
            dispute.status = 'resolved_client'
        elif resolution_type == 'developer':
            dispute.status = 'resolved_developer'
        elif resolution_type == 'partial':
            dispute.status = 'resolved_partial'
            dispute.resolution_amount = Decimal(str(resolution_amount))
        
        dispute.resolution_summary = resolution_summary
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        return Response({'message': 'Dispute resolved successfully'})


class TransactionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Transaction log ViewSet (read-only)"""
    
    queryset = TransactionLog.objects.all()
    serializer_class = TransactionLogSerializer
    permission_classes = [IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['log_type', 'log_level', 'payment']
    
    def get_queryset(self):
        """Filter transaction logs based on user permissions"""
        user = self.request.user
        
        if user.role == 'admin':
            return TransactionLog.objects.all()
        elif user.role == 'client':
            return TransactionLog.objects.filter(
                payment__milestone__project__client=user
            )
        elif user.role == 'developer':
            return TransactionLog.objects.filter(
                payment__developer=user
            )
        
        return TransactionLog.objects.none()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def payment_reconciliation_report(request):
    """Generate payment reconciliation report"""
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = datetime.fromisoformat(start_date)
        end_date = datetime.fromisoformat(end_date)
        
        reconciliation_service = PaymentReconciliationService()
        report = reconciliation_service.generate_payment_report(start_date, end_date)
        
        return Response(report)
        
    except Exception as e:
        logger.error(f"Error generating reconciliation report: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reconcile_gateway_transactions(request):
    """Reconcile transactions with payment gateway"""
    gateway_type = request.data.get('gateway_type')
    
    if not gateway_type:
        return Response(
            {'error': 'gateway_type is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        reconciliation_service = PaymentReconciliationService()
        result = reconciliation_service.reconcile_gateway_transactions(gateway_type)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error reconciling gateway transactions: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def check_overdue_payments(request):
    """Check for overdue payments and pause projects"""
    try:
        dry_run = request.data.get('dry_run', False)
        
        delay_service = PaymentDelayService()
        results = delay_service.check_overdue_payments(dry_run=dry_run)
        
        return Response({
            'message': 'Overdue payment check completed',
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error checking overdue payments: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        return HttpResponse(status=400)
    
    try:
        webhook_service = WebhookService()
        result = webhook_service.handle_stripe_webhook(
            json.loads(payload.decode('utf-8')), 
            sig_header
        )
        
        if result['success']:
            return HttpResponse(status=200)
        else:
            logger.error(f"Stripe webhook error: {result['error']}")
            return HttpResponse(status=400)
            
    except Exception as e:
        logger.error(f"Stripe webhook processing error: {str(e)}")
        return HttpResponse(status=400)


@csrf_exempt
@require_http_methods(["POST"])
def paypal_webhook(request):
    """Handle PayPal webhook events"""
    payload = request.body
    headers = dict(request.META)
    
    try:
        webhook_service = WebhookService()
        result = webhook_service.handle_paypal_webhook(
            json.loads(payload.decode('utf-8')), 
            headers
        )
        
        if result['success']:
            return HttpResponse(status=200)
        else:
            logger.error(f"PayPal webhook error: {result['error']}")
            return HttpResponse(status=400)
        
    except Exception as e:
        logger.error(f"PayPal webhook processing error: {str(e)}")
        return HttpResponse(status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_dashboard(request):
    """Get payment dashboard data for user"""
    user = request.user
    
    try:
        if user.role == 'developer':
            # Developer payment dashboard
            payments = Payment.objects.filter(developer=user)
            
            dashboard_data = {
                'total_earnings': sum(p.net_amount for p in payments if p.status == 'completed'),
                'pending_payments': payments.filter(status__in=['pending', 'processing']).count(),
                'completed_payments': payments.filter(status='completed').count(),
                'recent_payments': PaymentSerializer(
                    payments.order_by('-created_at')[:5], 
                    many=True
                ).data,
                'monthly_earnings': _calculate_monthly_earnings(payments)
            }
            
        elif user.role == 'client':
            # Client payment dashboard
            payments = Payment.objects.filter(milestone__project__client=user)
            
            dashboard_data = {
                'total_spent': sum(p.amount for p in payments if p.status == 'completed'),
                'pending_payments': payments.filter(status__in=['pending', 'processing']).count(),
                'completed_payments': payments.filter(status='completed').count(),
                'recent_payments': PaymentSerializer(
                    payments.order_by('-created_at')[:5], 
                    many=True
                ).data,
                'monthly_spending': _calculate_monthly_spending(payments)
            }
            
        else:
            return Response(
                {'error': 'Invalid user role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(dashboard_data)
        
    except Exception as e:
        logger.error(f"Error generating payment dashboard: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _calculate_monthly_earnings(payments):
    """Calculate monthly earnings for developer"""
    monthly_data = {}
    
    for payment in payments.filter(status='completed'):
        month_key = payment.processed_at.strftime('%Y-%m') if payment.processed_at else payment.created_at.strftime('%Y-%m')
        
        if month_key not in monthly_data:
            monthly_data[month_key] = 0
        
        monthly_data[month_key] += float(payment.net_amount)
    
    return monthly_data


def _calculate_monthly_spending(payments):
    """Calculate monthly spending for client"""
    monthly_data = {}
    
    for payment in payments.filter(status='completed'):
        month_key = payment.processed_at.strftime('%Y-%m') if payment.processed_at else payment.created_at.strftime('%Y-%m')
        
        if month_key not in monthly_data:
            monthly_data[month_key] = 0
        
        monthly_data[month_key] += float(payment.amount)
    
    return monthly_data

@api_view(['POST'])
@permission_classes([IsAdminUser])
def process_batch_payments(request):
    """Process multiple payments in batch"""
    payment_ids = request.data.get('payment_ids', [])
    
    if not payment_ids:
        return Response(
            {'error': 'payment_ids is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        payment_service = PaymentProcessingService()
        result = payment_service.process_batch_payments(payment_ids)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error processing batch payments: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_automatic_payments(request):
    """Schedule automatic payments for project milestones"""
    project_id = request.data.get('project_id')
    
    if not project_id:
        return Response(
            {'error': 'project_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check permissions
        project = get_object_or_404(Project, id=project_id)
        if (request.user.role != 'admin' and 
            project.client != request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment_service = PaymentProcessingService()
        result = payment_service.schedule_automatic_payments(project_id)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error scheduling automatic payments: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resume_project_after_payment(request):
    """Resume project after payment is received"""
    project_id = request.data.get('project_id')
    
    if not project_id:
        return Response(
            {'error': 'project_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        delay_service = PaymentDelayService()
        result = delay_service.resume_project_after_payment(project_id)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error resuming project: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def payment_analytics(request):
    """Get comprehensive payment analytics"""
    try:
        from .tasks import generate_payment_analytics_report
        
        # Generate analytics report
        result = generate_payment_analytics_report.delay()
        
        # For immediate response, generate basic analytics
        from django.db.models import Sum, Count, Avg
        from datetime import datetime, timedelta
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        basic_analytics = {
            'recent_activity': {
                'total_payments_30d': Payment.objects.filter(
                    created_at__gte=thirty_days_ago
                ).count(),
                'total_amount_30d': float(
                    Payment.objects.filter(
                        created_at__gte=thirty_days_ago,
                        status='completed'
                    ).aggregate(total=Sum('amount'))['total'] or 0
                ),
                'success_rate_30d': 0,
                'average_processing_time': 0
            },
            'task_id': result.id
        }
        
        # Calculate success rate
        total_payments = Payment.objects.filter(created_at__gte=thirty_days_ago).count()
        successful_payments = Payment.objects.filter(
            created_at__gte=thirty_days_ago,
            status='completed'
        ).count()
        
        if total_payments > 0:
            basic_analytics['recent_activity']['success_rate_30d'] = (
                successful_payments / total_payments * 100
            )
        
        return Response(basic_analytics)
        
    except Exception as e:
        logger.error(f"Error generating payment analytics: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status_check(request):
    """Check status of specific payment"""
    payment_id = request.query_params.get('payment_id')
    
    if not payment_id:
        return Response(
            {'error': 'payment_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check permissions
        user = request.user
        if (user.role != 'admin' and 
            payment.developer != user and 
            payment.milestone.project.client != user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get latest status from gateway if transaction exists
        gateway_status = None
        if payment.transaction_id and payment.payment_gateway:
            try:
                payment_service = PaymentProcessingService()
                gateway_service = payment_service.get_gateway_service(
                    payment.payment_gateway.gateway_type
                )
                gateway_status = gateway_service.get_payment_status(payment.transaction_id)
            except Exception as e:
                logger.warning(f"Could not fetch gateway status: {str(e)}")
        
        response_data = {
            'payment_id': str(payment.id),
            'status': payment.status,
            'amount': float(payment.amount),
            'net_amount': float(payment.net_amount),
            'created_at': payment.created_at.isoformat(),
            'processed_at': payment.processed_at.isoformat() if payment.processed_at else None,
            'gateway_status': gateway_status,
            'transaction_id': payment.transaction_id
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_failed_payment(request):
    """Retry a failed payment"""
    payment_id = request.data.get('payment_id')
    
    if not payment_id:
        return Response(
            {'error': 'payment_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check permissions
        user = request.user
        if (user.role != 'admin' and 
            payment.milestone.project.client != user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if payment can be retried
        if payment.status not in ['failed', 'cancelled']:
            return Response(
                {'error': 'Payment cannot be retried'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retry payment
        payment_service = PaymentProcessingService()
        gateway_service = payment_service.get_gateway_service(
            payment.payment_gateway.gateway_type
        )
        
        # Reset payment status
        payment.status = 'pending'
        payment.save()
        
        result = gateway_service.process_payment(payment)
        
        return Response({
            'success': result['success'],
            'message': 'Payment retry initiated' if result['success'] else 'Payment retry failed',
            'transaction_id': result.get('transaction_id'),
            'error': result.get('error')
        })
        
    except Exception as e:
        logger.error(f"Error retrying payment: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def gateway_performance_metrics(request):
    """Get payment gateway performance metrics"""
    try:
        gateways = PaymentGateway.objects.filter(status='active')
        metrics = []
        
        for gateway in gateways:
            # Get recent payments for this gateway
            recent_payments = Payment.objects.filter(
                payment_gateway=gateway,
                created_at__gte=timezone.now() - timedelta(days=30)
            )
            
            total_payments = recent_payments.count()
            successful_payments = recent_payments.filter(status='completed').count()
            failed_payments = recent_payments.filter(status='failed').count()
            
            success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
            
            # Calculate average processing time
            completed_payments = recent_payments.filter(
                status='completed',
                processed_at__isnull=False
            )
            
            avg_processing_time = 0
            if completed_payments.exists():
                processing_times = []
                for payment in completed_payments:
                    if payment.processed_at and payment.created_at:
                        processing_time = (payment.processed_at - payment.created_at).total_seconds()
                        processing_times.append(processing_time)
                
                if processing_times:
                    avg_processing_time = sum(processing_times) / len(processing_times)
            
            metrics.append({
                'gateway_name': gateway.name,
                'gateway_type': gateway.gateway_type,
                'total_payments': total_payments,
                'successful_payments': successful_payments,
                'failed_payments': failed_payments,
                'success_rate': round(success_rate, 2),
                'average_processing_time_seconds': round(avg_processing_time, 2),
                'total_amount_processed': float(
                    recent_payments.filter(status='completed').aggregate(
                        total=Sum('amount')
                    )['total'] or 0
                ),
                'total_fees_collected': float(
                    recent_payments.filter(status='completed').aggregate(
                        total=Sum('gateway_fee')
                    )['total'] or 0
                )
            })
        
        return Response({
            'period': '30 days',
            'gateways': metrics,
            'generated_at': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating gateway metrics: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )