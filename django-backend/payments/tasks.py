"""
Celery tasks for payment processing
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging
from .services import (
    PaymentProcessingService, PaymentDelayService, 
    PaymentReconciliationService
)
from .models import Payment, Milestone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_milestone_payment_async(self, milestone_id):
    """
    Asynchronously process milestone payment
    """
    try:
        milestone = Milestone.objects.get(id=milestone_id)
        payment_service = PaymentProcessingService()
        
        result = payment_service.process_milestone_payment(milestone)
        
        if result['success']:
            logger.info(f"Milestone payment processed successfully: {milestone_id}")
            return {
                'success': True,
                'milestone_id': milestone_id,
                'total_amount': float(result['total_amount']),
                'payments_count': len(result['payments'])
            }
        else:
            logger.error(f"Milestone payment failed: {milestone_id} - {result['error']}")
            return {
                'success': False,
                'milestone_id': milestone_id,
                'error': result['error']
            }
            
    except Milestone.DoesNotExist:
        logger.error(f"Milestone not found: {milestone_id}")
        return {
            'success': False,
            'milestone_id': milestone_id,
            'error': 'Milestone not found'
        }
    except Exception as e:
        logger.error(f"Error processing milestone payment {milestone_id}: {str(e)}")
        
        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return {
            'success': False,
            'milestone_id': milestone_id,
            'error': str(e)
        }


@shared_task
def check_overdue_payments_periodic():
    """
    Periodic task to check for overdue payments
    """
    try:
        delay_service = PaymentDelayService()
        delay_service.check_overdue_payments()
        
        logger.info("Periodic overdue payment check completed")
        return {'success': True, 'message': 'Overdue payment check completed'}
        
    except Exception as e:
        logger.error(f"Error in periodic overdue payment check: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def reconcile_gateway_payments_periodic(gateway_type='all'):
    """
    Periodic task to reconcile payments with gateways
    """
    try:
        reconciliation_service = PaymentReconciliationService()
        
        gateways = ['stripe', 'paypal'] if gateway_type == 'all' else [gateway_type]
        results = {}
        
        for gateway in gateways:
            try:
                result = reconciliation_service.reconcile_gateway_transactions(gateway)
                results[gateway] = result
                logger.info(f"Gateway reconciliation completed for {gateway}")
            except Exception as e:
                logger.error(f"Error reconciling {gateway}: {str(e)}")
                results[gateway] = {'success': False, 'error': str(e)}
        
        return {
            'success': True,
            'results': results,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in periodic gateway reconciliation: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=3)
def retry_failed_payments(self):
    """
    Retry failed payments that might be recoverable
    """
    try:
        # Get failed payments from the last 24 hours
        failed_payments = Payment.objects.filter(
            status='failed',
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        
        retry_results = []
        payment_service = PaymentProcessingService()
        
        for payment in failed_payments:
            try:
                # Get the appropriate gateway service
                gateway_service = payment_service.get_gateway_service(
                    payment.payment_gateway.gateway_type
                )
                
                # Retry the payment
                result = gateway_service.process_payment(payment)
                
                retry_results.append({
                    'payment_id': str(payment.id),
                    'success': result['success'],
                    'error': result.get('error')
                })
                
                if result['success']:
                    logger.info(f"Payment retry successful: {payment.id}")
                else:
                    logger.warning(f"Payment retry failed: {payment.id} - {result.get('error')}")
                    
            except Exception as e:
                logger.error(f"Error retrying payment {payment.id}: {str(e)}")
                retry_results.append({
                    'payment_id': str(payment.id),
                    'success': False,
                    'error': str(e)
                })
        
        successful_retries = len([r for r in retry_results if r['success']])
        
        return {
            'success': True,
            'total_retries': len(retry_results),
            'successful_retries': successful_retries,
            'results': retry_results
        }
        
    except Exception as e:
        logger.error(f"Error in retry failed payments task: {str(e)}")
        
        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300)  # Retry after 5 minutes
        
        return {'success': False, 'error': str(e)}


@shared_task
def update_payment_gateway_metrics():
    """
    Update payment gateway performance metrics
    """
    try:
        from .models import PaymentGateway
        from django.db.models import Avg, Count, Q
        
        gateways = PaymentGateway.objects.filter(status='active')
        
        for gateway in gateways:
            # Calculate success rate
            total_payments = Payment.objects.filter(
                payment_gateway=gateway,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            successful_payments = Payment.objects.filter(
                payment_gateway=gateway,
                status='completed',
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
            
            # Calculate average processing time
            completed_payments = Payment.objects.filter(
                payment_gateway=gateway,
                status='completed',
                processed_at__isnull=False,
                created_at__gte=timezone.now() - timedelta(days=30)
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
            
            # Update gateway metrics
            gateway.success_rate = success_rate
            gateway.average_processing_time = int(avg_processing_time)
            gateway.save()
            
            logger.info(f"Updated metrics for gateway {gateway.name}: {success_rate}% success rate")
        
        return {
            'success': True,
            'gateways_updated': gateways.count(),
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating payment gateway metrics: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def generate_payment_analytics_report():
    """
    Generate payment analytics report for dashboard
    """
    try:
        from django.db.models import Sum, Count, Avg
        from datetime import datetime
        
        # Get payment statistics for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        analytics = {
            'period': {
                'start': thirty_days_ago.isoformat(),
                'end': timezone.now().isoformat()
            },
            'totals': {
                'payments': Payment.objects.filter(created_at__gte=thirty_days_ago).count(),
                'amount': Payment.objects.filter(
                    created_at__gte=thirty_days_ago,
                    status='completed'
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'platform_fees': Payment.objects.filter(
                    created_at__gte=thirty_days_ago,
                    status='completed'
                ).aggregate(total=Sum('platform_fee'))['total'] or 0
            },
            'by_status': {},
            'by_gateway': {},
            'trends': {}
        }
        
        # Payment status breakdown
        for status in ['pending', 'processing', 'completed', 'failed']:
            count = Payment.objects.filter(
                created_at__gte=thirty_days_ago,
                status=status
            ).count()
            analytics['by_status'][status] = count
        
        # Gateway breakdown
        gateway_stats = Payment.objects.filter(
            created_at__gte=thirty_days_ago
        ).values('payment_gateway__gateway_type').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        for stat in gateway_stats:
            gateway_type = stat['payment_gateway__gateway_type'] or 'unknown'
            analytics['by_gateway'][gateway_type] = {
                'count': stat['count'],
                'amount': float(stat['total_amount'] or 0)
            }
        
        logger.info("Payment analytics report generated successfully")
        
        return {
            'success': True,
            'analytics': analytics,
            'generated_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating payment analytics report: {str(e)}")
        return {'success': False, 'error': str(e)}